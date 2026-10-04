---
id: TASK-058
titulo: "Flujo D: modo semiautomatico"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-058-flujo-d-modo-semiautomatico
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

Parte de TASK-055 (su plan-final es el diseno de referencia). Al cerrar cada fase el sistema pregunta si seguir; un no deja la tarea en su estado, queda registrado y dice como reanudar.

## Criterios de aceptacion
- [x] Con `modo_flujo: semiautomatico`, al cerrar plan, approve, start y review la skill pregunta con AskUserQuestion si pasar a la siguiente fase
- [x] Un si invoca la skill de la siguiente fase con la herramienta Skill
- [x] Un no ejecuta `taskctl pausa`, deja la tarea en su estado y termina nombrando la skill que la reanuda
- [x] Bloqueo por arbol de trabajo en `.git/` mientras dura una cadena: una segunda sesion sobre el mismo arbol aborta con un mensaje que dice que hacer
- [x] Test de punta a punta en repo temporal: un no en approve deja la tarea en `01-en-diseno` con `plan_aprobado: false` y su fila de pausa; la contraprueba con un si llega a `02-en-curso`

### Tras el cierre

- [ ] Smoke manual en Claude Code en un proyecto ajeno con evidencia en el Resultado (este entorno no autentica `claude -p`; lo hace Carlos o la release)

## Resultado

- `avance.md`: pasos de `preguntar` (AskUserQuestion; si → encadenar; no →
  `taskctl pausa`, cerrar la cadena y nombrar la skill que la reanuda) y de
  `continuar` (encadenar sin preguntar). `continuar` llega ya en D: es el mismo
  mecanismo y, sin el, el semiautomatico se pararia en los pasos internos de
  la revision. Con la tarea en curso no se encadena (falta implementar).
- Cadena: `taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar
  <testigo> | cerrar --forzar`. Bloqueo en `taskcode/cadena.lock` del
  directorio de Git (fuera del arbol; propio de cada worktree), creado con
  `wx` para que dos `abrir` a la vez no ganen los dos. El testigo es la
  identidad de la cadena (una sesion no tiene identidad visible para el
  CLI): viaja como `--cadena` de una skill a la siguiente por la herramienta
  Skill; cada skill encadenada lo comprueba antes de nada; solo quien lo
  tiene cierra. Mensajes con la tarea, la antiguedad y que hacer.
- Las siete skills de fase comprueban la cadena si reciben `--cadena`. Hasta
  E, la aprobacion la sigue dando la persona en `approve`.

Tests: `test/commands/cadena.test.ts` (9) y
`test/commands/semiautomatico.test.ts` (3), escritos por un agente en
paralelo (sin bugs encontrados): testigo, bloqueo fuera del arbol, segundo
abrir con mensaje, comprobar y cerrar con testigo ajeno, `--forzar`, JSON
roto, worktree enlazado independiente; el «no» en approve deja la tarea en
`01-en-diseno` con `plan_aprobado: false` y su fila `pausa`, y la contraprueba
con «si» llega a `02-en-curso`; la cadena durante el flujo. Mas el test de
skills ampliado. Mutantes de `cadena.ts` (sin `wx`, comprobar sin testigo,
cerrar ajeno, bloqueo en el arbol): todos muertos. Smoke del CLI correcto.
Suite: 1038 tests, 1035 en verde (los 3 rojos conocidos de Windows).

El smoke dentro de una sesion de Claude Code paso a «Tras el cierre»: este
entorno no autentica `claude -p`.

### Revision por pares (ronda 1)

Revisor independiente: **cambios-solicitados** (5 IMPORTANTE, 3 MENOR).

- IMP-1 (corregido): el bloqueo solo lo consultaba `cadena abrir`; una
  segunda sesion podia hacer checkout y commit con una cadena ajena abierta.
  Ahora lo hace cumplir el CLI: `new`, `import`, `plan`, `approve`, `start`,
  `review`, `codex-review`, `veredicto`, `finish`, `pausa` y los wrappers de
  Git-Flow abortan si hay una cadena abierta y no reciben su testigo con
  `--cadena` (y si traen un testigo de una cadena ya cerrada). Reproducido el
  caso del revisor con el CLI: `start` de la otra sesion aborta y la rama no
  cambia; tras cerrar la cadena, funciona. La implementacion queda fuera del
  bloqueo (la cadena se detiene al llegar a ella): decision documentada.
- IMP-2 (corregido): hasta E, `siguiente` en automatico pregunta antes de
  cada fase nueva, como el semiautomatico: sin sus guardas, encadenar hasta
  `finish` mergearia sin persona.
- IMP-3 (corregido en el CLI): con la tarea en curso o tras
  `cambios-solicitados`, `siguiente` devuelve `detener` en todos los modos
  (falta trabajo, no una fase); deja de depender de una excepcion en el texto.
- IMP-4 (corregido): el «no» de `approve` cierra la cadena y termina sin
  volver a avance.
- IMP-5 (corregido): regla explicita: un «no» o un error con una cadena
  abierta la cierran antes de parar.
- MEN-1 (corregido): aserciones para cada camino de cierre y para el paso del
  testigo a cada `taskctl`.
- MEN-2 (corregido): el testigo tiene que ser hex de 16; un vacio no casa con
  un bloqueo roto. Test nuevo; su mutante muere.
- MEN-3 (corregido): si el bloqueo desaparece entre el `EEXIST` y su lectura,
  mensaje propio en lugar de una traza.

Mutantes: sin la guarda del CLI (IMP-1) y testigo libre (MEN-2), muertos.
Suite: 1039 tests, 1036 en verde (los 3 rojos conocidos de Windows).

### Revision por pares (ronda 2)

Revisor independiente: **cambios-solicitados**. Confirmo cerrados los ocho
hallazgos de la ronda 1 con el CLI real (los 14 comandos guardados de otra
sesion abortan sin tocar nada; automatico y semiautomatico se detienen o
preguntan donde deben). Hallazgos nuevos:

- IMP-1 (r2) (corregido): la guarda solo tenia red para «approve sin
  testigo»; se podia sacar `finish` o `start` de la lista, o aceptar
  cualquier testigo, con la suite en verde. La lista vive ahora en
  `cadena.ts` (`GUARDADOS_POR_CADENA`, exportada) y el test: compara la lista
  con la esperada; con una cadena abierta lanza CADA comando sin testigo, con
  uno ajeno y con uno de una cadena cerrada (rc != 0, HEAD y rama intactos);
  sin cadena, un testigo cerrado tambien falla; y `--cadena=` y el testigo
  antes del ID funcionan en `new`, `plan`, `pausa` y `approve`. Sus cinco
  mutantes mueren.
- MEN-1 (r2) (corregido): fuera de un repo la guarda no interviene; el
  comando da su propio error. Test y mutante.
- MEN-2 (r2) (corregido): el orden del «no» explicito en avance.md: `pausa`
  con la cadena abierta, despues cerrar. El test fija el orden.
- MEN-3 (r2) (corregido): la tabla de modos dice que el automatico pregunta
  mientras no tenga sus guardas; `--cadena` y `taskctl cadena` en la ayuda y en
  la skill de flujo. `board --escribir` sin guardar: aceptado (escribe un
  fichero derivado, sin commit ni checkout).

Suite: 1043 tests, 1040 en verde (los 3 rojos conocidos de Windows).

### Revision por pares (ronda 3)

Revisor independiente: **aprobada**, sin hallazgos nuevos. Los catorce
mutantes de quitar un comando de la guarda mueren por el test de
comportamiento (no solo por el de la lista), igual que los de testigo
ajeno, cerrado, `--cadena=`, argv sin limpiar y fuera de repo. El orden del
«no» de avance.md es el que funciona con el CLI.
