---
id: TASK-151a
titulo: "core, fs, skills e integracion (parte a de TASK-151)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-151-regla-4d-disfraz-en-tests
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 18789145
tokens_revision: 1386659
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-151 (Regla 4D: disfraz en tests), partes TASK-151a, TASK-151b en la rama fix/task-151-regla-4d-disfraz-en-tests.

board-format, state-machine, task-store-wip, git cmdQuoteWindows, rondas-aprobada, plugin-instalado y fases fallan con su mutante (M1, M2, M4, M5, TCORE-09, TRES-06, TRES-09).

Objetivo de la tarea entera:

> Que los tests sospechosos de disfraz de la auditoria 4D completa (docs/auditoria-4d-completa.md, casos TCMD-01 a TCMD-05, TCORE-01 a TCORE-03, TCORE-08, TCORE-09, TRES-06 a TRES-09 y TRES-12) fallen cuando se rompe lo que dicen probar. Ocho se confirmaron por mutacion.

## Criterios de aceptacion

- [x] Las mutaciones M1, M2, M4 y M5 de docs/auditoria-4d-completa.md ponen su test en rojo (board-format, state-machine, task-store-wip, git cmdQuoteWindows) y ultimaRonda se prueba con 10 rondas o mas
- [x] plugin-instalado y fases comprueban un resultado esperado (un estado concreto; indexOf distinto de -1)

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T23:22:47Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T23:22:57Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T23:22:59Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T23:31:24Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T23:44:45Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — ef3e941: solo tests; reutilizados los helpers de cada fichero (sampleTask, makeTask, withTareasRoot, conDir); nuevo antesQue en fases (el indexOf sin -1 estaba tres veces); mutaciones en rojo: M1 board-format, M2 state-machine, M4 task-store-wip, M5 cmdQuoteWindows, ultima ronda por cadena, plugin-instalado sin binario; el mutante de plugin-instalado con lista lo caza test/core/plugin-instalado
- code-quality-reviewer — ef3e941

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T23:31:24Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 46 | 27064 | 18747006 | 15029 | 12 | 18789145 | - | - |
| 2026-11-23T23:42:13Z | revision | agente:a0da329204347045b | 26 | 118976 | 1259202 | 8455 | 0 | 1386659 | 1 | - |

## Verificacion ligera

- 2026-11-23T23:42:17Z: ronda 1; commit revisado db1a8609267e050090b88d864bc5ec9826676349; commit verificado 711067d73e9adc88332541e57f6bc01e1bdbdfea; ficheros: taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts; corregidos: MEN-2; pendientes: ninguno

## Resultado

- Implementado (solo tests): board-format prueba TASK-999/TASK-1000 (M1); state-machine prueba la guarda de verificar-menores (M2); task-store-wip compara las ilegibles con el orden esperado escrito y recorre los estados al reves (M4); el codex falso de fs/git imprime cada argumento entre corchetes (M5); rondas-aprobada prueba diez rondas (TCORE-09); plugin-instalado tiene estado esperado y el caso sin claude en el PATH (TRES-06); fases usa antesQue, que exige que los dos textos aparezcan (TRES-09). Cada mutante de la auditoria pone ahora su test en rojo.
- Revision: 1 ronda, aprobada. MEN-2 (un indexOf suelto mas en fases) corregido en la verificacion ligera; MEN-1 aceptado (el test del plugin inventado admite dos estados porque depende de si la maquina tiene claude; la rama sin binario y la interpretacion de la lista tienen tests exactos).
- Nota: en Windows, el claude real no se lanza desde comprobarSkillInstalado (es un .cmd y spawnSync va sin shell), asi que el test de integracion siempre ve no-verificable alli. No se toca aqui: es comportamiento del producto, no del test.

## Verificacion parcial

- 2026-11-23T23:42:30Z: todo el codigo que cambia la tarea (7 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 55 min
- Real (de la rama abierta al cierre con merge, sin pausas): 22 min
- Cierre (finish): 135 s, de 2026-11-23T23:42:30Z a 2026-11-23T23:44:45Z
