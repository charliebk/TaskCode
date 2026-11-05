/**
 * Puerta de los tests held-out en `taskctl finish` — TASK-073. Corre justo
 * despues de la puerta de verificacion y en los mismos caminos (abrir el MR o
 * ejecutar el script de Git-Flow), nunca en el segundo `finish` del MR ni en
 * el camino idempotente.
 *
 * Decisiones de Carlos en el plan:
 * - Los held-out se commitean en la rama base durante el diseño, antes de
 *   `start`: la rama nace con ellos. La base es aquella de la que nace la rama:
 *   la de integracion, salvo en un hotfix, que nace de la principal (MEN-1 de
 *   la revision).
 * - Huella: el contenido de `aceptacion/` en la rama tiene que ser identico al
 *   de la base (mismo arbol de Git), este donde este la carpeta: `start` y
 *   `review` la mueven de estado. Si no coincide, el merge-base dice quien los
 *   cambio (IMP-1 de la revision): si la rama no los toco, fue la base, y basta
 *   con integrarla; si los toco la rama, se restauran sobre su ruta.
 * - `comando_heldout` y su timeout se leen de la config de la BASE, no de la
 *   rama: la rama no puede cambiar como se ejecutan (MEN-2 de la revision).
 * - Con held-out y sin `comando_heldout`, aborta: no se mergea creyendo que
 *   hubo freno.
 * - En rojo solo se muestran comando, codigo y duracion, nunca la salida: la
 *   lee el agente, y la salida de un test suele llevar sus aserciones.
 *
 * `--sin-verificacion` no la salta: los held-out son de la persona.
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ConfigError, parsearConfig } from '../core/config.js';
import { carpetasHeldout, variantesHeldout, CARPETA_HELDOUT, VARIABLE_HELDOUT } from '../core/heldout.js';
import { describirResultado } from '../core/informe-verificacion.js';
import { currentBranch, isWorkspaceClean, runGit } from '../fs/git.js';
import { ejecutarVerificacion } from '../fs/verificacion.js';
import { FinishCommandError } from './finish-opciones.js';
const CIERRE = 'No se ha mergeado nada.';
function rutasDe(ref, cwd) {
    const salida = runGit(['ls-tree', '-r', '--name-only', ref, '--', 'tareas'], cwd);
    return salida === '' ? [] : salida.split('\n');
}
function arbol(ref, carpeta, cwd) {
    return runGit(['rev-parse', `${ref}:${carpeta}`], cwd);
}
function mergeBase(a, b, cwd) {
    const r = spawnSync('git', ['merge-base', a, b], { cwd, encoding: 'utf8', windowsHide: true });
    return r.status === 0 ? (r.stdout ?? '').trim() : null;
}
/** La config de `.taskcode/config.yml` en `ref`; sin fichero, la de por defecto. */
function configDe(ref, cwd, id) {
    const r = spawnSync('git', ['show', `${ref}:.taskcode/config.yml`], { cwd, encoding: 'utf8', windowsHide: true });
    try {
        return parsearConfig(r.status === 0 ? (r.stdout ?? '') : '', `${ref}:.taskcode/config.yml`);
    }
    catch (e) {
        if (!(e instanceof ConfigError))
            throw e;
        throw new FinishCommandError(`[ERROR] ${id}: la configuracion de "${ref}", que es la que manda en los held-out, no es valida:\n  ` +
            `${e.message.replace(/^\[ERROR\]\s*/, '')}\n${CIERRE}`);
    }
}
/** Ordenes para dejar `destino` (en la rama) igual que `origen` en la base, y borrar el resto. */
function remedio(base, origen, destino, otras) {
    const pasos = [
        ...otras.map((c) => `git rm -r -q ${c}`),
        `git rm -r -q --ignore-unmatch ${destino}`,
        `git read-tree --prefix=${destino}/ ${base}:${origen}`,
        `git checkout -- ${destino}`,
    ];
    return `${pasos.join(' && ')} && git commit -m "restaurar los held-out desde ${base}"`;
}
/** Ejecuta la puerta. Lanza FinishCommandError si no se puede mergear; no escribe nada. */
export function puertaHeldout(o) {
    const rutasRama = rutasDe('HEAD', o.cwd);
    const rutasBase = rutasDe(o.ramaBase, o.cwd);
    // MEN-6 de la revision: se dice donde esta la variante (en la base, o solo en la rama).
    const rarasBase = variantesHeldout(rutasBase, o.id);
    const rarasRama = variantesHeldout(rutasRama, o.id).filter((c) => !rarasBase.includes(c));
    if (rarasBase.length > 0 || rarasRama.length > 0) {
        const donde = rarasBase.length > 0
            ? `${rarasBase.join(', ')} (en "${o.ramaBase}")`
            : `${rarasRama.join(', ')} (en la rama de la tarea; en "${o.ramaBase}" no esta)`;
        throw new FinishCommandError(`[ERROR] ${o.id}: ${donde} no se llama exactamente "${CARPETA_HELDOUT}" (en minusculas), asi que no ` +
            'se tomaria por los tests held-out y no se ejecutarian. ' +
            (rarasBase.length > 0
                ? `Renombrala a ${CARPETA_HELDOUT}/ en "${o.ramaBase}" e integralo en la rama. `
                : `La rama no puede crear held-out: borrala de la rama. `) +
            CIERRE);
    }
    const enRama = carpetasHeldout(rutasRama, o.id);
    const enBase = carpetasHeldout(rutasBase, o.id);
    if (enRama.length === 0 && enBase.length === 0) {
        const enDiseno = o.ramaDiseno === undefined ? [] : carpetasHeldout(rutasDe(o.ramaDiseno, o.cwd), o.id);
        if (enDiseno.length > 0) {
            throw new FinishCommandError(`[ERROR] ${o.id}: los tests held-out de esta tarea estan en "${o.ramaDiseno}" (${enDiseno.join(', ')}), ` +
                `pero un hotfix nace de "${o.ramaBase}", que no los tiene, asi que no se ejecutarian. Commitealos ` +
                `tambien en "${o.ramaBase}" e integralo en la rama del hotfix; si no aplican al hotfix, quitalos de ` +
                `"${o.ramaDiseno}". ${CIERRE}`);
        }
        return { tipo: 'sin-heldout' };
    }
    const destino = `${o.carpetaTarea}/${CARPETA_HELDOUT}`;
    if (enBase.length === 0) {
        throw new FinishCommandError(`[ERROR] ${o.id}: la rama trae tests held-out (${enRama.join(', ')}) que no estan en "${o.ramaBase}". ` +
            `Los held-out los escribe la persona y los commitea en "${o.ramaBase}" durante el diseño, antes de ` +
            `start; la rama de la tarea no puede añadirlos. Si son de la persona, que los commitee en ` +
            `"${o.ramaBase}" y despues integra "${o.ramaBase}" en la rama. ${CIERRE}`);
    }
    if (enBase.length > 1) {
        throw new FinishCommandError(`[ERROR] ${o.id}: "${o.ramaBase}" tiene mas de una carpeta ${CARPETA_HELDOUT}/ para esta tarea ` +
            `(${enBase.join(', ')}): deja una sola y reintenta. ${CIERRE}`);
    }
    const base = enBase[0];
    const arbolBase = arbol(o.ramaBase, base, o.cwd);
    const arbolesRama = enRama.map((c) => arbol('HEAD', c, o.cwd));
    if (enRama.length !== 1 || arbolesRama[0] !== arbolBase) {
        // ¿Quien los cambio? En el merge-base estaban como los dejo la base al nacer la rama.
        const mb = mergeBase('HEAD', o.ramaBase, o.cwd);
        const enMb = mb === null ? [] : carpetasHeldout(rutasDe(mb, o.cwd), o.id);
        const arbolesMb = new Set(enMb.map((c) => arbol(mb, c, o.cwd)));
        const ramaSinTocar = enRama.length === enMb.length && arbolesMb.size <= 1 && arbolesRama.every((a) => arbolesMb.has(a));
        if (ramaSinTocar) {
            throw new FinishCommandError(`[ERROR] ${o.id}: los tests held-out de "${o.ramaBase}" han cambiado desde que nacio la rama, y la ` +
                `rama no los ha tocado: integra "${o.ramaBase}" en la rama (git merge ${o.ramaBase}) y reintenta, ` +
                `para que finish ejecute los de ahora. ${CIERRE}`);
        }
        const enDestino = enRama.includes(destino);
        const otras = enRama.filter((c) => c !== destino);
        // MEN-5 de la revision: si ademas la base los cambio, primero se integra, para
        // que el conflicto (si lo hay) salga en la rama y no en el merge final.
        const baseCambio = !(arbolesMb.size === 1 && arbolesMb.has(arbolBase));
        throw new FinishCommandError(`[ERROR] ${o.id}: la rama ha editado, añadido o borrado los tests held-out: su contenido ` +
            `(${enRama.length === 0 ? 'ninguno' : enRama.join(', ')}) no coincide con el de "${o.ramaBase}" (${base}). ` +
            'El agente que implementa no puede cambiarlos; si hay que cambiarlos, lo hace la persona en ' +
            `"${o.ramaBase}". ` +
            (baseCambio
                ? `Ademas "${o.ramaBase}" los ha cambiado desde que nacio la rama: integra primero "${o.ramaBase}" ` +
                    `(git merge ${o.ramaBase}; si hay conflicto en los held-out, quedate con la version de ` +
                    `"${o.ramaBase}") y reintenta; si sigue sin coincidir, restauralos`
                : 'Para restaurarlos') +
            `${enDestino ? '' : ` en ${destino}`}:\n  ${remedio(o.ramaBase, base, destino, otras)}\n${CIERRE}`);
    }
    const config = configDe(o.ramaBase, o.cwd, o.id);
    const comando = config.comando_heldout;
    if (comando === null) {
        throw new FinishCommandError(`[ERROR] ${o.id}: la tarea tiene tests held-out (${base}) y la configuracion de "${o.ramaBase}" no ` +
            `declara comando_heldout, asi que no se pueden ejecutar. Declaralo en .taskcode/config.yml de ` +
            `"${o.ramaBase}" (p. ej. comando_heldout: "node --test $${VARIABLE_HELDOUT}"), integralo en la rama ` +
            `y reintenta. ${CIERRE}`);
    }
    const actual = currentBranch(o.cwd);
    if (actual !== o.rama) {
        throw new FinishCommandError(`[ERROR] ${o.id}: los tests held-out se ejecutan sobre el arbol de la rama de la tarea, y la rama ` +
            `activa es "${actual === '' ? 'HEAD desacoplado' : actual}". Cambiate a "${o.rama}" y reintenta. ${CIERRE}`);
    }
    const carpeta = path.resolve(o.cwd, enRama[0]);
    const r = ejecutarVerificacion(o.cwd, comando, config.timeout_verificacion, {
        env: { ...process.env, [VARIABLE_HELDOUT]: carpeta },
        ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
    });
    if (r.estado !== 'verde') {
        // Sin la salida, a proposito (decision D4 del plan).
        throw new FinishCommandError(`[ERROR] ${o.id}: los tests held-out no estan en verde; no se mergea. ${CIERRE}\n` +
            `  Comando:   ${comando}\n` +
            `  Resultado: ${describirResultado(r)}\n` +
            `  Duracion:  ${(r.duracionMs / 1000).toFixed(1)} s\n` +
            'La salida no se muestra para no revelar los tests: la persona puede ejecutar el comando a mano ' +
            `(con ${VARIABLE_HELDOUT}=${carpeta}). Arregla el codigo, no los tests.`);
    }
    if (!isWorkspaceClean(o.cwd)) {
        throw new FinishCommandError(`[ERROR] ${o.id}: los tests held-out salieron en verde pero han dejado cambios en el arbol de trabajo ` +
            `(mira git status). El merge necesita el workspace limpio: que escriban en rutas ignoradas, y reintenta. ` +
            CIERRE);
    }
    return { tipo: 'verde', carpeta, duracionMs: r.duracionMs };
}
