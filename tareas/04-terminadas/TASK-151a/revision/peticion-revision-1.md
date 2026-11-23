# Peticion de revision — TASK-151a (ronda 1)

- Tarea: TASK-151a — core, fs, skills e integracion (parte a de TASK-151)
- Rama revisada: fix/task-151-regla-4d-disfraz-en-tests
- Rama base: develop
- Commit revisado (HEAD): db1a8609267e050090b88d864bc5ec9826676349
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-151a (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-151a/tarea.md
- tareas/03-en-revision/TASK-151a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/rondas-aprobada.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts

## Commits a revisar (git log develop..HEAD)

````
db1a860 chore(TASK-151a): autorrevision
ef3e941 fix(TASK-151a): tests de core, fs, skills e integracion que fallan con su mutante
fbce301 chore(TASK-151a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
(solo cambian tests: ver "Tests del diff" mas abajo)
````

## Excluido del diff (7 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-151a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151a/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151a/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151a/tarea.md                                                       | 10 ++++++++--
 7 files changed, 8 insertions(+), 2 deletions(-)
````

## Tests del diff (7 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/rondas-aprobada.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts            |  7 +++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts           | 12 ++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts                       |  8 +++++---
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/rondas-aprobada.test.ts           | 14 ++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts            |  9 +++++++--
 taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts | 18 +++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts                 | 24 +++++++++++++++---------
 7 files changed, 75 insertions(+), 17 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 57.2 s
- Commit verificado: db1a8609267e050090b88d864bc5ec9826676349
- Huella: c60346cf86e1cb5c69ab870a3c8ed8147d86c3ec
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 71333 bytes en total):

````
✔ git remoto y ramas: isRemoteAvailable, localBranchExists, resolveMainBranch y resolveBaseBranchForTipo (9549.4655ms)
✔ ensureBaseBranchReady: caminos felices, rechazos y pull --ff-only fallido (13916.5119ms)
✔ isInsideWorkTree y operacionEnCurso contra repos reales (merge, cherry-pick, revert y sequencer) (13519.3627ms)
✔ runCodexReview: encuentra y lanza un "codex" real del PATH (no inyectado), y un argumento con espacios llega intacto (92.3507ms)
✔ runCodexReview: un argumento con forma "%VARIABLE%" no se expande con el valor real de esa variable de entorno (hallazgo IMPORTANTE de revision, ronda 2) (75.3336ms)
✔ sin directorio de revision: false, no un error (18.4323ms)
✔ sin informes de la ronda: false (15.0116ms)
✔ solo cuenta la ultima ronda: la 1 aprobada no salva una 2 con cambios (30.1736ms)
✔ la ultima ronda es la de mayor NUMERO: con 10 rondas, la 10 manda sobre la 9 (42.2938ms)
✔ ronda fragmentada: basta un informe en PENDIENTE para que no apruebe (19.234ms)
✔ Codex lleva su propio contador y no se mezcla con la revision primaria (15.5058ms)
✔ listTareasEnEstados: tareasRoot inexistente devuelve vacio, no lanza (22.3376ms)
✔ listTareasEnEstados: lee solo las carpetas pedidas, ignorando el resto (62.4916ms)
✔ listTareasEnEstados: un tarea.md ilegible va a "ilegibles", no rompe la lectura (31.3149ms)
✔ listTareasEnEstados: una carpeta de tarea SIN tarea.md dentro se ignora (27.5611ms)
✔ listTareasEnEstados: ignora entradas que no son un ID de tarea (30.9403ms)
✔ listTareasEnEstados: el mismo ID en dos carpetas ocupa un hueco, no dos (36.5114ms)
✔ listTareasEnEstados: las rutas ilegibles vienen ordenadas (mensaje reproducible) (34.8982ms)
✔ listTareasEnEstados: acepta cualquier subconjunto de estados, no solo el del WIP (33.4991ms)
✔ comprobarSkillInstalado: un plugin inventado nunca sale como instalado (6402.0517ms)
✔ comprobarSkillInstalado: sin el binario claude en el PATH es no-verificable, sin lanzar (1.8659ms)
✔ las siete skills de fase existen, con frontmatter portable y name igual al directorio (27.2447ms)
✔ la descripcion de cada fase es corta, sin < ni >, y especifica del flujo (no se dispara con un «plan» suelto) (10.4942ms)
✔ cada skill de fase nombra su subcomando de taskctl, taskctl siguiente y la seccion de avance (9.2809ms)
✔ la seccion de avance asigna a CADA fase que puede devolver siguiente la skill que le toca (4.7611ms)
✔ las skills de fase y la seccion de avance no mencionan rutas ni documentos internos de este repo (13.3651ms)
✔ plan no reabre una ronda al reanudar (IMP-1) y review no relanza Codex en veredicto-codex (IMP-2) (4.3471ms)
✔ semiautomatico (TASK-058): preguntar y continuar encadenan con la herramienta Skill y la cadena bloquea el arbol (2.8453ms)
✔ automatico (TASK-059): approve sin preguntar, start implementa, review corrige y commitea el informe solo (10.7885ms)
✔ la cadena se cierra en cada camino de salida: detener, no, error (MEN-1 de la revision de TASK-058) (4.0824ms)
✔ approve es el checkpoint humano: solo aprueba con el si de la persona y registra el no con pausa (3.9684ms)
ℹ tests 727
ℹ suites 0
ℹ pass 727
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 43486.3996
[verificar-impacto] node --test termino con 0 en 43.6 s.
````
