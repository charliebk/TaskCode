# Plan — TASK-110: Progreso visible sin tokens: estado de cada fase en el terminal

(Lo consolida el agente unificador a partir de 3 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos, testing.
Los desacuerdos entre roles se señalan, no se promedian.
Se lanzaron 3 roles porque la complejidad declarada es alta y la heurística da simple: se toma el mayor.
Incorpora una indicación de la persona (Carlos) llegada tras el brainstorm, que ningún rol vio; va atribuida a él.)

## Enfoque propuesto

Duracion estimada: 360 min (de la rama abierta al cierre con merge, tarea entera; señales: unos 16 ficheros de código de producción previstos por arquitectura, más de 11, el tramo en que solo 1 de cada 6 tareas cierra en una hora; 5 capas: core, fs, commands, hooks y herramientas de test; 8 criterios; histórico del repo: 55 min estimados acabaron en 2-4 h, y cada ronda de revisión cuesta 20-50 min).

- **Entregable principal (Carlos)**: el estado se ve **dentro de Claude Code mientras se trabaja**, en la status line, sin abrir otro terminal ni ejecutar nada por tarea; «si no sale en el prompt de Claude mientras estamos trabajando, no sirve de mucho». La instalación es **una vez**, válida para todas las tareas y proyectos (Carlos). `taskctl estado --seguir` pasa a secundario.
- **Idea principal (Carlos, tras leer el plan)**: «que este mensaje no consuma tokens y que el usuario esté siempre informado de lo que falta por fases y dentro de las subfases». Consecuencias:
  - **Cero tokens**: escribir el progreso **no añade salida** (stdout/stderr) a ningún comando ni hook que lance el agente; solo lo lee la status line, que no entra en el contexto del modelo. Se fija con un test por comando que compara su salida con y sin progreso.
  - **Lo que falta, en dos niveles**: la línea muestra la posición en las fases del ciclo y, dentro de la fase, el subpaso actual con su x/N y su nombre. Ejemplo: `TASK-110 · review (4/5) · ronda 2 · verificación 7/22 · 12 min`, y en `finish` sus subpasos propios (puertas, verificación, cobertura, held-out, merge, artefactos). Cada comando declara su lista de subpasos para que N se conozca desde el inicio. Afecta a A (formato) y a B1/B2 (listas de subpasos).
- **Primero, comprobación obligatoria (Carlos)**: Carlos trabaja sobre todo en la app de escritorio de Claude (pestaña Code) y por Remote Control; no está comprobado que la `statusLine` de `settings.json` se muestre ahí. Si no se muestra, se reabre el diseño con la persona antes de seguir.
- Se crean `src/core/progreso.ts` (puro: tipo, validar, `formatearEstado`) y `src/fs/progreso.ts` (`rutaProgreso` sin git, que sube hasta `.git` y sigue `gitdir:`; la comparten escritor y lector), y `src/commands/estado.ts` con vía rápida en `bin/taskctl`, sin importar el grafo de `cli.ts` ni `fs/git.ts` — arquitectura.
- Se extienden plan, approve, start, review, finish, `finish-verificacion.ts` y `freno-stop.ts` con `deps.progreso` (`fase`/`paso`/`terminar`), `doctor.ts` + `json-claude.ts` con un escritor de `statusLine`; `TASKCTL_PROGRESO` apunta a `.git/taskcode/progreso-contador`; el reporter `test/reporter/progreso.ts` va junto a `spec` y guarda el total en `.git/taskcode/suite-total.json` — arquitectura.

### Partición propuesta (pasa de 60 min; decide la persona en approve)
0. **S — Spike: ¿se ve la status line en la app de escritorio (pestaña Code) y por Remote Control?** Sin criterios de la lista; resultado escrito, sin código de producción. Va primero y condiciona todo lo demás (Carlos; `duracion.md`: lo que hay que investigar va antes, en su propia tarea corta). Si no se ve, la alternativa a evaluar es la salida de hooks visible para la persona (indicación del coordinador), y el diseño se reabre con Carlos.
1. **A — Contrato y lector**: `core/progreso`, `fs/progreso`, `taskctl estado` (sin `--seguir`) con vía rápida. Criterios 2, 7, 8. Depende de S. Pruebas 5 y 6 de testing.
2. **D — Status line en doctor**: instalación única con flag explícito, sin pisar una existente. Criterios 5 y 8. Depende de A. Sube de orden por ser el entregable principal (Carlos).
3. **B1 — Escritores simples**: plan, approve, start. Criterios 1 (esos tres) y 8. Depende de A.
4. **B2 — Escritores del camino crítico**: review, finish, freno Stop, con escritura que nunca lanza (riesgos). Criterios 1 (el resto) y 8. Depende de A.
5. **C — Contador `TASKCTL_PROGRESO`**: inyectado en `finish-verificacion` y freno Stop. Criterios 4 y 8. Depende de B2.
6. **E — Reporter de `npm test`**: `[x/N]` y total anterior. Criterios 6 y 8. Sin dependencias (si escribe en `TASKCTL_PROGRESO`, después de C).
7. **F — `estado --seguir`**: criterio 3. Prescindible o para una tarea posterior (Carlos lo deja en secundario); ver Decisiones (d).

## Desacuerdos entre roles, y como se resuelven

- Canal de x/N — arquitectura: contador aparte, leído por `estado` junto al JSON / criterio 2 literal: «leyendo solo ese fichero» — sin resolver aquí: va a Decisiones (a). Testing confirma el bloqueo de `spawnSync` (comprobado) que impide que el padre copie el x/N.
- `--seguir` sin TTY — riesgos: sin TTY imprime una línea o se niega, porque el agente lo lanzaría y gastaría tokens / testing: la prueba 7 lo lanza como subproceso sin TTY y exige que refresque — sin resolver entre ellos; la indicación de Carlos lo vuelve secundario: Decisiones (d).
- La suite de TaskCode como primer cliente de `TASKCTL_PROGRESO` — arquitectura: lo es, lanzada desde `finish` / testing: el `.taskcode/config.yml` de TaskCode no declara `comando_verificacion` (comprobado) — gana testing — es un hecho comprobado; el criterio 4 se demuestra con el script de la prueba 4.
- 200 ms — arquitectura: diseña la vía rápida contra el coste de arranque del proceso, que la status line pagaría en cada refresco / testing: mide dentro del proceso, porque lanzar node en Windows ronda los 200 ms y daría intermitencias — sin resolver: Decisiones (c).
- Resolución de la ruta — riesgos: el contador «bajo `git rev-parse --git-path` o fuera del repo» / arquitectura: escritor y lector con la misma `rutaProgreso` sin git, siguiendo `gitdir:` — gana arquitectura — el lector no puede lanzar git (criterio 2), y riesgos mismo avisa de que rutas distintas dan «nada en marcha»; cumple su condición (fuera del árbol).
- Dónde se instala la status line — riesgos: en el `settings.json` de usuario corre en todos los repos / Carlos: instalación única para todos los proyectos — Decisiones (b).

## Riesgos aceptados y que los contiene

- **Comprobación obligatoria antes de implementar**: que la status line no se muestre en la app de escritorio (pestaña Code) ni por Remote Control, donde trabaja Carlos — Carlos — contiene: el spike S; si falla, se reabre el diseño con la persona.
- Un `EPERM`/`EBUSY` en el rename de Windows, o el antivirus, aborta un `finish` de 28 min ya en verde — riesgos — ninguna escritura de progreso lanza ni reintenta en bucle: si falla, se pierde ese tic (riesgos).
- Un fichero de progreso dentro del árbol cambia la huella y `review` aborta (`review.ts:1124`) — riesgos y testing — todo bajo `.git/taskcode/` (arquitectura); las instantáneas de los tests, fuera del árbol (testing).
- «En curso» para siempre si se mata el Stop (timeout 3600), Esc o Ctrl+C — riesgos — el `finally` cubre el aborto (prueba 2 de testing), no la muerte del proceso; ver Decisiones (f).
- doctor pisa la status line del usuario, una escritura concurrente de Claude Code, o la barra apunta a una ruta del plugin que deja de existir — riesgos — no sustituir un `statusLine` existente sin flag aparte, copia previa y tmp+rename (riesgos); clave centinela en la prueba 8 (testing); nada de rutas a la caché (arquitectura, riesgos).
- Un script ajeno escribe en el contador JSON a medias, ANSI o `\r` (que acabarían en la barra), y los hijos heredan la variable — riesgos — lectura tolerante, filtrar control, recortar, no exportar más allá del comando de verificación (riesgos).

## Plan de pruebas

- Cada comando del criterio 1 deja `progreso.json` con tarea, fase, `terminado` e `inicio` entre t0 y t1, y un aborto no lo deja «en curso» — fixtures existentes en repo temporal — testing (pruebas 1 y 2).
- Un script de verificación ve `TASK-NNN · finish · <paso>` a mitad, y escribe `3/10` en `$TASKCTL_PROGRESO` que `estado` muestra — `finish` real con script propio — testing (3 y 4).
- `estado` sin git: borra `tareas/` y `.taskcode/`, `PATH` sin git, salida idéntica; formato `2 min` a 125 s; sin tarea sale 0 — subproceso y core — testing (5 y 6).
- doctor sin flag no cambia el hash de `settings.json`; con flag añade `statusLine`, conserva claves y es idempotente; la comprobación da `omitida`/`ok`, no `aviso` — `configDir` temporal — testing (8).
- Reporter: `[1/N]`..`[N/N]` sin pasarse, total de la ejecución anterior, nombre del fallo visible y código distinto de 0 — `node --test` real sobre 3 ficheros en tmp — testing (9).
- Si F entra: `--seguir` ve dos pasos y sale solo al terminar, con timeout de 10 s y kill — subproceso asíncrono — testing (7).

## Sin cubrir

- Qué pasos (y con qué nombre) emite cada comando: ningún rol los enumera; se fija en B1/B2 y se revisa.
- Qué imprime `estado` fuera de un repo con taskctl, ahora que la status line correrá en todos los proyectos (Carlos): ningún rol lo trató; se fija en A según Decisiones (b).
- La tabla de `--experimental-test-coverage` con dos reporters: testing avisa de que ningún test la comprueba; se revisa a ojo.
- La lista de comandos «con progreso» y «exentos» que propone testing para que envejezca bien: ningún criterio la recoge; entra si la persona la acepta en B1.

## Salidas que faltaron

- ninguna. No es consenso sólido: hubo desacuerdos reales, arriba. Ningún rol vio la indicación posterior de Carlos.

## Suposiciones no verificadas

- Que la `statusLine` de `settings.json` se muestra en la app de escritorio (pestaña Code) y por Remote Control — Carlos — el spike S.
- Que el `command` de `statusLine` corre con el cwd del proyecto y con `taskctl` en el PATH — arquitectura — probarlo en una sesión real, dentro del spike S.
- Que un plugin no puede declarar status line — arquitectura — fuentes locales, no la documentación en vivo.
- Que el código de salida de `node --test` no depende del reporter — riesgos y testing — la ejecución que falla en la prueba 9.
- Que Claude Code no recarga los hooks de un plugin actualizado en una sesión abierta, y que el pid no basta en Windows — riesgos — sin mirar ni medir.
- El comportamiento en un worktree enlazado — testing y riesgos — un `git worktree add` real, a coste bajo (testing).

## Lo que necesita decision de una persona

- Aprobar o no el plan con `taskctl approve`: este plan no vale hasta esa aprobación, y no se implementa nada antes.
- Trocear según la partición de arriba, con el spike S primero, o aprobar entera con el motivo escrito: 360 min superan la regla de una hora.
- Tras el spike S: seguir con este diseño o reabrirlo si la status line no se ve donde trabaja Carlos.
- Las preguntas abiertas, con la opción que recomiendo, en la sección siguiente.

## Decisiones para la persona

- (a) ¿Se matiza el criterio 2 a «solo ficheros de progreso bajo `.git`, sin git»? Recomiendo **sí**: arquitectura y testing coinciden en el bloqueo de `spawnSync` (testing lo comprobó); la alternativa del hijo que reescribe el JSON obliga a cada proyecto ajeno a escribir JSON sin pisar campos, y el spawn asíncrono rehace `ejecucion-acotada` (arquitectura descarta ambas).
- (b) ¿`settings.json` de usuario o del proyecto? Recomiendo **el de usuario**, con un comando que fuera de un repo con taskctl no imprima nada (o un mensaje mínimo): es lo único que cumple «una vez, para todas las tareas y proyectos» (Carlos), el del proyecto obliga a instalar en cada uno, y la prueba 8 de testing ya usa el `configDir` de doctor. La queja de riesgos (corre en todos los repos) queda acotada por esa salida vacía. Si `taskctl` no está en el PATH, recomiendo **no instalar y decirlo**: la ruta a la caché del plugin cambia con cada actualización (arquitectura, riesgos) y rompe la barra sin avisar.
- (c) ¿Los 200 ms, dentro del proceso o del proceso entero? Recomiendo **dentro del proceso** (testing, mínimo de 5): el proceso entero sería intermitente en Windows. Con la status line como entregable principal el arranque pesa más; la vía rápida de arquitectura se conserva, pero ningún test la mide, y eso se acepta a sabiendas.
- (d) ¿`--seguir` (criterio 3) en esta tarea? Recomiendo **sacarlo a una tarea posterior o retirarlo**: Carlos lo deja en secundario, y riesgos señala que el agente lo lanzaría sin TTY y gastaría los tokens que la tarea quiere ahorrar. Si se mantiene, gana la prueba 7 de testing (es lo que el criterio permite probar) y el riesgo queda abierto y dicho.
- (e) ¿Desinstalación de la status line en doctor desde el primer día? Recomiendo **sí** (riesgos): tras revertir, la barra muestra un error en cada refresco, y sin copia la configuración previa no se recupera.
- (f) ¿Detección de «interrumpido» por pid + instante? Recomiendo **dejarla fuera**: no está en los criterios, y riesgos mismo la da por insuficiente en Windows sin medir.
