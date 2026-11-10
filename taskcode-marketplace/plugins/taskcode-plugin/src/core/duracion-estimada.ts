/**
 * TASK-097: regla de una hora. Una tarea prevista de mas de una hora de punta
 * a punta (de la rama abierta al cierre con merge) se trocea. Se estima al
 * planificar: el plan lleva la linea `Duracion estimada: N min`, la persona
 * decide en approve y finish anota la duracion real para calibrar.
 *
 * Puro: lee texto, no toca disco.
 */

/** Por encima de esto, la tarea deberia partirse (decision de la persona). */
export const UMBRAL_MINUTOS = 60;

/** Linea que lleva la plantilla del plan; sin cifra cuenta como ausente. */
export const LINEA_PLANTILLA_DURACION =
  'Duracion estimada:  min (de la rama abierta al cierre con merge; senales: ficheros de codigo previstos, capas, criterios)';

export type LecturaDuracion =
  | { tipo: 'ausente' }
  | { tipo: 'ilegible'; valor: string }
  | { tipo: 'ok'; minutos: number };

const LINEA_RE = /^\s*[*_]*\s*duraci[oó]n estimada\s*[*_]*\s*:\s*[*_]*\s*(.*)$/i;
const CIFRA_RE = /^(\d+)\s*(?:min|minutos?)?(?![\d.,:h-])/i;

/**
 * La duracion estimada del plan. Se ignoran los bloques de codigo (un ejemplo
 * dentro de ``` no es la estimacion). Sin la linea, o con la linea sin cifra
 * (la plantilla), `ausente`; con una cifra entera de minutos, `ok`; cualquier
 * otra forma (`1h30`, `~90`, `90-120`, `1,5 h`), `ilegible`: no se adivina.
 */
export function leerDuracionEstimada(texto: string): LecturaDuracion {
  let enBloque = false;
  for (const cruda of texto.replace(/\r/g, '').split('\n')) {
    if (/^\s*(```|~~~)/.test(cruda)) {
      enBloque = !enBloque;
      continue;
    }
    if (enBloque) continue;
    const m = LINEA_RE.exec(cruda);
    if (m === null) continue;
    const valor = (m[1] as string).trim();
    if (!/\d/.test(valor)) return { tipo: 'ausente' };
    const c = CIFRA_RE.exec(valor);
    if (c === null) return { tipo: 'ilegible', valor };
    return { tipo: 'ok', minutos: Number(c[1]) };
  }
  return { tipo: 'ausente' };
}

/** true si la estimacion obliga a decidir trocear: pasa del umbral o no se entiende. */
export function superaUmbral(l: LecturaDuracion): boolean {
  return l.tipo === 'ilegible' || (l.tipo === 'ok' && l.minutos > UMBRAL_MINUTOS);
}

/** Frase para motivos y errores: que dice el plan y que hacer. */
export function describirExceso(l: LecturaDuracion): string {
  const dice = l.tipo === 'ok' ? `estima ${String(l.minutos)} min` : `trae una duracion que no se entiende ("${l.tipo === 'ilegible' ? l.valor : ''}")`;
  return (
    `el plan ${dice}, y la regla de una hora pide trocear toda tarea de mas de ` +
    `${String(UMBRAL_MINUTOS)} min de punta a punta (de la rama abierta al cierre con merge). ` +
    'Lo decide una persona: partirla en tareas de una hora o menos, o aprobarla entera con el motivo escrito en el plan'
  );
}

// --- Seccion ## Duracion de tarea.md (la escribe finish) ----------------------

export const SECCION_DURACION = '## Duracion';

/** Minutos estimados que finish dejo anotados en `## Duracion`, o null. */
export function estimadaAnotada(body: string): number | null {
  const m = /^- Estimada: (\d+) min$/m.exec(body.replace(/\r/g, ''));
  return m === null ? null : Number(m[1]);
}

/**
 * Escribe (o reemplaza) la seccion `## Duracion` con la estimacion del plan y
 * la duracion real de punta a punta. Un dato que falta va como `—`, nunca 0.
 * Reemplaza, no anade: un finish reintentado no duplica la seccion.
 */
export function anotarDuracion(body: string, estimada: LecturaDuracion, realMin: number | null): string {
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  const est =
    estimada.tipo === 'ok' ? `${String(estimada.minutos)} min` : estimada.tipo === 'ilegible' ? `— (no se entiende: ${estimada.valor})` : '— (el plan no la dice)';
  const real = realMin === null ? '— (sin hora en start o finish)' : `${String(realMin)} min`;
  const lineasSeccion = [
    SECCION_DURACION,
    '',
    `- Estimada: ${est}`,
    `- Real (de la rama abierta al cierre con merge, sin pausas): ${real}`,
    ...(estimada.tipo === 'ok' && realMin !== null && realMin > UMBRAL_MINUTOS
      ? [`- Paso de la hora: ${String(realMin)} min reales frente a ${String(estimada.minutos)} estimados`]
      : []),
  ];
  const lineas = body.split(/\r?\n/);
  const ini = lineas.findIndex((l) => l.trim() === SECCION_DURACION);
  if (ini === -1) {
    const base = body.replace(/(\r?\n)*$/, '');
    return `${base}${base === '' ? '' : eol + eol}${lineasSeccion.join(eol)}${eol}`;
  }
  let fin = ini + 1;
  while (fin < lineas.length && !/^##\s/.test(lineas[fin] as string)) fin++;
  const despues = lineas.slice(fin);
  return [...lineas.slice(0, ini), ...lineasSeccion, ...(despues.length > 0 ? ['', ...despues] : [''])].join(eol);
}
