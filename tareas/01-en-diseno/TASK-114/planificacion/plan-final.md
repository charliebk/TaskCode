# Plan — TASK-114: P-6: hooks PreToolUse que salen pronto cuando no tienen nada que hacer

(Modo rapido: tarea pequena, el plan lo redacta el coordinador sin lanzar el
rol de brainstorm ni unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 45 min (de la rama abierta al cierre con merge; senales: 3-4 ficheros de codigo, 2 de tests, 3 criterios)

Estado de partida (leido en el codigo): los dos puntos de entrada ya filtran
por texto antes de cargar modulos (`aceptacion`, `merge|commit`). Lo que queda:

1. **Hook de lectura / guardian de held-out** (`src/hooks/guardia-heldout.ts`):
   cuando la entrada nombra una carpeta `aceptacion/`, hoy lanza `git` (rama
   actual) aunque el proyecto no use held-out. Nuevo paso, antes de cualquier
   `git`: leer `.taskcode/config.yml` de la raiz (buscando `.git` hacia arriba,
   sin procesos, `raizDelRepo`) y, si la config se lee y `comando_heldout` es
   null, dejar pasar. Una config ilegible sigue protegiendo (no se apaga el
   guardian por un error). Aplica a los dos hooks que usan el guardian.
2. **Hook de merges** (`src/hooks/guardia-merge.ts`, `comandoCandidato`, y el
   prefiltro de `src/hooks/pre-tool-merge.ts`): solo es candidato un comando
   que contiene la palabra `git` o el nombre de un script de cierre
   (`merge-<tipo>-to-<destino>.sh`). `grep merge src`, `npm run commit-lint` o
   `echo commit` salen 0 sin cargar el guardian ni lanzar `git`.

## Lo que el rol no cubrio

No se lanzo rol. Fuera de alcance: estrechar el `matcher` de hooks.json (el
guardian de held-out necesita ver Read/Grep/Glob igualmente).

## Riesgos aceptados y que los contiene

- Un proyecto sin `comando_heldout` pierde el freno de lectura de `aceptacion/`.
  Sin la clave, los held-out no se ejecutan en `finish`: no hay nada que
  proteger. Un agente que borrase la clave para leerlos es el mismo caso que ya
  acepta el guardian (freno contra despistes, no cierre).
- Un merge lanzado sin la palabra `git` (alias del shell) no se frena; ya no se
  frenaba un alias que no contuviera `merge`. La puerta de `finish` sigue.

## Plan de pruebas

Repos Git temporales reales (patron de `test/hooks/guardia-heldout.test.ts` y
`guardia-merge.test.ts`):

- Held-out: sin `comando_heldout`, el hook de lectura sale 0 ante la carpeta de
  la tarea de la rama actual, tambien con un PATH sin `git`; con la clave sigue
  saliendo 2 (los tests existentes declaran la clave en su repo).
- Merges: con un PATH sin `git`, `grep merge x` y `npm run commit-lint` salen 0;
  `git merge` y el script de cierre siguen llegando al guardian.
- `verificar-impacto` + `test:rapido`.

## Lo que necesita decision de una persona

Nada.
