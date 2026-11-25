---
id: TASK-158c
titulo: "verificar-impacto no devuelve dist/src si HEAD cambio (parte c de TASK-158)"
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
tokens_implementacion: 3490185
tokens_revision: 1883387
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: [TASK-158b]
---
## Objetivo

Parte c del troceo de TASK-158 (Regla 4D preventiva en todos los procesos que crean o actualizan codigo), partes TASK-158a, TASK-158b, TASK-158c en la rama feature/task-158-regla-4d-preventiva-en-todos-los-proceso.

Al tomar la copia se anota HEAD; al devolverla, si HEAD es otro, no se
devuelve la copia: dist/src se deja como lo dejo el checkout nuevo
(restaurado desde HEAD) y se avisa.

Troceo sin preguntar: Carlos autorizo el 2026-11-22 trocear las tareas de
mas de 1 h de las correcciones 4D sin consultarlo.

## Criterios de aceptacion
- [ ] verificar-impacto no devuelve la copia de dist/src si HEAD cambio durante la ejecucion (carrera del freno con update-fix vista en TASK-145b)

## Autorrevision

- code-quality-reviewer — cbdf37f
- 4D — cbdf37f: helper buscado (git() y el test de conDistProtegido reutilizados), usos buscados (devolver: cierre de conDistProtegido y restaurarHuerfana; conDistProtegido: verificar-impacto y perfil-tests), criterios citados, 2 tests nuevos con 4 mutaciones en rojo
- code-quality-reviewer — 515dbc0
- 4D ronda 1 — 515dbc0: usos buscados (marcador: solo lo escribe conDistProtegido y lo lee restaurarHuerfana), 1 test nuevo y 1 asercion, 2 mutaciones en rojo

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T06:36:39Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T06:37:27Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T06:37:29Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T06:43:03Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T06:58:19Z | review | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T06:43:03Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 20 | 15699 | 3466183 | 8283 | 4 | 3490185 | - | - |
| 2026-11-25T06:58:13Z | revision | agente:a4e7346483f8ae46a | 32 | 128017 | 1741266 | 14072 | 4 | 1883387 | 1 | - |
