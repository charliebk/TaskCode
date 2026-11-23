/**
 * La configuracion de `.taskcode/config.yml` tal como esta en una referencia
 * de Git (p. ej. la rama base), no en el arbol de trabajo. La usan las
 * puertas de `finish` que la rama de la tarea no puede relajar editando su
 * propio config: los held-out (TASK-073) y la cobertura (TASK-074).
 *
 * Sin fichero en esa referencia, la configuracion por defecto. Un fichero
 * invalido lanza ConfigError: quien la usa decide el mensaje.
 */
import { gitTexto } from './git-crudo.js';
import { parsearConfig } from '../core/config.js';
export function configDeRef(ref, cwd) {
    // TASK-149a (MEN-2): con gitTexto (64 MB de buffer, no 1 MB que cortaria en silencio).
    return parsearConfig(gitTexto(['show', `${ref}:.taskcode/config.yml`], cwd) ?? '', `${ref}:.taskcode/config.yml`);
}
