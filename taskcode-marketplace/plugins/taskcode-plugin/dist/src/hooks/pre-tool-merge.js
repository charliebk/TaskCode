/**
 * Punto de entrada del hook `PreToolUse` (hooks/hooks.json). Corre antes de
 * CADA comando Bash/PowerShell, asi que lo primero es barato: si el texto no
 * contiene `merge`, sale 0 sin cargar nada mas. Si no, decide
 * (guardia-merge.ts): 0 deja pasar, 2 bloquea con el motivo en stderr.
 * Nunca sale con 1, que Claude Code trata como error NO bloqueante.
 */
import { readFileSync } from 'node:fs';
let texto = '';
try {
    texto = readFileSync(0, 'utf8');
}
catch {
    texto = '';
}
if (/merge/i.test(texto)) {
    import('./guardia-merge.js').then((g) => {
        const d = g.decidirPreToolUse(g.parsearEntradaPreToolUse(texto));
        if (d.stderr !== '')
            process.stderr.write(`${d.stderr}\n`);
        process.exitCode = d.codigo;
    }, () => {
        process.exitCode = 0;
    });
}
else {
    process.exitCode = 0;
}
