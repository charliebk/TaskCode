/**
 * `taskctl finish --merge-request` contra una instancia GitLab DECLARADA en
 * `.taskcode/config.yml` (TASK-061): dominio propio, instancia bajo una ruta,
 * https / ssh / scp. Repos Git temporales de verdad con un remoto bare real
 * (`montarOrigin`) y el doble de `gh` / `glab` de la suite, que ahora apunta
 * el `GITLAB_HOST` y el `-R` de cada llamada y responde a `api user`.
 *
 * Las URLs son genericas a proposito: git.empresa.com y
 * https://servidor.example/ruta/gitlab. La rama de la tarea sube de verdad al
 * bare y se comprueba con `ls-remote`/`rev-parse` en el (ramaEnBare).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runFinishCommand } from '../../src/commands/finish.js';
import { main } from '../../src/cli.js';
import { reiniciarAvisosDeConfig } from '../../src/core/config.js';
import type { Task } from '../../src/core/task.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
import { montarOrigin, mergearEnPlataforma, ramaEnBare, URL_GITLAB, type Origin } from '../helpers/finish-origin.js';
import {
  conDoblePlataforma,
  sinPlataformasEnElPath,
  type ControlDoble,
  type EstadoDoble,
} from '../helpers/plataforma-doble.js';

const HOY = '2026-10-08';
const ID = 'TASK-700';
const SIN_PRS: EstadoDoble = { prs: [] };

const BASE_SUB = 'https://servidor.example/ruta/gitlab';
const ORIGEN_SUB_HTTPS = 'https://servidor.example/ruta/gitlab/grupo/sub/repo.git';
const CFG_SUB = `plataforma_remota: gitlab\nurl_base_remoto: ${BASE_SUB}\n`;

interface Escenario {
  repoRoot: string;
  tareasRoot: string;
  origin: Origin;
  task: Task;
}

/**
 * Repo con origin bare bajo `url`, la tarea en-revision en su rama (la actual)
 * y `config` commiteado en ella: el config se lee del arbol de trabajo de la
 * rama en la que se ejecuta `finish`.
 */
async function escenario(url: string, config: string | null, fn: (e: Escenario) => Promise<void>): Promise<void> {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await montarOrigin(repoRoot, url);
    try {
      const task = sampleTask();
      await setupTaskEnRevision(repoRoot, tareasRoot, task);
      if (config !== null) {
        await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
        await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
        commitAll(repoRoot, 'chore: config del proyecto');
      }
      await fn({ repoRoot, tareasRoot, origin, task });
    } finally {
      await origin.limpiar();
    }
  });
}

function finish(e: Escenario, argv: string[], avisos: string[] = []) {
  return runFinishCommand(e.tareasRoot, argv, HOY, {
    repoCwd: e.repoRoot,
    scriptsDir: SCRIPTS_DIR,
    onAviso: (a) => avisos.push(a),
  });
}

async function abrirMr(e: Escenario): Promise<string> {
  const r = await finish(e, [ID, '--merge-request']);
  assert.equal(r.cierre, 'esperando-merge-request');
  return (r.mergeRequest as NonNullable<typeof r.mergeRequest>).url;
}

/** La plataforma "mergea" de verdad en el bare y el doble pasa a decir `integrado`. */
async function mergearPr(e: Escenario, dbl: ControlDoble, url: string): Promise<string> {
  const headSha = ramaEnBare(e.origin.bare, e.task.rama);
  const commit = await mergearEnPlataforma(e.origin.bare, e.task.rama, 'develop', 'merge');
  dbl.escribir({
    ...dbl.leer(),
    prs: [{ estado: 'integrado', url, base: 'develop', head: e.task.rama, commit, headSha }],
  });
  return commit;
}

/** Corre `fn` con variables de entorno puestas y las restaura (aunque `fn` falle). */
async function conEntorno(vars: Record<string, string>, fn: () => Promise<void>): Promise<void> {
  const guardado = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  Object.assign(process.env, vars);
  try {
    await fn();
  } finally {
    for (const [k, v] of Object.entries(guardado)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

/** Cada llamada a glab lleva GITLAB_HOST = base y, salvo `api user`, `-R` = proyecto. */
function assertContexto(dbl: ControlDoble, base: string, proyecto: string): void {
  const reg = dbl.registro();
  assert.ok(reg.length >= 3, `se esperaban al menos api user + list + create: ${JSON.stringify(reg.map((r) => r.llamada))}`);
  for (const r of reg) {
    assert.equal(r.llamada[0], 'glab');
    assert.equal(r.entorno['GITLAB_HOST'], base, `GITLAB_HOST de ${r.llamada.join(' ')}`);
    for (const alias of ['GL_HOST', 'GITLAB_URI', 'GITLAB_API_HOST']) {
      assert.equal(r.entorno[alias], null, `${alias} no se hereda (${r.llamada.join(' ')})`);
    }
    if (r.llamada[1] === 'api') assert.equal(r.repo, null, 'api user no es de un proyecto');
    else assert.equal(r.repo, proyecto, `-R de ${r.llamada.join(' ')}`);
  }
  assert.deepEqual(
    reg.slice(0, 3).map((r) => r.llamada.slice(1, 3).join(' ')),
    ['api user', 'mr list', `api projects/${encodeURIComponent(proyecto)}/merge_requests`],
    'con instancia declarada el MR se crea por la API (glab mr create falla con una ruta), nunca con mr create'
  );
  assert.equal(dbl.llamadasDe('mr', 'create').length, 0);
}

/** Llamadas que crean un MR por API (`glab api projects/<p>/merge_requests --method=POST`). */
function creaciones(dbl: ControlDoble): string[][] {
  return dbl.leer().llamadas.filter((l) => l[1] === 'api' && (l[2] ?? '').startsWith('projects/'));
}

/** Todo lo que el flujo deja escrito o impreso, en un texto, para buscar fugas. */
async function todoLoEscrito(e: Escenario, dbl: ControlDoble, extra: unknown[]): Promise<string> {
  const md = await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8');
  return [
    JSON.stringify(extra),
    md,
    git(['log', '--format=%B', '--name-only'], e.repoRoot),
    JSON.stringify(dbl.leer()),
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Sin declaracion: la 0.6.0
// ---------------------------------------------------------------------------

test('sin config nueva, gitlab.com / un host con "gitlab" se comporta como la 0.6.0: auth status, sin -R y sin tocar GITLAB_HOST', async () => {
  await escenario(URL_GITLAB, null, async (e) => {
    await conEntorno({ GITLAB_HOST: 'https://heredado.example' }, async () => {
      await conDoblePlataforma(SIN_PRS, async (dbl) => {
        const r = await finish(e, [ID, '--merge-request']);
        assert.equal(r.mergeRequest?.url, 'https://gitlab.example.com/acme/repo/-/merge_requests/1');
        const reg = dbl.registro();
        assert.equal(reg.length, 3);
        for (const [i, prefijo] of [
          'glab auth status --hostname gitlab.example.com',
          'glab mr list --source-branch=feature/task-700-prueba-finish',
          'glab mr create --target-branch=develop',
        ].entries()) {
          assert.ok((reg[i] as (typeof reg)[number]).llamada.join(' ').startsWith(prefijo), `llamada ${i}: ${reg[i]?.llamada.join(' ')}`);
        }
        for (const x of reg) {
          assert.equal(x.repo, null, 'sin declaracion no hay -R');
          assert.equal(x.entorno['GITLAB_HOST'], 'https://heredado.example', 'el entorno pasa tal cual, como en la 0.6.0');
        }
      });
    });
  });
});

test('sin declaracion, un host que no es GitHub ni "gitlab" sigue abortando como la 0.6.0, y el mensaje apunta a la config', async () => {
  await escenario('https://git.empresa.com/acme/repo.git', null, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /el host de origin \("git\.empresa\.com"\) no es github\.com ni un host de GitLab.*plataforma_remota: gitlab.*url_base_remoto/s);
      assert.equal(dbl.leer().llamadas.length, 0);
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});

// ---------------------------------------------------------------------------
// GitLab en dominio propio: solo la plataforma
// ---------------------------------------------------------------------------

for (const [forma, origen] of [
  ['https', 'https://git.empresa.com/acme/sub/repo.git'],
  ['ssh', 'ssh://git@git.empresa.com:2222/acme/sub/repo.git'],
  ['scp', 'git@git.empresa.com:acme/sub/repo.git'],
] as const) {
  test(`GitLab en dominio propio (${forma}), solo plataforma_remota: la base es https://<host de origin> y el proyecto sale de la ruta`, async () => {
    await escenario(origen, 'plataforma_remota: gitlab\n', async (e) => {
      await conDoblePlataforma(SIN_PRS, async (dbl) => {
        const r = await finish(e, [ID, '--merge-request']);
        assert.deepEqual(r.mergeRequest, {
          url: 'https://git.empresa.com/acme/sub/repo/-/merge_requests/1',
          plataforma: 'gitlab',
          accion: 'abierto',
        });
        assertContexto(dbl, 'https://git.empresa.com', 'acme/sub/repo');
        const [crear] = creaciones(dbl);
        assert.ok(crear?.includes('--method=POST'));
        assert.ok(crear?.includes('--raw-field=target_branch=develop'));
        assert.ok(crear?.includes(`--raw-field=source_branch=${e.task.rama}`));
        assert.ok(crear?.some((a) => a.startsWith('--raw-field=title=') && a.includes(ID)));
        assert.equal(dbl.llamadasDe('auth', 'status').length, 0, 'la sesion se comprueba con api user, no con auth status');
      });
      assert.notEqual(ramaEnBare(e.origin.bare, e.task.rama), null, 'la rama se subio');
    });
  });
}

// ---------------------------------------------------------------------------
// GitLab bajo una ruta
// ---------------------------------------------------------------------------

for (const [forma, origen, base] of [
  ['https', ORIGEN_SUB_HTTPS, BASE_SUB],
  ['https con la base escrita con mayusculas y barra final', ORIGEN_SUB_HTTPS, 'HTTPS://Servidor.Example/ruta/gitlab/'],
  ['ssh://', 'ssh://git@servidor.example:2222/ruta/gitlab/grupo/sub/repo.git', BASE_SUB],
  ['scp', 'git@servidor.example:ruta/gitlab/grupo/sub/repo.git', BASE_SUB],
  ['ssh:// sin la ruta de la instancia (relative_url_root)', 'ssh://git@servidor.example:2222/grupo/sub/repo.git', BASE_SUB],
  ['scp sin la ruta de la instancia (relative_url_root)', 'git@servidor.example:grupo/sub/repo.git', BASE_SUB],
] as const) {
  test(`GitLab bajo una ruta (${forma}): GITLAB_HOST es la base con su ruta y -R el proyecto relativo, y el primer y el segundo finish usan lo mismo`, async () => {
    await escenario(origen, `plataforma_remota: gitlab\nurl_base_remoto: ${base}\n`, async (e) => {
      await conDoblePlataforma(SIN_PRS, async (dbl) => {
        const url = await abrirMr(e);
        assert.equal(url, 'https://servidor.example/ruta/gitlab/grupo/sub/repo/-/merge_requests/1');
        assertContexto(dbl, BASE_SUB, 'grupo/sub/repo');
        assert.notEqual(ramaEnBare(e.origin.bare, e.task.rama), null);
        const md = await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8');
        assert.match(md, /- URL del merge request: https:\/\/servidor\.example\/ruta\/gitlab\/grupo\/sub\/repo\/-\/merge_requests\/1/);

        // Segundo finish, contra la misma instancia: consulta el estado alli y cierra.
        const antes = dbl.registro().length;
        const commit = await mergearPr(e, dbl, url);
        const r = await finish(e, [ID]);
        assert.equal(r.cierre, 'terminada');
        assert.equal(r.mergeRequest?.accion, 'integrado');
        assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', commit, 'develop'], { cwd: e.repoRoot }).status, 0);
        const segundo = dbl.registro().slice(antes);
        assert.deepEqual(
          segundo.map((x) => x.llamada.slice(1, 3).join(' ')),
          ['api user', 'mr list'],
          'el segundo finish comprueba la sesion y consulta el estado, y no crea otro MR'
        );
        for (const x of segundo) {
          assert.equal(x.entorno['GITLAB_HOST'], BASE_SUB);
          if (x.llamada[1] === 'mr') assert.equal(x.repo, 'grupo/sub/repo');
        }
        assert.equal(creaciones(dbl).length, 1);
        assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), 'develop');
      });
    });
  });
}

test('plataforma_remota: github declarada en un host propio usa gh (como hoy) y no pone GITLAB_HOST ni -R', async () => {
  await escenario('https://git.empresa.com/acme/repo.git', 'plataforma_remota: github\n', async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const r = await finish(e, [ID, '--merge-request']);
      assert.deepEqual(r.mergeRequest, { url: 'https://github.com/acme/repo/pull/1', plataforma: 'github', accion: 'abierto' });
      const reg = dbl.registro();
      assert.equal(reg.length, 3);
      for (const [i, prefijo] of [
        'gh auth status --hostname git.empresa.com',
        'gh pr list --head=feature/task-700-prueba-finish',
        'gh pr create --base=develop',
      ].entries()) {
        assert.ok((reg[i] as (typeof reg)[number]).llamada.join(' ').startsWith(prefijo), `llamada ${i}: ${reg[i]?.llamada.join(' ')}`);
      }
      for (const x of dbl.registro()) assert.equal(x.repo, null);
    });
  });
});

// ---------------------------------------------------------------------------
// La base no encaja con origin: aborta antes de subir nada
// ---------------------------------------------------------------------------

for (const [que, origen, base, causa] of [
  ['otra ruta', 'https://servidor.example/otra/grupo/repo.git', BASE_SUB, 'ruta'],
  ['un segmento a medias', 'https://servidor.example/ruta/gitlab2/grupo/repo.git', BASE_SUB, 'ruta'],
  ['otro host', 'https://otro.example/ruta/gitlab/grupo/repo.git', BASE_SUB, 'host'],
  ['otro puerto', 'https://servidor.example:8443/ruta/gitlab/grupo/repo.git', BASE_SUB, 'puerto'],
  ['ssh de otro host', 'git@otro.example:grupo/repo.git', BASE_SUB, 'host'],
  ['http con otra ruta', 'http://servidor.example/otra/grupo/repo.git', BASE_SUB, 'ruta'],
  ['solo el proyecto, sin namespace', 'https://servidor.example/ruta/gitlab/repo.git', BASE_SUB, 'proyecto-corto'],
] as const) {
  test(`la base no encaja con origin (${que}): aborta nombrando la clave, sin llamar a glab ni subir nada`, async () => {
    await escenario(origen, `plataforma_remota: gitlab\nurl_base_remoto: ${base}\n`, async (e) => {
      await conDoblePlataforma(SIN_PRS, async (dbl) => {
        await assert.rejects(
          () => finish(e, [ID, '--merge-request']),
          (err: unknown) => {
            const m = (err as Error).message;
            assert.match(m, /la clave "url_base_remoto" \(https:\/\/servidor\.example\/ruta\/gitlab\) de \.taskcode\/config\.yml no es prefijo de la URL de origin/);
            assert.ok(m.includes(`: ${causa}.`), `causa ${causa} en: ${m}`);
            assert.match(m, /No se ha subido nada/);
            return true;
          }
        );
        assert.equal(dbl.leer().llamadas.length, 0, 'ni siquiera se lanzo glab');
      });
      assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null, 'ls-remote: la rama NO se subio');
      assert.equal(ramaEnBare(e.origin.bare, 'develop'), git(['rev-parse', 'develop'], e.repoRoot).trim());
    });
  });
}

test('solo plataforma: gitlab con una origin sin proyecto deducible tampoco sube nada', async () => {
  await escenario('https://git.empresa.com/repo.git', 'plataforma_remota: gitlab\n', async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /no se deduce un proyecto grupo\/repo \(proyecto-corto\).*url_base_remoto/s);
      assert.equal(dbl.leer().llamadas.length, 0);
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});

test('config incoherente (url sin plataforma, con github, con userinfo): aborta como config roto antes de tocar nada', async () => {
  for (const [config, patron] of [
    ['url_base_remoto: https://servidor.example\n', /necesita tambien "plataforma_remota: gitlab"/],
    ['plataforma_remota: github\nurl_base_remoto: https://servidor.example\n', /solo vale con "plataforma_remota: gitlab"/],
    ['plataforma_remota: gitlab\nurl_base_remoto: https://usuario:secreto@servidor.example\n', /lleva un "@"/],
    ['plataforma_remota: gitlab\nurl_base_remoto: http://servidor.example\n', /debe empezar por https/],
  ] as const) {
    await escenario(ORIGEN_SUB_HTTPS, null, async (e) => {
      // Se escribe y se commitea a mano: setup no admite un config invalido.
      await mkdir(path.join(e.repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
      commitAll(e.repoRoot, 'chore: config roto');
      await conDoblePlataforma(SIN_PRS, async (dbl) => {
        await assert.rejects(
          () => finish(e, [ID, '--merge-request']),
          (err: unknown) => {
            assert.match((err as Error).message, patron);
            assert.doesNotMatch((err as Error).message, /secreto/);
            return true;
          }
        );
        assert.equal(dbl.leer().llamadas.length, 0);
      });
      assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
    });
  }
});

// ---------------------------------------------------------------------------
// Credenciales y token
// ---------------------------------------------------------------------------

test('una URL de origin con credenciales no aparece en la salida, tarea.md, los commits ni las llamadas del doble, ni en los abortos', async () => {
  const conCreds = 'https://usuario:secreto@servidor.example/ruta/gitlab/grupo/sub/repo.git';
  await escenario(conCreds, CFG_SUB, async (e) => {
    const avisos: string[] = [];
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const r = await finish(e, [ID, '--merge-request'], avisos);
      assert.equal(r.mergeRequest?.plataforma, 'gitlab');
      assertContexto(dbl, BASE_SUB, 'grupo/sub/repo');
      const todo = await todoLoEscrito(e, dbl, [r, avisos]);
      assert.doesNotMatch(todo, /secreto|usuario:/);
      // Y el segundo finish tambien.
      const url = r.mergeRequest?.url as string;
      await mergearPr(e, dbl, url);
      const r2 = await finish(e, [ID], avisos);
      assert.doesNotMatch(JSON.stringify([r2, avisos, dbl.leer()]), /secreto|usuario:/);
    });
  });
  // Abortos: base que no encaja, sin sesion e instancia inalcanzable (el doble pone credenciales en su stderr).
  for (const [config, estado] of [
    ['plataforma_remota: gitlab\nurl_base_remoto: https://servidor.example/otra\n', SIN_PRS],
    [CFG_SUB, { ...SIN_PRS, auth: false }],
    [CFG_SUB, { ...SIN_PRS, inalcanzable: true }],
  ] as const) {
    await escenario(conCreds, config, async (e) => {
      await conDoblePlataforma(estado, async () => {
        await assert.rejects(
          () => finish(e, [ID, '--merge-request']),
          (err: unknown) => {
            assert.doesNotMatch((err as Error).message, /secreto|usuario:/);
            return true;
          }
        );
      });
      assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
    });
  }
});

test('GITLAB_HOST (y alias) heredados del entorno se ignoran: cada llamada lleva el de la config; GITLAB_TOKEN se hereda y no se imprime', async () => {
  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
    await conEntorno(
      {
        GITLAB_HOST: 'https://otro.example/x',
        GL_HOST: 'otro.example',
        GITLAB_URI: 'https://uri.example',
        GITLAB_API_HOST: 'api.example',
        GITLAB_TOKEN: 'tok-secreto-xyz',
      },
      async () => {
        const avisos: string[] = [];
        await conDoblePlataforma(SIN_PRS, async (dbl) => {
          const r = await finish(e, [ID, '--merge-request'], avisos);
          assertContexto(dbl, BASE_SUB, 'grupo/sub/repo');
          for (const x of dbl.registro()) assert.equal(x.entorno['GITLAB_TOKEN'], '<definido>', 'el token llega a glab');
          assert.doesNotMatch(await todoLoEscrito(e, dbl, [r, avisos]), /tok-secreto-xyz/);
        });
      }
    );
  });
});

// ---------------------------------------------------------------------------
// Sin sesion, sin CLI o instancia inalcanzable: aborta antes de subir
// ---------------------------------------------------------------------------

test('sin sesion (api user falla) aborta antes de subir nada, diciendo como iniciar sesion o usar GITLAB_TOKEN', async () => {
  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
    await conDoblePlataforma({ ...SIN_PRS, auth: false }, async (dbl) => {
      await assert.rejects(
        () => finish(e, [ID, '--merge-request']),
        /"glab" no tiene sesion valida en servidor\.example\/ruta\/gitlab o la instancia no responde.*glab auth login --hostname servidor\.example\/ruta\/gitlab.*GITLAB_TOKEN.*No se ha subido nada/s
      );
      assert.deepEqual(dbl.registro().map((x) => x.llamada.slice(1, 3).join(' ')), ['api user'], 'solo la comprobacion de sesion');
      assert.equal(dbl.registro()[0]?.entorno['GITLAB_HOST'], BASE_SUB);
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});

test('instancia inalcanzable aborta antes de subir nada y la URL con credenciales del error de glab sale tachada', async () => {
  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
    await conDoblePlataforma({ ...SIN_PRS, inalcanzable: true }, async (dbl) => {
      await assert.rejects(
        () => finish(e, [ID, '--merge-request']),
        (err: unknown) => {
          const m = (err as Error).message;
          assert.match(m, /o la instancia no responde.*dial tcp/s);
          assert.match(m, /\*\*\*@/, 'ocultarCredenciales se aplico al detalle');
          assert.doesNotMatch(m, /secreto|usuario:/);
          return true;
        }
      );
      assert.equal(creaciones(dbl).length, 0);
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});

test('sin el CLI instalado aborta antes de subir nada, diciendo que instalar y como autenticarse en esa instancia', async () => {
  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
    await sinPlataformasEnElPath(async () => {
      await assert.rejects(
        () => finish(e, [ID, '--merge-request']),
        /no se pudo ejecutar "glab".*Instala GitLab CLI.*glab auth login --hostname servidor\.example\/ruta\/gitlab.*GITLAB_TOKEN.*No se ha subido nada/s
      );
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});

// ---------------------------------------------------------------------------
// Segundo finish: mismas reglas que en la 0.6.0, contra la misma instancia
// ---------------------------------------------------------------------------

test('segundo finish contra la instancia declarada: abierto, cerrado y estado desconocido abortan sin tocar nada; mergeado cierra', async () => {
  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      const antes = git(['rev-parse', 'HEAD'], e.repoRoot).trim();

      dbl.escribir({ ...dbl.leer(), prs: [{ estado: 'abierto', url, base: 'develop', head: e.task.rama }] });
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /sigue abierto/);

      dbl.escribir({ ...dbl.leer(), prs: [{ estado: 'cerrado', url, base: 'develop', head: e.task.rama }] });
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /esta CERRADO sin mergear/);

      dbl.escribir({ ...dbl.leer(), listarFalla: true });
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /no se pudo saber el estado del merge request/);

      assert.equal(git(['rev-parse', 'HEAD'], e.repoRoot).trim(), antes, 'nada commiteado');
      assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), e.task.rama);
      for (const x of dbl.registro().filter((r) => r.llamada[1] === 'mr')) {
        assert.equal(x.entorno['GITLAB_HOST'], BASE_SUB);
        assert.equal(x.repo, 'grupo/sub/repo');
      }

      dbl.escribir({ ...dbl.leer(), listarFalla: false });
      await mergearPr(e, dbl, url);
      const r = await finish(e, [ID, '--merge-request']);
      assert.equal(r.cierre, 'terminada');
    });
  });
});

test('segundo finish con un commit local que no llego al MR aborta sin tocar nada (misma regla que la 0.6.0)', async () => {
  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      await writeFile(path.join(e.repoRoot, 'extra.txt'), 'trabajo que no llego al MR\n', 'utf8');
      commitAll(e.repoRoot, 'extra');
      await mergearPr(e, dbl, url);
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /tiene 1 commit\(s\) locales que no estaban en el merge request/);
      assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), e.task.rama);
    });
  });
});

// ---------------------------------------------------------------------------
// Creacion por API (glab mr create no vale bajo una ruta)
// ---------------------------------------------------------------------------

test('el MR de una instancia bajo una ruta se crea por la API: glab mr create real falla ahi y el doble lo reproduce', async () => {
  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      // Contraprueba: con el camino viejo (mr create + GITLAB_HOST con ruta) el doble responde lo que glab real.
      await conEntorno({ GITLAB_HOST: BASE_SUB }, async () => {
        const r = spawnSync('glab', ['mr', 'create', '-R', 'grupo/sub/repo', '--target-branch=develop', '--source-branch=x', '--title=t', '--yes'], {
          cwd: e.repoRoot,
          encoding: 'utf8',
          env: process.env,
        });
        assert.equal(r.status, 1);
        assert.match(r.stderr, /None of the git remotes configured for this repository correspond to the GITLAB_HOST/);
      });
      dbl.escribir(SIN_PRS);
      const url = await abrirMr(e);
      assert.equal(url, 'https://servidor.example/ruta/gitlab/grupo/sub/repo/-/merge_requests/1');
      assert.equal(dbl.llamadasDe('mr', 'create').length, 0);
      assert.equal(creaciones(dbl).length, 1);
    });
  });
});

test('la creacion por API pasa un titulo con guion inicial y comillas como un solo argumento, sin interpretarlo como flag', async () => {
  const raro = '-x --flag "entre comillas" y \'simples\'';
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await montarOrigin(repoRoot, ORIGEN_SUB_HTTPS);
    try {
      const task = sampleTask({ titulo: raro });
      await setupTaskEnRevision(repoRoot, tareasRoot, task);
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), CFG_SUB, 'utf8');
      commitAll(repoRoot, 'chore: config');
      const e: Escenario = { repoRoot, tareasRoot, origin, task };
      await conDoblePlataforma(SIN_PRS, async (dbl) => {
        await abrirMr(e);
        const [crear] = creaciones(dbl);
        assert.ok(crear?.includes(`--raw-field=title=${ID}: ${raro}`), JSON.stringify(crear));
        assert.equal(dbl.leer().prs[0]?.titulo, `${ID}: ${raro}`);
      });
    } finally {
      await origin.limpiar();
    }
  });
});

test('si la creacion por API falla, la rama ya subida se dice y un reintento no duplica', async () => {
  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
    await conDoblePlataforma({ ...SIN_PRS, crearFalla: true }, async (dbl) => {
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /ya esta subida a origin, pero "glab" no pudo crear el merge request/);
      dbl.escribir({ prs: [] });
      assert.equal((await abrirMr(e)).includes('/merge_requests/1'), true);
    });
  });
});

test('origin http con puerto y solo plataforma gitlab aborta antes de subir pidiendo url_base_remoto', async () => {
  await escenario('http://servidor.example:8080/grupo/repo.git', 'plataforma_remota: gitlab\n', async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /origin es http con puerto.*glab solo habla https.*url_base_remoto/s);
      assert.equal(dbl.leer().llamadas.length, 0);
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});

// ---------------------------------------------------------------------------
// Clave desconocida: aviso por el CLI de verdad
// ---------------------------------------------------------------------------

async function capturar(fn: () => Promise<number>): Promise<{ code: number; out: string; err: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const o = process.stdout.write.bind(process.stdout);
  const er = process.stderr.write.bind(process.stderr);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process.stdout as any).write = (c: string) => (out.push(String(c)), true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process.stderr as any).write = (c: string) => (err.push(String(c)), true);
  try {
    const code = await fn();
    return { code, out: out.join(''), err: err.join('') };
  } finally {
    process.stdout.write = o;
    process.stderr.write = er;
  }
}

test('main: una clave desconocida en la config avisa UNA vez por stderr y el finish --merge-request sigue adelante', async () => {
  await escenario(ORIGEN_SUB_HTTPS, `${CFG_SUB}limite_wp: 2\n`, async (e) => {
    const cwdAntes = process.cwd();
    process.chdir(e.repoRoot);
    try {
      reiniciarAvisosDeConfig();
      await conDoblePlataforma(SIN_PRS, async () => {
        const r = await capturar(() => main(['finish', ID, '--merge-request']));
        assert.equal(r.code, 0, r.err);
        const avisos = r.err.match(/\[AVISO\][^\n]*clave desconocida "limite_wp"/g) ?? [];
        assert.equal(avisos.length, 1, `un solo aviso aunque la config se resuelva varias veces:\n${r.err}`);
        assert.match(r.err, /Quiza quisiste decir "limite_wip"/);
        assert.match(r.out, /merge request|pull request/);
      });
    } finally {
      process.chdir(cwdAntes);
    }
    assert.notEqual(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});

test('main: una clave conocida con un valor invalido sigue abortando (codigo 1) y no sube nada', async () => {
  await escenario(ORIGEN_SUB_HTTPS, `${CFG_SUB}limite_wip: 0\n`, async (e) => {
    const cwdAntes = process.cwd();
    process.chdir(e.repoRoot);
    try {
      await conDoblePlataforma(SIN_PRS, async () => {
        const r = await capturar(() => main(['finish', ID, '--merge-request']));
        assert.equal(r.code, 1);
        assert.match(r.err, /limite_wip/);
      });
    } finally {
      process.chdir(cwdAntes);
    }
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});
