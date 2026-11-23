# Peticion de revision — TASK-144b (ronda 2)

- Tarea: TASK-144b — flags con y sin valor (parte b de TASK-144)
- Rama revisada: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
- Rama base: develop
- Commit revisado (HEAD): 3ac4b25555755e33c6682f7f9b83a64aba5dad34
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-144b (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 3db54b20e2a38d8a4f161feabad4642b27126980 (el commit revisado en la ronda anterior)
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
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-144b/tarea.md
- tareas/03-en-revision/TASK-144b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-paridad.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/cli/args.ts (FLAGS_SIN_VALOR, --tokens) | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido | src/commands/verificar-lote.ts, src/core/config.ts, test/commands/verificar-lote.test.ts | informe-revision-1.md |

## Commits a revisar (git log 3db54b20e2a38d8a4f161feabad4642b27126980..HEAD)

````
3ac4b25 docs(TASK-144b): autorrevision ronda 2
70243c6 test(TASK-144b): duracion-estimada cuenta la columna 4d de TASK-153c; criterio del recorte en TASK-139
b4770e8 fix(TASK-144b): IMP-1..2 y MENOR-1..3 de la revision; regresion de metricas de TASK-153c
84f7d42 chore(TASK-144b): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 3db54b20e2a38d8a4f161feabad4642b27126980..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
index fb1bb91..fa94d2f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
@@ -130,6 +130,9 @@ export const FLAGS_REPETIBLES: readonly string[] = ['--agente', '--repo', '--cri
  * que `--flag=valor` aborta. TASK-144b (FS-01): faltaban los de review,
  * finish y estado (`--completa=1` se ignoraba en silencio); un test recorre
  * src/commands y falla si un comando lee por token un booleano que no esta.
+ * La lista es GLOBAL: un flag que es booleano en un comando y lleva valor en
+ * otro no puede estar aqui (IMP-1 de su revision: `--tokens` es booleano en
+ * metricas, que lo valida por su cuenta, y lleva valor en registrar-coste).
  */
 export const FLAGS_SIN_VALOR: readonly string[] = [
   '--push',
@@ -142,7 +145,6 @@ export const FLAGS_SIN_VALOR: readonly string[] = [
   '--merge-request',
   '--evolucion',
   '--grupos',
-  '--tokens',
   '--por-version',
   '--completa',
   '--ronda-extra',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
index 2dfc226..482486d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
@@ -239,7 +239,7 @@ export async function verificarCadena(repoCwd: string, testigo: string | undefin
   );
 }
 
-/** Saca `--cadena <testigo>` (o `--cadena=<testigo>`) de argv. Sin valor, testigo vacio (y falla al validar). */
+/** Saca `--cadena <testigo>` (o `--cadena=<testigo>`) de argv. Sin testigo o vacio, aborta (CadenaCommandError). */
 export function extraerCadena(argv: readonly string[]): { testigo: string | undefined; resto: string[] } {
   // TASK-144b: el lector comun de flag con valor. TASK-065: un --cadena
   // repetido no se pisa en silencio; sin testigo aborta (MEN-2: un testigo
@@ -253,4 +253,3 @@ export function extraerCadena(argv: readonly string[]): { testigo: string | unde
   );
   return { testigo: valor ?? undefined, resto };
 }
-
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index 7579828..94c8bcf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -545,6 +545,10 @@ export type Dimension4D = (typeof DIMENSIONES_4D)[number];
 export function idsRegla4D(informe: string): Record<Dimension4D, string[]> | null {
   const valores = valoresRegla4D(informe);
   if (valores === null) return null;
+  // Una seccion sin rellenar (la plantilla, o ninguna linea con `cumple` ni
+  // con un ID) no es «cero hallazgos»: es sin dato, como sin seccion.
+  const rellena = DIMENSIONES_4D.some((d) => /^(cumple\b|[a-z]+-\d+\b)/i.test(valores.get(d.toLowerCase()) ?? ''));
+  if (!rellena) return null;
   const salida = {} as Record<Dimension4D, string[]>;
   for (const d of DIMENSIONES_4D) {
     const v = valores.get(d.toLowerCase()) ?? '';
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 3db54b20e2a38d8a4f161feabad4642b27126980..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/00-planificadas/TASK-139/tarea.md                                                                        |   1 +
 tareas/{02-en-curso => 03-en-revision}/TASK-144b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-144b/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-144b/revision/informe-revision-1.md                                                  |  21 +++
 tareas/03-en-revision/TASK-144b/revision/peticion-revision-1.md                                                 | 627 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-144b/tarea.md                                                       |  16 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js                                               |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/cadena.js                                        |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                                  |   5 +
 15 files changed, 671 insertions(+), 5 deletions(-)
````

## Tests del diff (5 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 3db54b20e2a38d8a4f161feabad4642b27126980..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-paridad.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-paridad.test.ts          | 23 +++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts          | 11 +++++++----
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts    | 48 ++++++++++++++++++++++++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts              | 10 ++++++++++
 5 files changed, 88 insertions(+), 8 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 132.1 s
- Commit verificado: 3ac4b25555755e33c6682f7f9b83a64aba5dad34
- Huella: bbfcb58f6afe180a45eb89b69255490097f83871
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 94230 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.3949ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.809ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (1.9916ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.6232ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.0822ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.3615ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (3.1907ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.7262ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (5.6559ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (2.3028ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.1079ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.8106ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1964.1795ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1872.1619ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.0193ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.1883ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8584ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (2.827ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.4523ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1145ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (5.5948ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.1684ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6494ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (8.8484ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (2.3604ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.6383ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (36.4596ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.936ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (6.8422ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5706ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3886ms)
ℹ tests 775
ℹ suites 0
ℹ pass 774
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 120948.5582
[verificar-impacto] node --test termino con 0 en 121.1 s.
````
