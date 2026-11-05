---
id: TASK-074
titulo: "Cobertura sobre las lineas cambiadas"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: en-revision
plan_aprobado: true
rama: feature/task-074-cobertura-sobre-las-lineas-cambiadas
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 922803
tokens_implementacion: null
tokens_revision: 18313043
creado: 2026-11-03
actualizado: 2026-11-05
dependencias: [TASK-072]
---
## Objetivo

Freno 8 de brakes: una linea cambiada que ningun test ejecuta es un hallazgo, medido contra la merge base y no sobre todo el repo.

## Criterios de aceptacion
- [ ] Calculo de lineas cambiadas con git diff contra la merge base de la rama de la tarea, respetando excluir_de_revision
- [ ] Lectura de un informe lcov generado por el comando del proyecto, sin ejecutar tests por su cuenta
- [ ] taskctl review incluye en la peticion las lineas no cubiertas; umbral opcional en config.yml que convierte el hallazgo en puerta de finish
- [ ] Tests con un lcov y un diff de ejemplo

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-05T17:07:09Z | plan | automatico | persona |
| 2026-11-05T17:15:49Z | approve | automatico | automatico |
| 2026-11-05T17:15:50Z | start | automatico | persona |
| 2026-11-05T17:54:47Z | review | automatico | persona |
| 2026-11-05T18:58:41Z | review | automatico | persona |
| 2026-11-05T19:58:21Z | review | automatico | persona |
| 2026-11-05T20:53:16Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-05T17:15:36Z | diseno | agente:a6e758af87c52ec67,a27c5a90f106d2646,acf962f629a824993,a1dff1917970a1488 | 62 | 181258 | 708750 | 32733 | 47 | 922803 |
| 2026-11-05T18:23:53Z | revision | agente:a3be9170e0df89f6f | 116 | 179937 | 8073404 | 34257 | 9 | 8287714 |
| 2026-11-05T19:33:15Z | revision | agente:acc6b61581ede013b | 102 | 307390 | 6132082 | 28134 | 9 | 6467708 |
| 2026-11-05T20:23:10Z | revision | agente:a400dcc94dc9bdd15 | 64 | 256401 | 3282805 | 18351 | 2 | 3557621 |
