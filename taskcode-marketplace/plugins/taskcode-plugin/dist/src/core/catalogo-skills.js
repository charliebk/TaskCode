/**
 * `scripts/catalogo-skills.yml` — lectura, validacion y el paso 1 de la
 * seleccion determinista de skill que describe la seccion 6.6 de
 * docs/PROPUESTA_METODOLOGIA.md (TASK-017).
 *
 * MISMA DOCTRINA QUE src/core/heuristica.ts, y por los mismos motivos:
 * fallo cerrado al parsear (clave desconocida, clave obligatoria
 * ausente, tipo equivocado o valor negativo ABORTAN taskctl entero, sin
 * caida a un default silencioso), un solo parser (`parseBloqueClaveValor`
 * de frontmatter.ts) y un solo punto de resolucion
 * (`cargarCatalogoSkills`).
 *
 * LA UNICA DIFERENCIA DE FONDO CON heuristica.ts: alli las 22 claves
 * cubren TODA tarea por construccion, asi que cualquier ausencia es un
 * fallo. Aqui el catalogo es EXPLICITAMENTE NO EXHAUSTIVO — cero
 * candidatos tras cruzar `etiquetas` con la tarea es un resultado
 * VALIDO (seleccion vacia + aviso de quien llame), no un fallo de
 * configuracion. Lo que si es fail-closed es el PARSEO del fichero: una
 * entrada mal formada aborta igual que una heuristica mal formada.
 *
 * FORMATO APLANADO. El fichero no tiene anidamiento (el parser no lo
 * soporta), asi que cada entrada del catalogo se aplana con el prefijo
 * "skill_N_" en el nombre de la clave, N = posicion 1-based. La clave
 * "total_skills" dice cuantos bloques hay que leer. El conjunto de
 * claves validas depende de ese numero: se resuelve "total_skills"
 * primero, y con el se construyen las claves esperadas antes de validar
 * el resto — igual que "clave desconocida" en heuristica.ts, pero aqui
 * el universo de claves validas no es una lista fija.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseBloqueClaveValor } from './frontmatter.js';
const MAX_TOTAL_SKILLS = 1000;
export class CatalogoSkillsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CatalogoSkillsError';
    }
}
export const ORIGENES_SKILL = ['taskcode-plugin', 'externo'];
export const ROLES_SKILL = ['revisor', 'ejecucion', 'ambos'];
/** Nombre del fichero dentro de `scripts/`. */
export const FICHERO_CATALOGO_SKILLS = 'catalogo-skills.yml';
const CAMPOS_SKILL_OBLIGATORIOS = [
    'id',
    'origen',
    'rol',
    'prioridad',
    'etiquetas',
    'patrones_archivo',
    'descripcion',
];
const CAMPOS_SKILL_TODOS = [...CAMPOS_SKILL_OBLIGATORIOS, 'marketplace'];
const SKILL_KEY_RE = /^skill_(\d+)_(id|origen|marketplace|rol|prioridad|etiquetas|patrones_archivo|descripcion)$/;
function packageRoot() {
    // dist/src/core/catalogo-skills.js -> dist/src/core -> dist/src -> dist -> raiz
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    return path.join(moduleDir, '..', '..', '..');
}
/**
 * Ruta del YML. Mismo patron que resolverRutaHeuristica(): respeta
 * CLAUDE_PLUGIN_ROOT si esta definida; si no, calcula la ruta relativa
 * al propio modulo compilado.
 */
export function resolverRutaCatalogoSkills() {
    const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
    if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
        return path.join(pluginRoot, 'scripts', FICHERO_CATALOGO_SKILLS);
    }
    return path.join(packageRoot(), 'scripts', FICHERO_CATALOGO_SKILLS);
}
/**
 * EL punto de resolucion. Lee el fichero y lo valida, o lanza
 * CatalogoSkillsError. No hay caso de "no hay fichero, sigue sin
 * skills": el YML lo distribuye el plugin, igual que
 * heuristica-complejidad.yml, asi que si falta la instalacion esta
 * rota.
 */
export function cargarCatalogoSkills(ruta) {
    const rutaFinal = ruta ?? resolverRutaCatalogoSkills();
    let contenido;
    try {
        contenido = readFileSync(rutaFinal, 'utf8');
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new CatalogoSkillsError(`[ERROR] No se pudo leer el catalogo de skills "${rutaFinal}": ${msg}\n` +
            '        Ese fichero lo trae el plugin. Reinstalalo, o define CLAUDE_PLUGIN_ROOT\n' +
            '        apuntando a la raiz del plugin si lo ejecutas desde otro sitio.');
    }
    return parsearCatalogoSkills(contenido, rutaFinal);
}
/**
 * Separada de cargarCatalogoSkills para poder probar el parseo y la
 * validacion sin disco.
 */
export function parsearCatalogoSkills(contenido, ruta) {
    const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
        etiqueta: 'catalogo de skills',
        crearError: (mensaje) => new CatalogoSkillsError(`[ERROR] ${ruta}: ${mensaje}`),
        permitirComentariosDeLinea: true,
    });
    // (1) total_skills se resuelve ANTES que nada: el universo de claves
    // validas depende de su valor, asi que hay que conocerlo antes de
    // poder decir "clave desconocida" de cualquier otra.
    const paresTotal = pares.filter((p) => p.clave === 'total_skills');
    if (paresTotal.length === 0) {
        throw new CatalogoSkillsError(mensajeClaveAusente(ruta, 'total_skills'));
    }
    if (paresTotal.length > 1) {
        const segundo = paresTotal[1];
        throw new CatalogoSkillsError(mensajeClaveRepetida(`${ruta}:${segundo.numeroLinea}`, 'total_skills'));
    }
    const primerTotal = paresTotal[0];
    const totalSkills = validarEnteroNoNegativo(`${ruta}:${primerTotal.numeroLinea}`, 'total_skills', primerTotal.valor);
    // Cota superior aparte del "no negativo" de arriba (hallazgo MENOR de
    // revision por pares, TASK-017): construirClavesValidas() materializa
    // un Set de totalSkills*8 claves, y sin tope un valor disparatado
    // (p. ej. un cero de mas por error de tecleo) cuelga el comando varios
    // segundos y revienta con un RangeError crudo que cli.ts no reconoce
    // como error de catalogo. MAX_TOTAL_SKILLS es generoso a proposito:
    // ningun catalogo real se acerca ni de lejos.
    if (totalSkills > MAX_TOTAL_SKILLS) {
        throw new CatalogoSkillsError(`[ERROR] ${ruta}:${primerTotal.numeroLinea}: "total_skills" es ${totalSkills}, y el maximo ` +
            `admitido es ${MAX_TOTAL_SKILLS}. Revisa que el numero no tenga cifras de mas.`);
    }
    const clavesValidas = construirClavesValidas(totalSkills);
    // (2) Recorrido completo: clave desconocida / repetida, y agrupacion
    // por bloque N. Misma doctrina que heuristica.ts, pero aqui el Set de
    // claves validas es dinamico en vez de una lista fija.
    const vistas = new Set();
    const bloques = new Map();
    for (const par of pares) {
        const donde = `${ruta}:${par.numeroLinea}`;
        if (!clavesValidas.has(par.clave)) {
            throw new CatalogoSkillsError(mensajeClaveDesconocida(donde, par.clave, clavesValidas));
        }
        if (vistas.has(par.clave)) {
            throw new CatalogoSkillsError(mensajeClaveRepetida(donde, par.clave));
        }
        vistas.add(par.clave);
        if (par.clave === 'total_skills')
            continue;
        const m = SKILL_KEY_RE.exec(par.clave);
        const n = Number(m[1]);
        const campo = m[2];
        const bloque = bloques.get(n) ?? {};
        bloque[campo] = { valor: par.valor, numeroLinea: par.numeroLinea };
        bloques.set(n, bloque);
    }
    // (3) Una entrada por cada N de 1 a totalSkills, exigiendo sus
    // obligatorias. Un bloque ausente o a medias sale por la misma puerta
    // que cualquier otra clave obligatoria que falte: mensajeClaveAusente.
    const catalogo = [];
    for (let n = 1; n <= totalSkills; n++) {
        catalogo.push(construirEntrada(bloques.get(n) ?? {}, n, ruta));
    }
    validarIdsUnicos(catalogo, ruta);
    return catalogo;
}
function construirClavesValidas(totalSkills) {
    const claves = new Set(['total_skills']);
    for (let n = 1; n <= totalSkills; n++) {
        for (const campo of CAMPOS_SKILL_TODOS) {
            claves.add(`skill_${n}_${campo}`);
        }
    }
    return claves;
}
function exigirCampo(bloque, campo, n, ruta) {
    const c = bloque[campo];
    if (c === undefined) {
        throw new CatalogoSkillsError(mensajeClaveAusente(ruta, `skill_${n}_${campo}`));
    }
    return c;
}
function construirEntrada(bloque, n, ruta) {
    const prefijo = `skill_${n}_`;
    const cId = exigirCampo(bloque, 'id', n, ruta);
    const id = validarTextoNoVacio(`${ruta}:${cId.numeroLinea}`, `${prefijo}id`, cId.valor);
    const cOrigen = exigirCampo(bloque, 'origen', n, ruta);
    const origen = validarEnum(`${ruta}:${cOrigen.numeroLinea}`, `${prefijo}origen`, cOrigen.valor, ORIGENES_SKILL);
    // IMP-9 (revision por pares ronda 3, TASK-017): "plugin:skill" es la
    // convencion normativa para un id externo (seccion 6.6 de
    // docs/PROPUESTA_METODOLOGIA.md, comentario de cabecera de este
    // fichero), pero hasta ahora nada la exigia -- un id externo sin ":"
    // parseaba igual, y plan.ts emitia un "/plugin install" con el nombre
    // de un skill donde debia ir el nombre de un plugin, sin abortar ni
    // avisar. Fallo cerrado: si no cumple la forma exacta, no se adivina
    // nada, se aborta con instruccion de como corregirlo.
    if (origen === 'externo' && !/^[^:]+:[^:]+$/.test(id)) {
        throw new CatalogoSkillsError(`[ERROR] ${ruta}:${cId.numeroLinea}: "${prefijo}id" invalido para "${prefijo}origen: externo": "${id}".\n` +
            '        Debe tener la forma "plugin:skill" (un unico ":", ni el tramo antes\n' +
            '        ni el de despues vacio) -- el tramo antes de ":" es el PLUGIN a\n' +
            '        instalar, el de despues el skill dentro de ese plugin (seccion 6.6 de\n' +
            '        docs/PROPUESTA_METODOLOGIA.md).');
    }
    const cRol = exigirCampo(bloque, 'rol', n, ruta);
    const rol = validarEnum(`${ruta}:${cRol.numeroLinea}`, `${prefijo}rol`, cRol.valor, ROLES_SKILL);
    const cPrioridad = exigirCampo(bloque, 'prioridad', n, ruta);
    const prioridad = validarEnteroNoNegativo(`${ruta}:${cPrioridad.numeroLinea}`, `${prefijo}prioridad`, cPrioridad.valor);
    const cEtiquetas = exigirCampo(bloque, 'etiquetas', n, ruta);
    const etiquetas = validarListaDeTexto(`${ruta}:${cEtiquetas.numeroLinea}`, `${prefijo}etiquetas`, cEtiquetas.valor, 1);
    const cPatrones = exigirCampo(bloque, 'patrones_archivo', n, ruta);
    const patrones_archivo = validarListaDeTexto(`${ruta}:${cPatrones.numeroLinea}`, `${prefijo}patrones_archivo`, cPatrones.valor, 0);
    const cDescripcion = exigirCampo(bloque, 'descripcion', n, ruta);
    const descripcion = validarTextoNoVacio(`${ruta}:${cDescripcion.numeroLinea}`, `${prefijo}descripcion`, cDescripcion.valor);
    const cMarketplace = bloque['marketplace'];
    let marketplace;
    if (origen === 'externo') {
        if (cMarketplace === undefined) {
            throw new CatalogoSkillsError(mensajeClaveAusente(ruta, `${prefijo}marketplace`) +
                `\n        Obligatoria cuando "${prefijo}origen" es "externo": sin ella no se puede\n` +
                '        anotar "/plugin install X@Y" para un skill que no este instalado (paso 4\n' +
                '        de la seccion 6.6).');
        }
        marketplace = validarTextoNoVacio(`${ruta}:${cMarketplace.numeroLinea}`, `${prefijo}marketplace`, cMarketplace.valor);
    }
    else {
        if (cMarketplace !== undefined) {
            throw new CatalogoSkillsError(`[ERROR] ${ruta}:${cMarketplace.numeroLinea}: "${prefijo}marketplace" no tiene sentido ` +
                `con "${prefijo}origen: taskcode-plugin".\n` +
                '        Ese campo solo existe para anotar de que marketplace se instala un skill\n' +
                '        externo; uno empaquetado con el plugin ya viene instalado. Borra la linea\n' +
                '        o corrige el origen.');
        }
        marketplace = null;
    }
    return { id, origen, marketplace, rol, prioridad, etiquetas, patrones_archivo, descripcion };
}
function validarIdsUnicos(catalogo, ruta) {
    const vistos = new Map();
    catalogo.forEach((entrada, idx) => {
        const otro = vistos.get(entrada.id);
        if (otro !== undefined) {
            throw new CatalogoSkillsError(`[ERROR] ${ruta}: el id "${entrada.id}" se repite en las entradas ${otro + 1} y ${idx + 1}.\n` +
                '        Cada "skill_N_id" debe ser unico en todo el catalogo: taskctl lo usa para\n' +
                '        identificar la skill ganadora en "skills_recomendados".');
        }
        vistos.set(entrada.id, idx);
    });
}
// --- Validadores tipados (mismo criterio que heuristica.ts) -----------
function validarEnteroNoNegativo(donde, clave, valor) {
    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 0, ` +
            `y es ${describirValor(valor)}.\n` +
            '        Escribe el numero sin comillas y sin decimales.');
    }
    return valor;
}
function validarTextoNoVacio(donde, clave, valor) {
    if (typeof valor !== 'string' || valor.trim() === '') {
        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" debe ser texto no vacio, y es ${describirValor(valor)}.`);
    }
    return valor.trim();
}
function validarEnum(donde, clave, valor, permitidos) {
    if (typeof valor !== 'string' || !permitidos.includes(valor)) {
        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" tiene el valor ${describirValor(valor)}, pero debe ser uno de: ` +
            `${permitidos.join(', ')}.`);
    }
    return valor;
}
/**
 * Lista de textos no vacios ni repetidos. `minimo` distingue
 * `etiquetas` (>=1: una entrada sin etiquetas nunca podria coincidir
 * con ninguna tarea por solape, seria un candidato imposible) de
 * `patrones_archivo` (>=0: vacia es el caso legitimo de un skill que no
 * se enruta por extension de fichero).
 */
function validarListaDeTexto(donde, clave, valor, minimo) {
    if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string')) {
        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" debe ser una lista de textos entre corchetes ` +
            `(p. ej. [a, b]), y es ${describirValor(valor)}.`);
    }
    const entradas = valor.map((x) => x.trim());
    if (entradas.some((x) => x === '')) {
        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" tiene alguna entrada vacia.`);
    }
    const repetida = entradas.find((x, i) => entradas.indexOf(x) !== i);
    if (repetida !== undefined) {
        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" tiene la entrada "${repetida}" repetida.`);
    }
    if (entradas.length < minimo) {
        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
            '        Una entrada de catalogo sin etiquetas nunca puede coincidir con ninguna\n' +
            '        tarea por solape: seria un candidato imposible. Anadele al menos una.');
    }
    return entradas;
}
function describirValor(valor) {
    if (valor === null)
        return 'un valor vacio';
    if (Array.isArray(valor))
        return `una lista (${JSON.stringify(valor)})`;
    if (typeof valor === 'string')
        return `el texto "${valor}"`;
    return `${String(valor)} (${typeof valor})`;
}
function mensajeClaveAusente(ruta, clave) {
    return (`[ERROR] ${ruta}: falta la clave obligatoria "${clave}".\n` +
        `        Anade la linea "${clave}: <valor>" o restaura el catalogo que trae el plugin.`);
}
function mensajeClaveRepetida(donde, clave) {
    return (`[ERROR] ${donde}: la clave "${clave}" esta repetida.\n` +
        '        Deja solo una: con dos, el fichero dice una cosa y taskctl usaria otra.');
}
/**
 * Enumera las claves validas y, si la escrita se parece a una de ellas,
 * la propone. El universo de claves aqui es dinamico (depende de
 * `total_skills`), a diferencia de CLAVES_HEURISTICA.
 */
function mensajeClaveDesconocida(donde, clave, validas) {
    const sugerida = claveMasParecida(clave, validas);
    const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
    if (sugerida !== null)
        lineas.push(`        Quiza quisiste decir "${sugerida}".`);
    lineas.push('        Borrala o corrigela: taskctl no usa un catalogo que no entiende.');
    lineas.push('        Si es una entrada nueva, recuerda subir "total_skills" para que su bloque cuente.');
    return lineas.join('\n');
}
function claveMasParecida(clave, validas) {
    let mejor = null;
    let mejorDistancia = Number.POSITIVE_INFINITY;
    for (const valida of validas) {
        const d = distanciaEdicion(clave.toLowerCase(), valida);
        if (d < mejorDistancia) {
            mejorDistancia = d;
            mejor = valida;
        }
    }
    return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
}
/** Distancia de edicion (Levenshtein) a mano — cero dependencias. */
function distanciaEdicion(a, b) {
    let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        const actual = [i];
        for (let j = 1; j <= b.length; j++) {
            const coste = a[i - 1] === b[j - 1] ? 0 : 1;
            actual[j] = Math.min(actual[j - 1] + 1, previa[j] + 1, previa[j - 1] + coste);
        }
        previa = actual;
    }
    return previa[b.length];
}
/**
 * Paso 1 de 6.6: cruza `task.etiquetas` contra las `etiquetas` de cada
 * entrada del catalogo. Candidatos = solape > 0. Desempate: primero por
 * mayor solape, despues por mayor `prioridad` (16.4.1). Si sigue habiendo
 * empate, se devuelve ese conjunto para el LLM.
 *
 * NO filtra por `rol`: plan-final.md no lo pide, y limitar aqui a
 * rol=ejecucion dejaria fuera candidatos "ambos" sin ninguna razon
 * documentada. Si algun dia hace falta, que sea una decision explicita
 * y no un olvido — mismo criterio de "decirlo, no disimularlo" que sigue
 * heuristica.ts con sus claves sin consumidor.
 *
 * Cero candidatos con solape > 0 es un resultado VALIDO (catalogo no
 * exhaustivo por diseño): se devuelve `ganador: null, regla: null,
 * candidatosEmpatados: []`, y quien llame decide como avisarlo.
 */
export function seleccionarSkill(task, catalogo) {
    const etiquetasTarea = new Set(task.etiquetas);
    const conSolape = catalogo
        .map((entrada) => ({
        entrada,
        solape: entrada.etiquetas.filter((e) => etiquetasTarea.has(e)).length,
    }))
        .filter((x) => x.solape > 0);
    if (conSolape.length === 0) {
        return { ganador: null, regla: null, candidatosEmpatados: [] };
    }
    const solapeMax = Math.max(...conSolape.map((x) => x.solape));
    const porSolape = conSolape.filter((x) => x.solape === solapeMax).map((x) => x.entrada);
    if (porSolape.length === 1) {
        return { ganador: porSolape[0], regla: 'solape', candidatosEmpatados: [] };
    }
    const prioridadMax = Math.max(...porSolape.map((e) => e.prioridad));
    const porPrioridad = porSolape.filter((e) => e.prioridad === prioridadMax);
    if (porPrioridad.length === 1) {
        return {
            ganador: porPrioridad[0],
            regla: 'prioridad',
            candidatosEmpatados: [],
        };
    }
    return { ganador: null, regla: null, candidatosEmpatados: porPrioridad };
}
