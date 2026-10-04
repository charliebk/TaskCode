---
id: TASK-055
titulo: "Flujo A: taskctl desde PowerShell y cmd"
tipo: feature
sprint: 7
etiquetas: [cli, skill, flujo]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
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


### Revision por pares (ronda 1)

Revisor independiente: **cambios-solicitados** (1 CRITICO, 4 MENOR).

- CRIT-1 (corregido): desde PowerShell, con `bin` en el PATH, `taskctl`
  resolvia a `taskctl.cmd` y PowerShell 5.1 pasa sin comillas los argumentos
  sin espacios: un titulo `I+D&QA` se commiteaba truncado y ejecutaba `QA`, y
  `foo->notas.txt` vaciaba `notas.txt`. No tiene arreglo dentro del `.cmd`
  (cmd.exe interpreta la linea antes de ejecutarlo). Correccion: en
  PowerShell la via es la funcion de perfil del README, que llama a `node`
  sin pasar por cmd; el README avisa de no usar el PATH desde PowerShell, y
  el `.cmd` queda para cmd con los argumentos entre comillas. Descartado un
  `bin/taskctl.ps1`: con la politica de ejecucion por defecto de Windows
  falla en vez de caer al `.cmd`.
  **Divergencia con el criterio 1**, que pedia arrancar «desde PowerShell»
  con `taskctl.cmd`: arranca, pero no es seguro con argumentos arbitrarios;
  la via de PowerShell es la funcion. El test de PowerShell ejecuta el
  fragmento del README tal cual (extraido del propio README) contra una cache
  falsa enlazada al arbol exportado, con `I+D&QA|x>notas.txt` y 13
  argumentos, y comprueba titulo, criterios, `notas.txt` intacto y workspace
  limpio. Mutante «la funcion vuelve a llamar al .cmd»: muerto.
- MEN-1 (corregido): `%1..%9` sobrevivia; los tests pasan ahora 13
  argumentos. Mutante muerto.
- MEN-2 (corregido en el README): en cmd, entrecomillar `& | < > ^`, y aviso
  de que `%NOMBRE%` se expande aunque vaya entre comillas.
- MEN-3 (aceptado): `%~dp0` falla si el lanzador se invoca entrecomillado por
  el PATH (`""taskctl" uno"`). Fallo conocido de cmd.exe; quien escribe
  `taskctl` sin comillas no lo ve.
- MEN-4 (corregido): la funcion de perfil ignora versiones que no son X.Y.Z
  (`-as [version]`) en lugar de imprimir un error. El test mete un
  `0.1.0-rc.1` en la cache falsa y exige stderr vacio; mutante muerto.

### Revision por pares (ronda 2)

Revisor independiente: **aprobada-con-correcciones**. CRIT-1 cerrado y
verificado con 11 titulos con metacaracteres desde PowerShell 5.1 por la
funcion de perfil, y con mutantes (la funcion vuelve al `.cmd`: rojo). Cuatro
MENOR nuevos, corregidos sin abrir ronda 3:

- MEN-5 (documentado): PowerShell 5.1 no escapa las comillas dobles internas
  al llamar a `node`; el README lo avisa. No se escapa en la funcion: hacerlo
  bien con `"` y `\` es facil de dejar a medias y el caso es de fidelidad, no
  de seguridad.
- MEN-6: comentario del `.cmd` (era «para cmd y PowerShell»).
- MEN-7 y MEN-8: la funcion falla con «taskcode-plugin no esta instalado»
  si no hay ninguna version X.Y.Z; test nuevo con una cache que solo trae
  `0.4.0-beta`, que ademas mata el mutante que quita el filtro de versiones.
