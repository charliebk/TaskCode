# Tablero de tareas

> Generado automaticamente por taskctl finish el 2026-10-05. No editar a mano.

## Planificadas (00-planificadas) — 15

```text
ID        Titulo                                                                                      Asignado
--------  ------------------------------------------------------------------------------------------  --------------------
TASK-001  Scaffold del proyecto taskctl (plugin.json, bin/, tsconfig, test runner)                    (sin asignar)
TASK-002  Modelo de tarea, parser de tarea.md y máquina de estados                                    (sin asignar)
TASK-003  Comando taskctl new (alta individual de tarea)                                              (sin asignar)
TASK-004  Comando taskctl import (alta masiva desde Markdown)                                         charlie.bk@gmail.com
TASK-005  Comando taskctl board (listado por estado)                                                  charlie.bk@gmail.com
TASK-006  Empaquetado del plugin y validación de carga local                                          charlie.bk@gmail.com
TASK-007  Spike: validar scripts Git-Flow (.sh) vía Bash tool en Windows/IntelliJ                     charlie.bk@gmail.com
TASK-008  Migrar scripts Git-Flow a scripts/gitflow/ del plugin                                       charlie.bk@gmail.com
TASK-009  taskctl start: crea rama via create-tipo.sh y mueve tarea a en-curso                        charlie.bk@gmail.com
TASK-010  taskctl plan: version minima, un solo agente redacta plan-final.md                          charlie.bk@gmail.com
TASK-011  taskctl approve: checkpoint humano, marca plan_aprobado                                     charlie.bk@gmail.com
TASK-012  Precondicion de rama base + workspace limpio (seccion 8.3), con auto-switch si esta limpio  charlie.bk@gmail.com
TASK-019  Revisión ligera sin agente para tareas triviales                                            (sin asignar)
TASK-021  Publicar el marketplace y la versión v0.1.0 del plugin                                      (sin asignar)
TASK-052  F6-T5 Telemetria de fases y heuristica recalibrada                                          (sin asignar)
```

## En diseno (01-en-diseno) — 3

```text
ID        Titulo                                              Asignado
--------  --------------------------------------------------  --------------------
TASK-023  Métricas de coste en tokens por fase                charlie.bk@gmail.com
TASK-048  F6-T3 Skill de flujo mas ligera                     charlie.bk@gmail.com
TASK-049  F6-T4 Metadatos del plugin y modelo de los agentes  charlie.bk@gmail.com
```

## Terminadas (04-terminadas) — 41

```text
ID        Titulo                                                                                   Asignado
--------  ---------------------------------------------------------------------------------------  --------------------
TASK-013  Comando taskctl review (revisión por pares de un solo agente)                            charlie.bk@gmail.com
TASK-014  Comando taskctl finish (merge, cierre y actualización del tablero)                       charlie.bk@gmail.com
TASK-015  Límite de trabajo en curso por persona                                                   charlie.bk@gmail.com
TASK-016  Brainstorm paralelo por roles con agente unificador                                      charlie.bk@gmail.com
TASK-017  Catálogo de skills determinista con selección en dos pasos                               charlie.bk@gmail.com
TASK-018  Enrutado de revisor por diff real, fragmentado por dominio                               charlie.bk@gmail.com
TASK-020  Comando taskctl codex-review (segunda opinión independiente)                             charlie.bk@gmail.com
TASK-022  Documentación de equipo e incorporación de colaboradores                                 charlie.bk@gmail.com
TASK-024  asignado_a por defecto desde la identidad Git                                            charlie.bk@gmail.com
TASK-025  El limite de WIP mira las ramas de trabajo, no el arbol activo                           charlie.bk@gmail.com
TASK-026  Wrappers de Git-Flow en taskctl: diagnose, pause, resume, recover y abort-merge          charlie.bk@gmail.com
TASK-027  Subcarpetas planificacion y revision en cada carpeta de tarea                            charlie.bk@gmail.com
TASK-028  Primera skill del plugin: task-workflow/SKILL.md                                         charlie.bk@gmail.com
TASK-029  Bug de origin sin guard y deuda de los scripts de Git-Flow                               charlie.bk@gmail.com
TASK-030  Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4)                            charlie.bk@gmail.com
TASK-031  Distribucion del CLI: un clon debe traer un taskctl que arranque                         charlie.bk@gmail.com
TASK-032  Roles de brainstorm, heuristica de complejidad y skills revisoras (items D7 y D6)        charlie.bk@gmail.com
TASK-033  Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1)  charlie.bk@gmail.com
TASK-034  F1-T1 Excluir lo generado del diff de revision                                           charlie.bk@gmail.com
TASK-035  F1-T2 Politica de rondas y una sola suite por ronda en las skills                        charlie.bk@gmail.com
TASK-036  F1-T3 Veredicto con un comando e informe estructurado                                    charlie.bk@gmail.com
TASK-037  F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos                             charlie.bk@gmail.com
TASK-038  F2-T2 Una sola deteccion de origin por invocacion, con timeout                           charlie.bk@gmail.com
TASK-039  F2-T3 Menos llamadas git en los comandos                                                 charlie.bk@gmail.com
TASK-040  F3-T1 taskctl review para la ronda 2 y siguientes                                        charlie.bk@gmail.com
TASK-041  F4-T1 taskctl new con objetivo y criterios                                               charlie.bk@gmail.com
TASK-042  F4-T4 Complejidad por defecto por heuristica y un rol sin unificador                     charlie.bk@gmail.com
TASK-043  F4-T2 Validacion antes de plan y puertas de cierre                                       charlie.bk@gmail.com
TASK-044  F4-T3 Particion propuesta de las tareas grandes                                          charlie.bk@gmail.com
TASK-045  F5-T1 rama_base de punta a punta                                                         charlie.bk@gmail.com
TASK-046  F5-T2 Secciones con subtitulos y criterios multilinea                                    charlie.bk@gmail.com
TASK-047  F5-T3 Flags desconocidos y mensajes de review                                            charlie.bk@gmail.com
TASK-050  F6-T1 Suite rapida y repo plantilla en los tests                                         charlie.bk@gmail.com
TASK-051  F6-T2 Partir los ficheros de test mas largos                                             charlie.bk@gmail.com
TASK-053  moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio de Windows           charlie.bk@gmail.com
TASK-054  Rutas no ASCII en el diff de revision fragmentado por dominio                            charlie.bk@gmail.com
TASK-055  Flujo A: taskctl desde PowerShell y cmd                                                  charlie.bk@gmail.com
TASK-056  Flujo B: nucleo determinista del siguiente paso y registro de transiciones               charlie.bk@gmail.com
TASK-057  Flujo C: fases como skills invocables en modo manual                                     charlie.bk@gmail.com
TASK-058  Flujo D: modo semiautomatico                                                             charlie.bk@gmail.com
TASK-059  Flujo E: modo automatico                                                                 charlie.bk@gmail.com
```
