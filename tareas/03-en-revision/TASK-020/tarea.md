---
id: TASK-020
titulo: "Comando taskctl codex-review (segunda opinión independiente)"
tipo: feature
sprint: 3
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-020-comando-taskctl-codex-review-segunda-opi
asignado_a: charlie.bk@gmail.com
agente_revisor: typescript-reviewer
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-13
dependencias: [TASK-013]
---
## Objetivo

`revision_codex: true` en `tarea.md` ya está soportado por la máquina de
estados (`src/core/state-machine.ts`, caso `'codex-review'`: exige estado
`en-revision`, `revision_codex: true` y revisión primaria ya aprobada) y por
`taskctl finish` (`INFORME_CODEX_RE`, `informesDeLaRonda` ya reutilizada
desde TASK-018: exige que el informe de Codex también apruebe si
`revision_codex` está activo). Lo que falta es el propio comando: `cli.ts`
no enruta ningún subcomando `codex-review`, y no existe ningún
`src/commands/codex-review.ts` que invoque el CLI de Codex y escriba
`informe-codex-N.md`.

El CLI de Codex (`codex-cli`, de OpenAI) SÍ está instalado en esta máquina
(`codex --version` → `codex-cli 0.144.1`) y trae un subcomando hecho
justo para esto: `codex review --base <rama> [--commit <sha>]
[--title <texto>] [prompt]`, no interactivo, que revisa el diff contra una
rama base y admite instrucciones propias. Un `codex` ausente del PATH debe
degradar con un aviso, sin romper el flujo (criterio de aceptación 3) —
`taskctl` ya tiene precedente de esto con los scripts de Git-Flow
(`detect_origin_available` en `git.ts`, o el propio patrón de "avisa y
continúa en local" cuando no hay `origin`).

## Criterios de aceptacion
- [x] Solo se ejecuta si la revisión primaria ya está aprobada y la tarea tiene `revision_codex: true`.
- [x] Envuelve el CLI de Codex y guarda su salida en la carpeta de la tarea, sin mezclarla con la de la revisión primaria.
- [x] Si Codex falla por cualquier motivo (no instalado, `ENOENT`, o instalado pero con exit distinto de cero por auth/modelo/red/cuota — evidencia real: en esta máquina falla por incompatibilidad de cuenta/modelo), avisa y degrada con elegancia en vez de romper el flujo: `taskctl codex-review` sale con código 0, sin escribir `informe-codex-N.md`.
- [x] `informe-codex-N.md` vuelca la salida cruda de Codex como contexto (scaffold con veredicto `PENDIENTE`, mismo patrón que `informeTemplate` de la revisión primaria); un humano/agente la lee y escribe `- Veredicto: aprobada` o `- Veredicto: cambios-solicitados` — nunca se infiere del exit code de Codex, que no es una señal fiable (la propia evidencia de esta tarea lo confirma).
- [x] Si Codex se degrada y no llega a escribir informe, `revision_codex: true` sigue bloqueando `taskctl finish` fail-closed, sin excepción — la persona resuelve a mano (arregla/instala Codex y reintenta, o quita `revision_codex: true` si decide que esta tarea no necesita esa segunda opinión). El mensaje de `codex-review` deja claro por qué no se escribió informe.
- [x] Tests que cubren la precondición de estado, la ausencia del CLI (`ENOENT`) y un fallo con Codex presente pero con exit distinto de cero.

## Resultado

`src/commands/codex-review.ts` (nuevo) envuelve `codex review --base <rama>
--title "<id>: <titulo>"` (sin `--commit`: revisaría un commit puntual, no
el diff completo de la rama). No toca `state-machine.ts` ni `finish.ts`: ya
tenían el contrato cerrado desde antes (`INFORME_CODEX_RE`,
`informesDeLaRonda`, `revisionCodexAprobada`). `runCodexReview` (`fs/git.ts`)
nunca lanza excepción, ni por ausencia del binario ni por exit≠0: decisión
de Carlos, con evidencia real (en esta máquina `codex` falla por
incompatibilidad de cuenta/modelo, no por el diff), es que todo fallo
degrada igual — avisa, sale con código 0, sin escribir informe. Cuando
Codex sí responde, su salida cruda se vuelca en `informe-codex-<ronda>.md`
con veredicto `PENDIENTE`: un humano/agente lo certifica después, nunca se
infiere del exit code.

**3 rondas de revisión por pares, cada una por un agente distinto e
independiente del resto**:

- **Ronda 1: cambios-solicitados** (1 IMPORTANTE, 2 MENOR). El revisor
  reprodujo contra el `codex` real de esta máquina que `runCodexReview`
  nunca llegaba a invocarlo: `spawnSync('codex', args)` sin `shell: true`
  no resuelve el `codex.cmd` que instala npm en Windows y devuelve `ENOENT`
  siempre, diagnosticando "no instalado" cuando sí lo estaba. Corregido con
  `shell: true` solo en `win32` + escapado manual de argumentos para
  `cmd.exe`. Al verificar la corrección apareció un segundo bug no detectado
  por la ronda 1: `codex review --base <rama>` no admite combinarse con un
  PROMPT propio (conflicto real del CLI, confirmado empíricamente) — se
  quitó el prompt personalizado; el análisis lo hace `codex review` con su
  comportamiento por defecto.
- **Ronda 2: cambios-solicitados** (1 IMPORTANTE nuevo). El escapado para
  `cmd.exe` envolvía en comillas, pero eso no evita que `cmd.exe` expanda
  `%NOMBRE_DE_VARIABLE%` — un título de tarea con la forma `%USERNAME%`
  llegaba a Codex con el valor **real** de esa variable de esta máquina
  sustituido en su lugar (filtración de datos locales hacia una llamada de
  red externa). Verificado que doblar `%%` (el truco de los ficheros
  `.bat`) no aplica a una invocación externa de `cmd.exe /c`. Corregido
  eliminando el carácter `%` en vez de intentar escaparlo.
- **Ronda 3: aprobada con menores documentados**, sin críticos ni
  importantes. Confirmó con reproducción propia (tres nombres de variable
  distintos, y contraprueba revirtiendo el fix) que las dos correcciones
  anteriores se sostienen. Único hallazgo nuevo: un `%` literal legítimo en
  un título (p. ej. "mejora un 30%") también se pierde, sin distinguir
  "variable de entorno real" de "texto suelto" — juzgado un trade-off
  razonable (efecto cosmético en un argumento informativo, frente a la
  fuga de datos real que evita), documentado en el propio comentario de
  `cmdQuoteWindows`.

**Verificado en esta sesión** (además de lo que certificaron los 3
revisores): `runCodexReview` invocado directamente contra el `codex` real
de esta máquina da `lanzado: true, code: 1` (el fallo real de cuenta/modelo
documentado, no `ENOENT`).

868 tests (865 verdes; los 3 rojos son los conocidos de Windows nativo:
symlink EPERM, chmod sobre directorio en NTFS, y CRLF — ninguno tocado por
esta tarea).
