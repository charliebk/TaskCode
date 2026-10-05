---
id: TASK-049
titulo: "F6-T4 Metadatos del plugin y modelo de los agentes"
tipo: feature
sprint: 7
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-049-f6-t4-metadatos-del-plugin-y-modelo-de-l
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-05
dependencias: []
---
## Objetivo

Para quien instala el plugin desde fuera (como OpenGisViewer) faltan
metadatos y no hay instrucciones de actualizacion (auditoria E4, E5). Se
completa `plugin.json` (`displayName`, `repository`, `license`, `keywords`)
hasta que `claude plugin validate` salga limpio, el README explica como
instalar y actualizar, y se decide, con el ID de modelo comprobado en la
documentacion actual, si los agentes de brainstorm llevan `model:` propio.

## Criterios de aceptacion
- [ ] `plugin.json` con `displayName`, `repository`, `license` y `keywords`; `claude plugin validate` limpio
- [ ] README con instalacion y actualizacion: `claude plugin marketplace update`, `claude plugin update`, reiniciar
- [ ] Decision documentada sobre `model:` en los agentes de brainstorm, con el ID de modelo comprobado en la documentacion actual

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
| 2026-10-05 | start | manual | persona |
