/**
 * TASK-065: `taskctl metricas --repo <ruta>` (repetible) contra repos Git
 * temporales reales. Dos repos con el mismo TASK-NNN no mezclan datos; con
 * un solo repo la salida por stdout es la de siempre; las rutas se validan
 * antes de leer nada (inexistente, sin tareas/, sin valor, mismo nombre de
 * carpeta) y la misma carpeta escrita dos veces se lee una vez; --repo con
 * --escribir aborta sin tocar nada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { conRepos, escribirTareas, metricas, estado } from '../helpers/metricas-repos.js';

/** Filas de la tabla (sin cabecera ni separador), celda a celda. */
function filas(salida: string): string[][] {
  return salida
    .split('\n')
    .filter((l) => l.startsWith('| ') && !l.startsWith('| id ') && !l.startsWith('| proyecto '))
    .map((l) =>
      l
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())
    );
}

test('--repo repetido: dos repos con el mismo TASK-NNN salen por separado, con su proyecto, sin mezclar hallazgos', async () => {
  await conRepos(async (crear, base) => {
    const alfa = await crear('alfa');
    const beta = await crear('beta');
    await escribirTareas(alfa, [
      { id: 'TASK-001', finish: '2026-10-02T10:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [{ id: 'IMP-1', sev: 'IMPORTANTE' }] }] },
    ]);
    await escribirTareas(beta, [
      {
        id: 'TASK-001',
        finish: '2026-10-03T10:00:00Z',
        rondas: [{ veredicto: 'aprobada', hallazgos: [{ id: 'MEN-1', sev: 'MENOR' }, { id: 'MEN-2', sev: 'MENOR' }] }],
      },
      { id: 'TASK-002', rondas: [{ veredicto: 'aprobada', hallazgos: null }] },
    ]);
    const r = metricas(base, ['--repo', 'alfa', '--repo', beta]);
    assert.equal(r.status, 0, r.stderr);
    const cab = r.stdout.split('\n').find((l) => l.startsWith('| proyecto '));
    assert.ok(cab, `con varios repos la tabla abre con la columna proyecto:\n${r.stdout}`);
    const f = filas(r.stdout);
    // proyecto, id, complejidad, diseno, curso, revision, rondas, crit, imp, men, ...
    const alfa1 = f.find((c) => c[0] === 'alfa' && c[1] === 'TASK-001');
    const beta1 = f.find((c) => c[0] === 'beta' && c[1] === 'TASK-001');
    assert.ok(alfa1 && beta1, r.stdout);
    assert.deepEqual(alfa1.slice(7, 10), ['0', '1', '0']);
    assert.deepEqual(beta1.slice(7, 10), ['0', '0', '2']);
    assert.equal(f.length, 3);
    // Avisos y listas con proyecto/ID; la lista de repos leidos por stderr.
    assert.match(r.stderr, /\[AVISO\] 1 informe\(s\) de revision sin tabla .*: beta\/TASK-002\./);
    assert.match(r.stderr, /^Repos leidos: alfa \(1 tareas, .*\); beta \(2 tareas, .*\)\./m);
    assert.doesNotMatch(r.stdout, /Repos leidos/);
  });
});

test('un solo --repo: stdout identico byte a byte al de sin --repo, y la lista de repos va por stderr', async () => {
  await conRepos(async (crear) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, [
      { id: 'TASK-001', finish: '2026-10-02T10:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [] }] },
      { id: 'TASK-002', rondas: [{ veredicto: 'aprobada', hallazgos: null }] },
    ]);
    for (const extra of [[], ['--tokens'], ['--heuristica']]) {
      const sin = metricas(alfa, extra);
      const con = metricas(alfa, [...extra, '--repo', '.']);
      assert.equal(sin.status, 0, sin.stderr);
      assert.equal(con.status, 0, con.stderr);
      assert.equal(con.stdout, sin.stdout, `metricas ${extra.join(' ')}`);
      assert.equal(con.stderr, `Repos leidos: alfa (2 tareas, ${await realpath(alfa)}).\n${sin.stderr}`);
      assert.doesNotMatch(sin.stdout, /proyecto/);
    }
  });
});

test('la misma carpeta dos veces (otra grafia, y otras mayusculas en Windows) se lee una vez y lo avisa', async () => {
  await conRepos(async (crear, base) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, [{ id: 'TASK-001' }]);
    const variantes = [path.join(alfa, '..', 'alfa'), `${alfa}${path.sep}.`];
    if (process.platform === 'win32') variantes.push(alfa.toUpperCase());
    for (const otra of variantes) {
      const r = metricas(base, ['--repo', alfa, '--repo', otra]);
      assert.equal(r.status, 0, r.stderr);
      assert.equal(filas(r.stdout).length, 1, `${otra}: la tarea sale una vez\n${r.stdout}`);
      assert.match(r.stderr, /es la misma carpeta que --repo .*: se lee una sola vez/);
      assert.doesNotMatch(r.stdout, /\| proyecto /, 'un solo proyecto: sin columna proyecto');
    }
  });
});

test('dos carpetas distintas con el mismo nombre abortan sin leer nada', async () => {
  await conRepos(async (crear, base) => {
    const uno = await crear('proy', 'uno');
    const dos = await crear('proy', 'dos');
    const r = metricas(base, ['--repo', uno, '--repo', dos]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /se llaman igual \("proy"\)/);
    assert.equal(r.stdout, '');
  });
});

test('--repo inexistente, sin tareas/ o sin valor aborta antes de leer', async () => {
  await conRepos(async (crear, base) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, [{ id: 'TASK-001' }]);
    await mkdir(path.join(base, 'vacio'));
    const casos: [string[], RegExp][] = [
      [['--repo', alfa, '--repo', path.join(base, 'no-existe')], /--repo ".*no-existe": no existe/],
      [['--repo', alfa, '--repo', 'vacio'], /no tiene carpeta "tareas"/],
      [['--repo', alfa, '--repo'], /--repo necesita la ruta/],
      [['--repo', '--tokens'], /--repo necesita la ruta/],
      [['--repo='], /--repo necesita la ruta/],
    ];
    for (const [args, error] of casos) {
      const r = metricas(base, args);
      assert.equal(r.status, 1, args.join(' '));
      assert.match(r.stderr, error);
      assert.equal(r.stdout, '', `${args.join(' ')}: nada por stdout`);
    }
  });
});

test('--repo con --escribir aborta y no toca ningun repo', async () => {
  await conRepos(async (crear) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, [{ id: 'TASK-001' }]);
    const antes = estado(alfa);
    for (const args of [
      ['--tokens', '--escribir', '--repo', '.'],
      ['--repo', '.', '--tokens', '--escribir'],
    ]) {
      const r = metricas(alfa, args);
      assert.equal(r.status, 1);
      assert.match(r.stderr, /--repo no se combina con --escribir/);
      assert.equal(estado(alfa), antes);
    }
  });
});
