---
id: TASK-012
titulo: "Precondicion de rama base + workspace limpio (seccion 8.3), con auto-switch si esta limpio"
tipo: feature
sprint: 1
etiquetas: [cli, taskctl, gitflow, precondicion]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-012-precondicion-de-rama-base-workspace-limp
asignado_a: charlie.bk
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-009, TASK-010, TASK-011]
---
## Objetivo

Implementar la seccion 8.3 de la metodologia para los tres comandos que
ya existen y escriben directamente en la rama activa sin abrir la suya
propia: `taskctl new`, `taskctl plan` y `taskctl approve` (`taskctl
import`, TASK-004, todavia no existe — la funcion que se construya aqui
queda lista para que la reuse cuando llegue, igual que `moveTareaFile` se
reutilizo sin tocar en TASK-010 y TASK-011).

Alcance exacto (los 4 primeros pasos de la seccion 8.3, que es
literalmente lo que dice el titulo de esta tarea en PLAN_SPRINTS.md —
"con auto-switch si esta limpio"):

1. Resolver la rama base esperada segun el `tipo` de la tarea: `develop`
   para feature/fix/release, `main`/`master` para hotfix (mismo algoritmo
   que ya usa `resolve_main_branch` en `_gitflow-common.sh`: preferencia
   por `origin/main`, luego `origin/master`, luego ref local `main`,
   luego ref local `master`, `master` por defecto si nada de eso
   resuelve). Reimplementado en TypeScript (no invocado via Bash) porque
   `resolve_main_branch` es una funcion interna de `_gitflow-common.sh`
   pensada para ser *sourceada* por los scripts `create-*.sh`, no un
   script independiente invocable — mismo motivo por el que TASK-009 ya
   reimplemento `assert_valid_branch_name` en TS (`isValidBranchName`)
   en vez de intentar invocar la funcion Bash sola.
2. Si el workspace tiene cambios sin commitear: aborta sin tocar nada,
   con el mismo mensaje de la metodologia (adaptado): *"Hay cambios sin
   guardar en '<rama>'. Guardalos o comitealos antes de continuar."*
3. Si el workspace esta limpio pero la rama actual no es la base
   esperada: cambia automaticamente a la rama base (creandola desde
   `origin/<base>` si no existe localmente y hay remoto disponible) y
   hace `pull --ff-only` si hay remoto — sin pedir confirmacion, tal
   como especifica el punto 14 de la seccion 14 (decision ya tomada por
   el propio texto de 8.3, no solo propuesta).
4. Solo entonces sigue la logica propia de cada comando (crear la tarea,
   generar el scaffold del plan, marcar `plan_aprobado`).

Fuera de alcance a proposito (no es lo que pide el titulo de la tarea en
PLAN_SPRINTS.md, y cambiaria el comportamiento de todo el flujo de
dogfooding usado hasta ahora en TASK-009/010/011): el paso 5 de la
seccion 8.3 ("al terminar, comitea y sube los archivos que haya
generado"). Hoy nada en `taskctl` hace commit ni push por la persona —
eso lo sigue haciendo la persona (o esta sesion) a mano despues de cada
comando, igual que en todas las tareas anteriores. Automatizarlo es un
cambio de comportamiento mayor, no una precondicion, y coincide con una
decision explicitamente pendiente en la seccion 14 del documento de
metodologia (punto 14). Queda documentado como hallazgo abierto para que
el equipo lo decida, no asumido en silencio.

`taskctl start` no necesita este cambio (ya lo dice la seccion 8.3: crea
su propia rama como parte de su propio trabajo).

## Criterios de aceptacion

- [x] Existe una funcion reutilizable (no duplicada por comando) que
      resuelve la rama base esperada segun el tipo de tarea y aplica los
      pasos 2 y 3 de la seccion 8.3 contra un repo Git real (segundo
      repo temporal actuando de `origin`, no un mock), con tests que
      cubren: ya en la rama base (no hace nada de mas, no pull
      forzado); rama base local existente pero distinta a la activa
      (cambia y hace pull --ff-only porque hay remoto); rama base que
      no existe en local pero si en origin (la crea con tracking); y el
      caso sin remoto disponible (cambia si la rama base ya existe en
      local, sin intentar pull).
      → `ensureBaseBranchReady` en `src/fs/git.ts`, con los 4 casos de
      arriba cubiertos en `test/fs/git.test.ts`, mas un quinto caso que
      surgio de la revision por pares: checkout con exito pero
      `pull --ff-only` que falla por divergencia real (rama local con
      un commit que origin no tiene, y origin con otro commit distinto)
      — el mensaje de error deja claro que la rama SI cambio y no se
      deshizo.
- [x] `taskctl new`, `taskctl plan` y `taskctl approve` aplican la
      precondicion antes de escribir cualquier fichero, y siguen
      funcionando igual que antes cuando ya se esta en la rama base
      correcta.
      → Matiz importante que salio de la revision por pares: en `new`
      la precondicion corre antes de tocar el filesystem para nada en
      absoluto (ni siquiera calcular el ID). En `plan`/`approve`, en
      cambio, SI hace falta una lectura preliminar de `tarea.md` antes
      de la precondicion — para saber `tipo` y poder resolver la rama
      base — pero esa lectura preliminar nunca se usa para escribir ni
      para decidir el resultado final: solo sirve para (a) rechazar
      rapido, sin tocar Git, un caso ya claramente invalido en la rama
      actual, y (b) conocer `tipo` (metadata estable que ningun comando
      reescribe). Tras el posible cambio de rama, `plan`/`approve`
      vuelven a leer `tarea.md` de cero y esa lectura fresca es la
      unica que decide que se escribe. Ver el hallazgo CRITICO de
      revision por pares mas abajo — la primera version de este
      criterio no distinguia esto y tenia un bug real de fondo.
- [x] Workspace sucio: los tres comandos abortan sin tocar nada (ni
      archivos de `tareas/`, ni la rama activa), con un mensaje que dice
      que hay cambios sin guardar y en que rama estan.
      → El mensaje final, tras la revision por pares, ya NO menciona la
      rama base esperada (solo la rama actual): es literalmente el
      ejemplo de texto que trae la seccion 8.3 de la metodologia, y de
      paso deja que la comprobacion de workspace limpio corra ANTES de
      resolver la rama base (que para `hotfix` puede necesitar hasta 3
      peticiones de red a `origin`) — ver hallazgo menor #1 mas abajo.
- [x] Revision por pares de un agente independiente sobre el diff
      completo, sin hallazgos criticos sin resolver.
      → 2 CRITICOS y 1 IMPORTANTE encontrados y corregidos, 3 MENORES
      (1 corregido, 2 documentados sin corregir a proposito). Detalle
      completo en "Resultado" mas abajo.

## Resultado

Implementados los pasos 1 a 4 de la seccion 8.3 para `taskctl new`,
`taskctl plan` y `taskctl approve`: `src/fs/git.ts` gana
`isRemoteAvailable`, `localBranchExists`, `resolveMainBranch`
(reimplementacion en TypeScript de `resolve_main_branch` de
`_gitflow-common.sh`, no invocada via Bash — mismo patron que
`isValidBranchName` ya establecio en TASK-009), `resolveBaseBranchForTipo`
(`develop` para feature/fix/release, `resolveMainBranch` para hotfix) y
`ensureBaseBranchReady` (aborta si el workspace no esta limpio; si esta
limpio pero no en la rama base, cambia automaticamente — creando tracking
local a `origin/<base>` si hace falta — y hace `pull --ff-only` cuando hay
remoto; confirma con evidencia la rama activa real al terminar).

**Revision por pares (agente independiente, general-purpose): 2 CRITICOS,
1 IMPORTANTE, 3 MENORES — el primer resultado real de revision con
hallazgos graves de todo Sprint 1.**

CRITICO 1 (`approve.ts`): la tarea se leia UNA sola vez, antes de que
`ensureBaseBranchReady` pudiera cambiar de rama, y esa misma lectura (ya
desactualizada) se usaba para escribir tras el cambio. Invocar `approve`
desde una rama vieja (limpia, pero bifurcada antes de que la tarea
avanzara de verdad en la rama base) sobrescribia en silencio el contenido
real de la rama base con los datos viejos — perdida de datos real,
confirmada por el revisor de forma empirica contra un repo temporal.

CRITICO 2 (`plan.ts`): mismo origen. Ademas de arriesgar la misma perdida
de datos, cuando el estado SI cambia entre la lectura vieja y la rama
base real, disparaba un `TaskFolderConflictError` totalmente espurio
("la carpeta destino ya existe") para un caso en realidad valido en la
rama base — confirmado tambien de forma empirica por el revisor.

**Correccion aplicada a ambos**: patron de doble lectura. Una lectura
PRELIMINAR (en la rama activa en ese momento, que puede no ser la base
real) sirve solo para (a) rechazar rapido, sin tocar Git, un caso ya
claramente invalido ahi, y (b) conocer `tipo` (metadata estable que
ningun comando de `taskctl` reescribe) y poder resolver la rama base. Tras
`ensureBaseBranchReady`, una lectura FRESCA — ya en la rama base real — es
la UNICA que decide si se muta algo y con que contenido; nunca se usa el
resultado de la lectura preliminar para escribir. Esto conserva el
comportamiento de "no cambiar de rama para un caso ya invalido en la rama
actual" (la lectura preliminar sigue rechazando esos casos sin tocar Git)
sin arriesgar ya la perdida de datos ni el conflicto espurio: si la
lectura fresca despues del cambio de rama muestra un estado distinto
(porque alguien mas avanzo la tarea en la rama base mientras tanto), es
esa lectura fresca la que decide — aceptando una re-planificacion legitima
o rechazando con el estado real, segun corresponda. Cubierto con 4 tests
nuevos que reproducen exactamente los dos escenarios del revisor (uno por
comando) mas el caso "existe en la rama vieja pero no en la base real".

IMPORTANTE (`git.ts`, `ensureBaseBranchReady`): el `checkout` y el
`pull --ff-only` compartian un unico `try`/`catch`. Si el `checkout` tenia
exito (la rama SI cambiaba) pero el `pull` fallaba despues (divergencia
real entre local y origin), el mensaje de error sonaba a "no se pudo
cambiar de rama" cuando en realidad el cambio ya era un hecho consumado y
se quedaba asi, sin deshacerse — quien leyera el mensaje podia creer,
equivocadamente, que seguia en su rama original. Corregido separando
ambos en sus propios `try`/`catch`, con un mensaje que deja explicito que
la rama SI cambio y sigue cambiada. Cubierto con un test que fuerza una
divergencia real (un commit local que origin no tiene y un commit en
origin que el local no tiene) contra un segundo repo temporal actuando de
origin.

MENOR 1 (corregido): la comprobacion de workspace limpio (gratis, sin
red) corria DESPUES de resolver la rama base, que para `hotfix` puede
necesitar hasta 3 peticiones `git ls-remote` a `origin`. Reordenado: el
workspace sucio se detecta antes de gastar esas peticiones, y de paso el
mensaje de error ya no menciona la rama base esperada — coincide
literalmente con el ejemplo de texto de la seccion 8.3 de la metodologia,
que tampoco la menciona.

MENOR 2 (documentado, no corregido): `isRemoteAvailable` se invoca dos
veces por cada `ensureBaseBranchReady` de un `hotfix` (una dentro de
`resolveMainBranch`, otra directamente) — una peticion de red duplicada y
evitable. No se corrigio para no complicar la firma publica de
`resolveMainBranch`/`resolveBaseBranchForTipo` (ya probadas de forma
independiente con 2 argumentos) a cambio de un ahorro pequeno.

MENOR 3 (documentado, no corregido): la comprobacion final de "evidencia,
no suposicion" (confirmar la rama activa real tras el checkout) no tiene
cobertura de test — es deliberadamente casi imposible de forzar con Git
real sin mocks (un `checkout <rama>` que tiene exito siempre deja esa
rama activa). Mismo patron ya aceptado en `start.js` (TASK-009, lineas
16-17 sin cubrir por el mismo motivo).

Hallazgo real DOCUMENTADO, no corregido, fuera de alcance (via
`new.test.ts`): un tipo `hotfix` resuelve la rama base a `main`, que puede
no compartir el historial de `tareas/` con `develop` (sin
`taskctl finish`/backmerge todavia, TASK-014) — riesgo real de colision
de IDs entre ramas. Consecuencia directa de seguir la seccion 8.3 al pie
de la letra, no un bug de esta tarea.

**Verificacion manual real (dogfooding), en un clon aislado del propio
repo TaskCode** (no en la rama de trabajo de esta sesion, para no
interferirla): confirmado con evidencia que `taskctl new` desde una rama
de feature limpia auto-cambia a `develop` con el aviso
`Workspace limpio -> cambiado automaticamente de "..." a "develop".`;
que un workspace sucio aborta sin crear nada; y que `taskctl plan` sobre
una tarea real (TASK-004) funciona de punta a punta con el auto-switch.

165 tests en total (34 nuevos desde TASK-011: 29 de la primera vuelta +
5 mas al corregir los hallazgos de revision por pares), 0 fallos.
Cobertura global del proyecto: 99.03% lineas / 96.20% ramas / 100%
funciones. `approve.js` y `plan.js` llegan a 100/100/100 pese a la logica
nueva de doble lectura; `git.js` sube de ~92%/64% (antes de TASK-012) a
94.86%/86.79%.

**No verificado todavia (bootstrapping):** esta misma tarea, TASK-012,
sigue en `estado: planificada` en su propio frontmatter — no puede pasar
por su propio `taskctl plan`/`approve` porque son precisamente los
comandos que esta tarea esta modificando ahora mismo.

Trabajo commiteado en la rama
`feature/task-012-precondicion-de-rama-base-workspace-limp` y mergeado a
`develop`.
