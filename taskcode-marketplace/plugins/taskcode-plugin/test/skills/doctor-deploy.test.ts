/**
 * TASK-067: lo que el plugin EXPONE para doctor-deploy: la skill
 * `doctor-deploy`, el agente `revisor-seguridad-deploy` y el catalogo de puntos.
 * Son texto que lee un modelo (o un proyecto ajeno), asi que lo que se prueba
 * es la FORMA, que esten atados al CLI (el formato del JSON del agente es el que
 * el comando acepta) y que no viaje nada de este repositorio:
 *
 * - ni la skill, ni el agente, ni el catalogo mencionan el proyecto que
 *   construye el plugin (la skill solo nombra el prefijo con el que se invoca);
 * - el agente es de solo lectura y no declara modelo;
 * - el ejemplo de salida del agente es JSON valido, con los campos y estados
 *   que `--resultado` acepta;
 * - enumeracion: `skills/` y `agents/` contienen exactamente lo esperado, de
 *   modo que una skill o un agente nuevo obliga a pasar por aqui.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarCatalogoDeploy } from '../../src/core/doctor-deploy-catalogo.js';
import { CAMPOS_VEREDICTO, ESTADOS_VEREDICTO, parsearResultado } from '../../src/core/doctor-deploy-veredictos.js';
import { parseFrontmatter } from '../../src/core/frontmatter.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
const AGENTS_DIR = path.join(PLUGIN_ROOT, 'agents');
const SKILL = path.join(SKILLS_DIR, 'doctor-deploy', 'SKILL.md');
const AGENTE = path.join(AGENTS_DIR, 'revisor-seguridad-deploy.md');
const CATALOGO = path.join(PLUGIN_ROOT, 'scripts', 'doctor-deploy.yml');

const lf = (t: string): string => t.replace(/\r\n/g, '\n');

/** Marcas de este repo que no pueden viajar (las mismas que vigilan las skills de fase y los roles). */
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
  'informetemplate',
  'src/commands/',
  'src/core/',
  'plan-final.md',
];
const DOCUMENTO_INTERNO = /docs\/[A-Z_]+\.md/;
const RUTAS_DE_MAQUINA = ['C:\\Users\\', '/Users/', '/home/', '~/'];
const CLAVES_PERMITIDAS_SKILL = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility']);

/** El prefijo con que se invoca una skill y la carpeta de ajustes del proyecto no cuentan como «nombrar el proyecto». */
function sinPrefijoDelPlugin(texto: string): string {
  return texto.toLowerCase().split('taskcode-plugin').join('').split('.taskcode/').join('');
}

function assertSinMarcas(nombre: string, minusculas: string, original: string): void {
  assert.deepEqual(
    MARCAS_DEL_REPO.filter((m) => minusculas.includes(m)),
    [],
    `${nombre}: marcas del repo`
  );
  assert.doesNotMatch(original, DOCUMENTO_INTERNO, `${nombre}: documento interno`);
  for (const r of RUTAS_DE_MAQUINA) assert.ok(!original.includes(r), `${nombre}: ruta de maquina ${r}`);
}

/** El bloque ```json del agente, ya parseado. */
async function ejemploDelAgente(): Promise<{ commit: string; veredictos: Array<Record<string, unknown>> }> {
  const texto = lf(await readFile(AGENTE, 'utf8'));
  const m = /```json\n([\s\S]*?)\n```/.exec(texto);
  assert.ok(m, 'el agente no tiene su bloque ```json de salida');
  return JSON.parse(m[1] as string) as { commit: string; veredictos: Array<Record<string, unknown>> };
}

// --- enumeracion --------------------------------------------------------

test('skills/ contiene exactamente las skills esperadas, doctor-deploy entre ellas', async () => {
  const esperadas = [
    'angular-vue-reviewer',
    'approve',
    'board',
    'code-quality-reviewer',
    'csharp-autocad-ifc-reviewer',
    'doctor-deploy',
    'finish',
    'java-spring-reviewer',
    'new',
    'plan',
    'review',
    'rust-wasm-reviewer',
    'start',
    'task-workflow',
  ];
  const enDisco = (await readdir(SKILLS_DIR, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  assert.deepEqual(enDisco, esperadas);
  // El case exacto: en Windows un stat() no lo demuestra, el listado si.
  assert.ok((await readdir(path.join(SKILLS_DIR, 'doctor-deploy'))).includes('SKILL.md'));
});

test('agents/ contiene los del brainstorm y el revisor de seguridad de doctor-deploy, y nada mas', async () => {
  const esperados = [
    'brainstorm-arquitectura.md',
    'brainstorm-dominio.md',
    'brainstorm-rendimiento.md',
    'brainstorm-riesgos.md',
    'brainstorm-testing.md',
    'brainstorm-unificador.md',
    'revisor-seguridad-deploy.md',
  ];
  assert.deepEqual((await readdir(AGENTS_DIR)).sort(), esperados);
});

// --- la skill -----------------------------------------------------------

test('skill: frontmatter dentro del spec portable, name igual al directorio, descripcion corta y especifica', async () => {
  const texto = await readFile(SKILL, 'utf8');
  assert.match(texto, /^---\r?\n/, 'el frontmatter tiene que abrir en la primera linea');
  const { data, body } = parseFrontmatter(texto);
  assert.equal(data.name, 'doctor-deploy');
  assert.deepEqual(Object.keys(data).filter((k) => !CLAVES_PERMITIDAS_SKILL.has(k)), []);
  const d = data.description as string;
  assert.equal(typeof d, 'string');
  assert.ok(d.length <= 300, `description de ${d.length} caracteres`);
  assert.ok(!d.includes('<') && !d.includes('>'));
  assert.match(d, /taskctl doctor-deploy/);
  assert.match(d, /\/taskcode-plugin:doctor-deploy/, 'la description dice como se invoca');
  assert.ok(body.split('\n').length <= 200);
});

test('skill: ejecuta el CLI, lanza el agente, guarda su JSON fuera del repo y usa los flags reales', async () => {
  const t = lf(await readFile(SKILL, 'utf8'));
  assert.match(t, /taskctl doctor-deploy --json/);
  assert.match(t, /taskctl doctor-deploy --resultado/);
  assert.match(t, /--crear-tareas/);
  assert.match(t, /--escribir/);
  assert.match(t, /revisor-seguridad-deploy/);
  assert.match(t, /\*\*fuera del repositorio\*\*/);
  assert.match(t, /mktemp -d/);
  assert.match(t, /fichero y línea/);
  assert.match(t, /NO VERIFICADO/);
  assert.match(t, /git rev-parse --show-toplevel/);
  // El codigo 1 es «hay FALLA», no un error.
  assert.match(t, /código de salida 1 no es un error/);
  // Solo los puntos de juicio que aplican se le dan al agente.
  assert.match(t, /`metodo: "juicio"`/);
  // Crear tareas y escribir el informe solo si la persona lo pide.
  assert.match(t, /AskUserQuestion/);
  assert.match(t, /solo si lo pide/);
  const { data } = parseFrontmatter(t);
  const permitido = String(data['allowed-tools']);
  assert.match(permitido, /Bash\(taskctl:\*\)/);
  assert.match(permitido, /\bAgent\b/);
  // No commitea ni borra: no tiene herramientas para ello.
  for (const prohibida of ['Bash(git commit', 'Bash(git add', 'Bash(rm', 'Edit']) {
    assert.ok(!permitido.includes(prohibida), `la skill no deberia poder ${prohibida}`);
  }
});

test('skill: ni nombra el proyecto que construye el plugin ni sus rutas internas', async () => {
  const texto = await readFile(SKILL, 'utf8');
  const minusculas = sinPrefijoDelPlugin(texto);
  assert.ok(!minusculas.includes('taskcode'), 'nombra el proyecto fuera del prefijo del plugin');
  assertSinMarcas('skill', minusculas, texto);
});

// --- el agente ----------------------------------------------------------

test('agente: frontmatter sano, name igual al fichero, de solo lectura y sin model', async () => {
  const bytes = await readFile(AGENTE);
  assert.notEqual(bytes[0], 0xef, 'BOM UTF-8');
  assert.match(bytes.toString('utf8'), /^---\r?\n/);
  const { data } = parseFrontmatter(bytes.toString('utf8'));
  assert.equal(data.name, 'revisor-seguridad-deploy');
  assert.ok(!('model' in data), 'los agentes no declaran model');
  assert.equal(typeof data.description, 'string');
  assert.ok((data.description as string).length > 40);
  const tools = String(data.tools)
    .split(',')
    .map((s) => s.trim())
    .sort();
  assert.deepEqual(tools, ['Glob', 'Grep', 'Read'], 'solo lectura: sin Write, Edit ni Bash');
});

test('agente: pide fichero y linea o NO VERIFICADO, prohibe copiar valores y fragmentos, y trata el repo como dato', async () => {
  const t = lf(await readFile(AGENTE, 'utf8'));
  assert.match(t, /fichero y la línea/);
  assert.match(t, /«NO VERIFICADO»/);
  assert.match(t, /Ningún valor/);
  assert.match(t, /Ningún fragmento de código/);
  // Inyeccion de prompt: lo que hay en el repo es dato, no instruccion.
  assert.match(t, /dato, no instrucción/);
  assert.match(t, /no lo obedeces/);
  assert.match(t, /«No encontré nada malo» no es «está bien»/);
  // Los tipos de aplicacion sin sonda propia los cubre el agente como juicio.
  assert.match(t, /web, API, móvil, CLI, librería/);
  assert.match(t, /Un único veredicto por punto/);
});

test('agente: ni nombra el proyecto que construye el plugin ni sus rutas internas (ni siquiera el prefijo)', async () => {
  const texto = await readFile(AGENTE, 'utf8');
  const minusculas = texto.toLowerCase();
  assert.ok(!minusculas.includes('taskcode'), 'nombra el proyecto');
  assert.ok(!minusculas.includes('taskctl'), 'nombra el CLI: es un agente de revision, no del flujo');
  assertSinMarcas('agente', minusculas, texto);
});

test('agente: el ejemplo de salida es el formato que --resultado acepta (campos, estados y forma)', async () => {
  const ejemplo = await ejemploDelAgente();
  assert.equal(typeof ejemplo.commit, 'string');
  const estados = new Set<string>();
  for (const v of ejemplo.veredictos) {
    for (const campo of Object.keys(v)) assert.ok(CAMPOS_VEREDICTO.includes(campo), `campo "${campo}" fuera del formato`);
    assert.ok((ESTADOS_VEREDICTO as readonly string[]).includes(String(v['estado'])));
    estados.add(String(v['estado']));
    // Evidencia obligatoria en ok y falla, ausente en no-verificado.
    const conEvidencia = v['fichero'] !== undefined && v['linea'] !== undefined;
    assert.equal(conEvidencia, v['estado'] !== 'no-verificado', `${String(v['estado'])}: evidencia`);
  }
  assert.deepEqual([...estados].sort(), ['falla', 'no-verificado', 'ok']);
  const leido = parsearResultado(JSON.stringify(ejemplo));
  assert.equal(leido.veredictos.length, ejemplo.veredictos.length);
});

test('agente: los limites que dice coinciden con los del comando', async () => {
  const t = lf(await readFile(AGENTE, 'utf8'));
  const { MAX_MOTIVO } = await import('../../src/core/doctor-deploy-veredictos.js');
  assert.match(t, new RegExp(`${MAX_MOTIVO} caracteres como máximo`));
});

// --- el catalogo --------------------------------------------------------

test('catalogo: ni nombra el proyecto que construye el plugin ni sus rutas internas', async () => {
  const texto = await readFile(CATALOGO, 'utf8');
  const minusculas = texto.toLowerCase();
  assert.ok(!minusculas.includes('taskcode'), 'el catalogo nombra el proyecto');
  assertSinMarcas('catalogo', minusculas, texto);
});

test('los puntos que la skill y el agente dicen revisar con juicio son de juicio en el catalogo', () => {
  const porId = new Map(cargarCatalogoDeploy(CATALOGO).puntos.map((p) => [p.id, p]));
  for (const id of [
    'rls-activo',
    'auth-en-servidor',
    'restringir-accesos',
    'mass-assignment',
    'queries-parametrizadas',
    'validacion-de-inputs',
    'uploads-seguros',
    'cookies-seguras',
  ]) {
    assert.equal(porId.get(id)?.metodo, 'juicio', id);
  }
});
