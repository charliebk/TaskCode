# Plan — TASK-121: Troceo de tareas de mas de 60 min como pregunta: subtareas TASK-NNNa, b, c en la misma rama

(Modo rapido, decision de Carlos del 2026-11-12: el plan lo redacta el
coordinador, sin brainstorm de roles ni unificador.)

## De donde se parte (casos reales)

- TaskCode: TASK-096 se partio en TASK-100..TASK-109, diez tareas con rama,
  diseno, revision y cierre propios (unas 25 h, unos 230 M tokens). Los IDs
  nuevos no dicen de quien son hijos y el ROADMAP los mezcla con el resto.
- ToolsaWeb (83 tareas que citan una particion, tandas sueltas como
  TASK-307..TASK-320 aun planificadas) y OpenDockTrading (16): el mismo
  patron, numeros dispersos y una rama por trozo.
- Lo que ya hay en el codigo: `siguiente` pregunta en cualquier modo cuando
  el plan pasa de 60 min (TASK-097) y `approve --decidido-por automatico` lo
  rechaza; pero la unica salida «trocear» es crear tareas nuevas a mano. El
  script de Git-Flow (`invoke_create_work_branch`) ya cambia a la rama si
  existe, asi que compartir rama no necesita tocar Bash.

## Enfoque propuesto

Duracion estimada: 150 min (de la rama abierta al cierre con merge; senales: ficheros de codigo previstos, capas, criterios)

1. **IDs con letra en todo el CLI.** El patron pasa a `TASK-\d{3,}[a-z]?`
   en todos los sitios que validan o listan IDs: `core/task.ts`
   (`isValidTaskId`), `fs/task-store.ts`, `fs/wip-scan.ts`, `fs/roadmap.ts`,
   `core/board-format.ts` (orden: numero y luego letra, `TASK-121b` justo
   tras `TASK-121a` y antes de `TASK-122`), `core/metricas.ts` (commits
   `chore(TASK-121a)`), `core/heldout.ts` (la carpeta held-out de una parte
   tambien se protege) y `core/task-id.ts` (`nextTaskId` cuenta el numero
   de un ID con letra: con `TASK-121a` el siguiente es `TASK-122`). La rama
   no cambia de patron: todas las partes usan la de la tarea.
2. **Modulo puro `core/troceo.ts`.** Lee del plan-final.md una seccion
   `## Troceo` con un bloque por parte:
   `### Parte a: titulo` / `### Parte b: titulo`..., cada uno con su
   objetivo (lineas de texto), sus criterios (`- [ ] ...`) y, opcional, su
   `Duracion estimada: N min`. Valida: al menos dos partes, letras
   consecutivas desde `a`, cada parte con objetivo y al menos un criterio.
   Devuelve las partes o un error que dice que falta. Solo trocea un ID sin
   letra (no hay `TASK-121ab`).
3. **Comando `taskctl trocear TASK-NNN`** (`commands/trocear.ts`). Es la
   salida «trocear» de la pregunta y solo lo ejecuta una persona (no tiene
   modo automatico ni lo encadena ninguna skill). Exige la tarea en
   `en-diseno`, plan redactado y sin aprobar, y estar en la rama base
   (`ensureBaseBranchReady`, como plan/approve). Hace, en un solo commit
   `chore(TASK-NNN): troceo en TASK-NNNa..TASK-NNNx` en la rama base:
   - mueve la carpeta `01-en-diseno/TASK-NNN` a `01-en-diseno/TASK-NNNa`
     (con su planificacion), cambia `id`, pone el objetivo y los criterios
     de la parte a (el objetivo original queda citado debajo) y, si la
     parte a trae duracion, reescribe la linea del plan con ella;
   - crea `00-planificadas/TASK-NNNb`, `c`... con el objetivo y los
     criterios de su parte, la MISMA `rama`, tipo, sprint y etiquetas, y
     `dependencias: [parte anterior]`;
   - anota en el plan `Troceo aceptado por una persona el AAAA-MM-DD` y
     regenera `tareas/ROADMAP.md` (autoCommit con `roadmap: true`).
   Si algo falla antes del commit no deja nada a medias: primero valida y
   calcula todo, luego escribe.
4. **`siguiente` nombra las dos salidas.** Con mas de 60 min el paso sigue
   siendo `accion: preguntar` en cualquier modo y anade `salidas`:
   `trocear` (`taskctl trocear TASK-NNN`, solo si el ID no tiene letra) y
   `aprobar-entera` (`taskctl approve TASK-NNN`, con el motivo escrito en el
   plan). En texto y en `--json`.
5. **Rama compartida.** `start` de TASK-NNNa crea la rama; `start` de
   TASK-NNNb usa la misma (el script cambia a ella si existe). Integracion:
   cada parte se cierra con su `finish` (merge `--no-ff` a develop) y la
   siguiente sigue en la misma rama: tras el merge la rama es antepasada de
   develop, asi que el limite de WIP no la cuenta como abierta.
6. **Skills y ayuda.** La skill de approve (y task-workflow donde habla de
   la regla de una hora) explican las dos salidas y que trocear lo decide
   una persona; la ayuda del CLI lista `trocear`.

## Desacuerdos entre roles, y como se resuelven

No hubo roles (modo rapido).

## Riesgos aceptados y que los contiene

- La rama de la parte b no trae lo que entro en develop tras cerrar la
  parte a (otras tareas): se acepta; si hace falta, `update-feature.sh`.
- Los commits de diseno anteriores al troceo quedan como `chore(TASK-NNN)`
  y metricas los atribuye al ID sin letra: se acepta.
- Que una skill en automatico llame a `trocear`: el comando no se encadena
  desde `siguiente` (la accion es preguntar) y la skill dice que es de una
  persona.

## Plan de pruebas

- Unitarios (sin Git): `core/troceo.ts` (partes validas, letras saltadas,
  parte sin criterios, una sola parte, ID con letra), `task-id`
  (`TASK-121a` cuenta 121), `isValidTaskId`, orden del board, heldout con
  carpeta con letra, `siguienteFase` con las dos salidas y regresion sin
  troceo.
- Integracion con repo temporal: `trocear` mueve, crea b y c en
  00-planificadas con la misma rama y regenera el ROADMAP antes de start;
  `start` de a crea la rama, `finish` de a, `start` de b reutiliza la rama;
  `new` tras el troceo da el numero siguiente; approve sin trocear deja la
  tarea entera (regresion).
- `RAMA_BASE=develop node scripts/verificar-impacto.mjs`.

## Lo que necesita decision de una persona

- Este propio plan estima 150 min: trocearlo o aprobarlo entero. Propuesta:
  aprobarlo entero, porque la herramienta para trocear es justo lo que esta
  tarea construye y cada parte por separado no se puede probar de punta a
  punta.

Decision (2026-11-12): Carlos aprueba la tarea entera, sin trocear, por el
motivo de arriba.
