/**
 * Detectores puros de las sondas de configuracion de `taskctl doctor-deploy`
 * (TASK-068, puntos 37 a 43 del catalogo). No tocan disco: reciben el CONJUNTO
 * de ficheros ya leidos (ruta + contenido) y devuelven hallazgos. La lectura,
 * los silencios y el estado del punto los pone `fs/sondas-deploy-config.ts`.
 *
 * Por que el conjunto y no fichero a fichero: el RLS de una tabla puede
 * activarse en una migracion posterior a la que la crea.
 *
 * Reglas comunes:
 * - Sin parser externo (cero dependencias): YAML, Dockerfile, SQL y reglas de
 *   Firebase se leen linea a linea o con expresiones acotadas. Lo que se escapa
 *   esta escrito en cada detector.
 * - El valor de un secreto (contrasena del compose, token de .npmrc...) NUNCA
 *   va en `descripcion`: solo enmascarado en `muestra` (la misma mascara que
 *   `buscarSecretos`).
 * - `huella` identifica el hallazgo para silenciarlo. En los secretos se
 *   calcula sobre la CLAVE (nombre de la variable), nunca sobre el valor: una
 *   contrasena debil se confirmaria con un diccionario. `null` = hallazgo por
 *   fichero (se silencia con patron + fichero).
 * - CRLF: todo se normaliza a `\n` antes de mirar.
 */
import { buscarSecretos, enmascarar, huellaDe } from './secretos.js';
/** Ids de patron de los hallazgos de estos detectores (para silenciar). */
export const PATRON = {
    firebase: 'firebase-regla-abierta',
    rls: 'tabla-sin-rls',
    token: 'token-gestor',
    compose: 'compose-contrasena',
    prTarget: 'pr-target-checkout',
    accion: 'accion-sin-sha',
    sinUser: 'dockerfile-sin-user',
    addUrl: 'dockerfile-add-url',
};
/** Patrones cuyo hallazgo es del fichero entero (sin huella): se silencian con patron + fichero. */
export const PATRONES_REGLAS_SIN_HUELLA = [PATRON.prTarget, PATRON.sinUser];
// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
const normalizar = (t) => t.replace(/\r\n?/g, '\n');
/** Linea (1-based) de la posicion `indice`. */
function lineaDe(texto, indice) {
    let n = 1;
    for (let i = 0; i < indice && i < texto.length; i++)
        if (texto.charCodeAt(i) === 10)
            n++;
    return n;
}
/** Sustituye por espacios todo menos los saltos de linea: conserva posiciones y lineas. */
const blanquear = (s) => s.replace(/[^\n]/g, ' ');
const nombreBase = (ruta) => ruta.slice(ruta.lastIndexOf('/') + 1);
/** Quita comentarios `//` y `/* *\/` respetando las cadenas ('...' y "..."). */
export function sinComentariosC(t) {
    let out = '';
    let i = 0;
    while (i < t.length) {
        const c = t[i];
        const d = t[i + 1];
        if (c === '"' || c === "'") {
            let j = i + 1;
            while (j < t.length && t[j] !== c && t[j] !== '\n')
                j += t[j] === '\\' ? 2 : 1;
            out += t.slice(i, j + 1);
            i = j + 1;
            continue;
        }
        if (c === '/' && d === '/') {
            let j = t.indexOf('\n', i);
            if (j === -1)
                j = t.length;
            out += blanquear(t.slice(i, j));
            i = j;
            continue;
        }
        if (c === '/' && d === '*') {
            const fin = t.indexOf('*/', i + 2);
            const j = fin === -1 ? t.length : fin + 2;
            out += blanquear(t.slice(i, j));
            i = j;
            continue;
        }
        out += c;
        i++;
    }
    return out;
}
/** Comentario YAML fuera de comillas: `#` al principio o tras un espacio. Aproximado (sin parser). */
function sinComentarioYaml(linea) {
    let comilla = null;
    for (let i = 0; i < linea.length; i++) {
        const c = linea[i];
        if (comilla !== null) {
            if (c === comilla)
                comilla = null;
            continue;
        }
        if (c === '"' || c === "'")
            comilla = c;
        else if (c === '#' && (i === 0 || /\s/.test(linea[i - 1])))
            return linea.slice(0, i);
    }
    return linea;
}
/** Quita comillas envolventes de un valor. */
function sinComillas(v) {
    const t = v.trim();
    if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))))
        return t.slice(1, -1);
    return t;
}
/** Si otra sonda (secretos-arbol) ya caza este valor como secreto, su patron. */
function cubiertoPorSecretosArbol(valor) {
    const h = buscarSecretos(valor).find((x) => x.clase === 'secreto');
    return h === undefined ? undefined : `secretos-arbol (patron ${h.patron})`;
}
// ---------------------------------------------------------------------
// 37 reglas-firebase-abiertas
// ---------------------------------------------------------------------
/** Quita parentesis que envuelven TODA la expresion. */
function quitarParentesis(c) {
    let t = c;
    for (;;) {
        if (!t.startsWith('(') || !t.endsWith(')'))
            return t;
        let prof = 0;
        let envuelve = true;
        for (let i = 0; i < t.length; i++) {
            if (t[i] === '(')
                prof++;
            else if (t[i] === ')')
                prof--;
            if (prof === 0 && i < t.length - 1) {
                envuelve = false;
                break;
            }
        }
        if (!envuelve)
            return t;
        t = t.slice(1, -1);
    }
}
/**
 * Por que una condicion de `allow` deja la regla abierta a cualquiera; null si no la deja.
 * Sin condicion, `if true` (tambien `true || ...`) y el modo de prueba
 * `request.time < timestamp.date(...)` (abierta a todos hasta esa fecha).
 */
export function condicionAbierta(cond) {
    if (cond === undefined)
        return 'sin condicion';
    const c = quitarParentesis(cond.replace(/\s+/g, ''));
    if (c === '')
        return 'sin condicion';
    if (c.split('||').some((p) => quitarParentesis(p) === 'true'))
        return 'if true';
    if (/^request\.time<timestamp\.date\(\d+,\d+,\d+\)$/.test(c))
        return 'abierta a todos hasta una fecha (modo de prueba)';
    return null;
}
const RE_FIRESTORE = /\bmatch\s+(\S+)\s*\{|\ballow\s+([A-Za-z]+(?:\s*,\s*[A-Za-z]+)*)\s*(?::\s*if\b([^;}]*))?\s*(?:;|(?=\}))|\{|\}/g;
function detectarReglasFirestore(f) {
    const original = normalizar(f.contenido);
    const t = sinComentariosC(original);
    const pila = [];
    const res = [];
    const re = new RegExp(RE_FIRESTORE.source, 'g');
    let m;
    while ((m = re.exec(t)) !== null) {
        if (m[1] !== undefined)
            pila.push(m[1]);
        else if (m[2] !== undefined) {
            const motivo = condicionAbierta(m[3]);
            if (motivo === null)
                continue;
            const ops = m[2].split(',').map((o) => o.trim()).filter((o) => o !== '').join(', ');
            const ruta = pila.filter((x) => x !== null).join('') || '(raiz)';
            res.push({
                patron: PATRON.firebase,
                fichero: f.ruta,
                linea: lineaDe(t, m.index),
                descripcion: `regla abierta a cualquiera (${motivo}): allow ${ops} en match ${ruta}`,
                huella: huellaDe(`${ruta}|${ops}|${(m[3] ?? '').replace(/\s+/g, '')}`),
            });
        }
        else if (m[0] === '{')
            pila.push(null);
        else if (m[0] === '}')
            pila.pop();
    }
    return res;
}
const RE_REALTIME = /"\.(read|write)"\s*:\s*(?:true\b|"\s*true\s*")/g;
/** Rutas (`/usuarios/$uid`) y operacion de cada `.read`/`.write` a true, en orden del texto. */
function rutasAbiertasRealtime(o, ruta, res) {
    if (typeof o !== 'object' || o === null || Array.isArray(o))
        return;
    for (const [k, v] of Object.entries(o)) {
        if (k === '.read' || k === '.write') {
            if (v === true || (typeof v === 'string' && v.trim() === 'true'))
                res.push({ ruta: ruta || '/', op: k.slice(1) });
        }
        else {
            rutasAbiertasRealtime(v, k === 'rules' && ruta === '' ? '' : `${ruta}/${k}`, res);
        }
    }
}
function detectarReglasRealtime(f) {
    const t = sinComentariosC(normalizar(f.contenido));
    const apariciones = [];
    const re = new RegExp(RE_REALTIME.source, 'g');
    let m;
    while ((m = re.exec(t)) !== null)
        apariciones.push({ op: m[1], linea: lineaDe(t, m.index) });
    let rutas = [];
    try {
        rutasAbiertasRealtime(JSON.parse(t), '', rutas);
    }
    catch {
        rutas = null; // no es JSON valido: se queda con lo que vio el texto
    }
    const casan = rutas !== null && rutas.length === apariciones.length && rutas.every((r, i) => r.op === apariciones[i]?.op);
    return apariciones.map((a, i) => {
        const ruta = casan && rutas !== null ? rutas[i].ruta : `(aparicion ${i + 1})`;
        return {
            patron: PATRON.firebase,
            fichero: f.ruta,
            linea: a.linea,
            descripcion: `regla abierta a cualquiera: ".${a.op}": true en ${ruta}`,
            huella: huellaDe(`${ruta}|${a.op}`),
        };
    });
}
/** Reglas de Firestore/Storage (`*.rules`) y de Realtime Database (`*.rules.json`). */
export const detectarFirebaseAbierto = (ficheros) => ficheros.flatMap((f) => (f.ruta.toLowerCase().endsWith('.json') ? detectarReglasRealtime(f) : detectarReglasFirestore(f)));
// ---------------------------------------------------------------------
// 38 migraciones-sin-rls
// ---------------------------------------------------------------------
/** Esquemas internos de Supabase/PostgreSQL o privados por convencion: no se exponen por la API. */
const ESQUEMAS_NO_EXPUESTOS = new Set([
    'auth',
    'storage',
    'extensions',
    'realtime',
    'vault',
    'graphql',
    'graphql_public',
    'supabase_functions',
    'supabase_migrations',
    'net',
    'cron',
    'pgsodium',
    'pgsodium_masks',
    'information_schema',
    'private',
    'internal',
]);
/** Quita comentarios SQL y vacia cadenas ('...') y cuerpos $$...$$, respetando "identificadores". */
export function sinComentariosSql(t) {
    let out = '';
    let i = 0;
    while (i < t.length) {
        const c = t[i];
        if (c === '-' && t[i + 1] === '-') {
            let j = t.indexOf('\n', i);
            if (j === -1)
                j = t.length;
            out += blanquear(t.slice(i, j));
            i = j;
        }
        else if (c === '/' && t[i + 1] === '*') {
            const fin = t.indexOf('*/', i + 2);
            const j = fin === -1 ? t.length : fin + 2;
            out += blanquear(t.slice(i, j));
            i = j;
        }
        else if (c === "'") {
            let j = i + 1;
            while (j < t.length) {
                if (t[j] === "'" && t[j + 1] === "'")
                    j += 2;
                else if (t[j] === "'")
                    break;
                else
                    j++;
            }
            out += blanquear(t.slice(i, j + 1));
            i = j + 1;
        }
        else if (c === '$') {
            const m = /^\$([A-Za-z_]\w*)?\$/.exec(t.slice(i, i + 64));
            if (m === null) {
                out += c;
                i++;
                continue;
            }
            const fin = t.indexOf(m[0], i + m[0].length);
            const j = fin === -1 ? t.length : fin + m[0].length;
            out += blanquear(t.slice(i, j));
            i = j;
        }
        else if (c === '"') {
            let j = i + 1;
            while (j < t.length) {
                if (t[j] === '"' && t[j + 1] === '"')
                    j += 2;
                else if (t[j] === '"')
                    break;
                else
                    j++;
            }
            out += t.slice(i, j + 1);
            i = j + 1;
        }
        else {
            out += c;
            i++;
        }
    }
    return out;
}
const ID_SQL = '(?:"(?:[^"]|"")+"|[A-Za-z_][\\w$]*)';
const NOMBRE_SQL = `${ID_SQL}(?:\\s*\\.\\s*${ID_SQL})?`;
const RE_PARTE_ID = /"((?:[^"]|"")+)"|([A-Za-z_][\w$]*)/g;
/** `public."Users"` -> `{esquema: 'public', tabla: 'Users'}`; sin comillas, en minusculas; sin esquema, `public`. */
export function nombreTablaSql(crudo) {
    const partes = [];
    for (const m of crudo.matchAll(new RegExp(RE_PARTE_ID.source, 'g'))) {
        partes.push(m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2].toLowerCase());
    }
    if (partes.length >= 2)
        return { esquema: partes[0], tabla: partes[1] };
    return { esquema: 'public', tabla: partes[0] ?? '' };
}
function idSql(crudo) {
    const m = new RegExp(`^${ID_SQL}$`).exec(crudo.trim());
    if (m === null)
        return crudo.trim().toLowerCase();
    const t = m[0];
    return t.startsWith('"') ? t.slice(1, -1).replace(/""/g, '"') : t.toLowerCase();
}
function eventosSql(t) {
    const ev = [];
    const reCreate = new RegExp(`\\bcreate\\s+(?:(?:global|local)\\s+)?((?:temporary|temp)\\s+)?(?:unlogged\\s+)?table\\s+(?:if\\s+not\\s+exists\\s+)?(${NOMBRE_SQL})`, 'gi');
    for (const m of t.matchAll(reCreate)) {
        if (m[1] !== undefined)
            continue; // temporal: no se expone
        ev.push({ indice: m.index ?? 0, tipo: 'create', nombre: m[2] });
    }
    const reAlter = new RegExp(`\\balter\\s+table\\s+(?:if\\s+exists\\s+)?(?:only\\s+)?(${NOMBRE_SQL})\\s*\\*?([^;]*)`, 'gi');
    for (const m of t.matchAll(reAlter))
        ev.push({ indice: m.index ?? 0, tipo: 'alter', nombre: m[1], cuerpo: m[2] });
    const reDrop = new RegExp(`\\bdrop\\s+table\\s+(?:if\\s+exists\\s+)?(${NOMBRE_SQL}(?:\\s*,\\s*${NOMBRE_SQL})*)`, 'gi');
    for (const m of t.matchAll(reDrop)) {
        const nombres = [...m[1].matchAll(new RegExp(NOMBRE_SQL, 'g'))].map((x) => x[0]);
        ev.push({ indice: m.index ?? 0, tipo: 'drop', nombres });
    }
    return ev.sort((a, b) => a.indice - b.indice);
}
/**
 * Tablas creadas en las migraciones de Supabase que no tienen RLS activado en NINGUNA
 * migracion del conjunto. Se recorren en orden de nombre (las migraciones llevan la
 * fecha delante): `create` la anade, `alter ... enable/disable row level security` la
 * marca, `rename to` y `set schema` la mueven, `drop` la quita.
 */
export const detectarTablasSinRls = (ficheros) => {
    const tablas = new Map();
    const clave = (n) => `${n.esquema}\u0000${n.tabla}`;
    const ordenados = [...ficheros].sort((a, b) => (a.ruta < b.ruta ? -1 : a.ruta > b.ruta ? 1 : 0));
    for (const f of ordenados) {
        const t = sinComentariosSql(normalizar(f.contenido));
        for (const e of eventosSql(t)) {
            if (e.tipo === 'create') {
                const n = nombreTablaSql(e.nombre);
                if (!tablas.has(clave(n))) {
                    tablas.set(clave(n), { rls: false, fichero: f.ruta, linea: lineaDe(t, e.indice), mostrar: `${n.esquema}.${n.tabla}`, esquema: n.esquema });
                }
            }
            else if (e.tipo === 'drop') {
                for (const x of e.nombres)
                    tablas.delete(clave(nombreTablaSql(x)));
            }
            else {
                const n = nombreTablaSql(e.nombre);
                const actual = tablas.get(clave(n));
                if (actual === undefined)
                    continue;
                if (/\benable\s+row\s+level\s+security\b/i.test(e.cuerpo))
                    actual.rls = true;
                if (/\bdisable\s+row\s+level\s+security\b/i.test(e.cuerpo))
                    actual.rls = false;
                const ren = new RegExp(`\\brename\\s+to\\s+(${ID_SQL})`, 'i').exec(e.cuerpo);
                const esq = new RegExp(`\\bset\\s+schema\\s+(${ID_SQL})`, 'i').exec(e.cuerpo);
                if (ren !== null || esq !== null) {
                    const nuevo = { esquema: esq !== null ? idSql(esq[1]) : n.esquema, tabla: ren !== null ? idSql(ren[1]) : n.tabla };
                    tablas.delete(clave(n));
                    tablas.set(clave(nuevo), { ...actual, mostrar: `${nuevo.esquema}.${nuevo.tabla}`, esquema: nuevo.esquema });
                }
            }
        }
    }
    const res = [];
    for (const [k, v] of tablas) {
        if (v.rls || ESQUEMAS_NO_EXPUESTOS.has(v.esquema) || v.esquema.startsWith('pg_'))
            continue;
        res.push({
            patron: PATRON.rls,
            fichero: v.fichero,
            linea: v.linea,
            descripcion: `la tabla ${v.mostrar} se crea sin activar RLS en ninguna migracion (alter table ... enable row level security)`,
            huella: huellaDe(k),
        });
    }
    return res;
};
// ---------------------------------------------------------------------
// 39 tokens-en-ficheros-de-gestor
// ---------------------------------------------------------------------
function hallazgoToken(f, linea, clave, valor) {
    const h = {
        patron: PATRON.token,
        fichero: f.ruta,
        linea,
        descripcion: `credencial literal en ${nombreBase(f.ruta)} (clave ${clave})`,
        muestra: enmascarar(valor),
        huella: huellaDe(`${PATRON.token}|${clave}`),
    };
    const cubierto = cubiertoPorSecretosArbol(valor);
    if (cubierto !== undefined)
        h.cubiertoPor = cubierto;
    return h;
}
/** Un valor es interpolado (no literal) si lleva `${...}` o `%(...)`. */
const esInterpolado = (v) => v.includes('${') || v.includes('%(');
function tokensNpmrc(f) {
    const res = [];
    normalizar(f.contenido)
        .split('\n')
        .forEach((l, i) => {
        if (/^\s*[#;]/.test(l))
            return;
        const m = /^\s*([^=\s][^=]*?)\s*=\s*(.*?)\s*$/.exec(l);
        if (m === null)
            return;
        const clave = m[1];
        if (!/(?:^|:)_(?:authtoken|auth|password)$/i.test(clave))
            return;
        const valor = sinComillas(m[2]);
        if (valor === '' || esInterpolado(valor))
            return;
        res.push(hallazgoToken(f, i + 1, clave, valor));
    });
    return res;
}
function tokensPypirc(f) {
    const res = [];
    let seccion = '';
    normalizar(f.contenido)
        .split('\n')
        .forEach((l, i) => {
        if (/^\s*[#;]/.test(l))
            return;
        const s = /^\s*\[([^\]]+)\]/.exec(l);
        if (s !== null) {
            seccion = s[1].trim();
            return;
        }
        const m = /^\s*(password)\s*[=:]\s*(.*?)\s*$/i.exec(l);
        if (m === null)
            return;
        const valor = sinComillas(m[2]);
        if (valor === '' || esInterpolado(valor))
            return;
        res.push(hallazgoToken(f, i + 1, `[${seccion}] password`, valor));
    });
    return res;
}
function tokensSettingsXml(f) {
    const t = normalizar(f.contenido).replace(/<!--[\s\S]*?-->/g, blanquear);
    if (!/<settings\b/.test(t))
        return []; // un settings.xml que no es de Maven
    const res = [];
    for (const m of t.matchAll(/<(password|passphrase)>([\s\S]*?)<\/\1>/gi)) {
        const valor = m[2].trim();
        // `${env.X}` no es literal; `{...}` es una contrasena cifrada con la maestra de Maven.
        if (valor === '' || esInterpolado(valor) || /^\{[^}]*\}$/.test(valor))
            continue;
        const indice = m.index ?? 0;
        const inicioServer = t.lastIndexOf('<server>', indice);
        const finServer = t.lastIndexOf('</server>', indice);
        let donde = '';
        if (inicioServer !== -1 && inicioServer > finServer) {
            const id = /<id>\s*([^<]*?)\s*<\/id>/.exec(t.slice(inicioServer, indice));
            donde = id !== null ? `server ${id[1]} ` : 'server ';
        }
        res.push(hallazgoToken(f, lineaDe(t, indice), `${donde}<${m[1].toLowerCase()}>`, valor));
    }
    return res;
}
/**
 * Credenciales literales en `.npmrc` (`_authToken`, `_auth`, `_password`, con o sin
 * registro delante), `.pypirc` (`password`) y `settings.xml` de Maven (`<password>`,
 * `<passphrase>`). No cuentan `${NPM_TOKEN}`, `${env.X}`, `%(x)s` ni las cifradas `{...}`.
 */
export const detectarTokensGestor = (ficheros) => ficheros.flatMap((f) => {
    const base = nombreBase(f.ruta);
    if (base === '.npmrc')
        return tokensNpmrc(f);
    if (base === '.pypirc')
        return tokensPypirc(f);
    if (base === 'settings.xml')
        return tokensSettingsXml(f);
    return [];
});
// ---------------------------------------------------------------------
// 40 compose-con-contrasenas
// ---------------------------------------------------------------------
const CLAVE_SECRETA = /(?:^|_)(?:password|passwd|pass|pwd|secret|token|api_?key|access_?key|private_?key)$/i;
const CLAVE_NO_SECRETA = /allow_empty|random_root|_file$/i;
const VALOR_NO_CONTRASENA = /^(?:true|false|yes|no|on|off|null|~|<[^>]*>|\*+)$/i;
/** El valor de una clave del compose, si es una contrasena literal; null si no lo es. */
export function contrasenaLiteralCompose(clave, crudo) {
    if (!CLAVE_SECRETA.test(clave) || CLAVE_NO_SECRETA.test(clave))
        return null;
    const t = crudo.trim();
    // Bloques (| >), anclas y alias (& *), y mapas o listas en linea: no se leen.
    if (t === '' || /^[|>&*{[]/.test(t))
        return null;
    const v = sinComillas(t);
    if (v === '' || v.includes('$') || VALOR_NO_CONTRASENA.test(v))
        return null;
    return v;
}
/**
 * Contrasenas y tokens literales en `docker-compose*.yml` / `compose*.yaml`: en forma
 * de mapa (`POSTGRES_PASSWORD: x`) y de lista (`- POSTGRES_PASSWORD=x`). No cuentan
 * `${X}`, `$X`, las claves `*_FILE` (secretos de Docker) ni los valores booleanos.
 */
export const detectarContrasenasCompose = (ficheros) => ficheros.flatMap((f) => {
    const res = [];
    normalizar(f.contenido)
        .split('\n')
        .forEach((bruta, i) => {
        if (/^\s*#/.test(bruta))
            return;
        const l = sinComentarioYaml(bruta);
        let clave;
        let crudo;
        const lista = /^\s*-\s*(["']?)([A-Za-z_][A-Za-z0-9_.-]*)=(.*?)\1\s*$/.exec(l);
        if (lista !== null) {
            clave = lista[2];
            crudo = lista[3];
        }
        else {
            const mapa = /^\s*(?:-\s*)?["']?([A-Za-z_][A-Za-z0-9_.-]*)["']?\s*:(?:\s+(.*)|\s*)$/.exec(l);
            if (mapa !== null) {
                clave = mapa[1];
                crudo = mapa[2] ?? '';
            }
        }
        if (clave === undefined || crudo === undefined)
            return;
        const valor = contrasenaLiteralCompose(clave, crudo);
        if (valor === null)
            return;
        const h = {
            patron: PATRON.compose,
            fichero: f.ruta,
            linea: i + 1,
            descripcion: `contrasena o token literal en la variable ${clave}`,
            muestra: enmascarar(valor),
            huella: huellaDe(`${PATRON.compose}|${clave}`),
        };
        const cubierto = cubiertoPorSecretosArbol(valor);
        if (cubierto !== undefined)
            h.cubiertoPor = cubierto;
        res.push(h);
    });
    return res;
});
// ---------------------------------------------------------------------
// 41 ci-pull-request-target
// ---------------------------------------------------------------------
const RE_EVENTO_PR_TARGET = /(?:^|[\s[,{'"])pull_request_target(?=$|[\s\]:,}'"])/m;
const RE_CODIGO_PR = /github\.event\.pull_request\.head\.(?:sha|ref|repo)|github\.head_ref|refs\/pull\/|github\.event\.pull_request\.merge_commit_sha|github\.event\.pull_request\.number|github\.event\.number/;
/** true si el flujo se dispara con `pull_request_target` (bloque, escalar o lista en linea `[...]`). */
export function usaPullRequestTarget(contenido) {
    const t = normalizar(contenido).split('\n').map(sinComentarioYaml).join('\n');
    return RE_EVENTO_PR_TARGET.test(t);
}
/**
 * Flujos con `pull_request_target` que traen el codigo del PR: `ref:` con
 * `github.event.pull_request.head.sha|ref`, `github.head_ref` o `refs/pull/...`, o un
 * `gh pr checkout` / `git fetch|checkout ... pull/...` en un `run`.
 */
export const detectarPullRequestTarget = (ficheros) => ficheros.flatMap((f) => {
    if (!usaPullRequestTarget(f.contenido))
        return [];
    const res = [];
    normalizar(f.contenido)
        .split('\n')
        .forEach((bruta, i) => {
        const l = sinComentarioYaml(bruta);
        let que = null;
        const expr = RE_CODIGO_PR.exec(l);
        if (/^\s*(?:-\s*)?ref\s*:/.test(l) && expr !== null)
            que = `ref: ${expr[0]}`;
        else if (/\bgh\s+pr\s+checkout\b/.test(l))
            que = 'gh pr checkout';
        else if (/\bgit\s+(?:fetch|checkout|pull)\b/.test(l) && (expr !== null || /\bpull\/\S+/.test(l)))
            que = 'git fetch/checkout del PR';
        if (que === null)
            return;
        res.push({
            patron: PATRON.prTarget,
            fichero: f.ruta,
            linea: i + 1,
            descripcion: `el flujo se dispara con pull_request_target y trae el codigo del PR (${que}): ejecuta codigo ajeno con secretos y permisos de escritura`,
            huella: null,
        });
    });
    return res;
});
// ---------------------------------------------------------------------
// 42 acciones-ci-sin-sha
// ---------------------------------------------------------------------
/** Organizaciones de GitHub: sus acciones no se cuentan como de terceros. */
const ORGANIZACIONES_PROPIAS = new Set(['actions', 'github']);
/**
 * Que le pasa a un `uses:`: null si esta bien o no es de terceros (local `./`,
 * `docker://`, `actions/*`, `github/*`, fijada a un SHA de 40 hex), o la razon.
 */
export function problemaUses(ref) {
    if (ref.startsWith('./') || ref.startsWith('../') || ref.startsWith('docker://') || ref.includes('${{'))
        return null;
    const propietario = (ref.split('/')[0] ?? '').toLowerCase();
    if (ORGANIZACIONES_PROPIAS.has(propietario))
        return null;
    const arroba = ref.lastIndexOf('@');
    if (arroba === -1)
        return 'sin version: usa la rama por defecto';
    const version = ref.slice(arroba + 1);
    if (/^[0-9a-f]{40}$/i.test(version))
        return null;
    return `fijada a "${version}" (etiqueta o rama movil), no a un SHA de 40 caracteres`;
}
export const detectarAccionesSinSha = (ficheros) => ficheros.flatMap((f) => {
    const res = [];
    normalizar(f.contenido)
        .split('\n')
        .forEach((bruta, i) => {
        const m = /^\s*(?:-\s*)?uses\s*:\s*["']?([^\s"'#]+)/.exec(sinComentarioYaml(bruta));
        if (m === null)
            return;
        const ref = m[1];
        const problema = problemaUses(ref);
        if (problema === null)
            return;
        res.push({
            patron: PATRON.accion,
            fichero: f.ruta,
            linea: i + 1,
            descripcion: `accion de terceros ${ref} ${problema}`,
            huella: huellaDe(ref),
        });
    });
    return res;
});
/**
 * Instrucciones de un Dockerfile: une las lineas con `\` (o el caracter de la
 * directiva `# escape=`) al final, salta comentarios (tambien dentro de una
 * continuacion) y los cuerpos de los heredoc (`RUN <<EOF`).
 */
export function instruccionesDockerfile(contenido) {
    const lineas = normalizar(contenido).split('\n');
    let escape = '\\';
    for (const l of lineas) {
        const d = /^\s*#\s*([a-z]+)\s*=\s*(\S+)\s*$/i.exec(l);
        if (d === null)
            break; // las directivas solo valen al principio
        if (d[1].toLowerCase() === 'escape')
            escape = d[2][0] ?? '\\';
    }
    const res = [];
    let actual = '';
    let inicio = 0;
    let heredoc = null;
    for (let i = 0; i < lineas.length; i++) {
        const l = lineas[i];
        if (heredoc !== null) {
            if (l.trim() === heredoc)
                heredoc = null;
            continue;
        }
        const recortada = l.trim();
        if (recortada.startsWith('#'))
            continue;
        if (actual === '' && recortada === '')
            continue;
        if (actual === '')
            inicio = i + 1;
        const sinFin = l.replace(/\s+$/, '');
        if (sinFin.endsWith(escape)) {
            actual += `${sinFin.slice(0, -1)} `;
            continue;
        }
        actual += l;
        const m = /^\s*([A-Za-z]+)\s*([\s\S]*)$/.exec(actual);
        if (m !== null) {
            res.push({ palabra: m[1].toUpperCase(), args: m[2].trim(), linea: inicio });
            const hd = /<<-?\s*["']?([A-Za-z_][\w]*)["']?/.exec(m[2]);
            if (hd !== null)
                heredoc = hd[1];
        }
        actual = '';
    }
    return res;
}
/** URL sin usuario, contrasena, query ni fragmento (puede llevar un token). */
function urlSegura(u) {
    try {
        const url = new URL(u);
        return `${url.protocol}//${url.host}${url.pathname}`;
    }
    catch {
        return 'URL';
    }
}
function argumentos(args) {
    if (args.startsWith('[')) {
        try {
            const v = JSON.parse(args);
            if (Array.isArray(v))
                return v.map(String);
        }
        catch {
            // forma de shell
        }
    }
    return args.split(/\s+/).filter((x) => x !== '');
}
const ES_ROOT = /^(?:root|0)(?::(?:root|0))?$/i;
/**
 * Dockerfile cuya ETAPA FINAL corre como root (sin USER, heredado de la etapa en que
 * se basa si es `FROM <alias>`, o `USER root|0`), salvo imagenes base `*nonroot*`
 * (distroless); y `ADD <url>` sin `--checksum`.
 */
export const detectarDockerfile = (ficheros) => ficheros.flatMap((f) => {
    const res = [];
    const etapas = [];
    for (const ins of instruccionesDockerfile(f.contenido)) {
        if (ins.palabra === 'FROM') {
            const t = argumentos(ins.args).filter((x) => !x.startsWith('--'));
            const alias = (t[1] ?? '').toLowerCase() === 'as' && t[2] !== undefined ? t[2].toLowerCase() : null;
            etapas.push({ imagen: t[0] ?? '', alias, usuario: null, linea: ins.linea });
        }
        else if (ins.palabra === 'USER') {
            const e = etapas[etapas.length - 1];
            if (e !== undefined)
                e.usuario = argumentos(ins.args)[0] ?? '';
        }
        else if (ins.palabra === 'ADD') {
            const t = argumentos(ins.args);
            if (t.some((x) => /^--checksum=/i.test(x)))
                continue;
            const fuentes = t.filter((x) => !x.startsWith('--')).slice(0, -1);
            for (const u of fuentes.filter((x) => /^https?:\/\//i.test(x))) {
                const segura = urlSegura(u);
                res.push({
                    patron: PATRON.addUrl,
                    fichero: f.ruta,
                    linea: ins.linea,
                    descripcion: `ADD descarga una URL remota (${segura}) sin --checksum: no se verifica lo que entra en la imagen`,
                    huella: huellaDe(segura),
                });
            }
        }
    }
    const final = etapas[etapas.length - 1];
    if (final === undefined) {
        res.push({ patron: PATRON.sinUser, fichero: f.ruta, descripcion: 'el Dockerfile no tiene ninguna instruccion FROM ni USER', huella: null });
        return res;
    }
    // USER efectivo de la etapa final: el suyo, o el de la etapa en que se basa (FROM <alias>).
    let e = final;
    let usuario = final.usuario;
    for (let saltos = 0; usuario === null && saltos < etapas.length; saltos++) {
        const anteriores = etapas.slice(0, etapas.indexOf(e)).reverse();
        const objetivo = e.imagen.toLowerCase();
        const base = anteriores.find((x) => x.alias !== null && x.alias === objetivo);
        if (base === undefined)
            break;
        e = base;
        usuario = base.usuario;
    }
    if (usuario === null) {
        if (!/nonroot/i.test(e.imagen)) {
            res.push({
                patron: PATRON.sinUser,
                fichero: f.ruta,
                linea: final.linea,
                descripcion: `la etapa final (FROM ${final.imagen}) no declara USER: el contenedor corre como root`,
                huella: null,
            });
        }
    }
    else if (ES_ROOT.test(usuario)) {
        res.push({
            patron: PATRON.sinUser,
            fichero: f.ruta,
            linea: final.linea,
            descripcion: `la etapa final (FROM ${final.imagen}) corre como USER ${usuario}`,
            huella: null,
        });
    }
    return res;
});
