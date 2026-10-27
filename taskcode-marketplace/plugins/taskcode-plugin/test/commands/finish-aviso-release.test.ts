/**
 * TASK-067: `taskctl finish` de una release avisa, sin bloquear, si no hay un
 * informe de doctor-deploy al dia o si trae alguna FALLA critica. Repos Git
 * temporales reales, los scripts de Git-Flow de verdad y informes generados
 * por el propio doctor-deploy (nunca ejecuta las sondas el finish).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runFinishCommand } from '../../src/commands/finish.js';
import { runDoctorDeployCommand } from '../../src/commands/doctor-deploy.js';
import { readTareaFile } from '../../src/fs/task-store.js';
import { SCRIPTS_DIR, commitAll, git, sampleTask, setupTaskEnRevision, withTempRepo } from '../helpers/finish-fixtures.js';

const ID = 'TASK-720';

async function prepararRelease(repoRoot: string, tareasRoot: string, tipo: 'release' | 'feature' = 'release'): Promise<void> {
  await setupTaskEnRevision(
    repoRoot,
    tareasRoot,
    sampleTask({ id: ID, tipo, rama: tipo === 'release' ? 'release/task-720-q4' : 'feature/task-720-q4' })
  );
}

/** Genera un informe real con --escribir en el repo (sin commitearlo) y devuelve la ruta de su JSON. */
async function generarInforme(repoRoot: string, dia = new Date(2026, 9, 27, 12)): Promise<string> {
  const vacio = await mkdtemp(path.join(tmpdir(), 'taskctl-aviso-path-'));
  try {
    const r = runDoctorDeployCommand(['--escribir'], { repoCwd: repoRoot, opciones: { pathHerramientas: vacio }, ahora: () => dia });
    assert.ok(r.rutaJson !== null);
    return r.rutaJson;
  } finally {
    await rm(vacio, { recursive: true, force: true });
  }
}

/** Cierra la release y devuelve los avisos que salieron ANTES del merge. */
async function cerrar(repoRoot: string, tareasRoot: string): Promise<string[]> {
  const avisos: string[] = [];
  await runFinishCommand(tareasRoot, [ID], '2026-10-27', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR, onAviso: (a) => avisos.push(a) });
  const t = await readTareaFile(tareasRoot, ID);
  assert.equal(t?.task.estado, 'terminada', 'el aviso nunca bloquea el cierre');
  return avisos.filter((a) => /doctor-deploy/.test(a));
}

async function editarInforme(rutaJson: string, cambio: (o: { puntos: Array<Record<string, unknown>> }) => void): Promise<void> {
  const o = JSON.parse(await readFile(rutaJson, 'utf8')) as { puntos: Array<Record<string, unknown>> };
  cambio(o);
  await writeFile(rutaJson, JSON.stringify(o), 'utf8');
}

test('release sin informe de doctor-deploy: avisa de que no hay ninguno y se cierra igualmente', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot);
    const avisos = await cerrar(repoRoot, tareasRoot);
    assert.equal(avisos.length, 1, avisos.join('\n'));
    assert.match(avisos[0] as string, /no hay un informe de doctor-deploy al dia/);
    assert.match(avisos[0] as string, /no hay ningun informe en docs\/doctor-deploy/);
    assert.match(avisos[0] as string, /taskctl doctor-deploy --escribir/);
    assert.match(avisos[0] as string, /La tarea se cierra igualmente/);
  });
});

test('una tarea que no es release no avisa de doctor-deploy', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot, 'feature');
    assert.deepEqual(await cerrar(repoRoot, tareasRoot), []);
  });
});

test('informe cuyo commit es la punta (informe ignorado por Git, arbol limpio): no avisa', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot);
    await generarInforme(repoRoot);
    // Sin commitear, el arbol no estaria limpio: se deja fuera de Git para que su commit SEA la punta.
    await writeFile(path.join(repoRoot, '.git', 'info', 'exclude'), 'docs/doctor-deploy/\n', { flag: 'a' });
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
    assert.deepEqual(await cerrar(repoRoot, tareasRoot), []);
  });
});

test('informe de un ancestro con SOLO docs/doctor-deploy/ cambiado desde entonces (el informe se commitea despues): no avisa', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot);
    await generarInforme(repoRoot);
    commitAll(repoRoot, 'docs: informe de doctor-deploy');
    await writeFile(path.join(repoRoot, 'docs', 'doctor-deploy', 'nota.md'), 'otra cosa de la carpeta\n', 'utf8');
    commitAll(repoRoot, 'docs: nota');
    assert.deepEqual(await cerrar(repoRoot, tareasRoot), []);
  });
});

test('informe de un ancestro con codigo cambiado despues: avisa diciendo cuantos ficheros cambiaron', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot);
    await generarInforme(repoRoot);
    commitAll(repoRoot, 'docs: informe');
    await writeFile(path.join(repoRoot, 'nuevo.js'), 'x\n', 'utf8');
    await writeFile(path.join(repoRoot, 'otro.js'), 'y\n', 'utf8');
    commitAll(repoRoot, 'feat: codigo nuevo');
    const avisos = await cerrar(repoRoot, tareasRoot);
    assert.equal(avisos.length, 1, avisos.join('\n'));
    assert.match(avisos[0] as string, /el mas reciente \(2026-10-27\.json\) es del commit [0-9a-f]{12} y desde entonces ha cambiado 2 ficheros fuera de docs\/doctor-deploy\//);
  });
});

test('informe con FALLA de un punto critico: avisa nombrandolo; una FALLA no critica no avisa', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot);
    const ruta = await generarInforme(repoRoot);
    await editarInforme(ruta, (o) => {
      const a = o.puntos.find((p) => p['severidad'] === 'alta') as Record<string, unknown>;
      a['estado'] = 'falla';
    });
    commitAll(repoRoot, 'docs: informe con una FALLA alta');
    assert.deepEqual(await cerrar(repoRoot, tareasRoot), [], 'una FALLA que no es critica no avisa');
  });
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot);
    const ruta = await generarInforme(repoRoot);
    let ids: string[] = [];
    await editarInforme(ruta, (o) => {
      const criticos = o.puntos.filter((p) => p['severidad'] === 'critica').slice(0, 2);
      for (const p of criticos) p['estado'] = 'falla';
      ids = criticos.map((p) => String(p['id']));
    });
    commitAll(repoRoot, 'docs: informe con FALLAS criticas');
    const avisos = await cerrar(repoRoot, tareasRoot);
    assert.equal(avisos.length, 1, avisos.join('\n'));
    assert.match(avisos[0] as string, /tiene 2 FALLAS criticas: /);
    for (const id of ids) assert.ok((avisos[0] as string).includes(id), id);
  });
});

test('con varios informes vale el valido mas reciente: uno viejo con FALLA critica no avisa si el nuevo esta bien', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot);
    const viejo = await generarInforme(repoRoot, new Date(2026, 9, 20, 12));
    await editarInforme(viejo, (o) => {
      (o.puntos.find((p) => p['severidad'] === 'critica') as Record<string, unknown>)['estado'] = 'falla';
    });
    commitAll(repoRoot, 'docs: informe viejo');
    await generarInforme(repoRoot, new Date(2026, 9, 27, 12));
    commitAll(repoRoot, 'docs: informe nuevo');
    assert.deepEqual(await readdir(path.join(repoRoot, 'docs', 'doctor-deploy')).then((l) => l.filter((f) => f.endsWith('.json')).sort()), ['2026-10-20.json', '2026-10-27.json']);
    assert.deepEqual(await cerrar(repoRoot, tareasRoot), []);
  });
});

test('informe de un commit que no esta en la historia, o ilegible, o solo en Markdown: avisa con su motivo, nunca rompe', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot);
    const ruta = await generarInforme(repoRoot);
    const o = JSON.parse(await readFile(ruta, 'utf8')) as Record<string, unknown>;
    o['commit'] = 'a'.repeat(40);
    await writeFile(ruta, JSON.stringify(o), 'utf8');
    await writeFile(path.join(path.dirname(ruta), '2026-01-01.json'), '{esto no es json', 'utf8');
    commitAll(repoRoot, 'docs: informe raro');
    const avisos = await cerrar(repoRoot, tareasRoot);
    assert.equal(avisos.length, 1, avisos.join('\n'));
    assert.match(avisos[0] as string, /es del commit a{12}, que no esta en la historia de la release/);
    assert.match(avisos[0] as string, /1 fichero \.json no se pudo leer: 2026-01-01\.json/);
  });
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot);
    await mkdir(path.join(repoRoot, 'docs', 'doctor-deploy'), { recursive: true });
    await writeFile(path.join(repoRoot, 'docs', 'doctor-deploy', 'antiguo.md'), 'x', 'utf8');
    commitAll(repoRoot, 'docs: informe en markdown');
    const avisos = await cerrar(repoRoot, tareasRoot);
    assert.match(avisos[0] as string, /solo hay informes en Markdown \(1 fichero\)/);
  });
});

test('un .taskcode/doctor-deploy.yml roto no rompe el cierre ni el aviso (finish no lee la configuracion de doctor-deploy)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await prepararRelease(repoRoot, tareasRoot);
    await generarInforme(repoRoot);
    commitAll(repoRoot, 'docs: informe');
    // El config roto no se commitea (si no, cambiaria codigo desde el informe): queda fuera de Git.
    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(repoRoot, '.taskcode', 'doctor-deploy.yml'), 'desactivar_1_id: x\n', 'utf8');
    await writeFile(path.join(repoRoot, '.git', 'info', 'exclude'), '.taskcode/doctor-deploy.yml\n', { flag: 'a' });
    assert.throws(() => runDoctorDeployCommand([], { repoCwd: repoRoot, opciones: { pathHerramientas: '' } }), /desactivar|motivo/);
    // Roto: un desactivar sin motivo aborta a doctor-deploy, pero finish no lo lee.
    assert.deepEqual(await cerrar(repoRoot, tareasRoot), []);
  });
});
