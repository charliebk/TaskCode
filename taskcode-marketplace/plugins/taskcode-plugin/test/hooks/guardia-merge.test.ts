/**
 * Guardian de merges (TASK-072, capa 2). El analizador de comandos es puro y
 * se prueba con texto; la decision, contra repos Git temporales de verdad con
 * develop, main y una rama de trabajo, y con el memo escrito por la misma
 * funcion que usa produccion. El punto de entrada se prueba ademas como
 * proceso, con el JSON por stdin, igual que lo lanza Claude Code.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { analizarComando, segmentar } from '../../src/core/comando-merge.js';
import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
import { guardarMemo, huellaDeCommit, huellaDelArbol } from '../../src/fs/verificacion.js';
import type { ResultadoVerificacion } from '../../src/core/informe-verificacion.js';
import { git } from '../helpers/finish-fixtures.js';

const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
const ENTRADA_HOOK = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'pre-tool-merge.js');
const COMANDO = 'node --version';
const RAMA = 'feature/task-900-trabajo';

// ---------------------------------------------------------------------
// Analizador (puro)
// ---------------------------------------------------------------------

test('comando-merge: segmenta por operadores y respeta comillas y rutas de Windows', () => {
  assert.deepEqual(segmentar('git checkout develop && git merge "feature/x y"'), [
    ['git', 'checkout', 'develop'],
    ['git', 'merge', 'feature/x y'],
  ]);
  assert.deepEqual(segmentar("a; b | c || d & e\nf (g)"), [['a'], ['b'], ['c'], ['d'], ['e'], ['f'], ['g']]);
  assert.deepEqual(segmentar('C:\\Git\\bin\\git.exe merge x'), [['C:\\Git\\bin\\git.exe', 'merge', 'x']]);
});

test('comando-merge: detecta merges, su destino por checkout/switch y los scripts de cierre', () => {
  assert.deepEqual(analizarComando('git merge --no-ff -m "cierre" feature/x'), [
    { tipo: 'merge', fuentes: ['feature/x'], destino: null, dir: null },
  ]);
  assert.deepEqual(analizarComando('git checkout develop && git merge feature/x'), [
    { tipo: 'merge', fuentes: ['feature/x'], destino: 'develop', dir: null },
  ]);
  assert.deepEqual(analizarComando('cd repo && git -C ../otro -c core.x=1 switch main; git merge -s ort a b'), [
    { tipo: 'merge', fuentes: ['a', 'b'], destino: 'main', dir: null },
  ]);
  assert.deepEqual(analizarComando('git -C ../otro merge x'), [{ tipo: 'merge', fuentes: ['x'], destino: null, dir: '../otro' }]);
  assert.deepEqual(analizarComando('C:\\Git\\bin\\git.exe merge x')[0], { tipo: 'merge', fuentes: ['x'], destino: null, dir: null });
  assert.deepEqual(analizarComando('FOO=1 git merge x')[0], { tipo: 'merge', fuentes: ['x'], destino: null, dir: null });
  assert.deepEqual(analizarComando('git merge'), [{ tipo: 'merge', fuentes: [], destino: null, dir: null }]);
  assert.deepEqual(analizarComando('bash scripts/gitflow/merge-feature-to-develop.sh feature/x --develop develop'), [
    { tipo: 'script', script: 'merge-feature-to-develop.sh', fuente: 'feature/x', destinos: ['integracion'] },
  ]);
  assert.deepEqual(analizarComando('& sh ./merge-hotfix-to-main.sh hotfix/y'), [
    { tipo: 'script', script: 'merge-hotfix-to-main.sh', fuente: 'hotfix/y', destinos: ['main', 'integracion'] },
  ]);
  // checkout -b crea una rama de trabajo: el destino es ella.
  assert.equal((analizarComando('git checkout -b nueva develop && git merge x')[0] as { destino: string }).destino, 'nueva');
  // Restaurar ficheros no cambia de rama.
  assert.equal((analizarComando('git checkout develop -- f.txt && git merge x')[0] as { destino: null }).destino, null);
});

test('comando-merge (MEN-1): el texto de bash -c, pwsh -Command y cmd /c se analiza igual', () => {
  const esperado = [{ tipo: 'merge', fuentes: ['feature/x'], destino: 'develop', dir: null }];
  assert.deepEqual(analizarComando('bash -c "git checkout develop && git merge feature/x"'), esperado);
  assert.deepEqual(analizarComando("bash -lc 'git checkout develop && git merge feature/x'"), esperado);
  assert.deepEqual(analizarComando('powershell -NoProfile -Command "git checkout develop; git merge feature/x"'), esperado);
  assert.deepEqual(analizarComando('pwsh -c "git switch develop; git merge feature/x"'), esperado);
  assert.deepEqual(analizarComando('cmd /c "git checkout develop && git merge feature/x"'), esperado);
  assert.deepEqual(analizarComando('bash -c "bash scripts/merge-fix-to-develop.sh fix/y"')[0], {
    tipo: 'script',
    script: 'merge-fix-to-develop.sh',
    fuente: 'fix/y',
    destinos: ['integracion'],
  });
  assert.deepEqual(analizarComando('bash -c "git status"'), []);
  assert.deepEqual(analizarComando('bash -x scripts/merge-feature-to-develop.sh feature/x')[0], {
    tipo: 'script',
    script: 'merge-feature-to-develop.sh',
    fuente: 'feature/x',
    destinos: ['integracion'],
  });
});

test('comando-merge (MEN-2): git checkout <rama> <fichero> sin -- restaura ficheros, no cambia de rama', () => {
  assert.equal((analizarComando('git checkout develop src/a.ts && git merge develop')[0] as { destino: null }).destino, null);
  assert.equal((analizarComando('git checkout develop && git merge x')[0] as { destino: string }).destino, 'develop');
});

test('comando-merge: lo que no es un merge nuevo no aparece', () => {
  for (const c of [
    'git status',
    'git merge-base develop feature/x',
    'git merge-base --is-ancestor a b',
    'git config merge.ff false',
    'git merge --abort',
    'git merge --continue',
    'git merge --quit',
    'echo "git merge develop"',
    'echo git merge develop',
    'git log --grep merge',
    'git commit -m "merge de cosas"',
    'taskctl finish TASK-001 --merge-request',
    'cat scripts/gitflow/merge-feature-to-develop.sh',
    'bash abort-merge.sh',
  ]) {
    assert.deepEqual(analizarComando(c), [], c);
  }
});

// ---------------------------------------------------------------------
// Decision, contra repos reales
// ---------------------------------------------------------------------

interface Repo {
  raiz: string;
  limpiar(): Promise<void>;
}

const VERDE: ResultadoVerificacion = { comando: COMANDO, estado: 'verde', codigo: 0, duracionMs: 5, timeoutS: 600, bytesTotales: 0, cola: '' };
const ROJO: ResultadoVerificacion = { ...VERDE, estado: 'roja', codigo: 1 };

async function montar(config = `comando_verificacion: "${COMANDO}"\n`): Promise<Repo> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'guardia-merge-'));
  git(['init', '-q', '-b', 'main'], raiz);
  git(['config', 'user.email', 'test@example.com'], raiz);
  git(['config', 'user.name', 'Test'], raiz);
  await mkdir(path.join(raiz, '.taskcode'));
  await writeFile(path.join(raiz, '.taskcode', 'config.yml'), config, 'utf8');
  await writeFile(path.join(raiz, 'README.md'), 'x\n', 'utf8');
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', 'inicial'], raiz);
  git(['branch', 'develop'], raiz);
  git(['checkout', '-q', '-b', RAMA, 'develop'], raiz);
  await writeFile(path.join(raiz, 'trabajo.txt'), 'trabajo\n', 'utf8');
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', 'trabajo'], raiz);
  return { raiz, limpiar: () => rm(raiz, { recursive: true, force: true }) };
}

async function conRepo(fn: (r: Repo) => Promise<void>, config?: string): Promise<void> {
  const r = await montar(config);
  try {
    await fn(r);
  } finally {
    await r.limpiar();
  }
}

function decide(raiz: string, command: string) {
  return decidirPreToolUse({ cwd: raiz, tool_name: 'Bash', tool_input: { command } });
}

function memorizar(raiz: string, ref: string, r: ResultadoVerificacion, timeoutS = 600): void {
  const h = huellaDeCommit(raiz, ref, COMANDO, timeoutS);
  assert.ok(h);
  guardarMemo(raiz, h, r);
}

test('guardia: bloquea un merge hacia develop o main sin verde del commit que entra', async () => {
  await conRepo(async ({ raiz }) => {
    // Desde la rama de trabajo, cambiando de rama en el mismo comando.
    let d = decide(raiz, `git checkout develop && git merge --no-ff -m "x" ${RAMA}`);
    assert.equal(d.codigo, 2);
    assert.match(d.stderr, /Merge bloqueado: "feature\/task-900-trabajo" \([0-9a-f]{10}\) entraria en "develop"/);
    assert.match(d.stderr, /no consta una verificacion en verde/);
    assert.match(d.stderr, /taskctl finish TASK-NNN/);
    assert.match(d.stderr, /--sin-verificacion/);
    assert.equal(decide(raiz, `cd . && git switch main && git merge ${RAMA}`).codigo, 2);
    assert.equal(decide(raiz, `bash scripts/gitflow/merge-feature-to-develop.sh ${RAMA} --develop develop`).codigo, 2);
    assert.equal(decide(raiz, `bash -c "git checkout develop && git merge ${RAMA}"`).codigo, 2, 'MEN-1');
    // Estando ya en develop / main (la rama actual es el destino).
    git(['checkout', '-q', 'develop'], raiz);
    d = decide(raiz, `git merge ${RAMA}`);
    assert.equal(d.codigo, 2);
    git(['checkout', '-q', 'main'], raiz);
    assert.equal(decide(raiz, `git merge ${RAMA}`).codigo, 2);
    // PowerShell: misma decision.
    assert.equal(
      decidirPreToolUse({ cwd: raiz, tool_name: 'PowerShell', tool_input: { command: `git merge ${RAMA}` } }).codigo,
      2
    );
    // Nada se ha mergeado: el hook solo decide.
    assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', RAMA, 'develop'], { cwd: raiz }).status, 1);
  });
});

test('guardia: con un verde guardado del commit fuente deja pasar; con un rojo guardado bloquea y lo dice', async () => {
  await conRepo(async ({ raiz }) => {
    memorizar(raiz, RAMA, ROJO);
    const d = decide(raiz, `git checkout develop && git merge ${RAMA}`);
    assert.equal(d.codigo, 2);
    assert.match(d.stderr, /la ultima verificacion de ese commit NO salio en verde/);
    memorizar(raiz, RAMA, VERDE);
    assert.deepEqual(decide(raiz, `git checkout develop && git merge ${RAMA}`), { codigo: 0, stderr: '' });
    // El verde es del commit: un commit nuevo en la rama vuelve a bloquear.
    await writeFile(path.join(raiz, 'trabajo.txt'), 'mas trabajo\n', 'utf8');
    git(['commit', '-q', '-am', 'mas'], raiz);
    assert.equal(decide(raiz, `git checkout develop && git merge ${RAMA}`).codigo, 2);
  });
});

test('guardia: el verde que deja una verificacion con el arbol limpio (huellaDelArbol) vale para el commit', async () => {
  await conRepo(async ({ raiz }) => {
    const h = huellaDelArbol(raiz, COMANDO, 600);
    assert.equal(h, huellaDeCommit(raiz, RAMA, COMANDO, 600), 'arbol limpio: misma huella que el commit');
    guardarMemo(raiz, h as string, VERDE);
    assert.equal(decide(raiz, `git checkout develop && git merge ${RAMA}`).codigo, 0);
  });
});

test('guardia (criterio 3): no bloquea lecturas, merges hacia ramas de trabajo ni lo que no es un merge nuevo', async () => {
  await conRepo(async ({ raiz }) => {
    git(['checkout', '-q', 'develop'], raiz);
    for (const c of [
      'git status',
      'git log --oneline',
      'git diff develop',
      'git show HEAD',
      'git branch -a',
      `git merge-base develop ${RAMA}`,
      'git config merge.ff false',
      'git merge --abort',
      'git merge --continue',
      'git merge --quit',
      'echo "git merge develop"',
    ]) {
      assert.deepEqual(decide(raiz, c), { codigo: 0, stderr: '' }, c);
    }
    // Hacia una rama de trabajo: develop entra en la feature.
    assert.equal(decide(raiz, `git checkout ${RAMA} && git merge develop`).codigo, 0);
    git(['checkout', '-q', RAMA], raiz);
    assert.equal(decide(raiz, 'git merge develop').codigo, 0);
    assert.equal(decide(raiz, 'git checkout -b otra develop && git merge main').codigo, 0);
  });
});

test('guardia: deja pasar lo ya integrado (backmerge de recuperacion de un hotfix ya en main)', async () => {
  await conRepo(async ({ raiz }) => {
    git(['checkout', '-q', '-b', 'hotfix/task-901-x', 'main'], raiz);
    await writeFile(path.join(raiz, 'arreglo.txt'), 'x\n', 'utf8');
    git(['add', '-A'], raiz);
    git(['commit', '-q', '-m', 'arreglo'], raiz);
    git(['checkout', '-q', 'main'], raiz);
    git(['merge', '-q', '--no-ff', '-m', 'merge a main', 'hotfix/task-901-x'], raiz);
    // Lo que pide finish cuando falta el backmerge.
    assert.equal(decide(raiz, 'git checkout develop && git merge --no-ff hotfix/task-901-x').codigo, 0);
    // Y un merge que no trae nada nuevo (main ya en develop).
    git(['checkout', '-q', 'develop'], raiz);
    git(['merge', '-q', '--no-ff', '-m', 'bm', 'main'], raiz);
    assert.equal(decide(raiz, 'git merge main').codigo, 0);
  });
});

test('guardia: la rama de integracion sale de rama_base, no del literal develop', async () => {
  await conRepo(
    async ({ raiz }) => {
      git(['branch', 'integ', 'develop'], raiz);
      assert.equal(decide(raiz, `git checkout integ && git merge ${RAMA}`).codigo, 2);
      assert.equal(decide(raiz, `git checkout develop && git merge ${RAMA}`).codigo, 0, 'develop es aqui una rama mas');
    },
    `comando_verificacion: "${COMANDO}"\nrama_base: integ\n`
  );
});

test('guardia: sin comando_verificacion, fuera de un repo o con entrada rara, deja pasar', async () => {
  await conRepo(async ({ raiz }) => {
    git(['checkout', '-q', 'develop'], raiz);
    assert.equal(decide(raiz, `git merge ${RAMA}`).codigo, 0);
  }, 'rama_base: develop\n');
  const fuera = await mkdtemp(path.join(tmpdir(), 'guardia-fuera-'));
  try {
    assert.equal(decide(fuera, 'git merge x').codigo, 0);
  } finally {
    await rm(fuera, { recursive: true, force: true });
  }
  assert.equal(decidirPreToolUse({}).codigo, 0);
  assert.equal(decidirPreToolUse({ cwd: 'Z:/no/existe', tool_input: { command: 'git merge x' } }).codigo, 0);
  assert.equal(decidirPreToolUse({ cwd: tmpdir(), tool_input: 'git merge x' }).codigo, 0);
});

test('guardia: una fuente que no resuelve a un commit hacia develop bloquea (no se puede comprobar)', async () => {
  await conRepo(async ({ raiz }) => {
    const d = decide(raiz, 'git checkout develop && git merge no-existe');
    assert.equal(d.codigo, 2);
    assert.match(d.stderr, /no se puede resolver "no-existe"/);
  });
});

test('guardia: el punto de entrada real decide por stdin (0 / 2) y nunca sale con 1', async () => {
  assert.ok(existsSync(ENTRADA_HOOK), 'compilado en dist/src');
  await conRepo(async ({ raiz }) => {
    const lanzar = (command: string) =>
      spawnSync(process.execPath, [ENTRADA_HOOK], {
        input: JSON.stringify({ cwd: raiz, tool_name: 'Bash', tool_input: { command }, hook_event_name: 'PreToolUse' }),
        encoding: 'utf8',
      });
    const bloqueo = lanzar(`git checkout develop && git merge ${RAMA}`);
    assert.equal(bloqueo.status, 2);
    assert.match(bloqueo.stderr, /Merge bloqueado/);
    const pasa = lanzar('git status');
    assert.equal(pasa.status, 0);
    assert.equal(pasa.stderr, '');
    const basura = spawnSync(process.execPath, [ENTRADA_HOOK], { input: 'basura merge', encoding: 'utf8' });
    assert.equal(basura.status, 0);
  });
});

test('guardia: hooks.json declara el PreToolUse sin filtro if, en forma exec, sin la sonda y sin nombrar el producto', () => {
  const j = JSON.parse(readFileSync(path.join(RAIZ_PLUGIN, 'hooks', 'hooks.json'), 'utf8')) as {
    description: string;
    hooks: { PreToolUse: { matcher: string; hooks: { type: string; command: string; args: string[]; timeout: number; if?: string }[] }[] };
  };
  assert.equal(j.hooks.PreToolUse.length, 1);
  const pre = j.hooks.PreToolUse[0];
  assert.ok(pre);
  assert.equal(pre.matcher, 'Bash|PowerShell');
  assert.equal(pre.hooks.length, 1);
  const h = pre.hooks[0];
  assert.ok(h);
  assert.equal(h.if, undefined, 'sin if: el de prefijo no ve los comandos compuestos');
  assert.equal(h.command, 'node');
  assert.deepEqual(h.args, ['${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/pre-tool-merge.js']);
  assert.equal(h.timeout, 30);
  assert.doesNotMatch(JSON.stringify(j), /sonda/);
  assert.doesNotMatch(j.description, /taskcode|TASK-\d/i);
});
