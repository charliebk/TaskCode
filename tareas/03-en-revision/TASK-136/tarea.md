---
id: TASK-136
titulo: "Cerrojo en verificar-impacto: dos ejecuciones solapadas borran dist/src"
tipo: fix
sprint: 0
etiquetas: [windows, verificacion]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-136-cerrojo-en-verificar-impacto-dos-ejecuci
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 3301792
tokens_revision: null
creado: 2026-11-18
actualizado: 2026-11-18
dependencias: []
---
## Objetivo

scripts/verificar-impacto.mjs guarda dist/src (versionado) en una carpeta de copia fija por plugin (tmpdir/verificar-impacto-<hash>) y la devuelve al acabar. Si una segunda ejecucion arranca con la primera viva (review en segundo plano y el freno Stop a la vez), restaurarHuerfana toma la copia de la primera por huerfana porque no mira si su pid sigue vivo: la restaura y la borra. La primera, al acabar, hace rmSync(dist/src) sin copia que devolver: dist/src desaparece entero y bin/taskctl deja de arrancar (Cannot find module dist/src/cli.js). Paso en TASK-134 y dos veces en TASK-135; TASK-134 propuso el cerrojo y no se llego a crear la tarea. Se anade un cerrojo atomico por plugin (fichero creado con wx, con el pid): una segunda ejecucion espera a que la primera termine, una con pid muerto se considera cortada y se recupera como hasta ahora, y devolver nunca borra dist/src si no tiene copia.

## Criterios de aceptacion
- [x] Dos ejecuciones solapadas sobre el mismo plugin terminan las dos con el codigo de sus tests y dejan dist/src exactamente como estaba (git status limpio); la segunda avisa de que espera a la primera
- [x] Un cerrojo cuyo pid ya no existe (ejecucion cortada) no bloquea: la siguiente lo toma, avisa y restaura dist/src desde la copia huerfana como hasta ahora
- [x] devolver no borra dist/src si la copia que debia devolver no existe: avisa y deja dist/src como esta
- [x] La espera tiene un tope (variable de entorno, por defecto 30 min); al agotarlo sale con 1 y un mensaje que dice que pid tiene el cerrojo y donde esta
- [x] Los tests existentes de test/scripts/verificar-impacto.test.ts siguen en verde, incluido el de la ejecucion cortada a mitad

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-18T15:11:56Z | plan | automatico | persona | 0.16.2 |
| 2026-11-18T15:12:28Z | approve | automatico | persona | 0.16.2 |
| 2026-11-18T15:12:31Z | start | automatico | persona | 0.16.2 |
| 2026-11-18T15:29:37Z | review | automatico | persona | 0.16.2 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-18T15:29:37Z | implementacion | sesion:0ce76c9f-f85b-43d3-a1cf-3503270b7dc0 | 26 | 20960 | 3269045 | 11761 | 2 | 3301792 | - | - |

## Verificacion ligera

- 2026-11-18T16:03:22Z: ronda 1; commit revisado c28556de1354dddae973ac191a1e5148947d7b6a; commit verificado 4c3199e2e8c5fc25d44ee68520eee4604ff4b2c5; ficheros: scripts/verificar-impacto.mjs, taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts; corregidos: MEN-1, MEN-2; pendientes: ninguno

## Resultado

- `scripts/verificar-impacto.mjs`: cerrojo `<copia>.cerrojo` por plugin, creado con `wx` y el pid. Quien llega segundo avisa y espera (reintento cada 500 ms, tope `VERIFICAR_IMPACTO_ESPERA_S`, 1800 s por defecto; agotado, sale con 1 nombrando el pid y la ruta, sin tocar `dist/src`). Un cerrojo con pid muerto o ilegible es de una ejecucion cortada: se toma con aviso y la copia huerfana se recupera como antes. Se suelta en el `finally`, solo si sigue siendo de este pid. `devolver` no borra `dist/src` si no hay copia: avisa y lo deja.
- Causa confirmada antes del arreglo con el test de solape: la segunda ejecucion tomaba por huerfana la copia viva de la primera y todo acababa en `ENOENT ... verificar-impacto-<hash>/src` (lo que dejaba `dist/src` borrado en TASK-134 y TASK-135).
- Tests en `test/scripts/verificar-impacto.test.ts`: solape de dos ejecuciones, cerrojo con pid muerto, espera agotada, copia perdida a mitad (MEN-2) y `.robo` respetado y caducado (MEN-1). 20/20 en verde; mutantes cazados: sin cerrojo (solape), barrera de `devolver` anulada (MEN-2) y retirada sin `.robo` (MEN-1).
- Verificacion por impacto en verde (653 pass) sin tocar `dist/src`; `taskctl review` tampoco lo toco.
- Revision ronda 1: aprobada con correcciones. MEN-1 (carrera al retirar un cerrojo muerto: ahora solo lo retira quien crea `<cerrojo>.robo` con `wx`, tras releerlo; un `.robo` de mas de 10 s caduca) y MEN-2 (la barrera de `devolver` sin test) corregidos con test cada uno; modo rapido: la persona acepta cerrar sin ronda 2 (`verificar-menores`).
- Riesgo aceptado: un pid muerto reasignado a otro proceso se ve vivo; la segunda ejecucion espera hasta el tope y lo explica, sin borrar nada.

## Verificacion omitida

- 2026-11-18T16:35:47Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
