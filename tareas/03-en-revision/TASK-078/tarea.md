---
id: TASK-078
titulo: "Hook que impide leer y editar los held-out de la tarea en curso"
tipo: feature
sprint: 0
etiquetas: [hooks]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-078-hook-que-impide-leer-y-editar-los-held-o
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 902198
tokens_implementacion: null
tokens_revision: 4192435
creado: 2026-11-04
actualizado: 2026-11-05
dependencias: []
---
## Objetivo

Segunda mitad de TASK-073 (depende de ella): que el agente que implementa una tarea no pueda leer ni editar sus tests held-out (carpeta aceptacion/) mientras trabaja en su rama, con un hook PreToolUse sobre herramientas de fichero y Bash/PowerShell.

## Criterios de aceptacion
- [ ] Hook PreToolUse con matcher Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob que sale 2 ante una ruta tareas/*/TASK-NNN/aceptacion/ de una tarea cuya rama es la actual, y 0 ante rutas hermanas (tarea.md, aceptacionX/)
- [ ] El guardian de Bash/PowerShell bloquea comandos cuyo texto nombra esa ruta (cat, Get-Content, git show rama:ruta)
- [ ] En otra rama (develop, durante el diseno) no bloquea: la persona puede escribirlos con Claude
- [ ] Rutas con mayusculas, barras invertidas, relativas o con .. se normalizan antes de comparar; Agent/Task fuera del matcher
- [ ] Tests contra el dist real por stdin y repos temporales; smoke con claude -p --plugin-dir con el exit 2 del hook visible

## Resultado

Segunda mitad de los tests held-out (TASK-073): un guardian `PreToolUse` impide al agente leer,
buscar o editar la carpeta `aceptacion/` de la tarea de la rama actual.

- `src/hooks/guardia-heldout.ts` (`decidirHeldout`) con dos entradas: `pre-tool-lectura.js`
  (matcher `Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob`, nuevo en `hooks/hooks.json`) y
  `pre-tool-merge.js` (Bash/PowerShell, ampliado: el primero que bloquea gana). Casado puro en
  `src/core/heldout.ts` (`numerosHeldoutEnRuta`, `numerosHeldoutEnTexto`): secuencia de segmentos
  `tareas/<estado>/task-NNN/aceptacion` en cualquier punto, tras normalizar `\`, mayusculas, `.`/`..`
  y resolver contra el cwd (o el `path` de Grep/Glob). Tipos y parser del JSON en
  `entrada-pretooluse.ts`, para no cargar el guardian de merges en cada Read.
- Decisiones de Carlos en el plan: (1) la tarea protegida sale del nombre de la rama actual
  (`numeroDeRama`), nunca de `tarea.md`, y con HEAD desacoplado de `rebase-merge/head-name`;
  (2) el remedio de `finish` sobre los held-out lo ejecuta la persona: el mensaje lo dice y el
  agente para; (3) sin interruptor (seguimiento).
- Riesgos aceptados, declarados en `skills/task-workflow/heldout.md`: Grep sobre la raiz, MCP de
  indice, cambiar de rama, `cd` previo, escapes del shell, formas de ruta de Windows (espacio/punto
  final, 8.3), ruta absoluta de otro worktree, y el falso positivo de un texto que solo cita la ruta.
- Smoke con Claude Code real (2.1.318, `claude -p --plugin-dir` de la rama, repo temporal en
  `feature/task-901-smoke`): `Read` del held-out -> `PreToolUse:Read hook error ... Bloqueado: esto
  nombra la carpeta aceptacion/ de TASK-901...`; `cat` por Bash -> `PreToolUse:Bash hook error` con
  el mismo mensaje; `Read` de `tarea.md` paso. El contenido del held-out no aparecio en la
  transcripcion. El revisor lo repitio con Read, Grep, Glob y Bash. Edit, Write, MultiEdit,
  NotebookEdit y PowerShell solo por stdin contra el dist.
- Suite completa 1800/1803: los 3 rojos conocidos de Windows (symlink EPERM, chmod de directorio,
  CRLF).

Revision por pares:
- Ronda 1 (el revisor propuso `aprobada`, sin CRITICO ni IMPORTANTE; registrada
  `cambios-solicitados` para corregir en automatico los MENOR baratos): MEN-1 y MEN-2 (formas de
  ruta de Windows y otro worktree) declarados en la skill como riesgo aceptado; MEN-3 (evidencia del
  smoke) en este Resultado; MEN-4 (relleno del ID en el mensaje) con test que mata el mutante;
  MEN-5 (errata y falso positivo) corregida y declarado. 13 mutantes muertos, 2 equivalentes.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-05T14:30:10Z | plan | automatico | persona |
| 2026-11-05T14:37:38Z | approve | automatico | automatico |
| 2026-11-05T14:37:51Z | start | automatico | persona |
| 2026-11-05T15:05:13Z | review | automatico | persona |
| 2026-11-05T15:44:18Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-05T14:37:13Z | diseno | agente:a33e65c96a79e4e53,a932a784f841e7ff6,a6fc0b58b60fd29ad | 58 | 121124 | 748853 | 32163 | 44 | 902198 |
| 2026-11-05T15:27:29Z | revision | agente:afeb190b32e8b73c1 | 64 | 148120 | 4022345 | 21906 | 7 | 4192435 |
