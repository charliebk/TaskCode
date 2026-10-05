---
id: TASK-048
titulo: "F6-T3 Skill de flujo mas ligera"
tipo: feature
sprint: 7
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-048-f6-t3-skill-de-flujo-mas-ligera
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

La skill `task-workflow` pesa unos 25 KB y se carga entera cada vez que se
invoca, y las descripciones de las skills se cargan en todas las sesiones
(auditoria E1, E2, E3). Se adelgaza `SKILL.md` moviendo sincronizacion,
post-cierre y prerrequisitos a ficheros de referencia que se leen bajo
demanda, se acortan las descripciones sin perder sus disparadores, y el
contenido generico que repiten las 4 skills revisoras pasa a un solo sitio.

## Criterios de aceptacion
- [ ] `task-workflow/SKILL.md` por debajo de 15 KB; sincronizacion, post-cierre y prerrequisitos en ficheros de referencia bajo demanda
- [ ] Descripciones de las 5 skills por debajo de 300 caracteres cada una, sin perder los disparadores reales
- [ ] El contenido generico repetido en las 4 revisoras vive en un solo sitio
