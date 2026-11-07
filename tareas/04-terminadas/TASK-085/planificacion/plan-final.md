# Plan — TASK-085: Coste de implementacion registrado automaticamente

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos. Se lanzaron 2 porque la complejidad declarada (media) y la heurística (simple, 2 puntos) no coinciden y se toma la mayor.
Los desacuerdos entre roles se senalan, no se promedian. Este plan NO vale hasta que una persona lo apruebe con `taskctl approve`.)

## Enfoque
- (arquitectura) Hook nuevo `src/hooks/coste-turno.ts` (entrada) + `registro-coste-hook.ts` (decisión pura con guardas baratas → caras, como `decidirStop`), registrado en `Stop` y `SubagentStop` en `hooks/hooks.json`, timeout ≈30 s.
- (arquitectura) El hook NO escribe `tarea.md`: anota deltas y offsets en un libro local versionado `git rev-parse --git-path taskcode/coste-pendiente.json` (`src/fs/coste-pendiente.ts`).
- (arquitectura) Se vuelca a `tokens_implementacion` y `## Coste` con `consolidarPendiente` (`core/coste-registro.ts`) dentro del commit que ya hacen `review` y, como red, `finish`; núcleo de suma extraído de `registrar-coste.ts` para un solo camino.
- Orden (arquitectura): 1) extraer núcleo + `consolidarPendiente`; 2) libro; 3) hook + `hooks.json`; 4) consolidación en review/finish; 5) documentación (`coste.md`, README, `description`) sin mencionar TaskCode.

## Desacuerdos resueltos
- Línea base de la sesión — arquitectura: delta desde la primera vez que el hook ve la sesión en `en-curso` / riesgos: base cada vez que la tarea ENTRA en `en-curso` (incluida la vuelta desde `en-revision`) — gana riesgos como regla — es el modo de fallo que riesgos califica de más grave (sobrecuenta silenciosa); el mecanismo de arquitectura solo la cumple si el libro se vacía al consolidar y la vuelta a `en-curso` abre base nueva, y eso pasa a ser requisito.
- Skills que mandan registrar a mano — arquitectura: `registrar-coste --fase implementacion` "sigue sirviendo para el resto" sin tocar `start/SKILL.md` / riesgos: actualizar las skills en el mismo cambio y comprobar el id en todas las fases antes de sumarlo (`yaAnotado` es por fase, `registrar-coste.ts:213`) — gana riesgos — da un escenario concreto de doble cuenta y de aborto «no ha crecido»; el comando manual queda como respaldo documentado, no como instrucción por defecto.
- Escribir en cada turno — riesgos previó que arquitectura propondría un commit por turno y una fila por turno / arquitectura lo descarta ella misma (memo del freno, §8.3, ruido de commits) — no hay choque real: los dos rechazan escribir `tarea.md` desde el hook; se anota porque riesgos argumentó contra una posición que nadie defiende.

## Riesgos aceptados
- Lo acumulado vive solo en el clon local hasta `review`/`finish`: se pierde si la tarea se abandona o cambia de clon — arquitectura — `registrar-coste --fase implementacion` manual como respaldo.
- Concurrencia de varios `SubagentStop`/dos hooks `Stop` sobre el libro (actualización perdida) — riesgos (modo 3), arquitectura (suposición) — escritura atómica temporal + rename y cerrojo propio con reintento acotado y abandono silencioso.
- El hook bloquea o pesa: salida ≠ 0, timeout a mitad de escritura, `comando_sincronizacion` por turno — riesgos (modo 6) — salir siempre con 0, escritura atómica, sin sincronización y un interruptor de entorno al estilo de `FRENO_VERIFICACION`.
- Cadena: `registrar-coste` está en `GUARDADOS_POR_CADENA` (`cadena.ts:192`) — riesgos (modo 5) — el hook no invoca el comando (solo escribe el libro); la consolidación va dentro de `review`/`finish`, que ya pasan la cadena (no verificado).
- Distribución por marketplace: el hook corre en cada turno de todos los repos que actualicen — riesgos — guarda barata de `stat` sin tarea en curso (arquitectura) + interruptor de entorno (riesgos).

## Plan de pruebas
- Repo Git temporal con tarea en curso: tras `review` `tokens_implementacion` y `## Coste` reflejan el libro y `metricas` deja de listarla como sin coste — repo + transcripción de prueba — enunciado (criterio 3), arquitectura.
- Sin tarea en curso en la rama el hook sale con 0 sin llamar a git ni leer transcripciones — repo temporal sin `02-en-curso` — enunciado (criterio 2), arquitectura (orden de guardas).
- Sesión que ya traía diseño u otra tarea: solo cuenta el delta desde la entrada en `en-curso`, también tras volver de `en-revision` — transcripción sintética con base previa — riesgos (modo 1).
- Dos disparos repetidos o simultáneos no duplican ni pierden filas; un agente ya registrado a mano no se suma dos veces — libro real bajo `.git/` — riesgos (modos 3 y 7).
- El hook no altera la huella del freno (`huellaDelArbol`) ni deja `tarea.md` sucio — repo temporal con el freno activo — riesgos (modo 4), arquitectura (alternativa descartada).

## Sin cubrir
- Si el hilo principal (`sesion:<id>`) cuenta como implementación — los dos roles lo remiten a un rol de dominio que no se lanzó — decisión humana.
- Criterio 1 dice «registra ... al terminar cada turno»; el enfoque registra en el libro por turno y en `tarea.md` solo en `review` — decisión humana sobre si eso cumple el criterio.
- Las 97 tareas ya sin coste de ToolsaWeb: riesgos lo descarta (no atribuibles); el objetivo habla del coste total infravalorado — queda fuera salvo que la persona diga lo contrario.
- Ningún rol de pruebas ni de dominio: el plan de pruebas sale de los modos de fallo de riesgos y del enunciado, no de un rol dedicado.

## Salidas que faltaron
- ninguna

## Suposiciones no verificadas
- `Stop` trae `session_id`/`transcript_path` y `SubagentStop` trae `agent_id`/`agent_transcript_path` (quizá solo en versiones recientes) — arquitectura y riesgos — documentación de hooks + sonda como `hooks/sonda-hooks.mjs`.
- `sumarUsoTranscripcion` sirve para la transcripción principal leída desde un offset sin partir un mensaje (`porId`) — arquitectura — `core/coste-transcripcion.ts:134` con un caso partido.
- Al disparar `Stop` la transcripción puede no tener aún el último mensaje: se perdería el último turno antes de `review` — riesgos — sonda.
- `--resume` o `/compact` crean otro fichero de sesión que copia el historial y una base por sesión contaría doble — riesgos — mirar `~/.claude/projects/<proyecto>/` antes y después de reanudar.
- El libro bajo `.git/` no entra en `huellaDelArbol` y `review.ts` escribe `tarea.md` antes de su `autoCommit` (líneas 683-819) — arquitectura (lo segundo); lo primero lo exige riesgos (modo 4) sin que nadie lo haya comprobado — leer `fs/verificacion.ts:89-101` y `review.ts`.
- Las 97 tareas sin coste son las implementadas sin subagentes (`start/SKILL.md:34`) — riesgos — `taskctl metricas --json` en ToolsaWeb.

## Decisiones tomadas por la persona (2026-11-07)
- **Hilo principal: cuenta como implementación**, con base por entrada: se suma solo lo gastado desde cada vez que la tarea entra en `en-curso` (también al volver de `en-revision`). Lo anterior de la sesión (diseño, otras tareas) no cuenta.
- **Volcado en `review`/`finish`, no en cada turno.** El hook anota en `.git/taskcode/coste-pendiente.json` y el volcado a `tokens_implementacion` y `## Coste` va en el commit que ya hacen `review` y `finish`. Se acepta perder lo acumulado de tareas abandonadas o trabajadas desde otro clon. El criterio 1 se lee así: el hook *anota* en cada turno o subagente y el registro en `tarea.md` llega en la siguiente transición.
- **Las 97 tareas existentes de ToolsaWeb quedan fuera**: solo se arregla el registro hacia delante.

## Decision humana pendiente
- Aprobación del plan entero con `taskctl approve`.
