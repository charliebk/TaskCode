/**
 * TASK-038: una sola deteccion de origin por invocacion, con limite de
 * tiempo. Repos Git temporales reales; las consultas a la red se cuentan
 * con GIT_TRACE2_EVENT (cada `git ls-remote` deja su evento), no con lo
 * que el script dice de si mismo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
const COMMON = path.join(SCRIPTS, '_gitflow-common.sh').split(path.sep).join('/');
// TEST-NET-1 (RFC 5737): no responde nunca; la conexion se queda colgada
// hasta el timeout del sistema, que es justo el caso de la VPN caida.
const ORIGEN_MUERTO = 'http://192.0.2.1:9/repo.git';

function git(args: string[], cwd: string): void {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
}

async function repoConRamas(): Promise<string> {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-origin-'));
  git(['init', '-q', '-b', 'main'], repo);
  git(['config', 'user.email', 't@t'], repo);
  git(['config', 'user.name', 't'], repo);
  await writeFile(path.join(repo, 'a'), 'a\n', 'utf8');
  git(['add', '.'], repo);
  git(['commit', '-q', '-m', 'i'], repo);
  git(['checkout', '-q', '-b', 'develop'], repo);
  git(['checkout', '-q', '-b', 'feature/x'], repo);
  await writeFile(path.join(repo, 'b'), 'b\n', 'utf8');
  git(['add', '.'], repo);
  git(['commit', '-q', '-m', 'f'], repo);
  return repo;
}

async function limpiar(repo: string): Promise<void> {
  await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
}

/** Numero de `git ls-remote` que dejaron rastro en GIT_TRACE2_EVENT. */
async function lsRemotes(traza: string): Promise<number> {
  let texto = '';
  try {
    texto = await readFile(traza, 'utf8');
  } catch {
    return 0;
  }
  return texto
    .split('\n')
    .filter((l) => l.includes('"event":"start"') && l.includes('ls-remote')).length;
}

test('origin (TASK-038): con origin inalcanzable el script responde en segundos y avisa, en vez de esperar a la red', async () => {
  const repo = await repoConRamas();
  try {
    git(['remote', 'add', 'origin', ORIGEN_MUERTO], repo);
    const t0 = Date.now();
    const r = spawnSync('bash', [path.join(SCRIPTS, 'update-feature.sh'), 'x'], {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, GF_TIMEOUT_REMOTO: '2' },
    });
    const ms = Date.now() - t0;
    const salida = (r.stdout ?? '') + (r.stderr ?? '');
    assert.ok(ms < 20000, `tardo ${ms} ms`);
    assert.match(salida, /No hay conexion con origin\. Se intentara update en modo local\./);
  } finally {
    await limpiar(repo);
  }
});

test('origin (TASK-038): detect_origin_available consulta la red una sola vez por invocacion', async () => {
  const repo = await repoConRamas();
  const traza = path.join(repo, '..', `${path.basename(repo)}-trace.json`);
  try {
    // Un "origin" local que si responde: otro repo en disco.
    const remoto = await mkdtemp(path.join(tmpdir(), 'taskctl-origin-remoto-'));
    git(['init', '-q', '--bare'], remoto);
    git(['remote', 'add', 'origin', remoto], repo);
    const r = spawnSync(
      'bash',
      ['-c', `source "${COMMON}"\ndetect_origin_available\ndetect_origin_available\necho "R=$REMOTE_AVAILABLE"`],
      { cwd: repo, encoding: 'utf8', env: { ...process.env, GIT_TRACE2_EVENT: traza } }
    );
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /R=true/);
    assert.equal(await lsRemotes(traza), 1, 'la segunda llamada no deberia volver a consultar');
    await limpiar(remoto);
  } finally {
    await limpiar(repo);
    await rm(traza, { force: true });
  }
});

test('origin (TASK-038): sin origin configurado no se consulta la red', async () => {
  const repo = await repoConRamas();
  const traza = path.join(repo, '..', `${path.basename(repo)}-trace.json`);
  try {
    const r = spawnSync('bash', ['-c', `source "${COMMON}"\ndetect_origin_available\necho "R=$REMOTE_AVAILABLE C=$REMOTE_CONFIGURED"`], {
      cwd: repo,
      encoding: 'utf8',
      env: { ...process.env, GIT_TRACE2_EVENT: traza },
    });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /R=false C=false/);
    assert.equal(await lsRemotes(traza), 0);
  } finally {
    await limpiar(repo);
    await rm(traza, { force: true });
  }
});

test('origin (TASK-038): el merge a develop con origin configurado pero caido se hace y avisa de que develop puede estar desfasada', async () => {
  const repo = await repoConRamas();
  try {
    git(['remote', 'add', 'origin', ORIGEN_MUERTO], repo);
    const r = spawnSync('bash', [path.join(SCRIPTS, 'merge-feature-to-develop.sh'), 'x'], {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, GF_TIMEOUT_REMOTO: '2' },
    });
    const salida = (r.stdout ?? '') + (r.stderr ?? '');
    assert.equal(r.status, 0, salida);
    assert.match(salida, /origin esta configurado pero no responde: el merge se hace sobre la develop LOCAL/);
    const log = spawnSync('git', ['log', '-1', '--format=%s', 'develop'], { cwd: repo, encoding: 'utf8' });
    assert.match(log.stdout, /feature\/x/);
  } finally {
    await limpiar(repo);
  }
});
