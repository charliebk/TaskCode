/**
 * Parser de informes lcov — TASK-074. Hecho a mano (cero dependencias): solo
 * lee `SF:` (fichero), `DA:<linea>,<veces>` (linea ejecutable y cuantas veces
 * se ejecuto) y `end_of_record`; el resto (TN, FN, BRDA, LH...) se ignora.
 *
 * Puro: recibe el texto y devuelve las rutas TAL CUAL las escribio el
 * generador (`node --test` las escribe relativas al cwd y con `\` en Windows;
 * c8 o istanbul, absolutas). Resolverlas contra el repo es de fs/cobertura.ts.
 */
const DA_RE = /^DA:(\d+),(-?\d+)/;
export function parsearLcov(texto) {
    const ficheros = new Map();
    let actual = null;
    for (const bruta of texto.split(/\r?\n/)) {
        const linea = bruta.trim();
        if (linea.startsWith('SF:')) {
            const ruta = linea.slice(3).trim();
            actual = ficheros.get(ruta) ?? new Map();
            ficheros.set(ruta, actual);
            continue;
        }
        if (linea === 'end_of_record') {
            actual = null;
            continue;
        }
        if (actual === null)
            continue;
        const m = DA_RE.exec(linea);
        if (m === null)
            continue;
        const n = parseInt(m[1], 10);
        const veces = Math.max(0, parseInt(m[2], 10));
        // Informes fusionados (monorepo, nyc merge): la linea se ejecuto si se
        // ejecuto en cualquiera de ellos.
        actual.set(n, (actual.get(n) ?? 0) + veces);
    }
    return { ficheros, truncado: actual !== null };
}
