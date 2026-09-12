/**
 * Tests de src/core/revisores.ts (TASK-018): el loader de
 * `patrones_archivo`/`fallback`/`umbral_dominios` y la funcion pura
 * ficheros -> dominios que aplica el umbral.
 *
 * Dos capas, deliberadamente separadas (arquitectura lo pidio asi en su
 * salida de brainstorm, ver planificacion/):
 *
 * - `cargarCatalogoRevisores` SI toca disco, pero nunca Git: se prueba
 *   contra las skills REALES del plugin (recursos reales, no mocks) y
 *   contra fixtures sinteticas en un directorio temporal para los casos
 *   fail-closed que las skills reales no pueden ejercitar (dos
 *   "fallback: true", un "umbral_dominios" invalido...).
 * - `clasificarPorDominio` es PURA: cero I/O, se prueba con catalogos
 *   sinteticos construidos a mano. Aqui viven en concreto los limites
 *   del umbral que el catalogo real no puede ejercitar hoy (el propio
 *   skills/code-quality-reviewer/SKILL.md lo dice: con solo tres
 *   revisores de dominio instalados, "mas de tres dominios" es teorico)
 *   — 4 dominios sinteticos lo hacen posible sin inventar una skill que
 *   no existe.
 *
 * El caso de 1, 2 y exactamente 3 dominios REALES (con las skills que de
 * verdad trae el plugin) se prueba end-to-end, con diffs de un repo Git
 * temporal, en test/commands/review.test.ts — aqui no se repite.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cargarCatalogoRevisores,
  clasificarPorDominio,
  CatalogoRevisoresError,
  type CatalogoRevisores,
} from '../../src/core/revisores.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
const SKILLS_DIR_REAL = path.join(PLUGIN_ROOT, 'skills');

// --- cargarCatalogoRevisores, contra las skills reales -------------------

test('cargarCatalogoRevisores: lee las skills reales del plugin (3 de dominio + 1 generico con umbral 3)', () => {
  const catalogo = cargarCatalogoRevisores(SKILLS_DIR_REAL);
  const nombres = catalogo.dominio.map((r) => r.nombre).sort();
  assert.deepEqual(nombres, [
    'angular-vue-reviewer',
    'csharp-autocad-ifc-reviewer',
    'java-spring-reviewer',
  ]);
  for (const revisor of catalogo.dominio) {
    assert.ok(revisor.patronesArchivo.length > 0, `${revisor.nombre}: sin patrones`);
  }
  assert.equal(catalogo.generico.nombre, 'code-quality-reviewer');
  assert.equal(catalogo.generico.umbralDominios, 3);
});

test('cargarCatalogoRevisores: relee el disco en cada llamada, sin cache (no diverge si una skill cambia)', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
  try {
    await escribirSkillDominio(tmp, 'demo-reviewer', ['**/*.demo']);
    await escribirSkillGenerica(tmp, 'generico', 3);

    const primero = cargarCatalogoRevisores(tmp);
    assert.deepEqual(primero.dominio[0]!.patronesArchivo, ['**/*.demo']);

    // Se reescribe la skill con un patron distinto SIN reiniciar nada:
    // si cargarCatalogoRevisores cacheara u operara sobre una copia,
    // esta segunda llamada seguiria viendo el patron viejo.
    await escribirSkillDominio(tmp, 'demo-reviewer', ['**/*.otro']);
    const segundo = cargarCatalogoRevisores(tmp);
    assert.deepEqual(segundo.dominio[0]!.patronesArchivo, ['**/*.otro']);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

// --- cargarCatalogoRevisores, fail-closed con fixtures sinteticas --------

async function escribirSkillDominio(
  skillsDir: string,
  nombre: string,
  patrones: string[],
  extra = ''
): Promise<void> {
  const dir = path.join(skillsDir, nombre);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, 'SKILL.md'),
    `---\nname: ${nombre}\ndescription: skill de prueba\n---\n\n` +
      '```yaml\n' +
      `rol: revisor\n` +
      `patrones_archivo: [${patrones.map((p) => `"${p}"`).join(', ')}]\n` +
      `${extra}` +
      '```\n',
    'utf8'
  );
}

async function escribirSkillGenerica(
  skillsDir: string,
  nombre: string,
  umbral: number | string
): Promise<void> {
  const dir = path.join(skillsDir, nombre);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, 'SKILL.md'),
    `---\nname: ${nombre}\ndescription: skill generica de prueba\n---\n\n` +
      '```yaml\n' +
      'rol: revisor\n' +
      'patrones_archivo: []\n' +
      'fallback: true\n' +
      `umbral_dominios: ${umbral}\n` +
      '```\n',
    'utf8'
  );
}

test('cargarCatalogoRevisores: sin ninguna skill "fallback: true" aborta (sin generico no hay adonde caer)', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
  try {
    await escribirSkillDominio(tmp, 'demo-reviewer', ['**/*.demo']);
    assert.throws(() => cargarCatalogoRevisores(tmp), CatalogoRevisoresError);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('cargarCatalogoRevisores: DOS skills "fallback: true" abortan (no se sabe cual usar)', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
  try {
    await escribirSkillGenerica(tmp, 'generico-a', 3);
    await escribirSkillGenerica(tmp, 'generico-b', 3);
    assert.throws(
      () => cargarCatalogoRevisores(tmp),
      (e: unknown) => {
        assert.ok(e instanceof CatalogoRevisoresError);
        assert.match((e as Error).message, /mas de un revisor declarado "fallback: true"/);
        return true;
      }
    );
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('cargarCatalogoRevisores: "umbral_dominios" invalido (cero, negativo, o no numerico) aborta', async () => {
  for (const umbral of [0, -1, '"tres"']) {
    const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
    try {
      await escribirSkillGenerica(tmp, 'generico', umbral);
      assert.throws(
        () => cargarCatalogoRevisores(tmp),
        (e: unknown) => {
          assert.ok(e instanceof CatalogoRevisoresError);
          assert.match((e as Error).message, /umbral_dominios/);
          return true;
        },
        `umbral_dominios: ${umbral} deberia abortar`
      );
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  }
});

test('cargarCatalogoRevisores: "patrones_archivo" que no es una lista de texto aborta', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
  try {
    const dir = path.join(tmp, 'demo-reviewer');
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'SKILL.md'),
      '---\nname: demo-reviewer\ndescription: skill de prueba\n---\n\n' +
        '```yaml\n' +
        'rol: revisor\n' +
        'patrones_archivo: 42\n' +
        '```\n',
      'utf8'
    );
    await escribirSkillGenerica(tmp, 'generico', 3);
    assert.throws(
      () => cargarCatalogoRevisores(tmp),
      (e: unknown) => {
        assert.ok(e instanceof CatalogoRevisoresError);
        assert.match((e as Error).message, /patrones_archivo/);
        return true;
      }
    );
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('cargarCatalogoRevisores: un directorio de skills/ SIN bloque yaml (p. ej. task-workflow) no participa, sin error', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
  try {
    const dir = path.join(tmp, 'no-es-un-revisor');
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'SKILL.md'),
      '---\nname: no-es-un-revisor\ndescription: sin bloque yaml de enrutado\n---\n\nsolo prosa.\n',
      'utf8'
    );
    await escribirSkillDominio(tmp, 'demo-reviewer', ['**/*.demo']);
    await escribirSkillGenerica(tmp, 'generico', 3);
    const catalogo = cargarCatalogoRevisores(tmp);
    assert.deepEqual(
      catalogo.dominio.map((r) => r.nombre),
      ['demo-reviewer']
    );
    assert.equal(catalogo.generico.nombre, 'generico');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

// --- clasificarPorDominio: funcion pura, catalogos sinteticos ------------

function catalogoSintetico(numDominios: number, umbralDominios: number): CatalogoRevisores {
  return {
    dominio: Array.from({ length: numDominios }, (_, i) => ({
      nombre: `dominio-${i + 1}-reviewer`,
      patronesArchivo: [`dominio-${i + 1}/**`],
    })),
    generico: { nombre: 'code-quality-reviewer', umbralDominios },
  };
}

test('clasificarPorDominio: 1 dominio detectado fragmenta en 1 grupo con ese revisor', () => {
  const catalogo = catalogoSintetico(2, 3);
  const plan = clasificarPorDominio(['dominio-1/A.txt'], catalogo);
  assert.equal(plan.fragmentado, true);
  assert.equal(plan.grupos.length, 1);
  assert.equal(plan.grupos[0]!.revisor, 'dominio-1-reviewer');
  assert.deepEqual(plan.grupos[0]!.ficheros, ['dominio-1/A.txt']);
});

test('clasificarPorDominio: varios ficheros del MISMO dominio quedan en el MISMO grupo', () => {
  const catalogo = catalogoSintetico(2, 3);
  const plan = clasificarPorDominio(['dominio-1/A.txt', 'dominio-1/B.txt'], catalogo);
  assert.equal(plan.grupos.length, 1);
  assert.deepEqual(plan.grupos[0]!.ficheros, ['dominio-1/A.txt', 'dominio-1/B.txt']);
});

test('clasificarPorDominio: EXACTAMENTE en el umbral fragmenta (umbral inclusive, no cae al generico)', () => {
  const catalogo = catalogoSintetico(3, 3);
  const ficheros = ['dominio-1/A.txt', 'dominio-2/B.txt', 'dominio-3/C.txt'];
  const plan = clasificarPorDominio(ficheros, catalogo);
  assert.equal(plan.fragmentado, true, 'con 3 dominios y umbral 3, tiene que fragmentar');
  assert.equal(plan.grupos.length, 3);
  assert.deepEqual(
    plan.grupos.map((g) => g.revisor).sort(),
    ['dominio-1-reviewer', 'dominio-2-reviewer', 'dominio-3-reviewer']
  );
});

test('clasificarPorDominio: UNO MAS que el umbral cae a un unico generico con TODOS los ficheros', () => {
  const catalogo = catalogoSintetico(4, 3);
  const ficheros = ['dominio-1/A.txt', 'dominio-2/B.txt', 'dominio-3/C.txt', 'dominio-4/D.txt'];
  const plan = clasificarPorDominio(ficheros, catalogo);
  assert.equal(plan.fragmentado, false, 'con 4 dominios y umbral 3, NO tiene que fragmentar');
  assert.equal(plan.grupos.length, 1);
  assert.equal(plan.grupos[0]!.revisor, 'code-quality-reviewer');
  assert.deepEqual(plan.grupos[0]!.ficheros, ficheros);
});

test('clasificarPorDominio: cero ficheros que casen ningun dominio cae al generico con TODOS los ficheros', () => {
  const catalogo = catalogoSintetico(2, 3);
  const ficheros = ['docs/README.md', 'scripts/deploy.sh'];
  const plan = clasificarPorDominio(ficheros, catalogo);
  assert.equal(plan.fragmentado, false);
  assert.equal(plan.grupos.length, 1);
  assert.equal(plan.grupos[0]!.revisor, 'code-quality-reviewer');
  assert.deepEqual(plan.grupos[0]!.ficheros, ficheros);
});

test('clasificarPorDominio: con 1-3 dominios detectados, un fichero que no casa ninguno lo cubre TAMBIEN el generico', () => {
  const catalogo = catalogoSintetico(2, 3);
  const plan = clasificarPorDominio(['dominio-1/A.txt', 'sin-dominio.txt'], catalogo);
  assert.equal(plan.fragmentado, true);
  assert.equal(plan.grupos.length, 2);
  const dominio1 = plan.grupos.find((g) => g.revisor === 'dominio-1-reviewer');
  const generico = plan.grupos.find((g) => g.revisor === 'code-quality-reviewer');
  assert.ok(dominio1 !== undefined);
  assert.ok(generico !== undefined, 'el fichero sin dominio no puede quedar sin revisor');
  assert.deepEqual(dominio1!.ficheros, ['dominio-1/A.txt']);
  assert.deepEqual(generico!.ficheros, ['sin-dominio.txt']);
});

test('clasificarPorDominio: diff vacio (sin ficheros) cae al generico con una lista vacia', () => {
  const catalogo = catalogoSintetico(2, 3);
  const plan = clasificarPorDominio([], catalogo);
  assert.equal(plan.fragmentado, false);
  assert.equal(plan.grupos.length, 1);
  assert.deepEqual(plan.grupos[0]!.ficheros, []);
});

test('clasificarPorDominio: contraprueba de mutacion — cortar con ">=" en vez de ">" fragmentaria de mas', () => {
  // Fija el sentido exacto del corte: con umbral 3, el numero de
  // dominios que SI cae al generico es el PRIMERO por encima (4), nunca
  // el propio umbral (3). Si alguien cambiara la condicion de
  // `numDominios > umbral` a `numDominios >= umbral`, este test lo
  // detecta porque 3 dominios dejaria de fragmentar.
  const catalogo = catalogoSintetico(3, 3);
  const ficheros = ['dominio-1/A.txt', 'dominio-2/B.txt', 'dominio-3/C.txt'];
  const plan = clasificarPorDominio(ficheros, catalogo);
  assert.equal(plan.fragmentado, true);
});
