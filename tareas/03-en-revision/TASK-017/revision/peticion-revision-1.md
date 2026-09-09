# Peticion de revision — TASK-017 (ronda 1)

- Tarea: TASK-017 — Catálogo de skills determinista con selección en dos pasos
- Rama revisada: feature/task-017-catalogo-de-skills-determinista-con-sele
- Rama base: develop
- Commit revisado (HEAD): ffa36cff4c55298475c1725f60969199fc39786d
- Fecha: 2026-09-09
- Agente revisor sugerido: typescript-reviewer

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
ffa36cf feat(TASK-017): seleccion en dos pasos de skills en taskctl plan
1c656df chore(TASK-017): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-017/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md b/tareas/02-en-curso/TASK-017/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-017/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
rename to tareas/02-en-curso/TASK-017/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
diff --git a/tareas/01-en-diseno/TASK-017/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md b/tareas/02-en-curso/TASK-017/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-017/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
rename to tareas/02-en-curso/TASK-017/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
diff --git a/tareas/01-en-diseno/TASK-017/planificacion/brainstorm/peticion-brainstorm-testing-1.md b/tareas/02-en-curso/TASK-017/planificacion/brainstorm/peticion-brainstorm-testing-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-017/planificacion/brainstorm/peticion-brainstorm-testing-1.md
rename to tareas/02-en-curso/TASK-017/planificacion/brainstorm/peticion-brainstorm-testing-1.md
diff --git a/tareas/01-en-diseno/TASK-017/planificacion/brainstorm/peticion-unificador-1.md b/tareas/02-en-curso/TASK-017/planificacion/brainstorm/peticion-unificador-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-017/planificacion/brainstorm/peticion-unificador-1.md
rename to tareas/02-en-curso/TASK-017/planificacion/brainstorm/peticion-unificador-1.md
diff --git a/tareas/01-en-diseno/TASK-017/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md b/tareas/02-en-curso/TASK-017/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-017/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
rename to tareas/02-en-curso/TASK-017/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
diff --git a/tareas/01-en-diseno/TASK-017/planificacion/brainstorm/salida-brainstorm-riesgos-1.md b/tareas/02-en-curso/TASK-017/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-017/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
rename to tareas/02-en-curso/TASK-017/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
diff --git a/tareas/01-en-diseno/TASK-017/planificacion/brainstorm/salida-brainstorm-testing-1.md b/tareas/02-en-curso/TASK-017/planificacion/brainstorm/salida-brainstorm-testing-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-017/planificacion/brainstorm/salida-brainstorm-testing-1.md
rename to tareas/02-en-curso/TASK-017/planificacion/brainstorm/salida-brainstorm-testing-1.md
diff --git a/tareas/01-en-diseno/TASK-017/planificacion/plan-final.md b/tareas/02-en-curso/TASK-017/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-017/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-017/planificacion/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-017/tarea.md b/tareas/02-en-curso/TASK-017/tarea.md
similarity index 99%
rename from tareas/01-en-diseno/TASK-017/tarea.md
rename to tareas/02-en-curso/TASK-017/tarea.md
index fd9efe3..99981e2 100644
--- a/tareas/01-en-diseno/TASK-017/tarea.md
+++ b/tareas/02-en-curso/TASK-017/tarea.md
@@ -6,7 +6,7 @@ sprint: 3
 etiquetas: []
 complejidad: alta
 modelo_sugerido: opus
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-017-catalogo-de-skills-determinista-con-sele
 asignado_a: charlie.bk@gmail.com
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
index 0c5a2ab..0410005 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
@@ -10,6 +10,7 @@ import { runStartCommand, StartCommandError } from './commands/start.js';
 import { runPlanCommand, PlanCommandError } from './commands/plan.js';
 import { HeuristicaError } from './core/heuristica.js';
 import { RolesBrainstormError } from './core/roles-brainstorm.js';
+import { CatalogoSkillsError } from './core/catalogo-skills.js';
 import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
@@ -123,6 +124,33 @@ function asignacionNotice(result) {
         return '';
     return `Asignada a "${result.asignadoA}".\n`;
 }
+/**
+ * Resultado de la seleccion determinista de skill (seccion 6.6/16.4.1,
+ * TASK-017). Cuatro desenlaces posibles, no excluyentes entre "sin
+ * candidato"/"desempate pendiente" y "no instalada" (un ganador de una
+ * ronda anterior de desempate puede resultar externo y no instalado
+ * ahora mismo). Solo se anuncia el ganador cuando cambio respecto al
+ * valor previo: igual que brainstormNotice con la discrepancia, evita
+ * repetir en cada "plan" un resultado que ya se anuncio una vez.
+ */
+function seleccionSkillNotice(result) {
+    const lineas = [];
+    if (result.skillsRecomendadosCambiado && result.skillsRecomendados.length > 0) {
+        lineas.push(`Skill recomendado: "${result.skillsRecomendados[0]}" (regla: ${result.reglaSeleccionSkill}).`);
+    }
+    if (result.avisoSkillSinCandidato !== null) {
+        lineas.push(result.avisoSkillSinCandidato);
+    }
+    if (result.avisoSkillDesempatePendiente !== null) {
+        lineas.push(result.avisoSkillDesempatePendiente);
+    }
+    if (result.avisoSkillNoInstalada !== null) {
+        lineas.push(result.avisoSkillNoInstalada);
+    }
+    if (lineas.length === 0)
+        return '';
+    return lineas.join('\n') + '\n';
+}
 /**
  * Que ha dejado escrito el brainstorm (TASK-016). Se imprimen las
  * rutas porque son lo unico accionable: quien orquesta la sesion tiene
@@ -343,7 +371,8 @@ export async function main(argv) {
             }
             process.stdout.write(`Tarea ${result.id} en diseno: movida a ${result.filePath}. ${scaffoldMsg}\n` +
                 asignacionNotice(result) +
-                brainstormNotice(result));
+                brainstormNotice(result) +
+                seleccionSkillNotice(result));
             printAutoCommit(result.autoCommit);
             return 0;
         }
@@ -352,6 +381,7 @@ export async function main(argv) {
                 e instanceof ConfigError ||
                 e instanceof HeuristicaError ||
                 e instanceof RolesBrainstormError ||
+                e instanceof CatalogoSkillsError ||
                 e instanceof PlanCommandError ||
                 e instanceof StateMachineError ||
                 e instanceof TaskFolderConflictError ||
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js
index f7ff617..77cbcd3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js
@@ -118,6 +118,7 @@ export function buildNewTask(id, opts, today) {
         asignado_a: null,
         agente_revisor: opts.agenteRevisor,
         skills_recomendados: [],
+        regla_seleccion_skill: null,
         ultimo_commit_revisado: null,
         revision_codex: false,
         creado: today,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js
index 1cef8d3..abbb0bf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js
@@ -14,15 +14,16 @@
  * reparto que TASK-013 fijo para "taskctl review", y por el mismo
  * motivo — un CLI que llama a un agente no se puede probar sin uno.
  *
- * LO QUE SIGUE SIN HACER: contexto determinista desde docs/INDEX.md,
- * gatekeeper barato para la discrepancia de complejidad y seleccion de
- * skill (6.6, TASK-017).
+ * LO QUE SIGUE SIN HACER: contexto determinista desde docs/INDEX.md y
+ * gatekeeper barato para la discrepancia de complejidad. La seleccion
+ * determinista de skill (6.6/16.4.1, TASK-017) ya vive aqui, entre el
+ * calculo del brainstorm y la escritura del frontmatter.
  *
  * Aplica la precondicion de rama base de la seccion 8.3 desde TASK-012
  * (ensureBaseBranchReady, antes de mover nada).
  */
 import path from 'node:path';
-import { mkdir, readdir, rename, stat, writeFile } from 'node:fs/promises';
+import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
 import { parseArgs } from '../cli/args.js';
 import { parseAsignadoAFlag, identidadUsable, PISTA_VACIO_ESCRITURA, } from '../cli/asignado.js';
 import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir } from '../fs/task-store.js';
@@ -34,6 +35,9 @@ import { extraerSecciones } from '../core/tarea-body.js';
 import { cargarHeuristica, resolverNumeroAgentes, } from '../core/heuristica.js';
 import { seleccionarRoles, ROLES_BRAINSTORM, } from '../core/roles-brainstorm.js';
 import { nombrePeticionRol, nombreSalidaRol, nombrePeticionUnificador, peticionRolTemplate, salidaRolTemplate, peticionUnificadorTemplate, } from '../core/plan-brainstorm.js';
+import { cargarCatalogoSkills, seleccionarSkill, FICHERO_CATALOGO_SKILLS, } from '../core/catalogo-skills.js';
+import { PETICION_DESEMPATE_SKILL_FILENAME, SALIDA_DESEMPATE_SKILL_FILENAME, peticionDesempateSkillTemplate, salidaDesempateSkillTemplate, leerGanadorDesempate, } from '../core/plan-desempate-skill.js';
+import { comprobarSkillInstalado } from '../core/plugin-instalado.js';
 export class PlanCommandError extends Error {
 }
 export const PLAN_FINAL_FILENAME = 'plan-final.md';
@@ -260,12 +264,6 @@ export async function runPlanCommand(tareasRoot, argv, today, deps) {
     const { identidad, aviso: avisoIdentidad } = identidadUsable(gitUserEmail(deps.repoCwd));
     const asignadoFinal = resolverAsignado(asignadoA, task.asignado_a, identidad);
     const asignadoCambiado = asignadoFinal !== task.asignado_a;
-    const updated = {
-        ...task,
-        estado: 'en-diseno',
-        asignado_a: asignadoFinal,
-        actualizado: today,
-    };
     // --- Resolucion determinista del brainstorm (TASK-016) -------------
     // Va ANTES de cualquier escritura y de mover nada: todo lo que puede
     // abortar tiene que abortar con la tarea intacta.
@@ -385,6 +383,87 @@ export async function runPlanCommand(tareasRoot, argv, today, deps) {
             }
         }
     }
+    // --- Seleccion determinista de skill (seccion 6.6/16.4.1, TASK-017) -
+    // Mismo criterio fail-closed que la heuristica de arriba: un catalogo
+    // mal formado aborta "plan" entero, nunca cae a "sin skill" en
+    // silencio. La diferencia es que aqui CERO candidatos tras cruzar
+    // etiquetas SI es un resultado valido (catalogo-skills.ts: el
+    // catalogo no es exhaustivo por diseno, a diferencia de la
+    // heuristica).
+    const catalogoSkills = cargarCatalogoSkills();
+    const seleccionSkill = seleccionarSkill(task, catalogoSkills);
+    let skillsRecomendadosFinal = [];
+    let reglaSeleccionSkillFinal = null;
+    let avisoSkillSinCandidato = null;
+    let avisoSkillDesempatePendiente = null;
+    let avisoSkillNoInstalada = null;
+    let peticionDesempateSkillPath = null;
+    if (seleccionSkill.ganador !== null) {
+        skillsRecomendadosFinal = [seleccionSkill.ganador.id];
+        reglaSeleccionSkillFinal = seleccionSkill.regla;
+    }
+    else if (seleccionSkill.candidatosEmpatados.length === 0) {
+        avisoSkillSinCandidato =
+            `Ningun skill de "${FICHERO_CATALOGO_SKILLS}" comparte etiquetas con ${task.id}: se deja ` +
+                'sin "skills_recomendados". No es un fallo -- el catalogo no tiene por que cubrir toda tarea.';
+    }
+    else {
+        // Empate en solape Y en prioridad: el desempate barato no lo
+        // resuelve un calculo (16.4.1). La peticion se REGENERA siempre
+        // (es derivada, igual que peticionRolTemplate): si el catalogo
+        // cambio entre intentos, una peticion rancia listando candidatos
+        // que ya no empatan seria peor que no tener ninguna.
+        const peticionDesempatePath = path.join(planificacionDir, PETICION_DESEMPATE_SKILL_FILENAME);
+        const salidaDesempatePath = path.join(planificacionDir, SALIDA_DESEMPATE_SKILL_FILENAME);
+        await writeFile(peticionDesempatePath, peticionDesempateSkillTemplate(task, seleccionSkill.candidatosEmpatados, today), { encoding: 'utf8' });
+        peticionDesempateSkillPath = peticionDesempatePath;
+        if (!(await ficheroConContenido(salidaDesempatePath))) {
+            await writeFile(salidaDesempatePath, salidaDesempateSkillTemplate(task), { encoding: 'utf8' });
+        }
+        const ganadorDesempate = (await ficheroConContenido(salidaDesempatePath))
+            ? leerGanadorDesempate(await readFile(salidaDesempatePath, 'utf8'), seleccionSkill.candidatosEmpatados)
+            : null;
+        if (ganadorDesempate !== null) {
+            skillsRecomendadosFinal = [ganadorDesempate.id];
+            reglaSeleccionSkillFinal = 'llm';
+        }
+        else {
+            avisoSkillDesempatePendiente =
+                `${seleccionSkill.candidatosEmpatados.length} skills empatan en solape y prioridad para ` +
+                    `${task.id}: responde "${peticionDesempatePath}" en "${salidaDesempatePath}" y vuelve a ` +
+                    'lanzar "taskctl plan" para dejarlo resuelto. Por ahora se deja sin "skills_recomendados".';
+        }
+    }
+    if (skillsRecomendadosFinal.length > 0) {
+        const entradaGanadora = catalogoSkills.find((e) => e.id === skillsRecomendadosFinal[0]);
+        if (entradaGanadora.origen === 'externo') {
+            const estadoInstalacion = comprobarSkillInstalado(entradaGanadora.marketplace);
+            if (estadoInstalacion !== 'instalado') {
+                // Texto identico al de la seccion 6.6 (punto 4): nunca se
+                // instala nada automaticamente, solo se anota la orden a
+                // ejecutar a mano. 'no-verificable' avisa igual que
+                // 'no-instalado' -- el riesgo aceptado es peor si se calla.
+                avisoSkillNoInstalada =
+                    `Esta tarea se beneficiaria del skill "${entradaGanadora.id}" (marketplace ` +
+                        `"${entradaGanadora.marketplace}") -- no esta instalado. Instalalo con "/plugin install ` +
+                        `${entradaGanadora.id}@${entradaGanadora.marketplace}" antes de arrancar, o continua sin el.`;
+            }
+        }
+    }
+    // Re-planificacion (bucle B9->B5): sin esta comparacion,
+    // "skills_recomendados" ya fijado en una vuelta anterior se pisaba en
+    // silencio en cada "plan" -- misma trampa que asignadoCambiado ya
+    // cierra para "asignado_a".
+    const skillsRecomendadosCambiado = skillsRecomendadosFinal.length !== task.skills_recomendados.length ||
+        skillsRecomendadosFinal.some((id, i) => id !== task.skills_recomendados[i]);
+    const updated = {
+        ...task,
+        estado: 'en-diseno',
+        asignado_a: asignadoFinal,
+        actualizado: today,
+        skills_recomendados: skillsRecomendadosFinal,
+        regla_seleccion_skill: reglaSeleccionSkillFinal,
+    };
     // --- El paquete de brainstorm (TASK-016) ---------------------------
     // Se escribe en la carpeta ACTUAL y ANTES de mover la tarea, por el
     // mismo motivo que la peticion de revision en TASK-013: si una
@@ -630,5 +709,12 @@ export async function runPlanCommand(tareasRoot, argv, today, deps) {
         asignadoCambiado,
         avisoIdentidad,
         baseBranchGuard,
+        skillsRecomendados: skillsRecomendadosFinal,
+        reglaSeleccionSkill: reglaSeleccionSkillFinal,
+        skillsRecomendadosCambiado,
+        avisoSkillSinCandidato,
+        avisoSkillDesempatePendiente,
+        peticionDesempateSkill: peticionDesempateSkillPath,
+        avisoSkillNoInstalada,
     };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/catalogo-skills.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/catalogo-skills.js
new file mode 100644
index 0000000..9e0c6f0
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/catalogo-skills.js
@@ -0,0 +1,364 @@
+/**
+ * `scripts/catalogo-skills.yml` — lectura, validacion y el paso 1 de la
+ * seleccion determinista de skill que describe la seccion 6.6 de
+ * docs/PROPUESTA_METODOLOGIA.md (TASK-017).
+ *
+ * MISMA DOCTRINA QUE src/core/heuristica.ts, y por los mismos motivos:
+ * fallo cerrado al parsear (clave desconocida, clave obligatoria
+ * ausente, tipo equivocado o valor negativo ABORTAN taskctl entero, sin
+ * caida a un default silencioso), un solo parser (`parseBloqueClaveValor`
+ * de frontmatter.ts) y un solo punto de resolucion
+ * (`cargarCatalogoSkills`).
+ *
+ * LA UNICA DIFERENCIA DE FONDO CON heuristica.ts: alli las 22 claves
+ * cubren TODA tarea por construccion, asi que cualquier ausencia es un
+ * fallo. Aqui el catalogo es EXPLICITAMENTE NO EXHAUSTIVO — cero
+ * candidatos tras cruzar `etiquetas` con la tarea es un resultado
+ * VALIDO (seleccion vacia + aviso de quien llame), no un fallo de
+ * configuracion. Lo que si es fail-closed es el PARSEO del fichero: una
+ * entrada mal formada aborta igual que una heuristica mal formada.
+ *
+ * FORMATO APLANADO. El fichero no tiene anidamiento (el parser no lo
+ * soporta), asi que cada entrada del catalogo se aplana con el prefijo
+ * "skill_N_" en el nombre de la clave, N = posicion 1-based. La clave
+ * "total_skills" dice cuantos bloques hay que leer. El conjunto de
+ * claves validas depende de ese numero: se resuelve "total_skills"
+ * primero, y con el se construyen las claves esperadas antes de validar
+ * el resto — igual que "clave desconocida" en heuristica.ts, pero aqui
+ * el universo de claves validas no es una lista fija.
+ */
+import { readFileSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+import { parseBloqueClaveValor } from './frontmatter.js';
+export class CatalogoSkillsError extends Error {
+    constructor(message) {
+        super(message);
+        this.name = 'CatalogoSkillsError';
+    }
+}
+export const ORIGENES_SKILL = ['taskcode-plugin', 'externo'];
+export const ROLES_SKILL = ['revisor', 'ejecucion', 'ambos'];
+/** Nombre del fichero dentro de `scripts/`. */
+export const FICHERO_CATALOGO_SKILLS = 'catalogo-skills.yml';
+const CAMPOS_SKILL_OBLIGATORIOS = [
+    'id',
+    'origen',
+    'rol',
+    'prioridad',
+    'etiquetas',
+    'patrones_archivo',
+    'descripcion',
+];
+const CAMPOS_SKILL_TODOS = [...CAMPOS_SKILL_OBLIGATORIOS, 'marketplace'];
+const SKILL_KEY_RE = /^skill_(\d+)_(id|origen|marketplace|rol|prioridad|etiquetas|patrones_archivo|descripcion)$/;
+function packageRoot() {
+    // dist/src/core/catalogo-skills.js -> dist/src/core -> dist/src -> dist -> raiz
+    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+    return path.join(moduleDir, '..', '..', '..');
+}
+/**
+ * Ruta del YML. Mismo patron que resolverRutaHeuristica(): respeta
+ * CLAUDE_PLUGIN_ROOT si esta definida; si no, calcula la ruta relativa
+ * al propio modulo compilado.
+ */
+export function resolverRutaCatalogoSkills() {
+    const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+    if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
+        return path.join(pluginRoot, 'scripts', FICHERO_CATALOGO_SKILLS);
+    }
+    return path.join(packageRoot(), 'scripts', FICHERO_CATALOGO_SKILLS);
+}
+/**
+ * EL punto de resolucion. Lee el fichero y lo valida, o lanza
+ * CatalogoSkillsError. No hay caso de "no hay fichero, sigue sin
+ * skills": el YML lo distribuye el plugin, igual que
+ * heuristica-complejidad.yml, asi que si falta la instalacion esta
+ * rota.
+ */
+export function cargarCatalogoSkills(ruta) {
+    const rutaFinal = ruta ?? resolverRutaCatalogoSkills();
+    let contenido;
+    try {
+        contenido = readFileSync(rutaFinal, 'utf8');
+    }
+    catch (e) {
+        const msg = e instanceof Error ? e.message : String(e);
+        throw new CatalogoSkillsError(`[ERROR] No se pudo leer el catalogo de skills "${rutaFinal}": ${msg}\n` +
+            '        Ese fichero lo trae el plugin. Reinstalalo, o define CLAUDE_PLUGIN_ROOT\n' +
+            '        apuntando a la raiz del plugin si lo ejecutas desde otro sitio.');
+    }
+    return parsearCatalogoSkills(contenido, rutaFinal);
+}
+/**
+ * Separada de cargarCatalogoSkills para poder probar el parseo y la
+ * validacion sin disco.
+ */
+export function parsearCatalogoSkills(contenido, ruta) {
+    const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
+        etiqueta: 'catalogo de skills',
+        crearError: (mensaje) => new CatalogoSkillsError(`[ERROR] ${ruta}: ${mensaje}`),
+        permitirComentariosDeLinea: true,
+    });
+    // (1) total_skills se resuelve ANTES que nada: el universo de claves
+    // validas depende de su valor, asi que hay que conocerlo antes de
+    // poder decir "clave desconocida" de cualquier otra.
+    const paresTotal = pares.filter((p) => p.clave === 'total_skills');
+    if (paresTotal.length === 0) {
+        throw new CatalogoSkillsError(mensajeClaveAusente(ruta, 'total_skills'));
+    }
+    if (paresTotal.length > 1) {
+        const segundo = paresTotal[1];
+        throw new CatalogoSkillsError(mensajeClaveRepetida(`${ruta}:${segundo.numeroLinea}`, 'total_skills'));
+    }
+    const primerTotal = paresTotal[0];
+    const totalSkills = validarEnteroNoNegativo(`${ruta}:${primerTotal.numeroLinea}`, 'total_skills', primerTotal.valor);
+    const clavesValidas = construirClavesValidas(totalSkills);
+    // (2) Recorrido completo: clave desconocida / repetida, y agrupacion
+    // por bloque N. Misma doctrina que heuristica.ts, pero aqui el Set de
+    // claves validas es dinamico en vez de una lista fija.
+    const vistas = new Set();
+    const bloques = new Map();
+    for (const par of pares) {
+        const donde = `${ruta}:${par.numeroLinea}`;
+        if (!clavesValidas.has(par.clave)) {
+            throw new CatalogoSkillsError(mensajeClaveDesconocida(donde, par.clave, clavesValidas));
+        }
+        if (vistas.has(par.clave)) {
+            throw new CatalogoSkillsError(mensajeClaveRepetida(donde, par.clave));
+        }
+        vistas.add(par.clave);
+        if (par.clave === 'total_skills')
+            continue;
+        const m = SKILL_KEY_RE.exec(par.clave);
+        const n = Number(m[1]);
+        const campo = m[2];
+        const bloque = bloques.get(n) ?? {};
+        bloque[campo] = { valor: par.valor, numeroLinea: par.numeroLinea };
+        bloques.set(n, bloque);
+    }
+    // (3) Una entrada por cada N de 1 a totalSkills, exigiendo sus
+    // obligatorias. Un bloque ausente o a medias sale por la misma puerta
+    // que cualquier otra clave obligatoria que falte: mensajeClaveAusente.
+    const catalogo = [];
+    for (let n = 1; n <= totalSkills; n++) {
+        catalogo.push(construirEntrada(bloques.get(n) ?? {}, n, ruta));
+    }
+    validarIdsUnicos(catalogo, ruta);
+    return catalogo;
+}
+function construirClavesValidas(totalSkills) {
+    const claves = new Set(['total_skills']);
+    for (let n = 1; n <= totalSkills; n++) {
+        for (const campo of CAMPOS_SKILL_TODOS) {
+            claves.add(`skill_${n}_${campo}`);
+        }
+    }
+    return claves;
+}
+function exigirCampo(bloque, campo, n, ruta) {
+    const c = bloque[campo];
+    if (c === undefined) {
+        throw new CatalogoSkillsError(mensajeClaveAusente(ruta, `skill_${n}_${campo}`));
+    }
+    return c;
+}
+function construirEntrada(bloque, n, ruta) {
+    const prefijo = `skill_${n}_`;
+    const cId = exigirCampo(bloque, 'id', n, ruta);
+    const id = validarTextoNoVacio(`${ruta}:${cId.numeroLinea}`, `${prefijo}id`, cId.valor);
+    const cOrigen = exigirCampo(bloque, 'origen', n, ruta);
+    const origen = validarEnum(`${ruta}:${cOrigen.numeroLinea}`, `${prefijo}origen`, cOrigen.valor, ORIGENES_SKILL);
+    const cRol = exigirCampo(bloque, 'rol', n, ruta);
+    const rol = validarEnum(`${ruta}:${cRol.numeroLinea}`, `${prefijo}rol`, cRol.valor, ROLES_SKILL);
+    const cPrioridad = exigirCampo(bloque, 'prioridad', n, ruta);
+    const prioridad = validarEnteroNoNegativo(`${ruta}:${cPrioridad.numeroLinea}`, `${prefijo}prioridad`, cPrioridad.valor);
+    const cEtiquetas = exigirCampo(bloque, 'etiquetas', n, ruta);
+    const etiquetas = validarListaDeTexto(`${ruta}:${cEtiquetas.numeroLinea}`, `${prefijo}etiquetas`, cEtiquetas.valor, 1);
+    const cPatrones = exigirCampo(bloque, 'patrones_archivo', n, ruta);
+    const patrones_archivo = validarListaDeTexto(`${ruta}:${cPatrones.numeroLinea}`, `${prefijo}patrones_archivo`, cPatrones.valor, 0);
+    const cDescripcion = exigirCampo(bloque, 'descripcion', n, ruta);
+    const descripcion = validarTextoNoVacio(`${ruta}:${cDescripcion.numeroLinea}`, `${prefijo}descripcion`, cDescripcion.valor);
+    const cMarketplace = bloque['marketplace'];
+    let marketplace;
+    if (origen === 'externo') {
+        if (cMarketplace === undefined) {
+            throw new CatalogoSkillsError(mensajeClaveAusente(ruta, `${prefijo}marketplace`) +
+                `\n        Obligatoria cuando "${prefijo}origen" es "externo": sin ella no se puede\n` +
+                '        anotar "/plugin install X@Y" para un skill que no este instalado (paso 4\n' +
+                '        de la seccion 6.6).');
+        }
+        marketplace = validarTextoNoVacio(`${ruta}:${cMarketplace.numeroLinea}`, `${prefijo}marketplace`, cMarketplace.valor);
+    }
+    else {
+        if (cMarketplace !== undefined) {
+            throw new CatalogoSkillsError(`[ERROR] ${ruta}:${cMarketplace.numeroLinea}: "${prefijo}marketplace" no tiene sentido ` +
+                `con "${prefijo}origen: taskcode-plugin".\n` +
+                '        Ese campo solo existe para anotar de que marketplace se instala un skill\n' +
+                '        externo; uno empaquetado con el plugin ya viene instalado. Borra la linea\n' +
+                '        o corrige el origen.');
+        }
+        marketplace = null;
+    }
+    return { id, origen, marketplace, rol, prioridad, etiquetas, patrones_archivo, descripcion };
+}
+function validarIdsUnicos(catalogo, ruta) {
+    const vistos = new Map();
+    catalogo.forEach((entrada, idx) => {
+        const otro = vistos.get(entrada.id);
+        if (otro !== undefined) {
+            throw new CatalogoSkillsError(`[ERROR] ${ruta}: el id "${entrada.id}" se repite en las entradas ${otro + 1} y ${idx + 1}.\n` +
+                '        Cada "skill_N_id" debe ser unico en todo el catalogo: taskctl lo usa para\n' +
+                '        identificar la skill ganadora en "skills_recomendados".');
+        }
+        vistos.set(entrada.id, idx);
+    });
+}
+// --- Validadores tipados (mismo criterio que heuristica.ts) -----------
+function validarEnteroNoNegativo(donde, clave, valor) {
+    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
+        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 0, ` +
+            `y es ${describirValor(valor)}.\n` +
+            '        Escribe el numero sin comillas y sin decimales.');
+    }
+    return valor;
+}
+function validarTextoNoVacio(donde, clave, valor) {
+    if (typeof valor !== 'string' || valor.trim() === '') {
+        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" debe ser texto no vacio, y es ${describirValor(valor)}.`);
+    }
+    return valor.trim();
+}
+function validarEnum(donde, clave, valor, permitidos) {
+    if (typeof valor !== 'string' || !permitidos.includes(valor)) {
+        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" tiene el valor ${describirValor(valor)}, pero debe ser uno de: ` +
+            `${permitidos.join(', ')}.`);
+    }
+    return valor;
+}
+/**
+ * Lista de textos no vacios ni repetidos. `minimo` distingue
+ * `etiquetas` (>=1: una entrada sin etiquetas nunca podria coincidir
+ * con ninguna tarea por solape, seria un candidato imposible) de
+ * `patrones_archivo` (>=0: vacia es el caso legitimo de un skill que no
+ * se enruta por extension de fichero).
+ */
+function validarListaDeTexto(donde, clave, valor, minimo) {
+    if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string')) {
+        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" debe ser una lista de textos entre corchetes ` +
+            `(p. ej. [a, b]), y es ${describirValor(valor)}.`);
+    }
+    const entradas = valor.map((x) => x.trim());
+    if (entradas.some((x) => x === '')) {
+        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" tiene alguna entrada vacia.`);
+    }
+    const repetida = entradas.find((x, i) => entradas.indexOf(x) !== i);
+    if (repetida !== undefined) {
+        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" tiene la entrada "${repetida}" repetida.`);
+    }
+    if (entradas.length < minimo) {
+        throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
+            '        Una entrada de catalogo sin etiquetas nunca puede coincidir con ninguna\n' +
+            '        tarea por solape: seria un candidato imposible. Anadele al menos una.');
+    }
+    return entradas;
+}
+function describirValor(valor) {
+    if (valor === null)
+        return 'un valor vacio';
+    if (Array.isArray(valor))
+        return `una lista (${JSON.stringify(valor)})`;
+    if (typeof valor === 'string')
+        return `el texto "${valor}"`;
+    return `${String(valor)} (${typeof valor})`;
+}
+function mensajeClaveAusente(ruta, clave) {
+    return (`[ERROR] ${ruta}: falta la clave obligatoria "${clave}".\n` +
+        `        Anade la linea "${clave}: <valor>" o restaura el catalogo que trae el plugin.`);
+}
+function mensajeClaveRepetida(donde, clave) {
+    return (`[ERROR] ${donde}: la clave "${clave}" esta repetida.\n` +
+        '        Deja solo una: con dos, el fichero dice una cosa y taskctl usaria otra.');
+}
+/**
+ * Enumera las claves validas y, si la escrita se parece a una de ellas,
+ * la propone. El universo de claves aqui es dinamico (depende de
+ * `total_skills`), a diferencia de CLAVES_HEURISTICA.
+ */
+function mensajeClaveDesconocida(donde, clave, validas) {
+    const sugerida = claveMasParecida(clave, validas);
+    const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
+    if (sugerida !== null)
+        lineas.push(`        Quiza quisiste decir "${sugerida}".`);
+    lineas.push('        Borrala o corrigela: taskctl no usa un catalogo que no entiende.');
+    lineas.push('        Si es una entrada nueva, recuerda subir "total_skills" para que su bloque cuente.');
+    return lineas.join('\n');
+}
+function claveMasParecida(clave, validas) {
+    let mejor = null;
+    let mejorDistancia = Number.POSITIVE_INFINITY;
+    for (const valida of validas) {
+        const d = distanciaEdicion(clave.toLowerCase(), valida);
+        if (d < mejorDistancia) {
+            mejorDistancia = d;
+            mejor = valida;
+        }
+    }
+    return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
+}
+/** Distancia de edicion (Levenshtein) a mano — cero dependencias. */
+function distanciaEdicion(a, b) {
+    let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
+    for (let i = 1; i <= a.length; i++) {
+        const actual = [i];
+        for (let j = 1; j <= b.length; j++) {
+            const coste = a[i - 1] === b[j - 1] ? 0 : 1;
+            actual[j] = Math.min(actual[j - 1] + 1, previa[j] + 1, previa[j - 1] + coste);
+        }
+        previa = actual;
+    }
+    return previa[b.length];
+}
+/**
+ * Paso 1 de 6.6: cruza `task.etiquetas` contra las `etiquetas` de cada
+ * entrada del catalogo. Candidatos = solape > 0. Desempate: primero por
+ * mayor solape, despues por mayor `prioridad` (16.4.1). Si sigue habiendo
+ * empate, se devuelve ese conjunto para el LLM.
+ *
+ * NO filtra por `rol`: plan-final.md no lo pide, y limitar aqui a
+ * rol=ejecucion dejaria fuera candidatos "ambos" sin ninguna razon
+ * documentada. Si algun dia hace falta, que sea una decision explicita
+ * y no un olvido — mismo criterio de "decirlo, no disimularlo" que sigue
+ * heuristica.ts con sus claves sin consumidor.
+ *
+ * Cero candidatos con solape > 0 es un resultado VALIDO (catalogo no
+ * exhaustivo por diseño): se devuelve `ganador: null, regla: null,
+ * candidatosEmpatados: []`, y quien llame decide como avisarlo.
+ */
+export function seleccionarSkill(task, catalogo) {
+    const etiquetasTarea = new Set(task.etiquetas);
+    const conSolape = catalogo
+        .map((entrada) => ({
+        entrada,
+        solape: entrada.etiquetas.filter((e) => etiquetasTarea.has(e)).length,
+    }))
+        .filter((x) => x.solape > 0);
+    if (conSolape.length === 0) {
+        return { ganador: null, regla: null, candidatosEmpatados: [] };
+    }
+    const solapeMax = Math.max(...conSolape.map((x) => x.solape));
+    const porSolape = conSolape.filter((x) => x.solape === solapeMax).map((x) => x.entrada);
+    if (porSolape.length === 1) {
+        return { ganador: porSolape[0], regla: 'solape', candidatosEmpatados: [] };
+    }
+    const prioridadMax = Math.max(...porSolape.map((e) => e.prioridad));
+    const porPrioridad = porSolape.filter((e) => e.prioridad === prioridadMax);
+    if (porPrioridad.length === 1) {
+        return {
+            ganador: porPrioridad[0],
+            regla: 'prioridad',
+            candidatosEmpatados: [],
+        };
+    }
+    return { ganador: null, regla: null, candidatosEmpatados: porPrioridad };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-desempate-skill.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-desempate-skill.js
new file mode 100644
index 0000000..9f98aa5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-desempate-skill.js
@@ -0,0 +1,50 @@
+export const PETICION_DESEMPATE_SKILL_FILENAME = 'peticion-desempate-skill-1.md';
+export const SALIDA_DESEMPATE_SKILL_FILENAME = 'salida-desempate-skill-1.md';
+export function peticionDesempateSkillTemplate(task, candidatos, fecha) {
+    const filas = candidatos
+        .map((c) => `- \`${c.id}\` (prioridad ${c.prioridad}, rol ${c.rol}): ${c.descripcion}\n` +
+        `  etiquetas: ${c.etiquetas.join(', ')}\n`)
+        .join('');
+    const etiquetasTarea = task.etiquetas.length === 0 ? '(sin etiquetas)' : task.etiquetas.join(', ');
+    return (`# Peticion de desempate de skill — ${task.id}\n\n` +
+        `- Tarea: ${task.id} — ${task.titulo}\n` +
+        `- Fecha: ${fecha}\n` +
+        `- Vuelca tu respuesta en: \`${SALIDA_DESEMPATE_SKILL_FILENAME}\`\n\n` +
+        '## Por que te llamamos\n\n' +
+        `Estos ${candidatos.length} skills del catalogo empatan en solape de etiquetas contra esta ` +
+        'tarea y tambien en prioridad declarada. El desempate que sigue no lo resuelve un calculo ' +
+        'determinista.\n\n' +
+        '## Candidatos empatados\n\n' +
+        filas +
+        '\n## Etiquetas de la tarea\n\n' +
+        `${etiquetasTarea}\n\n` +
+        '## Como entregas\n\n' +
+        `Escribe en \`${SALIDA_DESEMPATE_SKILL_FILENAME}\` una unica linea con el \`id\` EXACTO (tal ` +
+        'cual aparece arriba) del candidato que mejor encaje con esta tarea concreta — taskctl solo ' +
+        'lee la primera linea no vacia. Puedes anadir tu razonamiento en lineas siguientes.\n\n' +
+        '## Reglas\n\n' +
+        '- Eliges uno de los candidatos de arriba, tal cual. Cualquier otro texto en esa primera ' +
+        'linea se trata como respuesta invalida y taskctl la ignora.\n' +
+        '- Evidencia, no suposicion: basate en el objetivo real de la tarea, no solo en las ' +
+        'etiquetas que ya empataron.\n');
+}
+/**
+ * Scaffold vacio de la salida, igual de minimo que el de un rol de
+ * brainstorm: solo el sitio donde escribir, sin invencion de contenido.
+ */
+export function salidaDesempateSkillTemplate(task) {
+    return `# Salida del desempate de skill — ${task.id}\n\n(pendiente de completar)\n`;
+}
+/**
+ * Ganador declarado en la salida ya escrita, o null si esta vacia o si
+ * su primera linea no coincide EXACTAMENTE con el `id` de uno de los
+ * candidatos vigentes (respuesta a medio escribir, catalogo editado
+ * entre la peticion y la respuesta, etc.). Fail-closed: una salida que
+ * no se puede interpretar sin ambiguedad no elige un candidato al azar.
+ */
+export function leerGanadorDesempate(contenido, candidatos) {
+    const primeraLinea = contenido.split(/\r?\n/).find((l) => l.trim() !== '')?.trim() ?? '';
+    if (primeraLinea === '')
+        return null;
+    return candidatos.find((c) => c.id === primeraLinea) ?? null;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plugin-instalado.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plugin-instalado.js
new file mode 100644
index 0000000..bb642ab
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plugin-instalado.js
@@ -0,0 +1,67 @@
+/**
+ * Comprueba si un skill "externo" del catalogo (catalogo-skills.ts) ya
+ * esta instalado en esta maquina, para el paso 4 de la seccion 6.6:
+ * anotar "/plugin install X@Y" solo cuando de verdad haga falta.
+ *
+ * Vive aparte de catalogo-skills.ts y de commands/plan.ts porque es la
+ * unica pieza de la seleccion de skill que sale a un subproceso, y
+ * aislarla evita que un fallo de "claude plugin list" se confunda con
+ * un fallo de parseo del catalogo.
+ *
+ * Mismo patron de subproceso que runGit() en fs/git.ts (spawnSync +
+ * comprobar result.error / result.status), pero con una semantica de
+ * error DISTINTA a proposito: runGit() LANZA porque un fallo de Git
+ * debe abortar el comando que lo pidio. Aqui un fallo del subproceso
+ * (binario ausente, timeout, JSON mal formado, forma inesperada) NUNCA
+ * aborta "taskctl plan" — se colapsa en 'no-verificable', que es un
+ * estado de negocio valido, no una excepcion. Riesgo aceptado en
+ * plan-final.md: mejor no confirmar nada que arriesgar una instalacion
+ * automatica ('no-instalado' erroneo dispararia la sugerencia de
+ * instalar algo que ya esta) o esconder un candidato real que falta
+ * ('instalado' erroneo por defecto).
+ *
+ * El formato exacto de "claude plugin list --json" quedo sin verificar
+ * a mano en la seccion 6.6 de la metodologia ("a confirmar en Sprint
+ * 0"): se asume un array de objetos con un campo `marketplace`, y
+ * cualquier forma que no encaje con eso tambien cae en
+ * 'no-verificable' en vez de asumirse como 'no-instalado'.
+ */
+import { spawnSync } from 'node:child_process';
+const TIMEOUT_MS = 5000;
+/**
+ * Separada de comprobarSkillInstalado para poder probar cada desenlace
+ * (binario ausente, timeout, status != 0, JSON mal formado, forma
+ * inesperada, encontrado/no encontrado) con datos literales, sin lanzar
+ * un subproceso real — mismo motivo por el que parsearCatalogoSkills
+ * vive aparte de cargarCatalogoSkills en catalogo-skills.ts.
+ */
+export function interpretarResultadoPluginList(result, marketplace) {
+    if (result.error || result.status !== 0 || typeof result.stdout !== 'string') {
+        return 'no-verificable';
+    }
+    let lista;
+    try {
+        lista = JSON.parse(result.stdout);
+    }
+    catch {
+        return 'no-verificable';
+    }
+    if (!Array.isArray(lista)) {
+        return 'no-verificable';
+    }
+    const instalado = lista.some((entrada) => typeof entrada === 'object' &&
+        entrada !== null &&
+        entrada.marketplace === marketplace);
+    return instalado ? 'instalado' : 'no-instalado';
+}
+export function comprobarSkillInstalado(marketplace) {
+    const result = spawnSync('claude', ['plugin', 'list', '--json'], {
+        encoding: 'utf8',
+        timeout: TIMEOUT_MS,
+    });
+    return interpretarResultadoPluginList({
+        error: result.error,
+        status: result.status,
+        stdout: typeof result.stdout === 'string' ? result.stdout : null,
+    }, marketplace);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js
index 99918ca..e10b170 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js
@@ -3,6 +3,11 @@
  * seccion 4 de docs/PROPUESTA_METODOLOGIA.md para la plantilla de
  * referencia.
  */
+export const REGLAS_SELECCION_SKILL = [
+    'solape',
+    'prioridad',
+    'llm',
+];
 export const TASK_TYPES = ['feature', 'fix', 'hotfix', 'release'];
 export const TASK_COMPLEXITIES = [
     'trivial',
@@ -41,6 +46,7 @@ export const TASK_FIELD_ORDER = [
     'asignado_a',
     'agente_revisor',
     'skills_recomendados',
+    'regla_seleccion_skill',
     'ultimo_commit_revisado',
     'revision_codex',
     'creado',
@@ -125,6 +131,15 @@ function requireEnum(data, field, allowed) {
     }
     return v;
 }
+function requireNullableEnum(data, field, allowed) {
+    const v = data[field];
+    if (v === null || v === undefined)
+        return null;
+    if (typeof v !== 'string' || !allowed.includes(v)) {
+        fail(field, `El campo "${field}" debe ser null o uno de: ${allowed.join(', ')}.`);
+    }
+    return v;
+}
 /**
  * Valida y convierte un objeto generico (tal como lo devuelve
  * parseFrontmatter) en un Task tipado. Lanza TaskValidationError con
@@ -149,6 +164,7 @@ export function validateTask(data) {
         asignado_a: requireNullableString(data, 'asignado_a'),
         agente_revisor: requireString(data, 'agente_revisor'),
         skills_recomendados: requireStringArray(data, 'skills_recomendados'),
+        regla_seleccion_skill: requireNullableEnum(data, 'regla_seleccion_skill', REGLAS_SELECCION_SKILL),
         ultimo_commit_revisado: requireNullableString(data, 'ultimo_commit_revisado'),
         revision_codex: requireBoolean(data, 'revision_codex'),
         creado: requireString(data, 'creado'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml b/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
new file mode 100644
index 0000000..22cfa99
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
@@ -0,0 +1,158 @@
+# Catalogo de skills para seleccion determinista - TASK-017 (seccion 6.6 de
+# docs/PROPUESTA_METODOLOGIA.md).
+#
+# Registra los skills que `taskctl plan` puede recomendar para EJECUTAR una
+# tarea (`skills_recomendados`) y, mas adelante (TASK-018, seccion 16.5), los
+# que puede usar `taskctl review` para enrutar el diff a un revisor de
+# dominio en vez de al generico. Este fichero no decide el `agente_revisor`
+# de hoy: eso lo hace `agentes-revisores.yml`. Aqui se cruzan `etiquetas`
+# de la tarea contra `etiquetas` de cada entrada para un top-N por solape,
+# nunca al reves.
+#
+# FORMATO. Mismo parser minimo que el resto de metadatos del plugin, via
+# parseBloqueClaveValor(): SOLO pares "clave: valor" de primer nivel,
+# listas en linea [a, b, c], comentarios de linea que empiezan por "#".
+# NO hay anidamiento ni listas en bloque con "-", asi que el YAML de
+# ejemplo de la seccion 6.6 (una lista de mapas) no se puede escribir tal
+# cual. Cada entrada del catalogo se aplana con el prefijo "skill_N_" en el
+# nombre de la clave, donde N es su posicion (empieza en 1). La clave
+# "total_skills" dice cuantas entradas hay que leer; catalogo-skills.ts
+# itera de 1 a total_skills y exige el bloque completo de cada una.
+#
+# Comentarios de linea van APAGADOS por defecto en ese parser: hay que
+# pedirlos de forma explicita (permitirComentariosDeLinea: true), igual
+# que hace cargarHeuristica() para heuristica-complejidad.yml.
+#
+# CAMPOS por entrada (los siete de la seccion 6.6):
+#   skill_N_id                 identificador del skill. Para uno empaquetado
+#                               en este plugin, su nombre de skill tal cual
+#                               (el de su carpeta y su frontmatter `name`).
+#                               Para uno externo, "marketplace:skill" (ver
+#                               el ejemplo "figma:figma-generate-design" de
+#                               la seccion 6.6). Debe ser unico en todo el
+#                               fichero.
+#   skill_N_origen              "taskcode-plugin" (empaquetado, siempre
+#                               instalado con este plugin) o "externo"
+#                               (puede no estar instalado en la maquina).
+#   skill_N_marketplace         SOLO si origen es "externo": el marketplace
+#                               del que se instala, para poder anotar
+#                               "/plugin install X@Y" cuando no este
+#                               instalado (paso 4 de 6.6). Ausente en toda
+#                               entrada con origen "taskcode-plugin": no
+#                               tiene sentido, el plugin ya la trae.
+#   skill_N_rol                 "revisor" | "ejecucion" | "ambos".
+#   skill_N_prioridad           entero >= 0. Desempate determinista
+#                               (seccion 16.4.1) cuando dos o mas entradas
+#                               empatan en solape de etiquetas contra la
+#                               tarea: gana la de prioridad MAS ALTA. Solo
+#                               si tambien empatan en prioridad se consulta
+#                               a un modelo barato (ver
+#                               peticion-desempate-skill-N.md).
+#   skill_N_etiquetas            lista en linea. Es la que se cruza contra
+#                               las `etiquetas` de la tarea para el solape
+#                               del paso 1 de 6.6.
+#   skill_N_patrones_archivo     lista en linea de globs, en el MISMO estilo
+#                               flow que ya declara cada SKILL.md (se copian
+#                               tal cual, sin reescribirlos). Vacia ([]) si
+#                               el skill no se enruta por extension de
+#                               fichero (caso task-workflow, que se dispara
+#                               por la existencia de la carpeta `tareas/`, y
+#                               caso code-quality-reviewer, que es fallback
+#                               por descarte). Hoy sin consumidor: lo usa
+#                               TASK-018 (seccion 16.5) para enrutar
+#                               `taskctl review` por lo que el diff
+#                               realmente toca. Se declara ya para no volver
+#                               a tocar cada SKILL.md cuando llegue esa
+#                               tarea.
+#   skill_N_descripcion          una frase. Resume el frontmatter `description`
+#                               real del SKILL.md correspondiente; no lo
+#                               sustituye ni se lee como fuente de verdad.
+#
+# PRIORIDAD - criterio seguido en esta version. Los tres revisores de
+# dominio (Angular/Vue, C#-AutoCAD-IFC, Java/Spring) llevan la misma
+# prioridad (10): ninguno debe ganarle al otro por defecto, porque sus
+# etiquetas no se solapan entre si y en la practica nunca compiten por la
+# misma tarea. code-quality-reviewer lleva la prioridad mas baja (1) a
+# proposito: es el suelo generico y solo debe entrar por descarte (ninguna
+# etiqueta de dominio caso) o por exceso (mas de tres dominios a la vez,
+# seccion 16.5) - nunca porque le gano el desempate a un revisor de dominio
+# real. task-workflow lleva prioridad alta (10) porque en el dogfooding de
+# este mismo repo (y en cualquier proyecto que instale el plugin) es la
+# skill de ejecucion mas relevante siempre que exista la carpeta `tareas/`.
+#
+# CONTENIDO INICIAL - alcance de TASK-017. Las cinco entradas de abajo son
+# los cinco skills que YA trae `taskcode-plugin` (carpeta `skills/`), leidos
+# de su SKILL.md real. Ningun rol del brainstorm de disenio propuso que
+# skills externos entrar en esta primera version (quedo anotado en
+# plan-final.md como hueco de dominio, sin rol de especialista lanzado esa
+# ronda), asi que no se inventa ninguna entrada externa sin un skill real
+# que instalar. Anadir una es tan barato como sumarle un bloque mas y subir
+# total_skills, igual que dice la seccion 6.6: "el catalogo lo mantiene el
+# equipo a mano".
+#
+# NINGUN SKILL DE ESTE FICHERO ES OBLIGATORIO. A diferencia de
+# heuristica-complejidad.yml (22 claves obligatorias que cubren TODA tarea
+# por construccion), este catalogo es explicitamente no exhaustivo: cero
+# candidatos tras cruzar `etiquetas` es un resultado VALIDO (selección
+# vacia + aviso), no un fallo de configuracion. Lo que SI es fail-closed es
+# el PARSEO: una entrada con un campo obligatorio ausente, un `rol` fuera
+# del enum, una `prioridad` negativa, un `id` repetido o un `total_skills`
+# que no cuadra con el numero de bloques presentes ABORTA taskctl plan
+# entero, con el mismo criterio que cargarHeuristica().
+
+total_skills: 5
+
+# ---------------------------------------------------------------------
+# 1. task-workflow - skills/task-workflow/SKILL.md
+# ---------------------------------------------------------------------
+skill_1_id: task-workflow
+skill_1_origen: taskcode-plugin
+skill_1_rol: ejecucion
+skill_1_prioridad: 10
+skill_1_etiquetas: [taskctl, sprints, gitflow, revision-por-pares, planificacion]
+skill_1_patrones_archivo: []
+skill_1_descripcion: "Metodologia de tareas por sprints con revision por pares y Git-Flow determinista via taskctl"
+
+# ---------------------------------------------------------------------
+# 2. code-quality-reviewer - skills/code-quality-reviewer/SKILL.md
+# ---------------------------------------------------------------------
+skill_2_id: code-quality-reviewer
+skill_2_origen: taskcode-plugin
+skill_2_rol: revisor
+skill_2_prioridad: 1
+skill_2_etiquetas: [calidad, revision-generica, fallback]
+skill_2_patrones_archivo: []
+skill_2_descripcion: "Revisor generico de calidad, independiente del lenguaje; entra por descarte o cuando el diff toca mas de tres dominios"
+
+# ---------------------------------------------------------------------
+# 3. angular-vue-reviewer - skills/angular-vue-reviewer/SKILL.md
+# ---------------------------------------------------------------------
+skill_3_id: angular-vue-reviewer
+skill_3_origen: taskcode-plugin
+skill_3_rol: revisor
+skill_3_prioridad: 10
+skill_3_etiquetas: [angular, vue, frontend, componentes, accesibilidad]
+skill_3_patrones_archivo: ["**/*.vue", "**/*.component.ts", "**/*.component.html", "**/*.component.scss", "**/*.component.css", "**/*.component.spec.ts", "**/*.directive.ts", "**/composables/**/*.ts", "**/composables/**/*.js", "**/src/app/**/*.html", "**/src/app/**/*.routes.ts", "**/src/app/app.config.ts", "**/angular.json", "**/nuxt.config.ts", "**/vue.config.js"]
+skill_3_descripcion: "Revision por pares de frontend Angular y Vue: reactividad, gestion de estado, accesibilidad y rendimiento de renderizado"
+
+# ---------------------------------------------------------------------
+# 4. csharp-autocad-ifc-reviewer - skills/csharp-autocad-ifc-reviewer/SKILL.md
+# ---------------------------------------------------------------------
+skill_4_id: csharp-autocad-ifc-reviewer
+skill_4_origen: taskcode-plugin
+skill_4_rol: revisor
+skill_4_prioridad: 10
+skill_4_etiquetas: [csharp, autocad, ifc, bim]
+skill_4_patrones_archivo: ["**/*.cs", "**/*.csproj", "**/*.sln", "**/*.ifc", "**/*.ifcxml", "**/*.ifcjson"]
+skill_4_descripcion: "Revision por pares de C# que interopera con la API de AutoCAD o que produce/consume modelos IFC/BIM"
+
+# ---------------------------------------------------------------------
+# 5. java-spring-reviewer - skills/java-spring-reviewer/SKILL.md
+# ---------------------------------------------------------------------
+skill_5_id: java-spring-reviewer
+skill_5_origen: taskcode-plugin
+skill_5_rol: revisor
+skill_5_prioridad: 10
+skill_5_etiquetas: [java, spring, spring-boot, backend]
+skill_5_patrones_archivo: ["**/*.java", "src/main/java/**", "src/test/java/**", "**/pom.xml", "**/build.gradle", "**/build.gradle.kts", "**/settings.gradle", "**/settings.gradle.kts", "**/application*.properties", "**/application*.yml", "**/application*.yaml", "**/bootstrap*.yml", "**/src/main/resources/db/migration/**", "**/src/main/resources/db/changelog/**"]
+skill_5_descripcion: "Revision por pares de Java y Spring Boot: capas de servicio/repositorio, limites transaccionales y consultas N+1"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 3b427de..75548a6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -10,6 +10,7 @@ import { runStartCommand, StartCommandError } from './commands/start.js';
 import { runPlanCommand, PlanCommandError, type PlanCommandResult } from './commands/plan.js';
 import { HeuristicaError } from './core/heuristica.js';
 import { RolesBrainstormError } from './core/roles-brainstorm.js';
+import { CatalogoSkillsError } from './core/catalogo-skills.js';
 import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
@@ -141,6 +142,35 @@ function asignacionNotice(result: { asignadoA: string | null; asignadoCambiado:
   return `Asignada a "${result.asignadoA}".\n`;
 }
 
+/**
+ * Resultado de la seleccion determinista de skill (seccion 6.6/16.4.1,
+ * TASK-017). Cuatro desenlaces posibles, no excluyentes entre "sin
+ * candidato"/"desempate pendiente" y "no instalada" (un ganador de una
+ * ronda anterior de desempate puede resultar externo y no instalado
+ * ahora mismo). Solo se anuncia el ganador cuando cambio respecto al
+ * valor previo: igual que brainstormNotice con la discrepancia, evita
+ * repetir en cada "plan" un resultado que ya se anuncio una vez.
+ */
+function seleccionSkillNotice(result: PlanCommandResult): string {
+  const lineas: string[] = [];
+  if (result.skillsRecomendadosCambiado && result.skillsRecomendados.length > 0) {
+    lineas.push(
+      `Skill recomendado: "${result.skillsRecomendados[0]}" (regla: ${result.reglaSeleccionSkill}).`
+    );
+  }
+  if (result.avisoSkillSinCandidato !== null) {
+    lineas.push(result.avisoSkillSinCandidato);
+  }
+  if (result.avisoSkillDesempatePendiente !== null) {
+    lineas.push(result.avisoSkillDesempatePendiente);
+  }
+  if (result.avisoSkillNoInstalada !== null) {
+    lineas.push(result.avisoSkillNoInstalada);
+  }
+  if (lineas.length === 0) return '';
+  return lineas.join('\n') + '\n';
+}
+
 /**
  * Que ha dejado escrito el brainstorm (TASK-016). Se imprimen las
  * rutas porque son lo unico accionable: quien orquesta la sesion tiene
@@ -383,7 +413,8 @@ export async function main(argv: readonly string[]): Promise<number> {
       process.stdout.write(
         `Tarea ${result.id} en diseno: movida a ${result.filePath}. ${scaffoldMsg}\n` +
           asignacionNotice(result) +
-          brainstormNotice(result)
+          brainstormNotice(result) +
+          seleccionSkillNotice(result)
       );
       printAutoCommit(result.autoCommit);
       return 0;
@@ -393,6 +424,7 @@ export async function main(argv: readonly string[]): Promise<number> {
         e instanceof ConfigError ||
         e instanceof HeuristicaError ||
         e instanceof RolesBrainstormError ||
+        e instanceof CatalogoSkillsError ||
         e instanceof PlanCommandError ||
         e instanceof StateMachineError ||
         e instanceof TaskFolderConflictError ||
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index 27e1f02..0bca65e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -165,6 +165,7 @@ export function buildNewTask(id: string, opts: NewTaskOptions, today: string): T
     asignado_a: null,
     agente_revisor: opts.agenteRevisor,
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: today,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index e7d0c91..bf986ee 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -14,22 +14,23 @@
  * reparto que TASK-013 fijo para "taskctl review", y por el mismo
  * motivo — un CLI que llama a un agente no se puede probar sin uno.
  *
- * LO QUE SIGUE SIN HACER: contexto determinista desde docs/INDEX.md,
- * gatekeeper barato para la discrepancia de complejidad y seleccion de
- * skill (6.6, TASK-017).
+ * LO QUE SIGUE SIN HACER: contexto determinista desde docs/INDEX.md y
+ * gatekeeper barato para la discrepancia de complejidad. La seleccion
+ * determinista de skill (6.6/16.4.1, TASK-017) ya vive aqui, entre el
+ * calculo del brainstorm y la escritura del frontmatter.
  *
  * Aplica la precondicion de rama base de la seccion 8.3 desde TASK-012
  * (ensureBaseBranchReady, antes de mover nada).
  */
 import path from 'node:path';
-import { mkdir, readdir, rename, stat, writeFile } from 'node:fs/promises';
+import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
 import { parseArgs } from '../cli/args.js';
 import {
   parseAsignadoAFlag,
   identidadUsable,
   PISTA_VACIO_ESCRITURA,
 } from '../cli/asignado.js';
-import type { Task } from '../core/task.js';
+import type { Task, ReglaSeleccionSkill } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir } from '../fs/task-store.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { ensureBaseBranchReady, gitUserEmail, type BaseBranchGuardResult } from '../fs/git.js';
@@ -59,6 +60,19 @@ import {
   salidaRolTemplate,
   peticionUnificadorTemplate,
 } from '../core/plan-brainstorm.js';
+import {
+  cargarCatalogoSkills,
+  seleccionarSkill,
+  FICHERO_CATALOGO_SKILLS,
+} from '../core/catalogo-skills.js';
+import {
+  PETICION_DESEMPATE_SKILL_FILENAME,
+  SALIDA_DESEMPATE_SKILL_FILENAME,
+  peticionDesempateSkillTemplate,
+  salidaDesempateSkillTemplate,
+  leerGanadorDesempate,
+} from '../core/plan-desempate-skill.js';
+import { comprobarSkillInstalado } from '../core/plugin-instalado.js';
 
 export class PlanCommandError extends Error {}
 
@@ -282,6 +296,20 @@ export interface PlanCommandResult {
   baseBranchGuard: BaseBranchGuardResult;
   /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
   autoCommit: AutoCommitResult;
+  /** skills_recomendados resultante (seccion 6.6, TASK-017). Vacio si no hubo candidato. */
+  skillsRecomendados: readonly string[];
+  /** Regla que decidio el ganador; null si no hubo candidato o el desempate sigue pendiente. */
+  reglaSeleccionSkill: ReglaSeleccionSkill | null;
+  /** true si esta invocacion cambio skills_recomendados respecto al valor previo. */
+  skillsRecomendadosCambiado: boolean;
+  /** Aviso si ningun skill del catalogo comparte etiquetas con la tarea; null si no aplica. */
+  avisoSkillSinCandidato: string | null;
+  /** Aviso si hay un empate en solape y prioridad a la espera del desempate por LLM; null si no aplica. */
+  avisoSkillDesempatePendiente: string | null;
+  /** Ruta de la peticion de desempate escrita, si hubo empate esta vez; null si no aplica. */
+  peticionDesempateSkill: string | null;
+  /** Aviso "/plugin install X@Y" si el skill ganador es externo y no esta instalado; null si no aplica. */
+  avisoSkillNoInstalada: string | null;
 }
 
 export interface PlanCommandDeps {
@@ -370,13 +398,6 @@ export async function runPlanCommand(
   const asignadoFinal = resolverAsignado(asignadoA, task.asignado_a, identidad);
   const asignadoCambiado = asignadoFinal !== task.asignado_a;
 
-  const updated: Task = {
-    ...task,
-    estado: 'en-diseno',
-    asignado_a: asignadoFinal,
-    actualizado: today,
-  };
-
   // --- Resolucion determinista del brainstorm (TASK-016) -------------
   // Va ANTES de cualquier escritura y de mover nada: todo lo que puede
   // abortar tiene que abortar con la tarea intacta.
@@ -508,6 +529,98 @@ export async function runPlanCommand(
     }
   }
 
+  // --- Seleccion determinista de skill (seccion 6.6/16.4.1, TASK-017) -
+  // Mismo criterio fail-closed que la heuristica de arriba: un catalogo
+  // mal formado aborta "plan" entero, nunca cae a "sin skill" en
+  // silencio. La diferencia es que aqui CERO candidatos tras cruzar
+  // etiquetas SI es un resultado valido (catalogo-skills.ts: el
+  // catalogo no es exhaustivo por diseno, a diferencia de la
+  // heuristica).
+  const catalogoSkills = cargarCatalogoSkills();
+  const seleccionSkill = seleccionarSkill(task, catalogoSkills);
+
+  let skillsRecomendadosFinal: string[] = [];
+  let reglaSeleccionSkillFinal: ReglaSeleccionSkill | null = null;
+  let avisoSkillSinCandidato: string | null = null;
+  let avisoSkillDesempatePendiente: string | null = null;
+  let avisoSkillNoInstalada: string | null = null;
+  let peticionDesempateSkillPath: string | null = null;
+
+  if (seleccionSkill.ganador !== null) {
+    skillsRecomendadosFinal = [seleccionSkill.ganador.id];
+    reglaSeleccionSkillFinal = seleccionSkill.regla;
+  } else if (seleccionSkill.candidatosEmpatados.length === 0) {
+    avisoSkillSinCandidato =
+      `Ningun skill de "${FICHERO_CATALOGO_SKILLS}" comparte etiquetas con ${task.id}: se deja ` +
+      'sin "skills_recomendados". No es un fallo -- el catalogo no tiene por que cubrir toda tarea.';
+  } else {
+    // Empate en solape Y en prioridad: el desempate barato no lo
+    // resuelve un calculo (16.4.1). La peticion se REGENERA siempre
+    // (es derivada, igual que peticionRolTemplate): si el catalogo
+    // cambio entre intentos, una peticion rancia listando candidatos
+    // que ya no empatan seria peor que no tener ninguna.
+    const peticionDesempatePath = path.join(planificacionDir, PETICION_DESEMPATE_SKILL_FILENAME);
+    const salidaDesempatePath = path.join(planificacionDir, SALIDA_DESEMPATE_SKILL_FILENAME);
+    await writeFile(
+      peticionDesempatePath,
+      peticionDesempateSkillTemplate(task, seleccionSkill.candidatosEmpatados, today),
+      { encoding: 'utf8' }
+    );
+    peticionDesempateSkillPath = peticionDesempatePath;
+    if (!(await ficheroConContenido(salidaDesempatePath))) {
+      await writeFile(salidaDesempatePath, salidaDesempateSkillTemplate(task), { encoding: 'utf8' });
+    }
+    const ganadorDesempate = (await ficheroConContenido(salidaDesempatePath))
+      ? leerGanadorDesempate(
+          await readFile(salidaDesempatePath, 'utf8'),
+          seleccionSkill.candidatosEmpatados
+        )
+      : null;
+    if (ganadorDesempate !== null) {
+      skillsRecomendadosFinal = [ganadorDesempate.id];
+      reglaSeleccionSkillFinal = 'llm';
+    } else {
+      avisoSkillDesempatePendiente =
+        `${seleccionSkill.candidatosEmpatados.length} skills empatan en solape y prioridad para ` +
+        `${task.id}: responde "${peticionDesempatePath}" en "${salidaDesempatePath}" y vuelve a ` +
+        'lanzar "taskctl plan" para dejarlo resuelto. Por ahora se deja sin "skills_recomendados".';
+    }
+  }
+
+  if (skillsRecomendadosFinal.length > 0) {
+    const entradaGanadora = catalogoSkills.find((e) => e.id === skillsRecomendadosFinal[0])!;
+    if (entradaGanadora.origen === 'externo') {
+      const estadoInstalacion = comprobarSkillInstalado(entradaGanadora.marketplace!);
+      if (estadoInstalacion !== 'instalado') {
+        // Texto identico al de la seccion 6.6 (punto 4): nunca se
+        // instala nada automaticamente, solo se anota la orden a
+        // ejecutar a mano. 'no-verificable' avisa igual que
+        // 'no-instalado' -- el riesgo aceptado es peor si se calla.
+        avisoSkillNoInstalada =
+          `Esta tarea se beneficiaria del skill "${entradaGanadora.id}" (marketplace ` +
+          `"${entradaGanadora.marketplace}") -- no esta instalado. Instalalo con "/plugin install ` +
+          `${entradaGanadora.id}@${entradaGanadora.marketplace}" antes de arrancar, o continua sin el.`;
+      }
+    }
+  }
+
+  // Re-planificacion (bucle B9->B5): sin esta comparacion,
+  // "skills_recomendados" ya fijado en una vuelta anterior se pisaba en
+  // silencio en cada "plan" -- misma trampa que asignadoCambiado ya
+  // cierra para "asignado_a".
+  const skillsRecomendadosCambiado =
+    skillsRecomendadosFinal.length !== task.skills_recomendados.length ||
+    skillsRecomendadosFinal.some((id, i) => id !== task.skills_recomendados[i]);
+
+  const updated: Task = {
+    ...task,
+    estado: 'en-diseno',
+    asignado_a: asignadoFinal,
+    actualizado: today,
+    skills_recomendados: skillsRecomendadosFinal,
+    regla_seleccion_skill: reglaSeleccionSkillFinal,
+  };
+
   // --- El paquete de brainstorm (TASK-016) ---------------------------
   // Se escribe en la carpeta ACTUAL y ANTES de mover la tarea, por el
   // mismo motivo que la peticion de revision en TASK-013: si una
@@ -811,5 +924,12 @@ export async function runPlanCommand(
     asignadoCambiado,
     avisoIdentidad,
     baseBranchGuard,
+    skillsRecomendados: skillsRecomendadosFinal,
+    reglaSeleccionSkill: reglaSeleccionSkillFinal,
+    skillsRecomendadosCambiado,
+    avisoSkillSinCandidato,
+    avisoSkillDesempatePendiente,
+    peticionDesempateSkill: peticionDesempateSkillPath,
+    avisoSkillNoInstalada,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
new file mode 100644
index 0000000..de1a73f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
@@ -0,0 +1,512 @@
+/**
+ * `scripts/catalogo-skills.yml` — lectura, validacion y el paso 1 de la
+ * seleccion determinista de skill que describe la seccion 6.6 de
+ * docs/PROPUESTA_METODOLOGIA.md (TASK-017).
+ *
+ * MISMA DOCTRINA QUE src/core/heuristica.ts, y por los mismos motivos:
+ * fallo cerrado al parsear (clave desconocida, clave obligatoria
+ * ausente, tipo equivocado o valor negativo ABORTAN taskctl entero, sin
+ * caida a un default silencioso), un solo parser (`parseBloqueClaveValor`
+ * de frontmatter.ts) y un solo punto de resolucion
+ * (`cargarCatalogoSkills`).
+ *
+ * LA UNICA DIFERENCIA DE FONDO CON heuristica.ts: alli las 22 claves
+ * cubren TODA tarea por construccion, asi que cualquier ausencia es un
+ * fallo. Aqui el catalogo es EXPLICITAMENTE NO EXHAUSTIVO — cero
+ * candidatos tras cruzar `etiquetas` con la tarea es un resultado
+ * VALIDO (seleccion vacia + aviso de quien llame), no un fallo de
+ * configuracion. Lo que si es fail-closed es el PARSEO del fichero: una
+ * entrada mal formada aborta igual que una heuristica mal formada.
+ *
+ * FORMATO APLANADO. El fichero no tiene anidamiento (el parser no lo
+ * soporta), asi que cada entrada del catalogo se aplana con el prefijo
+ * "skill_N_" en el nombre de la clave, N = posicion 1-based. La clave
+ * "total_skills" dice cuantos bloques hay que leer. El conjunto de
+ * claves validas depende de ese numero: se resuelve "total_skills"
+ * primero, y con el se construyen las claves esperadas antes de validar
+ * el resto — igual que "clave desconocida" en heuristica.ts, pero aqui
+ * el universo de claves validas no es una lista fija.
+ */
+import { readFileSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+import { parseBloqueClaveValor } from './frontmatter.js';
+import type { ReglaSeleccionSkill, Task } from './task.js';
+
+export class CatalogoSkillsError extends Error {
+  constructor(message: string) {
+    super(message);
+    this.name = 'CatalogoSkillsError';
+  }
+}
+
+export type OrigenSkill = 'taskcode-plugin' | 'externo';
+export type RolSkill = 'revisor' | 'ejecucion' | 'ambos';
+
+export const ORIGENES_SKILL: readonly OrigenSkill[] = ['taskcode-plugin', 'externo'];
+export const ROLES_SKILL: readonly RolSkill[] = ['revisor', 'ejecucion', 'ambos'];
+
+export interface EntradaCatalogoSkill {
+  id: string;
+  origen: OrigenSkill;
+  /** Solo si origen es "externo"; null en toda entrada "taskcode-plugin". */
+  marketplace: string | null;
+  rol: RolSkill;
+  prioridad: number;
+  etiquetas: string[];
+  patrones_archivo: string[];
+  descripcion: string;
+}
+
+export type CatalogoSkills = readonly EntradaCatalogoSkill[];
+
+/** Nombre del fichero dentro de `scripts/`. */
+export const FICHERO_CATALOGO_SKILLS = 'catalogo-skills.yml';
+
+const CAMPOS_SKILL_OBLIGATORIOS = [
+  'id',
+  'origen',
+  'rol',
+  'prioridad',
+  'etiquetas',
+  'patrones_archivo',
+  'descripcion',
+] as const;
+type CampoSkillObligatorio = (typeof CAMPOS_SKILL_OBLIGATORIOS)[number];
+const CAMPOS_SKILL_TODOS = [...CAMPOS_SKILL_OBLIGATORIOS, 'marketplace'] as const;
+type CampoSkill = (typeof CAMPOS_SKILL_TODOS)[number];
+
+const SKILL_KEY_RE =
+  /^skill_(\d+)_(id|origen|marketplace|rol|prioridad|etiquetas|patrones_archivo|descripcion)$/;
+
+function packageRoot(): string {
+  // dist/src/core/catalogo-skills.js -> dist/src/core -> dist/src -> dist -> raiz
+  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+  return path.join(moduleDir, '..', '..', '..');
+}
+
+/**
+ * Ruta del YML. Mismo patron que resolverRutaHeuristica(): respeta
+ * CLAUDE_PLUGIN_ROOT si esta definida; si no, calcula la ruta relativa
+ * al propio modulo compilado.
+ */
+export function resolverRutaCatalogoSkills(): string {
+  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
+    return path.join(pluginRoot, 'scripts', FICHERO_CATALOGO_SKILLS);
+  }
+  return path.join(packageRoot(), 'scripts', FICHERO_CATALOGO_SKILLS);
+}
+
+/**
+ * EL punto de resolucion. Lee el fichero y lo valida, o lanza
+ * CatalogoSkillsError. No hay caso de "no hay fichero, sigue sin
+ * skills": el YML lo distribuye el plugin, igual que
+ * heuristica-complejidad.yml, asi que si falta la instalacion esta
+ * rota.
+ */
+export function cargarCatalogoSkills(ruta?: string): CatalogoSkills {
+  const rutaFinal = ruta ?? resolverRutaCatalogoSkills();
+  let contenido: string;
+  try {
+    contenido = readFileSync(rutaFinal, 'utf8');
+  } catch (e: unknown) {
+    const msg = e instanceof Error ? e.message : String(e);
+    throw new CatalogoSkillsError(
+      `[ERROR] No se pudo leer el catalogo de skills "${rutaFinal}": ${msg}\n` +
+        '        Ese fichero lo trae el plugin. Reinstalalo, o define CLAUDE_PLUGIN_ROOT\n' +
+        '        apuntando a la raiz del plugin si lo ejecutas desde otro sitio.'
+    );
+  }
+  return parsearCatalogoSkills(contenido, rutaFinal);
+}
+
+/**
+ * Separada de cargarCatalogoSkills para poder probar el parseo y la
+ * validacion sin disco.
+ */
+export function parsearCatalogoSkills(contenido: string, ruta: string): CatalogoSkills {
+  const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
+    etiqueta: 'catalogo de skills',
+    crearError: (mensaje) => new CatalogoSkillsError(`[ERROR] ${ruta}: ${mensaje}`),
+    permitirComentariosDeLinea: true,
+  });
+
+  // (1) total_skills se resuelve ANTES que nada: el universo de claves
+  // validas depende de su valor, asi que hay que conocerlo antes de
+  // poder decir "clave desconocida" de cualquier otra.
+  const paresTotal = pares.filter((p) => p.clave === 'total_skills');
+  if (paresTotal.length === 0) {
+    throw new CatalogoSkillsError(mensajeClaveAusente(ruta, 'total_skills'));
+  }
+  if (paresTotal.length > 1) {
+    const segundo = paresTotal[1] as (typeof paresTotal)[number];
+    throw new CatalogoSkillsError(mensajeClaveRepetida(`${ruta}:${segundo.numeroLinea}`, 'total_skills'));
+  }
+  const primerTotal = paresTotal[0] as (typeof paresTotal)[number];
+  const totalSkills = validarEnteroNoNegativo(
+    `${ruta}:${primerTotal.numeroLinea}`,
+    'total_skills',
+    primerTotal.valor
+  );
+
+  const clavesValidas = construirClavesValidas(totalSkills);
+
+  // (2) Recorrido completo: clave desconocida / repetida, y agrupacion
+  // por bloque N. Misma doctrina que heuristica.ts, pero aqui el Set de
+  // claves validas es dinamico en vez de una lista fija.
+  const vistas = new Set<string>();
+  const bloques = new Map<number, Partial<Record<CampoSkill, { valor: unknown; numeroLinea: number }>>>();
+  for (const par of pares) {
+    const donde = `${ruta}:${par.numeroLinea}`;
+    if (!clavesValidas.has(par.clave)) {
+      throw new CatalogoSkillsError(mensajeClaveDesconocida(donde, par.clave, clavesValidas));
+    }
+    if (vistas.has(par.clave)) {
+      throw new CatalogoSkillsError(mensajeClaveRepetida(donde, par.clave));
+    }
+    vistas.add(par.clave);
+
+    if (par.clave === 'total_skills') continue;
+
+    const m = SKILL_KEY_RE.exec(par.clave) as RegExpExecArray;
+    const n = Number(m[1]);
+    const campo = m[2] as CampoSkill;
+    const bloque = bloques.get(n) ?? {};
+    bloque[campo] = { valor: par.valor, numeroLinea: par.numeroLinea };
+    bloques.set(n, bloque);
+  }
+
+  // (3) Una entrada por cada N de 1 a totalSkills, exigiendo sus
+  // obligatorias. Un bloque ausente o a medias sale por la misma puerta
+  // que cualquier otra clave obligatoria que falte: mensajeClaveAusente.
+  const catalogo: EntradaCatalogoSkill[] = [];
+  for (let n = 1; n <= totalSkills; n++) {
+    catalogo.push(construirEntrada(bloques.get(n) ?? {}, n, ruta));
+  }
+
+  validarIdsUnicos(catalogo, ruta);
+
+  return catalogo;
+}
+
+function construirClavesValidas(totalSkills: number): Set<string> {
+  const claves = new Set<string>(['total_skills']);
+  for (let n = 1; n <= totalSkills; n++) {
+    for (const campo of CAMPOS_SKILL_TODOS) {
+      claves.add(`skill_${n}_${campo}`);
+    }
+  }
+  return claves;
+}
+
+type CampoValor = { valor: unknown; numeroLinea: number } | undefined;
+
+function exigirCampo(
+  bloque: Partial<Record<CampoSkill, { valor: unknown; numeroLinea: number }>>,
+  campo: CampoSkillObligatorio,
+  n: number,
+  ruta: string
+): { valor: unknown; numeroLinea: number } {
+  const c = bloque[campo];
+  if (c === undefined) {
+    throw new CatalogoSkillsError(mensajeClaveAusente(ruta, `skill_${n}_${campo}`));
+  }
+  return c;
+}
+
+function construirEntrada(
+  bloque: Partial<Record<CampoSkill, { valor: unknown; numeroLinea: number }>>,
+  n: number,
+  ruta: string
+): EntradaCatalogoSkill {
+  const prefijo = `skill_${n}_`;
+
+  const cId = exigirCampo(bloque, 'id', n, ruta);
+  const id = validarTextoNoVacio(`${ruta}:${cId.numeroLinea}`, `${prefijo}id`, cId.valor);
+
+  const cOrigen = exigirCampo(bloque, 'origen', n, ruta);
+  const origen = validarEnum(`${ruta}:${cOrigen.numeroLinea}`, `${prefijo}origen`, cOrigen.valor, ORIGENES_SKILL);
+
+  const cRol = exigirCampo(bloque, 'rol', n, ruta);
+  const rol = validarEnum(`${ruta}:${cRol.numeroLinea}`, `${prefijo}rol`, cRol.valor, ROLES_SKILL);
+
+  const cPrioridad = exigirCampo(bloque, 'prioridad', n, ruta);
+  const prioridad = validarEnteroNoNegativo(
+    `${ruta}:${cPrioridad.numeroLinea}`,
+    `${prefijo}prioridad`,
+    cPrioridad.valor
+  );
+
+  const cEtiquetas = exigirCampo(bloque, 'etiquetas', n, ruta);
+  const etiquetas = validarListaDeTexto(
+    `${ruta}:${cEtiquetas.numeroLinea}`,
+    `${prefijo}etiquetas`,
+    cEtiquetas.valor,
+    1
+  );
+
+  const cPatrones = exigirCampo(bloque, 'patrones_archivo', n, ruta);
+  const patrones_archivo = validarListaDeTexto(
+    `${ruta}:${cPatrones.numeroLinea}`,
+    `${prefijo}patrones_archivo`,
+    cPatrones.valor,
+    0
+  );
+
+  const cDescripcion = exigirCampo(bloque, 'descripcion', n, ruta);
+  const descripcion = validarTextoNoVacio(
+    `${ruta}:${cDescripcion.numeroLinea}`,
+    `${prefijo}descripcion`,
+    cDescripcion.valor
+  );
+
+  const cMarketplace: CampoValor = bloque['marketplace'];
+  let marketplace: string | null;
+  if (origen === 'externo') {
+    if (cMarketplace === undefined) {
+      throw new CatalogoSkillsError(
+        mensajeClaveAusente(ruta, `${prefijo}marketplace`) +
+          `\n        Obligatoria cuando "${prefijo}origen" es "externo": sin ella no se puede\n` +
+          '        anotar "/plugin install X@Y" para un skill que no este instalado (paso 4\n' +
+          '        de la seccion 6.6).'
+      );
+    }
+    marketplace = validarTextoNoVacio(`${ruta}:${cMarketplace.numeroLinea}`, `${prefijo}marketplace`, cMarketplace.valor);
+  } else {
+    if (cMarketplace !== undefined) {
+      throw new CatalogoSkillsError(
+        `[ERROR] ${ruta}:${cMarketplace.numeroLinea}: "${prefijo}marketplace" no tiene sentido ` +
+          `con "${prefijo}origen: taskcode-plugin".\n` +
+          '        Ese campo solo existe para anotar de que marketplace se instala un skill\n' +
+          '        externo; uno empaquetado con el plugin ya viene instalado. Borra la linea\n' +
+          '        o corrige el origen.'
+      );
+    }
+    marketplace = null;
+  }
+
+  return { id, origen, marketplace, rol, prioridad, etiquetas, patrones_archivo, descripcion };
+}
+
+function validarIdsUnicos(catalogo: readonly EntradaCatalogoSkill[], ruta: string): void {
+  const vistos = new Map<string, number>();
+  catalogo.forEach((entrada, idx) => {
+    const otro = vistos.get(entrada.id);
+    if (otro !== undefined) {
+      throw new CatalogoSkillsError(
+        `[ERROR] ${ruta}: el id "${entrada.id}" se repite en las entradas ${otro + 1} y ${idx + 1}.\n` +
+          '        Cada "skill_N_id" debe ser unico en todo el catalogo: taskctl lo usa para\n' +
+          '        identificar la skill ganadora en "skills_recomendados".'
+      );
+    }
+    vistos.set(entrada.id, idx);
+  });
+}
+
+// --- Validadores tipados (mismo criterio que heuristica.ts) -----------
+
+function validarEnteroNoNegativo(donde: string, clave: string, valor: unknown): number {
+  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
+    throw new CatalogoSkillsError(
+      `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 0, ` +
+        `y es ${describirValor(valor)}.\n` +
+        '        Escribe el numero sin comillas y sin decimales.'
+    );
+  }
+  return valor;
+}
+
+function validarTextoNoVacio(donde: string, clave: string, valor: unknown): string {
+  if (typeof valor !== 'string' || valor.trim() === '') {
+    throw new CatalogoSkillsError(
+      `[ERROR] ${donde}: "${clave}" debe ser texto no vacio, y es ${describirValor(valor)}.`
+    );
+  }
+  return valor.trim();
+}
+
+function validarEnum<T extends string>(
+  donde: string,
+  clave: string,
+  valor: unknown,
+  permitidos: readonly T[]
+): T {
+  if (typeof valor !== 'string' || !(permitidos as readonly string[]).includes(valor)) {
+    throw new CatalogoSkillsError(
+      `[ERROR] ${donde}: "${clave}" tiene el valor ${describirValor(valor)}, pero debe ser uno de: ` +
+        `${permitidos.join(', ')}.`
+    );
+  }
+  return valor as T;
+}
+
+/**
+ * Lista de textos no vacios ni repetidos. `minimo` distingue
+ * `etiquetas` (>=1: una entrada sin etiquetas nunca podria coincidir
+ * con ninguna tarea por solape, seria un candidato imposible) de
+ * `patrones_archivo` (>=0: vacia es el caso legitimo de un skill que no
+ * se enruta por extension de fichero).
+ */
+function validarListaDeTexto(donde: string, clave: string, valor: unknown, minimo: number): string[] {
+  if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string')) {
+    throw new CatalogoSkillsError(
+      `[ERROR] ${donde}: "${clave}" debe ser una lista de textos entre corchetes ` +
+        `(p. ej. [a, b]), y es ${describirValor(valor)}.`
+    );
+  }
+  const entradas = (valor as string[]).map((x) => x.trim());
+  if (entradas.some((x) => x === '')) {
+    throw new CatalogoSkillsError(`[ERROR] ${donde}: "${clave}" tiene alguna entrada vacia.`);
+  }
+  const repetida = entradas.find((x, i) => entradas.indexOf(x) !== i);
+  if (repetida !== undefined) {
+    throw new CatalogoSkillsError(
+      `[ERROR] ${donde}: "${clave}" tiene la entrada "${repetida}" repetida.`
+    );
+  }
+  if (entradas.length < minimo) {
+    throw new CatalogoSkillsError(
+      `[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
+        '        Una entrada de catalogo sin etiquetas nunca puede coincidir con ninguna\n' +
+        '        tarea por solape: seria un candidato imposible. Anadele al menos una.'
+    );
+  }
+  return entradas;
+}
+
+function describirValor(valor: unknown): string {
+  if (valor === null) return 'un valor vacio';
+  if (Array.isArray(valor)) return `una lista (${JSON.stringify(valor)})`;
+  if (typeof valor === 'string') return `el texto "${valor}"`;
+  return `${String(valor)} (${typeof valor})`;
+}
+
+function mensajeClaveAusente(ruta: string, clave: string): string {
+  return (
+    `[ERROR] ${ruta}: falta la clave obligatoria "${clave}".\n` +
+    `        Anade la linea "${clave}: <valor>" o restaura el catalogo que trae el plugin.`
+  );
+}
+
+function mensajeClaveRepetida(donde: string, clave: string): string {
+  return (
+    `[ERROR] ${donde}: la clave "${clave}" esta repetida.\n` +
+    '        Deja solo una: con dos, el fichero dice una cosa y taskctl usaria otra.'
+  );
+}
+
+/**
+ * Enumera las claves validas y, si la escrita se parece a una de ellas,
+ * la propone. El universo de claves aqui es dinamico (depende de
+ * `total_skills`), a diferencia de CLAVES_HEURISTICA.
+ */
+function mensajeClaveDesconocida(donde: string, clave: string, validas: ReadonlySet<string>): string {
+  const sugerida = claveMasParecida(clave, validas);
+  const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
+  if (sugerida !== null) lineas.push(`        Quiza quisiste decir "${sugerida}".`);
+  lineas.push('        Borrala o corrigela: taskctl no usa un catalogo que no entiende.');
+  lineas.push(
+    '        Si es una entrada nueva, recuerda subir "total_skills" para que su bloque cuente.'
+  );
+  return lineas.join('\n');
+}
+
+function claveMasParecida(clave: string, validas: ReadonlySet<string>): string | null {
+  let mejor: string | null = null;
+  let mejorDistancia = Number.POSITIVE_INFINITY;
+  for (const valida of validas) {
+    const d = distanciaEdicion(clave.toLowerCase(), valida);
+    if (d < mejorDistancia) {
+      mejorDistancia = d;
+      mejor = valida;
+    }
+  }
+  return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
+}
+
+/** Distancia de edicion (Levenshtein) a mano — cero dependencias. */
+function distanciaEdicion(a: string, b: string): number {
+  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
+  for (let i = 1; i <= a.length; i++) {
+    const actual = [i];
+    for (let j = 1; j <= b.length; j++) {
+      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
+      actual[j] = Math.min(
+        (actual[j - 1] as number) + 1,
+        (previa[j] as number) + 1,
+        (previa[j - 1] as number) + coste
+      );
+    }
+    previa = actual;
+  }
+  return previa[b.length] as number;
+}
+
+// --- Paso 1 de la seccion 6.6: solape de etiquetas + desempate --------
+
+export interface SeleccionSkill {
+  /** La entrada ganadora, o null si no hubo candidatos o si el empate
+   *  llega hasta prioridad (hace falta el LLM, fuera de esta funcion). */
+  ganador: EntradaCatalogoSkill | null;
+  regla: ReglaSeleccionSkill | null;
+  /**
+   * Los 2+ candidatos que empataron en solape Y en prioridad, para que
+   * quien orqueste (TASK-017, item 5, en commands/plan.ts) dispare el
+   * desempate barato con un modelo (seccion 16.4.1). Vacio en cualquier
+   * otro caso. Esta funcion NUNCA invoca un modelo — ese reparto es el
+   * mismo que fijo TASK-013 para "taskctl review".
+   */
+  candidatosEmpatados: readonly EntradaCatalogoSkill[];
+}
+
+/**
+ * Paso 1 de 6.6: cruza `task.etiquetas` contra las `etiquetas` de cada
+ * entrada del catalogo. Candidatos = solape > 0. Desempate: primero por
+ * mayor solape, despues por mayor `prioridad` (16.4.1). Si sigue habiendo
+ * empate, se devuelve ese conjunto para el LLM.
+ *
+ * NO filtra por `rol`: plan-final.md no lo pide, y limitar aqui a
+ * rol=ejecucion dejaria fuera candidatos "ambos" sin ninguna razon
+ * documentada. Si algun dia hace falta, que sea una decision explicita
+ * y no un olvido — mismo criterio de "decirlo, no disimularlo" que sigue
+ * heuristica.ts con sus claves sin consumidor.
+ *
+ * Cero candidatos con solape > 0 es un resultado VALIDO (catalogo no
+ * exhaustivo por diseño): se devuelve `ganador: null, regla: null,
+ * candidatosEmpatados: []`, y quien llame decide como avisarlo.
+ */
+export function seleccionarSkill(task: Task, catalogo: CatalogoSkills): SeleccionSkill {
+  const etiquetasTarea = new Set(task.etiquetas);
+
+  const conSolape = catalogo
+    .map((entrada) => ({
+      entrada,
+      solape: entrada.etiquetas.filter((e) => etiquetasTarea.has(e)).length,
+    }))
+    .filter((x) => x.solape > 0);
+
+  if (conSolape.length === 0) {
+    return { ganador: null, regla: null, candidatosEmpatados: [] };
+  }
+
+  const solapeMax = Math.max(...conSolape.map((x) => x.solape));
+  const porSolape = conSolape.filter((x) => x.solape === solapeMax).map((x) => x.entrada);
+
+  if (porSolape.length === 1) {
+    return { ganador: porSolape[0] as EntradaCatalogoSkill, regla: 'solape', candidatosEmpatados: [] };
+  }
+
+  const prioridadMax = Math.max(...porSolape.map((e) => e.prioridad));
+  const porPrioridad = porSolape.filter((e) => e.prioridad === prioridadMax);
+
+  if (porPrioridad.length === 1) {
+    return {
+      ganador: porPrioridad[0] as EntradaCatalogoSkill,
+      regla: 'prioridad',
+      candidatosEmpatados: [],
+    };
+  }
+
+  return { ganador: null, regla: null, candidatosEmpatados: porPrioridad };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts
new file mode 100644
index 0000000..4741690
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-desempate-skill.ts
@@ -0,0 +1,85 @@
+/**
+ * Peticion/salida para el desempate barato de skill (seccion 16.4.1 de
+ * docs/PROPUESTA_METODOLOGIA.md, TASK-017 item 5 del plan). Solo entra
+ * en juego cuando seleccionarSkill() (catalogo-skills.ts) devuelve dos
+ * o mas `candidatosEmpatados` — empate en solape de etiquetas Y en
+ * prioridad declarada, que un calculo determinista ya no puede romper.
+ *
+ * Mismo reparto que TASK-013 fijo para "taskctl review" y TASK-016 para
+ * el brainstorm de rol: plan.ts nunca invoca un modelo, deja escrita la
+ * peticion y para. A diferencia del brainstorm, aqui NO hay numeracion
+ * de rondas: el nombre es fijo, con un "-1" literal, porque el registro
+ * que produce (`skills_recomendados` / `regla_seleccion_skill` en el
+ * frontmatter) se trata como DERIVADO y se recalcula siempre desde el
+ * catalogo actual en cada "taskctl plan", nunca como estado a preservar
+ * entre reintentos — si el catalogo cambia entre dos invocaciones, una
+ * peticion de una ronda anterior listando candidatos que ya no empatan
+ * seria peor que no tener ninguna.
+ */
+import type { Task } from './task.js';
+import type { EntradaCatalogoSkill } from './catalogo-skills.js';
+
+export const PETICION_DESEMPATE_SKILL_FILENAME = 'peticion-desempate-skill-1.md';
+export const SALIDA_DESEMPATE_SKILL_FILENAME = 'salida-desempate-skill-1.md';
+
+export function peticionDesempateSkillTemplate(
+  task: Task,
+  candidatos: readonly EntradaCatalogoSkill[],
+  fecha: string
+): string {
+  const filas = candidatos
+    .map(
+      (c) =>
+        `- \`${c.id}\` (prioridad ${c.prioridad}, rol ${c.rol}): ${c.descripcion}\n` +
+        `  etiquetas: ${c.etiquetas.join(', ')}\n`
+    )
+    .join('');
+  const etiquetasTarea = task.etiquetas.length === 0 ? '(sin etiquetas)' : task.etiquetas.join(', ');
+  return (
+    `# Peticion de desempate de skill — ${task.id}\n\n` +
+    `- Tarea: ${task.id} — ${task.titulo}\n` +
+    `- Fecha: ${fecha}\n` +
+    `- Vuelca tu respuesta en: \`${SALIDA_DESEMPATE_SKILL_FILENAME}\`\n\n` +
+    '## Por que te llamamos\n\n' +
+    `Estos ${candidatos.length} skills del catalogo empatan en solape de etiquetas contra esta ` +
+    'tarea y tambien en prioridad declarada. El desempate que sigue no lo resuelve un calculo ' +
+    'determinista.\n\n' +
+    '## Candidatos empatados\n\n' +
+    filas +
+    '\n## Etiquetas de la tarea\n\n' +
+    `${etiquetasTarea}\n\n` +
+    '## Como entregas\n\n' +
+    `Escribe en \`${SALIDA_DESEMPATE_SKILL_FILENAME}\` una unica linea con el \`id\` EXACTO (tal ` +
+    'cual aparece arriba) del candidato que mejor encaje con esta tarea concreta — taskctl solo ' +
+    'lee la primera linea no vacia. Puedes anadir tu razonamiento en lineas siguientes.\n\n' +
+    '## Reglas\n\n' +
+    '- Eliges uno de los candidatos de arriba, tal cual. Cualquier otro texto en esa primera ' +
+    'linea se trata como respuesta invalida y taskctl la ignora.\n' +
+    '- Evidencia, no suposicion: basate en el objetivo real de la tarea, no solo en las ' +
+    'etiquetas que ya empataron.\n'
+  );
+}
+
+/**
+ * Scaffold vacio de la salida, igual de minimo que el de un rol de
+ * brainstorm: solo el sitio donde escribir, sin invencion de contenido.
+ */
+export function salidaDesempateSkillTemplate(task: Task): string {
+  return `# Salida del desempate de skill — ${task.id}\n\n(pendiente de completar)\n`;
+}
+
+/**
+ * Ganador declarado en la salida ya escrita, o null si esta vacia o si
+ * su primera linea no coincide EXACTAMENTE con el `id` de uno de los
+ * candidatos vigentes (respuesta a medio escribir, catalogo editado
+ * entre la peticion y la respuesta, etc.). Fail-closed: una salida que
+ * no se puede interpretar sin ambiguedad no elige un candidato al azar.
+ */
+export function leerGanadorDesempate(
+  contenido: string,
+  candidatos: readonly EntradaCatalogoSkill[]
+): EntradaCatalogoSkill | null {
+  const primeraLinea = contenido.split(/\r?\n/).find((l) => l.trim() !== '')?.trim() ?? '';
+  if (primeraLinea === '') return null;
+  return candidatos.find((c) => c.id === primeraLinea) ?? null;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
new file mode 100644
index 0000000..dd79ef7
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
@@ -0,0 +1,88 @@
+/**
+ * Comprueba si un skill "externo" del catalogo (catalogo-skills.ts) ya
+ * esta instalado en esta maquina, para el paso 4 de la seccion 6.6:
+ * anotar "/plugin install X@Y" solo cuando de verdad haga falta.
+ *
+ * Vive aparte de catalogo-skills.ts y de commands/plan.ts porque es la
+ * unica pieza de la seleccion de skill que sale a un subproceso, y
+ * aislarla evita que un fallo de "claude plugin list" se confunda con
+ * un fallo de parseo del catalogo.
+ *
+ * Mismo patron de subproceso que runGit() en fs/git.ts (spawnSync +
+ * comprobar result.error / result.status), pero con una semantica de
+ * error DISTINTA a proposito: runGit() LANZA porque un fallo de Git
+ * debe abortar el comando que lo pidio. Aqui un fallo del subproceso
+ * (binario ausente, timeout, JSON mal formado, forma inesperada) NUNCA
+ * aborta "taskctl plan" — se colapsa en 'no-verificable', que es un
+ * estado de negocio valido, no una excepcion. Riesgo aceptado en
+ * plan-final.md: mejor no confirmar nada que arriesgar una instalacion
+ * automatica ('no-instalado' erroneo dispararia la sugerencia de
+ * instalar algo que ya esta) o esconder un candidato real que falta
+ * ('instalado' erroneo por defecto).
+ *
+ * El formato exacto de "claude plugin list --json" quedo sin verificar
+ * a mano en la seccion 6.6 de la metodologia ("a confirmar en Sprint
+ * 0"): se asume un array de objetos con un campo `marketplace`, y
+ * cualquier forma que no encaje con eso tambien cae en
+ * 'no-verificable' en vez de asumirse como 'no-instalado'.
+ */
+import { spawnSync } from 'node:child_process';
+
+export type EstadoInstalacionSkill = 'instalado' | 'no-instalado' | 'no-verificable';
+
+const TIMEOUT_MS = 5000;
+
+interface ResultadoPluginList {
+  error?: Error | undefined;
+  status: number | null;
+  stdout: string | null;
+}
+
+/**
+ * Separada de comprobarSkillInstalado para poder probar cada desenlace
+ * (binario ausente, timeout, status != 0, JSON mal formado, forma
+ * inesperada, encontrado/no encontrado) con datos literales, sin lanzar
+ * un subproceso real — mismo motivo por el que parsearCatalogoSkills
+ * vive aparte de cargarCatalogoSkills en catalogo-skills.ts.
+ */
+export function interpretarResultadoPluginList(
+  result: ResultadoPluginList,
+  marketplace: string
+): EstadoInstalacionSkill {
+  if (result.error || result.status !== 0 || typeof result.stdout !== 'string') {
+    return 'no-verificable';
+  }
+
+  let lista: unknown;
+  try {
+    lista = JSON.parse(result.stdout);
+  } catch {
+    return 'no-verificable';
+  }
+  if (!Array.isArray(lista)) {
+    return 'no-verificable';
+  }
+
+  const instalado = lista.some(
+    (entrada) =>
+      typeof entrada === 'object' &&
+      entrada !== null &&
+      (entrada as { marketplace?: unknown }).marketplace === marketplace
+  );
+  return instalado ? 'instalado' : 'no-instalado';
+}
+
+export function comprobarSkillInstalado(marketplace: string): EstadoInstalacionSkill {
+  const result = spawnSync('claude', ['plugin', 'list', '--json'], {
+    encoding: 'utf8',
+    timeout: TIMEOUT_MS,
+  });
+  return interpretarResultadoPluginList(
+    {
+      error: result.error,
+      status: result.status,
+      stdout: typeof result.stdout === 'string' ? result.stdout : null,
+    },
+    marketplace
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
index 6e5fe18..1148a1a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
@@ -12,6 +12,20 @@ export type TaskState =
   | 'en-curso'
   | 'en-revision'
   | 'terminada';
+/**
+ * Que regla decidio la skill ganadora en `skills_recomendados` (seccion
+ * 6.6, TASK-017): "solape" si gano por interseccion de etiquetas sin
+ * empate, "prioridad" si desempato la prioridad declarada en el
+ * catalogo, "llm" si ni el solape ni la prioridad desempataron y una
+ * consulta barata al modelo decidio entre el top-N. `null` cuando no
+ * hubo seleccion (ningun candidato solapo etiquetas).
+ */
+export type ReglaSeleccionSkill = 'solape' | 'prioridad' | 'llm';
+export const REGLAS_SELECCION_SKILL: readonly ReglaSeleccionSkill[] = [
+  'solape',
+  'prioridad',
+  'llm',
+];
 
 export const TASK_TYPES: readonly TaskType[] = ['feature', 'fix', 'hotfix', 'release'];
 export const TASK_COMPLEXITIES: readonly TaskComplexity[] = [
@@ -52,6 +66,7 @@ export interface Task {
   asignado_a: string | null;
   agente_revisor: string;
   skills_recomendados: string[];
+  regla_seleccion_skill: ReglaSeleccionSkill | null;
   ultimo_commit_revisado: string | null;
   revision_codex: boolean;
   creado: string;
@@ -88,6 +103,7 @@ export const TASK_FIELD_ORDER: readonly (keyof Task)[] = [
   'asignado_a',
   'agente_revisor',
   'skills_recomendados',
+  'regla_seleccion_skill',
   'ultimo_commit_revisado',
   'revision_codex',
   'creado',
@@ -190,6 +206,22 @@ function requireEnum<T extends string>(
   return v as T;
 }
 
+function requireNullableEnum<T extends string>(
+  data: Record<string, unknown>,
+  field: string,
+  allowed: readonly T[]
+): T | null {
+  const v = data[field];
+  if (v === null || v === undefined) return null;
+  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v)) {
+    fail(
+      field,
+      `El campo "${field}" debe ser null o uno de: ${allowed.join(', ')}.`
+    );
+  }
+  return v as T;
+}
+
 /**
  * Valida y convierte un objeto generico (tal como lo devuelve
  * parseFrontmatter) en un Task tipado. Lanza TaskValidationError con
@@ -215,6 +247,11 @@ export function validateTask(data: Record<string, unknown>): Task {
     asignado_a: requireNullableString(data, 'asignado_a'),
     agente_revisor: requireString(data, 'agente_revisor'),
     skills_recomendados: requireStringArray(data, 'skills_recomendados'),
+    regla_seleccion_skill: requireNullableEnum(
+      data,
+      'regla_seleccion_skill',
+      REGLAS_SELECCION_SKILL
+    ),
     ultimo_commit_revisado: requireNullableString(data, 'ultimo_commit_revisado'),
     revision_codex: requireBoolean(data, 'revision_codex'),
     creado: requireString(data, 'creado'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
index 36efabb..6225cb5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
@@ -35,6 +35,7 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     asignado_a: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-03',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
index 093377a..c9a9008 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
@@ -72,6 +72,7 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     asignado_a: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-07',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
index 59a955d..40ad491 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
@@ -35,6 +35,7 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     asignado_a: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-05',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
index 4a02e2c..a5af91a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
@@ -55,6 +55,7 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     asignado_a: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-08',
@@ -1354,6 +1355,16 @@ test('src/ no contiene ninguna invocacion a un modelo ni ninguna llamada de red'
     { patron: /anthropic|openai/i, que: 'una referencia a una API de modelos' },
   ];
 
+  // TASK-017 (plan-final.md, riesgo aceptado): plugin-instalado.ts invoca
+  // `spawnSync('claude', ['plugin', 'list', '--json'], ...)` para comprobar
+  // si un skill externo ya esta instalado. No es una invocacion a un
+  // modelo/agente -- es una consulta de solo lectura a la gestion de
+  // plugins del propio CLI de Claude Code, la misma distincion que hace el
+  // criterio de aceptacion 5 al hablar de "llamadas reales a agentes".
+  // Se excluye solo el patron 'claude' y solo para este fichero: el resto
+  // de patrones (fetch, http, anthropic/openai) siguen aplicando.
+  const EXCEPCIONES_INVOCACION_CLAUDE = new Set(['core/plugin-instalado.ts']);
+
   async function ficherosTs(dir: string): Promise<string[]> {
     const salida: string[] = [];
     for (const entrada of await readdir(dir, { withFileTypes: true })) {
@@ -1368,10 +1379,12 @@ test('src/ no contiene ninguna invocacion a un modelo ni ninguna llamada de red'
   assert.ok(ficheros.length > 10, `precondicion: se esperaban muchos .ts, hay ${ficheros.length}`);
 
   for (const fichero of ficheros) {
+    const relativo = path.relative(path.join(PACKAGE_ROOT, 'src'), fichero).split(path.sep).join('/');
     const contenido = await readFile(fichero, 'utf8');
     for (const { patron, que } of prohibidos) {
+      const esExcepcion = patron.source === /['"`]claude['"`]/.source && EXCEPCIONES_INVOCACION_CLAUDE.has(relativo);
       assert.ok(
-        !patron.test(contenido),
+        esExcepcion || !patron.test(contenido),
         `${path.relative(PACKAGE_ROOT, fichero)} contiene ${que}: el CLI no puede llamar a ningun modelo`
       );
     }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
index 9371f81..2609b34 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
@@ -9,6 +9,7 @@ import assert from 'node:assert/strict';
 import { mkdtemp, mkdir, rm, readFile, writeFile, stat, chmod } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
+import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
 import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
 import {
@@ -17,10 +18,17 @@ import {
   PLAN_FINAL_FILENAME,
   PLANIFICACION_DIRNAME,
 } from '../../src/commands/plan.js';
+import {
+  PETICION_DESEMPATE_SKILL_FILENAME,
+  SALIDA_DESEMPATE_SKILL_FILENAME,
+} from '../../src/core/plan-desempate-skill.js';
 import { StateMachineError } from '../../src/core/state-machine.js';
 import { BaseBranchGuardError } from '../../src/fs/git.js';
 import type { Task } from '../../src/core/task.js';
 
+const RAIZ_PAQUETE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
+const RUTA_HEURISTICA_REAL = path.join(RAIZ_PAQUETE, 'scripts', 'heuristica-complejidad.yml');
+
 function sampleTask(overrides: Partial<Task> = {}): Task {
   return {
     id: 'TASK-700',
@@ -36,6 +44,7 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     asignado_a: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-03',
@@ -673,3 +682,125 @@ test('taskctl plan: NO comprueba el limite de WIP, aunque la persona tenga una t
     assert.equal(read?.task.asignado_a, 'carlos');
   });
 });
+
+// --- TASK-017: seleccion determinista de skill ------------------------
+
+test('taskctl plan: una etiqueta que solapa con un unico skill del catalogo real lo deja en skills_recomendados', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ etiquetas: ['taskctl'] }), BODY_CON_OBJETIVO);
+    commitAll(repoRoot, 'tarea TASK-700 con etiqueta taskctl');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot });
+
+    assert.deepEqual(result.skillsRecomendados, ['task-workflow']);
+    assert.equal(result.reglaSeleccionSkill, 'solape');
+    assert.equal(result.skillsRecomendadosCambiado, true);
+    assert.equal(result.avisoSkillSinCandidato, null);
+    assert.equal(result.avisoSkillDesempatePendiente, null);
+    assert.equal(result.peticionDesempateSkill, null);
+    assert.equal(result.avisoSkillNoInstalada, null);
+
+    const read = await readTareaFile(tareasRoot, 'TASK-700');
+    assert.deepEqual(read?.task.skills_recomendados, ['task-workflow']);
+    assert.equal(read?.task.regla_seleccion_skill, 'solape');
+  });
+});
+
+test('taskctl plan: un empate en solape y prioridad escribe la peticion de desempate y deja skills_recomendados vacio', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // angular-vue-reviewer y java-spring-reviewer empatan: solape 1
+    // (frontend / backend respectivamente) y misma prioridad (10).
+    await writeTareaFile(tareasRoot, sampleTask({ etiquetas: ['frontend', 'backend'] }), BODY_CON_OBJETIVO);
+    commitAll(repoRoot, 'tarea TASK-700 con etiquetas de dos dominios');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot });
+
+    assert.deepEqual(result.skillsRecomendados, []);
+    assert.equal(result.reglaSeleccionSkill, null);
+    assert.equal(result.skillsRecomendadosCambiado, false);
+    assert.equal(result.avisoSkillSinCandidato, null);
+    assert.ok(result.avisoSkillDesempatePendiente !== null);
+    assert.match(result.avisoSkillDesempatePendiente!, /2 skills empatan/);
+    assert.ok(result.peticionDesempateSkill !== null);
+
+    // result.peticionDesempateSkill se calcula sobre la carpeta de ORIGEN
+    // antes del rename, y no se reescribe tras el move -- esa ruta ya no
+    // existe en disco. moveTareaFile se lleva planificacion/ entera a la
+    // carpeta de DESTINO, que hay que reconstruir a partir de filePath.
+    const planificacionDestino = path.join(path.dirname(result.filePath), PLANIFICACION_DIRNAME);
+    const peticionContent = await readFile(
+      path.join(planificacionDestino, PETICION_DESEMPATE_SKILL_FILENAME),
+      'utf8'
+    );
+    assert.match(peticionContent, /angular-vue-reviewer/);
+    assert.match(peticionContent, /java-spring-reviewer/);
+
+    const salidaContent = await readFile(
+      path.join(planificacionDestino, SALIDA_DESEMPATE_SKILL_FILENAME),
+      'utf8'
+    );
+    assert.match(salidaContent, /TASK-700/);
+
+    const read = await readTareaFile(tareasRoot, 'TASK-700');
+    assert.deepEqual(read?.task.skills_recomendados, []);
+    assert.equal(read?.task.regla_seleccion_skill, null);
+  });
+});
+
+test('taskctl plan: un skill externo ganador que no esta instalado deja el aviso de "/plugin install", y SI queda en skills_recomendados', async () => {
+  const pluginRootTmp = await mkdtemp(path.join(tmpdir(), 'taskctl-plan-plugin-root-'));
+  const previoPluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+  const marketplaceInventado = 'marketplace-inventado-para-el-test-de-plan';
+  try {
+    const scriptsDir = path.join(pluginRootTmp, 'scripts');
+    await mkdir(scriptsDir, { recursive: true });
+    // cargarHeuristica() usa el MISMO CLAUDE_PLUGIN_ROOT que
+    // cargarCatalogoSkills() -- sin esta copia, runPlanCommand aborta
+    // en la heuristica antes de llegar a la seleccion de skill.
+    const heuristicaReal = await readFile(RUTA_HEURISTICA_REAL, 'utf8');
+    await writeFile(path.join(scriptsDir, 'heuristica-complejidad.yml'), heuristicaReal, 'utf8');
+    await writeFile(
+      path.join(scriptsDir, 'catalogo-skills.yml'),
+      [
+        'total_skills: 1',
+        'skill_1_id: skill-externo-de-prueba',
+        'skill_1_origen: externo',
+        `skill_1_marketplace: ${marketplaceInventado}`,
+        'skill_1_rol: ejecucion',
+        'skill_1_prioridad: 5',
+        'skill_1_etiquetas: [etiqueta-unica-para-el-test-externo]',
+        'skill_1_patrones_archivo: []',
+        'skill_1_descripcion: "skill externo de prueba"',
+        '',
+      ].join('\n'),
+      'utf8'
+    );
+    process.env['CLAUDE_PLUGIN_ROOT'] = pluginRootTmp;
+
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await writeTareaFile(
+        tareasRoot,
+        sampleTask({ etiquetas: ['etiqueta-unica-para-el-test-externo'] }),
+        BODY_CON_OBJETIVO
+      );
+      commitAll(repoRoot, 'tarea TASK-700 con etiqueta de skill externo');
+
+      const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot });
+
+      assert.deepEqual(result.skillsRecomendados, ['skill-externo-de-prueba']);
+      assert.equal(result.reglaSeleccionSkill, 'solape');
+      assert.ok(result.avisoSkillNoInstalada !== null);
+      assert.match(
+        result.avisoSkillNoInstalada!,
+        new RegExp(`/plugin install skill-externo-de-prueba@${marketplaceInventado}`)
+      );
+
+      const read = await readTareaFile(tareasRoot, 'TASK-700');
+      assert.deepEqual(read?.task.skills_recomendados, ['skill-externo-de-prueba']);
+    });
+  } finally {
+    if (previoPluginRoot === undefined) delete process.env['CLAUDE_PLUGIN_ROOT'];
+    else process.env['CLAUDE_PLUGIN_ROOT'] = previoPluginRoot;
+    await rm(pluginRootTmp, { recursive: true, force: true });
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
index 0257838..ece8858 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
@@ -35,6 +35,7 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     asignado_a: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-05',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
index e375fff..bbfddca 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
@@ -46,6 +46,7 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     asignado_a: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-03',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts
index 776aff5..43f0e86 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts
@@ -18,6 +18,7 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     asignado_a: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-03',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
new file mode 100644
index 0000000..b983669
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
@@ -0,0 +1,415 @@
+/**
+ * Tests de `src/core/catalogo-skills.ts` (TASK-017).
+ *
+ * Mismo criterio que heuristica.test.ts: los casos de error de
+ * `parsearCatalogoSkills` MUTAN el YML real del repo
+ * (scripts/catalogo-skills.yml), nunca un YAML paralelo inventado — la
+ * base de cada caso negativo es, por construccion, un fichero que
+ * parsea. `seleccionarSkill()` en cambio se prueba con catalogos
+ * sinteticos en memoria: la funcion no toca disco, y el catalogo real
+ * de 5 entradas (todas "taskcode-plugin", sin dos que empaten en
+ * solape Y prioridad a la vez) no cubre por si solo escenarios como el
+ * empate hasta prioridad o un origen "externo".
+ *
+ * Misma disciplina que TASK-032 dejo escrita en heuristica.test.ts: no
+ * se reimplementa la tabla del catalogo con valores a mano (las
+ * aserciones contra el catalogo real comprueban una PRECONDICION
+ * explicita antes de asumir una relacion entre dos entradas), y ningun
+ * test se conforma con "no lanza".
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFileSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+import {
+  CatalogoSkillsError,
+  FICHERO_CATALOGO_SKILLS,
+  parsearCatalogoSkills,
+  seleccionarSkill,
+} from '../../src/core/catalogo-skills.js';
+import type { CatalogoSkills, EntradaCatalogoSkill } from '../../src/core/catalogo-skills.js';
+import type { Task } from '../../src/core/task.js';
+
+/** dist/test/core/ -> raiz del paquete, igual que en heuristica.test.ts. */
+const RAIZ_PAQUETE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
+const RUTA_YML = path.join(RAIZ_PAQUETE, 'scripts', FICHERO_CATALOGO_SKILLS);
+const BASE = readFileSync(RUTA_YML, 'utf8');
+
+/** El catalogo real del repo. Todo caso positivo se mide contra este. */
+const CATALOGO: CatalogoSkills = parsearCatalogoSkills(BASE, RUTA_YML);
+
+// --------------------------------------------------------------------
+// Utilidades de construccion
+// --------------------------------------------------------------------
+
+function tarea(campos: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-999',
+    titulo: 'tarea de prueba',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'media',
+    modelo_sugerido: 'sonnet',
+    estado: 'planificada',
+    plan_aprobado: false,
+    rama: 'feature/task-999-prueba',
+    asignado_a: null,
+    regla_seleccion_skill: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-08',
+    actualizado: '2026-09-08',
+    dependencias: [],
+    ...campos,
+  };
+}
+
+function entradaSkill(campos: Partial<EntradaCatalogoSkill> = {}): EntradaCatalogoSkill {
+  return {
+    id: 'skill-x',
+    origen: 'taskcode-plugin',
+    marketplace: null,
+    rol: 'ejecucion',
+    prioridad: 0,
+    etiquetas: [],
+    patrones_archivo: [],
+    descripcion: 'skill de prueba',
+    ...campos,
+  };
+}
+
+function sinLineaDe(clave: string, contenido: string = BASE): string {
+  return contenido
+    .split(/\r?\n/)
+    .filter((l) => !l.startsWith(`${clave}:`))
+    .join('\n');
+}
+
+function conValor(clave: string, valor: string, contenido: string = BASE): string {
+  return contenido
+    .split(/\r?\n/)
+    .map((l) => (l.startsWith(`${clave}:`) ? `${clave}: ${valor}` : l))
+    .join('\n');
+}
+
+function conLineaExtra(linea: string, contenido: string = BASE): string {
+  return `${contenido}\n${linea}\n`;
+}
+
+/**
+ * CatalogoSkillsError cuyo mensaje coincide con `re`. Sin exigir una
+ * segunda linea indentada con instruccion: a diferencia de
+ * heuristica.ts, aqui varios validadores (texto no vacio, enum, lista
+ * con entrada vacia o repetida) se quedan en una sola linea a
+ * proposito porque el propio nombre de la clave ya senala donde
+ * corregir.
+ */
+function errorCatalogo(re: RegExp): (e: unknown) => boolean {
+  return (e: unknown) => {
+    assert.ok(e instanceof CatalogoSkillsError, `esperaba CatalogoSkillsError y llego: ${String(e)}`);
+    assert.match(e.message, re);
+    return true;
+  };
+}
+
+/** Igual que errorCatalogo, pero ademas exige la segunda linea indentada
+ *  con la instruccion de que hacer -- para los mensajes que si la traen. */
+function errorAccionable(re: RegExp): (e: unknown) => boolean {
+  return (e: unknown) => {
+    assert.ok(e instanceof CatalogoSkillsError, `esperaba CatalogoSkillsError y llego: ${String(e)}`);
+    assert.match(e.message, re);
+    assert.match(e.message, /\n {8}\S/, `mensaje sin instruccion accionable: ${e.message}`);
+    return true;
+  };
+}
+
+// --------------------------------------------------------------------
+// parsearCatalogoSkills — contra el YML real, fallo cerrado
+// --------------------------------------------------------------------
+
+test('parsea el catalogo real del repo sin lanzar', () => {
+  assert.equal(CATALOGO.length, 5);
+  assert.deepEqual(
+    CATALOGO.map((e) => e.id),
+    [
+      'task-workflow',
+      'code-quality-reviewer',
+      'angular-vue-reviewer',
+      'csharp-autocad-ifc-reviewer',
+      'java-spring-reviewer',
+    ]
+  );
+});
+
+test('total_skills ausente aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(sinLineaDe('total_skills'), RUTA_YML),
+    errorAccionable(/falta la clave obligatoria "total_skills"/)
+  );
+});
+
+test('total_skills repetido aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conLineaExtra('total_skills: 5'), RUTA_YML),
+    errorAccionable(/la clave "total_skills" esta repetida/)
+  );
+});
+
+test('total_skills no entero aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('total_skills', '5.5'), RUTA_YML),
+    errorAccionable(/"total_skills" debe ser un numero entero mayor o igual que 0/)
+  );
+});
+
+test('total_skills negativo aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('total_skills', '-1'), RUTA_YML),
+    errorAccionable(/"total_skills" debe ser un numero entero mayor o igual que 0/)
+  );
+});
+
+test('clave desconocida aborta y sugiere la clave real por distancia de edicion', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conLineaExtra('skill_1_orgen: taskcode-plugin'), RUTA_YML),
+    (e: unknown) => {
+      assert.ok(e instanceof CatalogoSkillsError);
+      assert.match(e.message, /clave desconocida "skill_1_orgen"/);
+      assert.match(e.message, /Quiza quisiste decir "skill_1_origen"/);
+      return true;
+    }
+  );
+});
+
+test('clave repetida aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conLineaExtra('skill_1_id: otro-id'), RUTA_YML),
+    errorAccionable(/la clave "skill_1_id" esta repetida/)
+  );
+});
+
+for (const campo of [
+  'id',
+  'origen',
+  'rol',
+  'prioridad',
+  'etiquetas',
+  'patrones_archivo',
+  'descripcion',
+] as const) {
+  test(`skill_1_${campo} ausente aborta`, () => {
+    assert.throws(
+      () => parsearCatalogoSkills(sinLineaDe(`skill_1_${campo}`), RUTA_YML),
+      errorAccionable(new RegExp(`falta la clave obligatoria "skill_1_${campo}"`))
+    );
+  });
+}
+
+test('prioridad negativa aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('skill_2_prioridad', '-1'), RUTA_YML),
+    errorAccionable(/"skill_2_prioridad" debe ser un numero entero mayor o igual que 0/)
+  );
+});
+
+test('prioridad no entera (texto) aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('skill_1_prioridad', '"diez"'), RUTA_YML),
+    errorAccionable(/"skill_1_prioridad" debe ser un numero entero mayor o igual que 0/)
+  );
+});
+
+test('origen fuera del enum aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('skill_1_origen', 'inventado'), RUTA_YML),
+    errorCatalogo(
+      /"skill_1_origen" tiene el valor el texto "inventado", pero debe ser uno de: taskcode-plugin, externo/
+    )
+  );
+});
+
+test('rol fuera del enum aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('skill_1_rol', 'inventado'), RUTA_YML),
+    errorCatalogo(
+      /"skill_1_rol" tiene el valor el texto "inventado", pero debe ser uno de: revisor, ejecucion, ambos/
+    )
+  );
+});
+
+test('id vacio aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('skill_1_id', '""'), RUTA_YML),
+    errorCatalogo(/"skill_1_id" debe ser texto no vacio/)
+  );
+});
+
+test('etiquetas sin elementos aborta (minimo 1)', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('skill_1_etiquetas', '[]'), RUTA_YML),
+    errorAccionable(/"skill_1_etiquetas" no puede estar vacia/)
+  );
+});
+
+test('etiquetas con una entrada en blanco aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('skill_1_etiquetas', '[taskctl, ]'), RUTA_YML),
+    errorCatalogo(/"skill_1_etiquetas" tiene alguna entrada vacia/)
+  );
+});
+
+test('etiquetas con una entrada repetida aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('skill_1_etiquetas', '[taskctl, taskctl]'), RUTA_YML),
+    errorCatalogo(/"skill_1_etiquetas" tiene la entrada "taskctl" repetida/)
+  );
+});
+
+test('patrones_archivo vacio es valido (minimo 0, no exige elementos)', () => {
+  const catalogo = parsearCatalogoSkills(conValor('skill_1_patrones_archivo', '[]'), RUTA_YML);
+  const entrada = catalogo.find((e) => e.id === 'task-workflow');
+  assert.ok(entrada);
+  assert.deepEqual(entrada.patrones_archivo, []);
+});
+
+test('id repetido entre dos entradas aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('skill_2_id', 'task-workflow'), RUTA_YML),
+    errorAccionable(/el id "task-workflow" se repite en las entradas 1 y 2/)
+  );
+});
+
+test('marketplace ausente en un origen externo aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conValor('skill_2_origen', 'externo'), RUTA_YML),
+    errorAccionable(/falta la clave obligatoria "skill_2_marketplace"/)
+  );
+});
+
+test('marketplace presente en un origen taskcode-plugin aborta', () => {
+  assert.throws(
+    () => parsearCatalogoSkills(conLineaExtra('skill_1_marketplace: algun-marketplace'), RUTA_YML),
+    errorAccionable(/"skill_1_marketplace" no tiene sentido con "skill_1_origen: taskcode-plugin"/)
+  );
+});
+
+test('un skill externo con marketplace declarado parsea y queda marcado', () => {
+  const conMarketplace = conLineaExtra('skill_2_marketplace: mi-marketplace');
+  const conExterno = conValor('skill_2_origen', 'externo', conMarketplace);
+  const catalogo = parsearCatalogoSkills(conExterno, RUTA_YML);
+  const entrada = catalogo.find((e) => e.id === 'code-quality-reviewer');
+  assert.ok(entrada);
+  assert.equal(entrada.origen, 'externo');
+  assert.equal(entrada.marketplace, 'mi-marketplace');
+});
+
+// --------------------------------------------------------------------
+// seleccionarSkill — catalogos sinteticos en memoria
+// --------------------------------------------------------------------
+
+test('seleccionarSkill: gana quien tiene mayor solape de etiquetas', () => {
+  const catalogo: CatalogoSkills = [
+    entradaSkill({ id: 'a', etiquetas: ['x', 'y'], prioridad: 1 }),
+    entradaSkill({ id: 'b', etiquetas: ['x', 'y', 'z'], prioridad: 1 }),
+  ];
+  const resultado = seleccionarSkill(tarea({ etiquetas: ['x', 'y', 'z', 'w'] }), catalogo);
+  assert.equal(resultado.ganador?.id, 'b');
+  assert.equal(resultado.regla, 'solape');
+  assert.deepEqual(resultado.candidatosEmpatados, []);
+});
+
+test('seleccionarSkill: empate en solape se rompe por mayor prioridad', () => {
+  const catalogo: CatalogoSkills = [
+    entradaSkill({ id: 'a', etiquetas: ['x'], prioridad: 1 }),
+    entradaSkill({ id: 'b', etiquetas: ['x'], prioridad: 10 }),
+  ];
+  const resultado = seleccionarSkill(tarea({ etiquetas: ['x'] }), catalogo);
+  assert.equal(resultado.ganador?.id, 'b');
+  assert.equal(resultado.regla, 'prioridad');
+  assert.deepEqual(resultado.candidatosEmpatados, []);
+});
+
+test('seleccionarSkill: empate en solape Y en prioridad devuelve candidatos sin decidir ganador', () => {
+  const catalogo: CatalogoSkills = [
+    entradaSkill({ id: 'a', etiquetas: ['x'], prioridad: 10 }),
+    entradaSkill({ id: 'b', etiquetas: ['x'], prioridad: 10 }),
+  ];
+  const resultado = seleccionarSkill(tarea({ etiquetas: ['x'] }), catalogo);
+  assert.equal(resultado.ganador, null);
+  assert.equal(resultado.regla, null);
+  assert.deepEqual(
+    resultado.candidatosEmpatados.map((c) => c.id).sort(),
+    ['a', 'b']
+  );
+});
+
+test('seleccionarSkill: un tercer candidato con menor solape no entra en el empate', () => {
+  const catalogo: CatalogoSkills = [
+    entradaSkill({ id: 'a', etiquetas: ['x', 'y'], prioridad: 10 }),
+    entradaSkill({ id: 'b', etiquetas: ['x', 'y'], prioridad: 10 }),
+    entradaSkill({ id: 'c', etiquetas: ['x'], prioridad: 99 }),
+  ];
+  const resultado = seleccionarSkill(tarea({ etiquetas: ['x', 'y'] }), catalogo);
+  assert.equal(resultado.ganador, null);
+  assert.deepEqual(
+    resultado.candidatosEmpatados.map((c) => c.id).sort(),
+    ['a', 'b']
+  );
+});
+
+test('seleccionarSkill: cero candidatos (ninguna etiqueta coincide) es un resultado valido, no lanza', () => {
+  const catalogo: CatalogoSkills = [entradaSkill({ id: 'a', etiquetas: ['x'] })];
+  const resultado = seleccionarSkill(tarea({ etiquetas: ['no-coincide'] }), catalogo);
+  assert.deepEqual(resultado, { ganador: null, regla: null, candidatosEmpatados: [] });
+});
+
+test('seleccionarSkill: catalogo vacio nunca lanza', () => {
+  const resultado = seleccionarSkill(tarea({ etiquetas: ['x'] }), []);
+  assert.deepEqual(resultado, { ganador: null, regla: null, candidatosEmpatados: [] });
+});
+
+test('seleccionarSkill: tarea sin etiquetas nunca tiene candidatos', () => {
+  const catalogo: CatalogoSkills = [entradaSkill({ id: 'a', etiquetas: ['x'] })];
+  const resultado = seleccionarSkill(tarea({ etiquetas: [] }), catalogo);
+  assert.deepEqual(resultado, { ganador: null, regla: null, candidatosEmpatados: [] });
+});
+
+test('seleccionarSkill: no filtra por rol -- un revisor puede ganar igual que uno de ejecucion', () => {
+  const catalogo: CatalogoSkills = [entradaSkill({ id: 'rev', rol: 'revisor', etiquetas: ['x'], prioridad: 5 })];
+  const resultado = seleccionarSkill(tarea({ etiquetas: ['x'] }), catalogo);
+  assert.equal(resultado.ganador?.id, 'rev');
+  assert.equal(resultado.regla, 'solape');
+});
+
+// --------------------------------------------------------------------
+// seleccionarSkill contra el catalogo REAL — ancla el comportamiento
+// distribuido, mismo criterio que heuristica.test.ts.
+// --------------------------------------------------------------------
+
+test('seleccionarSkill contra el catalogo real: task-workflow gana por sus etiquetas propias', () => {
+  const resultado = seleccionarSkill(tarea({ etiquetas: ['taskctl', 'sprints'] }), CATALOGO);
+  assert.equal(resultado.ganador?.id, 'task-workflow');
+  assert.equal(resultado.regla, 'solape');
+});
+
+test('seleccionarSkill contra el catalogo real: cero candidatos si ninguna etiqueta coincide', () => {
+  const resultado = seleccionarSkill(tarea({ etiquetas: ['etiqueta-inventada-sin-match'] }), CATALOGO);
+  assert.deepEqual(resultado, { ganador: null, regla: null, candidatosEmpatados: [] });
+});
+
+test('seleccionarSkill contra el catalogo real: la prioridad rompe el empate entre code-quality-reviewer y un revisor de dominio', () => {
+  const calidad = CATALOGO.find((e) => e.id === 'code-quality-reviewer');
+  const angular = CATALOGO.find((e) => e.id === 'angular-vue-reviewer');
+  assert.ok(calidad && angular, 'el catalogo real debe traer ambas entradas');
+  assert.ok(
+    calidad.prioridad < angular.prioridad,
+    'precondicion del test: code-quality-reviewer debe llevar menor prioridad que un revisor de dominio'
+  );
+  const resultado = seleccionarSkill(tarea({ etiquetas: ['calidad', 'angular'] }), CATALOGO);
+  assert.equal(resultado.ganador?.id, 'angular-vue-reviewer');
+  assert.equal(resultado.regla, 'prioridad');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts
index 7a8fab7..372a28f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts
@@ -254,6 +254,7 @@ test('limite_wip: con limite 3, dos tareas abiertas ya no bloquean; con 1, si',
     rama: 'feature/task-900-x',
     asignado_a: 'carlos',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     agente_revisor: 'general-purpose',
     ultimo_commit_revisado: null,
     revision_codex: false,
@@ -291,6 +292,7 @@ test('limite_wip: el mensaje de error dice el limite real, no "una sola tarea"',
       rama: 'feature/task-901-x',
       asignado_a: 'carlos',
       skills_recomendados: [],
+      regla_seleccion_skill: null,
       agente_revisor: 'general-purpose',
       ultimo_commit_revisado: null,
       revision_codex: false,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
index 8152680..02f7d6e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
@@ -82,6 +82,7 @@ function tarea(campos: Partial<Task> = {}): Task {
     plan_aprobado: false,
     rama: 'feature/task-999-prueba',
     asignado_a: null,
+    regla_seleccion_skill: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
     ultimo_commit_revisado: null,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
new file mode 100644
index 0000000..5e2a10b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
@@ -0,0 +1,157 @@
+/**
+ * Tests de `src/core/plan-desempate-skill.ts` (TASK-017).
+ *
+ * `peticionDesempateSkillTemplate` y `salidaDesempateSkillTemplate` son
+ * texto libre: se comprueba que el contenido relevante (ids, etiquetas,
+ * descripcion, fecha, nombre del fichero de salida) aparece, sin fijar
+ * el texto completo linea a linea. `leerGanadorDesempate` es la pieza
+ * con logica real (fail-closed: una salida ambigua nunca elige un
+ * candidato al azar) y se prueba exhaustivamente.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  PETICION_DESEMPATE_SKILL_FILENAME,
+  SALIDA_DESEMPATE_SKILL_FILENAME,
+  peticionDesempateSkillTemplate,
+  salidaDesempateSkillTemplate,
+  leerGanadorDesempate,
+} from '../../src/core/plan-desempate-skill.js';
+import type { EntradaCatalogoSkill } from '../../src/core/catalogo-skills.js';
+import type { Task } from '../../src/core/task.js';
+
+function tarea(campos: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-999',
+    titulo: 'tarea de prueba',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'media',
+    modelo_sugerido: 'sonnet',
+    estado: 'planificada',
+    plan_aprobado: false,
+    rama: 'feature/task-999-prueba',
+    asignado_a: null,
+    regla_seleccion_skill: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-08',
+    actualizado: '2026-09-08',
+    dependencias: [],
+    ...campos,
+  };
+}
+
+function entradaSkill(campos: Partial<EntradaCatalogoSkill> = {}): EntradaCatalogoSkill {
+  return {
+    id: 'skill-x',
+    origen: 'taskcode-plugin',
+    marketplace: null,
+    rol: 'ejecucion',
+    prioridad: 0,
+    etiquetas: [],
+    patrones_archivo: [],
+    descripcion: 'skill de prueba',
+    ...campos,
+  };
+}
+
+const CANDIDATOS: readonly EntradaCatalogoSkill[] = [
+  entradaSkill({ id: 'a', prioridad: 10, rol: 'revisor', etiquetas: ['x', 'y'], descripcion: 'candidato a' }),
+  entradaSkill({ id: 'b', prioridad: 10, rol: 'ejecucion', etiquetas: ['x'], descripcion: 'candidato b' }),
+];
+
+// --------------------------------------------------------------------
+// peticionDesempateSkillTemplate
+// --------------------------------------------------------------------
+
+test('peticionDesempateSkillTemplate incluye cada candidato con su id, prioridad, rol, descripcion y etiquetas', () => {
+  const texto = peticionDesempateSkillTemplate(tarea({ id: 'TASK-042', etiquetas: ['x'] }), CANDIDATOS, '2026-09-09');
+  for (const c of CANDIDATOS) {
+    assert.match(texto, new RegExp(`\`${c.id}\``));
+    assert.match(texto, new RegExp(`prioridad ${c.prioridad}`));
+    assert.match(texto, new RegExp(`rol ${c.rol}`));
+    assert.ok(texto.includes(c.descripcion));
+    assert.ok(texto.includes(c.etiquetas.join(', ')));
+  }
+});
+
+test('peticionDesempateSkillTemplate incluye la tarea, la fecha y el nombre del fichero de salida', () => {
+  const texto = peticionDesempateSkillTemplate(tarea({ id: 'TASK-042', titulo: 'mi tarea' }), CANDIDATOS, '2026-09-09');
+  assert.ok(texto.includes('TASK-042'));
+  assert.ok(texto.includes('mi tarea'));
+  assert.ok(texto.includes('2026-09-09'));
+  assert.ok(texto.includes(SALIDA_DESEMPATE_SKILL_FILENAME));
+});
+
+test('peticionDesempateSkillTemplate marca explicitamente cuando la tarea no tiene etiquetas', () => {
+  const texto = peticionDesempateSkillTemplate(tarea({ etiquetas: [] }), CANDIDATOS, '2026-09-09');
+  assert.ok(texto.includes('(sin etiquetas)'));
+});
+
+test('PETICION_DESEMPATE_SKILL_FILENAME y SALIDA_DESEMPATE_SKILL_FILENAME son nombres fijos sin numeracion de ronda', () => {
+  assert.equal(PETICION_DESEMPATE_SKILL_FILENAME, 'peticion-desempate-skill-1.md');
+  assert.equal(SALIDA_DESEMPATE_SKILL_FILENAME, 'salida-desempate-skill-1.md');
+});
+
+// --------------------------------------------------------------------
+// salidaDesempateSkillTemplate
+// --------------------------------------------------------------------
+
+test('salidaDesempateSkillTemplate es un scaffold vacio con el id de la tarea', () => {
+  const texto = salidaDesempateSkillTemplate(tarea({ id: 'TASK-042' }));
+  assert.ok(texto.includes('TASK-042'));
+  assert.equal(leerGanadorDesempate(texto, CANDIDATOS), null);
+});
+
+// --------------------------------------------------------------------
+// leerGanadorDesempate — fail-closed
+// --------------------------------------------------------------------
+
+test('leerGanadorDesempate devuelve el candidato cuya primera linea no vacia coincide EXACTAMENTE con su id', () => {
+  const ganador = leerGanadorDesempate('b\n', CANDIDATOS);
+  assert.equal(ganador?.id, 'b');
+});
+
+test('leerGanadorDesempate ignora lineas siguientes a la primera no vacia', () => {
+  const ganador = leerGanadorDesempate('a\nrazonamiento largo que menciona a b\n', CANDIDATOS);
+  assert.equal(ganador?.id, 'a');
+});
+
+test('leerGanadorDesempate salta lineas en blanco iniciales antes de la primera con contenido', () => {
+  const ganador = leerGanadorDesempate('\n\n   \nb\n', CANDIDATOS);
+  assert.equal(ganador?.id, 'b');
+});
+
+test('leerGanadorDesempate hace trim de espacios alrededor del id', () => {
+  const ganador = leerGanadorDesempate('   a   \n', CANDIDATOS);
+  assert.equal(ganador?.id, 'a');
+});
+
+test('leerGanadorDesempate funciona igual con finales de linea CRLF', () => {
+  const ganador = leerGanadorDesempate('b\r\nresto\r\n', CANDIDATOS);
+  assert.equal(ganador?.id, 'b');
+});
+
+test('leerGanadorDesempate devuelve null si el contenido esta vacio', () => {
+  assert.equal(leerGanadorDesempate('', CANDIDATOS), null);
+});
+
+test('leerGanadorDesempate devuelve null si el contenido son solo lineas en blanco', () => {
+  assert.equal(leerGanadorDesempate('\n \n\t\n', CANDIDATOS), null);
+});
+
+test('leerGanadorDesempate devuelve null si la primera linea no coincide con ningun candidato vigente', () => {
+  assert.equal(leerGanadorDesempate('candidato-inventado\n', CANDIDATOS), null);
+});
+
+test('leerGanadorDesempate devuelve null ante una coincidencia parcial (no es igualdad exacta)', () => {
+  assert.equal(leerGanadorDesempate('a-extra\n', CANDIDATOS), null);
+});
+
+test('leerGanadorDesempate devuelve null si la lista de candidatos vigentes esta vacia', () => {
+  assert.equal(leerGanadorDesempate('a\n', []), null);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts
new file mode 100644
index 0000000..a3555bd
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plugin-instalado.test.ts
@@ -0,0 +1,120 @@
+/**
+ * Tests de `src/core/plugin-instalado.ts` (TASK-017).
+ *
+ * `interpretarResultadoPluginList` se prueba exhaustivamente con datos
+ * literales -- nunca lanzando un subproceso real -- para cubrir todos
+ * los desenlaces fail-closed que exige plan-final.md: cualquier fallo
+ * del subproceso, o cualquier forma de "claude plugin list --json" que
+ * no encaje con lo esperado, tiene que colapsar a 'no-verificable', y
+ * NUNCA a 'no-instalado' (que arriesgaria sugerir instalar algo que ya
+ * esta) ni a 'instalado' (que esconderia un candidato real que falta).
+ *
+ * `comprobarSkillInstalado` solo se prueba con un test de integracion
+ * minimo: en esta maquina de test no sabemos si "claude" esta instalado
+ * ni que devuelve, asi que lo unico que se puede afirmar sin suponer
+ * nada del entorno es que la funcion nunca lanza y siempre devuelve uno
+ * de los tres estados validos.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  comprobarSkillInstalado,
+  interpretarResultadoPluginList,
+  type EstadoInstalacionSkill,
+} from '../../src/core/plugin-instalado.js';
+
+const MARKETPLACE = 'mi-marketplace';
+
+test('binario ausente (result.error presente) es no-verificable', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: new Error('spawnSync claude ENOENT'), status: null, stdout: null },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'no-verificable');
+});
+
+test('status distinto de 0 es no-verificable', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: undefined, status: 1, stdout: '[]' },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'no-verificable');
+});
+
+test('status null (p. ej. timeout) es no-verificable', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: undefined, status: null, stdout: '[]' },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'no-verificable');
+});
+
+test('stdout ausente (no es string) es no-verificable', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: undefined, status: 0, stdout: null },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'no-verificable');
+});
+
+test('stdout con JSON mal formado es no-verificable', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: undefined, status: 0, stdout: '{ esto no es json valido' },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'no-verificable');
+});
+
+test('stdout con una forma que no es un array es no-verificable', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: undefined, status: 0, stdout: JSON.stringify({ plugins: [] }) },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'no-verificable');
+});
+
+test('array vacio es no-instalado', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: undefined, status: 0, stdout: '[]' },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'no-instalado');
+});
+
+test('array con entradas de otros marketplaces es no-instalado', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: undefined, status: 0, stdout: JSON.stringify([{ marketplace: 'otro-marketplace' }]) },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'no-instalado');
+});
+
+test('array con el marketplace buscado es instalado', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: undefined, status: 0, stdout: JSON.stringify([{ marketplace: 'otro' }, { marketplace: MARKETPLACE }]) },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'instalado');
+});
+
+test('entradas del array con forma inesperada (no objeto) se ignoran sin lanzar, y no cuentan como instalado', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: undefined, status: 0, stdout: JSON.stringify(['texto-suelto', null, 42]) },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'no-instalado');
+});
+
+test('una entrada sin campo marketplace se ignora sin lanzar', () => {
+  const estado = interpretarResultadoPluginList(
+    { error: undefined, status: 0, stdout: JSON.stringify([{ nombre: 'algun-plugin' }]) },
+    MARKETPLACE
+  );
+  assert.equal(estado, 'no-instalado');
+});
+
+test('comprobarSkillInstalado nunca lanza y siempre devuelve un estado valido', () => {
+  const ESTADOS_VALIDOS: readonly EstadoInstalacionSkill[] = ['instalado', 'no-instalado', 'no-verificable'];
+  const estado = comprobarSkillInstalado('marketplace-inventado-para-el-test');
+  assert.ok(ESTADOS_VALIDOS.includes(estado), `estado inesperado: ${String(estado)}`);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
index fbdcd6b..19bec87 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
@@ -22,6 +22,7 @@ function makeTask(overrides: Partial<Task> = {}): Task {
     asignado_a: null,
     agente_revisor: 'typescript-reviewer',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-03',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-file.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-file.test.ts
index 5c406f2..d66cdcf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-file.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-file.test.ts
@@ -53,6 +53,7 @@ function fixtureTask(overrides: Partial<Task>): Task {
     asignado_a: null,
     agente_revisor: 'typescript-reviewer',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-03',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
index 652a843..108c8c3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
@@ -28,6 +28,7 @@ function tarea(overrides: Partial<Task> = {}): Task {
     plan_aprobado: true,
     rama: 'feature/task-900-prueba',
     asignado_a: 'carlos',
+    regla_seleccion_skill: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
     ultimo_commit_revisado: null,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts
index 0b16a5d..68a509c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts
@@ -28,6 +28,7 @@ function tarea(overrides: Partial<Task> = {}): Task {
     asignado_a: 'carlos',
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
+    regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
     creado: '2026-09-05',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts
index 8ebade6..11ee37b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts
@@ -28,6 +28,7 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     rama: 'feature/task-001-prueba',
     asignado_a: null,
     agente_revisor: 'typescript-reviewer',
+    regla_seleccion_skill: null,
     skills_recomendados: [],
     ultimo_commit_revisado: null,
     revision_codex: false,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts
index 3704f4a..ff7c79e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts
@@ -38,6 +38,7 @@ function tarea(overrides: Partial<Task> = {}): Task {
     plan_aprobado: true,
     rama: 'feature/task-900-prueba',
     asignado_a: 'carlos@example.com',
+    regla_seleccion_skill: null,
     agente_revisor: 'general-purpose',
     skills_recomendados: [],
     ultimo_commit_revisado: null,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
index 92db610..af15fca 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
@@ -371,6 +371,7 @@ function tareaSinAprobar(complejidad: TaskComplexity): Task {
     modelo_sugerido: 'sonnet',
     estado: 'en-diseno',
     plan_aprobado: false,
+    regla_seleccion_skill: null,
     rama: '',
     asignado_a: null,
     agente_revisor: '',
````
