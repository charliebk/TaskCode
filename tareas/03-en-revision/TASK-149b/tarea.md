---
id: TASK-149b
titulo: "errores y flags del CLI (parte b de TASK-149)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 8665810
tokens_revision: 4180985
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-149a]
---
## Objetivo

Parte b del troceo de TASK-149 (Regla 4D: duplicacion en fs, hooks y cli), partes TASK-149a, TASK-149b, TASK-149c en la rama fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli.

printAutoCommit en doctor-deploy, GitCommandError igual en todos los comandos, extraerPushFlag en cli/args.ts y aMano una vez (FS-02, FS-03, FS-15, FS-18).

## Criterios de aceptacion
- [ ] doctor-deploy imprime con printAutoCommit y todos los comandos traducen GitCommandError igual, con test de un comando que antes caia en taskctl no pudo arrancar
- [ ] extraerPushFlag vive en cli/args.ts y el texto aMano de sincronizacion existe una vez

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T11:25:54Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T11:25:55Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T11:25:56Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T11:37:36Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 424a988: buscados printCliError, printAutoCommit, extraerUnico y el texto aMano antes de escribir; nuevo ERRORES_COMUNES_CLI (la lista comun no existia: 23 catch con listas distintas) y textoAMano; 1 fichero de test nuevo y 2 tests ampliados (doctor-deploy, args); 3 mutaciones en rojo
- code-quality-reviewer — 424a988
- 4D — 2735c6e: correccion de la ronda 1; nuevo esErrorComunCli (la decision de main, exportada para probarla); 1 test nuevo con las 9 clases; 4 mutaciones en rojo (quitar una clase de la lista)
- code-quality-reviewer — 2735c6e

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T11:37:36Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 42 | 25571 | 8624292 | 15905 | 7 | 8665810 | - | - |
| 2026-11-23T12:00:40Z | revision | agente:a348b5fe1767a7433 | 64 | 146867 | 4019249 | 14805 | 2 | 4180985 | 1 | - |
