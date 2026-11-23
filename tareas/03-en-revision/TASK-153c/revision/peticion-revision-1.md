# Peticion de revision — TASK-153c (ronda 1)

- Tarea: TASK-153c — metricas de hallazgos 4D (parte c de TASK-153)
- Rama revisada: feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test
- Rama base: develop
- Commit revisado (HEAD): 39494465e477f912b87cf8538689891f93eb2723
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-153c (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-153c/tarea.md
- tareas/03-en-revision/TASK-153c/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-agregados.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts

## Commits a revisar (git log develop..HEAD)

````
3949446 docs(TASK-153c): autorrevision al ultimo commit
9f0985e test(TASK-153c): la columna 4d va al final de la tabla de metricas
a4790fb docs(TASK-153c): autorrevision
e4af694 feat(TASK-153c): metricas de hallazgos 4D por tarea
57f52ab chore(TASK-153c): tarea en curso
81d617e merge(TASK-153c): develop en feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index d85abdf..1edbb08 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -504,21 +504,50 @@ export function plantillaRegla4D(): string {
 }
 
 /**
- * Que le falta a la seccion `## Regla 4D` de un informe: `['seccion']` si no
- * esta, o las D cuya linea falta o no empieza por `cumple` ni por un ID de
- * hallazgo (`IMP-2`, `MEN-1`): vacia, la plantilla, `TODO`, `n/a` (MEN-1 de
- * la revision). Vacio = completa. La etiqueta se reconoce sin mayusculas,
- * tildes ni enfasis (`- **Duplicación**: cumple`).
+ * Valores de las lineas `- <D>: <valor>` de la seccion `## Regla 4D`, por
+ * etiqueta en minusculas y sin tildes ni enfasis; null si no hay seccion. La
+ * comparten `faltasRegla4D` y `idsRegla4D` (TASK-153c): una sola regla.
  */
-export function faltasRegla4D(informe: string): string[] {
+function valoresRegla4D(informe: string): Map<string, string> | null {
   const lineas = informe.split(/\r?\n/);
   const rango = rangoDeSeccion(lineas, SECCION_REGLA_4D);
-  if (rango === null) return ['seccion'];
+  if (rango === null) return null;
   const valores = new Map<string, string>();
   for (const l of lineas.slice(rango[0] + 1, rango[1])) {
     const m = /^\s*-\s*([^:]+):(.*)$/.exec(l);
     if (m !== null) valores.set(normalizarCelda(m[1] as string).toLowerCase(), normalizarCelda(m[2] as string));
   }
+  return valores;
+}
+
+export type Dimension4D = (typeof DIMENSIONES_4D)[number];
+
+/**
+ * TASK-153c: los ID de hallazgo de cada D en la seccion `## Regla 4D`
+ * (`- Duplicacion: IMP-1, MEN-2` da `['IMP-1', 'MEN-2']`; `cumple`, ninguno);
+ * null si el informe no tiene la seccion (sin dato, no cero).
+ */
+export function idsRegla4D(informe: string): Record<Dimension4D, string[]> | null {
+  const valores = valoresRegla4D(informe);
+  if (valores === null) return null;
+  const salida = {} as Record<Dimension4D, string[]>;
+  for (const d of DIMENSIONES_4D) {
+    const v = valores.get(d.toLowerCase()) ?? '';
+    salida[d] = [...new Set((v.match(/\b[A-Za-z]+-\d+\b/g) ?? []).map((id) => id.toUpperCase()))];
+  }
+  return salida;
+}
+
+/**
+ * Que le falta a la seccion `## Regla 4D` de un informe: `['seccion']` si no
+ * esta, o las D cuya linea falta o no empieza por `cumple` ni por un ID de
+ * hallazgo (`IMP-2`, `MEN-1`): vacia, la plantilla, `TODO`, `n/a` (MEN-1 de
+ * la revision). Vacio = completa. La etiqueta se reconoce sin mayusculas,
+ * tildes ni enfasis (`- **Duplicación**: cumple`).
+ */
+export function faltasRegla4D(informe: string): string[] {
+  const valores = valoresRegla4D(informe);
+  if (valores === null) return ['seccion'];
   return DIMENSIONES_4D.filter((d) => {
     const v = valores.get(d.toLowerCase());
     return v === undefined || !/^(cumple\b|[a-z]+-\d+\b)/i.test(v);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 372da63..889cb17 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -67,10 +67,13 @@ import {
   type ResumenCostes,
 } from './coste-registro.js';
 import {
+  DIMENSIONES_4D,
+  idsRegla4D,
   leerHallazgos,
   resumirHallazgos,
   rondasSoloMenores,
   veredictoDeRonda,
+  type Dimension4D,
   type InformeLeido,
   type ResumenHallazgos,
   type VeredictoInforme,
@@ -179,6 +182,12 @@ export interface FilaMetricas {
   coste: ResumenCostes;
   /** Hallazgos de todas las rondas, una vez por revisor + ID; ver los null en `ResumenHallazgos`. */
   hallazgos: ResumenHallazgos;
+  /**
+   * TASK-153c: hallazgos 4D por D en todos los informes (ID distintos por
+   * revisor, como los hallazgos); null si ningun informe trae la seccion
+   * `## Regla 4D` (sin dato, nunca 0). Para ver si bajan con el tiempo.
+   */
+  hallazgos4D: Record<Dimension4D, number> | null;
   /**
    * TASK-081: lecturas, entrada y cache_lectura de cada (ronda, revisor) de
    * `## Coste`, con los CRITICO/IMPORTANTE de su informe. Vacio = ninguna fila
@@ -471,6 +480,7 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
       revision: e.task.tokens_revision,
     }),
     hallazgos: resumirHallazgos(e.informes ?? []),
+    hallazgos4D: hallazgos4DDe(e.informes ?? []),
     lecturasRevision: lecturasRevisionDe(e.body, e.informes ?? []),
     kbPeticionPorRonda: kbPorRonda(e.peticiones ?? []),
     total: duracionSinPausas(marcas.plan, marcas.finish, marcas.intervalosPausa),
@@ -513,6 +523,20 @@ function lecturasRevisionDe(body: string, informes: readonly InformeLeido[]): Le
   });
 }
 
+/** TASK-153c: ID distintos por D (por revisor) en la seccion Regla 4D de los informes; null sin ninguna seccion. */
+function hallazgos4DDe(informes: readonly InformeLeido[]): Record<Dimension4D, number> | null {
+  const vistos = new Map<Dimension4D, Set<string>>(DIMENSIONES_4D.map((d) => [d, new Set<string>()]));
+  let conSeccion = false;
+  for (const i of informes) {
+    const ids = idsRegla4D(i.texto);
+    if (ids === null) continue;
+    conSeccion = true;
+    for (const d of DIMENSIONES_4D) for (const id of ids[d]) vistos.get(d)?.add(`${i.revisor}|${id}`);
+  }
+  if (!conSeccion) return null;
+  return Object.fromEntries(DIMENSIONES_4D.map((d) => [d, vistos.get(d)?.size ?? 0])) as Record<Dimension4D, number>;
+}
+
 function veredictoRonda1(informes: readonly InformeLeido[]): VeredictoInforme | null {
   const primera = informes.filter((i) => i.ronda === 1);
   return primera.length === 0 ? null : veredictoDeRonda(primera.map((i) => i.texto));
@@ -583,6 +607,11 @@ export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
   { cabecera: 'finish_n', valor: (f) => (f.finishVerificacion === null ? '—' : String(f.finishVerificacion.ejecuciones)) },
   { cabecera: 'finish_v', valor: (f) => (f.finishVerificacion === null ? '—' : formatearDuracion(f.finishVerificacion.duracion)) },
   { cabecera: 'rondas_men', valor: (f) => (f.rondasSoloMenores === null ? '—' : String(f.rondasSoloMenores)) },
+  // TASK-153c: hallazgos 4D de la tarea, duplicacion/desviacion/diluvio/disfraz.
+  {
+    cabecera: '4d',
+    valor: (f) => (f.hallazgos4D === null ? '—' : DIMENSIONES_4D.map((d) => String(f.hallazgos4D?.[d] ?? 0)).join('/')),
+  },
 ];
 
 /**
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-153c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153c/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153c/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-153c/tarea.md                                                       |  8 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                                | 41 ++++++++++++++++++++++++++++++++++-------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                        | 25 ++++++++++++++++++++++++-
 11 files changed, 65 insertions(+), 9 deletions(-)
````

## Tests del diff (5 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-agregados.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-agregados.test.ts  | 34 +++++++++++++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts     |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts            |  6 +++---
 taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts            | 10 +++++++++-
 5 files changed, 49 insertions(+), 8 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 112.2 s
- Commit verificado: 39494465e477f912b87cf8538689891f93eb2723
- Huella: 1d6c9f4321b57fef77e0823398d34b42b8f9b233
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 89560 bytes en total):

````
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (3.8159ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (5.6332ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.6937ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (6.5119ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.9105ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.3062ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.8554ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1272.6774ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1032.9516ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.2505ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (0.8201ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.5773ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.4092ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.0403ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.7214ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.997ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.1449ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.651ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.3891ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.7119ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.3809ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (38.0298ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.4666ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4375ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4901ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4677ms)
✔ revision.md define las 4D con ejemplo y hace IMPORTANTE la duplicacion y el disfraz reales (17.6538ms)
✔ cada revisora da un ejemplo por D en su seccion "## Que se revisa" y remite a revision.md (19.0425ms)
✔ start exige helper buscado, criterio citado y mutacion, anotados en la autorrevision (1.9589ms)
✔ TASK-153a: start y revision.md remiten a la guia de patrones de disfraz, que los define (4.7186ms)
✔ TASK-153b: revision.md pide comprobar los candidatos 4D de la peticion y mutar sus tests (2.3679ms)
ℹ tests 688
ℹ suites 0
ℹ pass 688
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 102129.2325
[verificar-impacto] node --test termino con 0 en 102.2 s.
````
