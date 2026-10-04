# Plan — TASK-057: Flujo C, fases como skills invocables en modo manual

(Sin brainstorm propio: la heuristica dio "trivial" por lo corto del
enunciado; el diseno es el del plan de referencia de TASK-055, con la
verificacion de la documentacion oficial: skills invocables en lugar de
`commands/`. Lo redacta quien orquesta.)

## Enfoque propuesto

Siete skills nuevas en `skills/<fase>/SKILL.md`: `new`, `board`, `plan`,
`approve`, `start`, `review` y `finish`. Se invocan como
`/taskcode-plugin:<fase> TASK-NNN` (el argumento llega en `$ARGUMENTS`). Cada
una es un guion corto: no decide nada que pueda decidir el CLI.

1. **Frontmatter** solo con claves del spec portable (`name`, `description`,
   `allowed-tools`), igual que la skill de flujo: `name` = nombre del
   directorio; `description` corta (< 300 caracteres) y especifica, para que
   el modelo no las dispare con cualquier «plan» o «review» suelto: nombran
   el flujo de tareas con taskctl y el ID TASK-NNN.
2. **Cuerpo comun** de cada fase: situarse en la raiz del repo (`cd "$(git
   rev-parse --show-toplevel)"`, por el `EPERM` de Windows con el cwd dentro
   de la carpeta de la tarea); ejecutar su subcomando de `taskctl`; hacer el
   trabajo de agentes de la fase; y terminar con `taskctl siguiente TASK-NNN
   --json` y lo que diga la seccion compartida de avance.
3. **Trabajo de agentes por fase** (lo que hoy hace a mano quien orquesta):
   - `plan`: `taskctl plan`; lanzar en paralelo un agente por cada
     `peticion-brainstorm-<rol>-N.md` (el agente que nombra cada peticion),
     volcar cada respuesta en su `salida-...`, y despues el unificador, que
     escribe `plan-final.md`; con 1 rol, `peticion-plan-N.md` y su respuesta
     es el plan; con 0, redactar el plan desde el enunciado. Las preguntas a
     la persona se hacen aqui. Conserva `skills_recomendados`: los nombra
     para la implementacion.
   - `approve`: muestra el plan-final a la persona y ejecuta `taskctl
     approve` solo si ella lo aprueba (checkpoint humano).
   - `start`: `taskctl start`; despues, en manual, termina diciendo que toca
     implementar el plan (con los skills recomendados) y, con todo
     commiteado y la suite en verde, `/taskcode-plugin:review`.
   - `review`: `taskctl review`; un agente revisor independiente por cada
     `peticion-revision-N*.md` (enrutado por dominio que ya hace el CLI, con
     la skill revisora que nombra cada peticion), volcar cada informe y
     escribir su veredicto con `taskctl veredicto` (con `--informe` si la
     ronda esta fragmentada); si `revision_codex` es true, `taskctl
     codex-review`.
   - `finish`: `taskctl finish`.
   - `new` y `board`: envuelven `taskctl new` (pide titulo, tipo, objetivo y
     criterios si faltan) y `taskctl board`.
4. **Seccion compartida de avance** en `skills/task-workflow/avance.md`
   (referencia que cargan las siete; la logica de modos no se copia siete
   veces). Mapea la `fase` de `siguiente` a la skill (`veredicto`,
   `codex-review` y `veredicto-codex` → `review`) y la `accion`: `detener` →
   terminar nombrando la skill siguiente, sin encadenar nada. `preguntar` y
   `continuar` los completan D y E; hasta entonces se tratan como `detener`
   (fallo seguro: nunca se encadena de mas).
5. **`task-workflow/SKILL.md`**: seccion corta con los tres modos, las siete
   skills de fase y `taskctl siguiente` / `pausa`, y los comandos nuevos en
   su lista de comandos.

## Lo que el rol no cubrio

No hubo rol propio; riesgos y testing estan en el plan de referencia. Lo
especifico de C: que las descripciones no disparen las skills fuera de
contexto, y que el texto de las skills no mencione rutas ni documentos
internos de este repo.

## Riesgos aceptados y que los contiene

- El markdown de las skills solo se prueba por su forma: un test ata cada
  skill a su subcomando de `taskctl`, a `taskctl siguiente` y a la seccion de
  avance; el resto, smoke manual en una sesion de Claude Code.
- `preguntar`/`continuar` tratados como `detener` hasta D/E: el flujo nunca
  avanza solo de mas mientras tanto.

## Plan de pruebas

- `test/skills/fases.test.ts`: las siete existen con `name` = directorio,
  frontmatter dentro del spec portable, `description` < 300 caracteres y
  especifica (menciona TASK-NNN o taskctl), cuerpo < 200 lineas, cada una
  nombra `taskctl <su subcomando>`, `taskctl siguiente` y el fichero de
  avance; el fichero de avance mapea todas las fases de `FaseSiguiente`
  (importado del codigo, para que una fase nueva sin mapear ponga el test
  rojo) a una skill que existe; marcas prohibidas propias (rutas de maquina,
  nombres de este repo y de sus documentos internos; `taskctl` y `tareas/`
  si estan permitidos, son la interfaz del plugin).
- El test existente de la skill de flujo sigue en verde con la seccion nueva.
- Smoke en una sesion real de Claude Code sobre un repo temporal: invocar
  `/taskcode-plugin:board` y `/taskcode-plugin:plan` (si la sesion no carga
  el plugin desde esta rama, se documenta como pendiente para el smoke de la
  release).

## Lo que necesita decision de una persona

Nada nuevo: prefijo `/taskcode-plugin:` y fases como skills, decididos en el
plan de referencia. Aprobado por el orquestador bajo la autorizacion de
Carlos de encadenar las entregas A→E.
