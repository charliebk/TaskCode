# Peticion de revision — TASK-148c (ronda 2)

- Tarea: TASK-148c — utilidades de core (parte c de TASK-148)
- Rama revisada: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
- Rama base: develop
- Commit revisado (HEAD): 8fedf295323e6a0e7dbf7f266d12f883de21cf73
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-148c (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 58964aa182a2cadbef3b5da5ccbf01d11a2e06a7 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (4 hallazgo(s)))

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

- tareas/03-en-revision/TASK-148c/tarea.md
- tareas/03-en-revision/TASK-148c/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-tareas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/utilidades-core.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/catalogo-skills.ts (seleccion sin mayusculas, sin test) | informe-revision-1.md |

## Commits a revisar (git log 58964aa182a2cadbef3b5da5ccbf01d11a2e06a7..HEAD)

````
8fedf29 chore(TASK-148c): autorrevision ronda 2
d3bdc7a fix(TASK-148c): correcciones de la ronda 1 (test de seleccion sin mayusculas, recortar y esObjeto comunes, puerto 0)
06ea3da chore(TASK-148c): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 58964aa182a2cadbef3b5da5ccbf01d11a2e06a7..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-tareas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-tareas.ts
index 05a663f..36ffc7a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-tareas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-tareas.ts
@@ -13,6 +13,7 @@
  * frontmatter). Quien la borra a mano rompe la deduplicacion de ese punto.
  */
 import type { ResultadoPunto } from './doctor-deploy.js';
+import { recortar } from './utilidades-texto.js';
 
 /** Etiqueta comun de todas las tareas creadas por doctor-deploy. */
 export const ETIQUETA_DEPLOY = 'doctor-deploy';
@@ -60,7 +61,8 @@ export function puntoDeEtiquetas(etiquetas: readonly string[]): string | null {
 function plano(texto: string): string {
   // eslint-disable-next-line no-control-regex
   const limpio = texto.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^#+\s*/, '');
-  return limpio.length > MAX_LARGO_TEXTO ? `${limpio.slice(0, MAX_LARGO_TEXTO - 3)}...` : limpio;
+  // TASK-148c (MEN-1 de su revision): el recorte comun (por puntos de codigo, con `…`).
+  return recortar(limpio, MAX_LARGO_TEXTO);
 }
 
 /** `fichero:linea` de las evidencias que lo traen, sin repetir y como mucho `MAX_DONDE`. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
index f3e6bb5..a7dfbaa 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
@@ -17,6 +17,7 @@
  */
 import { createHash } from 'node:crypto';
 import { ocultarCredenciales } from './plataforma-remota.js';
+import { esObjeto } from './utilidades-texto.js';
 
 export type ClaseSecreto = 'secreto' | 'publica' | 'ejemplo';
 
@@ -61,7 +62,7 @@ function decodificarPayloadJwt(jwt: string): Record<string, unknown> | null {
   try {
     const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
     const o: unknown = JSON.parse(json);
-    return typeof o === 'object' && o !== null && !Array.isArray(o) ? (o as Record<string, unknown>) : null;
+    return esObjeto(o) ? o : null;
   } catch {
     return null;
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts
index 2c41ad6..ed1606d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/entrada-pretooluse.ts
@@ -5,6 +5,7 @@
  * de un hook. Sin dependencias: los hooks corren en cada herramienta y no deben
  * cargar el grafo del freno (FS-17).
  */
+import { esObjeto } from '../core/utilidades-texto.js';
 
 export interface EntradaPreToolUse {
   cwd?: unknown;
@@ -23,7 +24,7 @@ export const PASAR: DecisionPreToolUse = Object.freeze({ codigo: 0, stderr: '' }
 export function parsearEntradaHook<T extends object>(texto: string): T {
   try {
     const v: unknown = JSON.parse(texto);
-    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as T) : ({} as T);
+    return esObjeto(v) ? (v as T) : ({} as T);
   } catch {
     return {} as T;
   }
````

## Excluido del diff (14 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 58964aa182a2cadbef3b5da5ccbf01d11a2e06a7..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-148c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148c/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148c/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-148c/revision/informe-revision-1.md                                                  |  21 +++
 tareas/03-en-revision/TASK-148c/revision/peticion-revision-1.md                                                 | 658 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-148c/tarea.md                                                       |  16 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-tareas.js                              |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/secretos.js                                          |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/entrada-pretooluse.js                               |   3 +-
 14 files changed, 699 insertions(+), 6 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 58964aa182a2cadbef3b5da5ccbf01d11a2e06a7..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/utilidades-core.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/utilidades-core.test.ts | 8 ++++++++
 1 file changed, 8 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 297.2 s
- Commit verificado: 8fedf295323e6a0e7dbf7f266d12f883de21cf73
- Huella: c9b37750f1e32c4d1788ec3d1d7bdabd2d664045
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 97375 bytes en total):

````
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (4735.9494ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (27.9626ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.7344ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (1.1368ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6877ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (2.0768ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.408ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.3464ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.2208ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6602ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.8226ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.3585ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.7121ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.618ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8253ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3635ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4641ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3876ms)
✔ gitUserEmail: devuelve el user.email configurado en el repo (993.0347ms)
✔ gitUserEmail: un user.email vacio cuenta como sin identidad (1517.4526ms)
✔ gitUserEmail: recorta el valor (1272.3015ms)
✔ git basico: workspace limpio, rama actual, nombre de rama valido y errores de Git con su mensaje (6560.7757ms)
✔ git remoto y ramas: isRemoteAvailable, localBranchExists, resolveMainBranch y resolveBaseBranchForTipo (34375.4043ms)
✔ ensureBaseBranchReady: caminos felices, rechazos y pull --ff-only fallido (33954.3207ms)
✔ isInsideWorkTree y operacionEnCurso contra repos reales (merge, cherry-pick, revert y sequencer) (40193.6159ms)
✔ runCodexReview: encuentra y lanza un "codex" real del PATH (no inyectado), y un argumento con espacios llega intacto (169.5329ms)
✔ runCodexReview: un argumento con forma "%VARIABLE%" no se expande con el valor real de esa variable de entorno (hallazgo IMPORTANTE de revision, ronda 2) (152.2556ms)
✔ lockfiles: una lista; los que faltaban en la copia de secretos cuentan, requirements.txt no (13.3724ms)
✔ binarios: un UTF-16 con BOM (lleva NUL) es texto y se cuentan sus lineas; un binario de verdad no (7884.441ms)
✔ PATH: en Windows, PATHEXT antes que el nombre pelado (npm.cmd, no el script sh); sin extension solo si se pide (241.8737ms)
✔ JSON con BOM, nombreBase y el texto de las carpetas excluidas (261.8754ms)
ℹ tests 784
ℹ suites 0
ℹ pass 783
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 253823.951
[verificar-impacto] node --test termino con 0 en 254.3 s.
````
