/**
 * Guardian de held-out (TASK-078). El casado de rutas es puro y se prueba con
 * texto; la decision, contra repos Git temporales de verdad (rama base y rama
 * de una tarea con su carpeta `aceptacion/`), lanzando los puntos de entrada
 * del dist como proceso, con el JSON por stdin, igual que Claude Code.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { numerosHeldoutEnRuta, numerosHeldoutEnTexto } from '../../src/core/heldout.js';
import { numeroDeRama } from '../../src/core/task-id.js';
import { decidirHeldout, ramaActual } from '../../src/hooks/guardia-heldout.js';
import { git } from '../helpers/finish-fixtures.js';

const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
const ENTRADA_LECTURA = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'pre-tool-lectura.js');
const ENTRADA_SHELL = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'pre-tool-merge.js');
const RAMA = 'feature/task-901-trabajo';
const CARPETA = 'tareas/02-en-curso/TASK-901';
const HELDOUT = `${CARPETA}/aceptacion`;
const MATCHER_LECTURA = 'Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob';

// ---------------------------------------------------------------------
// Casado de rutas (puro)
// ---------------------------------------------------------------------

test('heldout-ruta: normaliza mayusculas, barras invertidas, .., relativas y absolutas de Windows y git-bash', () => {
  const raiz = path.resolve('/repo');
  const dentro = path.join(raiz, 'tareas', '02-en-curso', 'TASK-901');
  const casos: [string, string, number[]][] = [
    [`${HELDOUT}/prueba.cjs`, raiz, [901]],
    [HELDOUT, raiz, [901]],
    [`${HELDOUT}/`, raiz, [901]],
    ['TAREAS\\02-En-Curso\\task-901\\Aceptacion\\x.ts', raiz, [901]],
    ['./tareas/../tareas/02-en-curso/TASK-901/aceptacion/x', raiz, [901]],
    [`${CARPETA}/otra/../aceptacion/x`, raiz, [901]],
    ['aceptacion/x.ts', dentro, [901]],
    ['./aceptacion', dentro, [901]],
    ['C:\\Users\\yo\\repo\\tareas\\01-en-diseno\\TASK-901\\aceptacion\\x', raiz, [901]],
    ['/c/Users/yo/repo/tareas/01-en-diseno/TASK-901/aceptacion/x', raiz, [901]],
    ['tareas/*/TASK-901/aceptacion/**', raiz, [901]],
    ['tareas/03-en-revision/TASK-0901/aceptacion/x', raiz, [901]],
    // Hermanas: no casan.
    [`${CARPETA}/tarea.md`, raiz, []],
    [`${CARPETA}/aceptacionX/x`, raiz, []],
    [`${CARPETA}/aceptacion.md`, raiz, []],
    [`${CARPETA}/aceptacion/../tarea.md`, raiz, []],
    ['tarea.md', dentro, []],
    ['tareas/TASK-901/aceptacion/x', raiz, []],
    ['src/aceptacion/x', raiz, []],
    ['', raiz, []],
  ];
  for (const [ruta, base, esperado] of casos) {
    assert.deepEqual(numerosHeldoutEnRuta(ruta, base), esperado, ruta);
  }
});

test('heldout-ruta: el texto de un comando de shell, palabra a palabra', () => {
  const raiz = path.resolve('/repo');
  const casos: [string, number[]][] = [
    [`cat ${HELDOUT}/prueba.cjs`, [901]],
    [`Get-Content ${HELDOUT.replace(/\//g, '\\')}\\prueba.cjs`, [901]],
    [`git show develop:tareas/01-en-diseno/TASK-901/aceptacion/prueba.cjs`, [901]],
    [`type "${HELDOUT}\\x" | Select-String a`, [901]],
    [`ls -la '${HELDOUT}'`, [901]],
    [`cat ${HELDOUT}/a && cat tareas/02-en-curso/TASK-902/aceptacion/b`, [901, 902]],
    [`cat ${CARPETA}/tarea.md`, []],
    [`cat ${CARPETA}/aceptacionX/x`, []],
    ['grep -r aceptacion src', []],
    ['echo hola', []],
  ];
  for (const [cmd, esperado] of casos) {
    assert.deepEqual(numerosHeldoutEnTexto(cmd, raiz), esperado, cmd);
  }
});

test('heldout-rama: el numero de tarea sale del nombre de la rama', () => {
  assert.equal(numeroDeRama('feature/task-078-hook'), 78);
  assert.equal(numeroDeRama('fix/TASK-901'), 901);
  assert.equal(numeroDeRama('develop'), null);
  assert.equal(numeroDeRama('feature/mytask-901-x'), null);
});

// ---------------------------------------------------------------------
// Decision y puntos de entrada, contra repos reales
// ---------------------------------------------------------------------

async function conRepo(fn: (raiz: string) => Promise<void>): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'guardia-heldout-'));
  try {
    git(['init', '-q', '-b', 'main'], raiz);
    git(['config', 'user.email', 'test@example.com'], raiz);
    git(['config', 'user.name', 'Test'], raiz);
    await mkdir(path.join(raiz, HELDOUT), { recursive: true });
    await mkdir(path.join(raiz, CARPETA, 'aceptacionX'), { recursive: true });
    await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-902', 'aceptacion'), { recursive: true });
    await writeFile(path.join(raiz, CARPETA, 'tarea.md'), '---\nid: TASK-901\n---\n', 'utf8');
    await writeFile(path.join(raiz, HELDOUT, 'prueba.cjs'), '// held-out\n', 'utf8');
    await writeFile(path.join(raiz, CARPETA, 'aceptacionX', 'x.txt'), 'x\n', 'utf8');
    await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-902', 'aceptacion', 'p.cjs'), '// otra\n', 'utf8');
    git(['add', '-A'], raiz);
    git(['commit', '-q', '-m', 'inicial'], raiz);
    git(['branch', 'develop'], raiz);
    git(['checkout', '-q', '-b', RAMA, 'develop'], raiz);
    await fn(raiz);
  } finally {
    await rm(raiz, { recursive: true, force: true });
  }
}

function lanzar(entrada: string, cwd: string, tool_name: string, tool_input: Record<string, unknown>) {
  return spawnSync(process.execPath, [entrada], {
    input: JSON.stringify({ cwd, tool_name, tool_input, hook_event_name: 'PreToolUse' }),
    encoding: 'utf8',
  });
}

/** Entradas de cada herramienta de fichero que nombran `ruta` (absoluta o relativa). */
function entradasFichero(ruta: string): [string, Record<string, unknown>][] {
  return [
    ['Read', { file_path: ruta }],
    ['Edit', { file_path: ruta, old_string: 'a', new_string: 'b' }],
    ['Write', { file_path: ruta, content: 'x' }],
    ['MultiEdit', { file_path: ruta, edits: [] }],
    ['NotebookEdit', { notebook_path: ruta, new_source: 'x' }],
    ['Grep', { pattern: 'held', path: ruta }],
    ['Glob', { pattern: `${ruta}/**` }],
  ];
}

test('guardia-heldout (criterio 1): cada herramienta de fichero sale 2 ante la carpeta de la tarea de la rama actual y 0 ante sus hermanas', async () => {
  await conRepo(async (raiz) => {
    for (const ruta of [path.join(raiz, HELDOUT, 'prueba.cjs'), path.join(raiz, HELDOUT)]) {
      for (const [tool, input] of entradasFichero(ruta)) {
        const r = lanzar(ENTRADA_LECTURA, raiz, tool, input);
        assert.equal(r.status, 2, `${tool} ${ruta}: ${r.stderr}`);
        assert.match(r.stderr, /Bloqueado: esto nombra la carpeta aceptacion\/ de TASK-901, la tarea de la rama actual \("feature\/task-901-trabajo"\)/);
        assert.doesNotMatch(r.stderr, /taskcode/i);
      }
    }
    // Glob con path base y patron relativo; Grep con glob.
    assert.equal(lanzar(ENTRADA_LECTURA, raiz, 'Glob', { path: path.join(raiz, CARPETA), pattern: 'aceptacion/*' }).status, 2);
    assert.equal(lanzar(ENTRADA_LECTURA, raiz, 'Grep', { pattern: 'x', glob: `${HELDOUT}/*.cjs` }).status, 2);
    for (const ruta of [path.join(raiz, CARPETA, 'tarea.md'), path.join(raiz, CARPETA, 'aceptacionX', 'x.txt')]) {
      for (const [tool, input] of entradasFichero(ruta)) {
        const r = lanzar(ENTRADA_LECTURA, raiz, tool, input);
        assert.equal(r.status, 0, `${tool} ${ruta}: ${r.stderr}`);
        assert.equal(r.stderr, '');
      }
    }
    // Los held-out de OTRA tarea no son de esta rama.
    assert.equal(lanzar(ENTRADA_LECTURA, raiz, 'Read', { file_path: path.join(raiz, 'tareas/02-en-curso/TASK-902/aceptacion/p.cjs') }).status, 0);
    // El contenido que se escribe no cuenta: solo los campos de ruta.
    assert.equal(lanzar(ENTRADA_LECTURA, raiz, 'Write', { file_path: path.join(raiz, 'notas.md'), content: `ver ${HELDOUT}/x` }).status, 0);
  });
});

test('guardia-heldout (criterio 4): rutas relativas, con .., mayusculas y barras invertidas, resueltas contra el cwd', async () => {
  await conRepo(async (raiz) => {
    const dentro = path.join(raiz, CARPETA);
    for (const [cwd, ruta] of [
      [raiz, `${HELDOUT}/prueba.cjs`],
      [raiz, `./tareas/../${HELDOUT}/prueba.cjs`],
      [raiz, 'TAREAS\\02-EN-CURSO\\TASK-901\\ACEPTACION\\prueba.cjs'],
      [dentro, 'aceptacion/prueba.cjs'],
      [dentro, '.\\aceptacion\\prueba.cjs'],
      [path.join(dentro, 'aceptacionX'), '../aceptacion/prueba.cjs'],
    ] as const) {
      const r = lanzar(ENTRADA_LECTURA, cwd, 'Read', { file_path: ruta });
      assert.equal(r.status, 2, `${cwd} + ${ruta}: ${r.stderr}`);
    }
    assert.equal(lanzar(ENTRADA_LECTURA, dentro, 'Read', { file_path: 'tarea.md' }).status, 0);
    assert.equal(lanzar(ENTRADA_LECTURA, dentro, 'Read', { file_path: 'aceptacion/../tarea.md' }).status, 0);
  });
});

test('guardia-heldout (criterio 2): el guardian de Bash/PowerShell bloquea los comandos que nombran la carpeta', async () => {
  await conRepo(async (raiz) => {
    for (const [tool, command] of [
      ['Bash', `cat ${HELDOUT}/prueba.cjs`],
      ['Bash', `git show develop:${HELDOUT}/prueba.cjs`],
      ['Bash', `cd . && head -5 "${HELDOUT}/prueba.cjs"`],
      ['PowerShell', `Get-Content ${HELDOUT.replace(/\//g, '\\')}\\prueba.cjs`],
      ['PowerShell', `Get-Content -Path '${path.join(raiz, HELDOUT, 'prueba.cjs')}'`],
      // Decision 2 del plan: el remedio de finish lo ejecuta la persona; al agente se le bloquea.
      [
        'Bash',
        `git rm -r -q --ignore-unmatch ${HELDOUT} && git read-tree --prefix=${HELDOUT}/ develop:${HELDOUT} && git checkout -- ${HELDOUT}`,
      ],
    ] as const) {
      const r = lanzar(ENTRADA_SHELL, raiz, tool, { command });
      assert.equal(r.status, 2, `${command}: ${r.stderr}`);
      assert.match(r.stderr, /Bloqueado: esto nombra la carpeta aceptacion\/ de TASK-901/);
    }
    for (const command of [`cat ${CARPETA}/tarea.md`, `cat ${CARPETA}/aceptacionX/x.txt`, 'git status', 'grep -rn aceptacion src']) {
      const r = lanzar(ENTRADA_SHELL, raiz, 'Bash', { command });
      assert.equal(r.status, 0, `${command}: ${r.stderr}`);
      assert.equal(r.stderr, '');
    }
  });
});

test('guardia-heldout (criterio 3): en la rama base (diseño) no bloquea; al cambiar a la rama de la tarea, si', async () => {
  await conRepo(async (raiz) => {
    const leer = () => lanzar(ENTRADA_LECTURA, raiz, 'Read', { file_path: path.join(raiz, HELDOUT, 'prueba.cjs') }).status;
    const escribir = () => lanzar(ENTRADA_LECTURA, raiz, 'Write', { file_path: path.join(raiz, HELDOUT, 'nuevo.cjs'), content: 'x' }).status;
    const cat = () => lanzar(ENTRADA_SHELL, raiz, 'Bash', { command: `cat ${HELDOUT}/prueba.cjs` }).status;
    git(['checkout', '-q', 'develop'], raiz);
    assert.deepEqual([leer(), escribir(), cat()], [0, 0, 0], 'en develop la persona los escribe con ayuda');
    git(['checkout', '-q', RAMA], raiz);
    assert.deepEqual([leer(), escribir(), cat()], [2, 2, 2]);
    // Otra rama de tarea: los de TASK-901 no son suyos.
    git(['checkout', '-q', '-b', 'feature/task-902-otra'], raiz);
    assert.deepEqual([leer(), cat()], [0, 0]);
  });
});

test('guardia-heldout: con HEAD desacoplado en un rebase, la rama es la que se esta rebasando', async () => {
  await conRepo(async (raiz) => {
    git(['checkout', '-q', '--detach'], raiz);
    const leer = () => lanzar(ENTRADA_LECTURA, raiz, 'Read', { file_path: path.join(raiz, HELDOUT, 'prueba.cjs') }).status;
    assert.equal(leer(), 0, 'desacoplado sin rebase: no hay rama de tarea');
    const dirRebase = path.join(raiz, '.git', 'rebase-merge');
    await mkdir(dirRebase);
    await writeFile(path.join(dirRebase, 'head-name'), `refs/heads/${RAMA}\n`, 'utf8');
    assert.equal(ramaActual(raiz), RAMA);
    assert.equal(leer(), 2);
  });
});

test('guardia-heldout: un fallo propio deja pasar (sin repo, cwd inexistente, JSON roto)', async () => {
  const fuera = await mkdtemp(path.join(tmpdir(), 'guardia-heldout-fuera-'));
  try {
    await mkdir(path.join(fuera, HELDOUT), { recursive: true });
    assert.equal(lanzar(ENTRADA_LECTURA, fuera, 'Read', { file_path: path.join(fuera, HELDOUT, 'x') }).status, 0, 'sin repo');
    assert.equal(decidirHeldout({ cwd: path.join(fuera, 'no-existe'), tool_name: 'Read', tool_input: { file_path: `${HELDOUT}/x` } }).codigo, 0);
    assert.equal(decidirHeldout({ tool_name: 'Read', tool_input: 'basura' }).codigo, 0);
    for (const entrada of [ENTRADA_LECTURA, ENTRADA_SHELL]) {
      const r = spawnSync(process.execPath, [entrada], { input: 'basura aceptacion', encoding: 'utf8' });
      assert.equal(r.status, 0);
      assert.equal(r.stderr, '');
    }
  } finally {
    await rm(fuera, { recursive: true, force: true });
  }
});

test('guardia-heldout: hooks.json declara el matcher de fichero exacto y ningun matcher incluye Agent ni Task', () => {
  const j = JSON.parse(readFileSync(path.join(RAIZ_PLUGIN, 'hooks', 'hooks.json'), 'utf8')) as {
    description: string;
    hooks: { PreToolUse: { matcher: string; hooks: { command: string; args: string[]; timeout: number; if?: string }[] }[] };
  };
  const lectura = j.hooks.PreToolUse.filter((p) => p.hooks.some((h) => h.args.some((a) => a.endsWith('/pre-tool-lectura.js'))));
  assert.equal(lectura.length, 1);
  const pre = lectura[0];
  assert.ok(pre);
  assert.equal(pre.matcher, MATCHER_LECTURA);
  assert.deepEqual(pre.hooks.map((h) => [h.command, h.args, h.if]), [
    ['node', ['${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/pre-tool-lectura.js'], undefined],
  ]);
  for (const p of j.hooks.PreToolUse) {
    const herramientas = p.matcher.split('|');
    assert.ok(!herramientas.includes('Agent') && !herramientas.includes('Task'), p.matcher);
  }
  assert.match(j.description, /aceptacion\//);
  assert.doesNotMatch(j.description, /taskcode|TASK-\d/i);
});
