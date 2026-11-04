# Brainstorm — TASK-072, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos (a680884679fa47780)

## Riesgos, de mayor a menor daño

- **La guarda del hook se salta con la forma más habitual de mergear** — `git checkout develop && git merge --no-ff feature/x` o `cd repo && git merge ...`: cuando se ejecuta PreToolUse, la rama actual sigue siendo la de trabajo, así que el hook ve como destino una «rama de trabajo» y deja pasar. Además, el spike TASK-069 (docs/spikes/TASK-069-resultado.md, «Implicaciones») confirma que `if: "Bash(git *)"` no ve comandos compuestos — la capa 2 da una falsa seguridad justo en el caso que tenía que parar — mitigación: sacar el destino del propio texto del comando (el último `checkout`/`switch` antes del `merge`) y quitar el filtro `if` de prefijo; si no se puede, aceptarlo por escrito como límite.
- **El hook bloquea las instrucciones de recuperación del propio `finish`** — finish.ts:491-494 manda hacer a mano `git checkout <integracion> && git merge --no-ff <rama>` cuando el merge a main y el tag ya están hechos pero falta el backmerge. Con la verificación en rojo o desconocida, el hook lo bloquea y la tarea se queda bloqueada con main ya integrado — mitigación: dejar pasar los merges de una rama que ya es ancestro de main, o un interruptor explícito, documentado en ese mismo mensaje de error.
- **La capa 1 deja un merge saltado sin rastro si el proceso muere** — se usa el flag de salto y `finish` muere (o lo mata el timeout de la herramienta Bash) entre el script de Git-Flow y el commit que mueve la tarea. Hoy la anotación en tarea.md solo puede ir en ese commit posterior, porque escribirla antes ensucia el árbol y aborta la guarda de workspace de finish.ts:369 — mitigación: commitear la anotación del salto en la rama de la tarea ANTES de lanzar el script de merge.
- **`finish` muere a mitad de la verificación cuando el agente lo lanza** — la herramienta Bash de Claude Code tiene un timeout propio (supuesto: 2 min por defecto, 10 como máximo) y la suite de este repo dura ~10 min. El merge no ocurre, pero en Windows el subproceso de la verificación puede quedar huérfano escribiendo coverage/ y dist/ — mitigación: avisar en el texto de la tarea de que finish puede tardar lo que tarde `comando_verificacion`, y matar el árbol de procesos al cortarlo.
- **La propia verificación ensucia el árbol entre la guarda de workspace y el merge** — si `comando_verificacion` genera ficheros versionados o no ignorados, sale verde y luego el script de Git-Flow aborta por workspace sucio. freno-stop.ts:187-191 ya contempla que la verificación cambie el árbol — mitigación: volver a comprobar el workspace después de verificar y abortar con un mensaje propio, no con el del script.
- **Un hook roto o lento deja de proteger, o bloquea todo** — exit 1, una excepción o los 30 s de timeout fallan ABIERTOS. Con el `onFailure: "block"` que recomienda el spike, un fallo del hook (dist ausente, versión vieja de Claude Code) bloquea también `git status` y `git log` en todos los proyectos con el plugin — mitigación: el hook no ejecuta nunca la suite, solo lee el memo; fallo cerrado solo cuando ya se sabe que el comando es un merge hacia integración o main.
- **Falsos positivos que rompen comandos legítimos** — `git merge --abort|--continue|--quit` (lo usa el wrapper `abort-merge`), `git merge-base`, `git merge.ff`, `echo git merge`, y las ramas de integración con otro nombre (`rama_base` no es literalmente `develop`, finish.ts:375). Son los límites MEN-6 de TASK-069, sin resolver — mitigación: lista explícita de subcomandos y opciones que pasan siempre; destino resuelto con la config, no con literales.

## Puntos sin retorno

- Merge a main + tag + `--push` con el flag de salto — en cuanto el remoto lo tiene, ya no se puede deshacer sin reescribir historia compartida.
- Segundo `finish --merge-request` con la plataforma ya mergeada — si la puerta aplica aquí y sale roja, el merge ya está consumado fuera y la tarea se queda en esperando-merge-request.

## Descartado a propósito

- Lecturas parciales del memo por escrituras concurrentes (writeFileSync no atómico, Stop y finish a la vez) — leerMemo trata un JSON roto como si no hubiera memo (verificacion.ts:121): solo cuesta volver a ejecutar.
- Saltos de la guarda por otras vías (`git pull . x`, `git push . x:develop`, `reset --hard`, alias) — la capa 2 es una defensa contra despistes del agente, no contra uno hostil; basta con aceptarlo por escrito.
- Dos versiones del plugin con formatos de memo distintos a la vez — VERSION_MEMO ya separa los formatos; si se cambia el formato, se sube la versión.

## Desacuerdos previstos

- **arquitectura — el memo como fuente de verdad del hook** — el memo guarda un único resultado con la huella del árbol ACTUAL (HEAD incluido). En la rama destino, la huella no coincide con la de la rama que entra, así que el hook casi nunca sabe si la verificación está «en rojo»: tiene que decidir sin dato. Si en ese caso falla abierto, la capa 2 no protege nada; si falla cerrado, bloquea todo merge manual. Esto hay que decidirlo de forma explícita, no heredarlo de TASK-071.
- **arquitectura/dominio — reutilizar el memo en `finish`** — un verde guardado ignora lo que no entra en la huella (ficheros ignorados como dist/ o node_modules/), y un rojo intermitente guardado bloquea finish hasta que cambie el árbol. Posición: en finish se ejecuta siempre o se ofrece forzar la ejecución.
- **dominio — si la puerta aplica a `--merge-request`** — en el segundo finish solo puede bloquear algo que ya pasó; posición: allí no se ejecuta.

## Suposiciones no verificadas

- Timeout de la herramienta Bash de Claude Code (2 min por defecto, 10 como máximo) y si mata el árbol de procesos en Windows — mirar la documentación vigente de Bash tool.
- Que `if: "Bash(git *)"` sea un glob de prefijo sobre el comando entero — el spike solo dice que no ve compuestos; probar `git checkout develop && git merge x`.
- Que el parser de tarea.md de versiones anteriores tolere una clave nueva en el frontmatter para el salto — mirar src/core (parser de tareas) antes de elegir dónde se anota.
- Que los fixtures de los tests finish-*.test.ts no declaren `comando_verificacion` (si lo declaran, cambia el comportamiento de toda esa suite) — grep en test/helpers/finish-fixtures.ts.
- Que este repo active `comando_verificacion` (hoy .taskcode/ no lo declara: verificado). Con `npm test` en Windows serían 3 rojos fijos, así que finish quedaría bloqueado siempre y el salto acabaría siendo lo normal.

Fuentes leídas: src/fs/verificacion.ts, src/hooks/freno-stop.ts, hooks/hooks.json, src/commands/finish.ts, tareas/04-terminadas/TASK-069/tarea.md, docs/spikes/TASK-069-resultado.md.

## El riesgo que mas te preocupa (UNO solo)

El primero: la capa 2 deja pasar `git checkout develop && git merge ...`, que es justo la forma en que un agente se saltaría `finish`.
