# Auditoría externa de TaskCode

> Hecha el 2026-11-13 por un agente sin el contexto de las sesiones de
> TaskCode, con el encargo de buscar solo lo negativo y tratar la
> documentación del repo como afirmaciones del autor por comprobar. Texto del
> agente sin retocar. Comprobado después en el código por quien lo encargó:
> H1 (`esPlantilla` solo lo usa la decisión de alcance de `review`, no
> `finish`), H4 (`resume-work.sh` hace `stash pop` sin `"$stash_ref"`) y H5
> (`approve` anota `persona` por defecto).

## Veredicto en tres preguntas

1. **¿Lo usarías tú?** No. Las dos garantías que vende, la revisión por pares obligatoria y la aprobación humana, no las impone el código. Las pruebas aquí descritas las ejecuté en un repo temporal. Cerré una tarea entera con el informe de revisión sin rellenar: «Revisor: (rellenar por el agente)» y la fila de ejemplo de la tabla. El veredicto era «aprobada» y las aprobaciones quedaron anotadas como «persona» sin que interviniera ninguna. Si encima pago ~190 ms de hook en cada lectura de fichero, 27 comandos y 32 claves de configuración, el coste no compensa unas garantías que no existen.
2. **¿Lo recomendarías a un equipo?** No, tal como está. Para considerarlo harían falta tres cosas: IDs de tarea que no colisionen entre clones, un estado de las tareas visible desde la rama de integración y que `finish` rechace un informe que siga siendo la plantilla. Además, quien tenga permiso de escritura en el repo no debería poder ejecutar comandos en las máquinas de los demás a través de `.taskcode/config.yml`. Hoy dos personas que crean una tarea a la vez acaban en un conflicto add/add sobre `tarea.md` y `ROADMAP.md`.
3. **¿Puede llevar un proyecto grande con calidad profesional?** No. El estado vive repartido por las ramas y el tablero de `develop` miente. Los artefactos generados (ROADMAP, BOARD, INDEX, CHANGELOG) se reescriben en cada fase y chocan entre ramas paralelas. Los frenos son de honor: `--aceptar-sin-revisar` y `--sin-verificacion` los puede pasar el propio agente, y el guardián de merges solo detecta el texto literal `git merge`. Y el propio proyecto (≈40 k líneas de TS, 1312 referencias a TASK-NNN en comentarios, 2236 commits en ~70 días) cambia más deprisa de lo que un equipo puede absorber.

## Hallazgos

| ID | Severidad | Área | Resumen | Evidencia | Verificado |
|---|---|---|---|---|---|
| H1 | CRÍTICO | Corrección / proceso | La revisión obligatoria se salta: `veredicto aprobada` sobre el informe plantilla y después `finish` integra sin quejarse | `src/commands/finish.ts` no usa `esPlantilla` (que existe en `src/core/informe-revision.ts:293`); repro E2E abajo | sí |
| H2 | CRÍTICO | Seguridad | El hook `Stop` ejecuta `comando_verificacion` de `.taskcode/config.yml` del árbol al final de cada turno, sin preguntar ni pedir confianza. Una rama o PR maliciosa ejecuta código en la máquina de quien la revisa | `src/hooks/freno-stop.ts:181,301`; `src/fs/ejecucion-acotada.ts:51` (`shell: true`); repro: `echo PWNED > pwned.txt` se ejecutó | sí |
| H3 | CRÍTICO | Equipo | Los IDs secuenciales se calculan en local sin reserva: dos clones generan el mismo TASK-NNN y el pull da conflicto add/add en `tarea.md` y en `ROADMAP.md`; después `doctor` marca la tarea como ilegible | repro ana/beto abajo | sí |
| H4 | ALTO | Corrección / datos | `resume` aplica el stash equivocado: localiza el de la rama pero ejecuta `git stash pop` sin referencia (saca `stash@{0}`, que es de otra rama), y además lo anuncia como el correcto. El grep `"pause: $NAME"` también casa por prefijo | `scripts/gitflow/resume-work.sh:89-96`; repro abajo | sí |
| H5 | ALTO | Proceso | La aprobación humana no se puede comprobar: `approve` registra `decidido_por: persona` por defecto aunque lo ejecute el agente | `src/commands/approve.ts:285` | sí |
| H6 | ALTO | Proceso | El agente puede saltarse revisión y verificación pasando `--aceptar-sin-revisar --sin-verificacion` a `finish`; ningún hook lo impide, solo queda una anotación | repro: integró código no revisado con la verificación en rojo (fichero `ROTO`) | sí |
| H7 | ALTO | Equipo | El tablero en `develop` miente: `start` y `review` mueven la tarea solo en la rama feature, y `board` no mira otras ramas. Con la tarea en curso, `develop` la mostraba «En diseño» | `src/commands/board.ts` (sin `ls-tree`/`for-each-ref`); repro abajo | sí |
| H8 | ALTO | Equipo / escala | `new`, `plan`, `approve` y `finish` commitean `ROADMAP.md` (y `finish` también BOARD, INDEX y CHANGELOG) en develop: conflictos recurrentes con varias personas | conflicto `UU tareas/ROADMAP.md` en el repro H3 | sí (ROADMAP); BOARD/CHANGELOG sin verificar |
| H9 | MEDIO | Seguridad / proceso | El guardián de merges solo detecta `git merge` literal. `git pull . rama`, `reset --hard`, `cherry-pick`, `branch -f`, `update-ref`, `push . a:develop` y `git -c x=1 merge` pasan | `src/hooks/guardia-merge.ts:55-75`; probe: 8 de 10 variantes con exit 0 | sí |
| H10 | MEDIO | Corrección | Falso positivo del guardián: en `git merge ... rama 2>&1` toma `2>` como rama fuente y bloquea. Además evalúa contra el `cwd` de la sesión, no contra el repo al que hace `cd` el comando: me bloqueó un merge en un repo temporal usando la config de TaskCode | probe2 (exit 2 «"2>" entraria en develop»); bloqueo real en esta sesión | sí |
| H11 | MEDIO | Parser | El frontmatter escrito no es YAML válido: escapa `"` pero no `\`. Un título `C:\ruta` es `C:<CR>uta` para PyYAML, y un título acabado en `\` rompe el parser (ScannerError) | PyYAML sobre `tarea.md` generado por `taskctl new` | sí |
| H12 | MEDIO | Robustez | `finish` no es atómico: si el commit de cierre falla tras el merge, quedan el merge hecho y los ficheros preparados; al reintentar dice «ya esta terminada» | repro con hook `commit-msg` que rechaza | sí |
| H13 | MEDIO | Proceso | La puerta de `approve` solo compara con la plantilla: un plan con «Hacer algo.» y las secciones de riesgos y pruebas vacías se aprueba, aunque el mensaje de error pide «enfoque, riesgos, pruebas» | `src/commands/approve.ts:193-203` | sí |
| H14 | MEDIO | Rendimiento | Los hooks son globales: `PreToolUse` lanza `node` en cada Read/Edit/Grep/Glob de cualquier proyecto (~190 ms en Windows) y `coste-turno` en cada Stop/SubagentStop (~250 ms) | medido, 10 ejecuciones | sí |
| H15 | MEDIO | Usabilidad | El freno Stop puede bloquear el turno hasta 3600 s ejecutando la suite al final de cada turno con tarea en curso | `hooks/hooks.json` (`timeout: 3600`), `freno-stop.ts` | sí (lectura) |
| H16 | MEDIO | Multiplataforma | `comando_verificacion` se ejecuta con `cmd.exe` en Windows y `sh` en Linux: un mismo comando del repo se comporta distinto según quién lo ejecute | `src/fs/ejecucion-acotada.ts:30,51` | sí (lectura) |
| H17 | MEDIO | Usabilidad | Las carpetas de estado vacías no se versionan: en todo clon recién hecho `doctor` da ERROR «a tareas/ le faltan 01-en-diseno...» y «Corrige los errores antes de trabajar», aunque `plan` funciona | clon `beto` | sí |
| H18 | MEDIO | Adopción | Superficie enorme: 27 comandos, 32 claves de config (6 comandos de verificación distintos), `--help` de 131 líneas, ~346 KB de SKILL.md y anexos que el modelo carga | `src/core/config.ts:386`, `taskctl --help \| wc -l` | sí |
| H19 | MEDIO | Coste | Datos del propio autor: tareas «simple» de 45-60 min de punta a punta; 89 de 118 terminadas sin registro de coste (el sistema de coste no se usa ni en casa) | `taskctl metricas` sobre el repo | sí |
| H20 | MEDIO | Mantenibilidad | Módulos de 1100-1500 líneas (`config.ts` 1474, `review.ts` 1346, `cli.ts` 1298, `finish.ts` 1239) y 1312 referencias TASK-NNN o «decisión de Carlos» en comentarios de `src/` | `wc -l`, `grep -ro TASK-` | sí |
| H21 | BAJO | Dependencia | Lee transcripciones internas de Claude Code (`~/.claude/projects/*/subagents/agent-*.jsonl`), un formato no documentado. La escalera de modelos `opus/sonnet/haiku` está fija en el código | `src/fs/coste-automatico.ts:79-92`, `src/core/modelo-revision.ts:12` | sí (lectura) |
| H22 | BAJO | Salida | Los scripts bash emiten códigos ANSI de color aunque la salida no sea un TTY: ruido en el contexto del agente | salida de `start`/`review`/`finish` | sí |
| H23 | BAJO | Fechas | `creado`/`actualizado` y la fecha del CHANGELOG van en UTC: a las 21:01 hora local (UTC-3) dejó 2026-11-14 | `tarea.md` generado | sí |
| H24 | BAJO | Build | `package-lock.json` desincronizado de `package.json`: `npm install` lo modifica (añade `license`). Restaurado con `git checkout --` | `git diff` tras `npm install` | sí |
| H25 | BAJO | Docs | CLAUDE.md dice «~750 tests» en `test:rapido` (medidos: 632). `docs/METRICAS.md` está congelado en el Sprint 1 (2026-09-05) con el proyecto en TASK-134 | ejecución y lectura | sí |
| H26 | BAJO | Higiene | Un spike (TASK-110) dejó `"echo TASK-110 · prueba de status line"` como status line en el `~/.claude/settings.json` global del autor | `doctor`, `settings.json` | sí (no tocado) |
| H27 | BAJO | Diseño | `dist/src` está versionado: obliga a un guard de CI y genera conflictos de build entre ramas del propio plugin | `.gitignore`, `.github/workflows/ci.yml` | sí (lectura) |

### Detalle de CRÍTICOS y ALTOS

**H1. La revisión por pares se puede cerrar sin revisor.**
- **Qué pasa:** `veredicto` solo escribe la línea `- Veredicto:`. `finish` acepta el informe aunque siga siendo la plantilla, cuando la función `esPlantilla` ya existe y solo la usa `review` para decidir el alcance de la ronda siguiente.
- **Reproducción:** `new` → `plan` → rellenar una línea del plan → `approve` → `start` → commit → `review` → `veredicto TASK-001 aprobada` → `finish TASK-001`. Exit 0, merge en develop. El informe en `04-terminadas` conserva «Revisor: (rellenar por el agente)» y la fila «(ej. IMP-1)».
- **Impacto:** la promesa central del producto es falsa. Un agente con prisa o barato cierra tareas sin revisión y la auditoría lo da por revisado.
- **Sugerencia:** `veredicto` y `finish` deben fallar si `esPlantilla()` o si falta `informeRellenado()`. Exigir además un rastro verificable de la revisión, por ejemplo el id de subagente del revisor, cotejable con su transcripción.

**H2. Ejecución de código arbitrario desde la config del repo.**
- **Qué pasa:** con `tareas/02-en-curso/X/tarea.md` cuya `rama` coincide con la rama actual, el hook Stop ejecuta `comando_verificacion` con `shell: true` al terminar cada turno.
- **Reproducción:** repo con `comando_verificacion: "echo PWNED > pwned.txt"` y la tarea en curso. Hice `checkout` de `feature/x` y pasé por stdin al hook el JSON `{"cwd":...}`: exit 0 y `pwned.txt` creado. Lo mismo vale para `comando_sincronizacion` y el resto de `comando_*`.
- **Impacto:** revisar la rama o el PR de otra persona con Claude Code y el plugin activo ejecuta su comando. Es el mismo problema que los hooks de git, pero sin la protección de que `.git/hooks` no se versiona.
- **Sugerencia:** un fichero de confianza fuera del repo (por ejemplo `~/.taskcode/trusted.json` con el hash de la config), con una confirmación explícita la primera vez y cada vez que cambien los `comando_*`.

**H3. IDs que colisionan entre clones.**
- **Reproducción:** `git clone` del mismo origen en dos carpetas, `ana` y `beto`. Los dos ejecutan `taskctl new ... --push`. Ana sube TASK-003. Beto también genera TASK-003 y su push se rechaza. `git pull` da `CONFLICT (add/add)` en `tareas/00-planificadas/TASK-003/tarea.md` y `UU tareas/ROADMAP.md`, y `doctor` responde `tarea:TASK-003:ilegible`.
- **Impacto:** con más de una persona pasa a diario, y deshacerlo a mano exige renombrar carpeta, `id`, rama y referencias.
- **Sugerencia:** IDs no secuenciales (prefijo de autor o hash corto), o reservar el ID con un push atómico a origin antes de escribir, con reintento.

**H4. `resume` mezcla trabajo de ramas distintas.**
- **Reproducción:** stash «pause: feature/a» y luego stash «pause: feature/b». `taskctl resume feature/a < /dev/null` imprime «Stash encontrado: stash@{1} ... feature/a», pero el árbol de `feature/a` queda con `b.txt`, y en la lista queda el stash de `feature/a`.
- **Impacto:** cambios de otra tarea aplicados en silencio. Sin terminal interactiva lo hace sin preguntar.
- **Sugerencia:** `git stash pop "$stash_ref"` y grep anclado con `grep -F -- "pause: $NAME "` (con espacio final). Falta un test con dos stashes.

**H5 y H6. Los frenos los puede saltar el propio agente.**
- **Qué pasa:** `approve` registra «persona» por defecto. `finish --aceptar-sin-revisar --sin-verificacion` integró código posterior a la revisión con la verificación en rojo. Solo quedó una nota en `tarea.md`.
- **Impacto:** las decisiones «de una persona» no se pueden distinguir de las del agente.
- **Sugerencia:** que estos flags exijan una confirmación por TTY o un token que solo da la persona. Que un hook PreToolUse bloquee estos flags cuando los invoca el agente. Y que `decidido_por` sea `agente` por defecto si no hay TTY.

**H7 y H8. El estado repartido por ramas y los artefactos generados chocan.**
- **Reproducción:** con TASK-003 en curso en su rama, `taskctl board` en develop la muestra en «En diseño (01-en-diseno)».
- **Impacto:** nadie del equipo ve el estado real desde la rama compartida, y ROADMAP, BOARD, INDEX y CHANGELOG se reescriben en cada fase, así que cualquier trabajo en paralelo produce conflictos.
- **Sugerencia:** guardar el estado fuera del árbol de trabajo (notas de git, una rama `taskcode-state` o el issue tracker). Que `board` agregue lo que hay en las ramas remotas. Y generar BOARD, INDEX y CHANGELOG solo al publicar, no en cada commit de fase.

## Problemas de adopción

- **Hay que leer mucho antes del primer día:** README del plugin de 18 KB lleno de conceptos («ronda acotada», «selectiva», «freno», «held-out», «verificar-menores», «trocear», «regla de una hora»), `--help` de 131 líneas y 32 claves de config.
- **Ningún cambio baja de 3-4 commits ceremoniales.** Cada tarea genera unos 6 commits `chore(TASK-NNN)` en develop y en la rama, y el historial se llena de ruido.
- **El turno se queda bloqueado** mientras la suite corre en el hook Stop (hasta una hora) cada vez que el agente termina con una tarea en curso.
- **Conflictos el primer día** en cuanto dos personas crean tareas (H3, H8).
- **El primer contacto ya da error:** en un clon nuevo `doctor` muestra ERROR (H17), y sin `develop` `new` falla con un mensaje sobre «conexion con origin» que no es la causa real.
- **Todo está en español, sin i18n**, incluidos los mensajes y la plantilla de commits sin tildes. Para equipos que no hablan español no sirve.
- **Coste de tokens:** el modelo carga skills de 15-22 KB por revisor más anexos (~346 KB en total). Según los datos del autor, una tarea simple tarda de 45 a 60 minutos.
- **La metodología cambia de versión cada pocos días** (0.8 → 0.16 en semanas, con reglas como `tope_rondas` que cambian de valor por defecto). Lo que se aprende hoy se queda viejo.

## Sugerencias priorizadas

1. **Que `veredicto` y `finish` rechacen un informe plantilla o sin revisor** (H1). Es barato, la función ya existe, y sin esto la revisión «obligatoria» es papel mojado.
2. **Confianza explícita antes de ejecutar cualquier `comando_*` de la config del repo** (H2). Hoy es ejecución remota de código vía PR.
3. **IDs de tarea sin colisión entre clones** (H3). Es el primer bloqueo de cualquier equipo.
4. **Arreglar `resume-work.sh` (`stash pop "$stash_ref"`, grep anclado) y añadir el test con dos stashes** (H4). Hoy corrompe datos en silencio.
5. **Que los flags de escape y `decidido_por` necesiten una persona de verdad** (TTY o token), con un hook que los bloquee si los pasa el agente (H5, H6). Sin esto, la trazabilidad no vale como auditoría.
6. **Sacar el estado de las tareas de las ramas, o agregarlo desde ellas en `board`, y no regenerar ROADMAP/BOARD/INDEX/CHANGELOG en cada fase** (H7, H8). Elimina conflictos y da visibilidad.
7. **Un guardián de merges basado en el resultado, no en el texto del comando** (H9, H10). Comprobarlo en hooks `pre-merge-commit`/`reference-transaction` de git, o validar en Stop que develop no ha avanzado sin verde, y resolver el repo desde el `cd` real.
8. **Reducir superficie:** unificar los 6 comandos de verificación en uno con perfiles, fusionar comandos poco usados (`verificar-lote`, `cadena`, `codex-review`) y dejar un modo «mínimo» documentado en una página (H18).
9. **Serializar el frontmatter con escapes YAML correctos** (o restringir los caracteres) y un test contra un parser YAML estándar (H11). Integrar con otras herramientas exige YAML real.
10. **Bajar el coste de los hooks globales:** un matcher más estrecho, salida inmediata sin lanzar Node cuando no hay `tareas/` (por ejemplo un wrapper en shell), y un tope del freno Stop de minutos, no de una hora (H14, H15).

## Lo que no pude verificar

- **La suite completa** (`npm test`, ~25 min): no la ejecuté. Tampoco que fallen exactamente los 2 tests de `plan.test.ts` en Windows ni la cifra de ~2170 tests.
- **El comportamiento en Linux y macOS:** todo se ejecutó en Windows 11 con Git Bash.
- **`finish --merge-request` contra GitHub o GitLab reales:** la suite usa un doble y yo no tengo credenciales, así que no lo probé.
- **Los conflictos concretos en BOARD, INDEX y CHANGELOG entre dos `finish` en paralelo:** solo reproduje el de ROADMAP.
- **La evasión del guardián held-out** (`aceptacion/`) con globs o rutas indirectas: no lo probé (requiere `comando_heldout`).
- **Que un kill a mitad de `start`/`review` (no un fallo de hook) deje estados recuperables:** solo probé el fallo del commit de cierre de `finish` y un conflicto en `review`. Este último se detuvo con un estado razonable.
- **El comportamiento real del hook Stop dentro de una sesión de Claude Code** (bucles, `stop_hook_active`): lo invoqué directamente con JSON por stdin.
- **La calidad de las skills revisoras como prompts** (si encuentran defectos reales): no lancé agentes revisores.
