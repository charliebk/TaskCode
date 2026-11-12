---
id: TASK-110
titulo: "Progreso visible sin tokens: estado de cada fase en el terminal"
tipo: feature
sprint: 0
etiquetas: [progreso, agilidad]
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-110-progreso-visible-sin-tokens-estado-de-ca
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 2013772
tokens_implementacion: 85499422
tokens_revision: 7476796
creado: 2026-11-12
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

Mientras taskctl y sus hooks trabajan (la verificacion de finish, unos 28 min en ToolsaWeb; el freno Stop; las rondas de revision; la suite de 25 min) la persona no ve en que paso van y pregunta al agente cada pocos minutos, lo que gasta tokens. taskctl escribe el estado de la tarea en curso (fase, paso, x/N, tiempo) y la persona lo ve sin pasar por el agente.

## Criterios de aceptacion
- [x] plan, approve, start, review, finish y el freno Stop escriben en .git/taskcode/progreso.json la tarea, la fase, el paso, x/N si lo hay y el instante de inicio, y lo marcan como terminado al acabar (un test con repo temporal por comando)
- [x] taskctl estado imprime TASK-NNN · <fase> · <paso> x/N · <mm> min leyendo solo ese fichero, sin lanzar git y en menos de 200 ms (test)
- [x] taskctl estado --seguir refresca cada segundo hasta que la fase termina (test con un fichero que cambia)
- [x] El comando de verificacion recibe TASKCTL_PROGRESO con la ruta de un fichero; si escribe x/N en el, taskctl estado lo muestra (test con un script que lo escribe)
- [x] taskctl doctor ofrece instalar una status line de Claude Code que muestra taskctl estado, y solo la instala con un flag explicito (test sobre un settings.json temporal)
- [x] npm test de TaskCode muestra [x/N] mientras corre, con un reporter sin dependencias y el total de la ejecucion anterior (test del reporter)
- [x] Sin tarea en curso, taskctl estado dice que no hay nada en marcha y sale con 0 (test)
- [x] La suite completa pasa (npm test) sin debilitar ningun test

## Resultado

- **Implementado** (plan aprobado, sin trocear por decision de Carlos): fichero de progreso bajo `.git/taskcode/` y `taskctl estado` con via rapida (A), status line instalable por `taskctl doctor` en el settings.json de usuario (D), progreso en plan/approve/start (B1) y review/finish/freno Stop (B2), contador `TASKCTL_PROGRESO` del comando de verificacion (C), reporter `[x/N]` de `npm test` (E) y `estado --seguir` (F). Escribir el progreso no anade salida a ningun comando (cero tokens) ni lanza ni ensucia el arbol.
- **Paso S**: la status line se ve en la app de escritorio (pestana Code) y por Remote Control (comprobado por Carlos).
- **Decisiones de Carlos durante la tarea**: la status line usa el `taskctl` de la cache del plugin si no esta en el PATH (b9168d1); doctor no la instala si ese `taskctl` no entiende `estado` (39b27f9), visto al instalarla en la maquina real con el plugin 0.14.0.
- **Criterio 2**: «leyendo solo ese fichero» se lee como «solo ficheros de progreso bajo .git, sin lanzar git» (decision a); los 200 ms se miden dentro del proceso (decision c); la via rapida mide 143 ms de pared con el arranque de node (revisor).
- **Suite completa** en la rama (antes de la ronda 1): 2289 tests, 2285 pass, 3 fail (los tres conocidos de Windows: symlink EPERM, chmod en NTFS, CRLF), 1 skipped. Tras las correcciones: tests afectados 127/127 y `npm run test:rapido` 746/746.
- **Revision por pares, ronda 1** (code-quality-reviewer): veredicto propuesto aprobada-con-correcciones; 1 IMPORTANTE y 7 MENORES.
  - Corregidos (320d207, a40f04f): IMP-1 (tests de que `TASKCTL_PROGRESO` no se hereda; mutantes en rojo), MEN-1 (contador en la selectiva y la de documentacion de finish, ronda de review), MEN-2 (previa obsoleta), MEN-3 (claves de la status line propia), MEN-4 (README del freno y estado `en rojo`), MEN-6 (usos de `estado` y `doctor`).
  - Aceptados: MEN-5 (settings.json enlazado; no reproducible en Windows) y MEN-7 (deteccion heuristica de la cache; el caso `--plugin-dir` no es el uso de Carlos).
- **Cierre sin ronda 2: decision de Carlos (2026-11-12, modo rapido)**. El IMPORTANTE era solo un test que faltaba y los MENORES no cambian el comportamiento; el coordinador comprobo que los tests nuevos pasan (progreso-verificacion 8/8) y que el mutante de IMP-1 los pone en rojo. Por eso se registra el veredicto que propuso el revisor (aprobada-con-correcciones) y se integra el codigo posterior al revisado.
- **Pendiente fuera de la tarea**: instalar la status line definitiva cuando se publique una version con `taskctl estado` y se actualice el plugin (`taskctl doctor --instalar-status-line`).

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T11:29:28Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T11:42:16Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T11:42:39Z | start | automatico | persona | 0.14.0 |
| 2026-11-12T13:22:39Z | review | automatico | persona | 0.14.0 |
| 2026-11-12T14:04:27Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12T11:39:45Z | diseno | agente:ab7ca11850566e044,a66250991c8fd3577,a887d42ba1ff54acd,a8115eab8c21b546b | 106 | 206162 | 1749170 | 58334 | 81 | 2013772 | - | - |
| 2026-11-12T13:22:39Z | implementacion | sesion:b6ee363f-d9c2-4a11-8e6e-4c193af66eed | 184 | 96246 | 33161199 | 56207 | 8 | 33313836 | - | - |
| 2026-11-12T13:22:39Z | implementacion | agente:ac4e4cb44bad32677 | 326 | 430519 | 51602324 | 152417 | 37 | 52185586 | - | - |
| 2026-11-12T13:47:32Z | revision | agente:a180ef1502a027106 | 92 | 195192 | 7236030 | 45482 | 11 | 7476796 | 1 | - |

## Autorrevision

- code-quality-reviewer — 39b27f9

## Duracion

- Estimada: 360 min
- Real (de la rama abierta al cierre con merge, sin pausas): 142 min
- Paso de la hora: 142 min reales frente a 360 estimados
- Cierre (finish): 8 s, de 2026-11-12T14:04:19Z a 2026-11-12T14:04:27Z
