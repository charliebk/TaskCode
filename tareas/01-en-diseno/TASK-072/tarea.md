---
id: TASK-072
titulo: "Puerta de verificacion en finish y merge guard"
tipo: feature
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-072-puerta-de-verificacion-en-finish-y-merge
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 673273
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-03
actualizado: 2026-11-04
dependencias: [TASK-071]
---
## Objetivo

Defensa en dos capas: finish no mergea con la verificacion en rojo, y un hook impide al agente saltarse finish con un git merge directo.

## Criterios de aceptacion
- [ ] taskctl finish ejecuta comando_verificacion antes del merge y aborta con la salida si falla; flag explicito para saltarlo que queda registrado en la tarea
- [ ] Hook PreToolUse sobre Bash que bloquea git merge y los scripts de cierre de Git-Flow hacia develop o main cuando la verificacion esta en rojo
- [ ] El hook no bloquea comandos de solo lectura ni merges hacia ramas de trabajo
- [ ] Tests de ambas capas contra repos temporales reales

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-04T17:56:19Z | plan | automatico | persona |
| 2026-11-04T18:06:30Z | approve | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-04T18:03:32Z | diseno | agente:ac9682a0042de6361,a680884679fa47780,a54f2c849f62e294e | 48 | 122362 | 520955 | 29908 | 33 | 673273 |
