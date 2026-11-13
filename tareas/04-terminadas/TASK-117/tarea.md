---
id: TASK-117
titulo: "P-9: new propone la complejidad a partir de tareas parecidas ya cerradas"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-117-p-9-new-propone-la-complejidad-a-partir
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 3356552
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

La complejidad declarada no predice el coste (en ToolsaWeb alta gasta menos tokens que media) y OpenDockTrading no la declara nunca, pero decide cuantos roles de diseno se lanzan. Que new proponga la de las tareas cerradas mas parecidas. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-9)

## Criterios de aceptacion
- [x] taskctl new sin --complejidad propone la mediana de las tareas terminadas con mas etiquetas en comun, la escribe y dice de que tareas sale (test con repo temporal)
- [x] Con --complejidad explicita gana la declarada y sin tareas parecidas se queda como hoy (test)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

`taskctl new` sin `--complejidad` lee las terminadas y, si alguna con complejidad
declarada comparte etiquetas, escribe la mediana de las que comparten mas (la
inferior de las centrales si son pares) y dice de cuales sale. Logica pura en
`src/core/complejidad-similar.ts`; con `--complejidad` gana la declarada y sin
parecidas queda null.

Revision por pares, ronda 1 (general-purpose + code-quality-reviewer, sonnet):
aprobada-con-correcciones.

- IMP-1 (IMPORTANTE, aceptado): la propuesta se escribe como complejidad declarada y
  `resolverNumeroAgentes` toma el maximo entre declarada y heuristica (TASK-042, C4),
  asi que una propuesta solo puede subir el numero de roles del diseno, nunca
  bajarlo. Se acepta porque el criterio 1 pide escribirla; queda documentado en
  new.ts y senalado a Carlos para decidir si la propuesta debe tratarse distinto de
  una declarada.
- MEN-1 (MENOR, corregido): comentario de new.ts desactualizado.
- MEN-2 (MENOR, corregido): el CLI dice que con pares la mediana es la inferior.
- MEN-3 (MENOR, corregido): test de una terminada ilegible en el camino de `new`.
- Incidente del revisor: por una variable mal expandida ejecuto `taskctl new` en el
  repo real y dejo en develop el commit 7ecad66 (TASK-131 falsa), sin subir. El
  coordinador lo comprobo (un solo commit, solo TASK-131 y ROADMAP.md, en ningun
  remoto) y devolvio develop a 0ccfe63 con `git branch -f`.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T03:32:33Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T03:33:05Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T03:33:06Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T03:40:32Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T03:47:46Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T04:17:08Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T03:40:32Z | implementacion | sesion:1fb23e40-df0f-4598-9be1-751ce6506e3c | 18 | 17800 | 3327911 | 10823 | 0 | 3356552 | - | - |

## Verificacion omitida

- 2026-11-13T04:17:00Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 50 min
- Real (de la rama abierta al cierre con merge, sin pausas): 44 min
- Cierre (finish): 8 s, de 2026-11-13T04:17:00Z a 2026-11-13T04:17:08Z
