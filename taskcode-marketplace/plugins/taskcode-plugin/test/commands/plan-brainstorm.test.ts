/**
 * Tests del brainstorm paralelo que escribe `taskctl plan` (TASK-016,
 * item D1). Cubren el camino DETERMINISTA entero — cuantos roles,
 * cuales, con que contexto y en que ficheros — sin llamar a ningun
 * agente, que es lo que pide el criterio de aceptacion 5.
 *
 * Contra repo Git temporal real, como el resto de tests de comandos:
 * `plan` aplica el guard de la seccion 8.3 y necesita un repo de
 * verdad.
 *
 * CADA test lleva encima la mutacion del codigo fuente que lo pone
 * rojo. Es la contramedida a lo que le paso a TASK-032, donde se
 * colaron siete aserciones que no podian fallar: si de un test no se
 * sabe decir que mutacion lo tumba, ese test no vale y no entra.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import {
  runPlanCommand,
  PlanCommandError,
  PLANIFICACION_DIRNAME,
  BRAINSTORM_DIRNAME,
  PLAN_FINAL_FILENAME as PLAN_FINAL_NOMBRE,
} from '../../src/commands/plan.js';
import { ROLES_BRAINSTORM } from '../../src/core/roles-brainstorm.js';
import {
  nombrePeticionRol,
  nombreSalidaRol,
  nombrePeticionUnificador,
} from '../../src/core/plan-brainstorm.js';
import type { Task, TaskComplexity } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/commands -> dist/test -> dist -> raiz del paquete
const PACKAGE_ROOT = path.join(HERE, '..', '..', '..');

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-800',
    titulo: 'Tarea de prueba del brainstorm',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'alta',
    modelo_sugerido: 'opus',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-800-prueba',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-08',
    actualizado: '2026-09-08',
    dependencias: [],
    ...overrides,
  };
}

/**
 * Objetivo con sustancia y SIN ninguna palabra de alto riesgo: asi la
 * puntuacion heuristica no sube por el texto y el numero de roles lo
 * decide la complejidad declarada, que es lo que cada test fija. Un
 * objetivo con "migracion" dentro haria que estos tests midieran otra
 * cosa sin avisar.
 */
const BODY =
  '## Objetivo\n\nProbar que el brainstorm se escribe entero.\n\n' +
  // TASK-043: plan exige al menos un criterio.
  '## Criterios de aceptacion\n- [ ] `taskctl plan` escribe las peticiones de rol.\n';

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
  git(['commit', '-q', '-m', message], repoRoot);
}

async function withTempRepo(
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-brainstorm-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot, path.join(repoRoot, 'tareas'));
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/**
 * Lleva a `main` lo que hay en `develop`. Hace falta solo para las
 * tareas de tipo `hotfix`: su rama base es `main`, asi que el guard de
 * la seccion 8.3 cambia ahi antes de leer la tarea, y en un repo
 * temporal recien montado `main` no la tiene todavia. Sin esto el
 * comando falla con "no existe todavia" y el test mediria eso en vez
 * del tope de hotfix.
 */
function propagarAMain(repoRoot: string): void {
  git(['checkout', '-q', 'main'], repoRoot);
  git(['merge', '-q', '--ff-only', 'develop'], repoRoot);
  git(['checkout', '-q', 'develop'], repoRoot);
}

/** Nombre de la salida de un rol, sin importar el modulo bajo prueba. */
function nombreSalidaRolTest(id: string, ronda: number): string {
  return `salida-${id}-${ronda}.md`;
}

function brainstormDir(filePath: string): string {
  return path.join(path.dirname(filePath), PLANIFICACION_DIRNAME, BRAINSTORM_DIRNAME);
}

// ─── que ficheros se escriben, y cuantos ───────────────────────────────

/**
 * Mutacion que lo pone rojo: cambiar el `roles.length` del bucle de
 * escritura, escribir la peticion del unificador solo cuando hay roles,
 * o dejar de escribir el scaffold de salida de cada rol.
 *
 * El assert es `deepEqual` de la lista ORDENADA del directorio, no un
 * `length >= N`: con un `>=` un octavo fichero se colaria sin que nadie
 * se enterase.
 */
const REPARTO: ReadonlyArray<{ complejidad: TaskComplexity; roles: number }> = [
  { complejidad: 'trivial', roles: 0 },
  { complejidad: 'simple', roles: 1 },
  { complejidad: 'media', roles: 2 },
  { complejidad: 'alta', roles: 3 },
  { complejidad: 'critica', roles: 4 },
];

for (const { complejidad, roles } of REPARTO) {
  test(`plan: complejidad "${complejidad}" escribe exactamente ${roles} peticion(es) de rol y una del unificador (con 1 rol, solo la de redaccion)`, async () => {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await writeTareaFile(tareasRoot, sampleTask({ complejidad }), BODY);
      commitAll(repoRoot, 'tarea TASK-800');

      const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
        repoCwd: repoRoot,
      });

      assert.equal(result.roles.length, roles);
      assert.equal(result.ronda, 1);
      assert.equal(result.brainstormReutilizado, false);

      // TASK-042 (decision C4): con exactamente 1 rol no hay unificador ni
      // peticion/salida de rol: se escribe solo `peticion-plan-1.md`, que
      // el propio rol atiende escribiendo plan-final.md. Con 0 o con 2 o
      // mas roles el reparto es el de siempre.
      const esperados = (
        roles === 1
          ? ['peticion-plan-1.md']
          : ROLES_BRAINSTORM.slice(0, roles)
              .flatMap((r) => [`peticion-${r.id}-1.md`, `salida-${r.id}-1.md`])
              .concat(['peticion-unificador-1.md'])
      ).sort();
      const enDisco = (await readdir(brainstormDir(result.filePath))).sort();
      assert.deepEqual(enDisco, esperados);
    });
  });
}

// ─── TASK-042 (decision C4): un solo rol, sin unificador ───────────────

/**
 * Mutaciones que lo ponen rojo: volver a escribir `peticion-unificador`
 * (o la peticion/salida del rol) con 1 rol; que la peticion de redaccion
 * no se llame `peticion-plan-<ronda>.md`.
 */
test('plan (TASK-042): con 1 rol se escribe exactamente peticion-plan-1.md, sin unificador ni salida', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.equal(result.modo, 'redaccion');
    assert.equal(result.peticionUnificador, null);
    assert.equal(path.basename(result.peticionRedaccion!), 'peticion-plan-1.md');
    assert.deepEqual(await readdir(brainstormDir(result.filePath)), ['peticion-plan-1.md']);

    const peticion = await readFile(result.peticionRedaccion!, 'utf8');
    assert.match(peticion, /sin unificador|no hay unificador/);
    assert.match(peticion, /\.\.\/plan-final\.md/);
    assert.match(peticion, new RegExp(ROLES_BRAINSTORM[0]!.id));
    assert.match(peticion, /Que NO miras/);
    assert.doesNotMatch(peticion, /re-planificacion/);
  });
});

/**
 * Mutacion que lo pone rojo: que la ronda 2 con 1 rol vuelva a escribir
 * el unificador, o que la peticion de redaccion ignore el bloque de
 * re-planificacion.
 */
test('plan (TASK-042): la ronda 2 con 1 rol escribe peticion-plan-2.md con re-planificacion', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
      repoCwd: repoRoot,
    });

    assert.equal(segunda.ronda, 2);
    assert.equal(segunda.modo, 'redaccion');
    assert.equal(segunda.brainstormReutilizado, false);
    assert.deepEqual((await readdir(brainstormDir(segunda.filePath))).sort(), [
      'peticion-plan-1.md',
      'peticion-plan-2.md',
    ]);
    const peticion = await readFile(segunda.peticionRedaccion!, 'utf8');
    assert.match(peticion, /re-planificacion, no un primer pase/);
    assert.match(peticion, /Ya existe un plan redactado/);
  });
});

/**
 * Una carpeta anterior a TASK-042 (con `peticion-unificador-N` como
 * testigo y la peticion y salida del unico rol) sigue contando como
 * ronda: la siguiente es la N+1 y NO se pisa nada de lo que hay.
 *
 * Mutacion que lo pone rojo: dejar `RONDA_UNIFICADOR_RE` sin la rama
 * `unificador`, o sin la rama `plan`.
 */
test('plan (TASK-042): una carpeta antigua con peticion-unificador-N sigue contando como ronda', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
    const dir = path.join(
      tareasRoot,
      '00-planificadas',
      'TASK-800',
      PLANIFICACION_DIRNAME,
      BRAINSTORM_DIRNAME
    );
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'peticion-unificador-1.md'), '# testigo antiguo\n', 'utf8');
    await writeFile(path.join(dir, 'peticion-brainstorm-arquitectura-1.md'), '# rol\n', 'utf8');
    await writeFile(path.join(dir, 'salida-brainstorm-arquitectura-1.md'), '# salida real\n', 'utf8');
    commitAll(repoRoot, 'tarea TASK-800 con carpeta antigua');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.equal(result.ronda, 2);
    assert.equal(result.modo, 'redaccion');
    assert.deepEqual((await readdir(brainstormDir(result.filePath))).sort(), [
      'peticion-brainstorm-arquitectura-1.md',
      'peticion-plan-2.md',
      'peticion-unificador-1.md',
      'salida-brainstorm-arquitectura-1.md',
    ]);
  });
});

/**
 * EL EFECTO REAL DEL `max`, medido en el smoke test y fijado aqui para
 * que no se olvide: una tarea declarada `trivial` NO se queda en 0
 * roles en cuanto su enunciado tiene una dependencia o cinco criterios,
 * porque la heuristica la sube a `simple` y el max manda.
 *
 * El test de arriba ("trivial escribe 0 peticiones") pasa porque su
 * fixture no declara ni dependencias ni criterios — o sea, por una
 * condicion que casi ninguna tarea real cumple. Sin este segundo test
 * el reparto parecia respetar el "0 en trivial" del YML, y medido
 * sobre las 32 tareas del repo NINGUNA acaba con 0 roles.
 *
 * Mutacion que lo pone rojo: sustituir el max por el nivel declarado a
 * secas (volveria a dar 0), que es justo la alternativa que se
 * descarto.
 */
test('plan: una tarea "trivial" con dependencias sube a 1 rol por el max (efecto medido del maximo)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      // Dos dependencias = 2 puntos, que es justo lo que saca a la
      // tarea de `trivial` (nivel_trivial_hasta: 1). Es la puntuacion
      // real de TASK-005, la unica tarea declarada trivial del repo.
      sampleTask({ complejidad: 'trivial', dependencias: ['TASK-798', 'TASK-799'] }),
      BODY
    );
    commitAll(repoRoot, 'tarea TASK-800');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.equal(result.resolucion.nivelDeclarado, 'trivial');
    assert.equal(result.resolucion.nivelHeuristico, 'simple');
    assert.equal(result.roles.length, 1);
  });
});

/**
 * Mutacion que lo pone rojo: aplicar el tope de hotfix como
 * sustitucion en vez de como Math.min — un hotfix trivial pasaria de 0
 * a 1 rol, que es justo lo que el YML prohibe.
 */
test('plan: un hotfix trivial se queda en 0 roles (el tope es un MIN, no una sustitucion)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask({ tipo: 'hotfix', complejidad: 'trivial', rama: 'hotfix/task-800-prueba' }),
      BODY
    );
    commitAll(repoRoot, 'tarea TASK-800');
    propagarAMain(repoRoot);

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.equal(result.roles.length, 0);
    assert.deepEqual(await readdir(brainstormDir(result.filePath)), ['peticion-unificador-1.md']);
  });
});

/**
 * Mutacion que lo pone rojo: quitar el tope de hotfix. Una critica de
 * tipo hotfix pasaria de 1 rol a 4.
 */
test('plan: un hotfix critico se topa en 1 rol, no en 4', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask({ tipo: 'hotfix', complejidad: 'critica', rama: 'hotfix/task-800-prueba' }),
      BODY
    );
    commitAll(repoRoot, 'tarea TASK-800');
    propagarAMain(repoRoot);

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.equal(result.roles.length, 1);
    assert.equal(result.resolucion.topeHotfixAplicado, true);
  });
});

// ─── el acotado de contexto por rol (seccion 16.2) ─────────────────────

/**
 * ESTE es el test que sostiene el criterio de aceptacion 1, y el que
 * mas facil se vuelve vacio. La aserción que muerde es la NEGATIVA: que
 * la peticion de un rol no contenga el contexto de los otros. La
 * positiva sola no valdria — el nombre del rol lo pone la cabecera de
 * la plantilla, asi que borrar el cuerpo entero la dejaria en verde.
 *
 * Y no se compara contra un literal copiado aqui, sino contra el
 * contenido real de ROLES_BRAINSTORM: si alguien reescribe un recorte,
 * el test lo sigue.
 *
 * Mutacion que lo pone rojo: pasar `ROLES_BRAINSTORM` entero a cada
 * peticion en vez del rol que toca, o concatenar los `mira` de todos.
 */
test('plan: la peticion de cada rol lleva SU recorte de contexto y no el de los demas', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'critica' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });
    assert.equal(result.roles.length, 4, 'precondicion: los cuatro roles entran en critica');

    const dir = brainstormDir(result.filePath);
    for (const rol of ROLES_BRAINSTORM) {
      const contenido = await readFile(path.join(dir, `peticion-${rol.id}-1.md`), 'utf8');

      // Lo suyo esta.
      assert.ok(contenido.includes(rol.pregunta), `${rol.id} no trae su pregunta`);
      for (const m of rol.mira) {
        assert.ok(contenido.includes(m), `${rol.id} no trae su "mira": ${m}`);
      }

      // Y lo ajeno NO esta.
      for (const otro of ROLES_BRAINSTORM) {
        if (otro.id === rol.id) continue;
        assert.ok(
          !contenido.includes(otro.pregunta),
          `la peticion de ${rol.id} trae la pregunta de ${otro.id}`
        );
        for (const m of otro.mira) {
          assert.ok(!contenido.includes(m), `la peticion de ${rol.id} trae el "mira" de ${otro.id}`);
        }
      }
    }
  });
});

/**
 * Mutacion que lo pone rojo: quitar del enunciado el objetivo o los
 * criterios. Sin el enunciado, un rol no tiene nada que diseñar.
 */
test('plan: cada peticion embebe el objetivo y los criterios de la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask({ complejidad: 'simple' }),
      '## Objetivo\n\nUn objetivo bien reconocible.\n\n' +
        '## Criterios de aceptacion\n- [ ] Un criterio bien reconocible.\n'
    );
    commitAll(repoRoot, 'tarea TASK-800');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    const dir = brainstormDir(result.filePath);
    for (const fichero of await readdir(dir)) {
      if (!fichero.startsWith('peticion-')) continue;
      const contenido = await readFile(path.join(dir, fichero), 'utf8');
      assert.ok(contenido.includes('Un objetivo bien reconocible.'), fichero);
      assert.ok(contenido.includes('Un criterio bien reconocible.'), fichero);
    }
  });
});

// ─── la peticion del unificador ────────────────────────────────────────

/**
 * Mutacion que lo pone rojo: que la peticion del unificador liste los
 * cuatro roles siempre en vez de los que de verdad se lanzaron. Se
 * comprueba contra el disco, no contra el valor devuelto.
 */
test('plan: el unificador recibe la lista de las salidas que EXISTEN, ni una mas', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    const dir = brainstormDir(result.filePath);
    const salidasEnDisco = (await readdir(dir)).filter((f) => f.startsWith('salida-'));
    assert.equal(salidasEnDisco.length, 2, 'precondicion: media lanza 2 roles');

    const peticion = await readFile(path.join(dir, 'peticion-unificador-1.md'), 'utf8');
    for (const salida of salidasEnDisco) {
      assert.ok(peticion.includes(salida), `el unificador no nombra ${salida}`);
    }
    for (const rol of ROLES_BRAINSTORM.slice(2)) {
      assert.ok(
        !peticion.includes(`salida-${rol.id}-1.md`),
        `el unificador nombra ${rol.id}, que no se lanzo`
      );
    }
  });
});

/**
 * Con UN solo rol no puede haber desacuerdo, asi que exigirlo — y
 * ademas tratar la unanimidad como alarma — obligaria al agente a
 * inventarse uno o a disparar una alarma falsa. No es un borde: con la
 * tabla actual 14 de las 32 tareas del repo resuelven un solo rol, y
 * una alarma que salta en la mitad de los planes deja de significar
 * nada (IMPORTANTE de la revision por pares).
 *
 * Mutacion que lo pone rojo: quitar la rama `roles.length === 1` de
 * peticionUnificadorTemplate y dejar el texto de varios roles.
 */
test('plan: con un solo rol el unificador NO recibe instrucciones sobre desacuerdos', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });
    assert.equal(result.roles.length, 1, 'precondicion: simple lanza un solo rol');

    // TASK-042 (decision C4): con 1 rol ya no hay peticion del unificador;
    // la instruccion equivalente vive en la peticion de redaccion, que no
    // pide desacuerdos ni trata la unanimidad como alarma.
    assert.equal(result.peticionUnificador, null);
    const peticion = await readFile(result.peticionRedaccion!, 'utf8');
    assert.match(peticion, /un solo rol/);
    assert.doesNotMatch(peticion, /Donde dos roles discrepen/);
    assert.doesNotMatch(peticion, /eso es la alarma/);
    assert.doesNotMatch(peticion, /Desacuerdos entre roles/);
    // Lo que SI tiene que pedirle, que es lo unico util con un rol.
    assert.match(peticion, /Lo que el rol no cubrio/);

    // Y el scaffold del plan no reserva sitio para desacuerdos.
    const plan = await readFile(result.planPath, 'utf8');
    assert.doesNotMatch(plan, /Desacuerdos entre roles/);
    assert.match(plan, /## Lo que el rol no cubrio/);
  });
});

/**
 * Mutacion que lo pone rojo: borrar de la plantilla la prohibicion de
 * promediar. Es la instruccion que separa un unificador de una
 * calculadora de medias, y sin ella el criterio de aceptacion 2 no se
 * cumple aunque los ficheros esten todos.
 */
test('plan: el unificador tiene prohibido promediar y obligado a senalar desacuerdos', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    const peticion = await readFile(result.peticionUnificador!, 'utf8');
    assert.match(peticion, /No promedies/);
    assert.match(peticion, /discrepen/);
    // Y el caso invertido, que es el que de verdad se olvida: la
    // coincidencia total tiene que leerse como alarma, no como calidad.
    assert.match(peticion, /Si no discrepan en nada, eso es la alarma/);
  });
});

/**
 * Mutacion que lo pone rojo: dejar de escribir el bloque de
 * complejidad, o escribirlo solo cuando hay discrepancia (que era la
 * alternativa descartada: un bloque que solo sale en el caso raro
 * entrena a no buscarlo, y su ausencia se vuelve ambigua).
 */
test('plan: la peticion del unificador trae la complejidad declarada Y la heuristica, coincidan o no', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // "alta" declarada contra un objetivo sin senales: la heuristica
    // saldra mas baja y habra discrepancia de verdad.
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'alta' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.equal(result.resolucion.nivelDeclarado, 'alta');
    assert.equal(result.resolucion.hayDiscrepancia, true);
    // El max manda: 3 roles por lo declarado, no 0-1 por la heuristica.
    assert.equal(result.roles.length, 3);

    const peticion = await readFile(result.peticionUnificador!, 'utf8');
    assert.match(peticion, /Declarada en la tarea: \*\*alta\*\*/);
    assert.match(peticion, new RegExp(`Heuristica \\(${result.resolucion.puntos} puntos\\)`));
    assert.match(peticion, /Los dos niveles NO coinciden/);
  });
});

// ─── la puerta del objetivo vacio ──────────────────────────────────────

/**
 * Mutacion que lo pone rojo: quitar la puerta. Sin ella N agentes
 * reciben una peticion sin sustancia y devuelven N invenciones que el
 * unificador consolida en un plan con autoridad.
 */
test('plan: objetivo vacio con roles que lanzar aborta y NO mueve la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'alta' }), '## Objetivo\n\n');
    commitAll(repoRoot, 'tarea TASK-800');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot }),
      (e: unknown) => {
        assert.ok(e instanceof PlanCommandError);
        assert.match(e.message, /Objetivo/);
        // Convencion del proyecto: el error dice QUE HACER (TASK-043: y
        // donde: en la rama base, editando y commiteando).
        assert.match(e.message, /Estas en la rama base: edita .*commitea el cambio y reintenta/s);
        return true;
      }
    );

    // Ni movida, ni carpeta nueva, ni workspace ensuciado.
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.estado, 'planificada');
    assert.equal(spawnSync('git', ['status', '--porcelain'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).stdout.trim(), '');
  });
});

/**
 * TASK-043 cambia el contrato de TASK-016: la puerta se aplica TAMBIEN
 * con 0 roles (una tarea sin objetivo es igual de cara de revisar aunque
 * no lance brainstorm). El simetrico sigue haciendo falta para que una
 * puerta que abortara SIEMPRE no deje en verde el test de arriba: una
 * tarea bien definida con 0 roles planifica.
 *
 * Mutacion que lo pone rojo: volver a condicionar la puerta a roles > 0.
 */
test('plan (TASK-043): objetivo vacio SIN roles TAMBIEN aborta; bien definida, planifica', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'trivial' }), '## Objetivo\n\n');
    commitAll(repoRoot, 'tarea TASK-800');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot }),
      (e: unknown) => e instanceof PlanCommandError && /Objetivo/.test(e.message)
    );
    assert.equal((await readTareaFile(tareasRoot, 'TASK-800'))?.task.estado, 'planificada');

    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'trivial' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800 con objetivo');
    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.equal(result.roles.length, 0);
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

// ─── re-planificacion incremental (seccion 16.3) ───────────────────────

/**
 * Mutacion que lo pone rojo: regenerar las peticiones de rol en la
 * segunda vuelta. Un bucle de "pide cambios" es una correccion
 * incremental, no un reinicio, y tratarlo como reinicio es donde mas se
 * gasta sin que nadie lo note.
 */
test('plan: una segunda vuelta NO relanza el brainstorm, solo pide otro pase al unificador', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const primera = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });
    const dir = brainstormDir(primera.filePath);
    const trasPrimera = (await readdir(dir)).sort();

    // La persona pide cambios: el plan sigue sin aprobar y se
    // re-planifica.
    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
      repoCwd: repoRoot,
    });

    assert.equal(segunda.ronda, 2);
    assert.equal(segunda.brainstormReutilizado, true);
    assert.equal(segunda.rondaRoles, 1, 'el brainstorm reutilizado es el de la ronda 1');
    // peticionesRol NO se vacia: las peticiones existen y hay que poder
    // lanzarlas. Vaciarlas las escondia (CRITICO de la ronda 5).
    assert.equal(segunda.peticionesRol.length, 2);
    for (const ruta of segunda.peticionesRol) await readFile(ruta, 'utf8');

    const trasSegunda = (await readdir(dir)).sort();
    const nuevos = trasSegunda.filter((f) => !trasPrimera.includes(f));
    assert.deepEqual(nuevos, ['peticion-unificador-2.md']);

    // Y lo de la ronda 1 sigue intacto, byte a byte: la ronda 2 no
    // puede pisar el trabajo de los roles de la 1.
    for (const fichero of trasPrimera) {
      assert.ok(trasSegunda.includes(fichero), `desaparecio ${fichero}`);
    }
  });
});

// ─── los dos CRITICOS de la revision por pares ─────────────────────────

/**
 * CRITICO 1. Una ronda interrumpida a mitad (Ctrl+C, antivirus, disco)
 * deja peticiones de rol sin la del unificador. Antes eso subia la
 * ronda a 2, el codigo lo tomaba por re-planificacion y la PRIMERA
 * planificacion de la tarea acababa sin una sola peticion de rol, con
 * exit 0 y anunciando una re-planificacion que nunca hubo. No se salia
 * con ningun comando.
 *
 * Mutacion que lo pone rojo: que RONDA_UNIFICADOR_RE vuelva a mirar
 * tambien las peticiones o las salidas de rol.
 */
test('plan: una ronda interrumpida a medias se REINTENTA, no se toma por re-planificacion', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'critica' }), BODY);
    // Estado exacto que deja una interrupcion tras la primera escritura
    // del bucle: una peticion de rol y NINGUNA del unificador.
    const dirOrigen = path.join(
      tareasRoot,
      '00-planificadas',
      'TASK-800',
      PLANIFICACION_DIRNAME,
      BRAINSTORM_DIRNAME
    );
    await mkdir(dirOrigen, { recursive: true });
    await writeFile(
      path.join(dirOrigen, 'peticion-brainstorm-arquitectura-1.md'),
      '# resto de una ronda que murio a mitad\n',
      'utf8'
    );
    // Y una salida que un agente YA habia respondido: eso si lleva
    // trabajo dentro y no se puede pisar.
    await writeFile(
      path.join(dirOrigen, 'salida-brainstorm-arquitectura-1.md'),
      '# lo que ya habia escrito un agente\n',
      'utf8'
    );
    commitAll(repoRoot, 'tarea TASK-800 con ronda a medias');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    // Sigue siendo la ronda 1 y NO se anuncia re-planificacion.
    assert.equal(result.ronda, 1);
    assert.equal(result.brainstormReutilizado, false);
    assert.equal(result.roles.length, 4);

    // Se completo lo que faltaba: los cuatro roles y el unificador.
    const esperados = ROLES_BRAINSTORM.flatMap((r) => [
      `peticion-${r.id}-1.md`,
      `salida-${r.id}-1.md`,
    ])
      .concat(['peticion-unificador-1.md'])
      .sort();
    assert.deepEqual((await readdir(brainstormDir(result.filePath))).sort(), esperados);

    // La peticion de rol SI se regenera — es derivada — pero la SALIDA
    // no se toca jamas: puede llevar dentro la respuesta de un agente.
    // Esa distincion es la que la ronda 5 obligo a hacer explicita.
    assert.equal(
      await readFile(
        path.join(brainstormDir(result.filePath), 'salida-brainstorm-arquitectura-1.md'),
        'utf8'
      ),
      '# lo que ya habia escrito un agente\n'
    );
  });
});

/**
 * CRITICO 2. En una re-planificacion las salidas siguen siendo las de
 * la ronda en que corrieron los roles. La peticion del unificador
 * apuntaba a `salida-<rol>-<ronda actual>.md`, que no existe ni
 * existira, y un unificador obediente concluia que se habia perdido el
 * brainstorm entero teniendolo al lado.
 *
 * Mutacion que lo pone rojo: pasar `ronda` en vez de `rondaSalidas` a
 * peticionUnificadorTemplate.
 */
test('plan: en la ronda 2 el unificador apunta a salidas que EXISTEN en disco', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
      repoCwd: repoRoot,
    });

    assert.equal(segunda.ronda, 2);
    const dir = brainstormDir(segunda.filePath);
    const peticion = await readFile(path.join(dir, 'peticion-unificador-2.md'), 'utf8');

    // Toda salida que la peticion nombre tiene que estar en disco. Es
    // la aserción que muerde: comprobar que "nombra dos salidas" seria
    // verde igual con los nombres rotos.
    const nombrados = [...peticion.matchAll(/`(salida-[a-z0-9-]+-\d+\.md)`/g)].map((m) => m[1]!);
    assert.equal(nombrados.length, 2, `esperaba 2 salidas nombradas, encontre ${nombrados.length}`);
    const enDisco = await readdir(dir);
    for (const nombre of nombrados) {
      assert.ok(enDisco.includes(nombre), `la peticion nombra ${nombre}, que no existe en disco`);
    }

    // Y le dice que esto es una correccion incremental, no un primer
    // pase: sin eso el unificador rehace el mismo plan y no haber
    // relanzado los roles no compra nada (16.3).
    assert.match(peticion, /re-planificacion, no un primer pase/);
    assert.match(peticion, /Ya existe un plan redactado/);
  });
});

/**
 * Mutacion que lo pone rojo: numerar la ronda contando ficheros en vez
 * de buscando el maximo. Con un fichero borrado a mano, contar
 * reutilizaria un numero ya usado y pisaria la ronda anterior.
 *
 * La ronda 4 se monta COMPLETA (testigo + la peticion de su unico rol).
 * En la primera version de este test solo se sembraba el testigo, y eso
 * era justamente el escenario del CRITICO que encontro la ronda 2 de la
 * revision: el test montaba el fallo y lo daba por correcto. Un test
 * puede consagrar un bug igual de bien que documentarlo.
 */
test('plan: la ronda sale del mayor numero presente, no de cuantos ficheros hay', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
    const taskDir = path.join(tareasRoot, '00-planificadas', 'TASK-800');
    const dir = path.join(taskDir, PLANIFICACION_DIRNAME, BRAINSTORM_DIRNAME);
    await mkdir(dir, { recursive: true });
    // Solo queda el rastro de una ronda 4, pero COMPLETA; las 1-3 se
    // borraron.
    await writeFile(path.join(dir, 'peticion-unificador-4.md'), '# ronda 4\n', 'utf8');
    await writeFile(
      path.join(dir, 'peticion-brainstorm-arquitectura-4.md'),
      '# rol de la ronda 4\n',
      'utf8'
    );
    commitAll(repoRoot, 'tarea TASK-800 con historial parcial');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.equal(result.ronda, 5);
    const enDisco = await readdir(brainstormDir(result.filePath));
    // TASK-042 (decision C4): `simple` = 1 rol, asi que la ronda 5 se
    // escribe como peticion de redaccion, no del unificador. El testigo
    // antiguo (peticion-unificador-4) sigue contando como ronda.
    assert.ok(enDisco.includes('peticion-plan-5.md'));
    assert.ok(!enDisco.includes('peticion-unificador-5.md'));
    assert.ok(enDisco.includes('peticion-unificador-4.md'), 'se piso la ronda 4');
  });
});

// ─── los CRITICOS de la RONDA 2 de la revision ─────────────────────────

/**
 * El primer arreglo del CRITICO de la ronda 1 se quedo a medias: hacia
 * que la ronda saliera solo del testigo, pero sin comprobar que la
 * ronda que atestigua estuviera de verdad completa. Si lo unico que
 * sobrevive a la interrupcion es el fichero del unificador, volvia a
 * pasar exactamente lo mismo: primera planificacion sin ninguna
 * peticion de rol y exit 0.
 *
 * Mutacion que lo pone rojo: que `rolesLanzadosEn` deje de mirar las
 * peticiones de rol y se quede solo con el testigo.
 */
test('plan: un testigo huerfano (sin peticiones de rol) NO cuenta como ronda completa', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'critica' }), BODY);
    const dir = path.join(
      tareasRoot,
      '00-planificadas',
      'TASK-800',
      PLANIFICACION_DIRNAME,
      BRAINSTORM_DIRNAME
    );
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'peticion-unificador-1.md'), '# testigo huerfano\n', 'utf8');
    commitAll(repoRoot, 'tarea TASK-800 con testigo huerfano');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    // Lo que importa NO es el numero de ronda — puede avanzar, y de
    // hecho avanza — sino que un testigo suelto no pueda hacer creer
    // que ya hay un brainstorm. Aseverar el numero era aseverar el
    // mecanismo; esto asevera la propiedad.
    assert.equal(result.brainstormReutilizado, false, 'un testigo suelto no es un brainstorm');
    assert.equal(result.roles.length, 4);

    const enDisco = await readdir(brainstormDir(result.filePath));
    for (const rol of ROLES_BRAINSTORM) {
      assert.ok(
        enDisco.some((f) => f.startsWith(`peticion-${rol.id}-`)),
        `falta la peticion de ${rol.id}`
      );
      assert.ok(
        enDisco.some((f) => f.startsWith(`salida-${rol.id}-`)),
        `falta el scaffold de salida de ${rol.id}`
      );
    }
  });
});

/**
 * El caso simetrico del anterior, y el que la ronda 4 encontro: un
 * testigo suelto con numero >= 2 tampoco puede dar por hecho el
 * brainstorm. Antes se daba por buena cualquier ronda >1 sin mirar
 * nada, asi que una tarea recien creada con un `peticion-unificador-2.md`
 * dentro se quedaba sin brainstorm y sin salida por ningun comando.
 *
 * Mutacion que lo pone rojo: volver a `brainstormReutilizado = ronda > 1`.
 */
test('plan: un testigo suelto de ronda ALTA tampoco da el brainstorm por hecho', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    const dir = path.join(
      tareasRoot,
      '00-planificadas',
      'TASK-800',
      PLANIFICACION_DIRNAME,
      BRAINSTORM_DIRNAME
    );
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'peticion-unificador-7.md'), '# resto de otra vida\n', 'utf8');
    commitAll(repoRoot, 'tarea TASK-800 con testigo de ronda alta');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.equal(result.brainstormReutilizado, false);
    const enDisco = await readdir(brainstormDir(result.filePath));
    for (const rol of ROLES_BRAINSTORM.slice(0, 2)) {
      assert.ok(
        enDisco.some((f) => f.startsWith(`peticion-${rol.id}-`)),
        `falta la peticion de ${rol.id}`
      );
    }
  });
});

/**
 * Si el numero de roles SUBE entre dos vueltas — y sube solo, porque
 * añadir criterios de aceptacion mueve la heuristica — el brainstorm se
 * relanza con el juego nuevo, y la peticion del unificador se regenera
 * para describirlo. Antes se quedaba rancia: hablaba de "un solo rol" y
 * prohibia buscar desacuerdos mientras al lado ya habia dos peticiones
 * de rol diciendo lo contrario (CRITICO de la ronda 4).
 *
 * Mutacion que lo pone rojo: escribir la peticion del unificador con
 * `escribirSiNoEstaYa` en vez de regenerarla siempre; o decidir
 * `brainstormReutilizado` sin mirar los roles de hoy.
 */
test('plan: si suben los roles, se relanza el brainstorm y el unificador no se queda rancio', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const primera = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });
    assert.equal(primera.roles.length, 1);

    // La persona sube la complejidad en el bucle de "pide cambios".
    const contenido = await readFile(primera.filePath, 'utf8');
    await writeFile(
      primera.filePath,
      contenido.replace('complejidad: simple', 'complejidad: alta'),
      'utf8'
    );
    commitAll(repoRoot, 'complejidad subida');

    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
      repoCwd: repoRoot,
    });

    assert.equal(segunda.roles.length, 3);
    assert.equal(segunda.brainstormReutilizado, false, 'con roles nuevos hay que relanzar');

    const enDisco = await readdir(brainstormDir(segunda.filePath));
    for (const rol of ROLES_BRAINSTORM.slice(0, 3)) {
      assert.ok(
        enDisco.some((f) => f.startsWith(`peticion-${rol.id}-`)),
        `falta la peticion de ${rol.id}`
      );
    }

    // Y la peticion del unificador describe TRES roles, no uno.
    const peticion = await readFile(segunda.peticionUnificador!, 'utf8');
    assert.doesNotMatch(peticion, /se planifico con un solo rol/);
    assert.match(peticion, /No promedies/);
  });
});

/**
 * Bajar los roles SIN llegar a cero seguia tirando salidas reales,
 * porque la lista se componia a partir de `roles` en esa rama (CRITICO
 * de la ronda 4; el arreglo de la ronda 3 solo cubrio el caso de cero).
 *
 * Mutacion que lo pone rojo: volver a componer `salidasAConsolidar` con
 * un bucle sobre `roles` en vez de listar el disco.
 */
test('plan: bajar los roles sin llegar a cero no oculta las salidas que existen', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'alta' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const primera = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });
    assert.equal(primera.roles.length, 3);

    // Los tres agentes responden de verdad.
    const dir = brainstormDir(primera.filePath);
    for (const rol of ROLES_BRAINSTORM.slice(0, 3)) {
      await writeFile(
        path.join(dir, nombreSalidaRolTest(rol.id, 1)),
        `# respuesta de ${rol.titulo}\n`,
        'utf8'
      );
    }
    const contenido = await readFile(primera.filePath, 'utf8');
    await writeFile(
      primera.filePath,
      contenido.replace('complejidad: alta', 'complejidad: simple'),
      'utf8'
    );
    commitAll(repoRoot, 'complejidad bajada a simple');

    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
      repoCwd: repoRoot,
    });
    assert.equal(segunda.resolucion.agentes, 1, 'hoy la complejidad resuelve un solo rol');
    // Pero los roles de la ronda reutilizada siguen siendo tres.
    assert.equal(segunda.roles.length, 3);

    const peticion = await readFile(segunda.peticionUnificador!, 'utf8');
    // Las TRES salidas reales se nombran, no solo la del rol que queda.
    for (const rol of ROLES_BRAINSTORM.slice(0, 3)) {
      assert.ok(
        peticion.includes(nombreSalidaRolTest(rol.id, 1)),
        `el unificador no nombra la salida de ${rol.titulo}, que existe y esta llena`
      );
    }
  });
});

/**
 * `flag: 'wx'` crea el fichero ANTES de volcar el contenido, asi que
 * una muerte en ese hueco deja un testigo de cero bytes — que es
 * precisamente el escenario que motivo todo esto. Preguntar solo si
 * existe lo daba por bueno.
 *
 * Mutacion que lo pone rojo: usar `existeFichero` en vez de
 * `ficheroConContenido` al validar el testigo.
 */
test('plan: un testigo de cero bytes NO cuenta como ronda completa', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    const dir = path.join(
      tareasRoot,
      '00-planificadas',
      'TASK-800',
      PLANIFICACION_DIRNAME,
      BRAINSTORM_DIRNAME
    );
    await mkdir(dir, { recursive: true });
    // La ronda 1 "entera", pero con el testigo truncado a cero bytes.
    for (const rol of ROLES_BRAINSTORM.slice(0, 2)) {
      await writeFile(path.join(dir, `peticion-${rol.id}-1.md`), '# ok\n', 'utf8');
      await writeFile(path.join(dir, `salida-${rol.id}-1.md`), '# ok\n', 'utf8');
    }
    await writeFile(path.join(dir, 'peticion-unificador-1.md'), '', 'utf8');
    commitAll(repoRoot, 'tarea TASK-800 con testigo truncado');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    // La ronda NO avanza: el testigo truncado no cierra la ronda 1.
    assert.equal(result.ronda, 1);
    // Y NO es una re-planificacion: los roles son de ESTA misma ronda,
    // asi que llamarlo asi hacia que el CLI hablara de "salidas
    // anteriores" y "tu feedback" en una primera vuelta (CRITICO de la
    // ronda 5). Reutilizar artefactos de la misma ronda es un reintento.
    assert.equal(result.brainstormReutilizado, false);
    assert.equal(result.rondaRoles, 1);
    const testigo = await readFile(
      path.join(brainstormDir(result.filePath), 'peticion-unificador-1.md'),
      'utf8'
    );
    assert.ok(testigo.length > 0, 'el testigo vacio se quedo vacio');
  });
});

/**
 * `SALIDA_ROL_RE` tomaba el maximo sin comprobar que ese maximo fuera
 * un juego COMPLETO. Una sola salida rezagada de una ronda alta
 * secuestraba la lista y el unificador recibia la orden de consolidar
 * una ronda de la que solo hay un fichero, ignorando el brainstorm real.
 *
 * Mutacion que lo pone rojo: elegir `rondaRoles` por el numero mas alto
 * que aparezca en vez de por el juego completo de peticiones.
 */
test('plan: una salida huerfana de una ronda alta no secuestra la lista del unificador', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const primera = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });
    const dir = brainstormDir(primera.filePath);
    // Una salida suelta de una ronda 5 que nunca existio.
    await writeFile(
      path.join(dir, `salida-${ROLES_BRAINSTORM[0]!.id}-5.md`),
      '# huerfana\n',
      'utf8'
    );
    commitAll(repoRoot, 'salida huerfana');

    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
      repoCwd: repoRoot,
    });

    const peticion = await readFile(segunda.peticionUnificador!, 'utf8');
    const nombrados = [...peticion.matchAll(/`(salida-[a-z0-9-]+-\d+\.md)`/g)].map((m) => m[1]!);
    assert.equal(nombrados.length, 2);
    const enDisco = await readdir(dir);
    for (const nombre of nombrados) {
      assert.ok(enDisco.includes(nombre), `nombra ${nombre}, que no existe`);
      assert.ok(nombre.endsWith('-1.md'), `deberia consolidar la ronda 1 real, no ${nombre}`);
    }
  });
});

/**
 * Un scaffold de salida que falte SE RECREA, se relancen los roles o no.
 * Antes la escritura de scaffolds vivia dentro del "si no se reutiliza",
 * asi que uno que faltara — por una muerte entre la peticion y su
 * scaffold, o porque alguien lo borrara por parecer basura — no se
 * recreaba nunca: el rol se quedaba con peticion y sin sitio donde
 * escribir, y nadie lo decia (CRITICO de la ronda 5).
 *
 * Mutacion que lo pone rojo: devolver el bucle de `asegurarScaffold`
 * dentro del `if (relanzarRoles)`.
 */
test('plan: un scaffold de salida borrado se recrea aunque el brainstorm se reutilice', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const primera = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });
    const dir = brainstormDir(primera.filePath);
    // Un agente ya respondio a uno de los dos; el otro scaffold
    // desaparece.
    const [rolA, rolB] = [ROLES_BRAINSTORM[0]!, ROLES_BRAINSTORM[1]!];
    await writeFile(
      path.join(dir, nombreSalidaRolTest(rolA.id, 1)),
      '# respuesta real que no se puede pisar\n',
      'utf8'
    );
    await rm(path.join(dir, nombreSalidaRolTest(rolB.id, 1)));
    commitAll(repoRoot, 'un scaffold borrado');

    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
      repoCwd: repoRoot,
    });

    const enDisco = await readdir(dir);
    assert.ok(
      enDisco.includes(nombreSalidaRolTest(rolB.id, 1)),
      'el scaffold borrado no se recreo: ese rol no tiene donde escribir'
    );
    // Y el que tenia contenido sigue intacto.
    assert.equal(
      await readFile(path.join(dir, nombreSalidaRolTest(rolA.id, 1)), 'utf8'),
      '# respuesta real que no se puede pisar\n'
    );
    // El unificador nombra las dos, y sigue tratandolo como dos roles.
    const peticion = await readFile(segunda.peticionUnificador!, 'utf8');
    assert.ok(peticion.includes(nombreSalidaRolTest(rolA.id, 1)));
    assert.ok(peticion.includes(nombreSalidaRolTest(rolB.id, 1)));
    assert.doesNotMatch(
      peticion,
      /se planifico con un solo rol/,
      'con dos roles no puede decir que se planifico con uno'
    );
  });
});

/**
 * Los nombres de fichero se componen SIEMPRE con los helpers de
 * plan-brainstorm.ts, nunca con literales, y admiten ids de rol con
 * guion o digito.
 *
 * Lo que habia aqui era un test tautologico: definia su propio regex
 * local y lo aseveraba contra si mismo, asi que no podia ponerse rojo
 * por ningun cambio en `src/`. Lo destapo la ronda 5, y es exactamente
 * el defecto que la cabecera de este fichero dice venir a evitar — se
 * cuela hasta cuando lo estas buscando.
 *
 * Mutacion que lo pone rojo: cambiar el prefijo o el separador en
 * nombrePeticionRol / nombreSalidaRol / nombrePeticionUnificador.
 */
test('los nombres de artefacto se componen con los helpers, y admiten ids con guion y digito', () => {
  const rolFicticio = {
    ...ROLES_BRAINSTORM[0]!,
    id: 'brainstorm-datos-externos-2' as (typeof ROLES_BRAINSTORM)[number]['id'],
  };
  assert.equal(nombrePeticionRol(rolFicticio, 10), 'peticion-brainstorm-datos-externos-2-10.md');
  assert.equal(nombreSalidaRol(rolFicticio, 10), 'salida-brainstorm-datos-externos-2-10.md');
  assert.equal(nombrePeticionUnificador(10), 'peticion-unificador-10.md');

  // Y el prefijo con el que "plan" filtra las salidas del disco tiene
  // que seguir casando con lo que produce el helper: si divergen, el
  // unificador deja de ver salidas que existen.
  assert.ok(nombreSalidaRol(rolFicticio, 1).startsWith('salida-brainstorm-'));
});

// ─── los hallazgos de la RONDA 3 de la revision ────────────────────────

/**
 * CRITICO de la ronda 3, y el mas incomodo de los tres: no hacia falta
 * ningun estado corrupto para llegar a el. Bastaba el CAMINO FELIZ,
 * tres veces.
 *
 * `rondaCompleta` exigia las peticiones de rol a TODA ronda, pero una
 * ronda >= 2 no las escribe nunca por diseño. Resultado: ninguna ronda
 * >= 2 podia estar completa, la ronda se quedaba clavada en 2 para
 * siempre y del tercer `plan` en adelante el comando era un no-op con
 * exit 0, reutilizando una peticion de unificador rancia.
 *
 * Mutacion que lo pone rojo: hacer que `ronda` deje de avanzar cuando el
 * testigo esta entero.
 */
test('plan: la ronda AVANZA en la tercera vuelta y en las siguientes (no se queda clavada en 2)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const rondas: number[] = [];
    for (let i = 0; i < 4; i++) {
      const r = await runPlanCommand(tareasRoot, ['TASK-800'], `2026-09-0${8 + i}`, {
        repoCwd: repoRoot,
      });
      rondas.push(r.ronda);
    }

    assert.deepEqual(rondas, [1, 2, 3, 4]);

    // Y cada vuelta deja su propia peticion de unificador: sin eso se
    // pierde el rastro de las vueltas, que es el mecanismo con el que
    // esta tarea cuenta las rondas.
    const dir = brainstormDir(
      path.join(tareasRoot, '01-en-diseno', 'TASK-800', 'tarea.md')
    );
    const enDisco = await readdir(dir);
    for (const n of [1, 2, 3, 4]) {
      assert.ok(
        enDisco.includes(`peticion-unificador-${n}.md`),
        `falta la peticion de la ronda ${n}`
      );
    }
    // Las peticiones de rol siguen siendo solo las de la ronda 1: una
    // re-planificacion no las relanza (16.3).
    assert.equal(enDisco.filter((f) => f.startsWith('peticion-brainstorm-')).length, 2);
  });
});

/**
 * IMPORTANTE de la ronda 3. Si alguien BAJA la complejidad entre dos
 * vueltas, `roles` se queda vacio y la lista de salidas — que se
 * componia a partir de `roles` — salia vacia tambien. La peticion
 * afirmaba "no hay salidas de brainstorm que consolidar" teniendo al
 * lado, llenas, las que los agentes habian escrito. Y encima mentia
 * sobre la causa ("el numero de roles sale del lookup, no de un
 * descuido"): ahi si hubo brainstorm, y se estaba tirando.
 *
 * Mutacion que lo pone rojo: volver a componer la lista desde `roles`
 * en vez de resolverla contra el disco.
 */
test('plan: bajar la complejidad no hace que el unificador ignore un brainstorm que existe', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const primera = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });
    assert.equal(primera.roles.length, 2);

    // Los agentes responden.
    const dir = brainstormDir(primera.filePath);
    for (const rol of ROLES_BRAINSTORM.slice(0, 2)) {
      await writeFile(
        path.join(dir, nombreSalidaRolTest(rol.id, 1)),
        `# respuesta real de ${rol.titulo}\n`,
        'utf8'
      );
    }

    // Y la persona baja la complejidad a trivial (0 roles).
    const tareaMd = primera.filePath;
    const contenido = await readFile(tareaMd, 'utf8');
    await writeFile(tareaMd, contenido.replace('complejidad: media', 'complejidad: trivial'), 'utf8');
    commitAll(repoRoot, 'complejidad bajada');

    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
      repoCwd: repoRoot,
    });
    assert.equal(
      segunda.resolucion.agentes,
      0,
      'precondicion: trivial sin senales resuelve 0 roles'
    );

    const peticion = await readFile(segunda.peticionUnificador!, 'utf8');
    // Las dos salidas reales se nombran, en vez de negarse.
    for (const rol of ROLES_BRAINSTORM.slice(0, 2)) {
      assert.ok(
        peticion.includes(nombreSalidaRolTest(rol.id, 1)),
        `el unificador no nombra la salida real de ${rol.titulo}`
      );
    }
    assert.doesNotMatch(peticion, /No hay salidas de brainstorm que consolidar/);
  });
});

/**
 * Cuando el mismo juego de roles tiene peticiones en VARIAS rondas
 * (subir y volver a bajar la complejidad), se reutiliza la MAS ALTA:
 * es el brainstorm mas reciente, y el que la persona acaba de pedir.
 *
 * Este caso sobrevivio a la ronda 5 como mutante vivo — recorrer las
 * rondas de menor a mayor daba verde — porque ningun test montaba dos
 * rondas con peticiones del mismo rol. Elegir la mas baja devuelve al
 * unificador el brainstorm viejo e ignora el nuevo, que es el sintoma
 * que estas cinco rondas llevan persiguiendo.
 *
 * Mutacion que lo pone rojo: recorrer `rondasConAlgo(PETICION_ROL_RE)`
 * en orden inverso.
 */
test('plan: con peticiones del mismo rol en dos rondas se reutiliza la mas alta', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // TASK-042 (decision C4): la ronda 1 arranca en `media` (2 roles) y no
    // en `simple`: con 1 rol ya no se escribe peticion de rol, solo la de
    // redaccion, y no habria peticiones del mismo rol en dos rondas.
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');
    const subirA = async (nivel: string, ruta: string): Promise<void> => {
      const c = await readFile(ruta, 'utf8');
      await writeFile(ruta, c.replace(/^complejidad: .*$/m, `complejidad: ${nivel}`), 'utf8');
      commitAll(repoRoot, `complejidad ${nivel}`);
    };

    // Ronda 1 con 2 roles.
    const r1 = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot });
    assert.equal(r1.rondaRoles, 1);

    // Sube a alta: relanza en la ronda 2 con 3 roles.
    await subirA('alta', r1.filePath);
    const r2 = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', { repoCwd: repoRoot });
    assert.equal(r2.rondaRoles, 2);
    assert.equal(r2.roles.length, 3);

    // Vuelve a simple: el rol de arquitectura tiene peticion en la 1 Y
    // en la 2. Tiene que ganar la 2.
    await subirA('simple', r2.filePath);
    const r3 = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-10', { repoCwd: repoRoot });

    assert.equal(r3.rondaRoles, 2, 'se reutilizo un brainstorm viejo habiendo uno mas reciente');
    assert.equal(r3.roles.length, 3, 'la ronda 2 lanzo tres roles, no uno');
    const peticion = await readFile(r3.peticionUnificador!, 'utf8');
    for (const rol of ROLES_BRAINSTORM.slice(0, 3)) {
      assert.ok(
        peticion.includes(nombreSalidaRolTest(rol.id, 2)),
        `el unificador no nombra la salida de ${rol.titulo} de la ronda 2`
      );
    }
  });
});

/**
 * La regla "cero bytes no cuenta" vale para las peticiones de rol
 * igual que para el testigo. Es el mismo residuo — un `open()` sin
 * volcado — solo que en el fichero de al lado, y sobrevivio a la ronda
 * 5 como mutante vivo porque solo estaba testada sobre el testigo.
 *
 * Mutacion que lo pone rojo: usar `existeFichero` en vez de
 * `ficheroConContenido` dentro de `rolesLanzadosEn`.
 */
test('plan: una peticion de rol de cero bytes no cuenta como rol ya lanzado', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // TASK-042 (decision C4): `media` y no `simple`: con 1 rol no hay
    // peticion de rol que truncar.
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const primera = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });
    const dir = brainstormDir(primera.filePath);
    const peticion = path.join(dir, nombrePeticionRol(ROLES_BRAINSTORM[0]!, 1));
    // Se trunca la peticion, como haria una escritura cortada.
    await writeFile(peticion, '', 'utf8');
    commitAll(repoRoot, 'peticion truncada');

    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
      repoCwd: repoRoot,
    });

    // No se da por lanzada: se reescribe con contenido.
    assert.equal(segunda.brainstormReutilizado, false);
    const contenido = await readFile(
      path.join(brainstormDir(segunda.filePath), nombrePeticionRol(ROLES_BRAINSTORM[0]!, segunda.rondaRoles!)),
      'utf8'
    );
    assert.ok(contenido.length > 0, 'la peticion truncada se quedo vacia');
    assert.match(contenido, /Peticion de brainstorm/);
  });
});

// ─── el contrato de distribucion del plugin ────────────────────────────

/**
 * El plugin se instala en proyectos que NO son este, y hay tests que
 * prohiben nombrarlo en `skills/` y en `agents/`. Las plantillas de
 * `plan-brainstorm.ts` escriben en el repo del usuario exactamente
 * igual, y no tenian ningun guard equivalente (hallazgo MENOR de la
 * revision por pares). Hoy estan limpias; esto es lo que impide que
 * dejen de estarlo.
 *
 * Ojo con lo que NO se prohibe: nombrar `taskctl` SI es legitimo — las
 * peticiones se escriben en el repo de quien usa la herramienta, y
 * decirle que comando ejecutar es justo su trabajo. Lo que no puede
 * viajar es la INSTANCIA: rutas de este repo, sus documentos internos
 * y sus identificadores de tarea.
 *
 * Mutacion que lo pone rojo: meter en cualquier plantilla una
 * referencia a `docs/contexto/`, a la metodologia o a un TASK-NNN de
 * este repo.
 */
test('las plantillas generadas no filtran nada del repo que las escribe', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      // Titulo y objetivo neutros: si la tarea del usuario menciona algo,
      // eso viene de ella, no de la plantilla, y contaminaria la medida.
      sampleTask({ complejidad: 'critica', titulo: 'Una tarea cualquiera' }),
      '## Objetivo\n\nUn objetivo cualquiera.\n\n## Criterios de aceptacion\n- [ ] Un criterio cualquiera.\n'
    );
    commitAll(repoRoot, 'tarea TASK-800');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    const prohibidos: ReadonlyArray<RegExp> = [
      /taskcode/i,
      /docs\/contexto/i,
      /PROPUESTA_METODOLOGIA/i,
      /CHECKLIST_TERMINACION/i,
      /HALLAZGOS/i,
      /PLAN_SPRINTS/i,
      // Cualquier TASK-NNN que no sea el de la propia tarea del usuario.
      /TASK-(?!800\b)\d{3}/,
    ];

    const dir = brainstormDir(result.filePath);
    for (const fichero of [...(await readdir(dir)), '..' + path.sep + PLAN_FINAL_NOMBRE]) {
      const ruta = path.join(dir, fichero);
      const contenido = await readFile(ruta, 'utf8');
      for (const patron of prohibidos) {
        assert.ok(
          !patron.test(contenido),
          `${fichero} filtra ${patron} — el plugin se instala en proyectos que no son este`
        );
      }
    }
  });
});

// ─── el CLI no llama a ningun modelo ───────────────────────────────────

/**
 * El criterio de aceptacion 5 exige que el camino determinista se
 * pruebe sin llamadas reales a agentes. La forma fuerte de fijarlo no
 * es "estos tests pasan sin red" (pasarian igual si la llamada
 * estuviera en una rama no ejercitada), sino comprobar que en `src/` no
 * existe ninguna.
 *
 * Mutacion que lo pone rojo: meter en cualquier modulo de src/ un
 * `spawnSync('claude', ...)`, un `fetch(` o un `https.request`.
 */
test('src/ no contiene ninguna invocacion a un modelo ni ninguna llamada de red', async () => {
  const prohibidos: ReadonlyArray<{ patron: RegExp; que: string }> = [
    { patron: /\bfetch\s*\(/, que: 'una llamada fetch()' },
    { patron: /https?\.request\s*\(/, que: 'una peticion HTTP' },
    { patron: /['"`]claude['"`]/, que: 'una invocacion del binario claude' },
    { patron: /anthropic|openai/i, que: 'una referencia a una API de modelos' },
  ];

  // TASK-017 (plan-final.md, riesgo aceptado): plugin-instalado.ts invoca
  // `spawnSync('claude', ['plugin', 'list', '--json'], ...)` para comprobar
  // si un skill externo ya esta instalado. No es una invocacion a un
  // modelo/agente -- es una consulta de solo lectura a la gestion de
  // plugins del propio CLI de Claude Code, la misma distincion que hace el
  // criterio de aceptacion 5 al hablar de "llamadas reales a agentes".
  // Se excluye solo el patron 'claude' y solo para este fichero: el resto
  // de patrones (fetch, http, anthropic/openai) siguen aplicando.
  const EXCEPCIONES_INVOCACION_CLAUDE = new Set(['core/plugin-instalado.ts']);

  async function ficherosTs(dir: string): Promise<string[]> {
    const salida: string[] = [];
    for (const entrada of await readdir(dir, { withFileTypes: true })) {
      const completo = path.join(dir, entrada.name);
      if (entrada.isDirectory()) salida.push(...(await ficherosTs(completo)));
      else if (entrada.name.endsWith('.ts')) salida.push(completo);
    }
    return salida;
  }

  const ficheros = await ficherosTs(path.join(PACKAGE_ROOT, 'src'));
  assert.ok(ficheros.length > 10, `precondicion: se esperaban muchos .ts, hay ${ficheros.length}`);

  for (const fichero of ficheros) {
    const relativo = path.relative(path.join(PACKAGE_ROOT, 'src'), fichero).split(path.sep).join('/');
    const contenido = await readFile(fichero, 'utf8');
    for (const { patron, que } of prohibidos) {
      const esExcepcion = patron.source === /['"`]claude['"`]/.source && EXCEPCIONES_INVOCACION_CLAUDE.has(relativo);
      assert.ok(
        esExcepcion || !patron.test(contenido),
        `${path.relative(PACKAGE_ROOT, fichero)} contiene ${que}: el CLI no puede llamar a ningun modelo`
      );
    }
  }
});
