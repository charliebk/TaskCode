# Informe de revision — TASK-099 (ronda 1)

- Commit revisado: 14556f7445f301c956587c825dac55c4fca61e3b
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/commands/siguiente.ts:253 (correccionSinVerificar) y src/core/flujo.ts:~310 | implementacion |
| IMP-2 | IMPORTANTE | corregido | skills/task-workflow/SKILL.md | implementacion |
| MEN-1 | MENOR | corregido | src/core/menores.ts:939 (rutasDeCelda) y :953 (mismaRuta) | implementacion |
| MEN-2 | MENOR | aceptado | src/commands/finish.ts / src/commands/verificar-menores.ts (alcance de la puerta) | especificacion |
| MEN-3 | MENOR | corregido | skills/finish/SKILL.md | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Resumen de la ronda

Modo rapido (decision de Carlos): solo tests afectados, no la suite completa. Se compilo con
`npm run build` y se corrieron `menores`, `siguiente` (core), `verificar-menores`, `fases`
(29 tests: 29 en verde), `npm run test:rapido` (776/776 en verde), los `finish-*` principales
(guardas, merge, verificacion, heldout, cierre, reintento, linaje), `automatico-*`, `semiautomatico`,
`siguiente` (commands), `review-incremental`, `review-guardas` y los tests de skills.
Resultado fuera de lo que cubre `test:rapido`: **4 rojos que no son de los 3 conocidos de Windows**
(IMP-1: 3 tests; IMP-2: 1 test). Ningun otro rojo.

Mutantes (todos sobre el codigo nuevo, restaurados despues con `git checkout` y recompilado; arbol
limpio al terminar):

| Mutante | Rojo |
|---|---|
| M1 quitar la comprobacion de bloqueantes en `verificar-menores` | si: `verificar-menores` test 2 |
| M2 la puerta de `finish` no lanza | si: tests 4, 5 y 8 de `verificar-menores` |
| M3 invertir `alDia` en `siguiente` | si: tests 1, 5 y 6 |
| M4 `codigoSinVerificar` devuelve null cuando no puede comparar | si: test 8 (el de la rama reescrita) |
| M5 una verificacion vieja vale (sin comprobar codigo posterior) | si: test 5 |
| M6 `fueraDeAlcance` devuelve siempre `[]` | si: test 4 y el unit de alcance |
| M7 quitar la rama de `bloqueantesAbiertos` en `siguienteFase` | si: test 2 y la tabla de `siguienteFase` |

La red de regresion de la logica nueva discrimina. Lo que falla es lo que la logica nueva rompe en
tests que ya existian y que `test:rapido` no corre.

## Reproduccion

### IMP-1 — `siguiente` deja de preguntar ante codigo no revisado y encadena un comando condenado a abortar

Tres tests existentes, que el diff no toca, estan en rojo:

```
cd taskcode-marketplace/plugins/taskcode-plugin
npm run build
node --test dist/test/commands/automatico-guarda-finish.test.js
  not ok 1 - CRIT-1 (a): codigo commiteado tras pedir la revision y antes del veredicto → finish pregunta
  not ok 2 - CRIT-1 (b): informe commiteado junto a codigo y despues taskctl veredicto → finish pregunta
  not ok 3 - IMP-3: la guarda leida desde develop (tarea en su rama) tambien pregunta con codigo no revisado
  actual:   [ 'verificar-menores', 'continuar' ]
  expected: [ 'finish', 'preguntar' ]
```

Son las guardas de TASK-059 (CRIT-1 e IMP-3): con la ronda aprobada y codigo colado despues del
Commit revisado, `siguiente` en automatico tiene que **preguntar** antes de cerrar. Con TASK-099
`correccionSinVerificar` solo exige "hay cambios fuera de `tareas/` desde el Commit revisado, sin
verificacion al dia": no mira que haya MENORES abiertos ni que el cambio quede dentro de su alcance.
Resultado: en esos tres casos (ronda aprobada sin ningun MENOR, codigo ajeno) `siguiente` propone
`verificar-menores` con accion `continuar`, y ese comando aborta siempre (`fueraDeAlcance`, o sin MENORES
todo lo que no es test esta fuera). En automatico la cadena ejecuta un comando que no puede pasar en
vez de detenerse a preguntar; y se pierde la pregunta que TASK-059 garantizaba.

Mismo fallo con un MENOR abierto y un fichero ajeno (probado con repo Git temporal: MENOR
`src/a.ts`, commit que cambia `src/b.ts`): `siguiente` devuelve `verificar-menores` y
`verificar-menores` aborta con "cambian ficheros que no son de ningun MENOR abierto".

Correccion sugerida: `correccionSinVerificar` solo es verdadero si `menoresAbiertos > 0` **y**
`fueraDeAlcance(cambiados, menores)` es vacio; si hay codigo fuera de alcance, `siguiente` devuelve
`finish` con accion `preguntar` (como antes: el cierre lo decide una persona, con
`--aceptar-sin-revisar`) y los tres tests vuelven a verde sin tocarlos. Anadir un test de
`siguiente` para "MENOR + fichero ajeno => finish/preguntar".

### IMP-2 — `skills/task-workflow/SKILL.md` supera el limite de 15 KB y deja la suite en rojo

```
node --test dist/test/skills/task-workflow.test.js
  not ok 17 - 18. task-workflow/SKILL.md pesa menos de 15 KB
  SKILL.md pesa 15450 bytes (limite 15360)
```

`develop` pesa 15074 bytes; el diff anade 376 y cruza el limite. `test:rapido` no corre `dist/test/skills`,
por eso no se vio. La propia prueba dice como arreglarlo: lo que solo se lee en un momento concreto va
al fichero hermano (`revision.md`, que ya recoge el parrafo de `verificar-menores`); en el cuerpo basta
una referencia corta en el punto 4 de la lista de reglas.

### MEN-1 — `rutasDeCelda` y `mismaRuta` en casos borde

Probado con el modulo compilado:

```
"src/a.ts:L42"        => ["src/a.ts:L42"]        (no quita :L42)
"lib/foo.ts(12)"      => ["lib/foo.ts(12"]       (no quita (12))
"docs/mi fichero.md"  => ["docs/mi","fichero.md"] (parte por espacios)
"src/a b.ts"          => ["src/a","b.ts"]
```

Efecto, comprobado con repo temporal: MENOR con celda `src/a.ts:L1` y un commit que corrige `src/a.ts`:
`verificar-menores` aborta ("cambian ficheros que no son de ningun MENOR abierto: src/a.ts"). Lo mismo con
`docs/mi fichero.md`. Fallan cerrados (seguro), pero obligan a otra ronda o a `--aceptar-sin-revisar`
por un formato de celda razonable. Al reves, `mismaRuta` es permisivo con un nombre suelto: un MENOR
cuya celda es `index.ts` deja pasar `pkg/src/critico/index.ts` en `fueraDeAlcance` (comprobado: devuelve `[]`).
Cuando la celda cita solo el basename, el sufijo deberia exigir que sea unico entre los cambiados o
tratarse como no citado. Las rutas relativas al paquete frente a la raiz del repo si funcionan (sufijo tras `/`),
y varias rutas por celda tambien.

### MEN-2 — Cualquier cambio fuera de `tareas/` posterior al Commit revisado exige `--aceptar-sin-revisar`, tambien un cambio solo de documentacion

Repo temporal: MENOR `src/a.ts` abierto y un commit que solo toca `docs/x.md`. `siguiente` dice
`verificar-menores`; `verificar-menores` aborta; `finish` aborta con "tiene codigo posterior al commit
revisado". Es coherente con el criterio 3 (y esta documentado en el CHANGELOG como cambio de conducta),
pero un CHANGELOG o un `docs/` tocado tras la revision queda anotado en `## Codigo integrado sin revisar`
como si fuera codigo. Decision de producto, no un fallo; se deja por escrito. Relacionado y anterior a
esta tarea: `finish` no vuelve a comprobar que no haya un CRITICO o IMPORTANTE abierto en una ronda
aprobada (con IMPORTANTE abierto y sin codigo posterior, `finish` cierra: comprobado); lo frenan
`siguiente` (ahora propone `veredicto ... cambios-solicitados`) y `verificar-menores`, no el propio `finish`.

### MEN-3 — La skill `finish` no advierte de no pasar `--aceptar-sin-revisar` por cuenta propia

La skill `review` dice que lo decide una persona, pero `skills/finish/SKILL.md` (que es la que se
invoca cuando `finish` aborta con el mensaje nuevo, y que ya dice "Nunca pases `--tag` por tu cuenta")
no menciona el flag. Un agente que ve el mensaje del abort puede teclear el flag y saltarse la
puerta. Anadir una linea equivalente a la de `--tag` (y a `--sin-verificacion`, que tampoco esta).

## Revisado y sin hallazgos

- Un CRITICO o IMPORTANTE abierto no se cuela por `verificar-menores`: aborta antes de escribir nada
  (HEAD y arbol sin cambios; mutante M1 rojo). Incluye severidad desconocida (fail-closed).
- `finish` no integra codigo posterior al Commit revisado sin verificacion al dia o el flag (mutantes M2,
  M3, M5 rojos); una verificacion vieja no vale; un SHA revisado que Git no conoce bloquea (M4 rojo);
  la puerta aborta antes de tocar nada (rama y arbol intactos tras el rechazo).
- `siguiente` nunca devuelve `review` por MENORES tras una ronda aprobada (rama `aprobada` de
  `siguienteFase`: solo `veredicto`, `verificar-menores` o `finish`); tabla de `siguienteFase` cubre los casos.
- Las skills (`review`, `task-workflow`, `avance.md`, `revision.md`) no mencionan TaskCode, sus rutas ni
  TASK-NNN en las lineas anadidas (grep sobre el diff de `skills/`).
- Backlog (`menores-pendientes.md`), linea de `## Verificacion ligera` y commit solo en `tareas/`: comprobados
  por el test 1 y por mutacion.

## Lecturas fuera del contexto permitido

- `src/core/informe-revision.ts` ya estaba en la lista; ademas lei `skills/finish/SKILL.md` (MEN-3, para ver si
  la skill avisa del flag nuevo), `test/commands/automatico-guarda-finish.test.ts` (IMP-1, el test que falla) y
  `test/skills/task-workflow.test.ts` (IMP-2, el limite de tamano). Motivo: son los tests y la skill que el
  diff altera indirectamente y que `test:rapido` no cubre.
