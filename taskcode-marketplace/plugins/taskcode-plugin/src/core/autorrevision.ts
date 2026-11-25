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
 *
 * TASK-158b: `etiqueta` distingue las lineas de quien corrige: `''` es la de
 * la implementacion (`- 4D — `), `ronda K` la de las correcciones de la ronda
 * K (`- 4D ronda K — `) y `menores` la de los MENORES tras aprobar. Ninguna
 * cuenta por otra: la de la ronda 1 no vale para la ronda 2.
 */
export function tieneLinea4D(body: string, etiqueta = ''): boolean {
  // MEN-1 de su revision: la etiqueta es texto, no regex (se escapa cada palabra).
  const palabras = etiqueta.trim().split(/\s+/).filter((p) => p !== '').map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const tras4D = palabras.length === 0 ? '' : `\\s+${palabras.join('\\s+')}`;
  const linea = new RegExp(`^\\s*[-*]\\s*4D${tras4D}\\s*(?:—|–|-|:)\\s*\\S`);
  return (contenidoDeSeccion(body, SECCION_AUTORREVISION) ?? []).some((l) => linea.test(l));
}

/** El formato de la linea de quien corrige, el mismo que da revision.md. */
const FORMATO_CORRECCION = '<commit>: usos buscados, N tests mutados';

/**
 * TASK-158b: aviso de `review` al abrir la ronda K+1 si las correcciones de la
 * ronda K no traen su autorrevision 4D; null si esta.
 */
export function avisoAutorrevisionRonda(body: string, id: string, ronda: number): string | null {
  if (tieneLinea4D(body, `ronda ${String(ronda)}`)) return null;
  return (
    `${id}: las correcciones de la ronda ${String(ronda)} no traen su autorrevision 4D en "${SECCION_AUTORREVISION}". ` +
    'La ronda se abre igual, pero quien corrige busca todos los usos de lo que corrige (no solo los que cita el ' +
    `hallazgo), muta cada test nuevo y lo anota: "- 4D ronda ${String(ronda)} — ${FORMATO_CORRECCION}".`
  );
}

/**
 * TASK-158b: aviso de `verificar-menores` si los MENORES corregidos no traen
 * su autorrevision 4D; null si esta.
 */
export function avisoAutorrevisionMenores(body: string, id: string): string | null {
  if (tieneLinea4D(body, 'menores')) return null;
  return (
    `${id}: los MENORES corregidos no traen su autorrevision 4D en "${SECCION_AUTORREVISION}". ` +
    'La verificacion queda registrada igual, pero quien corrige busca todos los usos de lo que corrige, muta ' +
    `cada test nuevo y lo anota: "- 4D menores — ${FORMATO_CORRECCION}".`
  );
}

/** El aviso de `review` si falta la constancia o su linea 4D; null si esta todo. */
export function avisoAutorrevision(body: string, id: string): string | null {
  if (tieneAutorrevision(body)) {
    if (tieneLinea4D(body)) return null;
    return (
      `${id}: la autorrevision de tarea.md no trae la linea de la Regla 4D. La revision sigue, pero antes ` +
      'de pedirla conviene hacer la autorrevision 4D (buscar el helper que ya existe antes de crear uno, ' +
      'citar el criterio que motiva cada cambio, buscar todos los usos de lo que se unifica, mutar cada test nuevo y verlo en rojo) y anotarla en ' +
      `"${SECCION_AUTORREVISION}": "- 4D — <commit>: helper buscado, usos buscados, criterios citados, N tests mutados".`
    );
  }
  return (
    `${id}: tarea.md no tiene la constancia de la autorrevision (seccion "${SECCION_AUTORREVISION}" con contenido). ` +
    'La revision sigue, pero antes de pedirla conviene pasar la seccion "## Que se revisa" de cada revisora ' +
    'que da "taskctl siguiente --json" (campo "revisores"), corregir lo evidente y anotar en tarea.md ' +
    `"${SECCION_AUTORREVISION}" con una linea "- <revisora> — <commit>" por revisora, commiteada, ` +
    'y la de la Regla 4D: "- 4D — <commit>: helper buscado, usos buscados, criterios citados, N tests mutados".'
  );
}
