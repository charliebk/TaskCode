---
id: TASK-017
titulo: "Catálogo de skills determinista con selección en dos pasos"
tipo: feature
sprint: 3
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: en-curso
plan_aprobado: true
rama: feature/task-017-catalogo-de-skills-determinista-con-sele
asignado_a: charlie.bk@gmail.com
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-09
dependencias: [TASK-010]
---
## Objetivo

Implementar la seleccion de skills descrita en la seccion 6.6 de
`docs/PROPUESTA_METODOLOGIA.md`: un catalogo propio y versionado en
`scripts/catalogo-skills.yml` que declare, por cada skill (propio del
plugin o externo de un marketplace), sus campos `id`, `origen`, `rol`
(revisor | ejecucion), `prioridad`, `etiquetas`, `patrones_archivo` y
`descripcion`.

La seleccion es de dos pasos y determinista primero: `taskctl plan`
cruza las `etiquetas` de la tarea contra el catalogo y calcula, sin
LLM, un top-N de candidatos por solape. El desempate entre candidatos
que empatan en solape usa primero la `prioridad` declarada en el
catalogo (seccion 16.4.1); solo si tambien empatan en prioridad se
recurre a un juicio barato con Haiku sobre ese top-N (2-3 candidatos,
nunca sobre el catalogo entero) para decidir cual encaja mejor con el
objetivo real de la tarea.

El resultado de la seleccion (que skill se eligio y por que regla —
solape, prioridad o desempate por LLM) queda registrado para poder
auditarlo despues. Si el candidato elegido es `origen: externo` y no
esta instalado, se anota como sugerencia de instalacion manual
(`/plugin install X@Y`); nunca se instala nada automaticamente.

Queda fuera de alcance a proposito el enrutado del agente revisor por
el diff real usando `patrones_archivo` (seccion 16.5) — eso es
TASK-018. Aqui el catalogo declara ese campo, pero todavia no lo
consume nadie; la seleccion de `agente_revisor` sigue basandose en
`etiquetas`.

## Criterios de aceptacion
- [ ] Crea `scripts/catalogo-skills.yml` con los skills propios y externos que el equipo ya usa.
- [ ] La selección es determinista primero (heurística por etiquetas, tipo y ficheros tocados) y solo recurre a un LLM para desempatar.
- [ ] Registra en la tarea qué skills se seleccionaron y por qué regla, para poder auditarlo después.
- [ ] Tests de la heurística con casos de empate y de no coincidencia.
