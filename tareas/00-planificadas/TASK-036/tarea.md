---
id: TASK-036
titulo: "F1-T3 Veredicto con un comando e informe estructurado"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-036-f1-t3-veredicto-con-un-comando-e-informe
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


## Criterios de aceptacion
- [ ] `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados` sustituye la linea del informe de mayor N
- [ ] El scaffold de `informe-revision-N.md` trae la tabla `| ID | Severidad | Estado | Fichero |`
- [ ] El parser de `finish` acepta `**aprobada**`; `no aprobada` sigue fallando, con test
- [ ] Test del comando contra un repo real
