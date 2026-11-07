# Peticion de revision — TASK-087 (ronda 2)

- Tarea: TASK-087 — taskctl doctor avisa si el plugin instalado esta desactualizado
- Rama revisada: feature/task-087-taskctl-doctor-avisa-si-el-plugin-instal
- Rama base: develop
- Commit revisado (HEAD): 1eefd549b205f3f22ddb40d3ef069a6a0c1fadf1
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-087 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde a68f7812ac2e3d0bfbda69eeb38dcb26c7b7f708 (el commit revisado en la ronda anterior)

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
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts | informe-revision-1.md |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts | informe-revision-1.md |

## Commits a revisar (git log a68f7812ac2e3d0bfbda69eeb38dcb26c7b7f708..HEAD)

````
1eefd54 fix(TASK-087): correcciones de la ronda 1 (MEN-1, MEN-2)
783c0c1 chore(TASK-087): veredicto ronda 1 (cambios-solicitados)
a83e1a2 chore(TASK-087): coste revision +625757 tokens (1 agente)
606ed31 docs(TASK-087): informe de revision ronda 1
6cc3544 chore(TASK-087): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff a68f7812ac2e3d0bfbda69eeb38dcb26c7b7f708..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts
index 8189a89..4129896 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts
@@ -65,19 +65,29 @@ function sondear(configDir: string, repoCwd: string, nombrePlugin: string): Sond
   const plugins = instalados['plugins'];
   if (!esObjeto(plugins)) return noComprobable(`la lista de plugins instalados no tiene "plugins" (${rutaInstalados})`);
   const prefijo = `${nombrePlugin}@`;
-  let marketplace: string | null = null;
-  let instalada: unknown;
+  // Puede estar instalado desde varios marketplaces: vale el primero que se
+  // pueda comparar; si ninguno, se dicen los motivos de todos (revision ronda 1, MEN-2).
+  const motivos: string[] = [];
   for (const [clave, entradas] of Object.entries(plugins)) {
     if (!clave.startsWith(prefijo)) continue;
     const e = entradaQueAplica(entradas, repoCwd);
     if (e === undefined) continue;
-    marketplace = clave.slice(prefijo.length);
-    instalada = e['version'];
-    break;
+    const s = compararConMarketplace(dirPlugins, clave.slice(prefijo.length), e['version'], nombrePlugin);
+    if (s.estado === 'comparable') return s;
+    motivos.push(s.motivo);
   }
-  if (marketplace === null) return noComprobable(`${nombrePlugin} no esta instalado como plugin de Claude Code para este proyecto`);
+  if (motivos.length === 0) return noComprobable(`${nombrePlugin} no esta instalado como plugin de Claude Code para este proyecto`);
+  return noComprobable(motivos.join('; '));
+}
+
+function compararConMarketplace(
+  dirPlugins: string,
+  marketplace: string,
+  instalada: unknown,
+  nombrePlugin: string
+): SondeoVersionPlugin {
   if (typeof instalada !== 'string' || !esVersionSemver(instalada)) {
-    return noComprobable(`la version instalada no es semver (${String(instalada)})`);
+    return noComprobable(`la version instalada desde ${marketplace} no es semver (${String(instalada)})`);
   }
 
   // 2. La copia local del marketplace.
@@ -102,15 +112,21 @@ function sondear(configDir: string, repoCwd: string, nombrePlugin: string): Sond
   let disponible: unknown = entrada['version'];
   let rutaDisponible = rutaMarketplace;
   const fuente = entrada['source'];
+  let problemaManifiesto = '';
   if (typeof fuente === 'string' && fuente.startsWith('.')) {
     const rutaManifiesto = path.join(dirMarketplace, fuente, '.claude-plugin', 'plugin.json');
     const l = leerJson(rutaManifiesto);
     if (l.estado === 'ok' && esObjeto(l.json) && typeof l.json['version'] === 'string') {
       disponible = l.json['version'];
       rutaDisponible = rutaManifiesto;
+    } else if (l.estado === 'ilegible') {
+      // Si el catalogo trae version, se usa; si no, el motivo nombra este fichero (revision ronda 1, MEN-1).
+      problemaManifiesto = `; ${rutaManifiesto} ilegible: ${l.motivo}`;
     }
   }
-  if (typeof disponible !== 'string') return noComprobable(`la copia local del marketplace no declara version (${rutaDisponible})`);
+  if (typeof disponible !== 'string') {
+    return noComprobable(`la copia local del marketplace ${marketplace} no declara version (${rutaDisponible}${problemaManifiesto})`);
+  }
   if (!esVersionSemver(disponible)) return noComprobable(`la version disponible no es semver (${disponible})`);
 
   return { estado: 'comparable', instalada, disponible, marketplace, rutaDisponible, marketplaceActualizadoEn: actualizadoEn };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-version-plugin.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-version-plugin.test.ts
index e92c88f..dd99bea 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-version-plugin.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-version-plugin.test.ts
@@ -156,7 +156,7 @@ test('no-comprobable con su motivo: sin config, sin el plugin, sin copia, JSON r
   });
   await conConfig(async (config) => {
     await montar(config, { instalada: '0412be76f50a' });
-    assert.match(motivo(config), /instalada no es semver/);
+    assert.match(motivo(config), /instalada desde mkt no es semver/);
   });
   await conConfig(async (config) => {
     await montar(config, { catalogo: 'latest' });
@@ -167,3 +167,39 @@ test('no-comprobable con su motivo: sin config, sin el plugin, sin copia, JSON r
     assert.match(motivo(config), /no declara version/);
   });
 });
+
+test('plugin.json de la fuente relativa roto y catalogo sin version: el motivo nombra el plugin.json (revision ronda 1, MEN-1)', async () => {
+  await conConfig(async (config) => {
+    const copia = await montar(config, { catalogo: 7, manifiesto: '0.1.0' });
+    const roto = path.join(copia, 'plugins', 'taskcode-plugin', '.claude-plugin', 'plugin.json');
+    await writeFile(roto, '{ roto', 'utf8');
+    const s = sondearVersionPlugin(config, REPO);
+    assert.equal(s.estado, 'no-comprobable');
+    const m = s.estado === 'no-comprobable' ? s.motivo : '';
+    assert.ok(m.includes(`${roto} ilegible`), m);
+  });
+  await conConfig(async (config) => {
+    // Con version en el catalogo, el plugin.json roto no impide comparar.
+    const copia = await montar(config, { catalogo: '0.13.0', manifiesto: '0.1.0' });
+    await writeFile(path.join(copia, 'plugins', 'taskcode-plugin', '.claude-plugin', 'plugin.json'), '{ roto', 'utf8');
+    const s = sondearVersionPlugin(config, REPO);
+    assert.equal(s.estado === 'comparable' && s.disponible, '0.13.0');
+  });
+});
+
+test('instalado desde varios marketplaces: vale el primero comparable; si ninguno, todos los motivos (revision ronda 1, MEN-2)', async () => {
+  await conConfig(async (config) => {
+    await montar(config);
+    const ruta = path.join(config, 'plugins', 'installed_plugins.json');
+    const usuario = (v: string) => [{ scope: 'user', installPath: path.join(config, 'x'), version: v }];
+    // `otro` va primero y no tiene copia local; `mkt` si.
+    await escribirJson(ruta, { version: 2, plugins: { 'taskcode-plugin@otro': usuario('0.8.0'), 'taskcode-plugin@mkt': usuario('0.8.0') } });
+    const s = sondearVersionPlugin(config, REPO);
+    assert.equal(s.estado === 'comparable' && s.marketplace, 'mkt', JSON.stringify(s));
+    await escribirJson(ruta, { version: 2, plugins: { 'taskcode-plugin@otro': usuario('0.8.0'), 'taskcode-plugin@tercero': usuario('abc') } });
+    const n = sondearVersionPlugin(config, REPO);
+    assert.equal(n.estado, 'no-comprobable');
+    const m = n.estado === 'no-comprobable' ? n.motivo : '';
+    assert.match(m, /marketplace otro.*; .*instalada desde tercero no es semver/);
+  });
+});
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff a68f7812ac2e3d0bfbda69eeb38dcb26c7b7f708..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-087/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-087/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-087/revision/informe-revision-1.md                               |  48 ++++++
 tareas/03-en-revision/TASK-087/revision/peticion-revision-1.md                              | 830 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-087/tarea.md                                    |   6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sonda-version-plugin.js            |  29 ++--
 6 files changed, 902 insertions(+), 11 deletions(-)
````
