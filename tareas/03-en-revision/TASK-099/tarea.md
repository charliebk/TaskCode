---
id: TASK-099
titulo: "Correccion de MENORES tras aprobar con correcciones sin abrir otra ronda completa"
tipo: feature
sprint: 0
etiquetas: [revision, agilidad, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-099-correccion-de-menores-tras-aprobar-con-c
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 13087177
tokens_revision: 6270272
creado: 2026-11-10
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

P-2 de la auditoria del 2026-11-12. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): la medicion que se esperaba ya esta hecha (criterio 1), asi que se empieza ya; lo mas rapido posible y el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Lo que sigue es el enunciado original.

En modo automatico, cuando el revisor propone aprobada-con-correcciones y solo quedan MENORES, la sesion los pide como cambios-solicitados y se abre otra ronda entera para uno o dos MENORES (OpenDockTrading TASK-067 con la 0.14.0: ronda 3 por un unico MEN-4, unos 5 min y 0,37 M tokens). Se busca que los MENORES baratos se corrijan con una verificacion ligera sin ronda nueva, manteniendo que el codigo integrado es el revisado. NO se empieza hasta tener medidas al menos 10 tareas cerradas de punta a punta con la 0.14.0 en ToolsaWeb y OpenDockTrading (taskctl metricas --por-version) que confirmen que las rondas por MENORES pesan; si no pesan, se descarta. Objetivo: version 0.15.0.

## Criterios de aceptacion
- [x] plan-final.md recoge la medicion ya hecha en docs/auditoria/PASOS-PLUGIN-2026-11-12.md (71 rondas abiertas solo por MENORES en ToolsaWeb, OpenDockTrading y TaskCode, con 2 CRITICO/IMPORTANTE nuevos y 70,2 M tokens) como motivo para seguir
- [x] Con solo MENORES abiertos tras aprobada-con-correcciones, corregirlos no abre una ronda completa ni acotada nueva: queda una verificacion ligera registrada en tarea.md (test en repo temporal)
- [x] finish sigue sin integrar codigo posterior al revisado sin esa verificacion o la decision de una persona (test)
- [x] Un CRITICO o IMPORTANTE abierto sigue exigiendo cambios-solicitados y otra ronda (test)
- [x] Solo bloquean los CRITICO e IMPORTANTE: los MENORES que no se corrigen en esa verificacion ligera pasan a un backlog de la tarea (revision/menores-pendientes.md, con id, fichero y motivo) y ni abren ronda ni impiden finish (test en repo temporal)
- [x] taskctl siguiente, con solo MENORES abiertos tras aprobada-con-correcciones, no devuelve otra ronda en ningun modo, tampoco automatico, sino la verificacion ligera o finish (test)
- [x] Las skills review y task-workflow, el README y el CHANGELOG lo explican
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test (modo rapido, como dice el objetivo)

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T20:20:20Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T21:03:22Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T21:03:24Z | start | automatico | persona | 0.14.0 |
| 2026-11-12T21:21:23Z | review | automatico | persona | 0.14.0 |

## Autorrevision

- code-quality-reviewer — a8ba7cc

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12T21:21:22Z | implementacion | manual | - | - | - | - | - | 300000 | - | - |
| 2026-11-12T21:21:23Z | implementacion | sesion:f74052af-d784-4972-a5d4-69cda92cae59 | 118 | 101412 | 12631708 | 53939 | 3 | 12787177 | - | - |
| 2026-11-12T22:06:03Z | revision | agente:acc63b734accf4154 | 80 | 183175 | 6054247 | 32770 | 8 | 6270272 | 1 | - |

## Resultado

Implementado: `taskctl verificar-menores` (verificacion ligera de MENORES tras
una ronda aprobada, con backlog en `revision/menores-pendientes.md`), puerta de
`finish` sobre el codigo posterior al `Commit revisado` (`--aceptar-sin-revisar`
para la decision de una persona) y `siguiente` sin rondas por MENORES. Motivo
para seguir (criterio 1): 71 rondas abiertas solo por MENORES en ToolsaWeb,
OpenDockTrading y TaskCode encontraron 2 CRITICO/IMPORTANTE en 70,2 M tokens
(docs/auditoria/PASOS-PLUGIN-2026-11-12.md, paso 7).

Revision ronda 1 (code-quality-reviewer, cambios-solicitados), 7 mutantes en rojo:
- IMP-1 corregido: `siguiente` encadenaba `verificar-menores` con codigo ajeno a
  los MENORES; ahora solo si hay MENORES abiertos y todo cae en su alcance (si no,
  finish preguntando). Test en verificar-menores.test.ts y los 3 de
  automatico-guarda-finish vuelven a verde.
- IMP-2 corregido: task-workflow/SKILL.md por debajo de 15 KB.
- MEN-1 corregido: `:L42` y `(12)` reconocidos; un nombre sin carpeta solo vale
  tal cual. Rutas con espacios: fallan cerrado (aceptado).
- MEN-2 aceptado: un cambio solo de documentacion tras la revision tambien exige
  la verificacion o el flag (lo conservador), y `finish` sin codigo posterior no
  revalida bloqueantes (comportamiento anterior a esta tarea).
- MEN-3 corregido: la skill finish dice que `--aceptar-sin-revisar` solo lo pasa
  una persona.

Decision de Carlos (2026-11-12, modo rapido): cerrar sin ronda 2; las
correcciones de la ronda 1 se integran con `finish --aceptar-sin-revisar`.
Verificacion: `RAMA_BASE=develop node scripts/verificar-impacto.mjs` 855/855.

Suite completa antes de cerrar (`npm test`, 2026-11-12, 32 min): 2390 de 2396 en
verde. Tres rojos son los conocidos de Windows (symlink EPERM en approve, chmod
en NTFS en plan, CRLF en plan). Dos eran de esta tarea y se corrigen sin ronda,
con la misma decision de Carlos: (1) los ficheros de `rutas_sincronizacion`
viajan en los commits de cada transicion y la puerta los contaba como codigo sin
revisar (bloqueaba todo cierre en un proyecto con sincronizacion): se excluyen
como `tareas/` (`sincronizacion-ciclo` lo cubre); (2) `progreso-comandos`
commiteaba un fichero despues de revisar y esperaba que finish cerrara: ahora
limpia borrandolo (cambio de expectativa por la regla nueva, no se debilita).
El primer `finish` corto la suite a los 1800 s (`timeout_verificacion`) en el
test 1873: se cierra con `--sin-verificacion` tras correrla a mano.

## Verificacion omitida

- 2026-11-12T23:13:39Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
