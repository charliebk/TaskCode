# Plan — TASK-138b: decision de la puerta, constante muerta, textos del tope y doctor (parte b de TASK-138)

Redactado por el coordinador (modo rapido; el diseno esta en el plan de TASK-138, ver tareas/04-terminadas/TASK-138a/planificacion/plan-final.md).

## Enfoque propuesto

Duracion estimada: 45 min (parte b del troceo de TASK-138; senales: finish-verificacion, review, verificar-lote, registro-puertas, flujo y doctor; 2 criterios)

1. A4: `anotarVerificacion` en fs/registro-puertas.ts (instante, duracion desde el inicio y resultado omitido/verde/rojo), usada por `anotarFinish`, el bloque de review, `anotarSuite` y verificar-lote.
2. A5: `PUERTAS_VERIFICACION` no la usa nadie en src: se elimina con su test tautologico.
3. A6: los textos de las tres salidas del tope de rondas (flujo/siguiente, `salidasTopeRondas` y el error de review) salen de una sola fuente; doctor lee las tareas terminadas una vez y reparte la lectura a sus tres comprobaciones.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `anotarPuerta` (fs/registro-puertas), `salidasTopeRondas` (core/flujo), `listTareasEnEstados` (fs/task-store).
- Los tests de finish, review, verificar-lote, registro de puertas, flujo, siguiente y doctor.
- Nuevo: `anotarVerificacion` (la decision hoy copiada en cuatro sitios).

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Unificar los textos del tope puede cambiar una frase que un test o la skill review citan: se elige la redaccion de `salidasTopeRondas` como fuente y se ajustan las otras dos.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1: 1 (anotarVerificacion: omitido con memo, verde, rojo; con su duracion) y quitar el tautologico de PUERTAS_VERIFICACION.
- Criterio 2: 1 (los textos del tope iguales en siguiente y en el error de review) y la lectura unica de doctor cubierta por sus tests.

## Lo que necesita decision de una persona

Nada abierto.
