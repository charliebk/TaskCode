# Peticion de revision — TASK-061 (ronda 2)

- Tarea: TASK-061 — Merge request en cualquier GitLab, tambien autoalojado
- Rama revisada: feature/task-061-merge-request-en-gitlab-autoalojado-tamb
- Rama base: develop
- Commit revisado (HEAD): cb569d5681ba5c74f59fd7871214df971496cedb
- Fecha: 2026-10-08
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-061 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde c07cd91199ebc87aa668176fc5fc913ea5a905a7 (el commit revisado en la ronda anterior)

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
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts (abrirMergeRequest, `glab mr create` con GITLAB_HOST con ruta) | informe-revision-1.md |
| MENOR-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts (resolverRemotoDeclarado, origin http con puerto) | informe-revision-1.md |

## Commits a revisar (git log c07cd91199ebc87aa668176fc5fc913ea5a905a7..HEAD)

````
cb569d5 chore(TASK-061): coste implementacion +9330891 tokens
01acde9 fix(TASK-061): con GitLab declarado el MR se crea por glab api (IMP-1) y http con puerto pide url_base_remoto (MENOR-3)
aa959e9 chore(TASK-061): veredicto ronda 1 (cambios-solicitados)
75e63d0 docs(TASK-061): linea de veredicto de la plantilla en el informe ronda 1
96650d5 chore(TASK-061): coste revision +5125878 tokens (1 agente)
d59d0c1 docs(TASK-061): informe de revision ronda 1
c64f4f0 chore(TASK-061): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff c07cd91199ebc87aa668176fc5fc913ea5a905a7..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index b04b963..4ca90a9 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -21,7 +21,12 @@ Merge request en cualquier GitLab, tambien autoalojado (TASK-061).
   origin y lo pasa con `-R`. Comprueba la sesion con `glab api user` (acepta
   `glab auth login --hostname <host/ruta>` o `GITLAB_TOKEN`; `auth status` no
   vale: ignora el token). Sin sesion, sin CLI o con la instancia inalcanzable
-  aborta antes de subir nada. El token nunca se imprime ni se escribe.
+  aborta antes de subir nada. El token nunca se imprime ni se escribe. El MR
+  se crea por la API (`glab api projects/<proyecto>/merge_requests`, campos
+  `--raw-field`) y no con `glab mr create`, que aborta siempre con una
+  instancia bajo una ruta (comprueba que un remoto de Git corresponda a
+  `GITLAB_HOST` y solo compara el host). Con origin `http://host:puerto` y solo
+  la plataforma declarada, aborta pidiendo `url_base_remoto`.
   Sin declarar nada rige la deteccion por host de la 0.6.0, sin cambios.
 - **Cambio de comportamiento**: una clave desconocida en `.taskcode/config.yml`
   ya no aborta, avisa por stderr (`[AVISO] ... clave desconocida "x"; se
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 875719a..7ceb5b3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -644,6 +644,11 @@ url_base_remoto: https://git.empresa.com            # opcional
   `GITLAB_TOKEN`. La sesión se comprueba con `glab api user`. El token no se
   imprime ni se escribe. `glab` solo habla https con la instancia; un
   certificado propio se resuelve en el sistema o en la configuración de `glab`.
+- Con la plataforma declarada el merge request se crea con la API
+  (`glab api projects/<proyecto>/merge_requests`), no con `glab mr create`:
+  este último exige que un remoto de Git corresponda a `GITLAB_HOST` y con una
+  instancia bajo una ruta falla siempre. Con origin `http://host:puerto` hay
+  que declarar `url_base_remoto` (glab solo habla https).
 - Con la plataforma declarada, cada llamada a `glab` lleva `GITLAB_HOST` fijado
   a la base y se ignoran los `GITLAB_HOST`, `GL_HOST`, `GITLAB_URI` y
   `GITLAB_API_HOST` del entorno, para que un host heredado no abra el merge
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
index bc13826..08be5d3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
@@ -326,6 +326,12 @@ function motivoDeclarado(
     return 'la clave "url_base_remoto" de .taskcode/config.yml no es una URL base valida. Corrigela o borrala.';
   }
   const origen = d.origen ?? '(sin host)';
+  if (urlBase === null && d.causa === 'http-con-puerto') {
+    return (
+      `origin es http con puerto (${origen}) y glab solo habla https: no se puede deducir la instancia. ` +
+      'Declara "url_base_remoto" en .taskcode/config.yml con la URL https real (con su puerto si lo tiene).'
+    );
+  }
   if (urlBase === null) {
     return (
       `de la URL de origin (${origen}) no se deduce un proyecto grupo/repo (${d.causa ?? 'sin causa'}). ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
index ecf5910..7bf1586 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
@@ -150,6 +150,8 @@ export interface PartesOrigin {
   host: string;
   /** Solo con esquema https (443 = null). */
   puerto: string | null;
+  /** Puerto explicito (distinto del 80) de un origin `http://`: glab habla https, asi que no se puede deducir la base. */
+  puertoHttp: string | null;
   /** Ruta sin `.git` final, sin barras y troceada. */
   segmentos: string[];
 }
@@ -187,14 +189,15 @@ export function partesDeOrigin(url: string): PartesOrigin | null {
     else segs[ultimo] = sinGit;
   }
   const puerto = esquema === 'https' && aut.puerto !== '443' ? aut.puerto : null;
-  return { esquema, host: aut.host, puerto, segmentos: segs };
+  const puertoHttp = esquema === 'http' && aut.puerto !== null && aut.puerto !== '80' ? aut.puerto : null;
+  return { esquema, host: aut.host, puerto, puertoHttp, segmentos: segs };
 }
 
 export type ResultadoProyecto =
   | { ok: true; proyecto: string }
   | {
       ok: false;
-      motivo: 'url-sin-red' | 'base-invalida' | 'host' | 'puerto' | 'ruta' | 'proyecto-corto' | 'proyecto-invalido';
+      motivo: 'url-sin-red' | 'base-invalida' | 'host' | 'puerto' | 'ruta' | 'proyecto-corto' | 'proyecto-invalido' | 'http-con-puerto';
     };
 
 /**
@@ -271,6 +274,11 @@ export function resolverRemotoDeclarado(urls: readonly string[], declarado: Remo
   let causa: Extract<ResultadoProyecto, { ok: false }>['motivo'] | null = null;
   for (const { u, p } of red) {
     const parte = p as PartesOrigin;
+    if (declaradaNormal === null && parte.puertoHttp !== null) {
+      // glab solo habla https: el puerto de un origin http no es el de la web https.
+      causa ??= 'http-con-puerto';
+      continue;
+    }
     const base =
       declaradaNormal !== null && declaradaNormal.ok
         ? declaradaNormal.base
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
index 0f5a674..6471fc5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
@@ -58,12 +58,20 @@ interface ContextoGlab {
   repo: readonly string[];
   /** Valor fijado de `GITLAB_HOST` (undefined sin declaracion: no se toca el entorno). */
   gitlabHost: string | undefined;
+  /** Endpoint REST de los MR del proyecto (`projects/<ruta%2Fcodificada>/merge_requests`); undefined sin declaracion. */
+  endpointMr: string | undefined;
 }
 
 /** El unico productor de `-R` y `GITLAB_HOST` (ver cabecera). */
 function contextoGlab(remoto: RemotoPlataforma): ContextoGlab {
   const d = remoto.declarado;
-  return d === undefined ? { repo: [], gitlabHost: undefined } : { repo: ['-R', d.proyecto], gitlabHost: d.base };
+  return d === undefined
+    ? { repo: [], gitlabHost: undefined, endpointMr: undefined }
+    : {
+        repo: ['-R', d.proyecto],
+        gitlabHost: d.base,
+        endpointMr: `projects/${encodeURIComponent(d.proyecto)}/merge_requests`,
+      };
 }
 
 function entornoDe(gitlabHost: string | undefined): NodeJS.ProcessEnv {
@@ -179,6 +187,38 @@ export interface PeticionMergeRequest {
   cuerpo: string;
 }
 
+/**
+ * Con GitLab declarado el MR se crea por la API REST (`glab api ... --method=POST`) y no
+ * con `glab mr create`: este ultimo exige que algun remoto de Git "corresponda" a
+ * `GITLAB_HOST` y compara solo el host, asi que con una instancia bajo una ruta
+ * (`GITLAB_HOST=https://host/ruta/gitlab`) aborta siempre, aunque se pase `-R`
+ * (glab 1.102.0 real). `glab api` no mira los remotos y respeta la ruta. Un solo camino
+ * para instancia con o sin ruta. Cada campo va como `--raw-field=clave=valor` (un solo
+ * argv, sin shell): un titulo que empiece por "-" o lleve comillas no se lee como flag.
+ */
+function argsCrearPorApi(endpoint: string, p: PeticionMergeRequest): string[] {
+  return [
+    'api',
+    endpoint,
+    '--method=POST',
+    `--raw-field=source_branch=${p.rama}`,
+    `--raw-field=target_branch=${p.base}`,
+    `--raw-field=title=${p.titulo}`,
+    `--raw-field=description=${p.cuerpo}`,
+  ];
+}
+
+/** `web_url` del JSON que devuelve la creacion por API, o null si no es una URL publicable. */
+function webUrlDeRespuesta(stdout: string): string | null {
+  try {
+    const o = JSON.parse(stdout) as unknown;
+    const url = typeof o === 'object' && o !== null ? (o as Record<string, unknown>)['web_url'] : null;
+    return esUrlPublicable(url) ? url : null;
+  } catch {
+    return null;
+  }
+}
+
 /** Abre el PR/MR y devuelve su URL. Lanza MergeRequestError si el CLI falla. */
 export function abrirMergeRequest(
   remoto: RemotoPlataforma,
@@ -200,19 +240,18 @@ export function abrirMergeRequest(
       : [
           'mr',
           'create',
-          ...ctx.repo,
           `--target-branch=${peticion.base}`,
           `--source-branch=${peticion.rama}`,
           `--title=${peticion.titulo}`,
           `--description=${peticion.cuerpo}`,
           '--yes',
         ];
-  const r = lanzar(cli, args, cwd, ctx.gitlabHost);
+  const r = lanzar(cli, ctx.endpointMr === undefined ? args : argsCrearPorApi(ctx.endpointMr, peticion), cwd, ctx.gitlabHost);
   if (r.error) throw new MergeRequestError(`no se pudo ejecutar "${cli}": ${r.error.message}`);
   if (r.status !== 0) {
     throw new MergeRequestError(`"${cli}" no pudo crear el merge request (${detalle(r)})`);
   }
-  const url = urlDeSalidaDeCreacion(r.stdout ?? '');
+  const url = ctx.endpointMr === undefined ? urlDeSalidaDeCreacion(r.stdout ?? '') : webUrlDeRespuesta(r.stdout ?? '');
   if (url === null || !esUrlPublicable(url)) {
     throw new MergeRequestError(
       `"${cli}" termino bien pero no devolvio la URL del merge request (salida: ${detalle(r)})`
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request-instancia.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request-instancia.test.ts
index dca8544..0e6ca52 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request-instancia.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request-instancia.test.ts
@@ -119,9 +119,15 @@ function assertContexto(dbl: ControlDoble, base: string, proyecto: string): void
   }
   assert.deepEqual(
     reg.slice(0, 3).map((r) => r.llamada.slice(1, 3).join(' ')),
-    ['api user', 'mr list', 'mr create']
+    ['api user', 'mr list', `api projects/${encodeURIComponent(proyecto)}/merge_requests`],
+    'con instancia declarada el MR se crea por la API (glab mr create falla con una ruta), nunca con mr create'
   );
-  // El MR creado cuelga de la base y el proyecto: la URL la compone el doble como glab.
+  assert.equal(dbl.llamadasDe('mr', 'create').length, 0);
+}
+
+/** Llamadas que crean un MR por API (`glab api projects/<p>/merge_requests --method=POST`). */
+function creaciones(dbl: ControlDoble): string[][] {
+  return dbl.leer().llamadas.filter((l) => l[1] === 'api' && (l[2] ?? '').startsWith('projects/'));
 }
 
 /** Todo lo que el flujo deja escrito o impreso, en un texto, para buscar fugas. */
@@ -192,9 +198,11 @@ for (const [forma, origen] of [
           accion: 'abierto',
         });
         assertContexto(dbl, 'https://git.empresa.com', 'acme/sub/repo');
-        const [crear] = dbl.llamadasDe('mr', 'create');
-        assert.ok(crear?.includes('--target-branch=develop'));
-        assert.ok(crear?.includes(`--source-branch=${e.task.rama}`));
+        const [crear] = creaciones(dbl);
+        assert.ok(crear?.includes('--method=POST'));
+        assert.ok(crear?.includes('--raw-field=target_branch=develop'));
+        assert.ok(crear?.includes(`--raw-field=source_branch=${e.task.rama}`));
+        assert.ok(crear?.some((a) => a.startsWith('--raw-field=title=') && a.includes(ID)));
         assert.equal(dbl.llamadasDe('auth', 'status').length, 0, 'la sesion se comprueba con api user, no con auth status');
       });
       assert.notEqual(ramaEnBare(e.origin.bare, e.task.rama), null, 'la rama se subio');
@@ -241,7 +249,7 @@ for (const [forma, origen, base] of [
           assert.equal(x.entorno['GITLAB_HOST'], BASE_SUB);
           if (x.llamada[1] === 'mr') assert.equal(x.repo, 'grupo/sub/repo');
         }
-        assert.equal(dbl.llamadasDe('mr', 'create').length, 1);
+        assert.equal(creaciones(dbl).length, 1);
         assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), 'develop');
       });
     });
@@ -435,7 +443,7 @@ test('instancia inalcanzable aborta antes de subir nada y la URL con credenciale
           return true;
         }
       );
-      assert.equal(dbl.llamadasDe('mr', 'create').length, 0);
+      assert.equal(creaciones(dbl).length, 0);
     });
     assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
   });
@@ -500,6 +508,75 @@ test('segundo finish con un commit local que no llego al MR aborta sin tocar nad
   });
 });
 
+// ---------------------------------------------------------------------------
+// Creacion por API (glab mr create no vale bajo una ruta)
+// ---------------------------------------------------------------------------
+
+test('el MR de una instancia bajo una ruta se crea por la API: glab mr create real falla ahi y el doble lo reproduce', async () => {
+  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      // Contraprueba: con el camino viejo (mr create + GITLAB_HOST con ruta) el doble responde lo que glab real.
+      await conEntorno({ GITLAB_HOST: BASE_SUB }, async () => {
+        const r = spawnSync('glab', ['mr', 'create', '-R', 'grupo/sub/repo', '--target-branch=develop', '--source-branch=x', '--title=t', '--yes'], {
+          cwd: e.repoRoot,
+          encoding: 'utf8',
+          env: process.env,
+        });
+        assert.equal(r.status, 1);
+        assert.match(r.stderr, /None of the git remotes configured for this repository correspond to the GITLAB_HOST/);
+      });
+      dbl.escribir(SIN_PRS);
+      const url = await abrirMr(e);
+      assert.equal(url, 'https://servidor.example/ruta/gitlab/grupo/sub/repo/-/merge_requests/1');
+      assert.equal(dbl.llamadasDe('mr', 'create').length, 0);
+      assert.equal(creaciones(dbl).length, 1);
+    });
+  });
+});
+
+test('la creacion por API pasa un titulo con guion inicial y comillas como un solo argumento, sin interpretarlo como flag', async () => {
+  const raro = '-x --flag "entre comillas" y \'simples\'';
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await montarOrigin(repoRoot, ORIGEN_SUB_HTTPS);
+    try {
+      const task = sampleTask({ titulo: raro });
+      await setupTaskEnRevision(repoRoot, tareasRoot, task);
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), CFG_SUB, 'utf8');
+      commitAll(repoRoot, 'chore: config');
+      const e: Escenario = { repoRoot, tareasRoot, origin, task };
+      await conDoblePlataforma(SIN_PRS, async (dbl) => {
+        await abrirMr(e);
+        const [crear] = creaciones(dbl);
+        assert.ok(crear?.includes(`--raw-field=title=${ID}: ${raro}`), JSON.stringify(crear));
+        assert.equal(dbl.leer().prs[0]?.titulo, `${ID}: ${raro}`);
+      });
+    } finally {
+      await origin.limpiar();
+    }
+  });
+});
+
+test('si la creacion por API falla, la rama ya subida se dice y un reintento no duplica', async () => {
+  await escenario(ORIGEN_SUB_HTTPS, CFG_SUB, async (e) => {
+    await conDoblePlataforma({ ...SIN_PRS, crearFalla: true }, async (dbl) => {
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /ya esta subida a origin, pero "glab" no pudo crear el merge request/);
+      dbl.escribir({ prs: [] });
+      assert.equal((await abrirMr(e)).includes('/merge_requests/1'), true);
+    });
+  });
+});
+
+test('origin http con puerto y solo plataforma gitlab aborta antes de subir pidiendo url_base_remoto', async () => {
+  await escenario('http://servidor.example:8080/grupo/repo.git', 'plataforma_remota: gitlab\n', async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /origin es http con puerto.*glab solo habla https.*url_base_remoto/s);
+      assert.equal(dbl.leer().llamadas.length, 0);
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
+
 // ---------------------------------------------------------------------------
 // Clave desconocida: aviso por el CLI de verdad
 // ---------------------------------------------------------------------------
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
index 8b1cfa3..cdb3120 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
@@ -48,6 +48,8 @@ export interface PrDoble {
   url: string;
   base: string;
   head: string;
+  /** Titulo con el que se creo (lo apunta el doble al crear por API). */
+  titulo?: string | null;
   /** Commit resultante del merge (merge, squash o rebase); null = la plataforma no lo informa. */
   commit?: string | null;
   /** Punta de la rama que la plataforma integro (headRefOid / sha). */
@@ -111,6 +113,7 @@ const CODIGO_DOBLE = [
   '  }',
   "  const listar = (cli === 'gh' && args[0] === 'pr' && args[1] === 'list') || (cli === 'glab' && args[0] === 'mr' && args[1] === 'list');",
   "  const crear = (cli === 'gh' && args[0] === 'pr' && args[1] === 'create') || (cli === 'glab' && args[0] === 'mr' && args[1] === 'create');",
+  "  const crearApi = cli === 'glab' && args[0] === 'api' && /^projects\\//.test(args[1] || '') && args.includes('--method=POST');",
   '  if (listar) {',
   "    if (st.listarFalla) salir(1, '', 'error: Post \"https://usuario:secreto@github.com/graphql\": dial tcp: no network\\n');",
   "    const head = cli === 'gh' ? valor(args, 'head') : valor(args, 'source-branch');",
@@ -124,11 +127,21 @@ const CODIGO_DOBLE = [
   '    });',
   '    salir(0, JSON.stringify(lista) + "\\n", "");',
   '  }',
-  '  if (crear) {',
+  '  if (crear || crearApi) {',
   "    if (st.crearFalla) salir(1, '', 'GraphQL: could not create the pull request\\n');",
-  "    const head = cli === 'gh' ? valor(args, 'head') : valor(args, 'source-branch');",
-  "    const base = cli === 'gh' ? valor(args, 'base') : valor(args, 'target-branch');",
+  "    // glab real: mr create exige que un remoto de Git corresponda a GITLAB_HOST y compara solo el host,",
+  "    // asi que con una instancia bajo una ruta aborta siempre (glab 1.102.0, TASK-061). glab api no mira los remotos.",
+  "    if (cli === 'glab' && crear && e.GITLAB_HOST && /^https?:\\/\\/[^/]+\\/./.test(e.GITLAB_HOST)) salir(1, '', 'ERROR None of the git remotes configured for this repository correspond to the GITLAB_HOST environment variable. Try setting a remote\\n');",
+  "    const head = cli === 'gh' ? valor(args, 'head') : crearApi ? valor(args, 'raw-field=source_branch') : valor(args, 'source-branch');",
+  "    const base = cli === 'gh' ? valor(args, 'base') : crearApi ? valor(args, 'raw-field=target_branch') : valor(args, 'target-branch');",
+  "    const titulo = crearApi ? valor(args, 'raw-field=title') : (valor(args, 'title') || null);",
   '    const n = st.prs.length + 1;',
+  "    if (crearApi) {",
+  "      const urlApi = (e.GITLAB_HOST || 'https://gitlab.example.com') + '/' + decodeURIComponent(args[1].split('/')[1]) + '/-/merge_requests/' + n;",
+  "      st.prs.push({ estado: 'abierto', url: urlApi, base: base, head: head, commit: null, titulo: titulo });",
+  '      guardar();',
+  "      salir(0, JSON.stringify({ iid: n, web_url: urlApi, state: 'opened', source_branch: head, target_branch: base }) + '\\n', '');",
+  '    }',
   "    const r = args.indexOf('-R');",
   "    const url = cli === 'gh' ? 'https://github.com/acme/repo/pull/' + n : (e.GITLAB_HOST && r >= 0 ? e.GITLAB_HOST + '/' + args[r + 1] : 'https://gitlab.example.com/acme/repo') + '/-/merge_requests/' + n;",
   "    st.prs.push({ estado: 'abierto', url: url, base: base, head: head, commit: null });",
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff c07cd91199ebc87aa668176fc5fc913ea5a905a7..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-061/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-061/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-061/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-061/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-061/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-061/planificacion/evidencia-glab-subpath.md                        |   21 +
 tareas/{02-en-curso => 03-en-revision}/TASK-061/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-061/revision/informe-revision-1.md                                                  |  100 ++++
 tareas/03-en-revision/TASK-061/revision/peticion-revision-1.md                                                 | 2130 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-061/tarea.md                                                       |    7 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-opciones.js                              |    4 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plataforma-remota.js                                |    8 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/merge-request.js                                      |   44 +-
 13 files changed, 2306 insertions(+), 8 deletions(-)
````
