# Plan — TASK-058: Flujo D, modo semiautomatico

(Sin brainstorm propio: la heuristica dio "trivial"; el diseno es el del plan
de referencia de TASK-055 y sus riesgos. Lo redacta quien orquesta.)

## Enfoque propuesto

1. **`avance.md`: pasos para `preguntar` y `continuar`.**
   - `preguntar`: AskUserQuestion «¿Pasar a <fase> de TASK-NNN?» con el
     `motivo`. **Si** → invocar la skill de la siguiente fase con la
     herramienta Skill (`taskcode-plugin:<skill>`, argumentos `TASK-NNN
     --cadena <testigo>`). **No** → `taskctl pausa TASK-NNN`, cerrar la cadena
     y terminar nombrando la skill que la reanuda.
   - `continuar`: invocar la skill siguiente con Skill, sin preguntar.
     Se implementa ya en D y no en E: el mecanismo es el mismo que el «si», y
     sin el el semiautomatico se pararia en los pasos internos de la revision
     (veredicto, primera codex-review), que `siguiente` marca `continuar`.
   - Excepcion explicita: `fase: review` con la tarea en curso no se
     encadena (falta implementar); y `veredicto-codex` siempre es de una
     persona (ya devuelve `preguntar`).
   - Hasta E, la aprobacion la sigue dando la persona en la skill `approve`
     aunque se llegue a ella encadenando.
2. **Bloqueo de cadena por arbol de trabajo** (riesgo del plan de
   referencia: dos sesiones sobre el mismo arbol hacen checkout a la vez).
   Fichero `taskcode/cadena.lock` en el directorio de Git
   (`git rev-parse --git-path`, asi vale en worktrees), con tarea, testigo y
   fecha. Subcomando nuevo `taskctl cadena`:
   - `abrir TASK-NNN` → crea el bloqueo y imprime un testigo; si ya hay uno,
     aborta diciendo de que tarea es, desde cuando, y que hacer (esperar a la
     otra sesion o, si ya termino, `taskctl cadena cerrar --forzar`).
   - `comprobar <testigo>` → sale 0 solo si el bloqueo existe con ese
     testigo; si no, aborta con el mismo mensaje.
   - `cerrar <testigo>` / `cerrar --forzar` → lo borra.
   Una sesion no tiene identidad que el CLI pueda ver: el testigo es la
   identidad de la cadena, y viaja como argumento `--cadena` de una skill a
   la siguiente. La primera skill que encadena (sin `--cadena`) la abre; cada
   skill encadenada la comprueba antes de su `taskctl`; se cierra al terminar
   la cadena (`detener`, un «no», o la tarea terminada). En modo manual no
   hay cadena ni bloqueo.
3. **Skills de fase**: aceptan `--cadena <testigo>` en `$ARGUMENTS` y, si
   viene, ejecutan `taskctl cadena comprobar` antes de nada. El resto lo
   gobierna `avance.md`.

## Riesgos aceptados y que los contiene

- Un bloqueo huerfano si la sesion muere a mitad de cadena: el mensaje de
  `abrir` da su antiguedad y el comando para forzar el cierre.
- La herramienta Skill puede pedir permiso segun el modo de la sesion: la
  cadena se para en ese permiso, que es el comportamiento seguro.
- Lo que hace el modelo con AskUserQuestion solo se ve en una sesion real.

## Plan de pruebas

- `test/commands/cadena.test.ts` (repo Git real, CLI por spawn): abrir crea
  el fichero en el directorio de Git (tambien en un worktree enlazado);
  segundo abrir aborta con tarea, antiguedad y el comando para forzar;
  comprobar con testigo bueno 0 y malo != 0; cerrar con testigo ajeno
  aborta; `--forzar` lo borra; el workspace queda limpio (fuera del arbol).
- `test/commands/semiautomatico.test.ts`: con `modo_flujo: semiautomatico`,
  la secuencia que harian las skills: `siguiente` da `preguntar` en approve;
  «no» → `pausa` → `01-en-diseno`, `plan_aprobado: false` y fila `pausa`;
  contraprueba «si» → `approve` → `start` → `02-en-curso`.
- `test/skills/fases.test.ts`: `avance.md` describe `preguntar` (pregunta,
  Skill con `--cadena`, `pausa`) y `continuar`; cada skill de fase comprueba
  la cadena si recibe `--cadena`.
- Smoke en una sesion real de Claude Code: este entorno no autentica `claude
  -p`; se pide a Carlos o queda para la release, documentado.

## Lo que necesita decision de una persona

Nada nuevo. Aprobado por el orquestador bajo la autorizacion de Carlos de
encadenar las entregas A→E.
