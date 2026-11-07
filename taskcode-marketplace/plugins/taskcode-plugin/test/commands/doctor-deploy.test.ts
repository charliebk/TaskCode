/**
 * TASK-066: `taskctl doctor-deploy` contra repos Git temporales REALES (nunca
 * mocks). Las herramientas externas de auditoria se controlan con un PATH vacio:
 * asi la suite no depende de lo que haya instalado ni sale a la red, y de paso
 * prueba que una herramienta ausente es NO VERIFICADO.
 *
 * Los interpretes de la salida de cada herramienta se prueban en
 * test/core/doctor-deploy-auditoria.test.ts con muestras de su formato; contra
 * la herramienta real no se prueban (necesitan red).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFile, chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { main } from '../../src/cli.js';
import {
  runDoctorDeployCommand,
  DoctorDeployCommandError,
  type DoctorDeployResult,
} from '../../src/commands/doctor-deploy.js';
import { DoctorDeployCatalogoError, cargarCatalogoDeploy } from '../../src/core/doctor-deploy-catalogo.js';
import type { InformeDeploy, ResultadoPunto } from '../../src/core/doctor-deploy.js';
import { motivoFicheroSecreto, requirementsFijado } from '../../src/fs/sondas-deploy.js';
import { AWS, AWS_EJEMPLO, STRIPE_LIVE as STRIPE, STRIPE_LIVE_OTRA, STRIPE_TEST_EJEMPLO } from '../helpers/claves-falsas.js';

const TOTAL_PUNTOS = cargarCatalogoDeploy().puntos.length;
const b64url = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (payload: unknown): string => `${b64url({ alg: 'HS256' })}.${b64url(payload)}.firmaFirmaFirmaFirma`;

function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
  return r.stdout.trim();
}

async function escribir(raiz: string, archivos: Record<string, string>): Promise<void> {
  for (const [rel, contenido] of Object.entries(archivos)) {
    const abs = path.join(raiz, rel);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, contenido, 'utf8');
  }
}

async function commit(raiz: string, mensaje: string): Promise<string> {
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', mensaje], raiz);
  return git(['rev-parse', 'HEAD'], raiz);
}

const NODE: Record<string, string> = {
  'package.json': '{"name":"app","version":"1.0.0","dependencies":{}}\n',
  'package-lock.json': '{"name":"app","lockfileVersion":3}\n',
  '.gitignore': 'node_modules/\n.env\n',
  'index.js': 'console.log("hola");\n',
};
const RUST: Record<string, string> = {
  'Cargo.toml': '[package]\nname = "app"\nversion = "0.1.0"\nedition = "2021"\n',
  'Cargo.lock': '# lock\nversion = 3\n',
  '.gitignore': 'target/\n.env\n',
  'src/main.rs': 'fn main() { println!("hola"); }\n',
};
const PYTHON: Record<string, string> = {
  'pyproject.toml': '[project]\nname = "app"\nversion = "0.1.0"\n',
  'requirements.txt': 'flask==3.0.0\n',
  '.gitignore': '__pycache__/\n.env\n',
  'app.py': 'print("hola")\n',
};

/** Repo Git temporal con los ficheros dados, un commit, y un PATH de herramientas vacio. */
async function conRepo(
  archivos: Record<string, string>,
  fn: (raiz: string, opciones: { pathHerramientas: string }) => Promise<void>
): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-'));
  const vacio = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-path-'));
  try {
    git(['init', '-q', '-b', 'main'], raiz);
    git(['config', 'user.email', 'test@example.com'], raiz);
    git(['config', 'user.name', 'Test'], raiz);
    await escribir(raiz, archivos);
    await commit(raiz, 'inicial');
    await fn(raiz, { pathHerramientas: vacio });
  } finally {
    await rm(raiz, { recursive: true, force: true });
    await rm(vacio, { recursive: true, force: true });
  }
}

function ejecutar(
  raiz: string,
  opciones: { pathHerramientas: string; [k: string]: unknown },
  args: string[] = ['--json'],
  ahora?: Date
): DoctorDeployResult {
  return runDoctorDeployCommand(args, {
    repoCwd: raiz,
    opciones,
    ...(ahora === undefined ? {} : { ahora: () => ahora }),
  });
}

function punto(informe: InformeDeploy, id: string): ResultadoPunto {
  const p = informe.puntos.find((x) => x.id === id);
  assert.ok(p !== undefined, `no hay punto ${id}`);
  return p;
}

/** Todas las subcadenas de 8 o mas caracteres de `secreto` (basta con las de 8: las largas las contienen). */
function ventanas(secreto: string): string[] {
  const v: string[] = [];
  for (let i = 0; i + 8 <= secreto.length; i++) v.push(secreto.slice(i, i + 8));
  return v;
}

function assertSinSecreto(texto: string, secreto: string, canal: string): void {
  for (const v of ventanas(secreto)) {
    assert.ok(!texto.includes(v), `el canal "${canal}" contiene la subcadena "${v}" del secreto`);
  }
}

/** Propiedades que valen para CUALQUIER ejecucion. */
function assertInvariantes(informe: InformeDeploy): void {
  assert.equal(informe.puntos.length, TOTAL_PUNTOS);
  for (const p of informe.puntos) {
    if (p.estado === 'ok') assert.ok(p.evidencias.length > 0, `${p.id}: OK sin evidencia`);
    if (p.estado === 'falla') assert.ok(p.evidencias.length > 0 && p.arreglo.length > 0, `${p.id}: FALLA sin evidencia o sin arreglo`);
    if (p.estado === 'no-verificado' || p.estado === 'no-aplica') assert.ok(p.motivo.trim().length > 5, `${p.id}: ${p.estado} sin motivo`);
    if (p.metodo === 'juicio' && !p.desactivado) assert.notEqual(p.estado, 'ok', `${p.id}: un punto de juicio nunca es OK`);
  }
}

// ---------------------------------------------------------------------
// Repos limpios: Node, Rust y Python
// ---------------------------------------------------------------------

const DETERMINISTAS_PROPIOS = [
  'secretos-en-arbol',
  'secretos-en-historial',
  'ficheros-secretos-versionados',
  'gitignore-cubre-env',
  'lockfile-versionado',
];

for (const [nombre, archivos, tipoId] of [
  ['Node', NODE, 'node'],
  ['Rust', RUST, 'rust'],
  ['Python', PYTHON, 'python'],
] as const) {
  test(`repo limpio ${nombre}: tipo visible, cero FALLA, salida 0, deterministas propios en OK, juicio NO VERIFICADO`, async () => {
    await conRepo(archivos, async (raiz, opciones) => {
      const r = ejecutar(raiz, opciones);
      const informe = JSON.parse(r.salida) as InformeDeploy & { codigo: number; resumen: { falla: number; total: number } };
      assertInvariantes(informe);
      assert.ok(informe.tipos.some((t) => t.id === tipoId), `no detecta ${tipoId}`);
      assert.equal(informe.resumen.falla, 0, informe.puntos.filter((p) => p.estado === 'falla').map((p) => p.id).join(', '));
      assert.equal(r.codigo, 0);
      assert.equal(informe.codigo, 0);
      for (const id of DETERMINISTAS_PROPIOS) {
        const p = punto(informe, id);
        assert.equal(p.estado, 'ok', `${id}: ${p.motivo}`);
        assert.ok(p.evidencias.length > 0);
      }
      for (const p of informe.puntos.filter((x) => x.metodo === 'juicio' && x.estado !== 'no-aplica')) {
        assert.equal(p.estado, 'no-verificado', p.id);
        assert.match(p.motivo, /falta la revision con juicio/);
      }
      // Sin herramientas en el PATH: la auditoria de dependencias es NO VERIFICADO diciendo que falta.
      const dep = punto(informe, 'dependencias-vulnerables');
      assert.equal(dep.estado, 'no-verificado');
      assert.match(dep.motivo, /falta (npm|cargo-audit|pip-audit)/);
      // Un punto de otro tipo sale NO APLICA con motivo.
      const docker = punto(informe, 'contenedor-sin-root-ni-secretos');
      assert.equal(docker.estado, 'no-aplica');
      assert.match(docker.motivo, /docker/);
      assert.match(docker.motivo, new RegExp(tipoId));
    });
  });
}

test('NO APLICA: el cliente de la base de datos es de frontend/node, y en Rust sale NO APLICA con el motivo', async () => {
  await conRepo(RUST, async (raiz, opciones) => {
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    const p = punto(informe, 'clave-publica-en-cliente-db');
    assert.equal(p.estado, 'no-aplica');
    assert.match(p.motivo, /frontend o node/);
    assert.match(p.motivo, /detectado: rust/);
  });
});

test('el texto muestra el tipo detectado y el resumen «N de M sin verificar»', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const r = ejecutar(raiz, opciones, []);
    assert.equal(r.json, false);
    assert.match(r.salida, /Tipos detectados: Node\.js \(\.\)/);
    const m = /(\d+) de (\d+) sin verificar/.exec(r.salida);
    assert.ok(m !== null);
    assert.equal(Number(m[2]), TOTAL_PUNTOS);
    assert.ok(Number(m[1]) > 0);
    assert.match(r.salida, /Sin FALLA no es «listo para publicar»/);
    assert.match(r.salida, /Salida 0\./);
  });
});

test('sin ningun fichero marcador: se dice, y los puntos de «todos» siguen corriendo', async () => {
  await conRepo({ 'README.md': '# nada\n', '.gitignore': '.env\n' }, async (raiz, opciones) => {
    const r = ejecutar(raiz, opciones);
    const informe = JSON.parse(r.salida) as InformeDeploy;
    assert.deepEqual(informe.tipos, []);
    assert.ok(informe.avisos.some((a) => /ningun tipo de aplicacion/.test(a)));
    assert.equal(punto(informe, 'ficheros-secretos-versionados').estado, 'ok');
    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
    assertInvariantes(informe);
  });
});

test('tipos: Java, .NET, Go, PHP, Ruby, Docker y frontend se detectan por sus marcadores', async () => {
  await conRepo(
    {
      'pom.xml': '<project/>\n',
      'App.csproj': '<Project/>\n',
      'go.mod': 'module x\n',
      'composer.json': '{}\n',
      'Gemfile': "source 'https://rubygems.org'\n",
      'Dockerfile': 'FROM scratch\n',
      'web/vite.config.ts': 'export default {}\n',
      'pnpm-lock.yaml': 'lockfileVersion: 9\n',
      'a/b/c/d/package.json': '{}\n', // demasiado profundo: no cuenta
    },
    async (raiz, opciones) => {
      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
      const ids = informe.tipos.map((t) => t.id);
      for (const id of ['java', 'maven', 'dotnet', 'go', 'php', 'ruby', 'docker', 'frontend', 'pnpm']) {
        assert.ok(ids.includes(id), `no detecta ${id}: ${ids.join(',')}`);
      }
      assert.ok(!ids.includes('node'), 'package.json a mas de 3 carpetas no cuenta');
      assert.deepEqual(informe.tipos.find((t) => t.id === 'frontend')?.rutas, ['web']);
    }
  );
});

test('node_modules, vendor, target, dist y build no se detectan como tipos (ni se escanean si no estan versionados)', async () => {
  await conRepo(
    {
      ...NODE,
      '.gitignore': 'node_modules/\ndist/\ntarget/\n.env\n',
      'vendor/x/Gemfile': '\n',
    },
    async (raiz, opciones) => {
      await escribir(raiz, {
        'node_modules/dep/package.json': '{}\n',
        'node_modules/dep/leak.js': `const k = "${STRIPE}";\n`,
        'dist/app.js': `const k = "${AWS}";\n`,
        'target/debug/x.env': `K=${STRIPE}\n`,
      });
      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
      assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
      assert.ok(!informe.tipos.some((t) => t.id === 'ruby'));
      assert.equal(punto(informe, 'secretos-en-historial').estado, 'ok');
    }
  );
});

// ---------------------------------------------------------------------
// Secretos: arbol, historial, enmascarado
// ---------------------------------------------------------------------

test('secreto plantado en el arbol: FALLA con fichero y linea, enmascarado, y el arreglo del catalogo', async () => {
  await conRepo(
    { ...NODE, 'src/config.js': `// config\nmodule.exports = {\n  stripe: "${STRIPE}",\n};\n` },
    async (raiz, opciones) => {
      const r = ejecutar(raiz, opciones);
      const informe = JSON.parse(r.salida) as InformeDeploy;
      const p = punto(informe, 'secretos-en-arbol');
      assert.equal(p.estado, 'falla');
      assert.equal(p.evidencias[0]?.fichero, 'src/config.js');
      assert.equal(p.evidencias[0]?.linea, 3);
      assert.match(p.evidencias[0]?.muestra ?? '', /^sk_l\*\*\*\* \(32 caracteres\)$/);
      assert.ok(p.arreglo.includes('rotala primero'));
      assert.equal(r.codigo, 1);
      assertInvariantes(informe);
    }
  );
});

test('secreto plantado SOLO en el historial: FALLA del historial con el hash del commit; el arbol y los ficheros, OK', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { '.env': `AWS_ACCESS_KEY_ID=${AWS}\nSTRIPE_KEY=${STRIPE}\n` });
    git(['add', '-f', '.env'], raiz); // el .gitignore lo ignora: se fuerza, como pasa en la vida real
    const hashConSecreto = await commit(raiz, 'anade env por error');
    git(['rm', '-q', '.env'], raiz);
    await commit(raiz, 'borra el env');

    const r = ejecutar(raiz, opciones);
    const informe = JSON.parse(r.salida) as InformeDeploy;
    assertInvariantes(informe);

    const h = punto(informe, 'secretos-en-historial');
    assert.equal(h.estado, 'falla', h.motivo);
    const commits = h.evidencias.filter((e) => e.muestra !== undefined).map((e) => e.commit);
    assert.deepEqual(commits, [hashConSecreto, hashConSecreto], 'las dos claves apuntan al commit que las introdujo');
    assert.ok(h.evidencias.some((e) => e.fichero === '.env' && e.linea === 1));
    assert.ok(h.evidencias.some((e) => e.fichero === '.env' && e.linea === 2));
    assert.ok(h.evidencias.some((e) => /refs recorridos: 1 rama\(s\) local\(es\)/.test(e.descripcion)), 'dice que refs se miraron');
    assert.ok(h.arreglo.indexOf('Rota la clave primero') < h.arreglo.indexOf('reescribe el historial'));

    // Mutacion que esto mata: buscar solo en el arbol.
    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
    assert.equal(punto(informe, 'ficheros-secretos-versionados').estado, 'ok');
    assert.equal(r.codigo, 1);

    // El texto tambien lo muestra, con el hash.
    const texto = ejecutar(raiz, opciones, []);
    assert.match(texto.salida, /\[FALLA\] secretos-en-historial/);
    assert.ok(texto.salida.includes(hashConSecreto));
    assert.equal(texto.codigo, 1);
  });
});

test('enmascarado: ninguna subcadena de 8+ caracteres del secreto sale por stdout, JSON ni informe', async () => {
  await conRepo(
    { ...NODE, 'src/config.js': `const k = "${STRIPE}";\n` },
    async (raiz, opciones) => {
      await escribir(raiz, { '.env': `AWS=${AWS}\n` });
      git(['add', '-f', '.env'], raiz);
      await commit(raiz, 'env');

      const texto = ejecutar(raiz, opciones, ['--escribir']);
      const json = ejecutar(raiz, opciones, ['--json']);
      const informe = await readFile(texto.rutaInforme as string, 'utf8');

      for (const secreto of [STRIPE, AWS]) {
        assertSinSecreto(texto.salida, secreto, 'stdout');
        assertSinSecreto(json.salida, secreto, 'json');
        assertSinSecreto(informe, secreto, 'informe');
        assertSinSecreto(texto.mensajeEscritura, secreto, 'mensaje');
      }
      // Y aun asi lo detecta: no es que no lo vea.
      assert.equal(punto(JSON.parse(json.salida) as InformeDeploy, 'secretos-en-arbol').estado, 'falla');
      assert.equal(punto(JSON.parse(json.salida) as InformeDeploy, 'ficheros-secretos-versionados').estado, 'falla');
    }
  );
});

test('segunda red: un secreto que se colara en un nombre de fichero tambien sale enmascarado', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    // El nombre del fichero lleva una clave: la evidencia cita el nombre y la segunda red lo tapa.
    await escribir(raiz, { [`${STRIPE}.txt`]: `valor ${STRIPE}\n` });
    await commit(raiz, 'fichero con la clave en el nombre');
    const r = ejecutar(raiz, opciones);
    const j = ejecutar(raiz, opciones, ['--json']);
    assertSinSecreto(r.salida, STRIPE, 'stdout');
    assertSinSecreto(j.salida, STRIPE, 'json');
    JSON.parse(j.salida);
  });
});

test('claves de ejemplo, de prueba y publicas a proposito no fallan; service_role si', async () => {
  await conRepo(
    {
      ...NODE,
      'docs/ejemplo.md': `${AWS_EJEMPLO}\n${STRIPE_TEST_EJEMPLO}\n`,
      'src/cliente.js': `const anon = "${jwt({ role: 'anon' })}";\nconst fb = "AIza${'SyA-1234567890abcdefghijklmnopqrstu'}";\n`,
    },
    async (raiz, opciones) => {
      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
      for (const id of ['secretos-en-arbol', 'secretos-en-historial']) {
        assert.equal(punto(informe, id).estado, 'ok', `${id}: ${punto(informe, id).motivo}`);
      }
      const conPublicas = punto(informe, 'secretos-en-arbol').evidencias.map((e) => e.descripcion).join('\n');
      assert.match(conPublicas, /2 claves publicas a proposito/);
      assert.match(conPublicas, /2 de ejemplo o de prueba/);

      await escribir(raiz, { 'src/servidor.js': `const s = "${jwt({ role: 'service_role' })}";\n` });
      await commit(raiz, 'service role');
      const mal = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
      const p = punto(mal, 'secretos-en-arbol');
      assert.equal(p.estado, 'falla');
      assert.match(p.evidencias[0]?.descripcion ?? '', /supabase-service-role/);
    }
  );
});

// ---------------------------------------------------------------------
// Ficheros de secretos, .gitignore, lockfile
// ---------------------------------------------------------------------

test('motivoFicheroSecreto: .env y claves si; .env.example, .env.sample y .pub no', () => {
  for (const r of ['.env', 'api/.env', '.env.production', '.env.local', 'id_rsa', 'ssh/id_ed25519', 'cert.p12', 'app.keystore', 'credentials.json', 'home/.aws/credentials', '.htpasswd']) {
    assert.notEqual(motivoFicheroSecreto(r), null, r);
  }
  for (const r of ['.env.example', '.env.sample', '.env.template', '.env.vault', 'id_rsa.pub', 'src/env.ts', 'README.md', 'cert.pem']) {
    assert.equal(motivoFicheroSecreto(r), null, r);
  }
});

test('.env versionado: FALLA; un .env.example sin valores no cuenta', async () => {
  await conRepo({ ...NODE, '.env.example': 'API_KEY=\nDB_URL=\n' }, async (raiz, opciones) => {
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    assert.equal(punto(informe, 'ficheros-secretos-versionados').estado, 'ok');
    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');

    await escribir(raiz, { '.env': 'API_KEY=abc\n' });
    git(['add', '-f', '.env'], raiz);
    await commit(raiz, 'env');
    const mal = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    const p = punto(mal, 'ficheros-secretos-versionados');
    assert.equal(p.estado, 'falla');
    assert.equal(p.evidencias[0]?.fichero, '.env');
  });
});

test('un .env.example con una clave real SI falla (por el escaneo del arbol)', async () => {
  await conRepo({ ...NODE, '.env.example': `STRIPE_KEY=${STRIPE}\n` }, async (raiz, opciones) => {
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'falla');
    assert.equal(punto(informe, 'secretos-en-arbol').evidencias[0]?.fichero, '.env.example');
  });
});

test('.gitignore que no cubre .env: FALLA con evidencia', async () => {
  await conRepo({ ...NODE, '.gitignore': 'node_modules/\n' }, async (raiz, opciones) => {
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    const p = punto(informe, 'gitignore-cubre-env');
    assert.equal(p.estado, 'falla');
    assert.ok(p.evidencias.length > 0);
    await writeFile(path.join(raiz, '.gitignore'), 'node_modules/\n.env*\n!.env.example\n', 'utf8');
    const bien = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    const p2 = punto(bien, 'gitignore-cubre-env');
    assert.equal(p2.estado, 'ok');
    assert.equal(p2.evidencias[0]?.fichero, '.gitignore');
  });
});

test('lockfile: sin el, FALLA diciendo cual falta; sin versionar, lo dice', async () => {
  const { 'package-lock.json': _lock, ...sinLock } = NODE;
  await conRepo(sinLock, async (raiz, opciones) => {
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'lockfile-versionado');
    assert.equal(p.estado, 'falla');
    assert.match(p.evidencias[0]?.descripcion ?? '', /package-lock\.json/);
    // Existe pero sin versionar.
    await escribir(raiz, { 'package-lock.json': '{}\n' });
    const q = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'lockfile-versionado');
    assert.equal(q.estado, 'falla');
    assert.match(q.evidencias[0]?.descripcion ?? '', /existe package-lock\.json pero no esta versionado/);
  });
});

test('lockfile en un monorepo: el de la raiz vale para los paquetes', async () => {
  await conRepo(
    { 'package.json': '{}\n', 'package-lock.json': '{}\n', 'packages/a/package.json': '{}\n', '.gitignore': '.env\n' },
    async (raiz, opciones) => {
      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
      assert.equal(punto(informe, 'lockfile-versionado').estado, 'ok');
      assert.deepEqual(informe.tipos.find((t) => t.id === 'node')?.rutas, ['.', 'packages/a']);
    }
  );
});

// ---------------------------------------------------------------------
// Historial: limites, clon superficial
// ---------------------------------------------------------------------

test('clon superficial: el historial sale NO VERIFICADO (truncado), nunca OK', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { 'otro.js': '1\n' });
    await commit(raiz, 'segundo');
    const destino = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-clon-'));
    try {
      git(['clone', '-q', '--depth', '1', pathToFileURL(raiz).href, path.join(destino, 'c')], destino);
      const informe = JSON.parse(ejecutar(path.join(destino, 'c'), opciones).salida) as InformeDeploy;
      const p = punto(informe, 'secretos-en-historial');
      assert.equal(p.estado, 'no-verificado');
      assert.match(p.motivo, /superficial/);
      assert.match(p.motivo, /unshallow/);
    } finally {
      await rm(destino, { recursive: true, force: true });
    }
  });
});

test('desbordamiento de limites: pasarse de blobs o de tiempo es NO VERIFICADO, nunca OK ni excepcion', async () => {
  await conRepo({ ...NODE, 'a.txt': 'a\n', 'b.txt': 'b\n', 'c.txt': 'c\n' }, async (raiz, opciones) => {
    const pocos = JSON.parse(ejecutar(raiz, { ...opciones, maxBlobsHistorial: 1 }).salida) as InformeDeploy;
    const p = punto(pocos, 'secretos-en-historial');
    assert.equal(p.estado, 'no-verificado');
    assert.match(p.motivo, /incompleto/);
    const sinTiempo = JSON.parse(ejecutar(raiz, { ...opciones, timeoutHistorialMs: 0 }).salida) as InformeDeploy;
    const q = punto(sinTiempo, 'secretos-en-historial');
    assert.equal(q.estado, 'no-verificado');
    assert.match(q.motivo, /tiempo/);
  });
});

test('un secreto hallado con el recorrido cortado sigue siendo FALLA (un hallazgo no se pierde por el limite)', async () => {
  await conRepo({ 'a.txt': `k=${STRIPE}\n`, '.gitignore': '.env\n' }, async (raiz, opciones) => {
    await escribir(raiz, { 'b.txt': 'b\n', 'c.txt': 'c\n', 'd.txt': 'd\n' });
    await commit(raiz, 'mas');
    const informe = JSON.parse(ejecutar(raiz, { ...opciones, maxBlobsHistorial: 100 }).salida) as InformeDeploy;
    assert.equal(punto(informe, 'secretos-en-historial').estado, 'falla');
  });
});

test('repositorio sin commits: el historial no tiene nada que revisar y lo dice', async () => {
  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-vacio-'));
  const vacio = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-path-'));
  try {
    git(['init', '-q', '-b', 'main'], raiz);
    await escribir(raiz, { 'README.md': '# x\n', '.gitignore': '.env\n' });
    const r = ejecutar(raiz, { pathHerramientas: vacio });
    const informe = JSON.parse(r.salida) as InformeDeploy;
    assert.equal(informe.commit, null);
    const p = punto(informe, 'secretos-en-historial');
    assert.equal(p.estado, 'ok');
    assert.ok(p.evidencias.length > 0);
    assertInvariantes(informe);
  } finally {
    await rm(raiz, { recursive: true, force: true });
    await rm(vacio, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------
// Capa del proyecto
// ---------------------------------------------------------------------

test('capa: desactivar sin motivo aborta; con motivo el punto sale NO APLICA marcado', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { '.taskcode/doctor-deploy.yml': 'desactivar_1_id: lockfile-versionado\n' });
    assert.throws(
      () => ejecutar(raiz, opciones),
      (e: unknown) => e instanceof DoctorDeployCatalogoError && /exige "desactivar_1_motivo"/.test(e.message)
    );
    await escribir(raiz, {
      '.taskcode/doctor-deploy.yml':
        'desactivar_1_id: lockfile-versionado\ndesactivar_1_motivo: Es una libreria: el lockfile no se versiona\ndesactivar_2_id: no-existe\ndesactivar_2_motivo: x\n',
    });
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    const p = punto(informe, 'lockfile-versionado');
    assert.equal(p.estado, 'no-aplica');
    assert.equal(p.desactivado, true);
    assert.match(p.motivo, /libreria/);
    assert.ok(informe.avisos.some((a) => /"no-existe", que no existe/.test(a)));
    assertInvariantes(informe);
    // El texto lo marca.
    assert.match(ejecutar(raiz, opciones, []).salida, /\[NO APLICA\] lockfile-versionado .*DESACTIVADO/);
  });
});

test('capa: un punto anadido de juicio sale NO VERIFICADO; uno con sonda registrada se ejecuta; un id repetido aborta', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, {
      '.taskcode/doctor-deploy.yml':
        'punto_1_id: revisar-pii\npunto_1_severidad: alta\npunto_1_tipos: [todos]\npunto_1_metodo: juicio\npunto_1_arreglo: Quita los datos personales de los logs\npunto_1_descripcion: Los logs no llevan datos personales de clientes\n' +
        'punto_2_id: lock-propio\npunto_2_severidad: media\npunto_2_tipos: [node]\npunto_2_metodo: determinista\npunto_2_sonda: lockfile\npunto_2_arreglo: Versiona el lockfile\npunto_2_descripcion: Lockfile propio del proyecto\n',
    });
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    assert.equal(informe.puntos.length, TOTAL_PUNTOS + 2);
    assert.equal(punto(informe, 'revisar-pii').estado, 'no-verificado');
    assert.equal(punto(informe, 'lock-propio').estado, 'ok');

    await escribir(raiz, {
      '.taskcode/doctor-deploy.yml': 'punto_1_id: lockfile-versionado\npunto_1_severidad: alta\npunto_1_tipos: [todos]\npunto_1_metodo: juicio\npunto_1_arreglo: A\npunto_1_descripcion: D\n',
    });
    assert.throws(() => ejecutar(raiz, opciones), (e: unknown) => e instanceof DoctorDeployCatalogoError && /ya existe en el catalogo del plugin/.test(e.message));
  });
});

test('capa: silenciar un hallazgo concreto lo saca de la cuenta, con su motivo en la evidencia; otro igual no silenciado sigue fallando', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { 'viejo/prod.env': `K=${STRIPE}\n`, 'nuevo/prod.env': `K=${STRIPE}\n` });
    git(['add', '-f', '.'], raiz);
    const hash = await commit(raiz, 'envs');
    git(['rm', '-q', '-r', 'viejo', 'nuevo'], raiz);
    await commit(raiz, 'quita los envs');

    const sin = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    assert.equal(punto(sin, 'secretos-en-historial').estado, 'falla');
    assert.equal(punto(sin, 'secretos-en-historial').evidencias.filter((e) => e.muestra !== undefined).length, 2);

    await escribir(raiz, {
      '.taskcode/doctor-deploy.yml':
        `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo/prod.env\nsilenciar_1_commit: "${hash.slice(0, 10)}"\n` +
        'silenciar_1_motivo: Clave rotada el 2026-10-01\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n' +
        'silenciar_2_patron: stripe-live\nsilenciar_2_fichero: no/existe.env\nsilenciar_2_commit: "0000000"\nsilenciar_2_motivo: Por si acaso\nsilenciar_2_quien: carlos\nsilenciar_2_fecha: 2026-10-27\n',
    });
    const r = ejecutar(raiz, opciones);
    const con = JSON.parse(r.salida) as InformeDeploy;
    const p = punto(con, 'secretos-en-historial');
    assert.equal(p.estado, 'falla', 'el otro .env sigue fallando');
    assert.equal(p.evidencias.filter((e) => e.muestra !== undefined).length, 1);
    assert.equal(p.evidencias.find((e) => e.muestra !== undefined)?.fichero, 'nuevo/prod.env');
    const silenciada = p.evidencias.find((e) => e.descripcion.startsWith('SILENCIADO'));
    assert.ok(silenciada !== undefined);
    assert.match(silenciada.descripcion, /Clave rotada el 2026-10-01 - carlos, 2026-10-27/);
    assert.equal(silenciada.fichero, 'viejo/prod.env');
    // El silencio que no coincide con nada se avisa.
    assert.ok(con.avisos.some((a) => /silenciar_2 .* no coincide con ningun hallazgo/.test(a)));

    // Silenciando tambien el segundo, el punto queda en OK y la salida es 0.
    await writeFile(
      path.join(raiz, '.taskcode/doctor-deploy.yml'),
      'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo/prod.env\nsilenciar_1_commit: "' + hash + '"\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n' +
        'silenciar_2_patron: stripe-live\nsilenciar_2_fichero: nuevo/prod.env\nsilenciar_2_commit: "' + hash + '"\nsilenciar_2_motivo: Rotada\nsilenciar_2_quien: carlos\nsilenciar_2_fecha: 2026-10-27\n',
      'utf8'
    );
    const todo = ejecutar(raiz, opciones);
    assert.equal(punto(JSON.parse(todo.salida) as InformeDeploy, 'secretos-en-historial').estado, 'ok');
    assert.equal(todo.codigo, 0);
  });
});

test('capa: un silencio con el commit equivocado no tapa el hallazgo', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { 'viejo/prod.env': `K=${STRIPE}\n` });
    git(['add', '-f', '.'], raiz);
    await commit(raiz, 'env');
    await escribir(raiz, {
      '.taskcode/doctor-deploy.yml':
        'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo/prod.env\nsilenciar_1_commit: "0000000"\nsilenciar_1_motivo: x\nsilenciar_1_quien: y\nsilenciar_1_fecha: 2026-10-27\n',
    });
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    assert.equal(punto(informe, 'secretos-en-historial').estado, 'falla');
  });
});

// ---------------------------------------------------------------------
// --json, --escribir, flags, codigo de salida
// ---------------------------------------------------------------------

test('--json: una linea que pasa JSON.parse, con el contrato (version, commit, rama, tipos, puntos, resumen, codigo)', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const r = ejecutar(raiz, opciones);
    assert.ok(r.salida.endsWith('\n'));
    assert.equal(r.salida.trim().split('\n').length, 1);
    const o = JSON.parse(r.salida) as Record<string, unknown>;
    assert.equal(o['version'], 3);
    assert.equal(o['comando'], 'doctor-deploy');
    assert.equal(o['commit'], git(['rev-parse', 'HEAD'], raiz));
    assert.equal(o['rama'], 'main');
    assert.equal(o['arbolSucio'], false);
    assert.ok(Array.isArray(o['tipos']) && Array.isArray(o['aplicaciones']) && Array.isArray(o['puntos']) && Array.isArray(o['avisos']));
    const resumen = o['resumen'] as Record<string, number>;
    assert.equal(resumen['ok']! + resumen['falla']! + resumen['noVerificado']! + resumen['noAplica']!, resumen['total']);
    const p = (o['puntos'] as Array<Record<string, unknown>>)[0] as Record<string, unknown>;
    for (const campo of ['id', 'severidad', 'metodo', 'estado', 'motivo', 'evidencias', 'arreglo', 'descripcion', 'referencia', 'desactivado', 'origen']) {
      assert.ok(campo in p, `falta el campo ${campo}`);
    }
  });
});

test('main(): con una FALLA sale 1 y stdout es solo el JSON; sin FALLA sale 0', async () => {
  await conRepo({ 'README.md': '# x\n', '.gitignore': '.env\n' }, async (raiz) => {
    const cwdAntes = process.cwd();
    const salida: string[] = [];
    const errores: string[] = [];
    const out = process.stdout.write.bind(process.stdout);
    const err = process.stderr.write.bind(process.stderr);
    (process.stdout as unknown as { write: (c: string) => boolean }).write = (c: string) => (salida.push(String(c)), true);
    (process.stderr as unknown as { write: (c: string) => boolean }).write = (c: string) => (errores.push(String(c)), true);
    try {
      process.chdir(raiz);
      const limpio = await main(['doctor-deploy', '--json']);
      assert.equal(limpio, 0);
      assert.equal((JSON.parse(salida.join('')) as { codigo: number }).codigo, 0);

      await escribir(raiz, { '.env': 'A=1\n' });
      git(['add', '-f', '.env'], raiz);
      await commit(raiz, 'env');
      salida.length = 0;
      const mal = await main(['doctor-deploy', '--json', '--escribir']);
      assert.equal(mal, 1);
      const o = JSON.parse(salida.join('')) as { codigo: number };
      assert.equal(o.codigo, 1);
      assert.match(errores.join(''), /Informe escrito en docs\/doctor-deploy\//, 'con --json el aviso va a stderr');
    } finally {
      process.chdir(cwdAntes);
      process.stdout.write = out;
      process.stderr.write = err;
    }
  });
});

test('flags desconocidos y argumentos sobrantes abortan; fuera de un repo Git tambien', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    assert.throws(() => ejecutar(raiz, opciones, ['--inventado']), (e: unknown) => e instanceof DoctorDeployCommandError && /flag desconocido "--inventado"/.test(e.message));
    assert.throws(() => ejecutar(raiz, opciones, ['--json=1']), (e: unknown) => e instanceof DoctorDeployCommandError && /no lleva valor/.test(e.message));
    assert.throws(() => ejecutar(raiz, opciones, ['algo']), (e: unknown) => e instanceof DoctorDeployCommandError && /no admite argumentos/.test(e.message));
  });
  const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-fuera-'));
  try {
    assert.throws(
      () => runDoctorDeployCommand([], { repoCwd: fuera, opciones: { pathHerramientas: '' } }),
      (e: unknown) => e instanceof DoctorDeployCommandError && /no es un repositorio Git/.test(e.message)
    );
  } finally {
    await rm(fuera, { recursive: true, force: true });
  }
});

test('--escribir: informe con commit, rama, tipos y una fila por punto; sin commitear; sin pisar el del mismo dia', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const commitsAntes = git(['rev-list', '--count', 'HEAD'], raiz);
    const hash = git(['rev-parse', 'HEAD'], raiz);
    const dia = new Date(2026, 9, 27, 12, 0, 0); // 27 de octubre de 2026, hora local

    const r1 = ejecutar(raiz, opciones, ['--escribir'], dia);
    assert.equal(path.relative(realpathSync.native(raiz), r1.rutaInforme as string).replace(/\\/g, '/'), 'docs/doctor-deploy/2026-10-27.md');
    const md = await readFile(r1.rutaInforme as string, 'utf8');
    assert.ok(md.includes(`- Commit: ${hash}`));
    assert.ok(md.includes('- Rama: main'));
    assert.match(md, /- Arbol de trabajo: limpio/);
    assert.match(md, /- Tipos detectados: Node\.js \(\.\)/);
    assert.match(md, /no es una certificacion/);
    const filas = md.split('\n').filter((l) => /^\| [a-z0-9-]+ \| (critica|alta|media|baja) \|/.test(l));
    assert.equal(filas.length, TOTAL_PUNTOS);
    assert.match(r1.mensajeEscritura, /No se ha commiteado/);

    // No commitea ni toca nada mas.
    assert.equal(git(['rev-list', '--count', 'HEAD'], raiz), commitsAntes);
    assert.equal(git(['status', '--porcelain'], raiz), '?? docs/');

    // Segunda ejecucion el mismo dia: otro fichero y el primero intacto.
    const r2 = ejecutar(raiz, opciones, ['--escribir'], dia);
    assert.equal(path.basename(r2.rutaInforme as string), '2026-10-27-2.md');
    assert.equal(await readFile(r1.rutaInforme as string, 'utf8'), md);
    const md2 = await readFile(r2.rutaInforme as string, 'utf8');
    assert.match(md2, /- Arbol de trabajo: limpio/, 'el informe anterior no ensucia el siguiente (MEN-3)');

    // Sin restos temporales.
    const archivosInforme = (await readdir(path.join(raiz, 'docs', 'doctor-deploy'))).sort();
    assert.deepEqual(archivosInforme, ['2026-10-27-2.json', '2026-10-27-2.md', '2026-10-27.json', '2026-10-27.md']);
    // TASK-067: el JSON de al lado es el mismo informe (v3 desde TASK-068), con el mismo commit.
    const j = JSON.parse(await readFile(r1.rutaJson as string, 'utf8')) as InformeDeploy;
    assert.equal(j.version, 3);
    assert.equal(j.commit, hash);
    assert.equal(j.puntos.length, TOTAL_PUNTOS);
    assert.ok(j.puntos.every((p) => p.origen === 'sonda'));
  });
});

test('sin --escribir no se crea nada en el repo', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    ejecutar(raiz, opciones);
    ejecutar(raiz, opciones, []);
    assert.equal(git(['status', '--porcelain'], raiz), '');
  });
});

test('propiedad: en todos los repos probados, ningun OK sin evidencia y todo NO VERIFICADO / NO APLICA con motivo', async () => {
  for (const archivos of [NODE, RUST, PYTHON, { ...NODE, 'src/c.js': `k="${STRIPE}"\n` }]) {
    await conRepo(archivos, async (raiz, opciones) => {
      assertInvariantes(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy);
    });
  }
});

test('herramientas ausentes con PATH controlado: NO VERIFICADO diciendo cual falta, nunca OK ni FALLA', async () => {
  await conRepo(
    { ...NODE, ...RUST, ...PYTHON, 'go.mod': 'module x\n', 'App.csproj': '<Project/>\n', 'pom.xml': '<project/>\n' },
    async (raiz, opciones) => {
      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
      const dep = punto(informe, 'dependencias-vulnerables');
      assert.equal(dep.estado, 'no-verificado');
      for (const falta of ['falta npm', 'falta cargo-audit', 'falta pip-audit', 'falta dotnet', 'falta govulncheck']) {
        assert.ok(dep.motivo.includes(falta), `no dice "${falta}": ${dep.motivo}`);
      }
      assert.match(dep.motivo, /Java .* no hay herramienta de auditoria soportada/);
      assert.match(punto(informe, 'secretos-en-historial').evidencias.map((e) => e.descripcion).join('\n'), /gitleaks no esta instalado/);
    }
  );
});

// ---------------------------------------------------------------------
// Revision por pares, ronda 1 (IMP-1 a IMP-6 y MENOR)
// ---------------------------------------------------------------------

function utf16le(texto: string): Buffer {
  return Buffer.from(`﻿${texto}`, 'utf16le');
}

function utf16be(texto: string): Buffer {
  const sinBom = Buffer.from(texto, 'utf16le').swap16();
  return Buffer.concat([Buffer.from([0xfe, 0xff]), sinBom]);
}

/** Escribe ficheros binarios (Buffer) y los versiona a la fuerza. */
async function escribirBin(raiz: string, rel: string, datos: Buffer): Promise<void> {
  const abs = path.join(raiz, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, datos);
}

const huellaDeEvidencia = (p: ResultadoPunto): string => {
  const m = /huella ([0-9a-f]{12})/.exec(p.evidencias.map((e) => e.descripcion).join('\n'));
  assert.ok(m !== null, 'la evidencia no lleva la huella');
  return m[1] as string;
};

test('IMP-1: .env y claves versionados bajo build/, dist/, vendor/, target/ y node_modules/ son FALLA', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    for (const rel of ['build/.env', 'vendor/.env', 'dist/id_rsa', 'target/app.p12', 'node_modules/x/.env']) {
      await escribir(raiz, { [rel]: 'x\n' });
    }
    git(['add', '-f', '.'], raiz);
    await commit(raiz, 'ficheros de secretos en carpetas de build');
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'ficheros-secretos-versionados');
    assert.equal(p.estado, 'falla');
    assert.deepEqual(p.evidencias.map((e) => e.fichero).sort(), ['build/.env', 'dist/id_rsa', 'node_modules/x/.env', 'target/app.p12', 'vendor/.env']);
  });
});

test('IMP-2: una clave en un fichero VERSIONADO de build/, dist/, vendor/ o target/ falla en el arbol y en el historial', async () => {
  await conRepo({ ...NODE, 'src/c.js': `const k = "${STRIPE}";\n` }, async (raiz, opciones) => {
    git(['mv', 'src/c.js', 'src/d.js'], raiz);
    await commit(raiz, 'renombra');
    await mkdir(path.join(raiz, 'build'), { recursive: true });
    git(['mv', 'src/d.js', 'build/c.js'], raiz); // el blob ahora vive en build/ (su ruta mas reciente)
    await commit(raiz, 'a build');
    await escribir(raiz, { 'dist/bundle.js': `x="${AWS}";\n`, 'vendor/v.env': `K=${STRIPE}x\n`, 'target/t.txt': `K=${STRIPE}y\n` });
    git(['add', '-f', '.'], raiz);
    await commit(raiz, 'bundles versionados');
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    const ficheros = (id: string): string[] => punto(informe, id).evidencias.filter((e) => e.muestra !== undefined).map((e) => e.fichero as string);
    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'falla');
    assert.ok(ficheros('secretos-en-arbol').includes('build/c.js'));
    assert.ok(ficheros('secretos-en-arbol').includes('dist/bundle.js'));
    assert.equal(punto(informe, 'secretos-en-historial').estado, 'falla');
    assert.ok(ficheros('secretos-en-historial').includes('src/c.js'), 'el historial cita la ruta por la que entro');
    assert.ok(ficheros('secretos-en-historial').includes('dist/bundle.js'));
    // Y dice cuantos versionados en carpetas excluidas se incluyeron.
    assert.match(punto(informe, 'secretos-en-arbol').evidencias.map((e) => e.descripcion).join('\n'), /[1-9]\d* versionados dentro de node_modules, vendor, target, dist o build incluidos/);
  });
});

test('IMP-2: lo que NO esta versionado en node_modules/dist se sigue sin escanear', async () => {
  await conRepo({ ...NODE, '.gitignore': 'node_modules/\ndist/\n.env\n' }, async (raiz, opciones) => {
    await escribir(raiz, { 'node_modules/dep/leak.js': `k="${STRIPE}"\n`, 'dist/app.js': `k="${AWS}"\n` });
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
  });
});

for (const [nombre, codificar] of [['UTF-16LE con BOM', utf16le], ['UTF-16BE con BOM', utf16be]] as const) {
  test(`IMP-3: un fichero ${nombre} se decodifica y se escanea (arbol e historial)`, async () => {
    await conRepo(NODE, async (raiz, opciones) => {
      await escribirBin(raiz, 'cfg.txt', codificar(`# config\nSTRIPE=${STRIPE}\n`));
      await commit(raiz, 'config en utf-16');
      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
      for (const id of ['secretos-en-arbol', 'secretos-en-historial']) {
        const p = punto(informe, id);
        assert.equal(p.estado, 'falla', `${id}: ${p.motivo}`);
        assert.equal(p.evidencias[0]?.fichero, 'cfg.txt');
        assert.equal(p.evidencias[0]?.linea, 2);
      }
    });
  });
}

test('IMP-3: los binarios saltados se cuentan siempre, en el arbol y en el historial', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribirBin(raiz, 'logo.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 1, 2, 3]));
    await commit(raiz, 'imagen');
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    for (const id of ['secretos-en-arbol', 'secretos-en-historial']) {
      const p = punto(informe, id);
      assert.equal(p.estado, 'ok', id);
      assert.match(p.evidencias.map((e) => e.descripcion).join('\n'), /1 binarios saltados/, id);
    }
  });
});

test('IMP-4: un silencio de arbol va atado a la huella del valor: otra clave nueva en el mismo fichero sigue fallando', async () => {
  await conRepo({ ...NODE, 'config/prod.env.js': `module.exports = { k: "${STRIPE}" };\n` }, async (raiz, opciones) => {
    const huella = huellaDeEvidencia(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol'));
    await escribir(raiz, {
      '.taskcode/doctor-deploy.yml': `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: config/prod.env.js\nsilenciar_1_huella: "${huella}"\nsilenciar_1_motivo: Clave de prueba\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`,
    });
    const silenciado = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol');
    assert.equal(silenciado.estado, 'ok');
    assert.match(silenciado.evidencias.map((e) => e.descripcion).join('\n'), /1 hallazgos silenciados/);
    assert.ok(silenciado.evidencias.some((e) => e.descripcion.startsWith('SILENCIADO')));

    // Una clave NUEVA del mismo patron en el MISMO fichero no queda tapada.
    await escribir(raiz, { 'config/prod.env.js': `module.exports = { k: "${STRIPE}", otra: "${STRIPE_LIVE_OTRA}" };\n` });
    const nueva = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol');
    assert.equal(nueva.estado, 'falla');
    assert.equal(nueva.evidencias.filter((e) => e.muestra !== undefined).length, 1);
    assert.notEqual(huellaDeEvidencia(nueva), huella);
  });
});

test('IMP-4: sin commit, un silencio de arbol no tapa un hallazgo del historial; con commit y huella, si', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { 'viejo.env': `K=${STRIPE}\n` });
    git(['add', '-f', '.'], raiz);
    const hash = await commit(raiz, 'env');
    git(['rm', '-q', 'viejo.env'], raiz);
    await commit(raiz, 'quita');
    const h = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial');
    assert.equal(h.estado, 'falla');
    const huella = huellaDeEvidencia(h);
    const base = `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo.env\nsilenciar_1_huella: "${huella}"\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`;
    await escribir(raiz, { '.taskcode/doctor-deploy.yml': base });
    assert.equal(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial').estado, 'falla');
    await escribir(raiz, { '.taskcode/doctor-deploy.yml': `${base}silenciar_1_commit: "${hash}"\n` });
    const ok = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial');
    assert.equal(ok.estado, 'ok');
    assert.match(ok.evidencias.map((e) => e.descripcion).join('\n'), /1 hallazgos silenciados/);
    // Con la huella de otro valor, no tapa.
    await escribir(raiz, { '.taskcode/doctor-deploy.yml': `${base.replace(huella, '000000000000')}silenciar_1_commit: "${hash}"\n` });
    assert.equal(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial').estado, 'falla');
  });
});

test('IMP-5: una regla negada (!.env) que gana deja .env sin ignorar: FALLA', async () => {
  await conRepo({ ...NODE, '.gitignore': 'node_modules/\n.env\n!.env\n' }, async (raiz, opciones) => {
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'gitignore-cubre-env');
    assert.equal(p.estado, 'falla');
    assert.match(p.evidencias[0]?.descripcion ?? '', /REINCLUYE/);
    assert.equal(p.evidencias[0]?.linea, 3);
  });
});

test('IMP-6 (M8): una regla que solo esta en .git/info/exclude no cuenta como cubierta', async () => {
  await conRepo({ ...NODE, '.gitignore': 'node_modules/\n' }, async (raiz, opciones) => {
    await appendFile(path.join(raiz, '.git', 'info', 'exclude'), '.env\n');
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'gitignore-cubre-env');
    assert.equal(p.estado, 'falla');
    assert.match(p.motivo, /regla local que no se versiona/);
  });
});

test('IMP-6 (M8): una regla que solo esta en el excludesFile global no cuenta como cubierta', async () => {
  await conRepo({ ...NODE, '.gitignore': 'node_modules/\n' }, async (raiz, opciones) => {
    const global = path.join(path.dirname(raiz), `${path.basename(raiz)}-global-ignore`);
    await writeFile(global, '.env\n', 'utf8');
    try {
      git(['config', 'core.excludesFile', global], raiz);
      const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'gitignore-cubre-env');
      assert.equal(p.estado, 'falla');
      assert.match(p.motivo, /regla local que no se versiona/);
    } finally {
      await rm(global, { force: true });
    }
  });
});

test('IMP-6 (M12): si git rev-list falla, el historial es NO VERIFICADO (nunca OK ni excepcion)', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const arbol = git(['rev-parse', 'HEAD^{tree}'], raiz);
    const objeto = path.join(raiz, '.git', 'objects', arbol.slice(0, 2), arbol.slice(2));
    await chmod(objeto, 0o666);
    await rm(objeto, { force: true });
    const r = ejecutar(raiz, opciones);
    const p = punto(JSON.parse(r.salida) as InformeDeploy, 'secretos-en-historial');
    assert.equal(p.estado, 'no-verificado');
    assert.match(p.motivo, /rev-list --all --objects no termino/);
  });
});

test('IMP-6 (M16): un secreto solo en una rama distinta de HEAD, o solo en una etiqueta, se detecta', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    git(['checkout', '-q', '-b', 'otra'], raiz);
    await escribir(raiz, { 'rama.env': `K=${STRIPE}\n` });
    git(['add', '-f', '.'], raiz);
    const enRama = await commit(raiz, 'en la rama');
    git(['checkout', '-q', 'main'], raiz);
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial');
    assert.equal(p.estado, 'falla');
    assert.equal(p.evidencias.find((e) => e.muestra !== undefined)?.commit, enRama);
    assert.equal(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol').estado, 'ok');
  });
  await conRepo(NODE, async (raiz, opciones) => {
    git(['checkout', '-q', '-b', 'temporal'], raiz);
    await escribir(raiz, { 'etiqueta.env': `K=${STRIPE}\n` });
    git(['add', '-f', '.'], raiz);
    const enTag = await commit(raiz, 'solo en la etiqueta');
    git(['tag', 'v1'], raiz);
    git(['checkout', '-q', 'main'], raiz);
    git(['branch', '-D', 'temporal'], raiz);
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial');
    assert.equal(p.estado, 'falla');
    assert.equal(p.evidencias.find((e) => e.muestra !== undefined)?.commit, enTag);
  });
});

test('MEN-1: un fichero de texto mayor que el limite deja el punto NO VERIFICADO (arbol e historial); un binario grande no', async () => {
  await conRepo({ ...NODE, 'bundle.js': `${'a'.repeat(400)}\n` }, async (raiz, opciones) => {
    const informe = JSON.parse(ejecutar(raiz, { ...opciones, maxBytesFichero: 100 }).salida) as InformeDeploy;
    for (const id of ['secretos-en-arbol', 'secretos-en-historial']) {
      const p = punto(informe, id);
      assert.equal(p.estado, 'no-verificado', id);
      assert.match(p.motivo, /mayores de/, id);
    }
    // Con el limite por defecto, OK.
    assert.equal(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-arbol').estado, 'ok');
  });
  await conRepo({ ...NODE }, async (raiz, opciones) => {
    await escribirBin(raiz, 'big.bin', Buffer.concat([Buffer.from([0, 1, 2]), Buffer.alloc(400, 7)]));
    await commit(raiz, 'binario grande');
    const arbol = punto(JSON.parse(ejecutar(raiz, { ...opciones, maxBytesFichero: 100 }).salida) as InformeDeploy, 'secretos-en-arbol');
    assert.equal(arbol.estado, 'ok');
    assert.match(arbol.evidencias.map((e) => e.descripcion).join('\n'), /1 binarios saltados/);
  });
});

test('MEN-2: una ruta no ASCII en el historial sale tal cual y se puede silenciar por su nombre', async () => {
  const nombre = 'contraseña.js';
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { [nombre]: `k="${STRIPE}"\n` });
    const hash = await commit(raiz, 'con enie');
    git(['rm', '-q', nombre], raiz);
    await commit(raiz, 'quita');
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial');
    assert.equal(p.estado, 'falla');
    assert.equal(p.evidencias.find((e) => e.muestra !== undefined)?.fichero, nombre);
    await escribir(raiz, {
      '.taskcode/doctor-deploy.yml': `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: ${nombre}\nsilenciar_1_commit: "${hash}"\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`,
    });
    assert.equal(punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'secretos-en-historial').estado, 'ok');
  });
});

test('MEN-3: los informes de --escribir no ensucian el arbol del siguiente informe; otro fichero sin commitear si', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const dia = new Date(2026, 9, 27, 12, 0, 0);
    ejecutar(raiz, opciones, ['--escribir'], dia);
    const r2 = ejecutar(raiz, opciones, ['--escribir'], dia);
    assert.equal(r2.informe.arbolSucio, false);
    assert.match(await readFile(r2.rutaInforme as string, 'utf8'), /- Arbol de trabajo: limpio/);
    await escribir(raiz, { 'otro.txt': 'x\n' });
    assert.equal(ejecutar(raiz, opciones).informe.arbolSucio, true);
  });
});

test('MEN-4: un requirements.txt sin versiones fijadas con == no cuenta como lockfile', async () => {
  await conRepo({ ...PYTHON, 'requirements.txt': 'flask>=3.0\nrequests\n' }, async (raiz, opciones) => {
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'lockfile-versionado');
    assert.equal(p.estado, 'falla');
    assert.match(p.evidencias[0]?.descripcion ?? '', /todo fijado con ==/);
  });
  assert.equal(requirementsFijado('# deps\nflask==3.0.0\n-r otro.txt\nrequests==2.31.0 \\\n'), true);
  assert.equal(requirementsFijado('flask==3.0.0\nrequests\n'), false);
  assert.equal(requirementsFijado('# solo comentarios\n'), false);
});

test('MEN-5: si no se puede escribir el informe, el analisis se imprime igualmente y se avisa', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await mkdir(path.join(raiz, 'docs'), { recursive: true });
    await writeFile(path.join(raiz, 'docs', 'doctor-deploy'), 'soy un fichero\n', 'utf8');
    const r = ejecutar(raiz, opciones, ['--json', '--escribir']);
    assert.equal(r.rutaInforme, null);
    assert.match(r.mensajeEscritura, /\[AVISO\] No se pudo escribir el informe/);
    assert.equal(JSON.parse(r.salida).puntos.length, TOTAL_PUNTOS);
    assert.equal(r.codigo, 0);
  });
});

// ---------------------------------------------------------------------
// Revision por pares, ronda 2 (IMP-7, MEN-4, MEN-9, MEN-10, MEN-11)
// ---------------------------------------------------------------------

test('IMP-7: un silencio con commit (sin huella) no tapa una clave NUEVA del mismo patron en el arbol, en el mismo fichero', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { 'config/prod.env.js': `k="${STRIPE}"\n` });
    const hash = await commit(raiz, 'k1');
    git(['rm', '-q', 'config/prod.env.js'], raiz);
    await commit(raiz, 'quita k1');
    await escribir(raiz, {
      'config/prod.env.js': `k="${STRIPE_LIVE_OTRA}"\n`,
      '.taskcode/doctor-deploy.yml': `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: config/prod.env.js\nsilenciar_1_commit: "${hash}"\nsilenciar_1_motivo: K1 rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`,
    });
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    // El historial queda silenciado por su commit...
    assert.equal(punto(informe, 'secretos-en-historial').estado, 'ok');
    // ...pero la clave nueva, del arbol, no.
    const arbol = punto(informe, 'secretos-en-arbol');
    assert.equal(arbol.estado, 'falla');
    assert.equal(arbol.evidencias[0]?.fichero, 'config/prod.env.js');
  });
});

test('MEN-4: monorepo con el .gitignore solo en el subdirectorio que tiene su .env: OK; sin el, FALLA nombrando esa carpeta', async () => {
  const web = {
    'apps/web/package.json': '{}\n',
    'apps/web/package-lock.json': '{}\n',
    'README.md': '# monorepo\n',
  };
  await conRepo({ ...web, 'apps/web/.gitignore': '.env\n' }, async (raiz, opciones) => {
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    const p = punto(informe, 'gitignore-cubre-env');
    assert.equal(p.estado, 'ok', p.motivo);
    assert.equal(p.evidencias[0]?.fichero, 'apps/web/.gitignore');
  });
  await conRepo(web, async (raiz, opciones) => {
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'gitignore-cubre-env');
    assert.equal(p.estado, 'falla');
    assert.match(p.motivo, /apps\/web\/\.env/);
  });
});

test('MEN-4: un modulo Go sin bloque require no necesita go.sum; con dependencias y sin go.sum, FALLA', async () => {
  await conRepo({ 'go.mod': 'module ejemplo.com/x\n\ngo 1.22\n', '.gitignore': '.env\n' }, async (raiz, opciones) => {
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'lockfile-versionado');
    assert.equal(p.estado, 'ok');
    assert.match(p.evidencias[0]?.descripcion ?? '', /sin bloque require/);
  });
  await conRepo({ 'go.mod': 'module ejemplo.com/x\n\ngo 1.22\n\nrequire github.com/a/b v1.0.0\n', '.gitignore': '.env\n' }, async (raiz, opciones) => {
    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'lockfile-versionado');
    assert.equal(p.estado, 'falla');
    assert.match(p.evidencias[0]?.descripcion ?? '', /go\.sum/);
  });
});

test('MEN-9: una URL con credenciales se detecta pero no muestra huella (no se puede confirmar la contrasena con un diccionario)', async () => {
  const url = 'postgres://admin:Hunter2pass@db.prod.acme.io/app';
  await conRepo({ ...NODE, 'src/db.js': `const u = "${url}";\n` }, async (raiz, opciones) => {
    const r = ejecutar(raiz, opciones);
    const informe = JSON.parse(r.salida) as InformeDeploy;
    for (const id of ['secretos-en-arbol', 'secretos-en-historial']) {
      const p = punto(informe, id);
      assert.equal(p.estado, 'falla', id);
      assert.match(p.evidencias[0]?.descripcion ?? '', /url-con-credenciales/);
      assert.doesNotMatch(p.evidencias[0]?.descripcion ?? '', /huella/, id);
    }
    assert.ok(!r.salida.includes('Hunter2pass'));
    // En el historial si se puede silenciar: por fichero + patron + commit.
    const hash = git(['rev-parse', 'HEAD'], raiz);
    await escribir(raiz, {
      '.taskcode/doctor-deploy.yml': `silenciar_1_patron: url-con-credenciales\nsilenciar_1_fichero: src/db.js\nsilenciar_1_commit: "${hash}"\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`,
    });
    const con = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    assert.equal(punto(con, 'secretos-en-historial').estado, 'ok');
    assert.equal(punto(con, 'secretos-en-arbol').estado, 'falla', 'en el arbol no hay forma segura de silenciarla: hay que quitar la credencial');
  });
});

test('MEN-10: un silencio solo con huella para un patron y fichero con hallazgo en el historial avisa de que exige commit', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { 'viejo.env': `K=${STRIPE}\n` });
    git(['add', '-f', '.'], raiz);
    await commit(raiz, 'env');
    git(['rm', '-q', 'viejo.env'], raiz);
    await commit(raiz, 'quita');
    await escribir(raiz, {
      '.taskcode/doctor-deploy.yml': 'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo.env\nsilenciar_1_huella: "abcdef012345"\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n',
    });
    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
    assert.equal(punto(informe, 'secretos-en-historial').estado, 'falla');
    assert.ok(informe.avisos.some((a) => /exige silenciar_1_commit/.test(a)), informe.avisos.join(' | '));
  });
});

test('MEN-11: la ruta de un excludesFile global con barras invertidas se muestra limpia (sin comillas ni barras dobles)', async () => {
  await conRepo({ ...NODE, '.gitignore': 'node_modules/\n' }, async (raiz, opciones) => {
    const global = path.join(path.dirname(raiz), `${path.basename(raiz)}-global-ignore2`);
    await writeFile(global, '.env\n', 'utf8');
    try {
      git(['config', 'core.excludesFile', global], raiz);
      const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'gitignore-cubre-env');
      assert.equal(p.estado, 'falla');
      const d = p.evidencias[0]?.descripcion ?? '';
      assert.ok(!d.includes('\\\\'), `barras dobles en la ruta mostrada: ${d}`);
      assert.ok(!d.includes('""'), `comillas dobles en la ruta mostrada: ${d}`);
      assert.ok(d.includes('-global-ignore2'));
    } finally {
      await rm(global, { force: true });
    }
  });
});
