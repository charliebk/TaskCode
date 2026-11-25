# Peticion de revision — TASK-158b (ronda 2)

- Tarea: TASK-158b — taskctl comprueba la autorrevision 4D por ronda y en los MENORES (parte b de TASK-158)
- Rama revisada: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
- Rama base: develop
- Commit revisado (HEAD): 53cd04f62e14e075d89c8462ad37dd148b225b5c
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-158b (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde deb6eddd790c0fb3fc62918ebaac413def6e4d4c (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (3 hallazgo(s)))

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

- tareas/03-en-revision/TASK-158b/tarea.md
- tareas/03-en-revision/TASK-158b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 1 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:979 | informe-revision-1.md |

## Commits a revisar (git log deb6eddd790c0fb3fc62918ebaac413def6e4d4c..HEAD)

````
53cd04f docs(TASK-158b): autorrevision en su seccion
ec830ef docs(TASK-158b): autorrevision de la ronda 1
e075501 fix(TASK-158b): ronda 1, test del aviso por CLI y etiqueta escapada
b240aa4 chore(TASK-158b): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff deb6eddd790c0fb3fc62918ebaac413def6e4d4c..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
index 7cea2d7..5e836fc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
@@ -36,7 +36,9 @@ export function tieneAutorrevision(body: string): boolean {
  * cuenta por otra: la de la ronda 1 no vale para la ronda 2.
  */
 export function tieneLinea4D(body: string, etiqueta = ''): boolean {
-  const tras4D = etiqueta === '' ? '' : `\\s+${etiqueta.trim().split(/\s+/).join('\\s+')}`;
+  // MEN-1 de su revision: la etiqueta es texto, no regex (se escapa cada palabra).
+  const palabras = etiqueta.trim().split(/\s+/).filter((p) => p !== '').map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
+  const tras4D = palabras.length === 0 ? '' : `\\s+${palabras.join('\\s+')}`;
   const linea = new RegExp(`^\\s*[-*]\\s*4D${tras4D}\\s*(?:—|–|-|:)\\s*\\S`);
   return (contenidoDeSeccion(body, SECCION_AUTORREVISION) ?? []).some((l) => linea.test(l));
 }
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff deb6eddd790c0fb3fc62918ebaac413def6e4d4c..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-158b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158b/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-158b/revision/informe-revision-1.md                                                  |  28 ++++++++
 tareas/03-en-revision/TASK-158b/revision/peticion-revision-1.md                                                 | 314 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-158b/tarea.md                                                       |  16 ++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/autorrevision.js                                     |   4 +-
 12 files changed, 358 insertions(+), 4 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff deb6eddd790c0fb3fc62918ebaac413def6e4d4c..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts | 16 ++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts         |  3 +++
 2 files changed, 19 insertions(+)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 1713.4 s
- Commit verificado: 53cd04f62e14e075d89c8462ad37dd148b225b5c
- Huella: 3152fd6a96ebdc94289cd5e6e1a253b96172e0d5
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 594740 bytes en total):

````
✔ 10g. la lectura de la tabla discrimina (contraprueba del 10f) (3.1701ms)
✔ 11. ninguna skill arrastra marcas de este repo ni rutas de maquina (45.8908ms)
✔ 11b. la marca generica de documento interno discrimina (contraprueba del menor 4) (3.8672ms)
✔ 12. CONTRAPRUEBA: rotas las cuatro, el validador las nombra a las cuatro (30111.2724ms)
✔ 13. el plugin entero, con las cuatro skills dentro, sigue validando (17302.4412ms)
✔ 14. angular-vue revisa la accesibilidad por criterio, citando WCAG 2.2 (3.1539ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (27.6426ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (3.9244ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (6.1414ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (6.9102ms)
✔ 4. name presente, string y en kebab-case valido (12.8136ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (46.5814ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (6.3306ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (6.3752ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (7.8207ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (4.7354ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (12.3842ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (5.5754ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (2.2136ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (5.2248ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (4.6911ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (4.9879ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (2.1053ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (114.2531ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (74.7118ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (222.2468ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (11.8499ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (101.2903ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (14844.4642ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (34684.4868ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (6.9621ms)
ℹ tests 1951
ℹ suites 0
ℹ pass 1949
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 1691708.6671
[verificar-impacto] node --test termino con 0 en 1691.8 s.
````
