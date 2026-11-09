/**
 * Verificacion selectiva por impacto (TASK-091). Repos Git temporales de
 * verdad y los scripts de Git-Flow tal cual. Los dos comandos (completa y
 * selectiva) son scripts de node que viven FUERA del repo (no ensucian el
 * workspace) y leen su desenlace de un fichero junto a ellos; cuentan sus
 * ejecuciones y la selectiva apunta la RAMA_BASE que recibio.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CONFIG_DEFAULTS, CLAVES_CONFIG, parsearConfig } from '../../src/core/config.js';
import { comprobarVerificacionSelectiva } from '../../src/commands/doctor.js';
import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
import { decidirStop } from '../../src/hooks/freno-stop.js';
import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
import { verificarConMemo } from '../../src/fs/verificacion.js';
import { resolverConfig } from '../../src/core/config.js';
import {
  SCRIPTS_DIR as SCRIPTS_FINISH,
  sampleTask as tareaFinish,
  commitAll as commitFinish,
  withTempRepo as repoFinish,
  setupTaskEnRevision,
} from '../helpers/finish-fixtures.js';
import {
  SCRIPTS_DIR as SCRIPTS_REVIEW,
  sampleTask as tareaReview,
  git,
  commitAll as commitReview,
  withTempRepo as repoReview,
  setupTaskEnCurso,
} from '../helpers/review-fixtures.js';

const RUTA = '/repo/.taskcode/config.yml';

// ---------------------------------------------------------------------
// Scripts de verificacion, fuera del repo
// ---------------------------------------------------------------------

const SCRIPT = `
const fs = require('node:fs');
const dir = __dirname;
const nombre = process.argv[2];
fs.appendFileSync(dir + '/cuenta-' + nombre, 'x');
fs.writeFileSync(dir + '/base-' + nombre, process.env.RAMA_BASE === undefined ? '(sin RAMA_BASE)' : process.env.RAMA_BASE);
const d = fs.readFileSync(dir + '/desenlace-' + nombre, 'utf8').trim();
if (d === 'ok') { console.log(nombre + ': todo en verde'); process.exit(0); }
if (d === 'ensucia') { fs.writeFileSync('artefacto.txt', 'x'); process.exit(0); }
console.error(nombre + ': ERROR, 2 tests fallan'); process.exit(3);
`;

type Desenlace = 'ok' | 'ko' | 'ensucia';

interface Verifs {
  dir: string;
  comando(nombre: 'completa' | 'selectiva'): string;
  desenlace(nombre: 'completa' | 'selectiva', d: Desenlace): Promise<void>;
  ejecuciones(nombre: 'completa' | 'selectiva'): number;
  base(nombre: 'completa' | 'selectiva'): string | null;
}

async function conScripts<T>(fn: (v: Verifs) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), 'verif-selectiva-'));
  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
  for (const n of ['completa', 'selectiva']) await writeFile(path.join(dir, `desenlace-${n}`), 'ok', 'utf8');
  const leer = (f: string): string | null => (existsSync(path.join(dir, f)) ? readFileSync(path.join(dir, f), 'utf8') : null);
  const v: Verifs = {
    dir,
    comando: (n) => `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')} ${n}`,
    desenlace: (n, d) => writeFile(path.join(dir, `desenlace-${n}`), d, 'utf8'),
    ejecuciones: (n) => (leer(`cuenta-${n}`) ?? '').length,
    base: (n) => leer(`base-${n}`),
  };
  try {
    return await fn(v);
  } finally {
    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
  }
}

async function escribirConfig(repoRoot: string, contenido: string): Promise<void> {
  await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
  await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), contenido, 'utf8');
}

const dosClaves = (v: Verifs): string =>
  `comando_verificacion: "${v.comando('completa')}"\ncomando_verificacion_selectiva: "${v.comando('selectiva')}"\n`;

// ---------------------------------------------------------------------
// Config (criterio 1)
// ---------------------------------------------------------------------

test('config (TASK-091): sin la clave, selectiva null y timeout 600; las dos claves son conocidas', () => {
  assert.equal(CONFIG_DEFAULTS.comando_verificacion_selectiva, null);
  assert.equal(CONFIG_DEFAULTS.timeout_verificacion_selectiva, 600);
  assert.ok((CLAVES_CONFIG as readonly string[]).includes('comando_verificacion_selectiva'));
  assert.ok((CLAVES_CONFIG as readonly string[]).includes('timeout_verificacion_selectiva'));
  const c = parsearConfig('comando_verificacion: "npm test"\n', RUTA);
  assert.equal(c.comando_verificacion_selectiva, null);
  assert.equal(c.timeout_verificacion_selectiva, 600);
});

test('config (TASK-091): con completa, la selectiva y su timeout se leen (recortada)', () => {
  const c = parsearConfig(
    'comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "  node scripts/sel.js  "\ntimeout_verificacion_selectiva: 120\n',
    RUTA
  );
  assert.equal(c.comando_verificacion_selectiva, 'node scripts/sel.js');
  assert.equal(c.timeout_verificacion_selectiva, 120);
  assert.equal(c.timeout_verificacion, 600, 'el timeout de la completa no cambia');
});

test('config (TASK-091): fallo cerrado — selectiva sin completa, timeout sin su comando y valores invalidos abortan', () => {
  assert.throws(
    () => parsearConfig('comando_verificacion_selectiva: "node sel.js"\n', RUTA),
    /"comando_verificacion_selectiva" necesita tambien "comando_verificacion"[\s\S]*antes de integrar se exige la completa/
  );
  assert.throws(
    () => parsearConfig('comando_verificacion: "npm test"\ntimeout_verificacion_selectiva: 60\n', RUTA),
    /"timeout_verificacion_selectiva" sin "comando_verificacion_selectiva" no hace nada/
  );
  assert.throws(
    () => parsearConfig('comando_verificacion: "npm test"\ncomando_verificacion_selectiva: ""\n', RUTA),
    /"comando_verificacion_selectiva" debe ser un comando/
  );
  for (const malo of ['0', '-5', '1.5', 'diez']) {
    assert.throws(
      () =>
        parsearConfig(
          `comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node sel.js"\ntimeout_verificacion_selectiva: ${malo}\n`,
          RUTA
        ),
      /"timeout_verificacion_selectiva" debe ser un numero entero/,
      malo
    );
  }
});

// ---------------------------------------------------------------------
// Hook Stop (criterio 2) y guardian
// ---------------------------------------------------------------------

/** Repo con una tarea en curso en su rama, nacida de develop (o de main si es hotfix). */
async function conTareaEnCurso(
  config: string,
  fn: (raiz: string) => Promise<void>,
  tarea: { tipo?: 'feature' | 'hotfix'; rama?: string } = {}
): Promise<void> {
  await repoReview(async (repoRoot, tareasRoot) => {
    // Un hotfix nace de la principal: la config tiene que estar alli.
    if (tarea.tipo === 'hotfix') git(['checkout', '-q', 'main'], repoRoot);
    await escribirConfig(repoRoot, config);
    commitReview(repoRoot, 'config');
    const task = tareaReview({
      id: 'TASK-910',
      tipo: tarea.tipo ?? 'feature',
      rama: tarea.rama ?? 'feature/task-910-selectiva',
    });
    git(['checkout', '-q', '-b', task.rama], repoRoot);
    await writeTareaFile(tareasRoot, task, '## Objetivo\nx\n');
    commitReview(repoRoot, 'tarea en curso');
    await fn(repoRoot);
  });
}

const stop = (raiz: string) => decidirStop({ hook_event_name: 'Stop', stop_hook_active: false, cwd: raiz });

test('Stop (TASK-091): con la clave corre la selectiva (no la completa) con RAMA_BASE=develop', async () => {
  await conScripts(async (v) => {
    await conTareaEnCurso(dosClaves(v), async (raiz) => {
      const d = await stop(raiz);
      assert.equal(d.codigo, 0, d.stderr);
      assert.equal(v.ejecuciones('selectiva'), 1);
      assert.equal(v.ejecuciones('completa'), 0, 'la completa no se corre en el fin de turno');
      assert.equal(v.base('selectiva'), 'develop');
      // Misma huella: el siguiente fin de turno reutiliza el memo de la selectiva.
      assert.equal((await stop(raiz)).codigo, 0);
      assert.equal(v.ejecuciones('selectiva'), 1);
    });
  });
});

test('Stop (TASK-091): en un hotfix la base que recibe la selectiva es la principal', async () => {
  await conScripts(async (v) => {
    await conTareaEnCurso(
      dosClaves(v),
      async (raiz) => {
        assert.equal((await stop(raiz)).codigo, 0);
        assert.equal(v.base('selectiva'), 'main');
      },
      { tipo: 'hotfix', rama: 'hotfix/task-910-urgente' }
    );
  });
});

test('Stop (TASK-091): selectiva en rojo bloquea el turno y dice que fue la selectiva', async () => {
  await conScripts(async (v) => {
    await v.desenlace('selectiva', 'ko');
    await conTareaEnCurso(dosClaves(v), async (raiz) => {
      const d = await stop(raiz);
      assert.equal(d.codigo, 2);
      assert.match(d.stderr, /selectiva: ERROR, 2 tests fallan/);
      assert.match(d.stderr, /Es la verificacion selectiva \(por impacto respecto a develop\)/);
      assert.equal(v.ejecuciones('completa'), 0);
    });
  });
});

test('Stop (TASK-091): sin la clave corre la completa, sin RAMA_BASE, como antes', async () => {
  await conScripts(async (v) => {
    await conTareaEnCurso(`comando_verificacion: "${v.comando('completa')}"\n`, async (raiz) => {
      assert.equal((await stop(raiz)).codigo, 0);
      assert.equal(v.ejecuciones('completa'), 1);
      assert.equal(v.ejecuciones('selectiva'), 0);
      assert.equal(v.base('completa'), '(sin RAMA_BASE)');
    });
  });
});

test('guardian (TASK-091): un verde de la selectiva no abre la puerta aunque los dos comandos sean el mismo texto', async () => {
  await conScripts(async (v) => {
    const mismo = v.comando('completa');
    const merge = 'git checkout develop && git merge --no-ff feature/task-910-selectiva';
    // Con la selectiva declarada (mismo texto que la completa), el verde del Stop no cuenta.
    await conTareaEnCurso(
      `comando_verificacion: "${mismo}"\ncomando_verificacion_selectiva: "${mismo}"\n`,
      async (raiz) => {
        assert.equal((await stop(raiz)).codigo, 0);
        assert.equal(v.ejecuciones('completa'), 1);
        // Por si sola, sin contar con la huella: la selectiva no escribe el memo que lee el guardian.
        assert.ok(!existsSync(path.join(raiz, '.git', 'freno-verificacion.json')), 'la selectiva no toca el memo de la completa');
        assert.ok(existsSync(path.join(raiz, '.git', 'freno-verificacion-selectiva.json')));
        assert.equal(decidirPreToolUse({ cwd: raiz, tool_input: { command: merge } }).codigo, 2);
      }
    );
    // Contraste: sin selectiva, ese mismo verde del Stop (arbol limpio) si deja pasar el merge.
    await conTareaEnCurso(`comando_verificacion: "${mismo}"\n`, async (raiz) => {
      assert.equal((await stop(raiz)).codigo, 0);
      assert.equal(decidirPreToolUse({ cwd: raiz, tool_input: { command: merge } }).codigo, 0);
    });
  });
});

test('memo (TASK-091): la selectiva no pisa el verde de la completa, y su huella cambia si avanza la base', async () => {
  await conScripts(async (v) => {
    await conTareaEnCurso(dosClaves(v), async (raiz) => {
      const completa = { tipo: 'completa' as const, comando: v.comando('completa'), timeoutS: 600 };
      const selectiva = { tipo: 'selectiva' as const, comando: v.comando('selectiva'), timeoutS: 600, base: 'develop' };
      assert.equal(verificarConMemo(raiz, completa).deMemo, false);
      assert.equal(verificarConMemo(raiz, selectiva).deMemo, false);
      assert.equal(verificarConMemo(raiz, completa).deMemo, true, 'el memo de la completa sigue ahi');
      assert.equal(verificarConMemo(raiz, selectiva).deMemo, true);
      // develop avanza: lo cambiado respecto a la base es otro, la selectiva se repite.
      const rama = git(['branch', '--show-current'], raiz).trim();
      git(['checkout', '-q', 'develop'], raiz);
      await writeFile(path.join(raiz, 'otro.txt'), 'x\n', 'utf8');
      commitReview(raiz, 'avanza develop');
      git(['checkout', '-q', rama], raiz);
      assert.equal(verificarConMemo(raiz, selectiva).deMemo, false);
      assert.equal(verificarConMemo(raiz, completa).deMemo, true, 'la huella de la completa no mira la base');
      assert.throws(() => verificarConMemo(raiz, { ...selectiva, base: '' }), /necesita la rama base/);
    });
  });
});

// ---------------------------------------------------------------------
// review (criterio 2 y decisiones de Carlos)
// ---------------------------------------------------------------------

async function conTareaParaReview(
  config: string,
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  await repoReview(async (repoRoot, tareasRoot) => {
    await escribirConfig(repoRoot, config);
    commitReview(repoRoot, 'config');
    await setupTaskEnCurso(repoRoot, tareasRoot, tareaReview());
    await fn(repoRoot, tareasRoot);
  });
}

const review = (repoRoot: string, tareasRoot: string) =>
  runReviewCommand(tareasRoot, ['TASK-600'], '2026-11-09', { repoCwd: repoRoot, scriptsDir: SCRIPTS_REVIEW });

test('review (TASK-091): con la clave corre la selectiva con la base y la peticion dice cual fue, con su salida', async () => {
  await conScripts(async (v) => {
    await conTareaParaReview(dosClaves(v), async (repoRoot, tareasRoot) => {
      const r = await review(repoRoot, tareasRoot);
      assert.equal(v.ejecuciones('selectiva'), 1);
      assert.equal(v.ejecuciones('completa'), 0, 'review no corre la completa');
      assert.equal(v.base('selectiva'), 'develop');
      const peticion = readFileSync((r.informes[0] as { peticionPath: string }).peticionPath, 'utf8');
      assert.match(peticion, /## Verificacion de esta ronda/);
      assert.match(peticion, /- Tipo: selectiva \(por impacto respecto a `develop`/);
      assert.match(peticion, /el cierre la exige/);
      assert.match(peticion, /- Resultado: salio con codigo 0/);
      assert.match(peticion, /selectiva: todo en verde/);
      // La seccion va despues de la cabecera: el parser del commit revisado toma la primera coincidencia.
      assert.ok(peticion.indexOf('Commit revisado') < peticion.indexOf('## Verificacion de esta ronda'));
      assert.equal(git(['status', '--porcelain'], repoRoot), '');
    });
  });
});

test('review (TASK-091): selectiva en rojo aborta sin ronda; la tarea sigue en curso (decision de Carlos)', async () => {
  await conScripts(async (v) => {
    await v.desenlace('selectiva', 'ko');
    await conTareaParaReview(dosClaves(v), async (repoRoot, tareasRoot) => {
      await assert.rejects(
        () => review(repoRoot, tareasRoot),
        (e: unknown) => {
          assert.ok(e instanceof ReviewCommandError);
          assert.match(e.message, /verificacion selectiva .* no esta en verde, asi que no se abre ronda/);
          assert.match(e.message, /la tarea sigue en curso/);
          assert.match(e.message, /la base ya se ha integrado en la rama/);
          assert.match(e.message, /selectiva: ERROR, 2 tests fallan/);
          assert.match(e.message, /con la variable de entorno RAMA_BASE=develop/);
          return true;
        }
      );
      assert.equal((await readTareaFile(tareasRoot, 'TASK-600'))?.task.estado, 'en-curso');
      const carpeta = path.join(tareasRoot, '02-en-curso', 'TASK-600');
      const revision = path.join(carpeta, 'revision');
      assert.ok(!existsSync(revision) || (await readdir(revision)).length === 0, 'no queda ninguna ronda a medias');
      assert.equal(git(['status', '--porcelain'], repoRoot), '');
    });
  });
});

test('review (TASK-091): una selectiva que ensucia el arbol aborta sin ronda', async () => {
  await conScripts(async (v) => {
    await v.desenlace('selectiva', 'ensucia');
    await conTareaParaReview(dosClaves(v), async (repoRoot, tareasRoot) => {
      await assert.rejects(() => review(repoRoot, tareasRoot), /ha dejado cambios en el arbol de trabajo[\s\S]*No se ha abierto ronda/);
      assert.equal((await readTareaFile(tareasRoot, 'TASK-600'))?.task.estado, 'en-curso');
    });
  });
});

test('review (TASK-091): con la selectiva, la seccion de cobertura se omite y la peticion dice por que', async () => {
  await conScripts(async (v) => {
    await conTareaParaReview(`${dosClaves(v)}informe_cobertura: coverage/lcov.info\n`, async (repoRoot, tareasRoot) => {
      const r = await review(repoRoot, tareasRoot);
      const peticion = readFileSync((r.informes[0] as { peticionPath: string }).peticionPath, 'utf8');
      assert.doesNotMatch(peticion, /## Cobertura/);
      assert.match(peticion, /- Cobertura: no se muestra en esta ronda/);
    });
  });
});

test('review (TASK-091): sin la clave no corre nada y la peticion no lleva seccion de verificacion', async () => {
  await conScripts(async (v) => {
    await conTareaParaReview(`comando_verificacion: "${v.comando('completa')}"\n`, async (repoRoot, tareasRoot) => {
      const r = await review(repoRoot, tareasRoot);
      assert.equal(v.ejecuciones('completa'), 0);
      assert.equal(v.ejecuciones('selectiva'), 0);
      const peticion = readFileSync((r.informes[0] as { peticionPath: string }).peticionPath, 'utf8');
      assert.doesNotMatch(peticion, /Verificacion de esta ronda/);
    });
  });
});

// ---------------------------------------------------------------------
// finish (criterio 3)
// ---------------------------------------------------------------------

async function conTareaParaFinish(v: Verifs, fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
  await repoFinish(async (repoRoot, tareasRoot) => {
    await escribirConfig(repoRoot, dosClaves(v));
    commitFinish(repoRoot, 'config');
    await setupTaskEnRevision(repoRoot, tareasRoot, tareaFinish({ id: 'TASK-911' }));
    await fn(repoRoot, tareasRoot);
  });
}

const finish = (repoRoot: string, tareasRoot: string) =>
  runFinishCommand(tareasRoot, ['TASK-911'], '2026-11-09', { repoCwd: repoRoot, scriptsDir: SCRIPTS_FINISH });

test('finish (TASK-091): exige la completa aunque la selectiva este en verde y guardada', async () => {
  await conScripts(async (v) => {
    await conTareaParaFinish(v, async (repoRoot, tareasRoot) => {
      const cfg = resolverConfig(repoRoot);
      const sel = verificarConMemo(repoRoot, {
        tipo: 'selectiva',
        comando: cfg.comando_verificacion_selectiva as string,
        timeoutS: cfg.timeout_verificacion_selectiva,
        base: 'develop',
      });
      assert.equal(sel.resultado.estado, 'verde');
      const r = await finish(repoRoot, tareasRoot);
      assert.equal(r.cierre, 'terminada');
      assert.equal(v.ejecuciones('completa'), 1, 'finish ejecuto la completa');
      assert.equal(v.ejecuciones('selectiva'), 1, 'y no volvio a correr la selectiva');
    });
  });
});

test('finish (TASK-091): con la completa en rojo no integra y dice como correrla, aunque la selectiva este en verde', async () => {
  await conScripts(async (v) => {
    await v.desenlace('completa', 'ko');
    await conTareaParaFinish(v, async (repoRoot, tareasRoot) => {
      const developAntes = git(['rev-parse', 'develop'], repoRoot).trim();
      await assert.rejects(
        () => finish(repoRoot, tareasRoot),
        (e: unknown) => {
          assert.ok(e instanceof FinishCommandError);
          assert.match(e.message, /no se mergea con la verificacion en rojo/);
          assert.match(e.message, /completa: ERROR, 2 tests fallan/);
          assert.match(e.message, /Es la verificacion completa \(comando_verificacion\)[\s\S]*aunque las rondas usaran la selectiva/);
          assert.match(e.message, /Correla a mano/);
          return true;
        }
      );
      assert.equal(git(['rev-parse', 'develop'], repoRoot).trim(), developAntes);
      assert.equal((await readTareaFile(tareasRoot, 'TASK-911'))?.task.estado, 'en-revision');
    });
  });
});

// ---------------------------------------------------------------------
// doctor (criterio 4)
// ---------------------------------------------------------------------

test('doctor (TASK-091): completa sin selectiva avisa con el arreglo en la misma linea', () => {
  const [c, ...resto] = comprobarVerificacionSelectiva(parsearConfig('comando_verificacion: "npm test"\n', RUTA));
  assert.equal(resto.length, 0);
  assert.equal(c?.id, 'verificacion-selectiva');
  assert.equal(c?.nivel, 'aviso');
  assert.match(c?.mensaje ?? '', /sin comando_verificacion_selectiva: cada fin de turno corre la verificacion completa; .*declara en \.taskcode\/config\.yml comando_verificacion_selectiva: /);
  assert.doesNotMatch(c?.mensaje ?? '', /\n/);
  assert.match(c?.arreglo ?? '', /^Declara en \.taskcode\/config\.yml comando_verificacion_selectiva:/);
});

test('doctor (TASK-091): con las dos, ok; sin completa o con config invalida, nada', () => {
  const [c] = comprobarVerificacionSelectiva(
    parsearConfig('comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node sel.js"\n', RUTA)
  );
  assert.equal(c?.nivel, 'ok');
  assert.match(c?.mensaje ?? '', /comando_verificacion_selectiva: "node sel\.js" \(timeout 600 s\)/);
  assert.deepEqual(comprobarVerificacionSelectiva(parsearConfig('', RUTA)), []);
  assert.deepEqual(comprobarVerificacionSelectiva(null), []);
});

// ---------------------------------------------------------------------
// Guia de migracion (criterio 6): instalable, enlazada y sin marcas de este repo
// ---------------------------------------------------------------------

test('guia (TASK-091): task-workflow enlaza verificacion-selectiva.md, que explica las dos claves, RAMA_BASE, el clasificador y cuando correr todo', () => {
  const dir = path.join(import.meta.dirname, '..', '..', '..', 'skills', 'task-workflow');
  const skill = readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  assert.match(skill, /comando_verificacion_selectiva[\s\S]*\[verificacion-selectiva\.md\]\(verificacion-selectiva\.md\)/);
  const guia = readFileSync(path.join(dir, 'verificacion-selectiva.md'), 'utf8');
  for (const marca of [
    /comando_verificacion_selectiva:/,
    /comando_verificacion:/,
    /timeout_verificacion_selectiva/,
    /RAMA_BASE/,
    /arbol de trabajo/,
    /git ls-files --others --exclude-standard/,
    /corre todo/,
    /lockfiles/,
    /La completa no se convierte en el clasificador/,
    /Antes de integrar se exige siempre la\s+completa/,
    /`taskctl doctor`/,
  ]) {
    assert.match(guia, marca);
  }
  assert.doesNotMatch(guia, /TaskCode/);
});
