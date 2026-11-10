/**
 * TASK-092: un fichero derivado suelto en la raiz de tareas/
 * (tareas/ROADMAP.md) se regenera en cada transicion, dentro del mismo
 * commit, igual que uno de docs/. Repos Git temporales reales, los
 * scripts de Git-Flow del repo y un script de sincronizacion de verdad.
 */
// Parte de los tests de sincronizacion (ver test/helpers/sincronizacion-fixtures.ts).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { runNewCommand } from '../../src/commands/new.js';
import { runPlanCommand } from '../../src/commands/plan.js';
import { runApproveCommand } from '../../src/commands/approve.js';
import { runStartCommand } from '../../src/commands/start.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
import {
  SCRIPTS_DIR,
  git,
  commitAll,
  porcelain,
  ficherosDeHead,
  scriptSync,
  configSync,
  withRepoSincronizado,
  tocarTarea,
  reescribirScript,
} from '../helpers/sincronizacion-fixtures.js';

const ROADMAP = 'tareas/ROADMAP.md';
const SCRIPT_ROADMAP = scriptSync(ROADMAP);
const CONFIG_ROADMAP = configSync(ROADMAP);

async function roadmapEnDisco(repoRoot: string): Promise<string> {
  return (await readFile(path.join(repoRoot, 'tareas', 'ROADMAP.md'), 'utf8')).trim();
}

/** Tras cada transicion: aplicada, el ROADMAP en el commit, arbol limpio y la fila esperada. */
async function comprobarTransicion(
  repoRoot: string,
  paso: string,
  estado: string,
  filaEsperada: string
): Promise<void> {
  assert.equal(estado, 'aplicada', `${paso}: la sincronizacion no se aplico`);
  assert.ok(ficherosDeHead(repoRoot).includes(ROADMAP), `${paso}: el ROADMAP no va en el commit`);
  assert.equal(porcelain(repoRoot), '', `${paso}: el arbol quedo sucio`);
  const lineas = (await roadmapEnDisco(repoRoot)).split('\n');
  assert.ok(lineas.includes(filaEsperada), `${paso}: falta "${filaEsperada}" en:\n${lineas.join('\n')}`);
}

test('sincronizacion raiz de tareas/: new -> plan -> approve -> start -> review -> finish regeneran tareas/ROADMAP.md en el commit de cada transicion', async () => {
  await withRepoSincronizado(
    CONFIG_ROADMAP,
    async (repoRoot, tareasRoot) => {
      const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };

      const n = await runNewCommand(
        tareasRoot,
        [
          '--titulo', 'Tarea del roadmap',
          '--tipo', 'feature',
          '--objetivo', 'Que el comando de prueba devuelva 0 con la entrada de ejemplo.',
          '--criterio', 'El comando de prueba devuelve 0 con la entrada de ejemplo',
        ],
        '2026-11-10',
        { repoCwd: repoRoot }
      );
      const id = n.id;
      await comprobarTransicion(repoRoot, 'new', n.autoCommit.sincronizacion.estado, `${id} 00-planificadas`);

      const p = await runPlanCommand(tareasRoot, [id], '2026-11-10', { repoCwd: repoRoot });
      await comprobarTransicion(repoRoot, 'plan', p.autoCommit.sincronizacion.estado, `${id} 01-en-diseno`);

      // El plan lo redacta una persona: commit acotado al plan, el ROADMAP no se toca.
      await writeFile(p.planPath, '# Plan\n\nEnfoque: regenerar el roadmap.\n', 'utf8');
      git(['add', '--', p.planPath], repoRoot);
      git(['commit', '-q', '-m', `docs(${id}): plan final`, '--', p.planPath], repoRoot);

      const a = await runApproveCommand(tareasRoot, [id], '2026-11-10', deps);
      await comprobarTransicion(repoRoot, 'approve', a.autoCommit.sincronizacion.estado, `${id} 01-en-diseno aprobado`);

      const s = await runStartCommand(tareasRoot, [id], '2026-11-10', deps);
      await comprobarTransicion(repoRoot, 'start', s.autoCommit.sincronizacion.estado, `${id} 02-en-curso aprobado`);

      await writeFile(path.join(repoRoot, 'README.md'), 'repo con trabajo\n', 'utf8');
      git(['add', '--', 'README.md'], repoRoot);
      git(['commit', '-q', '-m', `feat(${id}): trabajo`, '--', 'README.md'], repoRoot);

      const v = await runReviewCommand(tareasRoot, [id], '2026-11-10', deps);
      await comprobarTransicion(repoRoot, 'review', v.autoCommit.sincronizacion.estado, `${id} 03-en-revision aprobado`);

      const informe = path.join(tareasRoot, '03-en-revision', id, 'revision', 'informe-revision-1.md');
      await writeFile(informe, '# Informe\n\n- Veredicto: aprobada\n', 'utf8');
      commitAll(repoRoot, `docs(${id}): informe de revision`);

      const f = await runFinishCommand(tareasRoot, [id], '2026-11-10', deps);
      assert.equal(f.autoCommit.rama, 'develop');
      await comprobarTransicion(repoRoot, 'finish', f.autoCommit.sincronizacion.estado, `${id} 04-terminadas aprobado`);
      // Lo commiteado en develop es lo que hay en disco.
      assert.equal(git(['show', `HEAD:${ROADMAP}`], repoRoot).trim(), await roadmapEnDisco(repoRoot));
    },
    SCRIPT_ROADMAP
  );
});

test('sincronizacion raiz de tareas/ (a): si tareas/ROADMAP.md ya tenia cambios, no se ejecuta y el cambio de la persona sigue intacto', async () => {
  await withRepoSincronizado(
    CONFIG_ROADMAP,
    async (repoRoot, tareasRoot) => {
      await writeFile(path.join(repoRoot, 'tareas', 'ROADMAP.md'), 'edicion a mano\n', 'utf8');
      const dir = await tocarTarea(tareasRoot);

      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });

      assert.equal(r.sincronizacion.estado, 'omitida-rutas-con-cambios');
      assert.equal(r.commiteado, true, 'la tarea se commitea igual');
      assert.ok(!ficherosDeHead(repoRoot).includes(ROADMAP));
      assert.equal(await roadmapEnDisco(repoRoot), 'edicion a mano', 'se piso el trabajo de la persona');
      assert.match(r.avisos.join('\n'), /No se ha ejecutado la sincronizacion: tareas\/ROADMAP\.md/);
    },
    SCRIPT_ROADMAP
  );
});

test('sincronizacion raiz de tareas/ (b): si el script falla tras escribir, tareas/ROADMAP.md vuelve a HEAD y la tarea se commitea', async () => {
  await withRepoSincronizado(
    CONFIG_ROADMAP,
    async (repoRoot, tareasRoot) => {
      const enHead = await roadmapEnDisco(repoRoot);
      await reescribirScript(
        repoRoot,
        "import { writeFileSync } from 'node:fs';\nwriteFileSync('tareas/ROADMAP.md', 'a medias\\n');\n" +
          "console.error('se rompio a mitad');\nprocess.exit(4);\n"
      );
      const dir = await tocarTarea(tareasRoot);

      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });

      assert.equal(r.sincronizacion.estado, 'fallida');
      assert.equal(r.commiteado, true);
      assert.ok(ficherosDeHead(repoRoot).includes('tareas/01-en-diseno/TASK-920/nota.md'));
      assert.ok(!ficherosDeHead(repoRoot).includes(ROADMAP));
      assert.equal(await roadmapEnDisco(repoRoot), enHead, 'el ROADMAP a medias no se restauro');
      assert.equal(porcelain(repoRoot), '');
      assert.match(r.avisos.join('\n'), /salio con codigo 4: se rompio a mitad/);
    },
    SCRIPT_ROADMAP
  );
});

test('sincronizacion raiz de tareas/ (c): un fichero no declarado en tareas/ no entra en el commit y se nombra en el aviso', async () => {
  await withRepoSincronizado(
    CONFIG_ROADMAP,
    async (repoRoot, tareasRoot) => {
      await reescribirScript(
        repoRoot,
        SCRIPT_ROADMAP + "writeFileSync('tareas/OTRO.md', 'no declarado\\n');\n"
      );
      const dir = await tocarTarea(tareasRoot);
      // Un cambio de estado de verdad, para que el ROADMAP cambie.
      const tareaMd = path.join(dir, 'tarea.md');
      await writeFile(
        tareaMd,
        (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
      );

      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });

      assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
      const enCommit = ficherosDeHead(repoRoot);
      assert.ok(enCommit.includes(ROADMAP), 'el ROADMAP declarado deberia entrar');
      assert.ok(!enCommit.includes('tareas/OTRO.md'), 'se commiteo un fichero no declarado');
      assert.match(porcelain(repoRoot), /^\?\? tareas\/OTRO\.md$/m, 'el fichero ajeno no se debe tocar');
      assert.match(r.avisos.join('\n'), /no estan en rutas_sincronizacion: tareas\/OTRO\.md/);
    },
    SCRIPT_ROADMAP
  );
});
