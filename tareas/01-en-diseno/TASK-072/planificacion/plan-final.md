# Plan — TASK-072: Puerta de verificacion en finish y merge guard

(Lo consolida el agente unificador a partir de 2 roles de brainstorm lanzados en paralelo: arquitectura, riesgos. Los desacuerdos se senalan, no se promedian. NO vale hasta que una persona lo apruebe con `taskctl approve`.)

## Enfoque
1. `src/fs/verificacion.ts` se extiende con `verificarConMemo`, `huellaDeCommit` y `timeoutEfectivoS`; `freno-stop.ts` pasa a usarlos sin cambiar de comportamiento (arquitectura).
2. Puerta en `finish`: `--sin-verificacion` en `FLAGS_FINISH`/`FlagsCierre`; se verifica tras la colision de IDs y antes de `abrirMergeRequestYAnotar`/`runGitflowScript` (arquitectura), y despues se vuelve a comprobar el workspace (riesgos).
3. `src/core/comando-merge.ts` puro (fuente y destino sacados del texto del comando), y despues `hooks/guardia-merge.ts` + `hooks/pre-tool-merge.ts` (salida 0/2), que solo leen el memo (arquitectura).
4. `hooks.json` sustituye a la sonda, con entradas para `bash *`/`sh *` y PowerShell, y se actualiza el test de `TECHO_HOOK_S` (arquitectura). El filtro `if` queda pendiente de decision (ver D2).

## Desacuerdos resueltos
- Hook sin memo o con huella distinta — arquitectura: bloquea y remite a `taskctl finish` («fallar abierto = guardia decorativa») / riesgos: no da postura propia; dice que abierto no protege y cerrado bloquea todo merge manual, y pide decidirlo explicitamente — gana arquitectura, con la condicion de riesgos de fallar cerrado solo cuando ya se sabe que es un merge hacia integracion o main — los dos roles coinciden en que fallar abierto anula la capa 2. Que «desconocido = rojo» reinterpreta el criterio va a D1.
- La huella que consulta el hook — riesgos: en la rama destino la huella del arbol actual nunca coincide con la de la rama que entra / arquitectura: `huellaDeCommit` del commit fuente, no de HEAD — gana arquitectura — responde exactamente a la objecion de riesgos, que no vio la propuesta (los roles corrieron en paralelo).
- `finish`: reutilizar el memo o ejecutar siempre — arquitectura: `verificarConMemo` (reutiliza el verde) / riesgos: ejecutar siempre, o como poco ofrecer forzarlo — gana riesgos — el criterio dice literalmente «finish ejecuta comando_verificacion antes del merge», y un verde memorizado no ve los ignorados (dist/, node_modules/). El refactor compartido de arquitectura se mantiene para el hook Stop.
- Segundo `finish --merge-request` — riesgos: la puerta no aplica; solo bloquearia algo que la plataforma ya ha mergeado / arquitectura: sin postura (lo deja a dominio, que no se lanzo) — gana riesgos — es la unica postura argumentada; es un punto sin retorno.
- Donde y cuando se anota el salto — arquitectura: anotacion en el cuerpo (`anotarVerificacionOmitida` en transiciones.ts), escrita en la reescritura posterior al merge (finish.ts:589) y en el camino del MR / riesgos: commitearla en la rama de la tarea ANTES del script de merge — gana riesgos en el cuando y arquitectura en el donde (el cuerpo, no el frontmatter) — un commit previo no ensucia el workspace, que era la objecion de arquitectura, y el rastro sobrevive aunque el proceso muera a mitad.
- Comandos compuestos (`git checkout develop && git merge x`) — arquitectura: analizador conservador, sin emular el shell; la red de verdad es `finish` / riesgos: sacar el destino del ultimo `checkout`/`switch` del texto y quitar el filtro `if` de prefijo — gana riesgos en el analisis del texto (cabe en el `comando-merge.ts` puro de arquitectura); quitar el `if` no se decide aqui: D2.

## Riesgos aceptados
- Otras vias para saltarse la guarda (`git pull . x`, `git push . x:develop`, `reset --hard`, alias) — riesgos — capa 1; la capa 2 se documenta como defensa contra despistes, no contra un agente hostil.
- Compuestos que el analizador no entiende (subshells, `-C`, `cd x && ...` si el `if` se queda) — arquitectura y riesgos — la puerta de `finish`; el limite se deja por escrito.
- Un hook roto o lento (exit 1, excepcion, 30 s) falla ABIERTO — riesgos — no ejecuta nunca la suite, solo lee el memo; el bloqueo solo se aplica tras identificar un merge hacia integracion o main.
- `finish` tarda lo que tarde `comando_verificacion`; el timeout de Bash puede cortarlo y dejar huerfanos en Windows — riesgos — aviso en el texto y matar el arbol de procesos al cortar.
- «Rojo» se mide sobre el commit fuente, no sobre el resultado del merge — arquitectura — aceptado por arquitectura; dominio no se lanzo para confirmarlo.
- Doble ejecucion de la suite (Stop + `finish`), unos 10 min aqui — consecuencia de que gane riesgos en el desacuerdo 3 — se acepta; si no, D3.

## Plan de pruebas
- `finish` con la verificacion en rojo aborta con su salida, sin merge, sin MR, sin push — repo temporal real con un comando que sale ≠0 — criterio 1, arquitectura.
- `--sin-verificacion`: el merge ocurre y la anotacion queda commiteada en la rama de la tarea antes del script; si se mata `finish` tras el script, el rastro sigue ahi — repo temporal real — riesgos.
- Una verificacion que ensucia el arbol hace abortar con un mensaje propio, no con el del script — repo temporal con un comando que crea un fichero no ignorado — riesgos.
- El hook BLOQUEA (exit 2) sin un verde del commit fuente: `git merge [--no-ff] feature/x` en develop o main; `git checkout develop && git merge feature/x` desde la rama de trabajo; `bash merge-feature-to-develop.sh feature/x`; lo mismo en main — repos temporales reales con memo escrito y sin escribir — criterio 2, riesgos.
- El hook DEJA PASAR (criterio 3 concretado): `git status|log|diff|show|branch`; `git merge-base`; `git config merge.ff`; `git merge --abort|--continue|--quit`; `echo "git merge develop"`; `git merge develop` estando en `feature/x`; un merge hacia develop con verde del commit fuente; el backmerge de recuperacion de finish.ts:491-494; una integracion con `rama_base` ≠ `develop` resuelta por config — repos temporales — riesgos (MEN-6, recuperacion).
- `freno-stop` igual que antes del refactor (tests de TASK-071 en verde) y el test que cruza `TECHO_HOOK_S` con el hooks.json nuevo — suite existente — arquitectura.

## Sin cubrir
- El camino idempotente de finish.ts:474: ningun rol decide si vuelve a verificar (arquitectura lo deja a dominio) — va a D4.
- No se lanzo el punto de vista de dominio (se lanzaron 2 = max(media declarada, simple heuristica)); arquitectura le delego dos preguntas — sus respuestas en este plan salen de riesgos o de la persona.

## Salidas que faltaron
- ninguna (llegaron las 2 lanzadas; dominio no se lanzo, no falto).

## Suposiciones no verificadas
- Que el `if: "Bash(git *)"` case por prefijo y no vea compuestos — arquitectura y riesgos — probar `git checkout develop && git merge x` en Claude Code real.
- Que el memo, que guarda un unico resultado (riesgos), conserve el verde del commit fuente hasta el merge — riesgos y arquitectura — probar Stop en develop tras verificar en la rama de la tarea.
- Que los scripts `merge-*-to-*.sh` reciban la rama fuente como primer argumento — arquitectura — finish.ts:497 y los scripts.
- El timeout de la herramienta Bash (2 min por defecto, 10 como maximo) y si mata el arbol en Windows — riesgos — documentacion vigente.
- Que los fixtures de finish-*.test.ts no declaren `comando_verificacion` — riesgos — grep en test/helpers/finish-fixtures.ts.
- Que ningun test ni documento obligue a mantener `sonda-hooks.mjs` — arquitectura — grep del repo.

## Decisiones de la persona (Carlos, 2026-11-04)
- D1: **el hook bloquea sin verde guardado** del commit fuente cuando el destino es integracion o main («sin verde = no verde»), y remite a `taskctl finish`. El backmerge de recuperacion (finish.ts:491-494) pasa porque la rama fuente ya es ancestro de main. Sin interruptor de entorno propio del hook.
- D2: **se quita el filtro `if`** de hooks.json (matcher `Bash|PowerShell` sin `if`). El hook descarta sin lanzar procesos todo comando que no contenga `merge` ni un script de cierre de Git-Flow; asi cubre los compuestos (`cd x && git merge`, `git checkout develop && git merge x`).
- D3: **`finish` ejecuta siempre** `comando_verificacion` (no reutiliza el memo). Consecuencia que el implementador debe cerrar: tras un verde, `finish` escribe el memo con la huella del commit (arbol limpio, coincide con `huellaDeCommit`), para que el estado quede coherente con lo que lee el hook. Activar `comando_verificacion` en este repo queda fuera de esta tarea (con los 3 rojos fijos de Windows el salto seria lo normal).
- D4: **la puerta solo corre antes de mergear** o de abrir el MR. No corre en el segundo `finish --merge-request` (plataforma ya mergeada) ni en el camino idempotente (finish.ts:474).

## Decision humana pendiente (resuelta arriba)
- D1: ¿Vale «sin verde memorizado = rojo» en el hook, aunque el criterio dice «en rojo»? ¿Y como pasa el backmerge de recuperacion: rama ya ancestro de main, o un interruptor explicito (las dos opciones son de riesgos)? — reinterpreta el criterio, y ningun rol eligio entre las dos opciones.
- D2: ¿Se quita el filtro `if` de hooks.json (el hook correria en cada Bash de cada proyecto con el plugin, riesgos) o se acepta por escrito el limite de los compuestos (arquitectura)? — depende de una suposicion que nadie ha probado y de un coste que nadie ha medido.
- D3: ¿Confirmas que `finish` ejecute siempre, a costa de los ~10 min duplicados? ¿Y se activa `comando_verificacion` en este repo, con 3 rojos fijos en Windows que harian del salto lo normal (riesgos)? — es coste de producto, no tecnico.
- D4: El camino idempotente (finish.ts:474), ¿verifica o no? Y queda la aprobacion del plan entero con `taskctl approve`: no se implementa nada antes — ningun rol lo fundamento, y la aprobacion es siempre de una persona.
