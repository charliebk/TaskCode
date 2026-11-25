# Peticion de revision — TASK-150a (ronda 3)

- Tarea: TASK-150a — textos que contradicen al codigo o a la Regla 4D (parte a de TASK-150)
- Rama revisada: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
- Rama base: develop
- Commit revisado (HEAD): bac365c7a2d1b889d4d175f5ac9b9018bb15fcdd
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-150a (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde be1b22bee68ee884aa2c8a800e51aa06e1bfa23e (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (6 hallazgo(s)))

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
informe de esta ronda (informe-revision-3.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-150a/tarea.md
- tareas/03-en-revision/TASK-150a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts

## Hallazgos de la ronda 2 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 2 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md:36 (y :102) | informe-revision-2.md |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts:43-49 | informe-revision-2.md |

## Commits a revisar (git log be1b22bee68ee884aa2c8a800e51aa06e1bfa23e..HEAD)

````
bac365c docs(TASK-150a): autorrevision de la ronda 2 y ronda extra decidida por Carlos
ceb7d1d test(TASK-150a): ronda 2, la regex de pedir contexto no depende de la negrita
94b2cd5 chore(TASK-150a): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff be1b22bee68ee884aa2c8a800e51aa06e1bfa23e..HEAD)

````diff
(solo cambian tests: ver "Tests del diff" mas abajo)
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff be1b22bee68ee884aa2c8a800e51aa06e1bfa23e..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-150a/revision/informe-revision-1.md  |  66 +++++++++++++++++++++++++++++++-----
 tareas/03-en-revision/TASK-150a/revision/informe-revision-2.md  |  28 ++++++++++++++++
 tareas/03-en-revision/TASK-150a/revision/peticion-revision-2.md | 237 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-150a/tarea.md                        |  10 +++++-
 4 files changed, 331 insertions(+), 10 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff be1b22bee68ee884aa2c8a800e51aa06e1bfa23e..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts | 7 ++++---
 1 file changed, 4 insertions(+), 3 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 2208.5 s
- Commit verificado: bac365c7a2d1b889d4d175f5ac9b9018bb15fcdd
- Huella: a24d2998e8e3eaacd6ff36e78d348dc085950973
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 615245 bytes en total):

````
✔ topes: el total de skills/ + agents/ cabe en su tope (930.0233ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (50.1934ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (52.8369ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.3945ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.6139ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (0.6672ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (73.8977ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (3.6464ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (2.9056ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (3.311ms)
✔ 4. name presente, string y en kebab-case valido (2.432ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (501.4221ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (60.8856ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (103.9607ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (42.4316ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (59.969ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (480.8507ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (65.8946ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (7.5651ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (59.6925ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (2.9949ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (1.9021ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (2.2638ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (208.0657ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (135.485ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (1019.7478ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (98.6151ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (1528.8134ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (24199.5552ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (61524.5404ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (5.7614ms)
ℹ tests 2064
ℹ suites 0
ℹ pass 2062
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 2185800.2352
[verificar-impacto] node --test termino con 0 en 2185.9 s.
````
