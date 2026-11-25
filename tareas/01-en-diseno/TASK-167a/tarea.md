---
id: TASK-167a
titulo: "guia instalable de duplicacion de grano fino (parte a de TASK-167)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
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

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T12:55:40Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T12:57:40Z | approve | automatico | persona | 0.18.0 |
