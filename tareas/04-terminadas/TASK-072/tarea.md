---
id: TASK-072
titulo: "Puerta de verificacion en finish y merge guard"
tipo: feature
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-072-puerta-de-verificacion-en-finish-y-merge
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 673273
tokens_implementacion: null
tokens_revision: 4499684
creado: 2026-11-03
actualizado: 2026-11-04
dependencias: [TASK-071]
---
## Objetivo

Defensa en dos capas: finish no mergea con la verificacion en rojo, y un hook impide al agente saltarse finish con un git merge directo.

## Criterios de aceptacion
- [x] taskctl finish ejecuta comando_verificacion antes del merge y aborta con la salida si falla; flag explicito para saltarlo que queda registrado en la tarea
- [x] Hook PreToolUse sobre Bash que bloquea git merge y los scripts de cierre de Git-Flow hacia develop o main cuando la verificacion esta en rojo
- [x] El hook no bloquea comandos de solo lectura ni merges hacia ramas de trabajo
- [x] Tests de ambas capas contra repos temporales reales

## Resultado

Implementado:
- **Capa 1, puerta en `finish`** (`src/commands/finish-verificacion.ts`): con `comando_verificacion`
  declarado, `finish` lo ejecuta siempre (D3: no reutiliza el memo) justo antes del primer efecto,
  en los dos caminos que integran algo (abrir el MR y el script de Git-Flow), y aborta con el
  informe si no sale en verde. Exige estar en la rama de la tarea. Si en verde deja el arbol sucio,
  aborta con mensaje propio. Tras verificar con el arbol limpio guarda el memo, que tiene la misma
  huella que el commit. No corre en el segundo `finish --merge-request` ni en el camino idempotente (D4).
- `--sin-verificacion` (en `FLAGS_FINISH`): no ejecuta y anota `## Verificacion omitida` en el cuerpo
  (`anotarVerificacionOmitida` en `core/transiciones.ts`), commiteado en la rama de la tarea ANTES del
  merge; sin `comando_verificacion` solo avisa.
- **Capa 2, guardian de merges**: `core/comando-merge.ts` (puro: segmenta el texto, detecta
  `git [-C d] merge` con destino por `checkout|switch` previo o la rama actual, los scripts
  `merge-*-to-*.sh` y el texto de `bash -c` / `pwsh -Command` / `cmd /c`), `hooks/guardia-merge.ts`
  (decision) y `hooks/pre-tool-merge.ts` (entrada: sin `merge` en el texto sale 0 sin cargar nada).
  Bloquea con exit 2 hacia `rama_base` o la principal sin verde guardado del commit fuente (D1:
  sin verde = no verde); deja pasar lo ya integrado (ancestro del destino, de main —backmerge de
  recuperacion— o de origin/<destino>). `huellaDeCommit` en `fs/verificacion.ts`.
- `hooks/hooks.json`: el `PreToolUse` sustituye a la sonda de TASK-069 y va sin filtro `if` (D2).
  `sonda-hooks.mjs` se conserva para los steps H2/H2b del CI, que la invocan directamente.
- README del plugin, CHANGELOG, `SKILL.md` de task-workflow, ayuda del CLI y `CLAUDE.md`.

Decisiones de Carlos en el plan: D1 el hook bloquea sin verde y el backmerge pasa por ser ancestro de
main; D2 sin filtro `if`; D3 `finish` ejecuta siempre; D4 la puerta solo antes de integrar.
Fuera de alcance: activar `comando_verificacion` en este repo (con los 3 rojos fijos de Windows el
salto seria lo normal).

Riesgos aceptados (plan y revision): la capa 2 es contra despistes, no contra un agente hostil (alias
de git, `git pull`, `git push . x:develop`, subshells `$(...)`); un hook roto falla abierto antes de
saber que el destino es protegido; «rojo» se mide sobre el commit fuente, no sobre el resultado del
merge; `finish` tarda lo que tarde la suite; el hook corre ante cada Bash/PowerShell (sale enseguida
sin `merge`); con la config ilegible el hook deja pasar (la puerta de `finish` sigue).

Verificacion:
- Suite completa 1758/1763: los 5 rojos conocidos de Windows (symlink EPERM, chmod de directorio,
  CRLF, 2 contrapruebas de descubrimiento).
- Tests nuevos contra repos Git temporales reales: `guardia-merge` (analizador, bloqueos, criterio 3
  concretado, backmerge, `rama_base`, entrada por stdin, `hooks.json`) y `finish-verificacion` (rojo,
  verde con memo previo, salto anotado, rastro si el script muere, arbol ensuciado, rama ajena,
  camino idempotente, sin comando, anotacion).
- Smoke con Claude Code real (2.1.318, `claude -p --plugin-dir` de la rama): el hook bloqueo
  `git checkout develop && git merge --no-ff -m prueba feature/x` antes de ejecutarse y el agente
  recibio el mensaje; el repo quedo intacto.

Revision por pares, 2 rondas:
- Ronda 1 (el revisor propuso `aprobada-con-correcciones`; registrada `cambios-solicitados` para
  corregir en automatico): MEN-1 (`bash -c` / `pwsh -Command` esquivaban el guardian), MEN-2
  (`git checkout <rama> <fichero>` sin `--` se tomaba por cambio de rama), MEN-3 (memo inutil con el
  arbol sucio): corregidos con tests. 2 mutantes muertos.
- Ronda 2 (`aprobada-con-correcciones`): las tres correcciones verificadas, 3 mutantes muertos. MEN-4
  aceptado sin corregir: `bash -o pipefail -c "..."` y `bash --rcfile f -c "..."` esquivan el
  guardian (`textoDeShell` corta en el primer argumento sin `-`); poco comun y la puerta de `finish`
  sigue siendo la red. Tambien queda sin documentar en README/CHANGELOG que se analiza `bash -c`
  (la nota no llego a aplicarse; lo escrito no es incorrecto). Ambos, candidatos a una tarea menor.

Coste de implementacion sin registrar: la hizo el orquestador sin subagentes y no hay cifra medida.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-04T17:56:19Z | plan | automatico | persona |
| 2026-11-04T18:06:30Z | approve | automatico | persona |
| 2026-11-04T18:06:39Z | start | automatico | persona |
| 2026-11-04T18:37:45Z | review | automatico | persona |
| 2026-11-04T20:22:04Z | review | automatico | persona |
| 2026-11-04T20:31:11Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-04T18:03:32Z | diseno | agente:ac9682a0042de6361,a680884679fa47780,a54f2c849f62e294e | 48 | 122362 | 520955 | 29908 | 33 | 673273 |
| 2026-11-04T20:05:18Z | revision | agente:a1e592650a3829f86 | 58 | 235615 | 3037738 | 10439 | 9 | 3283850 |
| 2026-11-04T20:30:17Z | revision | agente:add832a052d867744 | 26 | 98564 | 1111545 | 5699 | 0 | 1215834 |
