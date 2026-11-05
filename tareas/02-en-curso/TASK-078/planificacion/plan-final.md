# Plan — TASK-078: Hook que impide leer y editar los held-out de la tarea en curso

(Lo consolida el agente unificador a partir de 2 roles de brainstorm lanzados en paralelo: arquitectura, riesgos.
Son 2 porque la complejidad declarada (media) no coincide con la heurística (simple) y se toma el mayor. Los desacuerdos se señalan, no se promedian.)

## Enfoque propuesto
- (arquitectura) Funciones puras `idsEnRuta`/`idsEnTexto` en `src/core/heldout.ts` → guardián `src/hooks/guardia-heldout.ts` (`decidirHeldout`, sin enganchar).
- (arquitectura) Entrada nueva `src/hooks/pre-tool-lectura.ts` + 2.º objeto `PreToolUse` en `hooks/hooks.json` con el matcher literal del criterio 1; filtro barato `/aceptacion/i` antes de cargar nada.
- (arquitectura) Despacho `/aceptacion/i` añadido a `pre-tool-merge.ts` sin tocar la ruta de merge; texto de shell casado en crudo normalizado, NO con `segmentar()` (trata `\` como escape).
- Orden: puras → guardián → entrada de lectura → shell → smoke `claude -p --plugin-dir`. La regla de qué tarea está protegida queda pendiente de la decisión 1.

## Desacuerdos entre roles, y como se resuelven
- Qué decide «held-out protegido» — arquitectura: `task.rama == currentBranch` (criterio 3) / riesgos: estado de la tarea (en curso o en revisión), porque `git switch develop` + Read esquiva el hook — SIN RESOLVER: decisión humana 1.
- Fuente de `tarea.md` — arquitectura: `readTareaFile` del árbol de trabajo / riesgos: nunca del árbol (el agente edita `rama:` o mueve la carpeta y apaga el hook; `tarea.md` es la hermana que el criterio 1 permite) — gana riesgos — arquitectura no trata ese ataque; mecanismo (ID desde el nombre de rama o `git show <rama_base>:`) según la decisión 1.
- Cómo se casa una ruta — arquitectura: `path.relative(raiz)` y casar `tareas/*/TASK-NNN/aceptacion` / riesgos: secuencia de segmentos en cualquier punto de la ruta absoluta, sin mayúsculas — gana riesgos — `/c/Users/…` de git-bash o rutas fuera de la raíz salen de `relative` con `..` y no casarían; es superconjunto del criterio 4.
- HEAD desacoplado (rebase, bisect) — arquitectura: dejar pasar, como freno-stop / riesgos: leer `.git/rebase-merge/head-name` o tratarlo como desconocido — gana riesgos en lo desacoplado — dejar pasar abre el hook justo al resolver conflictos; arquitectura gana para errores de `git`/`tarea.md` ilegible (riesgos coincide: dejar pasar hasta saber que aplica).
- Remedios de `finish` bloqueados — solo riesgos lo trae (`finish-heldout.ts:86-93` y 176-177 piden comandos que el guardián de shell bloquea: bucle en modo automático); arquitectura no lo ve — SIN RESOLVER: decisión humana 2.

## Riesgos aceptados y que los contiene
- (riesgos, con sus palabras) Cierre falso por Grep sobre la raíz: la fuga más probable, sin intención e invisible; ningún criterio la cubre — NO está resuelta; se declara en la skill de flujo; el cierre real de la edición es la huella de TASK-073.
- Rutas relativas al cwd del shell (`cd …/TASK-078 && cat aceptacion/x`), MCP de índice fuera del matcher, `git cat-file -p <sha>`, `` acep`tacion ``, `'acep'+'tacion'` — riesgos y arquitectura (no emular `cd`) — el texto de shell es un badén, no un cierre, y se escribe así.
- Que ningún Read funcione en ningún proyecto — riesgos — dejar pasar ante cualquier fallo antes de saber que la ruta es held-out; vuelta atrás: quitar la entrada de `hooks.json` o `/plugin disable`.
- El guardián de merges deja de ejecutarse al tocar el despacho de `pre-tool-merge.ts` — riesgos — test de que `git merge` sigue saliendo 2.
- Un held-out leído no se deshace (queda en contexto y transcript) — riesgos — solo lo arregla que la persona los reescriba.
- `node` lanzado en cada Read/Grep/Glob de proyectos ajenos; sin `node` en el PATH, error no bloqueante — riesgos — filtro `/aceptacion/i` sin `import`.

## Plan de pruebas
- Criterio 1: exit 2 ante `tareas/*/TASK-NNN/aceptacion/x`, 0 ante `tarea.md` y `aceptacionX/`, por cada `tool_name` y su campo — stdin contra el dist + repo temporal — arquitectura.
- Criterio 3 (propuesta del unificador, a petición): mismo repo temporal con tarea y su rama; con HEAD en `develop` el JSON de Read y `cat` salen 0, tras `git switch` a la rama de la tarea salen 2. Si la decisión 1 elige «por estado», este test cambia de signo y el criterio 3 se reescribe.
- Criterio 4 (propuesta del unificador, a petición): tabla por stdin con `TAREAS\01-En-Curso\TASK-001\Aceptacion\x`, `./tareas/../tareas/…`, relativa con `cwd` dentro de la tarea, absoluta `C:\…` y `/c/…` → 2; hermanas → 0. Agent/Task: test que parsea `hooks/hooks.json`, parte cada matcher por `|` y asserta que ninguno contiene `Agent` ni `Task` y que el de lectura es exactamente el conjunto del criterio 1.
- Criterio 2 y no regresión: `cat`, `Get-Content`, `git show rama:ruta` → 2; `git merge` sigue en 2 — stdin contra `pre-tool-merge.js` del dist — arquitectura y riesgos.
- Smoke `claude -p --plugin-dir` por cada herramienta, con el exit 2 visible — real — riesgos (exit 0 silencioso por campo equivocado) y arquitectura (paso 5).
- HEAD desacoplado durante un rebase de la rama de la tarea → 2 — repo temporal — riesgos.

## Sin cubrir
- No se lanzó el rol de testing (arquitectura lo anticipa como interlocutor): el despacho doble en un proceso solo lo valida arquitectura; lo suple la revisión por pares.
- No se lanzó ningún rol de dominio/flujo: el impacto en la persona (ramas antiguas que vuelven a bloquear) solo lo ve riesgos.
- Salidas que faltaron: ninguna; llegaron las dos y discrepan, que es lo esperado.

## Suposiciones no verificadas
- Campos `file_path`/`notebook_path`/`path`/`pattern`/`glob` y que `MultiEdit` existe — arquitectura y riesgos — ampliar `hooks/sonda-hooks.mjs` o la referencia.
- `currentBranch` lanza con HEAD desacoplado o fuera de repo — arquitectura — probarlo en repo temporal.
- `aceptacion/` se mueve con `tarea.md` (`moveTareaFile`) y dos `PreToolUse` sin solape funcionan — arquitectura — test y smoke.
- `start` deja la tarea «en curso» también en `develop` (sostiene la opción «por estado») — riesgos — leer `start`.
- `realpathSync.native` expande los nombres 8.3 — riesgos — probar en Windows.

## Lo que necesita decision de una persona
Decidido por la persona el 2026-11-05:
- 1. **Por la rama actual** (opción A, criterio 3 tal cual). Mecanismo sin leer `tarea.md` del árbol de trabajo: el ID de la tarea protegida se saca del nombre de la rama actual (`<tipo>/task-NNN-…`, o de `.git/rebase-merge/head-name` con HEAD desacoplado en un rebase) y se compara con el ID que casa en la ruta o el texto. La esquiva `git switch develop` + Read + volver se declara como **riesgo aceptado** en la skill de flujo, junto a la fuga por Grep en la raíz: el hook es contra despistes, no un cierre.
- 2. **El remedio de `finish` lo ejecuta la persona fuera de Claude** (opción A). Se cambian los mensajes de `src/commands/finish-heldout.ts` (86-93 y 176-177) para decirlo, y el modo automático para ahí en vez de reintentar. Sin excepción en el guardián. Test: el mensaje de `finish` lo dice, y esos comandos de remedio salen 2 en el guardián de shell.
- 3. **Sin interruptor en esta tarea**: queda como seguimiento (variable de entorno del proceso de Claude, nunca clave editable). En una rama antigua basta salir de ella o `/plugin disable`.
- 4. Aprobación del plan entero con `taskctl approve`: pendiente.
