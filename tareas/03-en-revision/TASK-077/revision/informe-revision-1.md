# Informe de revision — TASK-077 (ronda 1)

- Commit revisado: 2c61fa6a53cf3429fb25721b4a17fbbdf5850960
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer, independiente de la implementacion
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-077 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/comando-merge.ts (opcionesDeShell) | plan |
| MEN-2 | MENOR | abierto | test/hooks/guardia-merge.test.ts (test MEN-4) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin CRITICO ni IMPORTANTE. El revisor propuso `aprobada-con-correcciones`; la persona pidio cerrar
sin pendientes, asi que se registra `cambios-solicitados` para corregir los dos MENOR (una linea y
un test) en la ronda 2.

## Reproduccion

Clon en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-077-r1` (borrado), build sin errores.
`guardia-merge.test.js` y `finish-verificacion.test.js`: 25/25.

Casos adversarios correctos: `bash -C -c`, `zsh -o x -c`, `bash -c -o pipefail "…"`, `bash -l -c`,
`bash -ic`, `--noprofile --norc -c`, `--login -c`, `--posix -c`, `zsh -f -c`,
`-o errexit -o pipefail -c`, `bash -c -- "…"`, `bash -c "git merge x" name`, `sh -c`,
`bash -c "…" -o`; scripts: `bash +x scripts/merge-feature-to-develop.sh feature/x` y
`bash -o pipefail -- scripts/merge-fix-to-develop.sh fix/y`. Sin falsos positivos: `bash -s "git merge x"`,
`bash -o -c "…"`, `bash -O -c "…"`, `bash --rcfile` y `bash -o` sueltos dan `[]` sin lanzar.

### MEN-1 — `bash -oc pipefail "git merge x"` esquiva el guardian

Devuelve `[]`, y bash real ejecuta el texto. `opcionesDeShell` solo salta un valor si el grupo corto
ACABA en `o`/`O`; bash consume un valor por cada `o`/`O` del grupo, este donde este. No es regresion.
Arreglo: saltar un valor por cada `o`/`O` del grupo.

### MEN-2 — un mutante sobrevive: `+c` contado como `-c`

Mutantes: anular el salto de `--rcfile`/`--init-file` (1 rojo), anular el salto por `o`/`O` (1 rojo),
`--` sin consumir (1 rojo), contar `c` tambien en `+…` (sobrevive, 16/16). Falta un test que fije
que `bash +c script` no es la forma `-c`.

README y CHANGELOG describen lo implementado; sin duplicacion entre `textoDeShell` y la deteccion
del script; diff acotado.
