# Tablero de tareas

> Generado automaticamente por taskctl finish el 2026-11-11. No editar a mano.

## Planificadas (00-planificadas) — 19

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
TASK-099  Correccion de MENORES tras aprobar con correcciones sin abrir otra ronda completa           (sin asignar)
TASK-106  Verificacion proporcional B3: finish verifica solo lo afectado con codigo parcial           (sin asignar)
TASK-107  Verificacion proporcional B4: Stop, review y finish deciden igual el mismo diff             (sin asignar)
TASK-108  Verificacion proporcional B5: el guardian de merges ante el nivel 2                         (sin asignar)
TASK-109  Verificacion proporcional B6: documentacion y limpieza del nivel 2                          (sin asignar)
```

## Terminadas (04-terminadas) — 88

```text
ID        Titulo                                                                                                              Asignado
--------  ------------------------------------------------------------------------------------------------------------------  --------------------
TASK-013  Comando taskctl review (revisión por pares de un solo agente)                                                       charlie.bk@gmail.com
TASK-014  Comando taskctl finish (merge, cierre y actualización del tablero)                                                  charlie.bk@gmail.com
TASK-015  Límite de trabajo en curso por persona                                                                              charlie.bk@gmail.com
TASK-016  Brainstorm paralelo por roles con agente unificador                                                                 charlie.bk@gmail.com
TASK-017  Catálogo de skills determinista con selección en dos pasos                                                          charlie.bk@gmail.com
TASK-018  Enrutado de revisor por diff real, fragmentado por dominio                                                          charlie.bk@gmail.com
TASK-020  Comando taskctl codex-review (segunda opinión independiente)                                                        charlie.bk@gmail.com
TASK-022  Documentación de equipo e incorporación de colaboradores                                                            charlie.bk@gmail.com
TASK-023  Métricas de coste en tokens por fase                                                                                charlie.bk@gmail.com
TASK-024  asignado_a por defecto desde la identidad Git                                                                       charlie.bk@gmail.com
TASK-025  El limite de WIP mira las ramas de trabajo, no el arbol activo                                                      charlie.bk@gmail.com
TASK-026  Wrappers de Git-Flow en taskctl: diagnose, pause, resume, recover y abort-merge                                     charlie.bk@gmail.com
TASK-027  Subcarpetas planificacion y revision en cada carpeta de tarea                                                       charlie.bk@gmail.com
TASK-028  Primera skill del plugin: task-workflow/SKILL.md                                                                    charlie.bk@gmail.com
TASK-029  Bug de origin sin guard y deuda de los scripts de Git-Flow                                                          charlie.bk@gmail.com
TASK-030  Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4)                                                       charlie.bk@gmail.com
TASK-031  Distribucion del CLI: un clon debe traer un taskctl que arranque                                                    charlie.bk@gmail.com
TASK-032  Roles de brainstorm, heuristica de complejidad y skills revisoras (items D7 y D6)                                   charlie.bk@gmail.com
TASK-033  Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1)                             charlie.bk@gmail.com
TASK-034  F1-T1 Excluir lo generado del diff de revision                                                                      charlie.bk@gmail.com
TASK-035  F1-T2 Politica de rondas y una sola suite por ronda en las skills                                                   charlie.bk@gmail.com
TASK-036  F1-T3 Veredicto con un comando e informe estructurado                                                               charlie.bk@gmail.com
TASK-037  F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos                                                        charlie.bk@gmail.com
TASK-038  F2-T2 Una sola deteccion de origin por invocacion, con timeout                                                      charlie.bk@gmail.com
TASK-039  F2-T3 Menos llamadas git en los comandos                                                                            charlie.bk@gmail.com
TASK-040  F3-T1 taskctl review para la ronda 2 y siguientes                                                                   charlie.bk@gmail.com
TASK-041  F4-T1 taskctl new con objetivo y criterios                                                                          charlie.bk@gmail.com
TASK-042  F4-T4 Complejidad por defecto por heuristica y un rol sin unificador                                                charlie.bk@gmail.com
TASK-043  F4-T2 Validacion antes de plan y puertas de cierre                                                                  charlie.bk@gmail.com
TASK-044  F4-T3 Particion propuesta de las tareas grandes                                                                     charlie.bk@gmail.com
TASK-045  F5-T1 rama_base de punta a punta                                                                                    charlie.bk@gmail.com
TASK-046  F5-T2 Secciones con subtitulos y criterios multilinea                                                               charlie.bk@gmail.com
TASK-047  F5-T3 Flags desconocidos y mensajes de review                                                                       charlie.bk@gmail.com
TASK-048  F6-T3 Skill de flujo mas ligera                                                                                     charlie.bk@gmail.com
TASK-049  F6-T4 Metadatos del plugin y modelo de los agentes                                                                  charlie.bk@gmail.com
TASK-050  F6-T1 Suite rapida y repo plantilla en los tests                                                                    charlie.bk@gmail.com
TASK-051  F6-T2 Partir los ficheros de test mas largos                                                                        charlie.bk@gmail.com
TASK-052  F6-T5 Telemetria de fases y heuristica recalibrada                                                                  charlie.bk@gmail.com
TASK-053  moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio de Windows                                      charlie.bk@gmail.com
TASK-054  Rutas no ASCII en el diff de revision fragmentado por dominio                                                       charlie.bk@gmail.com
TASK-055  Flujo A: taskctl desde PowerShell y cmd                                                                             charlie.bk@gmail.com
TASK-056  Flujo B: nucleo determinista del siguiente paso y registro de transiciones                                          charlie.bk@gmail.com
TASK-057  Flujo C: fases como skills invocables en modo manual                                                                charlie.bk@gmail.com
TASK-058  Flujo D: modo semiautomatico                                                                                        charlie.bk@gmail.com
TASK-059  Flujo E: modo automatico                                                                                            charlie.bk@gmail.com
TASK-060  Opciones de cierre en finish: merge normal, merge request y tag                                                     charlie.bk@gmail.com
TASK-061  Merge request en cualquier GitLab, tambien autoalojado                                                              charlie.bk@gmail.com
TASK-062  taskctl doctor: comprobar que un proyecto esta listo antes de trabajar                                              charlie.bk@gmail.com
TASK-063  Metricas v2 (A): capturar desglose de coste, lecturas y origen de hallazgos                                         charlie.bk@gmail.com
TASK-064  Metricas v2 (B): fila de metricas con coste desglosado, hallazgos y lecturas                                        charlie.bk@gmail.com
TASK-065  Metricas v2 (C): evolucion, grupos y varios proyectos                                                               charlie.bk@gmail.com
TASK-066  Doctor-deploy A: catalogo generico y comprobaciones deterministas                                                   charlie.bk@gmail.com
TASK-067  Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release                                              charlie.bk@gmail.com
TASK-068  Doctor-deploy C: tipo de aplicacion y sondas deterministas extra                                                    charlie.bk@gmail.com
TASK-069  Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ                                                   charlie.bk@gmail.com
TASK-070  Clave comando_verificacion en .taskcode/config.yml                                                                  charlie.bk@gmail.com
TASK-071  Hook Stop: una tarea no se da por hecha con la verificacion en rojo                                                 charlie.bk@gmail.com
TASK-072  Puerta de verificacion en finish y merge guard                                                                      charlie.bk@gmail.com
TASK-073  Tests held-out por tarea                                                                                            charlie.bk@gmail.com
TASK-074  Cobertura sobre las lineas cambiadas                                                                                charlie.bk@gmail.com
TASK-075  Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+                                      charlie.bk@gmail.com
TASK-076  Doctor avisa de hooks PreToolUse sobre Agent que bloquean los subagentes en modo automatico                         charlie.bk@gmail.com
TASK-077  Guardian de merges: opciones con valor antes de -c y doc de bash -c                                                 charlie.bk@gmail.com
TASK-078  Hook que impide leer y editar los held-out de la tarea en curso                                                     charlie.bk@gmail.com
TASK-079  Revisor por pares de dominio para Rust y WASM                                                                       charlie.bk@gmail.com
TASK-080  Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan                                 charlie.bk@gmail.com
TASK-081  Revision mas barata: medir y acotar las lecturas de los revisores                                                   charlie.bk@gmail.com
TASK-082  Autorrevision del implementador antes de pedir revision                                                             charlie.bk@gmail.com
TASK-083  Cierre sin ronda 2 completa cuando solo quedan MENORES                                                              charlie.bk@gmail.com
TASK-084  Version del plugin en cada tarea y metricas por version                                                             charlie.bk@gmail.com
TASK-085  Coste de implementacion registrado automaticamente                                                                  charlie.bk@gmail.com
TASK-086  Descontar las pausas de las duraciones de las metricas                                                              charlie.bk@gmail.com
TASK-087  taskctl doctor avisa si el plugin instalado esta desactualizado                                                     charlie.bk@gmail.com
TASK-088  taskctl doctor avisa si falta comando_verificacion con tests detectables                                            charlie.bk@gmail.com
TASK-089  Evitar literales con forma de secreto en el repo y tags de version que faltan                                       charlie.bk@gmail.com
TASK-090  El guardian de secretos tolera excepciones solo en su fichero historico                                             charlie.bk@gmail.com
TASK-091  Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar                           charlie.bk@gmail.com
TASK-092  Sincronización de ficheros sueltos de la raíz de tareas/                                                            charlie.bk@gmail.com
TASK-095  Revision que converge: desde la ronda 2 solo se verifican las correcciones                                          charlie.bk@gmail.com
TASK-096  Verificacion proporcional B: con codigo parcial se verifica solo lo afectado                                        charlie.bk@gmail.com
TASK-097  Regla de una hora: plan estima la duracion de punta a punta y propone trocear                                       charlie.bk@gmail.com
TASK-098  ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes                             charlie.bk@gmail.com
TASK-100  Verificacion proporcional A1: finish no corre la suite si la tarea solo cambia documentacion                        charlie.bk@gmail.com
TASK-101  Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion      charlie.bk@gmail.com
TASK-102  Verificacion proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentacion  charlie.bk@gmail.com
TASK-103  Guardian de merges: config invalida bloquea y merges que hoy no detecta                                             charlie.bk@gmail.com
TASK-104  Verificacion proporcional A3b: las rondas de review no corren la suite si solo cambia documentacion                 charlie.bk@gmail.com
TASK-105  Verificacion proporcional B2: decision entre refs y huella para el nivel 2                                          charlie.bk@gmail.com
```
