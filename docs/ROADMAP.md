# Roadmap de TaskCode

> Qué falta por hacer y qué está hecho, en un solo sitio. Última actualización:
> **2026-11-10** (TASK-092, 095, 097 y 098 cerradas; 0.14.0 publicada).
>
> **Cómo se mantiene**: al crear una tarea se añade a «Pendiente»; al cerrarla
> con `taskctl finish` se pasa a «Terminado», bajo la versión con la que sale.
> El detalle de cada item sigue en `docs/contexto/CHECKLIST_TERMINACION.md` y el
> de cada versión en `CHANGELOG.md`; aquí solo va el mapa.

## Resumen

| | Tareas |
|---|---|
| Terminadas | **95** (TASK-001 a TASK-080 salvo TASK-019, TASK-081 a TASK-092, TASK-095, TASK-097, TASK-098, TASK-100) |
| Descartadas | 3 (TASK-019, TASK-093, TASK-094) |
| **Pendientes** | **4** (TASK-101, TASK-102, TASK-096; TASK-099 para la 0.15.0) |
| Versión publicada | **0.14.0** (2026-11-10) |

---

## Pendiente

### Fase P — Agilidad sin perder calidad (4/5)

Sale de la auditoría de agilidad de la 0.8 a la 0.13 (`docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md`):
las tareas de ToolsaWeb pasaron de 103 a 192 min de mediana de punta a punta y
las revisiones de 2,3 a 3,8 rondas. La 0.14.0 trae la revisión que converge
(TASK-095), la regla de una hora (TASK-097) y el ROADMAP generado (TASK-098).

| Orden | Tarea | Título | Complejidad | Prioridad | Depende de |
|---|---|---|---|---|---|
| 1 | TASK-101 | Verificación proporcional A2: el guardián de merges no exige la completa si la tarea solo cambia documentación | media | alta | TASK-100 |
| 2 | TASK-102 | Verificación proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentación | media | alta | TASK-100 |
| 3 | TASK-096 | Verificación proporcional B: con código parcial se verifica solo lo afectado | alta | media | TASK-100 |
| 4 | TASK-099 | Corrección de MENORES tras aprobar con correcciones sin abrir otra ronda completa | media | 0.15.0 | 10 tareas medidas con la 0.14.0 |

TASK-099 sale de OpenDockTrading TASK-067, la primera tarea cerrada con la 0.14.0
(15 min de punta a punta, rondas de 1,42 M, 0,74 M y 0,37 M tokens): la ronda 3 se
abrió por un único MENOR. Se decide con datos: no se empieza hasta medir al menos 10
tareas con la 0.14.0 y se descarta si las rondas por MENORES no pesan.

### Fase N — Mejoras tras las métricas de la 0.8 (9/9)

Salen de medir ToolsaWeb con `taskctl metricas` (119 tareas terminadas, 51 de
ellas con la 0.8). Con la 0.8 la calidad se mantuvo (0 CRÍTICOS), pero los
tokens de revisión de una tarea media pasaron de 3,3 M a 6,8 M de mediana,
ninguna tarea salió en una sola ronda y el 86 % de los hallazgos vinieron de la
implementación. Faltan además datos para comparar versiones con rigor.

Orden recomendado (la columna «Orden» manda; los IDs son de alta):

| Orden | Tarea | Título | Complejidad | Prioridad | Depende de |
|---|---|---|---|---|---|

Cómo se sabrá si ha funcionado: tras unas 20 tareas de ToolsaWeb con la versión
que lleve TASK-081 a 083, `taskctl metricas --evolucion` y `--por-version` (desde la
0.12.0) deben mostrar más tareas aprobadas a la primera, menos hallazgos
de implementación y los tokens de revisión de vuelta a 3-4 M por tarea media.

### Pendiente fuera de tareas

- [ ] **ToolsaWeb y OpenDockTrading**: tarea de migración de su ROADMAP al de
      taskctl (`taskctl roadmap --comparar`, corregir, `--escribir`; guía en
      `skills/task-workflow/roadmap.md`). En OpenDockTrading sustituye su TASK-068.
- [ ] **ToolsaWeb**: retomar o descartar su TASK-298, parada hasta tener la 0.14.0.
- [ ] **Smoke del flujo guiado** dentro de una sesión real de Claude Code (lo
      hace Carlos; pendiente desde la fase G).
- [ ] **ToolsaWeb**: pasar su verificador por impacto (su TASK-297) al encaje de
      la 0.13.0: clasificador como `comando_verificacion_selectiva` (lee
      `RAMA_BASE`) y `scripts\verificar.bat` completo como `comando_verificacion`.
      Guía: `skills/task-workflow/verificacion-selectiva.md`.
- [ ] **ToolsaWeb**: declarar `comando_verificacion` (y `comando_heldout` si se
      usan held-out) en su `.taskcode/config.yml`. Sin eso no actúan los frenos
      de verificación de la 0.11 (hook `Stop`, puerta de `finish`, guardián de
      merges).
- [ ] **Medir la 0.11 en ToolsaWeb** cuando cierre unas 20 tareas con ella y
      compararla con las 51 de la 0.8.

### Descartado

- **TASK-019** — Revisión ligera sin agente para tareas triviales. Decisión D4
  del checklist: no se hace, con los datos delante.
- **TASK-093** — `finish` reutiliza la completa en verde del mismo árbol: poco
  valor medido.
- **TASK-094** — Cerrojo de verificación: síntoma de lanzar demasiadas
  verificaciones; TASK-096 ataca la causa.

---

## Terminado

95 tareas, agrupadas por la versión con la que salieron (la más reciente
primero). TASK-021 (publicar el marketplace) se adelantó al Sprint 1 como
item A1. Las carpetas de TASK-001 a TASK-012 y TASK-021 siguen en
`tareas/00-planificadas/` porque se hicieron antes de que existiera el ciclo
de `taskctl`; su cierre consta en el checklist, no en la carpeta.

### Sin publicar — 1 tarea

| Tarea | Título | Cierre |
|---|---|---|
| TASK-100 | Verificación proporcional A1: finish no corre la suite si la tarea solo cambia documentación | 2026-11-10 |

### v0.14.0 — 2026-11-10 — 4 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-092 | Sincronización de ficheros sueltos de la raíz de tareas/ | 2026-11-10 |
| TASK-095 | Revisión que converge: desde la ronda 2 solo se verifican las correcciones | 2026-11-10 |
| TASK-097 | Regla de una hora: plan estima la duración de punta a punta y propone trocear | 2026-11-10 |
| TASK-098 | ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes | 2026-11-10 |

### v0.13.0 — 2026-11-09 — 1 tarea

| Tarea | Título | Cierre |
|---|---|---|
| TASK-091 | Verificación selectiva por impacto en las rondas y completa obligatoria antes de integrar | 2026-11-09 |

### v0.12.0 — 2026-11-07 — 10 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-090 | El guardián de secretos tolera excepciones solo en su fichero histórico | 2026-11-07 |
| TASK-089 | Evitar literales con forma de secreto en el repo y tags de versión que faltan | 2026-11-07 |
| TASK-088 | `taskctl doctor` avisa si falta `comando_verificacion` con tests detectables | 2026-11-07 |
| TASK-087 | `taskctl doctor` avisa si el plugin instalado está desactualizado | 2026-11-07 |
| TASK-086 | Descontar las pausas de las duraciones de las métricas | 2026-11-07 |
| TASK-085 | Coste de implementación registrado automáticamente | 2026-11-07 |
| TASK-083 | Cierre sin ronda 2 completa cuando solo quedan MENORES | 2026-11-07 |
| TASK-082 | Autorrevisión del implementador antes de pedir revisión | 2026-11-07 |
| TASK-081 | Revisión más barata: medir y acotar las lecturas de los revisores | 2026-11-07 |
| TASK-084 | Versión del plugin en cada tarea y métricas por versión | 2026-11-07 |

### v0.11.0 — 1 tarea

| Tarea | Título | Cierre |
|---|---|---|
| TASK-080 | Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan | 2026-11-06 |

### v0.10.0 — 1 tarea

| Tarea | Título | Cierre |
|---|---|---|
| TASK-079 | Revisor por pares de dominio para Rust y WASM | 2026-11-06 |

### v0.9.0 — 13 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-066 | Doctor-deploy A: catalogo generico y comprobaciones deterministas | 2026-10-27 |
| TASK-067 | Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release | 2026-10-28 |
| TASK-068 | Doctor-deploy C: tipo de aplicacion y sondas deterministas extra | 2026-11-04 |
| TASK-069 | Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ | 2026-11-03 |
| TASK-070 | Clave comando_verificacion en .taskcode/config.yml | 2026-11-04 |
| TASK-071 | Hook Stop: una tarea no se da por hecha con la verificacion en rojo | 2026-11-04 |
| TASK-072 | Puerta de verificacion en finish y merge guard | 2026-11-04 |
| TASK-073 | Tests held-out por tarea | 2026-11-05 |
| TASK-074 | Cobertura sobre las lineas cambiadas | 2026-11-05 |
| TASK-075 | Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+ | 2026-11-05 |
| TASK-076 | Doctor avisa de hooks PreToolUse sobre Agent que bloquean los subagentes en modo automatico | 2026-11-06 |
| TASK-077 | Guardian de merges: opciones con valor antes de -c y doc de bash -c | 2026-11-04 |
| TASK-078 | Hook que impide leer y editar los held-out de la tarea en curso | 2026-11-05 |

### v0.8.0 — 3 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-063 | Metricas v2 (A): capturar desglose de coste, lecturas y origen de hallazgos | 2026-10-25 |
| TASK-064 | Metricas v2 (B): fila de metricas con coste desglosado, hallazgos y lecturas | 2026-10-25 |
| TASK-065 | Metricas v2 (C): evolucion, grupos y varios proyectos | 2026-10-26 |

### v0.7.0 — 2 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-061 | Merge request en cualquier GitLab, tambien autoalojado | 2026-10-08 |
| TASK-062 | taskctl doctor: comprobar que un proyecto esta listo antes de trabajar | 2026-10-08 |

### v0.6.0 — 2 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-023 | Métricas de coste en tokens por fase | 2026-10-06 |
| TASK-060 | Opciones de cierre en finish: merge normal, merge request y tag | 2026-10-06 |

### v0.5.0 — 5 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-048 | F6-T3 Skill de flujo mas ligera | 2026-10-05 |
| TASK-049 | F6-T4 Metadatos del plugin y modelo de los agentes | 2026-10-05 |
| TASK-050 | F6-T1 Suite rapida y repo plantilla en los tests | 2026-10-05 |
| TASK-051 | F6-T2 Partir los ficheros de test mas largos | 2026-10-05 |
| TASK-052 | F6-T5 Telemetria de fases y heuristica recalibrada | 2026-10-05 |

### v0.4.0 — 8 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-045 | F5-T1 rama_base de punta a punta | 2026-10-04 |
| TASK-047 | F5-T3 Flags desconocidos y mensajes de review | 2026-10-05 |
| TASK-054 | Rutas no ASCII en el diff de revision fragmentado por dominio | 2026-10-05 |
| TASK-055 | Flujo A: taskctl desde PowerShell y cmd | 2026-10-04 |
| TASK-056 | Flujo B: nucleo determinista del siguiente paso y registro de transiciones | 2026-10-04 |
| TASK-057 | Flujo C: fases como skills invocables en modo manual | 2026-10-04 |
| TASK-058 | Flujo D: modo semiautomatico | 2026-10-04 |
| TASK-059 | Flujo E: modo automatico | 2026-10-05 |

### v0.3.0 — 6 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-041 | F4-T1 taskctl new con objetivo y criterios | 2026-10-04 |
| TASK-042 | F4-T4 Complejidad por defecto por heuristica y un rol sin unificador | 2026-10-04 |
| TASK-043 | F4-T2 Validacion antes de plan y puertas de cierre | 2026-10-04 |
| TASK-044 | F4-T3 Particion propuesta de las tareas grandes | 2026-10-04 |
| TASK-046 | F5-T2 Secciones con subtitulos y criterios multilinea | 2026-10-04 |
| TASK-053 | moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio de Windows | 2026-10-04 |

### v0.2.0 — 1 tarea

| Tarea | Título | Cierre |
|---|---|---|
| TASK-040 | F3-T1 taskctl review para la ronda 2 y siguientes | 2026-10-04 |

### v0.1.3 — 3 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-037 | F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos | 2026-10-04 |
| TASK-038 | F2-T2 Una sola deteccion de origin por invocacion, con timeout | 2026-10-04 |
| TASK-039 | F2-T3 Menos llamadas git en los comandos | 2026-10-04 |

### v0.1.2 — 3 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-034 | F1-T1 Excluir lo generado del diff de revision | 2026-10-04 |
| TASK-035 | F1-T2 Politica de rondas y una sola suite por ronda en las skills | 2026-10-04 |
| TASK-036 | F1-T3 Veredicto con un comando e informe estructurado | 2026-10-04 |

### v0.1.1 — 18 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-013 | Comando taskctl review (revisión por pares de un solo agente) | 2026-09-05 |
| TASK-014 | Comando taskctl finish (merge, cierre y actualización del tablero) | 2026-09-05 |
| TASK-015 | Límite de trabajo en curso por persona | 2026-09-05 |
| TASK-016 | Brainstorm paralelo por roles con agente unificador | 2026-09-08 |
| TASK-017 | Catálogo de skills determinista con selección en dos pasos | 2026-09-09 |
| TASK-018 | Enrutado de revisor por diff real, fragmentado por dominio | 2026-09-12 |
| TASK-020 | Comando taskctl codex-review (segunda opinión independiente) | 2026-09-13 |
| TASK-022 | Documentación de equipo e incorporación de colaboradores | 2026-09-16 |
| TASK-024 | asignado_a por defecto desde la identidad Git | 2026-09-06 |
| TASK-025 | El limite de WIP mira las ramas de trabajo, no el arbol activo | 2026-09-06 |
| TASK-026 | Wrappers de Git-Flow en taskctl: diagnose, pause, resume, recover y abort-merge | 2026-09-06 |
| TASK-027 | Subcarpetas planificacion y revision en cada carpeta de tarea | 2026-09-07 |
| TASK-028 | Primera skill del plugin: task-workflow/SKILL.md | 2026-09-07 |
| TASK-029 | Bug de origin sin guard y deuda de los scripts de Git-Flow | 2026-09-07 |
| TASK-030 | Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4) | 2026-09-07 |
| TASK-031 | Distribucion del CLI: un clon debe traer un taskctl que arranque | 2026-09-07 |
| TASK-032 | Roles de brainstorm, heuristica de complejidad y skills revisoras (items D7 y D6) | 2026-09-08 |
| TASK-033 | Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1) | 2026-10-03 |

### Sprint 0 y 1 (antes de las versiones) — 13 tareas

| Tarea | Título | Cierre |
|---|---|---|
| TASK-001 | Scaffold del proyecto taskctl (plugin.json, bin/, tsconfig, test runner) | Sprint 0-1 |
| TASK-002 | Modelo de tarea, parser de tarea.md y máquina de estados | Sprint 0-1 |
| TASK-003 | Comando taskctl new (alta individual de tarea) | Sprint 0-1 |
| TASK-004 | Comando taskctl import (alta masiva desde Markdown) | Sprint 0-1 |
| TASK-005 | Comando taskctl board (listado por estado) | Sprint 0-1 |
| TASK-006 | Empaquetado del plugin y validación de carga local | Sprint 0-1 |
| TASK-007 | Spike: validar scripts Git-Flow (.sh) vía Bash tool en Windows/IntelliJ | Sprint 0-1 |
| TASK-008 | Migrar scripts Git-Flow a scripts/gitflow/ del plugin | Sprint 0-1 |
| TASK-009 | taskctl start: crea rama via create-tipo.sh y mueve tarea a en-curso | Sprint 0-1 |
| TASK-010 | taskctl plan: version minima, un solo agente redacta plan-final.md | Sprint 0-1 |
| TASK-011 | taskctl approve: checkpoint humano, marca plan_aprobado | Sprint 0-1 |
| TASK-012 | Precondicion de rama base + workspace limpio (seccion 8.3), con auto-switch si esta limpio | Sprint 0-1 |
| TASK-021 | Publicar el marketplace y la versión v0.1.0 del plugin | Sprint 0-1 |
