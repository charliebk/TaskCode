/**
 * TASK-083: alcance de la ronda N+1. Si la ronda anterior solo dejo MENORES
 * (en TODOS sus informes) y el delta solo toca los ficheros que nombraban, la
 * ronda siguiente es una verificacion acotada: un solo revisor (el generico),
 * sin fragmentar, con instrucciones de verificacion y la linea `- Alcance:`.
 * Cualquier CRITICO o IMPORTANTE, en cualquier estado, obliga a la completa.
 * Repos Git temporales reales: review -> informes -> veredicto -> correccion -> review.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runReviewCommand, type ReviewCommandResult } from '../../src/commands/review.js';
import { runVeredictoCommand } from '../../src/commands/veredicto.js';
import {
  alcanceRondaSiguiente,
  ficheroNombrado,
  rutasDeCeldaFichero,
  soloMenores,
} from '../../src/core/informe-revision.js';
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
const OTRO = 'src/main/java/com/acme/Otro.java';
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
// El nombre corto tambien nombra la ruta completa (asi lo anotan los revisores).
const MEN_ANGULAR = '| MEN-2 | MENOR | abierto | `user-profile.component.ts:5` | implementacion |';
const IMP_ABIERTO = `| IMP-1 | IMPORTANTE | abierto | ${JAVA}:9 | implementacion |`;
const IMP_CORREGIDO = `| IMP-1 | IMPORTANTE | corregido | ${JAVA}:9 | implementacion |`;
const CRIT_ACEPTADO = `| CRIT-1 | CRITICO | aceptado | ${JAVA}:9 | implementacion |`;

interface Ronda {
  r: ReviewCommandResult;
  peticiones: string[];
}

interface Ctx {
  repoRoot: string;
  tareasRoot: string;
  /** Escribe los informes de la ultima ronda, los commitea y registra `cambios-solicitados` en cada uno. */
  pedirCambios(r: ReviewCommandResult, informes: string[]): Promise<string[][]>;
  /** Modifica `ficheros` y commitea (la correccion). */
  corregir(ficheros: string[]): Promise<void>;
  review(extra?: string[]): Promise<Ronda>;
}

/** Ronda 1 sobre `ficheros` y el contexto para seguir; `cuerpo` recibe la ronda 1. */
async function conRonda1(ficheros: string[], cuerpo: (ctx: Ctx, r1: Ronda) => Promise<void>): Promise<void> {
  await withTempRepo(async (repoRoot, tareasRoot) => {
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
        const avisos: string[][] = [];
        for (const g of r.informes) {
          const v = await runVeredictoCommand(
            tareasRoot,
            [ID, 'cambios-solicitados', ...(r.informes.length > 1 ? ['--informe', path.basename(g.informePath)] : [])],
            { repoCwd: repoRoot }
          );
          avisos.push(v.avisos);
        }
        return avisos;
      },
      async corregir(fs) {
        n++;
        for (const f of fs) await escribirFichero(repoRoot, f, `// ${f}\n// correccion ${n}\n`);
        commitAll(repoRoot, `correccion ${n}`);
      },
      async review(extra = []) {
        const r = await runReviewCommand(tareasRoot, [ID, ...extra], '2026-11-07', deps);
        const dir = path.dirname((r.informes[0] as { peticionPath: string }).peticionPath);
        const nombres = (await readdir(dir)).filter((x) => x.startsWith(`peticion-revision-${r.ronda}`)).sort();
        const peticiones = await Promise.all(nombres.map((x) => readFile(path.join(dir, x), 'utf8')));
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

function esCompleta(ronda: Ronda, motivo: RegExp): void {
  assert.equal(ronda.r.alcance, 'completa');
  assert.match(ronda.r.motivoAlcance, motivo);
  for (const p of ronda.peticiones) {
    assert.match(lineaAlcance(p) ?? '', /^- Alcance: completa \(motivo: /);
    assert.ok(!p.includes('(verificacion acotada)'), 'sin instrucciones acotadas');
    assert.ok(p.includes('clona el repo a un\ndirectorio temporal'), 'instrucciones de la revision completa');
  }
}

test('alcance (TASK-083): ronda 1 fragmentada solo con MENORES y correccion en sus ficheros -> verificacion acotada', async () => {
  await conRonda1([JAVA, ANGULAR], async (ctx, r1) => {
    assert.equal(r1.r.informes.length, 2, 'la ronda 1 se fragmenta por dominio');
    assert.equal(r1.r.alcance, 'completa');
    assert.match(lineaAlcance(r1.peticiones[0] as string) ?? '', /completa \(motivo: primera ronda de revision\)/);
    const avisos = await ctx.pedirCambios(r1.r, [informe([MEN_JAVA]), informe([MEN_ANGULAR])]);
    // El aviso de veredicto: pedir cambios con solo MENORES.
    for (const a of avisos) assert.match(a.join('\n'), /solo tiene MENORES/);
    await ctx.corregir([JAVA, ANGULAR]);
    const r2 = await ctx.review();

    assert.equal(r2.r.alcance, 'acotada');
    assert.match(r2.r.motivoAlcance, /solo dejo MENORES \(2\) y el diff solo toca sus ficheros/);
    // Un solo revisor, el generico, con el nombre de siempre (sin sufijo).
    assert.equal(r2.r.informes.length, 1);
    assert.equal(r2.r.informes[0]!.revisor, 'code-quality-reviewer');
    assert.equal(path.basename(r2.r.informes[0]!.peticionPath), 'peticion-revision-2.md');
    assert.deepEqual([...r2.r.informes[0]!.ficheros].sort(), [ANGULAR, JAVA].sort());
    const p = r2.peticiones[0] as string;
    assert.equal(
      lineaAlcance(p),
      '- Alcance: verificacion acotada al diff de las correcciones ' +
        '(motivo: la ronda anterior solo dejo MENORES (2) y el diff solo toca sus ficheros)'
    );
    assert.ok(p.includes('## Instrucciones para el agente revisor (verificacion acotada)'));
    // No es solo tachar la lista: tests y busqueda de fallos nuevos.
    assert.ok(p.includes('Ejecuta la suite'));
    assert.ok(p.includes('Busca en el diff de esta ronda el fallo que la correccion abre'));
    assert.ok(p.includes('| MEN-1 | MENOR |') && p.includes('| MEN-2 | MENOR |'), 'lista los hallazgos a verificar');
    assert.ok(p.includes(`- Revision incremental: solo los cambios desde ${r1.r.commitRevisado}`));
    // El chore de commit no cambia: metricas lo sigue clasificando.
    assert.match(git(['log', '-1', '--format=%s'], ctx.repoRoot), /peticion de revision ronda 2/);
  });
});

test('alcance (TASK-083, criterio 3): un IMPORTANTE abierto, uno corregido o un CRITICO aceptado -> ronda completa', async () => {
  for (const fila of [IMP_ABIERTO, IMP_CORREGIDO, CRIT_ACEPTADO]) {
    await conRonda1([JAVA], async (ctx, r1) => {
      const avisos = await ctx.pedirCambios(r1.r, [informe([MEN_JAVA, fila])]);
      assert.deepEqual(avisos, [[]], 'sin aviso: no son solo MENORES');
      await ctx.corregir([JAVA]);
      const r2 = await ctx.review();
      esCompleta(r2, /la ronda anterior tiene un (IMPORTANTE|CRITICO)/);
    });
  }
});

test('alcance (TASK-083): el IMPORTANTE esta en OTRO fragmento de la ronda 1 -> completa (se decide por ronda)', async () => {
  await conRonda1([JAVA, ANGULAR], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA]), informe([MEN_ANGULAR.replace('MENOR', 'IMPORTANTE')])]);
    await ctx.corregir([JAVA]);
    const r2 = await ctx.review();
    esCompleta(r2, /IMPORTANTE \(MEN-2/);
  });
});

test('alcance (TASK-083): --completa la fuerza aunque la regla permita la acotada', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
    await ctx.corregir([JAVA]);
    esCompleta(await ctx.review(['--completa']), /pedida con --completa/);
  });
});

test('alcance (TASK-083): el delta toca un fichero que ningun hallazgo nombraba -> completa', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
    await ctx.corregir([JAVA, OTRO]);
    esCompleta(await ctx.review(), new RegExp(`ningun hallazgo nombraba: ${OTRO.replace(/\./g, '\\.')}$`));
  });
});

test('alcance (TASK-083): con mas de cinco ficheros no nombrados, el motivo nombra cinco y cuenta el resto', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
    await ctx.corregir([JAVA, ...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((x) => `extra/${x}.txt`)]);
    const r2 = await ctx.review();
    esCompleta(r2, /: extra\/a\.txt, extra\/b\.txt, extra\/c\.txt, extra\/d\.txt, extra\/e\.txt \(y 2 mas\)$/);
  });
});

test('alcance (TASK-083): un merge de develop dentro del delta -> completa', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
    await ctx.corregir([JAVA]);
    const rama = git(['rev-parse', '--abbrev-ref', 'HEAD'], ctx.repoRoot).trim();
    git(['checkout', '-q', 'develop'], ctx.repoRoot);
    await escribirFichero(ctx.repoRoot, 'otro-cambio-develop.txt', 'x\n');
    commitAll(ctx.repoRoot, 'mas develop');
    git(['checkout', '-q', rama], ctx.repoRoot);
    git(['merge', '-q', '--no-ff', '--no-edit', 'develop'], ctx.repoRoot);
    esCompleta(await ctx.review(), /hay commits de merge entre/);
  });
});

test('alcance (TASK-083): sin diff de correcciones (el commit de la ronda 1 ya no existe) -> completa', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    const peticion = (r1.r.informes[0] as { peticionPath: string }).peticionPath;
    const texto = await readFile(peticion, 'utf8');
    await writeFile(peticion, texto.replace(/^- Commit revisado \(HEAD\): \w+/m, '- Commit revisado (HEAD): deadbeefcafe'), 'utf8');
    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
    await ctx.corregir([JAVA]);
    const r2 = await ctx.review();
    esCompleta(r2, /no hay diff de correcciones/);
    assert.equal(r2.r.desde, r2.r.baseBranch);
  });
});

test('alcance (TASK-083): tras una acotada que encuentra un IMPORTANTE, la ronda 3 es completa y desde la base', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
    await ctx.corregir([JAVA]);
    const r2 = await ctx.review();
    assert.equal(r2.r.alcance, 'acotada');
    await ctx.pedirCambios(r2.r, [informe([`| IMP-R2-1 | IMPORTANTE | abierto | ${JAVA}:4 | implementacion |`])]);
    await ctx.corregir([JAVA]);
    const r3 = await ctx.review();
    esCompleta(r3, /IMPORTANTE \(IMP-R2-1.*la ronda 2 fue acotada, asi que el diff va desde "develop"/);
    assert.equal(r3.r.desde, 'develop');
    assert.ok((r3.peticiones[0] as string).includes('## Commits a revisar (git log develop..HEAD)'));
  });
});

test('alcance (TASK-083): tras una acotada con solo MENORES, la ronda 3 vuelve a ser acotada desde la ronda 2', async () => {
  await conRonda1([JAVA], async (ctx, r1) => {
    await ctx.pedirCambios(r1.r, [informe([MEN_JAVA])]);
    await ctx.corregir([JAVA]);
    const r2 = await ctx.review();
    await ctx.pedirCambios(r2.r, [informe([`| MEN-R2-1 | MENOR | abierto | ${JAVA}:5 | implementacion |`])]);
    await ctx.corregir([JAVA]);
    const r3 = await ctx.review();
    assert.equal(r3.r.alcance, 'acotada');
    assert.equal(r3.r.desde, r2.r.commitRevisado);
  });
});

// --- La regla pura ------------------------------------------------------------

test('alcanceRondaSiguiente (TASK-083): fail-closed ante lo que no se puede leer', () => {
  const pedida = (filas: string[]): string => informe(filas, 'cambios-solicitados');
  assert.equal(alcanceRondaSiguiente([pedida([MEN_JAVA])]).acotada, true);
  assert.deepEqual(alcanceRondaSiguiente([pedida([MEN_JAVA, MEN_ANGULAR])]).ficherosNombrados, [
    JAVA,
    'user-profile.component.ts',
  ]);
  const casos: Array<[string, string[], RegExp]> = [
    ['sin informes', [], /no tiene informes/],
    ['veredicto aprobada', [informe([MEN_JAVA], 'aprobada')], /veredicto .* "aprobada"/],
    ['veredicto pendiente', [informe([MEN_JAVA])], /veredicto .* "pendiente"/],
    ['sin tabla', ['# I\n\n- Veredicto: cambios-solicitados\n\n## Hallazgos\n\nMEN-1 en prosa.\n'], /tabla/],
    ['severidad desconocida', [pedida(['| X-1 | Alta | abierto | a.ts:1 | plan |'])], /"Alta"/],
    ['sin hallazgos', [pedida(['| (ninguno) | — | sin hallazgos | — | — |'])], /sin anotar ningun hallazgo/],
    ['IMPORTANTE corregido', [pedida([MEN_JAVA, IMP_CORREGIDO])], /IMPORTANTE \(IMP-1, corregido\)/],
    ['un fragmento con CRITICO', [pedida([MEN_JAVA]), pedida([CRIT_ACEPTADO])], /CRITICO/],
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

test('rutasDeCeldaFichero y ficheroNombrado (TASK-083)', () => {
  assert.deepEqual(rutasDeCeldaFichero('src/a.ts:12'), ['src/a.ts']);
  assert.deepEqual(rutasDeCeldaFichero('`b.vue:191`, src\\c.ts:1-3; ./d.ts#L4'), ['b.vue', 'src/c.ts', 'd.ts']);
  assert.deepEqual(rutasDeCeldaFichero('—'), []);
  assert.deepEqual(rutasDeCeldaFichero(''), []);
  assert.equal(ficheroNombrado('src/ui/Armazon.vue', ['Armazon.vue']), true);
  assert.equal(ficheroNombrado('src/ui/OtroArmazon.vue', ['Armazon.vue']), false);
  assert.equal(ficheroNombrado('src/core/x.ts', ['src/core/']), true);
  assert.equal(ficheroNombrado('src/core/x.ts', []), false);
});

test('soloMenores (TASK-083): tabla con al menos un hallazgo y todos MENOR', () => {
  assert.equal(soloMenores(informe([MEN_JAVA, MEN_ANGULAR])), true);
  assert.equal(soloMenores(informe([MEN_JAVA, IMP_CORREGIDO])), false);
  assert.equal(soloMenores(informe(['| (ninguno) | — | sin hallazgos | — | — |'])), false);
  assert.equal(soloMenores('# I\n\n## Hallazgos\n\nprosa\n'), false);
});
