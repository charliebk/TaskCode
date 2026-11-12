/**
 * Nucleo puro de la comprobacion `documento-estado` de `taskctl doctor`
 * (TASK-124, parte c). Decide si el documento de estado que declara la clave
 * `documento_estado` esta al dia; no toca disco ni lanza procesos (la fecha del
 * ultimo commit y las tareas terminadas las lee commands/doctor.ts).
 *
 * Reglas:
 *
 * - Sin la clave: `omitida`. El plugin no presupone ningun documento.
 * - El fichero no existe o no tiene commits: `aviso`.
 * - La fecha del documento es la del ultimo commit que lo toca (no el mtime,
 *   que cambia al clonar o al cambiar de rama), y se compara por DIA de
 *   calendario: el dia que escribe `%cI` (el del committer) contra el dia local
 *   de "hoy".
 * - Borde de antiguedad: hasta 14 dias de diferencia es `ok`; 15 o mas dias
 *   completos, `aviso` (`DIAS_MAXIMOS_DOCUMENTO_ESTADO`).
 * - Va por detras si alguna tarea terminada tiene `actualizado` ESTRICTAMENTE
 *   posterior al dia del documento (el mismo dia no cuenta: se cierra la tarea
 *   y se actualiza el documento en la misma jornada).
 */
import { aviso, ok, omitida } from './doctor.js';
export const ID_DOCUMENTO_ESTADO = 'documento-estado';
/** Dias de antiguedad que se toleran; con uno mas, aviso. */
export const DIAS_MAXIMOS_DOCUMENTO_ESTADO = 14;
const DIA = /^(\d{4})-(\d{2})-(\d{2})/;
/** El dia AAAA-MM-DD con que empieza el texto, o null si no empieza por uno valido. */
export function diaDe(texto) {
    const m = DIA.exec(texto.trim());
    if (m === null)
        return null;
    const [, a, me, d] = m;
    const t = Date.UTC(Number(a), Number(me) - 1, Number(d));
    // Rechaza 2026-02-30 y similares: Date.UTC los desborda al mes siguiente.
    if (new Date(t).toISOString().slice(0, 10) !== `${a}-${me}-${d}`)
        return null;
    return `${a}-${me}-${d}`;
}
/** Dia local (AAAA-MM-DD) de un instante. */
export function diaLocal(fecha) {
    const p = (n) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}
/** Dias de calendario de `desde` a `hasta` (ambos AAAA-MM-DD); negativo si `hasta` es anterior. */
export function diasEntre(desde, hasta) {
    const ms = (dia) => {
        const [a, m, d] = dia.split('-').map(Number);
        return Date.UTC(a, m - 1, d);
    };
    return Math.round((ms(hasta) - ms(desde)) / 86_400_000);
}
/** Tareas con `actualizado` estrictamente posterior a `dia`, de la mas reciente a la mas antigua. */
export function terminadasPosteriores(terminadas, dia) {
    const posteriores = [];
    for (const t of terminadas) {
        const d = diaDe(t.actualizado);
        if (d !== null && d > dia)
            posteriores.push({ id: t.id, dia: d });
    }
    return posteriores.sort((x, y) => (x.dia === y.dia ? y.id.localeCompare(x.id) : y.dia.localeCompare(x.dia)));
}
/** La comprobacion `documento-estado` a partir de lo que ya se ha leido. */
export function evaluarDocumentoEstado(e) {
    const id = ID_DOCUMENTO_ESTADO;
    if (e.ruta === null) {
        return omitida(id, 'no se declara documento_estado en .taskcode/config.yml; no se vigila ningun documento');
    }
    const ruta = e.ruta;
    if (!e.existe) {
        return aviso(id, `${ruta}, declarado en documento_estado, no existe`, `Crea ${ruta} y commitealo, o corrige documento_estado en .taskcode/config.yml (o borra la clave).`);
    }
    const dia = e.fechaUltimoCommit === null ? null : diaDe(e.fechaUltimoCommit);
    if (dia === null) {
        return aviso(id, `${ruta} no tiene ningun commit: no hay fecha con la que medir si esta al dia`, `Commitea ${ruta}: git add ${ruta} && git commit -m "docs: estado del proyecto"`);
    }
    const dias = diasEntre(dia, e.hoy);
    const posteriores = terminadasPosteriores(e.terminadas, dia);
    const problemas = [];
    if (dias > DIAS_MAXIMOS_DOCUMENTO_ESTADO) {
        problemas.push(`lleva ${dias} dias sin actualizarse (ultimo commit: ${dia}; se toleran ${DIAS_MAXIMOS_DOCUMENTO_ESTADO})`);
    }
    if (posteriores.length > 0) {
        const ultima = posteriores[0];
        const n = posteriores.length;
        problemas.push(`va por detras de ${n} ${n === 1 ? 'tarea terminada' : 'tareas terminadas'} despues de su ultimo commit` +
            // Si ya se ha dicho la fecha en el motivo de antiguedad, no se repite.
            `${problemas.length === 0 ? ` (${dia})` : ''}; la mas reciente, ${ultima.id} (${ultima.dia})`);
    }
    if (problemas.length > 0) {
        return aviso(id, `${ruta} ${problemas.join('; y ')}`, `Repasa ${ruta} con lo cerrado desde ${dia} y commitealo.`);
    }
    const hace = dias <= 0 ? 'hoy' : dias === 1 ? 'hace 1 dia' : `hace ${dias} dias`;
    return ok(id, `${ruta} al dia: ultimo commit ${dia} (${hace}) y ninguna tarea terminada despues`);
}
