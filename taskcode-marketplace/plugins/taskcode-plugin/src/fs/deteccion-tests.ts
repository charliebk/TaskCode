/**
 * Lectura de la raiz del proyecto para proponer `comando_verificacion`
 * (TASK-088). Fina a proposito: lista la raiz (sin recursion) y lee, como
 * mucho, `package.json` y `pyproject.toml`. Las reglas estan en
 * core/comando-tests.ts.
 *
 * Falla en cerrado hacia `omitida`: si algo no se puede leer, no se detecta
 * nada y doctor dice lo mismo que sin tests.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { proponerComandosTests, type ComandoTests } from '../core/comando-tests.js';
import { MAX_BYTES_MARCADOR_APLICACION } from './deteccion-app.js';

function ficherosDeRaiz(cwd: string): string[] {
  const r: string[] = [];
  for (const d of readdirSync(cwd, { withFileTypes: true })) {
    if (d.isFile()) r.push(d.name);
    else if (d.isSymbolicLink()) {
      try {
        if (statSync(path.join(cwd, d.name)).isFile()) r.push(d.name);
      } catch {
        // enlace roto: no cuenta
      }
    }
  }
  return r;
}

function leerAcotado(cwd: string, ficheros: readonly string[], nombre: string): string | null {
  const real = ficheros.find((f) => f.toLowerCase() === nombre);
  if (real === undefined) return null;
  try {
    const ruta = path.join(cwd, real);
    if (statSync(ruta).size > MAX_BYTES_MARCADOR_APLICACION) return null;
    return readFileSync(ruta, 'utf8');
  } catch {
    return null;
  }
}

/** Los comandos de tests que se deducen de la raiz de `cwd`; vacio si no se puede leer. */
export function detectarComandosTests(cwd: string, plataforma: NodeJS.Platform = process.platform): ComandoTests[] {
  let ficheros: string[];
  try {
    ficheros = ficherosDeRaiz(cwd);
  } catch {
    return [];
  }
  return proponerComandosTests({
    ficherosRaiz: ficheros,
    packageJson: leerAcotado(cwd, ficheros, 'package.json'),
    pyproject: leerAcotado(cwd, ficheros, 'pyproject.toml'),
    plataforma,
  });
}
