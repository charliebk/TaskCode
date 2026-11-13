# Peticion de revision — TASK-131 (ronda 1)

- Tarea: TASK-131 — Tres tests con expectativas anteriores a TASK-119
- Rama revisada: fix/task-131-tres-tests-con-expectativas-anteriores-a
- Rama base: develop
- Commit revisado (HEAD): 200411737263b270b5573b77bbb245926565bf66
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-131 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-131/tarea.md
- tareas/03-en-revision/TASK-131/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-ciclo.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-guarda-finish.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts

## Commits a revisar (git log develop..HEAD)

````
2004117 fix(TASK-131): tres tests con la regla vigente desde TASK-119
60d8fb8 chore(TASK-131): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
(solo cambian tests: ver "Tests del diff" mas abajo)
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-131/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-131/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-131/tarea.md                                    | 3 ++-
 3 files changed, 2 insertions(+), 1 deletion(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-ciclo.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-guarda-finish.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-ciclo.test.ts         | 8 ++++++--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/automatico-guarda-finish.test.ts | 3 +++
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts                      | 5 ++++-
 3 files changed, 13 insertions(+), 3 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 104.6 s
- Commit verificado: 200411737263b270b5573b77bbb245926565bf66
- Huella: 6f1fdc2617806e577f034f3dd6f7a34ba6d1deb2
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 74519 bytes en total):

````
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3677ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.5089ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.3249ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.4553ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (53.55ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.2064ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (2.6154ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (1.0465ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.5039ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.206ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.2001ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.2211ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2657ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2636ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2261ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2707ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.5198ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.2457ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.4563ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.3808ms)
✔ resolverAsignado: recorta los tres escalones (0.5066ms)
✔ las siete skills de fase existen, con frontmatter portable y name igual al directorio (72.0165ms)
✔ la descripcion de cada fase es corta, sin < ni >, y especifica del flujo (no se dispara con un «plan» suelto) (212.6291ms)
✔ cada skill de fase nombra su subcomando de taskctl, taskctl siguiente y la seccion de avance (68.6009ms)
✔ la seccion de avance asigna a CADA fase que puede devolver siguiente la skill que le toca (7.4588ms)
✔ las skills de fase y la seccion de avance no mencionan rutas ni documentos internos de este repo (47.4215ms)
✔ plan no reabre una ronda al reanudar (IMP-1) y review no relanza Codex en veredicto-codex (IMP-2) (21.8102ms)
✔ semiautomatico (TASK-058): preguntar y continuar encadenan con la herramienta Skill y la cadena bloquea el arbol (4.8663ms)
✔ automatico (TASK-059): approve sin preguntar, start implementa, review corrige y commitea el informe solo (48.3615ms)
✔ la cadena se cierra en cada camino de salida: detener, no, error (MEN-1 de la revision de TASK-058) (4.3218ms)
✔ approve es el checkpoint humano: solo aprueba con el si de la persona y registra el no con pausa (3.1177ms)
ℹ tests 811
ℹ suites 0
ℹ pass 811
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 87297.8487
[verificar-impacto] node --test termino con 0 en 87.6 s.
````
