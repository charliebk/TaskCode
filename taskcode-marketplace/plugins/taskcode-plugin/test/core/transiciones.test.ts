/**
 * Registro de transiciones (TASK-056): anadir sin tocar el resto del cuerpo,
 * leer ignorando lo que no casa, y el modo congelado en la fila de plan.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  anadirTransicion,
  leerTransiciones,
  modoCongelado,
  modoDeTarea,
  registrarTransicion,
  precisionDeFecha,
  instanteDe,
  formatearInstante,
  versionDeCierre,
  type FilaTransicion,
} from '../../src/core/transiciones.js';
import { VERSION_TASKCTL } from '../../src/core/version.js';

const CUERPO = '## Objetivo\n\nHacer algo.\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';

const fila = (o: Partial<FilaTransicion> = {}): FilaTransicion => ({
  fecha: '2026-10-04',
  fase: 'plan',
  modo: 'manual',
  decidido_por: 'persona',
  version: null,
  ...o,
});

const EJEMPLO_TABLA =
  '## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
  '| 2026-01-01 | plan | automatico | persona |\n';

test('bloques de codigo: un ejemplo cercado (``` o ~~~, vallas largas, sin cerrar, sangradas) no es el registro', () => {
  // un "## Transiciones" de ejemplo dentro de un bloque de codigo del enunciado no es el registro (IMP-2)
  {
    const ejemplo =
      '## Objetivo\n\nDocumentar el registro, con este ejemplo:\n\n```md\n## Transiciones\n\n' +
      '| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n| 2026-01-01 | plan | automatico | persona |\n' +
      '```\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';
    // Antes de plan: no hay registro ni modo congelado, digan lo que digan los ejemplos.
    assert.deepEqual(leerTransiciones(ejemplo), []);
    assert.equal(modoCongelado(ejemplo), null);
    // plan crea la seccion REAL al final y deja el ejemplo intacto.
    const r = anadirTransicion(ejemplo, fila());
    assert.ok(r.startsWith(ejemplo.trimEnd()), 'el enunciado, incluido el ejemplo, no cambia');
    assert.deepEqual(leerTransiciones(r), [fila()]);
    assert.equal(modoCongelado(r), 'manual');
    // Y la siguiente fila va a la seccion real, no al ejemplo.
    const r2 = anadirTransicion(r, fila({ fase: 'approve' }));
    assert.ok(r2.startsWith(ejemplo.trimEnd()));
    assert.deepEqual(
      leerTransiciones(r2).map((f) => f.fase),
      ['plan', 'approve']
    );
  }

  // filas de tabla dentro de un bloque de codigo en la propia seccion se ignoran
  {
    const cuerpo = anadirTransicion(CUERPO, fila()) + '\n```\n| 2026-01-01 | approve | manual | persona |\n```\n';
    assert.deepEqual(leerTransiciones(cuerpo), [fila()]);
  }

  // IMP-4: un bloque de cuatro tildes que envuelve un ejemplo con tres no se cierra en el interior
  {
    const enunciado =
      '## Objetivo\n\nAsi se documenta:\n\n````md\nAsi queda:\n```\n' +
      EJEMPLO_TABLA +
      '```\n````\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';
    assert.deepEqual(leerTransiciones(enunciado), []);
    assert.equal(modoCongelado(enunciado), null);
    const r = anadirTransicion(enunciado, fila());
    assert.ok(r.startsWith(enunciado.trimEnd()), 'el ejemplo no cambia');
    assert.deepEqual(leerTransiciones(r), [fila()]);
  }

  // IMP-4: una valla sin cerrar en el enunciado no se traga la seccion real (no se duplica)
  {
    const enunciado = '## Objetivo\n\nEjecutar:\n\n```bash\nnpm test\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';
    let r = anadirTransicion(enunciado, fila({ modo: 'automatico' }));
    r = anadirTransicion(r, fila({ fase: 'approve', modo: 'automatico', decidido_por: 'automatico' }));
    assert.equal(r.split('\n').filter((l) => l === '## Transiciones').length, 1, 'una sola seccion');
    assert.deepEqual(
      leerTransiciones(r).map((f) => f.fase),
      ['plan', 'approve']
    );
    assert.equal(modoCongelado(r), 'automatico');
  }

  // IMP-4: una valla de cierre mas corta, con texto detras o de otro caracter no cierra
  {
    // Si cualquiera de esas lineas cerrase, el encabezado de ejemplo quedaria fuera de bloque.
    for (const falsoCierre of ['```', '```` texto', '~~~~']) {
      const cuerpo = `## Objetivo\n\n\`\`\`\`\n${falsoCierre}\n${EJEMPLO_TABLA}\`\`\`\`\n`;
      assert.deepEqual(leerTransiciones(cuerpo), [], `falso cierre: ${falsoCierre}`);
    }
    // Una valla sangrada 4 espacios es codigo sangrado, no valla: no abre bloque,
    // y el ``` de despues (sin pareja) tampoco. La tabla queda fuera de bloque.
    const sangrada = '## Objetivo\n\n    ```\n\n' + EJEMPLO_TABLA + '```\n';
    assert.equal(leerTransiciones(sangrada).length, 1);
  }

  // MEN-11: tras una valla sin cerrar se sigue buscando bloques (el ejemplo cercado despues sigue siendo ejemplo)
  {
    const cuerpo = '## Objetivo\n\n~~~bash\nnpm test\n\n````md\n' + EJEMPLO_TABLA + '````\n';
    assert.deepEqual(leerTransiciones(cuerpo), []);
    assert.equal(modoCongelado(cuerpo), null);
  }

  // MEN-11: una linea con ``` en mitad del texto no es valla de apertura
  {
    // "```a``` es inline" no abre bloque (CommonMark: el texto de info no lleva `);
    // si lo abriera, se emparejaria con el cierre del bloque bash y se tragaria la tabla.
    const cuerpo = '```a``` es inline\n\n' + EJEMPLO_TABLA + '\n```bash\nx\n```\n';
    assert.equal(leerTransiciones(cuerpo).length, 1);
  }

  // MEN-11: una valla de cierre sangrada 4 espacios no cierra
  {
    const cuerpo = '````md\nmira:\n    ````\n' + EJEMPLO_TABLA + '````\n';
    assert.deepEqual(leerTransiciones(cuerpo), []);
  }

  // MEN-9: tambien ~~~ es valla
  {
    const cuerpo = '## Objetivo\n\n~~~md\n' + EJEMPLO_TABLA + '~~~\n';
    assert.deepEqual(leerTransiciones(cuerpo), []);
  }
});

test('MEN-9: el registro es el ultimo encabezado real y un "## X" dentro de un bloque no corta la seccion', () => {
  // MEN-9: con dos encabezados reales, el registro es el ULTIMO
  {
    // Un "## Transiciones" suelto en el enunciado (sin bloque) no es el registro: el CLI escribe al final.
    const cuerpo = '## Objetivo\n\n' + EJEMPLO_TABLA + '\n## Criterios de aceptacion\n- [ ] x\n';
    const r = anadirTransicion(anadirTransicion(cuerpo, fila()), fila({ fase: 'start' }));
    // anadirTransicion escribio en el que ya existia (el unico) la primera vez; desde ahi, el ultimo.
    const conOtro = r + '\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n| 2026-10-05 | review | manual | persona |\n';
    assert.deepEqual(
      leerTransiciones(conOtro).map((f) => f.fase),
      ['review']
    );
  }

  // MEN-9: un "## X" dentro de un bloque de la propia seccion no la corta, y la fila nueva no cae dentro del bloque
  {
    const base = anadirTransicion(CUERPO, fila());
    const conBloque = base + '\n```md\n## Nota\n| 2026-01-01 | review | manual | persona |\n```\n';
    const r = anadirTransicion(conBloque, fila({ fase: 'approve' }));
    // La fila nueva va tras la ultima fila REAL de la tabla, antes del bloque, y se lee.
    assert.deepEqual(
      leerTransiciones(r).map((f) => f.fase),
      ['plan', 'approve']
    );
    assert.ok(r.indexOf('| approve |') < r.indexOf('```md'), 'la fila no puede quedar dentro ni detras del bloque');
    // Y una fila escrita a mano DESPUES del bloque sigue en la seccion: el "## Nota" del bloque no la corta.
    const conFilaDetras = conBloque + '| 2026-10-06 | start | manual | persona |\n';
    assert.deepEqual(
      leerTransiciones(conFilaDetras).map((f) => f.fase),
      ['plan', 'start']
    );
  }
});

test('anadir/leer/modo: alta de la seccion, fila tras la ultima, CRLF, filas mal formadas, modo congelado y registrarTransicion', () => {
  // anadirTransicion: sin seccion, la crea al final y deja el cuerpo intacto por encima
  {
    const r = anadirTransicion(CUERPO, fila());
    assert.ok(r.startsWith(CUERPO.trimEnd() + '\n\n## Transiciones\n'), r);
    assert.ok(
      r.endsWith(
        '## Transiciones\n\n| fecha | fase | modo | decidido_por | version |\n|---|---|---|---|---|\n' +
          '| 2026-10-04 | plan | manual | persona |  |\n'
      ),
      r
    );
    assert.deepEqual(leerTransiciones(r), [fila()]);
  }

  // anadirTransicion: con seccion, la fila va detras de la ultima de la tabla, aunque despues haya otra seccion
  {
    let r = anadirTransicion(CUERPO, fila());
    // Con una tabla propia en la seccion siguiente (MEN-1): la fila no puede ir detras de ella.
    r += '\n## Resultado\n\nTexto del resultado.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n';
    r = anadirTransicion(r, fila({ fase: 'approve', decidido_por: 'automatico' }));
    assert.deepEqual(
      leerTransiciones(r).map((f) => f.fase),
      ['plan', 'approve']
    );
    // El Resultado sigue intacto y detras.
    assert.ok(r.endsWith('## Resultado\n\nTexto del resultado.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n'), r);
    const antesDeResultado = r.slice(0, r.indexOf('## Resultado'));
    assert.match(antesDeResultado, /\| 2026-10-04 \| approve \| manual \| automatico \|  \|\n/);
  }

  // anadirTransicion: respeta CRLF si el cuerpo lo usa
  {
    const crlf = CUERPO.replace(/\n/g, '\r\n');
    const r = anadirTransicion(anadirTransicion(crlf, fila()), fila({ fase: 'start' }));
    assert.equal(r.replace(/\r\n/g, '').includes('\n'), false, 'no mezcla LF suelto');
    assert.equal(leerTransiciones(r).length, 2);
  }

  // leerTransiciones: ignora filas mal formadas o con valores desconocidos, sin fallar
  {
    const cuerpo =
      CUERPO +
      '\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
      '| 2026-10-04 | plan | automatico | persona |\n' +
      '| ayer | approve | automatico | persona |\n' +
      '| 2026-10-04 | despegar | automatico | persona |\n' +
      '| 2026-10-04 | start | turbo | persona |\n' +
      '| 2026-10-04 | start | automatico | robot |\n' +
      '| 2026-10-04 | start | automatico |\n';
    assert.deepEqual(leerTransiciones(cuerpo), [fila({ modo: 'automatico' })]);
  }

  // modoCongelado: el de la ULTIMA fila plan (una re-planificacion lo vuelve a fijar); null sin fila plan
  {
    assert.equal(modoCongelado(CUERPO), null);
    let r = anadirTransicion(CUERPO, fila({ modo: 'automatico' }));
    r = anadirTransicion(r, fila({ fase: 'pausa', modo: 'automatico' }));
    assert.equal(modoCongelado(r), 'automatico');
    r = anadirTransicion(r, fila({ modo: 'semiautomatico' }));
    assert.equal(modoCongelado(r), 'semiautomatico');
  }

  // registrarTransicion: plan toma el modo del config; el resto, el congelado aunque el config cambie
  {
    const tras = registrarTransicion(CUERPO, 'plan', '2026-10-04', 'automatico');
    const aprobada = registrarTransicion(tras, 'approve', '2026-10-05', 'manual', 'automatico');
    assert.deepEqual(leerTransiciones(aprobada), [
      fila({ modo: 'automatico', version: VERSION_TASKCTL }),
      fila({ fecha: '2026-10-05', fase: 'approve', modo: 'automatico', decidido_por: 'automatico', version: VERSION_TASKCTL }),
    ]);
    // Tarea anterior al registro (sin fila plan): el modo es el del config.
    assert.equal(modoDeTarea(CUERPO, 'semiautomatico'), 'semiautomatico');
    const sinPlan = registrarTransicion(CUERPO, 'start', '2026-10-04', 'semiautomatico');
    assert.equal(leerTransiciones(sinPlan)[0]?.modo, 'semiautomatico');
  }
});

// --------------------------------------------------------------------
// TASK-052: la celda `fecha` lleva el instante UTC al segundo. Requisito del
// rol de riesgos: el modo congelado se sigue leyendo con filas con hora y con
// tablas mezcladas. Mutacion comprobada: volver al regex del dia a secas en
// leerTransiciones (`/^\d{4}-\d{2}-\d{2}$/`) pone rojos estos tres tests.
// --------------------------------------------------------------------

const PLAN_AUTO_CON_HORA = fila({ fecha: '2026-10-05T14:03:22Z', modo: 'automatico' });

test('TASK-052: la celda fecha lleva el instante UTC al segundo (escritura, modo congelado, tablas mezcladas, precision y formato)', () => {
  // TASK-052: registrarTransicion con instante lo escribe tal cual y leerTransiciones lo devuelve
  {
    const r = registrarTransicion(CUERPO, 'plan', '2026-10-05T14:03:22Z', 'automatico');
    assert.ok(r.includes(`| 2026-10-05T14:03:22Z | plan | automatico | persona | ${VERSION_TASKCTL} |`), r);
    assert.deepEqual(leerTransiciones(r), [{ ...PLAN_AUTO_CON_HORA, version: VERSION_TASKCTL }]);
  }

  // TASK-052: modoCongelado sigue funcionando con filas con hora
  {
    const r = anadirTransicion(CUERPO, PLAN_AUTO_CON_HORA);
    assert.equal(modoCongelado(r), 'automatico');
    // Y gana al config: es lo que impide aprobar en otro modo que el del plan.
    assert.equal(modoDeTarea(r, 'manual'), 'automatico');
    const aprobada = registrarTransicion(r, 'approve', '2026-10-05T14:10:00Z', 'manual');
    assert.equal(leerTransiciones(aprobada)[1]?.modo, 'automatico');
  }

  // TASK-052: tabla mezclada (filas viejas de dia y nuevas con hora) se lee entera y en orden
  {
    let r = anadirTransicion(CUERPO, fila({ fecha: '2026-10-04', modo: 'manual' }));
    r = anadirTransicion(r, fila({ fecha: '2026-10-04', fase: 'approve' }));
    // Un plan repetido despues de actualizar el plugin: el congelado es el ultimo.
    r = anadirTransicion(r, PLAN_AUTO_CON_HORA);
    r = anadirTransicion(r, fila({ fecha: '2026-10-05T15:00:00Z', fase: 'start', modo: 'automatico' }));
    assert.deepEqual(
      leerTransiciones(r).map((f) => [f.fecha, f.fase]),
      [
        ['2026-10-04', 'plan'],
        ['2026-10-04', 'approve'],
        ['2026-10-05T14:03:22Z', 'plan'],
        ['2026-10-05T15:00:00Z', 'start'],
      ]
    );
    assert.equal(modoCongelado(r), 'automatico');
    // Al reves: plan nuevo con hora y despues una fila vieja sigue congelando el de la hora.
    const solo = anadirTransicion(anadirTransicion(CUERPO, PLAN_AUTO_CON_HORA), fila({ fecha: '2026-10-06', fase: 'start' }));
    assert.equal(modoCongelado(solo), 'automatico');
  }

  // TASK-052: precisionDeFecha distingue dia e instante y rechaza lo demas
  {
    assert.equal(precisionDeFecha('2026-10-05'), 'dia');
    assert.equal(precisionDeFecha('2026-10-05T14:03:22Z'), 'segundo');
    for (const mala of [
      '2026-10-05T14:03Z', // sin segundos
      '2026-10-05T14:03:22.123Z', // con milisegundos
      '2026-10-05T14:03:22+02:00', // con offset: la fuente es UTC
      '2026-10-05 14:03:22',
      '2026-02-30', // no existe
      '2026-13-01',
      '2026-10-05T25:00:00Z',
      'ayer',
    ]) {
      assert.equal(precisionDeFecha(mala), null, mala);
      const r = anadirTransicion(CUERPO, fila({ fecha: mala }));
      assert.deepEqual(leerTransiciones(r), [], `una fila con fecha "${mala}" no cuenta`);
    }
  }

  // TASK-052: formatearInstante es UTC al segundo e instanteDe lo invierte
  {
    const d = new Date(Date.UTC(2026, 9, 5, 23, 59, 59, 987));
    assert.equal(formatearInstante(d), '2026-10-05T23:59:59Z');
    assert.equal(precisionDeFecha(formatearInstante(d)), 'segundo');
    assert.equal(instanteDe('2026-10-05T23:59:59Z'), Date.UTC(2026, 9, 5, 23, 59, 59));
    assert.equal(instanteDe('2026-10-05'), Date.UTC(2026, 9, 5));
  }
});

// --------------------------------------------------------------------
// TASK-084: quinta columna `version`. Las filas viejas de 4 celdas se siguen
// leyendo (con version null) y siguen congelando el modo; la primera fila con
// version bajo una cabecera de 4 columnas amplia SOLO cabecera y separador.
// --------------------------------------------------------------------

const TABLA_VIEJA =
  CUERPO +
  '\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
  '| 2026-10-04 | plan | manual | persona |\n' +
  '| 2026-10-05T10:00:00Z | approve | manual | persona |\n';

test('TASK-084: quinta columna version (tabla vieja, ampliacion de cabecera, CRLF, cabecera a mano, celda invalida, versionDeCierre, version por defecto)', () => {
  // TASK-084: una tabla de 4 columnas se lee entera, sin version, y congela el modo
  {
    assert.deepEqual(leerTransiciones(TABLA_VIEJA), [
      fila(),
      fila({ fecha: '2026-10-05T10:00:00Z', fase: 'approve' }),
    ]);
    assert.equal(modoCongelado(TABLA_VIEJA), 'manual');
    assert.equal(versionDeCierre(TABLA_VIEJA), null);
  }

  // TASK-084: la primera fila con version amplia cabecera y separador y no toca las filas viejas
  {
    const r = registrarTransicion(TABLA_VIEJA, 'start', '2026-10-06T09:00:00Z', 'automatico', 'persona', '0.12.0');
    const esperado =
      TABLA_VIEJA.replace(
        '| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n',
        '| fecha | fase | modo | decidido_por | version |\n|---|---|---|---|---|\n'
      ) + '| 2026-10-06T09:00:00Z | start | manual | persona | 0.12.0 |\n';
    assert.equal(r, esperado);
    assert.deepEqual(
      leerTransiciones(r).map((f) => [f.fase, f.modo, f.version]),
      [
        ['plan', 'manual', null],
        ['approve', 'manual', null],
        ['start', 'manual', '0.12.0'],
      ]
    );
    // La segunda fila ya encuentra la cabecera de 5: no se vuelve a tocar.
    const r2 = registrarTransicion(r, 'review', '2026-10-06T10:00:00Z', 'manual', 'persona', '0.12.0');
    assert.equal(r2, r + '| 2026-10-06T10:00:00Z | review | manual | persona | 0.12.0 |\n');
  }

  // TASK-084: la ampliacion de la cabecera respeta CRLF
  {
    const crlf = TABLA_VIEJA.replace(/\n/g, '\r\n');
    const r = registrarTransicion(crlf, 'start', '2026-10-06T09:00:00Z', 'manual', 'persona', '0.12.0');
    assert.equal(r.replace(/\r\n/g, '').includes('\n'), false, 'no mezcla LF suelto');
    assert.ok(r.includes('| fecha | fase | modo | decidido_por | version |\r\n|---|---|---|---|---|\r\n'), r);
  }

  // TASK-084: una cabecera editada a mano (no la de 4 columnas exacta) no se reescribe
  {
    const editada = TABLA_VIEJA.replace('| fecha | fase | modo | decidido_por |', '| Fecha | fase | modo | decidido_por |');
    const r = registrarTransicion(editada, 'start', '2026-10-06T09:00:00Z', 'manual', 'persona', '0.12.0');
    assert.ok(r.includes('| Fecha | fase | modo | decidido_por |\n|---|---|---|---|\n'), r);
    assert.equal(leerTransiciones(r)[2]?.version, '0.12.0');
    // Una cabecera de 4 dentro de un bloque de codigo de la seccion tampoco.
    const conBloque =
      anadirTransicion(CUERPO, fila({ version: '0.12.0' })) +
      '\n```md\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n```\n';
    const r3 = anadirTransicion(conBloque, fila({ fase: 'approve', version: '0.12.0' }));
    assert.ok(r3.includes('```md\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n```'), r3);
  }

  // TASK-084: una celda de version que no es version deja la fila (y su modo) sin version
  {
    const cuerpo =
      CUERPO +
      '\n## Transiciones\n\n| fecha | fase | modo | decidido_por | version |\n|---|---|---|---|---|\n' +
      '| 2026-10-04 | plan | automatico | persona | ayer |\n' +
      '| 2026-10-05 | approve | automatico | persona |  |\n' +
      '| 2026-10-06 | start | automatico | persona | 0.12.0-dev.1 |\n' +
      '| 2026-10-07 | review | automatico | persona | 0.12.0 | extra |\n';
    assert.deepEqual(
      leerTransiciones(cuerpo).map((f) => [f.fase, f.version]),
      [
        ['plan', null],
        ['approve', null],
        ['start', '0.12.0-dev.1'],
      ]
    );
    assert.equal(modoCongelado(cuerpo), 'automatico');
  }

  // TASK-084: versionDeCierre es la del ULTIMO finish; null sin finish o si no la lleva
  {
    let r = registrarTransicion(CUERPO, 'plan', '2026-10-04T10:00:00Z', 'manual', 'persona', '0.11.0');
    assert.equal(versionDeCierre(r), null, 'sin finish no hay version de cierre');
    r = registrarTransicion(r, 'finish', '2026-10-05T10:00:00Z', 'manual', 'persona', '0.11.0');
    assert.equal(versionDeCierre(r), '0.11.0');
    // finish abortado y reintentado con el plugin actualizado: cuenta el ultimo.
    r = registrarTransicion(r, 'finish', '2026-10-06T10:00:00Z', 'manual', 'persona', '0.12.0');
    assert.equal(versionDeCierre(r), '0.12.0');
    // Un ultimo finish sin version no hereda la del anterior.
    r = anadirTransicion(r, fila({ fecha: '2026-10-07', fase: 'finish' }));
    assert.equal(versionDeCierre(r), null);
  }

  // TASK-084: registrarTransicion anota por defecto la version de este taskctl
  {
    const r = registrarTransicion(CUERPO, 'plan', '2026-10-04T10:00:00Z', 'manual');
    assert.equal(leerTransiciones(r)[0]?.version, VERSION_TASKCTL);
    assert.ok(r.includes(`| persona | ${VERSION_TASKCTL} |`), r);
  }
});
