/** Extension en minusculas (`.mjs`), o '' si no tiene. */
export function extension(ruta) {
    const base = ruta.slice(ruta.lastIndexOf('/') + 1);
    const punto = base.lastIndexOf('.');
    return punto <= 0 ? '' : base.slice(punto).toLowerCase();
}
/** Declaraciones de TypeScript: no tienen codigo ejecutable. */
const DECLARACIONES_RE = /\.d\.[cm]?ts$/i;
/** Carpetas (sin la raiz) de una ruta del repo, de la mas cercana a la mas lejana: `a/b/c.js` -> `a/b`, `a`. */
function carpetas(ruta) {
    const partes = ruta.split('/').slice(0, -1);
    const r = [];
    for (let i = partes.length; i > 0; i--)
        r.push(partes.slice(0, i).join('/'));
    return r;
}
/**
 * Cruza las lineas añadidas (por ruta del repo) con el informe (por ruta del
 * repo). `clave` normaliza la ruta para comparar: en Windows, sin mayusculas.
 */
export function cruzarCobertura(anadidas, informe, clave = (r) => r) {
    const porClave = new Map();
    const medidas = new Set();
    /** Carpetas (por clave, sin la raiz) con algun fichero medido debajo. */
    const carpetasMedidas = new Set();
    let raizMedida = false;
    for (const [ruta, lineas] of informe) {
        porClave.set(clave(ruta), lineas);
        const ext = extension(ruta);
        if (ext !== '')
            medidas.add(ext);
        const cs = carpetas(ruta);
        if (cs.length === 0)
            raizMedida = true;
        for (const c of cs)
            carpetasMedidas.add(clave(c));
    }
    const esCodigoMedido = (ruta) => {
        if (DECLARACIONES_RE.test(ruta) || !medidas.has(extension(ruta)))
            return false;
        const cs = carpetas(ruta);
        return cs.length === 0 ? raizMedida : cs.some((c) => carpetasMedidas.has(clave(c)));
    };
    const ficheros = [];
    const sinInstrumentar = [];
    let ejecutables = 0;
    let cubiertas = 0;
    for (const [ruta, lineas] of [...anadidas].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
        if (lineas.length === 0)
            continue;
        const registro = porClave.get(clave(ruta));
        if (registro === undefined) {
            if (!esCodigoMedido(ruta)) {
                sinInstrumentar.push(ruta);
                continue;
            }
            const sinCubrir = [...lineas].sort((a, b) => a - b);
            ficheros.push({ ruta, ejecutables: sinCubrir.length, cubiertas: 0, sinCubrir, fueraDelInforme: true });
            ejecutables += sinCubrir.length;
            continue;
        }
        const f = { ruta, ejecutables: 0, cubiertas: 0, sinCubrir: [] };
        for (const n of [...lineas].sort((a, b) => a - b)) {
            const veces = registro.get(n);
            if (veces === undefined)
                continue;
            f.ejecutables++;
            if (veces > 0)
                f.cubiertas++;
            else
                f.sinCubrir.push(n);
        }
        if (f.ejecutables === 0)
            continue;
        ficheros.push(f);
        ejecutables += f.ejecutables;
        cubiertas += f.cubiertas;
    }
    return {
        ficheros,
        sinInstrumentar,
        ejecutables,
        cubiertas,
        porcentaje: ejecutables === 0 ? null : (100 * cubiertas) / ejecutables,
    };
}
/** Solo los ficheros de `rutas` (una peticion fragmentada por dominio), con los totales recalculados. */
export function filtrarCruce(c, rutas) {
    const ficheros = c.ficheros.filter((f) => rutas.has(f.ruta));
    const ejecutables = ficheros.reduce((s, f) => s + f.ejecutables, 0);
    const cubiertas = ficheros.reduce((s, f) => s + f.cubiertas, 0);
    return {
        ficheros,
        sinInstrumentar: c.sinInstrumentar.filter((r) => rutas.has(r)),
        ejecutables,
        cubiertas,
        porcentaje: ejecutables === 0 ? null : (100 * cubiertas) / ejecutables,
    };
}
/** `[4,5,6,9]` -> `4-6, 9`. */
export function rangos(lineas) {
    const partes = [];
    let i = 0;
    while (i < lineas.length) {
        const ini = lineas[i];
        let fin = ini;
        while (i + 1 < lineas.length && lineas[i + 1] === fin + 1) {
            fin++;
            i++;
        }
        partes.push(ini === fin ? String(ini) : `${ini}-${fin}`);
        i++;
    }
    return partes.join(', ');
}
/**
 * `87.5`, `100`, `33.3`: un decimal como mucho, redondeado HACIA ABAJO, para
 * que un 90.96 que no llega a 91 no se lea «91 % no llega a 91 %» (MEN-2).
 */
export function formatearPorcentaje(p) {
    return String(Math.floor(p * 10) / 10);
}
/** true si cumple el umbral (porcentaje minimo; el valor exacto pasa). Sin lineas ejecutables, pasa. */
export function cumpleUmbral(c, umbral) {
    if (c.ejecutables === 0)
        return true;
    // Sin dividir: 2 de 3 contra 66.67 no depende del redondeo de coma flotante.
    return c.cubiertas * 100 >= umbral * c.ejecutables;
}
/** El resumen y las lineas sin cubrir, en Markdown, para la peticion y para el mensaje de finish. */
export function describirCruce(c) {
    const lineas = [];
    lineas.push(c.porcentaje === null
        ? 'Ninguna linea cambiada es ejecutable segun el informe: no hay nada que medir.'
        : `Cubiertas ${c.cubiertas} de ${c.ejecutables} lineas cambiadas ejecutables (${formatearPorcentaje(c.porcentaje)} %).`);
    const conHuecos = c.ficheros.filter((f) => f.sinCubrir.length > 0);
    if (conHuecos.length > 0) {
        lineas.push('', 'Sin cubrir (ningun test las ejecuta):', '');
        for (const f of conHuecos) {
            lineas.push(`- \`${f.ruta}\`: ${rangos(f.sinCubrir)}` +
                (f.fueraDelInforme ? ' (el informe no lo lista, y es codigo de una carpeta que si mide: cuenta entero)' : ''));
        }
    }
    if (c.sinInstrumentar.length > 0) {
        lineas.push('', 'Cambian pero el informe no los lista (sin instrumentar; no cuentan):', '');
        for (const r of c.sinInstrumentar)
            lineas.push(`- \`${r}\``);
    }
    return lineas.join('\n');
}
