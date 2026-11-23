---
id: TASK-147b
titulo: "criterios, normalizacion, citar e IDs (parte b de TASK-147)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-147a]
---
## Objetivo

Parte b del troceo de TASK-147 (Regla 4D: lectores de secciones e IDs en core), partes TASK-147a, TASK-147b, TASK-147c en la rama fix/task-147-regla-4d-lectores-de-secciones-e-ids-en.

casillasSinMarcar, normalizar, citar y el ID de tarea con un solo lector (CORE2-04, CORE2-05, CORE2-07, CORE2-01, CORE2-14, FS-04, CMD2-08).

## Criterios de aceptacion
- [ ] casillasSinMarcar usa extraerSecciones (Tras el cierre en negrita y ### Criterios) y validacion-tarea usa normalizarTexto; citar() existe una vez
- [ ] El ID de tarea se valida y se ordena con una sola regex y un solo lector de numero con letra (task-store, wip-scan, roadmap, trocear, evolucion, flujo); un test con TASK-121a y TASK-1000 ordena igual en roadmap, evolucion, board y wip
