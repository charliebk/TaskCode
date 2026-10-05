/**
 * TASK-047: `ultimaRondaAprobada` es la puerta compartida de finish y
 * codex-review (antes codex-review la reimplementaba). Ficheros reales en
 * un directorio temporal.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  INFORME_CODEX_RE,
  INFORME_REVISION_RE,
  ultimaRondaAprobada,
} from '../../src/fs/rondas.js';

async function conDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskcode-rondas-'));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const informe = (veredicto: string): string => `# Informe\n\n- Veredicto: ${veredicto}\n`;

test('sin directorio de revision: false, no un error', async () => {
  await conDir(async (dir) => {
    assert.equal(await ultimaRondaAprobada(path.join(dir, 'no-existe'), INFORME_REVISION_RE), false);
  });
});

test('sin informes de la ronda: false', async () => {
  await conDir(async (dir) => {
    await writeFile(path.join(dir, 'peticion-revision-1.md'), 'x');
    assert.equal(await ultimaRondaAprobada(dir, INFORME_REVISION_RE), false);
  });
});

test('solo cuenta la ultima ronda: la 1 aprobada no salva una 2 con cambios', async () => {
  await conDir(async (dir) => {
    await writeFile(path.join(dir, 'informe-revision-1.md'), informe('aprobada'));
    await writeFile(path.join(dir, 'informe-revision-2.md'), informe('cambios-solicitados'));
    assert.equal(await ultimaRondaAprobada(dir, INFORME_REVISION_RE), false);
    await writeFile(path.join(dir, 'informe-revision-3.md'), informe('aprobada-con-correcciones'));
    assert.equal(await ultimaRondaAprobada(dir, INFORME_REVISION_RE), true);
  });
});

test('ronda fragmentada: basta un informe en PENDIENTE para que no apruebe', async () => {
  await conDir(async (dir) => {
    await writeFile(path.join(dir, 'informe-revision-1-java-spring-reviewer.md'), informe('aprobada'));
    await writeFile(path.join(dir, 'informe-revision-1-angular-vue-reviewer.md'), informe('PENDIENTE'));
    assert.equal(await ultimaRondaAprobada(dir, INFORME_REVISION_RE), false);
    await writeFile(path.join(dir, 'informe-revision-1-angular-vue-reviewer.md'), informe('aprobada'));
    assert.equal(await ultimaRondaAprobada(dir, INFORME_REVISION_RE), true);
  });
});

test('Codex lleva su propio contador y no se mezcla con la revision primaria', async () => {
  await conDir(async (dir) => {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'informe-revision-1.md'), informe('aprobada'));
    assert.equal(await ultimaRondaAprobada(dir, INFORME_CODEX_RE), false);
    await writeFile(path.join(dir, 'informe-codex-1.md'), informe('aprobada'));
    assert.equal(await ultimaRondaAprobada(dir, INFORME_CODEX_RE), true);
  });
});
