/**
 * TASK-153b: la peticion de revision trae `## Candidatos 4D`, generada desde
 * el diff, contra un repo Git temporal de verdad.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { runReviewCommand, seccionCandidatosDeRonda } from '../../src/commands/review.js';
import { definicionesDeGrep, SECCION_CANDIDATOS_4D } from '../../src/core/candidatos-4d.js';
import { definicionesEnRef, GitCommandError } from '../../src/fs/git.js';
import {
  SCRIPTS_DIR,
  git,
  sampleTask,
  commitAll,
  withTempRepo,
  escribirFichero,
  setupTaskEnCursoSoloTarea,
} from '../helpers/review-fixtures.js';

test('definicionesEnRef (TASK-153b): sin coincidencias da vacio, pero un fallo real de git no se traga', async () => {
  await withTempRepo(async (repoRoot) => {
    // El repo de la plantilla solo tiene README y .gitignore: ninguna definicion.
    assert.equal(definicionesEnRef('develop', repoRoot), '');
    assert.throws(() => definicionesEnRef('rama-que-no-existe', repoRoot), GitCommandError);
  });
});

test('review (TASK-153b): la peticion lista el helper nuevo parecido a uno que ya existia y el test que promete algo', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // En la base ya hay un lector de secciones.
    await escribirFichero(repoRoot, 'src/core/secciones.ts', 'export function leerSeccionTarea(t: string) {\n  return t;\n}\n');
    commitAll(repoRoot, 'helper existente en develop');

    const task = sampleTask({ id: 'TASK-830', rama: 'feature/task-830-candidatos' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    // La tarea anade otro casi igual y un test cuyo nombre promete algo.
    await escribirFichero(repoRoot, 'src/commands/otro.ts', 'export function leerSeccionTareas(t: string) {\n  return t.trim();\n}\n');
    await escribirFichero(
      repoRoot,
      'test/otro.test.ts',
      "import { test } from 'node:test';\ntest('otro: no toca el disco si el id es invalido', () => {});\n"
    );
    commitAll(repoRoot, 'trabajo de la tarea');

    const result = await runReviewCommand(tareasRoot, ['TASK-830'], '2026-11-22', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    const peticion = await readFile(path.join(path.dirname(result.filePath), 'revision', 'peticion-revision-1.md'), 'utf8');
    const i = peticion.indexOf(SECCION_CANDIDATOS_4D);
    assert.ok(i !== -1, 'la peticion no trae la seccion de candidatos 4D');
    const seccion = peticion.slice(i, peticion.indexOf('\n## ', i + 1) === -1 ? undefined : peticion.indexOf('\n## ', i + 1));
    assert.match(seccion, /`leerSeccionTareas` \(src\/commands\/otro\.ts:1\) ~ `leerSeccionTarea` \(src\/core\/secciones\.ts:1\)/);
    assert.match(seccion, /«otro: no toca el disco si el id es invalido» \(test\/otro\.test\.ts:2\)/);
  });
});

test('MENOR-6: lo que reconoce el filtro fino llega por el git grep, una muestra por familia; MENOR-1: lo excluido no entra', async () => {
  await withTempRepo(async (repoRoot) => {
    const muestras: Record<string, string> = {
      'src/a.ts': 'export function funcionTs() {}\nexport class ClaseTs {}\nexport const flechaTs = (x: number) => x;\n',
      'src/b.rs': 'pub fn funcion_rust() {}\npub struct EstructuraRust {}\n',
      'src/c.py': 'def funcion_python():\n    pass\nclass ClasePython:\n    pass\n',
      'src/D.java': 'public record RegistroJava(int a) {}\npublic enum EnumJava { A }\n',
      'scripts/e.sh': 'normalizar_rama() {\n  :\n}\n',
      'dist/f.js': 'export function compiladaNoCuenta() {}\n',
    };
    for (const [ruta, texto] of Object.entries(muestras)) await escribirFichero(repoRoot, ruta, texto);
    commitAll(repoRoot, 'muestras por familia');
    const nombres = definicionesDeGrep(definicionesEnRef('develop', repoRoot, ['**/dist/**']), 'develop').map((d) => d.nombre).sort();
    assert.deepEqual(nombres, [
      'ClasePython', 'ClaseTs', 'EnumJava', 'EstructuraRust', 'RegistroJava',
      'flechaTs', 'funcionTs', 'funcion_python', 'funcion_rust', 'normalizar_rama',
    ]);
  });
});

test('IMP-2: si git falla la seccion lo dice con el motivo y no lanza', async () => {
  await withTempRepo(async (repoRoot) => {
    const s = seccionCandidatosDeRonda('rama-que-no-existe', 'develop', '', [], repoRoot);
    assert.ok(s.startsWith(`${SECCION_CANDIDATOS_4D}\n`), s);
    assert.match(s, /No se pudieron calcular \(fatal: [^)]*rama-que-no-existe\)/);
  });
});

test('IMP-2: en la ronda incremental solo salen los tests del delta y las existentes son las de la base, no las de HEAD', async () => {
  await withTempRepo(async (repoRoot) => {
    git(['checkout', '-q', '-b', 'feature/inc'], repoRoot);
    await escribirFichero(repoRoot, 'src/a.ts', 'export function leerSeccionTarea() {}\n');
    await escribirFichero(repoRoot, 'test/a.test.ts', "test('ronda 1: nunca borra nada', () => {});\n");
    commitAll(repoRoot, 'ronda 1');
    const ronda1 = git(['rev-parse', 'HEAD'], repoRoot).trim();
    await escribirFichero(repoRoot, 'src/b.ts', 'export function leerSeccionTareas() {}\n');
    await escribirFichero(repoRoot, 'test/a.test.ts', "test('ronda 1: nunca borra nada', () => {});\ntest('ronda 2: siempre avisa', () => {});\n");
    commitAll(repoRoot, 'ronda 2');
    const diffCodigo = git(['diff', `${ronda1}..HEAD`, '--', 'src'], repoRoot);
    const s = seccionCandidatosDeRonda('develop', ronda1, diffCodigo, ['test/a.test.ts'], repoRoot);
    assert.match(s, /«ronda 2: siempre avisa»/);
    assert.doesNotMatch(s, /ronda 1: nunca borra nada/);
    // leerSeccionTarea solo existe en HEAD (ronda 1), no en la base: no es «lo que ya existia».
    assert.doesNotMatch(s, /Posible duplicacion con lo que ya existia/);
  });
});

test('TASK-167b: review avisa, sin bloquear, de una funcion copiada con otro nombre y la lista en la peticion; sin copia, nada', async () => {
  const ORIGINAL =
    'export function leerSeccion(texto: string, titulo: string): string[] {\n' +
    '  const lineas = texto.split("\n");\n' +
    '  const inicio = lineas.findIndex((l) => l.trim() === titulo);\n' +
    '  if (inicio === -1) return [];\n' +
    '  const fin = lineas.findIndex((l, i) => i > inicio && l.startsWith("## "));\n' +
    '  return lineas.slice(inicio + 1, fin === -1 ? lineas.length : fin).filter((l) => l.trim() !== "");\n' +
    '}\n';
  const COPIA = ORIGINAL.replace('leerSeccion', 'bloqueDe').replace(/lineas/g, 'ls').replace(/inicio/g, 'desde');
  for (const copia of [true, false]) {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await escribirFichero(repoRoot, 'src/core/secciones.ts', ORIGINAL);
      commitAll(repoRoot, 'helper existente en develop');
      const task = sampleTask({ id: 'TASK-831', rama: 'feature/task-831-cuerpo' });
      await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
      await escribirFichero(repoRoot, 'src/commands/nuevo.ts', copia ? COPIA : 'export function otraCosa(): number {\n  return 1;\n}\n');
      commitAll(repoRoot, 'trabajo de la tarea');
      const result = await runReviewCommand(tareasRoot, ['TASK-831'], '2026-11-25', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
      const peticion = await readFile(path.join(path.dirname(result.filePath), 'revision', 'peticion-revision-1.md'), 'utf8');
      const aviso = result.avisos.find((a) => a.includes('casi identica(s) a otra por su cuerpo'));
      if (copia) {
        assert.ok(aviso !== undefined, `sin aviso: ${result.avisos.join(' | ')}`);
        assert.match(aviso, /bloqueDe en src\/commands\/nuevo\.ts:1 ~ leerSeccion en src\/core\/secciones\.ts:1/);
        assert.match(peticion, /### Posible duplicacion por cuerpo[\s\S]*`bloqueDe` \(src\/commands\/nuevo\.ts:1\) ~ `leerSeccion` \(src\/core\/secciones\.ts:1\)/);
      } else {
        assert.equal(aviso, undefined, 'avisa sin copia');
        assert.doesNotMatch(peticion, /Posible duplicacion por cuerpo/);
      }
      assert.equal(result.ronda, 1, 'la ronda se abre igual');
    });
  }
});
