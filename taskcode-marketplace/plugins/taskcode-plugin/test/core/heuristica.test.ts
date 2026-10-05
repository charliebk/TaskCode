/**
 * Tests de `src/core/heuristica.ts` y `src/core/tarea-body.ts`
 * (TASK-016).
 *
 * Contra el YML REAL del repo, nunca contra una copia inventada: la
 * pregunta que importa no es "el codigo sabe leer un fichero de pesos"
 * sino "el fichero que se distribuye produce estos numeros". Los casos
 * de error si construyen contenido, pero SIEMPRE mutando el fichero
 * real (quitar una linea, cambiar un valor, anadir una), nunca
 * escribiendo un YAML paralelo: asi la base de cada caso negativo es,
 * por construccion, un fichero que parsea.
 *
 * DOS TRAMPAS QUE ESTOS TESTS EVITAN A PROPOSITO (leccion de TASK-032,
 * donde se colaron siete aserciones que no podian fallar):
 *
 * 1. NO SE REIMPLEMENTA LA TABLA DEL YML CON VALORES A MANO. Los
 *    numeros salen de la `Heuristica` ya cargada, y lo que se asevera
 *    es la RELACION entre ellos (la serie 0-1-2-3-4 sube de uno en
 *    uno, el hotfix es un MIN, los extremos). Copiar la tabla aqui
 *    probaria el test contra si mismo.
 * 2. NINGUN TEST SE CONFORMA CON "NO LANZA". Cada uno asevera un valor
 *    concreto, y donde una asercion solo tendria sentido si el fichero
 *    cumple una precondicion (que el tope de hotfix sea > 0, que la
 *    tabla de critica lo supere), esa precondicion se asevera ANTES,
 *    para que el caso no se vuelva vacio en silencio el dia que
 *    alguien toque el YML.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  CLAVES_HEURISTICA,
  FICHERO_HEURISTICA,
  HeuristicaError,
  SENAL_CRITERIOS,
  SENAL_DEPENDENCIA,
  SENAL_ETIQUETAS,
  SENAL_HOTFIX_RIESGO,
  SENAL_PALABRA,
  SENAL_RELEASE,
  agentesBrainstorm,
  cargarHeuristica,
  nivelHeuristico,
  parsearHeuristica,
  puntuarTarea,
  resolverNumeroAgentes,
  resolverRutaHeuristica,
} from '../../src/core/heuristica.js';
import type { Heuristica } from '../../src/core/heuristica.js';
import { extraerSecciones } from '../../src/core/tarea-body.js';
import { TASK_COMPLEXITIES, TASK_TYPES } from '../../src/core/task.js';
import type { Task, TaskComplexity } from '../../src/core/task.js';

/**
 * dist/test/core/ -> raiz del paquete. Se resuelve desde el modulo, no
 * desde process.cwd(), para que los tests pasen igual lanzados desde
 * la raiz del repo que desde dentro del plugin.
 */
const RAIZ_PAQUETE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const RUTA_YML = path.join(RAIZ_PAQUETE, 'scripts', FICHERO_HEURISTICA);
const BASE = readFileSync(RUTA_YML, 'utf8');

/** La heuristica real del repo. Todo lo demas se mide contra esta. */
const H: Heuristica = parsearHeuristica(BASE, RUTA_YML);

// --------------------------------------------------------------------
// Utilidades de construccion
// --------------------------------------------------------------------

function tarea(campos: Partial<Task> = {}): Task {
  return {
    id: 'TASK-999',
    titulo: 'tarea de prueba',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-999-prueba',
    asignado_a: null,
    regla_seleccion_skill: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-08',
    actualizado: '2026-09-08',
    dependencias: [],
    ...campos,
  };
}

/** Cuerpo de tarea con las dos secciones, en el formato del repo. */
function cuerpo(objetivo: string, criterios: readonly string[] = []): string {
  const lista = criterios.map((c) => `- [ ] ${c}`).join('\n');
  return `## Objetivo\n\n${objetivo}\n\n## Criterios de aceptacion\n${lista}\n`;
}

/** Cuerpo sin ninguna senal: es el cero contra el que se aisla cada peso. */
const CUERPO_NEUTRO = cuerpo('Renombrar una variable local.');

/** N criterios que no disparan ninguna otra senal. */
function criteriosNeutros(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `Punto numero ${i + 1}.`);
}

function sinLineaDe(clave: string): string {
  return BASE.split(/\r?\n/)
    .filter((l) => !l.startsWith(`${clave}:`))
    .join('\n');
}

function conValor(clave: string, valor: string): string {
  return BASE.split(/\r?\n/)
    .map((l) => (l.startsWith(`${clave}:`) ? `${clave}: ${valor}` : l))
    .join('\n');
}

function conLineaExtra(linea: string): string {
  return `${BASE}\n${linea}\n`;
}

/**
 * Predicado para assert.throws: exige HeuristicaError, que el mensaje
 * diga QUE esta mal, y que ademas diga QUE HACER — la convencion del
 * proyecto es que los errores se dirigen a la persona, y eso se
 * materializa en una segunda linea indentada con la instruccion. Sin
 * esa ultima asercion, un mensaje que solo describa el sintoma pasaria.
 */
function errorAccionable(re: RegExp): (e: unknown) => boolean {
  return (e: unknown) => {
    assert.ok(e instanceof HeuristicaError, `esperaba HeuristicaError y llego: ${String(e)}`);
    assert.match(e.message, re);
    assert.match(
      e.message,
      /\n {8}\S/,
      `el mensaje describe el problema pero no dice que hacer:\n${e.message}`
    );
    return true;
  };
}

// --------------------------------------------------------------------
// 1. extraerSecciones — el formato real de las tareas del repo
//
// Mutacion que pone rojo este grupo: tocar RE_CABECERA, RE_CRITERIO,
// la normalizacion del titulo o el corte de seccion en tarea-body.ts.
// --------------------------------------------------------------------

test('extraerSecciones lee el objetivo y los criterios con la cabecera SIN tilde', () => {
  const body = [
    '## Objetivo',
    '',
    'Primera linea.',
    'Segunda linea.',
    '',
    '## Criterios de aceptacion',
    '- [ ] Sin marcar.',
    '- [x] Marcado.',
    '',
  ].join('\n');

  const { objetivo, criterios } = extraerSecciones(body);
  assert.equal(objetivo, 'Primera linea.\nSegunda linea.');
  assert.deepEqual(criterios, ['Sin marcar.', 'Marcado.']);
});

test('extraerSecciones acepta tambien la cabecera CON tilde', () => {
  // Las dos formas conviven en el repo: las tareas escritas a mano
  // llevan tilde, las que genera `taskctl new` no. Si solo se aceptara
  // una, la mitad de las tareas puntuaria con cero criterios.
  const conTilde = extraerSecciones(
    '## Objetivo\n\nTexto.\n\n## Criterios de aceptación\n- [ ] Uno.\n- [ ] Dos.\n'
  );
  const sinTilde = extraerSecciones(
    '## Objetivo\n\nTexto.\n\n## Criterios de aceptacion\n- [ ] Uno.\n- [ ] Dos.\n'
  );
  assert.deepEqual(conTilde, sinTilde);
  assert.deepEqual(conTilde.criterios, ['Uno.', 'Dos.']);
});

test('el objetivo termina donde empieza la siguiente cabecera "##"', () => {
  const { objetivo } = extraerSecciones(
    '## Objetivo\n\nEsto si.\n\n## Resultado\n\nEsto no.\n'
  );
  assert.equal(objetivo, 'Esto si.');
});

test('una linea indentada continua el criterio anterior en vez de perderse', () => {
  // Los criterios largos de las tareas reales se parten en varias
  // lineas alineadas bajo el texto. Descartarlas dejaria fuera parte
  // del enunciado justo cuando se buscan palabras de riesgo en el.
  const { criterios } = extraerSecciones(
    '## Criterios de aceptacion\n- [x] Existe una funcion que\n      resuelve la rama base.\n'
  );
  assert.deepEqual(criterios, ['Existe una funcion que resuelve la rama base.']);
});

test('un cuerpo sin ninguna de las dos secciones da objetivo vacio y cero criterios', () => {
  const { objetivo, criterios } = extraerSecciones('Texto suelto.\n- [ ] Esto no cuenta.\n');
  assert.equal(objetivo, '');
  assert.deepEqual(criterios, []);
});

// --------------------------------------------------------------------
// 2. Resolucion de la ruta y carga del fichero real
//
// Mutacion que pone rojo este grupo: cambiar la profundidad de
// packageRoot() (dist/src/core -> raiz son tres saltos) o dejar de
// respetar CLAUDE_PLUGIN_ROOT.
// --------------------------------------------------------------------

test('resolverRutaHeuristica apunta al YML que trae el plugin y cargarHeuristica lo lee', () => {
  const previo = process.env['CLAUDE_PLUGIN_ROOT'];
  delete process.env['CLAUDE_PLUGIN_ROOT'];
  try {
    assert.equal(resolverRutaHeuristica(), RUTA_YML);
    // Sin argumento tiene que dar exactamente lo mismo que parsear el
    // fichero real a mano: si la ruta se calculara mal, esto ni
    // siquiera llegaria a comparar (lanzaria al leer).
    assert.deepEqual(cargarHeuristica(), H);
  } finally {
    if (previo !== undefined) process.env['CLAUDE_PLUGIN_ROOT'] = previo;
  }
});

test('CLAUDE_PLUGIN_ROOT manda sobre la ruta calculada desde el modulo', () => {
  const previo = process.env['CLAUDE_PLUGIN_ROOT'];
  process.env['CLAUDE_PLUGIN_ROOT'] = path.join(path.sep, 'raiz', 'inventada');
  try {
    assert.equal(
      resolverRutaHeuristica(),
      path.join(path.sep, 'raiz', 'inventada', 'scripts', FICHERO_HEURISTICA)
    );
  } finally {
    if (previo === undefined) delete process.env['CLAUDE_PLUGIN_ROOT'];
    else process.env['CLAUDE_PLUGIN_ROOT'] = previo;
  }
});

test('el fichero real da valores concretos y ya tipados', () => {
  // Los extremos de la tabla no son una eleccion del fichero: 0 en
  // trivial (no se paga un brainstorm para algo trivial) y 4 en
  // critica (los cuatro roles definidos). Que salgan como NUMEROS y no
  // como texto es lo que este test anade sobre los del propio YML.
  assert.equal(H.agentes_brainstorm_trivial, 0);
  assert.equal(H.agentes_brainstorm_critica, 4);
  assert.ok(Array.isArray(H.palabras_alto_riesgo));
  assert.ok(H.palabras_alto_riesgo.includes('migracion'));
  assert.equal(
    H.palabras_alto_riesgo.filter((p) => p.trim() === '').length,
    0,
    'una entrada vacia casaria como subcadena con cualquier tarea'
  );
  for (const clave of CLAVES_HEURISTICA) {
    assert.ok(clave in H, `la clave "${clave}" no llego al objeto Heuristica`);
  }
});

// --------------------------------------------------------------------
// 3. La tabla (complejidad, tipo) -> numero de agentes: 5 x 4 = 20
//
// Mutacion que pone rojo este grupo: sustituir el MIN del hotfix por
// una asignacion, aplicar el tope a un tipo que no sea hotfix, o
// barajar la correspondencia nivel -> clave del fichero.
// --------------------------------------------------------------------

test('las 20 filas (complejidad x tipo) salen del fichero, con el tope solo en hotfix', () => {
  const porNivel: Record<TaskComplexity, number> = {
    trivial: H.agentes_brainstorm_trivial,
    simple: H.agentes_brainstorm_simple,
    media: H.agentes_brainstorm_media,
    alta: H.agentes_brainstorm_alta,
    critica: H.agentes_brainstorm_critica,
  };

  let filas = 0;
  for (const nivel of TASK_COMPLEXITIES) {
    for (const tipo of TASK_TYPES) {
      const esperado =
        tipo === 'hotfix'
          ? Math.min(porNivel[nivel], H.agentes_brainstorm_hotfix)
          : porNivel[nivel];
      assert.equal(agentesBrainstorm(nivel, tipo, H), esperado, `fila (${nivel}, ${tipo})`);
      filas++;
    }
  }
  assert.equal(filas, 20, 'la tabla tiene que cubrir las 5 complejidades por los 4 tipos');
});

test('la serie por nivel es monotona y sube de uno en uno: 0-1-2-3-4', () => {
  // El criterio del fichero es que subir un nivel de complejidad anada
  // exactamente un punto de vista. Se asevera la relacion, no los
  // numeros: copiar la tabla aqui probaria el test contra si mismo.
  const serie = TASK_COMPLEXITIES.map((n) => agentesBrainstorm(n, 'feature', H));
  assert.equal(serie[0], 0, 'en trivial no se lanza a nadie');
  for (let i = 1; i < serie.length; i++) {
    assert.equal(
      (serie[i] as number) - (serie[i - 1] as number),
      1,
      `el salto ${String(TASK_COMPLEXITIES[i - 1])} -> ${String(TASK_COMPLEXITIES[i])} no vale 1`
    );
  }
  assert.equal(serie[serie.length - 1], 4, 'en critica entran los cuatro roles definidos');
});

test('hotfix + trivial da 0 y NO 1: el tope es un MIN, no una sustitucion', () => {
  // El caso que discrimina las dos lecturas posibles de la clave. Con
  // una sustitucion, la clave que existe para ABREVIAR el brainstorm
  // acabaria anadiendo un agente donde la tabla no pedia ninguno.
  assert.ok(
    H.agentes_brainstorm_hotfix > H.agentes_brainstorm_trivial,
    'sin esta precondicion el caso no discriminaria nada'
  );
  assert.equal(agentesBrainstorm('trivial', 'hotfix', H), 0);
  assert.notEqual(agentesBrainstorm('trivial', 'hotfix', H), H.agentes_brainstorm_hotfix);
});

test('hotfix + critica si queda topado en el valor de la clave', () => {
  assert.ok(
    H.agentes_brainstorm_critica > H.agentes_brainstorm_hotfix,
    'sin esta precondicion el tope no recortaria nada'
  );
  assert.equal(agentesBrainstorm('critica', 'hotfix', H), H.agentes_brainstorm_hotfix);
});

test('los tipos que no son hotfix leen la tabla sin tocarla', () => {
  for (const tipo of TASK_TYPES) {
    if (tipo === 'hotfix') continue;
    assert.equal(agentesBrainstorm('critica', tipo, H), H.agentes_brainstorm_critica);
    assert.equal(agentesBrainstorm('simple', tipo, H), H.agentes_brainstorm_simple);
  }
});

// --------------------------------------------------------------------
// 4. nivelHeuristico: los bordes de cada tramo
//
// Mutacion que pone rojo: cambiar un "<=" por un "<" en la cascada, o
// desordenar los tramos.
// --------------------------------------------------------------------

test('cada nivel_*_hasta es el ultimo valor que TODAVIA cae en ese nivel', () => {
  assert.equal(nivelHeuristico(H.nivel_trivial_hasta, H), 'trivial');
  assert.equal(nivelHeuristico(H.nivel_trivial_hasta + 1, H), 'simple');
  assert.equal(nivelHeuristico(H.nivel_simple_hasta, H), 'simple');
  assert.equal(nivelHeuristico(H.nivel_simple_hasta + 1, H), 'media');
  assert.equal(nivelHeuristico(H.nivel_media_hasta, H), 'media');
  assert.equal(nivelHeuristico(H.nivel_media_hasta + 1, H), 'alta');
  assert.equal(nivelHeuristico(H.nivel_alta_hasta, H), 'alta');
  assert.equal(nivelHeuristico(H.nivel_critica_desde, H), 'critica');
  assert.equal(nivelHeuristico(0, H), 'trivial');
  // No hay tope por arriba: la escala se abre en critica.
  assert.equal(nivelHeuristico(H.nivel_critica_desde * 10, H), 'critica');
});

// --------------------------------------------------------------------
// 5. Los seis pesos, uno a uno y aislados
//
// Mutacion que pone rojo cada caso: quitar el "-1" de las etiquetas,
// contar dependencias una vez en vez de por dependencia, disparar la
// senal de hotfix sin exigir palabra de riesgo, cambiar el ">=" del
// umbral de criterios por un ">", o cobrar el umbral por criterio.
// --------------------------------------------------------------------

test('el cuerpo neutro no dispara ninguna senal: es el cero de los demas casos', () => {
  const { puntos, senales } = puntuarTarea(tarea(), CUERPO_NEUTRO, H);
  assert.equal(puntos, 0);
  assert.deepEqual(senales, []);
});

test('peso_etiqueta_adicional: la primera etiqueta no puntua, las demas si', () => {
  const una = puntuarTarea(tarea({ etiquetas: ['cli'] }), CUERPO_NEUTRO, H);
  assert.equal(una.puntos, 0);
  assert.deepEqual(una.senales, []);

  const dos = puntuarTarea(tarea({ etiquetas: ['cli', 'docs'] }), CUERPO_NEUTRO, H);
  assert.equal(dos.puntos, H.peso_etiqueta_adicional);
  assert.equal(dos.senales.filter((s) => s.clave === SENAL_ETIQUETAS).length, 1);

  const cuatro = puntuarTarea(
    tarea({ etiquetas: ['cli', 'docs', 'git', 'tests'] }),
    CUERPO_NEUTRO,
    H
  );
  assert.equal(cuatro.puntos, 3 * H.peso_etiqueta_adicional);
});

test('peso_dependencia: se paga por cada dependencia declarada', () => {
  const una = puntuarTarea(tarea({ dependencias: ['TASK-010'] }), CUERPO_NEUTRO, H);
  assert.equal(una.puntos, H.peso_dependencia);
  assert.equal(una.senales.filter((s) => s.clave === SENAL_DEPENDENCIA).length, 1);

  const tres = puntuarTarea(
    tarea({ dependencias: ['TASK-010', 'TASK-011', 'TASK-012'] }),
    CUERPO_NEUTRO,
    H
  );
  assert.equal(tres.puntos, 3 * H.peso_dependencia);
});

test('peso_tipo_release: solo lo paga una release', () => {
  const release = puntuarTarea(tarea({ tipo: 'release' }), CUERPO_NEUTRO, H);
  assert.equal(release.puntos, H.peso_tipo_release);
  assert.equal(release.senales.filter((s) => s.clave === SENAL_RELEASE).length, 1);

  for (const tipo of TASK_TYPES) {
    if (tipo === 'release') continue;
    const otra = puntuarTarea(tarea({ tipo }), CUERPO_NEUTRO, H);
    assert.equal(otra.senales.filter((s) => s.clave === SENAL_RELEASE).length, 0);
  }
});

test('peso_tipo_hotfix_con_palabra_riesgo: un hotfix NO puntua por serlo', () => {
  // Urgencia no es complejidad, y tratarla como tal es el error que
  // esta senal existe para evitar. Lo que puntua es un hotfix que
  // ADEMAS toca terreno delicado.
  const sinRiesgo = puntuarTarea(tarea({ tipo: 'hotfix' }), CUERPO_NEUTRO, H);
  assert.equal(sinRiesgo.puntos, 0);

  assert.ok(H.palabras_alto_riesgo.includes('cifrado'));
  const conRiesgo = puntuarTarea(
    tarea({ tipo: 'hotfix' }),
    cuerpo('Arreglar el cifrado de la sesion.'),
    H
  );
  assert.equal(
    conRiesgo.puntos,
    H.peso_tipo_hotfix_con_palabra_riesgo + H.peso_palabra_alto_riesgo
  );
  assert.equal(conRiesgo.senales.filter((s) => s.clave === SENAL_HOTFIX_RIESGO).length, 1);

  // Y no la paga ningun otro tipo, por mucha palabra de riesgo que haya.
  const feature = puntuarTarea(tarea(), cuerpo('Arreglar el cifrado de la sesion.'), H);
  assert.equal(feature.senales.filter((s) => s.clave === SENAL_HOTFIX_RIESGO).length, 0);
  assert.equal(feature.puntos, H.peso_palabra_alto_riesgo);
});

test('peso_criterios_aceptacion: se paga UNA vez al llegar al umbral, no por criterio', () => {
  const umbral = H.umbral_criterios_aceptacion;
  assert.ok(umbral >= 2, 'con un umbral de 0 o 1 el caso "justo por debajo" no existiria');

  const debajo = puntuarTarea(tarea(), cuerpo('Nada.', criteriosNeutros(umbral - 1)), H);
  assert.equal(debajo.puntos, 0);

  const justo = puntuarTarea(tarea(), cuerpo('Nada.', criteriosNeutros(umbral)), H);
  assert.equal(justo.puntos, H.peso_criterios_aceptacion);
  assert.equal(justo.senales.filter((s) => s.clave === SENAL_CRITERIOS).length, 1);

  // Partir el mismo trabajo en mas casillas no lo hace mas complejo.
  const muchos = puntuarTarea(tarea(), cuerpo('Nada.', criteriosNeutros(umbral + 7)), H);
  assert.equal(muchos.puntos, H.peso_criterios_aceptacion);
});

// --------------------------------------------------------------------
// 6. El conteo de palabras de alto riesgo
//
// Mutacion que pone rojo este grupo: contar apariciones en vez de
// entradas distintas, recorrer objetivo y criterios por separado
// sumando dos veces, o quitar la normalizacion de acentos/mayusculas.
// --------------------------------------------------------------------

test('la misma palabra repetida N veces suma una sola vez', () => {
  assert.ok(H.palabras_alto_riesgo.includes('rendimiento'));
  const { puntos, senales } = puntuarTarea(
    tarea(),
    cuerpo('El rendimiento, otra vez el rendimiento y de nuevo el rendimiento.'),
    H
  );
  assert.equal(puntos, H.peso_palabra_alto_riesgo);
  assert.deepEqual(
    senales.filter((s) => s.clave === SENAL_PALABRA).map((s) => s.detalle),
    ['rendimiento']
  );
});

test('dos entradas distintas suman dos', () => {
  assert.ok(H.palabras_alto_riesgo.includes('rendimiento'));
  assert.ok(H.palabras_alto_riesgo.includes('rollback'));
  const { puntos, senales } = puntuarTarea(
    tarea(),
    cuerpo('Medir el rendimiento y preparar el rollback.'),
    H
  );
  assert.equal(puntos, 2 * H.peso_palabra_alto_riesgo);
  assert.equal(senales.filter((s) => s.clave === SENAL_PALABRA).length, 2);
});

test('una entrada que sale en el objetivo Y en los criterios sigue sumando una vez', () => {
  const { puntos } = puntuarTarea(
    tarea(),
    cuerpo('Revisar el rollback.', ['Documentar el rollback.', 'Probar el rollback.']),
    H
  );
  assert.equal(puntos, H.peso_palabra_alto_riesgo);
});

/**
 * El test de arriba, SOLO, no distingue "el dedup entre secciones
 * funciona" de "los criterios se ignoran del todo": pone la palabra en
 * las dos secciones, asi que da lo mismo. Un revisor independiente
 * mutó `palabrasDeRiesgoEncontradas(objetivo, criterios, h)` a
 * `(objetivo, [], h)` y LA SUITE ENTERA SIGUIO EN VERDE — la mitad
 * "criterios de aceptacion" de la señal mas cara del YML no estaba
 * cubierta por nada. Es exactamente el patron de asercion vacia que
 * TASK-032 enseñó a buscar.
 *
 * Mutacion que pone rojo este test: la misma, ignorar los criterios al
 * buscar palabras de riesgo.
 */
test('una palabra de riesgo SOLO en los criterios puntua igual (el YML dice "o en los criterios")', () => {
  const { puntos, senales } = puntuarTarea(
    tarea(),
    cuerpo('Renombrar una variable local.', ['El rollback deja el repo como estaba.']),
    H
  );
  assert.equal(puntos, H.peso_palabra_alto_riesgo);
  assert.deepEqual(
    senales.filter((s) => s.clave === SENAL_PALABRA).map((s) => s.detalle),
    ['rollback']
  );
});

test('la comparacion es insensible a acentos: "migracion" casa con "migración"', () => {
  assert.ok(H.palabras_alto_riesgo.includes('migracion'));
  const { puntos, senales } = puntuarTarea(tarea(), cuerpo('Planificar la migración.'), H);
  assert.equal(puntos, H.peso_palabra_alto_riesgo);
  assert.deepEqual(
    senales.filter((s) => s.clave === SENAL_PALABRA).map((s) => s.detalle),
    ['migracion']
  );
});

test('la comparacion es insensible a mayusculas', () => {
  assert.ok(H.palabras_alto_riesgo.includes('seguridad'));
  const { puntos } = puntuarTarea(tarea(), cuerpo('Auditoria de SEGURIDAD.'), H);
  assert.equal(puntos, H.peso_palabra_alto_riesgo);
});

test('la comparacion es por subcadena: una entrada corta cubre sus variantes', () => {
  // El fichero no lista los plurales a proposito: "migracion" cubre
  // "migraciones". Si la comparacion fuera por palabra completa, media
  // lista dejaria de casar con la redaccion natural de las tareas.
  const { puntos, senales } = puntuarTarea(tarea(), cuerpo('Aplicar las migraciones.'), H);
  assert.equal(puntos, H.peso_palabra_alto_riesgo);
  assert.equal(senales.filter((s) => s.clave === SENAL_PALABRA).length, 1);
});

// --------------------------------------------------------------------
// 7. resolverNumeroAgentes: discrepancia en las dos direcciones
//
// Mutacion que pone rojo este grupo: quedarse solo con el nivel
// declarado, solo con el heuristico, o usar min en vez de max.
// --------------------------------------------------------------------

/** Objetivo con tres entradas distintas de la lista: 3 x peso puntos. */
const OBJETIVO_TRES_RIESGOS = 'Ajustar el rendimiento del cifrado y preparar el rollback.';

test('declarado POR DEBAJO de la heuristica: manda el numero mas alto', () => {
  const r = resolverNumeroAgentes(
    tarea({ complejidad: 'trivial' }),
    cuerpo(OBJETIVO_TRES_RIESGOS),
    H
  );
  assert.equal(r.puntos, 3 * H.peso_palabra_alto_riesgo);
  assert.equal(r.senales.filter((s) => s.clave === SENAL_PALABRA).length, 3);
  assert.equal(r.nivelDeclarado, 'trivial');
  assert.equal(r.nivelHeuristico, 'alta');
  assert.equal(r.hayDiscrepancia, true);
  assert.ok(H.agentes_brainstorm_alta > H.agentes_brainstorm_trivial);
  assert.equal(r.agentes, H.agentes_brainstorm_alta);
  assert.equal(r.topeHotfixAplicado, false);
});

test('declarado POR ENCIMA de la heuristica: lo declarado no se ignora', () => {
  const r = resolverNumeroAgentes(tarea({ complejidad: 'critica' }), CUERPO_NEUTRO, H);
  assert.equal(r.puntos, 0);
  assert.equal(r.nivelDeclarado, 'critica');
  assert.equal(r.nivelHeuristico, 'trivial');
  assert.equal(r.hayDiscrepancia, true);
  assert.ok(H.agentes_brainstorm_critica > H.agentes_brainstorm_trivial);
  assert.equal(r.agentes, H.agentes_brainstorm_critica);
});

test('sin discrepancia, hayDiscrepancia es false y el numero es el del nivel', () => {
  const r = resolverNumeroAgentes(tarea({ complejidad: 'trivial' }), CUERPO_NEUTRO, H);
  assert.equal(r.nivelDeclarado, r.nivelHeuristico);
  assert.equal(r.hayDiscrepancia, false);
  assert.equal(r.agentes, H.agentes_brainstorm_trivial);
});

// --------------------------------------------------------------------
// 8. El tope de hotfix dentro de la composicion
//
// El tope va aplicado DENTRO de cada llamada, es decir antes del max.
// Lo que estos tests fijan es el RESULTADO: un hotfix nunca sale del
// tope, discrepen o no los dos niveles.
//
// Mutacion que pone rojo: quitar el min de agentesBrainstorm (el
// primer caso pasa de 1 a 4), o convertirlo en sustitucion (el segundo
// pasa de 0 a 1).
// --------------------------------------------------------------------

test('un hotfix con niveles discrepantes sigue topado tras el max', () => {
  const r = resolverNumeroAgentes(
    tarea({ tipo: 'hotfix', complejidad: 'critica' }),
    CUERPO_NEUTRO,
    H
  );
  assert.equal(r.nivelDeclarado, 'critica');
  assert.equal(r.nivelHeuristico, 'trivial');
  assert.equal(r.agentes, H.agentes_brainstorm_hotfix);
  assert.ok(r.agentes < H.agentes_brainstorm_critica);
  assert.equal(r.topeHotfixAplicado, true);
});

test('un hotfix trivial por los dos lados se queda en 0 agentes', () => {
  const r = resolverNumeroAgentes(
    tarea({ tipo: 'hotfix', complejidad: 'trivial' }),
    CUERPO_NEUTRO,
    H
  );
  assert.equal(r.agentes, 0);
  assert.notEqual(r.agentes, H.agentes_brainstorm_hotfix);
  // El tope no recorto nada: la tabla ya pedia 0.
  assert.equal(r.topeHotfixAplicado, false);
});

test('en una tarea que no es hotfix, topeHotfixAplicado es false', () => {
  const r = resolverNumeroAgentes(tarea({ complejidad: 'critica' }), CUERPO_NEUTRO, H);
  assert.equal(r.agentes, H.agentes_brainstorm_critica);
  assert.equal(r.topeHotfixAplicado, false);
});

// --------------------------------------------------------------------
// 9. parsearHeuristica: fallo cerrado
//
// Cada caso parte del fichero REAL mutado en una sola linea, asi que
// la base siempre es un fichero que parsea. Mutacion que pone rojo
// este grupo: tragarse cualquiera de estos casos y caer al default.
// --------------------------------------------------------------------

test('una clave desconocida aborta y enumera las validas', () => {
  assert.throws(
    () => parsearHeuristica(conLineaExtra('peso_inventado: 3'), RUTA_YML),
    errorAccionable(/clave desconocida "peso_inventado"/)
  );
  assert.throws(
    () => parsearHeuristica(conLineaExtra('peso_inventado: 3'), RUTA_YML),
    errorAccionable(/Claves validas: peso_etiqueta_adicional, /)
  );
});

test('una clave desconocida que es una errata propone la clave correcta', () => {
  assert.throws(
    () => parsearHeuristica(conLineaExtra('peso_dependencias: 3'), RUTA_YML),
    errorAccionable(/Quiza quisiste decir "peso_dependencia"/)
  );
});

test('una clave obligatoria ausente aborta nombrandola', () => {
  const sinPeso = sinLineaDe('peso_dependencia');
  assert.ok(!sinPeso.includes('\npeso_dependencia:'), 'la mutacion no quito la linea');
  assert.throws(
    () => parsearHeuristica(sinPeso, RUTA_YML),
    errorAccionable(/falta la clave obligatoria "peso_dependencia"/)
  );
  assert.throws(
    () => parsearHeuristica(sinLineaDe('palabras_alto_riesgo'), RUTA_YML),
    errorAccionable(/falta la clave obligatoria "palabras_alto_riesgo"/)
  );
  // TASK-052: la clave ausente suele ser un YML de otra version del plugin.
  assert.throws(
    () => parsearHeuristica(sinLineaDe('peso_dependencia'), RUTA_YML),
    errorAccionable(/reinstala el plugin/)
  );
});

// TASK-052: las tres claves de la consulta a un modelo no las leia nadie y
// salieron del fichero y del codigo en el mismo commit. Un YML de una version
// anterior que aun las traiga aborta diciendo que se reinstale el plugin.
// Revierte la decision de TASK-032 de validarlas sin consumidor.
test('las claves retiradas (tolerancia_*, modelo_consulta_discrepancia) abortan pidiendo reinstalar', () => {
  for (const linea of [
    'tolerancia_niveles: 1',
    'tolerancia_extra_si_heuristica_menor: 0',
    'modelo_consulta_discrepancia: haiku',
  ]) {
    const clave = linea.slice(0, linea.indexOf(':'));
    assert.throws(
      () => parsearHeuristica(conLineaExtra(linea), RUTA_YML),
      errorAccionable(new RegExp(`clave desconocida "${clave}"[\\s\\S]*reinstala el plugin`))
    );
  }
  for (const clave of ['tolerancia_niveles', 'tolerancia_extra_si_heuristica_menor', 'modelo_consulta_discrepancia']) {
    assert.equal(CLAVES_HEURISTICA.includes(clave), false, `"${clave}" sigue entre las claves validas`);
    assert.equal(clave in H, false, `"${clave}" sigue en el objeto Heuristica`);
  }
  assert.equal(CLAVES_HEURISTICA.length, 19);
});

test('un valor no numerico donde se espera un numero aborta', () => {
  assert.throws(
    () => parsearHeuristica(conValor('peso_dependencia', 'haiku'), RUTA_YML),
    errorAccionable(/"peso_dependencia" debe ser un numero entero.*el texto "haiku"/s)
  );
  // Un decimal tambien: el parser lo devuelve como texto, y si se
  // colara, `puntos` dejaria de ser entero sin que nadie se entere.
  assert.throws(
    () => parsearHeuristica(conValor('peso_dependencia', '1.5'), RUTA_YML),
    errorAccionable(/"peso_dependencia" debe ser un numero entero/)
  );
});

test('un numero negativo aborta: restaria complejidad por tener una senal mas', () => {
  assert.throws(
    () => parsearHeuristica(conValor('peso_dependencia', '-1'), RUTA_YML),
    errorAccionable(/"peso_dependencia" debe ser un numero entero mayor o igual que 0/)
  );
});

test('una clave repetida aborta en vez de dejar que gane la ultima', () => {
  assert.throws(
    () => parsearHeuristica(conLineaExtra('peso_dependencia: 5'), RUTA_YML),
    errorAccionable(/la clave "peso_dependencia" esta repetida/)
  );
});

test('la lista de palabras escrita sin corchetes aborta', () => {
  // Sin corchetes el parser devuelve UN texto, y la comparacion por
  // subcadena buscaria la frase entera como si fuera una sola entrada:
  // no casaria nunca y la senal mas cara del fichero moriria en
  // silencio.
  assert.throws(
    () => parsearHeuristica(conValor('palabras_alto_riesgo', 'migracion, seguridad'), RUTA_YML),
    errorAccionable(/"palabras_alto_riesgo" debe ser una lista de textos/)
  );
});

test('una entrada repetida en la lista de palabras aborta', () => {
  // La regla "una vez por entrada DISTINTA" se cumple porque se
  // recorre la lista, no el texto. Con la misma entrada dos veces esa
  // garantia se cae: casaria en las dos vueltas y esa palabra
  // puntuaria el doble que las demas.
  assert.throws(
    () =>
      parsearHeuristica(
        conValor('palabras_alto_riesgo', '["migracion", "seguridad", "migracion"]'),
        RUTA_YML
      ),
    errorAccionable(/"palabras_alto_riesgo" tiene la entrada "migracion" repetida/)
  );
});

test('una entrada vacia en la lista de palabras aborta', () => {
  // Casaria como subcadena con CUALQUIER tarea y dispararia la senal
  // mas cara del fichero siempre.
  assert.throws(
    () => parsearHeuristica(conValor('palabras_alto_riesgo', '["migracion", ""]'), RUTA_YML),
    errorAccionable(/"palabras_alto_riesgo" tiene alguna entrada vacia/)
  );
});

test('una escala de niveles que no crece aborta', () => {
  assert.throws(
    () => parsearHeuristica(conValor('nivel_media_hasta', '1'), RUTA_YML),
    errorAccionable(/"nivel_media_hasta" \(1\) tiene que ser mayor que "nivel_simple_hasta"/)
  );
});

test('una escala con un hueco entre alta y critica aborta', () => {
  // Con alta_hasta: 7 y critica_desde: 10, un 8 no seria ni alta ni
  // critica segun el fichero, pero nivelHeuristico devolveria critica
  // calladamente. Es lo que permite que la cascada no vuelva a leer
  // nivel_critica_desde: la redundancia se exige, no se supone.
  assert.throws(
    () => parsearHeuristica(conValor('nivel_critica_desde', '10'), RUTA_YML),
    errorAccionable(/"nivel_critica_desde" \(10\) tiene que ser exactamente/)
  );
});

test('cargarHeuristica con una ruta que no existe aborta diciendo que hacer', () => {
  const inexistente = path.join(RAIZ_PAQUETE, 'scripts', 'no-existe-heuristica.yml');
  assert.throws(
    () => cargarHeuristica(inexistente),
    errorAccionable(/No se pudo leer la heuristica de complejidad/)
  );
});

// --------------------------------------------------------------------
// TASK-042 (decision C4): sin complejidad declarada decide la heuristica
// --------------------------------------------------------------------

test('no declarada (null): el numero de agentes es el de la heuristica, aunque sea menor que el de "media"', () => {
  const r = resolverNumeroAgentes(tarea({ complejidad: null }), CUERPO_NEUTRO, H);
  assert.equal(r.nivelDeclarado, null);
  assert.equal(r.nivelHeuristico, 'trivial');
  assert.equal(r.hayDiscrepancia, false, 'sin declarar no hay con que discrepar');
  assert.equal(r.agentes, H.agentes_brainstorm_trivial);
  assert.ok(H.agentes_brainstorm_media > H.agentes_brainstorm_trivial, 'la prueba necesita que media pida mas');
  assert.equal(resolverNumeroAgentes(tarea(), CUERPO_NEUTRO, H).agentes, H.agentes_brainstorm_media);
});
