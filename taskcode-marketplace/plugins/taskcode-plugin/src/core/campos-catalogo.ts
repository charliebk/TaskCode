/**
 * TASK-148a (CORE1-04, CORE1-05 de la auditoria 4D): lo comun de los
 * catalogos planos del plugin (skills, heuristica de complejidad y
 * doctor-deploy): la clave de bloque `prefijo_N_campo`, como se nombra un
 * valor rechazado y los validadores de campo. Antes cada catalogo tenia los
 * suyos, con reglas distintas (la lista vacia se admitia en uno y se rechazaba
 * en otro; los repetidos, igual pero al reves).
 *
 * Una regla para todos: una lista es de textos no vacios y sin repetidos (una
 * entrada dos veces casaria dos veces); si puede estar vacia lo dice quien
 * llama con `minimo`. Cada catalogo pone su clase de error (`crearError`) y,
 * si hace falta, una explicacion propia de su dominio (`detalle`).
 */

export type CrearError = (mensaje: string) => Error;

/** Una clave `prefijo_N_campo` partida; null si no tiene esa forma. */
export interface ClaveDeBloque {
  prefijo: string;
  n: number;
  campo: string;
}

const CLAVE_DE_BLOQUE_RE = /^([a-z]+)_(\d+)_([a-z_]+)$/;

export function claveDeBloque(clave: string): ClaveDeBloque | null {
  const m = CLAVE_DE_BLOQUE_RE.exec(clave);
  return m === null ? null : { prefijo: m[1] as string, n: Number(m[2]), campo: m[3] as string };
}

/** Como se nombra un valor rechazado en un mensaje de error. */
export function describirValor(valor: unknown): string {
  if (valor === null) return 'un valor vacio';
  if (Array.isArray(valor)) return `una lista (${JSON.stringify(valor)})`;
  if (typeof valor === 'string') return `el texto "${valor}"`;
  return `${String(valor)} (${typeof valor})`;
}

const conDetalle = (mensaje: string, detalle: string | undefined): string =>
  detalle === undefined ? mensaje : `${mensaje}\n        ${detalle.split('\n').join('\n        ')}`;

export function validarEnteroNoNegativo(
  donde: string,
  clave: string,
  valor: unknown,
  crearError: CrearError,
  detalle?: string
): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
    throw crearError(
      conDetalle(
        `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 0, y es ${describirValor(valor)}.\n` +
          '        Escribe el numero sin comillas y sin decimales.',
        detalle
      )
    );
  }
  return valor;
}

export function validarTextoNoVacio(donde: string, clave: string, valor: unknown, crearError: CrearError): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw crearError(`[ERROR] ${donde}: "${clave}" debe ser texto no vacio, y es ${describirValor(valor)}.`);
  }
  return valor.trim();
}

/** Uno de `permitidos` (se compara recortado). */
export function validarEnum<T extends string>(
  donde: string,
  clave: string,
  valor: unknown,
  permitidos: readonly T[],
  crearError: CrearError
): T {
  const t = typeof valor === 'string' ? valor.trim() : null;
  if (t === null || !(permitidos as readonly string[]).includes(t)) {
    throw crearError(
      `[ERROR] ${donde}: "${clave}" tiene el valor ${describirValor(valor)}, pero debe ser uno de: ${permitidos.join(', ')}.`
    );
  }
  return t as T;
}

export interface OpcionesLista {
  /** Cuantas entradas como minimo (0: puede estar vacia). */
  minimo?: number;
  /** Por que no puede estar vacia, para el mensaje (cuando `minimo` > 0). */
  porQueNoVacia?: string;
  /** Explicacion del dominio que se anade al error de forma (no es una lista). */
  detalle?: string;
}

/** Lista de textos no vacios ni repetidos, recortados. */
export function validarListaDeTexto(
  donde: string,
  clave: string,
  valor: unknown,
  crearError: CrearError,
  o: OpcionesLista = {}
): string[] {
  if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string')) {
    throw crearError(
      conDetalle(
        `[ERROR] ${donde}: "${clave}" debe ser una lista de textos entre corchetes (p. ej. [a, b]), y es ${describirValor(valor)}.`,
        o.detalle
      )
    );
  }
  const entradas = (valor as string[]).map((x) => x.trim());
  if (entradas.some((x) => x === '')) {
    throw crearError(
      `[ERROR] ${donde}: "${clave}" tiene alguna entrada vacia.
` +
        '        Quitala: no aporta nada y, comparada como subcadena, casaria con cualquier texto.'
    );
  }
  const repetida = entradas.find((x, i) => entradas.indexOf(x) !== i);
  if (repetida !== undefined) {
    throw crearError(
      `[ERROR] ${donde}: "${clave}" tiene la entrada "${repetida}" repetida.
` +
        '        Deja solo una: la lista se recorre entera, asi que una entrada dos veces contaria doble.'
    );
  }
  if (entradas.length < (o.minimo ?? 0)) {
    throw crearError(conDetalle(`[ERROR] ${donde}: "${clave}" no puede estar vacia.`, o.porQueNoVacia));
  }
  return entradas;
}
