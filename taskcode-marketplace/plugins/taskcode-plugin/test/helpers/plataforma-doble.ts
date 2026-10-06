// Doble de `gh` y `glab` para los tests de `taskctl finish --merge-request`
// (TASK-060). Es el UNICO doble admitido de la suite: GitHub y GitLab no estan
// en el CI. Git, los repos y el remoto bare siguen siendo reales.
//
// Es un EJECUTABLE de verdad, resuelto por el PATH como lo resolveria el real,
// que lee y escribe un fichero de estado JSON (el que cada test prepara) y
// apunta en el cada llamada que recibe:
//
//   { auth, listarFalla, crearFalla, prs: [...], llamadas: [[cli, ...args]] }
//
// Como se lanza, por plataforma:
//
// - POSIX: un script `gh` / `glab` con shebang `/bin/sh` que ejecuta el doble
//   con el node actual.
// - Windows nativo: `spawnSync('gh', ...)` sin shell solo ejecuta `.exe`
//   (un `.cmd` da ENOENT), y no se abre `shell: true` para este hueco. Asi que
//   `gh.exe` y `glab.exe` son enlaces duros (o copias) de `node.exe`, y el
//   doble entra por un `--require` en NODE_OPTIONS que, si el ejecutable se
//   llama gh/glab, atiende la llamada y sale antes de que node intente
//   cargar como script el primer argumento. Consecuencias: ninguna llamada
//   del CLI bajo prueba puede empezar por una opcion (`--version`), que node
//   se quedaria; y node resuelve el primer argumento a una ruta absoluta, de
//   la que el doble recupera el nombre. Las llamadas de taskctl empiezan
//   siempre por un subcomando (`auth`, `pr`, `mr`).

import { chmodSync, copyFileSync, linkSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export type EstadoPrDoble = 'abierto' | 'integrado' | 'cerrado';

export interface PrDoble {
  estado: EstadoPrDoble;
  url: string;
  base: string;
  head: string;
  /** Commit resultante del merge (merge, squash o rebase); null = la plataforma no lo informa. */
  commit?: string | null;
  /** Punta de la rama que la plataforma integro (headRefOid / sha). */
  headSha?: string | null;
}

export interface EstadoDoble {
  /** false: `auth status` sale con 1. Por defecto true. */
  auth?: boolean;
  /** true: `pr list` / `mr list` salen con 1 (red caida), con una URL con credenciales en stderr. */
  listarFalla?: boolean;
  /** true: `pr create` / `mr create` salen con 1. */
  crearFalla?: boolean;
  prs: PrDoble[];
  /** Lo apunta el doble: una entrada por llamada, `[cli, ...args]`. */
  llamadas?: string[][];
}

const ENV_ESTADO = 'TASKCODE_DOBLE_ESTADO';

// Codigo del doble (CommonJS, lo carga node tal cual). Sin plantillas con
// comillas invertidas: va como lineas de texto.
const CODIGO_DOBLE = [
  "'use strict';",
  "const fs = require('node:fs');",
  "const path = require('node:path');",
  'function salir(codigo, out, err) {',
  "  if (out) fs.writeSync(1, out);",
  "  if (err) fs.writeSync(2, err);",
  '  process.exit(codigo);',
  '}',
  'function valor(args, nombre) {',
  "  const pref = '--' + nombre + '=';",
  '  const a = args.find((x) => x.startsWith(pref));',
  '  return a === undefined ? null : a.slice(pref.length);',
  '}',
  'function run(cli, args) {',
  '  const f = process.env.' + ENV_ESTADO + ';',
  "  const st = JSON.parse(fs.readFileSync(f, 'utf8'));",
  '  st.llamadas = st.llamadas || [];',
  '  st.llamadas.push([cli].concat(args));',
  '  const guardar = () => fs.writeFileSync(f, JSON.stringify(st));',
  '  guardar();',
  "  if (args[0] === 'auth' && args[1] === 'status') {",
  "    if (st.auth === false) salir(1, '', 'You are not logged in\\n');",
  '    salir(0, \'\', \'Logged in\\n\');',
  '  }',
  "  const listar = (cli === 'gh' && args[0] === 'pr' && args[1] === 'list') || (cli === 'glab' && args[0] === 'mr' && args[1] === 'list');",
  "  const crear = (cli === 'gh' && args[0] === 'pr' && args[1] === 'create') || (cli === 'glab' && args[0] === 'mr' && args[1] === 'create');",
  '  if (listar) {',
  "    if (st.listarFalla) salir(1, '', 'error: Post \"https://usuario:secreto@github.com/graphql\": dial tcp: no network\\n');",
  "    const head = cli === 'gh' ? valor(args, 'head') : valor(args, 'source-branch');",
  '    const lista = st.prs.filter((p) => p.head === head).map((p, i) => {',
  "      if (cli === 'gh') {",
  "        const estado = { abierto: 'OPEN', integrado: 'MERGED', cerrado: 'CLOSED' }[p.estado];",
  "        return { number: i + 1, state: estado, url: p.url, baseRefName: p.base, headRefName: p.head, headRefOid: p.headSha || null, mergeCommit: p.commit ? { oid: p.commit } : null };",
  '      }',
  "      const estado = { abierto: 'opened', integrado: 'merged', cerrado: 'closed' }[p.estado];",
  "      return { iid: i + 1, state: estado, web_url: p.url, target_branch: p.base, source_branch: p.head, merge_commit_sha: p.commit || null, squash_commit_sha: null, sha: p.headSha || null };",
  '    });',
  '    salir(0, JSON.stringify(lista) + "\\n", "");',
  '  }',
  '  if (crear) {',
  "    if (st.crearFalla) salir(1, '', 'GraphQL: could not create the pull request\\n');",
  "    const head = cli === 'gh' ? valor(args, 'head') : valor(args, 'source-branch');",
  "    const base = cli === 'gh' ? valor(args, 'base') : valor(args, 'target-branch');",
  '    const n = st.prs.length + 1;',
  "    const url = cli === 'gh' ? 'https://github.com/acme/repo/pull/' + n : 'https://gitlab.example.com/acme/repo/-/merge_requests/' + n;",
  "    st.prs.push({ estado: 'abierto', url: url, base: base, head: head, commit: null });",
  '    guardar();',
  "    salir(0, 'Creating pull request for ' + head + ' into ' + base + '\\n\\n' + url + '\\n', '');",
  '  }',
  "  salir(2, '', 'doble: llamada no soportada: ' + args.join(' ') + '\\n');",
  '}',
  'if (require.main === module) {',
  '  run(process.argv[2], process.argv.slice(3));',
  "} else if (/^(gh|glab)(\\.exe)?$/i.test(path.basename(process.execPath))) {",
  "  run(path.basename(process.execPath).replace(/\\.exe$/i, '').toLowerCase(), [path.basename(process.argv[1])].concat(process.argv.slice(2)));",
  '}',
  '',
].join('\n');

interface Instalacion {
  dir: string;
  script: string;
}

let instalacion: Instalacion | null = null;

/** Carpeta con `gh` y `glab` de prueba; se monta una vez por proceso y se borra al salir. */
function instalar(): Instalacion {
  if (instalacion !== null) return instalacion;
  const dir = mkdtempSync(path.join(tmpdir(), 'taskctl-doble-plataforma-'));
  const script = path.join(dir, 'doble.cjs');
  writeFileSync(script, CODIGO_DOBLE, 'utf8');
  for (const nombre of ['gh', 'glab']) {
    if (process.platform === 'win32') {
      const destino = path.join(dir, `${nombre}.exe`);
      try {
        linkSync(process.execPath, destino);
      } catch {
        copyFileSync(process.execPath, destino);
      }
    } else {
      const destino = path.join(dir, nombre);
      writeFileSync(destino, `#!/bin/sh\nexec "${process.execPath}" "${script}" ${nombre} "$@"\n`, 'utf8');
      chmodSync(destino, 0o755);
    }
  }
  process.once('exit', () => rmSync(dir, { recursive: true, force: true }));
  instalacion = { dir, script };
  return instalacion;
}

const EJECUTABLES = ['gh', 'glab'].flatMap((n) => [n, `${n}.exe`, `${n}.cmd`, `${n}.bat`]);

/** El PATH actual sin las carpetas donde haya un gh o glab REAL (la maquina de quien corra los tests puede tenerlos). */
function pathSinPlataformas(): string {
  return (process.env['PATH'] ?? '')
    .split(path.delimiter)
    .filter((d) => d !== '' && !EJECUTABLES.some((e) => existsSync(path.join(d, e))))
    .join(path.delimiter);
}

export interface ControlDoble {
  /** Estado actual (lo que el doble ha escrito, incluidas las llamadas). */
  leer(): Required<EstadoDoble>;
  /** Reemplaza el estado (p. ej. para simular que el PR se mergeo en la plataforma). */
  escribir(estado: EstadoDoble): void;
  /** Llamadas recibidas de un subcomando, p. ej. `llamadasDe('pr', 'create')`. */
  llamadasDe(sub1: string, sub2: string): string[][];
}

/**
 * Corre `fn` con `gh` y `glab` de prueba en el PATH (por delante de cualquier
 * real) y el estado inicial dado. Restaura PATH y NODE_OPTIONS al terminar.
 */
export async function conDoblePlataforma(
  inicial: EstadoDoble,
  fn: (c: ControlDoble) => Promise<void>
): Promise<void> {
  const { dir, script } = instalar();
  const fichero = path.join(mkdtempSync(path.join(tmpdir(), 'taskctl-doble-estado-')), 'estado.json');
  const control: ControlDoble = {
    leer: () => {
      const e = JSON.parse(readFileSync(fichero, 'utf8')) as EstadoDoble;
      return { auth: e.auth ?? true, listarFalla: e.listarFalla ?? false, crearFalla: e.crearFalla ?? false, prs: e.prs, llamadas: e.llamadas ?? [] };
    },
    escribir: (e) => writeFileSync(fichero, JSON.stringify({ llamadas: [], ...e }), 'utf8'),
    llamadasDe: (a, b) => (control.leer().llamadas).filter((l) => l[1] === a && l[2] === b),
  };
  control.escribir(inicial);
  const guardado = { PATH: process.env['PATH'], NODE_OPTIONS: process.env['NODE_OPTIONS'], ESTADO: process.env[ENV_ESTADO] };
  process.env['PATH'] = `${dir}${path.delimiter}${guardado.PATH ?? ''}`;
  process.env[ENV_ESTADO] = fichero;
  if (process.platform === 'win32') {
    // Barras normales y entre comillas: NODE_OPTIONS trata la barra invertida como escape.
    process.env['NODE_OPTIONS'] = `${guardado.NODE_OPTIONS ?? ''} --require "${script.replace(/\\/g, '/')}"`.trim();
  }
  try {
    await fn(control);
  } finally {
    restaurar('PATH', guardado.PATH);
    restaurar('NODE_OPTIONS', guardado.NODE_OPTIONS);
    restaurar(ENV_ESTADO, guardado.ESTADO);
    rmSync(path.dirname(fichero), { recursive: true, force: true });
  }
}

/** Corre `fn` con un PATH sin ningun gh ni glab: el caso "CLI no instalado". */
export async function sinPlataformasEnElPath(fn: () => Promise<void>): Promise<void> {
  const guardado = process.env['PATH'];
  process.env['PATH'] = pathSinPlataformas();
  try {
    await fn();
  } finally {
    restaurar('PATH', guardado);
  }
}

function restaurar(clave: string, valor: string | undefined): void {
  if (valor === undefined) delete process.env[clave];
  else process.env[clave] = valor;
}

