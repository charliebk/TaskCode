/**
 * TASK-036: `taskctl veredicto`, el parser tolerante al enfasis y el
 * helper unico de rondas. Repos Git temporales reales; la evidencia se
 * lee del fichero y de `git log`, no de lo que devuelve la funcion.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeTareaFile } from '../../src/fs/task-store.js';
import {
  runVeredictoCommand,
  sustituirVeredicto,
  VeredictoCommandError,
} from '../../src/commands/veredicto.js';
import { veredictoAprobado } from '../../src/commands/finish.js';
import { informeTemplate } from '../../src/commands/review.js';
import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../../src/fs/rondas.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
  return r.stdout;
}

const TASK: Task = {
  id: 'TASK-940',
  titulo: 'Prueba de veredicto',
  tipo: 'feature',
  sprint: 2,
  etiquetas: ['cli'],
  complejidad: 'simple',
  modelo_sugerido: 'sonnet',
  estado: 'en-revision',
  plan_aprobado: true,
  rama: 'feature/task-940-veredicto',
  asignado_a: null,
  agente_revisor: 'general-purpose',
  skills_recomendados: [],
  regla_seleccion_skill: null,
  ultimo_commit_revisado: null,
  revision_codex: false,
  creado: '2026-10-03',
  actualizado: '2026-10-03',
  dependencias: [],
};

const INFORME_A_MANO =
  '# Informe\n\n- Revisor: x\n- Veredicto: **APROBADO CON CAMBIOS**\n\n## Hallazgos\n\nM1.\n\n' +
  '- Veredicto: PENDIENTE (de la plantilla)\n';

/** Repo con la tarea en `estado` y los informes dados en revision/, todo commiteado. */
async function withRepo(
  informes: Record<string, string>,
  fn: (repo: string, tareas: string, revisionDir: string) => Promise<void>,
  estado: Task['estado'] = 'en-revision'
): Promise<void> {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-veredicto-'));
  try {
    git(['init', '-q', '-b', 'develop'], repo);
    git(['config', 'user.email', 'test@example.com'], repo);
    git(['config', 'user.name', 'Test'], repo);
    git(['config', 'core.autocrlf', 'false'], repo);
    const tareas = path.join(repo, 'tareas');
    await writeTareaFile(tareas, { ...TASK, estado }, '## Objetivo\nProbar.\n');
    const carpeta = estado === 'en-revision' ? '03-en-revision' : '02-en-curso';
    const revisionDir = path.join(tareas, carpeta, TASK.id, 'revision');
    await mkdir(revisionDir, { recursive: true });
    for (const [nombre, contenido] of Object.entries(informes)) {
      await writeFile(path.join(revisionDir, nombre), contenido, 'utf8');
    }
    git(['add', '-A'], repo);
    git(['commit', '-q', '-m', 'inicial'], repo);
    await fn(repo, tareas, revisionDir);
  } finally {
    await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

test('veredicto: deja UNA linea canonica en la posicion de la primera, la commitea y finish la acepta', async () => {
  await withRepo(
    { 'informe-revision-1.md': '# viejo\n- Veredicto: cambios-solicitados\n', 'informe-revision-2.md': INFORME_A_MANO },
    async (repo, tareas, revisionDir) => {
      const r = await runVeredictoCommand(tareas, ['TASK-940', 'aprobada-con-correcciones'], {
        repoCwd: repo,
      });
      assert.equal(r.ronda, 2);
      const informe = await readFile(path.join(revisionDir, 'informe-revision-2.md'), 'utf8');
      const lineas = informe.split('\n').filter((l) => l.toLowerCase().startsWith('- veredicto:'));
      assert.deepEqual(lineas, ['- Veredicto: aprobada con correcciones']);
      assert.ok(
        informe.indexOf('- Veredicto:') < informe.indexOf('## Hallazgos'),
        'la linea tiene que quedar donde estaba la primera'
      );
      assert.ok(veredictoAprobado(informe), 'finish tiene que aceptar la linea que escribe el comando');
      assert.equal(
        git(['log', '-1', '--format=%s'], repo).trim(),
        'chore(TASK-940): veredicto ronda 2 (aprobada-con-correcciones)'
      );
      assert.equal(git(['status', '--porcelain'], repo).trim(), '');
      // La ronda 1 no se toca.
      assert.match(
        await readFile(path.join(revisionDir, 'informe-revision-1.md'), 'utf8'),
        /cambios-solicitados/
      );
    }
  );
});

test('veredicto: en una ronda fragmentada exige --informe y, con el, toca solo ese fichero', async () => {
  const informes = {
    'informe-revision-1-java-spring-reviewer.md': '- Veredicto: PENDIENTE\n',
    'informe-revision-1-angular-vue-reviewer.md': '- Veredicto: PENDIENTE\n',
  };
  await withRepo(informes, async (repo, tareas, revisionDir) => {
    const head = git(['rev-parse', 'HEAD'], repo).trim();
    await assert.rejects(
      runVeredictoCommand(tareas, ['TASK-940', 'aprobada'], { repoCwd: repo }),
      (e: unknown) => e instanceof VeredictoCommandError && /--informe/.test(e.message)
    );
    assert.equal(git(['rev-parse', 'HEAD'], repo).trim(), head, 'sin --informe no se commitea nada');

    await runVeredictoCommand(
      tareas,
      ['TASK-940', 'aprobada', '--informe', 'informe-revision-1-java-spring-reviewer.md'],
      { repoCwd: repo }
    );
    assert.match(
      await readFile(path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'), 'utf8'),
      /^- Veredicto: aprobada$/m
    );
    assert.match(
      await readFile(path.join(revisionDir, 'informe-revision-1-angular-vue-reviewer.md'), 'utf8'),
      /PENDIENTE/
    );
  });
});

test('veredicto: fuera de en-revision aborta por la maquina de estados', async () => {
  await withRepo(
    { 'informe-revision-1.md': '- Veredicto: PENDIENTE\n' },
    async (repo, tareas) => {
      await assert.rejects(
        runVeredictoCommand(tareas, ['TASK-940', 'aprobada'], { repoCwd: repo }),
        StateMachineError
      );
    },
    'en-curso'
  );
});

test('veredicto: un informe sin linea de veredicto o un valor desconocido dan error sin commit', async () => {
  await withRepo({ 'informe-revision-1.md': '# sin veredicto\n' }, async (repo, tareas) => {
    const head = git(['rev-parse', 'HEAD'], repo).trim();
    await assert.rejects(
      runVeredictoCommand(tareas, ['TASK-940', 'aprobada'], { repoCwd: repo }),
      (e: unknown) => e instanceof VeredictoCommandError && /ninguna linea/.test(e.message)
    );
    await assert.rejects(
      runVeredictoCommand(tareas, ['TASK-940', 'APROBADO'], { repoCwd: repo }),
      (e: unknown) => e instanceof VeredictoCommandError && /no reconocido/.test(e.message)
    );
    assert.equal(git(['rev-parse', 'HEAD'], repo).trim(), head);
  });
});

test('veredictoAprobado (TASK-036): tolera el enfasis de markdown sin aflojar la regla', () => {
  const pasa = ['**aprobada**', '_aprobada_', '`aprobada`', '**aprobada con correcciones**', 'aprobada'];
  const falla = [
    'no aprobada',
    '**no aprobada**',
    '**APROBADO**',
    '**cambios-solicitados**',
    'PENDIENTE (escribelo con: taskctl veredicto TASK-1 aprobada | cambios-solicitados)',
  ];
  for (const v of pasa) assert.ok(veredictoAprobado(`- Veredicto: ${v}\n`), `deberia pasar: ${v}`);
  for (const v of falla) assert.ok(!veredictoAprobado(`- Veredicto: ${v}\n`), `deberia fallar: ${v}`);
  // El scaffold nuevo tampoco aprueba sin tocarlo.
  assert.ok(!veredictoAprobado(informeTemplate(TASK, 'abc123', 1)));
  assert.match(informeTemplate(TASK, 'abc123', 1), /\| ID \| Severidad \| Estado \| Fichero \|/);
});

test('sustituirVeredicto: conserva el CRLF y devuelve null sin linea', () => {
  assert.equal(
    sustituirVeredicto('a\r\n- Veredicto: x\r\nb\r\n', '- Veredicto: aprobada'),
    'a\r\n- Veredicto: aprobada\r\nb\r\n'
  );
  assert.equal(sustituirVeredicto('nada\n', '- Veredicto: aprobada'), null);
});

test('informesDeUltimaRonda: sin directorio, ruta que es fichero, y varios del mismo N junto a otros de N menor', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-rondas-'));
  try {
    assert.deepEqual(await informesDeUltimaRonda(path.join(dir, 'no-existe'), INFORME_REVISION_RE), {
      ronda: 0,
      nombres: [],
    });
    await writeFile(path.join(dir, 'fichero'), 'x', 'utf8');
    assert.deepEqual(await informesDeUltimaRonda(path.join(dir, 'fichero'), INFORME_REVISION_RE), {
      ronda: 0,
      nombres: [],
    });
    for (const n of [
      'informe-revision-1.md',
      'informe-revision-2-b-reviewer.md',
      'informe-revision-2-a-reviewer.md',
      'peticion-revision-3.md',
    ]) {
      await writeFile(path.join(dir, n), 'x', 'utf8');
    }
    assert.deepEqual(await informesDeUltimaRonda(dir, INFORME_REVISION_RE), {
      ronda: 2,
      nombres: ['informe-revision-2-a-reviewer.md', 'informe-revision-2-b-reviewer.md'],
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
