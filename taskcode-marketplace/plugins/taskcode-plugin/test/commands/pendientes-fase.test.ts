/**
 * TASK-119 (P-11): menos commits de proceso por tarea. `registrar-coste` y
 * `veredicto` no commitean; lo que dejan en la carpeta de la tarea lo absorbe
 * el commit del siguiente comando de fase (`approve`, `review`, `finish`),
 * cuyas guardas solo dejan pasar eso. Contra repos Git temporales reales: la
 * evidencia sale de `git log`, `git status` y `git stash list`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readTareaFile } from '../../src/fs/task-store.js';
import { mensajeApartado } from '../../src/fs/pendientes.js';
import {
  ID,
  CONFIG_AUTO,
  git,
  cli,
  cliOk,
  withRepo,
  dirRevision,
  nueva,
  codigo,
  siguiente,
  resumen,
} from '../helpers/automatico-fixtures.js';

/**
 * Commits de proceso de un ciclo new..finish con una ronda ANTES de TASK-119,
 * contados en el historial de TASK-112 mas los tres `registrar-coste` que
 * piden las skills: creada, en diseno, plan final (a mano), coste de diseno,
 * plan aprobado, en curso, coste de implementacion, peticion, informe (a
 * mano), veredicto, coste de revision y terminada. Sin contar el merge.
 */
const COMMITS_DE_PROCESO_ANTES = 12;

/** Commits de la tarea que no son codigo ni merges (los de proceso). */
function commitsDeProceso(repo: string): string[] {
  return git(['log', '--no-merges', '--format=%s', 'develop'], repo)
    .split('\n')
    .filter((s) => s.includes(`(${ID})`) && !s.startsWith(`feat(${ID})`));
}

/** El revisor rellena el informe, SIN commitearlo (lo absorbe el siguiente comando). */
async function rellenarSinCommit(informe: string): Promise<void> {
  const texto = await readFile(informe, 'utf8');
  const relleno = texto
    .replace(/^- Revisor: \(rellenar.*$/m, '- Revisor: revisor independiente de prueba')
    .replace(/^\| \(ej\. IMP-1\).*$/m, '| MEN-1 | MENOR | aceptado | app.txt |');
  assert.notEqual(relleno, texto, 'el informe tenia la plantilla');
  await writeFile(informe, relleno, 'utf8');
}

/** new, plan (con plan final y coste sin commitear), approve, start y un commit de codigo. */
async function hastaCodigoSinCommits(repo: string, tareasRoot: string): Promise<void> {
  nueva(repo, 'feature', 'Menos commits');
  cliOk(repo, ['plan', ID]);
  await writeFile(
    path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md'),
    '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt.\n',
    'utf8'
  );
  cliOk(repo, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '100']);
  cliOk(repo, ['approve', ID, '--decidido-por', 'automatico']);
  assert.equal(git(['status', '--porcelain'], repo).trim(), '', 'approve absorbe el plan final y el coste');
  cliOk(repo, ['start', ID]);
  await codigo(repo, 'cambiado\n', `feat(${ID}): trabajo`);
}

/** review, informe relleno, veredicto aprobada y coste de revision: todo sin commitear. */
async function hastaVeredictoPendiente(repo: string, tareasRoot: string): Promise<string> {
  cliOk(repo, ['registrar-coste', ID, '--fase', 'implementacion', '--tokens', '200']);
  cliOk(repo, ['review', ID]);
  assert.equal(git(['status', '--porcelain'], repo).trim(), '', 'review absorbe el coste de implementacion');
  const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
  await rellenarSinCommit(informe);
  cliOk(repo, ['veredicto', ID, 'aprobada']);
  cliOk(repo, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '300']);
  return informe;
}

test('TASK-119: un ciclo new..finish con una ronda deja como mucho la mitad de commits de proceso', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await hastaCodigoSinCommits(repo, tareasRoot);
    await hastaVeredictoPendiente(repo, tareasRoot);
    assert.notEqual(git(['status', '--porcelain'], repo).trim(), '', 'veredicto, informe y coste quedan pendientes');
    // Con el informe sin commitear, siguiente no lo manda a una persona: lo absorbe finish.
    assert.deepEqual(resumen(siguiente(repo)), ['finish', 'continuar']);

    cliOk(repo, ['finish', ID]);
    assert.equal(git(['status', '--porcelain'], repo).trim(), '', 'finish absorbe lo pendiente');
    assert.deepEqual(git(['stash', 'list'], repo).trim(), '', 'no queda ningun stash');

    const proceso = commitsDeProceso(repo);
    assert.deepEqual(proceso.reverse(), [
      `chore(${ID}): tarea creada`,
      `chore(${ID}): tarea en diseno`,
      `chore(${ID}): plan aprobado`,
      `chore(${ID}): tarea en curso`,
      `chore(${ID}): peticion de revision ronda 1`,
      `chore(${ID}): tarea terminada y artefactos de cierre`,
    ]);
    assert.ok(proceso.length * 2 <= COMMITS_DE_PROCESO_ANTES, `${String(proceso.length)} commits de proceso`);

    // Lo absorbido esta commiteado en la rama de integracion: costes y veredicto.
    const t = await readTareaFile(tareasRoot, ID);
    assert.ok(t);
    assert.equal(t.task.estado, 'terminada');
    assert.deepEqual([t.task.tokens_diseno, t.task.tokens_implementacion, t.task.tokens_revision], [100, 200, 300]);
    const informe = path.join(path.dirname(t.filePath), 'revision', 'informe-revision-1.md');
    const rel = path.relative(repo, informe).split(path.sep).join('/');
    assert.match(git(['show', `HEAD:${rel}`], repo), /^- Veredicto: aprobada$/m);
    assert.match(git(['show', `HEAD:${rel}`], repo), /revisor independiente de prueba/);
  });
});

test('TASK-119: approve, review y finish siguen abortando con un cambio fuera de la carpeta de la tarea', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    nueva(repo, 'feature', 'Guardas');
    cliOk(repo, ['plan', ID]);
    await writeFile(
      path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md'),
      '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt.\n',
      'utf8'
    );
    await writeFile(path.join(repo, 'app.txt'), 'a medias\n', 'utf8');
    const aprobar = cli(repo, ['approve', ID, '--decidido-por', 'automatico']);
    assert.equal(aprobar.status, 1, aprobar.stdout);
    assert.match(aprobar.stderr, /cambios sin guardar/);
    git(['checkout', '--', 'app.txt'], repo);
    cliOk(repo, ['approve', ID, '--decidido-por', 'automatico']);
    cliOk(repo, ['start', ID]);
    await codigo(repo, 'cambiado\n', `feat(${ID}): trabajo`);
    cliOk(repo, ['registrar-coste', ID, '--fase', 'implementacion', '--tokens', '5']);

    await writeFile(path.join(repo, 'app.txt'), 'a medias\n', 'utf8');
    const revisar = cli(repo, ['review', ID]);
    assert.equal(revisar.status, 1, revisar.stdout);
    assert.match(revisar.stderr, /el workspace tiene cambios sin commitear/);
    assert.equal(git(['stash', 'list'], repo).trim(), '', 'no aparta nada si aborta en la guarda');
    git(['checkout', '--', 'app.txt'], repo);
    cliOk(repo, ['review', ID]);

    const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
    await rellenarSinCommit(informe);
    cliOk(repo, ['veredicto', ID, 'aprobada']);
    await writeFile(path.join(repo, 'app.txt'), 'a medias\n', 'utf8');
    const cerrar = cli(repo, ['finish', ID]);
    assert.equal(cerrar.status, 1, cerrar.stdout);
    assert.match(cerrar.stderr, /el workspace tiene cambios sin commitear/);
    assert.equal(git(['stash', 'list'], repo).trim(), '');
    assert.match(await readFile(informe, 'utf8'), /^- Veredicto: aprobada$/m, 'el veredicto pendiente sigue ahi');
  });
});

test('TASK-119: el stash de un finish que murio lo recupera el siguiente intento, y no mezcla con cambios nuevos', async () => {
  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
    await hastaCodigoSinCommits(repo, tareasRoot);
    const informe = await hastaVeredictoPendiente(repo, tareasRoot);
    // Lo que deja un finish que muere con lo pendiente apartado.
    const carpeta = path.relative(repo, path.dirname(path.dirname(informe))).split(path.sep).join('/');
    git(['stash', 'push', '-q', '-u', '-m', mensajeApartado(ID), '--', carpeta], repo);
    assert.doesNotMatch(await readFile(informe, 'utf8'), /^- Veredicto: aprobada$/m, 'el veredicto esta en el stash');

    // Con cambios nuevos en la carpeta, no mezcla: aborta sin tocar el stash.
    const tarea = path.join(path.dirname(path.dirname(informe)), 'tarea.md');
    const original = await readFile(tarea, 'utf8');
    await writeFile(tarea, `${original}\nnota nueva\n`, 'utf8');
    const mezcla = cli(repo, ['finish', ID]);
    assert.equal(mezcla.status, 1, mezcla.stdout);
    assert.match(mezcla.stderr, /hay un stash de un intento anterior/);
    assert.match(git(['stash', 'list'], repo), new RegExp(mensajeApartado(ID)));
    await writeFile(tarea, original, 'utf8');

    cliOk(repo, ['finish', ID]);
    assert.equal(git(['stash', 'list'], repo).trim(), '', 'el stash se recupero y se consumio');
    assert.equal(git(['status', '--porcelain'], repo).trim(), '');
    const t = await readTareaFile(tareasRoot, ID);
    assert.equal(t?.task.estado, 'terminada');
    assert.equal(t?.task.tokens_revision, 300);
  });
});
