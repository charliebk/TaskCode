/**
 * Parte pura de TASK-061: las claves `plataforma_remota` y `url_base_remoto`,
 * la normalizacion de la base y la deduccion del proyecto a partir de la URL
 * de origin. Sin disco ni procesos; los repos reales y el doble de glab estan
 * en test/commands/finish-merge-request-instancia.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  normalizarBase,
  partesDeOrigin,
  proyectoDeRemoto,
  resolverRemotoDeclarado,
} from '../../src/core/plataforma-remota.js';
import {
  CLAVES_CONFIG,
  CONFIG_DEFAULTS,
  ConfigError,
  parsearConfig,
  reiniciarAvisosDeConfig,
  resolverConfig,
} from '../../src/core/config.js';

const RUTA = '/repo/.taskcode/config.yml';

function rechaza(contenido: string, patron: RegExp): Error {
  let capturado: Error | null = null;
  assert.throws(
    () => parsearConfig(contenido, RUTA),
    (e: unknown) => {
      assert.ok(e instanceof ConfigError, String(e));
      assert.match(e.message, patron);
      capturado = e;
      return true;
    },
    `deberia rechazar:\n${contenido}`
  );
  return capturado as unknown as Error;
}

// ---------------------------------------------------------------------------
// Claves de config
// ---------------------------------------------------------------------------

test('config: sin las claves nuevas, defaults nulos (rige la deteccion por host de la 0.6.0)', () => {
  assert.equal(CONFIG_DEFAULTS.plataforma_remota, null);
  assert.equal(CONFIG_DEFAULTS.url_base_remoto, null);
  const c = parsearConfig('limite_wip: 2\n', RUTA);
  assert.equal(c.plataforma_remota, null);
  assert.equal(c.url_base_remoto, null);
  assert.ok((CLAVES_CONFIG as readonly string[]).includes('plataforma_remota'));
  assert.ok((CLAVES_CONFIG as readonly string[]).includes('url_base_remoto'));
});

test('config: plataforma sola, y plataforma gitlab con la base normalizada', () => {
  assert.equal(parsearConfig('plataforma_remota: github\n', RUTA).plataforma_remota, 'github');
  const sola = parsearConfig('plataforma_remota: gitlab\n', RUTA);
  assert.equal(sola.plataforma_remota, 'gitlab');
  assert.equal(sola.url_base_remoto, null);
  const c = parsearConfig('plataforma_remota: gitlab\nurl_base_remoto: HTTPS://Git.Empresa.COM:443/Ruta/GitLab//\n', RUTA);
  assert.equal(c.url_base_remoto, 'https://git.empresa.com/Ruta/GitLab', 'esquema y host en minusculas, sin 443, sin barras finales');
  assert.equal(
    parsearConfig('plataforma_remota: gitlab\nurl_base_remoto: https://servidor.example:8443\n', RUTA).url_base_remoto,
    'https://servidor.example:8443'
  );
});

test('config: la plataforma invalida aborta como el resto de enumerados y sugiere la parecida', () => {
  rechaza('plataforma_remota: gitlb\n', /plataforma_remota "gitlb" no es valida\. ¿Querias decir "gitlab"\?[\s\S]*github, gitlab/);
  rechaza('plataforma_remota: bitbucket\n', /Valores validos: github, gitlab/);
  rechaza('plataforma_remota:\n', /no puede estar vacia[\s\S]*sin la clave, no se declara/);
  rechaza('plataforma_remota: gitlab\nplataforma_remota: github\n', /repetida/);
});

test('config: la URL sin plataforma, o con github, aborta con un mensaje que dice que hacer', () => {
  rechaza('url_base_remoto: https://git.empresa.com\n', /necesita tambien "plataforma_remota: gitlab"/);
  rechaza('plataforma_remota: github\nurl_base_remoto: https://git.empresa.com\n', /solo vale con "plataforma_remota: gitlab"/);
  // El orden de las claves no importa.
  rechaza('url_base_remoto: https://git.empresa.com\nplataforma_remota: github\n', /solo vale con "plataforma_remota: gitlab"/);
  // El mensaje nombra la linea de la URL.
  assert.match(rechaza('plataforma_remota: github\nurl_base_remoto: https://git.empresa.com\n', /solo vale/).message, /config\.yml:2:/);
});

test('config: una URL con userinfo aborta SIN repetir lo escrito (podria ser un token)', () => {
  for (const url of [
    'https://usuario:secreto@git.empresa.com',
    'https://tok-secreto@git.empresa.com/ruta',
    'https://git.empresa.com/ruta?x=a@b',
  ]) {
    const e = rechaza(`plataforma_remota: gitlab\nurl_base_remoto: ${url}\n`, /lleva un "@"/);
    assert.doesNotMatch(e.message, /secreto|tok-|git.empresa|servidor/, 'no repite lo escrito');
  }
});

test('config: la URL que no es https o no es una URL base limpia aborta', () => {
  rechaza('plataforma_remota: gitlab\nurl_base_remoto: http://git.empresa.com\n', /debe empezar por https:\/\//);
  rechaza('plataforma_remota: gitlab\nurl_base_remoto: git.empresa.com\n', /debe empezar por https:\/\//);
  rechaza('plataforma_remota: gitlab\nurl_base_remoto: ssh://git.empresa.com/ruta\n', /debe empezar por https:\/\//);
  for (const mala of [
    'https://git.empresa.com/ruta?a=1',
    'https://git.empresa.com/ruta#frag',
    'https://git.empresa.com/../otra',
    'https://git.empresa.com/ru ta',
    'https://git.empresa.com:99999/ruta',
    'https://git_empresa.com',
    'https://',
  ]) {
    rechaza(`plataforma_remota: gitlab\nurl_base_remoto: "${mala}"\n`, /no es una URL base valida/);
  }
  rechaza('plataforma_remota: gitlab\nurl_base_remoto:\n', /no puede estar vacia/);
});

// ---------------------------------------------------------------------------
// Claves desconocidas: aviso, una vez por proceso
// ---------------------------------------------------------------------------

test('resolverConfig: una clave desconocida avisa por stderr UNA vez por proceso aunque se resuelva muchas, y devuelve el resto', async () => {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-aviso-'));
  const escrito: string[] = [];
  const original = process.stderr.write.bind(process.stderr);
  try {
    await mkdir(path.join(repo, '.git'));
    await mkdir(path.join(repo, '.taskcode'));
    await writeFile(path.join(repo, '.taskcode', 'config.yml'), 'limite_wp: 2\nlimite_wip: 3\n', 'utf8');
    reiniciarAvisosDeConfig();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.stderr as any).write = (c: string) => (escrito.push(String(c)), true);
    const a = resolverConfig(repo);
    resolverConfig(repo);
    resolverConfig(repo);
    assert.equal(a.limite_wip, 3);
  } finally {
    process.stderr.write = original;
    await rm(repo, { recursive: true, force: true });
  }
  assert.equal(escrito.length, 1, escrito.join('|'));
  assert.match(escrito[0] as string, /\[AVISO\].*clave desconocida "limite_wp"; se ignora/);
  assert.match(escrito[0] as string, /Quiza quisiste decir "limite_wip"/);
});

// ---------------------------------------------------------------------------
// Base y deduccion del proyecto
// ---------------------------------------------------------------------------

test('normalizarBase: esquema, host, puerto y barras; el motivo del rechazo', () => {
  const ok = normalizarBase('  HTTPS://Servidor.Example/ruta/gitlab/  ');
  assert.ok(ok.ok);
  assert.equal(ok.base, 'https://servidor.example/ruta/gitlab');
  assert.deepEqual(ok.segmentos, ['ruta', 'gitlab']);
  assert.equal((normalizarBase('https://h.example:0443') as { puerto: string | null }).puerto, null, '0443 es el 443');
  assert.deepEqual(normalizarBase('https://h@x.example'), { ok: false, motivo: 'credenciales' });
  assert.deepEqual(normalizarBase('http://h.example'), { ok: false, motivo: 'no-https' });
  assert.deepEqual(normalizarBase('h.example'), { ok: false, motivo: 'no-https' });
  assert.deepEqual(normalizarBase('https://h.example/a?b'), { ok: false, motivo: 'malformada' });
});

const BASE_SUB = 'https://servidor.example/ruta/gitlab';

test('proyectoDeRemoto: https, ssh:// con puerto y scp deducen el mismo proyecto, sin .git ni barra final', () => {
  for (const url of [
    'https://servidor.example/ruta/gitlab/grupo/sub/repo.git',
    'https://servidor.example/ruta/gitlab/grupo/sub/repo',
    'https://servidor.example/ruta/gitlab/grupo/sub/repo/',
    'HTTPS://SERVIDOR.Example:443/ruta/gitlab/grupo/sub/repo.git',
    'https://usuario:secreto@servidor.example/ruta/gitlab/grupo/sub/repo.git',
    'ssh://git@servidor.example:2222/ruta/gitlab/grupo/sub/repo.git',
    'ssh://git@servidor.example/ruta/gitlab/grupo/sub/repo.git',
    'git@servidor.example:ruta/gitlab/grupo/sub/repo.git',
    'servidor.example:ruta/gitlab/grupo/sub/repo.git',
    'git@servidor.example:/ruta/gitlab/grupo/sub/repo.git',
    // ssh/scp SIN la ruta de la instancia (relative_url_root): la ruta entera es el proyecto.
    'git@servidor.example:grupo/sub/repo.git',
    'ssh://git@servidor.example:2222/grupo/sub/repo.git',
  ]) {
    assert.deepEqual(proyectoDeRemoto(url, BASE_SUB), { ok: true, proyecto: 'grupo/sub/repo' }, url);
  }
  // Base declarada con barra final y mayusculas en el host: misma base.
  assert.deepEqual(proyectoDeRemoto('https://servidor.example/ruta/gitlab/g/r.git', 'HTTPS://Servidor.example/ruta/gitlab/'), {
    ok: true,
    proyecto: 'g/r',
  });
  // Base en la raiz del host.
  assert.deepEqual(proyectoDeRemoto('git@git.empresa.com:acme/repo.git', 'https://git.empresa.com'), { ok: true, proyecto: 'acme/repo' });
});

test('proyectoDeRemoto: la base debe ser prefijo EXACTO; si no, motivo y nada deducido', () => {
  const casos: Array<[string, string, string]> = [
    // [url de origin, base, motivo]
    ['https://otro.example/ruta/gitlab/g/r.git', BASE_SUB, 'host'],
    ['https://servidor.example:8443/ruta/gitlab/g/r.git', BASE_SUB, 'puerto'],
    ['https://servidor.example/ruta/gitlab/g/r.git', 'https://servidor.example:8443/ruta/gitlab', 'puerto'],
    ['https://servidor.example/otra/g/r.git', BASE_SUB, 'ruta'],
    ['https://servidor.example/ruta/gitlab2/g/r.git', BASE_SUB, 'ruta'],
    ['https://servidor.example/ruta/gitl/g/r.git', 'https://servidor.example/ruta/gitlab', 'ruta'],
    ['https://servidor.example/RUTA/gitlab/g/r.git', BASE_SUB, 'ruta'],
    ['http://servidor.example/otra/g/r.git', BASE_SUB, 'ruta'],
    ['git@otro.example:g/r.git', BASE_SUB, 'host'],
    ['ssh://git@otro.example:2222/ruta/gitlab/g/r.git', BASE_SUB, 'host'],
    ['git@servidor.example:repo.git', BASE_SUB, 'proyecto-corto'],
    ['git@servidor.example:ruta/gitlab/repo.git', BASE_SUB, 'proyecto-corto'],
    ['https://servidor.example/ruta/gitlab/solo.git', BASE_SUB, 'proyecto-corto'],
    ['https://servidor.example/ruta/gitlab', BASE_SUB, 'proyecto-corto'],
    ['https://servidor.example/ruta/gitlab/g/-r.git', BASE_SUB, 'proyecto-invalido'],
    ['https://servidor.example/ruta/gitlab/g/r s.git', BASE_SUB, 'proyecto-invalido'],
    ['/tmp/bare.git', BASE_SUB, 'url-sin-red'],
    ['C:\\Users\\x\\bare', BASE_SUB, 'url-sin-red'],
    ['https://servidor.example/ruta/gitlab/g/r.git', 'http://servidor.example/ruta/gitlab', 'base-invalida'],
  ];
  for (const [url, base, motivo] of casos) {
    assert.deepEqual(proyectoDeRemoto(url, base), { ok: false, motivo }, `${url} contra ${base}`);
  }
});

test('proyectoDeRemoto / partesDeOrigin: ninguna salida contiene credenciales', () => {
  const urls = [
    'https://usuario:secreto@servidor.example/ruta/gitlab/g/r.git',
    'https://tok-secreto@servidor.example/otra/g/r.git',
    'ssh://usuario:secreto@servidor.example:2222/ruta/gitlab/g/r.git',
    'https://usuario:con@arroba-secreto@servidor.example/ruta/gitlab/g/r.git',
  ];
  for (const url of urls) {
    for (const base of [BASE_SUB, 'https://servidor.example']) {
      assert.doesNotMatch(JSON.stringify(proyectoDeRemoto(url, base)), /secreto|usuario|arroba/, url);
    }
    assert.doesNotMatch(JSON.stringify(partesDeOrigin(url)), /secreto|usuario|arroba/, url);
    for (const plataforma of ['gitlab', 'github'] as const) {
      const r = resolverRemotoDeclarado([url], { plataforma, urlBase: plataforma === 'gitlab' ? BASE_SUB : null });
      assert.doesNotMatch(JSON.stringify(r), /secreto|usuario|arroba/, url);
    }
  }
});

test('resolverRemotoDeclarado: solo plataforma gitlab usa https://<host de origin> (con puerto solo si origin es https con puerto)', () => {
  const r = resolverRemotoDeclarado(['git@git.empresa.com:acme/sub/repo.git'], { plataforma: 'gitlab', urlBase: null });
  assert.deepEqual(r, {
    ok: true,
    remoto: { plataforma: 'gitlab', host: 'git.empresa.com', declarado: { base: 'https://git.empresa.com', proyecto: 'acme/sub/repo' } },
  });
  const p = resolverRemotoDeclarado(['https://git.empresa.com:8443/acme/repo.git'], { plataforma: 'gitlab', urlBase: null });
  assert.ok(p.ok);
  assert.equal(p.remoto.declarado?.base, 'https://git.empresa.com:8443');
  // El puerto de ssh no es el web.
  const s = resolverRemotoDeclarado(['ssh://git@git.empresa.com:2222/acme/repo.git'], { plataforma: 'gitlab', urlBase: null });
  assert.ok(s.ok);
  assert.equal(s.remoto.declarado?.base, 'https://git.empresa.com');
});

test('resolverRemotoDeclarado: prueba cada URL de origin (la efectiva puede ser local por insteadOf) y, si ninguna encaja, no supone nada', () => {
  const r = resolverRemotoDeclarado(['/tmp/bare.git', 'https://servidor.example/ruta/gitlab/g/r.git'], { plataforma: 'gitlab', urlBase: BASE_SUB });
  assert.ok(r.ok);
  assert.equal(r.remoto.declarado?.proyecto, 'g/r');
  const mal = resolverRemotoDeclarado(['/tmp/bare.git', 'https://servidor.example/otra/g/r.git'], { plataforma: 'gitlab', urlBase: BASE_SUB });
  assert.deepEqual(mal, { ok: false, motivo: 'no-encaja', origen: 'servidor.example/otra/g/r', causa: 'ruta' });
  assert.deepEqual(resolverRemotoDeclarado(['/tmp/bare.git'], { plataforma: 'gitlab', urlBase: null }), {
    ok: false,
    motivo: 'sin-host',
    origen: null,
    causa: null,
  });
  // github: basta el host, sin base.
  assert.deepEqual(resolverRemotoDeclarado(['https://git.empresa.com/acme/repo.git'], { plataforma: 'github', urlBase: null }), {
    ok: true,
    remoto: { plataforma: 'github', host: 'git.empresa.com' },
  });
});
