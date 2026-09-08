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
} from '../../src/commands/plan.js';
import { ROLES_BRAINSTORM } from '../../src/core/roles-brainstorm.js';
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
const BODY = '## Objetivo\n\nProbar que el brainstorm se escribe entero.\n';

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
  test(`plan: complejidad "${complejidad}" escribe exactamente ${roles} peticion(es) de rol y una del unificador`, async () => {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await writeTareaFile(tareasRoot, sampleTask({ complejidad }), BODY);
      commitAll(repoRoot, 'tarea TASK-800');

      const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
        repoCwd: repoRoot,
      });

      assert.equal(result.roles.length, roles);
      assert.equal(result.ronda, 1);
      assert.equal(result.brainstormReutilizado, false);

      const esperados = ROLES_BRAINSTORM.slice(0, roles)
        .flatMap((r) => [`peticion-${r.id}-1.md`, `salida-${r.id}-1.md`])
        .concat(['peticion-unificador-1.md'])
        .sort();
      const enDisco = (await readdir(brainstormDir(result.filePath))).sort();
      assert.deepEqual(enDisco, esperados);
    });
  });
}

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

    const peticion = await readFile(result.peticionUnificador, 'utf8');
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

    const peticion = await readFile(result.peticionUnificador, 'utf8');
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
        // Convencion del proyecto: el error dice QUE HACER.
        assert.match(e.message, /Escribe el objetivo en/);
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
 * El simetrico, y no sobra: sin el, una puerta que abortara SIEMPRE
 * dejaria el test de arriba en verde. Ademas fija que el
 * comportamiento con 0 roles es identico al de antes de TASK-016, que
 * es lo que hace el cambio no-breaking.
 *
 * Mutacion que lo pone rojo: aplicar la puerta tambien cuando no hay
 * roles.
 */
test('plan: objetivo vacio SIN roles que lanzar no aborta (comportamiento de antes de TASK-016)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'trivial' }), '## Objetivo\n\n');
    commitAll(repoRoot, 'tarea TASK-800');

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
    assert.deepEqual(segunda.peticionesRol, []);

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

/**
 * Mutacion que lo pone rojo: numerar la ronda contando ficheros en vez
 * de buscando el maximo. Con un fichero borrado a mano, contar
 * reutilizaria un numero ya usado y pisaria la ronda anterior.
 */
test('plan: la ronda sale del mayor numero presente, no de cuantos ficheros hay', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
    const taskDir = path.join(tareasRoot, '00-planificadas', 'TASK-800');
    const dir = path.join(taskDir, PLANIFICACION_DIRNAME, BRAINSTORM_DIRNAME);
    await mkdir(dir, { recursive: true });
    // Solo queda el rastro de una ronda 4; las 1-3 se borraron.
    await writeFile(path.join(dir, 'peticion-unificador-4.md'), '# ronda 4\n', 'utf8');
    commitAll(repoRoot, 'tarea TASK-800 con historial parcial');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.equal(result.ronda, 5);
    const enDisco = await readdir(brainstormDir(result.filePath));
    assert.ok(enDisco.includes('peticion-unificador-5.md'));
    assert.ok(enDisco.includes('peticion-unificador-4.md'), 'se piso la ronda 4');
  });
});

// ─── el brainstorm viaja con la tarea ──────────────────────────────────

/**
 * Mutacion que lo pone rojo: escribir el brainstorm en la carpeta de
 * DESTINO (despues del move) o colgarlo de la raiz de la carpeta de
 * tarea en vez de de planificacion/. En los dos casos dejaria de
 * viajar con el rename o de entrar en el auto-commit.
 */
test('plan: brainstorm/ viaja con la tarea al cambiar de carpeta de estado', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'alta' }), BODY);
    commitAll(repoRoot, 'tarea TASK-800');

    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
      repoCwd: repoRoot,
    });

    assert.match(result.filePath, /01-en-diseno/);
    assert.equal((await readdir(brainstormDir(result.filePath))).length, 7);
    // Nada quedo atras en 00-planificadas.
    await assert.rejects(() => readdir(path.join(tareasRoot, '00-planificadas', 'TASK-800')));
    // Las rutas devueltas apuntan a ficheros que existen de verdad.
    for (const p of [...result.peticionesRol, result.peticionUnificador]) {
      await readFile(p, 'utf8');
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
    const contenido = await readFile(fichero, 'utf8');
    for (const { patron, que } of prohibidos) {
      assert.ok(
        !patron.test(contenido),
        `${path.relative(PACKAGE_ROOT, fichero)} contiene ${que}: el CLI no puede llamar a ningun modelo`
      );
    }
  }
});
