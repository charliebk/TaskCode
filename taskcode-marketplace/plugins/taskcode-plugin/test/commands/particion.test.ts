/**
 * TASK-044: particion propuesta de una tarea demasiado grande. El test que
 * manda es la cadena entera contra un repo Git real (el riesgo que el rol
 * de riesgos senalo como el peor: una particion que import acepta pero que
 * no sirve porque sus hijas nacen bloqueadas): plan del padre bloquea y
 * escribe la propuesta FUERA del repo -> import del fichero -> plan de una
 * hija pasa.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runPlanCommand, PlanCommandError } from '../../src/commands/plan.js';
import { runImportCommand } from '../../src/commands/import.js';
import { extraerSecciones } from '../../src/core/tarea-body.js';
import { proponerParticion } from '../../src/core/particion-tarea.js';
import { parseImportMarkdown } from '../../src/core/import-parser.js';
import { validarEnunciado } from '../../src/core/validacion-tarea.js';
import type { Task } from '../../src/core/task.js';

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-440',
    titulo: 'Config y auto-commit',
    tipo: 'feature',
    sprint: 4,
    etiquetas: [],
    complejidad: null,
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-440-config-y-auto-commit',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-10-04',
    actualizado: '2026-10-04',
    dependencias: [],
    ...overrides,
  };
}

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
  git(['commit', '-q', '-m', message], repoRoot);
}

async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-particion-test-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot, path.join(repoRoot, 'tareas'));
  } finally {
    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

const lista = (prefijo: string, k: number): string =>
  Array.from({ length: k }, (_, i) => `- [ ] \`taskctl\` ${prefijo} ${String(i + 1)}\n`).join('');

/** El caso de TASK-030: dos frentes en negrita, un Transversal y Tras el cierre (18 criterios). */
const CUERPO_DOS_FRENTES =
  '## Objetivo\n\nCerrar config y auto-commit.\n\n## Criterios de aceptacion\n\n' +
  '**C4 — config**\n' + lista('config', 7) + '\n' +
  '**C2 — auto-commit**\n' + lista('commit', 7) + '\n' +
  '**Transversal**\n' + lista('comun', 4) + '\n' +
  '### Tras el cierre\n- [ ] CI en verde\n';

test('extraerSecciones (TASK-044): agrupa por negrita y ###; los sueltos van al grupo sin titulo', () => {
  const s = extraerSecciones(
    '## Criterios de aceptacion\n- [ ] suelto\n**Uno**\n- [ ] a\n  sigue\n### Dos\n- [x] b\n### Tras el cierre\n- [ ] c\n'
  );
  assert.deepEqual(s.grupos, [
    { titulo: null, criterios: ['suelto'] },
    { titulo: 'Uno', criterios: ['a sigue'] },
    { titulo: 'Dos', criterios: ['b'] },
  ]);
  assert.deepEqual(s.criterios, ['suelto', 'a sigue', 'b'], 'los criterios planos no cambian');
  assert.deepEqual(s.criteriosTrasCierre, ['c']);
});

test('proponerParticion (TASK-044): una hija por frente, comunes copiados, Tras el cierre en el preambulo, y import la acepta entera', () => {
  const task = sampleTask();
  const p = proponerParticion(task, extraerSecciones(CUERPO_DOS_FRENTES));
  assert.ok(p !== null);
  assert.deepEqual(p.titulos, ['TASK-440 C4 — config', 'TASK-440 C2 — auto-commit']);
  assert.deepEqual(p.hijasGrandes, [], '7 + 4 = 11 criterios por hija');
  const entradas = parseImportMarkdown(p.markdown);
  assert.equal(entradas.length, 2);
  for (const e of entradas) {
    assert.ok(e.ok, JSON.stringify(e));
    assert.equal(e.criterios.length, 11);
    assert.ok(e.criterios.some((c) => c.includes('comun 1')), 'el transversal se copia');
    assert.ok(!e.criterios.some((c) => c.includes('CI en verde')), 'Tras el cierre no es criterio');
    assert.match(e.objetivo, /Parte de TASK-440/);
    assert.match(e.objetivo, /Cerrar config y auto-commit/);
  }
  assert.match(p.markdown.split('###')[0] ?? '', /«CI en verde»/);
});

test('proponerParticion (TASK-044): con un solo frente (o solo transversales) no hay particion', () => {
  assert.equal(proponerParticion(sampleTask(), extraerSecciones(`## Criterios de aceptacion\n**Uno**\n${lista('a', 13)}`)), null);
  assert.equal(proponerParticion(sampleTask(), extraerSecciones(`## Criterios de aceptacion\n${lista('a', 13)}`)), null);
});

test('validarEnunciado (TASK-044): 2 frentes con 12 criterios o menos avisan, no bloquean', () => {
  const r = validarEnunciado(
    extraerSecciones(`## Objetivo\n\nX.\n\n## Criterios de aceptacion\n### Parser\n${lista('p', 3)}### CLI\n${lista('c', 3)}`)
  );
  assert.deepEqual(r.bloqueos, []);
  assert.equal(r.demasiadoGrande, false);
  assert.ok(r.avisos.some((a) => /tiene 2 frentes \(«Parser», «CLI»\)/.test(a)), r.avisos.join('\n'));
});

/**
 * Mutaciones que lo ponen rojo: no escribir la particion en plan; escribir
 * las hijas sin Objetivo (el plan de la hija bloquearia); convertir el
 * Transversal en una hija propia.
 */
test('plan -> import -> plan (TASK-044): la particion propuesta sirve de verdad', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), CUERPO_DOS_FRENTES);
    commitAll(repoRoot, 'tarea TASK-440');
    const head = git(['rev-parse', 'HEAD'], repoRoot);

    let ruta = '';
    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-440'], '2026-10-04', { repoCwd: repoRoot }),
      (e: unknown) => {
        assert.ok(e instanceof PlanCommandError);
        assert.match(e.message, /tiene 18 criterios/);
        assert.match(e.message, /Particion propuesta en 2 tareas/);
        assert.match(e.message, /retirala a mano/);
        const m = /taskctl import "([^"]+)" --tipo feature --sprint 4/.exec(e.message);
        assert.ok(m !== null, e.message);
        ruta = m[1] as string;
        return true;
      }
    );
    assert.ok(existsSync(ruta));
    assert.ok(path.relative(repoRoot, ruta).startsWith('..'), 'la propuesta vive fuera del repo');
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head, 'plan no commitea nada');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'ni ensucia el workspace');
    assert.equal((await readTareaFile(tareasRoot, 'TASK-440'))?.task.estado, 'planificada');

    try {
      const imp = await runImportCommand(tareasRoot, [ruta], '2026-10-04', { repoCwd: repoRoot });
      assert.equal(imp.creadas.length, 2, JSON.stringify(imp.errores));
      const hija = imp.creadas[0]!;
      const leida = await readTareaFile(tareasRoot, hija.id);
      assert.match(leida?.body ?? '', /## Objetivo\n\nParte de TASK-440/);

      const p = await runPlanCommand(tareasRoot, [hija.id], '2026-10-04', { repoCwd: repoRoot });
      assert.equal((await readTareaFile(tareasRoot, p.id))?.task.estado, 'en-diseno');
    } finally {
      await rm(path.dirname(ruta), { recursive: true, force: true });
    }
  });
});

test('plan (TASK-044): si el directorio temporal cae dentro del repo no escribe y lo dice', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), CUERPO_DOS_FRENTES);
    commitAll(repoRoot, 'tarea TASK-440');
    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-440'], '2026-10-04', { repoCwd: repoRoot, dirParticion: repoRoot }),
      (e: unknown) => {
        assert.ok(e instanceof PlanCommandError);
        assert.match(e.message, /No se pudo escribir la particion propuesta: .*cae dentro del repo/);
        assert.doesNotMatch(e.message, /taskctl import "/);
        return true;
      }
    );
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('plan (TASK-044): demasiado grande y sin grupos, explica como agrupar', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), `## Objetivo\n\nX.\n\n## Criterios de aceptacion\n${lista('a', 13)}`);
    commitAll(repoRoot, 'tarea TASK-440');
    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-440'], '2026-10-04', { repoCwd: repoRoot }),
      (e: unknown) => e instanceof PlanCommandError && /agrupa los criterios por frente/.test(e.message)
    );
  });
});

