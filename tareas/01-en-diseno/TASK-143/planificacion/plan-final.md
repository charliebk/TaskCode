# Plan — TASK-143: Regla 4D: duplicacion en Git-Flow (bash y TS)

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 160 min (pasa de 60: se trocea en tres partes; troceo autorizado de antemano por Carlos para el plan de correcciones 4D)

Refactor de los scripts de Git-Flow sin cambio de comportamiento, salvo tres correcciones que la propia auditoria pide: el fetch previo que hoy solo hace create-release pasa a todos los create/update (SCR-02), el backmerge a develop de los merge a main hace `pull --ff-only` antes (SCR-05) y los merge-* validan el nombre de rama (SCR-06). Los tests de test/gitflow (repos reales con un origin bare) son la red; los mensajes de log no los compara ningun test, asi que se unifican al texto de la funcion comun.

1. SCR-02: `invoke_update_work_branch <rama> <push> <base> <tipo>` en _gitflow-common.sh con el cuerpo de update-feature (cambiar a la base, pull --ff-only, localizar la rama local o remota, merge --no-ff, push opcional), mas el `fetch origin` previo. update-feature, update-fix, update-release y update-hotfix (base = main resuelta) quedan en lectura de argumentos + una llamada.
2. SCR-03: create-release y create-hotfix usan `invoke_create_work_branch` (que gana el `fetch origin` previo, ya hecho por los dos scripts) en vez de su copia en linea.
3. SCR-04 y SCR-05: `invoke_merge_to_main <rama> <tipo> <push> <main> <develop> <tag>` en _gitflow-common.sh con el cuerpo de merge-hotfix-to-main; los dos scripts quedan en argumentos + llamada. El backmerge cambia a develop, la crea desde origin si no existe y hace `pull --ff-only` (como invoke_merge_work_branch_to_develop) antes de mergear.
4. SCR-06: `parse_gitflow_args` en _gitflow-common.sh lee `--push|-p`, `--develop`, `--main`, `--tag` y el nombre, y `normalize_branch_name <tipo> <ejemplo> <pregunta>` recorta, pone el prefijo y llama a assert_valid_branch_name. Los 13 scripts con lectura de argumentos los usan; los merge-* pasan a validar el nombre.
5. SCR-12: diagnose-repo usa `detect_origin_available` (con su cache de TASK-038) y la develop resuelta por `--develop` (por defecto `develop`) en vez de la deteccion en linea y el nombre fijo.
6. SCR-15: push-back-to-remote ensena en la vista previa todas las referencias que sube `--mirror` (o deja de usar --mirror y sube ramas y tags explicitos) y el nombre del backup sale de una sola variable.
7. SCR-07: test de paridad que crea cada operacion en curso (merge, rebase, cherry-pick, revert y sequencer con revert) en un repo real y comprueba que abort-merge.sh, diagnose-repo.sh y `operacionEnCurso` de git.ts dicen lo mismo. La deteccion bash se extrae a `detect_operation_in_progress` en _gitflow-common.sh, usada por abort-merge y diagnose-repo.
8. SCR-08: los `ls-remote` de git.ts (lineas 206, 816, 1100 y 1155) van por `runGitRemoto` (o el helper de remoto que ya exista, linea ~1022) con `GIT_TERMINAL_PROMPT=0` y limite de tiempo; finish pasa la main ya resuelta al script con `--main` en vez de dejar que el script la resuelva otra vez.
9. SCR-13: perfil-tests.mjs importa la compilacion protegida de verificar-impacto (copia de dist/src en tmpdir y cerrojo de TASK-136, exportando la funcion si hace falta) en vez de recompilar dist/src en el arbol real.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `invoke_create_work_branch`, `invoke_merge_work_branch_to_develop`, `detect_origin_available`, `resolve_main_branch`, `assert_valid_branch_name`, `invoke_git`, `_gf_ls_remote` y `show_merge_diff` de _gitflow-common.sh.
- `operacionEnCurso` y el helper de git remoto (`runGitRemoto` o equivalente, linea ~1022) de src/fs/git.ts; `tomarCerrojo` y la compilacion protegida de scripts/verificar-impacto.mjs.
- Los tests de test/gitflow (merge-to-main, merge-to-main-tag y los de create/update) con sus helpers de repo y origin bare, como red y como base de los tests nuevos.
- Nuevo: `invoke_update_work_branch` y `invoke_merge_to_main` (hoy cuatro y dos copias en linea), `parse_gitflow_args` y `normalize_branch_name` (13 copias) y `detect_operation_in_progress` (dos copias bash).

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Unificar create-release y create-hotfix en invoke_create_work_branch cambia algun texto de log ("(ya existia)", "tracking local"): ningun test lo compara y el comportamiento (ramas, push) es el mismo; se comprueba con los tests de gitflow.
- El pull --ff-only del backmerge aborta si develop local y origin divergieron: es lo que hace ya el merge a develop, y es mejor que el push rechazado a medias de hoy.
- `parse_gitflow_args` cambia el orden de lectura: un argumento desconocido debe seguir tomandose como nombre solo si no habia uno, como hoy.
- En Windows, git.ts con timeout: se usa el mismo limite que el resto de llamadas remotas.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1: 1 test de que update-hotfix y create-release hacen fetch (una rama creada en origin despues del clon se ve), y 1 de que merge-release-to-main y merge-hotfix-to-main siguen poniendo su tag y mensaje.
- Criterio 2: 1 test con develop local atrasada respecto a origin: el backmerge hace pull y el push no se rechaza (sin el pull, falla).
- Criterio 3: 1 test de que un merge-* rechaza un nombre de rama invalido y 1 de que diagnose-repo informa una develop con nombre propio (`--develop`).
- Criterio 4: 1 test de paridad de las cinco operaciones en bash y TS; 1 test de que los ls-remote de git.ts llevan GIT_TERMINAL_PROMPT=0 (o de que pasan por el helper remoto) y 1 de que finish pasa --main.
- Criterio 5: 1 test de que perfil-tests no escribe en dist/src del arbol real (o usa la funcion exportada de verificar-impacto).

## Lo que necesita decision de una persona

Nada abierto.

## Troceo

### Parte a: create, update y merge a main
invoke_update_work_branch para los cuatro update, create-release y create-hotfix sobre invoke_create_work_branch con fetch, e invoke_merge_to_main con backmerge tras pull --ff-only.
Duracion estimada: 60 min
- [ ] update-feature/fix/release/hotfix y create-release/create-hotfix usan una funcion comun de _gitflow-common.sh, con el mismo fetch previo; merge-hotfix-to-main y merge-release-to-main comparten el cuerpo
- [ ] El backmerge a develop de los merge a main hace pull --ff-only antes de mergear, como invoke_merge_work_branch_to_develop, con test que lo distingue

### Parte b: argumentos, diagnose y push-back
parse_gitflow_args y normalize_branch_name en los 13 scripts, diagnose-repo con detect_origin_available y develop configurable, y push-back-to-remote sin referencias ocultas.
Duracion estimada: 50 min
- [ ] La lectura de argumentos y assert_valid_branch_name vienen de un helper comun en los 13 scripts; diagnose-repo usa detect_origin_available
- [ ] push-back-to-remote ensena en la vista previa todo lo que sube y el nombre del backup sale de una sola variable

### Parte c: paridad bash y TS, ls-remote y perfil-tests
detect_operation_in_progress comun con test de paridad frente a git.ts, ls-remote de git.ts con entorno y limite, finish con --main, y perfil-tests con la compilacion protegida.
Duracion estimada: 50 min
- [ ] La deteccion de operacion en curso (abort-merge, diagnose-repo, git.ts) tiene test de paridad, y los ls-remote de git.ts llevan GIT_TERMINAL_PROMPT=0 y limite de tiempo; finish pasa --main al script
- [ ] perfil-tests.mjs reutiliza la compilacion protegida de verificar-impacto (copia de dist/src y cerrojo) o lo documenta
