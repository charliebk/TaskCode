# Peticion de revision — TASK-117 (ronda 2)

- Tarea: TASK-117 — P-9: new propone la complejidad a partir de tareas parecidas ya cerradas
- Rama revisada: feature/task-117-p-9-new-propone-la-complejidad-a-partir
- Rama base: develop
- Commit revisado (HEAD): 267669be63a3a15c1352fc07a895bcdf88f8b7e8
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-117 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 2973dd702046bf6189339065a8ef354421d0fcc7 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (4 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera. Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale.
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

- tareas/03-en-revision/TASK-117/tarea.md
- tareas/03-en-revision/TASK-117/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/new-complejidad.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/commands/new.ts:382 (efecto en src/core/heuristica.ts:653) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/commands/new.ts:52-54 | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/core/complejidad-similar.ts:42 | informe-revision-1.md |
| MEN-3 | MENOR | abierto | test/commands/new-complejidad.test.ts | informe-revision-1.md |

## Commits a revisar (git log 2973dd702046bf6189339065a8ef354421d0fcc7..HEAD)

````
267669b chore(TASK-117): veredicto ronda 1 (cambios-solicitados)
321d4fa fix(TASK-117): comentario, texto del CLI y test de terminada ilegible (MEN-1..3)
1e0c816 chore(TASK-117): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 2973dd702046bf6189339065a8ef354421d0fcc7..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 560cd62..d423912 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -477,7 +477,8 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
           // TASK-117: la complejidad que se escribio sin --complejidad, y de donde sale.
           (result.complejidadPropuesta === null
             ? ''
-            : `Complejidad propuesta: ${result.complejidadPropuesta.valor} (mediana de ` +
+            : // MEN-2 de la revision: con un numero par, la mediana es la inferior de las centrales.
+              `Complejidad propuesta: ${result.complejidadPropuesta.valor} (mediana, la inferior si son pares, de ` +
               `${result.complejidadPropuesta.desde.join(', ')}, con ${result.complejidadPropuesta.enComun} ` +
               'etiqueta(s) en comun). Cambiala en tarea.md si no encaja.\n')
       );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index 2950947..8c702b3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -50,8 +50,13 @@ export interface NewTaskOptions {
 
 const DEFAULT_SPRINT = 0;
 /**
- * Sin --complejidad la tarea nace sin declararla (null): la decide la
- * heuristica al planificar (TASK-042, decision C4). Antes era `media`.
+ * Valor de `parseNewTaskArgs` sin --complejidad: null. Antes era `media`
+ * (TASK-042, decision C4). Desde TASK-117, `runNewCommand` escribe en su
+ * lugar la complejidad propuesta por las terminadas parecidas, si la hay; si
+ * no, la tarea nace con null y la decide la heuristica al planificar. Ojo
+ * (IMP-1 de la revision, aceptado): la propuesta cuenta como declarada, y la
+ * heuristica toma el maximo entre declarada y propia, asi que solo puede
+ * subir el numero de roles.
  */
 const DEFAULT_COMPLEJIDAD: TaskComplexity | null = null;
 const DEFAULT_MODELO = 'sonnet';
````

## Excluido del diff (8 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 2973dd702046bf6189339065a8ef354421d0fcc7..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/02-en-curso/TASK-117/tarea.md                                                        |  40 --------------
 tareas/{02-en-curso => 03-en-revision}/TASK-117/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-117/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-117/revision/informe-revision-1.md                               |  74 ++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-117/revision/peticion-revision-1.md                              | 285 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-117/tarea.md                                                     |  72 ++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                |   7 +--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                       |   9 +++-
 8 files changed, 442 insertions(+), 45 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 2973dd702046bf6189339065a8ef354421d0fcc7..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/new-complejidad.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/new-complejidad.test.ts | 22 ++++++++++++++++++++--
 1 file changed, 20 insertions(+), 2 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 102.9 s

Final de la salida (truncada: 107361 bytes en total):

````
✔ main: taskctl start sale con codigo 1 y mensaje util cuando el limite esta ocupado (11110.1433ms)
[2026-11-13 00:49:19] [WARN ] No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local.
[2026-11-13 00:49:19] [INFO ] Ya estamos en develop.
[2026-11-13 00:49:19] [WARN ] Sincronizacion omitida: no hay conexion con origin.
[2026-11-13 00:49:19] [INFO ] La rama feature/task-001-enrutado-multi-dominio no existe. Creandola desde develop...
[2026-11-13 00:49:19] [OK   ] Rama feature/task-001-enrutado-multi-dominio creada desde develop
[2026-11-13 00:49:19] [OK   ] Rama activa final: feature/task-001-enrutado-multi-dominio

====================================================
  [OK]  OPERACION : create-feature (feature/task-001-enrutado-multi-dominio)
       RESULTADO : COMPLETADO
       DURACION  : 1s
       DETALLE   : rama feature/task-001-enrutado-multi-dominio creada desde develop
====================================================

[2026-11-13 00:49:21] [WARN ] No hay conexion con origin. Se intentara update en modo local.
[2026-11-13 00:49:22] [OK   ] Switched to branch develop
[2026-11-13 00:49:22] [WARN ] Sincronizacion omitida para develop por falta de conexion remota.
[2026-11-13 00:49:22] [OK   ] Switched to branch feature/task-001-enrutado-multi-dominio
[2026-11-13 00:49:22] [OK   ] Update completado: develop -> feature/task-001-enrutado-multi-dominio

====================================================
  [OK]  OPERACION : update-feature (feature/task-001-enrutado-multi-dominio desde develop)
       RESULTADO : COMPLETADO
       DURACION  : 1s
       DETALLE   : develop integrado en feature/task-001-enrutado-multi-dominio
====================================================

✔ main: "taskctl review" con un diff de 2 dominios imprime una linea de peticion por revisor (hallazgo IMPORTANTE-2 de revision, TASK-018) (12990.0125ms)
✔ main: taskctl plan con 1 rol anuncia la peticion de redaccion y que no hay unificador (4757.5751ms)
✔ main: taskctl plan sin complejidad declarada no imprime "null" en ningun sitio (2427.8417ms)
ℹ tests 909
ℹ suites 0
ℹ pass 909
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 77008.4692
[verificar-impacto] node --test termino con 0 en 77.2 s.
````
