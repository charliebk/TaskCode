/**
 * Metricas por version del plugin (TASK-084, `taskctl metricas --por-version`).
 * Puro: recibe las filas de metricas y devuelve los grupos y su texto. La E/S
 * vive en `commands/metricas.ts`.
 *
 * Se agrupan las tareas TERMINADAS por `versionCierre`: la version de taskctl
 * del ultimo `finish` de su registro de Transiciones. No va en `calcularGrupos`
 * porque alli los grupos son fijos y estos son las versiones que aparezcan, y
 * porque piden mas cifras (hallazgos por severidad y origen, tokens por fase):
 * ampliar `GrupoMetricas` cambiaria el `--json` de `--grupos`.
 *
 * REGLAS (decididas por Carlos, 2026-11-06):
 *  - Las tareas sin version anotada (cerradas antes de TASK-084, con origen
 *    `git`, o con la celda editada a mano) van a `sinVersion`, aparte. Nunca
 *    se reparten por fecha ni por tag: deducirlo es el error que motiva esto.
 *  - Orden semver por componentes numericos (0.9.0 < 0.10.0); una
 *    pre-release (`0.12.0-dev`) va antes de su release.
 *  - Rondas y «aprobada a la primera», con las reglas de `--grupos`
 *    (`resumirGrupo`): sobre las tareas con revision.
 *  - Hallazgos: suma de las tareas con tabla de hallazgos en todos sus
 *    informes (`conHallazgos`); las revisadas sin tabla se cuentan aparte.
 *  - Tokens por fase: suma y media de las tareas con dato en esa fase
 *    (`conDato`); null = sin registrar, no cero.
 */
import { media, tablaDeTexto } from './metricas.js';
import { resumirGrupo } from './grupos-metricas.js';
const VERSION_PARTES_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
function compararIdentificador(a, b) {
    const na = /^\d+$/.test(a);
    const nb = /^\d+$/.test(b);
    if (na && nb)
        return Number(a) - Number(b);
    if (na !== nb)
        return na ? -1 : 1; // numerico antes que alfanumerico (semver)
    return a < b ? -1 : a > b ? 1 : 0;
}
/**
 * Orden semver: mayor, menor y parche como numeros; sin pre-release va
 * despues de con ella; dos pre-releases por identificadores. Lo que no es
 * una version (no deberia llegar: el registro ya la valida) va al final.
 */
export function compararVersiones(a, b) {
    const ma = VERSION_PARTES_RE.exec(a);
    const mb = VERSION_PARTES_RE.exec(b);
    if (ma === null || mb === null)
        return ma === null ? (mb === null ? (a < b ? -1 : a > b ? 1 : 0) : 1) : -1;
    for (let i = 1; i <= 3; i++) {
        const d = Number(ma[i]) - Number(mb[i]);
        if (d !== 0)
            return d;
    }
    const pa = ma[4];
    const pb = mb[4];
    if (pa === undefined || pb === undefined)
        return pa === pb ? 0 : pa === undefined ? 1 : -1;
    const ia = pa.split('.');
    const ib = pb.split('.');
    for (let i = 0; i < Math.min(ia.length, ib.length); i++) {
        const d = compararIdentificador(ia[i], ib[i]);
        if (d !== 0)
            return d;
    }
    return ia.length - ib.length;
}
function cifraTokens(valores) {
    const con = valores.filter((v) => v !== null);
    return { suma: con.reduce((a, b) => a + b, 0), conDato: con.length, media: media(con, 0) };
}
/** Resumen de un grupo de tareas terminadas; con `filas` vacio, n 0 y cifras null o 0. */
export function resumirVersion(version, filas) {
    const g = resumirGrupo(version ?? '', filas);
    const porSeveridad = { CRITICO: 0, IMPORTANTE: 0, MENOR: 0, desconocida: 0 };
    const porOrigen = { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': 0 };
    // Las mismas tareas que cuenta `conHallazgos`: revisadas y con tabla.
    for (const f of filas) {
        if (f.rondas === null || f.hallazgos.porSeveridad === null)
            continue;
        for (const k of Object.keys(porSeveridad))
            porSeveridad[k] += f.hallazgos.porSeveridad[k];
        if (f.hallazgos.porOrigen !== null) {
            for (const k of Object.keys(porOrigen))
                porOrigen[k] += f.hallazgos.porOrigen[k];
        }
    }
    return {
        version,
        n: g.n,
        conRevision: g.conRevision,
        aprobadasPrimera: g.aprobadasPrimera,
        pctAprobadaPrimera: g.pctAprobadaPrimera,
        rondasMedia: g.rondasMedia,
        sinRevision: g.sinRevision,
        conHallazgos: g.conHallazgos,
        sinTablaHallazgos: g.sinTablaHallazgos,
        hallazgosPorSeveridad: porSeveridad,
        hallazgosPorOrigen: porOrigen,
        tokens: {
            diseno: cifraTokens(filas.map((f) => f.tokens.diseno)),
            implementacion: cifraTokens(filas.map((f) => f.tokens.implementacion)),
            revision: cifraTokens(filas.map((f) => f.tokens.revision)),
        },
    };
}
/** Las tareas TERMINADAS de `filas`, agrupadas por la version de su cierre. */
export function calcularPorVersion(filas) {
    const t = filas.filter((f) => f.estado === 'terminada');
    const versiones = [...new Set(t.map((f) => f.versionCierre).filter((v) => v !== null))].sort(compararVersiones);
    return {
        terminadas: t.length,
        versiones: versiones.map((v) => resumirVersion(v, t.filter((f) => f.versionCierre === v))),
        sinVersion: resumirVersion(null, t.filter((f) => f.versionCierre === null)),
    };
}
function celda(v) {
    return v === null ? '—' : String(v);
}
function celdaTokens(c) {
    return c.media === null ? '—' : `${String(c.media)} (n=${String(c.conDato)})`;
}
export const NOTA_POR_VERSION = 'Solo tareas terminadas, agrupadas por la version de taskctl de su ultimo finish (columna version ' +
    'de ## Transiciones). «sin version» = cerradas sin version anotada (antes de anotarla, con origen git ' +
    'o editadas a mano): nunca se deducen por fecha. «a la primera» y «rondas medias», de las tareas con ' +
    'revision. Hallazgos: suma de las tareas con tabla de hallazgos (n), una vez por revisor + ID; ' +
    '«sin tabla» se cuenta aparte, no como cero. Tokens: media por tarea de las que tienen dato en esa ' +
    'fase (n). «—» = ninguna tarea del grupo tiene ese dato.';
/** Texto de `--por-version`: una tabla de rondas y tokens y otra de hallazgos. */
export function formatearPorVersion(p) {
    const grupos = [...p.versiones, ...(p.sinVersion.n > 0 ? [p.sinVersion] : [])];
    const nombre = (g) => g.version ?? 'sin version';
    const general = tablaDeTexto(['version', 'tareas', 'con revision', 'a la primera', 'rondas medias', 'tokens diseno', 'tokens impl.', 'tokens revision'], grupos.map((g) => [
        nombre(g),
        String(g.n),
        String(g.conRevision),
        g.pctAprobadaPrimera === null ? '—' : `${String(g.pctAprobadaPrimera)}% (${String(g.aprobadasPrimera)})`,
        celda(g.rondasMedia),
        celdaTokens(g.tokens.diseno),
        celdaTokens(g.tokens.implementacion),
        celdaTokens(g.tokens.revision),
    ]));
    const hallazgos = tablaDeTexto(['version', 'con tabla', 'sin tabla', 'CRITICO', 'IMPORTANTE', 'MENOR', 'desconocida', 'impl.', 'plan', 'especif.', 'sin clasificar'], grupos.map((g) => {
        const s = g.hallazgosPorSeveridad;
        const o = g.hallazgosPorOrigen;
        return [
            nombre(g),
            String(g.conHallazgos),
            String(g.sinTablaHallazgos),
            String(s.CRITICO),
            String(s.IMPORTANTE),
            String(s.MENOR),
            String(s.desconocida),
            String(o.implementacion),
            String(o.plan),
            String(o.especificacion),
            String(o['sin clasificar']),
        ];
    }));
    return [
        `Por version de ${String(p.terminadas)} tareas terminadas (sin version anotada: ${String(p.sinVersion.n)}).`,
        '',
        general,
        '',
        'Hallazgos por severidad y origen:',
        hallazgos,
        '',
        NOTA_POR_VERSION,
    ].join('\n');
}
