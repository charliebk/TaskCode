/**
 * Sincronizacion de ficheros derivados — TASK-033 (version 0.1.1).
 *
 * Un proyecto que genera ficheros a partir del estado de las tareas (un
 * plan con una tabla de seguimiento, un tablero propio) los tenia
 * desincronizados tras CADA transicion: los commits automaticos mueven
 * la tarea, pero no pueden saber que ese fichero existe. El arreglo
 * obvio desde el proyecto —un hook de pre-commit que regenere y haga
 * `git add`— no funciona con taskctl: autoCommit commitea en modo
 * `--only` (`git commit -- <rutas>`), el `git add` del hook va al indice
 * temporal y el indice real se queda con el contenido viejo. Despues del
 * commit, `git status` marca `MM` y el SIGUIENTE comando aborta en el
 * guard de la 8.3. Reproducido, no supuesto.
 *
 * Asi que el comando lo ejecuta taskctl, dentro de autoCommit y antes
 * del primer `git add`, y sus rutas entran en el mismo commit que la
 * tarea. Lo configuran tres claves de `.taskcode/config.yml`
 * (config.ts); sin ellas, aqui no se hace nada, ni un spawn.
 *
 * La regla que manda, decidida al aprobar el plan: **la transicion
 * NUNCA se aborta por la sincronizacion**. En `finish` el merge ya esta
 * hecho cuando se llega aqui; abortar dejaria la tarea movida sin
 * commitear y sin camino de reintento (riesgo 1 del brainstorm). Los
 * tres desenlaces en que la sincronizacion no se aplica commitean la
 * tarea igual, avisan y hacen que el CLI salga con
 * CODIGO_SINCRONIZACION_NO_APLICADA:
 *
 *   (a) una ruta declarada ya tenia cambios: no se ejecuta, porque
 *       commitearla meteria trabajo de la persona en un commit
 *       automatico;
 *   (b) el comando falla o expira: las rutas declaradas vuelven a HEAD
 *       (estaban limpias por (a), asi que no se pierde nada);
 *   (c) el comando toco ficheros no declarados: esos no se tocan y se
 *       nombran; las rutas declaradas si se commitean.
 */
import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdtempSync, openSync, readdirSync, readFileSync, rmSync, statSync, } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { raizDelRepo } from '../core/config.js';
import { runGit } from './git.js';
/**
 * Codigo de salida del CLI cuando la transicion se hizo pero la
 * sincronizacion no se aplico. Distinto de 1 (el comando fallo) a
 * proposito: quien lo lea tiene que poder distinguir "no reintentes,
 * sincroniza a mano" de "no ha pasado nada".
 */
export const CODIGO_SINCRONIZACION_NO_APLICADA = 3;
/** true si el desenlace debe hacer que el CLI salga con CODIGO_SINCRONIZACION_NO_APLICADA. */
export function sincronizacionNoAplicada(r) {
    return r.estado !== 'no-configurada' && r.estado !== 'aplicada';
}
export const SIN_SINCRONIZACION = Object.freeze({
    estado: 'no-configurada',
    rutas: Object.freeze([]),
    avisos: Object.freeze([]),
});
export function ejecutarSincronizacion(cwd, config, opciones = {}) {
    const comando = config.comando_sincronizacion;
    if (comando === null)
        return SIN_SINCRONIZACION;
    const raiz = raizDelRepo(cwd);
    const declaradas = config.rutas_sincronizacion;
    const absolutas = declaradas.map((r) => path.join(raiz, r));
    const aMano = `Cuando lo resuelvas, ejecuta a mano "${comando}" y commitea ${declaradas.join(', ')}. ` +
        'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.';
    // (a) Antes de nada: si una ruta declarada ya trae cambios, el
    // commit automatico se los llevaria. `start`, `review` y `finish` no
    // exigen workspace limpio, asi que esto es un caso real. Se pregunta
    // tambien por el nombre REAL en disco: con otras mayusculas, el
    // pathspec declarado no casa con el fichero modificado y el comando lo
    // sobrescribiria sin que nada lo detectara (MENOR de la ronda 2).
    const aComprobar = [
        ...new Set(declaradas.flatMap((r) => [r, nombreRealEnDisco(raiz, r) ?? r])),
    ];
    const conCambios = porcelain(raiz, aComprobar);
    if (conCambios.length > 0) {
        return {
            estado: 'omitida-rutas-con-cambios',
            rutas: [],
            avisos: [
                `No se ha ejecutado la sincronizacion: ${conCambios.join(', ')} ya tenia(n) cambios ` +
                    'sin commitear, y el commit automatico los habria incluido. Commitealos o ' +
                    `descartalos. ${aMano}`,
            ],
        };
    }
    const antes = fotoDelArbol(raiz);
    const timeoutMs = opciones.timeoutMs ?? config.timeout_sincronizacion * 1000;
    // El comando no se lanza directamente: lo lanza ENVOLTORIO, un node
    // hijo que es quien aplica el timeout. Con un `spawnSync(comando, {
    // shell: true, timeout })` a pelo, el timeout mata a cmd.exe pero en
    // Windows el `node` nieto SIGUE VIVO y puede seguir escribiendo el
    // derivado despues de que lo hayamos restaurado (riesgo 6 del
    // brainstorm; reproducido: el test del timeout dejaba la carpeta del
    // repo bloqueada con EBUSY). El envoltorio mata el arbol entero.
    //
    // stdin ignorado SIEMPRE: con una tuberia heredada que nadie cierra
    // (un arnes de agente, `node --test`) un script que pregunte algo
    // esperaria para siempre. Con EOF, falla y se va por (b).
    const r = lanzarEnvoltorio(raiz, comando, timeoutMs);
    const fallo = describirFallo(r, timeoutMs);
    if (fallo !== null) {
        restaurarAHead(raiz, declaradas, antes);
        return fallida(comando, declaradas, fallo, aMano);
    }
    // Una ruta que Git no va a poder commitear (ignorada, o con otras
    // mayusculas que el fichero real en un disco que no las distingue)
    // tumbaria el `git add` / `git commit` de autoCommit y, con el, la
    // transicion entera — en `finish`, con el merge ya hecho (hallazgo
    // IMPORTANTE de la revision por pares de TASK-033). Se detecta aqui y
    // se va por (b).
    const noCommiteable = motivoNoCommiteable(raiz, declaradas);
    if (noCommiteable !== null) {
        restaurarAHead(raiz, declaradas, antes);
        return fallida(comando, declaradas, noCommiteable, aMano);
    }
    const despues = fotoDelArbol(raiz);
    const declaradasSet = new Set(declaradas);
    const ajenas = [...new Set([...antes.keys(), ...despues.keys()])]
        .filter((f) => !declaradasSet.has(f) && antes.get(f) !== despues.get(f))
        .sort();
    if (ajenas.length > 0) {
        return {
            estado: 'rutas-ajenas',
            rutas: absolutas,
            avisos: [
                `La sincronizacion "${comando}" ha modificado ficheros que no estan en ` +
                    `rutas_sincronizacion: ${ajenas.join(', ')}. No se han commiteado ni tocado: ` +
                    'revisalos. Si los genera el comando a proposito, anadelos a rutas_sincronizacion; ' +
                    'si no, el siguiente comando de taskctl puede abortar por workspace sucio.',
            ],
        };
    }
    return { estado: 'aplicada', rutas: absolutas, avisos: [] };
}
function fallida(comando, declaradas, motivo, aMano) {
    return {
        estado: 'fallida',
        rutas: [],
        avisos: [
            `La sincronizacion "${comando}" ${motivo}. ${declaradas.join(', ')} se ha(n) dejado ` +
                `como en HEAD y la tarea se ha commiteado sin ella(s). ${aMano}`,
        ],
    };
}
/**
 * Resultado 'fallida' para cuando el `git add` de una ruta de
 * sincronizacion falla ya dentro de autoCommit: segunda barrera de
 * motivoNoCommiteable, para lo que no se haya podido prever.
 */
export function sincronizacionFallidaAlPreparar(cwd, config, detalle) {
    const raiz = raizDelRepo(cwd);
    const declaradas = config.rutas_sincronizacion;
    for (const r of declaradas) {
        // Desprepararla primero: si el add llego a meterla en el indice,
        // restaurar solo el arbol la dejaria en "A"/"M" y el siguiente
        // comando abortaria por workspace sucio.
        runGitOk(['reset', '-q', '--', r], raiz);
    }
    restaurarAHead(raiz, declaradas);
    const comando = config.comando_sincronizacion ?? '';
    return fallida(comando, declaradas, `escribio sus ficheros, pero Git no pudo prepararlos (${detalle})`, `Cuando lo resuelvas, ejecuta a mano "${comando}" y commitea ${declaradas.join(', ')}. ` +
        'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.');
}
/**
 * null si Git puede commitear todas las rutas; si no, el motivo. Dos
 * casos reproducidos en la revision: una ruta en `.gitignore` (el
 * `git add` falla) y, en Windows o macOS, una ruta con otras mayusculas
 * que el fichero que existe en disco (el pathspec no casa).
 */
function motivoNoCommiteable(raiz, rutas) {
    for (const r of rutas) {
        if (runGitOk(['check-ignore', '-q', '--', r], raiz)) {
            return `escribio ${r}, pero esa ruta esta en .gitignore y Git no la commitearia`;
        }
        const real = nombreRealEnDisco(raiz, r);
        if (real !== null && real !== r) {
            return (`escribio ${r}, pero en disco el fichero se llama ${real}: corrige las mayusculas ` +
                'en rutas_sincronizacion');
        }
    }
    return null;
}
/**
 * La ruta tal y como se llama en disco, segmento a segmento, o null si
 * no existe. En un disco que no distingue mayusculas, `existsSync`
 * diria que si a cualquier variante; leer el directorio no miente.
 */
function nombreRealEnDisco(raiz, rel) {
    let dir = raiz;
    const partes = [];
    for (const seg of rel.split('/')) {
        let entradas;
        try {
            entradas = readdirSync(dir);
        }
        catch {
            return null;
        }
        const exacto = entradas.find((e) => e === seg);
        const real = exacto ?? entradas.find((e) => e.toLowerCase() === seg.toLowerCase());
        if (real === undefined)
            return null;
        partes.push(real);
        dir = path.join(dir, real);
    }
    return partes.join('/');
}
/** Codigo con el que ENVOLTORIO dice "lo he cortado por timeout". */
const CODIGO_TIMEOUT_ENVOLTORIO = 124;
/**
 * Marca que ENVOLTORIO escribe en stderr al cortar. Sin ella, un script
 * que saliera con 124 por su cuenta se describiria como un timeout
 * (hallazgo MENOR de la revision).
 */
const MARCA_TIMEOUT = '[taskctl:timeout]';
/**
 * Ejecuta argv[1] con el shell del sistema y lo corta a los argv[2] ms.
 *
 * - shell: true en las dos plataformas: cmd.exe en Windows (necesario
 *   para resolver `pnpm.cmd` / `npm.cmd`; sin shell, ENOENT — el fallo
 *   que costo una ronda en codex-review) y /bin/sh en POSIX. El comando
 *   es entero de la persona y no se le interpola nada, asi que no se
 *   escapa: escaparlo cambiaria lo que escribio.
 * - Al vencer el timeout mata el ARBOL: `taskkill /T /F` en Windows
 *   (con el hijo aun vivo, que es cuando /T puede recorrerlo) y el
 *   grupo de procesos en POSIX (por eso `detached`).
 * - Al cortar sale EN EL ACTO, sin esperar al `close` del hijo. El hijo
 *   tiene tuberias propias (la salida se reenvia), asi que un nieto que
 *   sobreviviera al kill retendria las del envoltorio, no las de
 *   taskctl: `spawnSync` vuelve igual. Con `stdio: 'inherit'` y un kill
 *   que fallara, taskctl se quedaba colgado para siempre (medido con un
 *   mutante en la revision).
 * - Sale con el codigo del comando, o con 124 (como `timeout(1)`) si lo
 *   corto.
 */
const ENVOLTORIO = `
const { spawn, spawnSync } = require('node:child_process');
const [comando, ms] = process.argv.slice(1);
const win = process.platform === 'win32';
const hijo = spawn(comando, { shell: true, stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true, detached: !win });
hijo.stdout.on('data', (d) => process.stdout.write(d));
hijo.stderr.on('data', (d) => process.stderr.write(d));
const t = setTimeout(() => {
  if (win) spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-hijo.pid, 'SIGKILL'); } catch {} }
  process.stderr.write('${MARCA_TIMEOUT}', () => process.exit(${String(CODIGO_TIMEOUT_ENVOLTORIO)}));
}, Number(ms));
hijo.on('error', (e) => { clearTimeout(t); process.stderr.write(String(e.message)); process.exit(127); });
hijo.on('close', (code, signal) => {
  clearTimeout(t);
  if (code === null) { process.stderr.write('termino por la senal ' + signal); process.exit(1); }
  process.exit(code);
});
`;
/**
 * Lanza ENVOLTORIO con la salida a FICHEROS temporales, no a tuberias.
 * Con tuberias, en Windows cmd.exe hereda tambien las del propio
 * envoltorio, asi que un nieto que sobreviva al kill retiene la de
 * taskctl y `spawnSync` espera su EOF para siempre — medido con un
 * mutante del `taskkill` en la revision: el test se colgo 30 min y el
 * timeout por test no lo corta porque `spawnSync` bloquea el event
 * loop. Con ficheros, `spawnSync` vuelve en cuanto el envoltorio sale,
 * quede vivo lo que quede.
 */
function lanzarEnvoltorio(raiz, comando, timeoutMs) {
    const dir = mkdtempSync(path.join(tmpdir(), 'taskctl-sync-salida-'));
    const rutaOut = path.join(dir, 'stdout');
    const rutaErr = path.join(dir, 'stderr');
    const fdOut = openSync(rutaOut, 'w');
    const fdErr = openSync(rutaErr, 'w');
    // Una sola vez cada uno: cerrar dos veces el mismo numero de fd puede
    // cerrar otro fichero que el sistema le haya reasignado entretanto.
    let cerrados = false;
    const cerrar = () => {
        if (cerrados)
            return;
        cerrados = true;
        closeSync(fdOut);
        closeSync(fdErr);
    };
    try {
        const r = spawnSync(process.execPath, ['-e', ENVOLTORIO, comando, String(timeoutMs)], {
            cwd: raiz,
            stdio: ['ignore', fdOut, fdErr],
            // Red de seguridad por si el propio envoltorio se colgara.
            timeout: timeoutMs + 15000,
            windowsHide: true,
        });
        cerrar();
        const salida = {
            status: r.status,
            signal: r.signal,
            stderr: readFileSync(rutaErr, 'utf8'),
        };
        if (r.error !== undefined)
            salida.error = r.error;
        return salida;
    }
    finally {
        // Un huerfano puede tener aun el fichero abierto (EBUSY en
        // Windows): se deja para el limpiador del sistema, no es un fallo.
        try {
            cerrar();
        }
        catch {
            /* no se pudo cerrar: no afecta a la transicion */
        }
        try {
            rmSync(dir, { recursive: true, force: true });
        }
        catch {
            /* ver arriba */
        }
    }
}
/** null si el comando termino bien; si no, que le paso, en palabras de persona. */
function describirFallo(r, timeoutMs) {
    const corte = `no termino en ${String(Math.round(timeoutMs / 1000))} s y se ha cortado`;
    if (r.error !== undefined) {
        if (r.error.code === 'ETIMEDOUT')
            return corte;
        return `no se pudo ejecutar (${r.error.message})`;
    }
    if (r.status === CODIGO_TIMEOUT_ENVOLTORIO && String(r.stderr ?? '').endsWith(MARCA_TIMEOUT)) {
        return corte;
    }
    if (r.signal !== null)
        return `termino por la senal ${r.signal}`;
    if (r.status !== 0) {
        const stderr = String(r.stderr ?? '').trim();
        const cola = stderr === '' ? '' : `: ${ultimasLineas(stderr, 5)}`;
        return `salio con codigo ${String(r.status)}${cola}`;
    }
    return null;
}
function ultimasLineas(texto, n) {
    return texto.split(/\r?\n/).slice(-n).join(' | ');
}
/** Rutas (de las dadas) con cambios respecto a HEAD, incluidas las no trackeadas. */
function porcelain(raiz, rutas) {
    const salida = runGit(['status', '--porcelain', '--untracked-files=all', '--', ...rutas], raiz);
    return salida
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l !== '')
        .map((l) => l.slice(l.indexOf(' ') + 1).trim());
}
/**
 * Foto de lo que NO esta limpio en el arbol: ruta -> huella del
 * contenido. Comparar solo el porcelain no basta (hallazgo del rol de
 * riesgos): un fichero que ya estaba en ` M` por trabajo de la persona
 * sigue en ` M` aunque el comando lo reescriba. Por eso se compara el
 * contenido, y solo de lo que ya esta sucio (lo limpio, si cambia,
 * aparece nuevo en la segunda foto).
 */
function fotoDelArbol(raiz) {
    // Sin runGit a proposito: recorta la salida, y el recorte se come el
    // espacio inicial de la primera entrada (" M ruta"), desplazando la
    // ruta un caracter.
    const r = spawnSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
        cwd: raiz,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    });
    if (r.status !== 0) {
        throw new Error(`git status fallo al sincronizar: ${String(r.stderr ?? '').trim()}`);
    }
    const salida = r.stdout ?? '';
    const foto = new Map();
    const entradas = salida.split('\0');
    for (let i = 0; i < entradas.length; i++) {
        const e = entradas[i];
        if (e.length < 4)
            continue;
        const xy = e.slice(0, 2);
        const ruta = e.slice(3);
        // En un renombrado, -z pone la ruta de origen en la entrada
        // siguiente: se salta para no tomarla por un fichero aparte.
        if (xy.includes('R') || xy.includes('C'))
            i++;
        foto.set(ruta, huella(path.join(raiz, ruta)));
    }
    return foto;
}
function huella(fichero) {
    try {
        if (!statSync(fichero).isFile())
            return 'no-fichero';
        return createHash('sha1').update(readFileSync(fichero)).digest('hex');
    }
    catch {
        return 'ausente';
    }
}
/**
 * (b) Deja cada ruta declarada como en HEAD. Estaban limpias antes de
 * ejecutar (lo garantiza (a)), asi que lo unico que se deshace es lo
 * que escribio el comando: si existia en HEAD se restaura, y si no
 * existia el fichero lo creo el comando y se borra.
 */
function restaurarAHead(raiz, rutas, antes = new Map()) {
    for (const r of rutas) {
        // Se trabaja con el nombre REAL del fichero. Con la ruta declarada
        // tal cual, una errata de mayusculas en un disco que no las
        // distingue no se encontraria en HEAD y caeria en el rmSync de
        // abajo: borraria el fichero versionado de verdad.
        const objetivo = nombreRealEnDisco(raiz, r) ?? r;
        // Si con otro nombre resulta ser un fichero que ya estaba sucio
        // antes de ejecutar, es trabajo de la persona (en un disco que si
        // distingue mayusculas es OTRO fichero): no se toca.
        if (objetivo !== r && antes.has(objetivo))
            continue;
        if (runGitOk(['cat-file', '-e', `HEAD:${objetivo}`], raiz)) {
            runGit(['checkout', 'HEAD', '--', objetivo], raiz);
        }
        else if (!antes.has(objetivo)) {
            const abs = path.join(raiz, objetivo);
            if (existsSync(abs))
                rmSync(abs, { force: true });
        }
    }
}
function runGitOk(args, cwd) {
    return spawnSync('git', args, { cwd, encoding: 'utf8' }).status === 0;
}
