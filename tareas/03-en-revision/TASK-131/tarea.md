---
id: TASK-131
titulo: "Tres tests con expectativas anteriores a TASK-119"
tipo: fix
sprint: 0
etiquetas: [tests, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-131-tres-tests-con-expectativas-anteriores-a
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 792936
tokens_revision: null
creado: 2026-11-13
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

TASK-119 cambio el flujo (veredicto no commitea, el informe sin commitear lo absorbe finish, la skill review dice dejalo sin commitear) y dejo tres tests rojos en develop con la expectativa anterior: automatico-ciclo (finish solo sigue solo si lo aprobado es lo revisado), automatico-guarda-finish (IMP-3, guarda leida desde develop) y fases.test.ts (automatico TASK-059, commitea el informe solo). Se actualizan a la regla vigente sin debilitarlos. Modo rapido.

## Criterios de aceptacion
- [ ] test/commands/automatico-ciclo.test.ts pasa: una edicion del informe sin commitear deja finish en continuar (la absorbe finish) y el informe sin revisor sigue preguntando
- [ ] test/commands/automatico-guarda-finish.test.ts IMP-3 pasa: el veredicto pendiente se commitea antes de cambiar de rama y codigo colado tras el veredicto sigue preguntando
- [ ] test/skills/fases.test.ts comprueba que la skill review dice dejar el informe sin commitear y nunca mezclarlo con codigo
- [ ] npm run test:rapido y los tres ficheros pasan sin otro rojo que los 2 conocidos de Windows

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T11:04:28Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T11:04:46Z | approve | automatico | automatico | 0.14.0 |
| 2026-11-13T11:04:47Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T11:07:56Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T11:07:56Z | implementacion | sesion:11e712bd-419c-4b82-81c1-1dc7aa472f20 | 6 | 4717 | 785860 | 2353 | 0 | 792936 | - | - |
