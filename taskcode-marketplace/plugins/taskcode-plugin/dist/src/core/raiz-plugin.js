/**
 * TASK-148a (CORE1-03, CORE2-08 de la auditoria 4D): la raiz del plugin, de
 * la que cuelgan sus catalogos (`scripts/*.yml`), sus skills y los scripts de
 * Git-Flow. Antes estaba copiada en cinco modulos: si cambiaba una copia, cada
 * catalogo se cargaba desde una raiz distinta.
 *
 * Respeta `CLAUDE_PLUGIN_ROOT` (la convencion de Claude Code cuando lanza
 * taskctl como comando del plugin) si esta definida y no vacia; si no, la
 * calcula relativa a este modulo compilado, necesario para el dogfooding
 * directo, donde la variable no esta puesta.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export function raizDelPlugin() {
    const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
    if (pluginRoot !== undefined && pluginRoot.trim() !== '')
        return pluginRoot;
    // dist/src/core/raiz-plugin.js -> dist/src/core -> dist/src -> dist -> raiz del plugin
    return path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
}
/** Una ruta dentro del plugin: `rutaEnPlugin('scripts', 'heuristica-complejidad.yml')`. */
export function rutaEnPlugin(...partes) {
    return path.join(raizDelPlugin(), ...partes);
}
