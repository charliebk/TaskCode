# Peticion de revision — TASK-147a (ronda 3)

- Tarea: TASK-147a — secciones con un solo lector y un solo «crear al final» (parte a de TASK-147)
- Rama revisada: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
- Rama base: develop
- Commit revisado (HEAD): 89da350f86f041968e0b605cbe23d7d29b86eaac
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-147a (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 48712c17bafc5bd3f827a9988b9132adb2fd6964 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (2 hallazgo(s)))

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

- tareas/03-en-revision/TASK-147a/tarea.md
- tareas/03-en-revision/TASK-147a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/secciones-comunes.test.ts

## Hallazgos de la ronda 2 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/troceo.ts (rangoPorCabecera en lineasDeTroceo) | informe-revision-2.md |
| IMP-2 | IMPORTANTE | corregido | src/core/troceo.ts (lineasDeTroceo, cortaEnObjetivoOCriterios: false) | informe-revision-2.md |

## Commits a revisar (git log 48712c17bafc5bd3f827a9988b9132adb2fd6964..HEAD)

````
89da350 chore(TASK-147a): ronda extra decidida por Carlos
0504c15 fix(TASK-147a): Criterios tras la ultima parte cierran Troceo
e61ab51 chore(TASK-147a): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 48712c17bafc5bd3f827a9988b9132adb2fd6964..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
index a584b30..571b6de 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
@@ -45,7 +45,23 @@ function lineasDeTroceo(plan: string): string[] | null {
   // TASK-147a: con rangoPorCabecera (dentroDeBloque), no con un interruptor propio de vallas.
   const lineas = plan.replace(/\r/g, '').split('\n');
   const rango = rangoPorCabecera(lineas, CABECERA_TROCEO_RE, { cortaEnObjetivoOCriterios: false });
-  return rango === null ? null : lineas.slice(rango[0] + 1, rango[1]);
+  if (rango === null) return null;
+  const [ini, fin] = rango;
+  // IMP-2 de la revision: `### Criterios` u `### Objetivo` entre dos partes es
+  // de la parte de arriba; despues de la ultima parte ya no es de ninguna y
+  // cierra la seccion (sus criterios no se cuelan en la ultima parte).
+  const enBloque = dentroDeBloque(lineas);
+  let ultimaParte = -1;
+  for (let i = ini + 1; i < fin; i++) if (!enBloque[i] && CABECERA_PARTE_RE.test((lineas[i] as string).trim())) ultimaParte = i;
+  let corte = fin;
+  for (let i = Math.max(ultimaParte, ini) + 1; i < fin; i++) {
+    const l = (lineas[i] as string).trim();
+    if (!enBloque[i] && (OBJETIVO_RE.test(l) || CRITERIOS_RE.test(l))) {
+      corte = i;
+      break;
+    }
+  }
+  return lineas.slice(ini + 1, corte);
 }
 
 /**
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 48712c17bafc5bd3f827a9988b9132adb2fd6964..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-147a/revision/informe-revision-1.md       |  24 ++++++++++---
 tareas/03-en-revision/TASK-147a/revision/informe-revision-2.md       |  21 ++++++++++++
 tareas/03-en-revision/TASK-147a/revision/peticion-revision-2.md      | 229 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-147a/tarea.md                             |  10 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/troceo.js |  21 +++++++++++-
 5 files changed, 298 insertions(+), 7 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 48712c17bafc5bd3f827a9988b9132adb2fd6964..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/secciones-comunes.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/secciones-comunes.test.ts | 13 +++++++++++++
 1 file changed, 13 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 111.2 s
- Commit verificado: 89da350f86f041968e0b605cbe23d7d29b86eaac
- Huella: 3fc68e66f90e093d3eb3e67b08f1a5692ad2be08
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 87162 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.3219ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.6365ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (1.224ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (0.9453ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (0.9667ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (1.9322ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (9.8771ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (2.5215ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (7.1224ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (5.7511ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (2.7037ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (1.4699ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1803.9424ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1683.2544ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.9167ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.1685ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8373ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6425ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.5895ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0101ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.8246ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.4591ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.5627ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.7193ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (4.2945ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.4558ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (47.4101ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.935ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.5896ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4274ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.5062ms)
ℹ tests 706
ℹ suites 0
ℹ pass 706
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 100822.8324
[verificar-impacto] node --test termino con 0 en 100.9 s.
````
