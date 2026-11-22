---
id: TASK-152
titulo: "Regla 4D: duplicacion de helpers de test"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-152-regla-4d-duplicacion-de-helpers-de-test
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

Que los tests usen los helpers de test/helpers en vez de copias que ya divergen (auditoria 4D completa, docs/auditoria-4d-completa.md, casos TCMD-06 a TCMD-11, TCORE-04 a TCORE-06, TRES-01 a TRES-05, TRES-10, TRES-11 y TRES-13).

## Criterios de aceptacion
- [ ] git, commitAll, el montaje del repo y las fabricas de Task vienen de test/helpers con una sola semantica; las fabricas no usan as Task para tapar campos que faltan
- [ ] Un helper del verificador falso sustituye a las 14 copias; doctor-deploy, siguiente, cadena, semiautomatico y codex-review importan sus fixtures
- [ ] MARCAS_DEL_REPO, la extraccion de seccion, validar con Claude, el tope de tamano de task-workflow y runScript existen una vez en los tests
- [ ] Sin imports muertos en los helpers; smoke-test.sh no cita documentos internos y las claves falsas viven en claves-falsas.ts
