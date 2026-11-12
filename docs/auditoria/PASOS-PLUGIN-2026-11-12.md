# Índice de pasos del plugin y métricas por paso — 2026-11-12

Complemento de `AUDITORIA-METODO-2026-11-12.md`. Recorre **cada paso** del
plugin, uno por uno, con lo que tarda y lo que cuesta en ToolsaWeb y en
OpenDockTrading (y en TaskCode como referencia), los errores que se ven y lo
que se puede optimizar en cada uno.

## Cómo se ha medido

- **Tareas:** 148 de ToolsaWeb, 27 de OpenDockTrading y 46 de TaskCode
  cerradas con tabla `## Transiciones`. De cada `tarea.md` salen las
  transiciones y la tabla `## Coste`; de cada `revision/informe-revision-N*.md`,
  el veredicto y la tabla de hallazgos; de cada `peticion-revision-N*.md`, su
  tamaño.
- **Duración real de `finish`:** el commit `chore(TASK-NNN): tarea terminada`
  menos la transición `finish` (la transición se anota al **empezar** el
  comando).
- **Scripts de Git-Flow:** de `.git/taskcode/gitflow/*.log`, de `INICIO` a
  su cierre.
- **Verificación de ToolsaWeb:** `.estado/verificar-ultima.json` y los memos
  `.git/freno-verificacion*.json` (solo guardan la última ejecución).
- Son **medianas**. El tiempo es de reloj; la aprobación y las esperas en modo
  automático son casi cero. Los scripts de medición están fuera del repo
  (scratchpad de la sesión) y solo leen.
- **Lo que no se puede medir hoy**, se dice en cada paso: cuántas veces corre
  el freno `Stop`, cuánto dura cada comando `taskctl` en sí y cuánto tarda la
  sincronización de ToolsaWeb.

**Versiones:** las tablas de pasos comparan la 0.12-0.13 con la 0.14. Para
ToolsaWeb también se da «≤ 0.11»: son las transiciones sin columna de versión.
OpenDockTrading no declara complejidad en ninguna tarea.

## Resumen de una tarea, de punta a punta (0.14, medianas)

| paso | ToolsaWeb (n=13) | OpenDockTrading (n=17) | TaskCode (n=10) |
|---|---|---|---|
| 2. Diseño (`plan` → `approve`) | 12 min · 1,6 M | 16 min · 1,1 M | 11 min · 0,8 M |
| 3. Aprobación | 0 min | 0 min | 0 min |
| 5. Implementación (`start` → 1.ª `review`) | 20 min · 17,9 M | 16 min · 7,5 M | 36 min · 8,2 M |
| 6. Ronda 1 | 17 min · 3,2 M | 15 min · 2,9 M | 27 min · 4,8 M |
| 7. Ronda 2 | 15 min · 3,0 M | 9 min · 2,6 M | 47 min · 3,1 M |
| 7. Ronda 3 | 12 min · 1,4 M | 16 min · 2,1 M | — |
| Última ronda hasta `finish` | 19 min | 8 min | 28 min |
| 8. `finish` real (no lo cuentan las métricas) | **28 min** (n=10 desde TASK-297) | 0,1 min (sin verificación declarada) | 0,1 min (sin verificación declarada) |
| **Punta a punta según `metricas`** | 130 min | 80 min | 104 min |
| Rondas | 2 | 3 | 2 |
| Revisión, todas las rondas | 7,7 M | 7,6 M | 6,8 M |

Lo que sale a la vista:

1. **La implementación es la fase más cara en tokens** (≈ 60-65 % de la
   tarea en ToolsaWeb), no la revisión. Desde la 0.12 se registra la sesión
   entera, que incluye orquestar el flujo, leer skills y lanzar `taskctl`;
   no es solo código escrito.
2. **La ronda 2 cuesta casi lo mismo que la ronda 1** en ToolsaWeb
   (3,0 M frente a 3,2 M) y en OpenDockTrading (2,6 M frente a 2,9 M), pero
   rinde una sexta parte (sección 7).
3. **En ToolsaWeb, `finish` añade unos 28 min que ninguna métrica ve.**

## Índice completo de pasos

| # | Paso | Quién lo hace | Comando / pieza |
|---|---|---|---|
| 0 | Preparación del proyecto | persona/agente | `taskctl doctor`, `.taskcode/config.yml`, `taskctl import` |
| 1 | Alta de la tarea | agente | `/taskcode-plugin:new` → `taskctl new` |
| 2 | Diseño | agente + subagentes | `/taskcode-plugin:plan` → `taskctl plan`, brainstorm por roles, unificador, `plan-final.md`, estimación (regla de una hora), `registrar-coste --fase diseno` |
| 3 | Aprobación | persona o automático | `/taskcode-plugin:approve` → `taskctl approve` |
| 4 | Arranque | CLI | `/taskcode-plugin:start` → `taskctl start` → `create-feature.sh`, límite de WIP |
| 5 | Implementación | agente | trabajo + hooks: freno `Stop` (verificación), `coste-turno` (Stop/SubagentStop), guardián de merges (PreToolUse Bash), guardián de held-out (PreToolUse lectura); autorrevisión |
| 6 | Revisión, ronda 1 | CLI + revisores | `taskctl review` (`update-feature.sh`, verificación de ronda, petición por dominio), revisores en paralelo, informe, `taskctl veredicto`, `registrar-coste --fase revision` |
| 7 | Revisión, rondas ≥ 2 | CLI + revisores | `taskctl review` (acotada o completa), tope de 3, `--ronda-extra` |
| 8 | Cierre | CLI | `/taskcode-plugin:finish` → `taskctl finish`: puertas, verificación, cobertura, held-out, `merge-*.sh` o merge request, tag, artefactos de cierre, sincronización, `--push` |
| 9 | Transversales | CLI | `siguiente`/cadena de modos, `pausa`, `board`, `metricas`, `roadmap`, `codex-review`, `doctor-deploy`, wrappers (`diagnose`, `pause`, `resume`, `recover`, `abort-merge`), sincronización tras cada transición |

---

## Paso 0 — Preparación del proyecto (`doctor`, config, `import`)

**Medido:** sin coste en el flujo. `doctor` en TaskCode da hoy `1 error`
(falta `tareas/01-en-diseno`).

**Errores:**
- `doctor` marca como ERROR una carpeta de estado vacía que Git no puede
  guardar (F-4 de la auditoría).
- **OpenDockTrading y TaskCode no declaran `comando_verificacion`**: los
  frenos `Stop`, la puerta de `finish` y el guardián no actúan. En
  OpenDockTrading la config lo deja para su TASK-014, que sigue
  planificada: hay 27 tareas cerradas sin ningún freno, aunque el proyecto
  ya tiene una docena de scripts `comprobar-*.py` que podrían hacer de
  verificación. `doctor` solo lo marca como «omitida».

**Optimización:**
- Que `doctor` dé **aviso** (no «omitida») cuando el proyecto tiene tests
  detectables y no declara verificación, y que diga cuántas tareas se han
  cerrado así.
- `.gitkeep` en las carpetas de estado al crearlas.

## Paso 1 — Alta (`new`)

**Medido:** sin transición propia (la primera es `plan`). Un commit
(`chore: tarea creada`). En ToolsaWeb, 184 tareas planificadas frente a 150
terminadas: la cola crece más deprisa de lo que se cierra.

**Errores:**
- OpenDockTrading: complejidad `null` en todas sus tareas. El número de roles
  del brainstorm y la heurística no tienen entrada.
- La complejidad declarada no predice el coste: en ToolsaWeb, `alta` gasta
  menos tokens que `media` (10,9 M frente a 14,0 M).

**Optimización:**
- Que `new` proponga la complejidad a partir de tareas parecidas ya cerradas
  (etiquetas, ficheros) en vez de dejar `media` o `null`.
- Validar que los criterios sean verificables ya en el alta (hoy lo hace
  `plan`).

## Paso 2 — Diseño (`plan`: brainstorm, unificador, plan, estimación)

**Medido (0.14):** ToolsaWeb 12 min · 1,6 M; OpenDockTrading 16 min · 1,1 M;
TaskCode 11 min · 0,8 M. Mediana de **2 roles por tarea** más el unificador
(3 agentes). Cuatro commits (`tarea en diseno`, `coste diseno`,
`plan final`, `duracion del plan`).

**Errores:**
- **La estimación de duración ancla en el umbral**: en TaskCode 6 de 10
  estimaciones se pasaron y 4 más del doble. Además, la duración real de
  `finish` (28 min en ToolsaWeb) no entra en ninguna estimación ni en ninguna
  métrica.
- La regla de una hora trocea en tareas completas: cada trozo vuelve a pagar
  este paso entero.

**Optimización:**
- **Rol único sin unificador** para tareas `simple` y para los trozos de
  una épica que ya tiene plan (ahorra 2 de 3 agentes, unos 0,5-1 M).
- Estimación a partir de la mediana real de tareas parecidas, sumando el
  `finish` real del proyecto.
- Tras trocear, heredar el plan de la épica en vez de diseñar cada trozo
  (F-7 de la auditoría).

## Paso 3 — Aprobación (`approve`)

**Medido:** 0 min en los tres proyectos (modo automático). Un commit.

**Errores:** ninguno medible. En automático el plan se aprueba solo; la
pregunta a la persona ocurre dentro de `plan`.

**Optimización:** fundir el commit `plan aprobado` con el del plan final en
modo automático (un commit menos por tarea).

## Paso 4 — Arranque (`start`)

**Medido:** `create-feature.sh` 5 s (ToolsaWeb, n=1), 14 s (OpenDockTrading,
n=2). Casi todos los logs de `create` no cierran con una línea reconocible y
no se pueden medir. Un commit (`tarea en curso`).

**Errores:** ninguno nuevo.

**Optimización:** que los scripts escriban siempre una línea `FIN` con la
duración en segundos, para poder medir este paso y los demás.

## Paso 5 — Implementación y hooks

**Medido (0.14):** ToolsaWeb 20 min · 17,9 M; OpenDockTrading 16 min · 7,5 M;
TaskCode 36 min · 8,2 M. En ToolsaWeb, la 0.12-0.13 llegó a 74 min ·
31,4 M; la 0.14 lo ha bajado.

Sub-pasos:

| sub-paso | medido | sin dato |
|---|---|---|
| Freno `Stop` (verificación al fin de cada turno) | la selectiva de ToolsaWeb tarda **4,2 min** (último memo) y tiene un tope de 3300 s | cuántas veces corre por tarea: no queda registro |
| `coste-turno` (Stop/SubagentStop) | solo anota rutas; tope de 30 s | — |
| Guardián de merges (PreToolUse Bash/PowerShell) | se lanza en **cada** comando de shell; tope de 30 s | coste acumulado por tarea |
| Guardián de held-out (PreToolUse lectura) | se lanza en cada Read/Edit/Grep/Glob | ningún proyecto declara held-out: coste puro |
| Autorrevisión | 1-2 constancias por tarea | tokens propios (van en la sesión) |

**Errores:**
- **El freno `Stop` es un coste invisible**: con la selectiva de 4,2 min, un
  agente que da diez turnos en una tarea puede pasar unos 40 min
  verificando, y ninguna métrica lo ve.
- **El guardián de held-out se ejecuta en cada lectura de fichero** en
  proyectos que no usan held-out. Es un proceso `node` por llamada a una
  herramienta (~0,1-0,2 s en Windows) durante toda la sesión.
- El guardián de merges no ve el `git commit` que cierra un merge en curso
  (F-16, reproducido).

**Optimización:**
- Registrar cada ejecución del freno `Stop` (instante, modo, duración,
  resultado) en `.git/taskcode/` y sumarlo en `metricas`.
- Freno `Stop` **solo si el turno cambió código** desde el último verde
  (comparando huella), no al final de cada turno.
- Que los hooks PreToolUse salgan sin arrancar la lógica pesada cuando la
  config no declara held-out (lectura) o cuando el comando no contiene `git`
  ni un script de cierre (Bash). Mejor aún: un `matcher` más estrecho en
  `hooks.json`.
- La parte de orquestación de la sesión de implementación (leer skills,
  `taskctl`) se puede bajar acortando `task-workflow/SKILL.md`, que roza el
  límite de 15 KB.

## Paso 6 — Revisión, ronda 1 (`review` + revisores + `veredicto`)

**Medido (0.14):** ToolsaWeb 17 min · 3,2 M; OpenDockTrading 15 min · 2,9 M;
TaskCode 27 min · 4,8 M. `update-feature.sh` 5-6 s (máximo 20 s).
**Petición de la ronda 1: 116 KB de mediana en ToolsaWeb**, 86 KB en
OpenDockTrading y 46 KB en TaskCode. Revisores por ronda: 1,3 (ToolsaWeb),
1,0 (los demás). Commits de la ronda: `peticion`, `coste`, `informe`,
`veredicto`, y `autorrevision` antes.

**Rendimiento:** la ronda 1 es la que más rinde. Encuentra algún
CRÍTICO/IMPORTANTE nuevo en el **66 %** de las tareas de ToolsaWeb (233 en
total), el **77 %** de OpenDockTrading (56) y el 32 % de TaskCode (30).

**Errores:**
- Peticiones de **116 KB** de mediana (unos 30 K tokens) antes de que el
  revisor lea nada. Eso, más `revision.md` (12,7 KB) y la skill de dominio
  (14-22 KB), por revisor.
- El revisor clona, instala, compila y corre la suite completa aunque la
  verificación de ronda de `taskctl review` acabe de correr la selectiva
  sobre el mismo commit.

**Optimización:**
- El revisor **reutiliza el resultado de la verificación de ronda** (mismo
  commit, misma huella) en vez de correr la suite otra vez; corre solo los
  tests de sus mutantes.
- Petición con el diff de `src/` embebido y los tests como `--stat` más la
  ruta, para que el revisor abra solo los que necesite.
- Un solo commit por ronda (petición + coste + informe + veredicto) en vez de
  cuatro.

## Paso 7 — Revisión, rondas ≥ 2

**Medido:**

| ronda | ToolsaWeb: rondas · con CRIT/IMP nuevo · tokens (0.14) | OpenDockTrading | TaskCode |
|---|---|---|---|
| 2 | 137 · **15 (10 %)** · 3,0 M | 26 · 4 (15 %) · 2,6 M | 34 · 6 (17 %) · 3,1 M |
| 3 | 45 · 4 (8 %) · 1,4 M | 16 · 3 (18 %) · 2,1 M | 6 · 2 (33 %) · 2,6 M |
| 4+ | 18 · 5 (27 %) | 17 · 11 (64 %) (ADR con 14 rondas) | 3 · 1 |

**Rondas abiertas tras una ronda sin ningún CRÍTICO ni IMPORTANTE** (solo
MENORES):

| proyecto | rondas | CRIT/IMP nuevos en ellas | tokens |
|---|---|---|---|
| ToolsaWeb | 44 | **0** | 22,9 M |
| OpenDockTrading | 9 | 1 | 18,1 M |
| TaskCode | 18 | 1 | 29,2 M |
| **Total** | **71** | **2** | **70,2 M** |

**Errores:**
- **71 rondas por MENORES que encontraron 2 CRÍTICO/IMPORTANTE en 70 M
  tokens** (F-1 de la auditoría, y lo que pide TASK-099). Este es el dato que
  TASK-099 esperaba: ya está medido en los dos proyectos.
- La ronda «acotada» no baja el coste: en ToolsaWeb, ronda 2 = 94 % de la
  ronda 1.
- **El tope de 3 rondas se rebasa con `--ronda-extra`**: TASK-293 de
  ToolsaWeb (0.14) llegó a la ronda 6 con dos revisores en cada una. La
  persona lo autorizó, pero cada ronda extra relanzó a los dos revisores
  aunque el hallazgo era de uno.

**Optimización:**
- MENORES corregidos sin ronda: selectiva del implementador y nota (F-1 /
  TASK-099).
- Desde la ronda 2, **solo el revisor que tiene hallazgos pendientes**; el
  otro no se relanza si la corrección no toca sus ficheros (la regla ya lo
  dice; en TASK-293 no se cumplió).
- Ronda ≥ 2 sin suite completa: reutiliza la verificación de ronda (F-5).

## Paso 8 — Cierre (`finish`)

**Medido:**
- **Duración real en ToolsaWeb desde que declaró la verificación**
  (TASK-297, n=10): **mediana 28 min**, de 17 a 50 min. Casi todo es
  `scripts\verificar.bat` completo (27,2 min en TASK-293: de 08:43:52 a
  09:11:04 UTC); el merge y los artefactos tardan 8 s.
- En OpenDockTrading y TaskCode, sin verificación declarada: 0,1 min.
- `merge-feature.sh`: 6-7 s de mediana (máximo 24 s).
- Esta duración **no está en `metricas`**: la transición `finish` se anota
  con el instante del arranque del comando.

**Errores:**
- **Métrica ciega**: «punta a punta» excluye unos 28 min por tarea en el
  único proyecto que verifica. Las comparaciones entre versiones de ToolsaWeb
  desde la 0.13 están sesgadas a la baja.
- Completa en cada `finish` aunque las rondas ya pasaran la selectiva
  sobre el mismo código (el guardián no acepta la selectiva para código, que
  es la decisión D1 de TASK-108: es a propósito, pero cuesta 28 min por
  tarea).
- La vía de reintento no verifica (F-16, CRÍTICO, reproducido).
- La cobertura del nivel 2 no se mide en ningún sitio (F-17).

**Optimización:**
- Anotar el instante **final** de `finish` (o una columna de duración) y
  que `metricas` lo sume.
- **Verificar `develop` + la rama una sola vez por lote**: cuando se cierran
  varias tareas seguidas (lo normal en automático), las completas son
  secuenciales e idénticas en su mayor parte. Una completa del resultado
  integrado al final del lote, con vuelta atrás si sale rojo, cuesta 28 min
  por lote en vez de por tarea. **Decisión de Carlos**, porque relaja «cada
  integración en verde».
- Que la completa de ToolsaWeb reutilice lo que no cambió desde su último
  verde (su `verificar.bat` ya salta grupos por huella, como `SERVIDOR`):
  revisar por qué aun así son 27 min.
- Fundir `tarea terminada y artefactos de cierre` con el commit de merge.

## Paso 9 — Transversales

| pieza | medido | errores | optimización |
|---|---|---|---|
| Sincronización tras cada transición (`comando_sincronizacion`, ToolsaWeb: `grafo-tareas.py`) | sin dato: corre en cada transición (~8-10 por tarea) | coste invisible por transición | registrar su duración; correrla solo en `plan` y `finish`, que son las que cambian el grafo |
| `siguiente` / cadena de modos | sin dato | — | — |
| `pausa` | 3 pausas registradas en 175 tareas | casi nadie la usa, así que las noches cuentan como trabajo (TASK-109) | detectar huecos sin actividad (F-13) |
| `registrar-coste` | 1 commit por fase y ronda: 253+103 en ToolsaWeb | ruido en el historial | anotar el coste en el commit de la ronda, no en uno propio |
| `veredicto` | 1 commit por ronda | — | fundir con el informe |
| `metricas` | funciona; base de este informe | no ve `finish` real, ni `Stop`, ni sincronización | añadir esas tres columnas |
| `board`, `roadmap`, `doctor-deploy`, `codex-review`, wrappers | fuera del camino de cada tarea | — | — |

**Peso del proceso en el historial:** 23 commits por tarea en ToolsaWeb, 26
en OpenDockTrading y 23 en TaskCode, de los que **3-4 son de código**. Los
más frecuentes en ToolsaWeb: `peticion de revision` 353, `coste revision`
356, `veredicto` 203, `tarea en diseno` 157, `plan aprobado` 152,
`tarea en curso` 151, `tarea terminada` 150, `coste diseno` 140.

---

## Lista de arreglos por paso (nuevos respecto a la auditoría)

| # | Paso | Prio | Sev | Arreglo | Evidencia |
|---|---|---|---|---|---|
| P-1 | 8 | P1 | IMP | `finish` anota su instante final (o su duración) y `metricas` lo suma al punta a punta | ToolsaWeb: 28 min por tarea fuera de las métricas (n=10) |
| P-2 | 7 | P1 | IMP | Cerrar TASK-099 con estos datos: 71 rondas por MENORES, 2 CRIT/IMP, 70,2 M tokens en los tres proyectos | Paso 7 |
| P-3 | 5 | P2 | IMP | Registro de cada ejecución del freno `Stop` y columna en `metricas`; freno solo si el turno cambió código | Selectiva de 4,2 min sin registro de veces |
| P-4 | 6-7 | P2 | IMP | El revisor reutiliza la verificación de ronda del mismo commit; ronda ≥ 2 solo con el revisor que tiene pendientes | Ronda 2 = 94 % de la ronda 1; TASK-293 con 6 rondas × 2 revisores |
| P-5 | 6 | P2 | MEN | Petición con tests como `--stat` + ruta; objetivo < 50 KB | Mediana de 116 KB en ToolsaWeb |
| P-6 | 5 | P2 | MEN | Hooks PreToolUse que salen pronto (held-out no declarado, comando sin `git`) o con `matcher` más estrecho | Un proceso `node` por cada llamada a una herramienta |
| P-7 | 8 | P2 | IMP | Completa por lote de cierres en automático, con vuelta atrás — **decisión de Carlos** | 28 min × tarea en ToolsaWeb |
| P-8 | 0 | P1 | IMP | Declarar `comando_verificacion` en TaskCode y adelantar la TASK-014 de OpenDockTrading (o declarar ya sus `comprobar-*.py`); `doctor` lo pasa a aviso | Paso 0 |
| P-9 | 1-2 | P3 | MEN | Complejidad propuesta por similitud; rol único sin unificador en `simple` y en trozos de épica | OpenDockTrading sin complejidad; `alta` < `media` en tokens |
| P-10 | 4, 6, 8 | P3 | MEN | Línea `FIN` con duración en todos los scripts de Git-Flow | `create-*` no se puede medir |
| P-11 | 9 | P3 | MEN | Un commit por transición (coste, veredicto, petición e informe juntos) | 23-26 commits por tarea, 3-4 de código |
| P-12 | 9 | P3 | MEN | Registrar la duración de `comando_sincronizacion` y correrlo solo en `plan`/`finish` | ~8-10 ejecuciones por tarea sin dato |

**Orden recomendado**, sumado al de la auditoría: F-16 → P-1 → P-8 → P-2
(TASK-099) → P-4 → P-3 → el resto.
