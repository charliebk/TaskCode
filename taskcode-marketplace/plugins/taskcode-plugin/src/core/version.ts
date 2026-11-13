/**
 * Version de taskctl (TASK-084). Vive en el nucleo, y no en `cli.ts`, porque
 * cada fila de `## Transiciones` la anota (`core/transiciones.ts`) y el
 * nucleo no debe depender del punto de entrada.
 *
 * Esta repetida en `package.json` y `.claude-plugin/plugin.json`: un test de
 * empaquetado exige que las tres coincidan, porque una fila escrita con una
 * version desfasada no se puede corregir sin reescribir historia.
 *
 * Regla de publicacion: la version se sube al ABRIR el ciclo (la primera
 * tarea de la version nueva), no al publicar. Asi las tareas que construyen
 * una version se cierran con su numero y `taskctl metricas --por-version`
 * no las mezcla con la anterior.
 */
export const VERSION_TASKCTL = '0.16.0';

/** Nombre del plugin en los marketplaces de Claude Code (`<nombre>@<marketplace>`). */
export const NOMBRE_PLUGIN = 'taskcode-plugin';

const VERSION_PARTES_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

/** true si `v` es una version semver (`0.10.0`, `0.12.0-dev`); un SHA o un texto libre no lo son. */
export function esVersionSemver(v: string): boolean {
  return VERSION_PARTES_RE.test(v);
}

function compararIdentificador(a: string, b: string): number {
  const na = /^\d+$/.test(a);
  const nb = /^\d+$/.test(b);
  if (na && nb) return Number(a) - Number(b);
  if (na !== nb) return na ? -1 : 1; // numerico antes que alfanumerico (semver)
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Orden semver: mayor, menor y parche como numeros; sin pre-release va
 * despues de con ella; dos pre-releases por identificadores. Lo que no es
 * una version va al final: quien compare versiones ajenas debe filtrar antes
 * con `esVersionSemver` (TASK-087).
 */
export function compararVersiones(a: string, b: string): number {
  const ma = VERSION_PARTES_RE.exec(a);
  const mb = VERSION_PARTES_RE.exec(b);
  if (ma === null || mb === null) return ma === null ? (mb === null ? (a < b ? -1 : a > b ? 1 : 0) : 1) : -1;
  for (let i = 1; i <= 3; i++) {
    const d = Number(ma[i]) - Number(mb[i]);
    if (d !== 0) return d;
  }
  const pa = ma[4];
  const pb = mb[4];
  if (pa === undefined || pb === undefined) return pa === pb ? 0 : pa === undefined ? 1 : -1;
  const ia = pa.split('.');
  const ib = pb.split('.');
  for (let i = 0; i < Math.min(ia.length, ib.length); i++) {
    const d = compararIdentificador(ia[i] as string, ib[i] as string);
    if (d !== 0) return d;
  }
  return ia.length - ib.length;
}
