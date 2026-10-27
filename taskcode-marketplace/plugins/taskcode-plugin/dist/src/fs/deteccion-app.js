import { gitTexto } from './git-crudo.js';
/** Carpetas que ni se detectan ni se escanean: dependencias y build. */
export const DIRS_EXCLUIDOS = ['node_modules', 'vendor', 'target', 'dist', 'build', '.git'];
/** Profundidad maxima (carpetas) a la que se buscan marcadores: `a/b/c/package.json` si; un nivel mas, no. */
export const PROFUNDIDAD_MARCADORES = 3;
export function estaExcluido(ruta) {
    return ruta.split('/').some((seg, i, partes) => i < partes.length - 1 && DIRS_EXCLUIDOS.includes(seg));
}
function listaZ(args, cwd) {
    const t = gitTexto(args, cwd, { maxBuffer: 256 * 1024 * 1024 });
    if (t === null)
        return null;
    return t.split('\0').filter((r) => r !== '');
}
/** null si no se pudo listar (no es un repo Git, o git no esta). */
export function listarArchivos(cwd) {
    const versionados = listaZ(['ls-files', '-z', '--cached'], cwd);
    const otros = listaZ(['ls-files', '-z', '--others', '--exclude-standard'], cwd);
    if (versionados === null || otros === null)
        return null;
    const sinExcluidos = (xs) => xs.filter((r) => !estaExcluido(r));
    const v = sinExcluidos(versionados);
    const presentes = [...new Set([...v, ...sinExcluidos(otros)])];
    return { presentes, versionados: v };
}
function coincideMarcador(ruta, marcador) {
    const base = ruta.slice(ruta.lastIndexOf('/') + 1);
    if (marcador.includes('/'))
        return ruta === marcador || ruta.endsWith(`/${marcador}`);
    if (marcador.startsWith('*.'))
        return base.length > marcador.length - 1 && base.toLowerCase().endsWith(marcador.slice(1).toLowerCase());
    return base === marcador;
}
/** Carpeta (con `/`, `.` si es la raiz) de una ruta. */
export function carpetaDe(ruta) {
    const i = ruta.lastIndexOf('/');
    return i === -1 ? '.' : ruta.slice(0, i);
}
function profundidad(ruta) {
    return ruta.split('/').length - 1;
}
export function detectarTipos(archivos, tipos) {
    const candidatos = archivos.filter((r) => profundidad(r) <= PROFUNDIDAD_MARCADORES);
    const detectados = [];
    for (const t of tipos) {
        const rutas = new Set();
        for (const r of candidatos) {
            if (t.marcadores.some((m) => coincideMarcador(r, m)))
                rutas.add(carpetaDe(r));
        }
        if (rutas.size > 0)
            detectados.push({ id: t.id, nombre: t.nombre, rutas: [...rutas].sort() });
    }
    return detectados;
}
