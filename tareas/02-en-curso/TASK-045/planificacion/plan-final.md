# Plan — TASK-045: F5-T1 rama_base de punta a punta

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

La rama base ya se resuelve en un unico punto (`resolverConfig(cwd).rama_base`),
pero solo llega a los scripts hasta `approve`. El cambio es pasarla como
`--develop <rama>` en las tres llamadas a `runGitflowScript` (start, review,
finish) y quitar el literal `DEVELOP_BRANCH` de `finish.ts`. No se toca
ningun script de Git-Flow: todos los que trabajan contra develop ya aceptan
`--develop`.

Comprobado en los scripts:

- `create-hotfix.sh` y `update-hotfix.sh` no aceptan `--develop` ni lo
  necesitan (trabajan contra la principal). No se les pasa.
- `merge-hotfix-to-main.sh` y `merge-release-to-main.sh` si lo necesitan:
  hacen el backmerge a `DEVELOP_BRANCH` (default `develop`). Sin el flag, con
  `rama_base: dev`, el backmerge muere en `checkout develop`.
- `create-release.sh` y `update-release.sh` aceptan `--develop`.

Piezas:

1. `src/fs/git.ts`: `resolveIntegrationBranch(cwd)` (= `rama_base`), en la que
   se apoya `resolveBaseBranchForTipo`; y `gitflowBaseArgs(tipo, cwd)`, que
   devuelve `[]` para hotfix (sin resolver nada: ahorra `ls-remote`) y
   `['--develop', rama_base]` para el resto. La usan start y review, para que
   la regla de que tipo lleva `--develop` viva en un solo sitio.
2. `start.ts`: `runGitflowScript(scriptName, [task.rama, ...gitflowBaseArgs(...)])`.
   La rama va primero: los scripts toman como `NAME` el primer no-flag.
3. `review.ts`: el mismo cambio en la llamada a `update-*.sh`.
4. `finish.ts`: fuera la constante; `ramaIntegracion = resolveIntegrationBranch(cwd)`
   sustituye a `DEVELOP_BRANCH` en todos sus usos (destinos, idempotencia,
   checkout, mensajes, `baseBranch` del resultado). El script recibe siempre
   `[rama, '--develop', ramaIntegracion]`: los cuatro `merge-*` lo aceptan y
   hotfix/release lo necesitan para el backmerge.

Alternativa descartada: que `runGitflowScript` anada `--develop` leyendo la
config por su cuenta. Lo usan tambien los wrappers y scripts que no conocen el
flag, y esconderia al llamante que recibe cada script.

## Lo que el rol no cubrio

- Modos de fallo (rama base inexistente, config ilegible a mitad de ciclo,
  remoto caido): no revisados por un rol de riesgos.
- Reglas de negocio: se supone que el backmerge de hotfix va a `rama_base`.

## Riesgos aceptados y que los contiene

- Si `config.yml` no esta commiteado en la rama base, la rama resuelta cambia
  al hacer checkout a la rama de la tarea. El test lo commitea en `dev`; es la
  forma normal de uso (el config vive en el repo).
- El camino idempotente de finish hace checkout a la rama de integracion y
  necesita que exista en local: hoy pasa igual con `develop`, no es nuevo.

## Plan de pruebas

- Sin config, la suite existente (`start`, `review`, `review-incremental`,
  `finish`, `auto-commit`) sigue en verde: el comportamiento no cambia.
- Test nuevo `test/commands/rama-base.test.ts`, repos Git reales:
  - Montaje: `git init -b main`, commit, `checkout -b dev` (nunca existe
    `develop`), `.taskcode/config.yml` con `rama_base: dev` commiteado en dev.
  - Feature: `new -> plan -> (plan-final redactado) -> approve -> start ->
    commit de trabajo -> review -> veredicto aprobada -> finish`. Asevera: rama
    activa `dev`, la rama de la tarea es ancestro de `dev`, tarea en
    `04-terminadas`, `baseBranch === 'dev'`, `refs/heads/develop` no existe,
    workspace limpio.
  - Backmerge: un hotfix o release de `start` a `finish`, ancestro de `main` y
    de `dev`, y `develop` sigue sin existir.
- Mutacion: quitar el `--develop` de cada una de las tres llamadas y ver el
  test rojo.

## Lo que necesita decision de una persona

Decisiones tomadas por el orquestador (autorizacion de ejecutar el backlog de
la auditoria en continuo), para que la persona las vea al aprobar:

- El backmerge de hotfix y release va a `rama_base`: es la rama de
  integracion, y `develop` es solo su valor por defecto.
- Fuera de alcance, documentado y sin tarea nueva todavia: `diagnose-repo.sh`
  solo informa de `develop`; `wrappers.ts` no pasa `--develop` a
  `start-work.sh`; `wip-scan.ts:74` mantiene `'develop'` como candidato fijo
  junto a la rama base (inofensivo: solo amplia el conjunto de ramas cerradas).
