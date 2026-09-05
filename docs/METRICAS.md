# Métricas — Sprint 0 y Sprint 1 (completos)

> Regenerado el 2026-09-05. Sustituye a la versión del 2026-09-03, que solo
> cubría TASK-001, TASK-002 y TASK-003 y se quedó congelada ahí. Este
> documento cubre las **12 tareas cerradas** (TASK-001 a TASK-012), que son
> Sprint 0 completo (TASK-001 a TASK-007) y Sprint 1 completo (TASK-008 a
> TASK-012), tal como los define `PLAN_SPRINTS.md`.
>
> Fuentes: la sección 6 de `PLAN_SPRINTS.md`, la sección `## Resultado` de
> cada `tareas/00-planificadas/TASK-0NN/tarea.md`, `docs/spikes/TASK-007-resultado.md`
> y el historial Git de `develop`. Las cifras de cobertura y de nº de tests
> son las registradas al cerrar cada tarea; **no se han vuelto a ejecutar
> aquí** (este documento se redactó en modo solo-lectura sobre el repo, sin
> lanzar `npm test`). Las cifras de líneas de código, de commits y de tamaño
> de diff sí se han medido directamente sobre el repo al redactarlo.

## 1. Estado del repositorio (dato que la versión anterior daba mal)

La versión anterior de este documento afirmaba, en su sección 5, que «el
repositorio `TaskCode` **todavía no es un repositorio Git**». **Eso ya no es
cierto y no debe seguir citándose.** Estado real, medido hoy:

- Repo Git inicializado el **2026-09-03** (commit inicial `4435d68`, 36
  ficheros, 3270 líneas: metodología, plan de sprints y todo lo que existía
  entonces de Sprint 0).
- Ramas: `main`, `develop` (rama de trabajo activa) y 9 ramas de tarea, una
  por cada tarea de TASK-004 a TASK-012.
- **41 commits en `develop`**, de los cuales 9 son merges `--no-ff` de rama
  de tarea (uno por cada tarea con rama propia).
- **89 ficheros trackeados**. `node_modules/` y `dist/` excluidos vía
  `.gitignore`, igual que `logs/` y `.idea/` (esto último salió del propio
  spike de TASK-007, ver hallazgo 2 allí).
- **Remoto (`origin`) creado el 2026-09-05**: `github.com/charliebk/TaskCode`
  (privado). Hasta ese día todo Sprint 0 y Sprint 1 vivió en un único disco
  sin copia — era el riesgo estructural abierto más serio del proyecto según
  `docs/contexto/INVENTARIO_PENDIENTE.md`, y por eso TASK-021 se adelantó de Sprint 4
  a la Fase A del plan de terminación. Se subieron las 11 ramas (política
  IECA: no se borra ninguna tras el merge) y la rama por defecto del repo
  remoto es `develop`.

## 2. Qué se implementó, tarea por tarea

Las tareas están en orden de ID; el orden **real de ejecución** fue otro
(ver sección 7): TASK-001-003 → 007 → 008 → 009 → 010 → 011 → 012 → 004 →
005 → 006. Sprint 1 se terminó antes que Sprint 0.

| Tarea | Alcance real entregado |
|---|---|
| TASK-001 | Scaffold: `.claude-plugin/plugin.json`, `bin/taskctl`, `package.json` sin dependencias de terceros en runtime, `tsconfig.json` estricto, `npm run build`/`lint`/`test`. |
| TASK-002 | `src/core/frontmatter.ts` (parser/serializador YAML-frontmatter a mano), `src/core/task.ts` (modelo + validación), `src/core/tarea-file.ts`, `src/core/state-machine.ts` (tabla completa de transiciones de la sección 8.1). |
| TASK-003 | `taskctl new` de punta a punta: `src/cli/args.ts`, `src/core/task-id.ts`, `src/fs/task-store.ts`, `src/commands/new.ts`, cableado en `src/cli.ts`. |
| TASK-004 | `taskctl import`: parser determinista y puro (`src/core/import-parser.ts`) + `src/commands/import.ts`. Idempotencia por título normalizado; una entrada malformada no aborta el resto. |
| TASK-005 | `taskctl board`: `src/core/board-format.ts` (módulo puro, cálculo de ancho visual de terminal propio, sin dependencias) + `src/commands/board.ts`, con filtros `--sprint` y `--asignado_a`. |
| TASK-006 | Empaquetado y carga local del plugin. Dos bugs reales de empaquetado corregidos (ver sección 5) y `README.md` del plugin creado desde cero, con el procedimiento correcto (`claude --plugin-dir`, no `/plugin install <ruta-local>`). |
| TASK-007 | Spike (no-código): validación de los `.sh` de Git-Flow en un Bash real contra un repo real. Resultado con reservas explícitas (ver sección 8). Detalle en `docs/spikes/TASK-007-resultado.md`. |
| TASK-008 | Migración de los 23 ficheros Git-Flow a `scripts/gitflow/` del plugin (2389 líneas de Bash), con 3 cambios de lógica acotados en `_gitflow-common.sh` y un smoke test propio (`scripts/gitflow/test/smoke-test.sh`, 85 líneas, 6 comprobaciones). |
| TASK-009 | `taskctl start`: `src/commands/start.ts`, `src/fs/git.ts`, `src/fs/gitflow-runner.ts`, `moveTareaFile` en `task-store.ts`. Además corrigió el guard de `origin` en `create-hotfix.sh` y `create-release.sh` (precondición descubierta al implementar, no solo documentada). |
| TASK-010 | `taskctl plan` (versión mínima, un solo agente, sin brainstorm): mueve a `01-en-diseno/` y deja scaffold de `plan-final.md`. Reutiliza `moveTareaFile` sin modificarla. |
| TASK-011 | `taskctl approve`: checkpoint humano, `plan_aprobado`. Calcula `planFinalExiste` contra el filesystem real y delega la decisión en la máquina de estados de TASK-002. Tercera reutilización de `moveTareaFile` sin tocarla. |
| TASK-012 | Precondición de rama base + workspace limpio (§8.3, pasos 1-4) para `new`, `plan` y `approve`: `isRemoteAvailable`, `localBranchExists`, `resolveMainBranch`, `resolveBaseBranchForTipo`, `ensureBaseBranchReady` en `src/fs/git.ts`. |

## 3. Tamaño y forma del código

Medido hoy sobre el árbol de trabajo (excluyendo `node_modules/` y `dist/`):

| | Al cerrar TASK-003 (2026-09-03) | Hoy (12 tareas) | Crecimiento |
|---|---|---|---|
| `src/` | 1094 líneas, 9 ficheros | **2755 líneas, 18 ficheros** | ×2,5 |
| `test/` | 985 líneas, 8 ficheros | **3453 líneas, 18 ficheros** | ×3,5 |
| Ratio test/código | 0,90 : 1 | **1,25 : 1** | — |
| Scripts Bash (`scripts/gitflow/`) | no existían | **2389 líneas, 24 ficheros `.sh`** (23 migrados + el smoke test) | — |

El ratio de test por línea de código **subió**, no bajó, al pasar de 3 a 12
tareas: se escribió más test por línea de producción en Sprint 1 que en el
arranque. La causa concreta está en la sección 5: buena parte de los tests
nuevos son reproducciones exactas de hallazgos de revisión por pares.

Los ficheros de `src/` más grandes hoy: `src/commands/import.ts` (296),
`src/core/state-machine.ts` (266), `src/fs/git.ts` (248), `src/cli.ts` (246).

**0 dependencias de terceros en runtime** se mantiene tras 12 tareas: el
`package.json` sigue con `typescript` y `@types/node` como únicas
`devDependencies`. El ancho visual de terminal de `taskctl board` (TASK-005)
se implementó a mano en vez de tirar de un paquete, precisamente por esto.

## 4. Tests y cobertura: evolución real

Cifras registradas al cerrar cada tarea, en orden cronológico real:

| Cierre | Tests totales | Nuevos (registrado) | Nuevos (delta real) | Cobertura líneas | Cobertura ramas |
|---|---|---|---|---|---|
| TASK-001/002/003 | 91 | — | — | 98,69% | 95,77% |
| TASK-007 | 91 (sin cambios) | n/a (spike) | 0 | n/a | n/a |
| TASK-008 | 91 (sin cambios) | 1 smoke test Bash, 6 comprobaciones | 0 | n/a (scripts Bash) | n/a |
| TASK-009 | 115 | «15 nuevos» | **+24** | 98,37% | 94,21% |
| TASK-010 | 122 | 7 nuevos | +7 | 98,52% | 94,31% |
| TASK-011 | 131 | 9 nuevos | +9 | 98,76% | 95,31% |
| TASK-012 | 165 | 34 nuevos | +34 | **99,03%** (máximo) | **96,20%** (máximo) |
| TASK-004 | 201 | 36 nuevos | +36 | 96,69% | 95,22% |
| TASK-005 | 226 | «3 nuevos» | **+25** | 96,51% | 94,29% |
| TASK-006 | 226 | 0 nuevos | 0 | 96,51% | 94,29% |

La columna «delta real» es la resta entre totales consecutivos. En dos
tareas no cuadra con el número de tests nuevos que se anotó a mano
(TASK-009 y TASK-005): ver sección 9. Los **totales** sí son consistentes y
verificables.

**Verificación independiente del total de 226**, hecha al redactar este
documento: hay 220 llamadas literales a `test(` en `test/`, más 6 tests
generados en bucle (5 casos de `ROUNDTRIP_CASES` en `tarea-file.test.ts`
desde una sola llamada, es decir +4; y 3 tipos de rama en `start.test.ts`
desde una sola llamada, +2). 220 + 6 = **226**. El número de la tabla es
real, no arrastrado.

Crecimiento total: **de 91 a 226 tests, +148%**, con 18 ficheros de test.

### Sobre la caída de cobertura en TASK-004

La cobertura de líneas bajó de 99,03% a 96,69% justo en TASK-004, y no ha
vuelto a subir. **No es una regresión de calidad.** La causa está
documentada en el `Resultado` de TASK-004: el revisor señaló que `src/cli.ts`
(`main()`, el punto de entrada real) no tenía ningún test que lo invocara, y
que por eso `cli.js` **ni siquiera aparecía en el reporte de cobertura**. Al
añadir el primer test de `main()` el fichero entró por primera vez en la
medición, con 43,88% líneas / 50,00% ramas, y arrastró el promedio global
hacia abajo. Es decir: la métrica empeoró porque **empezó a medir una brecha
que llevaba ahí desde antes de TASK-004 y nadie veía**. Los módulos nuevos
de esa misma tarea llegan a 99,03%/91,49% (`import.js`) y 100%/89,66%
(`import-parser.js`).

Esa brecha sigue abierta: los comandos `new`/`start`/`plan`/`approve`/
`--help`/`--version` no tienen cobertura directa de `main()`.

## 5. Revisión por pares: hallazgos por tarea

Cada tarea de código se revisó con un agente independiente del que la
implementó (`typescript-reviewer` en la primera vuelta, `general-purpose` a
partir de TASK-004/008). En todas las tareas la revisión incluyó
**reproducción empírica** de los hallazgos contra repos Git reales o clones
aislados, no solo lectura del diff.

| Tarea | Críticos | Importantes | Menores | Total | Corregidos | Documentados sin corregir |
|---|---|---|---|---|---|---|
| TASK-001/002/003 (revisión conjunta) | 2 | 4 | 4 | 10 | 9 | 1 |
| TASK-008 | 0 | 0 | 1 | 1 | 1 | 0 |
| TASK-009 | 0 | 3 | 6 | 9 | 8 | 1 |
| TASK-010 | 0 | 0 | 4 | 4 | 4 | 0 |
| TASK-011 | 0 | 0 | 2 | 2 | 1 | 1 (aceptado a propósito) |
| TASK-012 | 2 | 1 | 3 | 6 | 4 | 2 |
| TASK-004 | 1 | 4 | 3 | 8 | 7 | 1 |
| TASK-005 | 0 | 3 | 2 | 5 | 3 | 2 |
| TASK-006 | 0 | 3 | 2 | 5 | 5 | 0 |
| **Total (9 rondas de revisión)** | **5** | **18** | **27** | **50** | **42** | **8** |

TASK-007 no aparece en la tabla porque **no tuvo revisión por pares**: es un
spike, y sus 4 hallazgos son propios del spike, no de un revisor
independiente. Se contabilizan aparte en la sección 5.3.

### 5.1 Los 5 críticos: dónde se concentraron

Los 5 hallazgos críticos de las 12 tareas se concentran en **3 de las 9
rondas de revisión**. Seis rondas terminaron sin ningún crítico.

- **TASK-001/002/003 — 2 críticos.** (a) Un valor string que «parece»
  número/boolean/null (p. ej. el título `"2026"`) se corrompía al releer el
  `tarea.md` y quedaba irreescribible. (b) `readTareaFile` no validaba el ID
  antes de construir la ruta → path traversal (`../../../fuera`). Ambos en
  el corazón del sistema: parser y capa de I/O.
- **TASK-004 — 1 crítico.** `slugify()` colapsa cualquier título sin
  caracteres ASCII alfanuméricos al mismo literal `"tarea"`. Inofensivo como
  nombre de rama (su uso original), pero reutilizado como clave de
  idempotencia de `import` hacía que dos títulos completamente distintos
  (`"日本語のタスク"` y `"!!!???"`) colisionaran **en silencio**: la segunda
  entrada se descartaba como duplicada, violando el criterio de aceptación
  «N tareas bien formadas → N ficheros».
- **TASK-012 — 2 críticos.** Los dos, el mismo error de raíz en dos
  comandos distintos (`approve.ts` y `plan.ts`): la tarea se leía **una sola
  vez, antes** de que `ensureBaseBranchReady` pudiera cambiar de rama, y esa
  lectura ya obsoleta se usaba para escribir después del cambio. Resultado:
  **pérdida de datos real** (sobrescribir en silencio el contenido de la
  rama base con datos viejos) más un `TaskFolderConflictError` espurio. Los
  dos confirmados empíricamente por el revisor.

Dos lecturas honestas de esta distribución:

1. Los críticos aparecen **donde se introduce un concepto nuevo que cruza
   capas**, no donde hay más código: TASK-012 tiene 6 hallazgos y 2 son
   críticos; TASK-008, que movió 2389 líneas de Bash, tuvo 1 hallazgo menor.
   Mover código conocido es barato; introducir "cambiar de rama antes de
   escribir" es caro.
2. El patrón de los 3 críticos de TASK-004 y TASK-012 es idéntico y vale la
   pena nombrarlo: **reutilizar una función correcta en un contexto nuevo
   para el que no fue diseñada**. `slugify()` era correcta para nombrar
   ramas; la lectura única era correcta antes de que existiera el
   auto-switch de rama. Ninguno de los tres es un bug "de escribir mal el
   código".

### 5.2 Corregidos frente a documentados sin corregir

- **42 de 50 hallazgos corregidos en la misma tarea (84%)**, cada uno con su
  test de regresión cuando aplicaba.
- **8 documentados sin corregir (16%)**, y ninguno de ellos es crítico ni
  importante: **los 5 críticos y los 18 importantes se corrigieron todos, sin
  excepción**. Los 8 restantes son menores, y cada uno lleva escrito por qué
  se dejó:
  - TASK-001/002/003: un valor citado terminado en barra invertida podía
    confundir la detección de comentario inline — probabilidad muy baja para
    el dominio (títulos de tarea, no rutas Windows).
  - TASK-004: las listas numeradas (`1. criterio`) no se soportan en el
    import — es el formato tal como se diseñó, no un bug.
  - TASK-005: la columna «Estado» no está en la tabla (el agrupado por
    sección ya lo comunica), y `--asignado_a` no tiene forma de filtrar «sin
    asignar».
  - TASK-009: los matices de Windows nativo con `bash.exe` de Git for
    Windows — no se puede cerrar desde este entorno (ver sección 8).
  - TASK-011: la captura de `TaskFolderConflictError` en `approve` es
    defensiva pero inalcanzable en la práctica; se dejó por consistencia con
    `start`/`plan`.
  - TASK-012: `isRemoteAvailable` se invoca dos veces por `hotfix` (una
    petición de red duplicada, evitable pero a cambio de complicar una firma
    pública ya probada), y la comprobación final de «evidencia, no
    suposición» no tiene cobertura de test porque es casi imposible de
    forzar con Git real sin mocks.

Hay además **3 hallazgos documentados fuera de ese recuento**, porque no
salieron de una revisión sino del propio trabajo, y siguen abiertos hoy:

- **TASK-008:** el mismo bug de «`fetch origin` sin comprobar
  disponibilidad» aparece en 7 scripts más. TASK-009 corrigió 2
  (`create-hotfix.sh`, `create-release.sh`); **quedan 5 sin corregir**
  —`create-develop.sh`, `merge-hotfix-to-main.sh`, `merge-release-to-main.sh`,
  `recover-branch.sh`, `resume-work.sh`—, verificado hoy leyendo los
  ficheros. Los dos `merge-*-to-main` son precondición real de TASK-014.
- **TASK-008:** el bit de ejecución no se conserva en este repo
  (`core.fileMode=false`), así que los `.sh` quedan en `100644`. Mitigado
  documentando que `taskctl` debe invocarlos siempre como
  `bash "$CLAUDE_PLUGIN_ROOT/scripts/gitflow/...sh"`.
- **TASK-012:** un `hotfix` resuelve la rama base a `main`, que puede no
  compartir el historial de `tareas/` con `develop` mientras no exista
  backmerge (TASK-014) — riesgo real de colisión de IDs entre ramas. Es
  consecuencia directa de seguir la §8.3 al pie de la letra.

### 5.3 El spike (TASK-007), contado aparte

4 hallazgos, de los cuales el propio spike clasifica 2 como «reales,
reproducidos» y 2 como «informativos, no bug»:

| # | Clasificación en el spike | Qué pasó después |
|---|---|---|
| 1 | Informativo | `log_dir` asumía una profundidad de carpetas del layout de IntelliJ → corregido en TASK-008 |
| 2 | Real, reproducido | Un repo nuevo sin `logs/` en `.gitignore` se autobloquea en el primer uso de Git-Flow → **corregido en el propio spike** (commit `ba5f682`) |
| 3 | Informativo | Sin TTY, las confirmaciones interactivas caen del lado seguro (cancelan) → condiciona el diseño de `--yes` en TASK-013/014 |
| 4 | Real, reproducido | La familia `merge-*` falla duro sin `origin`, la familia `create-*` no → corregido en TASK-008 para `merge-*-to-develop`; **sigue abierto en los dos `merge-*-to-main`** |

Del hallazgo 4 conviene retener el detalle honesto que el spike deja escrito:
para no dejar el repo a medias, ese merge concreto se completó **a mano con
Git plano**, replicando lo que el script habría hecho. No fue un arreglo del
script.

## 6. Los agregados en una línea

- **50 hallazgos de revisión por pares** en 9 rondas sobre 12 tareas: 5
  críticos, 18 importantes, 27 menores.
- **42 corregidos (84%)**, 8 documentados sin corregir (16%), **todos ellos
  menores**: no queda ni un crítico ni un importante abierto.
- **Los 5 críticos se concentran en 3 rondas** (TASK-001/002/003, TASK-004 y
  TASK-012); 6 de 9 rondas cerraron sin críticos.
- **Media de 5,6 hallazgos por ronda de revisión.** La ronda más limpia fue
  TASK-008 (1 hallazgo menor, migrando 2389 líneas de Bash); la más cargada,
  la primera (10 hallazgos sobre 2079 líneas de TypeScript nuevo).
- **De 91 a 226 tests (+148%)** y de 1094 a 2755 líneas de `src/` (×2,5)
  entre la primera sesión y hoy.
- **Ninguna de las 12 tareas** pasó por su propio ciclo
  `plan → approve → start`: las 12 siguen con `estado: planificada` en su
  frontmatter (ver sección 8).

## 7. Actividad en Git

41 commits en `develop`, 9 merges `--no-ff`, en un único día de trabajo
(2026-09-03) más dos commits de documentación el 2026-09-05. Tamaño de los
diffs por tarea, excluyendo merges:

| Tarea | Commits propios | Inserciones | Borrados |
|---|---|---|---|
| TASK-001/002/003 | 1 (commit inicial, compartido) | 3270 (36 ficheros, incluye metodología y plan) | 0 |
| TASK-007 | 3 | 291 | 10 |
| TASK-008 | 3 | 2542 | 9 |
| TASK-009 | 3 | 1174 | 65 |
| TASK-010 | 3 | 447 | 23 |
| TASK-011 | 3 | 399 | 7 |
| TASK-012 | 3 | 1422 | 162 |
| TASK-004 | 3 | 1257 | 43 |
| TASK-005 | 3 | 746 | 20 |
| TASK-006 | 4 | 477 | 43 |

Dos cosas que se leen aquí y en ningún otro sitio:

- **TASK-001, TASK-002 y TASK-003 no tienen commits propios.** Todo su
  trabajo entró en el commit inicial del repo, porque el repo se inicializó
  *después* de programarlas. Es el único punto del proyecto donde no existe
  trazabilidad Git por tarea.
- **El orden de ejecución no fue el orden de los IDs.** Sprint 1 completo
  (TASK-008 a TASK-012) se cerró **antes** que las tres tareas que faltaban
  de Sprint 0 (TASK-004, 005 y 006). El plan lo refleja en su tabla de la
  sección 6, pero es fácil no verlo: la definición de «hecho» de Sprint 1
  (ciclo `import → plan → approve → start` de punta a punta) no pudo
  cumplirse del todo hasta que TASK-004 aportó el `import`, ya después de
  TASK-012.
- El patrón de commits por tarea es estable desde TASK-009: `tarea(...)` →
  `feat(...)` → `fix(...): aplica hallazgos de revisión por pares`. Ese
  tercer commit existe en **todas** las tareas de TASK-004 en adelante: no
  hubo ninguna tarea que se cerrara sin aplicar hallazgos.

## 8. Lo que estos números NO dicen

Esta sección importa tanto como las anteriores. Nada de lo de arriba
significa lo que parece si se lee sin esto.

**No hay «horas reales», y probablemente nunca las habrá con este formato.**
La columna «Horas reales» de la sección 6 de `PLAN_SPRINTS.md` está vacía en
las 10 filas, con la nota «sesión con agentes, no comparable a horas-persona».
Las estimaciones del plan (24h Sprint 0, 19h Sprint 1) son en horas de
trabajo enfocado de una persona, y el trabajo se ejecutó con agentes en
sesiones que no se miden así. **Comparar lo estimado con lo real es
imposible hoy**, y por tanto la calibración de estimaciones que el plan
promete «con datos reales al cerrar cada sprint» no se ha podido hacer. Si
esa métrica importa, hace falta decidir primero *qué* se mide (¿sesiones?
¿turnos? ¿tokens? — eso último es TASK-023, Sprint 4) en vez de dejar la
columna vacía.

**La validación en Windows nativo sigue pendiente desde TASK-007**, y ya son
seis tareas arrastrándola (TASK-007, 008, 009, 010, 011, 006). Todo lo que
dice este documento sobre los scripts `.sh` y sobre `bin/taskctl` se ha
probado desde el bridge de dispositivo de estas sesiones —una VM Linux—,
nunca desde una sesión de Claude Code real en Windows con IntelliJ, que es
la pregunta exacta que planteaba TASK-007. Quedan **tres preguntas
concretas** sin responder:

1. ¿Corren los `.sh` igual desde el Bash tool de Claude Code en Windows
   nativo (no WSL, no VM puente)?
2. ¿Sobrevive el bit de ejecución de `bin/taskctl` a un checkout nativo de
   Windows, fuera de este bridge?
3. ¿El mecanismo `bin/`-en-PATH aplica también al PowerShell tool cuando no
   hay Git for Windows? La documentación oficial solo lo especifica para el
   Bash tool.

Son unos diez minutos de comprobación real, pero solo se pueden hacer desde
esa sesión. Hasta entonces, cualquier «funciona» de este documento significa
«funciona en Linux, con reservas explícitas en Windows».

**Cobertura alta no es lo mismo que cobertura donde importa.** El 96,51%
global convive con un `cli.js` al 43,88% de líneas: el punto de entrada real
del programa es, con diferencia, lo menos probado del proyecto (ver sección
4). Y varios huecos de rama restantes son deliberados y están justificados
uno a uno en los `Resultado` (los `throw` de re-lanzamiento en
`import.js`/`git.ts`, los rangos Unicode de `isWideCodePoint()`, la
comprobación de evidencia post-checkout de TASK-012). Perseguirlos daría un
número más redondo y ni un bug menos.

**Las 12 tareas siguen en `estado: planificada`.** Ninguna ha pasado por su
propio ciclo `plan → approve → start`: son tareas fundacionales,
bootstrapeadas a mano (Objetivo/Criterios/Resultado editados directamente,
ramas creadas con `create-feature.sh`). Es la paradoja de bootstrapping que
cada `tarea.md` documenta. Consecuencia práctica: **`taskctl board` sobre
este repo muestra las 12 tareas en «Planificadas»** y no refleja en absoluto
el estado real del proyecto. El sistema todavía no se gestiona a sí mismo.

**«Hallazgo» no es una unidad homogénea.** Un crítico de pérdida de datos y
un menor de UX cuentan 1 cada uno en el total de 50. La tabla de la sección
5 separa por severidad justamente para que ese 50 no se use como si fuera
una medida de calidad; el dato con significado es que ningún crítico ni
importante quedó abierto.

**Nueve rondas de revisión, un solo revisor por ronda.** No hay revisión
cruzada ni multi-revisor todavía (eso es TASK-018, Sprint 3). Que una ronda
cierre con 0 críticos significa «ese revisor no encontró críticos», no «no
los hay».

## 9. Discrepancias detectadas al recontar (no corregidas aquí)

Al cuadrar las cifras de `PLAN_SPRINTS.md` con las de cada `tarea.md` y con
el repo aparecen tres desajustes. Se dejan anotados tal cual, sin tocar los
documentos de origen:

1. **TASK-009 dice «15 nuevos» y el delta real es +24** (91 → 115). Su
   propio `Resultado` enumera además 3+4+4+9 = 20 tests nuevos, que tampoco
   son 15. El total (115) sí es correcto.
2. **TASK-005 dice «3 nuevos» y el delta real es +25** (201 → 226). Los 25
   son exactamente `board.test.ts` (13) más `board-format.test.ts` (12); el
   «3» parece referirse solo a los tests de regresión de los 3 hallazgos
   importantes. El total (226) sí es correcto.
3. **TASK-007 aparece en `PLAN_SPRINTS.md` como «4 hallazgos reales, 2
   corregidos en el propio spike»**, mientras que `docs/spikes/TASK-007-resultado.md`
   clasifica 2 de los 4 como «informativo, no bug», y solo uno (el hallazgo
   2, el de `.gitignore`) se corrigió realmente dentro del spike. El
   hallazgo 4 se documentó y se sorteó completando el merge a mano; su
   corrección llegó en TASK-008.

## 10. Qué significa esto para «poder usarlo»

Hoy, desde el repo, funcionan de verdad y contra Git real:
`taskctl new`, `taskctl import`, `taskctl board`, `taskctl plan`,
`taskctl approve` y `taskctl start`. Es decir, el ciclo de entrada completo
—dar de alta tareas (una a una o en masa), verlas, diseñarlas, aprobar el
diseño y arrancar la rama Git-Flow— está cerrado y probado de punta a punta,
con la precondición de rama base y workspace limpio de la §8.3 aplicada.

Lo que **no** existe todavía es la otra mitad: `taskctl review` (TASK-013) y
`taskctl finish` (TASK-014). Sin `finish` no hay merge, ni backmerge, ni
tag, ni `CHANGELOG.md`/`INDEX.md`/`BOARD.md` —que además no existen como
ficheros—, y por tanto **una tarea arrancada con `taskctl start` no se puede
cerrar con el sistema**: hay que terminarla a mano, exactamente como se han
terminado estas 12. Ese es el hito real de usabilidad diaria, y
`docs/contexto/CHECKLIST_TERMINACION.md` lo sitúa en su Fase B.
