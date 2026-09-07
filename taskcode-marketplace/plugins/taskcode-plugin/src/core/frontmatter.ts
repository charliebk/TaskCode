/**
 * Parser y serializador minimo de YAML-frontmatter, escrito a mano
 * (sin dependencias externas). Soporta el subconjunto de YAML que usa
 * `tarea.md`: escalares, cadenas entre comillas dobles, listas en
 * estilo flow ([a, b, c]), null, booleanos, numeros enteros y
 * comentarios de linea (`# ...`) tras el valor.
 *
 * No es un parser YAML general: no soporta anidamiento, listas en
 * bloque (con "-"), ni multilinea. Eso es deliberado: es mas barato
 * de escribir, de revisar y de mantener que tirar de una libreria
 * completa para un formato que nosotros mismos controlamos.
 *
 * Desde TASK-030 (item C4) el bucle `clave: valor` vive extraido en
 * parseBloqueClaveValor() y lo comparten este modulo y
 * src/core/config.ts (`.taskcode/config.yml`), que usa exactamente el
 * mismo subconjunto. Es un unico parser a proposito: dos parsers YAML
 * escritos a mano del mismo subconjunto acaban discrepando.
 *
 * Nota de robustez (hallazgo de revision por pares, Sprint 0):
 * cualquier string que se serializa se cita SIEMPRE que, sin comillas,
 * se re-parsearia como otra cosa (numero, boolean, null, o un
 * elemento de lista con coma) — no solo cuando "contiene caracteres
 * raros". Esto evita que un titulo como "2026" o "true" se convierta
 * en un numero/boolean al releerlo y rompa la validacion de Task.
 */

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  body: string;
}

const FRONTMATTER_DELIM = '---';

export class FrontmatterParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FrontmatterParseError';
  }
}

/** Un par `clave: valor` ya parseado, con la linea (1-based) donde salio. */
export interface ParClaveValor {
  clave: string;
  valor: unknown;
  numeroLinea: number;
}

export interface OpcionesBloqueClaveValor {
  /**
   * Palabra que aparece en los mensajes de error ("frontmatter",
   * "config"). Sin esto, un `.taskcode/config.yml` malformado se
   * quejaria de "frontmatter", que no es lo que el usuario esta
   * editando.
   */
  etiqueta: string;
  /** Constructor del error de cada caller (FrontmatterParseError, ConfigError...). */
  crearError: (mensaje: string) => Error;
  /** Si devuelve true, el bloque termina ahi (esa linea no se parsea como par). */
  esFin?: (linea: string) => boolean;
  /**
   * Saltarse las lineas que empiezan por "#". Apagado por defecto a
   * proposito: el frontmatter de tarea.md nunca las ha admitido (una
   * linea sin ":" es un error) y encenderlas ahi seria un cambio de
   * comportamiento colado por la puerta de atras. En config.yml, en
   * cambio, un fichero de configuracion sin comentarios de linea seria
   * inservible.
   */
  permitirComentariosDeLinea?: boolean;
}

export interface BloqueClaveValor {
  /** Ultimo valor de cada clave (una clave repetida se pisa: ver `pares`). */
  data: Record<string, unknown>;
  /**
   * Los pares EN ORDEN y con repeticiones. `data` pierde los
   * duplicados; quien necesite detectarlos (config.ts, donde un
   * `limite_wip` escrito dos veces es un fallo que hay que gritar)
   * mira aqui.
   */
  pares: ParClaveValor[];
  /** Indice de la linea SIGUIENTE a la que cerro el bloque. */
  siguiente: number;
  /** true si se encontro la linea de fin (solo relevante con `esFin`). */
  cerrado: boolean;
}

/**
 * El bucle `clave: valor` compartido — extraido de parseFrontmatter en
 * TASK-030 (item C4) para que `.taskcode/config.yml` NO tenga un
 * segundo parser de YAML. Dos parsers a mano del mismo subconjunto
 * divergen; este es el unico sitio donde se decide que es una linea
 * valida, que es un comentario y como se tipa un escalar.
 *
 * No conoce ni frontmatter ni config: recibe por donde empezar, como
 * saber que el bloque termino y como construir sus errores.
 */
export function parseBloqueClaveValor(
  lineas: readonly string[],
  desde: number,
  opciones: OpcionesBloqueClaveValor
): BloqueClaveValor {
  const data: Record<string, unknown> = {};
  const pares: ParClaveValor[] = [];
  let i = desde;
  let cerrado = false;

  for (; i < lineas.length; i++) {
    const line = lineas[i] ?? '';
    if (opciones.esFin !== undefined && opciones.esFin(line)) {
      cerrado = true;
      i++;
      break;
    }
    const trimmed = line.trim();
    if (trimmed === '') continue;
    if (opciones.permitirComentariosDeLinea === true && trimmed.startsWith('#')) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      throw opciones.crearError(
        `Linea de ${opciones.etiqueta} invalida (falta ":"): "${line}"`
      );
    }
    const clave = line.slice(0, colonIdx).trim();
    if (clave === '') {
      throw opciones.crearError(
        `Linea de ${opciones.etiqueta} con clave vacia: "${line}"`
      );
    }
    const rawValue = stripInlineComment(line.slice(colonIdx + 1).trim());
    const valor = parseScalarOrArray(rawValue);
    data[clave] = valor;
    pares.push({ clave, valor, numeroLinea: i + 1 });
  }

  return { data, pares, siguiente: i, cerrado };
}

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const lines = content.split(/\r?\n/);
  if ((lines[0] ?? '').trim() !== FRONTMATTER_DELIM) {
    throw new FrontmatterParseError(
      'El documento no empieza con un bloque frontmatter "---".'
    );
  }

  const { data, siguiente, cerrado } = parseBloqueClaveValor(lines, 1, {
    etiqueta: 'frontmatter',
    crearError: (mensaje) => new FrontmatterParseError(mensaje),
    esFin: (linea) => linea.trim() === FRONTMATTER_DELIM,
  });

  if (!cerrado) {
    throw new FrontmatterParseError('El bloque frontmatter no se cierra con "---".');
  }

  const body = lines.slice(siguiente).join('\n').replace(/^\n+/, '');
  return { data, body };
}

export function serializeFrontmatter(
  data: Record<string, unknown>,
  body: string,
  order: readonly string[]
): string {
  const lines: string[] = [FRONTMATTER_DELIM];
  for (const key of order) {
    if (!(key in data)) continue;
    lines.push(`${key}: ${serializeValue(data[key])}`);
  }
  lines.push(FRONTMATTER_DELIM);
  const bodyTrimmed = body.replace(/^\n+/, '');
  const bodyPart = bodyTrimmed.length > 0 ? `\n${bodyTrimmed}` : '\n';
  return lines.join('\n') + bodyPart;
}

function stripInlineComment(raw: string): string {
  if (raw.startsWith('"')) {
    const closeIdx = findClosingQuote(raw);
    if (closeIdx !== -1) return raw.slice(0, closeIdx + 1);
    return raw;
  }
  const hashIdx = raw.indexOf(' #');
  if (hashIdx !== -1) return raw.slice(0, hashIdx).trim();
  return raw;
}

/** Indice de la comilla de cierre real, ignorando comillas escapadas (\"). */
function findClosingQuote(raw: string): number {
  for (let j = 1; j < raw.length; j++) {
    if (raw[j] === '"' && raw[j - 1] !== '\\') return j;
  }
  return -1;
}

function parseScalarOrArray(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === '~') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner === '') return [];
    return splitTopLevelCommas(inner).map((s) => unquote(s.trim()));
  }
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  return unquote(trimmed);
}

/**
 * Divide el interior de una lista flow ([a, "b, c", d]) por comas que
 * no esten dentro de comillas, para que un elemento citado con coma
 * dentro no se parta en dos.
 */
function splitTopLevelCommas(s: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' && s[i - 1] !== '\\') {
      inQuotes = !inQuotes;
      current += c;
      continue;
    }
    if (c === ',' && !inQuotes) {
      parts.push(current);
      current = '';
      continue;
    }
    current += c;
  }
  parts.push(current);
  return parts;
}

function unquote(s: string): string {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"');
  }
  return s;
}

function serializeValue(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    return `[${v.map((x) => serializeScalarString(String(x))).join(', ')}]`;
  }
  return serializeScalarString(String(v));
}

/**
 * Cita un string si, sin comillas, se re-parsearia como otra cosa
 * (numero, boolean, null) o rompe el formato (contiene ":", "#",
 * "[", "]", ",", '"', o un espacio). Es intencionalmente conservador:
 * mejor citar de mas que perder el tipo en el roundtrip.
 */
function serializeScalarString(s: string): string {
  return needsQuoting(s) ? quoteString(s) : s;
}

function needsQuoting(s: string): boolean {
  if (s === '') return true;
  if (s === 'null' || s === '~' || s === 'true' || s === 'false') return true;
  if (/^-?\d+$/.test(s)) return true;
  if (/[:#[\],"]/.test(s) || s.includes(' ')) return true;
  return false;
}

function quoteString(s: string): string {
  return `"${s.replace(/"/g, '\\"')}"`;
}
