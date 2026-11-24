---
id: TASK-145a
titulo: "puertas, git y textos de error (parte a de TASK-145)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 17161227
tokens_revision: 6171952
creado: 2026-11-22
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-145 (Regla 4D: duplicacion en las puertas de finish), partes TASK-145a, TASK-145b en la rama fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f.

gitTexto en finish-verificacion, finish-heldout, verificacion y doctor; configBase y configDe unidas; puerta comun; textos y regex de [ERROR] de una sola fuente.

Objetivo de la tarea entera:

> Unificar lo copiado dentro de finish y sus puertas (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD1-02 a CMD1-07, CMD1-12 a CMD1-15 y FS-09).

## Criterios de aceptacion

- [ ] finish-verificacion, finish-heldout, fs/verificacion y doctor usan gitTexto (con timeout y entorno) en vez de sus copias, y configBase y configDe son una sola funcion
- [ ] Las puertas pesada, completa y de documentacion comparten el bloque ejecutar-anotar-arbol limpio-memo, puertaReintento usa opcionesEjecucion, y los textos repetidos y la regex que quita [ERROR] salen de una sola fuente

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T09:37:04Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T09:37:41Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T09:37:47Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T10:04:40Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 3d8517d: reutilizados gitLinea y gitCrudo (con env nuevo) en vez de crear otro envoltorio; configDeLaRama y CIERRE_SIN_MERGE en finish-opciones, que ya importan las dos puertas; ejecutarPuerta, cerrarIgualmente y errorArbolSucio en finish-verificacion; fs/verificacion.ts ya no tenia copia de git (la de la auditoria se fue en 149a), y el test de paridad lo fija; el mensaje de arbol sucio de held-out sigue aparte a proposito (no muestra el comando); mutaciones en rojo: la regex copiada en freno-stop y un spawnSync de git en finish-heldout
- code-quality-reviewer — 3d8517d
- 4D — f5d4dbc: test de anotarSuite en pesada y documentacion; errorArbolSucio con sujeto y verbos; CIERRE_SIN_MERGE en finish-verificacion
- code-quality-reviewer — f5d4dbc (ronda 2)

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T10:04:40Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 80 | 51596 | 17084868 | 24683 | 19 | 17161227 | - | - |
| 2026-11-24T10:31:53Z | revision | agente:af40d63e24e9606f9 | 90 | 159207 | 5995235 | 17420 | 8 | 6171952 | 1 | - |
