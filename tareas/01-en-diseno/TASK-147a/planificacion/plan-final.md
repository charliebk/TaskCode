# Plan — TASK-147: Regla 4D: lectores de secciones e IDs en core

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 60 min (parte a del troceo; la tarea entera estimaba 60 min)

Cada seccion de tarea.md y cada ID de tarea se leen con un solo lector:

1. Secciones (parte a): `rangoDeSeccion`/`contenidoDeSeccion` (core/transiciones.ts) para leer, y un helper nuevo `anadirSeccionAlFinal(body, titulo, contenido)` para crear la seccion al final (hoy copiado 7 veces: cierre, coste-registro, duracion-estimada, transiciones, plataforma-remota, troceo). Lo usan duracion-estimada (CORE1-01), menores y rondas-extra (CORE2-02), plataforma-remota y troceo (CORE2-06).
2. Criterios e IDs (parte b): `casillasSinMarcar` sobre `extraerSecciones` (CORE2-04); `normalizarTexto` en validacion-tarea e informe-revision (CORE2-05); `citar` una vez (CORE2-07); una regex de ID y un lector de numero con letra para task-store, wip-scan, roadmap, trocear, evolucion, flujo/troceo (CORE2-01, CORE2-14, FS-04, CMD2-08).
3. Metricas (parte c): `FaseMedida` = `FaseRegistrada` y la conversion fila a Marca una vez (CORE2-12, CORE2-13).

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- rangoDeSeccion, contenidoDeSeccion, dentroDeBloque (core/transiciones.ts); extraerSecciones y normalizarTexto (core/tarea-body.ts); isValidTaskId (core/task.ts) y taskIdSortKey (core/board-format.ts, el unico que ya lee la letra); FaseRegistrada (core/transiciones.ts).
- Nuevo: anadirSeccionAlFinal, porque no existe ninguno y hay siete copias.

## Troceo

### Parte a: secciones con un solo lector y un solo «crear al final»
Duracion, verificacion ligera, rondas extra, URL de merge request y troceo leen con rangoDeSeccion y crean la seccion con un helper comun (CORE1-01, CORE1-02, CORE2-02, CORE2-06).
Duracion estimada: 60 min
- [ ] duracion, verificacion ligera, rondas extra, URL de merge request y troceo leen y escriben secciones con rangoDeSeccion y un helper comun para crear la seccion al final; un test con el encabezado dentro de un bloque de codigo lo distingue

### Parte b: criterios, normalizacion, citar e IDs
casillasSinMarcar, normalizar, citar y el ID de tarea con un solo lector (CORE2-04, CORE2-05, CORE2-07, CORE2-01, CORE2-14, FS-04, CMD2-08).
Duracion estimada: 60 min
- [ ] casillasSinMarcar usa extraerSecciones (Tras el cierre en negrita y ### Criterios) y validacion-tarea usa normalizarTexto; citar() existe una vez
- [ ] El ID de tarea se valida y se ordena con una sola regex y un solo lector de numero con letra (task-store, wip-scan, roadmap, trocear, evolucion, flujo); un test con TASK-121a y TASK-1000 ordena igual en roadmap, evolucion, board y wip

### Parte c: fases y Marca en metricas
Un solo tipo de fase y una sola conversion de fila a Marca (CORE2-12, CORE2-13).
Duracion estimada: 30 min
- [ ] FaseMedida y FaseRegistrada son un solo tipo y fila a Marca se convierte una vez en metricas

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Cambiar el lector de primera aparicion a ultima (rangoDeSeccion) cambia que seccion se lee si hay dos: es justo la incoherencia que se corrige (escritura y lectura con la misma regla).

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio): 1 o 2 por criterio, con el encabezado dentro de un bloque de codigo, IDs TASK-121a y TASK-1000, y un tipo de fase unico. Mutacion de cada uno. Ademas, correr a mano los tests de los modulos tocados y la suite completa antes de publicar (la selectiva recorta a 10 tests).

## Lo que necesita decision de una persona

Nada abierto.

## Troceo aceptado

Troceo aceptado por una persona el 2026-11-23: TASK-147a, TASK-147b, TASK-147c, todas en la misma rama. Este plan es el de TASK-147a; las demas partes se planifican al empezarlas.
