/**
 * TASK-085: el coste de implementacion que anota el hook llega a tarea.md en
 * el commit de `review`, sin duplicar y sin ensuciar el arbol, y `taskctl
 * metricas` deja de listar la tarea como sin coste de implementacion.
 * Repos Git temporales reales y transcripciones con la forma de las de
 * Claude Code (timestamp, gitBranch y cwd por linea) en un directorio de
 * configuracion temporal. Nada de mocks.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runReviewCommand } from '../../src/commands/review.js';
import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
import { leerCostes } from '../../src/core/coste-registro.js';
import { leerTransiciones } from '../../src/core/transiciones.js';
import { registrarTurno } from '../../src/hooks/registro-coste.js';
import { rutaLibro } from '../../src/fs/coste-pendiente.js';
import { volcarCosteAutomatico } from '../../src/fs/coste-automatico.js';
import { SCRIPTS_DIR, commitAll, git, sampleTask, withTempRepo } from '../helpers/review-fixtures.js';
import {
  CONFIG_AUTO,
  ID,
  TASKCTL,
  dirRevision,
  hastaCodigo,
  rellenarInforme,
  withRepo,
} from '../helpers/automatico-fixtures.js';

const SESION = '7d1e2f30-4a5b-4c6d-8e7f-9a0b1c2d3e4f';
const AGENTE = 'abc1234';
const AGENTE_FUERA = 'def4567';
const START = '2026-09-05T10:00:00Z';
const AHORA = '2026-09-05T12:00:00Z';

function linea(id: string, ts: string, rama: string, cwd: string, u: Record<string, number>): string {
  return JSON.stringify({
    type: 'assistant',
    timestamp: ts,
    gitBranch: rama,
    cwd,
    sessionId: SESION,
    message: { id, role: 'assistant', content: [{ type: 'text', text: 'x' }], usage: u },
  });
}

/** Sesion y subagentes en `<config>/projects/<proyecto>/`. Devuelve la ruta de la sesion. */
async function transcripciones(config: string, rama: string, cwd: string): Promise<string> {
  const proyecto = path.join(config, 'projects', 'proyecto-de-prueba');
  const sesion = path.join(proyecto, `${SESION}.jsonl`);
  const subagentes = path.join(proyecto, SESION, 'subagents');
  await mkdir(subagentes, { recursive: true });
  await writeFile(
    sesion,
    [
      JSON.stringify({ type: 'user', timestamp: '2026-09-05T08:59:00Z', message: { content: 'disena' } }),
      linea('m0', '2026-09-05T09:00:00.000Z', rama, cwd, { input_tokens: 9000, output_tokens: 1000 }), // diseno: fuera
      linea('m1', '2026-09-05T10:30:00.000Z', rama, cwd, {
        input_tokens: 100,
        cache_creation_input_tokens: 10,
        cache_read_input_tokens: 1000,
        output_tokens: 50,
      }), // 1160
      linea('m2', '2026-09-05T10:40:00.000Z', 'feature/otra-tarea', cwd, { input_tokens: 7000 }), // otra tarea
      linea('m3', '2026-09-05T13:00:00.000Z', rama, cwd, { input_tokens: 5000 }), // despues de review
    ].join('\n') + '\n',
    'utf8'
  );
  await writeFile(
    path.join(subagentes, `agent-${AGENTE}.jsonl`),
    linea('a1', '2026-09-05T11:00:00.000Z', rama, cwd, { input_tokens: 20, output_tokens: 5 }) + '\n', // 25
    'utf8'
  );
  await writeFile(
    path.join(subagentes, `agent-${AGENTE_FUERA}.jsonl`),
    linea('b1', '2026-09-05T08:00:00.000Z', rama, cwd, { input_tokens: 300 }) + '\n', // brainstorm: fuera
    'utf8'
  );
  return sesion;
}

const CUERPO = [
  '## Objetivo',
  'Probar el coste automatico.',
  '',
  '## Transiciones',
  '',
  '| fecha | fase | modo | decidido_por |',
  '|---|---|---|---|',
  '| 2026-09-05T08:30:00Z | plan | automatico | persona |',
  '| 2026-09-05T09:30:00Z | approve | automatico | persona |',
  `| ${START} | start | automatico | persona |`,
  '',
].join('\n');

async function tareaEnCurso(repoRoot: string, tareasRoot: string): Promise<ReturnType<typeof sampleTask>> {
  const task = sampleTask({ id: 'TASK-600' });
  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
  await writeTareaFile(tareasRoot, task, CUERPO);
  await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo\n', 'utf8');
  commitAll(repoRoot, `feat(${task.id}): trabajo`);
  return task;
}

test('review: suma la sesion y sus subagentes de la ventana en curso, en su commit, y vacia el libro', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const config = await mkdtemp(path.join(tmpdir(), 'coste-config-'));
    try {
      const task = await tareaEnCurso(repoRoot, tareasRoot);
      const sesion = await transcripciones(config, task.rama, repoRoot);
      // Lo que haria el hook al terminar un turno con la tarea en curso.
      assert.equal(await registrarTurno({ cwd: repoRoot, session_id: SESION, transcript_path: sesion }, { env: {} }), 1);
      const libro = rutaLibro(repoRoot) as string;
      assert.equal(existsSync(libro), true);

      const r = await runReviewCommand(tareasRoot, [task.id], '2026-09-05', {
        repoCwd: repoRoot,
        scriptsDir: SCRIPTS_DIR,
        ahora: AHORA,
        env: {},
        configDir: config,
      });
      assert.deepEqual(r.costeImplementacion, { sumado: 1185, filas: 2 });

      const leida = await readTareaFile(tareasRoot, task.id);
      assert.ok(leida !== null);
      assert.equal(leida.task.estado, 'en-revision');
      assert.equal(leida.task.tokens_implementacion, 1185);
      assert.deepEqual(
        leerCostes(leida.body).map((f) => [f.fase, f.fuente, f.total, f.entrada, f.cacheLectura]),
        [
          ['implementacion', `sesion:${SESION}`, 1160, 100, 1000],
          ['implementacion', `agente:${AGENTE}`, 25, 20, 0],
        ]
      );
      // La transicion y el coste viajan en el mismo commit; el arbol queda limpio.
      assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
      assert.match(git(['show', '--stat', '--format=%s', 'HEAD'], repoRoot), /peticion de revision ronda 1/);
      assert.match(git(['show', 'HEAD', '--', leida.filePath], repoRoot), /\+\| .* \| implementacion \| sesion:/);
      assert.equal(existsSync(libro), false, 'tras el commit, el libro de la tarea se vacia');

      // La red de finish (o un segundo volcado) no vuelve a sumar lo mismo.
      const otra = await volcarCosteAutomatico(leida.task, leida.body, Date.parse('2026-09-06T00:00:00Z'), {
        raiz: repoRoot,
        env: { CLAUDE_CODE_SESSION_ID: SESION },
        configDir: config,
      });
      assert.equal(otra.filas, 0);
      assert.equal(otra.task.tokens_implementacion, 1185);
    } finally {
      await rm(config, { recursive: true, force: true });
    }
  });
});

test('review: sin libro, la sesion que lo ejecuta (CLAUDE_CODE_SESSION_ID) basta; COSTE_AUTOMATICO=0 lo apaga', async () => {
  for (const [env, esperado] of [
    [{ CLAUDE_CODE_SESSION_ID: SESION }, 1185],
    [{ CLAUDE_CODE_SESSION_ID: SESION, COSTE_AUTOMATICO: '0' }, null],
    [{}, null],
  ] as const) {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      const config = await mkdtemp(path.join(tmpdir(), 'coste-config-'));
      try {
        const task = await tareaEnCurso(repoRoot, tareasRoot);
        await transcripciones(config, task.rama, repoRoot);
        await runReviewCommand(tareasRoot, [task.id], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
          ahora: AHORA,
          env: { ...env },
          configDir: config,
        });
        const leida = await readTareaFile(tareasRoot, task.id);
        assert.equal(leida?.task.tokens_implementacion, esperado, JSON.stringify(env));
        assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
      } finally {
        await rm(config, { recursive: true, force: true });
      }
    });
  }
});

test('review: lo ya registrado a mano para un agente no se suma dos veces', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const config = await mkdtemp(path.join(tmpdir(), 'coste-config-'));
    try {
      const task = sampleTask({ id: 'TASK-600', tokens_implementacion: 25 });
      git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
      const conManual =
        CUERPO +
        '\n## Coste\n\n' +
        '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |\n' +
        '|---|---|---|---|---|---|---|---|---|---|---|\n' +
        `| 2026-09-05T11:30:00Z | implementacion | agente:${AGENTE} | 20 | 0 | 0 | 5 | 0 | 25 | - | - |\n`;
      await writeTareaFile(tareasRoot, task, conManual);
      commitAll(repoRoot, `feat(${task.id}): trabajo`);
      await transcripciones(config, task.rama, repoRoot);
      await runReviewCommand(tareasRoot, [task.id], '2026-09-05', {
        repoCwd: repoRoot,
        scriptsDir: SCRIPTS_DIR,
        ahora: AHORA,
        env: { CLAUDE_CODE_SESSION_ID: SESION },
        configDir: config,
      });
      const leida = await readTareaFile(tareasRoot, task.id);
      assert.equal(leida?.task.tokens_implementacion, 25 + 1160);
      assert.deepEqual(
        leerCostes(leida?.body ?? '').map((f) => f.fuente),
        [`agente:${AGENTE}`, `sesion:${SESION}`]
      );
    } finally {
      await rm(config, { recursive: true, force: true });
    }
  });
});

function taskctl(cwd: string, args: string[], env: NodeJS.ProcessEnv): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8', env });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

/**
 * Ciclo completo por CLI. `redEnFinish`: la review corre con COSTE_AUTOMATICO=0
 * (como si su volcado no hubiera podido) y lo suma la red de finish.
 */
async function cicloPorCli(redEnFinish: boolean): Promise<void> {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    const config = await mkdtemp(path.join(tmpdir(), 'coste-config-'));
    try {
      const env: NodeJS.ProcessEnv = { ...process.env, CLAUDE_CONFIG_DIR: config };
      delete env['CLAUDE_CODE_SESSION_ID'];
      delete env['COSTE_AUTOMATICO'];
      const ok = (args: string[]): string => {
        const r = taskctl(repoRoot, args, env);
        assert.equal(r.status, 0, `taskctl ${args.join(' ')}: ${r.stderr}${r.stdout}`);
        return r.stdout;
      };

      await hastaCodigo(repoRoot, tareasRoot);
      const enCurso = await readTareaFile(tareasRoot, ID);
      assert.ok(enCurso !== null);
      const start = leerTransiciones(enCurso.body).find((f) => f.fase === 'start');
      assert.ok(start !== undefined);
      // Un turno de implementacion justo en el instante del start, en la rama de la tarea.
      const ts = new Date(Date.parse(start.fecha)).toISOString();
      const proyecto = path.join(config, 'projects', 'proyecto');
      await mkdir(proyecto, { recursive: true });
      const sesion = path.join(proyecto, `${SESION}.jsonl`);
      await writeFile(sesion, linea('m1', ts, enCurso.task.rama, repoRoot, { input_tokens: 400, output_tokens: 100 }) + '\n', 'utf8');

      const hook = spawnSync(process.execPath, [path.join(path.dirname(TASKCTL), '..', 'dist', 'src', 'hooks', 'coste-turno.js')], {
        input: JSON.stringify({ hook_event_name: 'Stop', cwd: repoRoot, session_id: SESION, transcript_path: sesion }),
        encoding: 'utf8',
        env,
      });
      assert.deepEqual([hook.status, hook.stdout, hook.stderr], [0, '', '']);
      assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'el hook no ensucia el arbol');

      // La review tiene que caer al menos un segundo despues del start (filas al segundo).
      const espera = Date.parse(start.fecha) + 1100 - Date.now();
      if (espera > 0) await new Promise((res) => setTimeout(res, espera));
      const libro = rutaLibro(repoRoot) as string;
      if (redEnFinish) {
        const r = taskctl(repoRoot, ['review', ID], { ...env, COSTE_AUTOMATICO: '0' });
        assert.equal(r.status, 0, r.stderr);
        assert.doesNotMatch(r.stdout, /Coste de implementacion registrado/);
        const enRevision = await readTareaFile(tareasRoot, ID);
        assert.equal(enRevision?.task.tokens_implementacion, null, 'apagado, review no suma');
        assert.equal(existsSync(libro), true, 'y el libro sigue ahi para finish');
      } else {
        assert.match(ok(['review', ID]), /Coste de implementacion registrado automaticamente: \+500 tokens/);
        assert.equal(existsSync(libro), false);
      }

      await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
      ok(['veredicto', ID, 'aprobada']);
      ok(['finish', ID]);

      const terminada = await readTareaFile(tareasRoot, ID);
      assert.equal(terminada?.task.estado, 'terminada');
      assert.equal(terminada?.task.tokens_implementacion, 500, redEnFinish ? 'lo suma finish' : 'finish no lo vuelve a sumar');
      assert.equal(leerCostes(terminada?.body ?? '').filter((f) => f.fase === 'implementacion').length, 1);
      assert.equal(existsSync(libro), false, 'tras el commit de cierre, el libro se vacia');
      assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
      if (redEnFinish) {
        assert.match(git(['show', '--format=%s', 'HEAD', '--', terminada?.filePath ?? ''], repoRoot), /\| implementacion \| sesion:/);
      }

      const json = JSON.parse(ok(['metricas', '--json'])) as {
        sinCoste: { tareas: { id: string; fases: string[] }[] };
      };
      const fila = json.sinCoste.tareas.find((t) => t.id === ID);
      assert.ok(fila === undefined || !fila.fases.includes('implementacion'), JSON.stringify(json.sinCoste));
      assert.ok(fila?.fases.includes('revision'), 'la revision sigue sin coste: el control de que la tarea se mira');
    } finally {
      await rm(config, { recursive: true, force: true });
    }
  });
}

test('ciclo por CLI: hook como proceso, review lo suma y metricas deja de listar la tarea sin coste de implementacion', async () => {
  await cicloPorCli(false);
});

test('ciclo por CLI: si review no lo vuelca, la red de finish lo suma una vez y vacia el libro', async () => {
  await cicloPorCli(true);
});

test('review: un libro corrupto no rompe la transicion', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = await tareaEnCurso(repoRoot, tareasRoot);
    await writeFile(rutaLibro(repoRoot) as string, 'esto no es json\n{"v":1}\n', 'utf8');
    const r = await runReviewCommand(tareasRoot, [task.id], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      ahora: AHORA,
      env: {},
    });
    assert.equal(r.costeImplementacion.filas, 0);
    assert.equal((await readTareaFile(tareasRoot, task.id))?.task.estado, 'en-revision');
    assert.equal(await readFile(rutaLibro(repoRoot) as string, 'utf8').then(() => 'existe', () => 'no'), 'no');
  });
});
