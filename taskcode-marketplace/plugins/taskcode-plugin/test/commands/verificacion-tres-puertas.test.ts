/**
 * TASK-107: verificacion proporcional, parte B4 de TASK-096. El freno Stop,
 * `taskctl review` y `taskctl finish` aplican la misma decision al mismo diff.
 * Repos Git temporales de verdad y los scripts de Git-Flow tal cual.
 *
 * Una tabla: filas = el diff (documentacion, codigo parcial, codigo
 * transversal), columnas = el actor (Stop, review, finish), celdas = cuantas
 * veces corre cada comando. Se comprueban valores absolutos, no solo que los
 * actores coincidan: Stop y review comparten `peticionDeTrabajo`, y una
 * mutacion ahi los moveria a la vez sin romper una igualdad.
 *
 * Un repo nuevo por cada par (fila, actor): el memo de verificacion es
 * compartido (review reutiliza el verde del Stop; finish, el de la selectiva),
 * y en un repo comun los contadores no dirian que eligio cada actor.
 *
 * Divergencia acordada (plan de TASK-096): ante lo transversal, Stop y review
 * son puertas de iteracion y corren la selectiva; finish corre la completa.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { decidirStop } from '../../src/hooks/freno-stop.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import {
  SCRIPTS_DIR as SCRIPTS_REVIEW,
  sampleTask as tareaReview,
  commitAll as commitReview,
  withTempRepo as repoReview,
  setupTaskEnCursoSoloTarea,
} from '../helpers/review-fixtures.js';
import {
  SCRIPTS_DIR as SCRIPTS_FINISH,
  sampleTask as tareaFinish,
  commitAll as commitFinish,
  withTempRepo as repoFinish,
  setupTaskEnRevision,
} from '../helpers/finish-fixtures.js';

type Comando = 'completa' | 'sel' | 'docs';
type Fila = 'documentacion' | 'parcial' | 'transversal';
type Actor = 'stop' | 'review' | 'finish';
type Cuentas = Record<Comando, number>;

// Cada comando con su contador; la selectiva apunta el RAMA_BASE que recibe.
const SCRIPT = `
const fs = require('node:fs');
const tipo = process.argv[2];
fs.appendFileSync(__dirname + '/cuenta-' + tipo, 'x');
if (tipo === 'sel') fs.writeFileSync(__dirname + '/rama-base', process.env.RAMA_BASE === undefined ? '(sin)' : process.env.RAMA_BASE);
console.log(tipo + ' en verde');
`;

/**
 * Nivel 2 completo, igual para todas las filas. `trabajo-*.txt` es lo que deja
 * `setupTaskEnRevision`: sin declararlo documentacion, finish nunca veria un
 * diff de solo documentacion.
 */
const config = (cmd: (c: Comando) => string): string =>
  `comando_verificacion: "${cmd('completa')}"\n` +
  `comando_verificacion_selectiva: "${cmd('sel')}"\n` +
  `comando_verificacion_documentacion: "${cmd('docs')}"\n` +
  'rutas_documentacion: [docs/**, trabajo-*.txt]\n' +
  'rutas_verificacion_parcial: [src/**]\n';

/** Los mismos ficheros (fuera de `tareas/`) en cualquier fixture: el diff clasificado es identico. */
const FICHEROS: Record<Fila, string> = {
  documentacion: 'docs/x.md',
  parcial: 'src/a.ts',
  transversal: 'lib/b.ts',
};

/** Lo que tiene que correr cada actor ante cada diff. */
const TABLA: Record<Fila, Record<Actor, Cuentas>> = {
  // Un turno o una ronda que solo tocan documentacion no corren la suite.
  documentacion: {
    stop: { completa: 0, sel: 0, docs: 1 },
    review: { completa: 0, sel: 0, docs: 1 },
    finish: { completa: 0, sel: 0, docs: 1 },
  },
  parcial: {
    stop: { completa: 0, sel: 1, docs: 0 },
    review: { completa: 0, sel: 1, docs: 0 },
    finish: { completa: 0, sel: 1, docs: 0 },
  },
  // La divergencia acordada: Stop y review iteran; finish integra.
  transversal: {
    stop: { completa: 0, sel: 1, docs: 0 },
    review: { completa: 0, sel: 1, docs: 0 },
    finish: { completa: 1, sel: 0, docs: 0 },
  },
};

interface Medida {
  cuentas: Cuentas;
  ramaBase: string | null;
}

async function aplicarCaso(fila: Fila, repoRoot: string, commit: (r: string, m: string) => void): Promise<void> {
  const rel = FICHEROS[fila];
  await mkdir(path.dirname(path.join(repoRoot, rel)), { recursive: true });
  await writeFile(path.join(repoRoot, rel), fila === 'documentacion' ? '# x\n' : 'export const x = 1;\n', 'utf8');
  commit(repoRoot, `caso ${fila}: ${rel}`);
}

/** Monta un repo nuevo, deja la tarea en el estado que exige `actor`, aplica la fila y lo ejecuta. */
async function medir(fila: Fila, actor: Actor): Promise<Medida> {
  const fuera = await mkdtemp(path.join(tmpdir(), 'tres-puertas-'));
  await writeFile(path.join(fuera, 'verif.cjs'), SCRIPT, 'utf8');
  const cmd = (c: Comando) => `node ${path.join(fuera, 'verif.cjs').split(path.sep).join('/')} ${c}`;
  const leer = (f: string): string | null =>
    existsSync(path.join(fuera, f)) ? readFileSync(path.join(fuera, f), 'utf8') : null;
  const conRepo = actor === 'finish' ? repoFinish : repoReview;
  const commit = actor === 'finish' ? commitFinish : commitReview;
  try {
    await conRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config(cmd), 'utf8');
      commit(repoRoot, 'config de nivel 2');
      if (actor === 'finish') {
        await setupTaskEnRevision(repoRoot, tareasRoot, tareaFinish({ id: 'TASK-970' }));
      } else {
        await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, tareaReview());
      }
      await aplicarCaso(fila, repoRoot, commit);
      if (actor === 'stop') {
        const d = await decidirStop(
          { hook_event_name: 'Stop', stop_hook_active: false, cwd: repoRoot },
          { env: process.env }
        );
        assert.equal(d.codigo, 0, `${fila}/stop: ${d.stderr}`);
      } else if (actor === 'review') {
        await runReviewCommand(tareasRoot, ['TASK-600'], '2026-11-11', { repoCwd: repoRoot, scriptsDir: SCRIPTS_REVIEW });
      } else {
        await runFinishCommand(tareasRoot, ['TASK-970'], '2026-11-11', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_FINISH,
          onAviso: () => undefined,
        });
      }
    });
    return {
      cuentas: {
        completa: (leer('cuenta-completa') ?? '').length,
        sel: (leer('cuenta-sel') ?? '').length,
        docs: (leer('cuenta-docs') ?? '').length,
      },
      ramaBase: leer('rama-base'),
    };
  } finally {
    await rm(fuera, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

for (const fila of Object.keys(TABLA) as Fila[]) {
  test(`Stop, review y finish (TASK-107): diff de ${fila} — cada actor corre lo que dice la tabla`, async () => {
    const medidas = {} as Record<Actor, Medida>;
    for (const actor of ['stop', 'review', 'finish'] as const) medidas[actor] = await medir(fila, actor);
    for (const actor of ['stop', 'review', 'finish'] as const) {
      assert.deepEqual(medidas[actor].cuentas, TABLA[fila][actor], `${fila}/${actor}`);
      // Quien corre la selectiva la corre respecto a la misma base.
      if (medidas[actor].cuentas.sel > 0) assert.equal(medidas[actor].ramaBase, 'develop', `${fila}/${actor}: RAMA_BASE`);
    }
    // Stop y review (las dos puertas de iteracion) deciden siempre igual.
    assert.deepEqual(medidas.stop.cuentas, medidas.review.cuentas, `${fila}: Stop y review`);
    // finish coincide con ellas salvo ante lo transversal (divergencia acordada).
    if (fila !== 'transversal') assert.deepEqual(medidas.finish.cuentas, medidas.review.cuentas, `${fila}: finish y review`);
    else assert.notDeepEqual(medidas.finish.cuentas, medidas.review.cuentas, 'transversal: finish corre la completa');
  });
}
