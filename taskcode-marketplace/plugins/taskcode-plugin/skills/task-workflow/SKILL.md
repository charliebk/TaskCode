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

**Prerrequisito 1 — `taskctl` disponible**: lo aporta este mismo plugin. Su
ejecutable vive en `bin/`, que Claude Code anade al PATH del Bash tool
mientras el plugin este habilitado, y no hay que compilar ni instalar nada
aparte. Comprobarlo con `taskctl --version`, que debe imprimir un numero de
version. Si no responde, en este orden:

1. Reinicia la sesion de Claude Code. El PATH se compone al arrancar, asi que
   un plugin instalado a mitad de sesion no aparece hasta la siguiente.
2. Si sigue sin responder, mira **primero** si la variable tiene valor:
   `echo "$CLAUDE_PLUGIN_ROOT"`.
   - Si imprime una ruta, invocalo por ahi:
     `node "$CLAUDE_PLUGIN_ROOT/bin/taskctl" --version`. Todos los comandos de
     esta skill funcionan igual por esa via.
   - **Si sale vacia, este paso no aplica y no dice nada** sobre si el plugin
     esta activo: esa variable no esta exportada en todos los entornos, y
     usarla vacia construye una ruta que no existe (`/bin/taskctl`) y falla
     por un motivo que no tiene nada que ver.
3. Solo si el paso 2 llego a ejecutarse con una ruta que **contiene de verdad
   `bin/taskctl`** y aun asi no respondio, el plugin no esta activo y ningun
   paso de esta skill va a funcionar. Si la ruta apuntaba a otro sitio, el
   fallo no dice nada: vuelve al paso 1.

No des por hecho el paso 3 al primer `command not found`: el caso normal es
el 1.

**Prerrequisito 2**: el repo necesita una rama `develop`. Los comandos la
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
  `plan_aprobado: false` (re-planificacion). Deja el scaffold vacio de
  `planificacion/plan-final.md` — **el contenido lo escribe un agente**, no el
  CLI — y, en `planificacion/brainstorm/`, una peticion por cada rol de
  brainstorm que resuelva la complejidad de la tarea, mas la del agente
  unificador (ver "El brainstorm de la fase de diseno"). **No invoca a ningun
  modelo**: lanzar a esos agentes es trabajo de quien orquesta. Aborta sin
  mover la tarea si el `## Objetivo` de `tarea.md` esta vacio y la tarea lanza
  algun rol.
- **`approve`** — desde `en-diseno`, y tiene que existir el `plan-final.md`.
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

## Configuracion de sincronizacion (`.taskcode/config.yml`)

Los artefactos derivados del estado de las tareas (un plan generado, un
tablero sintetizado) se pueden regenerar automaticamente despues de cada
transicion de tarea. Para eso, el proyecto declara en `.taskcode/config.yml`
un comando que reescribe esos ficheros y la lista de rutas que modifica.

**Tres claves opcionales, en `.taskcode/config.yml`:**

- **`comando_sincronizacion`**: el comando que el proyecto ejecuta para
  regenerar sus ficheros derivados. Ejemplo: `"node scripts/sincronizar-plan.mjs"`.
- **`rutas_sincronizacion`**: lista de ficheros que ese comando reescribe,
  en sintaxis flow (entre corchetes): `[docs/PLAN.md, docs/BOARD.md]`. Rutas
  relativas a la raiz del repo, siempre ficheros, nunca carpetas ni la raiz
  del repo. No pueden estar bajo `tareas/` ni bajo `.taskcode/`.
- **`timeout_sincronizacion`**: numero de segundos (entero ≥ 1) para esperar
  al comando. Opcional; por defecto, 60 segundos. Solo es valida si estan las
  otras dos claves.

**Reglas de declaracion:**

- Las dos primeras claves van juntas o no van: si una existe, la otra debe
  existir tambien. La tercera es opcional.
- Una clave mal escrita o un valor invalido aborta **todos** los comandos de
  `taskctl` que lean config, con un error que enumera las claves validas.
- Sin estas claves, el comportamiento es identico al actual: no se ejecuta nada
  en la sincronizacion.

**Como funciona:**

Los ocho comandos que hacen un commit automatico (`new`, `import`, `plan`,
`approve`, `start`, `review`, `finish`, `codex-review`) siguen este flujo:

1. Escriben sus cambios en `tareas/`.
2. **Ejecutan el comando de sincronizacion** (si esta declarado).
3. Incluyen las rutas sincronizadas en el mismo commit (`git commit -m <msg> -- <rutas de tarea> <rutas sincronizadas>`).
4. Terminan la transicion.

Sin esperar a commits manuales posteriores: los ficheros derivados entran en el
mismo commit que la tarea, asi que `git show HEAD` muestra siempre el derivado
sincronizado con el estado de la tarea.

**Ejecucion del comando:**

- Se lanza con el shell del sistema (`cmd.exe` en Windows, `/bin/sh` en
  POSIX), desde la raiz del repo, sin stdin (`'ignore'`).
- Forma portable recomendada: `node <script>` en lugar de, por ejemplo,
  `VAR=1 comando` o comillas simples. Los scripts con estos patrones no
  funcionan igual en todos los shells.
- Si el comando contiene ` #`, entrecomillarlo entero en `config.yml`: sin
  comillas, el propio fichero de configuracion toma lo que sigue como
  comentario y el comando llega truncado.

**Cuando el comando falla o toca ficheros no declarados:**

La transicion de la tarea **nunca se aborta** por la sincronizacion. Hay tres
casos en que no se aplica:

1. **Una ruta declarada ya tenia cambios sin commitear** antes del comando:
   se salta la ejecucion para no meter trabajo ajeno en el commit. La tarea se
   commitea igual.
2. **El comando falla** (`exit ≠ 0`) **o supera el timeout**: las rutas
   declaradas se dejan como en `HEAD` (sin aplicar sus cambios). La tarea se
   commitea igual.
3. **El comando modifico ficheros no declarados** en `rutas_sincronizacion`:
   esos ficheros no se commitean ni se tocan, y se nombran en el aviso. Las
   rutas declaradas si entran en el commit.

En los tres casos, `taskctl` avisa por stderr y sale con **codigo 3** (no 1):
la transicion se hizo, pero la sincronizacion no. Un 1 sigue significando que
el comando de `taskctl` fallo. El aviso
dice explicitamente que la transicion **ya se hizo**, que no se reintente el
comando de `taskctl`, y qué hacer a continuacion (regenerar a mano, limpiar el
workspace, o actualizar el config).

**Tres trampas:**

- **No usar un hook de pre-commit en su lugar.** Los commits automaticos son
  de rutas concretas; en ese modo, el `git add` de un hook entra en el commit
  pero el indice real se queda con el contenido viejo (`MM` en `git status`), y
  el siguiente comando aborta por workspace sucio. Para eso existen estas
  claves.
- **Conflictos en lineas de recuento.** Si el fichero derivado tiene lineas de
  recuento (por ejemplo, "5 tareas pendientes"), los merges de `review` o
  `finish` pueden chocar en ellas cuando hay mas de una tarea viva. Se resuelve
  regenerando el fichero derivado con el comando a mano, despues haciendo `git
  add <ruta>` y continuando el merge: `git merge --continue`.
- **Seguridad: el comando sale del config de tu repo.** Una rama que cambie
  `.taskcode/config.yml` decide que comando se ejecuta en tu maquina cuando
  alguien hace `finish` o `review`. Revisa los cambios a `config.yml` en la
  revision por pares como si fueran codigo de confianza: potencialmente lo es.

**Compatibilidad con versiones anteriores del plugin:**

Un plugin anterior a 0.1.1 no conoce estas claves y aborta todos sus comandos
al leerlas. **Todo el equipo actualiza el plugin ANTES de anadirlas.**

## Criterios verificables tras el cierre (post-finish)

Algunos criterios de aceptacion solo se pueden demostrar despues de que
`taskctl finish` fusione la rama en la rama base: un CI que pase en verde tras
el merge, una publicacion en produccion desde esa rama, o una ejecucion en vivo
que dependa del merge realizado. Esos criterios **no se pueden marcar antes de
cerrar la tarea**.

**Como declararlos en `tarea.md`:**

Dentro de la seccion `## Criterios de aceptacion`, añade una subseccion
`### Tras el cierre` para los que solo se verifican despues de `finish`:

```markdown
## Criterios de aceptacion

(Criterios normales que se verifican antes de finish)
- [ ] El parser acepta ficheros UTF-8 con BOM.
- [ ] La sintaxis de error da consejos especificos.

### Tras el cierre

(Se verifican despues de finish, en la rama base)
- [ ] La rama base pasa el CI a verde.
- [ ] La documentacion se publica automaticamente en main.
```

**Reglas:**

- Los criterios normales **deben estar todos marcados antes de `finish`**.
  `finish` no lee las casillas: lo comprueba quien cierra y el revisor.
- Los de "Tras el cierre" no cuentan para cerrar.
- Despues de cerrar, quien lanzo `finish` verifica esos criterios en la rama
  base mientras se resuelven los detalles de publicacion o despliegue.
- La evidencia de que pasaron se registra en **un commit posterior**, en la
  seccion `## Resultado` de la tarea en su carpeta de terminadas (o en el
  registro de progreso del proyecto si la estructura es distinta).

**Si un criterio post-cierre falla:**

No se reabre la tarea ya cerrada. En su lugar:

1. Documenta el fallo en el `## Resultado` de la tarea cerrada: qué
   criterio fallo, por que, y que evidencia se recopilo.
2. Abre una tarea **nueva de tipo `fix`** (en `00-planificadas/`) que corrija
   el problema. Referencia la tarea original en su descripcion.
3. Sigue el flujo normal: `plan`, `approve`, `start`, revision, `finish`.

## El brainstorm de la fase de diseno

`plan` no redacta el plan: deja preparado el material para que lo redacten
otros. La frontera es la misma que en `review` — el CLI hace lo determinista y
escribe lo que alguien tiene que disparar despues.

**Lo que resuelve el CLI, sin llamar a nadie.** Cuantos roles entran, por una
tabla por complejidad que trae el plugin, y cuales, por un orden de prioridad
fijo: **arquitectura, riesgos, testing, dominio**. Con un solo rol entra
arquitectura, que es el unico que propone una forma para el cambio; el primero
que se cae es dominio. Pueden salir **cero roles**: entonces no hay brainstorm
y el plan se redacta directamente a partir del enunciado.

El numero es el **mayor** entre lo que pide la complejidad declarada en
`tarea.md` y lo que pide la que la tabla calcula leyendo la tarea. Cuando esos
dos niveles difieren, el comando lo dice: no es un error, es la eleccion
conservadora.

**Lo que deja escrito**, en `planificacion/brainstorm/`:

| Fichero | Que es |
|---|---|
| `peticion-brainstorm-<rol>-<ronda>.md` | lo que se le pide a ese rol, con su contexto acotado |
| `salida-brainstorm-<rol>-<ronda>.md` | scaffold vacio donde va la respuesta de ese rol |
| `peticion-unificador-<ronda>.md` | lo que consolida esas salidas en `plan-final.md` |

**Lo que hace quien orquesta**: lanzar un agente por cada peticion de rol, en
paralelo; volcar cada respuesta en su `salida-...`; y solo entonces lanzar al
unificador, que es quien escribe `plan-final.md`. Los desacuerdos entre roles
se senalan en el plan, no se promedian: dos roles que dicen lo contrario son
informacion, y la media la tira.

**El `## Objetivo` de `tarea.md` no puede estar vacio.** Si lo esta y la tarea
lanza al menos un rol, `plan` aborta y la tarea no se mueve. `new` deja esa
seccion en blanco a proposito, asi que hay que redactarla **antes** del primer
`plan`. Sin objetivo cada rol se inventa el suyo, y el unificador consolida
esas invenciones en un plan que parece fundado sin serlo.

**Una re-planificacion no relanza el brainstorm.** La segunda vuelta
(`en-diseno` con `plan_aprobado: false`) escribe solo otra
`peticion-unificador-<ronda>.md`, que reprocesa las salidas de la ronda
anterior mas el feedback. El feedback sobre un plan es una correccion
incremental; tratarlo como un reinicio vuelve a gastar todos los agentes, y no
se nota porque cada vuelta parece barata.

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

**Los scripts escriben un registro de cada ejecucion** dentro del directorio
de Git, en `taskcode/gitflow/gitflow-FECHA.log`. La ruta exacta la da
`git rev-parse --git-path taskcode/gitflow`, y preguntarla es mejor que
componerla: en un repo normal sale bajo `.git/`, pero en un **worktree
enlazado** el directorio de Git es otro y el registro vive ahi. Va fuera del
arbol de trabajo a proposito: durante
mucho tiempo lo escribian dentro del repo, nada mas arrancar y antes de mirar
si el workspace estaba limpio, asi que **se ensuciaban el workspace ellos
mismos** y el comando de reanudar quedaba inservible en cualquier repo que no
ignorara esa ruta. No hace falta anadir nada al `.gitignore`.

**La herramienta commitea solo lo que escribe** (mas las rutas de
sincronizacion, si las hay): nunca un `git add` global. Los ficheros que se le
pasen a `import` tienen que vivir **fuera** del repo: dentro, ensucian el
workspace y abortan el propio import.

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
   la cuenta. (Nota: si existen criterios bajo "Tras el cierre", se verifican
   despues de `finish` — ver "Criterios verificables tras el cierre
   (post-finish)".)
4. Actualizar el registro de progreso que use el proyecto.
5. `taskctl finish`.

Commits: mensajes en el idioma del proyecto, una rama por tarea, merge sin
fast-forward. Si el repo tiene activada la politica de conservar ramas, no se
borran tras el merge.
