# Brainstorm — TASK-062, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura (sonnet)

## Enfoque propuesto, con rutas y nombres concretos

`taskctl doctor [--json]` es de solo lectura. Ejecuta una lista fija de
comprobaciones independientes y las vuelca en un modelo comun:
`Comprobacion {id, nivel: ok|aviso|error|omitida, mensaje, arreglo|null}`.

- Una comprobacion que falla se registra y el resto sigue; nunca lanza.
- El precedente es `siguiente`: `FLAGS_SIGUIENTE`,
  `rechazarFlagsDesconocidos` y `--json`, y `cli.ts` imprime
  `JSON.stringify(salida)`.
- Reparto: `core/doctor.ts` es puro, `commands/doctor.ts` orquesta con IO y
  `cli.ts` solo cablea.

## Que se extiende y que se crea

- **`src/core/doctor.ts`** (nuevo, puro): tipos, `codigoSalida` (1 si hay
  algun `error`), `formatearTexto` y `formatearJson`.
- **`src/commands/doctor.ts`** (nuevo): `runDoctorCommand(argv, {repoCwd})`.
  - Agrupa entorno, repo, config, tareas y plataforma.
  - Devuelve `{comprobaciones, json}` y no imprime.
- **`src/fs/gitflow-runner.ts`** (se extiende): `sondearBash()`.
  - `runGitflowScript` usa `stdio:'inherit'` y no identifica que bash es.
  - En win32, la sonda descarta el bash de WSL (System32).
- **`src/fs/merge-request.ts` y `finish-opciones.ts`** (se reutilizan, no se
  duplican).
  - doctor llama a `comprobarCli` (la version de TASK-061) y a
    `detectarPlataforma(urlsDeOrigin)`.
  - La parte que decide plataforma y CLI de `preflightMergeRequest` pasa a
    una funcion que devuelve un resultado, `resolverPlataformaRemota(cwd,
    config)`, para que doctor no reciba un `FinishCommandError`. Se coordina
    con TASK-061.
- **`src/core/config.ts`** (lo minimo): `resolverConfig`/`parsearConfig` con
  try/catch de `ConfigError`. Ningun segundo validador.
- **`src/fs/git.ts` y `fs/task-store.ts`** (sin cambios).
  - Se usan `isInsideWorkTree`, `localBranchExists`, `resolveMainBranch`,
    `hasOrigin`, `isWorkspaceClean` y `listTareasEnEstados`.
  - Coherencia: `task.estado !== estadoCarpeta`.
- **Skill `task-workflow`, README y CHANGELOG** (se extienden).

Orden de construccion:

1. `core/doctor.ts` y `sondearBash`.
2. `commands/doctor.ts` (entorno, repo y tareas) y `cli.ts`.
3. Config, cuando TASK-061 este en develop.
4. Plataforma sobre las piezas de TASK-061 (`omitida` si no aplica).
5. Skill, README y CHANGELOG.

Alternativas descartadas:

- **Reutilizar `diagnose` o los wrappers.** `diagnose` es bash interactivo, y
  doctor tiene que funcionar justo cuando bash no sirve.
- **Que cada comando valide su parte.** `ConfigError` aborta el comando, y
  doctor tiene que seguir y listarlo todo.

## Limites que cruza

- La CLI.
- Los procesos externos (bash, git, gh y glab).
- La config.
- Las carpetas de tareas.
- La plataforma, con red solo en la comprobacion de sesion.
- La skill.

## La decision de diseño que mas te preocupa (UNA sola)

La API de TASK-061 para los avisos de claves desconocidas. Si 061 solo emite
el aviso por stderr dentro de `resolverConfig`, doctor no puede recogerlo
como comprobacion. Hay que leer la rama de 061 antes del paso 3.

### Desacuerdos previstos

- **Con riesgos, sobre los efectos secundarios.** La sonda de bash y
  `glab api user` lanzan procesos y tocan la red. Se acepta, con un timeout
  corto propio y sin `shell:true`.
- **Con dominio, sobre la config.** Un valor invalido sigue siendo `error`;
  solo las claves desconocidas son `aviso`.

### Suposiciones no verificadas

- **Firma:** que `comprobarCli` mantenga su firma tras TASK-061.
- **bash de WSL:** como distinguirlo en Windows.
- **Estados:** que `estadoCarpeta` sea comparable con `task.estado` sin
  mapeo.
- **Workspace limpio:** si `isWorkspaceClean` ignora `tareas/` o los ficheros
  sin seguimiento.
