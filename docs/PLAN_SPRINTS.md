# Plan de Sprints — TaskCode (`taskctl`)

> Complementa a `PROPUESTA_METODOLOGIA.md` (diseño, v15). Este documento deja de
> ser diseño puro: es el plan de ejecución para construir el plugin y empezar
> a usarlo. A partir de aquí, TaskCode se dogfoodea a sí mismo — las tareas
> de este mismo plan viven como carpetas en `tareas/00-planificadas/`
> siguiendo su propia plantilla (sección 4 de la metodología).

## 0. Principios de ejecución

- **Dogfooding desde el sprint 0.** Las tareas de este plan se gestionan con
  la misma carpeta `tareas/` que usará cualquier equipo. No hay un "modo
  meta" especial.
- **Agentes por pares.** Cada tarea de código se implementa con un agente
  implementador y se revisa con un agente revisor independiente antes de
  darse por cerrada (igual que dice la instrucción original del proyecto).
  En Sprint 0 el revisor es genérico (calidad de TypeScript, cobertura de
  tests, edge cases); a partir de Sprint 3, cuando exista el catálogo de
  skills, se sustituye por el agente especializado que le corresponda por
  dominio.
- **Tests reales, no de relleno.** Cada comando y cada función de la máquina
  de estados lleva tests unitarios que fallan si el comportamiento cambia.
  Nada se marca "terminado" con tests en rojo o sin tests.
- **Cero dependencias externas en Sprint 0.** `taskctl` arranca sin `npm
  install` de terceros (ni `js-yaml`, ni `commander`, ni `gray-matter`):
  parser YAML-frontmatter y parser de argumentos hechos a mano. Motivo:
  economía de tokens/tiempo (nada de resolver versiones ni auditar
  dependencias) y no depender de que el registro npm esté accesible en la
  máquina de cada persona del equipo. Se reevalúa en Sprint 4 si hace falta
  algo más (p. ej. una librería de tablas para `taskctl board`).
- **Métricas desde el primer commit.** Cada tarea cerrada registra en su
  `tarea.md` cobertura de tests, nº de tests y una estimación de tokens
  gastados en su fase de diseño (cuando aplique). Esto alimenta la sección
  16 de la metodología con datos reales en vez de estimaciones.
- **Estimación.** En horas de trabajo enfocado, para una persona. Son
  estimaciones de planificación, no compromisos — se corrigen con datos
  reales al cerrar cada sprint (ver sección 6).

## 1. Sprint 0 — Fundamentos de `taskctl`

**Objetivo:** tener un CLI instalable, con la máquina de estados y el
modelo de datos de tarea totalmente probados, y `new`/`import`/`board`
funcionando sobre el sistema de ficheros. Sin Git-Flow todavía, sin
brainstorm, sin agentes en tiempo de ejecución.

| ID | Tarea | Estimación | Depende de |
|---|---|---|---|
| TASK-001 | Scaffold del proyecto: `plugin.json`, `bin/taskctl`, `tsconfig.json`, runner de tests, lint básico | 3h | — |
| TASK-002 | Modelo de tarea + parser/writer de `tarea.md` (frontmatter) + máquina de estados (tabla de transiciones §8.1) | 6h | TASK-001 |
| TASK-003 | `taskctl new` (alta individual) | 3h | TASK-002 |
| TASK-004 | `taskctl import` (alta masiva desde Markdown) — parseo determinista + fallback de reparación por LLM documentado pero no implementado aún (solo el punto de extensión) | 5h | TASK-002 |
| TASK-005 | `taskctl board` (listado de tareas por estado, plantilla de salida) | 2h | TASK-002 |
| TASK-006 | Empaquetado del plugin y validación de carga local (`/plugin install` desde carpeta local) | 3h | TASK-001 |
| TASK-007 | Spike de validación (no-código): confirmar que los `.sh` de Git-Flow existentes corren sin modificar vía la herramienta Bash de Claude Code en Windows/IntelliJ (ruta corta 8.3, `bash.exe` de Git for Windows) | 2h | — |

**Total estimado Sprint 0: ~24h.**

**Definición de "hecho" para Sprint 0:**
- `npm test` en verde, cobertura ≥ 85% en `src/core/` (máquina de estados y
  parser, que son el corazón del sistema).
- `taskctl new`, `taskctl import`, `taskctl board` ejecutables de punta a
  punta contra una carpeta `tareas/` real (se prueba contra la del propio
  repo TaskCode).
- Cada tarea revisada por un agente distinto del que la implementó, con al
  menos un hallazgo real registrado o un "sin hallazgos" explícito.
- TASK-007 resuelto con evidencia (captura o log), no supuesto.

## 2. Sprint 1 — Integración Git-Flow real

**Objetivo:** los scripts `.sh` ya existentes (de `runConfigurations.zip`)
viven dentro del plugin y `taskctl start`/`plan`/`approve` ya mueven tareas
de carpeta de verdad, con la precondición de rama base limpia (§8.3).

| ID | Tarea | Estimación | Depende de |
|---|---|---|---|
| TASK-008 | Migrar scripts Git-Flow a `scripts/gitflow/` del plugin, sin tocar su lógica interna | 4h | TASK-006, TASK-007 |
| TASK-009 | `taskctl start`: crea rama vía `create-tipo.sh`, mueve tarea a `02-en-curso/` | 5h | TASK-002, TASK-008 |
| TASK-010 | `taskctl plan` (versión mínima: un solo agente redacta `plan-final.md`, sin brainstorm paralelo todavía) | 4h | TASK-002 |
| TASK-011 | `taskctl approve` (checkpoint humano, campo `plan_aprobado`) | 2h | TASK-010 |
| TASK-012 | Precondición de rama base + workspace limpio (§8.3), con auto-switch si está limpio | 4h | TASK-009 |

**Total estimado Sprint 1: ~19h.**

**Definición de "hecho":** un ciclo `import → plan → approve → start` real,
de punta a punta, deja una rama Git creada de verdad y la tarea en
`02-en-curso/`, con la máquina de estados rechazando el orden incorrecto
(tests que prueban explícitamente los casos de error de §8.1 y §9 de la
metodología, no solo el camino feliz).

## 3. Sprint 2 — Ejecución y revisión

| ID | Tarea | Estimación | Depende de |
|---|---|---|---|
| TASK-013 | `taskctl review`: `update-tipo.sh` + un solo agente revisor (sin fragmentación por dominio aún) | 5h | TASK-012 |
| TASK-014 | `taskctl finish`: merge/backmerge/tag + actualización de `CHANGELOG.md`, `INDEX.md`, `BOARD.md` | 5h | TASK-013 |
| TASK-015 | Límite de WIP por persona (§8.2: una tarea en `01-en-diseno` y una rama abierta) | 3h | TASK-009 |

**Total estimado Sprint 2: ~13h.**

## 4. Sprint 3 — Brainstorm multi-agente y enrutado avanzado

| ID | Tarea | Estimación | Depende de |
|---|---|---|---|
| TASK-016 | Brainstorm paralelo por roles + agente unificador (sustituye al `plan` mínimo de TASK-010) | 8h | TASK-010 |
| TASK-017 | Catálogo de skills determinista + selección en dos pasos (LLM solo en empate) | 6h | TASK-010 |
| TASK-018 | Enrutado de revisor por diff real, multi-reviewer fragmentado por dominio (§16.5, límite ~3 dominios) | 6h | TASK-013 |
| TASK-019 | Revisión ligera (checklist, sin agente) para tareas `trivial`/`simple` (§16.6) | 3h | TASK-013 |
| TASK-020 | `taskctl codex-review` opcional | 5h | TASK-013 |

**Total estimado Sprint 3: ~28h.**

## 5. Sprint 4 — Marketplace y pulido

| ID | Tarea | Estimación | Depende de |
|---|---|---|---|
| TASK-021 | Crear repo `taskcode-marketplace` en GitHub, publicar v0.1.0 | 3h | TASK-006 |
| TASK-022 | Documentación de equipo + invitar colaboradores al repo privado | 2h | TASK-021 |
| TASK-023 | Métricas de coste en tokens por fase (§16), volcado a `tareas/*/tarea.md` y agregación en `docs/METRICAS.md` | 5h | TASK-014 |

**Total estimado Sprint 4: ~10h.**

## 6. Métricas del propio plan (a rellenar con datos reales)

Esta tabla se actualiza al cerrar cada sprint, no se estima de antemano
salvo la primera fila:

| Sprint | Tareas cerradas | Horas reales | Cobertura tests | Nº tests | Hallazgos en revisión por pares |
|---|---|---|---|---|---|
| 0 (parcial) | TASK-001, TASK-002, TASK-003 | — (sesión con agentes, no comparable a horas-persona) | 98.69% líneas / 95.77% ramas | 91 | 10 (9 corregidos, 1 documentado como limitación conocida) |
| 0 (spike) | TASK-007 | — | n/a (smoke test funcional, no unitario) | — | 4 hallazgos reales, 2 corregidos en el propio spike |
| 1 (parcial) | TASK-008 | — | n/a (scripts Bash) | 1 smoke test, 6 comprobaciones | 1 menor (corregido); 2 hallazgos nuevos documentados sin corregir (mismo bug de `origin` en 7 scripts más; bit ejecutable no se conserva en este repo) |
| 1 (parcial) | TASK-009 | — | 98.37% líneas / 94.21% ramas (`taskctl` completo) | 115 (24 nuevos) | 0 críticos; 3 importantes (corregidos); 6 menores (5 corregidos, 1 pendiente de validación en Windows nativo, igual que TASK-007/008) |
| 1 (parcial) | TASK-010 | — | 98.52% líneas / 94.31% ramas (`taskctl` completo) | 122 (7 nuevos) | 0 críticos; 0 importantes; 4 menores (todos corregidos) |
| 1 (parcial) | TASK-011 | — | 98.76% líneas / 95.31% ramas (`taskctl` completo) | 131 (9 nuevos) | 0 críticos; 0 importantes; 2 menores (todos corregidos) |
| 1 (completo) | TASK-012 | — | 99.03% líneas / 96.20% ramas (`taskctl` completo) | 165 (34 nuevos) | 2 críticos; 1 importante (los 3 corregidos); 3 menores (1 corregido, 2 documentados sin corregir) |
| 0 (parcial) | TASK-004 | — | 96.69% líneas / 95.22% ramas (`taskctl` completo) | 201 (36 nuevos) | 1 crítico; 4 importantes (los 5 corregidos); 3 menores (2 corregidos, 1 documentado sin corregir) |
| 0 (parcial) | TASK-005 | — | 96.51% líneas / 94.29% ramas (`taskctl` completo) | 226 (25 nuevos) | 0 críticos; 3 importantes (los 3 corregidos); 2 menores (documentados sin corregir) |
| 0 (completo) | TASK-006 | — | 96.51% líneas / 94.29% ramas (`taskctl` completo, sin cambios: TASK-006 es empaquetado/documentación, no lógica de comandos) | 226 (0 nuevos) | 0 críticos; 3 importantes (los 3 corregidos, todos de precisión documental); 2 menores (los 2 corregidos) |
| 2 (parcial) | TASK-013 | — | 95.99% líneas / 93.45% ramas (`taskctl` completo) | 247 (11 nuevos) | 0 críticos; 2 importantes (corregidos); 3 menores (2 corregidos, 1 documentado sin corregir) |
| 2 (parcial) | TASK-014 | — | 95.49% líneas / 93.09% ramas (`taskctl` completo) | 266 (19 nuevos) | 1 crítico; 2 importantes; 4 menores (los 7 corregidos) |
| 2 (parcial) | TASK-026 | — | 97.54% líneas / 94.27% ramas (`taskctl` completo) | 417 (30 nuevos) | 0 críticos; 2 importantes (corregidos); 7 menores (5 corregidos, 2 documentados sin corregir) |
| 2 (parcial) | TASK-027 | — | 97.56% líneas / 94.35% ramas (`taskctl` completo) | 429 (12 nuevos) | Ronda 1: 0 críticos; 1 importante (corregido); 4 menores (3 corregidos y el #4 solo en su parte (b) — la (a) documentada sin corregir: el `rename` de la migración no tiene un equivalente exclusivo del flag `'wx'`, POSIX no lo ofrece). Ronda 2: 0 críticos; 1 importante (corregido: el fix de la ronda 1 era solo de Windows, `ENOTDIR` en POSIX rompía el job `ubuntu-latest`); 3 menores (los 3 corregidos). Veredicto final: aprobada |
| 2 (parcial) | TASK-028 | — | 97.50% líneas / 93.89% ramas (`taskctl` completo) | 444 (15 nuevos) | Ronda 1 (cambios solicitados): 0 críticos; 1 importante (corregido: `CLAUDE.md` decía 429 tests y en esta rama son 444 — la cifra se midió en `develop`, antes de los 15 tests de la propia tarea); 5 menores (los 5 corregidos, el sustancial: la skill callaba que la rama base es literalmente `develop`, hardcodeada en `git.ts`). Ronda 2: 0 críticos; 0 importantes; 1 menor documentado sin corregir (en un clon recién hecho no hay CLI —`dist/` ignorado y sin `bin` declarado—: preexistente, de empaquetado, abierto como item E6). Veredicto final: aprobada |
| 2 (parcial) | TASK-029 | — | 97.67% lineas / 94.18% ramas (`taskctl` completo) | 472 (31 nuevos) | Ronda 1 (cambios solicitados): 0 criticos; 2 importantes (`diagnose-repo.sh` decia "Sin operaciones en curso" con un cherry-pick a medias, contradiciendo a `abort-merge` sobre el mismo repo; y `abort-merge` afirmaba haber restaurado el estado previo en el caso del sequencer huerfano, donde Git no rebobina nada), los 2 corregidos; 5 menores, los 5 corregidos. Ronda 2: 0 criticos; 0 importantes; 2 menores corregidos, uno de ellos una imprecision del mensaje de commit (afirmaba que los 4 tests nuevos fallan con el codigo anterior, y uno pasa). Veredicto final: aprobada |

Detalle completo en `docs/METRICAS.md` y `docs/spikes/`. **Sprint 0
completo** (TASK-001 a TASK-007) y **Sprint 1 completo** (TASK-008 a
TASK-012). TASK-006 corrigió dos bugs reales de empaquetado — el bit de
ejecución de `bin/taskctl` no sobrevivía a un `git clone` (Git lo
trackeaba en modo `100644`) y `plugin.json` tenía un campo `commands` con
un tipo no soportado (objeto en vez de `string | array`, que según la
documentación oficial puede hacer fallar la carga completa del plugin) —
y documentó en su README el procedimiento de instalación local correcto
(`claude --plugin-dir`, no `/plugin install <ruta-local>` como decía el
texto original de la tarea). Quedan dos preguntas abiertas sin resolver,
explícitas en ese README: si el mecanismo `bin/` en PATH aplica también
al PowerShell tool (no solo al Bash tool) en Windows nativo sin Git for
Windows, y si el bit de ejecución sobrevive un checkout nativo de Windows
fuera de este bridge de dispositivo — ninguna bloquea el cierre de
TASK-006 ni de Sprint 0. La definición de "hecho" de la sección 2 (ciclo
`import → plan → approve → start` real, de punta a punta, con rama Git de
verdad) se cumple por completo desde TASK-004 — los cuatro comandos del
ciclo existen y están probados contra Git real.

## 7. Riesgos y supuestos abiertos que bloquean sprints concretos

- ~~**TASK-007 (Sprint 0):** si los scripts `.sh` no corren sin modificar en
  Windows vía Bash de Claude Code, Sprint 1 se retrasa hasta adaptar el
  wrapper.~~ **RESUELTO (2026-09-05)**: el job `windows-latest` del CI corre
  el smoke test de Git-Flow bajo Git Bash sobre un checkout nativo de
  Windows y pasa en verde. También quedan confirmados el bit de ejecución de
  `bin/taskctl` y su resolución como comando suelto por PATH. La reserva que
  arrastraban TASK-006/007/008/009/010/011 queda cerrada con evidencia.
- **TASK-006 (Sprint 0, cerrada) → TASK-021 (Sprint 4):** el mecanismo
  determinista para que `taskctl` mismo compruebe programáticamente qué
  plugins/skills están instalados localmente (punto 11, sección 14 de la
  metodología) sigue sin confirmarse con documentación oficial —
  investigado en TASK-006 sin encontrar nada en `plugins-reference`,
  `plugins`, `plugin-marketplaces` ni `setup`. No bloquea Sprint 0-3, sí
  condiciona cómo se implementa la sugerencia automática de instalación
  desde marketplace. Relacionado, nuevo en TASK-006: sigue sin
  confirmarse si el mecanismo `bin/` en PATH (el que expone `taskctl`
  como comando) aplica también al PowerShell tool de Windows nativo (solo
  está documentado para el Bash tool), ni si el bit de ejecución de
  `bin/taskctl` sobrevive un checkout nativo de Windows fuera de este
  bridge de dispositivo — ver `taskcode-marketplace/plugins/taskcode-plugin/README.md`.
- **Sprint 3 completo** depende de tener datos reales de Sprint 0-2 para
  calibrar los pesos de la heurística de complejidad (sección 16.1) — se
  usan los pesos propuestos como punto de partida, no como definitivos.
- ~~Nuevo, detectado al programar TASK-001-003: el repositorio `TaskCode`
  todavía no es un repositorio Git.~~ **Resuelto (2026-09-03):** repo
  inicializado, primer commit en `main` (36 ficheros, todo Sprint 0 +
  metodología + plan), rama `develop` creada desde `main` y activa como
  rama de trabajo por defecto. `node_modules/` y `dist/` excluidos vía
  `.gitignore`. Identidad de commit configurada localmente para este
  repo (`charlie.bk <charlie.bk@gmail.com>`, no global — cámbiala con
  `git config user.name/user.email` si prefieres otra). Sin remoto
  todavía (eso es TASK-021, Sprint 4). TASK-007/008/009 ya pueden
  arrancar.

## 8. Qué se entrega ya en este mismo turno

Arrancamos Sprint 0 en firme: TASK-001 (scaffold) y TASK-002 (máquina de
estados + parser, con tests unitarios reales) se implementan y se dejan
funcionando en tu máquina ahora mismo, revisados por un agente independiente
antes de entregarse. El resto de tareas de Sprint 0 (TASK-003 a TASK-007)
quedan creadas como tareas en `tareas/00-planificadas/`, listas para
continuar en la próxima sesión de trabajo.
