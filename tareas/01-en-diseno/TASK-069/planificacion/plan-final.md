# Plan — TASK-069: Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Un spike, no una funcionalidad: el entregable es evidencia y un documento, mas
un hook de prueba que se queda en el repo como fixture para TASK-071/072. No se
toca ningun comando de `taskctl` ni `src/`.

### Lo que dice la documentacion oficial (leida el 2026-11-03, code.claude.com/docs/en/hooks)

- Los hooks de un plugin se declaran en `hooks/hooks.json` en la raiz del
  plugin; se mezclan con los del usuario y del proyecto cuando el plugin esta
  activo. `${CLAUDE_PLUGIN_ROOT}` apunta a la carpeta instalada del plugin.
- **Forma exec** (`"command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/..."]`):
  sin shell, y la propia documentacion la recomienda para Windows porque
  `node.exe` es un binario real. Esto **elimina la pregunta Git Bash frente a
  PowerShell** para el hook en si: deja de depender del shell. Es la decision
  de forma de este plan.
- Entrada por stdin en JSON: comunes `session_id`, `transcript_path`, `cwd`,
  `hook_event_name`, `permission_mode`; PreToolUse anade `tool_name`,
  `tool_input.command`, `tool_use_id`.
- Exit 2 en **Stop**: impide que Claude pare y continua la conversacion; en
  **PreToolUse**: bloquea la llamada, y Claude recibe el stderr con el prefijo
  `PreToolUse:Bash hook error: [...]`.
- Exit distinto de 0 y 2 = error NO bloqueante. Un timeout en PreToolUse
  **no bloquea** salvo `onFailure: "block"` (Claude Code >= 2.1.295).
  `onFailure` no tiene efecto en Stop.
- Matcher: `Bash` solo casa con la herramienta Bash. En Windows Claude puede
  usar la herramienta **PowerShell**, asi que el freno de merge necesita
  `Bash|PowerShell`. El filtro `if: "Bash(git merge *)"` es best-effort segun
  la propia documentacion: el hook debe volver a comprobar el comando.
- `stop_hook_active`: la pagina lo referencia en la seccion Stop pero no la he
  leido entera (la descarga se trunca antes). Queda como **hipotesis H5 a
  confirmar**, no como hecho.

### Que se crea, en orden

1. `taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json` con dos
   entradas de prueba en forma exec: Stop y PreToolUse (`Bash|PowerShell`).
2. `.../hooks/sonda-hooks.mjs`: script Node sin dependencias que, segun una
   variable `TASKCODE_SONDA_MODO`, registra el JSON recibido en un fichero
   (`TASKCODE_SONDA_LOG`) y sale con 0 o 2. Sin la variable no hace nada y
   sale 0, de modo que instalado no molesta. Es el fixture que reutilizaran
   TASK-071 y TASK-072.
3. Steps nuevos en `.github/workflows/ci.yml`, en el job de Windows y en el de
   Linux, siguiendo el patron ya probado (un step por hipotesis con
   `continue-on-error: true`, el verde/rojo ES la respuesta): ejecutar el
   script por la forma exec con un JSON de ejemplo en stdin y aseverar
   salida, codigo y fichero de log. El job `claude plugin validate` ya
   existente valida que `hooks.json` es aceptado.
4. `docs/spikes/TASK-069-resultado.md` con cada hipotesis, CONFIRMADA o
   REFUTADA, y su evidencia (step del CI, cita de la documentacion o prueba
   manual con fecha).

### Hipotesis

| # | Hipotesis | Como se confirma |
|---|---|---|
| H1 | `hooks/hooks.json` del plugin es aceptado | `claude plugin validate` en CI |
| H2 | El script corre por forma exec en Windows nativo y Linux | steps CI windows-latest y ubuntu |
| H3 | Exit 2 en Stop hace que el agente siga trabajando | sesion real de Claude Code (ver decision 1) |
| H4 | PreToolUse bloquea `git merge` y Claude recibe el motivo, tambien por PowerShell | sesion real (decision 1) |
| H5 | `stop_hook_active` llega `true` en el reintento y permite cortar el bucle | sesion real, leyendo el log de la sonda |
| H6 | El hook se dispara dentro de subagentes (PreToolUse) | documentacion + sesion real |

## Lo que el rol no cubrio

- Riesgos (rol no lanzado): no se ha mirado a fondo el coste de que el Stop
  hook corra en CADA final de turno; se anota abajo como riesgo para TASK-071.
- Testing (rol no lanzado): el plan de pruebas de abajo es el minimo de un
  spike, no una estrategia.
- Dominio: no aplica (no hay reglas de negocio).
- Criterio 2 dice "PowerShell tool y Git Bash": con forma exec el hook no pasa
  por ningun shell, asi que se cubre con H2 y se documenta por que la
  distincion deja de importar. Si la persona quiere ademas probar la forma
  shell, es decision 2.

## Riesgos aceptados y que los contiene

- **H3-H6 no se pueden probar sin un agente real.** El CI solo prueba la
  mecanica del script, no la reaccion de Claude Code. Lo contiene la
  decision 1.
- **Stop corre en cada turno**: la sonda sale 0 sin variable de entorno, coste
  despreciable. Para TASK-071 queda anotado que el hook real debe salir sin
  trabajo si no hay tarea en curso.
- **Timeout en PreToolUse no bloquea por defecto**: TASK-072 tendra que usar
  `onFailure: "block"` y fijar version minima de Claude Code; se documenta.
- **Version de Claude Code de Carlos**: `onFailure` exige >= 2.1.295; se
  anotara la version usada en la prueba manual.

## Plan de pruebas

- CI (deterministas): H1, H2 en Windows y Linux, mas un step que asevera que
  sin `TASKCODE_SONDA_MODO` la sonda sale 0 sin escribir nada.
- Manual en IntelliJ (o `claude -p`, segun decision 1): con
  `claude --plugin-dir <ruta>`, `TASKCODE_SONDA_MODO=stop2` una vez para H3/H5
  y `pre2` con un `git merge` inofensivo en un repo temporal para H4/H6;
  pegar en el resultado las lineas del log de la sonda y lo que respondio
  Claude.
- Suite existente intacta: este spike no toca `src/`.

## Lo que necesita decision de una persona

1. **Como se prueban H3-H6** (las que necesitan un agente real):
   a) prueba manual de Carlos en IntelliJ siguiendo un guion de 5 minutos
      que dejo escrito en el resultado; o
   b) un step de CI con `claude -p` y un secreto `ANTHROPIC_API_KEY` en el
      repo (automatizable, pero cuesta tokens en cada ejecucion y anade un
      secreto).
   Recomendacion: a), y b) solo si en el futuro se quiere regresion continua.
2. Si se prueba tambien la forma shell (Git Bash / PowerShell) o basta con la
   forma exec. Recomendacion: basta exec; es la que usaran TASK-071/072.
3. Si `hooks.json` con la sonda se queda en el plugin publicado (inerte sin la
   variable) o en una carpeta de fixtures fuera del plugin. Recomendacion:
   dentro, porque TASK-071 lo sustituye por el hook real en la siguiente
   version y asi la mecanica de carga ya queda probada.
