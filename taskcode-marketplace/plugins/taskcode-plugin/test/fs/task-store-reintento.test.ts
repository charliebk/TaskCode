/**
 * TASK-053: moveTareaFile reintenta el rename ante EPERM/EBUSY. El
 * fallo transitorio se simula envolviendo el rename real; las carpetas
 * se mueven de verdad en disco.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
import type { Task } from '../../src/core/task.js';

const TASK: Task = {
  id: 'TASK-960',
  titulo: 'Prueba de reintento',
  tipo: 'feature',
  sprint: 1,
  etiquetas: [],
  complejidad: 'simple',
  modelo_sugerido: 'sonnet',
  estado: 'en-revision',
  plan_aprobado: true,
  rama: 'feature/task-960-reintento',
  asignado_a: null,
  agente_revisor: 'general-purpose',
  skills_recomendados: [],
  regla_seleccion_skill: null,
  ultimo_commit_revisado: null,
  revision_codex: false,
  tokens_diseno: null,
  tokens_implementacion: null,
  tokens_revision: null,
  creado: '2026-10-04',
  actualizado: '2026-10-04',
  dependencias: [],
};

function errorDe(code: string): NodeJS.ErrnoException {
  const e = new Error(`${code}: simulado`) as NodeJS.ErrnoException;
  e.code = code;
  return e;
}

async function conTarea(fn: (tareas: string, origen: string) => Promise<void>): Promise<void> {
  const tareas = await mkdtemp(path.join(tmpdir(), 'taskctl-reint-'));
  try {
    const origen = await writeTareaFile(tareas, TASK, '## Objetivo\nx\n');
    await fn(tareas, origen);
  } finally {
    await rm(tareas, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

test('moveTareaFile (TASK-053): un EPERM que dura dos intentos no impide mover la tarea', async () => {
  await conTarea(async (tareas, origen) => {
    let fallos = 0;
    const renombrar = async (a: string, b: string): Promise<void> => {
      if (fallos < 2) {
        fallos++;
        throw errorDe('EPERM');
      }
      await rename(a, b);
    };
    const destino = await moveTareaFile(tareas, origen, { ...TASK, estado: 'terminada' }, 'x\n', {
      renombrar,
      esperasReintento: [1, 1, 1, 1, 1],
    });
    assert.equal(fallos, 2);
    assert.ok(existsSync(destino));
    assert.ok(!existsSync(path.dirname(origen)));
  });
});

test('moveTareaFile (TASK-053): un EBUSY que no cede se propaga tras los reintentos y la tarea sigue en su sitio', async () => {
  await conTarea(async (tareas, origen) => {
    let intentos = 0;
    const renombrar = async (): Promise<void> => {
      intentos++;
      throw errorDe('EBUSY');
    };
    await assert.rejects(
      moveTareaFile(tareas, origen, { ...TASK, estado: 'terminada' }, 'x\n', {
        renombrar,
        esperasReintento: [1, 1, 1],
      }),
      (e: unknown) => (e as NodeJS.ErrnoException).code === 'EBUSY'
    );
    assert.equal(intentos, 4, '1 intento + 3 reintentos');
    assert.ok(existsSync(origen));
  });
});

test('moveTareaFile (TASK-053, MEN-1 de su revision): un rename que movio la carpeta pero devolvio EPERM se da por bueno', async () => {
  await conTarea(async (tareas, origen) => {
    let primera = true;
    const renombrar = async (a: string, b: string): Promise<void> => {
      if (primera) {
        primera = false;
        await rename(a, b);
        throw errorDe('EPERM');
      }
      await rename(a, b);
    };
    const destino = await moveTareaFile(tareas, origen, { ...TASK, estado: 'terminada' }, 'x\n', {
      renombrar,
      esperasReintento: [1, 1, 1],
    });
    assert.ok(existsSync(destino));
  });
});

test('moveTareaFile (TASK-053): un error que no es transitorio no se reintenta', async () => {
  await conTarea(async (tareas, origen) => {
    let intentos = 0;
    const renombrar = async (): Promise<void> => {
      intentos++;
      throw errorDe('ENOTDIR');
    };
    await assert.rejects(
      moveTareaFile(tareas, origen, { ...TASK, estado: 'terminada' }, 'x\n', {
        renombrar,
        esperasReintento: [1, 1, 1],
      }),
      (e: unknown) => (e as NodeJS.ErrnoException).code === 'ENOTDIR'
    );
    assert.equal(intentos, 1);
  });
});
