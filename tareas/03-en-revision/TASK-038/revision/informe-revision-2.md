# Informe de revision — TASK-038 (ronda 2)

- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| R2-MEN-1 | MENOR | abierto (no bloquea) | test/gitflow/origin-deteccion.test.ts (falta el test de la lista de tags) |
| R2-MEN-2 | MENOR | abierto (no bloquea) | test/gitflow/ (ningun test fija el orden detect -> resolve de MEN-1) |
| R2-MEN-3 | MENOR | aceptado, no se corrige | scripts/gitflow/push-back-to-remote.sh:107 (el `.` del nombre de rama se lee como comodin de regex) |

Estado de los hallazgos de la ronda 1:

| ID r1 | Estado | Evidencia |
|---|---|---|
| IMP-1 | cerrado | Mutante M1 muerto por el test nuevo; repro propia de tags (abajo) |
| MEN-1 | cerrado | `start-work.sh` con origin lento: 1 consulta (mutante: 2) |
| MEN-2 | cerrado | Umbral de 12 s; la suite de gitflow pasa |
| MEN-3 | no se toco (fuera del delta) | — |
| MEN-4 | cerrado | `abc` y `0` pasan a 5 con aviso en stderr; `7` se respeta |

## Reproduccion

Clon temporal de la rama (HEAD 25d07cf), `npm install && npm run build`.

- `timeout 900 node --test dist/test/gitflow/*.test.js`: **45 tests, 45 pass, 0 fail** (51 s).
- Mutantes con perl, cada uno revertido despues (`git status` limpio al acabar):
  - **M1**, quitar la comprobacion de `REMOTE_HEADS_RAW` (`...; if false; then`): **muerto**. Cae el
    test nuevo "si la lista de ramas del destino expira, el mirror aborta".
  - **M2**, quitar la comprobacion de `REMOTE_TAGS_RAW`: **sobrevive** (origin-deteccion y el resto
    de gitflow en verde). Ver R2-MEN-1.
  - **M3**, volver a poner `detect_origin_available` despues de `resolve_main_branch` en
    `update-hotfix.sh`: **sobrevive** (45/45). Lo mismo en `start-work.sh`, medido con un
    `uploadpack` que cuenta llamadas y tarda 3 s (`GF_TIMEOUT_REMOTO=1`): **original 1 consulta,
    mutante 2**. La correccion funciona, pero ningun test la fija. Ver R2-MEN-2.

### Paso 5 reescrito (grep sobre la lista cacheada)

Probado con repos reales. Ramas locales `main`, `rel/1.2`, `a+b`, `x.y`, `feat` y `solo`. En el
destino: `main`, `rel/1.2`, `a+b`, `solo`, `xzy` y `z/feat`. Se compara la deteccion antigua
(`ls-remote --heads d <rama> | grep -q refs/heads/<rama>`) con la nueva:

```
a+b      antes=si ahora=si
feat     antes=no ahora=no     (z/feat no hace falso positivo: el ancla $ y el prefijo refs/heads/ bastan)
main     antes=si ahora=si
rel/1.2  antes=si ahora=si
solo     antes=si ahora=si
x.y      antes=no ahora=si     <- R2-MEN-3
```

`/` y `+` dan lo mismo (`+` es literal en BRE). El unico cambio es `.`. Git no admite `* ? [ \ ^ ~ :`
en un nombre de rama, asi que no hay mas metacaracteres posibles. El falso positivo no hace dano:
`git rev-list --count x.y..destino/x.y || echo 0` da `0`, asi que la rama no sale como divergente.
Solo seria un problema si la rama local `x.y` no existiera en el destino y `xzy` si, y en ese caso
la consecuencia es esa misma: 0, sin divergencia. No se pierde ninguna deteccion respecto a antes.
El modo mirror usa la lista entera (`sed`), no este grep, asi que el preview de borrado no cambia.

### El modo aditivo ahora aborta si la lista falla

Me parece aceptable. Si la lista expira con la conexion ya comprobada, el remoto esta lento o caido.
Antes, el aditivo seguia con las divergencias vacias: mostraba un preview sin avisos y despues el
push chocaba con un non-fast-forward. Ahora para antes de cualquier push, sin efectos en el remoto,
y el mensaje dice como seguir (reintentar o subir `GF_TIMEOUT_REMOTO`). Es mas conservador y no
destruye nada.

### Lista de tags (M2)

Repro propia: un destino con el tag `v-solo` y un `uploadpack` lento a partir de la 4.a llamada. El
original aborta con "No se pudo listar los tags de 'destino'..." y el tag sigue en el destino. Con el
mutante M2 el preview dice "No hay tags exclusivos en destino", pero el tag tambien sobrevive. El
motivo es que el paso 4 (`fetch --prune --tags`) ya ha traido `v-solo` a local, asi que despues de
un fetch correcto casi nunca hay tags "solo en destino". La comprobacion nueva es correcta y
defensiva (cubre la carrera entre el fetch y el mirror), y su impacto practico es bajo. Por eso
R2-MEN-1 es MENOR.

### Aviso de GF_TIMEOUT_REMOTO y stdout

Al cargar `_gitflow-common.sh` con `GF_TIMEOUT_REMOTO=abc` o `0`: stdout queda limpio (`T=5`) y el
aviso sale entero por stderr (`>&2`). Se emite al cargar el fichero, fuera de cualquier funcion, asi
que no puede colarse en un `$(resolve_main_branch ...)` ni en otra salida que se capture.
`gitflow-runner.ts` no interpreta stdout para estos textos.

### Orden de mensajes al mover detect_origin_available

Los tests solo usan `assert.match` y `doesNotMatch` sobre "Conexion remota disponible" y "No hay
conexion...". Ninguno usa `indexOf` ni fija el orden respecto a "Rama principal detectada". En la
salida real de `start-work` el aviso de conexion sale antes de "Rama principal detectada". Antes
tambien salia en ese orden, porque `detect` ya iba antes del `log_info`. La suite de gitflow pasa
45/45.

## Recomendacion

Aprobar. Las correcciones cierran IMP-1, MEN-1, MEN-2 y MEN-4 sin abrir nada nuevo. R2-MEN-1 y
R2-MEN-2 son huecos de test sobre codigo que funciona (verificado a mano arriba), y R2-MEN-3 es
inocuo.
