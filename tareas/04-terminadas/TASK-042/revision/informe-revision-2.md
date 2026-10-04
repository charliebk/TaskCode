# Informe de revision — TASK-042 (ronda 2)

- Commit revisado: 4511b8d65fd3377e26697aa31a45f58796eb0ad5 (HEAD 5b82c86, que solo añade la peticion)
- Revisor: code-reviewer (agente independiente)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:220, src/core/plan-brainstorm.ts:203, skills/task-workflow/SKILL.md:360-362, src/commands/plan.ts:233 |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts:377-416 |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts:780-785 (justificado en tarea.md) |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:230-236 |
| MEN-4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts:203-205, src/commands/plan.ts:233-234 (textos nuevos sin test) |
| MEN-5 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts:55,173,202; src/commands/plan.ts:293 |
| MEN-6 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts:192-195 frente a 203-205 |

### Entorno

Clon nuevo de la rama en el scratchpad del revisor, `npm install`, `npx tsc -p .`
sin errores y sin diferencias contra el `dist/` commiteado (`git status` limpio
tras compilar). Suite completa (una sola vez): **961 tests, 958 en verde** (uno
mas que en la ronda 1: el test nuevo). Los 3 rojos son los conocidos de Windows
(`approve` stat n.º 121, `plan` chmod/EEXIST n.º 291, `plan` CRLF n.º 297).

### IMP-1 — corregido

E2e propio (repo Git temporal, `bin/taskctl` del clon como proceso), tarea
`simple` (1 rol):

- Ronda 1, stdout: «1 rol, sin unificador. Lanza el agente "brainstorm-arquitectura"
  con ...peticion-plan-1.md y vuelca su respuesta en plan-final.md (el agente no
  escribe ficheros).»
- Ronda 2 (tras commitear): «Re-planificacion (ronda 2): 1 rol, sin unificador. ...
  peticion-plan-2.md y vuelca su respuesta en plan-final.md ...».
- `peticion-plan-2.md`: «tu respuesta ES el plan final ... quien orquesta la vuelca
  tal cual en `plan-final.md` (tu no escribes ficheros)».
- Scaffold `plan-final.md`: «Es la respuesta del unico rol de brainstorm,
  arquitectura, volcada aqui por quien orquesta.»
- `SKILL.md:360-362` dice lo mismo, y concuerda con el cuerpo de
  `agents/brainstorm-*.md` («tu salida es el plan final») y con su
  `tools: Read, Grep, Glob`.

Los cuatro sitios que senalaba la ronda 1 dicen ya lo correcto.

### MEN-1 — corregido

Mutantes de la ronda 1, relanzados contra el fichero de test concreto
(linea base `main.test` 12/12 verde):

| Mutante | Resultado |
|---|---|
| M7: quitar `?? 'no declarada ...'` en la cabecera (`plan-brainstorm.ts:66`) | `main.test` 11/12, muere |
| M8: lo mismo en el bloque de complejidad (`plan-brainstorm.ts:110`) | `main.test` 11/12, muere |
| M6: forzar la rama «declarada» en el mensaje de 0 roles (`cli.ts:231`, `=== null` -> `false`) | `main.test` 11/12, muere |
| M2: quitar el prefijo de re-planificacion del modo redaccion (`cli.ts:220`, `ronda > 1` -> `false`) | `main.test` 11/12, muere |

M7 y M8 siguen sin matar nada en `plan-brainstorm.test` (37/37), pero ya los
mata `main.test`, que es lo que pedia el hallazgo.

### MEN-3 — corregido

E2e, tarea sin `--complejidad` y heuristica 0 puntos: «Sin brainstorm (complejidad
no declarada; la heuristica da "trivial": 0 roles). Redacta el plan y aprueba con
"taskctl approve TASK-002".» Con complejidad declarada sigue la rama antigua. Y
una tarea sin `--complejidad` que la heuristica sube a 4 roles: lanza el
brainstorm normal, sin linea de discrepancia (`hayDiscrepancia` exige declarado
no nulo, `heuristica.ts:725`). `grep -rn '\bnull\b'` sobre las carpetas
`planificacion/` de las dos tareas: ninguna coincidencia.

### MEN-2 — aceptado

No se corrige. La justificacion de `tarea.md` (el unificador sobra solo en una
ronda cortada de 2 o mas roles; no es regresion) me vale.

### MEN-4 — El texto nuevo de la peticion y del scaffold no lo cubre ningun test

Solo el texto del CLI tiene asercion (`main.test.ts:382`). Mutantes que
sobreviven:

- `(tu no escribes ficheros)` -> `(tu escribes el fichero)` en
  `plan-brainstorm.ts:205`: `main.test` 12/12, `plan-brainstorm.test` 37/37 y
  `plan.test` solo los 2 rojos conocidos.
- `volcada aqui por` -> `redactado por el propio rol` en `plan.ts:233`: el
  mismo resultado.

Si alguien vuelve a escribir la frase antigua en la peticion, que es lo que
lee el agente, IMP-1 vuelve sin que nada se ponga en rojo. Basta una asercion
sobre `peticion-plan-1.md` en el test de 1 rol que ya existe.

### MEN-5 — Quedan comentarios y una linea que siguen diciendo que el rol escribe

- `plan-brainstorm.ts:55`: «esta peticion va al propio rol, que redacta
  `plan-final.md`».
- `plan-brainstorm.ts:173`: «asi que escribe el plan final directamente».
- `plan.ts:293`: «sin unificador: el rol escribe plan-final.md».
- `plan-brainstorm.ts:202`: la cabecera de la peticion le dice al agente
  «Vuelca el plan en: `../plan-final.md`», en imperativo, y tres lineas despues
  «tu no escribes ficheros». Esta es la unica que ve el agente; las otras tres
  son comentarios internos. Mejor «Destino del plan (lo vuelca quien orquesta): ...».

### MEN-6 — En la re-planificacion con 1 rol, «no lo reescribas entero» choca con «se vuelca tal cual»

`peticion-plan-2.md` (generada en el e2e) dice a la vez «Tu trabajo es
incorporar el feedback de la persona al plan que ya hay, no reescribirlo
entero» y «quien orquesta la vuelca tal cual en `plan-final.md`». Con el
unificador esto no chocaba, porque tiene `Write` y edita el fichero en su
sitio. Aqui el rol solo responde. Si lo lee al pie de la letra y responde con
los cambios, el orquestador sobrescribe `plan-final.md` con un plan a medias.
`approve` no lo detecta, porque las secciones pueden quedar con texto. Es un
caso real, pero tiene que darse esa lectura literal, y el plan pasa luego por
la persona, que lo aprueba. Por eso es MENOR. Arreglo: en modo redaccion, que
el bloque diga «devuelve el plan completo, con el feedback ya incorporado; no
redactes desde cero».

### Observacion

El scaffold parte la primera frase en una linea suelta («...volcada aqui
por\nquien orquesta.\nCon un solo rol...»). Es solo estetico.
