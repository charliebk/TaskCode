/**
 * TASK-167d: `taskctl metricas` muestra la tendencia entre auditorias 4D
 * (`docs/auditoria-4d-*.md`) ademas de la columna 4D por tarea. Contra repos
 * Git temporales reales.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { conRepos, escribirTareas, metricas } from '../helpers/metricas-repos.js';
import { informe4D } from '../helpers/auditoria-4d.js';

test('TASK-167d: metricas muestra la serie de auditorias 4D por proyecto (texto y --json); sin informes, nada; uno roto, aviso', async () => {
  await conRepos(async (crear, base) => {
    const alfa = await crear('alfa');
    const beta = await crear('beta');
    for (const repo of [alfa, beta]) {
      await escribirTareas(repo, [{ id: 'TASK-001', finish: '2026-10-02T10:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [] }] }]);
    }
    // Sin informes: ni seccion ni aviso ni clave en el JSON.
    const vacio = metricas(alfa, []);
    assert.equal(vacio.status, 0, vacio.stderr);
    assert.doesNotMatch(vacio.stdout + vacio.stderr, /Auditorias 4D|auditoria-4d/);
    assert.equal('auditorias4D' in (JSON.parse(metricas(alfa, ['--json']).stdout) as object), false);

    const docs = path.join(alfa, 'docs');
    await mkdir(docs, { recursive: true });
    await writeFile(path.join(docs, 'auditoria-4d-2026-11-25.md'), informe4D(), 'utf8'); // total 14
    await writeFile(path.join(docs, 'auditoria-4d-2026-10-01.md'), informe4D({ Diluvio: '0 | 0 | 10', Total: '1 | 5 | 14' }), 'utf8'); // total 20
    await writeFile(path.join(docs, 'auditoria-4d-2026-11-25-2.md'), informe4D({ Total: '9 | 9 | 9' }), 'utf8'); // roto
    await writeFile(path.join(docs, 'auditoria-4d-notas.md'), 'no es un informe', 'utf8');
    // Una carpeta con nombre de informe: aviso, no un error (H2 de la revision).
    await mkdir(path.join(docs, 'auditoria-4d-2026-11-03.md'));

    const r = metricas(alfa, []);
    assert.equal(r.status, 0, r.stderr);
    // La columna 4D por tarea sigue y, debajo, la serie entre auditorias.
    assert.match(r.stdout, /\| id +\|.*\| 4d +\|/);
    assert.match(r.stdout, /^Auditorias 4D \(docs\/auditoria-4d-\*\.md\)/m);
    const serie = r.stdout.split('\n').filter((l) => /^\| 2026-/.test(l));
    assert.deepEqual(
      serie.map((l) => [l.split('|')[1]?.trim(), l.split('|').slice(-3, -1).map((c) => c.trim())]),
      [['2026-10-01', ['20', '—']], ['2026-11-25', ['14', '-6']]]
    );
    assert.match(r.stderr, /docs\/auditoria-4d-2026-11-25-2\.md no entra en la tendencia de auditorias 4D: el Total del resumen/);
    assert.doesNotMatch(r.stderr, /auditoria-4d-notas/);
    assert.match(r.stderr, /docs\/auditoria-4d-2026-11-03\.md no entra en la tendencia de auditorias 4D: no se pudo leer \(E/);

    // Sin tareas pero con informes: la serie sale tambien en texto, como en --json (H1).
    const gamma = await crear('gamma');
    await mkdir(path.join(gamma, 'docs'), { recursive: true });
    await writeFile(path.join(gamma, 'docs', 'auditoria-4d-2026-11-25.md'), informe4D(), 'utf8');
    const sinTareas = metricas(gamma, []);
    assert.equal(sinTareas.status, 0, sinTareas.stderr);
    assert.match(sinTareas.stdout, /^Auditorias 4D \(docs\/auditoria-4d-\*\.md\)/m);
    assert.match(sinTareas.stdout, /\| 2026-11-25 \| .* \| 14 \| — \|/);
    assert.doesNotMatch(sinTareas.stdout, /No hay tareas que medir/);

    const json = JSON.parse(metricas(alfa, ['--json']).stdout) as { auditorias4D: Array<{ proyecto: string; fecha: string; total: number; cambio: number | null }> };
    assert.deepEqual(json.auditorias4D.map((a) => [a.proyecto, a.fecha, a.total, a.cambio]), [
      ['alfa', '2026-10-01', 20, null],
      ['alfa', '2026-11-25', 14, -6],
    ]);

    // Con varios repos, cada serie lleva su proyecto y solo sale la de quien tiene informes.
    const varios = metricas(base, ['--repo', 'alfa', '--repo', 'beta']);
    assert.equal(varios.status, 0, varios.stderr);
    assert.match(varios.stdout, /^Auditorias 4D de alfa /m);
    assert.doesNotMatch(varios.stdout, /Auditorias 4D de beta/);
    assert.match(varios.stderr, /alfa: docs\/auditoria-4d-2026-11-25-2\.md no entra/);
  });
});
