/**
 * Catalogo de revisores por dominio y clasificador de ficheros (TASK-018).
 *
 * `taskctl review` invocaba siempre el mismo agente declarado en
 * `tarea.md` (`agente_revisor`), sin mirar que toca de verdad el diff.
 * TASK-032 (D6/D7) dejo cuatro skills revisoras con `patrones_archivo`,
 * `fallback` y `umbral_dominios` declarados en un bloque ```yaml de su
 * SKILL.md, pero SOLO como texto: el unico lector que existia era el
 * helper `bloqueYaml()` de test/skills/revisores.test.ts, sin ningun
 * lector de produccion. Este modulo es ese lector, promovido desde el
 * test (que ahora importa `extraerBloqueYaml`/`parseBloqueRevisor` de
 * aqui en vez de llevar su propia copia).
 *
 * DOS PIEZAS, a proposito en el mismo fichero pero con responsabilidad
 * distinta:
 *
 * 1. `cargarCatalogoRevisores` — I/O: lee `skills/*` cada vez que se
 *    llama, SIN CACHE. Ya paso dos veces (angular-vue,
 *    docs/contexto/HALLAZGOS.md) que una copia congelada de estos
 *    patrones divergiera de la skill real; releer en cada ejecucion es
 *    la unica forma de que eso no vuelva a pasar en silencio.
 * 2. `clasificarPorDominio` — PURA: ficheros -> grupos de revision,
 *    aplicando el umbral. No toca disco ni Git; se prueba aislada en
 *    test/core/revisores.test.ts, sin repos temporales.
 *
 * Mismo criterio fail-closed que catalogo-skills.ts: un bloque yaml mal
 * formado en una skill que SI declara `rol: revisor` aborta taskctl
 * entero, no degrada en silencio al generico.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseBloqueClaveValor } from './frontmatter.js';
export class CatalogoRevisoresError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CatalogoRevisoresError';
    }
}
function packageRoot() {
    // dist/src/core/revisores.js -> dist/src/core -> dist/src -> dist -> raiz
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    return path.join(moduleDir, '..', '..', '..');
}
/**
 * Ruta de `skills/`. Mismo patron que resolverRutaCatalogoSkills():
 * respeta CLAUDE_PLUGIN_ROOT si esta definida; si no, la calcula
 * relativa al propio modulo compilado.
 */
export function resolverRutaSkills() {
    const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
    if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
        return path.join(pluginRoot, 'skills');
    }
    return path.join(packageRoot(), 'skills');
}
/**
 * Lineas del PRIMER bloque ```yaml del cuerpo de una skill, o null si no
 * hay ninguno (abierto sin cerrar cuenta como "ninguno": sin un cierre
 * no hay un bloque que parsear). Promovido tal cual desde el helper
 * `bloqueYaml()` de test/skills/revisores.test.ts (TASK-018, paso 2 del
 * orden de construccion): esa era la unica logica de lectura que existia,
 * y vivia solo en el test.
 */
export function extraerBloqueYaml(texto) {
    const lineas = texto.split(/\r?\n/);
    const ini = lineas.findIndex((l) => l.trim() === '```yaml');
    if (ini === -1)
        return null;
    const fin = lineas.findIndex((l, i) => i > ini && l.trim() === '```');
    if (fin === -1)
        return null;
    return lineas.slice(ini + 1, fin);
}
/**
 * Parsea las lineas de un bloque yaml de skill con el UNICO parser que
 * hay en el repo (mismo que frontmatter.ts y catalogo-skills.ts). No
 * conoce el resto del contrato de una skill revisora (rol, patrones...);
 * eso lo valida quien llama, con su propio mensaje de error.
 */
export function parseBloqueRevisor(lineas, opciones) {
    const { data } = parseBloqueClaveValor(lineas, 0, {
        etiqueta: opciones.etiqueta,
        permitirComentariosDeLinea: true,
        crearError: opciones.crearError,
    });
    return data;
}
/**
 * EL punto de resolucion del catalogo de revisores. Recorre `skillsDir`
 * (por defecto `resolverRutaSkills()`), y para cada subdirectorio con un
 * `SKILL.md` que declare un bloque ```yaml con `rol: revisor` decide si
 * es un revisor DE DOMINIO (tiene `patrones_archivo` no vacio) o EL
 * generico (`fallback: true`, con `umbral_dominios`).
 *
 * Un directorio de skills/ sin SKILL.md, o cuyo SKILL.md no trae ningun
 * bloque ```yaml con `rol: revisor` (p. ej. `task-workflow/`, que no es
 * un revisor), simplemente no participa — no es un error, es el caso
 * normal de una skill que no enruta nada.
 *
 * Fail-closed en lo que SI declara ser un revisor: un `patrones_archivo`
 * que no parsea como lista de texto, mas de un `fallback: true`, o un
 * `umbral_dominios` que no es un entero >= 1, abortan con
 * CatalogoRevisoresError. Que NINGUNA skill declare `fallback: true`
 * tambien aborta: sin un generico no hay adonde caer cuando el diff no
 * casa ningun dominio, y taskctl review quedaria sin forma de generar
 * ninguna peticion.
 */
export function cargarCatalogoRevisores(skillsDir) {
    const dir = skillsDir ?? resolverRutaSkills();
    let entradas;
    try {
        entradas = readdirSync(dir).sort();
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new CatalogoRevisoresError(`[ERROR] No se pudo leer el directorio de skills "${dir}": ${msg}\n` +
            '        Las skills revisoras las trae el plugin. Reinstalalo, o define\n' +
            '        CLAUDE_PLUGIN_ROOT apuntando a la raiz del plugin si lo ejecutas desde otro sitio.');
    }
    const dominio = [];
    let generico = null;
    for (const nombre of entradas) {
        const rutaSkill = path.join(dir, nombre, 'SKILL.md');
        let texto;
        try {
            texto = readFileSync(rutaSkill, 'utf8');
        }
        catch {
            continue; // no toda carpeta de skills/ trae un SKILL.md legible.
        }
        const bloque = extraerBloqueYaml(texto);
        if (bloque === null)
            continue; // sin bloque yaml, no es un revisor.
        const data = parseBloqueRevisor(bloque, {
            etiqueta: `SKILL.md de ${nombre}`,
            crearError: (msg) => new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: ${msg}`),
        });
        if (data['rol'] !== 'revisor')
            continue;
        const patrones = data['patrones_archivo'];
        if (!Array.isArray(patrones) || !patrones.every((p) => typeof p === 'string')) {
            throw new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: "patrones_archivo" debe ser una lista de textos entre corchetes ` +
                `(p. ej. [a, b]), y es ${JSON.stringify(patrones)}.`);
        }
        if (data['fallback'] === true) {
            if (generico !== null) {
                throw new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: hay mas de un revisor declarado "fallback: true" (el otro es ` +
                    `"${generico.nombre}"). Solo puede haber uno: si hay dos, no se sabe cual usar cuando ` +
                    'ningun dominio casa.');
            }
            const umbral = data['umbral_dominios'];
            if (typeof umbral !== 'number' || !Number.isInteger(umbral) || umbral < 1) {
                throw new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: "umbral_dominios" debe ser un numero entero mayor o igual que 1, ` +
                    `y es ${JSON.stringify(umbral)}.`);
            }
            generico = { nombre, umbralDominios: umbral };
            continue;
        }
        if (patrones.length === 0) {
            throw new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: declara "rol: revisor" sin "fallback: true" y con ` +
                '"patrones_archivo" vacio: no se le podria enrutar nada nunca. Si es el revisor ' +
                'generico, anade "fallback: true" y "umbral_dominios"; si no, dale al menos un patron.');
        }
        dominio.push({ nombre, patronesArchivo: patrones });
    }
    if (generico === null) {
        throw new CatalogoRevisoresError(`[ERROR] Ningun revisor bajo "${dir}" se declara "fallback: true". Hace falta exactamente ` +
            'uno: es el que cubre un diff que no casa ningun dominio, o que casa mas del umbral.');
    }
    return { dominio, generico };
}
/**
 * Clasifica `ficheros` (rutas con "/" de Git, tal como las emite
 * `git diff --name-only`) contra `catalogo`, y decide como se reparte la
 * revision (TASK-018, criterios de aceptacion 1, 2 y 4). PURA: nada de
 * I/O aqui, para poder probarla sin repos Git temporales (ver
 * test/core/revisores.test.ts).
 *
 * Regla del umbral, INCLUSIVE (decision de Carlos, 2026-09-12): con
 * exactamente `umbral_dominios` dominios detectados se fragmenta en esa
 * cantidad de revisores; con uno mas, cae al generico con el diff/lista
 * de ficheros completa. Con CERO dominios detectados (nada caso, o el
 * diff esta vacio) tambien cae al generico — es la misma rama de
 * "no fragmentar", no un caso aparte.
 *
 * Un fichero que no casa NINGUN patron de dominio, y uno que casa MAS DE
 * UNO (no deberia darse hoy: revisores.test.ts, test 6, exige patrones
 * sin solape entre las skills de dominio; se deja documentado por si esa
 * garantia se rompe algun dia) van a la MISMA bolsa: "sin dominio claro".
 * Si tras clasificar TODOS los ficheros la ronda queda fragmentada (1 a
 * `umbral_dominios` dominios), esa bolsa la cubre el revisor generico
 * COMO UN GRUPO MAS — nunca se queda sin revisor (criterio de aceptacion
 * 4). Si la ronda no se fragmenta, esa distincion no importa: el
 * generico ya se lleva el diff completo.
 *
 * Renombrar entre ecosistemas (`git mv Foo.java Foo.cs`): el brainstorm
 * de riesgos propuso clasificar por AMBAS rutas del `--name-status` y
 * mandar al generico si discrepan; se evalua y se descarta (hallazgo
 * MENOR de revision por pares, ronda 1). `diffNameOnly` (fs/git.ts) usa
 * `--name-only`, que colapsa el rename a la ruta FINAL; esta funcion
 * clasifica por esa unica ruta. Verificado que no se pierde informacion:
 * el fichero se revisa completo (como alta) bajo el dominio de su ruta
 * final, que es una lectura razonable y mas simple que la propuesta
 * original.
 */
export function clasificarPorDominio(ficheros, catalogo) {
    const porDominio = new Map();
    const sinDominioClaro = [];
    for (const fichero of ficheros) {
        const reclamantes = catalogo.dominio.filter((r) => r.patronesArchivo.some((patron) => path.matchesGlob(fichero, patron)));
        if (reclamantes.length === 1) {
            const nombre = reclamantes[0].nombre;
            const lista = porDominio.get(nombre) ?? [];
            lista.push(fichero);
            porDominio.set(nombre, lista);
        }
        else {
            sinDominioClaro.push(fichero);
        }
    }
    const numDominios = porDominio.size;
    if (numDominios === 0 || numDominios > catalogo.generico.umbralDominios) {
        return {
            fragmentado: false,
            grupos: [{ revisor: catalogo.generico.nombre, ficheros }],
        };
    }
    const grupos = [...porDominio.entries()].map(([revisor, fs]) => ({
        revisor,
        ficheros: fs,
    }));
    if (sinDominioClaro.length > 0) {
        grupos.push({ revisor: catalogo.generico.nombre, ficheros: sinDominioClaro });
    }
    return { fragmentado: true, grupos };
}
