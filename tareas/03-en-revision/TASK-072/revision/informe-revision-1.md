# Informe de revision — TASK-072 (ronda 1)

- Commit revisado: 05fd80e659723445971abf78e0a1c13c19ec880d
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer, independiente de la implementacion
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-072 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/comando-merge.ts (analizarComando, rama de shells) | implementacion |
| MEN-2 | MENOR | abierto | src/core/comando-merge.ts (ramaDeCambio) | implementacion |
| MEN-3 | MENOR | abierto | src/commands/finish-verificacion.ts (puertaVerificacion, guardarMemo) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos CRITICO ni IMPORTANTE. El revisor propuso `aprobada-con-correcciones`; en modo
automatico lo revisado es lo que se mergea, asi que el orquestador lo registra como
`cambios-solicitados` para corregir los tres MENOR (baratos) en la ronda 2.

## Reproduccion

Entorno: clon en %LOCALAPPDATA%\pruebas-claude\TaskCode\task-072-r1, rama de la tarea,
`npm install && npm run build` sin errores (clon borrado al terminar).

- `guardia-merge.test.js`, `finish-verificacion.test.js` y `freno-stop.test.js`: 40/40 en verde.
- Todos los `finish*.test.js` mas los de `comando-merge`: 122/122 en verde.
- Suite completa no ejecutada por el revisor (la ejecuto el implementador: 1756/1761, los 5 rojos
  conocidos de Windows).

Mutantes (sobre `dist`, ambos detectados):
- Quitar `await puerta()` del camino del script de merge en `finish.js`: 7 rojos en `finish-verificacion`.
- El guardian devuelve 0 en vez de 2 al bloquear: 5 rojos en `guardia-merge`.

Casos adversarios correctos de `analizarComando`: `git checkout develop && git merge feature/x`
(destino develop); `git -c k=v merge`, `GIT_EDITOR=true git merge`, `-m "a && b"`, `--no-ff` tras la
rama; `bash -x scripts/merge-feature-to-develop.sh feature/x`; `git merge-base` y `git merge-tree` no
son merge; `git MERGE` se detecta; `git merge $(...)` y comillas invertidas quedan como fuente no
resoluble y bloquean hacia una rama protegida; `git merge --ff-only origin/develop` en develop pasa
por la guarda de `origin/<destino>`.

### MEN-1 — `bash -c "..."` y `powershell -Command "..."` esquivan el guardian

`analizarComando('bash -c "git checkout develop && git merge feature/x"')` y
`analizarComando('powershell -Command "git merge feature/x"')` devuelven `[]`: el codigo salta las
opciones del shell y toma la cadena de `-c` como nombre de script, sin reanalizarla. Es una forma
frecuente en agentes, no un caso hostil. Arreglo: reanalizar recursivamente el argumento de
`-c` / `-Command`.

### MEN-2 — `git checkout <rama> <fichero>` sin `--` se toma por cambio de rama

`analizarComando('git checkout develop src/a.ts && git merge develop')` da `destino: "develop"`,
pero ese checkout restaura un fichero y no cambia de rama. Falso positivo hacia el lado seguro
(bloquea un merge legitimo). Arreglo: con mas de un posicional sin `--`, no es un cambio de rama.

### MEN-3 — `finish` guarda un memo inutil cuando la verificacion ensucia el arbol

La huella se calcula despues de verificar; si el comando ensucia el arbol, incluye esos ficheros y
el memo no lo casara nunca el guardian. Sin consecuencia funcional (ese camino aborta justo
despues). Arreglo: guardar el memo solo con el arbol limpio.

## Cobertura de las decisiones D1-D4

- D1: implementado y cubierto (sin verde bloquea; backmerge de recuperacion pasa por ser ancestro de main).
- D2: `hooks.json` sin `if`; el punto de entrada sale sin cargar nada si no hay `merge`.
- D3: `finish` ejecuta siempre y deja el memo con la huella del commit.
- D4: `puerta()` solo en los caminos de abrir el MR y del script.

## Limites de la revision

No probo el hook dentro de Claude Code real (lo hizo el implementador: smoke con 2.1.318 y
`--plugin-dir`, bloqueo de `git checkout develop && git merge --no-ff -m prueba feature/x`).
