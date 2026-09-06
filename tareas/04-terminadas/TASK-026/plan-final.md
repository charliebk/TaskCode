# Plan — TASK-026: Wrappers de Git-Flow en taskctl: diagnose, pause, resume, recover y abort-merge

## Enfoque propuesto

### 1. El problema real no es enrutar a `bash`, es el stdin

`runGitflowScript` invoca hoy con `stdin: 'ignore'`, y eso está decidido a
conciencia (TASK-007 y TASK-009): los scripts del ciclo de vida no deben
preguntar nada, y si alguno preguntara, EOF inmediato es un fallo
determinista en vez de un proceso colgado.

Los cinco scripts de este item juegan al revés. Cuatro preguntan:

| Script | Pregunta | Qué contesta EOF hoy |
|---|---|---|
| `pause-work.sh` | commit, stash o cancelar | cadena vacía, cae a la rama por defecto del case, `Opcion no reconocida` y **exit 1** |
| `abort-merge.sh` | confirmar el abort | no confirma: **no aborta nunca** y sale 0 |
| `resume-work.sh` | aplicar el stash de la rama | el default es **sí**: lo aplica sin preguntar |
| `recover-branch.sh` | sobreescribir la rama local | el default es **no**: cancela y sale 0 |
| `diagnose-repo.sh` | no pregunta nada | no aplica |

Así que el wrapper hace dos cosas: **hereda stdin** (para que en una
terminal la persona pueda contestar, que es como estos scripts se usan
desde siempre) y **corta antes de invocar** cuando sabe que no hay a quién
preguntar y el default del script no vale.

### 2. Piezas

**`src/fs/gitflow-runner.ts`** — `RunGitflowScriptOptions` gana
`stdin?: 'ignore' | 'inherit'`, con `'ignore'` por defecto. Ni un cambio
en `start`, `review` ni `finish`; el comentario de cabecera pasa a explicar
los dos casos en vez de uno.

**`src/fs/git.ts`** — dos consultas nuevas, del mismo tamaño que las que ya
hay:
- `isGitRepo(cwd)`: `git rev-parse --git-dir`, sin lanzar si devuelve algo
  distinto de 0.
- `operacionEnCurso(cwd)`: devuelve `merge`, `rebase` o `null`, resolviendo
  las rutas con `git rev-parse --git-path` (worktrees incluidos) y mirando
  `MERGE_HEAD`, `rebase-merge` y `rebase-apply` — exactamente los mismos
  tres testigos que mira `abort-merge.sh`.

**`src/commands/wrappers.ts`** (nuevo) — una tabla con los cinco comandos y
un único `runWrapperCommand(nombre, argv, { repoCwd, scriptsDir, interactivo })`.
No importa nada de `tareas/`, `state-machine` ni `task-store`: estos
comandos son del repositorio, no del ciclo de vida de una tarea.

**`src/cli.ts`** — despacho y `--help`. El código de salida que devuelve el
script se propaga tal cual.

### 3. Reglas, comando a comando

| Comando | Script | Argumentos que acepta | Corta si no hay terminal cuando... |
|---|---|---|---|
| `diagnose` | `diagnose-repo.sh` | ninguno | nunca (no pregunta) |
| `pause` | `pause-work.sh` | `--push`, `-p` | el workspace está sucio |
| `resume` | `resume-work.sh` | `[rama]` | no se pasó rama |
| `recover` | `recover-branch.sh` | `[rama]` | no se pasó rama |
| `abort-merge` | `abort-merge.sh` | ninguno | hay un merge o un rebase en curso |

Precondición común a los cinco: estar dentro de un repositorio Git. Si no,
error de taskctl y **sin lanzar `bash`** — hoy cada script reacciona de una
manera distinta a eso, desde un informe con los campos vacíos hasta
`No estas en ninguna rama`.

Validación de argumentos en taskctl, no en el script: `parseArgs` ignora en
silencio lo que no conoce y los bucles `while` de los scripts se tragan
cualquier cosa como nombre de rama, así que hoy `taskctl resume --push mi-rama`
intentaría retomar una rama llamada `--push`. Un argumento desconocido, un
segundo nombre de rama o un nombre que no pase `git check-ref-format`
abortan con error antes de invocar nada.

Cuando el comando puede seguir sin terminal pero el script todavía podría
preguntar algo (`resume` y `recover` con rama), se emite un `[AVISO]` que
dice qué default va a tomar. Sin terminal y sin nada que preguntar
(`diagnose`, `pause` con el workspace limpio) no se avisa de nada.

### 4. Qué NO hace esta tarea

- **No toca los scripts.** Ni el bug de `origin` sin guard de
  `resume-work.sh` y `recover-branch.sh` (item **C6**), ni los textos que
  todavía remiten a los menús de IntelliJ (*"usa GitFlow 17 Resume Work"*).
  Envolver y modificar son dos trabajos distintos, y el segundo ya tiene
  item propio.
- **No añade modos no interactivos a `pause`.** Un `pause --stash` o
  `pause --commit -m ...` haría el comando usable por un agente sin
  terminal, que es la limitación real que deja esta tarea. Pero eso es
  inventar interfaz nueva sobre la capa que la metodología declara única
  fuente de verdad para Git-Flow (§7.1), no envolver la que hay. Queda
  anotado como consecuencia, no resuelto a escondidas.
- **No aplica la precondición de rama base de la §8.3.** Sería
  contradictorio: `pause` existe precisamente para el workspace sucio que
  esa precondición rechaza, y `resume` y `recover` cambian de rama por
  definición.

### 5. Tests

`test/commands/wrappers.test.ts`, contra repos Git temporales de verdad:

- `diagnose` en un repo real: sale 0.
- Los cinco fuera de un repositorio Git: error de taskctl, `bash` sin
  lanzar.
- Argumentos: `diagnose --foo`, `abort-merge rama`, `pause --bar`,
  `resume a b`, `resume --push rama`, y un nombre de rama con formato
  inválido.
- `pause` sin terminal con el workspace sucio: aborta **y el workspace
  sigue exactamente igual** (sin stash nuevo, sin commit nuevo).
- `pause` sin terminal con el workspace limpio: sale 0.
- `abort-merge` sin nada en curso: sale 0.
- `abort-merge` sin terminal **con un merge en conflicto de verdad**:
  aborta y el merge **sigue en curso** (`MERGE_HEAD` intacto).
- `resume` y `recover` sin rama y sin terminal: error que dice la forma
  correcta de invocarlo.
- Propagación del código de salida del script con uno que falla de verdad.

Y la prueba de que stdin se hereda de punta a punta, que es el corazón de
la tarea: repo con `origin` real (segundo repo temporal), una rama con un
stash `pause: <rama>` de verdad, y `node bin/taskctl resume <rama>`
lanzado como proceso hijo con `input` igual a la respuesta escrita. Con la
respuesta `n` el stash sigue en la lista; con `s`, se aplica y desaparece.
Con `stdin: 'ignore'` los dos casos darían el mismo resultado, así que el
test falla si alguien revierte la opción.

`test/fs/gitflow-runner.test.ts` añade el caso de que la opción por defecto
sigue siendo `'ignore'`.

## Alternativas consideradas

**Heredar stdin siempre, también en `start`, `review` y `finish`.**
Descartada: el motivo de `'ignore'` sigue vigente. Un script del ciclo de
vida que llegue a preguntar algo es un bug, y con stdin heredado ese bug se
convierte en un `taskctl finish` colgado esperando en una tubería que nadie
va a cerrar. La opción por defecto no cambia.

**Guardar solo con un `[AVISO]`, sin abortar nunca.** Descartada para
`pause` y `abort-merge`: avisar y ejecutar igual deja que `pause` salga con
código 1 y un mensaje del script sobre una opción que la persona nunca
eligió, y que `abort-merge` diga que ha terminado sin haber abortado nada.
Un comando que hace lo contrario de lo que dice es, por la clasificación de
este proyecto, un CRÍTICO. Se corta antes.

**Detectar la interactividad dentro de `wrappers.ts`** (leyendo
`process.stdin.isTTY` ahí). Descartada: la decide `cli.ts` y se pasa como
opción, para que los tests puedan recorrer las dos ramas sin falsear una
TTY — el mismo patrón que ya usan `repoCwd` y `scriptsDir`.

## Riesgos o preguntas abiertas

1. **`isTTY` es más estricto que la realidad.** Un `taskctl pause` con las
   respuestas llegando por una tubería podría funcionar y el guard lo
   rechaza. Es deliberado: distinguir "tubería con respuestas" de "tubería
   vacía" solo se puede hacer leyendo, y leer stdin desde taskctl le
   robaría al script la respuesta. Se prefiere rechazar de más con un
   mensaje claro que hacer lo contrario de lo anunciado.
2. **`taskctl pause` sigue sin servirle a un agente sin terminal**, que es
   justo quien más lo necesitaría (ver el apartado 4). Lo que gana hoy es
   que el mensaje sea cierto en vez de un `Opcion no reconocida` con la
   respuesta vacía.
3. **`resume` y `recover` no funcionan sin `origin`** por el bug de C6, y
   el wrapper no lo tapa. En un repo sin remoto los dos fallarán en su
   `fetch origin`. Se documenta, se deja para C6.
4. **El test de herencia de stdin depende de que el prompt del stash de
   `resume-work.sh` no cambie.** Si alguien reescribe ese script, el test
   se cae — y es lo correcto: es el único punto del sistema donde se
   comprueba de verdad que una respuesta escrita llega al `read` del script.