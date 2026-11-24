# Plan — TASK-146b: registrar-coste, readdir, fecha y cabeceras (parte b de TASK-146)

Redactado por el coordinador (modo rapido; el diseno esta en el plan de TASK-146, ver tareas/04-terminadas/TASK-146a/planificacion/plan-final.md).

## Enfoque propuesto

Duracion estimada: 45 min (parte b del troceo de TASK-146; senales: registrar-coste, metricas, plan, doctor-deploy, veredicto y review; 2 criterios)

1. CMD2-12: registrar-coste suma y pone a cero con `CAMPOS_COSTE` (una funcion para la fila de `## Coste` y una para el cero), sin campos escritos a mano.
2. CMD2-13: el `readdir` tolerante de metricas, plan y registrar-coste en un helper de fs; `claveRuta` solo en fs/cobertura (exportada).
3. CMD1-08: doctor-deploy usa `diaLocal` (documento-estado) en vez de su `fechaLocal`; la fecha de `creado` sigue la misma regla que new.
4. CMD2-15 y CMD2-16: cabeceras de registrar-coste, veredicto y review fieles al codigo; la historia de rondas dentro de `runPlan` se recorta a lo que explica el codigo actual (la historia queda en git y en el CHANGELOG).

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `CAMPOS_COSTE` (registrar-coste), `claveRuta` (fs/cobertura), `diaLocal` (documento-estado), la fecha de new.
- Los tests de registrar-coste, metricas, plan y doctor-deploy.
- Nuevo: el helper de readdir tolerante (hoy copiado tres veces).

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Recortar comentarios de runPlan puede quitar contexto util: solo se quita la historia de rondas, no la explicacion de por que el codigo es asi.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1: 1 a 2 (un campo de coste suma por CAMPOS_COSTE; creado igual en new y doctor-deploy cerca de medianoche, o paridad de la funcion de fecha).
- Criterio 2: 0 (comentarios).

## Lo que necesita decision de una persona

Nada abierto.
