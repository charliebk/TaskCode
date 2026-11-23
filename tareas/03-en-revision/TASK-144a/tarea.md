---
id: TASK-144a
titulo: "cadena, Commit revisado y tarea en su rama (parte a de TASK-144)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 19545467
tokens_revision: 7113106
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-144 (Regla 4D: ciclo de vida, cadena y flags en commands), partes TASK-144a, TASK-144b, TASK-144c en la rama fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en.

GUARDADOS_POR_CADENA derivado y probado contra los comandos que escriben, una sola definicion de codigo cambiado tras el Commit revisado y del Commit revisado de la ultima ronda, y un solo helper de tarea en otra rama (CMD1-01, CMD2-01, CMD2-03, CMD2-04).

Objetivo de la tarea entera:

> Cerrar las decisiones del ciclo de vida y de los flags escritas en varios comandos con reglas distintas (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD1-01, CMD1-09, CMD1-10, CMD1-11, CMD2-01 a CMD2-05, CMD2-09, CMD2-14 y FS-01).

## Criterios de aceptacion

- [x] Un test recorre src/commands y falla si un comando con autoCommit o ensureBaseBranchReady no esta en GUARDADOS_POR_CADENA; trocear, verificar-menores, verificar-lote y doctor-deploy aceptan --cadena dentro de una cadena
- [x] siguiente, verificar-menores, codigoSinVerificar y leerRondaPrevia usan una sola funcion para el Commit revisado de la ultima ronda y una sola para el codigo cambiado; un test con comando_sincronizacion que regenera un fichero fuera de tareas/ en el commit de review da fase finish sin pregunta en modo automatico
- [x] pausa, registrar-coste y siguiente deciden con un mismo helper si la tarea vive en otra rama, con un solo texto de error

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T03:04:55Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T03:05:09Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T03:05:10Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T03:17:48Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — beef301: helper buscado (codigoCambiado, commitRevisadoDe, currentBranch/localBranchExists/isAncestor reutilizados; tres helpers nuevos sustituyen copias); criterios citados; 3 tests nuevos, 4 mutaciones en rojo (regla antigua de siguiente, comando fuera de la cadena, ronda distinta, y el de cadena derivado).
- code-quality-reviewer — beef301

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T03:17:48Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 54 | 34362 | 19490426 | 20625 | 15 | 19545467 | - | - |
| 2026-11-23T03:42:12Z | revision | agente:a8aae47cd9761d323 | 120 | 148025 | 6940663 | 24298 | 11 | 7113106 | 1 | - |

## Verificacion ligera

- 2026-11-23T03:42:23Z: ronda 1; commit revisado b3ea93abc38ebb35db629549945080aa82896213; commit verificado 7741d0977af9d1a705f0cac4088c02a4ada8bc92; ficheros: taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts; corregidos: MENOR-1; pendientes: MENOR-2

## Resultado

- GUARDADOS_POR_CADENA incluye trocear, verificar-menores, verificar-lote y doctor-deploy; el test deriva la lista de los comandos con autoCommit o ensureBaseBranchReady, asi que un comando nuevo que escriba sin guarda pone la suite en rojo (CMD1-01). Con --cadena, trocear y verificar-menores ya no abortan por flag desconocido.
- siguiente usa codigoCambiado (sin lo que regenera comando_sincronizacion ni lo excluido): con sincronizacion ya no pregunta tras una ronda aprobada (CMD2-01, test con un repo real). commitRevisadoDeRonda es la unica regla del Commit revisado de la ultima ronda en siguiente, verificar-menores, finish y review (CMD2-04). tareaEnOtraRama y mensajeTareaEnOtraRama, en siguiente, pausa y registrar-coste (CMD2-03).
- Revision ronda 1: aprobada con correcciones. MENOR-1 corregido (test de punta a punta con una peticion de otra ronda); MENOR-2 aceptado y al backlog: con ronda fragmentada basta el primer Commit revisado, la misma regla que verificar-menores.

## Verificacion parcial

- 2026-11-23T03:42:31Z: todo el codigo que cambia la tarea (20 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
