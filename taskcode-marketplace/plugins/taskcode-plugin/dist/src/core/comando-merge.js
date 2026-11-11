/**
 * Que merges contiene el texto de un comando de shell — TASK-072, capa 2.
 * Puro y sin I/O: el guardian de merges (hooks/guardia-merge) lo usa para
 * descartar casi todo sin lanzar ningun proceso.
 *
 * No emula el shell. Parte el texto en segmentos (`&&`, `||`, `;`, `|`, `&`,
 * saltos de linea, parentesis), respeta comillas simples y dobles, y en cada
 * segmento mira:
 *
 * - `git [opciones globales] merge [opciones] <refs...>`: un merge. Su destino
 *   es la ultima rama a la que se cambio en el MISMO texto (`git checkout X`,
 *   `git switch X`) o, si no hubo ninguna, la rama actual (la resuelve quien
 *   llama). `--abort`, `--continue`, `--quit` y `--skip` no son merges nuevos.
 * - `bash|sh <...>/merge-<tipo>-to-<destino>.sh <rama>`: el script de cierre
 *   de Git-Flow, con la rama fuente como primer argumento.
 *
 * Limites aceptados en el plan (la red de verdad es la puerta de `finish`):
 * alias de git, `git pull`, `git push . x:develop`, variables y subshells
 * cuyo contenido no esta en el texto, `cd` a otro repo entre segmentos.
 */
const SEPARADORES = new Set(['&&', '||', ';', '|', '&', '\n', '(', ')']);
const ESCAPABLES = new Set([' ', '\t', '"', "'", '\\', '&', ';', '|', '(', ')', '$', '`']);
/** Parte el texto en segmentos de tokens. Las comillas se quitan; su contenido es un token. */
export function segmentar(texto) {
    const segmentos = [];
    let actual = [];
    let token = '';
    let hayToken = false;
    const cerrarToken = () => {
        if (hayToken)
            actual.push(token);
        token = '';
        hayToken = false;
    };
    const cerrarSegmento = () => {
        cerrarToken();
        if (actual.length > 0)
            segmentos.push(actual);
        actual = [];
    };
    for (let i = 0; i < texto.length; i++) {
        const c = texto[i];
        if (c === "'" || c === '"') {
            const fin = texto.indexOf(c, i + 1);
            const hasta = fin === -1 ? texto.length : fin;
            token += texto.slice(i + 1, hasta);
            hayToken = true;
            i = hasta;
            continue;
        }
        // Escape de bash solo ante un caracter especial: asi `C:\Git\bin\git.exe`
        // (PowerShell, rutas de Windows) llega entero.
        if (c === '\\' && i + 1 < texto.length && ESCAPABLES.has(texto[i + 1])) {
            token += texto[i + 1];
            hayToken = true;
            i++;
            continue;
        }
        const dos = texto.slice(i, i + 2);
        if (dos === '&&' || dos === '||') {
            cerrarSegmento();
            i++;
            continue;
        }
        if (c === '\r')
            continue;
        if (SEPARADORES.has(c)) {
            cerrarSegmento();
            continue;
        }
        if (c === ' ' || c === '\t') {
            cerrarToken();
            continue;
        }
        token += c;
        hayToken = true;
    }
    cerrarSegmento();
    return segmentos;
}
/** Nombre de programa sin ruta, sin `.exe` y en minusculas: `C:\Git\bin\git.exe` -> `git`. */
function programa(token) {
    const base = token.split(/[\\/]/).pop() ?? token;
    return base.toLowerCase().replace(/\.exe$/, '');
}
/** Opciones globales de git que llevan su valor en el token siguiente. */
const GLOBALES_CON_VALOR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env', '--super-prefix']);
/** Opciones de `git merge` que llevan su valor en el token siguiente. */
const MERGE_CON_VALOR = new Set(['-m', '--message', '-F', '-s', '-X', '--file', '--strategy', '--strategy-option', '--into-name']);
const MERGE_SIN_MERGE = new Set(['--abort', '--continue', '--quit', '--skip']);
/** Opciones de checkout/switch que crean la rama nombrada en el token siguiente. */
const CREAN_RAMA = new Set(['-b', '-B', '-c', '-C', '--orphan', '--create', '--force-create']);
/** Opciones de checkout/switch con valor que NO es la rama destino. */
const CAMBIO_CON_VALOR = new Set(['--conflict', '--pathspec-from-file']);
const SCRIPT_CIERRE = /^merge-(feature|fix|hotfix|release)-to-(develop|main)\.sh$/;
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
/**
 * Palabras que pueden ir delante de un comando sin cambiar cual es (TASK-103):
 * `command`, `exec`, `env`, `nohup`, `!`, la llave de un grupo
 * (`{ git merge x; }`) y las palabras de control de bash tras las que empieza
 * un comando: el cuerpo (`if c; then git merge x; fi`) y la condicion
 * (`if git merge x; then ...`, NUE-2 de la ronda 2).
 */
const PREFIJOS = new Set(['command', 'exec', 'env', 'nohup', '!', '{', 'then', 'do', 'else', 'if', 'elif', 'while', 'until']);
/** Quita asignaciones de entorno iniciales (`FOO=1 git merge x`), los PREFIJOS y `time [-p] [--]`. */
function sinPrefijos(seg) {
    let i = 0;
    while (i < seg.length) {
        const t = seg[i];
        if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) || PREFIJOS.has(t))
            i++;
        else if (t === 'time') {
            i++;
            while (seg[i] === '-p' || seg[i] === '--')
                i++;
        }
        else
            break;
    }
    return seg.slice(i);
}
/**
 * TASK-103 (MEN-2 de TASK-101): true si los argumentos de `git merge` llevan
 * `--abort`, `--continue`, `--quit` o `--skip` como opcion, no como el valor de
 * otra (`git merge -m --abort x` SI mergea x).
 */
function esControlDeMerge(args) {
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--')
            return false;
        if (MERGE_SIN_MERGE.has(a))
            return true;
        if (MERGE_CON_VALOR.has(a))
            i++;
    }
    return false;
}
/**
 * Merges y scripts de cierre que aparecen en el comando, en orden.
 * `esRevision` (TASK-103) dice si `git checkout <x>` cambiaria HEAD a ese nombre
 * (una rama, un tag o un commit): con un unico argumento tambien puede
 * restaurar un fichero, y saberlo exige I/O que este modulo no hace. Por
 * defecto todo cuenta como revision (el comportamiento previo).
 */
export function analizarComando(texto, esRevision = () => true) {
    const ops = [];
    let destino = null;
    for (const bruto of segmentar(texto)) {
        const seg = sinPrefijos(bruto);
        if (seg.length === 0)
            continue;
        const prog = programa(seg[0]);
        if (prog === 'git') {
            let i = 1;
            let dir = null;
            while (i < seg.length && seg[i].startsWith('-')) {
                const op = seg[i];
                if (GLOBALES_CON_VALOR.has(op)) {
                    if (op === '-C')
                        dir = seg[i + 1] ?? null;
                    i += 2;
                }
                else
                    i++;
            }
            const sub = (seg[i] ?? '').toLowerCase();
            const args = seg.slice(i + 1);
            if (sub === 'checkout' || sub === 'switch') {
                const nuevo = ramaDeCambio(args, esRevision);
                if (nuevo !== null)
                    destino = nuevo;
            }
            else if (sub === 'merge') {
                if (esControlDeMerge(args))
                    continue;
                ops.push({ tipo: 'merge', fuentes: posicionales(args, MERGE_CON_VALOR), destino, dir });
            }
            continue;
        }
        // `bash -c "..."`, `pwsh -Command "..."`, `cmd /c ...`: el texto interior se
        // analiza igual (MEN-1 de la revision: es una forma frecuente en agentes).
        const interior = textoDeShell(prog, seg);
        if (interior !== null) {
            ops.push(...analizarComando(interior, esRevision));
            continue;
        }
        // `bash script.sh rama`, `sh ./script.sh rama` o el script a secas.
        const iScript = SHELLS.has(prog) ? opcionesDeShell(seg).fin : 0;
        const script = seg[iScript];
        if (script === undefined)
            continue;
        const nombre = script.split(/[\\/]/).pop() ?? script;
        const m = SCRIPT_CIERRE.exec(nombre);
        if (m === null)
            continue;
        const fuente = seg.slice(iScript + 1).find((a) => !a.startsWith('-')) ?? null;
        ops.push({
            tipo: 'script',
            script: nombre,
            fuente,
            destinos: m[2] === 'main' ? ['main', 'integracion'] : ['integracion'],
        });
    }
    return ops;
}
/**
 * El comando que un shell recibe como texto, o null si no es esa forma:
 * `bash|sh|zsh|dash [opts] -c <texto>` (tambien `-lc`, `-ec`...),
 * `powershell|pwsh [opts] -Command|-c <texto...>`, `cmd /c|/k <texto...>` y
 * (TASK-103) `eval <texto...>`.
 */
function textoDeShell(prog, seg) {
    if (prog === 'eval')
        return seg.length > 1 ? seg.slice(1).join(' ') : null;
    if (SHELLS.has(prog)) {
        // Como bash: con -c, el texto es el primer argumento que no es opcion.
        const { fin, conC } = opcionesDeShell(seg);
        return conC ? (seg[fin] ?? null) : null;
    }
    if (prog === 'powershell' || prog === 'pwsh') {
        const i = seg.findIndex((a, j) => j > 0 && /^-(c|com|comm|comma|comman|command)$/i.test(a));
        return i === -1 ? null : seg.slice(i + 1).join(' ');
    }
    if (prog === 'cmd') {
        const i = seg.findIndex((a, j) => j > 0 && /^\/[ck]$/i.test(a));
        return i === -1 ? null : seg.slice(i + 1).join(' ');
    }
    return null;
}
/**
 * Donde acaban las opciones de un `bash|sh|zsh|dash` (TASK-077, MEN-4 de
 * TASK-072): una sola regla para `-c` y para el script de cierre.
 * - Es opcion todo token que empiece por `-` o `+`; `--` las termina.
 * - Llevan valor en el token siguiente `--rcfile`, `--init-file`, y cada `o`/`O`
 *   de un grupo corto consume uno (`-o pipefail`, `+o x`, `-O extglob`, `-oc x`).
 * - `conC`: hubo `-c` (solo o en un grupo corto: `-lc`, `-ec`).
 * `fin` es el indice del primer argumento que no es opcion.
 */
function opcionesDeShell(seg) {
    let conC = false;
    let i = 1;
    while (i < seg.length) {
        const a = seg[i];
        if (a === '--')
            return { fin: i + 1, conC };
        if (!a.startsWith('-') && !a.startsWith('+'))
            break;
        if (a === '--rcfile' || a === '--init-file') {
            i += 2;
            continue;
        }
        if (!a.startsWith('--')) {
            const grupo = a.slice(1);
            if (a.startsWith('-') && grupo.includes('c'))
                conC = true;
            // Como bash: cada o/O del grupo consume un valor, este donde este
            // (`-oc pipefail "..."`: MEN-1 de la revision de TASK-077).
            const valores = (grupo.match(/[oO]/g) ?? []).length;
            if (valores > 0) {
                i += 1 + valores;
                continue;
            }
        }
        i++;
    }
    return { fin: i, conC };
}
/** Argumentos que no son opciones (ni el valor de una), hasta `--`. */
function posicionales(args, conValor) {
    const fuera = [];
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--') {
            fuera.push(...args.slice(i + 1));
            break;
        }
        if (a.startsWith('-')) {
            if (conValor.has(a))
                i++;
            continue;
        }
        fuera.push(a);
    }
    return fuera;
}
/**
 * La rama a la que deja un `git checkout|switch`, o null si no cambia de rama
 * (restaurar ficheros: `git checkout -- f`, `git checkout develop -- f`).
 */
function ramaDeCambio(args, esRevision) {
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (CREAN_RAMA.has(a))
            return args[i + 1] ?? null;
    }
    if (args.includes('--')) {
        const antes = args.slice(0, args.indexOf('--'));
        // `git checkout develop -- f` restaura f desde develop: no cambia de rama.
        if (args.indexOf('--') < args.length - 1)
            return null;
        return posicionales(antes, CAMBIO_CON_VALOR)[0] ?? null;
    }
    // `git checkout develop src/a.ts` (sin `--`) tambien restaura ficheros (MEN-2).
    // `git checkout README.md` tambien (TASK-103): con un unico argumento que no
    // es una revision, no cambia HEAD y el destino sigue siendo el anterior. Un
    // tag o un commit si: HEAD queda desacoplado y el merge no entra en ninguna rama.
    const pos = posicionales(args, CAMBIO_CON_VALOR);
    return pos.length === 1 && esRevision(pos[0]) ? pos[0] : null;
}
/**
 * TASK-101: lo unico que puede acompanar al merge para que el guardian aplique
 * la exencion de solo documentacion. Lista blanca minima (CRI-2 de la revision:
 * `echo`, `cat`, `tee` o `git log` con una redireccion o una sustitucion
 * escribian una ref y movian la rama que se evalua).
 */
const SOLO_CARPETA = new Set(['cd', 'pushd', 'popd', 'pwd', 'set-location', 'sl']);
/** Subcomandos de git que solo consultan (checkout/switch y branch, aparte; merge se cuenta fuera). */
const GIT_SOLO_CONSULTA = new Set(['status', 'log', 'diff', 'show', 'rev-parse']);
/** `git branch` sin mas, o solo con estas opciones, solo lista. */
const BRANCH_SOLO_LISTA = new Set(['--show-current', '-a', '-r', '--list', '-v', '-vv', '--all', '--remotes']);
/**
 * Caracteres que el troceado no interpreta y que pueden escribir ficheros o
 * ejecutar otra orden: redirecciones, sustitucion de comandos y de variables.
 */
const CARACTERES_PELIGROSOS = /[<>`$]/;
/**
 * TASK-101: true si el comando, aparte de UN merge o script de cierre, solo
 * cambia de carpeta o de rama o consulta. El guardian evalua la rama que entra
 * ANTES de ejecutar el comando: si algo puede crear o mover commits antes del
 * merge (`git commit`, otro `git merge` (CRI-1), `reset`, `pull`, un script,
 * una redireccion a una ref...), lo evaluado no es lo que entra y no se aplica
 * la exencion. Ante cualquier duda, false.
 */
export function comandoSoloIntegra(texto) {
    if (CARACTERES_PELIGROSOS.test(texto))
        return false;
    if (analizarComando(texto).length !== 1)
        return false;
    const cuenta = { integraciones: 0 };
    // NUE-2 de la revision: se cuentan aparte todos los merges y scripts de cierre,
    // con la misma regla que analizarComando (desde TASK-103, `-m --abort x` cuenta).
    return segmentosSoloIntegran(texto, cuenta) && cuenta.integraciones === 1;
}
/**
 * Unicas opciones de checkout/switch admitidas (NUE-1 de la revision: `-fB`,
 * `-Bdocs`, `--force-c` o `-\B` creaban o forzaban la rama sin coincidir con
 * ninguna opcion prohibida). Lista cerrada, no lista de prohibidas.
 */
const CAMBIO_OPCIONES_ADMITIDAS = new Set(['-q', '--quiet', '--detach']);
function segmentosSoloIntegran(texto, cuenta) {
    for (const bruto of segmentar(texto)) {
        const seg = sinPrefijos(bruto);
        if (seg.length === 0)
            continue;
        // Asignaciones de entorno delante (`GIT_DIR=x git merge`): fuera.
        if (seg.length !== bruto.length)
            return false;
        const prog = programa(seg[0]);
        if (SOLO_CARPETA.has(prog))
            continue;
        // Una barra invertida que quede tras el troceado la interpretaria el shell (`-\B` es `-B`).
        if (seg.some((t) => t.includes('\\')))
            return false;
        if (prog === 'git') {
            let i = 1;
            while (i < seg.length && seg[i].startsWith('-')) {
                // Solo `-C <dir>`: `-c alias.x=!...` o `--exec-path` ejecutarian otra cosa.
                if (seg[i] !== '-C')
                    return false;
                i += 2;
            }
            const sub = (seg[i] ?? '').toLowerCase();
            const args = seg.slice(i + 1);
            if (args.some((a) => a.startsWith('--output') || a === '-o' || a.startsWith('--exec')))
                return false;
            if (sub === 'merge') {
                if (esControlDeMerge(args))
                    return false;
                cuenta.integraciones++;
                continue;
            }
            if (GIT_SOLO_CONSULTA.has(sub))
                continue;
            if (sub === 'checkout' || sub === 'switch') {
                const opciones = args.slice(0, args.includes('--') ? args.indexOf('--') : args.length).filter((a) => a.startsWith('-'));
                if (opciones.every((a) => CAMBIO_OPCIONES_ADMITIDAS.has(a)))
                    continue;
                return false;
            }
            if (sub === 'branch' && args.every((a) => BRANCH_SOLO_LISTA.has(a)))
                continue;
            return false;
        }
        // `eval` vuelve a expandir su texto: lo evaluado no seria lo que se ejecuta (TASK-103).
        if (prog === 'eval')
            return false;
        const interior = textoDeShell(prog, seg);
        if (interior !== null) {
            if (!segmentosSoloIntegran(interior, cuenta))
                return false;
            continue;
        }
        const iScript = SHELLS.has(prog) ? opcionesDeShell(seg).fin : 0;
        const nombre = (seg[iScript] ?? '').split(/[\\/]/).pop() ?? '';
        if (SCRIPT_CIERRE.test(nombre)) {
            cuenta.integraciones++;
            continue;
        }
        return false;
    }
    return true;
}
