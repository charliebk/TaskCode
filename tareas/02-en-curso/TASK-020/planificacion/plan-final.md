## Enfoque
Se crea `src/commands/codex-review.ts` (arquitectura). Se extiende `src/cli.ts` (rama `codex-review` junto a review/finish), `src/fs/git.ts` (wrapper de spawn para `codex`, mismo patron que `runGit`) y `src/fs/rondas.ts` (regex `informe-codex-(\d+)\.md`). No se toca `state-machine.ts` ni `finish.ts`: ya cierran el contrato (arquitectura).
Orden (arquitectura): 1) wrapper de spawn que detecta ENOENT sin lanzar; 2) `runCodexReviewCommand` valida la transicion con `assertTransitionAllowed('codex-review', ...)`; 3) si `codex` falta, avisa y sale sin escribir informe; 4) si esta, ejecuta `codex review --base <rama> --commit <sha>` y vuelca la salida en `informe-codex-<ronda>.md`; 5) `autoCommit` del directorio de la tarea, igual que review.ts.
Descartado por arquitectura, sin contraparte que lo objete: rama condicional dentro de `review.ts` (rompe la exigencia de salida separada) y fragmentar por dominio como `review` (contradice la nota ya escrita en finish.ts:149: Codex es un agente unico, no enrutado por dominio).

## Desacuerdos resueltos
- Ninguno resuelto aqui: los 2 desacuerdos reales que trajeron los roles (codigo de salida ante fallo de Codex; quien certifica el veredicto) no se pueden fallar con lo que hay — se suben enteros, con las dos posiciones completas, a "Decision humana pendiente".

## Riesgos aceptados
- La salida de `codex review` mezcla logs de tracing/banner/warnings con contenido util, sin flag `--json` — riesgos — se contiene sin parsear nunca esa salida para decidir nada: se vuelca cruda dentro de `informe-codex-N.md` y el veredicto queda como texto humano aparte.
- Proceso que puede colgarse esperando red, sin timeout propio del wrapper (no verificado por riesgos con red realmente caida) — riesgos — sin mitigacion propuesta por ningun rol; queda como riesgo aceptado sin contener.
- Concurrencia: dos `codex-review` a la vez sobre la misma tarea calculan la misma "siguiente ronda" antes de escribir — riesgos — se contiene reusando el mismo `try/catch` de `EEXIST` con flag `'wx'` que ya usa review.ts.
- Escritura parcial si no se replica el bloque unico de review.ts que envuelve escritura + `autoCommit` antes de mover la tarea — riesgos — se contiene copiando ese mismo orden en codex-review.ts.
- Con `--push`, un informe fundado en ruido de Codex leido como aprobacion queda comiteado y empujado a origin sin deshacer facil — riesgos — sin mitigacion tecnica ofrecida; se acepta como el mismo coste que ya asume `--push` en revision primaria.

## Plan de pruebas
- Precondicion de estado (revision primaria no aprobada, o `revision_codex` false) rechaza la transicion — contra `assertTransitionAllowed` real, sin mocks — arquitectura, criterio de aceptacion 4.
- Ausencia del CLI (`codex` no en PATH) degrada con aviso y no rompe el flujo, sin escribir informe — contra un `deps.runCodex` inyectado que simule ENOENT, mismo patron que `deps.scriptsDir` — arquitectura, criterio de aceptacion 3 y 4.
- Concurrencia sobre la misma ronda produce el mismo `EEXIST` que ya maneja review.ts — contra dos invocaciones reales sobre un repo git temporal — riesgos.
- Exit distinto de cero por causa ajena al diff (evidencia real de riesgos: cuenta/modelo no soportado) — pendiente de que Carlos fije el contrato (pregunta 1 abajo) antes de escribir esta prueba: no se testea un comportamiento aun no decidido.

## Sin cubrir
- Diseno de inyeccion de dependencias para el CLI de Codex (`deps.runCodex`) — arquitectura lo propuso anticipando objecion de un rol de testing que esta ronda no se lanzo (2 roles: arquitectura, riesgos); queda sin contraparte que lo valide.
- Contenido exacto que `codex review` produce en un camino feliz (con o sin hallazgos) — ningun rol lo verifico con una cuenta/modelo compatibles; ver "Suposiciones no verificadas".

## Salidas que faltaron
- ninguna

## Suposiciones no verificadas
- Que `codex review` imprime el informe completo por stdout, sin fichero de salida propio — arquitectura — confirmar ejecutando una revision real contra un diff, con cuenta/modelo compatibles.
- Que la salida de Codex no trae ya una linea "- Veredicto:" parseable — arquitectura la deja abierta; riesgos aporta evidencia en contra con una ejecucion real, pero falta repetirla con una cuenta soportada para descartarlo del todo.
- Que la numeracion de ronda de Codex reutiliza el mismo contador N que la revision primaria — arquitectura — confirmar contra una tarea real con `revision_codex: true` ya cerrada.
- Que `spawnSync('codex', ...)` da `result.error.code === 'ENOENT'` cuando falta el binario, igual que con git — arquitectura, sin probarlo directamente; riesgos tampoco lo probo (solo vio el "command not found" del shell, exit 127).
- Que sin red el proceso cuelga sin timeout propio — riesgos — probar desconectando la red real y repitiendo `codex review`.

## Decisiones tomadas por Carlos (2026-09-12, via remote control)

- **Alcance del fallo que degrada**: TODO exit distinto de cero de `codex` (no solo `ENOENT`) se trata igual que la ausencia — avisa y degrada, `taskctl codex-review` sale con codigo 0, sin escribir informe. Gana la posicion de riesgos (evidencia real: un fallo de cuenta/modelo en esta misma maquina, no relacionado con el diff), mismo patron que `isRemoteAvailable`.
- **Quien certifica el veredicto**: un humano/agente, tras leer `informe-codex-N.md`. `codex-review.ts` nunca infiere nada del exit code de Codex (no es una senal fiable, confirmado empiricamente). El informe se genera con la salida cruda de Codex embebida como contexto y un veredicto `PENDIENTE`, mismo patron que `informeTemplate` de la revision primaria.
- **Bloqueo sin Codex**: `revision_codex: true` sigue bloqueando `taskctl finish` fail-closed, sin excepcion, si Codex se degrada y no hay informe aprobado. Sin veredicto especial de "degradada": la persona resuelve a mano (arregla Codex y reintenta, o quita `revision_codex: true` si decide que esta tarea no lo necesita). Mismo criterio fail-closed que ya rige el resto del proyecto — no se anade una tercera categoria de veredicto.
