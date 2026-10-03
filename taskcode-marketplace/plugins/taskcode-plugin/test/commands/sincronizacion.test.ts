/**
 * Sincronizacion de ficheros derivados (TASK-033, version 0.1.1).
 * Repos Git temporales reales, los scripts de Git-Flow del repo tal
 * cual, y un script de sincronizacion de verdad (`node`) que regenera
 * `docs/PLAN.md` leyendo `tareas/` — la misma forma que el script del
 * proyecto que destapo el problema.
 *
 * El test que manda es el primero: encadenar approve -> start -> review
 * -> finish SIN un solo commit manual en medio, con el derivado dentro
 * del commit de cada transicion y `git status` vacio despues de cada
 * una. Antes de 0.1.1 hacia falta un commit a mano tras cada paso, y el
 * arreglo con un hook de pre-commit dejaba el indice en `MM`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile } from '../../src/fs/task-store.js';
import { runApproveCommand } from '../../src/commands/approve.js';
import { runStartCommand } from '../../src/commands/start.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
import { CODIGO_SINCRONIZACION_NO_APLICADA } from '../../src/fs/sincronizacion.js';
import type { Task } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/commands -> raiz del paquete
const PAQUETE = path.join(HERE, '..', '..', '..');
const SCRIPTS_DIR = path.join(PAQUETE, 'scripts', 'gitflow');
const BIN = path.join(PAQUETE, 'bin', 'taskctl');

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', message], repoRoot);
}

function porcelain(repoRoot: string): string {
  return git(['status', '--porcelain', '--untracked-files=all'], repoRoot).trim();
}

function ficherosDeHead(repoRoot: string): string[] {
  return git(['show', '--name-only', '--format=', 'HEAD'], repoRoot)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
}

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-920',
    titulo: 'Tarea de prueba de la sincronizacion',
    tipo: 'feature',
    sprint: 1,
    etiquetas: ['cli'],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-diseno',
    plan_aprobado: false,
    rama: 'feature/task-920-sincronizacion',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-10-03',
    actualizado: '2026-10-03',
    dependencias: [],
    ...overrides,
  };
}

/**
 * Regenera docs/PLAN.md: una linea por tarea con su carpeta y si el
 * plan esta aprobado. Lee el estado de disco, como el script real.
 */
const SCRIPT_SYNC = `import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const filas = [];
for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
  const d = 'tareas/' + c;
  if (!existsSync(d)) continue;
  for (const id of readdirSync(d).filter((x) => x.startsWith('TASK-'))) {
    const md = readFileSync(d + '/' + id + '/tarea.md', 'utf8');
    filas.push(id + ' ' + c + (/plan_aprobado: true/.test(md) ? ' aprobado' : ''));
  }
}
mkdirSync('docs', { recursive: true });
writeFileSync('docs/PLAN.md', filas.sort().join('\\n') + '\\n');
`;

const CONFIG_SYNC =
  'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/PLAN.md]\n';

/**
 * Repo con develop, el script de sincronizacion, la config que lo
 * activa (si `config` no es null) y una tarea en 01-en-diseno con su
 * plan. Todo commiteado, docs/PLAN.md incluido: arbol limpio al entrar.
 */
async function withRepoSincronizado(
  config: string | null,
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-sync-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    git(['config', 'core.autocrlf', 'false'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), 'repo\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    git(['checkout', '-q', '-b', 'develop'], repoRoot);

    const tareasRoot = path.join(repoRoot, 'tareas');
    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar la sincronizacion.\n');
    const planDir = path.join(tareasRoot, '01-en-diseno', 'TASK-920', 'planificacion');
    await mkdir(planDir, { recursive: true });
    await writeFile(path.join(planDir, 'plan-final.md'), '# Plan\n', 'utf8');
    await mkdir(path.join(repoRoot, 'scripts'), { recursive: true });
    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), SCRIPT_SYNC, 'utf8');
    if (config !== null) {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
    }
    const r = spawnSync('node', ['scripts/sync.mjs'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    commitAll(repoRoot, 'docs: plan y sincronizacion');
    await fn(repoRoot, tareasRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

async function planEnDisco(repoRoot: string): Promise<string> {
  return (await readFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'utf8')).trim();
}

// ─── El test del item: el ciclo entero sin un commit manual ────────────────

test('sincronizacion: approve -> start -> review -> finish sin commits manuales; el derivado va en cada commit y el arbol queda limpio', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };

    const a = await runApproveCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
    assert.equal(a.autoCommit.sincronizacion.estado, 'aplicada');
    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'approve: falta el derivado');
    assert.equal(await planEnDisco(repoRoot), 'TASK-920 01-en-diseno aprobado');
    assert.equal(porcelain(repoRoot), '', 'approve dejo el arbol sucio');

    const s = await runStartCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
    assert.equal(s.autoCommit.sincronizacion.estado, 'aplicada');
    assert.equal(s.autoCommit.rama, 'feature/task-920-sincronizacion');
    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'start: falta el derivado');
    assert.equal(await planEnDisco(repoRoot), 'TASK-920 02-en-curso aprobado');
    assert.equal(porcelain(repoRoot), '', 'start dejo el arbol sucio');

    await writeFile(path.join(repoRoot, 'README.md'), 'repo con trabajo\n', 'utf8');
    commitAll(repoRoot, 'feat(TASK-920): trabajo');

    const v = await runReviewCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
    assert.equal(v.autoCommit.sincronizacion.estado, 'aplicada');
    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'review: falta el derivado');
    assert.equal(await planEnDisco(repoRoot), 'TASK-920 03-en-revision aprobado');
    assert.equal(porcelain(repoRoot), '', 'review dejo el arbol sucio');

    const informe = path.join(
      tareasRoot,
      '03-en-revision',
      'TASK-920',
      'revision',
      'informe-revision-1.md'
    );
    await writeFile(informe, '# Informe\n\n- Veredicto: aprobada\n', 'utf8');
    commitAll(repoRoot, 'docs(TASK-920): informe de revision');

    const f = await runFinishCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
    assert.equal(f.autoCommit.sincronizacion.estado, 'aplicada');
    assert.equal(f.autoCommit.rama, 'develop');
    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'finish: falta el derivado');
    assert.equal(await planEnDisco(repoRoot), 'TASK-920 04-terminadas aprobado');
    assert.equal(porcelain(repoRoot), '', 'finish dejo el arbol sucio');
    // Y lo que se commiteo en develop es lo que hay en disco.
    assert.equal(git(['show', 'HEAD:docs/PLAN.md'], repoRoot).trim(), await planEnDisco(repoRoot));
  });
});

test('sincronizacion: sin las claves, ni se ejecuta el script ni cambia el commit (comportamiento 0.1.0)', async () => {
  await withRepoSincronizado(null, async (repoRoot, tareasRoot) => {
    const antes = await planEnDisco(repoRoot);
    const a = await runApproveCommand(tareasRoot, ['TASK-920'], '2026-10-03', {
      repoCwd: repoRoot,
    });
    assert.equal(a.autoCommit.sincronizacion.estado, 'no-configurada');
    assert.deepEqual(a.autoCommit.ficheros, ['tareas/01-en-diseno/TASK-920/tarea.md']);
    assert.equal(await planEnDisco(repoRoot), antes, 'el script no deberia haberse ejecutado');
  });
});

// ─── Los tres desenlaces en que no se aplica ───────────────────────────────

/** Escribe un cambio en la tarea (lo que haria un comando) para que autoCommit tenga algo. */
async function tocarTarea(tareasRoot: string): Promise<string> {
  const dir = path.join(tareasRoot, '01-en-diseno', 'TASK-920');
  await writeFile(path.join(dir, 'nota.md'), 'cambio de la transicion\n', 'utf8');
  return dir;
}

async function reescribirScript(repoRoot: string, contenido: string): Promise<void> {
  await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), contenido, 'utf8');
  commitAll(repoRoot, 'chore: script nuevo');
}

test('sincronizacion (a): si la ruta declarada ya tenia cambios, no se ejecuta, no entra en el commit y el cambio de la persona sigue en el arbol', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await writeFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'edicion a mano\n', 'utf8');
    const dir = await tocarTarea(tareasRoot);

    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });

    assert.equal(r.sincronizacion.estado, 'omitida-rutas-con-cambios');
    assert.equal(r.commiteado, true, 'la tarea se commitea igual');
    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'));
    assert.equal(await planEnDisco(repoRoot), 'edicion a mano', 'se piso el trabajo de la persona');
    assert.match(r.avisos.join('\n'), /No se ha ejecutado la sincronizacion: docs\/PLAN\.md/);
  });
});

test('sincronizacion (b): si el script falla tras escribir, el derivado vuelve a HEAD, la tarea se commitea y el arbol queda limpio', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    const enHead = await planEnDisco(repoRoot);
    await reescribirScript(
      repoRoot,
      "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/PLAN.md', 'a medias\\n');\n" +
        "console.error('se rompio a mitad');\nprocess.exit(4);\n"
    );
    const dir = await tocarTarea(tareasRoot);

    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });

    assert.equal(r.sincronizacion.estado, 'fallida');
    assert.equal(r.commiteado, true);
    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'));
    assert.equal(await planEnDisco(repoRoot), enHead, 'el derivado a medias no se restauro');
    assert.equal(porcelain(repoRoot), '');
    const aviso = r.avisos.join('\n');
    assert.match(aviso, /salio con codigo 4: se rompio a mitad/);
    assert.match(aviso, /no repitas el comando de taskctl/);
  });
});

test('sincronizacion (b): un derivado que no existia en HEAD y el script deja a medias se borra', async () => {
  await withRepoSincronizado(
    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/NUEVO.md]\n',
    async (repoRoot, tareasRoot) => {
      await reescribirScript(
        repoRoot,
        "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/NUEVO.md', 'x\\n');\nprocess.exit(1);\n"
      );
      const dir = await tocarTarea(tareasRoot);
      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
      assert.equal(r.sincronizacion.estado, 'fallida');
      assert.equal(existsSync(path.join(repoRoot, 'docs', 'NUEVO.md')), false);
      assert.equal(porcelain(repoRoot), '');
    }
  );
});

test('sincronizacion (b): un script que no termina se corta por timeout y no cuelga el comando', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await reescribirScript(repoRoot, 'setTimeout(() => {}, 60000);\n');
    const dir = await tocarTarea(tareasRoot);
    const t0 = Date.now();
    const r = autoCommit({
      cwd: repoRoot,
      rutas: [dir],
      mensaje: mensajeChore('TASK-920', 'x'),
      sincronizacion: { timeoutMs: 1500 },
    });
    assert.ok(Date.now() - t0 < 30000, 'el timeout no corto el script');
    assert.equal(r.sincronizacion.estado, 'fallida');
    assert.equal(r.commiteado, true);
    assert.match(r.avisos.join('\n'), /no termino en 2 s/);
  });
});

test('sincronizacion (b): un script que lee stdin recibe EOF, no se queda esperando', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await reescribirScript(
      repoRoot,
      "process.stdin.on('data', () => {});\nprocess.stdin.on('end', () => process.exit(7));\n"
    );
    const dir = await tocarTarea(tareasRoot);
    const r = autoCommit({
      cwd: repoRoot,
      rutas: [dir],
      mensaje: mensajeChore('TASK-920', 'x'),
      sincronizacion: { timeoutMs: 20000 },
    });
    assert.equal(r.sincronizacion.estado, 'fallida');
    assert.match(r.avisos.join('\n'), /salio con codigo 7/);
  });
});

test('sincronizacion (c): un script que toca ficheros no declarados los nombra y no los commitea; el derivado si entra', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await reescribirScript(
      repoRoot,
      SCRIPT_SYNC + "writeFileSync('README.md', 'tocado por el script\\n');\n"
    );
    const dir = await tocarTarea(tareasRoot);
    // Un cambio de estado de verdad, para que el derivado cambie.
    const tareaMd = path.join(dir, 'tarea.md');
    await writeFile(
      tareaMd,
      (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
    );

    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });

    assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
    const enCommit = ficherosDeHead(repoRoot);
    assert.ok(enCommit.includes('docs/PLAN.md'), 'el derivado declarado deberia entrar');
    assert.ok(!enCommit.includes('README.md'), 'se commiteo un fichero no declarado');
    // porcelain() recorta, asi que la primera linea pierde su espacio inicial.
    assert.match(porcelain(repoRoot), /^ ?M README\.md$/m, 'el fichero ajeno no se debe tocar');
    assert.equal(
      await readFile(path.join(repoRoot, 'README.md'), 'utf8'),
      'tocado por el script\n',
      'el fichero ajeno no se debe restaurar ni borrar'
    );
    assert.match(r.avisos.join('\n'), /no estan en rutas_sincronizacion: README\.md/);
  });
});

test('sincronizacion (c): detecta la reescritura de un fichero que YA estaba sucio (el porcelain no cambia, el contenido si)', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await writeFile(path.join(repoRoot, 'README.md'), 'trabajo de la persona\n', 'utf8');
    await reescribirScriptSinCommitear(
      repoRoot,
      SCRIPT_SYNC + "writeFileSync('README.md', 'pisado por el script\\n');\n"
    );
    const dir = await tocarTarea(tareasRoot);
    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
    assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
    assert.match(r.avisos.join('\n'), /README\.md/);
  });
});

/** Como reescribirScript pero sin commit, para no barrer el README sucio del test. */
async function reescribirScriptSinCommitear(repoRoot: string, contenido: string): Promise<void> {
  await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), contenido, 'utf8');
  git(['add', '--', 'scripts/sync.mjs'], repoRoot);
  git(['commit', '-q', '-m', 'chore: script nuevo', '--', 'scripts/sync.mjs'], repoRoot);
}

// ─── finish: el caso sin retorno ───────────────────────────────────────────

test('sincronizacion en finish: si el script falla tras el merge, la tarea queda cerrada y commiteada en develop y el arbol limpio', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    const task = sampleTask({ estado: 'en-revision', plan_aprobado: true });
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await mkdir(path.join(tareasRoot, '03-en-revision'), { recursive: true });
    git(['mv', 'tareas/01-en-diseno/TASK-920', 'tareas/03-en-revision/TASK-920'], repoRoot);
    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(
      path.join(revisionDir, 'informe-revision-1.md'),
      '# Informe\n\n- Veredicto: aprobada\n',
      'utf8'
    );
    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), 'process.exit(1);\n', 'utf8');
    commitAll(repoRoot, 'feat(TASK-920): trabajo revisado');
    const planAntes = await planEnDisco(repoRoot);

    const r = await runFinishCommand(tareasRoot, ['TASK-920'], '2026-10-03', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(r.autoCommit.sincronizacion.estado, 'fallida');
    assert.equal(r.autoCommit.commiteado, true);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
    assert.ok(existsSync(path.join(tareasRoot, '04-terminadas', 'TASK-920', 'tarea.md')));
    assert.equal(await planEnDisco(repoRoot), planAntes);
    assert.equal(porcelain(repoRoot), '');
  });
});

// ─── El codigo de salida del CLI real ──────────────────────────────────────

test('taskctl (binario real): sale con 3 cuando la transicion se hizo pero la sincronizacion no, y con 0 cuando se aplico', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot) => {
    const ok = spawnSync('node', [BIN, 'approve', 'TASK-920'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.equal(ok.status, 0, ok.stderr);

    await reescribirScript(repoRoot, 'process.exit(1);\n');
    const tareaMd = path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-920', 'tarea.md');
    const contenido = await readFile(tareaMd, 'utf8');
    await writeFile(tareaMd, contenido.replace('plan_aprobado: true', 'plan_aprobado: false'));
    commitAll(repoRoot, 'chore: desaprobar para reintentar');

    const mal = spawnSync('node', [BIN, 'approve', 'TASK-920'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.equal(mal.status, CODIGO_SINCRONIZACION_NO_APLICADA, mal.stderr);
    assert.match(mal.stderr, /\[AVISO\] La sincronizacion "node scripts\/sync\.mjs" salio con codigo 1/);
    assert.match(mal.stdout, /aprobada/);
    assert.equal(porcelain(repoRoot), '');
  });
});
