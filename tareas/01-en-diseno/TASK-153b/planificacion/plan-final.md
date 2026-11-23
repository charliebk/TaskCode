# Plan — TASK-153b: candidatos 4D en la peticion de revision

Redactado por el coordinador (modo rapido; parte b del troceo de TASK-153, enfoque ya fijado en el plan de la tarea).

## Enfoque propuesto

Duracion estimada: 60 min (1 modulo puro nuevo, review.ts, 1 helper de git, revision.md; 2 criterios)

1. `core/candidatos-4d.ts` (puro): `definicionesNuevas(diff)` lee las lineas anadidas de un diff unificado y saca funciones, clases, constantes-funcion (TS/JS, Rust, Python, Java/C#/Kotlin, bash); `definicionesDeGrep(salida)` las de `git grep`; `nombresParecidos` (igual sin mayusculas ni separadores, o distancia de `distanciaEdicion` pequena); `testsQuePrometen(diffTests)` (nombres con «sin efectos», «nunca», «ordena», «antes de», «intacto»...); `seccionCandidatos4D` con topes (15 definiciones, 3 parecidos cada una, 15 tests) y la linea «Sin candidatos» si no hay nada.
2. `fs/git.ts`: `definicionesEnRef(ref, cwd)` = un `git grep -n -I -E` de definiciones en la rama base (lo que YA existia antes de la tarea).
3. `review.ts`: calcula los candidatos una vez por ronda (diff de codigo ya calculado + diff de los tests con `diffRangeForPaths`) y los pasa a `peticionTemplate` con el mismo patron que `seccionCobertura`. Nunca aborta: si git falla, la seccion dice que no se pudieron calcular.
4. `revision.md`: una linea que pide comprobar los candidatos 4D y mutar los tests que lista.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `distanciaEdicion` (core/sugerencia.ts) para los nombres parecidos; `diffRangeForPaths` (fs/git.ts, por lotes) para el diff de los tests; `runGit` para el grep; el patron `extras.seccionCobertura` de `peticionTemplate`; `withTempRepo`/`escribirFichero` de test/helpers/review-fixtures.ts para el test de integracion.
- Nuevo: `core/candidatos-4d.ts`; no hay ningun lector de definiciones en el repo que extender (buscado: «function.*def», «definicion», «grep -n» en src).

## Riesgos aceptados y que los contiene

- Falsos positivos por nombre parecido: la seccion dice que son pistas, no hallazgos; topes para no inflar la peticion.
- Regex de definiciones incompletas en lenguajes raros: sin candidatos, nunca falla.
- Coste: un `git grep` por ronda; acotado y sin red.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):
- Criterio 1: 2. Puro: definiciones de un diff TS/Rust/Python/bash y cruce con existentes (igual, parecido, no parecido, misma definicion no se cuenta). Integracion: `taskctl review` en repo temporal real con un helper `leerSeccionX` que ya existia y la tarea anade `leerSeccionY`: la peticion lo lista.
- Criterio 2: 1. Puro: tests con nombre que promete aparecen y los demas no; diff sin candidatos da la linea «Sin candidatos».
Cada test nuevo se comprueba por mutacion.

## Lo que necesita decision de una persona

Nada abierto.
