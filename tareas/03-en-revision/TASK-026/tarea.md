---
id: TASK-026
titulo: "Wrappers de Git-Flow en taskctl: diagnose, pause, resume, recover y abort-merge"
tipo: feature
sprint: 2
etiquetas: [cli, gitflow, wrappers]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-026-wrappers-de-git-flow-en-taskctl-diagnose
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-06
actualizado: 2026-09-06
dependencias: []
---
## Objetivo

La tabla de la §8 promete cinco **wrappers directos** — `taskctl diagnose`,
`pause`, `resume`, `recover` y `abort-merge` — sobre scripts que ya existen,
ya están migrados al plugin y ya funcionan. No están implementados, y la
§8.3 **ya le dice a la persona que use uno de ellos**: cuando `new`,
`import`, `plan` o `approve` abortan por workspace sucio, el mensaje reza
*"Guárdalos (`taskctl pause`) o comitéalos"* — un comando que no existe.

Envolverlos no es solo enrutar a `bash`. Cuatro de los cinco scripts
preguntan por `read -rp`, y `runGitflowScript` invoca hoy con
`stdin: 'ignore'` **a propósito** (TASK-007 y TASK-009): con EOF inmediato,
`pause` sobre un workspace sucio muere con `Opcion no reconocida: ''` y
`abort-merge` con un merge en curso responde que no y no aborta nada. Los
dos comandos que más falta hacen harían lo contrario de lo que dicen, en
silencio y con el código de salida equivocado.

El wrapper tiene entonces dos trabajos, no uno: heredar stdin para que la
persona pueda contestar, y **cortar antes** los casos en los que sabe que
no hay nadie a quien preguntar y el valor por defecto del script no vale.

Fuera de alcance a propósito: el bug de `origin` sin guard de
`recover-branch.sh` y `resume-work.sh` (item **C6**) — el wrapper no lo
tapa; y los tres scripts de la §7.9 (mirror, switch y push-back), que la
metodología deja explícitamente fuera del flujo de tareas.

## Criterios de aceptacion
- [x] Los cinco comandos existen, salen en `--help` y en la lista de comandos, y ejecutan su script en el repo desde el que se invoca `taskctl`.
- [x] El código de salida del script se propaga tal cual, sin colapsarlo a 0 o 1: un `pause` cancelado sale 0 y uno con opción no reconocida sale 1.
- [x] Los cinco heredan stdin, de forma que las preguntas de los scripts se pueden contestar desde la terminal. Los comandos del ciclo de vida (`start`, `review`, `finish`) siguen invocando con `stdin: 'ignore'`, sin cambio de comportamiento ni de tests.
- [x] Sin terminal interactiva, taskctl **aborta antes de invocar el script** en los casos en que la respuesta importa y nadie la puede dar: `pause` con el workspace sucio, `abort-merge` con un merge o rebase en curso, y `resume` o `recover` sin nombre de rama. El mensaje dice qué hacer, no solo qué falta.
- [x] Sin terminal interactiva pero en un caso que sí puede seguir (`diagnose`, `pause` con workspace limpio, `resume` o `recover` con rama), el comando funciona igual; si el script todavía podría preguntar algo, se avisa de que tomará su valor por defecto.
- [x] Los argumentos se validan en taskctl en vez de pasarse a ciegas: `pause` acepta `--push` y `-p`, `resume` y `recover` aceptan un nombre de rama opcional, `diagnose` y `abort-merge` no aceptan ninguno. Un argumento desconocido, o dos ramas, abortan con error (hoy `resume --push mi-rama` se llevaría `--push` como nombre de rama).
- [x] Fuera de un repositorio Git los cinco abortan con un mensaje único de taskctl, sin llegar a lanzar `bash`.
- [x] Ninguno de los cinco lee ni escribe `tareas/`, ni aplica la máquina de estados, ni la precondición de rama base de la §8.3 (`pause` existe justamente para el workspace sucio que esa precondición rechaza).
- [x] Tests contra repos Git temporales reales, con un merge en conflicto de verdad para `abort-merge` y un workspace sucio de verdad para `pause`.
- [x] Smoke test manual en un clon del repo real, sobre la rama de la tarea.
## Resultado

Cerrada el 2026-09-06. Los cinco wrappers de la tabla de la §8 existen:
`taskctl diagnose`, `pause`, `resume`, `recover` y `abort-merge`. La §8.3
por fin nombra un comando que existe — su mensaje de workspace sucio ya
dice *Guardalos ("taskctl pause") o comitealos*, como el ejemplo de la
metodología, que se había quedado a medias porque el comando no estaba.

**El nudo no era enrutar a `bash`, era el stdin.** Cuatro de los cinco
scripts preguntan con `read -rp`. Con EOF, `pause` sobre un workspace
sucio muere con `Opcion no reconocida` y `abort-merge` no aborta nada y
sale 0: los dos comandos que más falta hacen harían lo contrario de lo
que dicen. La regla que salió de aquí, y que vale para cualquier
invocación futura, está en `HALLAZGOS.md`: **stdin heredado solo cuando
hay terminal, ignorado cuando no la hay**, y guard que corta antes de
invocar cuando el valor por defecto del script sería inaceptable.

Piezas: `src/commands/wrappers.ts` (nuevo), la opción `stdin` de
`runGitflowScript`, tres consultas nuevas en `fs/git.ts`
(`isInsideWorkTree`, `operacionEnCurso`, `isIgnored`) y el despacho en
`cli.ts`. Ninguno de los cinco toca `tareas/`, ni la máquina de estados,
ni la precondición de rama base: sería contradictorio, porque `pause`
existe justamente para el workspace sucio que esa precondición rechaza.

**27 tests nuevos (417).** El que sostiene la tarea vive en
`test/fs/gitflow-runner.test.ts` y lanza un proceso hijo con stdin
controlado: con `inherit` el script lee la respuesta, con el default la
recibe vacía. Es la única forma de distinguirlas — el stdin del proceso
de test no está bajo control.

### Revisión por pares: dos rondas

**Ronda 1 — APROBADO CON CAMBIOS.** 0 críticos, 2 importantes, 7 menores.

1. **IMPORTANTE — `pause` preguntaba igual con el workspace limpio.** Todo
   script de Git-Flow escribe su registro en `logs/gitflow/` dentro del
   repo nada más arrancar, así que en un repo que no lo ignore el script
   **se ensucia el workspace a sí mismo** y pregunta después: con EOF,
   `Opcion no reconocida` y exit 1, exactamente el fallo que este comando
   venía a resolver. Corregido: el guard lo comprueba con
   `git check-ignore` y dice cómo arreglarlo de raíz.
2. **IMPORTANTE — heredar stdin siempre reintroducía el cuelgue** que
   motivó el `stdin: 'ignore'` de TASK-007. Con una tubería abierta que
   nadie cierra (cualquier arnés de agente, y también `node --test`) el
   script esperaba **para siempre**. El revisor lo reprodujo: proceso vivo
   a los 15 s, matado a mano, repo a medias tras checkout y pull.
   Corregido con la regla de arriba.
3. Menores corregidos: el test del default de stdin no discriminaba (3);
   la ayuda prometía que sin terminal siempre se aborta (5); `isGitRepo`
   aceptaba un repo bare y el interior de `.git`, donde `pause` moría con
   el `fatal` crudo de Git y `diagnose` declaraba limpio un workspace
   inexistente — ahora es `isInsideWorkTree` (6); el mensaje de la §8.3 no
   nombraba `taskctl pause` (8); los wrappers descartaban la señal (9).
4. **Menores documentados sin corregir**: `abort-merge` dice "estado
   normal" con un cherry-pick o un revert a medias (4), porque
   `operacionEnCurso` mira **los mismos tres testigos que el script** a
   propósito: detectar más daría dos comportamientos distintos según haya
   terminal o no. Y con HEAD desacoplado y workspace sucio, `pause` culpa
   a la falta de terminal en vez de al HEAD (7): las dos cosas son
   ciertas y la ramificación extra no compensa. Los dos, en `HALLAZGOS.md`
   como deuda de C6.

**Ronda 2 — APROBADO.** 3 menores, uno corregido.

1. **MENOR corregido — el guard nuevo tenía falsos positivos.**
   Preguntaba por `logs/`, y un `.gitignore` con `logs/gitflow/` o con
   `*.log` ignora el registro **sin** ignorar `logs/`. Peor: con un
   fichero trackeado bajo esa ruta (un `.gitkeep`), `git check-ignore` se
   salta la consulta por estar en el índice y contesta que no, con el
   `.gitignore` diciendo lo contrario — y el mensaje aconsejaba añadir
   algo que ya estaba. Ahora se pregunta por el fichero concreto y con
   `--no-index`: por las reglas, no por el estado del índice. El revisor
   probó 7 patrones contra la verdad de campo.
2. **MENOR sin corregir — la misma trampa deja `resume` inservible** en un
   repo que no ignore el registro, y ahí no hay guard: el script aborta
   con *"El workspace no está limpio"* cuando la única suciedad es la que
   creó él. Es preexistente (hallazgo 2 de TASK-007) y el arreglo de raíz
   es del lado de los scripts, item C6; taparlo desde el wrapper
   extendería el guard a un caso que no tiene nada que ver con la
   interactividad. Documentado en `HALLAZGOS.md`.
3. **MENOR sin corregir — la rama de `signal` es inalcanzable en
   Windows**: `spawnSync` devuelve `status=3840, signal=null` ante un
   `kill -TERM`. El código es correcto en Linux y macOS, y es el mismo
   patrón que ya tienen `start`, `review` y `finish`. Sin test, como los
   suyos.

### Limitaciones que quedan, a propósito

- **`taskctl pause` sigue sin servirle a un agente sin terminal**, que es
  quien más lo necesitaría. Lo que gana es que el mensaje sea cierto y
  accionable en vez de un `Opcion no reconocida` con la respuesta vacía.
  Un `pause --stash` o `pause --commit -m ...` lo resolvería, pero eso es
  inventar interfaz sobre la capa que la §7.1 declara única fuente de
  verdad para Git-Flow, no envolver la que hay.
- **Los scripts no se han tocado**: ni el bug de `origin` sin guard de
  `resume-work.sh` y `recover-branch.sh` (C6), ni los mensajes que
  todavía remiten a los menús de IntelliJ ("usa GitFlow 16 Pause Work")
  ahora que esos cuatro comandos existen en `taskctl`.
- **La rama interactiva no se puede probar con una terminal de verdad**
  en esta sesión; se prueba con `interactivo: true` y con el proceso hijo
  de stdin controlado. El revisor sí la ejercitó contra el
  `pause-work.sh` real: `cancelar` no guarda nada, `stash` crea el stash.
- **`plan.test.ts` tiene tests intermitentes bajo carga**: dos veces
  falló uno distinto en la suite completa y pasó al correrlo aislado. No
  es de esta tarea, pero conviene saberlo antes de acusar a un cambio.