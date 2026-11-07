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
import { rangoDeSeccion } from './transiciones.js';

/** Titulo exacto de la seccion, sin tilde, como `## Transiciones` y `## Coste`. */
export const SECCION_AUTORREVISION = '## Autorrevision';

/** ¿Tiene `body` la seccion de autorrevision con al menos una linea de contenido? */
export function tieneAutorrevision(body: string): boolean {
  const lineas = body.split(/\r?\n/);
  const rango = rangoDeSeccion(lineas, SECCION_AUTORREVISION);
  if (rango === null) return false;
  const [inicio, fin] = rango;
  const contenido = lineas
    .slice(inicio + 1, fin)
    .join('\n')
    .replace(/<!--[\s\S]*?-->/g, '');
  return contenido.trim() !== '';
}

/** El aviso de `review` si falta la constancia; null si esta. */
export function avisoAutorrevision(body: string, id: string): string | null {
  if (tieneAutorrevision(body)) return null;
  return (
    `${id}: tarea.md no tiene la constancia de la autorrevision (seccion "${SECCION_AUTORREVISION}" con contenido). ` +
    'La revision sigue, pero antes de pedirla conviene pasar la seccion "## Que se revisa" de cada revisora ' +
    'que da "taskctl siguiente --json" (campo "revisores"), corregir lo evidente y anotar en tarea.md ' +
    `"${SECCION_AUTORREVISION}" con una linea "- <revisora> — <commit>" por revisora, commiteada.`
  );
}
