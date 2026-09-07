/**
 * Tests de las cuatro skills revisoras del plugin (item D6): java-spring,
 * angular-vue, csharp-autocad-ifc y code-quality.
 *
 * El fichero hermano `task-workflow.test.ts` ya cubre a fondo la forma de
 * UNA skill (bytes, BOM, claves del spec, limites de longitud). Aqui no se
 * repite eso: lo que se asevera es lo que solo tiene sentido cuando hay
 * CUATRO revisores y alguien va a enrutarlos por dominio.
 *
 * Tres bloques, con motivos distintos:
 *
 * 1. ESTRUCTURALES. Que las cuatro existan y su frontmatter parsee con el
 *    parser del repo. Medido durante la integracion de TASK-032: el
 *    validador oficial NO comprueba que existan `name` ni `description`
 *    —solo que el bloque parsee—, asi que apoyarse en el para eso daria
 *    verde sobre una skill sin nombre. Se asevera aqui.
 *
 * 2. CONTRATO DE ENRUTADO. Cada skill declara sus `patrones_archivo` en un
 *    bloque yaml, y quien enrute por diff real (D3) los va a leer con el
 *    UNICO parser que hay en el repo. Ese parser lee listas en linea
 *    (`[a, b]`) y **falla en seco** ante una lista en bloque (`- item`):
 *    medido, con el error literal `Linea de undefined invalida (falta ":")`.
 *    Las cuatro llegaron a la integracion con dos formatos distintos; el
 *    test existe para que no vuelva a pasar sin que nadie se entere.
 *
 * 3. EL VEREDICTO, CONTRA EL CODIGO QUE LO LEE. La linea que cada skill
 *    prescribe se pasa por `veredictoAprobado` de finish.ts — la funcion
 *    real, no una copia de su regex. Una skill que prescriba una linea que
 *    el comando de cierre no acepta deja la tarea imposible de cerrar, y
 *    ese fallo solo se veria al final del ciclo, cuando ya no hay margen.
 *
 * 4. INTEGRACION. El validador real, con CONTRAPRUEBA: sobre una copia
 *    temporal se rompe el frontmatter de las cuatro y se comprueba que las
 *    nombra. Un "passed" silencioso es ambiguo entre "las miro y estan
 *    bien" y "nunca miro ahi"; romperlas desambigua. Se rompen las cuatro
 *    en una sola pasada a proposito: cada arranque del validador cuesta
 *    ~10s y cuatro pasadas no demuestran mas que una.
 *
 * Cero dependencias: se reutilizan `parseFrontmatter`,
 * `parseBloqueClaveValor` y `veredictoAprobado` del propio codigo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBloqueClaveValor, parseFrontmatter } from '../../src/core/frontmatter.js';
import { veredictoAprobado } from '../../src/commands/finish.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');

/** El generico va aparte: no tiene patrones, los suple. */
const REVISORES_DE_DOMINIO = [
  'java-spring-reviewer',
  'angular-vue-reviewer',
  'csharp-autocad-ifc-reviewer',
] as const;

const REVISOR_GENERICO = 'code-quality-reviewer';

const REVISORES = [...REVISORES_DE_DOMINIO, REVISOR_GENERICO] as const;

/**
 * Marcas de ESTE repo. Las cuatro skills se instalan en proyectos que no
 * son este: una ruta o un nombre de documento interno que se cuele no es
 * una errata, es una instruccion que el agente de otro equipo no puede
 * seguir. Se busca en el fichero ENTERO, frontmatter incluido.
 */
const MARCAS_DEL_REPO = [
  'taskcode',
  'tareas/',
  'docs/contexto',
  'propuesta_metodologia',
  'checklist_terminacion',
  'plan-final.md',
  'task-0',
  'ieca',
  'movetareafile',
  'printclierror',
];

/** Rutas de maquina, mismo criterio que en task-workflow.test.ts. */
const RUTAS_DE_MAQUINA = ['C:\\Users\\', '/Users/', '/home/', '~/'];

function rutaSkill(nombre: string): string {
  return path.join(SKILLS_DIR, nombre, 'SKILL.md');
}

async function leer(nombre: string): Promise<string> {
  return readFile(rutaSkill(nombre), 'utf8');
}

/**
 * Extrae el primer bloque ```yaml del cuerpo y lo parsea con el parser del
 * repo. Devuelve tambien las lineas crudas: el parser aplana lo que puede,
 * asi que aseverar solo sobre su salida dejaria pasar formas que Claude
 * Code interpretaria de otra manera.
 */
function bloqueYaml(texto: string): { data: Record<string, unknown>; lineas: string[] } {
  const lineas = texto.split('\n');
  const ini = lineas.findIndex((l) => l.trim() === '```yaml');
  assert.notEqual(ini, -1, 'no hay ningun bloque ```yaml en la skill');
  const fin = lineas.findIndex((l, i) => i > ini && l.trim() === '```');
  assert.notEqual(fin, -1, 'el bloque ```yaml no se cierra');
  const cuerpo = lineas.slice(ini + 1, fin);
  const { data } = parseBloqueClaveValor(cuerpo, 0, {
    etiqueta: 'skill',
    permitirComentariosDeLinea: true,
    crearError: (msg: string) => new Error(msg),
  });
  return { data, lineas: cuerpo };
}

// Guard de no-vacuidad: si PLUGIN_ROOT apuntase a otro sitio, media docena
// de tests de abajo pasarian sin comprobar nada real.
test('el test apunta de verdad a la raiz del plugin (guard de no-vacuidad)', async () => {
  const pkg = JSON.parse(await readFile(path.join(PLUGIN_ROOT, 'package.json'), 'utf8')) as {
    name?: unknown;
  };
  assert.equal(pkg.name, 'taskcode-plugin', `PLUGIN_ROOT resuelto a "${PLUGIN_ROOT}"`);
});

// --- 1. Estructurales ---------------------------------------------------

test('1. las cuatro skills revisoras existen con su nombre exacto', async () => {
  // En Windows el filesystem es case-insensitive, asi que un stat() no
  // demuestra el case: se comprueba contra el listado del directorio.
  const enSkills = await readdir(SKILLS_DIR);
  for (const nombre of REVISORES) {
    assert.ok(enSkills.includes(nombre), `falta el directorio skills/${nombre}/`);
    const dentro = await readdir(path.join(SKILLS_DIR, nombre));
    assert.ok(dentro.includes('SKILL.md'), `skills/${nombre}/ no tiene SKILL.md con ese case`);
  }
});

test('2. el frontmatter parsea y declara name y description (el validador NO comprueba esto)', async () => {
  for (const nombre of REVISORES) {
    const { data } = parseFrontmatter(await leer(nombre));

    assert.equal(
      data['name'],
      nombre,
      `el name de ${nombre} no coincide con su directorio: ${String(data['name'])}`
    );

    const description = data['description'];
    assert.equal(typeof description, 'string', `${nombre}: description ausente o no es texto`);
    assert.ok((description as string).length > 40, `${nombre}: description demasiado corta`);
    assert.ok(
      !(description as string).includes('<') && !(description as string).includes('>'),
      `${nombre}: la description no admite < ni >`
    );
  }
});

test('3. el frontmatter solo lleva las claves del spec portable', async () => {
  const permitidas = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
  for (const nombre of REVISORES) {
    const { data } = parseFrontmatter(await leer(nombre));
    for (const clave of Object.keys(data)) {
      assert.ok(permitidas.has(clave), `${nombre}: clave "${clave}" fuera del spec portable`);
    }
  }
});

// --- 2. Contrato de enrutado -------------------------------------------

test('4. patrones_archivo es legible por el UNICO parser que hay en el repo', async () => {
  for (const nombre of REVISORES) {
    // Si alguien vuelve a la lista en bloque, esto lanza aqui — que es
    // exactamente lo que le pasaria a quien enrute por diff real.
    const { data, lineas } = bloqueYaml(await leer(nombre));

    assert.equal(data['rol'], 'revisor', `${nombre}: el bloque no declara rol: revisor`);
    assert.ok(
      Array.isArray(data['patrones_archivo']),
      `${nombre}: patrones_archivo no es una lista tras parsear`
    );

    // El parser lee listas en linea. Una lista en bloque ("- item") no es
    // solo otro estilo: revienta el parseo.
    for (const linea of lineas) {
      assert.ok(
        !/^\s*-\s/.test(linea),
        `${nombre}: lista en bloque en el yaml ("${linea.trim()}"); usa [a, b] en una linea`
      );
    }
  }
});

test('5. los revisores de dominio traen patrones; el generico declara que no los tiene', async () => {
  for (const nombre of REVISORES_DE_DOMINIO) {
    const { data } = bloqueYaml(await leer(nombre));
    const patrones = data['patrones_archivo'] as string[];
    assert.ok(patrones.length > 0, `${nombre}: sin patrones no se le puede enrutar nada`);
    for (const patron of patrones) {
      assert.ok(
        patron.includes('*') || patron.includes('/'),
        `${nombre}: "${patron}" no parece un patron de fichero`
      );
    }
  }

  const { data } = bloqueYaml(await leer(REVISOR_GENERICO));
  const patrones = data['patrones_archivo'] as string[];
  assert.equal(patrones.length, 0, 'el revisor generico no debe competir por patron');
  assert.equal(data['fallback'], true, 'el revisor generico debe declararse como fallback');
  assert.equal(
    data['umbral_dominios'],
    3,
    'el umbral de dominios es 3 (decision #16); cambiarlo aqui sin decidirlo es un error'
  );
});

test('6. ningun revisor de dominio se solapa con otro en un patron identico', async () => {
  const vistos = new Map<string, string>();
  for (const nombre of REVISORES_DE_DOMINIO) {
    const { data } = bloqueYaml(await leer(nombre));
    for (const patron of data['patrones_archivo'] as string[]) {
      const duenyo = vistos.get(patron);
      assert.equal(
        duenyo,
        undefined,
        `el patron "${patron}" lo declaran ${String(duenyo)} y ${nombre}: el enrutado seria ambiguo`
      );
      vistos.set(patron, nombre);
    }
  }
});

// --- 3. El veredicto, contra el codigo que lo lee -----------------------

test('7. la linea de veredicto que cada skill prescribe la ACEPTA finish.ts', async () => {
  for (const nombre of REVISORES) {
    const texto = await leer(nombre);

    // Se buscan las lineas de ejemplo que la skill da como aprobatorias.
    const aprobatorias = texto
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^-\s*veredicto:\s*aprobada/i.test(l));

    assert.ok(
      aprobatorias.length > 0,
      `${nombre}: no prescribe ninguna linea "- Veredicto: aprobada..."`
    );

    for (const linea of aprobatorias) {
      assert.ok(
        veredictoAprobado(linea),
        `${nombre}: prescribe "${linea}", que finish.ts NO acepta — la tarea no se podria cerrar`
      );
    }
  }
});

test('8. cada skill prescribe tambien la forma de NO aprobar, y finish.ts la rechaza', async () => {
  for (const nombre of REVISORES) {
    const texto = await leer(nombre);
    assert.ok(
      texto.includes('cambios-solicitados'),
      `${nombre}: no dice como pedir cambios; sin eso solo sabe aprobar`
    );
    assert.equal(
      veredictoAprobado('- Veredicto: cambios-solicitados'),
      false,
      'regresion en finish.ts: la forma de pedir cambios estaria aprobando'
    );
  }
});

test('9. las tres severidades estan definidas en las cuatro', async () => {
  for (const nombre of REVISORES) {
    const texto = (await leer(nombre)).toUpperCase();
    for (const severidad of ['CRITICO', 'IMPORTANTE', 'MENOR']) {
      assert.ok(texto.includes(severidad), `${nombre}: no define la severidad ${severidad}`);
    }
  }
});

test('10. las cuatro exigen reproducir empiricamente, no leer el diff y opinar', async () => {
  for (const nombre of REVISORES) {
    const texto = (await leer(nombre)).toLowerCase();
    assert.ok(
      texto.includes('reproduc'),
      `${nombre}: no exige reproducir; una revision que solo lee el diff no es una revision`
    );
  }
});

// --- 4. Portabilidad ----------------------------------------------------

test('11. ninguna skill arrastra marcas de este repo ni rutas de maquina', async () => {
  for (const nombre of REVISORES) {
    const texto = await leer(nombre);
    const enMinusculas = texto.toLowerCase();

    for (const marca of MARCAS_DEL_REPO) {
      assert.ok(
        !enMinusculas.includes(marca),
        `${nombre}: contiene la marca "${marca}", que no significa nada en otro proyecto`
      );
    }

    for (const ruta of RUTAS_DE_MAQUINA) {
      assert.ok(!texto.includes(ruta), `${nombre}: contiene la ruta de maquina "${ruta}"`);
    }
  }
});

// --- 5. Integracion con el validador real ------------------------------

interface ResultadoValidate {
  status: number | null;
  salida: string;
}

function claudeDisponible(): boolean {
  try {
    return spawnSync('claude', ['--version'], { encoding: 'utf8' }).status === 0;
  } catch {
    return false;
  }
}

function validar(ruta: string): ResultadoValidate {
  const r = spawnSync('claude', ['plugin', 'validate', ruta], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

// Skip explicito: en el CI de Linux `claude` no esta instalado. Los tests
// estructurales de arriba son la red que si corre siempre.
const SKIP_INTEGRACION: string | false = claudeDisponible()
  ? false
  : 'claude no esta en el PATH: la integracion se salta (los estructurales cubren la forma)';

test(
  '12. CONTRAPRUEBA: rotas las cuatro, el validador las nombra a las cuatro',
  { skip: SKIP_INTEGRACION },
  async () => {
    const tmp = await mkdtemp(path.join(tmpdir(), 'revisores-'));
    try {
      const copia = path.join(tmp, 'plugin');
      await cp(path.join(PLUGIN_ROOT, '.claude-plugin'), path.join(copia, '.claude-plugin'), {
        recursive: true,
      });
      for (const nombre of REVISORES) {
        await cp(path.join(SKILLS_DIR, nombre), path.join(copia, 'skills', nombre), {
          recursive: true,
        });
      }

      // Control: la copia intacta valida.
      const sano = validar(copia);
      assert.equal(sano.status, 0, `la copia intacta no valida:\n${sano.salida}`);

      // Se rompe el YAML (comilla sin cerrar). Medido en TASK-032: un
      // frontmatter que no PARSEA da error; uno ausente solo da warning
      // con exit 0. Por eso se asevera sobre el NOMBRE del fichero en la
      // salida, no sobre el codigo de salida.
      for (const nombre of REVISORES) {
        const destino = path.join(copia, 'skills', nombre, 'SKILL.md');
        const original = await readFile(destino, 'utf8');
        const roto = original.replace(/^description: /m, 'description: "sin cerrar\n');
        assert.notEqual(roto, original, `${nombre}: no se pudo romper la description`);
        await writeFile(destino, roto, 'utf8');
      }

      const { salida } = validar(copia);
      for (const nombre of REVISORES) {
        assert.ok(
          salida.includes(nombre),
          `el validador no nombra a ${nombre} con el frontmatter roto: no mira esa ruta\n${salida}`
        );
      }
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  }
);

test(
  '13. el plugin entero, con las cuatro skills dentro, sigue validando',
  { skip: SKIP_INTEGRACION },
  () => {
    const { status, salida } = validar(PLUGIN_ROOT);
    assert.equal(status, 0, `el plugin no valida:\n${salida}`);
    assert.ok(!salida.includes('✘'), `el validador reporta errores:\n${salida}`);
  }
);
