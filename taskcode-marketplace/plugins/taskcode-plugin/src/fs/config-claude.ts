/**
 * Directorio de configuracion de Claude Code: `CLAUDE_CONFIG_DIR` si esta
 * definida y no vacia; si no, `~/.claude`. Lo usan las transcripciones de
 * subagentes (TASK-023) y la sonda de hooks de doctor (TASK-076).
 */
import { homedir } from 'node:os';
import path from 'node:path';

export function directorioConfigClaude(env: NodeJS.ProcessEnv = process.env): string {
  const d = env['CLAUDE_CONFIG_DIR'];
  return d !== undefined && d.trim() !== '' ? d : path.join(homedir(), '.claude');
}
