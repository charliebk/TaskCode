# Plan — TASK-060: Opciones de cierre en finish: merge normal, merge request y tag

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)
Este plan NO vale hasta que una persona lo apruebe con `taskctl approve`.
Roles: complejidad declarada media, heuristica simple (1 punto: 11 criterios); se lanzaron 2, el mayor de los dos.

## Enfoque propuesto
- `finish` sigue siendo orquestador; gana dos ramas: tag (desde TypeScript, tras el script de Git-Flow) y MR (sin script de merge) — arquitectura.
- Se extiende: `core/config.ts` (clave `cierre_por_defecto`: `merge` | `merge-request`, por defecto `merge`), `commands/finish.ts` (flags `--merge-request`, `--tag <nombre>`; resultado con `tag` y `mergeRequestUrl`), `fs/git.ts` (`isValidTagName`, `tagExists`, `crearTagAnotado`, `pushTag`, `remoteUrl`, `fetchOrigin`), `skills/finish/SKILL.md` — arquitectura.
- Se crea: `core/plataforma-remota.ts` (puro, `detectarPlataforma`) y `fs/merge-request.ts` (`comprobarCli`, `abrirMergeRequest`, `estadoMergeRequest` sobre `gh`/`glab`) — arquitectura.
- Orden (arquitectura): 1 config y helpers de tag; 2 `--tag` en feature/fix con validacion previa al merge; 3 plataforma y MR con ejecutable simulado en PATH y preflight antes de subir; 4 rama MR en finish (1.er finish: push, abrir MR, anotar URL; 2.o: fetch, estado remoto, ff-pull, camino idempotente, tag); 5 skill y docs.
- El estado "MR abierto" lo da el remoto por nombre de rama; la URL en `tarea.md` es solo informativa (arquitectura; riesgos #5 coincide).

## Desacuerdos entre roles, y como se resuelven
- Donde vive "MR abierto" — arquitectura: remoto por rama, sin campo nuevo / riesgos: campo parseable o derivarlo del remoto — gana arquitectura — riesgos admite su misma opcion de derivar del remoto, y un campo nuevo obliga a tocar `Task`, `TASK_FIELD_ORDER` y validador y se desincroniza (arquitectura). Casi no es desacuerdo real.
- Commit sobre el que va el tag — arquitectura: `HEAD` tras el script, con `--merges --ancestry-path` si el pull trae mas / riesgos: calcular el merge de forma explicita y verificada, nunca `HEAD` — gana riesgos — un tag remoto es de facto irreversible (riesgos #1) y la suposicion de arquitectura no esta verificada.
- Tag en hotfix/release — arquitectura: sustituir via `--tag` en los `.sh` / riesgos: abortar con mensaje claro, sin tocar los `.sh` (que usan tambien los wrappers) — NO se decide aqui — el criterio lo deja "a decidir" y Carlos lo reservo; ver Decisiones pendientes.
- Clave nueva de config — arquitectura: anadir la 9.a clave sin mas / riesgos: un plugin antiguo sobre un repo con la clave falla en TODOS los comandos (`CLAVES_CONFIG` aborta ante claves desconocidas) — NO se decide aqui — decision de Carlos.
- Tag ya existente frente a reintento — solo riesgos (#2): distinguir "tag puesto por esta tarea sobre su merge" (se salta) de "tag ajeno" (aborta); arquitectura no lo trata. Se adopta como requisito del plan, sin contraparte.
- No hubo discrepancia en el resto (ejecutable simulado en PATH, preflight antes de subir, `execFile`): el acuerdo es parcial porque ninguno leyo los tests ni la skill actual; no es consenso solido.

## Riesgos aceptados y que los contiene
- Tag publicado sobre commit equivocado o con main sin subir — riesgos #1 — commit objetivo explicito, `ls-remote --tags` antes de subir, subir solo tras confirmar la rama destino en remoto. Verificado por riesgos: `finish` no reenvia `--push` a los scripts, asi que subir solo el tag es comportamiento nuevo y asimetrico.
- Reintento tras fallo parcial bloqueado por la validacion previa — riesgos #2 — distinguir tag propio de ajeno.
- Squash/rebase: `isAncestor` falso para siempre — riesgos #3 — estado del PR consultado a la plataforma; que cuenta como integrado, pendiente de Carlos.
- Red caida o base local divergente — riesgos #4 — tres resultados (integrado / abierto / no se pudo saber); el tercero aborta sin tocar nada.
- MR duplicado o URL perdida — riesgos #5 — buscar MR abierto de la rama antes de crear; derivar de la rama, no de `tarea.md`.
- URL de origin: scp, autoalojado, Enterprise, credenciales incrustadas — riesgos #6 — nunca volcar la URL cruda; host desconocido aborta diciendo que configurar. (Arquitectura deja "host desconocido = gitlab" a confirmar: choca con esto, sin resolver.)
- Entrada de usuario a `gh`/`glab`/`git tag`, y `.cmd` en Windows — riesgos #7 — `execFile` con array y `--`; `check-ref-format` sobre `refs/tags/<n>`.
- Puntos sin retorno (riesgos): push de tag o rama, merge del MR en la plataforma, merge local ya consumado.

## Plan de pruebas
- Sin flags, finish identico a hoy — suite existente de finish sin cambiar expectativas — criterio 1.
- Merge normal con tag, tag duplicado, nombre invalido, push del tag a remoto bare — repos Git temporales reales — criterio 11.
- Ciclo MR completo (abrir; segundo finish abierto frente a integrado; `--tag` + MR) — repos reales + `gh`/`glab` de prueba en PATH, unico doble admitido — criterio 11 (arquitectura).
- Preflight: sin CLI, sin autenticar, origin ausente o no reconocido aborta antes de subir — mismo doble — criterio 6.
- Reintento tras fallo parcial, squash/rebase simulado, red caida (estado "no se pudo saber") — repos reales — riesgos #2 #3 #4.
- Config: clave o valor mal escrito aborta — `core/config` real — criterio 9.
- Plugin sin mencion al proyecto ni rutas internas en la skill — tests existentes de contenido — CLAUDE.md del repo.

## Sin cubrir
- Seguridad de la skill frente al texto: solo el criterio; ningun rol lo trato — revisar al implementar.
- Ayuda/dispatch del CLI y documentacion de usuario — arquitectura lo supone sin cambios; verificar al implementar.
- Roles no lanzados: dominio y testing (arquitectura los cita como contrapartes). Su punto de vista queda cubierto solo por el criterio 11.
- Salidas que faltaron: ninguna de las dos lanzadas; dominio y testing no se lanzaron.

## Suposiciones no verificadas
- `rechazarFlagsDesconocidos` admite flags con valor (`--tag x`) — arquitectura — leer `cli/args.ts`.
- El merge de feature/fix es `HEAD` tras el script y el pull — arquitectura — probar con MR real.
- Subir la rama en el primer finish sin `--push` es legitimo — arquitectura — Carlos.
- `finish` corre desde la rama de la tarea y cierra en develop — riesgos — probar con un MR.
- Los dobles `gh`/`glab` en PATH funcionan en Windows nativo — riesgos — probarlo.
- Ni `fs/gitflow-runner.ts`, `fs/sincronizacion.ts`, `core/task.ts`, la skill actual ni los tests de finish fueron leidos por los roles.

## Decisiones pendientes de Carlos
1. `--tag` en hotfix/release. Opciones: (a) sustituir, flag `--tag` en `merge-{hotfix,release}-to-main.sh` (arquitectura: el script sigue siendo el unico que etiqueta); (b) abortar con mensaje claro (riesgos: no tocar los `.sh`, usados tambien por wrappers). Recomendacion que se desprende de las salidas: ninguna firme; (b) es mas barata y ampliable luego a (a), (a) evita rechazar un uso natural. Decide Carlos.
2. Primer `finish` con MR: subir la rama aunque no haya `--push`. Opciones: (a) subir siempre (el MR lo exige; arquitectura); (b) exigir `--push` y abortar sin el. Desprendido: (a) es la unica forma de abrir el MR, pero rompe la asimetria que riesgos #1 observa (hoy `finish` no sube nada sin `--push`).
3. Que cuenta como "integrado" con squash/rebase. Opciones: (a) estado `merged` del PR/MR en la plataforma, sin exigir ancestria (arquitectura y riesgos #3); (b) ancestria local, que se atasca con squash. Desprendido: (a); queda por fijar donde se pone el tag cuando no hay commit de merge (squash).
4. Clave nueva `cierre_por_defecto` frente a plugins antiguos (riesgos). Opciones: (a) aceptar el fallo en todos los comandos y exigir actualizar el plugin; (b) tolerar claves desconocidas, cambio de comportamiento de `config.ts`; (c) documentarlo y no anadir la clave aun. Sin recomendacion de las salidas: arquitectura no lo trato.
5. Host de origin desconocido: tratarlo como GitLab autoalojado (arquitectura, "a confirmar") o abortar nombrando que configurar (riesgos #6). Desprendido: abortar es lo que pide el criterio 6 para "origin no reconocido".
6. Aprobacion del plan entero con `taskctl approve`.

## Decisiones tomadas por Carlos (2026-10-06)

Resuelven las «Decisiones pendientes de Carlos» de arriba:

1. **`--tag` en hotfix/release sustituye el nombre.** Los scripts
   `merge-hotfix-to-main.sh` y `merge-release-to-main.sh` aceptan
   `--tag <nombre>` y lo usan en lugar del calculado. Sigue habiendo un solo
   tag, que pone el script en main. Feature y fix: tag desde TypeScript.
2. **`--merge-request` sube la rama siempre**, sin exigir `--push` (sin rama
   en el remoto no hay MR), y la salida lo dice. El tag sigue sin subirse
   salvo con `--push`.
3. **«Integrado» es el estado `merged` del PR/MR en la plataforma**, sea cual
   sea el metodo (merge, squash o rebase). El tag va sobre el commit que la
   plataforma da como resultado del merge, traido con fetch. Un MR cerrado sin
   mergear aborta y lo dice. Con red caida o un estado que no se pueda saber,
   aborta sin tocar nada (riesgo 4).
4. **La clave `cierre_por_defecto` se añade**, con aviso de compatibilidad en
   el CHANGELOG, igual que en la 0.5.0: todo el equipo actualiza a la vez. Es
   opcional.
5. **Host de origin desconocido: aborta** nombrando que configurar (criterio
   6). No se supone GitLab.
