---
id: TASK-158b
titulo: "taskctl comprueba la autorrevision 4D por ronda y en los MENORES (parte b de TASK-158)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 4984955
tokens_revision: 5902864
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: [TASK-158a]
---
## Objetivo

Parte b del troceo de TASK-158 (Regla 4D preventiva en todos los procesos que crean o actualizan codigo), partes TASK-158a, TASK-158b, TASK-158c en la rama feature/task-158-regla-4d-preventiva-en-todos-los-proceso.

`review` avisa al abrir la ronda K+1 si `## Autorrevision` no trae
`- 4D ronda K — <commit>: ...`; `verificar-menores` avisa si no trae
`- 4D menores — <commit>: ...`. Avisos, no bloqueos (como el de TASK-153:
las tareas viejas no se atascan).

## Criterios de aceptacion
- [x] Las correcciones de una ronda de revision y los MENORES corregidos pasan por la misma exigencia 4D que la implementacion (autorrevision 4D por ronda y por correccion)
- [x] Un test por comando (review en ronda 2, verificar-menores) falla si deja de avisar

## Resultado

- `tieneLinea4D(body, etiqueta)` distingue la linea de la implementacion (`- 4D — `), la de cada ronda (`- 4D ronda K — `) y la de los MENORES (`- 4D menores — `); ninguna cuenta por otra (ronda 12 no es ronda 1) y la etiqueta se escapa. La linea base no cambia de comportamiento.
- `review` avisa, sin bloquear, al abrir la ronda K+1 si falta `- 4D ronda K — `; `verificar-menores` avisa, sin bloquear, si hay codigo corregido y falta `- 4D menores — `, y el CLI lo imprime por stderr. Los mensajes dan la linea exacta con el formato de revision.md.
- Tests: 2 en core, 1 en review-incremental (sin linea, con la de otra ronda, con la suya), 2 en verificar-menores (comando y CLI real) y una asercion en el caso sin codigo corregido. Mutaciones: 5 en la implementacion y 2 en la ronda 1, todas en rojo.
- test:rapido 703/703; verificacion por impacto de las rondas: 1950 y 1949 pasan, 0 fallan.
- Revision ronda 1 (sonnet): cambios-solicitados. IMP-1 (ningun test cubria la impresion del aviso por el CLI) corregido con un test sobre bin/taskctl; MEN-1 (etiqueta sin escapar) corregido; MEN-2 (mayusculas) aceptado: mismo criterio que la linea base desde TASK-153.
- Revision ronda 2 (haiku, acotada): aprobada, sin hallazgos nuevos.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T04:21:01Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T04:21:47Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T04:21:49Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T04:33:38Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T05:29:15Z | review | automatico | persona | 0.18.0 |

## Autorrevision

- code-quality-reviewer — 5782832
- 4D — 5782832: helper buscado (tieneLinea4D parametrizado, printAvisos, withRonda1 y montar reutilizados), usos buscados (avisoAutorrevision solo en review.ts; tieneLinea4D solo en su test), criterios citados, 4 tests nuevos con 5 mutaciones en rojo
- code-quality-reviewer — e075501
- 4D ronda 1 — e075501: usos buscados (printAvisos ya cubierto en otros comandos; la etiqueta solo se usa con tres literales), 2 tests nuevos (CLI y etiqueta escapada) con 2 mutaciones en rojo

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T04:33:38Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 34 | 27806 | 4944785 | 12330 | 7 | 4984955 | - | - |
| 2026-11-25T05:28:58Z | revision | agente:a0cd841bd2667d7cb | 68 | 150294 | 4203505 | 17998 | 10 | 4371865 | 1 | - |
| 2026-11-25T06:09:05Z | revision | agente:a0c40ddb4048190dc | 28 | 120275 | 1398832 | 11864 | 5 | 1530999 | 2 | - |

## Verificacion parcial

- 2026-11-25T06:09:14Z: todo el codigo que cambia la tarea (11 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
