/**
 * Evolucion por tramos (TASK-065, `taskctl metricas --evolucion [--tramo N]`).
 * Puro: recibe las filas de metricas (de uno o varios proyectos) y devuelve
 * los tramos y su texto. La E/S vive en `commands/metricas.ts`.
 *
 * REGLAS (decididas por Carlos, 2026-10-25):
 *  - Solo entran las tareas terminadas. Las que no tienen fecha de cierre
 *    (sin `finish` en su registro ni en git) quedan fuera, y se dice cuantas
 *    y de que proyecto.
 *  - Orden por fecha de cierre comparando SOLO EL DIA (un cierre con hora y
 *    otro de solo dia del mismo dia empatan), con desempate estable por
 *    proyecto y por NUMERO de ID (TASK-99 antes que TASK-100).
 *  - Tramos de N tareas consecutivas (20 por defecto); el ultimo puede ser
 *    menor, y su `n` lo dice.
 *
 * CADA CIFRA LLEVA SU n: la media o la mediana es de las tareas del tramo que
 * tienen ese dato, y `n` dice cuantas son. Un valor null va SIEMPRE con n 0
 * (no hay ninguna tarea con el dato); nunca un 0 inventado ni un NaN.
 *  - minutos plan->finish: mediana de las tareas con las dos marcas con hora
 *    (precision de segundo). Las de solo dia no entran (restar dias daria
 *    minutos con aspecto de precisos) y se cuentan aparte en `soloDia`.
 *  - rondas: media de las tareas con revision (ultima ronda con informe).
 *  - IMPORTANTE por tarea: media de las tareas con tabla de hallazgos en
 *    todos sus informes (contados una vez por tarea, revisor + ID).
 *  - tokens de revision: media de `tokens_revision` registrado.
 *  - KB de peticion de revision: media, por tarea, de los KB de su peticion
 *    en cada ronda (`kbPorTarea`), y media de eso en el tramo.
 *
 * TASK-122 (coste fijo frente al tamano del proyecto): por tramo, ademas, la
 * mediana de minutos de punta a punta (start -> finish sin pausas), de la fase
 * de revision (primer review -> ultimo finish) y del propio `finish` (P-1),
 * solo de las tareas con precision de segundo, y cuantas tareas llevaba
 * cerradas el proyecto al acabar el tramo. `tendenciaCosteFijo` compara el
 * primer tramo con el ultimo: crece o baja si la mediana cambia mas de un
 * `UMBRAL_TENDENCIA`; si no, se mantiene.
 */
import { media, mediana, tablaDeTexto } from './metricas.js';
export const TRAMO_POR_DEFECTO = 20;
/** TASK-122: cambio relativo (0.15 = 15 %) por debajo del cual el coste fijo «se mantiene». */
export const UMBRAL_TENDENCIA = 0.15;
/** Numero del ID (`TASK-0099` -> 99) para ordenar por numero y no por cadena. */
export function numeroDeId(id) {
    const m = /(\d+)$/.exec(id);
    return m === null ? Number.MAX_SAFE_INTEGER : Number(m[1]);
}
/** Comparador de cadenas determinista (sin locale). */
function cmp(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
/** Orden de cierre: dia, proyecto y numero de ID (las filas sin cierre van al final). */
export function ordenarPorCierre(filas) {
    return [...filas].sort((a, b) => cmp(a.cierre ?? '￿', b.cierre ?? '￿') ||
        cmp(a.proyecto, b.proyecto) ||
        numeroDeId(a.id) - numeroDeId(b.id) ||
        cmp(a.id, b.id));
}
/** KB medio por ronda de una tarea; null si no tiene ninguna peticion de revision. */
export function kbPorTarea(f) {
    if (f.kbPeticionPorRonda.length === 0)
        return null;
    return media(f.kbPeticionPorRonda.map((p) => p.kb), 1);
}
function cifra(valores, decimales = 2) {
    return { valor: media(valores, decimales), n: valores.length };
}
/** Mediana de minutos (un decimal) de las duraciones con precision de segundo. */
function medianaMinutos(duraciones) {
    const minutos = duraciones
        .filter((d) => d !== null && d.precision === 'segundo')
        .map((d) => d.valor / 60_000);
    const m = mediana(minutos);
    return { valor: m === null ? null : Math.round(m * 10) / 10, n: minutos.length };
}
function tramoDe(numero, filas, acumuladas) {
    const minutos = filas
        .filter((f) => f.total !== null && f.total.precision === 'segundo')
        .map((f) => f.total.valor / 60_000);
    const m = mediana(minutos);
    return {
        tramo: numero,
        n: filas.length,
        desde: filas[0]?.cierre ?? '',
        hasta: filas[filas.length - 1]?.cierre ?? '',
        minutosPlanAFinish: {
            valor: m === null ? null : Math.round(m * 10) / 10,
            n: minutos.length,
            soloDia: filas.filter((f) => f.total !== null && f.total.precision === 'dia').length,
        },
        rondas: cifra(filas.map((f) => f.rondas).filter((v) => v !== null)),
        importantesPorTarea: cifra(filas.map((f) => f.hallazgos.porSeveridad?.IMPORTANTE).filter((v) => v !== undefined)),
        tokensRevision: cifra(filas.map((f) => f.tokens.revision).filter((v) => v !== null), 0),
        kbPeticionPorRonda: cifra(filas.map(kbPorTarea).filter((v) => v !== null), 1),
        cerradasAcumuladas: acumuladas,
        minutosPuntaAPunta: medianaMinutos(filas.map((f) => f.puntaAPunta)),
        minutosRevision: medianaMinutos(filas.map((f) => f.revision)),
        minutosFinish: medianaMinutos(filas.map((f) => f.finish)),
    };
}
/** Tramos de `tamano` tareas terminadas con cierre. `tamano` entero >= 1 (lo valida quien llama). */
export function calcularEvolucion(filas, tamano = TRAMO_POR_DEFECTO) {
    const terminadas = filas.filter((f) => f.estado === 'terminada');
    const conCierre = ordenarPorCierre(terminadas.filter((f) => f.cierre !== null));
    const porProyecto = {};
    for (const f of terminadas) {
        if (f.cierre === null)
            porProyecto[f.proyecto] = (porProyecto[f.proyecto] ?? 0) + 1;
    }
    const tramos = [];
    for (let i = 0; i < conCierre.length; i += tamano) {
        const trozo = conCierre.slice(i, i + tamano);
        tramos.push(tramoDe(tramos.length + 1, trozo, i + trozo.length));
    }
    return {
        tamanoTramo: tamano,
        terminadas: terminadas.length,
        enTramos: conCierre.length,
        sinCierre: { total: terminadas.length - conCierre.length, porProyecto },
        tramos,
    };
}
/** TASK-122: tendencia de una cifra del primer al ultimo tramo. */
export function tendencia(primera, ultima) {
    if (primera.valor === null || ultima.valor === null)
        return 'sin datos';
    if (primera.valor === 0)
        return ultima.valor === 0 ? 'se mantiene' : 'crece';
    const cambio = (ultima.valor - primera.valor) / primera.valor;
    if (cambio > UMBRAL_TENDENCIA)
        return 'crece';
    if (cambio < -UMBRAL_TENDENCIA)
        return 'baja';
    return 'se mantiene';
}
/**
 * TASK-122: linea que compara el coste fijo por tarea (punta a punta, revision
 * y finish) del primer tramo con el del ultimo; null con menos de dos tramos.
 * Si hay al menos dos tramos completos, compara solo completos: un ultimo
 * tramo de dos tareas no decide la tendencia (medido en ToolsaWeb: 2 tareas
 * de 354 min contra 30 de 51).
 */
export function tendenciaCosteFijo(e) {
    if (e.tramos.length < 2)
        return null;
    const completos = e.tramos.filter((t) => t.n === e.tamanoTramo);
    const base = completos.length >= 2 ? completos : e.tramos;
    const a = base[0];
    const b = base[base.length - 1];
    const parte = (nombre, x, y) => `${nombre} ${x.valor === null ? '—' : String(x.valor)} -> ${y.valor === null ? '—' : String(y.valor)} min (${tendencia(x, y)})`;
    return (`Coste fijo por tarea, del tramo 1 (${String(a.cerradasAcumuladas)} cerradas) al ${String(b.tramo)} ` +
        `(${String(b.cerradasAcumuladas)} cerradas): ` +
        [
            parte('punta a punta', a.minutosPuntaAPunta, b.minutosPuntaAPunta),
            parte('revision', a.minutosRevision, b.minutosRevision),
            parte('finish', a.minutosFinish, b.minutosFinish),
        ].join('; ') +
        `. Umbral: ${String(Math.round(UMBRAL_TENDENCIA * 100))} %.`);
}
/** `valor (n=N)`, o `— (n=0)`. */
export function celdaCifra(c, sufijo = '') {
    return c.valor === null ? `— (n=0)` : `${String(c.valor)}${sufijo} (n=${String(c.n)})`;
}
export const NOTA_EVOLUCION = 'Tramos de tareas terminadas en orden de cierre (solo el dia; desempate por proyecto y numero de ' +
    'ID). Cada cifra es de las tareas del tramo con ese dato, y n dice cuantas son: «— (n=0)» es que ' +
    'ninguna lo tiene, no un cero. min plan->finish = mediana de minutos de las tareas con hora en las ' +
    'dos marcas (las de solo dia van en «solo dia»); rondas = ultima ronda con informe; IMP/tarea = ' +
    'hallazgos IMPORTANTE una vez por tarea (revisor + ID), de las tareas con tabla de hallazgos; ' +
    'tok revision = media de tokens_revision registrado; KB/ronda = media por tarea de los KB de su ' +
    'peticion de revision en cada ronda. cerradas = tareas cerradas con fecha de cierre al acabar el tramo; ' +
    'min punta a punta, min revision y min finish = medianas de las tareas con hora (coste fijo por tarea).';
/** Texto de la evolucion: tabla de tramos y lo que quedo fuera. */
export function formatearEvolucion(e, varios) {
    const fuera = e.sinCierre.total === 0
        ? 'ninguna'
        : String(e.sinCierre.total) +
            (varios
                ? ` (${Object.entries(e.sinCierre.porProyecto)
                    .sort((a, b) => cmp(a[0], b[0]))
                    .map(([p, n]) => `${p} ${String(n)}`)
                    .join(', ')})`
                : '');
    const cabecera = `Evolucion por tramos de ${String(e.tamanoTramo)}: ${String(e.terminadas)} tareas terminadas, ` +
        `${String(e.enTramos)} en tramos; fuera por no tener fecha de cierre: ${fuera}.`;
    if (e.tramos.length === 0)
        return [cabecera, '', NOTA_EVOLUCION].join('\n');
    const tabla = tablaDeTexto([
        'tramo',
        'tareas',
        'cierres',
        'min plan->finish',
        'solo dia',
        'rondas',
        'IMP/tarea',
        'tok revision',
        'KB/ronda',
        // TASK-122: coste fijo por tarea frente a las tareas cerradas (al final: no mueve las de antes).
        'cerradas',
        'min punta a punta',
        'min revision',
        'min finish',
    ], e.tramos.map((t) => [
        String(t.tramo),
        String(t.n),
        t.desde === t.hasta ? t.desde : `${t.desde} a ${t.hasta}`,
        celdaCifra(t.minutosPlanAFinish),
        String(t.minutosPlanAFinish.soloDia),
        celdaCifra(t.rondas),
        celdaCifra(t.importantesPorTarea),
        celdaCifra(t.tokensRevision),
        celdaCifra(t.kbPeticionPorRonda),
        String(t.cerradasAcumuladas),
        celdaCifra(t.minutosPuntaAPunta),
        celdaCifra(t.minutosRevision),
        celdaCifra(t.minutosFinish),
    ]));
    const linea = tendenciaCosteFijo(e);
    return [cabecera, '', tabla, ...(linea === null ? [] : ['', linea]), '', NOTA_EVOLUCION].join('\n');
}
