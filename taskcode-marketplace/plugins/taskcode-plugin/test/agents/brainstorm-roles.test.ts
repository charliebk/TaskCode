/**
 * Tests de los cuatro roles del brainstorm paralelo: `agents/brainstorm-*.md`.
 *
 * Mismo reparto en dos bloques que test/skills/task-workflow.test.ts, y por
 * los mismos motivos:
 *
 * 1. ESTRUCTURALES. Replican a proposito las reglas que el validador
 *    oficial aplica, mas las que son propias de estos ficheros (que cada
 *    rol declare su contexto y su salida acotada, y que no viajen marcas
 *    de este repositorio). Existen para que la red de regresion tambien
 *    exista donde `claude` no esta instalado, como el CI de Linux.
 *
 * 2. DE INTEGRACION. Ejecutan el validador real. La comprobacion de mas
 *    valor no es "valida", sino la CONTRAPRUEBA: sobre una copia temporal
 *    se rompe el frontmatter de CADA UNO de los cuatro agentes, de uno en
 *    uno, y se comprueba que el validador falla NOMBRANDO ese fichero.
 *    Un "passed" en silencio es ambiguo entre "los miro y estan bien" y
 *    "nunca miro esa carpeta"; romperlos desambigua.
 *
 *    Medido el 2026-09-07 con claude 2.1.226: con un agente roto la salida
 *    trae una linea "Validating agent: <ruta>" y sale 1. Sin romper nada
 *    no menciona ningun agente: el validador solo nombra lo que falla.
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

// --- Localizacion del plugin -------------------------------------------
//
// Compilado, este fichero vive en dist/test/agents/. Tres niveles arriba
// esta la raiz del plugin. Mismo truco que src/fs/gitflow-runner.ts, en
// vez de depender del cwd de npm.

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');

const AGENTS_DIR = path.join(PLUGIN_ROOT, 'agents');

/** Los cuatro roles, con el nombre de fichero literal que deben tener. */
const ROLES = [
  'brainstorm-arquitectura',
  'brainstorm-riesgos',
  'brainstorm-testing',
  'brainstorm-dominio',
] as const;

const FICHEROS = ROLES.map((r) => `${r}.md`);

/** Claves que se admiten en el frontmatter de un agente. Nada mas. */
const CLAVES_PERMITIDAS = new Set(['name', 'description', 'tools', 'model']);

/**
 * Herramientas que ninguno de los cuatro roles puede declarar. Los
 * cuatro ficheros PROMETEN por escrito no modificar nada (lo asevera el
 * test 11), pero una promesa en prosa no impide nada: lo unico que de
 * verdad lo impide es la lista de `tools` del frontmatter. Sin esta
 * comprobacion, cambiar `tools: Read, Grep, Glob` por `Write, Edit,
 * Bash` deja la suite entera en verde con cuatro agentes que pueden
 * escribir en el repositorio del usuario.
 *
 * `Task` esta en la lista por un motivo distinto: los roles se lanzan ya
 * en paralelo desde fuera, y dejar que ademas se lancen entre si
 * convierte el presupuesto acotado de agentes en un arbol sin tope.
 */
const HERRAMIENTAS_PROHIBIDAS = ['Write', 'Edit', 'NotebookEdit', 'Bash', 'Task'];

const MAX_LONGITUD_NAME = 64;
const MAX_LONGITUD_DESCRIPTION = 1024;
const MAX_LINEAS_CUERPO = 300;

/**
 * Minimo de viñetas bajo cada una de las dos cabeceras de contexto. Con
 * las cabeceras solas, la seccion promete un reparto de contexto que no
 * hace: el rol acabaria recibiendo el paquete completo, que es justo el
 * gasto que el diseño evita.
 */
const MIN_VINETAS_CONTEXTO = 3;

const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);

/**
 * Marcas de este repositorio. Los cuatro ficheros se distribuyen a
 * proyectos que no son este: si una de estas cadenas viaja dentro, el
 * agente le habla al lector de un repo que no tiene delante.
 */
const MARCAS_DEL_REPO = [
  'TaskCode',
  'taskctl',
  'taskcode',
  'tareas/',
  'docs/contexto',
  'PROPUESTA_METODOLOGIA',
  'CHECKLIST_TERMINACION',
  'plan-final.md',
  'TASK-0',
];

/** Rutas absolutas de maquina que tampoco deben viajar. */
const RUTAS_DE_MAQUINA = ['C:\\Users\\', '/Users/', '/home/', '~/'];

/**
 * Secciones que TODO rol tiene que declarar. Las tres ultimas son la
 * razon de ser de este test: sin ellas el rol no dice que contexto
 * necesita (y recibiria el paquete completo, que es justo el gasto que
 * el diseno evita), o deja su salida en prosa libre.
 */
const SECCIONES_OBLIGATORIAS = [
  '## Qué miras',
  '## Qué NO miras',
  '## Qué contexto necesitas',
  '## Tu salida',
  '## Reglas que no se negocian',
];

/** Marcadores del contrato de salida, dentro de la plantilla de cada rol. */
const MARCADORES_DE_SALIDA = [
  '## Desacuerdos previstos',
  '## Suposiciones no verificadas',
];

const rutaDe = (fichero: string): string => path.join(AGENTS_DIR, fichero);

/**
 * Colapsa cualquier racha de espacios en blanco a uno solo. Las
 * aserciones sobre frases del cuerpo se hacen contra esto: si no, un
 * salto de linea del ajuste de parrafo partiria la frase buscada y el
 * test fallaria por como esta maquetado el texto, no por lo que dice.
 */
const normalizar = (s: string): string => s.replace(/\s+/g, ' ');

/**
 * Trozo de texto entre dos marcas. Si la de cierre no aparece, hasta el
 * final. Se usa para aislar cada una de las dos listas de contexto sin
 * depender de cuantas secciones haya despues.
 */
function entre(texto: string, desde: string, hasta: string): string {
  const i = texto.indexOf(desde);
  if (i === -1) return '';
  const j = texto.indexOf(hasta, i + desde.length);
  return j === -1 ? texto.slice(i) : texto.slice(i, j);
}

const cuentaVinetas = (s: string): number => (s.match(/^- /gm) ?? []).length;

/**
 * Formas en que una seccion de la plantilla de salida declara cuanto
 * ocupa como maximo. `grupo` dice cual de las capturas es ese maximo.
 *
 *   (maximo 6) | (minimo 1, maximo 2)   -> lista con tope
 *   (0 a 3; ...) | (0 a 5)              -> lista con rango
 *   <2 lineas como maximo: ...>         -> prosa acotada
 *
 * Se toleran las variantes con tilde aunque hoy las plantillas se
 * escriban sin ellas: el dia que alguien acentue una, el test tiene que
 * seguir midiendo, no volverse silenciosamente inaplicable.
 */
const TOPES_DE_SECCION: ReadonlyArray<{ re: RegExp; grupo: number }> = [
  { re: /\((?:m[ií]nimo \d+, )?m[aá]ximo (\d+)\)/, grupo: 1 },
  { re: /\((\d+) a (\d+)[;)]/, grupo: 2 },
  { re: /<(\d+) l[ií]neas como m[aá]ximo/, grupo: 1 },
];

/**
 * Lineas que la plantilla del PROPIO rol necesita en su peor caso, para
 * poder contrastarlas con el tope que el fichero declara. Un tope de 5
 * lineas sobre una plantilla que necesita 36 es el fallo que el tope
 * existia para evitar, y contra un rango fijo (1..100) pasa inadvertido.
 *
 * La cuenta es: suma de los maximos declarados por cada seccion + una
 * linea de cabecera por seccion + una linea en blanco entre secciones.
 *
 * Es aritmetica fragil y conviene saber por que se acepta igual:
 *
 * - Da un MINIMO, no la longitud real. Asume "una linea por viñeta"
 *   (que los cuatro ficheros exigen en prosa, pero eso no se puede
 *   aseverar) y que nada se parte por ajuste de linea. Por eso la
 *   asercion es `tope >= necesarias` y no una igualdad: detecta el tope
 *   imposible de cumplir, no el generoso. Un tope holgado es una
 *   decision editorial; uno imposible es un defecto.
 * - Depende del formato literal de las anotaciones. Para que ese
 *   acoplamiento no se vuelva silencioso, se exige que TODA seccion
 *   declare su maximo de alguna de las tres formas: una seccion nueva
 *   sin anotacion no reduce la cuenta sin avisar, hace fallar el test.
 */
function lineasQueNecesitaLaPlantilla(body: string, fichero: string): number {
  const bloque = /```\r?\n(## [\s\S]*?)```/.exec(body);
  assert.ok(bloque !== null, `${fichero}: no se puede aislar la plantilla de salida`);

  const secciones: string[] = [];
  for (const linea of (bloque[1] ?? '').split(/\r?\n/)) {
    if (linea.startsWith('## ')) secciones.push(linea);
    else if (secciones.length > 0) secciones[secciones.length - 1] += `\n${linea}`;
  }
  assert.ok(secciones.length > 0, `${fichero}: la plantilla de salida no tiene secciones`);

  let contenido = 0;
  for (const seccion of secciones) {
    const cabecera = seccion.split('\n')[0];
    let tope: number | undefined;
    for (const { re, grupo } of TOPES_DE_SECCION) {
      const m = re.exec(seccion);
      if (m !== null) {
        tope = Number(m[grupo]);
        break;
      }
    }
    assert.ok(
      tope !== undefined,
      `${fichero}: la seccion "${cabecera}" de la plantilla no declara cuanto ocupa ` +
        'como maximo, asi que el tope del rol no se puede contrastar con ella'
    );
    contenido += tope;
  }

  // cabeceras + separadores en blanco entre secciones
  return contenido + secciones.length + (secciones.length - 1);
}

async function leerTexto(fichero: string): Promise<string> {
  return readFile(rutaDe(fichero), 'utf8');
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

test('1. agents/ contiene los cuatro ficheros, con ese nombre y ese case exactos', async () => {
  // En Windows el filesystem es case-insensitive: un stat() de la ruta NO
  // demuestra el case. El listado del directorio si lo demuestra.
  const enAgents = await readdir(AGENTS_DIR);
  const faltan = FICHEROS.filter((f) => !enAgents.includes(f));
  assert.deepEqual(
    faltan,
    [],
    `agents/ no contiene ${faltan.join(', ')}. Hay: ${enAgents.join(', ')}`
  );
});

for (const fichero of FICHEROS) {
  const rol = fichero.replace(/\.md$/, '');

  test(`2. ${fichero}: empieza por los tres guiones, sin BOM ni espacios delante`, async () => {
    const bytes = await readFile(rutaDe(fichero));

    // El BOM UTF-8 desplaza el "---" y Claude Code deja de ver
    // frontmatter: carga el agente con metadatos vacios. Fallo silencioso.
    assert.ok(
      !bytes.subarray(0, 3).equals(BOM_UTF8),
      `${fichero} empieza con BOM UTF-8 (EF BB BF): el frontmatter no se parseara`
    );
    assert.equal(
      bytes[0],
      0x2d,
      `el primer byte de ${fichero} es 0x${(bytes[0] ?? 0).toString(16)}, no un guion`
    );
    assert.match(
      bytes.toString('utf8'),
      /^---\r?\n/,
      `${fichero} no empieza exactamente por "---" seguido de salto de linea`
    );
  });

  test(`3. ${fichero}: el frontmatter cierra y parsea a objeto`, async () => {
    // parseFrontmatter lanza si no hay linea de cierre "---".
    const { data, body } = parseFrontmatter(await leerTexto(fichero));
    assert.equal(typeof data, 'object');
    assert.notEqual(data, null);
    assert.equal(typeof body, 'string');
  });

  test(`4. ${fichero}: name presente, kebab-case y coincidente con el nombre del fichero`, async () => {
    const { data } = parseFrontmatter(await leerTexto(fichero));
    const name = data.name;

    assert.equal(typeof name, 'string', `${fichero}: el frontmatter no tiene "name" como string`);
    const n = name as string;

    assert.match(n, /^[a-z0-9-]+$/, `"${n}" no es kebab-case (solo a-z, 0-9 y guiones)`);
    assert.ok(!n.startsWith('-'), `"${n}" empieza por guion`);
    assert.ok(!n.endsWith('-'), `"${n}" acaba en guion`);
    assert.ok(!n.includes('--'), `"${n}" tiene doble guion`);
    assert.ok(
      n.length <= MAX_LONGITUD_NAME,
      `"${n}" tiene ${n.length} caracteres (maximo ${MAX_LONGITUD_NAME})`
    );

    // La coherencia con el fichero es lo que hace invocable al agente:
    // Claude Code lo llama por su "name", no por su ruta.
    assert.equal(
      n,
      rol,
      `${fichero} declara name="${n}": no coincide con el nombre del fichero`
    );
  });

  test(`5. ${fichero}: description presente, acotada, sin signos de menor/mayor y sin truncar`, async () => {
    const texto = await leerTexto(fichero);
    const { data } = parseFrontmatter(texto);
    const description = data.description;

    assert.equal(
      typeof description,
      'string',
      `${fichero}: el frontmatter no tiene "description" como string`
    );
    const d = description as string;

    assert.ok(d.trim().length > 0, `${fichero}: la description esta vacia`);
    assert.ok(
      d.length <= MAX_LONGITUD_DESCRIPTION,
      `${fichero}: description de ${d.length} caracteres (maximo ${MAX_LONGITUD_DESCRIPTION})`
    );
    assert.ok(!d.includes('<'), `${fichero}: la description contiene el signo de menor`);
    assert.ok(!d.includes('>'), `${fichero}: la description contiene el signo de mayor`);

    // La description es lo unico que el orquestador lee para decidir a
    // quien lanza: tiene que nombrar su propio rol.
    const palabraDelRol = rol.replace('brainstorm-', '');
    assert.ok(
      d.toLowerCase().includes(palabraDelRol),
      `${fichero}: la description no menciona "${palabraDelRol}", su propio rol: "${d}"`
    );

    // El parser del proyecto corta un valor sin comillas en el primer
    // " #" (comentario inline de YAML). Claude Code NO hace eso: una
    // description con " #" se mediria aqui truncada y las aserciones de
    // arriba darian verde sobre un valor que no es el que se carga.
    const lineaCruda = texto.split('\n').find((l) => l.startsWith('description:'));
    assert.ok(lineaCruda !== undefined, `${fichero}: no hay linea "description:"`);
    const valorCrudo = lineaCruda.slice('description:'.length).trim();
    const esperado = valorCrudo.startsWith('"') && valorCrudo.endsWith('"')
      ? valorCrudo.slice(1, -1).replace(/\\"/g, '"')
      : valorCrudo;
    assert.equal(
      d,
      esperado,
      `${fichero}: el parser ha truncado la description (¿contiene " #"?): ` +
        'lo que mide este test no es lo que leeria Claude Code'
    );
  });

  test(`6. ${fichero}: el frontmatter no trae claves fuera de las admitidas`, async () => {
    const { data } = parseFrontmatter(await leerTexto(fichero));
    const intrusas = Object.keys(data).filter((k) => !CLAVES_PERMITIDAS.has(k));
    assert.deepEqual(
      intrusas,
      [],
      `${fichero}: claves no admitidas: ${intrusas.join(', ')} ` +
        `(permitidas: ${[...CLAVES_PERMITIDAS].join(', ')})`
    );
  });

  test(`6b. ${fichero}: tools declara herramientas, y ninguna de escritura o ejecucion`, async () => {
    const { data } = parseFrontmatter(await leerTexto(fichero));
    const tools = data.tools;

    // Ausente no vale: sin la clave, el agente hereda TODAS las
    // herramientas del contexto que lo lanza, escritura incluida.
    assert.equal(
      typeof tools,
      'string',
      `${fichero}: el frontmatter no declara "tools"; sin esa clave el rol ` +
        'hereda todas las herramientas disponibles, incluidas las de escritura'
    );

    const declaradas = (tools as string)
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    assert.ok(declaradas.length > 0, `${fichero}: "tools" esta declarado pero vacio`);

    const prohibidas = declaradas.filter((t) => HERRAMIENTAS_PROHIBIDAS.includes(t));
    assert.deepEqual(
      prohibidas,
      [],
      `${fichero}: declara ${prohibidas.join(', ')} en "tools". El fichero promete ` +
        'no modificar nada; lo unico que lo impide de verdad es esta lista'
    );
  });

  test(`7. ${fichero}: el cuerpo no esta vacio y cabe en ${MAX_LINEAS_CUERPO} lineas`, async () => {
    const { body } = parseFrontmatter(await leerTexto(fichero));
    assert.ok(body.trim().length > 0, `${fichero}: el cuerpo esta vacio`);

    const lineas = body.replace(/\r?\n$/, '').split(/\r?\n/).length;
    assert.ok(
      lineas <= MAX_LINEAS_CUERPO,
      `${fichero}: el cuerpo tiene ${lineas} lineas (maximo ${MAX_LINEAS_CUERPO})`
    );
  });

  test(`8. ${fichero}: declara sus secciones, incluidas contexto y salida`, async () => {
    const { body } = parseFrontmatter(await leerTexto(fichero));
    const faltan = SECCIONES_OBLIGATORIAS.filter((s) => !body.includes(s));
    assert.deepEqual(
      faltan,
      [],
      `${fichero}: faltan secciones obligatorias: ${faltan.join(' | ')}`
    );
  });

  test(`9. ${fichero}: la seccion de contexto reparte de verdad (lo que necesita y lo que no)`, async () => {
    const { body } = parseFrontmatter(await leerTexto(fichero));
    const plano = normalizar(body);
    // Sin la mitad negativa, "contexto" degenera en "dame todo", que es
    // exactamente el gasto que el diseno del brainstorm evita.
    assert.ok(
      plano.includes('**Necesitas:**'),
      `${fichero}: la seccion de contexto no lista lo que el rol necesita`
    );
    assert.ok(
      plano.includes('**No necesitas'),
      `${fichero}: la seccion de contexto no lista lo que el rol NO necesita`
    );

    // Y que ambas listen algo. Con las cabeceras solas el reparto de
    // contexto es una promesa vacia, y este test la daba por buena.
    const necesita = cuentaVinetas(entre(body, '**Necesitas:**', '**No necesitas'));
    assert.ok(
      necesita >= MIN_VINETAS_CONTEXTO,
      `${fichero}: bajo "Necesitas:" hay ${necesita} viñetas (minimo ${MIN_VINETAS_CONTEXTO})`
    );

    const noNecesita = cuentaVinetas(entre(body, '**No necesitas', '\n## '));
    assert.ok(
      noNecesita >= MIN_VINETAS_CONTEXTO,
      `${fichero}: bajo "No necesitas" hay ${noNecesita} viñetas (minimo ${MIN_VINETAS_CONTEXTO})`
    );
  });

  test(`10. ${fichero}: la salida esta acotada con un tope numerico declarado`, async () => {
    const { body } = parseFrontmatter(await leerTexto(fichero));

    const tope = /\*\*Máximo (\d+) líneas en total\.\*\*/.exec(normalizar(body));
    assert.ok(
      tope !== null,
      `${fichero}: la salida no declara un tope de longitud ("**Máximo N líneas en total.**")`
    );
    const n = Number(tope[1]);
    assert.ok(
      n > 0 && n <= 100,
      `${fichero}: el tope declarado es ${n} lineas; fuera de rango util (1..100)`
    );

    // Estructura fija, no prosa libre: la plantilla tiene que estar en un
    // bloque de codigo con secciones.
    assert.match(
      body,
      /```\r?\n## /,
      `${fichero}: no hay plantilla de salida en bloque de codigo con secciones`
    );

    // Y el tope tiene que ser compatible con la plantilla de ESTE rol,
    // no con un rango generico: un tope que la propia plantilla no puede
    // respetar obliga a incumplir una de las dos instrucciones, y el rol
    // no tiene forma de saber cual.
    const necesarias = lineasQueNecesitaLaPlantilla(body, fichero);
    assert.ok(
      n >= necesarias,
      `${fichero}: declara un tope de ${n} lineas, pero su propia plantilla necesita ` +
        `${necesarias} en el peor caso (maximos declarados + cabeceras + separadores)`
    );

    const faltan = MARCADORES_DE_SALIDA.filter((m) => !body.includes(m));
    assert.deepEqual(
      faltan,
      [],
      `${fichero}: la plantilla de salida no reserva sitio para ${faltan.join(' | ')}`
    );
  });

  test(`11. ${fichero}: prohibe implementar y obliga a no fingir consenso`, async () => {
    const plano = normalizar(parseFrontmatter(await leerTexto(fichero)).body);
    assert.ok(
      plano.includes('no lo implementas'),
      `${fichero}: no deja escrito que propone enfoque y no implementa`
    );
    assert.ok(
      plano.includes('No escribes ni modificas código de producción'),
      `${fichero}: no prohibe explicitamente escribir codigo de produccion`
    );
    assert.ok(
      plano.includes('consenso fingido'),
      `${fichero}: no instruye a señalar el desacuerdo en vez de fingir consenso`
    );
  });

  test(`12. ${fichero}: no contiene marcas de este repositorio ni rutas de maquina`, async () => {
    // Se mira el fichero ENTERO, frontmatter incluido: una marca en la
    // description viaja igual de lejos que una en el cuerpo.
    const texto = await leerTexto(fichero);
    const marcas = MARCAS_DEL_REPO.filter((m) => texto.includes(m));
    assert.deepEqual(
      marcas,
      [],
      `${fichero}: contiene marcas de este repo: ${marcas.join(', ')}`
    );

    const rutas = RUTAS_DE_MAQUINA.filter((r) => texto.includes(r));
    assert.deepEqual(rutas, [], `${fichero}: contiene rutas de maquina: ${rutas.join(', ')}`);
  });
}

// Alcance real de este test, para que su nombre no prometa mas de lo que
// mide: detecta la COPIA LITERAL de la seccion, no el solape semantico.
// Dos roles que miren lo mismo con otras palabras —o con un carácter de
// diferencia— pasan. Comprobar el solape de verdad exige comparar
// significado, que no sale barato ni determinista; queda para el ojo del
// revisor. Lo que este test si garantiza es que nadie duplique la
// seccion por copiar y pegar un rol para crear otro, que es el descuido
// que de verdad se ha visto.
test('13. ningun "Qué miras" es copia literal de otro (no mide solape semantico)', async () => {
  const secciones = new Map<string, string>();
  for (const fichero of FICHEROS) {
    const { body } = parseFrontmatter(await leerTexto(fichero));
    const desde = body.indexOf('## Qué miras');
    const hasta = body.indexOf('## Qué NO miras');
    assert.ok(
      desde !== -1 && hasta > desde,
      `${fichero}: no se puede aislar la seccion "Qué miras"`
    );
    secciones.set(fichero, body.slice(desde, hasta).trim());
  }

  const vistos = new Map<string, string>();
  for (const [fichero, texto] of secciones) {
    const previo = vistos.get(texto);
    assert.equal(
      previo,
      undefined,
      `${fichero} y ${String(previo)} declaran exactamente lo mismo en "Qué miras": ` +
        'si los cuatro roles miran lo mismo, el brainstorm no aporta nada'
    );
    vistos.set(texto, fichero);
  }
});

test('14. el rol de testing deja escrita la alternativa de degradarlo a checklist del unificador', async () => {
  const plano = normalizar(parseFrontmatter(await leerTexto('brainstorm-testing.md')).body);
  assert.ok(
    plano.includes('checklist del unificador'),
    'brainstorm-testing.md no menciona la posibilidad de vivir como checklist del unificador'
  );
  // Es una posibilidad prevista, no una queja: tiene que decir tambien
  // que, si se ejecuta como agente, hace su trabajo entero.
  assert.ok(
    plano.includes('haz tu trabajo entero'),
    'brainstorm-testing.md deja la nota abierta sin decir que hacer si se ejecuta como agente'
  );
});

test('15. ningun otro rol arrastra la nota del rol de testing', async () => {
  for (const fichero of FICHEROS.filter((f) => f !== 'brainstorm-testing.md')) {
    const plano = normalizar(parseFrontmatter(await leerTexto(fichero)).body);
    assert.ok(
      !plano.includes('checklist del unificador'),
      `${fichero}: copia la nota que solo corresponde al rol de testing`
    );
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
  '16. `claude plugin validate` sobre el plugin real sale 0',
  { skip: SKIP_INTEGRACION },
  () => {
    const { status, salida } = validar(PLUGIN_ROOT);
    assert.equal(status, 0, `exit ${String(status)}. Salida:\n${salida}`);
    assert.ok(!salida.includes(CRUZ), `la salida reporta errores:\n${salida}`);
  }
);

test(
  '17. contraprueba de descubrimiento: romper cada agente de una copia hace fallar al validador nombrandolo',
  { skip: SKIP_INTEGRACION },
  async (t) => {
    // Se trabaja SIEMPRE sobre una copia fuera del repo. Los ficheros
    // reales no se tocan: romperlos aunque fuera un instante dejaria el
    // workspace sucio si el test peta a mitad.
    const tmp = await mkdtemp(path.join(tmpdir(), 'taskcode-agents-'));
    t.after(async () => {
      await rm(tmp, { recursive: true, force: true });
    });

    // Solo lo que el validador necesita: el manifiesto y agents/.
    await cp(
      path.join(PLUGIN_ROOT, '.claude-plugin'),
      path.join(tmp, '.claude-plugin'),
      { recursive: true }
    );
    await cp(AGENTS_DIR, path.join(tmp, 'agents'), { recursive: true });

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
    // El validador solo nombra lo que falla: con todo bien no menciona
    // ningun agente. De ahi que "passed" por si solo no pruebe nada, y
    // que haga falta el bucle de abajo.
    assert.ok(
      !intacta.salida.includes('Validating agent:'),
      `la copia intacta ya nombra agentes; la contraprueba dejaria de ser concluyente:\n${intacta.salida}`
    );

    // (b) De uno en uno: se rompe el YAML del frontmatter (comilla sin
    //     cerrar en description), se valida, y se restaura.
    for (const fichero of FICHEROS) {
      const copia = path.join(tmp, 'agents', fichero);
      const original = await readFile(copia, 'utf8');
      const roto = original.replace(/^description:.*$/m, 'description: "sin cerrar la comilla');
      assert.notEqual(roto, original, `${fichero}: no se encontro la linea "description:" que romper`);
      await writeFile(copia, roto, 'utf8');

      const rota = validar(tmp);
      await writeFile(copia, original, 'utf8');

      // Si el validador no mirase agents/, romper el fichero no cambiaria
      // nada y esto seguiria saliendo 0. Que falle ES la evidencia de que
      // descubre el agente donde lo pusimos.
      assert.notEqual(
        rota.status,
        0,
        `romper ${fichero} no hizo fallar al validador: no esta mirando esa ruta.\n${rota.salida}`
      );
      assert.match(
        rota.salida,
        /Validating agent:/,
        `el validador fallo pero no nombro ningun agente al romper ${fichero}:\n${rota.salida}`
      );
      assert.ok(
        rota.salida.includes(fichero),
        `la salida no menciona "${fichero}", que es el que se rompio:\n${rota.salida}`
      );

      // Y la copia restaurada vuelve a validar: si no, el fallo siguiente
      // vendria arrastrado y no de su propia mutacion.
      const restaurada = validar(tmp);
      assert.equal(
        restaurada.status,
        0,
        `tras restaurar ${fichero} la copia no vuelve a validar:\n${restaurada.salida}`
      );
    }
  }
);
