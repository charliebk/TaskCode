---
id: TASK-156
titulo: "verificar-impacto elige los tests que leen los md de skills, agents y docs del plugin"
tipo: fix
sprint: 0
etiquetas: [verificacion, scripts]
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: fix/task-156-verificar-impacto-elige-los-tests-que-le
asignado_a: charlie.bk@gmail.com
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
dependencias: []
---
## Objetivo

scripts/verificar-impacto.mjs elegia los tests de un .md de skills/ solo por su nombre: los que leen la carpeta entera (test/skills/task-workflow.test.ts, que prohibe marcas del repo en todas las skills) quedaban fuera y en TASK-139b un rojo suyo paso la revision y solo lo vio la suite completa de finish. Un fichero cambiado bajo skills/, agents/ o docs/ del plugin debe elegir tambien los tests que leen esa carpeta.

## Criterios de aceptacion
- [ ] Un .md cambiado bajo skills/ del plugin elige todos los tests de test/skills/ que leen la carpeta (comprobado con --listar en el repo real: task-workflow.test.ts entra)
- [ ] Un fichero bajo agents/ elige los tests que leen agents/, y uno bajo docs/ del plugin los que leen PLUGIN_ROOT/docs, sin arrastrar los que usan docs en su repo temporal
- [ ] test/scripts/verificar-impacto.test.ts tiene un test que cae en rojo si se vuelve a ignorar un .md de skill (mutacion comprobada)
- [ ] La cabecera de scripts/verificar-impacto.mjs documenta la regla

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T09:56:01Z | plan | automatico | persona | 0.17.1 |
| 2026-11-24T09:56:49Z | approve | automatico | persona | 0.17.1 |
