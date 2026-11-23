# Plan — TASK-147c: fases y Marca en metricas (parte c de TASK-147)

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 30 min (parte c del troceo aceptado de TASK-147)

1. Fases (CORE2-13): `FASES_REGISTRADAS` (core/transiciones.ts) pasa a ser la lista exportada `as const` y `FaseRegistrada` se deriva de ella. `FaseMedida` (metricas.ts) desaparece: metricas usa `FaseRegistrada` y se van los casts `as FaseMedida`. `FASES_CICLO` (progreso.ts) se declara `satisfies readonly FaseRegistrada[]`, para que una fase que no existe no compile.
2. Fila a Marca (CORE2-12): `registroDe(body)` en metricas convierte las filas del registro en `{ fase, marca }` una vez; la usan `minutosPuntaAPunta` (la duracion que anota finish) y `calcularFila`. `duracionDeSegundos(s)` convierte los segundos del registro de puertas a `Duracion` para `puertaDeFila` y la sincronizacion.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- FaseRegistrada, FASES y leerTransiciones (core/transiciones.ts); instanteDe y precisionDeFecha; marcasDe y duracionSinPausas (metricas.ts).
- Nuevo: registroDe y duracionDeSegundos, porque hoy cada conversion esta escrita dos veces y no hay helper.

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Ninguno de comportamiento: es una refactorizacion; los tests de metricas, evolucion y progreso existentes fijan las cifras.

## Plan de pruebas

1 test: `minutosPuntaAPunta(body)` y `calcularFila` dan la misma duracion de punta a punta para el mismo registro con una pausa, y una fase desconocida en el registro no entra en ninguno. Mutacion de cada conversion. Correr a mano los tests de metricas, evolucion, progreso, transiciones y finish.

## Lo que necesita decision de una persona

Nada abierto.
