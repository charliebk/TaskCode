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

let texto = '';
try {
  texto = readFileSync(0, 'utf8');
} catch {
  texto = '';
}

// TASK-114: prefiltro sin cargar el guardian: `merge`/`commit` y ademas `git` o
// un `.sh` (el guardian decide con la regla exacta, INVOCA_GIT_O_CIERRE).
const puedeIntegrar = /merge|commit/i.test(texto) && /git|\.sh/i.test(texto);

interface Decision {
  codigo: 0 | 2;
  stderr: string;
}

async function decidir(): Promise<Decision> {
  if (/aceptacion/i.test(texto)) {
    try {
      const [g, e] = await Promise.all([import('./guardia-heldout.js'), import('./entrada-pretooluse.js')]);
      const d = g.decidirHeldout(e.parsearEntradaPreToolUse(texto));
      if (d.codigo === 2) return d;
    } catch {
      // deja pasar: decide el otro guardian
    }
  }
  if (puedeIntegrar) {
    try {
      const g = await import('./guardia-merge.js');
      return g.decidirPreToolUse(g.parsearEntradaPreToolUse(texto));
    } catch {
      // deja pasar
    }
  }
  return { codigo: 0, stderr: '' };
}

if (puedeIntegrar || /aceptacion/i.test(texto)) {
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
