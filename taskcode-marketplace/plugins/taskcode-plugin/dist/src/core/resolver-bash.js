/**
 * Que bash lanza taskctl (TASK-134). Logica pura: el sistema de ficheros y el
 * entorno entran como datos, para probarla sin procesos.
 *
 * En Windows, "bash" a secas es el primero del PATH, y desde PowerShell suele
 * ser C:\Windows\System32\bash.exe (WSL), que no abre el script: finish
 * fallaba o no segun la terminal. Por eso en Windows se busca el bash de Git a
 * partir de git.exe (la instalacion de Git lo trae en usr\bin o en bin) y el
 * bash del PATH queda solo como respaldo. En Linux y macOS, "bash" como
 * siempre.
 */
import path from 'node:path';
/**
 * Niveles que se sube desde la carpeta de git.exe buscando la raiz de la
 * instalacion: cmd\ y bin\ estan a uno; mingw64\bin, ucrt64\bin o
 * clangarm64\bin, a dos.
 */
const NIVELES_HASTA_LA_RAIZ = 2;
/** usr\bin\bash.exe primero: es el bash de verdad; bin\bash.exe es un lanzador. */
const BASH_EN_LA_RAIZ = [path.win32.join('usr', 'bin', 'bash.exe'), path.win32.join('bin', 'bash.exe')];
export function resolverBash(entorno) {
    if (entorno.plataforma !== 'win32')
        return { comando: 'bash', origen: 'path' };
    const p = path.win32;
    for (const dir of entorno.path.split(';')) {
        const limpio = dir.trim().replace(/^"(.*)"$/, '$1');
        if (limpio === '' || !entorno.existe(p.join(limpio, 'git.exe')))
            continue;
        let raiz = p.resolve(limpio);
        for (let nivel = 1; nivel <= NIVELES_HASTA_LA_RAIZ; nivel++) {
            const arriba = p.dirname(raiz);
            if (arriba === raiz)
                break;
            raiz = arriba;
            for (const rel of BASH_EN_LA_RAIZ) {
                const candidato = p.join(raiz, rel);
                if (entorno.existe(candidato))
                    return { comando: candidato, origen: 'git' };
            }
        }
    }
    return { comando: 'bash', origen: 'path' };
}
