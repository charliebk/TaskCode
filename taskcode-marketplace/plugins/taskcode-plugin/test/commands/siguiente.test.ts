/**
 * `taskctl siguiente`, `taskctl pausa` y `approve --decidido-por` (TASK-056).
 * Repos Git temporales reales, el CLI real por spawn para siguiente, pausa,
 * approve y veredicto, y las funciones run*Command para el resto.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runNewCommand } from '../../src/commands/new.js';
import { runPlanCommand } from '../../src/commands/plan.js';
import { runStartCommand } from '../../src/commands/start.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { leerTransiciones } from '../../src/core/transiciones.js';
import type { Task } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
const SCRIPTS_DIR = path.join(PLUGIN_ROOT, 'scripts', 'gitflow');
const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
const HOY = '2026-10-04';

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', message], repoRoot);
}

function cli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

function cliOk(cwd: string, args: string[]) {
  const r = cli(cwd, args);
  assert.equal(r.status, 0, `taskctl ${args.join(' ')} fallo: ${r.stderr}${r.stdout}`);
  return r;
}

function siguiente(cwd: string, id: string): Record<string, unknown> {
  return JSON.parse(cliOk(cwd, ['siguiente', id, '--json']).stdout) as Record<string, unknown>;
}

/** Repo con main y develop; el config (si lo hay) se commitea antes de crear develop. */
async function withRepo(
  config: string | null,
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-siguiente-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    if (config !== null) {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
    }
    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot, path.join(repoRoot, 'tareas'));
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

const PLAN_REDACTADO =
  '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt y comprobar el flujo guiado.\n';

async function nuevaTarea(repoRoot: string, tareasRoot: string): Promise<string> {
  const creada = await runNewCommand(
    tareasRoot,
    [
      '--titulo',
      'Flujo guiado',
      '--tipo',
      'feature',
      '--complejidad',
      'simple',
      '--objetivo',
      'Probar siguiente de punta a punta.',
      '--criterio',
      'La tarea queda en 04-terminadas',
    ],
    HOY,
    { repoCwd: repoRoot }
  );
  return creada.id;
}

async function planificar(repoRoot: string, tareasRoot: string, id: string): Promise<void> {
  await runPlanCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot });
  await writeFile(
    path.join(tareasRoot, '01-en-diseno', id, 'planificacion', 'plan-final.md'),
    PLAN_REDACTADO,
    'utf8'
  );
  commitAll(repoRoot, `docs(${id}): plan final`);
}

async function filas(tareasRoot: string, id: string) {
  const t = await readTareaFile(tareasRoot, id);
  assert.ok(t, `tarea ${id} no encontrada`);
  return leerTransiciones(t.body);
}

test('ciclo feature completo en semiautomatico: siguiente guia cada fase', async () => {
  await withRepo('modo_flujo: semiautomatico\n', async (repoRoot, tareasRoot) => {
    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
    const id = await nuevaTarea(repoRoot, tareasRoot);

    let s = siguiente(repoRoot, id);
    assert.equal(s.id, id);
    assert.equal(s.estado, 'planificada');
    assert.equal(s.fase, 'plan');
    assert.equal(s.comando, `taskctl plan ${id}`);
    assert.equal(s.leidaDe, 'working-tree');
    assert.equal(s.accion, 'preguntar');

    await planificar(repoRoot, tareasRoot, id);
    s = siguiente(repoRoot, id);
    assert.deepEqual(
      [s.estado, s.modo, s.fase, s.comando, s.accion, s.leidaDe],
      ['en-diseno', 'semiautomatico', 'approve', `taskctl approve ${id}`, 'preguntar', 'working-tree']
    );

    cliOk(repoRoot, ['approve', id]);
    s = siguiente(repoRoot, id);
    assert.deepEqual(
      [s.estado, s.modo, s.fase, s.comando, s.accion],
      ['en-diseno', 'semiautomatico', 'start', `taskctl start ${id}`, 'preguntar']
    );

    await runStartCommand(tareasRoot, [id], HOY, deps);
    await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
    commitAll(repoRoot, `feat(${id}): trabajo`);
    s = siguiente(repoRoot, id);
    assert.deepEqual(
      [s.estado, s.modo, s.fase, s.comando, s.accion, s.leidaDe],
      ['en-curso', 'semiautomatico', 'review', `taskctl review ${id}`, 'detener', 'working-tree']
    );

    await runReviewCommand(tareasRoot, [id], HOY, deps);
    s = siguiente(repoRoot, id);
    assert.equal(s.estado, 'en-revision');
    assert.equal(s.fase, 'veredicto');
    assert.equal(s.modo, 'semiautomatico');
    assert.equal(s.accion, 'continuar');
    assert.match(s.comando as string, new RegExp(`^taskctl veredicto ${id} `));

    cliOk(repoRoot, ['veredicto', id, 'aprobada']);
    s = siguiente(repoRoot, id);
    assert.deepEqual(
      [s.estado, s.modo, s.fase, s.comando, s.accion],
      ['en-revision', 'semiautomatico', 'finish', `taskctl finish ${id}`, 'preguntar']
    );

    await runFinishCommand(tareasRoot, [id], HOY, deps);
    s = siguiente(repoRoot, id);
    assert.deepEqual([s.estado, s.fase, s.comando, s.accion], ['terminada', 'terminada', null, 'detener']);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'siguiente no ensucia nada');

    // 2. Una fila por transicion, en orden y con el modo congelado.
    const rows = await filas(tareasRoot, id);
    assert.deepEqual(
      rows.map((r) => r.fase),
      ['plan', 'approve', 'start', 'review', 'finish']
    );
    assert.ok(rows.every((r) => r.modo === 'semiautomatico' && r.decidido_por === 'persona'));

    // Cada fila entro en el mismo commit que su transicion: el commit que
    // anade la fila tambien mueve/toca la tarea en la carpeta de su estado.
    const carpeta: Record<string, string> = {
      plan: '01-en-diseno',
      approve: '01-en-diseno',
      start: '02-en-curso',
      review: '03-en-revision',
    };
    for (const fase of ['plan', 'approve', 'start', 'review']) {
      const shas = git(
        ['log', '--all', '--format=%H', '-S', `| ${fase} | semiautomatico | persona |`],
        repoRoot
      )
        .split('\n')
        .filter(Boolean);
      assert.ok(shas.length >= 1, `ningun commit anade la fila ${fase}`);
      // El primero en el tiempo es el ultimo de la lista (log va de nuevo a viejo).
      const sha = shas[shas.length - 1] as string;
      const stat = git(['show', '--format=%s', '--name-only', sha], repoRoot);
      assert.ok(stat.includes(`${carpeta[fase]}/${id}/tarea.md`), `fila ${fase}: commit sin tarea.md en ${carpeta[fase]}:\n${stat}`);
    }
  });
});

test('siguiente desde develop con la tarea en su rama lee de la rama y da la misma fase', async () => {
  await withRepo('modo_flujo: semiautomatico\n', async (repoRoot, tareasRoot) => {
    const id = await nuevaTarea(repoRoot, tareasRoot);
    await planificar(repoRoot, tareasRoot, id);
    cliOk(repoRoot, ['approve', id]);
    await runStartCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
    commitAll(repoRoot, `feat(${id}): trabajo`);

    const desdeRama = siguiente(repoRoot, id);
    assert.equal(desdeRama.leidaDe, 'working-tree');
    git(['checkout', '-q', 'develop'], repoRoot);
    const desdeDevelop = siguiente(repoRoot, id);
    assert.equal(desdeDevelop.leidaDe, 'rama');
    assert.equal(desdeDevelop.fase, desdeRama.fase);
    assert.equal(desdeDevelop.estado, desdeRama.estado);
    assert.equal(desdeDevelop.accion, desdeRama.accion);
    assert.equal(desdeDevelop.modo, desdeRama.modo);
    assert.equal(desdeDevelop.fase, 'review');
  });
});

test('errores: tarea inexistente, sin ID y config roto', async () => {
  await withRepo(null, async (repoRoot) => {
    const noExiste = cli(repoRoot, ['siguiente', 'TASK-999']);
    assert.notEqual(noExiste.status, 0);
    const sinId = cli(repoRoot, ['siguiente']);
    assert.notEqual(sinId.status, 0);
  });
  await withRepo('modo_flujo: auto\n', async (repoRoot) => {
    const r = cli(repoRoot, ['siguiente', 'TASK-001']);
    assert.notEqual(r.status, 0);
    for (const v of ['manual', 'semiautomatico', 'automatico']) {
      assert.ok(r.stderr.includes(v), `stderr debe listar ${v}: ${r.stderr}`);
    }
  });
});

test('approve --decidido-por automatico con la tarea planificada en manual: rechazado y sin tocar nada', async () => {
  await withRepo(null, async (repoRoot, tareasRoot) => {
    const id = await nuevaTarea(repoRoot, tareasRoot);
    await planificar(repoRoot, tareasRoot, id);
    const antes = git(['rev-parse', 'HEAD'], repoRoot);
    const r = cli(repoRoot, ['approve', id, '--decidido-por', 'automatico']);
    assert.notEqual(r.status, 0);
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), antes);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
    assert.equal((await readTareaFile(tareasRoot, id))?.task.plan_aprobado, false);

    // La forma --decidido-por=valor pasa por la misma guarda (MEN-2 de la revision).
    const conIgual = cli(repoRoot, ['approve', id, '--decidido-por=automatico']);
    assert.notEqual(conIgual.status, 0);
    assert.match(conIgual.stderr, /no se puede aprobar como automatico/);
    assert.equal((await readTareaFile(tareasRoot, id))?.task.plan_aprobado, false);

    // Sin valor: tambien falla y no aprueba.
    const sinValor = cli(repoRoot, ['approve', id, '--decidido-por']);
    assert.notEqual(sinValor.status, 0);
    assert.equal((await readTareaFile(tareasRoot, id))?.task.plan_aprobado, false);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('approve automatico usa el modo congelado en plan, no el del config actual', async () => {
  await withRepo('modo_flujo: automatico\n', async (repoRoot, tareasRoot) => {
    const id = await nuevaTarea(repoRoot, tareasRoot);
    await planificar(repoRoot, tareasRoot, id);
    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'modo_flujo: manual\n', 'utf8');
    commitAll(repoRoot, 'config a manual');

    cliOk(repoRoot, ['approve', id, '--decidido-por', 'automatico']);
    const rows = await filas(tareasRoot, id);
    const approve = rows.find((f) => f.fase === 'approve');
    assert.equal(approve?.modo, 'automatico');
    assert.equal(approve?.decidido_por, 'automatico');
    assert.equal((await readTareaFile(tareasRoot, id))?.task.plan_aprobado, true);
    // siguiente sigue con el modo congelado aunque el config diga manual.
    assert.equal(siguiente(repoRoot, id).modo, 'automatico');
  });
});

test('pausa en en-diseno: fila pausa de persona, commit propio y estado intacto', async () => {
  await withRepo('modo_flujo: semiautomatico\n', async (repoRoot, tareasRoot) => {
    const id = await nuevaTarea(repoRoot, tareasRoot);
    await planificar(repoRoot, tareasRoot, id);
    const antes = git(['rev-parse', 'HEAD'], repoRoot).trim();
    cliOk(repoRoot, ['pausa', id]);
    assert.equal(git(['rev-list', '--count', `${antes}..HEAD`], repoRoot).trim(), '1');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
    const t = await readTareaFile(tareasRoot, id);
    assert.equal(t?.task.estado, 'en-diseno');
    assert.equal(t?.task.plan_aprobado, false);
    const rows = leerTransiciones((t as NonNullable<typeof t>).body);
    assert.deepEqual(
      rows.map((r) => [r.fase, r.decidido_por]),
      [
        ['plan', 'persona'],
        ['pausa', 'persona'],
      ]
    );
    assert.equal(siguiente(repoRoot, id).fase, 'approve');
  });
});

test('pausa con ediciones sin commitear en la carpeta de la tarea: aborta sin llevarselas (MEN-5)', async () => {
  await withRepo(null, async (repoRoot, tareasRoot) => {
    const id = await nuevaTarea(repoRoot, tareasRoot);
    await planificar(repoRoot, tareasRoot, id);
    const tareaPath = path.join(tareasRoot, '01-en-diseno', id, 'tarea.md');
    await writeFile(tareaPath, (await readFile(tareaPath, 'utf8')) + '\nnota a medias\n', 'utf8');
    const antes = git(['rev-parse', 'HEAD'], repoRoot);

    const r = cli(repoRoot, ['pausa', id]);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /cambios sin commitear/);
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), antes, 'no hay commit de pausa');
    assert.match(await readFile(tareaPath, 'utf8'), /nota a medias/, 'la edicion sigue ahi');
  });
});

/**
 * Tarea en revision en su rama, con la ronda 1 fragmentada por dominio
 * (informe-revision-1-dom1.md y -dom2.md, sin el de la ronda entera) y,
 * opcionalmente, revision_codex. Deja el repo en la rama de la tarea.
 */
async function enRevisionFragmentada(repoRoot: string, tareasRoot: string): Promise<{ id: string; rama: string }> {
  const id = await nuevaTarea(repoRoot, tareasRoot);
  await planificar(repoRoot, tareasRoot, id);
  cliOk(repoRoot, ['approve', id]);
  await runStartCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
  await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
  commitAll(repoRoot, `feat(${id}): trabajo`);
  await runReviewCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
  const rama = git(['branch', '--show-current'], repoRoot).trim();
  const revisionDir = path.join(tareasRoot, '03-en-revision', id, 'revision');
  git(['rm', '-q', path.join(revisionDir, 'informe-revision-1.md')], repoRoot);
  commitAll(repoRoot, `chore(${id}): ronda fragmentada`);
  return { id, rama };
}

test('siguiente desde develop con la tarea en revision en su rama: ronda fragmentada y segunda opinion leidas de la rama (IMP-3)', async () => {
  await withRepo('modo_flujo: semiautomatico\n', async (repoRoot, tareasRoot) => {
    const { id, rama } = await enRevisionFragmentada(repoRoot, tareasRoot);
    const revisionDir = path.join(tareasRoot, '03-en-revision', id, 'revision');

    /** Escribe en la rama, commitea y pregunta a siguiente DESDE develop. */
    const desdeDevelop = async (ficheros: Record<string, string>): Promise<Record<string, unknown>> => {
      git(['checkout', '-q', rama], repoRoot);
      for (const [nombre, contenido] of Object.entries(ficheros)) {
        await writeFile(path.join(revisionDir, nombre), contenido, 'utf8');
      }
      commitAll(repoRoot, 'informes');
      git(['checkout', '-q', 'develop'], repoRoot);
      const s = siguiente(repoRoot, id);
      assert.equal(s.leidaDe, 'rama');
      return s;
    };

    // Un dominio aprobado y otro pendiente: falta un revisor (no basta el primero).
    let s = await desdeDevelop({
      'informe-revision-1-dom1.md': '- Veredicto: aprobada\n',
      'informe-revision-1-dom2.md': '- Veredicto: PENDIENTE\n',
    });
    assert.equal(s.fase, 'veredicto');
    // El segundo pide cambios: otra ronda.
    s = await desdeDevelop({ 'informe-revision-1-dom2.md': '- Veredicto: cambios-solicitados\n' });
    assert.equal(s.fase, 'review');
    // Los dos aprobados: finish.
    s = await desdeDevelop({ 'informe-revision-1-dom2.md': '- Veredicto: aprobada\n' });
    assert.equal(s.fase, 'finish');

    // Con revision_codex: sin informe de Codex, codex-review; pendiente, lo decide una persona; aprobado, finish.
    git(['checkout', '-q', rama], repoRoot);
    const t = await readTareaFile(tareasRoot, id);
    assert.ok(t);
    await writeTareaFile(tareasRoot, { ...t.task, revision_codex: true }, t.body, { failIfExists: false });
    commitAll(repoRoot, 'revision_codex');
    git(['checkout', '-q', 'develop'], repoRoot);
    assert.equal(siguiente(repoRoot, id).fase, 'codex-review');
    s = await desdeDevelop({ 'informe-codex-1.md': '- Veredicto: PENDIENTE\n' });
    assert.deepEqual([s.fase, s.accion, s.comando], ['veredicto-codex', 'preguntar', null]);
    s = await desdeDevelop({ 'informe-codex-1.md': '- Veredicto: aprobada\n' });
    assert.equal(s.fase, 'finish');
  });
});

test('pausa desde develop con la tarea en su rama: aborta diciendo a que rama cambiar', async () => {
  await withRepo(null, async (repoRoot, tareasRoot) => {
    const id = await nuevaTarea(repoRoot, tareasRoot);
    await planificar(repoRoot, tareasRoot, id);
    cliOk(repoRoot, ['approve', id]);
    await runStartCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
    commitAll(repoRoot, `feat(${id}): trabajo`);
    const rama = git(['branch', '--show-current'], repoRoot).trim();
    git(['checkout', '-q', 'develop'], repoRoot);
    const antes = git(['rev-parse', 'HEAD'], repoRoot);

    const r = cli(repoRoot, ['pausa', id]);
    assert.notEqual(r.status, 0);
    assert.ok(r.stderr.includes(rama), `debe nombrar la rama ${rama}: ${r.stderr}`);
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), antes);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('hotfix en automatico con revision aprobada: finish sigue siendo preguntar', async () => {
  await withRepo('modo_flujo: automatico\n', async (repoRoot, tareasRoot) => {
    // Los hotfix nacen de main (que ya tiene el config).
    const id = 'TASK-957';
    const rama = 'hotfix/task-957-urgente';
    git(['checkout', '-q', '-b', rama, 'main'], repoRoot);
    const task: Task = {
      id,
      titulo: 'Hotfix urgente',
      tipo: 'hotfix',
      sprint: 0,
      etiquetas: [],
      complejidad: 'simple',
      modelo_sugerido: 'sonnet',
      estado: 'en-revision',
      plan_aprobado: true,
      rama,
      asignado_a: null,
      agente_revisor: 'general-purpose',
      skills_recomendados: [],
      regla_seleccion_skill: null,
      ultimo_commit_revisado: null,
      revision_codex: false,
      tokens_diseno: null,
      tokens_implementacion: null,
      tokens_revision: null,
      creado: HOY,
      actualizado: HOY,
      dependencias: [],
    };
    const cuerpo =
      '## Objetivo\nArreglar.\n\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
      `| ${HOY} | plan | automatico | persona |\n`;
    await writeTareaFile(tareasRoot, task, cuerpo);
    const revisionDir = path.join(tareasRoot, '03-en-revision', id, 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(
      path.join(revisionDir, 'informe-revision-1.md'),
      '# Informe\n\n- Veredicto: aprobada\n',
      'utf8'
    );
    commitAll(repoRoot, 'hotfix revisado');

    const s = siguiente(repoRoot, id);
    assert.deepEqual(
      [s.estado, s.modo, s.fase, s.comando, s.accion],
      ['en-revision', 'automatico', 'finish', `taskctl finish ${id}`, 'preguntar']
    );
  });
});
