/**
 * Las comprobaciones deterministas de `taskctl doctor-deploy` (TASK-066): las
 * unicas seis que existen. Todo punto del catalogo que no nombra una de estas
 * sondas es de juicio y sale NO VERIFICADO.
 *
 * Reglas que valen para todas:
 * - Solo leen. Nada se escribe ni se cambia de rama.
 * - Nunca OK sin evidencia. Si no se pudo mirar (herramienta ausente, historial
 *   truncado, desbordamiento, timeout, salida que no se entiende), el estado es
 *   NO VERIFICADO con lo que falta, no OK ni una excepcion.
 * - El valor de un secreto no sale de aqui: la evidencia lleva solo la muestra
 *   enmascarada (`buscarSecretos` ya no devuelve el valor crudo).
 * - Se excluyen node_modules, vendor, target, dist y build.
 */
import { closeSync, mkdtempSync, openSync, readFileSync, readSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buscarSecretos, IDS_PATRON } from '../core/secretos.js';
import { interpretarCargoAudit, interpretarDotnetVulnerable, interpretarGovulncheck, interpretarNpmAudit, interpretarPipAudit, interpretarYarnAudit, } from '../core/doctor-deploy-auditoria.js';
import { estaExcluido } from './deteccion-app.js';
import { gitCrudo, gitTexto } from './git-crudo.js';
import { ejecutarHerramienta, localizarHerramienta, versionDe } from './herramientas-deploy.js';
export const OPCIONES_SONDAS_POR_DEFECTO = {
    timeoutHerramientaMs: 120_000,
    timeoutHistorialMs: 180_000,
    maxBlobsHistorial: 200_000,
    maxBytesFichero: 1024 * 1024,
};
const MAX_HALLAZGOS = 200;
const MAX_BYTES_BINARIO = 8000;
// ---------------------------------------------------------------------
// Utilidades compartidas
// ---------------------------------------------------------------------
function esBinario(b) {
    const n = Math.min(b.length, MAX_BYTES_BINARIO);
    for (let i = 0; i < n; i++)
        if (b[i] === 0)
            return true;
    return false;
}
/**
 * Texto del contenido, o null si es binario. Un UTF-16 con BOM (el `>` de
 * PowerShell 5.1 lo escribe asi) lleva NUL pero es texto: se decodifica.
 */
function decodificar(b) {
    if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe)
        return b.subarray(2).toString('utf16le');
    if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
        const par = b.subarray(2, 2 + ((b.length - 2) & ~1));
        return Buffer.from(par).swap16().toString('utf16le');
    }
    if (esBinario(b))
        return null;
    return b.toString('utf8');
}
/** Los primeros bytes de un fichero (para decidir si es texto sin leerlo entero). */
function cabeceraDe(abs) {
    const fd = openSync(abs, 'r');
    try {
        const buf = Buffer.alloc(MAX_BYTES_BINARIO);
        const n = readSync(fd, buf, 0, buf.length, 0);
        return buf.subarray(0, n);
    }
    finally {
        closeSync(fd);
    }
}
/**
 * Un silencio es POR HALLAZGO: un hallazgo del historial exige un silencio con
 * `commit`; uno del arbol, un silencio sin commit y atado a la huella del valor
 * (el parser lo obliga). Asi no se tapa una clave nueva del mismo patron en el
 * mismo fichero.
 */
function buscarSilencio(ctx, patron, fichero, clave) {
    for (const s of ctx.silencios) {
        if (s.patron !== patron || s.fichero !== fichero)
            continue;
        if (clave.commit !== undefined) {
            if (s.commit === null || !clave.commit.startsWith(s.commit))
                continue;
        }
        else if (s.commit !== null) {
            continue;
        }
        if (s.huella !== null && (clave.huella === undefined || !clave.huella.startsWith(s.huella)))
            continue;
        ctx.silenciosUsados.add(s.numero);
        return s;
    }
    return null;
}
function evidenciaSilenciada(s, patron, fichero, linea, commit) {
    const e = {
        descripcion: `SILENCIADO (silenciar_${s.numero}, patron ${patron}): ${s.motivo} - ${s.quien}, ${s.fecha}`,
        fichero,
    };
    if (linea !== undefined)
        e.linea = linea;
    if (commit !== undefined)
        e.commit = commit;
    return e;
}
const nombreBase = (ruta) => ruta.slice(ruta.lastIndexOf('/') + 1);
const ARCHIVOS_DE_BLOQUEO = new Set([
    'package-lock.json',
    'npm-shrinkwrap.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'Cargo.lock',
    'poetry.lock',
    'Pipfile.lock',
    'composer.lock',
    'Gemfile.lock',
    'go.sum',
    'uv.lock',
]);
// ---------------------------------------------------------------------
// secretos-arbol
// ---------------------------------------------------------------------
export const sondaSecretosArbol = (ctx) => {
    const fallos = [];
    const silenciadas = [];
    let revisados = 0;
    let omitidosGrandes = 0;
    let binarios = 0;
    let publicas = 0;
    let ejemplos = 0;
    let cortado = false;
    for (const rel of ctx.paraEscanear) {
        if (ARCHIVOS_DE_BLOQUEO.has(nombreBase(rel)))
            continue;
        const abs = path.join(ctx.cwd, rel);
        let datos;
        try {
            const st = statSync(abs);
            if (!st.isFile())
                continue;
            if (st.size > ctx.opciones.maxBytesFichero) {
                // Grande: si es binario no hay nada que leer; si es texto, queda sin mirar y se dice.
                if (decodificar(cabeceraDe(abs)) === null)
                    binarios++;
                else
                    omitidosGrandes++;
                continue;
            }
            datos = readFileSync(abs);
        }
        catch {
            continue; // borrado o ilegible: no hay nada que escanear
        }
        const contenido = decodificar(datos);
        if (contenido === null) {
            binarios++;
            continue;
        }
        revisados++;
        for (const h of buscarSecretos(contenido)) {
            if (h.clase === 'publica')
                publicas++;
            else if (h.clase === 'ejemplo')
                ejemplos++;
            else {
                const s = buscarSilencio(ctx, h.patron, rel, { huella: h.huella });
                if (s !== null) {
                    silenciadas.push(evidenciaSilenciada(s, h.patron, rel, h.linea, undefined));
                }
                else if (fallos.length < MAX_HALLAZGOS) {
                    fallos.push({
                        descripcion: `clave secreta (patron ${h.patron}, huella ${h.huella})`,
                        fichero: rel,
                        linea: h.linea,
                        muestra: h.muestra,
                    });
                }
                else {
                    cortado = true;
                }
            }
        }
    }
    const versionadosEnCarpetasExcluidas = ctx.paraEscanear.filter((r) => estaExcluido(r)).length;
    const alcance = `${revisados} ficheros de texto revisados con ${IDS_PATRON.length} patrones de claves; ` +
        `${binarios} binarios saltados; ${omitidosGrandes} de texto mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB sin leer; ` +
        `${versionadosEnCarpetasExcluidas} versionados dentro de node_modules, vendor, target, dist o build incluidos ` +
        '(los que no estan versionados se excluyen); ' +
        `${silenciadas.length} hallazgos silenciados`;
    const notas = [];
    if (publicas + ejemplos > 0) {
        notas.push({
            descripcion: `${publicas} claves publicas a proposito (anon, publishable, apiKey web de Firebase) y ${ejemplos} de ejemplo o de prueba: no cuentan`,
        });
    }
    if (fallos.length > 0) {
        return {
            estado: 'falla',
            motivo: `${fallos.length}${cortado ? '+' : ''} clave(s) secreta(s) en los ficheros del proyecto`,
            evidencias: [...fallos, ...silenciadas, ...notas, { descripcion: alcance }],
        };
    }
    if (revisados === 0) {
        return {
            estado: 'no-verificado',
            motivo: 'no se encontro ningun fichero de texto que revisar (el proyecto esta vacio o todo esta excluido)',
            evidencias: [],
        };
    }
    if (omitidosGrandes > 0) {
        return {
            estado: 'no-verificado',
            motivo: `${omitidosGrandes} fichero(s) de texto mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB no se leyeron: ` +
                'no se puede afirmar que no tengan claves (un bundle puede llevarlas). Revisalos a mano o con gitleaks',
            evidencias: [{ descripcion: alcance }, ...silenciadas, ...notas],
        };
    }
    return {
        estado: 'ok',
        motivo: 'ninguna clave secreta en los ficheros del proyecto',
        evidencias: [{ descripcion: alcance }, ...silenciadas, ...notas],
    };
};
// ---------------------------------------------------------------------
// ficheros-secretos
// ---------------------------------------------------------------------
const SUFIJOS_DE_EJEMPLO = /\.(?:example|sample|template|dist|defaults?|vault)$/i;
/** Por que este nombre de fichero versionado es un fichero de secretos; null si no lo es. */
export function motivoFicheroSecreto(ruta) {
    const base = nombreBase(ruta).toLowerCase();
    if ((base === '.env' || base.startsWith('.env.')) && !SUFIJOS_DE_EJEMPLO.test(base))
        return 'fichero .env con variables de entorno';
    if (/^id_(?:rsa|dsa|ecdsa|ed25519)$/.test(base))
        return 'clave privada SSH';
    if (/\.(?:p12|pfx|jks|keystore)$/.test(base))
        return 'almacen de claves privadas';
    if (base === 'credentials.json' || base === '.htpasswd' || base === '.netrc' || base === '.pgpass')
        return 'fichero de credenciales';
    if (ruta.toLowerCase().endsWith('.aws/credentials'))
        return 'credenciales de AWS';
    return null;
}
export const sondaFicherosSecretos = (ctx) => {
    const fallos = [];
    const silenciadas = [];
    // git ls-files COMPLETO: comprobar un nombre no da falsos positivos, asi que no se excluye nada.
    for (const rel of ctx.versionadosTodos) {
        const motivo = motivoFicheroSecreto(rel);
        if (motivo === null)
            continue;
        const s = buscarSilencio(ctx, 'fichero-secreto', rel, {});
        if (s !== null)
            silenciadas.push(evidenciaSilenciada(s, 'fichero-secreto', rel, undefined, undefined));
        else
            fallos.push({ descripcion: `${motivo} versionado`, fichero: rel });
    }
    if (fallos.length > 0) {
        return {
            estado: 'falla',
            motivo: `${fallos.length} fichero(s) de secretos versionado(s)`,
            evidencias: [...fallos, ...silenciadas],
        };
    }
    if (ctx.versionadosTodos.length === 0) {
        return { estado: 'no-verificado', motivo: 'no hay ficheros versionados que revisar (git ls-files vacio)', evidencias: [] };
    }
    return {
        estado: 'ok',
        motivo: 'ningun fichero de secretos versionado',
        evidencias: [
            {
                descripcion: `${ctx.versionadosTodos.length} ficheros versionados revisados (git ls-files completo): ninguno es un .env, una clave privada ` +
                    `ni un fichero de credenciales (.env.example y .env.sample no cuentan); ${silenciadas.length} hallazgos silenciados`,
            },
            ...silenciadas,
        ],
    };
};
// ---------------------------------------------------------------------
// gitignore-env
// ---------------------------------------------------------------------
export const sondaGitignoreEnv = (ctx) => {
    const r = gitCrudo(['check-ignore', '-v', '--no-index', '.env'], ctx.cwd, { timeoutMs: 15_000 });
    if (r.error !== undefined || (r.status !== 0 && r.status !== 1)) {
        return {
            estado: 'no-verificado',
            motivo: `no se pudo ejecutar git check-ignore (${r.error?.message ?? `codigo ${String(r.status)}`})`,
            evidencias: [],
        };
    }
    if (r.status === 1) {
        return {
            estado: 'falla',
            motivo: 'el .gitignore no cubre .env',
            evidencias: [{ descripcion: 'git check-ignore --no-index .env: ninguna regla lo ignora', fichero: '.gitignore' }],
        };
    }
    // Salida: `<fuente>:<linea>:<patron>\t<ruta>`. Solo vale una regla que viaja con el repo.
    const m = /^(.*?):(\d+):(.*?)\t/.exec(r.stdout.toString('utf8').trim());
    // Git entrecomilla la ruta si lleva barras invertidas (un excludesFile global en Windows).
    const fuente = (m?.[1] ?? '').replace(/^"(.*)"$/, '$1').replace(/\\\\/g, '\\');
    if ((m?.[3] ?? '').startsWith('!')) {
        return {
            estado: 'falla',
            motivo: 'una regla negada deja .env sin ignorar',
            evidencias: [
                {
                    descripcion: `la regla "${m?.[3] ?? ''}" REINCLUYE .env: git check-ignore la devuelve aunque no lo ignora. Quitala, o .env se podra versionar`,
                    fichero: fuente,
                    linea: Number(m?.[2]),
                },
            ],
        };
    }
    const versionada = fuente !== '' &&
        !path.isAbsolute(fuente) &&
        !/^[A-Za-z]:/.test(fuente) &&
        !/(?:^|[\\/])\.git[\\/]/.test(fuente) &&
        /(?:^|[\\/])\.gitignore$/.test(fuente);
    if (!versionada) {
        return {
            estado: 'falla',
            motivo: 'solo lo cubre una regla local que no se versiona',
            evidencias: [
                {
                    descripcion: `la unica regla que ignora .env esta en "${fuente || 'desconocido'}" (excludesFile global o .git/info/exclude): no viaja con el repositorio`,
                },
            ],
        };
    }
    return {
        estado: 'ok',
        motivo: '.env esta cubierto por el .gitignore',
        evidencias: [
            { descripcion: `la regla "${m?.[3] ?? ''}" ignora .env (git check-ignore -v --no-index .env)`, fichero: fuente, linea: Number(m?.[2]) },
        ],
    };
};
// ---------------------------------------------------------------------
// lockfile
// ---------------------------------------------------------------------
const LOCKFILES = {
    node: ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock'],
    rust: ['Cargo.lock'],
    python: ['poetry.lock', 'Pipfile.lock', 'uv.lock', 'pdm.lock', 'pylock.toml', 'requirements.txt'],
    php: ['composer.lock'],
    ruby: ['Gemfile.lock'],
    go: ['go.sum'],
};
/** `.`, y cada carpeta padre hasta la raiz, de la mas cercana a la mas lejana. */
function carpetaYAncestros(dir) {
    if (dir === '.')
        return ['.'];
    const partes = dir.split('/');
    const res = [];
    for (let i = partes.length; i >= 1; i--)
        res.push(partes.slice(0, i).join('/'));
    res.push('.');
    return res;
}
const unir = (dir, nombre) => (dir === '.' ? nombre : `${dir}/${nombre}`);
/** Un requirements.txt solo hace de lockfile si fija TODAS sus dependencias con `==` (o `@` a una URL). */
export function requirementsFijado(contenido) {
    const lineas = contenido
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l !== '' && !l.startsWith('#') && !l.startsWith('-'));
    return lineas.length > 0 && lineas.every((l) => /==|\s@\s/.test(l));
}
export const sondaLockfile = (ctx) => {
    const versionados = new Set(ctx.versionados);
    const presentes = new Set(ctx.presentes);
    const ok = [];
    const fallos = [];
    let revisados = 0;
    for (const tipo of ctx.tipos) {
        const candidatos = LOCKFILES[tipo.id];
        if (candidatos === undefined)
            continue;
        for (const dir of tipo.rutas) {
            revisados++;
            const donde = carpetaYAncestros(dir);
            const hallado = donde
                .flatMap((d) => candidatos.map((c) => unir(d, c)))
                .find((r) => {
                if (!versionados.has(r))
                    return false;
                if (nombreBase(r) !== 'requirements.txt')
                    return true;
                try {
                    return requirementsFijado(readFileSync(path.join(ctx.cwd, r), 'utf8'));
                }
                catch {
                    return false;
                }
            });
            if (hallado !== undefined) {
                ok.push({ descripcion: `${tipo.nombre} en ${dir}: lockfile versionado`, fichero: hallado });
                continue;
            }
            const sinVersionar = donde.flatMap((d) => candidatos.map((c) => unir(d, c))).find((r) => presentes.has(r));
            fallos.push({
                descripcion: `${tipo.nombre} en ${dir}: no hay lockfile versionado (${candidatos.join(', ')}; un requirements.txt solo cuenta con todo fijado con ==)` +
                    (sinVersionar !== undefined ? `; existe ${sinVersionar} pero no esta versionado` : ''),
                fichero: unir(dir, candidatos[0]),
            });
        }
    }
    if (fallos.length > 0) {
        return { estado: 'falla', motivo: `${fallos.length} proyecto(s) sin lockfile versionado`, evidencias: [...fallos, ...ok] };
    }
    if (revisados === 0) {
        return { estado: 'no-verificado', motivo: 'no se detecto ningun proyecto con gestor de dependencias que revisar', evidencias: [] };
    }
    return { estado: 'ok', motivo: 'lockfile versionado en todos los proyectos', evidencias: ok };
};
const BYTES_POR_LOTE = 32 * 1024 * 1024;
function resumenRefs(ctx) {
    const t = gitTexto(['for-each-ref', '--format=%(refname)'], ctx.cwd, { timeoutMs: 30_000 });
    if (t === null)
        return null;
    const refs = t.split(/\r?\n/).filter((r) => r !== '');
    const cuenta = (p) => refs.filter((r) => r.startsWith(p)).length;
    const heads = cuenta('refs/heads/');
    const remotas = cuenta('refs/remotes/');
    const tags = cuenta('refs/tags/');
    const otras = refs.length - heads - remotas - tags;
    return (`${heads} rama(s) local(es), ${remotas} remota(s), ${tags} etiqueta(s)` +
        (otras > 0 ? `, ${otras} otra(s) ref(s) (stash, notas...)` : '') +
        ' - git rev-list --all');
}
/** Complemento opcional: si gitleaks esta instalado, lo suma. Nunca cambia un OK por un FALLA sin hallazgo. */
function complementoGitleaks(ctx) {
    const exe = localizarHerramienta('gitleaks', ctx.opciones.pathHerramientas);
    if (exe === null) {
        return { nota: { descripcion: 'gitleaks no esta instalado (opcional): el recorrido del historial usa solo los patrones propios' }, hallazgos: [] };
    }
    const version = versionDe(exe, ['version'], ctx.cwd, ctx.opciones.pathHerramientas);
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'taskctl-gitleaks-'));
    try {
        const informe = path.join(tmp, 'informe.json');
        const e = ejecutarHerramienta(exe, ['detect', '--source', ctx.cwd, '--redact', '--no-banner', '--exit-code', '2', '--report-format', 'json', '--report-path', informe], ctx.cwd, ctx.opciones.pathHerramientas, ctx.opciones.timeoutHerramientaMs);
        if (e.error !== null || (e.status !== 0 && e.status !== 2)) {
            return { nota: { descripcion: `gitleaks ${version} no se pudo usar (${e.timeout ? 'timeout' : `codigo ${String(e.status)}`}): sin su resultado` }, hallazgos: [] };
        }
        if (e.status === 0) {
            return { nota: { descripcion: `gitleaks ${version} (detect, historial completo): sin hallazgos` }, hallazgos: [] };
        }
        let lista;
        try {
            lista = JSON.parse(readFileSync(informe, 'utf8'));
        }
        catch {
            return { nota: { descripcion: `gitleaks ${version} detecto hallazgos pero su informe no se pudo leer: revisalo a mano` }, hallazgos: [] };
        }
        const hallazgos = (Array.isArray(lista) ? lista : [])
            .map((x) => {
            const o = typeof x === 'object' && x !== null ? x : {};
            return {
                ruta: String(o['File'] ?? '').replace(/\\/g, '/'),
                linea: Number(o['StartLine'] ?? 0),
                commit: String(o['Commit'] ?? ''),
                regla: String(o['RuleID'] ?? 'desconocida'),
            };
        })
            .filter((h) => h.ruta !== '');
        return { nota: { descripcion: `gitleaks ${version} (detect, historial completo): ${hallazgos.length} hallazgo(s)` }, hallazgos };
    }
    finally {
        rmSync(tmp, { recursive: true, force: true });
    }
}
/** Maximo de apariciones (commit + ruta) que se citan por blob con hallazgo. */
const MAX_APARICIONES_POR_BLOB = 10;
/**
 * Los commits y rutas en que un blob entro en el repositorio (de mas antiguo a
 * mas nuevo). `rev-list --objects` da cada blob UNA vez con una sola ruta; si el
 * mismo contenido esta en dos ficheros, o se reintrodujo, hay que preguntarle a
 * `git log --find-object` por cada aparicion. Solo se llama para los blobs con
 * hallazgo. null = no se pudo preguntar.
 */
function aparicionesDeBlob(ctx, sha) {
    const t = gitTexto(['-c', 'core.quotepath=false', 'log', '--all', '--no-renames', '--no-abbrev', '--raw', '--format=%H', `--find-object=${sha}`], ctx.cwd, {
        timeoutMs: 60_000,
    });
    if (t === null)
        return null;
    const apariciones = [];
    const vistas = new Set();
    let commit = '';
    for (const linea of t.split(/\r?\n/)) {
        if (/^[0-9a-f]{40}$/.test(linea)) {
            commit = linea;
            continue;
        }
        const m = /^:\d+ \d+ [0-9a-f]+ ([0-9a-f]{40}) [AM]\t(.+)$/.exec(linea);
        if (m === null || m[1] !== sha || commit === '')
            continue;
        const clave = `${commit}\0${m[2]}`;
        if (vistas.has(clave))
            continue;
        vistas.add(clave);
        apariciones.push({ commit, ruta: m[2] });
    }
    return apariciones.reverse();
}
export const sondaSecretosHistorial = (ctx) => {
    const sinVerificar = (motivo) => ({ estado: 'no-verificado', motivo, evidencias: [] });
    const cwd = ctx.cwd;
    if (gitTexto(['rev-parse', '--verify', '--quiet', 'HEAD'], cwd, { timeoutMs: 15_000 }) === null) {
        return {
            estado: 'ok',
            motivo: 'el repositorio no tiene commits: no hay historial que contenga secretos',
            evidencias: [{ descripcion: 'git rev-parse --verify HEAD: sin commits' }],
        };
    }
    const superficial = gitTexto(['rev-parse', '--is-shallow-repository'], cwd, { timeoutMs: 15_000 });
    if (superficial === null)
        return sinVerificar('no se pudo saber si el clon es superficial (git rev-parse --is-shallow-repository fallo)');
    if (superficial.trim() === 'true') {
        return sinVerificar('el clon es superficial: el historial esta truncado y los secretos antiguos no se pueden ver. Haz git fetch --unshallow y repite');
    }
    const refs = resumenRefs(ctx);
    if (refs === null)
        return sinVerificar('no se pudieron listar las referencias (git for-each-ref fallo)');
    const inicio = Date.now();
    const restante = () => ctx.opciones.timeoutHistorialMs - (Date.now() - inicio);
    // 1. Todos los objetos alcanzables desde cualquier ref.
    const objetos = gitCrudo(['rev-list', '--all', '--objects'], cwd, {
        maxBuffer: 512 * 1024 * 1024,
        timeoutMs: Math.max(1000, restante()),
    });
    if (objetos.error !== undefined || objetos.status !== 0) {
        return sinVerificar(`git rev-list --all --objects no termino (${objetos.error?.message ?? `codigo ${String(objetos.status)}`}): historial sin recorrer`);
    }
    const rutaDe = new Map();
    const shas = [];
    for (const linea of objetos.stdout.toString('utf8').split(/\r?\n/)) {
        if (linea === '')
            continue;
        const sp = linea.indexOf(' ');
        const sha = sp === -1 ? linea : linea.slice(0, sp);
        if (!/^[0-9a-f]{40}$/.test(sha))
            continue;
        shas.push(sha);
        if (sp !== -1 && sp < linea.length - 1)
            rutaDe.set(sha, linea.slice(sp + 1));
    }
    // 2. Tipo y tamano de cada objeto: solo los blobs de texto de tamano razonable.
    const tipos = gitCrudo(['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], cwd, {
        input: `${shas.join('\n')}\n`,
        maxBuffer: 512 * 1024 * 1024,
        timeoutMs: Math.max(1000, restante()),
    });
    if (tipos.error !== undefined || tipos.status !== 0) {
        return sinVerificar(`git cat-file --batch-check no termino (${tipos.error?.message ?? `codigo ${String(tipos.status)}`}): historial sin recorrer`);
    }
    const candidatos = [];
    let grandes = 0;
    let totalBlobs = 0;
    for (const linea of tipos.stdout.toString('utf8').split(/\r?\n/)) {
        const m = /^([0-9a-f]{40}) blob (\d+)$/.exec(linea);
        if (m === null)
            continue;
        totalBlobs++;
        const sha = m[1];
        const tam = Number(m[2]);
        // `rev-list --objects` da UNA ruta por blob (la primera que vio): no sirve para descartarlo,
        // porque el mismo contenido puede estar tambien en otra ruta. Se mira todo.
        const ruta = rutaDe.get(sha) ?? '';
        if (tam === 0)
            continue;
        if (tam > ctx.opciones.maxBytesFichero) {
            grandes++;
            continue;
        }
        candidatos.push({ sha, ruta, tam });
    }
    let cortado = null;
    let aEscanear = candidatos;
    if (candidatos.length > ctx.opciones.maxBlobsHistorial) {
        aEscanear = candidatos.slice(0, ctx.opciones.maxBlobsHistorial);
        cortado = `el historial tiene ${candidatos.length} ficheros distintos y el limite es ${ctx.opciones.maxBlobsHistorial}: se miraron ${aEscanear.length}`;
    }
    // 3. Contenido de los blobs, por lotes, buscando claves.
    const hallazgos = [];
    let binarios = 0;
    let escaneados = 0;
    for (let i = 0; i < aEscanear.length && cortado === null;) {
        if (restante() <= 0) {
            cortado = `se agoto el tiempo (${Math.round(ctx.opciones.timeoutHistorialMs / 1000)} s): se miraron ${escaneados} de ${aEscanear.length} ficheros`;
            break;
        }
        let bytes = 0;
        const lote = [];
        while (i < aEscanear.length && (lote.length === 0 || bytes + aEscanear[i].tam <= BYTES_POR_LOTE)) {
            const c = aEscanear[i];
            lote.push(c);
            bytes += c.tam;
            i++;
        }
        const r = gitCrudo(['cat-file', '--batch'], cwd, {
            input: `${lote.map((c) => c.sha).join('\n')}\n`,
            maxBuffer: bytes + lote.length * 128 + 1024 * 1024,
            timeoutMs: Math.max(1000, restante()),
        });
        if (r.error !== undefined || r.status !== 0) {
            cortado = `git cat-file --batch no termino (${r.error?.message ?? `codigo ${String(r.status)}`}): se miraron ${escaneados} de ${aEscanear.length} ficheros`;
            break;
        }
        // Formato: `<sha> blob <tam>\n<contenido>\n`, repetido.
        let pos = 0;
        const buf = r.stdout;
        for (const c of lote) {
            const finLinea = buf.indexOf(0x0a, pos);
            if (finLinea === -1)
                break;
            const cabecera = buf.toString('utf8', pos, finLinea);
            const m = /^([0-9a-f]{40}) blob (\d+)$/.exec(cabecera);
            if (m === null)
                break;
            const tam = Number(m[2]);
            const datos = buf.subarray(finLinea + 1, finLinea + 1 + tam);
            pos = finLinea + 1 + tam + 1;
            escaneados++;
            const contenido = decodificar(datos);
            if (contenido === null) {
                binarios++;
                continue;
            }
            for (const h of buscarSecretos(contenido)) {
                if (h.clase !== 'secreto')
                    continue;
                if (hallazgos.length < MAX_HALLAZGOS) {
                    hallazgos.push({ sha: c.sha, ruta: c.ruta, patron: h.patron, linea: h.linea, muestra: h.muestra, huella: h.huella });
                }
            }
        }
    }
    if (cortado === null && escaneados < aEscanear.length) {
        cortado = `la salida de git cat-file --batch no se pudo leer entera: se miraron ${escaneados} de ${aEscanear.length} ficheros`;
    }
    // 4. En que commits y rutas aparecio cada blob con hallazgo (solo para esos).
    const aparicionesDe = new Map();
    const fallos = [];
    const silenciadas = [];
    for (const h of hallazgos) {
        if (!aparicionesDe.has(h.sha))
            aparicionesDe.set(h.sha, aparicionesDeBlob(ctx, h.sha));
        const todas = aparicionesDe.get(h.sha) ?? null;
        const citadas = todas === null || todas.length === 0
            ? [{ ruta: h.ruta === '' ? '(ruta desconocida)' : h.ruta }]
            : todas.slice(0, MAX_APARICIONES_POR_BLOB);
        const sinCitar = todas === null ? 0 : Math.max(0, todas.length - citadas.length);
        for (const ap of citadas) {
            const s = ap.commit === undefined ? null : buscarSilencio(ctx, h.patron, ap.ruta, { commit: ap.commit, huella: h.huella });
            if (s !== null) {
                silenciadas.push(evidenciaSilenciada(s, h.patron, ap.ruta, h.linea, ap.commit));
                continue;
            }
            const e = {
                descripcion: `clave secreta en el historial (patron ${h.patron}, huella ${h.huella})`,
                fichero: ap.ruta,
                linea: h.linea,
                muestra: h.muestra,
            };
            if (ap.commit !== undefined)
                e.commit = ap.commit;
            else
                e.descripcion += '; no se pudo localizar el commit con git log --find-object';
            if (sinCitar > 0)
                e.descripcion += `; el mismo contenido aparece en ${sinCitar} commit(s) mas`;
            fallos.push(e);
        }
    }
    // 5. Opcional: gitleaks.
    const gl = complementoGitleaks(ctx);
    for (const g of gl.hallazgos) {
        const s = g.commit === '' ? null : buscarSilencio(ctx, `gitleaks:${g.regla}`, g.ruta, { commit: g.commit });
        if (s !== null)
            silenciadas.push(evidenciaSilenciada(s, `gitleaks:${g.regla}`, g.ruta, g.linea, g.commit));
        else {
            const e = { descripcion: `hallazgo de gitleaks (regla ${g.regla})`, fichero: g.ruta, linea: g.linea };
            if (g.commit !== '')
                e.commit = g.commit;
            fallos.push(e);
        }
    }
    const alcance = [
        { descripcion: `refs recorridos: ${refs}` },
        {
            descripcion: `${escaneados} ficheros distintos leidos (de ${totalBlobs} en el historial, todas las rutas, sin excluir carpetas); ` +
                `${binarios} binarios saltados y ${grandes} mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB sin leer; ` +
                `${IDS_PATRON.length} patrones; ${silenciadas.length} hallazgos silenciados`,
        },
        gl.nota,
    ];
    if (fallos.length > 0) {
        return {
            estado: 'falla',
            motivo: `${fallos.length}${hallazgos.length >= MAX_HALLAZGOS ? '+' : ''} clave(s) secreta(s) en el historial de git` +
                (cortado !== null ? ` (recorrido incompleto: ${cortado})` : ''),
            evidencias: [...fallos, ...silenciadas, ...alcance],
        };
    }
    if (cortado !== null) {
        return {
            estado: 'no-verificado',
            motivo: `recorrido del historial incompleto: ${cortado}`,
            evidencias: [...silenciadas, ...alcance],
        };
    }
    if (grandes > 0) {
        return {
            estado: 'no-verificado',
            motivo: `${grandes} fichero(s) del historial mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB no se leyeron: ` +
                'no se puede afirmar que no tengan claves. Revisalos a mano o con gitleaks',
            evidencias: [...silenciadas, ...alcance],
        };
    }
    return {
        estado: 'ok',
        motivo: 'ninguna clave secreta en el historial de git',
        evidencias: [...silenciadas, ...alcance],
    };
};
function objetivosDe(ctx, versionDeYarn) {
    const objetivos = [];
    const sinHerramienta = [];
    const versionados = new Set(ctx.versionados);
    const hay = (dir, nombre) => versionados.has(unir(dir, nombre));
    const MAX_DIRS = 5;
    for (const tipo of ctx.tipos) {
        const dirs = tipo.rutas.slice(0, MAX_DIRS);
        if (tipo.rutas.length > MAX_DIRS)
            sinHerramienta.push(`${tipo.nombre}: solo se auditan las ${MAX_DIRS} primeras carpetas de ${tipo.rutas.length}`);
        for (const dir of dirs) {
            switch (tipo.id) {
                case 'node':
                    if (hay(dir, 'pnpm-lock.yaml')) {
                        objetivos.push({ comando: 'pnpm audit --prod', tipo: tipo.nombre, dir, exe: 'pnpm', args: ['audit', '--prod', '--json'], argsVersion: ['--version'], alcance: 'solo dependencias de runtime (--prod)', interpretar: (o, s) => interpretarNpmAudit('pnpm', o, s) });
                    }
                    else if (hay(dir, 'yarn.lock')) {
                        const mayor = versionDeYarn(dir);
                        if (mayor === 1) {
                            objetivos.push({ comando: 'yarn audit --groups dependencies', tipo: tipo.nombre, dir, exe: 'yarn', args: ['audit', '--groups', 'dependencies', '--json'], argsVersion: ['--version'], alcance: 'solo dependencias de runtime (--groups dependencies)', interpretar: (o) => interpretarYarnAudit(o) });
                        }
                        else if (mayor === null) {
                            sinHerramienta.push(`falta yarn (${dir}): no se pudo auditar con yarn audit`);
                        }
                        else {
                            sinHerramienta.push(`yarn ${mayor} (${dir}): el formato de yarn npm audit no esta soportado todavia`);
                        }
                    }
                    else {
                        objetivos.push({ comando: 'npm audit --omit=dev', tipo: tipo.nombre, dir, exe: 'npm', args: ['audit', '--omit=dev', '--json'], argsVersion: ['--version'], alcance: 'solo dependencias de runtime (--omit=dev)', interpretar: (o, s) => interpretarNpmAudit('npm', o, s) });
                    }
                    break;
                case 'rust':
                    objetivos.push({ comando: 'cargo audit', tipo: tipo.nombre, dir, exe: 'cargo-audit', args: ['audit', '--json'], argsVersion: ['--version'], alcance: 'Cargo.lock completo (cargo audit no separa las dependencias de desarrollo)', interpretar: interpretarCargoAudit });
                    break;
                case 'python':
                    if (hay(dir, 'requirements.txt')) {
                        objetivos.push({ comando: 'pip-audit -r requirements.txt', tipo: tipo.nombre, dir, exe: 'pip-audit', args: ['-f', 'json', '-r', 'requirements.txt'], argsVersion: ['--version'], alcance: 'requirements.txt completo', interpretar: interpretarPipAudit });
                    }
                    else {
                        sinHerramienta.push(`${tipo.nombre} (${dir}): no hay requirements.txt versionado que pip-audit pueda auditar`);
                    }
                    break;
                case 'dotnet':
                    objetivos.push({ comando: 'dotnet list package --vulnerable', tipo: tipo.nombre, dir, exe: 'dotnet', args: ['list', 'package', '--vulnerable', '--include-transitive'], argsVersion: ['--version'], alcance: 'proyectos y dependencias transitivas (dotnet no separa las de desarrollo)', interpretar: interpretarDotnetVulnerable });
                    break;
                case 'go':
                    objetivos.push({ comando: 'govulncheck ./...', tipo: tipo.nombre, dir, exe: 'govulncheck', args: ['./...'], argsVersion: ['-version'], alcance: 'codigo alcanzable desde el modulo', interpretar: interpretarGovulncheck });
                    break;
                case 'java':
                    sinHerramienta.push(`${tipo.nombre} (${dir}): no hay herramienta de auditoria soportada para Maven ni Gradle`);
                    break;
                case 'php':
                    sinHerramienta.push(`${tipo.nombre} (${dir}): no hay herramienta de auditoria soportada para Composer`);
                    break;
                case 'ruby':
                    sinHerramienta.push(`${tipo.nombre} (${dir}): no hay herramienta de auditoria soportada para Bundler`);
                    break;
                default:
                    break;
            }
        }
    }
    return { objetivos, sinHerramienta };
}
export const sondaDependencias = (ctx) => {
    const { pathHerramientas, timeoutHerramientaMs } = ctx.opciones;
    const versionDeYarn = (dir) => {
        const exe = localizarHerramienta('yarn', pathHerramientas);
        if (exe === null)
            return null;
        const v = versionDe(exe, ['--version'], path.join(ctx.cwd, dir), pathHerramientas);
        const m = /^(\d+)\./.exec(v);
        return m === null ? null : Number(m[1]);
    };
    const { objetivos, sinHerramienta } = objetivosDe(ctx, versionDeYarn);
    const evidencias = [];
    const faltan = [...sinHerramienta];
    const graves = [];
    const limpios = [];
    for (const o of objetivos) {
        const exe = localizarHerramienta(o.exe, pathHerramientas);
        if (exe === null) {
            faltan.push(`falta ${o.exe} (${o.tipo}, ${o.dir})`);
            continue;
        }
        const version = versionDe(exe, o.argsVersion, path.join(ctx.cwd, o.dir), pathHerramientas);
        const cabecera = `${o.comando} [${o.exe} ${version}; alcance: ${o.alcance}; carpeta ${o.dir}]`;
        const e = ejecutarHerramienta(exe, o.args, path.join(ctx.cwd, o.dir), pathHerramientas, timeoutHerramientaMs);
        if (e.timeout) {
            faltan.push(`${o.comando} (${o.dir}) no termino en ${Math.round(timeoutHerramientaMs / 1000)} s`);
            continue;
        }
        if (!e.lanzada || e.error !== null) {
            faltan.push(`${o.comando} (${o.dir}) no se pudo lanzar: ${e.error ?? 'error desconocido'}`);
            continue;
        }
        const v = o.interpretar(e.stdout, e.status);
        if (v.estado === 'no-verificado') {
            faltan.push(`${o.comando} (${o.dir}): ${v.resumen}`);
            continue;
        }
        const listaOtras = v.otras.length > 0 ? `; el resto, listado sin fallar: ${v.otras.join(', ')}` : '';
        if (v.estado === 'falla') {
            graves.push(`${o.comando} (${o.dir})`);
            evidencias.push({ descripcion: `${cabecera}: ${v.resumen}. Graves: ${v.graves.join(', ')}${listaOtras}` });
        }
        else {
            limpios.push(`${o.comando} (${o.dir})`);
            evidencias.push({ descripcion: `${cabecera}: ${v.resumen}${listaOtras}` });
        }
    }
    if (graves.length > 0) {
        return {
            estado: 'falla',
            motivo: `vulnerabilidades altas o criticas de runtime segun: ${graves.join('; ')}` +
                (faltan.length > 0 ? `. Ademas sin verificar: ${faltan.join('; ')}` : ''),
            evidencias,
        };
    }
    if (faltan.length > 0) {
        return {
            estado: 'no-verificado',
            motivo: `falta para verificarlo: ${faltan.join('; ')}`,
            evidencias,
        };
    }
    if (limpios.length === 0) {
        return { estado: 'no-verificado', motivo: 'no hay ninguna herramienta de auditoria aplicable a los tipos detectados', evidencias: [] };
    }
    return {
        estado: 'ok',
        motivo: `sin vulnerabilidades altas ni criticas en las dependencias de runtime (${limpios.join('; ')})`,
        evidencias,
    };
};
// ---------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------
export const SONDAS = {
    'secretos-arbol': sondaSecretosArbol,
    'secretos-historial': sondaSecretosHistorial,
    'ficheros-secretos': sondaFicherosSecretos,
    'gitignore-env': sondaGitignoreEnv,
    lockfile: sondaLockfile,
    dependencias: sondaDependencias,
};
