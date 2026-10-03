# Brainstorm — TASK-033, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

Un unico gancho dentro de `autoCommit` (`src/fs/git-commit.ts`): si hay
`comando_sincronizacion` configurado, se ejecuta ANTES del primer `git add`
(ya con los ficheros de la tarea escritos) y sus `rutas_sincronizacion` se
suman a `opts.rutas`, de modo que entran en el mismo commit `--only` y el
indice real queda limpio (sin `MM`). Ningun comando cambia: los 8 sitios
que llaman a `autoCommit` lo heredan; sin claves, cero spawns.

Orden de construccion:

1. `config.ts`: claves, tipos, `validarListaDeRutas`, validacion cruzada al
   final de `parsearConfig` (las dos claves o ninguna). Entregable solo.
2. `src/fs/sincronizacion.ts` aislado, sin enganchar.
3. Enganche en `autoCommit` (un punto). Desde aqui funcionan los 8 comandos.
4. `SKILL.md`: claves + guia post-cierre.
5. Version 0.1.1 + CHANGELOG; verificacion en un clon de OpenGisViewer.

Coste: sin claves, un `readFileSync` mas por comando (`resolverConfig` no
cachea), cero spawns. Con claves, 1 spawn + 2 `git status --porcelain` por
comando (una sola vez por comando, no por tarea tocada).

## Que se extiende y que se crea

- `src/core/config.ts` — EXTIENDE — dos claves planas:
  `comando_sincronizacion: string|null` (defecto null) y
  `rutas_sincronizacion: readonly string[]` (defecto []).
- Parser de listas: NO se toca. `parseBloqueClaveValor` → `parseScalarOrArray`
  ya devuelve array para flow-style `[a, "b c"]` (frontmatter.ts:196-203,
  verificado). Listas en bloque (`- x`) siguen sin soporte, a proposito.
- `src/fs/sincronizacion.ts` — CREA — `ejecutarSincronizacion(cwd, cfg)`:
  spawn, diff de `git status --porcelain` antes/despues para detectar rutas
  no declaradas tocadas, errores. Fuera de git-commit.ts para que
  `autoCommit` siga siendo solo Git.
- `autoCommit` — EXTIENDE — tras `assertMensajeAscii` y antes de
  `normalizarRuta`, `resolverConfig(cwd)`; las rutas sincronizadas pasan por
  las mismas reglas (`normalizarRuta` rechaza fuera del repo y la raiz).
  git.ts ya importa config: sin ciclo.
- Ejecucion: `spawnSync(comando, { shell: true, cwd: raizDelRepo(cwd),
  encoding: 'utf8' })` — cmd.exe en Windows, /bin/sh en POSIX; misma
  semantica que los scripts de npm/pnpm, resuelve `pnpm.cmd`. Sin argumentos
  interpolados: `cmdQuoteWindows` no aplica.
- `skills/task-workflow/SKILL.md` — EXTIENDE.

## Limites que cruza

- Disparadores: los 8 que llaman a `autoCommit` (new, import, plan, approve,
  start, review, finish, codex-review). El plugin no sabe que campos lee el
  script externo; sync-plan.mjs lee estado/sprint/titulo/dependencias, asi
  que new/import/plan tambien lo desincronizan. Si el script no cambia nada,
  la regla 2 no crea commit. `import` con N tareas = 1 sync.
- Alternativas descartadas: opt-in por comando (8 cambios casi identicos,
  olvidar uno es silencioso); `bash -c` (el proyecto tendria que escribir su
  comando con reglas distintas a las de sus scripts npm); sin shell (parser de
  shell a mano y `pnpm` ENOENT en Windows, el fallo que ya costo una ronda en
  codex-review).

Suposiciones no verificadas: que `deps.repoCwd` sea la raiz del repo en los
8 comandos; que una linea `  - ruta` en config.yml aborte en vez de
ignorarse; que en `start` la sincronizacion corra ya en la rama de la tarea y
en `finish` sobre develop tras el merge; que `git status --porcelain`
antes/despues baste para detectar rutas no declaradas cuando la persona ya
tenia cambios en ellas (start/review/finish no tienen guard).

## La decision de diseño que mas te preocupa (UNA sola)

La semantica de fallo. Posicion: abortar con `AutoCommitError` ANTES de
cualquier `git add` si el comando sale con exit ≠ 0 o toca rutas no
declaradas — la tarea queda escrita sin commitear, mismo estado y mismo tipo
de mensaje que el error de commit que ya existe. Desacuerdos previstos con
riesgos (abortar vs commitear y avisar; gancho implicito dentro de
`autoCommit`) y con dominio (4 disparadores del criterio vs los 8).
