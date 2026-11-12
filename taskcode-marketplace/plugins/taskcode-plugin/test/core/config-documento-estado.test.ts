/**
 * TASK-124: la clave `documento_estado`. Solo parsearConfig (logica pura, sin
 * disco ni Git): ruta de un fichero relativa a la raiz del repo, con las reglas
 * de las rutas de sincronizacion. Quien la usa (doctor) se prueba en
 * test/commands/doctor-documento-estado.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLAVES_CONFIG, CONFIG_DEFAULTS, ConfigError, parsearConfig, parsearConfigConAvisos } from '../../src/core/config.js';

const RUTA = '/repo/.taskcode/config.yml';

function rechaza(contenido: string, patron: RegExp): void {
  assert.throws(
    () => parsearConfig(contenido, RUTA),
    (e: unknown) => {
      assert.ok(e instanceof ConfigError, String(e));
      assert.match(e.message, /documento_estado/);
      assert.match(e.message, patron);
      return true;
    },
    `deberia rechazar:\n${contenido}`
  );
}

test('documento_estado: es clave conocida y sin ella vale null (no se vigila nada)', () => {
  assert.ok((CLAVES_CONFIG as readonly string[]).includes('documento_estado'));
  assert.equal(CONFIG_DEFAULTS.documento_estado, null);
  assert.equal(parsearConfig('', RUTA).documento_estado, null);
  assert.equal(parsearConfigConAvisos('documento_estado: docs/ESTADO.md\n', RUTA).avisos.length, 0);
});

test('documento_estado: una ruta relativa valida se normaliza a separadores POSIX', () => {
  assert.equal(parsearConfig('documento_estado: docs/ESTADO.md\n', RUTA).documento_estado, 'docs/ESTADO.md');
  assert.equal(parsearConfig('documento_estado: docs\\estado\\ESTADO.md\n', RUTA).documento_estado, 'docs/estado/ESTADO.md');
  assert.equal(parsearConfig('documento_estado: ./docs/../ESTADO.md\n', RUTA).documento_estado, 'ESTADO.md');
  // De tareas/, un fichero suelto en su raiz (como tareas/ROADMAP.md).
  assert.equal(parsearConfig('documento_estado: tareas/ESTADO.md\n', RUTA).documento_estado, 'tareas/ESTADO.md');
});

test('documento_estado: vacia, absoluta, fuera del repo, carpeta o de la herramienta aborta', () => {
  rechaza('documento_estado:\n', /no puede estar vacia/);
  rechaza('documento_estado: ""\n', /no puede estar vacia/);
  rechaza('documento_estado: /etc/ESTADO.md\n', /es absoluta/);
  rechaza('documento_estado: C:/ESTADO.md\n', /es absoluta/);
  rechaza('documento_estado: ../otro/ESTADO.md\n', /se sale del repo/);
  rechaza('documento_estado: docs/../../ESTADO.md\n', /se sale del repo/);
  rechaza('documento_estado: docs/\n', /es una carpeta/);
  rechaza('documento_estado: .\n', /es la raiz del repo/);
  rechaza('documento_estado: .git/ESTADO.md\n', /\.git\//);
  rechaza('documento_estado: .taskcode/ESTADO.md\n', /\.taskcode\//);
  rechaza('documento_estado: tareas/04-terminadas/ESTADO.md\n', /carpeta de estado/);
  rechaza('documento_estado: 3\n', /debe ser texto/);
});
