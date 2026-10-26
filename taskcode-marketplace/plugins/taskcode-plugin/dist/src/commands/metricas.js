/**
 * taskctl metricas — tabla de fases por tarea (TASK-052). Solo lectura,
 * con el patron de `board`: no escribe nada ni cambia de rama, asi que no
 * aplica la precondicion de rama base.
 *
 * Lee cada tarea, los nombres de su `revision/` y, solo si alguna tarea no
 * tiene registro de Transiciones, UN `git log` para todas (nunca uno por
 * tarea). Si git no esta o el directorio no es un repo, esas tareas salen
 * con «—» y un aviso; el comando no falla por eso.
 *
 * `--heuristica` anade la puntuacion y el nivel que da la heuristica
 * vigente a las tareas terminadas con informes de revision (las demas no
 * entran en la muestra), y un resumen por nivel declarado y heuristico con
 * las rondas medias: es la tabla con la que se recalibra el YML.
 *
 * `--tokens` (TASK-023) anade las columnas de coste en tokens por fase y,
 * debajo, un resumen por sprint y por complejidad declarada. Con
 * `--escribir` regenera ademas, en docs/METRICAS.md, SOLO el bloque entre
 * sus dos marcadores HTML (sin commitear, como `board --escribir`: lo
 * commitea quien lo pide, o el siguiente comando que commitee ese fichero).
 * Es lo unico que este comando escribe, y solo con `--escribir`.
 *
 * TASK-064: lee SIEMPRE los informes de revision de cada tarea (una pasada,
 * sin git) para contar sus hallazgos, y el tamano de sus peticiones de
 * revision. Las incoherencias del desglose de coste, las severidades fuera
 * de vocabulario y los informes sin tabla salen como avisos; ninguno impide
 * `--escribir` (solo lo impide un tarea.md invalido, que dejaria el bloque
 * incompleto).
 *
 * TASK-065: `--repo <ruta>` (repetible) junta varios proyectos; cada fila
 * lleva su proyecto y toda la lectura va con la clave (proyecto, id), asi que
 * un mismo TASK-NNN en dos repos no mezcla datos. Sin `--repo` se lee el repo
 * actual y la salida es la de siempre.
 */
import path from 'node:path';
import { readdir, readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
import { parseArgs, rechazarFlagsDesconocidos, extraerRepetible } from '../cli/args.js';
import { FrontmatterParseError } from '../core/frontmatter.js';
import { TaskValidationError, TASK_COMPLEXITIES } from '../core/task.js';
import { cargarHeuristica, nivelHeuristico, puntuarTarea } from '../core/heuristica.js';
import { leerTransiciones } from '../core/transiciones.js';
import { COLUMNAS_HEURISTICA, COLUMNAS_METRICAS, COLUMNAS_TOKENS, COLUMNAS_DESGLOSE_TOKENS, COLUMNA_PROYECTO, NOTA_DESGLOSE_TOKENS, avisosDeFila, avisoInformesSinTabla, claveTarea, etiquetaTarea, notasFilaEnriquecida, BloqueTokensError, NOTA_TOKENS, renderBloqueTokens, resumenesTokens, sustituirBloqueTokens, calcularFila, enMuestraHeuristica, formatearResumen, formatearTabla, parsearLogGit, resumirPorNivel, resumenSinCoste, } from '../core/metricas.js';
import { INFORME_REVISION_RE, PETICION_REVISION_RE, nombresDeUltimaRonda, rondaYRevisorDeInforme, } from '../fs/rondas.js';
import { listExistingTaskIds, readTareaFile, isEnoent, isEnotdir } from '../fs/task-store.js';
import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';
import { TRAMO_POR_DEFECTO, calcularEvolucion, formatearEvolucion } from '../core/evolucion.js';
import { calcularGrupos, formatearGrupos } from '../core/grupos-metricas.js';
export class MetricasCommandError extends Error {
}
export const FLAGS_METRICAS = [
    '--heuristica',
    '--tokens',
    '--escribir',
    '--repo',
    '--evolucion',
    '--tramo',
    '--grupos',
    '--json',
];
/**
 * TASK-065: los unicos flags que se combinan con `--json`. Con cualquier otro
 * (`--escribir`, `--tokens`, `--heuristica`) aborta antes de leer ni escribir
 * nada: su salida es texto o un fichero, y mezclarla con el JSON romperia a
 * quien lo lea.
 */
export const FLAGS_CON_JSON = ['--repo', '--evolucion', '--tramo', '--grupos'];
/** Ruta de docs/METRICAS.md dentro del repo del usuario. */
export function metricasFilePath(repoCwd) {
    return path.join(repoCwd, 'docs', 'METRICAS.md');
}
/** MENOR-2 de la revision: hay tareas, pero ninguna entra en la muestra. */
export const MUESTRA_HEURISTICA_VACIA = 'n=0: ninguna tarea terminada con informes de revision; no hay muestra con la que ' +
    'comparar la heuristica. Sin --heuristica salen todas las tareas.';
const NOTA_CALENDARIO = 'Duraciones de calendario: diseno = plan->start, curso = start->primer review, ' +
    'revision = primer review->finish. Las pausas no se descuentan. Con origen "registro" ' +
    'de filas antiguas (solo el dia) o mezcladas, la duracion va en dias ("N d").';
/** `--tramo N`: entero >= 1 (por defecto 20); cualquier otra cosa aborta. */
function leerTramo(raw, conEvolucion) {
    if (raw === undefined)
        return TRAMO_POR_DEFECTO;
    if (!conEvolucion) {
        throw new MetricasCommandError('[ERROR] --tramo solo se admite con --evolucion: es el numero de tareas de cada tramo ' +
            '(taskctl metricas --evolucion --tramo 10).');
    }
    if (typeof raw !== 'string' || !/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < 1) {
        throw new MetricasCommandError(`[ERROR] --tramo ${typeof raw === 'string' ? `"${raw}" no es` : 'necesita'} un entero de 1 o mas: ` +
            `las tareas de cada tramo (por defecto ${String(TRAMO_POR_DEFECTO)}). No se ha leido nada.`);
    }
    return Number(raw);
}
function flagSuelto(flags, nombre) {
    const raw = flags[nombre];
    if (raw === undefined)
        return false;
    if (raw !== true) {
        throw new MetricasCommandError(`[ERROR] --${nombre} no lleva valor: usalo suelto (taskctl metricas --${nombre}).`);
    }
    return true;
}
function parseFlagsMetricas(argv) {
    const { valores: repos, resto } = extraerRepetible(argv, '--repo', () => new MetricasCommandError('[ERROR] --repo necesita la ruta de un repo con carpeta "tareas" (taskctl metricas --repo <ruta>); ' +
        'repitelo para juntar varios proyectos.'));
    const { flags, positional } = parseArgs(resto);
    if (positional.length > 0) {
        throw new MetricasCommandError(`[ERROR] taskctl metricas no admite argumentos sueltos ("${positional.join(' ')}"). ` +
            'Saca la tabla de todas las tareas; para una sola, filtra la salida.');
    }
    const json = flagSuelto(flags, 'json');
    if (json) {
        const otros = Object.keys(flags)
            .map((k) => `--${k}`)
            .filter((k) => k !== '--json' && !FLAGS_CON_JSON.includes(k));
        if (otros.length > 0) {
            throw new MetricasCommandError(`[ERROR] --json no se combina con ${otros.join(', ')}: solo con ${FLAGS_CON_JSON.join(', ')}. ` +
                'Quita uno de los dos; no se ha leido ni escrito nada.');
        }
    }
    const f = {
        heuristica: flagSuelto(flags, 'heuristica'),
        tokens: flagSuelto(flags, 'tokens'),
        escribir: flagSuelto(flags, 'escribir'),
        repos,
        evolucion: null,
        grupos: flagSuelto(flags, 'grupos'),
        json,
    };
    const conEvolucion = flagSuelto(flags, 'evolucion');
    const tramo = leerTramo(flags['tramo'], conEvolucion);
    if (conEvolucion)
        f.evolucion = tramo;
    if (conEvolucion || f.grupos) {
        // Los agregados sustituyen a la tabla por tarea: lo que anaden --heuristica
        // y --tokens (columnas y resumenes de esa tabla) no saldria en ningun sitio.
        const choca = ['heuristica', 'tokens', 'escribir'].filter((k) => f[k]);
        if (choca.length > 0) {
            const agregado = conEvolucion ? '--evolucion' : '--grupos';
            throw new MetricasCommandError(`[ERROR] ${agregado} no se combina con ${choca.map((k) => `--${k}`).join(' ni ')}: saca agregados ` +
                'en lugar de la tabla por tarea. Lanzalos por separado.');
        }
    }
    if (f.escribir && !f.tokens) {
        throw new MetricasCommandError('[ERROR] --escribir solo se admite con --tokens: lo que regenera es el bloque de coste en ' +
            'tokens de docs/METRICAS.md (taskctl metricas --tokens --escribir).');
    }
    // Como board: docs/METRICAS.md lleva la tabla COMPLETA; con la muestra de
    // --heuristica (solo terminadas con informes) dejaria un bloque parcial que
    // parece el entero.
    if (f.escribir && f.heuristica) {
        throw new MetricasCommandError('[ERROR] --escribir no se puede combinar con --heuristica: el bloque de docs/METRICAS.md ' +
            'lleva todas las tareas, y --heuristica las reduce a las terminadas con informes. ' +
            'Quita --heuristica, o quita --escribir para verlo por pantalla.');
    }
    // TASK-065: --escribir regenera docs/METRICAS.md del repo actual; con --repo
    // no esta claro de cual, asi que no se escribe nada.
    if (f.escribir && repos.length > 0) {
        throw new MetricasCommandError('[ERROR] --repo no se combina con --escribir: el bloque de docs/METRICAS.md es del repo donde ' +
            'ejecutas el comando. Quita --repo y ejecutalo desde ese repo, o quita --escribir para ' +
            'verlo por pantalla. No se ha tocado nada.');
    }
    return f;
}
async function nombresDeRevision(dirTarea) {
    try {
        return await readdir(path.join(dirTarea, 'revision'));
    }
    catch (e) {
        if (isEnoent(e) || isEnotdir(e))
            return [];
        throw e;
    }
}
/** Informes de revision (todas las rondas) y bytes de cada peticion, de una pasada. */
async function leerRevision(dirTarea, nombres) {
    const dir = path.join(dirTarea, 'revision');
    const informes = [];
    const peticiones = [];
    for (const nombre of nombres) {
        const inf = rondaYRevisorDeInforme(nombre);
        if (inf !== null) {
            informes.push({ fichero: nombre, ...inf, texto: await readFile(path.join(dir, nombre), 'utf8') });
            continue;
        }
        const m = PETICION_REVISION_RE.exec(nombre);
        if (m !== null)
            peticiones.push({ ronda: Number(m[1]), bytes: (await stat(path.join(dir, nombre))).size });
    }
    return { informes, peticiones };
}
/** Un solo git log para todo el repo; null si git no se pudo consultar. */
function eventosGit(repoCwd) {
    try {
        return parsearLogGit(runGit(['log', '--all', '--format=%at%x09%s'], repoCwd));
    }
    catch (e) {
        if (e instanceof GitCommandError || e instanceof GitLaunchError)
            return null;
        throw e;
    }
}
/** Clave con la que se comparan dos rutas reales: en Windows, sin distinguir mayusculas. */
function claveRuta(ruta) {
    return process.platform === 'win32' ? ruta.toLowerCase() : ruta;
}
/**
 * Los repos de `--repo` (TASK-065), validados ANTES de leer nada: cada ruta
 * (relativa a `base`) debe existir y tener carpeta `tareas`. Se normalizan con
 * la ruta real, asi que la misma carpeta escrita dos veces (otra grafia, otras
 * mayusculas en Windows, un enlace) se lee una vez y lo dice un aviso; dos
 * carpetas distintas con el mismo nombre abortan, porque el proyecto se llama
 * como su carpeta y sus tareas se confundirian.
 */
export async function resolverRepos(valores, base) {
    const repos = [];
    const avisos = [];
    const porRuta = new Map();
    const porNombre = new Map();
    for (const valor of valores) {
        const ruta = path.resolve(base, valor);
        let real;
        try {
            real = await realpath(ruta);
        }
        catch (e) {
            if (!isEnoent(e) && !isEnotdir(e))
                throw e;
            throw new MetricasCommandError(`[ERROR] --repo "${valor}": no existe ${ruta}. Revisa la ruta; no se ha leido nada.`);
        }
        const tareasRoot = path.join(real, 'tareas');
        let esCarpeta = false;
        try {
            esCarpeta = (await stat(tareasRoot)).isDirectory();
        }
        catch (e) {
            if (!isEnoent(e) && !isEnotdir(e))
                throw e;
        }
        if (!esCarpeta) {
            throw new MetricasCommandError(`[ERROR] --repo "${valor}": ${real} no tiene carpeta "tareas", asi que no es la raiz de un repo ` +
                'con tareas. Pasa la raiz del repo; no se ha leido nada.');
        }
        const previo = porRuta.get(claveRuta(real));
        if (previo !== undefined) {
            avisos.push(`--repo "${valor}" es la misma carpeta que --repo "${previo}" (${real}): se lee una sola vez.`);
            continue;
        }
        const proyecto = path.basename(real);
        const otro = porNombre.get(claveRuta(proyecto));
        if (otro !== undefined) {
            throw new MetricasCommandError(`[ERROR] --repo: ${otro} y ${real} se llaman igual ("${proyecto}"), y el proyecto de cada tarea ` +
                'es el nombre de su carpeta: sus tareas se confundirian. Mide uno de los dos, o renombra ' +
                'o clona uno con otro nombre. No se ha leido nada.');
        }
        porRuta.set(claveRuta(real), valor);
        porNombre.set(claveRuta(proyecto), real);
        repos.push({ proyecto, ruta: real, tareasRoot });
    }
    return { repos, avisos };
}
/**
 * Lee UN repo (TASK-065): sus tareas, sus informes y peticiones de revision
 * y, solo si alguna tarea no tiene registro de Transiciones, un `git log`.
 * Cada fila lleva su proyecto, asi que juntar varios repos no cruza tareas
 * con el mismo ID. `varios` solo cambia como se nombran las tareas en los
 * avisos (`proyecto/ID`).
 */
export async function leerRepoMetricas(repo, varios) {
    const advertencias = [];
    const invalidas = [];
    const { proyecto, tareasRoot } = repo;
    const ids = [...new Set(await listExistingTaskIds(tareasRoot))].sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
    const leidas = [];
    for (const id of ids) {
        try {
            const read = await readTareaFile(tareasRoot, id);
            if (read === null)
                continue;
            const dirTarea = path.dirname(read.filePath);
            const nombres = await nombresDeRevision(dirTarea);
            leidas.push({
                task: read,
                ronda: nombresDeUltimaRonda(nombres, INFORME_REVISION_RE).ronda,
                ...(await leerRevision(dirTarea, nombres)),
            });
        }
        catch (e) {
            if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
                const aviso = `${etiquetaTarea({ proyecto, id }, varios)} tiene un tarea.md invalido y no aparece en las ` +
                    `metricas: ${e.message}`;
                advertencias.push(aviso);
                invalidas.push(aviso);
                continue;
            }
            throw e;
        }
    }
    // git solo si hace falta, y una sola vez por repo.
    const sinRegistro = leidas.some((l) => leerTransiciones(l.task.body).length === 0);
    let porId = new Map();
    if (sinRegistro) {
        const eventos = eventosGit(repo.ruta);
        if (eventos === null) {
            advertencias.push(varios
                ? `${proyecto}: no se pudo consultar git log en ${repo.ruta}: sus tareas sin registro de ` +
                    'Transiciones salen con "—" (y sin fecha de cierre). Comprueba que es un repo git.'
                : 'No se pudo consultar git log: las tareas sin registro de Transiciones salen con "—". ' +
                    'Ejecuta taskctl metricas desde la raiz del repo.');
        }
        else {
            porId = new Map();
            for (const ev of eventos) {
                const lista = porId.get(ev.id) ?? [];
                lista.push(ev);
                porId.set(ev.id, lista);
            }
        }
    }
    const filas = leidas.map((l) => calcularFila({
        task: l.task.task,
        body: l.task.body,
        ronda: l.ronda,
        eventosGit: porId.get(l.task.task.id) ?? [],
        proyecto,
        informes: l.informes,
        peticiones: l.peticiones,
    }));
    // Los avisos de las filas, sobre TODAS las tareas (tambien con --heuristica).
    for (const f of filas)
        advertencias.push(...avisosDeFila(f, varios));
    return { leidas: leidas.map((l) => l.task), filas, advertencias, invalidas };
}
export async function runMetricasCommand(tareasRoot, argv, deps) {
    rechazarFlagsDesconocidos(argv, FLAGS_METRICAS, 'metricas', (m) => new MetricasCommandError(m));
    const { heuristica: conHeuristica, tokens: conTokens, escribir, repos: valoresRepo, evolucion: tramoEvolucion, grupos: conGrupos, json, } = parseFlagsMetricas(argv);
    // Como board --escribir: sin tareas/ en este directorio no se crea un
    // docs/METRICAS.md fantasma.
    if (escribir) {
        try {
            await stat(tareasRoot);
        }
        catch (e) {
            if (!isEnoent(e))
                throw e;
            throw new MetricasCommandError(`[ERROR] No existe "${tareasRoot}", asi que esto no parece la raiz de un repo con tareas. ` +
                'Ejecuta "taskctl metricas --tokens --escribir" desde la raiz del repo (donde esta la ' +
                'carpeta "tareas"), no desde una subcarpeta.');
        }
    }
    // TASK-065: los --repo se validan antes de leer nada. Sin --repo, el repo
    // actual tal cual (la salida de siempre).
    const advertencias = [];
    let repos;
    if (valoresRepo.length === 0) {
        repos = [{ proyecto: path.basename(path.resolve(deps.repoCwd)), ruta: deps.repoCwd, tareasRoot }];
    }
    else {
        const r = await resolverRepos(valoresRepo, deps.repoCwd);
        repos = r.repos;
        advertencias.push(...r.avisos);
    }
    const varios = repos.length > 1;
    // La heuristica se carga ANTES de leer nada: un YML roto aborta sin
    // haber sacado media tabla.
    const h = conHeuristica ? cargarHeuristica(deps.rutaHeuristica) : null;
    /** Solo los tarea.md invalidos: son lo unico que impide --escribir. */
    const invalidas = [];
    let filas = [];
    /** Tarea leida de cada fila, por clave (proyecto, id). */
    const leidaPorClave = new Map();
    const porRepo = [];
    for (const repo of repos) {
        const r = await leerRepoMetricas(repo, varios);
        advertencias.push(...r.advertencias);
        invalidas.push(...r.invalidas);
        r.filas.forEach((f, i) => leidaPorClave.set(claveTarea(f.proyecto, f.id), r.leidas[i]));
        filas.push(...r.filas);
        porRepo.push(`${repo.proyecto} (${String(r.filas.length)} tareas, ${repo.ruta})`);
    }
    const reposLeidos = valoresRepo.length === 0 ? null : `Repos leidos: ${porRepo.join('; ')}.`;
    const sinTabla = avisoInformesSinTabla(filas, varios);
    if (sinTabla !== null)
        advertencias.push(sinTabla);
    const proyectos = repos.map((r) => r.proyecto);
    // TASK-065: --json da UN objeto, tambien sin tareas: los repos leidos, las
    // terminadas sin coste (la lista completa) y, si se piden, la evolucion y
    // los grupos. Los avisos siguen por stderr.
    if (json) {
        const objeto = {
            proyectos: repos.map((r) => ({
                proyecto: r.proyecto,
                ruta: r.ruta,
                tareas: filas.filter((f) => f.proyecto === r.proyecto).length,
            })),
            sinCoste: resumenSinCoste(filas),
            ...(tramoEvolucion === null ? {} : { evolucion: calcularEvolucion(filas, tramoEvolucion) }),
            ...(conGrupos ? { grupos: calcularGrupos(filas, proyectos) } : {}),
        };
        return {
            output: JSON.stringify(objeto),
            totalTareas: filas.length,
            advertencias,
            metricasPath: null,
            escritura: null,
            reposLeidos,
            json: true,
        };
    }
    // TASK-065: los agregados sustituyen a la tabla por tarea, y salen tambien
    // sin tareas (con sus ceros y sus n 0 a la vista).
    if (tramoEvolucion !== null || conGrupos) {
        const secciones = [];
        if (tramoEvolucion !== null)
            secciones.push(formatearEvolucion(calcularEvolucion(filas, tramoEvolucion), varios));
        if (conGrupos)
            secciones.push(formatearGrupos(calcularGrupos(filas, proyectos)));
        return {
            output: secciones.join('\n\n'),
            totalTareas: filas.length,
            advertencias,
            metricasPath: null,
            escritura: null,
            reposLeidos,
            json: false,
        };
    }
    if (filas.length === 0) {
        return { output: '', totalTareas: 0, advertencias, metricasPath: null, escritura: null, reposLeidos, json: false };
    }
    const columnas = [
        ...(varios ? [COLUMNA_PROYECTO] : []),
        ...COLUMNAS_METRICAS,
        ...(conTokens ? [...COLUMNAS_TOKENS, ...COLUMNAS_DESGLOSE_TOKENS] : []),
    ];
    /** Los resumenes de tokens sobre las filas que salgan (con --heuristica, la muestra). */
    const seccionTokens = (f) => {
        if (!conTokens)
            return [];
        const r = resumenesTokens(f);
        return [
            'Coste en tokens por sprint:',
            r.porSprint,
            '',
            'Coste en tokens por complejidad declarada:',
            r.porComplejidad,
            '',
            NOTA_TOKENS,
            NOTA_DESGLOSE_TOKENS,
            '',
        ];
    };
    let metricasPath = null;
    let escritura = null;
    if (escribir) {
        if (invalidas.length > 0) {
            throw new MetricasCommandError('[ERROR] No se regenera docs/METRICAS.md con tarea.md invalidos: saldrian del bloque ' +
                `sin que nadie lo vea. Arregla esto y reintenta:\n  ${invalidas.join('\n  ')}`);
        }
        metricasPath = metricasFilePath(deps.repoCwd);
        try {
            let actual = '';
            try {
                actual = await readFile(metricasPath, 'utf8');
            }
            catch (e) {
                if (!isEnoent(e))
                    throw e;
            }
            const nuevo = sustituirBloqueTokens(actual, renderBloqueTokens(filas));
            if (nuevo === actual) {
                escritura = 'sin-cambios';
            }
            else {
                await mkdir(path.dirname(metricasPath), { recursive: true });
                await writeFile(metricasPath, nuevo, 'utf8');
                escritura = actual === '' ? 'creado' : 'actualizado';
            }
        }
        catch (e) {
            if (e instanceof BloqueTokensError)
                throw new MetricasCommandError(e.message);
            const msg = e instanceof Error ? e.message : String(e);
            throw new MetricasCommandError(`No se pudo escribir ${metricasPath}: ${msg}. Comprueba permisos y que "docs" sea una carpeta.`);
        }
    }
    if (h === null) {
        return {
            output: [
                formatearTabla(filas, columnas),
                '',
                ...notasFilaEnriquecida(filas, varios),
                '',
                ...seccionTokens(filas),
                NOTA_CALENDARIO,
            ].join('\n'),
            totalTareas: filas.length,
            advertencias,
            metricasPath,
            escritura,
            reposLeidos,
            json: false,
        };
    }
    filas = filas.filter(enMuestraHeuristica).map((f) => {
        const leida = leidaPorClave.get(claveTarea(f.proyecto, f.id));
        const { puntos } = puntuarTarea(leida.task, leida.body, h);
        return { ...f, heuristica: { puntos, nivel: nivelHeuristico(puntos, h) } };
    });
    if (filas.length === 0) {
        return { output: MUESTRA_HEURISTICA_VACIA, totalTareas: 0, advertencias, metricasPath, escritura, reposLeidos, json: false };
    }
    const coinciden = filas.filter((f) => f.heuristica?.nivel === f.complejidad).length;
    const salida = [
        formatearTabla(filas, [...columnas, ...COLUMNAS_HEURISTICA]),
        '',
        `Muestra: ${String(filas.length)} tareas terminadas con informes de revision ` +
            '(rondas = numero de la ultima ronda; las tareas sin revision/ no entran). ' +
            `Declarado y heuristico coinciden en ${String(coinciden)} de ${String(filas.length)}.`,
        '',
        formatearResumen('Por complejidad declarada:', resumirPorNivel(filas, (f) => f.complejidad, TASK_COMPLEXITIES)),
        '',
        formatearResumen('Por nivel heuristico:', resumirPorNivel(filas, (f) => f.heuristica?.nivel ?? null, TASK_COMPLEXITIES)),
        '',
        ...notasFilaEnriquecida(filas, varios),
        '',
        ...seccionTokens(filas),
        NOTA_CALENDARIO,
    ].join('\n');
    return { output: salida, totalTareas: filas.length, advertencias, metricasPath, escritura, reposLeidos, json: false };
}
