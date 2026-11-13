import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseBoardArgs, runBoardCommand, BoardCommandError } from '../../src/commands/board.js';
import { buildNewTask } from '../../src/commands/new.js';
import { writeTareaFile, moveTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { DEFAULT_BODY } from '../../src/commands/new.js';

test('parseBoardArgs: sin flags, --sprint, --asignado_a y --asignado-a (con sus errores y recortes)', () => {
  // sin flags, sin filtros
  assert.deepEqual(parseBoardArgs([]), {});
  // --sprint valido
  assert.deepEqual(parseBoardArgs(['--sprint', '2']), { sprint: 2 });
  // --sprint invalido falla
  assert.throws(() => parseBoardArgs(['--sprint', 'dos']), BoardCommandError);
  // --asignado_a valido
  assert.deepEqual(parseBoardArgs(['--asignado_a', 'charlie.bk']), { asignadoA: 'charlie.bk' });
  // --asignado_a vacio falla
  assert.throws(() => parseBoardArgs(['--asignado_a', '']), BoardCommandError);
  // --sprint y --asignado_a combinados
  assert.deepEqual(parseBoardArgs(['--sprint', '1', '--asignado_a', 'charlie.bk']), {
    sprint: 1,
    asignadoA: 'charlie.bk',
  });

  // item B6: board acepta tambien --asignado-a (hallazgo IMPORTANTE de revision)
  // --asignado-a (guion medio) filtra igual que --asignado_a.
  // Sin esto, board devolvia EL TABLERO ENTERO con codigo 0 a quien
  // acababa de asignar con 'plan --asignado-a carlos' y reutilizaba
  // esa grafia: parseArgs ignora los flags que no conoce.
  assert.deepEqual(parseBoardArgs(['--asignado-a', 'charlie.bk']), { asignadoA: 'charlie.bk' });
  assert.deepEqual(parseBoardArgs(['--asignado-a=charlie.bk']), { asignadoA: 'charlie.bk' });
  // pasar las dos grafias a la vez es un error
  assert.throws(
    () => parseBoardArgs(['--asignado-a', 'ana', '--asignado_a', 'carlos']),
    BoardCommandError
  );
  // --asignado-a suelto (sin valor) falla, no filtra por true
  assert.throws(() => parseBoardArgs(['--asignado-a']), BoardCommandError);
  // el filtro se recorta, igual que lo hace plan al escribirlo.
  // Asimetria detectada en la revision: plan guardaba 'pepe' y board
  // buscaba '  pepe  ', asi que el filtro no encontraba nada.
  assert.deepEqual(parseBoardArgs(['--asignado_a=  charlie.bk  ']), { asignadoA: 'charlie.bk' });
});

// --- integracion con disco (board es de solo lectura: no necesita Git) --

async function withTareasRoot(fn: (tareasRoot: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), 'taskctl-board-'));
  try {
    await fn(path.join(root, 'tareas'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('runBoardCommand: tareasRoot vacio -> board vacio, sin advertencias; --sprint invalido falla sin leer nada de disco', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const result = await runBoardCommand(tareasRoot, []);
    assert.equal(result.totalTareas, 0);
    assert.equal(result.output, '');
    assert.deepEqual(result.advertencias, []);

    const t = buildNewTask('TASK-001', {
      titulo: 'x', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    await writeTareaFile(tareasRoot, t, DEFAULT_BODY);
    await assert.rejects(() => runBoardCommand(tareasRoot, ['--sprint', 'x']), BoardCommandError);
  });
});

test('runBoardCommand: lista tareas de varios estados, agrupadas; moveTareaFile realmente cambio el estado en disco', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const t1 = buildNewTask('TASK-001', {
      titulo: 'Primera', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    await writeTareaFile(tareasRoot, t1, DEFAULT_BODY);

    const t2raw = buildNewTask('TASK-002', {
      titulo: 'Segunda', tipo: 'fix', sprint: 1, etiquetas: [],
      complejidad: 'simple', modeloSugerido: 'haiku', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const t2path = await writeTareaFile(tareasRoot, t2raw, DEFAULT_BODY);
    const t2 = { ...t2raw, estado: 'en-curso' as const, asignado_a: 'charlie.bk' };
    await moveTareaFile(tareasRoot, t2path, t2, DEFAULT_BODY);

    const result = await runBoardCommand(tareasRoot, []);
    assert.equal(result.totalTareas, 2);
    assert.match(result.output, /Planificadas/);
    assert.match(result.output, /En curso/);
    assert.match(result.output, /TASK-001/);
    assert.match(result.output, /TASK-002/);

    // sanity check via readTareaFile: moveTareaFile realmente cambio el estado en disco
    const read = await readTareaFile(tareasRoot, 'TASK-002');
    assert.equal(read?.task.estado, 'en-curso');
  });
});

test('runBoardCommand: --asignado-a y --sprint con --asignado_a filtran de punta a punta contra disco', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const a = buildNewTask('TASK-001', {
      titulo: 'De charlie, sprint 1', tipo: 'feature', sprint: 1, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const aPath = await writeTareaFile(tareasRoot, a, DEFAULT_BODY);
    await moveTareaFile(tareasRoot, aPath, { ...a, asignado_a: 'charlie.bk' }, DEFAULT_BODY);

    const b = buildNewTask('TASK-002', {
      titulo: 'De otra persona, sprint 1', tipo: 'feature', sprint: 1, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const bPath = await writeTareaFile(tareasRoot, b, DEFAULT_BODY);
    await moveTareaFile(tareasRoot, bPath, { ...b, asignado_a: 'otra.persona' }, DEFAULT_BODY);

    // --asignado-a filtra de punta a punta contra disco
    const conGuion = await runBoardCommand(tareasRoot, ['--asignado-a', 'charlie.bk']);
    const conGuionBajo = await runBoardCommand(tareasRoot, ['--asignado_a', 'charlie.bk']);

    assert.equal(conGuion.totalTareas, 1);
    assert.ok(conGuion.output.includes('TASK-001'), conGuion.output);
    assert.ok(!conGuion.output.includes('TASK-002'), conGuion.output);
    // Las dos grafias producen exactamente el mismo tablero.
    assert.equal(conGuion.output, conGuionBajo.output);

    // --sprint y --asignado_a filtran de punta a punta (se anade una tercera tarea, de otro sprint)
    const c = buildNewTask('TASK-003', {
      titulo: 'De charlie, sprint 2', tipo: 'feature', sprint: 2, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const cPath = await writeTareaFile(tareasRoot, c, DEFAULT_BODY);
    await moveTareaFile(tareasRoot, cPath, { ...c, asignado_a: 'charlie.bk' }, DEFAULT_BODY);

    const result = await runBoardCommand(tareasRoot, ['--sprint', '1', '--asignado_a', 'charlie.bk']);
    assert.equal(result.totalTareas, 1);
    assert.match(result.output, /TASK-001/);
    assert.doesNotMatch(result.output, /TASK-002/);
    assert.doesNotMatch(result.output, /TASK-003/);
  });
});

test('runBoardCommand: una tarea existente con tarea.md corrupto se reporta como advertencia y no bloquea el board (mismo tratamiento que TASK-004)', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const buena = buildNewTask('TASK-001', {
      titulo: 'Tarea intacta', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    await writeTareaFile(tareasRoot, buena, DEFAULT_BODY);

    const rota = buildNewTask('TASK-002', {
      titulo: 'Tarea a corromper', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const rotaPath = await writeTareaFile(tareasRoot, rota, DEFAULT_BODY);
    const original = await readFile(rotaPath, 'utf8');
    await writeFile(rotaPath, original.replace('complejidad: media', 'complejidad media'), 'utf8');

    const result = await runBoardCommand(tareasRoot, []);
    assert.equal(result.totalTareas, 1);
    assert.match(result.output, /TASK-001/);
    assert.doesNotMatch(result.output, /TASK-002/);
    assert.equal(result.advertencias.length, 1);
    assert.match(result.advertencias[0]!, /TASK-002/);
  });
});

test('runBoardCommand: el mismo ID en dos carpetas de estado a la vez no se duplica en la salida, y se reporta como advertencia (hallazgo IMPORTANTE de revision por pares)', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const vieja = buildNewTask('TASK-200', {
      titulo: 'Version en planificadas (vieja)', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    await writeTareaFile(tareasRoot, vieja, DEFAULT_BODY);

    // Inconsistencia de datos a proposito: la MISMA carpeta TASK-200
    // tambien "existe" en 01-en-diseno (p. ej. un merge de Git-Flow
    // que dejo la carpeta vieja sin borrar). writeTareaFile no lo
    // permite por accidente (mkdir + wx), asi que se crea a mano.
    const nuevaDir = path.join(tareasRoot, '01-en-diseno', 'TASK-200');
    await mkdir(nuevaDir, { recursive: true });
    const nueva = { ...vieja, estado: 'en-diseno' as const, titulo: 'Version en-diseno (nueva, real)' };
    const { serializeTareaFile } = await import('../../src/core/tarea-file.js');
    await writeFile(path.join(nuevaDir, 'tarea.md'), serializeTareaFile(nueva, DEFAULT_BODY), 'utf8');

    const result = await runBoardCommand(tareasRoot, []);

    // Ni una fila duplicada ni dos filas: exactamente una.
    const apariciones = (result.output.match(/TASK-200/g) ?? []).length;
    assert.equal(apariciones, 1, `deberia aparecer una sola vez:\n${result.output}`);
    assert.equal(result.totalTareas, 1);
    assert.equal(result.advertencias.length, 1);
    assert.match(result.advertencias[0]!, /TASK-200/);
    assert.match(result.advertencias[0]!, /2 carpetas/);
  });
});

// --- B5: --escribir regenera docs/BOARD.md (divergencia de la seccion 8) ---

async function withRepoRoot(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), 'taskctl-board-escribir-'));
  try {
    await fn(root, path.join(root, 'tareas'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function tareaEjemplo(id: string, titulo: string) {
  return buildNewTask(
    id,
    {
      titulo,
      tipo: 'feature',
      sprint: 1,
      etiquetas: [],
      complejidad: 'media',
      modeloSugerido: 'sonnet',
      agenteRevisor: 'general-purpose',
    },
    '2026-09-01'
  );
}

test('runBoardCommand --escribir: no escribe por defecto, rechaza filtros y valor explicito, da error propio ante un fallo de escritura, regenera docs/BOARD.md (idempotente) y no rompe la valla con titulos de backticks', async () => {
  await withRepoRoot(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, tareaEjemplo('TASK-001', 'Una tarea'), DEFAULT_BODY);
    await writeTareaFile(tareasRoot, tareaEjemplo('TASK-002', 'Otra tarea'), DEFAULT_BODY);
    const rutaBoard = path.join(repoRoot, 'docs', 'BOARD.md');

    // Por defecto NO escribe nada (board sigue siendo de solo lectura)
    const sinEscribir = await runBoardCommand(tareasRoot, [], { repoCwd: repoRoot, today: '2026-09-06' });
    assert.equal(sinEscribir.boardPath, null);
    await assert.rejects(() => readFile(rutaBoard, 'utf8'));

    // Rechaza combinarse con filtros (docs/BOARD.md es el tablero completo)
    for (const filtro of [['--sprint', '1'], ['--asignado_a', 'charlie.bk']]) {
      await assert.rejects(
        () =>
          runBoardCommand(tareasRoot, ['--escribir', ...filtro], {
            repoCwd: repoRoot,
            today: '2026-09-06',
          }),
        BoardCommandError
      );
    }
    // Y no dejo el fichero a medias.
    await assert.rejects(() => readFile(rutaBoard, 'utf8'));

    // Con valor explicito falla con mensaje claro
    await assert.rejects(
      () =>
        runBoardCommand(tareasRoot, ['--escribir', 'si'], {
          repoCwd: repoRoot,
          today: '2026-09-06',
        }),
      BoardCommandError
    );

    // Un fallo de escritura da un error propio, no el generico de arranque (hallazgo MENOR de revision).
    // "docs" existe como FICHERO: el mkdir de docs/ falla con EEXIST.
    await writeFile(path.join(repoRoot, 'docs'), 'no soy una carpeta\n', 'utf8');
    await assert.rejects(
      () =>
        runBoardCommand(tareasRoot, ['--escribir'], { repoCwd: repoRoot, today: '2026-09-06' }),
      (e: unknown) => {
        assert.ok(e instanceof BoardCommandError);
        assert.match((e as Error).message, /No se pudo escribir/);
        return true;
      }
    );
    await rm(path.join(repoRoot, 'docs'), { force: true });

    // Regenera docs/BOARD.md con las tablas dentro de vallas de codigo (crea docs/ si no existe)
    const result = await runBoardCommand(tareasRoot, ['--escribir'], {
      repoCwd: repoRoot,
      today: '2026-09-06',
    });

    assert.equal(result.boardPath, rutaBoard);
    const board = await readFile(result.boardPath as string, 'utf8');
    assert.match(board, /# Tablero de tareas/);
    assert.match(board, /Generado automaticamente por taskctl board --escribir el 2026-09-06/);
    assert.match(board, /## Planificadas/);
    assert.match(board, /TASK-001/);
    assert.match(board, /TASK-002/);
    // La tabla va dentro de una valla: sin ella, un visor Markdown
    // junta sus lineas en un parrafo y rompe la alineacion.
    assert.match(board, /```text\n/);
    // Vallas equilibradas (misma cantidad de aperturas que cierres).
    const vallas = board.split('\n').filter((l) => l.startsWith('```')).length;
    assert.equal(vallas % 2, 0);

    // Es idempotente al repetirlo
    const segunda = await runBoardCommand(tareasRoot, ['--escribir'], {
      repoCwd: repoRoot,
      today: '2026-09-06',
    });
    const contenido2 = await readFile(segunda.boardPath as string, 'utf8');
    assert.equal(board, contenido2);

    // Un titulo con vallas de backticks no rompe el bloque de codigo
    await writeTareaFile(
      tareasRoot,
      tareaEjemplo('TASK-003', '```text intento de romper la valla'),
      DEFAULT_BODY
    );
    const r = await runBoardCommand(tareasRoot, ['--escribir'], {
      repoCwd: repoRoot,
      today: '2026-09-06',
    });
    const board3 = await readFile(r.boardPath as string, 'utf8');
    // Las lineas de la tabla empiezan por la columna ID, asi que los
    // backticks del titulo nunca quedan al principio de linea y no
    // pueden cerrar la valla: aperturas y cierres siguen equilibrados.
    const vallas3 = board3.split('\n').filter((l) => l.trimEnd() === '```' || l.startsWith('```text'));
    assert.equal(vallas3.length % 2, 0);
    assert.match(board3, /intento de romper la valla/);
  });
});

test('runBoardCommand --escribir: el fichero es reproducible aunque haya varios avisos (hallazgo IMPORTANTE de revision: orden no determinista)', async () => {
  await withRepoRoot(async (repoRoot, tareasRoot) => {
    // Varias tarea.md invalidas: cada una produce un aviso, y antes su
    // orden dependia de cuando terminaba su lectura de disco.
    const dir = path.join(tareasRoot, '00-planificadas');
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const id = `TASK-${String(n).padStart(3, '0')}`;
      await mkdir(path.join(dir, id), { recursive: true });
      await writeFile(path.join(dir, id, 'tarea.md'), 'frontmatter roto\n', 'utf8');
    }

    const contenidos: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await runBoardCommand(tareasRoot, ['--escribir'], {
        repoCwd: repoRoot,
        today: '2026-09-06',
      });
      assert.equal(r.advertencias.length, 8);
      contenidos.push(await readFile(r.boardPath as string, 'utf8'));
    }
    for (const c of contenidos) {
      assert.equal(c, contenidos[0], 'la misma entrada debe producir el mismo fichero');
    }
  });
});

test('runBoardCommand --escribir: aborta si no hay carpeta tareas/ en vez de crear un tablero fantasma (hallazgo IMPORTANTE de revision)', async () => {
  await withRepoRoot(async (repoRoot) => {
    // repoRoot existe pero no tiene tareas/: es el caso de invocar el
    // comando desde una subcarpeta o fuera de un repo de TaskCode.
    await assert.rejects(
      () =>
        runBoardCommand(path.join(repoRoot, 'tareas'), ['--escribir'], {
          repoCwd: repoRoot,
          today: '2026-09-06',
        }),
      (e: unknown) => {
        assert.ok(e instanceof BoardCommandError);
        assert.match((e as Error).message, /raiz del repo/);
        return true;
      }
    );
    await assert.rejects(() => readFile(path.join(repoRoot, 'docs', 'BOARD.md'), 'utf8'));
  });
});
