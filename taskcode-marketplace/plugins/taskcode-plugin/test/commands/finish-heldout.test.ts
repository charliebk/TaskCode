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
if (d === 'ensucia') { require('node:fs').writeFileSync('basura.txt', 'x'); process.exit(0); }
if (d !== 'ok') { console.error('assert.equal(resultado, 42) fallo'); process.exit(1); }
`;
}

interface Ctx {
  repoRoot: string;
  tareasRoot: string;
  desenlace(d: 'ok' | 'ko' | 'ensucia'): Promise<void>;
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

/** Lo que hacen `start` y `review` en el flujo real: la carpeta de la tarea cambia de estado en la rama. */
function moverComoStart(c: Ctx, id: string): string {
  const destino = `tareas/03-en-revision/${id}/aceptacion`;
  git(['mv', `tareas/01-en-diseno/${id}/aceptacion`, destino], c.repoRoot);
  git(['commit', '-q', '-m', `chore(${id}): mover la tarea`], c.repoRoot);
  return destino;
}

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
    await assert.rejects(() => finish(c, ['TASK-733']), /la rama ha editado, añadido o borrado los tests held-out/);
    assert.equal(c.ejecuciones().length, 0);
    assert.equal(integrada(task.rama, c.repoRoot), false);
  });
  // Borra.
  await conHeldout('TASK-734', async (c) => {
    const task = sampleTask({ id: 'TASK-734' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    git(['rm', '-q', '-r', 'tareas/01-en-diseno/TASK-734/aceptacion'], c.repoRoot);
    git(['commit', '-q', '-m', 'borrar'], c.repoRoot);
    await assert.rejects(() => finish(c, ['TASK-734']), /la rama ha editado, añadido o borrado/);
  });
  // Añade un fichero mas.
  await conHeldout('TASK-735', async (c) => {
    const task = sampleTask({ id: 'TASK-735' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    await writeFile(path.join(c.tareasRoot, '01-en-diseno', 'TASK-735', 'aceptacion', 'otro.cjs'), '1\n', 'utf8');
    commitAll(c.repoRoot, 'anadir');
    await assert.rejects(() => finish(c, ['TASK-735']), /la rama ha editado, añadido o borrado/);
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

// ---------------------------------------------------------------------
// Flujo real: la carpeta de la tarea se mueve de estado (IMP-1 y siguientes)
// ---------------------------------------------------------------------

test('heldout (IMP-1): con la carpeta movida como hace start, verde con HELDOUT_DIR en su estado actual', async () => {
  await conHeldout('TASK-740', async (c) => {
    const task = sampleTask({ id: 'TASK-740' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    moverComoStart(c, 'TASK-740');
    const r = await finish(c, ['TASK-740']);
    assert.equal(r.cierre, 'terminada');
    assert.match(c.ejecuciones()[0] ?? '', /[/\\]tareas[/\\]03-en-revision[/\\]TASK-740[/\\]aceptacion$/);
  });
});

test('heldout (IMP-1): si los cambio la base y no la rama, pide integrar la base; tras el merge, verde', async () => {
  await conHeldout('TASK-741', async (c) => {
    const task = sampleTask({ id: 'TASK-741' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    moverComoStart(c, 'TASK-741');
    // La persona corrige el held-out en develop, como manda heldout.md.
    git(['checkout', '-q', 'develop'], c.repoRoot);
    const prueba741 = path.join(c.tareasRoot, '01-en-diseno', 'TASK-741', 'aceptacion', 'prueba.cjs');
    await writeFile(prueba741, `${readFileSync(prueba741, 'utf8')}// corregido por la persona\n`, 'utf8');
    commitAll(c.repoRoot, 'docs: corregir held-out');
    git(['checkout', '-q', task.rama], c.repoRoot);
    await assert.rejects(
      () => finish(c, ['TASK-741']),
      /los tests held-out de "develop" han cambiado desde que nacio la rama, y la rama no los ha tocado: integra "develop" en la rama \(git merge develop\)/
    );
    assert.equal(c.ejecuciones().length, 0);
    git(['merge', '-q', '--no-ff', '-m', 'integrar develop', 'develop'], c.repoRoot);
    const r = await finish(c, ['TASK-741']);
    assert.equal(r.cierre, 'terminada');
    assert.equal(c.ejecuciones().length, 1);
  });
});

test('heldout (IMP-1): si los edita la rama, el remedio del mensaje los restaura en su ruta y deja cerrar', async () => {
  await conHeldout('TASK-742', async (c) => {
    const task = sampleTask({ id: 'TASK-742' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    const destino = moverComoStart(c, 'TASK-742');
    await writeFile(path.join(c.repoRoot, destino, 'prueba.cjs'), '// rebajado\n', 'utf8');
    commitAll(c.repoRoot, 'rebajar el held-out');
    let mensaje = '';
    await assert.rejects(
      () => finish(c, ['TASK-742']),
      (e: unknown) => {
        mensaje = (e as Error).message;
        return /la rama ha editado, añadido o borrado los tests held-out/.test(mensaje);
      }
    );
    const orden = /\n {2}(git rm .*)\n/.exec(mensaje)?.[1];
    assert.ok(orden, `sin remedio en: ${mensaje}`);
    assert.match(orden, new RegExp(`git read-tree --prefix=${destino}/ develop:tareas/01-en-diseno/TASK-742/aceptacion`));
    const r = spawnSync(orden, { cwd: c.repoRoot, shell: true, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const fin = await finish(c, ['TASK-742']);
    assert.equal(fin.cierre, 'terminada');
    assert.equal(c.ejecuciones().length, 1);
  });
});

test('heldout (IMP-2): un verde que ensucia el arbol aborta con mensaje propio', async () => {
  await conHeldout('TASK-743', async (c) => {
    const task = sampleTask({ id: 'TASK-743' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    await c.desenlace('ensucia');
    await assert.rejects(() => finish(c, ['TASK-743']), /salieron en verde pero han dejado cambios en el arbol de trabajo/);
    assert.equal(integrada(task.rama, c.repoRoot), false);
  });
});

test('heldout (IMP-2): fuera de la rama de la tarea no los ejecuta y dice a que rama cambiarse', async () => {
  await conHeldout('TASK-744', async (c) => {
    const task = sampleTask({ id: 'TASK-744' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    git(['checkout', '-q', '-b', 'otra'], c.repoRoot);
    await assert.rejects(() => finish(c, ['TASK-744']), /la rama\s+activa es "otra". Cambiate a "feature\//);
    assert.equal(c.ejecuciones().length, 0);
  });
});

test('heldout (MEN-1): un hotfix compara y ejecuta contra la rama principal, de la que nace', async () => {
  await conHeldout(
    'TASK-745',
    async (c) => {
      const config = readFileSync(path.join(c.repoRoot, '.taskcode', 'config.yml'), 'utf8');
      git(['checkout', '-q', 'main'], c.repoRoot);
      await mkdir(path.join(c.repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
      const dir = path.join(c.tareasRoot, '01-en-diseno', 'TASK-745', 'aceptacion');
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, 'prueba.cjs'), "console.log('ok')\n", 'utf8');
      commitAll(c.repoRoot, 'docs: held-out del hotfix en main');
      git(['checkout', '-q', 'develop'], c.repoRoot);
      git(['merge', '-q', '--no-ff', '-m', 'main a develop', 'main'], c.repoRoot);
      const task = sampleTask({ id: 'TASK-745', tipo: 'hotfix', rama: 'hotfix/task-745-arreglo' });
      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task, { base: 'main' });
      const r = await finish(c, ['TASK-745']);
      assert.equal(r.cierre, 'terminada');
      assert.equal(c.ejecuciones().length, 1);
    },
    { conHeldout: false }
  );
});

test('heldout (MEN-2): la rama no puede cambiar comando_heldout: se usa el de la rama base', async () => {
  await conHeldout('TASK-746', async (c) => {
    const task = sampleTask({ id: 'TASK-746' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    await writeFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), 'comando_heldout: "node -e 0"\n', 'utf8');
    commitAll(c.repoRoot, 'neutralizar');
    await c.desenlace('ko');
    await assert.rejects(() => finish(c, ['TASK-746']), /los tests held-out no estan en verde/);
    assert.equal(c.ejecuciones().length, 1, 'se ejecuto el comando de develop, no el de la rama');
  });
});

test('heldout (MEN-3): una carpeta Aceptacion/ con otras mayusculas aborta en vez de ignorarse', async () => {
  await conHeldout(
    'TASK-747',
    async (c) => {
      git(['checkout', '-q', 'develop'], c.repoRoot);
      const dir = path.join(c.tareasRoot, '01-en-diseno', 'TASK-747', 'Aceptacion');
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, 'prueba.cjs'), 'process.exit(1)\n', 'utf8');
      commitAll(c.repoRoot, 'held-out mal nombrados');
      const task = sampleTask({ id: 'TASK-747' });
      await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
      await assert.rejects(() => finish(c, ['TASK-747']), /Aceptacion no se llama exactamente "aceptacion"/);
      assert.equal(integrada(task.rama, c.repoRoot), false);
    },
    { conHeldout: false }
  );
});

test('heldout (MEN-4): timeout_verificacion vale con comando_heldout aunque no haya comando_verificacion', () => {
  const c = parsearConfig('comando_heldout: "npm run aceptacion"\ntimeout_verificacion: 120\n', 'c.yml');
  assert.equal(c.timeout_verificacion, 120);
  assert.throws(() => parsearConfig('timeout_verificacion: 120\n', 'c.yml'), /ni "comando_heldout"/);
});
