# Plan — TASK-092: Sincronización de ficheros sueltos de la raíz de tareas/

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

La regla se cambia en un único sitio: el validador de config. Ni la ejecución de la sincronización ni `autoCommit` ni los comandos necesitan cambios. Las tres salvaguardas y el commit conjunto no saben nada de `tareas/`: trabajan con las rutas declaradas, venga de donde venga.

**Dónde está cada cosa (verificado):**
- Validación de `rutas_sincronizacion`: `src/core/config.ts:806-835` (`validarRutasSincronizacion`). Delega en `motivoRutaInvalida` (`config.ts:838-850`), que normaliza (barra invertida a `/`, `path.posix.normalize`) y rechaza si el **primer segmento** está en `RAICES_PROHIBIDAS_SINCRONIZACION = ['tareas', '.taskcode', '.git']` (`config.ts:280`, comparación en `:845-847`). El texto del error dice "fuera de tareas/, .taskcode/ y .git/" (`config.ts:827-828`). La comprobación con disco de que la ruta no es una carpeta existente está en `resolverConfig`, `config.ts:400-419`.
- `motivoRutaInvalida` **también la usa `informe_cobertura`** (`config.ts:706-717`). Cambiarla sin más ampliaría esa clave en silencio.
- Ejecución en las transiciones: `src/fs/git-commit.ts:208` (`sincronizar(opts)` dentro de `autoCommit`, solo si el comando ha escrito rutas propias). Las rutas sincronizadas se preparan por separado en `:215-227` y se commitean junto con las de la tarea en `:232-267` (`git commit -- <presentes>`). Llaman a `autoCommit` `new.ts:374`, `plan.ts:1036`, `approve.ts:204`, `start.ts:306`, `review.ts:857` y `finish.ts:689`, todos con las carpetas de la tarea como rutas.
- Las salvaguardas están en `src/fs/sincronizacion.ts`:
  - (a) Ruta con cambios previos: `:108-122`. Hace `porcelain` sobre la ruta declarada y sobre su nombre real en disco.
  - (b) Comando que falla o expira: `:138-144`, más el caso de ruta no commiteable en `:152-156`. Restaura con `restaurarAHead` (`:305-327`).
  - (c) Fichero no declarado: `:158-175`. Compara `fotoDelArbol` antes y después (`ejecucion-acotada.ts:204-230`, un `git status` global sin filtros).

**Respuesta a las cuatro comprobaciones:**
1. **Regla: "un solo segmento tras `tareas/`" más una lista de nombres de estado prohibidos.** Se acepta si, ya normalizada, la ruta tiene exactamente 2 segmentos, el primero es `tareas` y el segundo no es el nombre de una carpeta de estado. Para los nombres de estado se reutiliza `STATE_FOLDER` de `src/core/task.ts:47-53` (sin duplicar la lista). `core/task.ts` no importa nada, así que `config → task` no crea ciclo.
   - Se descarta la lista cerrada a secas (aceptar `tareas/<lo que no sea 0N-*>/...`): abriría subcarpetas de `tareas/` que mañana puede ocupar el CLI.
   - El caso "es un directorio" lo cubre ya `resolverConfig` (`:405-419`).
   - Normalización: ya existe y vale. `./tareas/ROADMAP.md`, `tareas\ROADMAP.md` y `tareas/01-en-diseno/../ROADMAP.md` acaban en `tareas/ROADMAP.md` y se aceptan. `docs/../tareas/01-en-diseno/x.md` se normaliza a 3 segmentos y se rechaza. `tareas/` sigue rechazándose por "es una carpeta" (`:841`). `tareas` a secas necesita un motivo nuevo ("es la carpeta tareas/").
   - **Mayúsculas:** hoy la comparación distingue mayúsculas (`:846`); `Tareas/01-en-diseno/x.md` y `.GIT/HEAD` pasan hoy la validación en un disco Windows.
2. **Ningún paso del CLI trata `tareas/` de forma especial que choque con esto:** el guard de workspace limpio es un `git status --porcelain` global (`src/fs/git.ts:66-68`); se commitean solo las carpetas de la tarea más las rutas sincronizadas; `fotoDelArbol` no filtra; los lectores de tareas solo recorren las carpetas de estado (`task-store.ts:29-41`, `finish.ts:162`/`:180`, `finish-heldout.ts:67-70`); `import` y `doctor-deploy` commitean carpetas de tarea (`import.ts:337-339`, `doctor-deploy-tareas.ts:122-124`). Colaterales inocuos: `excluir_de_revision` excluye `tareas/**` por defecto (`config.ts:236`) y `CARPETAS_SIN_CODIGO` (`aviso-release.ts:22`) no lo cuenta como código.
3. **`tareas/` no es configurable** (`cli.ts:425`, `path.join(repoCwd, 'tareas')`). La regla usa el literal `tareas`.
4. **Tests que cambian de expectativa:** solo `test/core/config-sincronizacion.test.ts:62` (`['[tareas/x.md]', /esta bajo tareas\//]`), que es justo la forma que el criterio 1 obliga a aceptar. El caso pasa al test de aceptación y en la lista de rechazos se sustituye por casos más estrictos. Debe quedar escrito en el `Resultado` de la tarea.

**Orden de construcción:**
1. `config.ts`: `motivoRutaInvalida(original, opciones?: { ficheroEnRaizDeTareas?: boolean })`, `false` por defecto (así `informe_cobertura` no cambia); solo `validarRutasSincronizacion` pasa `true`. Comparación del primer segmento y de los nombres de estado en minúsculas (decisión 2). Actualizar el mensaje de `:827-828` y el comentario de `:276-280`.
2. Tests de config (aceptación y rechazos).
3. `test/helpers/sincronizacion-fixtures.ts`: `SCRIPT_SYNC` y `CONFIG_SYNC` con la ruta derivada como parámetro. Fichero nuevo `test/commands/sincronizacion-raiz-tareas.test.ts`, sobre el precedente de `sincronizacion-ciclo.test.ts:54-99`.
4. Documentación: `skills/task-workflow/sincronizacion.md:16` (que además omite `.git/`), nota en el README del plugin (hoy no documenta las claves de sincronización) y `CHANGELOG.md` de la raíz.

## Lo que el rol no cubrio

Solo se ha usado el rol de arquitectura. Contrastado con los criterios:
- **Riesgos y modos de fallo:** anotados, no analizados a fondo.
- **Estrategia de pruebas:** propuesta de arquitecto; nadie con rol de testing ha revisado la cobertura.
- **Reglas de negocio:** nadie de dominio ha validado si `tareas/` debe abrirse a más ficheros sueltos que el ROADMAP (la persona decidió que sí, ocultos incluidos: decisión 3).
- **Criterio 5 (suite en verde):** depende de ejecutar; no se ha ejecutado nada.

## Riesgos aceptados y que los contiene

- **Conflictos de merge en `tareas/ROADMAP.md`** en `review`/`finish` con varias tareas vivas: mismo riesgo que cualquier ruta sincronizada, documentado en `sincronizacion.md:78-82`; lo contiene la receta existente (regenerar, `git add`, `git merge --continue`).
- **Un comando que reescribe ficheros de la propia carpeta de la tarea** acaba en el commit; pasa ya hoy y no depende de este cambio. Lo contiene en parte el aviso de (c).
- **Mayúsculas en disco** (`TAREAS/ROADMAP.md` frente a `tareas/ROADMAP.md`): lo contienen `nombreRealEnDisco` y `motivoNoCommiteable` (`sincronizacion.ts:231-269`), que lo mandan por (b) sin tumbar la transición.
- **Una carpeta de estado nueva en el futuro:** al derivar la lista de `STATE_FOLDER`, entra sola; una subcarpeta no de estado queda cubierta por la regla de los 2 segmentos.

## Plan de pruebas

- **Config** (`config-sincronizacion.test.ts`, repos temporales donde haga falta disco):
  - Se aceptan: `tareas/ROADMAP.md`, `./tareas/ROADMAP.md`, `tareas\ROADMAP.md`, `tareas/01-en-diseno/../ROADMAP.md` (todas normalizadas a `tareas/ROADMAP.md`) y `tareas/.oculto`.
  - Se rechazan: `tareas`, `tareas/`, una ruta por cada carpeta de estado, `tareas/01-en-diseno` (2 segmentos con nombre de estado), `TAREAS/02-En-Curso/x.md`, `tareas/otra/x.md`, `docs/../tareas/02-en-curso/x.md`, `Tareas/01-en-diseno/x.md`, `.GIT/HEAD`, `.TaskCode/config.yml`.
  - Se mantienen `.taskcode/config.yml` y `.git/HEAD`.
  - `informe_cobertura: tareas/x.lcov` sigue rechazándose (no regresión de la frontera compartida).
- **Integración** (fichero nuevo): repo temporal real con un script que reescribe `tareas/ROADMAP.md`; secuencia `new → plan → approve → start → review → finish` sin commits manuales. Tras cada paso: `estado === 'aplicada'`, `tareas/ROADMAP.md` en `git show --name-only HEAD` y `porcelain` vacío. Al final, `HEAD:tareas/ROADMAP.md` coincide con disco.
- **Salvaguardas con la ruta de la raíz de `tareas/`**, un test por caso:
  - (a) `ROADMAP.md` sucio antes de `start`: `omitida-rutas-con-cambios` y contenido de la persona intacto.
  - (b) Script con `exit 1` tras escribir: `fallida`, `ROADMAP.md` como en HEAD y la tarea commiteada.
  - (c) El script escribe además `tareas/OTRO.md`: `rutas-ajenas`, `OTRO.md` sin commitear y nombrado en el aviso, `ROADMAP.md` dentro del commit.
- **Suite completa:** `npm test`, con los 3 rojos conocidos de Windows.

## Lo que necesita decision de una persona

Respondidas por la persona el 2026-11-10:

1. **Cambiar la expectativa de `config-sincronizacion.test.ts:62`** (`tareas/x.md`): **sí**. Pasa a la lista de aceptadas y se sustituye por rechazos más estrictos. No cuenta como debilitar un test: el criterio 1 obliga a aceptar esa forma. Se documenta en el `Resultado`.
2. **Comparar las raíces prohibidas y los nombres de estado sin distinguir mayúsculas:** **sí, en esta tarea**. Cierra el hueco de `Tareas/01-en-diseno/x.md` y `.GIT/HEAD`.
3. **Regla de 2 segmentos + nombres de estado prohibidos**, y **ficheros ocultos en la raíz (`tareas/.x`) aceptados**, sin caso especial.
4. **`informe_cobertura` se queda como está** (sigue rechazando todo bajo `tareas/`), fijado con un test de no regresión.
5. El plan se aprueba con `taskctl approve` antes de implementar.
