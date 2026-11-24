# Peticion de revision — TASK-157 (ronda 1)

- Tarea: TASK-157 — Timeout de claude plugin list acorde al binario real
- Rama revisada: fix/task-157-timeout-de-claude-plugin-list-acorde-al
- Rama base: develop
- Commit revisado (HEAD): 6f3b08b92a9156420817f8523e8c2f835a75bb67
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-157 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-157/tarea.md
- tareas/03-en-revision/TASK-157/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts

## Commits a revisar (git log develop..HEAD)

````
6f3b08b chore(TASK-157): autorrevision
4f01019 fix(TASK-157): timeout de claude plugin list a 30 s (el binario real tarda ~18 s)
3035d63 chore(TASK-157): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
index 3d26665..56f2a0c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
@@ -58,7 +58,11 @@ import { ejecutarHerramienta, localizarHerramienta, pathDelProceso } from '../fs
 
 export type EstadoInstalacionSkill = 'instalado' | 'no-instalado' | 'no-verificable';
 
-const TIMEOUT_MS = 5000;
+// TASK-157: `claude plugin list --json` tarda unos 18 s en Windows con el
+// `claude.exe` real (medido en TASK-155); con 5 s salia siempre
+// 'no-verificable'. 30 s deja margen y sigue acotando la espera de `plan`
+// (que lo llama una vez) si `claude` no responde.
+const TIMEOUT_MS = 30_000;
 
 interface ResultadoPluginList {
   error?: Error | undefined;
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-157/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-157/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-157/tarea.md                                    |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plugin-instalado.js            | 11 ++++++++---
 4 files changed, 14 insertions(+), 4 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts | 23 ++++++++++++++++++++---
 1 file changed, 20 insertions(+), 3 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 98.3 s
- Commit verificado: 6f3b08b92a9156420817f8523e8c2f835a75bb67
- Huella: 07d132eb2976f3ff8ac51eb2e077002b0306d990
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 68839 bytes en total):

````
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.0693ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (4.778ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.8894ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (5.5259ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.8808ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (0.8662ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (1.0643ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (4271.7591ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (5249.5483ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.4273ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2779ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8019ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6003ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.6002ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9503ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.0639ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (46.9475ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.5767ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.0995ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.445ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (30.9866ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (9.4803ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.9384ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4037ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.9897ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4234ms)
✔ comprobarSkillInstalado: un plugin inventado nunca sale como instalado (20636.8598ms)
✔ comprobarSkillInstalado: sin el binario claude en el PATH es no-verificable, sin lanzar (2.1331ms)
✔ comprobarSkillInstalado: con un claude (.cmd en Windows) en el PATH que lista el plugin, instalado (397.8375ms)
✔ comprobarSkillInstalado: con un claude (.cmd en Windows) en el PATH que no lo lista, no-instalado (154.3397ms)
✔ comprobarSkillInstalado: un claude que tarda mas de 5 s en responder llega a dar instalado (7205.7866ms)
ℹ tests 701
ℹ suites 0
ℹ pass 701
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 41703.8924
[verificar-impacto] node --test termino con 0 en 42.6 s.
````
