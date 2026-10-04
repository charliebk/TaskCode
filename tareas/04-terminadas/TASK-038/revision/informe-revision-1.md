# Informe de revision — TASK-038 (ronda 1)

- Commit revisado: 3bca7ef59111f62f400a6b66470690bbdeed3fe8
- Revisor: code-quality-reviewer (agente independiente, clon temporal de la rama)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh:98,112,117 |
| MEN-1 | MENOR | abierto | scripts/gitflow/start-work.sh:17, create-hotfix.sh:23, update-hotfix.sh:25, merge-hotfix-to-main.sh:25, merge-release-to-main.sh:25 |
| MEN-2 | MENOR | abierto | test/gitflow/origin-deteccion.test.ts:73 |
| MEN-3 | MENOR | abierto | scripts/gitflow/recover-branch.sh:52 (y el resto de `_gf_ls_remote ... \| grep -q`) |
| MEN-4 | MENOR | abierto | scripts/gitflow/_gitflow-common.sh:253 |

## Evidencia general

- Clon temporal de `feature/task-038-...` (HEAD 0617a70, codigo en 3bca7ef), `npm install && npm run build`.
- `npm test` completo, una vez: **912 tests, 909 pass, 3 fail**. Son los 3 conocidos de Windows
  (`approve` #119 EPERM, `plan` #281 y #287). No hubo EBUSY. Ningun rojo nuevo.
- Mutantes sobre `_gitflow-common.sh` (con perl, conservando CRLF), cada uno contra
  `timeout 400 node --test dist/test/gitflow/origin-deteccion.test.js`:
  - M1, `_gf_ls_remote` sin `timeout` (`if false`): **muerto** (test 1, 23,5 s frente al limite de 20 s; ver MEN-2).
  - M2, sin la cache `GF_ORIGIN_DETECTADO`: **muerto** (test 2).
  - M3, consultar la red aunque no haya origin configurado: **muerto** (test 3).
  - M4, sin el aviso del merge a develop: **muerto** (test 4).

## IMP-1 — Mirror: el timeout convierte un remoto lento en "nada que borrar" y luego lo borra

En `push-back-to-remote.sh` las consultas de las secciones 5 y 5b (las divergencias y las ramas
y tags que solo estan en el destino) pasan ahora por `_gf_ls_remote`, sin comprobar el codigo de
salida. Si una de ellas pasa del limite (codigo 124), su salida queda vacia y el preview de un
`push --mirror` dice en verde "No hay ramas exclusivas en destino — nada que borrar". Tras la
doble confirmacion, el push las borra. Antes, un remoto lento pero vivo solo tardaba mas y el
preview salia bien. Para que pase basta con que la comprobacion de conectividad (paso 3) responda
en menos de 5 s y una consulta posterior no. Es lo esperable con latencia variable por VPN, o
cuando `--tags` de un repo con muchos tags tarda mas que `--heads` (con el protocolo v2 cada
consulta solo lista sus refs). Es un borrado irreversible en el remoto corporativo con un
preview que dice lo contrario. No lo marco CRITICO porque hace falta un pico de latencia en esa
ventana concreta. El codigo previo ya tenia el mismo defecto latente con errores de red (salida
ignorada); este cambio lo extiende a "remoto lento".

Reproduccion (`repro-mirror.sh`, repos reales). Un destino bare tiene la rama exclusiva
`solo-destino`. `remote.dest.uploadpack` es un wrapper que tarda 3 s a partir de su 4.ª llamada.
Se lanza con `GF_TIMEOUT_REMOTO=2` y la entrada `s` + `BORRAR Y SUSTITUIR`:

```
=== RAMA TASK-038
[OK   ] Conexion con 'dest' verificada.
  No hay ramas exclusivas en destino — nada que borrar en ese plano.
     - [deleted]         solo-destino
--- ramas en destino tras el mirror: main
=== DEVELOP (base, mismos repos y wrapper)
[OK   ] Conexion con 'dest' verificada.
  Ramas que EXISTEN solo en destino y se BORRARAN (1):
    - solo-destino
```

Correccion sugerida: en 5 y 5b, distinguir un fallo de la consulta de "no esta". Si cualquier
`_gf_ls_remote` falla, abortar el modo mirror y avisar en el aditivo. Otra opcion es no limitar
el tiempo de estas consultas de preview, porque son interactivas y ya se comprobo la conexion.

## MEN-1 — Cinco scripts siguen consultando origin dos veces (unos 10-12 s con origin caido)

`resolve_main_branch` se llama **antes** de `detect_origin_available` en `start-work`,
`create-hotfix`, `update-hotfix`, `merge-hotfix-to-main` y `merge-release-to-main`. En ese
momento la cache esta vacia, asi que la funcion consulta (y espera el limite) y despues `detect`
vuelve a consultar. Medido con `GIT_TRACE2_EVENT` y origin en TEST-NET-1, limite por defecto:

```
start-work.sh    origin muerto: 12422 ms, ls-remote=2
update-hotfix.sh origin muerto: 12095 ms, ls-remote=2
```

Mejora mucho lo que habia (3 consultas de unos 21 s), pero no cumple "una sola consulta por
invocacion" del Resultado ni el "< 10 s" del criterio 4 en los caminos hotfix y release de
`taskctl start/review/finish`. El test solo mide `update-feature`. Correccion trivial: llamar a
`detect_origin_available` antes de `resolve_main_branch` en esos scripts, que ya reaprovecha la
cache.

## MEN-2 — El test de tiempo usa 20 s, no los 10 s del criterio

`assert.ok(ms < 20000)`. Sin timeout (M1), en esta maquina tarda 23,5 s, asi que el mutante muere
por 3,5 s de margen, que dependen del timeout TCP del sistema. Con `GF_TIMEOUT_REMOTO=2` el
script real tarda unos 5-6 s, asi que el umbral de 10 s del criterio cabe y mata a M1 con holgura.

## MEN-3 — El codigo 124 se trata como "la rama no existe en origin"

En todos los `_gf_ls_remote ... | grep -q` (no hay `set -o pipefail` en ningun script; el SIGPIPE
no afecta), un timeout con `REMOTE_AVAILABLE=true` se lee como "no esta la rama". Ninguno pierde
datos: en `create-develop` o `invoke_create_work_branch` el push posterior choca con un
non-fast-forward o no hace nada. Pero `recover-branch.sh:52` dice "La rama 'X' no existe en
origin. No hay nada que recuperar." cuando lo que ha pasado es que la red ha tardado. Mensaje
engañoso.

## MEN-4 — `GF_TIMEOUT_REMOTO` no se valida

Con `GF_TIMEOUT_REMOTO=abc`, `timeout` sale con 125 ("invalid time interval") en cada consulta y
todo pasa a modo local con el aviso de "VPN/credenciales/red". Es un caso de borde, porque la
variable la pone el usuario a mano.

## Verificado sin hallazgo

1. **Sustitucion en 15 scripts.** `push-back-to-remote` usa `$TARGET_REMOTE` y la funcion pasa
   `"$@"` tal cual, asi que funciona con remotos distintos de origin (ademas de IMP-1). Ningun
   script usa `pipefail`.
2. **Cache.** `switch-working-remote` y `mirror-to-remote` no llaman a `detect_origin_available`
   (usan `_gf_ls_remote` directo), asi que el cambio de origin a mitad no ve una cache vieja.
   `GF_ORIGIN_DETECTADO` no se exporta y `_gitflow-common.sh` la pone a `false` al cargarse, asi
   que un script hijo vuelve a detectar.
3. **`resolve_main_branch` dentro de `$(...)`.** La subshell hereda la cache. Probado: con origin
   muerto, la llamada posterior a `detect` tarda 0 s y devuelve `master` (la rama local). Con
   origin vivo (main remota, master local) devuelve `main` antes y despues. Sin origin devuelve
   `master` antes y despues.
4. **`timeout --version`.** En Git Bash es `/usr/bin/timeout` (coreutils 8.32), y se usa la
   variante con limite. Si se pone el `timeout.exe` de cmd delante en el PATH, `--version` sale
   con 1 y se elige la variante sin limite, que es lo correcto. Despues del 124 no quedan
   procesos `git-remote-http` huerfanos (comprobado con `tasklist`). En macOS sin coreutils se
   consulta sin limite, como antes (no se prueba `gtimeout`; esta documentado).
5. **Divergencia en develop (avisar en vez de abortar).** Es razonable. En develop la conducta
   anterior ya era hacer el merge local con el aviso generico. Ahora el aviso es explicito. Sin
   red no hay push, y el unico riesgo es un non-fast-forward al volver la red, que obliga a hacer
   pull y merge, sin perder nada. En main si se aborta por el tag. No es un riesgo real.

Observacion, no hallazgo: `GIT_TERMINAL_PROMPT=0` y el limite de 5 s impiden la autenticacion
interactiva durante la deteccion (pedir la contraseña https, o un login de GCM que tarde mas de
5 s). Es el objetivo declarado de la tarea y el aviso ya menciona "credenciales".
