# Plan — TASK-146: Regla 4D: duplicacion en new, import, roadmap, verificar-lote y registrar-coste

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 55 min (parte a del troceo; la tarea entera estimaba 100 min)

Cada comando suelto deja su reimplementacion y usa el helper que ya existe. Cambian comportamientos que hoy son fallos (lote verde sin commit, EACCES como «sin pendientes», `NaN` con un campo de coste nuevo, `creado` en UTC frente a hora local): cada uno lleva su test.

1. CMD2-06: `import` valida y compone la tarea con lo mismo que `new` (`componerCuerpo`, defaults, propuesta de complejidad); el modelo por defecto (`'sonnet'`, hoy tres veces) en una constante, tambien para doctor-deploy-tareas.
2. CMD2-07: `roadmap --comparar` decide con `prepararRoadmap` (mayusculas, cambios sin commitear) en vez de sus reglas propias.
3. CMD2-10 y CMD2-11: verificar-lote usa `headCommit` y `listTareasEnEstados`; un fallo de git o de readdir aborta en vez de dar un lote verde.
4. CMD2-12: registrar-coste suma con `CAMPOS_COSTE`.
5. CMD2-13: el `readdir` tolerante (metricas, plan, registrar-coste) en un helper, y `claveRuta` solo en fs/cobertura.
6. CMD1-08: doctor-deploy usa `diaLocal` (documento-estado) y la fecha de `creado` es la misma en new y en doctor-deploy.
7. CMD2-15 y CMD2-16: cabeceras de registrar-coste, veredicto y review fieles al codigo; la historia de las rondas de `runPlan` va al CHANGELOG, no al codigo.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `componerCuerpo` y los defaults de new.ts; `prepararRoadmap` (fs/roadmap.ts); `headCommit` (fs/git.ts); `listTareasEnEstados` (fs/task-store.ts); `CAMPOS_COSTE`; `claveRuta` (fs/cobertura.ts); `diaLocal` (documento-estado).
- Los tests de new, import, roadmap, verificar-lote, registrar-coste y doctor-deploy, con sus fixtures.
- Nuevo: la constante del modelo por defecto y un helper de `readdir` tolerante (hoy copiado tres veces).

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Que import componga como new puede cambiar el cuerpo de una tarea importada: los tests de import comparan el resultado, y el cambio va en la direccion de new (la referencia).
- Cambiar la fecha de `creado` a una sola regla: se elige la de new (la referencia) y se comprueba con un instante cerca de medianoche.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- import como new: 1 a 2 (cuerpo compuesto y complejidad propuesta).
- roadmap y verificar-lote: 2 a 3 (comparar con mayusculas o sin commitear; fallo de git; readdir con EACCES).
- registrar-coste, readdir y fecha: 2 (un campo de coste nuevo suma; creado igual cerca de medianoche).
- Cabeceras: 0.

## Lo que necesita decision de una persona

Nada abierto.

## Troceo

### Parte a: import, roadmap y verificar-lote
import compone como new con el modelo por defecto en un sitio; roadmap --comparar decide con prepararRoadmap; verificar-lote usa headCommit y listTareasEnEstados y no da un lote verde con un fallo.
Duracion estimada: 55 min
- [ ] import valida y compone la tarea con lo mismo que new (componerCuerpo, defaults, propuesta de complejidad), y el modelo por defecto esta en un solo sitio
- [ ] roadmap --comparar decide con prepararRoadmap, y verificar-lote usa headCommit y listTareasEnEstados sin dar un lote verde ante un fallo de git o de readdir

### Parte b: registrar-coste, readdir, fecha y cabeceras
registrar-coste suma con CAMPOS_COSTE, un helper de readdir tolerante y claveRuta en un sitio, diaLocal en doctor-deploy y creado con la regla de new, cabeceras fieles y la historia de runPlan fuera del codigo.
Duracion estimada: 45 min
- [ ] registrar-coste suma con CAMPOS_COSTE, los readdir tolerantes y claveRuta tienen un solo helper, y doctor-deploy usa diaLocal con la fecha de creado igual que new
- [ ] Las cabeceras de registrar-coste, veredicto y review describen lo que hace el codigo, y runPlan deja la historia de las rondas en el CHANGELOG

## Troceo aceptado

Troceo aceptado por una persona el 2026-11-24: TASK-146a, TASK-146b, todas en la misma rama. Este plan es el de TASK-146a; las demas partes se planifican al empezarlas.
