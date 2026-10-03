# Auditoría del plugin — 2026-10-03

Cuatro agentes especializados en paralelo, de solo lectura, sobre `develop`
en `c8ba509` (con TASK-033 casi cerrada). Áreas: (1) rendimiento y
mediciones de tiempo, con foco en la review; (2) skill y plugin en Claude
Code; (3) Git y los comandos que lanza el plugin; (4) funciones
deterministas que ahorran tokens, y bugs. Este documento consolida los cuatro
informes. Lo que no se sostuvo al contrastarlo se ha **descartado** (ver el
final).

**Ojo con los tiempos absolutos:** las mediciones de rendimiento se hicieron
con la CPU al 100 % por otra sesión. Las proporciones y los recuentos de
procesos son fiables; los segundos, inflados.

## 1. Lo que dicen los datos

**La review es el cuello de botella.** En las 17 tareas cerradas: **45,8 h de
review frente a 14,3 h de implementación** (mediana por tarea: review 2,0 h,
implementación 0,5 h). En OpenGisViewer, 10,9 h frente a 1,6 h en 3 tareas.
2,24 rondas de media; TASK-016 y TASK-017 llegaron a 5. Mediana de una ronda:
61 min (OpenGisViewer: 48 min). Método: horas de reloj entre commits de fase
(`git log --date=iso-strict`), así que incluyen pausas.

**Por qué es cara:**

| Causa | Dato medido |
|---|---|
| La petición embebe el diff entero | 27 peticiones = 1,75 MB. `dist/` compilado 24 %, tests 36 %, `src/` 23 %, `tareas/` 3 %. TASK-031: 325 KB, el 78 % es `dist/`. TASK-004 de OGV: 192 KB, el 34 % es el lockfile. |
| La ronda 2 y siguientes se escriben a mano | `review` solo existe desde `en-curso`; `ultimo_commit_revisado` no lo escribe nadie. TASK-017, 018, 020, 022 y 033 tienen peticiones de ronda N redactadas por un agente. |
| Cada revisor corre la suite completa (a veces 2 veces) y mutantes | La suite: 893 tests, ~11 min sin carga en Windows. |
| Rondas encadenadas | Hallazgos nacidos de la corrección anterior en TASK-018, 020, 032 y 033. |
| Fricción de formato | Veredictos `**APROBADO CON CAMBIOS**` → commits solo para normalizar (TASK-026). |

**En Windows casi todo el tiempo es lanzar procesos.** En `review.test` y
`finish.test`, el **98,7 %** del tiempo de pared es esperar a `git`/`bash`.
Coste unitario medido: `git status` ~0,14 s, `bash -c true` ~0,15-0,2 s,
**una línea de log de `_gitflow-common.sh` ~0,26 s** (subshell + `date`),
`initialize_gitflow_log` ~1,4 s. Dentro de `taskctl review`, `update-feature.sh`
se lleva 11 de 19 s.

| Comando | Procesos `git` totales | Tiempo (con carga) |
|---|---|---|
| `new` | 9 | 4,8 s |
| `plan` | 12 | 5,9 s |
| `approve` | 9 | 5,5 s |
| `start` | 27 | 19,2 s |
| `review` | 26 | 19,2 s |
| `finish` | 35 | 23,1 s |

**La heurística de complejidad no discrimina.** Aplicada a las 33 tareas: la
señal `palabra_alto_riesgo` no saltó **ni una vez**; TASK-017 (5 rondas)
puntúa `trivial`. Y como `new` pone `media` por defecto y manda el máximo,
**toda tarea creada sin `--complejidad` lanza 3 agentes** (2 roles + unificador).

## 2. Backlog propuesto, por impacto en tiempo

Cada fila es una tarea pequeña y acotada. **S** = menos de 2 h, **M** = medio día.

### A. Fase de review (la prioridad)

| # | Tarea | Por qué | Tamaño |
|---|---|---|---|
| A1 | Excluir del diff de la petición `dist/`, lockfiles y `tareas/` (clave `excluir_de_revision`, con `--stat` de lo excluido) | −27 % de bytes en el agregado; −78 % en la peor | S |
| A2 | `taskctl review` para la ronda N≥2 desde `en-revision`: diff delta desde `ultimo_commit_revisado` (que por fin se escribe) + lista de hallazgos de la ronda anterior | Elimina las peticiones a mano y acota el contexto | M |
| A3 | Política de rondas en la skill: sin CRÍTICO/IMPORTANTE abiertos, una ronda basta; si solo se corrigen MENOR, no hay ronda 2; la ronda 2 se limita al delta | Hoy la skill dice «dos rondas es normal». **Decisión tuya** | S |
| A4 | Revisores: suite completa **una vez por ronda**; mutantes con el fichero de test concreto; con varios revisores en paralelo, concurrencia reducida | Varias suites de ~11 min por ronda | S |
| A5 | `taskctl veredicto TASK-NNN aprobada\|cambios-solicitados`, o parser tolerante a `**` | Quita los commits de normalización | S |
| A6 | Informe de revisión con tabla estructurada `ID \| Severidad \| Estado \| Fichero` | Permite que A2 extraiga los hallazgos sin modelo | S |

### B. Rendimiento de los comandos y de la suite

| # | Tarea | Por qué | Tamaño |
|---|---|---|---|
| B1 | Logging de Git-Flow sin procesos (`printf -v ts '%(...)T'` en vez de `$(date)` y `$(_do_log)`) | ~0,26 s por línea; beneficia a `start`, `review`, `finish`, `diagnose` y a 100+ tests | S |
| B2 | Una sola detección de `origin` por invocación y `timeout` en `git ls-remote` | Se repite en cada script; sin red espera ~30 s | S |
| B3 | Repo plantilla en los tests (crear una vez, copiar con `fs.cp`) | 6 spawns por test, patrón copiado en 31 ficheros | S |
| B4 | Separar `test:rapido` (core, cli; ~500 tests de menos de 1 s) de `test:integracion` | Iterar sin pagar 11 min | S |
| B5 | Partir los ficheros de test más largos (`start`, `finish`, `review`, `sincronizacion`, `gitflow`) o darles concurrencia interna | Son el camino crítico secuencial | M |
| B6 | Quitar llamadas `git` duplicadas en los comandos (`branch --show-current` ×3, `add` ×2…) | `finish` lanza 35 procesos | S |
| B7 | Medir la suite con y sin `--experimental-test-coverage` y separar `test:cov` si compensa | Sin medir todavía | S |
| B8 | Telemetría de fases: marca de tiempo por transición en `tarea.md` + `taskctl metricas` | Hoy hay que reconstruirlo desde los mensajes de commit | S |

### C. Tareas más concretas y acotadas desde su creación

| # | Tarea | Por qué | Tamaño |
|---|---|---|---|
| C1 | `taskctl new --objetivo "..." --criterio "..."` (repetible) o `--desde <fichero>` | Hoy `new` e `import` dejan el Objetivo vacío | S |
| C2 | Validación determinista antes de `plan`: Objetivo no vacío, 1-8 criterios no vacíos, lint de verificabilidad (cada criterio cita un comando, ruta, número o test; rechaza «mejorar», «robusto», «correctamente»…) | Las tres tareas con 13+ criterios tuvieron peticiones de 110-160 KB | M |
| C3 | Más de 12 criterios o varios frentes → `plan` aborta y propone la partición (fichero de `import` fuera del repo) | TASK-030 juntó dos items en una tarea | M |
| C4 | Complejidad por defecto: que mande la heurística si no se declara (no `media` fija); con 1 rol, sin unificador | Ahorra 1-2 agentes por tarea simple. **Decisión tuya** | S |
| C5 | Recalibrar la heurística con las 17 tareas cerradas, usando las rondas como coste real; quitar las claves de config que nadie lee (`tolerancia_*`, `modelo_consulta_discrepancia`) | La señal de riesgo no ha acertado nunca | M |
| C6 | Puertas de cierre: `approve` rechaza un plan en esqueleto; `finish` avisa de casillas sin marcar fuera de `### Tras el cierre` | Se puede cerrar una tarea entera con todo vacío (reproducido) | S |

### D. Bugs encontrados

| # | Sev. | Bug | Reproducción |
|---|---|---|---|
| D1 | IMPORTANTE | `rama_base` solo funciona a medias: los scripts de Git-Flow y `finish.ts:65` usan `develop` fijo | `rama_base: dev` → `new`/`plan`/`approve` van; `start` muere con «develop no existe» |
| D2 | IMPORTANTE | `extraerSecciones` corta el Objetivo y los criterios en cualquier `###` | Criterios agrupados en `### Parser` / `### CLI` → `criterios: []` |
| D3 | IMPORTANTE | No hay camino de CLI para la ronda 2 (las pistas de error dan vueltas en círculo) | `review` → «ejecuta start» → «ejecuta plan» → falla. Lo resuelve A2 |
| D4 | MENOR | Los flags desconocidos se ignoran: `--complejida trivial` deja `media` y lanza 3 agentes | Reproducido |
| D5 | MENOR | `- [ ] ` vacío cuenta como criterio | Reproducido |
| D6 | MENOR | La salida de `review` dice «lanza ese agente» con `code-quality-reviewer`, que es una skill; `agente_revisor` y `modelo_sugerido` no los lee nadie | Lectura de código |
| D7 | MENOR | `import` rechaza la continuación sangrada de un criterio que `tarea-body.ts` sí acepta | Reproducido |
| D8 | MENOR | TASK-017 está cerrada con un veredicto que el propio gate de `finish` rechaza | Comprobado contra el commit de cierre |
| D9 | MENOR | Detección de `origin` inconsistente entre scripts (`merge-feature-to-develop` no distingue «configurado pero caído») | Lectura de código |
| D10 | MENOR | `codex-review.ts` duplica helpers de `finish.ts` | Lectura de código |
| — | ya corregido | La skill decía que `codex-review` no existe | Corregido en TASK-033 |

### E. Skill y plugin en Claude Code (coste en tokens)

| # | Tarea | Por qué | Tamaño |
|---|---|---|---|
| E1 | Partir `task-workflow/SKILL.md` (~25 KB): sincronización, post-cierre y prerrequisitos a ficheros de referencia que se cargan solo cuando hacen falta | ~6-7 KB menos cada vez que se invoca | S |
| E2 | Acortar las descripciones de las 4 skills revisoras y de la de flujo | Se cargan en **todas** las sesiones (~600 tokens entre todas) | S |
| E3 | Quitar el contenido genérico duplicado entre las 4 skills revisoras | ~1,2 K tokens repetidos | S |
| E4 | Evaluar `model:` en los agentes de brainstorm (un modelo más barato para los roles) | Hoy heredan el de la sesión | S |
| E5 | Completar `plugin.json` (`displayName`, `repository`, `license`, `keywords`) y documentar instalación y actualización en el README | Para consumidores como OpenGisViewer | S |

## 3. Orden recomendado

1. **A1 + A3 + A4**: lo más barato y lo que más recorta la review. Ninguna toca la máquina de estados.
2. **B1 + B2**: abaratan cada `start`/`review`/`finish` y, de rebote, la suite.
3. **A2 + A6 + D3**: la ronda incremental (la pieza M más rentable).
4. **C1 + C2 + C4**: tareas más concretas desde `new`.
5. **D1, D2**, y después el resto de B, C y E.

Decisiones que son tuyas antes de empezar: **A3** (política de rondas) y
**C4** (complejidad por defecto).

## 4. Descartado al contrastar

Del informe de skill/plugin se descartan, por no sostenerse: los IDs de
modelo que proponía (de generaciones antiguas), `context: fork` en agentes
(es un campo de skills, no de agentes) y la severidad CRÍTICO para metadatos
que faltan en `plugin.json` (se queda en E5). Del informe de Git, el
«shellcheck» como CRÍTICO sin un caso que falle (no entra en el backlog hasta
que haya uno).
