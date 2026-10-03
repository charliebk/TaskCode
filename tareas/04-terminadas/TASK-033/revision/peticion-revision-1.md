# Peticion de revision — TASK-033 (ronda 1)

- Tarea: TASK-033 — Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1)
- Rama revisada: fix/task-033-comando-de-sincronizacion-tras-cada-tran
- Rama base: develop
- Commit revisado (HEAD): 60b0ee6e71515a041ba63763b6290f092d22538f
- Fecha: 2026-10-03
- Agente revisor sugerido: general-purpose

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
60b0ee6 build(TASK-033): dist/src compilado para la distribucion 0.1.1
ac07f82 feat(TASK-033): comando de sincronizacion tras cada transicion, guia post-cierre y version 0.1.1
d3351c4 chore(TASK-033): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/.claude-plugin/marketplace.json b/.claude-plugin/marketplace.json
index c5d1a8b..ba8e410 100644
--- a/.claude-plugin/marketplace.json
+++ b/.claude-plugin/marketplace.json
@@ -5,14 +5,14 @@
     "url": "https://github.com/charliebk"
   },
   "description": "Marketplace privado de TaskCode: metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
-  "version": "0.1.0",
+  "version": "0.1.1",
   "plugins": [
     {
       "name": "taskcode-plugin",
       "displayName": "TaskCode",
       "source": "./taskcode-marketplace/plugins/taskcode-plugin",
       "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista. Expone el CLI taskctl.",
-      "version": "0.1.0",
+      "version": "0.1.1",
       "author": {
         "name": "charlie.bk"
       },
diff --git a/tareas/01-en-diseno/TASK-033/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md b/tareas/02-en-curso/TASK-033/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-033/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
rename to tareas/02-en-curso/TASK-033/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
diff --git a/tareas/01-en-diseno/TASK-033/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md b/tareas/02-en-curso/TASK-033/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-033/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
rename to tareas/02-en-curso/TASK-033/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
diff --git a/tareas/01-en-diseno/TASK-033/planificacion/brainstorm/peticion-unificador-1.md b/tareas/02-en-curso/TASK-033/planificacion/brainstorm/peticion-unificador-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-033/planificacion/brainstorm/peticion-unificador-1.md
rename to tareas/02-en-curso/TASK-033/planificacion/brainstorm/peticion-unificador-1.md
diff --git a/tareas/01-en-diseno/TASK-033/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md b/tareas/02-en-curso/TASK-033/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-033/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
rename to tareas/02-en-curso/TASK-033/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
diff --git a/tareas/01-en-diseno/TASK-033/planificacion/brainstorm/salida-brainstorm-riesgos-1.md b/tareas/02-en-curso/TASK-033/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-033/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
rename to tareas/02-en-curso/TASK-033/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
diff --git a/tareas/01-en-diseno/TASK-033/planificacion/plan-final.md b/tareas/02-en-curso/TASK-033/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-033/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-033/planificacion/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-033/tarea.md b/tareas/02-en-curso/TASK-033/tarea.md
similarity index 99%
rename from tareas/01-en-diseno/TASK-033/tarea.md
rename to tareas/02-en-curso/TASK-033/tarea.md
index e58d2a4..889ffba 100644
--- a/tareas/01-en-diseno/TASK-033/tarea.md
+++ b/tareas/02-en-curso/TASK-033/tarea.md
@@ -6,7 +6,7 @@ sprint: 0
 etiquetas: [plugin, config, skill, correccion]
 complejidad: media
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: fix/task-033-comando-de-sincronizacion-tras-cada-tran
 asignado_a: charlie.bk@gmail.com
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
index 12d59a8..eb90708 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
@@ -1,6 +1,6 @@
 {
   "name": "taskcode-plugin",
-  "version": "0.1.0",
+  "version": "0.1.1",
   "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
   "author": {
     "name": "charlie.bk"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 1728ca5..6cecbfb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -172,15 +172,15 @@ ejecución aplicado:
 
 ```
 $ node bin/taskctl --help
-taskctl 0.1.0 — TaskCode
+taskctl 0.1.1 — TaskCode
 [...]
 
 $ ./bin/taskctl --help          # ejecución directa vía shebang + bit +x
-taskctl 0.1.0 — TaskCode
+taskctl 0.1.1 — TaskCode
 [...]                            # salida idéntica
 
 $ PATH="$(pwd)/bin:$PATH" taskctl --version   # simula resolución por PATH
-0.1.0
+0.1.1
 
 $ PATH="$(pwd)/bin:$PATH" which taskctl
 .../taskcode-plugin/bin/taskctl
@@ -203,8 +203,8 @@ $ ls -la bin/taskctl          # tras un clon limpio, sin tocar permisos a mano
 -rwxr-xr-x 1 ... bin/taskctl
 
 $ node bin/taskctl --help     # OK
-$ ./bin/taskctl --version     # OK — 0.1.0
-$ PATH="$(pwd)/bin:$PATH" taskctl --version   # OK — 0.1.0, resuelto como comando suelto
+$ ./bin/taskctl --version     # OK — 0.1.1
+$ PATH="$(pwd)/bin:$PATH" taskctl --version   # OK — 0.1.1, resuelto como comando suelto
 ```
 
 El bit de ejecución sobrevive un `git clone` normal en un filesystem POSIX
@@ -298,7 +298,7 @@ $ claude plugin install taskcode-plugin@taskcode-marketplace
 | Pregunta | Respuesta |
 |---|---|
 | ¿El plugin se instala desde el marketplace? | **Sí**, `enabled`, scope `user` |
-| ¿`taskctl` arranca desde la caché, sin compilar? | **Sí**: `node <cache>/bin/taskctl --version` → `0.1.0` |
+| ¿`taskctl` arranca desde la caché, sin compilar? | **Sí**: `node <cache>/bin/taskctl --version` → `0.1.1` |
 | ¿La copia cacheada trae `dist/`? | Sí, **pero esta instalación no lo demuestra** — ver abajo |
 | ¿Claude Code instala las deps npm en la copia? | Sí, **pero no por la razón que parece** — ver abajo |
 | ¿Existe de verdad el mecanismo de `bin/` en PATH? | **Sí** — confirmado abajo |
@@ -340,11 +340,11 @@ la sesión y el plugin se instaló después — pero *eso no se ha comprobado*.
 Confirmarlo cuesta un comando en la siguiente sesión:
 
 ```bash
-taskctl --version   # deberia imprimir 0.1.0 sin ruta ni node delante
+taskctl --version   # deberia imprimir 0.1.1 sin ruta ni node delante
 ```
 
 Mientras tanto, lo que sí está probado es que el ejecutable de la caché es
-válido: con su directorio en el `PATH`, `taskctl --version` responde `0.1.0`.
+válido: con su directorio en el `PATH`, `taskctl --version` responde `0.1.1`.
 
 ### Segunda limitación, específica de este repo: `core.fileMode=false`
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
index ca43ec2..a3ca04e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
@@ -21,13 +21,14 @@ import { StateMachineError } from './core/state-machine.js';
 import { TaskFolderConflictError } from './fs/task-store.js';
 import { BaseBranchGuardError, GitCommandError, GitLaunchError, } from './fs/git.js';
 import { AutoCommitError } from './fs/git-commit.js';
+import { CODIGO_SINCRONIZACION_NO_APLICADA, sincronizacionNoAplicada, } from './fs/sincronizacion.js';
 // ConfigError se captura en los mismos catch que AutoCommitError
 // (integracion TASK-030): sin esto cae al catch-all de bin/taskctl y
 // sale como "[ERROR] taskctl no pudo arrancar: ...", que miente —
 // taskctl arranco bien, lo que esta mal es el .taskcode/config.yml
 // del repo.
 import { ConfigError } from './core/config.js';
-const VERSION = '0.1.0';
+const VERSION = '0.1.1';
 const HELP = `taskctl ${VERSION} — TaskCode
 
 Uso:
@@ -103,6 +104,8 @@ function printBaseBranchSwitchNotice(guard) {
  */
 function printAutoCommit(r) {
     printAvisos(...r.avisos);
+    if (sincronizacionNoAplicada(r.sincronizacion))
+        sincronizacionPendiente = true;
     if (r.commiteado) {
         const n = r.ficheros.length;
         process.stdout.write(`Commiteado ${r.commit} en "${r.rama}" (${n} fichero${n === 1 ? '' : 's'}).\n`);
@@ -214,7 +217,27 @@ function printAvisos(...avisos) {
             process.stderr.write(`[AVISO] ${aviso}\n`);
     }
 }
+/**
+ * true si algun auto-commit de esta invocacion hizo la transicion pero
+ * no pudo aplicar la sincronizacion configurada (TASK-033). Lo levanta
+ * printAutoCommit, que es por donde pasan los 8 comandos que
+ * commitean, y lo consume main(): un solo sitio, en vez de tocar cada
+ * `return 0`.
+ */
+let sincronizacionPendiente = false;
+/**
+ * Punto de entrada. Un 0 de un comando se convierte en
+ * CODIGO_SINCRONIZACION_NO_APLICADA (3) si la sincronizacion no se
+ * aplico: la transicion se hizo, pero quien lo lance (un agente, un
+ * script, un CI) tiene que enterarse sin leer stderr. Un error del
+ * comando (1) gana: es lo mas grave que ha pasado.
+ */
 export async function main(argv) {
+    sincronizacionPendiente = false;
+    const codigo = await mainComando(argv);
+    return codigo === 0 && sincronizacionPendiente ? CODIGO_SINCRONIZACION_NO_APLICADA : codigo;
+}
+async function mainComando(argv) {
     const cmd = argv[0];
     if (cmd === undefined || cmd === '--help' || cmd === '-h') {
         process.stdout.write(HELP);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js
index dcc395c..dc310e6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js
@@ -8,6 +8,16 @@
  * | rama_base                    | develop           | git.ts (feature/fix/release) |
  * | agente_revisor_por_defecto   | general-purpose   | new.ts, import.ts       |
  * | limite_wip                   | 1                 | wip.ts                  |
+ * | comando_sincronizacion       | null (desactivada)| fs/sincronizacion.ts    |
+ * | rutas_sincronizacion         | []                | fs/sincronizacion.ts    |
+ * | timeout_sincronizacion       | 60 (segundos)     | fs/sincronizacion.ts    |
+ *
+ * Las tres de sincronizacion las anadio TASK-033 (version 0.1.1): un
+ * proyecto que genera ficheros a partir del estado de las tareas (un
+ * plan, un tablero) los tenia desincronizados tras cada transicion, y
+ * el arreglo obvio —un hook de pre-commit— deja el indice sucio porque
+ * autoCommit commitea en modo `--only`. Van juntas: comando y rutas, o
+ * ninguna; el timeout solo con las otras dos.
  *
  * Lo que importa aqui no es el fichero, es la forma del mecanismo —
  * es lo que decide si anadir la cuarta clave cuesta una linea o una
@@ -59,13 +69,25 @@ export const CONFIG_DEFAULTS = Object.freeze({
     rama_base: 'develop',
     agente_revisor_por_defecto: 'general-purpose',
     limite_wip: 1,
+    comando_sincronizacion: null,
+    rutas_sincronizacion: Object.freeze([]),
+    timeout_sincronizacion: 60,
 });
 /** Las unicas claves admitidas. Cualquier otra aborta (regla 2). */
 export const CLAVES_CONFIG = [
     'rama_base',
     'agente_revisor_por_defecto',
     'limite_wip',
+    'comando_sincronizacion',
+    'rutas_sincronizacion',
+    'timeout_sincronizacion',
 ];
+/**
+ * Carpetas raiz donde una ruta de sincronizacion no puede vivir: las
+ * gestiona taskctl (tareas/, .taskcode/) o Git (.git/). Declarar algo
+ * ahi haria que el comando del proyecto y el CLI escribieran lo mismo.
+ */
+const RAICES_PROHIBIDAS_SINCRONIZACION = ['tareas', '.taskcode', '.git'];
 export const CONFIG_DIR = '.taskcode';
 export const CONFIG_FILE = 'config.yml';
 /**
@@ -164,7 +186,27 @@ export function resolverConfig(cwd) {
         throw new ConfigError(`[ERROR] No se pudo leer la configuracion "${ruta}": ${msg}\n` +
             '        Borrala o arregla sus permisos: taskctl no sigue sin saber que dice.');
     }
-    return parsearConfig(contenido, ruta);
+    const config = parsearConfig(contenido, ruta);
+    // Lo unico de las rutas de sincronizacion que necesita disco: que
+    // ninguna sea una carpeta existente. Con una carpeta, el
+    // `git add -A -- <ruta>` acotado se convierte en un barrido de todo
+    // lo que haya debajo, incluido trabajo de la persona.
+    const raiz = raizDelRepo(cwd);
+    for (const r of config.rutas_sincronizacion) {
+        let esCarpeta = false;
+        try {
+            esCarpeta = statSync(path.join(raiz, r)).isDirectory();
+        }
+        catch {
+            // No existe (todavia): legitimo, la creara el comando.
+        }
+        if (esCarpeta) {
+            throw new ConfigError(`[ERROR] ${ruta}: la ruta de sincronizacion "${r}" es una carpeta.\n` +
+                '        Declara los ficheros concretos que regenera el comando: con una carpeta, ' +
+                'el commit automatico se llevaria todo lo que hay dentro.');
+        }
+    }
+    return config;
 }
 /**
  * Separada de resolverConfig para poder probar el parseo y la
@@ -202,10 +244,105 @@ export function parsearConfig(contenido, ruta) {
             case 'limite_wip':
                 config.limite_wip = validarEnteroPositivo(donde, par.clave, par.valor);
                 break;
+            case 'comando_sincronizacion':
+                config.comando_sincronizacion = validarComando(donde, par.valor);
+                break;
+            case 'rutas_sincronizacion':
+                config.rutas_sincronizacion = validarRutasSincronizacion(donde, par.valor);
+                break;
+            case 'timeout_sincronizacion':
+                config.timeout_sincronizacion = validarEnteroPositivo(donde, par.clave, par.valor);
+                break;
         }
     }
+    validarSincronizacionCompleta(ruta, vistas);
     return config;
 }
+/**
+ * Las claves de sincronizacion van juntas. Un comando sin rutas
+ * declaradas no puede commitear nada (todo lo que tocara serian rutas
+ * ajenas), y unas rutas sin comando no las regenera nadie: las dos
+ * mitades sueltas son configuraciones que parecen hacer algo y no lo
+ * hacen. El timeout solo sin comando, igual.
+ */
+function validarSincronizacionCompleta(ruta, vistas) {
+    const comando = vistas.has('comando_sincronizacion');
+    const rutas = vistas.has('rutas_sincronizacion');
+    if (comando !== rutas) {
+        const presente = comando ? 'comando_sincronizacion' : 'rutas_sincronizacion';
+        const falta = comando ? 'rutas_sincronizacion' : 'comando_sincronizacion';
+        throw new ConfigError(`[ERROR] ${ruta}: "${presente}" necesita tambien "${falta}".\n` +
+            '        Van juntas: el comando que regenera los ficheros y la lista de ficheros que ' +
+            'regenera. Anade la que falta o borra las dos.');
+    }
+    if (vistas.has('timeout_sincronizacion') && !comando) {
+        throw new ConfigError(`[ERROR] ${ruta}: "timeout_sincronizacion" sin "comando_sincronizacion" no hace nada.\n` +
+            '        Borrala, o configura tambien el comando y sus rutas.');
+    }
+}
+/** El comando, recortado. No se interpreta: lo ejecuta el shell del sistema tal cual. */
+function validarComando(donde, valor) {
+    if (typeof valor !== 'string' || valor.trim() === '') {
+        throw new ConfigError(`[ERROR] ${donde}: "comando_sincronizacion" debe ser un comando (texto no vacio), ` +
+            `y es ${describirValor(valor)}.\n` +
+            '        Ejemplo: comando_sincronizacion: "node scripts/sincronizar-plan.mjs". ' +
+            'Si lleva "#", entrecomillalo entero.');
+    }
+    return valor.trim();
+}
+/**
+ * Lista flow de FICHEROS relativos a la raiz del repo. Se valida aqui,
+ * al cargar, y no al commitear: para entonces la tarea ya se ha movido
+ * y el comando ya se ha ejecutado, y un error tardio deja el workspace
+ * a medias (hallazgo del rol de riesgos en el brainstorm de TASK-033).
+ * normalizarRuta() en git-commit.ts sigue siendo la segunda barrera.
+ *
+ * Que la ruta no sea una carpeta no se puede saber sin disco: lo
+ * comprueba resolverConfig, que si lo tiene.
+ */
+function validarRutasSincronizacion(donde, valor) {
+    if (!Array.isArray(valor) || valor.length === 0) {
+        throw new ConfigError(`[ERROR] ${donde}: "rutas_sincronizacion" debe ser una lista no vacia entre corchetes, ` +
+            `y es ${describirValor(valor)}.\n` +
+            '        Ejemplo: rutas_sincronizacion: [docs/PLAN.md]. Las listas en bloque ' +
+            '("- ruta") no se admiten.');
+    }
+    const rutas = [];
+    for (const elemento of valor) {
+        if (typeof elemento !== 'string' || elemento.trim() === '') {
+            throw new ConfigError(`[ERROR] ${donde}: "rutas_sincronizacion" contiene un elemento vacio o que no es texto.`);
+        }
+        const original = elemento.trim();
+        const motivo = motivoRutaInvalida(original);
+        if (motivo !== null) {
+            throw new ConfigError(`[ERROR] ${donde}: la ruta de sincronizacion "${original}" no vale: ${motivo}.\n` +
+                '        Solo ficheros, relativos a la raiz del repo, fuera de tareas/, .taskcode/ ' +
+                'y .git/.');
+        }
+        const normalizada = path.posix.normalize(original.replace(/\\/g, '/'));
+        if (!rutas.includes(normalizada))
+            rutas.push(normalizada);
+    }
+    return rutas;
+}
+/** null si la ruta es aceptable; si no, el motivo en palabras de persona. */
+function motivoRutaInvalida(original) {
+    const conBarras = original.replace(/\\/g, '/');
+    if (conBarras.startsWith('/') || /^[A-Za-z]:/.test(conBarras))
+        return 'es absoluta';
+    if (conBarras.endsWith('/'))
+        return 'es una carpeta';
+    const normalizada = path.posix.normalize(conBarras);
+    if (normalizada === '.' || normalizada === '')
+        return 'es la raiz del repo';
+    if (normalizada === '..' || normalizada.startsWith('../'))
+        return 'se sale del repo';
+    const primera = normalizada.split('/')[0];
+    if (RAICES_PROHIBIDAS_SINCRONIZACION.includes(primera)) {
+        return `esta bajo ${primera}/, que no es del proyecto sino de la herramienta`;
+    }
+    return null;
+}
 /**
  * Enumera SIEMPRE las claves validas (criterio de la decision #9: el
  * mensaje dice que esta mal y cuales son las validas) y, si la escrita
@@ -279,10 +416,12 @@ function validarTextoNoVacio(donde, clave, valor) {
 /** Entero >= 1. Un limite de 0 no es "sin limite": es "no se puede trabajar". */
 function validarEnteroPositivo(donde, clave, valor) {
     if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1) {
+        const consecuencia = clave === 'limite_wip'
+            ? 'Un 0 o un negativo no significan "sin limite": impedirian arrancar cualquier tarea.'
+            : 'Son segundos: un 0 o un negativo matarian el comando antes de empezar.';
         throw new ConfigError(`[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 1, ` +
             `y es ${describirValor(valor)}.\n` +
-            `        Por defecto es ${CONFIG_DEFAULTS.limite_wip}. Un 0 o un negativo no ` +
-            'significan "sin limite": impedirian arrancar cualquier tarea.');
+            `        Por defecto es ${CONFIG_DEFAULTS[clave]}. ${consecuencia}`);
     }
     return valor;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js
index 25b8b97..0e23467 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js
@@ -46,7 +46,9 @@
  */
 import { existsSync } from 'node:fs';
 import path from 'node:path';
+import { resolverConfig } from '../core/config.js';
 import { GitCommandError, currentBranch, isRemoteAvailable, runGit } from './git.js';
+import { ejecutarSincronizacion, SIN_SINCRONIZACION, } from './sincronizacion.js';
 export class AutoCommitError extends Error {
 }
 /**
@@ -128,9 +130,22 @@ export function autoCommit(opts) {
     const { cwd } = opts;
     const avisos = [];
     const rama = currentBranch(cwd);
+    // Las rutas del propio comando se validan ANTES de sincronizar: un
+    // error de programacion aqui no debe llegar a ejecutar nada.
+    const rutasComando = opts.rutas.map((r) => normalizarRuta(cwd, r));
+    // TASK-033: el comando de sincronizacion del proyecto corre aqui, con
+    // los ficheros de la tarea ya escritos y antes del primer `git add`,
+    // para que sus rutas entren en ESTE commit y el indice real quede
+    // limpio. Nunca aborta la transicion (ver sincronizacion.ts). Si el
+    // comando no escribio nada de la tarea, no hay estado nuevo que
+    // sincronizar y no se lanza.
+    const sincronizacion = rutasComando.length === 0 ? SIN_SINCRONIZACION : sincronizar(opts);
+    avisos.push(...sincronizacion.avisos);
     // Deduplicadas y ordenadas para que el commando de Git sea
     // determinista (y los tests puedan aseverar sobre el).
-    const rutasRel = [...new Set(opts.rutas.map((r) => normalizarRuta(cwd, r)))].sort();
+    const rutasRel = [
+        ...new Set([...rutasComando, ...sincronizacion.rutas.map((r) => normalizarRuta(cwd, r))]),
+    ].sort();
     const presentes = rutasRel.filter((r) => tieneAlgoQuePreparar(cwd, r));
     let commiteado = false;
     let commit = null;
@@ -192,7 +207,36 @@ export function autoCommit(opts) {
             }
         }
     }
-    return { commiteado, commit, ficheros, rama, push: empujar(opts, rama, avisos), avisos };
+    return {
+        commiteado,
+        commit,
+        ficheros,
+        rama,
+        push: empujar(opts, rama, avisos),
+        sincronizacion,
+        avisos,
+    };
+}
+/**
+ * Cualquier excepcion de la sincronizacion (config ilegible a estas
+ * alturas, un `git status` que falla) se convierte en 'fallida': para
+ * cuando se llega aqui la tarea ya esta escrita, y en `finish` el merge
+ * ya esta hecho. Abortar dejaria el estado a medias sin reintento.
+ */
+function sincronizar(opts) {
+    try {
+        return ejecutarSincronizacion(opts.cwd, resolverConfig(opts.cwd), opts.sincronizacion);
+    }
+    catch (e) {
+        return {
+            estado: 'fallida',
+            rutas: [],
+            avisos: [
+                `No se pudo ejecutar la sincronizacion configurada: ${detalleDeError(e)}. La ` +
+                    'tarea se ha commiteado sin ella; revisa .taskcode/config.yml y sincroniza a mano.',
+            ],
+        };
+    }
 }
 /**
  * `--push` empuja la RAMA ACTUAL, se haya commiteado algo en esta
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sincronizacion.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sincronizacion.js
new file mode 100644
index 0000000..5652adc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sincronizacion.js
@@ -0,0 +1,269 @@
+/**
+ * Sincronizacion de ficheros derivados — TASK-033 (version 0.1.1).
+ *
+ * Un proyecto que genera ficheros a partir del estado de las tareas (un
+ * plan con una tabla de seguimiento, un tablero propio) los tenia
+ * desincronizados tras CADA transicion: los commits automaticos mueven
+ * la tarea, pero no pueden saber que ese fichero existe. El arreglo
+ * obvio desde el proyecto —un hook de pre-commit que regenere y haga
+ * `git add`— no funciona con taskctl: autoCommit commitea en modo
+ * `--only` (`git commit -- <rutas>`), el `git add` del hook va al indice
+ * temporal y el indice real se queda con el contenido viejo. Despues del
+ * commit, `git status` marca `MM` y el SIGUIENTE comando aborta en el
+ * guard de la 8.3. Reproducido, no supuesto.
+ *
+ * Asi que el comando lo ejecuta taskctl, dentro de autoCommit y antes
+ * del primer `git add`, y sus rutas entran en el mismo commit que la
+ * tarea. Lo configuran tres claves de `.taskcode/config.yml`
+ * (config.ts); sin ellas, aqui no se hace nada, ni un spawn.
+ *
+ * La regla que manda, decidida al aprobar el plan: **la transicion
+ * NUNCA se aborta por la sincronizacion**. En `finish` el merge ya esta
+ * hecho cuando se llega aqui; abortar dejaria la tarea movida sin
+ * commitear y sin camino de reintento (riesgo 1 del brainstorm). Los
+ * tres desenlaces en que la sincronizacion no se aplica commitean la
+ * tarea igual, avisan y hacen que el CLI salga con
+ * CODIGO_SINCRONIZACION_NO_APLICADA:
+ *
+ *   (a) una ruta declarada ya tenia cambios: no se ejecuta, porque
+ *       commitearla meteria trabajo de la persona en un commit
+ *       automatico;
+ *   (b) el comando falla o expira: las rutas declaradas vuelven a HEAD
+ *       (estaban limpias por (a), asi que no se pierde nada);
+ *   (c) el comando toco ficheros no declarados: esos no se tocan y se
+ *       nombran; las rutas declaradas si se commitean.
+ */
+import { createHash } from 'node:crypto';
+import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { raizDelRepo } from '../core/config.js';
+import { runGit } from './git.js';
+/**
+ * Codigo de salida del CLI cuando la transicion se hizo pero la
+ * sincronizacion no se aplico. Distinto de 1 (el comando fallo) a
+ * proposito: quien lo lea tiene que poder distinguir "no reintentes,
+ * sincroniza a mano" de "no ha pasado nada".
+ */
+export const CODIGO_SINCRONIZACION_NO_APLICADA = 3;
+/** true si el desenlace debe hacer que el CLI salga con CODIGO_SINCRONIZACION_NO_APLICADA. */
+export function sincronizacionNoAplicada(r) {
+    return r.estado !== 'no-configurada' && r.estado !== 'aplicada';
+}
+export const SIN_SINCRONIZACION = Object.freeze({
+    estado: 'no-configurada',
+    rutas: Object.freeze([]),
+    avisos: Object.freeze([]),
+});
+export function ejecutarSincronizacion(cwd, config, opciones = {}) {
+    const comando = config.comando_sincronizacion;
+    if (comando === null)
+        return SIN_SINCRONIZACION;
+    const raiz = raizDelRepo(cwd);
+    const declaradas = config.rutas_sincronizacion;
+    const absolutas = declaradas.map((r) => path.join(raiz, r));
+    const aMano = `Cuando lo resuelvas, ejecuta a mano "${comando}" y commitea ${declaradas.join(', ')}. ` +
+        'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.';
+    // (a) Antes de nada: si una ruta declarada ya trae cambios, el
+    // commit automatico se los llevaria. `start`, `review` y `finish` no
+    // exigen workspace limpio, asi que esto es un caso real.
+    const conCambios = porcelain(raiz, declaradas);
+    if (conCambios.length > 0) {
+        return {
+            estado: 'omitida-rutas-con-cambios',
+            rutas: [],
+            avisos: [
+                `No se ha ejecutado la sincronizacion: ${conCambios.join(', ')} ya tenia(n) cambios ` +
+                    'sin commitear, y el commit automatico los habria incluido. Commitealos o ' +
+                    `descartalos. ${aMano}`,
+            ],
+        };
+    }
+    const antes = fotoDelArbol(raiz);
+    const timeoutMs = opciones.timeoutMs ?? config.timeout_sincronizacion * 1000;
+    // El comando no se lanza directamente: lo lanza ENVOLTORIO, un node
+    // hijo que es quien aplica el timeout. Con un `spawnSync(comando, {
+    // shell: true, timeout })` a pelo, el timeout mata a cmd.exe pero en
+    // Windows el `node` nieto SIGUE VIVO y puede seguir escribiendo el
+    // derivado despues de que lo hayamos restaurado (riesgo 6 del
+    // brainstorm; reproducido: el test del timeout dejaba la carpeta del
+    // repo bloqueada con EBUSY). El envoltorio mata el arbol entero.
+    //
+    // stdin ignorado SIEMPRE: con una tuberia heredada que nadie cierra
+    // (un arnes de agente, `node --test`) un script que pregunte algo
+    // esperaria para siempre. Con EOF, falla y se va por (b).
+    const r = spawnSync(process.execPath, ['-e', ENVOLTORIO, comando, String(timeoutMs)], {
+        cwd: raiz,
+        stdio: ['ignore', 'pipe', 'pipe'],
+        encoding: 'utf8',
+        // Red de seguridad por si el propio envoltorio se colgara.
+        timeout: timeoutMs + 15000,
+        windowsHide: true,
+        maxBuffer: 16 * 1024 * 1024,
+    });
+    const fallo = describirFallo(r, timeoutMs);
+    if (fallo !== null) {
+        restaurarAHead(raiz, declaradas);
+        return {
+            estado: 'fallida',
+            rutas: [],
+            avisos: [
+                `La sincronizacion "${comando}" ${fallo}. ${declaradas.join(', ')} se ha(n) dejado ` +
+                    `como en HEAD y la tarea se ha commiteado sin ella(s). ${aMano}`,
+            ],
+        };
+    }
+    const despues = fotoDelArbol(raiz);
+    const declaradasSet = new Set(declaradas);
+    const ajenas = [...new Set([...antes.keys(), ...despues.keys()])]
+        .filter((f) => !declaradasSet.has(f) && antes.get(f) !== despues.get(f))
+        .sort();
+    if (ajenas.length > 0) {
+        return {
+            estado: 'rutas-ajenas',
+            rutas: absolutas,
+            avisos: [
+                `La sincronizacion "${comando}" ha modificado ficheros que no estan en ` +
+                    `rutas_sincronizacion: ${ajenas.join(', ')}. No se han commiteado ni tocado: ` +
+                    'revisalos. Si los genera el comando a proposito, anadelos a rutas_sincronizacion; ' +
+                    'si no, el siguiente comando de taskctl puede abortar por workspace sucio.',
+            ],
+        };
+    }
+    return { estado: 'aplicada', rutas: absolutas, avisos: [] };
+}
+/** Codigo con el que ENVOLTORIO dice "lo he cortado por timeout". */
+const CODIGO_TIMEOUT_ENVOLTORIO = 124;
+/**
+ * Ejecuta argv[1] con el shell del sistema y lo corta a los argv[2] ms.
+ *
+ * - shell: true en las dos plataformas: cmd.exe en Windows (necesario
+ *   para resolver `pnpm.cmd` / `npm.cmd`; sin shell, ENOENT — el fallo
+ *   que costo una ronda en codex-review) y /bin/sh en POSIX. El comando
+ *   es entero de la persona y no se le interpola nada, asi que no se
+ *   escapa: escaparlo cambiaria lo que escribio.
+ * - Al vencer el timeout mata el ARBOL: `taskkill /T /F` en Windows
+ *   (con el hijo aun vivo, que es cuando /T puede recorrerlo) y el
+ *   grupo de procesos en POSIX (por eso `detached`).
+ * - Sale con el codigo del comando, o con 124 (como `timeout(1)`) si lo
+ *   corto.
+ */
+const ENVOLTORIO = `
+const { spawn, spawnSync } = require('node:child_process');
+const [comando, ms] = process.argv.slice(1);
+const win = process.platform === 'win32';
+const hijo = spawn(comando, { shell: true, stdio: ['ignore', 'inherit', 'inherit'],
+  windowsHide: true, detached: !win });
+let cortado = false;
+const t = setTimeout(() => {
+  cortado = true;
+  if (win) spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
+  else { try { process.kill(-hijo.pid, 'SIGKILL'); } catch {} }
+}, Number(ms));
+hijo.on('error', (e) => { clearTimeout(t); process.stderr.write(String(e.message)); process.exit(127); });
+hijo.on('close', (code, signal) => {
+  clearTimeout(t);
+  if (cortado) process.exit(${String(CODIGO_TIMEOUT_ENVOLTORIO)});
+  process.exit(code === null ? 128 : code);
+});
+`;
+/** null si el comando termino bien; si no, que le paso, en palabras de persona. */
+function describirFallo(r, timeoutMs) {
+    const corte = `no termino en ${String(Math.round(timeoutMs / 1000))} s y se ha cortado`;
+    if (r.error !== undefined) {
+        if (r.error.code === 'ETIMEDOUT')
+            return corte;
+        return `no se pudo ejecutar (${r.error.message})`;
+    }
+    if (r.status === CODIGO_TIMEOUT_ENVOLTORIO)
+        return corte;
+    if (r.signal !== null)
+        return `termino por la senal ${r.signal}`;
+    if (r.status !== 0) {
+        const stderr = String(r.stderr ?? '').trim();
+        const cola = stderr === '' ? '' : `: ${ultimasLineas(stderr, 5)}`;
+        return `salio con codigo ${String(r.status)}${cola}`;
+    }
+    return null;
+}
+function ultimasLineas(texto, n) {
+    return texto.split(/\r?\n/).slice(-n).join(' | ');
+}
+/** Rutas (de las dadas) con cambios respecto a HEAD, incluidas las no trackeadas. */
+function porcelain(raiz, rutas) {
+    const salida = runGit(['status', '--porcelain', '--untracked-files=all', '--', ...rutas], raiz);
+    return salida
+        .split('\n')
+        .map((l) => l.trim())
+        .filter((l) => l !== '')
+        .map((l) => l.slice(l.indexOf(' ') + 1).trim());
+}
+/**
+ * Foto de lo que NO esta limpio en el arbol: ruta -> huella del
+ * contenido. Comparar solo el porcelain no basta (hallazgo del rol de
+ * riesgos): un fichero que ya estaba en ` M` por trabajo de la persona
+ * sigue en ` M` aunque el comando lo reescriba. Por eso se compara el
+ * contenido, y solo de lo que ya esta sucio (lo limpio, si cambia,
+ * aparece nuevo en la segunda foto).
+ */
+function fotoDelArbol(raiz) {
+    // Sin runGit a proposito: recorta la salida, y el recorte se come el
+    // espacio inicial de la primera entrada (" M ruta"), desplazando la
+    // ruta un caracter.
+    const r = spawnSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
+        cwd: raiz,
+        encoding: 'utf8',
+        maxBuffer: 64 * 1024 * 1024,
+    });
+    if (r.status !== 0) {
+        throw new Error(`git status fallo al sincronizar: ${String(r.stderr ?? '').trim()}`);
+    }
+    const salida = r.stdout ?? '';
+    const foto = new Map();
+    const entradas = salida.split('\0');
+    for (let i = 0; i < entradas.length; i++) {
+        const e = entradas[i];
+        if (e.length < 4)
+            continue;
+        const xy = e.slice(0, 2);
+        const ruta = e.slice(3);
+        // En un renombrado, -z pone la ruta de origen en la entrada
+        // siguiente: se salta para no tomarla por un fichero aparte.
+        if (xy.includes('R') || xy.includes('C'))
+            i++;
+        foto.set(ruta, huella(path.join(raiz, ruta)));
+    }
+    return foto;
+}
+function huella(fichero) {
+    try {
+        if (!statSync(fichero).isFile())
+            return 'no-fichero';
+        return createHash('sha1').update(readFileSync(fichero)).digest('hex');
+    }
+    catch {
+        return 'ausente';
+    }
+}
+/**
+ * (b) Deja cada ruta declarada como en HEAD. Estaban limpias antes de
+ * ejecutar (lo garantiza (a)), asi que lo unico que se deshace es lo
+ * que escribio el comando: si existia en HEAD se restaura, y si no
+ * existia el fichero lo creo el comando y se borra.
+ */
+function restaurarAHead(raiz, rutas) {
+    for (const r of rutas) {
+        const enHead = runGitOk(['cat-file', '-e', `HEAD:${r}`], raiz);
+        if (enHead) {
+            runGit(['checkout', 'HEAD', '--', r], raiz);
+        }
+        else {
+            const abs = path.join(raiz, r);
+            if (existsSync(abs))
+                rmSync(abs, { force: true });
+        }
+    }
+}
+function runGitOk(args, cwd) {
+    return spawnSync('git', args, { cwd, encoding: 'utf8' }).status === 0;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/package-lock.json b/taskcode-marketplace/plugins/taskcode-plugin/package-lock.json
index a3ec96a..947529b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/package-lock.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/package-lock.json
@@ -1,12 +1,12 @@
 {
   "name": "taskcode-plugin",
-  "version": "0.1.0",
+  "version": "0.1.1",
   "lockfileVersion": 3,
   "requires": true,
   "packages": {
     "": {
       "name": "taskcode-plugin",
-      "version": "0.1.0",
+      "version": "0.1.1",
       "bin": {
         "taskctl": "bin/taskctl"
       },
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/package.json b/taskcode-marketplace/plugins/taskcode-plugin/package.json
index 76aebd8..627f360 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/package.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/package.json
@@ -1,6 +1,6 @@
 {
   "name": "taskcode-plugin",
-  "version": "0.1.0",
+  "version": "0.1.1",
   "description": "TaskCode: metodologia de tareas/sprints + Git-Flow + revision por pares de agentes, como plugin de Claude Code.",
   "private": true,
   "type": "module",
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index b657729..d26bd66 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -183,6 +183,151 @@ hecho.
 error que no propone el siguiente paso deja al lector adivinando. Y un mensaje
 que ha dejado de ser cierto es peor que no tenerlo.
 
+## Configuracion de sincronizacion (`.taskcode/config.yml`)
+
+Los artefactos derivados del estado de las tareas (un plan generado, un
+tablero sintetizado) se pueden regenerar automaticamente despues de cada
+transicion de tarea. Para eso, el proyecto declara en `.taskcode/config.yml`
+un comando que reescribe esos ficheros y la lista de rutas que modifica.
+
+**Tres claves opcionales, en `.taskcode/config.yml`:**
+
+- **`comando_sincronizacion`**: el comando que el proyecto ejecuta para
+  regenerar sus ficheros derivados. Ejemplo: `"node scripts/sincronizar-plan.mjs"`.
+- **`rutas_sincronizacion`**: lista de ficheros que ese comando reescribe,
+  en sintaxis flow (entre corchetes): `[docs/PLAN.md, docs/BOARD.md]`. Rutas
+  relativas a la raiz del repo, siempre ficheros, nunca carpetas ni la raiz
+  del repo. No pueden estar bajo `tareas/` ni bajo `.taskcode/`.
+- **`timeout_sincronizacion`**: numero de segundos (entero ≥ 1) para esperar
+  al comando. Opcional; por defecto, 60 segundos. Solo es valida si estan las
+  otras dos claves.
+
+**Reglas de declaracion:**
+
+- Las dos primeras claves van juntas o no van: si una existe, la otra debe
+  existir tambien. La tercera es opcional.
+- Una clave mal escrita o un valor invalido aborta **todos** los comandos de
+  `taskctl` que lean config, con un error que enumera las claves validas.
+- Sin estas claves, el comportamiento es identico al actual: no se ejecuta nada
+  en la sincronizacion.
+
+**Como funciona:**
+
+Los ocho comandos que hacen un commit automatico (`new`, `import`, `plan`,
+`approve`, `start`, `review`, `finish`, `codex-review`) siguen este flujo:
+
+1. Escriben sus cambios en `tareas/`.
+2. **Ejecutan el comando de sincronizacion** (si esta declarado).
+3. Incluyen las rutas sincronizadas en el mismo commit (`git commit -m <msg> -- <rutas de tarea> <rutas sincronizadas>`).
+4. Terminan la transicion.
+
+Sin esperar a commits manuales posteriores: los ficheros derivados entran en el
+mismo commit que la tarea, asi que `git show HEAD` muestra siempre el derivado
+sincronizado con el estado de la tarea.
+
+**Ejecucion del comando:**
+
+- Se lanza con el shell del sistema (`cmd.exe` en Windows, `/bin/sh` en
+  POSIX), desde la raiz del repo, sin stdin (`'ignore'`).
+- Forma portable recomendada: `node <script>` en lugar de, por ejemplo,
+  `VAR=1 comando` o comillas simples. Los scripts con estos patrones no
+  funcionan igual en todos los shells.
+- Si el comando contiene ` #`, entrecomillarlo entero en `config.yml`: sin
+  comillas, el propio fichero de configuracion toma lo que sigue como
+  comentario y el comando llega truncado.
+
+**Cuando el comando falla o toca ficheros no declarados:**
+
+La transicion de la tarea **nunca se aborta** por la sincronizacion. Hay tres
+casos en que no se aplica:
+
+1. **Una ruta declarada ya tenia cambios sin commitear** antes del comando:
+   se salta la ejecucion para no meter trabajo ajeno en el commit. La tarea se
+   commitea igual.
+2. **El comando falla** (`exit ≠ 0`) **o supera el timeout**: las rutas
+   declaradas se dejan como en `HEAD` (sin aplicar sus cambios). La tarea se
+   commitea igual.
+3. **El comando modifico ficheros no declarados** en `rutas_sincronizacion`:
+   esos ficheros no se commitean ni se tocan, y se nombran en el aviso. Las
+   rutas declaradas si entran en el commit.
+
+En los tres casos, `taskctl` avisa por stderr y sale con **codigo 3** (no 1):
+la transicion se hizo, pero la sincronizacion no. Un 1 sigue significando que
+el comando de `taskctl` fallo. El aviso
+dice explicitamente que la transicion **ya se hizo**, que no se reintente el
+comando de `taskctl`, y qué hacer a continuacion (regenerar a mano, limpiar el
+workspace, o actualizar el config).
+
+**Tres trampas:**
+
+- **No usar un hook de pre-commit en su lugar.** Los commits automaticos son
+  de rutas concretas; en ese modo, el `git add` de un hook entra en el commit
+  pero el indice real se queda con el contenido viejo (`MM` en `git status`), y
+  el siguiente comando aborta por workspace sucio. Para eso existen estas
+  claves.
+- **Conflictos en lineas de recuento.** Si el fichero derivado tiene lineas de
+  recuento (por ejemplo, "5 tareas pendientes"), los merges de `review` o
+  `finish` pueden chocar en ellas cuando hay mas de una tarea viva. Se resuelve
+  regenerando el fichero derivado con el comando a mano, despues haciendo `git
+  add <ruta>` y continuando el merge: `git merge --continue`.
+- **Seguridad: el comando sale del config de tu repo.** Una rama que cambie
+  `.taskcode/config.yml` decide que comando se ejecuta en tu maquina cuando
+  alguien hace `finish` o `review`. Revisa los cambios a `config.yml` en la
+  revision por pares como si fueran codigo de confianza: potencialmente lo es.
+
+**Compatibilidad con versiones anteriores del plugin:**
+
+Un plugin anterior a 0.1.1 no conoce estas claves y aborta todos sus comandos
+al leerlas. **Todo el equipo actualiza el plugin ANTES de anadirlas.**
+
+## Criterios verificables tras el cierre (post-finish)
+
+Algunos criterios de aceptacion solo se pueden demostrar despues de que
+`taskctl finish` fusione la rama en la rama base: un CI que pase en verde tras
+el merge, una publicacion en produccion desde esa rama, o una ejecucion en vivo
+que dependa del merge realizado. Esos criterios **no se pueden marcar antes de
+cerrar la tarea**.
+
+**Como declararlos en `tarea.md`:**
+
+Dentro de la seccion `## Criterios de aceptacion`, añade una subseccion
+`### Tras el cierre` para los que solo se verifican despues de `finish`:
+
+```markdown
+## Criterios de aceptacion
+
+(Criterios normales que se verifican antes de finish)
+- [ ] El parser acepta ficheros UTF-8 con BOM.
+- [ ] La sintaxis de error da consejos especificos.
+
+### Tras el cierre
+
+(Se verifican despues de finish, en la rama base)
+- [ ] La rama base pasa el CI a verde.
+- [ ] La documentacion se publica automaticamente en main.
+```
+
+**Reglas:**
+
+- Los criterios normales **deben estar todos marcados antes de `finish`**.
+  `finish` no lee las casillas: lo comprueba quien cierra y el revisor.
+- Los de "Tras el cierre" no cuentan para cerrar.
+- Despues de cerrar, quien lanzo `finish` verifica esos criterios en la rama
+  base mientras se resuelven los detalles de publicacion o despliegue.
+- La evidencia de que pasaron se registra en **un commit posterior**, en la
+  seccion `## Resultado` de la tarea en su carpeta de terminadas (o en el
+  registro de progreso del proyecto si la estructura es distinta).
+
+**Si un criterio post-cierre falla:**
+
+No se reabre la tarea ya cerrada. En su lugar:
+
+1. Documenta el fallo en el `## Resultado` de la tarea cerrada: qué
+   criterio fallo, por que, y que evidencia se recopilo.
+2. Abre una tarea **nueva de tipo `fix`** (en `00-planificadas/`) que corrija
+   el problema. Referencia la tarea original en su descripcion.
+3. Sigue el flujo normal: `plan`, `approve`, `start`, revision, `finish`.
+
 ## El brainstorm de la fase de diseno
 
 `plan` no redacta el plan: deja preparado el material para que lo redacten
@@ -304,11 +449,10 @@ si el workspace estaba limpio, asi que **se ensuciaban el workspace ellos
 mismos** y el comando de reanudar quedaba inservible en cualquier repo que no
 ignorara esa ruta. No hace falta anadir nada al `.gitignore`.
 
-**La herramienta no commitea lo que genera.** Consecuencia directa: `import`
-no se puede ejecutar dos veces seguidas sin commitear en medio, porque lo que
-genero la primera vez deja el workspace sucio y el guard aborta la segunda. Y
-los ficheros que se le pasen a `import` tienen que vivir **fuera** del repo:
-dentro, ensucian el workspace y abortan el propio import.
+**La herramienta commitea solo lo que escribe** (mas las rutas de
+sincronizacion, si las hay): nunca un `git add` global. Los ficheros que se le
+pasen a `import` tienen que vivir **fuera** del repo: dentro, ensucian el
+workspace y abortan el propio import.
 
 **Los comandos que escriben en `tareas/` exigen estar en la rama base.** Son
 `new`, `import`, `plan` y `approve`. Si el workspace esta limpio **cambian de
@@ -342,7 +486,9 @@ en local y cae en el CI de la otra plataforma.
 3. Criterios de aceptacion marcados en `tarea.md`, y seccion `## Resultado`
    con que se implemento, que encontro la revision, que se corrigio y que se
    dejo sin corregir. Es el unico sitio donde queda la experiencia: el diff no
-   la cuenta.
+   la cuenta. (Nota: si existen criterios bajo "Tras el cierre", se verifican
+   despues de `finish` — ver "Criterios verificables tras el cierre
+   (post-finish)".)
 4. Actualizar el registro de progreso que use el proyecto.
 5. `taskctl finish`.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 6c88087..c5b519e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -30,6 +30,10 @@ import {
   type BaseBranchGuardResult,
 } from './fs/git.js';
 import { AutoCommitError, type AutoCommitResult } from './fs/git-commit.js';
+import {
+  CODIGO_SINCRONIZACION_NO_APLICADA,
+  sincronizacionNoAplicada,
+} from './fs/sincronizacion.js';
 // ConfigError se captura en los mismos catch que AutoCommitError
 // (integracion TASK-030): sin esto cae al catch-all de bin/taskctl y
 // sale como "[ERROR] taskctl no pudo arrancar: ...", que miente —
@@ -37,7 +41,7 @@ import { AutoCommitError, type AutoCommitResult } from './fs/git-commit.js';
 // del repo.
 import { ConfigError } from './core/config.js';
 
-const VERSION = '0.1.0';
+const VERSION = '0.1.1';
 
 const HELP = `taskctl ${VERSION} — TaskCode
 
@@ -119,6 +123,7 @@ function printBaseBranchSwitchNotice(guard: BaseBranchGuardResult): void {
  */
 function printAutoCommit(r: AutoCommitResult): void {
   printAvisos(...r.avisos);
+  if (sincronizacionNoAplicada(r.sincronizacion)) sincronizacionPendiente = true;
   if (r.commiteado) {
     const n = r.ficheros.length;
     process.stdout.write(
@@ -242,7 +247,29 @@ function printAvisos(...avisos: readonly (string | null | undefined)[]): void {
   }
 }
 
+/**
+ * true si algun auto-commit de esta invocacion hizo la transicion pero
+ * no pudo aplicar la sincronizacion configurada (TASK-033). Lo levanta
+ * printAutoCommit, que es por donde pasan los 8 comandos que
+ * commitean, y lo consume main(): un solo sitio, en vez de tocar cada
+ * `return 0`.
+ */
+let sincronizacionPendiente = false;
+
+/**
+ * Punto de entrada. Un 0 de un comando se convierte en
+ * CODIGO_SINCRONIZACION_NO_APLICADA (3) si la sincronizacion no se
+ * aplico: la transicion se hizo, pero quien lo lance (un agente, un
+ * script, un CI) tiene que enterarse sin leer stderr. Un error del
+ * comando (1) gana: es lo mas grave que ha pasado.
+ */
 export async function main(argv: readonly string[]): Promise<number> {
+  sincronizacionPendiente = false;
+  const codigo = await mainComando(argv);
+  return codigo === 0 && sincronizacionPendiente ? CODIGO_SINCRONIZACION_NO_APLICADA : codigo;
+}
+
+async function mainComando(argv: readonly string[]): Promise<number> {
   const cmd = argv[0];
 
   if (cmd === undefined || cmd === '--help' || cmd === '-h') {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index ac21b72..51d659a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -8,6 +8,16 @@
  * | rama_base                    | develop           | git.ts (feature/fix/release) |
  * | agente_revisor_por_defecto   | general-purpose   | new.ts, import.ts       |
  * | limite_wip                   | 1                 | wip.ts                  |
+ * | comando_sincronizacion       | null (desactivada)| fs/sincronizacion.ts    |
+ * | rutas_sincronizacion         | []                | fs/sincronizacion.ts    |
+ * | timeout_sincronizacion       | 60 (segundos)     | fs/sincronizacion.ts    |
+ *
+ * Las tres de sincronizacion las anadio TASK-033 (version 0.1.1): un
+ * proyecto que genera ficheros a partir del estado de las tareas (un
+ * plan, un tablero) los tenia desincronizados tras cada transicion, y
+ * el arreglo obvio —un hook de pre-commit— deja el indice sucio porque
+ * autoCommit commitea en modo `--only`. Van juntas: comando y rutas, o
+ * ninguna; el timeout solo con las otras dos.
  *
  * Lo que importa aqui no es el fichero, es la forma del mecanismo —
  * es lo que decide si anadir la cuarta clave cuesta una linea o una
@@ -64,6 +74,19 @@ export interface TaskcodeConfig {
   agente_revisor_por_defecto: string;
   /** Cuantas tareas puede tener una persona a la vez en 02-en-curso + 03-en-revision. */
   limite_wip: number;
+  /**
+   * Comando del proyecto que regenera ficheros derivados del estado de
+   * las tareas. null = sincronizacion desactivada (lo de siempre).
+   */
+  comando_sincronizacion: string | null;
+  /**
+   * Ficheros que reescribe ese comando, relativos a la raiz del repo y
+   * con separadores POSIX. Entran en el mismo commit automatico que la
+   * tarea. Vacio si y solo si no hay comando.
+   */
+  rutas_sincronizacion: readonly string[];
+  /** Segundos que se le dejan al comando antes de matarlo. */
+  timeout_sincronizacion: number;
 }
 
 /**
@@ -76,6 +99,9 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   rama_base: 'develop',
   agente_revisor_por_defecto: 'general-purpose',
   limite_wip: 1,
+  comando_sincronizacion: null,
+  rutas_sincronizacion: Object.freeze([]) as readonly string[],
+  timeout_sincronizacion: 60,
 });
 
 /** Las unicas claves admitidas. Cualquier otra aborta (regla 2). */
@@ -83,8 +109,18 @@ export const CLAVES_CONFIG = [
   'rama_base',
   'agente_revisor_por_defecto',
   'limite_wip',
+  'comando_sincronizacion',
+  'rutas_sincronizacion',
+  'timeout_sincronizacion',
 ] as const;
 
+/**
+ * Carpetas raiz donde una ruta de sincronizacion no puede vivir: las
+ * gestiona taskctl (tareas/, .taskcode/) o Git (.git/). Declarar algo
+ * ahi haria que el comando del proyecto y el CLI escribieran lo mismo.
+ */
+const RAICES_PROHIBIDAS_SINCRONIZACION = ['tareas', '.taskcode', '.git'] as const;
+
 export const CONFIG_DIR = '.taskcode';
 export const CONFIG_FILE = 'config.yml';
 
@@ -186,7 +222,28 @@ export function resolverConfig(cwd: string): TaskcodeConfig {
         '        Borrala o arregla sus permisos: taskctl no sigue sin saber que dice.'
     );
   }
-  return parsearConfig(contenido, ruta);
+  const config = parsearConfig(contenido, ruta);
+  // Lo unico de las rutas de sincronizacion que necesita disco: que
+  // ninguna sea una carpeta existente. Con una carpeta, el
+  // `git add -A -- <ruta>` acotado se convierte en un barrido de todo
+  // lo que haya debajo, incluido trabajo de la persona.
+  const raiz = raizDelRepo(cwd);
+  for (const r of config.rutas_sincronizacion) {
+    let esCarpeta = false;
+    try {
+      esCarpeta = statSync(path.join(raiz, r)).isDirectory();
+    } catch {
+      // No existe (todavia): legitimo, la creara el comando.
+    }
+    if (esCarpeta) {
+      throw new ConfigError(
+        `[ERROR] ${ruta}: la ruta de sincronizacion "${r}" es una carpeta.\n` +
+          '        Declara los ficheros concretos que regenera el comando: con una carpeta, ' +
+          'el commit automatico se llevaria todo lo que hay dentro.'
+      );
+    }
+  }
+  return config;
 }
 
 /**
@@ -231,12 +288,118 @@ export function parsearConfig(contenido: string, ruta: string): TaskcodeConfig {
       case 'limite_wip':
         config.limite_wip = validarEnteroPositivo(donde, par.clave, par.valor);
         break;
+      case 'comando_sincronizacion':
+        config.comando_sincronizacion = validarComando(donde, par.valor);
+        break;
+      case 'rutas_sincronizacion':
+        config.rutas_sincronizacion = validarRutasSincronizacion(donde, par.valor);
+        break;
+      case 'timeout_sincronizacion':
+        config.timeout_sincronizacion = validarEnteroPositivo(donde, par.clave, par.valor);
+        break;
     }
   }
 
+  validarSincronizacionCompleta(ruta, vistas);
   return config;
 }
 
+/**
+ * Las claves de sincronizacion van juntas. Un comando sin rutas
+ * declaradas no puede commitear nada (todo lo que tocara serian rutas
+ * ajenas), y unas rutas sin comando no las regenera nadie: las dos
+ * mitades sueltas son configuraciones que parecen hacer algo y no lo
+ * hacen. El timeout solo sin comando, igual.
+ */
+function validarSincronizacionCompleta(ruta: string, vistas: ReadonlySet<string>): void {
+  const comando = vistas.has('comando_sincronizacion');
+  const rutas = vistas.has('rutas_sincronizacion');
+  if (comando !== rutas) {
+    const presente = comando ? 'comando_sincronizacion' : 'rutas_sincronizacion';
+    const falta = comando ? 'rutas_sincronizacion' : 'comando_sincronizacion';
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "${presente}" necesita tambien "${falta}".\n` +
+        '        Van juntas: el comando que regenera los ficheros y la lista de ficheros que ' +
+        'regenera. Anade la que falta o borra las dos.'
+    );
+  }
+  if (vistas.has('timeout_sincronizacion') && !comando) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "timeout_sincronizacion" sin "comando_sincronizacion" no hace nada.\n` +
+        '        Borrala, o configura tambien el comando y sus rutas.'
+    );
+  }
+}
+
+/** El comando, recortado. No se interpreta: lo ejecuta el shell del sistema tal cual. */
+function validarComando(donde: string, valor: unknown): string {
+  if (typeof valor !== 'string' || valor.trim() === '') {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "comando_sincronizacion" debe ser un comando (texto no vacio), ` +
+        `y es ${describirValor(valor)}.\n` +
+        '        Ejemplo: comando_sincronizacion: "node scripts/sincronizar-plan.mjs". ' +
+        'Si lleva "#", entrecomillalo entero.'
+    );
+  }
+  return valor.trim();
+}
+
+/**
+ * Lista flow de FICHEROS relativos a la raiz del repo. Se valida aqui,
+ * al cargar, y no al commitear: para entonces la tarea ya se ha movido
+ * y el comando ya se ha ejecutado, y un error tardio deja el workspace
+ * a medias (hallazgo del rol de riesgos en el brainstorm de TASK-033).
+ * normalizarRuta() en git-commit.ts sigue siendo la segunda barrera.
+ *
+ * Que la ruta no sea una carpeta no se puede saber sin disco: lo
+ * comprueba resolverConfig, que si lo tiene.
+ */
+function validarRutasSincronizacion(donde: string, valor: unknown): readonly string[] {
+  if (!Array.isArray(valor) || valor.length === 0) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "rutas_sincronizacion" debe ser una lista no vacia entre corchetes, ` +
+        `y es ${describirValor(valor)}.\n` +
+        '        Ejemplo: rutas_sincronizacion: [docs/PLAN.md]. Las listas en bloque ' +
+        '("- ruta") no se admiten.'
+    );
+  }
+  const rutas: string[] = [];
+  for (const elemento of valor) {
+    if (typeof elemento !== 'string' || elemento.trim() === '') {
+      throw new ConfigError(
+        `[ERROR] ${donde}: "rutas_sincronizacion" contiene un elemento vacio o que no es texto.`
+      );
+    }
+    const original = elemento.trim();
+    const motivo = motivoRutaInvalida(original);
+    if (motivo !== null) {
+      throw new ConfigError(
+        `[ERROR] ${donde}: la ruta de sincronizacion "${original}" no vale: ${motivo}.\n` +
+          '        Solo ficheros, relativos a la raiz del repo, fuera de tareas/, .taskcode/ ' +
+          'y .git/.'
+      );
+    }
+    const normalizada = path.posix.normalize(original.replace(/\\/g, '/'));
+    if (!rutas.includes(normalizada)) rutas.push(normalizada);
+  }
+  return rutas;
+}
+
+/** null si la ruta es aceptable; si no, el motivo en palabras de persona. */
+function motivoRutaInvalida(original: string): string | null {
+  const conBarras = original.replace(/\\/g, '/');
+  if (conBarras.startsWith('/') || /^[A-Za-z]:/.test(conBarras)) return 'es absoluta';
+  if (conBarras.endsWith('/')) return 'es una carpeta';
+  const normalizada = path.posix.normalize(conBarras);
+  if (normalizada === '.' || normalizada === '') return 'es la raiz del repo';
+  if (normalizada === '..' || normalizada.startsWith('../')) return 'se sale del repo';
+  const primera = normalizada.split('/')[0] as string;
+  if ((RAICES_PROHIBIDAS_SINCRONIZACION as readonly string[]).includes(primera)) {
+    return `esta bajo ${primera}/, que no es del proyecto sino de la herramienta`;
+  }
+  return null;
+}
+
 /**
  * Enumera SIEMPRE las claves validas (criterio de la decision #9: el
  * mensaje dice que esta mal y cuales son las validas) y, si la escrita
@@ -321,13 +484,20 @@ function validarTextoNoVacio(donde: string, clave: string, valor: unknown): stri
 }
 
 /** Entero >= 1. Un limite de 0 no es "sin limite": es "no se puede trabajar". */
-function validarEnteroPositivo(donde: string, clave: string, valor: unknown): number {
+function validarEnteroPositivo(
+  donde: string,
+  clave: 'limite_wip' | 'timeout_sincronizacion',
+  valor: unknown
+): number {
   if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1) {
+    const consecuencia =
+      clave === 'limite_wip'
+        ? 'Un 0 o un negativo no significan "sin limite": impedirian arrancar cualquier tarea.'
+        : 'Son segundos: un 0 o un negativo matarian el comando antes de empezar.';
     throw new ConfigError(
       `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 1, ` +
         `y es ${describirValor(valor)}.\n` +
-        `        Por defecto es ${CONFIG_DEFAULTS.limite_wip}. Un 0 o un negativo no ` +
-        'significan "sin limite": impedirian arrancar cualquier tarea.'
+        `        Por defecto es ${CONFIG_DEFAULTS[clave]}. ${consecuencia}`
     );
   }
   return valor;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
index 373ee56..cde4eea 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
@@ -46,7 +46,14 @@
  */
 import { existsSync } from 'node:fs';
 import path from 'node:path';
+import { resolverConfig } from '../core/config.js';
 import { GitCommandError, currentBranch, isRemoteAvailable, runGit } from './git.js';
+import {
+  ejecutarSincronizacion,
+  SIN_SINCRONIZACION,
+  type OpcionesSincronizacion,
+  type ResultadoSincronizacion,
+} from './sincronizacion.js';
 
 export class AutoCommitError extends Error {}
 
@@ -77,6 +84,8 @@ export interface AutoCommitOptions {
   mensaje: string;
   /** Si ademas hay que subir la rama actual a origin. */
   push?: boolean;
+  /** Solo para tests: opciones de la sincronizacion (timeout corto). */
+  sincronizacion?: OpcionesSincronizacion;
 }
 
 export interface AutoCommitResult {
@@ -89,6 +98,8 @@ export interface AutoCommitResult {
   /** Rama activa en el momento del commit ('' si HEAD esta desacoplado). */
   rama: string;
   push: ResultadoPush;
+  /** Que paso con el comando de sincronizacion de `.taskcode/config.yml` (TASK-033). */
+  sincronizacion: ResultadoSincronizacion;
   /** Avisos no fatales, para que el CLI los saque por stderr. */
   avisos: readonly string[];
 }
@@ -183,9 +194,24 @@ export function autoCommit(opts: AutoCommitOptions): AutoCommitResult {
   const avisos: string[] = [];
   const rama = currentBranch(cwd);
 
+  // Las rutas del propio comando se validan ANTES de sincronizar: un
+  // error de programacion aqui no debe llegar a ejecutar nada.
+  const rutasComando = opts.rutas.map((r) => normalizarRuta(cwd, r));
+
+  // TASK-033: el comando de sincronizacion del proyecto corre aqui, con
+  // los ficheros de la tarea ya escritos y antes del primer `git add`,
+  // para que sus rutas entren en ESTE commit y el indice real quede
+  // limpio. Nunca aborta la transicion (ver sincronizacion.ts). Si el
+  // comando no escribio nada de la tarea, no hay estado nuevo que
+  // sincronizar y no se lanza.
+  const sincronizacion = rutasComando.length === 0 ? SIN_SINCRONIZACION : sincronizar(opts);
+  avisos.push(...sincronizacion.avisos);
+
   // Deduplicadas y ordenadas para que el commando de Git sea
   // determinista (y los tests puedan aseverar sobre el).
-  const rutasRel = [...new Set(opts.rutas.map((r) => normalizarRuta(cwd, r)))].sort();
+  const rutasRel = [
+    ...new Set([...rutasComando, ...sincronizacion.rutas.map((r) => normalizarRuta(cwd, r))]),
+  ].sort();
   const presentes = rutasRel.filter((r) => tieneAlgoQuePreparar(cwd, r));
 
   let commiteado = false;
@@ -258,7 +284,36 @@ export function autoCommit(opts: AutoCommitOptions): AutoCommitResult {
     }
   }
 
-  return { commiteado, commit, ficheros, rama, push: empujar(opts, rama, avisos), avisos };
+  return {
+    commiteado,
+    commit,
+    ficheros,
+    rama,
+    push: empujar(opts, rama, avisos),
+    sincronizacion,
+    avisos,
+  };
+}
+
+/**
+ * Cualquier excepcion de la sincronizacion (config ilegible a estas
+ * alturas, un `git status` que falla) se convierte en 'fallida': para
+ * cuando se llega aqui la tarea ya esta escrita, y en `finish` el merge
+ * ya esta hecho. Abortar dejaria el estado a medias sin reintento.
+ */
+function sincronizar(opts: AutoCommitOptions): ResultadoSincronizacion {
+  try {
+    return ejecutarSincronizacion(opts.cwd, resolverConfig(opts.cwd), opts.sincronizacion);
+  } catch (e: unknown) {
+    return {
+      estado: 'fallida',
+      rutas: [],
+      avisos: [
+        `No se pudo ejecutar la sincronizacion configurada: ${detalleDeError(e)}. La ` +
+          'tarea se ha commiteado sin ella; revisa .taskcode/config.yml y sincroniza a mano.',
+      ],
+    };
+  }
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
new file mode 100644
index 0000000..a2216cc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
@@ -0,0 +1,310 @@
+/**
+ * Sincronizacion de ficheros derivados — TASK-033 (version 0.1.1).
+ *
+ * Un proyecto que genera ficheros a partir del estado de las tareas (un
+ * plan con una tabla de seguimiento, un tablero propio) los tenia
+ * desincronizados tras CADA transicion: los commits automaticos mueven
+ * la tarea, pero no pueden saber que ese fichero existe. El arreglo
+ * obvio desde el proyecto —un hook de pre-commit que regenere y haga
+ * `git add`— no funciona con taskctl: autoCommit commitea en modo
+ * `--only` (`git commit -- <rutas>`), el `git add` del hook va al indice
+ * temporal y el indice real se queda con el contenido viejo. Despues del
+ * commit, `git status` marca `MM` y el SIGUIENTE comando aborta en el
+ * guard de la 8.3. Reproducido, no supuesto.
+ *
+ * Asi que el comando lo ejecuta taskctl, dentro de autoCommit y antes
+ * del primer `git add`, y sus rutas entran en el mismo commit que la
+ * tarea. Lo configuran tres claves de `.taskcode/config.yml`
+ * (config.ts); sin ellas, aqui no se hace nada, ni un spawn.
+ *
+ * La regla que manda, decidida al aprobar el plan: **la transicion
+ * NUNCA se aborta por la sincronizacion**. En `finish` el merge ya esta
+ * hecho cuando se llega aqui; abortar dejaria la tarea movida sin
+ * commitear y sin camino de reintento (riesgo 1 del brainstorm). Los
+ * tres desenlaces en que la sincronizacion no se aplica commitean la
+ * tarea igual, avisan y hacen que el CLI salga con
+ * CODIGO_SINCRONIZACION_NO_APLICADA:
+ *
+ *   (a) una ruta declarada ya tenia cambios: no se ejecuta, porque
+ *       commitearla meteria trabajo de la persona en un commit
+ *       automatico;
+ *   (b) el comando falla o expira: las rutas declaradas vuelven a HEAD
+ *       (estaban limpias por (a), asi que no se pierde nada);
+ *   (c) el comando toco ficheros no declarados: esos no se tocan y se
+ *       nombran; las rutas declaradas si se commitean.
+ */
+import { createHash } from 'node:crypto';
+import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { raizDelRepo, type TaskcodeConfig } from '../core/config.js';
+import { runGit } from './git.js';
+
+/**
+ * Codigo de salida del CLI cuando la transicion se hizo pero la
+ * sincronizacion no se aplico. Distinto de 1 (el comando fallo) a
+ * proposito: quien lo lea tiene que poder distinguir "no reintentes,
+ * sincroniza a mano" de "no ha pasado nada".
+ */
+export const CODIGO_SINCRONIZACION_NO_APLICADA = 3;
+
+export type EstadoSincronizacion =
+  /** Sin `comando_sincronizacion`: comportamiento anterior a 0.1.1. */
+  | 'no-configurada'
+  /** El comando corrio bien y solo toco rutas declaradas. */
+  | 'aplicada'
+  /** (a) Alguna ruta declarada ya tenia cambios: no se ejecuto. */
+  | 'omitida-rutas-con-cambios'
+  /** (b) Exit != 0, senal, timeout o no se pudo lanzar. */
+  | 'fallida'
+  /** (c) Corrio bien, pero ademas toco ficheros no declarados. */
+  | 'rutas-ajenas';
+
+export interface ResultadoSincronizacion {
+  estado: EstadoSincronizacion;
+  /** Rutas (absolutas) que deben entrar en el commit automatico. */
+  rutas: readonly string[];
+  /** Avisos para stderr. Vacio en 'no-configurada' y 'aplicada'. */
+  avisos: readonly string[];
+}
+
+/** true si el desenlace debe hacer que el CLI salga con CODIGO_SINCRONIZACION_NO_APLICADA. */
+export function sincronizacionNoAplicada(r: ResultadoSincronizacion): boolean {
+  return r.estado !== 'no-configurada' && r.estado !== 'aplicada';
+}
+
+export interface OpcionesSincronizacion {
+  /** Solo para tests: sustituye a `timeout_sincronizacion` (en ms). */
+  timeoutMs?: number;
+}
+
+export const SIN_SINCRONIZACION: ResultadoSincronizacion = Object.freeze({
+  estado: 'no-configurada',
+  rutas: Object.freeze([]) as readonly string[],
+  avisos: Object.freeze([]) as readonly string[],
+});
+
+export function ejecutarSincronizacion(
+  cwd: string,
+  config: TaskcodeConfig,
+  opciones: OpcionesSincronizacion = {}
+): ResultadoSincronizacion {
+  const comando = config.comando_sincronizacion;
+  if (comando === null) return SIN_SINCRONIZACION;
+
+  const raiz = raizDelRepo(cwd);
+  const declaradas = config.rutas_sincronizacion;
+  const absolutas = declaradas.map((r) => path.join(raiz, r));
+  const aMano =
+    `Cuando lo resuelvas, ejecuta a mano "${comando}" y commitea ${declaradas.join(', ')}. ` +
+    'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.';
+
+  // (a) Antes de nada: si una ruta declarada ya trae cambios, el
+  // commit automatico se los llevaria. `start`, `review` y `finish` no
+  // exigen workspace limpio, asi que esto es un caso real.
+  const conCambios = porcelain(raiz, declaradas);
+  if (conCambios.length > 0) {
+    return {
+      estado: 'omitida-rutas-con-cambios',
+      rutas: [],
+      avisos: [
+        `No se ha ejecutado la sincronizacion: ${conCambios.join(', ')} ya tenia(n) cambios ` +
+          'sin commitear, y el commit automatico los habria incluido. Commitealos o ' +
+          `descartalos. ${aMano}`,
+      ],
+    };
+  }
+
+  const antes = fotoDelArbol(raiz);
+  const timeoutMs = opciones.timeoutMs ?? config.timeout_sincronizacion * 1000;
+
+  // El comando no se lanza directamente: lo lanza ENVOLTORIO, un node
+  // hijo que es quien aplica el timeout. Con un `spawnSync(comando, {
+  // shell: true, timeout })` a pelo, el timeout mata a cmd.exe pero en
+  // Windows el `node` nieto SIGUE VIVO y puede seguir escribiendo el
+  // derivado despues de que lo hayamos restaurado (riesgo 6 del
+  // brainstorm; reproducido: el test del timeout dejaba la carpeta del
+  // repo bloqueada con EBUSY). El envoltorio mata el arbol entero.
+  //
+  // stdin ignorado SIEMPRE: con una tuberia heredada que nadie cierra
+  // (un arnes de agente, `node --test`) un script que pregunte algo
+  // esperaria para siempre. Con EOF, falla y se va por (b).
+  const r = spawnSync(process.execPath, ['-e', ENVOLTORIO, comando, String(timeoutMs)], {
+    cwd: raiz,
+    stdio: ['ignore', 'pipe', 'pipe'],
+    encoding: 'utf8',
+    // Red de seguridad por si el propio envoltorio se colgara.
+    timeout: timeoutMs + 15000,
+    windowsHide: true,
+    maxBuffer: 16 * 1024 * 1024,
+  });
+
+  const fallo = describirFallo(r, timeoutMs);
+  if (fallo !== null) {
+    restaurarAHead(raiz, declaradas);
+    return {
+      estado: 'fallida',
+      rutas: [],
+      avisos: [
+        `La sincronizacion "${comando}" ${fallo}. ${declaradas.join(', ')} se ha(n) dejado ` +
+          `como en HEAD y la tarea se ha commiteado sin ella(s). ${aMano}`,
+      ],
+    };
+  }
+
+  const despues = fotoDelArbol(raiz);
+  const declaradasSet = new Set(declaradas);
+  const ajenas = [...new Set([...antes.keys(), ...despues.keys()])]
+    .filter((f) => !declaradasSet.has(f) && antes.get(f) !== despues.get(f))
+    .sort();
+
+  if (ajenas.length > 0) {
+    return {
+      estado: 'rutas-ajenas',
+      rutas: absolutas,
+      avisos: [
+        `La sincronizacion "${comando}" ha modificado ficheros que no estan en ` +
+          `rutas_sincronizacion: ${ajenas.join(', ')}. No se han commiteado ni tocado: ` +
+          'revisalos. Si los genera el comando a proposito, anadelos a rutas_sincronizacion; ' +
+          'si no, el siguiente comando de taskctl puede abortar por workspace sucio.',
+      ],
+    };
+  }
+
+  return { estado: 'aplicada', rutas: absolutas, avisos: [] };
+}
+
+/** Codigo con el que ENVOLTORIO dice "lo he cortado por timeout". */
+const CODIGO_TIMEOUT_ENVOLTORIO = 124;
+
+/**
+ * Ejecuta argv[1] con el shell del sistema y lo corta a los argv[2] ms.
+ *
+ * - shell: true en las dos plataformas: cmd.exe en Windows (necesario
+ *   para resolver `pnpm.cmd` / `npm.cmd`; sin shell, ENOENT — el fallo
+ *   que costo una ronda en codex-review) y /bin/sh en POSIX. El comando
+ *   es entero de la persona y no se le interpola nada, asi que no se
+ *   escapa: escaparlo cambiaria lo que escribio.
+ * - Al vencer el timeout mata el ARBOL: `taskkill /T /F` en Windows
+ *   (con el hijo aun vivo, que es cuando /T puede recorrerlo) y el
+ *   grupo de procesos en POSIX (por eso `detached`).
+ * - Sale con el codigo del comando, o con 124 (como `timeout(1)`) si lo
+ *   corto.
+ */
+const ENVOLTORIO = `
+const { spawn, spawnSync } = require('node:child_process');
+const [comando, ms] = process.argv.slice(1);
+const win = process.platform === 'win32';
+const hijo = spawn(comando, { shell: true, stdio: ['ignore', 'inherit', 'inherit'],
+  windowsHide: true, detached: !win });
+let cortado = false;
+const t = setTimeout(() => {
+  cortado = true;
+  if (win) spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
+  else { try { process.kill(-hijo.pid, 'SIGKILL'); } catch {} }
+}, Number(ms));
+hijo.on('error', (e) => { clearTimeout(t); process.stderr.write(String(e.message)); process.exit(127); });
+hijo.on('close', (code, signal) => {
+  clearTimeout(t);
+  if (cortado) process.exit(${String(CODIGO_TIMEOUT_ENVOLTORIO)});
+  process.exit(code === null ? 128 : code);
+});
+`;
+
+/** null si el comando termino bien; si no, que le paso, en palabras de persona. */
+function describirFallo(r: ReturnType<typeof spawnSync>, timeoutMs: number): string | null {
+  const corte = `no termino en ${String(Math.round(timeoutMs / 1000))} s y se ha cortado`;
+  if (r.error !== undefined) {
+    if ((r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') return corte;
+    return `no se pudo ejecutar (${r.error.message})`;
+  }
+  if (r.status === CODIGO_TIMEOUT_ENVOLTORIO) return corte;
+  if (r.signal !== null) return `termino por la senal ${r.signal}`;
+  if (r.status !== 0) {
+    const stderr = String(r.stderr ?? '').trim();
+    const cola = stderr === '' ? '' : `: ${ultimasLineas(stderr, 5)}`;
+    return `salio con codigo ${String(r.status)}${cola}`;
+  }
+  return null;
+}
+
+function ultimasLineas(texto: string, n: number): string {
+  return texto.split(/\r?\n/).slice(-n).join(' | ');
+}
+
+/** Rutas (de las dadas) con cambios respecto a HEAD, incluidas las no trackeadas. */
+function porcelain(raiz: string, rutas: readonly string[]): string[] {
+  const salida = runGit(['status', '--porcelain', '--untracked-files=all', '--', ...rutas], raiz);
+  return salida
+    .split('\n')
+    .map((l) => l.trim())
+    .filter((l) => l !== '')
+    .map((l) => l.slice(l.indexOf(' ') + 1).trim());
+}
+
+/**
+ * Foto de lo que NO esta limpio en el arbol: ruta -> huella del
+ * contenido. Comparar solo el porcelain no basta (hallazgo del rol de
+ * riesgos): un fichero que ya estaba en ` M` por trabajo de la persona
+ * sigue en ` M` aunque el comando lo reescriba. Por eso se compara el
+ * contenido, y solo de lo que ya esta sucio (lo limpio, si cambia,
+ * aparece nuevo en la segunda foto).
+ */
+function fotoDelArbol(raiz: string): Map<string, string> {
+  // Sin runGit a proposito: recorta la salida, y el recorte se come el
+  // espacio inicial de la primera entrada (" M ruta"), desplazando la
+  // ruta un caracter.
+  const r = spawnSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
+    cwd: raiz,
+    encoding: 'utf8',
+    maxBuffer: 64 * 1024 * 1024,
+  });
+  if (r.status !== 0) {
+    throw new Error(`git status fallo al sincronizar: ${String(r.stderr ?? '').trim()}`);
+  }
+  const salida = r.stdout ?? '';
+  const foto = new Map<string, string>();
+  const entradas = salida.split('\0');
+  for (let i = 0; i < entradas.length; i++) {
+    const e = entradas[i] as string;
+    if (e.length < 4) continue;
+    const xy = e.slice(0, 2);
+    const ruta = e.slice(3);
+    // En un renombrado, -z pone la ruta de origen en la entrada
+    // siguiente: se salta para no tomarla por un fichero aparte.
+    if (xy.includes('R') || xy.includes('C')) i++;
+    foto.set(ruta, huella(path.join(raiz, ruta)));
+  }
+  return foto;
+}
+
+function huella(fichero: string): string {
+  try {
+    if (!statSync(fichero).isFile()) return 'no-fichero';
+    return createHash('sha1').update(readFileSync(fichero)).digest('hex');
+  } catch {
+    return 'ausente';
+  }
+}
+
+/**
+ * (b) Deja cada ruta declarada como en HEAD. Estaban limpias antes de
+ * ejecutar (lo garantiza (a)), asi que lo unico que se deshace es lo
+ * que escribio el comando: si existia en HEAD se restaura, y si no
+ * existia el fichero lo creo el comando y se borra.
+ */
+function restaurarAHead(raiz: string, rutas: readonly string[]): void {
+  for (const r of rutas) {
+    const enHead = runGitOk(['cat-file', '-e', `HEAD:${r}`], raiz);
+    if (enHead) {
+      runGit(['checkout', 'HEAD', '--', r], raiz);
+    } else {
+      const abs = path.join(raiz, r);
+      if (existsSync(abs)) rmSync(abs, { force: true });
+    }
+  }
+}
+
+function runGitOk(args: readonly string[], cwd: string): boolean {
+  return spawnSync('git', args, { cwd, encoding: 'utf8' }).status === 0;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts
new file mode 100644
index 0000000..37f20b6
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion.test.ts
@@ -0,0 +1,427 @@
+/**
+ * Sincronizacion de ficheros derivados (TASK-033, version 0.1.1).
+ * Repos Git temporales reales, los scripts de Git-Flow del repo tal
+ * cual, y un script de sincronizacion de verdad (`node`) que regenera
+ * `docs/PLAN.md` leyendo `tareas/` — la misma forma que el script del
+ * proyecto que destapo el problema.
+ *
+ * El test que manda es el primero: encadenar approve -> start -> review
+ * -> finish SIN un solo commit manual en medio, con el derivado dentro
+ * del commit de cada transicion y `git status` vacio despues de cada
+ * una. Antes de 0.1.1 hacia falta un commit a mano tras cada paso, y el
+ * arreglo con un hook de pre-commit dejaba el indice en `MM`.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import { runApproveCommand } from '../../src/commands/approve.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
+import { CODIGO_SINCRONIZACION_NO_APLICADA } from '../../src/fs/sincronizacion.js';
+import type { Task } from '../../src/core/task.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+// dist/test/commands -> raiz del paquete
+const PAQUETE = path.join(HERE, '..', '..', '..');
+const SCRIPTS_DIR = path.join(PAQUETE, 'scripts', 'gitflow');
+const BIN = path.join(PAQUETE, 'bin', 'taskctl');
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+function porcelain(repoRoot: string): string {
+  return git(['status', '--porcelain', '--untracked-files=all'], repoRoot).trim();
+}
+
+function ficherosDeHead(repoRoot: string): string[] {
+  return git(['show', '--name-only', '--format=', 'HEAD'], repoRoot)
+    .split('\n')
+    .map((l) => l.trim())
+    .filter((l) => l !== '');
+}
+
+function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-920',
+    titulo: 'Tarea de prueba de la sincronizacion',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: ['cli'],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-diseno',
+    plan_aprobado: false,
+    rama: 'feature/task-920-sincronizacion',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-10-03',
+    actualizado: '2026-10-03',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+/**
+ * Regenera docs/PLAN.md: una linea por tarea con su carpeta y si el
+ * plan esta aprobado. Lee el estado de disco, como el script real.
+ */
+const SCRIPT_SYNC = `import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
+const filas = [];
+for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
+  const d = 'tareas/' + c;
+  if (!existsSync(d)) continue;
+  for (const id of readdirSync(d).filter((x) => x.startsWith('TASK-'))) {
+    const md = readFileSync(d + '/' + id + '/tarea.md', 'utf8');
+    filas.push(id + ' ' + c + (/plan_aprobado: true/.test(md) ? ' aprobado' : ''));
+  }
+}
+mkdirSync('docs', { recursive: true });
+writeFileSync('docs/PLAN.md', filas.sort().join('\\n') + '\\n');
+`;
+
+const CONFIG_SYNC =
+  'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/PLAN.md]\n';
+
+/**
+ * Repo con develop, el script de sincronizacion, la config que lo
+ * activa (si `config` no es null) y una tarea en 01-en-diseno con su
+ * plan. Todo commiteado, docs/PLAN.md incluido: arbol limpio al entrar.
+ */
+async function withRepoSincronizado(
+  config: string | null,
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-sync-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    git(['config', 'core.autocrlf', 'false'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), 'repo\n', 'utf8');
+    commitAll(repoRoot, 'inicial');
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+
+    const tareasRoot = path.join(repoRoot, 'tareas');
+    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar la sincronizacion.\n');
+    const planDir = path.join(tareasRoot, '01-en-diseno', 'TASK-920', 'planificacion');
+    await mkdir(planDir, { recursive: true });
+    await writeFile(path.join(planDir, 'plan-final.md'), '# Plan\n', 'utf8');
+    await mkdir(path.join(repoRoot, 'scripts'), { recursive: true });
+    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), SCRIPT_SYNC, 'utf8');
+    if (config !== null) {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+    }
+    const r = spawnSync('node', ['scripts/sync.mjs'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(r.status, 0, r.stderr);
+    commitAll(repoRoot, 'docs: plan y sincronizacion');
+    await fn(repoRoot, tareasRoot);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+async function planEnDisco(repoRoot: string): Promise<string> {
+  return (await readFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'utf8')).trim();
+}
+
+// ─── El test del item: el ciclo entero sin un commit manual ────────────────
+
+test('sincronizacion: approve -> start -> review -> finish sin commits manuales; el derivado va en cada commit y el arbol queda limpio', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
+
+    const a = await runApproveCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
+    assert.equal(a.autoCommit.sincronizacion.estado, 'aplicada');
+    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'approve: falta el derivado');
+    assert.equal(await planEnDisco(repoRoot), 'TASK-920 01-en-diseno aprobado');
+    assert.equal(porcelain(repoRoot), '', 'approve dejo el arbol sucio');
+
+    const s = await runStartCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
+    assert.equal(s.autoCommit.sincronizacion.estado, 'aplicada');
+    assert.equal(s.autoCommit.rama, 'feature/task-920-sincronizacion');
+    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'start: falta el derivado');
+    assert.equal(await planEnDisco(repoRoot), 'TASK-920 02-en-curso aprobado');
+    assert.equal(porcelain(repoRoot), '', 'start dejo el arbol sucio');
+
+    await writeFile(path.join(repoRoot, 'README.md'), 'repo con trabajo\n', 'utf8');
+    commitAll(repoRoot, 'feat(TASK-920): trabajo');
+
+    const v = await runReviewCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
+    assert.equal(v.autoCommit.sincronizacion.estado, 'aplicada');
+    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'review: falta el derivado');
+    assert.equal(await planEnDisco(repoRoot), 'TASK-920 03-en-revision aprobado');
+    assert.equal(porcelain(repoRoot), '', 'review dejo el arbol sucio');
+
+    const informe = path.join(
+      tareasRoot,
+      '03-en-revision',
+      'TASK-920',
+      'revision',
+      'informe-revision-1.md'
+    );
+    await writeFile(informe, '# Informe\n\n- Veredicto: aprobada\n', 'utf8');
+    commitAll(repoRoot, 'docs(TASK-920): informe de revision');
+
+    const f = await runFinishCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
+    assert.equal(f.autoCommit.sincronizacion.estado, 'aplicada');
+    assert.equal(f.autoCommit.rama, 'develop');
+    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'finish: falta el derivado');
+    assert.equal(await planEnDisco(repoRoot), 'TASK-920 04-terminadas aprobado');
+    assert.equal(porcelain(repoRoot), '', 'finish dejo el arbol sucio');
+    // Y lo que se commiteo en develop es lo que hay en disco.
+    assert.equal(git(['show', 'HEAD:docs/PLAN.md'], repoRoot).trim(), await planEnDisco(repoRoot));
+  });
+});
+
+test('sincronizacion: sin las claves, ni se ejecuta el script ni cambia el commit (comportamiento 0.1.0)', async () => {
+  await withRepoSincronizado(null, async (repoRoot, tareasRoot) => {
+    const antes = await planEnDisco(repoRoot);
+    const a = await runApproveCommand(tareasRoot, ['TASK-920'], '2026-10-03', {
+      repoCwd: repoRoot,
+    });
+    assert.equal(a.autoCommit.sincronizacion.estado, 'no-configurada');
+    assert.deepEqual(a.autoCommit.ficheros, ['tareas/01-en-diseno/TASK-920/tarea.md']);
+    assert.equal(await planEnDisco(repoRoot), antes, 'el script no deberia haberse ejecutado');
+  });
+});
+
+// ─── Los tres desenlaces en que no se aplica ───────────────────────────────
+
+/** Escribe un cambio en la tarea (lo que haria un comando) para que autoCommit tenga algo. */
+async function tocarTarea(tareasRoot: string): Promise<string> {
+  const dir = path.join(tareasRoot, '01-en-diseno', 'TASK-920');
+  await writeFile(path.join(dir, 'nota.md'), 'cambio de la transicion\n', 'utf8');
+  return dir;
+}
+
+async function reescribirScript(repoRoot: string, contenido: string): Promise<void> {
+  await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), contenido, 'utf8');
+  commitAll(repoRoot, 'chore: script nuevo');
+}
+
+test('sincronizacion (a): si la ruta declarada ya tenia cambios, no se ejecuta, no entra en el commit y el cambio de la persona sigue en el arbol', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await writeFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'edicion a mano\n', 'utf8');
+    const dir = await tocarTarea(tareasRoot);
+
+    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+
+    assert.equal(r.sincronizacion.estado, 'omitida-rutas-con-cambios');
+    assert.equal(r.commiteado, true, 'la tarea se commitea igual');
+    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'));
+    assert.equal(await planEnDisco(repoRoot), 'edicion a mano', 'se piso el trabajo de la persona');
+    assert.match(r.avisos.join('\n'), /No se ha ejecutado la sincronizacion: docs\/PLAN\.md/);
+  });
+});
+
+test('sincronizacion (b): si el script falla tras escribir, el derivado vuelve a HEAD, la tarea se commitea y el arbol queda limpio', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    const enHead = await planEnDisco(repoRoot);
+    await reescribirScript(
+      repoRoot,
+      "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/PLAN.md', 'a medias\\n');\n" +
+        "console.error('se rompio a mitad');\nprocess.exit(4);\n"
+    );
+    const dir = await tocarTarea(tareasRoot);
+
+    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+
+    assert.equal(r.sincronizacion.estado, 'fallida');
+    assert.equal(r.commiteado, true);
+    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'));
+    assert.equal(await planEnDisco(repoRoot), enHead, 'el derivado a medias no se restauro');
+    assert.equal(porcelain(repoRoot), '');
+    const aviso = r.avisos.join('\n');
+    assert.match(aviso, /salio con codigo 4: se rompio a mitad/);
+    assert.match(aviso, /no repitas el comando de taskctl/);
+  });
+});
+
+test('sincronizacion (b): un derivado que no existia en HEAD y el script deja a medias se borra', async () => {
+  await withRepoSincronizado(
+    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/NUEVO.md]\n',
+    async (repoRoot, tareasRoot) => {
+      await reescribirScript(
+        repoRoot,
+        "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/NUEVO.md', 'x\\n');\nprocess.exit(1);\n"
+      );
+      const dir = await tocarTarea(tareasRoot);
+      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+      assert.equal(r.sincronizacion.estado, 'fallida');
+      assert.equal(existsSync(path.join(repoRoot, 'docs', 'NUEVO.md')), false);
+      assert.equal(porcelain(repoRoot), '');
+    }
+  );
+});
+
+test('sincronizacion (b): un script que no termina se corta por timeout y no cuelga el comando', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await reescribirScript(repoRoot, 'setTimeout(() => {}, 60000);\n');
+    const dir = await tocarTarea(tareasRoot);
+    const t0 = Date.now();
+    const r = autoCommit({
+      cwd: repoRoot,
+      rutas: [dir],
+      mensaje: mensajeChore('TASK-920', 'x'),
+      sincronizacion: { timeoutMs: 1500 },
+    });
+    assert.ok(Date.now() - t0 < 30000, 'el timeout no corto el script');
+    assert.equal(r.sincronizacion.estado, 'fallida');
+    assert.equal(r.commiteado, true);
+    assert.match(r.avisos.join('\n'), /no termino en 2 s/);
+  });
+});
+
+test('sincronizacion (b): un script que lee stdin recibe EOF, no se queda esperando', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await reescribirScript(
+      repoRoot,
+      "process.stdin.on('data', () => {});\nprocess.stdin.on('end', () => process.exit(7));\n"
+    );
+    const dir = await tocarTarea(tareasRoot);
+    const r = autoCommit({
+      cwd: repoRoot,
+      rutas: [dir],
+      mensaje: mensajeChore('TASK-920', 'x'),
+      sincronizacion: { timeoutMs: 20000 },
+    });
+    assert.equal(r.sincronizacion.estado, 'fallida');
+    assert.match(r.avisos.join('\n'), /salio con codigo 7/);
+  });
+});
+
+test('sincronizacion (c): un script que toca ficheros no declarados los nombra y no los commitea; el derivado si entra', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await reescribirScript(
+      repoRoot,
+      SCRIPT_SYNC + "writeFileSync('README.md', 'tocado por el script\\n');\n"
+    );
+    const dir = await tocarTarea(tareasRoot);
+    // Un cambio de estado de verdad, para que el derivado cambie.
+    const tareaMd = path.join(dir, 'tarea.md');
+    await writeFile(
+      tareaMd,
+      (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
+    );
+
+    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+
+    assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
+    const enCommit = ficherosDeHead(repoRoot);
+    assert.ok(enCommit.includes('docs/PLAN.md'), 'el derivado declarado deberia entrar');
+    assert.ok(!enCommit.includes('README.md'), 'se commiteo un fichero no declarado');
+    // porcelain() recorta, asi que la primera linea pierde su espacio inicial.
+    assert.match(porcelain(repoRoot), /^ ?M README\.md$/m, 'el fichero ajeno no se debe tocar');
+    assert.equal(
+      await readFile(path.join(repoRoot, 'README.md'), 'utf8'),
+      'tocado por el script\n',
+      'el fichero ajeno no se debe restaurar ni borrar'
+    );
+    assert.match(r.avisos.join('\n'), /no estan en rutas_sincronizacion: README\.md/);
+  });
+});
+
+test('sincronizacion (c): detecta la reescritura de un fichero que YA estaba sucio (el porcelain no cambia, el contenido si)', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    await writeFile(path.join(repoRoot, 'README.md'), 'trabajo de la persona\n', 'utf8');
+    await reescribirScriptSinCommitear(
+      repoRoot,
+      SCRIPT_SYNC + "writeFileSync('README.md', 'pisado por el script\\n');\n"
+    );
+    const dir = await tocarTarea(tareasRoot);
+    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
+    assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
+    assert.match(r.avisos.join('\n'), /README\.md/);
+  });
+});
+
+/** Como reescribirScript pero sin commit, para no barrer el README sucio del test. */
+async function reescribirScriptSinCommitear(repoRoot: string, contenido: string): Promise<void> {
+  await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), contenido, 'utf8');
+  git(['add', '--', 'scripts/sync.mjs'], repoRoot);
+  git(['commit', '-q', '-m', 'chore: script nuevo', '--', 'scripts/sync.mjs'], repoRoot);
+}
+
+// ─── finish: el caso sin retorno ───────────────────────────────────────────
+
+test('sincronizacion en finish: si el script falla tras el merge, la tarea queda cerrada y commiteada en develop y el arbol limpio', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ estado: 'en-revision', plan_aprobado: true });
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await mkdir(path.join(tareasRoot, '03-en-revision'), { recursive: true });
+    git(['mv', 'tareas/01-en-diseno/TASK-920', 'tareas/03-en-revision/TASK-920'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
+    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1.md'),
+      '# Informe\n\n- Veredicto: aprobada\n',
+      'utf8'
+    );
+    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), 'process.exit(1);\n', 'utf8');
+    commitAll(repoRoot, 'feat(TASK-920): trabajo revisado');
+    const planAntes = await planEnDisco(repoRoot);
+
+    const r = await runFinishCommand(tareasRoot, ['TASK-920'], '2026-10-03', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(r.autoCommit.sincronizacion.estado, 'fallida');
+    assert.equal(r.autoCommit.commiteado, true);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+    assert.ok(existsSync(path.join(tareasRoot, '04-terminadas', 'TASK-920', 'tarea.md')));
+    assert.equal(await planEnDisco(repoRoot), planAntes);
+    assert.equal(porcelain(repoRoot), '');
+  });
+});
+
+// ─── El codigo de salida del CLI real ──────────────────────────────────────
+
+test('taskctl (binario real): sale con 3 cuando la transicion se hizo pero la sincronizacion no, y con 0 cuando se aplico', async () => {
+  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot) => {
+    const ok = spawnSync('node', [BIN, 'approve', 'TASK-920'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+      stdio: ['ignore', 'pipe', 'pipe'],
+    });
+    assert.equal(ok.status, 0, ok.stderr);
+
+    await reescribirScript(repoRoot, 'process.exit(1);\n');
+    const tareaMd = path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-920', 'tarea.md');
+    const contenido = await readFile(tareaMd, 'utf8');
+    await writeFile(tareaMd, contenido.replace('plan_aprobado: true', 'plan_aprobado: false'));
+    commitAll(repoRoot, 'chore: desaprobar para reintentar');
+
+    const mal = spawnSync('node', [BIN, 'approve', 'TASK-920'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+      stdio: ['ignore', 'pipe', 'pipe'],
+    });
+    assert.equal(mal.status, CODIGO_SINCRONIZACION_NO_APLICADA, mal.stderr);
+    assert.match(mal.stderr, /\[AVISO\] La sincronizacion "node scripts\/sync\.mjs" salio con codigo 1/);
+    assert.match(mal.stdout, /aprobada/);
+    assert.equal(porcelain(repoRoot), '');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts
new file mode 100644
index 0000000..c36ac7d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts
@@ -0,0 +1,118 @@
+/**
+ * Claves de sincronizacion de `.taskcode/config.yml` (TASK-033). Fallo
+ * cerrado al CARGAR, no al commitear: para entonces la tarea ya se ha
+ * movido y un error tardio deja el workspace a medias.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { ConfigError, CONFIG_DEFAULTS, parsearConfig, resolverConfig } from '../../src/core/config.js';
+
+const RUTA = '/repo/.taskcode/config.yml';
+const BASE = 'comando_sincronizacion: "node scripts/sync.mjs"\n';
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
+test('config sincronizacion: sin claves, desactivada (defaults de 0.1.0 intactos)', () => {
+  const c = parsearConfig('limite_wip: 2\n', RUTA);
+  assert.equal(c.comando_sincronizacion, null);
+  assert.deepEqual(c.rutas_sincronizacion, []);
+  assert.equal(c.timeout_sincronizacion, 60);
+  assert.equal(CONFIG_DEFAULTS.comando_sincronizacion, null);
+});
+
+test('config sincronizacion: comando + rutas + timeout validos se leen y normalizan', () => {
+  const c = parsearConfig(
+    BASE + 'rutas_sincronizacion: [docs/PLAN.md, "./PLANIFICACION.md", docs\\otro.md, docs/PLAN.md]\n' +
+      'timeout_sincronizacion: 120\n',
+    RUTA
+  );
+  assert.equal(c.comando_sincronizacion, 'node scripts/sync.mjs');
+  assert.deepEqual(c.rutas_sincronizacion, ['docs/PLAN.md', 'PLANIFICACION.md', 'docs/otro.md']);
+  assert.equal(c.timeout_sincronizacion, 120);
+});
+
+test('config sincronizacion: las dos claves van juntas', () => {
+  rechaza(BASE, /"comando_sincronizacion" necesita tambien "rutas_sincronizacion"/);
+  rechaza('rutas_sincronizacion: [docs/PLAN.md]\n', /"rutas_sincronizacion" necesita tambien "comando_sincronizacion"/);
+  rechaza('timeout_sincronizacion: 30\n', /"timeout_sincronizacion" sin "comando_sincronizacion"/);
+});
+
+test('config sincronizacion: rutas invalidas abortan al cargar', () => {
+  const casos: [string, RegExp][] = [
+    ['[.]', /es la raiz del repo/],
+    ['[./]', /es una carpeta/],
+    ['[docs/]', /es una carpeta/],
+    ['[../fuera.md]', /se sale del repo/],
+    ['[docs/../../x.md]', /se sale del repo/],
+    ['[/etc/passwd]', /es absoluta/],
+    ['[C:/x.md]', /es absoluta/],
+    ['[tareas/x.md]', /esta bajo tareas\//],
+    ['[.taskcode/config.yml]', /esta bajo \.taskcode\//],
+    ['[.git/HEAD]', /esta bajo \.git\//],
+    ['[]', /lista no vacia/],
+    ['docs/PLAN.md', /lista no vacia entre corchetes/],
+  ];
+  for (const [valor, patron] of casos) {
+    rechaza(BASE + `rutas_sincronizacion: ${valor}\n`, patron);
+  }
+});
+
+test('config sincronizacion: comando vacio y timeout no positivo abortan', () => {
+  rechaza('comando_sincronizacion: ""\nrutas_sincronizacion: [a.md]\n', /debe ser un comando/);
+  rechaza(BASE + 'rutas_sincronizacion: [a.md]\ntimeout_sincronizacion: 0\n', /Son segundos/);
+  rechaza(BASE + 'rutas_sincronizacion: [a.md]\ntimeout_sincronizacion: 0\n', /Por defecto es 60/);
+});
+
+test('config sincronizacion: una errata en la clave aborta y sugiere la buena', () => {
+  rechaza('comando_sincronizacon: x\n', /Quiza quisiste decir "comando_sincronizacion"/);
+});
+
+test('config sincronizacion: el limite_wip invalido conserva su mensaje (no hereda el del timeout)', () => {
+  rechaza('limite_wip: 0\n', /impedirian arrancar cualquier tarea/);
+});
+
+test('config sincronizacion: el "#" sin comillas trunca el comando; entrecomillado se conserva', () => {
+  const sin = parsearConfig('comando_sincronizacion: node a.mjs #x\nrutas_sincronizacion: [a.md]\n', RUTA);
+  assert.equal(sin.comando_sincronizacion, 'node a.mjs');
+  const con = parsearConfig(
+    'comando_sincronizacion: "node a.mjs #x"\nrutas_sincronizacion: [a.md]\n',
+    RUTA
+  );
+  assert.equal(con.comando_sincronizacion, 'node a.mjs #x');
+});
+
+test('resolverConfig: una ruta de sincronizacion que en disco es una carpeta aborta', async () => {
+  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-cfgsync-'));
+  try {
+    await mkdir(path.join(repo, '.git'));
+    await mkdir(path.join(repo, 'docs'));
+    await mkdir(path.join(repo, '.taskcode'));
+    await writeFile(
+      path.join(repo, '.taskcode', 'config.yml'),
+      BASE + 'rutas_sincronizacion: [docs]\n',
+      'utf8'
+    );
+    assert.throws(() => resolverConfig(repo), /"docs" es una carpeta/);
+    await writeFile(
+      path.join(repo, '.taskcode', 'config.yml'),
+      BASE + 'rutas_sincronizacion: [docs/PLAN.md]\n',
+      'utf8'
+    );
+    assert.deepEqual(resolverConfig(repo).rutas_sincronizacion, ['docs/PLAN.md']);
+  } finally {
+    await rm(repo, { recursive: true, force: true });
+  }
+});
````
