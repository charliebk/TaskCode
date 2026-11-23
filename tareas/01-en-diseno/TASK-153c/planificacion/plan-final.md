# Plan — TASK-153c: metricas de hallazgos 4D

Redactado por el coordinador (modo rapido; parte c del troceo de TASK-153).

## Enfoque propuesto

Duracion estimada: 45 min (2 ficheros de codigo: informe-revision.ts y metricas.ts; 1 criterio)

1. `core/informe-revision.ts`: se separa de `faltasRegla4D` el lector de la seccion (`valoresRegla4D`, una sola regla de etiquetas sin tildes ni enfasis) y se anade `idsRegla4D(informe)`: por cada D, los ID de hallazgo de su linea (`IMP-2, MEN-1`); null si el informe no tiene la seccion.
2. `core/metricas.ts`: `FilaMetricas.hallazgos4D` = ID distintos por D en todos los informes de la tarea (por revisor + ID, como los hallazgos); null si ningun informe trae la seccion (sin dato, nunca 0). Columna `4d` en la tabla con `dup/desv/dil/disf` o «—».

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `rangoDeSeccion`, `normalizarCelda`, `DIMENSIONES_4D` y el lector de `faltasRegla4D` (se extrae, no se copia); `celdaConteo`/el patron de `COLUMNAS_METRICAS`; los informes que metricas ya lee (`InformeLeido.texto`); la fabrica de tareas de test/helpers/tarea-ejemplo.ts.
- Nuevo: solo `idsRegla4D` y la columna.

## Riesgos aceptados y que los contiene

- Informes anteriores a TASK-137 no traen la seccion: salen «—», no cero.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo): 2. Puro: idsRegla4D con cumple, IDs varios, tildes/enfasis y sin seccion. Metricas: una tarea con dos informes (IDs repetidos entre rondas cuentan una vez por revisor) da la cuenta por D y una sin seccion da «—». Mutacion de cada uno.

## Lo que necesita decision de una persona

Nada abierto.
