/**
 * `git` sin lanzar nunca y con la salida en bruto (`Buffer`), para
 * `taskctl doctor-deploy` (TASK-066): el recorrido del historial lee blobs que
 * pueden no ser UTF-8, y un fallo de Git tiene que poder convertirse en
 * «NO VERIFICADO» en vez de en una excepcion.
 */
import { spawnSync } from 'node:child_process';
const MAX_BUFFER_POR_DEFECTO = 64 * 1024 * 1024;
const TIMEOUT_POR_DEFECTO_MS = 60_000;
export function gitCrudo(args, cwd, opciones = {}) {
    const r = spawnSync('git', args, {
        cwd,
        input: opciones.input,
        maxBuffer: opciones.maxBuffer ?? MAX_BUFFER_POR_DEFECTO,
        timeout: opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' },
    });
    return {
        status: r.status,
        stdout: Buffer.isBuffer(r.stdout) ? r.stdout : Buffer.alloc(0),
        stderr: Buffer.isBuffer(r.stderr) ? r.stderr.toString('utf8') : '',
        error: r.error,
    };
}
/** Salida de texto de un `git` que acabo bien, o null si fallo (en cualquier forma). */
export function gitTexto(args, cwd, opciones = {}) {
    const r = gitCrudo(args, cwd, opciones);
    if (r.error !== undefined || r.status !== 0)
        return null;
    return r.stdout.toString('utf8');
}
