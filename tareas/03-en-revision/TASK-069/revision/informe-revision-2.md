# Informe de revision — TASK-069 (ronda 2)

- Commit revisado: 382a03f03703f405c18eded3bc0383bd113bb539
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer (aedebfdb5cfde4998)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs (regex de `decidir`) | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs (entrada JSON `null`) | implementacion |
| MEN-2 | MENOR | corregido (parcial, ver MEN-5) | taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh | implementacion |
| MEN-3 | MENOR | aceptado | .github/workflows/ci.yml, step H2b | plan |
| MEN-4 | MENOR | corregido | docs/spikes/TASK-069-resultado.md | plan |
| MEN-5 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh (mutantes que aun sobreviven) | implementacion |
| MEN-6 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs (limites de la regex) y docs/spikes/TASK-069-resultado.md | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Opinión del revisor: «aprobada-con-correcciones». Sin críticos ni importantes abiertos; los
hallazgos nuevos son MENORES y no bloquean el cierre. MEN-5 y MEN-6 quedan aceptados (sonda inerte
que TASK-071/072 sustituyen) y se documentan en el `## Resultado` de la tarea.

## Estado de los hallazgos de la ronda 1

- **IMP-1 corregido.** Regex `\bgit(?:\s+-C\s+\S+)*\s+merge(?![\w-])`. Con `pre2`: rc=0 para `git merge-base a b`, `git merge-tree a b`, `git mergetool`, `git -C x merge-base a b` y `git merge_foo`; rc=2 para `git merge x`, `git  merge`, `git merge;ls`, `git -C x merge f`, `git -C x -C y merge` y `cd x && git merge y`. Mutantes: `(?![\w-])` → `\b` o `(?!\w)` ponen el test en rojo; quitar la parte `-C` también.
- **MEN-1 corregido.** `null`, `5`, `"a"`, `[]`, `[{...}]` y `true` dan rc=0 con «no es un objeto JSON»; entrada vacía rc=0 con «no es JSON». `tool_input` nulo, `command` numérico o array: rc=0. Quitar `!entrada ||` pone el test en rojo.
- **MEN-2 corregido en lo pedido.** Quitar `&& evento === 'PreToolUse'` en pre2: 1 fallo («pre2 ignora un evento Stop»). Vaciar `if (!modo) process.exit(0)`: 2 fallos (stderr vacío en el caso inerte). Quedan otros supervivientes: MEN-5.
- **MEN-3 aceptado de forma razonable.** H2b sigue con `continue-on-error: true`; anotado en el documento del spike. Sin verificar (`cmd.exe` no ejecutable de forma no interactiva desde el entorno del revisor): mirarlo en el primer CI de Windows.
- **MEN-4 corregido.** H1 «CONFIRMADA en local (Windows), pendiente CI Linux»; H2 Linux aclara que los 12 casos son anteriores a la ronda 2; limitaciones del filtro, de opciones globales de git y del BOM de PowerShell 5.1 añadidas a «Implicaciones».

## Hallazgos nuevos (todos MENORES)

**MEN-5 — mutantes que sobreviven.** Con la suite de la sonda (16 «ok»):
- Quitar `&& evento === 'Stop'` en `stop2`: bloquearía cualquier evento; ningún test manda un `PreToolUse` en modo `stop2`.
- Quitar `typeof entrada !== 'object'` o `Array.isArray(entrada)`: comportamiento equivalente (solo cambian las `claves` del registro); guard defensivo sin efecto observable.
- `salida: decision.codigo` → `salida: 0` en el registro: nadie comprueba el contenido del registro.
- Sugerencia opcional: `caso "stop2 ignora un evento PreToolUse" 0 stop2 "$MERGE"` y comprobar el campo `salida` del registro.

**MEN-6 — límites de la regex no recogidos del todo.**
- No bloquean (rc=0): `git -C "a b" merge x`, `git --no-pager merge`, `git.exe merge x`, `GIT merge`.
- Falsos positivos residuales (rc=2): `git merge.ff`, `echo git merge`.
- Aceptable para una sonda inerte; conviene que la lista de limitaciones de «Implicaciones para TASK-071/072» los recoja.

## Reproduccion

- Clon temporal en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-069-r2`, HEAD cea2637, Windows nativo, node v22.23.4. Por un error del script del revisor, el clon se creó primero dentro del repo (`repo/`, sin tocar ficheros versionados); se movió a la ruta correcta y después se borró la carpeta entera. El repo original quedó limpio (`git status` sin salida).
- `bash hooks/test/sonda-hooks.test.sh`: 16 «ok», «TODO OK», rc=0.
- 15 mutantes sobre `hooks/sonda-hooks.mjs`, restaurando el original tras cada uno: 11 muertos, 4 supervivientes (los de MEN-5).
- Entradas límite a mano: ver IMP-1 y MEN-1. `git\nmerge x` con salto de línea bloquea (rc=2, correcto).
- Alcance: el diff desde 8919959 son 3 ficheros (sonda, test y documento del spike); nada que lea la suite del plugin.

## Que no se ejecuto

- La suite completa (ronda 1: 1607/1613, rojos ajenos; el cambio no toca nada que ella lea).
- Los steps de CI en Linux y en Windows (H2b incluido) y el guion manual H3–H6, que siguen «PENDIENTE».
- La confirmación en Linux de los 16 casos: solo hay evidencia en Windows nativo para la versión nueva del test.
