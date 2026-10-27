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
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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
import { motivoFicheroSecreto } from '../../src/fs/sondas-deploy.js';

const TOTAL_PUNTOS = cargarCatalogoDeploy().puntos.length;

const AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';
const STRIPE = 'sk_live_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';
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
      const docker = punto(informe, 'dockerfile-sin-user');
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

test('node_modules, vendor, target, dist y build no se escanean ni detectan', async () => {
  await conRepo(
    {
      ...NODE,
      'node_modules/dep/package.json': '{}\n',
      'node_modules/dep/leak.js': `const k = "${STRIPE}";\n`,
      'vendor/x/Gemfile': '\n',
      'dist/app.js': `const k = "${AWS}";\n`,
      'target/debug/x.env': `K=${STRIPE}\n`,
    },
    async (raiz, opciones) => {
      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
      assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
      assert.ok(!informe.tipos.some((t) => t.id === 'ruby'));
      // Tampoco en el historial.
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
      'docs/ejemplo.md': 'AKIAIOSFODNN7EXAMPLE\nsk_test_4eC39HqLyjWDarjtT1zdp7dc\n',
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
        'silenciar_2_patron: stripe-live\nsilenciar_2_fichero: no/existe.env\nsilenciar_2_motivo: Por si acaso\nsilenciar_2_quien: carlos\nsilenciar_2_fecha: 2026-10-27\n',
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
      'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo/prod.env\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n' +
        'silenciar_2_patron: stripe-live\nsilenciar_2_fichero: nuevo/prod.env\nsilenciar_2_motivo: Rotada\nsilenciar_2_quien: carlos\nsilenciar_2_fecha: 2026-10-27\n',
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
    assert.equal(o['version'], 1);
    assert.equal(o['comando'], 'doctor-deploy');
    assert.equal(o['commit'], git(['rev-parse', 'HEAD'], raiz));
    assert.equal(o['rama'], 'main');
    assert.equal(o['arbolSucio'], false);
    assert.ok(Array.isArray(o['tipos']) && Array.isArray(o['puntos']) && Array.isArray(o['avisos']));
    const resumen = o['resumen'] as Record<string, number>;
    assert.equal(resumen['ok']! + resumen['falla']! + resumen['noVerificado']! + resumen['noAplica']!, resumen['total']);
    const p = (o['puntos'] as Array<Record<string, unknown>>)[0] as Record<string, unknown>;
    for (const campo of ['id', 'severidad', 'metodo', 'estado', 'motivo', 'evidencias', 'arreglo', 'descripcion', 'referencia', 'desactivado']) {
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

    // Segunda ejecucion el mismo dia: otro fichero, el primero intacto; ahora el arbol esta sucio y lo dice.
    const r2 = ejecutar(raiz, opciones, ['--escribir'], dia);
    assert.equal(path.basename(r2.rutaInforme as string), '2026-10-27-2.md');
    assert.equal(await readFile(r1.rutaInforme as string, 'utf8'), md);
    const md2 = await readFile(r2.rutaInforme as string, 'utf8');
    assert.match(md2, /- Arbol de trabajo: SUCIO/);
    assert.ok(r2.informe.arbolSucio);

    // Sin restos temporales.
    const restos = (await readdir(path.join(raiz, 'docs', 'doctor-deploy'))).filter((f) => !f.endsWith('.md'));
    assert.deepEqual(restos, []);
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
