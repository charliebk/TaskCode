/**
 * TASK-023: `taskctl metricas --tokens` y `--tokens --escribir` por CLI,
 * contra repos Git temporales reales. Una tarea terminada con coste
 * registrado y otra sin ningun dato: la segunda sale en la tabla y no en el
 * resumen. El bloque de docs/METRICAS.md se regenera sin tocar ni un byte de
 * lo que lo rodea (CRLF incluido) y es idempotente.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readTareaFile } from '../../src/fs/task-store.js';
import {
  MARCADOR_FIN_TOKENS,
  MARCADOR_INICIO_TOKENS,
} from '../../src/core/metricas.js';
import {
  ID,
  CONFIG_AUTO,
  git,
  commitAll,
  cli,
  cliOk,
  withRepo,
  dirRevision,
  hastaCodigo,
  nueva,
  rellenarInforme,
} from '../helpers/automatico-fixtures.js';

const ID2 = 'TASK-002';

function celdas(salida: string, id: string): string[] {
  const linea = salida.split('\n').find((l) => l.startsWith(`| ${id} `));
  assert.ok(linea, `no hay fila de ${id} en:\n${salida}`);
  return linea
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
}

/** TASK-001 terminada con coste de diseno, implementacion y revision; TASK-002 planificada sin ningun dato. */
async function escenario(repoRoot: string, tareasRoot: string): Promise<void> {
  await hastaCodigo(repoRoot, tareasRoot);
  cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '1000']);
  cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'implementacion', '--tokens', '3000']);
  cliOk(repoRoot, ['review', ID]);
  await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
  cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
  cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '1000']);
  cliOk(repoRoot, ['finish', ID]);
  nueva(repoRoot, 'feature', 'Sin datos');
  assert.equal((await readTareaFile(tareasRoot, ID2))?.task.tokens_diseno, null);
}

const METRICAS_MD = (repoRoot: string): string => path.join(repoRoot, 'docs', 'METRICAS.md');

test('metricas --tokens: columnas por fase y total, la tarea sin datos en la tabla y fuera del resumen, y no escribe nada', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await escenario(repoRoot, tareasRoot);

    const sin = cliOk(repoRoot, ['metricas']);
    assert.doesNotMatch(sin.stdout, /tok_/, 'sin --tokens la salida es la de siempre');
    assert.doesNotMatch(sin.stdout, /Coste en tokens/);

    const r = cliOk(repoRoot, ['metricas', '--tokens']);
    const cab = r.stdout.split('\n').find((l) => l.startsWith('| id ')) as string;
    assert.match(cab, /\| tok_diseno +\| tok_curso +\| tok_revision +\| tok_total +\|$/);
    assert.deepEqual(celdas(r.stdout, ID).slice(-4), ['1000', '3000', '1000', '5000']);
    assert.deepEqual(celdas(r.stdout, ID2).slice(-4), ['—', '—', '—', '—']);

    // El resumen cuenta 1 tarea con dato de 2 y reparte el % sobre el total.
    assert.match(r.stdout, /Coste en tokens por sprint:\n\| sprint +\| con dato\/total/);
    assert.match(r.stdout, /\| 0 +\| 1\/2 +\| 1000 \(media 1000, 20\.0%\) +\| 3000 \(media 3000, 60\.0%\) +\| 1000 \(media 1000, 20\.0%\) +\| 5000 \(media 5000\) +\|/);
    assert.match(r.stdout, /Coste en tokens por complejidad declarada:\n\| complejidad +\| con dato\/total/);
    assert.match(r.stdout, /\| simple +\| 1\/2 /);
    assert.match(r.stdout, /Las pausas no se descuentan/, 'sigue llevando la nota de calendario');
    assert.doesNotMatch(r.stdout, /NaN|undefined/);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'solo lectura');
    assert.equal(await stat(METRICAS_MD(repoRoot)).then(() => true, () => false), false);
  });
});

test('metricas --tokens --heuristica: ambas familias de columnas, y el resumen de tokens sobre la muestra', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await escenario(repoRoot, tareasRoot);
    const r = cliOk(repoRoot, ['metricas', '--tokens', '--heuristica']);
    const cab = r.stdout.split('\n').find((l) => l.startsWith('| id ')) as string;
    assert.match(cab, /\| tok_total +\| puntos +\| nivel_heuristico +\|$/);
    assert.deepEqual(celdas(r.stdout, ID).slice(7 + 1, 7 + 5), ['1000', '3000', '1000', '5000']);
    assert.ok(!r.stdout.includes(`| ${ID2} `), 'la muestra heuristica solo trae terminadas con informes');
    assert.match(r.stdout, /Muestra: 1 tareas terminadas/);
    assert.match(r.stdout, /\| 0 +\| 1\/1 /);
    assert.match(r.stdout, /Por complejidad declarada:\n {2}simple/);
  });
});

test('metricas: combinaciones de flags invalidas se rechazan antes de escribir nada', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await escenario(repoRoot, tareasRoot);
    const casos: [string[], RegExp][] = [
      [['--escribir'], /--escribir solo se admite con --tokens/],
      [['--tokens', '--escribir', '--heuristica'], /--escribir no se puede combinar con --heuristica/],
      [['--tokens=1'], /--tokens no lleva valor/],
      [['--tokens', '5'], /--tokens no lleva valor|no admite argumentos sueltos/],
      [['--tokens', '--escribir=si'], /"--escribir" no lleva valor/],
      [['--tokenz'], /flag desconocido "--tokenz".*Quiza quisiste decir "--tokens"/s],
    ];
    for (const [args, esperado] of casos) {
      const r = cli(repoRoot, ['metricas', ...args]);
      assert.equal(r.status, 1, args.join(' '));
      assert.match(r.stderr, esperado, args.join(' '));
      assert.equal(r.stdout, '', `${args.join(' ')}: no saca tabla`);
    }
    assert.equal(await stat(METRICAS_MD(repoRoot)).then(() => true, () => false), false);
  });
});

test('metricas --tokens --escribir: crea el fichero si no existe, y la segunda vez no cambia ni un byte', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await escenario(repoRoot, tareasRoot);
    const a = cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
    assert.match(a.stdout, /Regenerado el bloque de tokens de .*METRICAS\.md \(recuerda commitearlo\)/);
    const primero = await readFile(METRICAS_MD(repoRoot));
    const texto = primero.toString('utf8');
    assert.ok(texto.startsWith(`${MARCADOR_INICIO_TOKENS}\n`));
    assert.ok(texto.endsWith(`${MARCADOR_FIN_TOKENS}\n`));
    assert.match(texto, /\| TASK-001 +\| 0 +\| simple +\| 1000 +\| 3000 +\| 1000 +\| 5000 +\|/);
    assert.match(texto, /\| TASK-002 +\| 0 +\| simple +\| — +\| — +\| — +\| — +\|/);
    assert.doesNotMatch(texto, /\d{4}-\d{2}-\d{2}/, 'ninguna fecha: no ensucia diffs');
    assert.ok(!texto.includes('origen'), 'solo columnas que no dependen de git log');

    const b = cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
    assert.match(b.stdout, /ya al dia: sin cambios/);
    assert.ok((await readFile(METRICAS_MD(repoRoot))).equals(primero), 'idempotente');

    // No commitea: lo deja a la persona, como board --escribir.
    assert.match(git(['status', '--porcelain'], repoRoot), /\?\? docs\//);
  });
});

test('metricas --tokens --escribir: solo cambia el bloque; el resto (CRLF, acentos, lo de despues) queda byte a byte', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await escenario(repoRoot, tareasRoot);
    const antes = '# Métricas\r\n\r\nUna sección con acentos — y CRLF.\r\n\r\n';
    const despues = '\r\n## 12. Lo escrito a mano\r\n\r\nNo tocar.\r\n\r\n```\r\nbloque de codigo\r\n```';
    await mkdir(path.dirname(METRICAS_MD(repoRoot)), { recursive: true });
    await writeFile(METRICAS_MD(repoRoot), `${antes}${MARCADOR_INICIO_TOKENS}\r\nVIEJO\r\n${MARCADOR_FIN_TOKENS}${despues}`, 'utf8');
    commitAll(repoRoot, 'docs: metricas con bloque viejo');

    cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
    const buf = await readFile(METRICAS_MD(repoRoot));
    const t = buf.toString('utf8');
    assert.ok(t.startsWith(antes), 'lo de antes, byte a byte');
    assert.ok(t.endsWith(despues), 'lo de despues, byte a byte, sin salto final anadido');
    assert.ok(!t.includes('VIEJO'));
    const bloque = t.slice(antes.length, t.length - despues.length);
    assert.ok(bloque.startsWith(MARCADOR_INICIO_TOKENS) && bloque.endsWith(MARCADOR_FIN_TOKENS));
    assert.ok(!/[^\r]\n/.test(t), 'el bloque nuevo usa CRLF como el fichero');
    assert.match(bloque, /\| TASK-001 +\| 0 +\| simple +\| 1000 /);
    commitAll(repoRoot, 'docs: metricas regeneradas');

    // Idempotente: sin cambios de datos, ni un byte y nada que commitear.
    const b = cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
    assert.match(b.stdout, /sin cambios/);
    assert.ok((await readFile(METRICAS_MD(repoRoot))).equals(buf));
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');

    // Un dato nuevo cambia el bloque y solo el bloque.
    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '500']);
    cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
    const t2 = await readFile(METRICAS_MD(repoRoot), 'utf8');
    assert.ok(t2.startsWith(antes) && t2.endsWith(despues));
    assert.match(t2, /\| TASK-001 +\| 0 +\| simple +\| 1000 +\| 3000 +\| 1500 +\| 5500 +\|/);
  });
});

test('metricas --tokens --escribir: sin marcadores anade el bloque al final y deja lo anterior intacto', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await escenario(repoRoot, tareasRoot);
    const previo = '# Métricas\n\nTexto escrito a mano.\n';
    await mkdir(path.dirname(METRICAS_MD(repoRoot)), { recursive: true });
    await writeFile(METRICAS_MD(repoRoot), previo, 'utf8');
    cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
    const t = await readFile(METRICAS_MD(repoRoot), 'utf8');
    assert.ok(t.startsWith(`${previo}\n${MARCADOR_INICIO_TOKENS}\n`));
    assert.ok(t.endsWith(`${MARCADOR_FIN_TOKENS}\n`));
  });
});

test('metricas --tokens --escribir: marcadores rotos o una tarea.md invalida abortan sin tocar el fichero', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await escenario(repoRoot, tareasRoot);
    const roto = `# M\n\n${MARCADOR_INICIO_TOKENS}\nsin cierre\n`;
    await mkdir(path.dirname(METRICAS_MD(repoRoot)), { recursive: true });
    await writeFile(METRICAS_MD(repoRoot), roto, 'utf8');
    const r = cli(repoRoot, ['metricas', '--tokens', '--escribir']);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /marcadores del bloque de tokens mal puestos/);
    assert.equal(await readFile(METRICAS_MD(repoRoot), 'utf8'), roto);

    // Una tarea.md invalida saldria del bloque en silencio: no se escribe.
    await writeFile(METRICAS_MD(repoRoot), '# M\n', 'utf8');
    const t2 = await readTareaFile(tareasRoot, ID2);
    assert.ok(t2);
    const original = await readFile(t2.filePath, 'utf8');
    await writeFile(t2.filePath, original.replace(/^tokens_diseno: null$/m, 'tokens_diseno: abc'), 'utf8');
    const i = cli(repoRoot, ['metricas', '--tokens', '--escribir']);
    assert.equal(i.status, 1);
    assert.match(i.stderr, /No se regenera docs\/METRICAS\.md con tarea\.md invalidos.*TASK-002/s);
    assert.equal(await readFile(METRICAS_MD(repoRoot), 'utf8'), '# M\n');
  });
});

test('metricas --tokens --escribir fuera de la raiz del repo no crea un docs/ fantasma', async () => {
  const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-metricas-tokens-fuera-'));
  try {
    const r = cli(fuera, ['metricas', '--tokens', '--escribir']);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /no parece la raiz de un repo con tareas/);
    assert.equal(await stat(path.join(fuera, 'docs')).then(() => true, () => false), false);
  } finally {
    await rm(fuera, { recursive: true, force: true });
  }
});
