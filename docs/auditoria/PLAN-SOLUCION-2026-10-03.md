# Plan de solución — auditoría del 2026-10-03

Convierte el backlog de [`AUDITORIA-2026-10-03.md`](AUDITORIA-2026-10-03.md)
en tareas pequeñas, ordenadas por impacto en tiempo. Cada tarea cumple la
regla que motiva el plan: **objetivo de una o dos frases, como mucho 5
criterios verificables, ficheros nombrados y tamaño S (menos de 2 h) o M
(medio día)**. Ninguna es L: si al planificarla crece, se parte.

## Objetivos medibles

Se miden con los mismos scripts de la auditoría al cerrar cada fase.

| Métrica | Hoy | Objetivo |
|---|---|---|
| Horas de review por tarea (mediana) | 2,0 h | ≤ 1 h |
| Rondas de revisión por tarea (media) | 2,24 | ≤ 1,5 |
| Tamaño de la petición de revisión ronda 1 (mediana) | 46 KB | ≤ 25 KB |
| `taskctl review` / `finish` (procesos `git`) | 26 / 35 | ≤ 15 / ≤ 20 |
| Suite rápida para iterar | no existe (todo son ~11 min) | < 1 min |
| Agentes lanzados en una tarea `simple` | 3 | 1 |

## Decisiones que necesito antes de empezar

| ID | Pregunta | Propuesta por defecto |
|---|---|---|
| A3 | Política de rondas | Sin CRÍTICO ni IMPORTANTE abiertos, una ronda cierra. Si solo se corrigen MENOR, no hay ronda 2 (basta suite en verde y commit). La ronda 2 solo revisa el delta y los hallazgos corregidos. |
| C4 | Complejidad por defecto | Sin `--complejidad`, manda la heurística (no `media` fija). Con un solo rol, ese rol escribe el plan y no se lanza unificador. |

Las tareas F1-T2 y F4-T4 dependen de estas dos decisiones. El resto se
puede empezar ya.

## Cómo se ejecuta

- **Una tarea a la vez** (límite de WIP 1), en el orden de abajo. Dentro de
  cada tarea, los frentes independientes van con agentes en paralelo en la
  misma rama.
- **Una sola ronda de revisión como objetivo.** El revisor corre la suite
  completa una vez; los mutantes, con el fichero de test concreto.
- Cada fase cierra con la medición de su métrica y una línea en
  `docs/contexto/ESTADO.md`.
- La versión sube a **0.2.0** al terminar la Fase 3 (cambia la máquina de
  estados) y a 0.2.x en el resto.

## Fase 1 — Review más barata (sin tocar la máquina de estados)

Lo más rentable: recorta la review desde la siguiente tarea y no cambia el
ciclo de vida.

**F1-T1 · Excluir lo generado del diff de revisión** · S · auditoría A1
- Objetivo: la petición de `taskctl review` deja de embeber `dist/`, lockfiles y `tareas/`; lo excluido aparece solo en un `--stat`.
- Criterios:
  - [ ] Clave opcional `excluir_de_revision: [...]` en `.taskcode/config.yml`, con valor por defecto `[**/dist/**, *.lock, *-lock.*, tareas/**]`.
  - [ ] La petición incluye `git diff --stat` de lo excluido y la orden para pedir su diff.
  - [ ] Regenerar la petición de TASK-031 sobre su rama baja de 325 KB a menos de 100 KB (medido).
  - [ ] Test contra un repo real: un cambio en `dist/` no aparece en el diff embebido y sí en el `--stat`.
- Ficheros: `src/commands/review.ts`, `src/fs/git.ts` (`diffRange`), `src/core/config.ts`.

**F1-T2 · Política de rondas y suite única en las skills** · S · auditoría A3, A4 · *depende de la decisión A3*
- Objetivo: las skills de flujo y de revisión dicen cuándo basta una ronda y cuántas veces se corre la suite.
- Criterios:
  - [ ] `task-workflow/SKILL.md` recoge la política A3 en lugar de «dos rondas es normal».
  - [ ] Las 4 skills revisoras piden la suite completa **una vez** por ronda y los mutantes con `node --test <fichero>`.
  - [ ] Con varios revisores en paralelo, instrucción de concurrencia reducida.
  - [ ] Los tests de las skills siguen en verde (incluido «no mencionar el proyecto»).
- Ficheros: `skills/*/SKILL.md`.

**F1-T3 · Veredicto sin fricción e informe estructurado** · S · auditoría A5, A6, D8
- Objetivo: el veredicto se escribe con un comando y el informe trae una tabla de hallazgos que una máquina puede leer.
- Criterios:
  - [ ] `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados` sustituye la línea del informe de mayor N.
  - [ ] El scaffold de `informe-revision-N.md` trae la tabla `| ID | Severidad | Estado | Fichero |`.
  - [ ] El parser de `finish` acepta `**aprobada**` (sin aflojar nada más: «no aprobada» sigue fallando, con test).
  - [ ] Test del comando contra un repo real.
- Ficheros: `src/commands/review.ts` (scaffold), `src/commands/finish.ts` (parser), `src/cli.ts`, comando nuevo.

**Cierre de la Fase 1:** medir el tamaño de la petición y las horas de review de la siguiente tarea real.

## Fase 2 — Git-Flow más rápido

Abarata cada `start`, `review` y `finish`, y de rebote un tercio de la suite.

**F2-T1 · Logging de Git-Flow sin procesos** · S · auditoría B1
- Objetivo: el log de los scripts deja de lanzar un subshell y un `date` por línea.
- Criterios:
  - [ ] `_gitflow-common.sh` usa `printf -v ts '%(%Y-%m-%d %H:%M:%S)T' -1` y `printf -v` en lugar de `$(date)` / `$(_do_log)`.
  - [ ] `update-feature.sh` en un repo temporal: tiempo antes/después medido y anotado (hoy ~11 s con carga).
  - [ ] Salida y fichero de log idénticos byte a byte (salvo la hora) en un caso de prueba.
  - [ ] Tests de `test/gitflow/` en verde.
- Ficheros: `scripts/gitflow/_gitflow-common.sh`.

**F2-T2 · Una sola detección de origin, con timeout** · S · auditoría B2, D9
- Objetivo: cada invocación detecta `origin` una vez, sin esperar más de 5 s, y todos los scripts distinguen «sin origin» de «origin caído».
- Criterios:
  - [ ] `detect_origin_available` cachea su resultado por invocación; `update-feature.sh` deja de reimplementarla.
  - [ ] `git ls-remote` con límite de 5 s (portátil en Git Bash y Linux).
  - [ ] `merge-feature-to-develop.sh` aplica la misma guarda que los de `main`.
  - [ ] Test con un origin inalcanzable: el comando responde en menos de 10 s.
- Ficheros: `scripts/gitflow/_gitflow-common.sh`, `update-feature.sh`, `merge-feature-to-develop.sh`.

**F2-T3 · Menos llamadas `git` en los comandos** · S · auditoría B6
- Objetivo: quitar las llamadas repetidas (`branch --show-current` ×3, `add -A` ×2…) sin cambiar el comportamiento.
- Criterios:
  - [ ] `finish` baja de 35 a 20 o menos procesos `git` y `review` de 26 a 15 o menos (medido con `GIT_TRACE2_EVENT`).
  - [ ] Suite en verde sin tocar expectativas.
- Ficheros: `src/commands/*.ts`, `src/fs/git.ts`, `src/fs/git-commit.ts`.

## Fase 3 — Revisión incremental (versión 0.2.0)

**F3-T1 · `taskctl review` para la ronda N≥2** · M · auditoría A2, D3
- Objetivo: desde `en-revision`, `review` genera la ronda N+1 con el diff desde la última ronda y los hallazgos pendientes de la anterior.
- Criterios:
  - [ ] Transición `en-revision → en-revision` permitida solo si el último informe dice `cambios-solicitados` o `aprobada con correcciones`.
  - [ ] `review` escribe `ultimo_commit_revisado` en cada ronda; la ronda N+1 embebe `ultimo_commit_revisado..HEAD` (con las exclusiones de F1-T1).
  - [ ] La petición lista los hallazgos de la tabla del informe anterior (F1-T3) que no están cerrados.
  - [ ] Los mensajes de error dejan de mandar a `start` → `plan` en círculo.
  - [ ] Test que encadena ronda 1 → cambios → ronda 2 contra un repo real.
- Ficheros: `src/core/state-machine.ts`, `src/commands/review.ts`, `src/fs/rondas.ts`.
- Depende de: F1-T1, F1-T3.

## Fase 4 — Tareas concretas y acotadas desde su creación

**F4-T1 · `new` con objetivo y criterios** · S · auditoría C1
- Objetivo: una tarea nace con su objetivo y sus criterios, sin editar el fichero después.
- Criterios:
  - [ ] `taskctl new --objetivo "<texto>" --criterio "<texto>"` (repetible) escribe ambas secciones.
  - [ ] `taskctl new --desde <fichero fuera del repo>` toma objetivo y criterios de un markdown.
  - [ ] Sin esos flags el comportamiento es el de hoy.
- Ficheros: `src/commands/new.ts`, `src/core/tarea-body.ts`.

**F4-T2 · Validación antes de `plan` y puertas de cierre** · M · auditoría C2, C6, D5
- Objetivo: `plan` se niega a planificar una tarea mal definida, y `approve`/`finish` se niegan a pasar esqueletos vacíos.
- Criterios:
  - [ ] `plan` aborta (sin mover la tarea) si el objetivo está vacío, si hay 0 criterios o más de 8, o si alguno está vacío.
  - [ ] Lint de verificabilidad: cada criterio cita un comando, una ruta, un número, código entre comillas invertidas o un test; «mejorar», «robusto», «correctamente» solos se rechazan con el motivo.
  - [ ] `approve` rechaza un `plan-final.md` con todas las secciones vacías.
  - [ ] `finish` avisa de las casillas sin marcar fuera de `### Tras el cierre`.
  - [ ] Probado sobre las 17 tareas cerradas: se listan las que habrían sido rechazadas y por qué (calibración, no regresión).
- Ficheros: `src/commands/plan.ts`, `approve.ts`, `finish.ts`, `src/core/tarea-body.ts`.

**F4-T3 · Partición propuesta de tareas grandes** · M · auditoría C3
- Objetivo: con más de 12 criterios o varios frentes `###`, `plan` aborta y deja propuesta una partición lista para `import`.
- Criterios:
  - [ ] Detección por número de criterios y por subsecciones del Objetivo.
  - [ ] Escribe un fichero de `import` fuera del repo con una tarea por frente y lo nombra en el error.
  - [ ] Test con una tarea de dos frentes (el caso de TASK-030).
- Depende de: F4-T2 y del arreglo D2 (F5-T2).

**F4-T4 · Complejidad por defecto y un rol sin unificador** · S · auditoría C4 · *depende de la decisión C4*
- Objetivo: una tarea `simple` lanza un agente, no tres.
- Criterios:
  - [ ] Sin `--complejidad` declarado, el número de roles lo decide la heurística.
  - [ ] Con 1 rol, `plan` no escribe la petición de unificador y el rol escribe `plan-final.md`.
  - [ ] Tests de `plan-brainstorm` actualizados con la nueva expectativa y su motivo.
- Ficheros: `src/commands/new.ts`, `import.ts`, `src/core/roles-brainstorm.ts`, `plan-brainstorm.ts`.

## Fase 5 — Bugs

**F5-T1 · `rama_base` de punta a punta** · S · auditoría D1
- Criterios:
  - [ ] Los scripts de Git-Flow reciben la rama base (`--develop <rama>`) y `finish.ts:65` deja de fijar `develop`.
  - [ ] Test: con `rama_base: dev`, `new → plan → approve → start → review → finish` termina.

**F5-T2 · Secciones con `###` y criterios multilínea** · S · auditoría D2, D7
- Criterios:
  - [ ] `extraerSecciones` no corta el Objetivo ni los criterios en un `###`; `### Tras el cierre` se reconoce como subsección.
  - [ ] `import` acepta la continuación sangrada de un criterio, igual que `tarea-body.ts`.
  - [ ] Tests con criterios agrupados en `### Parser` / `### CLI`.

**F5-T3 · Flags desconocidos y mensajes de `review`** · S · auditoría D4, D6, D10
- Criterios:
  - [ ] Un flag desconocido aborta con la lista de flags válidos (y sugerencia, como en config).
  - [ ] La salida de `review` nombra el agente y la skill por separado y usa `modelo_sugerido`.
  - [ ] `codex-review.ts` reutiliza los helpers de `finish.ts` en lugar de duplicarlos.

## Fase 6 — Suite, skill y telemetría

**F6-T1 · Suite rápida y repo plantilla** · M · auditoría B3, B4, B7
- Criterios:
  - [ ] `npm run test:rapido` (core, cli; sin procesos) en menos de 1 min; `npm test` sigue siendo la suite completa.
  - [ ] Helper compartido que crea el repo base una vez por fichero y lo copia con `fs.cp`; adoptado en los 5 ficheros más lentos.
  - [ ] Medición con y sin `--experimental-test-coverage` anotada; si compensa, `test:cov` aparte.

**F6-T2 · Partir los ficheros de test más largos** · M · auditoría B5
- Criterios:
  - [ ] `start`, `finish`, `review`, `sincronizacion` y `gitflow` divididos o con concurrencia interna.
  - [ ] Tiempo de la suite completa antes/después medido sin carga.

**F6-T3 · Skill más ligera** · S · auditoría E1, E2, E3
- Criterios:
  - [ ] `task-workflow/SKILL.md` por debajo de 15 KB; sincronización, post-cierre y prerrequisitos pasan a ficheros de referencia que se cargan bajo demanda.
  - [ ] Descripciones de las 5 skills por debajo de 300 caracteres cada una, sin perder los disparadores reales.
  - [ ] El contenido genérico repetido en las 4 revisoras vive en un solo sitio.

**F6-T4 · Metadatos del plugin y modelo de los agentes** · S · auditoría E4, E5
- Criterios:
  - [ ] `plugin.json` con `displayName`, `repository`, `license` y `keywords`; `claude plugin validate` limpio.
  - [ ] README con instalación y actualización (`claude plugin marketplace update`, `claude plugin update`, reiniciar).
  - [ ] Decisión documentada sobre `model:` en los agentes de brainstorm, con el ID de modelo comprobado en la documentación actual.

**F6-T5 · Telemetría de fases y recalibrado de la heurística** · M · auditoría B8, C5
- Criterios:
  - [ ] Cada transición escribe su marca de tiempo en el frontmatter; `taskctl metricas` saca la tabla de fases por tarea.
  - [ ] Heurística recalibrada con las tareas cerradas, usando las rondas como coste real; se quitan las claves que nada lee (`tolerancia_*`, `modelo_consulta_discrepancia`).

## Resumen

| Fase | Tareas | Tamaño | Lo que se nota |
|---|---|---|---|
| 1 · Review más barata | 3 | 3 S | Peticiones más pequeñas y menos rondas desde la siguiente tarea |
| 2 · Git-Flow más rápido | 3 | 3 S | Cada `start`/`review`/`finish` más corto; suite más rápida |
| 3 · Revisión incremental | 1 | 1 M | La ronda 2 sale del CLI y solo mira el delta |
| 4 · Tareas acotadas | 4 | 2 S + 2 M | Tareas que nacen definidas; las grandes se parten |
| 5 · Bugs | 3 | 3 S | `rama_base`, `###` y flags mal escritos |
| 6 · Suite, skill, telemetría | 5 | 2 S + 3 M | Iterar en segundos; skill más barata; métricas sin arqueología |
| **Total** | **19** | **13 S + 6 M** | |
