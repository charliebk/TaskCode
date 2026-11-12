#!/usr/bin/env node
/**
 * Verificacion por impacto de TaskCode — TASK-122.
 *
 * Es la `comando_verificacion_selectiva` de este repo: la que corren `finish`
 * (nivel 2 de la verificacion proporcional), el freno Stop y las rondas de
 * `review`. La suite completa (`comando_verificacion`) queda para antes de
 * publicar cada version. Regla de la tarea: cada paso de una tarea cuesta en
 * proporcion a lo que cambia, nunca al tamano del proyecto.
 *
 * Que hace, desde la raiz del repo (es donde lo lanza taskctl):
 * 1. Saca los ficheros cambiados: `git diff --name-only <base>...HEAD` (la base
 *    llega en RAMA_BASE; sin ella, `develop`) mas lo no commiteado.
 * 2. Elige los ficheros de test del plugin:
 *    - un `test/**\/*.test.ts` cambiado se corre;
 *    - un `.ts` de `src/` o `test/` cambiado: los tests que lo importan, directa
 *      o transitivamente (grafo de imports relativos leido con una expresion
 *      regular, sin compilar). La busqueda se para en `src/cli.ts`, el
 *      enrutador de comandos: mas alla solo entran los tests que nombran un
 *      comando por el que el cambio llego a el (ver `testsQueDependenDe`);
 *    - un fichero que los tests usan sin importarlo: `bin/taskctl` cuenta como
 *      importado por quien lo lanza (marcador `'bin', 'taskctl'`), igual que
 *      `scripts/gitflow/**` (marcador `'scripts', 'gitflow'`); cualquier otro
 *      fichero que no es documentacion, por los tests que mencionan su nombre;
 *      si nadie lo menciona, la suite entera (ante la duda, todo);
 *    - `package.json`, `package-lock.json` y `tsconfig.json`: harian falta la
 *      suite entera; se corren los tests que los nombran (con el tope de abajo)
 *      y la completa queda para antes de publicar;
 *    - documentacion y config del repo (`docs/**`, `tareas/**`, `.taskcode/**`,
 *      `.github/**`, `.claude/**`, los `.md` de la raiz) y
 *      `dist/src/**` (generado): nada.
 * 3. Siempre suma los tests de `test/core` y `test/cli` (lo de
 *    `npm run test:rapido`, ~10 s): red barata de toda la logica sin Git.
 * 4. Compila una vez (`npm run build`) y corre `node --test` con lo elegido.
 *    Imprime que eligio y por que, y sale con el codigo de `node --test`.
 *
 * Tope (VERIFICAR_IMPACTO_TOPE, 10 por defecto): si lo elegido pasa del tope,
 * se corren los tests DIRECTOS de lo cambiado; si tambien pasan, los N (= tope,
 * minimo 1) directos mas proximos: primero los tests cambiados, luego los que
 * se llaman como el modulo cambiado (`finish*` para `src/commands/finish.ts`),
 * luego los de una carpeta con el nombre de la suya (`test/gitflow/` para
 * `scripts/gitflow/*`) y despues el resto por orden alfabetico. La salida dice
 * cuantos se dejan fuera. Nunca queda en cero lo que cambia si tiene tests.
 *
 * Base inexistente (RAMA_BASE o `develop`): sale con 1 y lo dice; no hay
 * verificacion por impacto sin una base con la que comparar.
 *
 * Limitacion conocida: `npm run build` reescribe `dist/src` (versionado). Se
 * guarda una copia en `<tmp>/verificar-impacto-<hash del plugin>/` con un
 * marcador y se devuelve al acabar. Si el proceso muere a mitad (taskkill,
 * timeout del freno), el `finally` no corre: la siguiente ejecucion encuentra
 * la copia con su marcador, restaura `dist/src` y lo avisa. `dist/test` (no
 * versionado) puede quedar a medias hasta el siguiente build.
 *
 * `--listar` solo imprime la seleccion en JSON (sin compilar ni ejecutar).
 * Cero dependencias: node >= 22.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLUGIN = 'taskcode-marketplace/plugins/taskcode-plugin';
const RAPIDO = ['test/core', 'test/cli'];
const TODO_EL_PROYECTO = new Set(['package.json', 'package-lock.json', 'tsconfig.json']);
const MARCADORES = [
  { patron: /['"]bin['"]\s*,\s*['"]taskctl['"]|bin\/taskctl/, dependeDe: (f) => f === 'bin/taskctl' || f === 'bin/taskctl.cmd' },
  { patron: /['"]scripts['"]\s*,\s*['"]gitflow['"]|scripts\/gitflow/, dependeDe: (f) => f.startsWith('scripts/gitflow/') },
];
/** El enrutador de comandos (ver testsQueDependenDe); es lo que carga `bin/taskctl`. */
export const ENRUTADOR = 'src/cli.ts';
const LANZA_TASKCTL = MARCADORES[0].patron;
const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g;

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  return r.status === 0 ? r.stdout : null;
}

function lineas(s) {
  return (s ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

/** Rutas (relativas a la raiz del repo) cambiadas frente a la base, o null si la base no existe. */
export function rutasCambiadas(raiz, base) {
  if (git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`], raiz) === null) return null;
  const commiteado = git(['diff', '--name-only', '--no-renames', `${base}...HEAD`], raiz);
  if (commiteado === null) return null;
  const sinCommitear = git(['diff', '--name-only', '--no-renames', 'HEAD'], raiz) ?? '';
  const nuevos = git(['ls-files', '--others', '--exclude-standard'], raiz) ?? '';
  return [...new Set([...lineas(commiteado), ...lineas(sinCommitear), ...lineas(nuevos)])].sort();
}

function recorrer(dir, base, salida) {
  if (!existsSync(dir)) return;
  for (const nombre of readdirSync(dir)) {
    const abs = path.join(dir, nombre);
    const rel = `${base}/${nombre}`;
    if (statSync(abs).isDirectory()) recorrer(abs, rel, salida);
    else if (nombre.endsWith('.ts')) salida.push(rel);
  }
}

function resolverImport(desde, especificador, existentes) {
  const unido = path.posix.normalize(path.posix.join(path.posix.dirname(desde), especificador));
  const candidatos = [unido.replace(/\.js$/, '.ts'), unido, `${unido}.ts`, `${unido}/index.ts`];
  return candidatos.find((c) => existentes.has(c)) ?? null;
}

/** Grafo del plugin: por fichero `.ts` (relativo al plugin), su texto y lo que importa. */
export function grafoDelPlugin(dirPlugin) {
  const ficheros = [];
  recorrer(path.join(dirPlugin, 'src'), 'src', ficheros);
  recorrer(path.join(dirPlugin, 'test'), 'test', ficheros);
  const existentes = new Set(ficheros);
  const nodos = new Map();
  for (const f of ficheros) {
    const texto = readFileSync(path.join(dirPlugin, f), 'utf8');
    const importa = new Set();
    for (const m of texto.matchAll(IMPORT_RE)) {
      const destino = resolverImport(f, m[1], existentes);
      if (destino !== null) importa.add(destino);
    }
    // Quien lanza bin/taskctl ejecuta src/cli.ts (o la via rapida de estado) sin importarlo.
    if (LANZA_TASKCTL.test(texto)) {
      for (const d of [ENRUTADOR, 'src/commands/estado.ts']) if (existentes.has(d)) importa.add(d);
    }
    nodos.set(f, { texto, importa });
  }
  return nodos;
}

const esTest = (f) => f.startsWith('test/') && f.endsWith('.test.ts');
const enRapido = (f) => RAPIDO.some((d) => f.startsWith(`${d}/`));

/** Nombres con los que se invoca por CLI el comando de `src/commands/<x>.ts` (`finish-verificacion` -> finish). */
function nombresDeComando(fichero) {
  const x = path.posix.basename(fichero, '.ts');
  return [...new Set([x, x.split('-')[0]])];
}

/**
 * Tests que dependen (directa o transitivamente) de alguno de `origenes`.
 *
 * `src/cli.ts` es el enrutador de todos los comandos: casi todo test de un
 * comando lo importa (o lanza `bin/taskctl`) para ejecutar SU comando, no los
 * demas. Pasar por el sin filtro elegiria casi la suite entera para cualquier
 * cambio. Asi que la busqueda se para en el y, mas alla, solo entran los tests
 * que nombran entre comillas (en su texto o en el de un helper que importan)
 * alguno de los comandos por los que el cambio llego al enrutador. Si el cambio
 * es el propio enrutador, o llega a el sin pasar por ningun comando, entran
 * todos los que dependen de el.
 */
function testsQueDependenDe(nodos, origenes, cortes) {
  const inverso = new Map();
  for (const [f, n] of nodos) {
    for (const d of n.importa) {
      if (!inverso.has(d)) inverso.set(d, new Set());
      inverso.get(d).add(f);
    }
  }
  const buscar = (inicio, parar) => {
    const vistos = new Set(inicio);
    const cola = [...inicio];
    while (cola.length > 0) {
      const actual = cola.shift();
      if (parar.has(actual) && !inicio.includes(actual)) continue;
      for (const quien of inverso.get(actual) ?? []) {
        if (!vistos.has(quien)) {
          vistos.add(quien);
          cola.push(quien);
        }
      }
    }
    return vistos;
  };
  const vistos = buscar(origenes, new Set([ENRUTADOR]));
  const tests = new Set([...vistos].filter(esTest));
  if (vistos.has(ENRUTADOR) && !origenes.includes(ENRUTADOR)) {
    const comandos = [...vistos].filter((f) => f.startsWith('src/commands/')).flatMap(nombresDeComando);
    cortes?.push(comandos.length === 0 ? 'todos sus tests (no paso por ningun comando)' : `solo los que nombran ${[...new Set(comandos)].map((c) => `'${c}'`).join(', ')}`);
    const nombra = (t) => {
      const propios = [t, ...[...(nodos.get(t)?.importa ?? [])].filter((d) => d.startsWith('test/'))];
      const textos = propios.map((f) => nodos.get(f)?.texto ?? '');
      return comandos.some((c) => textos.some((x) => x.includes(`'${c}'`) || x.includes(`"${c}"`)));
    };
    for (const t of buscar([ENRUTADOR], new Set())) {
      if (esTest(t) && (comandos.length === 0 || nombra(t))) tests.add(t);
    }
  }
  return [...tests];
}

/**
 * Lo que no amplia la seleccion: documentacion, estado de las tareas y
 * configuracion del propio repo (`.taskcode/`, `.github/`, `.claude/`). La
 * config de taskctl la leen los comandos en uso, no la suite del plugin: por su
 * nombre (`config.yml`) arrastraba 162 ficheros de test.
 */
function esDocumentacion(ruta) {
  return (
    ruta.startsWith('docs/') ||
    ruta.startsWith('tareas/') ||
    ruta.startsWith('.taskcode/') ||
    ruta.startsWith('.github/') ||
    ruta.startsWith('.claude/') ||
    (!ruta.includes('/') && ruta.endsWith('.md')) ||
    // Los .md de la raiz del plugin (README): su nombre lo cita media suite.
    (ruta.startsWith(`${PLUGIN}/`) && !ruta.slice(PLUGIN.length + 1).includes('/') && ruta.endsWith('.md'))
  );
}

/**
 * Tope de ficheros de test por impacto (fuera de los de test:rapido). Por
 * encima, la seleccion ya no es proporcional al cambio (un modulo comun como
 * `core/config.ts` arrastra 110 de 192): se corren test:rapido mas los tests
 * DIRECTOS de lo cambiado y se dice. Lo demas lo cubre la completa antes de
 * publicar. Se cambia con VERIFICAR_IMPACTO_TOPE. Por que 10: en Windows,
 * cada fichero que recorre el ciclo por CLI tarda 50-60 s con la suite en
 * paralelo; con 14 de ellos la verificacion de TASK-122 tardo 178 s y con el
 * tope en 10 (6 directos), 64 s.
 */
export const TOPE_POR_DEFECTO = 10;

/**
 * Decide que tests corren. Devuelve { todo, motivo?, tests, recorte?, enrutador? }:
 * `tests` son [{ fichero, motivo }] relativos al plugin (`test/...test.ts`);
 * `todo` = haria falta la suite entera; `recorte` (texto) = la seleccion pasaba
 * del tope o pedia la suite entera y `tests` son los directos (o los mas
 * proximos); `enrutador` (texto) = la busqueda se paro en `src/cli.ts`.
 */
export function seleccionar(cambiadas, nodos, tope = TOPE_POR_DEFECTO) {
  const elegidos = new Map();
  /** Directos: fichero -> { motivo, origenes } (rutas cambiadas de las que viene). */
  const directos = new Map();
  const anotar = (mapa, fichero, motivo) => {
    if (!mapa.has(fichero)) mapa.set(fichero, motivo);
  };
  const anotarDirecto = (fichero, motivo, origen) => {
    if (!directos.has(fichero)) directos.set(fichero, { motivo, origenes: new Set() });
    const d = directos.get(fichero);
    if (motivo === 'test cambiado') d.motivo = motivo;
    d.origenes.add(origen);
  };
  let todo = null;
  const cortes = [];
  for (const ruta of cambiadas) {
    if (esDocumentacion(ruta)) continue;
    const enPlugin = ruta.startsWith(`${PLUGIN}/`);
    const rel = enPlugin ? ruta.slice(PLUGIN.length + 1) : ruta;
    if (enPlugin && rel.startsWith('dist/')) continue;
    if (enPlugin && TODO_EL_PROYECTO.has(rel)) {
      todo ??= `cambia ${ruta}, que afecta a toda la suite (la completa queda para antes de publicar)`;
      // Sus directos: los tests que lo nombran.
      for (const [f, n] of nodos) if (esTest(f) && n.texto.includes(rel)) anotarDirecto(f, `nombra ${rel}`, ruta);
      continue;
    }
    if (enPlugin && rel.endsWith('.ts') && (rel.startsWith('src/') || rel.startsWith('test/'))) {
      if (esTest(rel) && nodos.has(rel)) {
        anotar(elegidos, rel, 'test cambiado');
        anotarDirecto(rel, 'test cambiado', ruta);
      }
      if (!nodos.has(rel)) continue; // borrado: quien lo importaba tambien cambia
      for (const t of testsQueDependenDe(nodos, [rel], cortes)) anotar(elegidos, t, `importa ${rel}`);
      for (const [f, n] of nodos) if (esTest(f) && n.importa.has(rel)) anotarDirecto(f, `importa ${rel}`, ruta);
      continue;
    }
    // Ficheros que los tests usan sin importarlos.
    const marcados = [...nodos].filter(([, n]) => MARCADORES.some((m) => enPlugin && m.dependeDe(rel) && m.patron.test(n.texto)));
    const nombre = path.posix.basename(ruta);
    const mencionan = marcados.length > 0 ? marcados : [...nodos].filter(([, n]) => n.texto.includes(nombre));
    if (mencionan.length === 0) {
      todo ??= `ningun test referencia ${ruta}: ante la duda, la suite entera (la completa queda para antes de publicar)`;
      continue;
    }
    for (const t of testsQueDependenDe(nodos, mencionan.map(([f]) => f), cortes)) anotar(elegidos, t, `usa ${ruta}`);
    for (const [f] of mencionan) if (esTest(f)) anotarDirecto(f, `usa ${ruta}`, ruta);
  }
  const lista = (mapa) =>
    [...mapa].map(([fichero, m]) => ({ fichero, motivo: typeof m === 'string' ? m : m.motivo })).sort((a, b) => a.fichero.localeCompare(b.fichero));
  const contar = (mapa) => [...mapa.keys()].filter((f) => !enRapido(f)).length;
  // Si ni los directos caben en el tope, los N (= tope, minimo 1) mas proximos.
  const recortados = () => {
    const total = contar(directos);
    if (total <= tope) return { tests: lista(directos), que: `los ${String(total)} tests directos` };
    const n = Math.max(tope, 1);
    const fueraDeRapido = [...directos].filter(([f]) => !enRapido(f));
    const orden = fueraDeRapido
      .map(([f, d]) => ({ f, d, p: proximidad(f, d) }))
      .sort((a, b) => a.p - b.p || a.f.localeCompare(b.f))
      .slice(0, n);
    const quedan = new Map([...directos].filter(([f]) => enRapido(f)));
    for (const { f, d } of orden) quedan.set(f, d);
    return {
      tests: lista(quedan),
      que: `los ${String(n)} tests directos mas proximos de ${String(total)} (${String(total - n)} se dejan fuera)`,
    };
  };
  const enrutador = cortes.length === 0 ? {} : { enrutador: `la busqueda se paro en ${ENRUTADOR}; mas alla, ${[...new Set(cortes)].join('; ')}` };
  if (todo !== null) {
    const r = recortados();
    return { todo: true, motivo: todo, tests: r.tests, recorte: `${todo}; se corren ${r.que}`, ...enrutador };
  }
  const fuera = contar(elegidos);
  if (fuera > tope) {
    const r = recortados();
    return {
      todo: false,
      tests: r.tests,
      recorte: `${String(fuera)} ficheros por impacto pasan del tope de ${String(tope)}; se corren ${r.que}`,
      ...enrutador,
    };
  }
  return { todo: false, tests: lista(elegidos), ...enrutador };
}

/**
 * Cuanto de cerca esta el test `fichero` de lo que cambia (menor = mas cerca):
 * 0 si es un test cambiado; 1 si se llama como el modulo cambiado
 * (`finish.ts` -> `finish*.test.ts`); 2 si vive en una carpeta con el nombre
 * de la del modulo (`scripts/gitflow/x.sh` -> `test/gitflow/`); 3 el resto.
 */
function proximidad(fichero, directo) {
  if (directo.motivo === 'test cambiado') return 0;
  const base = path.posix.basename(fichero).replace(/\.test\.ts$/, '');
  const carpetas = path.posix.dirname(fichero).split('/');
  let p = 3;
  for (const origen of directo.origenes) {
    const modulo = path.posix.basename(origen).replace(/\.[^.]+$/, '').replace(/^_+/, '');
    const carpeta = path.posix.basename(path.posix.dirname(origen));
    if (modulo !== '' && base.startsWith(modulo)) p = Math.min(p, 1);
    else if (!['src', 'test', 'helpers', '.', ''].includes(carpeta) && carpetas.includes(carpeta)) p = Math.min(p, 2);
  }
  return p;
}

/** VERIFICAR_IMPACTO_TOPE si es un entero >= 0; si no, el de por defecto. */
function leerTope(valor) {
  const n = Number(valor);
  return valor !== undefined && valor.trim() !== '' && Number.isInteger(n) && n >= 0 ? n : TOPE_POR_DEFECTO;
}

function aDist(fichero) {
  return `dist/${fichero.replace(/\.ts$/, '.js')}`;
}

function npm(script, dirPlugin) {
  const r = spawnSync(`npm run ${script}`, { cwd: dirPlugin, stdio: 'inherit', shell: true, windowsHide: true });
  return r.status ?? 1;
}

function main(argv) {
  const listar = argv.includes('--listar');
  const raiz = lineas(git(['rev-parse', '--show-toplevel'], process.cwd()))[0];
  if (raiz === undefined) {
    console.error('[ERROR] verificar-impacto: no estoy dentro de un repositorio Git.');
    return 2;
  }
  const dirPlugin = path.join(raiz, ...PLUGIN.split('/'));
  const base = process.env.RAMA_BASE || 'develop';
  const cambiadas = rutasCambiadas(raiz, base);
  if (cambiadas === null) {
    console.error(
      `[ERROR] verificar-impacto: la rama base "${base}" no existe en este repositorio, asi que no hay con que comparar. ` +
        `Si solo tienes la remota, creala con \`git branch ${base} origin/${base}\`; o indica otra base con RAMA_BASE=<rama>.`
    );
    return 1;
  }
  const nodos = grafoDelPlugin(dirPlugin);
  const seleccion = seleccionar(cambiadas, nodos, leerTope(process.env.VERIFICAR_IMPACTO_TOPE));
  const rapido = RAPIDO.filter((d) => existsSync(path.join(dirPlugin, d)));
  const fuera = seleccion.tests.filter((t) => !enRapido(t.fichero));

  if (listar) {
    console.log(JSON.stringify({ base, cambiadas, ...seleccion, rapido }, null, 2));
    return 0;
  }

  console.log(`[verificar-impacto] Base: ${base}. Ficheros cambiados: ${String(cambiadas.length)}.`);
  console.log(`[verificar-impacto] Siempre: ${rapido.join(', ')} (lo de test:rapido).`);
  if (seleccion.enrutador !== undefined) console.log(`[verificar-impacto] Enrutador: ${seleccion.enrutador}.`);
  if (seleccion.recorte !== undefined) {
    console.log(`[verificar-impacto] Seleccion recortada: ${seleccion.recorte}. La suite completa queda para antes de publicar.`);
  }
  console.log(`[verificar-impacto] Por impacto: ${String(fuera.length)} fichero(s) de test.`);
  for (const t of fuera) console.log(`  - ${t.fichero} (${t.motivo})`);

  const objetivos = [...rapido.map((d) => `dist/${d}/**/*.test.js`), ...fuera.map((t) => aDist(t.fichero))];
  if (objetivos.length === 0) {
    console.log('[verificar-impacto] No hay tests que correr.');
    return 0;
  }
  // La verificacion no puede cambiar el arbol: `npm run build` reescribe
  // dist/src (versionado). Se guarda antes y se devuelve tal cual al acabar.
  const distSrc = path.join(dirPlugin, 'dist', 'src');
  const copia = dirCopia(dirPlugin);
  restaurarHuerfana(copia, distSrc);
  mkdirSync(copia, { recursive: true });
  const habiaDist = existsSync(distSrc);
  if (habiaDist) cpSync(distSrc, path.join(copia, 'src'), { recursive: true });
  // El marcador va el ultimo: sin el, la copia esta a medias y no se restaura.
  writeFileSync(path.join(copia, MARCADOR), JSON.stringify({ dirPlugin, habiaDist, pid: process.pid }));
  try {
    if (existsSync(path.join(dirPlugin, 'package.json'))) {
      const scripts = JSON.parse(readFileSync(path.join(dirPlugin, 'package.json'), 'utf8')).scripts ?? {};
      if (scripts['limpiar:test'] && npm('limpiar:test', dirPlugin) !== 0) return 1;
      if (scripts.build && npm('build', dirPlugin) !== 0) return 1;
    }
    const inicio = Date.now();
    // Sin NODE_TEST_CONTEXT: si quien lanza esto corre bajo node --test, el hijo
    // se tomaria por un subtest y no imprimiria su informe.
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    // RAMA_BASE es para elegir la seleccion, no para los tests: un test que la herede
    // cambia de comportamiento (el freno Stop siempre la pasa a la selectiva).
    delete env.RAMA_BASE;
    const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...objetivos], {
      cwd: dirPlugin,
      env,
      stdio: 'inherit',
      windowsHide: true,
    });
    console.log(`[verificar-impacto] node --test termino con ${String(r.status)} en ${((Date.now() - inicio) / 1000).toFixed(1)} s.`);
    return r.status ?? 1;
  } finally {
    devolver(copia, distSrc, habiaDist);
  }
}

const MARCADOR = 'marcador.json';

/** Carpeta de la copia de dist/src: fija por plugin, para encontrarla si una ejecucion se corta. */
export function dirCopia(dirPlugin) {
  const hash = createHash('sha256').update(path.resolve(dirPlugin).toLowerCase()).digest('hex').slice(0, 12);
  return path.join(tmpdir(), `verificar-impacto-${hash}`);
}

function devolver(copia, distSrc, habiaDist) {
  rmSync(distSrc, { recursive: true, force: true });
  if (habiaDist) cpSync(path.join(copia, 'src'), distSrc, { recursive: true });
  rmSync(copia, { recursive: true, force: true });
}

/** Si una ejecucion anterior murio a mitad, devuelve su dist/src y lo avisa. */
function restaurarHuerfana(copia, distSrc) {
  if (!existsSync(copia)) return;
  const marcador = path.join(copia, MARCADOR);
  if (!existsSync(marcador)) {
    rmSync(copia, { recursive: true, force: true });
    return;
  }
  let habiaDist = true;
  try {
    habiaDist = JSON.parse(readFileSync(marcador, 'utf8')).habiaDist !== false;
  } catch {
    // marcador ilegible: se asume que habia dist/src
  }
  console.log(
    `[verificar-impacto] AVISO: una ejecucion anterior se corto a mitad (queda su copia en ${copia}). ` +
      'Restauro dist/src a como estaba antes de ella.'
  );
  devolver(copia, distSrc, habiaDist);
}

const invocadoDirecto = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invocadoDirecto) process.exitCode = main(process.argv.slice(2));
