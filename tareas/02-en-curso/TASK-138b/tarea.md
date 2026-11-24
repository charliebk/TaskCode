---
id: TASK-138b
titulo: "decision de la puerta, constante muerta, textos del tope y doctor (parte b de TASK-138)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-138-regla-4d-duplicacion-en-metricas-suite-y
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: [TASK-138a]
---
## Objetivo

Parte b del troceo de TASK-138 (Regla 4D: duplicacion en metricas, suite y registro de puertas), partes TASK-138a, TASK-138b en la rama fix/task-138-regla-4d-duplicacion-en-metricas-suite-y.

La decision verde/rojo/omitido compartida por anotarFinish, review, anotarSuite y verificar-lote; PUERTAS_VERIFICACION usada o eliminada; textos del tope de rondas de una fuente; doctor lee las terminadas una vez.

## Criterios de aceptacion
- [ ] anotarFinish, el bloque de review, anotarSuite y verificar-lote comparten la decision verde/rojo/omitido, y PUERTAS_VERIFICACION se usa en metricas o se elimina con su test
- [ ] Los textos de las salidas del tope de rondas (siguiente, salidasTopeRondas, error de review) salen de una sola fuente y doctor lee las terminadas una vez

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T16:39:13Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T16:39:45Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T16:39:47Z | start | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — ef06122: anotarVerificacion junto a anotarPuerta en fs/registro-puertas (sin modulo nuevo); textoSalidasTope compuesto de salidasTopeRondas, que ya era la fuente estructurada; leerTextosTerminadas sustituye cuatro recorridos de 04-terminadas en doctor, y las funciones exportadas conservan su firma con la lectura como parametro opcional; PUERTAS_VERIFICACION eliminada (nadie la usaba); mutacion en rojo: anotarVerificacion sin el caso omitido
- code-quality-reviewer — ef06122
