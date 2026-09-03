# scripts/gitflow/

Automatización de Git-Flow migrada desde `runConfigurations.zip` (Run
Configurations de IntelliJ) por TASK-008. Estos scripts los invoca
`taskctl` internamente (ver tabla de comandos en la sección 8 de
`docs/PROPUESTA_METODOLOGIA.md`) — no están pensados para ejecutarse a
mano salvo para depurar o para el spike/smoke test.

## Qué cambió respecto al original

Los 22 scripts de acción y `_gitflow-common.sh` son una copia literal del
`.zip` **salvo dos ajustes en `_gitflow-common.sh`**, ambos identificados
en `docs/spikes/TASK-007-resultado.md` y necesarios porque los scripts ya
no viven en `.idea/runConfigurations/local_git-flow-actions/` del proyecto,
sino dentro del plugin instalado:

1. **`log_dir`** (usado por `initialize_gitflow_log`): antes calculaba la
   raíz del proyecto contando 3 niveles de carpeta hacia arriba desde el
   propio script. Ahora usa `git rev-parse --show-toplevel`, así que
   `logs/gitflow/` siempre se escribe dentro del repo del usuario, sin
   importar desde qué profundidad se invoque el script.
2. **`invoke_merge_work_branch_to_develop`**: antes hacía `fetch origin`
   sin comprobar si el remoto existía, y fallaba duro (`exit 1`) en
   cualquier repo sin `origin` configurado — como el propio `TaskCode`
   hasta que exista `TASK-021`. Ahora comprueba disponibilidad primero
   (mismo patrón que ya usaba `invoke_create_work_branch`) y sigue en modo
   local con un aviso si no hay remoto.

Una revisión por pares independiente sobre estos dos cambios encontró un
tercer detalle menor y se corrigió de paso: si `initialize_gitflow_log` se
invoca totalmente fuera de cualquier repo Git (no debería pasar nunca vía
`taskctl`, que siempre corre con el cwd dentro del repo del usuario), el
fallback a `$(pwd)` dejaba un `logs/gitflow/` huérfano antes de que el
script abortara un instante después. Ahora, si no hay repo Git, simplemente
no se escribe log a fichero (se sigue mostrando por stdout).

No se ha "arreglado" nada más allá de estos tres puntos a propósito — ver la
sección de hallazgos abiertos más abajo.

## `_gitflow-common.sh` en Windows: qué NO se ha confirmado todavía

TASK-007 validó estos scripts desde un bridge Linux hacia la máquina del
usuario, no desde una sesión de Claude Code nativa dentro de la terminal de
IntelliJ en Windows. Se recomienda una prueba rápida (`bash --version`, o
`taskctl new` de verdad) la próxima vez que alguien del equipo tenga esa
sesión abierta — ver `docs/spikes/TASK-007-resultado.md`.

## Hallazgo abierto, no corregido en TASK-008: el mismo bug de `origin` existe en más scripts

Al migrar se encontró que el patrón de "`fetch origin` sin comprobar
disponibilidad" del hallazgo 4 **no está solo en
`invoke_merge_work_branch_to_develop`**. Aparece, con su propia copia de
lógica (no comparten la función corregida), en:

- `create-develop.sh`, `create-hotfix.sh`, `create-release.sh`
- `merge-hotfix-to-main.sh`, `merge-release-to-main.sh`
- `recover-branch.sh`, `resume-work.sh`

Es decir: hoy, en un repo sin `origin` (como `TaskCode` mismo), `taskctl
start` para una tarea `hotfix` o `release`, y `taskctl finish` para
`hotfix`/`release`, fallarían igual que fallaba `merge-fix-to-develop.sh`
antes del ajuste. No se ha corregido en TASK-008 para mantener el diff
revisable y acotado a lo que motivó la tarea — queda documentado aquí y en
la sección 14 de la metodología como precondición explícita de TASK-009
(`taskctl start`, que sí toca `create-hotfix.sh`/`create-release.sh`) y
TASK-014 (`taskctl finish`, que toca los `merge-*-to-main.sh`).

## El bit ejecutable no sobrevive en este repo — invocar siempre con `bash`

`git config core.fileMode` está en `false` en `TaskCode` (Git lo detectó
solo al inicializar el repo): el filesystem real bajo el bridge de
dispositivo no preserva de forma fiable el bit `+x`, así que estos `.sh`
quedan commiteados como `100644` aunque estén `chmod +x` en disco ahora
mismo. **Por eso `taskctl` debe invocarlos siempre como
`bash "$CLAUDE_PLUGIN_ROOT/scripts/gitflow/create-<tipo>.sh"`, nunca por
ruta directa** — así el bit ejecutable deja de importar. Es además más
robusto en general: un checkout nativo en Windows (NTFS) tampoco preserva
permisos Unix, así que esta convención habría hecho falta de todos modos.

## `test/smoke-test.sh`

Prueba de regresión funcional (no unitaria — son scripts Bash que tocan
Git de verdad) para los dos ajustes de arriba. Monta un repo temporal sin
`origin`, crea una rama, la mergea, y comprueba que el log queda dentro del
repo temporal y no dentro de `scripts/gitflow/`. Se ejecuta con:

```bash
bash scripts/gitflow/test/smoke-test.sh
```
