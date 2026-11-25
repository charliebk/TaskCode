# Peticion de revision — TASK-168 (ronda 3)

- Tarea: TASK-168 — Agilidad: un cambio solo en md de skills o agentes se verifica con sus tests
- Rama revisada: fix/task-168-agilidad-un-cambio-solo-en-md-de-skills
- Rama base: develop
- Commit revisado (HEAD): d69cc7b673094417609bb2cc9aca40163bc60145
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-168 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde c879a368c2e0b4c30a383aaeceeb2ebc3ddee689 (el commit revisado en la ronda anterior)
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
informe de esta ronda (informe-revision-3.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-168/tarea.md
- tareas/03-en-revision/TASK-168/planificacion/
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Hallazgos de la ronda 2 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 2 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:318 | informe-revision-2.md |
| IMP-2 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:335 | informe-revision-2.md |

## Commits a revisar (git log c879a368c2e0b4c30a383aaeceeb2ebc3ddee689..HEAD)

````
d69cc7b docs(TASK-168): autorrevision de la ronda 2 y ronda extra decidida por Carlos
178bda3 fix(TASK-168): ronda 2, quitar comentarios respetando cadenas con el helper del plugin
29eab77 chore(TASK-168): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff c879a368c2e0b4c30a383aaeceeb2ebc3ddee689..HEAD)

````diff
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index eb6e9a6..1830f52 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -79,6 +79,9 @@ import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statS
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
+// TASK-168 (IMP-2 de su revision): quitar comentarios respetando las cadenas
+// ya lo hace el plugin; se usa su build versionado, no una copia.
+import { sinComentariosC as sinComentarios } from '../taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-reglas.js';
 
 export const PLUGIN = 'taskcode-marketplace/plugins/taskcode-plugin';
 const RAPIDO = ['test/core', 'test/cli'];
@@ -110,15 +113,6 @@ const CARPETAS_LEIDAS = [
 ];
 /** La carpeta de CARPETAS_LEIDAS bajo la que vive `rel` (relativa al plugin), o undefined. */
 const carpetaLeida = (rel) => CARPETAS_LEIDAS.find((c) => rel.startsWith(`${c.carpeta}/`));
-/**
- * TASK-168: el texto sin comentarios de bloque ni de linea (`//` y `#` al
- * principio de linea). Aproximado a proposito: basta para que una mencion en
- * un comentario no cuente como uso; un `//` dentro de una cadena recorta de
- * mas, que solo puede hacer que se elija algo de menos en ese fichero.
- */
-function sinComentarios(texto) {
-  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1').replace(/^\s*#.*$/gm, '');
-}
 const LANZA_TASKCTL = MARCADORES[0].patron;
 const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff c879a368c2e0b4c30a383aaeceeb2ebc3ddee689..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-168/revision/informe-revision-1.md  |  61 +++++++++++++++++++++++++++++-----
 tareas/03-en-revision/TASK-168/revision/informe-revision-2.md  |  28 ++++++++++++++++
 tareas/03-en-revision/TASK-168/revision/peticion-revision-2.md | 235 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-168/tarea.md                        |  10 +++++-
 4 files changed, 324 insertions(+), 10 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff c879a368c2e0b4c30a383aaeceeb2ebc3ddee689..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts | 10 +++++++---
 1 file changed, 7 insertions(+), 3 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 108.7 s
- Commit verificado: d69cc7b673094417609bb2cc9aca40163bc60145
- Huella: e245211e9d4887f6678b65f41a6fd3ea54787420
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 72332 bytes en total):

````
✔ un test cambiado se corre solo el (2448.8342ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (1422.3407ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (4563.8944ms)
✔ un cambio sin commitear tambien cuenta (1019.5094ms)
✔ un helper de test elige los tests que lo importan (1228.0849ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (3817.7413ms)
✔ TASK-156: un .md de skills/, agents/ o docs/ del plugin elige los tests que leen su carpeta, ademas de los que lo nombran (6949.0187ms)
✔ TASK-168: un .md de skill o agente no elige a quien solo cita test/skills/ en un comentario ni a quien nombra el SKILL.md de otra skill (2472.706ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (2437.4162ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (1211.6198ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (2086.1806ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (5952.1761ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) ni TIPO_VERIFICACION (2993.6336ms)
✔ TASK-139b: con selectiva y un cambio sin test que lo nombre, corre la suite entera (3225.6406ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (2243.8169ms)
✔ TASK-139b: con TIPO_VERIFICACION=selectiva no hay tope; con freno o sin la variable, si (4055.2874ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (5093.3287ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (3878.4045ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (2558.4346ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (9082.7078ms)
[ERROR] verificar-impacto: otra verificacion (pid 58228) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-41te8x\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-41te8x\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (3000.401ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (13.3183ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (2591.2673ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (2699.0921ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (13543.3562ms)
✔ conDistProtegido (TASK-143c, HAL-2 y HAL-3): devuelve dist/src y suelta el cerrojo aunque fn lance, rechace o sea un thenable sin finally (289.1304ms)
✔ TASK-158c: si HEAD cambia durante la ejecucion, no devuelve la copia de dist/src (es de otro commit) y deja el arbol limpio (1186.222ms)
✔ TASK-158c: una copia huerfana de otro commit tampoco se devuelve (1140.2401ms)
✔ TASK-158c (MEN-1 de su revision): con dist/src sin versionar, un cambio de HEAD no lo borra ni dice que salio de Git (702.8776ms)
ℹ tests 732
ℹ suites 0
ℹ pass 732
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 97643.7837
[verificar-impacto] node --test termino con 0 en 97.7 s.
````
