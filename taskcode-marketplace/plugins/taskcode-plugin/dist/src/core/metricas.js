/**
 * Telemetria de fases (TASK-052): cuanto duro cada fase de una tarea,
 * cuantas rondas de revision necesito y, con `--heuristica`, que nivel le
 * habria dado la heuristica de complejidad vigente.
 *
 * Puro: recibe lo ya leido (la tarea, su cuerpo, los nombres de
 * `revision/`, los eventos de git) y devuelve filas y texto. La E/S vive en
 * `commands/metricas.ts`.
 *
 * DE DONDE SALE CADA MARCA, por orden:
 *  1. `registro`: la tabla `## Transiciones` del propio tarea.md. Desde
 *     TASK-052 cada fila lleva el instante (precision de segundo); las
 *     anteriores solo el dia (precision de dia).
 *  2. `git`: si la tarea no tiene ni una fila, las fechas de autor de los
 *     commits automaticos `chore(TASK-NNN): ...` que deja cada comando.
 *  3. `—`: ni lo uno ni lo otro. Nunca se inventa un 0.
 * El origen es por tarea, no por marca: mezclar dos fuentes en una misma
 * fila daria duraciones entre relojes distintos sin que nadie lo vea.
 *
 * QUE MIDE CADA COLUMNA (calendario, no trabajo):
 *  - diseno: del PRIMER `plan` al primer `start`. El primero y no el
 *    ultimo: un plan repetido es parte del diseno, no lo reinicia.
 *  - curso: del primer `start` al primer `review`.
 *  - revision: del primer `review` al ultimo `finish`.
 * `pausa` no se descuenta: no existe una transicion de «reanudar», asi que
 * no hay con que cerrar el hueco. La salida lo dice.
 *
 * Si alguna de las dos marcas es de dia, la duracion va en dias enteros: con
 * medianoche implicita, restar horas daria numeros que parecen precisos y
 * no lo son (o negativos).
 *
 * COSTE EN TOKENS (TASK-023, `--tokens`): las columnas y los resumenes por
 * sprint y por complejidad declarada salen de `tokens_diseno`,
 * `tokens_implementacion` y `tokens_revision` de la tarea. null es «nadie lo
 * registro» y nunca cuenta como 0: sale como «—», no entra en las medias y una
 * tarea sin ningun dato no entra en el resumen (que dice cuantas quedaron
 * fuera). Una tarea con dato solo en alguna fase si entra, y cada fase se
 * promedia sobre las tareas que la tienen.
 *
 * FILA ENRIQUECIDA (TASK-064): cada fila lleva ademas el desglose de
 * `## Coste` frente a `tokens_<fase>` (`coste`), los hallazgos de todos sus
 * informes de revision contados una vez por tarea (`hallazgos`), el tamano
 * de cada peticion de revision (`kbPeticionPorRonda`), el tipo y el numero
 * de criterios. Todos esos campos estan SIEMPRE presentes; lo que no se pudo
 * medir va como null o vacio con el significado documentado en cada tipo
 * (`ResumenCostes`, `ResumenHallazgos`), para que quien agregue no tenga que
 * adivinar si un 0 es un cero o una ausencia.
 */
import { leerTransiciones, instanteDe, precisionDeFecha } from './transiciones.js';
import { TASK_COMPLEXITIES } from './task.js';
import { FASES_COSTE, leerCostes, resumirCostes } from './coste-registro.js';
import { resumirHallazgos, veredictoDeRonda, } from './informe-revision.js';
import { extraerSecciones } from './tarea-body.js';
/**
 * Clave de una tarea en cualquier Map de metricas: (proyecto, id). Hoy hay
 * un solo proyecto por ejecucion, pero TASK-NNN se repite entre proyectos y
 * la fila ya lleva el suyo, para que juntar varios no cruce tareas.
 */
export function claveTarea(proyecto, id) {
    return `${proyecto}\u0000${id}`;
}
/**
 * Como se nombra una tarea en avisos y listas (TASK-065): con un solo
 * proyecto, su ID a secas (la salida de siempre); con varios, `proyecto/ID`,
 * porque TASK-NNN se repite entre repos.
 */
export function etiquetaTarea(f, varios) {
    return varios ? `${f.proyecto}/${f.id}` : f.id;
}
function kbPorRonda(peticiones) {
    const bytes = new Map();
    for (const p of peticiones)
        bytes.set(p.ronda, (bytes.get(p.ronda) ?? 0) + p.bytes);
    return [...bytes.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([ronda, b]) => ({ ronda, kb: Math.round(b / 102.4) / 10 }));
}
/**
 * Asuntos de los commits automaticos que marcan cada fase (ver
 * `mensajeChore` en cada comando). Si un comando cambia su asunto, esto
 * deja de reconocer sus commits: hay un test que recorre el ciclo real.
 */
const ASUNTO_CHORE_RE = /^chore\((TASK-\d{3,})\): (tarea en diseno|plan aprobado|tarea en curso|peticion de revision ronda \d+|tarea terminada y artefactos de cierre|pausa registrada)$/;
function faseDeAsunto(resumen) {
    if (resumen === 'tarea en diseno')
        return 'plan';
    if (resumen === 'plan aprobado')
        return 'approve';
    if (resumen === 'tarea en curso')
        return 'start';
    if (resumen === 'pausa registrada')
        return 'pausa';
    if (resumen.startsWith('peticion de revision'))
        return 'review';
    return 'finish';
}
/**
 * Parsea la salida de `git log --format=%at%x09%s`: una linea por commit,
 * segundos de la fecha de autor, tabulador, asunto. Lo que no casa se
 * ignora (cualquier otro commit del repo).
 */
export function parsearLogGit(salida) {
    const eventos = [];
    for (const linea of salida.split(/\r?\n/)) {
        const tab = linea.indexOf('\t');
        if (tab === -1)
            continue;
        const segundos = Number(linea.slice(0, tab));
        if (!Number.isInteger(segundos))
            continue;
        const m = ASUNTO_CHORE_RE.exec(linea.slice(tab + 1).trim());
        if (m === null)
            continue;
        eventos.push({ id: m[1], fase: faseDeAsunto(m[2]), ms: segundos * 1000 });
    }
    return eventos;
}
function marcasDe(eventos) {
    // Orden cronologico: el registro ya lo esta, git log va al reves.
    const orden = [...eventos].sort((a, b) => a.marca.ms - b.marca.ms);
    const primera = (fase) => orden.find((e) => e.fase === fase)?.marca ?? null;
    const finishes = orden.filter((e) => e.fase === 'finish');
    return {
        plan: primera('plan'),
        start: primera('start'),
        review: primera('review'),
        finish: finishes.length === 0 ? null : finishes[finishes.length - 1].marca,
        pausas: orden.filter((e) => e.fase === 'pausa').length,
    };
}
/** Duracion entre dos marcas; null si falta una o la de fin es anterior. */
export function duracionEntre(desde, hasta) {
    if (desde === null || hasta === null)
        return null;
    if (desde.precision === 'dia' || hasta.precision === 'dia') {
        const dia = (ms) => Math.floor(ms / 86_400_000);
        const dias = dia(hasta.ms) - dia(desde.ms);
        return dias < 0 ? null : { valor: dias, precision: 'dia' };
    }
    const ms = hasta.ms - desde.ms;
    return ms < 0 ? null : { valor: ms, precision: 'segundo' };
}
/** Una fila por tarea, sin la parte de heuristica. */
export function calcularFila(e) {
    const registro = leerTransiciones(e.body).map((f) => ({
        fase: f.fase,
        marca: { ms: instanteDe(f.fecha), precision: precisionDeFecha(f.fecha) },
    }));
    let origen;
    let marcas;
    if (registro.length > 0) {
        origen = 'registro';
        marcas = marcasDe(registro);
    }
    else if (e.eventosGit.length > 0) {
        origen = 'git';
        marcas = marcasDe(e.eventosGit.map((g) => ({ fase: g.fase, marca: { ms: g.ms, precision: 'segundo' } })));
    }
    else {
        origen = '—';
        marcas = { plan: null, start: null, review: null, finish: null, pausas: 0 };
    }
    return {
        proyecto: e.proyecto ?? '',
        id: e.task.id,
        tipo: e.task.tipo,
        criterios: extraerSecciones(e.body).criterios.length,
        sprint: e.task.sprint,
        tokens: {
            diseno: e.task.tokens_diseno,
            implementacion: e.task.tokens_implementacion,
            revision: e.task.tokens_revision,
        },
        estado: e.task.estado,
        complejidad: e.task.complejidad,
        diseno: duracionEntre(marcas.plan, marcas.start),
        curso: duracionEntre(marcas.start, marcas.review),
        revision: duracionEntre(marcas.review, marcas.finish),
        rondas: e.ronda > 0 ? e.ronda : null,
        cierre: marcas.finish === null ? null : new Date(marcas.finish.ms).toISOString().slice(0, 10),
        pausas: marcas.pausas,
        origen,
        coste: resumirCostes(leerCostes(e.body), {
            diseno: e.task.tokens_diseno,
            implementacion: e.task.tokens_implementacion,
            revision: e.task.tokens_revision,
        }),
        hallazgos: resumirHallazgos(e.informes ?? []),
        kbPeticionPorRonda: kbPorRonda(e.peticiones ?? []),
        total: duracionEntre(marcas.plan, marcas.finish),
        veredictoRonda1: veredictoRonda1(e.informes ?? []),
    };
}
function veredictoRonda1(informes) {
    const primera = informes.filter((i) => i.ronda === 1);
    return primera.length === 0 ? null : veredictoDeRonda(primera.map((i) => i.texto));
}
/** `—` para lo que no hay; dias como `N d`; segundos como `1d 03h`, `2h 05m`, `7m`, `40s`. */
export function formatearDuracion(d) {
    if (d === null)
        return '—';
    if (d.precision === 'dia')
        return `${String(d.valor)} d`;
    const s = Math.floor(d.valor / 1000);
    const dd = Math.floor(s / 86_400);
    const hh = Math.floor((s % 86_400) / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const dos = (n) => String(n).padStart(2, '0');
    if (dd > 0)
        return `${String(dd)}d ${dos(hh)}h`;
    if (hh > 0)
        return `${String(hh)}h ${dos(mm)}m`;
    if (mm > 0)
        return `${String(mm)}m`;
    return `${String(s % 60)}s`;
}
function celdaConteo(n) {
    return n === undefined ? '—' : String(n);
}
export const COLUMNAS_METRICAS = [
    { cabecera: 'id', valor: (f) => f.id },
    { cabecera: 'complejidad', valor: (f) => f.complejidad ?? '—' },
    { cabecera: 'diseno', valor: (f) => formatearDuracion(f.diseno) },
    { cabecera: 'curso', valor: (f) => formatearDuracion(f.curso) },
    { cabecera: 'revision', valor: (f) => formatearDuracion(f.revision) },
    { cabecera: 'rondas', valor: (f) => (f.rondas === null ? '—' : String(f.rondas)) },
    { cabecera: 'crit', valor: (f) => celdaConteo(f.hallazgos.porSeveridad?.CRITICO) },
    { cabecera: 'imp', valor: (f) => celdaConteo(f.hallazgos.porSeveridad?.IMPORTANTE) },
    { cabecera: 'men', valor: (f) => celdaConteo(f.hallazgos.porSeveridad?.MENOR) },
    {
        cabecera: 'hall_origen',
        valor: (f) => {
            const o = f.hallazgos.porOrigen;
            if (o === null)
                return '—';
            return [o.implementacion, o.plan, o.especificacion, o['sin clasificar']].map(String).join('/');
        },
    },
    { cabecera: 'cierre', valor: (f) => f.cierre ?? '—' },
    { cabecera: 'origen', valor: (f) => f.origen },
];
/** Primera columna con varios proyectos (`--repo` repetido): el ID solo no identifica la tarea. */
export const COLUMNA_PROYECTO = { cabecera: 'proyecto', valor: (f) => f.proyecto };
/** Las que anade `--heuristica`. */
export const COLUMNAS_HEURISTICA = [
    { cabecera: 'puntos', valor: (f) => (f.heuristica === undefined ? '—' : String(f.heuristica.puntos)) },
    { cabecera: 'nivel_heuristico', valor: (f) => f.heuristica?.nivel ?? '—' },
];
/** Tabla de texto alineada (Markdown valido) a partir de cabeceras y celdas ya formateadas. */
export function tablaDeTexto(cabeceras, celdas) {
    const anchos = cabeceras.map((c, i) => Math.max(c.length, ...celdas.map((fila) => fila[i].length)));
    const linea = (valores) => `| ${valores.map((v, i) => v.padEnd(anchos[i])).join(' | ')} |`;
    return [
        linea(cabeceras),
        `|${anchos.map((a) => '-'.repeat(a + 2)).join('|')}|`,
        ...celdas.map(linea),
    ].join('\n');
}
/** Tabla de texto alineada (Markdown valido). */
export function formatearTabla(filas, columnas) {
    return tablaDeTexto(columnas.map((c) => c.cabecera), filas.map((f) => columnas.map((c) => c.valor(f))));
}
/**
 * Regla de coste de la recalibracion: una tarea entra en la muestra si esta
 * terminada y tiene al menos un informe de revision. Sin `revision/` no es
 * «0 rondas»: es que no se midio (las tareas anteriores a `review`).
 */
export function enMuestraHeuristica(f) {
    return f.estado === 'terminada' && f.rondas !== null;
}
/** n y rondas medias agrupando por un nivel (declarado o heuristico), en el orden del enum. */
export function resumirPorNivel(filas, nivelDe, orden) {
    const grupos = new Map();
    for (const f of filas) {
        const nivel = nivelDe(f) ?? '—';
        const lista = grupos.get(nivel) ?? [];
        lista.push(f.rondas ?? 0);
        grupos.set(nivel, lista);
    }
    const claves = [...orden, '—'];
    return claves
        .filter((k) => grupos.has(k))
        .map((k) => {
        const r = grupos.get(k);
        return { nivel: k, n: r.length, rondasMedia: r.reduce((a, b) => a + b, 0) / r.length };
    });
}
export function formatearResumen(titulo, grupos) {
    const filas = grupos.map((g) => `  ${g.nivel.padEnd(8)} n=${String(g.n).padStart(3)}  rondas medias=${g.rondasMedia.toFixed(2)}`);
    return [titulo, ...filas].join('\n');
}
/** Fases en el orden de la tabla; `curso` en las columnas es la implementacion. */
export const FASES_TOKENS = ['diseno', 'implementacion', 'revision'];
/** Suma de lo registrado; null si la tarea no tiene ni una fase con dato (nunca un 0 inventado). */
export function totalTokens(t) {
    const datos = FASES_TOKENS.map((k) => t[k]).filter((v) => v !== null);
    return datos.length === 0 ? null : datos.reduce((a, b) => a + b, 0);
}
function celdaTokens(v) {
    return v === null ? '—' : String(v);
}
/** Las que anade `--tokens` a la tabla: «curso» es la implementacion, como en las duraciones. */
export const COLUMNAS_TOKENS = [
    { cabecera: 'tok_diseno', valor: (f) => celdaTokens(f.tokens.diseno) },
    { cabecera: 'tok_curso', valor: (f) => celdaTokens(f.tokens.implementacion) },
    { cabecera: 'tok_revision', valor: (f) => celdaTokens(f.tokens.revision) },
    { cabecera: 'tok_total', valor: (f) => celdaTokens(totalTokens(f.tokens)) },
];
/** Columnas del bloque de docs/METRICAS.md: solo lo que no depende de git log ni del reloj. */
export const COLUMNAS_BLOQUE_TOKENS = [
    { cabecera: 'id', valor: (f) => f.id },
    { cabecera: 'sprint', valor: (f) => String(f.sprint) },
    { cabecera: 'complejidad', valor: (f) => f.complejidad ?? '—' },
    ...COLUMNAS_TOKENS,
];
/**
 * Agrega por grupo (sprint, complejidad...). Los grupos salen en `orden`, y
 * los que no esten en el, detras en orden alfabetico; un grupo con tareas
 * pero sin ningun dato sale igualmente (n 0/N), para que se vea que existe.
 * Las tareas sin ningun dato cuentan en `nTotal` y no en nada mas.
 */
export function resumirTokens(filas, grupoDe, orden = []) {
    const grupos = new Map();
    for (const f of filas) {
        const g = grupoDe(f);
        const lista = grupos.get(g) ?? [];
        lista.push(f);
        grupos.set(g, lista);
    }
    const claves = [
        ...orden.filter((k) => grupos.has(k)),
        ...[...grupos.keys()].filter((k) => !orden.includes(k)).sort(),
    ];
    return claves.map((grupo) => {
        const lista = grupos.get(grupo);
        const conDato = lista.filter((f) => totalTokens(f.tokens) !== null);
        const fases = {};
        let total = 0;
        for (const k of FASES_TOKENS) {
            const valores = conDato.map((f) => f.tokens[k]).filter((v) => v !== null);
            const suma = valores.reduce((a, b) => a + b, 0);
            total += suma;
            fases[k] = {
                suma,
                n: valores.length,
                media: valores.length === 0 ? null : Math.round(suma / valores.length),
                porcentaje: null,
            };
        }
        for (const k of FASES_TOKENS) {
            fases[k].porcentaje = total === 0 ? null : Math.round((fases[k].suma / total) * 1000) / 10;
        }
        return {
            grupo,
            nTotal: lista.length,
            nConDato: conDato.length,
            fases,
            total,
            mediaTotal: conDato.length === 0 ? null : Math.round(total / conDato.length),
        };
    });
}
function celdaFase(r) {
    if (r.n === 0)
        return '—';
    const pct = r.porcentaje === null ? '—' : `${r.porcentaje.toFixed(1)}%`;
    return `${String(r.suma)} (media ${String(r.media)}, ${pct})`;
}
/**
 * Tabla Markdown del resumen: por grupo, «n con dato / n total», la suma de
 * cada fase con su media y su % sobre el total del grupo, y el total.
 */
export function formatearResumenTokens(etiquetaGrupo, grupos) {
    return tablaDeTexto([etiquetaGrupo, 'con dato/total', 'diseno', 'curso', 'revision', 'total (media)'], grupos.map((g) => [
        g.grupo,
        `${String(g.nConDato)}/${String(g.nTotal)}`,
        celdaFase(g.fases.diseno),
        celdaFase(g.fases.implementacion),
        celdaFase(g.fases.revision),
        g.nConDato === 0 ? '—' : `${String(g.total)} (media ${String(g.mediaTotal)})`,
    ]));
}
/** Nota que acompana a los resumenes: que entra y que no. */
export const NOTA_TOKENS = 'Tokens procesados (entrada + cache + salida) por fase; «curso» es la implementacion. ' +
    '«—» = sin registrar (no es 0). Los resumenes solo cuentan tareas con algun dato ' +
    '(con dato/total): las demas salen en la tabla y no en el resumen. Cada media es sobre ' +
    'las tareas que tienen esa fase; el % es de la fase sobre el total del grupo.';
/** Los dos resumenes (por sprint y por complejidad declarada), en Markdown. */
export function resumenesTokens(filas) {
    const sprints = [...new Set(filas.map((f) => f.sprint))].sort((a, b) => a - b).map(String);
    return {
        porSprint: formatearResumenTokens('sprint', resumirTokens(filas, (f) => String(f.sprint), sprints)),
        porComplejidad: formatearResumenTokens('complejidad', resumirTokens(filas, (f) => f.complejidad ?? '—', [...TASK_COMPLEXITIES, '—'])),
    };
}
// --- Bloque regenerable de docs/METRICAS.md ----------------------------------
export const MARCADOR_INICIO_TOKENS = '<!-- taskctl metricas --tokens: inicio -->';
export const MARCADOR_FIN_TOKENS = '<!-- taskctl metricas --tokens: fin -->';
/**
 * El bloque entre marcadores (marcadores incluidos, saltos de linea LF).
 * Determinista: sin fecha ni nada del reloj, para que regenerarlo con los
 * mismos datos no ensucie el diff.
 */
export function renderBloqueTokens(filas) {
    const { porSprint, porComplejidad } = resumenesTokens(filas);
    return [
        MARCADOR_INICIO_TOKENS,
        '## Coste en tokens por tarea (generado)',
        '',
        '> Generado por `taskctl metricas --tokens --escribir`. No editar a mano: lo que haya entre',
        '> los marcadores se sobrescribe.',
        '',
        formatearTabla(filas, COLUMNAS_BLOQUE_TOKENS),
        '',
        '### Resumen por sprint',
        '',
        porSprint,
        '',
        '### Resumen por complejidad declarada',
        '',
        porComplejidad,
        '',
        NOTA_TOKENS,
        MARCADOR_FIN_TOKENS,
    ].join('\n');
}
export class BloqueTokensError extends Error {
}
/**
 * Pone `bloque` en `contenido`: sustituye lo que hay entre los marcadores
 * (incluidos) o, si no existen, lo anade al final tras una linea en blanco.
 * Fuera del bloque el texto no se toca ni un byte; el bloque adopta el salto
 * de linea del fichero (CRLF si lo usa). Un marcador suelto, repetido o
 * desordenado es ambiguo y se rechaza en vez de adivinar que borrar.
 */
export function sustituirBloqueTokens(contenido, bloque) {
    const eol = contenido.includes('\r\n') ? '\r\n' : '\n';
    const nuevo = bloque.split('\n').join(eol);
    const cuenta = (m) => contenido.split(m).length - 1;
    const inicios = cuenta(MARCADOR_INICIO_TOKENS);
    const fines = cuenta(MARCADOR_FIN_TOKENS);
    if (inicios === 0 && fines === 0) {
        if (contenido === '')
            return nuevo + eol;
        const cierre = contenido.endsWith('\n') ? '' : eol;
        return `${contenido}${cierre}${eol}${nuevo}${eol}`;
    }
    const i = contenido.indexOf(MARCADOR_INICIO_TOKENS);
    const f = contenido.indexOf(MARCADOR_FIN_TOKENS);
    if (inicios !== 1 || fines !== 1 || f < i) {
        throw new BloqueTokensError(`[ERROR] docs/METRICAS.md tiene los marcadores del bloque de tokens mal puestos ` +
            `(${String(inicios)} de inicio, ${String(fines)} de fin, o el fin antes del inicio). ` +
            `Deja exactamente un par "${MARCADOR_INICIO_TOKENS}" ... "${MARCADOR_FIN_TOKENS}" ` +
            '(o borra los dos para que se anada al final) y reintenta; no se ha tocado nada.');
    }
    return contenido.slice(0, i) + nuevo + contenido.slice(f + MARCADOR_FIN_TOKENS.length);
}
// --- Fila enriquecida: desglose, hallazgos, lecturas (TASK-064) --------------
/**
 * Suma de un campo de las tres fases del desglose; null si la tarea no tiene
 * tabla `## Coste`. `nuevos` y `cacheLectura` tambien son null si ninguna
 * fila tiene desglose (solo filas `manual`): no se midio nada, no es 0.
 */
function sumaDesglose(f, campo) {
    if (!f.coste.conTabla)
        return null;
    if (campo !== 'sinDesglose' && FASES_COSTE.every((fase) => f.coste.fases[fase].desglosado === 0))
        return null;
    return FASES_COSTE.reduce((a, fase) => a + (f.coste.fases[fase][campo] ?? 0), 0);
}
/** `tok_sin_desglose`: la suma, con `*` si alguna fase es negativa (la suma podria esconderlo). */
function celdaSinDesglose(f) {
    const suma = sumaDesglose(f, 'sinDesglose');
    if (suma === null)
        return '—';
    const negativa = FASES_COSTE.some((fase) => (f.coste.fases[fase].sinDesglose ?? 0) < 0);
    return negativa ? `${String(suma)}*` : String(suma);
}
/** Las que anade `--tokens` a la tabla por pantalla (no al bloque de docs/METRICAS.md). */
export const COLUMNAS_DESGLOSE_TOKENS = [
    { cabecera: 'tok_nuevos', valor: (f) => celdaTokens(sumaDesglose(f, 'nuevos')) },
    { cabecera: 'tok_cache_lect', valor: (f) => celdaTokens(sumaDesglose(f, 'cacheLectura')) },
    { cabecera: 'tok_sin_desglose', valor: celdaSinDesglose },
];
export const NOTA_DESGLOSE_TOKENS = 'Desglose de "## Coste" (solo tareas con esa tabla; «—» = sin tabla, y en tok_nuevos y ' +
    'tok_cache_lect tambien si ninguna fila tiene desglose): tok_nuevos = entrada + ' +
    'escritura de cache + salida; tok_cache_lect = lectura de cache, aparte; tok_sin_desglose = ' +
    'tokens_<fase> menos lo desglosado (filas "manual" o coste anterior a la tabla), sumado por ' +
    'fases. Un negativo en una fase es una incoherencia (el desglose supera al total): no se ' +
    'recorta a 0, sale con aviso y la celda lleva "*" aunque la suma sea positiva. Un agente ' +
    'repetido en una fase suma tantas veces como filas tenga: se avisa, no se deduplica (salvo ' +
    'las filas "agente:dif:<id>" de un agente reanudado, que solo suman lo que crecio).';
export const NOTA_HALLAZGOS = 'Hallazgos: cada uno cuenta una vez por tarea (revisor + ID) sumando todas las rondas, con la ' +
    'severidad y el origen de la ultima ronda que los reconoce. hall_origen = implementacion/plan/' +
    'especificacion/sin clasificar. «—» = sin dato: sin informes de revision, o algun informe sin ' +
    'tabla de hallazgos (no cuenta como cero).';
/** Avisos de una fila: incoherencias del desglose y severidades fuera de vocabulario. */
export function avisosDeFila(f, varios = false) {
    const avisos = [];
    const et = etiquetaTarea(f, varios);
    for (const fase of FASES_COSTE) {
        const r = f.coste.fases[fase];
        if (r.registrado === null && r.filas > 0) {
            avisos.push(`${et}: tokens_${fase} esta vacio pero "## Coste" tiene ${String(r.filas)} fila(s) de ${fase}; ` +
                'el total de la fase deberia ser la suma de su desglose. Revisa el frontmatter.');
        }
        else if (r.sinDesglose !== null && r.sinDesglose < 0) {
            avisos.push(`${et}: lo desglosado en "## Coste" para ${fase} (${String(r.desglosado)}) supera tokens_${fase} ` +
                `(${String(r.registrado)}): diferencia ${String(r.sinDesglose)}. Revisa el frontmatter o las filas.`);
        }
    }
    for (const rep of f.coste.repetidas) {
        avisos.push(`${et}: en "## Coste", ${rep.fuente} aparece en ${String(rep.filas)} filas de ${rep.fase}: ` +
            'su coste se suma otras tantas veces (no se deduplica). Si se registro dos veces por error, ' +
            `corrige tokens_${rep.fase} y quita la fila sobrante.`);
    }
    const porFichero = new Map();
    for (const d of f.hallazgos.severidadesDesconocidas) {
        const lista = porFichero.get(d.fichero) ?? [];
        lista.push(d.valor === '' ? `${d.id} (vacia)` : `${d.id} ("${d.valor}")`);
        porFichero.set(d.fichero, lista);
    }
    for (const [fichero, lista] of porFichero) {
        avisos.push(`${et} revision/${fichero}: severidad fuera de vocabulario (CRITICO, IMPORTANTE o MENOR) en ` +
            `${lista.join(', ')}; no cuenta en crit/imp/men.`);
    }
    return avisos;
}
/** Un solo aviso con las tareas que tienen informes sin tabla de hallazgos; null si no hay. */
export function avisoInformesSinTabla(filas, varios = false) {
    const con = filas.filter((f) => f.hallazgos.informesSinTabla.length > 0);
    if (con.length === 0)
        return null;
    const n = con.reduce((a, f) => a + f.hallazgos.informesSinTabla.length, 0);
    return (`${String(n)} informe(s) de revision sin tabla de hallazgos en ${String(con.length)} tarea(s); sus ` +
        `hallazgos salen como sin dato («—»), no como cero: ${con.map((f) => etiquetaTarea(f, varios)).join(', ')}.`);
}
/** Tareas terminadas sin coste (null o 0) en alguna fase, con esas fases. */
export function tareasSinCoste(filas) {
    return filas
        .filter((f) => f.estado === 'terminada')
        .map((f) => ({ proyecto: f.proyecto, id: f.id, fases: FASES_COSTE.filter((k) => !f.coste.fases[k].registrado) }))
        .filter((t) => t.fases.length > 0);
}
/** Mediana de una lista (media de los dos centrales si es par); null si esta vacia. */
export function mediana(valores) {
    if (valores.length === 0)
        return null;
    const v = [...valores].sort((a, b) => a - b);
    const m = Math.floor(v.length / 2);
    return v.length % 2 === 1 ? v[m] : (v[m - 1] + v[m]) / 2;
}
/** Media redondeada a `decimales`; null si la lista esta vacia (nunca NaN). */
export function media(valores, decimales = 2) {
    if (valores.length === 0)
        return null;
    const f = 10 ** decimales;
    return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * f) / f;
}
/** Por fase, la mediana de lecturas de las tareas cuya tabla `## Coste` las mide, y cuantas son. */
export function medianaLecturas(filas) {
    const r = {};
    for (const fase of FASES_COSTE) {
        const valores = filas.map((f) => f.coste.fases[fase].lecturas).filter((v) => v !== null);
        r[fase] = { mediana: mediana(valores), n: valores.length };
    }
    return r;
}
/** Lineas de texto bajo la tabla: hallazgos sin dato, lecturas y terminadas sin coste. */
export function notasFilaEnriquecida(filas, varios = false) {
    const sinTabla = filas.filter((f) => f.hallazgos.informesSinTabla.length > 0);
    const nInformes = sinTabla.reduce((a, f) => a + f.hallazgos.informesSinTabla.length, 0);
    const lect = medianaLecturas(filas);
    return [
        NOTA_HALLAZGOS +
            ` Informes sin tabla de hallazgos: ${String(nInformes)} (en ${String(sinTabla.length)} tareas).`,
        'Lecturas por fase (mediana de las tareas cuya tabla "## Coste" las mide): ' +
            FASES_COSTE.map((k) => `${k} ${lect[k].mediana === null ? '—' : String(lect[k].mediana)} (n=${String(lect[k].n)})`).join(', ') +
            '.',
        lineaSinCoste(resumenSinCoste(filas), varios),
    ];
}
// --- Terminadas sin coste, acotadas (MEN-4 de TASK-064, en TASK-065) ---------
/** Cuantas tareas de la lista de terminadas sin coste salen por pantalla; el resto, en --json. */
export const MAX_SIN_COSTE_EN_TEXTO = 10;
export function resumenSinCoste(filas) {
    const tareas = tareasSinCoste(filas);
    const porFase = {};
    for (const fase of FASES_COSTE)
        porFase[fase] = tareas.filter((t) => t.fases.includes(fase)).length;
    return {
        terminadas: filas.filter((f) => f.estado === 'terminada').length,
        total: tareas.length,
        porFase,
        tareas,
    };
}
/**
 * La linea de texto: el recuento por fase y las 10 primeras, con «y N mas»
 * (en un proyecto con 76 de 76 la lista entera tapaba la tabla). La lista
 * completa sale en `--json`.
 */
export function lineaSinCoste(r, varios = false) {
    if (r.total === 0)
        return `Terminadas sin coste en alguna fase: 0 de ${String(r.terminadas)}.`;
    const primeras = r.tareas
        .slice(0, MAX_SIN_COSTE_EN_TEXTO)
        .map((t) => `${etiquetaTarea(t, varios)} (${t.fases.join(', ')})`)
        .join(', ');
    const resto = r.total - Math.min(r.total, MAX_SIN_COSTE_EN_TEXTO);
    return (`Terminadas sin coste en alguna fase: ${String(r.total)} de ${String(r.terminadas)} ` +
        `(${FASES_COSTE.map((k) => `${k} ${String(r.porFase[k])}`).join(', ')}): ${primeras}` +
        (resto > 0 ? ` y ${String(resto)} mas (lista completa con --json).` : '.'));
}
