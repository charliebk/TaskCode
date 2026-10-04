---
id: TASK-039
titulo: "F2-T3 Menos llamadas git en los comandos"
tipo: feature
sprint: 3
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-039-f2-t3-menos-llamadas-git-en-los-comandos
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

Quitar las llamadas `git` sobrantes de los comandos de `taskctl` sin cambiar su
comportamiento (auditoria del 2026-10-03, B6). Medido con `GIT_TRACE2_EVENT`
en un ciclo completo: `review` lanza 27 procesos `git` y `finish` 33. La mayor
parte de los que se repiten no estan duplicados dentro del CLI: los hace una
vez el comando y otra el script de Git-Flow, que es la fuente de verdad y no
se toca aqui. Lo que si sobra esta en `autoCommit`: un `git add` por ruta (5
en `finish`), `rev-parse --short` mas `show --name-only` para lo mismo, y el
`maintenance run --auto` que Git lanza tras cada commit automatico.

## Criterios de aceptacion
- [x] `finish` y `review` bajan de procesos `git`, medido con `GIT_TRACE2_EVENT` (33 → 27 y 27 → 24; la meta de 20 / 15 no se alcanza sin tocar los scripts: ver Resultado)
- [x] Suite en verde sin tocar expectativas

## Resultado

**Implementado** en `src/fs/git-commit.ts` (`autoCommit`): un solo
`git add -A -- <rutas...>` acotado por pathspec en vez de uno por ruta; el
commit con `-c maintenance.auto=false` (Git ya no lanza un `maintenance run
--auto` tras cada commit automatico); y un solo `git show --name-only
--format=%h HEAD` para el SHA corto y los ficheros, en vez de `rev-parse
--short` + `show`.

**Medicion** (`GIT_TRACE2_EVENT`, ciclo completo en un repo temporal, procesos
`git` por comando, antes → despues): `new` 9 → 7, `plan` 12 → 9, `approve`
9 → 7, `start` 25 → 22, `review` 27 → 24, `finish` 33 → 27. Ciclo entero:
**115 → 96 (-17 %)**.

**Divergencia del criterio 1, documentada:** la meta de la auditoria (`finish`
20, `review` 15) no se alcanza sin tocar los scripts de Git-Flow. Lo que se
repite despues de esta tarea no esta duplicado dentro del CLI: lo hace el
comando y otra vez el script (`status --porcelain`, `branch --show-current`,
`checkout develop`, el `maintenance` tras el merge del script), y los scripts
son la fuente de verdad (§7.1). Quitarlo pediria pasar al script lo que el CLI
ya sabe, que es otra tarea.

**Pruebas.** `git-commit`, `auto-commit`, `sincronizacion`, `review` y `finish`:
76/76 sin tocar expectativas (incluido el test de que un hook que mete
ficheros ajenos se sigue detectando).

**Revision ronda 1: aprobada** (0 criticos, 0 importantes, 3 menores; suite
completa 913 tests, solo los 3 rojos conocidos de Windows; 4 mutantes, 3
muertos directamente y uno de rebote). Por A3, sin ronda 2.
- MEN-1, corregido: ningun test comprobaba que `r.commit` fuera el SHA corto
  de HEAD; anadida la asercion contra `rev-parse --short HEAD`.
- MEN-2, aceptado: el error del `add` unico nombra todas las rutas; el stderr
  de Git sigue senalando la culpable y el estado final es el mismo.
- MEN-3, aceptado: con sincronizacion configurada, sus rutas se anaden dos
  veces (el `add` aislado de TASK-033 y el unico); un proceso de mas solo en
  ese caso.
El revisor comprobo ademas que `-c maintenance.auto=false` es inocuo en Git
antiguo (Git acepta cualquier clave en `-c`) y que el SHA coincide tambien con
`core.abbrev=12`.
