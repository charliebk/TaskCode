/**
 * TASK-153b (Regla 4D al crear): candidatos 4D de una ronda de revision.
 *
 * Pistas para el revisor, no hallazgos: las definiciones que la tarea anade y
 * las que ya existian en la rama base con nombre igual o parecido (posible
 * duplicacion), y los tests nuevos cuyo nombre promete algo comprobable (a
 * mutar: posible disfraz). La auditoria de TASK-141 encontro 102
 * duplicaciones y 21 disfraces; casi todos se habrian visto con estas pistas.
 *
 * Puro: recibe texto de diffs y de `git grep` y devuelve datos y markdown.
 */
import { distanciaEdicion } from './sugerencia.js';
export const SECCION_CANDIDATOS_4D = '## Candidatos 4D';
/**
 * Patrones de definicion por familia de lenguaje. El grupo 1 es el nombre.
 * Se cubren TS/JS, Rust, Python, Java/C#/Kotlin (clases) y bash; lo demas
 * no da candidatos (nunca falla).
 */
const PATRONES_DEFINICION = [
    /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/,
    /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>/,
    /^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/,
    /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_][\w]*)/,
    /^\s*(?:async\s+)?def\s+([A-Za-z_][\w]*)/,
    /^\s*(?:public|private|protected|internal)?\s*(?:static\s+)?(?:final\s+|sealed\s+|abstract\s+)?(?:class|interface|record|struct|enum)\s+([A-Za-z_][\w]*)/,
    /^\s*(?:function\s+)?([A-Za-z_][\w-]*)\s*\(\)\s*\{/,
];
/** Extensiones de codigo donde se buscan definiciones. */
const EXT_CODIGO = /\.(?:[cm]?[jt]sx?|rs|py|java|kt|cs|sh|bash)$/i;
function nombreDeDefinicion(linea) {
    for (const re of PATRONES_DEFINICION) {
        const m = re.exec(linea);
        if (m?.[1] !== undefined)
            return m[1];
    }
    return null;
}
/** Recorre un diff unificado y devuelve las lineas anadidas con su fichero y numero de linea nuevo. */
function lineasAnadidas(diff) {
    const salida = [];
    let fichero = '';
    let nueva = 0;
    for (const l of diff.split(/\r?\n/)) {
        if (l.startsWith('+++ ')) {
            const ruta = l.slice(4).trim();
            fichero = ruta === '/dev/null' ? '' : ruta.replace(/^b\//, '');
            continue;
        }
        const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
        if (hunk !== null) {
            nueva = Number(hunk[1]);
            continue;
        }
        if (fichero === '' || l.startsWith('--- '))
            continue;
        if (l.startsWith('+')) {
            salida.push({ fichero, linea: nueva, texto: l.slice(1) });
            nueva++;
        }
        else if (l.startsWith(' ')) {
            nueva++;
        }
    }
    return salida;
}
/** Definiciones que el diff anade (solo ficheros de codigo). */
export function definicionesNuevas(diff) {
    const vistas = new Set();
    const salida = [];
    for (const { fichero, linea, texto } of lineasAnadidas(diff)) {
        if (!EXT_CODIGO.test(fichero))
            continue;
        const nombre = nombreDeDefinicion(texto);
        if (nombre === null || nombre.length < 3)
            continue;
        const clave = `${fichero}\0${nombre}`;
        if (vistas.has(clave))
            continue;
        vistas.add(clave);
        salida.push({ nombre, fichero, linea });
    }
    return salida;
}
/**
 * Definiciones existentes a partir de la salida de
 * `git grep -n -I -E <patron> <ref> -- ...` (lineas `ref:fichero:linea:texto`
 * o `fichero:linea:texto`).
 */
export function definicionesDeGrep(salida, ref) {
    const defs = [];
    const prefijo = ref === undefined ? '' : `${ref}:`;
    for (const raw of salida.split(/\r?\n/)) {
        if (raw === '')
            continue;
        const l = prefijo !== '' && raw.startsWith(prefijo) ? raw.slice(prefijo.length) : raw;
        const m = /^(.+?):(\d+):(.*)$/.exec(l);
        if (m === null)
            continue;
        const [, fichero, num, texto] = m;
        if (!EXT_CODIGO.test(fichero))
            continue;
        const nombre = nombreDeDefinicion(texto);
        if (nombre !== null && nombre.length >= 3)
            defs.push({ nombre, fichero, linea: Number(num) });
    }
    return defs;
}
/** Forma comparable de un nombre: sin mayusculas ni separadores. */
function normal(nombre) {
    return nombre.toLowerCase().replace(/[_$-]/g, '');
}
/** ¿Se parecen lo bastante dos nombres como para sospechar duplicacion? */
export function nombresParecidos(a, b) {
    const na = normal(a);
    const nb = normal(b);
    if (na === nb)
        return true;
    const corto = Math.min(na.length, nb.length);
    if (corto < 5)
        return false;
    return distanciaEdicion(na, nb) <= Math.max(1, Math.floor(corto / 5));
}
/** Palabras que hacen de un nombre de test una promesa comprobable (ver disfraz-tests.md). */
const PROMESAS = [
    'sin efectos', 'no toca', 'intacto', 'limpio', 'antes de', 'nunca', 'siempre', 'solo ', 'ordena',
    'no cambia', 'no deja', 'no pisa', 'no borra', 'error claro', 'exacto', 'exactamente', 'ninguno',
    'without', 'never', 'always', 'only ', 'unchanged', 'untouched', 'sorted', 'before',
];
const PATRONES_TEST = [
    /^\s*(?:test|it|describe)(?:\.\w+)?\(\s*(['"`])(.+?)\1/,
    /^\s*(?:async\s+)?(?:fn|def)\s+(test_[\w]+)/,
];
/** Tests que el diff anade con un nombre que promete algo comprobable. */
export function testsQuePrometen(diffTests) {
    const salida = [];
    for (const { fichero, linea, texto } of lineasAnadidas(diffTests)) {
        let nombre = null;
        for (const re of PATRONES_TEST) {
            const m = re.exec(texto);
            if (m !== null) {
                nombre = (m[2] ?? m[1] ?? '').replace(/_/g, ' ');
                break;
            }
        }
        if (nombre === null)
            continue;
        const bajo = ` ${nombre.toLowerCase()} `;
        if (PROMESAS.some((p) => bajo.includes(p)))
            salida.push({ nombre, fichero, linea });
    }
    return salida;
}
/** Topes para no inflar la peticion. */
export const MAX_DEFINICIONES = 15;
export const MAX_PARECIDOS = 3;
export const MAX_TESTS = 15;
export function candidatos4D(diffCodigo, diffTests, existentes) {
    const duplicados = [];
    for (const nueva of definicionesNuevas(diffCodigo)) {
        const parecidas = existentes
            .filter((e) => !(e.fichero === nueva.fichero && e.nombre === nueva.nombre))
            .filter((e) => nombresParecidos(nueva.nombre, e.nombre))
            .slice(0, MAX_PARECIDOS);
        if (parecidas.length > 0)
            duplicados.push({ nueva, existentes: parecidas });
        if (duplicados.length >= MAX_DEFINICIONES)
            break;
    }
    return { duplicados, testsAMutar: testsQuePrometen(diffTests).slice(0, MAX_TESTS) };
}
const loc = (d) => `\`${d.nombre}\` (${d.fichero}:${String(d.linea)})`;
/** La seccion `## Candidatos 4D` de la peticion. */
export function seccionCandidatos4D(c) {
    const cabecera = `${SECCION_CANDIDATOS_4D}\n\n` +
        'Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).\n\n';
    if (c.duplicados.length === 0 && c.testsAMutar.length === 0) {
        return `${cabecera}Sin candidatos: ninguna definicion nueva se parece a una existente y ningun test nuevo promete algo que haya que mutar.\n\n`;
    }
    let texto = cabecera;
    if (c.duplicados.length > 0) {
        texto +=
            '### Posible duplicacion\n\n' +
                'Definiciones nuevas con nombre igual o parecido a otra que ya existia en la rama base. ' +
                'Mira si hacen lo mismo con pequenas diferencias (duplicacion real = IMPORTANTE).\n\n' +
                c.duplicados.map((d) => `- ${loc(d.nueva)} ~ ${d.existentes.map(loc).join(', ')}\n`).join('') +
                '\n';
    }
    if (c.testsAMutar.length > 0) {
        texto +=
            '### Tests a mutar\n\n' +
                'Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ' +
                'ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).\n\n' +
                c.testsAMutar.map((t) => `- «${t.nombre}» (${t.fichero}:${String(t.linea)})\n`).join('') +
                '\n';
    }
    return texto;
}
