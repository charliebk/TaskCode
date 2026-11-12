/**
 * TASK-099: la verificacion ligera de MENORES (`taskctl verificar-menores`),
 * la puerta de `finish` sobre el codigo posterior al revisado y lo que
 * propone `siguiente`. Repos Git temporales de verdad, sin mocks.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { runVerificarMenoresCommand, VerificarMenoresCommandError } from '../../src/commands/verificar-menores.js';
import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
import { runSiguienteCommand } from '../../src/commands/siguiente.js';
import { SECCION_CODIGO_SIN_REVISAR, SECCION_VERIFICACION_LIGERA } from '../../src/core/menores.js';
import {
  SCRIPTS_DIR,
  sampleTask,
  git,
  commitAll,
  withTempRepo,
  setupTaskEnRevision,
} from '../helpers/finish-fixtures.js';

const FILA_MEN1 = '| MEN-1 | MENOR | abierto | src/a.ts:3 | implementacion |';
const FILA_MEN2 = '| MEN-2 | MENOR | abierto | src/b.ts | implementacion |';

function informe(veredicto: string, filas: string[]): string {
  return (
    '# Informe de revision (ronda 1)\n\n- Revisor: code-quality-reviewer\n' +
    `- Veredicto: ${veredicto}\n\n## Hallazgos\n\n` +
    '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
    filas.join('\n') +
    '\n'
  );
}

async function escribir(repoRoot: string, rel: string, texto: string): Promise<void> {
  await mkdir(path.dirname(path.join(repoRoot, rel)), { recursive: true });
  await writeFile(path.join(repoRoot, rel), texto, 'utf8');
}

/**
 * Tarea en revision con codigo revisado (src/a.ts, src/b.ts, src/otro.ts),
 * peticion de la ronda 1 con su `Commit revisado` y el informe dado.
 * Devuelve el SHA revisado.
 */
async function montar(
  repoRoot: string,
  tareasRoot: string,
  id: string,
  veredicto: string,
  filas: string[]
): Promise<{ revisado: string; revisionDir: string }> {
  const task = sampleTask({ id, rama: `feature/${id.toLowerCase()}-menores` });
  await setupTaskEnRevision(repoRoot, tareasRoot, task);
  for (const f of ['src/a.ts', 'src/b.ts', 'src/otro.ts']) await escribir(repoRoot, f, `// ${f}\nexport const x = 1;\n`);
  commitAll(repoRoot, `feat(${id}): codigo revisado`);
  const revisado = git(['rev-parse', 'HEAD'], repoRoot).trim();
  const revisionDir = path.join(tareasRoot, '03-en-revision', id, 'revision');
  await writeFile(
    path.join(revisionDir, 'peticion-revision-1.md'),
    `# Peticion de revision — ${id} (ronda 1)\n\n- Commit revisado (HEAD): ${revisado}\n`,
    'utf8'
  );
  await writeFile(path.join(revisionDir, 'informe-revision-1.md'), informe(veredicto, filas), 'utf8');
  commitAll(repoRoot, `chore(${id}): informe de la ronda 1`);
  return { revisado, revisionDir };
}

const tareaEnRevision = (tareasRoot: string, id: string) => path.join(tareasRoot, '03-en-revision', id, 'tarea.md');
const finish = (tareasRoot: string, repoRoot: string, args: string[]) =>
  runFinishCommand(tareasRoot, args, '2026-11-12', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
const fase = async (tareasRoot: string, repoRoot: string, id: string) =>
  (await runSiguienteCommand(tareasRoot, [id, '--json'], { repoCwd: repoRoot })).fase;

test('verificar-menores: corrige un MENOR, el otro va al backlog, commit solo en tareas/, y finish cierra', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const id = 'TASK-901';
    const { revisado, revisionDir } = await montar(repoRoot, tareasRoot, id, 'aprobada con correcciones', [
      FILA_MEN1,
      FILA_MEN2,
    ]);
    // Antes de corregir: siguiente pide la verificacion ligera, no otra ronda.
    assert.equal(await fase(tareasRoot, repoRoot, id), 'verificar-menores');

    await escribir(repoRoot, 'src/a.ts', '// src/a.ts\nexport const x = 2;\n');
    await escribir(repoRoot, 'test/a.test.ts', '// test nuevo del MENOR\n');
    commitAll(repoRoot, `fix(${id}): MEN-1`);
    // Con la correccion commiteada y sin verificar, tampoco otra ronda.
    assert.equal(await fase(tareasRoot, repoRoot, id), 'verificar-menores');
    const corregido = git(['rev-parse', 'HEAD'], repoRoot).trim();

    const r = await runVerificarMenoresCommand(tareasRoot, [id, '--motivo', 'lo hara TASK-950'], {
      repoCwd: repoRoot,
      ahora: '2026-11-12T10:00:00Z',
    });
    assert.deepEqual(r.corregidos, ['MEN-1']);
    assert.deepEqual(r.pendientes, ['MEN-2']);
    assert.deepEqual(r.ficheros.sort(), ['src/a.ts', 'test/a.test.ts']);
    assert.equal(r.commitRevisado, revisado);
    assert.equal(r.commitVerificado, corregido);

    const tarea = await readFile(tareaEnRevision(tareasRoot, id), 'utf8');
    assert.ok(tarea.includes(SECCION_VERIFICACION_LIGERA));
    assert.ok(tarea.includes(`- 2026-11-12T10:00:00Z: ronda 1; commit revisado ${revisado}; commit verificado ${corregido}`));
    const backlog = await readFile(path.join(revisionDir, 'menores-pendientes.md'), 'utf8');
    assert.ok(backlog.includes('| MEN-2 | src/b.ts | lo hara TASK-950 |'));
    assert.ok(!backlog.includes('MEN-1'));
    // El commit de la verificacion solo toca tareas/.
    const tocados = git(['show', '--name-only', '--format=', 'HEAD'], repoRoot).trim().split('\n');
    assert.ok(tocados.length > 0 && tocados.every((f) => f.startsWith('tareas/')), tocados.join(', '));
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');

    // Con la verificacion al dia: finish (el MENOR del backlog no bloquea).
    assert.equal(await fase(tareasRoot, repoRoot, id), 'finish');
    const cerrada = await finish(tareasRoot, repoRoot, [id]);
    assert.match(cerrada.filePath, /04-terminadas/);
    assert.ok(!(await readFile(cerrada.filePath, 'utf8')).includes(SECCION_CODIGO_SIN_REVISAR));
  });
});

test('verificar-menores: un IMPORTANTE abierto exige cambios-solicitados y otra ronda; no escribe nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const id = 'TASK-902';
    await montar(repoRoot, tareasRoot, id, 'aprobada con correcciones', [
      FILA_MEN1,
      '| IMP-1 | IMPORTANTE | abierto | src/b.ts | implementacion |',
    ]);
    const antes = git(['rev-parse', 'HEAD'], repoRoot).trim();
    await assert.rejects(
      () => runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot }),
      (e: unknown) => {
        assert.ok(e instanceof VerificarMenoresCommandError);
        assert.match((e as Error).message, /IMP-1/);
        assert.match((e as Error).message, /taskctl veredicto TASK-902 cambios-solicitados/);
        return true;
      }
    );
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot).trim(), antes);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
    // siguiente no propone verificar ni cerrar: el veredicto, decidido por una persona.
    const paso = await runSiguienteCommand(tareasRoot, [id, '--json'], { repoCwd: repoRoot });
    assert.equal(paso.fase, 'veredicto');
    assert.equal(paso.comando, `taskctl veredicto ${id} cambios-solicitados`);
  });
});

test('verificar-menores: rechaza tras cambios-solicitados (eso es otra ronda, no una verificacion ligera)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const id = 'TASK-903';
    await montar(repoRoot, tareasRoot, id, 'cambios-solicitados', [FILA_MEN1]);
    await assert.rejects(
      () => runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot }),
      /pidio cambios: corregir y pedir otra ronda con taskctl review/
    );
  });
});

test('codigo fuera de los MENORES: verificar-menores aborta, finish tambien, y --aceptar-sin-revisar lo integra anotado', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const id = 'TASK-904';
    const { revisado } = await montar(repoRoot, tareasRoot, id, 'aprobada con correcciones', [FILA_MEN1]);
    await escribir(repoRoot, 'src/a.ts', '// arreglo del MENOR\n');
    await escribir(repoRoot, 'src/otro.ts', '// cambio que nadie reviso\n');
    commitAll(repoRoot, `fix(${id}): MEN-1 y algo mas`);
    // IMP-1 de la revision: con codigo ajeno, siguiente no encadena un
    // verificar-menores que va a abortar: finish, y lo decide una persona.
    const paso = await runSiguienteCommand(tareasRoot, [id, '--json'], { repoCwd: repoRoot });
    assert.equal(paso.fase, 'finish');
    assert.notEqual(paso.accion, 'continuar', 'nunca sigue solo con codigo sin revisar');

    await assert.rejects(
      () => runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot }),
      (e: unknown) => {
        assert.match((e as Error).message, /src\/otro\.ts/);
        assert.doesNotMatch((e as Error).message, /src\/a\.ts,/);
        assert.match((e as Error).message, /--aceptar-sin-revisar/);
        return true;
      }
    );
    const antes = git(['rev-parse', 'develop'], repoRoot).trim();
    await assert.rejects(
      () => finish(tareasRoot, repoRoot, [id]),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match((e as Error).message, /taskctl verificar-menores TASK-904/);
        assert.match((e as Error).message, /No se ha tocado nada/);
        return true;
      }
    );
    assert.equal(git(['rev-parse', 'develop'], repoRoot).trim(), antes, 'finish no integro nada');

    const cerrada = await finish(tareasRoot, repoRoot, [id, '--aceptar-sin-revisar']);
    const tarea = await readFile(cerrada.filePath, 'utf8');
    assert.ok(tarea.includes(SECCION_CODIGO_SIN_REVISAR));
    assert.ok(tarea.includes(`${revisado.slice(0, 7)}..feature/task-904-menores`));
    assert.match(tarea, /src\/otro\.ts/);
  });
});

test('una verificacion vieja no vale: codigo nuevo despues de verificar vuelve a bloquear finish', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const id = 'TASK-905';
    await montar(repoRoot, tareasRoot, id, 'aprobada con correcciones', [FILA_MEN1]);
    await escribir(repoRoot, 'src/a.ts', '// arreglo\n');
    commitAll(repoRoot, `fix(${id}): MEN-1`);
    await runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot });
    await escribir(repoRoot, 'src/a.ts', '// otro cambio tras verificar\n');
    commitAll(repoRoot, `fix(${id}): mas cambios`);

    assert.equal(await fase(tareasRoot, repoRoot, id), 'verificar-menores');
    await assert.rejects(() => finish(tareasRoot, repoRoot, [id]), /ninguna verificacion ligera cubre: src\/a\.ts/);
    // Verificar otra vez lo desbloquea.
    await runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot });
    assert.equal(await fase(tareasRoot, repoRoot, id), 'finish');
  });
});

test('verificar-menores sin codigo posterior: solo pasa los MENORES al backlog, y finish no lo exige', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const id = 'TASK-906';
    const { revisionDir } = await montar(repoRoot, tareasRoot, id, 'aprobada con correcciones', [FILA_MEN1, FILA_MEN2]);
    const r = await runVerificarMenoresCommand(tareasRoot, [id], { repoCwd: repoRoot });
    assert.deepEqual(r.corregidos, []);
    assert.deepEqual(r.pendientes, ['MEN-1', 'MEN-2']);
    assert.ok(existsSync(path.join(revisionDir, 'menores-pendientes.md')));
    assert.equal(await fase(tareasRoot, repoRoot, id), 'finish');
  });
});

test('finish sin verificacion ligera y sin codigo posterior cierra como antes', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const id = 'TASK-907';
    await montar(repoRoot, tareasRoot, id, 'aprobada', []);
    assert.equal(await fase(tareasRoot, repoRoot, id), 'finish');
    const cerrada = await finish(tareasRoot, repoRoot, [id]);
    assert.match(cerrada.filePath, /04-terminadas/);
  });
});

test('finish con un Commit revisado que ya no es antepasado de la rama no cierra sin una persona', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const id = 'TASK-908';
    const { revisionDir } = await montar(repoRoot, tareasRoot, id, 'aprobada', []);
    const rama = git(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot).trim();
    // Un commit que no esta en la rama de la tarea (como tras reescribirla).
    git(['checkout', '-q', '-b', 'lado', 'develop'], repoRoot);
    await escribir(repoRoot, 'lado.txt', 'x\n');
    commitAll(repoRoot, 'commit de otra rama');
    const ajeno = git(['rev-parse', 'HEAD'], repoRoot).trim();
    git(['checkout', '-q', rama], repoRoot);
    await writeFile(
      path.join(revisionDir, 'peticion-revision-1.md'),
      `# Peticion de revision — ${id} (ronda 1)

- Commit revisado (HEAD): ${ajeno}
`,
      'utf8'
    );
    commitAll(repoRoot, `chore(${id}): peticion con un commit ajeno`);
    await assert.rejects(() => finish(tareasRoot, repoRoot, [id]), /no se puede comparar/);
    const cerrada = await finish(tareasRoot, repoRoot, [id, '--aceptar-sin-revisar']);
    assert.ok((await readFile(cerrada.filePath, 'utf8')).includes(SECCION_CODIGO_SIN_REVISAR));
  });
});
