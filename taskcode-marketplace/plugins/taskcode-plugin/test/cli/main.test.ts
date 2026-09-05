/**
 * Tests de integracion sobre el punto de entrada real, "main()" de
 * src/cli.ts (hallazgo MENOR de revision por pares, TASK-004:
 * ningun test invocaba main() directamente, asi que el hallazgo
 * IMPORTANTE de "import siempre sale con codigo 0" no lo detectaba
 * nada). Se centra en el comando "import" (donde salio el hallazgo),
 * no reimplementa la cobertura ya exhaustiva de runImportCommand.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { main } from '../../src/cli.js';

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

async function withTempRepoCwd(fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-cli-'));
  const cwdAntes = process.cwd();
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    process.chdir(repoRoot);
    await fn(repoRoot);
  } finally {
    process.chdir(cwdAntes);
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/** Captura process.stdout/stderr.write durante fn(), sin dejar de escribir de verdad si algo mas los usa a la vez. */
async function captureOutput(fn: () => Promise<number>): Promise<{ code: number; stdout: string; stderr: string }> {
  const outChunks: string[] = [];
  const errChunks: string[] = [];
  const originalOut = process.stdout.write.bind(process.stdout);
  const originalErr = process.stderr.write.bind(process.stderr);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process.stdout as any).write = (chunk: string) => {
    outChunks.push(String(chunk));
    return true;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process.stderr as any).write = (chunk: string) => {
    errChunks.push(String(chunk));
    return true;
  };
  try {
    const code = await fn();
    return { code, stdout: outChunks.join(''), stderr: errChunks.join('') };
  } finally {
    process.stdout.write = originalOut;
    process.stderr.write = originalErr;
  }
}

test('main: "taskctl import" con todas las entradas malformadas sale con codigo 1 (hallazgo IMPORTANTE de revision por pares, TASK-004)', async () => {
  await withTempRepoCwd(async (repoRoot) => {
    const md = path.join(tmpdir(), `cli-test-bad-${Date.now()}.md`);
    await writeFile(md, '### Sin criterios\n\n', 'utf8');
    const { code, stderr } = await captureOutput(() => main(['import', md]));
    assert.equal(code, 1);
    assert.match(stderr, /\[ERROR\]/);
    await rm(md, { force: true });
  });
});

test('main: "taskctl import" con al menos una entrada valida sale con codigo 0', async () => {
  await withTempRepoCwd(async (repoRoot) => {
    const md = path.join(tmpdir(), `cli-test-ok-${Date.now()}.md`);
    await writeFile(md, '### Tarea valida\n- criterio\n', 'utf8');
    const { code, stdout } = await captureOutput(() => main(['import', md]));
    assert.equal(code, 0);
    assert.match(stdout, /Tarea TASK-001 creada/);
    await rm(md, { force: true });
  });
});

test('main: "taskctl import" mezcla validas y malformadas -> sale con codigo 1 pese a crear alguna (partial failure sigue siendo failure para scripts)', async () => {
  await withTempRepoCwd(async (repoRoot) => {
    const md = path.join(tmpdir(), `cli-test-mix-${Date.now()}.md`);
    await writeFile(md, '### Valida\n- criterio\n\n### Sin criterios\n\n', 'utf8');
    const { code, stdout } = await captureOutput(() => main(['import', md]));
    assert.equal(code, 1);
    assert.match(stdout, /1 creada/);
    await rm(md, { force: true });
  });
});

// --- item B6: --asignado-a en plan y start ---

test('main: la ayuda documenta --asignado-a en plan y en start', async () => {
  const { code, stdout } = await captureOutput(() => main(['--help']));
  assert.equal(code, 0);
  assert.ok(stdout.includes('taskctl plan TASK-NNN [--asignado-a <persona>]'));
  assert.ok(stdout.includes('taskctl start TASK-NNN [--asignado-a <persona>]'));
});

test('main: taskctl plan --asignado-a confirma la asignacion y la deja en tarea.md', async () => {
  await withTempRepoCwd(async (repoRoot) => {
    const creada = await captureOutput(() => main(['new', '--titulo', 'Probar asignacion', '--tipo', 'feature']));
    assert.equal(creada.code, 0);
    // plan exige workspace limpio, asi que se commitea lo que dejo
    // new (misma secuencia que en uso real).
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'tarea nueva'], repoRoot);

    const { code, stdout } = await captureOutput(() =>
      main(['plan', 'TASK-001', '--asignado-a', 'carlos'])
    );

    assert.equal(code, 0);
    assert.ok(stdout.includes('Asignada a "carlos".'), stdout);

    const md = await readFile(
      path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-001', 'tarea.md'),
      'utf8'
    );
    assert.ok(md.includes('asignado_a: carlos'), md);
  });
});

test('main: sin --asignado-a no se imprime ninguna linea de asignacion', async () => {
  await withTempRepoCwd(async (repoRoot) => {
    const creada = await captureOutput(() => main(['new', '--titulo', 'Sin asignar', '--tipo', 'feature']));
    assert.equal(creada.code, 0);
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'tarea nueva'], repoRoot);

    const { code, stdout } = await captureOutput(() => main(['plan', 'TASK-001']));

    assert.equal(code, 0);
    assert.ok(!stdout.includes('Asignada a'), stdout);
  });
});

test('main: un --asignado-a sin valor sale con codigo 1 y mensaje util, no con un stack trace', async () => {
  await withTempRepoCwd(async (repoRoot) => {
    const creada = await captureOutput(() => main(['new', '--titulo', 'Flag roto', '--tipo', 'feature']));
    assert.equal(creada.code, 0);
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'tarea nueva'], repoRoot);

    const { code, stderr } = await captureOutput(() => main(['plan', 'TASK-001', '--asignado-a']));

    assert.equal(code, 1);
    assert.ok(stderr.includes('necesita un valor'), stderr);
    // Un solo prefijo [ERROR], no dos (printCliError).
    assert.equal(stderr.indexOf('[ERROR]'), stderr.lastIndexOf('[ERROR]'));
  });
});
