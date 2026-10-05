/**
 * Tests de la primera skill del plugin: `skills/task-workflow/SKILL.md`.
 *
 * Dos bloques, con motivos distintos:
 *
 * 1. ESTRUCTURALES. Replican a proposito las reglas que el validador
 *    oficial aplica, para que la red de regresion exista tambien donde
 *    `claude` no esta instalado (el CI de Linux). Un test que solo se
 *    salta no protege de nada.
 *
 * 2. DE INTEGRACION. Ejecutan el validador real. La comprobacion de mas
 *    valor no es "valida", sino la CONTRAPRUEBA: sobre una copia
 *    temporal del plugin se rompe el frontmatter del SKILL.md a
 *    proposito y se comprueba que el validador **falla nombrando ese
 *    fichero**. El silencio de un validador que pasa es ambiguo entre
 *    "la encontro y esta bien" y "nunca la busco"; romperla desambigua.
 *    Si no mirase esa ruta, romperla no cambiaria nada.
 *
 * Cero dependencias: se reutiliza `parseFrontmatter` de src/core/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/core/frontmatter.js';
import { assertTransitionAllowed, StateMachineError } from '../../src/core/state-machine.js';
import { TASK_COMPLEXITIES, type Task, type TaskComplexity } from '../../src/core/task.js';
import { ROLES_BRAINSTORM } from '../../src/core/roles-brainstorm.js';
import {
  nombrePeticionRol,
  nombreSalidaRol,
  nombrePeticionUnificador,
} from '../../src/core/plan-brainstorm.js';
import { BRAINSTORM_DIRNAME, PLANIFICACION_DIRNAME } from '../../src/commands/plan.js';

// --- Localizacion del plugin -------------------------------------------
//
// Compilado, este fichero vive en dist/test/skills/. Tres niveles
// arriba esta la raiz del plugin. Se hace el mismo truco que
// src/fs/gitflow-runner.ts, en vez de depender del cwd de npm.

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');

const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
const SKILL_DIR_NAME = 'task-workflow';
const SKILL_DIR = path.join(SKILLS_DIR, SKILL_DIR_NAME);
const SKILL_FILE_NAME = 'SKILL.md';
const SKILL_PATH = path.join(SKILL_DIR, SKILL_FILE_NAME);
const PLUGIN_JSON = path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');

/** Claves que acepta el spec portable de Agent Skills. Nada mas. */
const CLAVES_PERMITIDAS = new Set([
  'name',
  'description',
  'license',
  'allowed-tools',
  'metadata',
  'compatibility',
]);

const MAX_LINEAS_CUERPO = 500;
const MAX_LONGITUD_NAME = 64;
const MAX_LONGITUD_DESCRIPTION = 1024;

const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);

/** Nombres de directorio de componentes: van en la raiz, nunca dentro
 *  de .claude-plugin/. */
const DIRS_DE_COMPONENTES = ['skills', 'commands', 'agents', 'hooks'];

/** Rutas absolutas de maquina que no deben viajar en una skill que se
 *  distribuye a otros proyectos. */
const RUTAS_DE_MAQUINA = ['C:\\Users\\', '/Users/', '/home/', '~/'];

async function leerSkillBytes(): Promise<Buffer> {
  return readFile(SKILL_PATH);
}

async function leerSkillTexto(): Promise<string> {
  return readFile(SKILL_PATH, 'utf8');
}

async function existe(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

// Guard de no-vacuidad: si PLUGIN_ROOT apuntase a otro sitio, varios de
// los tests de abajo pasarian sin comprobar nada real.
test('el test apunta de verdad a la raiz del plugin (guard de no-vacuidad)', async () => {
  const pkg = JSON.parse(
    await readFile(path.join(PLUGIN_ROOT, 'package.json'), 'utf8')
  ) as { name?: unknown };
  assert.equal(
    pkg.name,
    'taskcode-plugin',
    `PLUGIN_ROOT resuelto a "${PLUGIN_ROOT}", que no es el plugin`
  );
});

// --- 1. Estructurales ---------------------------------------------------

test('1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas', async () => {
  // Ojo: en Windows el filesystem es case-insensitive, asi que un
  // stat() de la ruta NO demuestra el case. Se comprueba el nombre
  // literal en el listado del directorio, que si lo demuestra.
  const enSkills = await readdir(SKILLS_DIR);
  assert.ok(
    enSkills.includes(SKILL_DIR_NAME),
    `skills/ no contiene el directorio literal "${SKILL_DIR_NAME}": ${enSkills.join(', ')}`
  );

  const enSkill = await readdir(SKILL_DIR);
  assert.ok(
    enSkill.includes(SKILL_FILE_NAME),
    `skills/${SKILL_DIR_NAME}/ no contiene "${SKILL_FILE_NAME}" con ese case exacto: ${enSkill.join(', ')}`
  );
});

test('2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante', async () => {
  const bytes = await leerSkillBytes();

  // El BOM UTF-8 desplaza el "---" y Claude Code deja de ver
  // frontmatter: trata el fichero entero como cuerpo. Fallo silencioso.
  assert.ok(
    !bytes.subarray(0, 3).equals(BOM_UTF8),
    'SKILL.md empieza con BOM UTF-8 (EF BB BF): el frontmatter no se parseara'
  );

  assert.equal(
    bytes[0],
    0x2d,
    `el primer byte de SKILL.md es 0x${(bytes[0] ?? 0).toString(16)}, no un guion`
  );

  const texto = bytes.toString('utf8');
  assert.match(
    texto,
    /^---\r?\n/,
    'SKILL.md no empieza exactamente por "---" seguido de salto de linea'
  );
});

test('3. hay cierre de frontmatter y lo de dentro parsea a objeto', async () => {
  const texto = await leerSkillTexto();
  // parseFrontmatter lanza si no hay linea de cierre "---".
  const { data, body } = parseFrontmatter(texto);
  assert.equal(typeof data, 'object');
  assert.notEqual(data, null);
  assert.equal(typeof body, 'string');
});

test('4. name presente, string y en kebab-case valido', async () => {
  const { data } = parseFrontmatter(await leerSkillTexto());
  const name = data.name;

  assert.equal(typeof name, 'string', 'el frontmatter no tiene "name" como string');
  const n = name as string;

  assert.match(n, /^[a-z0-9-]+$/, `"${n}" no es kebab-case (solo a-z, 0-9 y guiones)`);
  assert.ok(!n.startsWith('-'), `"${n}" empieza por guion`);
  assert.ok(!n.endsWith('-'), `"${n}" acaba en guion`);
  assert.ok(!n.includes('--'), `"${n}" tiene doble guion`);
  assert.ok(
    n.length <= MAX_LONGITUD_NAME,
    `"${n}" tiene ${n.length} caracteres (maximo ${MAX_LONGITUD_NAME})`
  );
});

test('5. name coincide exactamente con el directorio que contiene el SKILL.md', async () => {
  const { data } = parseFrontmatter(await leerSkillTexto());
  // El nombre del directorio se toma del listado real, no de la
  // constante, para que el test siga siendo cierto si el directorio
  // cambia de nombre.
  const enSkills = await readdir(SKILLS_DIR, { withFileTypes: true });
  const dirsConSkill: string[] = [];
  for (const e of enSkills) {
    if (e.isDirectory() && (await existe(path.join(SKILLS_DIR, e.name, SKILL_FILE_NAME)))) {
      dirsConSkill.push(e.name);
    }
  }
  assert.ok(
    dirsConSkill.includes(data.name as string),
    `name="${String(data.name)}" no coincide con ningun directorio de skill: ${dirsConSkill.join(', ')}`
  );
  assert.equal(
    path.basename(path.dirname(SKILL_PATH)),
    data.name,
    `el directorio es "${path.basename(path.dirname(SKILL_PATH))}" pero name es "${String(data.name)}"`
  );
});

test('6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor', async () => {
  const { data } = parseFrontmatter(await leerSkillTexto());
  const description = data.description;

  assert.equal(
    typeof description,
    'string',
    'el frontmatter no tiene "description" como string'
  );
  const d = description as string;

  assert.ok(d.trim().length > 0, 'la description esta vacia');
  assert.ok(
    d.length <= MAX_LONGITUD_DESCRIPTION,
    `la description tiene ${d.length} caracteres (maximo ${MAX_LONGITUD_DESCRIPTION})`
  );
  // El spec portable de Agent Skills los prohibe.
  assert.ok(!d.includes('<'), 'la description contiene el signo de menor');
  assert.ok(!d.includes('>'), 'la description contiene el signo de mayor');

  // El parser del proyecto corta un valor sin comillas en el primer " #"
  // (comentario inline de YAML). Claude Code NO hace eso, asi que una
  // description que contuviera " #" se mediria aqui truncada y las
  // comprobaciones de arriba darian verde sobre un valor que no es el que
  // Claude Code lee. Se compara con la linea cruda para que la divergencia
  // no pueda pasar en silencio.
  const lineaCruda = (await leerSkillTexto())
    .split('\n')
    .find((l) => l.startsWith('description:'));
  assert.ok(lineaCruda !== undefined, 'no hay una linea "description:" en el frontmatter');
  const valorCrudo = lineaCruda.slice('description:'.length).trim();
  assert.equal(
    d,
    valorCrudo,
    'el parser ha truncado la description (¿contiene " #", que YAML lee como comentario?): ' +
      'lo que mide este test no es lo que leeria Claude Code'
  );
});

test('7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida)', async () => {
  const { data } = parseFrontmatter(await leerSkillTexto());
  const claves = Object.keys(data);

  const intrusas = claves.filter((k) => !CLAVES_PERMITIDAS.has(k));
  assert.deepEqual(
    intrusas,
    [],
    `claves fuera del spec portable: ${intrusas.join(', ')} (permitidas: ${[...CLAVES_PERMITIDAS].join(', ')})`
  );

  // Explicito, porque es la trampa concreta: Claude Code ignora
  // "version" pero el empaquetado portable lo rechaza con error duro.
  assert.ok(
    !('version' in data),
    'el frontmatter tiene "version": rompe el empaquetado portable (la version vive en plugin.json)'
  );
});

test('8. el cuerpo no esta vacio y tiene 500 lineas o menos', async () => {
  const { body } = parseFrontmatter(await leerSkillTexto());
  assert.ok(body.trim().length > 0, 'el cuerpo del SKILL.md esta vacio');

  const lineas = body.replace(/\r?\n$/, '').split(/\r?\n/).length;
  assert.ok(
    lineas <= MAX_LINEAS_CUERPO,
    `el cuerpo tiene ${lineas} lineas (maximo ${MAX_LINEAS_CUERPO}): persiste en contexto toda la conversacion`
  );
});

test('9. el cuerpo no contiene rutas absolutas de maquina', async () => {
  const { body } = parseFrontmatter(await leerSkillTexto());
  const encontradas = RUTAS_DE_MAQUINA.filter((r) => body.includes(r));
  assert.deepEqual(
    encontradas,
    [],
    `el cuerpo contiene rutas de maquina: ${encontradas.join(', ')}`
  );
});

test('10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe', async () => {
  const { body } = parseFrontmatter(await leerSkillTexto());

  const destinos: string[] = [];
  const re = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const destino = m[1];
    if (destino !== undefined) destinos.push(destino);
  }

  const relativos = destinos.filter(
    (d) => !/^(?:https?:|mailto:|#)/i.test(d)
  );

  const rotos: string[] = [];
  for (const rel of relativos) {
    const sinAncla = rel.split('#')[0] ?? '';
    if (sinAncla === '') continue; // enlace puramente a un ancla
    const absoluta = path.resolve(SKILL_DIR, sinAncla);
    if (!(await existe(absoluta))) rotos.push(`${rel} -> ${absoluta}`);
  }

  assert.deepEqual(rotos, [], `enlaces relativos rotos: ${rotos.join(' | ')}`);
});

test('11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto', async () => {
  const raw = await readFile(PLUGIN_JSON, 'utf8');
  const manifest = JSON.parse(raw) as Record<string, unknown>;

  assert.equal(typeof manifest, 'object');
  assert.notEqual(manifest, null);

  assert.ok(
    !('bin' in manifest),
    'plugin.json tiene la clave "bin", que no pertenece al manifiesto del plugin'
  );

  // Regresion de TASK-006: declarar commands/skills como objeto impedia
  // cargar el plugin entero.
  for (const clave of ['commands', 'skills']) {
    if (!(clave in manifest)) continue;
    const valor = manifest[clave];
    const esString = typeof valor === 'string';
    const esArrayDeStrings =
      Array.isArray(valor) && valor.every((x) => typeof x === 'string');
    assert.ok(
      esString || esArrayDeStrings,
      `plugin.json: "${clave}" debe ser string o array de strings, no ${
        Array.isArray(valor) ? 'array con elementos no-string' : typeof valor
      }`
    );
  }
});

test('12. no hay directorios de componentes dentro de .claude-plugin/', async () => {
  const dir = path.join(PLUGIN_ROOT, '.claude-plugin');
  const entradas = await readdir(dir, { withFileTypes: true });
  const intrusos = entradas
    .filter((e) => e.isDirectory() && DIRS_DE_COMPONENTES.includes(e.name))
    .map((e) => e.name);

  assert.deepEqual(
    intrusos,
    [],
    `.claude-plugin/ contiene directorios de componentes (${intrusos.join(', ')}): van en la raiz del plugin`
  );
});

// --- 1bis. Coherencia con el CLI que la skill describe ------------------
//
// En un proyecto donde este plugin esta instalado, este SKILL.md es lo
// UNICO que un agente lee sobre el flujo: una afirmacion suya que ha
// dejado de ser cierta no es una errata, es una instruccion equivocada
// CON AUTORIDAD. Los tests de arriba solo miran la forma del fichero, y
// la forma estaba perfecta mientras el cuerpo describia un `plan` que ya
// no existia y eximia del checkpoint humano a dos complejidades que
// llevan tiempo sin estar eximidas.
//
// Estos tres atan las afirmaciones mas caras al codigo que las cumple:
// cambiar el CLI sin volver aqui sale rojo.

/** Una tarea lista para "start" salvo por el checkpoint humano. */
function tareaSinAprobar(complejidad: TaskComplexity): Task {
  return {
    id: 'TASK-000',
    titulo: 'Tarea de prueba',
    tipo: 'feature',
    sprint: 0,
    etiquetas: [],
    complejidad,
    modelo_sugerido: 'sonnet',
    estado: 'en-diseno',
    plan_aprobado: false,
    regla_seleccion_skill: null,
    rama: '',
    asignado_a: null,
    agente_revisor: '',
    skills_recomendados: [],
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-01-01',
    actualizado: '2026-01-01',
    dependencias: [],
  };
}

function capturarStateMachineError(fn: () => void): StateMachineError {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof StateMachineError, `esperaba StateMachineError, llego: ${String(e)}`);
    return e;
  }
  return assert.fail('no lanzo ningun error');
}

const SECCION_BRAINSTORM = '## El brainstorm de la fase de diseno';

/** El texto de una seccion, desde su titulo hasta el siguiente "## ". */
function seccion(body: string, titulo: string): string {
  const ini = body.indexOf(titulo);
  assert.notEqual(ini, -1, `la skill no tiene la seccion "${titulo}"`);
  const resto = body.slice(ini + titulo.length);
  const fin = resto.indexOf('\n## ');
  return fin === -1 ? resto : resto.slice(0, fin);
}

test('15. la precondicion de "start" que documenta la skill es la que aplica el CLI', async () => {
  // (a) El CLI: NINGUNA complejidad se salta el checkpoint humano.
  let mensaje = '';
  for (const complejidad of TASK_COMPLEXITIES) {
    const e = capturarStateMachineError(() =>
      assertTransitionAllowed('start', tareaSinAprobar(complejidad))
    );
    assert.equal(
      e.comandoRequerido,
      'taskctl approve',
      `"start" sobre una tarea "${complejidad}" sin aprobar no remite a approve`
    );
    mensaje = e.message;
  }

  // (b) La skill dice lo mismo, y con las palabras del propio error. Si
  //     algun dia se reabre la exencion por complejidad, o cambia la
  //     regla, esto obliga a pasar por aqui en vez de dejar la skill
  //     prometiendo un atajo que el CLI no da.
  const FRAGMENTO = 'obligatorio para todas las complejidades';
  assert.ok(
    mensaje.includes(FRAGMENTO),
    `el error de "start" ya no dice "${FRAGMENTO}": ${mensaje}`
  );
  // El cuerpo va plegado a 80 columnas, asi que la frase puede partirse
  // en dos lineas: se compara con los espacios colapsados o el test
  // fallaria por donde cae el salto de linea, que no es lo que mide.
  const { body } = parseFrontmatter(await leerSkillTexto());
  assert.ok(
    body.replace(/\s+/g, ' ').includes(FRAGMENTO),
    `la skill no dice que el checkpoint humano es "${FRAGMENTO}"`
  );
});

test('16. los ficheros de brainstorm que documenta la skill son los que escribe "plan"', async () => {
  const { body } = parseFrontmatter(await leerSkillTexto());
  const texto = seccion(body, SECCION_BRAINSTORM);

  const rol = ROLES_BRAINSTORM[0];
  assert.ok(rol !== undefined, 'no hay ningun rol de brainstorm definido');

  // De un nombre real a la forma con la que la skill lo documenta: el
  // rol y la ronda son variables, el resto del nombre no.
  const documentar = (nombre: string): string =>
    nombre.replace(rol.titulo, '<rol>').replace(/-1\.md$/, '-<ronda>.md');

  const esperados = [
    `${PLANIFICACION_DIRNAME}/${BRAINSTORM_DIRNAME}/`,
    documentar(nombrePeticionRol(rol, 1)),
    documentar(nombreSalidaRol(rol, 1)),
    documentar(nombrePeticionUnificador(1)),
  ];

  const ausentes = esperados.filter((e) => !texto.includes(e));
  assert.deepEqual(
    ausentes,
    [],
    `la seccion del brainstorm no nombra lo que "plan" escribe de verdad: ${ausentes.join(', ')}`
  );
});

test('17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI', async () => {
  const { body } = parseFrontmatter(await leerSkillTexto());
  const texto = seccion(body, SECCION_BRAINSTORM);

  // El orden importa: es el que decide QUE roles entran cuando la
  // complejidad no da para los cuatro. Una skill que los liste en otro
  // orden hace creer que con un solo rol entra el que no entra.
  let previa = -1;
  const ausentes: string[] = [];
  const desordenados: string[] = [];
  for (const rol of ROLES_BRAINSTORM) {
    const pos = texto.indexOf(rol.titulo);
    if (pos === -1) {
      ausentes.push(rol.titulo);
      continue;
    }
    if (pos < previa) desordenados.push(rol.titulo);
    previa = pos;
  }

  assert.deepEqual(ausentes, [], `la skill no nombra estos roles: ${ausentes.join(', ')}`);
  assert.deepEqual(
    desordenados,
    [],
    `estos roles aparecen fuera del orden de prioridad: ${desordenados.join(', ')}`
  );
});

// --- 1ter. Una skill ligera y sus referencias bajo demanda (TASK-048) -----
//
// El cuerpo de SKILL.md se carga entero cada vez que la skill se invoca, y
// la description de cada skill en TODAS las sesiones. Lo que solo hace falta
// en un momento concreto (prerrequisitos, cierre, revision, trampas) vive en
// ficheros hermanos que SKILL.md enlaza diciendo cuando leerlos. Estos tests
// impiden que el cuerpo vuelva a engordar, que un enlace a una referencia se
// rompa y que una referencia nueva arrastre marcas de este repo.

/** 15 KB: por encima, la skill vuelve a pesar lo que pesaba antes de partirla. */
const MAX_BYTES_SKILL = 15360;

/** La description se carga en todas las sesiones, se use la skill o no. */
const MAX_DESCRIPTION_CORTA = 300;

/** Directorios de skill del plugin, del listado real. */
async function dirsDeSkill(): Promise<string[]> {
  const entradas = await readdir(SKILLS_DIR, { withFileTypes: true });
  const dirs: string[] = [];
  for (const e of entradas) {
    if (e.isDirectory() && (await existe(path.join(SKILLS_DIR, e.name, SKILL_FILE_NAME)))) {
      dirs.push(e.name);
    }
  }
  return dirs;
}

/** Los .md de task-workflow: SKILL.md y sus referencias hermanas. */
async function mdsDeTaskWorkflow(): Promise<string[]> {
  return (await readdir(SKILL_DIR)).filter((f) => f.endsWith('.md')).map((f) => path.join(SKILL_DIR, f));
}

/** Destinos relativos a un .md de los enlaces markdown de un texto. */
function enlacesRelativosAMd(texto: string): string[] {
  const destinos: string[] = [];
  const re = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    const destino = (m[1] ?? '').split('#')[0] ?? '';
    if (destino === '' || /^(?:https?:|mailto:)/i.test(destino)) continue;
    if (destino.endsWith('.md')) destinos.push(destino);
  }
  return destinos;
}

test('18. task-workflow/SKILL.md pesa menos de 15 KB', async () => {
  const bytes = (await leerSkillBytes()).length;
  assert.ok(
    bytes < MAX_BYTES_SKILL,
    `SKILL.md pesa ${bytes} bytes (limite ${MAX_BYTES_SKILL}): lo que solo se lee en un momento ` +
      'concreto va a un fichero hermano enlazado desde el cuerpo, no al cuerpo'
  );
});

test('19. toda skill del plugin tiene una description de 300 caracteres o menos', async () => {
  const dirs = await dirsDeSkill();
  // Guard de no-vacuidad: task-workflow, las cuatro revisoras y las fases.
  assert.ok(dirs.length >= 12, `solo se encontraron ${dirs.length} skills: ${dirs.join(', ')}`);
  const largas: string[] = [];
  for (const dir of dirs) {
    const { data } = parseFrontmatter(await readFile(path.join(SKILLS_DIR, dir, SKILL_FILE_NAME), 'utf8'));
    const d = data.description;
    assert.equal(typeof d, 'string', `${dir}: sin description`);
    if ((d as string).length > MAX_DESCRIPTION_CORTA) largas.push(`${dir} (${(d as string).length})`);
  }
  assert.deepEqual(largas, [], `descriptions de mas de ${MAX_DESCRIPTION_CORTA} caracteres: ${largas.join(', ')}`);
});

test('20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe', async () => {
  const origenes = [
    ...(await dirsDeSkill()).map((d) => path.join(SKILLS_DIR, d, SKILL_FILE_NAME)),
    ...(await mdsDeTaskWorkflow()).filter((f) => path.basename(f) !== SKILL_FILE_NAME),
  ];
  let comprobados = 0;
  const rotos: string[] = [];
  for (const origen of origenes) {
    for (const rel of enlacesRelativosAMd(await readFile(origen, 'utf8'))) {
      comprobados++;
      const absoluta = path.resolve(path.dirname(origen), rel);
      if (!(await existe(absoluta))) rotos.push(`${path.relative(SKILLS_DIR, origen)} -> ${rel}`);
    }
  }
  // Guard de no-vacuidad: SKILL.md enlaza al menos sus seis referencias y
  // cada revisora la suya. Si el patron dejara de casar, esto saldria verde.
  assert.ok(comprobados >= 10, `solo se comprobaron ${comprobados} enlaces: el patron no casa`);
  assert.deepEqual(rotos, [], `enlaces a .md rotos: ${rotos.join(' | ')}`);
});

test('20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana', async () => {
  const body = parseFrontmatter(await leerSkillTexto()).body;
  const enlazadas = new Set(enlacesRelativosAMd(body));
  const hermanas = (await mdsDeTaskWorkflow()).map((f) => path.basename(f)).filter((f) => f !== SKILL_FILE_NAME);
  for (const esperada of ['prerrequisitos.md', 'cierre.md', 'trampas.md', 'revision.md']) {
    assert.ok(hermanas.includes(esperada), `falta la referencia ${esperada}`);
  }
  const huerfanas = hermanas.filter((h) => !enlazadas.has(h));
  assert.deepEqual(huerfanas, [], `referencias que SKILL.md no enlaza (nadie las leeria): ${huerfanas.join(', ')}`);
});

/**
 * Marcas de ESTE repo para los .md de task-workflow. Es la lista de las
 * skills de fase y no la estricta de las revisoras, a proposito: esta skill
 * SI nombra `tareas/`, `plan-final.md`, `taskctl` y los ficheros que el
 * plugin escribe en el proyecto del usuario. Lo que puede contener
 * "taskcode" esta acotado en `PERMITIDO_CON_TASKCODE`.
 */
const MARCAS_DEL_REPO = [
  'taskcode',
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
  'informetemplate',
  'src/commands/',
  'src/core/',
];

/**
 * Lo unico que puede llevar "taskcode": el prefijo con que se invocan las
 * skills, la carpeta de configuracion y la del registro de Git-Flow (los
 * dos se crean en el proyecto del usuario).
 */
const PERMITIDO_CON_TASKCODE = ['taskcode-plugin', '.taskcode/', 'taskcode/gitflow'];

/** Documentos que el plugin si escribe o pone de ejemplo en el proyecto del usuario. */
const DOCUMENTOS_DEL_USUARIO = ['docs/BOARD.md', 'docs/PLAN.md'];
const DOCUMENTO_INTERNO = /docs\/[A-Z_]+\.md/;

test('21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina', async () => {
  const ficheros = await mdsDeTaskWorkflow();
  assert.ok(ficheros.length >= 7, `solo hay ${ficheros.length} .md en task-workflow`);
  for (const fichero of ficheros) {
    const nombre = path.basename(fichero);
    const texto = await readFile(fichero, 'utf8');
    let minusculas = texto.toLowerCase();
    for (const p of PERMITIDO_CON_TASKCODE) minusculas = minusculas.split(p).join('');
    const marcas = MARCAS_DEL_REPO.filter((m) => minusculas.includes(m));
    assert.deepEqual(marcas, [], `${nombre}: marcas de este repo, que no significan nada donde se instala`);

    let sinDocsDelUsuario = texto;
    for (const d of DOCUMENTOS_DEL_USUARIO) sinDocsDelUsuario = sinDocsDelUsuario.split(d).join('');
    const doc = DOCUMENTO_INTERNO.exec(sinDocsDelUsuario);
    assert.equal(doc, null, `${nombre}: nombra el documento interno "${doc?.[0]}"`);

    for (const ruta of RUTAS_DE_MAQUINA) {
      assert.ok(!texto.includes(ruta), `${nombre}: contiene la ruta de maquina "${ruta}"`);
    }
  }
});

// --- 2. De integracion: el validador oficial ----------------------------

interface ResultadoValidate {
  status: number | null;
  salida: string;
}

function claudeDisponible(): boolean {
  try {
    const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
    return r.status === 0;
  } catch {
    return false;
  }
}

function validar(ruta: string): ResultadoValidate {
  const r = spawnSync('claude', ['plugin', 'validate', ruta], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

// Skip explicito y visible: en el CI de Linux `claude` no esta
// instalado, y un test que pasa en falso es peor que uno que no corre.
const SKIP_INTEGRACION: false | string = claudeDisponible()
  ? false
  : 'el binario "claude" no esta en el PATH: la comprobacion empirica no se puede hacer aqui';

const CRUZ = '\u2718';

test(
  '13. `claude plugin validate` sobre el plugin real sale 0',
  { skip: SKIP_INTEGRACION },
  () => {
    const { status, salida } = validar(PLUGIN_ROOT);
    assert.equal(status, 0, `exit ${String(status)}. Salida:\n${salida}`);
    assert.ok(!salida.includes(CRUZ), `la salida reporta errores:\n${salida}`);
  }
);

test(
  '14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo',
  { skip: SKIP_INTEGRACION },
  async (t) => {
    // Se trabaja SIEMPRE sobre una copia fuera del repo. El fichero real
    // no se toca: romperlo aunque fuera un instante dejaria el workspace
    // sucio si el test peta a mitad.
    const tmp = await mkdtemp(path.join(tmpdir(), 'taskcode-skill-'));
    t.after(async () => {
      await rm(tmp, { recursive: true, force: true });
    });

    // Solo lo que el validador necesita: el manifiesto y el arbol de
    // skills. Nada de node_modules ni dist.
    await cp(
      path.join(PLUGIN_ROOT, '.claude-plugin'),
      path.join(tmp, '.claude-plugin'),
      { recursive: true }
    );
    await cp(SKILLS_DIR, path.join(tmp, 'skills'), { recursive: true });

    const copiaSkill = path.join(tmp, 'skills', SKILL_DIR_NAME, SKILL_FILE_NAME);

    // (a) La copia intacta valida limpio. Si no, lo que falle despues no
    //     se puede atribuir a la mutacion.
    const intacta = validar(tmp);
    assert.equal(
      intacta.status,
      0,
      `la copia intacta no valida (exit ${String(intacta.status)}):\n${intacta.salida}`
    );
    assert.ok(
      !intacta.salida.includes(CRUZ),
      `la copia intacta reporta errores:\n${intacta.salida}`
    );

    // (b) Se rompe el YAML del frontmatter de la COPIA: comillas sin
    //     cerrar en la linea de description.
    const original = await readFile(copiaSkill, 'utf8');
    const roto = original.replace(
      /^description:.*$/m,
      'description: "sin cerrar la comilla'
    );
    assert.notEqual(roto, original, 'no se encontro la linea "description:" que romper');
    await writeFile(copiaSkill, roto, 'utf8');

    const rota = validar(tmp);

    // Si el validador no mirase esta ruta, romper el fichero no
    // cambiaria nada y esto seguiria saliendo 0. Que falle ES la
    // evidencia de que Claude Code descubre la skill donde la pusimos.
    assert.notEqual(
      rota.status,
      0,
      `romper el frontmatter no hizo fallar al validador: no esta mirando esa ruta.\n${rota.salida}`
    );
    assert.match(
      rota.salida,
      /Validating skill:/,
      `el validador fallo pero no nombro ninguna skill:\n${rota.salida}`
    );
    assert.match(
      rota.salida,
      /Validating skill:.*SKILL\.md/,
      `la linea "Validating skill:" no apunta al SKILL.md:\n${rota.salida}`
    );
    assert.ok(
      rota.salida.includes(SKILL_DIR_NAME),
      `la salida no menciona el directorio "${SKILL_DIR_NAME}":\n${rota.salida}`
    );
  }
);
