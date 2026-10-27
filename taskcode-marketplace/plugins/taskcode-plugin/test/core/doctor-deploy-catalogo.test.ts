/**
 * TASK-066: el catalogo real de `doctor-deploy` (scripts/doctor-deploy.yml) y la
 * capa del proyecto. El catalogo real se parsea de verdad (no una copia de
 * prueba): si alguien borra un punto pedido o rompe el formato, falla aqui.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  cargarCatalogoDeploy,
  combinarCatalogo,
  DoctorDeployCatalogoError,
  parsearCapaProyecto,
  parsearCatalogoDeploy,
  resolverRutaCatalogoDeploy,
  SONDAS_REGISTRADAS,
  type CatalogoBase,
} from '../../src/core/doctor-deploy-catalogo.js';
import { SONDAS } from '../../src/fs/sondas-deploy.js';

const BASE = cargarCatalogoDeploy();
const CONTENIDO = readFileSync(resolverRutaCatalogoDeploy(), 'utf8');

/** Los 20 puntos pedidos, con el id con que se registran. */
const LOS_20 = [
  'secretos-en-arbol', // esconder API keys
  'secretos-en-historial', // limpiar secretos de git
  'clave-publica-en-cliente-db',
  'rls-activo',
  'cifrado-en-reposo',
  'auth-en-servidor',
  'restringir-accesos',
  'mass-assignment',
  'cookies-seguras',
  'hash-de-contrasenas',
  'rate-limits',
  'proteccion-de-bots',
  'queries-parametrizadas',
  'validacion-de-inputs',
  'fuga-de-contenido',
  'uploads-seguros',
  'limitar-respuestas-api',
  'security-headers',
  'https-obligatorio',
  'dependencias-vulnerables',
];

const ANADIDOS = [
  'cors-restringido',
  'proteccion-csrf',
  'debug-y-source-maps',
  'variables-entorno-documentadas',
  'lockfile-versionado',
  'contenedor-sin-root-ni-secretos',
  'logs-sin-datos-sensibles',
  'errores-sin-traza',
  'redirecciones-y-ssrf',
  'caducidad-de-sesion',
  'backups-y-migraciones',
  'health-check',
  'licencias-de-dependencias',
  'tests-en-verde',
  // Dominio: su sonda determinista llega en una tarea posterior.
  'reglas-firebase-abiertas',
  'migraciones-sin-rls',
  'tokens-en-ficheros-de-gestor',
  'compose-con-contrasenas',
  'ci-pull-request-target',
  'acciones-ci-sin-sha',
  'dockerfile-sin-user',
  // Pedidos aparte en el enunciado.
  'ficheros-secretos-versionados',
  'gitignore-cubre-env',
];

test('el catalogo real tiene los 20 puntos pedidos y los anadidos', () => {
  const ids = new Set(BASE.puntos.map((p) => p.id));
  for (const id of [...LOS_20, ...ANADIDOS]) assert.ok(ids.has(id), `falta el punto "${id}"`);
  assert.equal(ids.size, BASE.puntos.length, 'ids repetidos');
});

test('cada punto tiene todos los campos, y los deterministas una sonda registrada', () => {
  for (const p of BASE.puntos) {
    assert.match(p.id, /^[a-z0-9][a-z0-9-]*$/);
    assert.ok(['critica', 'alta', 'media', 'baja'].includes(p.severidad), p.id);
    assert.ok(p.tipos.length > 0, p.id);
    assert.ok(p.arreglo.length > 10, `${p.id}: arreglo`);
    assert.ok(p.descripcion.length > 10, `${p.id}: descripcion`);
    if (p.metodo === 'determinista') {
      assert.ok(p.sonda !== null && SONDAS_REGISTRADAS.includes(p.sonda), `${p.id}: sonda`);
    } else {
      assert.equal(p.sonda, null, `${p.id}: un punto de juicio no lleva sonda`);
    }
  }
});

test('las sondas registradas y las implementadas son las mismas seis', () => {
  assert.deepEqual([...SONDAS_REGISTRADAS].sort(), Object.keys(SONDAS).sort());
  assert.equal(SONDAS_REGISTRADAS.length, 6);
  const usadas = new Set(BASE.puntos.flatMap((p) => (p.sonda === null ? [] : [p.sonda])));
  for (const s of SONDAS_REGISTRADAS) assert.ok(usadas.has(s), `ningun punto usa la sonda "${s}"`);
});

test('solo hay seis puntos deterministas: todo lo demas es de juicio (D6)', () => {
  const deterministas = BASE.puntos.filter((p) => p.metodo === 'determinista').map((p) => p.id);
  assert.equal(deterministas.length, 6, deterministas.join(', '));
});

test('el arreglo de los secretos en git dice rotar primero y reescribir despues', () => {
  const p = BASE.puntos.find((x) => x.id === 'secretos-en-historial');
  assert.ok(p !== undefined);
  assert.match(p.arreglo, /Rota la clave primero/);
  assert.ok(p.arreglo.indexOf('Rota') < p.arreglo.indexOf('reescribe'));
});

test('los tipos de aplicacion son datos e incluyen los pedidos', () => {
  const ids = BASE.tipos.map((t) => t.id);
  for (const id of ['node', 'npm', 'pnpm', 'yarn', 'rust', 'python', 'java', 'maven', 'gradle', 'dotnet', 'go', 'php', 'ruby', 'docker', 'frontend']) {
    assert.ok(ids.includes(id), `falta el tipo "${id}"`);
  }
  for (const t of BASE.tipos) assert.ok(t.marcadores.length > 0, t.id);
});

test('el catalogo no menciona ningun proyecto concreto y es ASCII: se distribuye a otros repos', () => {
  for (const termino of ['taskcode', 'taskctl', 'gitflow']) {
    assert.equal(new RegExp(`\\b${termino}`, 'i').test(CONTENIDO), false, `menciona "${termino}"`);
  }
  const noAscii = CONTENIDO.split(/\r?\n/)
    .map((l, i) => ({ l, n: i + 1 }))
    .filter(({ l }) => /[^\t\x20-\x7E]/.test(l));
  assert.deepEqual(noAscii.map((x) => x.n), []);
});

// ---------------------------------------------------------------------
// Parseo del catalogo
// ---------------------------------------------------------------------

const MINIMO = `total_tipos: 1
total_puntos: 1
tipo_1_id: node
tipo_1_marcadores: [package.json]
punto_1_id: mio
punto_1_severidad: alta
punto_1_tipos: [todos]
punto_1_metodo: juicio
punto_1_arreglo: Arreglalo
punto_1_descripcion: Algo
`;

function errorDe(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    assert.ok(e instanceof DoctorDeployCatalogoError, `no es DoctorDeployCatalogoError: ${String(e)}`);
    return e.message;
  }
  assert.fail('deberia haber abortado');
}

test('un catalogo minimo parsea', () => {
  const c = parsearCatalogoDeploy(MINIMO, 'x.yml');
  assert.equal(c.puntos[0]?.id, 'mio');
  assert.equal(c.puntos[0]?.referencia, null);
});

test('catalogo: total_puntos distinto de las entradas aborta', () => {
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('total_puntos: 1', 'total_puntos: 2'), 'x.yml')), /total_puntos/);
});

test('catalogo: determinista sin sonda, o con sonda desconocida, aborta; juicio con sonda tambien', () => {
  const det = MINIMO.replace('metodo: juicio', 'metodo: determinista');
  assert.match(errorDe(() => parsearCatalogoDeploy(det, 'x.yml')), /exige "punto_1_sonda"/);
  assert.match(errorDe(() => parsearCatalogoDeploy(`${det}punto_1_sonda: inventada\n`, 'x.yml')), /no es una comprobacion registrada/);
  assert.match(errorDe(() => parsearCatalogoDeploy(`${MINIMO}punto_1_sonda: lockfile\n`, 'x.yml')), /no tiene sentido/);
});

test('catalogo: tipo desconocido en un punto, clave desconocida y clave repetida abortan', () => {
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('[todos]', '[cobol]'), 'x.yml')), /el tipo "cobol"|tipo "cobol"/);
  assert.match(errorDe(() => parsearCatalogoDeploy(`${MINIMO}punto_1_inventado: x\n`, 'x.yml')), /clave desconocida/);
  assert.match(errorDe(() => parsearCatalogoDeploy(`${MINIMO}punto_1_id: otro\n`, 'x.yml')), /repetida/);
});

test('catalogo: falta un campo obligatorio aborta con el nombre de la clave', () => {
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('punto_1_arreglo: Arreglalo\n', ''), 'x.yml')), /punto_1_arreglo/);
});

// ---------------------------------------------------------------------
// Capa del proyecto
// ---------------------------------------------------------------------

const baseConDos: CatalogoBase = parsearCatalogoDeploy(
  `${MINIMO.replace('total_puntos: 1', 'total_puntos: 2')}` +
    'punto_2_id: otro\npunto_2_severidad: baja\npunto_2_tipos: [node]\npunto_2_metodo: determinista\npunto_2_sonda: lockfile\npunto_2_arreglo: Arreglo largo\npunto_2_descripcion: Descripcion larga\n',
  'x.yml'
);

test('capa: sin ficheros, vacia', () => {
  const c = parsearCapaProyecto('', 'p.yml', baseConDos);
  assert.deepEqual(c, { desactivados: [], anadidos: [], silencios: [], avisos: [] });
});

test('capa: desactivar sin motivo aborta y dice por que', () => {
  const m = errorDe(() => parsearCapaProyecto('desactivar_1_id: mio\n', 'p.yml', baseConDos));
  assert.match(m, /exige "desactivar_1_motivo"/);
  assert.match(errorDe(() => parsearCapaProyecto('desactivar_1_id: mio\ndesactivar_1_motivo:\n', 'p.yml', baseConDos)), /exige "desactivar_1_motivo"/);
});

test('capa: desactivar con motivo funciona y combinar lo marca; un id desconocido solo avisa', () => {
  const capa = parsearCapaProyecto(
    'desactivar_1_id: mio\ndesactivar_1_motivo: Es una libreria sin servidor\ndesactivar_2_id: no-existe\ndesactivar_2_motivo: x\n',
    'p.yml',
    baseConDos
  );
  assert.equal(capa.desactivados.length, 2);
  assert.equal(capa.avisos.length, 1);
  assert.match(capa.avisos[0] as string, /"no-existe", que no existe/);
  const efectivo = combinarCatalogo(baseConDos, capa);
  assert.equal(efectivo.desactivados.get('mio'), 'Es una libreria sin servidor');
  assert.equal(efectivo.desactivados.has('no-existe'), false);
});

test('capa: anadir un punto de juicio o con sonda registrada vale; un id repetido aborta', () => {
  const nuevo =
    'punto_1_id: propio\npunto_1_severidad: media\npunto_1_tipos: [todos]\npunto_1_metodo: juicio\npunto_1_arreglo: A\npunto_1_descripcion: D\n';
  const capa = parsearCapaProyecto(nuevo, 'p.yml', baseConDos);
  assert.equal(capa.anadidos[0]?.origen, 'proyecto');
  assert.deepEqual(combinarCatalogo(baseConDos, capa).puntos.map((p) => p.id), ['mio', 'otro', 'propio']);

  assert.match(errorDe(() => parsearCapaProyecto(nuevo.replace('propio', 'mio'), 'p.yml', baseConDos)), /ya existe en el catalogo del plugin/);
  assert.match(
    errorDe(() => parsearCapaProyecto(`${nuevo}${nuevo.replace(/punto_1/g, 'punto_2')}`, 'p.yml', baseConDos)),
    /ya existe en este mismo fichero/
  );
  // El proyecto no inyecta codigo: una sonda que no esta registrada aborta.
  assert.match(
    errorDe(() => parsearCapaProyecto(nuevo.replace('juicio', 'determinista') + 'punto_1_sonda: mi-script\n', 'p.yml', baseConDos)),
    /no es una comprobacion registrada/
  );
});

test('capa: una clave desconocida avisa y se ignora', () => {
  const capa = parsearCapaProyecto('algo_raro: 1\n', 'p.yml', baseConDos);
  assert.equal(capa.avisos.length, 1);
  assert.match(capa.avisos[0] as string, /clave desconocida "algo_raro"/);
});

const SILENCIO =
  'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: config\\prod.env\nsilenciar_1_commit: ABCDEF1\nsilenciar_1_motivo: Rotada el 2026-10-01\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n';

test('capa: un silencio lleva patron, fichero, motivo, quien y fecha; commit es opcional', () => {
  const capa = parsearCapaProyecto(SILENCIO, 'p.yml', baseConDos);
  assert.deepEqual(capa.silencios[0], {
    numero: 1,
    patron: 'stripe-live',
    fichero: 'config/prod.env',
    commit: 'abcdef1',
    huella: null,
    motivo: 'Rotada el 2026-10-01',
    quien: 'carlos',
    fecha: '2026-10-27',
  });
  // Sin commit solo vale para el arbol, y entonces exige la huella del valor.
  const sinCommit = parsearCapaProyecto(SILENCIO.replace(/silenciar_1_commit.*\n/, 'silenciar_1_huella: AB12cd34ef56\n'), 'p.yml', baseConDos);
  assert.equal(sinCommit.silencios[0]?.commit, null);
  assert.equal(sinCommit.silencios[0]?.huella, 'ab12cd34ef56');
  assert.match(
    errorDe(() => parsearCapaProyecto(SILENCIO.replace(/silenciar_1_commit.*\n/, ''), 'p.yml', baseConDos)),
    /exige "silenciar_1_commit" .* o "silenciar_1_huella"/
  );
  // Un fichero-secreto (sin valor) no tiene huella: vale sin commit.
  assert.equal(
    parsearCapaProyecto(SILENCIO.replace(/silenciar_1_commit.*\n/, '').replace('stripe-live', 'fichero-secreto'), 'p.yml', baseConDos).silencios.length,
    1
  );
  assert.match(errorDe(() => parsearCapaProyecto(SILENCIO + 'silenciar_1_huella: zz\n', 'p.yml', baseConDos)), /silenciar_1_huella/);
});

test('capa: un silencio sin motivo, sin quien, con fecha mala o con commit mal formado aborta', () => {
  for (const campo of ['motivo', 'quien', 'fecha', 'patron', 'fichero']) {
    const sin = SILENCIO.split('\n').filter((l) => !l.startsWith(`silenciar_1_${campo}:`)).join('\n');
    assert.match(errorDe(() => parsearCapaProyecto(sin, 'p.yml', baseConDos)), new RegExp(`silenciar_1_${campo}`));
  }
  assert.match(errorDe(() => parsearCapaProyecto(SILENCIO.replace('2026-10-27', 'ayer'), 'p.yml', baseConDos)), /AAAA-MM-DD/);
  assert.match(errorDe(() => parsearCapaProyecto(SILENCIO.replace('ABCDEF1', 'zzz'), 'p.yml', baseConDos)), /hash de commit/);
  // Un hash de solo digitos se leeria como numero (y perderia ceros): hay que citarlo.
  assert.match(errorDe(() => parsearCapaProyecto(SILENCIO.replace('ABCDEF1', '1234567'), 'p.yml', baseConDos)), /entre comillas/);
  assert.equal(parsearCapaProyecto(SILENCIO.replace('ABCDEF1', '"0123456"'), 'p.yml', baseConDos).silencios[0]?.commit, '0123456');
});

test('capa: numeracion con saltos aborta', () => {
  assert.match(errorDe(() => parsearCapaProyecto('desactivar_2_id: mio\ndesactivar_2_motivo: x\n', 'p.yml', baseConDos)), /faltan las claves "desactivar_1_/);
});
