---
id: TASK-077
titulo: "Guardian de merges: opciones con valor antes de -c y doc de bash -c"
tipo: fix
sprint: 0
etiquetas: [hooks]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-077-guardian-de-merges-opciones-con-valor-an
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 134631
tokens_implementacion: null
tokens_revision: 1150931
creado: 2026-11-04
actualizado: 2026-11-04
dependencias: []
---
## Objetivo

Cerrar lo que quedo abierto de TASK-072: que bash -o pipefail -c y bash --rcfile f -c no esquiven el guardian de merges (MEN-4), y documentar que el guardian analiza el texto de bash -c, pwsh -Command y cmd /c.

## Criterios de aceptacion
- [x] analizarComando('bash -o pipefail -c "git merge x"') y analizarComando('bash --rcfile f -c "git merge x"') devuelven el merge de x; tambien +o, --init-file y -O
- [x] bash -x script.sh rama y bash script.sh rama siguen detectandose como script de cierre, con test en test/hooks/guardia-merge.test.ts
- [x] README del plugin y CHANGELOG.md dicen que el guardian analiza el texto de bash -c, pwsh -Command y cmd /c
- [x] npm test en verde salvo los 5 rojos conocidos de Windows

## Resultado

Cierra lo que quedo abierto de TASK-072 (MEN-4 de su ronda 2 y la nota de documentacion).

Implementado (`src/core/comando-merge.ts`):
- Helper interno `opcionesDeShell`: una sola regla para «donde acaban las opciones» de
  `bash|sh|zsh|dash`, que usan `textoDeShell` (forma `-c`) y la deteccion del script de cierre.
  Salta el valor de `--rcfile` e `--init-file` y un valor por cada `o`/`O` de un grupo corto
  (`-o pipefail`, `+o x`, `-O extglob`, `-eo x`, `-oc x`); `--` las termina; `conC` solo con `-`
  (`+c` no es la forma `-c`).
- Con `-c`, el texto es el primer argumento que no es opcion, como bash (`bash -c -x "..."`).
- README del plugin y CHANGELOG: el guardian analiza el texto de `bash -c`, `pwsh -Command` y `cmd /c`.

Decisiones de Carlos en el plan: arreglar tambien la deteccion del script con el mismo helper;
texto de `-c` = primer no-opcion; referencia del criterio 4 = los 5 rojos conocidos de Windows.

Riesgo aceptado: la lista de opciones con valor es cerrada (una de zsh o dash fuera de ella vuelve a
esquivar el guardian); la red de verdad sigue siendo la puerta de `finish`.

Verificacion:
- Suite completa 1759/1764: los 5 rojos conocidos de Windows. (En la pasada anterior salio ademas el
  intermitente de `origin-deteccion`, TASK-038; aislado paso 3/3.)
- `guardia-merge.test.js` 16/16 con el test MEN-4 (TASK-077).

Revision por pares, 2 rondas:
- Ronda 1 (el revisor propuso `aprobada-con-correcciones`; registrada `cambios-solicitados` para
  cerrar sin pendientes): MEN-1 (`bash -oc pipefail "..."` esquivaba: solo se saltaba valor si el
  grupo acababa en `o`/`O`) y MEN-2 (mutante superviviente: `+c` contado como `-c`). Corregidos.
- Ronda 2 (`aprobada`): ambos verificados, 3 mutantes muertos, sin hallazgos nuevos.

Coste de implementacion sin registrar: la hizo el orquestador sin subagentes.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-04T20:33:52Z | plan | automatico | persona |
| 2026-11-04T20:36:25Z | approve | automatico | persona |
| 2026-11-04T20:36:27Z | start | automatico | persona |
| 2026-11-04T20:53:50Z | review | automatico | persona |
| 2026-11-04T21:15:31Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-04T20:36:23Z | diseno | agente:aa7b581a794b448a0 | 14 | 23579 | 105958 | 5080 | 11 | 134631 |
| 2026-11-04T20:58:54Z | revision | agente:a2d8a67ed2d3da8f1 | 14 | 95810 | 531537 | 5599 | 3 | 632960 |
| 2026-11-04T21:19:12Z | revision | agente:aff847a5ca3df6a43 | 12 | 90829 | 423845 | 3285 | 0 | 517971 |
