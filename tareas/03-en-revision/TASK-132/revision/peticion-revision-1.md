# Peticion de revision — TASK-132 (ronda 1)

- Tarea: TASK-132 — Ayudante caso() de los tests fusionados en un unico helper compartido
- Rama revisada: fix/task-132-ayudante-caso-de-los-tests-fusionados-en
- Rama base: develop
- Commit revisado (HEAD): 47528c9577a0937047319897f6148105c10263b8
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-132 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-132/tarea.md
- tareas/03-en-revision/TASK-132/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/helpers/caso.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts

## Commits a revisar (git log develop..HEAD)

````
47528c9 fix(TASK-132): ayudante caso() de los tests fusionados en test/helpers/caso.ts
7e4ed54 chore(TASK-132): tarea en curso
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
tareas/{01-en-diseno => 02-en-curso}/TASK-132/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-132/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-132/tarea.md                                    | 3 ++-
 3 files changed, 2 insertions(+), 1 deletion(-)
````

## Tests del diff (11 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/helpers/caso.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts | 11 +----------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts       | 11 +----------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts    | 11 +----------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts              | 11 +----------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts     | 11 +----------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts                     | 11 +----------
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts                              | 11 +----------
 taskcode-marketplace/plugins/taskcode-plugin/test/helpers/caso.ts                             | 14 ++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts                    | 11 +----------
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts         | 11 +----------
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-merge.test.ts                 | 11 +----------
 11 files changed, 24 insertions(+), 100 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 231.5 s
- Commit verificado: 47528c9577a0937047319897f6148105c10263b8
- Huella: 1b50f103c1b140718daea664d1b2a8e186b5a663
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 73038 bytes en total):

````
  --------------------------------------------------
  feature/task-700-prueba-finish  -->  develop
  --------------------------------------------------

  Commits que se van a integrar:
    fe1697b chore(TASK-951): cierre solo documentacion
    63a3962 cambio en docs/guia.md
    aaac0a0 feat(TASK-951): trabajo revisado

  Ficheros afectados:
     docs/guia.md                                       |  1 +
     .../TASK-951/revision/informe-revision-1.md        |  3 +++
     tareas/03-en-revision/TASK-951/tarea.md            | 30 ++++++++++++++++++++++
     trabajo-TASK-951.txt                               |  1 +
     4 files changed, 35 insertions(+)

[2026-11-13 16:34:14] [OK   ] Merge completado: feature/task-700-prueba-finish -> develop

====================================================
  [OK]  OPERACION : merge-feature -> develop (feature/task-700-prueba-finish)
       RESULTADO : COMPLETADO
       DURACION  : 3s
       DETALLE   : 3 commit(s) integrados en develop
====================================================

✔ guardian TASK-101: exencion de documentacion, release, config del destino y bloqueos de punta a punta (105647.6847ms)
✔ comandoSoloIntegra: solo un merge, cambiar de carpeta o de rama y consultar (3.4478ms)
✔ guardian TASK-105 y TASK-108: seleccion parcial, nivel 2 y mensajes de bloqueo (47119.3983ms)
✔ comando-merge: segmentacion, deteccion de merges, wrappers de shell y casos de TASK-103 (16.771ms)
✔ guardia: decision de bloquear o dejar pasar un merge segun verde guardado, ramas y config (73146.3221ms)
✔ guardia: punto de entrada real por stdin y hooks.json (69057.3063ms)
ℹ tests 730
ℹ suites 0
ℹ pass 730
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 214421.3324
[verificar-impacto] node --test termino con 0 en 214.5 s.
````
