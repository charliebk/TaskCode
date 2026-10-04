# Plan — TASK-055: Flujo guiado por fases con modos manual, semiautomatico y automatico

(Lo consolida el agente unificador a partir de 3 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos, testing.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto
- El CLI decide y el agente ejecuta (arquitectura; testing lo respalda): funcion pura `siguienteFase` en `src/core/flujo.ts` y `taskctl siguiente TASK-NNN --json`, de solo lectura, dicen que fase toca y si se pregunta.
- Se extienden `config.ts` (`modo_flujo`, por defecto `manual`), cada `run*Command` (fila `fecha | fase | modo | decidido_por` en `## Transiciones` dentro del autoCommit que ya hace) y `approve --decidido-por automatico` (arquitectura).
- Se crean `bin/taskctl.cmd` y siete `commands/*.md` finos: ejecutan su taskctl y su trabajo de agentes, llaman a `siguiente` y terminan, preguntan o invocan el siguiente; la logica de modos va en una sola seccion de la skill (arquitectura). Sin hooks (desacuerdo 1).
- Orden A → B → C → D → E (particion abajo). Se lanzaron 3 roles por la regla del mayor: declarada alta, heuristica simple; la peticion avisa de que el enunciado puede infraestimar el coste, y la particion en 5 tareas lo confirma.

## Desacuerdos entre roles, y como se resuelven
- Hooks — arquitectura: ningun hook, encadena el comando de fase / riesgos: hooks a lo sumo informan, nunca bloquean Stop, solo con config y tarea activa, tope en disco / testing: test estatico de hooks.json — gana arquitectura — ningun criterio pide hooks, y sin hooks sobran las contenciones de riesgos para ellos (no cubre «el objetivo nombra la falta de hooks»: ver Sin cubrir).
- Guarda de la aprobacion automatica — arquitectura: el CLI la rechaza si `modo_flujo` en config no es automatico / riesgos: solo vale si el modo se congelo en tarea.md al cerrar plan; cambiar config no mueve tareas en curso — gana riesgos — con la de arquitectura, editar config a mitad de tarea firma un plan que nadie respondio.
- Quien afirma que la suite pasa (criterio 8) — arquitectura: la ejecuta el agente, el CLI solo comprueba arbol limpio y commiteado, sin clave `comando_tests` / riesgos: la guarda tiene que estar en taskctl (lo dice del veredicto; no hay posicion explicita sobre la suite) — gana arquitectura — no hay propuesta concreta alternativa; queda como riesgo aceptado, no como garantia.
- finish automatico en hotfix/release — criterio 8 del enunciado y arquitectura (tarea E sin excepcion) / riesgos: parar antes de finish y nunca `--push` — no se decide aqui — merge a main, tag y backmerge son puntos sin retorno (riesgos); la particion lleva la parada de riesgos de forma provisional y sube a Carlos.
- Marcas prohibidas en `commands/` — arquitectura: ampliar a `commands/` el test que hoy recorre `skills/` y `agents/` / testing: `MARCAS_DEL_REPO` prohibe 'taskctl', 'taskcode' y 'tareas/', y los comandos tienen que invocar taskctl: otra lista, explicita y justificada — gana testing — la misma lista fallaria por construccion.
- Prefijo `/taskcode:` frente a `/taskcode-plugin:` — arquitectura: no renombrar el plugin (rompe instalaciones) y corregir el criterio 2 / testing: lo deja como suposicion no verificada — no se decide aqui — cambiar el texto de un criterio es de Carlos.

## Particion propuesta
- **A — `bin/taskctl.cmd` y README** (crit. 1): arranca con `--version` desde cmd y desde PowerShell sobre un clon de HEAD (test win32, skip en Linux); `.gitattributes` fija el eol de `.cmd` con prueba, no hereda `bin/* eol=lf` (testing); aguanta argumentos con espacios, tildes y `&` (riesgos); el README explica el uso fuera de Claude Code; funciona sin `npm install` en el proyecto que instala el plugin.
- **B — nucleo determinista** (crit. 3, 4, 10): `modo_flujo` sin clave vale manual, invalido aborta listando los tres, repetida aborta; `siguiente` cubre por tabla literal cada estado × plan_aprobado × modo × veredicto; `siguiente` no commitea y sale distinto de 0 con tarea inexistente o config roto; cada transicion escribe su fila en el mismo commit que la transicion (riesgos); al cerrar plan se congela el modo en tarea.md (riesgos); `approve --decidido-por automatico` se rechaza si el modo congelado no es automatico; `siguiente` deduce la fase solo de Git y disco.
- **C — comandos en modo manual** (crit. 2, 5, 11): existen los siete `commands/*.md` con frontmatter valido; cada uno nombra el subcomando de taskctl que le toca y el siguiente comando, sin encadenar; la skill describe los tres modos y los comandos; test de marcas sobre `commands/` con su lista propia; los comandos hacen `cd` a la raiz antes de taskctl (riesgos).
- **D — semiautomatico** (crit. 6, 12b): al cerrar plan, approve, start y review se pregunta; un no deja la tarea en su estado sin fila y nombra el comando que reanuda; e2e en repo temporal con un no en approve que deja en diseno, y su contraprueba con un si; bloqueo por arbol de trabajo en `.git/` mientras dura una cadena: una segunda sesion aborta (riesgos).
- **E — automatico** (crit. 7, 8, 9, 12a): tras plan no hay ningun `preguntar=true`; approve queda registrado como automatico; review solo con implementacion commiteada; finish solo con informe aprobado y en un commit propio, posterior a la implementacion y que no toca codigo, si no se para y pregunta (riesgos); tope de rondas de review (2-3) y al llegar se pregunta (riesgos); hotfix/release se paran antes de finish y nunca se pasa `--push` (riesgos, pendiente de Carlos); WIP, base sucia, informe sin veredicto y `revision_codex` sin segunda opinion abortan tambien en automatico; e2e del ciclo automatico.

## Riesgos aceptados y que los contiene
- Veredicto autoescrito por el orquestador mergea codigo no revisado — riesgos — informe en commit propio y registro de quien lanza el revisor (E); el e2e con fixtures no lo cubre (testing, riesgos).
- «La suite pasa» es palabra del agente, no del CLI — arquitectura — el CLI exige arbol limpio y commiteado; nada mas lo contiene.
- Bucle review→corregir→review sin techo (TASK-016: 5 rondas) — riesgos — tope de rondas en disco (E).
- Dos sesiones sobre el mismo arbol: checkout a base y TOCTOU del WIP — riesgos — bloqueo en `.git/` (D).
- Sesion cortada a mitad de cadena o `EPERM` por cwd dentro de la tarea — riesgos — fila en el mismo commit, `siguiente` sin estado en memoria, `cd` a la raiz (B, C).
- El markdown de los comandos solo se prueba por su forma — testing — test que ata cada comando al subcomando de `siguiente`, mas smoke manual.

## Plan de pruebas
- Tabla entera de `siguiente` con `deepEqual`, mutantes incluidos — `test/core/siguiente.test.ts`, en proceso — testing.
- `siguiente` por spawn: salida parseable y codigos de salida; `modo_flujo: auto` rechazado — repo Git temporal — testing.
- Config: defaults con asercion literal `modo_flujo === 'manual'` (rompe `config.test.ts:78`) — `config.test.ts` — testing.
- e2e automatico y semiautomatico con «no» y contraprueba «si»; fixtures commiteados en lugar de agentes — repo temporal; no venderlo como «e2e del plugin» — testing, riesgos.
- Guardas en automatico (WIP, base sucia, sin veredicto, segunda opinion) y aprobacion automatica sin modo congelado — repo temporal — testing, riesgos.
- `taskctl.cmd` por `cmd /c` y `pwsh -c`; smoke manual en Claude Code en un proyecto ajeno con evidencia al Resultado — clon de HEAD / sesion real — testing.

## Sin cubrir, salidas que faltaron y suposiciones
- Sin cubrir: la garantia «mejor skill» del objetivo — ningun rol dice como se conserva en los comandos; la decide quien implemente C y la revisa el revisor.
- Sin cubrir: el objetivo cita que no hay hooks, pero ningun criterio los pide; con el desacuerdo 1 la tarea entrega cero hooks, y eso debe constar al cerrar.
- Salidas: llegaron las tres. No se lanzo rol de dominio: arquitectura y riesgos le atribuyen dos desacuerdos (decision #1, prefijo) que nadie con ese punto de vista discutio; suben a Carlos.
- Suposicion: `${CLAUDE_PLUGIN_ROOT}` se sustituye en el cuerpo de `commands/*.md` — arquitectura — probarlo en el smoke de C.
- Suposicion: un comando de barra puede invocar el siguiente sin la persona; si no, el encadenado va dentro del mismo comando — arquitectura — comprobar antes de D.
- Suposicion: un «no» en semiautomatico no es transicion y no deja fila — arquitectura, testing — choca con la letra del crit. 10 («cada transicion»); confirmarlo Carlos al aprobar.
- Suposicion: los tests que comparan tarea.md entero solo cambian por la seccion nueva — testing — correr `tarea-file`, `new-contenido`, `auto-commit` tras B.
- Suposicion: si `--push` se usa hoy en el flujo real — riesgos — sin verificar.

## Lo que necesita decision de una persona
- **Decision #1, registrada como de Carlos**: pidio en esta sesion modo «totalmente automatico, sin ninguna pregunta hasta terminar la fase finish, porque todas las preguntas al usuario se han hecho en la fase de plan». Divergencia anotada: deja sin efecto «checkpoint humano siempre» (`TRIVIAL_SIN_APROBACION` vacio); arquitectura pide reabrirla en un unico punto, la maquina de estados; riesgos marca la aprobacion automatica subida como punto sin retorno en el historico. El unificador no la decide ni la aprueba: la registra.
- **hotfix/release en automatico** — parar antes de finish y sin `--push` (riesgos) o finish encadenado como dice el crit. 8 (arquitectura): contradice un criterio escrito por Carlos.
- **Modo por defecto** — propuesta: manual (ya lo fija el crit. 3; testing pide matar el mutante que lo cambie). Confirmarlo es de Carlos.
- **Prefijo y particion** — corregir el crit. 2 a `/taskcode-plugin:` o renombrar el plugin; y aceptar partir en A-E. Este plan no vale hasta que una persona lo apruebe con `taskctl approve`.

## Verificado en la documentacion oficial (orquestador, tras el unificador)

Comprobado por un agente contra la documentacion de plugins de Claude Code:

- **Skills en lugar de `commands/`**: la documentacion recomienda skills
  invocables por la persona para trabajo nuevo; `commands/` queda como
  formato anterior. Las fases seran **skills** (`skills/<fase>/SKILL.md`),
  que se invocan igual, `/taskcode-plugin:<fase>`, y admiten `description`,
  `arguments` (`$ARGUMENTS`, `$0`...), `allowed-tools` y
  `disable-model-invocation`. Donde el plan dice `commands/*.md`, leer
  `skills/<fase>/SKILL.md`; el test de marcas propio aplica a esas skills.
- **`bin/` esta en el PATH del Bash tool** y `${CLAUDE_PLUGIN_ROOT}` se
  sustituye en el cuerpo de skills y comandos: las fases pueden llamar a
  `taskctl` por su nombre. Suposicion de arquitectura confirmada.
- **Encadenar es posible**: la herramienta `Skill` lanza otra skill sin
  intervencion de la persona (sujeto al modo de permisos de la sesion).
  Suposicion de arquitectura confirmada.
- **AskUserQuestion** esta disponible desde cualquier skill: base del modo
  semiautomatico, confirmada.
- **Los hooks de un plugin corren en todas las sesiones donde esta
  habilitado**, sea cual sea el repo, con Git Bash por defecto en Windows. Da
  la razon al desacuerdo 1 (sin hooks). `stop_hook_active` no aparece en la
  documentacion: otra razon para no apoyar nada en un hook Stop.
