# Informe de revision — TASK-060 (ronda 1)

- Commit revisado: cf84a14030c019e830aba6c77fd7f67cac749785
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Puerta y metodo

- Clon limpio en `C:\t\rev060`, rama de la tarea. `npm install` y `npm run build`: `git status` limpio tras compilar (el `dist/src` versionado coincide con el fuente).
- `npm test` completo, una vez: **1239 tests, 1236 pasan, 3 fallan**, exactamente los tres conocidos en Windows (approve: stat no ENOENT; plan: escritura no EEXIST; plan: rama base con estado distinto). Ningun cuarto rojo.
- Linter: el proyecto no tiene.
- Reproduccion con el CLI real (`node bin/taskctl finish ...`) en repos Git temporales con remoto bare y el doble `test/helpers/plataforma-doble.ts`. Todo lo que sigue "sin hallazgo" esta ejecutado, no leido.

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/commands/finish.ts:~traerIntegracionDeLaPlataforma |
| MEN-1 | MENOR | abierto | skills/task-workflow/avance.md:22-23 |
| MEN-2 | MENOR | abierto | scripts/gitflow/merge-hotfix-to-main.sh, merge-release-to-main.sh |
| MEN-3 | MENOR | aceptado (desvio) | src/commands/finish.ts (modoMergeRequest) |
| MEN-4 | MENOR | aceptado (desvio) | src/core/config.ts / skills/finish/SKILL.md |

### IMP-1 — El segundo `finish` declara "integrada" una rama con commits locales que no estan en la base

Reproduccion (CLI real, doble de `gh`, bare como origin):

1. `taskctl finish TASK-700 --merge-request` (sin `--push`): sube la rama, abre el PR, anota la URL, commit local de anotacion.
2. En la rama de la tarea: `echo x > extra.txt; git add -A; git commit -m extra` (trabajo posterior al PR, sin subir).
3. La plataforma mergea el PR (la rama tal como estaba subida; el doble pasa a `integrado` con el SHA del merge).
4. `taskctl finish TASK-700 --merge-request` termina con exit 0: `Tarea TASK-700 terminada: "feature/..." integrada en "develop" (merge request ... mergeado en la plataforma)`. `extra.txt` NO esta en develop.

Causa: con el MR `integrado`, `traerIntegracionDeLaPlataforma` solo comprueba que el commit que informa la plataforma esta en `origin/<base>` y que la local avanza por fast-forward; nunca contrasta la punta de la rama de la tarea con lo integrado. Con squash/rebase la ancestria no sirve (decision 3 de Carlos), pero aqui hay una comprobacion barata que si discrimina: tras el `fetch`, `git rev-list origin/<rama>..<rama>` debe contener, como maximo, el commit de anotacion del propio finish (el que `abrirMergeRequestYAnotar` crea y que solo se sube con `--push`). Cualquier otro commit local sin subir es trabajo que el cierre da por entregado y no lo esta. La rama no se borra (politica IECA), asi que no hay perdida de datos, pero el cierre afirma algo falso y la tarea queda en `terminada`. Sugerencia: abortar (o al menos avisar con `onAviso`) nombrando los commits no integrados. No es verificable por ancestria con squash; por eso IMPORTANTE y no CRITICO.

### MEN-1 — `avance.md` contradice lo que hace `--merge-request` en modo automatico

`avance.md` sigue diciendo "nunca se sube nada con `--push` sin que la persona lo pida", y unas lineas mas abajo describe que en `automatico` la skill usa `cierre_por_defecto`. Con `merge-request` el `finish` sube la rama SIN `--push` (decision 2 de Carlos, y el CHANGELOG y la salida lo dicen). La regla de `avance.md` deberia matizarse: "salvo la rama de un merge request, que `cierre_por_defecto: merge-request` pide de antemano". Hoy un lector de `avance.md` esperaria que el modo automatico no publique nada.

### MEN-2 — `--tag` sin valor en los scripts de hotfix/release se ignora en silencio

`bash merge-hotfix-to-main.sh hotfix/x --develop develop --tag` (flag al final, sin valor): sale 0 y pone el tag calculado (`task-710-x`), sin avisar de que se ha descartado `--tag`. `taskctl finish` nunca lo invoca asi (valida el nombre antes), solo afecta al uso directo del script. Aceptable; se anota por simetria con la doctrina "ignorar el flag dejaria cerrar sin el tag pedido" de `extraerFlagsCierre`.

### MEN-3 — (desvio declarado) `finish` sin flags sobre una tarea con `## Merge request` sigue el camino del MR

Juzgado: **aceptable**. Es la unica forma de no mergear en local lo que otro MR tiene abierto, y cumple el criterio 1 en todo lo que existia (una tarea sin la seccion es identica a hoy; la suite existente de finish pasa sin cambios de expectativa). Comprobado: con el MR abierto, `finish` sin flags aborta con "sigue abierto" y no toca nada; los reintentos no crean un segundo PR (1 `pr create` tras 3 invocaciones). Efecto colateral comprobado: si se lanza desde `develop` tras un squash (la seccion no esta en develop), el guard de colision de IDs aborta sin tocar nada, con un mensaje correcto aunque poco orientador; la skill ya manda cerrar desde la rama de la tarea. La marca es texto editable de `tarea.md`: se reconoce solo con la linea `- URL del merge request: <url publicable>`. Recomendacion opcional: que el mensaje de "colision de IDs" no sea el unico indicio en ese camino.

### MEN-4 — (desvio declarado) `cierre_por_defecto` solo la lee la skill

Juzgado: **aceptable** y coherente con la tarea ("lo usa el modo automatico", que es la skill). Consecuencia a tener presente: quien ejecuta `taskctl finish` a mano ignora la politica del equipo; es lo que se documenta en `config.ts` y CHANGELOG. Los otros desvios declarados, juzgados:

- URL del MR en una seccion propia `## Merge request`: correcto; no toca el esquema de `Task` ni `TASK_FIELD_ORDER`; el estado siempre lo da la plataforma, no la seccion (comprobado: seccion con MR inexistente en la plataforma aborta).
- `--merge-request` en hotfix/release aborta: correcto y con mensaje claro (comprobado). Un hotfix con `--tag` pone UN tag (el del script, con el nombre pedido, sobre main); tag ya existente en local o en origin aborta antes de tocar nada.
- Doble de gh/glab en Windows (enlaces duros a node.exe + `--require`): funciona (los tests de MR pasan y lo he usado desde el CLI real). La restriccion "ninguna llamada puede empezar por una opcion" esta documentada y `comprobarCli` usa `auth status`, no `--version`. Un `gh`/`glab` instalado como shim `.cmd` aparece como "no instalado"; esta documentado en el fuente.
- Tag con origin caido: `--push` aborta antes de mergear sin tocar nada (comprobado: develop intacta); sin `--push` avisa y sigue (comprobado).

## Comprobado empiricamente sin hallazgo

- Merge normal sin flags: sin tags, sin subir nada, identico a hoy.
- `--tag` en feature (con y sin `--push`): tag ANOTADO, mensaje = titulo, sobre el commit de merge (HEAD~1; el commit de cierre de taskctl va despues); con `--push` sube al bare tras la rama; sin `--push` queda local y la salida da el comando para subirlo.
- Tag duplicado local / en origin / nombre invalido (`a b`, `a..b`, `-x`, sin valor): abortan antes de mergear, rama y estado intactos.
- Reintento tras fallo parcial: merge manual hecho + tag ajeno sobre otro commit -> aborta y nombra la salida; tag propio ya puesto sobre el merge -> se salta y cierra. `--push` con develop remoto adelantado: el pull del script lo absorbe y el tag sale sobre el merge, y esta en origin/develop.
- Hotfix `--tag v3.0.1 --push`: un solo tag, sobre main; el finish no sube main ni el tag y lo dice (aviso doble, coherente con "no se reenvia --push a los scripts").
- Ciclo MR con GitHub (doble) y GitLab, en los tres metodos (merge, squash, rebase): PR unico, rama subida, tarea en en-revision con la URL anotada; segundo finish con MR abierto aborta sin tocar; tras mergear, cierra la tarea y el tag va sobre el commit que la plataforma da (sha exacto comprobado), anotado, local sin `--push`. `crearFalla` y reintento: un solo MR final; ya abierto: aborta sin duplicar. `listarFalla`: aborta sin tocar.
- Preflight (sin autenticar, sin CLI, host `git.empresa.es` desconocido): aborta antes de subir; el bare no recibe la rama.
- Credenciales: origin `https://tok:s3cret@github.com/...`; ni la salida de los cuatro finish, ni `git log --all -p`, ni `tarea.md`, ni el estado del doble contienen `s3cret`. `urlsDeOrigin` no se muestra; el stderr de `gh` con URL con credenciales sale enmascarado (`https://***@github.com/graphql`).
- Skill `finish`: no menciona el proyecto ni rutas internas (los tests de contenido pasan); coherente con `avance.md` en los tres modos salvo MEN-1; hotfix/release preguntan siempre; automatico nunca pasa `--tag`.

## Mutacion (el implementador no dejo lista M1..M12 en el commit ni en tarea.md; he elegido las mias)

| Mutante | Resultado |
|---|---|
| Ma `ocultarCredenciales` devuelve el texto tal cual | MUERTO (test de `plataforma-remota`: 1 rojo) |
| Mb `subirTag` sin comprobar que la rama esta en origin | MUERTO (finish-tag + finish-merge-request: 1 rojo) |
| Mc tag creado sobre `HEAD` en lugar del commit calculado | MUERTO (1 rojo) |
| Md un PR `CLOSED` se lee como integrado | NO CONCLUYENTE: la ejecucion se colgo y la mate a mano; no cuenta como muerto |
| Me no comprobar que el MR se mergeo contra la rama de integracion | MUERTO (1 rojo) |
| Mf ignorar la seccion `## Merge request` (solo vale el flag) | MUERTO (2 rojos) |
| Mg un tag presente en origin no bloquea antes de mergear | MUERTO (2 rojos) |
| Mh subir el tag aunque no haya `--push` | MUERTO (3 rojos) |

Siete mutantes distintos muertos; Md queda sin confirmar (un test que se cuelga bajo la mutacion indica que algo reacciona, pero no es un rojo limpio): conviene que el implementador lo repita contra `test/core/plataforma-remota.test.ts`.

Estado final del clon revisor: `git status` limpio tras restaurar los mutantes y recompilar.
