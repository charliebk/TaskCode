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
import { analizarComando, comandoSoloIntegra, segmentar } from '../../src/core/comando-merge.js';
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

test('comando-merge (MEN-4, TASK-077): las opciones de bash con valor antes de -c o del script no lo esconden', () => {
  const merge = [{ tipo: 'merge', fuentes: ['x'], destino: null, dir: null }];
  for (const c of [
    'bash -o pipefail -c "git merge x"',
    'bash +o pipefail -c "git merge x"',
    'bash -O extglob -c "git merge x"',
    'bash +O extglob -c "git merge x"',
    'bash -eo pipefail -c "git merge x"',
    'bash -oc pipefail "git merge x"',
    'bash -oO pipefail extglob -c "git merge x"',
    'bash --rcfile f -c "git merge x"',
    'bash --init-file f -c "git merge x"',
    'bash --norc -c "git merge x"',
    'bash -c -x "git merge x"',
    'sh -e -c "git merge x"',
  ]) {
    assert.deepEqual(analizarComando(c), merge, c);
  }
  const script = (fuente: string, nombre = 'merge-feature-to-develop.sh') => [
    { tipo: 'script', script: nombre, fuente, destinos: ['integracion'] },
  ];
  assert.deepEqual(analizarComando('bash scripts/merge-feature-to-develop.sh feature/x'), script('feature/x'));
  assert.deepEqual(analizarComando('bash -x scripts/merge-feature-to-develop.sh feature/x'), script('feature/x'));
  assert.deepEqual(
    analizarComando('bash -o pipefail scripts/merge-fix-to-develop.sh fix/y'),
    script('fix/y', 'merge-fix-to-develop.sh')
  );
  assert.deepEqual(analizarComando('bash -- scripts/merge-feature-to-develop.sh feature/x'), script('feature/x'));
  // Sin -c ni script de cierre: nada.
  // +c desactiva la opcion: no es la forma -c, el argumento es un script (MEN-2).
  assert.deepEqual(analizarComando('bash +c "git merge x"'), []);
  assert.deepEqual(analizarComando('bash +c scripts/merge-feature-to-develop.sh feature/x'), script('feature/x'));
  assert.deepEqual(analizarComando('bash -o pipefail otro.sh'), []);
  assert.deepEqual(analizarComando('bash -c'), []);
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
  // TASK-078 anade el de herramientas de fichero: el de shell se busca por su entrada.
  const shell = j.hooks.PreToolUse.filter((p) => p.matcher === 'Bash|PowerShell');
  assert.equal(shell.length, 1);
  const pre = shell[0];
  assert.ok(pre);
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

// ---------------------------------------------------------------------
// TASK-103: config ilegible y merges que antes no se detectaban
// ---------------------------------------------------------------------

test('comando-merge (TASK-103, MEN-2): --abort/--quit/--continue/--skip como valor de -m no esconden el merge', () => {
  for (const control of ['--abort', '--quit', '--continue', '--skip']) {
    assert.deepEqual(analizarComando(`git merge -m ${control} x`), [{ tipo: 'merge', fuentes: ['x'], destino: null, dir: null }], control);
    // IMP-1 de la revision: tambien con la forma larga de -m.
    assert.deepEqual(analizarComando(`git merge --message ${control} x`)[0], { tipo: 'merge', fuentes: ['x'], destino: null, dir: null }, control);
    assert.deepEqual(analizarComando(`git merge -F ${control} x`)[0], { tipo: 'merge', fuentes: ['x'], destino: null, dir: null }, control);
    // Como opcion, sigue sin ser un merge nuevo (tambien tras otra opcion con valor).
    assert.deepEqual(analizarComando(`git merge ${control}`), [], control);
    assert.deepEqual(analizarComando(`git merge -m msg ${control}`), [], control);
  }
  // Tras `--`, es una ref.
  assert.deepEqual(analizarComando('git merge -- --abort'), [{ tipo: 'merge', fuentes: ['--abort'], destino: null, dir: null }]);
});

test('comando-merge (TASK-103): { ...; }, time y eval no esconden el merge', () => {
  const merge = [{ tipo: 'merge', fuentes: ['x'], destino: null, dir: null }];
  for (const c of [
    '{ git merge x; }',
    'time git merge x',
    'time -p git merge x',
    'eval git merge x',
    'eval "git merge x"',
    '{ time git merge x; }',
    // MEN-2 de la revision.
    'time -p -- git merge x',
    'time -- git merge x',
    'nohup git merge x',
    '! git merge x',
    'if true; then git merge x; fi',
    'while false; do git merge x; done',
    'if false; then :; else git merge x; fi',
    // NUE-2 de la ronda 2.
    'if git merge x; then :; fi',
    'while git merge x; do :; done',
    'until git merge x; do :; done',
    'if false; then :; elif git merge x; then :; fi',
  ]) {
    assert.deepEqual(analizarComando(c), merge, c);
  }
  for (const c of ['nohup git merge x', 'if true; then git merge x; fi']) {
    assert.equal(comandoSoloIntegra(c), false, c);
  }
  assert.deepEqual(analizarComando('eval "git checkout develop && git merge x"'), [
    { tipo: 'merge', fuentes: ['x'], destino: 'develop', dir: null },
  ]);
  assert.deepEqual(analizarComando('eval'), []);
  // Nunca reciben la exencion de solo documentacion (decision de Carlos en TASK-103).
  for (const c of ['{ git merge x; }', 'time git merge x', 'eval git merge x', 'eval "git merge x"']) {
    assert.equal(comandoSoloIntegra(c), false, c);
  }
  assert.equal(comandoSoloIntegra('git merge -m --abort x'), true, 'un solo merge con mensaje raro');
});

test('comando-merge (TASK-103): git checkout <x> solo cambia el destino si x es rama', () => {
  const noEsFichero = (n: string) => n !== 'README.md';
  assert.equal((analizarComando('git checkout README.md && git merge x', noEsFichero)[0] as { destino: null }).destino, null);
  // El destino anterior se conserva.
  assert.equal(
    (analizarComando('git checkout develop && git checkout README.md && git merge x', noEsFichero)[0] as { destino: string }).destino,
    'develop'
  );
  // Se propaga a bash -c y a eval.
  assert.equal((analizarComando('bash -c "git checkout README.md && git merge x"', noEsFichero)[0] as { destino: null }).destino, null);
  assert.equal((analizarComando('eval git checkout README.md && git merge x', noEsFichero)[0] as { destino: null }).destino, null);
  // -b no consulta el predicado.
  assert.equal((analizarComando('git checkout -b README.md && git merge x', () => false)[0] as { destino: string }).destino, 'README.md');
  // Sin predicado, como antes.
  assert.equal((analizarComando('git checkout README.md && git merge x')[0] as { destino: string }).destino, 'README.md');
});

const CONFIG_CLAVE_ANTIGUA = `comando_verificacion: "${COMANDO}"\nlimite_wip: cero\n`;
const CONFIG_CLAVE_NUEVA = 'rutas_documentacion: ["**"]\n';

test('guardia (TASK-103): con la config ilegible, un merge hacia develop, main o master bloquea y dice que arreglar', async () => {
  for (const [config, clave] of [
    [CONFIG_CLAVE_ANTIGUA, /limite_wip/],
    [CONFIG_CLAVE_NUEVA, /rutas_documentacion/],
  ] as const) {
    await conRepo(async ({ raiz }) => {
      git(['branch', 'master', 'main'], raiz);
      for (const destino of ['develop', 'main', 'master']) {
        const d = decide(raiz, `git checkout ${destino} && git merge --no-ff ${RAMA}`);
        assert.equal(d.codigo, 2, `${destino} ${String(clave)}`);
        assert.match(d.stderr, new RegExp(`Merge bloqueado: entraria en "${destino}" y la configuracion del repositorio no se puede leer`));
        assert.match(d.stderr, clave, 'nombra el error');
        assert.match(d.stderr, /config\.yml/, 'nombra el fichero');
        assert.match(d.stderr, /taskctl doctor/);
        assert.match(d.stderr, /taskctl finish TASK-NNN/);
        assert.doesNotMatch(d.stderr, /\[ERROR\]/);
      }
      // Estando ya en develop, los scripts de cierre y un merge que no aporta nada: siempre bloquea.
      git(['checkout', '-q', 'develop'], raiz);
      assert.equal(decide(raiz, `git merge ${RAMA}`).codigo, 2);
      assert.equal(decide(raiz, 'git merge main').codigo, 2, 'main ya es ancestro de develop: bloquea igual');
      assert.equal(decide(raiz, `bash scripts/gitflow/merge-feature-to-develop.sh ${RAMA}`).codigo, 2);
      assert.equal(decide(raiz, `bash scripts/gitflow/merge-hotfix-to-main.sh ${RAMA}`).codigo, 2);
    }, config);
  }
});

test('guardia (TASK-103): con la config ilegible, hacia otra rama deja pasar, como antes', async () => {
  for (const config of [CONFIG_CLAVE_ANTIGUA, CONFIG_CLAVE_NUEVA]) {
    await conRepo(async ({ raiz }) => {
      assert.deepEqual(decide(raiz, 'git merge develop'), { codigo: 0, stderr: '' }, 'en la rama de trabajo');
      assert.deepEqual(decide(raiz, `git checkout -b otra develop && git merge ${RAMA}`), { codigo: 0, stderr: '' });
      git(['branch', 'integ', 'develop'], raiz);
      assert.deepEqual(decide(raiz, `git checkout integ && git merge ${RAMA}`), { codigo: 0, stderr: '' }, 'lista fija: integ no esta');
      assert.deepEqual(decide(raiz, 'git status'), { codigo: 0, stderr: '' });
    }, config);
  }
});

test('guardia (TASK-103): sin fichero de config deja pasar, como antes', async () => {
  await conRepo(async ({ raiz }) => {
    await rm(path.join(raiz, '.taskcode', 'config.yml'));
    assert.deepEqual(decide(raiz, `git checkout develop && git merge ${RAMA}`), { codigo: 0, stderr: '' });
    await rm(path.join(raiz, '.taskcode'), { recursive: true });
    assert.deepEqual(decide(raiz, `git checkout develop && git merge ${RAMA}`), { codigo: 0, stderr: '' });
  });
});

test('guardia (TASK-103): el hook real evalua los merges que antes no detectaba', async () => {
  await conRepo(async ({ raiz }) => {
    git(['checkout', '-q', 'develop'], raiz);
    const lanzar = (command: string) =>
      spawnSync(process.execPath, [ENTRADA_HOOK], {
        input: JSON.stringify({ cwd: raiz, tool_name: 'Bash', tool_input: { command }, hook_event_name: 'PreToolUse' }),
        encoding: 'utf8',
      });
    for (const c of [
      `git merge -m --abort ${RAMA}`,
      `git merge -m --quit ${RAMA}`,
      `git merge -m --continue ${RAMA}`,
      `git merge -m --skip ${RAMA}`,
      `git merge --message --abort ${RAMA}`,
      `{ git merge ${RAMA}; }`,
      `time git merge ${RAMA}`,
      `time -p -- git merge ${RAMA}`,
      `eval git merge ${RAMA}`,
      `nohup git merge ${RAMA}`,
      `if true; then git merge ${RAMA}; fi`,
      // NUE-2 de la ronda 2: la condicion tambien.
      `if git merge ${RAMA}; then :; fi`,
      `if ! git merge ${RAMA}; then :; fi`,
      `while git merge ${RAMA}; do :; done`,
      `until git merge ${RAMA}; do :; done`,
      `if false; then :; elif git merge ${RAMA}; then :; fi`,
      // NUE-1 de la ronda 2: HEAD y @ no desacoplan; el destino sigue siendo develop.
      `git checkout HEAD && git merge ${RAMA}`,
      `git checkout @ && git merge ${RAMA}`,
      // README.md es un fichero versionado, no una rama: el destino sigue siendo develop.
      `git checkout README.md && git merge ${RAMA}`,
    ]) {
      const r = lanzar(c);
      assert.equal(r.status, 2, c);
      assert.match(r.stderr, /Merge bloqueado: "feature\/task-900-trabajo" \([0-9a-f]{10}\) entraria en "develop"/, c);
    }
    // Una rama de verdad si cambia el destino.
    assert.equal(lanzar(`git checkout ${RAMA} && git merge develop`).status, 0);
    // Y la que solo existe en origin (DWIM de git checkout). IMP-2 de la revision:
    // la fuente no es ancestro de develop, asi que solo pasa si el destino cambio.
    git(['update-ref', 'refs/remotes/origin/remota', RAMA], raiz);
    assert.equal(lanzar(`git checkout remota && git merge ${RAMA}`).status, 0);
    // MEN-1: un tag o un commit desacoplan HEAD; el merge no entra en develop.
    git(['tag', 't1', 'main'], raiz);
    assert.equal(lanzar(`git checkout t1 && git merge ${RAMA}`).status, 0, 'tag');
    const sha = git(['rev-parse', 'main'], raiz).trim();
    assert.equal(lanzar(`git checkout ${sha} && git merge ${RAMA}`).status, 0, 'commit');
    assert.equal(lanzar(`git checkout origin/remota && git merge ${RAMA}`).status, 0, 'rama remota desacoplada');
    // NUE-1: tras cambiar a main, `git checkout HEAD` sigue en main.
    const r = lanzar(`git checkout main && git checkout HEAD && git merge ${RAMA}`);
    assert.equal(r.status, 2, 'HEAD tras main');
    assert.match(r.stderr, /entraria en "main"/);
  });
});

test('guardia (TASK-103): el hook real con la config ilegible bloquea con su mensaje', async () => {
  await conRepo(async ({ raiz }) => {
    const r = spawnSync(process.execPath, [ENTRADA_HOOK], {
      input: JSON.stringify({ cwd: raiz, tool_name: 'Bash', tool_input: { command: `git checkout develop && git merge ${RAMA}` } }),
      encoding: 'utf8',
    });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /la configuracion del repositorio no se puede leer/);
  }, CONFIG_CLAVE_ANTIGUA);
});
