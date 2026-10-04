# Plan — TASK-040: F3-T1 taskctl review para la ronda 2 y siguientes

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto
1. Nuevo `src/core/informe-revision.ts` puro: `veredictoDe`, `commitRevisadoDe`, `hallazgosNoCerrados`; `veredictoAprobado` se mueve ahi y se reexporta desde finish.ts (arquitectura, orquestador 9).
2. `fs/rondas.ts` localiza tambien las peticiones de la ronda N; `state-machine.ts` admite `en-revision -> en-revision` con `veredictoRondaAnterior` calculado por quien llama, y corrige los errores circulares (arquitectura).
3. `review.ts`: `resolverRango()` -> `{ desde, incremental, abiertos }`; en modo incremental no ejecuta el update de Git-Flow y comprueba `isAncestor(desde, HEAD)`; reutiliza exclusiones, clasificacion por dominio, `wx` y autocommit (arquitectura, orquestador 2).
4. Orden: modulo puro -> rondas -> guarda y errores -> review incremental -> limpieza ante fallo -> test encadenado.

## Desacuerdos entre roles, y como se resuelven
- Fuente del commit de la ronda N — arquitectura: linea `- Commit revisado (HEAD):` de la peticion (solo la escribe el CLI) / riesgos: "manda el informe" (`- Commit revisado:`) — gana arquitectura (orquestador 1) — el informe lo edita el revisor; se toma el SHA del inicio de linea y se ignora la prosa (riesgos 4 vio lineas con prosa o partidas).
- `aprobada con correcciones` abre N+1 — arquitectura: lo supone permitido, "cuestion de dominio" / riesgos: vuelve bloqueada una tarea cerrable — gana riesgos (orquestador 3) — por la politica A3 una ronda sin CRITICO ni IMPORTANTE cierra. Contradice el criterio 1, que nombra ambos veredictos.
- Update de Git-Flow en N+1 — arquitectura: no se ejecuta, la base la integra finish / riesgos: no mergear la base o restarla del delta — gana arquitectura (orquestador 2) — restar la base no lo desarrollo nadie; omitirlo elimina el riesgo 2 sin codigo nuevo.
- `ultimo_commit_revisado` — ambos roles coinciden contra el criterio 2 (arquitectura: campo muerto, solo new.ts lo pone a null; riesgos: segunda fuente de verdad) — no se escribe (orquestador 1) — el desacuerdo es con el enunciado, no entre roles: va a decision humana.

## Riesgos aceptados y que los contiene
- Ronda N+1 a medio escribir deja la tarea sin salida (`finish` bloquea por PENDIENTE y la guarda rechaza `review`) — riesgos 1 — se borran los ficheros de esa ronda escritos en esta invocacion antes de propagar el error; son nuevos con `wx` (orquestador 5).
- Commit de la ronda N no ancestro de HEAD (rebase, amend, push forzado, gc) — riesgos 4 — diff completo base..HEAD con aviso explicito en la peticion y por stderr (orquestador 1).
- Ronda fragmentada con veredictos mezclados — riesgos 3 — guarda: ninguno PENDIENTE y al menos uno `cambios-solicitados`; delta reclasificado por dominio; hallazgos no cerrados de TODOS los informes en cada peticion, con origen (arquitectura, orquestador 3 y 6).
- Tabla ausente presentada como "sin hallazgos" (ninguna ronda >=2 historica la tiene; fila de ejemplo sin borrar) — riesgos 5 — parseo tolerante por nombre de columna; "tabla ausente o ilegible, ver <ruta>" frente a "0 hallazgos abiertos"; se ignora la fila `(ej.` (arquitectura, orquestador 7).
- Vocabulario historico (`cambios solicitados` sin guion, enfasis) — riesgos 7 — normalizacion identica a `veredictoAprobado`.
- La aprobacion de Codex de la ronda anterior sigue valiendo con `revision_codex: true` — riesgos 6 — NADA lo contiene: fuera de alcance por decision del orquestador (8); queda abierto.

## Plan de pruebas
- Ronda 1 -> veredicto `cambios-solicitados` -> commit de cambios -> ronda 2: peticion con solo `<commit r1>..HEAD`, exclusiones aplicadas y hallazgos no cerrados con su informe de origen — repo Git temporal real — enunciado (criterio 5), arquitectura.
- Ronda N aprobada aborta con "ya aprobada: taskctl finish"; con PENDIENTE aborta mandando a `taskctl veredicto`; `start` en `en-revision` manda a `review` — repo real — orquestador 4, arquitectura.
- Commit de la ronda N no ancestro (amend/rebase) cae al diff completo con aviso en peticion y stderr — repo real — riesgos 4.
- Fallo de escritura a mitad de la ronda N+1 (fichero preexistente para forzar EEXIST) deja el arbol sin ficheros de esa ronda — repo real — riesgos 1.
- `informe-revision.ts`: tabla ausente, fila `(ej.`, CRLF, estados libres, veredictos sin guion y con enfasis, linea de commit con prosa — funciones puras con texto real de informes historicos — riesgos 5 y 7, arquitectura.
- Mutantes a matar: guarda que acepte `aprobada con correcciones`; eliminar el `isAncestor(desde, HEAD)`; volver a ejecutar el update en N+1; contar `corregido`/`aceptado` como abiertos; quitar la limpieza ante fallo — los tests de arriba — orquestador.

## Lo que necesita decision de una persona
### Sin cubrir
- Veredicto no reconocido (ni PENDIENTE, ni `cambios-solicitados`, ni aprobado; p. ej. otro vocabulario libre): las decisiones 3 y 4 no dicen si aborta ni con que mensaje — definirlo antes de implementar.
- Fallo del autocommit despues de escribir (riesgos 1 lo menciona): la decision 5 cubre escrituras, no explicita si la limpieza alcanza tambien a ese caso — confirmarlo en la implementacion.
### Salidas que faltaron
- ninguna. Se lanzaron 2 roles por el mayor de declarada (media) y heuristica (trivial); no hubo rol de dominio ni de pruebas, y la cuestion de dominio de `aprobada con correcciones` la resolvio el orquestador, no un rol.
### Suposiciones no verificadas
- `tareas/**` esta en los excluidos por defecto, asi que los commits de peticion/veredicto no entran en el delta — arquitectura y riesgos — mirar los defaults de `excluir_de_revision`.
- `finish` integra la base antes del merge — arquitectura — leer finish.ts y su script de Git-Flow.
- Todas las peticiones historicas son canonicas, sin colision con las escritas a mano — riesgos — revisar las de TASK-017/018/020/022/033/038.
- Las lineas con prosa o partidas de TASK-020 r3 y TASK-022 r2 estan en informes, no en peticiones — riesgos (no precisa cual) — si estan en peticiones, tomar "el SHA del inicio de linea" puede no bastar.
### Decisiones pendientes
- Aceptar que el plan reescribe dos criterios: criterio 1 (`aprobada con correcciones` NO abre N+1) y criterio 2 (no se escribe `ultimo_commit_revisado`; se embebe `<commit de la ronda N>..HEAD`) — cambiar criterios de aceptacion no lo decide ni un rol ni el orquestador.
- Dejar fuera de alcance la aprobacion obsoleta de Codex (riesgos 6) o abrir tarea propia — es un riesgo sin contencion.
- Que la ronda N+1 no integre la base (revision contra base posiblemente desactualizada hasta finish) — dificil de deshacer si `--push` ya mergeo en otras ramas.
- Aprobacion del plan entero con `taskctl approve`: este plan no autoriza implementar hasta entonces.

## Resuelto por el orquestador al aprobar (2026-10-04)

Carlos autorizo el 2026-10-03 ejecutar el backlog de la auditoria de forma
continua, con el orquestador aprobando los planes; lo de abajo se le reporta.
- Criterios 1 y 2 reinterpretados como dice el plan: no se escribe
  `ultimo_commit_revisado` (§16.3) y `aprobada con correcciones` no abre ronda
  N+1. Lo segundo aplica la politica A3 que Carlos aprobo el 2026-10-03.
- Codex con `revision_codex: true` y ronda N+1: riesgo aceptado sin contencion
  en esta tarea; se anota en el Resultado para una tarea aparte.
- Hueco 1: un veredicto no reconocido (ni PENDIENTE, ni aprobado, ni
  `cambios-solicitados`) aborta y manda a `taskctl veredicto`.
- Hueco 2: la limpieza de la ronda a medias cubre los fallos de ESCRITURA
  (antes de mover nada). Un fallo del autocommit deja los ficheros en disco con
  el mensaje de siempre de `autoCommit` («escrita pero no registrada»).
