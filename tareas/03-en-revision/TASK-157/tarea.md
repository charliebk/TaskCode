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
tokens_revision: 3740222
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

claude plugin list --json tarda unos 18 s en Windows con el claude.exe real, y TIMEOUT_MS de src/core/plugin-instalado.ts es 5 s: comprobarSkillInstalado sigue devolviendo siempre no-verificable con el binario real. Subir el timeout para que el estado real se pueda verificar sin colgar plan si claude no responde.

## Criterios de aceptacion
- [x] TIMEOUT_MS de src/core/plugin-instalado.ts sube de 5000 a 30000 ms, con el motivo (medida real ~18 s) en un comentario
- [x] Un test en test/integracion/plugin-instalado.test.ts con un claude de prueba que tarda unos 6 s en responder da instalado; con el timeout de 5000 da no-verificable
- [x] Con el claude real de la maquina, comprobarSkillInstalado('taskcode-plugin@taskcode-marketplace') ya no da no-verificable; y RAMA_BASE=develop node scripts/verificar-impacto.mjs queda en verde

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
| 2026-11-24T11:35:00Z | revision | agente:acb9463a793eb0b0a | 70 | 119951 | 3608802 | 11399 | 5 | 3740222 | 1 | - |

## Resultado

- `TIMEOUT_MS` de `src/core/plugin-instalado.ts` pasa de 5000 a 30000 ms, con el motivo en un comentario: `claude plugin list --json` tarda ~18 s con el `claude.exe` real en Windows.
- Test nuevo en `test/integracion/plugin-instalado.test.ts`: el doble `conClaudeDoble` admite una espera (Windows: `PING.EXE` de System32 en el `.cmd`; resto: `PATH=/usr/bin:/bin sleep`); un `claude` que tarda 6 s da `instalado`. Con 5000 ms da `no-verificable` (rojo comprobado antes del cambio y por mutacion en la revision).
- Con el `claude` real de la maquina, `comprobarSkillInstalado('taskcode-plugin@taskcode-marketplace')` da `instalado` en 16,8 s (antes, `no-verificable`).
- Verificacion por impacto: 701/701. Un freno `Stop` simultaneo choco con ella compilando el mismo `dist/` (TS5033); era el choque de dos `tsc`, no un rojo de tests.
- Revision por pares (ronda 1): aprobada. MEN-1 aceptado: el test 1, que lanza el `claude` real, ahora tarda 16-25 s en vez de cortarse a 5 s; es el comportamiento que pide la tarea y solo afecta a la capa de integracion. El revisor comprobo que un `claude` colgado se corta a los 30,1 s. El doble lento en Linux queda sin verificar en local (se vera en el CI).

## Verificacion parcial

- 2026-11-24T11:35:35Z: todo el codigo que cambia la tarea (3 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
