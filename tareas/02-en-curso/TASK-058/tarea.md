---
id: TASK-058
titulo: "Flujo D: modo semiautomatico"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: en-curso
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
