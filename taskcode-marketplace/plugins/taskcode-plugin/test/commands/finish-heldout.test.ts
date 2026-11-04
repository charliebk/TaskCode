/**
 * Puerta de los tests held-out en `taskctl finish` (TASK-073). Repos Git
 * temporales de verdad y los scripts de Git-Flow tal cual. Los held-out se
 * commitean en develop ANTES de crear la rama de la tarea, como manda el
 * flujo. `comando_heldout` es un lanzador de node que vive FUERA del repo: lee
 * HELDOUT_DIR, ejecuta `prueba.cjs` de esa carpeta y deja un testigo en logs/
 * (ignorado por .gitignore en la plantilla de finish), asi que se sabe que se
 * ejecuto y con que carpeta.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
import { carpetasHeldout, EXCLUIR_HELDOUT } from '../../src/core/heldout.js';
import { parsearConfig } from '../../src/core/config.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

const LANZADOR = `
const fs = require('node:fs');
const path = require('node:path');
const dir = process.env.HELDOUT_DIR;
fs.mkdirSync('logs', { recursive: true });
fs.appendFileSync(path.join('logs', 'heldout.txt'), String(dir) + '\\n');
require(path.join(dir, 'prueba.cjs'));
`;

/** El held-out: pasa o falla segun un fichero de desenlace fuera del repo, e imprime una asercion canario. */
function prueba(desenlace: string): string {
  return `
const d = require('node:fs').readFileSync(${JSON.stringify(desenlace)}, 'utf8').trim();
console.log('CANARIO-ASERCION: esperaba 42');
if (d !== 'ok') { console.error('assert.equal(resultado, 42) fallo'); process.exit(1); }
`;
}

interface Ctx {
  repoRoot: string;
  tareasRoot: string;
  desenlace(d: 'ok' | 'ko'): Promise<void>;
  /** Carpetas HELDOUT_DIR con las que se ejecuto el lanzador. */
  ejecuciones(): string[];
}

/**
 * Repo con config, held-out de `id` commiteados en develop (si `conHeldout`) y
 * la tarea en revision en su rama. `config` sustituye a la config por defecto.
 */
async function conHeldout(
  id: string,
  fn: (c: Ctx) => Promise<void>,
  opts: { conHeldout?: boolean; config?: (lanzador: string) => string } = {}
): Promise<void> {
  const fuera = await mkdtemp(path.join(tmpdir(), 'finish-heldout-'));
  const lanzador = path.join(fuera, 'lanzador.cjs').replace(/\\/g, '/');
  const desenlace = path.join(fuera, 'desenlace').replace(/\\/g, '/');
  await writeFile(lanzador, LANZADOR, 'utf8');
  await writeFile(desenlace, 'ok', 'utf8');
  try {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      const config = opts.config ? opts.config(lanzador) : `comando_heldout: "node ${lanzador}"\n`;
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
      if (opts.conHeldout !== false) {
        const dir = path.join(tareasRoot, '01-en-diseno', id, 'aceptacion');
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, 'prueba.cjs'), prueba(desenlace), 'utf8');
      }
      commitAll(repoRoot, 'docs: held-out escritos por la persona en el diseno');
      const ctx: Ctx = {
        repoRoot,
        tareasRoot,
        desenlace: (d) => writeFile(desenlace, d, 'utf8'),
        ejecuciones: () => {
          const f = path.join(repoRoot, 'logs', 'heldout.txt');
          return existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter((l) => l !== '') : [];
        },
      };
      await fn(ctx);
    });
  } finally {
    await rm(fuera, { recursive: true, force: true });
  }
}

const finish = (c: Ctx, argv: string[]) =>
  runFinishCommand(c.tareasRoot, argv, '2026-11-04', { repoCwd: c.repoRoot, scriptsDir: SCRIPTS_DIR });

const integrada = (rama: string, cwd: string) =>
  spawnSync('git', ['merge-base', '--is-ancestor', rama, 'develop'], { cwd }).status === 0;

test('heldout: carpetasHeldout encuentra la carpeta de la tarea en cualquier estado y nada mas', () => {
  const rutas = [
    'tareas/01-en-diseno/TASK-730/aceptacion/a.cjs',
    'tareas/01-en-diseno/TASK-730/aceptacion/sub/b.cjs',
    'tareas/03-en-revision/TASK-730/aceptacion/a.cjs',
    'tareas/01-en-diseno/TASK-730/tarea.md',
    'tareas/01-en-diseno/TASK-7300/aceptacion/x.cjs',
    'tareas/01-en-diseno/TASK-731/aceptacion/x.cjs',
    'tareas/01-en-diseno/TASK-730/aceptacionX/x.cjs',
  ];
  assert.deepEqual(carpetasHeldout(rutas, 'TASK-730'), [
    'tareas/01-en-diseno/TASK-730/aceptacion',
    'tareas/03-en-revision/TASK-730/aceptacion',
  ]);
  assert.deepEqual(carpetasHeldout(rutas, 'TASK-999'), []);
  assert.equal(EXCLUIR_HELDOUT, 'tareas/*/TASK-*/aceptacion/**');
});

test('heldout: comando_heldout es una clave conocida, null por defecto y no admite vacio', () => {
  assert.equal(parsearConfig('limite_wip: 1\n', 'c.yml').comando_heldout, null);
  assert.equal(parsearConfig('comando_heldout: "npm run aceptacion"\n', 'c.yml').comando_heldout, 'npm run aceptacion');
  assert.throws(() => parsearConfig('comando_heldout: ""\n', 'c.yml'), /comando_heldout/);
});

test('heldout: en verde se ejecutan con HELDOUT_DIR de la tarea y se mergea', async () => {
  await conHeldout('TASK-730', async (c) => {
    const task = sampleTask({ id: 'TASK-730' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    const r = await finish(c, ['TASK-730']);
    assert.equal(r.cierre, 'terminada');
    const ej = c.ejecuciones();
    assert.equal(ej.length, 1);
    assert.match(ej[0] ?? '', /[/\\]tareas[/\\]01-en-diseno[/\\]TASK-730[/\\]aceptacion$/);
    assert.ok(integrada(task.rama, c.repoRoot));
  });
});

test('heldout: en rojo aborta sin merge y SIN mostrar la salida de los tests', async () => {
  await conHeldout('TASK-731', async (c) => {
    const task = sampleTask({ id: 'TASK-731' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    await c.desenlace('ko');
    const developAntes = git(['rev-parse', 'develop'], c.repoRoot).trim();
    await assert.rejects(
      () => finish(c, ['TASK-731']),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match(e.message, /los tests held-out no estan en verde; no se mergea/);
        assert.match(e.message, /Comando: {3}node /);
        assert.match(e.message, /codigo 1|1/);
        assert.doesNotMatch(e.message, /CANARIO-ASERCION/, 'la salida revelaria el test');
        assert.doesNotMatch(e.message, /assert\.equal/);
        return true;
      }
    );
    assert.equal(c.ejecuciones().length, 1);
    assert.equal(git(['rev-parse', 'develop'], c.repoRoot).trim(), developAntes);
    assert.equal((await readTareaFile(c.tareasRoot, 'TASK-731'))?.task.estado, 'en-revision');
  });
});

test('heldout: --sin-verificacion no salta los held-out', async () => {
  await conHeldout('TASK-732', async (c) => {
    const task = sampleTask({ id: 'TASK-732' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    await c.desenlace('ko');
    await assert.rejects(() => finish(c, ['TASK-732', '--sin-verificacion']), /held-out no estan en verde/);
    assert.equal(integrada(task.rama, c.repoRoot), false);
  });
});

test('heldout (huella): si la rama edita, borra o añade held-out, aborta sin ejecutarlos', async () => {
  // Edita.
  await conHeldout('TASK-733', async (c) => {
    const task = sampleTask({ id: 'TASK-733' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    await writeFile(path.join(c.tareasRoot, '01-en-diseno', 'TASK-733', 'aceptacion', 'prueba.cjs'), '// vacio\n', 'utf8');
    commitAll(c.repoRoot, 'rebajar el test');
    await assert.rejects(() => finish(c, ['TASK-733']), /no coinciden con los de "develop".*editado, añadido o borrado/s);
    assert.equal(c.ejecuciones().length, 0);
    assert.equal(integrada(task.rama, c.repoRoot), false);
  });
  // Borra.
  await conHeldout('TASK-734', async (c) => {
    const task = sampleTask({ id: 'TASK-734' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    git(['rm', '-q', '-r', 'tareas/01-en-diseno/TASK-734/aceptacion'], c.repoRoot);
    git(['commit', '-q', '-m', 'borrar'], c.repoRoot);
    await assert.rejects(() => finish(c, ['TASK-734']), /no coinciden con los de "develop"/);
  });
  // Añade un fichero mas.
  await conHeldout('TASK-735', async (c) => {
    const task = sampleTask({ id: 'TASK-735' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    await writeFile(path.join(c.tareasRoot, '01-en-diseno', 'TASK-735', 'aceptacion', 'otro.cjs'), '1\n', 'utf8');
    commitAll(c.repoRoot, 'anadir');
    await assert.rejects(() => finish(c, ['TASK-735']), /no coinciden/);
  });
  // La rama los crea y develop no los tiene.
  await conHeldout(
    'TASK-736',
    async (c) => {
      const task = sampleTask({ id: 'TASK-736' });
      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
      const dir = path.join(c.tareasRoot, '03-en-revision', 'TASK-736', 'aceptacion');
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, 'prueba.cjs'), '1\n', 'utf8');
      commitAll(c.repoRoot, 'held-out propios');
      await assert.rejects(() => finish(c, ['TASK-736']), /no estan en "develop".*no puede añadirlos/s);
    },
    { conHeldout: false }
  );
});

test('heldout: con held-out y sin comando_heldout aborta (no se mergea creyendo que hubo freno)', async () => {
  await conHeldout(
    'TASK-737',
    async (c) => {
      const task = sampleTask({ id: 'TASK-737' });
      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
      await assert.rejects(() => finish(c, ['TASK-737']), /no declara\s+comando_heldout/);
      assert.equal(integrada(task.rama, c.repoRoot), false);
    },
    { config: () => 'rama_base: develop\n' }
  );
});

test('heldout: sin carpeta aceptacion/ no hay puerta, aunque haya comando; la de otra tarea no cuenta', async () => {
  await conHeldout(
    'TASK-799',
    async (c) => {
      // develop tiene held-out de OTRA tarea, y fallarian.
      await c.desenlace('ko');
      const task = sampleTask({ id: 'TASK-738' });
      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
      const r = await finish(c, ['TASK-738']);
      assert.equal(r.cierre, 'terminada');
      assert.equal(c.ejecuciones().length, 0);
    }
  );
});

test('heldout: la skill de flujo enlaza heldout.md, que explica cuando escribirlos, que el revisor no los lee y que van fuera de la verificacion', () => {
  const dir = path.join(import.meta.dirname, '..', '..', '..', 'skills', 'task-workflow');
  const skill = readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  assert.match(skill, /\*\*Tests held-out \(`aceptacion\/`\)\.\*\*[\s\S]*\[heldout\.md\]\(heldout\.md\)/);
  const ref = readFileSync(path.join(dir, 'heldout.md'), 'utf8');
  for (const marca of [/aceptacion\//, /comando_heldout/, /HELDOUT_DIR/, /durante el\s+diseno/, /antes de `start`/, /revisor por pares no los lee/, /fuera de\s+`comando_verificacion`/, /no los leas ni los edites/i]) {
    assert.match(ref, marca);
  }
  assert.doesNotMatch(ref, /TaskCode/);
});
