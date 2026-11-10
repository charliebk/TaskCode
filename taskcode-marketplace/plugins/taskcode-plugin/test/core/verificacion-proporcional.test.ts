/** TASK-100: decision unica de la verificacion proporcional, config y anotacion (puros). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
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
  assert.match(dos, /- 2026-11-11: solo docs; no se ejecuta `npm 'x'`, se ejecuta `node d\.js`/);
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
