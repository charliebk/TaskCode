# Informe de revision — TASK-122 (ronda 1)

- Commit revisado: dc5f692f8ef436c59b547276b3190196fabecd98
- Revisor: code-quality-reviewer (agente revisor independiente, general-purpose, modelo sonnet; modo rapido)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-122 aprobada | aprobada-con-correcciones | cambios-solicitados)

Veredicto propuesto por el revisor: aprobada-con-correcciones. Con tres IMPORTANTES abiertos se escribe cambios-solicitados.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | scripts/verificar-impacto.mjs (`recortados`, ~l.221) | implementacion |
| IMP-2 | IMPORTANTE | abierto | docs/auditoria/PERFIL-TESTS-2026-11-12.md (tabla, filas 142-192) | implementacion |
| IMP-3 | IMPORTANTE | abierto | scripts/verificar-impacto.mjs (`main`, rama `cambiadas === null`) | implementacion |
| MEN-1 | MENOR | abierto | scripts/verificar-impacto.mjs (`main`, bloque `try/finally`) | implementacion |
| MEN-2 | MENOR | abierto | docs/contexto/CONVENCIONES.md:36-38 | implementacion |
| MEN-3 | MENOR | abierto | docs/auditoria/PERFIL-TESTS-2026-11-12.md (Resumen) | implementacion |
| MEN-4 | MENOR | abierto | src/core/evolucion.ts (`cerradasAcumuladas`) | implementacion |
| MEN-5 | MENOR | abierto | .taskcode/config.yml frente al plugin 0.14.0 instalado | plan |
| MEN-6 | MENOR | abierto | scripts/verificar-impacto.mjs / README / CHANGELOG | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Lo que se ejecuto

Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-122-r1`, rama de la tarea, `npm install` y `npm run build`. Modo rapido: sin suite completa.

- `npm run test:rapido`: 748 tests, 0 fallos, 14 s.
- `RAMA_BASE=develop node scripts/verificar-impacto.mjs` desde la raiz: 37 ficheros cambiados, 14 por impacto, tope de 10, 6 directos + los 748 de rapido: 788 tests, 0 fallos, 48,6 s de reloj; `git status` limpio.
- Tests afectados (verificar-impacto, perfil-tests, evolucion, metricas-agregados, -tokens, -repo, -version, -fila y metricas): 54/54. `plan.test` falla en 2 casos: chmod sobre directorios y CRLF de Windows (conocidos).
- Mutantes de `verificar-impacto.mjs`: sin corte en `src/cli.ts`, sin tope, `.taskcode/` que amplia, sin marcador `scripts/gitflow`, sin el `cpSync` que devuelve `dist/src`: todos caen. Solo quitar el `rmSync` previo a la restauracion sobrevive (cpSync sobrescribe igual; menor, no se cuenta).
- Mutantes de `evolucion.js` (umbral que sube, que baja, tramos completos, `cerradasAcumuladas`): todos caen.
- `taskctl metricas --evolucion` sobre el repo real: punta a punta 60,7 -> 78,4 min y revision 40,6 -> 49,4 (+29 % y +22 %, como cita ESCALA §2).

## IMP-1 — Con tope superado, un cambio en un modulo comun no verifica ningun test de lo que cambia

`recortados()` tiene un segundo escalon: si los directos tambien pasan del tope, se corren solo los tests cambiados, que para un cambio en un modulo comun son cero. Reproduccion (`echo "// x" >> <fichero>`, `RAMA_BASE=HEAD node scripts/verificar-impacto.mjs --listar`): `src/commands/finish.ts` (51 directos), `scripts/gitflow/_gitflow-common.sh` (23), `scripts/gitflow/update-feature.sh` (23), `bin/taskctl` (32), `test/helpers/repo-plantilla.ts` (25) y `package.json` (`todo: true`, 23) corren 0 tests por impacto: solo `test:rapido`, que no ejercita Git ni los comandos. La salida lo avisa, pero el README y el CHANGELOG solo hablan de «los tests directos», y para `package.json`/`tsconfig.json` el motivo dice «toda la suite» y corre cero extra. Sugerencia: en el segundo escalon, los N directos mas proximos por nombre (`finish*`, `gitflow/*`, los que nombran `bin/taskctl`). Con la config actual, `scripts/gitflow/`, `bin/` y `package.json` caen fuera de `rutas_verificacion_parcial` y `finish` ya exige la completa; el hueco queda en `src/**` y `test/**` y en las rondas y el freno.

## IMP-2 — PERFIL-TESTS afirma como medidos ficheros que no se midieron

50 filas (142-192 salvo la 147) dicen `0 tests`, `0 git`, 0,2-0,3 s: `start-basico`, `new`, `plan`, `review-*`, `finish`... Medidos tras `npm run build`: `start-basico` 15 tests en 15,9 s, `review-camino` 2 en 8,2 s, `plan` 31 en 44 s, `new` 19 en 7,6 s. Fallaron al arrancar (probablemente `dist/test` regenerado en paralelo, ver MEN-1). El script anota `codigo` pero no lo vuelca. Consecuencia: «121 ficheros no lanzan git: 886 tests en 273 s» es falso (como maximo 71); «1803 tests», «86,8 min» y «24 084 procesos git» se quedan cortos; ESCALA enlaza este perfil. Los 10 mas lentos no se ven afectados. Correccion: volver a medir o excluir y declarar los que tienen `codigo != 0` o 0 tests; que el script avise si un fichero da 0 tests.

## IMP-3 — Base inexistente: dice «ante la duda, la suite entera» y corre solo `test:rapido`, sin avisar

Con `develop` ausente (solo `origin/develop`), `RAMA_BASE=develop node scripts/verificar-impacto.mjs` imprime `Ficheros cambiados: 0`, corre 748 tests y sale con 0. Con `--listar` el JSON dice `"todo": true, "motivo": "no existe la rama base ... ante la duda, la suite entera"`, pero la ejecucion real no imprime ese motivo ni corre la suite. Un exito silencioso y falso. El test 7 solo mira `--listar`. Correccion: salir con error o correr la completa, imprimiendo el motivo, con una asercion sobre la ejecucion real.

## MEN-1 — Un corte a mitad deja `dist/src` y `dist/test` a medias y un temporal huerfano

El `finally` no corre si el proceso muere (taskkill, timeout del freno). Reproduccion: comentario en `src/core/evolucion.ts`, `RAMA_BASE=HEAD`, matar el arbol a los 9 s: `dist/src/core/evolucion.js` queda modificado, un `verificar-impacto-*` queda en `%TEMP%` y `dist/test` queda a medias (puede explicar IMP-2). Recuperable con `git checkout -- dist/src`, sin aviso. Mitigacion: marcador y restaurar al inicio de la siguiente, o compilar a un `--outDir` distinto; como minimo documentarlo.

## MEN-2 — CONVENCIONES.md se contradice y con CLAUDE.md

§Ciclo paso 4 sigue diciendo «`npm test` en verde antes de commitear; `test:rapido` no vale para cerrar», frente a las lineas 82-83 y CLAUDE.md §5. CLAUDE.md §Comandos conserva «~1290 tests, ~10 min» y no lista `verificar-impacto`.

## MEN-3 — PERFIL-TESTS: «los 10 mas lentos ... con 77 tests de primer nivel»

La propia tabla suma 223 (9+8+32+34+5+10+14+58+37+16). El resto (39,2 min, 45,2 %) cuadra.

## MEN-4 — `cerradas` no son todas las cerradas del proyecto

`cerradasAcumuladas` cuenta solo tareas con fecha de cierre (84 frente a 93 terminadas en TaskCode). README y NOTA_EVOLUCION dicen «tareas cerradas del proyecto». Aclarar «con fecha de cierre» o contar todas; la tendencia no cambia.

## MEN-5 — El plugin 0.14.0 instalado ignora las claves nuevas y `finish` sigue pidiendo la completa

El `doctor` del 0.14.0 avisa (sin abortar) de `rutas_documentacion` y `rutas_verificacion_parcial` y dice que la completa sigue siendo la puerta de `finish`. Hasta publicar e instalar, el `finish` con el plugin instalado correra `npm --prefix ... test` (completa, timeout 1800 s), y un diff que toque `.taskcode/config.yml` fuerza la completa tambien con el taskctl del repo. No esta dicho en CHANGELOG ni en ESCALA.

## MEN-6 — El corte en `src/cli.ts` no se anuncia, y el README del plugin no menciona `verificar-impacto`

La salida lista «importa X» pero no dice que la busqueda se paro en el enrutador; el README no menciona `verificar-impacto` ni `VERIFICAR_IMPACTO_TOPE`.

## Verificado sin hallazgo

- `.taskcode/config.yml` valido para el taskctl del clon; `finish-verificacion` y `doctor` reconocen la selectiva.
- `metricas --evolucion` y `--json`: columnas, tendencia y umbral del 15 % correctos.
- ESCALA §2 y §5 reproducidos; los datos de ToolsaWeb y OpenDockTrading no se pudieron comprobar (no estan en este repo). §1: 2170 `test(`/`it(` en HEAD frente a 2167 (irrelevante).
- Regla de la piramide coherente con CLAUDE.md §3 y la linea 77 de CONVENCIONES.

## Lecturas fuera del contexto permitido

- `src/core/verificacion-proporcional.ts` y `src/commands/finish-verificacion.ts` (grep): para confirmar como se aplican las rutas de la config (MEN-5).
- `src/core/evolucion.ts` completo, `test/**` por grep y `dist/test` del clon: para los mutantes y para reproducir IMP-2.
- El `taskctl` instalado 0.14.0: solo ejecutado (`doctor`) para MEN-5.
