# Plan — TASK-056: Flujo B, nucleo determinista del siguiente paso y registro de transiciones

(Sin brainstorm propio: la heuristica dio "trivial" por lo corto del
enunciado, pero el diseno ya lo hicieron los tres roles y el unificador de
TASK-055, cuyo `plan-final.md` es la referencia. Este plan lo concreta sobre
el codigo; lo redacta quien orquesta.)

## Enfoque propuesto

El CLI decide y el agente ejecuta. Todo lo que se pueda probar con un repo
Git temporal vive aqui; las skills de fase (C, D, E) solo leeran
`taskctl siguiente` y ejecutaran lo que diga.

1. **`modo_flujo` en `src/core/config.ts`**: clave nueva en `CLAVES_CONFIG` y
   `CONFIG_DEFAULTS` (`manual`), con validador de enumerado que reutiliza el
   fallo cerrado y la sugerencia por distancia de edicion que ya tiene el
   parser. Fila nueva en la tabla de la cabecera.

2. **Registro de transiciones, `src/core/transiciones.ts` (puro)**: seccion
   `## Transiciones` al final del cuerpo de `tarea.md`, tabla
   `| fecha | fase | modo | decidido_por |`. Funciones `anadirTransicion(body,
   fila)` (crea la seccion si no existe; nunca toca el resto del cuerpo),
   `leerTransiciones(body)` y `modoCongelado(body)` = el modo de la ultima
   fila `plan`. **El modo se congela asi, en el propio registro**: no hace
   falta un campo nuevo en el frontmatter (que obligaria a tocar el parser,
   el orden de campos y todos los tests que comparan el frontmatter), y el
   registro y el modo no pueden discrepar porque son el mismo dato.

3. **Cada transicion escribe su fila en el mismo commit**: `plan`, `approve`,
   `start`, `review` (cada ronda) y `finish` pasan a `moveTareaFile` el cuerpo
   con la fila anadida, asi que entra en el `autoCommit` que ya hacen. Modo de
   la fila: en `plan`, el de config (y queda congelado); en el resto, el
   congelado (o el de config si la tarea es anterior a esta version y no
   tiene fila de plan). `decidido_por`: `persona` salvo `approve
   --decidido-por automatico`.

4. **`approve --decidido-por automatico|persona`** (por defecto `persona`):
   `automatico` se rechaza, con un error que dice que hacer, si el modo
   congelado de la tarea no es `automatico`. Cambiar el config despues de
   `plan` no habilita la aprobacion automatica de esa tarea.

5. **`taskctl pausa TASK-NNN`**: anade la fila `pausa` (modo congelado,
   `decidido_por: persona`) y la commitea sola, sin cambiar el estado. Es el
   «no» del semiautomatico (decision de Carlos: el no queda en el historico).

6. **`src/core/flujo.ts` (puro): `siguienteFase(task, ctx, modo)`** devuelve
   `{ fase, comando, accion, motivo }`, con `accion` en
   `detener | preguntar | continuar`:
   - `planificada` → `plan`.
   - `en-diseno`, sin plan redactado → `plan` (redactar el plan-final).
   - `en-diseno`, plan redactado y sin aprobar → `approve`.
   - `en-diseno`, aprobado → `start`.
   - `en-curso` → `review` (el CLI no sabe si la suite pasa: lo afirma el
     agente; riesgo aceptado en el plan de referencia).
   - `en-revision`: veredicto pendiente o sin linea → `veredicto` (falta el
     revisor); `cambios-solicitados` → `review` (otra ronda tras corregir);
     aprobada con `revision_codex` sin segunda opinion aprobada →
     `codex-review`; aprobada → `finish`.
   - `terminada` → `terminada`, sin comando, `detener`.
   La `accion` sale del modo: `manual` → `detener` siempre (la persona lanza
   el siguiente comando); `semiautomatico` → `preguntar` antes de approve,
   start, review (desde en-curso) y finish, `continuar` en los pasos
   internos de una fase (veredicto, codex-review, otra ronda); `automatico` →
   `continuar`, **salvo hotfix y release antes de `finish`, que devuelven
   `preguntar`** (decision de Carlos). Ningun camino propone `--push`.
   Las condiciones de legalidad no se copian: el test cruza la tabla con
   `assertTransitionAllowed` para que una fase propuesta sea siempre legal.

7. **`taskctl siguiente TASK-NNN [--json]`** (`src/commands/siguiente.ts`):
   solo lee, no commitea. Contexto con los mismos lectores que approve y
   finish (plan-final redactado, `informesDeUltimaRonda` + `veredictoDeRonda`,
   informes de codex). **Fuente**: el working tree; pero si la copia del
   working tree esta en `en-diseno` aprobada y la rama de la tarea existe en
   local sin estar integrada, la tarea vive en su rama: se lee de alli con
   `git show` (tarea y revision/). Asi `siguiente` da lo mismo desde develop
   que desde la rama. Salida legible por maquina con `--json`; sin el, una
   linea para personas. Codigo distinto de 0 con tarea inexistente o config
   roto.

## Lo que el rol no cubrio

No hubo rol propio: lo cubre el plan de referencia de TASK-055 (riesgos y
testing incluidos). Fuera de esta entrega, a proposito: el tope de rondas, el
bloqueo por arbol de trabajo, el informe en commit propio y las skills (C, D,
E).

## Riesgos aceptados y que los contiene

- Cada transicion cambia el cuerpo de `tarea.md`: los tests que comparan el
  cuerpo entero cambian de expectativa. Se revisa uno por uno que solo cambie
  por la seccion nueva.
- Tareas anteriores sin fila `plan`: modo = el de config, y la aprobacion
  automatica queda vetada (no hay modo congelado `automatico`).
- `siguiente` leyendo de la rama: si la rama no existe en local (solo en
  origin), se lee el working tree y el motivo lo dice.
- Una seccion `## Transiciones` editada a mano con filas mal formadas: se
  ignoran las filas que no casan; nunca se reescriben.

## Plan de pruebas

- `test/core/flujo.test.ts`: tabla literal estado × plan_aprobado × modo ×
  veredicto × tipo → `{fase, comando, accion}` con `deepEqual`, y cruce con
  `assertTransitionAllowed`. Mutantes: semiautomatico sin preguntar antes de
  finish; automatico preguntando en approve; hotfix sin parar en automatico.
- `test/core/transiciones.test.ts`: anadir sin tocar el resto del cuerpo,
  crear la seccion, leer, modo congelado = ultima fila plan.
- `test/core/config.test.ts`: `modo_flujo` sin clave = `manual` (asercion
  literal), valor invalido aborta listando los tres.
- `test/commands/siguiente.test.ts` (repo Git real, CLI por spawn): ciclo
  `new → plan → approve → start → review → veredicto → finish` comprobando
  `siguiente --json` en cada paso, una fila por transicion en el mismo
  commit, lectura desde develop con la tarea en su rama, exit != 0 con tarea
  inexistente y con config roto, `approve --decidido-por automatico`
  rechazado con modo congelado manual y aceptado con automatico (aunque el
  config cambie despues), y `pausa` con su commit.
- Suite completa: los tests que comparan cuerpos de `tarea.md`, revisados.

## Lo que necesita decision de una persona

Nada nuevo: las decisiones de Carlos del plan de referencia (modo por
defecto manual, hotfix/release preguntan antes de finish en automatico, el
«no» registrado) se aplican tal cual. Aprobado por el orquestador bajo la
autorizacion de Carlos de encadenar las entregas A→E («sigue»).
