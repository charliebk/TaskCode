/**
 * TASK-068: el campo `referencia` del catalogo real de `doctor-deploy` cita la
 * version vigente de OWASP Top 10 y ASVS, con un formato uniforme y solo con
 * categorias y capitulos que existen en esas versiones.
 *
 * Las listas oficiales quedan fijadas aqui a proposito: si OWASP publica una
 * version nueva, este test no cambia solo; hay que volver a verificar contra la
 * fuente y rehacer el mapeo por significado (las categorias se renumeran).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarCatalogoDeploy } from '../../src/core/doctor-deploy-catalogo.js';

/**
 * OWASP Top 10:2025. Fuente: https://top10.owasp.org/2025/ y
 * https://github.com/OWASP/Top10/tree/master/2025/docs/en (consultadas el
 * 2026-11-04; https://owasp.org/Top10/ redirige a la edicion 2025).
 */
const TOP10_2025: Readonly<Record<string, string>> = {
  A01: 'Broken Access Control',
  A02: 'Security Misconfiguration',
  A03: 'Software Supply Chain Failures',
  A04: 'Cryptographic Failures',
  A05: 'Injection',
  A06: 'Insecure Design',
  A07: 'Authentication Failures',
  A08: 'Software or Data Integrity Failures',
  A09: 'Security Logging and Alerting Failures',
  A10: 'Mishandling of Exceptional Conditions',
};

/**
 * ASVS 5.0.0 (estable, publicada el 30 de mayo de 2025). Fuente:
 * https://asvs.owasp.org/ y https://github.com/OWASP/ASVS/tree/master/5.0/en
 * (consultadas el 2026-11-04).
 */
const ASVS_5_0: Readonly<Record<string, string>> = {
  V1: 'Encoding and Sanitization',
  V2: 'Validation and Business Logic',
  V3: 'Web Frontend Security',
  V4: 'API and Web Service',
  V5: 'File Handling',
  V6: 'Authentication',
  V7: 'Session Management',
  V8: 'Authorization',
  V9: 'Self-contained Tokens',
  V10: 'OAuth and OIDC',
  V11: 'Cryptography',
  V12: 'Secure Communication',
  V13: 'Configuration',
  V14: 'Data Protection',
  V15: 'Secure Coding and Architecture',
  V16: 'Security Logging and Error Handling',
  V17: 'WebRTC',
};

const FORMATO = /^OWASP Top 10 2025 (A\d\d); ASVS 5\.0 (V\d{1,2})$/;

const PUNTOS = cargarCatalogoDeploy().puntos;
const CON_REFERENCIA = PUNTOS.filter((p) => p.referencia !== null);

function referenciaDe(id: string): { top10: string; asvs: string } {
  const punto = PUNTOS.find((p) => p.id === id);
  assert.ok(punto, `el punto ${id} existe en el catalogo`);
  const m = FORMATO.exec(punto.referencia ?? '');
  assert.ok(m, `el punto ${id} tiene referencia con formato: ${String(punto.referencia)}`);
  return { top10: m[1]!, asvs: m[2]! };
}

test('ninguna referencia cita la edicion 2021 del Top 10', () => {
  for (const p of CON_REFERENCIA) {
    assert.ok(!p.referencia!.includes('2021'), `${p.id}: ${p.referencia}`);
  }
});

test('todas las referencias siguen el formato "OWASP Top 10 2025 Axx; ASVS 5.0 Vnn"', () => {
  assert.ok(CON_REFERENCIA.length > 0);
  for (const p of CON_REFERENCIA) {
    assert.match(p.referencia!, FORMATO, p.id);
  }
});

test('cada categoria y capitulo citados existen en la lista oficial de su version', () => {
  for (const p of CON_REFERENCIA) {
    const m = FORMATO.exec(p.referencia!)!;
    assert.ok(m[1]! in TOP10_2025, `${p.id}: ${m[1]} no es una categoria del Top 10 2025`);
    assert.ok(m[2]! in ASVS_5_0, `${p.id}: ${m[2]} no es un capitulo del ASVS 5.0`);
  }
});

test('solo licencias-de-dependencias queda sin referencia', () => {
  const sin = PUNTOS.filter((p) => p.referencia === null && p.origen === 'plugin').map((p) => p.id);
  assert.deepEqual(sin, ['licencias-de-dependencias']);
});

test('el mapeo es por significado, no por numero', () => {
  // Inyeccion: A03 en 2021, A05 en 2025.
  assert.deepEqual(referenciaDe('queries-parametrizadas'), { top10: 'A05', asvs: 'V1' });
  // SSRF: A10 en 2021; en 2025 se integra en Broken Access Control (A01).
  assert.deepEqual(referenciaDe('redirecciones-y-ssrf'), { top10: 'A01', asvs: 'V1' });
  // Criptografia: A02 en 2021, A04 en 2025.
  assert.deepEqual(referenciaDe('https-obligatorio'), { top10: 'A04', asvs: 'V12' });
  assert.deepEqual(referenciaDe('hash-de-contrasenas'), { top10: 'A04', asvs: 'V11' });
  // Componentes vulnerables: A06 en 2021, Software Supply Chain Failures (A03) en 2025.
  assert.deepEqual(referenciaDe('dependencias-vulnerables'), { top10: 'A03', asvs: 'V15' });
  // Errores con traza: nueva categoria A10 de 2025 (CWE-209).
  assert.deepEqual(referenciaDe('errores-sin-traza'), { top10: 'A10', asvs: 'V16' });
  // Sesiones: A07 en las dos ediciones, ASVS V7.
  assert.deepEqual(referenciaDe('caducidad-de-sesion'), { top10: 'A07', asvs: 'V7' });
});
