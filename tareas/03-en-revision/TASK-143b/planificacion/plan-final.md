# Plan — TASK-143b: argumentos, diagnose y push-back (parte b de TASK-143)

Redactado por el coordinador (modo rapido; el diseno esta en el plan de TASK-143, ver tareas/04-terminadas/TASK-143a/planificacion/plan-final.md).

## Enfoque propuesto

Duracion estimada: 50 min (parte b del troceo de TASK-143; senales: _gitflow-common.sh y 15 scripts de gitflow, una capa (bash); 2 criterios)

1. SCR-06: `parse_gitflow_args "$@"` en _gitflow-common.sh lee `--push|-p`, `--main <rama>`, `--develop <rama>`, `--tag <nombre>` y el primer argumento suelto como nombre, en las globales PUSH, MAIN_BRANCH, DEVELOP_BRANCH (por defecto `develop`), TAG_SEEN, TAG_OVERRIDE y NAME. `normalize_branch_name <tipo> <ejemplo> <pregunta>` pide el nombre si falta, recorta espacios, pone el prefijo `<tipo>/` y llama a `assert_valid_branch_name`. Lo usan los 12 scripts de rama (create, update y merge de feature, fix, release y hotfix) y create-develop y start-work (sin nombre). Los merge-* pasan a validar el nombre, que hoy no validan. Los scripts con argumentos propios (mirror, push-back, switch, pause, resume, recover) no cambian: sus opciones son otras.
2. SCR-12: diagnose-repo usa `detect_origin_available` (con su cache) en vez del `ls-remote` en linea, y lee `--develop <rama>` con parse_gitflow_args en vez del nombre `develop` fijo.
3. SCR-15: el modo mirror de push-back-to-remote sube solo lo que ensena la vista previa: `git push --force --prune <destino> 'refs/heads/*:refs/heads/*' 'refs/tags/*:refs/tags/*'` en vez de `--mirror`, que ademas sube refs/remotes, refs/notes y el resto de referencias que la vista previa no lista. El nombre del backup (`gitlab-personal-bak`) sale de una variable.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `assert_valid_branch_name`, `detect_origin_available` e `initialize_gitflow_log` de _gitflow-common.sh; los helpers de repo y origin bare de test/gitflow/flujo-comun.test.ts y origin-deteccion.test.ts.
- Nuevo: `parse_gitflow_args` y `normalize_branch_name` (14 copias de la lectura de argumentos y 12 del recorte y prefijo).

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Un script que antes ignoraba `--main` o `--tag` ahora los acepta sin usarlos: inocuo, la variable no se lee.
- `--prune` con refspecs borra en el destino las ramas y tags que no existen en local: es lo que ya prometia y ensenaba la vista previa del mirror.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1: 1 test de que merge-feature-to-develop (o un merge a main) rechaza un nombre de rama invalido sin tocar nada; 1 de que diagnose-repo informa una develop con nombre propio pasada con `--develop`.
- Criterio 2: 1 test de que el mirror no sube al destino una referencia fuera de refs/heads y refs/tags (p. ej. refs/remotes/otro/x o refs/notes).

## Lo que necesita decision de una persona

Nada abierto.
