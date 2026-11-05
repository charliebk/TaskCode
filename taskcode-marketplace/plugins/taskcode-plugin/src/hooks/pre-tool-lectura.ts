/**
 * Punto de entrada del hook `PreToolUse` de herramientas de fichero
 * (Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob, hooks/hooks.json).
 * Corre antes de CADA una de ellas, en todos los proyectos con el plugin,
 * asi que lo primero es barato: si la entrada no contiene `aceptacion`, sale
 * 0 sin cargar nada mas. Si no, decide (guardia-heldout.ts): 0 deja pasar, 2
 * bloquea con el motivo en stderr. Nunca sale con 1, que Claude Code trata
 * como error NO bloqueante; un fallo propio deja pasar.
 */
import { readFileSync } from 'node:fs';

let texto = '';
try {
  texto = readFileSync(0, 'utf8');
} catch {
  texto = '';
}

if (/aceptacion/i.test(texto)) {
  Promise.all([import('./guardia-heldout.js'), import('./entrada-pretooluse.js')]).then(
    ([g, e]) => {
      const d = g.decidirHeldout(e.parsearEntradaPreToolUse(texto));
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
