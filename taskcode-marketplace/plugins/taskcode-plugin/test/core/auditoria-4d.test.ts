/**
 * TASK-167d: lectura del resumen de un informe de auditoria 4D y la serie
 * entre auditorias. Puro: texto de entrada, cifras o motivo de salida.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fechaDeInforme4D,
  formatearSerieAuditorias4D,
  leerResumenAuditoria4D,
  serieAuditorias4D,
  type Auditoria4D,
  type Cifras4D,
} from '../../src/core/auditoria-4d.js';
import { informe4D } from '../helpers/auditoria-4d.js';

test('TASK-167d: el resumen se lee; cada desvio del formato se rechaza con su motivo', () => {
  const r = leerResumenAuditoria4D(informe4D());
  assert.ok(r.ok, JSON.stringify(r));
  assert.deepEqual(r.cifras.Duplicacion, { CRITICO: 1, IMPORTANTE: 2, MENOR: 3 });
  assert.deepEqual(r.cifras.Disfraz, { CRITICO: 0, IMPORTANTE: 2, MENOR: 1 });
  const motivo = (t: string): string => {
    const x = leerResumenAuditoria4D(t);
    assert.ok(!x.ok, `deberia rechazarse:\n${t}`);
    return x.motivo;
  };
  assert.match(motivo('# sin nada\n'), /no tiene la seccion "## Resumen"/);
  assert.match(motivo(informe4D().replace('| D | CRITICO |', '| D | CRÍTICO |')), /no tiene la cabecera/);
  assert.match(motivo(informe4D({ Diluvio: 'dos | 0 | 4' })), /fila "Diluvio" del resumen no tiene 3 cifras enteras/);
  assert.match(motivo(informe4D({ Diluvio: '0 | 4' })), /fila "Diluvio".*3 cifras/);
  assert.match(motivo(informe4D().replace('| Desviacion |', '| Desviación |')), /le falta la fila "Desviacion"/);
  assert.match(motivo(informe4D().replace('| Total |', '| Suma |')), /le falta la fila "Total"/);
  assert.match(motivo(informe4D({ Total: '1 | 5 | 9' })), /Total del resumen \(1\/5\/9\) no es la suma de las filas \(1\/5\/8\)/);
  assert.match(motivo(informe4D().replace('| Disfraz | 0 | 2 | 1 |', '| Disfraz | 0 | 2 | 1 |\r\n| Disfraz | 0 | 2 | 1 |')), /"Disfraz" esta repetida/);
});

const cifras = (total: number): Cifras4D => ({
  Duplicacion: { CRITICO: 0, IMPORTANTE: total, MENOR: 0 },
  Desviacion: { CRITICO: 0, IMPORTANTE: 0, MENOR: 0 },
  Diluvio: { CRITICO: 0, IMPORTANTE: 0, MENOR: 0 },
  Disfraz: { CRITICO: 0, IMPORTANTE: 0, MENOR: 0 },
});

test('TASK-167d: el nombre da fecha y numero del dia; la serie ordena y resta; la seccion las muestra', () => {
  assert.deepEqual(fechaDeInforme4D('auditoria-4d-2026-11-25.md'), { fecha: '2026-11-25', numero: 1 });
  assert.deepEqual(fechaDeInforme4D('auditoria-4d-2026-11-25-2.md'), { fecha: '2026-11-25', numero: 2 });
  assert.deepEqual(fechaDeInforme4D('auditoria-4d-2026-11-25-12.md'), { fecha: '2026-11-25', numero: 12 });
  for (const no of ['auditoria-4d-2026-11-25-0.md', 'auditoria-4d-2026-11-25-1.md', 'auditoria-4d-2026-11-25-02.md', 'auditoria-4d-2026-11-25.json', 'x-auditoria-4d-2026-11-25.md']) {
    assert.equal(fechaDeInforme4D(no), null, no);
  }
  const a = (fecha: string, numero: number, total: number): Auditoria4D => ({ fichero: `${fecha}-${String(numero)}`, fecha, numero, cifras: cifras(total) });
  const serie = serieAuditorias4D([a('2026-11-25', 2, 4), a('2026-10-01', 1, 10), a('2026-11-25', 1, 7)]);
  assert.deepEqual(serie.map((s) => [s.fecha, s.numero, s.total, s.cambio]), [
    ['2026-10-01', 1, 10, null],
    ['2026-11-25', 1, 7, -3],
    ['2026-11-25', 2, 4, -3],
  ]);
  const texto = formatearSerieAuditorias4D([a('2026-11-25', 2, 4), a('2026-10-01', 1, 2)], 'alfa');
  assert.match(texto, /^Auditorias 4D de alfa \(docs\/auditoria-4d-\*\.md\), hallazgos por D \(CRITICO\/IMPORTANTE\/MENOR\):/);
  assert.match(texto, /\| 2026-10-01 \| 0\/2\/0 \| 0\/0\/0 \| 0\/0\/0 \| 0\/0\/0 \| 2 \| — \|/);
  assert.match(texto, /\| 2026-11-25-2 \| 0\/4\/0 \| .* \| 4 \| \+2 \|/);
  assert.equal(formatearSerieAuditorias4D([]), '');
});
