# Plan — TASK-149c: utilidades de fs (parte c de TASK-149)

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 60 min (parte c del troceo aceptado de TASK-149)

Cada utilidad copiada en fs queda una vez, con el comportamiento mas completo de las copias:

1. Lockfiles (FS-10): una lista en sondas-deploy.ts, la mas larga (bun.lock, pdm.lock...).
2. Binarios (FS-11): una deteccion «tiene NUL», con la excepcion UTF-16, que usan evidencia-veredicto y sondas-deploy.
3. Cola (FS-12): una lectura de la cola de un fichero, con la relectura corta de ejecucion-acotada, que usa tambien fs/progreso.
4. PATH (FS-13): una busqueda de un binario en el PATH que respeta PATHEXT, para herramientas-deploy y status-line.
5. JSON con BOM (FS-14): json-claude.ts lee el JSON quitando el BOM; status-line y deteccion-tests lo usan.
6. nombreBase y DIRS_EXCLUIDOS (FS-16): un nombreBase (deteccion-app.ts) y los mensajes de evidencia nombran DIRS_EXCLUIDOS en vez de escribir la lista a mano.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- La lista de lockfiles mas larga y la deteccion de binario con UTF-16 de sondas-deploy.ts, la lectura de cola de ejecucion-acotada.ts, la busqueda en PATH de status-line.ts (con PATHEXT), json-claude.ts, nombreBase y DIRS_EXCLUIDOS de deteccion-app.ts.
- Nuevo: nada salvo exportar lo que hoy es local; cada utilidad ya existe en una de sus copias.

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Unificar copias que ya divergen elige un comportamiento: se queda el mas completo y un test fija el caso en que divergian (lockfile que faltaba, UTF-16, PATHEXT, BOM, relectura corta).

## Plan de pruebas

1 o 2 tests del caso en que divergian las copias: lockfile de la lista corta, UTF-16 con NUL que no es binario, PATHEXT en Windows (o su logica pura), BOM en los tres lectores. Mutacion de cada uno. Correr a mano los tests de deploy, status-line, progreso, evidencia y deteccion.

## Lo que necesita decision de una persona

Nada abierto.
