---
id: TASK-112
titulo: "P-4: el revisor reutiliza la verificacion de ronda y las rondas 2+ solo relanzan al revisor con pendientes"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-112-p-4-el-revisor-reutiliza-la-verificacion
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
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

La ronda 2 cuesta el 94 % de la ronda 1 en ToolsaWeb: cada revisor clona, compila y corre la suite aunque taskctl review acabe de verificar el mismo commit, y en TASK-293 de ToolsaWeb cada ronda extra relanzo a los dos revisores aunque el hallazgo era de uno. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-4)

## Criterios de aceptacion
- [ ] La peticion de revision trae el resultado de la verificacion de ronda (commit, huella, comando, estado) y la guia de revision dice que no se repite la suite si casa con el commit revisado (test sobre la peticion)
- [ ] Desde la ronda 2, taskctl review solo genera peticion para los revisores con hallazgos no aceptados o cuyos ficheros toca la correccion (test con dos revisores en repo temporal)
- [ ] Desde la ronda 2, la peticion de cada revisor lista solo sus hallazgos CRITICO e IMPORTANTE no resueltos de la ronda anterior junto al diff de la correccion, y la guia de revision pide comprobar esos y lo que toca la correccion, sin revisar de nuevo el resto ni los MENORES (test sobre la peticion)
- [ ] Un revisor cuyos unicos pendientes son MENORES, y cuyos ficheros no toca la correccion, no se relanza en la ronda 2+ y consta asi en tarea.md (test con dos revisores en repo temporal)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T05:13:07Z | plan | automatico | persona | 0.14.0 |
