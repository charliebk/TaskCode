# Plan — TASK-123: F-16, finish no cierra sin verificar tras un merge a mano o un conflicto

(Modo rapido, decision de Carlos del 2026-11-12: plan redactado por el coordinador, sin
brainstorm; `taskctl plan` preparo 2 roles que no se lanzan. El fallo esta reproducido de punta
a punta en `docs/auditoria/AUDITORIA-METODO-2026-11-12.md`, seccion 11, «F-16 reproducido».)

## Enfoque propuesto

Duracion estimada: 60 min (de la rama abierta al cierre con merge; senales: 2 ficheros de codigo de produccion, `src/commands/finish.ts` y `src/hooks/guardia-merge.ts`, mas textos de guia y mensajes; 2 capas: comandos y hooks; 5 criterios; una ronda de revision en modo rapido).

1. **Via de reintento de `finish` (criterios 1 y 2).** Hoy, en `runFinishCommand`, la rama
   `integradaEnDevelop && integradaEnMain` (comentario «Camino idempotente») no llama a `puerta()`
   y cierra. Cambio: si el proyecto declara `comando_verificacion`, esa via verifica el arbol de
   la rama de integracion (donde ya esta el merge, incluida la resolucion de un conflicto) antes de
   cerrar, con la misma decision proporcional que la puerta normal (documentacion / selectiva /
   completa) y reutilizando un verde del mismo arbol si ya consta en el memo; en rojo aborta sin
   mover la tarea, con la salida de la verificacion y que hacer. Sin `comando_verificacion`, como
   hoy. `--sin-verificacion` sigue saltandola y anotandolo.
2. **Guardian de merges (criterio 3).** En `decidirPreToolUse` (`src/hooks/guardia-merge.ts`): un
   comando con `git commit` (tambien `git commit -am`, `git add ... && git commit`, y `git merge
   --continue`) cuando existe `MERGE_HEAD` y la rama activa es la de integracion o la principal se
   trata como el merge que cierra, y exige el mismo verde que exige hoy un `git merge` hacia esa
   rama. Sin `MERGE_HEAD`, un `git commit` normal no se toca.
3. **Remedio documentado (criterio 4).** El mensaje de error de `finish` cuando el script de merge
   falla (hoy «si hay un conflicto de merge, resuelvelo antes de reintentar») y el texto
   equivalente de la guia (`skills/task-workflow/`, la seccion de cierre o de verificacion) y de
   `LINEA_SELECTIVA` del guardian proponen: `taskctl abort-merge`, integrar la rama base en la rama
   de la tarea y resolver alli, y relanzar `taskctl finish` desde la rama de la tarea. Sin nombrar
   TaskCode en lo que se instala en otros proyectos.

## Desacuerdos entre roles, y como se resuelven

Sin roles (modo rapido). Punto delicado: verificar en la via de reintento puede tardar (la
completa en ToolsaWeb, ~28 min); se contiene con la misma verificacion proporcional y el memo
del mismo arbol, asi que solo paga si el arbol cambio de verdad.

## Riesgos aceptados y que los contiene

- Un `git commit` con `MERGE_HEAD` en otra rama distinta de la de integracion o la principal no se
  bloquea (no integra en una rama protegida).
- Detectar `MERGE_HEAD` exige mirar `.git` desde el hook: se resuelve con la misma ruta que ya usa
  el guardian para el memo, sin lanzar procesos extra si el comando no contiene `git commit` ni
  `git merge`.

## Plan de pruebas

- Los dos casos reproducidos en la auditoria pasan a tests de regresion con repo temporal real y
  los scripts de Git-Flow reales (punto de partida: el test de la reproduccion, en el scratchpad
  de la sesion, `auditoria-f16.test.ts`):
  - Caso A: merge a mano en develop con la verificacion en rojo; `finish` no cierra y lo dice.
  - Caso B: conflicto en `finish`, resolucion en develop que rompe; el guardian bloquea los tres
    `git commit` del caso; y si el commit se hace igualmente, el reintento de `finish` verifica y
    aborta en rojo.
  - Caso verde: reintento con la verificacion en verde cierra como hoy.
- Guardian: `git commit` sin `MERGE_HEAD` no se bloquea; con `MERGE_HEAD` en una rama de tarea
  tampoco.
- Texto: el mensaje de conflicto de `finish` y la guia nombran `taskctl abort-merge` y relanzar
  `finish` desde la rama de la tarea.
- Cada test con su mutante en rojo (quitar la verificacion de la via de reintento; quitar la
  deteccion de `MERGE_HEAD`).

## Lo que necesita decision de una persona

Nada: el arreglo es el que pide el hallazgo F-16 y el modo rapido ya esta decidido.
