/**
 * Tests de los agentes del brainstorm paralelo: `agents/brainstorm-*.md`.
 * Son los cuatro roles que se lanzan en paralelo mas el unificador que
 * consolida sus salidas. El unificador no es un rol mas y no se cuenta
 * como tal (ver FICHEROS y AGENTES, mas abajo): los tests genericos de
 * fichero de agente lo incluyen, los que miden la convencion de reparto
 * entre roles no.
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
import { parseBloqueClaveValor, parseFrontmatter } from '../../src/core/frontmatter.js';
import { UNIFICADOR_ID } from '../../src/core/roles-brainstorm.js';
import { TASK_COMPLEXITIES } from '../../src/core/task.js';

// --- Localizacion del plugin -------------------------------------------
//
// Compilado, este fichero vive en dist/test/agents/. Tres niveles arriba
// esta la raiz del plugin. Mismo truco que src/fs/gitflow-runner.ts, en
// vez de depender del cwd de npm.

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');

const AGENTS_DIR = path.join(PLUGIN_ROOT, 'agents');
const RUTA_HEURISTICA = path.join(PLUGIN_ROOT, 'scripts', 'heuristica-complejidad.yml');

/** Los cuatro roles, con el nombre de fichero literal que deben tener. */
const ROLES = [
  'brainstorm-arquitectura',
  'brainstorm-riesgos',
  'brainstorm-testing',
  'brainstorm-dominio',
] as const;

const FICHEROS = ROLES.map((r) => `${r}.md`);

/**
 * El unificador NO es un rol de brainstorm: es quien consolida los que
 * se hayan lanzado. Vive aparte de ROLES a proposito, y no por pulcritud:
 * la tabla de agentes de la heuristica cuenta ROLES (el test 14b deriva
 * de `FICHEROS.length` cuantos caben en `critica`), asi que meterlo ahi
 * convertiria "los cuatro roles" en cinco y la nota del rol de testing
 * pasaria a describir un reparto que no existe.
 *
 * El id se importa del nucleo en vez de escribirse aqui: es el mismo
 * valor con el que la peticion generada nombra al agente que hay que
 * lanzar. Escribirlo a mano dejaria que las dos copias divergieran, que
 * es exactamente el fallo que este fichero existe para que no vuelva a
 * pasar (la peticion mandaba lanzar un agente que no estaba en disco).
 */
const FICHERO_UNIFICADOR = `${UNIFICADOR_ID}.md`;

/** Todo lo que vive en agents/: los cuatro roles mas el unificador. */
const AGENTES = [...FICHEROS, FICHERO_UNIFICADOR];

/** Claves que se admiten en el frontmatter de un agente. Nada mas. */
const CLAVES_PERMITIDAS = new Set(['name', 'description', 'tools', 'model']);

/**
 * Herramientas que los cuatro roles pueden declarar, y NINGUNA MAS. Los
 * cuatro ficheros PROMETEN por escrito no modificar nada (lo asevera el
 * test 11), pero una promesa en prosa no impide nada: lo unico que de
 * verdad lo impide es la lista de `tools` del frontmatter. Sin esta
 * comprobacion, cambiar `tools: Read, Grep, Glob` por `Write, Edit,
 * Bash` deja la suite entera en verde con cuatro agentes que pueden
 * escribir en el repositorio del usuario.
 *
 * Es lista BLANCA a proposito (ronda 2, menor 3). La negra que habia
 * antes —`Write, Edit, NotebookEdit, Bash, Task`, por igualdad exacta—
 * dejaba pasar tres formas distintas de lo mismo: cualquier herramienta
 * de escritura que no estuviera enumerada (`mcp__fs__write_file` y las
 * que traiga el proximo servidor MCP), la misma escrita en minusculas
 * (`bash`), y la forma con argumentos entre parentesis
 * (`Bash(git status:*)`). Una lista blanca es cerrada: no envejece con
 * cada herramienta nueva, y ampliarla exige editar esta constante, que
 * es exactamente la decision que se quiere que alguien tome a mano.
 *
 * Solo lectura y busqueda. `Task` no entra por un motivo propio: los
 * roles se lanzan ya en paralelo desde fuera, y dejar que ademas se
 * lancen entre si convierte el presupuesto acotado de agentes en un
 * arbol sin tope.
 */
const HERRAMIENTAS_PERMITIDAS = new Set(['read', 'grep', 'glob']);

/**
 * Las del unificador: las mismas mas `write`, y solo esa. La diferencia
 * no es un relajamiento del criterio, es que su entregable ES un fichero
 * escrito: la peticion que lo lanza le dice en que ruta volcar el plan,
 * y sin `write` el agente contradiria a la peticion que lo invoca.
 *
 * Lo que sigue fuera es lo que importa: `edit` (no retoca ficheros que
 * ya existen), `bash` (no ejecuta nada) y `task` (no relanza roles; el
 * presupuesto de agentes se fija fuera y un unificador que lanza agentes
 * lo convierte en un arbol sin tope).
 */
const HERRAMIENTAS_PERMITIDAS_UNIFICADOR = new Set([...HERRAMIENTAS_PERMITIDAS, 'write']);

/**
 * Nombre base de una herramienta declarada. Quita los argumentos entre
 * parentesis (`Bash(git status:*)` -> `bash`) y normaliza mayusculas,
 * que Claude Code no distingue y una comparacion literal si.
 *
 * Con lista blanca, trocear por comas es seguro aunque una declaracion
 * traiga comas DENTRO del parentesis (`Bash(git status:*, ls:*)`): los
 * dos trozos que salen —`Bash(git status:*` y `ls:*)`— tienen que estar
 * ambos en la lista, y ninguno lo esta. Con lista negra, el segundo
 * trozo no se parecia a nada prohibido y pasaba.
 */
const nombreBaseDeHerramienta = (t: string): string =>
  t.replace(/\(.*$/, '').trim().toLowerCase();

const MAX_LONGITUD_NAME = 64;
const MAX_LONGITUD_DESCRIPTION = 1024;
const MAX_LINEAS_CUERPO = 300;

/**
 * Minimo de viñetas bajo cada una de las dos cabeceras de contexto. Con
 * las cabeceras solas, la seccion promete un reparto de contexto que no
 * hace: el rol acabaria recibiendo el paquete completo, que es justo el
 * gasto que el diseño evita.
 *
 * Vale 2 y no 3 (ronda 2, menor 5). Con 3, los margenes medidos eran
 * 4/4, 5/4, 4/4 y 5/3: brainstorm-dominio.md quedaba a cero, y fusionar
 * dos de sus viñetas de "No necesitas" —una edicion editorial legitima,
 * que no toca el reparto— ponia el test rojo sin que nada empeorase. Lo
 * que este minimo defiende es que la lista exista y liste de verdad, no
 * cuantas viñetas tiene; una lista de dos ya obliga a repartir. El fallo
 * real que atrapa —cabeceras sin nada debajo— se sigue atrapando igual.
 */
const MIN_VINETAS_CONTEXTO = 2;

const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);

/**
 * Marcas de este repositorio. Los cuatro ficheros se distribuyen a
 * proyectos que no son este: si una de estas cadenas viaja dentro, el
 * agente le habla al lector de un repo que no tiene delante.
 *
 * La lista se compara SIEMPRE en minusculas y es la misma que la de
 * test/skills/revisores.test.ts (ronda 2, menor 4), que iba por delante:
 * la de aqui tenia 9 entradas y era sensible a mayusculas, asi que
 * "TASKCODE" o "veredictoAprobado() de src/commands/finish.ts" se
 * colaban enteros. Unica diferencia deliberada: aqui se conserva ademas
 * `taskctl`. Alli se admite a proposito porque los comandos del plugin
 * viajan con el; estos cuatro roles son de diseño generico y no tienen
 * ninguna razon para nombrar el CLI, asi que se sigue prohibiendo.
 *
 * PENDIENTE: las dos listas son gemelas y viven en dos ficheros. Sacarlas
 * a un modulo compartido evitaria que vuelvan a divergir, pero eso obliga
 * a tocar test/skills/revisores.test.ts, que no entra en este cambio.
 */
const MARCAS_DEL_REPO = [
  'taskcode',
  'taskctl',
  'tareas/',
  'docs/contexto',
  'propuesta_metodologia',
  'checklist_terminacion',
  'plan_sprints',
  'plan-final.md',
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
 * Los documentos internos de un repo se nombran en MAYUSCULAS bajo
 * `docs/`. Enumerarlos de uno en uno se quedaba corto siempre: la lista
 * dejaba pasar `docs/CONVENCIONES.md`, `docs/HALLAZGOS.md` y cualquier
 * otro que naciera despues. Se asevera el patron, no el caso. Mismo
 * criterio y misma expresion que en test/skills/revisores.test.ts.
 */
const DOCUMENTO_INTERNO = /docs\/[A-Z_]+\.md/;

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

/**
 * Los del unificador. Son otros porque su salida es otra: los roles
 * PREVEN desacuerdos, el unificador los RESUELVE. Y tres secciones no
 * tienen equivalente en ningun rol, que es justo el trabajo que solo el
 * puede hacer: decir que salida falto, que parte del enunciado no cubrio
 * nadie, y que queda pendiente de que lo decida una persona.
 */
const MARCADORES_DE_SALIDA_UNIFICADOR = [
  '## Desacuerdos resueltos',
  '## Salidas que faltaron',
  '## Sin cubrir',
  '## Suposiciones no verificadas',
  '## Decision humana pendiente',
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
 * Las frases de un texto ya normalizado. Corte por punto seguido de
 * espacio: llega de sobra para lo unico que se usa, que es comprobar si
 * dos palabras caen o no en la MISMA frase. Una mencion en dos frases
 * distintas no es una cesion; es una coincidencia de vocabulario.
 */
const frasesDe = (texto: string): string[] => texto.split(/\.\s+/);

/**
 * La tabla "cuantos agentes de brainstorm por nivel" del fichero de
 * heuristica, leida con el parser del plugin.
 *
 * Se lee en vez de copiarse porque la nota del rol de testing describe
 * en QUE TRAMO de esa tabla el rol se degrada a checklist, y ese tramo
 * es una consecuencia del reparto, no un literal: donde el presupuesto
 * ya no da para los cuatro roles pero pasa de uno. Derivandolo, si
 * manana el reparto cambia, el test falla y obliga a reescribir la nota
 * — que es exactamente lo que se quiere.
 */
async function agentesPorNivel(): Promise<Record<string, number>> {
  const lineas = (await readFile(RUTA_HEURISTICA, 'utf8')).split(/\r?\n/);
  const { data } = parseBloqueClaveValor(lineas, 0, {
    etiqueta: 'heuristica de complejidad',
    crearError: (mensaje) => new Error(`[${RUTA_HEURISTICA}] ${mensaje}`),
    permitirComentariosDeLinea: true,
  });

  const tabla: Record<string, number> = {};
  for (const nivel of TASK_COMPLEXITIES) {
    const valor = data[`agentes_brainstorm_${nivel}`];
    assert.equal(
      typeof valor,
      'number',
      `la heuristica no dice cuantos agentes lleva el nivel "${nivel}"`
    );
    tabla[nivel] = valor as number;
  }
  return tabla;
}

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

test('1. agents/ contiene los cuatro roles y el unificador, esos y solo esos', async () => {
  // En Windows el filesystem es case-insensitive: un stat() de la ruta NO
  // demuestra el case. El listado del directorio si lo demuestra.
  const enAgents = await readdir(AGENTS_DIR);
  const faltan = AGENTES.filter((f) => !enAgents.includes(f));
  assert.deepEqual(
    faltan,
    [],
    `agents/ no contiene ${faltan.join(', ')}. Hay: ${enAgents.join(', ')}`
  );

  // Y que no SOBRE ninguno. Comprobar solo que no faltan dejaba pasar un
  // rol de mas: los tests parametrizados de abajo iteran sobre una lista
  // cerrada, asi que un `brainstorm-seguridad.md` no se validaba, no se
  // comparaba con nadie, y el numero de agentes del nivel critica (4,
  // "los cuatro roles definidos") pasaba a ser mentira sin que nada se
  // enterase (ronda 3, menor 5).
  //
  // El conjunto sigue siendo cerrado tras entrar el unificador: la
  // comparacion es contra AGENTES, no contra "cuatro o cinco". Un sexto
  // fichero brainstorm-* obliga igual que antes a tocar ROLES aqui
  // arriba, que es la decision que se quiere a mano; y si lo que se
  // anade es otro rol de brainstorm, ROLES es ademas lo unico que hace
  // que la tabla de agentes de la heuristica siga cuadrando.
  const brainstormEnDisco = enAgents.filter((f) => f.startsWith('brainstorm-')).sort();
  assert.deepEqual(
    brainstormEnDisco,
    [...AGENTES].sort(),
    `agents/ tiene ficheros brainstorm-* que este test no conoce: ${brainstormEnDisco.join(', ')}`
  );
});

// Los tests 2 a 12 valen para CUALQUIER agente que se instale en el
// proyecto de un usuario —frontmatter sano, herramientas acotadas, salida
// con formato, y nada que delate el repositorio de origen—, asi que
// iteran sobre AGENTES. Los dos sitios donde el unificador no es un rol
// mas (las herramientas que puede declarar y los marcadores de su salida)
// se resuelven dentro del propio test, no sacandolo del bucle.
for (const fichero of AGENTES) {
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

    // El unificador tiene su propia lista blanca, una entrada mas larga:
    // su entregable es un fichero escrito. Sigue siendo lista BLANCA, y
    // sigue dejando fuera edit, bash y task.
    const permitidas =
      fichero === FICHERO_UNIFICADOR
        ? HERRAMIENTAS_PERMITIDAS_UNIFICADOR
        : HERRAMIENTAS_PERMITIDAS;

    const fuera = declaradas.filter((t) => !permitidas.has(nombreBaseDeHerramienta(t)));
    assert.deepEqual(
      fuera,
      [],
      `${fichero}: declara ${fuera.join(', ')} en "tools", que no esta en la lista ` +
        `blanca (${[...permitidas].join(', ')}). El fichero promete no ` +
        'modificar nada; lo unico que lo impide de verdad es esta lista'
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

    // El unificador resuelve desacuerdos en vez de preverlos, y su
    // plantilla reserva sitio para tres cosas que ningun rol produce.
    const marcadores =
      fichero === FICHERO_UNIFICADOR ? MARCADORES_DE_SALIDA_UNIFICADOR : MARCADORES_DE_SALIDA;
    const faltan = marcadores.filter((m) => !body.includes(m));
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
    const enMinusculas = texto.toLowerCase();
    const marcas = MARCAS_DEL_REPO.filter((m) => enMinusculas.includes(m));
    assert.deepEqual(
      marcas,
      [],
      `${fichero}: contiene marcas de este repo: ${marcas.join(', ')}`
    );

    // El nombre del documento SI se mira con su case original: el patron
    // vive justamente de que estos documentos van en mayusculas.
    const doc = DOCUMENTO_INTERNO.exec(texto);
    assert.equal(
      doc,
      null,
      `${fichero}: nombra el documento interno "${doc?.[0]}", que no existe en el ` +
        'proyecto donde se instala'
    );

    const rutas = RUTAS_DE_MAQUINA.filter((r) => texto.includes(r));
    assert.deepEqual(rutas, [], `${fichero}: contiene rutas de maquina: ${rutas.join(', ')}`);
  });
}

test('12b. la marca generica de documento interno discrimina', () => {
  for (const caso of [
    'Ver docs/PLAN_SPRINTS.md para el detalle.',
    'esta en docs/HALLAZGOS.md',
    'lo describe docs/ESTADO.md',
  ]) {
    assert.ok(DOCUMENTO_INTERNO.test(caso), `la marca generica deja pasar "${caso}"`);
  }
  // Y al reves: no puede morder texto legitimo de un rol portable.
  for (const caso of [
    'la carpeta docs/ del proyecto',
    'un fichero docs/guia-de-estilo.md',
    'README.md en la raiz',
  ]) {
    assert.equal(
      DOCUMENTO_INTERNO.test(caso),
      false,
      `la marca generica muerde texto legitimo: "${caso}"`
    );
  }
});

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
  // Sobre AGENTES y no sobre FICHEROS: el descuido que este test detecta
  // —copiar un agente para crear otro y olvidarse de reescribir su
  // seccion— es mas probable estrenando fichero que manteniendo uno.
  for (const fichero of AGENTES) {
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

/**
 * El reparto de un tema entre los cuatro roles sigue una convencion: un
 * rol lo reclama en su "Qué miras" y los otros TRES lo ceden en su "Qué
 * NO miras". Aqui se asevera sobre rendimiento y escalabilidad, que es
 * el unico tema con una palabra comun a los cuatro ficheros; el resto se
 * reparte con vocabularios distintos ("casos límite" frente a "modos de
 * fallo", "dominio" frente a "regla de negocio") y compararlos exigiria
 * medir significado, que ni es barato ni es determinista.
 *
 * Ata dos cosas a la vez: la viñeta que reclama el tema en arquitectura
 * (correccion de la ronda 1) y las dos que lo ceden en riesgos y testing
 * (ronda 2, menor 1). Sin esto, borrar cualquiera de las tres deja la
 * suite en verde con un tema reclamado por dos roles o por ninguno.
 *
 * Se mira por SECCION, no por fichero entero: "el contexto de mayor
 * rendimiento que puedes recibir" aparece en la seccion de contexto de
 * riesgos con otro sentido, y un `includes` sobre el fichero lo contaria
 * como si el rol reclamara el tema.
 *
 * Y la cesion se mide por FRASE, no por seccion (ronda 3, menor 4). Que
 * la palabra "rendimiento" aparezca en "Qué NO miras" no es ceder nada:
 * una viñeta como "tu rendimiento no se mide en cuántas viñetas
 * escribes" satisfacia el test con el rol sin ceder el tema a nadie.
 * Ceder es nombrar a QUIEN se cede, en la misma frase, y el nombre no se
 * escribe aqui a mano: sale del rol que ha resultado reclamarlo.
 */
test('13b. rendimiento y escalabilidad los reclama un solo rol y los ceden los otros tres', async () => {
  const reclaman: string[] = [];
  const seccionNoMiras = new Map<string, string>();

  for (const fichero of FICHEROS) {
    const { body } = parseFrontmatter(await leerTexto(fichero));
    const queMira = normalizar(entre(body, '## Qué miras', '## Qué NO miras'));
    const queNoMira = normalizar(entre(body, '## Qué NO miras', '\n## '));
    assert.ok(queMira !== '' && queNoMira !== '', `${fichero}: no se aislan las dos secciones`);

    const loReclama = /rendimiento/i.test(queMira);
    assert.equal(
      loReclama && /rendimiento/i.test(queNoMira),
      false,
      `${fichero}: nombra el rendimiento en "Qué miras" y en "Qué NO miras" a la vez`
    );
    if (loReclama) reclaman.push(fichero);
    seccionNoMiras.set(fichero, queNoMira);
  }

  assert.deepEqual(
    reclaman.length,
    1,
    `el rendimiento lo reclaman ${reclaman.length} roles (${reclaman.join(', ') || 'ninguno'}): ` +
      'la convencion es uno lo mira y los otros tres lo ceden'
  );

  // A quien se cede. Se deriva del que lo reclama en vez de escribir
  // "arquitectura" a mano: si manana el tema cambia de dueno, el test
  // sigue midiendo la convencion y no un nombre caducado.
  const dueno = (reclaman[0] as string).replace('brainstorm-', '').replace(/\.md$/, '');
  const cede = (queNoMira: string): boolean =>
    frasesDe(queNoMira).some(
      (frase) => /rendimiento/i.test(frase) && new RegExp(`\\b${dueno}\\b`, 'i').test(frase)
    );

  const sinCeder = FICHEROS.filter((f) => !reclaman.includes(f) && !cede(seccionNoMiras.get(f) ?? ''));
  assert.deepEqual(
    sinCeder,
    [],
    `${sinCeder.join(', ')}: no cede el rendimiento a ${reclaman[0]} en ninguna frase de ` +
      '"Qué NO miras". Nombrar el tema sin nombrar a quien se le pasa no es cederlo: ' +
      'un tema reclamado en un solo sentido se acaba mirando dos veces o ninguna'
  );
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

/**
 * La nota del rol de testing habla de la escalera de complejidad del
 * plugin, y la escalera es un enum del codigo: `TASK_COMPLEXITIES`. La
 * redaccion que trajo la ronda 1 —"complejidad baja o media", con la
 * degradacion "reservada para las altas"— nombraba un nivel que no
 * existe y se saltaba tres que si, y la correccion se revirtio sin red.
 *
 * Se importa el enum en vez de copiar los cinco literales, igual que
 * test/core/heuristica-complejidad.test.ts: si manana la escalera cambia,
 * este test falla y obliga a actualizar la nota, que es lo que se quiere.
 * Se mira SOLO la nota, no el fichero entero: fuera de ella "trabajas"
 * contiene "baja" y la palabra "media" sale en otros sentidos.
 */
test('14b. la nota del rol de testing nombra la escalera real, sin inventarse niveles', async () => {
  const { body } = parseFrontmatter(await leerTexto('brainstorm-testing.md'));
  const nota = normalizar(entre(body, '## Nota sobre este rol en concreto', '\n## '));
  assert.notEqual(nota, '', 'brainstorm-testing.md: no se puede aislar la nota del rol');

  const faltan = TASK_COMPLEXITIES.filter(
    (nivel) => !new RegExp(`\\b${nivel}\\b`, 'i').test(nota)
  );
  assert.deepEqual(
    faltan,
    [],
    `la nota no nombra ${faltan.join(', ')} de la escalera de complejidad ` +
      `(${TASK_COMPLEXITIES.join(', ')}): describe la degradacion sobre una escalera ` +
      'que no es la que valida el plugin'
  );

  assert.equal(
    /\bbajas?\b/i.test(nota),
    false,
    'la nota nombra el nivel "baja", que no esta en la escalera: ' +
      `los niveles son ${TASK_COMPLEXITIES.join(', ')}`
  );

  // Hasta aqui, la asercion se satisface con una ENUMERACION decorativa:
  // la nota abre listando los cinco niveles, y esa lista sola ya la daba
  // por buena aunque el tramo de degradacion dijera lo contrario de lo
  // que dice la tabla de agentes. Verificado en la ronda 3: mover el
  // tramo de "media y alta" a "trivial y simple" dejaba la suite entera
  // verde, con la nota degradando el rol justo en los dos niveles donde
  // la tabla da 0 y 1 agentes (menor 3).
  //
  // Asi que se asevera EL TRAMO, y contra la tabla en vez de contra
  // literales: se degrada donde el presupuesto ya no da para los cuatro
  // roles pero pasa de uno, y se conserva donde caben los cuatro.
  const tabla = await agentesPorNivel();
  const totalDeRoles = FICHEROS.length;
  const tramoEsperado = TASK_COMPLEXITIES.filter((n) => {
    const agentes = tabla[n] as number;
    return agentes > 1 && agentes < totalDeRoles;
  });
  const conservaEsperado = TASK_COMPLEXITIES.filter((n) => tabla[n] === totalDeRoles);
  const reparto = TASK_COMPLEXITIES.map((n) => `${n}=${String(tabla[n])}`).join(', ');
  // Guards de no-vacuidad: sin ellos, una tabla degenerada dejaria las
  // dos comparaciones de abajo satisfechas contra listas vacias.
  assert.ok(tramoEsperado.length > 0, `la tabla no deja ningun nivel donde degradar (${reparto})`);
  assert.equal(
    conservaEsperado.length,
    1,
    `la tabla no deja exactamente un nivel con los ${totalDeRoles} roles (${reparto})`
  );

  const nivelesNombradosEn = (texto: string): string[] =>
    TASK_COMPLEXITIES.filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(texto));

  const declaracion = /tramo[^*]*\*\*([^*]+)\*\*/.exec(nota);
  assert.ok(
    declaracion !== null,
    'la nota no declara en negrita el tramo de complejidad donde este rol se degrada'
  );
  assert.deepEqual(
    nivelesNombradosEn(declaracion[1] as string),
    [...tramoEsperado],
    `la nota degrada el rol en "${String(declaracion[1])}", pero segun la tabla de agentes el ` +
      `presupuesto solo aprieta en ${tramoEsperado.join(' y ')} (${reparto})`
  );

  const frasesQueConservan = frasesDe(nota).filter((f) => /\bse conserva\b/i.test(f));
  assert.equal(
    frasesQueConservan.length,
    1,
    'la nota no dice, en una sola frase, en que nivel se conserva el rol como agente propio'
  );
  assert.deepEqual(
    nivelesNombradosEn(frasesQueConservan[0] as string),
    [...conservaEsperado],
    `la nota conserva el rol en "${String(frasesQueConservan[0])}", y la tabla solo deja sitio a ` +
      `los ${totalDeRoles} roles en ${conservaEsperado.join(', ')} (${reparto})`
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

// --- 1b. El unificador -------------------------------------------------
//
// Lo de arriba comprueba que el fichero EXISTE y esta bien formado. Lo de
// aqui comprueba que dice lo que tiene que decir, porque un unificador
// bien formado que promedie en silencio es peor que no tenerlo: produce
// un plan que se lee como acuerdo y que nadie vuelve a mirar.
//
// Estas cuatro instrucciones no son estilo: son las mismas que la
// peticion generada le entrega al agente. Si el fichero no las repite, el
// agente y la peticion que lo invoca se contradicen, y quien manda es el
// fichero (es lo que Claude Code carga como system prompt del subagente).

const leerUnificador = async (): Promise<string> =>
  normalizar(parseFrontmatter(await leerTexto(FICHERO_UNIFICADOR)).body);

test('15b. el unificador no promedia, atribuye, y trata la unanimidad como alarma', async () => {
  const plano = await leerUnificador();

  assert.ok(
    plano.includes('No promedias'),
    `${FICHERO_UNIFICADOR}: no deja escrito que no promedia. Es la instruccion entera ` +
      'del rol: un desacuerdo resuelto con una frase intermedia que no defiende nadie ' +
      'se lee como acuerdo y el conflicto reaparece con el codigo ya escrito'
  );
  assert.ok(
    plano.includes('se atribuye a ese rol'),
    `${FICHERO_UNIFICADOR}: no obliga a atribuir cada afirmacion al rol que la trajo; ` +
      'sin firma nadie puede distinguir una restriccion medida de una suposicion'
  );
  assert.ok(
    plano.includes('una alarma, no una nota de calidad'),
    `${FICHERO_UNIFICADOR}: no dice que la unanimidad entre roles sea una alarma. ` +
      'Si nadie discrepa, o recibieron el mismo contexto o alguno no hizo su trabajo'
  );
});

test('15c. el unificador dice que hacer con una salida que falta', async () => {
  const plano = await leerUnificador();
  assert.ok(
    plano.includes('escribe en el plan cuál faltó'),
    `${FICHERO_UNIFICADOR}: no dice que hacer cuando una salida falta o viene vacia. ` +
      'Seguir con las que haya y nombrar la que falto es lo que separa un plan con un ' +
      'punto de vista menos de un plan que finge estar completo'
  );
});

/**
 * El caso de UN SOLO rol no es una rareza que valga la pena dejar sin
 * escribir: la tabla de agentes de la heuristica lo produce por diseño en
 * los niveles mas baratos. Ahi no hay desacuerdo posible, asi que las dos
 * instrucciones anteriores —resolver desacuerdos, y leer la unanimidad
 * como alarma— se vuelven trampas: un unificador que las aplique a rajatabla
 * inventa un conflicto o denuncia una alarma que no existe.
 *
 * El que la tabla produzca ese caso se DERIVA, no se afirma: si manana
 * ningun nivel resuelve un solo rol, la guardia falla y obliga a revisar
 * si esta seccion del fichero sigue describiendo algo real.
 */
test('15d. el unificador cubre el caso de un solo rol, que la heuristica produce', async () => {
  const tabla = await agentesPorNivel();
  const conUnSoloRol = TASK_COMPLEXITIES.filter((n) => tabla[n] === 1);
  const reparto = TASK_COMPLEXITIES.map((n) => `${n}=${String(tabla[n])}`).join(', ');
  assert.ok(
    conUnSoloRol.length > 0,
    `ningun nivel de complejidad resuelve un solo rol (${reparto}): la seccion del ` +
      'unificador que trata ese caso describe algo que ya no ocurre'
  );

  const plano = await leerUnificador();
  assert.match(
    plano,
    /un solo rol/i,
    `${FICHERO_UNIFICADOR}: no menciona el caso de un solo rol, que la heuristica ` +
      `produce en ${conUnSoloRol.join(', ')}`
  );
  assert.ok(
    plano.includes('no hay desacuerdo posible'),
    `${FICHERO_UNIFICADOR}: con un solo rol no hay desacuerdo posible, y el fichero no ` +
      'lo dice: el agente acabaria inventandose uno o disparando la alarma de unanimidad'
  );
  assert.ok(
    plano.includes('contrastar la propuesta contra el enunciado'),
    `${FICHERO_UNIFICADOR}: no dice que hacer EN LUGAR de buscar desacuerdos cuando solo ` +
      'hay un rol. Sin eso el caso queda descrito por la negativa y el plan sale vacio'
  );
});

test('15e. el unificador deja el checkpoint humano como obligatorio y no aprueba el plan', async () => {
  const plano = await leerUnificador();
  assert.ok(
    plano.includes('El checkpoint humano es obligatorio'),
    `${FICHERO_UNIFICADOR}: no declara obligatorio el checkpoint humano`
  );
  assert.ok(
    plano.includes('no apruebas nada'),
    `${FICHERO_UNIFICADOR}: no deja escrito que el propio agente no aprueba el plan. ` +
      'Un agente que se autoaprueba el plan convierte el checkpoint en un tramite'
  );
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
    //     cerrar en description), se valida, y se restaura. El unificador
    //     entra en la ronda: que el validador descubra los cuatro roles
    //     no demuestra que descubra un quinto fichero de la carpeta.
    for (const fichero of AGENTES) {
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
