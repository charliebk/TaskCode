# Plan — TaskCode 2: un plugin profesional para equipos

> Redactado el 2026-11-13 a partir de la auditoría externa
> ([AUDITORIA-EXTERNA-2026-11-13.md](../auditoria/AUDITORIA-EXTERNA-2026-11-13.md)),
> la medición de la 0.16 ([EFECTO-016-2026-11-13.md](../auditoria/EFECTO-016-2026-11-13.md))
> y una revisión de proyectos parecidos que ya funcionan. Es una propuesta:
> las decisiones marcadas como **[DECIDE CARLOS]** se toman antes de empezar
> la fase que las necesita.

## 1. El diagnóstico en una frase

TaskCode 0.16 tiene buenas ideas (planificar antes de codificar, revisión
independiente, evidencia antes de cerrar, métricas), pero **sus garantías son
instrucciones al agente, no reglas que algo externo haga cumplir**. Un agente
puede aprobar en nombre de una persona, cerrar sin revisión o saltarse la
verificación, y el estado vive en ficheros que chocan en cuanto trabajan dos
personas. Eso no se arregla con más reglas en el plugin, sino **sacando las
garantías del plugin hacia donde el agente no tiene permiso**: la plataforma
(GitHub) y la CI.

## 2. Qué existe y qué podemos aprender

| Proyecto | Qué hace bien | Su límite (lo que no hay que copiar) |
|---|---|---|
| [GitHub Spec Kit](https://github.github.com/spec-kit/) (~100 k estrellas, multiagente, Windows/macOS/Linux) | Fases Specify → Plan → Tasks → Implement con un artefacto por fase; presets y extensiones; funciona con Claude Code | Sus puertas son prompts y checklists; los artefactos pueden desincronizarse del código («mentiras estructuradas»). No gestiona el trabajo en equipo ni el merge |
| [CCPM](https://github.com/automazeio/ccpm) | **GitHub Issues como única fuente de verdad**: PRD → épica → issues → agentes en paralelo con worktrees. Visible para todo el equipo, sin ficheros de estado en el repo | Es una skill sin puertas: la calidad depende de que el agente siga las instrucciones |
| [Kiro specs](https://kiro.dev/docs/specs/index) | Requisitos en EARS, diseño y tareas por funcionalidad, **con aprobación entre fases** | Es su propio IDE; la aprobación es local |
| [obra/superpowers](https://github.com/obra/superpowers) | Método forzado: brainstorm → plan → TDD → revisión, para personas solas o equipos pequeños | Markdown sin runtime: «obligatorio» = instrucción. Pasar todo el ciclo en una errata cuesta lo mismo que en una funcionalidad |
| [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) | Encaja con sprints de equipos de 5–20 personas; roles PM, arquitecto, dev, QA | Los roles son prompts, no pericia independiente; una suposición falsa temprana se propaga entre roles |
| [Task Master](https://github.com/eyaltoledano/claude-task-master) | Grafo de tareas con dependencias y prioridades | `tasks.json` local: no resuelve cómo lo comparte un equipo |
| Protección de ramas, rulesets, CODEOWNERS y checks obligatorios de GitHub | **Lo único de esta lista que el agente no puede saltarse**: si no tiene permiso, no mergea | Hay que configurarlo bien: el check exigido debe venir de la app esperada, los nombres no pueden cambiar, la identidad del bot no puede aprobarse a sí misma |

Un análisis de nueve de estos marcos ([vanja.io](https://vanja.io/265000-stars/))
encuentra nueve convenciones en las que todos acaban coincidiendo: planificar
antes de codificar, guardar la intención en el repo, tareas pequeñas, contexto
nuevo para trabajo acotado, separar implementación y revisión, evidencia antes
de dar algo por terminado, aislar el trabajo concurrente, memoria curada y
aprobación humana en los puntos de más impacto. TaskCode ya tiene casi todas.
**Lo que ninguno resuelve, y es nuestra oportunidad, es hacerlas cumplir de
verdad en un equipo.**

## 2 ter. Requisitos rectores

Carlos fija nueve requisitos por encima de todos los demás (detalle en
[REQUISITOS-FUNCIONALES.md §0](REQUISITOS-FUNCIONALES.md)): **determinismo de
las sentencias de Git para economizar tokens**, **varios puntos de vista**,
**búsqueda de errores**, **revisión**, **iteración del método**, **merge en
`develop`**, **agilidad**, **calidad** y **trabajo en grupo**. Los principios
P8, P11 y P12 y las tareas F1-2, F1-15, F2-7, F3-12, F3-13, F7-5 y F7-6 existen
por ellos.

## 2 bis. Requisitos funcionales y uso real

Los requisitos de lo que la 0.16 hace hoy, cada uno con su uso medido en
ToolsaWeb, OpenDockTrading y TaskCode, están en
[REQUISITOS-FUNCIONALES.md](REQUISITOS-FUNCIONALES.md). Toda tarea de este plan
cita los RF que cumple, y la 2.0 no sale sin cubrir todos los **I**. Lo que el
uso real cambia de este plan:

- **0 PR y 0 issues** en los tres repos: el paso a PR e issues es un cambio de
  forma de trabajar y se hace por piloto.
- **GitHub no deja aprobar el PR propio**: el agente necesita identidad propia
  para que Carlos pueda aprobar (RN-01). Tareas F1-11 y F6-0.
- **Modo automático en el 88–97 % de las transiciones**: el encadenado es
  núcleo (RF-21). Tarea F3-11.
- **Planificación a gran escala** (234 tareas planificadas, dependencias,
  hitos, altas de 37 tareas de golpe): RF-02..04. Tareas F2-6 y F3-7..10.
- **Repos privados con suites pesadas**: runner propio (RN-02). Tarea F1-12.
- **Backlog que migrar** con su mapa de IDs (RN-03). Tarea F8-0.
- **Sin uso**: `codex-review`, `verificar-lote`, `cadena` se retiran;
  `doctor-deploy`, held-out, troceo y documentos con tope pasan a extensiones.

## 3. Principios de diseño (y el error de la auditoría que evita cada uno)

| # | Principio | Evita |
|---|---|---|
| P1 | **Las garantías las impone la plataforma, no el agente.** Merge solo por PR con protección de rama: checks obligatorios en verde y aprobación de una persona con permiso. El plugin ayuda a cumplirlas, no las sustituye | H1, H5, H6, H9, H10 |
| P2 | **El estado vive en el tracker**: issues de GitHub y un tablero de GitHub Projects. El número lo da el servidor y el tablero lo ve todo el equipo. No se versionan ROADMAP, BOARD ni INDEX | H3, H7, H8, H17 |
| P3 | **La verificación corre en CI, una vez por commit**, con caché por SHA. Revisores, persona y merge usan el mismo resultado; nadie repite los tests en local para «comprobar» | redundancia medida en ToolsaWeb y OpenDockTrading, H14, H15 |
| P4 | **La revisión IA tiene identidad propia** (una GitHub App) y publica una review de PR con hallazgos estructurados. Un hallazgo bloqueante deja un check en rojo. Aprueba siempre una persona | H1, H5 |
| P5 | **Nada del repo se ejecuta en local sin confianza explícita.** Los comandos del proyecto los corre la CI en su entorno aislado; en local solo con una lista de confianza fuera del repo | H2, H16 |
| P6 | **Proporcionalidad por carriles**: errata → PR directo; fix → issue + PR; funcionalidad → especificación aprobada + PR; riesgo alto → diseño revisado y dos aprobaciones | «impuesto en una errata», coste por tarea |
| P7 | **Superficie mínima**: unos seis comandos, una página de inicio y configuración con valores por defecto sensatos. Lo avanzado, en extensiones | H18 |
| P8 | **`develop` como rama de integración (RR-06)**: una rama corta por tarea desde `develop`, PR contra `develop` y cola de merge; `main` solo para releases y hotfix. Ni stash ni `git merge` hechos por el agente | H4, H12, commits ceremoniales |
| P11 | **Git determinista desde el CLI (RR-01)**: toda operación de Git y GitHub la ejecuta un comando del CLI, idempotente y con salida corta y estructurada para el agente. El agente nunca compone `git` ni `gh`: ahorra tokens y elimina errores de sintaxis y de orden | tokens por tarea, H10, H22 |
| P12 | **El método itera con datos (RR-05)**: cada versión mide tokens, tiempo, rondas, hallazgos y verificaciones repetidas por tarea, y los cambios del método se deciden con esas cifras y con auditorías, incluida una externa sin contexto | parches sin medir, sesgo positivo |
| P9 | **Los artefactos de especificación se revisan en el mismo PR que el código** y el check de «spec al día» comprueba que se tocaron si cambia el comportamiento | artefactos que se desincronizan (crítica a Spec Kit) |
| P10 | **El plugin es un producto**: CI en Linux, macOS y Windows; tests E2E contra un repo de GitHub de pruebas real; versión semántica; i18n en inglés y español; y la auditoría externa repetida como criterio de cada versión mayor | H20–H25, mantenibilidad |

## 4. Recomendación: evolucionar a una 2.0 nueva, no parchear la 0.16

- **No parchear la 0.16 hasta convertirla en otra cosa.** Sus problemas de
  equipo (estado en ramas, IDs locales, Git-Flow en scripts, puertas como
  hooks) son de arquitectura. Arreglarlos dentro obliga a mantener los dos
  modelos a la vez.
- **Pero sí contener ya los riesgos de la 0.16** (Fase 0), porque ToolsaWeb y
  OpenDockTrading la usan cada día.
- **Reutilizar lo que vale** de la 0.16: las skills revisoras por dominio (como
  prompts del revisor IA), la verificación por impacto (como paso de CI), las
  métricas y la experiencia de las auditorías. Lo demás se escribe de nuevo,
  más pequeño.
- **No construir lo que ya existe**: la protección de ramas, la cola de merge,
  el tablero y los issues son de GitHub. El formato de especificación se
  inspira en Kiro y Spec Kit (requisitos, diseño y tareas por cambio) y se
  puede importar de Spec Kit.
- **[DECIDE CARLOS]** Nombre (¿TaskCode 2?), si el desarrollo va en este repo
  o en uno nuevo, y si la 2.0 debe soportar GitLab desde el principio o
  después (los tres proyectos actuales están en GitHub: el plan empieza por
  GitHub y deja GitLab detrás de una interfaz).

## 5. Cómo se trabajará con TaskCode 2 (lo que verá un equipo)

1. `tc new "Exportar LandXML"` → crea el **issue** en GitHub (número del
   servidor) con plantilla, carril y criterios de aceptación. Aparece en el
   tablero.
2. Carril «funcionalidad»: `tc spec 123` → el agente redacta
   `specs/123-exportar-landxml/{requisitos,diseno,tareas}.md` en una rama y
   abre un **PR de especificación**. Una persona lo aprueba en GitHub: esa
   es la aprobación humana, verificable y con nombre.
3. `tc start 123` → rama `123-exportar-landxml` en un worktree, issue en
   «En curso».
4. El agente implementa; `tc pr` abre el PR enlazado al issue **con la
   identidad del agente** (no la de la persona), para que la persona pueda
   aprobarlo. En modo automático, el orquestador encadena estos pasos solo.
5. **CI**: verificación por impacto en cada push, cacheada por SHA, y un
   check `spec-al-dia`. El **revisor IA** (GitHub App) lee el diff y los
   resultados de la CI, publica su review y, si hay un bloqueante, deja su
   check en rojo. El agente corrige y la CI vuelve a correr solo lo afectado.
6. **Merge**: solo con los checks en verde y la aprobación de una persona;
   por la cola de merge. El issue se cierra solo y el tablero se actualiza.
7. `tc status` muestra en qué está cada tarea, quién la lleva y qué la frena,
   leyendo de GitHub. `tc metrics` saca duración, rondas y minutos de CI
   (incluidos los repetidos) desde la API.

## 6. Plan por fases y tareas

Convención de cada tarea: objetivo verificable, criterio de aceptación y
tamaño. Ninguna debería pasar de 1–2 h de trabajo efectivo; si pasa, se
trocea. «Dep.» = tareas de las que depende.

### Fase 0 — Contención en la 0.16.x (urgente, para los proyectos en uso)

Objetivo: que nadie pierda datos, ejecute código ajeno o cierre sin revisión
mientras se construye la 2.0. Sale como **0.16.2**.

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F0-1 | `veredicto` y `finish` rechazan un informe que sigue siendo la plantilla o no nombra revisor (H1) | Repro de la auditoría → `finish` aborta con mensaje; test E2E | — |
| F0-2 | Confianza explícita antes de ejecutar cualquier `comando_*` de `.taskcode/config.yml`: fichero fuera del repo con el hash de la config; si cambia, no se ejecuta y se avisa (H2) | Repro `echo PWNED` → no se ejecuta; `taskctl confiar` lo habilita; test | — |
| F0-3 | `resume` aplica el stash de su rama (`stash pop "$stash_ref"`, grep anclado) (H4) | Test con dos stashes de ramas distintas | — |
| F0-4 | `decidido_por` vale `agente` por defecto sin TTY; `persona` exige TTY o variable que solo pone la persona (H5) | Test con stdin no interactivo | — |
| F0-5 | `--aceptar-sin-revisar` y `--sin-verificacion` exigen TTY o la misma confirmación de persona; un hook PreToolUse los bloquea si vienen del agente (H6) | El agente no puede pasarlos; test | F0-4 |
| F0-6 | Frontmatter con escape YAML correcto (barra invertida, comillas) y test contra un parser YAML estándar (H11) | Título `C:\ruta\` ida y vuelta; test | — |
| F0-7 | Cerrojo en `verificar-impacto` (dos ejecuciones a la vez borraban `dist/src`) | Dos ejecuciones simultáneas: la segunda espera o sale con aviso | — |
| F0-8 | Publicar 0.16.2 y avisar en ToolsaWeb y OpenDockTrading | Release y actualización en los dos proyectos | F0-1..7 |

### Fase 1 — Decisiones de arquitectura (ADR)

Objetivo: cada decisión de fondo, escrita, con alternativas y motivo, antes de
codificar. Una tarea = un ADR de 1–2 páginas.

| ID | Tarea (ADR) | Contenido mínimo | Dep. |
|---|---|---|---|
| F1-1 | Modelo de estado: issues + GitHub Projects como fuente de verdad | Campos del tablero, estados, cómo se lee/escribe, qué pasa sin red | — |
| F1-2 | Flujo de ramas: `develop` de integración, rama por tarea, PR contra `develop` con cola de merge, `main` para releases y hotfix (RR-06) | Nombres de rama, worktrees, qué se conserva de Git-Flow y qué no, cómo se hace una release y un hotfix | — |
| F1-15 | Capa de operaciones Git/GitHub deterministas (RR-01) | Lista cerrada de operaciones, contrato de salida para el agente (corto, sin colores, códigos de salida con significado), idempotencia y reintento; objetivo de tokens por tarea | F1-2 |
| F1-3 | Puertas en servidor: rulesets, checks obligatorios y CODEOWNERS | Lista exacta de checks, quién aprueba qué carril, cómo se aplica como código | F1-2 |
| F1-4 | Identidad del revisor IA: GitHub App frente a token de usuario | Permisos mínimos, que no pueda aprobar ni mergear, coste, alternativas | F1-3 |
| F1-5 | Formato de especificación por cambio (requisitos EARS, diseño, tareas) y check `spec-al-dia` | Plantillas, compatibilidad con Spec Kit, cuándo se exige | — |
| F1-6 | Carriles y proporcionalidad | Criterios de cada carril, quién lo decide, cómo se cambia | F1-3, F1-5 |
| F1-7 | Verificación en CI: workflow reutilizable, impacto, caché por SHA, tests pesados | Contrato con el proyecto (un comando con perfiles), qué se cachea | F1-3 |
| F1-8 | Modelo de seguridad: qué corre en local, qué en CI, confianza, secretos | Amenazas (PR malicioso, prompt injection en issues), mitigaciones | F1-4, F1-7 |
| F1-9 | Plataformas: interfaz de adaptador (GitHub primero, GitLab después) | Operaciones mínimas, cómo se prueba cada adaptador | F1-1 |
| F1-10 | Migración desde la 0.16 (tareas, historial, métricas) | Qué se migra, qué se archiva, convivencia temporal | F1-1 |
| F1-11 | Identidad del agente implementador (GitHub App o cuenta de máquina) distinta de la persona (RN-01, RN-06) | Commits firmados por el bot, PR abiertos por él, la persona aprueba; qué pasa en un repo de una sola persona | F1-3, F1-4 |
| F1-12 | Runners y coste de CI: GitHub y self-hosted (Windows), por perfil (RN-02) | Coste estimado con las suites reales, seguridad del runner propio con PR externos | F1-7, F1-8 |
| F1-13 | Modelo de planificación: hitos (milestones), dependencias («blocked by»), sub-issues y vista de roadmap (RF-02..04, RF-07) | Cómo se representa `hitos.md`, qué se genera bajo demanda y qué no se commitea | F1-1 |
| F1-14 | Puntos de extensión (RN-04): estados, derivados, verificación y revisoras propias | Contrato de cada punto; cómo cubre lo que hoy hacen ToolsaWeb y OpenDockTrading a mano | F1-1, F1-7 |

### Fase 2 — Núcleo y adaptador de GitHub

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F2-1 | Esqueleto del paquete: TypeScript, build reproducible sin `dist` versionado (se publica como artefacto o paquete), lint, CI en Linux/macOS/Windows | CI verde en los tres sistemas desde el primer commit | F1-* |
| F2-2 | Interfaz `Plataforma` (issues, PR, checks, reviews, tablero) y doble en memoria para tests de lógica | Tipos y contrato documentado; tests de lógica sin red | F1-9 |
| F2-3 | Adaptador GitHub sobre `gh` o la API REST/GraphQL, con reintentos y errores dirigidos a la persona | Tests E2E contra un repo de pruebas real en una organización sandbox | F2-2 |
| F2-4 | Configuración mínima (`.taskcode.yml`) con esquema validado y valores por defecto; claves desconocidas = error claro | ≤ 10 claves; esquema JSON publicado; tests | F1-6, F1-7 |
| F2-5 | i18n de mensajes (en, es) desde el inicio | Todos los mensajes por clave; test que falla si falta una traducción | F2-1 |
| F2-7 | Capa de operaciones Git/GitHub del CLI: rama, commit de lo escrito por la herramienta, push, PR, merge, tag; cada una idempotente, con salida corta para el agente y un test contra un repo real (RR-01, RF-25) | Ningún comando del flujo pide al agente escribir `git` o `gh`; salida de cada operación ≤ 5 líneas en el caso normal | F1-15, F2-3 |
| F2-6 | Planificación en el adaptador: milestones, dependencias entre issues y sub-issues (RF-02..04) | Leer y escribir un grafo de 300 tareas sin pasar los límites de la API; tests E2E | F1-13, F2-3 |

### Fase 3 — Comandos del flujo (superficie mínima)

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F3-1 | `tc setup`: comprueba permisos, crea las etiquetas, el tablero, las plantillas de issue y PR y el workflow de CI, y propone los rulesets (los aplica una persona admin) | En un repo vacío deja todo listo; idempotente; `--dry-run` | F2-3 |
| F3-2 | `tc new`: issue con carril, criterios y plantilla | Número del servidor; aparece en el tablero | F2-3 |
| F3-3 | `tc start <n>`: rama + worktree, issue en curso y asignado | Dos personas a la vez sin conflicto; test E2E | F3-2 |
| F3-4 | `tc pr`: PR enlazado, descripción desde la spec y los criterios | El PR cierra el issue al mergear | F3-3 |
| F3-5 | `tc status`: estado del equipo desde GitHub (en curso, bloqueado, esperando revisión) | Coincide con el tablero; sin ficheros locales | F2-3 |
| F3-6 | `tc doctor`: entorno, permisos, rulesets y checks configurados de verdad | Detecta una protección de rama ausente o mal configurada | F3-1 |
| F3-7 | `tc import` desde un documento de planificación: tareas, criterios, dependencias e hito en una operación (RF-02) | Importa un hito de 37 tareas de ToolsaWeb; repetirlo no duplica | F2-6 |
| F3-8 | `tc next`: lo listo para empezar según dependencias, hito y prioridad (RF-03) | Coincide con el orden del ROADMAP actual de ToolsaWeb | F2-6 |
| F3-9 | `tc roadmap`: grafo Mermaid y resumen por hito, generado bajo demanda o publicado por CI, nunca commiteado en cada fase (RF-04) | Reproduce `hitos.md` de ToolsaWeb sin conflictos entre ramas | F2-6 |
| F3-10 | Descartar con motivo (cerrar como «not planned») y pausar (RF-07, RF-08) | El ID no se reutiliza; aparece en métricas como descartada | F3-2 |
| F3-12 | `tc merge`: integra el PR en `develop` cuando las puertas pasan (merge automático o cola de merge), cierra el issue y limpia el worktree (RR-06, RF-50) | No mergea nada con un check en rojo o sin aprobación; repetirlo no hace nada | F2-7, F3-4 |
| F3-13 | `tc release` y `tc hotfix`: `develop` → `main` con tag y notas generadas desde los PR; hotfix desde `main` que vuelve a `develop` (RF-52, RF-53) | Release reproducible en un repo de pruebas | F2-7 |
| F3-11 | Orquestador del modo automático: encadena spec → implementación → PR → correcciones de revisión, y se detiene solo en las puertas de la política del carril (RF-21, RF-22) | Una tarea del carril fix va de issue a PR listo para aprobar sin intervención | F3-3, F3-4 |

### Fase 4 — Especificación y aprobación humana verificable

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F4-1 | Skill `spec`: redacta requisitos (EARS), diseño y tareas para un issue del carril funcionalidad | Plantillas y ejemplo completo; probado en un issue real | F1-5 |
| F4-2 | PR de especificación y su aprobación: la aprobación de una persona en GitHub desbloquea `tc start` | `tc start` se niega sin spec aprobada en ese carril; test E2E | F4-1, F3-3 |
| F4-3 | Check `spec-al-dia`: si el PR de código cambia comportamiento cubierto por una spec, la spec debe tocarse o justificarse | Check rojo con la causa; falsos positivos medidos | F1-5, F5-1 |
| F4-4 | Importar especificaciones de Spec Kit | Un proyecto con Spec Kit se lee sin reescribir | F4-1 |
| F4-5 | Brainstorm de roles (arquitectura, riesgos, testing, dominio, rendimiento) y unificador dentro de la skill `spec`, proporcional al carril (RF-10) | Mismos roles que la 0.16; un rol en el carril fix, todos en riesgo alto | F4-1 |
| F4-6 | Aprobación de especificaciones en lote: una persona aprueba varias specs de un hito en un PR (RF-11, modo automático) | Un hito de 10 tareas se aprueba de una vez, con nombre y fecha | F4-2 |

### Fase 5 — Verificación en CI sin redundancia

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F5-1 | Workflow reutilizable de verificación: un comando del proyecto con perfiles (`rapida`, `impacto`, `completa`, `pesada`) | ToolsaWeb y OpenDockTrading lo usan sin scripts nuevos | F1-7 |
| F5-2 | Caché por SHA del árbol: el mismo árbol no se verifica dos veces (ni en PR, ni en la cola de merge, ni en la release) | Medido: cero repeticiones sobre el mismo SHA | F5-1 |
| F5-3 | Verificación por impacto como paso de CI (reutiliza la de la 0.16) y la completa en la cola de merge, no en cada push | Tiempo de CI por PR medido antes y después | F5-1 |
| F5-4 | Informe de verificación legible por el revisor IA (JSON con qué corrió, qué saltó y por qué) | El revisor lo cita y no repite tests | F5-1 |
| F5-5 | Hooks locales opcionales y baratos: solo formato y lint rápido, desactivables, sin bloquear el turno más de unos segundos | Coste medido ≤ 1 s; nada del repo sin confianza | F1-8 |

### Fase 6 — Revisión IA con identidad y humano al final

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F6-0 | Identidad del agente implementador: la App o cuenta de máquina firma los commits y abre los PR (RN-01) | En un repo de una persona, Carlos aprueba un PR abierto por el agente | F1-11 |
| F6-1 | GitHub App del revisor con permisos mínimos (leer código, escribir reviews y checks; nunca aprobar ni mergear) | No puede aprobar su propio PR ni el de nadie; probado | F1-4 |
| F6-2 | Workflow del revisor: Claude Code en CI con las skills de dominio de la 0.16, leyendo el diff y el informe de verificación | Review publicada con hallazgos por severidad | F6-1, F5-4 |
| F6-3 | Hallazgos estructurados (JSON + comentarios en línea); un CRÍTICO o IMPORTANTE abierto deja el check `revision-ia` en rojo | El check refleja los hallazgos; se reabre al corregir | F6-2 |
| F6-4 | Rondas: la segunda revisión mira solo lo cambiado desde la anterior y si los hallazgos se cerraron, sin buscar de cero | Convergencia medida: hallazgos nuevos por ronda | F6-3 |
| F6-5 | Selección del revisor por dominio y presupuesto (modelo y número de revisoras según carril), sin tres revisoras repitiendo tests; dominios de la 0.16: angular-vue, rust-wasm, C#/AutoCAD/IFC, Java/Spring y genérica (RF-31) | Coste por PR medido y acotado; un diff Rust + Vue lanza las dos revisoras de dominio | F6-2 |
| F6-6 | Defensa contra prompt injection (contenido del PR o del issue como datos, no instrucciones) | Batería de PRs maliciosos de prueba | F1-8, F6-2 |

### Fase 7 — Equipo, métricas y adopción

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F7-1 | `tc metrics` desde la API: tiempo por fase, rondas, hallazgos por severidad, minutos de CI y **minutos repetidos** | Reproduce las cifras de la medición de la 0.16 | F5-2, F6-3 |
| F7-2 | Guía de inicio de una página (instalar, `tc setup`, primera tarea en 15 min) | Una persona nueva la sigue sin ayuda (prueba con alguien externo) | F3-* |
| F7-3 | Referencia completa generada desde el código (comandos, configuración) | No puede desincronizarse: se genera en CI | F2-4 |
| F7-5 | Ciclo de iteración del método (RR-05): cada versión publica sus cifras por tarea (tokens, tiempo por carril, rondas, hallazgos por severidad, verificaciones repetidas) frente a la anterior; auditoría interna cada versión y externa sin contexto cada versión mayor; los cambios del método citan la cifra que los motiva | Informe por versión generado por `tc metrics`; ningún cambio del método sin dato | F7-1 |
| F7-6 | Presupuesto de tokens por tarea y por carril, con aviso cuando una tarea lo supera y desglose de dónde se fue (diseño, implementación, revisión, verificación, operaciones) (RR-01, RR-07) | El desglose cuadra con la transcripción; objetivo fijado con datos de la 0.16 | F7-1 |
| F7-4 | Plantillas para equipos: CODEOWNERS por módulo, carriles por defecto, revisores por dominio | Ejemplo aplicado a ToolsaWeb | F1-3 |

### Fase 8 — Calidad del propio plugin y piloto

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F8-0 | Migración del backlog a issues: tareas planificadas, dependencias, hitos y mapa TASK-NNN ↔ #n; las terminadas se enlazan como histórico (RN-03) | Las 234 planificadas de ToolsaWeb con sus dependencias, en un repo de pruebas primero | F3-7, F1-10 |
| F8-1 | Suite E2E del flujo completo contra un repo de GitHub de pruebas: dos «personas» (dos tokens) trabajando a la vez | Sin conflictos; tablero correcto; merge solo con puertas | F3-*, F6-* |
| F8-2 | Prueba de seguridad: PR malicioso, rama con config hostil, issue con instrucciones inyectadas | Ninguno ejecuta código ni salta una puerta | F6-6, F1-8 |
| F8-3 | Auditoría externa repetida con el mismo encargo que la de 2026-11-13 | Las tres preguntas responden «sí» o «sí, con condiciones menores» | F8-1, F8-2 |
| F8-4 | Piloto en OpenDockTrading (proyecto más pequeño) durante 10 tareas | Métricas frente a la 0.16; lista de fricciones | F8-1 |
| F8-5 | Migración de ToolsaWeb con su verificación propia en el workflow reutilizable | 10 tareas con la 2.0; minutos repetidos ≈ 0 | F8-4, F5-* |
| F8-6 | Publicar 2.0.0 | Changelog, guía de migración y release | F8-3..5 |

## 7. Cómo sabremos que es profesional (criterios de salida de la 2.0)

- **Todos los requisitos de prioridad I** de
  [REQUISITOS-FUNCIONALES.md](REQUISITOS-FUNCIONALES.md) cubiertos, con su
  prueba, y la decisión escrita sobre cada C, E y R.
- **Los nueve requisitos rectores (RR-01..09)** se cumplen y cada uno tiene su
  prueba o su cifra: en particular, ningún paso del flujo pide al agente
  escribir comandos de Git y los tokens por tarea bajan frente a la 0.16.
- **Ninguna garantía depende de que el agente obedezca**: el merge en `develop` (y en `main`)
  es imposible sin checks verdes y la aprobación de una persona (comprobado
  en F8-1 y F8-2).
- **Dos personas trabajan a la vez** sin conflictos de estado ni de ficheros
  generados.
- **Cero verificaciones repetidas sobre el mismo SHA**, medido con `tc metrics`.
- **Una persona nueva hace su primera tarea en 15 minutos** con la guía de
  una página.
- **CI verde en Linux, macOS y Windows**, sin «rojos conocidos» aceptados.
- **La auditoría externa repetida** responde a las tres preguntas con «sí».

## 8. Orden recomendado y paralelismo

1. **Fase 0 ya** (una o dos sesiones; protege a los proyectos en uso).
2. **Fase 1 completa antes de escribir código de la 2.0.** Los ADR F1-1, F1-2,
   F1-5, F1-9 y F1-13 se pueden escribir en paralelo; F1-3 → F1-4 → F1-11 y
   F1-7 → F1-8 → F1-12 van en cadena; F1-14 al final.
3. Fases 2 y 3 seguidas; en paralelo, F4-1 (skill de spec) y F5-1 (workflow
   de verificación), que no dependen del núcleo.
4. Fase 6 cuando exista el informe de verificación (F5-4).
5. Fases 7 y 8 al final, con el piloto en OpenDockTrading antes que ToolsaWeb.

## Fuentes

- [GitHub Spec Kit](https://github.github.com/spec-kit/) · [anuncio en el blog de GitHub](https://github.blog/news-insights/product-news/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) · [Spec Kit gana tracción (Visual Studio Magazine, 2026)](https://visualstudiomagazine.com/articles/2026/05/12/github-spec-kit-takes-off-as-antidote-to-piecemeal-vibe-coding.aspx)
- [CCPM en el Algolia DocSearch](https://docsearch.algolia.com/mcp/docs/repo/automazeio/ccpm) · [Show HN: CCPM](https://hn.svelte.dev/item/44960594)
- [Kiro specs](https://kiro.dev/docs/specs/index)
- [Comparativa superpowers y BMAD](https://www.libhunt.com/compare-superpowers-vs-BMAD-METHOD) · [Marcos de skills agénticas (rywalker.com)](https://rywalker.com/research/agentic-skills-frameworks) · [BMAD con Claude Code](https://pasqualepillitteri.it/en/news/171/bmad-framework-claude-code-agile-development)
- [«265,000 Stars and I Don't Use Any of It»](https://vanja.io/265000-stars/) · [The Great Agent Skills Land Grab](https://denodell.com/blog/the-great-agent-skills-land-grab)
- [Task Master, PRD del proyecto](https://glama.ai/mcp/servers/@eyaltoledano/claude-task-master/blob/f961235442aa88e4983b29ab458b6a476fadf370/.taskmaster/docs/prd.txt)
- [GitHub: checks obligatorios (documentación oficial)](https://docs.github.com/en/enterprise-cloud@latest/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks) · [Agentes IA y PR en GitHub Actions](https://tenki.cloud/blog/ai-agent-pr-playbook-github-actions) · [Riesgo de que un agente se salte un check (Civic)](https://www.civic.com/use-cases/claude-code)
