/**
 * `taskctl estado [--seguir] [--stdin]` — TASK-110. Dice en que va la tarea en
 * curso (fase, paso, x/N, minutos) leyendo SOLO los ficheros de progreso bajo
 * `.git/`: sin lanzar git, sin leer `tareas/`. Lo ejecuta la status line de
 * Claude Code en cada refresco, asi que:
 *
 * - `bin/taskctl` lo carga por una via rapida, sin el grafo de `cli.ts`. Este
 *   modulo NO puede importar nada que arrastre `fs/git.ts` ni otros comandos
 *   (un test lo comprueba).
 * - Fuera de un repo con tareas no imprime nada (la status line se instala
 *   una vez, para todos los proyectos). Con tareas y sin nada en marcha, lo
 *   dice. Sale siempre con 0, salvo un flag desconocido.
 * - `--stdin`: lee el JSON que Claude Code pasa a la status line y usa su
 *   directorio (`workspace.current_dir` o `cwd`). Con un tope de espera: un
 *   stdin abierto que nunca se cierra no lo cuelga.
 * - `--seguir`: refresca cada segundo hasta que la fase termina. SIN TERMINAL
 *   imprime una sola linea y sale: lanzado por un agente, se quedaria colgado
 *   minutos volcando lineas a su contexto, justo el gasto que esto evita.
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { NADA_EN_MARCHA, enMarcha, formatearEstado } from '../core/progreso.js';
import { leerContador, leerProgreso, ubicarGit } from '../fs/progreso.js';
export const FLAGS_ESTADO = ['--seguir', '--stdin'];
/** Solo para tests: `--seguir` refresca aunque no haya terminal (un subproceso de test no la tiene). */
export const VARIABLE_SEGUIR_SIN_TTY = 'TASKCTL_ESTADO_SEGUIR_SIN_TTY';
const INTERVALO_MS = 1000;
const ESPERA_STDIN_MS = 300;
function esDirectorio(ruta) {
    try {
        return statSync(ruta).isDirectory();
    }
    catch {
        return false;
    }
}
/** La linea de estado para el repo que contiene `cwd`. Vacia fuera de un repo con tareas. */
export function leerEstado(cwd, ahoraMs = Date.now()) {
    const g = ubicarGit(cwd);
    if (g === null)
        return { linea: '', enMarcha: false };
    const e = leerProgreso(cwd);
    if (e !== null) {
        const vivo = enMarcha(e);
        return { linea: formatearEstado(e, ahoraMs, vivo && e.contador ? leerContador(cwd) : null), enMarcha: vivo };
    }
    const conTareas = esDirectorio(path.join(g.raiz, 'tareas')) || esDirectorio(path.join(g.raiz, '.taskcode'));
    return { linea: conTareas ? NADA_EN_MARCHA : '', enMarcha: false };
}
/** El directorio que Claude Code pasa en el JSON de la status line, si existe. */
export function directorioDeEntrada(texto) {
    try {
        const j = JSON.parse(texto);
        const ws = j['workspace'];
        const candidatos = [
            typeof ws === 'object' && ws !== null ? ws['current_dir'] : undefined,
            j['cwd'],
        ];
        for (const c of candidatos)
            if (typeof c === 'string' && c !== '' && existsSync(c))
                return c;
    }
    catch {
        /* no es JSON: se usa el directorio actual */
    }
    return null;
}
function leerStdin(esperaMs) {
    return new Promise((resolve) => {
        const entrada = process.stdin;
        let datos = '';
        let hecho = false;
        const fin = () => {
            if (hecho)
                return;
            hecho = true;
            clearTimeout(t);
            entrada.removeAllListeners('data');
            entrada.removeAllListeners('end');
            entrada.removeAllListeners('error');
            entrada.destroy();
            resolve(datos);
        };
        const t = setTimeout(fin, esperaMs);
        entrada.setEncoding('utf8');
        entrada.on('data', (d) => {
            datos += d;
            if (datos.length > 1_000_000)
                fin();
        });
        entrada.on('end', fin);
        entrada.on('error', fin);
    });
}
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
/** Punto de entrada (via rapida de bin/taskctl y respaldo de cli.ts). Devuelve el codigo de salida. */
export async function mainEstado(argv, o = {}) {
    const salida = o.salida ?? process.stdout;
    try {
        rechazarFlagsDesconocidos(argv, FLAGS_ESTADO, 'estado', (m) => new Error(m));
        const sobra = argv.find((a) => !a.startsWith('-'));
        if (sobra !== undefined)
            throw new Error(`[ERROR] taskctl estado: no admite argumentos ("${sobra}"). Uso: taskctl estado [--seguir].`);
    }
    catch (e) {
        process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
        return 1;
    }
    let cwd = o.cwd ?? process.cwd();
    if (argv.includes('--stdin') && process.stdin.isTTY !== true) {
        cwd = directorioDeEntrada(await leerStdin(ESPERA_STDIN_MS)) ?? cwd;
    }
    const env = o.env ?? process.env;
    const tty = o.esTTY ?? (process.stdout.isTTY === true);
    const seguir = argv.includes('--seguir') && (tty || env[VARIABLE_SEGUIR_SIN_TTY] === '1');
    let lectura = leerEstado(cwd);
    if (!seguir || !lectura.enMarcha) {
        if (lectura.linea !== '')
            salida.write(`${lectura.linea}\n`);
        return 0;
    }
    // Con terminal se reescribe la misma linea; sin ella (solo tests), una por cambio.
    const pintar = (linea) => void salida.write(tty ? `\r\u001b[2K${linea}` : `${linea}\n`);
    let ultima = lectura.linea;
    pintar(ultima);
    while (lectura.enMarcha) {
        await dormir(o.intervaloMs ?? INTERVALO_MS);
        lectura = leerEstado(cwd);
        if (lectura.linea !== ultima) {
            ultima = lectura.linea;
            pintar(ultima);
        }
    }
    if (tty)
        salida.write('\n');
    return 0;
}
