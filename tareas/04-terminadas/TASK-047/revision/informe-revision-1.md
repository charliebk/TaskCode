# Informe de revision — TASK-047 (ronda 1)

- Commit revisado: 21366cad732332237818dc01299053c582fe4780
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Puerta determinista

Clon limpio de la rama, `npm install` y `npm test` (una sola pasada): 1080 tests, 1077 pasan, 3 fallan: los tres conocidos de Windows (approve "propaga cualquier error de stat", plan "propaga cualquier error de escritura", plan "rama base real ... estado distinto"). Sin cuarto rojo ni EBUSY. No hay linter configurado.

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MENOR-1 | MENOR | abierto | src/cli/args.ts:103-116 |
| MENOR-2 | MENOR | abierto | src/cli/args.ts:105 |

### MENOR-1 — `--flag=valor` sobre un flag booleano pasa la guarda y se ignora
- Donde: `rechazarFlagsDesconocidos` (solo mira el nombre antes del `=`) frente a `siguiente.ts` (`argv.includes('--json')`) y `extraerPushFlag`.
- Reproduccion: `taskctl siguiente TASK-001 --json=1` sale con codigo 0 y texto plano, no JSON. `taskctl finish TASK-001 --push=1` pasa la guarda y no empuja. Es la clase de fallo silencioso que la tarea quiere eliminar, pero solo para booleanos con `=`. `board --escribir=true` si da error propio, asi que hay precedente de rechazarlo.
- Impacto: quien escribe `--json=true` recibe texto sin aviso. De borde.
- Sugerencia: rechazar `--x=valor` cuando `--x` no admite valor. Se puede dejar para una tarea posterior.

### MENOR-2 — un `--` suelto se rechaza como flag desconocido
- Donde: src/cli/args.ts:105.
- Reproduccion: `taskctl board --` da `flag desconocido "--"`. Antes se ignoraba. Es coherente con "abortar ante lo no declarado" y ningun comando usa `--` como fin de opciones. Aceptable; solo se documenta.

## Verificacion ejecutada (sin otros hallazgos)

- Auditoria de los flags que lee cada comando contra su `FLAGS_<CMD>`: `new`, `import`, `board`, `plan`, `start`, `approve`, `review`, `finish`, `codex-review`, `veredicto`, `siguiente`, `pausa` y `cadena` coinciden. `--cadena` lo quita cli.ts antes de despachar. Los wrappers (`diagnose` etc.) tienen su propia guarda previa.
- CLI real (`node bin/taskctl`) en repo Git temporal:
  - `new --complejida trivial` aborta con sugerencia "--complejidad" y la lista de validos, sin crear tarea.
  - `--titulo=--urgente` crea la tarea.
  - `--titulo --urgente` aborta.
  - `--sprint -1` y `--sprint=-1` llegan al error propio de entero no negativo, no al de flag desconocido.
  - `board --asignado_a x` (alias) pasa; `board -x` aborta.
  - `approve --decidido_por x` sugiere `--decidido-por`.
  - `finish --pus` sugiere `--push`.
  - `import --titulo` aborta.
  - `codex-review --modelo` aborta.
  - `cadena comprobar zz --foo` aborta.
  - `cadena abrir` y `cadena cerrar --forzar` funcionan.
  - La guarda de cadena sigue bloqueando los comandos que escriben.
- Mutacion: quitada la guarda de `finish` y la de `codex-review`, y forzada a `true` la puerta de `ultimaRondaAprobada` en codex-review. Se ponen rojos los tests main de finish y de codex-review ("flag inventado aborta antes de cualquier efecto") y el de "rechaza si la revision primaria no esta aprobada". Hay red de regresion.
- `ultimaRondaAprobada` es el mismo criterio fail-closed que el que tenia finish (todos los informes de la ultima ronda). `INFORME_CODEX_RE` se reexporta desde codex-review y siguiente.ts importa de rondas.ts. Sin ciclo.
- Salida de review: `Lanza el agente "<agente_revisor>" (modelo <modelo_sugerido>) cargando la skill "<revisor>"`, y la peticion lleva "Agente a lanzar" y "Skill revisora a cargar" por separado (visible en la propia peticion de esta ronda). Cubierto por test/commands/review.test.ts. No pude recorrer plan→start→review a mano en el repo temporal porque `plan` exige criterios no vagos y brainstorm; me apoye en el test.
- Refactor de `masParecida`/`distanciaEdicion` a core/sugerencia.ts: misma logica que las tres copias eliminadas; los tests de config, heuristica y catalogo siguen verdes.
