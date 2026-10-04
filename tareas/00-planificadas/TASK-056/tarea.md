---
id: TASK-056
titulo: "Flujo B: nucleo determinista del siguiente paso y registro de transiciones"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-056-flujo-b-nucleo-determinista-del-siguient
asignado_a: null
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
- [ ] Clave `modo_flujo` en `.taskcode/config.yml` (`manual`, `semiautomatico`, `automatico`): sin clave vale `manual` y un valor invalido aborta listando los tres validos
- [ ] `taskctl siguiente TASK-NNN --json` devuelve fase, comando y si preguntar, sin commitear; tabla literal en `test/core/siguiente.test.ts` por estado, plan_aprobado, modo y veredicto
- [ ] `taskctl siguiente` sale con codigo distinto de 0 ante tarea inexistente o config roto, y deduce la fase solo de Git y disco
- [ ] Al cerrar `plan` el modo se congela en `tarea.md`; cambiar el config despues no cambia el modo de esa tarea
- [ ] Cada transicion anade una fila `fecha | fase | modo | decidido_por` en `## Transiciones` de `tarea.md`, en el mismo commit que la transicion
- [ ] `taskctl pausa TASK-NNN` registra una fila «pausada por la persona» con su commit, para el «no» del modo semiautomatico
- [ ] `approve --decidido-por automatico` se rechaza si el modo congelado de la tarea no es `automatico`
- [ ] En `siguiente`, hotfix y release en modo automatico devuelven preguntar antes de `finish`, y ningun camino automatico pasa `--push`
