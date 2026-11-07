/**
 * TASK-081: la peticion de revision trae `## Contexto permitido` y el
 * informe `## Lecturas fuera del contexto permitido`. Repos Git temporales
 * reales, a traves del comando `review`; la evidencia se lee de lo que escribe.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runReviewCommand } from '../../src/commands/review.js';
import { contextoPermitido } from '../../src/core/contexto-revision.js';
import { EXCLUIR_HELDOUT } from '../../src/core/heldout.js';
import { parsearConfig } from '../../src/core/config.js';
import {
  SCRIPTS_DIR,
  sampleTask,
  git,
  commitAll,
  withTempRepo,
  setupTaskEnCursoSoloTarea,
  advanceDevelop,
  escribirFichero,
} from '../helpers/review-fixtures.js';

const JAVA = 'src/main/java/com/acme/UserService.java';
const ANGULAR = 'src/app/user-profile/user-profile.component.ts';

/** Las rutas listadas bajo `## Contexto permitido` (lineas `- ruta`). */
function contexto(peticion: string): string[] {
  const lineas = peticion.split('\n');
  const ini = lineas.findIndex((l) => l === '## Contexto permitido');
  assert.notEqual(ini, -1, 'la peticion no trae "## Contexto permitido"');
  const fin = lineas.findIndex((l, i) => i > ini && l.startsWith('## '));
  return lineas
    .slice(ini + 1, fin === -1 ? lineas.length : fin)
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2));
}

async function revisar(
  id: string,
  ficheros: string[],
  preparar?: (repoRoot: string) => Promise<void>
): Promise<{ peticiones: Map<string, string>; informe: string }> {
  let salida: { peticiones: Map<string, string>; informe: string } | null = null;
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Un fichero versionado que NO entra en el diff de la tarea.
    await escribirFichero(repoRoot, 'src/otro/Viejo.ts', 'export const viejo = 1;\n');
    if (preparar !== undefined) await preparar(repoRoot);
    commitAll(repoRoot, 'base con fichero ajeno');
    const task = sampleTask({ id, rama: `feature/${id.toLowerCase()}-contexto` });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    for (const f of ficheros) await escribirFichero(repoRoot, f, `// ${f}\n`);
    await mkdir(path.join(tareasRoot, '02-en-curso', id, 'planificacion'), { recursive: true });
    await writeFile(path.join(tareasRoot, '02-en-curso', id, 'planificacion', 'plan-final.md'), '# plan\n', 'utf8');
    commitAll(repoRoot, 'trabajo');
    await advanceDevelop(repoRoot, task.rama);
    const r = await runReviewCommand(tareasRoot, [id], '2026-11-07', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    const peticiones = new Map<string, string>();
    for (const g of r.informes) peticiones.set(g.revisor, await readFile(g.peticionPath, 'utf8'));
    const informe = await readFile((r.informes[0] as { informePath: string }).informePath, 'utf8');
    salida = { peticiones, informe };
  });
  return salida as unknown as { peticiones: Map<string, string>; informe: string };
}

test('contexto permitido (TASK-081): positiva, trae la carpeta de la tarea y los ficheros del diff', async () => {
  const { peticiones } = await revisar('TASK-960', [JAVA]);
  const lista = contexto(peticiones.get('java-spring-reviewer') as string);
  assert.deepEqual(lista, [
    'tareas/03-en-revision/TASK-960/tarea.md',
    'tareas/03-en-revision/TASK-960/planificacion/',
    JAVA,
  ]);
});

test('contexto permitido (TASK-081): negativa, ni un fichero versionado fuera del diff ni un test reservado', async () => {
  const heldout = 'tareas/02-en-curso/TASK-961/aceptacion/secreto.test.cjs';
  const { peticiones } = await revisar('TASK-961', [JAVA, heldout], async (repoRoot) => {
    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
    // El proyecto los pide como contexto extra: el reservado sigue sin entrar.
    await writeFile(
      path.join(repoRoot, '.taskcode', 'config.yml'),
      `contexto_revision: [docs/guia.md, ${heldout}]\n`,
      'utf8'
    );
    await escribirFichero(repoRoot, 'docs/guia.md', 'guia\n');
  });
  const lista = contexto(peticiones.get('java-spring-reviewer') as string);
  assert.ok(lista.includes(JAVA));
  assert.ok(lista.includes('docs/guia.md'), 'el extra de config.yml se anade');
  assert.ok(!lista.includes('src/otro/Viejo.ts'), 'un fichero fuera del diff no es contexto');
  assert.ok(!lista.some((r) => r.includes('aceptacion')), `un test reservado no es contexto: ${lista.join(', ')}`);
});

test('contexto permitido (TASK-081): fragmentada, cada peticion lista solo los ficheros de su dominio', async () => {
  const { peticiones } = await revisar('TASK-962', [JAVA, ANGULAR]);
  const java = contexto(peticiones.get('java-spring-reviewer') as string);
  const angular = contexto(peticiones.get('angular-vue-reviewer') as string);
  assert.ok(java.includes(JAVA) && !java.includes(ANGULAR));
  assert.ok(angular.includes(ANGULAR) && !angular.includes(JAVA));
  // Lo de la tarea lo tienen los dos.
  assert.ok(java.includes('tareas/03-en-revision/TASK-962/tarea.md'));
  assert.ok(angular.includes('tareas/03-en-revision/TASK-962/tarea.md'));
});

test('contexto permitido (TASK-081): la peticion sigue diciendo lo de siempre y el informe trae su seccion', async () => {
  const { peticiones, informe } = await revisar('TASK-963', [JAVA]);
  const peticion = peticiones.get('java-spring-reviewer') as string;
  assert.match(peticion, /- Agente a lanzar: general-purpose \(modelo sugerido: \w+\)\n/);
  assert.ok(!peticion.includes('Modelo sugerido para esta ronda'), 'la ronda 1 nunca sugiere otro modelo');
  assert.ok(
    peticion.indexOf('## Contexto permitido') > peticion.indexOf('## Instrucciones para el agente revisor'),
    'va tras las instrucciones'
  );
  assert.ok(peticion.indexOf('## Contexto permitido') < peticion.indexOf('## Commits a revisar'));
  const lineas = informe.split('\n');
  const i = lineas.indexOf('## Lecturas fuera del contexto permitido');
  assert.notEqual(i, -1);
  assert.equal(lineas.slice(i + 1).find((l) => l.trim() !== ''), 'ninguna');
});

test('contexto permitido (TASK-081): la funcion pura filtra grupo y extra con excluir, y no deja al revisor sin enunciado', () => {
  const lista = contextoPermitido({
    carpetaTarea: 'tareas/03-en-revision/TASK-1',
    ficherosDelGrupo: ['src/a.ts', 'dist/a.js', 'src/b.lock'],
    extra: ['docs/x.md', 'build/y.js', 'src/a.ts'],
    excluir: ['**/dist/**', '**/*.lock', 'build/**', 'tareas/**', EXCLUIR_HELDOUT],
  });
  // `tareas/**` esta excluido del diff y aun asi tarea.md y planificacion/ entran.
  assert.deepEqual(lista, [
    'tareas/03-en-revision/TASK-1/tarea.md',
    'tareas/03-en-revision/TASK-1/planificacion/',
    'src/a.ts',
    'docs/x.md',
  ]);
});

test('contexto permitido (TASK-081, MEN-2 r1): ni los tests reservados ni una carpeta que los contenga entran, aunque excluir no cubra tareas/**', () => {
  const lista = contextoPermitido({
    carpetaTarea: 'tareas/03-en-revision/TASK-1',
    ficherosDelGrupo: ['src/a.ts'],
    extra: [
      '.',
      'tareas',
      'tareas/03-en-revision/',
      'tareas/03-en-revision/TASK-1',
      'tareas/03-en-revision/TASK-1/aceptacion',
      'tareas/03-en-revision/TASK-1/aceptacion/caso.test.ts',
      'tareas/03-en-revision/TASK-1/notas.md',
      'docs',
    ],
    // Sin EXCLUIR_HELDOUT ni tareas/**: el filtro de reservados es de la propia funcion.
    excluir: [],
  });
  assert.deepEqual(lista, [
    'tareas/03-en-revision/TASK-1/tarea.md',
    'tareas/03-en-revision/TASK-1/planificacion/',
    'src/a.ts',
    'tareas/03-en-revision/TASK-1/notas.md',
    'docs',
  ]);
});

test('contexto permitido (TASK-081): contexto_revision en config.yml es una lista y no ancla los patrones', () => {
  const RUTA = '/repo/.taskcode/config.yml';
  assert.deepEqual(parsearConfig('limite_wip: 1\n', RUTA).contexto_revision, []);
  assert.deepEqual(parsearConfig('contexto_revision: [README.md, docs/guia.md]\n', RUTA).contexto_revision, [
    'README.md',
    'docs/guia.md',
  ]);
  assert.throws(() => parsearConfig('contexto_revision: docs/guia.md\n', RUTA), /contexto_revision/);
  assert.throws(() => parsearConfig('contexto_revision: [../fuera]\n', RUTA), /contexto_revision/);
});

test('contexto permitido (TASK-081): git sigue limpio tras review (nada escrito fuera de la tarea)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-964', rama: 'feature/task-964-limpio' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    await escribirFichero(repoRoot, JAVA, 'class A {}\n');
    commitAll(repoRoot, 'trabajo');
    await advanceDevelop(repoRoot, task.rama);
    await runReviewCommand(tareasRoot, ['TASK-964'], '2026-11-07', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});
