/**
 * Test de integracion real (no mocks) para taskctl review (TASK-013):
 * repos Git temporales de verdad, los scripts update-*.sh tal cual
 * estan en el repo, y evidencia leida de Git (rama activa, merge
 * commits, ancestria) en vez de fiarse de lo que devuelve el comando.
 * Mismo espiritu que start.test.ts (TASK-009).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-600',
    titulo: 'Tarea de prueba de review',
    tipo: 'feature',
    sprint: 2,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-curso',
    plan_aprobado: true,
    rama: 'feature/task-600-prueba-review',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-05',
    actualizado: '2026-09-05',
    dependencias: [],
    ...overrides,
  };
}

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

/**
 * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
 * lo que el mismo escribe, asi que llamar a esto justo despues de un
 * comando puede no tener ya nada que registrar: `git commit` sale 1
 * con "nothing to commit" y el assert de `git()` lo daria por fallo
 * del test. Se commitea solo si queda algo — y que no quede es
 * exactamente la senal de que el auto-commit hizo su trabajo.
 */
function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
  git(['commit', '-q', '-m', message], repoRoot);
}

async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-review-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot, path.join(repoRoot, 'tareas'));
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/**
 * Deja la tarea en-curso en su rama, como la habria dejado "taskctl
 * start": rama creada desde develop, tarea.md commiteado en
 * 02-en-curso/, y un commit de trabajo propio de la rama.
 */
async function setupTaskEnCurso(repoRoot: string, tareasRoot: string, task: Task): Promise<void> {
  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar review.\n');
  await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo de la tarea\n', 'utf8');
  commitAll(repoRoot, `feat(${task.id}): trabajo de la tarea`);
}

/** Avanza develop con un cambio y vuelve a la rama indicada. */
async function advanceDevelop(repoRoot: string, volverA: string): Promise<void> {
  git(['checkout', '-q', 'develop'], repoRoot);
  await writeFile(path.join(repoRoot, 'cambio-develop.txt'), 'cambio en develop\n', 'utf8');
  commitAll(repoRoot, 'cambio en develop');
  git(['checkout', '-q', volverA], repoRoot);
}

/**
 * Escribe un fichero bajo `repoRoot/ruta` (con "/" de Git), creando los
 * directorios que hagan falta. Para las pruebas de clasificacion por
 * dominio (TASK-018): las rutas se eligen IGUAL que las de
 * test/skills/revisores.test.ts (RUTAS_LEGITIMAS/RUTAS_AJENAS), para no
 * inventar una segunda tabla de "que ruta cae en que dominio" que pueda
 * divergir de la que ese fichero ya prueba contra las skills reales.
 */
async function escribirFichero(repoRoot: string, ruta: string, contenido: string): Promise<void> {
  const destino = path.join(repoRoot, ...ruta.split('/'));
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, contenido, 'utf8');
}

/**
 * Ruta (con "/" de Git) de tarea.md tal como queda en la rama de una
 * tarea en-curso. A diferencia de setupTaskEnCurso, esta variante NO
 * anade "trabajo.txt": las pruebas de clasificacion por dominio
 * (TASK-018) necesitan controlar EXACTAMENTE que ficheros trae el diff,
 * y tarea.md es el UNICO que no se puede evitar (toda tarea necesita su
 * frontmatter commiteado en la rama para que el resto del ciclo
 * funcione) — se deja como el unico "ruido" de fondo, documentado en
 * cada test que lo necesita.
 */
function rutaTareaMd(id: string): string {
  return `tareas/02-en-curso/${id}/tarea.md`;
}

/** Como setupTaskEnCurso, pero sin escribir "trabajo.txt". */
async function setupTaskEnCursoSoloTarea(
  repoRoot: string,
  tareasRoot: string,
  task: Task
): Promise<void> {
  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el enrutado por dominio.\n');
  commitAll(repoRoot, `feat(${task.id}): trabajo de la tarea`);
}

test('taskctl review: camino feliz sin origin — update real, evidencia de merge, mueve a 03-en-revision y genera peticion + informe', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.id, 'TASK-600');
    assert.equal(result.baseBranch, 'develop');
    assert.equal(result.ronda, 1);
    assert.match(result.filePath, /03-en-revision[/\\]TASK-600[/\\]tarea\.md$/);

    // Evidencia real de Git, no solo el valor devuelto.
    const branch = git(['branch', '--show-current'], repoRoot).trim();
    assert.equal(branch, task.rama);
    const log = git(['log', '--oneline'], repoRoot);
    assert.match(log, /update\(feature\): develop -> feature\/task-600-prueba-review/);
    const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', 'develop', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(ancestor.status, 0, 'develop deberia ser antepasado de HEAD tras el update');

    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-revision');
    assert.equal(read?.task.actualizado, '2026-09-06');
    // ultimo_commit_revisado NO se toca al generar la peticion (16.3:
    // se actualiza cuando la revision TERMINA, no cuando empieza).
    assert.equal(read?.task.ultimo_commit_revisado, null);
    await assert.rejects(() => stat(path.join(tareasRoot, '02-en-curso', 'TASK-600')));

    // La peticion contiene el diff real (el cambio que vino de develop
    // y el trabajo de la rama) y el SHA revisado.
    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
    assert.doesNotMatch(peticion, /cambio-develop\.txt/);
    assert.match(peticion, /trabajo\.txt/);
    assert.ok(peticion.includes(result.commitRevisado));
    // Desde TASK-030 (item C2), "review" commitea la peticion y el
    // scaffold del informe, asi que HEAD avanza DESPUES de calcular
    // commitRevisado: el commit revisado es el padre de HEAD, no HEAD.
    // Y es lo correcto, no un efecto colateral: lo que el revisor tiene
    // que revisar es el codigo de la tarea, no el commit que contiene
    // la peticion de revision de si mismo.
    assert.equal(result.commitRevisado, git(['rev-parse', 'HEAD~1'], repoRoot).trim());
    assert.equal(
      git(['log', '--format=%s', '-1'], repoRoot).trim(),
      'chore(TASK-600): peticion de revision ronda 1'
    );

    const informe = await readFile(result.informes[0]!.informePath, 'utf8');
    assert.match(informe, /Informe de revision — TASK-600 \(ronda 1\)/);
    assert.match(informe, /PENDIENTE/);
  });
});

test('taskctl review: con origin (bare real) integra un cambio que solo existia en el remoto', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await mkdtemp(path.join(tmpdir(), 'taskctl-review-origin-'));
    const otherClone = await mkdtemp(path.join(tmpdir(), 'taskctl-review-clone-'));
    try {
      git(['init', '-q', '--bare', origin], origin);
      git(['remote', 'add', 'origin', origin], repoRoot);
      git(['push', '-q', 'origin', 'main', 'develop'], repoRoot);

      const task = sampleTask({ id: 'TASK-601', rama: 'feature/task-601-con-origin' });
      await setupTaskEnCurso(repoRoot, tareasRoot, task);

      // Otro colaborador avanza develop directamente en el remoto.
      git(['clone', '-q', '--branch', 'develop', origin, 'clon'], otherClone);
      const clonDir = path.join(otherClone, 'clon');
      git(['config', 'user.email', 'otro@example.com'], clonDir);
      git(['config', 'user.name', 'Otro'], clonDir);
      await writeFile(path.join(clonDir, 'remoto.txt'), 'cambio remoto\n', 'utf8');
      git(['add', '-A'], clonDir);
      git(['commit', '-q', '-m', 'cambio remoto en develop'], clonDir);
      git(['push', '-q', 'origin', 'develop'], clonDir);

      const result = await runReviewCommand(tareasRoot, ['TASK-601'], '2026-09-06', {
        repoCwd: repoRoot,
        scriptsDir: SCRIPTS_DIR,
      });

      // El cambio que SOLO existia en origin/develop llego a la rama.
      await stat(path.join(repoRoot, 'remoto.txt'));
      const log = git(['log', '--oneline'], repoRoot);
      assert.match(log, /update\(feature\): develop -> feature\/task-601-con-origin/);
      const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
      assert.doesNotMatch(peticion, /remoto\.txt/);
      const read = await readTareaFile(tareasRoot, 'TASK-601');
      assert.equal(read?.task.estado, 'en-revision');
    } finally {
      await rm(origin, { recursive: true, force: true });
      await rm(otherClone, { recursive: true, force: true });
    }
  });
});

test('taskctl review: rechaza una tarea que no esta en-curso, sin tocar Git ni carpetas', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ estado: 'en-diseno', plan_aprobado: true });
    await writeTareaFile(tareasRoot, task, '');
    commitAll(repoRoot, 'tarea en diseno');

    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof StateMachineError);
        assert.match((e as Error).message, /taskctl start/);
        return true;
      }
    );

    // Nada se movio ni se creo: sin 03-en-revision, sin revision/.
    const branch = git(['branch', '--show-current'], repoRoot).trim();
    assert.equal(branch, 'develop');
    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision')));
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-600', 'revision')));
    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl review: rechaza con el workspace sucio, sin invocar el script', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear\n', 'utf8');

    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      ReviewCommandError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-curso');
    // El update no llego a ejecutarse: develop no esta mergeada.
    const log = git(['log', '--oneline'], repoRoot);
    assert.doesNotMatch(log, /update\(feature\)/);
  });
});

test('taskctl review: si el script falla (conflicto de merge real), no mueve la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    // Conflicto real: la rama y develop cambian la MISMA linea del README.
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    await writeFile(path.join(repoRoot, 'README.md'), '# version de la rama\n', 'utf8');
    commitAll(repoRoot, 'cambio en la rama');
    git(['checkout', '-q', 'develop'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# version de develop\n', 'utf8');
    commitAll(repoRoot, 'cambio en develop');
    git(['checkout', '-q', task.rama], repoRoot);

    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof ReviewCommandError);
        assert.match((e as Error).message, /conflicto/);
        return true;
      }
    );

    // La tarea sigue en-curso y sin revision/ — el conflicto queda en
    // el workspace para resolver a mano (comportamiento del script).
    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-curso');
    await assert.rejects(() => stat(path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision')));
  });
});

test('taskctl review: script con exit 0 que NO mergea la base -> evidencia lo detecta y no mueve nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    await advanceDevelop(repoRoot, task.rama);

    const fakeScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-fake-update-'));
    await writeFile(
      path.join(fakeScriptsDir, 'update-feature.sh'),
      '#!/usr/bin/env bash\nexit 0\n',
      'utf8'
    );

    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: fakeScriptsDir,
        }),
      (e: unknown) => {
        assert.ok(e instanceof ReviewCommandError);
        assert.match((e as Error).message, /is-ancestor/);
        return true;
      }
    );

    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-curso');
    await rm(fakeScriptsDir, { recursive: true, force: true });
  });
});

test('taskctl review: una segunda ronda numera peticion e informe como -2 sin pisar la ronda anterior', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    // Restos commiteados de una ronda anterior (como los dejaria un
    // ciclo review -> cambios-solicitados -> vuelta a en-curso).
    const revisionDir = path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(path.join(revisionDir, 'peticion-revision-1.md'), 'ronda anterior\n', 'utf8');
    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), 'informe anterior\n', 'utf8');
    commitAll(repoRoot, 'restos de la ronda 1');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.ronda, 2);
    assert.match(result.informes[0]!.peticionPath, /peticion-revision-2\.md$/);
    // La ronda anterior sigue intacta (se movio con la carpeta).
    const anterior = await readFile(
      path.join(tareasRoot, '03-en-revision', 'TASK-600', 'revision', 'peticion-revision-1.md'),
      'utf8'
    );
    // Normalizado: el fichero pasa por un checkout de Git durante el
    // update y con core.autocrlf=true puede volver con CRLF.
    assert.equal(anterior.split('\r\n').join('\n'), 'ronda anterior\n');
  });
});

test('taskctl review: un diff mayor que 1 MB no revienta el comando (hallazgo IMPORTANTE de revision: ENOBUFS)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    // ~1.8 MB de contenido nuevo: por encima del maxBuffer default de
    // spawnSync (1 MB), que era lo que mataba a git con ENOBUFS.
    const lineas = Array.from({ length: 60_000 }, (_, i) => `linea generada numero ${i}`);
    await writeFile(path.join(repoRoot, 'generado-grande.txt'), lineas.join('\n') + '\n', 'utf8');
    commitAll(repoRoot, 'fichero grande en la rama');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
    assert.match(peticion, /generado-grande\.txt/);
    assert.ok(peticion.length > 1024 * 1024, 'la peticion deberia contener el diff completo');
  });
});

test('taskctl review: si el movimiento de carpeta falla, la tarea sigue en-curso y la peticion ya escrita permite reintentar (hallazgo IMPORTANTE de revision: orden escritura-antes-de-mover)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    await advanceDevelop(repoRoot, task.rama);
    // Fuerza el fallo del rename: la carpeta de destino ya existe
    // (TaskFolderConflictError, fail-closed de moveTareaFile).
    await mkdir(path.join(tareasRoot, '03-en-revision', 'TASK-600'), { recursive: true });

    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => (e as Error).name === 'TaskFolderConflictError'
    );

    // La tarea NO cambio de estado (sin callejon sin salida), y la
    // peticion quedo escrita en la carpeta actual: un reintento tras
    // limpiar el conflicto usa la ronda siguiente sin pisar nada.
    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-curso');
    await stat(path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision', 'peticion-revision-1.md'));
  });
});

test('taskctl review: un diff cuyo contexto contiene vallas de backticks no rompe la peticion (hallazgo MENOR de revision)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    // El caso peligroso son las lineas de CONTEXTO del diff (prefijo
    // espacio, tolerado por CommonMark como sangria de cierre): el doc
    // con vallas de 4 backticks vive en develop y la rama modifica una
    // linea adyacente para que las vallas salgan como contexto del hunk.
    // Las lineas anadidas (+) no pueden cerrar una valla: un fichero
    // nuevo no reproduce el bug.
    const conVallas = 'texto\n' + '````\n' + 'bloque con valla de cuatro\n' + '````\n';
    await writeFile(path.join(repoRoot, 'doc-con-vallas.md'), conVallas, 'utf8');
    commitAll(repoRoot, 'doc con vallas en develop');
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    await writeFile(
      path.join(repoRoot, 'doc-con-vallas.md'),
      'texto modificado\n' + conVallas.slice('texto\n'.length),
      'utf8'
    );
    commitAll(repoRoot, 'la rama modifica la linea adyacente a las vallas');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // La valla elegida supera a la mas larga del contenido embebido:
    // el bloque del diff no puede cerrarse antes de tiempo.
    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
    assert.match(peticion, /`````diff/);
  });
});

// --- TASK-018: enrutado de revisor por diff real, fragmentado por dominio ---
//
// Las rutas de fichero de estos tests se copian EXACTAMENTE de las tablas
// RUTAS_LEGITIMAS/RUTAS_AJENAS de test/skills/revisores.test.ts: esas ya
// prueban a que revisor (o a ninguno) llega cada ruta contra las skills
// reales instaladas con el plugin. Repetir aqui esa clasificacion con
// rutas propias abriria una segunda fuente de verdad que podria divergir
// de la primera; reusar las mismas rutas cierra esa grieta.

test('taskctl review: un diff que toca 1 dominio (java) genera 1 peticion con el agente de ese dominio, no task.agente_revisor', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-620', rama: 'feature/task-620-un-dominio' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    await escribirFichero(
      repoRoot,
      'src/main/java/com/acme/UserService.java',
      'class UserService {}\n'
    );
    commitAll(repoRoot, 'anade servicio Java');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-620'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // Expectativa cambiada en TASK-034: tarea.md esta en el diff (toda
    // tarea lo commitea en su rama), pero tareas/** ya no se embebe ni se
    // clasifica (excluir_de_revision por defecto). Antes le tocaba al
    // generico una peticion entera solo para tarea.md; ahora no se lanza:
    // un agente revisor menos por tarea de un solo dominio.
    assert.equal(result.informes.length, 1);
    const grupo = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
    assert.ok(grupo !== undefined, 'deberia haber un grupo para java-spring-reviewer');
    assert.notEqual(grupo.revisor, task.agente_revisor);
    assert.match(grupo.peticionPath, /peticion-revision-1-java-spring-reviewer\.md$/);
    assert.match(grupo.informePath, /informe-revision-1-java-spring-reviewer\.md$/);
    assert.deepEqual(grupo.ficheros, ['src/main/java/com/acme/UserService.java']);

    const peticion = await readFile(grupo.peticionPath, 'utf8');
    // TASK-047: agente y skill por separado, y el modelo de la tarea.
    assert.match(peticion, /Skill revisora a cargar: java-spring-reviewer/);
    assert.ok(
      peticion.includes(`Agente a lanzar: ${task.agente_revisor} (modelo sugerido: ${task.modelo_sugerido})`),
      peticion
    );
    assert.equal(result.agente, task.agente_revisor);
    assert.equal(result.modelo, task.modelo_sugerido);
    assert.match(peticion, /UserService\.java/);
    // Desde TASK-034 tarea.md aparece en el --stat de excluidos, pero su
    // diff no se embebe.
    assert.doesNotMatch(peticion, /diff --git a\/tareas\//);

    assert.equal(
      result.informes.find((g) => g.revisor === 'code-quality-reviewer'),
      undefined,
      'tarea.md solo ya no genera una peticion al generico (TASK-034)'
    );
  });
});

test('taskctl review: un diff que toca 2 dominios bajo el umbral genera 2 peticiones, cada una solo con los ficheros de su dominio', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-621', rama: 'feature/task-621-dos-dominios' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    await escribirFichero(
      repoRoot,
      'src/main/java/com/acme/UserService.java',
      'class UserService {}\n'
    );
    await escribirFichero(
      repoRoot,
      'src/app/user-profile/user-profile.component.ts',
      'export class UserProfileComponent {}\n'
    );
    commitAll(repoRoot, 'anade servicio Java y componente Angular');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-621'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // 2 grupos de dominio. Desde TASK-034 ya no hay un tercero para
    // tarea.md: tareas/** se excluye del diff y de la clasificacion.
    assert.equal(result.informes.length, 2);
    const revisores = result.informes.map((g) => g.revisor).sort();
    assert.deepEqual(revisores, ['angular-vue-reviewer', 'java-spring-reviewer']);

    const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
    const grupoAngular = result.informes.find((g) => g.revisor === 'angular-vue-reviewer')!;

    assert.deepEqual(grupoJava.ficheros, ['src/main/java/com/acme/UserService.java']);
    assert.deepEqual(grupoAngular.ficheros, ['src/app/user-profile/user-profile.component.ts']);

    const peticionJava = await readFile(grupoJava.peticionPath, 'utf8');
    assert.match(peticionJava, /UserService\.java/);
    assert.doesNotMatch(peticionJava, /user-profile\.component\.ts/);

    const peticionAngular = await readFile(grupoAngular.peticionPath, 'utf8');
    assert.match(peticionAngular, /user-profile\.component\.ts/);
    assert.doesNotMatch(peticionAngular, /UserService\.java/);
  });
});

test('taskctl review: un diff que toca EXACTAMENTE 3 dominios sigue fragmentando en 3 (umbral inclusive)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-622', rama: 'feature/task-622-tres-dominios' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    await escribirFichero(
      repoRoot,
      'src/main/java/com/acme/UserService.java',
      'class UserService {}\n'
    );
    await escribirFichero(
      repoRoot,
      'src/app/user-profile/user-profile.component.ts',
      'export class UserProfileComponent {}\n'
    );
    await escribirFichero(repoRoot, 'src/Exporter/IfcExporter.cs', 'class IfcExporter {}\n');
    commitAll(repoRoot, 'toca los tres dominios de una vez');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-622'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // Con el catalogo real (3 revisores de dominio, umbral_dominios: 3),
    // exactamente 3 dominios SIGUE fragmentando: no cae al generico. Los
    // 3 dominios detectados (lo que fija el criterio del umbral). Desde
    // TASK-034 sin generico para tarea.md: tareas/** ya no se clasifica.
    assert.equal(result.informes.length, 3);
    const revisores = result.informes.map((g) => g.revisor).sort();
    assert.deepEqual(revisores, [
      'angular-vue-reviewer',
      'csharp-autocad-ifc-reviewer',
      'java-spring-reviewer',
    ]);
  });
});

test('taskctl review: ficheros que no casan ningun dominio, con 1-3 dominios ya detectados, los cubre TAMBIEN el generico', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-623', rama: 'feature/task-623-mas-generico' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    await escribirFichero(
      repoRoot,
      'src/main/java/com/acme/UserService.java',
      'class UserService {}\n'
    );
    // Ruta ajena congelada en RUTAS_AJENAS (revisores.test.ts): no casa
    // con ningun revisor de dominio. Desde TASK-034 es el UNICO fichero
    // del generico: tarea.md ya no se clasifica.
    await escribirFichero(repoRoot, 'src/index.ts', 'export const arranque = 1;\n');
    commitAll(repoRoot, 'servicio Java mas un fichero sin dominio');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-623'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.informes.length, 2);
    const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer');
    const grupoGenerico = result.informes.find((g) => g.revisor === 'code-quality-reviewer');
    assert.ok(grupoJava !== undefined, 'el fichero Java deberia tener su propio grupo');
    assert.ok(
      grupoGenerico !== undefined,
      'los ficheros sin dominio (src/index.ts) deberia cubrirlos el generico, sin quedar sin revisor'
    );
    assert.deepEqual(grupoJava!.ficheros, ['src/main/java/com/acme/UserService.java']);
    assert.deepEqual([...grupoGenerico!.ficheros], ['src/index.ts']);

    const peticionGenerico = await readFile(grupoGenerico!.peticionPath, 'utf8');
    assert.match(peticionGenerico, /src\/index\.ts/);
    assert.doesNotMatch(peticionGenerico, /UserService\.java/);
  });
});

test('taskctl review: un diff sin match de dominio (rutas ajenas y .md) sigue cayendo a un unico generico, igual que antes de TASK-018', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-624', rama: 'feature/task-624-sin-dominio' });
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    // NestJS: ruta congelada como ajena en RUTAS_AJENAS.
    await escribirFichero(repoRoot, 'src/users/users.module.ts', 'export class UsersModule {}\n');
    await escribirFichero(repoRoot, 'docs/nota.md', '# nota\n');
    commitAll(repoRoot, 'ficheros sin ningun dominio');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-624'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.informes.length, 1);
    assert.equal(result.informes[0]!.revisor, 'code-quality-reviewer');
    // Sin sufijo de dominio: la convencion de siempre, sin fragmentar.
    assert.match(result.informes[0]!.peticionPath, /peticion-revision-1\.md$/);
    assert.match(result.informes[0]!.informePath, /informe-revision-1\.md$/);
  });
});

test('taskctl review: una segunda ronda numera -2 CON sufijo de dominio tras una ronda 1 fragmentada (hallazgo IMPORTANTE-1 de revision, TASK-018)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-625', rama: 'feature/task-625-segunda-ronda-fragmentada' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    // Restos commiteados de una ronda 1 YA fragmentada por dominio (dos
    // revisores, cada uno con su sufijo) — el mismo escenario que dejaria
    // un ciclo review -> cambios-solicitados -> correccion -> review otra
    // vez. Antes de esta tarea, RONDA_FILE_RE no reconocia estos nombres
    // con sufijo y una regresion aqui no la detecta ningun otro test de
    // la suite (informe de revision, IMPORTANTE-1).
    const revisionDir = path.join(tareasRoot, '02-en-curso', 'TASK-625', 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(
      path.join(revisionDir, 'peticion-revision-1-java-spring-reviewer.md'),
      'ronda 1, java\n',
      'utf8'
    );
    await writeFile(
      path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'),
      '- Veredicto: cambios-solicitados\n',
      'utf8'
    );
    await writeFile(
      path.join(revisionDir, 'peticion-revision-1-code-quality-reviewer.md'),
      'ronda 1, generico\n',
      'utf8'
    );
    await writeFile(
      path.join(revisionDir, 'informe-revision-1-code-quality-reviewer.md'),
      '- Veredicto: aprobada\n',
      'utf8'
    );
    commitAll(repoRoot, 'restos de la ronda 1 fragmentada');
    await escribirFichero(
      repoRoot,
      'src/main/java/com/acme/UserService.java',
      'class UserService {} // correccion de la ronda 1\n'
    );
    commitAll(repoRoot, 'correccion pedida en la ronda 1');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-625'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // La ronda siguiente es la 2, no la 1: siguienteRonda tuvo que
    // reconocer los nombres CON sufijo de la ronda 1 para no pisarlos.
    assert.equal(result.ronda, 2);
    assert.ok(result.informes.length >= 1);
    for (const grupo of result.informes) {
      assert.match(grupo.peticionPath, /-revision-2(-[a-z0-9-]+)?\.md$/);
      assert.match(grupo.informePath, /-revision-2(-[a-z0-9-]+)?\.md$/);
    }
    // La ronda 1 fragmentada sigue intacta, sin que la ronda 2 la pise.
    await stat(
      path.join(
        tareasRoot,
        '03-en-revision',
        'TASK-625',
        'revision',
        'informe-revision-1-java-spring-reviewer.md'
      )
    );
  });
});

test('taskctl review: error claro si falta el ID o la tarea no existe', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runReviewCommand(tareasRoot, [], '2026-09-06', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      ReviewCommandError
    );
    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-999'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      StateMachineError
    );
  });
});
