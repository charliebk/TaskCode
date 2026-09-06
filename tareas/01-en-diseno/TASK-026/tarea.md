---
id: TASK-026
titulo: "Wrappers de Git-Flow en taskctl: diagnose, pause, resume, recover y abort-merge"
tipo: feature
sprint: 2
etiquetas: [cli, gitflow, wrappers]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
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
- [ ] Los cinco comandos existen, salen en `--help` y en la lista de comandos, y ejecutan su script en el repo desde el que se invoca `taskctl`.
- [ ] El código de salida del script se propaga tal cual, sin colapsarlo a 0 o 1: un `pause` cancelado sale 0 y uno con opción no reconocida sale 1.
- [ ] Los cinco heredan stdin, de forma que las preguntas de los scripts se pueden contestar desde la terminal. Los comandos del ciclo de vida (`start`, `review`, `finish`) siguen invocando con `stdin: 'ignore'`, sin cambio de comportamiento ni de tests.
- [ ] Sin terminal interactiva, taskctl **aborta antes de invocar el script** en los casos en que la respuesta importa y nadie la puede dar: `pause` con el workspace sucio, `abort-merge` con un merge o rebase en curso, y `resume` o `recover` sin nombre de rama. El mensaje dice qué hacer, no solo qué falta.
- [ ] Sin terminal interactiva pero en un caso que sí puede seguir (`diagnose`, `pause` con workspace limpio, `resume` o `recover` con rama), el comando funciona igual; si el script todavía podría preguntar algo, se avisa de que tomará su valor por defecto.
- [ ] Los argumentos se validan en taskctl en vez de pasarse a ciegas: `pause` acepta `--push` y `-p`, `resume` y `recover` aceptan un nombre de rama opcional, `diagnose` y `abort-merge` no aceptan ninguno. Un argumento desconocido, o dos ramas, abortan con error (hoy `resume --push mi-rama` se llevaría `--push` como nombre de rama).
- [ ] Fuera de un repositorio Git los cinco abortan con un mensaje único de taskctl, sin llegar a lanzar `bash`.
- [ ] Ninguno de los cinco lee ni escribe `tareas/`, ni aplica la máquina de estados, ni la precondición de rama base de la §8.3 (`pause` existe justamente para el workspace sucio que esa precondición rechaza).
- [ ] Tests contra repos Git temporales reales, con un merge en conflicto de verdad para `abort-merge` y un workspace sucio de verdad para `pause`.
- [ ] Smoke test manual en un clon del repo real, sobre la rama de la tarea.