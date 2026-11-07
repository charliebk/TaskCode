---
id: TASK-083
titulo: "Cierre sin ronda 2 completa cuando solo quedan MENORES"
tipo: feature
sprint: 0
etiquetas: [revision, coste, flujo]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-083-cierre-sin-ronda-2-completa-cuando-solo
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Muchas segundas rondas probablemente solo verifican MENORES. Primero confirmarlo con los veredictos de ToolsaWeb; si se confirma, cuando la ronda 1 no deja CRITICOS ni IMPORTANTES, verificar las correcciones con el diff de las correcciones en vez de otra revision completa.

## Criterios de aceptacion
- [ ] Queda medido en docs/METRICAS.md cuantas rondas 2 de ToolsaWeb y TaskCode tenian solo MENORES abiertos tras la ronda 1
- [ ] Si la medida lo justifica, taskctl review ofrece una verificacion acotada al diff de las correcciones cuando la ronda anterior solo dejo MENORES, y lo cubren tests con repos Git temporales
- [ ] Un CRITICO o IMPORTANTE abierto obliga siempre a la ronda completa; lo cubre un test
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T10:48:07Z | plan | automatico | persona |
