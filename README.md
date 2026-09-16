# TaskCode

Metodología de tareas por sprints, revisión por pares de agentes y Git-Flow
determinista, empaquetada como plugin de Claude Code. Este repo es a la vez
**el marketplace privado** que distribuye el plugin y **el proyecto que lo
construye usándose a sí mismo** (dogfooding desde el Sprint 0).

## Instalar el plugin

```
/plugin marketplace add charliebk/TaskCode
/plugin install taskcode-plugin@taskcode-marketplace
```

El repo es privado: hace falta acceso de lectura como colaborador, y las
credenciales Git/GitHub que ya tengas configuradas (SSH o `gh`).

Para desarrollo sobre el propio plugin, sin instalarlo:

```bash
cd taskcode-marketplace/plugins/taskcode-plugin
npm install && npm run build
claude --plugin-dir "$(pwd)"
```

## El CLI

```
taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release>
taskctl import <fichero.md>        # alta masiva desde Markdown
taskctl board [--sprint N] [--asignado_a <persona>] [--escribir]
taskctl plan TASK-NNN              # mueve a diseño, deja scaffold del plan
taskctl approve TASK-NNN           # checkpoint humano
taskctl start TASK-NNN             # crea la rama Git y mueve a en-curso
taskctl review TASK-NNN            # trae la base, mueve a revisión, deja la petición
taskctl finish TASK-NNN            # mergea, cierra y regenera CHANGELOG/INDEX/BOARD
```

`board --escribir` regenera `docs/BOARD.md`; sin ese flag solo lista por
pantalla (es el único comando de solo lectura del CLI). Detalle completo en
[el README del plugin](taskcode-marketplace/plugins/taskcode-plugin/README.md).

## Cómo funciona

Cada tarea es una carpeta con un `tarea.md` (frontmatter YAML + objetivo +
criterios de aceptación) que vive en una de cinco carpetas numeradas según su
estado:

```
tareas/00-planificadas/ → 01-en-diseno/ → 02-en-curso/ → 03-en-revision/ → 04-terminadas/
```

El estado no es decorativo: una máquina de estados formal rechaza el orden
incorrecto antes de tocar nada — ni Git ni carpetas. `taskctl start` sobre una
tarea que no ha pasado por `plan` aborta y te dice qué comando faltaba.

El repo es el tablero: no hay base de datos ni servicio externo. Cada comando
que escribe exige estar en la rama base con el workspace limpio, y cambia de
rama solo si no hay nada que perder.

## Documentación

| Documento | Qué es |
|---|---|
| [`docs/PROPUESTA_METODOLOGIA.md`](docs/PROPUESTA_METODOLOGIA.md) | La metodología completa (v15, congelada). El "por qué" de todo lo demás. |
| [`docs/PLAN_SPRINTS.md`](docs/PLAN_SPRINTS.md) | Plan de ejecución por sprints + métricas reales por tarea. |
| [`docs/contexto/CHECKLIST_TERMINACION.md`](docs/contexto/CHECKLIST_TERMINACION.md) | **Documento vivo**: qué falta, por fases, con casillas marcables. |
| [`docs/contexto/INVENTARIO_PENDIENTE.md`](docs/contexto/INVENTARIO_PENDIENTE.md) | Los huecos que ninguna tarea del plan cubría. |
| [`docs/contexto/INCORPORACION.md`](docs/contexto/INCORPORACION.md) | Guía para incorporar a un nuevo colaborador: acceso, instalación, primera tarea. |
| [`docs/METRICAS.md`](docs/METRICAS.md) | Cobertura, tests y hallazgos de revisión por pares, tarea a tarea. |
| [`docs/spikes/`](docs/spikes/) | Resultados de spikes de validación. |
| [`docs/contexto/`](docs/contexto/) | **Empieza por aquí**: estado, convenciones y hallazgos acumulados. |

## Estado

Sprint 0 y Sprint 1 completos: `new`, `import`, `board`, `plan`, `approve` y
`start` funcionan de punta a punta contra un repo Git real, con 226 tests y
~96% de cobertura. El ciclo `import → plan → approve → start` deja una rama
Git creada de verdad y la tarea en `02-en-curso/`.

El hito de usabilidad diaria es el final de la **Fase B** (`review` + `finish`
+ límite de WIP), no el final del plan — ver el checklist.

## Desarrollo

```bash
cd taskcode-marketplace/plugins/taskcode-plugin
npm install
npm test        # compila y corre la suite con cobertura
```

Cero dependencias de runtime a propósito: el parser de YAML-frontmatter y el
de argumentos están hechos a mano. TypeScript estricto, tests con `node:test`
nativo siempre contra recursos reales (repos Git temporales, nunca mocks).

Cada tarea se trabaja en su propia rama Git y se mergea a `develop` con
`--no-ff`. Las ramas no se borran tras el merge: quedan para auditoría.

## CI

Cada push a `main`/`develop` corre la suite en Linux y en **Windows nativo**.
El job de Windows existe además para responder tres preguntas que llevaban
abiertas desde TASK-006/007 y que no se podían contestar desde un entorno
Linux: si el bit de ejecución de `bin/taskctl` sobrevive un checkout nativo,
si `taskctl` resuelve como comando suelto por PATH, y si los scripts `.sh` de
Git-Flow corren igual bajo Git Bash en Windows.
