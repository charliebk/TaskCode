/**
 * TASK-121: troceo de una tarea en partes TASK-NNNa, TASK-NNNb... que
 * comparten la rama de la tarea. Puro: lee el plan y el cuerpo de la tarea
 * y devuelve lo que hay que escribir; `commands/trocear.ts` lo escribe.
 *
 * El plan declara las partes en una seccion `## Troceo`:
 *
 *     ## Troceo
 *
 *     ### Parte a: IDs con letra en todo el CLI
 *     Objetivo de la parte (una o varias lineas).
 *     Duracion estimada: 40 min
 *     - [ ] criterio comprobable
 *
 * Trocear lo decide una persona (regla de una hora): este modulo no decide
 * nada, solo valida que las partes esten completas.
 */
import { esIdTroceable } from './task.js';
import { leerDuracionEstimada } from './duracion-estimada.js';
import { citar } from './tarea-body.js';
import { anadirSeccionAlFinal, dentroDeBloque } from './transiciones.js';
export class TroceoError extends Error {
}
// TASK-147b (CORE2-14): la regla vive en core/task.ts; se reexporta para trocear y start.
export { esIdTroceable } from './task.js';
const CABECERA_TROCEO_RE = /^##\s+troceo\s*$/i;
const CABECERA_PARTE_RE = /^###\s+parte\s+([a-z])\s*[:.\-–—]\s*(.+?)\s*$/i;
const CRITERIO_RE = /^\s*[-*]\s+\[[ xX]\]\s+(.*\S)\s*$/;
const DURACION_RE = /duraci[oó]n estimada\s*[*_`]*\s*:/i;
/** Las lineas de la seccion `## Troceo`, fuera de bloques de codigo; null si no hay seccion. */
function lineasDeTroceo(plan) {
    // TASK-147a: con rangoPorCabecera (dentroDeBloque), no con un interruptor propio de vallas.
    const lineas = plan.replace(/\r/g, '').split('\n');
    const rango = rangoPorCabecera(lineas, CABECERA_TROCEO_RE, { cortaEnObjetivoOCriterios: false });
    if (rango === null)
        return null;
    const [ini, fin] = rango;
    // IMP-2 e IMP-3 de la revision: `### Criterios` u `### Objetivo` dentro de una
    // parte es de esa parte (tambien en la ultima); tras los criterios de la
    // ultima parte ya no es de ninguna y cierra la seccion.
    const enBloque = dentroDeBloque(lineas);
    let ultimaParte = -1;
    for (let i = ini + 1; i < fin; i++)
        if (!enBloque[i] && CABECERA_PARTE_RE.test(lineas[i].trim()))
            ultimaParte = i;
    let corte = fin;
    let conCriterios = false;
    for (let i = Math.max(ultimaParte, ini) + 1; i < fin; i++) {
        if (enBloque[i])
            continue;
        const l = lineas[i];
        if (CRITERIO_RE.test(l))
            conCriterios = true;
        else if (conCriterios && abreSeccionDeTarea(l)) {
            corte = i;
            break;
        }
    }
    return lineas.slice(ini + 1, corte);
}
/**
 * Las partes que declara el plan. Lanza TroceoError si no hay seccion
 * `## Troceo`, si hay menos de dos partes, si las letras no van seguidas desde
 * la `a` o si una parte no trae objetivo o criterios.
 */
export function leerPartes(plan, id) {
    const lineas = lineasDeTroceo(plan);
    if (lineas === null) {
        throw new TroceoError(`${id}: el plan no tiene seccion "## Troceo". Anadela con un bloque "### Parte a: <titulo>", ` +
            '"### Parte b: <titulo>"... y en cada uno su objetivo y sus criterios ("- [ ] ...").');
    }
    const partes = [];
    let enBloque = false;
    for (const l of lineas) {
        if (/^\s*(```|~~~)/.test(l))
            enBloque = !enBloque;
        const m = enBloque ? null : CABECERA_PARTE_RE.exec(l);
        if (m !== null) {
            partes.push({ letra: m[1].toLowerCase(), titulo: m[2], cuerpo: [] });
            continue;
        }
        const ultima = partes[partes.length - 1];
        if (ultima !== undefined)
            ultima.cuerpo.push(l);
    }
    if (partes.length < 2) {
        throw new TroceoError(`${id}: la seccion "## Troceo" declara ${String(partes.length)} parte(s); trocear pide al menos dos ` +
            '("### Parte a: ...", "### Parte b: ...").');
    }
    // Las letras de todas las partes, antes que el contenido de cada una: un
    // salto de letra es el error de forma, y se dice primero.
    partes.forEach((p, i) => {
        const esperada = String.fromCharCode(97 + i);
        if (p.letra !== esperada) {
            throw new TroceoError(`${id}: la parte ${String(i + 1)} se llama "${p.letra}" y deberia ser "${esperada}": ` +
                'las partes van seguidas desde la a (a, b, c...).');
        }
    });
    return partes.map((p) => {
        const criterios = [];
        const objetivo = [];
        for (const l of p.cuerpo) {
            const c = CRITERIO_RE.exec(l);
            if (c !== null)
                criterios.push(c[1]);
            else if (!DURACION_RE.test(l))
                objetivo.push(l);
        }
        const textoObjetivo = objetivo.join('\n').trim();
        if (textoObjetivo === '') {
            throw new TroceoError(`${id}: la parte ${p.letra} ("${p.titulo}") no tiene objetivo: escribe que entrega.`);
        }
        if (criterios.length === 0) {
            throw new TroceoError(`${id}: la parte ${p.letra} ("${p.titulo}") no tiene criterios de aceptacion ("- [ ] ...").`);
        }
        // MEN-2 de la revision: sin su propia estimacion, la parte a heredaba la
        // de la tarea entera y la regla de una hora volvia a preguntar por ella.
        const duracion = leerDuracionEstimada(p.cuerpo.join('\n'));
        if (duracion.tipo !== 'ok') {
            throw new TroceoError(`${id}: la parte ${p.letra} ("${p.titulo}") no trae una "Duracion estimada: N min" legible: ` +
                'cada parte estima la suya (entero de minutos).');
        }
        return { letra: p.letra, titulo: p.titulo, objetivo: textoObjetivo, criterios, duracion };
    });
}
function objetivoDeParte(task, parte, ids) {
    return (`Parte ${parte.letra} del troceo de ${task.id} (${task.titulo}), partes ${ids.join(', ')} ` +
        `en la rama ${task.rama}.\n\n${parte.objetivo}`);
}
function criteriosMd(criterios) {
    return criterios.map((c) => `- [ ] ${c}`).join('\n');
}
// TASK-147a (CORE2-06): `### Criterios de aceptacion` tambien abre la seccion,
// como en extraerSecciones; antes troceo no la encontraba y anteponia otra.
const OBJETIVO_RE = /^#{2,3}\s+objetivo\s*$/i;
const CRITERIOS_RE = /^#{2,3}\s+criterios de aceptaci[oó]n\s*$/i;
/** Cabecera `## / ### Objetivo` o `## / ### Criterios de aceptacion`: abre su propia seccion. */
function abreSeccionDeTarea(linea) {
    return OBJETIVO_RE.test(linea.trim()) || CRITERIOS_RE.test(linea.trim());
}
/**
 * Rango [cabecera, fin) de la primera seccion cuya cabecera casa con `cabecera`,
 * fuera de bloques de codigo (`dentroDeBloque`, el detector comun); acaba en
 * la siguiente cabecera de su nivel o superior. null si no esta.
 */
function rangoPorCabecera(lineas, cabecera, { cortaEnObjetivoOCriterios }) {
    const enBloque = dentroDeBloque(lineas);
    const ini = lineas.findIndex((l, i) => !enBloque[i] && cabecera.test(l.trim()));
    if (ini === -1)
        return null;
    const nivel = /^(#+)/.exec(lineas[ini].trim())?.[1]?.length ?? 2;
    let fin = ini + 1;
    while (fin < lineas.length) {
        const l = lineas[fin];
        const m = /^(#{1,6})\s/.exec(l);
        // Como en extraerSecciones: una cabecera de Objetivo o de Criterios abre
        // su propia seccion aunque sea de nivel 3 (`### Criterios de aceptacion`).
        // Solo en tarea.md: en el plan, `### Criterios` dentro de una parte es de
        // esa parte y no corta `## Troceo` (IMP-1 de la revision de TASK-147a).
        const otraSeccion = cortaEnObjetivoOCriterios && abreSeccionDeTarea(l);
        if (!enBloque[fin] && m !== null && (m[1].length <= nivel || otraSeccion))
            break;
        fin++;
    }
    return [ini, fin];
}
/**
 * Reemplaza el contenido de la seccion cuya cabecera casa con `cabecera`. Si
 * no existe, la anade al principio en el orden de la plantilla. Conserva las
 * demas secciones (`## Transiciones`, etc.).
 */
function reemplazarSeccion(body, cabecera, titulo, contenido) {
    const eol = body.includes('\r\n') ? '\r\n' : '\n';
    const lineas = body.split(/\r?\n/);
    const rango = rangoPorCabecera(lineas, cabecera, { cortaEnObjetivoOCriterios: true });
    const bloque = [titulo, '', ...contenido.split('\n'), ''];
    if (rango === null)
        return [...bloque, ...lineas].join(eol);
    return [...lineas.slice(0, rango[0]), ...bloque, ...lineas.slice(rango[1])].join(eol);
}
/**
 * Lo que hay que escribir para trocear `task` en `partes`. La parte a es la
 * propia tarea (conserva su registro de transiciones y su plan); las demas
 * nacen planificadas, con la misma rama y dependiendo de la anterior.
 */
export function planificarTroceo(task, body, partes, hoy) {
    if (!esIdTroceable(task.id)) {
        throw new TroceoError(`${task.id}: ya es una parte de un troceo; una parte no se vuelve a trocear.`);
    }
    const ids = partes.map((p) => `${task.id}${p.letra}`);
    const [primera, ...siguientes] = partes;
    const original = body.match(/^##\s+objetivo\s*$/im) === null ? '' : extraerObjetivo(body);
    const objetivoA = objetivoDeParte(task, primera, ids) + (original === '' ? '' : `\n\nObjetivo de la tarea entera:\n\n${citar(original)}`);
    let bodyA = reemplazarSeccion(body, OBJETIVO_RE, '## Objetivo', objetivoA);
    bodyA = reemplazarSeccion(bodyA, CRITERIOS_RE, '## Criterios de aceptacion', criteriosMd(primera.criterios));
    const parteA = {
        task: { ...task, id: ids[0], titulo: `${primera.titulo} (parte a de ${task.id})`, actualizado: hoy },
        body: bodyA,
    };
    const resto = siguientes.map((p, i) => ({
        task: {
            ...task,
            id: ids[i + 1],
            titulo: `${p.titulo} (parte ${p.letra} de ${task.id})`,
            estado: 'planificada',
            plan_aprobado: false,
            asignado_a: null,
            ultimo_commit_revisado: null,
            tokens_diseno: null,
            tokens_implementacion: null,
            tokens_revision: null,
            creado: hoy,
            actualizado: hoy,
            dependencias: [ids[i]],
        },
        body: `## Objetivo\n\n${objetivoDeParte(task, p, ids)}\n\n## Criterios de aceptacion\n${criteriosMd(p.criterios)}\n`,
    }));
    return { parteA, resto, ids };
}
function extraerObjetivo(body) {
    const lineas = body.replace(/\r/g, '').split('\n');
    const rango = rangoPorCabecera(lineas, OBJETIVO_RE, { cortaEnObjetivoOCriterios: true });
    return rango === null ? '' : lineas.slice(rango[0] + 1, rango[1]).join('\n').trim();
}
/**
 * El plan de la parte a tras trocear: su duracion estimada pasa a la de la
 * parte a (si la trae) y se anota quien acepto el troceo y cuando.
 */
export function planTrasTroceo(plan, partes, ids, hoy) {
    const eol = plan.includes('\r\n') ? '\r\n' : '\n';
    const primera = partes[0];
    let texto = plan;
    if (primera.duracion.tipo === 'ok') {
        const entera = leerDuracionEstimada(plan);
        const antes = entera.tipo === 'ok' ? `${String(entera.minutos)} min` : 'sin cifra legible';
        let hecho = false;
        const lineasPlan = plan.split(/\r?\n/);
        const enBloque = dentroDeBloque(lineasPlan);
        texto = lineasPlan
            .map((l, i) => {
            if (hecho || enBloque[i] || !DURACION_RE.test(l) || !/^\s*(?:[-*+>#]\s*)*[*_`]*\s*duraci[oó]n estimada/i.test(l))
                return l;
            hecho = true;
            return `Duracion estimada: ${String(primera.duracion.minutos)} min (parte a del troceo; la tarea entera estimaba ${antes})`;
        })
            .join(eol);
    }
    return anadirSeccionAlFinal(texto, [
        '## Troceo aceptado',
        '',
        `Troceo aceptado por una persona el ${hoy}: ${ids.join(', ')}, todas en la misma rama. ` +
            `Este plan es el de ${ids[0]}; las demas partes se planifican al empezarlas.`,
    ]);
}
