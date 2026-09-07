---
name: task-workflow
description: Metodologia de tareas por sprints con revision por pares y Git-Flow determinista. Se usa cuando el proyecto tiene una carpeta "tareas/" con subcarpetas 00-planificadas .. 04-terminadas, o cuando se pide "crear una tarea", "planificar una tarea", "aprobar un plan", "empezar una tarea", "revisar por pares", "cerrar una tarea", o se menciona taskctl, una tarea TASK-NNN, el tablero de tareas o el flujo de Git-Flow del proyecto.
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

**Prerrequisito**: el repo necesita una rama `develop`. Los comandos la
esperan por nombre para las tareas de tipo `feature`, `fix` y `release`; las
de tipo `hotfix` van contra la principal (`main` o `master`, lo que exista).
Sin `develop`, el primer comando que escriba en `tareas/` ya falla.

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
  `plan_aprobado: false` (re-planificacion). Deja un scaffold vacio en
  `planificacion/plan-final.md`; **el contenido lo escribe el agente**, no el
  CLI.
- **`approve`** — desde `en-diseno`, y tiene que existir el `plan-final.md`.
  Es el **checkpoint humano**: lo ejecuta la persona, no el agente.
- **`start`** — desde `en-diseno` con `plan_aprobado: true`, salvo que la
  complejidad sea `trivial` o `simple`. Crea la rama y aplica el limite de
  trabajo en curso.
- **`review`** — desde `en-curso`. Trae la rama base a la de trabajo y genera
  `revision/peticion-revision-N.md` con el diff real, mas el scaffold del
  informe. **No invoca a ningun agente**: lanzar al revisor es trabajo de
  quien orquesta.
- **`finish`** — desde `en-revision`, y solo si el ultimo informe de revision
  aprueba (ver "La linea del veredicto"). Mergea, mueve la tarea y regenera
  los artefactos del repo.

La carpeta de cada tarea es `tarea.md` + `planificacion/` + `revision/`. Las
dos subcarpetas se crean bajo demanda, cuando hay algo que escribir dentro.

## Los comandos

```
taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release>
            [--sprint N] [--etiquetas a,b,c]
            [--complejidad trivial|simple|media|alta|critica]
            [--modelo-sugerido X] [--agente-revisor Y]

taskctl import <fichero.md> [--tipo ...] [--sprint N] [--complejidad ...]
taskctl board [--sprint N] [--asignado-a <persona>]
taskctl board --escribir          # no se combina con los filtros de arriba
taskctl plan    TASK-NNN [--asignado-a <persona>]
taskctl approve TASK-NNN
taskctl start   TASK-NNN [--asignado-a <persona>]
taskctl review  TASK-NNN
taskctl finish  TASK-NNN

taskctl diagnose | pause [--push] | resume [<rama>] | recover [<rama>] | abort-merge
```

Defaults: `--sprint 0`, `--complejidad media`, `--etiquetas` vacio. En
`import`, `--tipo` es opcional (`feature`); en `new` es **obligatorio**.

Detalles que muerden:

- **En `approve`, `review` y `finish` el ID tiene que ser el primer
  argumento.** Esos comandos leen el primer argumento tal cual, asi que
  `taskctl approve --loquesea TASK-001` intentaria usar `--loquesea` como ID.
- **Los flags desconocidos se ignoran en silencio** en el resto de comandos.
  Un flag mal escrito no da error: simplemente no hace nada. Comprobar la
  salida, no suponer.
- `board` solo escribe `docs/BOARD.md` si se le pasa `--escribir`, y ese
  flag **no se combina** con `--sprint` ni `--asignado-a`: el fichero es la
  foto completa, no una vista filtrada.
- `asignado_a` lo rellenan **solo `plan` y `start`**, con `git config
  user.email`, y solo si la tarea no tenia a nadie: recien creada con `new`
  queda sin asignar. Ejecutar un comando sobre la tarea de otra persona **no**
  se la queda.

### Lo que NO existe

No inventar estos comandos: **`codex-review`**, `status`, `list`, `show`,
`reject`, `reopen`, `assign`, `delete`, `edit`, `init`, `commit`, `push`.

`codex-review` merece un aviso aparte: aparece en la documentacion de la
metodologia y `finish` sabe leer un `informe-codex-N.md`, pero **el comando no
existe y ningun comando genera ese informe**. Poner `revision_codex: true` en
una tarea la deja **imposible de cerrar**: `finish` exigira para siempre un
informe que nadie escribe. Dejarlo en `false` salvo que se vaya a redactar a
mano.

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

## La revision por pares

**Quien.** Un agente que no implemento la tarea. La independencia es el punto,
no un formalismo.

**Como.** No es leer el diff y opinar. Es clonar el repo a un directorio
temporal, compilar, correr la suite uno mismo, y **construir el caso que rompe
el codigo antes de reportarlo**. Lo que mas hallazgos ha dado:

- **Mutacion**: romper a proposito cada proteccion y ver si algun test se
  entera. Asi se descubre que un flag defensivo se habia quedado sin cobertura.
- **Ejercitar el CLI real**, no solo la API interna.
- **Comprobar los tests que cambiaron de expectativa**: que sigan aseverando
  lo mismo y no escondan una regresion.
- **Reconstruir el build**: un clon no hereda binarios compilados, y cada rama
  compila algo distinto.

**Clasificacion.** CRITICO: perdida de datos, corrupcion de estado, o el
comando hace lo contrario de lo que dice. IMPORTANTE: comportamiento
incorrecto en un caso real, no de borde. MENOR: todo lo demas.

Un "sin hallazgos" explicito es una respuesta valida. Inventar hallazgos para
tener algo que reportar, no.

**Rondas.** Se numeran: `peticion-revision-N.md` e `informe-revision-N.md` en
`revision/`. Dos rondas es normal, no una excepcion: la ronda 2 revisa las
correcciones de la ronda 1, que es justo donde se cuelan los fallos nuevos.

### La linea del veredicto

`finish` decide si la tarea puede cerrarse leyendo el informe de mayor N, y lo
hace **fail-closed** a proposito: una version anterior buscaba la palabra
"aprobada" en cualquier parte y aprobaba literalmente "no aprobada".

Escribir exactamente esto, sustituyendo la linea de la plantilla — **no anadir
otra debajo**, porque *todas* las lineas de veredicto tienen que aprobar:

```
- Veredicto: aprobada
```

Lo que falla, y por que:

| Linea | Resultado |
|---|---|
| `- Veredicto: aprobada` | pasa |
| `- Veredicto: aprobada con correcciones` | pasa (empieza por `aprobada`) |
| `- Veredicto: **APROBADO**` | falla: los asteriscos rompen el inicio |
| `- Veredicto: APROBADO CON CAMBIOS` | falla: `aprobado` no es `aprobada` |
| `- Veredicto: cambios-solicitados` | falla, y es lo correcto si pides cambios |
| `- Veredicto: PENDIENTE (...)` | falla: la plantilla sin sustituir |
| `Veredicto: aprobada` (sin el guion) | falla: no cuenta como linea de veredicto |

El matiz del veredicto va en el **cuerpo** del informe, no en esa linea. Un
revisor que escriba su veredicto en su propio vocabulario bloquea el cierre y
obliga a un commit de normalizacion.

## Trampas que cuestan tiempo

**Los scripts de Git-Flow se invocan como `bash script.sh`, nunca por ruta
directa.** El bit de ejecucion no viaja por Git en todas las configuraciones.
En Windows hay una segunda capa: `bash` desde PowerShell puede resolver al de
WSL y reventar; hace falta el `bash` de Git con su directorio de utilidades en
el PATH, o se queda sin las herramientas que los scripts usan.

**Los scripts escriben un registro de cada ejecucion**, dentro de `.git/`
(`.git/taskcode/gitflow/gitflow-FECHA.log`), que es donde hay que buscarlo
cuando algo falla. Va ahi y no en el arbol de trabajo a proposito: durante
mucho tiempo lo escribian dentro del repo, nada mas arrancar y antes de mirar
si el workspace estaba limpio, asi que **se ensuciaban el workspace ellos
mismos** y el comando de reanudar quedaba inservible en cualquier repo que no
ignorara esa ruta. No hace falta anadir nada al `.gitignore`.

**La herramienta no commitea lo que genera.** Consecuencia directa: `import`
no se puede ejecutar dos veces seguidas sin commitear en medio, porque lo que
genero la primera vez deja el workspace sucio y el guard aborta la segunda. Y
los ficheros que se le pasen a `import` tienen que vivir **fuera** del repo:
dentro, ensucian el workspace y abortan el propio import.

**Los comandos que escriben en `tareas/` exigen estar en la rama base.** Son
`new`, `import`, `plan` y `approve`. Si el workspace esta limpio **cambian de
rama solos y lo dicen despues**; si esta sucio, abortan. `start`, `review` y
`finish` solo exigen workspace limpio. Los ficheros sin trackear cuentan como
sucio.

**Sin terminal, stdin se ignora.** Los comandos que envuelven scripts
interactivos heredan stdin solo si hay TTY. Sin el, el script recibe EOF y
toma su valor por defecto — que a veces es "no hacer nada" y salir 0. Heredar
siempre no es la alternativa segura: una tuberia abierta que nadie cierra
cuelga el comando **para siempre**, y eso lo produce cualquier arnes de agente
y tambien el runner de tests.

**Un clon nuevo no hereda nada.** Ni dependencias, ni binarios compilados, ni
identidad de Git. Instalar y compilar siempre, **y otra vez tras cada cambio
de rama dentro del mismo clon**. Sin `user.email` y `user.name` configurados,
cualquier commit falla.

**Un fix de errno validado en una sola plataforma no esta validado.** Codigos
distintos describen el mismo hecho segun el sistema operativo. Lo caro no es
el bug: es que el test escrito para cerrarlo hereda el mismo punto ciego, pasa
en local y cae en el CI de la otra plataforma.

## Al cerrar una tarea

1. Suite en verde **antes** de commitear.
2. Smoke test manual de punta a punta si la tarea toca el CLI o Git. Ha
   encontrado fallos **antes** que la revision mas de una vez, porque ejercita
   el flujo real en vez del orden mas comodo.
3. Criterios de aceptacion marcados en `tarea.md`, y seccion `## Resultado`
   con que se implemento, que encontro la revision, que se corrigio y que se
   dejo sin corregir. Es el unico sitio donde queda la experiencia: el diff no
   la cuenta.
4. Actualizar el registro de progreso que use el proyecto.
5. `taskctl finish`.

Commits: mensajes en el idioma del proyecto, una rama por tarea, merge sin
fast-forward. Si el repo tiene activada la politica de conservar ramas, no se
borran tras el merge.
