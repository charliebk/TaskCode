/**
 * TASK-023: `taskctl registrar-coste` por CLI, contra repos Git temporales
 * reales. La evidencia sale del fichero y de `git log`, no de lo que imprime
 * el comando: suma, null intacto, un solo fichero en el commit, rechazos sin
 * efectos, tarea terminada y las precondiciones de rama y de tarea.md limpio.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readTareaFile } from '../../src/fs/task-store.js';
import {
  ID,
  CONFIG_AUTO,
  git,
  cli,
  cliOk,
  withRepo,
  dirRevision,
  hastaCodigo,
  nueva,
  rellenarInforme,
  siguiente,
} from '../helpers/automatico-fixtures.js';

async function costes(tareasRoot: string): Promise<[number | null, number | null, number | null]> {
  const t = await readTareaFile(tareasRoot, ID);
  assert.ok(t);
  return [t.task.tokens_diseno, t.task.tokens_implementacion, t.task.tokens_revision];
}

const head = (repo: string): string => git(['rev-parse', 'HEAD'], repo).trim();

test('registrar-coste: suma en varias llamadas, deja null las otras fases y commitea SOLO tarea.md', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    assert.deepEqual(await costes(tareasRoot), [null, null, null]);

    // Algo a medias en otro sitio del arbol: no puede entrar en el commit.
    await writeFile(path.join(repoRoot, 'otro.txt'), 'a medias\n', 'utf8');

    const a = cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '1500']);
    assert.match(a.stdout, /\+1500 tokens de diseno; total de la fase: 1500/);
    assert.deepEqual(await costes(tareasRoot), [1500, null, null]);
    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens=2500']);
    assert.deepEqual(await costes(tareasRoot), [4000, null, null], 'suma, no sobrescribe');
    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '7']);
    assert.deepEqual(await costes(tareasRoot), [4000, null, 7], 'implementacion sigue siendo null, no 0');

    const t = await readTareaFile(tareasRoot, ID);
    assert.ok(t);
    const texto = await readFile(t.filePath, 'utf8');
    assert.match(texto, /^tokens_diseno: 4000$/m);
    assert.match(texto, /^tokens_implementacion: null$/m);
    assert.match(texto, /^tokens_revision: 7$/m);

    // Un commit por llamada, con solo ese fichero y el asunto esperado.
    const log = git(['log', '-3', '--format=%s'], repoRoot).trim().split('\n');
    assert.deepEqual(log, [
      `chore(${ID}): coste revision +7 tokens`,
      `chore(${ID}): coste diseno +2500 tokens`,
      `chore(${ID}): coste diseno +1500 tokens`,
    ]);
    const ficheros = git(['show', '--name-only', '--format=', 'HEAD'], repoRoot).trim().split('\n');
    assert.deepEqual(ficheros, [path.relative(repoRoot, t.filePath).split(path.sep).join('/')]);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '?? otro.txt', 'lo ajeno queda como estaba');
  });
});

test('registrar-coste: rechaza 0, negativos, no numeros, flotantes, fase invalida o ausente, sin tocar nada', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    const antes = head(repoRoot);
    const casos: [string[], RegExp][] = [
      [[ID, '--fase', 'diseno', '--tokens', '0'], /registrar nada no tiene sentido.*no registres nada/s],
      [[ID, '--fase', 'diseno', '--tokens', '-5'], /"-5" no es un entero positivo/],
      [[ID, '--fase', 'diseno', '--tokens', 'abc'], /"abc" no es un entero positivo/],
      [[ID, '--fase', 'diseno', '--tokens', '12k'], /"12k" no es un entero positivo/],
      [[ID, '--fase', 'diseno', '--tokens', '1.5'], /"1.5" no es un entero positivo/],
      [[ID, '--fase', 'diseno'], /Falta el coste: pasa --agente/],
      [[ID, '--fase', 'diseno', '--tokens'], /--tokens falta/],
      [[ID, '--fase', 'diseno', '--tokens', '99999999999999999999'], /demasiado grande/],
      [[ID, '--fase', 'curso', '--tokens', '5'], /--fase "curso" no reconocida.*diseno, implementacion, revision/s],
      [[ID, '--tokens', '5'], /--fase ausente/],
      [[ID, '--fase', 'toString', '--tokens', '5'], /--fase "toString" no reconocida/],
      [['--fase', 'diseno', '--tokens', '5'], /Falta el ID de la tarea/],
      [[ID, 'sobra', '--fase', 'diseno', '--tokens', '5'], /Argumentos de mas: sobra/],
      [[ID, '--fase', 'diseno', '--tokens', '5', '--tokenz', '1'], /flag desconocido "--tokenz"/],
      ['TASK-777 --fase diseno --tokens 5'.split(' '), /TASK-777: no se encuentra/],
    ];
    for (const [args, esperado] of casos) {
      const r = cli(repoRoot, ['registrar-coste', ...args]);
      assert.equal(r.status, 1, `${args.join(' ')}: deberia fallar (${r.stdout})`);
      assert.match(r.stderr, esperado, args.join(' '));
    }
    assert.equal(head(repoRoot), antes, 'ningun rechazo commitea');
    assert.deepEqual(await costes(tareasRoot), [null, null, null]);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('registrar-coste: funciona con la tarea terminada, que vive en develop tras el finish', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
    const cierre = cliOk(repoRoot, ['finish', ID]);
    // Sin coste registrado, finish avisa de diseno y revision (no de implementacion) y cierra.
    assert.match(cierre.stderr, /sin coste de diseno registrado/);
    assert.match(cierre.stderr, /sin coste de revision registrado/);
    assert.doesNotMatch(cierre.stderr, /sin coste de implementacion/);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
    const t = await readTareaFile(tareasRoot, ID);
    assert.equal(t?.task.estado, 'terminada');

    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '9000']);
    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '1000']);
    assert.deepEqual(await costes(tareasRoot), [null, null, 10000]);
    assert.equal(git(['log', '-1', '--format=%s'], repoRoot).trim(), `chore(${ID}): coste revision +1000 tokens`);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
    const despues = await readTareaFile(tareasRoot, ID);
    assert.equal(despues?.task.estado, 'terminada', 'no cambia el estado');
    assert.equal(despues?.task.actualizado, t?.task.actualizado, 'ni actualizado');
  });
});

test('registrar-coste entre review y finish no cambia lo que dice siguiente (modo automatico)', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
    const antes = siguiente(repoRoot);
    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '123']);
    assert.deepEqual(siguiente(repoRoot), antes);
    cliOk(repoRoot, ['finish', ID]);
  });
});

test('registrar-coste: aborta con tarea.md a medias, y desde la rama base si la tarea vive en su rama', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    const t = await readTareaFile(tareasRoot, ID);
    assert.ok(t);
    const rama = git(['branch', '--show-current'], repoRoot).trim();
    assert.match(rama, /^feature\//);
    const antes = head(repoRoot);

    // tarea.md con cambios sin commitear: el commit se los llevaria.
    const original = await readFile(t.filePath, 'utf8');
    await writeFile(t.filePath, `${original}\nnota a medias\n`, 'utf8');
    const sucio = cli(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5']);
    assert.equal(sucio.status, 1);
    assert.match(sucio.stderr, /tarea\.md tiene cambios sin commitear/);
    assert.equal(head(repoRoot), antes);
    assert.match(await readFile(t.filePath, 'utf8'), /nota a medias/, 'no se pierde la edicion de la persona');
    await writeFile(t.filePath, original, 'utf8');

    // Desde develop, la copia de la tarea esta desfasada: la al dia vive en su rama.
    git(['checkout', '-q', 'develop'], repoRoot);
    const fuera = cli(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5']);
    assert.equal(fuera.status, 1);
    assert.ok(fuera.stderr.includes(`git checkout ${rama}`), fuera.stderr);
    git(['checkout', '-q', rama], repoRoot);
    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5']);
    assert.deepEqual(await costes(tareasRoot), [5, null, null]);
  });
});

test('new escribe los tres campos de tokens a null, y una tarea sin ellos sigue valida y suma sobre 0', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Con campos');
    const t = await readTareaFile(tareasRoot, ID);
    assert.ok(t);
    const texto = await readFile(t.filePath, 'utf8');
    for (const c of ['tokens_diseno', 'tokens_implementacion', 'tokens_revision']) {
      assert.match(texto, new RegExp(`^${c}: null$`, 'm'));
    }
    // Una tarea anterior a los campos (sin las lineas) los acepta como null.
    await writeFile(t.filePath, texto.replace(/^tokens_.*\n/gm, ''), 'utf8');
    git(['commit', '-q', '-am', 'tarea de antes de los campos'], repoRoot);
    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'implementacion', '--tokens', '33']);
    assert.deepEqual(await costes(tareasRoot), [null, 33, null]);
  });
});

test('registrar-coste es un comando guardado por la cadena: con una cadena abierta exige su testigo', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    const abrir = cliOk(repoRoot, ['cadena', 'abrir', ID]);
    const testigo = abrir.stdout.trim();
    assert.ok(testigo, abrir.stdout);
    const sin = cli(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5']);
    assert.equal(sin.status, 1, 'sin testigo no escribe');
    assert.deepEqual(await costes(tareasRoot), [null, null, null]);
    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5', '--cadena', testigo]);
    assert.deepEqual(await costes(tareasRoot), [5, null, null]);
  });
});
