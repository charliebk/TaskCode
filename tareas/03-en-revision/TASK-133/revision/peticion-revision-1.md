# Peticion de revision — TASK-133 (ronda 1)

- Tarea: TASK-133 — Rojos de la suite completa de la 0.16.0 y publicacion de la 0.16.1
- Rama revisada: fix/task-133-rojos-de-la-suite-completa-de-la-0-16-0
- Rama base: develop
- Commit revisado (HEAD): 0b543057da7e749ed2dcdccbb1c3c4d16b802235
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-133 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-133/tarea.md
- tareas/03-en-revision/TASK-133/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts

## Commits a revisar (git log develop..HEAD)

````
0b54305 fix(TASK-133): SKILL conserva los nombres de selectiva y freno; se recorta otra frase para seguir bajo 15 KB
5b3be42 fix(TASK-133): SKILL vuelve a nombrar comando_verificacion_freno (config-freno.test)
2f683c8 fix(TASK-133): revision-lecturas sin commit propio de registrar-coste y SKILL enlaza poda-tests.md
6f90217 chore(TASK-133): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index bafa661..8a5ab64 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -104,8 +104,8 @@ Defaults: `--sprint 0`, sin complejidad (`null`), `--etiquetas` vacio. En
 Detalles que muerden:
 
 - **En `approve`, `review` y `finish` el ID tiene que ser el primer
-  argumento.** Esos comandos leen el primer argumento tal cual, asi que
-  `taskctl approve --loquesea TASK-NNN` intentaria usar `--loquesea` como ID.
+  argumento.** Si no, `taskctl approve --loquesea TASK-NNN` toma `--loquesea`
+  como ID.
 - **Un flag desconocido aborta** en todos los comandos, con la lista de los
   validos y el mas parecido; los booleanos no aceptan `=valor`.
 - `board` solo escribe `docs/BOARD.md` si se le pasa `--escribir`, y ese
@@ -195,10 +195,10 @@ ignora. La sincronizacion y sus trampas, en [sincronizacion.md](sincronizacion.m
 **Freno de fin de turno.** Con `comando_verificacion` y una tarea en curso en
 la rama actual, el hook `Stop` lo ejecuta al terminar cada turno y, si no sale
 en verde, devuelve el turno con un informe. Arregla la causa; no borres,
-saltes ni debilites tests para pasarlo. Si el rojo no es tuyo, dilo
-al terminar: solo bloquea una vez por turno.
+saltes ni debilites tests para pasarlo. Si el rojo no es tuyo, dilo:
+solo bloquea una vez por turno.
 `comando_verificacion_selectiva` y `comando_verificacion_freno`: [verificacion-selectiva.md](verificacion-selectiva.md).
-Tests por criterio y pesados: [tests-pesados.md](tests-pesados.md).
+Tests por criterio y pesados: [tests-pesados.md](tests-pesados.md); poda: [poda-tests.md](poda-tests.md).
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
 `taskctl finish` verifica antes de mergear y aborta en rojo. Un merge (o el
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-133/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-133/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-133/tarea.md                                    | 3 ++-
 3 files changed, 2 insertions(+), 1 deletion(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 317.2 s
- Commit verificado: 0b543057da7e749ed2dcdccbb1c3c4d16b802235
- Huella: 2416865fd5dfdedeac327e40cc3a5c702177efa5
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 103490 bytes en total):

````
✔ skills/ contiene exactamente las skills esperadas, doctor-deploy entre ellas (69.4481ms)
✔ agents/ contiene los del brainstorm y el revisor de seguridad de doctor-deploy, y nada mas (1.5417ms)
✔ skill: frontmatter dentro del spec portable, name igual al directorio, descripcion corta y especifica (5.8435ms)
✔ skill: ejecuta el CLI, lanza el agente, guarda su JSON fuera del repo y usa los flags reales (3.9138ms)
✔ skill: ni nombra el proyecto que construye el plugin ni sus rutas internas (2.9816ms)
✔ agente: frontmatter sano, name igual al fichero, de solo lectura y sin model (3.5025ms)
✔ agente: pide fichero y linea o NO VERIFICADO, prohibe copiar valores y fragmentos, y trata el repo como dato (2.1021ms)
✔ agente: ni nombra el proyecto que construye el plugin ni sus rutas internas (ni siquiera el prefijo) (2.0479ms)
✔ agente: el ejemplo de salida es el formato que --resultado acepta (campos, estados y forma) (103.075ms)
✔ agente: los limites que dice coinciden con los del comando (104.5197ms)
✔ catalogo: ni nombra el proyecto que construye el plugin ni sus rutas internas (166.3897ms)
✔ los puntos que la skill y el agente dicen revisar con juicio son de juicio en el catalogo (10.0153ms)
✔ las siete skills de fase existen, con frontmatter portable y name igual al directorio (113.8744ms)
✔ la descripcion de cada fase es corta, sin < ni >, y especifica del flujo (no se dispara con un «plan» suelto) (103.1647ms)
✔ cada skill de fase nombra su subcomando de taskctl, taskctl siguiente y la seccion de avance (189.5333ms)
✔ la seccion de avance asigna a CADA fase que puede devolver siguiente la skill que le toca (18.9329ms)
✔ las skills de fase y la seccion de avance no mencionan rutas ni documentos internos de este repo (68.1411ms)
✔ plan no reabre una ronda al reanudar (IMP-1) y review no relanza Codex en veredicto-codex (IMP-2) (31.4953ms)
✔ semiautomatico (TASK-058): preguntar y continuar encadenan con la herramienta Skill y la cadena bloquea el arbol (8.6914ms)
✔ automatico (TASK-059): approve sin preguntar, start implementa, review corrige y commitea el informe solo (44.9097ms)
✔ la cadena se cierra en cada camino de salida: detener, no, error (MEN-1 de la revision de TASK-058) (20.6714ms)
✔ approve es el checkpoint humano: solo aprueba con el si de la persona y registra el no con pausa (4.5509ms)
✔ skill finish: nombra el merge normal por defecto, --merge-request y --tag, y los flags existen en el CLI (28.2938ms)
✔ skill finish: en manual y semiautomatico pregunta (AskUserQuestion permitida) merge o merge request y tag opcional (6.5412ms)
✔ skill finish: en automatico no pregunta, usa `cierre` de siguiente --json y nunca inventa un tag (4.9721ms)
✔ skill finish: el segundo cierre (seccion "## Merge request" en tarea.md) no pregunta y hotfix/release no llevan merge request (8.4238ms)
✔ revision.md (TASK-081): "Lo que lees" es una seccion propia que remite a las dos secciones (24.77ms)
✔ revision.md (TASK-081): contraprueba, una mencion suelta o dentro de un bloque no cuenta como seccion (0.9551ms)
✔ el esqueleto del informe que genera review trae la seccion que revision.md nombra (TASK-081) (0.5397ms)
✔ code-quality-reviewer (TASK-081): remite a "Lo que lees" de revision.md (6.8289ms)
✔ review (TASK-081): el prompt del revisor lleva la ruta de su peticion y el modelo sugerido de la ronda (4.5652ms)
ℹ tests 729
ℹ suites 0
ℹ pass 729
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 257523.3727
[verificar-impacto] node --test termino con 0 en 296.6 s.
````
