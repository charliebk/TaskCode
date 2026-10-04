---
id: TASK-057
titulo: "Flujo C: fases como skills invocables en modo manual"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-057-flujo-c-fases-como-skills-invocables-en
asignado_a: charlie.bk@gmail.com
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

Parte de TASK-055 (su plan-final es el diseno de referencia). Un comando por fase para reanudar cualquier tarea en cualquier sesion, implementado como skill invocable por la persona (la documentacion de Claude Code recomienda skills frente a commands/).

## Criterios de aceptacion
- [ ] Existen las skills `new`, `board`, `plan`, `approve`, `start`, `review` y `finish`, invocables como `/taskcode-plugin:<fase>`, con frontmatter valido (`description`, `arguments`, `allowed-tools`)
- [ ] Cada skill de fase ejecuta su subcomando de `taskctl` y el trabajo de agentes de su fase (roles y unificador en plan, revisor independiente en review, segunda opinion si `revision_codex` es true)
- [ ] Cada skill de fase llama a `taskctl siguiente` al terminar y, en modo manual, termina nombrando la skill de la siguiente fase sin encadenar nada; un test ata cada skill al subcomando que nombra
- [ ] La skill de plan conserva la seleccion del mejor skill (`skills_recomendados`) y la de review el enrutado de revisor por dominio
- [ ] Las skills de fase hacen `cd` a la raiz del repo antes de llamar a `taskctl`
- [ ] Test de marcas propio para las skills de fase: no mencionan rutas ni documentos internos de este repo, con una lista de marcas justificada que si permite nombrar `taskctl`
- [ ] `task-workflow/SKILL.md` describe los tres modos y las skills de fase
