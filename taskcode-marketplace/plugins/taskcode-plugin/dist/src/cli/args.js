export function parseArgs(argv) {
    const positional = [];
    const flags = {};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === undefined)
            continue;
        if (arg.startsWith('--')) {
            const withoutPrefix = arg.slice(2);
            const eqIdx = withoutPrefix.indexOf('=');
            if (eqIdx !== -1) {
                const key = withoutPrefix.slice(0, eqIdx);
                flags[key] = withoutPrefix.slice(eqIdx + 1);
                continue;
            }
            const key = withoutPrefix;
            const next = argv[i + 1];
            if (next !== undefined && !next.startsWith('--')) {
                flags[key] = next;
                i++;
            }
            else {
                flags[key] = true;
            }
        }
        else {
            positional.push(arg);
        }
    }
    return { positional, flags };
}
