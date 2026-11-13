# Peticion de revision — TASK-126 (ronda 1)

- Tarea: TASK-126 — Verificacion por tipo de rama: los tests pesados solo en la puerta de release
- Rama revisada: feature/task-126-verificacion-por-tipo-de-rama-los-tests
- Rama base: develop
- Commit revisado (HEAD): 0ea8524e8db888305f7c6f443257a51b7f9bf0ac
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-126 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-126/tarea.md
- tareas/03-en-revision/TASK-126/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/config-freno.test.ts

## Commits a revisar (git log develop..HEAD)

````
0ea8524 feat(TASK-126): tests pesados solo en release con comando_verificacion_pesada en finish, guardian y doctor
881d1c2 chore(TASK-126): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index b22505c..fb01e6a 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,6 +1,7 @@
 # Changelog
 
 ## Sin publicar
+- Cambio de comportamiento (TASK-126): claves `comando_verificacion_pesada` y `verificacion_pesada_en` (`[release]` por defecto; admite `hotfix`). Los pesados se corren ademas de la completa solo en el finish de esos tipos de rama, y el guardian de merges exige su verde para integrar a mano una release; feature y fix no los corren. `taskctl doctor` dice que puerta corre los pesados. Sin las claves, todo como antes.
 - TASK-115 (feature) — P-7: verificacion completa por lote de cierres en modo automatico (2026-11-13)
 - Cambio de comportamiento (TASK-115): clave `verificacion_por_lote` (de la config de la rama base). Con ella, `finish` de una feature o fix que iria a la completa integra sin ella y la deja pendiente de lote en `tarea.md`; `taskctl verificar-lote` corre la completa una vez sobre la rama de integracion, anota en verde todas las pendientes y en rojo dice que tareas entraron desde la ultima completa en verde. Sin la clave, todo como antes.
 - TASK-128 (feature) — Metricas de verificacion por puerta: tiempo y ejecuciones de freno, review y finish, y rondas solo por menores (2026-11-13)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index ec01d48..2303ec6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -240,6 +240,7 @@ La referencia detallada vive en `docs/`, un fichero por tema:
     - [Coste de implementación automático (hooks `Stop` y `SubagentStop`)](docs/configuracion.md#coste-de-implementación-automático-hooks-stop-y-subagentstop)
     - [Puerta de verificación en `finish`](docs/configuracion.md#puerta-de-verificación-en-finish)
     - [Verificación completa por lote: `verificacion_por_lote`](docs/configuracion.md#verificación-completa-por-lote-verificacion_por_lote)
+    - [Tests pesados solo en release: `comando_verificacion_pesada`](docs/configuracion.md#tests-pesados-solo-en-release-comando_verificacion_pesada)
     - [Tests held-out (`aceptacion/`)](docs/configuracion.md#tests-held-out-aceptacion)
     - [Cobertura de las líneas cambiadas](docs/configuracion.md#cobertura-de-las-líneas-cambiadas)
     - [Guardián de merges (hook `PreToolUse`)](docs/configuracion.md#guardián-de-merges-hook-pretooluse)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
index 715afb4..26f1ba4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -330,6 +330,33 @@ verificacion_por_lote: true      # en la config de la rama de integración
 - Cada lote deja una línea en el registro de puertas (puerta `finish`, modo
   `lote`).
 
+#### Tests pesados solo en release: `comando_verificacion_pesada`
+
+Los tests lentos (rendimiento, escala, los `#[ignore]` de Rust) no hace falta
+correrlos en cada feature: basta con exigirlos antes de llegar a la principal.
+
+```yaml
+comando_verificacion: "cargo test"                      # feature, fix y todo lo demas
+comando_verificacion_pesada: "cargo test -- --ignored"  # ademas, solo en release
+verificacion_pesada_en: [release, hotfix]               # opcional; por defecto [release]
+```
+
+- `comando_verificacion_pesada` exige `comando_verificacion` y usa
+  `timeout_verificacion`. `verificacion_pesada_en` admite `release` y `hotfix`
+  (otro valor aborta; sin el comando, tambien).
+- **`finish`** de una rama de esos tipos corre los pesados **despues** de la
+  completa en verde, guarda su resultado en su propio memo
+  (`.git/freno-verificacion-pesada.json`) y anota la puerta `finish` con modo
+  `pesada`; en rojo no integra. Feature y fix no los corren nunca.
+- **Guardián de merges**: un merge a mano de una release (o de un hotfix
+  listado) exige, además del verde de la completa, el de los pesados del mismo
+  commit; feature y fix no lo piden.
+- `taskctl doctor` dice en `puertas-verificacion` qué puerta corre los pesados.
+- Cómo separarlos: en Rust, marca los lentos con `#[ignore]` y quedan fuera de
+  `cargo test`; en Node, en un directorio o glob aparte; en Java, una
+  categoría o tag de JUnit excluida por defecto; en .NET, un `Trait` que el
+  filtro normal excluye.
+
 #### Tests held-out (`aceptacion/`)
 
 Tests de aceptación que escribe la **persona** a partir de los criterios y que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
index 5c61680..ed6fdee 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
@@ -85,6 +85,13 @@ la tarea y `cierre` la clave `cierre_por_defecto` de la configuracion
 Un nombre de tag que ya existe o no vale para Git aborta antes de mergear sin
 tocar nada: muestra el error y pregunta otro nombre.
 
+**Tests pesados solo en release.** Si el proyecto separa los pesados
+(rendimiento, escala) en `comando_verificacion_pesada` (p. ej. completa
+`cargo test` y pesados `cargo test -- --ignored`), `finish` los corre ademas
+de la completa solo en los tipos de `verificacion_pesada_en` (release por
+defecto; hotfix si se declara); feature y fix no. En rojo no integra: arregla
+la causa o, si la persona lo decide, `--sin-verificacion`.
+
 ## GitLab propio (autoalojado)
 
 `--merge-request` reconoce `github.com` y los hosts que contienen «gitlab». Si
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index d11565c..50b8bc4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -566,7 +566,12 @@ export function comprobarPuertasVerificacion(cfg: TaskcodeConfig | null): Compro
   const freno = `freno ${comandoFreno}, ${presupuesto === null ? 'sin presupuesto' : `presupuesto ${String(presupuesto)} s`}`;
   const review = `review ${selectiva ?? 'no verifica'}`;
   const finish = `finish ${completa}${selectiva !== null && comandoParcial(cfg) !== null ? ` (o ${selectiva} con codigo parcial)` : ''}`;
-  return [ok('puertas-verificacion', `${freno}; ${review}; ${finish}`)];
+  // TASK-126: que puerta corre los tests pesados.
+  const pesados =
+    cfg.comando_verificacion_pesada === null
+      ? 'sin pesados'
+      : `pesados "${una(cfg.comando_verificacion_pesada)}" solo en ${cfg.verificacion_pesada_en.join(' y ')}`;
+  return [ok('puertas-verificacion', `${freno}; ${review}; ${finish}; ${pesados}`)];
 }
 
 // ---------------------------------------------------------------------
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 4f8ddb0..808dc27 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -132,6 +132,57 @@ function anotarFinish(
   });
 }
 
+export interface PuertaPesadaOpts {
+  id: string;
+  /** Tipo de la tarea (de su rama de Git-Flow). */
+  tipo: string;
+  cwd: string;
+  timeoutMs?: number;
+  env?: NodeJS.ProcessEnv;
+  onAviso?: (aviso: string) => void;
+}
+
+/**
+ * TASK-126: los tests pesados. Solo si la tarea es de un tipo de
+ * `verificacion_pesada_en` y el proyecto declara `comando_verificacion_pesada`;
+ * quien llama la invoca tras la completa en verde (feature y fix nunca llegan
+ * aqui con la lista por defecto). Guarda su memo (arbol limpio, para el
+ * guardian), anota la puerta `finish` modo `pesada` y en rojo lanza
+ * FinishCommandError sin haber tocado nada. Devuelve si corrio.
+ */
+export function puertaPesada(o: PuertaPesadaOpts): boolean {
+  const config = resolverConfig(o.cwd);
+  const comando = config.comando_verificacion_pesada;
+  if (comando === null || !(config.verificacion_pesada_en as readonly string[]).includes(o.tipo)) return false;
+  const timeoutS = config.timeout_verificacion;
+  const inicio = Date.now();
+  const r = ejecutarVerificacion(o.cwd, comando, timeoutS, {
+    ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
+    ...(o.env === undefined ? {} : { env: o.env }),
+  });
+  anotarFinish(o.cwd, o.id, 'pesada', inicio, r.estado);
+  const limpio = isWorkspaceClean(o.cwd);
+  const huella = limpio ? huellaDelArbol(o.cwd, comando, timeoutS) : null;
+  if (huella !== null) guardarMemo(o.cwd, huella, r, 'pesada');
+  if (r.estado !== 'verde') {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: no se mergea con los tests pesados en rojo (comando_verificacion_pesada, que exigen las ` +
+        `ramas ${config.verificacion_pesada_en.join(' y ')}). La completa salio en verde; no se ha tocado nada.\n` +
+        `${formatearVerificacionRoja(r)}\n` +
+        `Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y lo deja ` +
+        'anotado en la tarea.'
+    );
+  }
+  if (!limpio) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: los tests pesados salieron en verde, pero han dejado cambios en el arbol de trabajo ` +
+        `("${comando}" escribe ficheros versionados o no ignorados: mira git status). No se ha mergeado nada.`
+    );
+  }
+  o.onAviso?.(`${o.id}: tests pesados en verde (comando_verificacion_pesada, rama ${o.tipo}).`);
+  return true;
+}
+
 /**
  * TASK-115: `verificacion_por_lote` de la config de la RAMA BASE (la rama de
  * la tarea no puede activarsela). Una config de la base invalida no exime de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 4c0edc6..be16d15 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -95,7 +95,7 @@ import {
   recuperarApartado,
   type Apartado,
 } from '../fs/pendientes.js';
-import { extraerSinVerificacion, puertaReintento, puertaVerificacion, type ResultadoReintento } from './finish-verificacion.js';
+import { extraerSinVerificacion, puertaPesada, puertaReintento, puertaVerificacion, type ResultadoReintento } from './finish-verificacion.js';
 import { puertaHeldout } from './finish-heldout.js';
 import { puertaCobertura } from './finish-cobertura.js';
 import { runBoardCommand, boardFilePath } from './board.js';
@@ -566,6 +566,18 @@ async function runFinish(
       // TASK-110: solo el comando de verificacion recibe el contador (TASKCTL_PROGRESO).
       entornoVerificacion: () => entornoConContador(process.env, progreso.contador()),
     });
+    // TASK-126: los tests pesados, solo tras la completa en verde y solo en los
+    // tipos de verificacion_pesada_en (release por defecto).
+    if (r.resultado.tipo === 'verde') {
+      puertaPesada({
+        id,
+        tipo,
+        cwd: deps.repoCwd,
+        env: entornoConContador(process.env, progreso.contador()),
+        ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
+        ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
+      });
+    }
     // TASK-074: con el informe que la verificacion acaba de regenerar, y antes
     // de que el comando de held-out pueda reescribirlo.
     progreso.paso('cobertura');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index cd4ac0b..a59af4f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -32,6 +32,8 @@
  * | comando_verificacion_freno   | null (el freno usa la de siempre) | hooks/freno-stop.ts, commands/doctor.ts (TASK-125) |
  * | presupuesto_freno_s          | null (180 con comando_verificacion_freno) | hooks/freno-stop.ts (TASK-125) |
  * | verificacion_por_lote        | false             | commands/finish-verificacion.ts (de la base), verificar-lote.ts (TASK-115) |
+ * | comando_verificacion_pesada  | null (sin pesados) | finish-verificacion.ts, hooks/guardia-merge.ts, doctor.ts (TASK-126) |
+ * | verificacion_pesada_en       | [release]         | finish-verificacion.ts, hooks/guardia-merge.ts (TASK-126) |
  * | rutas_verificacion_parcial   | [] (sin nivel 2)  | core/verificacion-proporcional.ts (TASK-096); la decision la aplican fs/decision-documentacion.ts, finish-verificacion.ts, freno-stop.ts, review.ts y guardia-merge.ts (TASK-105..108); doctor.ts avisa (TASK-109) |
  *
  * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
@@ -286,8 +288,21 @@ export interface TaskcodeConfig {
    * la config de la RAMA BASE. Exige `comando_verificacion`.
    */
   verificacion_por_lote: boolean;
+  /**
+   * TASK-126: los tests pesados (rendimiento, escala, `--ignored`). Se
+   * ejecutan, ademas de `comando_verificacion`, solo en el finish y el
+   * guardian de merges de los tipos de `verificacion_pesada_en`. Usa
+   * `timeout_verificacion`. Exige `comando_verificacion`.
+   */
+  comando_verificacion_pesada: string | null;
+  /** TASK-126: tipos de rama que exigen los pesados (`release`, `hotfix`); `[release]` por defecto. */
+  verificacion_pesada_en: readonly TipoRamaPesada[];
 }
 
+/** TASK-126: los tipos de rama de Git-Flow que pueden exigir la verificacion pesada. */
+export const TIPOS_RAMA_PESADA = ['release', 'hotfix'] as const;
+export type TipoRamaPesada = (typeof TIPOS_RAMA_PESADA)[number];
+
 /**
  * TASK-125: `timeout` del hook Stop en hooks/hooks.json, en segundos. El
  * presupuesto del freno no puede pasarlo (el hook se cancelaria antes).
@@ -355,6 +370,8 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   comando_verificacion_freno: null,
   presupuesto_freno_s: null,
   verificacion_por_lote: false,
+  comando_verificacion_pesada: null,
+  verificacion_pesada_en: Object.freeze(['release']) as readonly TipoRamaPesada[],
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -387,6 +404,8 @@ export const CLAVES_CONFIG = [
   'comando_verificacion_freno',
   'presupuesto_freno_s',
   'verificacion_por_lote',
+  'comando_verificacion_pesada',
+  'verificacion_pesada_en',
 ] as const;
 
 /**
@@ -699,6 +718,17 @@ export function parsearConfigConAvisos(
       case 'presupuesto_freno_s':
         config.presupuesto_freno_s = validarPresupuestoFreno(donde, par.valor);
         break;
+      case 'comando_verificacion_pesada':
+        config.comando_verificacion_pesada = validarComando(
+          donde,
+          par.clave,
+          par.valor,
+          'comando_verificacion_pesada: "cargo test -- --ignored"'
+        );
+        break;
+      case 'verificacion_pesada_en':
+        config.verificacion_pesada_en = validarVerificacionPesadaEn(donde, par.valor);
+        break;
       case 'verificacion_por_lote':
         if (typeof par.valor !== 'boolean') {
           throw new ConfigError(
@@ -851,6 +881,21 @@ function validarVerificacionCompleta(ruta: string, vistas: ReadonlySet<string>):
         'completa (por ejemplo comando_verificacion: "npm test"), o borra la selectiva.'
     );
   }
+  // TASK-126: los pesados van ademas de la completa, nunca en su lugar.
+  if (vistas.has('comando_verificacion_pesada') && !vistas.has('comando_verificacion')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "comando_verificacion_pesada" necesita tambien "comando_verificacion".\n` +
+        '        Los pesados se corren ademas de la completa en las ramas release (y hotfix si se declara). ' +
+        'Declara la completa (por ejemplo comando_verificacion: "cargo test"), o borra la de los pesados.'
+    );
+  }
+  if (vistas.has('verificacion_pesada_en') && !vistas.has('comando_verificacion_pesada')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "verificacion_pesada_en" sin "comando_verificacion_pesada" no hace nada.\n` +
+        '        Borrala, o declara el comando de los tests pesados (por ejemplo ' +
+        'comando_verificacion_pesada: "cargo test -- --ignored").'
+    );
+  }
   // TASK-115: sin completa no hay nada que dejar pendiente de lote.
   if (vistas.has('verificacion_por_lote') && !vistas.has('comando_verificacion')) {
     throw new ConfigError(
@@ -1068,6 +1113,7 @@ function validarComando(
     | 'comando_verificacion'
     | 'comando_verificacion_selectiva'
     | 'comando_verificacion_freno'
+    | 'comando_verificacion_pesada'
     | 'comando_heldout'
     | 'comando_verificacion_documentacion',
   valor: unknown,
@@ -1116,6 +1162,29 @@ export const FASES_SINCRONIZACION = [
 ] as const;
 export type FaseSincronizacion = (typeof FASES_SINCRONIZACION)[number];
 
+/** TASK-126: lista no vacia de tipos de rama (`release`, `hotfix`); otro valor aborta. */
+function validarVerificacionPesadaEn(donde: string, valor: unknown): readonly TipoRamaPesada[] {
+  if (!Array.isArray(valor) || valor.length === 0) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "verificacion_pesada_en" debe ser una lista no vacia entre corchetes, ` +
+        `y es ${describirValor(valor)}.\n` +
+        '        Ejemplo: verificacion_pesada_en: [release, hotfix]. Sin la clave, solo release.'
+    );
+  }
+  const tipos: TipoRamaPesada[] = [];
+  for (const elemento of valor) {
+    const tipo = typeof elemento === 'string' ? elemento.trim() : '';
+    if (!(TIPOS_RAMA_PESADA as readonly string[]).includes(tipo)) {
+      throw new ConfigError(
+        `[ERROR] ${donde}: "verificacion_pesada_en" contiene "${String(elemento)}", que no es un tipo de rama ` +
+          `que pueda exigir los pesados. Validos: ${TIPOS_RAMA_PESADA.join(', ')} (feature y fix nunca los corren).`
+      );
+    }
+    if (!tipos.includes(tipo as TipoRamaPesada)) tipos.push(tipo as TipoRamaPesada);
+  }
+  return tipos;
+}
+
 function validarFasesSincronizacion(donde: string, valor: unknown): readonly FaseSincronizacion[] {
   if (!Array.isArray(valor) || valor.length === 0) {
     throw new ConfigError(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index 78f6dcb..eb3ac77 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -38,13 +38,15 @@ const BYTES_COLA_LEIDOS = 16 * 1024;
 // TASK-100: la de documentacion, con su propio memo: su verde nunca abre la puerta de la completa.
 // TASK-125: la del comando rapido del freno Stop, con su propio memo: su verde
 // no abre ninguna puerta (guardian, finish) ni pisa los demas memos.
-export type TipoVerificacion = 'completa' | 'selectiva' | 'documentacion' | 'freno';
+// TASK-126: la de los tests pesados de release, con su propio memo (no vale por la completa ni al reves).
+export type TipoVerificacion = 'completa' | 'selectiva' | 'documentacion' | 'freno' | 'pesada';
 
 const FICHEROS_MEMO: Readonly<Record<TipoVerificacion, string>> = Object.freeze({
   completa: 'freno-verificacion.json',
   selectiva: 'freno-verificacion-selectiva.json',
   documentacion: 'freno-verificacion-documentacion.json',
   freno: 'freno-verificacion-rapida.json',
+  pesada: 'freno-verificacion-pesada.json',
 });
 const VERSION_MEMO = 1;
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
index 9aaef5c..afe6208 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts
@@ -249,7 +249,7 @@ function motivoDeBloqueo(integ: Integracion, config: TaskcodeConfig, contexto: C
   for (const t of timeouts) {
     const huella = huellaDeCommit(raiz, sha.out, comando, t);
     const r = huella === null ? null : leerMemo(raiz, huella);
-    if (r?.estado === 'verde') return null;
+    if (r?.estado === 'verde') return motivoPesada(integ, sha.out, config);
     if (r !== null) rojo = true;
   }
 
@@ -266,6 +266,30 @@ function motivoDeBloqueo(integ: Integracion, config: TaskcodeConfig, contexto: C
   );
 }
 
+/**
+ * TASK-126: con la completa en verde, una release (o un hotfix, si
+ * `verificacion_pesada_en` lo lista) exige ademas el verde de los tests
+ * pesados del mismo commit (memo `pesada`, que deja `finish`). null si pasa.
+ * Feature y fix nunca los piden.
+ */
+function motivoPesada(integ: Integracion, sha: string, config: TaskcodeConfig): string | null {
+  const comando = config.comando_verificacion_pesada;
+  if (comando === null) return null;
+  const tipo = integ.release ? 'release' : /^(?:refs\/heads\/)?hotfix\//.test(integ.fuente) ? 'hotfix' : null;
+  if (tipo === null || !(config.verificacion_pesada_en as readonly string[]).includes(tipo)) return null;
+  const huella = huellaDeCommit(integ.raiz, sha, comando, config.timeout_verificacion);
+  const r = huella === null ? null : leerMemo(integ.raiz, huella, 'pesada');
+  if (r?.estado === 'verde') return null;
+  return mensaje(
+    integ.fuente,
+    sha,
+    integ.destino,
+    comando,
+    `una rama ${tipo} exige tambien los tests pesados (comando_verificacion_pesada) y ` +
+      (r === null ? 'no consta que hayan salido en verde para ese commit' : 'su ultima ejecucion NO salio en verde')
+  );
+}
+
 /**
  * TASK-108: lo que se anade al bloqueo cuando el destino declara
  * `rutas_verificacion_parcial` y entra codigo. No manda a «correr la completa y
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-126/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-126/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-126/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-126/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-126/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-126/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-126/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-126/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-126/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                     |  6 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        | 38 ++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     | 14 +++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 44 ++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js                                 | 22 +++++++++++++++++++++-
 15 files changed, 124 insertions(+), 4 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/config-freno.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts | 204 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/config-freno.test.ts            |   6 ++--
 2 files changed, 207 insertions(+), 3 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 201.1 s
- Commit verificado: 0ea8524e8db888305f7c6f443257a51b7f9bf0ac
- Huella: 5c70f2ed5b506a93a4b1d97533f43b8da9cada22
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 150457 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6381ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.5748ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9868ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (8.0901ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (11.0688ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6894ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.9236ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.1159ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.8471ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.4947ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.2936ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.4792ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.3189ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (1.0699ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (45.5545ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.4817ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (0.9506ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.4766ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3194ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.1787ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.1589ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.182ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2152ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.21ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.1947ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2116ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.2043ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.1794ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1651ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1793ms)
✔ resolverAsignado: recorta los tres escalones (1.6198ms)
ℹ tests 957
ℹ suites 0
ℹ pass 957
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 181372.0207
[verificar-impacto] node --test termino con 0 en 181.5 s.
````
