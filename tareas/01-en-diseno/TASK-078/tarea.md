---
id: TASK-078
titulo: "Hook que impide leer y editar los held-out de la tarea en curso"
tipo: feature
sprint: 0
etiquetas: [hooks]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-078-hook-que-impide-leer-y-editar-los-held-o
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 902198
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-04
actualizado: 2026-11-05
dependencias: []
---
## Objetivo

Segunda mitad de TASK-073 (depende de ella): que el agente que implementa una tarea no pueda leer ni editar sus tests held-out (carpeta aceptacion/) mientras trabaja en su rama, con un hook PreToolUse sobre herramientas de fichero y Bash/PowerShell.

## Criterios de aceptacion
- [ ] Hook PreToolUse con matcher Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob que sale 2 ante una ruta tareas/*/TASK-NNN/aceptacion/ de una tarea cuya rama es la actual, y 0 ante rutas hermanas (tarea.md, aceptacionX/)
- [ ] El guardian de Bash/PowerShell bloquea comandos cuyo texto nombra esa ruta (cat, Get-Content, git show rama:ruta)
- [ ] En otra rama (develop, durante el diseno) no bloquea: la persona puede escribirlos con Claude
- [ ] Rutas con mayusculas, barras invertidas, relativas o con .. se normalizan antes de comparar; Agent/Task fuera del matcher
- [ ] Tests contra el dist real por stdin y repos temporales; smoke con claude -p --plugin-dir con el exit 2 del hook visible

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-05T14:30:10Z | plan | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-05T14:37:13Z | diseno | agente:a33e65c96a79e4e53,a932a784f841e7ff6,a6fc0b58b60fd29ad | 58 | 121124 | 748853 | 32163 | 44 | 902198 |
