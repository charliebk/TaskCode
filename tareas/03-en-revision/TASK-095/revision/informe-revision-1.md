# Informe de revision — TASK-095 (ronda 1)

- Commit revisado: 296cff1cea3e39ae73515bb891cf4a8ebd8278a1
- Revisor: general-purpose (sonnet) con code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-095 aprobada | aprobada-con-correcciones | cambios-solicitados)

El revisor propuso `aprobada-con-correcciones`. En modo automatico esa forma no se corrige despues (lo mergeado tiene que ser lo revisado), asi que los MENOR que merece la pena corregir se piden como `cambios-solicitados` (skill review, paso 4).

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/informe-revision.ts (guarda `esPlantilla` en `alcanceRondaSiguiente`) y test/commands/review-alcance.test.ts | implementacion |
| MEN-2 | MENOR | abierto | src/commands/review.ts (rama `fueAcotada`) y test/commands/review-alcance.test.ts | implementacion |
| MEN-3 | MENOR | abierto | src/commands/review.ts (`sinMarcar`) y test/commands/review-alcance.test.ts | implementacion |
| MEN-4 | MENOR | abierto | src/core/informe-revision.ts (`resumirHallazgos`) y src/commands/review.ts (`conSufijo`) | implementacion |
| MEN-5 | MENOR | abierto | test/commands/review-alcance.test.ts, test/commands/automatico-rondas.test.ts | implementacion |
| MEN-6 | MENOR | abierto | src/commands/veredicto.ts, src/commands/review.ts | implementacion |

No hay CRITICO ni IMPORTANTE. La logica de alcance, el tope y la planificacion por revisor se comportan como piden el plan y las decisiones de la persona.

### Reproduccion de cada hallazgo

**MEN-1. La guarda de informe-plantilla del alcance no tiene test que la discrimine.** Mutante: en `alcanceRondaSiguiente`, `if (esPlantilla(...)) return completa(...)` pasa a `if (false as boolean)`: SOBREVIVE (review-alcance, review-incremental, core/siguiente, automatico-rondas en verde). La guarda importa: con dos informes (uno con `IMP-1` y `cambios-solicitados`, otro que sigue siendo la plantilla) la salida es `acotada: false un informe de la ronda anterior sigue siendo la plantilla`; sin la guarda saldria acotada con un fragmento sin revisar. Falta un test de ronda fragmentada con un fragmento sin rellenar.

**MEN-2. «Una completa tras una acotada revisa desde la base»: correcto, sin test.** Mutante: `if (!acotada && previa.fueAcotada && desde !== baseBranch)` pasa a `if (false as boolean)`: SOBREVIVE. Comprobado en repo temporal: R2 acotada, informe de R2 sin tabla, R3 completa desde develop con el motivo «la ronda 2 fue acotada». El test de TASK-083 que lo cubria se borro sin sustituto (criterio 7) y el README sigue prometiendo la regla.

**MEN-3. Nada comprueba que un `corregido` no dispara el aviso de «sin marcar».** Mutante: `hallazgosNoCerrados(texto).abiertos` pasa a `hallazgosPendientes(texto).abiertos` en `sinMarcar`: SOBREVIVE. El test del aviso solo usa `abierto` y `aceptado`; falta una fila `corregido` con `assert.doesNotMatch`.

**MEN-4. Las metricas cuentan doble un hallazgo cuando una ronda acotada lleva sufijo.** `resumirHallazgos` con `informe-revision-1.md` (revisor `''`, `IMP-1 abierto`) e `informe-revision-2-code-quality-reviewer.md` (`IMP-1 corregido`) cuenta 2 IMPORTANTES. Es la consecuencia aceptada en el docblock (MEN-3 de TASK-064), pero esta tarea la hace frecuente e infla `taskctl metricas`. No rompe veredicto, finish ni siguiente.

**MEN-5. Dos pruebas del criterio no estan literalmente.** Criterio 3: el test del dominio usa `java-spring-reviewer`, no un diff de Rust con `rust-wasm-reviewer`. Criterio 5: el tope `preguntar` en los tres modos solo tiene test unitario; por spawn solo existe `automatico-rondas.test.ts` (automatico, sin `--ronda-extra`). Comprobado a mano por spawn en automatico: tras la ronda 3, `siguiente` da `preguntar` con `--ronda-extra`; `review` sin flag sale con 1 y el mensaje del tope; con `--ronda-extra`, 0 y ronda 4.

**MEN-6. Texto residual.** `veredicto.ts:60` sigue citando el aviso de «solo MENORES», que ya no existe (`avisos` es siempre `[]`). En el tope, el `comando` de `siguiente` incluye `--ronda-extra` con `accion: preguntar`: un orquestador que ejecute `comando` sin leer la accion se saltaria el control humano.

### Resumen de lo ejecutado

Clones en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-095-r1` y `-r1-b`, borrados al terminar sin nada que conservar. Lista pedida (`review-*`, `veredicto*`, `core/siguiente`, `siguiente*`, `automatico*`, `semiautomatico`, `skills/**`): 198/198 (3 min 43 s). `npm run test:rapido`: 682/682. Suite completa no repetida (implementador: 2080/2084, los 3 rojos conocidos).

Mutantes: 20 muertos (filtros de `hallazgosPendientes`, guardas de veredicto y `total === 0`, tope `>`/`>=`, `--ronda-extra` ignorado, tope que bloquea siempre, aviso desactivado, `seccionPrevia` global, plan sin dominios del delta o solo generico, `conSufijo` nunca, `--completa` sin base, «sin base fiable» acotada, merge sin nombrar, `flujo.ts` con `detener`, sin `REGLA_HALLAZGOS_NUEVOS`, `seccionSinPendientes` alterada, y dos del tope). Sobreviven 3: MEN-1, MEN-2, MEN-3.

Casos intentados: sin base fiable → completa desde la base; informes ilegibles → fail-closed (salvo MEN-1); dominio con pendientes recibe su peticion y el generico no verifica lo suyo; sufijos frente a veredicto, finish y siguiente sin incidencias (metricas: MEN-4); `--completa` siempre desde la base; peticiones antiguas sin commit revisado → completa con aviso. Observacion sin hallazgo: la ronda 3 verifica `corregido` de R2 contra un delta que no los contiene (decision 3; puede leer el repo).

Criterios: 1, 2, 4, 6 y 8 cumplen; 3 y 5 a medias (MEN-5); 7 a medias (MEN-2 y falta `## Resultado`, que se escribe al cerrar); 9 no verificado por el revisor. Las 8 decisiones de la persona estan en el codigo.

## Lecturas fuera del contexto permitido

- `src/core/revisores.ts`, `src/fs/rondas.ts`, `src/commands/siguiente.ts`: fragmentacion, sufijos y calculo de `rondaRevision`.
- `test/helpers/review-fixtures.ts`, `test/helpers/automatico-fixtures.ts`, `test/commands/automatico-rondas.test.ts`: escenarios por spawn del tope.
- `git show` del test de alcance antes de la tarea (fa18c8e): para listar los tests borrados.
- `tareas/.../TASK-095/tarea.md`, `src/commands/veredicto.ts` y grep en README/docs: restos de la regla antigua.
