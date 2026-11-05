/**
 * Cruza las lineas añadidas (por ruta del repo) con el informe (por ruta del
 * repo). `clave` normaliza la ruta para comparar: en Windows, sin mayusculas.
 */
export function cruzarCobertura(anadidas, informe, clave = (r) => r) {
    const porClave = new Map();
    for (const [ruta, lineas] of informe)
        porClave.set(clave(ruta), lineas);
    const ficheros = [];
    const sinInstrumentar = [];
    let ejecutables = 0;
    let cubiertas = 0;
    for (const [ruta, lineas] of [...anadidas].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
        if (lineas.length === 0)
            continue;
        const registro = porClave.get(clave(ruta));
        if (registro === undefined) {
            sinInstrumentar.push(ruta);
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
/** `87.5`, `100`, `33.3`: un decimal como mucho. */
export function formatearPorcentaje(p) {
    return String(Math.round(p * 10) / 10);
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
        for (const f of conHuecos)
            lineas.push(`- \`${f.ruta}\`: ${rangos(f.sinCubrir)}`);
    }
    if (c.sinInstrumentar.length > 0) {
        lineas.push('', 'Cambian pero el informe no los lista (sin instrumentar; no cuentan):', '');
        for (const r of c.sinInstrumentar)
            lineas.push(`- \`${r}\``);
    }
    return lineas.join('\n');
}
