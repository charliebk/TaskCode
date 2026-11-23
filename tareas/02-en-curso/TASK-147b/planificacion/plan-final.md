# Plan — TASK-147b: criterios, normalizacion, citar e IDs (parte b de TASK-147)

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 60 min (parte b del troceo aceptado de TASK-147)

1. Criterios (CORE2-04): `extraerSecciones` (core/tarea-body.ts) anota tambien los criterios normales sin marcar (`criteriosSinMarcar`); `casillasSinMarcar` (validacion-tarea.ts) pasa a devolver eso. Asi reconoce `**Tras el cierre**` en negrita y `### Criterios de aceptacion`, como el resto del flujo.
2. Normalizacion (CORE2-05): `quitarDiacriticos` exportada en tarea-body.ts; `normalizarTexto` la usa y le anade minusculas. `normalizar` de validacion-tarea desaparece (usa `normalizarTexto`) y `normalizarCelda` de informe-revision usa `quitarDiacriticos` (las celdas conservan mayusculas: IDs y rutas).
3. `citar` (CORE2-07): una sola, exportada desde tarea-body.ts; troceo y particion-tarea la importan.
4. ID de tarea (CORE2-01, CORE2-14, FS-04, CMD2-08): en core/task.ts, `TASK_ID_RE` exportada con grupos (numero y letra), `isValidTaskId`, `esIdTroceable` (sin letra) y `compararIds(a, b)` (numero y luego letra; lo que no es un ID va al final, por cadena). La usan fs/task-store, fs/wip-scan, fs/roadmap, commands/trocear, core/task-id, flujo y troceo (troceable), y ordenan con `compararIds` board-format, evolucion, roadmap, roadmap-comparar, wip y doctor.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- extraerSecciones y normalizarTexto (core/tarea-body.ts), isValidTaskId y TASK_ID_RE (core/task.ts), esIdTroceable (core/troceo.ts, se mueve a task.ts), taskIdSortKey (core/board-format.ts, la unica clave que ya leia la letra: pasa a ser compararIds), citar (troceo.ts, se queda una).
- Nuevo: quitarDiacriticos (normalizarTexto sin minusculas, porque las celdas del informe conservan mayusculas) y compararIds (sustituye cinco lectores del numero de ID).

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- `casillasSinMarcar` deja de mirar una segunda seccion `## Criterios de aceptacion` (extraerSecciones lee la primera): es la misma regla que usa el resto del flujo para los criterios.
- Ordenar con letra cambia el orden del ROADMAP y de la evolucion para las partes de un troceo: es el fallo que se corrige (antes iban al final).

## Plan de pruebas

Criterio 1: 1 test (finish/casillasSinMarcar con `**Tras el cierre**` en negrita y con `### Criterios de aceptacion`). Criterio 2: 1 test con TASK-121a, TASK-121, TASK-1000 y TASK-999 que ordena igual con compararIds en roadmap, evolucion, board y wip, y la validacion del ID con la regex unica. Mutacion de cada uno. Correr a mano los tests de los modulos tocados.

## Lo que necesita decision de una persona

Nada abierto.
