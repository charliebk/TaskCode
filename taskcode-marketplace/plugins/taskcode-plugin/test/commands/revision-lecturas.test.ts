/**
 * TASK-081: lecturas de los revisores por (ronda, revisor), de punta a punta y
 * contra recursos reales: repos Git temporales, un CLAUDE_CONFIG_DIR temporal
 * con `.jsonl` escritos a mano y el CLI de verdad (sin mocks).
 *
 *  - `registrar-coste --fase revision --agente ...` deja UNA FILA POR AGENTE con
 *    la ronda y el revisor que deduce de su transcripcion.
 *  - `metricas --tokens` los pinta en un bloque aparte, sin tocar la tabla, sin
 *    leer `~/.claude` y sin escribir nada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readTareaFile } from '../../src/fs/task-store.js';
import { leerCostes } from '../../src/core/coste-registro.js';
import { ID, CONFIG_AUTO, TASKCTL, git, commitAll, withRepo, hastaCodigo } from '../helpers/automatico-fixtures.js';
import { COSTE_POR_LECTURA, promptDeRevision, transcripcionRevisor } from '../helpers/transcripcion-revision.js';

const X = 'a1b2c3d4e5f60711';
const Y = 'a1b2c3d4e5f60722';
const R2 = 'a1b2c3d4e5f60733';
const Z = 'a1b2c3d4e5f60744';
const W = 'a1b2c3d4e5f60755';

async function transcripcion(config: string, agente: string, lineas: string[]): Promise<void> {
  const dir = path.join(config, 'projects', 'proy', 'sesion', 'subagents');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `agent-${agente}.jsonl`), lineas.join('\n') + '\n', 'utf8');
}

async function conConfig(fn: (config: string) => Promise<void>): Promise<void> {
  const config = await mkdtemp(path.join(tmpdir(), 'taskctl-claude-config-'));
  try {
    await fn(config);
  } finally {
    await rm(config, { recursive: true, force: true });
  }
}

type Salida = { status: number | null; stdout: string; stderr: string };

function taskctl(repo: string, config: string, args: string[]): Salida {
  const r = spawnSync(process.execPath, [TASKCTL, ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_CONFIG_DIR: config },
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

function ok(repo: string, config: string, args: string[]): Salida {
  const r = taskctl(repo, config, args);
  assert.equal(r.status, 0, `${args.join(' ')}: ${r.stderr}`);
  return r;
}

const dirRev = (tareasRoot: string): string => path.join(tareasRoot, '02-en-curso', ID, 'revision');

function informe(filas: string[]): string {
  return [
    '# Informe de revision',
    '',
    '- Veredicto: aprobada',
    '',
    '## Hallazgos',
    '',
    '| ID | Severidad | Estado | Fichero | Origen |',
    '|---|---|---|---|---|',
    ...filas,
    '',
  ].join('\n');
}

async function escribir(tareasRoot: string, nombre: string, texto: string): Promise<void> {
  await mkdir(dirRev(tareasRoot), { recursive: true });
  await writeFile(path.join(dirRev(tareasRoot), nombre), texto, 'utf8');
}

/** Filas de datos del bloque «Lecturas de revision por revisor y ronda» de la salida de `metricas --tokens`. */
function bloque(stdout: string): string[][] {
  const lineas = stdout.split('\n');
  const i = lineas.findIndex((l) => l === 'Lecturas de revision por revisor y ronda:');
  assert.ok(i >= 0, `no hay bloque de lecturas en:\n${stdout}`);
  const filas: string[][] = [];
  for (let j = i + 3; j < lineas.length && (lineas[j] as string).startsWith('|'); j++) {
    filas.push((lineas[j] as string).slice(1, -1).split('|').map((c) => c.trim()));
  }
  assert.match(lineas[i + 1] as string, /^\| tarea +\| ronda +\| revisor +\| lecturas +\| entrada +\| cache_lect +\| crit +\| imp +\|$/);
  return filas;
}

const FILAS_X1 = [
  '| CRI-1 | CRITICO | corregido | app.txt | implementacion |',
  '| IMP-1 | IMPORTANTE | abierto | app.txt | plan |',
  '| IMP-2 | **Importante** (ronda 1) | aceptado | app.txt | plan |',
  '| MEN-1 | MENOR | aceptado | app.txt | plan |',
];

test('metricas --tokens: dos revisores en r1 y uno en r2 salen como (ronda, revisor, lecturas) exactos, con sus CRITICO/IMPORTANTE, sin escribir nada ni leer ~/.claude', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      await transcripcion(config, X, transcripcionRevisor(promptDeRevision('peticion-revision-1-x-reviewer.md'), 3));
      await transcripcion(config, Y, transcripcionRevisor(promptDeRevision('peticion-revision-1-y-reviewer.md'), 5));
      await transcripcion(config, R2, transcripcionRevisor(promptDeRevision('peticion-revision-2-x-reviewer.md'), 2));

      const antes = Number(git(['rev-list', '--count', 'HEAD'], repo).trim());
      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', X, '--agente', Y]);
      assert.equal(Number(git(['rev-list', '--count', 'HEAD'], repo).trim()), antes + 1, 'dos agentes, UN commit');
      const tras1 = await readTareaFile(tareasRoot, ID);
      assert.deepEqual(
        leerCostes(tras1?.body ?? '').map((f) => [f.fuente, f.ronda, f.revisor, f.lecturas]),
        [
          [`agente:${X}`, 1, 'x-reviewer', 3],
          [`agente:${Y}`, 1, 'y-reviewer', 5],
        ],
        'una fila por agente, cada una con lo suyo'
      );
      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', R2]);
      assert.equal((await readTareaFile(tareasRoot, ID))?.task.tokens_revision, 10 * COSTE_POR_LECTURA.total);

      await escribir(tareasRoot, 'informe-revision-1-x-reviewer.md', informe(FILAS_X1));
      await escribir(tareasRoot, 'informe-revision-1-y-reviewer.md', informe(['| IMP-1 | IMPORTANTE | corregido | app.txt | plan |']));
      await escribir(tareasRoot, 'informe-revision-2-x-reviewer.md', informe(['| (ninguno) | — | sin hallazgos | — | — |']));
      commitAll(repo, 'docs: informes de revision');

      const r = ok(repo, config, ['metricas', '--tokens']);
      assert.deepEqual(bloque(r.stdout), [
        [ID, '1', 'x-reviewer', '3', '30', '300', '1', '2'],
        [ID, '1', 'y-reviewer', '5', '50', '500', '0', '1'],
        [ID, '2', 'x-reviewer', '2', '20', '200', '0', '0'],
      ]);
      assert.match(r.stdout, /lecturas = LLAMADAS de lectura del revisor, no bytes/);
      assert.equal(git(['status', '--porcelain'], repo).trim(), '', 'sin --escribir, metricas no deja nada sucio');

      // --json lleva lo mismo, con los null a la vista.
      const j = JSON.parse(ok(repo, config, ['metricas', '--json']).stdout) as {
        lecturasRevision: { id: string; ronda: number | null; revisor: string | null; lecturas: number | null; critico: number | null; importante: number | null }[];
      };
      assert.deepEqual(
        j.lecturasRevision.map((g) => [g.id, g.ronda, g.revisor, g.lecturas, g.critico, g.importante]),
        [
          [ID, 1, 'x-reviewer', 3, 1, 2],
          [ID, 1, 'y-reviewer', 5, 0, 1],
          [ID, 2, 'x-reviewer', 2, 0, 0],
        ]
      );

      // El bloque generado de docs/METRICAS.md no cambia de forma: lo nuevo NO va en --escribir.
      ok(repo, config, ['metricas', '--tokens', '--escribir']);
      const md = await readFile(path.join(repo, 'docs', 'METRICAS.md'), 'utf8');
      assert.doesNotMatch(md, /x-reviewer|Lecturas de revision|cache_lect/);
    });
  });
});

test('metricas no lee ~/.claude: con el CLAUDE_CONFIG_DIR borrado entre registrar-coste y metricas, las lecturas siguen saliendo y lo ausente es "—", no 0', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    const config = await mkdtemp(path.join(tmpdir(), 'taskctl-claude-config-'));
    await hastaCodigo(repo, tareasRoot);
    await transcripcion(config, X, transcripcionRevisor(promptDeRevision('peticion-revision-1-x-reviewer.md'), 4));
    await transcripcion(config, Z, transcripcionRevisor(null, 6)); // no nombra su peticion: sin atribuir
    ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', X, '--agente', Z]);
    await rm(config, { recursive: true, force: true });

    // Ni existe el directorio ni hay otro: si metricas lo buscara, fallaria.
    const r = ok(repo, config, ['metricas', '--tokens']);
    assert.deepEqual(bloque(r.stdout), [
      [ID, '1', 'x-reviewer', '4', '40', '400', '—', '—'],
      [ID, '—', '—', '6', '60', '600', '—', '—'],
    ]);
    assert.doesNotMatch(bloque(r.stdout).flat().join(' '), /\b0\b/, 'lo ausente nunca se pinta como 0');
  });
});

test('filas antiguas de 9 columnas: se leen con sus totales y revisor "—", doctor las da por validas y registrar-coste no las cuenta dos veces', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      const t = await readTareaFile(tareasRoot, ID);
      assert.ok(t);
      // Tarea con la tabla ANTIGUA: cabecera y fila de 9 columnas, y su total en el frontmatter.
      const antiguo =
        t.body.replace(/\n*$/, '\n') +
        '\n## Coste\n\n' +
        '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |\n' +
        '|---|---|---|---|---|---|---|---|---|\n' +
        `| 2026-10-25T10:00:00Z | revision | agente:${X} | 20 | 20 | 200 | 10 | 2 | 250 |\n`;
      const crudo = await readFile(t.filePath, 'utf8');
      const sinCuerpo = crudo.slice(0, crudo.indexOf(t.body.slice(0, 20)));
      assert.match(sinCuerpo, /^tokens_revision:.*$/m);
      await writeFile(t.filePath, sinCuerpo.replace(/^tokens_revision:.*$/m, 'tokens_revision: 250') + antiguo, 'utf8');
      commitAll(repo, 'docs: tabla de coste antigua');

      await transcripcion(config, X, transcripcionRevisor(promptDeRevision('peticion-revision-1-x-reviewer.md'), 2));
      const m = ok(repo, config, ['metricas', '--tokens']);
      assert.deepEqual(bloque(m.stdout), [[ID, '—', '—', '2', '20', '200', '—', '—']]);
      assert.doesNotMatch(m.stderr, /supera tokens_|esta vacio pero/, 'los totales de la fila antigua cuadran');

      const doctor = JSON.parse(taskctl(repo, config, ['doctor', '--json']).stdout) as {
        comprobaciones: { id: string; nivel: string; mensaje: string }[];
      };
      const tareas = doctor.comprobaciones.find((c) => c.id === 'tareas');
      assert.equal(tareas?.nivel, 'ok', tareas?.mensaje);

      // Se reanuda el mismo agente: su transcripcion acumula lo ya anotado, y solo suma lo que crecio.
      await transcripcion(config, X, transcripcionRevisor(promptDeRevision('peticion-revision-1-x-reviewer.md'), 3));
      const r = ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', X]);
      assert.match(r.stdout, /\+125 tokens/, 'solo la diferencia, no 375 (no doble conteo)');
      assert.equal((await readTareaFile(tareasRoot, ID))?.task.tokens_revision, 375);
      const filas = leerCostes((await readTareaFile(tareasRoot, ID))?.body ?? '');
      assert.deepEqual(
        filas.map((f) => [f.fuente, f.total, f.ronda, f.revisor, f.lecturas]),
        [
          [`agente:${X}`, 250, null, null, 2],
          [`agente:dif:${X}`, 125, 1, 'x-reviewer', 1],
        ]
      );
      const m2 = ok(repo, config, ['metricas', '--tokens']);
      assert.deepEqual(bloque(m2.stdout), [
        [ID, '1', 'x-reviewer', '1', '10', '100', '—', '—'],
        [ID, '—', '—', '2', '20', '200', '—', '—'],
      ]);
      assert.doesNotMatch(m2.stderr, /aparece en \d+ filas/);
    });
  });
});

test('--ronda/--revisor: solo con un unico --agente, validados contra las peticiones que hay en revision/; texto libre aborta sin tocar nada', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      await escribir(tareasRoot, 'peticion-revision-1-x-reviewer.md', '# peticion\n');
      await escribir(tareasRoot, 'peticion-revision-1-y-reviewer.md', '# peticion\n');
      await escribir(tareasRoot, 'peticion-revision-2.md', '# peticion\n');
      await transcripcion(config, Z, transcripcionRevisor(null, 2));
      await transcripcion(config, X, transcripcionRevisor(null, 1));
      await transcripcion(config, W, transcripcionRevisor(promptDeRevision('peticion-revision-1-x-reviewer.md'), 1));
      const head = (): string => git(['rev-parse', 'HEAD'], repo).trim();
      const antes = head();

      const casos: [string[], RegExp][] = [
        [['--agente', Z, '--ronda', '1', '--revisor', 'texto-libre'], /--revisor "texto-libre" no es ninguno de los revisores de la ronda 1: x-reviewer, y-reviewer/],
        [['--agente', Z, '--ronda', '1'], /--revisor "" no es ninguno de los revisores de la ronda 1/],
        [['--agente', Z, '--ronda', '7', '--revisor', 'x-reviewer'], /--ronda 7 no existe/],
        [['--agente', Z, '--revisor', 'x-reviewer'], /--ronda necesita un entero/],
        [['--agente', Z, '--ronda', 'abc'], /--ronda "abc" no es un entero/],
        [['--agente', Z, '--ronda', '0'], /--ronda "0" no es un entero/],
        [['--agente', Z, '--agente', X, '--ronda', '1', '--revisor', 'x-reviewer'], /UN unico --agente/],
        [['--tokens', '10', '--ronda', '1'], /UN unico --agente/],
        [['--agente', W, '--ronda', '1', '--revisor', 'y-reviewer'], /nombra la ronda 1 y el revisor x-reviewer, y --ronda\/--revisor dicen otra cosa/],
      ];
      for (const [extra, esperado] of casos) {
        const r = taskctl(repo, config, ['registrar-coste', ID, '--fase', 'revision', ...extra]);
        assert.equal(r.status, 1, extra.join(' '));
        assert.match(r.stderr, esperado, extra.join(' '));
      }
      const fuera = taskctl(repo, config, ['registrar-coste', ID, '--fase', 'diseno', '--agente', Z, '--ronda', '1', '--revisor', 'x-reviewer']);
      assert.equal(fuera.status, 1);
      assert.match(fuera.stderr, /solo valen con --fase revision/);
      assert.equal(head(), antes, 'ningun error commitea');
      assert.equal((await readTareaFile(tareasRoot, ID))?.task.tokens_revision, null);

      // Validos: el sustituto vale cuando la transcripcion no nombra la peticion...
      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', Z, '--ronda', '1', '--revisor', 'y-reviewer']);
      // ...una ronda sin fragmentar solo necesita --ronda...
      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', X, '--ronda', '2']);
      // ...y si coincide con lo deducido, tambien se acepta.
      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', W, '--ronda', '1', '--revisor', 'x-reviewer']);
      assert.deepEqual(
        leerCostes((await readTareaFile(tareasRoot, ID))?.body ?? '').map((f) => [f.fuente, f.ronda, f.revisor]),
        [
          [`agente:${Z}`, 1, 'y-reviewer'],
          [`agente:${X}`, 2, ''],
          [`agente:${W}`, 1, 'x-reviewer'],
        ]
      );
    });
  });
});

test('lo que no se deduce ni se declara queda sin atribuir (ronda "-"), y las fases que no son revision siguen con UNA fila por llamada', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      await transcripcion(config, Z, transcripcionRevisor(null, 2));
      await transcripcion(config, X, transcripcionRevisor(promptDeRevision('peticion-revision-1.md'), 1));
      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', Z, '--agente', X]);
      ok(repo, config, ['registrar-coste', ID, '--fase', 'implementacion', '--agente', Z, '--agente', X]);
      const filas = leerCostes((await readTareaFile(tareasRoot, ID))?.body ?? '');
      assert.deepEqual(
        filas.map((f) => [f.fase, f.fuente, f.ronda, f.revisor]),
        [
          ['revision', `agente:${Z}`, null, null],
          ['revision', `agente:${X}`, 1, ''],
          ['implementacion', `agente:${Z},${X}`, null, null],
        ]
      );
      const crudo = await readFile((await readTareaFile(tareasRoot, ID))?.filePath ?? '', 'utf8');
      assert.match(crudo, new RegExp(`agente:${Z} \\| 20 \\| 20 \\| 200 \\| 10 \\| 2 \\| 250 \\| - \\| - \\|`));
      assert.match(crudo, new RegExp(`agente:${X} \\| 10 \\| 10 \\| 100 \\| 5 \\| 1 \\| 125 \\| 1 \\| - \\|`));
    });
  });
});
