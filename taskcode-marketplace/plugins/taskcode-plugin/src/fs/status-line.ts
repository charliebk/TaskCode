/**
 * La status line de Claude Code que muestra `taskctl estado` (TASK-110). Un
 * plugin no puede declararla: solo se configura con la clave `statusLine` de
 * un `settings.json`. Se instala UNA vez, en el de usuario
 * (`<config>/settings.json`), y vale para todos los proyectos: fuera de uno
 * con tareas, `taskctl estado` no imprime nada.
 *
 * Es la primera escritura de taskctl en un fichero de Claude Code, asi que:
 *
 * - Solo con un flag explicito de doctor; sin el, solo se mira.
 * - Se conservan las demas claves (se lee, se cambia `statusLine` y nada mas).
 * - Una `statusLine` ajena no se sustituye sin un flag aparte, y entonces su
 *   valor se guarda para que desinstalar la devuelva.
 * - Copia del fichero antes de tocarlo, y escritura con tmp+rename (Claude
 *   Code puede estar reescribiendo el mismo fichero: la ventana es minima).
 * - Idempotente: si ya esta, no se escribe.
 * - El comando es `taskctl` por el PATH si esta en el PATH del sistema. Si
 *   solo esta en la carpeta del plugin (la cache que Claude Code anade al
 *   PATH de su herramienta Bash, que la status line no tiene por que ver),
 *   decision de la persona (2026-11-12): se usa esa ruta, con `node` y la
 *   ruta absoluta del script. Como lleva la version del plugin, volver a
 *   pedir la instalacion tras actualizar la reescribe con la ruta nueva.
 */
import { spawnSync } from 'node:child_process';
import { accessSync, constants, copyFileSync, existsSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { esObjeto, leerJson } from './json-claude.js';
import { escribirAtomico } from './progreso.js';

/** Lo que ejecuta la status line. `--stdin`: toma el directorio del JSON que le pasa Claude Code. */
export const COMANDO_STATUS_LINE = 'taskctl estado --stdin';
/** Donde se guarda la status line ajena que se sustituyo, para devolverla al desinstalar. */
export const FICHERO_PREVIA = 'statusline-previa-taskctl.json';

export type SondeoStatusLine =
  | { estado: 'ausente'; ruta: string }
  | { estado: 'nuestra'; ruta: string; comando: string }
  | { estado: 'ajena'; ruta: string; comando: string }
  | { estado: 'ilegible'; ruta: string; motivo: string };

export function rutaSettingsUsuario(configDir: string): string {
  return path.join(configDir, 'settings.json');
}

/** El comando con el script de la cache del plugin: `node "<ruta>" estado --stdin` (barras normales). */
export function comandoDesdePlugin(script: string): string {
  return `node "${script.replace(/\\/g, '/')}" estado --stdin`;
}

/**
 * true si la `statusLine` es la que instala doctor: un `taskctl estado` por el
 * PATH, o `node "<...>/taskctl" estado` con la ruta de la cache, con o sin flags.
 */
export function esNuestra(statusLine: unknown): boolean {
  return (
    esObjeto(statusLine) &&
    statusLine['type'] === 'command' &&
    typeof statusLine['command'] === 'string' &&
    /^\s*(?:taskctl(?:\.cmd)?|node\s+"[^"]*[\\/]taskctl")\s+estado(?:\s|$)/.test(statusLine['command'])
  );
}

/** true si `node <script> estado --stdin` sale con 0 (un taskctl anterior a `estado` sale con 1). */
export function entiendeEstado(script: string): boolean {
  const r = spawnSync(process.execPath, [script, 'estado', '--stdin'], {
    input: '{}',
    encoding: 'utf8',
    timeout: 10_000,
    windowsHide: true,
  });
  return r.status === 0;
}

function comandoActual(statusLine: unknown): string | null {
  return esObjeto(statusLine) && typeof statusLine['command'] === 'string' ? statusLine['command'] : null;
}

function describir(statusLine: unknown): string {
  if (esObjeto(statusLine) && typeof statusLine['command'] === 'string') return statusLine['command'];
  return JSON.stringify(statusLine) ?? String(statusLine);
}

export function sondearStatusLine(configDir: string): SondeoStatusLine {
  const ruta = rutaSettingsUsuario(configDir);
  const l = leerJson(ruta);
  if (l.estado === 'ausente') return { estado: 'ausente', ruta };
  if (l.estado === 'ilegible') return { estado: 'ilegible', ruta, motivo: l.motivo };
  if (!esObjeto(l.json)) return { estado: 'ilegible', ruta, motivo: 'no es un objeto JSON' };
  const sl = l.json['statusLine'];
  if (sl === undefined || sl === null) return { estado: 'ausente', ruta };
  if (esNuestra(sl)) return { estado: 'nuestra', ruta, comando: comandoActual(sl) ?? COMANDO_STATUS_LINE };
  return { estado: 'ajena', ruta, comando: describir(sl) };
}

/** Una variable del entorno sin distinguir mayusculas (en Windows es `Path`, `PATH`...). */
function variable(env: NodeJS.ProcessEnv, nombre: string): string | undefined {
  const clave = Object.keys(env).find((k) => k.toUpperCase() === nombre);
  return clave === undefined ? undefined : env[clave];
}

function dentroDe(ruta: string, dir: string): boolean {
  const rel = path.relative(path.resolve(dir), path.resolve(ruta));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

export interface BusquedaTaskctl {
  /** El primero que la status line encontraria, fuera de la cache del plugin. */
  ruta: string | null;
  /** true si solo aparece en la carpeta del plugin dentro de `<config>/plugins/`. */
  soloEnPlugin: boolean;
  /** El script `taskctl` (sin extension, se lanza con node) de la primera carpeta del plugin que lo tiene, o null. */
  scriptPlugin: string | null;
}

/** Busca `taskctl` en el PATH de `env`, sin lanzar nada. */
export function buscarTaskctl(env: NodeJS.ProcessEnv, configDir: string): BusquedaTaskctl {
  const win = process.platform === 'win32';
  const exts = win ? ['', ...(variable(env, 'PATHEXT') ?? '.COM;.EXE;.BAT;.CMD').split(';').filter((e) => e !== '')] : [''];
  const plugins = path.join(configDir, 'plugins');
  let soloEnPlugin = false;
  let scriptPlugin: string | null = null;
  for (const dir of (variable(env, 'PATH') ?? '').split(path.delimiter)) {
    if (dir.trim() === '') continue;
    for (const ext of exts) {
      const candidato = path.join(dir, `taskctl${ext.toLowerCase()}`);
      try {
        if (!statSync(candidato).isFile()) continue;
        if (!win) accessSync(candidato, constants.X_OK);
      } catch {
        continue;
      }
      if (dentroDe(candidato, plugins)) {
        soloEnPlugin = true;
        if (scriptPlugin === null) {
          const script = path.join(dir, 'taskctl');
          try {
            if (statSync(script).isFile()) scriptPlugin = script;
          } catch {
            /* esa carpeta no trae el script de node: se sigue buscando */
          }
        }
        continue;
      }
      return { ruta: candidato, soloEnPlugin: false, scriptPlugin: null };
    }
  }
  return { ruta: null, soloEnPlugin, scriptPlugin };
}

export type ResultadoAccion =
  | { tipo: 'hecho'; mensaje: string }
  | { tipo: 'nada'; mensaje: string }
  | { tipo: 'rechazado'; mensaje: string; arreglo: string };

function sello(ahora: Date): string {
  return ahora.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

/** Copia del settings.json antes de cambiarlo; devuelve su ruta (o null si no habia fichero). */
function copiaDeSeguridad(ruta: string, ahora: Date): string | null {
  if (!existsSync(ruta)) return null;
  const copia = `${ruta}.${sello(ahora)}.bak`;
  copyFileSync(ruta, copia);
  return copia;
}

function leerObjeto(ruta: string): Record<string, unknown> {
  if (!existsSync(ruta)) return {};
  const json = JSON.parse(readFileSync(ruta, 'utf8').replace(/^\uFEFF/, '')) as unknown;
  if (!esObjeto(json)) throw new Error('no es un objeto JSON');
  return json;
}

function escribir(ruta: string, obj: Record<string, unknown>): boolean {
  return escribirAtomico(ruta, `${JSON.stringify(obj, null, 2)}\n`);
}

export interface OpcionesInstalar {
  reemplazar: boolean;
  env: NodeJS.ProcessEnv;
  ahora: Date;
}

const ARREGLO_PATH =
  'Pon taskctl en el PATH de tu sistema (no la carpeta de la version del plugin, que cambia con cada ' +
  'actualizacion: un envoltorio que elija la version instalada mas alta, como el de "Usar taskctl fuera ' +
  'de Claude Code" en el README del plugin), abre una terminal nueva y repite con --instalar-status-line.';

export function instalarStatusLine(configDir: string, o: OpcionesInstalar): ResultadoAccion {
  const s = sondearStatusLine(configDir);
  if (s.estado === 'ilegible') {
    return {
      tipo: 'rechazado',
      mensaje: `no se instala: ${s.ruta} no se puede leer (${s.motivo})`,
      arreglo: `Corrige ${s.ruta} (JSON valido) y repite; no se ha tocado.`,
    };
  }
  if (s.estado === 'ajena' && !o.reemplazar) {
    return {
      tipo: 'rechazado',
      mensaje: `no se instala: ${s.ruta} ya tiene otra status line ("${s.comando}") y no se sustituye sin pedirlo`,
      arreglo:
        'Para sustituirla (se guarda copia y desinstalar la devuelve): taskctl doctor --instalar-status-line ' +
        '--reemplazar-status-line',
    };
  }
  const t = buscarTaskctl(o.env, configDir);
  const comando = t.ruta !== null ? COMANDO_STATUS_LINE : t.scriptPlugin !== null ? comandoDesdePlugin(t.scriptPlugin) : null;
  if (comando === null) {
    return {
      tipo: 'rechazado',
      mensaje: t.soloEnPlugin
        ? 'no se instala: taskctl solo esta en la carpeta del plugin y alli no esta su script de node'
        : 'no se instala: taskctl no esta en el PATH, y la status line lo ejecuta por su nombre',
      arreglo: ARREGLO_PATH,
    };
  }
  // La copia de la cache es la del plugin INSTALADO, que puede ser anterior a `estado`
  // (pasa al instalar desde una copia de desarrollo): se prueba antes de escribir nada.
  if (t.ruta === null && t.scriptPlugin !== null && !entiendeEstado(t.scriptPlugin)) {
    return {
      tipo: 'rechazado',
      mensaje:
        `no se instala: el taskctl del plugin instalado (${t.scriptPlugin}) no entiende "estado --stdin"; ` +
        'la barra mostraria un error en cada refresco',
      arreglo: 'Actualiza el plugin a una version con "taskctl estado" y repite --instalar-status-line.',
    };
  }
  if (s.estado === 'nuestra' && s.comando === comando) {
    return { tipo: 'nada', mensaje: `ya estaba instalada en ${s.ruta} (${comando})` };
  }
  const desdeCache =
    t.ruta === null
      ? '; usa la copia de la cache del plugin, que lleva su version: tras actualizar el plugin, repite ' +
        '--instalar-status-line para que apunte a la nueva'
      : '';
  try {
    const obj = leerObjeto(s.ruta);
    const copia = copiaDeSeguridad(s.ruta, o.ahora);
    if (s.estado === 'ajena') {
      if (!escribirAtomico(path.join(configDir, FICHERO_PREVIA), `${JSON.stringify({ statusLine: obj['statusLine'] }, null, 2)}\n`)) {
        throw new Error('no se pudo guardar la status line anterior');
      }
    }
    obj['statusLine'] = { type: 'command', command: comando };
    if (!escribir(s.ruta, obj)) throw new Error(`no se pudo escribir ${s.ruta}`);
    return {
      tipo: 'hecho',
      mensaje:
        (s.estado === 'nuestra' ? `actualizada en ${s.ruta} (${comando}; antes "${s.comando}"` : `instalada en ${s.ruta} (${comando}`) +
        `; taskctl en ${t.ruta ?? t.scriptPlugin ?? ''})` +
        desdeCache +
        (copia === null ? '' : `; copia previa en ${copia}`) +
        (s.estado === 'ajena' ? `; la anterior ("${s.comando}") vuelve al desinstalar` : '') +
        '. Se ve en la proxima sesion de Claude Code',
    };
  } catch (e: unknown) {
    return {
      tipo: 'rechazado',
      mensaje: `no se pudo instalar: ${e instanceof Error ? e.message : String(e)}`,
      arreglo: `Revisa que ${s.ruta} se pueda leer y escribir, y repite.`,
    };
  }
}

export function desinstalarStatusLine(configDir: string, ahora: Date): ResultadoAccion {
  const s = sondearStatusLine(configDir);
  if (s.estado === 'ausente') return { tipo: 'nada', mensaje: `no habia ninguna status line en ${s.ruta}` };
  if (s.estado === 'ajena') {
    return { tipo: 'nada', mensaje: `la status line de ${s.ruta} no es la de taskctl ("${s.comando}"): no se toca` };
  }
  if (s.estado === 'ilegible') {
    return {
      tipo: 'rechazado',
      mensaje: `no se desinstala: ${s.ruta} no se puede leer (${s.motivo})`,
      arreglo: `Corrige ${s.ruta} (JSON valido) y repite; no se ha tocado.`,
    };
  }
  try {
    const obj = leerObjeto(s.ruta);
    const rutaPrevia = path.join(configDir, FICHERO_PREVIA);
    const previa = leerJson(rutaPrevia);
    const devuelta = previa.estado === 'ok' && esObjeto(previa.json) ? previa.json['statusLine'] : undefined;
    const copia = copiaDeSeguridad(s.ruta, ahora);
    if (devuelta === undefined || devuelta === null) delete obj['statusLine'];
    else obj['statusLine'] = devuelta;
    if (!escribir(s.ruta, obj)) throw new Error(`no se pudo escribir ${s.ruta}`);
    if (previa.estado !== 'ausente') {
      try {
        unlinkSync(rutaPrevia);
      } catch {
        /* se queda: la proxima instalacion la sobrescribe */
      }
    }
    return {
      tipo: 'hecho',
      mensaje:
        `desinstalada de ${s.ruta}` +
        (devuelta === undefined || devuelta === null ? '' : `; vuelve la anterior ("${describir(devuelta)}")`) +
        (copia === null ? '' : `; copia previa en ${copia}`),
    };
  } catch (e: unknown) {
    return {
      tipo: 'rechazado',
      mensaje: `no se pudo desinstalar: ${e instanceof Error ? e.message : String(e)}`,
      arreglo: `Revisa que ${s.ruta} se pueda leer y escribir, y repite.`,
    };
  }
}
