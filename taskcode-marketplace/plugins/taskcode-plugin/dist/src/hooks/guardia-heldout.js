/**
 * Guardian de held-out — TASK-078. Lo ejecutan dos hooks `PreToolUse`
 * (hooks/hooks.json): el de herramientas de fichero (pre-tool-lectura.js) y
 * el de Bash/PowerShell (pre-tool-merge.js). Bloquea (exit 2) que el agente
 * lea, busque o edite la carpeta `aceptacion/` de la tarea cuya rama es la
 * actual; en cualquier otra rama (la base, durante el diseño) deja pasar,
 * para que la persona pueda escribirlos con ayuda.
 *
 * Decisiones de Carlos en el plan:
 * - La tarea protegida se saca del NOMBRE de la rama actual
 *   (`feature/task-078-...`), nunca de `tarea.md` en el arbol de trabajo: el
 *   agente podria editar ese fichero, que es justo la ruta hermana permitida,
 *   y apagar el guardian. Con HEAD desacoplado en un rebase, la rama sale de
 *   `rebase-merge/head-name` (o `rebase-apply/`).
 * - Cambiar de rama para leerlos (git switch a la base, leer, volver) no se
 *   frena, igual que una busqueda que no nombra la carpeta (Grep sobre la
 *   raiz): es un freno contra despistes, no un cierre. El cierre de la
 *   edicion es la huella de `finish`.
 *
 * Nunca bloquea por un fallo propio: sin cwd, sin repo o con `git` roto, deja
 * pasar. Solo hace I/O si la ruta ya nombra una carpeta held-out. Nada de lo
 * que escribe nombra el producto.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { numerosHeldoutEnRuta, numerosHeldoutEnTexto, CARPETA_HELDOUT } from '../core/heldout.js';
import { numeroDeRama } from '../core/task-id.js';
import { CONFIG_DIR, CONFIG_FILE, parsearConfig, raizDelRepo } from '../core/config.js';
import { PASAR } from './entrada-pretooluse.js';
const SHELL = new Set(['Bash', 'PowerShell']);
/** Campos de `tool_input` que llevan una ruta o un patron de ruta (file_path, notebook_path, path, pattern, glob). */
const CAMPO_RUTA = /path|pattern|glob/i;
/** Numeros de tarea cuya carpeta held-out nombra la entrada, sin I/O. */
export function numerosEnEntrada(entrada) {
    const ti = entrada.tool_input;
    if (typeof ti !== 'object' || ti === null)
        return [];
    const cwd = typeof entrada.cwd === 'string' && entrada.cwd !== '' ? entrada.cwd : process.cwd();
    const campos = ti;
    if (typeof entrada.tool_name === 'string' && SHELL.has(entrada.tool_name)) {
        return typeof campos.command === 'string' ? numerosHeldoutEnTexto(campos.command, cwd) : [];
    }
    // El `path` de Grep/Glob es la base de su `pattern`/`glob`.
    const base = typeof campos.path === 'string' && campos.path !== '' ? path.resolve(cwd, campos.path) : cwd;
    const nums = new Set();
    for (const [clave, valor] of Object.entries(campos)) {
        if (typeof valor !== 'string' || !CAMPO_RUTA.test(clave))
            continue;
        for (const n of numerosHeldoutEnRuta(valor, clave === 'path' ? cwd : base))
            nums.add(n);
    }
    return [...nums];
}
function git(args, cwd) {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
    return { ok: r.error === undefined && r.status === 0, out: (r.stdout ?? '').trim() };
}
/** La rama actual; con HEAD desacoplado en un rebase, la que se esta rebasando. null si no hay repo. */
export function ramaActual(cwd) {
    const actual = git(['branch', '--show-current'], cwd);
    if (!actual.ok)
        return null;
    if (actual.out !== '')
        return actual.out;
    for (const f of ['rebase-merge/head-name', 'rebase-apply/head-name']) {
        const r = git(['rev-parse', '--git-path', f], cwd);
        if (!r.ok || r.out === '')
            continue;
        const fichero = path.resolve(cwd, r.out);
        if (existsSync(fichero))
            return readFileSync(fichero, 'utf8').trim().replace(/^refs\/heads\//, '');
    }
    return '';
}
/**
 * TASK-114: false solo si la config del repo se lee y no declara
 * `comando_heldout` (sin held-out, `finish` no los ejecuta y no hay nada que
 * proteger). Sin procesos: la raiz sale de buscar `.git` hacia arriba. Una
 * config que no se puede leer cuenta como que si los declara: un error no
 * apaga el guardian.
 */
export function declaraHeldout(cwd) {
    try {
        const ruta = path.join(raizDelRepo(cwd), CONFIG_DIR, CONFIG_FILE);
        if (!existsSync(ruta))
            return false;
        return parsearConfig(readFileSync(ruta, 'utf8'), ruta).comando_heldout !== null;
    }
    catch {
        return true;
    }
}
export function decidirHeldout(entrada) {
    try {
        const nums = numerosEnEntrada(entrada);
        if (nums.length === 0)
            return PASAR;
        if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd))
            return PASAR;
        // TASK-114: sin held-out declarado no hay nada que proteger; sale sin lanzar git.
        if (!declaraHeldout(entrada.cwd))
            return PASAR;
        const rama = ramaActual(entrada.cwd);
        if (rama === null || rama === '')
            return PASAR;
        const n = numeroDeRama(rama);
        if (n === null || !nums.includes(n))
            return PASAR;
        return { codigo: 2, stderr: mensaje(`TASK-${String(n).padStart(3, '0')}`, rama) };
    }
    catch {
        return PASAR;
    }
}
function mensaje(id, rama) {
    return [
        `Bloqueado: esto nombra la carpeta ${CARPETA_HELDOUT}/ de ${id}, la tarea de la rama actual ("${rama}").`,
        'Son sus tests held-out: los escribe la persona y el agente que implementa no los lee, no los busca ni los edita.',
        'Implementa contra los criterios de aceptacion de tarea.md. Si crees que un held-out esta mal, dilo:',
        'cambiarlo lo hace la persona en la rama base.',
    ].join('\n');
}
