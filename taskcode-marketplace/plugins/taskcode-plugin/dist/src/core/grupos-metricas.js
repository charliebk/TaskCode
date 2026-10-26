/**
 * Grupos de tareas terminadas (TASK-065, `taskctl metricas --grupos`). Puro:
 * recibe las filas de metricas (de uno o varios proyectos) y devuelve los
 * grupos y su texto. La E/S vive en `commands/metricas.ts`.
 *
 * Se agrupa por tipo, por complejidad declarada, por numero de criterios
 * (0-4, 5-6, 7 o mas), por KB de peticion de revision por ronda (terciles) y
 * por proyecto. Los grupos de cada dimension son FIJOS (todos los tipos,
 * todas las complejidades, los tres tramos de criterios, los tres terciles,
 * todos los proyectos leidos): un grupo sin tareas sale con n 0 y sus cifras
 * null, en vez de desaparecer.
 *
 * REGLAS (decididas por Carlos, 2026-10-25):
 *  - «Aprobada a la primera» = una sola ronda (`rondas === 1`) con veredicto
 *    `aprobada` o `aprobada-con-correcciones`. El porcentaje es sobre las
 *    tareas CON revision; las que no tienen se cuentan aparte
 *    (`sinRevision`), no como no aprobadas.
 *  - Hallazgos CRITICO+IMPORTANTE por tarea, contados una vez por tarea
 *    (revisor + ID, `resumirHallazgos`), sobre las tareas con tabla de
 *    hallazgos en todos sus informes; las revisadas sin tabla se cuentan
 *    aparte (`sinTablaHallazgos`), no como cero.
 *  - Terciles de KB con TODOS los proyectos juntos: los cortes salen de las
 *    tareas terminadas con alguna peticion de revision (`kbPorTarea`); las
 *    demas se cuentan aparte (`sinKb`), nunca como 0 KB. Corte por valor
 *    (bajo <= c1 < medio <= c2 < alto), asi que dos tareas con el mismo KB
 *    caen siempre en el mismo tercil (y los grupos pueden no ser iguales).
 */
import { TASK_COMPLEXITIES, TASK_TYPES } from './task.js';
import { media, tablaDeTexto } from './metricas.js';
import { kbPorTarea } from './evolucion.js';
export const TRAMOS_CRITERIOS = ['0-4', '5-6', '7+'];
export function tramoCriterios(n) {
    return n <= 4 ? '0-4' : n <= 6 ? '5-6' : '7+';
}
export function aprobadaALaPrimera(f) {
    return f.rondas === 1 && f.veredictoRonda1 === 'aprobada';
}
/** Resumen de un grupo; con `filas` vacio, n 0 y cifras null. */
export function resumirGrupo(grupo, filas) {
    const revisadas = filas.filter((f) => f.rondas !== null);
    const conTabla = revisadas.filter((f) => f.hallazgos.porSeveridad !== null);
    const aprobadas = revisadas.filter(aprobadaALaPrimera).length;
    return {
        grupo,
        n: filas.length,
        conRevision: revisadas.length,
        aprobadasPrimera: aprobadas,
        pctAprobadaPrimera: revisadas.length === 0 ? null : Math.round((aprobadas / revisadas.length) * 1000) / 10,
        rondasMedia: media(revisadas.map((f) => f.rondas)),
        conHallazgos: conTabla.length,
        critImpPorTarea: media(conTabla.map((f) => {
            const s = f.hallazgos.porSeveridad;
            return s.CRITICO + s.IMPORTANTE;
        })),
        sinRevision: filas.length - revisadas.length,
        sinTablaHallazgos: revisadas.length - conTabla.length,
    };
}
function porClave(filas, claves, claveDe) {
    return claves.map((k) => resumirGrupo(k, filas.filter((f) => claveDe(f) === k)));
}
/** Valor en la posicion del cuantil q (0-1) de una lista ORDENADA no vacia. */
function cuantil(ordenados, q) {
    return ordenados[Math.max(0, Math.ceil(ordenados.length * q) - 1)];
}
/**
 * Los grupos de las tareas TERMINADAS de `filas`. `proyectos` son los
 * proyectos leidos (en su orden), tambien los que no tengan ninguna.
 */
export function calcularGrupos(filas, proyectos) {
    const t = filas.filter((f) => f.estado === 'terminada');
    const kbs = t.map(kbPorTarea).filter((v) => v !== null).sort((a, b) => a - b);
    const cortes = kbs.length === 0 ? null : { c1: cuantil(kbs, 1 / 3), c2: cuantil(kbs, 2 / 3) };
    const etiquetas = cortes === null
        ? ['bajo', 'medio', 'alto']
        : [
            `bajo (<= ${String(cortes.c1)} KB)`,
            `medio (${String(cortes.c1)}-${String(cortes.c2)} KB)`,
            `alto (> ${String(cortes.c2)} KB)`,
        ];
    const tercil = (f) => {
        const kb = kbPorTarea(f);
        if (kb === null || cortes === null)
            return '';
        return (kb <= cortes.c1 ? etiquetas[0] : kb <= cortes.c2 ? etiquetas[1] : etiquetas[2]);
    };
    const todas = resumirGrupo('', t);
    return {
        terminadas: t.length,
        sinRevision: todas.sinRevision,
        sinTablaHallazgos: todas.sinTablaHallazgos,
        porTipo: porClave(t, TASK_TYPES, (f) => f.tipo),
        porComplejidad: porClave(t, [...TASK_COMPLEXITIES, '—'], (f) => f.complejidad ?? '—'),
        porCriterios: porClave(t, TRAMOS_CRITERIOS, (f) => tramoCriterios(f.criterios)),
        porKb: { cortes, sinKb: t.length - kbs.length, grupos: porClave(t, etiquetas, tercil) },
        porProyecto: porClave(t, proyectos, (f) => f.proyecto),
    };
}
function celda(v, sufijo = '') {
    return v === null ? '—' : `${String(v)}${sufijo}`;
}
function tablaGrupos(etiqueta, grupos) {
    return tablaDeTexto([etiqueta, 'tareas', 'con revision', 'a la primera', 'rondas medias', 'CRIT+IMP/tarea', 'sin revision', 'sin tabla'], grupos.map((g) => [
        g.grupo,
        String(g.n),
        String(g.conRevision),
        g.pctAprobadaPrimera === null ? '—' : `${String(g.pctAprobadaPrimera)}% (${String(g.aprobadasPrimera)})`,
        celda(g.rondasMedia),
        g.critImpPorTarea === null ? '—' : `${String(g.critImpPorTarea)} (n=${String(g.conHallazgos)})`,
        String(g.sinRevision),
        String(g.sinTablaHallazgos),
    ]));
}
export const NOTA_GRUPOS = 'Solo tareas terminadas. «a la primera» = una sola ronda con veredicto aprobada o ' +
    'aprobada-con-correcciones, en % de las tareas con revision (entre parentesis, cuantas); ' +
    '«rondas medias», tambien de las tareas con revision. CRIT+IMP/tarea = hallazgos CRITICO e ' +
    'IMPORTANTE una vez por tarea (revisor + ID), de las tareas con tabla de hallazgos (n). «sin ' +
    'revision» (ningun informe) y «sin tabla» (algun informe sin tabla de hallazgos) se cuentan aparte, ' +
    'no como cero. «—» = ninguna tarea del grupo tiene ese dato. Terciles de KB por ronda de la ' +
    'peticion de revision con todos los proyectos juntos, cortados por valor (los iguales caen juntos).';
/** Texto de los grupos: una tabla por dimension. */
export function formatearGrupos(g) {
    const kb = g.porKb;
    return [
        `Grupos de ${String(g.terminadas)} tareas terminadas (sin revision: ${String(g.sinRevision)}; ` +
            `revisadas sin tabla de hallazgos: ${String(g.sinTablaHallazgos)}).`,
        '',
        'Por tipo:',
        tablaGrupos('tipo', g.porTipo),
        '',
        'Por complejidad declarada:',
        tablaGrupos('complejidad', g.porComplejidad),
        '',
        'Por numero de criterios:',
        tablaGrupos('criterios', g.porCriterios),
        '',
        `Por KB de peticion de revision por ronda (terciles; sin peticion, fuera: ${String(kb.sinKb)}):`,
        tablaGrupos('KB/ronda', kb.grupos),
        '',
        'Por proyecto:',
        tablaGrupos('proyecto', g.porProyecto),
        '',
        NOTA_GRUPOS,
    ].join('\n');
}
