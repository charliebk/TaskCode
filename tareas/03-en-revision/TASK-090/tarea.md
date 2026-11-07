---
id: TASK-090
titulo: "El guardian de secretos tolera excepciones solo en su fichero historico"
tipo: fix
sprint: 0
etiquetas: [seguridad, tests]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-090-el-guardian-de-secretos-tolera-excepcion
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 84782
tokens_implementacion: null
tokens_revision: 757497
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

El test sin-literales-secretos de TASK-089 tolera por valor la clave de ejemplo de Stripe en cualquier fichero, y GitHub la bloquea en commits nuevos: el plan de TASK-089 la cito entera y el push de develop fallo sin que la suite avisara. Las excepciones tienen que valer solo para los ficheros historicos ya publicados.

## Criterios de aceptacion
- [ ] La lista de excepciones son parejas exactas fichero+valor; la clave de ejemplo de Stripe copiada en cualquier otro fichero versionado pone el test en rojo con ruta y linea
- [ ] Una contraprueba del test demuestra que un valor permitido en un fichero historico sigue en rojo en otro fichero
- [ ] El test pasa sobre el arbol actual, incluidos los ficheros de TASK-066 y TASK-089 ya publicados en origin
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T21:10:36Z | plan | automatico | persona |
| 2026-11-07T21:34:23Z | approve | automatico | persona |
| 2026-11-07T21:34:24Z | start | automatico | persona |
| 2026-11-07T21:59:21Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T21:12:41Z | diseno | agente:a269401a4a2993ca0 | 8 | 23575 | 55275 | 5924 | 6 | 84782 |
| 2026-11-07T22:04:10Z | revision | agente:a2042029b290b7741 | 16 | 101489 | 648966 | 7026 | 2 | 757497 |
