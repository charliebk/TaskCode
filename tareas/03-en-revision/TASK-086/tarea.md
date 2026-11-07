---
id: TASK-086
titulo: "Descontar las pausas de las duraciones de las metricas"
tipo: feature
sprint: 0
etiquetas: [metricas]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-086-descontar-las-pausas-de-las-duraciones-d
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 444899
tokens_implementacion: null
tokens_revision: 5038436
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Las duraciones de taskctl metricas son de calendario y no descuentan pausas (un diseno de 20h 55m no dice nada). taskctl pausa ya guarda las marcas: restarlas.

## Criterios de aceptacion
- [x] taskctl metricas calcula diseno, curso y revision restando los intervalos de pausa registrados en ## Transiciones
- [x] Las tareas sin pausas dan la misma duracion que hoy; lo cubren tests
- [x] La leyenda de la salida y docs/METRICAS.md explican el descuento
- [x] npm test en verde (salvo los tres rojos conocidos de Windows)

## Resultado

**Implementacion**

- `src/core/metricas.ts`: `Marcas` gana `intervalosPausa`. Cada racha de filas `pausa` seguidas va de la primera de la racha a la siguiente fila que no sea `pausa`; una racha sin fila detras no da intervalo. `duracionSinPausas` y `pausaEntre` restan la parte de cada intervalo que cae dentro de la fase. Se aplica a `diseno`, `curso`, `revision` y `total` (que sigue siendo la suma de las tres). Con precision de dia no se descuenta nada. Campo nuevo `enPausa` en `FilaMetricas`.
- `--json` gana la clave `pausas` (siempre presente): una entrada por tarea con alguna fila `pausa`, con `proyecto`, `id`, `pausas` y `enPausa`.
- Leyenda `NOTA_CALENDARIO`, README del plugin y `docs/METRICAS.md` §14 (Duraciones de fase y pausas).
- Tests: 8 casos nuevos en `test/core/metricas.test.ts` (rachas, varias fases, pausa abierta, sin pausas igual que antes, precision de dia, origen git, cruce de fases, empate de segundo con git) y uno de punta a punta en `test/commands/metricas.test.ts` con un `taskctl pausa` real. Suite completa (ronda 1 del revisor, sobre 8c8b585): 2011 tests, 2008 pasan; los 3 rojos son los conocidos de Windows (symlink, `chmod`, CRLF).

**Decisiones de la persona (en plan)**: la pausa se cierra con la siguiente transicion y se resta; `total` tambien descuenta (cambia `minutosPlanAFinish` de `--evolucion`); precision de dia sin descuento; `enPausa` en `--json`.

**Desviacion del plan**: el plan decia que `enPausa` saldria en las filas de `--json`, pero `--json` no tiene filas por tarea. Se expone en la lista nueva `pausas`; el revisor de la ronda 1 lo dio por bueno.

**Revision**

- Ronda 1 (code-quality-reviewer, sonnet): sin CRITICO ni IMPORTANTE. 11 mutantes, todos detectados salvo uno equivalente (cerrar una racha abierta con su propia marca mide 0). MEN-1: con origen git, una pausa y la transicion siguiente en el mismo segundo quedaban en orden inverso tras el sort estable y se descontaba de mas. MEN-2: la doc decia que `enPausa` 0 era «sin pausas cerradas», pero tambien sale 0 si la pausa cae fuera de lo medido. Se pidio `cambios-solicitados` (en automatico, `aprobada-con-correcciones` no se corrige despues).
- Correccion 4c1e0e7: el log de git se invierte antes de ordenar (test nuevo, comprobado contra el mutante) y la frase de `enPausa` matizada. Ronda 2 (sonnet, acotada): aprobada, sin hallazgos nuevos.

**A vigilar**: la regla supone que entre la pausa y la transicion siguiente no se trabaja; si alguien rehace el plan tras decir «no», ese trabajo tambien se descuenta (dicho en la §14). Pendiente heredado, ajeno a esta tarea: `git log --all` ordena por fecha de commit y `%at` es la de autor.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T14:20:07Z | plan | automatico | persona |
| 2026-11-07T14:38:13Z | approve | automatico | automatico |
| 2026-11-07T14:38:26Z | start | automatico | persona |
| 2026-11-07T15:01:33Z | review | automatico | persona |
| 2026-11-07T15:50:56Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T14:38:00Z | diseno | agente:a53ac3116bd79d9ad | 22 | 51019 | 385474 | 8384 | 16 | 444899 |
| 2026-11-07T15:47:05Z | revision | agente:a03c80fb085231ee7 | 74 | 126441 | 4153648 | 17029 | 7 | 4297192 |
| 2026-11-07T15:55:25Z | revision | agente:acddc6be9083d5aed | 16 | 57061 | 680592 | 3575 | 3 | 741244 |
