---
id: TASK-159
titulo: "Regla 4D (2a auditoria): lectores de vallas, secciones y celdas en core"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-159-regla-4d-2a-auditoria-lectores-de-vallas
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Unificar los lectores de bloques de codigo, secciones y celdas de tabla de src/core que la segunda auditoria 4D (docs/auditoria-4d-segunda.md) encontro copiados y con divergencias reproducidas.

## Criterios de aceptacion
- [ ] Un solo lector de vallas (dentroDeBloque) en leerHallazgos, leerPartes y leerDuracionEstimada, con test de vallas anidadas (C2-1, C2-2, C2-3)
- [ ] extraerSecciones salta bloques de codigo y troceo usa el lector de criterios de tarea-body (C2-4, C2-5)
- [ ] Un divisor y un escape de celdas de tabla comunes, y una sola insercion tras la ultima linea de una seccion (C2-6, C2-7, C2-10)
- [ ] hostDeRemoto y partesDeOrigin comparten el parser de la URL de origin (C2-14)
