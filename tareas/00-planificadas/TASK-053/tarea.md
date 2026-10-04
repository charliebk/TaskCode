---
id: TASK-053
titulo: "moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio de Windows"
tipo: fix
sprint: 6
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-053-movetareafile-reintenta-el-rename-ante-u
asignado_a: null
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


## Criterios de aceptacion
- [ ] `moveTareaFile` reintenta el `rename` hasta 5 veces con espera creciente ante `EPERM` o `EBUSY`, y solo entonces falla
- [ ] Test que simula el fallo transitorio (un rename que falla las 2 primeras veces) y comprueba que la tarea se mueve
- [ ] `finish` sigue siendo reintentable si el rename falla de verdad tras los reintentos (test)
