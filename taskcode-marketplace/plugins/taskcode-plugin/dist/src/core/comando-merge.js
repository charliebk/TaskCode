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
const MERGE_CON_VALOR = new Set(['-m', '-F', '-s', '-X', '--file', '--strategy', '--strategy-option', '--into-name']);
const MERGE_SIN_MERGE = new Set(['--abort', '--continue', '--quit', '--skip']);
/** Opciones de checkout/switch que crean la rama nombrada en el token siguiente. */
const CREAN_RAMA = new Set(['-b', '-B', '-c', '-C', '--orphan', '--create', '--force-create']);
/** Opciones de checkout/switch con valor que NO es la rama destino. */
const CAMBIO_CON_VALOR = new Set(['--conflict', '--pathspec-from-file']);
const SCRIPT_CIERRE = /^merge-(feature|fix|hotfix|release)-to-(develop|main)\.sh$/;
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
/** Quita asignaciones de entorno iniciales (`FOO=1 git merge x`) y `command`/`exec`. */
function sinPrefijos(seg) {
    let i = 0;
    while (i < seg.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(seg[i]) || ['command', 'exec', 'env'].includes(seg[i])))
        i++;
    return seg.slice(i);
}
/** Merges y scripts de cierre que aparecen en el comando, en orden. */
export function analizarComando(texto) {
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
                const nuevo = ramaDeCambio(args);
                if (nuevo !== null)
                    destino = nuevo;
            }
            else if (sub === 'merge') {
                if (args.some((a) => MERGE_SIN_MERGE.has(a)))
                    continue;
                ops.push({ tipo: 'merge', fuentes: posicionales(args, MERGE_CON_VALOR), destino, dir });
            }
            continue;
        }
        // `bash -c "..."`, `pwsh -Command "..."`, `cmd /c ...`: el texto interior se
        // analiza igual (MEN-1 de la revision: es una forma frecuente en agentes).
        const interior = textoDeShell(prog, seg);
        if (interior !== null) {
            ops.push(...analizarComando(interior));
            continue;
        }
        // `bash script.sh rama`, `sh ./script.sh rama` o el script a secas.
        let iScript = 0;
        if (SHELLS.has(prog)) {
            iScript = 1;
            while (iScript < seg.length && seg[iScript].startsWith('-'))
                iScript++;
        }
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
 * `powershell|pwsh [opts] -Command|-c <texto...>` y `cmd /c|/k <texto...>`.
 */
function textoDeShell(prog, seg) {
    if (SHELLS.has(prog)) {
        for (let i = 1; i < seg.length; i++) {
            const a = seg[i];
            if (!a.startsWith('-'))
                return null;
            if (/^-[a-z]*c[a-z]*$/i.test(a) && !a.startsWith('--'))
                return seg[i + 1] ?? null;
        }
        return null;
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
function ramaDeCambio(args) {
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
    const pos = posicionales(args, CAMBIO_CON_VALOR);
    return pos.length === 1 ? pos[0] : null;
}
