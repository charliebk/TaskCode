---
id: TASK-168
titulo: "Agilidad: un cambio solo en md de skills o agentes se verifica con sus tests"
tipo: fix
sprint: 0
etiquetas: [agilidad]
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-168-agilidad-un-cambio-solo-en-md-de-skills
asignado_a: charlie.bk@gmail.com
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

Que verificar-impacto, cuando cambian .md de skills o agentes del plugin, elija los tests que de verdad los leen (los de test/skills y test/agents y los que nombran esa skill concreta) y no todos los tests que mencionan cualquier SKILL.md: hoy cada parte que toca skills arrastra unos 1800 tests y 25-30 min. Decision de Carlos (2026-11-25): agilidad, la suite completa se corre una vez antes de publicar.

## Criterios de aceptacion
- [ ] Un cambio en skills/<x>/SKILL.md elige los tests de test/skills y test/agents que leen la carpeta, y fuera de ellos solo los que nombran esa skill (su carpeta y el fichero), no los que solo mencionan SKILL.md
- [ ] Un cambio en agents/<x>.md elige los tests que lo nombran y los de test/agents que leen la carpeta
- [ ] Un test contra un repo temporal falla si un cambio de skill vuelve a arrastrar tests de comandos que no la nombran, o si deja fuera uno que si la nombra

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T14:53:37Z | plan | automatico | persona | 0.18.0 |
