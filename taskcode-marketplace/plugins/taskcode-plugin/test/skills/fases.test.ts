/**
 * Las skills de fase (TASK-057): una por fase del ciclo, invocables como
 * `/taskcode-plugin:<fase> TASK-NNN`. Son markdown que lee un modelo, asi que
 * lo que se puede probar aqui es su FORMA y que esten atadas al CLI:
 *
 * - frontmatter dentro del spec portable, `name` = directorio, descripcion
 *   corta y especifica (que no se dispare con cualquier «plan» suelto);
 * - cada skill nombra su subcomando de taskctl, `taskctl siguiente` y la
 *   seccion compartida de avance;
 * - la seccion de avance asigna una skill que existe a CADA fase que puede
 *   devolver `siguiente` (la lista sale del codigo: una fase nueva sin
 *   asignar pone esto rojo);
 * - no mencionan rutas ni documentos internos del repo que las construye.
 *
 * Que Claude Code las encadene de verdad solo se ve en una sesion real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/core/frontmatter.js';
import { FASES_SIGUIENTE } from '../../src/core/flujo.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
const AVANCE = path.join(SKILLS_DIR, 'task-workflow', 'avance.md');

/** Cada skill de fase y el subcomando de taskctl que tiene que ejecutar. */
const FASES: Record<string, string> = {
  new: 'taskctl new',
  board: 'taskctl board',
  plan: 'taskctl plan',
  approve: 'taskctl approve',
  start: 'taskctl start',
  review: 'taskctl review',
  finish: 'taskctl finish',
};

/** Mismas claves que admite el spec portable (ver task-workflow.test.ts). */
const CLAVES_PERMITIDAS = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility']);

const MAX_DESCRIPTION = 300;
const MAX_LINEAS = 200;

/**
 * Marcas de ESTE repo que no pueden viajar en una skill que se instala en
 * otros proyectos. Es otra lista que la de los revisores y los roles, a
 * proposito: estas skills SI nombran `taskctl`, `tareas/` y `plan-final.md`
 * (son la interfaz y los ficheros que el plugin crea en el proyecto del
 * usuario), y `taskcode-plugin` (el prefijo con el que se invocan).
 */
const MARCAS_DEL_REPO = [
  'docs/contexto',
  'propuesta_metodologia',
  'checklist_terminacion',
  'plan_sprints',
  'hallazgos.md',
  'task-0',
  'ieca',
  'movetareafile',
  'printclierror',
  'veredictoaprobado',
  'src/commands/',
  'src/core/',
];
const DOCUMENTO_INTERNO = /docs\/[A-Z_]+\.md/;
const RUTAS_DE_MAQUINA = ['C:\\Users\\', '/Users/', '/home/', '~/'];

async function existe(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lo que SI puede nombrar "taskcode": el prefijo con que se invocan las skills
 * y la carpeta de configuracion que el plugin lee en el proyecto del usuario.
 */
/** Los .md no tienen eol fijado: en un checkout de Windows salen en CRLF. */
function lf(texto: string): string {
  return texto.replace(/\r\n/g, '\n');
}

function sinPrefijoDelPlugin(texto: string): string {
  return texto.toLowerCase().split('taskcode-plugin').join('').split('.taskcode/').join('');
}

test('las siete skills de fase existen, con frontmatter portable y name igual al directorio', async () => {
  for (const fase of Object.keys(FASES)) {
    const ruta = path.join(SKILLS_DIR, fase, 'SKILL.md');
    assert.ok(await existe(ruta), `falta ${ruta}`);
    const texto = await readFile(ruta, 'utf8');
    // \r?\n: los .md no tienen eol fijado y un checkout de Windows los deja en CRLF.
    assert.match(texto, /^---\r?\n/, `${fase}: el frontmatter tiene que abrir en la primera linea`);
    const { data, body } = parseFrontmatter(texto);
    assert.equal(data.name, fase, `${fase}: name tiene que ser el nombre del directorio`);
    const intrusas = Object.keys(data).filter((k) => !CLAVES_PERMITIDAS.has(k));
    assert.deepEqual(intrusas, [], `${fase}: claves fuera del spec portable`);
    assert.ok(body.trim().length > 0, `${fase}: cuerpo vacio`);
    assert.ok(body.split('\n').length <= MAX_LINEAS, `${fase}: mas de ${MAX_LINEAS} lineas`);
  }
});

test('la descripcion de cada fase es corta, sin < ni >, y especifica del flujo (no se dispara con un «plan» suelto)', async () => {
  for (const fase of Object.keys(FASES)) {
    const { data } = parseFrontmatter(await readFile(path.join(SKILLS_DIR, fase, 'SKILL.md'), 'utf8'));
    const d = data.description;
    assert.equal(typeof d, 'string', `${fase}: sin description`);
    const desc = d as string;
    assert.ok(desc.length <= MAX_DESCRIPTION, `${fase}: description de ${desc.length} caracteres`);
    assert.ok(!desc.includes('<') && !desc.includes('>'), `${fase}: < o > en la description`);
    assert.match(desc, /taskctl/, `${fase}: la description tiene que nombrar taskctl`);
    assert.match(desc, new RegExp(`/taskcode-plugin:${fase}`), `${fase}: la description dice como se invoca`);
  }
});

test('cada skill de fase nombra su subcomando de taskctl, taskctl siguiente y la seccion de avance', async () => {
  for (const [fase, subcomando] of Object.entries(FASES)) {
    const texto = await readFile(path.join(SKILLS_DIR, fase, 'SKILL.md'), 'utf8');
    assert.ok(texto.includes(subcomando), `${fase}: no nombra "${subcomando}"`);
    // board solo lee: consulta siguiente solo si le pasan un ID, pero lo nombra igual.
    assert.ok(texto.includes('taskctl siguiente'), `${fase}: no termina con taskctl siguiente`);
    assert.ok(texto.includes('task-workflow/avance.md'), `${fase}: no remite a la seccion de avance`);
    assert.ok(texto.includes('git rev-parse --show-toplevel'), `${fase}: no se situa en la raiz del repo`);
  }
});

/**
 * Que skill atiende cada fase de `siguiente` (MEN-5 de la revision: sin el
 * mapa fijo, asignar una fase a la skill equivocada no ponia nada rojo).
 * Tiene que cubrir FASES_SIGUIENTE entera.
 */
const SKILL_DE_FASE: Record<string, string | null> = {
  plan: 'plan',
  approve: 'approve',
  start: 'start',
  review: 'review',
  veredicto: 'review',
  'codex-review': 'review',
  'veredicto-codex': 'review',
  finish: 'finish',
  terminada: null,
};

test('la seccion de avance asigna a CADA fase que puede devolver siguiente la skill que le toca', async () => {
  const avance = await readFile(AVANCE, 'utf8');
  for (const fase of FASES_SIGUIENTE) {
    assert.ok(fase in SKILL_DE_FASE, `la fase "${fase}" no esta en el mapa esperado del test`);
    const fila = avance.split(/\r?\n/).find((l) => l.startsWith(`| \`${fase}\` |`));
    assert.ok(fila, `la fase "${fase}" no tiene fila en avance.md`);
    const esperada = SKILL_DE_FASE[fase] as string | null;
    const skill = /\/taskcode-plugin:([a-z-]+)/.exec(fila);
    if (esperada === null) {
      assert.equal(skill, null, `la fase "${fase}" no deberia remitir a ninguna skill`);
      continue;
    }
    assert.ok(skill, `la fase "${fase}" no nombra ninguna skill`);
    assert.equal(skill[1], esperada, `la fase "${fase}" remite a /taskcode-plugin:${skill[1]}`);
    assert.ok(esperada in FASES, `la skill "${esperada}" no existe`);
  }
  // En manual (detener) no se encadena nada: es el contrato del criterio 3.
  const detener = /\*\*`detener`\*\*[^\n]*(\n {2}[^\n]*)*/.exec(avance);
  assert.ok(detener, 'avance.md no tiene el bloque de detener');
  assert.match(detener[0], /no encadenar nada/, 'detener tiene que decir que no se encadena nada');
  // Las tres acciones de siguiente tienen sus pasos.
  for (const accion of ['detener', 'preguntar', 'continuar']) {
    assert.ok(avance.includes(`**\`${accion}\`**`), `avance.md no dice que hacer con "${accion}"`);
  }
});

test('las skills de fase y la seccion de avance no mencionan rutas ni documentos internos de este repo', async () => {
  const ficheros = [...Object.keys(FASES).map((f) => path.join(SKILLS_DIR, f, 'SKILL.md')), AVANCE];
  for (const ruta of ficheros) {
    const texto = await readFile(ruta, 'utf8');
    const minusculas = sinPrefijoDelPlugin(texto);
    assert.ok(!minusculas.includes('taskcode'), `${ruta}: nombra el proyecto fuera del prefijo del plugin`);
    const marcas = MARCAS_DEL_REPO.filter((m) => minusculas.includes(m));
    assert.deepEqual(marcas, [], `${ruta}: marcas del repo`);
    assert.doesNotMatch(texto, DOCUMENTO_INTERNO, `${ruta}: documento interno`);
    for (const r of RUTAS_DE_MAQUINA) assert.ok(!texto.includes(r), `${ruta}: ruta de maquina ${r}`);
  }
});

test('plan no reabre una ronda al reanudar (IMP-1) y review no relanza Codex en veredicto-codex (IMP-2)', async () => {
  const plan = await readFile(path.join(SKILLS_DIR, 'plan', 'SKILL.md'), 'utf8').then(lf);
  // Mira siguiente ANTES de ejecutar taskctl plan, y con la ronda abierta no lo ejecuta.
  assert.ok(plan.indexOf('taskctl siguiente') < plan.indexOf('taskctl plan TASK-NNN'), 'plan consulta siguiente primero');
  assert.match(plan, /\*\*No ejecutes `taskctl plan`\*\*/);
  assert.match(plan, /## Cambios pedidos por la persona/, 'la re-planificacion lee el feedback escrito');
  const review = await readFile(path.join(SKILLS_DIR, 'review', 'SKILL.md'), 'utf8').then(lf);
  assert.match(review, /`veredicto-codex`: paso 6\. \*\*No ejecutes `codex-review`\*\*/);
  assert.match(review, /lo decide una\s+persona/);
  const approve = await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8').then(lf);
  assert.match(approve, /`## Cambios pedidos por la persona`/, 'approve deja escrito el feedback del no');
  // pausa aborta con la carpeta sucia: primero se commitea el feedback (MEN-7, M3).
  assert.ok(
    approve.indexOf('Commitealo') !== -1 && approve.indexOf('Commitealo') < approve.indexOf('taskctl pausa'),
    'approve commitea el feedback antes de taskctl pausa'
  );

  // Re-planificacion (IMP-3, MEN-6): lanza lo que exista para la ronda (unificador o el rol unico),
  // y la seccion de cambios lleva su estado para que reanudar a medias no abra otra ronda.
  assert.match(plan, /`peticion-unificador-K\.md`/);
  assert.match(plan, /`peticion-plan-K\.md`/);
  assert.match(plan, /\(pendientes, ronda K\)/);
  assert.match(plan, /\(incorporados en la ronda K\)/);
  // MEN-8: la marca se commitea ANTES de abrir la ronda con taskctl plan.
  const sinMarca = /- `## Cambios pedidos por la persona`, sin marca:[\s\S]*?(?=\n {5}- `\(pendientes)/.exec(plan);
  assert.ok(sinMarca, 'plan tiene la vineta de la seccion sin marca');
  assert.ok(
    sinMarca[0].indexOf('(pendientes, ronda K)') < sinMarca[0].indexOf('taskctl plan TASK-NNN'),
    'la marca va antes de taskctl plan'
  );
  // MEN-10: reanudar con la marca pendiente no reabre la ronda si ya existe su peticion,
  // y el caso de un rol lanza el agente del rol, no el unificador.
  const pendiente = /- `\(pendientes, ronda K\)`:[\s\S]*?(?=\n {5}- Sin seccion)/.exec(plan);
  assert.ok(pendiente, 'plan tiene la vineta de la re-planificacion pendiente');
  assert.match(pendiente[0], /\*\*No\s+ejecutes `taskctl plan`\*\*/);
  const unRol = /- `peticion-plan-K\.md`[\s\S]*?(?=\n {3}- )/.exec(plan);
  assert.ok(unRol, 'plan tiene el caso de un rol en la re-planificacion');
  assert.doesNotMatch(unRol[0], /unificador/, 'con un rol no hay unificador');

  // El paso del veredicto de Codex no lanza otra ronda de Codex (MEN-7, M2).
  const paso6 = /6\. \*\*Veredicto de la segunda opinion\*\*[\s\S]*?(?=\n7\. )/.exec(review);
  assert.ok(paso6, 'review tiene el paso del veredicto de la segunda opinion');
  assert.doesNotMatch(paso6[0], /taskctl codex-review/, 'el paso 6 no puede lanzar codex-review');
});

test('semiautomatico (TASK-058): preguntar y continuar encadenan con la herramienta Skill y la cadena bloquea el arbol', async () => {
  const avance = lf(await readFile(AVANCE, 'utf8'));
  const preguntar = /\*\*`preguntar`\*\*[\s\S]*?(?=\n- \*\*`continuar`)/.exec(avance);
  assert.ok(preguntar, 'avance.md describe preguntar');
  assert.match(preguntar[0], /AskUserQuestion/);
  assert.match(preguntar[0], /taskctl pausa/, 'el no queda registrado con pausa');
  assert.match(avance, /\*\*`continuar`\*\*: encadenar la skill siguiente sin preguntar/);
  // La cadena: se abre, viaja con --cadena a la skill siguiente via Skill, y se cierra.
  assert.match(avance, /taskctl cadena abrir TASK-NNN/);
  assert.match(avance, /herramienta Skill/);
  assert.match(avance, /TASK-NNN --cadena <testigo>/);
  assert.match(avance, /taskctl cadena cerrar <testigo>/);
  // En curso no se encadena: falta implementar.
  assert.match(avance, /`review` con la\s+tarea `en-curso`/);
  for (const fase of Object.keys(FASES)) {
    const texto = await readFile(path.join(SKILLS_DIR, fase, 'SKILL.md'), 'utf8');
    assert.ok(texto.includes('taskctl cadena comprobar <testigo>'), `${fase}: no comprueba la cadena recibida`);
    assert.ok(lf(texto).includes('anade `--cadena <testigo>` a cada `taskctl`'), `${fase}: no pasa el testigo a sus taskctl`);
  }
});

test('la cadena se cierra en cada camino de salida: detener, no, error (MEN-1 de la revision de TASK-058)', async () => {
  const avance = lf(await readFile(AVANCE, 'utf8'));
  const detener = /\*\*`detener`\*\*[\s\S]*?(?=\n- \*\*`preguntar`)/.exec(avance);
  assert.ok(detener && /cadena abierta, cerrarla/.test(detener[0]), 'detener cierra la cadena');
  const no = /\*\*No\*\*: ejecutar `taskctl pausa[\s\S]*?(?=\n- \*\*`continuar`)/.exec(avance);
  assert.ok(no && /cerrar la cadena/.test(no[0]), 'el no de preguntar cierra la cadena');
  assert.match(avance, /\*\*Un «no» o un error cierran la cadena\*\*, en este orden/);
  // MEN-2 (r2): el no se registra con la cadena aun abierta; cerrar antes lo haria fallar.
  const ordenNo = /- un «no»:[\s\S]*?(?=\n- un error)/.exec(avance);
  assert.ok(ordenNo, 'avance.md da el orden del no');
  assert.ok(
    ordenNo[0].indexOf('taskctl pausa') < ordenNo[0].indexOf('taskctl cadena cerrar'),
    'primero pausa, despues cerrar'
  );
  assert.match(avance, /- un error de un `taskctl`: `taskctl cadena cerrar <testigo>` y despues\s+muestra el error/);
  assert.match(avance, /el CLI rechaza esos comandos mientras haya una cadena\s+abierta sin su testigo/);
  // El no de approve detiene la cadena sin volver a avance (IMP-4).
  const approve = lf(await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8'));
  assert.match(approve, /cierrala \(`taskctl cadena cerrar <testigo>`\)/);
  assert.match(approve, /\*\*termina aqui\*\*, sin pasar por la seccion de avance/);
});

test('approve es el checkpoint humano: solo aprueba con el si de la persona y registra el no con pausa', async () => {
  const texto = await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8');
  assert.match(texto, /Pregunta a la persona/);
  assert.match(texto, /taskctl pausa/);
});
