# Informe de revision — TASK-042 (ronda 1)

- Commit revisado: 65c088b96046f16dcd7a85d6d425bf0e6d590dbc (HEAD dc71339, que solo añade la peticion)
- Revisor: code-reviewer (agente independiente)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:220 (y src/core/plan-brainstorm.ts:203, skills/task-workflow/SKILL.md:360-362, src/commands/plan.ts:233) |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts, test/cli/main.test.ts (textos de src/core/plan-brainstorm.ts:66,110 y src/cli.ts:218,230 sin cubrir) |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts:780-785 |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:230 |

### Entorno

Clon nuevo de la rama en el scratchpad del revisor, `npm install`, `npx tsc -p .`
sin errores. Suite completa (una sola vez): **960 tests, 957 en verde**. Los 3
rojos son los conocidos de Windows (`approve` stat/EPERM n.º 120, `plan`
chmod n.º 290, `plan` CRLF «estado distinto al de la lectura preliminar» n.º 296).

### Lo que se comprobo y funciona (sin hallazgo)

Script e2e propio contra repos Git temporales reales, invocando `bin/taskctl`
del clon como proceso:

- E1 `new` sin `--complejidad`: escribe `complejidad: null`; `board` la lista;
  `plan` la mueve y el frontmatter sigue en `null` (se relee igual).
- E2 `tarea.md` sin la clave `complejidad`: `board` y `plan` funcionan; tras
  `plan` la clave queda escrita como `complejidad: null`.
- E9 `import` sin `--complejidad`: `complejidad: null`.
- E3 1 rol (`simple`): ronda 1 deja exactamente `peticion-plan-1.md`; segunda
  pasada, `peticion-plan-2.md` con el bloque de re-planificacion y el CLI dice
  «Re-planificacion (ronda 2): 1 rol, sin unificador».
- E4 carpeta antigua (`peticion-brainstorm-arquitectura-1`, `salida-...-1`,
  `peticion-unificador-1`) + 1 rol: la ronda avanza a 2 y escribe
  `peticion-plan-2.md`.
- E5 2 roles (`media`) -> 1 rol (`simple`): se mantiene el unificador,
  `peticion-unificador-2.md`, «NO se relanza el brainstorm». E5b con `null`
  (la heuristica da 0 roles): igual, reutiliza la ronda 1.
- E6 1 rol -> 2 roles: relanza los dos roles en ronda 2 y `peticion-unificador-2`
  lleva el bloque de re-planificacion.
- E8 `plan` dos veces seguidas con 1 rol: sin error, avanza a ronda 2 (mismo
  comportamiento que el modo unificador de antes).
- Con `null`, las peticiones dicen «no declarada (decide la heuristica)» en la
  cabecera y en el bloque de complejidad; ningun sitio imprime `null` (revisados
  `cli.ts`, `board`, `approve`, `start`, plantillas).
- `state-machine.ts`: con `null` `start` sigue exigiendo `plan_aprobado`
  (`TRIVIAL_SIN_APROBACION` esta vacio; la guarda `=== null` es defensiva).
- Skill y agentes: las lineas nuevas no mencionan TaskCode ni sus rutas (las
  menciones a `.taskcode/config.yml` son previas y publicas).
- Mutantes propios que mueren: quitar el bloque de re-planificacion de
  `peticion-plan` (2 rojos), quitar `peticion-plan` del testigo `testigoEntero`
  (1 rojo), umbral de salidas `< 2` -> `< 99` (2 rojos).

### IMP-1 — Con 1 rol se le dice al orquestador que el rol escribe `plan-final.md`, y ese agente no puede escribir

Los cuatro `agents/brainstorm-*.md` tienen `tools: Read, Grep, Glob` (sin
`Write`; solo `brainstorm-unificador` tiene `Write`). Sin embargo, en el modo
de 1 rol:

- CLI (`src/cli.ts:220`): «Lanza el agente "brainstorm-arquitectura" con
  ...peticion-plan-1.md: **el rol escribe plan-final.md directamente**.»
  (reproducido en E3, salida literal).
- Peticion (`src/core/plan-brainstorm.ts:203`): «tu escribes `plan-final.md`
  directamente».
- Skill (`SKILL.md:360-362`): «se lanza ese agente con `peticion-plan-<ronda>.md`
  y escribe el `plan-final.md`». Contrasta con el parrafo anterior de la misma
  skill, que para 2+ roles dice explicitamente que **quien orquesta** vuelca
  cada respuesta en su `salida-...`.
- Scaffold del plan (`src/commands/plan.ts:233`): «Lo redacta directamente el
  agente del unico rol».

El `Resultado` de la tarea afirma que «el orquestador vuelca la respuesta del
rol en el fichero ... la peticion y el CLI lo dicen asi», pero no lo dicen:
dicen lo contrario. Un orquestador que siga el CLI o la skill lanzara el
agente esperando que escriba el fichero; el agente no puede, y `plan-final.md`
se queda con el scaffold. `approve` rechaza el scaffold sin rellenar, asi que
no hay corrupcion silenciosa, pero es la instruccion del camino principal de
toda tarea de 1 rol (lo que esta tarea pretende hacer habitual) y es
incorrecta. Correccion barata: que el CLI, la skill y el scaffold digan que
quien orquesta vuelca la respuesta del rol en `plan-final.md` (como con las
`salida-*`), y que la peticion diga «tu respuesta es el plan final; se vuelca
en ...» en vez de «tu escribes». Alternativa: dar `Write` a los roles, pero
hay un test que lo impide y es una decision mayor.

### MEN-1 — Los textos de «no declarada» y el prefijo de re-planificacion del CLI no los cubre ningun test

Mutantes que sobreviven (fichero de test concreto, comparando con la linea base):

- M7: `task.complejidad ?? 'no declarada ...'` -> `task.complejidad` en la
  cabecera (`plan-brainstorm.ts:66`): `plan-brainstorm.test` 37/37 verde,
  `plan.test` solo los 2 rojos conocidos.
- M8: lo mismo en el bloque de complejidad (`plan-brainstorm.ts:110`): solo los
  2 rojos conocidos.
- M6: quitar `?? nivelHeuristico` del mensaje de 0 roles (`cli.ts:230`):
  `main.test` 11/11 verde.
- M2: quitar el prefijo «Re-planificacion (ronda N): » del modo redaccion
  (`cli.ts:218`): `main.test` 11/11 verde.

Con cualquiera de los tres primeros, el usuario veria literalmente `null` (o
`"null"`), que es justo lo que la tarea quiere evitar. Falta un test que cree
una tarea sin `--complejidad`, lance `plan` y compruebe que ninguna peticion ni
el stdout contienen `null`.

### MEN-2 — La regla «2 o mas salidas» cuenta scaffolds, no trabajo

`contarSalidasDe` cuenta ficheros `salida-brainstorm-*-N.md` por nombre. Los
scaffolds se crean siempre con contenido de plantilla, asi que en E5 (2 roles
lanzados pero sin responder, luego `simple`) se elige el modo unificador para
consolidar dos plantillas vacias. El comentario dice «esas salidas son trabajo
real». No es una regresion (antes se reutilizaba igual), pero el criterio no
mide lo que el comentario dice; o se compara contra `salidaRolTemplate`, o se
ajusta el comentario.

### MEN-3 — Con `null`, el mensaje de 0 roles atribuye a la tarea la complejidad de la heuristica

E1: «Sin brainstorm (complejidad "trivial" resuelve 0 roles)» para una tarea con
`complejidad: null`. Es el nivel heuristico, pero se lee como si fuera el de la
tarea. Mas claro: «(sin complejidad declarada; la heuristica da "trivial", 0
roles)».

### Observacion (no es hallazgo de esta tarea)

Con la heuristica actual, una tarea minima sin `--complejidad` da 0 puntos ->
`trivial` -> 0 roles (E1). Es la consecuencia directa de C4 y su calibracion es
de TASK-052. La linea de discrepancia «se lanzan 1 rol» (concordancia) es previa
a esta tarea.
