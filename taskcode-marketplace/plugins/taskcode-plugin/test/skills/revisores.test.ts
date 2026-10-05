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
 * 2bis. QUE CAPTURAN ESOS PATRONES, medido en las dos direcciones. Que la
 *    lista parsee y no este vacia no dice nada sobre a donde va cada diff.
 *    En la ronda 1 los patrones capturaban de mas (NestJS, Next.js); el
 *    recorte que lo cerro abrio el simetrico (Angular 20, que retiro el
 *    sufijo de tipo del nombre de fichero, dejo de llegar). Las dos veces
 *    la suite siguio verde. Una tabla de rutas realistas contra los
 *    patrones leidos de los propios SKILL.md cierra las dos direcciones.
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
import { parseFrontmatter } from '../../src/core/frontmatter.js';
import { veredictoAprobado } from '../../src/commands/finish.js';
import { informeTemplate } from '../../src/commands/review.js';
import { extraerBloqueYaml, parseBloqueRevisor } from '../../src/core/revisores.js';
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

/**
 * Los documentos internos de un repo se nombran en MAYUSCULAS bajo `docs/`.
 * Ampliar `MARCAS_DEL_REPO` de uno en uno se quedaba corto siempre: la lista
 * dejaba pasar `docs/CONVENCIONES.md`, `docs/HALLAZGOS.md` y cualquier otro
 * que naciera despues (ronda 2, menor 4). Se asevera el patron, no el caso.
 */
const DOCUMENTO_INTERNO = /docs\/[A-Z_]+\.md/;

/** Rutas de maquina, mismo criterio que en task-workflow.test.ts. */
const RUTAS_DE_MAQUINA = ['C:\\Users\\', '/Users/', '/home/', '~/'];

function rutaSkill(nombre: string): string {
  return path.join(SKILLS_DIR, nombre, 'SKILL.md');
}

async function leer(nombre: string): Promise<string> {
  return readFile(rutaSkill(nombre), 'utf8');
}

/**
 * Lo comun a las cuatro revisoras (plantilla de hallazgos, rondas, linea del
 * veredicto con su tabla, lo que un revisor no hace) vive una sola vez en la
 * skill de flujo, desde TASK-048: cuatro copias ya habian divergido (las
 * cuatro decian que `**aprobada**` no aprueba despues de que el gate empezara
 * a recortar el enfasis). Cada revisora lo enlaza con esta ruta relativa.
 */
const REVISION_MD = path.join(SKILLS_DIR, 'task-workflow', 'revision.md');
const ENLACE_A_REVISION = '](../task-workflow/revision.md)';

/** Lo que lee de verdad un revisor: su skill mas la referencia comun. */
async function textoEfectivo(nombre: string): Promise<string> {
  return `${await leer(nombre)}\n${await readFile(REVISION_MD, 'utf8')}`;
}

/**
 * Extrae el primer bloque ```yaml del cuerpo y lo parsea con el parser del
 * repo. Devuelve tambien las lineas crudas: el parser aplana lo que puede,
 * asi que aseverar solo sobre su salida dejaria pasar formas que Claude
 * Code interpretaria de otra manera.
 *
 * Promovido a src/core/revisores.ts (TASK-018, paso 2 del orden de
 * construccion del plan): esto era la unica logica de lectura de
 * `patrones_archivo`/`fallback`/`umbral_dominios` que existia, y vivia
 * solo aqui, sin ningun lector de produccion. Este helper ahora es un
 * envoltorio fino sobre esas dos funciones, para no duplicar el parseo.
 */
function bloqueYaml(texto: string): { data: Record<string, unknown>; lineas: string[] } {
  const lineas = extraerBloqueYaml(texto);
  assert.notEqual(lineas, null, 'no hay ningun bloque ```yaml en la skill (o no se cierra)');
  const data = parseBloqueRevisor(lineas as string[], {
    etiqueta: 'skill',
    crearError: (msg: string) => new Error(msg),
  });
  return { data, lineas: lineas as string[] };
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

// --- 2bis. El enrutado, MEDIDO: que ruta llega a que revisor -----------

/**
 * Los tests 5 y 6 miran la lista de patrones por encima: que no este vacia,
 * y que dos revisores no declaren el mismo patron. Ninguno mira QUE captura
 * esa lista, que es el dato de mas consecuencia de estas skills y el unico
 * que ya ha fallado en dos rondas seguidas.
 *
 * Reproducido en la ronda 2 con dos sondas que dejaban la suite ENTERA en
 * verde: (a) reintroducir en angular-vue el patron de modulos y el de la
 * carpeta de aplicacion sin acotar —o sea, el defecto de la ronda 1 tal
 * cual, que se llevaba NestJS y Next.js a un revisor de frontend—, y (b)
 * reducir esa misma lista a un unico patron de ficheros de Vue, que deja a
 * Angular entero sin revisor. Ninguna de las dos rompia nada.
 *
 * De ahi esta tabla. Se asevera en las dos direcciones —lo que TIENE que
 * casar y lo que NO puede casar— con `path.matchesGlob` y con los patrones
 * leidos de los propios SKILL.md, nunca copiados aqui: copiarlos daria
 * verde sobre una lista que ya no es la que se instala.
 *
 * Las rutas van con barra normal a proposito: es lo que emite
 * `git diff --name-only` en cualquier plataforma, incluida Windows.
 */

type RevisorDeDominio = (typeof REVISORES_DE_DOMINIO)[number];

/** [ruta, revisor que TIENE que reclamarla, de donde sale la ruta] */
const RUTAS_LEGITIMAS: ReadonlyArray<readonly [string, RevisorDeDominio, string]> = [
  // Angular hasta la 19: el sufijo de tipo va en el nombre del fichero.
  ['src/app/user-profile/user-profile.component.ts', 'angular-vue-reviewer', 'angular<=19'],
  ['src/app/user-profile/user-profile.component.html', 'angular-vue-reviewer', 'angular<=19'],
  ['src/app/user-profile/user-profile.component.scss', 'angular-vue-reviewer', 'angular<=19'],
  ['src/app/user-profile/user-profile.component.spec.ts', 'angular-vue-reviewer', 'angular<=19'],
  ['src/app/shared/highlight.directive.ts', 'angular-vue-reviewer', 'angular<=19'],
  ['angular.json', 'angular-vue-reviewer', 'angular<=19'],
  ['libs/ui/src/lib/button/button.component.ts', 'angular-vue-reviewer', 'angular<=19 en libreria Nx'],
  ['libs/ui/src/lib/button/button.component.html', 'angular-vue-reviewer', 'angular<=19 en libreria Nx'],

  // Angular 20 o posterior: la guia de estilo retiro el sufijo de tipo, asi
  // que el componente UserProfile vive en user-profile.ts / .html / .css.
  // Lo que lo trae aqui es el corte de ruta, no el nombre del fichero.
  ['src/app/user-profile/user-profile.html', 'angular-vue-reviewer', 'angular>=20'],
  ['src/app/app.html', 'angular-vue-reviewer', 'angular>=20'],
  ['src/app/app.routes.ts', 'angular-vue-reviewer', 'angular>=20'],
  ['src/app/admin/admin.routes.ts', 'angular-vue-reviewer', 'angular>=20'],
  ['src/app/app.config.ts', 'angular-vue-reviewer', 'angular>=20'],
  ['apps/portal/src/app/user-profile/user-profile.html', 'angular-vue-reviewer', 'angular>=20 en Nx'],
  ['apps/portal/src/app/app.routes.ts', 'angular-vue-reviewer', 'angular>=20 en Nx'],

  // Vue 3 + Vite, y Nuxt 3.
  ['src/App.vue', 'angular-vue-reviewer', 'vue3+vite'],
  ['src/components/UserCard.vue', 'angular-vue-reviewer', 'vue3+vite'],
  ['src/composables/useUser.ts', 'angular-vue-reviewer', 'vue3+vite'],
  ['vue.config.js', 'angular-vue-reviewer', 'vue3+vite'],
  ['pages/index.vue', 'angular-vue-reviewer', 'nuxt3'],
  ['composables/useAuth.ts', 'angular-vue-reviewer', 'nuxt3'],
  ['nuxt.config.ts', 'angular-vue-reviewer', 'nuxt3'],

  // Java / Spring.
  ['src/main/java/com/acme/UserService.java', 'java-spring-reviewer', 'spring boot'],
  ['src/test/java/com/acme/UserServiceTest.java', 'java-spring-reviewer', 'spring boot'],
  ['pom.xml', 'java-spring-reviewer', 'maven'],
  ['build.gradle.kts', 'java-spring-reviewer', 'gradle'],
  ['src/main/resources/application-prod.yml', 'java-spring-reviewer', 'spring boot'],
  ['src/main/resources/db/migration/V3__add_col.sql', 'java-spring-reviewer', 'flyway'],

  // C# / AutoCAD / IFC.
  ['src/Exporter/IfcExporter.cs', 'csharp-autocad-ifc-reviewer', 'csharp'],
  ['src/Exporter/Exporter.csproj', 'csharp-autocad-ifc-reviewer', 'csharp'],
  ['Solucion.sln', 'csharp-autocad-ifc-reviewer', 'csharp'],
  ['test/fixtures/minimal.ifc', 'csharp-autocad-ifc-reviewer', 'ifc'],
];

/**
 * CAPTURAS ACEPTADAS: rutas que NO son del dominio del revisor que las
 * reclama, que aun asi casan, y cuya conservacion esta decidida y explicada
 * en la propia skill.
 *
 * Es un tercer estado, y hace falta porque los otros dos mienten sobre
 * ellas. En `RUTAS_AJENAS` la asercion es "no casa con nadie", y estas si
 * casan: el test se pondria rojo por decir la verdad. En `RUTAS_LEGITIMAS`
 * quedarian etiquetadas como ficheros de Angular o de Vue, y no lo son. Son
 * fugas conocidas, medidas, y conservadas a proposito porque renunciar al
 * patron cuesta mas cobertura de la que la fuga cuesta — que es justo lo que
 * dice la frase del criterio que ahora comparten angular-vue y csharp.
 *
 * Se congelan aqui para que la decision no se pueda revertir en silencio: si
 * alguien acota el patron y estas dejan de casar, el test 6c se pone rojo y
 * obliga a volver a la skill a reescribir el hueco que documenta. Si alguien
 * lo ancha, la tabla negativa sigue siendo la que muerde.
 *
 * Medidas con `path.matchesGlob` contra los dos patrones que las capturan
 * (el de plantillas bajo la carpeta de aplicacion y el de configuracion de
 * arranque), leidos del propio SKILL.md como el resto de la tabla.
 */
const CAPTURAS_ACEPTADAS: ReadonlyArray<readonly [string, RevisorDeDominio, string]> = [
  // Plantillas de backend servidas desde la carpeta de aplicacion. El corte
  // de ruta discrimina frente a Next.js —que sirve .tsx o .jsx, nunca
  // .html— pero no frente a un backend con plantillas. Renunciar dejaria a
  // Angular >= 20 sin ningun patron que lo capture, que es peor.
  ['src/app/templates/base.html', 'angular-vue-reviewer', 'captura aceptada: flask/fastapi src-layout'],
  ['src/app/templates/index.html', 'angular-vue-reviewer', 'captura aceptada: flask/fastapi src-layout'],
  ['src/app/static/index.html', 'angular-vue-reviewer', 'captura aceptada: estatico servido por backend'],
  ['src/app/views/mail.html', 'angular-vue-reviewer', 'captura aceptada: express con plantillas'],
  ['src/app/index.html', 'angular-vue-reviewer', 'captura aceptada: electron o sitio estatico'],

  // La carpeta de aplicacion de un NestJS en Nx, que es territorio de Nest.
  // El fichero no lo genera ningun esquematico de Nest, y el resto de un
  // diff suyo (modulos, servicios, controladores) no casa con nada de aqui:
  // ya esta en RUTAS_AJENAS y sigue sin casar.
  ['apps/api/src/app/app.config.ts', 'angular-vue-reviewer', 'captura aceptada: nestjs en Nx'],
];

/** Lo que TIENE que casar: porque le toca, o porque se decidio conservarlo. */
const RUTAS_DE_DOMINIO: ReadonlyArray<readonly [string, RevisorDeDominio, string]> = [
  ...RUTAS_LEGITIMAS,
  ...CAPTURAS_ACEPTADAS,
];

/**
 * [ruta, ecosistema]. Ninguna puede casar con NINGUN revisor de dominio: si
 * casa, el enrutado se da por servido y el diff acaba revisado por una
 * skill que se declara incompetente para el, en lugar de por el generico.
 */
const RUTAS_AJENAS: ReadonlyArray<readonly [string, string]> = [
  // NestJS: sus convenciones son las que angular-vue tuvo que soltar.
  ['src/users/users.module.ts', 'nestjs'],
  ['src/users/users.service.ts', 'nestjs'],
  ['src/users/users.controller.ts', 'nestjs'],
  ['src/auth/jwt.guard.ts', 'nestjs'],
  ['src/common/pipes/validation.pipe.ts', 'nestjs'],
  ['src/users/user.resolver.ts', 'nestjs'],
  ['src/users/users.service.spec.ts', 'nestjs'],
  ['src/config/app.config.ts', 'nestjs (config, no arranque de Angular)'],
  ['nest-cli.json', 'nestjs'],
  // NestJS generado por Nx: vive justo bajo la carpeta de aplicacion.
  ['apps/api/src/app/app.module.ts', 'nestjs en Nx'],
  ['apps/api/src/app/app.controller.ts', 'nestjs en Nx'],
  ['apps/api/src/app/app.service.ts', 'nestjs en Nx'],
  ['apps/api/src/app/app.controller.spec.ts', 'nestjs en Nx'],

  // Next.js App Router: misma carpeta que Angular, otro ecosistema.
  ['src/app/page.tsx', 'next.js app router'],
  ['src/app/layout.tsx', 'next.js app router'],
  ['src/app/globals.css', 'next.js app router'],
  ['src/app/globals.scss', 'next.js app router con sass'],
  ['src/app/api/users/route.ts', 'next.js app router'],
  ['src/app/(dashboard)/settings/page.tsx', 'next.js app router'],
  ['app/page.tsx', 'next.js app router sin src'],
  ['next.config.js', 'next.js'],

  // React, Go, Python, y backend TypeScript con tests .spec.ts.
  ['src/components/Button.tsx', 'react'],
  ['src/hooks/useUser.ts', 'react'],
  ['src/App.jsx', 'react'],
  ['src/components/Button.test.tsx', 'react'],
  ['src/stores/userStore.ts', 'react'],
  ['internal/stores/user.go', 'go'],
  ['cmd/server/main.go', 'go'],
  ['app/main.py', 'python'],
  ['tests/test_users.py', 'python'],
  ['src/services/billing.spec.ts', 'backend ts'],
  ['src/lib/queue.spec.ts', 'backend ts'],
  ['src/index.ts', 'backend ts'],
  ['src/routes/auth.routes.ts', 'express ts'],
  ['src/lib/templates/email.html', 'backend ts con plantilla de correo'],
  ['public/index.html', 'sitio estatico'],
  ['src/lib/components/Button.svelte', 'svelte'],
];

/** Patrones leidos de los SKILL.md, una sola vez. */
async function patronesPorRevisor(): Promise<Map<RevisorDeDominio, string[]>> {
  const mapa = new Map<RevisorDeDominio, string[]>();
  for (const nombre of REVISORES_DE_DOMINIO) {
    const { data } = bloqueYaml(await leer(nombre));
    mapa.set(nombre, data['patrones_archivo'] as string[]);
  }
  return mapa;
}

function reclamantes(mapa: Map<RevisorDeDominio, string[]>, ruta: string): RevisorDeDominio[] {
  return [...mapa]
    .filter(([, patrones]) => patrones.some((glob) => path.matchesGlob(ruta, glob)))
    .map(([nombre]) => nombre);
}

test('6b. la tabla de enrutado no esta vacia ni cojea (guard de no-vacuidad)', async () => {
  assert.equal(
    typeof path.matchesGlob,
    'function',
    'path.matchesGlob no existe en este Node: el test de enrutado no estaria midiendo nada'
  );
  assert.ok(RUTAS_DE_DOMINIO.length >= 30, 'la tabla positiva se ha quedado corta');
  assert.ok(RUTAS_AJENAS.length >= 30, 'la tabla negativa se ha quedado corta');

  // Las capturas aceptadas son una decision congelada: vaciar la tabla la
  // descongela sin que nadie se entere.
  assert.ok(
    CAPTURAS_ACEPTADAS.length > 0,
    'la tabla de capturas aceptadas esta vacia: los huecos conocidos dejarian de estar congelados'
  );

  // Los tres revisores de dominio tienen que estar representados; si no, la
  // direccion positiva estaria verde por no mirar a dos de ellos.
  for (const nombre of REVISORES_DE_DOMINIO) {
    assert.ok(
      RUTAS_DE_DOMINIO.some(([, esperado]) => esperado === nombre),
      `la tabla de enrutado no tiene ninguna ruta para ${nombre}`
    );
  }

  // Y las dos convenciones de Angular, que es donde estuvo el defecto.
  for (const marca of ['angular<=19', 'angular>=20']) {
    assert.ok(
      RUTAS_DE_DOMINIO.some(([, , origen]) => origen.startsWith(marca)),
      `la tabla no cubre la convencion ${marca}`
    );
  }

  // Ninguna ruta puede estar en las dos tablas a la vez.
  const ajenas = new Set(RUTAS_AJENAS.map(([r]) => r));
  for (const [ruta] of RUTAS_DE_DOMINIO) {
    assert.ok(!ajenas.has(ruta), `"${ruta}" esta en las dos tablas: la asercion seria contradictoria`);
  }

  // Y el corpus tiene que discriminar de verdad: si algun patron real
  // capturase todo, esto seguiria verde. Se comprueba con un patron
  // deliberadamente amplio que la tabla negativa lo detecta.
  const todo = new Map<RevisorDeDominio, string[]>([['angular-vue-reviewer', ['**']]]);
  assert.ok(
    RUTAS_AJENAS.some(([ruta]) => reclamantes(todo, ruta).length > 0),
    'la tabla negativa no detecta ni un patron que casa con todo: no discrimina'
  );
});

test('6c. POSITIVA: cada ruta que tiene que casar llega al revisor que le toca', async () => {
  const mapa = await patronesPorRevisor();
  const fallos: string[] = [];
  for (const [ruta, esperado, origen] of RUTAS_DE_DOMINIO) {
    const casan = reclamantes(mapa, ruta);
    if (!casan.includes(esperado)) {
      fallos.push(
        `  ${origen}: "${ruta}" deberia ir a ${esperado} y ` +
          (casan.length === 0 ? 'no casa con ningun patron' : `solo casa con ${casan.join(', ')}`)
      );
    }
  }
  assert.equal(
    fallos.length,
    0,
    `${fallos.length} de ${RUTAS_DE_DOMINIO.length} rutas que tenian que casar se quedan sin su ` +
      `revisor (un recorte de patrones de mas). Si la que falla es una CAPTURA ACEPTADA, el ` +
      `recorte puede ser deliberado: entonces hay que quitarla de esa tabla y reescribir el hueco ` +
      `que la skill documenta, no relajar este test:\n${fallos.join('\n')}`
  );
});

test('6d. NEGATIVA: ninguna ruta ajena llega a un revisor de dominio', async () => {
  const mapa = await patronesPorRevisor();
  const fugas: string[] = [];
  for (const [ruta, ecosistema] of RUTAS_AJENAS) {
    const casan = reclamantes(mapa, ruta);
    if (casan.length > 0) {
      fugas.push(`  ${ecosistema}: "${ruta}" la reclama ${casan.join(', ')}`);
    }
  }
  assert.equal(
    fugas.length,
    0,
    `${fugas.length} de ${RUTAS_AJENAS.length} rutas ajenas capturadas por un revisor de dominio ` +
      `(una ampliacion de patrones de mas: el generico ya no entra y esa es la unica revision ` +
      `que ese diff va a tener):\n${fugas.join('\n')}`
  );
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
    const texto = await textoEfectivo(nombre);
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

/**
 * La exigencia de reproducir empiricamente, ANCLADA A UNA SECCION REAL.
 *
 * La version anterior de este test buscaba la subcadena 'reproduc' sobre el
 * fichero entero en minusculas. La satisfacia la etiqueta `- Reproduccion:`
 * del esqueleto del informe — que el test 10c ADEMAS exige que este
 * presente, asi que la asercion no podia ponerse roja por su cuenta.
 * Reproducido: borrada de angular-vue la seccion `## Reproducir antes de
 * reportar` entera (2399 bytes: los seis pasos y las tecnicas por area), la
 * suite quedaba 21/21 en verde. Era el nucleo metodologico de estas skills
 * —lo que las separa de leer el diff y opinar— sin ninguna red.
 *
 * Se asevera sobre la SECCION, no sobre la palabra:
 *
 * - Un encabezado `##` que hable de reproducir, y FUERA de los bloques
 *   cercados. Dentro hay un `## Reproduccion` que es un apartado del informe
 *   a rellenar, no el metodo; contarlo seria el mismo agujero con otra
 *   forma.
 * - Y con procedimiento de verdad: los pasos numerados. Una seccion que solo
 *   diga "hay que reproducir" no distingue reproducir de opinar.
 */
const PASOS_MINIMOS = 3;

/** Las lineas fuera de todo bloque cercado: el esqueleto vive dentro. */
function sinBloquesCercados(texto: string): string[] {
  const fuera: string[] = [];
  let dentro = false;
  // Split tolerante a CRLF: estos ficheros se editan en Windows.
  for (const linea of texto.split(/\r?\n/)) {
    if (/^\s*```/.test(linea)) {
      dentro = !dentro;
      continue;
    }
    if (!dentro) fuera.push(linea);
  }
  return fuera;
}

/** El cuerpo de la seccion de reproduccion, o null si no existe tal seccion. */
function seccionDeReproduccion(texto: string): string[] | null {
  const lineas = sinBloquesCercados(texto);
  const ini = lineas.findIndex((l) => /^##\s+.*reproduc/i.test(l));
  if (ini === -1) return null;
  const siguiente = lineas.findIndex((l, i) => i > ini && /^##\s/.test(l));
  return lineas.slice(ini + 1, siguiente === -1 ? lineas.length : siguiente);
}

function pasosNumerados(cuerpo: readonly string[]): number {
  return cuerpo.filter((l) => /^\s*\d+\.\s/.test(l)).length;
}

test('10. las cuatro exigen reproducir en una SECCION con procedimiento, no de pasada', async () => {
  for (const nombre of REVISORES) {
    const cuerpo = seccionDeReproduccion(await leer(nombre));
    assert.notEqual(
      cuerpo,
      null,
      `${nombre}: no hay ninguna seccion "## ...reproducir..." fuera de los bloques cercados; ` +
        'la etiqueta "- Reproduccion:" del esqueleto es un campo del informe, no el metodo'
    );
    const pasos = pasosNumerados(cuerpo as string[]);
    assert.ok(
      pasos >= PASOS_MINIMOS,
      `${nombre}: la seccion de reproduccion tiene ${pasos} pasos numerados y se esperan al menos ` +
        `${PASOS_MINIMOS}; una seccion sin procedimiento no separa reproducir de leer el diff y opinar`
    );
  }
});

/**
 * Contraprueba del test 10, en el propio test: la asercion nueva tiene que
 * rechazar justo lo que la vieja aceptaba. Mismo patron que el 9b.
 */
// Nombrado "10 bis" y no "10b": ese numero ya lo ocupa el guard del
// esqueleto, mas abajo, y dos tests con el mismo nombre se confunden en la
// salida de node --test justo cuando uno de los dos esta rojo.
test('10 bis. la seccion de reproduccion NO la satisface la etiqueta del esqueleto', () => {
  // Lo que la version anterior daba por bueno: la palabra aparece, pero solo
  // como campo del informe, dentro del bloque cercado. Y con pasos
  // numerados dentro, para que ni siquiera el umbral la salve.
  const soloEsqueleto = [
    '# Revisor de ejemplo',
    '',
    'Un hallazgo se reporta cuando existe el caso que lo demuestra.',
    '',
    '## Estructura del informe',
    '',
    '```markdown',
    '## Reproduccion',
    '- Clon: <ruta temporal y rama>',
    '1. paso dentro del bloque',
    '2. otro paso dentro del bloque',
    '3. y un tercero',
    '```',
  ].join('\n');
  assert.equal(
    seccionDeReproduccion(soloEsqueleto),
    null,
    'el "## Reproduccion" del esqueleto del informe cuenta como metodo: no discrimina'
  );

  // Y una seccion de verdad pero vaciada de procedimiento tampoco basta.
  const seccionSinPasos = [
    '## Reproducir antes de reportar',
    '',
    'Esto no es leer el diff y opinar.',
    '',
    '## Que se revisa',
  ].join('\n');
  const vacia = seccionDeReproduccion(seccionSinPasos);
  assert.notEqual(vacia, null, 'la seccion sin pasos ni se encuentra: el patron no casa con nada');
  assert.ok(
    pasosNumerados(vacia as string[]) < PASOS_MINIMOS,
    'una seccion sin pasos numerados pasa el umbral: el umbral no mide nada'
  );

  // Y al reves: la forma real si la acepta, para que el test no este verde
  // simplemente porque el patron no case con nada nunca.
  const formaReal = [
    '## Reproducir antes de reportar',
    '',
    '1. Clonar el repo a un directorio temporal.',
    '2. Instalar con el lockfile.',
    '3. Compilar y pasar el linter y los tipos.',
    '',
    '## Que se revisa',
  ].join('\n');
  const real = seccionDeReproduccion(formaReal);
  assert.notEqual(real, null, 'la forma real no se reconoce como seccion');
  assert.ok(
    pasosNumerados(real as string[]) >= PASOS_MINIMOS,
    'la forma real no pasa el umbral: el test 10 estaria rojo por construccion'
  );
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

    const iHallazgos = bloque.indexOf(SECCION_HALLAZGOS);
    assert.notEqual(iHallazgos, -1, `${nombre}: el informe no trae "${SECCION_HALLAZGOS}"`);

    // No basta con que el campo EXISTA: tiene que estar en la cabecera.
    // Con un simple some(), mover "- Commit revisado:" o "- Revisor:" a un
    // apartado dentro de los hallazgos dejaba la suite verde (ronda 2,
    // menor 3). El indice de la seccion ya estaba calculado para el
    // veredicto; se reutiliza para los tres campos.
    for (const campo of CAMPOS_CABECERA) {
      const i = bloque.findIndex((l) => l.startsWith(campo));
      assert.notEqual(
        i,
        -1,
        `${nombre}: el informe pierde el campo de cabecera "${campo}" que el CLI genera`
      );
      assert.ok(
        i < iHallazgos,
        `${nombre}: el campo "${campo}" aparece por debajo de "${SECCION_HALLAZGOS}"; va en la cabecera, donde el CLI lo deja`
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

// --- 3ter. Lo comun, en un solo sitio (TASK-048) -------------------------

test('10d. cada revisora enlaza la referencia comun, y la referencia existe', async () => {
  await readFile(REVISION_MD, 'utf8'); // lanza si no existe
  for (const nombre of REVISORES) {
    assert.ok(
      (await leer(nombre)).includes(ENLACE_A_REVISION),
      `${nombre}: no enlaza ${ENLACE_A_REVISION.slice(2, -1)}, donde vive lo comun a toda revision`
    );
  }
});

/**
 * Frases que solo pueden estar en revision.md. Si una revisora vuelve a
 * copiarlas, hay dos sitios que mantener y el dia que se toque uno solo
 * divergen, que es lo que ya paso con la tabla del veredicto.
 */
const SOLO_EN_REVISION = [
  'Una sola ejecucion de la suite por ronda',
  '- Sugerencia: <la direccion de la correccion, no el parche>',
  '### IMPORTANTE-1 — <titulo corto>',
  'No aprueba por simpatia',
  'Un revisor que escriba el veredicto en su propio vocabulario',
];

/** Fila de una tabla de veredictos, con o sin el guion de la linea. */
const FILA_DE_VEREDICTO = /^\|\s*`-?\s*Veredicto:/im;

async function todosLosMd(): Promise<string[]> {
  const ficheros: string[] = [];
  for (const dir of await readdir(SKILLS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const f of await readdir(path.join(SKILLS_DIR, dir.name))) {
      if (f.endsWith('.md')) ficheros.push(path.join(SKILLS_DIR, dir.name, f));
    }
  }
  return ficheros;
}

test('10e. lo comun a las revisoras y la tabla del veredicto viven solo en revision.md', async () => {
  const comun = await readFile(REVISION_MD, 'utf8');
  for (const frase of SOLO_EN_REVISION) {
    assert.ok(comun.includes(frase), `revision.md ya no contiene "${frase}": el test no mide nada`);
  }
  assert.ok(FILA_DE_VEREDICTO.test(comun), 'revision.md no tiene la tabla del veredicto');

  const ficheros = (await todosLosMd()).filter((f) => path.resolve(f) !== path.resolve(REVISION_MD));
  assert.ok(ficheros.length >= 15, `solo se encontraron ${ficheros.length} .md en skills/`);
  for (const fichero of ficheros) {
    const texto = await readFile(fichero, 'utf8');
    const rel = path.relative(SKILLS_DIR, fichero);
    for (const frase of SOLO_EN_REVISION) {
      assert.ok(!texto.includes(frase), `${rel}: copia "${frase}", que vive en revision.md`);
    }
    assert.ok(!FILA_DE_VEREDICTO.test(texto), `${rel}: tiene su propia tabla del veredicto`);
  }
});

/** Las filas de la tabla del veredicto de revision.md, tal cual. */
function filasDeVeredicto(texto: string): Array<{ celda: string; resultado: string }> {
  const filas: Array<{ celda: string; resultado: string }> = [];
  let enTabla = false;
  for (const linea of texto.split(/\r?\n/)) {
    if (/^\|\s*Linea escrita\s*\|\s*Resultado\s*\|/.test(linea)) {
      enTabla = true;
      continue;
    }
    if (!enTabla) continue;
    if (!linea.startsWith('|')) break;
    if (/^\|[\s|:-]+$/.test(linea)) continue; // separador |---|---|
    const celdas = linea.split('|').slice(1, -1).map((c) => c.trim());
    filas.push({ celda: celdas[0] ?? '', resultado: celdas[1] ?? '' });
  }
  return filas;
}

/** Que informe representa la primera celda: su codigo, o nada si no hay linea. */
function informeDeCelda(celda: string): string {
  const codigo = /^`([^`]+)`/.exec(celda);
  if (codigo) return codigo[1] as string;
  assert.equal(celda, '(sin ninguna linea de veredicto)', `celda que el test no sabe leer: "${celda}"`);
  return '';
}

/** Lo que la tabla dice del resultado: aprueba (true) o no (false). */
function resultadoDeCelda(resultado: string): boolean {
  if (/^no aprueba\b/i.test(resultado)) return false;
  if (/^aprueba\b/i.test(resultado)) return true;
  return assert.fail(`resultado que el test no sabe leer: "${resultado}"`);
}

test('10f. cada fila de la tabla del veredicto de revision.md dice lo que hace finish.ts', async () => {
  const filas = filasDeVeredicto(await readFile(REVISION_MD, 'utf8'));
  // Guard de no-vacuidad: si la cabecera cambia, filasDeVeredicto no lee
  // nada y el bucle de abajo saldria verde sin comprobar ninguna fila.
  assert.ok(filas.length >= 10, `la tabla tiene ${filas.length} filas: no se esta leyendo`);
  const dice = filas.map((f) => resultadoDeCelda(f.resultado));
  assert.ok(dice.includes(true) && dice.includes(false), 'la tabla tiene que tener filas que aprueban y que no');

  const mal: string[] = [];
  for (const [i, fila] of filas.entries()) {
    const real = veredictoAprobado(informeDeCelda(fila.celda));
    if (real !== dice[i]) {
      mal.push(`  ${fila.celda}: la tabla dice "${fila.resultado}" y finish.ts ${real ? 'aprueba' : 'no aprueba'}`);
    }
  }
  assert.deepEqual(mal, [], `filas de la tabla que no coinciden con veredictoAprobado:\n${mal.join('\n')}`);
});

test('10g. la lectura de la tabla discrimina (contraprueba del 10f)', () => {
  const tabla = [
    'texto antes',
    '| Linea escrita | Resultado |',
    '|---|---|',
    '| `- Veredicto: aprobada` | aprueba |',
    '| (sin ninguna linea de veredicto) | no aprueba |',
    '',
    '| `- Veredicto: fuera de la tabla` | aprueba |',
  ].join('\n');
  const filas = filasDeVeredicto(tabla);
  assert.equal(filas.length, 2, 'la tabla no acaba en la primera linea que no es fila');
  assert.equal(informeDeCelda(filas[0]?.celda ?? ''), '- Veredicto: aprobada');
  assert.equal(informeDeCelda(filas[1]?.celda ?? ''), '');
  assert.equal(resultadoDeCelda('no aprueba: motivo'), false, '"no aprueba" se lee como aprueba');
  assert.equal(resultadoDeCelda('aprueba: motivo'), true);
  assert.throws(() => resultadoDeCelda('pasa'), 'un resultado ilegible no puede contar como ninguno');
  assert.throws(() => informeDeCelda('linea sin codigo'), 'una celda ilegible no puede contar como informe vacio');
});

// --- 4. Portabilidad ----------------------------------------------------

test('11. ninguna skill arrastra marcas de este repo ni rutas de maquina', async () => {
  // revision.md entra con la lista estricta de las revisoras: es parte de lo
  // que cada una lee, aunque viva en la carpeta de la skill de flujo.
  const ficheros: Array<[string, string]> = REVISORES.map((n) => [n, rutaSkill(n)]);
  ficheros.push(['task-workflow/revision.md', REVISION_MD]);
  for (const [nombre, ruta] of ficheros) {
    const texto = await readFile(ruta, 'utf8');
    const enMinusculas = texto.toLowerCase();

    for (const marca of MARCAS_DEL_REPO) {
      assert.ok(
        !enMinusculas.includes(marca),
        `${nombre}: contiene la marca "${marca}", que no significa nada en otro proyecto`
      );
    }

    const doc = DOCUMENTO_INTERNO.exec(texto);
    assert.equal(
      doc,
      null,
      `${nombre}: nombra el documento interno "${doc?.[0]}", que no existe en el proyecto donde se instala`
    );

    for (const ruta of RUTAS_DE_MAQUINA) {
      assert.ok(!texto.includes(ruta), `${nombre}: contiene la ruta de maquina "${ruta}"`);
    }
  }
});

test('11b. la marca generica de documento interno discrimina (contraprueba del menor 4)', () => {
  for (const caso of [
    'Ver docs/CONVENCIONES.md para el detalle.',
    'esta en docs/HALLAZGOS.md',
    'segun docs/PLAN_SPRINTS.md',
    'lo describe docs/ESTADO.md',
  ]) {
    assert.ok(DOCUMENTO_INTERNO.test(caso), `la marca generica deja pasar "${caso}"`);
  }
  // Y al reves: no puede morder texto legitimo de una skill portable.
  for (const caso of [
    'documenta el hallazgo en el informe',
    'la carpeta docs/ del proyecto',
    'un fichero docs/guia-de-estilo.md',
    'README.md en la raiz',
  ]) {
    assert.equal(DOCUMENTO_INTERNO.test(caso), false, `la marca generica muerde texto legitimo: "${caso}"`);
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
      // task-workflow viaja con ellas: las cuatro enlazan su revision.md.
      for (const nombre of [...REVISORES, 'task-workflow']) {
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
