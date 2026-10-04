---
id: TASK-046
titulo: "F5-T2 Secciones con subtitulos y criterios multilinea"
tipo: fix
sprint: 6
etiquetas: []
complejidad: trivial
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-046-f5-t2-secciones-con-subtitulos-y-criteri
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

Que el parser del cuerpo de una tarea no pierda texto en un subtitulo, y que
`import` acepte criterios en varias lineas (auditoria del 2026-10-03, D2 y
D7). Hoy `extraerSecciones` corta el Objetivo y los criterios en cualquier
`###`: con criterios agrupados en `### Parser` / `### CLI` devuelve
`criterios: []`, la peticion de brainstorm dice «la tarea no declara
criterios» y la heuristica cuenta 0. Y `### Tras el cierre` (la guia que
anadio TASK-033) queda fuera solo por casualidad. TASK-043 (validacion antes
de `plan`) depende de que este recuento sea correcto.

Complejidad `trivial`: dos parsers puros y sus tests.

## Criterios de aceptacion
- [ ] `extraerSecciones` no corta el Objetivo ni los criterios en un `###`; `### Tras el cierre` se reconoce como subseccion
- [ ] `import` acepta la continuacion sangrada de un criterio, igual que `tarea-body.ts`
- [ ] Tests con criterios agrupados en `### Parser` y `### CLI`
