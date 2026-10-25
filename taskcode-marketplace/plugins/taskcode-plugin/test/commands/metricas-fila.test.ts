/**
 * TASK-064: la fila enriquecida de `taskctl metricas` por CLI, contra repos
 * Git temporales reales. Una tarea en formato nuevo (ciclo real, tabla
 * `## Coste` con filas de agente repetidas, una fila citada en un bloque de
 * codigo y un total menor que su desglose; hallazgos repetidos entre rondas,
 * en minusculas, de dos revisores y uno fuera de vocabulario) y otra en
 * formato antiguo (informe en prosa, sin tabla). Solo lectura salvo
 * `--escribir`, que los avisos no bloquean.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { readTareaFile } from '../../src/fs/task-store.js';
import { anadirCoste, type FilaCoste } from '../../src/core/coste-registro.js';
import {
  ID,
  CONFIG_AUTO,
  git,
  commitAll,
  cliOk,
  withRepo,
  dirRevision,
  hastaCodigo,
  nueva,
  rellenarInforme,
} from '../helpers/automatico-fixtures.js';

const ID2 = 'TASK-002';

function celdas(salida: string, id: string): string[] {
  const linea = salida.split('\n').find((l) => l.startsWith(`| ${id} `));
  assert.ok(linea, `no hay fila de ${id} en:\n${salida}`);
  return linea
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
}

/** Celdas por nombre de columna. */
function porColumna(salida: string, id: string): Record<string, string> {
  const cab = celdas(salida, 'id');
  const fila = celdas(salida, id);
  return Object.fromEntries(cab.map((c, i) => [c, fila[i] as string]));
}

function agente(fase: FilaCoste['fase'], id: string, lecturas: number): FilaCoste {
  return {
    fecha: '2026-10-25T10:00:00Z',
    fase,
    fuente: `agente:${id}`,
    entrada: 10,
    cacheEscritura: 20,
    cacheLectura: 300,
    salida: 40,
    lecturas,
    total: 370,
  };
}

const CABECERA_HALLAZGOS = '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n';

async function escenario(repoRoot: string, tareasRoot: string): Promise<void> {
  // TASK-001: ciclo real con una fila manual de diseno y el informe 1 del
  // flujo (MEN-1 MENOR aceptado, sin celda de Origen).
  await hastaCodigo(repoRoot, tareasRoot);
  cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '1000']);
  cliOk(repoRoot, ['review', ID]);
  await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
  cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
  cliOk(repoRoot, ['finish', ID]);

  const t = await readTareaFile(tareasRoot, ID);
  assert.ok(t);
  const revision = path.join(path.dirname(t.filePath), 'revision');
  // Ronda 2: MEN-1 reaparece (cuenta una vez) e IMP-1 en minusculas; el
  // revisor java-spring trae su propio MEN-1 con una severidad desconocida.
  await writeFile(
    path.join(revision, 'informe-revision-2.md'),
    `# Informe\n\n- Veredicto: aprobada\n\n## Hallazgos\n\n${CABECERA_HALLAZGOS}` +
      '| MEN-1 | Menor | corregido | app.txt | implementacion |\n| IMP-1 | importante | corregido | app.txt | Plan |\n',
    'utf8'
  );
  await writeFile(
    path.join(revision, 'informe-revision-2-java-spring-reviewer.md'),
    `# Informe\n\n- Veredicto: aprobada\n\n## Hallazgos\n\n${CABECERA_HALLAZGOS}| MEN-1 | Alta | abierto | app.txt | |\n`,
    'utf8'
  );

  // ## Coste: el agente a1 dos veces en implementacion (repetida), r1 en
  // revision con un total del frontmatter menor que su desglose, y una fila
  // valida citada en un bloque de codigo DENTRO de la seccion real.
  let texto = await readFile(t.filePath, 'utf8');
  for (const f of [agente('implementacion', 'a1', 5), agente('implementacion', 'a1', 5), agente('revision', 'r1', 3)]) {
    texto = anadirCoste(texto, f);
  }
  const ultima = '| 2026-10-25T10:00:00Z | revision | agente:r1 | 10 | 20 | 300 | 40 | 3 | 370 |';
  assert.ok(texto.includes(ultima));
  texto = texto.replace(
    ultima,
    `${ultima}\n\nFila citada:\n\n\`\`\`\n| 2026-10-25T10:00:00Z | implementacion | agente:zz | 9999 | 9999 | 9999 | 9999 | 99 | 39996 |\n\`\`\`\n`
  );
  texto = texto
    .replace(/^tokens_implementacion: .*$/m, 'tokens_implementacion: 740')
    .replace(/^tokens_revision: .*$/m, 'tokens_revision: 100');
  await writeFile(t.filePath, texto, 'utf8');
  commitAll(repoRoot, 'test: datos de metricas de TASK-001');

  // TASK-002: formato antiguo, con un informe en prosa sin tabla de hallazgos.
  nueva(repoRoot, 'fix', 'Antigua');
  const t2 = await readTareaFile(tareasRoot, ID2);
  assert.ok(t2);
  const rev2 = path.join(path.dirname(t2.filePath), 'revision');
  await mkdir(rev2, { recursive: true });
  await writeFile(path.join(rev2, 'informe-revision-1.md'), '# Informe\n\n- Veredicto: aprobada\n\nSin hallazgos que destacar.\n', 'utf8');
  await writeFile(path.join(rev2, 'peticion-revision-1.md'), 'x'.repeat(2048), 'utf8');
  commitAll(repoRoot, 'test: datos de metricas');
}

test('metricas: hallazgos una vez por revisor + ID, severidad en minusculas, informe sin tabla = sin dato, y avisos', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await escenario(repoRoot, tareasRoot);
    const r = cliOk(repoRoot, ['metricas']);

    const t1 = porColumna(r.stdout, ID);
    // ''+MEN-1 (rondas 1 y 2, una vez), ''+IMP-1 (importante), java+MEN-1 (Alta: desconocida).
    assert.deepEqual([t1.crit, t1.imp, t1.men], ['0', '1', '1']);
    // MEN-1 implementacion (ronda 2 manda), IMP-1 plan, java MEN-1 sin clasificar.
    assert.equal(t1.hall_origen, '1/1/0/1');
    assert.equal(t1.rondas, '2');

    const t2 = porColumna(r.stdout, ID2);
    assert.deepEqual([t2.crit, t2.imp, t2.men, t2.hall_origen], ['—', '—', '—', '—'], 'sin tabla no es cero');
    assert.match(r.stdout, /Informes sin tabla de hallazgos: 1 \(en 1 tareas\)/);
    assert.match(r.stdout, /cada uno cuenta una vez por tarea \(revisor \+ ID\)/);
    assert.match(r.stdout, /Lecturas por fase .*: diseno — \(n=0\), implementacion 10 \(n=1\), revision 3 \(n=1\)\./);
    assert.match(r.stdout, /Terminadas sin coste en alguna fase: 0 de 1\./);

    assert.match(
      r.stderr,
      /\[AVISO\] TASK-001 revision\/informe-revision-2-java-spring-reviewer\.md: severidad fuera de vocabulario .* MEN-1 \("Alta"\)/
    );
    assert.match(r.stderr, /\[AVISO\] 1 informe\(s\) de revision sin tabla de hallazgos en 1 tarea\(s\).*TASK-002/);
    assert.match(r.stderr, /\[AVISO\] TASK-001: en "## Coste", a1 aparece en 2 filas de implementacion/);
    assert.match(r.stderr, /\[AVISO\] TASK-001: lo desglosado .* revision \(370\) supera tokens_revision \(100\): diferencia -270/);
    assert.doesNotMatch(r.stderr, /zz/, 'la fila del bloque de codigo no se lee');
    assert.doesNotMatch(r.stdout, /NaN|undefined/);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'solo lectura');
  });
});

test('metricas --tokens: nuevos, lectura de cache y sin desglose (negativo sin recortar); los avisos no bloquean --escribir', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await escenario(repoRoot, tareasRoot);
    const r = cliOk(repoRoot, ['metricas', '--tokens']);
    const t1 = porColumna(r.stdout, ID);
    // Tres filas de agente leidas (no la del bloque de codigo): 3 x (10+20+40) y 3 x 300.
    assert.equal(t1.tok_total, '1840');
    assert.equal(t1.tok_nuevos, '210');
    assert.equal(t1.tok_cache_lect, '900');
    // diseno 1000 - 0 + implementacion 740 - 740 + revision 100 - 370.
    assert.equal(t1.tok_sin_desglose, '730');
    const t2 = porColumna(r.stdout, ID2);
    assert.deepEqual([t2.tok_nuevos, t2.tok_cache_lect, t2.tok_sin_desglose], ['—', '—', '—']);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');

    const e = cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
    assert.match(e.stderr, /\[AVISO\] TASK-001: lo desglosado/);
    assert.match(e.stdout, /Regenerado el bloque de tokens/);
    assert.match(git(['status', '--porcelain'], repoRoot).trim(), /^\?\? docs\/(METRICAS\.md)?$/);
    // El bloque de docs/METRICAS.md no cambia de forma: sin columnas de desglose.
    assert.doesNotMatch(await readFile(path.join(repoRoot, 'docs', 'METRICAS.md'), 'utf8'), /tok_nuevos/);
  });
});
