/**
 * Tests de `src/core/roles-brainstorm.ts` (TASK-016, item D1).
 *
 * Lo que se prueba aqui es EL ACOPLAMIENTO, que es lo que hoy no cubre
 * nadie. `test/agents/brainstorm-roles.test.ts` mira los cuatro ficheros
 * `agents/brainstorm-*.md` por dentro (frontmatter, secciones, tope de
 * salida) y comprueba que cada `name:` coincide con SU nombre de
 * fichero; nunca abre la constante del codigo. Este fichero cierra el
 * otro lado del contrato: que la lista de roles que el CLI usa para
 * dirigir peticiones y el directorio de agentes que las atiende sean el
 * mismo conjunto, en las dos direcciones. Con las dos mitades, un id
 * inventado en el codigo y un rol nuevo en disco dejan de poder
 * esconderse.
 *
 * La otra mitad del fichero es el contrato de `seleccionarRoles`, la
 * inmutabilidad de la constante y las dos invariantes que sostienen el
 * criterio de aceptacion 1 de la tarea ("contexto acotado por rol"):
 * que los recortes de contexto sean DISTINTOS entre roles y que cada
 * uno ceda explicitamente a los otros tres lo que no mira.
 *
 * REGLA DE LA SUITE: cada test lleva encima, en una linea, la mutacion
 * del codigo fuente que lo pone rojo. Un test cuya mutacion no se sabe
 * nombrar no esta midiendo nada.
 *
 * Cero dependencias y cero mocks: se lee el directorio `agents/` real
 * con `readdir` y se parsea el frontmatter con el parser del plugin.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/core/frontmatter.js';
import {
  ROLES_BRAINSTORM,
  RolesBrainstormError,
  UNIFICADOR_ID,
  seleccionarRoles,
} from '../../src/core/roles-brainstorm.js';
import type { RolBrainstorm, RolBrainstormId } from '../../src/core/roles-brainstorm.js';

// --- Localizacion del plugin -------------------------------------------
//
// Compilado, este fichero vive en dist/test/core/. Tres niveles arriba
// esta la raiz del plugin. Mismo truco que test/agents/brainstorm-roles.test.ts,
// en vez de depender del cwd de npm.

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
const AGENTS_DIR = path.join(PLUGIN_ROOT, 'agents');

/**
 * Que ficheros de `agents/` cuentan como "un rol de brainstorm". El
 * patron es deliberadamente amplio: la gracia del test 2 es que un
 * `brainstorm-seguridad.md` que nadie ha metido en la constante CAIGA
 * dentro y de un rojo, no que se escape por no estar enumerado.
 */
const FICHERO_DE_ROL = /^brainstorm-[a-z0-9-]+\.md$/;

const ids = (roles: readonly RolBrainstorm[]): RolBrainstormId[] =>
  roles.map((r) => r.id);

/** Los ids como texto llano, para poder compararlos con `UNIFICADOR_ID`. */
const idsComoTexto = (): string[] => ROLES_BRAINSTORM.map((r) => r.id);

/** Los nombres (sin `.md`) de los ficheros de rol que hay en `agents/`. */
async function rolesEnDisco(): Promise<string[]> {
  const entradas = await readdir(AGENTS_DIR);
  return (
    entradas
      .filter((f) => FICHERO_DE_ROL.test(f))
      .map((f) => f.replace(/\.md$/, ''))
      // El unificador queda fuera A PROPOSITO. `UNIFICADOR_ID` empieza
      // por "brainstorm-" y por tanto casaria con el patron de arriba,
      // pero no es un rol de brainstorm: no aporta un punto de vista,
      // consolida los cuatro que si lo hacen. Hoy no tiene fichero en
      // `agents/`, asi que este filtro no quita nada; esta escrito para
      // que el dia que se le escriba uno, ese fichero no obligue a
      // meterlo en `ROLES_BRAINSTORM` (donde romperia el reparto de
      // `seleccionarRoles`). Que no este en la constante lo asevera el
      // test 4, que es donde vive esa decision.
      .filter((id) => id !== UNIFICADOR_ID)
      .sort()
  );
}

/**
 * La respuesta esperada de `seleccionarRoles` para cada n valido. Se
 * escriben los ids A MANO y no derivados de la constante: derivarlos
 * haria que reordenar `ROLES_BRAINSTORM` cambiase a la vez lo medido y
 * la medida, y el test seguiria verde con el orden de prioridad al
 * reves. El orden de prioridad es la unica decision de diseño del
 * modulo; tiene que estar escrita en un sitio que no se mueva con el.
 */
const ESPERADO_POR_N: ReadonlyArray<readonly string[]> = [
  [],
  ['brainstorm-arquitectura'],
  ['brainstorm-arquitectura', 'brainstorm-riesgos'],
  ['brainstorm-arquitectura', 'brainstorm-riesgos', 'brainstorm-testing'],
  [
    'brainstorm-arquitectura',
    'brainstorm-riesgos',
    'brainstorm-testing',
    'brainstorm-dominio',
  ],
];

// --- 0. Guard de no-vacuidad -------------------------------------------

// Mutacion: cambiar PLUGIN_ROOT a path.resolve(moduleDir, '..', '..') -> rojo.
test('0. el test apunta de verdad a la raiz del plugin (guard de no-vacuidad)', async () => {
  const pkg = JSON.parse(
    await readFile(path.join(PLUGIN_ROOT, 'package.json'), 'utf8')
  ) as { name?: unknown };
  assert.equal(
    pkg.name,
    'taskcode-plugin',
    `PLUGIN_ROOT resuelto a "${PLUGIN_ROOT}", que no es el plugin: los tests que ` +
      'leen agents/ estarian mirando otro directorio o fallando por ruta'
  );
});

// --- 1. El acoplamiento con agents/, en las dos direcciones -------------

// Mutacion: borrar el rol 'brainstorm-dominio' de ROLES_BRAINSTORM (o crear
// agents/brainstorm-seguridad.md sin tocar la constante) -> rojo.
test('1. los ids de ROLES_BRAINSTORM y los ficheros de agents/ son el MISMO conjunto', async () => {
  const esperados = [...idsComoTexto()].sort();
  // Guard de no-vacuidad: con la constante vacia, la comparacion de
  // abajo seria [] contra [] y este test daria verde sin medir nada.
  assert.ok(
    esperados.length > 0,
    'ROLES_BRAINSTORM esta vacia: la comparacion contra agents/ no probaria nada'
  );

  const enDisco = await rolesEnDisco();

  // deepEqual de listas ORDENADAS, no un includes de uno en uno: el
  // includes solo mira que no falte ninguno, y deja pasar que SOBRE.
  // Un quinto `agents/brainstorm-seguridad.md` que nadie haya metido en
  // la constante no se le enviaria nunca una peticion, y el silencio no
  // se distingue de que el rol no exista. La igualdad de conjuntos hace
  // que anadir un rol obligue a tocar las dos partes, que es
  // exactamente la decision que se quiere que alguien tome a mano.
  assert.deepEqual(
    enDisco,
    esperados,
    `el codigo y agents/ han dejado de cuadrar.\n  en ROLES_BRAINSTORM: ${esperados.join(', ')}` +
      `\n  en agents/:          ${enDisco.join(', ')}\n` +
      '  Sobran en disco (roles sin id, no se les invocara nunca): ' +
      `${enDisco.filter((f) => !esperados.includes(f)).join(', ') || 'ninguno'}\n` +
      '  Faltan en disco (ids sin agente, se invocaria a un agente inexistente): ' +
      `${esperados.filter((i) => !enDisco.includes(i)).join(', ') || 'ninguno'}`
  );
});

for (const rol of ROLES_BRAINSTORM) {
  // Mutacion: cambiar el id 'brainstorm-riesgos' por 'brainstorm-riesgo' en el modulo -> rojo.
  test(`2. ${rol.id}: el id es literalmente el "name:" del frontmatter de agents/${rol.id}.md`, async () => {
    // El listado del directorio, y no un stat() de la ruta: en Windows
    // el filesystem es case-insensitive y un stat NO demuestra el case.
    const enAgents = await readdir(AGENTS_DIR);
    assert.ok(
      enAgents.includes(`${rol.id}.md`),
      `ROLES_BRAINSTORM declara el id "${rol.id}" pero agents/ no tiene un ` +
        `"${rol.id}.md" con ese case exacto. Hay: ${enAgents.join(', ')}`
    );

    const { data } = parseFrontmatter(
      await readFile(path.join(AGENTS_DIR, `${rol.id}.md`), 'utf8')
    );

    // Esta es la igualdad que hace invocable al rol: Claude Code llama
    // al agente por su `name`, no por su ruta, y el CLI escribe la
    // peticion contra el `id`. Si divergen, el plugin estaria pidiendo
    // trabajo a un agente que no existe, en silencio.
    assert.equal(
      data.name,
      rol.id,
      `agents/${rol.id}.md declara name="${String(data.name)}", que no es el id ` +
        `"${rol.id}" de ROLES_BRAINSTORM: las peticiones dirigidas a ese id no ` +
        'llegarian a ningun agente'
    );
  });
}

// Mutacion: anadir { id: UNIFICADOR_ID, ... } como quinto elemento de ROLES_BRAINSTORM -> rojo.
test('3. UNIFICADOR_ID no es uno de los roles de brainstorm', () => {
  // No es un detalle de nomenclatura. `seleccionarRoles` reparte por
  // prioridad sobre ROLES_BRAINSTORM: colar ahi al unificador lo pondria
  // a competir por un puesto del presupuesto de agentes con los roles a
  // los que tiene que consolidar, y con n<5 podria quedarse fuera el
  // rol cuyo trabajo viene a unificar.
  assert.ok(
    !idsComoTexto().includes(UNIFICADOR_ID),
    `"${UNIFICADOR_ID}" figura en ROLES_BRAINSTORM: el unificador consolida a los ` +
      'roles de brainstorm, no es uno de ellos'
  );
});

// --- 2. seleccionarRoles ------------------------------------------------

// Mutacion: intercambiar los roles de arquitectura y riesgos en ROLES_BRAINSTORM -> rojo.
test('4. seleccionarRoles(n) devuelve los n primeros por prioridad, con los ids concretos', () => {
  // Guard: si manana entra un quinto rol, esta tabla se queda corta y
  // el test tiene que obligar a extenderla en vez de dejar el caso sin
  // comprobar.
  assert.equal(
    ESPERADO_POR_N.length,
    ROLES_BRAINSTORM.length + 1,
    `hay ${ROLES_BRAINSTORM.length} roles y la tabla de esperados cubre ` +
      `${ESPERADO_POR_N.length - 1}: extiende ESPERADO_POR_N`
  );

  for (const [n, esperado] of ESPERADO_POR_N.entries()) {
    assert.deepEqual(
      ids(seleccionarRoles(n)),
      esperado,
      `seleccionarRoles(${n}) no devuelve los ${n} primeros por prioridad`
    );
  }

  // Y la longitud, dicha aparte: si el orden esperado y el real se
  // rompieran a la vez de la misma forma, la comparacion de arriba
  // seguiria siendo la que manda, pero esto deja el conteo explicito.
  assert.equal(seleccionarRoles(0).length, 0);
  assert.equal(
    seleccionarRoles(ROLES_BRAINSTORM.length).length,
    ROLES_BRAINSTORM.length
  );
});

// Mutacion: cambiar `ROLES_BRAINSTORM.slice(0, n)` por `.slice(-n)` -> rojo.
test('5. seleccionarRoles es estable entre invocaciones y cada n es prefijo del siguiente', () => {
  for (let n = 0; n <= ROLES_BRAINSTORM.length; n++) {
    // Estable: dos llamadas seguidas con el mismo n dan lo mismo. Que
    // parezca obvio es el motivo de escribirlo: el dia que alguien
    // ordene o baraje aqui dentro, el brainstorm dejaria de ser
    // reproducible entre dos ejecuciones de la misma tarea.
    assert.deepEqual(
      ids(seleccionarRoles(n)),
      ids(seleccionarRoles(n)),
      `seleccionarRoles(${n}) devuelve cosas distintas en dos llamadas seguidas`
    );
  }

  // Prefijo: quitar presupuesto solo puede quitar roles por la cola,
  // nunca cambiar cuales entran. Es lo que hace que la prioridad
  // signifique algo.
  for (let n = 0; n < ROLES_BRAINSTORM.length; n++) {
    assert.deepEqual(
      ids(seleccionarRoles(n)),
      ids(seleccionarRoles(n + 1)).slice(0, n),
      `seleccionarRoles(${n}) no es el prefijo de seleccionarRoles(${n + 1}): ` +
        'bajar el presupuesto en uno cambia QUE roles entran, no solo cuantos'
    );
  }
});

// Mutacion: quitar `!Number.isInteger(n) ||` de la guarda de seleccionarRoles -> rojo (1.5 y NaN).
// Mutacion: quitar `n > ROLES_BRAINSTORM.length` de esa misma guarda -> rojo (n=5).
test('6. seleccionarRoles rechaza n fuera de rango y no entero, con un mensaje que dice que hacer', () => {
  const invalidos: ReadonlyArray<readonly [number, string]> = [
    [ROLES_BRAINSTORM.length + 1, 'mas roles de los que hay'],
    [-1, 'negativo'],
    [1.5, 'no entero'],
    [Number.NaN, 'NaN'],
    [Number.POSITIVE_INFINITY, 'infinito'],
  ];

  for (const [n, motivo] of invalidos) {
    assert.throws(
      () => seleccionarRoles(n),
      (error: unknown) => {
        // El tipo importa: la unica forma que tiene quien llama de
        // distinguir "la tabla del YML y esta lista no cuadran" de un
        // fallo cualquiera es el tipo del error.
        assert.ok(
          error instanceof RolesBrainstormError,
          `seleccionarRoles(${n}) (${motivo}) lanzo ${String(error)}, que no es ` +
            'RolesBrainstormError'
        );

        // Y el mensaje tiene que decir QUE HACER, no solo que algo va
        // mal: donde esta la tabla que hay que revisar y cual es el
        // tope. Sin esto, el error correcto es igual de inutil que un
        // "invalid argument".
        assert.match(
          error.message,
          /heuristica-complejidad\.yml/,
          `el mensaje de seleccionarRoles(${n}) no dice donde esta la tabla que ` +
            `hay que corregir: "${error.message}"`
        );
        assert.match(
          error.message,
          /agentes_brainstorm_/,
          `el mensaje de seleccionarRoles(${n}) no nombra las claves que hay que ` +
            `revisar: "${error.message}"`
        );
        assert.ok(
          error.message.includes(String(ROLES_BRAINSTORM.length)),
          `el mensaje de seleccionarRoles(${n}) no dice cuantos roles hay como ` +
            `maximo (${ROLES_BRAINSTORM.length}): "${error.message}"`
        );
        return true;
      },
      `seleccionarRoles(${n}) (${motivo}) no lanzo: un n fuera de rango recortado ` +
        'en silencio significa que la tabla del YML y esta lista han dejado de cuadrar'
    );
  }
});

// --- 3. Inmutabilidad ---------------------------------------------------

// Mutacion: quitar el Object.freeze exterior de ROLES_BRAINSTORM, o el de un `mira` -> rojo.
test('7. ROLES_BRAINSTORM esta congelada en los dos niveles y no se puede mutar', () => {
  const antes = JSON.stringify(ROLES_BRAINSTORM);

  const primero = ROLES_BRAINSTORM[0];
  assert.ok(primero !== undefined, 'ROLES_BRAINSTORM esta vacia: no hay nada que congelar');

  assert.ok(Object.isFrozen(ROLES_BRAINSTORM), 'el array ROLES_BRAINSTORM no esta congelado');
  assert.ok(Object.isFrozen(primero), `el rol "${primero.id}" no esta congelado`);
  assert.ok(Object.isFrozen(primero.mira), `el "mira" de "${primero.id}" no esta congelado`);

  // El codigo de un modulo ES corre siempre en modo estricto, asi que
  // una asignacion a una propiedad no escribible LANZA en vez de
  // fallar en silencio. Se asevera el TypeError, que es lo que de
  // verdad ocurre; dar por bueno un "no cambio nada" dejaria pasar el
  // caso de que la constante no estuviera congelada y la mutacion se
  // hubiera aplicado.
  const arrayMutable = ROLES_BRAINSTORM as RolBrainstorm[];
  assert.throws(
    () => arrayMutable.push(primero),
    TypeError,
    'se ha podido anadir un rol a ROLES_BRAINSTORM en caliente'
  );
  assert.throws(
    () => {
      arrayMutable[0] = primero;
    },
    TypeError,
    'se ha podido reemplazar un elemento de ROLES_BRAINSTORM'
  );

  // Segundo nivel: el rol y sus listas. Sin esto, `Object.freeze` sobre
  // el array de fuera dejaria el `mira` de cada rol abierto de par en
  // par, que es justo el recorte de contexto que el diseño acota.
  assert.throws(
    () => {
      primero.titulo = 'otro';
    },
    TypeError,
    `se ha podido cambiar el titulo del rol "${primero.id}"`
  );
  const miraMutable = primero.mira as string[];
  assert.throws(
    () => miraMutable.push('una viñeta que nadie ha revisado'),
    TypeError,
    `se ha podido anadir una linea al "mira" de "${primero.id}"`
  );
  assert.throws(
    () => {
      miraMutable[0] = 'una viñeta que nadie ha revisado';
    },
    TypeError,
    `se ha podido reescribir una linea del "mira" de "${primero.id}"`
  );

  assert.equal(
    JSON.stringify(ROLES_BRAINSTORM),
    antes,
    'ROLES_BRAINSTORM ha cambiado tras los intentos de mutacion'
  );
});

// --- 4. Los recortes de contexto son distintos entre roles --------------

// Mutacion: copiar el array `mira` (o la `pregunta`) de arquitectura en riesgos -> rojo.
test('8. cada rol mira y pregunta algo distinto de los demas', () => {
  let pares = 0;

  for (const r of ROLES_BRAINSTORM) {
    for (const s of ROLES_BRAINSTORM) {
      if (r.id === s.id) continue;
      pares++;

      assert.notEqual(
        r.pregunta,
        s.pregunta,
        `"${r.id}" y "${s.id}" hacen la misma pregunta: "${r.pregunta}"`
      );

      // Ni una sola linea de contexto compartida. Si los cuatro roles
      // recibieran lo mismo no habria cuatro puntos de vista, habria
      // uno con cuatro firmas — y el unificador leeria esa coincidencia
      // como confirmacion en vez de como duplicado.
      const compartidas = r.mira.filter((linea) => s.mira.includes(linea));
      assert.deepEqual(
        compartidas,
        [],
        `"${r.id}" y "${s.id}" comparten literalmente ${compartidas.length} linea(s) de ` +
          `"mira": ${compartidas.join(' | ')}`
      );
    }
  }

  // Guard de no-vacuidad: con 0 o 1 roles los dos bucles no comparan
  // nada y este test daria verde sin ejecutar ninguna asercion.
  assert.equal(
    pares,
    ROLES_BRAINSTORM.length * (ROLES_BRAINSTORM.length - 1),
    'no se han comparado todos los pares de roles distintos'
  );
});

// --- 5. Coherencia interna ---------------------------------------------

// Mutacion: borrar de brainstorm-riesgos.noMira la vineta que cede el testing -> rojo.
// Mutacion: anadir "Donde encaja el cambio (arquitectura)" al noMira de arquitectura -> rojo.
test('9. el "noMira" de cada rol nombra a los otros tres y nunca a si mismo', () => {
  assert.ok(
    ROLES_BRAINSTORM.length > 1,
    'con menos de dos roles no hay a quien ceder nada: el test no mediria nada'
  );

  for (const rol of ROLES_BRAINSTORM) {
    const texto = rol.noMira.join('\n');
    const nombra = (titulo: string): boolean =>
      new RegExp(`\\b${titulo}\\b`, 'i').test(texto);

    // Ceder es nombrar a QUIEN se cede. Un "no miras las pruebas" sin
    // decir de quien son las deja sin dueno: un tema cedido en un solo
    // sentido se acaba mirando dos veces o ninguna.
    const sinCeder = ROLES_BRAINSTORM.filter(
      (otro) => otro.id !== rol.id && !nombra(otro.titulo)
    ).map((otro) => otro.titulo);
    assert.deepEqual(
      sinCeder,
      [],
      `"${rol.id}" no cede nada a ${sinCeder.join(', ')} en su "noMira": ` +
        'sin dueno declarado, ese tema lo cubren todos "por si acaso", que es la ' +
        'forma barata de deshacer el acotado sin que se note'
    );

    // Y al reves: cederse trabajo a uno mismo es una contradiccion
    // dentro del propio rol, y la peticion la lee un agente que no
    // tiene forma de resolverla.
    assert.equal(
      nombra(rol.titulo),
      false,
      `"${rol.id}" se nombra a si mismo ("${rol.titulo}") en su "noMira": ` +
        `${texto}`
    );
  }
});

// Mutacion: dejar `entregables: Object.freeze([])` en un rol, o repetir un titulo -> rojo.
test('10. ningun campo de texto esta vacio y los titulos son todos distintos', () => {
  assert.ok(ROLES_BRAINSTORM.length > 0, 'ROLES_BRAINSTORM esta vacia');

  for (const rol of ROLES_BRAINSTORM) {
    const escalares = [
      ['id', rol.id],
      ['titulo', rol.titulo],
      ['pregunta', rol.pregunta],
    ] as const;
    for (const [campo, valor] of escalares) {
      assert.ok(
        valor.trim().length > 0,
        `el rol "${rol.id}" tiene el campo "${campo}" vacio`
      );
    }

    const listas = [
      ['mira', rol.mira],
      ['noMira', rol.noMira],
      ['entregables', rol.entregables],
    ] as const;
    for (const [campo, lista] of listas) {
      // Una lista vacia es la forma silenciosa de dejar el rol sin
      // acotar: el contrato sigue compilando y la peticion sale sin
      // recorte de contexto, sin cesion o sin formato de salida.
      assert.ok(
        lista.length > 0,
        `el rol "${rol.id}" tiene la lista "${campo}" vacia`
      );
      const vacias = lista.filter((linea) => linea.trim().length === 0);
      assert.deepEqual(
        vacias,
        [],
        `el rol "${rol.id}" tiene ${vacias.length} linea(s) en blanco en "${campo}"`
      );
    }
  }

  // Los titulos van a cabeceras y a nombres de fichero: dos iguales
  // hacen que la salida de un rol pise la del otro.
  const titulos = ROLES_BRAINSTORM.map((r) => r.titulo);
  assert.equal(
    new Set(titulos).size,
    titulos.length,
    `hay titulos repetidos entre los roles: ${titulos.join(', ')}`
  );
});
