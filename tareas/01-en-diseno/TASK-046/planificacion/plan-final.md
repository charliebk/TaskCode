# Plan — TASK-046: Secciones con subtitulos y criterios multilinea

**Desviacion documentada:** sin brainstorm (trivial).

## Enfoque propuesto

- `src/core/tarea-body.ts` (`extraerSecciones`): solo una cabecera de nivel 1
  o 2 cambia de seccion. Un `###` o mas profundo dentro de `## Objetivo` se
  conserva como texto del objetivo; dentro de `## Criterios de aceptacion` no
  corta la lista. `### Tras el cierre` dentro de los criterios es la
  excepcion: sus casillas van a un campo nuevo, `criteriosTrasCierre`, y no a
  `criterios` (no cuentan para cerrar; regla explicita, no un efecto
  secundario).
- `src/core/import-parser.ts`: una linea sangrada que no es un criterio y va
  justo despues de uno se une a el (como en `tarea-body.ts`), en vez de
  invalidar la entrada.

## Riesgos aceptados y que los contiene

- Cambia lo que ven `plan` y la heuristica en tareas con `###` en sus
  criterios: ahora ven los criterios reales. Es la correccion.

## Plan de pruebas

- Criterios agrupados en `### Parser` y `### CLI`: aparecen todos.
- `### Tras el cierre`: sus casillas en `criteriosTrasCierre`, no en `criterios`.
- `### Contexto` dentro del Objetivo: se conserva.
- `import` con un criterio partido en dos lineas sangradas: una entrada valida
  con el criterio completo; prosa sin sangrar sigue siendo un error.
- Tests existentes de `tarea-body`, `import`, `plan-brainstorm` y heuristica.

## Lo que necesita decision de una persona

Nada.
