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
 */
import path from 'node:path';
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
import { FrontmatterParseError } from '../core/frontmatter.js';
import { TaskValidationError, TASK_COMPLEXITIES } from '../core/task.js';
import { cargarHeuristica, nivelHeuristico, puntuarTarea } from '../core/heuristica.js';
import { leerTransiciones } from '../core/transiciones.js';
import { COLUMNAS_HEURISTICA, COLUMNAS_METRICAS, COLUMNAS_TOKENS, BloqueTokensError, NOTA_TOKENS, renderBloqueTokens, resumenesTokens, sustituirBloqueTokens, calcularFila, enMuestraHeuristica, formatearResumen, formatearTabla, parsearLogGit, resumirPorNivel, } from '../core/metricas.js';
import { INFORME_REVISION_RE, nombresDeUltimaRonda } from '../fs/rondas.js';
import { listExistingTaskIds, readTareaFile, isEnoent, isEnotdir } from '../fs/task-store.js';
import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';
export class MetricasCommandError extends Error {
}
export const FLAGS_METRICAS = ['--heuristica', '--tokens', '--escribir'];
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
    const { flags, positional } = parseArgs(argv);
    if (positional.length > 0) {
        throw new MetricasCommandError(`[ERROR] taskctl metricas no admite argumentos sueltos ("${positional.join(' ')}"). ` +
            'Saca la tabla de todas las tareas; para una sola, filtra la salida.');
    }
    const f = {
        heuristica: flagSuelto(flags, 'heuristica'),
        tokens: flagSuelto(flags, 'tokens'),
        escribir: flagSuelto(flags, 'escribir'),
    };
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
export async function runMetricasCommand(tareasRoot, argv, deps) {
    rechazarFlagsDesconocidos(argv, FLAGS_METRICAS, 'metricas', (m) => new MetricasCommandError(m));
    const { heuristica: conHeuristica, tokens: conTokens, escribir } = parseFlagsMetricas(argv);
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
    // La heuristica se carga ANTES de leer nada: un YML roto aborta sin
    // haber sacado media tabla.
    const h = conHeuristica ? cargarHeuristica(deps.rutaHeuristica) : null;
    const advertencias = [];
    const ids = [...new Set(await listExistingTaskIds(tareasRoot))].sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
    const leidas = [];
    for (const id of ids) {
        try {
            const read = await readTareaFile(tareasRoot, id);
            if (read === null)
                continue;
            const nombres = await nombresDeRevision(path.dirname(read.filePath));
            leidas.push({ task: read, ronda: nombresDeUltimaRonda(nombres, INFORME_REVISION_RE).ronda });
        }
        catch (e) {
            if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
                advertencias.push(`${id} tiene un tarea.md invalido y no aparece en las metricas: ${e.message}`);
                continue;
            }
            throw e;
        }
    }
    // git solo si hace falta, y una sola vez.
    const sinRegistro = leidas.some((l) => leerTransiciones(l.task.body).length === 0);
    let porId = new Map();
    if (sinRegistro) {
        const eventos = eventosGit(deps.repoCwd);
        if (eventos === null) {
            advertencias.push('No se pudo consultar git log: las tareas sin registro de Transiciones salen con "—". ' +
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
    let filas = leidas.map((l) => calcularFila({
        task: l.task.task,
        body: l.task.body,
        ronda: l.ronda,
        eventosGit: porId.get(l.task.task.id) ?? [],
    }));
    if (filas.length === 0)
        return { output: '', totalTareas: 0, advertencias, metricasPath: null, escritura: null };
    const columnas = conTokens ? [...COLUMNAS_METRICAS, ...COLUMNAS_TOKENS] : COLUMNAS_METRICAS;
    /** Los resumenes de tokens sobre las filas que salgan (con --heuristica, la muestra). */
    const seccionTokens = (f) => {
        if (!conTokens)
            return [];
        const r = resumenesTokens(f);
        return ['Coste en tokens por sprint:', r.porSprint, '', 'Coste en tokens por complejidad declarada:', r.porComplejidad, '', NOTA_TOKENS, ''];
    };
    let metricasPath = null;
    let escritura = null;
    if (escribir) {
        if (advertencias.length > 0) {
            throw new MetricasCommandError('[ERROR] No se regenera docs/METRICAS.md con tarea.md invalidos: saldrian del bloque ' +
                `sin que nadie lo vea. Arregla esto y reintenta:\n  ${advertencias.join('\n  ')}`);
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
            output: [formatearTabla(filas, columnas), '', ...seccionTokens(filas), NOTA_CALENDARIO].join('\n'),
            totalTareas: filas.length,
            advertencias,
            metricasPath,
            escritura,
        };
    }
    const cuerpoPorId = new Map(leidas.map((l) => [l.task.task.id, l.task]));
    filas = filas.filter(enMuestraHeuristica).map((f) => {
        const leida = cuerpoPorId.get(f.id);
        const { puntos } = puntuarTarea(leida.task, leida.body, h);
        return { ...f, heuristica: { puntos, nivel: nivelHeuristico(puntos, h) } };
    });
    if (filas.length === 0) {
        return { output: MUESTRA_HEURISTICA_VACIA, totalTareas: 0, advertencias, metricasPath, escritura };
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
        ...seccionTokens(filas),
        NOTA_CALENDARIO,
    ].join('\n');
    return { output: salida, totalTareas: filas.length, advertencias, metricasPath, escritura };
}
