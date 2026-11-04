# Peticion de revision — TASK-068 (ronda 2)

- Tarea: TASK-068 — Doctor-deploy C: tipo de aplicacion y sondas deterministas extra
- Rama revisada: feature/task-068-doctor-deploy-c-tipo-de-aplicacion-y-son
- Rama base: develop
- Commit revisado (HEAD): 6aa388b7f7ddcf6dd536496eac6b888f76021cfa
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-068 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 9c414f3f12d58cf05e77755aaf299f41160c9bdb (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la
peticion.

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | scripts/doctor-deploy.yml:114 (aplicacion_2_contiene) y :132-139 (cli/libreria) | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | scripts/doctor-deploy.yml:100 (tipo_14_marcadores) frente a src/fs/sondas-deploy-config.ts (esDockerfile/esCompose) | informe-revision-1.md |
| IMP-3 | IMPORTANTE | abierto | src/core/doctor-deploy-reglas.ts:61 (PATRONES_REGLAS_SIN_HUELLA) y :585-615 (detectarPullRequestTarget) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/core/doctor-deploy-reglas.ts:470 (CLAVE_SECRETA) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/core/doctor-deploy-reglas.ts:568 (RE_EVENTO_PR_TARGET) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/core/doctor-deploy-reglas.ts:595 (solo se mira `ref:`) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | CHANGELOG.md (Doctor-deploy C, «Silencios por hallazgo») | informe-revision-1.md |
| MEN-5 | MENOR | abierto | src/core/doctor-deploy-reglas.ts:471 (`_file$`) y src/fs/sondas-deploy-config.ts (limite de tamano) | informe-revision-1.md |

## Commits a revisar (git log 9c414f3f12d58cf05e77755aaf299f41160c9bdb..HEAD)

````
6aa388b fix(TASK-068): correcciones de la ronda 1 de revision
186a6ed chore(TASK-068): veredicto ronda 1 (cambios-solicitados)
978687f chore(TASK-068): coste revision +11936337 tokens (1 agente)
b3ef842 docs(TASK-068): informe de revision ronda 1
acc6c6e chore(TASK-068): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 9c414f3f12d58cf05e77755aaf299f41160c9bdb..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index a2c8271..b88e5a1 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -20,8 +20,9 @@ Doctor-deploy C (TASK-068): clase de aplicacion, sondas de configuracion y OWASP
   `migraciones-sin-rls`, `tokens-en-ficheros-de-gestor`, `compose-con-contrasenas`,
   `ci-pull-request-target`, `acciones-ci-sin-sha` y `dockerfile-sin-user` pasan de
   juicio a determinista: el agente revisor ya no los recibe y un veredicto suyo
-  para ellos se rechaza. Silencios por hallazgo para sus patrones. Valores
-  secretos siempre enmascarados.
+  para ellos se rechaza. Silencios por hallazgo para sus patrones (en
+  `pr-target-checkout`, por paso del flujo), salvo `dockerfile-sin-user`, que es
+  del fichero entero. Valores secretos siempre enmascarados.
 - **Referencias**: el campo `referencia` pasa de OWASP Top 10 2021 a OWASP Top 10
   2025 + ASVS 5.0, remapeado por significado (SSRF de A10 a A01, inyeccion de A03
   a A05...). La tabla esta en `docs/doctor-deploy-referencias-owasp.md`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 4141dc3..9759a9d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -574,7 +574,10 @@ puntos de juicio (ver «Puntos de juicio» más abajo).
   familia `aplicacion_N_*` del catálogo (`id`, `nombre`, `marcadores` y,
   opcional, `contiene`: textos que debe contener el fichero marcador; un
   `package.json` es `cli` si contiene `"bin"`). Sale como «Aplicacion
-  detectada», con el fichero que la decidió. Un punto puede declarar
+  detectada», con el fichero que la decidió. Además de los frameworks, cuentan
+  como api las señales de servicio que no dependen de él: `EXPOSE` en un
+  Dockerfile, `ports:` en un compose o `web:` en un Procfile; una CLI que además
+  sirve HTTP sale cli y api, y los puntos aplican. Un punto puede declarar
   `punto_N_aplicaciones: [web, api, ...]`: se combina con `punto_N_tipos` con
   Y, y dentro de cada lista basta con uno. **Si no se detecta ninguna clase, el
   punto aplica**; solo sale NO APLICA si se detecta alguna y ninguna está en la
@@ -628,8 +631,10 @@ puntos de juicio (ver «Puntos de juicio» más abajo).
   punto sale NO APLICA con el motivo; un fichero ilegible o mayor que el límite
   lo deja en NO VERIFICADO. Un token que ya da FALLA en `secretos-en-arbol` no
   se cuenta otra vez en `tokens-en-ficheros-de-gestor`. Cada hallazgo se
-  silencia con `patron` + `fichero` + `huella`; `dockerfile-sin-user` y
-  `pr-target-checkout` son del fichero entero y se silencian sin huella.
+  silencia con `patron` + `fichero` + `huella` (en `pr-target-checkout`, una por
+  paso del flujo); `dockerfile-sin-user` es del fichero entero y se silencia sin
+  huella. Estas sondas miran cualquier `Dockerfile*`, `Containerfile` o
+  `compose*.yaml` versionado, aunque el tipo Docker no se detecte.
 - **Claves de ejemplo y públicas**: `AKIAIOSFODNN7EXAMPLE` y `sk_test_` no cuentan,
   ni la clave `anon`/`publishable` de Supabase ni la `apiKey` `AIza...` de la
   config web de Firebase; `service_role`, `sk_live_` y una clave privada sí. El
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml b/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml
index a81803b..d7cc7cc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml
@@ -104,15 +104,18 @@ tipo_15_marcadores: [vite.config.js, vite.config.ts, next.config.js, next.config
 
 # --- Tipos de aplicacion -----------------------------------------------------
 # Ante la duda, un punto aplica: por eso web y api se detectan con generosidad
-# y cli y libreria solo con una senal explicita en el manifiesto.
+# y cli y libreria solo con una senal explicita en el manifiesto. Ademas de los
+# frameworks, cuentan como api las senales de servicio que no dependen de el:
+# un puerto expuesto en un Dockerfile, "ports:" en un compose o "web:" en un
+# Procfile. Una CLI que ademas sirve HTTP sale cli y api, y los puntos aplican.
 
 aplicacion_1_id: web
 aplicacion_1_nombre: Aplicacion web
 aplicacion_1_marcadores: [vite.config.js, vite.config.ts, next.config.js, next.config.mjs, next.config.ts, angular.json, svelte.config.js, nuxt.config.ts, nuxt.config.js, astro.config.mjs, remix.config.js, gatsby-config.js, public/index.html]
 aplicacion_2_id: api
 aplicacion_2_nombre: API o servicio web
-aplicacion_2_marcadores: [package.json, requirements.txt, pyproject.toml, Pipfile, pom.xml, build.gradle, build.gradle.kts, go.mod, Gemfile, composer.json, Cargo.toml, *.csproj, openapi.yaml, openapi.yml, openapi.json, swagger.yaml, swagger.json]
-aplicacion_2_contiene: ["\"express\"", "\"fastify\"", "\"koa\"", "\"@nestjs/core\"", "\"@hapi/hapi\"", "\"hono\"", flask, fastapi, django, spring-boot-starter-web, gin-gonic/gin, labstack/echo, gofiber/fiber, go-chi/chi, "gem \"rails\"", "gem 'rails'", sinatra, laravel/framework, symfony/framework-bundle, axum, actix-web, Microsoft.NET.Sdk.Web, "openapi:", "\"openapi\"", "swagger:", "\"swagger\""]
+aplicacion_2_marcadores: [package.json, requirements.txt, pyproject.toml, Pipfile, setup.py, setup.cfg, pom.xml, build.gradle, build.gradle.kts, go.mod, Gemfile, composer.json, Cargo.toml, *.csproj, openapi.yaml, openapi.yml, openapi.json, swagger.yaml, swagger.json, Dockerfile, docker-compose.yml, docker-compose.yaml, compose.yml, compose.yaml, Procfile]
+aplicacion_2_contiene: ["\"express\"", "\"fastify\"", "\"koa\"", "\"@nestjs/core\"", "\"@hapi/hapi\"", "\"hono\"", "\"restify\"", "apollo-server", "\"@apollo/server\"", "\"@trpc/server\"", "\"graphql-yoga\"", "\"@adonisjs/core\"", "\"@feathersjs/", "\"next\"", "\"nuxt\"", "\"@sveltejs/kit\"", "\"@remix-run/", "\"astro\"", flask, fastapi, django, aiohttp, tornado, sanic, starlette, bottle, litestar, quart, falcon, pyramid, spring-boot-starter-web, spring-boot-starter-webflux, micronaut, quarkus, ktor, javalin, gin-gonic/gin, labstack/echo, gofiber/fiber, go-chi/chi, gorilla/mux, "gem \"rails\"", "gem 'rails'", sinatra, laravel/framework, symfony/framework-bundle, slim/slim, axum, actix-web, rocket, warp, tide, poem, Microsoft.NET.Sdk.Web, "openapi:", "\"openapi\"", "swagger:", "\"swagger\"", "expose ", "ports:", "web:"]
 aplicacion_3_id: android
 aplicacion_3_nombre: App Android
 aplicacion_3_marcadores: [AndroidManifest.xml, build.gradle, build.gradle.kts]
@@ -476,7 +479,7 @@ punto_39_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V13
 
 punto_40_id: compose-con-contrasenas
 punto_40_severidad: alta
-punto_40_tipos: [docker]
+punto_40_tipos: [todos]
 punto_40_metodo: determinista
 punto_40_sonda: compose-contrasenas
 punto_40_arreglo: Saca las contrasenas del docker-compose y leelas de un fichero .env ignorado por git o de secretos de Docker.
@@ -503,7 +506,7 @@ punto_42_referencia: OWASP Top 10 2025 A03; ASVS 5.0 V15
 
 punto_43_id: dockerfile-sin-user
 punto_43_severidad: alta
-punto_43_tipos: [docker]
+punto_43_tipos: [todos]
 punto_43_metodo: determinista
 punto_43_sonda: dockerfile-user
 punto_43_arreglo: Anade una instruccion USER con un usuario sin privilegios al final del Dockerfile y evita ADD de URLs remotas.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
index 5608173..98dc0c4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
@@ -650,8 +650,8 @@ export function parsearCapaProyecto(contenido: string, ruta: string, base: Catal
     }
     // D3: un silencio es POR HALLAZGO. Sin commit solo vale para el arbol, y ahi se ata a la huella
     // del valor: asi no tapa otra clave nueva del mismo patron en el mismo fichero. Los hallazgos
-    // que son del fichero entero (PATRONES_SIN_HUELLA: fichero-secreto, dockerfile-sin-user,
-    // pr-target-checkout) no tienen huella y valen con patron + fichero (TASK-068).
+    // que son del fichero entero (PATRONES_SIN_HUELLA: fichero-secreto y dockerfile-sin-user)
+    // no tienen huella y valen con patron + fichero (TASK-068).
     if (commit === null && huella === null && !PATRONES_SIN_HUELLA.includes(patron)) {
       throw fallar(
         `[ERROR] ${ruta}: silenciar_${n} exige "silenciar_${n}_commit" (hallazgo del historial) o "silenciar_${n}_huella" ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-reglas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-reglas.ts
index 5bdd58c..20216c7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-reglas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-reglas.ts
@@ -61,7 +61,7 @@ export const PATRON = {
 } as const;
 
 /** Patrones cuyo hallazgo es del fichero entero (sin huella): se silencian con patron + fichero. */
-export const PATRONES_REGLAS_SIN_HUELLA: readonly string[] = [PATRON.prTarget, PATRON.sinUser];
+export const PATRONES_REGLAS_SIN_HUELLA: readonly string[] = [PATRON.sinUser];
 
 // ---------------------------------------------------------------------
 // Utilidades
@@ -525,8 +525,10 @@ export const detectarTokensGestor: Detector = (ficheros) =>
 // 40 compose-con-contrasenas
 // ---------------------------------------------------------------------
 
-const CLAVE_SECRETA = /(?:^|_)(?:password|passwd|pass|pwd|secret|token|api_?key|access_?key|private_?key)$/i;
-const CLAVE_NO_SECRETA = /allow_empty|random_root|_file$/i;
+const CLAVE_SECRETA =
+  /(?:^|_)(?:password|passwd|pass|pwd|secret|token|api_?key|access_?key|private_?key|secret_?key|signing_?key|encryption_?key|auth_?key|master_?key)$/i;
+// Las claves *_FILE (secretos de Docker) ya no casan con CLAVE_SECRETA: no hace falta excluirlas.
+const CLAVE_NO_SECRETA = /allow_empty|random_root/i;
 const VALOR_NO_CONTRASENA = /^(?:true|false|yes|no|on|off|null|~|<[^>]*>|\*+)$/i;
 
 /** El valor de una clave del compose, si es una contrasena literal; null si no lo es. */
@@ -594,7 +596,14 @@ const RE_CODIGO_PR =
 
 /** true si el flujo se dispara con `pull_request_target` (bloque, escalar o lista en linea `[...]`). */
 export function usaPullRequestTarget(contenido: string): boolean {
-  const t = normalizar(contenido).split('\n').map(sinComentarioYaml).join('\n');
+  // Fuera las condiciones (`if:`) y las expresiones `${{ }}`: nombrar el evento en una
+  // comparacion (`github.event_name != 'pull_request_target'`) no es dispararse con el.
+  const t = normalizar(contenido)
+    .split('\n')
+    .map(sinComentarioYaml)
+    .filter((l) => !/^\s*(?:-\s*)?if\s*:/.test(l))
+    .map((l) => l.replace(/\$\{\{[^}]*\}\}/g, ' '))
+    .join('\n');
   return RE_EVENTO_PR_TARGET.test(t);
 }
 
@@ -622,7 +631,9 @@ export const detectarPullRequestTarget: Detector = (ficheros) =>
           fichero: f.ruta,
           linea: i + 1,
           descripcion: `el flujo se dispara con pull_request_target y trae el codigo del PR (${que}): ejecuta codigo ajeno con secretos y permisos de escritura`,
-          huella: null,
+          // Huella por paso (la linea sin espacios de mas): un silencio no tapa un paso
+          // peligroso que se anada despues al mismo flujo.
+          huella: huellaDe(`${PATRON.prTarget}|${l.trim().replace(/\s+/g, ' ')}`),
         });
       });
     return res;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts
index 74934d4..38ba0a9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts
@@ -377,3 +377,47 @@ test('un fichero marcador sin versionar (no ignorado) tambien cuenta, como en lo
     await commit(raiz, 'herramienta');
   });
 });
+
+// ---------------------------------------------------------------------
+// IMP-1 (ronda 1): una API con un framework que no estaba en la lista, o con una
+// senal de servicio independiente del framework, no se queda en "cli" a secas.
+// ---------------------------------------------------------------------
+
+test('IMP-1: CLI que tambien es servidor (apollo, trpc, aiohttp, rocket, next) sale api y los puntos aplican', async () => {
+  const casos: Record<string, Record<string, string>> = {
+    apollo: { 'package.json': '{"name":"g","bin":{"g":"s.js"},"dependencies":{"apollo-server":"3"}}\n' },
+    trpc: { 'package.json': '{"name":"t","bin":{"t":"s.js"},"dependencies":{"@trpc/server":"10"}}\n' },
+    next: { 'package.json': '{"name":"n","bin":{"n":"s.js"},"dependencies":{"next":"14"}}\n' },
+    aiohttp: { 'pyproject.toml': '[project]\nname = "a"\ndependencies = ["aiohttp>=3"]\n[project.scripts]\na = "a:main"\n' },
+    rocket: { 'Cargo.toml': '[package]\nname = "r"\n[[bin]]\nname = "r"\n[dependencies]\nrocket = "0.5"\n' },
+  };
+  for (const [nombre, ficheros] of Object.entries(casos)) {
+    await conRepo({ ...GITIGNORE, ...ficheros }, async (raiz, op) => {
+      const j = analisis(raiz, op);
+      assert.ok(ids(j).includes('api'), `${nombre}: ${JSON.stringify(ids(j))}`);
+      for (const id of SEIS) assert.notEqual(punto(j, id).estado, 'no-aplica', `${nombre}: ${id}`);
+    });
+  }
+});
+
+test('IMP-1: senales de servicio sin framework conocido (EXPOSE, ports:, Procfile web:) cuentan como api', async () => {
+  const cli = { ...GITIGNORE, 'package.json': '{"name":"c","bin":{"c":"s.js"}}\n' };
+  const casos: Record<string, Record<string, string>> = {
+    expose: { Dockerfile: 'FROM node:22\nEXPOSE 8080\nUSER node\n' },
+    ports: { 'compose.yaml': 'services:\n  app:\n    image: app\n    ports:\n      - "8080:8080"\n' },
+    procfile: { Procfile: 'web: node s.js\n' },
+  };
+  for (const [nombre, ficheros] of Object.entries(casos)) {
+    await conRepo({ ...cli, ...ficheros }, async (raiz, op) => {
+      const j = analisis(raiz, op);
+      assert.deepEqual(ids(j), ['api', 'cli'], nombre);
+      for (const id of SEIS) assert.notEqual(punto(j, id).estado, 'no-aplica', `${nombre}: ${id}`);
+    });
+  }
+  // Y una CLI de verdad, sin ninguna senal de servidor, sigue apagando los puntos.
+  await conRepo(cli, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['cli']);
+    for (const id of SEIS) assert.equal(punto(j, id).estado, 'no-aplica', id);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts
index 8ff953c..5b13073 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts
@@ -312,3 +312,54 @@ test('las sondas leen lo versionado: un Dockerfile sin commitear no cuenta', asy
     assert.ok(p.evidencias.every((e) => e.fichero !== 'Dockerfile.nuevo'), 'el no versionado no se mira');
   });
 });
+
+// ---------------------------------------------------------------------
+// Correcciones de la ronda 1 de revision
+// ---------------------------------------------------------------------
+
+test('IMP-2: Dockerfile.prod, Containerfile y compose.prod.yaml se revisan aunque el tipo docker no se detecte', async () => {
+  await conRepo({ ...NODE, 'Dockerfile.prod': 'FROM node:22\nCMD ["node", "index.js"]\n' }, async (raiz, opciones) => {
+    assertFalla(punto(informe(raiz, opciones), 'dockerfile-sin-user'), 'Dockerfile.prod', /root|USER/);
+  });
+  await conRepo({ ...NODE, Containerfile: 'FROM node:22\n' }, async (raiz, opciones) => {
+    assertFalla(punto(informe(raiz, opciones), 'dockerfile-sin-user'), 'Containerfile', /root|USER/);
+  });
+  await conRepo(
+    { ...NODE, 'compose.prod.yaml': `services:\n  db:\n    image: postgres\n    environment:\n      POSTGRES_PASSWORD: ${PASS}\n` },
+    async (raiz, opciones) => {
+      assertFalla(punto(informe(raiz, opciones), 'compose-con-contrasenas'), 'compose.prod.yaml', /POSTGRES_PASSWORD/);
+    }
+  );
+});
+
+test('IMP-3: un silencio de pr-target-checkout es por paso; un paso peligroso nuevo vuelve a dar FALLA', async () => {
+  const cabecera = 'on: pull_request_target\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n';
+  const conRef = '      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n';
+  await conRepo({ ...NODE, '.github/workflows/pr.yml': cabecera + conRef }, async (raiz, opciones) => {
+    const p = punto(informe(raiz, opciones), 'ci-pull-request-target');
+    assert.equal(p.estado, 'falla');
+    const huella = /patron pr-target-checkout, huella ([0-9a-f]{12})/.exec(p.evidencias[0]?.descripcion ?? '')?.[1];
+    assert.ok(huella !== undefined, p.evidencias[0]?.descripcion);
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml': `silenciar_1_patron: pr-target-checkout\nsilenciar_1_fichero: .github/workflows/pr.yml\nsilenciar_1_huella: "${huella}"\nsilenciar_1_motivo: revisado\nsilenciar_1_quien: Ana\nsilenciar_1_fecha: 2026-11-04\n`,
+    });
+    assert.equal(punto(informe(raiz, opciones), 'ci-pull-request-target').estado, 'ok');
+    await writeFile(path.join(raiz, '.github/workflows/pr.yml'), cabecera + conRef + '      - run: gh pr checkout ${{ github.event.number }}\n', 'utf8');
+    assert.equal(punto(informe(raiz, opciones), 'ci-pull-request-target').estado, 'falla');
+  });
+});
+
+test('MEN-1 y MEN-2: SECRET_KEY en compose da FALLA; pull_request_target solo nombrado en un if: no', async () => {
+  await conRepo(
+    { ...DOCKER, 'docker-compose.yml': `services:\n  web:\n    image: app\n    environment:\n      SECRET_KEY: ${PASS}\n` },
+    async (raiz, opciones) => {
+      assertFalla(punto(informe(raiz, opciones), 'compose-con-contrasenas'), 'docker-compose.yml', /SECRET_KEY/);
+    }
+  );
+  const flujo =
+    "on: pull_request\njobs:\n  t:\n    if: github.event_name != 'pull_request_target'\n    runs-on: ubuntu-latest\n    steps:\n" +
+    '      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n';
+  await conRepo({ ...NODE, '.github/workflows/pr.yml': flujo }, async (raiz, opciones) => {
+    assert.notEqual(punto(informe(raiz, opciones), 'ci-pull-request-target').estado, 'falla');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
index ff3a642..eb3d7c8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
@@ -175,7 +175,7 @@ for (const [nombre, archivos, tipoId] of [
       assert.equal(dep.estado, 'no-verificado');
       assert.match(dep.motivo, /falta (npm|cargo-audit|pip-audit)/);
       // Un punto de otro tipo sale NO APLICA con motivo.
-      const docker = punto(informe, 'dockerfile-sin-user');
+      const docker = punto(informe, 'contenedor-sin-root-ni-secretos');
       assert.equal(docker.estado, 'no-aplica');
       assert.match(docker.motivo, /docker/);
       assert.match(docker.motivo, new RegExp(tipoId));
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
index c850945..00728b2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
@@ -156,13 +156,12 @@ test('TASK-068: los puntos 37 a 43 son deterministas y rls-activo y contenedor-s
   }
 });
 
-test('TASK-068: un hallazgo por fichero (dockerfile-sin-user, pr-target-checkout) se silencia sin huella; uno con valor, no', () => {
+test('TASK-068: un hallazgo por fichero (dockerfile-sin-user) se silencia sin huella; uno por paso o con valor (pr-target-checkout desde IMP-3 de la ronda 1), no', () => {
   const capa = (patron: string): string =>
     `silenciar_1_patron: ${patron}\nsilenciar_1_fichero: Dockerfile\nsilenciar_1_motivo: imagen de pruebas\nsilenciar_1_quien: Ana\nsilenciar_1_fecha: 2026-11-04\n`;
   const base: CatalogoBase = { tipos: BASE.tipos, aplicaciones: BASE.aplicaciones, puntos: BASE.puntos };
   assert.equal(parsearCapaProyecto(capa('dockerfile-sin-user'), 'p.yml', base).silencios.length, 1);
-  assert.equal(parsearCapaProyecto(capa('pr-target-checkout'), 'p.yml', base).silencios.length, 1);
-  for (const patron of ['token-gestor', 'compose-contrasena', 'tabla-sin-rls', 'accion-sin-sha', 'firebase-regla-abierta', 'dockerfile-add-url']) {
+  for (const patron of ['pr-target-checkout', 'token-gestor', 'compose-contrasena', 'tabla-sin-rls', 'accion-sin-sha', 'firebase-regla-abierta', 'dockerfile-add-url']) {
     assert.throws(() => parsearCapaProyecto(capa(patron), 'p.yml', base), /exige "silenciar_1_commit" .* o "silenciar_1_huella"/, patron);
   }
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-reglas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-reglas.test.ts
index e6bdb22..1b458d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-reglas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-reglas.test.ts
@@ -284,7 +284,7 @@ test('pr-target: pull_request_target con checkout del head del PR se detecta (es
     const h = uno(detectarPullRequestTarget, '.github/workflows/ci.yml', c);
     assert.equal(h.length, 1, c);
     assert.equal(h[0]?.patron, PATRON.prTarget);
-    assert.equal(h[0]?.huella, null);
+    assert.match(h[0]?.huella ?? '', /^[0-9a-f]{12}$/);
   }
 });
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 9c414f3f12d58cf05e77755aaf299f41160c9bdb..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-068/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-068/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-068/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-068/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-068/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-068/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-068/planificacion/brainstorm/salida-brainstorm-testing-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-068/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-068/revision/informe-revision-1.md                                                  |   66 ++
 tareas/03-en-revision/TASK-068/revision/peticion-revision-1.md                                                 | 4249 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-068/tarea.md                                                       |    8 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-catalogo.js                           |    4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-reglas.js                             |   20 +-
 13 files changed, 4337 insertions(+), 10 deletions(-)
````
