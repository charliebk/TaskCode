/**
 * TASK-040: `taskctl review` para la ronda 2 y siguientes. Repos Git
 * temporales reales y los scripts de Git-Flow del repo; la evidencia se
 * lee de la peticion que escribe el comando y de `git log`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile } from '../../src/fs/task-store.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { runStartCommand } from '../../src/commands/start.js';
import { runVeredictoCommand } from '../../src/commands/veredicto.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import {
  commitRevisadoDe,
  hallazgosNoCerrados,
  veredictoDe,
  veredictoDeRonda,
} from '../../src/core/informe-revision.js';
import type { Task } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}

function commitAll(repo: string, msg: string): void {
  git(['add', '-A'], repo);
  git(['commit', '-q', '-m', msg], repo);
}

const TASK: Task = {
  id: 'TASK-950',
  titulo: 'Prueba de revision incremental',
  tipo: 'feature',
  sprint: 4,
  etiquetas: ['cli'],
  complejidad: 'media',
  modelo_sugerido: 'sonnet',
  estado: 'en-curso',
  plan_aprobado: true,
  rama: 'feature/task-950-incremental',
  asignado_a: null,
  agente_revisor: 'general-purpose',
  skills_recomendados: [],
  regla_seleccion_skill: null,
  ultimo_commit_revisado: null,
  revision_codex: false,
  creado: '2026-10-04',
  actualizado: '2026-10-04',
  dependencias: [],
};

const INFORME_R1 = (veredicto: string): string =>
  '# Informe de revision — TASK-950 (ronda 1)\n\n- Commit revisado: x\n' +
  `- Veredicto: ${veredicto}\n\n## Hallazgos\n\n` +
  '| ID | Severidad | Estado | Fichero |\n|---|---|---|---|\n' +
  '| IMP-1 | IMPORTANTE | abierto | src/a.ts:3 |\n' +
  '| MEN-1 | MENOR | corregido | src/a.ts:9 |\n\nReproduccion...\n';

/**
 * Repo con la tarea revisada en ronda 1 (con el informe dado) y despues
 * un commit de correccion en src/b.ts. develop avanza con otro fichero
 * para comprobar que la ronda 2 NO lo integra.
 */
async function withRonda1(
  informe: string,
  fn: (repo: string, tareas: string, revisionDir: string, commitR1: string) => Promise<void>
): Promise<void> {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-incr-'));
  try {
    git(['init', '-q', '-b', 'main'], repo);
    git(['config', 'user.email', 't@t'], repo);
    git(['config', 'user.name', 't'], repo);
    git(['config', 'core.autocrlf', 'false'], repo);
    await writeFile(path.join(repo, 'README.md'), 'r\n', 'utf8');
    commitAll(repo, 'inicial');
    git(['checkout', '-q', '-b', 'develop'], repo);
    git(['checkout', '-q', '-b', TASK.rama], repo);
    const tareas = path.join(repo, 'tareas');
    await writeTareaFile(tareas, TASK, '## Objetivo\nProbar.\n');
    await mkdir(path.join(repo, 'src'), { recursive: true });
    await writeFile(path.join(repo, 'src', 'a.ts'), 'export const a = 1;\n', 'utf8');
    commitAll(repo, 'feat(TASK-950): trabajo de la ronda 1');
    const deps = { repoCwd: repo, scriptsDir: SCRIPTS_DIR };
    const r1 = await runReviewCommand(tareas, ['TASK-950'], '2026-10-04', deps);
    const revisionDir = path.join(tareas, '03-en-revision', 'TASK-950', 'revision');
    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), informe, 'utf8');
    commitAll(repo, 'docs(TASK-950): informe ronda 1');
    // develop avanza por su cuenta.
    git(['checkout', '-q', 'develop'], repo);
    await writeFile(path.join(repo, 'otra-tarea.txt'), 'ajeno\n', 'utf8');
    commitAll(repo, 'feat: otra tarea en develop');
    git(['checkout', '-q', TASK.rama], repo);
    await writeFile(path.join(repo, 'src', 'b.ts'), 'export const b = 2;\n', 'utf8');
    commitAll(repo, 'fix(TASK-950): correccion de IMP-1');
    await fn(repo, tareas, revisionDir, r1.commitRevisado);
  } finally {
    await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

const DEPS = (repo: string) => ({ repoCwd: repo, scriptsDir: SCRIPTS_DIR });

test('review incremental (TASK-040): ronda 1 -> cambios-solicitados -> correccion -> ronda 2 con solo el delta y los hallazgos abiertos', async () => {
  await withRonda1(INFORME_R1('PENDIENTE'), async (repo, tareas, revisionDir, commitR1) => {
    await runVeredictoCommand(tareas, ['TASK-950', 'cambios-solicitados'], { repoCwd: repo });
    const r2 = await runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo));
    assert.equal(r2.incremental, true);
    assert.equal(r2.ronda, 2);
    assert.equal(r2.desde, commitR1);
    const peticion = await readFile(path.join(revisionDir, 'peticion-revision-2.md'), 'utf8');
    assert.match(peticion, new RegExp(`Revision incremental: solo los cambios desde ${commitR1}`));
    assert.match(peticion, /diff --git a\/src\/b\.ts/, 'la correccion tiene que estar en el delta');
    assert.doesNotMatch(peticion, /diff --git a\/src\/a\.ts/, 'lo ya revisado en la ronda 1 no entra');
    assert.doesNotMatch(peticion, /otra-tarea\.txt/, 'develop no se integra en la ronda 2');
    assert.match(peticion, /\| IMP-1 \| IMPORTANTE \| abierto \| src\/a\.ts:3 \| informe-revision-1\.md \|/);
    assert.doesNotMatch(peticion, /\| MEN-1 \|/, 'un hallazgo corregido no se lista');
    assert.equal(commitRevisadoDe(peticion), r2.commitRevisado);
    assert.ok(existsSync(path.join(revisionDir, 'informe-revision-2.md')));
    // Ni merge de develop ni nada pendiente en el arbol.
    assert.doesNotMatch(git(['log', '--format=%s', '-5'], repo), /update\(feature\)/);
    assert.equal(git(['status', '--porcelain'], repo).trim(), '');
  });
});

test('review incremental (TASK-040, MEN-2 de su revision): con la ronda anterior fragmentada lista los abiertos de TODOS sus informes', async () => {
  await withRonda1(INFORME_R1('cambios-solicitados'), async (repo, tareas, revisionDir) => {
    // Un segundo informe en la misma ronda (otro dominio), aprobado pero
    // con un MENOR abierto.
    await writeFile(
      path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'),
      '# Informe\n\n- Veredicto: aprobada\n\n## Hallazgos\n\n| ID | Severidad | Estado | Fichero |\n' +
        '|---|---|---|---|\n| MEN-9 | MENOR | abierto | src/X.java:4 |\n',
      'utf8'
    );
    commitAll(repo, 'docs: segundo informe de la ronda 1');
    await runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo));
    const peticion = await readFile(path.join(revisionDir, 'peticion-revision-2.md'), 'utf8');
    assert.match(peticion, /\| IMP-1 \|.*\| informe-revision-1\.md \|/);
    assert.match(peticion, /\| MEN-9 \|.*\| informe-revision-1-java-spring-reviewer\.md \|/);
  });
});

test('informe-revision (TASK-040, MEN-1 de su revision): una tabla dentro de un bloque de codigo no es la de hallazgos', () => {
  const informe =
    '## Hallazgos\n\nReproduccion citada:\n\n```\n| ID | Estado |\n|---|---|\n| FALSO | abierto |\n```\n\n' +
    '| ID | Severidad | Estado | Fichero |\n|---|---|---|---|\n| IMP-1 | IMPORTANTE | abierto | a.ts |\n';
  assert.deepEqual(hallazgosNoCerrados(informe).abiertos.map((h) => h.id), ['IMP-1']);
  assert.equal(hallazgosNoCerrados('## Hallazgos\n\n```\n| ID | Estado |\n| X | abierto |\n```\n').tabla, false);
});

test('review incremental (TASK-040): con la ronda aprobada (tambien "aprobada con correcciones") aborta y manda a finish', async () => {
  for (const v of ['aprobada', 'aprobada con correcciones']) {
    await withRonda1(INFORME_R1(v), async (repo, tareas) => {
      await assert.rejects(
        runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo)),
        (e: unknown) => e instanceof StateMachineError && /taskctl finish/.test(e.message)
      );
    });
  }
});

test('review incremental (TASK-040): con la ronda PENDIENTE o con un veredicto desconocido aborta y manda a taskctl veredicto', async () => {
  for (const v of ['PENDIENTE', 'lo pienso']) {
    await withRonda1(INFORME_R1(v), async (repo, tareas) => {
      await assert.rejects(
        runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo)),
        (e: unknown) => e instanceof StateMachineError && /taskctl veredicto/.test(e.message)
      );
    });
  }
});

test('review incremental (TASK-040): si el commit de la ronda anterior ya no es antepasado, diff completo con aviso', async () => {
  await withRonda1(INFORME_R1('cambios-solicitados'), async (repo, tareas, revisionDir, commitR1) => {
    // Reescribe la historia: el commit revisado en la ronda 1 deja de ser
    // antepasado de HEAD (como un rebase o un amend).
    git(['reset', '-q', '--soft', `${commitR1}~1`], repo);
    git(['commit', '-q', '-m', 'trabajo reescrito'], repo);
    const r2 = await runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo));
    assert.equal(r2.desde, 'develop');
    assert.match(r2.avisos.join('\n'), /ya no es antepasado de HEAD/);
    const peticion = await readFile(path.join(revisionDir, 'peticion-revision-2.md'), 'utf8');
    assert.match(peticion, /diff --git a\/src\/a\.ts/, 'el diff completo incluye lo de la ronda 1');
  });
});

test('review incremental (TASK-040): start sobre una tarea en revision manda a review, no a plan', async () => {
  await withRonda1(INFORME_R1('cambios-solicitados'), async (repo, tareas) => {
    await assert.rejects(
      runStartCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo)),
      (e: unknown) =>
        e instanceof StateMachineError && /taskctl review/.test(e.message) && !/taskctl plan/.test(e.message)
    );
  });
});

test('review incremental (TASK-040): si una escritura de la ronda falla, no deja ficheros de esa ronda', async (t) => {
  await withRonda1(INFORME_R1('cambios-solicitados'), async (repo, tareas, revisionDir) => {
    // Un fichero con otro case colisiona con el informe de la ronda 2 en
    // un disco que no distingue mayusculas (NTFS, APFS por defecto); en
    // uno que si las distingue no hay colision que provocar asi.
    await writeFile(path.join(revisionDir, 'INFORME-REVISION-2.md'), 'x\n', 'utf8');
    if (!existsSync(path.join(revisionDir, 'informe-revision-2.md'))) {
      t.skip('disco que distingue mayusculas: no se puede provocar la colision');
      return;
    }
    commitAll(repo, 'chore: colision');
    await assert.rejects(runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo)));
    const nombres = await readdir(revisionDir);
    assert.ok(!nombres.includes('peticion-revision-2.md'), `quedo la peticion a medias: ${nombres.join(', ')}`);
  });
});

test('informe-revision (TASK-040): veredictos historicos, tabla ausente, fila de ejemplo y CRLF', () => {
  assert.equal(veredictoDe('- Veredicto: cambios solicitados\n'), 'cambios-solicitados');
  assert.equal(veredictoDe('- Veredicto: **cambios-solicitados**\n'), 'cambios-solicitados');
  assert.equal(veredictoDe('- Veredicto: aprobada con menores documentados\n'), 'aprobada');
  assert.equal(veredictoDe('- Veredicto: PENDIENTE (escribelo)\n'), 'pendiente');
  assert.equal(veredictoDe('sin linea\n'), 'sin-linea');
  assert.equal(veredictoDe('- Veredicto: quizas\n'), 'desconocido');
  assert.equal(veredictoDeRonda(['- Veredicto: aprobada\n', '- Veredicto: cambios-solicitados\n']), 'cambios-solicitados');
  assert.equal(veredictoDeRonda(['- Veredicto: PENDIENTE\n', '- Veredicto: cambios-solicitados\n']), 'pendiente');
  assert.equal(commitRevisadoDe('- Commit revisado (HEAD): 9266966 ("fix...")\n'), '9266966');
  assert.equal(commitRevisadoDe('sin commit\n'), null);
  assert.deepEqual(hallazgosNoCerrados('## Hallazgos\n\nTodo en prosa.\n'), { tabla: false, abiertos: [] });
  const crlf =
    '## Hallazgos\r\n\r\n| ID | Severidad | Estado | Fichero |\r\n|---|---|---|---|\r\n' +
    '| (ej. IMP-1) | x | abierto | y |\r\n| **IMP-2** | IMPORTANTE | Abierto | a.ts |\r\n' +
    '| MEN-3 | MENOR | Aceptado | b.ts |\r\n';
  assert.deepEqual(hallazgosNoCerrados(crlf), {
    tabla: true,
    abiertos: [{ id: 'IMP-2', severidad: 'IMPORTANTE', estado: 'Abierto', fichero: 'a.ts' }],
  });
});
