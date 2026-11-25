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
tokens_revision: null
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
- [ ] Las correcciones de una ronda de revision y los MENORES corregidos pasan por la misma exigencia 4D que la implementacion (autorrevision 4D por ronda y por correccion)
- [ ] Un test por comando (review en ronda 2, verificar-menores) falla si deja de avisar

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T04:21:01Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T04:21:47Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T04:21:49Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T04:33:38Z | review | automatico | persona | 0.18.0 |

## Autorrevision

- code-quality-reviewer — 5782832
- 4D — 5782832: helper buscado (tieneLinea4D parametrizado, printAvisos, withRonda1 y montar reutilizados), usos buscados (avisoAutorrevision solo en review.ts; tieneLinea4D solo en su test), criterios citados, 4 tests nuevos con 5 mutaciones en rojo

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T04:33:38Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 34 | 27806 | 4944785 | 12330 | 7 | 4984955 | - | - |
