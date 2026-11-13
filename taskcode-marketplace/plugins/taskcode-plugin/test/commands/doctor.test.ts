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
import {
  runDoctorCommand,
  envolver,
  DoctorCommandError,
  comprobarVerificacion,
  contarTerminadas,
} from '../../src/commands/doctor.js';
import { parsearConfig } from '../../src/core/config.js';
import type { Comprobacion } from '../../src/core/doctor.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { STATE_FOLDER, type Task } from '../../src/core/task.js';
import { git, commitAll, sampleTask } from '../helpers/finish-fixtures.js';
import { montarOrigin, URL_GITHUB, URL_GITLAB } from '../helpers/finish-origin.js';
import { plantillaRepo } from '../helpers/repo-plantilla.js';
import { conDoblePlataforma, sinPlataformasEnElPath } from '../helpers/plataforma-doble.js';
import { caso } from '../helpers/caso.js';

const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
const CARPETAS = Object.values(STATE_FOLDER);
/** Config de Claude Code que no existe: los hooks de la maquina no cambian los avisos que cuentan estos tests (TASK-076). */
const SIN_CONFIG_CLAUDE = path.join(tmpdir(), 'taskctl-doctor-sin-config-claude-no-existe');

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
  return runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: SIN_CONFIG_CLAUDE, ...opts });
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
  const r = spawnSync(process.execPath, [TASKCTL, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_CONFIG_DIR: SIN_CONFIG_CLAUDE },
  });
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

test('ramas: master vale, base sigue a rama_base, sin develop y sin main ni master', async () => {
  await caso('rama principal "master" tambien vale', async () => {
    await conRepo(async (repoRoot) => {
      git(['branch', '-m', 'main', 'master'], repoRoot);
      const r = doctor(repoRoot);
      assert.equal(por(r.comprobaciones, 'rama-principal').nivel, 'ok');
      assert.match(por(r.comprobaciones, 'rama-principal').mensaje, /"master"/);
    });
  });
  await caso('sin develop: error con el comando que la crea desde la principal', async () => {
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
  await caso('la rama base sigue a rama_base de la config', async () => {
    await conRepo(async (repoRoot) => {
      await config(repoRoot, 'rama_base: integracion\n');
      const c = por(doctor(repoRoot).comprobaciones, 'rama-base');
      assert.equal(c.nivel, 'error');
      assert.match(c.mensaje, /"integracion"/);
    });
  });
  await caso('sin main ni master: error en rama-principal', async () => {
    await conRepo(async (repoRoot) => {
      git(['branch', '-m', 'main', 'tronco'], repoRoot);
      const c = por(doctor(repoRoot).comprobaciones, 'rama-principal');
      assert.equal(c.nivel, 'error');
      assert.match(c.arreglo ?? '', /git branch main/);
    });
  });
});

// ---------------------------------------------------------------------
// Repositorio
// ---------------------------------------------------------------------

test('tareas/: ausente y con una carpeta menos', async () => {
  await caso('sin tareas/: error con el mkdir exacto y la coherencia de tareas omitida', async () => {
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
  await caso('a tareas/ le falta una carpeta: error que nombra solo la que falta', async () => {
    await conRepo(async (repoRoot) => {
      await rm(path.join(repoRoot, 'tareas', '03-en-revision'), { recursive: true, force: true });
      const c = por(doctor(repoRoot).comprobaciones, 'tareas-carpetas');
      assert.equal(c.nivel, 'error');
      assert.match(c.mensaje, /03-en-revision/);
      assert.equal(c.arreglo, 'mkdir -p tareas/03-en-revision');
    });
  });
});

test('origin y workspace: sin origin, sin origin con merge-request y workspace sucio', async () => {
  await caso('sin origin: aviso con el comando, y codigo 0', async () => {
    await conRepo(async (repoRoot) => {
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'origin');
      assert.equal(c.nivel, 'aviso');
      assert.match(c.arreglo ?? '', /^git remote add origin /);
      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
    });
  });
  await caso('sin origin y con cierre_por_defecto: merge-request es error y el codigo, 1', async () => {
    await conRepo(async (repoRoot) => {
      await config(repoRoot, 'cierre_por_defecto: merge-request\n');
      const r = doctor(repoRoot);
      assert.equal(por(r.comprobaciones, 'origin').nivel, 'error');
      assert.match(por(r.comprobaciones, 'origin').mensaje, /merge-request/);
      assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'omitida');
      assert.equal(r.codigo, 1);
    });
  });
  await caso('workspace sucio: aviso (no cambia el codigo) con el paso concreto', async () => {
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
});

test('estados del repo: sin commits, no es repo Git y worktree enlazado', async () => {
  await caso('repo sin commits: mensaje propio, ramas omitidas y codigo 1', async () => {
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
  await caso('un directorio que no es repo Git: error con el arreglo y el resto omitido', async () => {
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
  await caso('worktree enlazado (.git es un fichero): sigue siendo repo y todo ok', async () => {
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
});

// ---------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------

test('config con valor invalido y con clave desconocida', async () => {
  await caso('config con un valor invalido: error con el mensaje del validador y codigo 1', async () => {
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
  await caso('config con una clave desconocida: aviso (no error) que la nombra, codigo 0', async () => {
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
});

test('verificacion (TASK-070): sin y con comando_verificacion', async () => {
  await caso('verificacion (TASK-070): sin comando_verificacion, omitida con el arreglo en la misma linea; no cambia avisos ni codigo', async () => {
    await conRepo(async (repoRoot) => {
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'verificacion');
      assert.equal(c.nivel, 'omitida');
      assert.equal(c.arreglo, null);
      assert.match(c.mensaje, /sin comando_verificacion[\s\S]*declara en \.taskcode\/config\.yml: comando_verificacion: "<tu comando de tests>"/);
      const lineas = r.salida.split('\n').filter((l) => l.includes('comando_verificacion'));
      assert.equal(lineas.length, 1, r.salida);
      assert.match(lineas[0] as string, /declara en \.taskcode\/config\.yml/);
      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
    });
  });
  await caso('verificacion (TASK-070): con comando_verificacion, ok con el comando y el timeout', async () => {
    await conRepo(async (repoRoot) => {
      await config(repoRoot, 'comando_verificacion: "npm test"\ntimeout_verificacion: 900\n');
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'verificacion');
      assert.equal(c.nivel, 'ok');
      assert.equal(c.mensaje, 'comando_verificacion: "npm test" (timeout 900 s)');
    });
  });
});

/** Escribe ficheros en el repo y los commitea (el workspace queda limpio). */
async function ficheros(repoRoot: string, fs: Record<string, string>): Promise<void> {
  for (const [rel, contenido] of Object.entries(fs)) {
    await mkdir(path.dirname(path.join(repoRoot, rel)), { recursive: true });
    await writeFile(path.join(repoRoot, rel), contenido, 'utf8');
  }
  commitAll(repoRoot, 'manifiestos');
}

const PKG_CON_TEST = JSON.stringify({ name: 'x', scripts: { test: 'node --test' } });
const WIN = process.platform === 'win32';

const PKG = 'package.json con script "test"';

const CASOS_TASK_088: { tipo: string; fs: Record<string, string>; comando: string; motivo: string }[] = [
  { tipo: 'Node con npm', fs: { 'package.json': PKG_CON_TEST }, comando: 'npm test', motivo: PKG },
  { tipo: 'Node con pnpm', fs: { 'package.json': PKG_CON_TEST, 'pnpm-lock.yaml': '' }, comando: 'pnpm test', motivo: PKG },
  { tipo: 'Node con yarn', fs: { 'package.json': PKG_CON_TEST, 'yarn.lock': '' }, comando: 'yarn test', motivo: PKG },
  // MEN-1 de la ronda 1: el BOM de PowerShell 5.1 no impide detectarlo.
  { tipo: 'Node con BOM', fs: { 'package.json': `﻿${PKG_CON_TEST}` }, comando: 'npm test', motivo: PKG },
  { tipo: 'Rust', fs: { 'Cargo.toml': '[package]\nname = "x"\n' }, comando: 'cargo test', motivo: 'Cargo.toml' },
  { tipo: 'Maven', fs: { 'pom.xml': '<project/>\n' }, comando: 'mvn test', motivo: 'pom.xml' },
  {
    tipo: 'Maven con wrapper',
    fs: { 'pom.xml': '<project/>\n', mvnw: '#!/bin/sh\n', 'mvnw.cmd': '@echo off\n' },
    comando: WIN ? 'mvnw test' : './mvnw test',
    motivo: 'pom.xml',
  },
  { tipo: 'Gradle', fs: { 'build.gradle.kts': '\n' }, comando: 'gradle test', motivo: 'build.gradle.kts' },
  { tipo: '.NET con .csproj', fs: { 'App.csproj': '<Project/>\n' }, comando: 'dotnet test', motivo: 'proyecto .csproj' },
  { tipo: '.NET con .sln', fs: { 'App.sln': '\n' }, comando: 'dotnet test', motivo: 'solucion .sln' },
  { tipo: 'Go', fs: { 'go.mod': 'module x\n' }, comando: 'go test ./...', motivo: 'go.mod' },
  {
    tipo: 'Python con pytest',
    fs: { 'pyproject.toml': '﻿[tool.pytest.ini_options]\n' },
    comando: 'python -m pytest',
    motivo: 'pyproject.toml con pytest',
  },
  {
    tipo: 'Tauri (Node + Rust)',
    fs: { 'package.json': PKG_CON_TEST, 'Cargo.toml': '[package]\n' },
    comando: 'npm test && cargo test',
    motivo: `${PKG}, Cargo.toml`,
  },
];

for (const caso of CASOS_TASK_088) {
  test(`verificacion (TASK-088): sin comando_verificacion y con tests (${caso.tipo}), aviso con el comando propuesto`, async () => {
    await conRepo(async (repoRoot) => {
      await ficheros(repoRoot, caso.fs);
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'verificacion');
      assert.equal(c.nivel, 'aviso', niveles(r.comprobaciones));
      assert.match(c.mensaje, /sin comando_verificacion y el proyecto tiene tests/);
      // MEN-2 de la ronda 1: el mensaje dice que se detecto.
      assert.ok(c.mensaje.includes(`(${caso.motivo})`), c.mensaje);
      assert.equal(c.arreglo, `Declara en .taskcode/config.yml: comando_verificacion: "${caso.comando}"`);
      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
    });
  });
}

/** TASK-116: `n` tareas en 04-terminadas, commiteadas con el resto (el workspace queda limpio). */
async function terminadas(repoRoot: string, n: number): Promise<void> {
  for (let i = 1; i <= n; i++) {
    await tareaEn(repoRoot, STATE_FOLDER.terminada, `TASK-${String(i).padStart(3, '0')}`, 'terminada');
  }
}

for (const caso of [
  { n: 3, texto: '; 3 tareas terminadas se cerraron sin verificar' },
  { n: 1, texto: '; 1 tarea terminada se cerro sin verificar' },
]) {
  test(`verificacion (TASK-116): sin comando_verificacion, con tests y ${caso.n} terminada(s), el aviso las cuenta`, async () => {
    await conRepo(async (repoRoot) => {
      await terminadas(repoRoot, caso.n);
      // No son IDs de tarea: no cuentan.
      await mkdir(path.join(repoRoot, 'tareas', STATE_FOLDER.terminada, 'notas'), { recursive: true });
      await writeFile(path.join(repoRoot, 'tareas', STATE_FOLDER.terminada, 'notas', 'x.md'), 'x\n', 'utf8');
      await ficheros(repoRoot, { 'package.json': PKG_CON_TEST });
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'verificacion');
      assert.equal(c.nivel, 'aviso', niveles(r.comprobaciones));
      assert.ok(c.mensaje.endsWith(`los frenos de verificacion no actuan${caso.texto}`), c.mensaje);
      assert.equal(c.arreglo, 'Declara en .taskcode/config.yml: comando_verificacion: "npm test"');
      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
    });
  });
}

test('verificacion (TASK-116): terminadas, sin tests, contarTerminadas solo en su camino y a 0', async () => {
  await caso('verificacion (TASK-116): sin terminadas el aviso no menciona tareas; con la clave, ok sin recuento', async () => {
    await conRepo(async (repoRoot) => {
      await ficheros(repoRoot, { 'package.json': PKG_CON_TEST });
      const sin = por(doctor(repoRoot).comprobaciones, 'verificacion');
      assert.equal(sin.nivel, 'aviso');
      assert.ok(sin.mensaje.endsWith('los frenos de verificacion no actuan'), sin.mensaje);
      await terminadas(repoRoot, 2);
      await config(repoRoot, 'comando_verificacion: "npm test"\n');
      commitAll(repoRoot, 'config y terminadas');
      const con = por(doctor(repoRoot).comprobaciones, 'verificacion');
      assert.equal(con.nivel, 'ok');
      assert.equal(con.mensaje, 'comando_verificacion: "npm test" (timeout 600 s)');
    });
  });
  await caso('verificacion (TASK-116): sin tests detectables sigue en omitida y no cuenta las terminadas', async () => {
    await conRepo(async (repoRoot) => {
      await terminadas(repoRoot, 2);
      commitAll(repoRoot, 'terminadas');
      const c = por(doctor(repoRoot).comprobaciones, 'verificacion');
      assert.equal(c.nivel, 'omitida');
      assert.doesNotMatch(c.mensaje, /terminada/);
    });
  });
  await caso('verificacion (TASK-116): contarTerminadas solo se llama en el camino del aviso', async () => {
    const noLlamar = (): number => {
      throw new Error('no deberia contar las terminadas');
    };
    const npm = [{ comando: 'npm test', motivo: 'package.json con script "test"' }] as const;
    assert.equal(comprobarVerificacion(parsearConfig('comando_verificacion: "npm test"\n', 'c.yml'), () => npm, noLlamar).nivel, 'ok');
    assert.equal(comprobarVerificacion(parsearConfig('', 'c.yml'), () => [], noLlamar).nivel, 'omitida');
    assert.equal(comprobarVerificacion(null, () => npm, noLlamar).nivel, 'omitida');
    assert.match(comprobarVerificacion(parsearConfig('', 'c.yml'), () => npm, () => 27).mensaje, /; 27 tareas terminadas se cerraron sin verificar$/);
  });
  await caso('verificacion (TASK-116): contarTerminadas da 0 si la carpeta falta', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-sin-terminadas-'));
    try {
      assert.equal(contarTerminadas(path.join(dir, 'tareas')), 0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

test('verificacion (TASK-088 y TASK-070): manifiestos, clave declarada, config rota, CLI --json y timeout invalido', async () => {
  await caso('verificacion (TASK-088): manifiestos que no son tests, o en una subcarpeta, siguen en omitida', async () => {
    await conRepo(async (repoRoot) => {
      await ficheros(repoRoot, {
        'package.json': JSON.stringify({ scripts: { test: 'echo "Error: no test specified" && exit 1' } }),
        'pyproject.toml': '[project]\nname = "x"\n',
        'sub/Cargo.toml': '[package]\n',
        'otro/pom.xml': '<project/>\n',
      });
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'verificacion');
      assert.equal(c.nivel, 'omitida', c.mensaje);
      assert.match(c.mensaje, /declara en \.taskcode\/config\.yml: comando_verificacion: "<tu comando de tests>"/);
    });
  });
  await caso('verificacion (TASK-088): con la clave declarada, ok aunque haya manifiestos', async () => {
    await conRepo(async (repoRoot) => {
      await ficheros(repoRoot, { 'Cargo.toml': '[package]\n' });
      await config(repoRoot, 'comando_verificacion: "cargo test --all"\n');
      const c = por(doctor(repoRoot).comprobaciones, 'verificacion');
      assert.equal(c.nivel, 'ok');
      assert.match(c.mensaje, /cargo test --all/);
    });
  });
  await caso('verificacion (TASK-088): con la config rota, omitida aunque haya manifiestos', async () => {
    await conRepo(async (repoRoot) => {
      await ficheros(repoRoot, { 'Cargo.toml': '[package]\n' });
      await config(repoRoot, 'timeout_verificacion: 0\n');
      assert.equal(por(doctor(repoRoot).comprobaciones, 'verificacion').nivel, 'omitida');
    });
  });
  await caso('verificacion (TASK-088): por el CLI con --json, el aviso sale con su arreglo y codigo 0', async () => {
    await conRepo(async (repoRoot) => {
      await ficheros(repoRoot, { 'go.mod': 'module x\n' });
      const r = cli(repoRoot, ['doctor', '--json']);
      const json = JSON.parse(r.stdout) as { comprobaciones: Comprobacion[] };
      const c = por(json.comprobaciones, 'verificacion');
      assert.equal(c.nivel, 'aviso');
      assert.equal(c.arreglo, 'Declara en .taskcode/config.yml: comando_verificacion: "go test ./..."');
      assert.equal(r.status, 0, r.stdout);
    });
  });
  await caso('verificacion (TASK-070): con la config rota, omitida; un timeout invalido es error de config', async () => {
    await conRepo(async (repoRoot) => {
      await config(repoRoot, 'comando_verificacion: npm test\ntimeout_verificacion: 0\n');
      const r = doctor(repoRoot);
      assert.equal(por(r.comprobaciones, 'config').nivel, 'error');
      assert.match(por(r.comprobaciones, 'config').mensaje, /timeout_verificacion/);
      assert.equal(por(r.comprobaciones, 'verificacion').nivel, 'omitida');
      assert.equal(r.codigo, 1);
    });
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

test('tareas: carpeta equivocada, ID duplicado, tarea.md ilegible o invalido, sin tarea.md y carpeta ajena', async () => {
  await caso('tarea en la carpeta equivocada: error con el ID y el comando que la mueve', async () => {
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
  await caso('mismo ID en dos carpetas: error de duplicado (lo que listTareasEnEstados salta)', async () => {
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
  await caso('tarea.md ilegible: error con la ruta y la causa', async () => {
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
  await caso('un tarea.md con campos invalidos tambien es error (con la causa del validador)', async () => {
    await conRepo(async (repoRoot) => {
      await tareaEn(repoRoot, '02-en-curso', 'TASK-023', 'en-curso');
      const f = path.join(repoRoot, 'tareas', '02-en-curso', 'TASK-023', 'tarea.md');
      await writeFile(f, (await readFile(f, 'utf8')).replace('tipo: feature', 'tipo: inventado'), 'utf8');
      const c = por(doctor(repoRoot).comprobaciones, 'tarea:TASK-023:ilegible');
      assert.equal(c.nivel, 'error');
      assert.match(c.mensaje, /tipo/);
    });
  });
  await caso('carpeta de tarea sin tarea.md: error con el ID', async () => {
    await conRepo(async (repoRoot) => {
      await mkdir(path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-024'), { recursive: true });
      const r = doctor(repoRoot);
      const c = por(r.comprobaciones, 'tarea:TASK-024:sin-tarea-md');
      assert.equal(c.nivel, 'error');
      assert.match(c.mensaje, /^TASK-024: .*no tiene tarea\.md/);
      assert.equal(r.codigo, 1);
    });
  });
  await caso('carpeta ajena a un ID (no TASK-NNN) se ignora', async () => {
    await conRepo(async (repoRoot) => {
      await mkdir(path.join(repoRoot, 'tareas', '00-planificadas', 'notas'), { recursive: true });
      const r = doctor(repoRoot);
      assert.equal(por(r.comprobaciones, 'tareas').nivel, 'ok');
    });
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

test('envolver, directorio inexistente y flags desconocidos', async () => {
  await caso('envolver: una excepcion es un resultado error de esa comprobacion, sin credenciales', async () => {
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
  await caso('un directorio que no existe no lanza: devuelve errores y codigo 1', async () => {
    const r = doctor(path.join(tmpdir(), 'taskctl-doctor-no-existe-jamas'));
    assert.equal(r.codigo, 1);
    assert.ok(r.comprobaciones.length >= 10);
  });
  await caso('flags desconocidos y argumentos sobrantes abortan', async () => {
    assert.throws(
      () => runDoctorCommand(['--jsno'], { repoCwd: '.' }),
      (e: unknown) => e instanceof DoctorCommandError && /"--jsno"/.test(e.message) && /--json/.test(e.message)
    );
    assert.throws(() => runDoctorCommand(['--json=1'], { repoCwd: '.' }), DoctorCommandError);
    assert.throws(() => runDoctorCommand(['TASK-001'], { repoCwd: '.' }), /no admite argumentos/);
    // TASK-110 (MEN-6): el uso lista todos los flags de doctor.
    assert.throws(
      () => runDoctorCommand(['TASK-001'], { repoCwd: '.' }),
      (e: unknown) =>
        e instanceof Error &&
        e.message.endsWith('Uso: taskctl doctor [--json] [--instalar-status-line [--reemplazar-status-line] | --desinstalar-status-line].')
    );
  });
});

// ---------------------------------------------------------------------
// CLI: codigo de salida y JSON
// ---------------------------------------------------------------------

test('CLI: --json, codigo con error, flag desconocido y --help', async () => {
  await caso('CLI --json: en stdout SOLO el JSON (una linea), stderr vacio, codigo 0 y estructura', async () => {
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
  await caso('CLI: con un error el codigo es 1 en texto y en --json, y el JSON sigue siendo valido', async () => {
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
  await caso('CLI: un flag desconocido sale con 1 y el mensaje en stderr', async () => {
    await conRepo(async (repoRoot) => {
      const r = cli(repoRoot, ['doctor', '--jsno']);
      assert.equal(r.status, 1);
      assert.equal(r.stdout, '');
      assert.match(r.stderr, /flag desconocido "--jsno"/);
    });
  });
  await caso('CLI: --help lista doctor', async () => {
    await conRepo(async (repoRoot) => {
      assert.match(cli(repoRoot, ['--help']).stdout, /taskctl doctor \[--json\]/);
    });
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

test('bash: fallo, marca de sonda, marca sin codigo y sin bash en el PATH', async () => {
  await caso('bash: un script de prueba que falla (comando no encontrado) es error con el arreglo', async () => {
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
  await caso('bash: salir con 0 no basta, hace falta la marca de la sonda en stdout', async () => {
    await conRepo(async (repoRoot) => {
      await conSonda('#!/usr/bin/env bash\nexit 0\n', (scriptsDir) => {
        assert.equal(por(doctor(repoRoot, { scriptsDir }).comprobaciones, 'bash').nivel, 'error');
      });
    });
  });
  await caso('bash: la marca sin codigo de salida 0 tampoco vale', async () => {
    await conRepo(async (repoRoot) => {
      await conSonda('#!/usr/bin/env bash\necho "taskctl-sonda-ok"\nexit 3\n', (scriptsDir) => {
        assert.equal(por(doctor(repoRoot, { scriptsDir }).comprobaciones, 'bash').nivel, 'error');
      });
    });
  });
  await caso('bash: sin bash en el PATH es error ("no se pudo lanzar")', async () => {
    await conRepo(async (repoRoot) => {
      const vacio = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-pathvacio-'));
      const guardado = process.env['PATH'];
      try {
        process.env['PATH'] = vacio;
        const r = doctor(repoRoot);
        const c = por(r.comprobaciones, 'bash');
        assert.equal(c.nivel, 'error');
        assert.match(c.mensaje, /no se pudo lanzar "bash"/);
        // TASK-134 (MENOR-2): en Windows dice que no encontro el bash de Git y usa el del PATH.
        if (WIN) assert.match(c.mensaje, /no se encontro el bash de Git junto a git\.exe: se usa el "bash" del PATH/);
        else assert.doesNotMatch(c.mensaje, /bash de Git/);
        assert.equal(r.codigo, 1);
      } finally {
        process.env['PATH'] = guardado;
        await rm(vacio, { recursive: true, force: true });
      }
    });
  });
  await caso('bash (TASK-134): con el bash de Git, doctor dice cual usa (solo Windows)', async () => {
    if (!WIN) return;
    await conRepo(async (repoRoot) => {
      const c = por(doctor(repoRoot).comprobaciones, 'bash');
      assert.equal(c.nivel, 'ok', c.mensaje);
      assert.match(c.mensaje, /; bash de Git: .+\\usr\\bin\\bash\.exe$/);
    });
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

test('plataforma: sesion ok, GitLab con GITLAB_HOST y sin merge request ni plataforma', async () => {
  await caso('plataforma: merge-request por defecto con sesion: ok, y solo se llamo a "auth status"', async () => {
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
  await caso('plataforma: declarada con GitLab, la sesion se comprueba con glab api user bajo su GITLAB_HOST', async () => {
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
  await caso('plataforma: sin merge request ni plataforma declarada es omitida y no llama a gh ni glab', async () => {
    await conRepo(async (repoRoot) => {
      await conDoblePlataforma({ prs: [] }, async (dbl) => {
        const r = doctor(repoRoot);
        assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'omitida');
        assert.deepEqual(dbl.leer().llamadas, []);
      });
    });
  });
});

test('plataforma: sesion rechazada, no instalado, timeout e instancia inalcanzable', async () => {
  await caso('plataforma: sesion rechazada (confirmada) es error con el comando que la abre', async () => {
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
  await caso('plataforma: gh/glab no instalado es error con la instalacion', async () => {
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
  await caso('plataforma: sin respuesta a tiempo (timeout propio) es aviso, no error, y no cuelga doctor', async () => {
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
  await caso('plataforma: instancia inalcanzable (fallo de red, no de sesion) es aviso y no filtra la URL con credenciales', async () => {
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
});
