/**
 * Tests del empaquetado del plugin (item E6 / TASK-031).
 *
 * El defecto que motiva estos tests: en un clon recien hecho `taskctl` no
 * arrancaba. `dist/` estaba en `.gitignore` y `bin/taskctl` importa
 * `../dist/src/cli.js`, asi que quien clonaba el repo —o instalaba el
 * plugin desde el marketplace— recibia un CLI que moria con
 * `Cannot find module ...dist/src/cli.js` y codigo 1.
 *
 * Dos bloques, con motivos distintos:
 *
 * 1. DE INTEGRACION. El unico que prueba de verdad lo que importa: se
 *    exporta el arbol de HEAD a un directorio temporal —lo mismo que
 *    recibe quien clona— y se ejecuta `node bin/taskctl --version` SIN
 *    `npm install` ni `npm run build`. Y con su CONTRAPRUEBA: borrar
 *    `dist/src/` del arbol exportado tiene que volver a producir el
 *    fallo original. Sin ella, un test verde no distingue entre "el
 *    build viaja" y "el test nunca miro esa ruta".
 *
 * 2. ESTRUCTURALES. Baratos y de diagnostico claro: fijan las tres
 *    piezas que sostienen lo anterior (dist/src trackeado, dist/test
 *    fuera, y el eol fijado en .gitattributes + tsconfig). Cuando el
 *    bloque 1 se pone rojo, estos dicen cual de las tres se movio.
 *
 * LO QUE ESTOS TESTS NO CUBREN, a proposito: la desincronizacion entre
 * `src/` y `dist/src/`. El bloque 1 exporta HEAD, que es coherente
 * consigo mismo, asi que sigue verde aunque alguien cambie `src/` y
 * commitee sin recompilar. Detectarlo pide recompilar y comparar, y eso
 * vive en el guard de CI (`npm run build` + `git diff --exit-code`), que
 * ademas tiene que correr en Linux y en Windows porque el modo de fallo
 * real es cross-plataforma. Los dos mecanismos son complementarios: este
 * prueba que el build viaja, aquel que el build esta al dia.
 *
 * Cero dependencias: node:test, node:assert y git.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Localizacion --------------------------------------------------------
//
// Compilado, este fichero vive en dist/test/empaquetado/. Tres niveles
// arriba esta la raiz del plugin, y tres mas la del repo. Mismo truco que
// test/skills/task-workflow.test.ts, en vez de depender del cwd de npm.

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
const REPO_ROOT = path.resolve(PLUGIN_ROOT, '..', '..', '..');

/** Ruta del plugin relativa a la raiz del repo, en formato POSIX (git). */
const PLUGIN_REL = 'taskcode-marketplace/plugins/taskcode-plugin';

/** El fichero cuya ausencia era exactamente el defecto de E6. */
const ENTRYPOINT_REL = `${PLUGIN_REL}/dist/src/cli.js`;

function git(args: string[], cwd: string) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

/** true si REPO_ROOT es un repo git utilizable. */
function hayRepo(): boolean {
  const r = git(['rev-parse', '--git-dir'], REPO_ROOT);
  return r.status === 0;
}

/**
 * Materializa el arbol de HEAD en un directorio nuevo, igual que lo
 * recibiria quien clona: solo lo commiteado, con los filtros de
 * `.gitattributes` aplicados. Nunca ve el working tree, que es
 * justamente lo que se quiere — un `dist/src` sin commitear no debe
 * poder hacer pasar este test.
 */
async function exportarHead(): Promise<string> {
  // El sha se valida ANTES de crear nada: en un repo sin commits
  // `git rev-parse HEAD` imprime la cadena literal "HEAD" en stdout, y sin
  // esta comprobacion el fallo llegaria disfrazado de "no se pudo hacer
  // checkout de HEAD", como si hablara de una ref normal.
  const sha = git(['rev-parse', 'HEAD'], REPO_ROOT).stdout.trim();
  assert.match(sha, /^[0-9a-f]{40}$/, `HEAD no resuelve a un sha (devolvio "${sha}")`);

  const destino = await mkdtemp(path.join(tmpdir(), 'e6-dist-'));
  try {
    const clone = git(['clone', '--quiet', '--no-checkout', REPO_ROOT, destino], REPO_ROOT);
    assert.equal(clone.status, 0, `no se pudo clonar el repo: ${clone.stderr}`);

    const checkout = git(['checkout', '--quiet', sha], destino);
    assert.equal(checkout.status, 0, `no se pudo hacer checkout de ${sha}: ${checkout.stderr}`);
  } catch (e) {
    // Sin esto, un fallo a mitad deja un clon entero del repo huerfano en
    // el temporal: el try/finally del llamador no llega a existir todavia.
    await rm(destino, { recursive: true, force: true });
    throw e;
  }

  return destino;
}

/** Ejecuta `node bin/taskctl <args>` dentro de un arbol exportado. */
function taskctlEn(arbol: string, args: string[]) {
  const bin = path.join(arbol, ...PLUGIN_REL.split('/'), 'bin', 'taskctl');
  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
}

// --- 1. Integracion: el arranque en frio ---------------------------------

test('un arbol recien clonado arranca taskctl sin npm install ni npm run build (AC1)', async (t) => {
  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');

  const arbol = await exportarHead();
  try {
    // Precondicion explicita: nadie ha compilado nada aqui.
    assert.equal(
      existsSync(path.join(arbol, ...PLUGIN_REL.split('/'), 'node_modules')),
      false,
      'el arbol exportado no deberia traer node_modules',
    );

    const r = taskctlEn(arbol, ['--version']);

    assert.equal(
      r.status,
      0,
      `taskctl no arranco en un clon limpio. Es el defecto de E6: comprobar ` +
        `que dist/src/ sigue versionado.\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
    );
    assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+$/, 'deberia imprimir la version');
  } finally {
    await rm(arbol, { recursive: true, force: true });
  }
});

test('CONTRAPRUEBA: sin dist/src el mismo arbol vuelve a fallar como antes de E6', async (t) => {
  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');

  const arbol = await exportarHead();
  try {
    const dist = path.join(arbol, ...PLUGIN_REL.split('/'), 'dist');

    // Se comprueba que existe ANTES de borrarlo: `rm` con force es un
    // no-op silencioso si la ruta cambia, y entonces esta contraprueba
    // pasaria sin haber reproducido nada.
    assert.ok(existsSync(dist), 'el arbol exportado deberia traer dist/');

    // Se reproduce el estado anterior a la tarea: build ausente.
    await rm(dist, { recursive: true, force: true });

    const r = taskctlEn(arbol, ['--version']);

    assert.equal(r.status, 1, 'sin dist/src, taskctl tiene que salir con 1');
    assert.match(
      r.stderr,
      /no pudo arrancar/,
      'y decirlo por stderr, no morir en silencio',
    );
    // Y por LA razon que se quiere probar. El catch de bin/taskctl
    // convierte cualquier error en "no pudo arrancar" + codigo 1, asi que
    // sin esto la contraprueba pasaria tambien si taskctl muriera por un
    // motivo ajeno — incluso si bin/taskctl no existiese.
    assert.match(
      r.stderr,
      /Cannot find module/,
      'el fallo tiene que ser el modulo ausente, no otro cualquiera',
    );
  } finally {
    await rm(arbol, { recursive: true, force: true });
  }
});

// --- 2. Estructurales: las piezas que lo sostienen -----------------------

test('dist/src esta trackeado por git y dist/test no (AC4)', (t) => {
  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');

  const trackeados = git(['ls-files', '--', `${PLUGIN_REL}/dist`], REPO_ROOT)
    .stdout.split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  assert.ok(
    trackeados.includes(ENTRYPOINT_REL),
    `${ENTRYPOINT_REL} tiene que estar versionado: es lo que importa bin/taskctl`,
  );

  const deTest = trackeados.filter((f) => f.startsWith(`${PLUGIN_REL}/dist/test/`));
  assert.deepEqual(deTest, [], 'los tests compilados no se versionan');
});

test('el eol de fuentes y build esta fijado, o dist/src no seria reproducible (AC3)', async () => {
  // No es cosmetico: las plantillas multilinea de src/ viajan tal cual al
  // build. Con CRLF en el checkout de Windows, el mismo src/ compila
  // distinto que en Linux y el guard de CI daria falsos positivos.
  //
  // Quien fija el eol DE VERDAD es el .gitattributes. Medido en revision
  // por pares: con TypeScript 5.9.3, quitar "newLine" del tsconfig produce
  // salida byte a byte identica, o sea que hoy la opcion es inerte. Se
  // mantiene, y se asevera aqui, como cinturon y tirantes ante un cambio
  // de version de tsc que reintrodujera el default del sistema — pero no
  // hay que atribuirle un efecto que en esta version no tiene.
  const attrs = await readFile(path.join(PLUGIN_ROOT, '.gitattributes'), 'utf8');
  assert.match(attrs, /^\*\.ts\s+text\s+eol=lf$/m, 'los fuentes .ts, con eol=lf');
  assert.match(attrs, /^dist\/\*\*\s+text\s+eol=lf$/m, 'y el build generado tambien');

  const tsconfig = await readFile(path.join(PLUGIN_ROOT, 'tsconfig.json'), 'utf8');
  assert.match(tsconfig, /"newLine"\s*:\s*"lf"/, 'tsc tiene que emitir LF en toda plataforma');
});

test('ningun fichero de dist/src commiteado lleva CR', (t) => {
  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');

  // Alcance real de este test, para que nadie lo lea como la red que
  // atrapa el CRLF de Windows: mientras `dist/** text eol=lf` este en su
  // sitio, git normaliza al hacer `add` y commitear un CRLF aqui es
  // IMPOSIBLE. Lo que si detecta es (a) un CR suelto, que el filtro no
  // toca, y (b) un CRLF que entrase despues de que alguien rompiera el
  // .gitattributes. La invariante principal la garantiza git, no este
  // test; esto es la comprobacion de que el filtro sigue puesto.

  // Se lee del INDICE (git show), no del disco: es lo que viaja al clon.
  const ficheros = git(['ls-files', '--', `${PLUGIN_REL}/dist/src`], REPO_ROOT)
    .stdout.split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  assert.ok(ficheros.length > 0, 'deberia haber ficheros de dist/src versionados');

  const conCR = ficheros.filter((f) => {
    const contenido = spawnSync('git', ['show', `HEAD:${f}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    }).stdout;
    return contenido.includes('\r');
  });

  assert.deepEqual(conCR, [], 'un CR en el build delata que el eol no se fijo');
});
