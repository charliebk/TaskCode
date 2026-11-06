/**
 * Sonda de disco de la comprobacion `hooks-subagente` de doctor (TASK-076).
 * Lee, sin escribir nada, donde Claude Code declara hooks:
 *
 * - settings de usuario (`<config>/settings.json`) y de proyecto
 *   (`.claude/settings.json` y `.claude/settings.local.json`);
 * - los plugins instalados y habilitados segun
 *   `<config>/plugins/installed_plugins.json` (solo la version activa de
 *   cada uno, no toda la cache): su `hooks/hooks.json` y los `hooks` de su
 *   `.claude-plugin/plugin.json` (en linea o como ruta).
 *
 * Nada de aqui lanza: un fichero ausente no cuenta y uno ilegible o con JSON
 * roto se anota en `ilegibles`. Son ficheros de terceros; doctor no los
 * convierte en un error.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { hooksQueAlcanzanSubagente, pluginHabilitado } from '../core/hooks-subagente.js';
function leerJson(ruta) {
    if (!existsSync(ruta))
        return { estado: 'ausente' };
    try {
        return { estado: 'ok', json: JSON.parse(readFileSync(ruta, 'utf8').replace(/^﻿/, '')) };
    }
    catch (e) {
        return { estado: 'ilegible', motivo: (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim() };
    }
}
const esObjeto = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
function mismaRuta(a, b) {
    const n = (p) => {
        const r = path.resolve(p).replace(/[\\/]+$/, '');
        return process.platform === 'win32' ? r.toLowerCase() : r;
    };
    return n(a) === n(b);
}
export function sondearHooksClaude(configDir, repoCwd) {
    const r = { hallazgos: [], leidos: 0, ilegibles: [] };
    const leer = (ruta) => {
        const l = leerJson(ruta);
        if (l.estado === 'ok') {
            r.leidos++;
            return l.json;
        }
        if (l.estado === 'ilegible')
            r.ilegibles.push(`${ruta}: ${l.motivo}`);
        return undefined;
    };
    const examinar = (json, origen, ruta) => {
        r.hallazgos.push(...hooksQueAlcanzanSubagente(json, origen, ruta));
    };
    // Settings: de usuario y de proyecto. Se guardan para enabledPlugins.
    const rutaUsuario = path.join(configDir, 'settings.json');
    const rutaProyecto = path.join(repoCwd, '.claude', 'settings.json');
    const rutaLocal = path.join(repoCwd, '.claude', 'settings.local.json');
    const usuario = leer(rutaUsuario);
    const proyecto = leer(rutaProyecto);
    const local = leer(rutaLocal);
    examinar(usuario, 'settings de usuario', rutaUsuario);
    examinar(proyecto, 'settings del proyecto', rutaProyecto);
    examinar(local, 'settings locales del proyecto', rutaLocal);
    // Plugins instalados y habilitados.
    const rutaInstalados = path.join(configDir, 'plugins', 'installed_plugins.json');
    const instalados = leer(rutaInstalados);
    if (instalados === undefined)
        return r;
    if (!esObjeto(instalados) || !esObjeto(instalados['plugins'])) {
        r.ilegibles.push(`${rutaInstalados}: formato no reconocido (sin "plugins")`);
        return r;
    }
    const settings = [local, proyecto, usuario];
    for (const [clave, entradas] of Object.entries(instalados['plugins'])) {
        if (!Array.isArray(entradas) || !pluginHabilitado(clave, settings))
            continue;
        // La instalacion que aplica aqui: la de usuario o la de este proyecto.
        const entrada = entradas.find((e) => esObjeto(e) &&
            typeof e['installPath'] === 'string' &&
            (typeof e['projectPath'] !== 'string' || mismaRuta(e['projectPath'], repoCwd)));
        if (entrada === undefined)
            continue;
        const dir = entrada['installPath'];
        const origen = `plugin ${clave}`;
        const rutaHooks = path.join(dir, 'hooks', 'hooks.json');
        examinar(leer(rutaHooks), origen, rutaHooks);
        const rutaManifiesto = path.join(dir, '.claude-plugin', 'plugin.json');
        const manifiesto = leer(rutaManifiesto);
        if (!esObjeto(manifiesto))
            continue;
        const h = manifiesto['hooks'];
        if (esObjeto(h)) {
            examinar(manifiesto, origen, rutaManifiesto);
        }
        else if (typeof h === 'string') {
            const ruta = path.resolve(dir, h);
            if (!mismaRuta(ruta, rutaHooks))
                examinar(leer(ruta), origen, ruta);
        }
    }
    return r;
}
