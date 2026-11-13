/**
 * TASK-120: la sincronizacion deja su duracion en el registro de puertas
 * (`.git/taskcode/puertas.log`), corre solo en las fases de
 * `fases_sincronizacion` (sin la clave, en todas) y `metricas` la suma por
 * tarea. Repos Git temporales reales con el script de sincronizacion de los
 * demas tests (test/helpers/sincronizacion-fixtures.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runApproveCommand } from '../../src/commands/approve.js';
import { parsearRegistroPuertas } from '../../src/core/registro-puertas.js';
import { ConfigError, parsearConfig } from '../../src/core/config.js';
import { rutaRegistroPuertas } from '../../src/fs/registro-puertas.js';
import { BIN, CONFIG_SYNC, ficherosDeHead, withRepoSincronizado } from '../helpers/sincronizacion-fixtures.js';

async function registro(repoRoot: string): Promise<string> {
  const ruta = rutaRegistroPuertas(repoRoot);
  assert.ok(ruta);
  return existsSync(ruta) ? readFile(ruta, 'utf8') : '';
}

/** La celda de la columna sinc de la fila de `id` en la tabla de `metricas`. */
function celdaSinc(stdout: string, id: string): string {
  const lineas = stdout.split('\n');
  const celdas = (l: string): string[] => l.split('|').map((c) => c.trim());
  const cab = celdas(lineas.find((l) => l.startsWith('| id ')) ?? '');
  const fila = celdas(lineas.find((l) => l.startsWith(`| ${id} `)) ?? '');
  const i = cab.indexOf('sinc');
  assert.ok(i > 0, stdout);
  return fila[i] as string;
}

const aprobar = (repoRoot: string, tareasRoot: string) =>
  runApproveCommand(tareasRoot, ['TASK-920'], '2026-11-13', { repoCwd: repoRoot });

test('sincronizacion (TASK-120, criterio 1): cada ejecucion anota puerta, tarea, instante, fase, duracion y resultado', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    const antes = Date.now();
    const a = await aprobar(repoRoot, tareasRoot);
    assert.equal(a.autoCommit.sincronizacion.estado, 'aplicada');
    const texto = await registro(repoRoot);
    const lineas = parsearRegistroPuertas(texto);
    assert.equal(lineas.length, 1, texto);
    const [l] = lineas;
    assert.equal(l?.puerta, 'sincronizacion');
    assert.equal(l?.tarea, 'TASK-920');
    assert.equal(l?.modo, 'approve');
    assert.equal(l?.resultado, 'aplicada');
    assert.ok((l?.duracionS ?? -1) >= 0);
    assert.ok(Date.parse(l?.instante ?? '') >= antes - 1000, l?.instante);
    // El registro vive en el directorio de Git: no ensucia el arbol.
    assert.equal(spawnSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim(), '');
  });
});

test('sincronizacion (TASK-120, criterio 2): con fases_sincronizacion no corre en otra fase, y en la listada si', async () => {
  await withRepoSincronizado(`${CONFIG_SYNC}fases_sincronizacion: [finish]\n`, async (repoRoot, tareasRoot) => {
    const a = await aprobar(repoRoot, tareasRoot);
    assert.equal(a.autoCommit.sincronizacion.estado, 'no-configurada', 'approve no esta en la lista');
    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'el derivado no se regenero');
    assert.equal(await registro(repoRoot), '', 'sin ejecucion no hay linea');
  });
  await withRepoSincronizado(`${CONFIG_SYNC}fases_sincronizacion: [approve, finish]\n`, async (repoRoot, tareasRoot) => {
    const a = await aprobar(repoRoot, tareasRoot);
    assert.equal(a.autoCommit.sincronizacion.estado, 'aplicada');
  });
});

test('config (TASK-120): fases_sincronizacion valida, sin repetir, y rechaza fases desconocidas o vacias', () => {
  const RUTA = '/repo/.taskcode/config.yml';
  assert.equal(parsearConfig('limite_wip: 1\n', RUTA).fases_sincronizacion, null);
  assert.deepEqual(parsearConfig('fases_sincronizacion: [plan, finish, plan]\n', RUTA).fases_sincronizacion, ['plan', 'finish']);
  for (const malo of ['[]', '[planificar]', 'finish', '[plan, ""]']) {
    assert.throws(() => parsearConfig(`fases_sincronizacion: ${malo}\n`, RUTA), ConfigError, malo);
  }
});

test('metricas (TASK-120, criterio 3): suma la sincronizacion por tarea e ignora las puertas que no conoce', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await aprobar(repoRoot, tareasRoot);
    const ruta = rutaRegistroPuertas(repoRoot) as string;
    await appendFile(ruta, 'sincronizacion\tTASK-920\t2026-11-13T00:00:00.000Z\tplan\t120.0\taplicada\n', 'utf8');
    await appendFile(ruta, 'freno-stop\tTASK-920\t2026-11-13T00:00:00.000Z\tturno\t999.0\tverde\n', 'utf8');
    const r = spawnSync(process.execPath, [BIN, 'metricas'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    // 120 s anotados a mano mas lo que tardo el approve real: 2m; freno-stop (999 s) no cuenta.
    assert.equal(celdaSinc(r.stdout, 'TASK-920'), '2m', r.stdout);
  });
});

test('metricas (TASK-120): sin registro la columna sinc sale con "—"', async () => {
  await withRepoSincronizado(null, async (repoRoot) => {
    const r = spawnSync(process.execPath, [BIN, 'metricas'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(celdaSinc(r.stdout, 'TASK-920'), '—');
    assert.ok(!existsSync(path.join(repoRoot, '.git', 'taskcode', 'puertas.log')));
  });
});

/** La celda de `columna` de la fila de `id` en la tabla de `metricas`. */
function celda(stdout: string, id: string, columna: string): string {
  const lineas = stdout.split('\n');
  const celdas = (l: string): string[] => l.split('|').map((c) => c.trim());
  const cab = celdas(lineas.find((l) => l.startsWith('| id ')) ?? '');
  const fila = celdas(lineas.find((l) => l.startsWith(`| ${id} `)) ?? '');
  const i = cab.indexOf(columna);
  assert.ok(i > 0, stdout);
  return fila[i] as string;
}

test('metricas (TASK-111, criterio 2; IMP-2): el CLI lee el freno del registro real: ejecuciones sin omitidos y tiempo total', async () => {
  await withRepoSincronizado(null, async (repoRoot) => {
    const ruta = rutaRegistroPuertas(repoRoot) as string;
    await mkdir(path.dirname(ruta), { recursive: true });
    await appendFile(
      ruta,
      [
        'freno\tTASK-920\t2026-11-13T00:00:00.000Z\tselectiva\t60.0\tverde',
        'freno\tTASK-920\t2026-11-13T00:01:00.000Z\tselectiva\t65.0\trojo',
        'freno\tTASK-920\t2026-11-13T00:02:00.000Z\tselectiva\t0.0\tomitido',
        'freno\tTASK-999\t2026-11-13T00:02:00.000Z\tselectiva\t500.0\tverde',
        'sincronizacion\tTASK-920\t2026-11-13T00:00:00.000Z\tplan\t900.0\taplicada',
        '',
      ].join('\n'),
      'utf8'
    );
    const r = spawnSync(process.execPath, [BIN, 'metricas'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(celda(r.stdout, 'TASK-920', 'freno_n'), '2', r.stdout);
    assert.equal(celda(r.stdout, 'TASK-920', 'freno'), '2m', r.stdout);
  });
});

test('metricas (TASK-111): sin lineas del freno, freno_n y freno salen con "—"', async () => {
  await withRepoSincronizado(null, async (repoRoot) => {
    const r = spawnSync(process.execPath, [BIN, 'metricas'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual([celda(r.stdout, 'TASK-920', 'freno_n'), celda(r.stdout, 'TASK-920', 'freno')], ['—', '—']);
  });
});
