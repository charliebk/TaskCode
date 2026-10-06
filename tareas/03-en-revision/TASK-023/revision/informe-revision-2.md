# Informe de revision — TASK-023 (ronda 2)

- Commit revisado: 49ea7adc319e22cc74c3fcd1fccaa9762d7384ae
- Revisor: code-quality-reviewer (independiente)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/commands/finish.ts:290-296 |
| MEN-1 | MENOR | corregido | src/core/task.ts:77 |
| MEN-2 | MENOR | corregido | skills/review/SKILL.md (paso 4) |
| MEN-3 | MENOR | corregido | docs/METRICAS.md §11 (cabecera de la tabla) |
| MEN-4 | MENOR | corregido | docs/METRICAS.md §11.1 |
| MEN-5 | MENOR | abierto | src/core/task.ts:77-80 |

## Puerta determinista

Clon limpio en C:\t\rev023r2, rama de la tarea, `npm install`, `npm run build`: `git status` limpio salvo
`package-lock.json` (lo toca `npm install`, no es de la tarea); el `dist/src` versionado coincide con lo compilado.
`npm test` completo, una vez: 1176 tests, 1173 pasan, 3 fallan, exactamente los 3 conocidos de Windows
(approve: stat no ENOENT; plan: escritura no EEXIST; plan: rama base con estado distinto). Ningun cuarto rojo.

## Verificacion de la ronda 1

- **IMP-1 (corregido).** Reproducido con el CLI real (`bin/taskctl finish TASK-023`) en un repo temporal con la tarea en
  `03-en-revision`, `tokens_diseno: null` y `tokens_revision: null`, informe aprobado. Los dos avisos salen antes del merge
  y dicen `taskctl registrar-coste TASK-023 --fase diseno --agente <id> [--agente <id2>...], con el id de cada subagente de
  la fase (suma el uso de su transcripcion; la cifra que se ve al terminar un agente es su contexto final, no su coste)`;
  ya no aparece `--tokens N`. La tarea se cierra igualmente (exit 0). Mutacion: restaurar `--tokens N` en el texto del aviso
  y recompilar pone rojo `finish (TASK-023): avisa del coste de diseno y revision sin registrar...` (7 pasan, 1 falla); el
  test nuevo fija el texto con `--agente <id>` y con `doesNotMatch /--tokens N/`. El `dist/src/commands/finish.js`
  versionado lleva el cambio. Busqueda de residuos de la semantica vieja en src, skills y docs: no queda ninguno; `coste.md`,
  `plan`, `review` y `task-workflow` son coherentes con el aviso.
- **MEN-1 (corregido).** El comentario de `Task` ya describe la suma de transcripciones con `--agente`, y `--tokens` solo para
  la parte del orquestador. Queda un defecto de forma, ver MEN-5.
- **MEN-2 (corregido).** El paso 4 de `review` se lee bien: "Registra el coste de la revision (`task-workflow/coste.md`) con el
  id que devolvio la herramienta Agent de cada revisor: ...". Sin la frase sobrante.
- **MEN-3 (corregido).** La frase dice ahora que quedan fuera las tareas sin informes de revision y que las de declarada
  «—» estan en la tabla pero no cuentan en las medias por declarada. Coherente con la tabla (TASK-056 a 059).
- **MEN-4 (corregido), verificado contra datos.** Recalculado desde las 193 transcripciones de subagentes con un script
  propio (dedupe por message.id, suma de los cuatro campos): con la regla «unico TASK-NNN en descripcion + primeros 3000
  caracteres del prompt» los totales de las 38 filas TASK-015..059 coinciden con la tabla; con el prompt entero cambian
  exactamente 9 filas (015, 016, 017, 025, 027, 028, 029, 030, 032) y TASK-016 pasa de 43,6 a 35,6; de TASK-033 en adelante
  son identicas con ambas reglas. Todo lo que afirma el texto nuevo se reproduce. La frase sobre las rondas ya no
  presenta la correlacion como prediccion (reconoce que es esperable) y el Spearman del nivel de la heuristica (0,57) es el
  que obtuvo la ronda 1.

## MEN-5 — comentario de `Task` con una linea sin reflujar

`src/core/task.ts:77-80`: tras la correccion de MEN-1 la tercera linea del comentario mide mas de 100 caracteres
(`mas lo que se registre a mano con --tokens (la parte del orquestador). null = no registrado; en el fichero, ausente
tambien es`) mientras el resto del bloque esta a ~78. Solo forma; reflujar el bloque. No bloquea.

## Regresiones buscadas y no encontradas

- Los cambios de la ronda son un texto de aviso, un comentario, una frase de skill y prosa de METRICAS.md; el unico
  cambio de codigo (`finish.ts`) no toca la logica (que fases avisan, el orden respecto al merge, el no bloqueo), y los
  tests del aviso previos (diseno y revision avisan, implementacion no, antes del merge, cierra igualmente) siguen verdes.
- Las skills instaladas siguen sin mencionar TaskCode ni rutas internas (los tests que lo comprueban estan en verde).

## Veredicto sugerido

aprobada (IMP-1 y MEN-1 a MEN-4 cerrados y verificados; solo queda MEN-5, de forma, a criterio de Carlos).
