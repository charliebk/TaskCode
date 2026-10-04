---
id: TASK-055
titulo: "Flujo guiado por fases con modos manual, semiautomatico y automatico"
tipo: feature
sprint: 7
etiquetas: [cli, skill, flujo]
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-055-flujo-guiado-por-fases-con-modos-manual
asignado_a: null
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

## Criterios de aceptacion
- [ ] taskctl arranca desde PowerShell y cmd en Windows (bin/taskctl.cmd) y el README explica como usarlo fuera de Claude Code
- [ ] El plugin trae un comando por fase (/taskcode:plan, approve, start, review, finish, mas new y board) que ejecuta el taskctl de esa fase y el trabajo de agentes que le toca
- [ ] Clave modo_flujo en .taskcode/config.yml con valores manual, semiautomatico y automatico; sin clave vale manual y un valor invalido aborta con la lista de validos
- [ ] Comando determinista taskctl siguiente TASK-NNN que, segun estado y modo, devuelve la siguiente fase y si hay que preguntar, con tests por cada combinacion
- [ ] En modo manual cada comando hace su fase y termina nombrando el comando de la siguiente, sin encadenar nada
- [ ] En modo semiautomatico, al cerrar plan, approve, start y review se pregunta si seguir; un no deja la tarea en su estado y dice que comando la reanuda
- [ ] En modo automatico, cerrado el plan con sus preguntas, approve, start, implementacion, review y finish se encadenan sin preguntar; la aprobacion queda registrada como automatica
- [ ] review se lanza sola cuando la implementacion esta commiteada y la suite pasa, y finish se lanza sola cuando el informe aprueba; ambas se pueden forzar por comando
- [ ] Ningun modo se salta las guardas: limite WIP, rama base limpia, revisor independiente, veredicto fail-closed y segunda opinion cuando revision_codex es true
- [ ] Cada transicion, manual o automatica, deja un registro en tarea.md con fecha, fase, modo y quien decidio, commiteado en Git
- [ ] La skill task-workflow describe los tres modos y los comandos de fase, sin mencionar rutas ni documentos internos de este repo
- [ ] Test de punta a punta en repo temporal: un ciclo en modo automatico y otro en semiautomatico con un no en approve que deja la tarea en diseno
