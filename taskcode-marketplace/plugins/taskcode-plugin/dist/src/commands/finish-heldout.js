/**
 * Puerta de los tests held-out en `taskctl finish` — TASK-073. Corre justo
 * despues de la puerta de verificacion y en los mismos caminos (abrir el MR o
 * ejecutar el script de Git-Flow), nunca en el segundo `finish` del MR ni en
 * el camino idempotente.
 *
 * Decisiones de Carlos en el plan:
 * - Los held-out se commitean en la rama base durante el diseño, antes de
 *   `start`: la rama nace con ellos.
 * - Huella: el contenido de `aceptacion/` en la rama tiene que ser identico al
 *   de la rama base (mismo arbol de Git). Si la rama los añade, edita o borra,
 *   `finish` aborta: el agente que implementa no puede ajustarlos a su codigo.
 * - Con held-out y sin `comando_heldout`, aborta: no se mergea creyendo que
 *   hubo freno.
 * - En rojo solo se muestran comando, codigo y duracion, nunca la salida: la
 *   lee el agente, y la salida de un test suele llevar sus aserciones.
 *
 * `--sin-verificacion` no la salta: los held-out son de la persona.
 */
import path from 'node:path';
import { resolverConfig } from '../core/config.js';
import { carpetasHeldout, CARPETA_HELDOUT, VARIABLE_HELDOUT } from '../core/heldout.js';
import { describirResultado } from '../core/informe-verificacion.js';
import { currentBranch, isWorkspaceClean, runGit } from '../fs/git.js';
import { ejecutarVerificacion } from '../fs/verificacion.js';
import { FinishCommandError } from './finish-opciones.js';
function rutasDe(ref, cwd) {
    const salida = runGit(['ls-tree', '-r', '--name-only', ref, '--', 'tareas'], cwd);
    return salida === '' ? [] : salida.split('\n');
}
function arbol(ref, carpeta, cwd) {
    return runGit(['rev-parse', `${ref}:${carpeta}`], cwd);
}
/** Ejecuta la puerta. Lanza FinishCommandError si no se puede mergear; no escribe nada. */
export function puertaHeldout(o) {
    const enRama = carpetasHeldout(rutasDe('HEAD', o.cwd), o.id);
    const enBase = carpetasHeldout(rutasDe(o.ramaBase, o.cwd), o.id);
    if (enRama.length === 0 && enBase.length === 0)
        return { tipo: 'sin-heldout' };
    const cierre = 'No se ha mergeado nada.';
    if (enBase.length === 0) {
        throw new FinishCommandError(`[ERROR] ${o.id}: la rama trae tests held-out (${enRama.join(', ')}) que no estan en "${o.ramaBase}". ` +
            `Los held-out los escribe la persona y los commitea en "${o.ramaBase}" durante el diseño, antes de ` +
            `start; la rama de la tarea no puede añadirlos. ${cierre}`);
    }
    if (enBase.length > 1) {
        throw new FinishCommandError(`[ERROR] ${o.id}: "${o.ramaBase}" tiene mas de una carpeta ${CARPETA_HELDOUT}/ para esta tarea ` +
            `(${enBase.join(', ')}): deja una sola y reintenta. ${cierre}`);
    }
    const base = enBase[0];
    const arbolBase = arbol(o.ramaBase, base, o.cwd);
    const distintas = enRama.filter((c) => arbol('HEAD', c, o.cwd) !== arbolBase);
    if (enRama.length === 0 || distintas.length > 0) {
        throw new FinishCommandError(`[ERROR] ${o.id}: los tests held-out de la rama no coinciden con los de "${o.ramaBase}" ` +
            `(${base}): la rama los ha editado, añadido o borrado. Restauralos desde "${o.ramaBase}" ` +
            `(git checkout ${o.ramaBase} -- ${base}) y commitea; si hay que cambiarlos, lo hace la persona en ` +
            `"${o.ramaBase}". ${cierre}`);
    }
    const config = resolverConfig(o.cwd);
    const comando = config.comando_heldout;
    if (comando === null) {
        throw new FinishCommandError(`[ERROR] ${o.id}: la tarea tiene tests held-out (${base}) y .taskcode/config.yml no declara ` +
            `comando_heldout, asi que no se pueden ejecutar. Declaralo (p. ej. comando_heldout: "node --test ` +
            `$${VARIABLE_HELDOUT}") y reintenta. ${cierre}`);
    }
    const actual = currentBranch(o.cwd);
    if (actual !== o.rama) {
        throw new FinishCommandError(`[ERROR] ${o.id}: los tests held-out se ejecutan sobre el arbol de la rama de la tarea, y la rama ` +
            `activa es "${actual === '' ? 'HEAD desacoplado' : actual}". Cambiate a "${o.rama}" y reintenta. ${cierre}`);
    }
    const carpeta = path.resolve(o.cwd, enRama[0]);
    const r = ejecutarVerificacion(o.cwd, comando, config.timeout_verificacion, {
        env: { ...process.env, [VARIABLE_HELDOUT]: carpeta },
        ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
    });
    if (r.estado !== 'verde') {
        // Sin la salida, a proposito (decision D4 del plan).
        throw new FinishCommandError(`[ERROR] ${o.id}: los tests held-out no estan en verde; no se mergea. ${cierre}\n` +
            `  Comando:   ${comando}\n` +
            `  Resultado: ${describirResultado(r)}\n` +
            `  Duracion:  ${(r.duracionMs / 1000).toFixed(1)} s\n` +
            'La salida no se muestra para no revelar los tests: la persona puede ejecutar el comando a mano ' +
            `(con ${VARIABLE_HELDOUT}=${carpeta}). Arregla el codigo, no los tests.`);
    }
    if (!isWorkspaceClean(o.cwd)) {
        throw new FinishCommandError(`[ERROR] ${o.id}: los tests held-out salieron en verde pero han dejado cambios en el arbol de trabajo ` +
            `(mira git status). El merge necesita el workspace limpio: que escriban en rutas ignoradas, y reintenta. ` +
            cierre);
    }
    return { tipo: 'verde', carpeta, duracionMs: r.duracionMs };
}
