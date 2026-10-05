// Repo plantilla para los tests que montan un repo Git temporal.
//
// Montar el repo base cuesta unos 6 procesos `git` (init, config, add,
// commit, checkout) y los ficheros de test lentos lo repetian en cada
// test. Aqui se monta una sola vez por fichero -- `node --test` corre
// cada fichero en su propio proceso, asi que basta el estado de este
// modulo -- y cada test recibe una copia nueva hecha con `fs.cp`.
//
// La receta la pone cada fichero: los repos base no son iguales entre
// ficheros (`.gitignore` con `logs/` o sin el, con o sin `develop`), y
// forzar uno comun cambiaria en silencio lo que prueban.
//
// La plantilla no debe llevar remotos, worktrees ni hooks: un worktree
// guarda rutas absolutas en `.git/worktrees/*/gitdir`, y un remoto
// haria que todas las copias empujaran al mismo sitio. Lo que un test
// necesite de eso lo monta sobre su copia.

import { rmSync } from 'node:fs';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export type ConRepo = (fn: (repoRoot: string, tareasRoot: string) => Promise<void>) => Promise<void>;

/**
 * Devuelve un `withTempRepo` que copia una plantilla montada una sola
 * vez con `preparar`. Cada llamada trabaja en un directorio propio que
 * se borra al terminar; la plantilla se borra al acabar el fichero.
 *
 * Si `preparar` o la copia fallan, el error llega tal cual al test: una
 * plantilla a medias no se reutiliza.
 */
export function plantillaRepo(prefijo: string, preparar: (dir: string) => Promise<void>): ConRepo {
  let plantilla: Promise<string> | null = null;

  const montar = async (): Promise<string> => {
    const dir = await mkdtemp(path.join(tmpdir(), `${prefijo}plantilla-`));
    try {
      await preparar(dir);
    } catch (err) {
      await rm(dir, { recursive: true, force: true });
      throw err;
    }
    return dir;
  };

  return async (fn) => {
    if (plantilla === null) {
      plantilla = montar();
      // La plantilla se borra al salir del proceso, no en un `after()`:
      // `after()` llamado dentro de un test se ata a ese test, y una
      // plantilla creada bajo demanda (una por config, por ejemplo) se
      // borraria al acabar el primero que la usa.
      plantilla.then((dir) => {
        process.once('exit', () => rmSync(dir, { recursive: true, force: true }));
      }, () => {});
      // Si el montaje falla, el siguiente test lo reintenta en vez de
      // heredar la promesa rechazada.
      plantilla.catch(() => {
        plantilla = null;
      });
    }
    const origen = await plantilla;
    const repoRoot = await mkdtemp(path.join(tmpdir(), prefijo));
    try {
      await cp(origen, repoRoot, { recursive: true });
      await fn(repoRoot, path.join(repoRoot, 'tareas'));
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  };
}
