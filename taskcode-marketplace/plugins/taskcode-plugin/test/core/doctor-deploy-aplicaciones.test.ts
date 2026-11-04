/**
 * TASK-068: el tipo de aplicacion como segundo eje del catalogo de
 * doctor-deploy (familia `aplicacion_N_*` y campo `punto_N_aplicaciones`).
 * El catalogo real se parsea de verdad; el resto, con catalogos minimos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cargarCatalogoDeploy,
  DoctorDeployCatalogoError,
  parsearCapaProyecto,
  parsearCatalogoDeploy,
} from '../../src/core/doctor-deploy-catalogo.js';

const BASE = cargarCatalogoDeploy();

/** Los tipos de aplicacion que pide el criterio 1. */
const APLICACIONES_PEDIDAS = ['web', 'api', 'android', 'ios', 'flutter', 'react-native', 'cli', 'libreria'];

/** Los puntos que nombra el criterio 2. */
const SEIS_DEL_CRITERIO = ['https-obligatorio', 'cookies-seguras', 'security-headers', 'rate-limits', 'backups-y-migraciones', 'health-check'];

/** Los que ademas se etiquetaron por ser claramente de un servicio desplegado. */
const ETIQUETADOS_ADEMAS = ['proteccion-de-bots', 'limitar-respuestas-api', 'cors-restringido', 'proteccion-csrf'];

function errorDe(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    assert.ok(e instanceof DoctorDeployCatalogoError, `no es DoctorDeployCatalogoError: ${String(e)}`);
    return e.message;
  }
  assert.fail('deberia haber abortado');
}

// ---------------------------------------------------------------------
// Catalogo real
// ---------------------------------------------------------------------

test('el catalogo real declara los tipos de aplicacion pedidos, con marcadores', () => {
  const ids = BASE.aplicaciones.map((a) => a.id);
  for (const id of APLICACIONES_PEDIDAS) assert.ok(ids.includes(id), `falta el tipo de aplicacion "${id}"`);
  for (const a of BASE.aplicaciones) assert.ok(a.marcadores.length > 0, a.id);
  // Ningun id de aplicacion coincide con uno de tipo de lenguaje.
  const idsTipo = new Set(BASE.tipos.map((t) => t.id));
  for (const id of ids) assert.equal(idsTipo.has(id), false, id);
});

test('cli, libreria, flutter y react-native exigen un texto dentro del marcador; web no', () => {
  const de = (id: string) => BASE.aplicaciones.find((a) => a.id === id);
  assert.ok(de('cli')?.contiene?.includes('"bin"'));
  assert.ok(de('react-native')?.contiene?.includes('"react-native"'));
  assert.ok(de('flutter')?.contiene?.includes('sdk: flutter'));
  assert.ok((de('libreria')?.contiene ?? []).length > 0);
  assert.equal(de('web')?.contiene, null);
});

test('los seis puntos del criterio 2 y los cuatro de servicio declaran aplicaciones', () => {
  for (const id of [...SEIS_DEL_CRITERIO, ...ETIQUETADOS_ADEMAS]) {
    const p = BASE.puntos.find((x) => x.id === id);
    assert.ok(p !== undefined, `no hay punto ${id}`);
    assert.ok(p.aplicaciones !== null, `${id} no declara aplicaciones`);
    assert.equal(p.aplicaciones.includes('cli'), false, id);
    assert.equal(p.aplicaciones.includes('libreria'), false, id);
  }
});

test('decision de la persona: un punto etiquetado solo se apaga por cli o libreria (incluye web, api y movil)', () => {
  // Si un punto dejara fuera web, api o un tipo movil, se apagaria tambien con esos marcadores,
  // y la decision es que solo un marcador de cli o libreria (sin web ni api) lo deja NO APLICA.
  for (const p of BASE.puntos) {
    if (p.aplicaciones === null) continue;
    for (const id of ['web', 'api', 'android', 'ios', 'flutter', 'react-native']) {
      assert.ok(p.aplicaciones.includes(id), `${p.id} no incluye "${id}"`);
    }
  }
});

test('los puntos que no dependen del tipo de aplicacion no lo declaran (p. ej. los secretos)', () => {
  for (const id of ['secretos-en-arbol', 'secretos-en-historial', 'dependencias-vulnerables', 'lockfile-versionado']) {
    assert.equal(BASE.puntos.find((p) => p.id === id)?.aplicaciones, null, id);
  }
});

// ---------------------------------------------------------------------
// Parseo
// ---------------------------------------------------------------------

const MINIMO = `total_tipos: 1
total_aplicaciones: 2
total_puntos: 1
tipo_1_id: node
tipo_1_marcadores: [package.json]
aplicacion_1_id: cli
aplicacion_1_nombre: CLI
aplicacion_1_marcadores: [package.json]
aplicacion_1_contiene: ["\\"bin\\"", "[[bin]]"]
aplicacion_2_id: web
aplicacion_2_marcadores: [vite.config.ts]
punto_1_id: mio
punto_1_severidad: alta
punto_1_tipos: [todos]
punto_1_aplicaciones: [web]
punto_1_metodo: juicio
punto_1_arreglo: Arreglalo
punto_1_descripcion: Algo
`;

test('un catalogo con aplicaciones parsea: contiene sin comillas de mas, nombre por defecto el id', () => {
  const c = parsearCatalogoDeploy(MINIMO, 'x.yml');
  assert.deepEqual(c.aplicaciones, [
    { id: 'cli', nombre: 'CLI', marcadores: ['package.json'], contiene: ['"bin"', '[[bin]]'] },
    { id: 'web', nombre: 'web', marcadores: ['vite.config.ts'], contiene: null },
  ]);
  assert.deepEqual(c.puntos[0]?.aplicaciones, ['web']);
});

test('un catalogo sin la familia aplicacion sigue valiendo: sin tipos de aplicacion y puntos sin aplicaciones', () => {
  const antiguo = MINIMO.replace(/^total_aplicaciones.*\n/m, '')
    .replace(/^aplicacion_.*\n/gm, '')
    .replace(/^punto_1_aplicaciones.*\n/m, '');
  const c = parsearCatalogoDeploy(antiguo, 'x.yml');
  assert.deepEqual(c.aplicaciones, []);
  assert.equal(c.puntos[0]?.aplicaciones, null);
});

test('parser: un id de aplicacion desconocido en un punto aborta y dice los validos', () => {
  const m = errorDe(() => parsearCatalogoDeploy(MINIMO.replace('punto_1_aplicaciones: [web]', 'punto_1_aplicaciones: [movil]'), 'x.yml'));
  assert.match(m, /tipo de aplicacion "movil", que no existe/);
  assert.match(m, /cli, web/);
});

test('parser: eje equivocado aborta en los dos sentidos', () => {
  // Un tipo de aplicacion en "tipos".
  assert.match(
    errorDe(() => parsearCatalogoDeploy(MINIMO.replace('punto_1_tipos: [todos]', 'punto_1_tipos: [node, cli]'), 'x.yml')),
    /"cli", que es un tipo de aplicacion, no de lenguaje: va en "punto_1_aplicaciones"/
  );
  // Un tipo de lenguaje en "aplicaciones".
  assert.match(
    errorDe(() => parsearCatalogoDeploy(MINIMO.replace('punto_1_aplicaciones: [web]', 'punto_1_aplicaciones: [web, node]'), 'x.yml')),
    /"node", que es un tipo de lenguaje, no de aplicacion: va en "punto_1_tipos"/
  );
});

test('parser: "todos" en aplicaciones, o la lista vacia, abortan', () => {
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('[web]', '[todos]'), 'x.yml')), /no admite "todos"/);
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('punto_1_aplicaciones: [web]', 'punto_1_aplicaciones: []'), 'x.yml')), /lista no vacia/);
});

test('parser: un id de aplicacion igual a uno de tipo, repetido o mal formado aborta', () => {
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('aplicacion_2_id: web', 'aplicacion_2_id: node').replace('[web]', '[cli]'), 'x.yml')), /ya es un tipo de lenguaje/);
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('aplicacion_2_id: web', 'aplicacion_2_id: cli'), 'x.yml')), /esta repetido/);
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('aplicacion_2_id: web', 'aplicacion_2_id: Web').replace('[web]', '[cli]'), 'x.yml')), /minusculas/);
});

test('parser: total_aplicaciones que no cuadra, o que falta con entradas, aborta', () => {
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('total_aplicaciones: 2', 'total_aplicaciones: 3'), 'x.yml')), /total_aplicaciones/);
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace(/^total_aplicaciones.*\n/m, ''), 'x.yml')), /total_aplicaciones" dice 0 \(no esta\)/);
});

test('parser: contiene vacio, o sin marcadores, aborta', () => {
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('aplicacion_1_contiene: ["\\"bin\\"", "[[bin]]"]', 'aplicacion_1_contiene: []'), 'x.yml')), /aplicacion_1_contiene/);
  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('aplicacion_2_marcadores: [vite.config.ts]\n', ''), 'x.yml')), /aplicacion_2_marcadores/);
});

// ---------------------------------------------------------------------
// Capa del proyecto
// ---------------------------------------------------------------------

const base = parsearCatalogoDeploy(MINIMO, 'x.yml');
const PUNTO_PROYECTO = (lineaExtra: string): string =>
  'punto_1_id: propio\npunto_1_severidad: baja\npunto_1_tipos: [node]\npunto_1_metodo: juicio\n' +
  `punto_1_arreglo: Arreglo largo\npunto_1_descripcion: Descripcion larga\n${lineaExtra}`;

test('capa: un punto propio puede declarar aplicaciones validas', () => {
  const c = parsearCapaProyecto(PUNTO_PROYECTO('punto_1_aplicaciones: [cli]\n'), 'p.yml', base);
  assert.deepEqual(c.anadidos[0]?.aplicaciones, ['cli']);
});

test('capa: aplicacion desconocida o del eje equivocado aborta', () => {
  assert.match(errorDe(() => parsearCapaProyecto(PUNTO_PROYECTO('punto_1_aplicaciones: [escritorio]\n'), 'p.yml', base)), /"escritorio", que no existe/);
  assert.match(errorDe(() => parsearCapaProyecto(PUNTO_PROYECTO('punto_1_aplicaciones: [node]\n'), 'p.yml', base)), /tipo de lenguaje/);
  assert.match(
    errorDe(() => parsearCapaProyecto(PUNTO_PROYECTO('').replace('punto_1_tipos: [node]', 'punto_1_tipos: [web]'), 'p.yml', base)),
    /tipo de aplicacion, no de lenguaje/
  );
});

test('capa: la familia aplicacion no se puede declarar en el proyecto (clave desconocida, aviso)', () => {
  const c = parsearCapaProyecto('aplicacion_1_id: escritorio\n', 'p.yml', base);
  assert.equal(c.avisos.length, 1);
  assert.match(c.avisos[0] as string, /clave desconocida "aplicacion_1_id"/);
});
