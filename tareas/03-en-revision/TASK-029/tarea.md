---
id: TASK-029
titulo: "Bug de origin sin guard y deuda de los scripts de Git-Flow"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-029-bug-de-origin-sin-guard-y-deuda-de-los-s
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-07
actualizado: 2026-09-07
dependencias: []
---
## Objetivo

Item **C6** del checklist de terminacion: cerrar los cuatro frentes de deuda
que arrastran los scripts de Git-Flow, todos documentados en
`HALLAZGOS.md` (seccion "Git-Flow: deuda conocida"). El item nacio siendo
solo el bug de `origin`; C1 (TASK-026) le anadio los otros tres al envolver
los scripts con `taskctl`, y la estimacion de ~1h del checklist se quedo
obsoleta.

## Criterios de aceptacion

Transcritos del plan aprobado (`planificacion/plan-final.md`), porque
`taskctl new` deja esta seccion vacia — a diferencia de `import`, que los
extrae del fichero de entrada.

**S1 — guard de `origin`**
- [ ] `create-develop.sh` sin remoto crea `develop` en local, omite el push con aviso explicito y sale 0.
- [ ] `recover-branch.sh` sin remoto falla con un mensaje que se entiende (exit 1), en vez de con el error crudo de Git. No finge exito.
- [ ] `resume-work.sh` sin remoto resuelve la rama en local, omite `fetch` y `ls-remote`, y avisa de que no ha sincronizado.
- [ ] Test nuevo `test/gitflow/origin-guard.test.ts` con repos Git temporales reales; falla si se revierte el arreglo.

**S2 — el registro sale del workspace del usuario**
- [ ] `initialize_gitflow_log` escribe en `.git/` resuelto con `git rev-parse --git-path`, no en `<repo>/logs/gitflow/`.
- [ ] Tras ejecutar cualquier script en un repo temporal sin `.gitignore`, `git status --porcelain` sale vacio.
- [ ] Se conserva la salvaguarda de TASK-008: sin repo Git no se escribe fichero.
- [ ] El segundo guard de `taskctl pause` (el de `isIgnored`) se elimina con sus tests, **o** se conserva documentando por que si la demostracion empirica no lo respalda.
- [ ] `smoke-test.sh` deja de aseverar sobre la ruta vieja.

**S3 — los mensajes dejan de remitir a menus de IntelliJ**
- [ ] Los cuatro mensajes con equivalente real citan `taskctl pause | resume | recover | abort-merge`.
- [ ] Los de "GitFlow 20/21" nombran el script: no se inventa un comando que no existe.

**S4 — `abort-merge` conoce cherry-pick y revert**
- [ ] Con un cherry-pick o un revert a medias, el script deja de decir "estado normal" y ofrece abortarlo.
- [ ] `operacionEnCurso` mira **los mismos testigos** que el script, para que `taskctl` no detecte ni mas ni menos que el.
- [ ] Tests nuevos que fallan si se revierte el arreglo.

**Transversal**
- [ ] Suite en verde: los 3 rojos conocidos de Windows y ninguno mas.
- [ ] Revision por pares independiente, con hallazgos clasificados y documentados incluidos los no corregidos.
- [ ] Checklist, contadores y estimacion del item C6 actualizados.
