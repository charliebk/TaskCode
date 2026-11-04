/**
 * Catalogo de `taskctl doctor-deploy` (TASK-066): lectura y validacion de
 * `scripts/doctor-deploy.yml` (el que trae el plugin) y de la capa del proyecto
 * `.taskcode/doctor-deploy.yml`.
 *
 * Mismo criterio que `heuristica.ts` y `catalogo-skills.ts`: un unico parser
 * (`parseBloqueClaveValor`), formato plano con prefijo `tipo_N_` / `punto_N_`,
 * fallo en cerrado. El catalogo del plugin lo distribuye el plugin: si falta o
 * esta roto, la instalacion esta rota y se aborta.
 *
 * Dos ejes (TASK-068): `tipo_N_*` (lenguaje y herramientas: node, rust,
 * docker...) y `aplicacion_N_*` (tipo de aplicacion: web, api, cli,
 * libreria...). Cada punto nombra los suyos en `punto_N_tipos` y, opcional,
 * `punto_N_aplicaciones`; un id del eje equivocado aborta.
 *
 * Capa del proyecto (`.taskcode/doctor-deploy.yml`, opcional):
 * - `desactivar_N_id` + `desactivar_N_motivo`: desactiva un punto. Sin motivo
 *   aborta (es una aceptacion de riesgo). Un id que no existe AVISA y se
 *   ignora (politica de `config.yml`).
 * - `punto_N_*`: anade un punto propio. Solo puede ser de `juicio` o usar una
 *   sonda ya registrada (el proyecto no inyecta codigo). Un id repetido (con
 *   el catalogo o consigo mismo) aborta: no se pisa un punto del plugin.
 * - `silenciar_N_*`: silencia UN hallazgo concreto (patron + fichero, y
 *   opcionalmente commit) con motivo, quien y fecha. Es la valvula para un
 *   secreto ya rotado o un falso positivo, distinta de desactivar el punto.
 * - Una clave desconocida avisa y se ignora.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBloqueClaveValor } from './frontmatter.js';
import { PATRONES_REGLAS_SIN_HUELLA } from './doctor-deploy-reglas.js';
export class DoctorDeployCatalogoError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DoctorDeployCatalogoError';
    }
}
export const SEVERIDADES = ['critica', 'alta', 'media', 'baja'];
export const METODOS = ['determinista', 'juicio'];
/**
 * Comprobaciones deterministas que existen en el codigo (`fs/sondas-deploy.ts` y, las de
 * configuracion de TASK-068, `fs/sondas-deploy-config.ts`). Es la fuente de verdad: el
 * registro `SONDAS` se tipa con estos nombres y no compila si no coinciden.
 */
export const SONDAS_REGISTRADAS = [
    'secretos-arbol',
    'secretos-historial',
    'ficheros-secretos',
    'gitignore-env',
    'lockfile',
    'dependencias',
    'reglas-firebase',
    'migraciones-rls',
    'tokens-gestor',
    'compose-contrasenas',
    'ci-pull-request-target',
    'acciones-sin-sha',
    'dockerfile-user',
];
/** true si `sonda` es una comprobacion registrada. */
export function esSondaRegistrada(sonda) {
    return SONDAS_REGISTRADAS.includes(sonda);
}
/**
 * Patrones de silencio cuyo hallazgo no tiene valor ni huella (es del fichero entero):
 * un silencio de estos vale solo con patron + fichero. Para el resto, un silencio sin
 * commit exige la huella (D3: no tapar un hallazgo nuevo del mismo patron y fichero).
 */
export const PATRONES_SIN_HUELLA = ['fichero-secreto', ...PATRONES_REGLAS_SIN_HUELLA];
/** Valor de `tipos` que significa «aplica siempre». */
export const TIPO_TODOS = 'todos';
export const FICHERO_CATALOGO_DEPLOY = 'doctor-deploy.yml';
/** Ruta de la capa del proyecto, relativa a su raiz. */
export const RUTA_CAPA_PROYECTO = path.join('.taskcode', 'doctor-deploy.yml');
const MAX_ENTRADAS = 500;
const CAMPOS_TIPO = ['id', 'nombre', 'marcadores'];
const CAMPOS_APLICACION = ['id', 'nombre', 'marcadores', 'contiene'];
const CAMPOS_PUNTO = ['id', 'severidad', 'tipos', 'aplicaciones', 'metodo', 'sonda', 'arreglo', 'descripcion', 'referencia'];
const CAMPOS_DESACTIVAR = ['id', 'motivo'];
const CAMPOS_SILENCIAR = ['patron', 'fichero', 'commit', 'huella', 'motivo', 'quien', 'fecha'];
function packageRoot() {
    // dist/src/core/doctor-deploy-catalogo.js -> core -> src -> dist -> raiz del plugin
    return path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
}
/** Ruta del catalogo del plugin. Respeta CLAUDE_PLUGIN_ROOT, como las demas. */
export function resolverRutaCatalogoDeploy() {
    const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
    if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
        return path.join(pluginRoot, 'scripts', FICHERO_CATALOGO_DEPLOY);
    }
    return path.join(packageRoot(), 'scripts', FICHERO_CATALOGO_DEPLOY);
}
function agrupar(pares, familias, extras, ruta, fallar) {
    const bloques = new Map();
    for (const f of familias)
        bloques.set(f.prefijo, new Map());
    const desconocidas = [];
    const extrasLeidos = new Map();
    const vistas = new Set();
    for (const par of pares) {
        const donde = `${ruta}:${par.numeroLinea}`;
        if (vistas.has(par.clave)) {
            throw fallar(`[ERROR] ${donde}: la clave "${par.clave}" esta repetida. Deja una sola.`);
        }
        vistas.add(par.clave);
        if (extras.includes(par.clave)) {
            extrasLeidos.set(par.clave, par);
            continue;
        }
        const m = /^([a-z]+)_(\d+)_([a-z_]+)$/.exec(par.clave);
        const fam = m === null ? undefined : familias.find((f) => f.prefijo === m[1]);
        if (m === null || fam === undefined || !fam.campos.includes(m[3])) {
            desconocidas.push(par);
            continue;
        }
        const n = Number(m[2]);
        if (!Number.isSafeInteger(n) || n < 1 || n > MAX_ENTRADAS) {
            throw fallar(`[ERROR] ${donde}: "${par.clave}" tiene un numero fuera de rango (1 a ${MAX_ENTRADAS}). ` +
                'Numera las entradas desde 1, sin saltos.');
        }
        const delFamilia = bloques.get(fam.prefijo);
        const bloque = delFamilia.get(n) ?? new Map();
        bloque.set(m[3], { valor: par.valor, numeroLinea: par.numeroLinea });
        delFamilia.set(n, bloque);
    }
    return { bloques, desconocidas, extras: extrasLeidos };
}
/** Comprueba que los N de una familia son 1..k sin saltos y devuelve k. */
function exigirContiguos(prefijo, bloques, ruta, fallar) {
    const numeros = [...bloques.keys()].sort((a, b) => a - b);
    for (let i = 0; i < numeros.length; i++) {
        if (numeros[i] !== i + 1) {
            throw fallar(`[ERROR] ${ruta}: faltan las claves "${prefijo}_${i + 1}_*" (hay "${prefijo}_${numeros[i]}_*"). ` +
                'Numera las entradas desde 1 y sin saltos.');
        }
    }
    return numeros.length;
}
function exigir(bloque, prefijo, n, campo, ruta, fallar) {
    const v = bloque.get(campo);
    if (v === undefined) {
        throw fallar(`[ERROR] ${ruta}: falta la clave obligatoria "${prefijo}_${n}_${campo}".`);
    }
    return v;
}
function texto(v, clave, ruta, fallar) {
    if (typeof v.valor !== 'string' || v.valor.trim() === '') {
        throw fallar(`[ERROR] ${ruta}:${v.numeroLinea}: "${clave}" debe ser un texto no vacio.`);
    }
    return v.valor.trim();
}
function lista(v, clave, ruta, fallar) {
    if (!Array.isArray(v.valor) || v.valor.length === 0 || v.valor.some((x) => typeof x !== 'string' || x.trim() === '')) {
        throw fallar(`[ERROR] ${ruta}:${v.numeroLinea}: "${clave}" debe ser una lista no vacia de textos: [a, b].`);
    }
    return v.valor.map((x) => x.trim());
}
function enumerado(v, clave, validos, ruta, fallar) {
    const t = typeof v.valor === 'string' ? v.valor.trim() : '';
    if (!validos.includes(t)) {
        throw fallar(`[ERROR] ${ruta}:${v.numeroLinea}: "${clave}" vale "${String(v.valor)}", pero debe ser uno de: ${validos.join(', ')}.`);
    }
    return t;
}
function valorEntero(par, clave, ruta, fallar) {
    if (par === undefined)
        throw fallar(`[ERROR] ${ruta}: falta la clave obligatoria "${clave}".`);
    if (typeof par.valor !== 'number' || !Number.isInteger(par.valor) || par.valor < 0) {
        throw fallar(`[ERROR] ${ruta}:${par.numeroLinea}: "${clave}" debe ser un entero no negativo.`);
    }
    return par.valor;
}
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
function construirPunto(bloque, n, ruta, origen, idsDeTipo, idsDeAplicacion, fallar) {
    const p = `punto_${n}`;
    const cId = exigir(bloque, 'punto', n, 'id', ruta, fallar);
    const id = texto(cId, `${p}_id`, ruta, fallar);
    if (!ID_RE.test(id)) {
        throw fallar(`[ERROR] ${ruta}:${cId.numeroLinea}: "${p}_id" vale "${id}"; usa minusculas, digitos y guiones (p. ej. "mi-punto").`);
    }
    const severidad = enumerado(exigir(bloque, 'punto', n, 'severidad', ruta, fallar), `${p}_severidad`, SEVERIDADES, ruta, fallar);
    const cTipos = exigir(bloque, 'punto', n, 'tipos', ruta, fallar);
    const tipos = lista(cTipos, `${p}_tipos`, ruta, fallar);
    for (const t of tipos) {
        if (idsDeAplicacion.has(t)) {
            throw fallar(`[ERROR] ${ruta}:${cTipos.numeroLinea}: "${p}_tipos" nombra "${t}", que es un tipo de aplicacion, no de lenguaje: ` +
                `va en "${p}_aplicaciones".`);
        }
        if (t !== TIPO_TODOS && !idsDeTipo.has(t)) {
            throw fallar(`[ERROR] ${ruta}:${cTipos.numeroLinea}: "${p}_tipos" nombra el tipo "${t}", que no existe. ` +
                `Tipos validos: ${TIPO_TODOS}, ${[...idsDeTipo].join(', ')}.`);
        }
    }
    const cAplicaciones = bloque.get('aplicaciones');
    let aplicaciones = null;
    if (cAplicaciones !== undefined) {
        aplicaciones = lista(cAplicaciones, `${p}_aplicaciones`, ruta, fallar);
        for (const a of aplicaciones) {
            if (a === TIPO_TODOS) {
                throw fallar(`[ERROR] ${ruta}:${cAplicaciones.numeroLinea}: "${p}_aplicaciones" no admite "${TIPO_TODOS}": ` +
                    'para que aplique a cualquier tipo de aplicacion, borra la linea.');
            }
            if (idsDeTipo.has(a)) {
                throw fallar(`[ERROR] ${ruta}:${cAplicaciones.numeroLinea}: "${p}_aplicaciones" nombra "${a}", que es un tipo de lenguaje, no de aplicacion: ` +
                    `va en "${p}_tipos".`);
            }
            if (!idsDeAplicacion.has(a)) {
                throw fallar(`[ERROR] ${ruta}:${cAplicaciones.numeroLinea}: "${p}_aplicaciones" nombra el tipo de aplicacion "${a}", que no existe. ` +
                    `Tipos de aplicacion validos: ${[...idsDeAplicacion].join(', ') || '(el catalogo no declara ninguno)'}.`);
            }
        }
    }
    const cMetodo = exigir(bloque, 'punto', n, 'metodo', ruta, fallar);
    const metodo = enumerado(cMetodo, `${p}_metodo`, METODOS, ruta, fallar);
    const cSonda = bloque.get('sonda');
    let sonda = null;
    if (metodo === 'determinista') {
        if (cSonda === undefined) {
            throw fallar(`[ERROR] ${ruta}:${cMetodo.numeroLinea}: "${p}_metodo: determinista" exige "${p}_sonda".`);
        }
        sonda = texto(cSonda, `${p}_sonda`, ruta, fallar);
        if (!esSondaRegistrada(sonda)) {
            throw fallar(`[ERROR] ${ruta}:${cSonda.numeroLinea}: "${p}_sonda" vale "${sonda}", que no es una comprobacion registrada. ` +
                `Las que hay: ${SONDAS_REGISTRADAS.join(', ')}. Para algo distinto usa "${p}_metodo: juicio".`);
        }
    }
    else if (cSonda !== undefined) {
        throw fallar(`[ERROR] ${ruta}:${cSonda.numeroLinea}: "${p}_sonda" no tiene sentido con "${p}_metodo: juicio". Borra la linea.`);
    }
    const arreglo = texto(exigir(bloque, 'punto', n, 'arreglo', ruta, fallar), `${p}_arreglo`, ruta, fallar);
    const descripcion = texto(exigir(bloque, 'punto', n, 'descripcion', ruta, fallar), `${p}_descripcion`, ruta, fallar);
    const cRef = bloque.get('referencia');
    const referencia = cRef === undefined ? null : texto(cRef, `${p}_referencia`, ruta, fallar);
    return { id, severidad, tipos, aplicaciones, metodo, sonda, arreglo, descripcion, referencia, origen };
}
// ---------------------------------------------------------------------
// Catalogo del plugin
// ---------------------------------------------------------------------
export function cargarCatalogoDeploy(ruta) {
    const rutaFinal = ruta ?? resolverRutaCatalogoDeploy();
    let contenido;
    try {
        contenido = readFileSync(rutaFinal, 'utf8');
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new DoctorDeployCatalogoError(`[ERROR] No se pudo leer el catalogo de doctor-deploy "${rutaFinal}": ${msg}\n` +
            '        Ese fichero lo trae el plugin. Reinstalalo, o define CLAUDE_PLUGIN_ROOT\n' +
            '        apuntando a la raiz del plugin si lo ejecutas desde otro sitio.');
    }
    return parsearCatalogoDeploy(contenido, rutaFinal);
}
export function parsearCatalogoDeploy(contenido, ruta) {
    const fallar = (m) => new DoctorDeployCatalogoError(m);
    const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
        etiqueta: 'catalogo de doctor-deploy',
        crearError: (m) => new DoctorDeployCatalogoError(`[ERROR] ${ruta}: ${m}`),
        permitirComentariosDeLinea: true,
    });
    const g = agrupar(pares, [
        { prefijo: 'tipo', campos: CAMPOS_TIPO },
        { prefijo: 'aplicacion', campos: CAMPOS_APLICACION },
        { prefijo: 'punto', campos: CAMPOS_PUNTO },
    ], ['total_tipos', 'total_aplicaciones', 'total_puntos'], ruta, fallar);
    const desconocida = g.desconocidas[0];
    if (desconocida !== undefined) {
        throw fallar(`[ERROR] ${ruta}:${desconocida.numeroLinea}: clave desconocida "${desconocida.clave}". Si es un error de tecleo, corrigela.`);
    }
    const totalTipos = valorEntero(g.extras.get('total_tipos'), 'total_tipos', ruta, fallar);
    const totalPuntos = valorEntero(g.extras.get('total_puntos'), 'total_puntos', ruta, fallar);
    const bloquesTipo = g.bloques.get('tipo');
    const bloquesPunto = g.bloques.get('punto');
    if (exigirContiguos('tipo', bloquesTipo, ruta, fallar) !== totalTipos) {
        throw fallar(`[ERROR] ${ruta}: "total_tipos" dice ${totalTipos}, pero hay ${bloquesTipo.size} tipos. Corrige el total o las entradas.`);
    }
    if (exigirContiguos('punto', bloquesPunto, ruta, fallar) !== totalPuntos) {
        throw fallar(`[ERROR] ${ruta}: "total_puntos" dice ${totalPuntos}, pero hay ${bloquesPunto.size} puntos. Corrige el total o las entradas.`);
    }
    const tipos = [];
    for (let n = 1; n <= totalTipos; n++) {
        const b = bloquesTipo.get(n);
        const id = texto(exigir(b, 'tipo', n, 'id', ruta, fallar), `tipo_${n}_id`, ruta, fallar);
        if (!ID_RE.test(id) || id === TIPO_TODOS) {
            throw fallar(`[ERROR] ${ruta}: "tipo_${n}_id" vale "${id}"; usa minusculas, digitos y guiones, y no "${TIPO_TODOS}".`);
        }
        const nombre = b.has('nombre') ? texto(b.get('nombre'), `tipo_${n}_nombre`, ruta, fallar) : id;
        const marcadores = lista(exigir(b, 'tipo', n, 'marcadores', ruta, fallar), `tipo_${n}_marcadores`, ruta, fallar);
        tipos.push({ id, nombre, marcadores });
    }
    const idsTipo = new Set();
    for (const t of tipos) {
        if (idsTipo.has(t.id))
            throw fallar(`[ERROR] ${ruta}: el tipo "${t.id}" esta repetido.`);
        idsTipo.add(t.id);
    }
    const aplicaciones = parsearAplicaciones(g, idsTipo, ruta, fallar);
    const idsAplicacion = new Set(aplicaciones.map((a) => a.id));
    const puntos = [];
    const idsPunto = new Set();
    for (let n = 1; n <= totalPuntos; n++) {
        const p = construirPunto(bloquesPunto.get(n), n, ruta, 'plugin', idsTipo, idsAplicacion, fallar);
        if (idsPunto.has(p.id))
            throw fallar(`[ERROR] ${ruta}: el punto "${p.id}" esta repetido.`);
        idsPunto.add(p.id);
        puntos.push(p);
    }
    return { tipos, aplicaciones, puntos };
}
/**
 * Familia `aplicacion_N_*` (TASK-068). `total_aplicaciones` es opcional: sin el
 * no puede haber ninguna entrada `aplicacion_N_*` (un catalogo antiguo sigue
 * valiendo). Un id de aplicacion no puede coincidir con uno de tipo: los dos
 * ejes se nombran en campos distintos y un id compartido seria ambiguo.
 */
function parsearAplicaciones(g, idsTipo, ruta, fallar) {
    const bloques = g.bloques.get('aplicacion');
    const parTotal = g.extras.get('total_aplicaciones');
    const total = parTotal === undefined ? 0 : valorEntero(parTotal, 'total_aplicaciones', ruta, fallar);
    if (exigirContiguos('aplicacion', bloques, ruta, fallar) !== total) {
        throw fallar(`[ERROR] ${ruta}: "total_aplicaciones" dice ${total}${parTotal === undefined ? ' (no esta)' : ''}, pero hay ${bloques.size} tipos de aplicacion. ` +
            'Corrige el total o las entradas.');
    }
    const aplicaciones = [];
    const ids = new Set();
    for (let n = 1; n <= total; n++) {
        const b = bloques.get(n);
        const id = texto(exigir(b, 'aplicacion', n, 'id', ruta, fallar), `aplicacion_${n}_id`, ruta, fallar);
        if (!ID_RE.test(id) || id === TIPO_TODOS) {
            throw fallar(`[ERROR] ${ruta}: "aplicacion_${n}_id" vale "${id}"; usa minusculas, digitos y guiones, y no "${TIPO_TODOS}".`);
        }
        if (idsTipo.has(id)) {
            throw fallar(`[ERROR] ${ruta}: "aplicacion_${n}_id" vale "${id}", que ya es un tipo de lenguaje (tipo_N_id). Usa otro id.`);
        }
        if (ids.has(id))
            throw fallar(`[ERROR] ${ruta}: el tipo de aplicacion "${id}" esta repetido.`);
        ids.add(id);
        const nombre = b.has('nombre') ? texto(b.get('nombre'), `aplicacion_${n}_nombre`, ruta, fallar) : id;
        const marcadores = lista(exigir(b, 'aplicacion', n, 'marcadores', ruta, fallar), `aplicacion_${n}_marcadores`, ruta, fallar);
        const cContiene = b.get('contiene');
        const contiene = cContiene === undefined ? null : lista(cContiene, `aplicacion_${n}_contiene`, ruta, fallar);
        aplicaciones.push({ id, nombre, marcadores, contiene });
    }
    return aplicaciones;
}
// ---------------------------------------------------------------------
// Capa del proyecto
// ---------------------------------------------------------------------
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
export function cargarCapaProyecto(repoRoot, base) {
    const ruta = path.join(repoRoot, RUTA_CAPA_PROYECTO);
    let contenido;
    try {
        contenido = readFileSync(ruta, 'utf8');
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            return { desactivados: [], anadidos: [], silencios: [], avisos: [] };
        }
        const msg = e instanceof Error ? e.message : String(e);
        throw new DoctorDeployCatalogoError(`[ERROR] No se pudo leer "${ruta}": ${msg}`);
    }
    return parsearCapaProyecto(contenido, ruta, base);
}
export function parsearCapaProyecto(contenido, ruta, base) {
    const fallar = (m) => new DoctorDeployCatalogoError(m);
    const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
        etiqueta: 'doctor-deploy del proyecto',
        crearError: (m) => new DoctorDeployCatalogoError(`[ERROR] ${ruta}: ${m}`),
        permitirComentariosDeLinea: true,
    });
    const g = agrupar(pares, [
        { prefijo: 'desactivar', campos: CAMPOS_DESACTIVAR },
        { prefijo: 'punto', campos: CAMPOS_PUNTO },
        { prefijo: 'silenciar', campos: CAMPOS_SILENCIAR },
    ], [], ruta, fallar);
    const avisos = g.desconocidas.map((p) => `${ruta}:${p.numeroLinea}: clave desconocida "${p.clave}" (se ignora).`);
    const idsBase = new Set(base.puntos.map((p) => p.id));
    const idsTipo = new Set(base.tipos.map((t) => t.id));
    const idsAplicacion = new Set(base.aplicaciones.map((a) => a.id));
    // desactivar
    const bDes = g.bloques.get('desactivar');
    const nDes = exigirContiguos('desactivar', bDes, ruta, fallar);
    const desactivados = [];
    for (let n = 1; n <= nDes; n++) {
        const b = bDes.get(n);
        const id = texto(exigir(b, 'desactivar', n, 'id', ruta, fallar), `desactivar_${n}_id`, ruta, fallar);
        const cMotivo = b.get('motivo');
        if (cMotivo === undefined || typeof cMotivo.valor !== 'string' || cMotivo.valor.trim() === '') {
            throw fallar(`[ERROR] ${ruta}: desactivar el punto "${id}" exige "desactivar_${n}_motivo" (es una aceptacion de riesgo: ` +
                'di por que no aplica o quien la asume).');
        }
        desactivados.push({ id, motivo: cMotivo.valor.trim() });
    }
    // puntos anadidos
    const bPun = g.bloques.get('punto');
    const nPun = exigirContiguos('punto', bPun, ruta, fallar);
    const anadidos = [];
    const idsVistos = new Set(idsBase);
    for (let n = 1; n <= nPun; n++) {
        const p = construirPunto(bPun.get(n), n, ruta, 'proyecto', idsTipo, idsAplicacion, fallar);
        if (idsVistos.has(p.id)) {
            throw fallar(`[ERROR] ${ruta}: el punto "${p.id}" ya existe ` +
                `${idsBase.has(p.id) ? 'en el catalogo del plugin' : 'en este mismo fichero'}; un proyecto no puede redefinirlo. ` +
                'Usa otro id.');
        }
        idsVistos.add(p.id);
        anadidos.push(p);
    }
    // silencios
    const bSil = g.bloques.get('silenciar');
    const nSil = exigirContiguos('silenciar', bSil, ruta, fallar);
    const silencios = [];
    for (let n = 1; n <= nSil; n++) {
        const b = bSil.get(n);
        const t = (campo) => texto(exigir(b, 'silenciar', n, campo, ruta, fallar), `silenciar_${n}_${campo}`, ruta, fallar);
        const patron = t('patron');
        const fichero = t('fichero').replace(/\\/g, '/');
        const motivo = t('motivo');
        const quien = t('quien');
        const cFecha = exigir(b, 'silenciar', n, 'fecha', ruta, fallar);
        const fecha = texto(cFecha, `silenciar_${n}_fecha`, ruta, fallar);
        if (!FECHA_RE.test(fecha)) {
            throw fallar(`[ERROR] ${ruta}:${cFecha.numeroLinea}: "silenciar_${n}_fecha" vale "${fecha}"; usa AAAA-MM-DD.`);
        }
        const cCommit = b.get('commit');
        let commit = null;
        if (cCommit !== undefined) {
            if (typeof cCommit.valor === 'number') {
                throw fallar(`[ERROR] ${ruta}:${cCommit.numeroLinea}: "silenciar_${n}_commit" son solo digitos y se leeria como un numero: ponlo entre comillas ("1234567").`);
            }
            commit = texto(cCommit, `silenciar_${n}_commit`, ruta, fallar).toLowerCase();
            if (!/^[0-9a-f]{7,40}$/.test(commit)) {
                throw fallar(`[ERROR] ${ruta}:${cCommit.numeroLinea}: "silenciar_${n}_commit" debe ser un hash de commit de 7 a 40 caracteres hexadecimales.`);
            }
        }
        const cHuella = b.get('huella');
        let huella = null;
        if (cHuella !== undefined) {
            if (typeof cHuella.valor === 'number') {
                throw fallar(`[ERROR] ${ruta}:${cHuella.numeroLinea}: "silenciar_${n}_huella" son solo digitos y se leeria como un numero: ponla entre comillas.`);
            }
            huella = texto(cHuella, `silenciar_${n}_huella`, ruta, fallar).toLowerCase();
            if (!/^[0-9a-f]{8,64}$/.test(huella)) {
                throw fallar(`[ERROR] ${ruta}:${cHuella.numeroLinea}: "silenciar_${n}_huella" debe tener de 8 a 64 caracteres hexadecimales (la que imprime el hallazgo).`);
            }
        }
        // D3: un silencio es POR HALLAZGO. Sin commit solo vale para el arbol, y ahi se ata a la huella
        // del valor: asi no tapa otra clave nueva del mismo patron en el mismo fichero. Los hallazgos
        // que son del fichero entero (PATRONES_SIN_HUELLA: fichero-secreto, dockerfile-sin-user,
        // pr-target-checkout) no tienen huella y valen con patron + fichero (TASK-068).
        if (commit === null && huella === null && !PATRONES_SIN_HUELLA.includes(patron)) {
            throw fallar(`[ERROR] ${ruta}: silenciar_${n} exige "silenciar_${n}_commit" (hallazgo del historial) o "silenciar_${n}_huella" ` +
                '(hallazgo del arbol: la huella sale en la evidencia). Sin ninguno taparia tambien las claves nuevas del mismo fichero.');
        }
        silencios.push({ numero: n, patron, fichero, commit, huella, motivo, quien, fecha });
    }
    // id desconocido en desactivar: aviso (se comprueba contra base + anadidos)
    for (const d of desactivados) {
        if (!idsVistos.has(d.id)) {
            avisos.push(`${ruta}: "desactivar" nombra el punto "${d.id}", que no existe (se ignora).`);
        }
    }
    return { desactivados, anadidos, silencios, avisos };
}
/** Une el catalogo del plugin con la capa del proyecto. */
export function combinarCatalogo(base, capa) {
    const puntos = [...base.puntos, ...capa.anadidos];
    const ids = new Set(puntos.map((p) => p.id));
    const desactivados = new Map();
    for (const d of capa.desactivados)
        if (ids.has(d.id))
            desactivados.set(d.id, d.motivo);
    return { tipos: base.tipos, aplicaciones: base.aplicaciones, puntos, desactivados, silencios: capa.silencios, avisos: [...capa.avisos] };
}
