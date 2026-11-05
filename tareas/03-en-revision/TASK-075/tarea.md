---
id: TASK-075
titulo: "Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+"
tipo: fix
sprint: 0
etiquetas: [tests, plugin]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-075-contrapruebas-de-descubrimiento-rotas-po
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 126993
tokens_implementacion: null
tokens_revision: 5851345
creado: 2026-11-03
actualizado: 2026-11-05
dependencias: []
---
## Objetivo

Desde Claude Code 2.1.316, claude plugin validate imprime comprobaciones del directorio de plugins (README missing, icon) marcadas con una cruz aunque la validacion termina en Validation passed. Los tests 14 (test/skills/task-workflow.test.ts) y 17 (test/agents/brainstorm-roles.test.ts) copian el plugin a un temporal sin README y exigen que la salida no contenga la cruz, asi que la copia intacta falla. Detectado al revisar TASK-069.

## Criterios de aceptacion
- [ ] Con Claude Code 2.1.316 o posterior, los tests 14 de test/skills/task-workflow.test.ts y 17 de test/agents/brainstorm-roles.test.ts pasan en Windows y en el CI de Linux
- [ ] La contraprueba sigue detectando un agente o un SKILL.md roto en la copia: test con la mutacion que ya usa cada test
- [ ] Los avisos del directorio de plugins no se confunden con errores de validacion: la condicion se apoya en el codigo de salida o en el bloque de resultado, no en buscar la cruz en toda la salida; test
- [ ] Suite completa con solo los rojos conocidos de Windows; HALLAZGOS.md recoge el cambio de salida del validador

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-05T12:29:07Z | plan | automatico | persona |
| 2026-11-05T12:33:27Z | approve | automatico | persona |
| 2026-11-05T12:33:28Z | start | automatico | persona |
| 2026-11-05T12:55:19Z | review | automatico | persona |
| 2026-11-05T13:26:54Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-05T12:33:24Z | diseno | agente:aa2f7337150d06416 | 12 | 27854 | 92142 | 6985 | 13 | 126993 |
| 2026-11-05T13:11:43Z | revision | agente:a0b344edd306cf2b4 | 104 | 125773 | 5090567 | 19412 | 14 | 5235856 |
| 2026-11-05T13:31:06Z | revision | agente:ab7e2def6aed947ae | 14 | 93085 | 518319 | 4071 | 1 | 615489 |
