/**
 * TASK-067: la decision del aviso de release (modulo puro, con Git inyectado) y la
 * lectura de un informe JSON. El camino real contra Git esta en
 * test/commands/finish-aviso-release.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avisosRelease, type ConsultasGit, type EntradaAvisoRelease, type InformeLeido } from '../../src/core/aviso-release.js';
import { interpretarInforme } from '../../src/fs/informes-deploy.js';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);

const informe = (parcial: Partial<InformeLeido> = {}): InformeLeido => ({
  archivo: '2026-10-27.json',
  fecha: '2026-10-27T12:00:00.000Z',
  commit: A,
  puntos: [{ id: 'p', estado: 'ok', severidad: 'critica' }],
  ...parcial,
});

const git = (esAncestro: boolean, rutas: string[] | null): ConsultasGit => ({ esAncestro: () => esAncestro, rutasCambiadas: () => rutas });

function entrada(parcial: Partial<EntradaAvisoRelease> = {}): EntradaAvisoRelease {
  return { idTarea: 'TASK-1', punta: A, informes: [informe()], ilegibles: [], soloMarkdown: 0, git: git(true, []), ...parcial };
}

test('informe de la punta sin FALLA critica: sin aviso', () => {
  assert.deepEqual(avisosRelease(entrada()), []);
});

test('el informe de la punta vale sin consultar a Git (aunque Git no sepa decir si es ancestro)', () => {
  assert.deepEqual(avisosRelease(entrada({ git: git(false, null) })), []);
});

test('sin informes: aviso que dice que hacer; con solo .md, lo explica', () => {
  const a = avisosRelease(entrada({ informes: [] }));
  assert.equal(a.length, 1);
  assert.match(a[0] as string, /no hay ningun informe en docs\/doctor-deploy/);
  assert.match(avisosRelease(entrada({ informes: [], soloMarkdown: 2 }))[0] as string, /solo hay informes en Markdown \(2 ficheros\)/);
});

test('ancestro: solo docs/doctor-deploy/ cambiado vale; cualquier otra ruta, no; sin poder comparar, no', () => {
  const base = { punta: B, informes: [informe({ commit: A })] };
  assert.deepEqual(avisosRelease(entrada({ ...base, git: git(true, ['docs/doctor-deploy/2026-10-27.md', 'docs/doctor-deploy/2026-10-27.json']) })), []);
  const mal = avisosRelease(entrada({ ...base, git: git(true, ['docs/doctor-deploy/x.md', 'src/a.ts']) }));
  assert.match(mal[0] as string, /ha cambiado 1 fichero fuera de docs\/doctor-deploy\//);
  // Una carpeta de nombre parecido no es la de los informes.
  assert.equal(avisosRelease(entrada({ ...base, git: git(true, ['docs/doctor-deploy-viejo/x.md']) })).length, 1);
  assert.match(avisosRelease(entrada({ ...base, git: git(true, null) }))[0] as string, /no se pudo comparar/);
  assert.match(avisosRelease(entrada({ ...base, git: git(false, []) }))[0] as string, /no esta en la historia/);
});

test('informe sin commit (repo sin commits) o sin punta: aviso', () => {
  assert.match(avisosRelease(entrada({ informes: [informe({ commit: null })] }))[0] as string, /sin commits/);
  assert.match(avisosRelease(entrada({ punta: null }))[0] as string, /no se pudo leer el commit/);
});

test('FALLA critica: avisa con los ids; una alta, un NO VERIFICADO critico o un OK critico, no', () => {
  const puntos = [
    { id: 'c1', estado: 'falla', severidad: 'critica' },
    { id: 'a1', estado: 'falla', severidad: 'alta' },
    { id: 'c2', estado: 'no-verificado', severidad: 'critica' },
    { id: 'c3', estado: 'falla', severidad: 'critica' },
  ];
  const a = avisosRelease(entrada({ informes: [informe({ puntos })] }));
  assert.equal(a.length, 1);
  assert.match(a[0] as string, /tiene 2 FALLAS criticas: c1, c3\./);
  assert.match(avisosRelease(entrada({ informes: [informe({ puntos: [puntos[0] as (typeof puntos)[number]] })] }))[0] as string, /tiene 1 FALLA critica: c1\./);
  assert.deepEqual(avisosRelease(entrada({ informes: [informe({ puntos: puntos.slice(1, 3) })] })), []);
});

test('varios informes: el valido mas reciente decide; uno invalido mas nuevo no tapa al valido', () => {
  const viejoMalo = informe({ archivo: 'viejo.json', fecha: '2026-01-01T00:00:00.000Z', puntos: [{ id: 'x', estado: 'falla', severidad: 'critica' }] });
  const nuevoBueno = informe({ archivo: 'nuevo.json', fecha: '2026-02-01T00:00:00.000Z' });
  assert.deepEqual(avisosRelease(entrada({ informes: [viejoMalo, nuevoBueno] })), []);
  assert.equal(avisosRelease(entrada({ informes: [nuevoBueno, viejoMalo].reverse(), git: git(true, []) })).length, 0);
  // El mas nuevo es de otro commit (no es la punta y cambio codigo): vale el viejo si es de la punta.
  const nuevoOtro = informe({ archivo: 'otro.json', fecha: '2026-03-01T00:00:00.000Z', commit: B });
  const g: ConsultasGit = { esAncestro: () => true, rutasCambiadas: () => ['src/x.ts'] };
  const a = avisosRelease(entrada({ punta: A, informes: [viejoMalo, nuevoOtro], git: g }));
  assert.equal(a.length, 1);
  assert.match(a[0] as string, /tiene 1 FALLA critica: x/);
});

test('ficheros .json ilegibles se nombran en el aviso', () => {
  const a = avisosRelease(entrada({ informes: [], ilegibles: ['roto.json', 'otro.json'] }));
  assert.match(a[0] as string, /2 ficheros \.json no se pudieron leer: roto\.json, otro\.json/);
});

test('interpretarInforme: acepta un informe de doctor-deploy y rechaza lo que no lo es', () => {
  const ok = { comando: 'doctor-deploy', fecha: 'f', commit: A, puntos: [{ id: 'p', estado: 'ok', severidad: 'alta', extra: 1 }] };
  assert.deepEqual(interpretarInforme('x.json', JSON.stringify(ok)), { archivo: 'x.json', fecha: 'f', commit: A, puntos: [{ id: 'p', estado: 'ok', severidad: 'alta' }] });
  assert.equal(interpretarInforme('x.json', JSON.stringify({ ...ok, commit: null }))?.commit, null);
  for (const malo of [
    'no json',
    '[]',
    'null',
    JSON.stringify({ ...ok, comando: 'otro' }),
    JSON.stringify({ ...ok, fecha: 3 }),
    JSON.stringify({ ...ok, commit: 3 }),
    JSON.stringify({ ...ok, puntos: 'x' }),
    JSON.stringify({ ...ok, puntos: [{ id: 'p' }] }),
    JSON.stringify({ ...ok, puntos: [null] }),
  ]) {
    assert.equal(interpretarInforme('x.json', malo), null, malo.slice(0, 40));
  }
});
