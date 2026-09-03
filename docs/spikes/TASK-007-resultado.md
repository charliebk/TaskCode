# Resultado de TASK-007 — Spike: scripts Git-Flow (.sh) en la máquina de Carlos

Fecha: 2026-09-03. Ejecutado contra el repo real `TaskCode` (recién inicializado,
`main`/`develop` creados en la sesión anterior), en la rama que este spike generó:
`fix/task-007-spike-gitflow-windows`.

## 1. Qué se pudo validar realmente, y qué no

**Importante — léase antes que el resto del documento:** la ejecución se hizo a
través del *bridge* de dispositivo de esta sesión (`device_bash`), que su propia
descripción define como "una VM Linux aislada" en la máquina de Carlos. Esto
**no es lo mismo** que "el Bash tool de Claude Code corriendo dentro de la
terminal integrada de IntelliJ en Windows nativo", que es la pregunta exacta que
plantea TASK-007 y la sección 7.1 de la metodología. No tengo forma, desde esta
sesión, de abrir IntelliJ ni de invocar el Bash tool de una sesión de Claude Code
nativa de Windows.

Lo que **sí** queda validado con evidencia real (no supuesto):
- Los scripts `.sh` (`_gitflow-common.sh`, `create-fix.sh`, `diagnose-repo.sh`)
  corren **sin ninguna modificación** en un Bash real de la máquina de Carlos,
  contra un repo Git real, con resultados correctos.
- La lógica de "modo offline" (sin `origin` configurado) funciona exactamente
  como la documenta `000_GUIA-GITFLOW-RUNCONFIGURATIONS.md`: avisa con `[WARN]`
  y continúa en local, no aborta.
- Los caracteres UTF-8 del output (✓, ✗, ━, colores ANSI) se renderizan
  correctamente en este entorno.

Lo que **queda sin validar** y no debería darse por bueno sin más prueba:
- Que este mismo comportamiento sea idéntico invocado desde el Bash tool de
  Claude Code dentro de la terminal de IntelliJ en Windows nativo (no WSL, no
  una VM Linux puente). La sección 7.1 de la metodología ya apunta que Claude
  Code en Windows usa Git Bash nativamente — sigue siendo una afirmación de
  documentación de producto, no algo que yo haya podido reproducir desde aquí.
- El workaround de ruta corta 8.3 (`C:/PROGRA~1/Git/bin/bash.exe`) que usan los
  XML de IntelliJ es un problema de **cómo IntelliJ invoca bash.exe desde
  PowerShell**, no de los scripts en sí — no debería aplicar a Claude Code, que
  no pasa por esa cadena de invocación, pero de nuevo: no reproducido aquí.

**Recomendación:** la próxima vez que alguien del equipo abra una sesión de
Claude Code de verdad en su Windows con IntelliJ, un primer comando trivial
(`taskctl new --titulo "smoke test" --tipo fix` o simplemente `bash --version`
desde el Bash tool) confirma esto en 10 segundos. Vale la pena no cerrar este
punto de la sección 14 como "resuelto sin reservas" hasta que eso pase una vez.

## 2. Qué se ejecutó, paso a paso

```
$ cd TaskCode
$ git status --short && git branch --show-current
develop
$ bash .idea/runConfigurations/local_git-flow-actions/create-fix.sh task-007-spike-gitflow-windows
```

Salida completa (primera vuelta, workspace todavía no limpio — ver hallazgo 2):

```
[END] Operacion cancelada por usuario.
```

Tras corregir `.gitignore` (hallazgo 2) y commitear ese cambio, segunda vuelta:

```
[WARN ] No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local.
[INFO ] Ya estamos en develop.
[WARN ] Sincronizacion omitida: no hay conexion con origin.
[INFO ] La rama fix/task-007-spike-gitflow-windows no existe. Creandola desde develop...
[OK   ] Rama fix/task-007-spike-gitflow-windows creada desde develop
[OK   ] Rama activa final: fix/task-007-spike-gitflow-windows

====================================================
  [OK]  OPERACION : create-fix (fix/task-007-spike-gitflow-windows)
       RESULTADO : COMPLETADO
       DURACION  : 1s
       DETALLE   : rama fix/task-007-spike-gitflow-windows creada desde develop
====================================================
```

`git branch -vv` después:
```
  develop                            ba5f682 chore: anade .idea/ y logs/ al gitignore antes del spike de Git-Flow
* fix/task-007-spike-gitflow-windows ba5f682 chore: anade .idea/ y logs/ al gitignore antes del spike de Git-Flow
  main                               4435d68 Inicializa el repositorio: metodologia, plan de sprints y Sprint 0 de taskctl
```

Y `diagnose-repo.sh` (solo lectura) confirmando el estado:
```
  Rama actual:         fix/task-007-spike-gitflow-windows
  Workspace:           ✓ LIMPIO
  Remoto:              ✗ sin conexión con origin
  Rama principal:      main
  Develop:             ! solo local (pendiente de push)
  Stashes guardados:   0
  ✓  Sin operaciones en curso
```

El script también escribió su propio log persistente en
`logs/gitflow/gitflow-2026-09-03.log` (gitignorado, no se versiona — ver
hallazgo 2), con el mismo contenido que el output de arriba.

## 3. Hallazgos

### Hallazgo 1 (informativo, no bug): el log interno asume una profundidad de carpetas que no coincide con el layout del plugin

`_gitflow-common.sh` calcula dónde escribir `logs/gitflow/` así:

```bash
log_dir="$(cd "$COMMON_DIR/../../.." && pwd)/logs/gitflow"
```

Esto asume que el script vive exactamente en
`<raíz-del-proyecto>/.idea/runConfigurations/local_git-flow-actions/` (3
niveles bajo la raíz) — cierto en el layout original de IntelliJ, y es
justo lo que reproduje en este spike para no invalidar la prueba.

Pero la sección 7.1 de la metodología ya decidió que los scripts vivirán en
`scripts/gitflow/` **dentro del plugin instalado**, invocados por ruta
completa (`"$CLAUDE_PLUGIN_ROOT/scripts/gitflow/create-feature.sh"`). Desde
ahí, `../../..` no aterriza en la raíz del proyecto — aterriza en algún punto
dentro de `~/.claude/plugins/cache/...` (la instalación del plugin, no el
repo del usuario). Con ese cálculo intacto, el primer `taskctl start` de
cualquiera crearía (o fallaría al crear) `logs/gitflow/` en un sitio
equivocado, fuera del repo del proyecto.

**No es un bug de los scripts** — es un acoplamiento a una ubicación que ya
sabíamos que iba a cambiar. Es exactamente el tipo de ajuste que le
corresponde a TASK-008 ("migrar scripts a scripts/gitflow/, sin tocar su
lógica interna" — este es el único punto donde "sin tocar la lógica" necesita
una excepción de una línea). La corrección es sencilla y ya existe un
precedente en el propio fichero: `warn_lfs_and_submodules` (línea ~459) ya usa
`git rev-parse --show-toplevel` para encontrar la raíz del repo real en vez de
contar niveles de carpetas. `initialize_gitflow_log` debería hacer lo mismo.

### Hallazgo 2 (real, reproducido): un repo recién inicializado sin `.gitignore` para `logs/` se autobloquea en el primer uso

La primera ejecución de `create-fix.sh` contra el repo `TaskCode` recién
inicializado terminó en `[END] Operacion cancelada por usuario.` sin haber
tocado nada — pero no porque el workspace estuviera sucio de verdad, sino
porque el propio script, al arrancar (`initialize_gitflow_log`, que corre
*antes* de `ensure_workspace_ready`), crea `logs/gitflow/` y escribe ahí su
log. Si `logs/` no está todavía en `.gitignore`, ese mismo fichero que acaba
de crear el script aparece como "untracked" en `git status --porcelain`, y
`ensure_workspace_ready` — que lee stdin de forma no interactiva y por tanto
recibe una respuesta vacía a su pregunta `Si/No` — interpreta eso como "no" y
cancela.

La guía original (`000_GUIA-GITFLOW-RUNCONFIGURATIONS.md`) da por hecho que
`logs/` "está en `.gitignore`" — cierto en el proyecto original, donde ya
llevaba tiempo configurado. En un repo nuevo (como el que se acaba de
inicializar para TaskCode) ese `.gitignore` **todavía no existe** la primera
vez que alguien ejecuta cualquier comando de Git-Flow.

**Corrección aplicada en este mismo spike** (no aplazada, porque bloqueaba
la propia prueba): añadidas las entradas `.idea/` (ya estaba) y `logs/` al
`.gitignore` de la raíz del repo, commiteado aparte antes de repetir la
prueba. **Para TASK-008**: el `.gitignore` de cualquier proyecto que adopte
el plugin debe traer `logs/` desde el primer scaffold (probablemente algo que
`taskctl` debería poder verificar o generar él mismo la primera vez que se
usa un comando de Git-Flow, en vez de confiar en que cada equipo se acuerde).

### Hallazgo 3 (informativo): comportamiento no interactivo confirmado seguro por defecto

Con stdin sin TTY (como será siempre que `taskctl` invoque estos scripts
desde el Bash tool), cualquier `read -rp` de confirmación (`[S/n]`, `Si/No`)
recibe una cadena vacía. En los dos casos observados en este spike
(`ensure_workspace_ready` y, por diseño, `show_merge_diff`), una respuesta
vacía cae del lado seguro: cancela la operación en vez de continuar a
ciegas. Esto es una propiedad deseable pero **implica que `taskctl` no podrá
invocar directamente los comandos de `merge`/`update` que muestran vista
previa y piden confirmación** — necesitará o bien pasar una respuesta por
stdin de forma controlada, o bien (mejor, y coherente con el principio de
economía de tokens de la sección 16) reimplementar esa confirmación como un
parámetro `--yes`/`--no-confirm` en vez de depender de un prompt interactivo.
Esto es exactamente el tipo de ajuste que le toca a TASK-009/011 en Sprint 1,
no a este spike — se deja anotado aquí porque solo se ve corriendo el script
de verdad, no leyéndolo.

## 4. Conclusión para TASK-008/009 (Sprint 1)

1. Los scripts pueden migrarse a `scripts/gitflow/` **con un único cambio de
   lógica real**: sustituir el cálculo de `log_dir` en `_gitflow-common.sh`
   por `git rev-parse --show-toplevel` (Hallazgo 1). Todo lo demás se migra
   literal.
2. El scaffold de cualquier proyecto nuevo debe incluir `logs/` en
   `.gitignore` desde el principio (Hallazgo 2) — evita que el primer uso
   real de Git-Flow en un repo nuevo se autobloquee.
3. Los comandos de `taskctl` que orquesten scripts con confirmación
   interactiva (`update`, `merge`) necesitan un mecanismo explícito de
   "sí, continúa" que no dependa de un TTY (Hallazgo 3) — a diseñar en
   TASK-009/011.
4. La pregunta original y más estricta de TASK-007 —Bash tool de Claude Code
   dentro de IntelliJ en Windows nativo— sigue sin confirmarse con evidencia
   propia; recomiendo una prueba de 10 segundos la próxima vez que alguien
   del equipo tenga una sesión de Claude Code real abierta en su Windows.
