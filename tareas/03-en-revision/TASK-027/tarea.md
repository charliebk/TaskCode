---
id: TASK-027
titulo: "Subcarpetas planificacion y revision en cada carpeta de tarea"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-027-subcarpetas-planificacion-y-revision-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-06
actualizado: 2026-09-06
dependencias: []
---
## Objetivo

Item C3 del checklist de terminacion. La seccion 2 de la metodologia dice
que cada carpeta de tarea es `tarea.md` + `planificacion/` + `revision/`.
Hoy `revision/` la crea `taskctl review`, pero `planificacion/` no existe:
`taskctl plan` deja `plan-final.md` suelto en la raiz de la carpeta.

Cerrar ese hueco moviendo `plan-final.md` a `planificacion/`, sin romper
las tareas que ya lo tienen suelto, y decidir explicitamente que se hace
con las tareas ya cerradas en `04-terminadas/`.

## Criterios de aceptacion
- [x] `taskctl plan` crea `planificacion/` en la carpeta de la tarea y
      escribe ahi el scaffold de `plan-final.md`.
- [x] `taskctl approve` acepta el plan en la ubicacion nueva y **sigue
      aceptando** el legado suelto en la raiz: una tarea planificada con la
      version anterior del CLI no se queda sin poder aprobarse.
- [x] Una re-planificacion sobre una tarea con el `plan-final.md` legado en
      la raiz lo **migra** a `planificacion/` conservando su contenido (no
      lo pisa con el scaffold) y lo dice en la salida.
- [x] Si existieran los dos a la vez (legado + nuevo), `plan` aborta sin
      tocar nada en vez de elegir por su cuenta cual gana.
- [x] Las dos subcarpetas viajan con la carpeta de la tarea en cada cambio
      de estado (`moveTareaFile` renombra el directorio entero) —
      verificado con un test, no supuesto.
- [x] Decision explicita y documentada sobre las 6 tareas ya cerradas en
      `04-terminadas/` con el fichero suelto.
- [x] Tests reales nuevos (repos Git temporales) y suite verde.
- [x] Smoke test manual en un clon.
- [x] Revision por pares con agente independiente, hallazgos aplicados.

## Resultado

Cerrada el 2026-09-06. La carpeta de tarea tiene ya la forma que describe la
seccion 2 de la metodologia: `tarea.md` + `planificacion/` + `revision/`.
`taskctl plan` crea `planificacion/` y escribe ahi el `plan-final.md`;
`revision/` la creaba `review` desde B1.

**El nudo no era la ruta nueva, era el legado.** Toda tarea planificada con
la version anterior del CLI tiene su `plan-final.md` suelto en la raiz de la
carpeta, y mirar solo la ruta nueva habria dejado a `approve` diciendo "no
hay plan que aprobar" sobre una tarea que si lo tiene. Asi que `approve`
acepta las dos ubicaciones, y una re-planificacion **migra** el fichero
legado con `rename` — mueve, no copia: no quedan dos copias divergentes — en
vez de pisarlo con el scaffold. Si aparecen los dos a la vez, `plan` y
`approve` **fallan cerrado** sin tocar nada: ese estado sale de dos merges
`--no-ff` sin conflicto, y elegir por cuenta propia cual gana puede tirar el
plan que alguien redacto.

Piezas: `PLANIFICACION_DIRNAME` y `resolverPlanFinal` en `plan.ts`,
`isEnotdir` en `task-store.ts` junto a `isEnoent`/`isEexist`, y el consumo de
la ubicacion en `approve.ts`. El orden escribir-antes-de-mover se respeta,
igual que en `review` con `revision/` (TASK-013): si una escritura falla, la
tarea sigue en su estado y reintentar es posible.

**Decision sobre las 6 tareas ya cerradas en `04-terminadas/`**: se migran.
TASK-013, 014, 015, 024, 025 y 026 pasaron a `planificacion/` con `git mv`
— rename puro, 0 lineas cambiadas en el `--stat` del commit. El motivo es
que el criterio de "una carpeta de tarea bien formada" tiene que valer para
todas, o `board` y cualquier lector futuro necesitarian conocer dos formatos
para siempre. Se dejo el codigo aceptando igualmente el legado, que es lo
que protege a las tareas que vengan de un checkout viejo. Hoy **no queda
ningun `plan-final.md` suelto en el repo**.

**Divergencia deliberada con la seccion 2**: las subcarpetas se crean **bajo
demanda**, cuando hay algo que escribir dentro, no en `new`/`import`. Git no
versiona directorios vacios, asi que crearlos antes no llegaria al repo sin
un `.gitkeep` que nadie ha pedido.

**12 tests nuevos (429 en total, 426 verdes).** Los 3 rojos son los conocidos
de este entorno Windows y por los motivos conocidos: EPERM al crear el
symlink, `chmod` que no quita escritura a directorios, y CRLF. Verificado que
son los mismos que fallan en `develop`. En 1 de cada 3 pasadas aparece un
cuarto rojo intermitente, `EBUSY: resource busy or locked, rmdir` — es el
**teardown** del repo temporal, no una asercion: el test comprueba lo que
tiene que comprobar y falla al borrar la carpeta. Es la intermitencia bajo
carga que ya documento TASK-026, no algo que traiga este item.

### Revision por pares: dos rondas

**Ronda 1 — APROBADO CON CAMBIOS.** 0 criticos, 1 importante, 4 menores.

1. **IMPORTANTE — el `flag: 'wx'` se habia quedado sin un solo test que lo
   cubriera.** La primera version metia un `else if (!canonicaExiste)` delante
   del `writeFile`, con lo que el fichero nunca existia al escribir y el
   `'wx'` pasaba a ser inalcanzable. El revisor lo demostro corriendo el mismo
   mutante (`'wx'` -> `'w'`) en las dos ramas: en `develop` rompia dos tests,
   en la rama nueva ninguno. Se habia perdido la red de regresion sobre un
   camino de perdida de datos. Corregido quitando esa condicion: el `'wx'`
   decide y protege, y hay una rama menos de codigo.
2. Menores corregidos: `approve` aprobaba a ciegas el estado ambiguo que
   `plan` considera irresoluble (#2); `planificacion` ocupado por un fichero
   daba un EEXIST crudo presentado como "taskctl no pudo arrancar" (#3); un
   DIRECTORIO llamado `plan-final.md` contaba como plan y se anunciaba como
   "movido intacto" (#4b); comentario obsoleto en el test de regresion de
   TASK-012 (#5).
3. **No corregido, documentado (#4a)**: el `rename` de la migracion no tiene
   un equivalente exclusivo del `'wx'` — POSIX no ofrece un rename que falle
   si el destino existe. La ventana exige que alguien cree el fichero destino
   entre el `resolverPlanFinal` y el `rename`.

**Ronda 2 — cambios solicitados, y tras corregir, APROBADA.** 0 criticos,
1 importante, 3 menores. El revisor consiguio ademas correr el codigo en
**Linux de verdad** (Node dentro de la distro WSL de Docker) y confirmar
que el job `ubuntu-latest` estaba roto en el commit anterior.

1. **IMPORTANTE — el fix del hallazgo #3 de la ronda 1 era un fix solo de
   Windows.** Se envolvio el `mkdir` de `plan`, pero en POSIX el fallo ocurre
   antes: `stat("planificacion/plan-final.md")` devuelve **ENOTDIR** cuando
   `planificacion` es un fichero, y `existeFichero` solo absorbia ENOENT. En
   Linux morian con un error crudo `plan` y tambien `approve`, que ni siquiera
   hace `mkdir` — y **el propio test escrito en la ronda 1 para certificar ese
   fix habria fallado en el job `ubuntu-latest` del CI**, contra el criterio de
   "suite verde". Es el caso de libro de un fix validado solo en la plataforma
   donde se escribio. Corregido con `isEnotdir`, tratando ENOTDIR como
   ausencia.
2. **MENOR — `approve` se quejaba de la ambiguedad antes de validar la
   transicion**, asi que una tarea en un estado no aprobable con dos planes
   recibia el error equivocado y un consejo que no desbloquea nada. El estado
   manda primero.
3. **MENOR — un DIRECTORIO en la ubicacion canonica dejaba un bucle sin
   salida**: `writeFile` con `'wx'` devuelve EEXIST tambien sobre directorios,
   el `catch` se lo tragaba como re-planificacion, y `plan` salia 0 diciendo
   "ya existia — se dejo intacto" sin haber plan mientras `approve` remitia a
   `plan`. Lo encontraron por separado la ronda 2 y el smoke test manual.
   Corregido re-stateando dentro del `catch`: fichero regular = la carrera que
   el `'wx'` protege y se deja intacta; cualquier otra cosa = ruta ocupada,
   con mensaje accionable.
4. **MENOR (segunda pasada) — `assertPlanNoAmbiguo` en la lectura fresca no
   tenia test**: quitarla de ahi no rompia nada, porque los dos tests de
   ambiguedad arrancan ya en `develop` y cortan en la lectura preliminar. Y
   la fresca es justo la que cubre el caso realista, porque la ambiguedad
   nace de dos merges en `develop` y quien ejecuta `approve` puede estar en
   su rama de feature, donde no se ve. Corregido con un test que construye
   esa situacion; el mutante que quita el guard de la fresca ahora cae.

### Lo que este item deja aprendido

**Un fix de errno validado en una sola plataforma no esta validado.** ENOENT
y ENOTDIR describen el mismo hecho para la pregunta "existe este fichero?", y
el reparto entre uno y otro cambia con el sistema operativo. El sintoma en
Windows era benigno justo donde Linux reventaba, y el test que se escribio
para cerrar el hueco heredo el mismo punto ciego. Anotado en
`docs/contexto/HALLAZGOS.md`.
