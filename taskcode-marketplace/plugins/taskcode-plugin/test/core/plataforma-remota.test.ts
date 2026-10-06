/**
 * Parte pura de TASK-060: plataforma por la URL de origin, lectura de lo que
 * contestan gh y glab, anotacion de tarea.md y la clave `cierre_por_defecto`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  anotarMergeRequest,
  detectarPlataforma,
  hostDeRemoto,
  interpretarListado,
  ocultarCredenciales,
  urlDeSalidaDeCreacion,
  urlMergeRequestAnotada,
} from '../../src/core/plataforma-remota.js';
import { CIERRES_POR_DEFECTO, CONFIG_DEFAULTS, CLAVES_CONFIG, ConfigError, parsearConfig } from '../../src/core/config.js';
import { extraerFlagsCierre } from '../../src/commands/finish-opciones.js';

test('hostDeRemoto: https, http, ssh://, scp, con usuario, contrasena y puerto; rutas locales y letras de unidad no son host', () => {
  assert.equal(hostDeRemoto('https://github.com/acme/repo.git'), 'github.com');
  assert.equal(hostDeRemoto('https://usuario:secreto@GitHub.com/acme/repo.git'), 'github.com');
  assert.equal(hostDeRemoto('https://usuario:con@arroba@gitlab.empresa.es:8443/g/r.git'), 'gitlab.empresa.es');
  assert.equal(hostDeRemoto('ssh://git@gitlab.com:2222/g/r.git'), 'gitlab.com');
  assert.equal(hostDeRemoto('git@github.com:acme/repo.git'), 'github.com');
  assert.equal(hostDeRemoto('github.com:acme/repo.git'), 'github.com');
  for (const local of ['/tmp/bare.git', 'C:\\Users\\x\\bare', 'C:/Users/x/bare', '../repo', 'file:///tmp/x.git', '', 'origin']) {
    assert.equal(hostDeRemoto(local), null, local);
  }
});

test('detectarPlataforma: github.com -> gh; host con "gitlab" -> glab; cualquier otro host es desconocido (no se supone GitLab)', () => {
  assert.deepEqual(detectarPlataforma('git@github.com:a/b.git'), { ok: true, remoto: { plataforma: 'github', host: 'github.com' } });
  assert.deepEqual(detectarPlataforma('https://gitlab.com/a/b.git'), { ok: true, remoto: { plataforma: 'gitlab', host: 'gitlab.com' } });
  assert.deepEqual(detectarPlataforma('https://gitlab.ieca.es/a/b.git'), { ok: true, remoto: { plataforma: 'gitlab', host: 'gitlab.ieca.es' } });
  assert.deepEqual(detectarPlataforma('https://git.empresa.es/a/b.git'), { ok: false, motivo: 'host-desconocido', host: 'git.empresa.es' });
  // GitHub Enterprise y similares: no es github.com, no se adivina.
  assert.deepEqual(detectarPlataforma('https://github.empresa.es/a/b.git'), { ok: false, motivo: 'host-desconocido', host: 'github.empresa.es' });
  assert.deepEqual(detectarPlataforma('/tmp/bare.git'), { ok: false, motivo: 'sin-host', host: null });
  // La respuesta nunca lleva la URL: solo el host.
  assert.doesNotMatch(JSON.stringify(detectarPlataforma('https://usuario:secreto@git.empresa.es/a/b.git')), /secreto|usuario/);
});

test('ocultarCredenciales y urlDeSalidaDeCreacion', () => {
  assert.equal(ocultarCredenciales("fatal: unable to access 'https://u:tok@github.com/a/b.git/'"), "fatal: unable to access 'https://***@github.com/a/b.git/'");
  assert.equal(ocultarCredenciales('sin url'), 'sin url');
  assert.equal(urlDeSalidaDeCreacion('Creating pull request...\n\nhttps://github.com/a/b/pull/7\n'), 'https://github.com/a/b/pull/7');
  assert.equal(urlDeSalidaDeCreacion('https://u:t@github.com/x\n'), null, 'una URL con usuario no es publicable');
  assert.equal(urlDeSalidaDeCreacion('nada\n'), null);
});

const GH = (estado: string, extra: object = {}) => ({ number: 1, state: estado, url: 'https://github.com/a/b/pull/1', baseRefName: 'develop', headRefName: 'feature/x', mergeCommit: null, ...extra });
const GL = (estado: string, extra: object = {}) => ({ iid: 1, state: estado, web_url: 'https://gitlab.com/a/b/-/merge_requests/1', target_branch: 'develop', source_branch: 'feature/x', merge_commit_sha: null, squash_commit_sha: null, ...extra });

test('interpretarListado (gh): abierto gana a mergeado y mergeado a cerrado; vacio es ninguno; merge/squash dan su commit', () => {
  const j = (o: unknown[]) => JSON.stringify(o);
  assert.deepEqual(interpretarListado('github', '[]', 'feature/x'), { tipo: 'ninguno' });
  assert.deepEqual(interpretarListado('github', j([GH('CLOSED'), GH('OPEN', { url: 'https://github.com/a/b/pull/2' })]), 'feature/x'), { tipo: 'abierto', url: 'https://github.com/a/b/pull/2' });
  const sha = 'a'.repeat(40);
  assert.deepEqual(interpretarListado('github', j([GH('CLOSED'), GH('MERGED', { mergeCommit: { oid: sha } })]), 'feature/x'), {
    tipo: 'integrado',
    url: 'https://github.com/a/b/pull/1',
    base: 'develop',
    commit: sha,
  });
  assert.equal(interpretarListado('github', j([GH('CLOSED')]), 'feature/x').tipo, 'cerrado');
  // Un PR de otra rama (la plataforma devolvio de mas) no cuenta.
  assert.deepEqual(interpretarListado('github', j([GH('OPEN', { headRefName: 'otra' })]), 'feature/x'), { tipo: 'ninguno' });
});

test('interpretarListado (glab): opened/merged/closed, merge_commit_sha o squash_commit_sha, y "null" es ninguno', () => {
  const j = (o: unknown[]) => JSON.stringify(o);
  const sha = 'b'.repeat(40);
  assert.equal(interpretarListado('gitlab', j([GL('opened')]), 'feature/x').tipo, 'abierto');
  assert.deepEqual(interpretarListado('gitlab', j([GL('merged', { squash_commit_sha: sha })]), 'feature/x'), {
    tipo: 'integrado',
    url: 'https://gitlab.com/a/b/-/merge_requests/1',
    base: 'develop',
    commit: sha,
  });
  assert.equal((interpretarListado('gitlab', j([GL('merged')]), 'feature/x') as { commit: unknown }).commit, null);
  assert.equal(interpretarListado('gitlab', j([GL('closed')]), 'feature/x').tipo, 'cerrado');
  assert.deepEqual(interpretarListado('gitlab', 'null', 'feature/x'), { tipo: 'ninguno' });
});

test('interpretarListado: salida irreconocible es DESCONOCIDO, nunca "ninguno" (que llevaria a crear un PR)', () => {
  for (const [p, s] of [
    ['github', 'no es json'],
    ['github', '{"a":1}'],
    ['github', JSON.stringify([GH('RARO')])],
    ['github', JSON.stringify([GH('OPEN', { url: 'javascript:alert(1)' })])],
    ['github', JSON.stringify([GH('MERGED', { mergeCommit: { oid: 'no-sha' } })])],
    ['gitlab', JSON.stringify([GL('desconocido')])],
    ['gitlab', JSON.stringify([5])],
  ] as const) {
    assert.equal(interpretarListado(p, s, 'feature/x').tipo, 'desconocido', `${p} ${s}`);
  }
});

test('anotarMergeRequest / urlMergeRequestAnotada: ida y vuelta, sin confundirse con un bloque de codigo', () => {
  const body = '## Objetivo\nX\n\n## Transiciones\n\n| a |\n';
  const anotado = anotarMergeRequest(body, 'https://github.com/a/b/pull/3', 'github');
  assert.equal(urlMergeRequestAnotada(anotado), 'https://github.com/a/b/pull/3');
  assert.equal(urlMergeRequestAnotada(body), null);
  assert.equal(urlMergeRequestAnotada('```\n## Merge request\n\n- URL del merge request: https://x.com/1\n```\n'), null);
  assert.equal(urlMergeRequestAnotada('## Merge request\n\n- URL del merge request: https://u:t@x.com/1\n'), null);
  // CRLF se conserva.
  assert.match(anotarMergeRequest('a\r\n', 'https://x.com/1', 'gitlab'), /\r\n- Plataforma: gitlab\r\n$/);
});

test('extraerFlagsCierre: --tag con valor separado o con "=", --merge-request suelto; errores claros', () => {
  assert.deepEqual(extraerFlagsCierre(['TASK-1', '--tag', 'v1', '--merge-request']), { tag: 'v1', mergeRequest: true, resto: ['TASK-1'] });
  assert.deepEqual(extraerFlagsCierre(['--tag=v2', 'TASK-1']), { tag: 'v2', mergeRequest: false, resto: ['TASK-1'] });
  assert.deepEqual(extraerFlagsCierre(['TASK-1']), { tag: null, mergeRequest: false, resto: ['TASK-1'] });
  assert.throws(() => extraerFlagsCierre(['TASK-1', '--tag']), /necesita un nombre/);
  assert.throws(() => extraerFlagsCierre(['TASK-1', '--tag=']), /necesita un nombre/);
  assert.throws(() => extraerFlagsCierre(['TASK-1', '--tag', '--push']), /necesita un nombre/);
  assert.throws(() => extraerFlagsCierre(['--tag', 'a', '--tag', 'b']), /repetido/);
});

// cierre_por_defecto (criterio 9)

const RUTA = '/x/.taskcode/config.yml';

test('config: cierre_por_defecto vale merge por defecto y acepta merge y merge-request', () => {
  assert.equal(CONFIG_DEFAULTS.cierre_por_defecto, 'merge');
  assert.equal(parsearConfig('', RUTA).cierre_por_defecto, 'merge');
  for (const v of CIERRES_POR_DEFECTO) assert.equal(parsearConfig(`cierre_por_defecto: ${v}\n`, RUTA).cierre_por_defecto, v);
  assert.ok((CLAVES_CONFIG as readonly string[]).includes('cierre_por_defecto'));
});

test('config: cierre_por_defecto mal escrito, vacio o repetido aborta como el resto de claves', () => {
  assert.throws(
    () => parsearConfig('cierre_por_defecto: merge-requests\n', RUTA),
    (e: Error) => e instanceof ConfigError && /merge, merge-request/.test(e.message) && /Querias decir "merge-request"/.test(e.message)
  );
  assert.throws(() => parsearConfig('cierre_por_defecto: pr\n', RUTA), ConfigError);
  assert.throws(() => parsearConfig('cierre_por_defecto:\n', RUTA), ConfigError);
  assert.throws(() => parsearConfig('cierre_por_defecto: merge\ncierre_por_defecto: merge-request\n', RUTA), /repetida/);
  // La clave vecina mal escrita sugiere la nueva.
  assert.throws(() => parsearConfig('cierre_por_defect: merge\n', RUTA), /Quiza quisiste decir "cierre_por_defecto"/);
});
