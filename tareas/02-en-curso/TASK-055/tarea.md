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
- [ ] `bin/taskctl.cmd` arranca `taskctl --version` desde cmd y desde PowerShell sobre un clon de HEAD (test solo en Windows, skip visible en Linux)
- [ ] `.gitattributes` fija el fin de linea de `bin/taskctl.cmd` con una prueba, sin heredar `bin/* eol=lf`
- [ ] Un argumento con espacios, tildes y `&` llega intacto a `taskctl` por `taskctl.cmd`
- [ ] Funciona sin `npm install` en el proyecto que instala el plugin (usa el `dist/` versionado)
- [ ] El README del plugin explica como usar `taskctl` fuera de Claude Code (PATH o ruta completa, en PowerShell, cmd y Git Bash)
