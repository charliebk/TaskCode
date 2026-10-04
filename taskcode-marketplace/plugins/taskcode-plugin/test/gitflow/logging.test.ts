/**
 * TASK-037: el logging de los scripts de Git-Flow no lanza procesos.
 *
 * Cronometrar no prueba nada (depende de la carga de la maquina). Lo que
 * se prueba es el hecho: `date` se redefine como funcion de bash que
 * cuenta sus llamadas (las sustituciones `$(date ...)` tambien la ven),
 * y se comprueba que el camino rapido no la llama ni una vez, que la
 * caida para bash antiguo si la usa, y que las dos dan lineas con la
 * misma forma en pantalla y en el fichero de log.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COMMON = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow', '_gitflow-common.sh');
const LINEA = /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[INFO \] hola mundo$/;

/** Ejecuta un trozo de bash con `date` instrumentado; devuelve stdout y llamadas a date. */
async function conDateContado(
  cuerpo: string,
  env: Record<string, string> = {}
): Promise<{ stdout: string; llamadasDate: number; log: string }> {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-gflog-'));
  try {
    assert.equal(spawnSync('git', ['init', '-q'], { cwd: repo }).status, 0);
    const comun = COMMON.split(path.sep).join('/');
    const script =
      'DATE_LLAMADAS=0\n' +
      'date() { DATE_LLAMADAS=$((DATE_LLAMADAS+1)); echo x >> .date-llamadas; command date "$@"; }\n' +
      `source "${comun}"\n` +
      cuerpo +
      '\n';
    const r = spawnSync('bash', ['-c', script], {
      cwd: repo,
      encoding: 'utf8',
      env: { ...process.env, ...env },
    });
    assert.equal(r.status, 0, r.stderr);
    let llamadas = 0;
    try {
      llamadas = (await readFile(path.join(repo, '.date-llamadas'), 'utf8')).split('\n').filter(Boolean).length;
    } catch {
      llamadas = 0;
    }
    const dirLog = path.join(repo, '.git', 'taskcode', 'gitflow');
    const ficheros = await readdir(dirLog);
    const log = await readFile(path.join(dirLog, ficheros[0] as string), 'utf8');
    return { stdout: r.stdout, llamadasDate: llamadas, log };
  } finally {
    await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

const CUERPO = 'initialize_gitflow_log "prueba"\nlog_info "hola mundo"\nlog_summary >/dev/null';

test('logging de Git-Flow (TASK-037): con bash moderno no lanza ningun date y la linea tiene la forma de siempre', async () => {
  const r = await conDateContado(CUERPO);
  assert.equal(r.llamadasDate, 0, 'el camino rapido no deberia lanzar date');
  assert.match(r.stdout.trim().split('\n')[0] as string, LINEA);
  assert.ok(
    r.log.split(/\r?\n/).some((l) => LINEA.test(l)),
    `la linea tiene que estar tambien en el fichero de log:\n${r.log}`
  );
  assert.match(r.log, /INICIO: prueba/);
});

test('logging de Git-Flow (TASK-037): la caida para bash antiguo usa date y da la misma forma', async () => {
  const r = await conDateContado(CUERPO, { GF_FORZAR_DATE: '1' });
  assert.ok(r.llamadasDate > 0, 'la caida tiene que usar date');
  assert.match(r.stdout.trim().split('\n')[0] as string, LINEA);
  assert.ok(r.log.split(/\r?\n/).some((l) => LINEA.test(l)));
});

test('logging de Git-Flow (TASK-037): el fichero de log se llama por la fecha de hoy en los dos caminos', async () => {
  const hoy = /gitflow-\d{4}-\d{2}-\d{2}\.log/;
  for (const env of [{}, { GF_FORZAR_DATE: '1' }]) {
    const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-gflog-'));
    try {
      spawnSync('git', ['init', '-q'], { cwd: repo });
      const comun = COMMON.split(path.sep).join('/');
      const r = spawnSync('bash', ['-c', `source "${comun}"\ninitialize_gitflow_log x`], {
        cwd: repo,
        encoding: 'utf8',
        env: { ...process.env, ...env },
      });
      assert.equal(r.status, 0, r.stderr);
      const ficheros = await readdir(path.join(repo, '.git', 'taskcode', 'gitflow'));
      assert.ok(ficheros.some((f) => hoy.test(f)), ficheros.join(', '));
    } finally {
      await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
    }
  }
});
