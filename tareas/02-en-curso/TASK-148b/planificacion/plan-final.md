# Plan — TASK-148b: validacion de config (parte b de TASK-148)

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 50 min (parte b del troceo aceptado de TASK-148)

1. Sugerencias (CORE1-06): los tres Levenshtein propios de config.ts pasan a `masParecida` (core/sugerencia.ts), la de las claves; con `cierre_por_defecto: mr` deja de sugerir «merge» por un umbral distinto.
2. Validadores (CORE1-07): un `enteroEnRango(donde, clave, valor, min, max)` y una `listaDeEnumerado(donde, clave, valor, validos)` sin repetidos sustituyen las cinco copias de «entero en rango» y las dos de «lista de enumerado».
3. Paridad (CORE1-08): un test falla si `CLAVES_CONFIG` y el switch de claves no coinciden (cada clave tiene su case y no hay case sin clave).
4. Ruta relativa (CORE1-10): una validacion de ruta relativa para config (dos funciones con el mismo nombre y reglas distintas con `a/../b`) y doctor-deploy-veredictos.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- masParecida (core/sugerencia.ts), describirValor (core/campos-catalogo.ts), la validacion de ruta relativa mas estricta de las tres.
- Nuevo: enteroEnRango y listaDeEnumerado, porque hoy estan escritos en linea cinco y dos veces.

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Elegir la ruta relativa mas estricta puede rechazar un valor que antes pasaba en una de las copias (`a/../b`): un test fija la regla.

## Plan de pruebas

1 test por punto: la sugerencia de masParecida para un valor de enumerado, entero fuera de rango y lista con repetido, la paridad CLAVES_CONFIG/switch, y `a/../b` en las dos rutas. Mutacion de cada uno.

## Lo que necesita decision de una persona

Nada abierto.
