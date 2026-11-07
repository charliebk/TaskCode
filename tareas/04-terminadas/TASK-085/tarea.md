---
id: TASK-085
titulo: "Coste de implementacion registrado automaticamente"
tipo: feature
sprint: 0
etiquetas: [metricas, coste, hooks]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-085-coste-de-implementacion-registrado-autom
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1444672
tokens_implementacion: 14336319
tokens_revision: 4237789
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

En ToolsaWeb falta el coste de implementacion en 97 de 119 tareas, asi que el coste total esta infravalorado. Registrarlo sin depender de que alguien ejecute registrar-coste.

## Criterios de aceptacion
- [x] Un hook registra los tokens de implementacion de la tarea en curso de la rama actual al terminar cada turno o subagente, sin duplicar lo ya registrado
- [x] Sin tarea en curso en la rama el hook sale sin hacer nada y sin lanzar procesos pesados
- [x] taskctl metricas deja de listar como sin coste de implementacion las tareas registradas asi; lo cubren tests con repos Git temporales
- [x] npm test en verde (salvo los tres rojos conocidos de Windows)

## Resultado

**Implementacion**

- `src/hooks/registro-coste.ts` + `src/hooks/coste-turno.ts`, registrados en `Stop` y `SubagentStop` (`hooks/hooks.json`, timeout 30 s, forma exec). Guardas de la mas barata a la mas cara: `COSTE_AUTOMATICO=0`, `cwd`, `stat` de `tareas/02-en-curso`, lectura de tareas en curso y, solo entonces, el primer `git` (rama actual). Anota en `.git/coste-pendiente.jsonl` (`git rev-parse --git-path`, append-only) QUE transcripcion trabajo en la tarea: la sesion y, en `SubagentStop`, el subagente. Nunca lee transcripciones, nunca escribe `tarea.md`, sale siempre con 0 y en silencio.
- `src/core/coste-automatico.ts` (puro): ventanas en curso de `## Transiciones` (cada `start` hasta la siguiente `review`; filas de solo dia no abren ventana), filtro de lineas por `timestamp`, `gitBranch` y `cwd`, y `filasDeVolcado`, que descuenta lo ya anotado para el id (`dif:` si crecio; otra fase, junto a otros o sin desglose: no se toca; si encoge algun campo: nada).
- `src/fs/coste-automatico.ts`: el volcado. Fuentes: el libro, la sesion de `CLAUDE_CODE_SESSION_ID` (para cuando todo el ciclo cabe en un turno y el `Stop` aun no ha corrido) y los subagentes de cada sesion (`<sesion>/subagents/`). Nunca rompe a quien lo llama: un fallo deja la tarea igual y un aviso.
- `review` y `finish` (red) llaman al volcado antes de su `moveTareaFile` y vacian el libro tras su commit. El CLI de `review` imprime lo sumado.
- `sumarUsoTranscripcion` gana un filtro opcional; `idsDeFuente` lee tambien `sesion:`.
- Skills `start/SKILL.md` (ya no manda `registrar-coste --fase implementacion`, queda como respaldo) y `task-workflow/coste.md`; README del plugin.
- Tests: `test/core/coste-automatico.test.ts`, `test/hooks/registro-coste.test.ts`, `test/commands/coste-automatico.test.ts` (22; repos Git temporales, el hook como proceso real y dos ciclos completos por CLI hasta `metricas --json`). Suite completa: 2004 tests, 2001 pasan; los 3 rojos son los conocidos de Windows (symlink, `chmod`, CRLF).

**Desviaciones del plan, decididas al implementar**

- El libro guarda solo rutas, sin cifras ni offsets: la cifra la calcula el volcado con las ventanas y el `timestamp`/`gitBranch` de cada linea (las transcripciones los traen). Asi la base «por entrada en `en-curso`» que pidio la persona sale del registro de transiciones, un disparo repetido no puede duplicar y no hace falta cerrojo (cada hook añade su linea).
- El libro es `.git/coste-pendiente.jsonl`, no `.git/taskcode/...`: no nombra el producto, como el memo del freno.
- La vuelta `en-revision` -> `en-curso` no existe en el flujo: las correcciones de ronda 2 se hacen en revision y no cuentan como implementacion (riesgo aceptado en el plan).
- Ademas del libro, el volcado usa `CLAUDE_CODE_SESSION_ID`; no estaba en el plan y cubre el ciclo de un solo turno.

**Evidencia real (dogfooding)**: `review` ejecutado con el `bin/taskctl` del repo registro en esta misma tarea `sesion:aa9a2319-...` con +14336319 tokens de implementacion (casi todo lectura de cache), solo desde el `start` y en la rama de la tarea, y dejo el libro vacio.

**Revision**

- Ronda 1 (code-quality-reviewer, sonnet): sin CRITICO ni IMPORTANTE; 15 mutantes, sobreviven 2 + 1 equivalente. MEN-1: la red de `finish` no tenia test. MEN-2: el guard de campos negativos no tenia test. Se pidio `cambios-solicitados` (en automatico, `aprobada-con-correcciones` no se corrige despues).
- Correccion `891ab50` (solo tests): `cicloPorCli(true)` (review con `COSTE_AUTOMATICO=0`, finish lo suma una vez y vacia el libro) y el caso «crece el total pero baja un campo». Ronda 2 (haiku, verificacion): aprobada, los dos mutantes muertos.
- Mutante equivalente aceptado: quitar la guarda `carpetaEnCurso` no cambia el resultado (solo pierde el `stat` de ahorro).
- Incidente: el revisor de la ronda 1 lanzo por error `npm install` en el repo original y dejo `package-lock.json` con `"license": "MIT"`; se restauro con permiso de la persona.

**Sin hacer**: no hubo autorrevision antes de pedir la revision (`review` lo aviso). Observacion de la ronda 1 sin severidad: lineas del mismo `message.id` a ambos lados del limite de una ventana se cuentan en parte (borde de milisegundos).

**A vigilar**: la tabla `## Coste` de esta tarea mezcla una cabecera de 9 columnas (la escribio el plugin instalado 0.11.0) con filas de 11 (`bin/taskctl` 0.12.0); se leen bien, pero en GFM no se ven las dos celdas de mas. Viene de mezclar versiones en una misma tarea, no de este cambio.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-07T11:58:23Z | plan | automatico | persona |
| 2026-11-07T12:34:16Z | approve | automatico | persona |
| 2026-11-07T12:34:25Z | start | automatico | persona |
| 2026-11-07T13:03:17Z | review | automatico | persona | 0.12.0 |
| 2026-11-07T13:36:18Z | review | automatico | persona | 0.12.0 |
| 2026-11-07T13:59:08Z | finish | automatico | persona | 0.12.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T12:05:43Z | diseno | agente:a65224b999240bfbb,aa5ddc57d52c649a3,a199d2b1441f10c5d | 62 | 161568 | 1252929 | 30113 | 44 | 1444672 |
| 2026-11-07T13:03:17Z | implementacion | sesion:aa9a2319-7c42-41b4-86ee-0101f7ccd03a | 126 | 154281 | 14114110 | 67802 | 26 | 14336319 | - | - |
| 2026-11-07T13:16:30Z | revision | agente:a960f1bdda2957fdf | 32 | 126378 | 1701668 | 10604 | 2 | 1838682 | 1 | - |
| 2026-11-07T13:58:18Z | revision | agente:a422116fd1d3e2444 | 44 | 119695 | 2261266 | 18102 | 8 | 2399107 | 2 | - |
