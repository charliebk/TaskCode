/**
 * TASK-081: modelo barato en la ronda de verificacion. La ronda 2 sugiere un
 * escalon menos SOLO si la ronda 1 cumple la regla estricta. Repos Git
 * temporales reales: `review` (r1) -> informes -> `veredicto` -> correccion ->
 * `review` (r2); lo que se asevera es el valor concreto de la peticion.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runReviewCommand } from '../../src/commands/review.js';
import { runVeredictoCommand } from '../../src/commands/veredicto.js';
import { ESCALERA_MODELOS, modeloDeVerificacion } from '../../src/core/modelo-revision.js';
import {
  SCRIPTS_DIR,
  sampleTask,
  commitAll,
  withTempRepo,
  setupTaskEnCursoSoloTarea,
  advanceDevelop,
  escribirFichero,
} from '../helpers/review-fixtures.js';

const JAVA = 'src/main/java/com/acme/UserService.java';
const ANGULAR = 'src/app/user-profile/user-profile.component.ts';
const [OPUS, SONNET, HAIKU] = ESCALERA_MODELOS as [string, string, string];

/** Un informe con la tabla de hallazgos que se le pase (filas ya formadas). */
function informe(filas: string[]): string {
  return (
    '# Informe de revision — TASK-970 (ronda 1)\n\n- Commit revisado: x\n- Revisor: r\n' +
    '- Veredicto: PENDIENTE\n\n## Hallazgos\n\n' +
    '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
    filas.join('\n') +
    '\n\nReproduccion...\n'
  );
}
const IMP = '| IMP-1 | IMPORTANTE | abierto | src/a.ts:1 | implementacion |';
const MEN = '| MEN-1 | MENOR | abierto | src/a.ts:2 | implementacion |';
const CRIT_CORREGIDO = '| CRIT-1 | CRITICO | corregido | src/a.ts:3 | implementacion |';
const CRIT_ABIERTO = '| CRIT-2 | CRITICO | abierto | src/a.ts:3 | implementacion |';

/**
 * Ronda 1 con `modelo` en la tarea; `informes` por revisor (null = se deja el
 * esqueleto que genera review, sin tocar). Devuelve la peticion de la ronda 2
 * del primer revisor y el resultado.
 */
async function ronda2(
  modelo: string,
  informes: Array<string | null>
): Promise<{ peticiones: string[]; modeloRonda: string | undefined; r1Peticion: string }> {
  let salida: { peticiones: string[]; modeloRonda: string | undefined; r1Peticion: string } | null = null;
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const id = 'TASK-970';
    const task = sampleTask({ id, rama: 'feature/task-970-modelo', modelo_sugerido: modelo });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    const ficheros = informes.length === 2 ? [JAVA, ANGULAR] : [JAVA];
    for (const f of ficheros) await escribirFichero(repoRoot, f, `// ${f}\n`);
    commitAll(repoRoot, 'trabajo r1');
    await advanceDevelop(repoRoot, task.rama);
    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
    const r1 = await runReviewCommand(tareasRoot, [id], '2026-11-07', deps);
    assert.equal(r1.informes.length, informes.length);
    assert.equal(r1.modeloRonda, undefined, 'la ronda 1 nunca sugiere otro modelo');
    const r1Peticion = await readFile((r1.informes[0] as { peticionPath: string }).peticionPath, 'utf8');
    for (let i = 0; i < informes.length; i++) {
      const g = r1.informes[i] as { informePath: string };
      const texto = informes[i];
      if (texto !== null) await writeFile(g.informePath, texto as string, 'utf8');
    }
    commitAll(repoRoot, 'informes r1');
    for (const g of r1.informes) {
      await runVeredictoCommand(
        tareasRoot,
        [id, 'cambios-solicitados', ...(informes.length > 1 ? ['--informe', path.basename(g.informePath)] : [])],
        { repoCwd: repoRoot }
      );
    }
    for (const f of ficheros) await escribirFichero(repoRoot, f.replace(/\.(java|ts)$/, 'Arreglo.$1'), '// arreglo\n');
    commitAll(repoRoot, 'correccion');
    const r2 = await runReviewCommand(tareasRoot, [id], '2026-11-07', deps);
    assert.equal(r2.ronda, 2);
    const dir = path.dirname(r2.informes[0]!.peticionPath);
    const nombres = (await readdir(dir)).filter((n) => n.startsWith('peticion-revision-2')).sort();
    const peticiones = await Promise.all(nombres.map((n) => readFile(path.join(dir, n), 'utf8')));
    salida = { peticiones, modeloRonda: r2.modeloRonda, r1Peticion };
  });
  return salida as unknown as { peticiones: string[]; modeloRonda: string | undefined; r1Peticion: string };
}

function lineaDeRonda(peticion: string): string | undefined {
  return peticion.split('\n').find((l) => l.startsWith('- Modelo sugerido para esta ronda:'));
}

test('modelo r2 (TASK-081): (a) solo IMPORTANTES y MENORES en la ronda 1 -> sugiere el escalon de abajo', async () => {
  const r = await ronda2(OPUS, [informe([IMP, MEN])]);
  assert.equal(r.modeloRonda, SONNET);
  assert.equal(
    lineaDeRonda(r.peticiones[0] as string),
    `- Modelo sugerido para esta ronda: ${SONNET} (verificacion de correcciones; la tarea usa ${OPUS})`
  );
  // La linea de siempre no cambia.
  assert.ok((r.peticiones[0] as string).includes(`(modelo sugerido: ${OPUS})\n`));
  assert.equal(lineaDeRonda(r.r1Peticion), undefined);
});

test('modelo r2 (TASK-081): la tarea en sonnet baja a haiku; en haiku no se sugiere nada', async () => {
  assert.equal((await ronda2(SONNET, [informe([IMP])])).modeloRonda, HAIKU);
  const r = await ronda2(HAIKU, [informe([IMP])]);
  assert.equal(r.modeloRonda, undefined);
  assert.equal(lineaDeRonda(r.peticiones[0] as string), undefined);
});

test('modelo r2 (TASK-081): (b) un CRITICO en la ronda 1, abierto o ya corregido -> se mantiene el de la tarea', async () => {
  for (const fila of [CRIT_ABIERTO, CRIT_CORREGIDO]) {
    const r = await ronda2(OPUS, [informe([IMP, fila])]);
    assert.equal(r.modeloRonda, undefined, fila);
    assert.equal(lineaDeRonda(r.peticiones[0] as string), undefined, fila);
  }
});

test('modelo r2 (TASK-081): (c) un CRITICO solo en el SEGUNDO informe de la ronda fragmentada -> no abarata ninguna peticion', async () => {
  const r = await ronda2(OPUS, [informe([IMP]), informe([CRIT_ABIERTO])]);
  assert.equal(r.peticiones.length, 2);
  assert.equal(r.modeloRonda, undefined);
  for (const p of r.peticiones) assert.equal(lineaDeRonda(p), undefined);
  // Contraprueba: los dos informes limpios si abaratan.
  const limpio = await ronda2(OPUS, [informe([IMP]), informe([MEN])]);
  assert.equal(limpio.modeloRonda, SONNET);
  for (const p of limpio.peticiones) assert.ok(lineaDeRonda(p)?.includes(` ${SONNET} `), p);
});

test('modelo r2 (TASK-081): (d) un informe sin tabla de hallazgos -> no abarata', async () => {
  const sinTabla =
    '# Informe\n\n- Veredicto: PENDIENTE\n\n## Hallazgos\n\nIMP-1 en prosa, sin tabla.\n';
  const r = await ronda2(OPUS, [sinTabla]);
  assert.equal(r.modeloRonda, undefined);
  assert.equal(lineaDeRonda(r.peticiones[0] as string), undefined);
});

test('modelo r2 (TASK-081): (e) un informe que sigue siendo la plantilla -> no abarata (ni uno de dos)', async () => {
  const sola = await ronda2(OPUS, [null]);
  assert.equal(sola.modeloRonda, undefined);
  assert.equal(lineaDeRonda(sola.peticiones[0] as string), undefined);
  const mezcla = await ronda2(OPUS, [informe([IMP]), null]);
  assert.equal(mezcla.modeloRonda, undefined);
  for (const p of mezcla.peticiones) assert.equal(lineaDeRonda(p), undefined);
});

test('modelo r2 (TASK-081): una severidad desconocida o un informe "sin hallazgos" real', async () => {
  const rara = await ronda2(OPUS, [informe(['| X-1 | Alta | abierto | src/a.ts:1 | plan |'])]);
  assert.equal(rara.modeloRonda, undefined);
  // Revisado de verdad y sin hallazgos (fila marcador, sin la fila de ejemplo): cuenta como limpio.
  const limpio = await ronda2(OPUS, [informe(['| (ninguno) | — | sin hallazgos | — | — |'])]);
  assert.equal(limpio.modeloRonda, SONNET);
});

test('modeloDeVerificacion (TASK-081): un escalon por debajo; haiku y desconocidos no se sugieren', () => {
  assert.equal(modeloDeVerificacion(OPUS), SONNET);
  assert.equal(modeloDeVerificacion(SONNET), HAIKU);
  assert.equal(modeloDeVerificacion(HAIKU), null);
  assert.equal(modeloDeVerificacion('gpt-4'), null);
  assert.equal(modeloDeVerificacion(''), null);
  assert.equal(modeloDeVerificacion(' Opus '), SONNET);
  assert.deepEqual([...ESCALERA_MODELOS], ['opus', 'sonnet', 'haiku']);
});
