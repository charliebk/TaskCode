# Brainstorm — TASK-055, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

(Respuesta volcada por quien orquesta. El agente siguio el formato fijo de su
rol; equivalencias con las secciones de la plantilla: «riesgo que mas
preocupa» es la primera vineta; «vuelta atras» son los puntos sin retorno;
compatibilidad hacia atras esta en el primer descarte y en la vineta de la
decision #1.)

## Riesgos, de mayor a menor dano

- **(El que mas me preocupa.)** En automatico, `finish` mergea sin persona y su unica puerta es una linea de texto — lo dispara que el propio orquestador de la sesion (o un subagente que lanzo con su mismo contexto) escriba o edite `informe-revision-N.md` con `- Veredicto: aprobada` — se mergea a develop, y con hotfix a main, codigo que nadie independiente reviso. `veredictoAprobado` (`src/core/informe-revision.ts:43`) solo parsea lineas y no sabe quien las escribio — contencion: que en automatico taskctl exija que el informe este en un commit propio, posterior al de la implementacion y que no toque codigo, y que quien lanza el revisor quede registrado; si no se cumple, la cadena se para y pregunta.
- Hotfix y release en automatico — lo dispara una tarea `hotfix`/`release` que llega a `finish` encadenada, con `--push` o sin el — merge a main, tag y backmerge (`finish.ts:54-60`) sin que nadie lo vea; con push, el tag ya esta publicado — contencion: la cadena automatica se detiene antes de `finish` en hotfix/release y nunca pasa `--push`.
- Tension con la decision #1 («checkpoint humano siempre», `CHECKLIST_TERMINACION.md:338,590`; `TRIVIAL_SIN_APROBACION` vacio en `state-machine.ts:79`) — la dispara cambiar `modo_flujo` a `automatico` en config con tareas ya planificadas en manual, o que alguien lo edite a mitad de tarea — `approve` automatico firma un plan que ninguna persona leyo ni contesto — contencion: congelar el modo en `tarea.md` al cerrar `plan` (con las preguntas respondidas) y que la aprobacion automatica solo valga si el modo ya estaba congelado; cambiar config no mueve tareas en curso. No decido si la #1 se reabre: eso le toca a Carlos.
- Hooks que actuan en proyectos ajenos y Stop que no para — el plugin esta instalado a nivel de usuario y se abre una sesion en un repo sin `tareas/`, o un hook Stop devuelve `block` para seguir encadenando — errores en cada turno, commits en un repo que no usa el flujo, o un bucle Stop→seguir→Stop quemando tokens — contencion: los hooks no hacen nada sin `.taskcode/config.yml` con `modo_flujo` distinto de `manual` y una tarea marcada activa; respetar `stop_hook_active`; un tope de pasos encadenados guardado en disco, no en memoria.
- Bucle review→corregir→review sin tope — lo dispara un revisor que pide cambios en cada ronda (TASK-016 llego a 5 rondas y 8 CRITICOS) — en automatico cada ronda relanza agentes y el coste no tiene techo — contencion: tope de rondas (2-3) y, al llegar, pasar a preguntar aunque el modo sea automatico.
- Dos sesiones sobre el mismo arbol de trabajo — una persona con dos ventanas de Claude Code, o la norma de paralelizar agentes — `approve` o `finish` hacen checkout a la rama base (`ensureBaseBranchReady`, `approve.ts:122`) mientras la otra sesion edita, y los cambios acaban en la rama equivocada (HALLAZGOS:239); el WIP lo leen las dos antes de que ninguna mueva la tarea (TOCTOU) — contencion: un fichero de bloqueo por arbol de trabajo dentro de `.git/` mientras dura una cadena; si existe, la segunda sesion aborta.
- Sesion cortada a mitad de la cadena — `/clear`, corte de contexto, o en Windows un `EPERM` al renombrar porque el cwd del shell esta dentro de la carpeta de la tarea (HALLAZGOS:879) — la tarea queda movida y commiteada pero sin la linea de registro, o el registro queda en otra rama — contencion: escribir la linea de registro en el mismo commit que la transicion; `siguiente` deduce la fase solo de lo que hay en Git y en disco, y los comandos hacen `cd` a la raiz antes de llamar a taskctl.

## Puntos sin retorno

- `finish` con `--push` (sobre todo hotfix/release, que crean tag) — publicados, merge y tag solo se compensan con revert.
- Aprobacion automatica commiteada y subida — el historico dira para siempre que se aprobo sin persona.
- Merge local sin subir — se deshace con `reset`, si alguien se da cuenta antes del siguiente push.

## Descartado a proposito

- Plugin antiguo que aborta con la clave nueva `modo_flujo` (`config.ts:286`): doctrina aceptada (§7.3, todo el equipo con la misma version); basta avisarlo en la nota de version.
- Coste de tokens del modo manual: no encadena nada.
- Rendimiento de `taskctl siguiente`: lectura determinista y barata.

## Desacuerdos previstos

- arquitectura — si el encadenamiento vive en hooks Stop/PostToolUse — en contra: que encadene el comando de fase o la skill, de forma explicita; los hooks, como mucho, informan y nunca bloquean el Stop.
- testing — el e2e del ciclo automatico no ejecuta agentes reales — el agujero del veredicto autoescrito no lo cubre nadie; la guarda tiene que estar en taskctl.
- criterios de Carlos — «finish se lanza solo cuando el informe aprueba» aplicado a hotfix/release — en contra: en esos tipos el automatico debe parar antes de finish.

## Suposiciones no verificadas

- Que los hooks del plugin se ejecutan en todas las sesiones del usuario y no solo en los repos que lo usan.
- Con que shell lanza los hooks Claude Code en Windows (bash de Git o cmd).
- Que `bin/taskctl.cmd` aguanta argumentos con espacios, tildes o `&` en cmd y PowerShell.
- Si `--push` se usa hoy en el flujo real.
