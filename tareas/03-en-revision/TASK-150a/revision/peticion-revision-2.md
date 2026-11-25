# Peticion de revision — TASK-150a (ronda 2)

- Tarea: TASK-150a — textos que contradicen al codigo o a la Regla 4D (parte a de TASK-150)
- Rama revisada: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
- Rama base: develop
- Commit revisado (HEAD): be1b22bee68ee884aa2c8a800e51aa06e1bfa23e
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-150a (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 1cf8900c8f0d7634a6b659f5b195351bb337a24a (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (4 hallazgo(s)))

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

- tareas/03-en-revision/TASK-150a/tarea.md
- tareas/03-en-revision/TASK-150a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 2 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md:36 (y :102) | informe-revision-1.md |

## Commits a revisar (git log 1cf8900c8f0d7634a6b659f5b195351bb337a24a..HEAD)

````
be1b22b docs(TASK-150a): autorrevision de la ronda 1
32c57d5 fix(TASK-150a): ronda 1, rust-wasm lee el contexto y anota; descripcion de C# y claves de sincronizacion
caaf799 chore(TASK-150a): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 1cf8900c8f0d7634a6b659f5b195351bb337a24a..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
index aee28dc..bef9d2f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: csharp-autocad-ifc-reviewer
-description: Revisor por pares de C# sobre la API de AutoCAD (ObjectARX, AcDbMgd, Civil 3D, BricsCAD) o modelos IFC (IfcOpenShell, xBIM). Se usa si el diff toca .cs, .csproj, .sln, .ifc o .ifcxml. Es una skill de revision, no de implementacion.
+description: Revisor por pares de C# sobre la API de AutoCAD (ObjectARX, AcDbMgd, Civil 3D, BricsCAD) o modelos IFC (IfcOpenShell, xBIM). Se usa si el diff toca .cs, .csproj, .sln, .ifc, .ifcxml o .ifcjson. Es una skill de revision, no de implementacion.
 ---
 
 # Revisor de C# sobre AutoCAD e IFC
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
index 0961445..3518db5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
@@ -33,13 +33,13 @@ no se ve. Leer el proyecto entero "por si acaso" no es revisar mejor.
 **Regla obligatoria del limite JS-WASM.** Si el diff cambia una firma
 exportada con `#[wasm_bindgen]` (nombre, parametros, tipo devuelto, un
 `Result` que pasa a lanzar) o un tipo que cruza el limite (un struct
-exportado, un enum, lo que se serializa con `serde`), **pide siempre** el
+exportado, un enum, lo que se serializa con `serde`), **lee siempre** el
 llamador TypeScript o JavaScript que lo usa y el `.d.ts` generado (o el
 que el proyecto versione), y revisa los dos lados del contrato: que el
 llamador pasa lo que la firma espera, trata el error nuevo y libera lo que
 recibe. No es opcional: con el diff partido por dominios, nadie mas ve los
-dos lados a la vez. Dejalo escrito en `## Alcance` del informe (que se pidio
-y que se encontro); si el llamador no existe en el repo (un paquete que
+dos lados a la vez. Anotalo en `## Lecturas fuera del contexto permitido`
+(que leiste y que encontraste, ver "Lo que lees" de revision.md); si el llamador no existe en el repo (un paquete que
 consume un tercero), dilo tambien ahi.
 
 Si el diff toca tantos dominios distintos que fragmentarlo deja de tener
@@ -99,7 +99,7 @@ Quedan fuera a proposito, aunque un proyecto Rust y WASM tambien los toque:
 - El TypeScript o JavaScript que **llama** al modulo WASM (el worker, el
   cliente) — no hay sufijo ni carpeta que lo distinga de cualquier otro
   `.ts`. Lo revisa el generico; pero si el diff cambia el contrato del
-  limite, este revisor lo pide como contexto (ver la regla de abajo).
+  limite, este revisor lo lee como contexto (ver la regla de abajo).
 - `.rustfmt.toml` y `.clippy.toml` con punto delante — rustfmt y clippy los
   leen igual que sin punto, pero son la variante menos comun. Si el proyecto
   los usa, un cambio en ellos cae al generico; no cambian el codigo, solo como
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
index 364b21c..38b8a87 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
@@ -32,7 +32,7 @@ un comando que reescribe esos ficheros y la lista de rutas que modifica.
 **Reglas de declaracion:**
 
 - Las dos primeras claves van juntas o no van: si una existe, la otra debe
-  existir tambien. La tercera es opcional.
+  existir tambien. Las demas son opcionales.
 - Un valor invalido de una clave conocida aborta los comandos de `taskctl`
   que lean config; una clave desconocida (por ejemplo, mal escrita) avisa y se
   ignora.
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 1cf8900c8f0d7634a6b659f5b195351bb337a24a..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-150a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-150a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-150a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-150a/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-150a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-150a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-150a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-150a/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-150a/revision/informe-revision-1.md                                                  |  28 +++++++
 tareas/03-en-revision/TASK-150a/revision/peticion-revision-1.md                                                 | 336 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-150a/tarea.md                                                       |  16 +++-
 11 files changed, 377 insertions(+), 3 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 1cf8900c8f0d7634a6b659f5b195351bb337a24a..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts | 12 ++++++++----
 1 file changed, 8 insertions(+), 4 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 1581.9 s
- Commit verificado: be1b22bee68ee884aa2c8a800e51aa06e1bfa23e
- Huella: 16db335e83c04dfc51877f85be308a135fd59cc3
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 615089 bytes en total):

````
✔ topes: el total de skills/ + agents/ cabe en su tope (20.0574ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (5.646ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (13.6584ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.4059ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.376ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (0.5378ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (44.4028ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (2.1637ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (29.4939ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (30.7308ms)
✔ 4. name presente, string y en kebab-case valido (24.5165ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (162.9835ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (52.0713ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (14.2545ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (18.246ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (10.9446ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (73.0473ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (5.5563ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (6.8441ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (17.0574ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (9.2855ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (8.7087ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (4.693ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (118.1268ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (8.1604ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (60.1131ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (6.2896ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (112.5541ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (17543.6434ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (31564.6109ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (7.1241ms)
ℹ tests 2064
ℹ suites 0
ℹ pass 2062
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 1569818.8723
[verificar-impacto] node --test termino con 0 en 1569.9 s.
````
