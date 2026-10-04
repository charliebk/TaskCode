---
id: TASK-045
titulo: "F5-T1 rama_base de punta a punta"
tipo: fix
sprint: 6
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-045-f5-t1-rama-base-de-punta-a-punta
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

`rama_base` (clave de `.taskcode/config.yml`) solo funciona hasta `approve`:
`start`, `review` y `finish` invocan los scripts de Git-Flow sin `--develop`,
y `finish.ts` fija `develop` como constante, asi que con `rama_base: dev` el
ciclo muere en `start` con «develop no existe» (auditoria D1). Los scripts ya
aceptan `--develop <rama>`: el cambio es que los tres comandos se lo pasen
para feature, fix y release (y para el backmerge de hotfix/release), y que
`finish` use la rama base resuelta en lugar del literal. Sin config, el
comportamiento es identico al de hoy.

## Criterios de aceptacion
- [x] Los scripts de Git-Flow reciben la rama base y `finish.ts` deja de fijar `develop`
- [x] Test: con `rama_base: dev`, `new -> plan -> approve -> start -> review -> finish` termina

## Resultado

Los scripts de Git-Flow ya aceptaban `--develop <rama>`; no se ha tocado
ninguno. El cambio esta en los tres comandos que los invocan:

- `src/fs/git.ts`: `resolveIntegrationBranch(cwd)` (la `rama_base` del
  config, en la que se apoya ahora `resolveBaseBranchForTipo`) y
  `gitflowBaseArgs(tipo, cwd)`, que devuelve `['--develop', rama_base]` para
  feature/fix/release y `[]` para hotfix sin resolver nada
  (`create-/update-hotfix.sh` no conocen el flag).
- `start.ts` y `review.ts`: pasan `gitflowBaseArgs` detras de la rama.
- `finish.ts`: fuera la constante `DEVELOP_BRANCH`; la rama de integracion se
  resuelve una vez antes de los merges y se pasa con `--develop` a los cuatro
  `merge-*` (hotfix/release la necesitan para el backmerge). `baseBranch` del
  resultado es esa rama.

Decisiones del orquestador (en el plan): el backmerge de hotfix/release va a
`rama_base`. Fuera de alcance y documentado: `diagnose-repo.sh` solo informa
de `develop`, `wrappers.ts` no pasa `--develop` a `start-work.sh`, y
`wip-scan.ts` mantiene `'develop'` como candidato fijo (inofensivo).

Tests: `test/commands/rama-base.test.ts` (4), en repos sin rama `develop`:
`gitflowBaseArgs` por tipo; el ciclo entero `new -> plan -> approve -> start
-> review -> finish` de un feature con `dev` avanzando en medio (review la
integra); y release y hotfix de `start` a `finish`, con merge a main y
backmerge a `dev`. Los tres comprueban que `develop` no llega a existir.
Mutantes (3, todos muertos): quitar `--develop` en finish (rompe los tres
ciclos), en start y en review (rompen feature y release; hotfix no lo usa).
Suite: 979 tests, 976 en verde (los 3 rojos conocidos de Windows).
Smoke con `bin/taskctl` en un repo temporal con `rama_base: dev`: el ciclo
cierra con el merge `fix/... -> dev` y sin rama `develop`.


### Revision por pares (ronda 1)

Revisor independiente: **aprobada** (0 CRITICO, 0 IMPORTANTE, 3 MENOR), con
mutantes y el CLI real en repos sin `develop`, incluido un hotfix con
conflicto de backmerge resuelto a mano. Veredicto registrado como
aprobada-con-correcciones por los MENOR corregidos:

- MEN-1 (corregido): con el config solo en la rama de integracion, el finish
  de un hotfix fallaba con un error de git en crudo. Ahora comprueba que la
  rama de integracion existe y dice que hacer; test nuevo, mutante muerto.
- MEN-3 (corregido): comentarios de finish.ts, cli.ts y config.ts.
- MEN-2 (aceptado, sin corregir): el camino idempotente de finish con
  `rama_base` distinta no tiene test propio (un mutante ahi sobrevive). El
  codigo es correcto y lo ejercito el revisor con el CLI real; montar el
  conflicto de backmerge en un test no compensaba frente a la urgencia de
  TASK-055. Deuda de cobertura.
