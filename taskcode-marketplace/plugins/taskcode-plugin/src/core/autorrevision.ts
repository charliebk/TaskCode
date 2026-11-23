/**
 * TASK-082: la constancia de la autorrevision del implementador.
 *
 * Antes de `taskctl review`, quien implementa pasa la seccion
 * `## Que se revisa` de cada revisora que le toca y lo anota en `tarea.md`
 * bajo `## Autorrevision`, una linea `- <revisora> — <commit>` por revisora.
 * `review` avisa (sin bloquear) si falta.
 *
 * Cuenta como constancia la seccion CON contenido: un encabezado vacio (por
 * ejemplo, el que traeria una plantilla) no es una autorrevision hecha.
 * Contenido = alguna linea no vacia que no sea solo un comentario HTML. Se
 * exige una vez por tarea, no por ronda (decision de la persona en el plan).
 *
 * Pura y total: no toca disco ni Git y nunca lanza. `review` la llama antes
 * de su primera escritura, y un fallo aqui no puede dejar una ronda a medias.
 */
import { contenidoDeSeccion } from './transiciones.js';

/** Titulo exacto de la seccion, sin tilde, como `## Transiciones` y `## Coste`. */
export const SECCION_AUTORREVISION = '## Autorrevision';

/** ¿Tiene `body` la seccion de autorrevision con al menos una linea de contenido? */
export function tieneAutorrevision(body: string): boolean {
  return (contenidoDeSeccion(body, SECCION_AUTORREVISION) ?? []).length > 0;
}

/**
 * TASK-153 (Regla 4D al crear): la linea `- 4D — <commit>: ...` de la
 * autorrevision. Antes cualquier linea daba la constancia por buena (CONT-08
 * de la auditoria de TASK-141), asi que la autorrevision 4D podia no hacerse
 * sin que nada avisara. Vale con guion largo, corto o dos puntos tras «4D».
 */
export function tieneLinea4D(body: string): boolean {
  return (contenidoDeSeccion(body, SECCION_AUTORREVISION) ?? []).some((l) => /^\s*[-*]\s*4D\s*(?:—|–|-|:)\s*\S/.test(l));
}

/** El aviso de `review` si falta la constancia o su linea 4D; null si esta todo. */
export function avisoAutorrevision(body: string, id: string): string | null {
  if (tieneAutorrevision(body)) {
    if (tieneLinea4D(body)) return null;
    return (
      `${id}: la autorrevision de tarea.md no trae la linea de la Regla 4D. La revision sigue, pero antes ` +
      'de pedirla conviene hacer la autorrevision 4D (buscar el helper que ya existe antes de crear uno, ' +
      'citar el criterio que motiva cada cambio, mutar cada test nuevo y verlo en rojo) y anotarla en ' +
      `"${SECCION_AUTORREVISION}": "- 4D — <commit>: helper buscado, criterios citados, N tests mutados".`
    );
  }
  return (
    `${id}: tarea.md no tiene la constancia de la autorrevision (seccion "${SECCION_AUTORREVISION}" con contenido). ` +
    'La revision sigue, pero antes de pedirla conviene pasar la seccion "## Que se revisa" de cada revisora ' +
    'que da "taskctl siguiente --json" (campo "revisores"), corregir lo evidente y anotar en tarea.md ' +
    `"${SECCION_AUTORREVISION}" con una linea "- <revisora> — <commit>" por revisora, commiteada, ` +
    'y la de la Regla 4D: "- 4D — <commit>: helper buscado, criterios citados, N tests mutados".'
  );
}
