/**
 * TASK-085: hook de registro del coste (Stop y SubagentStop). Repos Git
 * temporales de verdad; el punto de entrada se prueba ademas como proceso,
 * con el JSON por stdin, igual que lo lanza Claude Code.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { entradasDeHook, registrarTurno } from '../../src/hooks/registro-coste.js';
import { leerPendientes, olvidarPendientes, rutaLibro } from '../../src/fs/coste-pendiente.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { git, sampleTask } from '../helpers/finish-fixtures.js';

const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
const ENTRADA_HOOK = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'coste-turno.js');
const RAMA = 'feature/task-085-coste';
const SESION = '0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0';

async function montar(opts: { tarea?: boolean; carpeta?: boolean; rama?: string } = {}): Promise<{ raiz: string; limpiar: () => Promise<void> }> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'registro-coste-'));
  git(['init', '-q', '-b', 'main'], raiz);
  git(['config', 'user.email', 'test@example.com'], raiz);
  git(['config', 'user.name', 'Test'], raiz);
  if (opts.carpeta !== false) {
    await mkdir(path.join(raiz, 'tareas', '02-en-curso'), { recursive: true });
    await writeFile(path.join(raiz, 'tareas', '02-en-curso', '.gitkeep'), '', 'utf8');
  }
  if (opts.tarea !== false && opts.carpeta !== false) {
    const t = sampleTask({ id: 'TASK-085', estado: 'en-curso', rama: RAMA });
    await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-085'), { recursive: true });
    await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-085', 'tarea.md'), serializeTareaFile(t, '## Objetivo\nx\n'), 'utf8');
  }
  await writeFile(path.join(raiz, 'README.md'), 'x\n', 'utf8');
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', 'inicial'], raiz);
  git(['checkout', '-q', '-b', opts.rama ?? RAMA], raiz);
  return { raiz, limpiar: () => rm(raiz, { recursive: true, force: true }) };
}

function entradaStop(raiz: string): Record<string, unknown> {
  return {
    hook_event_name: 'Stop',
    cwd: raiz,
    session_id: SESION,
    transcript_path: path.join(tmpdir(), 'proyectos', `${SESION}.jsonl`),
    stop_hook_active: false,
  };
}

test('hook: con la tarea en curso en la rama anota la sesion, y en SubagentStop tambien el subagente', async () => {
  const { raiz, limpiar } = await montar();
  try {
    assert.equal(await registrarTurno(entradaStop(raiz), { env: {} }), 1);
    const sub = { ...entradaStop(raiz), hook_event_name: 'SubagentStop', agent_id: 'abc1234', agent_type: 'general-purpose' };
    assert.equal(await registrarTurno(sub, { env: {} }), 2);
    // Repetir no duplica: el libro solo guarda rutas y se funde al leer.
    assert.equal(await registrarTurno(entradaStop(raiz), { env: {} }), 1);
    const libro = rutaLibro(raiz);
    assert.ok(libro !== null && libro.includes(`${path.sep}.git${path.sep}`), `el libro vive bajo .git: ${String(libro)}`);
    const pendientes = leerPendientes(libro, 'TASK-085');
    assert.deepEqual(
      pendientes.map((p) => [p.tipo, p.id, path.basename(p.ruta)]),
      [
        ['sesion', SESION, `${SESION}.jsonl`],
        ['agente', 'abc1234', 'agent-abc1234.jsonl'],
      ]
    );
    // La ruta del subagente, sin agent_transcript_path, es la que usa Claude Code junto a la sesion.
    assert.equal(
      pendientes[1]?.ruta,
      path.join(tmpdir(), 'proyectos', SESION, 'subagents', 'agent-abc1234.jsonl')
    );
    // Ni ensucia el arbol ni toca tarea.md.
    assert.equal(git(['status', '--porcelain'], raiz).trim(), '');
    olvidarPendientes(libro, 'TASK-085');
    assert.equal(existsSync(libro), false, 'sin entradas, el libro desaparece');
  } finally {
    await limpiar();
  }
});

test('hook: sin tarea en curso sale sin hacer nada y sin consultar la rama (ningun proceso)', async () => {
  for (const opts of [{ carpeta: false }, { tarea: false }]) {
    const { raiz, limpiar } = await montar(opts);
    try {
      let consultas = 0;
      const ramaActual = (): string => {
        consultas++;
        return RAMA;
      };
      assert.equal(await registrarTurno(entradaStop(raiz), { env: {}, ramaActual }), 0);
      assert.equal(consultas, 0, `con ${JSON.stringify(opts)} no se lanza git`);
      assert.equal(existsSync(path.join(raiz, '.git', 'coste-pendiente.jsonl')), false);
    } finally {
      await limpiar();
    }
  }
});

test('hook: en otra rama, con COSTE_AUTOMATICO=0 o con una entrada rara, no anota nada', async () => {
  const { raiz, limpiar } = await montar({ rama: 'feature/otra' });
  try {
    assert.equal(await registrarTurno(entradaStop(raiz), { env: {} }), 0);
    git(['checkout', '-q', '-b', RAMA], raiz);
    assert.equal(await registrarTurno(entradaStop(raiz), { env: { COSTE_AUTOMATICO: '0' } }), 0);
    assert.equal(await registrarTurno({}, { env: {} }), 0);
    assert.equal(await registrarTurno({ ...entradaStop(raiz), cwd: path.join(raiz, 'no-existe') }, { env: {} }), 0);
    assert.equal(await registrarTurno({ ...entradaStop(raiz), session_id: '../../x' }, { env: {} }), 0);
    assert.equal(existsSync(path.join(raiz, '.git', 'coste-pendiente.jsonl')), false);
  } finally {
    await limpiar();
  }
});

test('hook: entradasDeHook valida ids y rutas antes de anotar', () => {
  const base = { session_id: SESION, transcript_path: path.join(tmpdir(), 's.jsonl') };
  assert.equal(entradasDeHook({ ...base, transcript_path: 'relativa.jsonl' }, 'TASK-1').length, 0);
  assert.deepEqual(
    entradasDeHook({ ...base, agent_id: 'no-es-hex!' }, 'TASK-1').map((e) => e.tipo),
    ['sesion']
  );
  const declarada = path.join(tmpdir(), 'a', 'agent-abc1234.jsonl');
  assert.equal(
    entradasDeHook({ ...base, agent_id: 'abc1234', agent_transcript_path: declarada }, 'TASK-1')[1]?.ruta,
    declarada
  );
});

test('hook: como proceso sale con 0, sin escribir nada, y anota en el libro', async () => {
  const { raiz, limpiar } = await montar();
  try {
    const env = { ...process.env };
    delete env['COSTE_AUTOMATICO'];
    const r = spawnSync(process.execPath, [ENTRADA_HOOK], {
      input: JSON.stringify(entradaStop(raiz)),
      encoding: 'utf8',
      env,
    });
    assert.equal(r.status, 0);
    assert.equal(r.stdout, '');
    assert.equal(r.stderr, '');
    const libro = rutaLibro(raiz) as string;
    assert.equal(readFileSync(libro, 'utf8').trim().split('\n').length, 1);
    // JSON roto: tambien 0 y en silencio.
    const roto = spawnSync(process.execPath, [ENTRADA_HOOK], { input: '{no', encoding: 'utf8', env });
    assert.deepEqual([roto.status, roto.stdout, roto.stderr], [0, '', '']);
  } finally {
    await limpiar();
  }
});

test('hook: hooks.json lo declara en Stop y SubagentStop, en forma exec, con timeout corto y sin nombrar el producto', () => {
  const texto = readFileSync(path.join(RAIZ_PLUGIN, 'hooks', 'hooks.json'), 'utf8');
  const j = JSON.parse(texto) as {
    hooks: Record<string, { hooks: { type: string; command: string; args: string[]; timeout: number }[] }[]>;
  };
  for (const evento of ['Stop', 'SubagentStop']) {
    const delCoste = (j.hooks[evento] ?? []).flatMap((g) => g.hooks).filter((h) => h.args.some((a) => a.endsWith('coste-turno.js')));
    assert.equal(delCoste.length, 1, `${evento} declara el hook de coste una vez`);
    assert.equal(delCoste[0]?.command, 'node');
    assert.deepEqual(delCoste[0]?.args, ['${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/coste-turno.js']);
    assert.ok((delCoste[0]?.timeout ?? 0) <= 30);
  }
  assert.doesNotMatch(texto, /taskcode/i);
});
