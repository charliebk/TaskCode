/**
 * Guardian de merges — TASK-072, capa 2. Lo ejecuta el hook `PreToolUse` de
 * Claude Code (hooks/hooks.json -> dist/src/hooks/pre-tool-merge.js) ANTES de
 * cada comando Bash o PowerShell del agente, en todos los proyectos con el
 * plugin. Sin filtro `if` (decision de Carlos: el `if` de prefijo no ve
 * `cd x && git merge` ni `git checkout develop && git merge x`), asi que las
 * guardas van de la mas barata a la mas cara:
 *
 *   1. El texto no contiene `merge`: deja pasar (lo decide el punto de
 *      entrada, antes incluso de cargar este modulo).
 *   2. `analizarComando` no encuentra un merge ni un script de cierre.
 *   3. No es un repo, o la config no declara `comando_verificacion`, o no se
 *      puede leer: deja pasar (la puerta de `finish` sigue ahi).
 *   4. El destino no es la rama de integracion (`rama_base`) ni la principal.
 *   5. La fuente ya esta integrada: es ancestro del destino, de la principal
 *      (el backmerge de recuperacion que pide `finish`) o de origin/<destino>.
 *   6. Hay un VERDE guardado para el commit fuente (huella de commit, la que
 *      deja `finish` o el freno Stop con el arbol limpio): deja pasar.
 *   7. Cualquier otra cosa BLOQUEA (exit 2): «sin verde» cuenta como no verde
 *      (decision de Carlos) y remite a `taskctl finish`, que si verifica.
 *
 * Nunca ejecuta la verificacion (su timeout es de 30 s). Un fallo inesperado
 * antes de saber que el comando integra en develop/main deja pasar; despues,
 * bloquea. Nada de lo que escribe nombra el producto.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { analizarComando } from '../core/comando-merge.js';
import { raizDelRepo, resolverConfigConAvisos } from '../core/config.js';
import { huellaDeCommit, leerMemo } from '../fs/verificacion.js';
import { timeoutEfectivoS } from './freno-stop.js';
const PASAR = Object.freeze({ codigo: 0, stderr: '' });
/** Guarda 1, sin I/O: el comando de la entrada, si puede contener un merge. */
export function comandoCandidato(entrada) {
    const ti = entrada.tool_input;
    if (typeof ti !== 'object' || ti === null)
        return null;
    const cmd = ti.command;
    if (typeof cmd !== 'string' || !/merge/i.test(cmd))
        return null;
    return cmd;
}
function git(args, cwd) {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
    return { ok: r.error === undefined && r.status === 0, out: (r.stdout ?? '').trim() };
}
function existeRef(ref, cwd) {
    return git(['rev-parse', '--verify', '--quiet', ref], cwd).ok;
}
/** La principal sin red: main o master en local (resolveMainBranch consulta origin). */
function ramaPrincipal(cwd) {
    if (existeRef('refs/heads/main', cwd))
        return 'main';
    if (existeRef('refs/heads/master', cwd))
        return 'master';
    return null;
}
function esAncestro(a, b, cwd) {
    return git(['merge-base', '--is-ancestor', '--end-of-options', a, b], cwd).ok;
}
export function decidirPreToolUse(entrada) {
    const comando = comandoCandidato(entrada);
    if (comando === null)
        return PASAR;
    const ops = analizarComando(comando);
    if (ops.length === 0)
        return PASAR;
    if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd))
        return PASAR;
    const cwd = entrada.cwd;
    // 3 y 4: hasta saber que algo entra en develop/main, cualquier fallo deja pasar.
    const pendientes = [];
    try {
        for (const op of ops) {
            const dirOp = op.tipo === 'merge' && op.dir !== null ? path.resolve(cwd, op.dir) : cwd;
            let raiz;
            let config;
            try {
                raiz = raizDelRepo(dirOp);
                config = resolverConfigConAvisos(raiz).config;
            }
            catch {
                continue;
            }
            if (config.comando_verificacion === null)
                continue;
            const principal = ramaPrincipal(raiz);
            const protegidas = new Set([config.rama_base, ...(principal === null ? [] : [principal])]);
            for (const integ of integraciones(op, raiz, config.rama_base, principal)) {
                if (protegidas.has(integ.destino))
                    pendientes.push({ op, integ, config });
            }
        }
    }
    catch {
        return PASAR;
    }
    if (pendientes.length === 0)
        return PASAR;
    // 5 a 7: ya se sabe que el comando integra en una rama protegida.
    try {
        for (const { integ, config } of pendientes) {
            const motivo = motivoDeBloqueo(integ, config);
            if (motivo !== null)
                return { codigo: 2, stderr: motivo };
        }
        return PASAR;
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
            codigo: 2,
            stderr: `No se pudo comprobar la verificacion antes de este merge hacia una rama protegida: ${msg}\n` +
                'Cierra la tarea con taskctl finish TASK-NNN, que verifica antes de mergear.',
        };
    }
}
/** Pares fuente -> destino de una operacion. Para un merge sin destino explicito, la rama actual. */
function integraciones(op, raiz, integracion, principal) {
    if (op.tipo === 'script') {
        if (op.fuente === null)
            return [];
        const destinos = op.destinos.map((d) => (d === 'main' ? principal : integracion)).filter((d) => d !== null);
        return destinos.map((destino) => ({ fuente: op.fuente, destino, raiz }));
    }
    const destino = op.destino ?? git(['branch', '--show-current'], raiz).out;
    if (destino === '')
        return [];
    const fuentes = op.fuentes.length > 0 ? op.fuentes : [`${destino}@{upstream}`];
    return fuentes.map((fuente) => ({ fuente, destino, raiz }));
}
/** null si el merge puede pasar; si no, el texto para el agente. */
function motivoDeBloqueo(integ, config) {
    const { fuente, destino, raiz } = integ;
    const comando = config.comando_verificacion;
    const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${fuente}^{commit}`], raiz);
    if (!sha.ok || sha.out === '') {
        return mensaje(fuente, null, destino, comando, `no se puede resolver "${fuente}" a un commit`);
    }
    // 5: nada nuevo entra en el destino.
    const principal = ramaPrincipal(raiz);
    if (esAncestro(sha.out, destino, raiz))
        return null;
    if (principal !== null && esAncestro(sha.out, principal, raiz))
        return null;
    const remota = `refs/remotes/origin/${destino}`;
    if (existeRef(remota, raiz) && esAncestro(sha.out, remota, raiz))
        return null;
    // 6: un verde guardado para ese commit, con el timeout de finish o el del freno.
    const timeouts = new Set([config.timeout_verificacion, timeoutEfectivoS(config.timeout_verificacion).timeoutS]);
    let rojo = false;
    for (const t of timeouts) {
        const huella = huellaDeCommit(raiz, sha.out, comando, t);
        const r = huella === null ? null : leerMemo(raiz, huella);
        if (r?.estado === 'verde')
            return null;
        if (r !== null)
            rojo = true;
    }
    return mensaje(fuente, sha.out, destino, comando, rojo ? 'la ultima verificacion de ese commit NO salio en verde' : 'no consta una verificacion en verde de ese commit');
}
function mensaje(fuente, sha, destino, comando, motivo) {
    const quien = sha === null ? `"${fuente}"` : `"${fuente}" (${sha.slice(0, 10)})`;
    return [
        `Merge bloqueado: ${quien} entraria en "${destino}" y ${motivo} (comando de verificacion: ${comando}).`,
        'Cierra la tarea con taskctl finish TASK-NNN: ejecuta la verificacion y mergea con el flujo de la tarea.',
        'Si la persona decide integrar sin verificar, es taskctl finish TASK-NNN --sin-verificacion, que lo deja',
        'anotado en la tarea. No integres por otra via para saltarte esta comprobacion.',
    ].join('\n');
}
/** El JSON del hook. Un JSON roto o vacio es una entrada sin campos. */
export function parsearEntradaPreToolUse(texto) {
    try {
        const v = JSON.parse(texto);
        return typeof v === 'object' && v !== null && !Array.isArray(v) ? v : {};
    }
    catch {
        return {};
    }
}
