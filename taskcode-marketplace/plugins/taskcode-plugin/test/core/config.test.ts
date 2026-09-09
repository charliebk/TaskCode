/**
 * Tests de `.taskcode/config.yml` (TASK-030, item C4).
 *
 * Contra repos Git REALES creados en tmp, nunca mocks: la pregunta que
 * importa no es "resolverConfig sabe leer un fichero" sino "poner
 * rama_base cambia de verdad a que rama va taskctl", y eso solo se
 * puede responder con un repo de verdad. Mismo patron que
 * test/fs/git.test.ts y test/commands/new.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  CONFIG_DEFAULTS,
  CLAVES_CONFIG,
  ConfigError,
  parsearConfig,
  resolverConfig,
  rutaConfig,
} from '../../src/core/config.js';
import { parseFrontmatter, FrontmatterParseError } from '../../src/core/frontmatter.js';
import { resolveBaseBranchForTipo } from '../../src/fs/git.js';
import { tareasQueBloquean, mensajeWipExcedido } from '../../src/core/wip.js';
import { runNewCommand, parseNewTaskArgs } from '../../src/commands/new.js';
import { runImportCommand, parseImportArgs } from '../../src/commands/import.js';
import type { Task, TareaUbicada } from '../../src/core/task.js';

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

/**
 * Repo Git real con un commit inicial y la rama "develop" activa: el
 * estado en el que los comandos esperan encontrarse.
 */
async function withTempRepo(
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-config-'));
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
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/**
 * Escribe `.taskcode/config.yml` Y LO COMITEA. Lo segundo no es
 * decoracion: sin commitear, el workspace queda sucio y
 * ensureBaseBranchReady aborta antes de mirar nada — igual que le
 * pasaria a una persona.
 */
async function escribirConfig(repoRoot: string, contenido: string): Promise<void> {
  await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
  await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), contenido, 'utf8');
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', 'config'], repoRoot);
}

const RUTA_FICTICIA = '/repo/.taskcode/config.yml';

// ---------------------------------------------------------------------
// 1. Sin fichero: comportamiento identico al de hoy
// ---------------------------------------------------------------------

test('resolverConfig: repo sin .taskcode/ devuelve los tres defaults', async () => {
  await withTempRepo(async (repoRoot) => {
    const c = resolverConfig(repoRoot);
    assert.equal(c.rama_base, 'develop');
    assert.equal(c.agente_revisor_por_defecto, 'general-purpose');
    assert.equal(c.limite_wip, 1);
    assert.deepEqual(c, { ...CONFIG_DEFAULTS });
  });
});

test('resolverConfig: .taskcode/ existe pero sin config.yml -> defaults, sin quejarse', async () => {
  await withTempRepo(async (repoRoot) => {
    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
    assert.deepEqual(resolverConfig(repoRoot), { ...CONFIG_DEFAULTS });
  });
});

test('resolverConfig: config.yml vacio -> defaults (es una forma legitima de decir "todo por defecto")', async () => {
  await withTempRepo(async (repoRoot) => {
    await escribirConfig(repoRoot, '');
    assert.deepEqual(resolverConfig(repoRoot), { ...CONFIG_DEFAULTS });
  });
});

test('resolverConfig: config.yml con solo comentarios y lineas en blanco -> defaults', async () => {
  await withTempRepo(async (repoRoot) => {
    await escribirConfig(repoRoot, '# configuracion de taskcode\n\n#   rama_base: otra\n\n');
    assert.deepEqual(resolverConfig(repoRoot), { ...CONFIG_DEFAULTS });
  });
});

test('resolveBaseBranchForTipo: sin fichero sigue devolviendo "develop" (no-breaking)', async () => {
  await withTempRepo(async (repoRoot) => {
    assert.equal(resolveBaseBranchForTipo('feature', repoRoot), 'develop');
    assert.equal(resolveBaseBranchForTipo('fix', repoRoot), 'develop');
    assert.equal(resolveBaseBranchForTipo('release', repoRoot), 'develop');
  });
});

test('parseNewTaskArgs / parseImportArgs: sin config, el revisor por defecto sigue siendo general-purpose', () => {
  const n = parseNewTaskArgs(['--titulo', 'x', '--tipo', 'feature']);
  assert.equal(n.agenteRevisor, 'general-purpose');
  const i = parseImportArgs(['fichero.md']);
  assert.equal(i.agenteRevisor, 'general-purpose');
});

// ---------------------------------------------------------------------
// 2. Con las tres claves: surten efecto de verdad
// ---------------------------------------------------------------------

test('resolverConfig: las tres claves puestas se leen las tres', async () => {
  await withTempRepo(async (repoRoot) => {
    await escribirConfig(
      repoRoot,
      'rama_base: integration\nagente_revisor_por_defecto: revisor-de-la-casa\nlimite_wip: 3\n'
    );
    const c = resolverConfig(repoRoot);
    assert.equal(c.rama_base, 'integration');
    assert.equal(c.agente_revisor_por_defecto, 'revisor-de-la-casa');
    assert.equal(c.limite_wip, 3);
  });
});

test('rama_base: cambia la rama que resolveBaseBranchForTipo devuelve para feature/fix/release', async () => {
  await withTempRepo(async (repoRoot) => {
    await escribirConfig(repoRoot, 'rama_base: integration\n');
    assert.equal(resolveBaseBranchForTipo('feature', repoRoot), 'integration');
    assert.equal(resolveBaseBranchForTipo('fix', repoRoot), 'integration');
    assert.equal(resolveBaseBranchForTipo('release', repoRoot), 'integration');
  });
});

test('rama_base: NO afecta a hotfix, que sigue colgando de la rama principal detectada', async () => {
  // La decision #9 descarta `rama_principal` como clave porque
  // resolveMainBranch ya detecta main/master sola. Si rama_base se
  // colara en hotfix, esa deteccion quedaria anulada.
  await withTempRepo(async (repoRoot) => {
    await escribirConfig(repoRoot, 'rama_base: integration\n');
    assert.equal(resolveBaseBranchForTipo('hotfix', repoRoot), 'main');
  });
});

test('rama_base: taskctl new CAMBIA de verdad a la rama configurada, no solo la calcula', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    git(['branch', 'integration'], repoRoot);
    await escribirConfig(repoRoot, 'rama_base: integration\n');
    // Se arranca desde develop: con el default, "new" se habria
    // quedado en develop sin cambiar de rama.
    assert.equal(
      spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: repoRoot,
        encoding: 'utf8',
      }).stdout.trim(),
      'develop'
    );
    const result = await runNewCommand(
      tareasRoot,
      ['--titulo', 'Tarea sobre integration', '--tipo', 'feature'],
      '2026-09-07',
      { repoCwd: repoRoot }
    );
    assert.equal(result.baseBranchGuard.baseBranch, 'integration');
    assert.equal(result.baseBranchGuard.switched, true);
    assert.equal(result.baseBranchGuard.branchAntes, 'develop');
    // Y la rama activa REAL del repo, no solo lo que dice el resultado.
    assert.equal(
      spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: repoRoot,
        encoding: 'utf8',
      }).stdout.trim(),
      'integration'
    );
  });
});

test('agente_revisor_por_defecto: taskctl new lo escribe en el tarea.md', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await escribirConfig(repoRoot, 'agente_revisor_por_defecto: revisor-de-la-casa\n');
    const result = await runNewCommand(
      tareasRoot,
      ['--titulo', 'Con revisor configurado', '--tipo', 'feature'],
      '2026-09-07',
      { repoCwd: repoRoot }
    );
    const contenido = await readFile(result.filePath, 'utf8');
    assert.match(contenido, /agente_revisor: revisor-de-la-casa/);
    assert.doesNotMatch(contenido, /general-purpose/);
  });
});

test('agente_revisor_por_defecto: --agente-revisor sigue mandando sobre el config', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await escribirConfig(repoRoot, 'agente_revisor_por_defecto: revisor-de-la-casa\n');
    const result = await runNewCommand(
      tareasRoot,
      ['--titulo', 'Con flag', '--tipo', 'feature', '--agente-revisor', 'otro-revisor'],
      '2026-09-07',
      { repoCwd: repoRoot }
    );
    const contenido = await readFile(result.filePath, 'utf8');
    assert.match(contenido, /agente_revisor: otro-revisor/);
  });
});

test('agente_revisor_por_defecto: taskctl import usa el MISMO valor que new (la duplicacion desaparecio)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await escribirConfig(repoRoot, 'agente_revisor_por_defecto: revisor-de-la-casa\n');
    // El fichero a importar vive FUERA del repo: si no, ensucia el
    // workspace y el guard de la 8.3 aborta el propio import.
    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-import-src-'));
    try {
      const md = path.join(fuera, 'lote.md');
      await writeFile(md, '### Una tarea importada\n- un criterio\n', 'utf8');
      const result = await runImportCommand(tareasRoot, [md], '2026-09-07', {
        repoCwd: repoRoot,
      });
      assert.equal(result.creadas.length, 1, JSON.stringify(result.errores));
      const contenido = await readFile((result.creadas[0] as { filePath: string }).filePath, 'utf8');
      assert.match(contenido, /agente_revisor: revisor-de-la-casa/);
    } finally {
      await rm(fuera, { recursive: true, force: true });
    }
  });
});

test('limite_wip: con limite 3, dos tareas abiertas ya no bloquean; con 1, si', () => {
  const base: Task = {
    id: 'TASK-900',
    titulo: 'x',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-curso',
    plan_aprobado: true,
    rama: 'feature/task-900-x',
    asignado_a: 'carlos',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    agente_revisor: 'general-purpose',
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-07',
    actualizado: '2026-09-07',
    dependencias: [],
  };
  const ubicada = (id: string): TareaUbicada => ({
    task: { ...base, id },
    estadoCarpeta: 'en-curso',
  });
  const abiertas = [ubicada('TASK-901'), ubicada('TASK-902')];

  // Comportamiento de hoy (limite implicito 1): bloquean.
  assert.equal(tareasQueBloquean(abiertas, 'carlos', 'TASK-900').length, 2);
  assert.equal(tareasQueBloquean(abiertas, 'carlos', 'TASK-900', 1).length, 2);
  // Con limite 3 todavia cabe una mas: no bloquean.
  assert.deepEqual(tareasQueBloquean(abiertas, 'carlos', 'TASK-900', 3), []);
  // Con limite 2 ya esta el cupo lleno.
  assert.equal(tareasQueBloquean(abiertas, 'carlos', 'TASK-900', 2).length, 2);
});

test('limite_wip: el mensaje de error dice el limite real, no "una sola tarea"', () => {
  const t: TareaUbicada = {
    task: {
      id: 'TASK-901',
      titulo: 'x',
      tipo: 'feature',
      sprint: 1,
      etiquetas: [],
      complejidad: 'simple',
      modelo_sugerido: 'sonnet',
      estado: 'en-curso',
      plan_aprobado: true,
      rama: 'feature/task-901-x',
      asignado_a: 'carlos',
      skills_recomendados: [],
      regla_seleccion_skill: null,
      agente_revisor: 'general-purpose',
      ultimo_commit_revisado: null,
      revision_codex: false,
      creado: '2026-09-07',
      actualizado: '2026-09-07',
      dependencias: [],
    },
    estadoCarpeta: 'en-curso',
  };
  const conDefecto = mensajeWipExcedido('TASK-900', 'carlos', [t]);
  assert.ok(conDefecto.includes('Una sola tarea en curso por persona'), conDefecto);

  const conTres = mensajeWipExcedido('TASK-900', 'carlos', [t], 3);
  assert.ok(conTres.includes('El limite es de 3 tareas'), conTres);
  assert.ok(conTres.includes('limite_wip'), conTres);
  assert.ok(!conTres.includes('Una sola tarea en curso por persona'), conTres);
});

// ---------------------------------------------------------------------
// 3. Fallo cerrado: cada forma de invalidez aborta
// ---------------------------------------------------------------------

test('invalido: limite_wip: dos (texto) aborta y dice que espera un entero', () => {
  assert.throws(
    () => parsearConfig('limite_wip: dos\n', RUTA_FICTICIA),
    (e: unknown) => {
      assert.ok(e instanceof ConfigError, String(e));
      assert.match(e.message, /limite_wip/);
      assert.match(e.message, /entero/);
      assert.match(e.message, /el texto "dos"/);
      return true;
    }
  );
});

test('invalido: limite_wip: 0 y limite_wip: -1 abortan (0 no significa "sin limite")', () => {
  for (const valor of ['0', '-1']) {
    assert.throws(
      () => parsearConfig(`limite_wip: ${valor}\n`, RUTA_FICTICIA),
      (e: unknown) => {
        assert.ok(e instanceof ConfigError, String(e));
        assert.match(e.message, /mayor o igual que 1/);
        return true;
      },
      `limite_wip: ${valor} deberia abortar`
    );
  }
});

test('invalido: limite_wip decimal o booleano tambien abortan', () => {
  assert.throws(() => parsearConfig('limite_wip: 1.5\n', RUTA_FICTICIA), ConfigError);
  assert.throws(() => parsearConfig('limite_wip: true\n', RUTA_FICTICIA), ConfigError);
});

test('invalido: rama_base vacia, en comillas o sin valor, aborta', () => {
  for (const linea of ['rama_base: ""', 'rama_base:', 'rama_base: "   "']) {
    assert.throws(
      () => parsearConfig(`${linea}\n`, RUTA_FICTICIA),
      (e: unknown) => {
        assert.ok(e instanceof ConfigError, String(e));
        assert.match(e.message, /no puede estar vacia/);
        assert.match(e.message, /develop/); // dice cual es el default
        return true;
      },
      `"${linea}" deberia abortar`
    );
  }
});

test('invalido: agente_revisor_por_defecto vacio aborta igual que rama_base', () => {
  assert.throws(
    () => parsearConfig('agente_revisor_por_defecto: ""\n', RUTA_FICTICIA),
    (e: unknown) => {
      assert.ok(e instanceof ConfigError, String(e));
      assert.match(e.message, /general-purpose/);
      return true;
    }
  );
});

test('invalido: clave desconocida aborta, sugiere la parecida y enumera las validas', () => {
  assert.throws(
    () => parsearConfig('limite_wp: 2\n', RUTA_FICTICIA),
    (e: unknown) => {
      assert.ok(e instanceof ConfigError, String(e));
      assert.match(e.message, /clave desconocida "limite_wp"/);
      assert.match(e.message, /Quiza quisiste decir "limite_wip"/);
      for (const clave of CLAVES_CONFIG) {
        assert.ok(e.message.includes(clave), `falta "${clave}" en: ${e.message}`);
      }
      return true;
    }
  );
});

test('invalido: una clave descartada por la decision #9 tambien es desconocida', () => {
  // `remoto`, `rama_principal` y `politica_no_borrar_ramas` NO se
  // declaran. Escribirlas tiene que fallar, no ignorarse: una clave
  // que el usuario escribe y el plugin no lee es peor que no tenerla.
  for (const clave of ['remoto', 'rama_principal', 'politica_no_borrar_ramas']) {
    assert.throws(
      () => parsearConfig(`${clave}: x\n`, RUTA_FICTICIA),
      ConfigError,
      `"${clave}" deberia ser rechazada`
    );
  }
});

test('invalido: la misma clave dos veces aborta en vez de que gane la ultima en silencio', () => {
  assert.throws(
    () => parsearConfig('limite_wip: 1\nlimite_wip: 5\n', RUTA_FICTICIA),
    (e: unknown) => {
      assert.ok(e instanceof ConfigError, String(e));
      assert.match(e.message, /repetida/);
      return true;
    }
  );
});

test('invalido: linea sin ":" aborta hablando de CONFIG, no de frontmatter', () => {
  assert.throws(
    () => parsearConfig('rama_base develop\n', RUTA_FICTICIA),
    (e: unknown) => {
      assert.ok(e instanceof ConfigError, String(e));
      assert.match(e.message, /Linea de config invalida/);
      assert.ok(!e.message.includes('frontmatter'), e.message);
      return true;
    }
  );
});

test('el mensaje de error nombra el fichero y la linea', () => {
  assert.throws(
    () => parsearConfig('# cabecera\n\nlimite_wip: 0\n', RUTA_FICTICIA),
    (e: unknown) => {
      assert.ok(e instanceof ConfigError, String(e));
      assert.ok(e.message.includes(`${RUTA_FICTICIA}:3`), e.message);
      return true;
    }
  );
});

// ---------------------------------------------------------------------
// 4. La invalidez llega hasta arriba: no hay caida al default
// ---------------------------------------------------------------------

test('fallo cerrado real: resolveBaseBranchForTipo NO cae a "develop" con un config roto', async () => {
  await withTempRepo(async (repoRoot) => {
    await escribirConfig(repoRoot, 'limite_wip: dos\n');
    assert.throws(() => resolveBaseBranchForTipo('feature', repoRoot), ConfigError);
  });
});

test('fallo cerrado real: taskctl new aborta con un config roto y NO crea la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await escribirConfig(repoRoot, 'limite_wp: 2\n');
    await assert.rejects(
      runNewCommand(tareasRoot, ['--titulo', 'x', '--tipo', 'feature'], '2026-09-07', {
        repoCwd: repoRoot,
      }),
      ConfigError
    );
    assert.equal(existsSync(tareasRoot), false, 'no deberia haber creado tareas/');
  });
});

test('fallo cerrado real: taskctl import aborta con un config roto', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await escribirConfig(repoRoot, 'rama_base: ""\n');
    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-import-src-'));
    try {
      const md = path.join(fuera, 'lote.md');
      await writeFile(md, '### Una tarea\n- un criterio\n', 'utf8');
      await assert.rejects(
        runImportCommand(tareasRoot, [md], '2026-09-07', { repoCwd: repoRoot }),
        ConfigError
      );
      assert.equal(existsSync(tareasRoot), false, 'no deberia haber creado tareas/');
    } finally {
      await rm(fuera, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------
// 5. Sintaxis compartida con frontmatter
// ---------------------------------------------------------------------

test('sintaxis: comentario inline tras el valor se descarta', () => {
  const c = parsearConfig('rama_base: integration  # la de este equipo\nlimite_wip: 2 # dos\n', RUTA_FICTICIA);
  assert.equal(c.rama_base, 'integration');
  assert.equal(c.limite_wip, 2);
});

test('sintaxis: valores entrecomillados y con espacios de sobra se recortan', () => {
  const c = parsearConfig('rama_base: "  integration  "\n', RUTA_FICTICIA);
  assert.equal(c.rama_base, 'integration');
});

test('sintaxis: CRLF no rompe el parseo', () => {
  const c = parsearConfig('rama_base: integration\r\nlimite_wip: 2\r\n', RUTA_FICTICIA);
  assert.equal(c.rama_base, 'integration');
  assert.equal(c.limite_wip, 2);
});

test('el parser compartido NO cambio el comportamiento del frontmatter', () => {
  // parseBloqueClaveValor admite comentarios de linea solo si se le
  // pide. parseFrontmatter no se lo pide, asi que un tarea.md con una
  // linea "#" sigue siendo un error, como antes de C4.
  assert.throws(
    () => parseFrontmatter('---\n# comentario\nid: TASK-001\n---\n'),
    FrontmatterParseError
  );
  // Y lo que si funcionaba sigue funcionando.
  const { data, body } = parseFrontmatter('---\nid: TASK-001\ntipo: feature  # inline\n---\ncuerpo\n');
  assert.equal(data.id, 'TASK-001');
  assert.equal(data.tipo, 'feature');
  assert.equal(body, 'cuerpo\n');
});

// ---------------------------------------------------------------------
// 6. Donde se busca el fichero
// ---------------------------------------------------------------------

test('ubicacion: se busca en la RAIZ del repo, tambien ejecutando desde un subdirectorio', async () => {
  await withTempRepo(async (repoRoot) => {
    await escribirConfig(repoRoot, 'limite_wip: 4\n');
    const sub = path.join(repoRoot, 'docs', 'contexto');
    await mkdir(sub, { recursive: true });
    assert.equal(rutaConfig(sub), path.join(repoRoot, '.taskcode', 'config.yml'));
    assert.equal(resolverConfig(sub).limite_wip, 4);
    // Y la rama base tambien, que es lo que de verdad se usa.
    assert.equal(resolveBaseBranchForTipo('feature', sub), 'develop');
  });
});

test('ubicacion: la busqueda PARA en la raiz del repo (un config de mas arriba no manda)', async () => {
  // Sin este corte, un .taskcode/config.yml olvidado en el home
  // configuraria en silencio todos los repos de la maquina.
  const contenedor = await mkdtemp(path.join(tmpdir(), 'taskctl-contenedor-'));
  try {
    await mkdir(path.join(contenedor, '.taskcode'), { recursive: true });
    await writeFile(
      path.join(contenedor, '.taskcode', 'config.yml'),
      'limite_wip: 99\n',
      'utf8'
    );
    const repoRoot = path.join(contenedor, 'repo');
    await mkdir(repoRoot, { recursive: true });
    git(['init', '-q', '-b', 'main'], repoRoot);
    assert.equal(resolverConfig(repoRoot).limite_wip, 1);
  } finally {
    await rm(contenedor, { recursive: true, force: true });
  }
});

test('resolverConfig: un .taskcode que es un FICHERO aborta (no cae al default en silencio)', async () => {
  await withTempRepo(async (repoRoot) => {
    // Hallazgo MENOR de la revision por pares (TASK-030): el comentario
    // decia que este caso aborta, y en Windows caia al default. Leer
    // ".taskcode/config.yml" con ".taskcode" siendo un fichero da
    // ENOTDIR en POSIX pero ENOENT en Windows, asi que el errno no
    // sirve para distinguirlo de "no hay configuracion". Es la misma
    // trampa de TASK-027: se le pregunta al sistema de ficheros, que
    // contesta igual en las dos plataformas.
    await writeFile(path.join(repoRoot, '.taskcode'), 'no soy una carpeta', 'utf8');
    assert.throws(() => resolverConfig(repoRoot), ConfigError);
    assert.throws(() => resolverConfig(repoRoot), /existe pero no es una carpeta/);
  });
});
