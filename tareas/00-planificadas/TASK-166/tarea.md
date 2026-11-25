---
id: TASK-166
titulo: "Regla 4D (2a auditoria): helpers de test duplicados por las correcciones"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-166-regla-4d-2a-auditoria-helpers-de-test-du
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

Unificar los helpers de test que copiaron las propias correcciones 4D (segunda auditoria 4D, docs/auditoria-4d-segunda.md); los anteriores siguen en TASK-152.

## Criterios de aceptacion
- [ ] git, runScript y conRepo de test/gitflow y test/fs vienen de helpers comunes (TR-1, TR-2)
- [ ] porcelain y ficherosDeHead estan en un solo helper con un solo criterio de workspace limpio (TC-6)
- [ ] perfil-tests.test usa resolverBash en vez de reimplementarlo (TR-3)
