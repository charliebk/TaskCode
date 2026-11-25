# Peticion de revision — TASK-158c (ronda 2)

- Tarea: TASK-158c — verificar-impacto no devuelve dist/src si HEAD cambio (parte c de TASK-158)
- Rama revisada: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
- Rama base: develop
- Commit revisado (HEAD): 5bf9f9917aa332450e60bcabe824e4fd5bcaf520
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-158c (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 9369bf40f67cc106caebd939ba3cd5d755bb219a (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-158c/tarea.md
- tareas/03-en-revision/TASK-158c/planificacion/
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 1 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:534 | informe-revision-1.md |

## Commits a revisar (git log 9369bf40f67cc106caebd939ba3cd5d755bb219a..HEAD)

````
5bf9f99 docs(TASK-158c): autorrevision de la ronda 1
515dbc0 fix(TASK-158c): ronda 1, el marcador lleva head comprobado y sin checkout no se limpia
7a300fb chore(TASK-158c): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 9369bf40f67cc106caebd939ba3cd5d755bb219a..HEAD)

````diff
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index fb1631a..64bc3e9 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -714,11 +714,16 @@ function devolver(copia, distSrc, habiaDist, head = null) {
   const dirPlugin = path.dirname(path.dirname(distSrc));
   const ahora = head === null ? null : headDe(dirPlugin);
   if (ahora !== null && ahora !== head) {
-    git(['checkout', 'HEAD', '--', 'dist/src'], dirPlugin);
-    git(['clean', '-fdq', '--', 'dist/src'], dirPlugin);
+    // MEN-1 de su revision: solo se limpia si dist/src salio de Git; si no esta
+    // versionado (o el checkout falla), limpiar lo borraria entero.
+    const restaurado = git(['checkout', 'HEAD', '--', 'dist/src'], dirPlugin) !== null;
+    if (restaurado) git(['clean', '-fdq', '--', 'dist/src'], dirPlugin);
     console.log(
       `[verificar-impacto] AVISO: HEAD cambio durante la ejecucion (${head.slice(0, 7)} -> ${ahora.slice(0, 7)}): ` +
-        'no devuelvo la copia de dist/src, que es de otro commit; lo dejo como esta en el HEAD actual.'
+        'no devuelvo la copia de dist/src, que es de otro commit; ' +
+        (restaurado
+          ? 'lo dejo como esta en el HEAD actual.'
+          : 'no he podido sacarlo de Git y lo dejo como esta: "npm run build" lo regenera.')
     );
     rmSync(copia, { recursive: true, force: true });
     return;
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 9369bf40f67cc106caebd939ba3cd5d755bb219a..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-158c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158c/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158c/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-158c/revision/informe-revision-1.md                                                  |  28 +++++++++
 tareas/03-en-revision/TASK-158c/revision/peticion-revision-1.md                                                 | 247 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-158c/tarea.md                                                       |  16 +++++-
 11 files changed, 288 insertions(+), 3 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 9369bf40f67cc106caebd939ba3cd5d755bb219a..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts | 36 ++++++++++++++++++++++++++++++++++++
 1 file changed, 36 insertions(+)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 103.7 s
- Commit verificado: 5bf9f9917aa332450e60bcabe824e4fd5bcaf520
- Huella: 12a403dd70d46141146bde4ef3d1cd96bfaab5a2
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 72178 bytes en total):

````
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3565ms)
✔ un test cambiado se corre solo el (2442.6268ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (1311.3607ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (4684.9188ms)
✔ un cambio sin commitear tambien cuenta (1045.0693ms)
✔ un helper de test elige los tests que lo importan (1316.9113ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (3930.2321ms)
✔ TASK-156: un .md de skills/, agents/ o docs/ del plugin elige los tests que leen su carpeta, ademas de los que lo nombran (5860.0185ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (2294.7909ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (1300.3104ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (1921.7676ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (5591.7199ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) ni TIPO_VERIFICACION (2834.059ms)
✔ TASK-139b: con selectiva y un cambio sin test que lo nombre, corre la suite entera (2903.7951ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (2163.304ms)
✔ TASK-139b: con TIPO_VERIFICACION=selectiva no hay tope; con freno o sin la variable, si (3688.5307ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (5318.414ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (4091.2624ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (2777.7305ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (9124.4616ms)
[ERROR] verificar-impacto: otra verificacion (pid 49584) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-IEMe75\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-IEMe75\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (2682.4048ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (10.3418ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (2455.1577ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (2386.6801ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (12955.7096ms)
✔ conDistProtegido (TASK-143c, HAL-2 y HAL-3): devuelve dist/src y suelta el cerrojo aunque fn lance, rechace o sea un thenable sin finally (359.9829ms)
✔ TASK-158c: si HEAD cambia durante la ejecucion, no devuelve la copia de dist/src (es de otro commit) y deja el arbol limpio (1299.8861ms)
✔ TASK-158c: una copia huerfana de otro commit tampoco se devuelve (1139.4671ms)
✔ TASK-158c (MEN-1 de su revision): con dist/src sin versionar, un cambio de HEAD no lo borra ni dice que salio de Git (627.7232ms)
ℹ tests 731
ℹ suites 0
ℹ pass 731
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 91949.7087
[verificar-impacto] node --test termino con 0 en 92.0 s.
````
