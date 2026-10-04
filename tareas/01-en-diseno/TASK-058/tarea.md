---
id: TASK-058
titulo: "Flujo D: modo semiautomatico"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-058-flujo-d-modo-semiautomatico
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

Parte de TASK-055 (su plan-final es el diseno de referencia). Al cerrar cada fase el sistema pregunta si seguir; un no deja la tarea en su estado, queda registrado y dice como reanudar.

## Criterios de aceptacion
- [ ] Con `modo_flujo: semiautomatico`, al cerrar plan, approve, start y review la skill pregunta con AskUserQuestion si pasar a la siguiente fase
- [ ] Un si invoca la skill de la siguiente fase con la herramienta Skill
- [ ] Un no ejecuta `taskctl pausa`, deja la tarea en su estado y termina nombrando la skill que la reanuda
- [ ] Bloqueo por arbol de trabajo en `.git/` mientras dura una cadena: una segunda sesion sobre el mismo arbol aborta con un mensaje que dice que hacer
- [ ] Test de punta a punta en repo temporal: un no en approve deja la tarea en `01-en-diseno` con `plan_aprobado: false` y su fila de pausa; la contraprueba con un si llega a `02-en-curso`
- [ ] Smoke manual en Claude Code en un proyecto ajeno con evidencia en el Resultado
