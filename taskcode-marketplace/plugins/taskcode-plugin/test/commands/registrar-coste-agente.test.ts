/**
 * TASK-023: `taskctl registrar-coste --agente <id>` por CLI, contra repos Git
 * temporales y un CLAUDE_CONFIG_DIR temporal con transcripciones reales.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readTareaFile } from '../../src/fs/task-store.js';
import { ID, CONFIG_AUTO, TASKCTL, git, withRepo, hastaCodigo } from '../helpers/automatico-fixtures.js';

const A = 'a1b2c3d4e5f60718';
const B = 'b1b2c3d4e5f60718';

function linea(id: string, entrada: number, salida: number): string {
  return JSON.stringify({
    type: 'assistant',
    message: { id, usage: { input_tokens: entrada, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: salida } },
  });
}

async function transcripcion(config: string, proyecto: string, sesion: string, agente: string, lineas: string[]): Promise<string> {
  const dir = path.join(config, 'projects', proyecto, sesion, 'subagents');
  await mkdir(dir, { recursive: true });
  const ruta = path.join(dir, `agent-${agente}.jsonl`);
  await writeFile(ruta, lineas.join('\n') + '\n', 'utf8');
  return ruta;
}

async function conConfig(fn: (config: string) => Promise<void>): Promise<void> {
  const config = await mkdtemp(path.join(tmpdir(), 'taskctl-claude-config-'));
  try {
    await fn(config);
  } finally {
    await rm(config, { recursive: true, force: true });
  }
}

function coste(repo: string, config: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [TASKCTL, 'registrar-coste', ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_CONFIG_DIR: config },
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

async function valor(tareasRoot: string): Promise<[number | null, number | null, number | null]> {
  const t = await readTareaFile(tareasRoot, ID);
  assert.ok(t);
  return [t.task.tokens_diseno, t.task.tokens_implementacion, t.task.tokens_revision];
}

const head = (repo: string): string => git(['rev-parse', 'HEAD'], repo).trim();

test('--agente: suma lo gastado (ultima aparicion de cada message.id), no el contexto final, y commitea con la cifra y los agentes', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      await transcripcion(config, 'proy-1', 'sesion-1', A, [
        linea('m1', 100, 1),
        linea('m1', 100, 20), // streaming: cuenta esta (120), no la anterior
        linea('m2', 200, 30), // 230
        'basura que no es json',
      ]);
      const r = coste(repo, config, [ID, '--fase', 'diseno', '--agente', A]);
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /\+350 tokens de diseno \(1 subagente\(s\)\); total de la fase: 350/);
      assert.deepEqual(await valor(tareasRoot), [350, null, null]);
      assert.equal(git(['log', '-1', '--format=%s'], repo).trim(), `chore(${ID}): coste diseno +350 tokens (1 agente)`);
      assert.equal(git(['status', '--porcelain'], repo).trim(), '');
    });
  });
});

test('--agente repetido (y con --agente=): suma varios agentes de sesiones distintas en UN registro y un commit', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      await transcripcion(config, 'proy-1', 'sesion-1', A, [linea('m1', 100, 0)]);
      await transcripcion(config, 'proy-2', 'sesion-9', B, [linea('m1', 40, 10)]);
      const antes = git(['rev-list', '--count', 'HEAD'], repo).trim();
      const r = coste(repo, config, [ID, '--fase', 'revision', '--agente', A, `--agente=${B}`, '--agente', A]);
      assert.equal(r.status, 0, r.stderr);
      assert.deepEqual(await valor(tareasRoot), [null, null, 150], 'el id repetido no se cuenta dos veces');
      assert.equal(Number(git(['rev-list', '--count', 'HEAD'], repo).trim()), Number(antes) + 1, 'un solo commit');
      assert.equal(git(['log', '-1', '--format=%s'], repo).trim(), `chore(${ID}): coste revision +150 tokens (2 agentes)`);
      // Suma sobre lo anterior, como --tokens.
      assert.equal(coste(repo, config, [ID, '--fase', 'revision', '--tokens', '10']).status, 0);
      assert.deepEqual(await valor(tareasRoot), [null, null, 160]);
    });
  });
});

test('--agente: errores que dicen que hacer, sin tocar nada', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      const dup1 = await transcripcion(config, 'proy-1', 'sesion-1', A, [linea('m1', 1, 1)]);
      const dup2 = await transcripcion(config, 'proy-2', 'sesion-2', A, [linea('m1', 1, 1)]);
      await transcripcion(config, 'proy-1', 'sesion-1', B, ['{"type":"user"}', 'no json']);
      const antes = head(repo);
      const casos: [string[], RegExp][] = [
        [['--agente', 'c1b2c3d4e5f60718'], /No se encuentra la transcripcion del subagente c1b2c3d4e5f60718.*projects.*--tokens N/s],
        [['--agente', A], /mas de una sesion/],
        [['--agente', B], /no tiene ninguna llamada con "usage".*formato desconocido.*--tokens N/s],
        [['--agente', '../../etc/passwd'], /no es un id de subagente valido/],
        [['--agente', 'a1b2c3/../d4'], /no es un id de subagente valido/],
        [['--agente', `..${path.sep}x`], /no es un id de subagente valido/],
        [['--agente', A, '--tokens', '5'], /--tokens y --agente se excluyen entre si/],
        [['--agente'], /--agente necesita el id/],
        [[], /Falta el coste: pasa --agente/],
      ];
      for (const [extra, esperado] of casos) {
        const r = coste(repo, config, [ID, '--fase', 'diseno', ...extra]);
        assert.equal(r.status, 1, extra.join(' '));
        assert.match(r.stderr, esperado, extra.join(' '));
      }
      // El ambiguo lista las dos rutas.
      const amb = coste(repo, config, [ID, '--fase', 'diseno', '--agente', A]);
      assert.ok(amb.stderr.includes(dup1) && amb.stderr.includes(dup2), amb.stderr);
      assert.equal(head(repo), antes, 'ningun error commitea');
      assert.deepEqual(await valor(tareasRoot), [null, null, null]);
    });
  });
});

test('--agente: un fallo con varios agentes no registra ni la parte buena', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      await transcripcion(config, 'p', 's', A, [linea('m1', 5, 5)]);
      const r = coste(repo, config, [ID, '--fase', 'diseno', '--agente', A, '--agente', 'c1b2c3d4e5f60718']);
      assert.equal(r.status, 1);
      assert.deepEqual(await valor(tareasRoot), [null, null, null]);
    });
  });
});
