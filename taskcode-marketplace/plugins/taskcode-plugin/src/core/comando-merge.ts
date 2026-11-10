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

export type OperacionMerge =
  | {
      tipo: 'merge';
      /** Refs que entran; vacio = el upstream (`git merge` a secas). */
      fuentes: string[];
      /** Rama destino si el texto se cambio a ella antes; null = la actual. */
      destino: string | null;
      /** El `-C <dir>` del git del merge, si lo tenia. */
      dir: string | null;
    }
  | {
      tipo: 'script';
      script: string;
      fuente: string | null;
      /** A donde integra: feature/fix a la de integracion; hotfix/release a main y backmerge. */
      destinos: ('integracion' | 'main')[];
    };

const SEPARADORES = new Set(['&&', '||', ';', '|', '&', '\n', '(', ')']);
const ESCAPABLES = new Set([' ', '\t', '"', "'", '\\', '&', ';', '|', '(', ')', '$', '`']);

/** Parte el texto en segmentos de tokens. Las comillas se quitan; su contenido es un token. */
export function segmentar(texto: string): string[][] {
  const segmentos: string[][] = [];
  let actual: string[] = [];
  let token = '';
  let hayToken = false;
  const cerrarToken = () => {
    if (hayToken) actual.push(token);
    token = '';
    hayToken = false;
  };
  const cerrarSegmento = () => {
    cerrarToken();
    if (actual.length > 0) segmentos.push(actual);
    actual = [];
  };
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i] as string;
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
    if (c === '\\' && i + 1 < texto.length && ESCAPABLES.has(texto[i + 1] as string)) {
      token += texto[i + 1] as string;
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
    if (c === '\r') continue;
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
function programa(token: string): string {
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
function sinPrefijos(seg: readonly string[]): string[] {
  let i = 0;
  while (i < seg.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(seg[i] as string) || ['command', 'exec', 'env'].includes(seg[i] as string))) i++;
  return seg.slice(i);
}

/** Merges y scripts de cierre que aparecen en el comando, en orden. */
export function analizarComando(texto: string): OperacionMerge[] {
  const ops: OperacionMerge[] = [];
  let destino: string | null = null;
  for (const bruto of segmentar(texto)) {
    const seg = sinPrefijos(bruto);
    if (seg.length === 0) continue;
    const prog = programa(seg[0] as string);

    if (prog === 'git') {
      let i = 1;
      let dir: string | null = null;
      while (i < seg.length && (seg[i] as string).startsWith('-')) {
        const op = seg[i] as string;
        if (GLOBALES_CON_VALOR.has(op)) {
          if (op === '-C') dir = seg[i + 1] ?? null;
          i += 2;
        } else i++;
      }
      const sub = (seg[i] ?? '').toLowerCase();
      const args = seg.slice(i + 1);
      if (sub === 'checkout' || sub === 'switch') {
        const nuevo = ramaDeCambio(args);
        if (nuevo !== null) destino = nuevo;
      } else if (sub === 'merge') {
        if (args.some((a) => MERGE_SIN_MERGE.has(a))) continue;
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
    const iScript = SHELLS.has(prog) ? opcionesDeShell(seg).fin : 0;
    const script = seg[iScript];
    if (script === undefined) continue;
    const nombre = script.split(/[\\/]/).pop() ?? script;
    const m = SCRIPT_CIERRE.exec(nombre);
    if (m === null) continue;
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
function textoDeShell(prog: string, seg: readonly string[]): string | null {
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
function opcionesDeShell(seg: readonly string[]): { fin: number; conC: boolean } {
  let conC = false;
  let i = 1;
  while (i < seg.length) {
    const a = seg[i] as string;
    if (a === '--') return { fin: i + 1, conC };
    if (!a.startsWith('-') && !a.startsWith('+')) break;
    if (a === '--rcfile' || a === '--init-file') {
      i += 2;
      continue;
    }
    if (!a.startsWith('--')) {
      const grupo = a.slice(1);
      if (a.startsWith('-') && grupo.includes('c')) conC = true;
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
function posicionales(args: readonly string[], conValor: ReadonlySet<string>): string[] {
  const fuera: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i] as string;
    if (a === '--') {
      fuera.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith('-')) {
      if (conValor.has(a)) i++;
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
function ramaDeCambio(args: readonly string[]): string | null {
  for (let i = 0; i < args.length; i++) {
    const a = args[i] as string;
    if (CREAN_RAMA.has(a)) return args[i + 1] ?? null;
  }
  if (args.includes('--')) {
    const antes = args.slice(0, args.indexOf('--'));
    // `git checkout develop -- f` restaura f desde develop: no cambia de rama.
    if (args.indexOf('--') < args.length - 1) return null;
    return posicionales(antes, CAMBIO_CON_VALOR)[0] ?? null;
  }
  // `git checkout develop src/a.ts` (sin `--`) tambien restaura ficheros (MEN-2).
  const pos = posicionales(args, CAMBIO_CON_VALOR);
  return pos.length === 1 ? (pos[0] as string) : null;
}

/**
 * TASK-101: programas que no pueden cambiar ningun commit de ninguna rama.
 * Lectura, cambio de carpeta y salida por pantalla.
 */
const SIN_EFECTO_EN_RAMAS = new Set(['cd', 'pushd', 'popd', 'echo', 'pwd', 'true', 'set-location', 'sl', 'tee', 'cat', 'head', 'tail', 'grep']);
/** Subcomandos de git que no mueven ninguna rama (checkout/switch y branch, aparte). */
const GIT_SIN_EFECTO = new Set(['merge', 'status', 'log', 'diff', 'show', 'rev-parse']);
/** `git branch` sin mas, o solo con estas opciones, solo lista. */
const BRANCH_SOLO_LISTA = new Set(['--show-current', '-a', '-r', '--list', '-v', '-vv', '--all', '--remotes']);

/**
 * TASK-101: true si, aparte de los merges y scripts de cierre, el comando solo
 * cambia de carpeta o de rama, consulta o escribe por pantalla. El guardian de
 * merges evalua la rama que entra ANTES de ejecutar el comando: si el comando
 * puede crear o mover commits antes del merge (`git commit`, `reset`, `rebase`,
 * `pull`, `cherry-pick`, un script, `taskctl`...), lo evaluado no es lo que
 * entra, y no se aplica la exencion de solo documentacion. Ante la duda, false.
 */
export function comandoSoloIntegra(texto: string): boolean {
  for (const bruto of segmentar(texto)) {
    const seg = sinPrefijos(bruto);
    if (seg.length === 0) continue;
    const prog = programa(seg[0] as string);
    if (SIN_EFECTO_EN_RAMAS.has(prog)) continue;
    if (prog === 'git') {
      let i = 1;
      while (i < seg.length && (seg[i] as string).startsWith('-')) i += GLOBALES_CON_VALOR.has(seg[i] as string) ? 2 : 1;
      const sub = (seg[i] ?? '').toLowerCase();
      const args = seg.slice(i + 1);
      if (GIT_SIN_EFECTO.has(sub)) continue;
      if ((sub === 'checkout' || sub === 'switch') && !args.some((a) => CREAN_RAMA.has(a) || a === '-f' || a === '--force')) continue;
      if (sub === 'branch' && args.every((a) => BRANCH_SOLO_LISTA.has(a))) continue;
      return false;
    }
    const interior = textoDeShell(prog, seg);
    if (interior !== null) {
      if (!comandoSoloIntegra(interior)) return false;
      continue;
    }
    const iScript = SHELLS.has(prog) ? opcionesDeShell(seg).fin : 0;
    const nombre = (seg[iScript] ?? '').split(/[\/]/).pop() ?? '';
    if (SCRIPT_CIERRE.test(nombre)) continue;
    return false;
  }
  return true;
}
