// PROVISIONAL (agente B): el orquestador conserva la version del agente A
export interface Cierre {
  inicio: string;
  fin: string;
  segundos: number;
}

const INSTANTE = '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z';
const LINEA_RE = new RegExp(`^- Cierre \\(finish\\): (\\d+) s, de (${INSTANTE}) a (${INSTANTE})$`, 'm');

function instanteValido(s: string): boolean {
  const ms = Date.parse(s);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 19) + 'Z' === s;
}

export function lineaCierre(inicio: string, fin: string): string {
  const segundos = Math.max(0, Math.round((Date.parse(fin) - Date.parse(inicio)) / 1000));
  return `- Cierre (finish): ${String(segundos)} s, de ${inicio} a ${fin}`;
}

export function anotarCierre(body: string, inicio: string, fin: string): string {
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  const linea = lineaCierre(inicio, fin);
  const sin = body.split(/\r?\n/).filter((l) => !LINEA_RE.test(l));
  const i = sin.findIndex((l) => l.trim() === '## Duracion');
  if (i === -1) return `${body.replace(/(\r?\n)*$/, '')}${eol}${eol}## Duracion${eol}${eol}${linea}${eol}`;
  let fin2 = i + 1;
  while (fin2 < sin.length && !/^##\s/.test(sin[fin2] as string)) fin2++;
  while (fin2 > i + 1 && (sin[fin2 - 1] as string).trim() === '') fin2--;
  sin.splice(fin2, 0, linea);
  return sin.join(eol);
}

/** Lee la linea de cierre de `## Duracion`; null si no hay o si alguna fecha no es un instante valido. */
export function leerCierre(body: string): Cierre | null {
  const m = LINEA_RE.exec(body.replace(/\r/g, ''));
  if (m === null) return null;
  const inicio = m[2] as string;
  const fin = m[3] as string;
  if (!instanteValido(inicio) || !instanteValido(fin)) return null;
  return { inicio, fin, segundos: Number(m[1]) };
}
