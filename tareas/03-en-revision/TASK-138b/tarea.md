---
id: TASK-138b
titulo: "decision de la puerta, constante muerta, textos del tope y doctor (parte b de TASK-138)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-138-regla-4d-duplicacion-en-metricas-suite-y
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 19218100
tokens_revision: 3259738
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: [TASK-138a]
---
## Objetivo

Parte b del troceo de TASK-138 (Regla 4D: duplicacion en metricas, suite y registro de puertas), partes TASK-138a, TASK-138b en la rama fix/task-138-regla-4d-duplicacion-en-metricas-suite-y.

La decision verde/rojo/omitido compartida por anotarFinish, review, anotarSuite y verificar-lote; PUERTAS_VERIFICACION usada o eliminada; textos del tope de rondas de una fuente; doctor lee las terminadas una vez.

## Criterios de aceptacion
- [x] anotarFinish, el bloque de review, anotarSuite y verificar-lote comparten la decision verde/rojo/omitido, y PUERTAS_VERIFICACION se usa en metricas o se elimina con su test
- [x] Los textos de las salidas del tope de rondas (siguiente, salidasTopeRondas, error de review) salen de una sola fuente y doctor lee las terminadas una vez

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T16:39:13Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T16:39:45Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T16:39:47Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T16:51:01Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — ef06122: anotarVerificacion junto a anotarPuerta en fs/registro-puertas (sin modulo nuevo); textoSalidasTope compuesto de salidasTopeRondas, que ya era la fuente estructurada; leerTextosTerminadas sustituye cuatro recorridos de 04-terminadas en doctor, y las funciones exportadas conservan su firma con la lectura como parametro opcional; PUERTAS_VERIFICACION eliminada (nadie la usaba); mutacion en rojo: anotarVerificacion sin el caso omitido
- code-quality-reviewer — ef06122

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T16:51:01Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 48 | 44720 | 19156058 | 17274 | 13 | 19218100 | - | - |
| 2026-11-24T17:16:42Z | revision | agente:ae24b58f4d0c70201 | 52 | 138828 | 3105868 | 14990 | 6 | 3259738 | 1 | - |

## Verificacion ligera

- 2026-11-24T17:16:44Z: ronda 1; commit revisado 91b1c964891a28c4c6dff9759cb09c952e64ea55; commit verificado ae9368f23229a0d29e30fbb071b67dacd477ead3; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts; corregidos: MEN-1; pendientes: MEN-2, MEN-3, MEN-4, MEN-5

## Resultado

- A4: `anotarVerificacion` en fs/registro-puertas: instante, duración y omitido/verde/rojo. La usan `anotarFinish`, el bloque de review, `anotarSuite` y verificar-lote.
- A5: `PUERTAS_VERIFICACION` no la usaba nadie en src; se elimina con su test tautológico.
- A6:
  - `textoSalidasTope` (core/flujo) compone, desde `salidasTopeRondas`, el motivo del tope en `siguiente` y el error de review: tres salidas numeradas, cada una con su comando.
  - doctor lee una vez las tareas terminadas (`leerTextosTerminadas`) para la cuenta, el crecimiento de la suite, la poda y el documento de estado.
- Revisión, ronda 1: aprobada con correcciones.
  - MEN-1 corregido (salidas numeradas).
  - MEN-3 y MEN-4 corregidos con tests: `omitido` en review al reutilizar el memo, y las terminadas ilegibles cuentan. `verificar-menores` los lista como pendientes porque no tocan el fichero citado, sino un test.
  - MEN-2 aceptado: el freno tiene su propio caso, `excedido`. Queda para TASK-140 o TASK-158.
  - MEN-5 aceptado: una lectura de más, solo con la config nula.

## Verificacion parcial

- 2026-11-24T17:16:59Z: todo el codigo que cambia la tarea (19 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
