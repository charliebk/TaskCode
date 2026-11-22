---
id: TASK-138
titulo: "Regla 4D: duplicacion en metricas, suite y registro de puertas"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-138-regla-4d-duplicacion-en-metricas-suite-y
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-22
dependencias: []
---
## Objetivo

Corregir las duplicaciones que encontro la auditoria 4D de TASK-137 (docs/auditoria-4d.md, casos A1-A6): un solo agregador de la suite por version, una sola mediana, una sola decision verde/rojo/omitido por puerta, sin regex ni constantes duplicadas o muertas.

## Criterios de aceptacion
- [ ] metricas --por-version y el aviso de crecimiento de doctor usan el mismo agregador de suite por version; un test con una tarea que corre la completa dos veces da la misma cifra en las dos vistas
- [ ] Una sola funcion mediana (versiones-metricas, crecimiento-suite, la exportada en metricas.ts y la de tramoDe en evolucion.ts la comparten; TASK-141, CORE2-11) y la regex de pytest se evalua una vez en contarTests
- [ ] anotarFinish, el bloque de review, anotarSuite y verificar-lote (TASK-141) comparten la decision verde/rojo/omitido; PUERTAS_VERIFICACION se usa en metricas o se elimina con su test
- [ ] Los textos de las salidas del tope de rondas (siguiente, salidasTopeRondas, error de review) salen de una sola fuente y doctor lee las terminadas una vez
