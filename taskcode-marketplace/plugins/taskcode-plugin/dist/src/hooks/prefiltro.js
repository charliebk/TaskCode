/**
 * TASK-114: prefiltros de texto del hook `PreToolUse` de Bash/PowerShell, sin
 * dependencias, para decidir sin cargar ningun guardian si hay algo que mirar.
 * Son mas laxos que las reglas exactas de cada guardian, que deciden despues.
 */
/** El comando puede integrar: nombra `merge`/`commit` y ademas `git` o un `.sh` (MEN-1 de la revision). */
export function puedeIntegrar(texto) {
    return /merge|commit/i.test(texto) && /git|\.sh/i.test(texto);
}
/** El comando puede nombrar una carpeta held-out. */
export function nombraHeldout(texto) {
    return /aceptacion/i.test(texto);
}
