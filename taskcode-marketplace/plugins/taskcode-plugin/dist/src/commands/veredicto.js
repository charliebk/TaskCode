/**
 * `taskctl veredicto TASK-NNN <valor>` — TASK-036 (auditoria del
 * 2026-10-03, A5).
 *
 * Escribe la linea `- Veredicto:` del informe de revision de la ultima
 * ronda en su forma canonica y la commitea. Existe porque los revisores
 * la escribian a mano en su propio vocabulario (`**APROBADO CON
 * CAMBIOS**`, `**cambios-solicitados**`), el gate fail-closed de
 * `finish` las rechazaba con razon, y cada vez hacia falta un commit de
 * normalizacion; TASK-017 llego a cerrarse con un veredicto que el
 * propio gate no acepta.
 *
 * Tres reglas:
 * 1. Se sustituyen TODAS las lineas `- Veredicto:` por UNA, en la
 *    posicion de la primera: `finish` exige que todas aprueben, y dejar
 *    la de la plantilla debajo de la nueva bloquearia el cierre.
 * 2. En una ronda fragmentada por dominio cada revisor firma su informe:
 *    con varios informes en la ronda, `--informe` es obligatorio.
 * 3. No cambia el estado de la tarea (accion `veredicto` de la maquina
 *    de estados, solo en `en-revision`), igual que `codex-review`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { readTareaFile } from '../fs/task-store.js';
import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
import { REVISION_DIRNAME } from './review.js';
export class VeredictoCommandError extends Error {
}
/** Flags de `taskctl veredicto`: extraerInforme y extraerPushFlag. */
export const FLAGS_VEREDICTO = ['--informe', '--push', '-p'];
/** Valor del argumento → texto canonico de la linea. */
export const VEREDICTOS = {
    aprobada: 'aprobada',
    'aprobada-con-correcciones': 'aprobada con correcciones',
    'cambios-solicitados': 'cambios-solicitados',
};
const PREFIJO = '- veredicto:';
/**
 * El informe con todas sus lineas `- Veredicto:` sustituidas por UNA
 * linea canonica, en la posicion de la primera; null si no tenia
 * ninguna. Mismo criterio de reconocimiento que `veredictoAprobado` de
 * finish.ts (sin distinguir mayusculas, ignorando la sangria).
 */
export function sustituirVeredicto(informe, linea) {
    const lineas = informe.split('\n');
    const esVeredicto = (l) => l.trim().toLowerCase().startsWith(PREFIJO);
    const primera = lineas.findIndex(esVeredicto);
    if (primera === -1)
        return null;
    const fin = lineas[primera]?.endsWith('\r') === true ? '\r' : '';
    const resultado = [];
    lineas.forEach((l, i) => {
        if (i === primera)
            resultado.push(linea + fin);
        else if (!esVeredicto(l))
            resultado.push(l);
    });
    return resultado.join('\n');
}
/** Saca `--informe <nombre>` de argv. */
function extraerInforme(argv) {
    const resto = [];
    let informe = null;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--informe') {
            const valor = argv[i + 1];
            if (valor === undefined || valor.startsWith('--')) {
                throw new VeredictoCommandError('[ERROR] --informe necesita el nombre del fichero: --informe informe-revision-N-<revisor>.md');
            }
            informe = valor;
            i++;
            continue;
        }
        resto.push(arg);
    }
    return { informe, resto };
}
export async function runVeredictoCommand(tareasRoot, argv, deps) {
    // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
    rechazarFlagsDesconocidos(argv, FLAGS_VEREDICTO, 'veredicto', (m) => new VeredictoCommandError(m));
    const { push, resto: sinPush } = extraerPushFlag(argv);
    const { informe: informePedido, resto } = extraerInforme(sinPush);
    const [id, valor, ...sobra] = resto;
    const uso = 'Uso: taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados> ' +
        '[--informe <nombre>] [--push]';
    if (id === undefined || id.trim() === '') {
        throw new VeredictoCommandError(`[ERROR] Falta el ID de la tarea. ${uso}`);
    }
    // Object.hasOwn y no `in`: `in` acepta claves heredadas como `toString`
    // (MEN-1 de la revision de TASK-036).
    if (valor === undefined || !Object.hasOwn(VEREDICTOS, valor)) {
        throw new VeredictoCommandError(`[ERROR] Veredicto ${valor === undefined ? 'ausente' : `"${valor}" no reconocido`}. ` +
            `Valores: ${Object.keys(VEREDICTOS).join(', ')}. ${uso}`);
    }
    if (sobra.length > 0) {
        throw new VeredictoCommandError(`[ERROR] Argumentos de mas: ${sobra.join(' ')}. ${uso}`);
    }
    const existing = await readTareaFile(tareasRoot, id);
    assertTransitionAllowed('veredicto', existing === null ? null : existing.task);
    const { task, filePath } = existing;
    const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
    const { ronda, nombres } = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
    if (nombres.length === 0) {
        throw new VeredictoCommandError(`[ERROR] ${task.id} no tiene ningun informe-revision-N.md en ${revisionDir}. ` +
            'Lo crea "taskctl review".');
    }
    let nombre;
    if (informePedido !== null) {
        if (!nombres.includes(informePedido)) {
            throw new VeredictoCommandError(`[ERROR] "${informePedido}" no es un informe de la ronda ${ronda}. ` +
                `Los de esa ronda son: ${nombres.join(', ')}.`);
        }
        nombre = informePedido;
    }
    else if (nombres.length > 1) {
        throw new VeredictoCommandError(`[ERROR] La ronda ${ronda} de ${task.id} esta fragmentada en ${nombres.length} informes: ` +
            `${nombres.join(', ')}. Cada revisor firma el suyo: anade --informe <nombre>.`);
    }
    else {
        nombre = nombres[0];
    }
    const informePath = path.join(revisionDir, nombre);
    const contenido = await readFile(informePath, 'utf8');
    const linea = `- Veredicto: ${VEREDICTOS[valor]}`;
    const nuevo = sustituirVeredicto(contenido, linea);
    if (nuevo === null) {
        throw new VeredictoCommandError(`[ERROR] ${informePath} no tiene ninguna linea "- Veredicto:". Anade la de la plantilla ` +
            '("- Veredicto: PENDIENTE") y vuelve a lanzar el comando.');
    }
    if (nuevo !== contenido)
        await writeFile(informePath, nuevo, 'utf8');
    const commitResult = autoCommit({
        cwd: deps.repoCwd,
        rutas: [informePath],
        mensaje: mensajeChore(task.id, `veredicto ronda ${ronda} (${valor})`),
        push,
    });
    return { id: task.id, ronda, informePath, linea, autoCommit: commitResult };
}
