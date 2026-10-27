# Peticion de revision — TASK-066 (ronda 3)

- Tarea: TASK-066 — Doctor-deploy A: catalogo generico y comprobaciones deterministas
- Rama revisada: feature/task-066-doctor-deploy-a-catalogo-generico-y-comp
- Rama base: develop
- Commit revisado (HEAD): 630e9eb188ba82b3d9ed6548122a33dcef0b47c4
- Fecha: 2026-10-27
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-066 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde feea4ef2ddba7e21057c94766a074b992360ac4b (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-3.md), sin borrar la
peticion.

## Hallazgos de la ronda 2 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-7 | IMPORTANTE | abierto | test/commands/doctor-deploy.test.ts (buscarSilencio: rama `else if (s.commit !== null) continue` sin test) | informe-revision-2.md |
| MEN-4 | MENOR | abierto | src/fs/sondas-deploy.ts (requirements.txt corregido; siguen los falsos FALLA de monorepo y Go sin dependencias) | informe-revision-2.md |
| MEN-9 | MENOR | abierto | src/core/secretos.ts huellaDe + README:633 (la huella permite confirmar contrasenas debiles) | informe-revision-2.md |
| MEN-10 | MENOR | abierto | src/core/doctor-deploy-catalogo.ts:~504 (huella sola aceptada para un hallazgo del historial que nunca casara) | informe-revision-2.md |
| MEN-11 | MENOR | abierto | src/fs/sondas-deploy.ts (M12 y M13 sobreviven) | informe-revision-2.md |

## Commits a revisar (git log feea4ef2ddba7e21057c94766a074b992360ac4b..HEAD)

````
630e9eb chore(TASK-066): coste implementacion +3682871 tokens (1 agente)
8ab4ebd fix(TASK-066): ronda 2 de revision (IMP-7, MEN-4, MEN-9, MEN-10, MEN-11)
42a204c chore(TASK-066): veredicto ronda 2 (cambios-solicitados)
2228169 chore(TASK-066): coste revision +6671552 tokens (1 agente)
6d6a308 docs(TASK-066): informe de revision 2
0178d59 chore(TASK-066): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff feea4ef2ddba7e21057c94766a074b992360ac4b..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index fb600f8..a0bb0e8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -630,7 +630,11 @@ punto_1_descripcion: Los logs no llevan datos personales de clientes
 # patron: el que informa el punto (stripe-live, aws-access-key, fichero-secreto...).
 # Un silencio es POR HALLAZGO: un hallazgo del historial se silencia con su commit
 # (silenciar_N_commit); uno del árbol, con la huella de su valor (silenciar_N_huella),
-# que sale en la evidencia ("huella ab12cd34ef56") y no revela la clave. Sin commit ni
+# que sale en la evidencia ("huella ab12cd34ef56"). La huella es un SHA-256 sin sal: solo
+# es segura para claves de alta entropia (no permite recuperarlas). Para
+# url-con-credenciales no se muestra (usuario y host son conocidos y la contrasena puede ser
+# debil): esa se silencia solo en el historial, con commit; en el arbol hay que quitar la
+# credencial. Sin commit ni
 # huella aborta (taparía también claves nuevas del mismo fichero); la huella es opcional
 # con commit. Si commit o huella son solo dígitos, ponlos entre comillas.
 silenciar_1_patron: stripe-live
@@ -655,7 +659,14 @@ blobs, sea cual sea su ruta. Un fichero UTF-16 con BOM se decodifica; los binari
 saltados se cuentan siempre. Un fichero de texto mayor de 1 MiB no se lee y deja el
 punto en NO VERIFICADO (un binario grande, no). Un `requirements.txt` solo cuenta
 como lockfile si fija todo con `==`, y una regla negada (`!.env`) en el `.gitignore`
-es FALLA.
+es FALLA. `.env` tiene que quedar ignorado en la raíz de cada proyecto detectado (en un
+monorepo, un `.gitignore` en el subdirectorio vale para su propio `.env`), y un módulo
+Go sin bloque `require` no necesita `go.sum`.
+
+Límites conocidos: si `git cat-file --batch` devolviera una salida truncada, el historial
+sale NO VERIFICADO (no se pudo provocar con Git real, así que esa rama no tiene test); un
+silencio solo con huella no tapa nunca un hallazgo del historial, y si el patrón y el
+fichero tienen uno el comando avisa de que exige `silenciar_N_commit`.
 
 `taskctl metricas [--heuristica]` (solo lectura) saca una fila por tarea
 con la duración de calendario de cada fase (diseño = plan→start, curso =
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
index d4f5211..b7b8a5f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
@@ -234,6 +234,7 @@ export function runDoctorDeployCommand(argv: readonly string[], deps: DoctorDepl
     versionados: archivos.versionados,
     versionadosTodos: archivos.versionadosTodos,
     paraEscanear: archivos.paraEscanear,
+    hallazgosHistorial: [],
     tipos,
     silencios: catalogo.silencios,
     silenciosUsados: new Set<number>(),
@@ -255,6 +256,13 @@ export function runDoctorDeployCommand(argv: readonly string[], deps: DoctorDepl
   }
   for (const s of catalogo.silencios) {
     if (!ctx.silenciosUsados.has(s.numero)) {
+      if (s.commit === null && ctx.hallazgosHistorial.some((h) => h.patron === s.patron && h.fichero === s.fichero)) {
+        avisos.push(
+          `silenciar_${s.numero} (patron ${s.patron}, fichero ${s.fichero}) es un silencio de arbol (sin commit), pero ese patron y fichero ` +
+            `tienen un hallazgo en el historial: un hallazgo del historial exige silenciar_${s.numero}_commit.`
+        );
+        continue;
+      }
       avisos.push(
         `silenciar_${s.numero} (patron ${s.patron}, fichero ${s.fichero}) no coincide con ningun hallazgo: ` +
           'ya no hace falta, o el patron o la ruta no son los que informa el punto.'
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
index e4dc769..f1bab2b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
@@ -29,9 +29,11 @@ export interface HallazgoSecreto {
   muestra: string;
   /**
    * Huella estable del valor (12 hex de su SHA-256): identifica el hallazgo para
-   * silenciarlo sin revelar el valor. No se puede invertir en una clave real.
+   * silenciarlo sin revelar el valor. Solo es segura para claves de alta entropia; para
+   * `url-con-credenciales` (usuario y host conocidos, contrasena a menudo debil) un
+   * diccionario la confirmaria, asi que ahi es null y no se muestra.
    */
-  huella: string;
+  huella: string | null;
 }
 
 interface Clasificacion {
@@ -159,7 +161,7 @@ export function buscarSecretos(texto: string): HallazgoSecreto[] {
       if (c === null) continue;
       encontrados.push({
         indice: m.index,
-        h: { patron: c.patron ?? p.id, clase: c.clase, muestra: enmascarar(m[0]), huella: huellaDe(m[0]) },
+        h: { patron: c.patron ?? p.id, clase: c.clase, muestra: enmascarar(m[0]), huella: (c.patron ?? p.id) === 'url-con-credenciales' ? null : huellaDe(m[0]) },
       });
     }
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
index 7e5d11f..96cb1db 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
@@ -59,6 +59,8 @@ export interface ContextoDeploy {
   versionadosTodos: string[];
   /** Lo que se escanea en busca de claves (ver ArchivosProyecto). */
   paraEscanear: string[];
+  /** Hallazgos del historial (patron + fichero), silenciados o no: lo rellena la sonda del historial. */
+  hallazgosHistorial: Array<{ patron: string; fichero: string }>;
   tipos: TipoDetectado[];
   silencios: Silencio[];
   /** `numero` de los silencios que taparon algun hallazgo. */
@@ -114,6 +116,13 @@ interface ClaveHallazgo {
   huella?: string;
 }
 
+function claveDe(commit: string | undefined, huella: string | null): ClaveHallazgo {
+  const c: ClaveHallazgo = {};
+  if (commit !== undefined) c.commit = commit;
+  if (huella !== null) c.huella = huella;
+  return c;
+}
+
 /**
  * Un silencio es POR HALLAZGO: un hallazgo del historial exige un silencio con
  * `commit`; uno del arbol, un silencio sin commit y atado a la huella del valor
@@ -202,12 +211,12 @@ export const sondaSecretosArbol: Sonda = (ctx) => {
       if (h.clase === 'publica') publicas++;
       else if (h.clase === 'ejemplo') ejemplos++;
       else {
-        const s = buscarSilencio(ctx, h.patron, rel, { huella: h.huella });
+        const s = buscarSilencio(ctx, h.patron, rel, claveDe(undefined, h.huella));
         if (s !== null) {
           silenciadas.push(evidenciaSilenciada(s, h.patron, rel, h.linea, undefined));
         } else if (fallos.length < MAX_HALLAZGOS) {
           fallos.push({
-            descripcion: `clave secreta (patron ${h.patron}, huella ${h.huella})`,
+            descripcion: `clave secreta (patron ${h.patron}${h.huella === null ? '' : `, huella ${h.huella}`})`,
             fichero: rel,
             linea: h.linea,
             muestra: h.muestra,
@@ -319,8 +328,9 @@ export const sondaFicherosSecretos: Sonda = (ctx) => {
 // gitignore-env
 // ---------------------------------------------------------------------
 
-export const sondaGitignoreEnv: Sonda = (ctx) => {
-  const r = gitCrudo(['check-ignore', '-v', '--no-index', '.env'], ctx.cwd, { timeoutMs: 15_000 });
+function gitignoreDeDir(ctx: ContextoDeploy, dir: string): ResultadoSonda {
+  const envRel = unir(dir, '.env');
+  const r = gitCrudo(['check-ignore', '-v', '--no-index', envRel], ctx.cwd, { timeoutMs: 15_000 });
   if (r.error !== undefined || (r.status !== 0 && r.status !== 1)) {
     return {
       estado: 'no-verificado',
@@ -331,8 +341,8 @@ export const sondaGitignoreEnv: Sonda = (ctx) => {
   if (r.status === 1) {
     return {
       estado: 'falla',
-      motivo: 'el .gitignore no cubre .env',
-      evidencias: [{ descripcion: 'git check-ignore --no-index .env: ninguna regla lo ignora', fichero: '.gitignore' }],
+      motivo: `el .gitignore no cubre ${envRel}`,
+      evidencias: [{ descripcion: `git check-ignore --no-index ${envRel}: ninguna regla lo ignora`, fichero: '.gitignore' }],
     };
   }
   // Salida: `<fuente>:<linea>:<patron>\t<ruta>`. Solo vale una regla que viaja con el repo.
@@ -373,9 +383,33 @@ export const sondaGitignoreEnv: Sonda = (ctx) => {
     estado: 'ok',
     motivo: '.env esta cubierto por el .gitignore',
     evidencias: [
-      { descripcion: `la regla "${m?.[3] ?? ''}" ignora .env (git check-ignore -v --no-index .env)`, fichero: fuente, linea: Number(m?.[2]) },
+      { descripcion: `la regla "${m?.[3] ?? ''}" ignora ${envRel} (git check-ignore -v --no-index ${envRel})`, fichero: fuente, linea: Number(m?.[2]) },
     ],
   };
+}
+
+/**
+ * `.env` tiene que quedar ignorado en la raiz de cada proyecto detectado (en un monorepo, en cada
+ * carpeta con su marcador; un .gitignore anidado vale para su propio .env). Sin tipos, en la raiz.
+ */
+export const sondaGitignoreEnv: Sonda = (ctx) => {
+  const dirs = [...new Set(ctx.tipos.flatMap((t) => t.rutas))].sort().slice(0, 10);
+  const rs = (dirs.length > 0 ? dirs : ['.']).map((d) => gitignoreDeDir(ctx, d));
+  const malos = rs.filter((r) => r.estado === 'falla');
+  if (malos.length > 0) {
+    return {
+      estado: 'falla',
+      motivo: (malos[0] as ResultadoSonda).motivo + (malos.length > 1 ? ` (y en ${malos.length - 1} carpeta(s) mas)` : ''),
+      evidencias: malos.flatMap((r) => r.evidencias),
+    };
+  }
+  const sinVerificar = rs.find((r) => r.estado !== 'ok');
+  if (sinVerificar !== undefined) return sinVerificar;
+  return {
+    estado: 'ok',
+    motivo: rs.length === 1 ? (rs[0] as ResultadoSonda).motivo : `.env esta cubierto por un .gitignore en las ${rs.length} carpetas de proyecto`,
+    evidencias: rs.flatMap((r) => r.evidencias),
+  };
 };
 
 // ---------------------------------------------------------------------
@@ -403,6 +437,15 @@ function carpetaYAncestros(dir: string): string[] {
 
 const unir = (dir: string, nombre: string): string => (dir === '.' ? nombre : `${dir}/${nombre}`);
 
+/** true si el go.mod declara dependencias (`require`); false si no hay ninguna o no se puede leer el modulo sin ellas. */
+function moduloGoConDependencias(rutaGoMod: string): boolean {
+  try {
+    return /^\s*require\b/m.test(readFileSync(rutaGoMod, 'utf8'));
+  } catch {
+    return true; // no se puede leer: se exige el lockfile, que es lo seguro
+  }
+}
+
 /** Un requirements.txt solo hace de lockfile si fija TODAS sus dependencias con `==` (o `@` a una URL). */
 export function requirementsFijado(contenido: string): boolean {
   const lineas = contenido
@@ -423,6 +466,10 @@ export const sondaLockfile: Sonda = (ctx) => {
     if (candidatos === undefined) continue;
     for (const dir of tipo.rutas) {
       revisados++;
+      if (tipo.id === 'go' && !moduloGoConDependencias(path.join(ctx.cwd, dir, 'go.mod'))) {
+        ok.push({ descripcion: `${tipo.nombre} en ${dir}: go.mod sin bloque require (sin dependencias): no hay go.sum que versionar`, fichero: unir(dir, 'go.mod') });
+        continue;
+      }
       const donde = carpetaYAncestros(dir);
       const hallado = donde
         .flatMap((d) => candidatos.map((c) => unir(d, c)))
@@ -467,7 +514,7 @@ interface HallazgoHistorial {
   patron: string;
   linea: number;
   muestra: string;
-  huella: string;
+  huella: string | null;
 }
 
 const BYTES_POR_LOTE = 32 * 1024 * 1024;
@@ -718,13 +765,14 @@ export const sondaSecretosHistorial: Sonda = (ctx) => {
         : todas.slice(0, MAX_APARICIONES_POR_BLOB);
     const sinCitar = todas === null ? 0 : Math.max(0, todas.length - citadas.length);
     for (const ap of citadas) {
-      const s = ap.commit === undefined ? null : buscarSilencio(ctx, h.patron, ap.ruta, { commit: ap.commit, huella: h.huella });
+      const s = ap.commit === undefined ? null : buscarSilencio(ctx, h.patron, ap.ruta, claveDe(ap.commit, h.huella));
+      ctx.hallazgosHistorial.push({ patron: h.patron, fichero: ap.ruta });
       if (s !== null) {
         silenciadas.push(evidenciaSilenciada(s, h.patron, ap.ruta, h.linea, ap.commit));
         continue;
       }
       const e: Evidencia = {
-        descripcion: `clave secreta en el historial (patron ${h.patron}, huella ${h.huella})`,
+        descripcion: `clave secreta en el historial (patron ${h.patron}${h.huella === null ? '' : `, huella ${h.huella}`})`,
         fichero: ap.ruta,
         linea: h.linea,
         muestra: h.muestra,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
index 792a8ab..60d1aa3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
@@ -1055,3 +1055,116 @@ test('MEN-5: si no se puede escribir el informe, el analisis se imprime igualmen
     assert.equal(r.codigo, 0);
   });
 });
+
+// ---------------------------------------------------------------------
+// Revision por pares, ronda 2 (IMP-7, MEN-4, MEN-9, MEN-10, MEN-11)
+// ---------------------------------------------------------------------
+
+test('IMP-7: un silencio con commit (sin huella) no tapa una clave NUEVA del mismo patron en el arbol, en el mismo fichero', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, { 'config/prod.env.js': `k="${STRIPE}"\n` });
+    const hash = await commit(raiz, 'k1');
+    git(['rm', '-q', 'config/prod.env.js'], raiz);
+    await commit(raiz, 'quita k1');
+    await escribir(raiz, {
+      'config/prod.env.js': 'k="sk_live_Nueva0Clave1Dist"\n',
+      '.taskcode/doctor-deploy.yml': `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: config/prod.env.js\nsilenciar_1_commit: "${hash}"\nsilenciar_1_motivo: K1 rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`,
+    });
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    // El historial queda silenciado por su commit...
+    assert.equal(punto(informe, 'secretos-en-historial').estado, 'ok');
+    // ...pero la clave nueva, del arbol, no.
+    const arbol = punto(informe, 'secretos-en-arbol');
+    assert.equal(arbol.estado, 'falla');
+    assert.equal(arbol.evidencias[0]?.fichero, 'config/prod.env.js');
+  });
+});
+
+test('MEN-4: monorepo con el .gitignore solo en el subdirectorio que tiene su .env: OK; sin el, FALLA nombrando esa carpeta', async () => {
+  const web = {
+    'apps/web/package.json': '{}\n',
+    'apps/web/package-lock.json': '{}\n',
+    'README.md': '# monorepo\n',
+  };
+  await conRepo({ ...web, 'apps/web/.gitignore': '.env\n' }, async (raiz, opciones) => {
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    const p = punto(informe, 'gitignore-cubre-env');
+    assert.equal(p.estado, 'ok', p.motivo);
+    assert.equal(p.evidencias[0]?.fichero, 'apps/web/.gitignore');
+  });
+  await conRepo(web, async (raiz, opciones) => {
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'gitignore-cubre-env');
+    assert.equal(p.estado, 'falla');
+    assert.match(p.motivo, /apps\/web\/\.env/);
+  });
+});
+
+test('MEN-4: un modulo Go sin bloque require no necesita go.sum; con dependencias y sin go.sum, FALLA', async () => {
+  await conRepo({ 'go.mod': 'module ejemplo.com/x\n\ngo 1.22\n', '.gitignore': '.env\n' }, async (raiz, opciones) => {
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'lockfile-versionado');
+    assert.equal(p.estado, 'ok');
+    assert.match(p.evidencias[0]?.descripcion ?? '', /sin bloque require/);
+  });
+  await conRepo({ 'go.mod': 'module ejemplo.com/x\n\ngo 1.22\n\nrequire github.com/a/b v1.0.0\n', '.gitignore': '.env\n' }, async (raiz, opciones) => {
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'lockfile-versionado');
+    assert.equal(p.estado, 'falla');
+    assert.match(p.evidencias[0]?.descripcion ?? '', /go\.sum/);
+  });
+});
+
+test('MEN-9: una URL con credenciales se detecta pero no muestra huella (no se puede confirmar la contrasena con un diccionario)', async () => {
+  const url = 'postgres://admin:Hunter2pass@db.prod.acme.io/app';
+  await conRepo({ ...NODE, 'src/db.js': `const u = "${url}";\n` }, async (raiz, opciones) => {
+    const r = ejecutar(raiz, opciones);
+    const informe = JSON.parse(r.salida) as InformeDeploy;
+    for (const id of ['secretos-en-arbol', 'secretos-en-historial']) {
+      const p = punto(informe, id);
+      assert.equal(p.estado, 'falla', id);
+      assert.match(p.evidencias[0]?.descripcion ?? '', /url-con-credenciales/);
+      assert.doesNotMatch(p.evidencias[0]?.descripcion ?? '', /huella/, id);
+    }
+    assert.ok(!r.salida.includes('Hunter2pass'));
+    // En el historial si se puede silenciar: por fichero + patron + commit.
+    const hash = git(['rev-parse', 'HEAD'], raiz);
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml': `silenciar_1_patron: url-con-credenciales\nsilenciar_1_fichero: src/db.js\nsilenciar_1_commit: "${hash}"\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n`,
+    });
+    const con = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    assert.equal(punto(con, 'secretos-en-historial').estado, 'ok');
+    assert.equal(punto(con, 'secretos-en-arbol').estado, 'falla', 'en el arbol no hay forma segura de silenciarla: hay que quitar la credencial');
+  });
+});
+
+test('MEN-10: un silencio solo con huella para un patron y fichero con hallazgo en el historial avisa de que exige commit', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, { 'viejo.env': `K=${STRIPE}\n` });
+    git(['add', '-f', '.'], raiz);
+    await commit(raiz, 'env');
+    git(['rm', '-q', 'viejo.env'], raiz);
+    await commit(raiz, 'quita');
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml': 'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo.env\nsilenciar_1_huella: "abcdef012345"\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n',
+    });
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    assert.equal(punto(informe, 'secretos-en-historial').estado, 'falla');
+    assert.ok(informe.avisos.some((a) => /exige silenciar_1_commit/.test(a)), informe.avisos.join(' | '));
+  });
+});
+
+test('MEN-11: la ruta de un excludesFile global con barras invertidas se muestra limpia (sin comillas ni barras dobles)', async () => {
+  await conRepo({ ...NODE, '.gitignore': 'node_modules/\n' }, async (raiz, opciones) => {
+    const global = path.join(path.dirname(raiz), `${path.basename(raiz)}-global-ignore2`);
+    await writeFile(global, '.env\n', 'utf8');
+    try {
+      git(['config', 'core.excludesFile', global], raiz);
+      const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'gitignore-cubre-env');
+      assert.equal(p.estado, 'falla');
+      const d = p.evidencias[0]?.descripcion ?? '';
+      assert.ok(!d.includes('\\\\'), `barras dobles en la ruta mostrada: ${d}`);
+      assert.ok(!d.includes('""'), `comillas dobles en la ruta mostrada: ${d}`);
+      assert.ok(d.includes('-global-ignore2'));
+    } finally {
+      await rm(global, { force: true });
+    }
+  });
+});
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff feea4ef2ddba7e21057c94766a074b992360ac4b..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/03-en-revision/TASK-066/revision/informe-revision-2.md                   |   65 +++++++
 tareas/03-en-revision/TASK-066/revision/peticion-revision-2.md                  | 1185 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-066/tarea.md                                         |    7 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor-deploy.js |    6 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/secretos.js          |    2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-deploy.js       |   65 ++++++-
 6 files changed, 1318 insertions(+), 12 deletions(-)
````
