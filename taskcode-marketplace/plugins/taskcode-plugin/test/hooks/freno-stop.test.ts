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
import { decidirStop, MARGEN_HOOK_S, TECHO_HOOK_S, parsearEntrada, timeoutEfectivoS } from '../../src/hooks/freno-stop.js';
import { describirResultado, recortarCola, type ResultadoVerificacion } from '../../src/core/informe-verificacion.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { git, sampleTask } from '../helpers/finish-fixtures.js';
import { leerProgreso, rutaProgreso } from '../../src/fs/progreso.js';

/** Ejecuta un caso dentro de un test agrupado y, si falla, rotula el error con su nombre. */
async function caso(nombre: string, fn: () => unknown): Promise<void> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof Error) e.message = `[${nombre}] ${e.message}`;
    throw e;
  }
}

/** TASK-110: en los turnos en que el freno no verifica, ni un fichero de progreso. */
function sinProgreso(raiz: string): void {
  assert.equal(existsSync(rutaProgreso(raiz) as string), false, 'no se escribe progreso si no se verifica');
}

const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
const ENTRADA_HOOK = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'stop-verificacion.js');
const RAMA = 'feature/task-071-freno';

/** Lo que hace el script segun el fichero de desenlace: ok, ko, lento, lento-hablando, ensucia, ruido. */
const SCRIPT = `
const fs = require('node:fs');
const d = fs.readFileSync(process.env.VERIF_DESENLACE, 'utf8').trim();
fs.appendFileSync(process.env.VERIF_DESENLACE + '.cuenta', 'x');
if (d === 'ok') { console.log('todo en verde'); process.exit(0); }
if (d === 'lento') { setTimeout(() => {}, 60000); }
else if (d === 'lento-hablando') { console.log('hola'); setTimeout(() => {}, 60000); }
else if (d === 'ensucia') { fs.writeFileSync('cobertura.txt', String(Date.now())); process.exit(1); }
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

test('freno: decisiones de parar, bloquear o no hacer nada segun verificacion, tarea y config', async () => {
await caso('freno: verificacion en verde deja parar, en silencio', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      const t0 = Date.now();
      const d = await decidir(r);
      assert.deepEqual(d, { codigo: 0, stderr: '' });
      assert.equal(r.ejecuciones(), 1);
      // TASK-110: el freno escribe su progreso y lo marca terminado.
      const p = leerProgreso(r.raiz);
      assert.ok(p !== null);
      assert.deepEqual(
        [p.tarea, p.fase, p.pasos, p.paso, p.terminado, p.resultado],
        ['TASK-071', 'freno', ['verificacion'], 'verificacion', true, 'ok']
      );
      assert.ok(p.inicio >= t0 - 1000 && p.inicio <= Date.now());
    })
  );
});
await caso('freno: verificacion en rojo bloquea con exit 2 y el comando, el codigo, la duracion y la cola', async () => {
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
      // TASK-110: un turno bloqueado por la verificacion en rojo deja la fase "en rojo", no "en curso" ni "abortada".
      assert.deepEqual([leerProgreso(r.raiz)?.terminado, leerProgreso(r.raiz)?.resultado], [true, 'en-rojo']);
    })
  );
});
await caso('freno: sin tarea en curso, rama ajena o sin comando no hace nada ni ejecuta el comando', async () => {
  await conRepo(
    (r) =>
      conDesenlace(r, async () => {
        await writeFile(r.desenlace, 'ko', 'utf8');
        assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
        assert.equal(r.ejecuciones(), 0);
        sinProgreso(r.raiz);
      }),
    { tarea: false }
  );
  await conRepo(
    (r) =>
      conDesenlace(r, async () => {
        await writeFile(r.desenlace, 'ko', 'utf8');
        assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
        assert.equal(r.ejecuciones(), 0);
        sinProgreso(r.raiz);
      }),
    { rama: 'feature/otra-cosa' }
  );
  await conRepo(
    (r) =>
      conDesenlace(r, async () => {
        await writeFile(r.desenlace, 'ko', 'utf8');
        assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
        assert.equal(r.ejecuciones(), 0);
        sinProgreso(r.raiz);
      }),
    { config: 'limite_wip: 1\n' }
  );
});
await caso('freno: fuera de un proyecto con tareas (o sin cwd) sale 0 sin tocar nada', async () => {
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
await caso('freno: stop_hook_active e interruptor FRENO_VERIFICACION=0 dejan parar sin ejecutar', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      await writeFile(r.desenlace, 'ko', 'utf8');
      assert.deepEqual(await decidir(r, { stop_hook_active: true }), { codigo: 0, stderr: '' });
      assert.deepEqual(await decidir(r, {}, { env: { FRENO_VERIFICACION: '0' } }), { codigo: 0, stderr: '' });
      assert.equal(r.ejecuciones(), 0);
      sinProgreso(r.raiz);
    })
  );
});
await caso('freno: config invalida con tarea en curso bloquea con el error de la config', async () => {
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
await caso('freno (MEN-1): un corte con salida corta no se rotula como truncado', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      await writeFile(r.desenlace, 'lento-hablando', 'utf8');
      const d = await decidir(r, {}, { timeoutMs: 1500 });
      assert.equal(d.codigo, 2);
      assert.match(d.stderr, /se ha cortado/);
      assert.match(d.stderr, /Salida:\n {4}hola/);
      assert.doesNotMatch(d.stderr, /truncada/);
    })
  );
});
await caso('freno (MEN-2): una tarea en curso ilegible no frena, pero se avisa', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      await writeFile(r.desenlace, 'ko', 'utf8');
      await writeFile(path.join(r.raiz, 'tareas', '02-en-curso', 'TASK-071', 'tarea.md'), '---\nid: [\n---\n', 'utf8');
      const d = await decidir(r);
      assert.equal(d.codigo, 0);
      assert.match(d.stderr, /no se pudo leer tareas[\\/]02-en-curso[\\/]TASK-071[\\/]tarea\.md/);
      assert.equal(r.ejecuciones(), 0);
    })
  );
});
await caso('informe (MEN-5): una muerte sin codigo no se describe como «codigo null»', () => {
  const base: ResultadoVerificacion = {
    estado: 'roja',
    comando: 'x',
    codigo: null,
    duracionMs: 1,
    timeoutS: 1,
    cola: '',
    bytesTotales: 0,
    error: 'senal SIGKILL',
  };
  assert.equal(describirResultado(base), 'termino de forma anormal (senal SIGKILL)');
  assert.equal(describirResultado({ ...base, codigo: 1 }), 'salio con codigo 1');
});
});

test('freno: timeouts, memo por huella, cola acotada y punto de entrada real', async () => {
await caso('freno: respeta el timeout y corta el comando (bloquea, no deja pasar)', async () => {
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
await caso('freno: timeout_verificacion por encima del tope del hook se recorta y se avisa', async () => {
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
await caso('freno: memo por huella — mismo arbol no vuelve a ejecutar, un cambio si', async () => {
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
      // IMP-1: misma ruta sucia con OTRO contenido tambien invalida el memo
      // (la huella mira el contenido, no solo la lista de rutas).
      await writeFile(path.join(r.raiz, 'nuevo.txt'), 'contenido distinto', 'utf8');
      assert.equal((await decidir(r)).codigo, 0);
      assert.equal(r.ejecuciones(), 3, 'el cambio de contenido reejecuta');
      // MEN-7: un memo de otra version no se reutiliza.
      const rutaMemo = path.join(r.raiz, '.git', 'freno-verificacion.json');
      const memo = JSON.parse(readFileSync(rutaMemo, 'utf8')) as { version: number };
      await writeFile(rutaMemo, JSON.stringify({ ...memo, version: 0 }), 'utf8');
      // TASK-111: el ultimo verde del freno omitiria este turno (mismo arbol);
      // se retira para probar solo el memo compartido.
      await rm(path.join(r.raiz, '.git', 'taskcode', 'freno-ultimo-verde.json'), { force: true });
      assert.equal((await decidir(r)).codigo, 0);
      assert.equal(r.ejecuciones(), 4, 'memo de otra version ignorado');
      // El memo no ensucia el arbol: vive bajo .git/.
      assert.equal(git(['status', '--porcelain', '--', '.taskcode', 'tareas', 'scripts'], r.raiz), '');
      assert.ok(existsSync(path.join(r.raiz, '.git', 'freno-verificacion.json')));
    })
  );
});
await caso('freno: la cola va acotada, sin ANSI, sin credenciales y sin partir UTF-8', async () => {
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
await caso('freno: el punto de entrada real, por stdin, sale con 2 en rojo y 0 en verde', async () => {
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
});

test('freno: unitarios del informe, del timeout efectivo y de hooks.json', async () => {
await caso('freno: hooks.json declara el Stop en forma exec, con el tope que usa el codigo y sin nombrar el producto', () => {
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
await caso('freno (IMP-2): el timeout efectivo nunca supera el tope del hook menos el margen', () => {
  assert.equal(TECHO_HOOK_S - MARGEN_HOOK_S, 3540, 'con 3600 s de hook quedan 60 s para escribir el informe');
  assert.deepEqual(timeoutEfectivoS(99999), { timeoutS: 3540, recortado: true });
  assert.deepEqual(timeoutEfectivoS(3541), { timeoutS: 3540, recortado: true });
  assert.deepEqual(timeoutEfectivoS(3540), { timeoutS: 3540, recortado: false });
  assert.deepEqual(timeoutEfectivoS(600), { timeoutS: 600, recortado: false });
  assert.deepEqual(timeoutEfectivoS(1), { timeoutS: 1, recortado: false });
});
await caso('freno (MEN-7): si la propia verificacion ensucia el arbol, el informe lo avisa', async () => {
  await conRepo((r) =>
    conDesenlace(r, async () => {
      await writeFile(r.desenlace, 'ensucia', 'utf8');
      const d = await decidir(r);
      assert.equal(d.codigo, 2);
      assert.match(d.stderr, /La propia verificacion ha cambiado ficheros del arbol de trabajo/);
    })
  );
});
await caso('informe (MEN-7): recortarCola no parte caracteres multibyte en una linea larga', () => {
  const { texto, recortada } = recortarCola('€'.repeat(3000), 4096, 40);
  assert.equal(recortada, true);
  assert.ok(!texto.includes('�'), 'sin caracteres partidos');
  assert.ok(Buffer.byteLength(texto, 'utf8') <= 4096);
  assert.equal(Buffer.byteLength(texto, 'utf8') % 3, 0, 'solo euros enteros');
});
});
