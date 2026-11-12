# Roadmap de tareas

<!-- generado por taskctl; formato 1; no editar fuera de la zona manual -->

<!-- manual:inicio (se edita a mano; taskctl la conserva) -->
## Hitos

Un `### Hn — título` por hito (n es el campo `sprint` de sus tareas), en el orden en que se hacen y con su motivo debajo. taskctl conserva esta zona tal cual y toma de aquí los títulos y el orden de los hitos.
<!-- manual:fin -->

## Estado del trabajo

Orden en que se hacen las tareas, agrupadas por hito (campo `sprint` de cada tarea). Sale de las dependencias: ninguna tarea va antes que aquellas de las que depende y, a igualdad, va primero la del hito anterior (en el orden de los `### Hn — título` de la zona manual) y luego la de número menor. taskctl lo regenera en cada transición que cae en la rama de integración; solo la zona manual se edita a mano.

- **En marcha:** TASK-121 (en diseño)
- **Listas para empezar:** TASK-001, TASK-007, TASK-099, TASK-112, TASK-113, TASK-114, TASK-115, TASK-116, TASK-117, TASK-118, TASK-119, TASK-120, TASK-124, TASK-019

## H0 — H0

51 de 77 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| 1 | TASK-001 | Scaffold del proyecto taskctl (plugin.json, bin/, tsconfig, test runner) | simple | — | lista para empezar |
| 2 | TASK-002 | Modelo de tarea, parser de tarea.md y máquina de estados | media | TASK-001 | espera a TASK-001 |
| 3 | TASK-003 | Comando taskctl new (alta individual de tarea) | simple | TASK-002 | espera a TASK-002 |
| 4 | TASK-004 | Comando taskctl import (alta masiva desde Markdown) | media | TASK-002, TASK-003 | espera a TASK-002, TASK-003 |
| 5 | TASK-005 | Comando taskctl board (listado por estado) | trivial | TASK-002 | espera a TASK-002 |
| 6 | TASK-006 | Empaquetado del plugin y validación de carga local | simple | TASK-001 | espera a TASK-001 |
| 7 | TASK-007 | Spike: validar scripts Git-Flow (.sh) vía Bash tool en Windows/IntelliJ | simple | — | lista para empezar |
| — | TASK-029 | Bug de origin sin guard y deuda de los scripts de Git-Flow | media | — | ✅ terminada |
| — | TASK-030 | Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4) | media | — | ✅ terminada |
| — | TASK-031 | Distribucion del CLI: un clon debe traer un taskctl que arranque | media | — | ✅ terminada |
| — | TASK-033 | Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1) | media | — | ✅ terminada |
| — | TASK-063 | Metricas v2 (A): capturar desglose de coste, lecturas y origen de hallazgos | media | — | ✅ terminada |
| — | TASK-064 | Metricas v2 (B): fila de metricas con coste desglosado, hallazgos y lecturas | media | TASK-063 | ✅ terminada |
| — | TASK-065 | Metricas v2 (C): evolucion, grupos y varios proyectos | media | TASK-064 | ✅ terminada |
| — | TASK-066 | Doctor-deploy A: catalogo generico y comprobaciones deterministas | media | — | ✅ terminada |
| — | TASK-067 | Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release | media | — | ✅ terminada |
| — | TASK-068 | Doctor-deploy C: tipo de aplicacion y sondas deterministas extra | media | — | ✅ terminada |
| — | TASK-069 | Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ | simple | — | ✅ terminada |
| — | TASK-070 | Clave comando_verificacion en .taskcode/config.yml | simple | — | ✅ terminada |
| — | TASK-071 | Hook Stop: una tarea no se da por hecha con la verificacion en rojo | media | TASK-069, TASK-070 | ✅ terminada |
| — | TASK-072 | Puerta de verificacion en finish y merge guard | media | TASK-071 | ✅ terminada |
| — | TASK-073 | Tests held-out por tarea | alta | TASK-070, TASK-072 | ✅ terminada |
| — | TASK-074 | Cobertura sobre las lineas cambiadas | alta | TASK-072 | ✅ terminada |
| — | TASK-075 | Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+ | simple | — | ✅ terminada |
| — | TASK-076 | Doctor avisa de hooks PreToolUse sobre Agent que bloquean los subagentes en modo automatico | simple | — | ✅ terminada |
| — | TASK-077 | Guardian de merges: opciones con valor antes de -c y doc de bash -c | simple | — | ✅ terminada |
| — | TASK-078 | Hook que impide leer y editar los held-out de la tarea en curso | media | — | ✅ terminada |
| — | TASK-079 | Revisor por pares de dominio para Rust y WASM | simple | — | ✅ terminada |
| — | TASK-080 | Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan | media | — | ✅ terminada |
| — | TASK-081 | Revision mas barata: medir y acotar las lecturas de los revisores | alta | — | ✅ terminada |
| — | TASK-082 | Autorrevision del implementador antes de pedir revision | media | — | ✅ terminada |
| — | TASK-083 | Cierre sin ronda 2 completa cuando solo quedan MENORES | media | — | ✅ terminada |
| — | TASK-084 | Version del plugin en cada tarea y metricas por version | media | — | ✅ terminada |
| — | TASK-085 | Coste de implementacion registrado automaticamente | media | — | ✅ terminada |
| — | TASK-086 | Descontar las pausas de las duraciones de las metricas | simple | — | ✅ terminada |
| — | TASK-087 | taskctl doctor avisa si el plugin instalado esta desactualizado | simple | — | ✅ terminada |
| — | TASK-088 | taskctl doctor avisa si falta comando_verificacion con tests detectables | simple | — | ✅ terminada |
| — | TASK-089 | Evitar literales con forma de secreto en el repo y tags de version que faltan | simple | — | ✅ terminada |
| — | TASK-090 | El guardian de secretos tolera excepciones solo en su fichero historico | simple | — | ✅ terminada |
| — | TASK-091 | Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar | media | — | ✅ terminada |
| — | TASK-092 | Sincronización de ficheros sueltos de la raíz de tareas/ | simple | — | ✅ terminada |
| — | TASK-095 | Revision que converge: desde la ronda 2 solo se verifican las correcciones | alta | — | ✅ terminada |
| — | TASK-097 | Regla de una hora: plan estima la duracion de punta a punta y propone trocear | media | — | ✅ terminada |
| — | TASK-098 | ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes | media | — | ✅ terminada |
| 8 | TASK-099 | Correccion de MENORES tras aprobar con correcciones sin abrir otra ronda completa | media | — | lista para empezar |
| — | TASK-100 | Verificacion proporcional A1: finish no corre la suite si la tarea solo cambia documentacion | media | — | ✅ terminada |
| — | TASK-096 | Verificacion proporcional B: con codigo parcial se verifica solo lo afectado | alta | TASK-100 | ✅ terminada |
| — | TASK-101 | Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion | media | TASK-100 | ✅ terminada |
| — | TASK-102 | Verificacion proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentacion | media | TASK-100 | ✅ terminada |
| — | TASK-103 | Guardian de merges: config invalida bloquea y merges que hoy no detecta | simple | TASK-101 | ✅ terminada |
| — | TASK-104 | Verificacion proporcional A3b: las rondas de review no corren la suite si solo cambia documentacion | media | TASK-102 | ✅ terminada |
| — | TASK-105 | Verificacion proporcional B2: decision entre refs y huella para el nivel 2 | media | TASK-096 | ✅ terminada |
| — | TASK-106 | Verificacion proporcional B3: finish verifica solo lo afectado con codigo parcial | media | TASK-105 | ✅ terminada |
| — | TASK-107 | Verificacion proporcional B4: Stop, review y finish deciden igual el mismo diff | simple | TASK-106 | ✅ terminada |
| — | TASK-108 | Verificacion proporcional B5: el guardian de merges ante el nivel 2 | media | TASK-106 | ✅ terminada |
| — | TASK-109 | Verificacion proporcional B6: documentacion y limpieza del nivel 2 | simple | TASK-107, TASK-108 | ✅ terminada |
| — | TASK-110 | Progreso visible sin tokens: estado de cada fase en el terminal | alta | — | ✅ terminada |
| 9 | TASK-112 | P-4: el revisor reutiliza la verificacion de ronda y las rondas 2+ solo relanzan al revisor con pendientes | media | — | lista para empezar |
| 10 | TASK-113 | P-5: peticion de revision mas ligera con los tests como --stat y ruta | simple | — | lista para empezar |
| 11 | TASK-114 | P-6: hooks PreToolUse que salen pronto cuando no tienen nada que hacer | simple | — | lista para empezar |
| 12 | TASK-115 | P-7: verificacion completa por lote de cierres en modo automatico | alta | — | lista para empezar |
| 13 | TASK-116 | P-8: TaskCode declara su verificacion y doctor avisa cuando falta | simple | — | lista para empezar |
| 14 | TASK-117 | P-9: new propone la complejidad a partir de tareas parecidas ya cerradas | simple | — | lista para empezar |
| 15 | TASK-118 | P-10: linea FIN con la duracion en todos los scripts de Git-Flow | simple | — | lista para empezar |
| 16 | TASK-119 | P-11: menos commits de proceso por tarea | media | — | lista para empezar |
| 17 | TASK-120 | P-12: sincronizacion con su duracion registrada y limitada a las fases que se declaren | simple | — | lista para empezar |
| 18 | TASK-111 | P-3: registrar cada ejecucion del freno Stop y no correrlo si el turno no cambio codigo | media | TASK-120 | espera a TASK-120 |
| 19 | TASK-121 | Troceo de tareas de mas de 60 min como pregunta: subtareas TASK-NNNa, b, c en la misma rama | media | — | ▶ en diseño |
| — | TASK-122 | Coste por tarea independiente del tamano del proyecto | alta | — | ✅ terminada |
| — | TASK-123 | F-16: finish no cierra sin verificar tras un merge a mano o un conflicto | media | — | ✅ terminada |
| 20 | TASK-124 | Contexto con tamano maximo: lo que leen los agentes no crece con el proyecto | media | — | lista para empezar |
| 21 | TASK-125 | Freno Stop con presupuesto de tiempo y clave propia: si se pasa, anota y no bloquea | media | TASK-111 | espera a TASK-111 |
| 22 | TASK-126 | Verificacion por tipo de rama: los tests pesados solo en la puerta de release | media | TASK-115 | espera a TASK-115 |
| 23 | TASK-127 | Tope de rondas de revision configurable, 2 por defecto, y decision de una persona al llegar | simple | TASK-112 | espera a TASK-112 |
| 24 | TASK-128 | Metricas de verificacion por puerta: tiempo y ejecuciones de freno, review y finish, y rondas solo por menores | media | TASK-111, TASK-125 | espera a TASK-111, TASK-125 |
| 25 | TASK-129 | Freno al crecimiento de la suite: presupuesto de tests por criterio, pesados marcados y aviso de crecimiento | media | TASK-126, TASK-128 | espera a TASK-126, TASK-128 |
| 26 | TASK-130 | Poda periodica de tests redundantes: fusionar o borrar sin perder cobertura | simple | TASK-129 | espera a TASK-129 |

## H1 — H1

0 de 5 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| 27 | TASK-008 | Migrar scripts Git-Flow a scripts/gitflow/ del plugin | simple | TASK-006, TASK-007 | espera a TASK-006, TASK-007 |
| 28 | TASK-009 | taskctl start: crea rama via create-tipo.sh y mueve tarea a en-curso | simple | TASK-002, TASK-008 | espera a TASK-002, TASK-008 |
| 29 | TASK-010 | taskctl plan: version minima, un solo agente redacta plan-final.md | simple | TASK-002 | espera a TASK-002 |
| 30 | TASK-011 | taskctl approve: checkpoint humano, marca plan_aprobado | simple | TASK-010 | espera a TASK-010 |
| 31 | TASK-012 | Precondicion de rama base + workspace limpio (seccion 8.3), con auto-switch si esta limpio | media | TASK-009, TASK-010, TASK-011 | espera a TASK-009, TASK-010, TASK-011 |

## H2 — H2

11 de 11 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| — | TASK-013 | Comando taskctl review (revisión por pares de un solo agente) | media | TASK-012 | ✅ terminada |
| — | TASK-014 | Comando taskctl finish (merge, cierre y actualización del tablero) | media | TASK-013 | ✅ terminada |
| — | TASK-015 | Límite de trabajo en curso por persona | simple | TASK-009 | ✅ terminada |
| — | TASK-024 | asignado_a por defecto desde la identidad Git | simple | — | ✅ terminada |
| — | TASK-025 | El limite de WIP mira las ramas de trabajo, no el arbol activo | media | — | ✅ terminada |
| — | TASK-026 | Wrappers de Git-Flow en taskctl: diagnose, pause, resume, recover y abort-merge | media | — | ✅ terminada |
| — | TASK-027 | Subcarpetas planificacion y revision en cada carpeta de tarea | simple | — | ✅ terminada |
| — | TASK-028 | Primera skill del plugin: task-workflow/SKILL.md | simple | — | ✅ terminada |
| — | TASK-034 | F1-T1 Excluir lo generado del diff de revision | simple | — | ✅ terminada |
| — | TASK-035 | F1-T2 Politica de rondas y una sola suite por ronda en las skills | trivial | — | ✅ terminada |
| — | TASK-036 | F1-T3 Veredicto con un comando e informe estructurado | simple | — | ✅ terminada |

## H3 — H3

8 de 9 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| — | TASK-016 | Brainstorm paralelo por roles con agente unificador | alta | TASK-010 | ✅ terminada |
| — | TASK-017 | Catálogo de skills determinista con selección en dos pasos | alta | TASK-010 | ✅ terminada |
| — | TASK-018 | Enrutado de revisor por diff real, fragmentado por dominio | alta | TASK-013 | ✅ terminada |
| 32 | TASK-019 | Revisión ligera sin agente para tareas triviales | simple | TASK-013 | lista para empezar |
| — | TASK-020 | Comando taskctl codex-review (segunda opinión independiente) | media | TASK-013 | ✅ terminada |
| — | TASK-032 | Roles de brainstorm, heuristica de complejidad y skills revisoras (items D7 y D6) | media | — | ✅ terminada |
| — | TASK-037 | F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos | simple | — | ✅ terminada |
| — | TASK-038 | F2-T2 Una sola deteccion de origin por invocacion, con timeout | simple | — | ✅ terminada |
| — | TASK-039 | F2-T3 Menos llamadas git en los comandos | simple | — | ✅ terminada |

## H4 — H4

3 de 4 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| 33 | TASK-021 | Publicar el marketplace y la versión v0.1.0 del plugin | simple | TASK-006 | espera a TASK-006 |
| — | TASK-022 | Documentación de equipo e incorporación de colaboradores | simple | TASK-021 | ✅ terminada |
| — | TASK-023 | Métricas de coste en tokens por fase | media | TASK-014 | ✅ terminada |
| — | TASK-040 | F3-T1 taskctl review para la ronda 2 y siguientes | media | — | ✅ terminada |

## H5 — H5

4 de 4 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| — | TASK-041 | F4-T1 taskctl new con objetivo y criterios | simple | — | ✅ terminada |
| — | TASK-042 | F4-T4 Complejidad por defecto por heuristica y un rol sin unificador | simple | — | ✅ terminada |
| — | TASK-043 | F4-T2 Validacion antes de plan y puertas de cierre | media | — | ✅ terminada |
| — | TASK-044 | F4-T3 Particion propuesta de las tareas grandes | media | — | ✅ terminada |

## H6 — H6

5 de 5 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| — | TASK-045 | F5-T1 rama_base de punta a punta | simple | — | ✅ terminada |
| — | TASK-046 | F5-T2 Secciones con subtitulos y criterios multilinea | trivial | — | ✅ terminada |
| — | TASK-047 | F5-T3 Flags desconocidos y mensajes de review | simple | — | ✅ terminada |
| — | TASK-053 | moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio de Windows | trivial | — | ✅ terminada |
| — | TASK-054 | Rutas no ASCII en el diff de revision fragmentado por dominio | simple | — | ✅ terminada |

## H7 — H7

10 de 10 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| — | TASK-048 | F6-T3 Skill de flujo mas ligera | simple | — | ✅ terminada |
| — | TASK-049 | F6-T4 Metadatos del plugin y modelo de los agentes | simple | — | ✅ terminada |
| — | TASK-050 | F6-T1 Suite rapida y repo plantilla en los tests | media | — | ✅ terminada |
| — | TASK-051 | F6-T2 Partir los ficheros de test mas largos | media | — | ✅ terminada |
| — | TASK-052 | F6-T5 Telemetria de fases y heuristica recalibrada | media | — | ✅ terminada |
| — | TASK-055 | Flujo A: taskctl desde PowerShell y cmd | simple | — | ✅ terminada |
| — | TASK-056 | Flujo B: nucleo determinista del siguiente paso y registro de transiciones | — | — | ✅ terminada |
| — | TASK-057 | Flujo C: fases como skills invocables en modo manual | — | — | ✅ terminada |
| — | TASK-058 | Flujo D: modo semiautomatico | — | — | ✅ terminada |
| — | TASK-059 | Flujo E: modo automatico | — | — | ✅ terminada |

## H8 — H8

3 de 3 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| — | TASK-060 | Opciones de cierre en finish: merge normal, merge request y tag | media | — | ✅ terminada |
| — | TASK-061 | Merge request en cualquier GitLab, tambien autoalojado | media | — | ✅ terminada |
| — | TASK-062 | taskctl doctor: comprobar que un proyecto esta listo antes de trabajar | media | — | ✅ terminada |
