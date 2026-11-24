# Plan — TASK-138: Regla 4D: duplicacion en metricas, suite y registro de puertas

Redactado por el coordinador (modo rapido: los casos A1-A6 tienen fichero y linea en docs/auditoria-4d.md; CORE2-11 en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 90 min (pasa de 60: se trocea en dos partes; troceo autorizado de antemano por Carlos para el plan de correcciones 4D)

1. A1: un solo agregador de la suite por version, en core/crecimiento-suite.ts, usado por `metricas --por-version` y por el aviso de crecimiento de doctor. Se elige la regla de metricas (la ultima linea `suite` verde por tarea) o la de doctor segun cual sea correcta para una tarea que corre la completa dos veces, y se fija con un test que da la misma cifra en las dos vistas.
2. A2 y CORE2-11: una sola `mediana` (y el maximo con ella), compartida por versiones-metricas, crecimiento-suite, la exportada de metricas.ts y `tramoDe` de evolucion.ts.
3. A3: la regex de pytest se evalua una vez en `contarTests`.
4. A4: la decision verde/rojo/omitido de una puerta (con su duracion e instante) en una funcion, usada por `anotarFinish`, el bloque de review, `anotarSuite` y verificar-lote.
5. A5: `PUERTAS_VERIFICACION` se usa en metricas (para filtrar las puertas de verificacion) o se elimina con su test tautologico.
6. A6: los textos de las tres salidas del tope de rondas (siguiente/flujo, `salidasTopeRondas`, el error de review) salen de una sola fuente; doctor lee las tareas terminadas una vez y reparte.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `suitePorVersion` y `mediana` de core/crecimiento-suite.ts; `contarTests`; `anotarPuerta` y `registro-puertas`; `salidasTopeRondas` de core/flujo.ts; `listTareasEnEstados` para doctor.
- Los tests de metricas, crecimiento-suite, evolucion, registro-puertas, flujo, review y doctor.
- Nuevo: la funcion de la decision de la puerta (verde/rojo/omitido), si no hay una que sirva.

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Unificar el agregador cambia la cifra de una de las dos vistas: se documenta cual cambia y por que en el Resultado, con el test de la tarea que corre la completa dos veces.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- A1: 1 (misma cifra en las dos vistas con una completa repetida).
- A2, A3: 1 (paridad de mediana) y los existentes de contarTests.
- A4, A5: 1 (la decision de la puerta) y quitar o reescribir el test tautologico.
- A6: 1 (los textos del tope de rondas iguales en siguiente y en review).

## Lo que necesita decision de una persona

Nada abierto.

## Troceo

### Parte a: agregador de la suite, mediana y pytest
Un solo agregador de la suite por version para metricas y doctor, una sola mediana (versiones-metricas, crecimiento-suite, metricas, evolucion) y la regex de pytest evaluada una vez.
Duracion estimada: 45 min
- [ ] metricas --por-version y el aviso de crecimiento de doctor usan el mismo agregador de suite por version, con un test de una tarea que corre la completa dos veces que da la misma cifra en las dos vistas
- [ ] Una sola funcion mediana (versiones-metricas, crecimiento-suite, metricas y tramoDe de evolucion) y la regex de pytest se evalua una vez en contarTests

### Parte b: decision de la puerta, constante muerta, textos del tope y doctor
La decision verde/rojo/omitido compartida por anotarFinish, review, anotarSuite y verificar-lote; PUERTAS_VERIFICACION usada o eliminada; textos del tope de rondas de una fuente; doctor lee las terminadas una vez.
Duracion estimada: 45 min
- [ ] anotarFinish, el bloque de review, anotarSuite y verificar-lote comparten la decision verde/rojo/omitido, y PUERTAS_VERIFICACION se usa en metricas o se elimina con su test
- [ ] Los textos de las salidas del tope de rondas (siguiente, salidasTopeRondas, error de review) salen de una sola fuente y doctor lee las terminadas una vez
