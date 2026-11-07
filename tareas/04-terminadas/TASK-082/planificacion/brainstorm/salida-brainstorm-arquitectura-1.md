# Brainstorm — TASK-082, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

- **Fuente única de la lista: la sección `## Que se revisa` que ya tiene cada revisora** (`skills/<revisor>/SKILL.md`). No se crea ningún fichero nuevo de lista. `skills/task-workflow/revision.md` (líneas 3-7) ya establece que «que se revisa» es lo propio de cada skill revisora. Para la autorrevisión, la skill `review` manda leer **solo esa sección**, no la skill entera: la reproducción con clon y mutantes es tarea del revisor, no del implementador.
- Hay que unificar el título del ancla: `csharp-autocad-ifc-reviewer/SKILL.md:127` usa `## Que se revisa en este dominio`, mientras que las otras cuatro usan `## Que se revisa`.
- `skills/review/SKILL.md`, paso 2, rama `review`: antes de `taskctl review TASK-NNN` se añade un subpaso. El implementador recorre `## Que se revisa` de la revisora o revisoras del diff (y de `code-quality-reviewer` si queda algún fichero sin dominio), corrige lo evidente, hace commit y anota la constancia en una sección `## Autorrevision` de `tarea.md`, con una línea por revisora pasada. En su propio contexto, sin lanzar el `Agent`.
- `taskctl review`: módulo nuevo y puro `src/core/autorrevision.ts` con `SECCION_AUTORREVISION = '## Autorrevision'` y `avisoAutorrevision(body: string, id: string): string | null`. Detecta la sección con `rangoDeSeccion` de `src/core/transiciones.ts:208`, el helper que ya reutiliza `## Coste` (`core/coste-registro.ts`).
- En `src/commands/review.ts`, `runReviewCommand` lo llama tras la lectura fresca (línea 524, `existing.body`) y mete el resultado en `avisos` (línea 532); `cli.ts:701` ya lo imprime como `[AVISO]` por stderr sin cambiar el código de salida.

## Que se extiende y que se crea

- `skills/review/SKILL.md` — se extiende con el subpaso y el formato de `## Autorrevision`.
- `skills/csharp-autocad-ifc-reviewer/SKILL.md` — solo se renombra el título del ancla.
- `src/core/autorrevision.ts` — se crea, puro.
- `src/commands/review.ts` — una línea que empuja a `avisos`. `ReviewCommandResult` no cambia.
- Las otras cuatro revisoras no se tocan.
- Orden: 1) unificar el ancla; 2) `core/autorrevision.ts`; 3) enganche en `review.ts`; 4) texto de la skill `review`.

## Limites que cruza

- **Formato de `tarea.md`**: sección nueva `## Autorrevision`. `rangoDeSeccion` compara `trimEnd() === titulo` exacto: título único, sin tilde, como `## Transiciones` y `## Coste`.
- **Contrato de las skills revisoras**: `## Que se revisa` pasa a ser interfaz pública. Ya hay tests anclados en ese título (`test/skills/revisores.test.ts:1220-1233`, TASK-080). Motivo principal para no sacar la lista a otro fichero.
- **«Vive en un solo sitio»**: precedente el test 10e (`revisores.test.ts:994`). La skill `review` remite a la sección y no copia ningún punto.
- **Portabilidad**: el texto nuevo no nombra TaskCode ni rutas internas.
- **Dependencias**: `commands/review.ts` → `core/autorrevision.ts` → `core/transiciones.ts`. Sin ciclos.
- **Descartado**: `skills/<revisor>/comprobacion.md` por revisora (rompe el ancla de TASK-080, parte el dominio en dos ficheros, prosa y viñeta divergen). **Descartado**: abortar sin la sección (el criterio dice «sin bloquear»).

## La decision de diseño que mas te preocupa (UNA sola)

**Cómo sabe el implementador qué revisora le toca *antes* de `taskctl review`.** Solo `clasificarPorDominio` (`core/revisores.ts`) decide los dominios, dentro de `runReviewCommand`. Pedir al LLM que «mire los `patrones_archivo`» crea una segunda copia mental del clasificador (HALLAZGOS ya recoge dos divergencias de copias de esos patrones, citado en `revisores.ts:17-21`). Propuesta: `taskctl siguiente TASK-NNN --json` devuelve `revisores: string[]` cuando `fase === 'review'`, desde una función compartida con `runReviewCommand` (p. ej. `revisoresDelRango(repoCwd, desde, excluir)` en `src/fs/`). Si el unificador lo ve fuera de una complejidad media, mínimo: la skill nombra las revisoras por su `description` y el plan acepta esa imprecisión explícitamente. Nunca «aplica los patrones».

Suposiciones no verificadas:
- Si en las rondas incrementales también hay que avisar (regla de dominio).
- Si `code-quality-reviewer` entra siempre o solo como reserva (regla de dominio).
- No leídas las líneas 24-38 de `siguiente.ts`: se supone que añadir el campo a su JSON no rompe a quien lo consume (`task-workflow/avance.md`).
