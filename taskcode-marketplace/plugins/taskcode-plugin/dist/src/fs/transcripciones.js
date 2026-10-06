/**
 * Busca la transcripcion de un subagente de Claude Code (TASK-023):
 * `<config>/projects/<proyecto>/<sesion>/subagents/agent-<id>.jsonl`, con
 * `<config>` = `CLAUDE_CONFIG_DIR` si esta definida y, si no, `~/.claude`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { esAgentIdValido } from '../core/coste-transcripcion.js';
import { isEnoent, isEnotdir } from './task-store.js';
export function directorioConfigClaude(env = process.env) {
    const d = env['CLAUDE_CONFIG_DIR'];
    return d !== undefined && d.trim() !== '' ? d : path.join(homedir(), '.claude');
}
async function subdirectorios(dir) {
    try {
        return (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
    }
    catch (e) {
        if (isEnoent(e) || isEnotdir(e))
            return [];
        throw e;
    }
}
/**
 * Rutas de `agent-<id>.jsonl` bajo `<config>/projects/*\/*\/subagents/`. El id
 * se valida ANTES de componer ninguna ruta: nada de `..` ni separadores.
 */
export async function buscarTranscripciones(configDir, agentId) {
    if (!esAgentIdValido(agentId)) {
        throw new Error(`agentId invalido: "${agentId}"`);
    }
    const proyectos = path.join(configDir, 'projects');
    const encontradas = [];
    for (const proyecto of await subdirectorios(proyectos)) {
        for (const sesion of await subdirectorios(path.join(proyectos, proyecto))) {
            const dir = path.join(proyectos, proyecto, sesion, 'subagents');
            let nombres;
            try {
                nombres = await readdir(dir);
            }
            catch (e) {
                if (isEnoent(e) || isEnotdir(e))
                    continue;
                throw e;
            }
            if (nombres.includes(`agent-${agentId}.jsonl`))
                encontradas.push(path.join(dir, `agent-${agentId}.jsonl`));
        }
    }
    return encontradas.sort();
}
export function leerTranscripcion(ruta) {
    return readFile(ruta, 'utf8');
}
