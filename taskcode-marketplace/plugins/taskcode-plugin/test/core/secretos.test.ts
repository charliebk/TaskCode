/**
 * TASK-066: patrones de claves y enmascarado. Cada patron tiene su par
 * «detecta» / «no da falso positivo».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buscarSecretos, enmascarar, ocultarSecretos } from '../../src/core/secretos.js';
import {
  AWS,
  AWS_EJEMPLO,
  GITHUB_TOKEN,
  PEM_CABECERA,
  PEM_PIE,
  SLACK,
  STRIPE_LIVE as STRIPE,
  STRIPE_TEST_EJEMPLO,
} from '../helpers/claves-falsas.js';

const b64url = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (payload: unknown): string => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.firmaFirmaFirmaFirma`;

test('detecta una clave de AWS y una sk_live_, con linea, y sin devolver el valor', () => {
  const h = buscarSecretos(`# config\nAWS=${AWS}\n\nSTRIPE="${STRIPE}"\n`);
  assert.deepEqual(h.map((x) => [x.patron, x.clase, x.linea]), [
    ['aws-access-key', 'secreto', 2],
    ['stripe-live', 'secreto', 4],
  ]);
  for (const x of h) {
    assert.ok(!JSON.stringify(x).includes(AWS.slice(4)), 'el valor crudo no puede estar en el hallazgo');
    assert.ok(!JSON.stringify(x).includes(STRIPE.slice(5)), 'el valor crudo no puede estar en el hallazgo');
  }
});

test('las claves de ejemplo y de prueba no son secretos', () => {
  const h = buscarSecretos(`${AWS_EJEMPLO}\n${STRIPE_TEST_EJEMPLO}\n`);
  assert.deepEqual(h.map((x) => [x.patron, x.clase]), [['aws-access-key', 'ejemplo'], ['stripe-test', 'ejemplo']]);
});

test('Supabase: la anon es publica y la service_role es secreta; otro JWT se descarta', () => {
  const h = buscarSecretos(
    `ANON=${jwt({ role: 'anon' })}\nSERVICE=${jwt({ role: 'service_role' })}\nSESION=${jwt({ sub: 'u1' })}\n`
  );
  assert.deepEqual(h.map((x) => [x.patron, x.clase, x.linea]), [
    ['supabase-anon', 'publica', 1],
    ['supabase-service-role', 'secreto', 2],
  ]);
});

test('Firebase: la apiKey web AIza es publica', () => {
  const h = buscarSecretos('apiKey: "AIza' + 'SyA-1234567890abcdefghijklmnopqrstu' + '"');
  assert.deepEqual(h.map((x) => [x.patron, x.clase]), [['firebase-web-api-key', 'publica']]);
});

test('clave privada PEM, token de GitHub y de Slack', () => {
  const t = `${PEM_CABECERA}\nxx\n${PEM_PIE}\n${GITHUB_TOKEN}\n${SLACK}\n`;
  assert.deepEqual(buscarSecretos(t).map((x) => x.patron), ['clave-privada', 'github-token', 'slack-token']);
  assert.deepEqual(buscarSecretos('-----BEGIN PUBLIC KEY-----\n'), []);
});

test('URL con credenciales: una contrasena real si, un marcador o localhost no', () => {
  assert.deepEqual(buscarSecretos('postgres://app:Xk29sLq81Zp@db.interno.net/prod').map((x) => x.patron), ['url-con-credenciales']);
  assert.deepEqual(buscarSecretos('postgres://app:password@db.interno.net/prod'), []);
  assert.deepEqual(buscarSecretos('postgres://app:Xk29sLq81Zp@localhost/dev'), []);
  assert.deepEqual(buscarSecretos('postgres://app:${DB_PASSWORD}@db.interno.net/prod'), []);
});

test('texto normal, hashes de integridad y UUID no son claves', () => {
  const t = 'sha512-Zq81xKd0TvR4mNb7YcW2pLfHabcdefghijklmnopqrstuvwxyz0123456789==\n550e8400-e29b-41d4-a716-446655440000\nconst token = getToken();\n';
  assert.deepEqual(buscarSecretos(t), []);
});

test('enmascarar deja como mucho 4 caracteres y la longitud', () => {
  assert.equal(enmascarar(STRIPE), 'sk_l**** (32 caracteres)');
  assert.equal(enmascarar('abc'), '**** (3 caracteres)');
});

test('ocultarSecretos reescribe cualquier clave que se haya colado en un texto', () => {
  const t = `error con ${STRIPE} y ${AWS} y postgres://app:Xk29sLq81Zp@db.interno.net/x`;
  const o = ocultarSecretos(t);
  assert.ok(!o.includes(STRIPE.slice(4)));
  assert.ok(!o.includes(AWS.slice(4)));
  assert.ok(!o.includes('Xk29sLq81Zp'));
  assert.match(o, /app:\*\*\*\*@db\.interno\.net/);
  assert.equal(ocultarSecretos(o), o, 'es idempotente');
});
