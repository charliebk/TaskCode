/**
 * TASK-023: la busqueda de transcripciones valida el id por si misma (es la
 * ultima defensa antes de componer una ruta) y respeta CLAUDE_CONFIG_DIR.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buscarTranscripciones, directorioConfigClaude } from '../../src/fs/transcripciones.js';

test('buscarTranscripciones: rechaza ids con .., separadores o no hexadecimales antes de tocar el disco', async () => {
  const config = await mkdtemp(path.join(tmpdir(), 'taskctl-transcripciones-'));
  try {
    // Un fichero fuera de projects/ que una ruta compuesta sin validar alcanzaria.
    await writeFile(path.join(config, 'agent-secreto.jsonl'), '{}', 'utf8');
    for (const malo of ['../x', '..', 'a1b2c3/../d4', 'a1b2c3\\d4', '', 'zzzzzz']) {
      await assert.rejects(() => buscarTranscripciones(config, malo), /agentId invalido/, malo);
    }
    assert.deepEqual(await buscarTranscripciones(config, 'a1b2c3d4'), [], 'sin projects/ no hay nada, y no falla');
    const dir = path.join(config, 'projects', 'p', 's', 'subagents');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'agent-a1b2c3d4.jsonl'), '{}', 'utf8');
    assert.deepEqual(await buscarTranscripciones(config, 'a1b2c3d4'), [path.join(dir, 'agent-a1b2c3d4.jsonl')]);
  } finally {
    await rm(config, { recursive: true, force: true });
  }
});

test('directorioConfigClaude: CLAUDE_CONFIG_DIR manda; sin ella, ~/.claude', () => {
  assert.equal(directorioConfigClaude({ CLAUDE_CONFIG_DIR: '/x/y' }), '/x/y');
  assert.match(directorioConfigClaude({}), /\.claude$/);
  assert.match(directorioConfigClaude({ CLAUDE_CONFIG_DIR: '  ' }), /\.claude$/);
});
