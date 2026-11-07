/**
 * TASK-089: ningun fichero versionado lleva un literal con forma de clave.
 *
 * El defecto que motiva este test: la proteccion de push de GitHub (secret
 * scanning) bloqueo el push de la 0.11.0 por una clave de Stripe FALSA de un
 * test, y hubo que reescribir el historial local. GitHub no distingue una
 * clave falsa de una real: mira la forma. Asi que el remedio es que ninguna
 * aparezca entera en el codigo; las de los tests se arman troceadas en
 * test/helpers/claves-falsas.ts.
 *
 * Como lo comprueba: un solo `git ls-files -z` desde la raiz del repo y la
 * lectura de cada fichero (los binarios y los que ya no estan en disco se
 * saltan). Los patrones son propios de este test y tienen la forma de los de
 * push protection; NO se reutiliza buscarSecretos de src/core/secretos.ts,
 * que sirve para otra cosa (auditar repos de usuario, con clases como
 * «ejemplo») y haria que el guardian dependiera del codigo que vigila.
 *
 * El mensaje de fallo da fichero, linea y patron, nunca el valor.
 *
 * Con su CONTRAPRUEBA: la misma funcion de escaneo sobre textos armados con
 * las claves troceadas tiene que detectar cada patron. Sin ella, un verde no
 * distingue «no hay literales» de «el test no mira nada».
 *
 * Cero dependencias: node:test, node:assert y git.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enmascarar } from '../../src/core/secretos.js';
import {
  AWS,
  AWS_EJEMPLO,
  GITHUB_TOKEN,
  PEM_CABECERA,
  PEM_PIE,
  SLACK,
  STRIPE_LIVE,
  STRIPE_TEST_EJEMPLO,
} from '../helpers/claves-falsas.js';

// Compilado, este fichero vive en dist/test/empaquetado/: tres niveles arriba
// esta la raiz del plugin y tres mas la del repo (igual que distribucion.test.ts).
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
const REPO_ROOT = path.resolve(PLUGIN_ROOT, '..', '..', '..');

/**
 * Forma de las claves que bloquea la proteccion de push. Se erra por exceso.
 * Sin `\b` delante a proposito: en el codigo fuente una clave suele ir justo
 * despues de un `\n` escrito como texto, y entre esa `n` y la clave no hay
 * limite de palabra.
 */
const PATRONES: ReadonlyArray<{ id: string; re: RegExp }> = [
  { id: 'stripe-live', re: /[sr]k_live_[0-9A-Za-z]{24,}/g },
  { id: 'stripe-test', re: /[sr]k_test_[0-9A-Za-z]{24,}/g },
  { id: 'aws-access-key', re: /(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { id: 'github-token', re: /gh[pousr]_[A-Za-z0-9]{36,}/g },
  { id: 'github-pat', re: /github_pat_[A-Za-z0-9_]{40,}/g },
  { id: 'slack-token', re: /xox[abprs]-[0-9A-Za-z-]{10,}/g },
  { id: 'gitlab-token', re: /glpat-[0-9A-Za-z_-]{20,}/g },
  { id: 'npm-token', re: /npm_[0-9A-Za-z]{36}\b/g },
  { id: 'sendgrid', re: /SG\.[\w-]{22}\.[\w-]{43}\b/g },
  // Solo con cuerpo: una cabecera sola (o con «xx» dentro) no es una clave.
  { id: 'clave-privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----\s*[A-Za-z0-9+/=\r\n]{64,}/g },
];

/**
 * Valores que se toleran en CUALQUIER fichero. Solo los que GitHub ignora de
 * forma observada: un valor que bloquea no puede estar aqui, o el guardian lo
 * dejaria pasar en un fichero nuevo (TASK-090: asi se colo la clave de ejemplo
 * de Stripe en el plan de TASK-089 y GitHub rechazo el push).
 */
const PERMITIDOS_EN_CUALQUIER_FICHERO: ReadonlyMap<string, string> = new Map([
  [AWS_EJEMPLO, 'ejemplo canonico de la documentacion de AWS; GitHub no lo marco en el push que si bloqueo el de Stripe'],
]);

/**
 * Parejas exactas fichero+valor: ficheros historicos YA publicados en origin
 * que llevan el valor entero y no se editan (no se reescribe historial). La
 * ruta es la de `git ls-files` y se compara con ===, sin globs ni prefijos. El
 * mismo valor en cualquier otro fichero es rojo. Una pareja que deja de usarse
 * tambien es rojo: hay que quitarla.
 */
const EXCEPCIONES_HISTORICAS: ReadonlyArray<{ fichero: string; valor: string; motivo: string }> = [
  {
    fichero: 'tareas/04-terminadas/TASK-066/revision/peticion-revision-1.md',
    valor: STRIPE_TEST_EJEMPLO,
    motivo: 'diff de TASK-066, en origin antes de que existiera el guardian',
  },
  {
    fichero: 'tareas/04-terminadas/TASK-066/revision/peticion-revision-1.md',
    valor: SLACK,
    motivo: 'diff de TASK-066, en origin antes de que existiera el guardian',
  },
  {
    fichero: 'tareas/04-terminadas/TASK-089/planificacion/plan-final.md',
    valor: STRIPE_TEST_EJEMPLO,
    motivo: 'plan de TASK-089; la persona lo permitio en GitHub en vez de reescribir historial',
  },
  {
    fichero: 'tareas/04-terminadas/TASK-089/revision/peticion-revision-1.md',
    valor: STRIPE_TEST_EJEMPLO,
    motivo: 'diff de TASK-089; permitido en GitHub junto con su plan',
  },
  {
    fichero: 'tareas/04-terminadas/TASK-089/revision/peticion-revision-1.md',
    valor: SLACK,
    motivo: 'diff de TASK-089 (las lineas quitadas de secretos.test.ts)',
  },
];

interface Hallazgo {
  fichero: string;
  linea: number;
  patron: string;
  muestra: string;
}

/** true si `valor` se tolera en `fichero`; anota en `usadas` la pareja historica que lo permite. */
function permitido(fichero: string, valor: string, usadas?: Set<number>): boolean {
  if (PERMITIDOS_EN_CUALQUIER_FICHERO.has(valor)) return true;
  const i = EXCEPCIONES_HISTORICAS.findIndex((e) => e.fichero === fichero && e.valor === valor);
  if (i === -1) return false;
  usadas?.add(i);
  return true;
}

function escanear(fichero: string, texto: string, usadas?: Set<number>): Hallazgo[] {
  const hallazgos: Hallazgo[] = [];
  for (const { id, re } of PATRONES) {
    re.lastIndex = 0;
    for (const m of texto.matchAll(re)) {
      if (permitido(fichero, m[0], usadas)) continue;
      const linea = texto.slice(0, m.index).split('\n').length;
      hallazgos.push({ fichero, linea, patron: id, muestra: enmascarar(m[0]) });
    }
  }
  return hallazgos;
}

function esBinario(buf: Buffer): boolean {
  return buf.subarray(0, 8000).includes(0);
}

function ficherosVersionados(): string[] | null {
  const r = spawnSync('git', ['ls-files', '-z'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) return null;
  return r.stdout.split('\0').filter((f) => f !== '');
}

test('ningun fichero versionado lleva un literal con forma de clave', (t) => {
  const ficheros = ficherosVersionados();
  if (ficheros === null) return t.skip('REPO_ROOT no es un repo git');
  assert.ok(ficheros.length > 100, `git ls-files devolvio solo ${ficheros.length} ficheros: el test no esta mirando el repo`);

  const hallazgos: Hallazgo[] = [];
  const usadas = new Set<number>();
  let leidos = 0;
  for (const rel of ficheros) {
    let buf: Buffer;
    try {
      buf = readFileSync(path.join(REPO_ROOT, rel));
    } catch {
      continue; // borrado en el working tree, submodulo o directorio
    }
    if (esBinario(buf)) continue;
    leidos++;
    hallazgos.push(...escanear(rel, buf.toString('utf8'), usadas));
  }
  assert.ok(leidos > 100, `solo se leyeron ${leidos} ficheros de texto`);
  assert.deepEqual(
    hallazgos.map((h) => `${h.fichero}:${h.linea} ${h.patron} ${h.muestra}`),
    [],
    'hay literales con forma de clave: trocealos (ver test/helpers/claves-falsas.ts)'
  );
  const muertas = EXCEPCIONES_HISTORICAS.filter((_, i) => !usadas.has(i)).map(
    (e) => `${e.fichero} ${enmascarar(e.valor)}`
  );
  assert.deepEqual(muertas, [], 'excepcion historica muerta (el fichero ya no lleva ese valor o se movio): quitala');
});

test('contraprueba: una excepcion historica solo vale en su fichero', () => {
  const historico = 'tareas/04-terminadas/TASK-066/revision/peticion-revision-1.md';
  const nuevo = 'tareas/04-terminadas/TASK-090/planificacion/plan-final.md';
  for (const [valor, patron] of [
    [STRIPE_TEST_EJEMPLO, 'stripe-test'],
    [SLACK, 'slack-token'],
  ] as const) {
    const texto = `uno\n'a\\n${valor}'\n`;
    assert.deepEqual(escanear(historico, texto), [], `${patron}: en su fichero historico se tolera`);
    const h = escanear(nuevo, texto);
    assert.deepEqual(
      h.map((x) => [x.fichero, x.linea, x.patron]),
      [[nuevo, 2, patron]],
      `${patron}: en otro fichero es rojo con fichero y linea`
    );
    assert.ok(!JSON.stringify(h).includes(valor.slice(6)), 'el valor crudo no puede salir en el informe');
  }
});

test('contraprueba: el escaneo detecta cada patron con fichero y linea, sin mostrar el valor', () => {
  const npm = 'npm_' + 'A1b2C3d4E5'.repeat(3) + 'f6G7h8';
  const gitlab = 'glpat-' + 'Ab12Cd34Ef56Gh78Ij90';
  const pat = 'github_pat_' + '11ABCDEFG0'.repeat(5);
  const sendgrid = 'SG.' + 'a'.repeat(22) + '.' + 'b'.repeat(43);
  const stripeTest = 'sk_test_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';
  const slack = 'xoxp' + '-9876543210-zyxwvutsrq';
  const cuerpo = 'MIIEowIBAAKCAQEA'.repeat(5);
  const texto = [
    `STRIPE=${STRIPE_LIVE}`,
    `AWS=${AWS}`,
    GITHUB_TOKEN,
    // Pegada a un «\n» escrito como texto, como en un literal de codigo.
    `'a\\n${slack}'`,
    npm,
    gitlab,
    pat,
    sendgrid,
    stripeTest,
    `${PEM_CABECERA}\n${cuerpo}\n${PEM_PIE}`,
  ].join('\n');

  const h = escanear('x/y.txt', texto);
  assert.deepEqual(
    h.map((x) => [x.patron, x.linea]).sort(),
    [
      ['aws-access-key', 2],
      ['clave-privada', 10],
      ['github-pat', 7],
      ['github-token', 3],
      ['gitlab-token', 6],
      ['npm-token', 5],
      ['sendgrid', 8],
      ['slack-token', 4],
      ['stripe-live', 1],
      ['stripe-test', 9],
    ].sort()
  );
  for (const x of h) assert.equal(x.fichero, 'x/y.txt');
  const informe = JSON.stringify(h);
  for (const valor of [STRIPE_LIVE, AWS, GITHUB_TOKEN, slack, npm, gitlab, pat, sendgrid, stripeTest, cuerpo]) {
    assert.ok(!informe.includes(valor.slice(6)), 'el valor crudo no puede salir en el informe');
  }
});

test('contraprueba: lo permitido y lo que no es clave no se marca', () => {
  const texto = [
    // El de AWS se tolera en cualquier fichero; los historicos de Stripe y
    // Slack solo en el suyo (ver la contraprueba de excepciones historicas).
    AWS_EJEMPLO,
    `${PEM_CABECERA}\nxx\n${PEM_PIE}`,
    '-----BEGIN PUBLIC KEY-----',
    'sk_live_corta',
    "re: /sk_live_[0-9A-Za-z]{24,}/",
  ].join('\n');
  assert.deepEqual(escanear('z.txt', texto), []);
});
