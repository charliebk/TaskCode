# Plan — TASK-143c: paridad bash y TS, ls-remote y perfil-tests (parte c de TASK-143)

Redactado por el coordinador (modo rapido; el diseno esta en el plan de TASK-143, ver tareas/04-terminadas/TASK-143a/planificacion/plan-final.md).

## Enfoque propuesto

Duracion estimada: 55 min (parte c del troceo de TASK-143; senales: _gitflow-common.sh, abort-merge.sh, diagnose-repo.sh, src/fs/git.ts, src/commands/finish.ts, scripts/verificar-impacto.mjs y scripts/perfil-tests.mjs; tres capas (bash, TS y scripts de la raiz); 2 criterios)

1. SCR-07: `detect_operation_in_progress` en _gitflow-common.sh deja los cuatro booleanos (merge, rebase, cherry-pick y revert, con el sequencer) y escribe en stdout la operacion en el mismo orden de prioridad que `operacionEnCurso` de git.ts (merge, rebase, cherry-pick, revert). abort-merge y diagnose-repo la usan en vez de su copia. Test de paridad: para cada estado (ninguna, merge, rebase, cherry-pick, revert y sequencer de revert sin REVERT_HEAD) en un repo real, la funcion bash y `operacionEnCurso` dicen lo mismo.
2. SCR-08: `lsRemoto(args, cwd)` en git.ts sobre `gitCrudo` (git-crudo.ts: GIT_TERMINAL_PROMPT=0) con limite de tiempo GF_TIMEOUT_REMOTO (segundos, por defecto 5, el mismo que _gf_ls_remote). Lo usan isRemoteAvailable, remoteBranchExists, tagRemoto y ramaRemotaContiene en vez de su spawnSync suelto. finish pasa al script de hotfix y release la principal que ya resolvio, con `--main`, para que el script no la resuelva otra vez (los argumentos salen de una funcion pura, probada aparte).
3. SCR-13: el bloque de verificar-impacto que guarda dist/src en tmpdir, toma el cerrojo de TASK-136, ejecuta y devuelve dist/src se extrae a `conDistProtegido(dirPlugin, fn)` exportada; verificar-impacto y perfil-tests (su `npm run limpiar:test && npm run build` y la medida) la usan.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `operacionEnCurso` y `rutaGitObligatoria` de git.ts; `gitCrudo` de git-crudo.ts (TASK-149a); `tomarCerrojo`, `dirCopia`, `restaurarHuerfana` y `devolver` de verificar-impacto.mjs; los tests de abort-merge.test.ts (estados de cherry-pick y revert) y de verificar-impacto.test.ts como red.
- Nuevo: `detect_operation_in_progress` (dos copias bash), `lsRemoto` (cuatro spawnSync de ls-remote), `conDistProtegido` (el bloque protegido, para que perfil-tests no recompile sin el) y la funcion pura de argumentos del script de finish.

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- El limite de tiempo nuevo puede cortar un ls-remote legitimo muy lento: es el mismo limite que ya usan los scripts (GF_TIMEOUT_REMOTO), y se puede subir con esa variable.
- perfil-tests con el cerrojo espera si hay una verificacion en marcha: es lo que se quiere (antes se pisaban dist/src).

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1: 1 test de paridad bash/TS sobre los seis estados; 1 test de que isRemoteAvailable con un origin que no responde (TEST-NET-1) y GF_TIMEOUT_REMOTO=2 vuelve false en segundos; 1 test de que los argumentos del script de hotfix/release llevan --main.
- Criterio 2: 1 test de que conDistProtegido devuelve dist/src tal cual aunque fn lo cambie, y de que perfil-tests la usa.

## Lo que necesita decision de una persona

Nada abierto.
