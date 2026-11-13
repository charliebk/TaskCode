/**
 * Alcance de la ronda N+1. TASK-083 la hacia acotada solo si la ronda anterior
 * dejaba MENORES; TASK-095 corrige esa regla, que no se cumplia nunca (los
 * revisores relistan los IMPORTANTES corregidos y cada ronda relanzaba una
 * completa desde la base): desde la ronda 2 la ronda es una verificacion
 * acotada, cada revisor verifica SUS pendientes y los dominios que toca la
 * correccion tambien la ven. Completa solo con --completa, sin commit revisado
 * fiable o cuando los informes no se pueden leer (fail-closed).
 * Repos Git temporales reales: review -> informes -> veredicto -> correccion -> review.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { REGLA_HALLAZGOS_NUEVOS, runReviewCommand, type ReviewCommandResult } from '../../src/commands/review.js';
import { runVeredictoCommand } from '../../src/commands/veredicto.js';
import { alcanceRondaSiguiente, hallazgosPendientes } from '../../src/core/informe-revision.js';
import {
  SCRIPTS_DIR,
  sampleTask,
  commitAll,
  git,
  withTempRepo,
  setupTaskEnCursoSoloTarea,
  advanceDevelop,
  escribirFichero,
} from '../helpers/review-fixtures.js';

const JAVA = 'src/main/java/com/acme/UserService.java';
const ANGULAR = 'src/app/user-profile/user-profile.component.ts';
// Sin dominio: lo revisa el generico.
const SCRIPT = 'scripts/arranque.sh';
const ID = 'TASK-983';

function informe(filas: string[], veredicto = 'PENDIENTE'): string {
  return (
    `# Informe de revision — ${ID}\n\n- Commit revisado: x\n- Revisor: r\n` +
    `- Veredicto: ${veredicto}\n\n## Hallazgos\n\n` +
    '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
    filas.join('\n') +
    '\n\nReproduccion...\n'
  );
}
const MEN_JAVA = `| MEN-1 | MENOR | abierto | ${JAVA}:3 | implementacion |`;
const MEN_ANGULAR = '| MEN-2 | MENOR | abierto | `user-profile.component.ts:5` | implementacion |';
const MEN_SCRIPT = `| MEN-3 | MENOR | abierto | ${SCRIPT}:2 | implementacion |`;
const IMP_ABIERTO = `| IMP-1 | IMPORTANTE | abierto | ${JAVA}:9 | implementacion |`;
const IMP_CORREGIDO = `| IMP-1 | IMPORTANTE | corregido | ${JAVA}:9 | implementacion |`;
const CRIT_ABIERTO = `| CRIT-1 | CRITICO | abierto | ${JAVA}:9 | implementacion |`;
const CRIT_ACEPTADO = `| CRIT-1 | CRITICO | aceptado | ${JAVA}:9 | implementacion |`;

interface Ronda {
  r: ReviewCommandResult;
  /** Peticiones de la ronda por nombre de fichero. */
  peticiones: Map<string, string>;
}

interface Ctx {
  repoRoot: string;
  tareasRoot: string;
  /** Escribe los informes de la ultima ronda (en el orden de r.informes), los commitea y pide cambios en cada uno. */
  pedirCambios(r: ReviewCommandResult, informes: string[]): Promise<void>;
  /** Modifica `ficheros` y commitea (la correccion). */
  corregir(ficheros: string[]): Promise<void>;
  review(extra?: string[]): Promise<Ronda>;
}

async function conRonda1(ficheros: string[], cuerpo: (ctx: Ctx, r1: Ronda) => Promise<void>): Promise<void> {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // TASK-127: estos tests llegan a la ronda 3 y fijan el tope de antes (3)
    // en la config de develop, que es de donde lo lee review.
    await escribirFichero(repoRoot, '.taskcode/config.yml', 'tope_rondas: 3\n');
    commitAll(repoRoot, 'config: tope de rondas 3');
    const task = sampleTask({ id: ID, rama: 'feature/task-983-alcance' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    for (const f of ficheros) await escribirFichero(repoRoot, f, `// ${f}\n`);
    commitAll(repoRoot, 'trabajo r1');
    await advanceDevelop(repoRoot, task.rama);
    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
    let n = 0;
    const ctx: Ctx = {
      repoRoot,
      tareasRoot,
      async pedirCambios(r, informes) {
        assert.equal(r.informes.length, informes.length, 'un informe por revisor de la ronda');
        for (let i = 0; i < informes.length; i++) {
          await writeFile((r.informes[i] as { informePath: string }).informePath, informes[i] as string, 'utf8');
        }
        commitAll(repoRoot, `informes ronda ${r.ronda}`);
        for (const g of r.informes) {
          await runVeredictoCommand(
            tareasRoot,
            [ID, 'cambios-solicitados', ...(r.informes.length > 1 ? ['--informe', path.basename(g.informePath)] : [])],
            { repoCwd: repoRoot }
          );
        }
      },
      async corregir(fs) {
        n++;
        for (const f of fs) await escribirFichero(repoRoot, f, `// ${f}\n// correccion ${n}\n`);
        commitAll(repoRoot, `correccion ${n}`);
      },
      async review(extra = []) {
        const r = await runReviewCommand(tareasRoot, [ID, ...extra], '2026-11-10', deps);
        const dir = path.dirname((r.informes[0] as { peticionPath: string }).peticionPath);
        const nombres = (await readdir(dir)).filter((x) => x.startsWith(`peticion-revision-${r.ronda}`)).sort();
        const peticiones = new Map<string, string>();
        for (const x of nombres) peticiones.set(x, await readFile(path.join(dir, x), 'utf8'));
        return { r, peticiones };
      },
    };
    const r1 = await ctx.review();
    await cuerpo(ctx, r1);
  });
}

function lineaAlcance(peticion: string): string | undefined {
  return peticion.split('\n').find((l) => l.startsWith('- Alcance:'));
}

/** Acotada de verdad: campo, linea de cabecera, instrucciones y diff desde el commit revisado. */
function esAcotada(ronda: Ronda, desde: string): void {
  assert.equal(ronda.r.alcance, 'acotada');
  assert.equal(ronda.r.desde, desde, 'el diff va desde el ultimo commit revisado, no desde la base');
  for (const [nombre, p] of ronda.peticiones) {
    assert.match(lineaAlcance(p) ?? '', /^- Alcance: verificacion acotada al diff de las correcciones \(motivo: /, nombre);
    assert.ok(p.includes('## Instrucciones para el agente revisor (verificacion acotada)'), nombre);
    assert.ok(p.includes(REGLA_HALLAZGOS_NUEVOS), `${nombre}: limita los hallazgos nuevos`);
    assert.ok(p.includes(`## Commits a revisar (git log ${desde}..HEAD)`), nombre);
  }
}

function esCompleta(ronda: Ronda, motivo: RegExp): void {
  assert.equal(ronda.r.alcance, 'completa');
  assert.match(ronda.r.motivoAlcance, motivo);
  for (const p of ronda.peticiones.values()) {
    assert.match(lineaAlcance(p) ?? '', /^- Alcance: completa \(motivo: /);
    assert.ok(!p.includes('(verificacion acotada)'), 'sin instrucciones acotadas');
    assert.ok(p.includes('clona el repo a un\ndirectorio temporal'), 'instrucciones de la revision completa');
  }
}

test('alcance (TASK-095): con un IMPORTANTE abierto, uno corregido, un CRITICO abierto o uno aceptado, la ronda 2 es acotada', async () => {
  for (const fila of [IMP_ABIERTO, IMP_CORREGIDO, CRIT_ABIERTO, CRIT_ACEPTADO]) {
    await conRonda1([JAVA], async (ctx, r1) => {
      await ctx.pedirCambios(r1.r, [informe([MEN_JAVA, fila])]);
      await ctx.corregir([JAVA]);
      const r2 = await ctx.review();
      esAcotada(r2, r1.r.commitRevisado);
      assert.match(r2.r.motivoAlcance, /la ronda anterior pidio cambios \(2 hallazgo\(s\)\)/);
      const p = [...r2.peticiones.values()].join('\n');
      // TASK-112: la ronda acotada solo reverifica CRITICOS e IMPORTANTES; el MENOR se nombra por su numero.
      assert.ok(!p.includes('| MEN-1 |'), 'el MENOR no va en la tabla');
      // Con el CRITICO aceptado solo le queda el MENOR: vuelve porque la correccion toca su
      // dominio, y la seccion lo dice (MEN-3 de la revision de TASK-112).
      if (fila !== CRIT_ACEPTADO) assert.match(p, /Tus 1 hallazgo\(s\) MENOR de la ronda 1 no estan en la tabla/);
      else assert.match(p, /Tus 1 hallazgo\(s\) MENOR de la ronda 1 no se reverifican/);
      // Pendiente = todo lo que no esta aceptado: un corregido se verifica.
      if (fila === CRIT_ACEPTADO) assert.ok(!p.includes('| CRIT-1 |'), 'lo aceptado no se vuelve a verificar');
      else assert.ok(p.includes(fila.split('|')[1]!.trim()), `lista ${fila}`);
    });
  }
});

// Parametrizado por dominio (MEN-5 de la revision: el criterio pide Rust con
// rust-wasm-reviewer; Java cubre el mismo mecanismo con otro patron del catalogo).
for (const [fichero, dominio] of [
  [JAVA, 'java-spring-reviewer'],
  ['core/motor/src/lib.rs', 'rust-wasm-reviewer'],
] as const) {
  test(`alcance (TASK-095): cada revisor de dominio verifica SUS pendientes, no el generico en su lugar (${dominio})`, async () => {
    await conRonda1([fichero, SCRIPT], async (ctx, r1) => {
      const nombres1 = r1.r.informes.map((g) => g.revisor);
      assert.deepEqual([...nombres1].sort(), ['code-quality-reviewer', dominio].sort());
      const impDominio = `| IMP-1 | IMPORTANTE | abierto | ${fichero}:9 | implementacion |`;
      const porRevisor = r1.r.informes.map((g) => (g.revisor === dominio ? informe([impDominio]) : informe([MEN_SCRIPT])));
      await ctx.pedirCambios(r1.r, porRevisor);
      await ctx.corregir([fichero, SCRIPT]);
      const r2 = await ctx.review();
      esAcotada(r2, r1.r.commitRevisado);
      const deDominio = r2.peticiones.get(`peticion-revision-2-${dominio}.md`);
      const generico = r2.peticiones.get('peticion-revision-2-code-quality-reviewer.md');
      assert.ok(deDominio !== undefined, 'el revisor de dominio recibe su propia peticion');
      assert.ok(generico !== undefined);
      assert.ok(deDominio.includes('| IMP-1 | IMPORTANTE |') && !deDominio.includes('| MEN-3 |'), 'el dominio ve solo lo suyo');
      // TASK-112: el generico solo tenia un MENOR; vuelve porque la correccion toca SCRIPT, sin tabla de MENORES.
      assert.ok(!generico.includes('| MEN-3 |') && !generico.includes('| IMP-1 |'), 'el generico no verifica lo del dominio ni su MENOR');
      // Cada uno recibe el delta entero de la correccion, no filtrado.
      for (const p of [deDominio, generico]) assert.ok(p.includes(fichero) && p.includes(SCRIPT));
    });
  });
}

test('alcance (TASK-095, MEN-2): una completa tras una acotada revisa desde la base', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
    await ctx.corregir([JAVA]);
    const r2 = await ctx.review();
    esAcotada(r2, r1.r.commitRevisado);
    // El informe de la ronda 2 no tiene tabla: la 3 es completa (fail-closed)
    // y, como la 2 fue acotada, revisa desde la base.
    await ctx.pedirCambios(r2.r, ['# Informe\n\n- Veredicto: PENDIENTE\n\n## Hallazgos\n\nUn fallo descrito en prosa.\n']);
    await ctx.corregir([JAVA]);
    const r3 = await ctx.review();
    esCompleta(r3, /la ronda 2 fue acotada, asi que el diff va desde "develop"/);
    assert.equal(r3.r.desde, 'develop');
  });
});

test('alcance (TASK-095): un dominio sin pendientes cuyo terreno toca la correccion tambien la revisa', async () => {
  await conRonda1([JAVA, ANGULAR], async (ctx, r1) => {
    const porRevisor = r1.r.informes.map((g) =>
      g.revisor === 'java-spring-reviewer' ? informe([MEN_JAVA]) : informe(['| (ninguno) | — | sin hallazgos | — | — |'])
    );
    await ctx.pedirCambios(r1.r, porRevisor);
    await ctx.corregir([JAVA, ANGULAR]);
    const r2 = await ctx.review();
    esAcotada(r2, r1.r.commitRevisado);
    const angular = r2.peticiones.get('peticion-revision-2-angular-vue-reviewer.md');
    assert.ok(angular !== undefined, 'la correccion toca su dominio');
    assert.match(angular, /No tienes hallazgos pendientes propios/);
    assert.equal(r2.peticiones.size, 2, 'java (pendientes) y angular (terreno tocado); el generico no hace falta');
  });
});

test('alcance (TASK-095): un merge de develop entre rondas no la hace completa; se nombra y su codigo esta en el diff', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
    await ctx.corregir([JAVA]);
    const rama = git(['rev-parse', '--abbrev-ref', 'HEAD'], ctx.repoRoot).trim();
    git(['checkout', '-q', 'develop'], ctx.repoRoot);
    await escribirFichero(ctx.repoRoot, 'otro-cambio-develop.txt', 'x\n');
    commitAll(ctx.repoRoot, 'mas develop');
    git(['checkout', '-q', rama], ctx.repoRoot);
    git(['merge', '-q', '--no-ff', '--no-edit', 'develop'], ctx.repoRoot);
    const r2 = await ctx.review();
    esAcotada(r2, r1.r.commitRevisado);
    assert.match(r2.r.motivoAlcance, /hay commits de merge entre .* lo que entra con ellos va en el diff/);
    for (const p of r2.peticiones.values()) assert.ok(p.includes('otro-cambio-develop.txt'), 'lo que entra con el merge se revisa');
  });
});

test('alcance (TASK-095): sin commit revisado fiable, completa y desde la base', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    const peticion = (r1.r.informes[0] as { peticionPath: string }).peticionPath;
    const texto = await readFile(peticion, 'utf8');
    await writeFile(peticion, texto.replace(/^- Commit revisado \(HEAD\): \w+/m, '- Commit revisado (HEAD): deadbeefcafe'), 'utf8');
    await ctx.pedirCambios(r1.r, [informe([IMP_ABIERTO])]);
    await ctx.corregir([JAVA]);
    const r2 = await ctx.review();
    esCompleta(r2, /no hay commit revisado fiable/);
    assert.equal(r2.r.desde, r2.r.baseBranch);
  });
});

test('alcance (TASK-095): --completa la fuerza, desde la base, aunque haya un IMPORTANTE abierto', async () => {
  await conRonda1([JAVA, ANGULAR], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, r1.r.informes.map(() => informe([IMP_ABIERTO])));
    await ctx.corregir([JAVA]);
    const r2 = await ctx.review(['--completa']);
    esCompleta(r2, /pedida con --completa/);
    assert.equal(r2.r.desde, 'develop');
  });
});

test('alcance (TASK-095): el caso real que no convergia (IMPORTANTE relistado como corregido) converge y el tope frena en review', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [informe([`| IMP-46 | IMPORTANTE | abierto | ${JAVA}:4 | plan |`])]);
    await ctx.corregir([JAVA]);
    const r2 = await ctx.review();
    esAcotada(r2, r1.r.commitRevisado);
    // El revisor de la ronda 2 relista el IMPORTANTE como corregido y deja un MENOR.
    await ctx.pedirCambios(r2.r, [
      informe([`| IMP-46 | IMPORTANTE | corregido | ${JAVA}:4 | plan |`, `| MEN-9 | MENOR | abierto | ${JAVA}:6 | plan |`]),
    ]);
    await ctx.corregir([JAVA]);
    const r3 = await ctx.review();
    // Con la regla de TASK-083 esta ronda era completa desde la base
    // ("tiene un IMPORTANTE (IMP-46, corregido)") y encontraba otra tanda.
    esAcotada(r3, r2.r.commitRevisado);
    await ctx.pedirCambios(r3.r, [informe([`| MEN-10 | MENOR | abierto | ${JAVA}:7 | plan |`])]);
    await ctx.corregir([JAVA]);
    await assert.rejects(ctx.review(), /tope de rondas \(3\).*--ronda-extra/s);
    // TASK-127: el flag solo ya no basta; hace falta la decision en tarea.md.
    await assert.rejects(ctx.review(['--ronda-extra']), /exige que conste la decision.*- Ronda 4: /s);
    const tareaMd = path.join(ctx.tareasRoot, '03-en-revision', ID, 'tarea.md');
    await writeFile(tareaMd, `${await readFile(tareaMd, 'utf8')}\n## Rondas extra\n- Ronda 4: Carlos, queda el MEN-10\n`, 'utf8');
    const r4 = await ctx.review(['--ronda-extra']);
    esAcotada(r4, r3.r.commitRevisado);
    assert.equal(r4.r.ronda, 4);
  });
});

test('alcance (TASK-095): abrir una ronda con hallazgos de la anterior sin marcar corregido ni aceptado avisa', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [
      informe([
        IMP_ABIERTO,
        `| MEN-1 | MENOR | aceptado | ${JAVA}:3 | plan |`,
        `| MEN-7 | MENOR | corregido | ${JAVA}:5 | plan |`,
      ]),
    ]);
    await ctx.corregir([JAVA]);
    const r2 = await ctx.review();
    const aviso = r2.r.avisos.join('\n');
    assert.match(aviso, /sin marcar como corregido ni aceptado: IMP-1 \(informe-revision-1[^)]*\.md\)/);
    assert.ok(!/MEN-1 \(/.test(aviso), 'lo aceptado no se avisa');
    // MEN-3 de la revision: lo corregido tampoco (aunque si se verifica).
    assert.doesNotMatch(aviso, /MEN-7 \(/, 'lo corregido no se avisa');
    // TASK-112: un MENOR corregido ya no se reverifica en la ronda acotada (lo hace quien coordina).
    assert.ok(![...r2.peticiones.values()].join('\n').includes('| MEN-7 |'), 'el MENOR corregido no va en la tabla');
  });
});

test('alcance (TASK-112, criterios 2 y 4): un revisor con solo MENORES cuyos ficheros no toca la correccion no se relanza y consta en tarea.md', async () => {
  await conRonda1([JAVA, SCRIPT], async (ctx, r1) => {
    const impDominio = `| IMP-1 | IMPORTANTE | abierto | ${JAVA}:9 | implementacion |`;
    const porRevisor = r1.r.informes.map((g) =>
      g.revisor === 'java-spring-reviewer' ? informe([impDominio]) : informe([MEN_SCRIPT])
    );
    await ctx.pedirCambios(r1.r, porRevisor);
    await ctx.corregir([JAVA]);
    const r2 = await ctx.review();
    esAcotada(r2, r1.r.commitRevisado);
    assert.deepEqual([...r2.peticiones.keys()], ['peticion-revision-2-java-spring-reviewer.md']);
    const tarea = await readFile(r2.r.filePath, 'utf8');
    assert.match(
      tarea,
      /## Revisores no relanzados\r?\n\r?\n- ronda 2: code-quality-reviewer - solo tenia hallazgos MENOR pendientes y la correccion no toca sus ficheros/
    );
  });
});

// --- La regla pura ------------------------------------------------------------

test('alcanceRondaSiguiente (TASK-095): la severidad ya no decide; las guardas fail-closed se conservan', () => {
  const pedida = (filas: string[]): string => informe(filas, 'cambios-solicitados');
  for (const filas of [[MEN_JAVA], [MEN_JAVA, IMP_CORREGIDO], [IMP_ABIERTO], [CRIT_ABIERTO]]) {
    assert.equal(alcanceRondaSiguiente([pedida(filas)]).acotada, true, filas.join(' '));
  }
  assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA]), pedida([CRIT_ACEPTADO])]).acotada, true);
  // MEN-1 de la revision: un fragmento que sigue siendo la plantilla obliga a
  // la completa aunque otro fragmento tenga hallazgos (si no, un dominio sin
  // revisar pasaria como verificado).
  const plantilla =
    '# Informe\n\n- Veredicto: cambios-solicitados\n\n## Hallazgos\n\n' +
    '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
    '| (ej. IMP-1) | (CRITICO / IMPORTANTE / MENOR) | (abierto / corregido / aceptado) | (ruta:linea) | (implementacion) |\n';
  const conPlantilla = alcanceRondaSiguiente([pedida([IMP_ABIERTO]), plantilla]);
  assert.equal(conPlantilla.acotada, false);
  assert.match(conPlantilla.motivo, /sigue siendo la plantilla/);
  const casos: Array<[string, string[], RegExp]> = [
    ['sin informes', [], /no tiene informes/],
    ['veredicto aprobada', [informe([MEN_JAVA], 'aprobada')], /veredicto .* "aprobada"/],
    ['veredicto pendiente', [informe([MEN_JAVA])], /veredicto .* "pendiente"/],
    ['sin tabla', ['# I\n\n- Veredicto: cambios-solicitados\n\n## Hallazgos\n\nMEN-1 en prosa.\n'], /tabla/],
    ['severidad desconocida', [pedida(['| X-1 | Alta | abierto | a.ts:1 | plan |'])], /"Alta"/],
    ['sin hallazgos', [pedida(['| (ninguno) | — | sin hallazgos | — | — |'])], /sin anotar ningun hallazgo/],
  ];
  for (const [nombre, informes, motivo] of casos) {
    const a = alcanceRondaSiguiente(informes);
    assert.equal(a.acotada, false, nombre);
    assert.match(a.motivo, motivo, nombre);
  }
  // modeloBarato sigue la regla de TASK-081, independiente del alcance.
  assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA, IMP_CORREGIDO])]).modeloBarato, true);
  assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA, CRIT_ACEPTADO])]).modeloBarato, false);
});

test('hallazgosPendientes (TASK-095): todo menos lo aceptado, tambien lo corregido', () => {
  const l = hallazgosPendientes(informe([MEN_JAVA, IMP_CORREGIDO, CRIT_ACEPTADO, '| X-2 | MENOR |  | a.ts:1 | plan |']));
  assert.equal(l.tabla, true);
  assert.deepEqual(l.abiertos.map((h) => h.id), ['MEN-1', 'IMP-1', 'X-2']);
  assert.equal(hallazgosPendientes('# I\n\n## Hallazgos\n\nprosa\n').tabla, false);
});
