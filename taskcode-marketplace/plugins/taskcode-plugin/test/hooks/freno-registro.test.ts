/**
 * TASK-111: el freno Stop anota cada ejecucion en el registro de puertas y no
 * vuelve a verificar si la huella del arbol es la de su ultimo verde. Repos
 * Git temporales de verdad: una rama base `develop`, la rama de una tarea en
 * curso y un script de node FUERA del repo que lee su desenlace de un fichero
 * (asi se cambia lo que haria sin tocar el arbol) y cuenta sus ejecuciones.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { decidirStop } from '../../src/hooks/freno-stop.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { leerRegistroPuertas, rutaRegistroPuertas } from '../../src/fs/registro-puertas.js';
import { rutaProgreso } from '../../src/fs/progreso.js';
import { git, sampleTask } from '../helpers/finish-fixtures.js';

const RAMA = 'feature/task-111-freno';

const SCRIPT = `
const fs = require('node:fs');
const path = require('node:path');
fs.appendFileSync(path.join(__dirname, 'cuenta'), 'x');
const d = fs.readFileSync(path.join(__dirname, 'desenlace'), 'utf8').trim();
if (d === 'ok') { console.log('verde'); process.exit(0); }
console.error('ERROR: 1 test falla'); process.exit(1);
`;

interface Repo {
  raiz: string;
  fuera: string;
  ejecuciones(): number;
  desenlace(d: 'ok' | 'ko'): Promise<void>;
}

async function conRepo(fn: (r: Repo) => Promise<void>, o: { selectiva?: boolean; tarea?: boolean } = {}): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'freno-registro-'));
  const fuera = await mkdtemp(path.join(tmpdir(), 'freno-registro-fuera-'));
  try {
    await writeFile(path.join(fuera, 'verif.cjs'), SCRIPT, 'utf8');
    await writeFile(path.join(fuera, 'desenlace'), 'ok', 'utf8');
    const cmd = `node ${path.join(fuera, 'verif.cjs').split(path.sep).join('/')}`;
    git(['init', '-q', '-b', 'develop'], raiz);
    git(['config', 'user.email', 'test@example.com'], raiz);
    git(['config', 'user.name', 'Test'], raiz);
    git(['config', 'core.autocrlf', 'false'], raiz);
    for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
      await mkdir(path.join(raiz, 'tareas', c), { recursive: true });
      await writeFile(path.join(raiz, 'tareas', c, '.gitkeep'), '', 'utf8');
    }
    if (o.tarea !== false) {
      const t = sampleTask({ id: 'TASK-111', estado: 'en-curso', rama: RAMA, tipo: 'feature' });
      await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-111'), { recursive: true });
      await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-111', 'tarea.md'), serializeTareaFile(t, '## Objetivo\nx\n'), 'utf8');
    }
    await mkdir(path.join(raiz, '.taskcode'));
    await writeFile(
      path.join(raiz, '.taskcode', 'config.yml'),
      `comando_verificacion: "${cmd} completa"\n` + (o.selectiva === true ? `comando_verificacion_selectiva: "${cmd} selectiva"\n` : ''),
      'utf8'
    );
    await mkdir(path.join(raiz, 'src'));
    await writeFile(path.join(raiz, 'src', 'app.ts'), 'export const a = 1;\n', 'utf8');
    git(['add', '-A'], raiz);
    git(['commit', '-q', '-m', 'inicial'], raiz);
    git(['checkout', '-q', '-b', RAMA], raiz);
    await fn({
      raiz,
      fuera,
      ejecuciones: () => {
        const f = path.join(fuera, 'cuenta');
        return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
      },
      desenlace: (d) => writeFile(path.join(fuera, 'desenlace'), d, 'utf8'),
    });
  } finally {
    await rm(raiz, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
    await rm(fuera, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

function decidir(r: Repo) {
  return decidirStop({ hook_event_name: 'Stop', stop_hook_active: false, cwd: r.raiz }, { env: process.env });
}

function lineasFreno(r: Repo) {
  return leerRegistroPuertas(r.raiz).filter((l) => l.puerta === 'freno');
}

test('freno (TASK-111): cada ejecucion anota puerta, tarea, instante, modo, duracion y resultado', async () => {
  await conRepo(async (r) => {
    const t0 = Date.now();
    assert.equal((await decidir(r)).codigo, 0);
    let lineas = lineasFreno(r);
    assert.equal(lineas.length, 1);
    const l = lineas[0]!;
    assert.deepEqual([l.puerta, l.tarea, l.modo, l.resultado], ['freno', 'TASK-111', 'completa', 'verde']);
    assert.ok(l.duracionS >= 0);
    const instante = Date.parse(l.instante);
    assert.ok(instante >= t0 - 1000 && instante <= Date.now() + 1000, 'instante ISO del final');
    // El registro vive bajo el directorio de Git, fuera del arbol.
    assert.ok((rutaRegistroPuertas(r.raiz) as string).includes(`${path.sep}.git${path.sep}`));

    // Un rojo (tras un cambio en el arbol) bloquea y se anota como rojo.
    await r.desenlace('ko');
    await writeFile(path.join(r.raiz, 'src', 'app.ts'), 'export const a = 2;\n', 'utf8');
    assert.equal((await decidir(r)).codigo, 2);
    lineas = lineasFreno(r);
    assert.deepEqual(
      lineas.map((x) => x.resultado),
      ['verde', 'rojo']
    );
  });
});

test('freno (TASK-111): con cambios sin commitear y la selectiva, un turno sin cambios no ejecuta ni escribe nada', async () => {
  await conRepo(
    async (r) => {
      await writeFile(path.join(r.raiz, 'src', 'app.ts'), 'export const a = 3;\n', 'utf8');
      assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
      assert.equal(r.ejecuciones(), 1);
      assert.deepEqual(
        lineasFreno(r).map((l) => [l.modo, l.resultado]),
        [['selectiva', 'verde']]
      );

      // Mismo arbol (sucio): el memo compartido de la selectiva no se guarda con
      // el arbol sucio (TASK-105), pero el ultimo verde del freno si.
      rmSync(rutaProgreso(r.raiz) as string, { force: true });
      await r.desenlace('ko');
      assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' }, 'sin salida');
      assert.equal(r.ejecuciones(), 1, 'no se ejecuta');
      assert.equal(existsSync(rutaProgreso(r.raiz) as string), false, 'ni progreso');
      const lineas = lineasFreno(r);
      assert.deepEqual(
        lineas.map((l) => [l.modo, l.resultado]),
        [
          ['selectiva', 'verde'],
          ['selectiva', 'omitido'],
        ]
      );
      assert.equal(lineas[1]!.duracionS, 0);

      // Cambiar el arbol vuelve a ejecutar.
      await writeFile(path.join(r.raiz, 'src', 'app.ts'), 'export const a = 4;\n', 'utf8');
      assert.equal((await decidir(r)).codigo, 2);
      assert.equal(r.ejecuciones(), 2);
      assert.equal(lineasFreno(r).at(-1)!.resultado, 'rojo');
    },
    { selectiva: true }
  );
});

test('freno (TASK-111): tras un rojo, el mismo arbol no se da por bueno (solo omite tras un verde)', async () => {
  await conRepo(
    async (r) => {
      await r.desenlace('ko');
      await writeFile(path.join(r.raiz, 'src', 'app.ts'), 'export const a = 3;\n', 'utf8');
      assert.equal((await decidir(r)).codigo, 2);
      assert.equal((await decidir(r)).codigo, 2, 'sigue bloqueando');
      assert.equal(r.ejecuciones(), 2, 'con el arbol sucio la selectiva se reejecuta (sin memo compartido)');
      assert.deepEqual(
        lineasFreno(r).map((l) => l.resultado),
        ['rojo', 'rojo']
      );
    },
    { selectiva: true }
  );
});

test('freno (TASK-111): sin tarea en curso no hay linea', async () => {
  await conRepo(
    async (r) => {
      assert.equal((await decidir(r)).codigo, 0);
      assert.equal(r.ejecuciones(), 0);
      assert.deepEqual(lineasFreno(r), []);
    },
    { tarea: false }
  );
});
