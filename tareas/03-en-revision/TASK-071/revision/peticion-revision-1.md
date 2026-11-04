# Peticion de revision — TASK-071 (ronda 1)

- Tarea: TASK-071 — Hook Stop: una tarea no se da por hecha con la verificacion en rojo
- Rama revisada: feature/task-071-hook-stop-una-tarea-no-se-da-por-hecha-c
- Rama base: develop
- Commit revisado (HEAD): 0d3db851465d9dc230ba15139e7ce1667ddc4f57
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-071 (criterios de aceptacion y plan)

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
0d3db85 feat(TASK-071): hook Stop que frena el fin de turno con la verificacion en rojo
a9e2a1e chore(TASK-071): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index b6bae03..f8ed9b1 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -9,6 +9,22 @@
 - TASK-066 (feature) — Doctor-deploy A: catalogo generico y comprobaciones deterministas (2026-10-27)
 - TASK-067 (feature) — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release (2026-10-27)
 
+Freno de fin de turno (TASK-071): hook `Stop` que no deja dar el turno por terminado con la
+verificacion en rojo.
+
+- **Cambio de comportamiento**: un proyecto que declare `comando_verificacion` pasa a
+  EJECUTARLO al final de cada turno del agente mientras haya una tarea en
+  `tareas/02-en-curso/` en la rama actual. Sin la clave, o sin tarea en curso en la rama, el
+  hook sale 0 sin lanzar ningun proceso. Se apaga con `FRENO_VERIFICACION=0`.
+- En rojo (o cortada, o config invalida) sale con 2 y le devuelve el turno al agente con el
+  comando, el codigo, la duracion y el final de la salida (40 lineas / 4 KiB, sin ANSI ni
+  credenciales). Un solo disparo por turno (`stop_hook_active`).
+- Memo por huella del arbol en `.git/freno-verificacion.json`: sin cambios, no se vuelve a
+  ejecutar la suite. Tope de 3540 s por debajo del `timeout` de 3600 s del hook.
+- El envoltorio que ejecuta comandos con tope y mata el arbol pasa a
+  `fs/ejecucion-acotada.ts`, compartido con la sincronizacion (sin cambio de comportamiento).
+- El `PreToolUse` sigue siendo la sonda inerte de TASK-069 hasta TASK-072.
+
 Comando de verificacion declarado (TASK-070), primer paso de los frenos de verificacion.
 
 - **`comando_verificacion` y `timeout_verificacion`** en `.taskcode/config.yml`:
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index f70859e..02af52b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -577,8 +577,47 @@ timeout_verificacion: 900          # opcional, en segundos (por defecto 600)
 - Un valor inválido (comando vacío, timeout `0`, decimal o texto) aborta todos
   los comandos con un mensaje que nombra la clave y la línea; nunca se cae al
   valor por defecto en silencio.
-- Hoy solo la lee `taskctl doctor`; los frenos que la ejecutan (hook `Stop` y
-  puerta de `finish`) llegan en las versiones siguientes.
+- La ejecuta el **freno de fin de turno** (hook `Stop`, abajo). La puerta de
+  `finish` llega en una versión siguiente.
+
+#### Freno de fin de turno (hook `Stop`)
+
+El plugin declara en `hooks/hooks.json` un hook `Stop` que Claude Code ejecuta
+cada vez que el agente principal termina un turno, en todas las sesiones del
+proyecto. Solo actúa si **hay una tarea en `tareas/02-en-curso/` cuya `rama` es
+la rama actual** y el proyecto declara `comando_verificacion`; en cualquier otro
+caso sale 0 sin lanzar ningún proceso (ni `git`). Cuando actúa:
+
+- Ejecuta el comando con el mismo envoltorio que la sincronización (shell del
+  sistema, stdin cerrado, el árbol entero se mata al cortarlo) y la salida a un
+  fichero temporal, del que solo se lee el final.
+- **Verde** (código 0): deja terminar el turno, sin escribir nada.
+- **Rojo, cortado o no ejecutable**: sale con 2, así que Claude Code devuelve el
+  turno al agente con este informe por stderr: el comando, el código de salida
+  (o el corte), la duración y el final de la salida (stdout y stderr
+  intercalados), acotado a 40 líneas y 4 KiB, sin colores ANSI, sin credenciales
+  en URLs y sin partir caracteres. El informe pide no borrar ni saltar tests
+  para pasar el freno.
+- **Config inválida** con una tarea en curso en la rama: también sale con 2,
+  con el error de la config.
+- **Un solo disparo por turno**: si Claude Code ya está continuando por un
+  bloqueo del freno (`stop_hook_active`), deja terminar. Es a propósito: un test
+  intermitente no puede dejar al agente en un bucle.
+- **Memo por huella**: guarda el último resultado junto a una huella del árbol
+  (HEAD, comando, timeout y contenido de lo que no está limpio) en
+  `.git/freno-verificacion.json`. Con la misma huella no se vuelve a ejecutar:
+  un verde deja terminar y un rojo repite el informe, diciendo que es el
+  guardado. Cualquier cambio en el árbol lo invalida.
+- **Tope**: el `timeout` del hook es 3600 s, y Claude Code descarta la salida
+  de un hook que lo agota (el freno no frenaría). Por eso la verificación se
+  corta a `min(timeout_verificacion, 3540)` s, avisando si se recorta.
+- Si la verificación cambia ficheros del árbol (compilados, cobertura), el
+  informe lo avisa: el siguiente comando de `taskctl` puede abortar por
+  workspace sucio.
+- **Apagarlo**: `FRENO_VERIFICACION=0` en el entorno de Claude Code, o quitar
+  `comando_verificacion` de la config.
+- Los subagentes no disparan `Stop` (disparan `SubagentStop`), así que el freno
+  no los frena; y no actúa si la persona interrumpe el turno (Esc).
 
 `taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas]`
 es otro comando, distinto de `doctor`: aquel comprueba que el proyecto está listo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
index 9aec613..1276016 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
@@ -1,5 +1,5 @@
 {
-  "description": "TaskCode (TASK-069): sonda de hooks Stop y PreToolUse. Inerte salvo que TASKCODE_SONDA_MODO este definida; TASK-071/072 la sustituyen por los frenos reales.",
+  "description": "Freno de fin de turno: con una tarea en curso en la rama y comando_verificacion declarado, el agente no da el turno por terminado con la verificacion en rojo (FRENO_VERIFICACION=0 lo apaga). El PreToolUse sigue siendo la sonda inerte, salvo que su variable de modo este definida.",
   "hooks": {
     "Stop": [
       {
@@ -7,8 +7,10 @@
           {
             "type": "command",
             "command": "node",
-            "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"],
-            "timeout": 30
+            "args": [
+              "${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/stop-verificacion.js"
+            ],
+            "timeout": 3600
           }
         ]
       }
@@ -21,14 +23,18 @@
             "type": "command",
             "if": "Bash(git *)",
             "command": "node",
-            "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"],
+            "args": [
+              "${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"
+            ],
             "timeout": 30
           },
           {
             "type": "command",
             "if": "PowerShell(git *)",
             "command": "node",
-            "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"],
+            "args": [
+              "${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"
+            ],
             "timeout": 30
           }
         ]
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 02ed7d4..f45309d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -193,6 +193,13 @@ invalido de una clave conocida aborta todos los comandos, y una clave
 desconocida avisa y se ignora. La sincronizacion (y sus trampas: no usar un
 hook de pre-commit, codigo de salida 3) esta en [sincronizacion.md](sincronizacion.md).
 
+**Freno de fin de turno.** Con `comando_verificacion` declarado y una tarea en
+curso en la rama actual, el hook `Stop` del plugin ejecuta ese comando al
+terminar cada turno y, si no sale en verde, devuelve el turno con un informe
+(comando, codigo, duracion y final de la salida). Arregla la causa; no borres,
+saltes ni debilites tests para pasarlo. Si el rojo no es de tu cambio, dilo
+explicitamente al terminar: el freno solo bloquea una vez por turno.
+
 ## Cerrar una tarea
 
 Antes de lanzar `finish`, y otra vez justo despues, lee [cierre.md](cierre.md):
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
new file mode 100644
index 0000000..42f7f39
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
@@ -0,0 +1,115 @@
+/**
+ * Como se cuenta una verificacion en rojo — TASK-071. Funcion pura,
+ * compartida por el hook Stop y (TASK-072) por `finish`: los dos frenos
+ * tienen que decir lo mismo con las mismas palabras.
+ *
+ * Lo que trae siempre (criterio 3 de TASK-071): el comando, el codigo de
+ * salida (o el corte), la duracion y la cola de la salida, ACOTADA. La cola
+ * acaba en el transcript del agente, asi que ademas se limpia: sin secuencias
+ * ANSI (colores de los test runners), sin CRLF, sin credenciales en URLs, y
+ * cortada sin partir caracteres UTF-8.
+ */
+import { ocultarCredenciales } from './plataforma-remota.js';
+
+export type EstadoVerificacion = 'verde' | 'roja' | 'cortada' | 'no-lanzable';
+
+export interface ResultadoVerificacion {
+  estado: EstadoVerificacion;
+  comando: string;
+  /** Codigo de salida del comando; null si se corto o no se pudo lanzar. */
+  codigo: number | null;
+  duracionMs: number;
+  /** Segundos que se le dieron al comando. */
+  timeoutS: number;
+  /** Cola de la salida (stdout y stderr intercalados), sin limpiar ni acotar todavia. */
+  cola: string;
+  /** Bytes totales de la salida, aunque solo se haya leido la cola. */
+  bytesTotales: number;
+  /** Motivo, si no se pudo lanzar. */
+  error?: string;
+}
+
+/** Bytes y lineas maximos de la cola que se muestran. */
+export const MAX_BYTES_COLA = 4096;
+export const MAX_LINEAS_COLA = 40;
+
+// Secuencias CSI (colores, cursor) y OSC (titulos, hipervinculos) de terminal.
+const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g;
+
+/**
+ * La cola limpia y acotada a `maxLineas` lineas y `maxBytes` bytes (lo que
+ * se cumpla antes), quedandose con el FINAL: en un test runner el resumen y
+ * el ultimo fallo estan abajo.
+ */
+export function recortarCola(
+  texto: string,
+  maxBytes: number = MAX_BYTES_COLA,
+  maxLineas: number = MAX_LINEAS_COLA
+): { texto: string; recortada: boolean } {
+  const limpio = ocultarCredenciales(texto.replace(ANSI, '').replace(/\r\n?/g, '\n')).replace(/\s+$/, '');
+  let lineas = limpio.split('\n');
+  let recortada = false;
+  if (lineas.length > maxLineas) {
+    lineas = lineas.slice(-maxLineas);
+    recortada = true;
+  }
+  let salida = lineas.join('\n');
+  const buf = Buffer.from(salida, 'utf8');
+  if (buf.length > maxBytes) {
+    let desde = buf.length - maxBytes;
+    while (desde < buf.length && ((buf[desde] as number) & 0xc0) === 0x80) desde++;
+    salida = buf.subarray(desde).toString('utf8');
+    recortada = true;
+  }
+  return { texto: salida, recortada };
+}
+
+/** El resultado en una frase: «salio con codigo 1», «se corto a los 600 s»... */
+export function describirResultado(r: ResultadoVerificacion): string {
+  switch (r.estado) {
+    case 'verde':
+      return 'salio con codigo 0';
+    case 'roja':
+      return `salio con codigo ${String(r.codigo)}`;
+    case 'cortada':
+      return `no termino en ${String(r.timeoutS)} s y se ha cortado (con todos sus procesos)`;
+    case 'no-lanzable':
+      return `no se pudo ejecutar${r.error === undefined ? '' : ` (${r.error})`}`;
+  }
+}
+
+function segundos(ms: number): string {
+  return `${(ms / 1000).toFixed(1)} s`;
+}
+
+/**
+ * El informe de una verificacion que no esta en verde, listo para stderr.
+ * No nombra el producto: lo leen proyectos ajenos.
+ */
+export function formatearVerificacionRoja(
+  r: ResultadoVerificacion,
+  maxBytes: number = MAX_BYTES_COLA,
+  maxLineas: number = MAX_LINEAS_COLA
+): string {
+  const { texto, recortada } = recortarCola(r.cola, maxBytes, maxLineas);
+  const truncada = recortada || r.bytesTotales > Buffer.byteLength(r.cola, 'utf8');
+  const lineas = [
+    'La verificacion del proyecto no esta en verde: la tarea en curso no se puede dar por terminada.',
+    `  Comando:   ${r.comando}`,
+    `  Resultado: ${describirResultado(r)}`,
+    `  Duracion:  ${segundos(r.duracionMs)}`,
+  ];
+  if (texto === '') {
+    lineas.push('  Salida:    (vacia)');
+  } else {
+    const titulo = truncada
+      ? `  Final de la salida (truncada: ${String(r.bytesTotales)} bytes en total):`
+      : '  Salida:';
+    lineas.push(titulo, ...texto.split('\n').map((l) => `    ${l}`));
+  }
+  lineas.push(
+    'Arregla la causa y vuelve a verificar con el mismo comando. No borres, saltes ni debilites ' +
+      'tests para pasar este freno: si el rojo no es de tu cambio, dilo explicitamente.'
+  );
+  return lineas.join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
new file mode 100644
index 0000000..c0993bf
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts
@@ -0,0 +1,236 @@
+/**
+ * Ejecutar un comando de la persona con un tope de tiempo, matando el arbol
+ * entero al cortarlo, y huella del arbol de trabajo. Extraido de
+ * fs/sincronizacion.ts (TASK-033) en TASK-071 para que la sincronizacion y la
+ * verificacion (el hook Stop y, en TASK-072, `finish`) usen la MISMA pieza:
+ * dos envoltorios acabarian matando procesos de dos formas distintas.
+ *
+ * Las razones de cada decision (envoltorio node que aplica el timeout, salida a
+ * ficheros y no a tuberias, stdin ignorado) estan medidas, no supuestas: ver los
+ * comentarios de abajo y la historia de TASK-033.
+ */
+import { createHash } from 'node:crypto';
+import { closeSync, fstatSync, mkdtempSync, openSync, readFileSync, readSync, rmSync, statSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+
+/** Codigo con el que ENVOLTORIO dice "lo he cortado por timeout". */
+export const CODIGO_TIMEOUT_ENVOLTORIO = 124;
+/**
+ * Marca que ENVOLTORIO escribe en stderr al cortar. Sin ella, un script
+ * que saliera con 124 por su cuenta se describiria como un timeout
+ * (hallazgo MENOR de la revision de TASK-033).
+ */
+export const MARCA_TIMEOUT = '[taskctl:timeout]';
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
+ * - Al cortar sale EN EL ACTO, sin esperar al `close` del hijo. El hijo
+ *   tiene tuberias propias (la salida se reenvia), asi que un nieto que
+ *   sobreviviera al kill retendria las del envoltorio, no las de
+ *   taskctl: `spawnSync` vuelve igual. Con `stdio: 'inherit'` y un kill
+ *   que fallara, taskctl se quedaba colgado para siempre (medido con un
+ *   mutante en la revision).
+ * - Sale con el codigo del comando, o con 124 (como `timeout(1)`) si lo
+ *   corto.
+ */
+const ENVOLTORIO = `
+const { spawn, spawnSync } = require('node:child_process');
+const [comando, ms] = process.argv.slice(1);
+const win = process.platform === 'win32';
+const hijo = spawn(comando, { shell: true, stdio: ['ignore', 'pipe', 'pipe'],
+  windowsHide: true, detached: !win });
+hijo.stdout.on('data', (d) => process.stdout.write(d));
+hijo.stderr.on('data', (d) => process.stderr.write(d));
+const t = setTimeout(() => {
+  hijo.stdout.removeAllListeners('data');
+  hijo.stderr.removeAllListeners('data');
+  if (win) spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
+  else { try { process.kill(-hijo.pid, 'SIGKILL'); } catch {} }
+  process.stderr.write('${MARCA_TIMEOUT}', () => process.exit(${String(CODIGO_TIMEOUT_ENVOLTORIO)}));
+}, Number(ms));
+hijo.on('error', (e) => { clearTimeout(t); process.stderr.write(String(e.message)); process.exit(127); });
+hijo.on('close', (code, signal) => {
+  clearTimeout(t);
+  if (code === null) { process.stderr.write('termino por la senal ' + signal); process.exit(1); }
+  process.exit(code);
+});
+`;
+
+export interface OpcionesEjecucion {
+  /**
+   * true: stdout y stderr van al MISMO fichero, intercalados como los veria
+   * la persona en su terminal. `salida` es entonces esa salida unida; si no,
+   * es solo el stderr (lo que necesita la sincronizacion).
+   */
+  unirSalida?: boolean;
+  /** Bytes que se leen del final de la salida (por defecto 64 KiB). Nunca se lee entera. */
+  bytesCola?: number;
+}
+
+export interface SalidaEjecucion {
+  error?: Error;
+  status: number | null;
+  signal: NodeJS.Signals | null;
+  /** Los ultimos `bytesCola` bytes de la salida, en UTF-8. */
+  salida: string;
+  /** Tamano total de la salida, aunque solo se haya leido la cola. */
+  bytesTotales: number;
+  duracionMs: number;
+}
+
+/**
+ * Lanza ENVOLTORIO con la salida a FICHEROS temporales, no a tuberias.
+ * Con tuberias, en Windows cmd.exe hereda tambien las del propio
+ * envoltorio, asi que un nieto que sobreviva al kill retiene la de
+ * taskctl y `spawnSync` espera su EOF para siempre — medido con un
+ * mutante del `taskkill` en la revision de TASK-033: el test se colgo
+ * 30 min y el timeout por test no lo corta porque `spawnSync` bloquea el
+ * event loop. Con ficheros, `spawnSync` vuelve en cuanto el envoltorio
+ * sale, quede vivo lo que quede.
+ *
+ * stdin ignorado SIEMPRE: con una tuberia heredada que nadie cierra (un
+ * arnes de agente, `node --test`) un script que pregunte algo esperaria
+ * para siempre. Con EOF, falla.
+ */
+export function ejecutarAcotado(
+  raiz: string,
+  comando: string,
+  timeoutMs: number,
+  opciones: OpcionesEjecucion = {}
+): SalidaEjecucion {
+  const unir = opciones.unirSalida === true;
+  const bytesCola = opciones.bytesCola ?? 64 * 1024;
+  const dir = mkdtempSync(path.join(tmpdir(), 'taskctl-ejecucion-'));
+  const rutaOut = path.join(dir, 'stdout');
+  const rutaErr = path.join(dir, 'stderr');
+  const fdOut = openSync(rutaOut, 'w');
+  const fdErr = unir ? fdOut : openSync(rutaErr, 'w');
+  // Una sola vez cada uno: cerrar dos veces el mismo numero de fd puede
+  // cerrar otro fichero que el sistema le haya reasignado entretanto.
+  let cerrados = false;
+  const cerrar = (): void => {
+    if (cerrados) return;
+    cerrados = true;
+    closeSync(fdOut);
+    if (!unir) closeSync(fdErr);
+  };
+  const inicio = Date.now();
+  try {
+    const r = spawnSync(process.execPath, ['-e', ENVOLTORIO, comando, String(timeoutMs)], {
+      cwd: raiz,
+      stdio: ['ignore', fdOut, fdErr],
+      // Red de seguridad por si el propio envoltorio se colgara.
+      timeout: timeoutMs + 15000,
+      windowsHide: true,
+    });
+    const duracionMs = Date.now() - inicio;
+    cerrar();
+    const { texto, total } = leerCola(unir ? rutaOut : rutaErr, bytesCola);
+    const salida: SalidaEjecucion = { status: r.status, signal: r.signal, salida: texto, bytesTotales: total, duracionMs };
+    if (r.error !== undefined) salida.error = r.error;
+    return salida;
+  } finally {
+    // Un huerfano puede tener aun el fichero abierto (EBUSY en
+    // Windows): se deja para el limpiador del sistema, no es un fallo.
+    try {
+      cerrar();
+    } catch {
+      /* no se pudo cerrar: no afecta */
+    }
+    try {
+      rmSync(dir, { recursive: true, force: true });
+    } catch {
+      /* ver arriba */
+    }
+  }
+}
+
+/**
+ * Los ultimos `bytes` bytes de un fichero, sin leerlo entero: un `npm test`
+ * puede soltar megas y el coste no debe depender de eso. Si el corte cae en
+ * medio de un caracter UTF-8, se descartan los bytes de continuacion sueltos
+ * del principio.
+ */
+export function leerCola(ruta: string, bytes: number): { texto: string; total: number } {
+  const fd = openSync(ruta, 'r');
+  try {
+    const total = fstatSync(fd).size;
+    const n = Math.min(total, bytes);
+    const buf = Buffer.alloc(n);
+    let leidos = 0;
+    while (leidos < n) {
+      const k = readSync(fd, buf, leidos, n - leidos, total - n + leidos);
+      if (k === 0) break;
+      leidos += k;
+    }
+    let desde = 0;
+    if (total > n) {
+      while (desde < leidos && desde < 4 && ((buf[desde] as number) & 0xc0) === 0x80) desde++;
+    }
+    return { texto: buf.subarray(desde, leidos).toString('utf8'), total };
+  } finally {
+    closeSync(fd);
+  }
+}
+
+/** true si la salida dice que ENVOLTORIO corto el comando por timeout. */
+export function fueCortado(r: SalidaEjecucion): boolean {
+  if (r.error !== undefined && (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') return true;
+  return r.status === CODIGO_TIMEOUT_ENVOLTORIO && r.salida.endsWith(MARCA_TIMEOUT);
+}
+
+/**
+ * Foto de lo que NO esta limpio en el arbol: ruta -> huella del
+ * contenido. Comparar solo el porcelain no basta (hallazgo del rol de
+ * riesgos de TASK-033): un fichero que ya estaba en ` M` por trabajo de la
+ * persona sigue en ` M` aunque el comando lo reescriba. Por eso se compara
+ * el contenido, y solo de lo que ya esta sucio (lo limpio, si cambia,
+ * aparece nuevo en la segunda foto).
+ */
+export function fotoDelArbol(raiz: string): Map<string, string> {
+  // Sin runGit a proposito: recorta la salida, y el recorte se come el
+  // espacio inicial de la primera entrada (" M ruta"), desplazando la
+  // ruta un caracter.
+  const r = spawnSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
+    cwd: raiz,
+    encoding: 'utf8',
+    maxBuffer: 64 * 1024 * 1024,
+  });
+  if (r.status !== 0) {
+    throw new Error(`git status fallo: ${String(r.stderr ?? '').trim()}`);
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
+    foto.set(ruta, huellaFichero(path.join(raiz, ruta)));
+  }
+  return foto;
+}
+
+function huellaFichero(fichero: string): string {
+  try {
+    if (!statSync(fichero).isFile()) return 'no-fichero';
+    return createHash('sha1').update(readFileSync(fichero)).digest('hex');
+  } catch {
+    return 'ausente';
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
index 90cd253..bf9f8d4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
@@ -33,22 +33,12 @@
  *   (c) el comando toco ficheros no declarados: esos no se tocan y se
  *       nombran; las rutas declaradas si se commitean.
  */
-import { createHash } from 'node:crypto';
-import {
-  closeSync,
-  existsSync,
-  mkdtempSync,
-  openSync,
-  readdirSync,
-  readFileSync,
-  rmSync,
-  statSync,
-} from 'node:fs';
-import { tmpdir } from 'node:os';
+import { existsSync, readdirSync, rmSync } from 'node:fs';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
 import { raizDelRepo, type TaskcodeConfig } from '../core/config.js';
 import { runGit } from './git.js';
+import { ejecutarAcotado, fotoDelArbol, fueCortado, type SalidaEjecucion } from './ejecucion-acotada.js';
 
 /**
  * Codigo de salida del CLI cuando la transicion se hizo pero la
@@ -145,7 +135,7 @@ export function ejecutarSincronizacion(
   // stdin ignorado SIEMPRE: con una tuberia heredada que nadie cierra
   // (un arnes de agente, `node --test`) un script que pregunte algo
   // esperaria para siempre. Con EOF, falla y se va por (b).
-  const r = lanzarEnvoltorio(raiz, comando, timeoutMs);
+  const r = ejecutarAcotado(raiz, comando, timeoutMs);
 
   const fallo = describirFallo(r, timeoutMs);
   if (fallo !== null) {
@@ -278,133 +268,14 @@ function nombreRealEnDisco(raiz: string, rel: string): string | null {
   return partes.join('/');
 }
 
-/** Codigo con el que ENVOLTORIO dice "lo he cortado por timeout". */
-const CODIGO_TIMEOUT_ENVOLTORIO = 124;
-/**
- * Marca que ENVOLTORIO escribe en stderr al cortar. Sin ella, un script
- * que saliera con 124 por su cuenta se describiria como un timeout
- * (hallazgo MENOR de la revision).
- */
-const MARCA_TIMEOUT = '[taskctl:timeout]';
-
-/**
- * Ejecuta argv[1] con el shell del sistema y lo corta a los argv[2] ms.
- *
- * - shell: true en las dos plataformas: cmd.exe en Windows (necesario
- *   para resolver `pnpm.cmd` / `npm.cmd`; sin shell, ENOENT — el fallo
- *   que costo una ronda en codex-review) y /bin/sh en POSIX. El comando
- *   es entero de la persona y no se le interpola nada, asi que no se
- *   escapa: escaparlo cambiaria lo que escribio.
- * - Al vencer el timeout mata el ARBOL: `taskkill /T /F` en Windows
- *   (con el hijo aun vivo, que es cuando /T puede recorrerlo) y el
- *   grupo de procesos en POSIX (por eso `detached`).
- * - Al cortar sale EN EL ACTO, sin esperar al `close` del hijo. El hijo
- *   tiene tuberias propias (la salida se reenvia), asi que un nieto que
- *   sobreviviera al kill retendria las del envoltorio, no las de
- *   taskctl: `spawnSync` vuelve igual. Con `stdio: 'inherit'` y un kill
- *   que fallara, taskctl se quedaba colgado para siempre (medido con un
- *   mutante en la revision).
- * - Sale con el codigo del comando, o con 124 (como `timeout(1)`) si lo
- *   corto.
- */
-const ENVOLTORIO = `
-const { spawn, spawnSync } = require('node:child_process');
-const [comando, ms] = process.argv.slice(1);
-const win = process.platform === 'win32';
-const hijo = spawn(comando, { shell: true, stdio: ['ignore', 'pipe', 'pipe'],
-  windowsHide: true, detached: !win });
-hijo.stdout.on('data', (d) => process.stdout.write(d));
-hijo.stderr.on('data', (d) => process.stderr.write(d));
-const t = setTimeout(() => {
-  if (win) spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
-  else { try { process.kill(-hijo.pid, 'SIGKILL'); } catch {} }
-  process.stderr.write('${MARCA_TIMEOUT}', () => process.exit(${String(CODIGO_TIMEOUT_ENVOLTORIO)}));
-}, Number(ms));
-hijo.on('error', (e) => { clearTimeout(t); process.stderr.write(String(e.message)); process.exit(127); });
-hijo.on('close', (code, signal) => {
-  clearTimeout(t);
-  if (code === null) { process.stderr.write('termino por la senal ' + signal); process.exit(1); }
-  process.exit(code);
-});
-`;
-
-interface SalidaEnvoltorio {
-  error?: Error;
-  status: number | null;
-  signal: NodeJS.Signals | null;
-  stderr: string;
-}
-
-/**
- * Lanza ENVOLTORIO con la salida a FICHEROS temporales, no a tuberias.
- * Con tuberias, en Windows cmd.exe hereda tambien las del propio
- * envoltorio, asi que un nieto que sobreviva al kill retiene la de
- * taskctl y `spawnSync` espera su EOF para siempre — medido con un
- * mutante del `taskkill` en la revision: el test se colgo 30 min y el
- * timeout por test no lo corta porque `spawnSync` bloquea el event
- * loop. Con ficheros, `spawnSync` vuelve en cuanto el envoltorio sale,
- * quede vivo lo que quede.
- */
-function lanzarEnvoltorio(raiz: string, comando: string, timeoutMs: number): SalidaEnvoltorio {
-  const dir = mkdtempSync(path.join(tmpdir(), 'taskctl-sync-salida-'));
-  const rutaOut = path.join(dir, 'stdout');
-  const rutaErr = path.join(dir, 'stderr');
-  const fdOut = openSync(rutaOut, 'w');
-  const fdErr = openSync(rutaErr, 'w');
-  // Una sola vez cada uno: cerrar dos veces el mismo numero de fd puede
-  // cerrar otro fichero que el sistema le haya reasignado entretanto.
-  let cerrados = false;
-  const cerrar = (): void => {
-    if (cerrados) return;
-    cerrados = true;
-    closeSync(fdOut);
-    closeSync(fdErr);
-  };
-  try {
-    const r = spawnSync(process.execPath, ['-e', ENVOLTORIO, comando, String(timeoutMs)], {
-      cwd: raiz,
-      stdio: ['ignore', fdOut, fdErr],
-      // Red de seguridad por si el propio envoltorio se colgara.
-      timeout: timeoutMs + 15000,
-      windowsHide: true,
-    });
-    cerrar();
-    const salida: SalidaEnvoltorio = {
-      status: r.status,
-      signal: r.signal,
-      stderr: readFileSync(rutaErr, 'utf8'),
-    };
-    if (r.error !== undefined) salida.error = r.error;
-    return salida;
-  } finally {
-    // Un huerfano puede tener aun el fichero abierto (EBUSY en
-    // Windows): se deja para el limpiador del sistema, no es un fallo.
-    try {
-      cerrar();
-    } catch {
-      /* no se pudo cerrar: no afecta a la transicion */
-    }
-    try {
-      rmSync(dir, { recursive: true, force: true });
-    } catch {
-      /* ver arriba */
-    }
-  }
-}
-
 /** null si el comando termino bien; si no, que le paso, en palabras de persona. */
-function describirFallo(r: SalidaEnvoltorio, timeoutMs: number): string | null {
+function describirFallo(r: SalidaEjecucion, timeoutMs: number): string | null {
   const corte = `no termino en ${String(Math.round(timeoutMs / 1000))} s y se ha cortado`;
-  if (r.error !== undefined) {
-    if ((r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') return corte;
-    return `no se pudo ejecutar (${r.error.message})`;
-  }
-  if (r.status === CODIGO_TIMEOUT_ENVOLTORIO && String(r.stderr ?? '').endsWith(MARCA_TIMEOUT)) {
-    return corte;
-  }
+  if (fueCortado(r)) return corte;
+  if (r.error !== undefined) return `no se pudo ejecutar (${r.error.message})`;
   if (r.signal !== null) return `termino por la senal ${r.signal}`;
   if (r.status !== 0) {
-    const stderr = String(r.stderr ?? '').trim();
+    const stderr = r.salida.trim();
     const cola = stderr === '' ? '' : `: ${ultimasLineas(stderr, 5)}`;
     return `salio con codigo ${String(r.status)}${cola}`;
   }
@@ -425,51 +296,6 @@ function porcelain(raiz: string, rutas: readonly string[]): string[] {
     .map((l) => l.slice(l.indexOf(' ') + 1).trim());
 }
 
-/**
- * Foto de lo que NO esta limpio en el arbol: ruta -> huella del
- * contenido. Comparar solo el porcelain no basta (hallazgo del rol de
- * riesgos): un fichero que ya estaba en ` M` por trabajo de la persona
- * sigue en ` M` aunque el comando lo reescriba. Por eso se compara el
- * contenido, y solo de lo que ya esta sucio (lo limpio, si cambia,
- * aparece nuevo en la segunda foto).
- */
-function fotoDelArbol(raiz: string): Map<string, string> {
-  // Sin runGit a proposito: recorta la salida, y el recorte se come el
-  // espacio inicial de la primera entrada (" M ruta"), desplazando la
-  // ruta un caracter.
-  const r = spawnSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
-    cwd: raiz,
-    encoding: 'utf8',
-    maxBuffer: 64 * 1024 * 1024,
-  });
-  if (r.status !== 0) {
-    throw new Error(`git status fallo al sincronizar: ${String(r.stderr ?? '').trim()}`);
-  }
-  const salida = r.stdout ?? '';
-  const foto = new Map<string, string>();
-  const entradas = salida.split('\0');
-  for (let i = 0; i < entradas.length; i++) {
-    const e = entradas[i] as string;
-    if (e.length < 4) continue;
-    const xy = e.slice(0, 2);
-    const ruta = e.slice(3);
-    // En un renombrado, -z pone la ruta de origen en la entrada
-    // siguiente: se salta para no tomarla por un fichero aparte.
-    if (xy.includes('R') || xy.includes('C')) i++;
-    foto.set(ruta, huella(path.join(raiz, ruta)));
-  }
-  return foto;
-}
-
-function huella(fichero: string): string {
-  try {
-    if (!statSync(fichero).isFile()) return 'no-fichero';
-    return createHash('sha1').update(readFileSync(fichero)).digest('hex');
-  } catch {
-    return 'ausente';
-  }
-}
-
 /**
  * (b) Deja cada ruta declarada como en HEAD. Estaban limpias antes de
  * ejecutar (lo garantiza (a)), asi que lo unico que se deshace es lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
new file mode 100644
index 0000000..711f20b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -0,0 +1,134 @@
+/**
+ * Ejecutar la verificacion del proyecto (`comando_verificacion`) — TASK-071.
+ * Pieza comun del hook Stop y de la puerta de `finish` (TASK-072): la
+ * politica (bloquear un turno, abortar un cierre) es de cada consumidor; aqui
+ * solo se ejecuta, se mide y se recuerda.
+ *
+ * MEMO POR HUELLA (decision de Carlos en el plan de TASK-071): con una tarea
+ * en curso, cada fin de turno pediria la suite entera aunque el turno no haya
+ * tocado nada (~10 min en el repo que construye esto). Se guarda el
+ * resultado junto a una huella del arbol (HEAD, comando, timeout y contenido
+ * de lo que no esta limpio); con la misma huella, verde y rojo se reutilizan
+ * sin ejecutar. Se acepta que un rojo intermitente no se reintenta hasta que
+ * algo cambie, y el informe lo dice.
+ *
+ * El memo vive bajo `.git/` (`git rev-parse --git-path`), nunca en el
+ * workspace: alli ensuciaria el arbol y cambiaria su propia huella. Tampoco
+ * bajo la carpeta del plugin, que cambia al actualizarlo.
+ */
+import { createHash } from 'node:crypto';
+import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { ejecutarAcotado, fotoDelArbol, fueCortado, MARCA_TIMEOUT } from './ejecucion-acotada.js';
+import type { ResultadoVerificacion } from '../core/informe-verificacion.js';
+
+/** Bytes del final de la salida que se leen (el informe muestra menos: ver informe-verificacion). */
+const BYTES_COLA_LEIDOS = 16 * 1024;
+const FICHERO_MEMO = 'freno-verificacion.json';
+const VERSION_MEMO = 1;
+
+export interface OpcionesVerificacion {
+  /** Solo para tests: sustituye al timeout en segundos (en ms). */
+  timeoutMs?: number;
+}
+
+/** Ejecuta `comando` en `raiz` con un tope de `timeoutS` segundos. Nunca lanza. */
+export function ejecutarVerificacion(
+  raiz: string,
+  comando: string,
+  timeoutS: number,
+  opciones: OpcionesVerificacion = {}
+): ResultadoVerificacion {
+  const timeoutMs = opciones.timeoutMs ?? timeoutS * 1000;
+  const r = ejecutarAcotado(raiz, comando, timeoutMs, { unirSalida: true, bytesCola: BYTES_COLA_LEIDOS });
+  const base = {
+    comando,
+    duracionMs: r.duracionMs,
+    timeoutS: Math.round(timeoutMs / 1000),
+    bytesTotales: r.bytesTotales,
+  };
+  if (fueCortado(r)) {
+    const cola = r.salida.endsWith(MARCA_TIMEOUT) ? r.salida.slice(0, -MARCA_TIMEOUT.length) : r.salida;
+    return { ...base, estado: 'cortada', codigo: null, cola };
+  }
+  if (r.error !== undefined) {
+    return { ...base, estado: 'no-lanzable', codigo: null, cola: r.salida, error: r.error.message };
+  }
+  if (r.status === null) {
+    return { ...base, estado: 'roja', codigo: null, cola: r.salida, error: `senal ${String(r.signal)}` };
+  }
+  return { ...base, estado: r.status === 0 ? 'verde' : 'roja', codigo: r.status, cola: r.salida };
+}
+
+// ---------------------------------------------------------------------
+// Huella y memo
+// ---------------------------------------------------------------------
+
+function git(args: readonly string[], cwd: string): string | null {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
+  if (r.error !== undefined || r.status !== 0) return null;
+  return (r.stdout ?? '').trim();
+}
+
+/**
+ * Huella del estado que la verificacion ve: HEAD, el comando, su timeout y
+ * el contenido de cada fichero que no esta limpio (incluidos los no
+ * trackeados). null si no se puede calcular (sin commits, git roto): sin
+ * huella no hay memo, y se ejecuta siempre.
+ */
+export function huellaDelArbol(raiz: string, comando: string, timeoutS: number): string | null {
+  const head = git(['rev-parse', 'HEAD'], raiz);
+  if (head === null) return null;
+  let foto: Map<string, string>;
+  try {
+    foto = fotoDelArbol(raiz);
+  } catch {
+    return null;
+  }
+  const h = createHash('sha1');
+  h.update(`v${String(VERSION_MEMO)}\0${head}\0${comando}\0${String(timeoutS)}\0`);
+  for (const ruta of [...foto.keys()].sort()) h.update(`${ruta}\0${foto.get(ruta) as string}\0`);
+  return h.digest('hex');
+}
+
+export interface MemoVerificacion {
+  version: number;
+  huella: string;
+  resultado: ResultadoVerificacion;
+  fecha: string;
+}
+
+function rutaMemo(raiz: string): string | null {
+  const p = git(['rev-parse', '--git-path', FICHERO_MEMO], raiz);
+  if (p === null || p === '') return null;
+  return path.resolve(raiz, p);
+}
+
+/** El resultado guardado para esa huella, o null. Un memo ilegible es como no tenerlo. */
+export function leerMemo(raiz: string, huella: string): ResultadoVerificacion | null {
+  const ruta = rutaMemo(raiz);
+  if (ruta === null) return null;
+  try {
+    const m = JSON.parse(readFileSync(ruta, 'utf8')) as Partial<MemoVerificacion>;
+    if (m.version !== VERSION_MEMO || m.huella !== huella || typeof m.resultado !== 'object' || m.resultado === null) {
+      return null;
+    }
+    return m.resultado;
+  } catch {
+    return null;
+  }
+}
+
+/** Guarda el resultado de la ultima verificacion. Un fallo al guardar no es un fallo de la verificacion. */
+export function guardarMemo(raiz: string, huella: string, resultado: ResultadoVerificacion): void {
+  const ruta = rutaMemo(raiz);
+  if (ruta === null) return;
+  const memo: MemoVerificacion = { version: VERSION_MEMO, huella, resultado, fecha: new Date().toISOString() };
+  try {
+    mkdirSync(path.dirname(ruta), { recursive: true });
+    writeFileSync(ruta, `${JSON.stringify(memo)}\n`, 'utf8');
+  } catch {
+    /* sin memo: la proxima vez se ejecuta */
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
new file mode 100644
index 0000000..96bb811
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -0,0 +1,198 @@
+/**
+ * Freno de fin de turno — TASK-071. Lo ejecuta el hook `Stop` de Claude Code
+ * (hooks/hooks.json -> dist/src/hooks/stop-verificacion.js) al terminar cada
+ * turno del agente principal, en TODAS las sesiones de TODOS los proyectos con
+ * el plugin. De ahi el orden de las guardas: de la mas barata a la mas cara, y
+ * ningun proceso hasta saber que hay una tarea en curso.
+ *
+ *   1. `FRENO_VERIFICACION=0` en el entorno: interruptor de emergencia.
+ *   2. `stop_hook_active: true`: Claude Code ya esta continuando por un
+ *      bloqueo nuestro; volver a bloquear haria un bucle con un test flaky.
+ *      Por eso el freno es de UN disparo por turno (aceptado en el plan).
+ *   3. `tareas/02-en-curso/` no existe en la raiz del repo (solo `stat`).
+ *   4. Ninguna tarea en curso (lectura de esa carpeta).
+ *   5. Config: sin `comando_verificacion`, nada. Config invalida: se recuerda.
+ *   6. La rama actual (el unico `git`) no es la `rama` de ninguna tarea en
+ *      curso: nada. HEAD desacoplado cae aqui (aceptado en el plan).
+ *   7. Config invalida con tarea en curso en la rama: BLOQUEA (decision de
+ *      Carlos: fallo cerrado, como el resto de la config).
+ *   8. Memo: misma huella del arbol que la ultima verificacion -> su resultado.
+ *   9. Ejecutar. Verde -> 0. Cualquier otra cosa -> 2 con el informe.
+ *
+ * Contrato con Claude Code (spike TASK-069 y documentacion oficial): exit 0
+ * deja parar; exit 2 bloquea y el stderr le llega al agente; exit 1 NO
+ * bloquea, asi que nunca se sale con 1 por accidente: decidirStop no lanza.
+ * Nada de lo que escribe nombra el producto: lo leen proyectos ajenos.
+ */
+import { existsSync, statSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
+import { formatearVerificacionRoja, type ResultadoVerificacion } from '../core/informe-verificacion.js';
+import { listTareasEnEstados } from '../fs/task-store.js';
+import { ejecutarVerificacion, guardarMemo, huellaDelArbol, leerMemo } from '../fs/verificacion.js';
+
+/**
+ * `timeout` del hook Stop en hooks/hooks.json, en segundos. Claude Code cancela
+ * el hook al vencerlo y descarta su salida: el freno fallaria ABIERTO. Por eso
+ * la verificacion se corta antes, con margen para escribir el informe. Un test
+ * comprueba que coincide con hooks.json.
+ */
+export const TECHO_HOOK_S = 3600;
+export const MARGEN_HOOK_S = 60;
+/** Variable de entorno que apaga el freno: `FRENO_VERIFICACION=0`. */
+export const INTERRUPTOR = 'FRENO_VERIFICACION';
+
+export interface EntradaStop {
+  cwd?: unknown;
+  stop_hook_active?: unknown;
+  hook_event_name?: unknown;
+}
+
+export interface DecisionStop {
+  codigo: 0 | 2;
+  /** Texto para stderr (vacio cuando deja parar sin nada que decir). */
+  stderr: string;
+}
+
+export interface DepsFreno {
+  env?: NodeJS.ProcessEnv;
+  /** Solo para tests: sustituye al timeout de la verificacion (en ms). */
+  timeoutMs?: number;
+}
+
+const DEJAR_PARAR: DecisionStop = Object.freeze({ codigo: 0, stderr: '' });
+
+/** El directorio de tareas en curso, si existe. Sin procesos. */
+function carpetaEnCurso(raiz: string): string | null {
+  const dir = path.join(raiz, 'tareas', '02-en-curso');
+  try {
+    return statSync(dir).isDirectory() ? dir : null;
+  } catch {
+    return null;
+  }
+}
+
+function ramaActual(raiz: string): string | null {
+  const r = spawnSync('git', ['branch', '--show-current'], { cwd: raiz, encoding: 'utf8', windowsHide: true });
+  if (r.error !== undefined || r.status !== 0) return null;
+  const rama = (r.stdout ?? '').trim();
+  return rama === '' ? null : rama;
+}
+
+export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): Promise<DecisionStop> {
+  const env = deps.env ?? process.env;
+  // 1 y 2: sin I/O.
+  if (env[INTERRUPTOR] === '0') return DEJAR_PARAR;
+  if (entrada.stop_hook_active === true) return DEJAR_PARAR;
+  if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd)) return DEJAR_PARAR;
+
+  let raiz: string;
+  let ids: string[];
+  let config: TaskcodeConfig | null = null;
+  let errorConfig: string | null = null;
+  let rama: string | null;
+  try {
+    // 3 y 4: stat y lectura de una carpeta.
+    raiz = raizDelRepo(entrada.cwd);
+    const dir = carpetaEnCurso(raiz);
+    if (dir === null) return DEJAR_PARAR;
+    const { tareas } = await listTareasEnEstados(path.join(raiz, 'tareas'), ['en-curso']);
+    const ramas = new Set(tareas.map((t) => t.task.rama).filter((r): r is string => typeof r === 'string' && r !== ''));
+    ids = tareas.map((t) => t.task.id);
+    if (ramas.size === 0) return DEJAR_PARAR;
+
+    // 5: un readFile.
+    try {
+      config = resolverConfigConAvisos(raiz).config;
+      if (config.comando_verificacion === null) return DEJAR_PARAR;
+    } catch (e: unknown) {
+      if (!(e instanceof ConfigError)) throw e;
+      errorConfig = e.message.replace(/^\[ERROR\]\s*/, '');
+    }
+
+    // 6: el unico git hasta aqui.
+    rama = ramaActual(raiz);
+    if (rama === null || !ramas.has(rama)) return DEJAR_PARAR;
+    ids = tareas.filter((t) => t.task.rama === rama).map((t) => t.task.id);
+  } catch {
+    // Algo inesperado ANTES de saber si el freno aplica (tareas ilegibles,
+    // permisos): no se puede afirmar que haya una tarea en curso aqui.
+    return DEJAR_PARAR;
+  }
+
+  try {
+    const tarea = ids.join(', ');
+    // 7
+    if (errorConfig !== null || config === null) {
+      return {
+        codigo: 2,
+        stderr:
+          `Hay una tarea en curso en esta rama (${tarea}), pero la configuracion del proyecto no se ` +
+          `puede leer, asi que no se sabe como verificarla:\n  ${errorConfig ?? 'configuracion ausente'}\n` +
+          'Corrige .taskcode/config.yml y vuelve a verificar antes de dar la tarea por terminada.',
+      };
+    }
+    const comando = config.comando_verificacion as string;
+    const techo = TECHO_HOOK_S - MARGEN_HOOK_S;
+    const timeoutS = Math.min(config.timeout_verificacion, techo);
+    const avisos: string[] = [];
+    if (config.timeout_verificacion > techo) {
+      avisos.push(
+        `timeout_verificacion pide ${String(config.timeout_verificacion)} s, pero este freno tiene un tope de ` +
+          `${String(techo)} s: se ha usado el tope.`
+      );
+    }
+
+    // 8
+    const huella = huellaDelArbol(raiz, comando, timeoutS);
+    const guardado = huella === null ? null : leerMemo(raiz, huella);
+    if (guardado !== null) {
+      if (guardado.estado === 'verde') return DEJAR_PARAR;
+      avisos.push(
+        'Es el resultado guardado de la ultima verificacion: el arbol no ha cambiado desde entonces y no ' +
+          'se ha vuelto a ejecutar. Si crees que el fallo es intermitente, cambia algo o ejecuta el comando a mano.'
+      );
+      return bloquear(tarea, guardado, avisos);
+    }
+
+    // 9
+    const deOpciones = deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs };
+    const r = ejecutarVerificacion(raiz, comando, timeoutS, deOpciones);
+    const despues = huellaDelArbol(raiz, comando, timeoutS);
+    if (despues !== null) guardarMemo(raiz, despues, r);
+    if (r.estado === 'verde') return DEJAR_PARAR;
+    if (huella !== null && despues !== null && huella !== despues) {
+      avisos.push(
+        'La propia verificacion ha cambiado ficheros del arbol de trabajo (git status): revisalos antes del ' +
+          'siguiente comando, que puede abortar por workspace sucio.'
+      );
+    }
+    return bloquear(tarea, r, avisos);
+  } catch (e: unknown) {
+    // Con una tarea en curso en la rama y el freno configurado, un fallo del
+    // propio freno no puede convertirse en un "todo bien" silencioso.
+    const msg = e instanceof Error ? e.message : String(e);
+    return {
+      codigo: 2,
+      stderr:
+        `El freno de verificacion no pudo comprobar la tarea en curso: ${msg}\n` +
+        'Ejecuta a mano el comando de verificacion del proyecto antes de dar la tarea por terminada.',
+    };
+  }
+}
+
+function bloquear(tarea: string, r: ResultadoVerificacion, avisos: readonly string[]): DecisionStop {
+  const lineas = [`Tarea en curso en esta rama: ${tarea}.`, formatearVerificacionRoja(r), ...avisos];
+  return { codigo: 2, stderr: lineas.join('\n') };
+}
+
+/** Lee stdin entero (el JSON del hook). Un JSON roto o vacio es una entrada sin campos. */
+export function parsearEntrada(texto: string): EntradaStop {
+  try {
+    const v: unknown = JSON.parse(texto);
+    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as EntradaStop) : {};
+  } catch {
+    return {};
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/stop-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/stop-verificacion.ts
new file mode 100644
index 0000000..cd060b6
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/stop-verificacion.ts
@@ -0,0 +1,24 @@
+/**
+ * Punto de entrada del hook `Stop` (hooks/hooks.json). Solo lee stdin, decide
+ * (freno-stop.ts) y sale: 0 deja parar, 2 bloquea con el informe en stderr.
+ * Nunca sale con 1, que Claude Code trata como error NO bloqueante.
+ */
+import { readFileSync } from 'node:fs';
+import { decidirStop, parsearEntrada } from './freno-stop.js';
+
+let texto = '';
+try {
+  texto = readFileSync(0, 'utf8');
+} catch {
+  texto = '';
+}
+
+decidirStop(parsearEntrada(texto)).then(
+  (d) => {
+    if (d.stderr !== '') process.stderr.write(`${d.stderr}\n`);
+    process.exitCode = d.codigo;
+  },
+  () => {
+    process.exitCode = 0;
+  }
+);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
new file mode 100644
index 0000000..2fd1290
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
@@ -0,0 +1,313 @@
+/**
+ * Freno de fin de turno (TASK-071). Repos Git temporales de verdad, con una
+ * tarea en 02-en-curso y un `comando_verificacion` que ejecuta un script real
+ * de node. Nada de mocks: el comando se lanza con el mismo envoltorio que en
+ * produccion, y el punto de entrada se prueba ademas como proceso, con el JSON
+ * por stdin, igual que lo lanza Claude Code.
+ *
+ * El script de verificacion lee su desenlace de un fichero FUERA del repo
+ * (variable VERIF_DESENLACE, que hereda): asi se puede cambiar lo que haria sin
+ * tocar el arbol, que es justo lo que hace falta para probar el memo.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { decidirStop, MARGEN_HOOK_S, TECHO_HOOK_S, parsearEntrada } from '../../src/hooks/freno-stop.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { git, sampleTask } from '../helpers/finish-fixtures.js';
+
+const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
+const ENTRADA_HOOK = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'stop-verificacion.js');
+const RAMA = 'feature/task-071-freno';
+
+/** Lo que hace el script segun el fichero de desenlace: ok, ko, lento, ruido. */
+const SCRIPT = `
+const fs = require('node:fs');
+const d = fs.readFileSync(process.env.VERIF_DESENLACE, 'utf8').trim();
+fs.appendFileSync(process.env.VERIF_DESENLACE + '.cuenta', 'x');
+if (d === 'ok') { console.log('todo en verde'); process.exit(0); }
+if (d === 'lento') { setTimeout(() => {}, 60000); }
+else if (d === 'ruido') {
+  for (let i = 0; i < 5000; i++) console.log('\\u001b[31mlinea ' + i + ' con ñ y € y emoji 🚀\\u001b[0m');
+  console.error('fallo final: https://usuario:secreto@git.example.com/repo.git');
+  process.exit(1);
+} else { console.log('preparando'); console.error('ERROR: 2 tests fallan'); process.exit(3); }
+`;
+
+interface Repo {
+  raiz: string;
+  desenlace: string;
+  /** Cuantas veces se ha ejecutado de verdad el script. */
+  ejecuciones(): number;
+  limpiar(): Promise<void>;
+}
+
+async function montar(opts: { config?: string; tarea?: boolean; rama?: string } = {}): Promise<Repo> {
+  const raiz = await mkdtemp(path.join(tmpdir(), 'freno-stop-'));
+  const fuera = await mkdtemp(path.join(tmpdir(), 'freno-stop-desenlace-'));
+  const desenlace = path.join(fuera, 'desenlace');
+  await writeFile(desenlace, 'ok', 'utf8');
+  git(['init', '-q', '-b', 'main'], raiz);
+  git(['config', 'user.email', 'test@example.com'], raiz);
+  git(['config', 'user.name', 'Test'], raiz);
+  for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
+    await mkdir(path.join(raiz, 'tareas', c), { recursive: true });
+    await writeFile(path.join(raiz, 'tareas', c, '.gitkeep'), '', 'utf8');
+  }
+  if (opts.tarea !== false) {
+    const t = sampleTask({ id: 'TASK-071', estado: 'en-curso', rama: RAMA });
+    await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-071'), { recursive: true });
+    await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-071', 'tarea.md'), serializeTareaFile(t, '## Objetivo\nx\n'), 'utf8');
+  }
+  await mkdir(path.join(raiz, 'scripts'));
+  await writeFile(path.join(raiz, 'scripts', 'verif.cjs'), SCRIPT, 'utf8');
+  await mkdir(path.join(raiz, '.taskcode'));
+  await writeFile(
+    path.join(raiz, '.taskcode', 'config.yml'),
+    opts.config ?? 'comando_verificacion: "node scripts/verif.cjs"\n',
+    'utf8'
+  );
+  git(['add', '-A'], raiz);
+  git(['commit', '-q', '-m', 'inicial'], raiz);
+  git(['checkout', '-q', '-b', opts.rama ?? RAMA], raiz);
+  return {
+    raiz,
+    desenlace,
+    ejecuciones: () => (existsSync(`${desenlace}.cuenta`) ? readFileSync(`${desenlace}.cuenta`, 'utf8').length : 0),
+    limpiar: async () => {
+      await rm(raiz, { recursive: true, force: true, maxRetries: 5 });
+      await rm(fuera, { recursive: true, force: true, maxRetries: 5 });
+    },
+  };
+}
+
+async function conRepo(fn: (r: Repo) => Promise<void>, opts?: Parameters<typeof montar>[0]): Promise<void> {
+  const r = await montar(opts);
+  try {
+    await fn(r);
+  } finally {
+    await r.limpiar();
+  }
+}
+
+function decidir(r: Repo, extra: Record<string, unknown> = {}, deps: { timeoutMs?: number; env?: NodeJS.ProcessEnv } = {}) {
+  return decidirStop(
+    { hook_event_name: 'Stop', stop_hook_active: false, cwd: r.raiz, ...extra },
+    { env: { ...process.env, VERIF_DESENLACE: r.desenlace, ...deps.env }, ...(deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs }) }
+  );
+}
+
+// El script hereda el entorno del proceso de test (el envoltorio no lo filtra).
+function conDesenlace<T>(r: Repo, fn: () => Promise<T>): Promise<T> {
+  const antes = process.env['VERIF_DESENLACE'];
+  process.env['VERIF_DESENLACE'] = r.desenlace;
+  return fn().finally(() => {
+    if (antes === undefined) delete process.env['VERIF_DESENLACE'];
+    else process.env['VERIF_DESENLACE'] = antes;
+  });
+}
+
+test('freno: verificacion en verde deja parar, en silencio', async () => {
+  await conRepo((r) =>
+    conDesenlace(r, async () => {
+      const d = await decidir(r);
+      assert.deepEqual(d, { codigo: 0, stderr: '' });
+      assert.equal(r.ejecuciones(), 1);
+    })
+  );
+});
+
+test('freno: verificacion en rojo bloquea con exit 2 y el comando, el codigo, la duracion y la cola', async () => {
+  await conRepo((r) =>
+    conDesenlace(r, async () => {
+      await writeFile(r.desenlace, 'ko', 'utf8');
+      const d = await decidir(r);
+      assert.equal(d.codigo, 2);
+      assert.match(d.stderr, /Tarea en curso en esta rama: TASK-071/);
+      assert.match(d.stderr, /Comando: {3}node scripts\/verif\.cjs/);
+      assert.match(d.stderr, /Resultado: salio con codigo 3/);
+      assert.match(d.stderr, /Duracion: {2}\d+\.\d s/);
+      assert.match(d.stderr, /preparando[\s\S]*ERROR: 2 tests fallan/, 'stdout y stderr intercalados');
+      assert.match(d.stderr, /No borres, saltes ni debilites tests/);
+      assert.doesNotMatch(d.stderr, /taskcode/i, 'el texto lo leen proyectos ajenos');
+    })
+  );
+});
+
+test('freno: sin tarea en curso, rama ajena o sin comando no hace nada ni ejecuta el comando', async () => {
+  await conRepo(
+    (r) =>
+      conDesenlace(r, async () => {
+        await writeFile(r.desenlace, 'ko', 'utf8');
+        assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
+        assert.equal(r.ejecuciones(), 0);
+      }),
+    { tarea: false }
+  );
+  await conRepo(
+    (r) =>
+      conDesenlace(r, async () => {
+        await writeFile(r.desenlace, 'ko', 'utf8');
+        assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
+        assert.equal(r.ejecuciones(), 0);
+      }),
+    { rama: 'feature/otra-cosa' }
+  );
+  await conRepo(
+    (r) =>
+      conDesenlace(r, async () => {
+        await writeFile(r.desenlace, 'ko', 'utf8');
+        assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
+        assert.equal(r.ejecuciones(), 0);
+      }),
+    { config: 'limite_wip: 1\n' }
+  );
+});
+
+test('freno: fuera de un proyecto con tareas (o sin cwd) sale 0 sin tocar nada', async () => {
+  const vacio = await mkdtemp(path.join(tmpdir(), 'freno-stop-vacio-'));
+  try {
+    assert.deepEqual(await decidirStop({ cwd: vacio }), { codigo: 0, stderr: '' });
+    assert.deepEqual(await decidirStop({ cwd: path.join(vacio, 'no-existe') }), { codigo: 0, stderr: '' });
+    assert.deepEqual(await decidirStop({}), { codigo: 0, stderr: '' });
+    assert.deepEqual(parsearEntrada('no es json'), {});
+    assert.deepEqual(parsearEntrada('[1]'), {});
+  } finally {
+    await rm(vacio, { recursive: true, force: true });
+  }
+});
+
+test('freno: stop_hook_active e interruptor FRENO_VERIFICACION=0 dejan parar sin ejecutar', async () => {
+  await conRepo((r) =>
+    conDesenlace(r, async () => {
+      await writeFile(r.desenlace, 'ko', 'utf8');
+      assert.deepEqual(await decidir(r, { stop_hook_active: true }), { codigo: 0, stderr: '' });
+      assert.deepEqual(await decidir(r, {}, { env: { FRENO_VERIFICACION: '0' } }), { codigo: 0, stderr: '' });
+      assert.equal(r.ejecuciones(), 0);
+    })
+  );
+});
+
+test('freno: respeta el timeout y corta el comando (bloquea, no deja pasar)', async () => {
+  await conRepo((r) =>
+    conDesenlace(r, async () => {
+      await writeFile(r.desenlace, 'lento', 'utf8');
+      const inicio = Date.now();
+      const d = await decidir(r, {}, { timeoutMs: 1500 });
+      assert.ok(Date.now() - inicio < 20000, 'el corte no espera al comando');
+      assert.equal(d.codigo, 2);
+      assert.match(d.stderr, /no termino en \d+ s y se ha cortado/);
+      assert.doesNotMatch(d.stderr, /\[taskctl:timeout\]/, 'la marca interna no llega al agente');
+    })
+  );
+});
+
+test('freno: timeout_verificacion por encima del tope del hook se recorta y se avisa', async () => {
+  await conRepo(
+    (r) =>
+      conDesenlace(r, async () => {
+        await writeFile(r.desenlace, 'ko', 'utf8');
+        const d = await decidir(r);
+        assert.equal(d.codigo, 2);
+        assert.match(d.stderr, new RegExp(`pide 99999 s, pero este freno tiene un tope de ${String(TECHO_HOOK_S - MARGEN_HOOK_S)} s`));
+      }),
+    { config: 'comando_verificacion: "node scripts/verif.cjs"\ntimeout_verificacion: 99999\n' }
+  );
+});
+
+test('freno: config invalida con tarea en curso bloquea con el error de la config', async () => {
+  await conRepo(
+    (r) =>
+      conDesenlace(r, async () => {
+        const d = await decidir(r);
+        assert.equal(d.codigo, 2);
+        assert.match(d.stderr, /no se puede leer[\s\S]*timeout_verificacion[\s\S]*Corrige \.taskcode\/config\.yml/);
+        assert.equal(r.ejecuciones(), 0);
+      }),
+    { config: 'comando_verificacion: "node scripts/verif.cjs"\ntimeout_verificacion: 0\n' }
+  );
+});
+
+test('freno: memo por huella — mismo arbol no vuelve a ejecutar, un cambio si', async () => {
+  await conRepo((r) =>
+    conDesenlace(r, async () => {
+      assert.equal((await decidir(r)).codigo, 0);
+      assert.equal(r.ejecuciones(), 1);
+      // El desenlace cambia FUERA del arbol: con la misma huella vale el verde guardado.
+      await writeFile(r.desenlace, 'ko', 'utf8');
+      assert.equal((await decidir(r)).codigo, 0);
+      assert.equal(r.ejecuciones(), 1, 'verde memorizado');
+      // Un cambio en el arbol invalida el memo.
+      await writeFile(path.join(r.raiz, 'nuevo.txt'), 'x', 'utf8');
+      const rojo = await decidir(r);
+      assert.equal(rojo.codigo, 2);
+      assert.equal(r.ejecuciones(), 2);
+      // Rojo memorizado: se repite el informe sin ejecutar, y se dice.
+      await writeFile(r.desenlace, 'ok', 'utf8');
+      const otra = await decidir(r);
+      assert.equal(otra.codigo, 2);
+      assert.equal(r.ejecuciones(), 2, 'rojo memorizado');
+      assert.match(otra.stderr, /resultado guardado de la ultima verificacion/);
+      assert.match(otra.stderr, /salio con codigo 3/);
+      // El memo no ensucia el arbol: vive bajo .git/.
+      assert.equal(git(['status', '--porcelain', '--', '.taskcode', 'tareas', 'scripts'], r.raiz), '');
+      assert.ok(existsSync(path.join(r.raiz, '.git', 'freno-verificacion.json')));
+    })
+  );
+});
+
+test('freno: la cola va acotada, sin ANSI, sin credenciales y sin partir UTF-8', async () => {
+  await conRepo((r) =>
+    conDesenlace(r, async () => {
+      await writeFile(r.desenlace, 'ruido', 'utf8');
+      const d = await decidir(r);
+      assert.equal(d.codigo, 2);
+      assert.match(d.stderr, /Final de la salida \(truncada: \d+ bytes en total\)/);
+      assert.ok(Buffer.byteLength(d.stderr, 'utf8') < 4096 + 2048, `stderr de ${String(Buffer.byteLength(d.stderr))} bytes`);
+      assert.ok(!d.stderr.includes('\u001b'), 'sin secuencias ANSI');
+      assert.ok(!d.stderr.includes('�'), 'sin caracteres partidos');
+      assert.ok(!d.stderr.includes('secreto'), 'sin credenciales');
+      assert.match(d.stderr, /fallo final: https:\/\/\*\*\*@git\.example\.com/);
+      assert.match(d.stderr, /linea 4999 con ñ y € y emoji 🚀/);
+    })
+  );
+});
+
+test('freno: el punto de entrada real, por stdin, sale con 2 en rojo y 0 en verde', async () => {
+  await conRepo(async (r) => {
+    const env: NodeJS.ProcessEnv = { ...process.env, VERIF_DESENLACE: r.desenlace };
+    delete env['FRENO_VERIFICACION'];
+    const entrada = JSON.stringify({ hook_event_name: 'Stop', stop_hook_active: false, cwd: r.raiz });
+    await writeFile(r.desenlace, 'ko', 'utf8');
+    const rojo = spawnSync(process.execPath, [ENTRADA_HOOK], { input: entrada, encoding: 'utf8', env });
+    assert.equal(rojo.status, 2, rojo.stderr);
+    assert.match(rojo.stderr, /salio con codigo 3/);
+    await writeFile(path.join(r.raiz, 'otro.txt'), 'y', 'utf8');
+    await writeFile(r.desenlace, 'ok', 'utf8');
+    const verde = spawnSync(process.execPath, [ENTRADA_HOOK], { input: entrada, encoding: 'utf8', env });
+    assert.equal(verde.status, 0, verde.stderr);
+    assert.equal(verde.stderr, '');
+    const basura = spawnSync(process.execPath, [ENTRADA_HOOK], { input: 'basura', encoding: 'utf8', env });
+    assert.equal(basura.status, 0);
+  });
+});
+
+test('freno: hooks.json declara el Stop en forma exec, con el tope que usa el codigo y sin nombrar el producto', () => {
+  const texto = readFileSync(path.join(RAIZ_PLUGIN, 'hooks', 'hooks.json'), 'utf8');
+  const j = JSON.parse(texto) as {
+    description: string;
+    hooks: { Stop: { hooks: { type: string; command: string; args: string[]; timeout: number }[] }[] };
+  };
+  const stop = j.hooks.Stop[0]?.hooks[0];
+  assert.ok(stop);
+  assert.equal(stop.type, 'command');
+  assert.equal(stop.command, 'node');
+  assert.deepEqual(stop.args, ['${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/stop-verificacion.js']);
+  assert.equal(stop.timeout, TECHO_HOOK_S);
+  assert.ok(existsSync(ENTRADA_HOOK), 'el punto de entrada existe compilado en dist/src');
+  assert.doesNotMatch(j.description, /taskcode|TASK-\d/i);
+});
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-071/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-071/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-071/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-071/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-071/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-071/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-071/tarea.md                                                       |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-verificacion.js                           |  83 ++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/ejecucion-acotada.js                                | 216 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sincronizacion.js                                   | 175 +++----------------------------------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     | 117 +++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                    | 176 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/stop-verificacion.js                             |  21 ++++++++
 13 files changed, 622 insertions(+), 169 deletions(-)
````
