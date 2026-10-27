/**
 * TASK-067, criterio 8: MEN-12 y MEN-13 de TASK-066. Contra repos Git
 * temporales reales. Cada test mata un mutante concreto de
 * informe-revision-3.md (N8, N9, N11, N12, N14, N17).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { OPCIONES_SONDAS_POR_DEFECTO, sondaGitignoreEnv, type ContextoDeploy } from '../../src/fs/sondas-deploy.js';
import { NODE, STRIPE, analisis, commit, conRepo, escribir, git, punto } from '../helpers/deploy-fixtures.js';

/** `n` proyectos node en apps/aNN; `sinIgnore` son los indices (1-based) que NO llevan .gitignore. */
function monorepo(n: number, sinIgnore: number[] = []): Record<string, string> {
  const f: Record<string, string> = { 'README.md': '# monorepo\n' };
  for (let i = 1; i <= n; i++) {
    const d = `apps/a${String(i).padStart(2, '0')}`;
    f[`${d}/package.json`] = '{}\n';
    f[`${d}/package-lock.json`] = '{}\n';
    if (!sinIgnore.includes(i)) f[`${d}/.gitignore`] = '.env\n';
  }
  return f;
}

test('MEN-12: con 12 carpetas de proyecto y la 12 sin .gitignore, FALLA nombrandola (antes: OK con las 10 primeras)', async () => {
  await conRepo(monorepo(12, [12]), async (raiz, opciones) => {
    const p = punto(analisis(raiz, opciones), 'gitignore-cubre-env');
    assert.equal(p.estado, 'falla');
    assert.match(p.motivo, /apps\/a12\/\.env/);
    assert.ok(p.evidencias.length > 0);
  });
});

test('MEN-12 (N11): con 12 carpetas bien, OK y la evidencia trae las 12', async () => {
  await conRepo(monorepo(12), async (raiz, opciones) => {
    const p = punto(analisis(raiz, opciones), 'gitignore-cubre-env');
    assert.equal(p.estado, 'ok', p.motivo);
    assert.match(p.motivo, /las 12 carpetas/);
    assert.equal(p.evidencias.length, 12);
    for (let i = 1; i <= 12; i++) {
      const d = `apps/a${String(i).padStart(2, '0')}/.gitignore`;
      assert.ok(p.evidencias.some((e) => e.fichero === d), `falta la evidencia de ${d}`);
    }
  });
});

test('MEN-12: pasado el tope de carpetas, NO VERIFICADO diciendo cuantas faltan (nunca OK); si ya hay una FALLA, FALLA y lo dice', async () => {
  await conRepo(monorepo(5), async (raiz, opciones) => {
    const p = punto(analisis(raiz, { ...opciones, maxCarpetasGitignore: 3 }), 'gitignore-cubre-env');
    assert.equal(p.estado, 'no-verificado');
    assert.match(p.motivo, /3 de 5 carpetas/);
    assert.match(p.motivo, /faltan 2/);
  });
  await conRepo(monorepo(5, [1]), async (raiz, opciones) => {
    const p = punto(analisis(raiz, { ...opciones, maxCarpetasGitignore: 3 }), 'gitignore-cubre-env');
    assert.equal(p.estado, 'falla');
    assert.match(p.motivo, /2 carpeta\(s\) de proyecto sin comprobar/);
  });
});

test('MEN-13 (N17): la evidencia de la FALLA nombra TODAS las carpetas sin .gitignore, no solo la primera', async () => {
  await conRepo(monorepo(4, [2, 3, 4]), async (raiz, opciones) => {
    const p = punto(analisis(raiz, opciones), 'gitignore-cubre-env');
    assert.equal(p.estado, 'falla');
    assert.match(p.motivo, /y en 2 carpeta\(s\) mas/);
    const texto = p.evidencias.map((e) => e.descripcion).join('\n');
    for (const d of ['apps/a02/.env', 'apps/a03/.env', 'apps/a04/.env']) assert.ok(texto.includes(d), `la evidencia no nombra ${d}`);
    assert.equal(p.evidencias.length, 3);
  });
});

test('MEN-13 (N12): si git check-ignore no se puede ejecutar, el punto es NO VERIFICADO (nunca OK)', () => {
  // cwd inexistente: git no arranca. La sonda se llama directa porque el comando validaria el repo antes.
  const ctx: ContextoDeploy = {
    cwd: path.join(tmpdir(), 'taskctl-dd-no-existe-nunca'),
    presentes: [],
    versionados: [],
    versionadosTodos: [],
    paraEscanear: [],
    hallazgosHistorial: [],
    tipos: [{ id: 'node', nombre: 'Node', rutas: ['.'] }],
    silencios: [],
    silenciosUsados: new Set<number>(),
    opciones: { ...OPCIONES_SONDAS_POR_DEFECTO, pathHerramientas: '' },
  };
  const r = sondaGitignoreEnv(ctx);
  assert.equal(r.estado, 'no-verificado');
  assert.match(r.motivo, /no se pudo ejecutar git check-ignore/);
});

test('MEN-13 (N14): un `// require` en un comentario de go.mod no cuenta como dependencia (sin go.sum sigue OK)', async () => {
  const goMod = 'module ejemplo.com/x\n\ngo 1.22\n\n// require github.com/a/b v1.0.0 (pendiente)\n';
  await conRepo({ 'go.mod': goMod, '.gitignore': '.env\n' }, async (raiz, opciones) => {
    const p = punto(analisis(raiz, opciones), 'lockfile-versionado');
    assert.equal(p.estado, 'ok', p.motivo);
    assert.match(p.evidencias[0]?.descripcion ?? '', /sin bloque require/);
  });
  // Y con un require de verdad, indentado, sin go.sum: FALLA.
  await conRepo({ 'go.mod': 'module ejemplo.com/x\n\ngo 1.22\n\nrequire (\n  github.com/a/b v1.0.0\n)\n', '.gitignore': '.env\n' }, async (raiz, opciones) => {
    assert.equal(punto(analisis(raiz, opciones), 'lockfile-versionado').estado, 'falla');
  });
});

// ---------------------------------------------------------------------
// N8 / N9: el aviso de MEN-10 solo salta si coinciden patron Y fichero
// ---------------------------------------------------------------------

async function repoConHallazgoEnHistorial(fn: (raiz: string, opciones: Parameters<Parameters<typeof conRepo>[1]>[1]) => Promise<void>): Promise<void> {
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { 'viejo.env': `K=${STRIPE}\n` });
    git(['add', '-f', '.'], raiz);
    await commit(raiz, 'env');
    git(['rm', '-q', 'viejo.env'], raiz);
    await commit(raiz, 'quita');
    await fn(raiz, opciones);
  });
}

const silencio = (patron: string, fichero: string): string =>
  `silenciar_1_patron: ${patron}\nsilenciar_1_fichero: ${fichero}\nsilenciar_1_huella: "abcdef012345"\n` +
  'silenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n';

test('MEN-13 (N8): un silencio de arbol de OTRO fichero no recibe el aviso de «exige commit» aunque haya un hallazgo del historial en otra parte', async () => {
  await repoConHallazgoEnHistorial(async (raiz, opciones) => {
    await escribir(raiz, { '.taskcode/doctor-deploy.yml': silencio('stripe-live', 'otro.env') });
    const informe = analisis(raiz, opciones);
    assert.equal(punto(informe, 'secretos-en-historial').estado, 'falla');
    assert.ok(!informe.avisos.some((a) => /exige silenciar_1_commit/.test(a)), informe.avisos.join(' | '));
    assert.ok(informe.avisos.some((a) => /silenciar_1 .* no coincide con ningun hallazgo/.test(a)), informe.avisos.join(' | '));
  });
});

test('MEN-13 (N9): un silencio de arbol de OTRO patron en el mismo fichero tampoco recibe el aviso de «exige commit»', async () => {
  await repoConHallazgoEnHistorial(async (raiz, opciones) => {
    await escribir(raiz, { '.taskcode/doctor-deploy.yml': silencio('aws-access-key', 'viejo.env') });
    const informe = analisis(raiz, opciones);
    assert.ok(!informe.avisos.some((a) => /exige silenciar_1_commit/.test(a)), informe.avisos.join(' | '));
    assert.ok(informe.avisos.some((a) => /silenciar_1 .* no coincide con ningun hallazgo/.test(a)), informe.avisos.join(' | '));
  });
});
