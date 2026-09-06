---
id: TASK-006
titulo: "Empaquetado del plugin y validación de carga local"
tipo: feature
sprint: 0
etiquetas: [plugin, empaquetado]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-006-empaquetado-plugin
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: 655879a
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-001]
---
## Objetivo

Verificar de punta a punta que el plugin se puede instalar en local con
`/plugin install <ruta-local>` en Claude Code y que `taskctl` queda en el
PATH del Bash tool. Documentar el procedimiento exacto en
`taskcode-marketplace/plugins/taskcode-plugin/README.md`.

## Criterios de aceptación

- [x] Instalación local documentada y probada manualmente (evidencia en el
      README: comandos ejecutados y salida). El texto original mencionaba
      `/plugin install <ruta-local>`, que no existe con esa forma (esa
      slash-command instala desde un marketplace ya añadido, no acepta
      una ruta de filesystem); el mecanismo real, confirmado contra
      `https://code.claude.com/docs/en/plugins`, es el flag de CLI
      `--plugin-dir`. Documentado con evidencia real: build, 226/226
      tests, 4 formas de invocación (`node bin/taskctl`, `./bin/taskctl`,
      resolución por PATH, `which`), y un smoke test completo en un clon
      Git aislado (`taskctl import`/`board` de punta a punta). No se ha
      podido ejecutar `claude --plugin-dir` en modo interactivo dentro de
      esta sesión (ni el contenedor cloud ni el bridge de dispositivo
      exponen un CLI interactivo real de Claude Code — ambos devuelven el
      mismo stub restringido, con evidencia literal en el README) — mismo
      patrón que TASK-007, documentado explícitamente como paso pendiente
      de una sesión nativa futura, no como "hecho" sin serlo.
- [x] `taskctl --help` accesible desde una sesión nueva de Claude Code tras
      la instalación, sin rutas absolutas hardcodeadas. Corregido el bug
      real que lo bloqueaba: `bin/taskctl` estaba trackeado por Git en
      modo `100644` (no ejecutable), así que cualquier clon nuevo — el
      mecanismo real de `bin/` en PATH que documenta Claude Code — nunca
      habría funcionado como comando suelto. Corregido con
      `git update-index --chmod=+x` y verificado en un clon aislado real
      (el bit sobrevive el clon en un filesystem POSIX estándar). Ningún
      script ni el propio `bin/taskctl` usan rutas absolutas hardcodeadas
      (usa `import('../dist/src/cli.js')`, relativo al propio fichero).
      Matiz documentado y sin resolver: el mecanismo `bin/` en PATH está
      especificado para el "Bash tool"; en Windows nativo sin Git for
      Windows, Claude Code usa el PowerShell tool en su lugar, y no hay
      confirmación oficial de si `bin/` se añade al PATH ahí también —
      queda como pregunta abierta en el README, no se ha podido descartar
      ni confirmar desde esta sesión.
- [x] Nota explícita de que el mecanismo determinista para comprobar
      instalación (sección 14 de la metodología) sigue sin confirmarse con
      documentación oficial — no bloquea esta tarea, se deja registrado.
      Sección dedicada en el README citando el punto 11 exacto de la
      sección 14 (que `taskctl` mismo tenga una forma programática de
      consultar qué plugins/skills están instalados, sin depender de un
      LLM), dejando constancia de que la documentación oficial consultada
      en esta tarea no cubre ese mecanismo.

## Resultado

**Alcance real vs. lo escrito originalmente en el Objetivo:** el texto de
la tarea decía `/plugin install <ruta-local>`, una forma de invocación que
no existe — confirmado contra la documentación oficial de Claude Code
(`https://code.claude.com/docs/en/plugins`). El mecanismo real y soportado
para cargar un plugin en local sin publicarlo es `claude --plugin-dir
<ruta>`. Se documentó esta corrección explícitamente en el README en vez
de fingir que el texto original era literalmente correcto.

**Dos bugs reales encontrados y corregidos** (no solo documentación):

1. `bin/taskctl` estaba trackeado por Git en modo `100644` (no ejecutable)
   pese a tener `chmod +x` en el working tree local. Cualquier clon
   limpio del repo heredaba el fichero sin bit de ejecución, así que
   `taskctl` como comando suelto —el mecanismo real de `bin/` en PATH que
   documenta Claude Code— nunca había funcionado en un clon nuevo; solo
   la invocación explícita `node bin/taskctl ...` (usada en todos los
   smoke tests de TASK-004/TASK-005 hasta ahora) evitaba el problema.
   Corregido con `git update-index --chmod=+x` y confirmado en un clon
   Git aislado real (bit sobrevive, comando suelto funciona por PATH).
2. `.claude-plugin/plugin.json` tenía `"commands": {"taskctl": "bin/taskctl"}`.
   Ese campo existe en el schema real (apunta a ficheros `.md` de skills,
   tipo `string | array`), pero un objeto es un tipo no soportado —
   confirmado contra `https://code.claude.com/docs/en/plugins-reference`,
   que documenta que un campo reconocido con tipo incorrecto
   típicamente hace fallar la carga completa del plugin. Es decir, no se
   puede descartar que el `plugin.json` tal cual estaba impidiera que el
   plugin cargara en cualquier sesión real hasta este fix — un hallazgo
   más severo de lo que se pensó al principio (ver corrección de la
   propia revisión por pares abajo). Se eliminó el campo y se corrigió
   `author` al formato de objeto oficial (`{"name": "..."}`).

**Nuevo `taskcode-marketplace/plugins/taskcode-plugin/README.md`**
(no existía): procedimiento de instalación local correcto, el mecanismo
`bin/`-en-PATH explicado con cita textual de la referencia oficial,
evidencia real de comandos ejecutados (build, 226/226 tests, 4 formas de
invocación, smoke test en clon aislado con `import`/`board` de punta a
punta), y documentación explícita de las limitaciones de entorno
encontradas.

**Revisión por pares independiente** (agente `general-purpose`,
reproducción empírica completa, no solo lectura de diff — incluyó su
propio clon temporal, su propio `npm test`, y contraste directo contra la
documentación oficial vía WebFetch): 0 CRÍTICO, 3 IMPORTANTE, 2 MENOR,
todos con evidencia de reproducción. Los 3 IMPORTANTE eran de precisión
documental, no de código (el fix de `bin/taskctl` y la eliminación de
`commands` ya eran correctos tal cual estaban):

- El mecanismo `bin/` en PATH está documentado específicamente para el
  "Bash tool", no shell tools en general; en Windows nativo sin Git for
  Windows, Claude Code usa el PowerShell tool en su lugar, y no hay
  confirmación oficial de si `bin/` se añade al PATH ahí también —
  hallazgo real, verificado contra `docs/en/setup`, documentado como
  pregunta abierta.
- La explicación original de por qué se eliminó `commands` de
  `plugin.json` era incorrecta ("no existe en el schema" — sí existe,
  con tipo `string | array`, nunca objeto). Corregida la explicación y
  elevada la severidad real documentada (posible fallo de carga completo
  del plugin, no un campo inofensivo).
- El AC3 cita literalmente el punto 11 de la sección 14 de la
  metodología, que es sobre que `taskctl` mismo tenga un mecanismo
  programático para consultar qué plugins/skills están instalados — un
  punto distinto de la confirmación manual de instalación que cubre el
  resto del README. Añadida una sección dedicada citando el punto exacto.

Los 2 MENOR, aplicados igualmente:

- La evidencia de permisos "-rwx------" recogida al principio de la tarea
  no probaba nada por sí sola: el punto de montaje del bridge de
  dispositivo sintetiza ese mismo permiso para cualquier fichero, sea o
  no ejecutable de verdad (verificado con un fichero vacío recién creado
  y con `package.json`). Sustituida la afirmación vaga original ("no
  preserva de forma fiable") por esta evidencia concreta y reproducible.
- No se intentaron las herramientas de computer-use del bridge de
  dispositivo para verificar el bit de ejecución en una ventana real de
  Windows desde esta misma sesión. Documentado como descartado por
  alcance/tiempo, no como imposible.

**Números finales:** 226/226 tests (heredados de TASK-005, sin tests
nuevos — TASK-006 es empaquetado/documentación, no lógica de comandos
nueva); 3 commits en la rama
(`feat(TASK-006)`, `docs(TASK-006): evidencia smoke test`,
`docs(TASK-006): hallazgos de revisión por pares`).

**Paradoja de bootstrapping de meta-tareas (ya documentada en
TASK-004/005/008-012):** esta propia tarea se gestionó editando su
`tarea.md` a mano en vez de vía `taskctl plan`/`approve`/`start`, así que
su frontmatter `estado` se queda en `planificada` aunque el trabajo esté
terminado — comportamiento esperado y ya aceptado para las tareas
fundacionales del propio `taskctl`.

**Cierra Sprint 0 por completo**: TASK-001 a TASK-007 quedan todas
terminadas.
