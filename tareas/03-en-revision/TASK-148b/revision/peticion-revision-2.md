# Peticion de revision — TASK-148b (ronda 2)

- Tarea: TASK-148b — validacion de config (parte b de TASK-148)
- Rama revisada: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
- Rama base: develop
- Commit revisado (HEAD): a4fca666a847f21e9f1a598cda9a152160059e99
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-148b (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 45857fa794e615825c537cb5b081a46c65387be4 (el commit revisado en la ronda anterior)
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
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-148b/tarea.md
- tareas/03-en-revision/TASK-148b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/agents/revisor-seguridad-deploy.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-veredictos.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/config-validacion-comun.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/utilidades-comunes.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 4 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/fs/evidencia-veredicto.ts (comprobadorEnCommit normaliza, sin test) | informe-revision-1.md |

## Commits a revisar (git log 45857fa794e615825c537cb5b081a46c65387be4..HEAD)

````
a4fca66 chore(TASK-148b): autorrevision ronda 2
2ee1779 fix(TASK-148b): correcciones de la ronda 1 (veredictos normalizados con test, patrones sin ..)
f2675e9 chore(TASK-148b): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 45857fa794e615825c537cb5b081a46c65387be4..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/revisor-seguridad-deploy.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/revisor-seguridad-deploy.md
index 857d8f3..f61083f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/revisor-seguridad-deploy.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/revisor-seguridad-deploy.md
@@ -87,8 +87,8 @@ Reglas del formato, que se comprueban una por una:
 
 - `estado` es `ok`, `falla` o `no-verificado`. Nada más.
 - `ok` y `falla` **exigen** `fichero` y `linea`. `no-verificado` no los lleva.
-- `fichero` es una ruta **relativa a la raíz del repositorio**, con `/`, sin `..`
-  y sin ruta absoluta, de un fichero que esté versionado en ese commit, y
+- `fichero` es una ruta **relativa a la raíz del repositorio**, con `/`, sin salir
+  de ella y sin ruta absoluta, de un fichero que esté versionado en ese commit, y
   `linea` es un entero que existe en él.
 - `motivo`: una frase, de 300 caracteres como máximo, sin saltos de línea, sin
   código y sin valores. Qué viste y por qué eso decide el punto.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index d1f63aa..3426c02 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -128,7 +128,7 @@ import { existsSync, readFileSync, statSync } from 'node:fs';
 import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
 import { describirValor } from './campos-catalogo.js';
-import { problemaDeRutaRelativa } from './ruta-relativa.js';
+import { normalizarRutaRelativa, problemaDeRutaRelativa } from './ruta-relativa.js';
 import { masParecida } from './sugerencia.js';
 import { normalizarBase, type Plataforma } from './plataforma-remota.js';
 import { STATE_FOLDER } from './task.js';
@@ -1057,7 +1057,7 @@ function validarInformeCobertura(donde: string, valor: unknown): string {
         '        Es la ruta del fichero lcov relativa a la raiz del repo, p. ej. informe_cobertura: coverage/lcov.info.'
     );
   }
-  return path.posix.normalize(texto.replace(/\\/g, '/'));
+  return normalizarRutaRelativa(texto);
 }
 
 /**
@@ -1075,7 +1075,7 @@ function validarDocumentoEstado(donde: string, valor: unknown): string {
         '        Es la ruta del documento de estado del proyecto relativa a la raiz del repo, p. ej. documento_estado: docs/ESTADO.md.'
     );
   }
-  return path.posix.normalize(texto.replace(/\\/g, '/'));
+  return normalizarRutaRelativa(texto);
 }
 
 /** Numero de 0 a 100 (admite decimales). */
@@ -1135,11 +1135,14 @@ function validarPatronesExclusion(
       );
     }
     const conBarras = elemento.trim().replace(/\\/g, '/');
-    const problema = problemaDeRutaRelativa(conBarras);
-    if (problema === 'absoluta' || problema === 'sale') {
+    // Un patron glob no es una ruta: git no resuelve `..` como lo haria el sistema de
+    // ficheros (`a/../**` excluye todo el repo). Aqui `..` se rechaza siempre (MEN-5 de la
+    // revision de TASK-148b); lo absoluto, con la regla comun.
+    const absoluto = problemaDeRutaRelativa(conBarras) === 'absoluta';
+    if (absoluto || conBarras.split('/').includes('..')) {
       throw new ConfigError(
         `[ERROR] ${donde}: el patron "${elemento.trim()}" de "${clave}" no vale: ` +
-          `${problema === 'absoluta' ? 'es absoluto' : 'sale del repo con ".."'}.\n` +
+          `${absoluto ? 'es absoluto' : 'sale del repo con ".."'}.\n` +
           '        Los patrones son relativos a la raiz del repo y siguen la semantica de ' +
           'git :(glob) (por ejemplo **/dist/**).'
       );
@@ -1273,7 +1276,7 @@ function validarRutasSincronizacion(donde: string, valor: unknown): readonly str
           'nunca dentro de una carpeta de estado.'
       );
     }
-    const normalizada = path.posix.normalize(original.replace(/\\/g, '/'));
+    const normalizada = normalizarRutaRelativa(original);
     if (!rutas.includes(normalizada)) rutas.push(normalizada);
   }
   return rutas;
@@ -1306,7 +1309,7 @@ function motivoRutaInvalida(
   if (problema === 'sale') return 'se sale del repo';
   if (problema === 'control') return 'lleva caracteres de control';
   if (conBarras.endsWith('/')) return 'es una carpeta';
-  const normalizada = path.posix.normalize(conBarras);
+  const normalizada = normalizarRutaRelativa(conBarras);
   if (normalizada === '.' || normalizada === '') return 'es la raiz del repo';
   const segmentos = normalizada.split('/');
   const primera = segmentos[0] as string;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-veredictos.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-veredictos.ts
index 8b6d225..490019e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-veredictos.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-veredictos.ts
@@ -101,7 +101,8 @@ export function parsearResultado(texto: string): EntradaResultado {
 
 /**
  * Comprueba la RUTA de una evidencia, sin tocar disco: null si es admisible, o el motivo del
- * rechazo. Relativa al repo, con `/` o `\`, sin `..`, sin unidad ni raiz, sin caracteres de control.
+ * rechazo. Relativa al repo, con `/` o `\`, sin salir de su raiz (un `..` que no sale se normaliza),
+ * sin unidad ni raiz, sin caracteres de control.
  */
 export function motivoRutaInvalida(ruta: string): string | null {
   // TASK-148b (CORE1-10): la regla comun de core/ruta-relativa.ts, con el texto de las evidencias.
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 45857fa794e615825c537cb5b081a46c65387be4..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-148b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-148b/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-148b/revision/informe-revision-1.md                                                  |  21 ++++
 tareas/03-en-revision/TASK-148b/revision/peticion-revision-1.md                                                 | 541 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-148b/tarea.md                                                       |  16 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                            |  19 +--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-veredictos.js                          |   3 +-
 13 files changed, 588 insertions(+), 12 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 45857fa794e615825c537cb5b081a46c65387be4..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/config-validacion-comun.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/utilidades-comunes.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/config-validacion-comun.test.ts | 15 +++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/utilidades-comunes.test.ts        |  4 ++++
 2 files changed, 19 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 545.7 s
- Commit verificado: a4fca666a847f21e9f1a598cda9a152160059e99
- Huella: 801667a644b15add424f6b57240be8b7edbe3045
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 129442 bytes en total):

````
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.7175ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (11.8263ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.7789ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.7598ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.6383ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (5.5836ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (2.3404ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.5971ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.8535ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.6864ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (1.0362ms)
✔ lockfiles: una lista; los que faltaban en la copia de secretos cuentan, requirements.txt no (2.0932ms)
✔ binarios: un UTF-16 con BOM (lleva NUL) es texto y se cuentan sus lineas; un binario de verdad no (8515.361ms)
✔ PATH: en Windows, PATHEXT antes que el nombre pelado (npm.cmd, no el script sh); sin extension solo si se pide (65.0009ms)
✔ JSON con BOM, nombreBase y el texto de las carpetas excluidas (30.9287ms)
✔ sin fichero de config: .taskcode ausente, vacio, config.yml vacio o solo comentarios -> defaults, sin quejarse (5586.6132ms)
✔ las tres claves puestas se leen las tres; rama_base cambia feature/fix/release pero NO hotfix (6384.8218ms)
✔ taskctl new: CAMBIA de verdad a la rama configurada y escribe el revisor del config en el tarea.md (6473.5563ms)
✔ agente_revisor_por_defecto: --agente-revisor sigue mandando sobre el config (5943.0805ms)
✔ agente_revisor_por_defecto: taskctl import usa el MISMO valor que new (la duplicacion desaparecio) (4086.3749ms)
✔ limite_wip: con limite 3 dos tareas abiertas ya no bloquean (con 1, si) y el mensaje dice el limite real (1.6545ms)
✔ invalido: limite_wip texto, 0, -1, decimal o booleano abortan (0 no significa "sin limite") (2.119ms)
✔ invalido: rama_base vacia (en comillas o sin valor) y agente_revisor_por_defecto vacio abortan (1.3063ms)
✔ clave desconocida: avisa (no aborta), sugiere la parecida, enumera las validas y se ignora; las descartadas por la decision #9 tambien (11.1609ms)
✔ invalido: clave repetida, linea sin ":" y el mensaje nombra fichero y linea (2.7479ms)
✔ fallo cerrado real: con un config roto resolveBaseBranchForTipo NO cae a "develop" y taskctl new / import abortan sin crear la tarea (4140.8288ms)
✔ sintaxis: comentario inline se descarta, comillas y espacios de sobra se recortan, CRLF no rompe (1.349ms)
✔ el parser compartido NO cambio el comportamiento del frontmatter (0.5226ms)
✔ ubicacion: se busca en la RAIZ del repo (tambien desde un subdirectorio) y un .taskcode que es un FICHERO aborta (3619.8927ms)
✔ ubicacion: la busqueda PARA en la raiz del repo (un config de mas arriba no manda) (395.1137ms)
✔ parsearConfig: modo_flujo acepta los tres valores, invalido aborta (lista los validos y sugiere el parecido) y repetido aborta (1.3455ms)
ℹ tests 841
ℹ suites 0
ℹ pass 841
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 519972.387
[verificar-impacto] node --test termino con 0 en 527.9 s.
````
