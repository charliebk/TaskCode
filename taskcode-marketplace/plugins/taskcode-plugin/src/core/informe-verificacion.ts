/**
 * Como se cuenta una verificacion en rojo — TASK-071. Funcion pura,
 * compartida por el hook Stop y (TASK-072) por `finish`: los dos frenos
 * tienen que decir lo mismo con las mismas palabras.
 *
 * Lo que trae siempre (criterio 3 de TASK-071): el comando, el codigo de
 * salida (o el corte), la duracion y la cola de la salida, ACOTADA. La cola
 * acaba en el transcript del agente, asi que ademas se limpia: sin secuencias
 * ANSI (colores de los test runners), sin CRLF, sin credenciales en URLs, y
 * cortada sin partir caracteres UTF-8.
 */
import { fenceFor } from './markdown.js';
import { ocultarCredenciales } from './plataforma-remota.js';

export type EstadoVerificacion = 'verde' | 'roja' | 'cortada' | 'no-lanzable';

export interface ResultadoVerificacion {
  estado: EstadoVerificacion;
  comando: string;
  /** Codigo de salida del comando; null si se corto o no se pudo lanzar. */
  codigo: number | null;
  duracionMs: number;
  /** Segundos que se le dieron al comando. */
  timeoutS: number;
  /** Cola de la salida (stdout y stderr intercalados), sin limpiar ni acotar todavia. */
  cola: string;
  /** Bytes totales de la salida, aunque solo se haya leido la cola. */
  bytesTotales: number;
  /** Motivo, si no se pudo lanzar. */
  error?: string;
}

/** Bytes y lineas maximos de la cola que se muestran. */
export const MAX_BYTES_COLA = 4096;
export const MAX_LINEAS_COLA = 40;

// Secuencias CSI (colores, cursor) y OSC (titulos, hipervinculos) de terminal.
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g;

/**
 * La cola limpia y acotada a `maxLineas` lineas y `maxBytes` bytes (lo que
 * se cumpla antes), quedandose con el FINAL: en un test runner el resumen y
 * el ultimo fallo estan abajo.
 */
export function recortarCola(
  texto: string,
  maxBytes: number = MAX_BYTES_COLA,
  maxLineas: number = MAX_LINEAS_COLA
): { texto: string; recortada: boolean } {
  const limpio = ocultarCredenciales(texto.replace(ANSI, '').replace(/\r\n?/g, '\n')).replace(/\s+$/, '');
  let lineas = limpio.split('\n');
  let recortada = false;
  if (lineas.length > maxLineas) {
    lineas = lineas.slice(-maxLineas);
    recortada = true;
  }
  let salida = lineas.join('\n');
  const buf = Buffer.from(salida, 'utf8');
  if (buf.length > maxBytes) {
    let desde = buf.length - maxBytes;
    while (desde < buf.length && ((buf[desde] as number) & 0xc0) === 0x80) desde++;
    salida = buf.subarray(desde).toString('utf8');
    recortada = true;
  }
  return { texto: salida, recortada };
}

/** El resultado en una frase: «salio con codigo 1», «se corto a los 600 s»... */
export function describirResultado(r: ResultadoVerificacion): string {
  switch (r.estado) {
    case 'verde':
      return 'salio con codigo 0';
    case 'roja':
      return r.codigo === null
        ? `termino de forma anormal${r.error === undefined ? '' : ` (${r.error})`}`
        : `salio con codigo ${String(r.codigo)}`;
    case 'cortada':
      return `no termino en ${String(r.timeoutS)} s y se ha cortado (con todos sus procesos)`;
    case 'no-lanzable':
      return `no se pudo ejecutar${r.error === undefined ? '' : ` (${r.error})`}`;
  }
}

function segundos(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

/**
 * El informe de una verificacion que no esta en verde, listo para stderr.
 * No nombra el producto: lo leen proyectos ajenos.
 */
export function formatearVerificacionRoja(
  r: ResultadoVerificacion,
  maxBytes: number = MAX_BYTES_COLA,
  maxLineas: number = MAX_LINEAS_COLA
): string {
  const { texto, recortada } = recortarCola(r.cola, maxBytes, maxLineas);
  const truncada = recortada || r.bytesTotales > Buffer.byteLength(r.cola, 'utf8');
  const lineas = [
    'La verificacion del proyecto no esta en verde: la tarea en curso no se puede dar por terminada.',
    `  Comando:   ${r.comando}`,
    `  Resultado: ${describirResultado(r)}`,
    `  Duracion:  ${segundos(r.duracionMs)}`,
  ];
  if (texto === '') {
    lineas.push('  Salida:    (vacia)');
  } else {
    const titulo = truncada
      ? `  Final de la salida (truncada: ${String(r.bytesTotales)} bytes en total):`
      : '  Salida:';
    lineas.push(titulo, ...texto.split('\n').map((l) => `    ${l}`));
  }
  lineas.push(
    'Arregla la causa y vuelve a verificar con el mismo comando. No borres, saltes ni debilites ' +
      'tests para pasar este freno: si el rojo no es de tu cambio, dilo explicitamente.'
  );
  return lineas.join('\n');
}

/**
 * Lo que se corrio en la ronda. TASK-104: con solo documentacion en
 * base...HEAD, la comprobacion de documentacion (o nada, si no se declaro)
 * en lugar de la selectiva. La peticion lo dice para que el revisor no lea un
 * verde de documentacion como si hubieran pasado los tests.
 */
export type VerificacionDeRonda =
  | {
      tipo: 'selectiva';
      resultado: ResultadoVerificacion;
      /** Rama base que recibio en RAMA_BASE. */
      base: string;
      /** true si es el resultado guardado de una ejecucion anterior con la misma huella. */
      deMemo: boolean;
      /** true si el proyecto declara un informe de cobertura (que esta ronda no muestra). */
      conCobertura: boolean;
    }
  | {
      tipo: 'documentacion';
      resultado: ResultadoVerificacion;
      /** Por que cuenta como solo documentacion (el motivo de la decision). */
      motivo: string;
      deMemo: boolean;
      conCobertura: boolean;
    }
  | { tipo: 'documentacion-sin-comando'; motivo: string; conCobertura: boolean };

const NO_SUSTITUYE = 'No sustituye a la completa: el cierre la exige sobre el commit que se integra.';

/**
 * TASK-091: la seccion de la peticion de revision que dice que verificacion
 * se corrio en la ronda, con su resultado y su salida. Va al final, despues
 * de la cabecera con el commit revisado, y la salida en una valla que no
 * colisiona con ella. Sin `comando_verificacion_selectiva` review no verifica
 * y no hay seccion.
 */
export function seccionVerificacionRevision(v: VerificacionDeRonda): string {
  const coberturaOculta =
    '- Cobertura: no se muestra en esta ronda. ' +
    (v.tipo === 'selectiva'
      ? 'La selectiva solo corre parte de los tests y el informe puede ser parcial; la completa la mide en el cierre.'
      : 'Solo cambia documentacion y no se ha corrido ningun test: el informe seria de otra ejecucion. ' +
        'La completa la mide en el cierre.');
  if (v.tipo === 'documentacion-sin-comando') {
    const lineas = [
      '## Verificacion de esta ronda',
      '',
      `- Tipo: ninguna: ${v.motivo} y el proyecto no declara comando_verificacion_documentacion, ` +
        'asi que no se ha corrido ningun test ni ninguna comprobacion. ' +
        NO_SUSTITUYE,
    ];
    if (v.conCobertura) lineas.push(coberturaOculta);
    lineas.push('');
    return `\n${lineas.join('\n')}`;
  }
  const r = v.resultado;
  const { texto, recortada } = recortarCola(r.cola);
  const truncada = recortada || r.bytesTotales > Buffer.byteLength(r.cola, 'utf8');
  const lineas = [
    '## Verificacion de esta ronda',
    '',
    v.tipo === 'selectiva'
      ? `- Tipo: selectiva (por impacto respecto a \`${v.base}\`, que recibe en la variable RAMA_BASE). ` +
        NO_SUSTITUYE
      : `- Tipo: comprobacion de documentacion (comando_verificacion_documentacion): ${v.motivo}, ` +
        'asi que no se ha corrido ningun test. ' +
        NO_SUSTITUYE,
    `- Comando: \`${r.comando}\``,
    `- Resultado: ${describirResultado(r)}${v.deMemo ? ' (resultado guardado: el arbol no ha cambiado desde la ultima ejecucion)' : ''}`,
    `- Duracion: ${segundos(r.duracionMs)}`,
  ];
  if (v.conCobertura) lineas.push(coberturaOculta);
  lineas.push('');
  if (texto === '') {
    lineas.push('Salida: (vacia)', '');
  } else {
    const fence = fenceFor(texto);
    lineas.push(
      truncada ? `Final de la salida (truncada: ${String(r.bytesTotales)} bytes en total):` : 'Salida:',
      '',
      fence,
      texto,
      fence,
      ''
    );
  }
  return `\n${lineas.join('\n')}`;
}
