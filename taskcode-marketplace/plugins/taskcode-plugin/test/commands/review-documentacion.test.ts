/**
 * Verificacion proporcional en las rondas de review (TASK-104, A3b). Repos Git
 * temporales de verdad y los scripts de Git-Flow tal cual. Los tres comandos
 * (completa, selectiva y documentacion) son un script de node que vive FUERA
 * del repo y cuenta sus ejecuciones.
 *
 * review decide con la misma funcion que el freno Stop (`peticionDeTrabajo`),
 * sobre base...HEAD y nunca sobre el delta de la ronda, y solo si el proyecto
 * declara `comando_verificacion_selectiva` (sin ella no corre nada, como en la
 * 0.14.0: decision de Carlos).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
import { runVeredictoCommand } from '../../src/commands/veredicto.js';
import { decidirStop } from '../../src/hooks/freno-stop.js';
import {
  SCRIPTS_DIR,
  sampleTask,
  git,
  commitAll,
  withTempRepo,
  setupTaskEnCursoSoloTarea,
} from '../helpers/review-fixtures.js';

type Comando = 'completa' | 'selectiva' | 'docs';

const SCRIPT = `
const fs = require('node:fs');
const path = require('node:path');
fs.appendFileSync(path.join(__dirname, 'cuenta-' + process.argv[2]), 'x');
if (fs.existsSync(path.join(__dirname, 'falla-' + process.argv[2]))) { console.error(process.argv[2] + ': ERROR, enlace roto'); process.exit(3); }
console.log(process.argv[2] + ': verde');
`;

interface Entorno {
  repoRoot: string;
  tareasRoot: string;
  fuera: string;
  cmd(c: Comando): string;
  ejecuciones(c: Comando): number;
}

/**
 * Repo con la config commiteada en develop y una tarea en curso en su rama, sin
 * ningun cambio aun (solo su tarea.md, que siempre cuenta como documentacion).
 */
async function conTarea(config: (e: Omit<Entorno, 'repoRoot' | 'tareasRoot'>) => string, fn: (e: Entorno) => Promise<void>): Promise<void> {
  const fuera = await mkdtemp(path.join(tmpdir(), 'review-docs-fuera-'));
  await writeFile(path.join(fuera, 'verif.cjs'), SCRIPT, 'utf8');
  const base = {
    fuera,
    cmd: (c: Comando) => `node ${path.join(fuera, 'verif.cjs').split(path.sep).join('/')} ${c}`,
    ejecuciones: (c: Comando) => {
      const f = path.join(fuera, `cuenta-${c}`);
      return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
    },
  };
  try {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config(base), 'utf8');
      await mkdir(path.join(repoRoot, 'docs'), { recursive: true });
      await writeFile(path.join(repoRoot, 'docs', 'guia.md'), 'guia\n', 'utf8');
      commitAll(repoRoot, 'config y docs');
      await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, sampleTask());
      await fn({ ...base, repoRoot, tareasRoot });
    });
  } finally {
    await rm(fuera, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

/** Las tres claves, con `rutas_documentacion: [docs/**]`. */
const tresClaves = (e: { cmd(c: Comando): string }, extra = ''): string =>
  `comando_verificacion: "${e.cmd('completa')}"\n` +
  `comando_verificacion_selectiva: "${e.cmd('selectiva')}"\n` +
  `comando_verificacion_documentacion: "${e.cmd('docs')}"\n` +
  'rutas_documentacion: [docs/**]\n' +
  extra;

async function cambiar(e: Entorno, rel: string, texto: string): Promise<void> {
  await mkdir(path.dirname(path.join(e.repoRoot, rel)), { recursive: true });
  await writeFile(path.join(e.repoRoot, rel), texto, 'utf8');
  commitAll(e.repoRoot, `cambia ${rel}`);
}

const review = (e: Entorno) =>
  runReviewCommand(e.tareasRoot, ['TASK-600'], '2026-11-11', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR });

const peticionDe = (r: Awaited<ReturnType<typeof review>>): string =>
  readFileSync((r.informes[0] as { peticionPath: string }).peticionPath, 'utf8');

const stop = (e: Entorno) =>
  decidirStop({ hook_event_name: 'Stop', stop_hook_active: false, cwd: e.repoRoot }, { env: process.env });

/** Cierra la ronda 1 con un IMPORTANTE para poder abrir la 2 (incremental). */
async function cerrarRondaConCambios(e: Entorno, r1: Awaited<ReturnType<typeof review>>): Promise<void> {
  await writeFile(
    (r1.informes[0] as { informePath: string }).informePath,
    '# Informe de revision — TASK-600 (ronda 1)\n\n- Commit revisado: x\n- Veredicto: PENDIENTE\n\n' +
      '## Hallazgos\n\n| ID | Severidad | Estado | Fichero |\n|---|---|---|---|\n| IMP-1 | IMPORTANTE | corregido | docs/guia.md:1 |\n',
    'utf8'
  );
  commitAll(e.repoRoot, 'informe ronda 1');
  await runVeredictoCommand(e.tareasRoot, ['TASK-600', 'cambios-solicitados'], { repoCwd: e.repoRoot });
}

test('review (TASK-104): ronda de solo documentacion con selectiva y comando de documentacion corre el de documentacion, no la selectiva', async () => {
  await conTarea(tresClaves, async (e) => {
    await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
    const r = await review(e);
    assert.equal(e.ejecuciones('docs'), 1);
    assert.equal(e.ejecuciones('selectiva'), 0);
    assert.equal(e.ejecuciones('completa'), 0);
    const peticion = peticionDe(r);
    assert.match(peticion, /## Verificacion de esta ronda/);
    assert.match(peticion, /- Tipo: comprobacion de documentacion \(comando_verificacion_documentacion\): la tarea solo cambia documentacion/);
    assert.match(peticion, /no se ha corrido ningun test/);
    assert.match(peticion, /docs: verde/);
    assert.doesNotMatch(peticion, /Tipo: selectiva/);
    assert.equal(git(['status', '--porcelain'], e.repoRoot), '');
  });
});

test('review (TASK-104): solo documentacion con selectiva y sin comando de documentacion no corre nada y la peticion lo dice', async () => {
  await conTarea(
    (b) =>
      `comando_verificacion: "${b.cmd('completa')}"\ncomando_verificacion_selectiva: "${b.cmd('selectiva')}"\n` +
      'rutas_documentacion: [docs/**]\n',
    async (e) => {
      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
      const r = await review(e);
      assert.equal(e.ejecuciones('selectiva') + e.ejecuciones('completa') + e.ejecuciones('docs'), 0);
      const peticion = peticionDe(r);
      assert.match(peticion, /- Tipo: ninguna: la tarea solo cambia documentacion .* no declara comando_verificacion_documentacion/);
      assert.match(peticion, /no se ha corrido ningun test ni ninguna comprobacion/);
      assert.doesNotMatch(peticion, /- Comando:/);
    }
  );
});

test('review (TASK-104): solo documentacion SIN selectiva no corre nada aunque haya comando de documentacion (decision de Carlos)', async () => {
  await conTarea(
    (b) =>
      `comando_verificacion: "${b.cmd('completa')}"\ncomando_verificacion_documentacion: "${b.cmd('docs')}"\n` +
      'rutas_documentacion: [docs/**]\n',
    async (e) => {
      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
      const r = await review(e);
      assert.equal(e.ejecuciones('selectiva') + e.ejecuciones('completa') + e.ejecuciones('docs'), 0);
      assert.doesNotMatch(peticionDe(r), /Verificacion de esta ronda/);
    }
  );
});

test('review (TASK-104): codigo en base...HEAD aplica la selectiva, tambien en una ronda incremental cuyo delta solo toca documentacion', async () => {
  await conTarea(tresClaves, async (e) => {
    await cambiar(e, 'src/app.ts', 'export const a = 1;\n');
    const r1 = await review(e);
    assert.equal(e.ejecuciones('selectiva'), 1);
    assert.equal(e.ejecuciones('docs'), 0);
    assert.match(peticionDe(r1), /- Tipo: selectiva \(por impacto respecto a `develop`/);
    await cerrarRondaConCambios(e, r1);
    // La correccion solo toca documentacion: el delta de la ronda 2 es de docs,
    // pero base...HEAD sigue llevando src/app.ts.
    await cambiar(e, 'docs/guia.md', 'guia corregida\n');
    const r2 = await review(e);
    assert.equal(r2.ronda, 2);
    assert.equal(r2.alcance, 'acotada', 'es la ronda incremental, con el delta de la correccion');
    assert.equal(e.ejecuciones('docs'), 0, 'la de documentacion nunca corre con codigo en base...HEAD');
    assert.equal(e.ejecuciones('selectiva'), 2);
    assert.match(peticionDe(r2), /- Tipo: selectiva \(por impacto respecto a `develop`/);
  });
});

test('Stop y review (TASK-104): la misma decision para el mismo diff, con la selectiva declarada', async () => {
  // Solo documentacion: los dos eligen la comprobacion de documentacion.
  await conTarea(tresClaves, async (e) => {
    await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
    const d = await stop(e);
    assert.equal(d.codigo, 0, d.stderr);
    assert.equal(e.ejecuciones('docs'), 1);
    assert.equal(e.ejecuciones('selectiva'), 0);
    const r = await review(e);
    assert.match(peticionDe(r), /- Tipo: comprobacion de documentacion/);
    // Mismo arbol, misma huella: review reutiliza el resultado del Stop.
    assert.match(peticionDe(r), /resultado guardado/);
    assert.equal(e.ejecuciones('docs'), 1);
    assert.equal(e.ejecuciones('selectiva'), 0);
  });
  // Con codigo: los dos eligen la selectiva.
  await conTarea(tresClaves, async (e) => {
    await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
    await cambiar(e, 'src/app.ts', 'export const a = 1;\n');
    const d = await stop(e);
    assert.equal(d.codigo, 0, d.stderr);
    assert.equal(e.ejecuciones('selectiva'), 1);
    const r = await review(e);
    assert.match(peticionDe(r), /- Tipo: selectiva/);
    assert.equal(e.ejecuciones('docs'), 0);
  });
});

test('review (TASK-104): sin rutas_documentacion, como en la 0.14.0 — la selectiva y sin leer la config de la base', async () => {
  await conTarea(
    (b) => `comando_verificacion: "${b.cmd('completa')}"\ncomando_verificacion_selectiva: "${b.cmd('selectiva')}"\n`,
    async (e) => {
      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
      const traza = path.join(e.fuera, 'traza.json');
      const antes = process.env['GIT_TRACE2_EVENT'];
      process.env['GIT_TRACE2_EVENT'] = traza;
      let r;
      try {
        r = await review(e);
      } finally {
        if (antes === undefined) delete process.env['GIT_TRACE2_EVENT'];
        else process.env['GIT_TRACE2_EVENT'] = antes;
      }
      assert.equal(e.ejecuciones('selectiva'), 1);
      assert.equal(e.ejecuciones('docs'), 0);
      const peticion = peticionDe(r);
      assert.match(peticion, /- Tipo: selectiva \(por impacto respecto a `develop`, que recibe en la variable RAMA_BASE\)\. No sustituye a la completa/);
      const argvs = readFileSync(traza, 'utf8')
        .split('\n')
        .filter((l) => l.includes('"event":"start"'))
        .map((l) => (JSON.parse(l) as { argv: string[] }).argv.slice(1).join(' '));
      assert.ok(argvs.length > 0, 'la traza recoge los procesos git');
      assert.ok(!argvs.some((a) => a.includes('show develop:.taskcode/config.yml')), 'no lee la config de la base');
      assert.ok(!argvs.some((a) => a.includes('ls-files --others')), 'no mira el arbol de trabajo');
    }
  );
});

test('review (TASK-104): config de la base invalida — la selectiva, con un aviso, nunca aborta', async () => {
  await conTarea(
    (b) => tresClaves(b, 'timeout_verificacion: "mucho"\n'),
    async (e) => {
      // La rama corrige su config (la de la base sigue invalida) y toca solo docs.
      await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), tresClaves(e), 'utf8');
      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
      const r = await review(e);
      assert.equal(e.ejecuciones('selectiva'), 1);
      assert.equal(e.ejecuciones('docs'), 0);
      assert.ok(
        r.avisos.some((a) => /TASK-600: La configuracion de "develop" no es valida.*verificacion de siempre/.test(a)),
        r.avisos.join('\n')
      );
    }
  );
});

test('review (TASK-104): en una ronda de documentacion la cobertura se oculta y la peticion dice por que (decision de Carlos)', async () => {
  await conTarea(
    (b) => tresClaves(b, 'informe_cobertura: "coverage/lcov.info"\n'),
    async (e) => {
      await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
      const peticion = peticionDe(await review(e));
      assert.doesNotMatch(peticion, /## Cobertura/);
      assert.match(peticion, /- Cobertura: no se muestra en esta ronda\. Solo cambia documentacion y no se ha corrido ningun test/);
    }
  );
});

test('review (TASK-104): la comprobacion de documentacion en rojo aborta sin ronda y dice que fue esa, sin RAMA_BASE', async () => {
  await conTarea(tresClaves, async (e) => {
    await writeFile(path.join(e.fuera, 'falla-docs'), '', 'utf8');
    await cambiar(e, 'docs/guia.md', 'guia ampliada\n');
    await assert.rejects(
      () => review(e),
      (err: unknown) => {
        assert.ok(err instanceof ReviewCommandError);
        assert.match(err.message, /la comprobacion de documentacion \(comando_verificacion_documentacion: solo cambia documentacion\) no esta en verde/);
        assert.match(err.message, /docs: ERROR, enlace roto/);
        assert.doesNotMatch(err.message, /selectiva|RAMA_BASE/);
        return true;
      }
    );
    assert.equal(e.ejecuciones('selectiva'), 0);
    assert.ok(!existsSync(path.join(e.tareasRoot, '03-en-revision', 'TASK-600')), 'la tarea sigue en curso');
    assert.equal(git(['status', '--porcelain'], e.repoRoot), '');
  });
});
