---
id: TASK-035
titulo: "F1-T2 Politica de rondas y una sola suite por ronda en las skills"
tipo: feature
sprint: 2
etiquetas: []
complejidad: trivial
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-035-f1-t2-politica-de-rondas-y-una-sola-suit
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

Llevar a las skills la politica de rondas A3 y la regla A4 de la auditoria
del 2026-10-03, aprobadas por Carlos: sin CRITICO ni IMPORTANTE abiertos una
ronda cierra la tarea, los MENOR corregidos no abren ronda 2, y el revisor
corre la suite completa una sola vez por ronda (los mutantes, con el fichero
de test concreto). Hoy la skill de flujo y dos revisoras dicen «dos rondas es
lo normal», y las revisoras piden la suite entera dos veces.

Solo documentacion: no toca `src/`. Complejidad `trivial` (no `simple`, como
se importo): el contenido ya esta decidido y no hay diseno que explorar.

## Criterios de aceptacion
- [x] `task-workflow/SKILL.md` recoge la politica A3: sin CRITICO ni IMPORTANTE abiertos una ronda cierra; si solo se corrigen MENOR no hay ronda 2; la ronda 2 solo revisa el delta
- [x] Las 4 skills revisoras piden la suite completa una vez por ronda y los mutantes con `node --test <fichero>`
- [x] Con varios revisores en paralelo, instruccion de concurrencia reducida
- [x] Tests de `test/skills/` en verde, incluido el de no mencionar el proyecto

## Resultado

**Implementado** (solo documentacion, sin tocar `src/`). `task-workflow`:
el parrafo **Rondas** recoge la politica A3 en lugar de «dos rondas es
normal». Las 4 revisoras: la puerta y la linea base son una sola pasada de la
suite por ronda, los mutantes se comprueban con el fichero o la clase de test
concretos, y con varios revisores en paralelo la suite va con concurrencia
reducida o por turnos. `angular-vue` y `java-spring` cambian su «dos rondas es
lo normal» por la misma politica. Para no pasar de 500 lineas, `task-workflow`
pierde un parrafo de la seccion de sincronizacion que repetia la lista de
pasos de encima.

**Pruebas.** `node --test dist/test/skills/*.test.js`: 40/40 (estructura,
tamano, marcas prohibidas). Ningun «Dos rondas» queda en las skills.

**Revision ronda 1: aprobada** (0 criticos, 0 importantes, 1 menor). Por A3,
sin ronda 2. M1, aceptado sin corregir: `code-quality-reviewer` y
`csharp-autocad-ifc-reviewer` no repiten que la ronda 2 revisa solo el delta;
nunca tuvieron parrafo de rondas, no contradicen nada y la politica vive en
`task-workflow`.
