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
                    return { comando: candidato, origen: 'git', herramientas: p.join(raiz, 'usr', 'bin') };
            }
        }
    }
    return { comando: 'bash', origen: 'path' };
}
/**
 * El entorno con el que se lanza el script. Con el bash de Git, su usr\bin va
 * delante en el PATH: lanzado desde PowerShell, el PATH suele tener solo
 * Git\cmd y el script no encontraria mktemp ni dirname (comprobado a mano en
 * TASK-134). La clave del PATH se conserva tal cual viene (en Windows suele
 * ser "Path"), para no dejar dos claves que solo difieren en mayusculas. Con
 * el bash del PATH, el entorno no se toca (null).
 */
export function entornoParaBash(bash, entorno) {
    if (bash.origen !== 'git')
        return null;
    const clave = Object.keys(entorno).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH';
    const actual = entorno[clave] ?? '';
    return { ...entorno, [clave]: actual === '' ? bash.herramientas : `${bash.herramientas};${actual}` };
}
