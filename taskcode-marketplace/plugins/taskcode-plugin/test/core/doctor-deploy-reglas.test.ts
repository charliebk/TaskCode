/**
 * TASK-068: los detectores puros de las sondas de configuracion de doctor-deploy
 * (puntos 37 a 43). Cada uno con su par «detecta» / «no da falso positivo» y las
 * variantes que un parser linea a linea puede perder (reglas en varias lineas, RLS
 * en otra migracion, Dockerfile multietapa, CRLF...). La integracion contra repos
 * Git reales esta en test/commands/doctor-deploy-config.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  condicionAbierta,
  contrasenaLiteralCompose,
  detectarAccionesSinSha,
  detectarContrasenasCompose,
  detectarDockerfile,
  detectarFirebaseAbierto,
  detectarPullRequestTarget,
  detectarTablasSinRls,
  detectarTokensGestor,
  instruccionesDockerfile,
  nombreTablaSql,
  PATRON,
  problemaUses,
  usaPullRequestTarget,
  type Detector,
  type HallazgoRegla,
} from '../../src/core/doctor-deploy-reglas.js';

const uno = (detector: Detector, ruta: string, contenido: string): HallazgoRegla[] => detector([{ ruta, contenido }]);

/** Ninguna subcadena de 8 o mas caracteres del valor en el texto. */
function assertSinValor(texto: string, valor: string): void {
  for (let i = 0; i + 8 <= valor.length; i++) assert.ok(!texto.includes(valor.slice(i, i + 8)), `contiene "${valor.slice(i, i + 8)}"`);
}

// ---------------------------------------------------------------------
// 37 reglas-firebase-abiertas
// ---------------------------------------------------------------------

const firestore = (cuerpo: string): string =>
  `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /items/{id} {\n${cuerpo}\n    }\n  }\n}\n`;

test('firebase: allow read, write: if true se detecta con su linea y su match', () => {
  const h = uno(detectarFirebaseAbierto, 'firestore.rules', firestore('      allow read, write: if true;'));
  assert.equal(h.length, 1);
  assert.equal(h[0]?.patron, PATRON.firebase);
  assert.equal(h[0]?.linea, 5);
  assert.match(h[0]?.descripcion ?? '', /allow read, write en match \/databases\/\{database\}\/documents\/items\/\{id\}/);
  assert.match(h[0]?.huella ?? '', /^[0-9a-f]{12}$/);
});

test('firebase: variantes abiertas (sin condicion, separadas, varias lineas, true ||, modo de prueba, CRLF)', () => {
  const casos: Array<[string, number]> = [
    ['      allow read, write;', 1],
    ['      allow read: if true;\n      allow write: if true;', 2],
    ['      allow read,\n            write\n        : if\n          true;', 1],
    ['      allow read: if true || request.auth != null;', 1],
    ['      allow write: if (true);', 1],
    ['      allow read, write: if request.time < timestamp.date(2030, 1, 1);', 1],
    ['      allow get, list: if true\n', 1], // sin ; antes de la llave
  ];
  for (const [cuerpo, n] of casos) assert.equal(uno(detectarFirebaseAbierto, 'firestore.rules', firestore(cuerpo)).length, n, cuerpo);
  const crlf = firestore('      allow read, write: if true;').replace(/\n/g, '\r\n');
  const h = uno(detectarFirebaseAbierto, 'storage.rules', crlf);
  assert.equal(h.length, 1);
  assert.equal(h[0]?.linea, 5);
});

test('firebase: no da falso positivo con reglas que exigen sesion, comentarios ni cadenas con //', () => {
  const casos = [
    '      allow read, write: if request.auth != null;',
    '      allow read: if request.auth.uid == id;',
    '      // allow read, write: if true;',
    '      /* allow read, write: if true; */',
    "      allow read: if resource.data.url.matches('https://.*') && request.auth != null;",
    '      allow read: if truething == 1;',
  ];
  for (const cuerpo of casos) assert.deepEqual(uno(detectarFirebaseAbierto, 'firestore.rules', firestore(cuerpo)), [], cuerpo);
  // Una cadena con // no se come el resto de la linea: la segunda regla sigue viendose.
  const h = uno(detectarFirebaseAbierto, 'firestore.rules', firestore("      allow read: if resource.data.u == 'http://x'; allow write: if true;"));
  assert.equal(h.length, 1);
  assert.match(h[0]?.descripcion ?? '', /allow write/);
});

test('firebase: condicionAbierta', () => {
  assert.equal(condicionAbierta(undefined), 'sin condicion');
  assert.equal(condicionAbierta(' true '), 'if true');
  assert.equal(condicionAbierta('((true))'), 'if true');
  assert.equal(condicionAbierta('(a) || (b)'), null);
  assert.equal(condicionAbierta('request.auth != null'), null);
  assert.match(condicionAbierta('request.time < timestamp.date(2024, 5, 1)') ?? '', /modo de prueba/);
});

test('firebase: database.rules.json con ".read": true (tambien en una ruta anidada y como cadena)', () => {
  const h = uno(detectarFirebaseAbierto, 'database.rules.json', '{\n  "rules": {\n    ".read": true,\n    ".write": "auth != null",\n    "users": { "$uid": { ".write": "true" } }\n  }\n}\n');
  assert.equal(h.length, 2);
  assert.equal(h[0]?.linea, 3);
  assert.match(h[0]?.descripcion ?? '', /"\.read": true en \//);
  assert.match(h[1]?.descripcion ?? '', /"\.write": true en \/users\/\$uid/);
  assert.notEqual(h[0]?.huella, h[1]?.huella);
});

test('firebase: database.rules.json cerrado no da nada', () => {
  assert.deepEqual(uno(detectarFirebaseAbierto, 'database.rules.json', '{"rules":{".read":"auth != null",".write":false}}'), []);
});

// ---------------------------------------------------------------------
// 38 migraciones-sin-rls
// ---------------------------------------------------------------------

const M1 = 'supabase/migrations/20240101000000_init.sql';
const M2 = 'supabase/migrations/20240102000000_rls.sql';

test('rls: una tabla sin enable row level security se detecta en la migracion que la crea', () => {
  const h = detectarTablasSinRls([{ ruta: M1, contenido: '-- inicio\ncreate table public.perfiles (\n  id uuid primary key\n);\n' }]);
  assert.equal(h.length, 1);
  assert.equal(h[0]?.fichero, M1);
  assert.equal(h[0]?.linea, 2);
  assert.match(h[0]?.descripcion ?? '', /public\.perfiles/);
});

test('rls: el RLS activado en una migracion POSTERIOR cuenta (el conjunto, no fichero a fichero), en cualquier orden de entrada', () => {
  const crear = { ruta: M1, contenido: 'create table perfiles (id int);\n' };
  const activar = { ruta: M2, contenido: 'alter table public.perfiles enable row level security;\n' };
  assert.deepEqual(detectarTablasSinRls([crear, activar]), []);
  assert.deepEqual(detectarTablasSinRls([activar, crear]), []);
  // Solo la primera migracion: falla.
  assert.equal(detectarTablasSinRls([crear]).length, 1);
});

test('rls: mayusculas, comillas y esquema', () => {
  assert.deepEqual(
    detectarTablasSinRls([{ ruta: M1, contenido: 'CREATE TABLE IF NOT EXISTS Perfiles (id int);\nALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;\n' }]),
    []
  );
  assert.deepEqual(
    detectarTablasSinRls([{ ruta: M1, contenido: 'create table public."Users" (id int);\nalter table "public"."Users" enable row level security;\n' }]),
    []
  );
  // "Users" con comillas no es users: sigue sin RLS.
  const h = detectarTablasSinRls([{ ruta: M1, contenido: 'create table public."Users" (id int);\nalter table public.users enable row level security;\n' }]);
  assert.equal(h.length, 1);
  assert.match(h[0]?.descripcion ?? '', /public\.Users/);
  assert.deepEqual(nombreTablaSql('"Mi"."Tabla"'), { esquema: 'Mi', tabla: 'Tabla' });
  assert.deepEqual(nombreTablaSql('Tabla'), { esquema: 'public', tabla: 'tabla' });
});

test('rls: esquemas internos o privados no cuentan; uno propio si', () => {
  assert.deepEqual(detectarTablasSinRls([{ ruta: M1, contenido: 'create table private.x (id int);\ncreate table auth.y (id int);\n' }]), []);
  assert.equal(detectarTablasSinRls([{ ruta: M1, contenido: 'create table api.items (id int);\n' }]).length, 1);
});

test('rls: disable posterior, drop, rename y set schema', () => {
  const c = (sql: string): number => detectarTablasSinRls([{ ruta: M1, contenido: sql }]).length;
  assert.equal(c('create table t (id int);\nalter table t enable row level security;\nalter table t disable row level security;\n'), 1);
  assert.equal(c('create table t (id int);\ndrop table if exists t;\n'), 0);
  assert.equal(c('create table a (id int);\nalter table a enable row level security;\nalter table a rename to b;\n'), 0);
  assert.equal(c('create table a (id int);\nalter table a rename to b;\nalter table b enable row level security;\n'), 0);
  assert.equal(c('create table a (id int);\nalter table a set schema private;\n'), 0);
  assert.equal(c('create table t (id int);\nalter table t add column x int, enable row level security;\n'), 0);
});

test('rls: no se deja enganar por comentarios, cadenas, cuerpos $$ ni tablas temporales', () => {
  const c = (sql: string): number => detectarTablasSinRls([{ ruta: M1, contenido: sql }]).length;
  assert.equal(c('create table t (id int);\n-- alter table t enable row level security;\n'), 1);
  assert.equal(c('create table t (id int);\n/* alter table t enable row level security; */\n'), 1);
  assert.equal(c("insert into notas values ('create table x (id int)');\n"), 0);
  assert.equal(c('create function f() returns void as $$ begin create table x (id int); end; $$ language plpgsql;\n'), 0);
  assert.equal(c('create temporary table t (id int);\ncreate temp table u (id int);\n'), 0);
  // CRLF
  assert.equal(c('create table t (id int);\r\nalter table t enable row level security;\r\n'), 0);
});

// ---------------------------------------------------------------------
// 39 tokens-en-ficheros-de-gestor
// ---------------------------------------------------------------------

/** Un token que ningun patron generico de secretos-arbol reconoce. */
const TOKEN_GENERICO = 'Hk3Ns8Qw2Lp5Vx9Rt4Yz7BmQ1';
const NPM_TOKEN = 'npm_' + 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8';

test('tokens: _authToken literal en .npmrc se detecta enmascarado, y los patrones genericos no lo cubren', () => {
  const h = uno(detectarTokensGestor, '.npmrc', `registry=https://registry.npmjs.org/\n//registry.npmjs.org/:_authToken=${TOKEN_GENERICO}\n`);
  assert.equal(h.length, 1);
  assert.equal(h[0]?.patron, PATRON.token);
  assert.equal(h[0]?.linea, 2);
  assert.equal(h[0]?.cubiertoPor, undefined);
  assert.match(h[0]?.descripcion ?? '', /clave \/\/registry\.npmjs\.org\/:_authToken/);
  assert.match(h[0]?.muestra ?? '', /\*\*\*\* \(25 caracteres\)/);
  assertSinValor(JSON.stringify(h), TOKEN_GENERICO);
});

test('tokens: .npmrc con ${NPM_TOKEN}, comentado o sin credencial no da nada', () => {
  for (const c of ['//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n', `# //r/:_authToken=${TOKEN_GENERICO}\n`, `; _auth=${TOKEN_GENERICO}\n`, 'always-auth=true\n', '_authToken=\n']) {
    assert.deepEqual(uno(detectarTokensGestor, '.npmrc', c), [], c);
  }
});

test('tokens: un npm_ que ya caza secretos-arbol se marca como cubierto (no doble FALLA)', () => {
  const h = uno(detectarTokensGestor, 'pkg/.npmrc', `_authToken="${NPM_TOKEN}"\n`);
  assert.equal(h.length, 1);
  assert.equal(h[0]?.cubiertoPor, 'secretos-arbol (patron npm-token)');
});

test('tokens: .pypirc con password literal, y %(x)s o ${X} no', () => {
  const h = uno(detectarTokensGestor, '.pypirc', `[distutils]\nindex-servers = pypi\n\n[pypi]\nusername = __token__\npassword = ${TOKEN_GENERICO}\n`);
  assert.equal(h.length, 1);
  assert.equal(h[0]?.linea, 6);
  assert.match(h[0]?.descripcion ?? '', /\[pypi\] password/);
  assert.deepEqual(uno(detectarTokensGestor, '.pypirc', '[pypi]\npassword = ${PYPI_TOKEN}\n'), []);
  assert.deepEqual(uno(detectarTokensGestor, '.pypirc', '[pypi]\npassword = %(token)s\n'), []);
});

test('tokens: settings.xml de Maven con <password> literal; ${env.X}, cifrada {..}, comentada o fuera de Maven no', () => {
  const xml = (pw: string): string => `<settings>\n  <servers>\n    <server>\n      <id>central</id>\n      <password>${pw}</password>\n    </server>\n  </servers>\n</settings>\n`;
  const h = uno(detectarTokensGestor, '.m2/settings.xml', xml('s3cretoMaven99'));
  assert.equal(h.length, 1);
  assert.equal(h[0]?.linea, 5);
  assert.match(h[0]?.descripcion ?? '', /server central <password>/);
  assertSinValor(JSON.stringify(h), 's3cretoMaven99');
  assert.deepEqual(uno(detectarTokensGestor, 'settings.xml', xml('${env.MAVEN_PASSWORD}')), []);
  assert.deepEqual(uno(detectarTokensGestor, 'settings.xml', xml('{COQLCE6DU6GtcS5P=}')), []);
  assert.deepEqual(uno(detectarTokensGestor, 'settings.xml', '<settings><!-- <password>s3cretoMaven99</password> --></settings>'), []);
  assert.deepEqual(uno(detectarTokensGestor, 'app/settings.xml', '<config><password>s3cretoMaven99</password></config>'), []);
});

// ---------------------------------------------------------------------
// 40 compose-con-contrasenas
// ---------------------------------------------------------------------

const PASS = 'Pg7xQ2mLw9Zr4Tv8';

test('compose: contrasena literal en forma de mapa y de lista, enmascarada', () => {
  const yml = `services:\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: "${PASS}"\n  cache:\n    environment:\n      - REDIS_PASSWORD=${PASS}\n      - "API_TOKEN=${PASS}" # dev\n`;
  const h = uno(detectarContrasenasCompose, 'docker-compose.yml', yml);
  assert.deepEqual(h.map((x) => x.linea), [5, 8, 9]);
  for (const x of h) {
    assert.equal(x.patron, PATRON.compose);
    assert.match(x.muestra ?? '', /\*\*\*\* \(16 caracteres\)/);
  }
  assert.match(h[0]?.descripcion ?? '', /POSTGRES_PASSWORD/);
  assertSinValor(JSON.stringify(h), PASS);
});

test('compose: ${X}, $X, *_FILE, booleanos, comentarios y claves que no son secretas no cuentan', () => {
  const yml = [
    'services:',
    '  db:',
    '    image: postgres:16',
    '    environment:',
    '      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}',
    '      POSTGRES_PASSWORD_FILE: /run/secrets/db',
    '      MYSQL_ALLOW_EMPTY_PASSWORD: "yes"',
    '      MYSQL_RANDOM_ROOT_PASSWORD: yes',
    '      DB_PASS: $DB_PASS',
    '      password: ${DB_PASSWORD:-cambiame}',
    `      # POSTGRES_PASSWORD: ${PASS}`,
    '      BYPASS: abcdefghij',
    '      - TOKEN=${TOKEN}',
    '      SECRET_KEY: |',
    '',
  ].join('\n');
  assert.deepEqual(uno(detectarContrasenasCompose, 'compose.yaml', yml), []);
  assert.equal(contrasenaLiteralCompose('POSTGRES_PASSWORD', ' x1 '), 'x1');
  assert.equal(contrasenaLiteralCompose('POSTGRES_PASSWORD', '1234'), '1234');
  assert.equal(contrasenaLiteralCompose('POSTGRES_USER', 'admin'), null);
});

// ---------------------------------------------------------------------
// 41 ci-pull-request-target
// ---------------------------------------------------------------------

const PASO_CHECKOUT_PR = '      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n';

test('pr-target: pull_request_target con checkout del head del PR se detecta (escalar, lista en linea, bloque)', () => {
  const casos = [
    `on: pull_request_target\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n${PASO_CHECKOUT_PR}`,
    `on: [push, pull_request_target]\njobs:\n  t:\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: \${{ github.head_ref }}\n`,
    `on:\n  pull_request_target:\n    types: [opened]\njobs:\n  t:\n    steps:\n      - run: gh pr checkout \${{ github.event.number }}\n`,
    `"on":\n  pull_request_target: {}\njobs:\n  t:\n    steps:\n      - run: git fetch origin pull/\${{ github.event.number }}/head\n`,
    `on: pull_request_target\r\njobs:\r\n  t:\r\n    steps:\r\n      - uses: actions/checkout@v4\r\n        with:\r\n          ref: refs/pull/\${{ github.event.number }}/merge\r\n`,
  ];
  for (const c of casos) {
    const h = uno(detectarPullRequestTarget, '.github/workflows/ci.yml', c);
    assert.equal(h.length, 1, c);
    assert.equal(h[0]?.patron, PATRON.prTarget);
    assert.equal(h[0]?.huella, null);
  }
});

test('pr-target: sin checkout del PR, con pull_request o con el evento comentado no da nada', () => {
  const casos = [
    'on: pull_request_target\njobs:\n  t:\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo hola\n',
    `on: pull_request\njobs:\n  t:\n    steps:\n${PASO_CHECKOUT_PR}`,
    `# on: pull_request_target\non: push\njobs:\n  t:\n    steps:\n${PASO_CHECKOUT_PR}`,
  ];
  for (const c of casos) assert.deepEqual(uno(detectarPullRequestTarget, '.github/workflows/ci.yml', c), [], c);
  assert.equal(usaPullRequestTarget('on:\n  pull_request_target:\n'), true);
  assert.equal(usaPullRequestTarget('on: [pull_request_target]'), true);
  assert.equal(usaPullRequestTarget('on: [pull_request]\n# pull_request_target'), false);
});

// ---------------------------------------------------------------------
// 42 acciones-ci-sin-sha
// ---------------------------------------------------------------------

const SHA = 'a'.repeat(8) + '0123456789abcdef0123456789abcdef';

test('acciones: @v4 de terceros se detecta; SHA, ./local, docker://, actions/ y github/ no', () => {
  const yml = [
    'jobs:',
    '  b:',
    '    steps:',
    '      - uses: docker/build-push-action@v5',
    `      - uses: docker/login-action@${SHA} # v3`,
    '      - uses: ./.github/actions/local',
    '      - uses: docker://alpine:3.20',
    '      - uses: actions/checkout@v4',
    '      - uses: github/codeql-action/init@v3',
    '      - uses: "tj-actions/changed-files@main"',
    '      # - uses: otro/accion@v1',
    '  reusable:',
    '    uses: org/repo/.github/workflows/ci.yml@v1',
    '      - uses: alguien/accion',
  ].join('\n');
  const h = uno(detectarAccionesSinSha, '.github/workflows/b.yml', yml);
  assert.deepEqual(h.map((x) => x.linea), [4, 10, 13, 14]);
  assert.match(h[0]?.descripcion ?? '', /docker\/build-push-action@v5 fijada a "v5"/);
  assert.match(h[3]?.descripcion ?? '', /sin version/);
  assert.notEqual(h[0]?.huella, h[1]?.huella);
  assert.equal(problemaUses(`x/y@${SHA}`), null);
  assert.equal(problemaUses(`x/y@${SHA.slice(0, 39)}`) !== null, true, 'un SHA corto no vale');
});

// ---------------------------------------------------------------------
// 43 dockerfile-sin-user
// ---------------------------------------------------------------------

const df = (contenido: string): HallazgoRegla[] => uno(detectarDockerfile, 'Dockerfile', contenido);

test('dockerfile: sin USER se detecta en la linea del FROM final', () => {
  const h = df('FROM node:22\nWORKDIR /app\nCOPY . .\nCMD ["node", "index.js"]\n');
  assert.equal(h.length, 1);
  assert.equal(h[0]?.patron, PATRON.sinUser);
  assert.equal(h[0]?.linea, 1);
  assert.equal(h[0]?.huella, null);
});

test('dockerfile: multietapa con USER solo en el builder FALLA; con USER en la final, no', () => {
  const builder = 'FROM node:22 AS build\nUSER node\nRUN npm ci\n';
  const h = df(`${builder}FROM nginx:1.27\nCOPY --from=build /app /usr/share/nginx/html\n`);
  assert.equal(h.length, 1);
  assert.equal(h[0]?.linea, 4);
  assert.match(h[0]?.descripcion ?? '', /etapa final \(FROM nginx:1\.27\)/);
  assert.deepEqual(df(`${builder}FROM nginx:1.27\nUSER nginx\n`), []);
});

test('dockerfile: la etapa final hereda el USER de la etapa en que se basa (FROM <alias>)', () => {
  assert.deepEqual(df('FROM node:22 AS base\nuser app\nFROM base AS final\nCMD ["x"]\n'), []);
  assert.equal(df('FROM node:22 AS base\nFROM base\nCMD ["x"]\n').length, 1);
});

test('dockerfile: USER root o 0 en la etapa final FALLA; minusculas valen; imagen nonroot no exige USER', () => {
  assert.equal(df('FROM alpine\nUSER app\nUSER root\n').length, 1);
  assert.equal(df('FROM alpine\nUSER 0:0\n').length, 1);
  assert.deepEqual(df('from alpine\nuser app\n'), []);
  assert.deepEqual(df('FROM gcr.io/distroless/nodejs22-debian12:nonroot\nCOPY . /app\n'), []);
});

test('dockerfile: continuacion con \\, CRLF, comentarios, heredoc y directiva escape', () => {
  // "USER root" dentro de un RUN continuado no es una instruccion USER.
  assert.equal(df('FROM alpine\r\nRUN echo hola \\\r\n  USER root\r\n').length, 1);
  assert.deepEqual(df('FROM alpine\r\nRUN apk add \\\r\n  # comentario dentro\r\n  curl\r\nUSER app\r\n'), []);
  assert.equal(df('FROM alpine\n# USER app\n').length, 1);
  assert.equal(df('FROM alpine\nRUN <<EOF\nUSER app\nEOF\n').length, 1);
  assert.deepEqual(df('# escape=`\nFROM alpine\nRUN echo `\n  hola\nUSER app\n'), []);
  const ins = instruccionesDockerfile('FROM a\nRUN x \\\n  y\nUSER z\n');
  assert.deepEqual(ins.map((i) => [i.palabra, i.linea]), [['FROM', 1], ['RUN', 2], ['USER', 4]]);
});

test('dockerfile: ADD de una URL se detecta sin mostrar credenciales ni query; --checksum y ficheros locales no', () => {
  const h = df('FROM alpine\nADD https://usuario:clave123@ejemplo.org/f.tgz?token=abcdef123 /tmp/\nUSER app\n');
  assert.equal(h.length, 1);
  assert.equal(h[0]?.patron, PATRON.addUrl);
  assert.equal(h[0]?.linea, 2);
  assert.match(h[0]?.descripcion ?? '', /https:\/\/ejemplo\.org\/f\.tgz/);
  assert.ok(!(h[0]?.descripcion ?? '').includes('clave123'));
  assert.ok(!(h[0]?.descripcion ?? '').includes('abcdef123'));
  assert.deepEqual(df('FROM alpine\nADD --checksum=sha256:abc https://ejemplo.org/f.tgz /tmp/\nADD ./src /app\nUSER app\n'), []);
});

test('dockerfile: sin ninguna instruccion FROM tambien es un hallazgo', () => {
  assert.equal(df('# vacio\n').length, 1);
});
