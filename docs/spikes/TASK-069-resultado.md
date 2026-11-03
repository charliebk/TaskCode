# TASK-069 — Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ

Fecha: 2026-11-03 · Rama: `feature/task-069-spike-hooks-stop-y-pretooluse-de-claude`
Inspirado en gemba-app/brakes (Apache-2.0): se toman ideas, no codigo.

## Que se ha construido

- `hooks/hooks.json` del plugin: un Stop y un PreToolUse (`Bash|PowerShell`, filtrado con
  `if: "Bash(git *)"` y `if: "PowerShell(git *)"`), ambos en **forma exec**
  (`"command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"]`).
- `hooks/sonda-hooks.mjs`: Node sin dependencias. **Inerte** sin `TASKCODE_SONDA_MODO`
  (sale 0 sin leer stdin ni escribir). Modos `registrar`, `stop2`, `pre2`. Registra cada
  invocacion en `TASKCODE_SONDA_LOG` (o `<tmp>/taskcode-sonda.jsonl`), incluidas las claves
  JSON que llegan, para comprobar la entrada real.
- `hooks/test/sonda-hooks.test.sh`: 12 asertos deterministas (codigo de salida, stderr,
  registro). CI: steps H1, H2 (Linux y Windows) y H2b (cmd.exe sin Git Bash).
- `.gitattributes` del plugin: `*.sh text eol=lf` (hallazgo colateral, ver abajo).

## Documentacion oficial (code.claude.com/docs/en/hooks, leida el 2026-11-03)

| Punto | Lo que dice |
|---|---|
| Declaracion en plugin | `hooks/hooks.json` en la raiz del plugin, `description` opcional; se mezcla con los hooks de usuario y proyecto. `${CLAUDE_PLUGIN_ROOT}` = carpeta instalada |
| Forma exec | con `args` no hay shell; `node` + ruta funciona en toda plataforma porque `node.exe` es un binario real |
| Entrada | JSON por stdin: `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `permission_mode`; PreToolUse anade `tool_name`, `tool_input.command`, `tool_use_id` |
| Exit 2 en Stop | impide que Claude pare y continua la conversacion |
| Exit 2 en PreToolUse | bloquea la llamada; Claude recibe el stderr como error de la herramienta (`PreToolUse:Bash hook error: [...]`) |
| Otros codigos | error no bloqueante; exit 1 NO bloquea |
| Timeout en PreToolUse | no bloquea salvo `onFailure: "block"` (Claude Code >= 2.1.295); `onFailure` no tiene efecto en Stop |
| Filtro `if` | best-effort: el script debe volver a comprobar el comando |
| Windows | Claude puede usar la herramienta PowerShell: matcher `Bash|PowerShell` |
| Subagentes | los hooks de plugin tambien corren dentro de subagentes (PreToolUse lleva `agent_id`/`agent_type`) |

## Hipotesis

| # | Hipotesis | Estado | Evidencia |
|---|---|---|---|
| H1 | `hooks/hooks.json` del plugin es aceptado | **CONFIRMADA en local (Windows)**, pendiente CI Linux | `claude plugin validate` da «Validation passed» en Windows nativo (revision ronda 1, 2026-11-03); step "H1 (TASK-069)" del job `claude plugin validate` |
| H2 | La sonda corre por forma exec en Linux | **CONFIRMADA** | `sonda-hooks.test.sh` 12/12 en la VM Linux del bridge (node v22.23.4), 2026-11-03, antes de la ronda 2 (ahora son 16 casos); step "H2" Linux en CI |
| H2 | La sonda corre por forma exec en Windows nativo | **CONFIRMADA en uso real**, pendiente CI | Claude Code 2.1.317 la lanzo en Windows nativo desde las herramientas Bash y PowerShell (ver «Resultado de la prueba»); steps "H2" y "H2b" (cmd.exe) del job Windows sin ejecutar aun |
| H3 | Exit 2 en Stop hace que el agente siga trabajando | **CONFIRMADA** | «Resultado de la prueba», paso 2 |
| H4 | PreToolUse bloquea `git merge` y Claude recibe el motivo (Bash y PowerShell) | **CONFIRMADA** | «Resultado de la prueba», paso 3 |
| H5 | `stop_hook_active` llega `true` en el reintento y corta el bucle | **CONFIRMADA** | «Resultado de la prueba», paso 2 (registro) |
| H6 | El PreToolUse se dispara dentro de un subagente | **CONFIRMADA** | «Resultado de la prueba», paso 4 |

## Guion de prueba manual (IntelliJ, ~5 min)

Requisitos: Claude Code >= 2.1.295 (`claude --version`, anotalo abajo), terminal de IntelliJ en
una carpeta de pruebas (NO en TaskCode: el paso 3 hace un merge).

```powershell
# 0. Preparar
mkdir $env:TEMP\sonda-repo; cd $env:TEMP\sonda-repo
git init -q; git commit -q --allow-empty -m base; git branch otra
$env:TASKCODE_SONDA_LOG = "$env:TEMP\sonda.jsonl"
```

1. **Carga** — `claude --plugin-dir C:\Users\nullcad2025\Documents\sources\Personal\TaskCode\taskcode-marketplace\plugins\taskcode-plugin`,
   escribe `/hooks` y comprueba que aparecen Stop y PreToolUse con origen "plugin". Sal con `/exit`.
2. **H3 + H5** — `$env:TASKCODE_SONDA_MODO = "stop2"`, arranca igual y escribe `di hola`.
   Esperado: Claude responde, el hook lo devuelve al trabajo con el motivo "Stop bloqueado a
   proposito", Claude contesta "sonda recibida" y entonces SI termina (sin bucle).
   En `sonda.jsonl` debe haber dos lineas Stop: la primera con `"stop_hook_active":false`
   y `"salida":2`, la segunda con `true` y `0`.
3. **H4** — `$env:TASKCODE_SONDA_MODO = "pre2"`, arranca y escribe
   `ejecuta git merge otra`. Esperado: la llamada se bloquea y Claude te cuenta el motivo
   "git merge bloqueado". Repite pidiendo `ejecuta git status`: debe ejecutarse. Anota si
   Claude uso la herramienta Bash o PowerShell (`tool_name` en el registro).
4. **H6** — con `pre2`, escribe `lanza un subagente general-purpose que ejecute git merge otra`.
   Esperado: bloqueado tambien; la linea del registro lleva la clave `agent_id`.
5. Pega aqui las lineas de `sonda.jsonl` y una frase por paso; borra las variables
   (`Remove-Item Env:TASKCODE_SONDA_*`).

### Resultado de la prueba (2026-11-03, `claude -p`, Windows 11 nativo)

Se ejecuto el guion sin interfaz (`claude -p ... --plugin-dir <plugin de la rama>`) en un repo
temporal fuera de TaskCode (`master`, ramas `otra` y `rama2`), no en el terminal de IntelliJ. Los
hooks son del CLI, no del IDE, asi que la evidencia vale para cualquier terminal que lance
`claude`; queda sin probar solo la integracion propia del plugin de IntelliJ, si la hubiera.

- Version de Claude Code: 2.1.317. Node v22.23.4.
- Paso 1 (carga): implicito; los pasos 2-4 solo registran porque Claude Code cargo
  `hooks/hooks.json` del plugin (los mensajes citan «taskcode-plugin@inline»).
- Paso 2 (H3 + H5), `stop2`, prompt `di hola`: la salida final fue «sonda recibida». Registro:
  1.ª linea Stop con `"stop_hook_active":false` y `"salida":2`; 2.ª con `true` y `0`; la sesion
  termino (rc 0, sin bucle). La entrada de Stop trae ademas `last_assistant_message`,
  `background_tasks`, `session_crons`, `permission_mode` y `effort`.
- Paso 3 (H4), `pre2`, `git merge otra` con la herramienta Bash y luego con PowerShell: en las dos
  la llamada se bloqueo (`"salida":2`) y Claude cito el motivo literal («sonda TASK-069: git
  merge bloqueado a proposito (pre2). Comando: git merge otra»), atribuido al plugin. `master` no
  cambio (`git branch --merged master` = solo `master`). `git status` paso el hook (`"salida":0`)
  en las dos herramientas; en Bash lo freno despues el sistema de permisos de la sesion
  («This command requires approval»), no el hook.
- Paso 4 (H6), subagente general-purpose que ejecuta `git merge otra`: bloqueado igual, y la
  entrada de PreToolUse lleva `agent_id` y `agent_type` (ausentes en la sesion principal).

## Hallazgos colaterales

1. **Los `.sh` no tenian regla de fin de linea.** `.gitattributes` del plugin fijaba LF para
   `*.ts`, `dist/**` y `bin/*`, pero no para `*.sh`. Con `core.autocrlf=true` el checkout de
   Windows los deja en CRLF y `bash` (VM del bridge) falla con `$'\r': command not found`.
   Corregido en esta rama con `*.sh text eol=lf`.
2. **`create-feature.sh` sale 0 aunque `source` de `_gitflow-common.sh` falle**; solo la
   verificacion por evidencia de `taskctl start` (rama activa != esperada) lo detecto. Los
   scripts deberian abortar si el `source` falla. Sin corregir: candidata a tarea propia.
3. **`taskctl start` tarda minutos sobre el bridge**: el limite de WIP lanza un
   `git merge-base --is-ancestor` por rama (72 ramas, ~3 s cada una sobre el montaje).
   `git commit-graph write --reachable` lo bajo a ~0,1 s por comprobacion. No es un fallo de
   TaskCode en Windows nativo, pero conviene documentarlo (o que `doctor` lo sugiera).

## Implicaciones para TASK-071 y TASK-072

- Forma exec siempre; matcher `Bash|PowerShell` con dos handlers `if`.
- El Stop real debe salir 0 sin trabajo si no hay tarea en `02-en-curso/`, y respetar
  `stop_hook_active` (H5 confirmada).
- El merge guard debe declarar `onFailure: "block"` y comprobar la version minima de Claude Code.
- La sonda se sustituye; `hooks/test/` se reutiliza como patron de prueba.
- **Deteccion del merge en el comando** (revision ronda 1, IMP-1): `\bgit\s+merge\b` casaba con
  `git merge-base`, que usa el limite de WIP de `taskctl start`. La sonda usa ya
  `\bgit(?:\s+-C\s+\S+)*\s+merge(?![\w-])`, con test para `merge-base` y para `git -C dir merge`.
  Limitaciones que el freno real debe resolver o aceptar por escrito: el filtro `if: "Bash(git *)"`
  no ve comandos compuestos (`cd x && git merge`), y la regex no cubre otras opciones globales
  antes del subcomando (`git -c k=v merge`, `git --git-dir=... merge`, `git --no-pager merge`),
  `git -C "ruta con espacios" merge`, `git.exe merge`, mayusculas ni alias de git; y da falsos
  positivos con `git merge.ff` o `echo git merge` (revision ronda 2, MEN-6).
- **Entrada por pipe en PowerShell 5.1** (revision ronda 1, MEN-3): `Get-Content x | node sonda`
  antepone un BOM y la entrada deja de ser JSON; con redireccion `<` funciona. Claude Code usa su
  propio pipe, pero las pruebas manuales en PowerShell deben usar `<` o `-Encoding`.
- El step H2b (cmd.exe) va con `continue-on-error: true`: su resultado hay que mirarlo a mano en el
  CI de Windows, porque un rojo no rompe el pipeline.
