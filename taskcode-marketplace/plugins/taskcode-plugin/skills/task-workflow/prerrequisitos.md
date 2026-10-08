# Prerrequisitos del flujo de tareas

Se lee cuando `taskctl` no responde o el repo no tiene rama `develop`. Si los
dos estan en su sitio, no hace falta nada de lo que sigue. Con `taskctl`
respondiendo, `taskctl doctor` comprueba de una vez estos y el resto de
prerrequisitos (Node, git, bash para los scripts de Git-Flow, `tareas/`, ramas,
config, tareas, y `gh`/`glab` si hay merge request) y da el arreglo de cada uno.

**Prerrequisito 1 — `taskctl` disponible**: lo aporta este mismo plugin. Su
ejecutable vive en `bin/`, que Claude Code anade al PATH del Bash tool
mientras el plugin este habilitado, y no hay que compilar ni instalar nada
aparte. Comprobarlo con `taskctl --version`, que debe imprimir un numero de
version. Si no responde, en este orden:

1. Reinicia la sesion de Claude Code. El PATH se compone al arrancar, asi que
   un plugin instalado a mitad de sesion no aparece hasta la siguiente.
2. Si sigue sin responder, mira **primero** si la variable tiene valor:
   `echo "$CLAUDE_PLUGIN_ROOT"`.
   - Si imprime una ruta, invocalo por ahi:
     `node "$CLAUDE_PLUGIN_ROOT/bin/taskctl" --version`. Todos los comandos de
     la skill de flujo funcionan igual por esa via.
   - **Si sale vacia, este paso no aplica y no dice nada** sobre si el plugin
     esta activo: esa variable no esta exportada en todos los entornos, y
     usarla vacia construye una ruta que no existe (`/bin/taskctl`) y falla
     por un motivo que no tiene nada que ver.
3. Solo si el paso 2 llego a ejecutarse con una ruta que **contiene de verdad
   `bin/taskctl`** y aun asi no respondio, el plugin no esta activo y ningun
   paso de la skill de flujo va a funcionar. Si la ruta apuntaba a otro sitio,
   el fallo no dice nada: vuelve al paso 1.

No des por hecho el paso 3 al primer `command not found`: el caso normal es
el 1.

**Prerrequisito 2**: el repo necesita una rama `develop`. Los comandos la
esperan por nombre para las tareas de tipo `feature`, `fix` y `release`; las
de tipo `hotfix` van contra la principal (`main` o `master`, lo que exista).
Sin `develop`, el primer comando que escriba en `tareas/` ya falla.
