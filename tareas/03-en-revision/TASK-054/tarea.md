---
id: TASK-054
titulo: "Rutas no ASCII en el diff de revision fragmentado por dominio"
tipo: fix
sprint: 6
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-054-rutas-no-ascii-en-el-diff-de-revision-fr
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-05
dependencias: []
---
## Objetivo

`diffNameOnly` y `diffParaRevision` llaman a git sin `-z` ni
`core.quotePath=false`, asi que una ruta con caracteres no ASCII sale
entrecomillada y escapada en octal (`"src/acciÃ³n.ts"`). Al
fragmentar la revision por dominio, la clasificacion usa esa ruta escapada y
el diff del fichero no llega a la peticion de su dominio (MENOR-6 de
TASK-034). El objetivo es que la ruta sea la misma en la clasificacion y en
el diff, y que el fichero aparezca en la peticion que le corresponde.

## Criterios de aceptacion
- [x] `diffNameOnly` y `diffParaRevision` usan `-z` (o `core.quotePath=false`) y una ruta con caracteres no ASCII aparece igual en la clasificacion y en el diff
- [x] Test con un fichero `src/acción.ts` en una revision fragmentada: su diff aparece en la peticion de su dominio

## Resultado

**Implementado.** En `src/fs/git.ts`, `diffParaRevision` y `diffNameOnly` piden
los nombres con `git -c core.quotePath=false diff --name-only -z` y los parten
por NUL (`partirNul`): una ruta con tilde sale igual en la clasificacion, en
el diff y en el `--stat` de excluidos, que tambien van con
`core.quotePath=false`. Ademas, `diffRangeForPaths` pasa cada ruta como
`:(literal)<ruta>`: `pages/[id].vue` ya no se interpreta como glob (mismo
sintoma, el fichero no llegaba a la peticion de su dominio). `diffNameOnly`
no la llama hoy nadie en `src/`; se corrige igual y se anota en su comentario.

**Pruebas.** En `test/commands/review.test.ts`: una revision fragmentada real
con `src/main/java/com/acme/Acción.java` y un componente Angular (el diff con
tilde llega a la peticion de Java, sin escapes, y no a la de Angular), y
`diffParaRevision`/`diffRangeForPaths` con `src/acción.ts`, `docs/guía.md`
excluido y `pages/[id].vue` junto a `pages/i.vue`. Mutacion: con el
`git.ts` anterior los dos tests salen rojos. Suite completa: 1083 tests, solo
los 3 rojos conocidos de Windows.

**Revision ronda 1: aprobada** (0 criticos, 0 importantes, 2 menores; suite
en clon limpio con los mismos 3 rojos; probado ademas con CJK, espacios,
comilla simple, `git mv` con tildes, borrados y `core.quotepath=true` en la
config global, que `-c` sobreescribe; mutaciones de `SIN_COMILLAS`,
`:(literal)` y `-z` ponen rojos sus tests). Por A3, sin ronda 2. Sin cambio:
- MEN-1: `lsTreeNames`, dos lecturas de `git-commit.ts` y el `porcelain` de
  `sincronizacion.ts` siguen partiendo por salto de linea sin `-z`. Solo ven
  rutas bajo `tareas/`, ASCII por construccion (los nombres de carpeta los
  genera taskctl); fuera del alcance.
- MEN-2: un renombrado se revisa como alta completa bajo la ruta final. Es
  el comportamiento previo, ya documentado en `core/revisores.ts`.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
| 2026-10-05 | start | manual | persona |
| 2026-10-05 | review | manual | persona |
