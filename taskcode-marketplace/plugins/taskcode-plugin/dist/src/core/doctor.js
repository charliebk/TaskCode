/**
 * Nucleo puro de `taskctl doctor` (TASK-062): el modelo de una comprobacion,
 * el codigo de salida y los dos formatos de salida. No toca disco ni lanza
 * procesos; la orquestacion esta en commands/doctor.ts.
 *
 * Niveles: `ok`, `aviso` (no cambia el codigo de salida), `error` (lo pone a
 * 1) y `omitida` (no aplica o depende de algo que ya fallo). Toda comprobacion
 * que no es `ok` ni `omitida` dice como arreglarla (`arreglo`).
 *
 * Todo texto que sale de aqui pasa por `ocultarCredenciales`, en texto y en
 * JSON: lo que dicen git, gh y glab a veces repite la URL del remoto.
 */
import { ocultarCredenciales } from './plataforma-remota.js';
/** Version minima de Node que soporta el plugin: la que prueba el CI y la que declara `engines` en package.json. */
export const NODE_MINIMO = 22;
export const ok = (id, mensaje) => ({ id, nivel: 'ok', mensaje, arreglo: null });
export const aviso = (id, mensaje, arreglo) => ({
    id,
    nivel: 'aviso',
    mensaje,
    arreglo,
});
export const error = (id, mensaje, arreglo) => ({
    id,
    nivel: 'error',
    mensaje,
    arreglo,
});
export const omitida = (id, mensaje) => ({ id, nivel: 'omitida', mensaje, arreglo: null });
/** 1 si alguna comprobacion es un error; los avisos y las omitidas no cuentan. */
export function codigoSalida(comprobaciones) {
    return comprobaciones.some((c) => c.nivel === 'error') ? 1 : 0;
}
/** true si la version de Node (`22.23.3`, con o sin `v`) es la minima o mayor. */
export function nodeSoportado(version, minimo = NODE_MINIMO) {
    const mayor = Number(/^v?(\d+)/.exec(version)?.[1] ?? Number.NaN);
    return Number.isFinite(mayor) && mayor >= minimo;
}
function contar(cs, nivel) {
    return cs.filter((c) => c.nivel === nivel).length;
}
const ETIQUETA = {
    ok: '[ok]     ',
    aviso: '[AVISO]  ',
    error: '[ERROR]  ',
    omitida: '[omitida]',
};
/** Una linea por comprobacion y, bajo cada aviso o error, su arreglo. Termina con el resumen. */
export function formatearTexto(cs) {
    const lineas = [];
    for (const c of cs) {
        lineas.push(`${ETIQUETA[c.nivel]} ${c.id}: ${c.mensaje}`);
        if (c.arreglo !== null) {
            const [primera, ...resto] = c.arreglo.split('\n');
            lineas.push(`          Arreglo: ${primera ?? ''}`);
            for (const l of resto)
                lineas.push(`                   ${l}`);
        }
    }
    const e = contar(cs, 'error');
    const a = contar(cs, 'aviso');
    lineas.push(`Resumen: ${e} ${e === 1 ? 'error' : 'errores'}, ${a} ${a === 1 ? 'aviso' : 'avisos'}, ` +
        `${contar(cs, 'ok')} ok, ${contar(cs, 'omitida')} omitidas.` +
        (e === 0 ? ' Listo para trabajar.' : ' Corrige los errores antes de trabajar.'));
    return ocultarCredenciales(`${lineas.join('\n')}\n`);
}
/** Una sola linea de JSON: `{ok, errores, avisos, comprobaciones}`. `ok` es `codigoSalida === 0`. */
export function formatearJson(cs) {
    const limpias = cs.map((c) => ({
        id: c.id,
        nivel: c.nivel,
        mensaje: ocultarCredenciales(c.mensaje),
        arreglo: c.arreglo === null ? null : ocultarCredenciales(c.arreglo),
    }));
    return `${JSON.stringify({
        ok: codigoSalida(cs) === 0,
        errores: contar(cs, 'error'),
        avisos: contar(cs, 'aviso'),
        comprobaciones: limpias,
    })}\n`;
}
