/**
 * Sincronizacion de ficheros derivados — TASK-033 (version 0.1.1).
 *
 * Un proyecto que genera ficheros a partir del estado de las tareas (un
 * plan con una tabla de seguimiento, un tablero propio) los tenia
 * desincronizados tras CADA transicion: los commits automaticos mueven
 * la tarea, pero no pueden saber que ese fichero existe. El arreglo
 * obvio desde el proyecto —un hook de pre-commit que regenere y haga
 * `git add`— no funciona con taskctl: autoCommit commitea en modo
 * `--only` (`git commit -- <rutas>`), el `git add` del hook va al indice
 * temporal y el indice real se queda con el contenido viejo. Despues del
 * commit, `git status` marca `MM` y el SIGUIENTE comando aborta en el
 * guard de la 8.3. Reproducido, no supuesto.
 *
 * Asi que el comando lo ejecuta taskctl, dentro de autoCommit y antes
 * del primer `git add`, y sus rutas entran en el mismo commit que la
 * tarea. Lo configuran tres claves de `.taskcode/config.yml`
 * (config.ts); sin ellas, aqui no se hace nada, ni un spawn.
 *
 * La regla que manda, decidida al aprobar el plan: **la transicion
 * NUNCA se aborta por la sincronizacion**. En `finish` el merge ya esta
 * hecho cuando se llega aqui; abortar dejaria la tarea movida sin
 * commitear y sin camino de reintento (riesgo 1 del brainstorm). Los
 * tres desenlaces en que la sincronizacion no se aplica commitean la
 * tarea igual, avisan y hacen que el CLI salga con
 * CODIGO_SINCRONIZACION_NO_APLICADA:
 *
 *   (a) una ruta declarada ya tenia cambios: no se ejecuta, porque
 *       commitearla meteria trabajo de la persona en un commit
 *       automatico;
 *   (b) el comando falla o expira: las rutas declaradas vuelven a HEAD
 *       (estaban limpias por (a), asi que no se pierde nada);
 *   (c) el comando toco ficheros no declarados: esos no se tocan y se
 *       nombran; las rutas declaradas si se commitean.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { raizDelRepo, type TaskcodeConfig } from '../core/config.js';
import { runGit } from './git.js';

/**
 * Codigo de salida del CLI cuando la transicion se hizo pero la
 * sincronizacion no se aplico. Distinto de 1 (el comando fallo) a
 * proposito: quien lo lea tiene que poder distinguir "no reintentes,
 * sincroniza a mano" de "no ha pasado nada".
 */
export const CODIGO_SINCRONIZACION_NO_APLICADA = 3;

export type EstadoSincronizacion =
  /** Sin `comando_sincronizacion`: comportamiento anterior a 0.1.1. */
  | 'no-configurada'
  /** El comando corrio bien y solo toco rutas declaradas. */
  | 'aplicada'
  /** (a) Alguna ruta declarada ya tenia cambios: no se ejecuto. */
  | 'omitida-rutas-con-cambios'
  /** (b) Exit != 0, senal, timeout o no se pudo lanzar. */
  | 'fallida'
  /** (c) Corrio bien, pero ademas toco ficheros no declarados. */
  | 'rutas-ajenas';

export interface ResultadoSincronizacion {
  estado: EstadoSincronizacion;
  /** Rutas (absolutas) que deben entrar en el commit automatico. */
  rutas: readonly string[];
  /** Avisos para stderr. Vacio en 'no-configurada' y 'aplicada'. */
  avisos: readonly string[];
}

/** true si el desenlace debe hacer que el CLI salga con CODIGO_SINCRONIZACION_NO_APLICADA. */
export function sincronizacionNoAplicada(r: ResultadoSincronizacion): boolean {
  return r.estado !== 'no-configurada' && r.estado !== 'aplicada';
}

export interface OpcionesSincronizacion {
  /** Solo para tests: sustituye a `timeout_sincronizacion` (en ms). */
  timeoutMs?: number;
}

export const SIN_SINCRONIZACION: ResultadoSincronizacion = Object.freeze({
  estado: 'no-configurada',
  rutas: Object.freeze([]) as readonly string[],
  avisos: Object.freeze([]) as readonly string[],
});

export function ejecutarSincronizacion(
  cwd: string,
  config: TaskcodeConfig,
  opciones: OpcionesSincronizacion = {}
): ResultadoSincronizacion {
  const comando = config.comando_sincronizacion;
  if (comando === null) return SIN_SINCRONIZACION;

  const raiz = raizDelRepo(cwd);
  const declaradas = config.rutas_sincronizacion;
  const absolutas = declaradas.map((r) => path.join(raiz, r));
  const aMano =
    `Cuando lo resuelvas, ejecuta a mano "${comando}" y commitea ${declaradas.join(', ')}. ` +
    'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.';

  // (a) Antes de nada: si una ruta declarada ya trae cambios, el
  // commit automatico se los llevaria. `start`, `review` y `finish` no
  // exigen workspace limpio, asi que esto es un caso real.
  const conCambios = porcelain(raiz, declaradas);
  if (conCambios.length > 0) {
    return {
      estado: 'omitida-rutas-con-cambios',
      rutas: [],
      avisos: [
        `No se ha ejecutado la sincronizacion: ${conCambios.join(', ')} ya tenia(n) cambios ` +
          'sin commitear, y el commit automatico los habria incluido. Commitealos o ' +
          `descartalos. ${aMano}`,
      ],
    };
  }

  const antes = fotoDelArbol(raiz);
  const timeoutMs = opciones.timeoutMs ?? config.timeout_sincronizacion * 1000;

  // El comando no se lanza directamente: lo lanza ENVOLTORIO, un node
  // hijo que es quien aplica el timeout. Con un `spawnSync(comando, {
  // shell: true, timeout })` a pelo, el timeout mata a cmd.exe pero en
  // Windows el `node` nieto SIGUE VIVO y puede seguir escribiendo el
  // derivado despues de que lo hayamos restaurado (riesgo 6 del
  // brainstorm; reproducido: el test del timeout dejaba la carpeta del
  // repo bloqueada con EBUSY). El envoltorio mata el arbol entero.
  //
  // stdin ignorado SIEMPRE: con una tuberia heredada que nadie cierra
  // (un arnes de agente, `node --test`) un script que pregunte algo
  // esperaria para siempre. Con EOF, falla y se va por (b).
  const r = spawnSync(process.execPath, ['-e', ENVOLTORIO, comando, String(timeoutMs)], {
    cwd: raiz,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    // Red de seguridad por si el propio envoltorio se colgara.
    timeout: timeoutMs + 15000,
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });

  const fallo = describirFallo(r, timeoutMs);
  if (fallo !== null) {
    restaurarAHead(raiz, declaradas);
    return {
      estado: 'fallida',
      rutas: [],
      avisos: [
        `La sincronizacion "${comando}" ${fallo}. ${declaradas.join(', ')} se ha(n) dejado ` +
          `como en HEAD y la tarea se ha commiteado sin ella(s). ${aMano}`,
      ],
    };
  }

  const despues = fotoDelArbol(raiz);
  const declaradasSet = new Set(declaradas);
  const ajenas = [...new Set([...antes.keys(), ...despues.keys()])]
    .filter((f) => !declaradasSet.has(f) && antes.get(f) !== despues.get(f))
    .sort();

  if (ajenas.length > 0) {
    return {
      estado: 'rutas-ajenas',
      rutas: absolutas,
      avisos: [
        `La sincronizacion "${comando}" ha modificado ficheros que no estan en ` +
          `rutas_sincronizacion: ${ajenas.join(', ')}. No se han commiteado ni tocado: ` +
          'revisalos. Si los genera el comando a proposito, anadelos a rutas_sincronizacion; ' +
          'si no, el siguiente comando de taskctl puede abortar por workspace sucio.',
      ],
    };
  }

  return { estado: 'aplicada', rutas: absolutas, avisos: [] };
}

/** Codigo con el que ENVOLTORIO dice "lo he cortado por timeout". */
const CODIGO_TIMEOUT_ENVOLTORIO = 124;

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
 * - Sale con el codigo del comando, o con 124 (como `timeout(1)`) si lo
 *   corto.
 */
const ENVOLTORIO = `
const { spawn, spawnSync } = require('node:child_process');
const [comando, ms] = process.argv.slice(1);
const win = process.platform === 'win32';
const hijo = spawn(comando, { shell: true, stdio: ['ignore', 'inherit', 'inherit'],
  windowsHide: true, detached: !win });
let cortado = false;
const t = setTimeout(() => {
  cortado = true;
  if (win) spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-hijo.pid, 'SIGKILL'); } catch {} }
}, Number(ms));
hijo.on('error', (e) => { clearTimeout(t); process.stderr.write(String(e.message)); process.exit(127); });
hijo.on('close', (code, signal) => {
  clearTimeout(t);
  if (cortado) process.exit(${String(CODIGO_TIMEOUT_ENVOLTORIO)});
  process.exit(code === null ? 128 : code);
});
`;

/** null si el comando termino bien; si no, que le paso, en palabras de persona. */
function describirFallo(r: ReturnType<typeof spawnSync>, timeoutMs: number): string | null {
  const corte = `no termino en ${String(Math.round(timeoutMs / 1000))} s y se ha cortado`;
  if (r.error !== undefined) {
    if ((r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') return corte;
    return `no se pudo ejecutar (${r.error.message})`;
  }
  if (r.status === CODIGO_TIMEOUT_ENVOLTORIO) return corte;
  if (r.signal !== null) return `termino por la senal ${r.signal}`;
  if (r.status !== 0) {
    const stderr = String(r.stderr ?? '').trim();
    const cola = stderr === '' ? '' : `: ${ultimasLineas(stderr, 5)}`;
    return `salio con codigo ${String(r.status)}${cola}`;
  }
  return null;
}

function ultimasLineas(texto: string, n: number): string {
  return texto.split(/\r?\n/).slice(-n).join(' | ');
}

/** Rutas (de las dadas) con cambios respecto a HEAD, incluidas las no trackeadas. */
function porcelain(raiz: string, rutas: readonly string[]): string[] {
  const salida = runGit(['status', '--porcelain', '--untracked-files=all', '--', ...rutas], raiz);
  return salida
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '')
    .map((l) => l.slice(l.indexOf(' ') + 1).trim());
}

/**
 * Foto de lo que NO esta limpio en el arbol: ruta -> huella del
 * contenido. Comparar solo el porcelain no basta (hallazgo del rol de
 * riesgos): un fichero que ya estaba en ` M` por trabajo de la persona
 * sigue en ` M` aunque el comando lo reescriba. Por eso se compara el
 * contenido, y solo de lo que ya esta sucio (lo limpio, si cambia,
 * aparece nuevo en la segunda foto).
 */
function fotoDelArbol(raiz: string): Map<string, string> {
  // Sin runGit a proposito: recorta la salida, y el recorte se come el
  // espacio inicial de la primera entrada (" M ruta"), desplazando la
  // ruta un caracter.
  const r = spawnSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
    cwd: raiz,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(`git status fallo al sincronizar: ${String(r.stderr ?? '').trim()}`);
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
    foto.set(ruta, huella(path.join(raiz, ruta)));
  }
  return foto;
}

function huella(fichero: string): string {
  try {
    if (!statSync(fichero).isFile()) return 'no-fichero';
    return createHash('sha1').update(readFileSync(fichero)).digest('hex');
  } catch {
    return 'ausente';
  }
}

/**
 * (b) Deja cada ruta declarada como en HEAD. Estaban limpias antes de
 * ejecutar (lo garantiza (a)), asi que lo unico que se deshace es lo
 * que escribio el comando: si existia en HEAD se restaura, y si no
 * existia el fichero lo creo el comando y se borra.
 */
function restaurarAHead(raiz: string, rutas: readonly string[]): void {
  for (const r of rutas) {
    const enHead = runGitOk(['cat-file', '-e', `HEAD:${r}`], raiz);
    if (enHead) {
      runGit(['checkout', 'HEAD', '--', r], raiz);
    } else {
      const abs = path.join(raiz, r);
      if (existsSync(abs)) rmSync(abs, { force: true });
    }
  }
}

function runGitOk(args: readonly string[], cwd: string): boolean {
  return spawnSync('git', args, { cwd, encoding: 'utf8' }).status === 0;
}
