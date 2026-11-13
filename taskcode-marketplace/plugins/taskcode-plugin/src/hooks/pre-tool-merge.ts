/**
 * Punto de entrada del hook `PreToolUse` de Bash/PowerShell (hooks/hooks.json).
 * Corre antes de CADA comando, asi que lo primero es barato: si el texto no
 * contiene `merge`, `commit` (TASK-123) ni `aceptacion`, o si nombra `merge`/`commit` sin `git` ni un
 * script de cierre (TASK-114), sale 0 sin cargar nada mas. Si no, decide
 * cada guardian que aplique: el de merges (guardia-merge.ts) y el de held-out
 * (guardia-heldout.ts, TASK-078). El primero que bloquea gana: sale 2 con su
 * motivo en stderr. Nunca sale con 1, que Claude Code trata como error NO
 * bloqueante; el fallo de un guardian deja pasar y no impide decidir al otro.
 */
import { readFileSync } from 'node:fs';
import { nombraHeldout, puedeIntegrar } from './prefiltro.js';

let texto = '';
try {
  texto = readFileSync(0, 'utf8');
} catch {
  texto = '';
}

// TASK-114: prefiltros sin cargar ningun guardian (prefiltro.ts, sin dependencias).
const integra = puedeIntegrar(texto);
const heldout = nombraHeldout(texto);

interface Decision {
  codigo: 0 | 2;
  stderr: string;
}

async function decidir(): Promise<Decision> {
  if (heldout) {
    try {
      const [g, e] = await Promise.all([import('./guardia-heldout.js'), import('./entrada-pretooluse.js')]);
      const d = g.decidirHeldout(e.parsearEntradaPreToolUse(texto));
      if (d.codigo === 2) return d;
    } catch {
      // deja pasar: decide el otro guardian
    }
  }
  if (integra) {
    try {
      const g = await import('./guardia-merge.js');
      return g.decidirPreToolUse(g.parsearEntradaPreToolUse(texto));
    } catch {
      // deja pasar
    }
  }
  return { codigo: 0, stderr: '' };
}

if (integra || heldout) {
  decidir().then(
    (d) => {
      if (d.stderr !== '') process.stderr.write(`${d.stderr}\n`);
      process.exitCode = d.codigo;
    },
    () => {
      process.exitCode = 0;
    }
  );
} else {
  process.exitCode = 0;
}
