---
id: TASK-045
titulo: "F5-T1 rama_base de punta a punta"
tipo: fix
sprint: 6
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-045-f5-t1-rama-base-de-punta-a-punta
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

`rama_base` (clave de `.taskcode/config.yml`) solo funciona hasta `approve`:
`start`, `review` y `finish` invocan los scripts de Git-Flow sin `--develop`,
y `finish.ts` fija `develop` como constante, asi que con `rama_base: dev` el
ciclo muere en `start` con «develop no existe» (auditoria D1). Los scripts ya
aceptan `--develop <rama>`: el cambio es que los tres comandos se lo pasen
para feature, fix y release (y para el backmerge de hotfix/release), y que
`finish` use la rama base resuelta en lugar del literal. Sin config, el
comportamiento es identico al de hoy.

## Criterios de aceptacion
- [ ] Los scripts de Git-Flow reciben la rama base y `finish.ts` deja de fijar `develop`
- [ ] Test: con `rama_base: dev`, `new -> plan -> approve -> start -> review -> finish` termina
