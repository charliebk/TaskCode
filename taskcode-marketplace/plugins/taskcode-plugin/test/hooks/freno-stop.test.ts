/**
 * Freno de fin de turno (TASK-071). Repos Git temporales de verdad, con una
 * tarea en 02-en-curso y un `comando_verificacion` que ejecuta un script real
 * de node. Nada de mocks: el comando se lanza con el mismo envoltorio que en
 * produccion, y el punto de entrada se prueba ademas como proceso, con el JSON
 * por stdin, igual que lo lanza Claude Code.
 *
 * El script de verificacion lee su desenlace de un fichero FUERA del repo
 * (variable VERIF_DESENLACE, que hereda): asi se puede cambiar lo que haria sin
 * tocar el arbol, que es justo lo que hace falta para probar el memo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { decidirStop, MARGEN_HOOK_S, TECHO_HOOK_S, parsearEntrada } from '../../src/hooks/freno-stop.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { git, sampleTask } from '../helpers/finish-fixtures.js';

const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
const ENTRADA_HOOK = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'stop-verificacion.js');
const RAMA = 'feature/task-071-freno';

/** Lo que hace el script segun el fichero de desenlace: ok, ko, lento, ruido. */
const SCRIPT = `
const fs = require('node:fs');
const d = fs.readFileSync(process.env.VERIF_DESENLACE, 'utf8').trim();
fs.appendFileSync(process.env.VERIF_DESENLACE + '.cuenta', 'x');
if (d === 'ok') { console.log('todo en verde'); process.exit(0); }
if (d === 'lento') { setTimeout(() => {}, 60000); }
else if (d === 'ruido') {
  for (let i = 0; i < 5000; i++) console.log('\\u001b[31mlinea ' + i + ' con ñ y € y emoji 🚀\\u001b[0m');
  console.error('fallo final: https://usuario:secreto@git.example.com/repo.git');
  process.exit(1);
} else { console.log('preparando'); console.error('ERROR: 2 tests fallan'); process.exit(3); }
`;

interface Repo {
  raiz: string;
  desenlace: string;
  /** Cuantas veces se ha ejecutado de verdad el script. */
  ejecuciones(): number;
  limpiar(): Promise<void>;
}

async function montar(opts: { config?: string; tarea?: boolean; rama?: string } = {}): Promise<Repo> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'freno-stop-'));
  const fuera = await mkdtemp(path.join(tmpdir(), 'freno-stop-desenlace-'));
  const desenlace = path.join(fuera, 'desenlace');
  await writeFile(desenlace, 'ok', 'utf8');
  git(['init', '-q', '-b', 'main'], raiz);
  git(['config', 'user.email', 'test@example.com'], raiz);
  git(['config', 'user.name', 'Test'], raiz);
  for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
    await mkdir(path.join(raiz, 'tareas', c), { recursive: true });
    await writeFile(path.join(raiz, 'tareas', c, '.gitkeep'), '', 'utf8');
  }
  if (opts.tarea !== false) {
    const t = sampleTask({ id: 'TASK-071', estado: 'en-curso', rama: RAMA });
    await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-071'), { recursive: true });
    await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-071', 'tarea.md'), serializeTareaFile(t, '## Objetivo\nx\n'), 'utf8');
  }
  await mkdir(path.join(raiz, 'scripts'));
  await writeFile(path.join(raiz, 'scripts', 'verif.cjs'), SCRIPT, 'utf8');
  await mkdir(path.join(raiz, '.taskcode'));
  await writeFile(
    path.join(raiz, '.taskcode', 'config.yml'),
    opts.config ?? 'comando_verificacion: "node scripts/verif.cjs"\n',
    'utf8'
  );
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', 'inicial'], raiz);
  git(['checkout', '-q', '-b', opts.rama ?? RAMA], raiz);
  return {
    raiz,
    desenlace,
    ejecuciones: () => (existsSync(`${desenlace}.cuenta`) ? readFileSync(`${desenlace}.cuenta`, 'utf8').length : 0),
    limpiar: async () => {
      await rm(raiz, { recursive: true, force: true, maxRetries: 5 });
      await rm(fuera, { recursive: true, force: true, maxRetries: 5 });
    },
  };
}

async function conRepo(fn: (r: Repo) => Promise<void>, opts?: Parameters<typeof montar>[0]): Promise<void> {
  const r = await montar(opts);
  try {
    await fn(r);
  } finally {
    await r.limpiar();
  }
}

function decidir(r: Repo, extra: Record<string, unknown> = {}, deps: { timeoutMs?: number; env?: NodeJS.ProcessEnv } = {}) {
  return decidirStop(
    { hook_event_name: 'Stop', stop_hook_active: false, cwd: r.raiz, ...extra },
    { env: { ...process.env, VERIF_DESENLACE: r.desenlace, ...deps.env }, ...(deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs }) }
  );
}

// El script hereda el entorno del proceso de test (el envoltorio no lo filtra).
function conDesenlace<T>(r: Repo, fn: () => Promise<T>): Promise<T> {
  const antes = process.env['VERIF_DESENLACE'];
  process.env['VERIF_DESENLACE'] = r.desenlace;
  return fn().finally(() => {
    if (antes === undefined) delete process.env['VERIF_DESENLACE'];
    else process.env['VERIF_DESENLACE'] = antes;
  });
}

test('freno: verificacion en verde deja parar, en silencio', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      const d = await decidir(r);
      assert.deepEqual(d, { codigo: 0, stderr: '' });
      assert.equal(r.ejecuciones(), 1);
    })
  );
});

test('freno: verificacion en rojo bloquea con exit 2 y el comando, el codigo, la duracion y la cola', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      await writeFile(r.desenlace, 'ko', 'utf8');
      const d = await decidir(r);
      assert.equal(d.codigo, 2);
      assert.match(d.stderr, /Tarea en curso en esta rama: TASK-071/);
      assert.match(d.stderr, /Comando: {3}node scripts\/verif\.cjs/);
      assert.match(d.stderr, /Resultado: salio con codigo 3/);
      assert.match(d.stderr, /Duracion: {2}\d+\.\d s/);
      assert.match(d.stderr, /preparando[\s\S]*ERROR: 2 tests fallan/, 'stdout y stderr intercalados');
      assert.match(d.stderr, /No borres, saltes ni debilites tests/);
      assert.doesNotMatch(d.stderr, /taskcode/i, 'el texto lo leen proyectos ajenos');
    })
  );
});

test('freno: sin tarea en curso, rama ajena o sin comando no hace nada ni ejecuta el comando', async () => {
  await conRepo(
    (r) =>
      conDesenlace(r, async () => {
        await writeFile(r.desenlace, 'ko', 'utf8');
        assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
        assert.equal(r.ejecuciones(), 0);
      }),
    { tarea: false }
  );
  await conRepo(
    (r) =>
      conDesenlace(r, async () => {
        await writeFile(r.desenlace, 'ko', 'utf8');
        assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
        assert.equal(r.ejecuciones(), 0);
      }),
    { rama: 'feature/otra-cosa' }
  );
  await conRepo(
    (r) =>
      conDesenlace(r, async () => {
        await writeFile(r.desenlace, 'ko', 'utf8');
        assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
        assert.equal(r.ejecuciones(), 0);
      }),
    { config: 'limite_wip: 1\n' }
  );
});

test('freno: fuera de un proyecto con tareas (o sin cwd) sale 0 sin tocar nada', async () => {
  const vacio = await mkdtemp(path.join(tmpdir(), 'freno-stop-vacio-'));
  try {
    assert.deepEqual(await decidirStop({ cwd: vacio }), { codigo: 0, stderr: '' });
    assert.deepEqual(await decidirStop({ cwd: path.join(vacio, 'no-existe') }), { codigo: 0, stderr: '' });
    assert.deepEqual(await decidirStop({}), { codigo: 0, stderr: '' });
    assert.deepEqual(parsearEntrada('no es json'), {});
    assert.deepEqual(parsearEntrada('[1]'), {});
  } finally {
    await rm(vacio, { recursive: true, force: true });
  }
});

test('freno: stop_hook_active e interruptor FRENO_VERIFICACION=0 dejan parar sin ejecutar', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      await writeFile(r.desenlace, 'ko', 'utf8');
      assert.deepEqual(await decidir(r, { stop_hook_active: true }), { codigo: 0, stderr: '' });
      assert.deepEqual(await decidir(r, {}, { env: { FRENO_VERIFICACION: '0' } }), { codigo: 0, stderr: '' });
      assert.equal(r.ejecuciones(), 0);
    })
  );
});

test('freno: respeta el timeout y corta el comando (bloquea, no deja pasar)', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      await writeFile(r.desenlace, 'lento', 'utf8');
      const inicio = Date.now();
      const d = await decidir(r, {}, { timeoutMs: 1500 });
      assert.ok(Date.now() - inicio < 20000, 'el corte no espera al comando');
      assert.equal(d.codigo, 2);
      assert.match(d.stderr, /no termino en \d+ s y se ha cortado/);
      assert.doesNotMatch(d.stderr, /\[taskctl:timeout\]/, 'la marca interna no llega al agente');
    })
  );
});

test('freno: timeout_verificacion por encima del tope del hook se recorta y se avisa', async () => {
  await conRepo(
    (r) =>
      conDesenlace(r, async () => {
        await writeFile(r.desenlace, 'ko', 'utf8');
        const d = await decidir(r);
        assert.equal(d.codigo, 2);
        assert.match(d.stderr, new RegExp(`pide 99999 s, pero este freno tiene un tope de ${String(TECHO_HOOK_S - MARGEN_HOOK_S)} s`));
      }),
    { config: 'comando_verificacion: "node scripts/verif.cjs"\ntimeout_verificacion: 99999\n' }
  );
});

test('freno: config invalida con tarea en curso bloquea con el error de la config', async () => {
  await conRepo(
    (r) =>
      conDesenlace(r, async () => {
        const d = await decidir(r);
        assert.equal(d.codigo, 2);
        assert.match(d.stderr, /no se puede leer[\s\S]*timeout_verificacion[\s\S]*Corrige \.taskcode\/config\.yml/);
        assert.equal(r.ejecuciones(), 0);
      }),
    { config: 'comando_verificacion: "node scripts/verif.cjs"\ntimeout_verificacion: 0\n' }
  );
});

test('freno: memo por huella — mismo arbol no vuelve a ejecutar, un cambio si', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      assert.equal((await decidir(r)).codigo, 0);
      assert.equal(r.ejecuciones(), 1);
      // El desenlace cambia FUERA del arbol: con la misma huella vale el verde guardado.
      await writeFile(r.desenlace, 'ko', 'utf8');
      assert.equal((await decidir(r)).codigo, 0);
      assert.equal(r.ejecuciones(), 1, 'verde memorizado');
      // Un cambio en el arbol invalida el memo.
      await writeFile(path.join(r.raiz, 'nuevo.txt'), 'x', 'utf8');
      const rojo = await decidir(r);
      assert.equal(rojo.codigo, 2);
      assert.equal(r.ejecuciones(), 2);
      // Rojo memorizado: se repite el informe sin ejecutar, y se dice.
      await writeFile(r.desenlace, 'ok', 'utf8');
      const otra = await decidir(r);
      assert.equal(otra.codigo, 2);
      assert.equal(r.ejecuciones(), 2, 'rojo memorizado');
      assert.match(otra.stderr, /resultado guardado de la ultima verificacion/);
      assert.match(otra.stderr, /salio con codigo 3/);
      // El memo no ensucia el arbol: vive bajo .git/.
      assert.equal(git(['status', '--porcelain', '--', '.taskcode', 'tareas', 'scripts'], r.raiz), '');
      assert.ok(existsSync(path.join(r.raiz, '.git', 'freno-verificacion.json')));
    })
  );
});

test('freno: la cola va acotada, sin ANSI, sin credenciales y sin partir UTF-8', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      await writeFile(r.desenlace, 'ruido', 'utf8');
      const d = await decidir(r);
      assert.equal(d.codigo, 2);
      assert.match(d.stderr, /Final de la salida \(truncada: \d+ bytes en total\)/);
      assert.ok(Buffer.byteLength(d.stderr, 'utf8') < 4096 + 2048, `stderr de ${String(Buffer.byteLength(d.stderr))} bytes`);
      assert.ok(!d.stderr.includes('\u001b'), 'sin secuencias ANSI');
      assert.ok(!d.stderr.includes('�'), 'sin caracteres partidos');
      assert.ok(!d.stderr.includes('secreto'), 'sin credenciales');
      assert.match(d.stderr, /fallo final: https:\/\/\*\*\*@git\.example\.com/);
      assert.match(d.stderr, /linea 4999 con ñ y € y emoji 🚀/);
    })
  );
});

test('freno: el punto de entrada real, por stdin, sale con 2 en rojo y 0 en verde', async () => {
  await conRepo(async (r) => {
    const env: NodeJS.ProcessEnv = { ...process.env, VERIF_DESENLACE: r.desenlace };
    delete env['FRENO_VERIFICACION'];
    const entrada = JSON.stringify({ hook_event_name: 'Stop', stop_hook_active: false, cwd: r.raiz });
    await writeFile(r.desenlace, 'ko', 'utf8');
    const rojo = spawnSync(process.execPath, [ENTRADA_HOOK], { input: entrada, encoding: 'utf8', env });
    assert.equal(rojo.status, 2, rojo.stderr);
    assert.match(rojo.stderr, /salio con codigo 3/);
    await writeFile(path.join(r.raiz, 'otro.txt'), 'y', 'utf8');
    await writeFile(r.desenlace, 'ok', 'utf8');
    const verde = spawnSync(process.execPath, [ENTRADA_HOOK], { input: entrada, encoding: 'utf8', env });
    assert.equal(verde.status, 0, verde.stderr);
    assert.equal(verde.stderr, '');
    const basura = spawnSync(process.execPath, [ENTRADA_HOOK], { input: 'basura', encoding: 'utf8', env });
    assert.equal(basura.status, 0);
  });
});

test('freno: hooks.json declara el Stop en forma exec, con el tope que usa el codigo y sin nombrar el producto', () => {
  const texto = readFileSync(path.join(RAIZ_PLUGIN, 'hooks', 'hooks.json'), 'utf8');
  const j = JSON.parse(texto) as {
    description: string;
    hooks: { Stop: { hooks: { type: string; command: string; args: string[]; timeout: number }[] }[] };
  };
  const stop = j.hooks.Stop[0]?.hooks[0];
  assert.ok(stop);
  assert.equal(stop.type, 'command');
  assert.equal(stop.command, 'node');
  assert.deepEqual(stop.args, ['${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/stop-verificacion.js']);
  assert.equal(stop.timeout, TECHO_HOOK_S);
  assert.ok(existsSync(ENTRADA_HOOK), 'el punto de entrada existe compilado en dist/src');
  assert.doesNotMatch(j.description, /taskcode|TASK-\d/i);
});
