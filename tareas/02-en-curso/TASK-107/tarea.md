---
id: TASK-107
titulo: "Verificacion proporcional B4: Stop, review y finish deciden igual el mismo diff"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-107-verificacion-proporcional-b4-stop-review
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 418851
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-11
actualizado: 2026-11-11
dependencias: [TASK-106]
---
## Objetivo

Cuarta parte de TASK-096. Solo tests, sin codigo de produccion salvo que destapen una divergencia (TASK-102 y TASK-104 ya aplican documentacion -> selectiva en Stop y review). Una prueba tabular sobre documentacion, codigo parcial y codigo transversal fija que el freno Stop y taskctl review aplican la misma decision al mismo diff, y que finish coincide con ellos en documentacion y en parcial. Desacuerdo resuelto en el plan: Stop y review son puertas de iteracion y no corren la completa ante lo transversal. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [ ] Una prueba tabular (documentacion, parcial, transversal) comprueba que decidirStop y runReviewCommand corren el mismo comando para el mismo diff, y que finish coincide en documentacion y parcial; un turno o una ronda que solo tocan documentacion no corren la suite de tests
- [ ] La prueba se pone roja si se desvia la decision de uno de los tres en un caso (mutacion documentada en Resultado)
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T21:31:01Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T21:34:38Z | approve | automatico | automatico | 0.14.0 |
| 2026-11-11T21:34:51Z | start | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T21:34:27Z | diseno | agente:a63dec4bad1925d79 | 24 | 53030 | 355800 | 9997 | 19 | 418851 | - | - |
