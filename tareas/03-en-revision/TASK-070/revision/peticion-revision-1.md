# Peticion de revision — TASK-070 (ronda 1)

- Tarea: TASK-070 — Clave comando_verificacion en .taskcode/config.yml
- Rama revisada: feature/task-070-clave-comando-verificacion-en-taskcode-c
- Rama base: develop
- Commit revisado (HEAD): 9c9a684de043d379e1e6889a7c4844a8f55f069f
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-070 (criterios de aceptacion y plan)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Commits a revisar (git log develop..HEAD)

````
9c9a684 feat(TASK-070): claves comando_verificacion y timeout_verificacion en config y comprobacion en doctor
1fe0022 chore(TASK-070): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 8ab2c1c..2724839 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -8,6 +8,17 @@
 - TASK-066 (feature) — Doctor-deploy A: catalogo generico y comprobaciones deterministas (2026-10-27)
 - TASK-067 (feature) — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release (2026-10-27)
 
+Comando de verificacion declarado (TASK-070), primer paso de los frenos de verificacion.
+
+- **`comando_verificacion` y `timeout_verificacion`** en `.taskcode/config.yml`:
+  el comando de tests del proyecto y sus segundos (por defecto 600). Opcionales;
+  sin ellas todo funciona como antes. Un valor invalido aborta (fallo cerrado) y
+  el timeout sin comando tambien.
+- **`taskctl doctor`** informa de la verificacion: `ok` con el comando, u
+  `omitida` con el arreglo en la misma linea si falta.
+- Todavia no hay freno que la ejecute: el hook `Stop` y la puerta de `finish`
+  llegan con TASK-071 y TASK-072. No se publica version hasta entonces.
+
 Doctor-deploy C (TASK-068): clase de aplicacion, sondas de configuracion y OWASP 2025.
 
 - **Clase de aplicacion**: doctor-deploy detecta web, api, Android, iOS, Flutter,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 9759a9d..f70859e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -541,6 +541,10 @@ algún error (los avisos no cuentan). Comprueba:
   `GIT_OPTIONAL_LOCKS=0`, así que no toma `index.lock`; un fallo por bloqueo es aviso.
 - **Config**: `.taskcode/config.yml` con el mismo validador que el resto de comandos
   (un valor inválido es error con su mensaje; una clave desconocida, aviso).
+- **Verificación**: si la config declara `comando_verificacion` (ver abajo), `ok`
+  con el comando y su timeout; sin él, `omitida` con el arreglo en la misma línea.
+  No es un aviso: un proyecto sin frenos de verificación no está mal configurado.
+  `doctor` no ejecuta el comando.
 - **Tareas**: cada `tarea.md` se lee y valida, y su `estado` tiene que ser el de
   su carpeta. Son errores, con el ID: un ID en dos carpetas, un `tarea.md` ilegible
   (con la ruta y la causa), una carpeta de tarea sin `tarea.md`, un estado distinto
@@ -555,6 +559,27 @@ algún error (los avisos no cuentan). Comprueba:
 (`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`), para que
 una skill la lea. `taskctl doctor` no escribe, no commitea ni cambia de rama.
 
+#### Cómo se verifica el proyecto: `comando_verificacion`
+
+Los frenos de verificación (que una tarea no se dé por hecha ni se mergee con
+los tests en rojo) ejecutan **el comando que declara el proyecto**, nunca uno
+deducido. Se declara en `.taskcode/config.yml`:
+
+```yaml
+comando_verificacion: "npm test"   # entrecomillado si lleva "#"
+timeout_verificacion: 900          # opcional, en segundos (por defecto 600)
+```
+
+- `comando_verificacion`: texto no vacío; lo ejecuta el shell del sistema tal
+  cual. Sin la clave no hay freno y todo funciona como antes.
+- `timeout_verificacion`: entero mayor o igual que 1, en segundos. Solo tiene
+  sentido con el comando: sin él, aborta.
+- Un valor inválido (comando vacío, timeout `0`, decimal o texto) aborta todos
+  los comandos con un mensaje que nombra la clave y la línea; nunca se cae al
+  valor por defecto en silencio.
+- Hoy solo la lee `taskctl doctor`; los frenos que la ejecutan (hook `Stop` y
+  puerta de `finish`) llegan en las versiones siguientes.
+
 `taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas]`
 es otro comando, distinto de `doctor`: aquel comprueba que el proyecto está listo
 para trabajar con el flujo de tareas; este, que **la aplicación está lista para
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 6ac25a5..02ed7d4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -184,9 +184,13 @@ que ha dejado de ser cierto es peor que no tenerlo.
 ## Configuracion (`.taskcode/config.yml`)
 
 Claves opcionales: `rama_base`, `agente_revisor_por_defecto`, `limite_wip`,
-`modo_flujo`, `excluir_de_revision` y las tres de sincronizacion de ficheros
-derivados tras cada transicion. Sin fichero, todo por defecto; una clave mal
-escrita aborta todos los comandos. La sincronizacion (y sus trampas: no usar un
+`modo_flujo`, `excluir_de_revision`, `cierre_por_defecto`, las dos del remoto
+(`plataforma_remota`, `url_base_remoto`), las dos de verificacion
+(`comando_verificacion`, el comando de tests del proyecto que ejecutan los
+frenos, y `timeout_verificacion`) y las tres de sincronizacion de ficheros
+derivados tras cada transicion. Sin fichero, todo por defecto; un valor
+invalido de una clave conocida aborta todos los comandos, y una clave
+desconocida avisa y se ignora. La sincronizacion (y sus trampas: no usar un
 hook de pre-commit, codigo de salida 3) esta en [sincronizacion.md](sincronizacion.md).
 
 ## Cerrar una tarea
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 68b389b..2216ef6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -387,6 +387,24 @@ function comprobarConfig(cwd: string): { cs: Comprobacion[]; cfg: TaskcodeConfig
   }
 }
 
+/**
+ * TASK-070: si el proyecto declara como se verifica. Solo informa: no ejecuta
+ * el comando (eso es de los frenos). Sin la clave es `omitida` y no `aviso`:
+ * un proyecto sin frenos no esta mal configurado, y un aviso permanente en
+ * cada repo que no los use dejaria de leerse. El arreglo va en el mensaje.
+ */
+export function comprobarVerificacion(cfg: TaskcodeConfig | null): Comprobacion {
+  if (cfg === null) return omitida('verificacion', 'config invalida: no se sabe como se verifica el proyecto (ver config)');
+  if (cfg.comando_verificacion === null) {
+    return omitida(
+      'verificacion',
+      'sin comando_verificacion: los frenos de verificacion no actuan. Para activarlos, declara en ' +
+        '.taskcode/config.yml: comando_verificacion: "<tu comando de tests>"'
+    );
+  }
+  return ok('verificacion', `comando_verificacion: "${una(cfg.comando_verificacion)}" (timeout ${cfg.timeout_verificacion} s)`);
+}
+
 // ---------------------------------------------------------------------
 // Tareas
 // ---------------------------------------------------------------------
@@ -572,6 +590,7 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
   cs.push(...envolver('workspace', () => comprobarWorkspace(cwd, repo, deps.timeoutGitMs ?? TIMEOUT_GIT_MS)));
 
   cs.push(...csConfig);
+  cs.push(...envolver('verificacion', () => comprobarVerificacion(cfg)));
   cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
   cs.push(
     ...envolver('plataforma', () =>
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index abe4720..e01aec7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -16,6 +16,14 @@
  * | cierre_por_defecto           | merge             | siguiente.ts -> skill finish (modo automatico) |
  * | plataforma_remota            | null (por host)   | commands/finish-opciones.ts (--merge-request) |
  * | url_base_remoto              | null              | commands/finish-opciones.ts (--merge-request) |
+ * | comando_verificacion         | null (sin freno)  | commands/doctor.ts (y los frenos, TASK-071/072) |
+ * | timeout_verificacion         | 600 (segundos)    | los frenos (TASK-071/072)  |
+ *
+ * `comando_verificacion` y `timeout_verificacion` las anadio TASK-070: declaran
+ * como se verifica el proyecto (el comando de tests del repo) para que los
+ * frenos de verificacion ejecuten ESE comando y nunca uno inventado. Mismo
+ * patron que la pareja de sincronizacion: el timeout solo con el comando. Sin
+ * la clave no hay freno y todo se comporta como antes.
  *
  * `excluir_de_revision` la anadio TASK-034: la peticion de revision
  * embebia el diff entero, y el JS compilado, los lockfiles y la propia
@@ -144,6 +152,14 @@ export interface TaskcodeConfig {
    * null = la base es `https://<host de origin>`.
    */
   url_base_remoto: string | null;
+  /**
+   * TASK-070: comando con el que se verifica el proyecto (p. ej. `npm test`).
+   * null = sin freno de verificacion (lo de siempre). No se interpreta: lo
+   * ejecuta el shell del sistema tal cual.
+   */
+  comando_verificacion: string | null;
+  /** TASK-070: segundos que se le dejan a la verificacion antes de cortarla. */
+  timeout_verificacion: number;
 }
 
 export const PLATAFORMAS_REMOTAS: readonly Plataforma[] = ['github', 'gitlab'];
@@ -177,6 +193,8 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   cierre_por_defecto: 'merge',
   plataforma_remota: null,
   url_base_remoto: null,
+  comando_verificacion: null,
+  timeout_verificacion: 600,
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -192,6 +210,8 @@ export const CLAVES_CONFIG = [
   'cierre_por_defecto',
   'plataforma_remota',
   'url_base_remoto',
+  'comando_verificacion',
+  'timeout_verificacion',
 ] as const;
 
 /**
@@ -417,7 +437,12 @@ export function parsearConfigConAvisos(
         config.limite_wip = validarEnteroPositivo(donde, par.clave, par.valor);
         break;
       case 'comando_sincronizacion':
-        config.comando_sincronizacion = validarComando(donde, par.valor);
+        config.comando_sincronizacion = validarComando(
+          donde,
+          par.clave,
+          par.valor,
+          'comando_sincronizacion: "node scripts/sincronizar-plan.mjs"'
+        );
         break;
       case 'rutas_sincronizacion':
         config.rutas_sincronizacion = validarRutasSincronizacion(donde, par.valor);
@@ -441,10 +466,17 @@ export function parsearConfigConAvisos(
         config.url_base_remoto = validarUrlBaseRemoto(donde, par.valor);
         dondeUrlBase = donde;
         break;
+      case 'comando_verificacion':
+        config.comando_verificacion = validarComando(donde, par.clave, par.valor, 'comando_verificacion: "npm test"');
+        break;
+      case 'timeout_verificacion':
+        config.timeout_verificacion = validarEnteroPositivo(donde, par.clave, par.valor);
+        break;
     }
   }
 
   validarSincronizacionCompleta(ruta, vistas);
+  validarVerificacionCompleta(ruta, vistas);
   validarRemotoCompleto(dondeUrlBase, config);
   return { config, avisos };
 }
@@ -542,6 +574,17 @@ function validarSincronizacionCompleta(ruta: string, vistas: ReadonlySet<string>
   }
 }
 
+/** TASK-070: el timeout de verificacion sin su comando no hace nada, como el de sincronizacion. */
+function validarVerificacionCompleta(ruta: string, vistas: ReadonlySet<string>): void {
+  if (vistas.has('timeout_verificacion') && !vistas.has('comando_verificacion')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "timeout_verificacion" sin "comando_verificacion" no hace nada.
+` +
+        '        Borrala, o declara tambien el comando (por ejemplo comando_verificacion: "npm test").'
+    );
+  }
+}
+
 /**
  * Lista flow de patrones `git :(glob)`. A diferencia de
  * `rutas_sincronizacion`, una lista vacia es valida (no excluir nada) y
@@ -583,12 +626,17 @@ function validarPatronesExclusion(donde: string, valor: unknown): readonly strin
 }
 
 /** El comando, recortado. No se interpreta: lo ejecuta el shell del sistema tal cual. */
-function validarComando(donde: string, valor: unknown): string {
+function validarComando(
+  donde: string,
+  clave: 'comando_sincronizacion' | 'comando_verificacion',
+  valor: unknown,
+  ejemplo: string
+): string {
   if (typeof valor !== 'string' || valor.trim() === '') {
     throw new ConfigError(
-      `[ERROR] ${donde}: "comando_sincronizacion" debe ser un comando (texto no vacio), ` +
+      `[ERROR] ${donde}: "${clave}" debe ser un comando (texto no vacio), ` +
         `y es ${describirValor(valor)}.\n` +
-        '        Ejemplo: comando_sincronizacion: "node scripts/sincronizar-plan.mjs". ' +
+        `        Ejemplo: ${ejemplo}. ` +
         'Si lleva "#", entrecomillalo entero.'
     );
   }
@@ -710,14 +758,16 @@ function validarTextoNoVacio(donde: string, clave: string, valor: unknown): stri
 /** Entero >= 1. Un limite de 0 no es "sin limite": es "no se puede trabajar". */
 function validarEnteroPositivo(
   donde: string,
-  clave: 'limite_wip' | 'timeout_sincronizacion',
+  clave: 'limite_wip' | 'timeout_sincronizacion' | 'timeout_verificacion',
   valor: unknown
 ): number {
   if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1) {
     const consecuencia =
       clave === 'limite_wip'
         ? 'Un 0 o un negativo no significan "sin limite": impedirian arrancar cualquier tarea.'
-        : 'Son segundos: un 0 o un negativo matarian el comando antes de empezar.';
+        : clave === 'timeout_sincronizacion'
+          ? 'Son segundos: un 0 o un negativo matarian el comando antes de empezar.'
+          : 'Son segundos: un 0 o un negativo cortarian la verificacion antes de empezar.';
     throw new ConfigError(
       `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 1, ` +
         `y es ${describirValor(valor)}.\n` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
index c8772c9..dbfd89d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
@@ -297,6 +297,41 @@ test('config con una clave desconocida: aviso (no error) que la nombra, codigo 0
   });
 });
 
+test('verificacion (TASK-070): sin comando_verificacion, omitida con el arreglo en la misma linea; no cambia avisos ni codigo', async () => {
+  await conRepo(async (repoRoot) => {
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'verificacion');
+    assert.equal(c.nivel, 'omitida');
+    assert.equal(c.arreglo, null);
+    assert.match(c.mensaje, /sin comando_verificacion[\s\S]*declara en \.taskcode\/config\.yml: comando_verificacion: "<tu comando de tests>"/);
+    const lineas = r.salida.split('\n').filter((l) => l.includes('comando_verificacion'));
+    assert.equal(lineas.length, 1, r.salida);
+    assert.match(lineas[0] as string, /declara en \.taskcode\/config\.yml/);
+    assert.equal(r.codigo, 0, niveles(r.comprobaciones));
+  });
+});
+
+test('verificacion (TASK-070): con comando_verificacion, ok con el comando y el timeout', async () => {
+  await conRepo(async (repoRoot) => {
+    await config(repoRoot, 'comando_verificacion: "npm test"\ntimeout_verificacion: 900\n');
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'verificacion');
+    assert.equal(c.nivel, 'ok');
+    assert.equal(c.mensaje, 'comando_verificacion: "npm test" (timeout 900 s)');
+  });
+});
+
+test('verificacion (TASK-070): con la config rota, omitida; un timeout invalido es error de config', async () => {
+  await conRepo(async (repoRoot) => {
+    await config(repoRoot, 'comando_verificacion: npm test\ntimeout_verificacion: 0\n');
+    const r = doctor(repoRoot);
+    assert.equal(por(r.comprobaciones, 'config').nivel, 'error');
+    assert.match(por(r.comprobaciones, 'config').mensaje, /timeout_verificacion/);
+    assert.equal(por(r.comprobaciones, 'verificacion').nivel, 'omitida');
+    assert.equal(r.codigo, 1);
+  });
+});
+
 test('doctor no escribe los avisos de la config en stderr (los da en su salida)', async () => {
   await conRepo(async (repoRoot) => {
     await config(repoRoot, 'clave_rara: 1\n');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-verificacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-verificacion.test.ts
new file mode 100644
index 0000000..088542d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-verificacion.test.ts
@@ -0,0 +1,112 @@
+/**
+ * TASK-070: las claves `comando_verificacion` y `timeout_verificacion`. Parte
+ * pura (parsearConfig) y resolverConfig contra un directorio temporal real.
+ * Quien ejecuta el comando (los frenos) llega con TASK-071/072.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import {
+  CLAVES_CONFIG,
+  CONFIG_DEFAULTS,
+  ConfigError,
+  parsearConfig,
+  parsearConfigConAvisos,
+  resolverConfig,
+} from '../../src/core/config.js';
+
+const RUTA = '/repo/.taskcode/config.yml';
+
+function rechaza(contenido: string, patron: RegExp): void {
+  assert.throws(
+    () => parsearConfig(contenido, RUTA),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError, String(e));
+      assert.match(e.message, patron);
+      return true;
+    },
+    `deberia rechazar:\n${contenido}`
+  );
+}
+
+test('verificacion: sin la clave, comando null (sin freno) y timeout 600 s', () => {
+  assert.equal(CONFIG_DEFAULTS.comando_verificacion, null);
+  assert.equal(CONFIG_DEFAULTS.timeout_verificacion, 600);
+  assert.ok((CLAVES_CONFIG as readonly string[]).includes('comando_verificacion'));
+  assert.ok((CLAVES_CONFIG as readonly string[]).includes('timeout_verificacion'));
+  const c = parsearConfig('limite_wip: 2\n', RUTA);
+  assert.equal(c.comando_verificacion, null);
+  assert.equal(c.timeout_verificacion, 600);
+});
+
+test('verificacion: el comando se conserva entero y recortado, tambien con espacios y "#" entrecomillado', () => {
+  assert.equal(parsearConfig('comando_verificacion: npm test\n', RUTA).comando_verificacion, 'npm test');
+  assert.equal(
+    parsearConfig('comando_verificacion: "  npm run test -- --grep \'#rapido\'  "\n', RUTA).comando_verificacion,
+    "npm run test -- --grep '#rapido'"
+  );
+  const c = parsearConfig('comando_verificacion: "cargo test"\ntimeout_verificacion: 1200\n', RUTA);
+  assert.equal(c.comando_verificacion, 'cargo test');
+  assert.equal(c.timeout_verificacion, 1200);
+});
+
+test('verificacion: un comando vacio o que no es texto aborta nombrando la clave y la linea', () => {
+  rechaza(
+    'limite_wip: 1\ncomando_verificacion:\n',
+    /config\.yml:2: "comando_verificacion" debe ser un comando[\s\S]*comando_verificacion: "npm test"/
+  );
+  rechaza('comando_verificacion: ""\n', /"comando_verificacion" debe ser un comando/);
+  rechaza('comando_verificacion: 42\n', /"comando_verificacion" debe ser un comando \(texto no vacio\), y es 42 \(number\)/);
+  rechaza('comando_verificacion: [npm, test]\n', /"comando_verificacion" debe ser un comando[\s\S]*una lista/);
+});
+
+test('verificacion: un timeout que no es entero >= 1 aborta (fallo cerrado, nunca el defecto en silencio)', () => {
+  for (const malo of ['0', '-5', '1.5', 'diez', '"600"']) {
+    rechaza(
+      `comando_verificacion: npm test\ntimeout_verificacion: ${malo}\n`,
+      /config\.yml:2: "timeout_verificacion" debe ser un numero entero[\s\S]*Por defecto es 600\. Son segundos: un 0 o un negativo cortarian la verificacion/
+    );
+  }
+});
+
+test('verificacion: el timeout sin comando no hace nada y aborta; la clave repetida tambien', () => {
+  rechaza('timeout_verificacion: 300\n', /"timeout_verificacion" sin "comando_verificacion" no hace nada/);
+  rechaza('comando_verificacion: npm test\ncomando_verificacion: cargo test\n', /"comando_verificacion" esta repetida/);
+});
+
+test('verificacion: los mensajes de sincronizacion no cambian al generalizar los validadores', () => {
+  rechaza(
+    'comando_sincronizacion:\nrutas_sincronizacion: [docs/PLAN.md]\n',
+    /"comando_sincronizacion" debe ser un comando[\s\S]*Ejemplo: comando_sincronizacion: "node scripts\/sincronizar-plan\.mjs"\. Si lleva "#"/
+  );
+  rechaza(
+    'comando_sincronizacion: x\nrutas_sincronizacion: [a.md]\ntimeout_sincronizacion: 0\n',
+    /Por defecto es 60\. Son segundos: un 0 o un negativo matarian el comando antes de empezar/
+  );
+});
+
+test('verificacion: una errata en la clave avisa con la sugerencia y no aborta', () => {
+  const { config, avisos } = parsearConfigConAvisos('comando_verificacon: npm test\n', RUTA);
+  assert.equal(config.comando_verificacion, null);
+  assert.equal(avisos.length, 1);
+  assert.match(avisos[0] as string, /clave desconocida "comando_verificacon"[\s\S]*Quiza quisiste decir "comando_verificacion"/);
+});
+
+test('verificacion: resolverConfig lee las claves del fichero real (CRLF y comentario de linea)', async () => {
+  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-verif-'));
+  try {
+    await mkdir(path.join(raiz, '.taskcode'));
+    await writeFile(
+      path.join(raiz, '.taskcode', 'config.yml'),
+      '# frenos\r\ncomando_verificacion: "npm test" # el de siempre\r\ntimeout_verificacion: 900\r\n',
+      'utf8'
+    );
+    const c = resolverConfig(raiz);
+    assert.equal(c.comando_verificacion, 'npm test');
+    assert.equal(c.timeout_verificacion, 900);
+  } finally {
+    await rm(raiz, { recursive: true, force: true });
+  }
+});
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-070/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-070/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-070/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                  | 16 ++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                      | 39 ++++++++++++++++++++++++++++++++++-----
 5 files changed, 52 insertions(+), 6 deletions(-)
````
