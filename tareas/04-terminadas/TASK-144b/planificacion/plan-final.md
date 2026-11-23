# Plan — TASK-144b: flags con y sin valor

Redactado por el coordinador (modo rapido; parte b del troceo de TASK-144, enfoque fijado en el plan de la tarea).

## Enfoque propuesto

Duracion estimada: 60 min (args.ts y 7 comandos que leen flags; 3 criterios)

1. `extraerUnico` en cli/args.ts, sobre `extraerRepetible`: un flag con valor que no se repite. Sustituye los lectores a mano de approve, cadena, finish-opciones, doctor-deploy, veredicto, verificar-menores y new (CMD1-09, CMD2-05).
2. `FLAGS_SIN_VALOR` exportado y completo (review, finish, estado, metricas, status line de doctor) con un test de paridad que recorre src/commands (FS-01).
3. verificar-lote: nombre del comando sin «taskctl» duplicado, `extraerPushFlag` (admite -p) y su autoCommit con fase `verificar-lote` (CMD2-14).

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `extraerRepetible`, `rechazarFlagsDesconocidos` (cli/args.ts) y `extraerPushFlag` (fs/git-commit.ts).
- Nuevo: solo `extraerUnico`, que sustituye siete copias.

## Riesgos aceptados y que los contiene

- `--cadena` sin testigo pasa a abortar al extraer (antes llegaba vacio a la validacion): sigue abortando, con un mensaje mas claro.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo): 3 en test/cli/flags-paridad.test.ts (paridad de booleanos, --completa=1 aborta, las dos formas de los flags con valor en varios comandos). Mutacion de cada uno.

## Lo que necesita decision de una persona

Nada abierto.
