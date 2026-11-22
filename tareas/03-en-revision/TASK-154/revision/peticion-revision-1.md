# Peticion de revision — TASK-154 (ronda 1)

- Tarea: TASK-154 — plan.test.ts en verde en Windows nativo
- Rama revisada: fix/task-154-plan-test-ts-en-verde-en-windows-nativo
- Rama base: develop
- Commit revisado (HEAD): e837ccec5ec2503b8eba5799b583deda4964296f
- Fecha: 2026-11-22
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-154 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-154/tarea.md
- tareas/03-en-revision/TASK-154/planificacion/
- CLAUDE.md
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts

## Commits a revisar (git log develop..HEAD)

````
e837cce docs(TASK-154): autorrevision
2a8ab84 fix(TASK-154): plan.test.ts en verde en Windows nativo
b1993f5 chore(TASK-154): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CLAUDE.md b/CLAUDE.md
index c568db2..71b6f0d 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -87,15 +87,13 @@ que lo comprueban.
   `finish --merge-request` (ver el README del plugin).
 - El glob de `npm test` va entrecomillado a propósito: lo expande Node, no el
   shell. Sin comillas, la suite entera falla en `cmd.exe`.
-- En Windows nativo **fallan 2 tests y no son regresiones** (los dos de
-  `plan.test.ts`): uno porque `chmod` sobre directorios no hace nada en NTFS,
-  y uno por finales de línea (CRLF). El tercero de antes, el del truco del
-  symlink de `approve.test.ts`, se omite (`skipped`) cuando no hay privilegio
-  de symlink (TASK-120: bloqueaba la verificación por impacto de cualquier
-  tarea que tocara `approve.ts`). En el CI de Linux pasan los tres. Aquí
-  «suite en verde» significa que fallan solo esos dos. Ojo: bajo carga
-  aparecen además rojos intermitentes de `EBUSY ... rmdir` al limpiar los
-  repos temporales; fallan en el *teardown*, no en la aserción, y no son
-  tuyos. Cualquier otro tercer rojo sí lo es.
+- En Windows nativo la suite **ya no tiene rojos esperados** (TASK-154): el
+  test de `plan.test.ts` que necesita `chmod` se omite (`skipped`) porque en
+  NTFS el modo no impide escribir, el de CRLF compara sin finales de línea, y
+  el del symlink de `approve.test.ts` se omite sin privilegio de symlink
+  (TASK-120). En el CI de Linux corren los tres. Ojo: bajo carga aparecen
+  rojos intermitentes de `EBUSY ... rmdir` al limpiar los repos temporales;
+  fallan en el *teardown*, no en la aserción, y no son tuyos. Cualquier otro
+  rojo sí lo es.
 
 El resto, en `docs/contexto/HALLAZGOS.md`.
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-154/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-154/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-154/tarea.md                                    | 10 ++++++++--
 3 files changed, 8 insertions(+), 2 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts | 19 +++++++++++++++++--
 1 file changed, 17 insertions(+), 2 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 55.0 s
- Commit verificado: e837ccec5ec2503b8eba5799b583deda4964296f
- Huella: eb14c82269aab6cc4387d82a6bbc3578c06dc8d8
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 65513 bytes en total):

````
✔ tieneAncla: codigo, rutas, flags, comandos, tests y numeros cuentan; IDs y secciones no (0.5178ms)
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (1.061ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (1.3909ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (1ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.639ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.0178ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (2.5254ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.6695ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (4.7638ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.8243ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.0524ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.4319ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (782.0921ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (756.3809ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (0.9594ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (0.6158ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.4233ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.33ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (0.9418ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.64ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.5657ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (7.6537ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.5641ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.4527ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.3867ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.1424ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (18.9748ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.2945ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.2422ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.2652ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.2079ms)
ℹ tests 670
ℹ suites 0
ℹ pass 669
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 44240.4782
[verificar-impacto] node --test termino con 0 en 44.3 s.
````
