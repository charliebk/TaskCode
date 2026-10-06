# Brainstorm — TASK-060, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura (sonnet)

## Enfoque propuesto, con rutas y nombres concretos

`finish` se queda como orquestador y gana dos ramas nuevas:

- **Tag.** Se pone DESPUES del script de Git-Flow, desde TypeScript, sobre el
  commit de merge, con helpers nuevos en `src/fs/git.ts`.
- **MR.** Es un camino nuevo que no ejecuta ningun script de merge: sube la
  rama, abre el PR o MR con `gh`/`glab` y deja la tarea en `en-revision`.
  - El segundo `finish` pregunta al remoto si la rama esta integrada y hace
    ff-pull de la base.
  - Despues entra por la rama idempotente que ya existe
    (`integradaEnDevelop && integradaEnMain`, finish.ts l.359).

## Que se extiende y que se crea

- **`src/core/config.ts`** (se extiende): 9a clave `cierre_por_defecto`.
  - Valores `merge` | `merge-request`; por defecto `merge`.
  - Va en CONFIG_DEFAULTS, en CLAVES_CONFIG, en la tabla del comentario y con
    un `validar*` copiado de `validarModoFlujo`.
  - Es el unico punto de resolucion, y aborta igual que las demas claves.
- **`src/commands/finish.ts`** (se extiende).
  - FLAGS_FINISH suma `--merge-request` y `--tag <nombre>`.
  - `FinishCommandResult` suma `tag` y `mergeRequestUrl`.
  - Solo orquesta: no mete logica de plataforma (ya son unas 490 lineas
    densas).
- **`src/core/plataforma-remota.ts`** (nuevo, puro).
  - `detectarPlataforma(urlOrigin)` devuelve `github` | `gitlab` | null.
  - Cubre ssh y https, y GitLab autoalojado: host que contiene `gitlab`, o
    host desconocido (esto ultimo, a confirmar).
  - No toca disco.
- **`src/fs/merge-request.ts`** (nuevo): `spawnSync` sobre `gh`/`glab`.
  - `comprobarCli`: CLI instalado y autenticado, con mensaje de que instalar.
  - `abrirMergeRequest` y `estadoMergeRequest(rama)`.
  - Patron de `fs/gitflow-runner.ts` y `fs/sincronizacion.ts`.
- **`src/fs/git.ts`** (se extiende): `isValidTagName` (patron de
  `isValidBranchName`, con `check-ref-format`), `tagExists`,
  `crearTagAnotado(nombre, mensaje, ref)`, `pushTag`, `remoteUrl('origin')` y
  `fetchOrigin`.
- **`scripts/gitflow/merge-{hotfix,release}-to-main.sh`** (se extienden).
  - Flag `--tag <nombre>` que sustituye `TAG_NAME` (l.86-89).
  - El script sigue siendo el unico que etiqueta, y el tag cae en main.
  - Feature y fix no se tocan.
- **`skills/finish/SKILL.md`** (se extiende): pregunta cierre y tag en manual y
  semi; en automatico usa el config.

Orden de construccion:

1. Config y helpers de tag.
2. `--tag` en feature/fix.
   - Validacion previa al merge: check-ref-format y que el tag no exista,
     antes de `runGitflowScript`.
   - El tag se pone tras la verificacion de ancestria, y se sube solo con
     `--push`.
   - En hotfix/release, `--tag` se pasa al script.
3. `core/plataforma-remota.ts` y `fs/merge-request.ts`, con un ejecutable
   simulado en PATH.
   - Preflight de plataforma, CLI y autenticacion ANTES de subir nada.
4. Rama MR en finish.ts.
   - Primer `finish`: push de la rama, abrir el MR, anotar la URL, commit y
     push.
   - Segundo `finish`: fetch, estado en el remoto, ff-pull, camino idempotente
     y tag sobre el merge real.
5. Skill y docs.

Alternativas descartadas:

- **MR y tag dentro de los bash.** Sin parseo de URL ni de JSON, la logica
  queda fuera del alcance de los tests de tipos, y la funcion la comparten los
  4 scripts.
- **Guardar `merge_request_url` en el frontmatter para decidir.**
  - Obliga a tocar `Task`, `TASK_FIELD_ORDER` y el validador.
  - Se desincroniza si el MR se cierra o se mergea desde la web.

## Limites que cruza

- `finish` y la maquina de estados (la tarea sigue en `en-revision`).
- `config.ts`.
- Los scripts de Git-Flow de hotfix y release.
- Los CLIs externos `gh` y `glab`.
- La skill `finish`.

Desacuerdos previstos:

- **Con riesgos:** el preflight vive en `fs/merge-request.ts`, con el contrato
  «aborta antes de subir». El estado sale de `estadoMergeRequest` y no de la
  ancestria local.
- **Con testing:** se acepta un `gh`/`glab` de prueba en PATH como unico
  doble, y la interfaz de `fs/merge-request.ts` es solo argv mas stdout JSON.
- **Con dominio:** para `--tag` en hotfix/release propone sustituir (flag al
  script) en vez de abortar.

Suposiciones no verificadas:

- `rechazarFlagsDesconocidos` admite flags con valor como `--tag x`.
- El commit de merge en feature/fix es `HEAD` al terminar el script y tras el
  ff-pull. Si el pull trae mas commits, hay que localizar el merge con
  `--merges --ancestry-path`.
- El dispatch y la ayuda no obligan a mas cambios.
- Subir la rama en el primer `finish` aunque no se pase `--push` es legitimo
  (el MR lo exige). Es regla de negocio: confirmar con Carlos.
- No ha leido `fs/gitflow-runner.ts`, `fs/sincronizacion.ts` ni
  `cli/args.ts`.

## La decision de diseño que mas te preocupa (UNA sola)

DONDE vive el estado «MR abierto». Propuesta: la verdad la tiene el remoto,
consultado por nombre de rama (`gh pr list --head <rama> --state all --json`).
La URL en `tarea.md` es solo informativa y no decide nada. Asi no hay campo
nuevo de frontmatter ni estado que se desincronice, y un MR mergeado a mano se
detecta igual.
