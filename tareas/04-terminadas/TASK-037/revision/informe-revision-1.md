# Informe de revision — TASK-037 (ronda 1)

- Commit revisado: 2d75306134099bfa020cd32c2ff374d743483b53
- Revisor: code-quality-reviewer (agente independiente)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/logging.test.ts:74 |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh:22 |

Sin CRITICO ni IMPORTANTE.

### MENOR-1 — El test de la caida no discrimina que `_gf_hora` use `date`
- Donde: `test/gitflow/logging.test.ts:74` (`assert.ok(r.llamadasDate > 0)`).
- Que pasa: con `GF_FORZAR_DATE=1` el test solo exige "alguna" llamada a
  `date`, y esa la aporta siempre `_gf_epoch` (via `initialize_gitflow_log` y
  `log_summary`). Si la rama de caida de `_gf_hora` pasara a usar `%(...)T`,
  el test sigue verde; en un bash 3.2 real eso romperia todas las lineas de
  log (`printf: '(': invalid format character`).
- Reproduccion: en una copia del plugin, sustituir la linea de caida por
  `_gf_hora()  { printf -v "$1" "%($2)T" -1; }` (perl, conservando CRLF) y
  correr `timeout 300 node --test dist/test/gitflow/logging.test.js` →
  `# pass 3 # fail 0` (mutante sobrevive).
- Impacto: ninguno hoy (el codigo es correcto); es una red de regresion
  floja sobre el camino de macOS, que es justo el que no se puede ejecutar
  en CI.
- Sugerencia: contar llamadas a `date` con un formato de hora (p. ej. que el
  instrumento registre `$*` y exigir una llamada con `%H:%M:%S`), o exigir
  un numero minimo que incluya la de `_do_log`.

### MENOR-2 — Con bash 4.2-4.4, un `EPOCHSECONDS` heredado del entorno se toma por bueno
- Donde: `_gitflow-common.sh:22` (`if [ -n "${EPOCHSECONDS:-}" ]`).
- Que pasa: en bash 4.x `EPOCHSECONDS` no es especial; si alguien lo
  exportara en el entorno, `_gf_epoch` devolveria un valor fijo y
  `log_summary` mostraria `DURACION : 0s`. En bash >= 5 la variable especial
  ignora el entorno (comprobado: `EPOCHSECONDS=5 bash -c 'echo $EPOCHSECONDS'`
  imprime la hora real).
- Reproduccion: **no verificado** (no hay bash 4.x en esta maquina). Caso a
  ejecutar con bash 4.4: `EPOCHSECONDS=5 bash -c 'source _gitflow-common.sh;
  _gf_epoch a; echo $a'` → se espera `5`.
- Impacto: solo una linea de duracion erronea, y solo si el entorno exporta
  esa variable, cosa que nadie hace. Se propone no corregirlo (aceptado); si
  se quiere blindar, condicionar a `BASH_VERSINFO[0] >= 5` en vez de a que
  la variable exista.

## Lo que se ejecuto

Clon temporal de la rama en el scratchpad, `npm install && npm run build`.

- **Suite completa (una vez):** `npm test` → 908 tests, 905 pass, 3 fail:
  los tres conocidos de Windows (approve: symlink `EPERM`; plan: `chmod` en
  NTFS; plan: CRLF). Ningun EBUSY. Sin linter aparte (`lint` = `tsc --noEmit`,
  cubierto por el build).
- **`logging.test.js` en una copia:** 3/3 verde.
- **Mutantes** (con perl para conservar CRLF; con `sed` de Cygwin se pierden
  los `\r` y el mutante no es limpio):
  - M1 `_do_log` vuelve a `ts=$(date ...)` → rojo (1 fail).
  - M3 `log_summary` vuelve a `end=$(date +%s)` → rojo (1 fail).
  - M4 caida de `_gf_hora` sin `date` → **sobrevive** (MENOR-1).
  - M5 `log_info` imprime otra cosa en vez de `$GF_LINE` → rojo (2 fail).
- **Portabilidad / bash 3.2 (razonado + `bash --posix -n`):** el script
  parsea limpio (`rc=0`). `"%($2)T"` es una cadena entre comillas dobles: no
  tiene ningun significado sintactico y solo se interpreta al ejecutar
  `printf`, que en 3.2 nunca ocurre porque esa rama no se define (la funcion
  se define dentro del `if`). `printf -v` existe desde bash 3.1, asi que la
  caida tambien vale en 3.2. Comprobacion de version correcta para 4.1/4.2/5.x.
- **Scope dinamico de `printf -v`:** llamador con `local ts=CALLER level=L
  message=M` que llama a `log_info` → sus locales intactos. `_gf_epoch end`
  dentro de una funcion con `local end=99` escribe en esa local (lo
  esperado). Los nombres destino (`ts`, `hoy`, `end`, `GF_START`) son locales
  de la propia funcion o globales del modulo; no hay colision.
- **Mensajes con `%` y barras:** `log_info 'a %s %d \n b\\c 100%'` y
  `log_ok 'x%y'` salen literales en pantalla y en el fichero (el mensaje va
  como argumento de `%s`, no como formato, igual que antes).
- **TZ / hora local:** `_gf_hora` coincide con `date` en la zona por defecto
  y con `TZ=UTC`, `America/New_York`, `Asia/Tokyo` (en este Cygwin sin
  tzdata las dos caen a lo mismo; coinciden en todos los casos).
- **`log_summary`:** con `GF_START` retrasado 7 s → `DURACION : 7s`. Sin
  `EPOCHSECONDS` (unset) cae a `%(%s)T` y da el mismo epoch que `date +%s`.
- **`set -euo pipefail`:** `log_warn` y `log_info` con `GF_LOG_FILE=''`
  devuelven 0 (el `return 0` de `_do_log` evita que el `&&` corto tumbe el
  script).
- **Dependencias del stdout de `_do_log`:** `grep` de `_do_log`/`GF_LINE` en
  `scripts/ src/ test/` fuera de `_gitflow-common.sh` → nada; ninguna
  captura `$(log_...)` en scripts. El unico `trap` (smoke-test) no loguea,
  asi que no hay riesgo de que un handler pise `GF_LINE` a mitad de un
  `log_*`.
