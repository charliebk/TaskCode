---
id: TASK-051
titulo: "F6-T2 Partir los ficheros de test mas largos"
tipo: feature
sprint: 7
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-051-f6-t2-partir-los-ficheros-de-test-mas-la
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

Los ficheros de test de `start`, `finish`, `review`, `sincronizacion` y
`gitflow` son el camino critico secuencial de la suite (auditoria B5): el
runner paraleliza por fichero y esos cinco tardan mas que todo lo demas. Se
parten en ficheros mas pequenos (o se les da concurrencia interna) y se mide
el tiempo de la suite completa antes y despues, sin carga en la maquina.

## Criterios de aceptacion
- [x] `start`, `finish`, `review`, `sincronizacion` y `gitflow` divididos o con concurrencia interna
- [x] Tiempo de la suite completa antes y despues medido sin carga

## Resultado

**Implementado.**
- Partidos por fichero (no concurrencia interna: todo git y Git-Flow va por
  `spawnSync`, que bloquea el event loop, asi que `{ concurrency }` en un
  proceso no solaparia nada):
  - `automatico` → `automatico-ciclo`, `-guarda-finish`, `-rondas`, `-guardas`
    (entra aunque el criterio no lo nombra: era la cola real, ~570 s de tests
    bajo carga).
  - `start` → `start-basico`, `-asignacion`, `-wip`, `-identidad`, `-wip-ramas`.
  - `finish` → `finish-merge`, `-linaje`, `-cierre`, `-guardas`.
  - `review` → `review-camino`, `-guardas`, `-dominios`, `-rutas`.
  - `sincronizacion` → `sincronizacion-ciclo`, `-scripts`, `-revision`.
  Cortes contiguos (respetan el orden tematico del original) equilibrados por
  la duracion medida de cada test. El codigo comun de cada comando vive una
  sola vez en `test/helpers/<comando>-fixtures.ts`.
- **«gitflow» del criterio**: `test/gitflow/` ya estaba partido, un fichero
  por script, y ninguno estaba en la cola; no se toca.
- La particion la hizo un script mecanico (fuera del repo) que separa los
  bloques `test(...)` y los `for` que contienen tests, exporta el resto y no
  toca las lineas dentro de template literals.

**Mediciones (Windows, `npm test` equivalente, sin carga, `dist/test`
limpio, misma sesion).**
- Antes (worktree de develop con TASK-050): 591 s y 675 s, media 633 s.
- Despues: 486 s y 387 s, media 436 s (**-31 %**). Revisor: ~499 s.
- La dispersion entre corridas (~90 s) es del orden de la mitad del efecto;
  con dos corridas por lado la mejora es clara pero su tamano exacto no.
- Lista de nombres de test (TAP, ordenada) identica antes y despues: 1088.
  Mismos 3 rojos conocidos de Windows.
- **Nueva cola** (suma de duraciones de sus tests bajo carga): `siguiente`
  216 s, `empaquetado/distribucion` 199, `plan-brainstorm` 188, `plan` 166,
  `review-incremental` 166. Quedan fuera del criterio; si hace falta bajar
  mas, son los siguientes a partir.

**Revision (ronda 1, `aprobada`).** Sin CRITICO ni IMPORTANTE.
- MENOR-1 (documentos historicos citan los ficheros viejos): aceptado; son
  registros y no se reescriben.
- MENOR-2 (cabeceras de las fixtures nuevas): aceptado; sin perdida de codigo.
- MENOR-3 (contador de `CLAUDE.md`): no aplica, TASK-050 ya lo actualizo.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
| 2026-10-05 | start | manual | persona |
| 2026-10-05 | review | manual | persona |
| 2026-10-05 | finish | manual | persona |
