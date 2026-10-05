---
id: TASK-051
titulo: "F6-T2 Partir los ficheros de test mas largos"
tipo: feature
sprint: 7
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-051-f6-t2-partir-los-ficheros-de-test-mas-la
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

Los ficheros de test de `start`, `finish`, `review`, `sincronizacion` y
`gitflow` son el camino critico secuencial de la suite (auditoria B5): el
runner paraleliza por fichero y esos cinco tardan mas que todo lo demas. Se
parten en ficheros mas pequenos (o se les da concurrencia interna) y se mide
el tiempo de la suite completa antes y despues, sin carga en la maquina.

## Criterios de aceptacion
- [ ] `start`, `finish`, `review`, `sincronizacion` y `gitflow` divididos o con concurrencia interna
- [ ] Tiempo de la suite completa antes y despues medido sin carga
