# Peticion de revision — TASK-147a (ronda 2)

- Tarea: TASK-147a — secciones con un solo lector y un solo «crear al final» (parte a de TASK-147)
- Rama revisada: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
- Rama base: develop
- Commit revisado (HEAD): 48712c17bafc5bd3f827a9988b9132adb2fd6964
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-147a (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 13fa8459264cb6a006d7c74e8eef0ed040c01c08 (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-147a/tarea.md
- tareas/03-en-revision/TASK-147a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/secciones-comunes.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 2 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/troceo.ts (rangoPorCabecera en lineasDeTroceo) | informe-revision-1.md |

## Commits a revisar (git log 13fa8459264cb6a006d7c74e8eef0ed040c01c08..HEAD)

````
48712c1 chore(TASK-147a): autorrevision ronda 2
85c111f fix(TASK-147a): el plan no corta Troceo en Criterios de una parte
aa87812 chore(TASK-147a): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 13fa8459264cb6a006d7c74e8eef0ed040c01c08..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
index dd9b543..a584b30 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
@@ -44,7 +44,7 @@ const DURACION_RE = /duraci[oó]n estimada\s*[*_`]*\s*:/i;
 function lineasDeTroceo(plan: string): string[] | null {
   // TASK-147a: con rangoPorCabecera (dentroDeBloque), no con un interruptor propio de vallas.
   const lineas = plan.replace(/\r/g, '').split('\n');
-  const rango = rangoPorCabecera(lineas, CABECERA_TROCEO_RE);
+  const rango = rangoPorCabecera(lineas, CABECERA_TROCEO_RE, { cortaEnObjetivoOCriterios: false });
   return rango === null ? null : lineas.slice(rango[0] + 1, rango[1]);
 }
 
@@ -148,7 +148,11 @@ const CRITERIOS_RE = /^#{2,3}\s+criterios de aceptaci[oó]n\s*$/i;
  * fuera de bloques de codigo (`dentroDeBloque`, el detector comun); acaba en
  * la siguiente cabecera de su nivel o superior. null si no esta.
  */
-function rangoPorCabecera(lineas: readonly string[], cabecera: RegExp): [number, number] | null {
+function rangoPorCabecera(
+  lineas: readonly string[],
+  cabecera: RegExp,
+  { cortaEnObjetivoOCriterios }: { cortaEnObjetivoOCriterios: boolean }
+): [number, number] | null {
   const enBloque = dentroDeBloque(lineas);
   const ini = lineas.findIndex((l, i) => !enBloque[i] && cabecera.test(l.trim()));
   if (ini === -1) return null;
@@ -159,7 +163,9 @@ function rangoPorCabecera(lineas: readonly string[], cabecera: RegExp): [number,
     const m = /^(#{1,6})\s/.exec(l);
     // Como en extraerSecciones: una cabecera de Objetivo o de Criterios abre
     // su propia seccion aunque sea de nivel 3 (`### Criterios de aceptacion`).
-    const otraSeccion = OBJETIVO_RE.test(l.trim()) || CRITERIOS_RE.test(l.trim());
+    // Solo en tarea.md: en el plan, `### Criterios` dentro de una parte es de
+    // esa parte y no corta `## Troceo` (IMP-1 de la revision de TASK-147a).
+    const otraSeccion = cortaEnObjetivoOCriterios && (OBJETIVO_RE.test(l.trim()) || CRITERIOS_RE.test(l.trim()));
     if (!enBloque[fin] && m !== null && ((m[1] as string).length <= nivel || otraSeccion)) break;
     fin++;
   }
@@ -174,7 +180,7 @@ function rangoPorCabecera(lineas: readonly string[], cabecera: RegExp): [number,
 function reemplazarSeccion(body: string, cabecera: RegExp, titulo: string, contenido: string): string {
   const eol = body.includes('\r\n') ? '\r\n' : '\n';
   const lineas = body.split(/\r?\n/);
-  const rango = rangoPorCabecera(lineas, cabecera);
+  const rango = rangoPorCabecera(lineas, cabecera, { cortaEnObjetivoOCriterios: true });
   const bloque = [titulo, '', ...contenido.split('\n'), ''];
   if (rango === null) return [...bloque, ...lineas].join(eol);
   return [...lineas.slice(0, rango[0]), ...bloque, ...lineas.slice(rango[1])].join(eol);
@@ -231,7 +237,7 @@ export function planificarTroceo(task: Task, body: string, partes: readonly Part
 
 function extraerObjetivo(body: string): string {
   const lineas = body.replace(/\r/g, '').split('\n');
-  const rango = rangoPorCabecera(lineas, OBJETIVO_RE);
+  const rango = rangoPorCabecera(lineas, OBJETIVO_RE, { cortaEnObjetivoOCriterios: true });
   return rango === null ? '' : lineas.slice(rango[0] + 1, rango[1]).join('\n').trim();
 }
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 13fa8459264cb6a006d7c74e8eef0ed040c01c08..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-147a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-147a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-147a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-147a/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-147a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-147a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-147a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-147a/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-147a/revision/informe-revision-1.md                                                  |  21 +++
 tareas/03-en-revision/TASK-147a/revision/peticion-revision-1.md                                                 | 557 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-147a/tarea.md                                                       |  16 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/troceo.js                                            |  12 +-
 12 files changed, 598 insertions(+), 8 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 13fa8459264cb6a006d7c74e8eef0ed040c01c08..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/secciones-comunes.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/secciones-comunes.test.ts | 34 ++++++++++++++++++++++++++++++++++
 1 file changed, 34 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 112.7 s
- Commit verificado: 48712c17bafc5bd3f827a9988b9132adb2fd6964
- Huella: 7e335984331c90439761d8485396460c59f6a6b5
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 87058 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.424ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.7597ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (1.1879ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.1715ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.1135ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.2787ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (4.284ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (2.2716ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (6.7809ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (2.2648ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.6489ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.7707ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1841.9914ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1877.5403ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.9256ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.1938ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.9093ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.8992ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.5767ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9677ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (10.4048ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (12.8557ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6796ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (7.8323ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.8107ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.6322ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (41.359ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.84ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4173ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5436ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3931ms)
ℹ tests 705
ℹ suites 0
ℹ pass 705
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 101860.0655
[verificar-impacto] node --test termino con 0 en 102.0 s.
````
