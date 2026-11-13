/**
 * TASK-068: las siete sondas de configuracion de `taskctl doctor-deploy`
 * (puntos 37 a 43) contra repos Git temporales REALES. Por sonda, un par
 * «FALLA» / «OK» nombrando el id del punto; ademas NO APLICA sin ficheros, NO
 * VERIFICADO con un fichero que no se pudo leer, enmascarado en todos los
 * canales, silencios y el rechazo de un veredicto del agente para un punto que
 * ahora es determinista. Las variantes finas estan en
 * test/core/doctor-deploy-reglas.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { InformeDeploy, ResultadoPunto } from '../../src/core/doctor-deploy.js';
import {
  NODE,
  commit,
  conRepo,
  conRepoDevelop,
  ejecutar,
  ejecutarCompleto,
  escribir,
  git,
  punto,
  type OpcionesTest,
} from '../helpers/deploy-fixtures.js';
import { caso } from '../helpers/caso.js';

const informe = (raiz: string, opciones: OpcionesTest): InformeDeploy => JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;

/** Ninguna subcadena de 8 o mas caracteres del valor en el texto. */
function assertSinValor(texto: string, valor: string, canal: string): void {
  for (let i = 0; i + 8 <= valor.length; i++) {
    const v = valor.slice(i, i + 8);
    assert.ok(!texto.includes(v), `el canal "${canal}" contiene la subcadena "${v}" del secreto`);
  }
}

function assertFalla(p: ResultadoPunto, fichero: string, descripcion: RegExp): void {
  assert.equal(p.estado, 'falla', `${p.id}: ${p.motivo}`);
  assert.equal(p.metodo, 'determinista');
  assert.equal(p.origen, 'sonda');
  assert.ok(
    p.evidencias.some((e) => e.fichero === fichero && descripcion.test(e.descripcion)),
    `${p.id}: ninguna evidencia en ${fichero} con ${String(descripcion)}: ${JSON.stringify(p.evidencias)}`
  );
}

function assertOk(p: ResultadoPunto): void {
  assert.equal(p.estado, 'ok', `${p.id}: ${p.motivo} ${JSON.stringify(p.evidencias)}`);
  assert.ok(p.evidencias.length > 0, `${p.id}: OK sin evidencia`);
  assert.match(p.evidencias.map((e) => e.descripcion).join(' '), /revisado/);
}

const DOCKER: Record<string, string> = { ...NODE, Dockerfile: 'FROM node:22\nUSER node\nCMD ["node", "index.js"]\n' };
const TOKEN = 'Hk3Ns8Qw2Lp5Vx9Rt4Yz7BmQ1';
const PASS = 'Pg7xQ2mLw9Zr4Tv8';
const SHA = '0123456789abcdef0123456789abcdef01234567';

// ---------------------------------------------------------------------
// Un par FALLA / OK por sonda
// ---------------------------------------------------------------------

const firestore = (regla: string): string =>
  `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      ${regla}\n    }\n  }\n}\n`;

test('sondas de config: firebase, migraciones sin RLS, tokens de gestor y compose', async () => {
  await caso('reglas-firebase-abiertas: FALLA con allow read, write: if true; OK con una regla que exige sesion', async () => {
    await conRepo({ ...NODE, 'firestore.rules': firestore('allow read, write: if true;') }, async (raiz, opciones) => {
      assertFalla(punto(informe(raiz, opciones), 'reglas-firebase-abiertas'), 'firestore.rules', /regla abierta a cualquiera \(if true\)/);
    });
    await conRepo({ ...NODE, 'firestore.rules': firestore('allow read, write: if request.auth != null;') }, async (raiz, opciones) => {
      assertOk(punto(informe(raiz, opciones), 'reglas-firebase-abiertas'));
    });
  });
  await caso('migraciones-sin-rls: FALLA sin RLS; OK con el RLS activado en una migracion POSTERIOR', async () => {
    const crear = { 'supabase/migrations/20240101000000_init.sql': 'create table public.notas (id bigint primary key);\n' };
    await conRepo({ ...NODE, ...crear }, async (raiz, opciones) => {
      assertFalla(punto(informe(raiz, opciones), 'migraciones-sin-rls'), 'supabase/migrations/20240101000000_init.sql', /public\.notas/);
    });
    const activar = { 'supabase/migrations/20240201000000_rls.sql': 'alter table notas enable row level security;\n' };
    await conRepo({ ...NODE, ...crear, ...activar }, async (raiz, opciones) => {
      assertOk(punto(informe(raiz, opciones), 'migraciones-sin-rls'));
    });
  });
  await caso('tokens-en-ficheros-de-gestor: un _authToken que los patrones genericos NO cazan da FALLA aqui (y secretos-en-arbol sigue OK)', async () => {
    await conRepo({ ...NODE, '.npmrc': `//registry.npmjs.org/:_authToken=${TOKEN}\n` }, async (raiz, opciones) => {
      const i = informe(raiz, opciones);
      assertFalla(punto(i, 'tokens-en-ficheros-de-gestor'), '.npmrc', /credencial literal en \.npmrc/);
      assert.equal(punto(i, 'secretos-en-arbol').estado, 'ok', 'el token es generico: ninguna sonda lo contaria sin el punto 39');
    });
    await conRepo({ ...NODE, '.npmrc': '//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n' }, async (raiz, opciones) => {
      assertOk(punto(informe(raiz, opciones), 'tokens-en-ficheros-de-gestor'));
    });
  });
  await caso('compose-con-contrasenas: FALLA con una contrasena literal; OK con ${VAR} y *_FILE', async () => {
    const compose = (env: string): string => `services:\n  db:\n    image: postgres:16\n    environment:\n${env}`;
    await conRepo({ ...DOCKER, 'docker-compose.yml': compose(`      POSTGRES_PASSWORD: ${PASS}\n`) }, async (raiz, opciones) => {
      assertFalla(punto(informe(raiz, opciones), 'compose-con-contrasenas'), 'docker-compose.yml', /variable POSTGRES_PASSWORD/);
    });
    await conRepo(
      { ...DOCKER, 'docker-compose.yml': compose('      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}\n      POSTGRES_PASSWORD_FILE: /run/secrets/db\n') },
      async (raiz, opciones) => {
        assertOk(punto(informe(raiz, opciones), 'compose-con-contrasenas'));
      }
    );
  });
});

test('sondas de CI y Docker: pull_request_target, acciones sin SHA y Dockerfile sin USER', async () => {
  await caso('ci-pull-request-target: FALLA con checkout del head del PR; OK con el mismo evento sin traer su codigo', async () => {
    const flujo = (paso: string): string => `on: [pull_request_target]\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n${paso}`;
    const conRef = '      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n';
    await conRepo({ ...NODE, '.github/workflows/pr.yml': flujo(conRef) }, async (raiz, opciones) => {
      assertFalla(punto(informe(raiz, opciones), 'ci-pull-request-target'), '.github/workflows/pr.yml', /pull_request_target y trae el codigo del PR/);
    });
    await conRepo({ ...NODE, '.github/workflows/pr.yml': flujo('      - run: echo "etiquetar"\n') }, async (raiz, opciones) => {
      assertOk(punto(informe(raiz, opciones), 'ci-pull-request-target'));
    });
  });
  await caso('acciones-ci-sin-sha: FALLA con @v5 de terceros; OK con SHA, ./local y actions/checkout@v4', async () => {
    const flujo = (uses: string[]): string => `on: push\njobs:\n  b:\n    runs-on: ubuntu-latest\n    steps:\n${uses.map((u) => `      - uses: ${u}\n`).join('')}`;
    await conRepo({ ...NODE, '.github/workflows/b.yml': flujo(['docker/build-push-action@v5']) }, async (raiz, opciones) => {
      assertFalla(punto(informe(raiz, opciones), 'acciones-ci-sin-sha'), '.github/workflows/b.yml', /docker\/build-push-action@v5/);
    });
    await conRepo(
      { ...NODE, '.github/workflows/b.yml': flujo([`docker/build-push-action@${SHA}`, './.github/actions/local', 'actions/checkout@v4']) },
      async (raiz, opciones) => {
        assertOk(punto(informe(raiz, opciones), 'acciones-ci-sin-sha'));
      }
    );
  });
  await caso('dockerfile-sin-user: FALLA en un multietapa con USER solo en el builder; OK con USER en la etapa final', async () => {
    const builder = 'FROM node:22 AS build\nUSER node\nRUN echo construir\n';
    await conRepo({ ...NODE, Dockerfile: `${builder}FROM nginx:1.27\nCOPY --from=build /app /srv\n` }, async (raiz, opciones) => {
      assertFalla(punto(informe(raiz, opciones), 'dockerfile-sin-user'), 'Dockerfile', /etapa final \(FROM nginx:1\.27\) no declara USER/);
    });
    await conRepo({ ...NODE, Dockerfile: `${builder}FROM nginx:1.27\nUSER nginx\n` }, async (raiz, opciones) => {
      assertOk(punto(informe(raiz, opciones), 'dockerfile-sin-user'));
    });
  });
});

// ---------------------------------------------------------------------
// NO APLICA, NO VERIFICADO
// ---------------------------------------------------------------------

test('sin ficheros que revisar, ficheros grandes o ilegibles y fallo que no tapa otra', async () => {
  await caso('sin ficheros que revisar: las siete salen NO APLICA con motivo, nunca OK', async () => {
    // Con compose (tipo docker detectado) pero sin Dockerfile, sin reglas, sin migraciones, sin flujos.
    await conRepo({ ...NODE, 'compose.yaml': 'services:\n  app:\n    image: app\n' }, async (raiz, opciones) => {
      const i = informe(raiz, opciones);
      const esperados: Record<string, RegExp> = {
        'reglas-firebase-abiertas': /no hay ningun fichero de reglas de Firebase versionado/,
        'migraciones-sin-rls': /no hay ninguna migracion SQL de Supabase versionada/,
        'tokens-en-ficheros-de-gestor': /no hay ningun \.npmrc, \.pypirc ni settings\.xml versionado/,
        'ci-pull-request-target': /no hay ningun flujo de GitHub Actions versionado/,
        'acciones-ci-sin-sha': /no hay ningun flujo ni accion de GitHub Actions versionado/,
        'dockerfile-sin-user': /no hay ningun Dockerfile versionado/,
      };
      for (const [id, motivo] of Object.entries(esperados)) {
        const p = punto(i, id);
        assert.equal(p.estado, 'no-aplica', `${id}: ${p.estado} ${p.motivo}`);
        assert.match(p.motivo, motivo, id);
      }
      // compose-con-contrasenas si tiene fichero: sale OK con evidencia.
      assertOk(punto(i, 'compose-con-contrasenas'));
    });
  });
  await caso('un fichero mayor que maxBytesFichero, o versionado pero ilegible, da NO VERIFICADO (nunca OK)', async () => {
    await conRepo(DOCKER, async (raiz, opciones) => {
      const grande = punto(informe(raiz, { ...opciones, maxBytesFichero: 16 }), 'dockerfile-sin-user');
      assert.equal(grande.estado, 'no-verificado', grande.motivo);
      assert.match(grande.motivo, /Dockerfile \(mayor de 16 bytes\)/);
      // Versionado pero borrado del arbol de trabajo: no se puede leer.
      await unlink(path.join(raiz, 'Dockerfile'));
      const borrado = punto(informe(raiz, opciones), 'dockerfile-sin-user');
      assert.equal(borrado.estado, 'no-verificado', borrado.motivo);
      assert.match(borrado.motivo, /no se pudo leer/);
    });
  });
  await caso('un fichero que no se pudo leer no tapa la FALLA de otro, y el motivo lo dice', async () => {
    const grande = `FROM node:22\nUSER node\nRUN echo ${'x'.repeat(80)}\n`;
    await conRepo({ ...NODE, Dockerfile: 'FROM node:22\n', 'api/Dockerfile': grande }, async (raiz, opciones) => {
      const p = punto(informe(raiz, { ...opciones, maxBytesFichero: 60 }), 'dockerfile-sin-user');
      assertFalla(p, 'Dockerfile', /no declara USER/);
      assert.match(p.motivo, /ademas 1 fichero\(s\) sin leer \(api\/Dockerfile \(mayor de 60 bytes\)\)/);
    });
  });
});

// ---------------------------------------------------------------------
// Doble FALLA con secretos-en-arbol, y silencios
// ---------------------------------------------------------------------

const NPM_TOKEN = 'npm_' + 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8';

test('npm_ en .npmrc y silencios por huella y por fichero', async () => {
  await caso('un npm_ en .npmrc solo da FALLA en secretos-en-arbol; el punto 39 lo nombra como ya contado y queda OK', async () => {
    await conRepo({ ...NODE, '.npmrc': `//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n` }, async (raiz, opciones) => {
      const i = informe(raiz, opciones);
      assert.equal(punto(i, 'secretos-en-arbol').estado, 'falla');
      const p = punto(i, 'tokens-en-ficheros-de-gestor');
      assertOk(p);
      assert.match(p.motivo, /no se cuentan dos veces/);
      assert.ok(p.evidencias.some((e) => /ya lo cuenta secretos-arbol \(patron npm-token\)/.test(e.descripcion)));
      // Y si se silencia en secretos-arbol, el 39 no lo resucita.
      const huella = /huella ([0-9a-f]{12})/.exec(punto(i, 'secretos-en-arbol').evidencias.map((e) => e.descripcion).join(' '))?.[1];
      assert.ok(huella !== undefined);
      await escribir(raiz, {
        '.taskcode/doctor-deploy.yml': `silenciar_1_patron: npm-token\nsilenciar_1_fichero: .npmrc\nsilenciar_1_huella: "${huella}"\nsilenciar_1_motivo: rotado\nsilenciar_1_quien: Ana\nsilenciar_1_fecha: 2026-11-04\n`,
      });
      const j = informe(raiz, opciones);
      assert.equal(punto(j, 'secretos-en-arbol').estado, 'ok');
      assert.equal(punto(j, 'tokens-en-ficheros-de-gestor').estado, 'ok');
    });
  });
  await caso('silencios: un hallazgo con huella (token-gestor) y uno por fichero (dockerfile-sin-user) se silencian; otro hallazgo nuevo no', async () => {
    await conRepo({ ...NODE, '.npmrc': `//registry.npmjs.org/:_authToken=${TOKEN}\n`, Dockerfile: 'FROM node:22\n' }, async (raiz, opciones) => {
      const i = informe(raiz, opciones);
      const tok = punto(i, 'tokens-en-ficheros-de-gestor');
      assert.equal(tok.estado, 'falla');
      const huella = /patron token-gestor, huella ([0-9a-f]{12})/.exec(tok.evidencias[0]?.descripcion ?? '')?.[1];
      assert.ok(huella !== undefined, tok.evidencias[0]?.descripcion);
      assert.match(punto(i, 'dockerfile-sin-user').evidencias[0]?.descripcion ?? '', /\(patron dockerfile-sin-user\)$/);
      await escribir(raiz, {
        '.taskcode/doctor-deploy.yml':
          `silenciar_1_patron: token-gestor\nsilenciar_1_fichero: .npmrc\nsilenciar_1_huella: "${huella}"\nsilenciar_1_motivo: token de solo lectura rotado\nsilenciar_1_quien: Ana\nsilenciar_1_fecha: 2026-11-04\n` +
          'silenciar_2_patron: dockerfile-sin-user\nsilenciar_2_fichero: Dockerfile\nsilenciar_2_motivo: imagen de pruebas locales\nsilenciar_2_quien: Ana\nsilenciar_2_fecha: 2026-11-04\n',
      });
      const j = informe(raiz, opciones);
      for (const id of ['tokens-en-ficheros-de-gestor', 'dockerfile-sin-user']) {
        const p = punto(j, id);
        assert.equal(p.estado, 'ok', `${id}: ${p.motivo}`);
        assert.ok(p.evidencias.some((e) => /^SILENCIADO \(silenciar_\d/.test(e.descripcion)), id);
      }
      // Un token nuevo en otra clave del mismo fichero no queda tapado.
      await writeFile(path.join(raiz, '.npmrc'), `//registry.npmjs.org/:_authToken=${TOKEN}\n//npm.pkg.github.com/:_authToken=${TOKEN.split('').reverse().join('')}\n`, 'utf8');
      assert.equal(punto(informe(raiz, opciones), 'tokens-en-ficheros-de-gestor').estado, 'falla');
    });
  });
});

// ---------------------------------------------------------------------
// Enmascarado
// ---------------------------------------------------------------------

const CON_SECRETOS: Record<string, string> = {
  ...DOCKER,
  'docker-compose.yml': `services:\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: ${PASS}\n`,
  '.npmrc': `//registry.npmjs.org/:_authToken=${TOKEN}\n`,
  '.m2/settings.xml': `<settings><servers><server><id>r</id><password>${PASS}Mvn</password></server></servers></settings>\n`,
  '.pypirc': `[pypi]\npassword = ${TOKEN}Py\n`,
};

test('enmascarado y veredicto del agente rechazado en puntos deterministas', async () => {
  await caso('enmascarado: ni la contrasena del compose ni los tokens salen en stdout, JSON, informe en disco ni tarea', async () => {
    await conRepoDevelop(CON_SECRETOS, async (raiz, opciones) => {
      const texto = ejecutar(raiz, opciones, []).salida;
      const json = ejecutar(raiz, opciones, ['--json']).salida;
      const i = JSON.parse(json) as InformeDeploy;
      assert.equal(punto(i, 'compose-con-contrasenas').estado, 'falla');
      assert.equal(punto(i, 'tokens-en-ficheros-de-gestor').estado, 'falla');
      assert.equal(punto(i, 'tokens-en-ficheros-de-gestor').evidencias.filter((e) => e.muestra !== undefined).length, 3);
      const completo = await ejecutarCompleto(raiz, opciones, ['--json', '--crear-tareas']);
      const tareas = path.join(raiz, 'tareas', '00-planificadas');
      let textoTareas = '';
      for (const d of await readdir(tareas)) textoTareas += await readFile(path.join(tareas, d, 'tarea.md'), 'utf8');
      assert.match(textoTareas, /compose-con-contrasenas/);
      assert.match(textoTareas, /tokens-en-ficheros-de-gestor/);
      ejecutar(raiz, opciones, ['--escribir']);
      const docs = path.join(raiz, 'docs', 'doctor-deploy');
      let textoInforme = '';
      for (const f of await readdir(docs)) textoInforme += await readFile(path.join(docs, f), 'utf8');
      assert.match(textoInforme, /compose-con-contrasenas/);
      for (const [canal, t] of Object.entries({ texto, json, tareas: textoTareas, informe: textoInforme, completo: completo.salida })) {
        for (const valor of [PASS, TOKEN, `${PASS}Mvn`, `${TOKEN}Py`]) assertSinValor(t, valor, canal);
      }
    });
  });
  await caso('un veredicto del agente para reglas-firebase-abiertas se rechaza: es un punto determinista', async () => {
    await conRepo({ ...NODE, 'firestore.rules': firestore('allow read, write: if true;') }, async (raiz, opciones) => {
      const head = git(['rev-parse', 'HEAD'], raiz);
      const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-res-'));
      try {
        const ruta = path.join(dir, 'resultado.json');
        const v = { punto: 'reglas-firebase-abiertas', estado: 'ok', commit: head, fichero: 'firestore.rules', linea: 5, motivo: 'Las reglas exigen sesion en todos los documentos' };
        await writeFile(ruta, JSON.stringify({ veredictos: [v] }), 'utf8');
        const i = JSON.parse(ejecutar(raiz, opciones, ['--json', '--resultado', ruta]).salida) as InformeDeploy;
        const p = punto(i, 'reglas-firebase-abiertas');
        assert.equal(p.estado, 'falla', 'lo decide la sonda, no el agente');
        assert.equal(p.origen, 'sonda');
        assert.equal(i.veredictos?.aceptados, 0);
        assert.ok(i.veredictos?.rechazados.some((x) => x.punto === 'reglas-firebase-abiertas' && /es un punto determinista/.test(x.motivo)));
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });
});

// ---------------------------------------------------------------------
// El agente ya no los recibe
// ---------------------------------------------------------------------

test('sondas sobre lo versionado y variantes de Dockerfile y compose (IMP-2)', async () => {
  await caso('las sondas leen lo versionado: un Dockerfile sin commitear no cuenta', async () => {
    await conRepo(NODE, async (raiz, opciones) => {
      await escribir(raiz, { 'Dockerfile.dev': 'FROM node:22\n', 'docker-compose.yml': 'services:\n  a:\n    image: a\n' });
      await commit(raiz, 'compose');
      await escribir(raiz, { 'Dockerfile.nuevo': 'FROM node:22\n' });
      const p = punto(informe(raiz, opciones), 'dockerfile-sin-user');
      assertFalla(p, 'Dockerfile.dev', /no declara USER/);
      assert.ok(p.evidencias.every((e) => e.fichero !== 'Dockerfile.nuevo'), 'el no versionado no se mira');
    });
  });
  await caso('IMP-2: Dockerfile.prod, Containerfile y compose.prod.yaml se revisan aunque el tipo docker no se detecte', async () => {
    await conRepo({ ...NODE, 'Dockerfile.prod': 'FROM node:22\nCMD ["node", "index.js"]\n' }, async (raiz, opciones) => {
      assertFalla(punto(informe(raiz, opciones), 'dockerfile-sin-user'), 'Dockerfile.prod', /root|USER/);
    });
    await conRepo({ ...NODE, Containerfile: 'FROM node:22\n' }, async (raiz, opciones) => {
      assertFalla(punto(informe(raiz, opciones), 'dockerfile-sin-user'), 'Containerfile', /root|USER/);
    });
    await conRepo(
      { ...NODE, 'compose.prod.yaml': `services:\n  db:\n    image: postgres\n    environment:\n      POSTGRES_PASSWORD: ${PASS}\n` },
      async (raiz, opciones) => {
        assertFalla(punto(informe(raiz, opciones), 'compose-con-contrasenas'), 'compose.prod.yaml', /POSTGRES_PASSWORD/);
      }
    );
  });
});

// ---------------------------------------------------------------------
// Correcciones de la ronda 1 de revision
// ---------------------------------------------------------------------

test('IMP-3, MEN-1 y MEN-2: silencio por paso y falsos positivos', async () => {
  await caso('IMP-3: un silencio de pr-target-checkout es por paso; un paso peligroso nuevo vuelve a dar FALLA', async () => {
    const cabecera = 'on: pull_request_target\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n';
    const conRef = '      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n';
    await conRepo({ ...NODE, '.github/workflows/pr.yml': cabecera + conRef }, async (raiz, opciones) => {
      const p = punto(informe(raiz, opciones), 'ci-pull-request-target');
      assert.equal(p.estado, 'falla');
      const huella = /patron pr-target-checkout, huella ([0-9a-f]{12})/.exec(p.evidencias[0]?.descripcion ?? '')?.[1];
      assert.ok(huella !== undefined, p.evidencias[0]?.descripcion);
      await escribir(raiz, {
        '.taskcode/doctor-deploy.yml': `silenciar_1_patron: pr-target-checkout\nsilenciar_1_fichero: .github/workflows/pr.yml\nsilenciar_1_huella: "${huella}"\nsilenciar_1_motivo: revisado\nsilenciar_1_quien: Ana\nsilenciar_1_fecha: 2026-11-04\n`,
      });
      assert.equal(punto(informe(raiz, opciones), 'ci-pull-request-target').estado, 'ok');
      await writeFile(path.join(raiz, '.github/workflows/pr.yml'), cabecera + conRef + '      - run: gh pr checkout ${{ github.event.number }}\n', 'utf8');
      assert.equal(punto(informe(raiz, opciones), 'ci-pull-request-target').estado, 'falla');
    });
  });
  await caso('MEN-1 y MEN-2: SECRET_KEY en compose da FALLA; pull_request_target solo nombrado en un if: no', async () => {
    await conRepo(
      { ...DOCKER, 'docker-compose.yml': `services:\n  web:\n    image: app\n    environment:\n      SECRET_KEY: ${PASS}\n` },
      async (raiz, opciones) => {
        assertFalla(punto(informe(raiz, opciones), 'compose-con-contrasenas'), 'docker-compose.yml', /SECRET_KEY/);
      }
    );
    const flujo =
      "on: pull_request\njobs:\n  t:\n    if: github.event_name != 'pull_request_target'\n    runs-on: ubuntu-latest\n    steps:\n" +
      '      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n';
    await conRepo({ ...NODE, '.github/workflows/pr.yml': flujo }, async (raiz, opciones) => {
      assert.notEqual(punto(informe(raiz, opciones), 'ci-pull-request-target').estado, 'falla');
    });
  });
});
