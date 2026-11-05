/**
 * Punto de entrada del hook `PreToolUse` de Bash/PowerShell (hooks/hooks.json).
 * Corre antes de CADA comando, asi que lo primero es barato: si el texto no
 * contiene `merge` ni `aceptacion`, sale 0 sin cargar nada mas. Si no, decide
 * cada guardian que aplique: el de merges (guardia-merge.ts) y el de held-out
 * (guardia-heldout.ts, TASK-078). El primero que bloquea gana: sale 2 con su
 * motivo en stderr. Nunca sale con 1, que Claude Code trata como error NO
 * bloqueante; el fallo de un guardian deja pasar y no impide decidir al otro.
 */
import { readFileSync } from 'node:fs';
let texto = '';
try {
    texto = readFileSync(0, 'utf8');
}
catch {
    texto = '';
}
async function decidir() {
    if (/aceptacion/i.test(texto)) {
        try {
            const [g, e] = await Promise.all([import('./guardia-heldout.js'), import('./entrada-pretooluse.js')]);
            const d = g.decidirHeldout(e.parsearEntradaPreToolUse(texto));
            if (d.codigo === 2)
                return d;
        }
        catch {
            // deja pasar: decide el otro guardian
        }
    }
    if (/merge/i.test(texto)) {
        try {
            const g = await import('./guardia-merge.js');
            return g.decidirPreToolUse(g.parsearEntradaPreToolUse(texto));
        }
        catch {
            // deja pasar
        }
    }
    return { codigo: 0, stderr: '' };
}
if (/merge|aceptacion/i.test(texto)) {
    decidir().then((d) => {
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
