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
import { informeTemplate } from '../../src/commands/review.js';
import type { Task } from '../../src/core/task.js';

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
 *
 * La lista tenia huecos (ronda 1, hallazgo 18): "Ver docs/PLAN_SPRINTS.md" o
 * "usa veredictoAprobado() de src/commands/finish.ts" se colaban enteros.
 * Se anaden el documento de plan y los nombres de simbolo que estas skills
 * rozan de cerca, porque describen justo el codigo que las lee. Nota: los
 * comandos `taskctl ...` SI pueden nombrarse — viajan con el plugin.
 */
const MARCAS_DEL_REPO = [
  'taskcode',
  'tareas/',
  'docs/contexto',
  'propuesta_metodologia',
  'checklist_terminacion',
  'plan_sprints',
  'plan-final.md',
  'task-0',
  'ieca',
  'movetareafile',
  'printclierror',
  'veredictoaprobado',
  'informetemplate',
  'src/commands/',
  'src/core/',
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

/**
 * Como se DEFINE una severidad, frente a como se la menciona de pasada.
 *
 * La version anterior de este test buscaba la palabra suelta
 * (`texto.toUpperCase().includes('MENOR')`) y no discriminaba: la prosa
 * "aprobada con correcciones menores" de la tabla de veredictos ya la
 * satisfacia, de modo que se podia borrar la severidad MENOR entera de una
 * skill y la suite seguia verde (reproducido en la ronda 1, hallazgo 17).
 * El mismo agujero estaba abierto para IMPORTANTE ("no es una revision
 * importante...") y para CRITICO.
 *
 * Se asevera sobre la FORMA de la definicion: la severidad en negrita, al
 * principio de linea, seguida de un guion o una raya que introduce el
 * criterio. Es la forma que usan las cuatro y la unica que un lector
 * interpreta como "aqui se define que es esto".
 */
const DEFINICION_DE_SEVERIDAD: ReadonlyArray<readonly [string, RegExp]> = [
  ['CRITICO', /^\*\*CRITICO\*\*\s*[—-]/m],
  ['IMPORTANTE', /^\*\*IMPORTANTE\*\*\s*[—-]/m],
  ['MENOR', /^\*\*MENOR\*\*\s*[—-]/m],
];

test('9. las tres severidades estan DEFINIDAS (no solo mencionadas) en las cuatro', async () => {
  for (const nombre of REVISORES) {
    const texto = await leer(nombre);
    for (const [severidad, definicion] of DEFINICION_DE_SEVERIDAD) {
      assert.ok(
        definicion.test(texto),
        `${nombre}: no DEFINE la severidad ${severidad} (se espera una linea "**${severidad}** — ...");` +
          ' mencionarla en prosa no cuenta'
      );
    }
  }
});

/**
 * Contraprueba del test 9, en el propio test: se comprueba que la asercion
 * nueva rechaza justo lo que la vieja aceptaba. Sin esto, "el 9 esta verde"
 * no distingue entre "discrimina" y "vuelve a mirar la palabra suelta".
 */
test('9b. la definicion de severidad NO la satisface una mencion en prosa', () => {
  const soloProsa = [
    '| `- Veredicto: aprobada con correcciones menores` | aprueba |',
    'No es una revision importante si solo se lee el diff.',
    'Un fallo critico se reporta con reproduccion.',
    '- **MENOR** dentro de una lista, no al principio de linea',
    '**MENOR**: con dos puntos en vez de raya',
  ].join('\n');
  for (const [severidad, definicion] of DEFINICION_DE_SEVERIDAD) {
    assert.equal(
      definicion.test(soloProsa),
      false,
      `la definicion de ${severidad} da por buena una mencion en prosa: no discrimina`
    );
  }
  // Y al reves: la forma real si la acepta, para que el test no este verde
  // simplemente porque el patron no case con nada nunca.
  const formaReal = '**CRITICO** — perdida de datos\n**IMPORTANTE** - caso real\n**MENOR** — el resto';
  for (const [severidad, definicion] of DEFINICION_DE_SEVERIDAD) {
    assert.ok(definicion.test(formaReal), `la definicion de ${severidad} no acepta la forma real`);
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

// --- 3bis. La estructura del informe, contra el esqueleto que genera el CLI ---

/**
 * Las cuatro skills prescriben una estructura de informe. `taskctl review`
 * genera el esqueleto de verdad. En la ronda 1 (hallazgo 16) esas dos cosas
 * no coincidian: dos skills reproducian el esqueleto y las otras dos
 * inventaban otro titulo, PERDIAN la linea `- Commit revisado:` y movian el
 * veredicto a una seccion al final. Consecuencia real: quien anadiera el
 * veredicto al final sin borrar el de la cabecera dejaba DOS lineas de
 * veredicto, y `taskctl finish` exige que aprueben todas.
 *
 * En vez de copiar aqui las cadenas del esqueleto —que es como se llego a
 * la divergencia— se importa `informeTemplate` y se derivan de su salida.
 * Si el CLI cambia el titulo o los campos de la cabecera, este test se pone
 * rojo y obliga a mirar las skills.
 *
 * Limitacion asumida: `informeTemplate` pide un `Task` completo pero solo
 * lee `task.id`, asi que se le pasa un objeto minimo con un cast. Si algun
 * dia leyera mas campos, el cast fallaria en ejecucion, no en compilacion.
 */
const ID_MUESTRA = 'TASK-999';
const RONDA_MUESTRA = 7;
const ESQUELETO = informeTemplate(
  { id: ID_MUESTRA } as unknown as Task,
  'deadbee',
  RONDA_MUESTRA
).split('\n');

/** '# Informe de revision — ', ' (ronda ', ')' — derivados, no copiados. */
const [TITULO_ANTES = '', TITULO_RESTO = ''] = (ESQUELETO[0] ?? '').split(ID_MUESTRA);
const [TITULO_ENTRE = '', TITULO_DESPUES = ''] = TITULO_RESTO.split(String(RONDA_MUESTRA));

/** '- Commit revisado:', '- Revisor:', '- Veredicto:' — idem. */
const CAMPOS_CABECERA = ESQUELETO.filter((l) => l.startsWith('- ') && l.includes(':')).map((l) =>
  l.slice(0, l.indexOf(':') + 1)
);

/** '## Hallazgos' — idem. */
const SECCION_HALLAZGOS = ESQUELETO.find((l) => l.startsWith('## ')) ?? '';

const CAMPO_VEREDICTO = CAMPOS_CABECERA.find((c) => /veredicto/i.test(c)) ?? '';

/** El bloque cercado que contiene el esqueleto del informe, sin las cercas. */
function bloqueInforme(nombre: string, texto: string): string[] {
  // Split tolerante a CRLF: estos ficheros se editan en Windows y un '\r'
  // final romperia cualquier endsWith() sin decir por que.
  const lineas = texto.split(/\r?\n/);
  for (let i = 0; i < lineas.length; i++) {
    if (!/^```/.test(lineas[i] ?? '')) continue;
    const fin = lineas.findIndex((l, j) => j > i && l.trim() === '```');
    if (fin === -1) break;
    const cuerpo = lineas.slice(i + 1, fin);
    if (cuerpo.some((l) => l.startsWith(TITULO_ANTES))) return cuerpo;
    i = fin;
  }
  assert.fail(`${nombre}: no hay ningun bloque con el esqueleto del informe`);
}

test('10b. el esqueleto derivado del CLI trae lo que este test da por supuesto', () => {
  // Guard de no-vacuidad: si informeTemplate dejara de tener titulo o
  // campos de cabecera, los asserts de abajo pasarian sin comprobar nada.
  assert.ok(TITULO_ANTES.length > 0, 'el titulo del esqueleto no contiene el ID de la tarea');
  assert.ok(TITULO_ENTRE.length > 0, 'el titulo del esqueleto no contiene el numero de ronda');
  assert.ok(CAMPOS_CABECERA.length >= 3, `cabecera inesperada: ${CAMPOS_CABECERA.join(' / ')}`);
  assert.ok(CAMPO_VEREDICTO.length > 0, 'el esqueleto ya no trae linea de veredicto');
  assert.ok(SECCION_HALLAZGOS.length > 0, 'el esqueleto ya no trae seccion de hallazgos');
});

test('10c. las cuatro prescriben el esqueleto que taskctl review genera de verdad', async () => {
  for (const nombre of REVISORES) {
    const bloque = bloqueInforme(nombre, await leer(nombre));

    const titulo = bloque.find((l) => l.startsWith(TITULO_ANTES));
    assert.ok(titulo !== undefined, `${nombre}: el bloque no tiene titulo`);
    assert.ok(
      titulo.includes(TITULO_ENTRE) && titulo.endsWith(TITULO_DESPUES),
      `${nombre}: el titulo no tiene la forma que genera el CLI ("${ESQUELETO[0] ?? ''}"), es "${titulo}"`
    );

    for (const campo of CAMPOS_CABECERA) {
      assert.ok(
        bloque.some((l) => l.startsWith(campo)),
        `${nombre}: el informe pierde el campo de cabecera "${campo}" que el CLI genera`
      );
    }

    // El veredicto se SUSTITUYE en la cabecera. Dos lineas -> finish exige
    // que aprueben las dos, y basta que una siga en PENDIENTE para que la
    // tarea no cierre. Una sola, y antes de los hallazgos.
    const iVeredicto = bloque
      .map((l, i) => (l.startsWith(CAMPO_VEREDICTO) ? i : -1))
      .filter((i) => i !== -1);
    assert.equal(
      iVeredicto.length,
      1,
      `${nombre}: el informe prescribe ${iVeredicto.length} lineas "${CAMPO_VEREDICTO}"; tiene que haber exactamente una`
    );
    const iHallazgos = bloque.indexOf(SECCION_HALLAZGOS);
    assert.notEqual(iHallazgos, -1, `${nombre}: el informe no trae "${SECCION_HALLAZGOS}"`);
    assert.ok(
      (iVeredicto[0] ?? -1) < iHallazgos,
      `${nombre}: el veredicto va en la cabecera, no en una seccion al final`
    );

    // Y que ese veredicto de ejemplo lo acepte de verdad quien lo lee.
    const linea = bloque[iVeredicto[0] ?? 0] ?? '';
    assert.ok(
      veredictoAprobado(linea),
      `${nombre}: la linea de ejemplo "${linea}" no la aprueba finish.ts`
    );

    // El revisor se identifica: el esqueleto deja "(rellenar por el agente)".
    const revisor = bloque.find((l) => /^-\s*Revisor:/i.test(l)) ?? '';
    assert.ok(
      revisor.toLowerCase().includes(nombre),
      `${nombre}: la linea "${revisor}" no nombra a la propia skill`
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
