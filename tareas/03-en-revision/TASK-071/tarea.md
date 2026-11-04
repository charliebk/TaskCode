---
id: TASK-071
titulo: "Hook Stop: una tarea no se da por hecha con la verificacion en rojo"
tipo: feature
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-071-hook-stop-una-tarea-no-se-da-por-hecha-c
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1594186
tokens_implementacion: null
tokens_revision: 4591552
creado: 2026-11-03
actualizado: 2026-11-04
dependencias: [TASK-069, TASK-070]
---
## Objetivo

Freno 12 de brakes: si hay una tarea en curso, el agente no puede terminar su turno mientras comando_verificacion falle.

## Criterios de aceptacion
- [x] hooks/hooks.json del plugin declara un Stop hook en Node sin dependencias de runtime
- [x] El hook solo actua si existe una tarea en 02-en-curso/ en la rama actual y comando_verificacion esta definido; en cualquier otro caso sale 0 sin coste
- [x] Con la verificacion en rojo devuelve exit 2 y por stderr el comando, el codigo de salida, la duracion y la cola de la salida, acotada en tamano
- [x] Respeta stop_hook_active para no entrar en bucle y respeta timeout_verificacion
- [x] Tests contra un repo temporal real: verde deja parar, rojo bloquea, sin tarea no hace nada, timeout

## Resultado

Implementado:
- `hooks/hooks.json`: el `Stop` pasa de la sonda de TASK-069 al freno real, en forma exec
  (`node ${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/stop-verificacion.js`) con `timeout` 3600; descripcion
  neutra. El `PreToolUse` sigue siendo la sonda inerte hasta TASK-072 (la sonda, su test y los steps
  H2/H2b del CI no cambian: la invocan directamente).
- `src/hooks/stop-verificacion.ts` (entrada: lee stdin, decide, sale 0 o 2; nunca 1) y
  `src/hooks/freno-stop.ts` (`decidirStop`, que no lanza). Guardas de la mas barata a la mas cara:
  interruptor `FRENO_VERIFICACION=0`, `stop_hook_active`, `stat` de `tareas/02-en-curso/`, lectura de
  las tareas, config, y solo entonces el unico `git` (rama actual). Fuera de un proyecto con tareas
  en curso no se lanza ningun proceso.
- `src/fs/ejecucion-acotada.ts`: envoltorio extraido de `sincronizacion.ts` (shell, stdin cerrado,
  kill del arbol al cortar, salida a fichero), con salida unida y lectura solo de la cola.
  `sincronizacion.ts` lo importa; su suite (25 tests) sigue en verde.
- `src/fs/verificacion.ts`: `ejecutarVerificacion` (pieza comun con TASK-072) y memo por huella del
  arbol (HEAD, comando, timeout, contenido de lo sucio) en `.git/freno-verificacion.json`.
- `src/core/informe-verificacion.ts`: informe puro; cola de 40 lineas / 4 KiB sin ANSI, sin CRLF,
  sin credenciales en URLs y sin partir UTF-8. Pide no borrar ni saltar tests para pasar el freno.
- README del plugin (seccion del freno), `SKILL.md` de task-workflow (que hacer si bloquea, texto
  neutro) y CHANGELOG con el cambio de comportamiento avisado.

Decisiones de Carlos en el plan: con la clave basta para activar el freno; config invalida con
tarea en curso en la rama BLOQUEA una vez (desviacion consciente del «en cualquier otro caso sale 0»
del criterio 2); memo de verdes y rojos. Resueltas por el orquestador: interruptor
`FRENO_VERIFICACION=0`, tope `min(timeout_verificacion, 3540)` s, primera guarda sin procesos.

Riesgos aceptados (plan): el freno es de un disparo por turno (`stop_hook_active`); HEAD desacoplado
o rama sin tarea salen 0; un rojo memorizado no se reintenta hasta que cambie el arbol; los
subagentes (`SubagentStop`) no se frenan. MEN-5 y MEN-6 de TASK-069 (limites de la sonda y de la
regex del merge guard) se reaceptan para TASK-072, que sustituye ese `PreToolUse`.

Verificacion:
- Suite completa 1733/1739: los 5 rojos conocidos de Windows (symlink EPERM, chmod de directorio,
  CRLF, 2 contrapruebas de descubrimiento de TASK-075) y `origin-deteccion` (TASK-038), intermitente
  bajo carga: aislado pasa 5/5 dos veces y no toca nada de esta tarea.
- Tests del freno 18/18 contra repos Git temporales reales (verde, rojo, sin tarea, rama ajena, sin
  comando, stop_hook_active, interruptor, timeout, tope, config invalida, memo, cola acotada,
  ilegibles, arbol ensuciado, punto de entrada real por stdin, `hooks.json`).
- Smoke con Claude Code real (`claude -p --plugin-dir` de la rama, 2.1.318): el freno bloqueo el
  fin de turno, el agente recibio el informe y siguio (2 turnos), reutilizo el rojo memorizado sin
  reejecutar, y en el segundo Stop (`stop_hook_active`) dejo terminar; el agente dijo que el rojo no
  era suyo y no hizo trampas con el test.

Revision por pares, 2 rondas:
- Ronda 1 (`cambios-solicitados`; el revisor propuso `aprobada-con-correcciones`, pero con
  IMPORTANTE abiertos la regla es pedir cambios): IMP-1 (ningun test cubria la huella por contenido)
  e IMP-2 (ningun test cubria la cota del timeout), corregidos con tests y `timeoutEfectivoS` pura;
  MEN-1 (corte rotulado como truncado), MEN-2 (tarea ilegible apagaba el freno en silencio: ahora
  avisa con exit 0), MEN-3 y MEN-6 (CHANGELOG), MEN-4 (README: ignorados no invalidan el memo),
  MEN-5 («codigo null»), MEN-7 (tests de UTF-8, version del memo y aviso de arbol): corregidos.
- Ronda 2 (`aprobada-con-correcciones`): todo lo anterior verificado, 10 mutantes muertos. MEN-8
  aceptado sin corregir: el salto de continuacion UTF-8 de `leerCola` no tiene test (impacto
  cosmetico; en modo automatico se mergea el codigo revisado).

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-04T14:36:31Z | plan | automatico | persona |
| 2026-11-04T14:57:33Z | approve | automatico | persona |
| 2026-11-04T14:57:34Z | start | automatico | persona |
| 2026-11-04T15:25:58Z | review | automatico | persona |
| 2026-11-04T16:02:05Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-04T14:57:31Z | diseno | agente:a039c44f934621126,a784ea3c4238e61a2,a66d1c8e5dd8b5bcf,a1d7d4e757e52cfb9 | 64 | 270276 | 1282066 | 41780 | 41 | 1594186 |
| 2026-11-04T15:40:42Z | revision | agente:ac167f84eca1a2e6d | 48 | 144024 | 2932935 | 23385 | 2 | 3100392 |
| 2026-11-04T16:16:07Z | revision | agente:a124580c9c5eae6f6 | 28 | 115077 | 1365728 | 10327 | 4 | 1491160 |
