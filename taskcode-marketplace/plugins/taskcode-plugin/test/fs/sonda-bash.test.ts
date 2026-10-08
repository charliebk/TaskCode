/**
 * La sonda de bash de `taskctl doctor` (TASK-062, MEN-5 de la revision): que
 * detecta de verdad un entorno al que le falta una herramienta que usan los
 * scripts de Git-Flow (aqui, `mktemp`), y no solo que "corre en esta maquina".
 *
 * Se monta un PATH propio con bash y todo lo demas que la sonda usa, y se le
 * quita `mktemp`:
 * - POSIX: enlaces simbolicos a cada herramienta.
 * - Windows: bash de Git necesita sus DLL, asi que se enlazan (hardlinks) TODOS
 *   los ficheros de la carpeta del bash de Git, salvo `mktemp.exe`. Si no hay un
 *   bash de Git con su carpeta de herramientas, el test se salta.
 * Un control positivo (el mismo PATH CON `mktemp`) debe dar OK: sin el, el test
 * podria pasar porque el PATH montado no sirve para nada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, linkSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sondearBash } from '../../src/fs/gitflow-runner.js';

const SCRIPTS_DIR = path.join(import.meta.dirname, '..', '..', '..', 'scripts', 'gitflow');
const WIN = process.platform === 'win32';

/** Primera ruta de `nombre` en el PATH actual (con .exe en Windows), o null. */
function buscar(nombre: string, dirs: string[] = (process.env['PATH'] ?? '').split(path.delimiter)): string | null {
  for (const d of dirs) {
    if (d === '') continue;
    const f = path.join(d, WIN ? `${nombre}.exe` : nombre);
    if (existsSync(f)) return f;
  }
  return null;
}

interface Entorno {
  /** Valor del PATH a usar. */
  path: string;
  limpiar(): void;
}

/** PATH con bash y lo que usa la sonda, con o sin mktemp. null si esta maquina no permite montarlo. */
function montarEntorno(conMktemp: boolean): Entorno | null {
  const dir = mkdtempSync(path.join(tmpdir(), 'taskctl-sonda-path-'));
  const limpiar = () => rmSync(dir, { recursive: true, force: true });
  try {
    if (WIN) {
      // La carpeta de bash de Git es la que tiene bash.exe Y mktemp.exe juntos.
      const dirs = (process.env['PATH'] ?? '').split(path.delimiter);
      const bashDir = dirs.find((d) => d !== '' && existsSync(path.join(d, 'bash.exe')) && existsSync(path.join(d, 'mktemp.exe')));
      const git = buscar('git');
      if (bashDir === undefined || git === null) {
        limpiar();
        return null;
      }
      // bash de Git deduce su raiz de donde esta el ejecutable (<raiz>/usr/bin) y necesita <raiz>/tmp.
      const usrBin = path.join(dir, 'usr', 'bin');
      mkdirSync(usrBin, { recursive: true });
      mkdirSync(path.join(dir, 'tmp'));
      for (const f of readdirSync(bashDir, { withFileTypes: true }).filter((x) => x.isFile()).map((x) => x.name)) {
        if (!conMktemp && f.toLowerCase() === 'mktemp.exe') continue;
        const origen = path.join(bashDir, f);
        try {
          linkSync(origen, path.join(usrBin, f));
        } catch {
          copyFileSync(origen, path.join(usrBin, f));
        }
      }
      return { path: `${usrBin}${path.delimiter}${path.dirname(git)}`, limpiar };
    }
    const herramientas = ['bash', 'dirname', 'grep', 'sed', 'tr', 'wc', 'rm', 'git', 'cat', 'env', ...(conMktemp ? ['mktemp'] : [])];
    for (const h of herramientas) {
      const r = buscar(h);
      if (r === null) {
        limpiar();
        return null;
      }
      symlinkSync(r, path.join(dir, h));
    }
    return { path: dir, limpiar };
  } catch (e) {
    limpiar();
    throw e;
  }
}

function sondeCon(entorno: Entorno) {
  const guardado = process.env['PATH'];
  try {
    process.env['PATH'] = entorno.path;
    return sondearBash({ scriptsDir: SCRIPTS_DIR, cwd: tmpdir() });
  } finally {
    process.env['PATH'] = guardado;
  }
}

test('sonda: con todo lo necesario, OK (control positivo del PATH montado)', (t) => {
  const e = montarEntorno(true);
  if (e === null) return t.skip('esta maquina no permite montar un PATH con bash y herramientas separadas');
  try {
    const r = sondeCon(e);
    assert.equal(r.ok, true, JSON.stringify(r));
  } finally {
    e.limpiar();
  }
});

test('sonda: a un entorno sin mktemp lo da por no valido (la sonda prueba mktemp de verdad)', (t) => {
  const e = montarEntorno(false);
  if (e === null) return t.skip('esta maquina no permite montar un PATH con bash y herramientas separadas');
  try {
    const r = sondeCon(e);
    assert.equal(r.ok, false, 'la sonda dio OK sin mktemp: no lo esta probando');
    if (!r.ok) {
      assert.equal(r.causa, 'fallo');
      assert.match(r.detalle, /mktemp|codigo 127/);
    }
  } finally {
    e.limpiar();
  }
});
