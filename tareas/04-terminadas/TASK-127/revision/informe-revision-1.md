# Informe de revision — TASK-127 (ronda 1)

- Commit revisado: d99b84f0efa1ee186da680590acdda0dfb162f99
- Revisor: code-quality-reviewer (agente independiente)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/commands/review.ts:728 y src/commands/siguiente.ts:245 (fase: implementacion, tests) | implementacion |
| MEN-1 | MENOR | corregido | CHANGELOG.md (fase: documentacion) | implementacion |
| MEN-2 | MENOR | aceptado | src/fs/config-de-ref.ts:13 (uso en review.ts:728) (fase: implementacion) | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Verificacion hecha

- `npm run build` limpio. Tests afectados (siguiente, config-tope-rondas, rondas-extra, automatico-rondas, review-alcance, skills): 130 tests, 129 ok, 1 fallo: «automatico (TASK-059): approve sin preguntar...», que es el ya existente en develop. Ninguno mas.
- Con tope 3 (`tope_rondas: 3`) el comportamiento anterior se conserva: pasan el test de regresion de automatico-rondas y los de review-alcance (ronda 4 rechazada sin flag).
- `--ronda-extra` exige la linea `- Ronda N:` de la ronda correcta (N = ultima + 1) dentro de `## Rondas extra`; la de la ronda 3 no vale para la 4 y cada ronda extra vuelve a preguntar (reproducido en automatico-rondas por la CLI real, repo Git temporal). `siguiente` pregunta con las tres salidas en manual, semiautomatico y automatico.
- Ningun test se debilita: las expectativas antiguas (tope 3) se conservan fijando `tope_rondas: 3`; las nuevas se anaden. Las skills no nombran TaskCode ni rutas internas (los tests de skills pasan).
- Skills y docs: la clave y las tres salidas estan en README, docs/configuracion.md, review/SKILL.md, avance.md y revision.md, coherentes entre si.

## Reproduccion de los hallazgos

### IMP-1 — Nada comprueba que el tope se lea de la rama base

El README y docs/configuracion.md prometen que «la rama de una tarea no puede subirse su propio tope», y es la razon de usar `configDeRef(rama_base)`. Pero ningun test pone rojo la regresion a la config del arbol de trabajo.

Mutacion (en una copia de `dist` en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-127-r1`, ya borrada): en `review.js` sustituir `configDeRef(resolverConfig(deps.repoCwd).rama_base, deps.repoCwd).tope_rondas` por `resolverConfig(deps.repoCwd).tope_rondas`, y en `siguiente.js` `configDeRef(config.rama_base, deps.repoCwd).tope_rondas` por `config.tope_rondas`. Resultado: automatico-rondas, review-alcance y siguiente.test, 21 de 21 en verde. En todos los tests la config con `tope_rondas` esta commiteada en develop y la rama la hereda, asi que base y arbol coinciden siempre.

Falta un test en repo temporal donde la rama de la tarea suba `tope_rondas` (p. ej. a 5) sin tocar develop, y `review` (y `siguiente`) sigan usando el de develop. Es una proteccion nueva sin test que falle al quitarla.

### MEN-1 — Falta la entrada del CHANGELOG

El criterio 5 pide que el CHANGELOG explique el tope y su valor por defecto; el plan lo cita ademas como la contencion del riesgo «proyectos sin la clave pasan de 3 a 2 rondas». `git diff develop..HEAD` no toca CHANGELOG.md y `grep "tope_rondas\|127" CHANGELOG.md` no encuentra nada. Se arregla antes de cerrar (puede ir con el commit de cierre/version).

### MEN-2 — Base inexistente: se cae al defecto 2 en silencio

`configDeRef` devuelve la config por defecto si `git show <base>:.taskcode/config.yml` falla, sea porque la base no tiene fichero (correcto y documentado) o porque la rama base no existe. En el segundo caso un proyecto con `tope_rondas: 5` en su arbol de trabajo recibe un 2 sin aviso. Es el comportamiento ya vigente de los demas usos de `configDeRef` (held-out y cobertura), y falla del lado seguro (tope mas bajo, y se pregunta), por eso solo MENOR. No verificado empiricamente (no hay test que cree una base inexistente); el caso a ejecutar seria `rama_base: inexistente` con `tope_rondas: 5` en la config y ver que `siguiente` pregunta ya en la ronda 2. Una config invalida en la base lanza `ConfigError` con el nombre de la ref, que el CLI convierte en salida distinta de 0 (tampoco hay test para ello en review/siguiente).

## Lecturas fuera del contexto permitido

- `src/fs/config-de-ref.ts`: para saber que pasa si la base no existe o su config es invalida (motivo: punto de revision pedido).
- `CHANGELOG.md` (solo `grep`): para comprobar el criterio 5.
