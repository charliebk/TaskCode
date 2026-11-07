/**
 * Reglas de la propuesta de comando_verificacion (TASK-088). Sin disco.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comandoPropuesto, proponerComandosTests, tieneScriptTest, type EntradaDeteccionTests } from '../../src/core/comando-tests.js';

function entrada(ficheros: string[], extra: Partial<EntradaDeteccionTests> = {}): EntradaDeteccionTests {
  return { ficherosRaiz: ficheros, packageJson: null, pyproject: null, plataforma: 'linux', ...extra };
}

const PKG_CON_TEST = JSON.stringify({ scripts: { test: 'node --test' } });

function comandos(e: EntradaDeteccionTests): string[] {
  return proponerComandosTests(e).map((c) => c.comando);
}

test('package.json: solo cuenta un scripts.test propio', () => {
  assert.equal(tieneScriptTest(PKG_CON_TEST), true);
  assert.equal(tieneScriptTest(JSON.stringify({ scripts: { test: 'echo "Error: no test specified" && exit 1' } })), false);
  assert.equal(tieneScriptTest(JSON.stringify({ scripts: { build: 'tsc' } })), false);
  assert.equal(tieneScriptTest(JSON.stringify({ scripts: { test: '  ' } })), false);
  assert.equal(tieneScriptTest(JSON.stringify({ name: 'x' })), false);
  assert.equal(tieneScriptTest('{ roto'), false);
  assert.equal(tieneScriptTest('null'), false);
  assert.equal(tieneScriptTest(null), false);
});

test('Node: el gestor sale del fichero de bloqueo', () => {
  assert.deepEqual(comandos(entrada(['package.json'], { packageJson: PKG_CON_TEST })), ['npm test']);
  assert.deepEqual(comandos(entrada(['package.json', 'package-lock.json'], { packageJson: PKG_CON_TEST })), ['npm test']);
  assert.deepEqual(comandos(entrada(['package.json', 'pnpm-lock.yaml'], { packageJson: PKG_CON_TEST })), ['pnpm test']);
  assert.deepEqual(comandos(entrada(['package.json', 'yarn.lock'], { packageJson: PKG_CON_TEST })), ['yarn test']);
  assert.deepEqual(comandos(entrada(['package.json'], { packageJson: '{"scripts":{}}' })), []);
});

test('Rust, Go y .NET', () => {
  assert.deepEqual(comandos(entrada(['Cargo.toml'])), ['cargo test']);
  assert.deepEqual(comandos(entrada(['go.mod'])), ['go test ./...']);
  assert.deepEqual(comandos(entrada(['App.csproj'])), ['dotnet test']);
  assert.deepEqual(comandos(entrada(['X.sln', 'App.csproj'])), ['dotnet test']);
  assert.equal(proponerComandosTests(entrada(['X.sln']))[0]?.motivo, 'solucion .sln');
  // Un fichero que se llama literalmente ".csproj" no es un proyecto.
  assert.deepEqual(comandos(entrada(['.csproj'])), []);
});

test('Maven y Gradle: el wrapper si existe, con la forma de la plataforma', () => {
  assert.deepEqual(comandos(entrada(['pom.xml'])), ['mvn test']);
  assert.deepEqual(comandos(entrada(['pom.xml', 'mvnw', 'mvnw.cmd'])), ['./mvnw test']);
  assert.deepEqual(comandos(entrada(['pom.xml', 'mvnw', 'mvnw.cmd'], { plataforma: 'win32' })), ['mvnw test']);
  // En Windows, sin mvnw.cmd el wrapper de sh no sirve.
  assert.deepEqual(comandos(entrada(['pom.xml', 'mvnw'], { plataforma: 'win32' })), ['mvn test']);
  assert.deepEqual(comandos(entrada(['build.gradle'])), ['gradle test']);
  assert.deepEqual(comandos(entrada(['build.gradle.kts', 'gradlew', 'gradlew.bat'])), ['./gradlew test']);
  assert.deepEqual(comandos(entrada(['build.gradle.kts', 'gradlew', 'gradlew.bat'], { plataforma: 'win32' })), ['gradlew test']);
});

test('Python: pyproject.toml solo cuenta si menciona pytest', () => {
  assert.deepEqual(comandos(entrada(['pyproject.toml'], { pyproject: '[tool.pytest.ini_options]\n' })), ['python -m pytest']);
  assert.deepEqual(comandos(entrada(['pyproject.toml'], { pyproject: '[project]\nname = "x"\n' })), []);
  assert.deepEqual(comandos(entrada(['pyproject.toml'])), []);
});

test('sin distinguir mayusculas en los nombres', () => {
  assert.deepEqual(comandos(entrada(['CARGO.TOML'])), ['cargo test']);
  assert.deepEqual(comandos(entrada(['App.CSPROJ'])), ['dotnet test']);
});

test('sin manifiestos, nada; con varios, se encadenan con && en orden fijo', () => {
  assert.deepEqual(comandos(entrada(['README.md'])), []);
  assert.equal(comandoPropuesto([]), null);
  const cs = proponerComandosTests(entrada(['Cargo.toml', 'package.json', 'pnpm-lock.yaml'], { packageJson: PKG_CON_TEST }));
  assert.equal(comandoPropuesto(cs), 'pnpm test && cargo test');
});
