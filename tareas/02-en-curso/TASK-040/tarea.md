---
id: TASK-040
titulo: "F3-T1 taskctl review para la ronda 2 y siguientes"
tipo: feature
sprint: 4
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-040-f3-t1-taskctl-review-para-la-ronda-2-y-s
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

Que la ronda 2 y siguientes de una revision las genere `taskctl review` y no
un agente a mano (auditoria del 2026-10-03, A2 y D3). Hoy `review` solo existe
desde `en-curso`: con la tarea en `en-revision` los errores mandan a `start`,
que manda a `plan`, en circulo; y las peticiones de ronda N de TASK-017, 018,
020, 022, 033 y 038 se escribieron a mano. La ronda N+1 debe embeber solo el
diff desde el commit revisado en la ronda anterior (con las exclusiones de
`excluir_de_revision`) y listar los hallazgos no cerrados de la tabla del
informe anterior (`| ID | Severidad | Estado | Fichero |`, TASK-036).

Conflicto a resolver en el diseno: la §16.3 dice que `ultimo_commit_revisado`
se actualiza cuando una revision TERMINA aprobada, no al pedirla, y el
criterio 2 pide escribirlo en cada ronda. El commit revisado de cada ronda ya
consta en su informe (`- Commit revisado:`).

## Criterios de aceptacion
- [ ] Transicion `en-revision -> en-revision` permitida solo si el ultimo informe dice `cambios-solicitados` o `aprobada con correcciones`
- [ ] `review` escribe `ultimo_commit_revisado` en cada ronda y la ronda N+1 embebe `ultimo_commit_revisado..HEAD` con las exclusiones de F1-T1
- [ ] La peticion lista los hallazgos no cerrados de la tabla del informe anterior
- [ ] Los mensajes de error dejan de mandar de `start` a `plan` en circulo
- [ ] Test que encadena ronda 1, cambios y ronda 2 contra un repo real
