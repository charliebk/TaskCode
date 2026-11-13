# taskcode-plugin

Plugin de Claude Code que implementa la metodología de tareas por sprints,
revisión por pares de agentes y Git-Flow determinista descrita en
`docs/PROPUESTA_METODOLOGIA.md` (raíz del repo `TaskCode`). Expone el CLI
`taskctl`.

Para instalarlo y actualizarlo desde el marketplace, ver el README de la raíz
del repo («Instalar el plugin» y «Actualizar»). Licencia: MIT.

## Modelo de los agentes

Los agentes de brainstorm (`agents/brainstorm-*.md`) **no declaran `model:`**
en su frontmatter. Es una decisión, no un olvido (TASK-049, comprobado el
2026-10-05 con Claude Code 2.1.288 en
<https://code.claude.com/docs/en/sub-agents>):

- El campo admite `sonnet`, `opus`, `haiku`, `fable`, un ID completo (por
  ejemplo `claude-opus-5-5`) o `inherit`. Sin él, Claude Code resuelve el
  modelo así: el parámetro `model` de cada invocación, después
  `CLAUDE_CODE_SUBAGENT_MODEL` y por último el de la conversación. Ese orden
  rige desde Claude Code 2.1.251; antes, la variable iba la primera. Y con
  `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` (2.1.257 o posterior) la variable manda
  sobre todo, también sobre el `model` de cada invocación.
- Un alias fijo y barato iría contra la metodología: el modelo depende de la
  complejidad de cada tarea (`modelo_sugerido` en `tarea.md`), y cambiarlo
  obligaría a publicar una versión del plugin.
- `inherit` explícito anularía `CLAUDE_CODE_SUBAGENT_MODEL`, que es la palanca
  de coste de quien instala el plugin.

Quien orquesta pasa `modelo_sugerido` como `model` al lanzar cada agente (la
salida de `taskctl review` ya lo nombra).

## Revisores por pares que trae el plugin

`taskctl review` reparte el diff de la tarea entre las skills revisoras según
los `patrones_archivo` que declara cada una en su `SKILL.md` (si el diff toca
más de tres dominios, va entero al genérico):

| Skill | Dominio | Entra si el diff toca |
|---|---|---|
| `angular-vue-reviewer` | Angular y Vue | `.vue`, `.component.ts`, plantillas y rutas bajo `src/app`, composables |
| `csharp-autocad-ifc-reviewer` | C# sobre AutoCAD o IFC | `.cs`, `.csproj`, `.sln`, `.ifc` |
| `java-spring-reviewer` | Java y Spring Boot | `.java`, `pom.xml`, `build.gradle`, `application*.yml` |
| `rust-wasm-reviewer` | Rust y WebAssembly | `.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`, `.cargo/config.toml`, toolchain/rustfmt/clippy |
| `code-quality-reviewer` | Genérico | Lo que no casa con ningún dominio, o más de tres dominios a la vez |

Cada petición de revisión trae una sección `## Contexto permitido` con lo que
el revisor puede leer:
- el `tarea.md` y `planificacion/` de la tarea;
- los ficheros de su parte del diff, sin lo excluido ni los tests reservados;
- las rutas que el proyecto añada con la clave `contexto_revision` de
  `.taskcode/config.yml`, que es una lista de rutas, como `CLAUDE.md` o una
  carpeta de documentación.

La skill común de los revisores (sección «Lo que lees») manda no leer fuera de
esa lista. Lo que se lea de más se justifica en `## Lecturas fuera del contexto
permitido` del informe.

En una ronda de verificación (la 2 o posterior), la petición añade la línea
`- Modelo sugerido para esta ronda:` con un modelo un escalón más barato
(opus→sonnet→haiku). Solo aparece si la ronda anterior cumple todo esto:
- ningún CRÍTICO, en cualquier estado;
- todas las tablas de hallazgos son legibles;
- no hay ninguna severidad desconocida;
- ningún informe sigue siendo la plantilla.

En cualquier otro caso, el revisor usa el modelo de la tarea.

**La revisión converge.** El coste de revisar crece con el tamaño de la
corrección, no con el del proyecto. Desde la ronda 2, la ronda es una
verificación **acotada** (la línea `- Alcance:` de la petición y la salida
de `taskctl review` lo dicen, con su motivo), también si la ronda anterior
dejó CRÍTICOS o IMPORTANTES:
- revisan los revisores que tienen hallazgos pendientes (todo lo que no está
  `aceptado`; lo `corregido` también se verifica), cada uno los suyos, y los
  de dominio cuyos ficheros toca la corrección; todos reciben el diff entero
  de la corrección;
- cada revisor comprueba sus hallazgos, ejecuta la suite y busca el fallo
  que abre la corrección, y solo abre un hallazgo nuevo si es CRÍTICO o lo
  introduce la propia corrección;
- un merge de la base entre rondas no la cambia: se nombra en el motivo y lo
  que entra con él va en el diff.

Es completa solo con `taskctl review TASK-NNN --completa` (desde la rama
base), sin commit revisado fiable, o si un informe de la ronda anterior no se
puede leer (sin tabla, plantilla sin rellenar, severidad desconocida o
cambios pedidos sin ningún hallazgo). Una completa que sigue a una acotada
revisa desde la rama base.

Entre una ronda y otra se corrige **todo** lo de la ronda: los CRÍTICO e
IMPORTANTE siempre; el MENOR que no compense se marca `aceptado` con su
motivo o pasa a una tarea nueva. `taskctl review` avisa si se abre una ronda
con hallazgos de la anterior sin marcar. El tope de rondas es
`tope_rondas` (de 1 a 10, **2 por defecto**, leído de la config de la rama
base). Si la última ronda permitida pide cambios, `taskctl siguiente`
pregunta en cualquier modo, también en automático, con tres salidas: cerrar
con lo que hay, una ronda más o volver a diseño (lo abierto, en una tarea
nueva). `taskctl review` no abre otra ronda sin `--ronda-extra` y sin la
decisión de la persona en `tarea.md` (`## Rondas extra`, línea
`- Ronda N: <quién y por qué>`); cada ronda extra vuelve a preguntar. Con
`tope_rondas: 3` se comporta como hasta la 0.15.

El motivo, medido: con la regla anterior (0.12), un IMPORTANTE en cualquier
estado, también corregido, obligaba a una ronda completa; los revisores
vuelven a listar los corregidos, así que cada ronda relanzaba una revisión
entera que encontraba otra tanda (hasta 14 rondas en una tarea).

## Regla de una hora

Una tarea prevista de más de **una hora de punta a punta** (de la rama abierta
al cierre con merge) se parte en varias.

- **Plan:** `plan-final.md` lleva `Duracion estimada: N min` bajo «Enfoque
  propuesto», con sus señales: ficheros de código previstos (la mejor señal
  medida), capas y criterios.
- **Approve:** con más de 60 min, o con una cifra que no se entiende,
  `taskctl siguiente` pregunta en cualquier modo y `taskctl approve
  --decidido-por automatico` se rechaza: decide una persona (trocear o aprobar
  entera con el motivo). Sin la línea, `approve` solo avisa.
- **Trocear:** `taskctl trocear TASK-NNN` parte la tarea según la sección
  `## Troceo` del plan: pasa a TASK-NNNa y crea TASK-NNNb, TASK-NNNc... en
  `00-planificadas`, todas con la misma rama, y regenera el ROADMAP en el
  mismo commit. Cada parte se cierra con su `finish`; `start` de la parte
  siguiente vuelve a la rama y le trae antes la base.
- **Finish:** `tarea.md` gana `## Duracion` con la estimada y la real de punta
  a punta (sin pausas), y `taskctl metricas` las muestra en las columnas
  `estimada` y `punta_a_punta`, para calibrar. La fila `finish` de
  `## Transiciones` marca el **fin** del cierre (tras la verificación completa
  y el merge), no el instante en que arrancó el comando, así que `punta_a_punta`
  incluye lo que tarda la verificación. `## Duracion` añade la línea
  `- Cierre (finish): <s> s, de <inicio> a <fin>` y `metricas` la columna
  `finish` (justo antes de `punta_a_punta`; `—` sin dato). Las tareas cerradas
  antes no se migran: su fila `finish` sigue marcando el arranque.

Cómo trocear (porción vertical pequeña frente a capas) y las señales, en la
skill `task-workflow`, `duracion.md`.

## Roles del brainstorm de diseño

`taskctl plan` lanza roles de `agents/` según la complejidad, por este orden de
prioridad: `brainstorm-arquitectura`, `brainstorm-riesgos`,
`brainstorm-testing` y `brainstorm-dominio`. Con dos o más, el
`brainstorm-unificador` consolida sus salidas en el plan.

`brainstorm-rendimiento` es un rol **condicional**: no ocupa sitio en esa
escalera. Se suma cuando la tarea lleva una de las etiquetas `rendimiento`,
`wasm`, `workers` o `3d` (sin distinguir mayúsculas) y la complejidad ya
lanza dos roles o más. Mira el coste algorítmico con el volumen real, las
asignaciones en bucles calientes, las copias entre JS y WASM, los Web Workers,
las mallas y teselas grandes, y qué medir antes de optimizar. Con cero o un rol,
`plan` avisa de que no entra y por qué: sin unificador, rendimiento quedaría
como autor único de un plan cuya forma no le toca proponer.

## Instalación local (para desarrollo y pruebas)

**Corrección respecto al texto original de TASK-006:** la tarea describía
este paso como `/plugin install <ruta-local>`. Esa slash-command no acepta
una ruta de filesystem directamente — sirve para instalar un plugin de un
*marketplace* ya añadido (`/plugin marketplace add ...`). El mecanismo
real y soportado para cargar un plugin en local sin publicarlo en ningún
marketplace es el flag de CLI `--plugin-dir`, confirmado contra la
documentación oficial (`https://code.claude.com/docs/en/plugins`,
sección "Test your plugins locally"):

```bash
claude --plugin-dir /ruta/absoluta/a/TaskCode/taskcode-marketplace/plugins/taskcode-plugin
```

**No hay que compilar nada primero.** Desde TASK-031 (item E6) el build de
producción, `dist/src/`, se versiona: un clon recién hecho ya trae un
`taskctl` que arranca. `npm install && npm run build` sigue haciendo falta
para *desarrollar* el plugin y para correr la suite, que compila también
`dist/test/` — ese sí queda fuera del repo.

Hasta esa tarea era al revés, y el texto de este README lo decía: `dist/`
entero estaba en `.gitignore` y `bin/taskctl` importa `../dist/src/cli.js`,
así que cualquiera que clonara el repo —o instalara el plugin desde el
marketplace, que es una copia, no un checkout donde uno pueda compilar—
recibía un CLI que moría con `Cannot find module ...dist/src/cli.js` y
código 1.

Con el plugin cargado, dentro de la sesión de Claude Code:

- `taskctl --help` debería resolverse como comando de shell suelto (ver
  [«`taskctl` en el PATH del Bash tool»](docs/instalacion-y-distribucion.md#taskctl-en-el-path-del-bash-tool)).
- `/reload-plugins` recarga el plugin tras cambios sin reiniciar la sesión.

Para una instalación persistente vía `/plugin install <nombre>@<marketplace>`
(no solo para la sesión actual) hace falta además un
`.claude-plugin/marketplace.json` en la raíz del marketplace. **Ya existe**,
en la raíz del repo, desde TASK-021 (item A1) — este README afirmó durante un
tiempo que no, y era falso.

## Comandos (resumen)

`taskctl --help` da la lista completa, con todos los flags. En breve:

| Comando | Para qué |
|---|---|
| `new`, `import` | Dar de alta una tarea, a mano o desde un fichero. |
| `plan`, `approve`, `trocear` | Diseño (brainstorm de roles y plan), aprobación del plan y troceo de una tarea de más de una hora. |
| `start` | Abrir la rama de la tarea con el plan aprobado. |
| `review`, `codex-review`, `veredicto` | Revisión por pares por rondas y su veredicto. |
| `verificar-menores` | Tras aprobar con correcciones: registra la corrección de los MENORES sin abrir otra ronda (solo los ficheros que cita cada MENOR, o tests) y deja los no corregidos en `revision/menores-pendientes.md`. |
| `verificar-lote` | Con `verificacion_por_lote`: corre la completa una vez sobre la rama de integración para todas las tareas cerradas pendientes de lote; en rojo dice qué tareas entraron desde la última en verde. |
| `finish` | Cierre: verificación, merge `--no-ff` o merge request, tag opcional. No integra código posterior al commit revisado sin `verificar-menores` o `--aceptar-sin-revisar` (decisión de una persona). |
| `siguiente`, `pausa`, `cadena` | Qué fase toca y si preguntar (según `modo_flujo`); pausar el paso a la siguiente fase; bloquear el árbol mientras las fases se encadenan. |
| `estado`, `board`, `roadmap` | En qué va la fase en curso (también en la status line), tablero y `tareas/ROADMAP.md`. |
| `doctor`, `doctor-deploy` | Que el proyecto está listo para el flujo; que la aplicación está lista para publicarse. |
| `metricas`, `registrar-coste` | Duración, rondas, hallazgos y coste en tokens por fase. |
| `diagnose`, `pause`, `resume`, `recover`, `abort-merge` | Envoltorios de los scripts de Git-Flow. |

El detalle de cada uno está en los documentos de `docs/` que enlaza el índice.

## Documentación

La referencia detallada vive en `docs/`, un fichero por tema:

- [Instalación y distribución](docs/instalacion-y-distribucion.md)
  - [Cómo se distribuye: por qué `dist/src/` está versionado](docs/instalacion-y-distribucion.md#cómo-se-distribuye-por-qué-distsrc-está-versionado)
    - [Limitación conocida: `bin/` y las organization settings de claude.ai](docs/instalacion-y-distribucion.md#limitación-conocida-bin-y-las-organization-settings-de-claudeai)
  - [Usar `taskctl` fuera de Claude Code (PowerShell, cmd, Git Bash)](docs/instalacion-y-distribucion.md#usar-taskctl-fuera-de-claude-code-powershell-cmd-git-bash)
  - [`taskctl` en el PATH del Bash tool](docs/instalacion-y-distribucion.md#taskctl-en-el-path-del-bash-tool)
    - [Bug encontrado y corregido en TASK-006](docs/instalacion-y-distribucion.md#bug-encontrado-y-corregido-en-task-006)
    - [`commands` en `plugin.json`: campo con forma inválida, eliminado — corrección tras revisión por pares](docs/instalacion-y-distribucion.md#commands-en-pluginjson-campo-con-forma-inválida-eliminado--corrección-tras-revisión-por-pares)
    - [Evidencia recogida en esta sesión](docs/instalacion-y-distribucion.md#evidencia-recogida-en-esta-sesión)
    - [Smoke test en un clon aislado](docs/instalacion-y-distribucion.md#smoke-test-en-un-clon-aislado)
    - [Lo que NO se ha podido verificar en esta sesión (limitación de entorno)](docs/instalacion-y-distribucion.md#lo-que-no-se-ha-podido-verificar-en-esta-sesión-limitación-de-entorno)
    - [RESUELTO (2026-09-05): el CI de Windows nativo contestó las preguntas](docs/instalacion-y-distribucion.md#resuelto-2026-09-05-el-ci-de-windows-nativo-contestó-las-preguntas)
    - [RESUELTO (2026-09-07, TASK-031): el `/plugin install` real, por fin ejecutado](docs/instalacion-y-distribucion.md#resuelto-2026-09-07-task-031-el-plugin-install-real-por-fin-ejecutado)
    - [Segunda limitación, específica de este repo: `core.fileMode=false`](docs/instalacion-y-distribucion.md#segunda-limitación-específica-de-este-repo-corefilemodefalse)
- [Configuración, verificación y hooks](docs/configuracion.md)
    - [Cómo se verifica el proyecto: `comando_verificacion`](docs/configuracion.md#cómo-se-verifica-el-proyecto-comando_verificacion)
    - [Verificación selectiva por impacto: `comando_verificacion_selectiva`](docs/configuracion.md#verificación-selectiva-por-impacto-comando_verificacion_selectiva)
    - [Tareas de solo documentación: `rutas_documentacion`](docs/configuracion.md#tareas-de-solo-documentación-rutas_documentacion)
    - [Código parcial: `rutas_verificacion_parcial`](docs/configuracion.md#código-parcial-rutas_verificacion_parcial)
    - [Freno de fin de turno (hook `Stop`)](docs/configuracion.md#freno-de-fin-de-turno-hook-stop)
    - [Comando y presupuesto propios del freno: `comando_verificacion_freno`](docs/configuracion.md#comando-y-presupuesto-propios-del-freno-comando_verificacion_freno)
    - [Coste de implementación automático (hooks `Stop` y `SubagentStop`)](docs/configuracion.md#coste-de-implementación-automático-hooks-stop-y-subagentstop)
    - [Puerta de verificación en `finish`](docs/configuracion.md#puerta-de-verificación-en-finish)
    - [Verificación completa por lote: `verificacion_por_lote`](docs/configuracion.md#verificación-completa-por-lote-verificacion_por_lote)
    - [Tests pesados solo en release: `comando_verificacion_pesada`](docs/configuracion.md#tests-pesados-solo-en-release-comando_verificacion_pesada)
    - [Crecimiento de la suite: `umbral_crecimiento_suite`](docs/configuracion.md#crecimiento-de-la-suite-umbral_crecimiento_suite)
    - [Tests held-out (`aceptacion/`)](docs/configuracion.md#tests-held-out-aceptacion)
    - [Cobertura de las líneas cambiadas](docs/configuracion.md#cobertura-de-las-líneas-cambiadas)
    - [Guardián de merges (hook `PreToolUse`)](docs/configuracion.md#guardián-de-merges-hook-pretooluse)
    - [Documento de estado vigilado por `doctor`: `documento_estado`](docs/configuracion.md#documento-de-estado-vigilado-por-doctor-documento_estado)
    - [Tope de rondas de revisión: `tope_rondas`](docs/configuracion.md#tope-de-rondas-de-revisión-tope_rondas)
  - [Sincronización de ficheros derivados](docs/configuracion.md#sincronización-de-ficheros-derivados)
  - [ROADMAP de tareas (`tareas/ROADMAP.md`)](docs/configuracion.md#roadmap-de-tareas-tareasroadmapmd)
- [Cierre y release](docs/cierre-y-release.md)
  - [`taskctl finish`](docs/cierre-y-release.md#taskctl-finish)
    - [GitLab propio (autoalojado, con dominio propio o bajo una ruta)](docs/cierre-y-release.md#gitlab-propio-autoalojado-con-dominio-propio-o-bajo-una-ruta)
  - [`taskctl doctor-deploy`](docs/cierre-y-release.md#taskctl-doctor-deploy)
    - [Puntos de juicio: `--resultado`](docs/cierre-y-release.md#puntos-de-juicio---resultado)
    - [Una tarea por FALLA: `--crear-tareas`](docs/cierre-y-release.md#una-tarea-por-falla---crear-tareas)
    - [Aviso al cerrar una release](docs/cierre-y-release.md#aviso-al-cerrar-una-release)
- [Comandos en detalle](docs/comandos.md)
  - [Comandos disponibles](docs/comandos.md#comandos-disponibles)
    - [Progreso visible: `taskctl estado`, la status line y `TASKCTL_PROGRESO`](docs/comandos.md#progreso-visible-taskctl-estado-la-status-line-y-taskctl_progreso)
  - [`taskctl metricas`](docs/comandos.md#taskctl-metricas)
  - [`taskctl registrar-coste`](docs/comandos.md#taskctl-registrar-coste)
- [Problemas conocidos y puntos abiertos](docs/problemas-conocidos.md)
  - [Problemas conocidos](docs/problemas-conocidos.md#problemas-conocidos)
    - [Un subagente se deniega con «Auto-Mode Bypass»](docs/problemas-conocidos.md#un-subagente-se-deniega-con-auto-mode-bypass)
  - [Mecanismo determinista de sección 14 (punto 11): sigue sin confirmarse](docs/problemas-conocidos.md#mecanismo-determinista-de-sección-14-punto-11-sigue-sin-confirmarse)
