/**
 * Lectura de los informes de doctor-deploy que `--escribir` deja en
 * docs/doctor-deploy/ (TASK-067), para el aviso de `finish` de una release.
 * Solo lee: nunca ejecuta una sonda ni escribe nada.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { avisosRelease } from '../core/aviso-release.js';
import { diffNameOnly, headCommit, isAncestor } from './git.js';
const MAX_BYTES_INFORME = 5 * 1024 * 1024;
function puntosDe(valor) {
    if (!Array.isArray(valor))
        return null;
    const res = [];
    for (const p of valor) {
        if (typeof p !== 'object' || p === null)
            return null;
        const o = p;
        if (typeof o['id'] !== 'string' || typeof o['estado'] !== 'string' || typeof o['severidad'] !== 'string')
            return null;
        res.push({ id: o['id'], estado: o['estado'], severidad: o['severidad'] });
    }
    return res;
}
/** Un informe JSON como `InformeLeido`, o null si no es un informe de doctor-deploy. */
export function interpretarInforme(archivo, texto) {
    let datos;
    try {
        datos = JSON.parse(texto);
    }
    catch {
        return null;
    }
    if (typeof datos !== 'object' || datos === null)
        return null;
    const o = datos;
    const puntos = puntosDe(o['puntos']);
    const commit = o['commit'];
    if (o['comando'] !== 'doctor-deploy' || typeof o['fecha'] !== 'string' || puntos === null)
        return null;
    if (commit !== null && typeof commit !== 'string')
        return null;
    return { archivo, fecha: o['fecha'], commit, puntos };
}
export function leerInformesDeploy(raiz) {
    const dir = path.join(raiz, 'docs', 'doctor-deploy');
    let nombres;
    try {
        nombres = readdirSync(dir);
    }
    catch {
        return { informes: [], ilegibles: [], soloMarkdown: 0 };
    }
    const informes = [];
    const ilegibles = [];
    let soloMarkdown = 0;
    for (const nombre of nombres.sort()) {
        if (nombre.startsWith('.'))
            continue; // temporales de una escritura en curso
        if (nombre.endsWith('.md'))
            soloMarkdown++;
        if (!nombre.endsWith('.json'))
            continue;
        try {
            if (statSync(path.join(dir, nombre)).size > MAX_BYTES_INFORME)
                throw new Error('demasiado grande');
            const informe = interpretarInforme(nombre, readFileSync(path.join(dir, nombre), 'utf8'));
            if (informe === null)
                ilegibles.push(nombre);
            else
                informes.push(informe);
        }
        catch {
            ilegibles.push(nombre);
        }
    }
    return { informes, ilegibles, soloMarkdown };
}
/**
 * Avisos de doctor-deploy para el cierre de una release. Nunca lanza: cualquier fallo (informe
 * ilegible, Git que no responde...) se convierte en un aviso, porque este aviso no puede romper `finish`.
 */
export function avisosDeployDeRelease(idTarea, cwd) {
    try {
        const { informes, ilegibles, soloMarkdown } = leerInformesDeploy(cwd);
        let punta = null;
        try {
            punta = headCommit(cwd).trim();
        }
        catch {
            punta = null;
        }
        const git = {
            esAncestro: (a, b) => {
                try {
                    return isAncestor(a, b, cwd);
                }
                catch {
                    return false;
                }
            },
            rutasCambiadas: (desde, hasta) => {
                try {
                    return diffNameOnly(desde, hasta, cwd);
                }
                catch {
                    return null;
                }
            },
        };
        return avisosRelease({ idTarea, punta, informes, ilegibles, soloMarkdown, git });
    }
    catch (e) {
        const msg = (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ');
        return [`${idTarea}: no se pudo comprobar el informe de doctor-deploy (${msg}). La tarea se cierra igualmente.`];
    }
}
