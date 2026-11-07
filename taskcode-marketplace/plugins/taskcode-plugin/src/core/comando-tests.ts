/**
 * Propuesta de `comando_verificacion` a partir de los manifiestos de la raiz
 * del proyecto (TASK-088). Nucleo puro: no toca disco; la lectura esta en
 * fs/deteccion-tests.ts y quien decide el nivel del aviso es `taskctl doctor`.
 *
 * Decisiones (plan de TASK-088, Carlos 2026-11-07):
 *
 * - Solo la raiz: `comando_verificacion` se ejecuta desde ahi, asi que un
 *   manifiesto en una subcarpeta propondria un comando que no funciona.
 * - Node: `pnpm` / `yarn` / `npm` segun el fichero de bloqueo. Solo cuenta un
 *   `scripts.test` propio: el que deja `npm init` (falla siempre) no es un test.
 * - Maven y Gradle: el wrapper si existe, con la forma de la plataforma (el
 *   comando lo lanza cmd.exe en Windows y sh en el resto).
 * - Python: `pyproject.toml` solo cuenta si menciona pytest.
 * - Varios manifiestos: se encadenan con `&&` en el orden de REGLAS (vale en
 *   cmd.exe y en sh).
 */

export interface EntradaDeteccionTests {
  /** Nombres de los ficheros de la raiz (sin rutas). */
  ficherosRaiz: readonly string[];
  /** Contenido de `package.json`, o null si no hay o no se pudo leer. */
  packageJson: string | null;
  /** Contenido de `pyproject.toml`, o null si no hay o no se pudo leer. */
  pyproject: string | null;
  plataforma: NodeJS.Platform;
}

export interface ComandoTests {
  comando: string;
  /** Por que se propone, para el mensaje (`Cargo.toml`, `package.json con script "test"`...). */
  motivo: string;
}

/** Lo que escribe `npm init` en `scripts.test`: no es un test del proyecto. */
const TEST_POR_DEFECTO_NPM = /no test specified/i;

/** true si el `package.json` declara un script `test` propio. */
export function tieneScriptTest(packageJson: string | null): boolean {
  if (packageJson === null) return false;
  let datos: unknown;
  try {
    datos = JSON.parse(packageJson);
  } catch {
    return false;
  }
  if (typeof datos !== 'object' || datos === null) return false;
  const scripts = (datos as { scripts?: unknown }).scripts;
  if (typeof scripts !== 'object' || scripts === null) return false;
  const test = (scripts as { test?: unknown }).test;
  return typeof test === 'string' && test.trim() !== '' && !TEST_POR_DEFECTO_NPM.test(test);
}

function wrapper(nombre: string, hay: (f: string) => boolean, plataforma: NodeJS.Platform): string | null {
  if (plataforma === 'win32') return hay(`${nombre}.cmd`) || hay(`${nombre}.bat`) ? nombre : null;
  return hay(nombre) ? `./${nombre}` : null;
}

type Regla = (e: EntradaDeteccionTests, hay: (f: string) => boolean, conExt: (ext: string) => boolean) => ComandoTests | null;

const REGLAS: readonly Regla[] = [
  (e, hay) => {
    if (!hay('package.json') || !tieneScriptTest(e.packageJson)) return null;
    const gestor = hay('pnpm-lock.yaml') ? 'pnpm' : hay('yarn.lock') ? 'yarn' : 'npm';
    return { comando: `${gestor} test`, motivo: 'package.json con script "test"' };
  },
  (_e, hay) => (hay('cargo.toml') ? { comando: 'cargo test', motivo: 'Cargo.toml' } : null),
  (e, hay) => {
    if (!hay('pom.xml')) return null;
    return { comando: `${wrapper('mvnw', hay, e.plataforma) ?? 'mvn'} test`, motivo: 'pom.xml' };
  },
  (e, hay) => {
    const fichero = hay('build.gradle.kts') ? 'build.gradle.kts' : hay('build.gradle') ? 'build.gradle' : null;
    if (fichero === null) return null;
    return { comando: `${wrapper('gradlew', hay, e.plataforma) ?? 'gradle'} test`, motivo: fichero };
  },
  (_e, _hay, conExt) => {
    const sln = conExt('.sln');
    if (!sln && !conExt('.csproj')) return null;
    return { comando: 'dotnet test', motivo: sln ? 'solucion .sln' : 'proyecto .csproj' };
  },
  (_e, hay) => (hay('go.mod') ? { comando: 'go test ./...', motivo: 'go.mod' } : null),
  (e, hay) =>
    hay('pyproject.toml') && e.pyproject !== null && /pytest/i.test(e.pyproject)
      ? { comando: 'python -m pytest', motivo: 'pyproject.toml con pytest' }
      : null,
];

/**
 * Los comandos de tests que se deducen de la raiz, en el orden de REGLAS.
 * Sin distinguir mayusculas en los nombres (NTFS no las distingue).
 */
export function proponerComandosTests(e: EntradaDeteccionTests): ComandoTests[] {
  const nombres = new Set(e.ficherosRaiz.map((f) => f.toLowerCase()));
  const hay = (f: string): boolean => nombres.has(f.toLowerCase());
  const conExt = (ext: string): boolean => [...nombres].some((n) => n.endsWith(ext) && n.length > ext.length);
  const r: ComandoTests[] = [];
  for (const regla of REGLAS) {
    const c = regla(e, hay, conExt);
    if (c !== null) r.push(c);
  }
  return r;
}

/** El comando a proponer: todos encadenados con `&&`; null si no hay ninguno. */
export function comandoPropuesto(cs: readonly ComandoTests[]): string | null {
  return cs.length === 0 ? null : cs.map((c) => c.comando).join(' && ');
}
