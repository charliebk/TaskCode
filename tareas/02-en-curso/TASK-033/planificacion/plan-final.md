# Plan — TASK-033: Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1)

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

- (arquitectura) Orden: 1) `config.ts`: `comando_sincronizacion` + `rutas_sincronizacion`, las dos o ninguna, validadas en `parsearConfig`; 2) `src/fs/sincronizacion.ts` aislado; 3) un único gancho en `autoCommit` antes del primer `git add`, rutas sumadas al commit `--only`; 4) `SKILL.md`; 5) 0.1.1 + CHANGELOG + clon de OpenGisViewer.
- (arquitectura, orquestador 1) Disparan los 8 llamadores de `autoCommit`; sin claves, cero spawns. Ejecución (arquitectura + riesgos 6-7, orquestador 4): `spawnSync` con `shell: true`, cwd raíz del repo, `stdin: 'ignore'`, timeout explícito, sin `cmdQuoteWindows`.
- (orquestador 2, sobre riesgos 1/3/5) Fallo idéntico en los 8: nunca se aborta la transición; (a) ruta declarada sucia antes → no se ejecuta; (b) exit≠0/timeout → rutas declaradas a HEAD; (c) rutas no declaradas tocadas → no se tocan y se nombran. En los tres casos la tarea se commitea y se avisa por stderr.
- (orquestador 5, 6, 7, 9) Solo documentación: conflictos en el derivado, seguridad del comando, «actualizar el plugin ANTES de añadir las claves», guía post-cierre sin tocar `src/`.

## Desacuerdos entre roles, y como se resuelven

- Semántica de fallo — arquitectura: abortar con `AutoCommitError` antes de cualquier `git add` / riesgos: commitear siempre la tarea, sin las rutas rotas — gana riesgos, en los 8 comandos como dice el orquestador — en `finish` abortar deja develop con el merge hecho y el reintento muere en `isWorkspaceClean` (finish.ts:334) y en `assertTransitionAllowed` (riesgos 1).
- Código de salida — orquestador: 0, «la transición se ha hecho» / riesgos: exit≠0 con aviso — gana riesgos y **me aparto del orquestador** — criterio 4: un agente o un script mira el exit, no el stderr. El aviso tiene que decir que la transición YA se hizo y que no se reintente.
- Ruta declarada con cambios previos — riesgos 3: abortar antes de lanzar la sync / orquestador 2(a): no ejecutar, commitear la tarea, avisar — gana orquestador — abortar dentro de `autoCommit` en `finish` reproduce el riesgo 1 del propio rol riesgos; sale ≠0 igual que (b). Se aparta de riesgos y lo digo.
- Detección de rutas no declaradas — arquitectura: diff de `git status --porcelain` antes/después / riesgos 5: con árbol sucio porcelain no basta (un ` M` sigue igual), comparar contenido — gana riesgos — start/review/finish no tienen guard; arquitectura lo deja como suposición no verificada.
- Momento de validar rutas — arquitectura: `normalizarRuta` en `autoCommit` / riesgos 4: en `parsearConfig`, solo ficheros, nunca `tareas/` ni `.taskcode/` — gana riesgos (orquestador 3 igual) — en `autoCommit` llega tarde: tarea movida y sync ya ejecutada. `normalizarRuta` queda como segunda barrera.
- Sync en `start`/`review` — riesgos: fabrica conflictos en cada merge; no sincronizar en rama o re-sincronizar tras el merge / arquitectura: los 8 — gana arquitectura — el criterio 1 exige start y review. Ningún rol pidió new/import/plan/codex-review; los añade arquitectura (sync-plan.mjs lee titulo/dependencias).

## Riesgos aceptados y que los contiene

- Conflicto en las líneas de recuento del derivado en los merges de review/finish; en finish deja develop con un merge a medias. «Es un problema nuevo que fabrica el plugin» — riesgos 2 — solo `SKILL.md` (regenerar, add, continuar); nada en código lo contiene.
- Una rama que cambie `.taskcode/config.yml` ejecuta su comando en la máquina de quien hace `finish`; viaja con el clon — riesgos — solo aviso en `SKILL.md` (orquestador 6).
- Si la sync toca rutas no declaradas, el workspace queda sucio y el SIGUIENTE comando aborta en la §8.3, que es el síntoma que la tarea arregla — riesgos 5 — aviso con nombres y exit≠0; el guard actúa como fallo cerrado.
- Al matar `cmd.exe` por timeout en Windows sigue vivo el `node` nieto — riesgos 6 — releer y restaurar las rutas declaradas después de matar el proceso.
- Sintaxis POSIX que falla solo en Windows; `%VAR%` se expande siempre — riesgos 7 — documentar `node <script>` y entrecomillar si lleva `#` (orquestador 4).
- Un plugin 0.1.0 aborta TODOS sus comandos con las claves nuevas, `board` incluido — riesgos — CHANGELOG y aviso (orquestador 7).

## Plan de pruebas

- `approve → start → review` encadenados sin commits manuales: derivado en `git show --name-only HEAD` de cada commit y `git status --porcelain` vacío tras cada paso — repo Git temporal real + script `node` que reescribe un fichero desde `tareas/` — criterios 1-2, arquitectura.
- `finish` con sync que va bien (derivado en el commit tras el merge, árbol limpio) y con sync que falla (tarea commiteada, derivado igual que HEAD, exit≠0, aviso de no reintentar) — repo real con rama y develop — riesgos 1.
- Contraprueba de exit≠0 y de timeout (script que duerme, timeout corto inyectable) más mutación: quitar el restaurado o el aviso tiene que poner el test en rojo — repo real — criterio 4, orquestador.
- Ruta declarada editada a mano antes de `start`: la sync no corre, el cambio ajeno ni entra en el commit ni se pierde del árbol — repo real — riesgos 3.
- El script toca un fichero no declarado, también uno que ya estaba ` M`: se nombra y no se commitea — repo real — riesgos 5.
- Config: errata en la clave, una sola de las dos, `.`, `../x`, carpeta, `tareas/x`, `.taskcode/x`, `#` sin comillas → aborta con la lista de claves válidas; sin claves, suite intacta y tests de «no mencionar» en verde — `parsearConfig` + suite — riesgos 4, arquitectura.

## Sin cubrir

- Contenido de la guía post-cierre (cómo se declara, cuándo y quién la verifica, dónde queda la evidencia): ningún rol lo trató — lo redacta quien implemente y el revisor lo contrasta con el §2 del objetivo.
- Verificación de extremo a extremo con `pnpm check:plan` en un clon de OpenGisViewer: ningún rol la planificó — se hace a mano en un clon desechable y la evidencia va al `Resultado`.
- Cómo se publica 0.1.1 y si el marketplace declara versión: ningún rol lo trató — pasa a decisión humana.
- Valor del timeout y si se configura: lo pidió el orquestador, pero ningún rol lo fundamenta — pasa a decisión humana; yo no fijo una cifra.
- Salidas que faltaron: ninguna, llegaron las dos. No se lanzó dominio porque la heurística dio complejidad media (2 roles), así que nadie ha mirado el flujo de la persona.

## Suposiciones no verificadas

- `deps.repoCwd` es la raíz del repo en los 8 comandos; `start` sincroniza en la rama y `finish` en develop después del merge — arquitectura, riesgos — leer los 8 comandos.
- `  - ruta` (lista en bloque) aborta en vez de ignorarse; «solo ficheros» se puede validar sin que la ruta exista — arquitectura, riesgos 4 — test en `parsearConfig`.
- El `#` sin comillas trunca el comando sin error (frontmatter.ts:183) — riesgos — test; si se confirma, solo se documenta (orquestador 4).
- «Sincronizar a mano ya producía el mismo conflicto» — orquestador, contra riesgos («problema nuevo que fabrica el plugin») — reproducir con dos tareas vivas.
- El hook de pre-commit de OpenGisViewer no reintroduce el `MM`, y la salida del script no rompe las salidas parseables — riesgos — probar en el clon.
- Un plugin 0.1.0 aborta con las claves nuevas — riesgos — ejecutar 0.1.0 contra un config nuevo.

## Lo que necesita decision de una persona

**Resuelto por Carlos el 2026-10-03, al aprobar:**

- Código de salida: **distinto de 0** cuando la sincronización no se aplica
  (casos a, b y c). El aviso dice que la transición YA se hizo, que no se
  reintente y qué comando lanzar a mano.
- Timeout: **60 s por defecto, configurable** con una tercera clave opcional
  `timeout_sincronizacion` (entero ≥ 1, en segundos). Solo es válida si
  están las otras dos.
- Publicación: **tag anotado `v0.1.1` sobre el merge de TASK-033 en
  develop**, subido a origin. `main` no se toca.
- Plan aprobado entero, aceptando el riesgo 2 (conflictos en el fichero
  derivado) solo con documentación.

Lo que se planteó:

- Semántica de fallo con exit≠0 (riesgos) frente a 0 (orquestador). Es contrato público y caro de cambiar; el unificador eligió, pero no lo cierra.
- El valor del timeout y si se puede configurar: ningún rol aportó datos para fijarlo.
- La publicación: tag `v0.1.1` sobre el merge en develop (propuesta del orquestador) o release a `main`. Lo dejó abierto la tarea, no lo trató ningún rol y `v0.1.0` no refleja develop.
- Aprobar el plan entero con `taskctl approve`, aceptando el riesgo 2 sin mitigación en código. Nada se implementa antes de esa aprobación.
