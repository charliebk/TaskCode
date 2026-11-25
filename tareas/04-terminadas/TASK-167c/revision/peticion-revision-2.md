# Peticion de revision — TASK-167c (ronda 2)

- Tarea: TASK-167c — auditoria 4D invocable (parte c de TASK-167)
- Rama revisada: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
- Rama base: develop
- Commit revisado (HEAD): b5b8b880d6bff7914bd7819f5a63813f2eefe6c0
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-167c (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde a52b9ed42508ca1ff066a64d20dde5d4627efb81 (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-167c/tarea.md
- tareas/03-en-revision/TASK-167c/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md:76 | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts:71 | informe-revision-1.md |

## Commits a revisar (git log a52b9ed42508ca1ff066a64d20dde5d4627efb81..HEAD)

````
b5b8b88 fix(TASK-167c): ronda 1 - segunda auditoria del dia, test que exige criterios, permiso y columnas, informe legible por herramienta
519bd17 chore(TASK-167c): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff a52b9ed42508ca1ff066a64d20dde5d4627efb81..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md
index 1cf827d..d46880b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md
@@ -78,10 +78,15 @@ corrige nada.
    - Duración estimada: N min
    ```
 
-   Las cifras del resumen salen de la tabla de hallazgos: cuéntalas, no las
-   estimes. Una D sin hallazgos va con ceros, no se quita.
+   Lo lee una herramienta, así que: las cifras del resumen son números
+   contados en la tabla de hallazgos (la `n` del ejemplo es un hueco, no se
+   estima); una D sin hallazgos va con ceros, no se quita; las D y las
+   severidades se escriben tal cual, **sin tildes** (`Duplicacion`,
+   `CRITICO`), y ninguna celda lleva `|` (usa `/`).
 6. Muestra el resumen y las olas, y **pregunta a la persona** (AskUserQuestion)
-   si quiere una tarea por ola. Solo si dice que sí: primero commitea el
+   si quiere una tarea por ola. Si auditaste otra rama que no es la base, no
+   las crees: `taskctl new` cambia a la base, donde el informe no está; dilo.
+   Solo si dice que sí: primero commitea el
    informe (`git add docs/auditoria-4d-<fecha>.md` y `git commit -m "docs:
    auditoria 4D <fecha>"`), porque `taskctl new` aborta con cambios sin
    commitear; después, por cada ola:
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
index aac2bc1..8312d3c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
@@ -9,8 +9,11 @@
 export const CARPETA_AUDITORIA_4D = 'docs';
 /** Nombre del informe de una fecha (AAAA-MM-DD). */
 export const nombreInformeAuditoria4D = (fecha: string): string => `auditoria-4d-${fecha}.md`;
-/** Reconoce un informe por su nombre; el grupo 1 es la fecha. */
-export const PATRON_INFORME_AUDITORIA_4D = /^auditoria-4d-(\d{4}-\d{2}-\d{2})\.md$/;
+/**
+ * Reconoce un informe por su nombre; el grupo 1 es la fecha y el 2, si lo
+ * hay, el numero de la auditoria de ese dia (`-2`, `-3`... la primera no lleva).
+ */
+export const PATRON_INFORME_AUDITORIA_4D = /^auditoria-4d-(\d{4}-\d{2}-\d{2})(?:-(\d+))?\.md$/;
 
 /** Las cuatro D, en el orden en que salen en el resumen. */
 export const DES_4D = ['Duplicacion', 'Desviacion', 'Diluvio', 'Disfraz'] as const;
@@ -20,7 +23,11 @@ export const SECCION_RESUMEN_4D = '## Resumen';
 export const SECCION_HALLAZGOS_4D = '## Hallazgos';
 export const SECCION_OLAS_4D = '## Plan por olas';
 
-/** Cabecera de la tabla de `## Resumen`: una fila por D y una de total. */
+/**
+ * Cabecera de la tabla de `## Resumen`: una fila por D y una de total, con
+ * numeros. La tendencia entre auditorias se lee de aqui; la tabla de
+ * hallazgos es el detalle (la skill cuenta el resumen a partir de ella).
+ */
 export const CABECERA_RESUMEN_4D = `| D | ${SEVERIDADES_4D.join(' | ')} |`;
 /** Cabecera de la tabla de `## Hallazgos`. */
 export const CABECERA_HALLAZGOS_4D = '| ID | D | Severidad | Fichero | Hallazgo | Ola |';
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff a52b9ed42508ca1ff066a64d20dde5d4627efb81..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-167c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167c/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-167c/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-167c/revision/informe-revision-1.md                                                  |  28 +++++++
 tareas/03-en-revision/TASK-167c/revision/peticion-revision-1.md                                                 | 326 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-167c/tarea.md                                                       |  11 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/auditoria-4d.js                                      |  13 +++-
 12 files changed, 373 insertions(+), 5 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff a52b9ed42508ca1ff066a64d20dde5d4627efb81..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts | 24 +++++++++++++++++++++++-
 1 file changed, 23 insertions(+), 1 deletion(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 207.6 s
- Commit verificado: b5b8b880d6bff7914bd7819f5a63813f2eefe6c0
- Huella: 3de50dd7613ff03ac42c07548ef012230bab221a
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 125846 bytes en total):

````
✔ topes: el total de skills/ + agents/ cabe en su tope (49.5038ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (2.8439ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (0.8504ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.3473ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.3351ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (0.5496ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (75.606ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (2.1687ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (48.8028ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (62.7931ms)
✔ 4. name presente, string y en kebab-case valido (132.3147ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (768.4578ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (161.7749ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (181.9772ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (51.9763ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (69.9901ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (415.5538ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (38.1164ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (50.1543ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (6.769ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (3.5669ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (1.916ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (3.1332ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (497.2093ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (64.0696ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (68.4668ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (3.9847ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (24.9487ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (14328.1891ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (26031.0021ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (3.9602ms)
ℹ tests 914
ℹ suites 0
ℹ pass 914
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 193712.1302
[verificar-impacto] node --test termino con 0 en 193.8 s.
````
