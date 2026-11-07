/**
 * TASK-082: que revisoras tocan a un rango de commits, con el MISMO
 * clasificador y las MISMAS exclusiones que usa `taskctl review` para
 * repartir la revision. Lo comparten `review` (que ademas necesita los
 * ficheros de cada grupo) y `siguiente --json` (que da los nombres, para que
 * el implementador sepa que listas pasar en su autorrevision).
 *
 * Una sola fuente a proposito: si la skill le pidiera al modelo que aplicara
 * los `patrones_archivo` a ojo, habria una segunda copia del clasificador, y
 * las copias de esos patrones ya divergieron dos veces.
 */
import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
import { EXCLUIR_HELDOUT } from '../core/heldout.js';
import { ficherosParaRevision } from './git.js';

/**
 * Patrones que nunca entran en una revision: los de `excluir_de_revision`
 * del config mas los tests held-out, que no se embeben se configure lo que
 * se configure (TASK-073).
 */
export function excluirDeRevision(excluirConfig: readonly string[]): string[] {
  return [...new Set([...excluirConfig, EXCLUIR_HELDOUT])];
}

/**
 * Nombres de las skills revisoras que repartiria `review` para `desde..hasta`,
 * en el orden de sus grupos. Sin ficheros incluidos, la generica (como haria
 * `review`).
 */
export function revisoresDelRango(
  desde: string,
  hasta: string,
  excluir: readonly string[],
  cwd: string
): string[] {
  const { incluidos } = ficherosParaRevision(desde, hasta, excluir, cwd);
  return clasificarPorDominio(incluidos, cargarCatalogoRevisores()).grupos.map((g) => g.revisor);
}
