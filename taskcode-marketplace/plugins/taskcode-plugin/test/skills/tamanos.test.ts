/**
 * TASK-124: lo que leen los agentes tiene un tamano maximo y no crece con el
 * proyecto.
 *
 * Cada fichero que se carga en el contexto de un agente (el CLAUDE.md del
 * repo de TaskCode, las skills, sus anexos y los agentes del plugin, y los
 * documentos de estado del repo) tiene un tope en bytes: su tamano al fijar
 * la tabla mas un ~15 %, redondeado hacia arriba al KB. Ademas hay un tope
 * del total de skills/ + agents/, mas estrecho que la suma de los topes
 * sueltos.
 *
 * Si un fichero pasa su tope, la salida no es subir el numero: es archivar lo
 * cerrado o partir el fichero. Un .md nuevo bajo skills/ o agents/ sin
 * entrada en la tabla tambien hace fallar el test: no se escapa por omision.
 *
 * Se mide en bytes del fichero tal como esta en disco (Buffer length, igual
 * que `wc -c`). Las tablas se fijaron con el checkout de Windows (CRLF), que
 * es el mas grande: en Linux (LF) sobra margen.
 *
 * La comprobacion es una funcion pura (`comprobarTopes`), con contrapruebas
 * sobre datos al final.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Compilado, este fichero vive en dist/test/skills/: tres niveles arriba esta
// la raiz del plugin, y tres mas la del repo.
const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const REPO_ROOT = path.resolve(PLUGIN_ROOT, '..', '..', '..');

const KB = 1024;

/** Topes de los .md del plugin, por ruta POSIX relativa a su raiz. Comentario: bytes al fijarlo. */
const TOPES_PLUGIN: Readonly<Record<string, number>> = {
  'agents/brainstorm-arquitectura.md': 8 * KB, // 6934
  'agents/brainstorm-dominio.md': 8 * KB, // 6267
  'agents/brainstorm-rendimiento.md': 7 * KB, // 6143
  'agents/brainstorm-riesgos.md': 9 * KB, // 7226
  'agents/brainstorm-testing.md': 10 * KB, // 8349
  'agents/brainstorm-unificador.md': 11 * KB, // 9121
  'agents/revisor-seguridad-deploy.md': 7 * KB, // 5712
  'skills/angular-vue-reviewer/SKILL.md': 23 * KB, // 20295
  'skills/approve/SKILL.md': 4 * KB, // 3021
  'skills/board/SKILL.md': 2 * KB, // 1183
  'skills/code-quality-reviewer/SKILL.md': 16 * KB, // 14192
  'skills/csharp-autocad-ifc-reviewer/SKILL.md': 18 * KB, // 15727
  'skills/doctor-deploy/SKILL.md': 6 * KB, // 5169
  'skills/finish/SKILL.md': 9 * KB, // 7163
  'skills/java-spring-reviewer/SKILL.md': 13 * KB, // 11119
  'skills/new/SKILL.md': 2 * KB, // 1780
  'skills/plan/SKILL.md': 7 * KB, // 5731
  'skills/review/SKILL.md': 9 * KB, // 7809
  'skills/rust-wasm-reviewer/SKILL.md': 26 * KB, // 22470
  'skills/start/SKILL.md': 3 * KB, // 2567
  'skills/task-workflow/SKILL.md': 18 * KB, // 15359
  'skills/task-workflow/avance.md': 9 * KB, // 7397
  'skills/task-workflow/cierre.md': 5 * KB, // 3565
  'skills/task-workflow/coste.md': 8 * KB, // 6728
  'skills/task-workflow/duracion.md': 6 * KB, // 4490
  'skills/task-workflow/heldout.md': 4 * KB, // 3478
  'skills/task-workflow/prerrequisitos.md': 3 * KB, // 2163
  'skills/task-workflow/revision.md': 15 * KB, // 12728
  'skills/task-workflow/roadmap.md': 5 * KB, // 3579
  'skills/task-workflow/sincronizacion.md': 7 * KB, // 5554
  'skills/task-workflow/trampas.md': 4 * KB, // 2883
  'skills/task-workflow/verificacion-selectiva.md': 15 * KB, // 12916
  'skills/task-workflow/tests-pesados.md': 3 * KB, // TASK-129
};

/** Tope del total de skills/ + agents/ (248 818 B al fijarlo). */
const TOPE_TOTAL_PLUGIN = 280 * KB;

/** Topes de ficheros del repo, por ruta POSIX relativa a su raiz. */
const TOPES_REPO: Readonly<Record<string, number>> = {
  'CLAUDE.md': 8 * KB, // 5852
  'docs/contexto/CHECKLIST_TERMINACION.md': 20 * KB,
  'docs/contexto/ESTADO.md': 10 * KB,
};

const CONSEJO = 'archiva o parte el fichero en vez de subir el tope';

interface Medida {
  ruta: string;
  /** null: el fichero no existe. */
  bytes: number | null;
}

/**
 * Compara lo medido con la tabla. Devuelve un mensaje por problema (vacio si
 * todo cabe): fichero por encima de su tope, fichero sin tope en la tabla, y
 * entrada de la tabla sin fichero.
 */
function comprobarTopes(medidas: readonly Medida[], topes: Readonly<Record<string, number>>): string[] {
  const errores: string[] = [];
  const medidas_ = new Set(medidas.map((m) => m.ruta));
  for (const { ruta, bytes } of medidas) {
    const tope = topes[ruta];
    if (bytes === null) {
      errores.push(`${ruta}: no existe; quita su entrada de la tabla de topes o restaura el fichero`);
    } else if (tope === undefined) {
      errores.push(
        `${ruta}: ${bytes} B, sin tope en la tabla; anade su entrada (tamano actual + 15 %, al KB). ` +
          `Si no cabe en un tope razonable, ${CONSEJO}`,
      );
    } else if (bytes > tope) {
      errores.push(`${ruta}: ${bytes} B, tope ${tope} B; ${CONSEJO}`);
    }
  }
  for (const ruta of Object.keys(topes)) {
    if (!medidas_.has(ruta)) errores.push(`${ruta}: tiene tope en la tabla pero no se ha medido (no existe)`);
  }
  return errores;
}

/** Bytes en disco, o null si no existe. */
async function bytesDe(absoluta: string): Promise<number | null> {
  try {
    return (await readFile(absoluta)).length;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

/** Todos los .md bajo `dir` (recursivo), como rutas POSIX relativas a `raiz`. */
async function mdBajo(raiz: string, dir: string): Promise<string[]> {
  const fuera: string[] = [];
  for (const e of await readdir(path.join(raiz, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) fuera.push(...(await mdBajo(raiz, rel)));
    else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) fuera.push(rel);
  }
  return fuera;
}

async function medidasPlugin(): Promise<Medida[]> {
  const rutas = [...(await mdBajo(PLUGIN_ROOT, 'skills')), ...(await mdBajo(PLUGIN_ROOT, 'agents'))].sort();
  return Promise.all(rutas.map(async (ruta) => ({ ruta, bytes: await bytesDe(path.join(PLUGIN_ROOT, ruta)) })));
}

test('topes: cada .md de skills/ y agents/ tiene tope en la tabla y cabe en el', async () => {
  const medidas = await medidasPlugin();
  assert.ok(medidas.length >= 30, `solo se midieron ${medidas.length} ficheros: el test no esta mirando skills/ y agents/`);
  assert.deepEqual(comprobarTopes(medidas, TOPES_PLUGIN), []);
});

test('topes: el total de skills/ + agents/ cabe en su tope', async () => {
  const total = (await medidasPlugin()).reduce((s, m) => s + (m.bytes ?? 0), 0);
  assert.deepEqual(comprobarTopes([{ ruta: 'skills/ + agents/ (total)', bytes: total }], { 'skills/ + agents/ (total)': TOPE_TOTAL_PLUGIN }), []);
});

test('topes: CLAUDE.md y los documentos de estado del repo caben en el suyo', async () => {
  const medidas = await Promise.all(
    Object.keys(TOPES_REPO).map(async (ruta) => ({ ruta, bytes: await bytesDe(path.join(REPO_ROOT, ruta)) })),
  );
  assert.deepEqual(comprobarTopes(medidas, TOPES_REPO), []);
});

// --- Contrapruebas sobre datos: la comprobacion no es un verde vacio --------

test('comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo', () => {
  const errores = comprobarTopes([{ ruta: 'skills/x/SKILL.md', bytes: 3000 }], { 'skills/x/SKILL.md': 2048 });
  assert.equal(errores.length, 1);
  assert.match(errores[0] as string, /^skills\/x\/SKILL\.md: 3000 B, tope 2048 B; archiva o parte el fichero en vez de subir el tope$/);
});

test('comprobarTopes: justo en el tope pasa; un byte mas, no', () => {
  assert.deepEqual(comprobarTopes([{ ruta: 'a.md', bytes: 2048 }], { 'a.md': 2048 }), []);
  assert.equal(comprobarTopes([{ ruta: 'a.md', bytes: 2049 }], { 'a.md': 2048 }).length, 1);
});

test('comprobarTopes: un .md nuevo sin entrada en la tabla falla', () => {
  const errores = comprobarTopes(
    [
      { ruta: 'agents/a.md', bytes: 100 },
      { ruta: 'agents/nuevo.md', bytes: 100 },
    ],
    { 'agents/a.md': 1024 },
  );
  assert.equal(errores.length, 1);
  assert.match(errores[0] as string, /^agents\/nuevo\.md: 100 B, sin tope en la tabla/);
  assert.match(errores[0] as string, /archiva o parte el fichero en vez de subir el tope/);
});

test('comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla', () => {
  assert.match(comprobarTopes([], { 'skills/viejo.md': 1024 })[0] as string, /^skills\/viejo\.md: tiene tope/);
  assert.match(comprobarTopes([{ ruta: 'CLAUDE.md', bytes: null }], { 'CLAUDE.md': 1024 })[0] as string, /^CLAUDE\.md: no existe/);
});
