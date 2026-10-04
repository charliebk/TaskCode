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
| `automatico` | Las preguntas se hacen en `plan`; el resto se encadena hasta `finish` |

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

- **`detener`** (modo `manual`): no encadenar nada. Terminar diciendo a la
  persona, en una linea, el `motivo` y la skill de la siguiente fase con su
  ID, por ejemplo `/taskcode-plugin:approve TASK-NNN`. Si la tarea esta
  terminada, decirlo y nada mas.
- **`preguntar`** y **`continuar`**: los modos `semiautomatico` y
  `automatico` todavia no encadenan fases desde las skills. Hasta entonces se
  tratan exactamente igual que `detener`: es el fallo seguro, nunca se avanza
  de mas.

## Reglas que no cambian con el modo

- Antes de cualquier `taskctl`, situarse en la raiz del repo:
  `cd "$(git rev-parse --show-toplevel)"`.
- Si un `taskctl` falla, parar y mostrar su error tal cual: dice que hacer.
  No reintentar ni saltarse el paso editando ficheros a mano.
- Las guardas del CLI (limite de trabajo en curso, rama base limpia, revisor
  independiente, veredicto, segunda opinion) no se rodean en ningun modo.
