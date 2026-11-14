# Requisitos funcionales de TaskCode, con su uso real

> 2026-11-13. Base del [plan de TaskCode 2](PLAN-TASKCODE-2.md): lo que hace hoy
> la 0.16 y se usa de verdad tiene que seguir siendo posible en la 2.0, aunque
> cambie cómo se hace. Fuente: los tres repositorios de GitHub que usan el
> plugin (ToolsaWeb, OpenDockTrading y el propio TaskCode), leídos sin
> modificarlos: frontmatter y `## Transiciones` de cada `tarea.md`, carpetas
> `revision/` y `planificacion/`, `.taskcode/config.yml`, ramas, tags, PR e
> issues en GitHub, e historial de commits.

## 0. Requisitos rectores (Carlos, 2026-11-13)

Están por encima de todo el catálogo: si una decisión de la 2.0 choca con uno
de ellos, gana el requisito rector.

| ID | Requisito rector | Qué significa en la 2.0 |
|---|---|---|
| RR-01 | **Determinismo de las sentencias de Git para economizar tokens** | El agente no compone comandos de `git` ni de `gh`. Toda operación de Git y de GitHub (crear rama, commit de lo que escribe la herramienta, push, abrir PR, merge, tag) la hace un comando del CLI: idempotente, con salida corta, estructurada y sin colores para el agente, y un código de salida que dice qué hacer. Se mide en tokens por tarea |
| RR-02 | **Varios puntos de vista** | Brainstorm de roles con unificador en el diseño (RF-10) y revisoras por dominio en la revisión (RF-31), proporcionales al carril |
| RR-03 | **Búsqueda de errores** | Revisión que reproduce, prueba mutantes y busca casos borde, no solo lee el diff; hallazgos con evidencia (RF-30, RF-32) |
| RR-04 | **Revisión** | Independiente, por un agente distinto, y aprobación de una persona antes del merge (RF-30, RF-50) |
| RR-05 | **Iteración del método** | El método se mide y se corrige: métricas por tarea y por versión, auditorías periódicas (incluida una externa sin contexto) y cambios del método decididos con datos (RF-63, F7-5) |
| RR-06 | **Merge en `develop`** | `develop` es la rama de integración: cada tarea se integra en `develop` por PR cuando pasa sus puertas; `main` solo recibe releases (y hotfix). El merge lo ejecuta el CLI (o la cola de merge de GitHub), nunca el agente con `git merge` |
| RR-07 | **Agilidad** | Nada se ejecuta dos veces sin cambios (RF-42), carriles proporcionales y pocas puertas humanas con valor |
| RR-08 | **Calidad** | Las garantías las imponen la plataforma y la CI, no las instrucciones al agente |
| RR-09 | **Trabajo en grupo** | Varias personas y agentes a la vez sin conflictos de estado, IDs ni ficheros generados (RN-05, RN-06) |
| RR-10 | **Las tareas son ficheros para el programador; el roadmap es la vista para todos** | Una carpeta fija por tarea (`tareas/TASK-NNN/`: tarea, plan, informes, resultado) que no se mueve nunca; el estado es un campo. Sin carpetas por estado. Issues de GitHub o GitLab, si se usan, son un espejo opcional |
| RR-11 | **Un roadmap para ver todo, sin interferir en la verificación** | Vista de todas las tareas por estado (en curso, en revisión, planificadas por hito, terminadas, descartadas) y dependencias, regenerada sin invalidar la verificación (ni la huella ni la caché) y sin conflictos entre ramas |
| RR-12 | **Equipo sin pisarse el trabajo** | IDs únicos aunque se creen a la vez en dos clones; una tarea la toma una persona o agente y los demás lo ven; ningún fichero compartido se reescribe en cada fase |
| RR-13 | **Actualizar los proyectos existentes a la versión actual** | Comando de actualización (`taskctl actualizar`) que migra la estructura, la config y las tareas de un proyecto de una versión a otra, con simulación previa, idempotente y reversible; primero ToolsaWeb y OpenDockTrading de la 0.16 a la 2.0 |
| RR-15 | **GitHub y GitLab desde la 2.0** | Las mismas garantías en las dos plataformas: rama protegida, pipeline obligatoria, aprobación de una persona, identidad propia del agente. Donde una plataforma o su plan de pago no ofrezca algo, la diferencia se documenta y `doctor` la dice |
| RR-16 | **Instalación fácil en cualquier ordenador** (ejecutable o por internet) | Un ejecutable por sistema (Windows, macOS, Linux) que no necesita Node ni bash, descargable de las releases; instalación con una línea por internet (PowerShell en Windows, shell en macOS/Linux) y por el marketplace de Claude Code para las skills; como única dependencia externa, `git`. Comprobación de versión nueva y actualización con un comando |
| RR-14 | **Se construye con la versión actual de TaskCode** | El plan entero se ejecuta como tareas de TaskCode 0.16 en este repo (`taskctl import`, plan, revisión, finish). La 2.0 sustituye a la 0.16 en TaskCode solo cuando puede llevar su propio desarrollo |

## 1. Uso medido

| | ToolsaWeb | OpenDockTrading | TaskCode |
|---|---|---|---|
| Visibilidad en GitHub | privado | privado | público |
| Tareas (terminadas / planificadas / archivadas) | 403 (159 / 234 / 9) | 96 (40 / 53 / 2) | 132 (118 / 14 / 0) |
| Tareas con dependencias | 363 | 89 | 44 |
| Tareas con sprint ≠ 0 | 354 | 68 | 51 |
| Tipo (feature / fix / hotfix / release) | 397 / 6 / 0 / 0 | 96 / 0 / 0 / 0 | 112 / 20 / 0 / 0 |
| Transiciones en modo automático | 998 de 1024 (97 %) | 260 de 281 (93 %) | 405 de 462 (88 %) |
| Tareas con brainstorm (con unificador) | 161 (148) | 41 (24) | 105 (75) |
| Informes de revisión | 511 | 154 | 209 |
| Tareas con varias revisoras por ronda | 56 | 11 | 0 |
| Revisoras usadas | code-quality, angular-vue, rust-wasm | code-quality, angular-vue, rust-wasm | (una genérica) |
| Tareas con `## Resultado` / `## Coste` / `## Autorrevision` | 159 / 91 / 33 | 40 / 41 / 40 | 126 / 70 / 23 |
| PR en GitHub / issues en GitHub | **0 / 0** | **0 / 0** | **0 / 0** |
| Tags | 0 | 0 | 19 (versiones del plugin) |
| Claves de config | 12 (perfiles de verificación, sincronización, tope de rondas) | 3 | 7 |

Altas de tareas: en ToolsaWeb casi todas llegan **en bloque** desde la
planificación por hitos (`docs/planificacion/hitos.md`): `import` de 5–8
tareas y una alta de 37 tareas de un hito de una vez.

## 2. Lo que el uso real cambia del plan

1. **Nadie usa PR ni issues hoy.** Todo se mergea en local y la persona trabaja
   sola con agentes. Pasar a PR e issues es un cambio de forma de trabajar,
   no solo de herramienta: la migración tiene que ser gradual y empezar por un
   proyecto (piloto).
2. **GitHub no deja aprobar el PR propio.** Si el agente abre los PR con la
   cuenta de Carlos, Carlos no puede aprobarlos. **El agente necesita su propia
   identidad** (una GitHub App o una cuenta de máquina) que firme los commits y
   abra los PR, y la persona aprueba. Esto además resuelve que hoy «persona»
   y «agente» no se distingan (H5 de la auditoría).
3. **El modo automático es el modo normal** (88–97 % de las transiciones).
   Encadenar fases sin preguntar es un requisito central, no una opción. Las
   puertas humanas tienen que ser pocas y valer la pena: aprobar una
   especificación (o un lote) y aprobar el PR.
4. **La planificación a gran escala es núcleo.** ToolsaWeb tiene 234 tareas
   planificadas, 363 con dependencias, hitos y un grafo en Mermaid, y da de
   alta tareas en bloques de hasta 37. El plan v1 lo pasaba por alto: hace falta
   importar en bloque, dependencias, hitos y vista de roadmap.
5. **De Git-Flow se usa la mitad**: `develop` como rama de integración y una
   rama por tarea, sí (todas las tareas); hotfix, release y tags, no (0 en los
   dos proyectos). La 2.0 conserva `develop` + rama por tarea (RR-06) y deja
   release y hotfix como comandos sencillos.
6. **Revisoras por dominio, varias por ronda, y brainstorm con unificador**
   se usan mucho: hay que conservarlos (y acotar su coste, ver la medición de
   redundancia).
7. **Los proyectos extienden el plugin a mano**: estado `05-archivadas` para
   descartadas (no lo conoce el plugin), regeneración de `hitos.md` con
   `comando_sincronizacion`, `verificar.bat` con caché propia. La 2.0 necesita
   **puntos de extensión declarados**, no convenciones de carpetas.
8. **Repos privados con suites pesadas** (`cargo test` de 15 min en Windows):
   los minutos de GitHub Actions cuestan. Hace falta poder usar un **runner
   propio** (la máquina de Carlos, Windows) además de los de GitHub.
9. **El estado en el repo ya ha fallado en la práctica**: en ToolsaWeb un
   revert que viajó con el cierre de TASK-167 borró la tarea TASK-172 y hubo
   que restaurarla a mano.
10. **Funciones sin uso real** en los proyectos: `codex-review`,
    `doctor-deploy`, `verificar-lote`, held-out (`aceptacion/`), `cadena`;
    `trocear` (1 uso) y `--merge-request` (4, solo en TaskCode). Se retiran o
    pasan a extensiones.

## 3. Catálogo de requisitos

> Nota (RR-10): donde la columna «En la 2.0» dice issue, milestone o
> Projects, la fuente de verdad es la carpeta `tareas/` del repo; GitHub es un
> espejo opcional para quien quiera verlo allí. El diseño del estado está en el
> plan (§3, P2).

Prioridad: **I** imprescindible (uso medido alto o sin él no hay producto),
**C** conservar (uso medido bajo pero útil), **E** extensión opcional,
**R** retirar. «2.0» dice cómo se cumple en el plan.

### Planificación

| ID | Requisito | Uso medido | Prio. | En la 2.0 |
|---|---|---|---|---|
| RF-01 | Dar de alta una tarea con título, tipo, objetivo, criterios de aceptación comprobables, etiquetas y complejidad; rechazar un enunciado no listo | todas las tareas | I | `tc new` → issue con formulario y validación |
| RF-02 | Alta en bloque desde un documento de planificación, con dependencias e hito | ToolsaWeb: imports de 5–8 y alta de 37 | I | `tc import` → issues, sub-issues y dependencias en una operación |
| RF-03 | Dependencias entre tareas; saber qué está listo para empezar | 363 / 89 / 44 tareas | I | dependencias de issues de GitHub («blocked by») + `tc next` |
| RF-04 | Hitos o sprints y una vista de roadmap con el grafo de dependencias | `ROADMAP.md` en los tres; `hitos.md` con Mermaid en ToolsaWeb | I | milestones + vista roadmap de Projects; `tc roadmap` genera el grafo bajo demanda (no se commitea en cada fase) |
| RF-05 | Complejidad estimada, propuesta a partir de tareas parecidas | casi todas en ToolsaWeb y TaskCode; nula en OpenDockTrading | C | campo del issue; propuesta por similares |
| RF-06 | Trocear una tarea que pasa de una hora | 1 uso | E | sub-issues |
| RF-07 | Descartar o archivar sin reutilizar el ID, con motivo | 9 + 2 (convención manual `05-archivadas`) | I | cerrar como «not planned» con comentario |
| RF-08 | Pausar («no seguir todavía») | 3 usos | C | etiqueta o estado del tablero |

### Diseño y aprobación

| ID | Requisito | Uso medido | Prio. | En la 2.0 |
|---|---|---|---|---|
| RF-10 | Diseño con brainstorm de roles (arquitectura, riesgos, testing, dominio, rendimiento) y unificador que deja un plan final | 161 / 41 / 105 tareas | I | skill `spec` con roles; resultado en el PR de especificación |
| RF-11 | Aprobación del plan antes de implementar, también en modo automático | todas; 88–97 % automáticas | I | aprobación de una persona en el PR de spec o política de carril que la delega, registrada |
| RF-12 | Recomendar skills y modelo por tarea | 21 / 0 / 2 | E | etiqueta del issue |

### Implementación y flujo

| ID | Requisito | Uso medido | Prio. | En la 2.0 |
|---|---|---|---|---|
| RF-20 | Una rama por tarea, aislada, y límite de trabajo en curso | todas | I | rama + worktree por issue |
| RF-21 | Modos manual, semiautomático y automático con encadenado de fases | 88–97 % automático | I | orquestador que encadena; las puertas humanas, por política |
| RF-22 | Autorrevisión antes de pedir revisión | 33 / 40 / 23 | C | paso del orquestador antes de pedir la revisión |
| RF-23 | Commitear solo lo que escribe la herramienta; nunca `git add -A` | principio de todos los comandos | I | se mantiene |
| RF-24 | Recuperación de estados de Git (diagnose, recover, abort-merge, pause/resume) | sin dato de uso | C | con el merge por PR sobran los de merge local; quedan `tc doctor` y una recuperación determinista de la rama de la tarea |
| RF-25 | Operaciones de Git deterministas ejecutadas por el CLI, no por el agente (RR-01) | los 5 scripts de Git-Flow y todos los comandos de fase | I | capa única de operaciones Git/GitHub en el CLI, con salida para el agente sin ruido |
| RF-26 | Integración en `develop` y `main` solo para releases (RR-06) | todas las tareas se integran en `develop` | I | PR contra `develop`; `tc release` de `develop` a `main` |

### Revisión

| ID | Requisito | Uso medido | Prio. | En la 2.0 |
|---|---|---|---|---|
| RF-30 | Revisión independiente por un agente distinto antes de cerrar | 511 / 154 / 209 informes | I | revisor IA con identidad propia en el PR; check obligatorio |
| RF-31 | Revisoras por dominio según lo que toca el diff, varias por ronda | 56 + 11 tareas; angular-vue, rust-wasm, code-quality (más C#, Java, deploy disponibles) | I | enrutado por dominio en el workflow del revisor |
| RF-32 | Hallazgos CRÍTICO / IMPORTANTE / MENOR con origen (implementación, plan, especificación), en tabla, también los no corregidos | todos los informes | I | hallazgos estructurados (JSON + comentarios); check rojo con bloqueantes |
| RF-33 | Rondas con tope configurable; MENORES corregidos sin otra ronda; ronda extra bajo petición | `tope_rondas` en ToolsaWeb; verificación ligera 2 + 8 | I | rondas incrementales sobre lo cambiado; política de MENORES |
| RF-34 | Segunda opinión con otro modelo (Codex) | 0 usos | R | — (posible extensión) |

### Verificación

| ID | Requisito | Uso medido | Prio. | En la 2.0 |
|---|---|---|---|---|
| RF-40 | Verificación con el comando del proyecto y su timeout | los tres | I | workflow reutilizable que llama al comando del proyecto |
| RF-41 | Perfiles: rápida (freno), selectiva o por impacto, completa, pesada solo en release | ToolsaWeb usa los cuatro | I | perfiles del workflow; la rápida, también en un hook local opcional |
| RF-42 | No repetir una verificación sobre el mismo árbol (memo por huella) | ToolsaWeb repite `cargo test` (~15 min por tarea) | I | caché por SHA en CI, compartida por PR, cola de merge y release |
| RF-43 | Verificación proporcional: lo que solo cambia documentación no paga la suite | `rutas_documentacion` en TaskCode | C | filtros de rutas del workflow |
| RF-44 | Verificación por lote | descartada en ToolsaWeb | R | — |
| RF-45 | Tests held-out de aceptación protegidos del implementador | 0 usos | E | extensión |

### Cierre, publicación y registro

| ID | Requisito | Uso medido | Prio. | En la 2.0 |
|---|---|---|---|---|
| RF-50 | Cerrar integrando en la rama base solo con revisión aprobada y verificación en verde | 159 / 40 / 81 cierres | I | merge del PR por la cola, con rulesets |
| RF-51 | `## Resultado` de cada tarea: qué se hizo, divergencias con el plan, hallazgos no corregidos y por qué | 159 / 40 / 126 | I | sección obligatoria de la descripción del PR (check que la exige) |
| RF-52 | CHANGELOG por tarea y por versión | los tres | I | generado desde los PR al publicar, no en cada cierre |
| RF-53 | Release con tag y notas | 19 tags en TaskCode; 0 en los proyectos | C | `tc release` (tag + notas desde los PR) |
| RF-54 | Merge request / PR en GitHub o GitLab | 4 usos | I (pasa a ser el camino normal) | siempre por PR; GitLab detrás del adaptador |

### Seguimiento y métricas

| ID | Requisito | Uso medido | Prio. | En la 2.0 |
|---|---|---|---|---|
| RF-60 | Tablero por estado, sprint y persona | `BOARD.md` en los tres | I | GitHub Projects + `tc status` |
| RF-61 | Estado en vivo de la fase y progreso x/N (status line) | instalado en la máquina de Carlos | C | `tc status --watch`; progreso de la CI |
| RF-62 | Coste en tokens por fase y por revisor | 91 / 41 / 70 tareas con `## Coste` | C | registro de coste por PR; `tc metrics` |
| RF-63 | Métricas por tarea, fase, versión, grupo y varios repos (duración, rondas, hallazgos, verificaciones) | usadas en las auditorías de 2026-11-10/12/13 | I | `tc metrics` desde la API, con minutos de CI repetidos |
| RF-64 | Doctor de entorno con el arreglo de cada fallo | los tres | I | `tc doctor`, también de rulesets y checks |

### Extensión y convivencia

| ID | Requisito | Uso medido | Prio. | En la 2.0 |
|---|---|---|---|---|
| RF-70 | Regenerar ficheros derivados del proyecto en cada transición (`comando_sincronizacion`) | ToolsaWeb (`hitos.md`, Mermaid) | E | job de CI o hook local con confianza |
| RF-71 | Estados o carpetas propias del proyecto (`05-archivadas`) | ToolsaWeb, OpenDockTrading | E (cubierto por RF-07) | estados del tablero configurables |
| RF-72 | Skills y agentes instalables en cualquier proyecto, sin referencias internas | todos | I | se mantiene |
| RF-73 | Mensajes en español, dirigidos a la persona, con el siguiente paso | todos | I | i18n es/en |
| RF-74 | Auditoría de seguridad antes de publicar una aplicación (`doctor-deploy`) | 0 usos | E | extensión |
| RF-75 | Documentos de contexto con tope de tamaño (`documento_estado`) | solo TaskCode | E | extensión |
| RF-76 | Bloqueo del árbol mientras se encadenan fases (`cadena`) | interno | R | sobra con worktrees y PR |

## 4. Requisitos nuevos que salen del uso real

| ID | Requisito | Motivo |
|---|---|---|
| RN-01 | El agente implementador trabaja con identidad propia (GitHub App o cuenta de máquina): firma commits y abre PR; la persona aprueba | GitHub no deja aprobar el PR propio; distingue persona y agente (H5) |
| RN-02 | Runner propio (self-hosted, Windows) además de los de GitHub, elegible por perfil | repos privados con suites de 15–20 min; coste de minutos |
| RN-03 | Migrar un backlog grande (234 tareas, dependencias, hitos) a issues con un mapa TASK-NNN ↔ #n y sin perder historial | ToolsaWeb y OpenDockTrading |
| RN-04 | Puntos de extensión declarados (estados, derivados, verificación propia, revisoras propias) | los proyectos ya extienden el plugin a mano |
| RN-05 | El estado de las tareas no puede perderse por operaciones de Git (revert, merge, rebase) | TASK-172 borrada por un revert en ToolsaWeb |
| RN-06 | Un proyecto de una sola persona con agentes funciona igual de bien que un equipo | es el uso actual de los tres repos |
