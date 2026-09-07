/**
 * Tests de `scripts/heuristica-complejidad.yml` (TASK-032, item D7).
 *
 * El fichero no lo lee todavia ningun comando: sus consumidores son
 * D1/D2, que aun no existen. Eso hace que estos tests sean lo unico
 * que hay entre el fichero y una regresion silenciosa, asi que no se
 * limitan a comprobar que existe:
 *
 * 1. SE PARSEA CON EL PARSER DE VERDAD. No con una relectura ad hoc
 *    ni con un YAML de mentira escrito en el test: con
 *    parseBloqueClaveValor, el mismo bucle `clave: valor` que usan el
 *    frontmatter de las tareas y `.taskcode/config.yml`. Un fichero
 *    que este test aprueba es un fichero que el plugin puede leer.
 * 2. SE COMPARA EL MAPA ENTERO, no clave a clave. Un deepEqual contra
 *    el objeto esperado falla si alguien cambia un peso, borra una
 *    clave, anade una que nadie ha discutido, o escribe un numero
 *    entre comillas (que el parser devolveria como texto).
 * 3. SE PROHIBE EL ANIDAMIENTO EXPLICITAMENTE. Es el fallo que mas
 *    caro sale: el parser NO soporta mapas anidados, pero tampoco los
 *    rechaza — se los traga aplanando la clave hija y perdiendo la
 *    madre. Un fichero anidado seguiria "parseando" y diria otra cosa
 *    de la que pone. Por eso se asevera sobre las lineas crudas: cero
 *    sangria, y ningun valor vacio.
 * 4. SE VIGILA QUE SIGA SIENDO GENERICO. El fichero viaja a proyectos
 *    que no son este; vocabulario de un dominio concreto ahi seria
 *    ruido en todos los demas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseBloqueClaveValor } from '../../src/core/frontmatter.js';

/**
 * dist/test/core/ -> raiz del paquete. Se resuelve desde el modulo, no
 * desde process.cwd(), para que los tests pasen igual lanzados desde
 * la raiz del repo que desde dentro del plugin.
 */
const RAIZ_PAQUETE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const RUTA_YML = path.join(RAIZ_PAQUETE, 'scripts', 'heuristica-complejidad.yml');

const CONTENIDO = readFileSync(RUTA_YML, 'utf8');
const LINEAS = CONTENIDO.split(/\r?\n/);

/** El mismo parseo que hara el plugin: nada de un YAML paralelo. */
function parsear(): ReturnType<typeof parseBloqueClaveValor> {
  return parseBloqueClaveValor(LINEAS, 0, {
    etiqueta: 'heuristica de complejidad',
    crearError: (mensaje) => new Error(`[${RUTA_YML}] ${mensaje}`),
    permitirComentariosDeLinea: true,
  });
}

/**
 * El fichero entero, tal y como el plugin lo va a ver. Cambiar
 * cualquier valor, borrar cualquier clave o anadir una nueva rompe
 * este test, que es exactamente para lo que esta.
 */
const ESPERADO: Record<string, unknown> = {
  // Los seis pesos de la seccion 16.1, tal cual.
  peso_etiqueta_adicional: 1,
  peso_palabra_alto_riesgo: 2,
  peso_dependencia: 1,
  peso_tipo_release: 1,
  peso_tipo_hotfix_con_palabra_riesgo: 2,
  peso_criterios_aceptacion: 1,
  umbral_criterios_aceptacion: 5,
  // Mapeo puntuacion -> nivel: 0-1 trivial, 2-3 simple, 4-5 media,
  // 6-7 compleja, 8+ critica.
  nivel_trivial_hasta: 1,
  nivel_simple_hasta: 3,
  nivel_media_hasta: 5,
  nivel_compleja_hasta: 7,
  nivel_critica_desde: 8,
  palabras_alto_riesgo: [
    'migracion',
    'breaking change',
    'seguridad',
    'autenticacion',
    'autorizacion',
    'esquema de base de datos',
    'rollback',
    'cifrado',
    'datos personales',
    'concurrencia',
    'rendimiento',
    'compatibilidad hacia atras',
    'integracion externa',
    'irreversible',
  ],
  // Extremos dados por la decision #2; los dos intermedios los fija el
  // propio fichero (serie monotona sin saltos).
  agentes_brainstorm_trivial: 0,
  agentes_brainstorm_simple: 1,
  agentes_brainstorm_media: 2,
  agentes_brainstorm_compleja: 3,
  agentes_brainstorm_critica: 4,
  // Tolerancia y asimetria.
  tolerancia_niveles: 1,
  direccion_de_riesgo: 'heuristica_mayor',
  tolerancia_extra_si_heuristica_menor: 0,
  modelo_consulta_discrepancia: 'haiku',
};

test('el fichero se parsea entero con el parser del plugin y dice exactamente lo esperado', () => {
  const { data } = parsear();
  assert.deepEqual(data, ESPERADO);
});

test('no hay claves repetidas: con dos, el fichero dice una cosa y el plugin usa otra', () => {
  const { pares } = parsear();
  const vistas = new Set<string>();
  for (const par of pares) {
    assert.equal(
      vistas.has(par.clave),
      false,
      `la clave "${par.clave}" esta repetida (linea ${par.numeroLinea})`
    );
    vistas.add(par.clave);
  }
  assert.equal(pares.length, Object.keys(ESPERADO).length);
});

test('el fichero es PLANO: ni sangria, ni listas en bloque, ni claves sin valor', () => {
  const contenido = LINEAS.map((linea, i) => ({ linea, numero: i + 1 })).filter(
    ({ linea }) => linea.trim() !== '' && !linea.trim().startsWith('#')
  );
  assert.equal(contenido.length > 0, true, 'el fichero no tiene ni una linea de datos');

  for (const { linea, numero } of contenido) {
    // Sangria = anidamiento. El parser lo aplanaria en silencio: la
    // clave hija sobreviviria con su nombre recortado y la madre se
    // perderia entera, asi que hay que rechazarlo aqui.
    assert.equal(
      linea,
      linea.trimStart(),
      `linea ${numero} sangrada: "${linea}". El parser no soporta anidamiento.`
    );
    assert.equal(
      linea.trimStart().startsWith('- '),
      false,
      `linea ${numero} usa lista en bloque: "${linea}". Solo se admiten listas en linea [a, b].`
    );
    assert.equal(linea.includes(':'), true, `linea ${numero} sin ":": "${linea}"`);
  }

  // Una clave sin valor ("pesos:") es la firma de un mapa anidado.
  for (const par of parsear().pares) {
    assert.notEqual(par.valor, null, `la clave "${par.clave}" no tiene valor (linea ${par.numeroLinea})`);
  }
});

test('todos los pesos y umbrales son enteros, no textos entrecomillados', () => {
  const { data } = parsear();
  for (const clave of Object.keys(ESPERADO)) {
    if (clave === 'palabras_alto_riesgo') continue;
    if (clave === 'direccion_de_riesgo' || clave === 'modelo_consulta_discrepancia') {
      assert.equal(typeof data[clave], 'string', `"${clave}" deberia ser texto`);
      continue;
    }
    const valor = data[clave];
    assert.equal(typeof valor, 'number', `"${clave}" deberia ser un numero, y es ${typeof valor}`);
    assert.equal(Number.isInteger(valor), true, `"${clave}" deberia ser entero`);
    assert.equal((valor as number) >= 0, true, `"${clave}" no puede ser negativo`);
  }
});

test('el mapeo a niveles es una escala coherente y sin huecos', () => {
  const { data } = parsear();
  const trivial = data['nivel_trivial_hasta'] as number;
  const simple = data['nivel_simple_hasta'] as number;
  const media = data['nivel_media_hasta'] as number;
  const compleja = data['nivel_compleja_hasta'] as number;
  const critica = data['nivel_critica_desde'] as number;

  // Estrictamente creciente: si dos cortes se cruzan o se igualan, un
  // nivel entero deja de ser alcanzable.
  assert.equal(trivial < simple, true, 'trivial debe cortar antes que simple');
  assert.equal(simple < media, true, 'simple debe cortar antes que media');
  assert.equal(media < compleja, true, 'media debe cortar antes que compleja');
  // Sin hueco entre el ultimo nivel cerrado y el abierto: una
  // puntuacion de compleja+1 tiene que caer en critica y en nada mas.
  assert.equal(critica, compleja + 1, 'entre compleja y critica no puede quedar ninguna puntuacion huerfana');
  // La escala de la 16.1, literal.
  assert.deepEqual([trivial, simple, media, compleja, critica], [1, 3, 5, 7, 8]);
});

test('la tabla de agentes de brainstorm es monotona y respeta los extremos de la decision #2', () => {
  const { data } = parsear();
  const serie = [
    data['agentes_brainstorm_trivial'],
    data['agentes_brainstorm_simple'],
    data['agentes_brainstorm_media'],
    data['agentes_brainstorm_compleja'],
    data['agentes_brainstorm_critica'],
  ] as number[];

  // Extremos dados: 0 en trivial, 3 en compleja, 4 en critica.
  assert.equal(serie[0], 0, 'trivial no paga brainstorm');
  assert.equal(serie[3], 3, 'compleja son 3 agentes');
  assert.equal(serie[4], 4, 'critica son 4 agentes (los cuatro roles)');
  // Los intermedios los fija el fichero, pero la serie no puede bajar.
  for (let i = 1; i < serie.length; i++) {
    assert.equal(
      (serie[i] as number) >= (serie[i - 1] as number),
      true,
      `mas complejidad nunca puede significar menos agentes: ${serie.join(', ')}`
    );
  }
  // Ningun nivel puede pedir mas agentes que roles hay definidos.
  for (const n of serie) assert.equal(n <= 4, true, `no hay mas de 4 roles: ${serie.join(', ')}`);
});

test('la tolerancia acepta la coincidencia y un nivel de distancia, y la asimetria queda declarada', () => {
  const { data } = parsear();
  assert.equal(data['tolerancia_niveles'], 1, 'se acepta hasta un nivel de distancia sin gastar modelo');
  // La direccion que importa es que la heuristica sugiera MAS
  // complejidad que la declarada: infraestimar es lo caro.
  assert.equal(data['direccion_de_riesgo'], 'heuristica_mayor');
  // La holgura extra solo aplica cuando la heuristica queda por
  // debajo, y hoy arranca en 0: el comportamiento por defecto es
  // simetrico, y abrirlo tiene que ser una decision consciente.
  assert.equal(data['tolerancia_extra_si_heuristica_menor'], 0);
  assert.equal(typeof data['modelo_consulta_discrepancia'], 'string');
  assert.notEqual((data['modelo_consulta_discrepancia'] as string).trim(), '');
});

test('las palabras de alto riesgo son genericas, sin vocabulario de ningun proyecto', () => {
  const { data } = parsear();
  const palabras = data['palabras_alto_riesgo'];
  assert.equal(Array.isArray(palabras), true, 'palabras_alto_riesgo debe ser una lista en linea');
  const lista = palabras as unknown[];
  assert.equal(lista.length > 0, true, 'la lista no puede quedarse vacia');

  for (const p of lista) {
    assert.equal(typeof p, 'string', `cada palabra debe ser texto, y hay un ${typeof p}`);
    const s = p as string;
    assert.equal(s, s.trim(), `"${s}" tiene espacios sobrantes`);
    assert.notEqual(s, '', 'hay una entrada vacia');
    // Forma canonica: minusculas y sin tildes, porque la comparacion
    // contra el texto de la tarea es insensible a ambas cosas.
    assert.equal(s, s.toLowerCase(), `"${s}" deberia ir en minusculas`);
    assert.match(s, /^[a-z ]+$/, `"${s}" deberia ser ASCII en minusculas, sin tildes ni signos`);
  }
  assert.equal(new Set(lista).size, lista.length, 'hay palabras repetidas en la lista');

  // Las seis que nombra la 16.1 tienen que seguir estando.
  for (const obligatoria of [
    'migracion',
    'breaking change',
    'seguridad',
    'autenticacion',
    'esquema de base de datos',
    'rollback',
  ]) {
    assert.equal(lista.includes(obligatoria), true, `falta la palabra "${obligatoria}"`);
  }
});

test('el fichero no menciona ningun proyecto, ruta o jerga concreta: se distribuye a otros repos', () => {
  // Sobre el fichero ENTERO, comentarios incluidos: un comentario que
  // nombre el repo de origen envejece igual de mal que un valor.
  const prohibidos = [
    'taskcode',
    'taskctl',
    'ifc',
    'postgis',
    'catastr',
    'autocad',
    'revit',
    'bim',
    'geometria',
    'gitflow',
  ];
  const minusculas = CONTENIDO.toLowerCase();
  for (const termino of prohibidos) {
    const encontrado = new RegExp(`\\b${termino}`, 'i').test(minusculas);
    assert.equal(
      encontrado,
      false,
      `el fichero menciona "${termino}": es vocabulario de un proyecto concreto, no un default generico`
    );
  }
});

test('el fichero es ASCII: comentarios en espanol pero sin tildes', () => {
  const lineasConAcentos = LINEAS.map((linea, i) => ({ linea, numero: i + 1 })).filter(
    ({ linea }) => /[^\t\x20-\x7E]/.test(linea)
  );
  assert.deepEqual(
    lineasConAcentos.map(({ numero }) => numero),
    [],
    `hay caracteres no ASCII en las lineas: ${lineasConAcentos
      .map(({ numero, linea }) => `${numero}: ${linea}`)
      .join(' | ')}`
  );
});
