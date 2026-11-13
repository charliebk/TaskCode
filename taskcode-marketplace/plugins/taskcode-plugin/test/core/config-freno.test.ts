/**
 * TASK-125: las claves `comando_verificacion_freno` y `presupuesto_freno_s`.
 * Solo parsearConfig (logica pura). El freno que las usa se prueba en
 * test/hooks/freno-presupuesto.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLAVES_CONFIG,
  ConfigError,
  parsearConfig,
  parsearConfigConAvisos,
  presupuestoFreno,
  PRESUPUESTO_FRENO_POR_DEFECTO_S,
  TECHO_HOOK_STOP_S,
} from '../../src/core/config.js';

const RUTA = '/repo/.taskcode/config.yml';
const COMPLETA = 'comando_verificacion: "npm test"\n';

test('freno (TASK-125): claves conocidas, null por defecto y sin tope propio', () => {
  for (const c of ['comando_verificacion_freno', 'presupuesto_freno_s']) {
    assert.ok((CLAVES_CONFIG as readonly string[]).includes(c), c);
  }
  const cfg = parsearConfig(COMPLETA, RUTA);
  assert.equal(cfg.comando_verificacion_freno, null);
  assert.equal(cfg.presupuesto_freno_s, null);
  assert.equal(presupuestoFreno(cfg), null, 'sin ninguna de las dos, sin tope propio (como antes)');
});

test('freno (TASK-125): con el comando y sin presupuesto, 180 s; la clave manda; el presupuesto vale solo', () => {
  const conComando = parsearConfigConAvisos(`${COMPLETA}comando_verificacion_freno: "node rapida.js"\n`, RUTA);
  assert.equal(conComando.avisos.length, 0);
  assert.equal(conComando.config.comando_verificacion_freno, 'node rapida.js');
  assert.equal(presupuestoFreno(conComando.config), PRESUPUESTO_FRENO_POR_DEFECTO_S);
  assert.equal(PRESUPUESTO_FRENO_POR_DEFECTO_S, 180);
  const ambas = parsearConfig(`${COMPLETA}comando_verificacion_freno: "node rapida.js"\npresupuesto_freno_s: 60\n`, RUTA);
  assert.equal(presupuestoFreno(ambas), 60);
  const solo = parsearConfig(`${COMPLETA}presupuesto_freno_s: ${String(TECHO_HOOK_STOP_S)}\n`, RUTA);
  assert.equal(presupuestoFreno(solo), TECHO_HOOK_STOP_S);
});

test('freno (TASK-125): presupuesto 0, negativo, decimal, texto o mayor que el timeout del hook Stop aborta', () => {
  for (const valor of ['0', '-5', '2.5', 'tres', '"60"', String(TECHO_HOOK_STOP_S + 1)]) {
    assert.throws(
      () => parsearConfig(`${COMPLETA}presupuesto_freno_s: ${valor}\n`, RUTA),
      (e: unknown) => {
        assert.ok(e instanceof ConfigError, String(e));
        assert.ok(e.message.includes(`"presupuesto_freno_s" debe ser un numero entero de 1 a ${String(TECHO_HOOK_STOP_S)}`), e.message);
        return true;
      },
      valor
    );
  }
});

test('freno (TASK-125): el comando del freno sin comando_verificacion aborta; vacio aborta', () => {
  assert.throws(
    () => parsearConfig('comando_verificacion_freno: "node rapida.js"\n', RUTA),
    /"comando_verificacion_freno" necesita tambien "comando_verificacion"/
  );
  assert.throws(() => parsearConfig(`${COMPLETA}comando_verificacion_freno: ""\n`, RUTA), /"comando_verificacion_freno" debe ser un comando/);
});

test('freno (TASK-125): el techo del presupuesto es el timeout del hook Stop de hooks.json', async () => {
  const { readFileSync } = await import('node:fs');
  const path = await import('node:path');
  const hooks = JSON.parse(
    readFileSync(path.join(import.meta.dirname, '..', '..', '..', 'hooks', 'hooks.json'), 'utf8')
  ) as { hooks: { Stop: { hooks: { timeout: number }[] }[] } };
  assert.equal(hooks.hooks.Stop[0]?.hooks[0]?.timeout, TECHO_HOOK_STOP_S);
});

test('doctor (TASK-125): dice que comando corre cada puerta (freno, review, finish) y el presupuesto del freno', async () => {
  const { comprobarPuertasVerificacion } = await import('../../src/commands/doctor.js');
  assert.deepEqual(comprobarPuertasVerificacion(parsearConfig('', RUTA)), [], 'sin comando_verificacion no hay puertas');
  const [solo] = comprobarPuertasVerificacion(parsearConfig(COMPLETA, RUTA));
  assert.equal(solo?.id, 'puertas-verificacion');
  assert.equal(solo?.nivel, 'ok');
  assert.equal(solo?.mensaje, 'freno "npm test", sin presupuesto; review no verifica; finish "npm test"');
  const [todas] = comprobarPuertasVerificacion(
    parsearConfig(
      `${COMPLETA}comando_verificacion_selectiva: "node sel.js"\ncomando_verificacion_freno: "node rapida.js"\n`,
      RUTA
    )
  );
  assert.equal(
    todas?.mensaje,
    'freno "node rapida.js" (comando_verificacion_freno), presupuesto 180 s; review "node sel.js"; finish "npm test"'
  );
  const [sinFreno] = comprobarPuertasVerificacion(
    parsearConfig(`${COMPLETA}comando_verificacion_selectiva: "node sel.js"\npresupuesto_freno_s: 90\n`, RUTA)
  );
  assert.match(sinFreno?.mensaje ?? '', /^freno "node sel\.js", presupuesto 90 s; review "node sel\.js"; finish "npm test"$/);
});

test('guia (TASK-125): la skill y la doc de configuracion explican el reparto de claves por puerta', async () => {
  const { readFileSync } = await import('node:fs');
  const path = await import('node:path');
  const raiz = path.join(import.meta.dirname, '..', '..', '..');
  const guia = readFileSync(path.join(raiz, 'skills', 'task-workflow', 'verificacion-selectiva.md'), 'utf8');
  assert.match(guia, /comando_verificacion_freno[\s\S]*presupuesto_freno_s[\s\S]*excedido/);
  assert.match(readFileSync(path.join(raiz, 'skills', 'task-workflow', 'SKILL.md'), 'utf8'), /comando_verificacion_freno/);
  const doc = readFileSync(path.join(raiz, 'docs', 'configuracion.md'), 'utf8');
  assert.match(doc, /\| Puerta \| Comando \|[\s\S]*Freno de fin de turno[\s\S]*taskctl review[\s\S]*taskctl finish/);
});
