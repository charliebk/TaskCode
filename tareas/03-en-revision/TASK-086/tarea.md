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
tokens_revision: 4297192
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Las duraciones de taskctl metricas son de calendario y no descuentan pausas (un diseno de 20h 55m no dice nada). taskctl pausa ya guarda las marcas: restarlas.

## Criterios de aceptacion
- [ ] taskctl metricas calcula diseno, curso y revision restando los intervalos de pausa registrados en ## Transiciones
- [ ] Las tareas sin pausas dan la misma duracion que hoy; lo cubren tests
- [ ] La leyenda de la salida y docs/METRICAS.md explican el descuento
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T14:20:07Z | plan | automatico | persona |
| 2026-11-07T14:38:13Z | approve | automatico | automatico |
| 2026-11-07T14:38:26Z | start | automatico | persona |
| 2026-11-07T15:01:33Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T14:38:00Z | diseno | agente:a53ac3116bd79d9ad | 22 | 51019 | 385474 | 8384 | 16 | 444899 |
| 2026-11-07T15:47:05Z | revision | agente:a03c80fb085231ee7 | 74 | 126441 | 4153648 | 17029 | 7 | 4297192 |
