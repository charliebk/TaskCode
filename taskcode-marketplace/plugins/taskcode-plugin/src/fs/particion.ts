/**
 * Escritura de la particion propuesta — TASK-044. Va FUERA del repo: dentro
 * ensuciaria el workspace y el guard de `taskctl import` abortaria el
 * propio import. Una carpeta nueva por intento (`mkdtemp`, el precedente de
 * sincronizacion.ts): dos proyectos con el mismo ID o dos `plan` a la vez no
 * se pisan, y una propuesta ya editada por la persona no se sobrescribe.
 */
import { mkdtemp, realpath, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export type ResultadoEscrituraParticion =
  | { escrito: true; ruta: string }
  | { escrito: false; motivo: string };

/** true si `ruta` esta dentro de `raiz` (las dos ya resueltas con realpath). */
function estaDentro(ruta: string, raiz: string): boolean {
  const rel = path.relative(raiz, ruta);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Nunca lanza: si no se puede escribir, quien llama sigue con su error de
 * bloqueo y solo menciona el motivo (no nombra un fichero que no existe).
 */
export async function escribirPropuestaParticion(
  id: string,
  markdown: string,
  repoCwd: string,
  base: string = tmpdir()
): Promise<ResultadoEscrituraParticion> {
  try {
    // realpath en los dos lados: en Windows tmpdir() puede venir en
    // nombre corto 8.3 (C:\Users\NOMBRE~1) y path.relative se equivocaria.
    const raiz = await realpath(repoCwd);
    const baseReal = await realpath(base);
    if (estaDentro(baseReal, raiz)) {
      return { escrito: false, motivo: `el directorio temporal "${baseReal}" cae dentro del repo` };
    }
    const dir = await mkdtemp(path.join(baseReal, `taskctl-particion-${id}-`));
    const ruta = path.join(dir, `particion-${id}.md`);
    // Temporal + rename: un fichero a medias lo aceptaria import en parte.
    const temporal = `${ruta}.tmp`;
    await writeFile(temporal, markdown, 'utf8');
    await rename(temporal, ruta);
    return { escrito: true, ruta };
  } catch (e) {
    return { escrito: false, motivo: e instanceof Error ? e.message : String(e) };
  }
}
