/**
 * TASK-144a (CMD2-01 de la auditoria 4D): con `comando_sincronizacion`, el
 * commit de review regenera un fichero fuera de `tareas/`. Ese fichero no es
 * codigo sin revisar (finish y verificar-menores ya lo excluian), asi que
 * `siguiente` tiene que dar finish sin preguntar en modo automatico. Repo
 * Git temporal real y el CLI real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ID,
  CONFIG_AUTO,
  cliOk,
  commitAll,
  dirRevision,
  escribirVeredicto,
  git,
  hastaCodigo,
  rellenarInforme,
  resumen,
  siguiente,
  withRepo,
} from '../helpers/automatico-fixtures.js';

/** Regenera estado.txt con las carpetas de tareas: cambia en cada transicion. */
const SYNC =
  "import { readdirSync, writeFileSync, existsSync } from 'node:fs';\n" +
  "const estados = existsSync('tareas') ? readdirSync('tareas').filter((d) => /^0/.test(d)) : [];\n" +
  "const lineas = estados.map((d) => d + ': ' + readdirSync('tareas/' + d).filter((n) => n.startsWith('TASK-')).join(','));\n" +
  "writeFileSync('estado.txt', lineas.join('\\n') + '\\n');\n";

const CONFIG = `${CONFIG_AUTO}comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [estado.txt]\n`;

test('siguiente (TASK-144a): tras una ronda aprobada, el fichero que regenera la sincronizacion no hace preguntar', async () => {
  await withRepo(CONFIG, async (repoRoot, tareasRoot) => {
    await mkdir(path.join(repoRoot, 'scripts'), { recursive: true });
    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), SYNC, 'utf8');
    await writeFile(path.join(repoRoot, 'estado.txt'), '\n', 'utf8');
    commitAll(repoRoot, 'chore: sincronizacion');

    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    // El commit de review regenero estado.txt despues del Commit revisado.
    assert.match(git(['show', '--name-only', '--format=', 'HEAD'], repoRoot), /estado\.txt/);

    const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
    await rellenarInforme(repoRoot, informe);
    await escribirVeredicto(informe, 'aprobada');

    const s = siguiente(repoRoot);
    assert.deepEqual(resumen(s), ['finish', 'continuar'], JSON.stringify(s));
  });
});
