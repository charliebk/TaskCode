/**
 * Ejecutar un comando de la persona con un tope de tiempo, matando el arbol
 * entero al cortarlo, y huella del arbol de trabajo. Extraido de
 * fs/sincronizacion.ts (TASK-033) en TASK-071 para que la sincronizacion y la
 * verificacion (el hook Stop y, en TASK-072, `finish`) usen la MISMA pieza:
 * dos envoltorios acabarian matando procesos de dos formas distintas.
 *
 * Las razones de cada decision (envoltorio node que aplica el timeout, salida a
 * ficheros y no a tuberias, stdin ignorado) estan medidas, no supuestas: ver los
 * comentarios de abajo y la historia de TASK-033.
 */
import { createHash } from 'node:crypto';
import { closeSync, fstatSync, mkdtempSync, openSync, readFileSync, readSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/** Codigo con el que ENVOLTORIO dice "lo he cortado por timeout". */
export const CODIGO_TIMEOUT_ENVOLTORIO = 124;
/**
 * Marca que ENVOLTORIO escribe en stderr al cortar. Sin ella, un script
 * que saliera con 124 por su cuenta se describiria como un timeout
 * (hallazgo MENOR de la revision de TASK-033).
 */
export const MARCA_TIMEOUT = '[taskctl:timeout]';

/**
 * Ejecuta argv[1] con el shell del sistema y lo corta a los argv[2] ms.
 *
 * - shell: true en las dos plataformas: cmd.exe en Windows (necesario
 *   para resolver `pnpm.cmd` / `npm.cmd`; sin shell, ENOENT — el fallo
 *   que costo una ronda en codex-review) y /bin/sh en POSIX. El comando
 *   es entero de la persona y no se le interpola nada, asi que no se
 *   escapa: escaparlo cambiaria lo que escribio.
 * - Al vencer el timeout mata el ARBOL: `taskkill /T /F` en Windows
 *   (con el hijo aun vivo, que es cuando /T puede recorrerlo) y el
 *   grupo de procesos en POSIX (por eso `detached`).
 * - Al cortar sale EN EL ACTO, sin esperar al `close` del hijo. El hijo
 *   tiene tuberias propias (la salida se reenvia), asi que un nieto que
 *   sobreviviera al kill retendria las del envoltorio, no las de
 *   taskctl: `spawnSync` vuelve igual. Con `stdio: 'inherit'` y un kill
 *   que fallara, taskctl se quedaba colgado para siempre (medido con un
 *   mutante en la revision).
 * - Sale con el codigo del comando, o con 124 (como `timeout(1)`) si lo
 *   corto.
 */
const ENVOLTORIO = `
const { spawn, spawnSync } = require('node:child_process');
const [comando, ms] = process.argv.slice(1);
const win = process.platform === 'win32';
const hijo = spawn(comando, { shell: true, stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true, detached: !win });
hijo.stdout.on('data', (d) => process.stdout.write(d));
hijo.stderr.on('data', (d) => process.stderr.write(d));
const t = setTimeout(() => {
  hijo.stdout.removeAllListeners('data');
  hijo.stderr.removeAllListeners('data');
  if (win) spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-hijo.pid, 'SIGKILL'); } catch {} }
  process.stderr.write('${MARCA_TIMEOUT}', () => process.exit(${String(CODIGO_TIMEOUT_ENVOLTORIO)}));
}, Number(ms));
hijo.on('error', (e) => { clearTimeout(t); process.stderr.write(String(e.message)); process.exit(127); });
hijo.on('close', (code, signal) => {
  clearTimeout(t);
  if (code === null) { process.stderr.write('termino por la senal ' + signal); process.exit(1); }
  process.exit(code);
});
`;

export interface OpcionesEjecucion {
  /**
   * true: stdout y stderr van al MISMO fichero, intercalados como los veria
   * la persona en su terminal. `salida` es entonces esa salida unida; si no,
   * es solo el stderr (lo que necesita la sincronizacion).
   */
  unirSalida?: boolean;
  /** Bytes que se leen del final de la salida (por defecto 64 KiB). Nunca se lee entera. */
  bytesCola?: number;
  /** Entorno del comando (por defecto el del proceso). TASK-073: HELDOUT_DIR. */
  env?: NodeJS.ProcessEnv;
}

export interface SalidaEjecucion {
  error?: Error;
  status: number | null;
  signal: NodeJS.Signals | null;
  /** Los ultimos `bytesCola` bytes de la salida, en UTF-8. */
  salida: string;
  /** Tamano total de la salida, aunque solo se haya leido la cola. */
  bytesTotales: number;
  duracionMs: number;
}

/**
 * Lanza ENVOLTORIO con la salida a FICHEROS temporales, no a tuberias.
 * Con tuberias, en Windows cmd.exe hereda tambien las del propio
 * envoltorio, asi que un nieto que sobreviva al kill retiene la de
 * taskctl y `spawnSync` espera su EOF para siempre — medido con un
 * mutante del `taskkill` en la revision de TASK-033: el test se colgo
 * 30 min y el timeout por test no lo corta porque `spawnSync` bloquea el
 * event loop. Con ficheros, `spawnSync` vuelve en cuanto el envoltorio
 * sale, quede vivo lo que quede.
 *
 * stdin ignorado SIEMPRE: con una tuberia heredada que nadie cierra (un
 * arnes de agente, `node --test`) un script que pregunte algo esperaria
 * para siempre. Con EOF, falla.
 */
export function ejecutarAcotado(
  raiz: string,
  comando: string,
  timeoutMs: number,
  opciones: OpcionesEjecucion = {}
): SalidaEjecucion {
  const unir = opciones.unirSalida === true;
  const bytesCola = opciones.bytesCola ?? 64 * 1024;
  const dir = mkdtempSync(path.join(tmpdir(), 'taskctl-ejecucion-'));
  const rutaOut = path.join(dir, 'stdout');
  const rutaErr = path.join(dir, 'stderr');
  const fdOut = openSync(rutaOut, 'w');
  const fdErr = unir ? fdOut : openSync(rutaErr, 'w');
  // Una sola vez cada uno: cerrar dos veces el mismo numero de fd puede
  // cerrar otro fichero que el sistema le haya reasignado entretanto.
  let cerrados = false;
  const cerrar = (): void => {
    if (cerrados) return;
    cerrados = true;
    closeSync(fdOut);
    if (!unir) closeSync(fdErr);
  };
  const inicio = Date.now();
  try {
    const r = spawnSync(process.execPath, ['-e', ENVOLTORIO, comando, String(timeoutMs)], {
      cwd: raiz,
      stdio: ['ignore', fdOut, fdErr],
      // Red de seguridad por si el propio envoltorio se colgara.
      timeout: timeoutMs + 15000,
      windowsHide: true,
      ...(opciones.env === undefined ? {} : { env: opciones.env }),
    });
    const duracionMs = Date.now() - inicio;
    cerrar();
    const { texto, total } = leerCola(unir ? rutaOut : rutaErr, bytesCola);
    const salida: SalidaEjecucion = { status: r.status, signal: r.signal, salida: texto, bytesTotales: total, duracionMs };
    if (r.error !== undefined) salida.error = r.error;
    return salida;
  } finally {
    // Un huerfano puede tener aun el fichero abierto (EBUSY en
    // Windows): se deja para el limpiador del sistema, no es un fallo.
    try {
      cerrar();
    } catch {
      /* no se pudo cerrar: no afecta */
    }
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ver arriba */
    }
  }
}

/**
 * Los ultimos `bytes` bytes de un fichero, sin leerlo entero: un `npm test`
 * puede soltar megas y el coste no debe depender de eso. Si el corte cae en
 * medio de un caracter UTF-8, se descartan los bytes de continuacion sueltos
 * del principio.
 */
export function leerCola(ruta: string, bytes: number): { texto: string; total: number } {
  const fd = openSync(ruta, 'r');
  try {
    const total = fstatSync(fd).size;
    const n = Math.min(total, bytes);
    const buf = Buffer.alloc(n);
    let leidos = 0;
    while (leidos < n) {
      const k = readSync(fd, buf, leidos, n - leidos, total - n + leidos);
      if (k === 0) break;
      leidos += k;
    }
    let desde = 0;
    if (total > n) {
      while (desde < leidos && desde < 4 && ((buf[desde] as number) & 0xc0) === 0x80) desde++;
    }
    return { texto: buf.subarray(desde, leidos).toString('utf8'), total };
  } finally {
    closeSync(fd);
  }
}

/** true si la salida dice que ENVOLTORIO corto el comando por timeout. */
export function fueCortado(r: SalidaEjecucion): boolean {
  if (r.error !== undefined && (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') return true;
  return r.status === CODIGO_TIMEOUT_ENVOLTORIO && r.salida.endsWith(MARCA_TIMEOUT);
}

/**
 * Foto de lo que NO esta limpio en el arbol: ruta -> huella del
 * contenido. Comparar solo el porcelain no basta (hallazgo del rol de
 * riesgos de TASK-033): un fichero que ya estaba en ` M` por trabajo de la
 * persona sigue en ` M` aunque el comando lo reescriba. Por eso se compara
 * el contenido, y solo de lo que ya esta sucio (lo limpio, si cambia,
 * aparece nuevo en la segunda foto).
 */
export function fotoDelArbol(raiz: string): Map<string, string> {
  // Sin runGit a proposito: recorta la salida, y el recorte se come el
  // espacio inicial de la primera entrada (" M ruta"), desplazando la
  // ruta un caracter.
  const r = spawnSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
    cwd: raiz,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(`git status fallo: ${String(r.stderr ?? '').trim()}`);
  }
  const salida = r.stdout ?? '';
  const foto = new Map<string, string>();
  const entradas = salida.split('\0');
  for (let i = 0; i < entradas.length; i++) {
    const e = entradas[i] as string;
    if (e.length < 4) continue;
    const xy = e.slice(0, 2);
    const ruta = e.slice(3);
    // En un renombrado, -z pone la ruta de origen en la entrada
    // siguiente: se salta para no tomarla por un fichero aparte.
    if (xy.includes('R') || xy.includes('C')) i++;
    foto.set(ruta, huellaFichero(path.join(raiz, ruta)));
  }
  return foto;
}

function huellaFichero(fichero: string): string {
  try {
    if (!statSync(fichero).isFile()) return 'no-fichero';
    return createHash('sha1').update(readFileSync(fichero)).digest('hex');
  } catch {
    return 'ausente';
  }
}
