---
name: task-workflow
description: Flujo de tareas por sprints con revision por pares y Git-Flow determinista (taskctl). Se usa si el proyecto tiene tareas/ con 00-planificadas .. 04-terminadas, o se pide crear, planificar, aprobar, empezar, revisar por pares o cerrar una tarea, o se menciona taskctl, una TASK-NNN o el tablero.
---

# Flujo de trabajo de tareas (taskctl)

Metodologia de trabajo por tareas: cada una vive en su carpeta, se mueve por
estados con un CLI determinista, abre su propia rama de Git y **no se cierra
sin que otro agente la haya revisado**.

## Cuando aplica

Cuando el repo tiene una carpeta `tareas/` con `00-planificadas/`,
`01-en-diseno/`, `02-en-curso/`, `03-en-revision/` y `04-terminadas/`, y el
comando `taskctl` esta disponible. Si no existe esa estructura, esta skill no
aplica.

Comprobar el estado real antes de nada: `taskctl board`.

**Prerrequisitos**: `taskctl` en el PATH (lo aporta este plugin;
`taskctl --version` imprime su version) y una rama `develop` en el repo. Si
`taskctl` no responde o no hay `develop`, lee [prerrequisitos.md](prerrequisitos.md)
antes de seguir: dice en que orden comprobarlo y que no dar por hecho.

## El ciclo de vida

Cada estado corresponde a una carpeta. El comando mueve la carpeta entera de
la tarea, con sus subcarpetas.

| Estado | Carpeta | Comando que lleva ahi |
|---|---|---|
| `planificada` | `00-planificadas/` | `new` / `import` |
| `en-diseno` | `01-en-diseno/` | `plan` (y `approve`, que no mueve) |
| `en-curso` | `02-en-curso/` | `start` |
| `en-revision` | `03-en-revision/` | `review` |
| `terminada` | `04-terminadas/` | `finish` |

Precondiciones de cada transicion:

- **`plan`** — desde `planificada`, o desde `en-diseno` con
  `plan_aprobado: false` (re-planificacion). Deja el scaffold vacio de
  `planificacion/plan-final.md` — **el contenido lo escribe un agente**, no el
  CLI — y, en `planificacion/brainstorm/`, una peticion por cada rol de
  brainstorm que resuelva la complejidad de la tarea, mas la del agente
  unificador (con 1 solo rol no hay unificador: ver "El brainstorm de la fase
  de diseno"). **No invoca a ningun modelo**: lanzar a esos agentes es trabajo de quien orquesta. Aborta sin
  mover la tarea si el enunciado no esta listo (ver mas abajo).
- **`approve`** — desde `en-diseno`, y tiene que existir un `plan-final.md`
  redactado: la plantilla sin rellenar se rechaza.
  Es el **checkpoint humano**: lo ejecuta la persona, no el agente.
- **`start`** — desde `en-diseno` con `plan_aprobado: true`. No hay atajo por
  complejidad: **el checkpoint humano es obligatorio para todas las
  complejidades**, tambien `trivial` y `simple`. Crea la rama y aplica el
  limite de trabajo en curso.
- **`review`** — desde `en-curso`. Trae la rama base a la de trabajo y genera
  `revision/peticion-revision-N.md` con el diff real, mas el scaffold del
  informe. **No invoca a ningun agente**: lanzar al revisor es trabajo de
  quien orquesta.
- **`finish`** — desde `en-revision`, y solo si el ultimo informe de revision
  aprueba (ver la linea del veredicto en [revision.md](revision.md)).
  Mergea, mueve la tarea y regenera los artefactos del repo.

La carpeta de cada tarea es `tarea.md` + `planificacion/` + `revision/`. Las
dos subcarpetas se crean bajo demanda, cuando hay algo que escribir dentro.

## Los comandos

```
taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release>
            [--sprint N] [--etiquetas a,b,c]
            [--complejidad trivial|simple|media|alta|critica]
            [--modelo-sugerido X] [--agente-revisor Y]
            [--objetivo "<texto>"] [--criterio "<texto>"]... | [--desde <fichero>]

taskctl import <fichero.md> [--tipo ...] [--sprint N] [--complejidad ...]   # `> texto` bajo el ### = Objetivo
taskctl board [--sprint N] [--asignado-a <persona>]
taskctl board --escribir          # no se combina con los filtros de arriba
taskctl plan    TASK-NNN [--asignado-a <persona>]
taskctl approve TASK-NNN [--decidido-por persona|automatico]
taskctl start   TASK-NNN [--asignado-a <persona>]
taskctl review  TASK-NNN
taskctl codex-review TASK-NNN
taskctl veredicto TASK-NNN <valor> [--informe <nombre>]
taskctl finish  TASK-NNN

taskctl siguiente TASK-NNN [--json]   # que fase toca y si preguntar; solo lee
taskctl pausa     TASK-NNN            # registra un «no seguir todavia», sin cambiar el estado
taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar
                  # con una cadena abierta, los comandos que escriben exigen --cadena <testigo>

taskctl diagnose | pause [--push] | resume [<rama>] | recover [<rama>] | abort-merge
```

Defaults: `--sprint 0`, sin complejidad (`null`), `--etiquetas` vacio. En
`import`, `--tipo` es opcional (`feature`); en `new` es **obligatorio**.

Detalles que muerden:

- **En `approve`, `review` y `finish` el ID tiene que ser el primer
  argumento.** Esos comandos leen el primer argumento tal cual, asi que
  `taskctl approve --loquesea TASK-NNN` intentaria usar `--loquesea` como ID.
- **Los flags desconocidos se ignoran en silencio** en el resto de comandos:
  comprobar la salida, no suponer.
- `board` solo escribe `docs/BOARD.md` si se le pasa `--escribir`, y ese
  flag **no se combina** con `--sprint` ni `--asignado-a`: el fichero es la
  foto completa, no una vista filtrada.
- `asignado_a` lo rellenan **solo `plan` y `start`**, con `git config
  user.email`, y solo si la tarea no tenia a nadie: recien creada con `new`
  queda sin asignar. Ejecutar un comando sobre la tarea de otra persona **no**
  se la queda.

### Lo que NO existe

No inventar estos comandos: `status`, `list`, `show`, `reject`, `reopen`,
`assign`, `delete`, `edit`, `init`, `commit`, `push`.

`taskctl codex-review TASK-NNN` **si existe**: pide una segunda opinion al CLI
de Codex y escribe `informe-codex-N.md`, que es lo que `finish` exige cuando la
tarea tiene `revision_codex: true`. Sin el CLI de Codex instalado, dejar
`revision_codex` en `false`.

## Las fases como skills y los modos de flujo

Cada fase tiene su skill (`/taskcode-plugin:new`, `board`, `plan`, `approve`,
`start`, `review`, `finish`, con el ID) para lanzarla o reanudarla en cualquier
sesion. Ejecuta su `taskctl`, hace el trabajo de agentes de la fase y termina con
`taskctl siguiente TASK-NNN --json`. Que hacer con esa salida segun el modo
(`modo_flujo` en `.taskcode/config.yml`: manual, semiautomatico o automatico,
congelado en la tarea al hacer `plan`) esta en [avance.md](avance.md).

## Reglas que no se negocian

**1. Evidencia, no suposicion.** Si no lo has ejecutado, no lo afirmes: ni que
los tests pasan, ni que el comando funciona, ni que el cambio no afecta a
nada. Un `exit 0` tampoco prueba que algo ocurriera — hay que comprobar el
hecho. Los scripts de Git-Flow pueden cancelarse y salir 0.

**2. Revision por pares antes de cerrar, siempre, por un agente distinto.**
Sin esto los fallos que se cuelan son los caros: perdida de datos silenciosa,
un parser que aprobaba literalmente "no aprobada", un comando que bloqueaba
todas las tareas del repo. Los tres son casos reales.

**3. El orden de los comandos no es opcional.** Cada uno comprueba el estado
del frontmatter contra la carpeta real y aborta si no cuadran. No mover
carpetas ni editar `estado:` a mano para saltarse un paso: si el comando
corta, falta algo de verdad.

**4. Todos los hallazgos se documentan, tambien los que se decide no
corregir.** CRITICO e IMPORTANTE se corrigen siempre. MENOR se corrige si sale
barato; si no, se documenta con el motivo. Sin esa nota, el siguiente lector
concluye que hay un bug donde hay una decision.

**5. Un test que no falla si el comportamiento cambia no es un test.**
Comprobarlo por mutacion: romper a proposito la linea que el test dice cubrir
y verificar que se pone rojo. Si sigue verde, la red de regresion no existe.

**6. Tests contra recursos reales, no mocks.** Repos Git temporales de verdad.
Lo que rompe son los detalles del sistema real, y un mock los reproduce por
definicion como tu crees que son.

**7. Cuando la implementacion contradice al diseno, se documenta la
divergencia; no se reescribe el diseno en silencio.** Cambiarlo es una
decision de la persona responsable, explicita.

**8. Diffs minimos y reutilizar lo que ya existe.** Acotados a lo que motiva
la tarea. Antes de escribir un helper, buscar el que ya esta: duplicar la
comprobacion es como acaban existiendo dos comportamientos para el mismo
hecho.

**9. Los mensajes de error se dirigen a la persona y dicen que hacer.** Un
error que no propone el siguiente paso deja al lector adivinando. Y un mensaje
que ha dejado de ser cierto es peor que no tenerlo.

## Configuracion (`.taskcode/config.yml`)

Claves opcionales: `rama_base`, `agente_revisor_por_defecto`, `limite_wip`,
`modo_flujo`, `excluir_de_revision` y las tres de sincronizacion de ficheros
derivados tras cada transicion. Sin fichero, todo por defecto; una clave mal
escrita aborta todos los comandos. La sincronizacion (y sus trampas: no usar un
hook de pre-commit, codigo de salida 3) esta en [sincronizacion.md](sincronizacion.md).

## Cerrar una tarea

Antes de lanzar `finish`, y otra vez justo despues, lee [cierre.md](cierre.md):
lo que tiene que estar hecho al cerrar (suite, smoke test, criterios marcados,
`## Resultado`, registro de progreso) y como declarar y verificar los criterios
que solo se comprueban despues del merge (`### Tras el cierre`).

## El brainstorm de la fase de diseno

`plan` no redacta el plan: deja preparado el material para que lo redacten
otros. La frontera es la misma que en `review` — el CLI hace lo determinista y
escribe lo que alguien tiene que disparar despues.

**Lo que resuelve el CLI, sin llamar a nadie.** Cuantos roles entran, por una
tabla por complejidad que trae el plugin, y cuales, por un orden de prioridad
fijo: **arquitectura, riesgos, testing, dominio**. Con un solo rol entra
arquitectura, que es el unico que propone una forma para el cambio; el primero
que se cae es dominio. Pueden salir **cero roles**: no hay brainstorm y el plan
se redacta a partir del enunciado.

Sin complejidad declarada (`null`) decide la tabla, que calcula leyendo la
tarea; declarada, se toma el **mayor** de las dos. Si difieren, el comando lo
dice: no es un error, es la eleccion conservadora.

**Lo que deja escrito**, en `planificacion/brainstorm/` (con 1 rol, solo `peticion-plan-<ronda>.md`):

| Fichero | Que es |
|---|---|
| `peticion-brainstorm-<rol>-<ronda>.md` | lo que se le pide a ese rol, con su contexto acotado |
| `salida-brainstorm-<rol>-<ronda>.md` | scaffold vacio donde va la respuesta de ese rol |
| `peticion-unificador-<ronda>.md` | lo que consolida esas salidas en `plan-final.md` |

**Lo que hace quien orquesta**: lanzar un agente por cada peticion de rol, en
paralelo; volcar cada respuesta en su `salida-...`; y solo entonces lanzar al
unificador, que es quien escribe `plan-final.md`. Los desacuerdos entre roles
se senalan en el plan, no se promedian: dos roles que dicen lo contrario son
informacion, y la media la tira. **Con 1 solo rol no hay unificador ni
`salida-...`**: se lanza ese agente con `peticion-plan-<ronda>.md` y su
respuesta, que es el plan, se vuelca en `plan-final.md`.

**`plan` valida el enunciado antes de mover nada** (con o sin roles). Bloquea:
`## Objetivo` vacio, ningun criterio, un criterio vacio, **mas de 12
criterios** (si estan agrupados por frente, deja fuera del repo una particion
lista para `import`) o un criterio hecho solo de palabras vagas («que sea
robusto»). Avisa con 9 a 12 criterios y con criterios sin nada comprobable
(comando, ruta, numero, codigo o test). Al abortar estas en la rama base:
edita `tarea.md`, commitea y reintenta. `finish` avisa antes del merge de los criterios sin marcar.

**Una re-planificacion no relanza el brainstorm.** La segunda vuelta
(`en-diseno` con `plan_aprobado: false`) escribe solo otra
`peticion-unificador-<ronda>.md` (con 1 rol, `peticion-plan-<ronda>.md`), que
reprocesa las salidas de la ronda anterior mas el feedback. Es una correccion
incremental: tratarla como un reinicio gasta de nuevo todos los agentes.

## La revision por pares

Antes de lanzar o de hacer una revision, y antes de escribir el veredicto, lee
[revision.md](revision.md): quien revisa y como (reproducir, no leer el diff),
la puerta determinista, la clasificacion CRITICO / IMPORTANTE / MENOR, las
rondas, la plantilla del informe y la linea del veredicto que `finish` acepta,
con su tabla. Es el mismo fichero que siguen las skills revisoras.

## Trampas que cuestan tiempo

Cuando un comando de `taskctl` o un script de Git-Flow falle de forma rara (se
cuelga, sale 0 sin hacer nada, se queja del workspace o de la rama), y antes de
trabajar en un clon nuevo o en Windows, lee [trampas.md](trampas.md).
