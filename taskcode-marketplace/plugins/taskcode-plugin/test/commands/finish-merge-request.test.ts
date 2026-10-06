/**
 * `taskctl finish --merge-request` (TASK-060, criterios 5 a 8 y 11): repos Git
 * temporales de verdad con un remoto bare real (`montarOrigin`), y un
 * ejecutable `gh` / `glab` de prueba en el PATH que lee y escribe un fichero
 * de estado (`conDoblePlataforma`): el UNICO doble de la suite, porque
 * GitHub y GitLab no estan en el CI. Lo que la "plataforma" hace al mergear
 * (merge, squash) se hace de verdad en el bare con `mergearEnPlataforma`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
import { main } from '../../src/cli.js';
import type { Task } from '../../src/core/task.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
import {
  montarOrigin,
  mergearEnPlataforma,
  ramaEnBare,
  tagsEnBare,
  URL_GITHUB,
  URL_GITLAB,
  type Origin,
} from '../helpers/finish-origin.js';
import {
  conDoblePlataforma,
  sinPlataformasEnElPath,
  type ControlDoble,
  type EstadoDoble,
} from '../helpers/plataforma-doble.js';

const HOY = '2026-10-06';
const ID = 'TASK-700';

interface Escenario {
  repoRoot: string;
  tareasRoot: string;
  origin: Origin;
  task: Task;
}

/** Repo con origin bare bajo `url`, y la tarea en-revision en su rama (que es la rama actual). */
async function escenario(url: string, fn: (e: Escenario) => Promise<void>, task: Task = sampleTask()): Promise<void> {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await montarOrigin(repoRoot, url);
    try {
      await setupTaskEnRevision(repoRoot, tareasRoot, task);
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

/** HEAD, rama actual, develop local, tags y carpeta de la tarea: lo que "no tocar nada" debe dejar igual. */
function huella(e: Escenario): string {
  return [
    git(['rev-parse', 'HEAD'], e.repoRoot).trim(),
    git(['branch', '--show-current'], e.repoRoot).trim(),
    git(['rev-parse', 'develop'], e.repoRoot).trim(),
    git(['tag', '-l'], e.repoRoot).trim(),
    existsSync(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md')),
    ramaEnBare(e.origin.bare, 'develop') ?? '-',
  ].join('|');
}

const SIN_PRS: EstadoDoble = { prs: [] };

/** Primer finish --merge-request (con el doble ya en el PATH). Devuelve la URL del PR. */
async function abrirMr(e: Escenario, extra: string[] = []): Promise<string> {
  const r = await finish(e, [ID, '--merge-request', ...extra]);
  assert.equal(r.cierre, 'esperando-merge-request');
  return (r.mergeRequest as NonNullable<typeof r.mergeRequest>).url;
}

/** La plataforma "mergea": el merge ocurre de verdad en el bare y el doble pasa a decir `integrado`. */
async function mergearPr(e: Escenario, dbl: ControlDoble, url: string, modo: 'merge' | 'squash' | 'rebase', informar = true): Promise<string> {
  // La punta que integra la plataforma es la que hay en el remoto al mergear.
  const headSha = ramaEnBare(e.origin.bare, e.task.rama);
  const commit = await mergearEnPlataforma(e.origin.bare, e.task.rama, 'develop', modo);
  const estado = dbl.leer();
  dbl.escribir({
    ...estado,
    prs: [{ estado: 'integrado', url, base: 'develop', head: e.task.rama, commit: informar ? commit : null, headSha }],
  });
  return commit;
}

// ---------------------------------------------------------------------------
// Criterio 6: preflight, antes de subir nada
// ---------------------------------------------------------------------------

test('--merge-request sin el CLI instalado aborta antes de subir nada, diciendo que instalar', async () => {
  await escenario(URL_GITHUB, async (e) => {
    const antes = huella(e);
    await sinPlataformasEnElPath(async () => {
      await assert.rejects(
        () => finish(e, [ID, '--merge-request']),
        (err: unknown) => {
          assert.ok(err instanceof FinishCommandError);
          assert.match((err as Error).message, /no se pudo ejecutar "gh"/);
          assert.match((err as Error).message, /Instala GitHub CLI/);
          assert.match((err as Error).message, /No se ha subido nada/);
          return true;
        }
      );
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null, 'la rama NO se subio (ls-remote)');
    assert.equal(huella(e), antes);
  });
});

test('--merge-request con el CLI sin autenticar aborta antes de subir nada', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma({ ...SIN_PRS, auth: false }, async (dbl) => {
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /"gh" no esta autenticado en github\.com.*gh auth login/s);
      assert.equal(dbl.llamadasDe('pr', 'create').length, 0);
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
  await escenario(URL_GITLAB, async (e) => {
    await conDoblePlataforma({ ...SIN_PRS, auth: false }, async () => {
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /"glab" no esta autenticado en gitlab\.example\.com.*glab auth login/s);
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});

test('--merge-request con un host de origin desconocido aborta nombrando que configurar, sin suponer GitLab ni subir nada', async () => {
  await escenario('https://git.ejemplo.org/acme/repo.git', async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      await assert.rejects(
        () => finish(e, [ID, '--merge-request']),
        (err: unknown) => {
          const m = (err as Error).message;
          assert.match(m, /el host de origin \("git\.ejemplo\.org"\) no es github\.com ni un host de GitLab/);
          assert.match(m, /No se supone GitLab/);
          assert.doesNotMatch(m, /acme\/repo/, 'no vuelca la URL');
          return true;
        }
      );
      assert.equal(dbl.leer().llamadas.length, 0, 'ni siquiera se lanzo un CLI');
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});

test('--merge-request con un origin que no es una URL de red (ruta local) o sin origin aborta antes de subir nada', async () => {
  await escenario(URL_GITHUB, async (e) => {
    git(['remote', 'set-url', 'origin', e.origin.bare], e.repoRoot);
    await conDoblePlataforma(SIN_PRS, async () => {
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /no apunta a una URL de red/);
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
  await escenario(URL_GITHUB, async (e) => {
    git(['remote', 'remove', 'origin'], e.repoRoot);
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /este repo no tiene ninguno/);
      assert.equal(dbl.leer().llamadas.length, 0);
    });
  });
});

test('--merge-request en un hotfix o release aborta: no tiene merge request', async () => {
  const task = sampleTask({ id: 'TASK-720', tipo: 'hotfix', rama: 'hotfix/task-720-urgente' });
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await montarOrigin(repoRoot);
    try {
      await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
      await conDoblePlataforma(SIN_PRS, async () => {
        await assert.rejects(
          () => runFinishCommand(tareasRoot, ['TASK-720', '--merge-request'], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
          /un hotfix se cierra con merge a la rama principal, tag y backmerge: no tiene merge request/
        );
      });
      assert.equal(ramaEnBare(origin.bare, task.rama), null);
    } finally {
      await origin.limpiar();
    }
  });
});

// ---------------------------------------------------------------------------
// Criterio 5: abrir el PR / MR
// ---------------------------------------------------------------------------

test('--merge-request (GitHub): sube la rama SIN --push, abre el PR contra la base, anota la URL y deja la tarea en en-revision', async () => {
  await escenario(URL_GITHUB, async (e) => {
    const ramaAntes = git(['rev-parse', 'HEAD'], e.repoRoot).trim();
    const developAntes = git(['rev-parse', 'develop'], e.repoRoot).trim();
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const r = await finish(e, [ID, '--merge-request']);

      assert.equal(r.cierre, 'esperando-merge-request');
      assert.deepEqual(r.mergeRequest, { url: 'https://github.com/acme/repo/pull/1', plataforma: 'github', accion: 'abierto' });
      // La rama esta en el remoto aunque no hubo --push (y es lo que habia al llamar: la anotacion no se sube).
      assert.equal(ramaEnBare(e.origin.bare, e.task.rama), ramaAntes);
      assert.equal(r.autoCommit.push, 'no-solicitado');
      // Se busco un PR existente ANTES de crear, y se creo uno contra develop desde la rama de la tarea.
      const llamadas = dbl.leer().llamadas.map((l) => `${l[0]} ${l[1]} ${l[2]}`);
      assert.deepEqual(llamadas, ['gh auth status', 'gh pr list', 'gh pr create']);
      const [crear] = dbl.llamadasDe('pr', 'create');
      assert.ok(crear?.includes('--base=develop'));
      assert.ok(crear?.includes(`--head=${e.task.rama}`));
      assert.ok(crear?.some((a) => a.startsWith('--title=') && a.includes(ID)));
    });
    // La tarea sigue en-revision, con la URL anotada, y la anotacion esta commiteada en SU rama.
    const t = await readTareaFile(e.tareasRoot, ID);
    assert.equal(t?.task.estado, 'en-revision');
    assert.match(t?.filePath ?? '', /03-en-revision/);
    const md = await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8');
    assert.match(md, /## Merge request\s+- URL del merge request: https:\/\/github\.com\/acme\/repo\/pull\/1\s+- Plataforma: github/);
    assert.match(git(['log', '-1', '--format=%s'], e.repoRoot), /chore\(TASK-700\): merge request abierto/);
    assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), e.task.rama);
    assert.equal(git(['rev-parse', 'develop'], e.repoRoot).trim(), developAntes, 'no se mergeo nada');
    assert.equal(git(['status', '--porcelain'], e.repoRoot).trim(), '');
  });
});

test('--merge-request --push sube tambien el commit de la anotacion', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async () => {
      const r = await finish(e, [ID, '--merge-request', '--push']);
      assert.equal(r.autoCommit.push, 'empujado');
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), git(['rev-parse', 'HEAD'], e.repoRoot).trim());
  });
});

test('--merge-request (GitLab, incluido autoalojado): usa glab y abre el MR contra la base', async () => {
  await escenario(URL_GITLAB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const r = await finish(e, [ID, '--merge-request']);
      assert.deepEqual(r.mergeRequest, {
        url: 'https://gitlab.example.com/acme/repo/-/merge_requests/1',
        plataforma: 'gitlab',
        accion: 'abierto',
      });
      const [crear] = dbl.llamadasDe('mr', 'create');
      assert.equal(crear?.[0], 'glab');
      assert.ok(crear?.includes('--target-branch=develop'));
      assert.ok(crear?.includes(`--source-branch=${e.task.rama}`));
      assert.ok(crear?.includes('--yes'));
    });
    assert.match(await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8'), /Plataforma: gitlab/);
  });
});

test('--merge-request no duplica: con un PR ya abierto de esa rama no crea otro ni sube nada', async () => {
  await escenario(URL_GITHUB, async (e) => {
    const antes = huella(e);
    const abierto = { estado: 'abierto' as const, url: 'https://github.com/acme/repo/pull/41', base: 'develop', head: e.task.rama };
    await conDoblePlataforma({ prs: [abierto] }, async (dbl) => {
      await assert.rejects(
        () => finish(e, [ID, '--merge-request']),
        /el merge request de "feature\/task-700-prueba-finish" sigue abierto \(https:\/\/github\.com\/acme\/repo\/pull\/41\)/
      );
      assert.equal(dbl.llamadasDe('pr', 'create').length, 0);
    });
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
    assert.equal(huella(e), antes);
  });
});

test('--merge-request: si el CLI falla al crear, la rama ya subida se dice y un reintento no duplica ni pierde nada', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma({ ...SIN_PRS, crearFalla: true }, async (dbl) => {
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /ya esta subida a origin, pero "gh" no pudo crear el merge request/);
      assert.equal(existsSync(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md')), true);
      assert.doesNotMatch(await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8'), /Merge request/);
      dbl.escribir({ prs: [] });
      const r = await finish(e, [ID, '--merge-request']);
      assert.equal(r.mergeRequest?.accion, 'abierto');
    });
  });
});

test('--merge-request --tag: el tag NO se pone en el primer finish; un nombre invalido o repetido aborta antes de subir', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      await assert.rejects(() => finish(e, [ID, '--merge-request', '--tag=con espacio']), /no es un nombre de tag valido/);
      git(['tag', 'ya-existe', 'main'], e.repoRoot);
      await assert.rejects(() => finish(e, [ID, '--merge-request', '--tag', 'ya-existe']), /ya existe en local/);
      assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null, 'ninguno de los dos subio nada');
      assert.equal(dbl.llamadasDe('pr', 'create').length, 0);

      const r = await finish(e, [ID, '--merge-request', '--tag', 'v1.0.0']);
      assert.equal(r.tag, null);
      assert.equal(r.tagSolicitado, 'v1.0.0');
      assert.equal(git(['tag', '-l', 'v1.0.0'], e.repoRoot).trim(), '', 'sin tag todavia');
    });
  });
});

// ---------------------------------------------------------------------------
// Criterio 7 y 8: el segundo finish
// ---------------------------------------------------------------------------

test('segundo finish con el MR ABIERTO aborta sin tocar nada (con --merge-request y sin el, por la anotacion de tarea.md)', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      await abrirMr(e);
      const antes = huella(e);
      const creates = dbl.llamadasDe('pr', 'create').length;
      for (const argv of [[ID, '--merge-request'], [ID]]) {
        await assert.rejects(() => finish(e, argv), /sigue abierto \(https:\/\/github\.com\/acme\/repo\/pull\/1\)/);
        assert.equal(huella(e), antes);
      }
      assert.equal(dbl.llamadasDe('pr', 'create').length, creates, 'no se abrio otro');
    });
  });
});

test('segundo finish con el MR mergeado (merge commit): fetch, ff de develop, tarea a terminada y CHANGELOG/INDEX/BOARD', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      const commit = await mergearPr(e, dbl, url, 'merge');

      const r = await finish(e, [ID, '--merge-request']);

      assert.equal(r.cierre, 'terminada');
      assert.equal(r.mergeRequest?.accion, 'integrado');
      assert.equal(r.tag, null);
      assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), 'develop');
      // develop local avanzo hasta el merge de la plataforma (y el commit de cierre va encima).
      assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', commit, 'develop'], { cwd: e.repoRoot }).status, 0);
      assert.match(git(['log', '-1', '--format=%s'], e.repoRoot), /chore\(TASK-700\): tarea terminada/);
      assert.equal((await readTareaFile(e.tareasRoot, ID))?.task.estado, 'terminada');
      assert.match(await readFile(r.changelogPath, 'utf8'), /TASK-700 \(feature\)/);
      assert.match(await readFile(r.indexPath, 'utf8'), /TASK-700/);
      assert.match(await readFile(r.boardPath, 'utf8'), /TASK-700/);
      assert.equal(existsSync(path.join(e.tareasRoot, '03-en-revision', ID)), false);
      assert.equal(git(['status', '--porcelain'], e.repoRoot).trim(), '');
      assert.equal(git(['tag', '-l'], e.repoRoot).trim(), '', 'sin --tag no hay tag');
    });
  });
});

test('segundo finish SIN repetir el flag tambien cierra (la anotacion de tarea.md lo lleva por el camino del MR)', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      await mergearPr(e, dbl, url, 'merge');
      const r = await finish(e, [ID]);
      assert.equal(r.cierre, 'terminada');
      assert.equal(r.mergeRequest?.accion, 'integrado');
    });
  });
});

test('segundo finish con el MR mergeado por SQUASH + --tag --push: la rama no es ancestro, el tag va sobre el commit que da la plataforma y sube', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e, ['--tag', 'v1.2.0']);
      const squash = await mergearPr(e, dbl, url, 'squash');

      const r = await finish(e, [ID, '--merge-request', '--tag', 'v1.2.0', '--push']);

      assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', e.task.rama, 'develop'], { cwd: e.repoRoot }).status, 1, 'squash: la rama NO es ancestro');
      assert.equal(r.cierre, 'terminada');
      assert.equal(git(['rev-parse', 'v1.2.0^{commit}'], e.repoRoot).trim(), squash, 'el tag va sobre el commit del merge de la plataforma, no sobre HEAD');
      assert.notEqual(git(['rev-parse', 'HEAD'], e.repoRoot).trim(), squash);
      assert.equal(git(['cat-file', '-t', 'refs/tags/v1.2.0'], e.repoRoot).trim(), 'tag');
      assert.equal(git(['for-each-ref', '--format=%(contents:subject)', 'refs/tags/v1.2.0'], e.repoRoot).trim(), e.task.titulo);
      assert.equal(r.tag?.subida, 'subido');
      assert.deepEqual(tagsEnBare(e.origin.bare), ['v1.2.0']);
      assert.equal(git(['--git-dir', e.origin.bare, 'rev-parse', 'v1.2.0^{commit}'], e.repoRoot).trim(), squash);
      assert.equal(ramaEnBare(e.origin.bare, 'develop'), git(['rev-parse', 'develop'], e.repoRoot).trim());
    });
  });
});

test('segundo finish --tag sin --push: el tag queda en local y no sale al bare', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      await mergearPr(e, dbl, url, 'merge');
      const r = await finish(e, [ID, '--merge-request', '--tag', 'v3']);
      assert.equal(r.tag?.subida, 'no-solicitada');
      assert.deepEqual(tagsEnBare(e.origin.bare), []);
      assert.equal(git(['tag', '-l'], e.repoRoot).trim(), 'v3');
    });
  });
});

test('segundo finish con el MR CERRADO sin mergear aborta y lo dice, sin tocar nada', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      dbl.escribir({ ...dbl.leer(), prs: [{ estado: 'cerrado', url, base: 'develop', head: e.task.rama }] });
      const antes = huella(e);
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /esta CERRADO sin mergear/);
      assert.equal(huella(e), antes);
    });
  });
});

test('segundo finish sin poder saber el estado (red caida, error del CLI) aborta sin tocar nada y sin credenciales en el mensaje', async () => {
  await escenario('https://usuario:secreto@github.com/acme/repo.git', async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      const antes = huella(e);
      dbl.escribir({ ...dbl.leer(), listarFalla: true });
      await assert.rejects(
        () => finish(e, [ID, '--merge-request']),
        (err: unknown) => {
          const m = (err as Error).message;
          assert.match(m, /no se pudo saber el estado del merge request/);
          assert.doesNotMatch(m, /secreto|usuario:/, 'la URL con credenciales que repite el CLI se oculta');
          assert.match(m, /\*\*\*@github\.com/);
          return true;
        }
      );
      assert.equal(huella(e), antes);
      assert.match(url, /pull\/1$/);
    });
  });
});

test('segundo finish con un commit de merge que NO esta en origin/base, o contra otra base, aborta sin tocar nada', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      await mergearPr(e, dbl, url, 'merge');
      const antes = huella(e);
      const estado = dbl.leer();
      dbl.escribir({ ...estado, prs: [{ estado: 'integrado', url, base: 'develop', head: e.task.rama, commit: 'a'.repeat(40) }] });
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /ese commit no esta en "origin\/develop"/);
      dbl.escribir({ ...estado, prs: [{ estado: 'integrado', url, base: 'main', head: e.task.rama, commit: null }] });
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /se mergeo contra "main"/);
      assert.equal(huella(e), antes);
    });
  });
});

test('segundo finish con develop local DIVERGENTE de origin aborta sin cambiar de rama', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      await mergearPr(e, dbl, url, 'merge');
      git(['checkout', '-q', 'develop'], e.repoRoot);
      git(['commit', '-q', '--allow-empty', '-m', 'commit local sin subir'], e.repoRoot);
      git(['checkout', '-q', e.task.rama], e.repoRoot);
      const antes = huella(e);
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /no se puede avanzar con fast-forward/);
      assert.equal(huella(e), antes);
      assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), e.task.rama);
    });
  });
});

test('segundo finish con un tag AJENO aborta antes de cambiar de rama; sin commit informado y con --tag tambien', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      await mergearPr(e, dbl, url, 'squash');
      git(['tag', 'ajeno', 'main'], e.repoRoot);
      const antes = huella(e);
      await assert.rejects(() => finish(e, [ID, '--merge-request', '--tag', 'ajeno']), /NO apunta al merge de esta tarea/);
      assert.equal(huella(e), antes);

      dbl.escribir({ ...dbl.leer(), prs: [{ estado: 'integrado', url, base: 'develop', head: e.task.rama, commit: null }] });
      await assert.rejects(() => finish(e, [ID, '--merge-request', '--tag', 'v5']), /no informa del commit que resulto del merge/);
      assert.equal(huella(e), antes);
      // Sin --tag, ese mismo estado cierra bien.
      const r = await finish(e, [ID, '--merge-request']);
      assert.equal(r.cierre, 'terminada');
    });
  });
});

test('segundo finish tras un reintento parcial (tag propio ya puesto sobre el commit de la plataforma) lo reconoce y cierra', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      const commit = await mergearPr(e, dbl, url, 'squash');
      git(['fetch', '-q', 'origin'], e.repoRoot);
      git(['tag', '-a', 'v7', '-m', 'puesto antes', commit], e.repoRoot);
      const r = await finish(e, [ID, '--merge-request', '--tag', 'v7']);
      assert.equal(r.tag?.creado, false);
      assert.equal(r.cierre, 'terminada');
    });
  });
});

// ---------------------------------------------------------------------------
// Credenciales en la URL de origin
// ---------------------------------------------------------------------------

const CREDENCIALES = 'https://usuario:secreto@github.com/acme/repo.git';

test('una URL de origin con credenciales no aparece en el resultado, los avisos, tarea.md, el commit ni las llamadas al CLI', async () => {
  await escenario(CREDENCIALES, async (e) => {
    const avisos: string[] = [];
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const r = await finish(e, [ID, '--merge-request'], avisos);
      const md = await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8');
      const todo = [JSON.stringify(r), avisos.join('\n'), md, git(['log', '-3', '--format=%B', '--name-only'], e.repoRoot), JSON.stringify(dbl.leer())].join('\n');
      assert.doesNotMatch(todo, /secreto/);
      assert.doesNotMatch(todo, /usuario:/);
      assert.equal(r.mergeRequest?.plataforma, 'github');
    });
  });
  // Y en los mensajes de error de cada aborto del preflight.
  for (const [url, estado, patron] of [
    ['https://usuario:secreto@git.ejemplo.org/acme/repo.git', SIN_PRS, /host de origin/],
    [CREDENCIALES, { ...SIN_PRS, auth: false }, /no esta autenticado/],
  ] as const) {
    await escenario(url, async (e) => {
      await conDoblePlataforma(estado, async () => {
        await assert.rejects(
          () => finish(e, [ID, '--merge-request']),
          (err: unknown) => {
            assert.match((err as Error).message, patron);
            assert.doesNotMatch((err as Error).message, /secreto|usuario:/);
            return true;
          }
        );
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Por el CLI de verdad (main)
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

test('main: la salida del primer finish dice que subio la rama sin --push y como cerrar; la del segundo dice que el tag quedo local', async () => {
  await escenario(CREDENCIALES, async (e) => {
    const cwdAntes = process.cwd();
    process.chdir(e.repoRoot);
    try {
      await conDoblePlataforma(SIN_PRS, async (dbl) => {
        const a = await capturar(() => main(['finish', ID, '--merge-request', '--tag', 'v9']));
        assert.equal(a.code, 0, a.err);
        assert.match(a.out, /pull request abierto en https:\/\/github\.com\/acme\/repo\/pull\/1 contra "develop"/);
        assert.match(a.out, /se ha subido a origin aunque no pasaras --push/);
        assert.match(a.out, /taskctl finish TASK-700 --merge-request --tag v9/);
        assert.doesNotMatch(a.out + a.err, /secreto/);

        // taskctl ya commiteo la anotacion: el arbol esta limpio y la plataforma "mergea".
        commitAll(e.repoRoot, 'nada que commitear');
        const url = 'https://github.com/acme/repo/pull/1';
        await mergearPr(e, dbl, url, 'squash');
        const b = await capturar(() => main(['finish', ID, '--merge-request', '--tag', 'v9']));
        assert.equal(b.code, 0, b.err);
        assert.match(b.out, /Tarea TASK-700 terminada/);
        assert.match(b.out, /merge request https:\/\/github\.com\/acme\/repo\/pull\/1 mergeado en la plataforma/);
        assert.match(b.out, /Tag anotado "v9" creado sobre [0-9a-f]{10}\. Quedo SOLO en local \(el tag no se sube sin --push\)/);
        assert.doesNotMatch(b.out + b.err, /secreto/);
      });
    } finally {
      process.chdir(cwdAntes);
    }
  });
});

test('main: sin el CLI de la plataforma sale con codigo 1 y el mensaje dice que instalar', async () => {
  await escenario(URL_GITHUB, async (e) => {
    const cwdAntes = process.cwd();
    process.chdir(e.repoRoot);
    try {
      await sinPlataformasEnElPath(async () => {
        const r = await capturar(() => main(['finish', ID, '--merge-request']));
        assert.equal(r.code, 1);
        assert.match(r.err, /Instala GitHub CLI/);
      });
    } finally {
      process.chdir(cwdAntes);
    }
    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
  });
});

// ---------------------------------------------------------------------------
// IMP-1 de la revision: la rama no puede tener nada que la plataforma no integro
// ---------------------------------------------------------------------------

for (const modo of ['merge', 'squash'] as const) {
  test(`segundo finish (${modo}) con un commit LOCAL sin subir al MR aborta sin tocar nada: la tarea no se da por integrada`, async () => {
    await escenario(URL_GITHUB, async (e) => {
      await conDoblePlataforma(SIN_PRS, async (dbl) => {
        const url = await abrirMr(e);
        // Trabajo posterior al PR, commiteado en la rama y NO subido.
        await writeFile(path.join(e.repoRoot, 'extra.txt'), 'trabajo que no llego al MR\n', 'utf8');
        commitAll(e.repoRoot, 'extra');
        await mergearPr(e, dbl, url, modo);
        const antes = huella(e);
        await assert.rejects(
          () => finish(e, [ID, '--merge-request']),
          /tiene 1 commit\(s\) locales que no estaban en el merge request.*«extra».*NO estan en "develop"/s
        );
        assert.equal(huella(e), antes);
        assert.equal(existsSync(path.join(e.tareasRoot, '04-terminadas', ID)), false);
      });
    });
  });
}

test('segundo finish con commits SUBIDOS a la rama DESPUES de que la plataforma mergeara aborta sin tocar nada', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      await mergearPr(e, dbl, url, 'squash');
      await writeFile(path.join(e.repoRoot, 'tarde.txt'), 'subido tras mergear\n', 'utf8');
      commitAll(e.repoRoot, 'tarde');
      git(['push', '-q', 'origin', e.task.rama], e.repoRoot);
      const antes = huella(e);
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /avanzo DESPUES de que la plataforma mergeara/);
      assert.equal(huella(e), antes);
    });
  });
});

test('segundo finish: la anotacion del propio primer finish (subida o no) NO cuenta como commit sin integrar', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e, ['--push']);
      await mergearPr(e, dbl, url, 'squash');
      const r = await finish(e, [ID, '--merge-request']);
      assert.equal(r.cierre, 'terminada');
    });
  });
});

// Un PR CERRADO sin mergear nunca se lee como integrado, ni siquiera con un commit "de merge".
test('un PR CERRADO que trae mergeCommit no se lee como integrado: aborta y no cierra', async () => {
  await escenario(URL_GITHUB, async (e) => {
    await conDoblePlataforma(SIN_PRS, async (dbl) => {
      const url = await abrirMr(e);
      const commit = await mergearEnPlataforma(e.origin.bare, e.task.rama, 'develop', 'merge');
      dbl.escribir({ ...dbl.leer(), prs: [{ estado: 'cerrado', url, base: 'develop', head: e.task.rama, commit }] });
      await assert.rejects(() => finish(e, [ID, '--merge-request']), /esta CERRADO sin mergear/);
      assert.equal(existsSync(path.join(e.tareasRoot, '04-terminadas', ID)), false);
    });
  });
});

// MENOR-5: la plataforma borra la rama de origen al mergear y no queda origin/<rama>:
// la referencia tiene que ser la punta que integro la plataforma, no origin/<rama>.
for (const conExtra of [true, false]) {
  test(`segundo finish con la rama de origen BORRADA tras mergear (sin origin/<rama>): ${conExtra ? 'un commit local sin subir aborta sin tocar nada' : 'sin commit extra cierra'}`, async () => {
    await escenario(URL_GITHUB, async (e) => {
      await conDoblePlataforma(SIN_PRS, async (dbl) => {
        const url = await abrirMr(e);
        if (conExtra) {
          await writeFile(path.join(e.repoRoot, 'extra.txt'), 'no llego al MR\n', 'utf8');
          commitAll(e.repoRoot, 'extra');
        }
        await mergearPr(e, dbl, url, 'squash');
        // La plataforma borra la rama de origen; el clon hace prune y ya no hay origin/<rama>.
        git(['--git-dir', e.origin.bare, 'branch', '-D', e.task.rama], e.repoRoot);
        git(['update-ref', '-d', `refs/remotes/origin/${e.task.rama}`], e.repoRoot);
        assert.equal(spawnSync('git', ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${e.task.rama}`], { cwd: e.repoRoot }).status, 1);
        const antes = huella(e);
        if (conExtra) {
          await assert.rejects(() => finish(e, [ID, '--merge-request']), /tiene 1 commit\(s\) locales que no estaban en el merge request.*«extra»/s);
          assert.equal(huella(e), antes);
        } else {
          assert.equal((await finish(e, [ID, '--merge-request'])).cierre, 'terminada');
        }
      });
    });
  });
}
