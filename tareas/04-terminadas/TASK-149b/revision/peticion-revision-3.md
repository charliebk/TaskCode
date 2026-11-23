# Peticion de revision — TASK-149b (ronda 3)

- Tarea: TASK-149b — errores y flags del CLI (parte b de TASK-149)
- Rama revisada: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
- Rama base: develop
- Commit revisado (HEAD): fe205978dd40b1643169c58a137cbdb7a90c8988
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-149b (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 2baa0fbcbf9b9f9cb62848fe589070650ac8d7a7 (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-149b/tarea.md
- tareas/03-en-revision/TASK-149b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/test/cli/errores-comunes.test.ts

## Hallazgos de la ronda 2 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/cli.ts (ERRORES_COMUNES_CLI, esErrorComunCli), test/cli/errores-comunes.test.ts | informe-revision-2.md |
| IMP-2 | IMPORTANTE | corregido | test/cli/errores-comunes.test.ts (lista de 9 clases) | informe-revision-2.md |

## Commits a revisar (git log 2baa0fbcbf9b9f9cb62848fe589070650ac8d7a7..HEAD)

````
fe20597 chore(TASK-149b): ronda extra decidida por Carlos
e6292de fix(TASK-149b): el test compara las clases comunes con la lista exportada (IMP-2)
4977e0e chore(TASK-149b): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 2baa0fbcbf9b9f9cb62848fe589070650ac8d7a7..HEAD)

````diff
(solo cambian tests: ver "Tests del diff" mas abajo)
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 2baa0fbcbf9b9f9cb62848fe589070650ac8d7a7..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-149b/revision/informe-revision-1.md  |  23 ++++++++++---
 tareas/03-en-revision/TASK-149b/revision/informe-revision-2.md  |  21 ++++++++++++
 tareas/03-en-revision/TASK-149b/revision/peticion-revision-2.md | 240 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-149b/tarea.md                        |  10 +++++-
 4 files changed, 288 insertions(+), 6 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 2baa0fbcbf9b9f9cb62848fe589070650ac8d7a7..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/cli/errores-comunes.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/cli/errores-comunes.test.ts | 8 +++++++-
 1 file changed, 7 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 140.5 s
- Commit verificado: fe205978dd40b1643169c58a137cbdb7a90c8988
- Huella: 850846539d6252988c681e9670b956f1f80b572b
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 146595 bytes en total):

````
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (3370.7689ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (2732.4248ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.7747ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2435ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8132ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.5732ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.4476ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.8715ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.5964ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (7.0825ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.5668ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.6248ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.6854ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (5.6692ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (2.2233ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8384ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.423ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5465ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.5452ms)
✔ autoCommit NO se lleva el trabajo de la persona: su fichero sucio no entra en el commit y sigue sucio (2983.7014ms)
✔ autoCommit respeta lo que la persona ya tenia PREPARADO con git add (modo --only) (3232.5195ms)
✔ autoCommit registra el MOVIMIENTO de carpeta (origen borrado + destino) en un solo commit (2652.7173ms)
✔ autoCommit no crea commits vacios cuando el fichero ya estaba identico (1735.3208ms)
✔ autoCommit ignora rutas que no existen ni en disco ni en el indice (carpeta de origen no versionada) (2173.0287ms)
✔ autoCommit falla RUIDOSAMENTE si un hook de pre-commit rechaza, diciendo que esta escrito pero no registrado (2291.1789ms)
✔ autoCommit rechaza la raiz del repo y cualquier ruta de fuera (no hay git add -A por la puerta de atras) (1406.3533ms)
✔ autoCommit --push: con un origin bare real, la rama llega al remoto (4472.3315ms)
✔ autoCommit --push sin remoto: avisa y sigue (no lanza), y el commit local se hace igual (1931.0442ms)
✔ autoCommit --push con HEAD desacoplado: avisa y no intenta subir nada (1770.5137ms)
✔ autoCommit --push que falla de verdad: lanza diciendo que el commit SI se creo (4370.2179ms)
✔ mensajeChore: formato del repo y rechazo de tildes (los scripts de Git-Flow los procesan) (0.566ms)
ℹ tests 788
ℹ suites 0
ℹ pass 787
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 129894.5282
[verificar-impacto] node --test termino con 0 en 130.0 s.
````
