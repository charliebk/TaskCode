/**
 * Freno de fin de turno con verificacion proporcional (TASK-102). Repos Git
 * temporales de verdad: una rama base `develop` con `rutas_documentacion` y la
 * rama de una tarea en curso. Los comandos (completa, selectiva y
 * documentacion) son un script de node que vive FUERA del repo, sale en verde
 * y apunta cuantas veces se ejecuto cada uno: asi no ensucia el arbol que el
 * freno clasifica.
 *
 * El numero de procesos git se mide con GIT_TRACE2_EVENT (cada proceso git deja
 * su evento `start`), igual que en test/gitflow/origin-deteccion.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { decidirStop } from '../../src/hooks/freno-stop.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { git, sampleTask } from '../helpers/finish-fixtures.js';

const RAMA = 'feature/task-102-docs';
type Comando = 'completa' | 'selectiva' | 'docs';

const SCRIPT = `
const fs = require('node:fs');
const path = require('node:path');
fs.appendFileSync(path.join(__dirname, 'cuenta-' + process.argv[2]), 'x');
console.log('verde');
`;

interface Repo {
  raiz: string;
  fuera: string;
  ejecuciones(c: Comando): number;
  limpiar(): Promise<void>;
}

interface OpcionesRepo {
  /** Lineas extra de la config (base y rama, salvo que la rama la cambie). */
  config?: (fuera: string) => string;
}

function cmd(fuera: string, c: Comando): string {
  // Sin comillas: la ruta temporal no lleva espacios, y en YAML va entre comillas dobles.
  return `node ${path.join(fuera, 'verif.cjs').split(path.sep).join('/')} ${c}`;
}

function configCompleta(fuera: string, extra = ''): string {
  return (
    `comando_verificacion: "${cmd(fuera, 'completa')}"\n` +
    `comando_verificacion_documentacion: "${cmd(fuera, 'docs')}"\n` +
    'rutas_documentacion: [docs/**]\n' +
    extra
  );
}

async function montar(o: OpcionesRepo = {}): Promise<Repo> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'freno-docs-'));
  const fuera = await mkdtemp(path.join(tmpdir(), 'freno-docs-fuera-'));
  await writeFile(path.join(fuera, 'verif.cjs'), SCRIPT, 'utf8');
  git(['init', '-q', '-b', 'develop'], raiz);
  git(['config', 'user.email', 'test@example.com'], raiz);
  git(['config', 'user.name', 'Test'], raiz);
  git(['config', 'core.autocrlf', 'false'], raiz);
  for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
    await mkdir(path.join(raiz, 'tareas', c), { recursive: true });
    await writeFile(path.join(raiz, 'tareas', c, '.gitkeep'), '', 'utf8');
  }
  const t = sampleTask({ id: 'TASK-102', estado: 'en-curso', rama: RAMA });
  await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-102'), { recursive: true });
  await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-102', 'tarea.md'), serializeTareaFile(t, '## Objetivo\nx\n'), 'utf8');
  await mkdir(path.join(raiz, '.taskcode'));
  await writeFile(path.join(raiz, '.taskcode', 'config.yml'), (o.config ?? configCompleta)(fuera), 'utf8');
  await mkdir(path.join(raiz, 'docs'));
  await mkdir(path.join(raiz, 'src'));
  await writeFile(path.join(raiz, 'docs', 'guia.md'), 'guia\n', 'utf8');
  await writeFile(path.join(raiz, 'src', 'app.ts'), 'export const a = 1;\n', 'utf8');
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', 'inicial'], raiz);
  git(['checkout', '-q', '-b', RAMA], raiz);
  return {
    raiz,
    fuera,
    ejecuciones: (c) => {
      const f = path.join(fuera, `cuenta-${c}`);
      return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
    },
    limpiar: async () => {
      await rm(raiz, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
      await rm(fuera, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
    },
  };
}

async function conRepo(fn: (r: Repo) => Promise<void>, o?: OpcionesRepo): Promise<void> {
  const r = await montar(o);
  try {
    await fn(r);
  } finally {
    await r.limpiar();
  }
}

function decidir(r: Repo) {
  return decidirStop({ hook_event_name: 'Stop', stop_hook_active: false, cwd: r.raiz }, { env: process.env });
}

async function escribirYCommitear(r: Repo, rel: string, texto: string): Promise<void> {
  await writeFile(path.join(r.raiz, rel), texto, 'utf8');
  git(['add', '-A'], r.raiz);
  git(['commit', '-q', '-m', `cambia ${rel}`], r.raiz);
}

function memoDocumentacion(r: Repo): string {
  return path.join(r.raiz, '.git', 'freno-verificacion-documentacion.json');
}

/** Argumentos de cada proceso git que lanzo `fn`, segun GIT_TRACE2_EVENT. */
async function procesosGit(r: Repo, fn: () => Promise<unknown>): Promise<string[][]> {
  const traza = path.join(r.fuera, `traza-${String(Date.now())}.json`);
  const antes = process.env['GIT_TRACE2_EVENT'];
  process.env['GIT_TRACE2_EVENT'] = traza;
  try {
    await fn();
  } finally {
    if (antes === undefined) delete process.env['GIT_TRACE2_EVENT'];
    else process.env['GIT_TRACE2_EVENT'] = antes;
  }
  if (!existsSync(traza)) return [];
  return readFileSync(traza, 'utf8')
    .split('\n')
    .filter((l) => l.includes('"event":"start"'))
    .map((l) => (JSON.parse(l) as { argv: string[] }).argv.slice(1));
}

test('freno (TASK-102): un turno de solo documentacion corre la comprobacion de documentacion y no la suite', async () => {
  await conRepo(async (r) => {
    await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
    const d = await decidir(r);
    assert.equal(d.codigo, 0, d.stderr);
    assert.equal(r.ejecuciones('docs'), 1);
    assert.equal(r.ejecuciones('completa'), 0);
  });
});

test('freno (TASK-102): solo documentacion sin comando de documentacion no corre nada', async () => {
  await conRepo(
    async (r) => {
      await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
      const d = await decidir(r);
      assert.equal(d.codigo, 0, d.stderr);
      assert.equal(r.ejecuciones('completa'), 0);
      assert.equal(r.ejecuciones('docs'), 0);
    },
    { config: (f) => `comando_verificacion: "${cmd(f, 'completa')}"\nrutas_documentacion: [docs/**]\n` }
  );
});

test('freno (TASK-102): documentacion sin commitear todavia, sin commits en la rama, cuenta como solo documentacion', async () => {
  await conRepo(async (r) => {
    await writeFile(path.join(r.raiz, 'docs', 'nueva.md'), 'nueva\n', 'utf8');
    const d = await decidir(r);
    assert.equal(d.codigo, 0, d.stderr);
    assert.equal(r.ejecuciones('docs'), 1);
    assert.equal(r.ejecuciones('completa'), 0);
  });
});

test('freno (TASK-102): un fichero de codigo modificado sin commitear aplica la verificacion de siempre', async () => {
  await conRepo(async (r) => {
    await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
    await writeFile(path.join(r.raiz, 'src', 'app.ts'), 'export const a = 2;\n', 'utf8');
    const d = await decidir(r);
    assert.equal(d.codigo, 0, d.stderr);
    assert.equal(r.ejecuciones('completa'), 1);
    assert.equal(r.ejecuciones('docs'), 0);
  });
});

test('freno (TASK-102): un fichero de codigo preparado (git add) sin commitear aplica la verificacion de siempre', async () => {
  await conRepo(async (r) => {
    await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
    await writeFile(path.join(r.raiz, 'src', 'app.ts'), 'export const a = 3;\n', 'utf8');
    git(['add', 'src/app.ts'], r.raiz);
    await decidir(r);
    assert.equal(r.ejecuciones('completa'), 1);
    assert.equal(r.ejecuciones('docs'), 0);
  });
});

test('freno (TASK-102): un fichero de codigo sin seguimiento aplica la verificacion de siempre', async () => {
  await conRepo(async (r) => {
    await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
    await writeFile(path.join(r.raiz, 'src', 'nuevo.ts'), 'export const n = 1;\n', 'utf8');
    const d = await decidir(r);
    assert.equal(d.codigo, 0, d.stderr);
    assert.equal(r.ejecuciones('completa'), 1);
    assert.equal(r.ejecuciones('docs'), 0);
  });
});

test('freno (TASK-102): un commit de codigo en la rama aplica la verificacion de siempre', async () => {
  await conRepo(async (r) => {
    await escribirYCommitear(r, 'src/app.ts', 'export const a = 4;\n');
    await decidir(r);
    assert.equal(r.ejecuciones('completa'), 1);
    assert.equal(r.ejecuciones('docs'), 0);
  });
});

test('freno (TASK-102): con la selectiva declarada, solo documentacion se decide antes; con codigo, la selectiva', async () => {
  await conRepo(
    async (r) => {
      await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
      await decidir(r);
      assert.equal(r.ejecuciones('docs'), 1);
      assert.equal(r.ejecuciones('selectiva'), 0);
      assert.equal(r.ejecuciones('completa'), 0);

      await escribirYCommitear(r, 'src/app.ts', 'export const a = 5;\n');
      await decidir(r);
      assert.equal(r.ejecuciones('selectiva'), 1);
      assert.equal(r.ejecuciones('docs'), 1);
      assert.equal(r.ejecuciones('completa'), 0);
    },
    { config: (f) => configCompleta(f, `comando_verificacion_selectiva: "${cmd(f, 'selectiva')}"\n`) }
  );
});

test('freno (TASK-102): sin rutas_documentacion se comporta como en la 0.14.0 y no lanza ningun git nuevo', async () => {
  await conRepo(
    async (r) => {
      await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
      const argvs = await procesosGit(r, async () => {
        const d = await decidir(r);
        assert.equal(d.codigo, 0, d.stderr);
      });
      // La completa, aunque solo cambie documentacion: lo de la 0.14.0.
      assert.equal(r.ejecuciones('completa'), 1);
      assert.equal(r.ejecuciones('docs'), 0);
      assert.ok(argvs.length > 0, 'la traza de git no registro nada: el test no mediria');
      const nuevos = argvs.filter(
        (a) => a.includes('show') || a.includes('ls-files') || a.includes('merge-base') || a.some((x) => x.includes('...'))
      );
      assert.deepEqual(nuevos, [], `procesos git que la 0.14.0 no lanzaba: ${JSON.stringify(nuevos)}`);
      // Los mismos que la 0.14.0: la rama actual y los del memo (rev-parse y status).
      const subcomandos = new Set(argvs.map((a) => a.find((x) => !x.startsWith('-') && !x.includes('=')) ?? ''));
      assert.deepEqual([...subcomandos].sort(), ['branch', 'rev-parse', 'status']);
    },
    { config: (f) => `comando_verificacion: "${cmd(f, 'completa')}"\n` }
  );
});

test('freno (TASK-102): con el arbol sucio corre la comprobacion de documentacion pero no guarda su memo; limpio, si', async () => {
  await conRepo(async (r) => {
    await writeFile(path.join(r.raiz, 'docs', 'guia.md'), 'sin commitear\n', 'utf8');
    await decidir(r);
    assert.equal(r.ejecuciones('docs'), 1);
    assert.equal(existsSync(memoDocumentacion(r)), false, 'con el arbol sucio no se escribe el memo compartido');

    git(['add', '-A'], r.raiz);
    git(['commit', '-q', '-m', 'docs'], r.raiz);
    await decidir(r);
    assert.equal(r.ejecuciones('docs'), 2);
    assert.equal(existsSync(memoDocumentacion(r)), true, 'con el arbol limpio el memo se guarda, como en finish');
    // Mismo commit, arbol limpio: el memo sirve y no se vuelve a ejecutar.
    await decidir(r);
    assert.equal(r.ejecuciones('docs'), 2);
  });
});

test('freno (TASK-102): una config de la base invalida no bloquea: la verificacion de siempre con un aviso', async () => {
  await conRepo(async (r) => {
    // La base queda con una config invalida; la rama la arregla (y por eso cambia la config).
    git(['checkout', '-q', 'develop'], r.raiz);
    await escribirYCommitear(r, '.taskcode/config.yml', 'timeout_verificacion: "mucho"\n');
    git(['checkout', '-q', RAMA], r.raiz);
    await escribirYCommitear(r, 'docs/guia.md', 'guia ampliada\n');
    const d = await decidir(r);
    assert.equal(d.codigo, 0, d.stderr);
    assert.match(d.stderr, /no es valida/);
    assert.equal(r.ejecuciones('completa'), 1);
    assert.equal(r.ejecuciones('docs'), 0);
  });
});
