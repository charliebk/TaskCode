/**
 * TASK-066: interpretes de la salida de las herramientas de auditoria. Se
 * prueban con muestras del formato documentado de cada herramienta (no se
 * ejecutan: necesitan red). Lo que importa: una salida que no se entiende es
 * NO VERIFICADO, nunca OK; FALLA solo desde alta/critica.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  interpretarCargoAudit,
  interpretarDotnetVulnerable,
  interpretarGovulncheck,
  interpretarNpmAudit,
  interpretarPipAudit,
  interpretarYarnAudit,
} from '../../src/core/doctor-deploy-auditoria.js';

const npm = (v: Record<string, number>, extra: Record<string, unknown> = {}): string =>
  JSON.stringify({ metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, ...v } }, ...extra });

test('npm: cero vulnerabilidades es OK', () => {
  assert.equal(interpretarNpmAudit('npm', npm({}), 0).estado, 'ok');
});

test('npm: moderadas y bajas se listan pero no fallan', () => {
  const v = interpretarNpmAudit('npm', npm({ moderate: 2, low: 1 }, { vulnerabilities: { lodash: { severity: 'moderate' } } }), 1);
  assert.equal(v.estado, 'ok');
  assert.deepEqual(v.otras, ['lodash (moderate)']);
});

test('npm: alta o critica es FALLA y nombra el paquete', () => {
  const v = interpretarNpmAudit('npm', npm({ high: 1 }, { vulnerabilities: { minimist: { severity: 'high' } } }), 1);
  assert.equal(v.estado, 'falla');
  assert.deepEqual(v.graves, ['minimist (high)']);
  assert.equal(interpretarNpmAudit('npm', npm({ critical: 1 }), 1).estado, 'falla');
});

test('npm: error de red, JSON roto, sin metadata o codigo raro son NO VERIFICADO', () => {
  assert.equal(interpretarNpmAudit('npm', JSON.stringify({ error: { code: 'ENOTFOUND', summary: 'sin red' } }), 1).estado, 'no-verificado');
  assert.equal(interpretarNpmAudit('npm', 'esto no es json', 0).estado, 'no-verificado');
  assert.equal(interpretarNpmAudit('npm', '{}', 0).estado, 'no-verificado');
  assert.equal(interpretarNpmAudit('npm', npm({}), 2).estado, 'no-verificado');
  assert.equal(interpretarNpmAudit('npm', npm({}), null).estado, 'no-verificado');
  // exit 1 sin vulnerabilidades en el informe: algo fallo
  assert.equal(interpretarNpmAudit('npm', npm({}), 1).estado, 'no-verificado');
});

test('yarn clasico: lee auditSummary y los avisos', () => {
  const limpio = '{"type":"auditSummary","data":{"vulnerabilities":{"info":0,"low":0,"moderate":0,"high":0,"critical":0}}}\n';
  assert.equal(interpretarYarnAudit(limpio).estado, 'ok');
  const malo =
    '{"type":"auditAdvisory","data":{"advisory":{"module_name":"tar","severity":"high"}}}\n' +
    '{"type":"auditSummary","data":{"vulnerabilities":{"info":0,"low":0,"moderate":0,"high":1,"critical":0}}}\n';
  const v = interpretarYarnAudit(malo);
  assert.equal(v.estado, 'falla');
  assert.deepEqual(v.graves, ['tar (high)']);
  assert.equal(interpretarYarnAudit('{"type":"info"}\n').estado, 'no-verificado');
  assert.equal(interpretarYarnAudit('basura').estado, 'no-verificado');
});

test('cargo audit: found false es OK, found true es FALLA (sin severidad = alta), lo ilegible NO VERIFICADO', () => {
  assert.equal(interpretarCargoAudit(JSON.stringify({ vulnerabilities: { found: false, count: 0, list: [] } }), 0).estado, 'ok');
  const malo = JSON.stringify({ vulnerabilities: { found: true, count: 1, list: [{ advisory: { id: 'RUSTSEC-2020-0001' }, package: { name: 'time' } }] } });
  const v = interpretarCargoAudit(malo, 1);
  assert.equal(v.estado, 'falla');
  assert.deepEqual(v.graves, ['time (RUSTSEC-2020-0001)']);
  assert.equal(interpretarCargoAudit('{}', 0).estado, 'no-verificado');
  assert.equal(interpretarCargoAudit('', 2).estado, 'no-verificado');
});

test('pip-audit: dependencias sin vulns es OK; con vulns, FALLA', () => {
  const limpio = JSON.stringify({ dependencies: [{ name: 'flask', version: '3.0.0', vulns: [] }] });
  assert.equal(interpretarPipAudit(limpio, 0).estado, 'ok');
  const malo = JSON.stringify({ dependencies: [{ name: 'flask', version: '0.1', vulns: [{ id: 'PYSEC-1' }] }] });
  assert.equal(interpretarPipAudit(malo, 1).estado, 'falla');
  assert.equal(interpretarPipAudit('{"otra":1}', 0).estado, 'no-verificado');
  assert.equal(interpretarPipAudit(limpio, 3).estado, 'no-verificado');
});

test('dotnet: lee la severidad de la tabla; sin tabla ni confirmacion, NO VERIFICADO', () => {
  const malo = "The following sources were used:\n\nProject `app` has the following vulnerable packages\n   [net8.0]:\n   Top-level Package      Requested   Resolved   Severity   Advisory URL\n   > Newtonsoft.Json      12.0.1      12.0.1     High       https://github.com/advisories/GHSA-5crp\n   > Other.Pkg            1.0.0       1.0.0      Moderate   https://x\n";
  const v = interpretarDotnetVulnerable(malo, 0);
  assert.equal(v.estado, 'falla');
  assert.deepEqual(v.graves, ['Newtonsoft.Json (High)']);
  assert.deepEqual(v.otras, ['Other.Pkg (Moderate)']);
  assert.equal(interpretarDotnetVulnerable("The given project `app` has no vulnerable packages given the current sources.\n", 0).estado, 'ok');
  assert.equal(interpretarDotnetVulnerable('error NU1100\n', 0).estado, 'no-verificado');
  assert.equal(interpretarDotnetVulnerable('', 1).estado, 'no-verificado');
});

test('govulncheck: exige confirmacion explicita para OK', () => {
  assert.equal(interpretarGovulncheck('No vulnerabilities found.\n', 0).estado, 'ok');
  assert.equal(interpretarGovulncheck('Vulnerability #1: GO-2023-1234\n  algo\n', 3).estado, 'falla');
  assert.equal(interpretarGovulncheck('', 0).estado, 'no-verificado');
  assert.equal(interpretarGovulncheck('boom', 1).estado, 'no-verificado');
});
