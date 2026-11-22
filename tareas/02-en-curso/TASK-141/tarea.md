---
id: TASK-141
titulo: "Auditoria 4D inicial: reconocimiento completo del codigo existente"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-141-auditoria-4d-inicial-reconocimiento-comp
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-22
dependencias: []
---
## Objetivo

Reconocer el repo entero (plugin: src, scripts, skills, agents, hooks y test; scripts de la raiz) y auditar todo el codigo ya escrito contra la Regla 4D: sin duplicacion, sin desviacion, sin diluvio y sin disfraz (definicion en skills/task-workflow/revision.md, seccion Regla 4D). Solo lee y documenta: las correcciones van en tareas de seguimiento. La auditoria de TASK-137 (docs/auditoria-4d.md) solo cubrio los diffs de TASK-127..136; esta cubre todo el codigo y no repite sus casos A1..A13, los referencia.

## Criterios de aceptacion
- [x] docs/auditoria-4d-completa.md tiene un mapa del proyecto: areas (src/core, src/commands, src/fs, src/hooks, src/cli, scripts/gitflow, scripts de la raiz, skills, agents, hooks, test), su responsabilidad y su tamano en lineas; cada area figura como auditada o como excluida con su motivo (dist/ generado, node_modules, tareas/ historicas)
- [x] Cada caso 4D esta en una tabla ID | Area | D | fichero:linea | evidencia | severidad | confianza | seguimiento; duplicacion y disfraz reales son IMPORTANTE como minimo, desviacion y diluvio MENOR salvo que cambien comportamiento o escondan un fallo; los dudosos van con confianza media; los casos ya cubiertos por TASK-138..140 se referencian, no se duplican
- [x] Cada caso de confianza alta lo vuelve a comprobar en el codigo el coordinador, distinto del agente que lo encontro; los casos de disfraz en tests se comprueban por mutacion sobre una muestra de al menos 5 tests y el resultado queda anotado
- [x] Cada caso tiene tarea de seguimiento creada con taskctl new, agrupando por regla y area, nunca una por caso; el informe cierra con un resumen por area y una conclusion: que D predomina y en que zonas

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-22T21:11:28Z | plan | automatico | persona | 0.16.1 |
| 2026-11-22T21:12:06Z | approve | automatico | persona | 0.16.1 |
| 2026-11-22T21:12:41Z | start | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 510f989: sin codigo (solo docs y tareas); criterios citados en cada caso; 10 tests mutados (8 verdes = disfraz confirmado, 2 rojos).
- code-quality-reviewer — 9600388
