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
import { leerCostes } from '../../src/core/coste-registro.js';
import { TRANSCRIPCION_EJEMPLO, USO_EJEMPLO } from '../helpers/transcripcion-ejemplo.js';

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

// ---------------------------------------------------------------------
// TASK-063: fila de desglose en la tabla ## Coste
// ---------------------------------------------------------------------

async function cuerpo(tareasRoot: string): Promise<{ body: string; ruta: string }> {
  const t = await readTareaFile(tareasRoot, ID);
  assert.ok(t);
  return { body: t.body, ruta: t.filePath };
}

test('TASK-063 --agente: deja la fila con el desglose y las lecturas del .jsonl, junto al total y en el mismo commit', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      const antes = await cuerpo(tareasRoot);
      assert.deepEqual(leerCostes(antes.body), [], 'la tarea nace sin tabla');
      await transcripcion(config, 'proy-1', 'sesion-1', A, TRANSCRIPCION_EJEMPLO.split('\n'));
      const commits = Number(git(['rev-list', '--count', 'HEAD'], repo).trim());

      const r = coste(repo, config, [ID, '--fase', 'implementacion', '--agente', A]);
      assert.equal(r.status, 0, r.stderr);

      assert.deepEqual(await valor(tareasRoot), [null, USO_EJEMPLO.tokens, null], 'el total sigue en el frontmatter');
      const despues = await cuerpo(tareasRoot);
      assert.ok(despues.body.startsWith(antes.body.replace(/\n+$/, '')), 'el cuerpo anterior queda intacto');
      const filas = leerCostes(despues.body);
      assert.equal(filas.length, 1);
      const fila = filas[0];
      assert.ok(fila);
      assert.match(fila.fecha, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      assert.deepEqual(
        { ...fila, fecha: '' },
        {
          fecha: '',
          fase: 'implementacion',
          fuente: `agente:${A}`,
          entrada: USO_EJEMPLO.entrada,
          cacheEscritura: USO_EJEMPLO.cacheEscritura,
          cacheLectura: USO_EJEMPLO.cacheLectura,
          salida: USO_EJEMPLO.salida,
          lecturas: 9,
          total: USO_EJEMPLO.tokens,
        }
      );
      // Un solo commit, con solo tarea.md, que lleva a la vez la fila y el total.
      assert.equal(Number(git(['rev-list', '--count', 'HEAD'], repo).trim()), commits + 1);
      const rel = path.relative(repo, despues.ruta).split(path.sep).join('/');
      assert.deepEqual(git(['show', '--name-only', '--format=', 'HEAD'], repo).trim().split('\n'), [rel]);
      const diff = git(['show', '--format=', 'HEAD'], repo);
      assert.match(diff, /^\+tokens_implementacion: 602$/m);
      assert.match(diff, /^\+\| \S+ \| implementacion \| agente:a1b2c3d4e5f60718 \| 33 \| 50 \| 500 \| 19 \| 9 \| 602 \|$/m);
      assert.equal(git(['status', '--porcelain'], repo).trim(), '');
    });
  });
});

test('TASK-063: varios --agente suman el desglose en UNA fila; --tokens deja otra fila manual con solo el total', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      await transcripcion(config, 'proy-1', 'sesion-1', A, TRANSCRIPCION_EJEMPLO.split('\n'));
      await transcripcion(config, 'proy-2', 'sesion-2', B, [linea('m1', 40, 10)]);
      assert.equal(coste(repo, config, [ID, '--fase', 'revision', '--agente', A, '--agente', B]).status, 0);
      assert.equal(coste(repo, config, [ID, '--fase', 'revision', '--tokens', '1000']).status, 0);

      assert.deepEqual(await valor(tareasRoot), [null, null, USO_EJEMPLO.tokens + 50 + 1000]);
      const filas = leerCostes((await cuerpo(tareasRoot)).body).map((f) => ({ ...f, fecha: '' }));
      assert.deepEqual(filas, [
        {
          fecha: '',
          fase: 'revision',
          fuente: `agente:${A},${B}`,
          entrada: USO_EJEMPLO.entrada + 40,
          cacheEscritura: USO_EJEMPLO.cacheEscritura,
          cacheLectura: USO_EJEMPLO.cacheLectura,
          salida: USO_EJEMPLO.salida + 10,
          lecturas: USO_EJEMPLO.lecturas,
          total: USO_EJEMPLO.tokens + 50,
        },
        {
          fecha: '',
          fase: 'revision',
          fuente: 'manual',
          entrada: null,
          cacheEscritura: null,
          cacheLectura: null,
          salida: null,
          lecturas: null,
          total: 1000,
        },
      ]);
      // La suma de las filas cuadra con el total del frontmatter.
      assert.equal(
        filas.reduce((s, f) => s + f.total, 0),
        (await valor(tareasRoot))[2]
      );
    });
  });
});

test('TASK-063: una tarea con tabla ## Coste sigue siendo valida para doctor, igual que una sin ella', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      const tareasDe = (): { nivel: string; mensaje: string } => {
        const r = spawnSync(process.execPath, [TASKCTL, 'doctor', '--json'], { cwd: repo, encoding: 'utf8' });
        const json = JSON.parse(r.stdout) as { comprobaciones: { id: string; nivel: string; mensaje: string }[] };
        const c = json.comprobaciones.find((x) => x.id === 'tareas');
        assert.ok(c, r.stdout);
        return c;
      };
      assert.equal(tareasDe().nivel, 'ok', 'sin tabla');
      await transcripcion(config, 'p', 's', A, [linea('m1', 5, 5)]);
      assert.equal(coste(repo, config, [ID, '--fase', 'diseno', '--agente', A]).status, 0);
      assert.equal(leerCostes((await cuerpo(tareasRoot)).body).length, 1);
      const c = tareasDe();
      assert.equal(c.nivel, 'ok', c.mensaje);
    });
  });
});

test('TASK-065 --agente reanudado: con el id ya anotado en la fase registra solo lo que crecio la transcripcion, y metricas no lo avisa', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      // Primer trabajo del agente: m1 = 100 de entrada + 20 de salida.
      await transcripcion(config, 'p', 's', A, [linea('m1', 100, 20)]);
      assert.equal(coste(repo, config, [ID, '--fase', 'implementacion', '--agente', A]).status, 0);
      assert.deepEqual(await valor(tareasRoot), [null, 120, null]);

      // Se reanuda el MISMO agente: su transcripcion acumula m1 y el trabajo nuevo, m2 (200 + 30).
      await transcripcion(config, 'p', 's', A, [linea('m1', 100, 20), linea('m2', 200, 30)]);
      const r = coste(repo, config, [ID, '--fase', 'implementacion', '--agente', A]);
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /\+230 tokens de implementacion/);
      assert.match(r.stdout, /Ya anotado en implementacion: a1b2c3d4e5f60718\. Es un agente reanudado/);
      assert.deepEqual(await valor(tareasRoot), [null, 350, null], '120 + 230, no 120 + 350');
      const filas = leerCostes((await cuerpo(tareasRoot)).body);
      assert.deepEqual(
        filas.map((f) => [f.fuente, f.entrada, f.salida, f.total]),
        [
          [`agente:${A}`, 100, 20, 120],
          [`agente:dif:${A}`, 200, 30, 230],
        ]
      );

      // Una tercera vez sin que crezca: nada que registrar, y no se toca nada.
      const antes = head(repo);
      const igual = coste(repo, config, [ID, '--fase', 'implementacion', '--agente', A]);
      assert.equal(igual.status, 1);
      assert.match(igual.stderr, /ya esta anotado en esta fase con 350 tokens y su transcripcion no ha crecido/);
      assert.equal(head(repo), antes);

      // Crece otra vez: la diferencia es contra todo lo anotado (la fila original y la de diferencia).
      await transcripcion(config, 'p', 's', A, [linea('m1', 100, 20), linea('m2', 200, 30), linea('m3', 5, 5)]);
      assert.equal(coste(repo, config, [ID, '--fase', 'implementacion', '--agente', A]).status, 0);
      assert.deepEqual(await valor(tareasRoot), [null, 360, null]);

      // En otra fase el mismo id no esta anotado: cuenta entero.
      assert.equal(coste(repo, config, [ID, '--fase', 'revision', '--agente', A]).status, 0);
      assert.deepEqual(await valor(tareasRoot), [null, 360, 360]);

      // metricas: ni repetido ni descuadre (el desglose cuadra con tokens_implementacion).
      const m = spawnSync(process.execPath, [TASKCTL, 'metricas', '--tokens'], { cwd: repo, encoding: 'utf8' });
      assert.equal(m.status, 0, m.stderr);
      assert.doesNotMatch(m.stderr, /aparece en \d+ filas/);
      assert.doesNotMatch(m.stderr, /supera tokens_/);
    });
  });
});

test('TASK-065 --agente reanudado: un id anotado junto a otro en la misma fila aborta (no se sabe cuanto es suyo)', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await conConfig(async (config) => {
      await hastaCodigo(repo, tareasRoot);
      await transcripcion(config, 'p', 's', A, [linea('m1', 10, 10)]);
      await transcripcion(config, 'p', 's', B, [linea('m1', 5, 5)]);
      assert.equal(coste(repo, config, [ID, '--fase', 'diseno', '--agente', A, '--agente', B]).status, 0);
      await transcripcion(config, 'p', 's', A, [linea('m1', 10, 10), linea('m2', 1, 1)]);
      const antes = head(repo);
      const r = coste(repo, config, [ID, '--fase', 'diseno', '--agente', A]);
      assert.equal(r.status, 1);
      assert.match(r.stderr, /ya esta anotado en "## Coste" de diseno en una fila .* junto a otros agentes.*--tokens N/s);
      assert.equal(head(repo), antes);
      assert.deepEqual(await valor(tareasRoot), [30, null, null]);
    });
  });
});
