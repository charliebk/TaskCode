# Plan — TASK-077: Guardian de merges: opciones con valor antes de -c y doc de bash -c

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

- El cambio vive solo en `src/core/comando-merge.ts`; `guardia-merge` llama a `analizarComando` y no se toca (sigue leyendo `OperacionMerge[]`).
- El defecto no esta solo en `textoDeShell`: el bucle que busca el script de cierre salta los `-` igual, asi que `bash -o pipefail scripts/merge-feature-to-develop.sh x` tomaria `pipefail` como script. Se arregla en un solo sitio para que «donde acaban las opciones de bash» tenga una regla.
- Constante interna `SHELL_CON_VALOR = new Set(['-o', '+o', '-O', '+O', '--rcfile', '--init-file'])`, precedente de `GLOBALES_CON_VALOR` / `MERGE_CON_VALOR`.
- Helper interno `opcionesDeShell(seg): { fin: number; conC: boolean }`: recorre desde 1; es opcion todo token que empiece por `-` o `+`; si esta en `SHELL_CON_VALOR` salta tambien su valor; para en `--` (que consume) o en el primer no-opcion. `conC` cuando ve `-c` o un grupo corto con `c` (`-lc`, `-ec`).
- `textoDeShell` (shells): si `conC`, devuelve `seg[fin]` (el primer no-opcion, como bash); si no, null.
- Deteccion del script: `iScript = opcionesDeShell(seg).fin`.
- Ramas de `pwsh` y `cmd` sin cambios (ya buscan su marcador con `findIndex`).
- Una sola pasada lineal, mismo coste.
- Orden: constante y helper; `textoDeShell`; bucle del script; tests; README y CHANGELOG.
- Documentacion: README del plugin, seccion «Guardian de merges», viñeta tras la primera: el texto de `bash|sh|zsh|dash [opciones] -c "…"`, `pwsh|powershell -Command …` y `cmd /c|/k …` se analiza igual. `CHANGELOG.md`, parrafo de TASK-072 en «Sin publicar»: la misma frase.
- Descartado: un `if` local en `textoDeShell` para `-o`/`--rcfile` dejando el bucle del script como esta (dos reglas para lo mismo y el fallo vivo en los scripts).

## Lo que el rol no cubrio

- Casos raros de bash: grupos cortos que acaban en opcion con valor (`-eo pipefail`, `-oc`), `bash -c -x "…"`, `+O` sin valor, largas como `--norc`. El helper fija una regla para cada uno; no se exploro donde se rompe (rol de riesgos no lanzado).
- Diseño detallado de tests: solo los casos minimos que salen de los criterios.
- Reglas de dominio: no hay; es sintaxis de shell.
- Criterio 4 sin verificar todavia.

## Riesgos aceptados y que los contiene

- Lista cerrada: una opcion con valor que no este en `SHELL_CON_VALOR` (p. ej. de zsh o dash) vuelve a esquivar el guardian. Lo contiene que es una defensa contra despistes y la red de verdad es la puerta de `finish`.
- Cambio de «token tras `-c`» a «primer no-opcion»: varia si hay opciones entre `-c` y el texto. Encaja con bash real; se fija con test.

## Plan de pruebas

En `test/hooks/guardia-merge.test.ts`, test nuevo MEN-4 (TASK-077):
- `bash -o pipefail -c "git merge x"`, `bash +o pipefail -c …`, `bash -O extglob -c …`, `bash --rcfile f -c …`, `bash --init-file f -c …` devuelven el merge de `x`.
- `bash -c -x "git merge x"` devuelve el merge de `x` (primer no-opcion).
- `bash -x scripts/merge-feature-to-develop.sh feature/x` (ya existe) y `bash scripts/merge-feature-to-develop.sh feature/x` siguen dando el script de cierre.
- `bash -o pipefail scripts/merge-fix-to-develop.sh fix/y` da el script de cierre con fuente `fix/y`.
- Al cerrar, `npm test` completo.

## Lo que necesita decision de una persona

Decisiones de Carlos (2026-11-04):
- Alcance: **se arreglan los dos** (`-c` y la deteccion de scripts) con el mismo helper.
- Texto de `-c`: **el primer argumento que no es opcion**, como bash.
- Criterio 4: la referencia son los **5 rojos conocidos de Windows de hoy** (los 3 de `CLAUDE.md` mas las 2 contrapruebas de descubrimiento de TASK-075); los `EBUSY` intermitentes de teardown tampoco cuentan.
- Plan aprobado por Carlos.
