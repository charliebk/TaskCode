---
id: TASK-056
titulo: "Flujo B: nucleo determinista del siguiente paso y registro de transiciones"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-056-flujo-b-nucleo-determinista-del-siguient
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Parte de TASK-055 (su plan-final es el diseno de referencia). El CLI decide que fase toca y si hay que preguntar; el agente solo ejecuta. Sin esta pieza las fases guiadas no tienen de que leer.

## Criterios de aceptacion
- [x] Clave `modo_flujo` en `.taskcode/config.yml` (`manual`, `semiautomatico`, `automatico`): sin clave vale `manual` y un valor invalido aborta listando los tres validos
- [x] `taskctl siguiente TASK-NNN --json` devuelve fase, comando y si preguntar, sin commitear; tabla literal en `test/core/siguiente.test.ts` por estado, plan_aprobado, modo y veredicto
- [x] `taskctl siguiente` sale con codigo distinto de 0 ante tarea inexistente o config roto, y deduce la fase solo de Git y disco
- [x] Al cerrar `plan` el modo se congela en `tarea.md`; cambiar el config despues no cambia el modo de esa tarea
- [x] Cada transicion anade una fila `fecha | fase | modo | decidido_por` en `## Transiciones` de `tarea.md`, en el mismo commit que la transicion
- [x] `taskctl pausa TASK-NNN` registra una fila «pausada por la persona» con su commit, para el «no» del modo semiautomatico
- [x] `approve --decidido-por automatico` se rechaza si el modo congelado de la tarea no es `automatico`
- [x] En `siguiente`, hotfix y release en modo automatico devuelven preguntar antes de `finish`, y ningun camino automatico pasa `--push`

## Resultado

Implementado segun el plan (diseno de referencia: plan-final de TASK-055).

- `config.ts`: `modo_flujo` (`manual` por defecto), validador de enumerado
  con fallo cerrado, lista de validos y sugerencia del parecido.
- `core/transiciones.ts` (puro): seccion `## Transiciones` con
  `| fecha | fase | modo | decidido_por |`. El modo se congela en el propio
  registro (ultima fila `plan`), sin campo nuevo en el frontmatter, asi que
  registro y modo no pueden discrepar. Las filas mal formadas se ignoran al
  leer y nunca se reescriben.
- `plan`, `approve`, `start`, `review` (cada ronda) y `finish` anaden su fila
  al cuerpo que pasan a `moveTareaFile`: entra en el mismo autoCommit. Una
  segunda aprobacion de un plan ya aprobado no deja fila (sigue siendo
  idempotente: lo cazo el test de auto-commit que ya existia).
- `approve --decidido-por persona|automatico`: `automatico` se rechaza si el
  modo congelado no es `automatico`; sin valor, o con uno desconocido, falla.
- `taskctl pausa`: fila `pausa` con su commit, sin cambiar el estado; si la
  copia al dia de la tarea esta en su rama y no se esta en ella, aborta
  diciendo a que rama cambiar.
- `core/flujo.ts` (puro) y `taskctl siguiente [--json]`: fase, comando y
  accion (`detener`, `preguntar`, `continuar`). Manual nunca encadena;
  semiautomatico pregunta antes de approve, start, review y finish;
  automatico continua salvo hotfix/release antes de finish. Ningun comando
  propuesto lleva `--push`. Lee del working tree o, si la tarea vive en su
  rama sin integrar, de la rama con `git show`. `planRedactado` y
  `planEsPlantilla` se extrajeron de approve para no duplicar la comprobacion.

Tests: `test/core/siguiente.test.ts` (tabla literal de 16 casos x 3 modos, y
cruce con `assertTransitionAllowed`: ninguna fase propuesta es ilegal),
`test/core/transiciones.test.ts` (6), `config.test.ts` (+3 y aserción literal
de `manual`), y `test/commands/siguiente.test.ts` (8, CLI real por spawn en
repos temporales: ciclo semiautomatico completo con `siguiente` en cada paso y
una fila por transicion en su commit, lectura desde develop, errores, modo
congelado frente a config cambiado, pausa, hotfix en automatico). Lo escribio
un agente en paralelo; no encontro bugs.
Mutantes (7, todos muertos): hotfix sin preguntar, semiautomatico sin
preguntar, automatico preguntando, aprobacion automatica sin mirar el modo
congelado, modo sin congelar, siguiente sin leer la rama, start sin fila.
Suite: 1004 tests, 1001 en verde (los 3 rojos conocidos de Windows).
Smoke con `bin/taskctl` en semiautomatico: `siguiente` legible y `--json`,
`pausa` con su commit y `approve --decidido-por automatico` rechazado.

Divergencia menor: el criterio 2 habla de «si preguntar»; la salida usa
`accion` con tres valores, porque manual necesita distinguir «detener» de
«continuar sin preguntar».
