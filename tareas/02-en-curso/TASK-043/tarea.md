---
id: TASK-043
titulo: "F4-T2 Validacion antes de plan y puertas de cierre"
tipo: feature
sprint: 5
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-043-f4-t2-validacion-antes-de-plan-y-puertas
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

Que `plan` se niegue a planificar una tarea mal definida, y que `approve` y
`finish` no dejen pasar esqueletos vacios (auditoria del 2026-10-03, C2, C6 y
D5). Reproducido en la auditoria: una tarea entera se cerro con el Objetivo
vacio, un criterio `- [ ] ` vacio, el plan en esqueleto y sin Resultado, y
todos los comandos salieron con 0. Ademas, las tareas con muchos criterios o
criterios vagos («mejorar», «robusto») son las que mas rondas de revision
costaron: las tres con 13 o mas criterios tuvieron peticiones de 110-160 KB.

La validacion es determinista (sin modelo): objetivo no vacio, entre 1 y 8
criterios no vacios, y cada criterio cita algo comprobable (un comando, una
ruta, un numero, codigo entre comillas invertidas o un test). Se calibra
contra las tareas ya cerradas del repo para no rechazar lo razonable.

Fuera de alcance: proponer la particion de una tarea grande (TASK-044).

## Criterios de aceptacion
- [ ] `plan` aborta sin mover la tarea si el objetivo esta vacio, hay 0 criterios o mas de 8, o alguno esta vacio
- [ ] Lint de verificabilidad: cada criterio cita un comando, una ruta, un numero, codigo o un test; `mejorar`, `robusto` o `correctamente` solos se rechazan con el motivo
- [ ] `approve` rechaza un `plan-final.md` con todas las secciones vacias
- [ ] `finish` avisa de casillas sin marcar fuera de `### Tras el cierre`
- [ ] Probado sobre las 17 tareas cerradas: se listan las que habrian sido rechazadas y por que
