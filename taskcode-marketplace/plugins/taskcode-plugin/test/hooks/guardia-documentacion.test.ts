/**
 * TASK-101: el guardian de merges aplica la decision de verificacion
 * proporcional de TASK-100 (paso 6b). Repos Git temporales de verdad; los
 * comandos de verificacion son scripts de node fuera del repo que cuentan sus
 * ejecuciones (el guardian nunca debe ejecutar ninguno).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
import { comandoSoloIntegra } from '../../src/core/comando-merge.js';
import { guardarMemo, huellaDeCommit } from '../../src/fs/verificacion.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

const SCRIPT = `require('node:fs').appendFileSync(__dirname + '/cuenta-' + process.argv[2], 'x');`;

interface Entorno {
  repoRoot: string;
  tareasRoot: string;
  comandoCompleta: string;
  comandoDocs: string;
  ejecutadoAlguno(): boolean;
}

/** `trabajo-*.txt` es lo que deja `setupTaskEnRevision` en la raiz: aqui cuenta como documentacion. */
const RUTAS = 'rutas_documentacion: [docs/**, trabajo-*.txt]\n';

async function conEntorno(
  extra: (c: { docs: string }) => string,
  fn: (e: Entorno) => Promise<void>
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'guardia-docs-'));
  await writeFile(path.join(dir, 'v.cjs'), SCRIPT, 'utf8');
  const script = path.join(dir, 'v.cjs').replace(/\\/g, '/');
  const comandos = { completa: `node ${script} completa`, docs: `node ${script} docs` };
  try {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(
        path.join(repoRoot, '.taskcode', 'config.yml'),
        `comando_verificacion: "${comandos.completa}"\n${extra(comandos)}`,
        'utf8'
      );
      commitAll(repoRoot, 'config');
      await fn({
        repoRoot,
        tareasRoot,
        comandoCompleta: comandos.completa,
        comandoDocs: comandos.docs,
        ejecutadoAlguno: () => existsSync(path.join(dir, 'cuenta-completa')) || existsSync(path.join(dir, 'cuenta-docs')),
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function enLaRama(e: Entorno, ruta: string, contenido = 'x\n'): Promise<void> {
  await mkdir(path.dirname(path.join(e.repoRoot, ruta)), { recursive: true });
  await writeFile(path.join(e.repoRoot, ruta), contenido, 'utf8');
  commitAll(e.repoRoot, `cambio en ${ruta}`);
}

const guardian = (e: Entorno, command: string) => decidirPreToolUse({ cwd: e.repoRoot, tool_input: { command } });
const mergeA = (rama: string) => `git checkout develop && git merge --no-ff ${rama}`;

test('guardian (TASK-101): un merge a mano de solo documentacion pasa sin verde de la completa; finish decide lo mismo', async () => {
  await conEntorno(() => RUTAS, async (e) => {
    const task = sampleTask({ id: 'TASK-951' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    assert.equal(guardian(e, mergeA(task.rama)).codigo, 0);
    assert.equal(e.ejecutadoAlguno(), false, 'el guardian nunca ejecuta la verificacion');
    // finish, sobre el mismo par, tampoco corre la completa (criterio 2).
    await runFinishCommand(e.tareasRoot, ['TASK-951'], '2026-11-10', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR });
    assert.equal(e.ejecutadoAlguno(), false);
  });
});

test('guardian (TASK-101): con codigo sigue bloqueando y dice por que no es solo documentacion', async () => {
  await conEntorno(() => RUTAS, async (e) => {
    const task = sampleTask({ id: 'TASK-952' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts', 'export const x = 1;\n');
    const d = guardian(e, mergeA(task.rama));
    assert.equal(d.codigo, 2);
    assert.match(d.stderr ?? '', /No es solo documentacion: la tarea cambia rutas que no son documentacion: src\/calculo\.ts/);
  });
});

test('guardian (TASK-101): con comprobacion de documentacion exige su verde guardado para ese commit', async () => {
  await conEntorno(({ docs }) => `${RUTAS}comando_verificacion_documentacion: "${docs}"\n`, async (e) => {
    const task = sampleTask({ id: 'TASK-953' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    const sin = guardian(e, mergeA(task.rama));
    assert.equal(sin.codigo, 2);
    assert.match(sin.stderr ?? '', /no consta en verde su comprobacion de documentacion .* taskctl finish la ejecuta/);
    const huella = huellaDeCommit(e.repoRoot, task.rama, e.comandoDocs, 600) as string;
    const verde = { comando: e.comandoDocs, estado: 'verde' as const, codigo: 0, duracionMs: 1, timeoutS: 600, bytesTotales: 0, cola: '' };
    // Un verde en el memo de la COMPLETA con esa huella no sirve: son memos distintos.
    guardarMemo(e.repoRoot, huella, verde, 'completa');
    assert.equal(guardian(e, mergeA(task.rama)).codigo, 2);
    guardarMemo(e.repoRoot, huella, verde, 'documentacion');
    assert.equal(guardian(e, mergeA(task.rama)).codigo, 0);
    assert.equal(e.ejecutadoAlguno(), false);
  });
});

test('guardian (TASK-101): sin exencion si el comando crea o mueve commits antes del merge', async () => {
  await conEntorno(() => RUTAS, async (e) => {
    const task = sampleTask({ id: 'TASK-954' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    for (const previo of ['git add -A && git commit -m x', 'git reset --hard HEAD~1', 'git pull', 'taskctl veredicto TASK-1 aprobada', 'node script.js']) {
      const d = guardian(e, `${previo} && ${mergeA(task.rama)}`);
      assert.equal(d.codigo, 2, previo);
      assert.match(d.stderr ?? '', /puede crear o mover commits antes del merge/, previo);
    }
  });
});

test('guardian (TASK-101): los held-out de tareas/.../aceptacion/ cuentan como codigo', async () => {
  await conEntorno(() => RUTAS, async (e) => {
    const task = sampleTask({ id: 'TASK-955' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'tareas/03-en-revision/TASK-955/aceptacion/caso.test.js', 'throw new Error()\n');
    const d = guardian(e, mergeA(task.rama));
    assert.equal(d.codigo, 2);
    assert.match(d.stderr ?? '', /no son documentacion: tareas\/03-en-revision\/TASK-955\/aceptacion\/caso\.test\.js/);
  });
});

test('guardian (TASK-101): un release siempre exige la completa', async () => {
  await conEntorno(() => RUTAS, async (e) => {
    git(['checkout', '-q', '-b', 'release/1.0', 'develop'], e.repoRoot);
    await enLaRama(e, 'docs/CHANGELOG.md');
    const d = guardian(e, mergeA('release/1.0'));
    assert.equal(d.codigo, 2);
    assert.match(d.stderr ?? '', /Un release lleva a la principal todo lo acumulado/);
  });
});

test('guardian (TASK-101): las rutas salen de la config del destino, no de la rama ni del arbol', async () => {
  await conEntorno(() => 'rutas_documentacion: [docs/**]\n', async (e) => {
    const task = sampleTask({ id: 'TASK-956' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    // La rama declara src/** como documentacion en su config (sin commitear).
    await writeFile(
      path.join(e.repoRoot, '.taskcode', 'config.yml'),
      `comando_verificacion: "${e.comandoCompleta}"\nrutas_documentacion: [docs/**, src/**, trabajo-*.txt, tareas/**]\n`,
      'utf8'
    );
    await mkdir(path.join(e.repoRoot, 'src'), { recursive: true });
    await writeFile(path.join(e.repoRoot, 'src', 'x.ts'), 'x\n', 'utf8');
    git(['add', 'src/x.ts'], e.repoRoot);
    git(['commit', '-q', '-m', 'codigo', '--', 'src/x.ts'], e.repoRoot);
    const d = decidirPreToolUse({ cwd: e.repoRoot, tool_input: { command: `git merge --no-ff ${task.rama}` } });
    // La rama actual es la de la tarea (destino = ella misma): no protegida. Desde develop:
    assert.equal(d.codigo, 0);
    git(['stash', '-q'], e.repoRoot);
    const desdeDevelop = guardian(e, mergeA(task.rama));
    assert.equal(desdeDevelop.codigo, 2);
    assert.match(desdeDevelop.stderr ?? '', /no son documentacion: src\/x\.ts/);
  });
});

test('guardian (TASK-101): una config del destino invalida no exime (completa)', async () => {
  await conEntorno(() => RUTAS, async (e) => {
    const task = sampleTask({ id: 'TASK-957' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    git(['checkout', '-q', 'develop'], e.repoRoot);
    await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), `comando_verificacion: "${e.comandoCompleta}"\nrutas_documentacion: ["**"]\n`, 'utf8');
    commitAll(e.repoRoot, 'config rota en develop');
    git(['checkout', '-q', task.rama], e.repoRoot);
    // El arbol (rama de la tarea) tiene la config valida; el destino, no.
    const d = guardian(e, mergeA(task.rama));
    assert.equal(d.codigo, 2);
    assert.match(d.stderr ?? '', /La configuracion de "develop" no es valida/);
  });
});

test('guardian (TASK-101): sin rutas_documentacion el mensaje es exactamente el de la 0.14.0', async () => {
  await conEntorno(() => '', async (e) => {
    const task = sampleTask({ id: 'TASK-958' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    const d = guardian(e, mergeA(task.rama));
    assert.equal(d.codigo, 2);
    const lineas = (d.stderr ?? '').split('\n');
    assert.equal(lineas.length, 4, d.stderr);
    assert.match(lineas[0] as string, /^Merge bloqueado: .* no consta una verificacion en verde de ese commit \(comando de verificacion: /);
    assert.match(lineas[1] as string, /^Cierra la tarea con taskctl finish TASK-NNN/);
  });
});

test('comandoSoloIntegra: solo un merge, cambiar de carpeta o de rama y consultar', () => {
  for (const ok of [
    'git merge --no-ff feature/x',
    'cd repo && git checkout develop && git merge --no-ff feature/x',
    'git -C repo switch develop; git merge feature/x',
    'git status && git log -1 && git branch --show-current && git merge x',
    'bash scripts/merge-feature-to-develop.sh feature/x',
    'bash -c "git checkout develop && git merge x"',
    'git checkout -q develop && git switch --detach develop && git merge x',
    // NUE-3 de la revision de TASK-101: barra real (antes '\r' era un retorno de carro).
    'cd C:\\repo && git merge x',
  ]) {
    assert.equal(comandoSoloIntegra(ok), true, ok);
  }
  for (const no of [
    'git commit -am x && git merge x',
    'git checkout -B feature/x HEAD~1 && git merge feature/x',
    'git branch -f feature/x HEAD && git merge feature/x',
    'git cherry-pick abc && git merge x',
    'npm run build && git merge x',
    'bash -c "git commit -m y && git merge x"',
    'git rebase develop && git merge x',
    'git fetch origin x:x && git merge x',
    // CRI-1 de la revision: otro merge antes, hacia una rama no protegida.
    'git checkout docs && git merge --no-edit code && git checkout develop && git merge --no-ff -m m docs',
    'git checkout docs; git merge code; git checkout develop; git merge docs',
    // CRI-2: redirecciones, tee, sustituciones.
    'git rev-parse code > .git/refs/heads/docs && git merge docs',
    'echo abc > .git/refs/heads/docs && git merge docs',
    'echo abc | tee .git/refs/heads/docs && git merge docs',
    'cat .git/refs/heads/code > .git/refs/heads/docs && git merge docs',
    'echo "$(git branch -f docs code)" && git merge docs',
    'git log "$(git branch -f docs code)" && git merge docs',
    'git log `git branch -f docs code` && git merge docs',
    'git log --output=.git/refs/heads/docs && git merge docs',
    'git -c alias.st=!sh status && git merge docs',
    'GIT_DIR=otro git merge docs',
    // NUE-1 de la ronda 2: opciones de crear o forzar rama agrupadas, adjuntas o escapadas.
    'git checkout -fB docs code && git checkout develop && git merge docs',
    'git checkout -qB docs code && git checkout develop && git merge docs',
    'git checkout -Bdocs code && git checkout develop && git merge docs',
    // NUE-3: barra real; '-\B' en TS es solo '-B'.
    'git checkout -\\B docs code && git checkout develop && git merge docs',
    'git switch -fC docs code && git switch develop && git merge docs',
    'git switch -Cdocs code && git switch develop && git merge docs',
    'git switch --force-c docs code && git switch develop && git merge docs',
    'git switch -\\C docs code && git switch develop && git merge docs',
    'bash -lc "git checkout -\\B docs code && git checkout develop && git merge docs"',
    "sh -c 'git checkout -fB docs code && git checkout develop && git merge docs'",
    // NUE-3 (TASK-103): bash quita la barra y queda --output=...; solo lo para la comprobacion de barra.
    'git log --outpu\\t=.git/refs/heads/docs && git merge docs',
    // NUE-2: un merge disfrazado con una opcion de --abort/--quit no cuenta en analizarComando.
    'git checkout docs && git merge -m --abort code && git checkout develop && git merge --no-ff docs',
    'git merge -m --quit code; git merge docs',
  ]) {
    assert.equal(comandoSoloIntegra(no), false, no);
  }
});

test('guardian (TASK-101): CRI-1 y CRI-2 de la revision bloquean de punta a punta', async () => {
  await conEntorno(() => RUTAS, async (e) => {
    const task = sampleTask({ id: 'TASK-959' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    git(['checkout', '-q', '-b', 'codigo', 'develop'], e.repoRoot);
    await enLaRama(e, 'src/y.ts', 'export const y = 1;\n');
    git(['checkout', '-q', 'develop'], e.repoRoot);
    for (const cmd of [
      `git checkout ${task.rama} && git merge --no-edit codigo && git checkout develop && git merge --no-ff -m m ${task.rama}`,
      `git rev-parse codigo > .git/refs/heads/${task.rama} && git merge --no-ff ${task.rama}`,
      `echo "$(git branch -f ${task.rama} codigo)" && git merge --no-ff ${task.rama}`,
      `git checkout -fB ${task.rama} codigo && git checkout develop && git merge ${task.rama}`,
      `git checkout ${task.rama} && git merge -m --abort codigo && git checkout develop && git merge --no-ff ${task.rama}`,
    ]) {
      const d = guardian(e, cmd);
      assert.equal(d.codigo, 2, cmd);
    }
    // Y el merge limpio de esa misma rama si pasa.
    assert.equal(guardian(e, `git merge --no-ff ${task.rama}`).codigo, 0);
  });
});
