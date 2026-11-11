---
id: TASK-106
titulo: "Verificacion proporcional B3: finish verifica solo lo afectado con codigo parcial"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-106-verificacion-proporcional-b3-finish-veri
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1097656
tokens_implementacion: 13754830
tokens_revision: 12485760
creado: 2026-11-11
actualizado: 2026-11-11
dependencias: [TASK-105]
---
## Objetivo

Tercera parte de TASK-096. Con la decision selectiva de TASK-105, puertaSoloDocumentacion pasa a puertaProporcional: si la decision es selectiva, finish corre comando_verificacion_selectiva (con RAMA_BASE y timeout_verificacion_selectiva, reutilizando el memo del Stop o de review si casa la huella) en vez de la completa, y lo dice en su salida con el motivo; lo anota en tarea.md en una seccion idempotente. Decisiones de Carlos: la puerta de cobertura queda omitida en el nivel 2 (se mide en la completa del release); release y hotfix siempre a la completa; el verde selectivo nunca escribe el memo de la completa. Se retira el texto aunque las rondas usaran la selectiva cuando aplica la clave. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [x] En un repo temporal cuya tarea cambia codigo dentro de rutas_verificacion_parcial, finish ejecuta solo la selectiva (contadores: selectiva 1, completa 0), integra y lo dice en su salida; con codigo fuera de esas rutas ejecuta la completa (contadores al reves) y dice por que (un test por caso)
- [x] Con la selectiva en rojo no integra: develop no se mueve y la tarea sigue en revision (test)
- [x] El verde de la selectiva no escribe freno-verificacion.json; la puerta de cobertura queda omitida en el nivel 2; release y hotfix ejecutan la completa (un test por caso)
- [x] Una rama que cambia a la vez codigo y su propio clasificador (fuera de las rutas declaradas) va a la completa (test)
- [x] Un proyecto que ya declara comando_verificacion_selectiva pero no la clave nueva se comporta como en la 0.14.0: finish corre la completa (los tests TASK-091 siguen igual)
- [x] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T18:20:10Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T18:29:20Z | approve | automatico | persona | 0.14.0 |
| 2026-11-11T18:29:22Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T19:12:13Z | review | automatico | persona | 0.14.0 |
| 2026-11-11T20:44:44Z | review | automatico | persona | 0.14.0 |
| 2026-11-11T21:27:43Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T18:27:40Z | diseno | agente:a1fb71a103a425a39,a80b09e5e7c94a2da,a4f5fe5bc4fa543a6 | 60 | 151053 | 916335 | 30208 | 43 | 1097656 | - | - |
| 2026-11-11T19:12:13Z | implementacion | sesion:b6475f64-094f-4992-9e7f-78692efbf074 | 132 | 111947 | 13588928 | 53823 | 32 | 13754830 | - | - |
| 2026-11-11T19:54:24Z | revision | agente:a1fb4fb8024962dbf | 88 | 165073 | 6237463 | 19555 | 7 | 6422179 | 1 | - |
| 2026-11-11T21:26:51Z | revision | agente:a09c48cc051afd0cb | 90 | 158382 | 5874207 | 30902 | 6 | 6063581 | 2 | - |

## Autorrevision

- code-quality-reviewer — 89f9e82
- code-quality-reviewer — 4baf8f5

## Resultado

**Implementado** (`commands/finish-verificacion.ts`, `finish-cobertura.ts`, `finish.ts`, `core/transiciones.ts`, `fs/verificacion.ts`):
- `puertaSelectiva`: si la base declara `rutas_verificacion_parcial` y todo el codigo de la tarea cae en ellas, finish corre `comando_verificacion_selectiva` con `RAMA_BASE=<base>` impuesto y `timeout_verificacion_selectiva` de la base (via `verificarConMemo`), en vez de la completa. Lo dice en su salida con el motivo y, tras el verde, lo anota y commitea en la seccion idempotente `## Verificacion parcial` antes del merge. Su rojo, o un arbol sucio tras el verde, bloquean sin anotar ni mover develop.
- D1 (Carlos): reutiliza el memo selectivo del Stop o de review solo si casa la huella (arbol limpio, mismo HEAD, base y su SHA) y estaba en verde (`memoSoloVerde`, opcion nueva de `verificarConMemo` con valor por defecto que no cambia el Stop ni review). Excepcion acotada a TASK-072, escrita en la cabecera de `finish-verificacion.ts`; la completa sigue sin memo. El verde selectivo solo va a `freno-verificacion-selectiva.json`.
- D2 (Carlos): el hotfix nunca usa la selectiva (`permitirSelectiva: false`) y conserva su camino de solo documentacion; el release no recibe `ramaBase` y va a la completa.
- Cobertura: `ResultadoPuerta` gana el caso `selectiva` y `puertaCobertura` lo trata como omitido (se mide en la completa del release).
- Texto TASK-091: sin la clave nueva sigue igual; con el nivel 2, el rojo de la completa dice el motivo real (que queda fuera de las rutas parciales).
- Modo 6 de riesgos: un reintento que acaba en la completa tras una selectiva anotada deja su linea bajo `## Verificacion parcial` (`anotarCompletaTrasParcial`, anotada antes de correr para que el memo de la completa case con el commit integrado).
- `anotarYCommitear` extrae el patron escribir/commitear/releer que estaba repetido; la idempotencia de las secciones compara con la ultima linea.
- D3 (Carlos): una sola tarea de ~70 min, sin trocear.

**Tests**: `test/commands/finish-parcial.test.ts` (16 tests contra repos temporales: un caso por criterio, hotfix con codigo y de solo documentacion, release, memo verde reutilizado, memo rojo/cortado reejecutado, arbol sucio, reintentos). Test con expectativa cambiada: `finish-documentacion.test.ts` (TASK-105, TASK-906) pasaba «con el nivel 2, finish sigue con la completa»; ahora espera la selectiva, que es justo el cambio de esta tarea. Los tests TASK-091 de `verificacion-selectiva.test.ts` no cambian. Mutantes comprobados sobre todas las guardas nuevas.

**Suite**: `npm test` 2210 tests, 2206 pasan; fallan solo los 3 conocidos de Windows (symlink EPERM, chmod NTFS, CRLF). Rojos intermitentes vistos y descartados al reejecutar aislados: `freno: la cola va acotada...` (1.ª pasada) y `origin (TASK-038): ...expira...` (pasada del revisor), ninguno relacionado con el diff.

**Revision por pares**: ronda 1 (general-purpose sonnet, code-quality-reviewer): IMP-1 (la guarda de arbol sucio tras la selectiva sin test), MEN-1 (selectiva-completa-selectiva dejaba la ultima linea mintiendo), MEN-2 (dos `motivoDeLaCompleta` con semantica distinta; la de finish pasa a `motivoCompletaEnFinish`), MEN-3 («No se ha tocado nada» tras commitear la anotacion de un reintento). Todos corregidos en 4baf8f5 con test y mutante. Ronda 2 (haiku, verificacion acotada): aprobada, sin hallazgos nuevos.

**Decidido no corregir**: nota de la ronda 2 — si `autoCommit` escribiera `tarea.md` sin devolver commit, el rojo diria «No se ha tocado nada»; misma imprecision previa de la via de documentacion, sin caso real conocido. Aceptado.

**Fuera de alcance (096-6)**: documentar `rutas_verificacion_parcial` en README, CHANGELOG y `verificacion-selectiva.md`; el guardian sigue exigiendo la completa hasta B5.

## Duracion

- Estimada: 70 min
- Real (de la rama abierta al cierre con merge, sin pausas): 178 min
- Paso de la hora: 178 min reales frente a 70 estimados
