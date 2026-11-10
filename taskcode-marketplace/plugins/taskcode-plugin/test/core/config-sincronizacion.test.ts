/**
 * Claves de sincronizacion de `.taskcode/config.yml` (TASK-033). Fallo
 * cerrado al CARGAR, no al commitear: para entonces la tarea ya se ha
 * movido y un error tardio deja el workspace a medias.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ConfigError, CONFIG_DEFAULTS, parsearConfig, parsearConfigConAvisos, resolverConfig } from '../../src/core/config.js';

const RUTA = '/repo/.taskcode/config.yml';
const BASE = 'comando_sincronizacion: "node scripts/sync.mjs"\n';

function rechaza(contenido: string, patron: RegExp): void {
  assert.throws(
    () => parsearConfig(contenido, RUTA),
    (e: unknown) => {
      assert.ok(e instanceof ConfigError, String(e));
      assert.match(e.message, patron);
      return true;
    },
    `deberia rechazar:\n${contenido}`
  );
}

test('config sincronizacion: sin claves, desactivada (defaults de 0.1.0 intactos)', () => {
  const c = parsearConfig('limite_wip: 2\n', RUTA);
  assert.equal(c.comando_sincronizacion, null);
  assert.deepEqual(c.rutas_sincronizacion, []);
  assert.equal(c.timeout_sincronizacion, 60);
  assert.equal(CONFIG_DEFAULTS.comando_sincronizacion, null);
});

test('config sincronizacion: comando + rutas + timeout validos se leen y normalizan', () => {
  const c = parsearConfig(
    BASE + 'rutas_sincronizacion: [docs/PLAN.md, "./PLANIFICACION.md", docs\\otro.md, docs/PLAN.md]\n' +
      'timeout_sincronizacion: 120\n',
    RUTA
  );
  assert.equal(c.comando_sincronizacion, 'node scripts/sync.mjs');
  assert.deepEqual(c.rutas_sincronizacion, ['docs/PLAN.md', 'PLANIFICACION.md', 'docs/otro.md']);
  assert.equal(c.timeout_sincronizacion, 120);
});

test('config sincronizacion: las dos claves van juntas', () => {
  rechaza(BASE, /"comando_sincronizacion" necesita tambien "rutas_sincronizacion"/);
  rechaza('rutas_sincronizacion: [docs/PLAN.md]\n', /"rutas_sincronizacion" necesita tambien "comando_sincronizacion"/);
  rechaza('timeout_sincronizacion: 30\n', /"timeout_sincronizacion" sin "comando_sincronizacion"/);
});

test('config sincronizacion: rutas invalidas abortan al cargar', () => {
  const casos: [string, RegExp][] = [
    ['[.]', /es la raiz del repo/],
    ['[./]', /es una carpeta/],
    ['[docs/]', /es una carpeta/],
    ['[../fuera.md]', /se sale del repo/],
    ['[docs/../../x.md]', /se sale del repo/],
    ['[/etc/passwd]', /es absoluta/],
    ['[C:/x.md]', /es absoluta/],
    // TASK-092: '[tareas/x.md]' salio de esta lista (ahora se acepta, ver el
    // test de la raiz de tareas/); en su lugar, los rechazos de dentro de tareas/.
    ['[tareas]', /es la carpeta tareas\/, no un fichero/],
    ['[tareas/]', /es una carpeta/],
    ['[tareas/01-en-diseno]', /tareas\/01-en-diseno es una carpeta de estado/],
    ['[tareas/01-en-diseno/x.md]', /es una carpeta de estado/],
    ['[tareas/04-terminadas/TASK-1/tarea.md]', /es una carpeta de estado/],
    ['[tareas/otra/x.md]', /esta en una subcarpeta de tareas\//],
    ['[docs/../tareas/02-en-curso/x.md]', /es una carpeta de estado/],
    ['[.taskcode/config.yml]', /esta bajo \.taskcode\//],
    ['[.git/HEAD]', /esta bajo \.git\//],
    // Sin distinguir mayusculas: en Windows y macOS son las mismas carpetas.
    ['[Tareas/01-en-diseno/x.md]', /Tareas\/01-en-diseno es una carpeta de estado/],
    ['[TAREAS/02-En-Curso/x.md]', /es una carpeta de estado/],
    ['[.GIT/HEAD]', /esta bajo \.GIT\//],
    ['[.TaskCode/config.yml]', /esta bajo \.TaskCode\//],
    ['[]', /lista no vacia/],
    ['docs/PLAN.md', /lista no vacia entre corchetes/],
  ];
  for (const [valor, patron] of casos) {
    rechaza(BASE + `rutas_sincronizacion: ${valor}\n`, patron);
  }
});

test('config sincronizacion: un fichero suelto en la raiz de tareas/ se acepta y se normaliza (TASK-092)', () => {
  const c = parsearConfig(
    BASE +
      'rutas_sincronizacion: [tareas/ROADMAP.md, "./tareas/ROADMAP.md", tareas\\ROADMAP.md, ' +
      'tareas/01-en-diseno/../ROADMAP.md, tareas/.oculto, docs/PLAN.md]\n',
    RUTA
  );
  assert.deepEqual(c.rutas_sincronizacion, ['tareas/ROADMAP.md', 'tareas/.oculto', 'docs/PLAN.md']);
  // Cada carpeta de estado sigue cerrada, tambien con un solo fichero debajo.
  for (const carpeta of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
    rechaza(BASE + `rutas_sincronizacion: [tareas/${carpeta}/x.md]\n`, /es una carpeta de estado/);
  }
});

test('config sincronizacion: informe_cobertura sigue sin admitir nada bajo tareas/ (TASK-092)', () => {
  rechaza('informe_cobertura: tareas/x.lcov\n', /esta bajo tareas\//);
  rechaza('informe_cobertura: Tareas/x.lcov\n', /esta bajo Tareas\//);
});

test('resolverConfig: tareas/ROADMAP.md se acepta; si en disco es una carpeta, aborta (TASK-092)', async () => {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-cfgsync-'));
  try {
    await mkdir(path.join(repo, '.git'));
    await mkdir(path.join(repo, 'tareas', 'ROADMAP.md'), { recursive: true });
    await mkdir(path.join(repo, '.taskcode'));
    await writeFile(
      path.join(repo, '.taskcode', 'config.yml'),
      BASE + 'rutas_sincronizacion: [tareas/ROADMAP.md]\n',
      'utf8'
    );
    assert.throws(() => resolverConfig(repo), /"tareas\/ROADMAP\.md" es una carpeta/);
    await rm(path.join(repo, 'tareas', 'ROADMAP.md'), { recursive: true });
    await writeFile(path.join(repo, 'tareas', 'ROADMAP.md'), '# roadmap\n', 'utf8');
    assert.deepEqual(resolverConfig(repo).rutas_sincronizacion, ['tareas/ROADMAP.md']);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test('config sincronizacion: comando vacio y timeout no positivo abortan', () => {
  rechaza('comando_sincronizacion: ""\nrutas_sincronizacion: [a.md]\n', /debe ser un comando/);
  rechaza(BASE + 'rutas_sincronizacion: [a.md]\ntimeout_sincronizacion: 0\n', /Son segundos/);
  rechaza(BASE + 'rutas_sincronizacion: [a.md]\ntimeout_sincronizacion: 0\n', /Por defecto es 60/);
});

// TASK-061: antes ABORTABA. Una errata en la clave avisa y sugiere la buena; la
// sincronizacion queda desactivada porque la clave mal escrita no se lee.
test('config sincronizacion: una errata en la clave avisa y sugiere la buena (antes abortaba)', () => {
  const { config, avisos } = parsearConfigConAvisos('comando_sincronizacon: x\n', RUTA);
  assert.match(avisos.join('\n'), /Quiza quisiste decir "comando_sincronizacion"/);
  assert.equal(config.comando_sincronizacion, null);
});

test('config sincronizacion: el limite_wip invalido conserva su mensaje (no hereda el del timeout)', () => {
  rechaza('limite_wip: 0\n', /impedirian arrancar cualquier tarea/);
});

test('config sincronizacion: el "#" sin comillas trunca el comando; entrecomillado se conserva', () => {
  const sin = parsearConfig('comando_sincronizacion: node a.mjs #x\nrutas_sincronizacion: [a.md]\n', RUTA);
  assert.equal(sin.comando_sincronizacion, 'node a.mjs');
  const con = parsearConfig(
    'comando_sincronizacion: "node a.mjs #x"\nrutas_sincronizacion: [a.md]\n',
    RUTA
  );
  assert.equal(con.comando_sincronizacion, 'node a.mjs #x');
});

test('resolverConfig: una ruta de sincronizacion que en disco es una carpeta aborta', async () => {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-cfgsync-'));
  try {
    await mkdir(path.join(repo, '.git'));
    await mkdir(path.join(repo, 'docs'));
    await mkdir(path.join(repo, '.taskcode'));
    await writeFile(
      path.join(repo, '.taskcode', 'config.yml'),
      BASE + 'rutas_sincronizacion: [docs]\n',
      'utf8'
    );
    assert.throws(() => resolverConfig(repo), /"docs" es una carpeta/);
    await writeFile(
      path.join(repo, '.taskcode', 'config.yml'),
      BASE + 'rutas_sincronizacion: [docs/PLAN.md]\n',
      'utf8'
    );
    assert.deepEqual(resolverConfig(repo).rutas_sincronizacion, ['docs/PLAN.md']);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
