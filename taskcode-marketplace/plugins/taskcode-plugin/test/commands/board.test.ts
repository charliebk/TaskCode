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

test('parseBoardArgs: sin flags, sin filtros', () => {
  assert.deepEqual(parseBoardArgs([]), {});
});

test('parseBoardArgs: --sprint valido', () => {
  assert.deepEqual(parseBoardArgs(['--sprint', '2']), { sprint: 2 });
});

test('parseBoardArgs: --sprint invalido falla', () => {
  assert.throws(() => parseBoardArgs(['--sprint', 'dos']), BoardCommandError);
});

test('parseBoardArgs: --asignado_a valido', () => {
  assert.deepEqual(parseBoardArgs(['--asignado_a', 'charlie.bk']), { asignadoA: 'charlie.bk' });
});

test('parseBoardArgs: --asignado_a vacio falla', () => {
  assert.throws(() => parseBoardArgs(['--asignado_a', '']), BoardCommandError);
});

test('parseBoardArgs: --sprint y --asignado_a combinados', () => {
  assert.deepEqual(parseBoardArgs(['--sprint', '1', '--asignado_a', 'charlie.bk']), {
    sprint: 1,
    asignadoA: 'charlie.bk',
  });
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

test('runBoardCommand: tareasRoot vacio -> board vacio, sin advertencias', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const result = await runBoardCommand(tareasRoot, []);
    assert.equal(result.totalTareas, 0);
    assert.equal(result.output, '');
    assert.deepEqual(result.advertencias, []);
  });
});

test('runBoardCommand: lista tareas de varios estados, agrupadas', async () => {
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
  });
});

test('runBoardCommand: --sprint y --asignado_a filtran de punta a punta', async () => {
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

test('runBoardCommand: --sprint invalido falla sin leer nada de disco', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const t = buildNewTask('TASK-001', {
      titulo: 'x', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    await writeTareaFile(tareasRoot, t, DEFAULT_BODY);
    await assert.rejects(() => runBoardCommand(tareasRoot, ['--sprint', 'x']), BoardCommandError);
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

test('runBoardCommand: por defecto NO escribe nada (board sigue siendo de solo lectura)', async () => {
  await withRepoRoot(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, tareaEjemplo('TASK-001', 'Una tarea'), DEFAULT_BODY);
    const result = await runBoardCommand(tareasRoot, [], { repoCwd: repoRoot, today: '2026-09-06' });
    assert.equal(result.boardPath, null);
    await assert.rejects(() => readFile(path.join(repoRoot, 'docs', 'BOARD.md'), 'utf8'));
  });
});

test('runBoardCommand --escribir: regenera docs/BOARD.md con las tablas dentro de vallas de codigo', async () => {
  await withRepoRoot(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, tareaEjemplo('TASK-001', 'Una tarea'), DEFAULT_BODY);
    await writeTareaFile(tareasRoot, tareaEjemplo('TASK-002', 'Otra tarea'), DEFAULT_BODY);

    const result = await runBoardCommand(tareasRoot, ['--escribir'], {
      repoCwd: repoRoot,
      today: '2026-09-06',
    });

    assert.equal(result.boardPath, path.join(repoRoot, 'docs', 'BOARD.md'));
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
  });
});

test('runBoardCommand --escribir: crea docs/ si no existe y es idempotente al repetirlo', async () => {
  await withRepoRoot(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, tareaEjemplo('TASK-001', 'Una tarea'), DEFAULT_BODY);
    const primera = await runBoardCommand(tareasRoot, ['--escribir'], {
      repoCwd: repoRoot,
      today: '2026-09-06',
    });
    const contenido1 = await readFile(primera.boardPath as string, 'utf8');
    const segunda = await runBoardCommand(tareasRoot, ['--escribir'], {
      repoCwd: repoRoot,
      today: '2026-09-06',
    });
    const contenido2 = await readFile(segunda.boardPath as string, 'utf8');
    assert.equal(contenido1, contenido2);
  });
});

test('runBoardCommand --escribir: rechaza combinarse con filtros (docs/BOARD.md es el tablero completo)', async () => {
  await withRepoRoot(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, tareaEjemplo('TASK-001', 'Una tarea'), DEFAULT_BODY);
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
    await assert.rejects(() => readFile(path.join(repoRoot, 'docs', 'BOARD.md'), 'utf8'));
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

test('runBoardCommand --escribir: un fallo de escritura da un error propio, no el generico de arranque (hallazgo MENOR de revision)', async () => {
  await withRepoRoot(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, tareaEjemplo('TASK-001', 'Una tarea'), DEFAULT_BODY);
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
  });
});

test('runBoardCommand --escribir: un titulo con vallas de backticks no rompe el bloque de codigo', async () => {
  await withRepoRoot(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      tareaEjemplo('TASK-001', '```text intento de romper la valla'),
      DEFAULT_BODY
    );
    const r = await runBoardCommand(tareasRoot, ['--escribir'], {
      repoCwd: repoRoot,
      today: '2026-09-06',
    });
    const board = await readFile(r.boardPath as string, 'utf8');
    // Las lineas de la tabla empiezan por la columna ID, asi que los
    // backticks del titulo nunca quedan al principio de linea y no
    // pueden cerrar la valla: aperturas y cierres siguen equilibrados.
    const vallas = board.split('\n').filter((l) => l.trimEnd() === '```' || l.startsWith('```text'));
    assert.equal(vallas.length % 2, 0);
    assert.match(board, /intento de romper la valla/);
  });
});

test('runBoardCommand --escribir: con valor explicito falla con mensaje claro', async () => {
  await withRepoRoot(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () =>
        runBoardCommand(tareasRoot, ['--escribir', 'si'], {
          repoCwd: repoRoot,
          today: '2026-09-06',
        }),
      BoardCommandError
    );
  });
});

test('runBoardCommand: sanity check via readTareaFile — moveTareaFile realmente cambio el estado en disco', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const t = buildNewTask('TASK-001', {
      titulo: 'x', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const p = await writeTareaFile(tareasRoot, t, DEFAULT_BODY);
    await moveTareaFile(tareasRoot, p, { ...t, estado: 'en-curso' }, DEFAULT_BODY);
    const read = await readTareaFile(tareasRoot, 'TASK-001');
    assert.equal(read?.task.estado, 'en-curso');
  });
});
