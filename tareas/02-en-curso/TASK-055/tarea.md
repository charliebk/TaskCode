---
id: TASK-055
titulo: "Flujo A: taskctl desde PowerShell y cmd"
tipo: feature
sprint: 7
etiquetas: [cli, skill, flujo]
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-055-flujo-guiado-por-fases-con-modos-manual
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Hoy el plugin solo trae el CLI, la skill y los agentes: no hay comandos de fase ni hooks, ninguna fase avanza sola ni pregunta, y fuera de Claude Code taskctl ni siquiera arranca en PowerShell. El objetivo es que el plugin conduzca el ciclo plan, approve, start, review y finish dentro de Claude Code, con un comando por fase para reanudar en cualquier sesion y un modo de flujo configurable: manual (la persona lanza cada comando), semiautomatico (al cerrar cada fase pregunta si seguir; un no deja la tarea en su estado) y automatico (todas las preguntas se hacen en plan y el resto corre sin preguntar hasta finish). En los tres modos se conservan las garantias: revision independiente, mejor skill, segunda opinion, ramas que no se pisan y un historico en Git de todo lo planificado y ejecutado.

Esta tarea es la entrega **A** de la particion acordada el 2026-10-04 (ver
`planificacion/plan-final.md`, que es el diseno de referencia de las cinco):
A, `taskctl` desde PowerShell y cmd; B, nucleo determinista y registro; C,
fases como skills en modo manual; D, semiautomatico; E, automatico. B a E se
importan como tareas propias. Los criterios del enunciado original estan en
el historial de Git de este fichero.

## Criterios de aceptacion
- [x] `bin/taskctl.cmd` arranca `taskctl --version` desde cmd y desde PowerShell sobre un clon de HEAD (test solo en Windows, skip visible en Linux)
- [x] `.gitattributes` fija el fin de linea de `bin/taskctl.cmd` con una prueba, sin heredar `bin/* eol=lf`
- [x] Un argumento con espacios, tildes y `&` llega intacto a `taskctl` por `taskctl.cmd`
- [x] Funciona sin `npm install` en el proyecto que instala el plugin (usa el `dist/` versionado)
- [x] El README del plugin explica como usar `taskctl` fuera de Claude Code (PATH o ruta completa, en PowerShell, cmd y Git Bash)

## Resultado

Entrega A del flujo guiado. Plan: el brainstorm de 3 roles (arquitectura,
riesgos, testing) y el unificador de esta tarea, que es el diseno de
referencia de las cinco entregas; la documentacion oficial de plugins se
verifico con un agente aparte (skills invocables en lugar de `commands/`,
`bin/` en el PATH del Bash tool, encadenado con la herramienta Skill, hooks
en todas las sesiones). Decisiones de Carlos en el plan-final.

- `bin/taskctl.cmd`: `node "%~dp0taskctl" %*`. Sin `exit /b`: un mutante
  demostro que sobraba (node es la ultima orden y su codigo ya es el del
  `.cmd`); el test del codigo de salida sigue cubriendolo.
- `.gitattributes`: `bin/*.cmd text eol=crlf`, despues de `bin/* eol=lf`
  (gana la ultima regla).
- README: seccion «Usar `taskctl` fuera de Claude Code» con ruta completa,
  funcion de perfil de PowerShell que elige la version instalada mas alta
  (vale tambien para versiones sin `.cmd`, como la 0.3.0 instalada hoy),
  PATH para cmd y alias de Git Bash. Los tres fragmentos se ejecutaron contra
  la instalacion real.

Tests en `test/empaquetado/distribucion.test.ts`, sobre el arbol de HEAD
exportado (sin `npm install`), solo en Windows y con skip visible en Linux:
`--version` desde cmd y desde PowerShell; `new --titulo "Acción con espacios
& más"` desde los dos shells deja ese titulo exacto en `tarea.md`; un error de
taskctl sale distinto de 0; y la regla CRLF del `.cmd` (por `check-attr`).
Suite: 983 tests, 980 en verde (los 3 rojos conocidos de Windows).
Mutantes: `%*` por `%1 %2` (muerto), sin la regla CRLF (muerto), sin
`exit /b` (sobrevive: linea eliminada).

