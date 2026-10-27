/**
 * Patrones de claves y secretos de `taskctl doctor-deploy` (TASK-066) y su
 * enmascarado. Modulo puro: no toca disco ni lanza procesos.
 *
 * Tres clases de hallazgo:
 * - `secreto`: una clave que no debe estar en el repositorio (sk_live_,
 *   service_role de Supabase, AKIA de AWS, clave privada...).
 * - `publica`: una clave hecha para ser publica (anon / publishable de
 *   Supabase, apiKey `AIza` de la config web de Firebase). No es un fallo.
 * - `ejemplo`: una clave de ejemplo o de prueba (AKIAIOSFODNN7EXAMPLE,
 *   sk_test_). Tampoco es un fallo.
 *
 * Enmascarado: el valor crudo de un secreto NO sale nunca de aqui. `muestra`
 * lleva como mucho los 4 primeros caracteres y la longitud. Ademas
 * `ocultarSecretos` es la segunda red: reescribe cualquier texto que vaya a
 * salir (stdout, JSON, informe en disco, stderr) por si algo se coló.
 */
import { createHash } from 'node:crypto';
/** Texto que, como contrasena de una URL, es un marcador y no un secreto. */
const CONTRASENA_MARCADOR = /^(?:password|passwd|pass|contrasena|changeme|secret|example|your[-_]?password|\*+|x+|\.{3,}|<[^>]*>|\$\{[^}]*\}|\{\{[^}]*\}\}|%[^%]+%)$/i;
const HOST_LOCAL = /^(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|.*\.?example(?:\.[a-z]+)?|.*\.local|.*\.test|.*\.invalid)$/i;
function decodificarPayloadJwt(jwt) {
    const partes = jwt.split('.');
    const payload = partes[1];
    if (payload === undefined)
        return null;
    try {
        const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        const o = JSON.parse(json);
        return typeof o === 'object' && o !== null && !Array.isArray(o) ? o : null;
    }
    catch {
        return null;
    }
}
/**
 * Patrones de alta precision: se prefiere perder una clave rara a inundar el
 * informe de falsos positivos (la gente deja de leerlo). Cada uno lleva el
 * flag `g` y se usa solo con `matchAll` / `exec` en bucle sobre una copia.
 */
const PATRONES = [
    {
        id: 'aws-access-key',
        re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
        clasificar: (m) => (m[0].includes('EXAMPLE') ? { clase: 'ejemplo' } : { clase: 'secreto' }),
    },
    { id: 'stripe-live', re: /\b[sr]k_live_[0-9A-Za-z]{10,}/g },
    { id: 'stripe-publicable', re: /\bpk_live_[0-9A-Za-z]{10,}/g, clasificar: () => ({ clase: 'publica' }) },
    { id: 'stripe-test', re: /\b[sr]k_test_[0-9A-Za-z]{10,}/g, clasificar: () => ({ clase: 'ejemplo' }) },
    { id: 'github-token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
    { id: 'github-pat', re: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g },
    { id: 'slack-token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g },
    { id: 'npm-token', re: /\bnpm_[A-Za-z0-9]{36}\b/g },
    { id: 'sendgrid-key', re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g },
    { id: 'llm-api-key', re: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}/g },
    { id: 'supabase-secret', re: /\bsb_secret_[A-Za-z0-9_-]{20,}/g },
    { id: 'supabase-publishable', re: /\bsb_publishable_[A-Za-z0-9_-]{20,}/g, clasificar: () => ({ clase: 'publica' }) },
    { id: 'firebase-web-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, clasificar: () => ({ clase: 'publica' }) },
    {
        // Los JWT de Supabase: `anon` es publica, `service_role` no. Cualquier otro
        // JWT (sesiones, ejemplos de documentacion) se descarta.
        id: 'supabase-jwt',
        re: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
        clasificar: (m) => {
            const rol = decodificarPayloadJwt(m[0])?.['role'];
            if (rol === 'service_role')
                return { clase: 'secreto', patron: 'supabase-service-role' };
            if (rol === 'anon')
                return { clase: 'publica', patron: 'supabase-anon' };
            return null;
        },
    },
    { id: 'clave-privada', re: /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY(?: BLOCK)?-----/g },
    {
        id: 'url-con-credenciales',
        re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@'"`]+:([^\s@/'"`]{8,})@([^\s/:'"`]+)/gi,
        clasificar: (m) => {
            const contrasena = m[1] ?? '';
            const host = m[2] ?? '';
            if (CONTRASENA_MARCADOR.test(contrasena) || HOST_LOCAL.test(host))
                return null;
            return { clase: 'secreto' };
        },
    },
];
/** Los ids de patron que existen (para documentar y para validar silencios). */
export const IDS_PATRON = [
    ...PATRONES.map((p) => p.id),
    'supabase-service-role',
    'supabase-anon',
];
/** Huella del valor: 12 caracteres hex de su SHA-256. */
export function huellaDe(valor) {
    return createHash('sha256').update(valor).digest('hex').slice(0, 12);
}
/** Valor enmascarado: 4 caracteres como mucho + la longitud. Nunca el crudo. */
export function enmascarar(valor) {
    const visibles = Math.min(4, Math.floor(valor.length / 4));
    return `${valor.slice(0, visibles)}**** (${valor.length} caracteres)`;
}
/** Linea (1-based) de la posicion `indice` en `texto`, contando desde `desde`. */
function lineaDe(texto, indice, desde) {
    let linea = desde.linea;
    for (let i = desde.indice; i < indice; i++) {
        if (texto.charCodeAt(i) === 10)
            linea++;
    }
    desde.indice = indice;
    desde.linea = linea;
    return linea;
}
/**
 * Todos los hallazgos de `texto`, de cualquier clase, en orden de aparicion.
 * El valor crudo no se devuelve.
 */
export function buscarSecretos(texto) {
    const encontrados = [];
    for (const p of PATRONES) {
        const re = new RegExp(p.re.source, p.re.flags);
        let m;
        while ((m = re.exec(texto)) !== null) {
            if (m[0] === '') {
                re.lastIndex++;
                continue;
            }
            const c = p.clasificar === undefined ? { clase: 'secreto' } : p.clasificar(m);
            if (c === null)
                continue;
            encontrados.push({
                indice: m.index,
                h: { patron: c.patron ?? p.id, clase: c.clase, muestra: enmascarar(m[0]), huella: huellaDe(m[0]) },
            });
        }
    }
    encontrados.sort((a, b) => a.indice - b.indice);
    const cursor = { indice: 0, linea: 1 };
    return encontrados.map((e) => ({ ...e.h, linea: lineaDe(texto, e.indice, cursor) }));
}
/**
 * Segunda red: sustituye por su version enmascarada todo lo que case con un
 * patron de clave (de cualquier clase) en un texto que va a salir. Se aplica
 * en el unico punto de salida del comando, para stdout, JSON, informe y
 * stderr.
 */
export function ocultarSecretos(texto) {
    let t = texto;
    for (const p of PATRONES) {
        const re = new RegExp(p.re.source, p.re.flags);
        t = t.replace(re, (m) => {
            if (p.id === 'url-con-credenciales') {
                // Solo la contrasena: `esquema://usuario:****@host`.
                return m.replace(/:\/\/([^\s:/@'"`]+):[^\s@/'"`]+@/, '://$1:****@');
            }
            return enmascarar(m);
        });
    }
    return t;
}
