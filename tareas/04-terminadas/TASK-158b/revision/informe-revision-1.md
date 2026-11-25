# Informe de revision — TASK-158b (ronda 1)

- Commit revisado: deb6eddd790c0fb3fc62918ebaac413def6e4d4c
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:979 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts:150 | implementacion |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts:150 | plan |

### IMPORTANTE-1 — Ningun test se pone rojo si `verificar-menores` deja de imprimir sus avisos
- Donde: taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:979 (`printAvisos(...r.avisos);`)
- Que pasa: la linea que hace visible el aviso al usuario real es una parte del diff (el plan la cita como punto 3), pero el unico test del comando (`verificar-menores.test.ts`) llama a `runVerificarMenoresCommand` y mira `r.avisos`; nadie ejercita `bin/taskctl`. Si se borra esa linea, el aviso se calcula, se devuelve y nunca se ve.
- Reproduccion: en el clon en `deb6edd`, mutante que borra `printAvisos(...r.avisos);` de `src/cli.ts` (rango de lineas 976-985), `npx tsc -p .` y `node --test` sobre los cuatro ficheros afectados: `# pass 41 # fail 0` (el mutante sobrevive). Los otros nueve mutantes del codigo nuevo si caen (ver "Que se ejecuto"). Comprobacion positiva del CLI real: repo temporal con la tarea en revision y un MENOR corregido, `bin/taskctl verificar-menores TASK-960` sale con 0 y en stderr imprime `[AVISO] TASK-960: los MENORES corregidos no traen su autorrevision 4D en "## Autorrevision". La verificacion queda registrada igual, ...: "- 4D menores — <commit>: usos buscados, N tests mutados".` Es decir, hoy funciona, pero sin red.
- Impacto: una regresion silenciosa vuelve inerte el aviso de los MENORES sin que la suite lo note; el criterio 2 ("un test por comando falla si deja de avisar") se cumple para la funcion, no para el comando que ejecuta la persona.
- Sugerencia: un test que arranque `bin/taskctl verificar-menores` (como hace `test/cli/errores-comunes.test.ts` con `spawnSync`) sobre el escenario de `montar` y compruebe `[AVISO] ... autorrevision 4D` en stderr; o, mas barato, un test unitario de la salida del CLI si ya hay un patron para ello.

### MENOR-1 — La etiqueta de `tieneLinea4D` se mete en una expresion regular sin escapar
- Donde: taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts:150
- Que pasa: `etiqueta` se interpola tal cual en `new RegExp(...)`. Con `'ronda 1.*'` la linea `- 4D ronda 1 — x` cuenta (`true`); con una etiqueta con parentesis lanzaria. Hoy solo la llaman tres sitios con literales (`''`, `ronda ${n}`, `'menores'`), asi que no hay fallo real.
- Reproduccion: `tieneLinea4D(<cuerpo con "- 4D ronda 1 — x">, 'ronda 1.*')` devuelve `true` (ejecutado sobre `dist`).
- Impacto: ninguno hoy; un tercer llamador con una etiqueta no literal daria resultados raros.
- Sugerencia: escapar los metacaracteres de cada palabra de la etiqueta, o documentar que es literal. Se propone no corregirlo si se prefiere no tocar mas: es una API interna con tres llamadas.

### MENOR-2 — Las lineas 4D solo valen en minuscula exacta (`4D`, `ronda`, `menores`)
- Donde: taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts:151
- Que pasa: `- 4d ronda 1 — x` y `- 4D Ronda 1 — x` no cuentan y el aviso salta aunque la persona haya hecho la autorrevision. Es el mismo criterio que ya tenia la linea base (`- 4D — `, sin flag `i`), no un cambio de comportamiento, y el aviso da la linea exacta a escribir.
- Reproduccion: ejecutado sobre `dist`: `- 4d ronda 1 — x` -> `false`; `- 4D Ronda 1 — x` -> `false`.
- Impacto: un aviso de mas, sin bloqueo; el propio mensaje dice como corregirlo.
- Sugerencia: no corregir (coherencia con la linea base y con `revision.md`, que fija el formato en minuscula); queda anotado para que no se lea como bug.

## Que se ejecuto

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-158b-r1`, `git checkout deb6edd`, `npm install` (0 vulnerabilidades), `npx tsc -p .` sin errores.
- `node --test dist/test/core/autorrevision.test.js dist/test/commands/review-incremental.test.js dist/test/commands/verificar-menores.test.js dist/test/commands/review-autorrevision.test.js`: 41 pasan, 0 fallan. La suite selectiva de la ronda (1950 tests, 0 fallos, `Commit verificado` = `Commit revisado`) se cita, no se repite.
- Mutacion (cada mutante recompilado y corrido contra los cuatro ficheros; restaurado despues):
  - M1 etiqueta ignorada en `tieneLinea4D`: 4 rojos.
  - M2 `avisoAutorrevisionRonda` devuelve siempre null: 2 rojos.
  - M3 `avisoAutorrevisionMenores` con etiqueta `menor`: 2 rojos.
  - M4 `review.ts` calcula el aviso y no lo anade a `avisos`: 1 rojo.
  - M5 `review.ts` pasa `previa.ronda + 1` en vez de `previa.ronda`: 1 rojo.
  - M6 `verificar-menores` avisa tambien sin codigo cambiado: 1 rojo.
  - M7 `verificar-menores` no anade el aviso: 1 rojo.
  - M8 condicion `cambiados` invertida: 2 rojos.
  - M9 `cli.ts` no imprime `r.avisos`: 0 rojos (IMP-1).
  - M10 (quitar el separador de la regex) no se pudo aplicar por escape del shell; sus casos de borde se probaron a mano (abajo).
- Comportamiento comprobado: `review` avisa en la ronda K+1 solo si falta `- 4D ronda K — ` (la de ronda 2, o la de la implementacion, no cuentan: cubierto por `review-incremental.test.ts`, caen con M2, M4 y M5); `verificar-menores` avisa solo con codigo cambiado y sin `- 4D menores — ` (el test pide `r.avisos` vacio sin codigo y con la linea); ambos son avisos, la ronda se abre y la verificacion se registra (`r2.ronda === 2`, `r.corregidos === ['MEN-1']`, y el CLI sale con 0).
- Casos borde de la regex sobre `dist`: `ronda 12`/`ronda 10` no cuenta por `ronda 1` (false); doble espacio `ronda  1` cuenta; separadores `—`, `-` y `:` cuentan; `*` como vineta cuenta; linea sin texto tras el separador no cuenta; `ronda 1, 2` no cuenta; mayusculas no cuentan (MEN-2).
- `tieneLinea4D(body)` sin etiqueta: `- 4D — x` cuenta y `- 4D ronda 1 — x` no; la linea base se comporta como antes (los tests previos de `autorrevision.test.ts` siguen en verde con la misma expectativa).
- Mensajes: se leen como estado (que falta, que la ronda o la verificacion sigue igual, la linea exacta con `<commit>: usos buscados, N tests mutados`, el formato que fija `revision.md`).
- Limpieza: clon y repo temporal borrados; no existe `TaskCode\TaskCode`.

## Regla 4D

- Duplicacion: cumple (`tieneLinea4D` se parametriza en vez de crear un segundo detector; el texto comun de los dos avisos nuevos comparte `FORMATO_CORRECCION`; la frase "quien corrige busca todos los usos" aparece en ambos avisos pero no es una decision que pueda divergir con consecuencia demostrable)
- Desviacion: cumple (todo el diff sirve a los dos criterios; el cambio de texto del aviso de la linea base, anadir "usos buscados", es coherente con `revision.md`)
- Diluvio: cumple
- Disfraz: IMP-1 (el aviso de `verificar-menores` en el CLI no tiene test que lo proteja; los cuatro tests nuevos restantes se mutaron y caen, incluido el candidato "cada linea 4D cuenta solo por la suya": 4 rojos con M1)

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-fixtures.ts`: para montar el repo temporal del caso CLI real.
- `taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl`: para invocar el CLI real.
- `taskcode-marketplace/plugins/taskcode-plugin/test/cli/errores-comunes.test.ts`: patron existente para probar el CLI con `spawnSync` (sugerencia de IMP-1).
- `taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md`: formato del informe y Regla 4D, pedido por la peticion.

- MEN-2 aceptado: la linea 4D distingue mayusculas igual que la linea base desde TASK-153; cambiarlo solo en las etiquetas haria dos criterios distintos.
