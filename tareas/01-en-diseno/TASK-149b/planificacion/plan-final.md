# Plan — TASK-149b: errores y flags del CLI (parte b de TASK-149)

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 50 min (parte b del troceo aceptado de TASK-149)

1. Errores (FS-03): `ERRORES_COMUNES_CLI` en cli.ts (AutoCommitError, ConfigError, GitLaunchError, GitCommandError, GitflowScriptLaunchError, BaseBranchGuardError, TaskIdError, StateMachineError, TaskFolderConflictError) se traducen en `main` con `printCliError` y codigo 1, para todos los comandos. Cada catch de comando conserva solo sus errores propios (hoy hay 23 listas distintas: new, plan, approve, start... no capturan GitCommandError y caen en «taskctl no pudo arrancar»).
2. printAutoCommit (FS-02): recibe por donde escribir; doctor-deploy lo usa (con --json, stderr) en vez de su copia, que ya diverge (sin linea de push, «fichero(s)»).
3. Flags (FS-18): `extraerPushFlag` pasa de fs/git-commit.ts a cli/args.ts, junto a extraerUnico.
4. Sincronizacion (FS-15): el texto `aMano` de fs/sincronizacion.ts existe una vez.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- printCliError y printAutoCommit (cli.ts), extraerUnico y rechazarFlagsDesconocidos (cli/args.ts), los tests de cli que lanzan el binario real.
- Nuevo: ERRORES_COMUNES_CLI (la lista comun no existe; hoy esta repartida en 23 catch).

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Un comando que hoy deja salir un error comun como «taskctl no pudo arrancar» pasa a «[ERROR] ...» con codigo 1: es el arreglo. Un test lo fija con un comando real que antes caia en el catch-all.

## Plan de pruebas

Criterio 1: 1 test con un comando (approve o plan) que recibe un GitCommandError y antes caia en «taskctl no pudo arrancar», y la salida de doctor-deploy con autoCommit por printAutoCommit. Criterio 2: 1 test de extraerPushFlag en cli/args y del texto aMano. Mutacion de cada uno.

## Lo que necesita decision de una persona

Nada abierto.
