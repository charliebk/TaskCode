/**
 * Sonda de disco de la comprobacion `version-plugin` de doctor (TASK-087).
 * Compara la version del plugin que Claude Code tiene instalada con la que
 * trae la copia local de su marketplace. Lee, sin escribir nada:
 *
 * - `<config>/plugins/installed_plugins.json`: la entrada
 *   `<plugin>@<marketplace>` que aplica (la de usuario o la de este proyecto);
 * - `<config>/plugins/known_marketplaces.json`: donde esta la copia local del
 *   marketplace (`installLocation`) y cuando se actualizo (`lastUpdated`). Sin
 *   el, `<config>/plugins/marketplaces/<marketplace>`;
 * - el `.claude-plugin/marketplace.json` de esa copia y, si la fuente del
 *   plugin es una ruta relativa, su `.claude-plugin/plugin.json`, que manda.
 *
 * Sin red, a proposito (decision de la persona): «disponible» es lo ultimo que
 * Claude Code descargo a la copia local. Nada de aqui lanza: lo que no se
 * puede leer o no se reconoce es `no-comprobable` con su motivo.
 */
import path from 'node:path';
import { esVersionSemver, NOMBRE_PLUGIN } from '../core/version.js';
import { entradaQueAplica, esObjeto, leerJson } from './json-claude.js';
const noComprobable = (motivo) => ({ estado: 'no-comprobable', motivo });
/** El JSON de `ruta`, o el motivo por el que no se puede usar. */
function leerObjeto(ruta, que) {
    const l = leerJson(ruta);
    if (l.estado === 'ausente')
        return `no existe ${que} (${ruta})`;
    if (l.estado === 'ilegible')
        return `${que} ilegible (${ruta}: ${l.motivo})`;
    return esObjeto(l.json) ? l.json : `${que} con formato no reconocido (${ruta})`;
}
export function sondearVersionPlugin(configDir, repoCwd, nombrePlugin = NOMBRE_PLUGIN) {
    try {
        return sondear(configDir, repoCwd, nombrePlugin);
    }
    catch (e) {
        // No deberia llegar aqui; si llega, no puede acabar en el `error` de `envolver`.
        return noComprobable(`fallo inesperado: ${(e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim()}`);
    }
}
function sondear(configDir, repoCwd, nombrePlugin) {
    const dirPlugins = path.join(configDir, 'plugins');
    // 1. La version instalada.
    const rutaInstalados = path.join(dirPlugins, 'installed_plugins.json');
    const instalados = leerObjeto(rutaInstalados, 'la lista de plugins instalados');
    if (typeof instalados === 'string')
        return noComprobable(instalados);
    const plugins = instalados['plugins'];
    if (!esObjeto(plugins))
        return noComprobable(`la lista de plugins instalados no tiene "plugins" (${rutaInstalados})`);
    const prefijo = `${nombrePlugin}@`;
    // Puede estar instalado desde varios marketplaces: vale el primero que se
    // pueda comparar; si ninguno, se dicen los motivos de todos (revision ronda 1, MEN-2).
    const motivos = [];
    for (const [clave, entradas] of Object.entries(plugins)) {
        if (!clave.startsWith(prefijo))
            continue;
        const e = entradaQueAplica(entradas, repoCwd);
        if (e === undefined)
            continue;
        const s = compararConMarketplace(dirPlugins, clave.slice(prefijo.length), e['version'], nombrePlugin);
        if (s.estado === 'comparable')
            return s;
        motivos.push(s.motivo);
    }
    if (motivos.length === 0)
        return noComprobable(`${nombrePlugin} no esta instalado como plugin de Claude Code para este proyecto`);
    return noComprobable(motivos.join('; '));
}
function compararConMarketplace(dirPlugins, marketplace, instalada, nombrePlugin) {
    if (typeof instalada !== 'string' || !esVersionSemver(instalada)) {
        return noComprobable(`la version instalada desde ${marketplace} no es semver (${String(instalada)})`);
    }
    // 2. La copia local del marketplace.
    let dirMarketplace = path.join(dirPlugins, 'marketplaces', marketplace);
    let actualizadoEn = null;
    const conocidos = leerJson(path.join(dirPlugins, 'known_marketplaces.json'));
    if (conocidos.estado === 'ok' && esObjeto(conocidos.json)) {
        const m = conocidos.json[marketplace];
        if (esObjeto(m)) {
            if (typeof m['installLocation'] === 'string' && m['installLocation'] !== '')
                dirMarketplace = m['installLocation'];
            if (typeof m['lastUpdated'] === 'string')
                actualizadoEn = m['lastUpdated'];
        }
    }
    const rutaMarketplace = path.join(dirMarketplace, '.claude-plugin', 'marketplace.json');
    const catalogo = leerObjeto(rutaMarketplace, `la copia local del marketplace ${marketplace}`);
    if (typeof catalogo === 'string')
        return noComprobable(catalogo);
    const lista = catalogo['plugins'];
    const entrada = Array.isArray(lista) ? lista.find((p) => esObjeto(p) && p['name'] === nombrePlugin) : undefined;
    if (!esObjeto(entrada))
        return noComprobable(`${nombrePlugin} no figura en ${rutaMarketplace}`);
    // 3. La version disponible: la del plugin.json si la fuente es local, si no la del catalogo.
    let disponible = entrada['version'];
    let rutaDisponible = rutaMarketplace;
    const fuente = entrada['source'];
    let problemaManifiesto = '';
    if (typeof fuente === 'string' && fuente.startsWith('.')) {
        const rutaManifiesto = path.join(dirMarketplace, fuente, '.claude-plugin', 'plugin.json');
        const l = leerJson(rutaManifiesto);
        if (l.estado === 'ok' && esObjeto(l.json) && typeof l.json['version'] === 'string') {
            disponible = l.json['version'];
            rutaDisponible = rutaManifiesto;
        }
        else if (l.estado === 'ilegible') {
            // Si el catalogo trae version, se usa; si no, el motivo nombra este fichero (revision ronda 1, MEN-1).
            problemaManifiesto = `; ${rutaManifiesto} ilegible: ${l.motivo}`;
        }
    }
    if (typeof disponible !== 'string') {
        return noComprobable(`la copia local del marketplace ${marketplace} no declara version (${rutaDisponible}${problemaManifiesto})`);
    }
    if (!esVersionSemver(disponible))
        return noComprobable(`la version disponible no es semver (${disponible})`);
    return { estado: 'comparable', instalada, disponible, marketplace, rutaDisponible, marketplaceActualizadoEn: actualizadoEn };
}
