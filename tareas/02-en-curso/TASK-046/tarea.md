---
id: TASK-046
titulo: "F5-T2 Secciones con subtitulos y criterios multilinea"
tipo: fix
sprint: 6
etiquetas: []
complejidad: trivial
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
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
- [x] `extraerSecciones` no corta el Objetivo ni los criterios en un `###`; `### Tras el cierre` se reconoce como subseccion
- [x] `import` acepta la continuacion sangrada de un criterio, igual que `tarea-body.ts`
- [x] Tests con criterios agrupados en `### Parser` y `### CLI`

## Resultado

**Implementado.** `extraerSecciones` (`src/core/tarea-body.ts`): solo una
cabecera de nivel 2 cambia de seccion. Un subtitulo `###` o mas profundo
dentro de `## Objetivo` se conserva como texto; dentro de `## Criterios de
aceptacion` no corta la lista, y `### Tras el cierre` es la excepcion
explicita: sus casillas van a un campo nuevo, `criteriosTrasCierre`, y no a
`criterios`. En `import-parser.ts`, una linea sangrada justo despues de un
criterio se une a el en vez de invalidar la entrada; la prosa sin sangrar
sigue siendo un error.

**Pruebas.** `test/core/tarea-body-subtitulos.test.ts` (6): criterios en
`### Parser` / `### CLI`; `### Tras el cierre` aparte; `### Contexto` en el
Objetivo; un `##` posterior sigue cerrando; criterio multilinea en `import`;
prosa sin sangrar sigue invalidando. Con `core/*`, `import`, `plan-brainstorm`
y `new-contenido`: 388/388 sin tocar expectativas.
