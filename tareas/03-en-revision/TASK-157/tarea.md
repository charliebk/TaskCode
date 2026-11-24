---
id: TASK-157
titulo: "Timeout de claude plugin list acorde al binario real"
tipo: fix
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-157-timeout-de-claude-plugin-list-acorde-al
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 2166335
tokens_revision: null
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

claude plugin list --json tarda unos 18 s en Windows con el claude.exe real, y TIMEOUT_MS de src/core/plugin-instalado.ts es 5 s: comprobarSkillInstalado sigue devolviendo siempre no-verificable con el binario real. Subir el timeout para que el estado real se pueda verificar sin colgar plan si claude no responde.

## Criterios de aceptacion
- [ ] TIMEOUT_MS de src/core/plugin-instalado.ts sube de 5000 a 30000 ms, con el motivo (medida real ~18 s) en un comentario
- [ ] Un test en test/integracion/plugin-instalado.test.ts con un claude de prueba que tarda unos 6 s en responder da instalado; con el timeout de 5000 da no-verificable
- [ ] Con el claude real de la maquina, comprobarSkillInstalado('taskcode-plugin@taskcode-marketplace') ya no da no-verificable; y RAMA_BASE=develop node scripts/verificar-impacto.mjs queda en verde

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T10:59:19Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T10:59:53Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T10:59:57Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T11:12:29Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- code-quality-reviewer — 4f01019

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T11:12:29Z | implementacion | sesion:8b5a4a51-b3bc-4278-83ca-facf23e674de | 28 | 12901 | 2148584 | 4822 | 3 | 2166335 | - | - |
