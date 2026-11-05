/**
 * Tests held-out de una tarea — TASK-073. Los escribe la persona a partir de
 * los criterios, en la carpeta `aceptacion/` de la tarea, y los commitea en la
 * rama base durante el diseño, antes de `start`: la rama nace con ellos y no
 * aparecen en su diff. El agente que implementa no debe leerlos ni editarlos
 * (TASK-078: el hook PreToolUse de guardia-heldout.ts lo frena); `finish` los
 * ejecuta con `comando_heldout` y comprueba que la rama no los ha tocado.
 *
 * Puro: nombres, patrones, la busqueda de la carpeta en una lista de rutas y
 * que tareas nombra una ruta o el texto de un comando.
 */
import path from 'node:path';
/** Nombre de la carpeta de held-out dentro de la carpeta de una tarea. */
export const CARPETA_HELDOUT = 'aceptacion';
/** Variable de entorno con la ruta absoluta de la carpeta, para `comando_heldout`. */
export const VARIABLE_HELDOUT = 'HELDOUT_DIR';
/**
 * Patron `git :(glob)` que la peticion de revision excluye SIEMPRE, aunque el
 * proyecto cambie `excluir_de_revision`: el diff no puede llevar los held-out.
 */
export const EXCLUIR_HELDOUT = `tareas/*/TASK-*/${CARPETA_HELDOUT}/**`;
/** El ID escapado para meterlo en una expresion regular. */
function escaparId(id) {
    return id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Carpetas `tareas/<estado>/<id>/aceptacion` que aparecen en una lista de
 * rutas de fichero relativas a la raiz (las de `git ls-tree -r --name-only`),
 * sin repetir y en orden. Una tarea puede tener la suya en mas de un estado
 * si la rama base la recibio despues de que la rama moviera la tarea.
 */
export function carpetasHeldout(rutas, id) {
    const prefijo = new RegExp(`^(tareas/[^/]+/${escaparId(id)}/${CARPETA_HELDOUT})/`);
    const vistas = new Set();
    for (const r of rutas) {
        const m = prefijo.exec(r);
        if (m !== null)
            vistas.add(m[1]);
    }
    return [...vistas];
}
/**
 * Carpetas de la tarea cuyo nombre es `aceptacion` con OTRAS mayusculas
 * (`Aceptacion/`): no se tomarian por held-out, y en NTFS o macOS es un error
 * facil (MEN-3 de la revision). `finish` aborta si aparece alguna.
 */
export function variantesHeldout(rutas, id) {
    const re = new RegExp(`^(tareas/[^/]+/${escaparId(id)}/([^/]+))/`);
    const vistas = new Set();
    for (const r of rutas) {
        const m = re.exec(r);
        if (m !== null && m[2] !== CARPETA_HELDOUT && m[2].toLowerCase() === CARPETA_HELDOUT)
            vistas.add(m[1]);
    }
    return [...vistas];
}
/**
 * Una ruta held-out, ya normalizada (`/`, minusculas, sin `.` ni `..`): la
 * secuencia de segmentos `tareas/<estado>/task-NNN/aceptacion` en cualquier
 * punto de la ruta, seguida de `/` o del final. `aceptacionX/` y `tarea.md`
 * no casan.
 */
const RUTA_HELDOUT_RE = new RegExp(`(?:^|/)tareas/[^/]+/task-(\\d{3,})/${CARPETA_HELDOUT}(?:/|$)`);
function casar(normalizada, nums) {
    const m = RUTA_HELDOUT_RE.exec(normalizada);
    if (m !== null)
        nums.add(parseInt(m[1], 10));
}
/**
 * Numeros de las tareas cuya carpeta held-out nombra `ruta`. Se prueba la
 * ruta tal cual y resuelta contra `base` (el cwd, o el `path` de Grep/Glob),
 * con barras invertidas, mayusculas, `.` y `..` normalizados, para que una
 * relativa dentro de la carpeta de la tarea (`aceptacion/x`) o una absoluta
 * de Windows o de git-bash (`C:\...`, `/c/...`) casen igual.
 */
export function numerosHeldoutEnRuta(ruta, base) {
    const nums = new Set();
    const barras = ruta.replace(/\\/g, '/');
    if (barras.trim() === '')
        return [];
    casar(path.posix.normalize(barras).toLowerCase(), nums);
    casar(path.resolve(base, barras).replace(/\\/g, '/').toLowerCase(), nums);
    return [...nums];
}
/** Separadores de palabra en el texto de un comando: blancos, comillas, operadores y el `:` de `rama:ruta`. */
const SEPARADORES_COMANDO = /[\s"'`;|&()<>=,:]+/;
/**
 * Numeros de las tareas cuya carpeta held-out nombra el texto de un comando
 * de Bash o PowerShell (`cat`, `Get-Content`, `git show rama:ruta`...). Se
 * parte por separadores y cada palabra se trata como una ruta relativa a
 * `cwd`. NO usa el tokenizador del guardian de merges, que trata `\` como
 * escape y romperia las rutas de PowerShell. Es un baden, no un cierre: no
 * sigue un `cd` previo ni deshace concatenaciones o escapes del shell.
 */
export function numerosHeldoutEnTexto(texto, cwd) {
    const nums = new Set();
    for (const palabra of texto.split(SEPARADORES_COMANDO)) {
        if (palabra === '')
            continue;
        for (const n of numerosHeldoutEnRuta(palabra, cwd))
            nums.add(n);
    }
    return [...nums];
}
