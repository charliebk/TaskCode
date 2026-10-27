/**
 * TASK-067: `taskctl doctor-deploy --resultado <json>` contra repos Git
 * temporales reales. Cada rechazo es un camino a un OK inventado que no puede
 * abrirse: el punto tiene que quedar NO VERIFICADO y el motivo tiene que salir.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DoctorDeployCommandError } from '../../src/commands/doctor-deploy.js';
import type { InformeDeploy } from '../../src/core/doctor-deploy.js';
import { MAX_MOTIVO } from '../../src/core/doctor-deploy-veredictos.js';
import { NODE, STRIPE, commit, conRepo, ejecutar, escribir, git, punto, type OpcionesTest } from '../helpers/deploy-fixtures.js';

const PUNTO = 'auth-en-servidor'; // juicio, critica, aplica a node

/** Escribe el JSON del agente FUERA del repo y devuelve su ruta. */
async function resultado(contenido: unknown): Promise<{ ruta: string; borrar: () => Promise<void> }> {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-res-'));
  const ruta = path.join(dir, 'resultado.json');
  await writeFile(ruta, typeof contenido === 'string' ? contenido : JSON.stringify(contenido), 'utf8');
  return { ruta, borrar: () => rm(dir, { recursive: true, force: true }) };
}

async function conResultado(
  raiz: string,
  opciones: OpcionesTest,
  contenido: unknown,
  extra: string[] = []
): Promise<InformeDeploy> {
  const r = await resultado(contenido);
  try {
    return JSON.parse(ejecutar(raiz, opciones, ['--json', '--resultado', r.ruta, ...extra]).salida) as InformeDeploy;
  } finally {
    await r.borrar();
  }
}

const veredicto = (head: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  punto: PUNTO,
  estado: 'ok',
  commit: head,
  fichero: 'index.js',
  linea: 1,
  motivo: 'La ruta valida la sesion en el servidor antes de responder',
  ...extra,
});

/** El punto sigue como NO VERIFICADO de juicio y el rechazo sale en los avisos con su motivo. */
function assertRechazado(informe: InformeDeploy, motivo: RegExp, id = PUNTO): void {
  const p = punto(informe, id);
  assert.equal(p.estado === 'ok' || p.estado === 'falla', false, `el punto ${id} no deberia tener veredicto: ${p.estado}`);
  assert.equal(p.origen, 'sonda');
  assert.ok(informe.veredictos !== null);
  assert.equal(informe.veredictos.aceptados, 0);
  const x = informe.veredictos.rechazados.find((r) => motivo.test(r.motivo));
  assert.ok(x !== undefined, `ningun rechazo con ${String(motivo)}: ${JSON.stringify(informe.veredictos.rechazados)}`);
  assert.ok(informe.avisos.some((a) => a.startsWith('veredicto rechazado') && motivo.test(a)));
}

test('veredicto valido OK: el punto pasa a OK con origen agente y evidencia fichero:linea; los demas no cambian', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const sin = ejecutar(raiz, opciones).informe;
    assert.equal(punto(sin, PUNTO).estado, 'no-verificado');
    const informe = await conResultado(raiz, opciones, { veredictos: [veredicto(head)] });
    const p = punto(informe, PUNTO);
    assert.equal(p.estado, 'ok');
    assert.equal(p.origen, 'agente');
    assert.equal(p.evidencias.length, 1);
    assert.equal(p.evidencias[0]?.fichero, 'index.js');
    assert.equal(p.evidencias[0]?.linea, 1);
    assert.deepEqual(informe.veredictos, { aceptados: 1, rechazados: [] });
    // Nada mas cambia: mismos estados en el resto.
    for (const q of informe.puntos.filter((x) => x.id !== PUNTO)) {
      assert.equal(q.estado, punto(sin, q.id).estado, q.id);
      assert.equal(q.origen, 'sonda');
    }
  });
});

test('veredicto FALLA valido: el punto falla, el codigo de salida es 1 y el arreglo es el del catalogo', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const r = await resultado({ commit: head, veredictos: [{ punto: PUNTO, estado: 'falla', fichero: 'index.js', linea: 1, motivo: 'La ruta no comprueba la sesion' }] });
    try {
      const res = ejecutar(raiz, opciones, ['--json', '--resultado', r.ruta]);
      const p = punto(JSON.parse(res.salida) as InformeDeploy, PUNTO);
      assert.equal(p.estado, 'falla');
      assert.equal(p.origen, 'agente');
      assert.equal(res.codigo, 1);
      assert.ok(p.arreglo.length > 0);
    } finally {
      await r.borrar();
    }
  });
});

test('el commit de la raiz vale para los veredictos sin commit propio; con un prefijo de 7+ caracteres tambien', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const { commit: _quitado, ...sinCommit } = veredicto(head);
    void _quitado;
    const informe = await conResultado(raiz, opciones, { commit: head.slice(0, 9), veredictos: [sinCommit] });
    assert.equal(punto(informe, PUNTO).estado, 'ok');
  });
});

test('veredicto de otro commit: rechazado diciendo ambos commits, el punto queda NO VERIFICADO', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const viejo = git(['rev-parse', 'HEAD'], raiz);
    await escribir(raiz, { 'index.js': 'console.log("cambiado");\n' });
    const nuevo = await commit(raiz, 'cambia');
    const informe = await conResultado(raiz, opciones, { veredictos: [veredicto(viejo)] });
    assertRechazado(informe, new RegExp(`${viejo.slice(0, 12)}.*${nuevo.slice(0, 12)}`));
    assert.equal(punto(informe, PUNTO).estado, 'no-verificado');
    // Y sin commit en absoluto, tambien.
    const { commit: _c, ...sinCommit } = veredicto(nuevo);
    void _c;
    assertRechazado(await conResultado(raiz, opciones, { veredictos: [sinCommit] }), /falta el commit/);
    // Un commit mal formado o demasiado corto no es un prefijo valido.
    assertRechazado(await conResultado(raiz, opciones, { veredictos: [veredicto('abc')] }), /falta el commit/);
  });
});

test('veredicto sobre un punto determinista: rechazado, la sonda manda (ni un OK ni un FALLA lo pisan)', async () => {
  await conRepo({ ...NODE, 'src/c.js': `k="${STRIPE}"\n` }, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const informe = await conResultado(raiz, opciones, {
      veredictos: [veredicto(head, { punto: 'secretos-en-arbol', fichero: 'index.js', linea: 1 })],
    });
    const p = punto(informe, 'secretos-en-arbol');
    assert.equal(p.estado, 'falla', 'la clave plantada sigue siendo FALLA');
    assert.equal(p.origen, 'sonda');
    assert.match(informe.veredictos?.rechazados[0]?.motivo ?? '', /determinista/);
  });
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const informe = await conResultado(raiz, opciones, { veredictos: [veredicto(head, { punto: 'gitignore-cubre-env' })] });
    assert.match(informe.veredictos?.rechazados[0]?.motivo ?? '', /determinista/);
    assert.equal(punto(informe, 'gitignore-cubre-env').origen, 'sonda');
  });
});

test('veredicto sobre un punto que no aplica o esta desactivado: rechazado', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    // Solo aplica a docker y el proyecto es node.
    const informe = await conResultado(raiz, opciones, { veredictos: [veredicto(head, { punto: 'dockerfile-sin-user' })] });
    assertRechazado(informe, /no aplica a este proyecto/, 'dockerfile-sin-user');
    assert.equal(punto(informe, 'dockerfile-sin-user').estado, 'no-aplica');
  });
  await conRepo(NODE, async (raiz, opciones) => {
    await escribir(raiz, { '.taskcode/doctor-deploy.yml': `desactivar_1_id: ${PUNTO}\ndesactivar_1_motivo: lo cubre el gateway\n` });
    const head = git(['rev-parse', 'HEAD'], raiz);
    const informe = await conResultado(raiz, opciones, { veredictos: [veredicto(head)] });
    assert.equal(punto(informe, PUNTO).estado, 'no-aplica');
    assert.equal(informe.veredictos?.aceptados, 0);
  });
});

test('punto desconocido, o sin id: rechazado con su motivo', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const informe = await conResultado(raiz, opciones, {
      veredictos: [veredicto(head, { punto: 'punto-que-no-existe' }), veredicto(head, { punto: '' })],
    });
    const motivos = informe.veredictos?.rechazados.map((r) => `${r.punto}: ${r.motivo}`) ?? [];
    assert.ok(motivos.some((m) => /^punto-que-no-existe: punto desconocido/.test(m)), motivos.join(' | '));
    assert.ok(motivos.some((m) => /falta "punto"/.test(m)), motivos.join(' | '));
    assert.equal(informe.veredictos?.aceptados, 0);
  });
});

test('OK o FALLA sin evidencia (sin fichero, sin linea): rechazado; NO VERIFICADO sin evidencia si se acepta', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    for (const extra of [{ fichero: undefined }, { linea: undefined }, { fichero: undefined, linea: undefined }]) {
      for (const estado of ['ok', 'falla']) {
        assertRechazado(await conResultado(raiz, opciones, { veredictos: [veredicto(head, { estado, ...extra })] }), /exige evidencia/);
      }
    }
    const nv = await conResultado(raiz, opciones, { veredictos: [veredicto(head, { estado: 'no-verificado', fichero: undefined, linea: undefined, motivo: 'no encontre el servidor' })] });
    const p = punto(nv, PUNTO);
    assert.equal(p.estado, 'no-verificado');
    assert.match(p.motivo, /no encontre el servidor/);
    assert.equal(nv.veredictos?.aceptados, 1);
  });
});

test('ruta de la evidencia con .., absoluta o con caracteres de control: rechazada', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const casos: Array<[string, RegExp]> = [
      ['../fuera.js', /sale de la raiz/],
      ['src/../../fuera.js', /sale de la raiz/],
      ['..\\fuera.js', /sale de la raiz/],
      ['/etc/passwd', /absoluta/],
      ['\\\\servidor\\share\\x.js', /absoluta/],
      ['C:\\Windows\\win.ini', /absoluta/],
      ['C:/Windows/win.ini', /absoluta/],
      ['index.js\nsegunda linea', /control/],
    ];
    for (const [fichero, motivo] of casos) {
      assertRechazado(await conResultado(raiz, opciones, { veredictos: [veredicto(head, { fichero })] }), motivo);
    }
  });
});

test('linea inexistente, cero, negativa o no entera: rechazada; la ultima linea real si vale', async () => {
  await conRepo({ ...NODE, 'src/dos.js': 'uno\ndos\n' }, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    assertRechazado(await conResultado(raiz, opciones, { veredictos: [veredicto(head, { fichero: 'src/dos.js', linea: 3 })] }), /tiene 2 linea\(s\) y el veredicto cita la 3/);
    for (const linea of [0, -1, 1.5, '2', null]) {
      assertRechazado(await conResultado(raiz, opciones, { veredictos: [veredicto(head, { fichero: 'src/dos.js', linea })] }), /linea|evidencia/);
    }
    const ok = await conResultado(raiz, opciones, { veredictos: [veredicto(head, { fichero: 'src/dos.js', linea: 2 })] });
    assert.equal(punto(ok, PUNTO).estado, 'ok');
  });
});

test('fichero no versionado (existe en disco pero no en el commit), carpeta o inexistente: rechazado', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    await escribir(raiz, { 'sin-versionar.js': 'a\nb\nc\n', 'carpeta/x.js': 'x\n' });
    for (const fichero of ['sin-versionar.js', 'no-existe.js', 'carpeta']) {
      assertRechazado(await conResultado(raiz, opciones, { veredictos: [veredicto(head, { fichero })] }), /no es un fichero versionado/);
    }
    // Versionado en el commit pero borrado del arbol de trabajo: se juzga el commit, vale.
    await rm(path.join(raiz, 'index.js'));
    assert.equal(punto(await conResultado(raiz, opciones, { veredictos: [veredicto(head)] }), PUNTO).estado, 'ok');
  });
});

test('fichero binario versionado: rechazado', async () => {
  await conRepo({ ...NODE }, async (raiz, opciones) => {
    await writeFile(path.join(raiz, 'logo.bin'), Buffer.from([1, 2, 0, 3, 10, 4]));
    const head = await commit(raiz, 'binario');
    assertRechazado(await conResultado(raiz, opciones, { veredictos: [veredicto(head, { fichero: 'logo.bin' })] }), /binario/);
  });
});

test('un secreto en el motivo no sale por ningun canal (salida, avisos, JSON ni informe en disco)', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const url = 'postgres://admin:Hunter2passXYZ@db.prod.acme.io/app';
    const r = await resultado({ veredictos: [veredicto(head, { commit: head, motivo: `Usa la clave ${STRIPE} y ${url} en la ruta` }), veredicto(head, { punto: 'rls-activo', fichero: 'no-existe.js', motivo: `con ${STRIPE}` })] });
    try {
      const res = ejecutar(raiz, opciones, ['--json', '--escribir', '--resultado', r.ruta]);
      const md = await readFile(res.rutaInforme as string, 'utf8');
      const js = await readFile(res.rutaJson as string, 'utf8');
      for (const [canal, texto] of [['stdout', res.salida], ['md', md], ['json', js], ['mensaje', res.mensajeEscritura]] as const) {
        for (const secreto of [STRIPE, 'Hunter2passXYZ']) {
          for (let i = 0; i + 8 <= secreto.length; i++) {
            assert.ok(!texto.includes(secreto.slice(i, i + 8)), `${canal} contiene un trozo de un secreto: ${secreto.slice(i, i + 8)}`);
          }
        }
      }
      assert.equal(punto(res.informe, PUNTO).estado, 'ok', 'el veredicto con secreto en el motivo se acepta, enmascarado');
      // Tambien en los datos, antes de la segunda red de la salida: lo que se guarda ya viene limpio.
      const datos = JSON.stringify(res.informe);
      for (const secreto of [STRIPE, 'Hunter2passXYZ']) {
        for (let i = 0; i + 8 <= secreto.length; i++) assert.ok(!datos.includes(secreto.slice(i, i + 8)), `el informe en memoria contiene ${secreto.slice(i, i + 8)}`);
      }
    } finally {
      await r.borrar();
    }
  });
});

test('el motivo se acota a la longitud maxima, sin saltos de linea', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const informe = await conResultado(raiz, opciones, { veredictos: [veredicto(head, { motivo: `linea uno\n\nlinea dos ${'x'.repeat(2000)}` })] });
    const m = punto(informe, PUNTO).motivo;
    assert.equal(m.length, MAX_MOTIVO);
    assert.ok(m.endsWith('...'));
    assert.ok(!/\n/.test(m));
  });
});

test('un campo que no es del formato (un fragmento de codigo, por ejemplo) rechaza el veredicto', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    for (const campo of ['fragmento', 'codigo', 'snippet', 'evidencia']) {
      assertRechazado(await conResultado(raiz, opciones, { veredictos: [veredicto(head, { [campo]: 'if (!user) return;' })] }), /no admitido/);
    }
  });
});

test('dos veredictos para el mismo punto (aunque sean iguales): se rechazan los dos', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const informe = await conResultado(raiz, opciones, { veredictos: [veredicto(head), veredicto(head, { estado: 'falla' })] });
    assert.equal(punto(informe, PUNTO).estado, 'no-verificado');
    assert.equal(informe.veredictos?.rechazados.length, 2);
    assert.match(informe.veredictos?.rechazados[0]?.motivo ?? '', /mas de un veredicto/);
  });
});

test('un veredicto malo no impide aceptar los buenos', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const informe = await conResultado(raiz, opciones, {
      veredictos: [veredicto(head, { punto: 'cifrado-en-reposo', fichero: '../x' }), veredicto(head), veredicto(head, { punto: 'rls-activo', estado: 'falla', motivo: 'tablas sin politicas' })],
    });
    assert.equal(punto(informe, PUNTO).estado, 'ok');
    assert.equal(punto(informe, 'cifrado-en-reposo').estado, 'no-verificado');
    assert.equal(punto(informe, 'rls-activo').estado, 'falla', 'FALLA sin evidencia no, pero este traia fichero y linea de veredicto()');
    assert.equal(informe.veredictos?.aceptados, 2);
    assert.equal(informe.veredictos?.rechazados.length, 1);
  });
});

test('errores del propio fichero: no existe, no es JSON, forma equivocada, demasiados veredictos, sin valor', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    assert.throws(() => ejecutar(raiz, opciones, ['--json', '--resultado', path.join(tmpdir(), 'taskctl-no-existe.json')]), (e: unknown) => e instanceof DoctorDeployCommandError && /no se pudo leer --resultado/.test(e.message));
    for (const [contenido, motivo] of [
      ['esto no es json', /no es JSON valido/],
      ['[]', /debe ser un objeto/],
      ['{"commit":"abc"}', /lista "veredictos"/],
      [JSON.stringify({ veredictos: new Array(201).fill({}) }), /demasiados/],
    ] as const) {
      const r = await resultado(contenido);
      try {
        assert.throws(() => ejecutar(raiz, opciones, ['--json', '--resultado', r.ruta]), (e: unknown) => e instanceof DoctorDeployCommandError && motivo.test(e.message), contenido.slice(0, 30));
      } finally {
        await r.borrar();
      }
    }
    assert.throws(() => ejecutar(raiz, opciones, ['--resultado']), /necesita la ruta/);
    assert.throws(() => ejecutar(raiz, opciones, ['--resultado', '--json']), /necesita la ruta/);
    assert.throws(() => ejecutar(raiz, opciones, ['--resultado=']), /necesita la ruta/);
  });
});

test('--resultado=<ruta> (con igual) funciona igual, y un fichero dentro del repo avisa de que ensucia', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    await writeFile(path.join(raiz, 'res.json'), JSON.stringify({ veredictos: [veredicto(head)] }), 'utf8');
    const informe = JSON.parse(ejecutar(raiz, opciones, ['--json', `--resultado=${path.join(raiz, 'res.json')}`]).salida) as InformeDeploy;
    assert.equal(punto(informe, PUNTO).estado, 'ok');
    assert.ok(informe.avisos.some((a) => /dentro del repositorio.*res\.json/.test(a)), informe.avisos.join(' | '));
    assert.equal(informe.arbolSucio, true);
  });
});

test('--escribir con --resultado: el informe en .md y .json lleva los veredictos y el origen agente', async () => {
  await conRepo(NODE, async (raiz, opciones) => {
    const head = git(['rev-parse', 'HEAD'], raiz);
    const r = await resultado({ veredictos: [veredicto(head), veredicto(head, { punto: 'rls-activo', fichero: '../mal' })] });
    try {
      const res = ejecutar(raiz, opciones, ['--escribir', '--resultado', r.ruta], new Date(2026, 9, 27, 12));
      const md = await readFile(res.rutaInforme as string, 'utf8');
      assert.match(md, /Veredictos del agente: 1 aceptado\(s\), 1 rechazado\(s\)/);
      assert.match(md, /\| auth-en-servidor \| critica \| juicio \| agente \| OK \|/);
      assert.match(md, /Rechazado \(rls-activo\)/);
      const j = JSON.parse(await readFile(res.rutaJson as string, 'utf8')) as InformeDeploy;
      assert.equal(j.version, 2);
      assert.equal(j.veredictos?.aceptados, 1);
      assert.equal(punto(j, PUNTO).origen, 'agente');
      assert.match(res.salida, /Veredictos del agente: 1 aceptado\(s\), 1 rechazado\(s\)/);
      assert.match(res.salida, /\[RECHAZADO\] rls-activo/);
    } finally {
      await r.borrar();
    }
  });
});
