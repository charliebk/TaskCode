/**
 * TASK-111: el ultimo verde del freno Stop. Memo PROPIO del freno, aparte del
 * memo compartido de fs/verificacion.ts: aquel no se guarda en la selectiva ni
 * en la de documentacion con el arbol sucio (TASK-105: no pisar el verde
 * limpio que buscan finish y el guardian), asi que con cambios sin commitear
 * el freno repetia la verificacion en cada turno aunque el turno no tocara
 * nada. Este solo lo lee el freno: no abre ninguna otra puerta.
 *
 * Vive en `git rev-parse --git-path taskcode/freno-ultimo-verde.json`. Leer y
 * guardar nunca lanzan: sin memo, el freno verifica como siempre.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const VERSION = 1;

function rutaUltimoVerde(raiz: string): string | null {
  const r = spawnSync('git', ['rev-parse', '--git-path', 'taskcode/freno-ultimo-verde.json'], {
    cwd: raiz,
    encoding: 'utf8',
    windowsHide: true,
  });
  const salida = (r.stdout ?? '').trim();
  if (r.error !== undefined || r.status !== 0 || salida === '') return null;
  return path.resolve(raiz, salida);
}

/** true si `huella` es la del ultimo verde del freno para ese tipo de verificacion. */
export function esUltimoVerde(raiz: string, tipo: string, huella: string): boolean {
  try {
    const ruta = rutaUltimoVerde(raiz);
    if (ruta === null) return false;
    const m = JSON.parse(readFileSync(ruta, 'utf8')) as { version?: unknown; tipo?: unknown; huella?: unknown };
    return m.version === VERSION && m.tipo === tipo && m.huella === huella;
  } catch {
    return false;
  }
}

export function guardarUltimoVerde(raiz: string, tipo: string, huella: string): void {
  try {
    const ruta = rutaUltimoVerde(raiz);
    if (ruta === null) return;
    mkdirSync(path.dirname(ruta), { recursive: true });
    writeFileSync(ruta, `${JSON.stringify({ version: VERSION, tipo, huella, fecha: new Date().toISOString() })}\n`, 'utf8');
  } catch {
    /* sin memo: el siguiente turno verifica */
  }
}
