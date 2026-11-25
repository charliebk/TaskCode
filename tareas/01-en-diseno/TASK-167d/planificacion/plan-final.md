# Plan — TASK-167d: tendencia de hallazgos 4D en las metricas

(Modo rapido: el plan lo redacta el coordinador, sin brainstorm. Decision de
Carlos del 2026-11-25 en el plan de TASK-167: metricas por tarea —ya existe,
columna 4D de TASK-153c— y la serie entre auditorias. El formato del informe
es el de `src/core/auditoria-4d.ts`, de TASK-167c.)

## Enfoque propuesto

Duracion estimada: 50 min (de la rama abierta al cierre con merge; senales: 3 ficheros de codigo —`src/core/auditoria-4d.ts` (parser y formato de la serie), un lector en `src/fs/` y su uso en `src/commands/metricas.ts`—, 3 capas, 2 criterios)

1. `core/auditoria-4d.ts`, puro: `leerResumenAuditoria4D(texto)` lee la tabla
   de `## Resumen` (fila por D y severidad, numeros enteros) y devuelve las
   cifras o un motivo si no se puede leer (sin la seccion, sin la cabecera,
   una D que falta, una cifra que no es numero, un Total que no cuadra con la
   suma). `serieAuditorias4D` ordena por fecha y numero del dia y calcula la
   diferencia con la anterior; `formatearSerieAuditorias4D` da la seccion de
   texto. El patron del nombre se restringe a `-2`, `-3`... (nota de la
   ronda 2 de TASK-167c: hoy acepta `-0` y `02`).
2. `fs/`: lista `docs/auditoria-4d-*.md` del repo y los lee; un informe que
   no se puede leer es un aviso (nombre y motivo), no un error.
3. `metricas.ts`: en la salida por defecto, tras la tabla por tarea (que ya
   trae la columna 4D por tarea), la seccion «Auditorias 4D» por proyecto si
   hay informes; en `--json`, `auditorias4D` con la serie. Sin informes, nada
   (ni seccion vacia ni aviso).

## Reutilizacion (Regla 4D)

- `core/auditoria-4d.ts` (TASK-167c): secciones, cabeceras, D, severidades y patron del nombre; el parser vive en el mismo modulo, no en metricas.
- `DIMENSIONES_4D` de la columna 4D de metricas (TASK-153c): se comprueba si coincide con `DES_4D` y, si es el mismo hecho, uno reutiliza al otro.
- `leerRepoMetricas` y la salida por proyecto de `metricas.ts`: la serie se engancha ahi, por repo, como las demas lecturas.
- Repos temporales y helpers de los tests de metricas existentes.

## Riesgos aceptados y que los contiene

- Informes escritos a mano o por un modelo con desvios (tildes, cifras estimadas) — el parser los rechaza con motivo y metricas lo avisa; el test de la skill exige ademas la frase de las cifras contadas (nota de la ronda 2 de TASK-167c).
- Muchos informes — se leen solo los del patron, en una carpeta.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio):

- Criterio 1: 1 test de `taskctl metricas` en un repo temporal con dos informes (seccion con las cifras y la diferencia; tambien en `--json`; sin informes, sin seccion; un informe roto, aviso).
- Criterio 2: 2 tests del core (el parser acepta el ejemplo de la skill rellenado y rechaza cada desvio con su motivo; el patron acepta `-2` y rechaza `-0`, `02` y `-1`; la serie ordena y resta). Sin pesados.

## Lo que necesita decision de una persona

Resuelto (decisiones de Carlos del 2026-11-25).
