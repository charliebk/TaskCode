---
id: TASK-123
titulo: "F-16: finish no cierra sin verificar tras un merge a mano o un conflicto"
tipo: fix
sprint: 0
etiquetas: [verificacion, critico, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-123-f-16-finish-no-cierra-sin-verificar-tras
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

Hallazgo CRITICO de la auditoria del 2026-11-12, reproducido de punta a punta (docs/auditoria/AUDITORIA-METODO-2026-11-12.md, seccion 11): la via de reintento de finish (rama ya integrada en la de integracion) no ejecuta la puerta de verificacion, y el guardian de merges no ve el git commit que cierra un merge en curso. Caso A: merge a mano en develop con la verificacion en rojo y luego taskctl finish: cierra sin verificar. Caso B, el remedio que documenta la guia tras un conflicto: el guardian deja pasar el commit que cierra el merge y el reintento de finish cierra sin volver a verificar la resolucion. El metodo promete no integrar codigo sin verificacion en verde. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12), en modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [ ] Tras un merge a mano en develop con la verificacion en rojo, taskctl finish no cierra la tarea: verifica el arbol de la rama de integracion o aborta diciendo que falta (test con repo temporal, caso A)
- [ ] Tras un conflicto en finish resuelto en develop, el reintento verifica la resolucion antes de cerrar o aborta (test con repo temporal, caso B)
- [ ] El guardian de merges trata como merge un git commit con MERGE_HEAD presente sobre la rama de integracion o la principal, con los tres comandos del caso B (test)
- [ ] La guia y los mensajes de finish proponen como remedio taskctl abort-merge, integrar la base en la rama de la tarea y relanzar finish desde ella (test sobre el texto)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T16:30:50Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T16:31:27Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T16:31:28Z | start | automatico | persona | 0.14.0 |
