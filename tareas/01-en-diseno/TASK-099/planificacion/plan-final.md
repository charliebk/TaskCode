# Plan — TASK-099: Correccion de MENORES tras aprobar con correcciones sin abrir otra ronda completa

(Modo rapido, decision de Carlos del 2026-11-12: el plan lo redacta el
coordinador, sin brainstorm de roles ni unificador.)

## Por que se sigue (la medicion que la tarea esperaba)

La tarea decia «no se empieza hasta medir que las rondas por MENORES pesan».
Ya esta medido en `docs/auditoria/PASOS-PLUGIN-2026-11-12.md` (paso 7, P-2):
tras una ronda sin ningun CRITICO ni IMPORTANTE se abrieron **71 rondas**
solo por MENORES (ToolsaWeb 44, OpenDockTrading 9, TaskCode 18), que
encontraron **2** CRITICO/IMPORTANTE nuevos y costaron **70,2 M tokens**.
Pesan: se sigue.

## De donde se parte (leido en el codigo el 2026-11-12)

- `aprobada con correcciones` cuenta como `aprobada` (`veredictoDe`,
  `core/informe-revision.ts`); `review` ya rechaza otra ronda tras ella
  (`state-machine.ts`, accion `review`).
- Si tras ese veredicto se commitea codigo (las correcciones de los MENORES),
  `siguiente` ve codigo posterior al `Commit revisado` (`informeEnCommitPropio`
  en `commands/siguiente.ts`) y devuelve `finish` con `preguntar`: en
  automatico se para y la sesion, para no preguntar, pide
  `cambios-solicitados` y abre otra ronda entera (el caso de OpenDockTrading
  TASK-067).
- `finish` **no** comprueba nada de eso: integra el codigo posterior al
  revisado sin mirar. El criterio 3 cierra ese hueco.
- `finish` ya corre `comando_verificacion` antes del merge: la verificacion
  ligera no repite los tests, comprueba el alcance de las correcciones.

## Enfoque propuesto

Duracion estimada: 110 min (de la rama abierta al cierre con merge; senales: ficheros de codigo previstos 6 (core/menores.ts nuevo, commands/verificar-menores.ts nuevo, cli.ts, state-machine.ts, flujo.ts, siguiente.ts, finish.ts), capas 2 (core puro y comandos), criterios 8)

1. **Comando nuevo `taskctl verificar-menores TASK-NNN [--motivo "<texto>"] [--push]`**
   (la «verificacion ligera»). Logica pura en `core/menores.ts`; lectura de
   Git y escritura en `commands/verificar-menores.ts`. Solo en `en-revision`
   (accion nueva en `state-machine.ts`). Comprueba, fail-closed:
   - la ultima ronda primaria esta aprobada (`aprobada` o `aprobada con
     correcciones`), con informes rellenados y su peticion con `Commit
     revisado`; si no, error que nombra el paso (veredicto, review);
   - **ningun CRITICO ni IMPORTANTE abierto** (ni severidad fuera del
     vocabulario) en los informes de esa ronda. Si lo hay: error «un
     CRITICO/IMPORTANTE abierto exige `taskctl veredicto TASK-NNN
     cambios-solicitados` y otra ronda» (criterio 4);
   - **alcance**: cada fichero cambiado fuera de `tareas/` entre el `Commit
     revisado` y `HEAD` es el `Fichero` de algun MENOR abierto de la ronda
     (se compara la ruta sin `:linea`), o es un test (`test/`, `tests/`,
     `__tests__/`, `.test.`, `.spec.`). Un fichero fuera de eso aborta: no es
     una correccion de MENORES, es codigo que nadie reviso; la salida dice
     las dos vias (otra ronda, o `finish --aceptar-sin-revisar` decidido por
     una persona);
   - no hay cambios sin commitear fuera de `tareas/`.
   Si pasa, escribe y commitea (solo `tareas/`):
   - en `tarea.md`, seccion `## Verificacion ligera` (con
     `anotarLineaEnSeccion`), una entrada: ronda, commit revisado, commit
     verificado (HEAD), ficheros cambiados, MENORES corregidos (los abiertos
     cuyo fichero cambio) y pendientes;
   - `revision/menores-pendientes.md`: tabla `| ID | Fichero | Motivo |` con
     los MENORES abiertos cuyo fichero no cambio (motivo por defecto «no se
     corrigio en la verificacion ligera», o el de `--motivo`). Si no queda
     ninguno, no se crea. Es backlog: ni abre ronda ni bloquea `finish`
     (criterio 5).
   Correr el comando sin cambios de codigo es valido: solo pasa los MENORES
   al backlog.

2. **`finish` no integra codigo posterior al revisado sin verificacion ni
   persona** (criterio 3). Puerta nueva junto a las demas, antes de cualquier
   efecto: si el codigo fuera de `tareas/` difiere entre el `Commit revisado`
   de la ultima ronda primaria y `HEAD`, exige una `## Verificacion ligera`
   cuyo commit verificado tenga el mismo codigo que `HEAD` (diff vacio fuera
   de `tareas/`) **y** cuyo commit revisado sea el de esa ronda. Sin ella
   aborta y nombra `taskctl verificar-menores` y el flag nuevo
   `--aceptar-sin-revisar`, que solo pasa una persona y deja una linea
   auditable en `tarea.md` (`## Codigo integrado sin revisar`, con la fecha y
   el rango de commits). Sin `Commit revisado` en la peticion (tareas
   anteriores a TASK-059) la puerta no aplica: no hay referencia, como hoy.

3. **`siguiente` nunca propone otra ronda por MENORES** (criterio 6). Fase
   nueva `verificar-menores` en `FASES_SIGUIENTE` (skill `review`). Con la
   ronda aprobada y la puerta de Codex superada:
   - CRITICO/IMPORTANTE abierto → `veredicto` (`taskctl veredicto TASK-NNN
     cambios-solicitados`), `preguntar` en cualquier modo: aprobar con un
     bloqueante abierto es contradictorio y lo deshace una persona;
   - codigo posterior al revisado y verificacion ligera al dia → `finish`
     (sigue solo en automatico);
   - codigo posterior sin verificacion, o MENORES abiertos sin verificacion
     → `verificar-menores` (corregir los baratos y registrar); en automatico
     `continuar`, en manual y semiautomatico `detener` con el comando (es
     trabajo, como corregir tras cambios-solicitados);
   - sin MENORES abiertos ni codigo posterior → `finish`, como hoy.
   Los campos nuevos de `ContextoFlujo` son opcionales y su ausencia es el
   comportamiento de hoy (los tests existentes no cambian de expectativa).

4. **Documentacion**: skills `review` y `task-workflow` (que tras `aprobada
   con correcciones` se corrigen los MENORES baratos y se corre
   `verificar-menores`, nunca `cambios-solicitados` por MENORES), README del
   plugin (tabla de comandos) y `docs/` si toca, y `CHANGELOG.md`. Las skills
   no mencionan TaskCode (test existente). Topes de tamano de TASK-124.

## Desacuerdos entre roles, y como se resuelven

No hay roles (modo rapido).

## Riesgos aceptados y que los contiene

- **La comparacion por fichero es gruesa**: una correccion de un MENOR puede
  meter mas cambios en el mismo fichero. Se acepta: el revisor ya leyo ese
  fichero, `finish` corre la verificacion, y el diff queda registrado. Lo que
  no se acepta es tocar ficheros que ningun hallazgo nombra.
- **Heuristica de test por ruta**: un fichero de produccion bajo `test/`
  pasaria. Se acepta; es el mismo criterio que ya usa el proyecto.
- **Cambio de conducta de `finish`**: quien hoy corrige MENORES y cierra a
  mano (este mismo repo) tendra que correr `verificar-menores` o pasar
  `--aceptar-sin-revisar`. Es lo que pide la tarea; se dice en el CHANGELOG.
- El plugin instalado (0.14.0) no conoce el comando hasta publicar.

## Plan de pruebas

- `test/core/menores.test.ts` (puro): bloqueantes abiertos (CRIT, IMP,
  severidad desconocida), alcance (fichero de un MENOR, `fichero:42`, test,
  fichero ajeno), reparto corregidos/pendientes, formato del backlog y de la
  entrada; contrapruebas de cada guarda.
- `test/commands/verificar-menores.test.ts` (repo Git temporal): camino
  feliz con un MENOR corregido y otro pendiente (entrada en `tarea.md`,
  `menores-pendientes.md`, commit solo en `tareas/`); IMP abierto → error y
  nada escrito; fichero ajeno → error; sin codigo posterior → solo backlog;
  ronda en cambios-solicitados → error.
- `finish` (repo temporal): codigo posterior sin verificacion → aborta sin
  efectos; con verificacion al dia → cierra; verificacion vieja (codigo
  nuevo despues) → aborta; `--aceptar-sin-revisar` → cierra y anota;
  backlog de MENORES presente → no bloquea.
- `flujo.test.ts`: cada rama nueva en los tres modos, y el cruce existente
  con `assertTransitionAllowed` cubre la fase nueva; `siguiente` (repo
  temporal): solo MENORES tras aprobada-con-correcciones en automatico →
  `verificar-menores`, nunca `review`.
- `test/skills/fases.test.ts`: la fase nueva tiene skill.
- Verificacion: `RAMA_BASE=develop node scripts/verificar-impacto.mjs` +
  `npm run test:rapido`.

## Lo que necesita decision de una persona

- La regla de una hora: 110 min estimados. Propuesta: **entera**, sin
  trocear. Las piezas (comando, puerta de `finish`, `siguiente`) dependen de
  la misma logica pura y verificarlas por separado obligaria a dejar
  `finish` bloqueando sin la salida que lo desbloquea, o el comando sin la
  puerta que le da sentido.
- El nombre del flag de `finish`: `--aceptar-sin-revisar`.
