---
id: TASK-142
titulo: "Regla 4D: disfraz en los scripts de Git-Flow"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-142-regla-4d-disfraz-en-los-scripts-de-git-f
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-22
dependencias: []
---
## Objetivo

Corregir los scripts de Git-Flow que aparentan hacer algo que no hacen (auditoria 4D completa, docs/auditoria-4d-completa.md, casos SCR-01, SCR-09, SCR-10, SCR-11 y SCR-14). SCR-01 es CRITICO: resume-work aplica el stash equivocado.

## Criterios de aceptacion
- [ ] resume-work.sh aplica el stash de la rama exacta (stash_ref, sin casar prefijos); un test con dos stashes pause: feature/a y pause: feature/ab falla con el codigo actual y pasa con el arreglo
- [ ] pause-work.sh --push sin origin no aborta: usa detect_origin_available y _gf_hora como el resto de scripts, con test
- [ ] push-back-to-remote.sh y mirror-to-remote.sh no dan por COMPLETADO un push rechazado (exit distinto de 0 o resumen con lo fallido) y su cabecera y avisos dicen lo que de verdad copian
- [ ] El README de gitflow y los textos que hablan de 19 scripts reflejan los 24 scripts actuales y los cambios hechos sobre el zip original

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-22T21:43:24Z | plan | automatico | persona | 0.16.1 |
| 2026-11-22T21:45:04Z | approve | automatico | persona | 0.16.1 |
| 2026-11-22T21:45:06Z | start | automatico | persona | 0.16.1 |
