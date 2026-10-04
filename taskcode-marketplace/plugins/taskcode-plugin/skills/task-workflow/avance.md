# Avance entre fases

Lo que hace cada skill de fase al terminar su trabajo. Se decide con el CLI,
no a ojo:

```bash
taskctl siguiente TASK-NNN --json
```

Devuelve `fase`, `comando`, `accion` y `motivo`. La skill no adivina nada
que no diga esa salida.

## Los modos

El modo sale de la clave `modo_flujo` de `.taskcode/config.yml` y se
**congela en la tarea** al ejecutar `plan`: cambiar el config despues no
cambia el modo de esa tarea.

| Modo | Que pasa al cerrar una fase |
|---|---|
| `manual` (por defecto) | Nada se encadena: la skill termina nombrando la siguiente |
| `semiautomatico` | Se pregunta si seguir; un no queda registrado con `taskctl pausa` |
| `automatico` | Las preguntas se hacen en `plan`; el resto se encadena hasta `finish`, implementacion y correcciones incluidas |

En cualquier modo, hotfix y release preguntan antes de `finish`, nunca se
sube nada con `--push` sin que la persona lo pida, y cada transicion deja
una fila en la seccion `## Transiciones` de `tarea.md` (fecha, fase, modo y
quien decidio) en el mismo commit que la transicion.

## Que skill corresponde a cada fase

| `fase` de `siguiente` | Skill |
|---|---|
| `plan` | `/taskcode-plugin:plan` |
| `approve` | `/taskcode-plugin:approve` |
| `start` | `/taskcode-plugin:start` |
| `review` | `/taskcode-plugin:review` |
| `veredicto` | `/taskcode-plugin:review` |
| `codex-review` | `/taskcode-plugin:review` |
| `veredicto-codex` | `/taskcode-plugin:review` (no lanza nada: el veredicto de la segunda opinion lo decide una persona) |
| `finish` | `/taskcode-plugin:finish` |
| `terminada` | ninguna: la tarea esta cerrada |

`fase: review` con la tarea en curso significa: primero implementar el plan,
commitearlo y dejar la suite en verde; despues, la revision.

## Que hacer segun `accion`

- **`detener`**: no encadenar nada. Terminar diciendo a la
  persona, en una linea, el `motivo` y la skill de la siguiente fase con su
  ID, por ejemplo `/taskcode-plugin:approve TASK-NNN`. Si la tarea esta
  terminada, decirlo y nada mas. Si habia una cadena abierta, cerrarla.
- **`preguntar`**: preguntar a la persona con AskUserQuestion si pasar a la
  siguiente fase, con el `motivo` y dos opciones.
  - **Si**: encadenar la skill siguiente (abajo).
  - **No**: ejecutar `taskctl pausa TASK-NNN` (deja el «no» en el registro de
    la tarea, sin cambiar su estado), cerrar la cadena y terminar nombrando la
    skill que la reanuda.
- **`continuar`**: encadenar la skill siguiente sin preguntar.

Cuando lo que falta es trabajo y no una fase (`review` con la tarea
`en-curso`: implementar; o tras un `cambios-solicitados`: corregir),
`siguiente` devuelve `detener` en manual y semiautomatico: la skill termina
diciendo que toca hacer ese trabajo, commitearlo y despues
`/taskcode-plugin:review TASK-NNN`. En `automatico` devuelve `continuar`: el
trabajo lo hace la skill (`start` implementa, `review` corrige) y sigue.

En `automatico`, `siguiente` solo pregunta en sus guardas: aprobar una tarea
sin modo congelado, cerrar hotfix o release, cerrar con algun informe que no
este en un commit propio posterior al codigo, otra ronda desde la ronda 3, y
el veredicto de la segunda opinion.

## Encadenar la skill siguiente (la cadena)

Mientras una cadena de fases esta en marcha, el arbol de trabajo queda
bloqueado para otras sesiones (dos sesiones encadenando sobre el mismo arbol
se pisan las ramas). La cadena se identifica con un testigo:

1. Si esta skill recibio `--cadena <testigo>` en `$ARGUMENTS`, la cadena ya
   esta abierta: usa ese testigo. Si no, abrela ahora:
   `taskctl cadena abrir TASK-NNN` imprime el testigo. Si aborta porque hay
   otra cadena en marcha, muestra el error tal cual y para.
2. Invoca la skill de la siguiente fase con la herramienta Skill:
   `taskcode-plugin:<skill>` con argumentos `TASK-NNN --cadena <testigo>`.
3. Cerrar la cadena: `taskctl cadena cerrar <testigo>`, cuando la cadena se
   detiene (un `detener`, un «no», un error o la tarea terminada). Solo la
   cierra quien tiene el testigo.

Una skill que recibe `--cadena <testigo>` empieza, despues de situarse en la
raiz, con `taskctl cadena comprobar <testigo>`; si falla, para y muestra el
error. Y pasa `--cadena <testigo>` a cada `taskctl` que escriba o cambie de
rama (`plan`, `approve`, `start`, `review`, `veredicto`, `codex-review`,
`finish`, `pausa`...): **el CLI rechaza esos comandos mientras haya una cadena
abierta sin su testigo**, asi que una segunda sesion no puede tocar el arbol
aunque no pase por `cadena abrir`. En modo `manual` no hay cadena.

**Un «no» o un error cierran la cadena**, en este orden:
- un «no»: primero `taskctl pausa TASK-NNN --cadena <testigo>` (con la cadena
  aun abierta, o el CLI lo rechaza y el «no» no queda registrado), despues
  `taskctl cadena cerrar <testigo>`;
- un error de un `taskctl`: `taskctl cadena cerrar <testigo>` y despues
  muestra el error.
En los dos casos la skill termina ahi, sin volver a pasar por esta seccion.

## Reglas que no cambian con el modo

- Antes de cualquier `taskctl`, situarse en la raiz del repo:
  `cd "$(git rev-parse --show-toplevel)"`.
- Si un `taskctl` falla, parar y mostrar su error tal cual (con una cadena
  abierta, cerrandola antes): dice que hacer. No reintentar ni saltarse el
  paso editando ficheros a mano.
- Las guardas del CLI (limite de trabajo en curso, rama base limpia, revisor
  independiente, veredicto, segunda opinion) no se rodean en ningun modo.
