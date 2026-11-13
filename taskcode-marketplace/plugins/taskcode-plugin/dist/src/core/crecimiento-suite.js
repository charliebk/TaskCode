import { compararVersiones } from './version.js';
/** TASK-129: la puerta con el tamano de la completa: modo = numero de tests (o `-`). */
export const PUERTA_SUITE = 'suite';
function sumar(texto, re) {
    let total = null;
    for (const m of texto.matchAll(re))
        total = (total ?? 0) + Number(m[1]) + (m[2] === undefined ? 0 : Number(m[2]));
    return total;
}
function ultimo(texto, re) {
    let n = null;
    for (const m of texto.matchAll(re))
        n = Number(m[1]);
    return n;
}
/**
 * Numero de tests de la salida de un runner. Reconoce, por este orden:
 * node --test (`ℹ tests N` / `# tests N`), Jest/Vitest (`Tests: … N total`),
 * dotnet (`Total tests: N`), Maven/Gradle (ultimo `Tests run: N`), cargo
 * (suma de `test result: … N passed; M failed`) y pytest (`N passed, M failed`).
 */
export function contarTests(salida) {
    const t = salida.replace(/\x1b\[[0-9;]*m/g, '');
    const node = ultimo(t, /^\s*(?:ℹ|#)\s+tests\s+(\d+)\s*$/gm);
    if (node !== null)
        return node;
    const jest = ultimo(t, /^\s*Tests:\s+.*?(\d+)\s+total\s*$/gm);
    if (jest !== null)
        return jest;
    const dotnet = ultimo(t, /Total tests:\s*(\d+)/g);
    if (dotnet !== null)
        return dotnet;
    const maven = ultimo(t, /Tests run:\s*(\d+)/g);
    if (maven !== null)
        return maven;
    const cargo = sumar(t, /test result: \w+\.\s+(\d+) passed;\s+(\d+) failed/g);
    if (cargo !== null)
        return cargo;
    const pytest = /=+\s*(?:(\d+) failed,\s*)?(\d+) passed/.exec(t);
    if (pytest !== null)
        return Number(pytest[2]) + (pytest[1] === undefined ? 0 : Number(pytest[1]));
    return null;
}
function mediana(xs) {
    if (xs.length === 0)
        return null;
    const o = [...xs].sort((a, b) => a - b);
    const m = Math.floor(o.length / 2);
    return o.length % 2 === 1 ? o[m] : (o[m - 1] + o[m]) / 2;
}
/** Por version (orden semver), de las lineas `suite` en verde de las tareas de cada version. */
export function suitePorVersion(tareas, lineas) {
    const versionDe = new Map(tareas.filter((t) => t.version !== null).map((t) => [t.id, t.version]));
    const tests = new Map();
    const duraciones = new Map();
    for (const l of lineas) {
        if (l.puerta !== PUERTA_SUITE || l.resultado !== 'verde')
            continue;
        const v = versionDe.get(l.tarea);
        if (v === undefined)
            continue;
        duraciones.set(v, [...(duraciones.get(v) ?? []), l.duracionS]);
        if (/^\d+$/.test(l.modo))
            tests.set(v, [...(tests.get(v) ?? []), Number(l.modo)]);
    }
    return [...new Set([...tests.keys(), ...duraciones.keys()])].sort(compararVersiones).map((version) => ({
        version,
        tests: tests.has(version) ? Math.max(...tests.get(version)) : null,
        completaS: mediana(duraciones.get(version) ?? []),
    }));
}
/**
 * El aviso si, entre las dos ultimas versiones con dato de cada magnitud, los
 * tests o la duracion de la completa crecieron mas de `umbralPct`. null sin
 * datos suficientes o sin crecimiento: ni avisa ni falla.
 */
export function avisoCrecimiento(versiones, umbralPct) {
    const partes = [];
    const comparar = (nombre, sel, fmt) => {
        const con = versiones.filter((v) => sel(v) !== null);
        if (con.length < 2)
            return;
        const a = con[con.length - 2];
        const b = con[con.length - 1];
        const va = sel(a);
        const vb = sel(b);
        if (va <= 0)
            return;
        const pct = ((vb - va) / va) * 100;
        if (pct > umbralPct) {
            partes.push(`${nombre} ${fmt(va)} en ${a.version} -> ${fmt(vb)} en ${b.version} (+${String(Math.round(pct))} %)`);
        }
    };
    comparar('tests', (v) => v.tests, (n) => String(n));
    comparar('duracion de la completa', (v) => v.completaS, (n) => `${String(Math.round(n))} s`);
    return partes.length === 0 ? null : `la suite crecio mas del ${String(umbralPct)} %: ${partes.join('; ')}`;
}
