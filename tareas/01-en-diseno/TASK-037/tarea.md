---
id: TASK-037
titulo: "F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos"
tipo: feature
sprint: 3
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-037-f2-t1-logging-de-los-scripts-de-git-flow
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

Que el logging de los scripts de Git-Flow deje de lanzar procesos: hoy cada
linea abre un subshell `$(_do_log ...)` y un `date` (~0,15 s por linea medido
en Windows; `initialize_gitflow_log` y `log_summary` lanzan mas `date`). Es la
mayor parte de los 11 s que `update-feature.sh` se lleva dentro de `taskctl
review` (auditoria del 2026-10-03, B1), y lo paga cada `start`, `review`,
`finish`, `diagnose` y un tercio de la suite.

Con bash >= 4.2 la hora sale de `printf -v ... '%(...)T'`; con bash mas
antiguo (el `/bin/bash` 3.2 de macOS) se conserva `date` como caida. Fuera de
alcance: la deteccion de origin (TASK-038).

## Criterios de aceptacion
- [ ] `_gitflow-common.sh` usa `printf -v` en lugar de `$(date)` y `$(_do_log)`
- [ ] Tiempo de `update-feature.sh` en un repo temporal medido antes y despues y anotado en el Resultado
- [ ] Salida y fichero de log identicos (salvo la hora) en un caso de prueba
- [ ] Tests de `test/gitflow/` en verde
