/**
 * TASK-143c (auditoria 4D completa, SCR-07 y SCR-08): paridad entre bash y TS.
 *
 * - La operacion de Git a medias la detectan `detect_operation_in_progress`
 *   (_gitflow-common.sh, la usan abort-merge y diagnose-repo) y
 *   `operacionEnCurso` (src/fs/git.ts). Antes eran tres copias sin test que
 *   las atara; aqui, para cada testigo, las dos dicen lo mismo.
 * - Los `ls-remote` de git.ts tienen limite de tiempo (GF_TIMEOUT_REMOTO),
 *   como `_gf_ls_remote`.
 * - finish pasa al script de hotfix/release la principal que ya resolvio.
 *
 * Repos Git temporales de verdad. Los testigos se crean a mano: las dos
 * detecciones miran ficheros del directorio de Git, y asi cada estado es
 * exacto (los de verdad, con conflicto, ya los cubre abort-merge.test.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { isRemoteAvailable, operacionEnCurso, timeoutRemotoMs } from '../../src/fs/git.js';
import { argumentosScriptMerge } from '../../src/commands/finish.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COMMON = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow', '_gitflow-common.sh').split(path.sep).join('/');
// TEST-NET-1 (RFC 5737): no responde nunca; la conexion se queda colgada.
const ORIGEN_MUERTO = 'http://192.0.2.1:9/repo.git';

function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
  return r.stdout.trim();
}

async function conRepo(fn: (repo: string) => Promise<void>): Promise<void> {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-paridad-'));
  try {
    git(['init', '-q', '-b', 'main'], repo);
    git(['config', 'user.email', 'test@example.com'], repo);
    git(['config', 'user.name', 'Test'], repo);
    await writeFile(path.join(repo, 'a.txt'), 'a\n', 'utf8');
    git(['add', '-A'], repo);
    git(['commit', '-q', '-m', 'inicial'], repo);
    await fn(repo);
  } finally {
    // Como en origin-deteccion: tras cortar un ls-remote por tiempo, su
    // git-remote-http puede seguir vivo un rato y retener la carpeta (EBUSY).
    await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

function operacionBash(repo: string): string {
  const r = spawnSync('bash', ['-c', `source "${COMMON}" >/dev/null 2>&1; detect_operation_in_progress`], {
    cwd: repo,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

const ESTADOS: { nombre: string; testigos: (gitDir: string, sha: string) => Promise<void> }[] = [
  { nombre: 'ninguna', testigos: async () => undefined },
  { nombre: 'merge', testigos: async (d, sha) => writeFile(path.join(d, 'MERGE_HEAD'), `${sha}\n`) },
  { nombre: 'rebase (rebase-merge)', testigos: async (d) => void (await mkdir(path.join(d, 'rebase-merge'))) },
  { nombre: 'rebase (rebase-apply)', testigos: async (d) => void (await mkdir(path.join(d, 'rebase-apply'))) },
  { nombre: 'cherry-pick', testigos: async (d, sha) => writeFile(path.join(d, 'CHERRY_PICK_HEAD'), `${sha}\n`) },
  { nombre: 'revert', testigos: async (d, sha) => writeFile(path.join(d, 'REVERT_HEAD'), `${sha}\n`) },
  {
    nombre: 'secuencia de revert sin REVERT_HEAD',
    testigos: async (d, sha) => {
      await mkdir(path.join(d, 'sequencer'));
      await writeFile(path.join(d, 'sequencer', 'todo'), `revert ${sha} inicial\n`);
    },
  },
  {
    nombre: 'secuencia de cherry-pick sin CHERRY_PICK_HEAD',
    testigos: async (d, sha) => {
      await mkdir(path.join(d, 'sequencer'));
      await writeFile(path.join(d, 'sequencer', 'todo'), `pick ${sha} inicial\n`);
    },
  },
  {
    nombre: 'merge y cherry-pick a la vez (manda merge)',
    testigos: async (d, sha) => {
      await writeFile(path.join(d, 'MERGE_HEAD'), `${sha}\n`);
      await writeFile(path.join(d, 'CHERRY_PICK_HEAD'), `${sha}\n`);
    },
  },
];

for (const { nombre, testigos } of ESTADOS) {
  test(`operacion en curso (TASK-143c, SCR-07): bash y TS coinciden — ${nombre}`, async () => {
    await conRepo(async (repo) => {
      const gitDir = path.resolve(repo, git(['rev-parse', '--git-dir'], repo));
      await testigos(gitDir, git(['rev-parse', 'HEAD'], repo));
      assert.equal(operacionBash(repo), operacionEnCurso(repo) ?? '');
    });
  });
}

test('isRemoteAvailable (TASK-143c, SCR-08): con origin que no responde vuelve false dentro de GF_TIMEOUT_REMOTO', async () => {
  await conRepo(async (repo) => {
    git(['remote', 'add', 'origin', ORIGEN_MUERTO], repo);
    const antes = process.env.GF_TIMEOUT_REMOTO;
    process.env.GF_TIMEOUT_REMOTO = '2';
    try {
      const t0 = Date.now();
      assert.equal(isRemoteAvailable(repo), false);
      // Sin limite, la conexion a TEST-NET-1 sola tarda ~21 s.
      assert.ok(Date.now() - t0 < 10_000, `tardo ${String(Date.now() - t0)} ms`);
    } finally {
      if (antes === undefined) delete process.env.GF_TIMEOUT_REMOTO;
      else process.env.GF_TIMEOUT_REMOTO = antes;
    }
  });
});

test('timeoutRemotoMs (TASK-143c, SCR-08): GF_TIMEOUT_REMOTO en segundos, 5 por defecto o si no es un entero mayor que 0', () => {
  assert.equal(timeoutRemotoMs({}), 5000);
  assert.equal(timeoutRemotoMs({ GF_TIMEOUT_REMOTO: '12' }), 12_000);
  for (const malo of ['0', '-3', 'x', '1.5', '']) assert.equal(timeoutRemotoMs({ GF_TIMEOUT_REMOTO: malo }), 5000, malo);
});

test('argumentosScriptMerge (TASK-143c, SCR-08): hotfix y release llevan --main con la principal ya resuelta', () => {
  assert.deepEqual(argumentosScriptMerge('feature/1-a', 'develop', null, null), ['feature/1-a', '--develop', 'develop']);
  assert.deepEqual(argumentosScriptMerge('feature/1-a', 'develop', null, 'v1'), ['feature/1-a', '--develop', 'develop']);
  assert.deepEqual(argumentosScriptMerge('hotfix/2-b', 'develop', 'master', null), [
    'hotfix/2-b', '--develop', 'develop', '--main', 'master',
  ]);
  assert.deepEqual(argumentosScriptMerge('release/3-c', 'integracion', 'main', 'v3.0.0'), [
    'release/3-c', '--develop', 'integracion', '--main', 'main', '--tag', 'v3.0.0',
  ]);
});
