# Plan — TASK-027: Subcarpetas planificacion y revision en cada carpeta de tarea

## Enfoque propuesto

La seccion 2 de la metodologia describe la carpeta de tarea como
`tarea.md` + `planificacion/` + `revision/`. `revision/` ya la crea
`taskctl review` (TASK-013); falta la otra mitad.

**1. Constante compartida.** `PLANIFICACION_DIRNAME = 'planificacion'`
exportada desde `commands/plan.ts`, al lado de `PLAN_FINAL_FILENAME` y
siguiendo el mismo patron que `REVISION_DIRNAME` (vive en `review.ts`,
la importa `finish.ts`). No se crea un modulo nuevo por una constante.

**2. Las subcarpetas se crean bajo demanda, no en `new`/`import`.**
Git no versiona directorios vacios: crearlos al dar de alta la tarea no
llegaria al repo sin un `.gitkeep` que nadie ha pedido, y ensuciaria el
workspace de quien solo queria listar tareas. `plan` crea
`planificacion/` cuando escribe el plan, igual que `review` crea
`revision/` cuando escribe la peticion. Divergencia literal con la
seccion 2 ("cada carpeta de tarea"), deliberada y documentada.

**3. Compatibilidad con el legado, que es el nudo real.** Toda tarea
planificada antes de este cambio tiene `plan-final.md` suelto en la raiz
de su carpeta. Si el codigo nuevo mirase solo la ruta nueva:

- `approve` diria "todavia no hay plan que aprobar" sobre una tarea que
  SI lo tiene — la maquina de estados la dejaria bloqueada.
- una re-planificacion crearia un scaffold vacio en `planificacion/`
  mientras el plan real, redactado, sigue suelto al lado. Dos planes,
  y el bueno es el que el CLI ya no mira.

Se resuelve con una unica funcion `resolverPlanFinal(taskDir)` que
devuelve las dos rutas y cual existe. Con eso:

- `approve` acepta cualquiera de las dos (primero la nueva).
- `plan` **migra** el legado a `planificacion/` con un `rename` y lo
  dice en la salida. Es el unico comando que ya esta autorizado a
  reorganizar la carpeta de una tarea (mueve el directorio entero entre
  carpetas de estado), asi que no introduce una potestad nueva.
- si existen **los dos a la vez**, `plan` aborta sin tocar nada y
  explica cual borrar. Fail-closed: elegir por su cuenta cual gana
  puede tirar el plan que la persona redacto.

**4. Las subcarpetas viajan solas con los cambios de estado.**
`moveTareaFile` hace `rename` del directorio completo, no de
`tarea.md`, precisamente por esto. No hay que tocarlo — pero si probarlo
con un test, que hasta ahora solo lo cubria `revision/`.

**5. Tareas ya cerradas en `04-terminadas/`.** Ver "Riesgos".

## Alternativas consideradas

- **No migrar el legado, solo leer las dos ubicaciones.** Mas simple,
  pero deja las dos convenciones conviviendo para siempre: cualquier
  lector futuro (y el `contexto.md` de la 6.1, y los comandos de la fase
  D) tendria que buscar en dos sitios sin una fecha de fin.
- **Migrar desde `approve` en vez de desde `plan`.** `approve` es un
  checkpoint que hoy no mueve ficheros; darle esa potestad seria una
  ampliacion mayor que hacerlo en `plan`, que ya mueve la carpeta.
- **Crear las dos subcarpetas en `new`/`import` con `.gitkeep`.** Cumple
  la seccion 2 al pie de la letra a cambio de meter ficheros vacios en
  el repo de cada usuario. Descartada: el proposito de la seccion 2 es
  ordenar los artefactos, no que existan carpetas vacias.

(Version minima de "taskctl plan", TASK-010: sin brainstorm multi-agente
todavia. Un solo agente redacta este plan. TASK-016 anadira brainstorm
en paralelo con roles distintos y un agente unificador para tareas de
complejidad media o mayor.)

## Riesgos o preguntas abiertas

- **Las 6 tareas cerradas en `04-terminadas/`** (TASK-013, 014, 015,
  024, 025, 026) tienen el `plan-final.md` suelto. **Decision: se
  migran**, con `git mv`, en el mismo commit que el codigo. Motivos: son
  seis, el historial se conserva, y ningun documento generado las
  referencia por esa ruta (comprobado: `docs/INDEX.md` y
  `docs/CHANGELOG.md` apuntan a la carpeta de la tarea, no al fichero).
  La alternativa —aplicar la convencion solo a las nuevas— dejaria el
  repo que sirve de ejemplo del metodo contradiciendo el metodo.
  Lo unico que queda con la ruta vieja escrita es el diff embebido en
  `TASK-013/revision/peticion-revision-1.md`, que es un registro
  historico de lo que paso y no se toca.
- La propia TASK-027 es su primer caso de prueba: se planifico con el
  CLI viejo, asi que su `plan-final.md` nace suelto. La migracion se
  verifica sobre ella, en el repo real, ademas de en los tests.
- `plan` migrando ficheros hace que un `plan` de re-planificacion deje
  el workspace con un rename sin commitear. No es nuevo (ya lo deja con
  el movimiento de carpeta de estado), pero suma evidencia al item C2
  (paso 5 de la 8.3, auto-commit).
