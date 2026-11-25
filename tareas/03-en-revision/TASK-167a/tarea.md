---
id: TASK-167a
titulo: "guia instalable de duplicacion de grano fino (parte a de TASK-167)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 4698066
tokens_revision: 2729331
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-167 (Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)), partes TASK-167a, TASK-167b, TASK-167c, TASK-167d en la rama feature/task-167-regla-4d-preventiva-en-los-proyectos-que.

`skills/task-workflow/duplicacion.md` con los patrones que las auditorias
encontraron (helpers copiados, lectores de secciones o vallas repetidos,
envoltorios de git o fs duplicados, catalogos y listas escritos dos veces,
reglas copiadas entre documentos), sin mencionar TaskCode; start, review,
revision.md y las revisoras remiten a ella.

Objetivo de la tarea entera:

> Que los proyectos que instalan el plugin no cometan los fallos 4D que las auditorias encontraron en TaskCode: lo aprendido en las dos auditorias pasa a guia y a comprobaciones automaticas que el plugin instala y ejecuta al escribir codigo, no solo al revisarlo. Decision de Carlos (2026-11-25): va antes que las correcciones pendientes y se publica en la 0.19.0; TASK-150c (aparcada en diseno), 150d, 159..166, 152 y 140 pasan a la 0.20.0.

## Criterios de aceptacion

- [ ] Hay una guia instalable de duplicacion de grano fino (helpers copiados, lectores de secciones repetidos, envoltorios de git o fs duplicados, catalogos escritos dos veces) sacada de las auditorias 4D, y start, review y las revisoras remiten a ella
- [ ] Un test falla si la guia deja de instalarse o alguien deja de remitir a ella

## Autorrevision

- code-quality-reviewer — c94acce
- 4D — c94acce: helper buscado (disfraz-tests.md como modelo; seccion y cargarCatalogoRevisores de regla-4d.test.ts), usos buscados (donde se remite a disfraz-tests.md: start, revision.md, task-workflow; las revisoras remiten a revision.md), criterios citados, 1 test nuevo con 2 mutaciones en rojo (y el 20b caza el enlace)
- 4D menores — 59b32c7: usos buscados (los dos patrones nuevos no estaban en revision.md ni en disfraz-tests.md), 1 asercion ampliada

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T12:55:40Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T12:57:40Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T12:57:42Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T13:40:09Z | review | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T13:40:09Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 16 | 12842 | 4678079 | 7129 | 2 | 4698066 | - | - |
| 2026-11-25T14:20:48Z | revision | agente:a9b446550ba4ccb19 | 42 | 146457 | 2570500 | 12332 | 8 | 2729331 | 1 | - |

## Verificacion ligera

- 2026-11-25T14:22:09Z: ronda 1; commit revisado af87a4195849627ba94283d27a910facdf4b34ad; commit verificado 59b32c7124f74be787a49f949401a81383245ddf; ficheros: taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duplicacion.md, taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts; corregidos: MENOR-1; pendientes: MENOR-2, MENOR-3
