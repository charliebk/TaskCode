# Peticion de revision — TASK-167b (ronda 2)

- Tarea: TASK-167b — detector de duplicados por cuerpo en el diff (parte b de TASK-167)
- Rama revisada: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
- Rama base: develop
- Commit revisado (HEAD): 09ddcf327b6311781c53b6aa2682907c993d9387
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-167b (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde e3f53d539da82c9cb5217bc7878aee9b609fca8e (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (5 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (tu
tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale. Si esta peticion
   ya trae la verificacion de la ronda en verde para ese mismo commit, no la
   repitas: cita ese resultado y corre solo los tests de lo que verificas.
3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo
   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que
   lo rompe antes de reportarlo.

Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion
(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como
nota al final del informe, no en la tabla: no abre otra ronda.

Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. En la tabla, cada hallazgo pendiente que ya este
resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-167b/tarea.md
- tareas/03-en-revision/TASK-167b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:217 | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts:41 | informe-revision-1.md |

## Commits a revisar (git log e3f53d539da82c9cb5217bc7878aee9b609fca8e..HEAD)

````
09ddcf3 fix(TASK-167b): ronda 1 - cuerpo de Python y de definiciones sin llave, umbral protegido, un solo cat-file, loc y extension reutilizados
9cfcd58 fix(TASK-167b): el cuerpo de una definicion sin llave acaba en su linea con ; o , fuera de parentesis
b0f5636 chore(TASK-167b): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff e3f53d539da82c9cb5217bc7878aee9b609fca8e..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 661ecf3..25adc11 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -83,7 +83,6 @@ import {
   diffParaRevision,
   diffRangeForPaths,
   definicionesEnRef,
-  showFileAtRef,
   GitLaunchError,
   GitCommandError,
   statDeFicheros,
@@ -91,6 +90,8 @@ import {
   hayMergesEntre,
   baseDeTipoSinRed,
 } from '../fs/git.js';
+import { ficherosEnRef } from '../fs/git-crudo.js';
+import { extension } from '../core/cobertura-cambios.js';
 import {
   autoCommit,
   mensajeChore,
@@ -1382,14 +1383,12 @@ function verificacionDeRonda(
   return motivo !== null ? { tipo: 'documentacion', v, motivo } : { tipo: 'selectiva', v };
 }
 
-/** TASK-167b: ficheros de la rama base que se leen como mucho para comparar cuerpos. */
-const MAX_FICHEROS_CUERPO = 400;
-
 /**
  * TASK-167b: pares de definiciones nuevas del diff casi identicas por su
  * cuerpo a otra (de la rama base o nueva). Solo se leen ficheros de las
- * extensiones que trae el diff, una vez cada uno. Nunca lanza: si Git falla,
- * no hay pares (los candidatos por nombre siguen saliendo).
+ * extensiones que trae el diff, todos con un `git cat-file --batch` por ref.
+ * Nunca lanza: si Git falla, no hay pares (los candidatos por nombre siguen
+ * saliendo).
  */
 export function duplicadosDeRonda(
   baseBranch: string,
@@ -1400,36 +1399,20 @@ export function duplicadosDeRonda(
   try {
     const nuevas = definicionesNuevas(diffCodigo);
     if (nuevas.length === 0) return [];
-    const extension = (f: string): string => path.posix.extname(f).toLowerCase();
     const extensiones = new Set(nuevas.map((d) => extension(d.fichero)));
     const enBase = definicionesDeGrep(definicionesEnRef(baseBranch, cwd, excluir), baseBranch).filter((d) =>
       extensiones.has(extension(d.fichero))
     );
-    const permitidos = new Set([...new Set(enBase.map((d) => d.fichero))].slice(0, MAX_FICHEROS_CUERPO));
-    const lector = (ref: string): ((f: string) => string[] | null) => {
-      const cache = new Map<string, string[] | null>();
-      return (f) => {
-        if (!cache.has(f)) {
-          let lineas: string[] | null = null;
-          try {
-            lineas = showFileAtRef(ref, f, cwd).split(/\r?\n/);
-          } catch {
-            lineas = null;
-          }
-          cache.set(f, lineas);
-        }
-        return cache.get(f) ?? null;
-      };
-    };
-    const conCuerpo = (defs: readonly Definicion[], leer: (f: string) => string[] | null): DefinicionConCuerpo[] =>
-      defs.flatMap((def) => {
-        const lineas = leer(def.fichero);
-        return lineas === null ? [] : [{ def, cuerpo: cuerpoDesde(lineas, def.linea) }];
+    const conCuerpo = (defs: readonly Definicion[], ref: string): DefinicionConCuerpo[] => {
+      const contenidos = ficherosEnRef(ref, [...new Set(defs.map((d) => d.fichero))], cwd);
+      if (contenidos === null) return [];
+      const lineasDe = new Map([...contenidos].map(([f, t]) => [f, t.split(/\r?\n/)]));
+      return defs.flatMap((def) => {
+        const lineas = lineasDe.get(def.fichero);
+        return lineas === undefined ? [] : [{ def, cuerpo: cuerpoDesde(lineas, def.linea) }];
       });
-    return duplicadosPorCuerpo(
-      conCuerpo(nuevas, lector('HEAD')),
-      conCuerpo(enBase.filter((d) => permitidos.has(d.fichero)), lector(baseBranch))
-    );
+    };
+    return duplicadosPorCuerpo(conCuerpo(nuevas, 'HEAD'), conCuerpo(enBase, baseBranch));
   } catch {
     return [];
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
index c2e1eca..770f6d3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
@@ -273,7 +273,8 @@ export function candidatos4D(diffCodigo: string, diffTests: string, existentes:
   };
 }
 
-const loc = (d: Definicion): string => `\`${d.nombre}\` (${d.fichero}:${String(d.linea)})`;
+/** `nombre` (fichero:linea): como se cita una definicion en las listas 4D. */
+export const loc = (d: Definicion): string => `\`${d.nombre}\` (${d.fichero}:${String(d.linea)})`;
 
 function masAlla(mostrados: number, total: number, tope: number): string {
   return total > mostrados ? `- ... y ${String(total - mostrados)} mas (tope ${String(tope)})\n` : '';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts
index e203b8c..6258cb3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts
@@ -11,7 +11,7 @@
  * Puro: recibe lineas y definiciones y devuelve pares. Quien lee ficheros y
  * Git es `commands/review.ts`.
  */
-import type { Definicion } from './candidatos-4d.js';
+import { loc, type Definicion } from './candidatos-4d.js';
 import { sinComentariosC } from './doctor-deploy-reglas.js';
 
 /** Parecido minimo (Jaccard de tejas) para contar como duplicado. */
@@ -36,40 +36,61 @@ export interface DuplicadoPorCuerpo {
   parecido: number;
 }
 
+const sangriaDe = (l: string): number => /^\s*/.exec(l)?.[0].length ?? 0;
+
 /**
- * El cuerpo de la definicion que empieza en la linea `desde` (1-based): hasta
- * equilibrar las llaves si las hay; si la linea termina en `:` (Python), las
- * lineas siguientes con mas sangria. Como mucho MAX_LINEAS_CUERPO.
+ * El cuerpo de la definicion que empieza en la linea `desde` (1-based), como
+ * mucho MAX_LINEAS_CUERPO lineas:
+ * - con llaves, hasta equilibrarlas;
+ * - si la cabecera (la firma, aunque ocupe varias lineas) termina en `:`
+ *   (Python), las lineas siguientes con mas sangria;
+ * - sin llave, hasta la primera linea que termina en `;` o `,` fuera de
+ *   parentesis, o hasta la siguiente linea con la misma sangria o menos (la
+ *   siguiente definicion: `def f(a): return a`, una flecha sin `;`).
  */
 export function cuerpoDesde(lineas: readonly string[], desde: number): string {
   const i0 = desde - 1;
   const primera = lineas[i0];
   if (primera === undefined) return '';
-  if (/:\s*(#.*)?$/.test(primera) && !primera.includes('{')) {
-    const sangria = /^\s*/.exec(primera)?.[0].length ?? 0;
-    const salida = [primera];
-    for (let i = i0 + 1; i < lineas.length && salida.length < MAX_LINEAS_CUERPO; i++) {
-      const l = lineas[i] as string;
-      if (l.trim() !== '' && (/^\s*/.exec(l)?.[0].length ?? 0) <= sangria) break;
-      salida.push(l);
-    }
-    return salida.join('\n');
-  }
+  const base = sangriaDe(primera);
   let nivel = 0;
   let abierto = false;
+  let parentesis = 0;
   const salida: string[] = [];
   for (let i = i0; i < lineas.length && salida.length < MAX_LINEAS_CUERPO; i++) {
     const l = lineas[i] as string;
+    const fueraDeCabecera = !abierto && parentesis <= 0;
+    // Otra sentencia al mismo nivel: la definicion ya acabo (una `{` sola es su llave, estilo Allman).
+    if (i > i0 && fueraDeCabecera && l.trim() !== '' && sangriaDe(l) <= base && !l.trim().startsWith('{')) break;
     salida.push(l);
-    for (const c of sinCadenas(sinComentariosC(l))) {
+    // Las llaves y parentesis escapados (`/\{/` en una regex) no cuentan.
+    const limpia = sinCadenas(sinComentariosC(l)).replace(/\\[{}()[\]]/g, '');
+    for (const c of limpia) {
       if (c === '{') {
         nivel++;
         abierto = true;
       } else if (c === '}') {
         nivel--;
+      } else if (c === '(' || c === '[') {
+        parentesis++;
+      } else if (c === ')' || c === ']') {
+        parentesis--;
       }
     }
     if (abierto && nivel <= 0) break;
+    if (abierto || parentesis > 0) continue;
+    // Fin de una cabecera de Python: el cuerpo es lo que tiene mas sangria.
+    if (/:\s*(#.*)?$/.test(l)) {
+      for (let j = i + 1; j < lineas.length && salida.length < MAX_LINEAS_CUERPO; j++) {
+        const s = lineas[j] as string;
+        if (s.trim() !== '' && sangriaDe(s) <= base) break;
+        salida.push(s);
+      }
+      break;
+    }
+    // Sin llave y fuera de parentesis (no es una firma partida), `;` o `,` al
+    // final cierran la definicion (flecha o expresion de una linea).
+    if (/[;,]\s*$/.test(limpia)) break;
   }
   return salida.join('\n');
 }
@@ -149,7 +170,6 @@ export function duplicadosPorCuerpo(
 /** La lista para `## Candidatos 4D` y el aviso de `review`; '' sin pares. */
 export function seccionDuplicadosPorCuerpo(pares: readonly DuplicadoPorCuerpo[], max = 10): string {
   if (pares.length === 0) return '';
-  const loc = (d: Definicion): string => `\`${d.nombre}\` (${d.fichero}:${String(d.linea)})`;
   const resto = pares.length > max ? `- ... y ${String(pares.length - max)} mas\n` : '';
   return (
     '### Posible duplicacion por cuerpo\n\n' +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
index 28b7b18..ce998d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
@@ -73,6 +73,39 @@ export function gitOk(args: readonly string[], cwd: string): boolean {
   return gitLinea(args, cwd) !== null;
 }
 
+/**
+ * TASK-167b: el contenido de varios ficheros en `ref` con un solo `git cat-file
+ * --batch` (un proceso, no uno por fichero). Los que no existen en `ref` no
+ * salen en el mapa. null si git falla o su salida no se puede leer entera.
+ */
+export function ficherosEnRef(ref: string, rutas: readonly string[], cwd: string): Map<string, string> | null {
+  const salida = new Map<string, string>();
+  if (rutas.length === 0) return salida;
+  const r = gitCrudo(['cat-file', '--batch'], cwd, {
+    input: `${rutas.map((f) => `${ref}:${f}`).join('\n')}\n`,
+    maxBuffer: 512 * 1024 * 1024,
+  });
+  if (r.error !== undefined || r.status !== 0) return null;
+  // Formato: `<sha> <tipo> <tam>\n<contenido>\n`, o `<pedido> missing\n`.
+  const buf = r.stdout;
+  let pos = 0;
+  for (const ruta of rutas) {
+    const finLinea = buf.indexOf(0x0a, pos);
+    if (finLinea === -1) return null;
+    const cabecera = buf.toString('utf8', pos, finLinea);
+    const m = /^[0-9a-f]+ (\w+) (\d+)$/.exec(cabecera);
+    if (m === null) {
+      if (!cabecera.endsWith(' missing') && !cabecera.endsWith(' ambiguous')) return null;
+      pos = finLinea + 1;
+      continue;
+    }
+    const tam = Number(m[2]);
+    if (m[1] === 'blob') salida.set(ruta, buf.toString('utf8', finLinea + 1, finLinea + 1 + tam));
+    pos = finLinea + 1 + tam + 1;
+  }
+  return salida;
+}
+
 /**
  * TASK-149a (FS-08): ruta absoluta de `ruta` dentro del directorio de Git
  * (`git rev-parse --git-path`, por worktree), o null fuera de un repo.
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff e3f53d539da82c9cb5217bc7878aee9b609fca8e..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-167b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167b/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-167b/revision/informe-revision-1.md                                                  |  93 +++++++++++++++++
 tareas/03-en-revision/TASK-167b/revision/peticion-revision-1.md                                                 | 456 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-167b/tarea.md                                                       |  11 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                        |  43 +++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/candidatos-4d.js                                     |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/duplicados-cuerpo.js                                 |  70 ++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-crudo.js                                           |  37 +++++++
 15 files changed, 667 insertions(+), 46 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff e3f53d539da82c9cb5217bc7878aee9b609fca8e..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts | 30 ++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts     | 25 ++++++++++++++++++++++++-
 2 files changed, 54 insertions(+), 1 deletion(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

### Tests a mutar

Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).

- «TASK-167b: ficherosEnRef lee varios ficheros de un ref con un solo git; los que faltan no salen» (taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-crudo-comun.test.ts:114)


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 2429.1 s
- Commit verificado: 09ddcf327b6311781c53b6aa2682907c993d9387
- Huella: ecc70616353ebc7bd49ea7eb75db2f3aed2fe5a1
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 594616 bytes en total):

````
✔ 10g. la lectura de la tabla discrimina (contraprueba del 10f) (3.5488ms)
✔ 11. ninguna skill arrastra marcas de este repo ni rutas de maquina (10.7744ms)
✔ 11b. la marca generica de documento interno discrimina (contraprueba del menor 4) (0.4579ms)
✔ 12. CONTRAPRUEBA: rotas las cuatro, el validador las nombra a las cuatro (38752.7229ms)
✔ 13. el plugin entero, con las cuatro skills dentro, sigue validando (15905.337ms)
✔ 14. angular-vue revisa la accesibilidad por criterio, citando WCAG 2.2 (10.6281ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (62.1544ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (2.5187ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (2.9484ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (3.2845ms)
✔ 4. name presente, string y en kebab-case valido (2.7971ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (195.5618ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (89.5465ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (50.8638ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (42.3247ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (25.2143ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (117.8536ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (10.0827ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (5.4548ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (18.0246ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (14.3308ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (24.1557ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (36.1142ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (308.9156ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (10.721ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (44.7197ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (3.0427ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (18.4244ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (21985.9948ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (33189.3524ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (3.1805ms)
ℹ tests 1919
ℹ suites 0
ℹ pass 1916
ℹ fail 0
ℹ cancelled 0
ℹ skipped 3
ℹ todo 0
ℹ duration_ms 2405868.2888
[verificar-impacto] node --test termino con 0 en 2406.0 s.
````
