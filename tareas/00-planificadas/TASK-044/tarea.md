---
id: TASK-044
titulo: "F4-T3 Particion propuesta de las tareas grandes"
tipo: feature
sprint: 5
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-044-f4-t3-particion-propuesta-de-las-tareas
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

Que, cuando `plan` rechaza una tarea por demasiado grande, deje hecha la
particion en vez de solo decir «partela» (auditoria del 2026-10-03, C3).
TASK-043 ya bloquea por encima de 12 criterios; falta proponer como partirla.
Caso real: TASK-030 tenia 18 criterios en dos frentes independientes (config
y auto-commit), agrupados bajo lineas en negrita (`**C4 — ...**`,
`**C2 — ...**`) mas un grupo `**Transversal**`; costo varias rondas de
revision con peticiones de 110-160 KB. Los frentes se reconocen por los
grupos de criterios (subtitulos `###` o lineas solo en negrita), no por
interpretar el texto.

La propuesta es un fichero que `taskctl import` acepta, escrito fuera del
repo (dentro ensuciaria el workspace y el guard de import abortaria).

Fuera de alcance: partir automaticamente sin grupos (eso lo decide una
persona).

## Criterios de aceptacion
- [ ] Con mas de 12 criterios o varios frentes en el Objetivo, `plan` aborta y lo explica
- [ ] Escribe un fichero de `import` fuera del repo con una tarea por frente y lo nombra en el error
- [ ] Test con una tarea de dos frentes (el caso de TASK-030)
