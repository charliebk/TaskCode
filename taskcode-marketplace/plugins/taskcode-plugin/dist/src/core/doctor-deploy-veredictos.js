/**
 * Veredictos de un agente revisor para los puntos de juicio de
 * `taskctl doctor-deploy --resultado <fichero.json>` (TASK-067). Modulo puro:
 * no toca disco ni lanza procesos; quien lo llama le da la forma de comprobar
 * una evidencia (`ComprobadorEvidencia`) y el commit actual.
 *
 * El agente es un revisor con juicio, no una sonda: su veredicto solo cuenta si
 * se puede comprobar. Por eso la mezcla es estricta, y cada camino que acaba en
 * OK es un camino por el que un veredicto inventado, viejo o inyectado pasaria
 * por bueno:
 * - Cada veredicto lleva el commit sobre el que se juzgo y se rechaza si no es
 *   el HEAD sobre el que se acaba de repetir el analisis.
 * - Solo se aceptan para puntos de juicio que aplican: nunca pisa a una sonda
 *   determinista ni da veredicto a un punto NO APLICA o desactivado.
 * - OK y FALLA exigen evidencia: un fichero versionado y una linea que existe.
 *   Sin rutas absolutas ni `..`. Sin fragmentos de codigo: el formato no tiene
 *   donde ponerlos y un campo desconocido se rechaza.
 * - El motivo se acota y pasa por `ocultarSecretos`: lo que se guarda en
 *   docs/doctor-deploy/ no se puede des-subir.
 * - Dos veredictos para el mismo punto se rechazan los dos (el segundo podria
 *   contradecir al primero).
 * Un veredicto rechazado deja el punto como estaba (NO VERIFICADO) y su motivo
 * sale en el informe.
 */
import { ocultarCredenciales } from './plataforma-remota.js';
import { ocultarSecretos } from './secretos.js';
export class VeredictoFormatoError extends Error {
    constructor(message) {
        super(message);
        this.name = 'VeredictoFormatoError';
    }
}
/** Longitud maxima del motivo que se guarda. */
export const MAX_MOTIVO = 300;
/** Veredictos como mucho por fichero (hay unos 20 puntos de juicio). */
export const MAX_VEREDICTOS = 200;
export const ESTADOS_VEREDICTO = ['ok', 'falla', 'no-verificado'];
const CAMPOS_VEREDICTO = ['punto', 'estado', 'commit', 'fichero', 'linea', 'motivo'];
/**
 * Lee el JSON del agente: `{ "commit": "<sha>", "veredictos": [ {...} ] }`. El `commit` de la
 * raiz vale para los veredictos que no traen el suyo. Lanza `VeredictoFormatoError` si no es JSON
 * o no tiene esa forma: sin eso no hay nada que aceptar ni rechazar punto por punto.
 */
export function parsearResultado(texto) {
    let datos;
    try {
        datos = JSON.parse(texto);
    }
    catch (e) {
        throw new VeredictoFormatoError(`el fichero de resultado no es JSON valido (${e instanceof Error ? e.message : String(e)})`);
    }
    if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
        throw new VeredictoFormatoError('el fichero de resultado debe ser un objeto {"commit": "...", "veredictos": [...]}');
    }
    const o = datos;
    if (!Array.isArray(o['veredictos'])) {
        throw new VeredictoFormatoError('al fichero de resultado le falta la lista "veredictos"');
    }
    if (o['veredictos'].length > MAX_VEREDICTOS) {
        throw new VeredictoFormatoError(`demasiados veredictos (${o['veredictos'].length}; el maximo es ${MAX_VEREDICTOS})`);
    }
    const commit = o['commit'];
    if (commit !== undefined && typeof commit !== 'string') {
        throw new VeredictoFormatoError('"commit" de la raiz debe ser un texto');
    }
    return { commit: commit ?? null, veredictos: o['veredictos'] };
}
/**
 * Comprueba la RUTA de una evidencia, sin tocar disco: null si es admisible, o el motivo del
 * rechazo. Relativa al repo, con `/` o `\`, sin `..`, sin unidad ni raiz, sin caracteres de control.
 */
export function motivoRutaInvalida(ruta) {
    if (ruta.trim() === '')
        return 'el fichero esta vacio';
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(ruta))
        return 'el fichero lleva caracteres de control';
    if (ruta.startsWith('/') || ruta.startsWith('\\') || /^[A-Za-z]:/.test(ruta)) {
        return 'el fichero es una ruta absoluta: debe ser relativa a la raiz del repositorio';
    }
    if (ruta.split(/[\\/]/).some((parte) => parte === '..'))
        return 'el fichero sale de la raiz del repositorio (".." no se admite)';
    return null;
}
function limpiarMotivo(texto) {
    const plano = ocultarCredenciales(ocultarSecretos(texto)).replace(/\s+/g, ' ').trim();
    return plano.length > MAX_MOTIVO ? `${plano.slice(0, MAX_MOTIVO - 3)}...` : plano;
}
/** Sin datos del agente en un mensaje de rechazo: solo el id, recortado y limpio. */
function nombrePunto(v) {
    const p = typeof v === 'object' && v !== null ? v['punto'] : undefined;
    if (typeof p !== 'string' || p.trim() === '')
        return '(sin punto)';
    return limpiarMotivo(p).slice(0, 80);
}
function validarForma(bruto, comun) {
    if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto))
        return { error: 'el veredicto no es un objeto' };
    const o = bruto;
    const extra = Object.keys(o).filter((k) => !CAMPOS_VEREDICTO.includes(k));
    if (extra.length > 0) {
        return {
            error: `campo(s) no admitido(s): ${extra.map((k) => limpiarMotivo(k).slice(0, 40)).join(', ')} ` +
                `(solo ${CAMPOS_VEREDICTO.join(', ')}; la evidencia es fichero y linea, nunca un fragmento de codigo)`,
        };
    }
    if (typeof o['punto'] !== 'string' || o['punto'].trim() === '')
        return { error: 'falta "punto" (el id del punto)' };
    const estado = o['estado'];
    if (typeof estado !== 'string' || !ESTADOS_VEREDICTO.includes(estado)) {
        return { error: `"estado" debe ser ${ESTADOS_VEREDICTO.join(', ')}` };
    }
    const commit = o['commit'] === undefined ? comun : o['commit'];
    if (typeof commit !== 'string' || !/^[0-9a-f]{7,64}$/i.test(commit)) {
        return { error: 'falta el commit sobre el que se juzgo ("commit": sha completo, en el veredicto o en la raiz)' };
    }
    const fichero = o['fichero'];
    if (fichero !== undefined && typeof fichero !== 'string')
        return { error: '"fichero" debe ser un texto' };
    const linea = o['linea'];
    if (linea !== undefined && (typeof linea !== 'number' || !Number.isInteger(linea) || linea < 1)) {
        return { error: '"linea" debe ser un entero a partir de 1' };
    }
    if (typeof o['motivo'] !== 'string' || o['motivo'].trim() === '')
        return { error: 'falta "motivo" (una frase que diga por que)' };
    return {
        v: {
            punto: o['punto'].trim(),
            estado: estado,
            commit,
            fichero: fichero ?? null,
            linea: linea ?? null,
            motivo: limpiarMotivo(o['motivo']),
        },
    };
}
function puntoMezclado(p, v) {
    const donde = v.fichero !== null && v.linea !== null ? { fichero: v.fichero, linea: v.linea } : {};
    if (v.estado === 'no-verificado') {
        return { ...p, origen: 'agente', estado: 'no-verificado', motivo: `el agente no pudo concluir: ${v.motivo}`, evidencias: [] };
    }
    return {
        ...p,
        origen: 'agente',
        estado: v.estado,
        motivo: v.motivo,
        evidencias: [{ descripcion: `veredicto del agente sobre el commit ${v.commit.slice(0, 12)}: ${v.motivo}`, ...donde }],
    };
}
/**
 * Mezcla los veredictos con los puntos del analisis. `head` es el commit sobre el que se acaba de
 * analizar (null si el repo no tiene commits: todo se rechaza). Devuelve puntos nuevos y el resumen;
 * no muta nada.
 */
export function mezclarVeredictos(puntos, entrada, head, comprobar) {
    const rechazados = [];
    const rechazar = (punto, motivo) => {
        rechazados.push({ punto, motivo: limpiarMotivo(motivo) });
    };
    // Un punto con mas de un veredicto: se rechazan todos (podrian contradecirse).
    const veces = new Map();
    for (const bruto of entrada.veredictos) {
        const n = nombrePunto(bruto);
        veces.set(n, (veces.get(n) ?? 0) + 1);
    }
    const aceptados = new Map();
    for (const bruto of entrada.veredictos) {
        const nombre = nombrePunto(bruto);
        if (nombre !== '(sin punto)' && (veces.get(nombre) ?? 0) > 1) {
            rechazar(nombre, 'hay mas de un veredicto para este punto: se rechazan todos porque podrian contradecirse');
            continue;
        }
        const forma = validarForma(bruto, entrada.commit);
        if ('error' in forma) {
            rechazar(nombre, forma.error);
            continue;
        }
        const v = forma.v;
        const punto = puntos.find((p) => p.id === v.punto);
        if (punto === undefined) {
            rechazar(nombre, 'punto desconocido: no esta en el catalogo de este proyecto');
            continue;
        }
        if (head === null) {
            rechazar(nombre, 'el repositorio no tiene commits: no hay nada sobre lo que juzgar');
            continue;
        }
        if (v.commit.length < 7 || !head.toLowerCase().startsWith(v.commit.toLowerCase())) {
            rechazar(nombre, `el veredicto se juzgo sobre el commit ${v.commit.slice(0, 12)} y el codigo actual es ${head.slice(0, 12)}: repite la revision`);
            continue;
        }
        if (punto.estado === 'no-aplica') {
            rechazar(nombre, `el punto no aplica a este proyecto (${punto.motivo})`);
            continue;
        }
        if (punto.metodo !== 'juicio') {
            rechazar(nombre, 'es un punto determinista: lo decide la comprobacion del comando, no un agente');
            continue;
        }
        if (v.estado !== 'no-verificado') {
            if (v.fichero === null || v.linea === null) {
                rechazar(nombre, `un veredicto ${v.estado.toUpperCase()} exige evidencia: "fichero" y "linea" (o deja el punto en no-verificado)`);
                continue;
            }
            const rutaMala = motivoRutaInvalida(v.fichero);
            if (rutaMala !== null) {
                rechazar(nombre, rutaMala);
                continue;
            }
            const evidenciaMala = comprobar(v.fichero, v.linea);
            if (evidenciaMala !== null) {
                rechazar(nombre, evidenciaMala);
                continue;
            }
        }
        aceptados.set(v.punto, v);
    }
    const nuevos = puntos.map((p) => {
        const v = aceptados.get(p.id);
        return v === undefined ? p : puntoMezclado(p, v);
    });
    return { puntos: nuevos, resumen: { aceptados: aceptados.size, rechazados } };
}
