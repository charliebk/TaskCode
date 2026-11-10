/** TASK-100: decision unica de la verificacion proporcional, config y anotacion (puros). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  decidirVerificacion,
  documentacionDeclarada,
  patronesDocumentacion,
  RUTA_TAREAS_SIEMPRE_DOCUMENTACION,
} from '../../src/core/verificacion-proporcional.js';
import { ConfigError, parsearConfig } from '../../src/core/config.js';
import { anotarVerificacionDocumentacion } from '../../src/core/transiciones.js';
import { rutasDeTarea } from '../../src/fs/git.js';

const CFG = { rutas_documentacion: ['docs/**'], comando_verificacion_documentacion: null };

test('decidirVerificacion: solo documentacion unicamente cuando se puede afirmar', () => {
  const docs = decidirVerificacion(CFG, { todas: ['docs/a.md', 'tareas/x.md'], fueraDeDocs: [] }, 'develop');
  assert.equal(docs.tipo, 'documentacion');
  assert.match(docs.motivo, /solo cambia documentacion \(2 fichero\(s\) dentro de rutas_documentacion de "develop"\)/);
  assert.equal(docs.tipo === 'documentacion' ? docs.comando : 'x', null);

  const conComando = decidirVerificacion(
    { ...CFG, comando_verificacion_documentacion: 'node docs.js' },
    { todas: ['docs/a.md'], fueraDeDocs: [] },
    'develop'
  );
  assert.equal(conComando.tipo === 'documentacion' ? conComando.comando : null, 'node docs.js');

  const casos: Array<[string, Parameters<typeof decidirVerificacion>[1], RegExp, typeof CFG?]> = [
    ['sin rutas', { todas: ['docs/a.md'], fueraDeDocs: [] }, /no declara rutas_documentacion/, { ...CFG, rutas_documentacion: [] }],
    ['diff no calculable', null, /no se pudo calcular/],
    ['diff vacio', { todas: [], fueraDeDocs: [] }, /no cambia nada/],
    ['config cambiada', { todas: ['docs/a.md', '.taskcode/config.yml'], fueraDeDocs: [] }, /cambia \.taskcode\/config\.yml/],
    ['mixto', { todas: ['docs/a.md', 'src/b.ts'], fueraDeDocs: ['src/b.ts'] }, /no son documentacion: src\/b\.ts/],
  ];
  for (const [nombre, diff, motivo, cfg] of casos) {
    const d = decidirVerificacion(cfg ?? CFG, diff, 'develop');
    assert.equal(d.tipo, 'completa', nombre);
    assert.match(d.motivo, motivo, nombre);
  }
  const muchas = decidirVerificacion(CFG, { todas: ['a', 'b', 'c', 'd', 'e'], fueraDeDocs: ['a', 'b', 'c', 'd', 'e'] }, 'develop');
  assert.match(muchas.motivo, /a, b, c y 2 mas$/);
});

test('patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas', () => {
  assert.deepEqual(patronesDocumentacion(CFG), ['docs/**', RUTA_TAREAS_SIEMPRE_DOCUMENTACION]);
  assert.equal(documentacionDeclarada(CFG), true);
  assert.equal(documentacionDeclarada({ ...CFG, rutas_documentacion: [] }), false);
});

test('config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion', () => {
  const ok = parsearConfig(
    'comando_verificacion: "npm test"\nrutas_documentacion: [docs/**, "*.md"]\ncomando_verificacion_documentacion: "node d.js"\n',
    'c.yml'
  );
  // Sin anclar: "*.md" es solo la raiz, no **/*.md (que alcanzaria skills y agentes).
  assert.deepEqual(ok.rutas_documentacion, ['docs/**', '*.md']);
  assert.equal(ok.comando_verificacion_documentacion, 'node d.js');
  const porDefecto = parsearConfig('', 'c.yml');
  assert.deepEqual(porDefecto.rutas_documentacion, []);
  assert.equal(porDefecto.comando_verificacion_documentacion, null);

  assert.throws(() => parsearConfig('rutas_documentacion: [docs/**]\n', 'c.yml'), (e: unknown) => {
    assert.ok(e instanceof ConfigError);
    assert.match(e.message, /"rutas_documentacion" necesita tambien "comando_verificacion"/);
    return true;
  });
  assert.throws(
    () => parsearConfig('comando_verificacion: "npm test"\ncomando_verificacion_documentacion: "node d.js"\n', 'c.yml'),
    /"comando_verificacion_documentacion" necesita tambien "rutas_documentacion"/
  );
  assert.throws(
    () => parsearConfig('comando_verificacion: "npm test"\nrutas_documentacion: docs\n', 'c.yml'),
    /Ejemplo: rutas_documentacion: \[docs\/\*\*, README\.md\]/
  );
  assert.throws(() => parsearConfig('comando_verificacion: "npm test"\nrutas_documentacion: [../fuera/**]\n', 'c.yml'), /sale del repo/);
});

test('anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea', () => {
  const una = anotarVerificacionDocumentacion('## Objetivo\n\nX.\n', '2026-11-10', 'npm test', 'solo docs', null);
  assert.match(una, /## Verificacion de documentacion\n\n- 2026-11-10: solo docs; no se ejecuta `npm test`, sin comprobacion de documentacion declarada\n$/);
  const dos = anotarVerificacionDocumentacion(una, '2026-11-11', 'npm `x`', 'solo docs', 'node d.js');
  assert.equal((dos.match(/^## Verificacion de documentacion$/gm) ?? []).length, 1);
  assert.match(dos, /- 2026-11-11: solo docs; no se ejecuta `npm 'x'`, comprobacion de documentacion `node d\.js`/);
});

test('rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rutas-tarea-'));
  const g = (...a: string[]) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
  try {
    g('init', '-q', '-b', 'develop');
    g('config', 'user.email', 't@t');
    g('config', 'user.name', 't');
    g('commit', '-q', '--allow-empty', '-m', 'init');
    g('checkout', '-q', '-b', 'tarea');
    await writeFile(path.join(dir, 'guía con espacio.md'), 'x', 'utf8');
    g('add', '-A');
    g('commit', '-q', '-m', 'doc');
    assert.equal(rutasDeTarea('no-existe', 'HEAD', ['*.md'], dir), null);
    const r = rutasDeTarea('develop', 'HEAD', ['*.md'], dir);
    assert.deepEqual(r, { todas: ['guía con espacio.md'], fueraDeDocs: [] });
    assert.deepEqual(rutasDeTarea('develop', 'HEAD', ['docs/**'], dir)?.fueraDeDocs, ['guía con espacio.md']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// IMP-1 de la revision: desde una subcarpeta, las rutas y los patrones son de todo el repo.
test('rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rutas-subdir-'));
  const g = (...a: string[]) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
  try {
    g('init', '-q', '-b', 'develop');
    g('config', 'user.email', 't@t');
    g('config', 'user.name', 't');
    g('commit', '-q', '--allow-empty', '-m', 'init');
    g('checkout', '-q', '-b', 'tarea');
    for (const f of ['proj/docs/a.md', 'other/code.ts']) {
      await mkdir(path.dirname(path.join(dir, f)), { recursive: true });
      await writeFile(path.join(dir, f), 'x', 'utf8');
    }
    g('add', '-A');
    g('commit', '-q', '-m', 'cambios');
    const desdeSubcarpeta = rutasDeTarea('develop', 'HEAD', ['proj/docs/**'], path.join(dir, 'proj'));
    assert.deepEqual(desdeSubcarpeta, { todas: ['other/code.ts', 'proj/docs/a.md'], fueraDeDocs: ['other/code.ts'] });
    // Un patron relativo a la subcarpeta no casa: ante la duda, fuera de documentacion.
    assert.deepEqual(rutasDeTarea('develop', 'HEAD', ['docs/**'], path.join(dir, 'proj'))?.fueraDeDocs, ['other/code.ts', 'proj/docs/a.md']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// MEN-4 de la revision.
test('config (TASK-100): un patron que casa con todo se rechaza', () => {
  for (const p of ['"*"', '"**"', '"**/*"', '"**/**"', '"**/"']) {
    assert.throws(
      () => parsearConfig(`comando_verificacion: "npm test"\nrutas_documentacion: [docs/**, ${p}]\n`, 'c.yml'),
      /casa con cualquier fichero/,
      p
    );
  }
  assert.deepEqual(
    parsearConfig('comando_verificacion: "npm test"\nrutas_documentacion: ["*.md", "docs/*"]\n', 'c.yml').rutas_documentacion,
    ['*.md', 'docs/*']
  );
});

// MEN-1 de la revision.
test('anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea', () => {
  const una = anotarVerificacionDocumentacion('## Objetivo\n', '2026-11-10T10:00:00Z', 'npm test', 'solo docs', 'node d.js');
  assert.equal(anotarVerificacionDocumentacion(una, '2026-11-10T10:05:00Z', 'npm test', 'solo docs', 'node d.js'), una);
  assert.notEqual(anotarVerificacionDocumentacion(una, '2026-11-11', 'npm test', 'otro motivo', 'node d.js'), una);
});
