---
id: TASK-075
titulo: "Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+"
tipo: fix
sprint: 0
etiquetas: [tests, plugin]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
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
- [x] Con Claude Code 2.1.316 o posterior, los tests 14 de test/skills/task-workflow.test.ts y 17 de test/agents/brainstorm-roles.test.ts pasan en Windows y en el CI de Linux
- [x] La contraprueba sigue detectando un agente o un SKILL.md roto en la copia: test con la mutacion que ya usa cada test
- [x] Los avisos del directorio de plugins no se confunden con errores de validacion: la condicion se apoya en el codigo de salida o en el bloque de resultado, no en buscar la cruz en toda la salida; test
- [x] Suite completa con solo los rojos conocidos de Windows; HALLAZGOS.md recoge el cambio de salida del validador

## Resultado

Causa (medida con Claude Code 2.1.318): desde 2.1.316 `claude plugin validate` añade un bloque
«Plugin directory checks» cuyos problemas salen con una cruz aunque no cambien el resultado: la copia
de un plugin sin README sale con exit 0, una cruz de README_MISSING y `Validation passed`. Los tests 14
y 17 buscaban la cruz en toda la salida y fallaban con la copia intacta.

Implementado:
- `test/helpers/validador-claude.ts`: `validarPlugin`, `claudeDisponible` y `validacionLimpia` (pura):
  exit 0, ultima linea con `Validation passed` y ninguna cruz antes de la linea que EMPIEZA por
  `Plugin directory checks for ` (sin bloque, en toda la salida). Ante un texto desconocido da rojo.
- Tests 13, 14, 16 y 17 (`task-workflow.test.ts` y `brainstorm-roles.test.ts`) lo usan y pierden sus
  copias de `validar`/`claudeDisponible`/`CRUZ`. Las contrapruebas mantienen su mutacion (comilla sin
  cerrar en `description`) y siguen exigiendo exit distinto de 0 y el nombre del fichero.
- `test/skills/validador-claude.test.ts`: 7 tests con fragmentos de salidas reales; corre tambien en CI.
- `docs/contexto/HALLAZGOS.md`: el bloque del directorio, la regla, y `--json` / `--profile directory`
  como alternativas medidas.

Decisiones de Carlos en el plan: condicion por texto (no `--json`); alcance 13, 14, 16 y 17
(`revisores.test.ts` fuera).

Verificacion: suite completa 1790/1793, solo los 3 rojos conocidos de Windows (antes eran 5: las dos
contrapruebas ya pasan). En una pasada intermedia salio el intermitente de sincronizacion «el timeout
mata tambien al nieto» (aislado 3/3; esta tarea no toca `src/`). En el CI de Linux 13/14/16/17 se
saltan de forma visible (no hay `claude`) y el test unitario si corre.

Revision por pares, 2 rondas:
- Ronda 1 (el revisor propuso `aprobada`; registrada `cambios-solicitados` para corregir MEN-1, que
  era un falso verde barato): MEN-1 (el corte usaba la primera aparicion de la frase, tambien dentro de
  una ruta) corregido con el ancla a principio de linea y su test; MEN-2 (`status` redundante en el
  helper) aceptado como defensa en profundidad.
- Ronda 2 (`aprobada`): MEN-1 verificado con variantes (CRLF, frase a final de linea, sangria) y con
  la salida real del validador; el mutante del `indexOf` antiguo cae. Sin hallazgos nuevos.

Coste de implementacion sin registrar: la hizo el orquestador sin subagentes.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-05T12:29:07Z | plan | automatico | persona |
| 2026-11-05T12:33:27Z | approve | automatico | persona |
| 2026-11-05T12:33:28Z | start | automatico | persona |
| 2026-11-05T12:55:19Z | review | automatico | persona |
| 2026-11-05T13:26:54Z | review | automatico | persona |
| 2026-11-05T13:31:37Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-05T12:33:24Z | diseno | agente:aa2f7337150d06416 | 12 | 27854 | 92142 | 6985 | 13 | 126993 |
| 2026-11-05T13:11:43Z | revision | agente:a0b344edd306cf2b4 | 104 | 125773 | 5090567 | 19412 | 14 | 5235856 |
| 2026-11-05T13:31:06Z | revision | agente:ab7e2def6aed947ae | 14 | 93085 | 518319 | 4071 | 1 | 615489 |
