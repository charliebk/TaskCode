# Peticion de revision — TASK-139a (ronda 2)

- Tarea: TASK-139a — disfraces B1-B5 (parte a de TASK-139)
- Rama revisada: fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di
- Rama base: develop
- Commit revisado (HEAD): 92db90ff55853077cf11f862a9e16327b8aaabfd
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-139a (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 206299494ed2bd8b59fad3b04589fa9c9cdb8fc4 (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-139a/tarea.md
- tareas/03-en-revision/TASK-139a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 2 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | tareas/04-terminadas/TASK-133/tarea.md:30 | informe-revision-1.md |

## Commits a revisar (git log 206299494ed2bd8b59fad3b04589fa9c9cdb8fc4..HEAD)

````
92db90f chore(TASK-139a): autorrevision ronda 2
669a44c fix(TASK-139a): criterio 3 de TASK-133 sin marcar y notas de solo Windows (IMP-1, MEN-1, MEN-2)
10b5e5f chore(TASK-139a): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 206299494ed2bd8b59fad3b04589fa9c9cdb8fc4..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
index 95ea65f..f3b7b42 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
@@ -74,7 +74,9 @@ export function entornoParaBash(
 /**
  * TASK-139a (B4): la coletilla del mensaje de `taskctl doctor` sobre que bash
  * se usa. Pura para probarla en cualquier sistema: en el CI de Linux las
- * aserciones del doctor real solo veian la rama de Linux.
+ * aserciones del doctor real solo veian la rama de Linux. El cableado en
+ * `comprobarBash` (doctor la usa con process.platform) solo se observa en
+ * Windows: en Linux el bash nunca tiene origen 'git'.
  */
 export function textoBashUsado(bash: BashResuelto, plataforma: NodeJS.Platform): string {
   if (bash.origen === 'git') return `; bash de Git: ${bash.comando}`;
````

## Excluido del diff (7 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 206299494ed2bd8b59fad3b04589fa9c9cdb8fc4..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-139a/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-139a/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-139a/revision/informe-revision-1.md                               |  52 ++++++++++++++++++++++++
 tareas/03-en-revision/TASK-139a/revision/peticion-revision-1.md                              | 216 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-139a/tarea.md                                    |  16 ++++++--
 tareas/04-terminadas/TASK-133/tarea.md                                                       |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/resolver-bash.js                  |   4 +-
 7 files changed, 285 insertions(+), 5 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 206299494ed2bd8b59fad3b04589fa9c9cdb8fc4..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts | 2 ++
 1 file changed, 2 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 357.4 s
- Commit verificado: 92db90ff55853077cf11f862a9e16327b8aaabfd
- Huella: ec96c4997a9167ac2e3b6869bc06bb5bd109869d
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 110670 bytes en total):

````
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.5281ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (2.3375ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.4097ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.7713ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.1122ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4464ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5835ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4405ms)
✔ un test cambiado se corre solo el (10220.3714ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (25599.0571ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (44237.2306ms)
✔ un cambio sin commitear tambien cuenta (10663.931ms)
✔ un helper de test elige los tests que lo importan (3686.6717ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (7870.5626ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (5040.4353ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (2417.1269ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (24744.6109ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (28038.858ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) (5712.7563ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (5114.2525ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (11474.4823ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (6735.1751ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (3862.4024ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (15835.8419ms)
[ERROR] verificar-impacto: otra verificacion (pid 2452) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-dsSpNU\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-dsSpNU\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (13915.3571ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (65.7373ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (4882.2744ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (5226.6746ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (14078.9793ms)
ℹ tests 834
ℹ suites 0
ℹ pass 834
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 290248.1618
[verificar-impacto] node --test termino con 0 en 290.9 s.
````
