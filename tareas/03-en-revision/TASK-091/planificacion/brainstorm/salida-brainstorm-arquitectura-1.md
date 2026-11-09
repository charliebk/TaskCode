# Brainstorm — TASK-091, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: a2f6ff30c44527281

## Enfoque propuesto, con rutas y nombres concretos

Una sola pieza de ejecucion con dos «tipos» de verificacion, sin un segundo motor. La selectiva es otro *comando* que pasa por el mismo `ejecutarVerificacion` (`src/fs/verificacion.ts:39`). Cada consumidor elige que tipo corre:
- **Hook Stop** (`src/hooks/freno-stop.ts:159-185`): corre la selectiva si esta declarada y, si no, la completa (lo de hoy).
- **`taskctl review`** (`src/commands/review.ts`, tras el bloque de cobertura de las lineas 642-652, antes de escribir nada): corre la selectiva solo si esta declarada. Hoy `review` no ejecuta ninguna verificacion (solo lee `comando_verificacion` para la cobertura, linea 651), asi que sin la clave no cambia nada.
- **`finish` y guardian**: no cambian de comando. `puertaVerificacion` (`src/commands/finish-verificacion.ts:66-136`) ya ejecuta **siempre** `comando_verificacion` y no reutiliza el memo (lineas 4-6 y 112-127). El criterio 3 ya se cumple; solo se toca el texto del error para que diga «aunque las rondas usaran la selectiva» y como correr la completa. El guardian (`src/hooks/guardia-merge.ts:94, 140-160`) sigue consultando solo la huella de la completa.

La rama base llega por **variable de entorno**, igual que `HELDOUT_DIR` (`finish-heldout.ts:211-214`, `env: { ...process.env, [VARIABLE]: valor }`). Propone `RAMA_BASE`, un nombre neutro, porque esto lo leen proyectos ajenos. La base sale de `resolveBaseBranchForTipo(tipo, cwd)`, la misma que usa `review.ts:561`. El hook Stop ya tiene el `tipo` de la tarea en curso, que lee en `freno-stop.ts:112`.

La salida en la peticion va por el mismo camino que la cobertura: un campo nuevo `seccionVerificacion?: string` en los `extras` de `peticionTemplate` (`review.ts:200`, `324`, `260`), rellenado por un `seccionVerificacionRevision(r, tipo)` nuevo en `src/core/informe-verificacion.ts`, que reutiliza `describirResultado` y la cola que ya formatea `formatearVerificacionRoja`.

## Que se extiende y que se crea

- `src/core/config.ts` (**se extiende**): dos campos en `TaskcodeConfig` (169+): `comando_verificacion_selectiva: string | null` (defecto null) y `timeout_verificacion_selectiva: number`. Tambien en `CONFIG_DEFAULTS` (225), `CLAVES_CONFIG` (246), la tabla de cabecera (20-24) y dos `case` en el switch (508-516) con los `validarComando` y `validarEnteroPositivo` existentes (ampliar sus uniones de tipos, 731 y 861). `validarVerificacionCompleta` (627-636) gana dos reglas: timeout selectivo sin su comando aborta, y selectiva sin `comando_verificacion` aborta (sin completa no hay puerta en `finish`).
- `src/fs/verificacion.ts` (**se extiende**): el memo deja de ser de una ranura (`FICHERO_MEMO`, 28). Parametro `tipo: 'completa' | 'selectiva'` en `rutaMemo`, `leerMemo`, `guardarMemo`. La completa sigue en `freno-verificacion.json` (compatibilidad y lo que lee el guardian); la selectiva va a `freno-verificacion-selectiva.json`. `huellaDelArbol` (89) gana un argumento opcional `contexto` para meter el SHA de la base en la huella de la selectiva. `huellaDeCommit` (112) y la formula de la completa no cambian.
- `src/hooks/freno-stop.ts` (**se extiende**): el tramo 159-185 elige comando, timeout y memo segun el tipo, con `timeoutEfectivoS` (71) aplicado al timeout elegido. Cabecera (5-20) documenta la eleccion.
- `src/commands/review.ts` (**se extiende**): llama a la selectiva, reutiliza su memo si el Stop ya la corrio con la misma huella y pasa el resultado a la seccion nueva. Si un rojo bloquea la ronda o solo se informa es regla de negocio que no decide.
- `src/commands/doctor.ts` (**se crea una comprobacion nueva**): `comprobarVerificacionSelectiva`, id `verificacion-selectiva`, registrada junto a la linea 699. **No** cambiar `comprobarVerificacion` (414-437): `test/commands/doctor.test.ts:320-327` exige `nivel === 'ok'` y ese mensaje exacto con solo `comando_verificacion`, y el criterio 1 prohibe tocar tests existentes.
- `src/core/informe-verificacion.ts` (**se extiende**) con la funcion de la seccion de la peticion.

No se crea ningun clasificador de capas en el plugin: el mapa es del proyecto; solo se documenta en la guia de migracion.

Orden: 1) config y validacion; 2) memo por tipo y huella con contexto; 3) hook Stop; 4) `review` y la seccion; 5) `doctor`, texto de `finish` y documentacion. Los pasos 1 y 2 se entregan solos sin cambiar comportamiento.

## Limites que cruza

- **`.taskcode/config.yml` (contrato publico)**: dos claves nuevas. Un plugin anterior las ve como desconocidas, avisa y las ignora (`config.ts:62-70`); su Stop sigue corriendo la completa. Compatible hacia atras.
- **Contrato del comando del proyecto**: variable de entorno nueva. Descartado pasar la rama como argumento posicional: el comando «lo ejecuta el shell tal cual» (`config.ts:166-168`), anadir al final rompe `a && b`, y `cmd.exe`/`sh` entrecomillan distinto.
- **Formato del memo bajo `.git/`** (`fs/verificacion.ts:15-17`): pasa de un fichero a dos; sigue sin escribir en el espacio de trabajo.
- **Formato de la peticion de revision**: seccion nueva que dice si fue selectiva o completa.
- **Contrato de `informe_cobertura`** (`config.ts:179-182`: el lcov «lo genera `comando_verificacion`»): si la selectiva tambien lo escribe, la seccion de cobertura de `review` leeria un informe parcial. Decision anotada, no tomada.
- **Contenido instalado en proyectos ajenos**: guia de migracion, README del plugin y skills no pueden nombrar TaskCode (tests); el nombre de la variable tampoco.

Alternativa descartada: que el guardian y `finish` acepten un verde de la selectiva (contradice «ninguna rama pasa a otra sin comprobarlo todo» y obligaria a conocer el mapa de capas).

Desacuerdos previstos: si un rojo de la selectiva en `review` aborta la ronda o solo se anota; y criterio 1 frente a criterio 4 en `doctor.test.ts:325` (posicion: comprobacion separada).

Suposiciones no verificadas: que `resolveBaseBranchForTipo` no hace llamadas de red (mirar `src/fs/git.ts` ~791); que `doctor` no cambia su codigo de salida ni algun test cuenta los avisos totales.

## La decision de diseño que mas te preocupa (UNA sola)

**Que el memo siga siendo de una sola ranura compartida por los dos tipos.** Hoy `freno-verificacion.json` es un unico registro que pisan el Stop y `finish` (`verificacion.ts:149-159`) y que el guardian lee para dejar pasar un merge (`guardia-merge.ts:152-160`). Con la selectiva en el Stop, cada fin de turno sobrescribiria el verde de la completa que dejo `finish`. No daria un falso verde (la huella incluye el comando, linea 99), pero si `finish` verifico en verde y luego fallo en el merge, la recuperacion manual que pide el guardian exigiria repetir la completa: los 40 minutos que esta tarea quiere ahorrar. Ademas la huella de la selectiva tiene que incluir el SHA de la rama base. Separar el memo por tipo y anadir la base a la huella hay que fijarlo antes de tocar ningun consumidor.
