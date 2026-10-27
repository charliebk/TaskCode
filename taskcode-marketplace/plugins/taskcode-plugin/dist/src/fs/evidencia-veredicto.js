import { gitCrudo } from './git-crudo.js';
const MAX_BYTES_FICHERO = 8 * 1024 * 1024;
/** Numero de lineas de un texto: un `\n` final no abre una linea mas. */
export function contarLineas(texto) {
    if (texto === '')
        return 0;
    const partes = texto.split('\n');
    return texto.endsWith('\n') ? partes.length - 1 : partes.length;
}
/**
 * Comprobador para `mezclarVeredictos`: el fichero tiene que estar versionado en `commit`
 * (un blob, no una carpeta ni un enlace a otra cosa), ser de texto y tener esa linea.
 */
export function comprobadorEnCommit(raiz, commit) {
    return (fichero, linea) => {
        // Normalizada con `/`; `./a` y `a` son el mismo fichero. Los `..` ya los rechazo quien llama.
        const ruta = fichero.replace(/\\/g, '/').replace(/^(?:\.\/)+/, '');
        const r = gitCrudo(['cat-file', 'blob', `${commit}:${ruta}`], raiz, { timeoutMs: 15_000, maxBuffer: MAX_BYTES_FICHERO });
        if (r.error !== undefined) {
            return `no se pudo leer ${ruta} en el commit analizado (${r.error.message.split('\n')[0] ?? 'error'}): puede ser demasiado grande`;
        }
        if (r.status !== 0)
            return `${ruta} no es un fichero versionado en el commit analizado`;
        if (r.stdout.subarray(0, 8000).includes(0))
            return `${ruta} es un fichero binario: no se puede citar una linea`;
        const total = contarLineas(r.stdout.toString('utf8'));
        if (linea > total)
            return `${ruta} tiene ${total} linea(s) y el veredicto cita la ${linea}`;
        return null;
    };
}
