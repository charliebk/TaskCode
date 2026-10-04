# Salida — brainstorm-arquitectura (ronda 1)

## Enfoque
Los grupos de criterios los detecta `extraerSecciones` en la misma pasada que
ya lee los criterios; un modulo nuevo y puro decide los frentes y genera el
texto en formato `import`; `plan.ts`, antes de lanzar el error de bloqueo,
escribe ese texto en `os.tmpdir()` y cita la ruta en el error. Sin al menos 2
frentes no hay particion: solo el error de TASK-043 mas una pista de como
agrupar.

## Piezas y limites
- `src/core/tarea-body.ts` (se extiende): `SeccionesTarea` gana
  `grupos: { titulo: string | null; criterios: string[] }[]`. Abre grupo un
  `###` que no sea «Tras el cierre» y una linea sin sangrar que sea solo
  negrita (`^\*\*(.+)\*\*\s*$`). Aqui y no en otro parser, para no duplicar
  las reglas de continuacion y de «Tras el cierre» de TASK-046.
- `src/core/particion-tarea.ts` (nuevo, puro):
  `proponerParticion(task, grupos): { frentes; markdown } | null`. Cada grupo
  con titulo que no sea «Transversal» (normalizado) es un frente:
  `### <titulo tarea> — <titulo grupo>` + `- <criterio>` sin casilla. `null`
  si hay menos de 2 frentes.
- Grupo transversal: no es frente; sus criterios se copian al final de cada
  frente. En TASK-030 quedan 7+4 y 7+4 = 11. Los criterios sueltos antes del
  primer grupo, igual que transversales.
- Sin grupos o con 1 frente: no se escribe nada; el bloqueo anade «agrupa los
  criterios bajo `###` o una linea en negrita por frente y reintenta».
- `validacion-tarea.ts`: `ResultadoValidacion` gana `demasiadoGrande` para que
  `plan.ts` no busque el texto del bloqueo.
- `plan.ts`: si `demasiadoGrande` y hay propuesta,
  `mkdtempSync(tmpdir()/taskctl-particion-<ID>-)` y `particion-<ID>.md`
  (precedente: `src/fs/sincronizacion.ts`). El error nombra la ruta y el
  comando exacto (`taskctl import <ruta> --tipo <tipo> --sprint <n>`).

## Orden de construccion
1. `grupos` en `extraerSecciones` (aditivo).
2. `particion-tarea.ts` (puro; su salida pasa por `parseImportMarkdown` sin
   entradas `ok:false`).
3. `demasiadoGrande` y regla de frentes en `validarEnunciado`.
4. Cableado en `plan.ts`.

## Alternativa descartada
- Tarea propia para «Transversal»: no entrega nada por si sola.
- Ruta fija reescribible: dos repos con el mismo ID se pisarian; `mkdtemp` ya
  es precedente.

## Desacuerdos previstos
- «Varios frentes»: por grupos de criterios (2+ no transversales), no leyendo
  el Objetivo.
- Transversales copiados en cada hija; sueltos tratados como transversales.
- Bloquear por 2 frentes con 12 o menos criterios cambia tareas ya escritas
  con grupos; lo mantiene por AC1, a medir por riesgos.

## Suposiciones no verificadas
- Las importadas nacen con Objetivo vacio: propone poner el Objetivo original
  como preambulo antes del primer `###` (el parser lo ignora); falta ver si
  basta o hay que ampliar `import`.
- Que pasa con la tarea original tras importar las hijas.
- `os.tmpdir()` siempre fuera del repo (con TMPDIR dentro, no).
- `heuristica.ts` consume `SeccionesTarea`: un campo nuevo no deberia afectar.
- TASK-030 tiene el Objetivo vacio: para el test hay que rellenarlo.
