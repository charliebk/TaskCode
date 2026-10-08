/**
 * `taskctl doctor` (TASK-062). Repos Git temporales de verdad (plantilla con
 * main, develop y las cinco carpetas de tareas/), el CLI real por spawn para
 * el codigo de salida y el JSON, y el doble de gh/glab de la suite para la
 * sesion de plataforma. Nada de mocks de Git ni del filesystem.
 *
 * Lo que NO se puede probar aqui y se comprobo a mano en Windows (ver la
 * tarea): el bash de WSL en System32 delante en el PATH. En CI Linux el bash
 * es valido, asi que lo que si se prueba es el contrato de la sonda: un script
 * que falla, que no imprime la marca, o un PATH sin bash, dan error.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runDoctorCommand, envolver, DoctorCommandError } from '../../src/commands/doctor.js';
import type { Comprobacion } from '../../src/core/doctor.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { STATE_FOLDER, type Task } from '../../src/core/task.js';
import { git, commitAll, sampleTask } from '../helpers/finish-fixtures.js';
import { montarOrigin, URL_GITHUB, URL_GITLAB } from '../helpers/finish-origin.js';
import { plantillaRepo } from '../helpers/repo-plantilla.js';
import { conDoblePlataforma, sinPlataformasEnElPath } from '../helpers/plataforma-doble.js';

const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
const CARPETAS = Object.values(STATE_FOLDER);

/** Proyecto completo: main + develop, las cinco carpetas commiteadas, sin remotos, workspace limpio. */
const conRepo = plantillaRepo('taskctl-doctor-', async (repoRoot) => {
  git(['init', '-q', '-b', 'main'], repoRoot);
  git(['config', 'user.email', 'test@example.com'], repoRoot);
  git(['config', 'user.name', 'Test'], repoRoot);
  for (const c of CARPETAS) {
    await mkdir(path.join(repoRoot, 'tareas', c), { recursive: true });
    await writeFile(path.join(repoRoot, 'tareas', c, '.gitkeep'), '', 'utf8');
  }
  await writeFile(path.join(repoRoot, 'README.md'), '# proyecto\n', 'utf8');
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', 'inicial'], repoRoot);
  git(['checkout', '-q', '-b', 'develop'], repoRoot);
});

function doctor(repoRoot: string, opts: { timeoutPlataformaMs?: number; scriptsDir?: string } = {}) {
  return runDoctorCommand([], { repoCwd: repoRoot, ...opts });
}

function por(cs: readonly Comprobacion[], id: string): Comprobacion {
  const c = cs.find((x) => x.id === id);
  assert.ok(c, `no hay comprobacion "${id}"; hay: ${cs.map((x) => x.id).join(', ')}`);
  return c;
}

function niveles(cs: readonly Comprobacion[]): string {
  return cs.map((c) => `${c.id}=${c.nivel}`).join(' ');
}

async function tareaEn(
  repoRoot: string,
  carpeta: string,
  id: string,
  estado: Task['estado'],
  extra: Partial<Task> = {}
): Promise<void> {
  const task = sampleTask({ id, estado, rama: `feature/${id.toLowerCase()}-x`, ...extra });
  const dir = path.join(repoRoot, 'tareas', carpeta, id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'tarea.md'), serializeTareaFile(task, '## Objetivo\nx\n'), 'utf8');
}

async function config(repoRoot: string, texto: string): Promise<void> {
  await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
  await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), texto, 'utf8');
}

function cli(cwd: string, args: string[]) {
  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

// ---------------------------------------------------------------------
// Proyecto completo
// ---------------------------------------------------------------------

test('proyecto completo con origin: todo ok (la plataforma, omitida) y codigo 0', async () => {
  await conRepo(async (repoRoot) => {
    const origin = await montarOrigin(repoRoot, URL_GITHUB);
    try {
      await tareaEn(repoRoot, '02-en-curso', 'TASK-010', 'en-curso');
      await tareaEn(repoRoot, '00-planificadas', 'TASK-011', 'planificada');
      commitAll(repoRoot, 'tareas');
      const r = doctor(repoRoot);
      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
      for (const c of r.comprobaciones) {
        assert.ok(c.nivel === 'ok' || c.nivel === 'omitida', `${c.id} es ${c.nivel}: ${c.mensaje}`);
        assert.equal(c.arreglo, null, `${c.id} no deberia llevar arreglo`);
      }
      assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'omitida');
      assert.match(por(r.comprobaciones, 'tareas').mensaje, /^2 tareas/);
      for (const id of [
        'node',
        'git',
        'bash',
        'repo-git',
        'repo-commits',
        'tareas-carpetas',
        'rama-base',
        'rama-principal',
        'origin',
        'workspace',
        'config',
        'config-claves',
      ]) {
        assert.equal(por(r.comprobaciones, id).nivel, 'ok', id);
      }
      // Una linea por comprobacion (mas el resumen; sin arreglos porque todo esta bien).
      assert.equal(r.salida.trimEnd().split('\n').length, r.comprobaciones.length + 1);
    } finally {
      await origin.limpiar();
    }
  });
});

test('rama principal "master" tambien vale', async () => {
  await conRepo(async (repoRoot) => {
    git(['branch', '-m', 'main', 'master'], repoRoot);
    const r = doctor(repoRoot);
    assert.equal(por(r.comprobaciones, 'rama-principal').nivel, 'ok');
    assert.match(por(r.comprobaciones, 'rama-principal').mensaje, /"master"/);
  });
});

// ---------------------------------------------------------------------
// Repositorio
// ---------------------------------------------------------------------

test('sin tareas/: error con el mkdir exacto y la coherencia de tareas omitida', async () => {
  await conRepo(async (repoRoot) => {
    await rm(path.join(repoRoot, 'tareas'), { recursive: true, force: true });
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'sin tareas'], repoRoot);
    const r = doctor(repoRoot);
    const c = por(r.comprobaciones, 'tareas-carpetas');
    assert.equal(c.nivel, 'error');
    assert.equal(c.arreglo, `mkdir -p ${CARPETAS.map((x) => `tareas/${x}`).join(' ')}`);
    assert.equal(por(r.comprobaciones, 'tareas').nivel, 'omitida');
    assert.equal(r.codigo, 1);
  });
});

test('a tareas/ le falta una carpeta: error que nombra solo la que falta', async () => {
  await conRepo(async (repoRoot) => {
    await rm(path.join(repoRoot, 'tareas', '03-en-revision'), { recursive: true, force: true });
    const c = por(doctor(repoRoot).comprobaciones, 'tareas-carpetas');
    assert.equal(c.nivel, 'error');
    assert.match(c.mensaje, /03-en-revision/);
    assert.equal(c.arreglo, 'mkdir -p tareas/03-en-revision');
  });
});

test('sin develop: error con el comando que la crea desde la principal', async () => {
  await conRepo(async (repoRoot) => {
    git(['checkout', '-q', 'main'], repoRoot);
    git(['branch', '-D', 'develop'], repoRoot);
    const r = doctor(repoRoot);
    const c = por(r.comprobaciones, 'rama-base');
    assert.equal(c.nivel, 'error');
    assert.equal(c.arreglo, 'git branch develop main');
    assert.equal(r.codigo, 1);
  });
});

test('la rama base sigue a rama_base de la config', async () => {
  await conRepo(async (repoRoot) => {
    await config(repoRoot, 'rama_base: integracion\n');
    const c = por(doctor(repoRoot).comprobaciones, 'rama-base');
    assert.equal(c.nivel, 'error');
    assert.match(c.mensaje, /"integracion"/);
  });
});

test('sin main ni master: error en rama-principal', async () => {
  await conRepo(async (repoRoot) => {
    git(['branch', '-m', 'main', 'tronco'], repoRoot);
    const c = por(doctor(repoRoot).comprobaciones, 'rama-principal');
    assert.equal(c.nivel, 'error');
    assert.match(c.arreglo ?? '', /git branch main/);
  });
});

test('sin origin: aviso con el comando, y codigo 0', async () => {
  await conRepo(async (repoRoot) => {
    const r = doctor(repoRoot);
    const c = por(r.comprobaciones, 'origin');
    assert.equal(c.nivel, 'aviso');
    assert.match(c.arreglo ?? '', /^git remote add origin /);
    assert.equal(r.codigo, 0, niveles(r.comprobaciones));
  });
});

test('sin origin y con cierre_por_defecto: merge-request es error y el codigo, 1', async () => {
  await conRepo(async (repoRoot) => {
    await config(repoRoot, 'cierre_por_defecto: merge-request\n');
    const r = doctor(repoRoot);
    assert.equal(por(r.comprobaciones, 'origin').nivel, 'error');
    assert.match(por(r.comprobaciones, 'origin').mensaje, /merge-request/);
    assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'omitida');
    assert.equal(r.codigo, 1);
  });
});

test('workspace sucio: aviso (no cambia el codigo) con el paso concreto', async () => {
  await conRepo(async (repoRoot) => {
    await writeFile(path.join(repoRoot, 'README.md'), '# cambiado\n', 'utf8');
    await writeFile(path.join(repoRoot, 'nuevo.txt'), 'x\n', 'utf8');
    const r = doctor(repoRoot);
    const c = por(r.comprobaciones, 'workspace');
    assert.equal(c.nivel, 'aviso');
    assert.match(c.mensaje, /2 cambios/);
    assert.match(c.arreglo ?? '', /git status/);
    assert.equal(r.codigo, 0);
  });
});

test('repo sin commits: mensaje propio, ramas omitidas y codigo 1', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-vacio-'));
  try {
    git(['init', '-q', '-b', 'main'], dir);
    const r = doctor(dir);
    const c = por(r.comprobaciones, 'repo-commits');
    assert.equal(c.nivel, 'error');
    assert.match(c.mensaje, /ningun commit/);
    assert.match(c.arreglo ?? '', /git commit/);
    assert.equal(por(r.comprobaciones, 'rama-base').nivel, 'omitida');
    assert.equal(por(r.comprobaciones, 'rama-principal').nivel, 'omitida');
    assert.equal(r.codigo, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('un directorio que no es repo Git: error con el arreglo y el resto omitido', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-norepo-'));
  try {
    const r = doctor(dir);
    assert.equal(por(r.comprobaciones, 'repo-git').nivel, 'error');
    assert.match(por(r.comprobaciones, 'repo-git').arreglo ?? '', /git init/);
    for (const id of ['rama-base', 'origin', 'workspace']) assert.equal(por(r.comprobaciones, id).nivel, 'omitida', id);
    assert.equal(r.codigo, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('worktree enlazado (.git es un fichero): sigue siendo repo y todo ok', async () => {
  await conRepo(async (repoRoot) => {
    const wt = path.join(await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-wt-')), 'arbol');
    try {
      git(['worktree', 'add', '-q', '-b', 'wt-doctor', wt, 'develop'], repoRoot);
      const r = doctor(wt);
      assert.match(por(r.comprobaciones, 'repo-git').mensaje, /worktree/);
      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
    } finally {
      await rm(path.dirname(wt), { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------

test('config con un valor invalido: error con el mensaje del validador y codigo 1', async () => {
  await conRepo(async (repoRoot) => {
    await config(repoRoot, 'limite_wip: muchos\n');
    const r = doctor(repoRoot);
    const c = por(r.comprobaciones, 'config');
    assert.equal(c.nivel, 'error');
    assert.match(c.mensaje, /limite_wip/);
    assert.match(c.mensaje, /config\.yml:1/);
    assert.equal(por(r.comprobaciones, 'config-claves').nivel, 'omitida');
    assert.equal(r.codigo, 1);
  });
});

test('config con una clave desconocida: aviso (no error) que la nombra, codigo 0', async () => {
  await conRepo(async (repoRoot) => {
    await config(repoRoot, 'limite_wipp: 2\n');
    const r = doctor(repoRoot);
    assert.equal(por(r.comprobaciones, 'config').nivel, 'ok');
    const c = por(r.comprobaciones, 'config-claves');
    assert.equal(c.nivel, 'aviso');
    assert.match(c.mensaje, /limite_wipp/);
    assert.ok(c.arreglo !== null);
    assert.equal(r.codigo, 0, niveles(r.comprobaciones));
  });
});

test('doctor no escribe los avisos de la config en stderr (los da en su salida)', async () => {
  await conRepo(async (repoRoot) => {
    await config(repoRoot, 'clave_rara: 1\n');
    const r = cli(repoRoot, ['doctor']);
    assert.equal(r.stderr, '');
    assert.match(r.stdout, /config-claves: .*clave_rara/);
  });
});

// ---------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------

test('tarea en la carpeta equivocada: error con el ID y el comando que la mueve', async () => {
  await conRepo(async (repoRoot) => {
    await tareaEn(repoRoot, '00-planificadas', 'TASK-020', 'en-curso');
    const r = doctor(repoRoot);
    const c = por(r.comprobaciones, 'tarea:TASK-020:estado');
    assert.equal(c.nivel, 'error');
    assert.match(c.mensaje, /^TASK-020: .*00-planificadas.*en-curso/);
    assert.match(c.arreglo ?? '', /git mv tareas\/00-planificadas\/TASK-020 tareas\/02-en-curso\/TASK-020/);
    assert.equal(r.codigo, 1);
  });
});

test('mismo ID en dos carpetas: error de duplicado (lo que listTareasEnEstados salta)', async () => {
  await conRepo(async (repoRoot) => {
    await tareaEn(repoRoot, '00-planificadas', 'TASK-021', 'planificada');
    await tareaEn(repoRoot, '02-en-curso', 'TASK-021', 'en-curso');
    const r = doctor(repoRoot);
    const c = por(r.comprobaciones, 'tarea:TASK-021:duplicado');
    assert.equal(c.nivel, 'error');
    assert.match(c.mensaje, /TASK-021.*00-planificadas.*02-en-curso/);
    assert.equal(r.codigo, 1);
  });
});

test('tarea.md ilegible: error con la ruta y la causa', async () => {
  await conRepo(async (repoRoot) => {
    const dir = path.join(repoRoot, 'tareas', '02-en-curso', 'TASK-022');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'tarea.md'), 'esto no tiene frontmatter\n', 'utf8');
    const r = doctor(repoRoot);
    const c = por(r.comprobaciones, 'tarea:TASK-022:ilegible');
    assert.equal(c.nivel, 'error');
    assert.match(c.mensaje, /tareas\/02-en-curso\/TASK-022\/tarea\.md/);
    assert.match(c.mensaje, /no se puede leer ni validar \(.+\)/);
    assert.equal(r.codigo, 1);
  });
});

test('un tarea.md con campos invalidos tambien es error (con la causa del validador)', async () => {
  await conRepo(async (repoRoot) => {
    await tareaEn(repoRoot, '02-en-curso', 'TASK-023', 'en-curso');
    const f = path.join(repoRoot, 'tareas', '02-en-curso', 'TASK-023', 'tarea.md');
    await writeFile(f, (await readFile(f, 'utf8')).replace('tipo: feature', 'tipo: inventado'), 'utf8');
    const c = por(doctor(repoRoot).comprobaciones, 'tarea:TASK-023:ilegible');
    assert.equal(c.nivel, 'error');
    assert.match(c.mensaje, /tipo/);
  });
});

test('carpeta de tarea sin tarea.md: error con el ID', async () => {
  await conRepo(async (repoRoot) => {
    await mkdir(path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-024'), { recursive: true });
    const r = doctor(repoRoot);
    const c = por(r.comprobaciones, 'tarea:TASK-024:sin-tarea-md');
    assert.equal(c.nivel, 'error');
    assert.match(c.mensaje, /^TASK-024: .*no tiene tarea\.md/);
    assert.equal(r.codigo, 1);
  });
});

test('carpeta ajena a un ID (no TASK-NNN) se ignora', async () => {
  await conRepo(async (repoRoot) => {
    await mkdir(path.join(repoRoot, 'tareas', '00-planificadas', 'notas'), { recursive: true });
    const r = doctor(repoRoot);
    assert.equal(por(r.comprobaciones, 'tareas').nivel, 'ok');
  });
});

// ---------------------------------------------------------------------
// Solo lee
// ---------------------------------------------------------------------

test('solo lee: ni el indice, ni la rama, ni los commits cambian (git status no toma el lock)', async () => {
  await conRepo(async (repoRoot) => {
    // Un fichero con la fecha cambiada y el mismo contenido: un `git status`
    // normal refrescaria el indice y lo reescribiria; con GIT_OPTIONAL_LOCKS=0 no.
    const futuro = new Date(Date.now() + 3_600_000);
    await utimes(path.join(repoRoot, 'README.md'), futuro, futuro);
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'x\n', 'utf8');
    const indice = async () => (await readFile(path.join(repoRoot, '.git', 'index'))).toString('base64');
    const antes = await indice();
    doctor(repoRoot);
    assert.equal(await indice(), antes, 'doctor reescribio el indice de Git');
    const rama = git(['branch', '--show-current'], repoRoot);
    const head = git(['rev-parse', 'HEAD'], repoRoot);
    const ramas = git(['branch', '--list'], repoRoot);
    doctor(repoRoot);
    assert.equal(git(['branch', '--show-current'], repoRoot), rama);
    assert.equal(rama.trim(), 'develop');
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head);
    assert.equal(git(['branch', '--list'], repoRoot), ramas);
  });
});

// ---------------------------------------------------------------------
// Excepciones y flags
// ---------------------------------------------------------------------

test('envolver: una excepcion es un resultado error de esa comprobacion, sin credenciales', () => {
  const r = envolver('x', () => {
    throw new Error('boom en https://usuario:secreto@host.example/x');
  });
  assert.equal(r.length, 1);
  const c = r[0] as Comprobacion;
  assert.equal(c.id, 'x');
  assert.equal(c.nivel, 'error');
  assert.match(c.mensaje, /excepcion: boom/);
  assert.doesNotMatch(c.mensaje, /secreto/);
  assert.ok(c.arreglo !== null);
});

test('un directorio que no existe no lanza: devuelve errores y codigo 1', () => {
  const r = doctor(path.join(tmpdir(), 'taskctl-doctor-no-existe-jamas'));
  assert.equal(r.codigo, 1);
  assert.ok(r.comprobaciones.length >= 10);
});

test('flags desconocidos y argumentos sobrantes abortan', () => {
  assert.throws(
    () => runDoctorCommand(['--jsno'], { repoCwd: '.' }),
    (e: unknown) => e instanceof DoctorCommandError && /"--jsno"/.test(e.message) && /--json/.test(e.message)
  );
  assert.throws(() => runDoctorCommand(['--json=1'], { repoCwd: '.' }), DoctorCommandError);
  assert.throws(() => runDoctorCommand(['TASK-001'], { repoCwd: '.' }), /no admite argumentos/);
});

// ---------------------------------------------------------------------
// CLI: codigo de salida y JSON
// ---------------------------------------------------------------------

test('CLI --json: en stdout SOLO el JSON (una linea), stderr vacio, codigo 0 y estructura', async () => {
  await conRepo(async (repoRoot) => {
    const r = cli(repoRoot, ['doctor', '--json']);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.stderr, '');
    assert.equal(r.stdout.trimEnd().split('\n').length, 1);
    const j = JSON.parse(r.stdout) as { ok: boolean; errores: number; avisos: number; comprobaciones: Comprobacion[] };
    assert.equal(j.ok, true);
    assert.equal(j.errores, 0);
    assert.equal(j.avisos, 1); // sin origin
    assert.equal(por(j.comprobaciones, 'origin').nivel, 'aviso');
    for (const c of j.comprobaciones) {
      assert.deepEqual(Object.keys(c).sort(), ['arreglo', 'id', 'mensaje', 'nivel']);
    }
  });
});

test('CLI: con un error el codigo es 1 en texto y en --json, y el JSON sigue siendo valido', async () => {
  await conRepo(async (repoRoot) => {
    await config(repoRoot, 'limite_wip: 0\n');
    const t = cli(repoRoot, ['doctor']);
    assert.equal(t.status, 1);
    assert.match(t.stdout, /^\[ERROR\] +config: /m);
    assert.match(t.stdout, /Arreglo: /);
    const j = cli(repoRoot, ['doctor', '--json']);
    assert.equal(j.status, 1);
    assert.equal(j.stderr, '');
    const o = JSON.parse(j.stdout) as { ok: boolean; errores: number };
    assert.equal(o.ok, false);
    assert.equal(o.errores, 1);
  });
});

test('CLI: un flag desconocido sale con 1 y el mensaje en stderr', async () => {
  await conRepo(async (repoRoot) => {
    const r = cli(repoRoot, ['doctor', '--jsno']);
    assert.equal(r.status, 1);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, /flag desconocido "--jsno"/);
  });
});

test('CLI: --help lista doctor', async () => {
  await conRepo(async (repoRoot) => {
    assert.match(cli(repoRoot, ['--help']).stdout, /taskctl doctor \[--json\]/);
  });
});

// ---------------------------------------------------------------------
// bash: el contrato de la sonda
// ---------------------------------------------------------------------

async function conSonda(contenido: string, fn: (scriptsDir: string) => void): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-sonda-'));
  try {
    await writeFile(path.join(dir, '_sonda-bash.sh'), contenido, 'utf8');
    fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('bash: un script de prueba que falla (comando no encontrado) es error con el arreglo', async () => {
  await conRepo(async (repoRoot) => {
    await conSonda('#!/usr/bin/env bash\nherramienta_que_no_existe_taskctl\n', (scriptsDir) => {
      const r = doctor(repoRoot, { scriptsDir });
      const c = por(r.comprobaciones, 'bash');
      assert.equal(c.nivel, 'error');
      assert.match(c.mensaje, /no pudo ejecutar el script de prueba/);
      assert.match(c.mensaje, /codigo 127/);
      assert.ok((c.arreglo ?? '').length > 20);
      assert.equal(r.codigo, 1);
    });
  });
});

test('bash: salir con 0 no basta, hace falta la marca de la sonda en stdout', async () => {
  await conRepo(async (repoRoot) => {
    await conSonda('#!/usr/bin/env bash\nexit 0\n', (scriptsDir) => {
      assert.equal(por(doctor(repoRoot, { scriptsDir }).comprobaciones, 'bash').nivel, 'error');
    });
  });
});

test('bash: la marca sin codigo de salida 0 tampoco vale', async () => {
  await conRepo(async (repoRoot) => {
    await conSonda('#!/usr/bin/env bash\necho "taskctl-sonda-ok"\nexit 3\n', (scriptsDir) => {
      assert.equal(por(doctor(repoRoot, { scriptsDir }).comprobaciones, 'bash').nivel, 'error');
    });
  });
});

test('bash: sin bash en el PATH es error ("no se pudo lanzar")', async () => {
  await conRepo(async (repoRoot) => {
    const vacio = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-pathvacio-'));
    const guardado = process.env['PATH'];
    try {
      process.env['PATH'] = vacio;
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'bash');
      assert.equal(c.nivel, 'error');
      assert.match(c.mensaje, /no se pudo lanzar "bash"/);
      assert.equal(r.codigo, 1);
    } finally {
      process.env['PATH'] = guardado;
      await rm(vacio, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------
// Plataforma (con el doble de gh/glab)
// ---------------------------------------------------------------------

async function conRepoYOrigin(url: string, cfg: string, fn: (repoRoot: string) => Promise<void>): Promise<void> {
  await conRepo(async (repoRoot) => {
    const origin = await montarOrigin(repoRoot, url);
    try {
      await config(repoRoot, cfg);
      commitAll(repoRoot, 'config');
      await fn(repoRoot);
    } finally {
      await origin.limpiar();
    }
  });
}

test('plataforma: merge-request por defecto con sesion: ok, y solo se llamo a "auth status"', async () => {
  await conRepoYOrigin(URL_GITHUB, 'cierre_por_defecto: merge-request\n', async (repoRoot) => {
    await conDoblePlataforma({ prs: [] }, async (dbl) => {
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'plataforma');
      assert.equal(c.nivel, 'ok', c.mensaje);
      assert.match(c.mensaje, /"gh".*github\.com/);
      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
      assert.deepEqual(dbl.leer().llamadas, [['gh', 'auth', 'status', '--hostname', 'github.com']]);
    });
  });
});

test('plataforma: declarada con GitLab, la sesion se comprueba con glab api user bajo su GITLAB_HOST', async () => {
  await conRepoYOrigin(URL_GITLAB, 'plataforma_remota: gitlab\n', async (repoRoot) => {
    await conDoblePlataforma({ prs: [] }, async (dbl) => {
      const r = doctor(repoRoot);
      assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'ok', por(r.comprobaciones, 'plataforma').mensaje);
      const reg = dbl.registro();
      assert.equal(reg.length, 1);
      assert.deepEqual(reg[0]?.llamada, ['glab', 'api', 'user']);
      assert.equal(reg[0]?.entorno['GITLAB_HOST'], 'https://gitlab.example.com');
    });
  });
});

test('plataforma: sesion rechazada (confirmada) es error con el comando que la abre', async () => {
  await conRepoYOrigin(URL_GITHUB, 'cierre_por_defecto: merge-request\n', async (repoRoot) => {
    await conDoblePlataforma({ auth: false, prs: [] }, async () => {
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'plataforma');
      assert.equal(c.nivel, 'error');
      assert.match(c.mensaje, /no esta autenticado/);
      assert.match(c.arreglo ?? '', /gh auth login/);
      assert.equal(r.codigo, 1);
    });
  });
});

test('plataforma: gh/glab no instalado es error con la instalacion', async () => {
  await conRepoYOrigin(URL_GITHUB, 'cierre_por_defecto: merge-request\n', async (repoRoot) => {
    await sinPlataformasEnElPath(async () => {
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'plataforma');
      assert.equal(c.nivel, 'error');
      assert.match(c.mensaje, /no se pudo ejecutar "gh"/);
      assert.match(c.arreglo ?? '', /cli\.github\.com/);
      assert.equal(r.codigo, 1);
    });
  });
});

test('plataforma: sin respuesta a tiempo (timeout propio) es aviso, no error, y no cuelga doctor', async () => {
  await conRepoYOrigin(URL_GITHUB, 'cierre_por_defecto: merge-request\n', async (repoRoot) => {
    await conDoblePlataforma({ colgar: true, prs: [] }, async () => {
      const t0 = Date.now();
      const r = doctor(repoRoot, { timeoutPlataformaMs: 1500 });
      assert.ok(Date.now() - t0 < 20_000, 'doctor tardo mas de lo que permite su timeout');
      const c = por(r.comprobaciones, 'plataforma');
      assert.equal(c.nivel, 'aviso', c.mensaje);
      assert.match(c.mensaje, /no se pudo verificar/);
      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
    });
  });
});

test('plataforma: instancia inalcanzable (fallo de red, no de sesion) es aviso y no filtra la URL con credenciales', async () => {
  await conRepoYOrigin(URL_GITLAB, 'plataforma_remota: gitlab\n', async (repoRoot) => {
    // Origin con credenciales incrustadas, como la deja a veces un clon con token.
    git(['config', 'remote.origin.url', 'https://usuario:secreto@gitlab.example.com/acme/repo.git'], repoRoot);
    await conDoblePlataforma({ inalcanzable: true, prs: [] }, async () => {
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'plataforma');
      assert.equal(c.nivel, 'aviso', c.mensaje);
      assert.equal(r.codigo, 0);
      const json = runDoctorCommand(['--json'], { repoCwd: repoRoot }).salida;
      for (const salida of [r.salida, json]) assert.doesNotMatch(salida, /secreto|usuario:/);
    });
  });
});

test('plataforma: sin merge request ni plataforma declarada es omitida y no llama a gh ni glab', async () => {
  await conRepo(async (repoRoot) => {
    await conDoblePlataforma({ prs: [] }, async (dbl) => {
      const r = doctor(repoRoot);
      assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'omitida');
      assert.deepEqual(dbl.leer().llamadas, []);
    });
  });
});
