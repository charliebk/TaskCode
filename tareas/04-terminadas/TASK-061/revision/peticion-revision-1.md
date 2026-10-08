# Peticion de revision — TASK-061 (ronda 1)

- Tarea: TASK-061 — Merge request en cualquier GitLab, tambien autoalojado
- Rama revisada: feature/task-061-merge-request-en-gitlab-autoalojado-tamb
- Rama base: develop
- Commit revisado (HEAD): c07cd91199ebc87aa668176fc5fc913ea5a905a7
- Fecha: 2026-10-08
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-061 (criterios de aceptacion y plan)

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
c07cd91 update(feature): develop -> feature/task-061-merge-request-en-gitlab-autoalojado-tamb
4b68633 chore(TASK-061): coste implementacion +18900341 tokens (1 agente)
08219db feat(TASK-061): merge request en cualquier GitLab (dominio propio o bajo una ruta)
9aa4323 chore(TASK-061): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 2e24156..b04b963 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -2,6 +2,37 @@
 
 ## Sin publicar
 
+Merge request en cualquier GitLab, tambien autoalojado (TASK-061).
+
+- Dos claves nuevas en `.taskcode/config.yml`, que se leen desde la 0.7.0
+  (una version anterior las trata como desconocidas):
+  `plataforma_remota` (`github` | `gitlab`) y `url_base_remoto` (opcional,
+  solo con `gitlab`: la URL https de la instancia, con su ruta si cuelga de
+  una). Se validan juntas: la URL sin plataforma, con `github`, con usuario o
+  contrasena (`@`) o sin https aborta, igual que una base que no sea prefijo
+  exacto de la URL de `origin` si es https (host, puerto y ruta); con ssh o scp
+  basta el mismo host y la ruta de la instancia se quita si esta (GitLab sirve
+  ssh sin ella). Con
+  solo `plataforma_remota: gitlab`, la base es `https://<host de origin>`.
+- `taskctl finish --merge-request` con la plataforma declarada ya no adivina
+  por el host: fija `GITLAB_HOST=<base>` en cada llamada a `glab` (sin heredar
+  `GITLAB_HOST`, `GL_HOST`, `GITLAB_URI` ni `GITLAB_API_HOST` del entorno),
+  deduce el proyecto (`grupo/subgrupo/repo`) quitando la base a la URL de
+  origin y lo pasa con `-R`. Comprueba la sesion con `glab api user` (acepta
+  `glab auth login --hostname <host/ruta>` o `GITLAB_TOKEN`; `auth status` no
+  vale: ignora el token). Sin sesion, sin CLI o con la instancia inalcanzable
+  aborta antes de subir nada. El token nunca se imprime ni se escribe.
+  Sin declarar nada rige la deteccion por host de la 0.6.0, sin cambios.
+- **Cambio de comportamiento**: una clave desconocida en `.taskcode/config.yml`
+  ya no aborta, avisa por stderr (`[AVISO] ... clave desconocida "x"; se
+  ignora`, con la clave parecida si la hay) y se ignora. Un valor invalido en
+  una clave conocida sigue abortando. Asi, una clave que anade una version
+  nueva no deja sin `taskctl` a quien tenga una anterior desde esta version en
+  adelante; las versiones anteriores a esta siguen abortando ante las claves
+  nuevas.
+- El segundo `finish` lee la config del arbol en el que se ejecuta: la config
+  tiene que estar commiteada en la rama de la tarea y en la rama base.
+
 ## 0.6.0 — 2026-10-06
 
 Coste en tokens por fase y opciones de cierre en `finish`. Actualizar con
diff --git a/CLAUDE.md b/CLAUDE.md
index 141b9f5..61ad780 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -39,7 +39,7 @@ procesan).
 ```bash
 cd taskcode-marketplace/plugins/taskcode-plugin
 npm install
-npm test             # compila y corre la suite completa (~1090 tests, ~8 min) con cobertura
+npm test             # compila y corre la suite completa (~1290 tests, ~10 min) con cobertura
 npm run test:rapido  # core y cli sin procesos (~360 tests, ~10 s): para iterar, no para cerrar
 ```
 
@@ -68,7 +68,15 @@ que lo comprueban.
   escribe un fichero de estado; es el único doble de la suite. En Windows es un
   `.exe` (enlace a `node.exe` + `--require` en `NODE_OPTIONS`) porque
   `spawnSync` sin shell no ejecuta un `.cmd`. Una máquina con `gh`/`glab`
-  reales instalados no los usa: el doble va delante en el PATH.
+  reales instalados no los usa: el doble va delante en el PATH. Desde
+  TASK-061 también registra el `GITLAB_HOST` y el `-R` de cada llamada y
+  responde a `api user`; lo que el `glab mr create` real hace y el doble no
+  (dejar un fichero de recuperación en el directorio de config de glab) es
+  la razón de que ningún test lo toque.
+- Una clave desconocida en `.taskcode/config.yml` **avisa y se ignora** (antes
+  abortaba); solo un valor inválido de una clave conocida aborta. Las claves
+  `plataforma_remota` y `url_base_remoto` declaran un GitLab propio para
+  `finish --merge-request` (ver el README del plugin).
 - El glob de `npm test` va entrecomillado a propósito: lo expande Node, no el
   shell. Sin comillas, la suite entera falla en `cmd.exe`.
 - En Windows nativo **fallan 3 tests y no son regresiones**: uno por el truco
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 1568085..875719a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -585,12 +585,14 @@ Git-Flow del tipo y tarea a `terminada`.
 - `--merge-request` (solo feature y fix) **no mergea**: sube la rama (siempre,
   aunque no pases `--push`: sin ella no hay merge request, y la salida lo dice),
   abre un pull request (`origin` en `github.com`, con `gh`) o un merge request
-  (host que contiene «gitlab», con `glab`, también autoalojado) contra la rama
+  (host que contiene «gitlab», con `glab`) contra la rama
   base, anota su URL en una sección `## Merge request` de `tarea.md`, la
   commitea en la rama de la tarea y la deja en `en-revision`. Un host de origin
-  desconocido **aborta** nombrando qué configurar: no se supone GitLab. Antes
+  desconocido **aborta** nombrando qué configurar: no se supone GitLab (un
+  GitLab propio se declara en el config, ver «GitLab propio» abajo). Antes
   de subir nada se comprueba que hay `origin`, que el CLI está instalado y que
-  tiene sesión (`gh auth status` / `glab auth status`); cada fallo dice qué
+  tiene sesión (`gh auth status` / `glab auth status`; con la plataforma
+  declarada en el config, `glab api user`); cada fallo dice qué
   instalar o configurar. Antes de crear se busca un PR/MR abierto de esa rama
   para no duplicarlo. La URL de `origin` (puede llevar credenciales) no se
   imprime ni se escribe en ningún sitio.
@@ -607,5 +609,45 @@ Git-Flow del tipo y tarea a `terminada`.
   (por defecto `merge`). `taskctl finish` **no** la lee: la usa la skill
   `finish` en modo automático, que no pregunta, a través de `taskctl siguiente
   --json` (campo `cierre`). En manual y semiautomático la skill pregunta.
-  Como cualquier clave del config, un valor mal escrito aborta, y una versión
-  anterior del plugin rechazaría la clave: todo el equipo actualiza a la vez.
+  Un valor mal escrito aborta. Una clave que el plugin no conoce **avisa** por
+  stderr y se ignora (desde la 0.7.0; las versiones anteriores abortaban).
+
+#### GitLab propio (autoalojado, con dominio propio o bajo una ruta)
+
+Sin configuración, `--merge-request` reconoce `github.com` y los hosts que
+contienen «gitlab». Para cualquier otra instancia de GitLab se declara en
+`.taskcode/config.yml` (claves leídas desde la 0.7.0):
+
+```yaml
+plataforma_remota: gitlab
+url_base_remoto: https://git.empresa.com            # opcional
+# url_base_remoto: https://servidor.example/ruta/gitlab   # si la instancia cuelga de una ruta
+```
+
+- `plataforma_remota`: `github` o `gitlab`. Sola con `gitlab`, la base es
+  `https://<host de origin>` (vale para un GitLab con dominio propio en la raíz
+  del host).
+- `url_base_remoto` (solo con `gitlab`): la URL **https** de la instancia, con su
+  ruta si la tiene, sin usuario ni contraseña. Lo que queda de `origin` tras la
+  base es el proyecto (`grupo/subgrupo/repo`), que se pasa a `glab` con `-R`.
+  Con **https**, la base tiene que ser **prefijo exacto** de la URL de `origin`
+  (host, puerto y ruta, sin barra final). Con **ssh o scp** solo se exige el
+  mismo host (el puerto no se compara): GitLab con ruta de instancia sirve ssh
+  sin ella (`git@servidor.example:grupo/repo.git`), así que si la ruta de
+  `origin` empieza por la de la base se quita
+  (`git@servidor.example:ruta/gitlab/grupo/repo.git` -> `grupo/repo`) y si no,
+  la ruta entera es el proyecto. Si no encaja, o si hay `@` (credenciales), no
+  es https o hay una URL sin plataforma, `taskctl` aborta antes de subir nada
+  con un mensaje que nombra la clave.
+- Sesión: `glab auth login --hostname git.empresa.com` (con ruta:
+  `--hostname servidor.example/ruta/gitlab`), o la variable de entorno
+  `GITLAB_TOKEN`. La sesión se comprueba con `glab api user`. El token no se
+  imprime ni se escribe. `glab` solo habla https con la instancia; un
+  certificado propio se resuelve en el sistema o en la configuración de `glab`.
+- Con la plataforma declarada, cada llamada a `glab` lleva `GITLAB_HOST` fijado
+  a la base y se ignoran los `GITLAB_HOST`, `GL_HOST`, `GITLAB_URI` y
+  `GITLAB_API_HOST` del entorno, para que un host heredado no abra el merge
+  request en otro servidor.
+- El config se lee del árbol en el que se ejecuta `finish`: tiene que estar
+  **commiteado en la rama de la tarea y en la rama base** (el segundo `finish`
+  puede ejecutarse desde la base).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
index c0b6358..bd58149 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
@@ -83,3 +83,37 @@ la tarea y `cierre` la clave `cierre_por_defecto` de la configuracion
 
 Un nombre de tag que ya existe o no vale para Git aborta antes de mergear sin
 tocar nada: muestra el error y pregunta otro nombre.
+
+## GitLab propio (autoalojado)
+
+`--merge-request` reconoce `github.com` y los hosts que contienen «gitlab». Si
+el CLI aborta porque el host de `origin` es desconocido, o el proyecto usa un
+GitLab propio (dominio propio o bajo una ruta), la persona lo declara en
+`.taskcode/config.yml`; no lo escribas tu por tu cuenta:
+
+```yaml
+plataforma_remota: gitlab
+url_base_remoto: https://git.empresa.com
+```
+
+- `url_base_remoto` es opcional. Sin ella, la base es `https://<host de origin>`.
+  Si la instancia cuelga de una ruta, es obligatoria y lleva esa ruta
+  (`https://servidor.example/ruta/gitlab`). Tiene que ser https, sin usuario
+  ni contrasena. Con `origin` por https tiene que ser prefijo exacto de su URL;
+  con ssh o scp basta el mismo host (el ssh de GitLab suele ir sin la ruta de la
+  instancia: si la lleva se quita, y si no, la ruta entera es el proyecto). Lo
+  que queda es el proyecto (`grupo/subgrupo/repo`).
+- Sesion: `glab auth login --hostname git.empresa.com` (con ruta:
+  `--hostname servidor.example/ruta/gitlab`), o la variable de entorno
+  `GITLAB_TOKEN`. No pegues el token en ninguna respuesta, fichero ni commit.
+- **El config tiene que estar commiteado en la rama de la tarea y en la rama
+  base**: el primer `finish` lo lee de la rama de la tarea y el segundo,
+  que puede lanzarse desde la base, de la base. Si falta en una de las dos,
+  el CLI aborta o resuelve otra plataforma. Antes del primer `finish`, comprueba
+  (Read) que `.taskcode/config.yml` esta en la rama de la tarea y recuerdale
+  a la persona que tambien tiene que llegar a la base; si falta en la rama de la
+  tarea, que lo commitee antes de cerrar (no lo hagas tu entre los dos
+  `finish`: ese commit no estaria en el merge request).
+- Una clave desconocida del config solo avisa (`[AVISO]`) y se ignora; un valor
+  invalido de una clave conocida aborta. Muestra el mensaje tal cual: dice que
+  corregir.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
index 53b3b67..bc13826 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
@@ -29,8 +29,11 @@ import { comprobarCli } from '../fs/merge-request.js';
 import {
   detectarPlataforma,
   ocultarCredenciales,
+  resolverRemotoDeclarado,
+  type ResolucionDeclarada,
   type RemotoPlataforma,
 } from '../core/plataforma-remota.js';
+import { resolverConfig } from '../core/config.js';
 
 export class FinishCommandError extends Error {}
 
@@ -253,7 +256,13 @@ export function subirTag(tag: TagResultado, push: boolean, cwd: string): TagResu
  * Preflight de `--merge-request`, ANTES de subir nada: hay origin, su host es
  * de una plataforma conocida y el CLI de esa plataforma esta instalado y con
  * sesion. Cada fallo dice que instalar o configurar. Ningun mensaje lleva la
- * URL de origin, solo (como mucho) su host.
+ * URL de origin, solo (como mucho) su host y su ruta, ya sin credenciales.
+ *
+ * TASK-061: con `plataforma_remota` declarada en `.taskcode/config.yml` no se
+ * adivina por el host: manda la config (y la base, si la hay, tiene que ser
+ * prefijo exacto de origin). Sin declarar rige la deteccion por host de la
+ * 0.6.0, tal cual. La config se lee aqui, de la rama en la que se esta: por
+ * eso tiene que estar commiteada en la rama de la tarea y en la base.
  */
 export function preflightMergeRequest(id: string, cwd: string): RemotoPlataforma {
   if (!hasOrigin(cwd)) {
@@ -262,6 +271,20 @@ export function preflightMergeRequest(id: string, cwd: string): RemotoPlataforma
         'Configuralo (git remote add origin <url>) o cierra con merge normal; no se ha subido nada.'
     );
   }
+  const { plataforma_remota: plataforma, url_base_remoto: urlBase } = resolverConfig(cwd);
+  if (plataforma !== null) {
+    const d = resolverRemotoDeclarado(urlsDeOrigin(cwd), { plataforma, urlBase });
+    if (!d.ok) {
+      throw new FinishCommandError(
+        `[ERROR] ${id}: --merge-request: ${motivoDeclarado(d, plataforma, urlBase)} No se ha subido nada.`
+      );
+    }
+    const cli = comprobarCli(d.remoto, cwd);
+    if (!cli.ok) {
+      throw new FinishCommandError(`[ERROR] ${id}: --merge-request: ${cli.mensaje} No se ha subido nada.`);
+    }
+    return d.remoto;
+  }
   let hostDesconocido: string | null = null;
   for (const url of urlsDeOrigin(cwd)) {
     const d = detectarPlataforma(url);
@@ -281,7 +304,38 @@ export function preflightMergeRequest(id: string, cwd: string): RemotoPlataforma
           'GitLab (glab), o cierra con merge normal; no se ha subido nada.'
       : `[ERROR] ${id}: --merge-request: el host de origin ("${hostDesconocido}") no es github.com ni un host ` +
           'de GitLab (su nombre debe contener "gitlab"), asi que no se sabe que CLI usar. No se supone ' +
-          'GitLab. Usa un origin de github.com (gh) o de un host de GitLab (glab), o cierra con merge ' +
-          'normal; no se ha subido nada.'
+          'GitLab. Si lo es, declaralo en .taskcode/config.yml con "plataforma_remota: gitlab" (y ' +
+          '"url_base_remoto" si cuelga de una ruta). Usa un origin de github.com (gh) o de un host de GitLab ' +
+          '(glab), o cierra con merge normal; no se ha subido nada.'
+  );
+}
+
+/** Por que no se pudo resolver el remoto declarado, en palabras de persona y sin credenciales. */
+function motivoDeclarado(
+  d: Extract<ResolucionDeclarada, { ok: false }>,
+  plataforma: 'github' | 'gitlab',
+  urlBase: string | null
+): string {
+  if (d.motivo === 'sin-host') {
+    return (
+      '"origin" no apunta a una URL de red (https o ssh), asi que no se puede resolver el remoto de ' +
+      `"plataforma_remota: ${plataforma}". Apunta origin a la instancia o cierra con merge normal.`
+    );
+  }
+  if (d.motivo === 'base-invalida') {
+    return 'la clave "url_base_remoto" de .taskcode/config.yml no es una URL base valida. Corrigela o borrala.';
+  }
+  const origen = d.origen ?? '(sin host)';
+  if (urlBase === null) {
+    return (
+      `de la URL de origin (${origen}) no se deduce un proyecto grupo/repo (${d.causa ?? 'sin causa'}). ` +
+      'Si la instancia cuelga de una ruta, declara "url_base_remoto" en .taskcode/config.yml.'
+    );
+  }
+  return (
+    `la clave "url_base_remoto" (${urlBase}) de .taskcode/config.yml no es prefijo de la URL de origin ` +
+    `(${origen}): ${d.causa ?? 'no encaja'}. Tiene que ser exactamente el comienzo de esa URL (https, host, ` +
+    'puerto y ruta de la instancia, sin barra final) y detras debe quedar el proyecto grupo/repo; ' +
+    'corrigela, o cierra con merge normal.'
   );
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 93f30dd..3366399 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -14,6 +14,8 @@
  * | excluir_de_revision          | dist, locks, tareas | commands/review.ts    |
  * | modo_flujo                   | manual            | core/flujo.ts, plan.ts, approve.ts |
  * | cierre_por_defecto           | merge             | siguiente.ts -> skill finish (modo automatico) |
+ * | plataforma_remota            | null (por host)   | commands/finish-opciones.ts (--merge-request) |
+ * | url_base_remoto              | null              | commands/finish-opciones.ts (--merge-request) |
  *
  * `excluir_de_revision` la anadio TASK-034: la peticion de revision
  * embebia el diff entero, y el JS compilado, los lockfiles y la propia
@@ -21,6 +23,15 @@
  * semantica de `git :(glob)` (los interpreta Git, no `path.matchesGlob`
  * como `patrones_archivo` de los revisores).
  *
+ * `plataforma_remota` y `url_base_remoto` las anadio TASK-061: declaran la
+ * plataforma del remoto (`github` | `gitlab`) y, solo con gitlab, la URL base
+ * de la instancia, para que `finish --merge-request` funcione con cualquier
+ * GitLab (dominio propio o bajo una ruta). Se validan JUNTAS aqui (la url sin
+ * plataforma, con github, con usuario o sin https aborta); que la base sea
+ * prefijo de la URL de origin necesita Git y lo comprueba quien la usa
+ * (core/plataforma-remota.ts). Sin ninguna de las dos rige la deteccion por
+ * host de la 0.6.0.
+ *
  * Las tres de sincronizacion las anadio TASK-033 (version 0.1.1): un
  * proyecto que genera ficheros a partir del estado de las tareas (un
  * plan, un tablero) los tenia desincronizados tras cada transicion, y
@@ -36,11 +47,15 @@
  *    es literalmente lo que el codigo hacia antes de C4, asi que el
  *    cambio es no-breaking y los tests que ya existian siguen valiendo
  *    de red de regresion sin tocar ninguno.
- * 2. FALLO CERRADO. Un valor invalido o una clave desconocida ABORTAN.
- *    Nunca caida al default en silencio: con default silencioso el
- *    repo dice 2, el plugin usa 1 y no se entera nadie. Misma doctrina
- *    que el flag 'wx' de plan.ts y que el parser de veredictos de
- *    finish.ts.
+ * 2. FALLO CERRADO en los VALORES. Un valor invalido ABORTA. Nunca caida
+ *    al default en silencio: con default silencioso el repo dice 2, el
+ *    plugin usa 1 y no se entera nadie. Misma doctrina que el flag 'wx'
+ *    de plan.ts y que el parser de veredictos de finish.ts. Una clave
+ *    DESCONOCIDA, en cambio, AVISA y se ignora (TASK-061): con el repo
+ *    publico, una clave que anade una version nueva no puede dejar sin
+ *    `taskctl` a quien tenga una anterior. El aviso se emite una vez por
+ *    proceso (resolverConfig se llama muchas veces por comando) y nombra
+ *    la clave parecida, que es lo que cubre la errata (`limite_wp`).
  * 3. UN SOLO PARSER. El bucle `clave: valor` es el de frontmatter.ts,
  *    extraido a parseBloqueClaveValor(). Aqui no hay ni una linea de
  *    parseo de YAML.
@@ -54,15 +69,16 @@
  *    tenerla: este proyecto ya se quemo con `codex-review`,
  *    documentado en la maquina de estados e inexistente.
  *
- * La estrictez con las claves desconocidas es segura porque la §7.3 de
- * la metodologia garantiza que todo el equipo corre la misma version
- * del plugin: no hay un escenario de "clave nueva leida por un plugin
- * viejo" que justifique tragarsela.
+ * Antes de TASK-061 las claves desconocidas abortaban, apoyandose en que la
+ * §7.3 de la metodologia garantiza la misma version del plugin en todo el
+ * equipo. Con el plugin distribuido a proyectos ajenos esa garantia no
+ * existe, y se pasa a avisar (decision de Carlos, 2026-10-08).
  */
 import { existsSync, readFileSync, statSync } from 'node:fs';
 import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
 import { distanciaEdicion, masParecida } from './sugerencia.js';
+import { normalizarBase, type Plataforma } from './plataforma-remota.js';
 
 export class ConfigError extends Error {
   constructor(message: string) {
@@ -117,8 +133,21 @@ export interface TaskcodeConfig {
    * traves de `taskctl siguiente --json`.
    */
   cierre_por_defecto: CierrePorDefecto;
+  /**
+   * TASK-061: plataforma del remoto declarada. null = sin declarar (rige la
+   * deteccion por host de la 0.6.0). Solo la lee `finish --merge-request`.
+   */
+  plataforma_remota: Plataforma | null;
+  /**
+   * TASK-061: URL base de la instancia GitLab, ya normalizada
+   * (`https://host[:puerto][/ruta]`). Solo con `plataforma_remota: gitlab`.
+   * null = la base es `https://<host de origin>`.
+   */
+  url_base_remoto: string | null;
 }
 
+export const PLATAFORMAS_REMOTAS: readonly Plataforma[] = ['github', 'gitlab'];
+
 export type ModoFlujo = 'manual' | 'semiautomatico' | 'automatico';
 export const MODOS_FLUJO: readonly ModoFlujo[] = ['manual', 'semiautomatico', 'automatico'];
 
@@ -146,9 +175,11 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   ]) as readonly string[],
   modo_flujo: 'manual',
   cierre_por_defecto: 'merge',
+  plataforma_remota: null,
+  url_base_remoto: null,
 });
 
-/** Las unicas claves admitidas. Cualquier otra aborta (regla 2). */
+/** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
 export const CLAVES_CONFIG = [
   'rama_base',
   'agente_revisor_por_defecto',
@@ -159,6 +190,8 @@ export const CLAVES_CONFIG = [
   'excluir_de_revision',
   'modo_flujo',
   'cierre_por_defecto',
+  'plataforma_remota',
+  'url_base_remoto',
 ] as const;
 
 /**
@@ -269,7 +302,8 @@ export function resolverConfig(cwd: string): TaskcodeConfig {
         '        Borrala o arregla sus permisos: taskctl no sigue sin saber que dice.'
     );
   }
-  const config = parsearConfig(contenido, ruta);
+  const { config, avisos } = parsearConfigConAvisos(contenido, ruta);
+  emitirAvisos(avisos);
   // Lo unico de las rutas de sincronizacion que necesita disco: que
   // ninguna sea una carpeta existente. Con una carpeta, el
   // `git add -A -- <ruta>` acotado se convierte en un barrido de todo
@@ -293,12 +327,41 @@ export function resolverConfig(cwd: string): TaskcodeConfig {
   return config;
 }
 
+/**
+ * Avisos ya emitidos en este proceso. resolverConfig corre varias veces por
+ * comando (git-commit, wip, flujo...) y el mismo aviso diez veces es ruido;
+ * se deduplica por texto, que ya incluye ruta y linea.
+ */
+const avisosEmitidos = new Set<string>();
+
+function emitirAvisos(avisos: readonly string[]): void {
+  for (const aviso of avisos) {
+    if (avisosEmitidos.has(aviso)) continue;
+    avisosEmitidos.add(aviso);
+    process.stderr.write(`${aviso}\n`);
+  }
+}
+
+/** Para los tests: olvida lo ya avisado y vuelve a emitirlo. */
+export function reiniciarAvisosDeConfig(): void {
+  avisosEmitidos.clear();
+}
+
 /**
  * Separada de resolverConfig para poder probar el parseo y la
  * validacion sin disco, y para que el mensaje de error siempre pueda
- * nombrar el fichero de donde salio el problema.
+ * nombrar el fichero de donde salio el problema. Los avisos (claves
+ * desconocidas) los descarta: quien los quiera usa parsearConfigConAvisos.
  */
 export function parsearConfig(contenido: string, ruta: string): TaskcodeConfig {
+  return parsearConfigConAvisos(contenido, ruta).config;
+}
+
+/** La configuracion y los avisos no fatales (una clave desconocida por aviso). */
+export function parsearConfigConAvisos(
+  contenido: string,
+  ruta: string
+): { config: TaskcodeConfig; avisos: string[] } {
   const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
     etiqueta: 'config',
     crearError: (mensaje) => new ConfigError(`[ERROR] ${ruta}: ${mensaje}`),
@@ -307,12 +370,15 @@ export function parsearConfig(contenido: string, ruta: string): TaskcodeConfig {
 
   const config: TaskcodeConfig = { ...CONFIG_DEFAULTS };
   const vistas = new Set<string>();
+  const avisos: string[] = [];
+  let dondeUrlBase = '';
 
   for (const par of pares) {
     const donde = `${ruta}:${par.numeroLinea}`;
 
     if (!(CLAVES_CONFIG as readonly string[]).includes(par.clave)) {
-      throw new ConfigError(mensajeClaveDesconocida(donde, par.clave));
+      avisos.push(mensajeClaveDesconocida(donde, par.clave));
+      continue;
     }
     // Una clave repetida se pisaria en silencio (el ultimo gana) y el
     // fichero diria una cosa mientras el plugin usa otra: mismo dano
@@ -353,11 +419,85 @@ export function parsearConfig(contenido: string, ruta: string): TaskcodeConfig {
       case 'cierre_por_defecto':
         config.cierre_por_defecto = validarCierrePorDefecto(donde, par.valor);
         break;
+      case 'plataforma_remota':
+        config.plataforma_remota = validarPlataformaRemota(donde, par.valor);
+        break;
+      case 'url_base_remoto':
+        config.url_base_remoto = validarUrlBaseRemoto(donde, par.valor);
+        dondeUrlBase = donde;
+        break;
     }
   }
 
   validarSincronizacionCompleta(ruta, vistas);
-  return config;
+  validarRemotoCompleto(dondeUrlBase, config);
+  return { config, avisos };
+}
+
+/**
+ * Las dos claves del remoto se validan JUNTAS: una URL sin plataforma, o con
+ * `github` (que no tiene instancias que apuntar), son configuraciones que
+ * parecen hacer algo y no lo hacen. Que la base sea prefijo de origin no se
+ * puede saber aqui (hace falta Git): lo comprueba quien resuelve el remoto.
+ */
+function validarRemotoCompleto(dondeUrlBase: string, config: TaskcodeConfig): void {
+  if (config.url_base_remoto === null) return;
+  if (config.plataforma_remota === null) {
+    throw new ConfigError(
+      `[ERROR] ${dondeUrlBase}: "url_base_remoto" necesita tambien "plataforma_remota: gitlab".\n` +
+        '        Una URL base sin plataforma no dice contra que CLI usarla. Anade ' +
+        '"plataforma_remota: gitlab" o borra la URL.'
+    );
+  }
+  if (config.plataforma_remota === 'github') {
+    throw new ConfigError(
+      `[ERROR] ${dondeUrlBase}: "url_base_remoto" solo vale con "plataforma_remota: gitlab".\n` +
+        '        Con github el CLI (gh) la ignoraria. Borra la URL, o cambia la plataforma a gitlab.'
+    );
+  }
+}
+
+/** `github` | `gitlab`, con sugerencia ante una errata (misma doctrina que modo_flujo). */
+function validarPlataformaRemota(donde: string, valor: unknown): Plataforma {
+  const plataforma = validarTextoNoVacio(donde, 'plataforma_remota', valor);
+  if ((PLATAFORMAS_REMOTAS as readonly string[]).includes(plataforma)) return plataforma as Plataforma;
+  const parecido = PLATAFORMAS_REMOTAS.map((p) => ({ p, d: distanciaEdicion(plataforma.toLowerCase(), p) }))
+    .sort((a, b) => a.d - b.d)[0];
+  const sugerencia =
+    parecido !== undefined && parecido.d <= 3 ? ` ¿Querias decir "${parecido.p}"?` : '';
+  throw new ConfigError(
+    `[ERROR] ${donde}: plataforma_remota "${plataforma}" no es valida.${sugerencia}\n` +
+      `        Valores validos: ${PLATAFORMAS_REMOTAS.join(', ')} (sin la clave, se decide por el host de origin).`
+  );
+}
+
+/**
+ * URL base de la instancia GitLab: https, sin usuario ni contrasena (nada de
+ * ello se repite en el mensaje: podria ser un token) y normalizada.
+ */
+function validarUrlBaseRemoto(donde: string, valor: unknown): string {
+  const texto = validarTextoNoVacio(donde, 'url_base_remoto', valor);
+  const r = normalizarBase(texto);
+  if (r.ok) return r.base;
+  const ejemplo = 'Ejemplo: url_base_remoto: https://git.empresa.com (o https://servidor.example/ruta/gitlab).';
+  switch (r.motivo) {
+    case 'credenciales':
+      throw new ConfigError(
+        `[ERROR] ${donde}: "url_base_remoto" lleva un "@", es decir usuario o contrasena en la URL.\n` +
+          '        No se admiten credenciales en la configuracion (se commitea): usa la sesion de ' +
+          '"glab auth login" o la variable de entorno GITLAB_TOKEN.'
+      );
+    case 'no-https':
+      throw new ConfigError(
+        `[ERROR] ${donde}: "url_base_remoto" debe empezar por https:// (y es ${describirValor(texto)}).\n` +
+          `        glab solo habla https con la instancia. ${ejemplo}`
+      );
+    case 'malformada':
+      throw new ConfigError(
+        `[ERROR] ${donde}: "url_base_remoto" no es una URL base valida (${describirValor(texto)}).\n` +
+          `        Lleva solo host, puerto y ruta, sin parametros ni espacios. ${ejemplo}`
+      );
+  }
 }
 
 /**
@@ -497,19 +637,28 @@ function motivoRutaInvalida(original: string): string | null {
 }
 
 /**
- * Enumera SIEMPRE las claves validas (criterio de la decision #9: el
- * mensaje dice que esta mal y cuales son las validas) y, si la escrita
- * se parece mucho a una de ellas, la propone. El caso motivador es
- * literal: `limite_wp`.
+ * Aviso (TASK-061; antes error) de clave desconocida. Enumera SIEMPRE las
+ * claves validas (criterio de la decision #9: el mensaje dice que esta mal y
+ * cuales son las validas) y, si la escrita se parece mucho a una de ellas, la
+ * propone. El caso motivador es literal: `limite_wp`.
  */
 function mensajeClaveDesconocida(donde: string, clave: string): string {
   const sugerida = masParecida(clave, CLAVES_CONFIG);
-  const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
+  const lineas = [`[AVISO] ${donde}: clave desconocida "${clave}"; se ignora.`];
   if (sugerida !== null) lineas.push(`        Quiza quisiste decir "${sugerida}".`);
-  lineas.push(`        Claves validas: ${CLAVES_CONFIG.join(', ')}.`);
+  lineas.push(
+    `        Claves validas: ${CLAVES_CONFIG.join(', ')}. Si es de una version mas nueva del plugin, ` +
+      'actualizalo para que se lea.'
+  );
   return lineas.join('\n');
 }
 
+/** ` (por defecto: "x")`, o ` (sin la clave, no se declara)` si el defecto es null. */
+function textoDefecto(clave: string): string {
+  const d = (CONFIG_DEFAULTS as unknown as Record<string, unknown>)[clave];
+  return typeof d === 'string' ? ` (por defecto: "${d}")` : ' (sin la clave, no se declara)';
+}
+
 /**
  * Texto no vacio. Se guarda RECORTADO: `rama_base: " develop "` es
  * develop, no " develop " — misma doctrina que personaDeTarea en
@@ -525,8 +674,7 @@ function validarTextoNoVacio(donde: string, clave: string, valor: unknown): stri
   if (valor === null) {
     throw new ConfigError(
       `[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
-        `        O le das un valor, o borras la linea (por defecto: ` +
-        `"${CONFIG_DEFAULTS[clave as 'rama_base' | 'agente_revisor_por_defecto']}").`
+        `        O le das un valor, o borras la linea${textoDefecto(clave)}.`
     );
   }
   if (typeof valor !== 'string') {
@@ -538,8 +686,7 @@ function validarTextoNoVacio(donde: string, clave: string, valor: unknown): stri
   if (recortado === '') {
     throw new ConfigError(
       `[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
-        `        O le das un valor, o borras la linea (por defecto: ` +
-        `"${CONFIG_DEFAULTS[clave as 'rama_base' | 'agente_revisor_por_defecto']}").`
+        `        O le das un valor, o borras la linea${textoDefecto(clave)}.`
     );
   }
   return recortado;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
index 3efd368..ecf5910 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
@@ -26,6 +26,14 @@ export interface RemotoPlataforma {
   plataforma: Plataforma;
   /** Solo el host, en minusculas y sin usuario ni puerto. */
   host: string;
+  /**
+   * TASK-061. Solo con `plataforma_remota: gitlab` declarada en config:
+   * `base` es la URL de la instancia (va en `GITLAB_HOST`, con su subruta si
+   * la tiene) y `proyecto` la ruta del proyecto RELATIVA a esa base
+   * (`grupo/subgrupo/repo`, va en `-R`). Sin declaracion no existe y rige la
+   * deteccion por host de la 0.6.0, sin `GITLAB_HOST` ni `-R`.
+   */
+  declarado?: { base: string; proyecto: string };
 }
 
 /**
@@ -66,6 +74,216 @@ export function detectarPlataforma(url: string): DeteccionPlataforma {
   return { ok: false, motivo: 'host-desconocido', host };
 }
 
+// ---------------------------------------------------------------------
+// TASK-061: instancia declarada en `.taskcode/config.yml`.
+//
+// Todo puro. Regla que atraviesa el bloque: NINGUNA funcion devuelve ni
+// imprime la URL de origin entera ni su usuario/contrasena; lo mas que sale
+// es `host/ruta` ya sin credenciales, y el proyecto relativo a la base.
+// ---------------------------------------------------------------------
+
+const HOST_VALIDO = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;
+const SEGMENTO_BASE = /^[A-Za-z0-9._~-]+$/;
+const SEGMENTO_PROYECTO = /^[A-Za-z0-9_.][A-Za-z0-9_.-]*$/;
+
+/** `host[:puerto]` (con o sin `usuario@` delante: manda el ULTIMO "@"). Puerto sin ceros a la izquierda. */
+function partirAutoridad(autoridad: string): { host: string; puerto: string | null } | null {
+  const m = /^([^:]+)(?::(\d*))?$/.exec(autoridad.slice(autoridad.lastIndexOf('@') + 1));
+  if (m === null) return null;
+  const host = (m[1] as string).toLowerCase();
+  if (!HOST_VALIDO.test(host)) return null;
+  const crudo = m[2] ?? '';
+  if (crudo === '') return { host, puerto: null };
+  const n = Number(crudo);
+  if (n < 1 || n > 65535) return null;
+  return { host, puerto: String(n) };
+}
+
+/** Segmentos no vacios de una ruta; null si trae `.` o `..`. */
+function segmentosDeRuta(ruta: string): string[] | null {
+  const segs = ruta.split('/').filter((s) => s !== '');
+  return segs.some((s) => s === '.' || s === '..') ? null : segs;
+}
+
+export interface BaseNormalizada {
+  /** `https://host[:puerto][/ruta]`: host en minusculas, sin puerto 443 ni barra final. */
+  base: string;
+  host: string;
+  puerto: string | null;
+  segmentos: string[];
+}
+
+export type ResultadoBase =
+  | ({ ok: true } & BaseNormalizada)
+  | { ok: false; motivo: 'credenciales' | 'no-https' | 'malformada' };
+
+/**
+ * Valida y normaliza una URL base de instancia GitLab. Rechaza lo que pueda
+ * llevar credenciales (cualquier `@`), lo que no sea https, y lo que no sea
+ * una URL limpia (sin consulta, fragmento, espacios ni segmentos raros).
+ * Normaliza esquema y host a minusculas, quita el puerto 443 y las barras
+ * finales o repetidas; la ruta conserva sus mayusculas.
+ */
+export function normalizarBase(texto: string): ResultadoBase {
+  const t = texto.trim();
+  if (t.includes('@')) return { ok: false, motivo: 'credenciales' };
+  const m = /^([A-Za-z][A-Za-z0-9+.-]*):\/\/([^/?#\s]*)([^?#\s]*)$/.exec(t);
+  if (m === null) return { ok: false, motivo: /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(t) ? 'malformada' : 'no-https' };
+  if ((m[1] as string).toLowerCase() !== 'https') return { ok: false, motivo: 'no-https' };
+  const aut = partirAutoridad(m[2] as string);
+  const segs = segmentosDeRuta(m[3] as string);
+  if (aut === null || segs === null || !segs.every((s) => SEGMENTO_BASE.test(s))) {
+    return { ok: false, motivo: 'malformada' };
+  }
+  const puerto = aut.puerto === '443' ? null : aut.puerto;
+  const base = `https://${aut.host}${puerto === null ? '' : `:${puerto}`}${segs.length === 0 ? '' : `/${segs.join('/')}`}`;
+  return { ok: true, base, host: aut.host, puerto, segmentos: segs };
+}
+
+export interface PartesOrigin {
+  /**
+   * `https` compara puerto con la base. `http` compara la ruta pero no el puerto. `ssh` (ssh://,
+   * git:// y scp) ni puerto ni ruta completa: su puerto no es el web y GitLab sirve ssh sin la
+   * ruta de la instancia (ver proyectoDeRemoto).
+   */
+  esquema: 'https' | 'http' | 'ssh';
+  host: string;
+  /** Solo con esquema https (443 = null). */
+  puerto: string | null;
+  /** Ruta sin `.git` final, sin barras y troceada. */
+  segmentos: string[];
+}
+
+/**
+ * Host y ruta de una URL de origin: https/http/ssh/git con usuario, contrasena
+ * y puerto, y la forma scp (`git@host:grupo/repo.git`). null si no es una URL
+ * de red. Las credenciales se descartan aqui y no salen de la funcion.
+ */
+export function partesDeOrigin(url: string): PartesOrigin | null {
+  const texto = url.trim();
+  const conEsquema = /^([A-Za-z][A-Za-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)/.exec(texto);
+  let aut: { host: string; puerto: string | null } | null;
+  let ruta: string;
+  let esquema: PartesOrigin['esquema'];
+  if (conEsquema !== null) {
+    aut = partirAutoridad(conEsquema[2] as string);
+    ruta = conEsquema[3] as string;
+    const e = (conEsquema[1] as string).toLowerCase();
+    esquema = e === 'https' ? 'https' : e === 'http' ? 'http' : 'ssh';
+  } else {
+    const scp = /^(?:[^@/\\:\s]+@)?([^@/\\:\s]+):(?!\/\/)(.*)$/s.exec(texto);
+    if (scp === null || (scp[1] as string).length === 1) return null;
+    aut = partirAutoridad(scp[1] as string);
+    ruta = scp[2] as string;
+    esquema = 'ssh';
+  }
+  if (aut === null) return null;
+  const segs = segmentosDeRuta(ruta);
+  if (segs === null) return null;
+  const ultimo = segs.length - 1;
+  if (ultimo >= 0) {
+    const sinGit = (segs[ultimo] as string).replace(/\.git$/i, '');
+    if (sinGit === '') segs.pop();
+    else segs[ultimo] = sinGit;
+  }
+  const puerto = esquema === 'https' && aut.puerto !== '443' ? aut.puerto : null;
+  return { esquema, host: aut.host, puerto, segmentos: segs };
+}
+
+export type ResultadoProyecto =
+  | { ok: true; proyecto: string }
+  | {
+      ok: false;
+      motivo: 'url-sin-red' | 'base-invalida' | 'host' | 'puerto' | 'ruta' | 'proyecto-corto' | 'proyecto-invalido';
+    };
+
+/**
+ * El proyecto (`grupo/subgrupo/repo`, sin `.git`) de una URL de origin
+ * relativo a la base de la instancia: la base tiene que ser PREFIJO EXACTO de
+ * host + ruta (esquema, mayusculas del host, puerto y barra final ya
+ * normalizados; los segmentos de la ruta se comparan tal cual).
+ *
+ * EXCEPCION ssh/scp: GitLab con `relative_url_root` sirve la web y la API bajo
+ * `/ruta/gitlab` pero el clonado ssh va SIN esa ruta (`git@host:grupo/repo.git`).
+ * Con ssh solo se exige el mismo host (el puerto no se compara); si la ruta de
+ * origin empieza por la de la base se quita (`git@host:ruta/gitlab/grupo/repo`
+ * -> `grupo/repo`) y si no, la ruta entera es el proyecto. Ambiguedad asumida:
+ * un grupo de primer nivel llamado igual que la ruta de la base (`ruta/gitlab/...`
+ * en un ssh sin ruta) se interpreta como ruta de la instancia y se quita.
+ *
+ * Lo que queda detras de la base tiene que ser un proyecto de verdad (>= 2 segmentos, con
+ * caracteres de ruta de GitLab y sin "-" inicial: va en argv de glab). Nunca
+ * devuelve ni imprime credenciales.
+ */
+export function proyectoDeRemoto(urlOrigen: string, urlBase: string): ResultadoProyecto {
+  const base = normalizarBase(urlBase);
+  if (!base.ok) return { ok: false, motivo: 'base-invalida' };
+  const o = partesDeOrigin(urlOrigen);
+  if (o === null) return { ok: false, motivo: 'url-sin-red' };
+  if (o.host !== base.host) return { ok: false, motivo: 'host' };
+  if (o.esquema === 'https' && o.puerto !== base.puerto) return { ok: false, motivo: 'puerto' };
+  const empiezaPorBase = base.segmentos.every((s, i) => o.segmentos[i] === s);
+  if (!empiezaPorBase && o.esquema !== 'ssh') return { ok: false, motivo: 'ruta' };
+  const resto = empiezaPorBase ? o.segmentos.slice(base.segmentos.length) : o.segmentos;
+  if (resto.length < 2) return { ok: false, motivo: 'proyecto-corto' };
+  if (!resto.every((s) => SEGMENTO_PROYECTO.test(s) && s !== '.' && s !== '..')) {
+    return { ok: false, motivo: 'proyecto-invalido' };
+  }
+  return { ok: true, proyecto: resto.join('/') };
+}
+
+export interface RemotoDeclarado {
+  plataforma: Plataforma;
+  /** `url_base_remoto` ya validada por config (null = solo `plataforma_remota`). */
+  urlBase: string | null;
+}
+
+export type ResolucionDeclarada =
+  | { ok: true; remoto: RemotoPlataforma }
+  | {
+      ok: false;
+      motivo: 'sin-host' | 'base-invalida' | 'no-encaja';
+      /** `host/ruta` de la primera URL de red de origin, sin credenciales; null si no hay ninguna. */
+      origen: string | null;
+      /** Por que no encaja (motivo de `proyectoDeRemoto`). */
+      causa: Extract<ResultadoProyecto, { ok: false }>['motivo'] | null;
+    };
+
+/**
+ * Remoto de una plataforma DECLARADA en config, sobre las URLs de origin
+ * (la efectiva y la escrita, que pueden diferir por `insteadOf`). Con github
+ * basta el host. Con gitlab, la base es la declarada o `https://<host de
+ * origin>` (con su puerto si origin es https con puerto); se toma la primera
+ * URL que encaja, y si ninguna encaja no se supone nada.
+ */
+export function resolverRemotoDeclarado(urls: readonly string[], declarado: RemotoDeclarado): ResolucionDeclarada {
+  const red = urls.map((u) => ({ u, p: partesDeOrigin(u) })).filter((x) => x.p !== null);
+  const primera = red[0]?.p ?? null;
+  const origen = primera === null ? null : `${primera.host}${primera.segmentos.length === 0 ? '' : `/${primera.segmentos.join('/')}`}`;
+  if (primera === null) return { ok: false, motivo: 'sin-host', origen: null, causa: null };
+  if (declarado.plataforma === 'github') {
+    return { ok: true, remoto: { plataforma: 'github', host: primera.host } };
+  }
+  const declaradaNormal = declarado.urlBase === null ? null : normalizarBase(declarado.urlBase);
+  if (declaradaNormal !== null && !declaradaNormal.ok) {
+    return { ok: false, motivo: 'base-invalida', origen, causa: null };
+  }
+  let causa: Extract<ResultadoProyecto, { ok: false }>['motivo'] | null = null;
+  for (const { u, p } of red) {
+    const parte = p as PartesOrigin;
+    const base =
+      declaradaNormal !== null && declaradaNormal.ok
+        ? declaradaNormal.base
+        : `https://${parte.host}${parte.puerto === null ? '' : `:${parte.puerto}`}`;
+    const r = proyectoDeRemoto(u, base);
+    if (r.ok) {
+      return { ok: true, remoto: { plataforma: 'gitlab', host: parte.host, declarado: { base, proyecto: r.proyecto } } };
+    }
+    causa ??= r.motivo;
+  }
+  return { ok: false, motivo: 'no-encaja', origen, causa };
+}
+
 /**
  * Sustituye `usuario:contrasena@` (o `token@`) de cualquier URL que aparezca
  * en un texto. Se aplica a TODO lo que viene de git, gh y glab antes de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
index d7c78d1..0f5a674 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
@@ -20,6 +20,14 @@
  * - stdin ignorado y `GH_PROMPT_DISABLED`: nada de preguntas interactivas.
  * - Todo lo que sale de estos programas se pasa por `ocultarCredenciales`
  *   antes de llegar a un mensaje: a veces repiten la URL del remoto.
+ * - TASK-061, GitLab declarado en config: `contextoGlab` es el UNICO sitio
+ *   que produce `-R <proyecto>` y `GITLAB_HOST=<base>`, y lo usan por igual
+ *   la comprobacion de sesion, el estado y la creacion: si cada una lo
+ *   compusiera por su cuenta, un proyecto mal deducido abriria un MR y
+ *   consultaria otro. `GITLAB_HOST` se fija en CADA llamada y el que traiga
+ *   el entorno (y sus alias) se descarta, porque un host heredado abriria el
+ *   MR en otro servidor; `GITLAB_TOKEN` si se hereda y nunca se imprime.
+ *   Sin declaracion no se anade nada: lo de la 0.6.0.
  */
 import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
 import {
@@ -42,14 +50,41 @@ export class MergeRequestError extends Error {
 const TIMEOUT_MS = 120_000;
 const MAX_BUFFER = 16 * 1024 * 1024;
 
-function lanzar(cli: string, args: readonly string[], cwd: string): SpawnSyncReturns<string> {
+/** Variables con las que glab elige instancia: ninguna se hereda cuando la base esta declarada. */
+const VARIABLES_HOST_GLAB: readonly string[] = ['GITLAB_HOST', 'GL_HOST', 'GITLAB_URI', 'GITLAB_API_HOST'];
+
+interface ContextoGlab {
+  /** `-R <proyecto>` (vacio sin declaracion). */
+  repo: readonly string[];
+  /** Valor fijado de `GITLAB_HOST` (undefined sin declaracion: no se toca el entorno). */
+  gitlabHost: string | undefined;
+}
+
+/** El unico productor de `-R` y `GITLAB_HOST` (ver cabecera). */
+function contextoGlab(remoto: RemotoPlataforma): ContextoGlab {
+  const d = remoto.declarado;
+  return d === undefined ? { repo: [], gitlabHost: undefined } : { repo: ['-R', d.proyecto], gitlabHost: d.base };
+}
+
+function entornoDe(gitlabHost: string | undefined): NodeJS.ProcessEnv {
+  const env: NodeJS.ProcessEnv = { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' };
+  if (gitlabHost === undefined) return env;
+  // Windows ignora las mayusculas en el entorno pero el objeto copiado no.
+  for (const k of Object.keys(env)) {
+    if (VARIABLES_HOST_GLAB.includes(k.toUpperCase())) delete env[k];
+  }
+  env['GITLAB_HOST'] = gitlabHost;
+  return env;
+}
+
+function lanzar(cli: string, args: readonly string[], cwd: string, gitlabHost?: string): SpawnSyncReturns<string> {
   return spawnSync(cli, args, {
     cwd,
     encoding: 'utf8',
     stdio: ['ignore', 'pipe', 'pipe'],
     timeout: TIMEOUT_MS,
     maxBuffer: MAX_BUFFER,
-    env: { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' },
+    env: entornoDe(gitlabHost),
   });
 }
 
@@ -59,10 +94,15 @@ function detalle(r: SpawnSyncReturns<string>): string {
   return t === '' ? '(sin salida)' : t.split(/\r?\n/).slice(0, 4).join(' | ');
 }
 
+/** Nombre de la instancia como lo entiende `glab auth login --hostname`: host y, si la hay, su ruta. */
+function hostnameGlab(r: RemotoPlataforma): string {
+  return r.declarado === undefined ? r.host : r.declarado.base.replace(/^https:\/\//, '');
+}
+
 function ayudaInstalacion(r: RemotoPlataforma): string {
-  return r.plataforma === 'github'
-    ? 'Instala GitHub CLI (https://cli.github.com) y ejecuta "gh auth login"'
-    : `Instala GitLab CLI (https://gitlab.com/gitlab-org/cli) y ejecuta "glab auth login --hostname ${r.host}"`;
+  if (r.plataforma === 'github') return 'Instala GitHub CLI (https://cli.github.com) y ejecuta "gh auth login"';
+  const login = `Instala GitLab CLI (https://gitlab.com/gitlab-org/cli) y ejecuta "glab auth login --hostname ${hostnameGlab(r)}"`;
+  return r.declarado === undefined ? login : `${login} (o define la variable de entorno GITLAB_TOKEN)`;
 }
 
 export type ResultadoPreflightCli =
@@ -76,7 +116,14 @@ export type ResultadoPreflightCli =
  */
 export function comprobarCli(remoto: RemotoPlataforma, cwd: string): ResultadoPreflightCli {
   const cli = CLI_PLATAFORMA[remoto.plataforma];
-  const r = lanzar(cli, ['auth', 'status', '--hostname', remoto.host], cwd);
+  // Con la instancia declarada la sesion se comprueba con una llamada real,
+  // `glab api user`: `auth status` ignora GITLAB_TOKEN y daria por rota una
+  // sesion por token que funciona (evidencia-glab-subpath, pruebas 2 y 3). Su
+  // salida (el usuario) no se lee ni se muestra.
+  const r =
+    remoto.declarado === undefined
+      ? lanzar(cli, ['auth', 'status', '--hostname', remoto.host], cwd)
+      : lanzar(cli, ['api', 'user'], cwd, contextoGlab(remoto).gitlabHost);
   if (r.error) {
     return {
       ok: false,
@@ -88,7 +135,11 @@ export function comprobarCli(remoto: RemotoPlataforma, cwd: string): ResultadoPr
     return {
       ok: false,
       motivo: 'sin-autenticar',
-      mensaje: `"${cli}" no esta autenticado en ${remoto.host} (${detalle(r)}). ${ayudaInstalacion(remoto)}.`,
+      mensaje:
+        remoto.declarado === undefined
+          ? `"${cli}" no esta autenticado en ${remoto.host} (${detalle(r)}). ${ayudaInstalacion(remoto)}.`
+          : `"${cli}" no tiene sesion valida en ${hostnameGlab(remoto)} o la instancia no responde ` +
+            `(${detalle(r)}). ${ayudaInstalacion(remoto)}.`,
     };
   }
   return { ok: true };
@@ -101,6 +152,7 @@ export function comprobarCli(remoto: RemotoPlataforma, cwd: string): ResultadoPr
  */
 export function estadoMergeRequest(remoto: RemotoPlataforma, rama: string, cwd: string): EstadoMergeRequest {
   const cli = CLI_PLATAFORMA[remoto.plataforma];
+  const ctx = contextoGlab(remoto);
   const args =
     remoto.plataforma === 'github'
       ? [
@@ -111,8 +163,8 @@ export function estadoMergeRequest(remoto: RemotoPlataforma, rama: string, cwd:
           '--limit=100',
           '--json=number,state,url,baseRefName,headRefName,headRefOid,mergeCommit',
         ]
-      : ['mr', 'list', `--source-branch=${rama}`, '--all', '--per-page=100', '--output=json'];
-  const r = lanzar(cli, args, cwd);
+      : ['mr', 'list', ...ctx.repo, `--source-branch=${rama}`, '--all', '--per-page=100', '--output=json'];
+  const r = lanzar(cli, args, cwd, ctx.gitlabHost);
   if (r.error) return { tipo: 'desconocido', motivo: `no se pudo ejecutar "${cli}": ${r.error.message}` };
   if (r.status !== 0) {
     return { tipo: 'desconocido', motivo: `"${cli}" fallo al listar (${detalle(r)})` };
@@ -134,6 +186,7 @@ export function abrirMergeRequest(
   cwd: string
 ): string {
   const cli = CLI_PLATAFORMA[remoto.plataforma];
+  const ctx = contextoGlab(remoto);
   const args =
     remoto.plataforma === 'github'
       ? [
@@ -147,13 +200,14 @@ export function abrirMergeRequest(
       : [
           'mr',
           'create',
+          ...ctx.repo,
           `--target-branch=${peticion.base}`,
           `--source-branch=${peticion.rama}`,
           `--title=${peticion.titulo}`,
           `--description=${peticion.cuerpo}`,
           '--yes',
         ];
-  const r = lanzar(cli, args, cwd);
+  const r = lanzar(cli, args, cwd, ctx.gitlabHost);
   if (r.error) throw new MergeRequestError(`no se pudo ejecutar "${cli}": ${r.error.message}`);
   if (r.status !== 0) {
     throw new MergeRequestError(`"${cli}" no pudo crear el merge request (${detalle(r)})`);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request-instancia.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request-instancia.test.ts
new file mode 100644
index 0000000..dca8544
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request-instancia.test.ts
@@ -0,0 +1,561 @@
+/**
+ * `taskctl finish --merge-request` contra una instancia GitLab DECLARADA en
+ * `.taskcode/config.yml` (TASK-061): dominio propio, instancia bajo una ruta,
+ * https / ssh / scp. Repos Git temporales de verdad con un remoto bare real
+ * (`montarOrigin`) y el doble de `gh` / `glab` de la suite, que ahora apunta
+ * el `GITLAB_HOST` y el `-R` de cada llamada y responde a `api user`.
+ *
+ * Las URLs son genericas a proposito: git.empresa.com y
+ * https://servidor.example/ruta/gitlab. La rama de la tarea sube de verdad al
+ * bare y se comprueba con `ls-remote`/`rev-parse` en el (ramaEnBare).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, writeFile, mkdir } from 'node:fs/promises';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { main } from '../../src/cli.js';
+import { reiniciarAvisosDeConfig } from '../../src/core/config.js';
+import type { Task } from '../../src/core/task.js';
+import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
+import { montarOrigin, mergearEnPlataforma, ramaEnBare, URL_GITLAB, type Origin } from '../helpers/finish-origin.js';
+import {
+  conDoblePlataforma,
+  sinPlataformasEnElPath,
+  type ControlDoble,
+  type EstadoDoble,
+} from '../helpers/plataforma-doble.js';
+
+const HOY = '2026-10-08';
+const ID = 'TASK-700';
+const SIN_PRS: EstadoDoble = { prs: [] };
+
+const BASE_SUB = 'https://servidor.example/ruta/gitlab';
+const ORIGEN_SUB_HTTPS = 'https://servidor.example/ruta/gitlab/grupo/sub/repo.git';
+const CFG_SUB = `plataforma_remota: gitlab\nurl_base_remoto: ${BASE_SUB}\n`;
+
+interface Escenario {
+  repoRoot: string;
+  tareasRoot: string;
+  origin: Origin;
+  task: Task;
+}
+
+/**
+ * Repo con origin bare bajo `url`, la tarea en-revision en su rama (la actual)
+ * y `config` commiteado en ella: el config se lee del arbol de trabajo de la
+ * rama en la que se ejecuta `finish`.
+ */
+async function escenario(url: string, config: string | null, fn: (e: Escenario) => Promise<void>): Promise<void> {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await montarOrigin(repoRoot, url);
+    try {
+      const task = sampleTask();
+      await setupTaskEnRevision(repoRoot, tareasRoot, task);
+      if (config !== null) {
+        await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+        await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+        commitAll(repoRoot, 'chore: config del proyecto');
+      }
+      await fn({ repoRoot, tareasRoot, origin, task });
+    } finally {
+      await origin.limpiar();
+    }
+  });
+}
+
+function finish(e: Escenario, argv: string[], avisos: string[] = []) {
+  return runFinishCommand(e.tareasRoot, argv, HOY, {
+    repoCwd: e.repoRoot,
+    scriptsDir: SCRIPTS_DIR,
+    onAviso: (a) => avisos.push(a),
+  });
+}
+
+async function abrirMr(e: Escenario): Promise<string> {
+  const r = await finish(e, [ID, '--merge-request']);
+  assert.equal(r.cierre, 'esperando-merge-request');
+  return (r.mergeRequest as NonNullable<typeof r.mergeRequest>).url;
+}
+
+/** La plataforma "mergea" de verdad en el bare y el doble pasa a decir `integrado`. */
+async function mergearPr(e: Escenario, dbl: ControlDoble, url: string): Promise<string> {
+  const headSha = ramaEnBare(e.origin.bare, e.task.rama);
+  const commit = await mergearEnPlataforma(e.origin.bare, e.task.rama, 'develop', 'merge');
+  dbl.escribir({
+    ...dbl.leer(),
+    prs: [{ estado: 'integrado', url, base: 'develop', head: e.task.rama, commit, headSha }],
+  });
+  return commit;
+}
+
+/** Corre `fn` con variables de entorno puestas y las restaura (aunque `fn` falle). */
+async function conEntorno(vars: Record<string, string>, fn: () => Promise<void>): Promise<void> {
+  const guardado = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
+  Object.assign(process.env, vars);
+  try {
+    await fn();
+  } finally {
+    for (const [k, v] of Object.entries(guardado)) {
+      if (v === undefined) delete process.env[k];
+      else process.env[k] = v;
+    }
+  }
+}
+
+/** Cada llamada a glab lleva GITLAB_HOST = base y, salvo `api user`, `-R` = proyecto. */
+function assertContexto(dbl: ControlDoble, base: string, proyecto: string): void {
+  const reg = dbl.registro();
+  assert.ok(reg.length >= 3, `se esperaban al menos api user + list + create: ${JSON.stringify(reg.map((r) => r.llamada))}`);
+  for (const r of reg) {
+    assert.equal(r.llamada[0], 'glab');
+    assert.equal(r.entorno['GITLAB_HOST'], base, `GITLAB_HOST de ${r.llamada.join(' ')}`);
+    for (const alias of ['GL_HOST', 'GITLAB_URI', 'GITLAB_API_HOST']) {
+      assert.equal(r.entorno[alias], null, `${alias} no se hereda (${r.llamada.join(' ')})`);
+    }
+    if (r.llamada[1] === 'api') assert.equal(r.repo, null, 'api user no es de un proyecto');
+    else assert.equal(r.repo, proyecto, `-R de ${r.llamada.join(' ')}`);
+  }
+  assert.deepEqual(
+    reg.slice(0, 3).map((r) => r.llamada.slice(1, 3).join(' ')),
+    ['api user', 'mr list', 'mr create']
+  );
+  // El MR creado cuelga de la base y el proyecto: la URL la compone el doble como glab.
+}
+
+/** Todo lo que el flujo deja escrito o impreso, en un texto, para buscar fugas. */
+async function todoLoEscrito(e: Escenario, dbl: ControlDoble, extra: unknown[]): Promise<string> {
+  const md = await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8');
+  return [
+    JSON.stringify(extra),
+    md,
+    git(['log', '--format=%B', '--name-only'], e.repoRoot),
+    JSON.stringify(dbl.leer()),
+  ].join('\n');
+}
+
+// ---------------------------------------------------------------------------
+// Sin declaracion: la 0.6.0
+// ---------------------------------------------------------------------------
+
+test('sin config nueva, gitlab.com / un host con "gitlab" se comporta como la 0.6.0: auth status, sin -R y sin tocar GITLAB_HOST', async () => {
+  await escenario(URL_GITLAB, null, async (e) => {
+    await conEntorno({ GITLAB_HOST: 'https://heredado.example' }, async () => {
+      await conDoblePlataforma(SIN_PRS, async (dbl) => {
+        const r = await finish(e, [ID, '--merge-request']);
+        assert.equal(r.mergeRequest?.url, 'https://gitlab.example.com/acme/repo/-/merge_requests/1');
+        const reg = dbl.registro();
+        assert.equal(reg.length, 3);
+        for (const [i, prefijo] of [
+          'glab auth status --hostname gitlab.example.com',
+          'glab mr list --source-branch=feature/task-700-prueba-finish',
+          'glab mr create --target-branch=develop',
+        ].entries()) {
+          assert.ok((reg[i] as (typeof reg)[number]).llamada.join(' ').startsWith(prefijo), `llamada ${i}: ${reg[i]?.llamada.join(' ')}`);
+        }
+        for (const x of reg) {
+          assert.equal(x.repo, null, 'sin declaracion no hay -R');
+          assert.equal(x.entorno['GITLAB_HOST'], 'https://heredado.example', 'el entorno pasa tal cual, como en la 0.6.0');
+        }
+      });
+    });
+  });
+});
+
+test('sin declaracion, un host que no es GitHub ni "gitlab" sigue abortando como la 0.6.0, y el mensaje apunta a la config', async () => {
+  await escenario('https://git.empresa.com/acme/repo.git', null, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /el host de origin \("git\.empresa\.com"\) no es github\.com ni un host de GitLab.*plataforma_remota: gitlab.*url_base_remoto/s);
+      assert.equal(dbl.leer().llamadas.length, 0);
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
+
+// ---------------------------------------------------------------------------
+// GitLab en dominio propio: solo la plataforma
+// ---------------------------------------------------------------------------
+
+for (const [forma, origen] of [
+  ['https', 'https://git.empresa.com/acme/sub/repo.git'],
+  ['ssh', 'ssh://git@git.empresa.com:2222/acme/sub/repo.git'],
+  ['scp', 'git@git.empresa.com:acme/sub/repo.git'],
+] as const) {
+  test(`GitLab en dominio propio (${forma}), solo plataforma_remota: la base es https://<host de origin> y el proyecto sale de la ruta`, async () => {
+    await escenario(origen, 'plataforma_remota: gitlab\n', async (e) => {
+      await conDoblePlataforma(SIN_PRS, async (dbl) => {
+        const r = await finish(e, [ID, '--merge-request']);
+        assert.deepEqual(r.mergeRequest, {
+          url: 'https://git.empresa.com/acme/sub/repo/-/merge_requests/1',
+          plataforma: 'gitlab',
+          accion: 'abierto',
+        });
+        assertContexto(dbl, 'https://git.empresa.com', 'acme/sub/repo');
+        const [crear] = dbl.llamadasDe('mr', 'create');
+        assert.ok(crear?.includes('--target-branch=develop'));
+        assert.ok(crear?.includes(`--source-branch=${e.task.rama}`));
+        assert.equal(dbl.llamadasDe('auth', 'status').length, 0, 'la sesion se comprueba con api user, no con auth status');
+      });
+      assert.notEqual(ramaEnBare(e.origin.bare, e.task.rama), null, 'la rama se subio');
+    });
+  });
+}
+
+// ---------------------------------------------------------------------------
+// GitLab bajo una ruta
+// ---------------------------------------------------------------------------
+
+for (const [forma, origen, base] of [
+  ['https', ORIGEN_SUB_HTTPS, BASE_SUB],
+  ['https con la base escrita con mayusculas y barra final', ORIGEN_SUB_HTTPS, 'HTTPS://Servidor.Example/ruta/gitlab/'],
+  ['ssh://', 'ssh://git@servidor.example:2222/ruta/gitlab/grupo/sub/repo.git', BASE_SUB],
+  ['scp', 'git@servidor.example:ruta/gitlab/grupo/sub/repo.git', BASE_SUB],
+  ['ssh:// sin la ruta de la instancia (relative_url_root)', 'ssh://git@servidor.example:2222/grupo/sub/repo.git', BASE_SUB],
+  ['scp sin la ruta de la instancia (relative_url_root)', 'git@servidor.example:grupo/sub/repo.git', BASE_SUB],
+] as const) {
+  test(`GitLab bajo una ruta (${forma}): GITLAB_HOST es la base con su ruta y -R el proyecto relativo, y el primer y el segundo finish usan lo mismo`, async () => {
+    await escenario(origen, `plataforma_remota: gitlab\nurl_base_remoto: ${base}\n`, async (e) => {
+      await conDoblePlataforma(SIN_PRS, async (dbl) => {
+        const url = await abrirMr(e);
+        assert.equal(url, 'https://servidor.example/ruta/gitlab/grupo/sub/repo/-/merge_requests/1');
+        assertContexto(dbl, BASE_SUB, 'grupo/sub/repo');
+        assert.notEqual(ramaEnBare(e.origin.bare, e.task.rama), null);
+        const md = await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8');
+        assert.match(md, /- URL del merge request: https:\/\/servidor\.example\/ruta\/gitlab\/grupo\/sub\/repo\/-\/merge_requests\/1/);
+
+        // Segundo finish, contra la misma instancia: consulta el estado alli y cierra.
+        const antes = dbl.registro().length;
+        const commit = await mergearPr(e, dbl, url);
+        const r = await finish(e, [ID]);
+        assert.equal(r.cierre, 'terminada');
+        assert.equal(r.mergeRequest?.accion, 'integrado');
+        assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', commit, 'develop'], { cwd: e.repoRoot }).status, 0);
+        const segundo = dbl.registro().slice(antes);
+        assert.deepEqual(
+          segundo.map((x) => x.llamada.slice(1, 3).join(' ')),
+          ['api user', 'mr list'],
+          'el segundo finish comprueba la sesion y consulta el estado, y no crea otro MR'
+        );
+        for (const x of segundo) {
+          assert.equal(x.entorno['GITLAB_HOST'], BASE_SUB);
+          if (x.llamada[1] === 'mr') assert.equal(x.repo, 'grupo/sub/repo');
+        }
+        assert.equal(dbl.llamadasDe('mr', 'create').length, 1);
+        assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), 'develop');
+      });
+    });
+  });
+}
+
+test('plataforma_remota: github declarada en un host propio usa gh (como hoy) y no pone GITLAB_HOST ni -R', async () => {
+  await escenario('https://git.empresa.com/acme/repo.git', 'plataforma_remota: github\n', async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const r = await finish(e, [ID, '--merge-request']);
+      assert.deepEqual(r.mergeRequest, { url: 'https://github.com/acme/repo/pull/1', plataforma: 'github', accion: 'abierto' });
+      const reg = dbl.registro();
+      assert.equal(reg.length, 3);
+      for (const [i, prefijo] of [
+        'gh auth status --hostname git.empresa.com',
+        'gh pr list --head=feature/task-700-prueba-finish',
+        'gh pr create --base=develop',
+      ].entries()) {
+        assert.ok((reg[i] as (typeof reg)[number]).llamada.join(' ').startsWith(prefijo), `llamada ${i}: ${reg[i]?.llamada.join(' ')}`);
+      }
+      for (const x of dbl.registro()) assert.equal(x.repo, null);
+    });
+  });
+});
+
+// ---------------------------------------------------------------------------
+// La base no encaja con origin: aborta antes de subir nada
+// ---------------------------------------------------------------------------
+
+for (const [que, origen, base, causa] of [
+  ['otra ruta', 'https://servidor.example/otra/grupo/repo.git', BASE_SUB, 'ruta'],
+  ['un segmento a medias', 'https://servidor.example/ruta/gitlab2/grupo/repo.git', BASE_SUB, 'ruta'],
+  ['otro host', 'https://otro.example/ruta/gitlab/grupo/repo.git', BASE_SUB, 'host'],
+  ['otro puerto', 'https://servidor.example:8443/ruta/gitlab/grupo/repo.git', BASE_SUB, 'puerto'],
+  ['ssh de otro host', 'git@otro.example:grupo/repo.git', BASE_SUB, 'host'],
+  ['http con otra ruta', 'http://servidor.example/otra/grupo/repo.git', BASE_SUB, 'ruta'],
+  ['solo el proyecto, sin namespace', 'https://servidor.example/ruta/gitlab/repo.git', BASE_SUB, 'proyecto-corto'],
+] as const) {
+  test(`la base no encaja con origin (${que}): aborta nombrando la clave, sin llamar a glab ni subir nada`, async () => {
+    await escenario(origen, `plataforma_remota: gitlab\nurl_base_remoto: ${base}\n`, async (e) => {
+      await conDoblePlataforma(SIN_PRS, async (dbl) => {
+        await assert.rejects(
+          () => finish(e, [ID, '--merge-request']),
+          (err: unknown) => {
+            const m = (err as Error).message;
+            assert.match(m, /la clave "url_base_remoto" \(https:\/\/servidor\.example\/ruta\/gitlab\) de \.taskcode\/config\.yml no es prefijo de la URL de origin/);
+            assert.ok(m.includes(`: ${causa}.`), `causa ${causa} en: ${m}`);
+            assert.match(m, /No se ha subido nada/);
+            return true;
+          }
+        );
+        assert.equal(dbl.leer().llamadas.length, 0, 'ni siquiera se lanzo glab');
+      });
+      assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null, 'ls-remote: la rama NO se subio');
+      assert.equal(ramaEnBare(e.origin.bare, 'develop'), git(['rev-parse', 'develop'], e.repoRoot).trim());
+    });
+  });
+}
+
+test('solo plataforma: gitlab con una origin sin proyecto deducible tampoco sube nada', async () => {
+  await escenario('https://git.empresa.com/repo.git', 'plataforma_remota: gitlab\n', async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /no se deduce un proyecto grupo\/repo \(proyecto-corto\).*url_base_remoto/s);
+      assert.equal(dbl.leer().llamadas.length, 0);
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
+
+test('config incoherente (url sin plataforma, con github, con userinfo): aborta como config roto antes de tocar nada', async () => {
+  for (const [config, patron] of [
+    ['url_base_remoto: https://servidor.example\n', /necesita tambien "plataforma_remota: gitlab"/],
+    ['plataforma_remota: github\nurl_base_remoto: https://servidor.example\n', /solo vale con "plataforma_remota: gitlab"/],
+    ['plataforma_remota: gitlab\nurl_base_remoto: https://usuario:secreto@servidor.example\n', /lleva un "@"/],
+    ['plataforma_remota: gitlab\nurl_base_remoto: http://servidor.example\n', /debe empezar por https/],
+  ] as const) {
+    await escenario(ORIGEN_SUB_HTTPS, null, async (e) => {
+      // Se escribe y se commitea a mano: setup no admite un config invalido.
+      await mkdir(path.join(e.repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+      commitAll(e.repoRoot, 'chore: config roto');
+      await conDoblePlataforma(SIN_PRS, async (dbl) => {
+        await assert.rejects(
+          () => finish(e, [ID, '--merge-request']),
+          (err: unknown) => {
+            assert.match((err as Error).message, patron);
+            assert.doesNotMatch((err as Error).message, /secreto/);
+            return true;
+          }
+        );
+        assert.equal(dbl.leer().llamadas.length, 0);
+      });
+      assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+    });
+  }
+});
+
+// ---------------------------------------------------------------------------
+// Credenciales y token
+// ---------------------------------------------------------------------------
+
+test('una URL de origin con credenciales no aparece en la salida, tarea.md, los commits ni las llamadas del doble, ni en los abortos', async () => {
+  const conCreds = 'https://usuario:secreto@servidor.example/ruta/gitlab/grupo/sub/repo.git';
+  await escenario(conCreds, CFG_SUB, async (e) => {
+    const avisos: string[] = [];
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const r = await finish(e, [ID, '--merge-request'], avisos);
+      assert.equal(r.mergeRequest?.plataforma, 'gitlab');
+      assertContexto(dbl, BASE_SUB, 'grupo/sub/repo');
+      const todo = await todoLoEscrito(e, dbl, [r, avisos]);
+      assert.doesNotMatch(todo, /secreto|usuario:/);
+      // Y el segundo finish tambien.
+      const url = r.mergeRequest?.url as string;
+      await mergearPr(e, dbl, url);
+      const r2 = await finish(e, [ID], avisos);
+      assert.doesNotMatch(JSON.stringify([r2, avisos, dbl.leer()]), /secreto|usuario:/);
+    });
+  });
+  // Abortos: base que no encaja, sin sesion e instancia inalcanzable (el doble pone credenciales en su stderr).
+  for (const [config, estado] of [
+    ['plataforma_remota: gitlab\nurl_base_remoto: https://servidor.example/otra\n', SIN_PRS],
+    [CFG_SUB, { ...SIN_PRS, auth: false }],
+    [CFG_SUB, { ...SIN_PRS, inalcanzable: true }],
+  ] as const) {
+    await escenario(conCreds, config, async (e) => {
+      await conDoblePlataforma(estado, async () => {
+        await assert.rejects(
+          () => finish(e, [ID, '--merge-request']),
+          (err: unknown) => {
+            assert.doesNotMatch((err as Error).message, /secreto|usuario:/);
+            return true;
+          }
+        );
+      });
+      assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+    });
+  }
+});
+
+test('GITLAB_HOST (y alias) heredados del entorno se ignoran: cada llamada lleva el de la config; GITLAB_TOKEN se hereda y no se imprime', async () => {
+  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
+    await conEntorno(
+      {
+        GITLAB_HOST: 'https://otro.example/x',
+        GL_HOST: 'otro.example',
+        GITLAB_URI: 'https://uri.example',
+        GITLAB_API_HOST: 'api.example',
+        GITLAB_TOKEN: 'tok-secreto-xyz',
+      },
+      async () => {
+        const avisos: string[] = [];
+        await conDoblePlataforma(SIN_PRS, async (dbl) => {
+          const r = await finish(e, [ID, '--merge-request'], avisos);
+          assertContexto(dbl, BASE_SUB, 'grupo/sub/repo');
+          for (const x of dbl.registro()) assert.equal(x.entorno['GITLAB_TOKEN'], '<definido>', 'el token llega a glab');
+          assert.doesNotMatch(await todoLoEscrito(e, dbl, [r, avisos]), /tok-secreto-xyz/);
+        });
+      }
+    );
+  });
+});
+
+// ---------------------------------------------------------------------------
+// Sin sesion, sin CLI o instancia inalcanzable: aborta antes de subir
+// ---------------------------------------------------------------------------
+
+test('sin sesion (api user falla) aborta antes de subir nada, diciendo como iniciar sesion o usar GITLAB_TOKEN', async () => {
+  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
+    await conDoblePlataforma({ ...SIN_PRS, auth: false }, async (dbl) => {
+      await assert.rejects(
+        () => finish(e, [ID, '--merge-request']),
+        /"glab" no tiene sesion valida en servidor\.example\/ruta\/gitlab o la instancia no responde.*glab auth login --hostname servidor\.example\/ruta\/gitlab.*GITLAB_TOKEN.*No se ha subido nada/s
+      );
+      assert.deepEqual(dbl.registro().map((x) => x.llamada.slice(1, 3).join(' ')), ['api user'], 'solo la comprobacion de sesion');
+      assert.equal(dbl.registro()[0]?.entorno['GITLAB_HOST'], BASE_SUB);
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
+
+test('instancia inalcanzable aborta antes de subir nada y la URL con credenciales del error de glab sale tachada', async () => {
+  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
+    await conDoblePlataforma({ ...SIN_PRS, inalcanzable: true }, async (dbl) => {
+      await assert.rejects(
+        () => finish(e, [ID, '--merge-request']),
+        (err: unknown) => {
+          const m = (err as Error).message;
+          assert.match(m, /o la instancia no responde.*dial tcp/s);
+          assert.match(m, /\*\*\*@/, 'ocultarCredenciales se aplico al detalle');
+          assert.doesNotMatch(m, /secreto|usuario:/);
+          return true;
+        }
+      );
+      assert.equal(dbl.llamadasDe('mr', 'create').length, 0);
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
+
+test('sin el CLI instalado aborta antes de subir nada, diciendo que instalar y como autenticarse en esa instancia', async () => {
+  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
+    await sinPlataformasEnElPath(async () => {
+      await assert.rejects(
+        () => finish(e, [ID, '--merge-request']),
+        /no se pudo ejecutar "glab".*Instala GitLab CLI.*glab auth login --hostname servidor\.example\/ruta\/gitlab.*GITLAB_TOKEN.*No se ha subido nada/s
+      );
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
+
+// ---------------------------------------------------------------------------
+// Segundo finish: mismas reglas que en la 0.6.0, contra la misma instancia
+// ---------------------------------------------------------------------------
+
+test('segundo finish contra la instancia declarada: abierto, cerrado y estado desconocido abortan sin tocar nada; mergeado cierra', async () => {
+  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      const antes = git(['rev-parse', 'HEAD'], e.repoRoot).trim();
+
+      dbl.escribir({ ...dbl.leer(), prs: [{ estado: 'abierto', url, base: 'develop', head: e.task.rama }] });
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /sigue abierto/);
+
+      dbl.escribir({ ...dbl.leer(), prs: [{ estado: 'cerrado', url, base: 'develop', head: e.task.rama }] });
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /esta CERRADO sin mergear/);
+
+      dbl.escribir({ ...dbl.leer(), listarFalla: true });
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /no se pudo saber el estado del merge request/);
+
+      assert.equal(git(['rev-parse', 'HEAD'], e.repoRoot).trim(), antes, 'nada commiteado');
+      assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), e.task.rama);
+      for (const x of dbl.registro().filter((r) => r.llamada[1] === 'mr')) {
+        assert.equal(x.entorno['GITLAB_HOST'], BASE_SUB);
+        assert.equal(x.repo, 'grupo/sub/repo');
+      }
+
+      dbl.escribir({ ...dbl.leer(), listarFalla: false });
+      await mergearPr(e, dbl, url);
+      const r = await finish(e, [ID, '--merge-request']);
+      assert.equal(r.cierre, 'terminada');
+    });
+  });
+});
+
+test('segundo finish con un commit local que no llego al MR aborta sin tocar nada (misma regla que la 0.6.0)', async () => {
+  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      await writeFile(path.join(e.repoRoot, 'extra.txt'), 'trabajo que no llego al MR\n', 'utf8');
+      commitAll(e.repoRoot, 'extra');
+      await mergearPr(e, dbl, url);
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /tiene 1 commit\(s\) locales que no estaban en el merge request/);
+      assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), e.task.rama);
+    });
+  });
+});
+
+// ---------------------------------------------------------------------------
+// Clave desconocida: aviso por el CLI de verdad
+// ---------------------------------------------------------------------------
+
+async function capturar(fn: () => Promise<number>): Promise<{ code: number; out: string; err: string }> {
+  const out: string[] = [];
+  const err: string[] = [];
+  const o = process.stdout.write.bind(process.stdout);
+  const er = process.stderr.write.bind(process.stderr);
+  // eslint-disable-next-line @typescript-eslint/no-explicit-any
+  (process.stdout as any).write = (c: string) => (out.push(String(c)), true);
+  // eslint-disable-next-line @typescript-eslint/no-explicit-any
+  (process.stderr as any).write = (c: string) => (err.push(String(c)), true);
+  try {
+    const code = await fn();
+    return { code, out: out.join(''), err: err.join('') };
+  } finally {
+    process.stdout.write = o;
+    process.stderr.write = er;
+  }
+}
+
+test('main: una clave desconocida en la config avisa UNA vez por stderr y el finish --merge-request sigue adelante', async () => {
+  await escenario(ORIGEN_SUB_HTTPS, `${CFG_SUB}limite_wp: 2\n`, async (e) => {
+    const cwdAntes = process.cwd();
+    process.chdir(e.repoRoot);
+    try {
+      reiniciarAvisosDeConfig();
+      await conDoblePlataforma(SIN_PRS, async () => {
+        const r = await capturar(() => main(['finish', ID, '--merge-request']));
+        assert.equal(r.code, 0, r.err);
+        const avisos = r.err.match(/\[AVISO\][^\n]*clave desconocida "limite_wp"/g) ?? [];
+        assert.equal(avisos.length, 1, `un solo aviso aunque la config se resuelva varias veces:\n${r.err}`);
+        assert.match(r.err, /Quiza quisiste decir "limite_wip"/);
+        assert.match(r.out, /merge request|pull request/);
+      });
+    } finally {
+      process.chdir(cwdAntes);
+    }
+    assert.notEqual(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
+
+test('main: una clave conocida con un valor invalido sigue abortando (codigo 1) y no sube nada', async () => {
+  await escenario(ORIGEN_SUB_HTTPS, `${CFG_SUB}limite_wip: 0\n`, async (e) => {
+    const cwdAntes = process.cwd();
+    process.chdir(e.repoRoot);
+    try {
+      await conDoblePlataforma(SIN_PRS, async () => {
+        const r = await capturar(() => main(['finish', ID, '--merge-request']));
+        assert.equal(r.code, 1);
+        assert.match(r.err, /limite_wip/);
+      });
+    } finally {
+      process.chdir(cwdAntes);
+    }
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts
index c36ac7d..2ea4cad 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-sincronizacion.test.ts
@@ -8,7 +8,7 @@ import assert from 'node:assert/strict';
 import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
-import { ConfigError, CONFIG_DEFAULTS, parsearConfig, resolverConfig } from '../../src/core/config.js';
+import { ConfigError, CONFIG_DEFAULTS, parsearConfig, parsearConfigConAvisos, resolverConfig } from '../../src/core/config.js';
 
 const RUTA = '/repo/.taskcode/config.yml';
 const BASE = 'comando_sincronizacion: "node scripts/sync.mjs"\n';
@@ -76,8 +76,12 @@ test('config sincronizacion: comando vacio y timeout no positivo abortan', () =>
   rechaza(BASE + 'rutas_sincronizacion: [a.md]\ntimeout_sincronizacion: 0\n', /Por defecto es 60/);
 });
 
-test('config sincronizacion: una errata en la clave aborta y sugiere la buena', () => {
-  rechaza('comando_sincronizacon: x\n', /Quiza quisiste decir "comando_sincronizacion"/);
+// TASK-061: antes ABORTABA. Una errata en la clave avisa y sugiere la buena; la
+// sincronizacion queda desactivada porque la clave mal escrita no se lee.
+test('config sincronizacion: una errata en la clave avisa y sugiere la buena (antes abortaba)', () => {
+  const { config, avisos } = parsearConfigConAvisos('comando_sincronizacon: x\n', RUTA);
+  assert.match(avisos.join('\n'), /Quiza quisiste decir "comando_sincronizacion"/);
+  assert.equal(config.comando_sincronizacion, null);
 });
 
 test('config sincronizacion: el limite_wip invalido conserva su mensaje (no hereda el del timeout)', () => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts
index 3e9a1e1..0a848f4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts
@@ -13,7 +13,7 @@ import {
   urlDeSalidaDeCreacion,
   urlMergeRequestAnotada,
 } from '../../src/core/plataforma-remota.js';
-import { CIERRES_POR_DEFECTO, CONFIG_DEFAULTS, CLAVES_CONFIG, ConfigError, parsearConfig } from '../../src/core/config.js';
+import { CIERRES_POR_DEFECTO, CONFIG_DEFAULTS, CLAVES_CONFIG, ConfigError, parsearConfig, parsearConfigConAvisos } from '../../src/core/config.js';
 import { extraerFlagsCierre } from '../../src/commands/finish-opciones.js';
 
 test('hostDeRemoto: https, http, ssh://, scp, con usuario, contrasena y puerto; rutas locales y letras de unidad no son host', () => {
@@ -145,6 +145,6 @@ test('config: cierre_por_defecto mal escrito, vacio o repetido aborta como el re
   assert.throws(() => parsearConfig('cierre_por_defecto: pr\n', RUTA), ConfigError);
   assert.throws(() => parsearConfig('cierre_por_defecto:\n', RUTA), ConfigError);
   assert.throws(() => parsearConfig('cierre_por_defecto: merge\ncierre_por_defecto: merge-request\n', RUTA), /repetida/);
-  // La clave vecina mal escrita sugiere la nueva.
-  assert.throws(() => parsearConfig('cierre_por_defect: merge\n', RUTA), /Quiza quisiste decir "cierre_por_defecto"/);
+  // La clave vecina mal escrita sugiere la nueva (TASK-061: avisa, antes abortaba).
+  assert.match(parsearConfigConAvisos('cierre_por_defect: merge\n', RUTA).avisos.join('\n'), /Quiza quisiste decir "cierre_por_defecto"/);
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/remoto-declarado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/remoto-declarado.test.ts
new file mode 100644
index 0000000..8eb3c95
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/remoto-declarado.test.ts
@@ -0,0 +1,268 @@
+/**
+ * Parte pura de TASK-061: las claves `plataforma_remota` y `url_base_remoto`,
+ * la normalizacion de la base y la deduccion del proyecto a partir de la URL
+ * de origin. Sin disco ni procesos; los repos reales y el doble de glab estan
+ * en test/commands/finish-merge-request-instancia.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import {
+  normalizarBase,
+  partesDeOrigin,
+  proyectoDeRemoto,
+  resolverRemotoDeclarado,
+} from '../../src/core/plataforma-remota.js';
+import {
+  CLAVES_CONFIG,
+  CONFIG_DEFAULTS,
+  ConfigError,
+  parsearConfig,
+  reiniciarAvisosDeConfig,
+  resolverConfig,
+} from '../../src/core/config.js';
+
+const RUTA = '/repo/.taskcode/config.yml';
+
+function rechaza(contenido: string, patron: RegExp): Error {
+  let capturado: Error | null = null;
+  assert.throws(
+    () => parsearConfig(contenido, RUTA),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError, String(e));
+      assert.match(e.message, patron);
+      capturado = e;
+      return true;
+    },
+    `deberia rechazar:\n${contenido}`
+  );
+  return capturado as unknown as Error;
+}
+
+// ---------------------------------------------------------------------------
+// Claves de config
+// ---------------------------------------------------------------------------
+
+test('config: sin las claves nuevas, defaults nulos (rige la deteccion por host de la 0.6.0)', () => {
+  assert.equal(CONFIG_DEFAULTS.plataforma_remota, null);
+  assert.equal(CONFIG_DEFAULTS.url_base_remoto, null);
+  const c = parsearConfig('limite_wip: 2\n', RUTA);
+  assert.equal(c.plataforma_remota, null);
+  assert.equal(c.url_base_remoto, null);
+  assert.ok((CLAVES_CONFIG as readonly string[]).includes('plataforma_remota'));
+  assert.ok((CLAVES_CONFIG as readonly string[]).includes('url_base_remoto'));
+});
+
+test('config: plataforma sola, y plataforma gitlab con la base normalizada', () => {
+  assert.equal(parsearConfig('plataforma_remota: github\n', RUTA).plataforma_remota, 'github');
+  const sola = parsearConfig('plataforma_remota: gitlab\n', RUTA);
+  assert.equal(sola.plataforma_remota, 'gitlab');
+  assert.equal(sola.url_base_remoto, null);
+  const c = parsearConfig('plataforma_remota: gitlab\nurl_base_remoto: HTTPS://Git.Empresa.COM:443/Ruta/GitLab//\n', RUTA);
+  assert.equal(c.url_base_remoto, 'https://git.empresa.com/Ruta/GitLab', 'esquema y host en minusculas, sin 443, sin barras finales');
+  assert.equal(
+    parsearConfig('plataforma_remota: gitlab\nurl_base_remoto: https://servidor.example:8443\n', RUTA).url_base_remoto,
+    'https://servidor.example:8443'
+  );
+});
+
+test('config: la plataforma invalida aborta como el resto de enumerados y sugiere la parecida', () => {
+  rechaza('plataforma_remota: gitlb\n', /plataforma_remota "gitlb" no es valida\. ¿Querias decir "gitlab"\?[\s\S]*github, gitlab/);
+  rechaza('plataforma_remota: bitbucket\n', /Valores validos: github, gitlab/);
+  rechaza('plataforma_remota:\n', /no puede estar vacia[\s\S]*sin la clave, no se declara/);
+  rechaza('plataforma_remota: gitlab\nplataforma_remota: github\n', /repetida/);
+});
+
+test('config: la URL sin plataforma, o con github, aborta con un mensaje que dice que hacer', () => {
+  rechaza('url_base_remoto: https://git.empresa.com\n', /necesita tambien "plataforma_remota: gitlab"/);
+  rechaza('plataforma_remota: github\nurl_base_remoto: https://git.empresa.com\n', /solo vale con "plataforma_remota: gitlab"/);
+  // El orden de las claves no importa.
+  rechaza('url_base_remoto: https://git.empresa.com\nplataforma_remota: github\n', /solo vale con "plataforma_remota: gitlab"/);
+  // El mensaje nombra la linea de la URL.
+  assert.match(rechaza('plataforma_remota: github\nurl_base_remoto: https://git.empresa.com\n', /solo vale/).message, /config\.yml:2:/);
+});
+
+test('config: una URL con userinfo aborta SIN repetir lo escrito (podria ser un token)', () => {
+  for (const url of [
+    'https://usuario:secreto@git.empresa.com',
+    'https://tok-secreto@git.empresa.com/ruta',
+    'https://git.empresa.com/ruta?x=a@b',
+  ]) {
+    const e = rechaza(`plataforma_remota: gitlab\nurl_base_remoto: ${url}\n`, /lleva un "@"/);
+    assert.doesNotMatch(e.message, /secreto|tok-|git.empresa|servidor/, 'no repite lo escrito');
+  }
+});
+
+test('config: la URL que no es https o no es una URL base limpia aborta', () => {
+  rechaza('plataforma_remota: gitlab\nurl_base_remoto: http://git.empresa.com\n', /debe empezar por https:\/\//);
+  rechaza('plataforma_remota: gitlab\nurl_base_remoto: git.empresa.com\n', /debe empezar por https:\/\//);
+  rechaza('plataforma_remota: gitlab\nurl_base_remoto: ssh://git.empresa.com/ruta\n', /debe empezar por https:\/\//);
+  for (const mala of [
+    'https://git.empresa.com/ruta?a=1',
+    'https://git.empresa.com/ruta#frag',
+    'https://git.empresa.com/../otra',
+    'https://git.empresa.com/ru ta',
+    'https://git.empresa.com:99999/ruta',
+    'https://git_empresa.com',
+    'https://',
+  ]) {
+    rechaza(`plataforma_remota: gitlab\nurl_base_remoto: "${mala}"\n`, /no es una URL base valida/);
+  }
+  rechaza('plataforma_remota: gitlab\nurl_base_remoto:\n', /no puede estar vacia/);
+});
+
+// ---------------------------------------------------------------------------
+// Claves desconocidas: aviso, una vez por proceso
+// ---------------------------------------------------------------------------
+
+test('resolverConfig: una clave desconocida avisa por stderr UNA vez por proceso aunque se resuelva muchas, y devuelve el resto', async () => {
+  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-aviso-'));
+  const escrito: string[] = [];
+  const original = process.stderr.write.bind(process.stderr);
+  try {
+    await mkdir(path.join(repo, '.git'));
+    await mkdir(path.join(repo, '.taskcode'));
+    await writeFile(path.join(repo, '.taskcode', 'config.yml'), 'limite_wp: 2\nlimite_wip: 3\n', 'utf8');
+    reiniciarAvisosDeConfig();
+    // eslint-disable-next-line @typescript-eslint/no-explicit-any
+    (process.stderr as any).write = (c: string) => (escrito.push(String(c)), true);
+    const a = resolverConfig(repo);
+    resolverConfig(repo);
+    resolverConfig(repo);
+    assert.equal(a.limite_wip, 3);
+  } finally {
+    process.stderr.write = original;
+    await rm(repo, { recursive: true, force: true });
+  }
+  assert.equal(escrito.length, 1, escrito.join('|'));
+  assert.match(escrito[0] as string, /\[AVISO\].*clave desconocida "limite_wp"; se ignora/);
+  assert.match(escrito[0] as string, /Quiza quisiste decir "limite_wip"/);
+});
+
+// ---------------------------------------------------------------------------
+// Base y deduccion del proyecto
+// ---------------------------------------------------------------------------
+
+test('normalizarBase: esquema, host, puerto y barras; el motivo del rechazo', () => {
+  const ok = normalizarBase('  HTTPS://Servidor.Example/ruta/gitlab/  ');
+  assert.ok(ok.ok);
+  assert.equal(ok.base, 'https://servidor.example/ruta/gitlab');
+  assert.deepEqual(ok.segmentos, ['ruta', 'gitlab']);
+  assert.equal((normalizarBase('https://h.example:0443') as { puerto: string | null }).puerto, null, '0443 es el 443');
+  assert.deepEqual(normalizarBase('https://h@x.example'), { ok: false, motivo: 'credenciales' });
+  assert.deepEqual(normalizarBase('http://h.example'), { ok: false, motivo: 'no-https' });
+  assert.deepEqual(normalizarBase('h.example'), { ok: false, motivo: 'no-https' });
+  assert.deepEqual(normalizarBase('https://h.example/a?b'), { ok: false, motivo: 'malformada' });
+});
+
+const BASE_SUB = 'https://servidor.example/ruta/gitlab';
+
+test('proyectoDeRemoto: https, ssh:// con puerto y scp deducen el mismo proyecto, sin .git ni barra final', () => {
+  for (const url of [
+    'https://servidor.example/ruta/gitlab/grupo/sub/repo.git',
+    'https://servidor.example/ruta/gitlab/grupo/sub/repo',
+    'https://servidor.example/ruta/gitlab/grupo/sub/repo/',
+    'HTTPS://SERVIDOR.Example:443/ruta/gitlab/grupo/sub/repo.git',
+    'https://usuario:secreto@servidor.example/ruta/gitlab/grupo/sub/repo.git',
+    'ssh://git@servidor.example:2222/ruta/gitlab/grupo/sub/repo.git',
+    'ssh://git@servidor.example/ruta/gitlab/grupo/sub/repo.git',
+    'git@servidor.example:ruta/gitlab/grupo/sub/repo.git',
+    'servidor.example:ruta/gitlab/grupo/sub/repo.git',
+    'git@servidor.example:/ruta/gitlab/grupo/sub/repo.git',
+    // ssh/scp SIN la ruta de la instancia (relative_url_root): la ruta entera es el proyecto.
+    'git@servidor.example:grupo/sub/repo.git',
+    'ssh://git@servidor.example:2222/grupo/sub/repo.git',
+  ]) {
+    assert.deepEqual(proyectoDeRemoto(url, BASE_SUB), { ok: true, proyecto: 'grupo/sub/repo' }, url);
+  }
+  // Base declarada con barra final y mayusculas en el host: misma base.
+  assert.deepEqual(proyectoDeRemoto('https://servidor.example/ruta/gitlab/g/r.git', 'HTTPS://Servidor.example/ruta/gitlab/'), {
+    ok: true,
+    proyecto: 'g/r',
+  });
+  // Base en la raiz del host.
+  assert.deepEqual(proyectoDeRemoto('git@git.empresa.com:acme/repo.git', 'https://git.empresa.com'), { ok: true, proyecto: 'acme/repo' });
+});
+
+test('proyectoDeRemoto: la base debe ser prefijo EXACTO; si no, motivo y nada deducido', () => {
+  const casos: Array<[string, string, string]> = [
+    // [url de origin, base, motivo]
+    ['https://otro.example/ruta/gitlab/g/r.git', BASE_SUB, 'host'],
+    ['https://servidor.example:8443/ruta/gitlab/g/r.git', BASE_SUB, 'puerto'],
+    ['https://servidor.example/ruta/gitlab/g/r.git', 'https://servidor.example:8443/ruta/gitlab', 'puerto'],
+    ['https://servidor.example/otra/g/r.git', BASE_SUB, 'ruta'],
+    ['https://servidor.example/ruta/gitlab2/g/r.git', BASE_SUB, 'ruta'],
+    ['https://servidor.example/ruta/gitl/g/r.git', 'https://servidor.example/ruta/gitlab', 'ruta'],
+    ['https://servidor.example/RUTA/gitlab/g/r.git', BASE_SUB, 'ruta'],
+    ['http://servidor.example/otra/g/r.git', BASE_SUB, 'ruta'],
+    ['git@otro.example:g/r.git', BASE_SUB, 'host'],
+    ['ssh://git@otro.example:2222/ruta/gitlab/g/r.git', BASE_SUB, 'host'],
+    ['git@servidor.example:repo.git', BASE_SUB, 'proyecto-corto'],
+    ['git@servidor.example:ruta/gitlab/repo.git', BASE_SUB, 'proyecto-corto'],
+    ['https://servidor.example/ruta/gitlab/solo.git', BASE_SUB, 'proyecto-corto'],
+    ['https://servidor.example/ruta/gitlab', BASE_SUB, 'proyecto-corto'],
+    ['https://servidor.example/ruta/gitlab/g/-r.git', BASE_SUB, 'proyecto-invalido'],
+    ['https://servidor.example/ruta/gitlab/g/r s.git', BASE_SUB, 'proyecto-invalido'],
+    ['/tmp/bare.git', BASE_SUB, 'url-sin-red'],
+    ['C:\\Users\\x\\bare', BASE_SUB, 'url-sin-red'],
+    ['https://servidor.example/ruta/gitlab/g/r.git', 'http://servidor.example/ruta/gitlab', 'base-invalida'],
+  ];
+  for (const [url, base, motivo] of casos) {
+    assert.deepEqual(proyectoDeRemoto(url, base), { ok: false, motivo }, `${url} contra ${base}`);
+  }
+});
+
+test('proyectoDeRemoto / partesDeOrigin: ninguna salida contiene credenciales', () => {
+  const urls = [
+    'https://usuario:secreto@servidor.example/ruta/gitlab/g/r.git',
+    'https://tok-secreto@servidor.example/otra/g/r.git',
+    'ssh://usuario:secreto@servidor.example:2222/ruta/gitlab/g/r.git',
+    'https://usuario:con@arroba-secreto@servidor.example/ruta/gitlab/g/r.git',
+  ];
+  for (const url of urls) {
+    for (const base of [BASE_SUB, 'https://servidor.example']) {
+      assert.doesNotMatch(JSON.stringify(proyectoDeRemoto(url, base)), /secreto|usuario|arroba/, url);
+    }
+    assert.doesNotMatch(JSON.stringify(partesDeOrigin(url)), /secreto|usuario|arroba/, url);
+    for (const plataforma of ['gitlab', 'github'] as const) {
+      const r = resolverRemotoDeclarado([url], { plataforma, urlBase: plataforma === 'gitlab' ? BASE_SUB : null });
+      assert.doesNotMatch(JSON.stringify(r), /secreto|usuario|arroba/, url);
+    }
+  }
+});
+
+test('resolverRemotoDeclarado: solo plataforma gitlab usa https://<host de origin> (con puerto solo si origin es https con puerto)', () => {
+  const r = resolverRemotoDeclarado(['git@git.empresa.com:acme/sub/repo.git'], { plataforma: 'gitlab', urlBase: null });
+  assert.deepEqual(r, {
+    ok: true,
+    remoto: { plataforma: 'gitlab', host: 'git.empresa.com', declarado: { base: 'https://git.empresa.com', proyecto: 'acme/sub/repo' } },
+  });
+  const p = resolverRemotoDeclarado(['https://git.empresa.com:8443/acme/repo.git'], { plataforma: 'gitlab', urlBase: null });
+  assert.ok(p.ok);
+  assert.equal(p.remoto.declarado?.base, 'https://git.empresa.com:8443');
+  // El puerto de ssh no es el web.
+  const s = resolverRemotoDeclarado(['ssh://git@git.empresa.com:2222/acme/repo.git'], { plataforma: 'gitlab', urlBase: null });
+  assert.ok(s.ok);
+  assert.equal(s.remoto.declarado?.base, 'https://git.empresa.com');
+});
+
+test('resolverRemotoDeclarado: prueba cada URL de origin (la efectiva puede ser local por insteadOf) y, si ninguna encaja, no supone nada', () => {
+  const r = resolverRemotoDeclarado(['/tmp/bare.git', 'https://servidor.example/ruta/gitlab/g/r.git'], { plataforma: 'gitlab', urlBase: BASE_SUB });
+  assert.ok(r.ok);
+  assert.equal(r.remoto.declarado?.proyecto, 'g/r');
+  const mal = resolverRemotoDeclarado(['/tmp/bare.git', 'https://servidor.example/otra/g/r.git'], { plataforma: 'gitlab', urlBase: BASE_SUB });
+  assert.deepEqual(mal, { ok: false, motivo: 'no-encaja', origen: 'servidor.example/otra/g/r', causa: 'ruta' });
+  assert.deepEqual(resolverRemotoDeclarado(['/tmp/bare.git'], { plataforma: 'gitlab', urlBase: null }), {
+    ok: false,
+    motivo: 'sin-host',
+    origen: null,
+    causa: null,
+  });
+  // github: basta el host, sin base.
+  assert.deepEqual(resolverRemotoDeclarado(['https://git.empresa.com/acme/repo.git'], { plataforma: 'github', urlBase: null }), {
+    ok: true,
+    remoto: { plataforma: 'github', host: 'git.empresa.com' },
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
index 8ea21f5..8b1cfa3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
@@ -6,7 +6,21 @@
 // que lee y escribe un fichero de estado JSON (el que cada test prepara) y
 // apunta en el cada llamada que recibe:
 //
-//   { auth, listarFalla, crearFalla, prs: [...], llamadas: [[cli, ...args]] }
+//   { auth, listarFalla, crearFalla, inalcanzable, prs: [...], llamadas: [[cli, ...args]],
+//     entornos: [{ GITLAB_HOST, GL_HOST, ... }] }
+//
+// TASK-061: junto a cada llamada se apunta el entorno que la instancia de glab
+// vera (`GITLAB_HOST`, `GL_HOST`, `GITLAB_URI`, `GITLAB_API_HOST`; y de
+// `GITLAB_TOKEN` solo SI estaba definido, nunca su valor), y el `-R` va en los
+// propios argumentos. Responde a `api user` (la comprobacion de sesion de una
+// instancia declarada) con el mismo `auth` que `auth status`. Con
+// `GITLAB_HOST` y `-R` el MR creado cuelga de esa base, como lo compondria glab.
+//
+// Lo que el doble NO hace: el `glab mr create` real deja un fichero de
+// recuperacion en el directorio de configuracion de glab
+// (`<config de glab>/recover/<proyecto>/mr.json`); el doble no escribe nada
+// ahi, asi que ninguna prueba toca el de quien las corre. Una prueba contra
+// el glab real tendria que aislar ese directorio (GLAB_CONFIG_DIR).
 //
 // Como se lanza, por plataforma:
 //
@@ -47,9 +61,13 @@ export interface EstadoDoble {
   listarFalla?: boolean;
   /** true: `pr create` / `mr create` salen con 1. */
   crearFalla?: boolean;
+  /** true: toda llamada que no sea `auth` sale con 1 (instancia caida), con una URL con credenciales en stderr. */
+  inalcanzable?: boolean;
   prs: PrDoble[];
   /** Lo apunta el doble: una entrada por llamada, `[cli, ...args]`. */
   llamadas?: string[][];
+  /** Lo apunta el doble: el entorno de cada llamada, alineado con `llamadas`. */
+  entornos?: Array<Record<string, string | null>>;
 }
 
 const ENV_ESTADO = 'TASKCODE_DOBLE_ESTADO';
@@ -75,8 +93,18 @@ const CODIGO_DOBLE = [
   "  const st = JSON.parse(fs.readFileSync(f, 'utf8'));",
   '  st.llamadas = st.llamadas || [];',
   '  st.llamadas.push([cli].concat(args));',
+  '  st.entornos = st.entornos || [];',
+  "  const e = {};",
+  "  for (const k of ['GITLAB_HOST', 'GL_HOST', 'GITLAB_URI', 'GITLAB_API_HOST']) e[k] = process.env[k] === undefined ? null : process.env[k];",
+  "  e.GITLAB_TOKEN = process.env.GITLAB_TOKEN ? '<definido>' : null;",
+  '  st.entornos.push(e);',
   '  const guardar = () => fs.writeFileSync(f, JSON.stringify(st));',
   '  guardar();',
+  "  if (st.inalcanzable && args[0] !== 'auth') salir(1, '', 'Get \"https://usuario:secreto@' + (e.GITLAB_HOST || 'servidor') + '/api/v4/user\": dial tcp: no such host\\n');",
+  "  if (args[0] === 'api' && args[1] === 'user') {",
+  "    if (st.auth === false) salir(1, '', 'Unauthenticated\\n');",
+  "    salir(0, '{\"username\":\"doble\"}\\n', '');",
+  '  }',
   "  if (args[0] === 'auth' && args[1] === 'status') {",
   "    if (st.auth === false) salir(1, '', 'You are not logged in\\n');",
   '    salir(0, \'\', \'Logged in\\n\');',
@@ -101,7 +129,8 @@ const CODIGO_DOBLE = [
   "    const head = cli === 'gh' ? valor(args, 'head') : valor(args, 'source-branch');",
   "    const base = cli === 'gh' ? valor(args, 'base') : valor(args, 'target-branch');",
   '    const n = st.prs.length + 1;',
-  "    const url = cli === 'gh' ? 'https://github.com/acme/repo/pull/' + n : 'https://gitlab.example.com/acme/repo/-/merge_requests/' + n;",
+  "    const r = args.indexOf('-R');",
+  "    const url = cli === 'gh' ? 'https://github.com/acme/repo/pull/' + n : (e.GITLAB_HOST && r >= 0 ? e.GITLAB_HOST + '/' + args[r + 1] : 'https://gitlab.example.com/acme/repo') + '/-/merge_requests/' + n;",
   "    st.prs.push({ estado: 'abierto', url: url, base: base, head: head, commit: null });",
   '    guardar();',
   "    salir(0, 'Creating pull request for ' + head + ' into ' + base + '\\n\\n' + url + '\\n', '');",
@@ -165,6 +194,8 @@ export interface ControlDoble {
   escribir(estado: EstadoDoble): void;
   /** Llamadas recibidas de un subcomando, p. ej. `llamadasDe('pr', 'create')`. */
   llamadasDe(sub1: string, sub2: string): string[][];
+  /** Cada llamada con su `-R` (null si no lo llevaba) y el entorno que glab vio: lo que TASK-061 asevera. */
+  registro(): Array<{ llamada: string[]; repo: string | null; entorno: Record<string, string | null> }>;
 }
 
 /**
@@ -180,10 +211,25 @@ export async function conDoblePlataforma(
   const control: ControlDoble = {
     leer: () => {
       const e = JSON.parse(readFileSync(fichero, 'utf8')) as EstadoDoble;
-      return { auth: e.auth ?? true, listarFalla: e.listarFalla ?? false, crearFalla: e.crearFalla ?? false, prs: e.prs, llamadas: e.llamadas ?? [] };
+      return {
+        auth: e.auth ?? true,
+        listarFalla: e.listarFalla ?? false,
+        crearFalla: e.crearFalla ?? false,
+        inalcanzable: e.inalcanzable ?? false,
+        prs: e.prs,
+        llamadas: e.llamadas ?? [],
+        entornos: e.entornos ?? [],
+      };
     },
-    escribir: (e) => writeFileSync(fichero, JSON.stringify({ llamadas: [], ...e }), 'utf8'),
+    escribir: (e) => writeFileSync(fichero, JSON.stringify({ llamadas: [], entornos: [], ...e }), 'utf8'),
     llamadasDe: (a, b) => (control.leer().llamadas).filter((l) => l[1] === a && l[2] === b),
+    registro: () => {
+      const e = control.leer();
+      return e.llamadas.map((llamada, i) => {
+        const r = llamada.indexOf('-R');
+        return { llamada, repo: r >= 0 ? (llamada[r + 1] ?? null) : null, entorno: e.entornos[i] ?? {} };
+      });
+    },
   };
   control.escribir(inicial);
   const guardado = { PATH: process.env['PATH'], NODE_OPTIONS: process.env['NODE_OPTIONS'], ESTADO: process.env[ENV_ESTADO] };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts
index 532099c..a51429d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts
@@ -19,6 +19,7 @@ import {
   CLAVES_CONFIG,
   ConfigError,
   parsearConfig,
+  parsearConfigConAvisos,
   resolverConfig,
   rutaConfig,
 } from '../../src/core/config.js';
@@ -382,31 +383,31 @@ test('invalido: agente_revisor_por_defecto vacio aborta igual que rama_base', ()
   );
 });
 
-test('invalido: clave desconocida aborta, sugiere la parecida y enumera las validas', () => {
-  assert.throws(
-    () => parsearConfig('limite_wp: 2\n', RUTA_FICTICIA),
-    (e: unknown) => {
-      assert.ok(e instanceof ConfigError, String(e));
-      assert.match(e.message, /clave desconocida "limite_wp"/);
-      assert.match(e.message, /Quiza quisiste decir "limite_wip"/);
-      for (const clave of CLAVES_CONFIG) {
-        assert.ok(e.message.includes(clave), `falta "${clave}" en: ${e.message}`);
-      }
-      return true;
-    }
-  );
+// TASK-061: antes ABORTABA. Ahora avisa, sugiere la parecida, enumera las
+// validas y la ignora (el resto del fichero se lee igual).
+test('clave desconocida: avisa (no aborta), sugiere la parecida, enumera las validas y se ignora', () => {
+  const { config, avisos } = parsearConfigConAvisos('limite_wp: 2\nrama_base: integration\n', RUTA_FICTICIA);
+  assert.equal(avisos.length, 1);
+  const aviso = avisos[0] as string;
+  assert.match(aviso, /^\[AVISO\] .*:1: clave desconocida "limite_wp"; se ignora/);
+  assert.match(aviso, /Quiza quisiste decir "limite_wip"/);
+  for (const clave of CLAVES_CONFIG) {
+    assert.ok(aviso.includes(clave), `falta "${clave}" en: ${aviso}`);
+  }
+  assert.equal(config.limite_wip, CONFIG_DEFAULTS.limite_wip, 'la clave desconocida no se aplica ni a la parecida');
+  assert.equal(config.rama_base, 'integration', 'las conocidas del mismo fichero si');
+  assert.equal(parsearConfig('limite_wp: 2\n', RUTA_FICTICIA).limite_wip, CONFIG_DEFAULTS.limite_wip);
 });
 
-test('invalido: una clave descartada por la decision #9 tambien es desconocida', () => {
+test('una clave descartada por la decision #9 sigue siendo desconocida: avisa (TASK-061, antes abortaba)', () => {
   // `remoto`, `rama_principal` y `politica_no_borrar_ramas` NO se
-  // declaran. Escribirlas tiene que fallar, no ignorarse: una clave
-  // que el usuario escribe y el plugin no lee es peor que no tenerla.
+  // declaran. Escribirlas no puede pasar en silencio: tiene que avisar
+  // de que no se leen (una clave que el usuario escribe y el plugin no
+  // lee es peor que no tenerla), aunque ya no pare a nadie.
   for (const clave of ['remoto', 'rama_principal', 'politica_no_borrar_ramas']) {
-    assert.throws(
-      () => parsearConfig(`${clave}: x\n`, RUTA_FICTICIA),
-      ConfigError,
-      `"${clave}" deberia ser rechazada`
-    );
+    const { avisos } = parsearConfigConAvisos(`${clave}: x\n`, RUTA_FICTICIA);
+    assert.equal(avisos.length, 1, `"${clave}" deberia avisar`);
+    assert.match(avisos[0] as string, new RegExp(`clave desconocida "${clave}"`));
   }
 });
 
@@ -457,7 +458,8 @@ test('fallo cerrado real: resolveBaseBranchForTipo NO cae a "develop" con un con
 
 test('fallo cerrado real: taskctl new aborta con un config roto y NO crea la tarea', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await escribirConfig(repoRoot, 'limite_wp: 2\n');
+    // TASK-061: con `limite_wp` (clave desconocida) ya no aborta; lo roto es un valor invalido.
+    await escribirConfig(repoRoot, 'limite_wip: 0\n');
     await assert.rejects(
       runNewCommand(tareasRoot, ['--titulo', 'x', '--tipo', 'feature'], '2026-09-07', {
         repoCwd: repoRoot,
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-061/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-061/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-061/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-061/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-061/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-061/planificacion/evidencia-glab-subpath.md                        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-061/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-061/tarea.md                                                       |   5 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-opciones.js                            |  47 +++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 161 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plataforma-remota.js                              | 171 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/merge-request.js                                    |  64 ++++++++++++++++++++++++++-----
 12 files changed, 408 insertions(+), 40 deletions(-)
````
