---
id: TASK-104
titulo: "Verificacion proporcional A3b: las rondas de review no corren la suite si solo cambia documentacion"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-104-verificacion-proporcional-a3b-las-rondas
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 392832
tokens_implementacion: 8094083
tokens_revision: 2805062
creado: 2026-11-11
actualizado: 2026-11-11
dependencias: [TASK-102]
---
## Objetivo

Segunda mitad de TASK-102 (troceada por la regla de una hora, decision de Carlos 2026-11-11). taskctl review usa la misma decision comun que el freno Stop (peticionDeTrabajo de TASK-102) sobre base...HEAD, nunca sobre el diff de la ronda: si solo cambia documentacion no corre la verificacion selectiva; con comando_verificacion_selectiva y comando de documentacion declarados corre el de documentacion; sin selectiva no corre nada (decision de Carlos: no aparece una ejecucion donde la 0.14.0 no la tenia). La comprobacion se ejecuta antes de escribir la peticion, con el mismo patron que verificacionSelectivaDeRonda. Plan de partida: tareas/01-en-diseno/TASK-102/planificacion/plan-final.md (paso 5).

## Criterios de aceptacion
- [x] Una ronda de review de solo documentacion con comando_verificacion_selectiva y comando de documentacion declarados corre el de documentacion y no la selectiva; sin selectiva declarada no corre nada (test por cada uno, repo temporal)
- [x] Un fichero de codigo en base...HEAD hace que review aplique la verificacion de siempre, tambien en una ronda incremental cuyo delta solo toca documentacion (test)
- [x] Stop y review dan la misma decision para el mismo diff (test)
- [x] Sin la configuracion nueva review se comporta exactamente como en la 0.14.0 (test de regresion)
- [x] verificacion-selectiva.md, README y CHANGELOG explican el comportamiento de Stop y review, como cambio de comportamiento para quien ya declaro rutas_documentacion
- [x] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Resultado

`taskctl review` decide con la misma funcion que el freno Stop
(`peticionDeTrabajo`, con la misma `baseFiable`), sobre base...HEAD mas el
arbol y nunca sobre el delta de la ronda. `verificacionSelectivaDeRonda` pasa a
`verificacionDeRonda` (src/commands/review.ts), con la guarda temprana intacta:
sin `comando_verificacion_selectiva` devuelve null sin lanzar ningun git (como
en la 0.14.0, y sin correr la de documentacion: decision de Carlos). Con ella:

- solo documentacion y `comando_verificacion_documentacion`: corre ese, no la selectiva;
- solo documentacion sin ese comando: no corre nada, y la peticion lo dice («Tipo: ninguna»);
- codigo en base...HEAD: la selectiva, tambien en una ronda incremental que solo corrige documentacion.

`VerificacionDeRonda` (core/informe-verificacion.ts) gana el tipo: la peticion
dice «comprobacion de documentacion ... no se ha corrido ningun test» o
«ninguna», nunca «selectiva», y oculta la cobertura con su motivo (decision de
Carlos). Los mensajes de rojo y de arbol sucio distinguen el tipo; el de
documentacion no menciona RAMA_BASE. Los avisos de la decision (config de la
base invalida) salen en los avisos de review; un fallo inesperado de la
decision cae a la selectiva con aviso. Documentado en verificacion-selectiva.md,
README y CHANGELOG como cambio de comportamiento para quien ya declaro
`rutas_documentacion` y la selectiva, incluida la divergencia a proposito sin
selectiva (Stop corre algo, review nada).

Tests: test/commands/review-documentacion.test.ts (10, repos temporales y un
script que cuenta ejecuciones): criterios 1 a 4, el hotfix (Stop y review corren
la selectiva), el rojo de documentacion, la config de la base invalida, la
cobertura oculta y la regresion sin `rutas_documentacion` contando procesos git
con GIT_TRACE2_EVENT (ni `git show` de la base ni `ls-files --others`). El
criterio 3 se prueba con la selectiva declarada (decision de Carlos). Suite
completa sobre ab52569: 2168 tests, 2164 en verde, solo los 3 rojos conocidos de
Windows (symlink en approve, chmod y CRLF en plan); despues solo cambiaron
tests, verificados por fichero.

Revision por pares, dos rondas, sin CRITICO ni IMPORTANTE:
- MEN-1 (no habia test de hotfix en review; el mutante `baseFiable: true`
  sobrevivia): corregido con un test que ahora lo tumba.
- MEN-2 (el `catch` de la decision no tiene test): aceptado. `peticionDeTrabajo`
  no lanza por ningun camino alcanzable y forzarlo exigiria un doble (la suite
  no usa mocks); queda como defensa en profundidad.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T08:49:23Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T09:04:05Z | approve | automatico | automatico | 0.14.0 |
| 2026-11-11T09:04:06Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T09:37:27Z | review | automatico | persona | 0.14.0 |
| 2026-11-11T09:53:10Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T08:52:59Z | diseno | agente:aea57827bd0fd7f33,a859c2a8efbcbd139,a6df14ece8685bd11 | 30 | 103891 | 269828 | 19083 | 26 | 392832 | - | - |
| 2026-11-11T09:37:27Z | implementacion | sesion:54b72414-a421-4c5c-a0d6-578a9eae7f01 | 82 | 60976 | 7996655 | 36370 | 17 | 8094083 | - | - |
| 2026-11-11T09:48:21Z | revision | agente:a2515e966b1484d09 | 36 | 119550 | 1748102 | 8604 | 2 | 1876292 | 1 | - |
| 2026-11-11T10:00:06Z | revision | agente:ab3773049f4b9f877 | 20 | 99155 | 821879 | 7716 | 2 | 928770 | 2 | - |

## Autorrevision

- code-quality-reviewer — 2dfd39e
- code-quality-reviewer — 2eb20ca
