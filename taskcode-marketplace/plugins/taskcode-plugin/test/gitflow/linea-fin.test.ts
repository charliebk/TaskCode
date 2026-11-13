/**
 * TASK-118: todos los scripts de Git-Flow que registran terminan su registro
 * con una linea FIN (operacion, resultado y duracion en segundos), tambien
 * cuando abortan. Repos Git temporales reales; cada script se ejecuta en un
 * repo minimo (casi todos abortan ahi) con la entrada estandar cerrada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
const COMMON = path.join(DIR, '_gitflow-common.sh');
const FIN = /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[FIN  \] FIN: (.+) \| resultado: (.+) \| duracion: (\d+)s$/;

/** Los scripts que abren registro (llaman a initialize_gitflow_log). */
const SCRIPTS = readdirSync(DIR)
  .filter((f) => f.endsWith('.sh') && !f.startsWith('_'))
  .filter((f) => readFileSync(path.join(DIR, f), 'utf8').includes('initialize_gitflow_log'))
  .sort();

function git(args: string[], cwd: string): void {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
}

/** Repo minimo con un commit en main; ejecuta `bash -c cuerpo` y devuelve el codigo y la ultima linea del registro. */
async function ejecutar(cuerpo: string): Promise<{ codigo: number | null; ultima: string; log: string }> {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-gffin-'));
  try {
    git(['init', '-q', '-b', 'main'], repo);
    git(['config', 'user.email', 'test@example.com'], repo);
    git(['config', 'user.name', 'Test'], repo);
    git(['config', 'core.autocrlf', 'false'], repo);
    await writeFile(path.join(repo, 'a.txt'), 'a\n', 'utf8');
    git(['add', '-A'], repo);
    git(['commit', '-q', '-m', 'inicial'], repo);
    const r = spawnSync('bash', ['-c', cuerpo], { cwd: repo, encoding: 'utf8', input: '', timeout: 60_000 });
    const dirLog = path.join(repo, '.git', 'taskcode', 'gitflow');
    const ficheros = await readdir(dirLog);
    const log = await readFile(path.join(dirLog, ficheros[0] as string), 'utf8');
    const lineas = log.split(/\r?\n/).filter((l) => l.trim() !== '');
    return { codigo: r.status, ultima: lineas[lineas.length - 1] ?? '', log };
  } finally {
    await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

const aBash = (p: string): string => p.split(path.sep).join('/');

test('linea FIN (TASK-118): hay scripts que registran', () => {
  assert.ok(SCRIPTS.length >= 20, SCRIPTS.join(', '));
});

for (const script of SCRIPTS) {
  test(`linea FIN (TASK-118): ${script} termina su registro con FIN, operacion, resultado y duracion`, async () => {
    const { codigo, ultima, log } = await ejecutar(`bash "${aBash(path.join(DIR, script))}" task-1-x`);
    const m = FIN.exec(ultima);
    assert.ok(m, `ultima linea sin FIN (codigo ${String(codigo)}):\n${log}`);
    assert.match(log, new RegExp(`INICIO: ${(m[1] as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    // El resultado casa con el codigo de salida, que el trap no cambia.
    if (codigo !== 0) assert.equal(m[2], `ERROR (codigo ${String(codigo)})`);
    else assert.doesNotMatch(m[2] as string, /^ERROR/);
  });
}

test('linea FIN (TASK-118): COMPLETADO, ABORTADO y ERROR, sin cambiar el codigo de salida', async () => {
  const comun = aBash(COMMON);
  const casos: [string, number, string][] = [
    [`source "${comun}"; initialize_gitflow_log op; log_summary COMPLETADO x >/dev/null`, 0, 'COMPLETADO'],
    [`source "${comun}"; initialize_gitflow_log op; exit 0`, 0, 'ABORTADO'],
    [`source "${comun}"; initialize_gitflow_log op; exit 3`, 3, 'ERROR (codigo 3)'],
    [`source "${comun}"; initialize_gitflow_log op; log_summary COMPLETADO >/dev/null; false`, 1, 'ERROR (codigo 1)'],
  ];
  for (const [cuerpo, esperado, resultado] of casos) {
    const { codigo, ultima } = await ejecutar(cuerpo);
    assert.equal(codigo, esperado, cuerpo);
    const m = FIN.exec(ultima);
    assert.ok(m, ultima);
    assert.equal(m[1], 'op');
    assert.equal(m[2], resultado, cuerpo);
  }
});
