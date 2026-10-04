/**
 * Parser determinista (sin LLM) de un fichero Markdown con varias
 * tareas para `taskctl import` (TASK-004 de PLAN_SPRINTS.md). Formato
 * esperado, por entrada:
 *
 *   ### <Titulo de la tarea>
 *   - <criterio de aceptacion 1>
 *   - <criterio de aceptacion 2>
 *
 * Opcional: lineas "> texto" justo bajo el "###" y antes del primer
 * criterio forman el Objetivo de la entrada.
 *
 * Solo los encabezados de nivel 3 ("###") delimitan una tarea; un
 * encabezado de cualquier otro nivel (#, ##, ####...) cierra la
 * entrada en curso (si la hay) sin consumirse como criterio, y
 * cualquier contenido antes del primer "###" se ignora (preambulo del
 * documento, p. ej. un titulo de nivel 1 para el fichero entero).
 *
 * Este modulo es puro: no toca disco ni conoce `Task`. Una entrada
 * "malformada" no lanza excepcion — se devuelve como dato (ok: false)
 * para que el llamador decida que hacer con las demas entradas del
 * mismo fichero (criterio de aceptacion de TASK-004: una entrada mala
 * no debe impedir que las demas se importen).
 *
 * Punto de extension documentado, sin implementar en Sprint 0
 * (seccion 16.2 de la metodologia): una entrada que no encaja en este
 * formato podria repararse en el futuro con una llamada a un LLM antes
 * de darla por invalida. Hoy `runImportCommand` (src/commands/import.ts)
 * simplemente reporta el motivo exacto por stderr y sigue con las
 * demas.
 */
const HEADING_LEVEL_3_RE = /^###\s+(.*)$/;
const ANY_HEADING_RE = /^#{1,6}\s/;
// Tolera indentacion inicial (hallazgo IMPORTANTE de revision por
// pares, TASK-004): una lista indentada con espacios es Markdown
// valido y visualmente identica a una sin indentar en cualquier
// renderizador — anclarla a la columna 0 rechazaba la tarea ENTERA
// con un mensaje que no explicaba la causa real.
// Linea de cita (Objetivo): ">" en la columna 0, con un espacio opcional.
const QUOTE_RE = /^>\s?(.*)$/;
const LIST_ITEM_RE = /^\s*[-*]\s+(.+)$/;
export function parseImportMarkdown(content) {
    const lines = content.split(/\r?\n/);
    const entries = [];
    let current = null;
    const flush = () => {
        if (current === null)
            return;
        const titulo = current.tituloRaw.trim();
        if (titulo === '') {
            entries.push({
                ok: false,
                tituloRaw: current.tituloRaw,
                lineNumber: current.lineNumber,
                motivo: `El encabezado "###" de la linea ${current.lineNumber} no tiene titulo.`,
            });
        }
        else if (current.strayLine !== null) {
            entries.push({
                ok: false,
                tituloRaw: titulo,
                lineNumber: current.lineNumber,
                motivo: `La linea ${current.strayLine.lineNumber} no es un criterio de lista ("- ..." o ` +
                    `"* ...") ni una linea en blanco: "${current.strayLine.text}"`,
            });
        }
        else if (current.criterios.length === 0) {
            entries.push({
                ok: false,
                tituloRaw: titulo,
                lineNumber: current.lineNumber,
                motivo: `"${titulo}" no tiene ningun criterio de aceptacion (una lista "- ...") antes del ` +
                    'siguiente encabezado.',
            });
        }
        else {
            entries.push({
                ok: true,
                titulo,
                lineNumber: current.lineNumber,
                criterios: current.criterios,
                objetivo: current.objetivoLineas.join('\n').trim(),
            });
        }
        current = null;
    };
    let pegadaACriterio = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const h3 = HEADING_LEVEL_3_RE.exec(line);
        if (h3) {
            flush();
            current = { tituloRaw: h3[1] ?? '', lineNumber: i + 1, criterios: [], objetivoLineas: [], strayLine: null };
            continue;
        }
        if (current === null)
            continue; // preambulo antes del primer "###": se ignora.
        if (ANY_HEADING_RE.test(line)) {
            // Encabezado de otro nivel (no "###"): cierra la entrada actual
            // sin consumir esta linea como criterio ni como parte de ella.
            flush();
            continue;
        }
        if (line.trim() === '') {
            // MEN-2 de la revision de TASK-046: tras una linea en blanco, lo
            // sangrado ya no es la continuacion del criterio (puede ser un bloque
            // de codigo): vuelve a contar como linea suelta.
            pegadaACriterio = false;
            continue;
        }
        // Objetivo: "> texto" antes del primer criterio. Tras un criterio (o con
        // prosa suelta ya detectada) un ">" sigue siendo prosa suelta.
        const quote = QUOTE_RE.exec(line);
        if (quote && current.criterios.length === 0 && current.strayLine === null) {
            current.objetivoLineas.push(quote[1] ?? '');
            continue;
        }
        const li = LIST_ITEM_RE.exec(line);
        if (li) {
            current.criterios.push((li[1] ?? '').trim());
            pegadaACriterio = true;
            continue;
        }
        // TASK-046 (D7 de la auditoria): una linea SANGRADA justo despues de
        // un criterio es su continuacion, como en tarea-body.ts. Antes
        // invalidaba la entrada entera. La prosa sin sangrar sigue siendo un
        // error: no es la continuacion de nada.
        if (pegadaACriterio && /^\s+\S/.test(line) && current.criterios.length > 0 && current.strayLine === null) {
            const ultimo = current.criterios.length - 1;
            current.criterios[ultimo] = `${current.criterios[ultimo] ?? ''} ${line.trim()}`.trim();
            continue;
        }
        if (current.strayLine === null) {
            current.strayLine = { text: line, lineNumber: i + 1 };
        }
    }
    flush();
    return entries;
}
