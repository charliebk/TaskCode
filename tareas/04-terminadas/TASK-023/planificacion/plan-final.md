## Enfoque

Se crea: `requireNullableNumber()` en `src/core/task.ts` (arquitectura, espejo de `requireNullableString`) + 3 campos nuevos nullable `tokens_diseno`/`tokens_implementacion`/`tokens_revision` en `Task`/`TASK_FIELD_ORDER`; comando `taskctl registrar-coste <id> --fase <f> --tokens <N>` (`src/commands/registrar-coste.ts` + `cli.ts`) que suma sobre lectura-completa→escritura, igual patrón que `plan.ts`/`approve.ts` (arquitectura, verificado: `task-store.ts` no tiene "patch" parcial). `src/core/frontmatter.ts` no se toca (verificado: escalares planos, el bucle clave:valor ya los soporta).
Se extiende: agregación por sprint contra `docs/METRICAS.md`, vía `taskctl board --tokens` (decisión de Carlos, ver abajo — arquitectura había dejado esto y el comando nuevo `taskctl metricas` como dos opciones abiertas). `scripts/heuristica-complejidad.yml` solo se lee.
Orden: 1) helper + campos + tests de validación → 2) `registrar-coste` + aviso en `finish` si falta coste + tests → 3) `board --tokens` + sección generada de `docs/METRICAS.md` + tests con datos de ejemplo (CA4) → 4) contraste de pesos de la heurística, a mano, con los datos ya agregados.

## Desacuerdos resueltos

- Ninguno de frente: arquitectura y riesgos no proponen alternativas incompatibles en ningún punto concreto — combinan "dónde encaja" (arquitectura) con "por dónde se rompe" (riesgos), mandatos distintos por diseño, y no es forzoso fabricar un choque donde no lo hay. Tampoco es la alarma de consenso fingido (esa aplica cuando dos roles del mismo tipo reciben el mismo contexto y repiten conclusión): riesgos verificó por su cuenta la ausencia de `requireNullableNumber` que arquitectura ya asumía, y aportó cuatro hallazgos propios que arquitectura no cubre — ver Riesgos aceptados.

## Riesgos aceptados

- Olvido silencioso de registrar el coste, paralelo exacto a `ultimo_commit_revisado` — verificado por grep: solo se inicializa a `null` en `new.ts:169`, y el comentario de `review.ts:16-18` dice que "debería" actualizarse al aprobar una revisión, pero ningún comando lo hace nunca — traído por arquitectura (lo llama "la decisión que más te preocupa", sin proponer mitigación) y por riesgos (`state-machine.ts` transición `finish`, verificado líneas 242-265, solo comprueba `estado` y aprobación, nada de coste) — sin mitigar en el enfoque; se acepta explícito, lo contiene hoy solo la revisión por pares vía el `Resultado` de la tarea.
- Patrón de `board.ts` (captura `TaskValidationError`/`FrontmatterParseError` y excluye la tarea en silencio con solo una advertencia por pantalla, verificado líneas 179-190) heredado por el agregador nuevo — riesgos, su "riesgo que más preocupa". El nullable de arquitectura evita que el CAMPO NUEVO dispare esa exclusión (verificado: las tareas de `04-terminadas/` sin los 3 campos seguirán validando, igual que hoy con `regla_seleccion_skill`, confirmado ausente en TASK-013), pero el patrón general de excluir-y-no-persistir-aviso para cualquier otra tarea.md inválida sigue sin resolver si el agregador reutiliza `board.ts` tal cual.
- Ambigüedad "0 porque no aplicó" vs "vacío porque nadie lo registró" (riesgos, sección de estados intermedios) — no resuelta por arquitectura; se acepta si la implementación no la fija explícitamente.
- Falta de locking en `task-store.ts` (`writeFile` con flag `'w'`, sin transacción lectura-modificación-escritura, verificado línea 159) — riesgos — no abordado por arquitectura, que reutiliza el mismo patrón; riesgo preexistente que esta tarea hereda, lo contiene solo la convención de "una rama por tarea" del proyecto.
- Valor de magnitud incorrecta pero bien tipado (p. ej. 500 en vez de 5000) no detectable — no hay validación de rango en `task.ts` ni `frontmatter.ts`, y ningún rol propone una — se acepta, lo contiene solo la revisión por pares humana.

## Plan de pruebas

- `requireNullableNumber` acepta null/ausente/entero y rechaza string/float — mismo patrón que ya cubre `requireNullableString` — pedido por riesgos y arquitectura.
- Relectura de las tareas reales de `tareas/04-terminadas/` (no solo sintéticas) tras añadir los 3 campos, verificando que ninguna lanza `TaskValidationError` — pedido por riesgos, es el test que evitaría su riesgo principal.
- `registrar-coste` suma sobre varias llamadas a la misma fase y deja `null` intacto en las fases no tocadas — pedido por arquitectura (suma) y riesgos (distinguir null de 0).
- Agregador por sprint con datos de ejemplo que incluyan una tarea con los 3 campos ausentes, verificando que no desaparece del agregado sin aviso persistido — pedido por riesgos.
- Comportamiento de `finish` sin coste registrado en alguna fase: hoy no bloquea (verificado); el test fija el comportamiento que decida la persona (bloquear, avisar, o pasar) — pedido por riesgos.
- Contra recursos reales (repos temporales), nunca mocks — norma de `CLAUDE.md` del proyecto, no de un rol.

## Sin cubrir

- De dónde saca el agente orquestador la cifra de tokens que reporta a `registrar-coste` — ningún rol lo resolvió, porque cae fuera de lo que `taskctl` puede ver por diseño (lo dice el propio objetivo) — **resuelto**, ver "Decisiones tomadas por Carlos".
- Qué mecanismo concreto cierra el paralelo con `ultimo_commit_revisado` — ambos roles lo señalan pero ninguno propone uno — **resuelto**, ver "Decisiones tomadas por Carlos" (aviso no bloqueante en `finish`).

## Salidas que faltaron

- ninguna

## Suposiciones no verificadas

- Que el agente orquestador siempre podrá/querrá invocar `registrar-coste` tras cada fase — arquitectura la asume, riesgos aporta evidencia de que la misma suposición ya falló con `ultimo_commit_revisado`, pero ninguno la verificó contra este mecanismo nuevo porque todavía no existe.
- Que "contrastar contra la sección 16" significa comparar el total real contra el nivel de complejidad que asignaría la heurística, y no contra una cifra de tokens fija — arquitectura, no verificado contra el texto de la sección 16 en esta consolidación (fuera del alcance del rol unificador).
- Que el agregador nuevo reutilizará el patrón de exclusión silenciosa de `board.ts` "porque es el único precedente que hay" — riesgos lo asume como lo más probable, pero lo dice explícitamente como suposición ya que el agregador aún no existe.

## Decisiones tomadas por Carlos (2026-09-16)

- **Fuente del dato de tokens**: el agente (yo) reporta de memoria, al cerrar cada fase con LLM, el uso de tokens que la propia sesión de Claude Code me muestra en esa conversación, y lo paso a `taskctl registrar-coste`. Aproximado, sin instrumentación nueva ni coste añadido — coherente con la restricción de partida del objetivo (`taskctl` no ve el consumo del agente).
- **Olvido silencioso**: `taskctl finish` imprime un aviso si alguna fase que usó LLM (brainstorm, revisión, Codex) no tiene coste registrado, pero **no bloquea** el cierre — visibilidad sin fricción nueva. No se añade gate duro en la máquina de estados.
- **Agregación**: se extiende `taskctl board` con un flag `--tokens` (mismo patrón que `--escribir`), y `docs/METRICAS.md` gana una sección delimitada que ese flag regenera — mismo patrón que `docs/BOARD.md`. No se crea un comando `taskctl metricas` separado.
- Aprobación completa del plan con `taskctl approve` — sigue siendo obligatoria antes de implementar.

## Divergencias aprobadas por Carlos (2026-10-06, al arrancar)

El plan se aprobo el 2026-09-16, antes de TASK-052, que creo
`taskctl metricas` (tabla de fases por tarea, solo lectura). Dos decisiones
de arriba quedan sustituidas:

- **Agregacion**: no hay `board --tokens`. Los tokens son columnas de
  `taskctl metricas` (`--tokens`, con resumen por sprint y por nivel de
  complejidad), y `taskctl metricas --tokens --escribir` regenera una seccion
  delimitada de `docs/METRICAS.md`, con el mismo patron que `docs/BOARD.md`.
  Se reutiliza la lectura y el formateo de tablas de metricas.
- **Fuente del dato**: no es «de memoria». Se suma el uso exacto que Claude
  Code devuelve al terminar cada subagente de la fase (roles, unificador,
  revisores, implementador), mas una estimacion de la parte del orquestador.
  La cifra es tokens procesados: entrada + escritura y lectura de cache +
  salida.

Y una de alcance, mia, por evidencia:

- **Historico**: las transcripciones de subagentes que guarda Claude Code
  (`~/.claude/projects/<proyecto>/<sesion>/subagents/*.jsonl`) traen el
  `usage` de cada llamada. De ahi sale el coste real de los subagentes de
  unas 45 tareas pasadas. **No se escribe en los `tarea.md`**: es una cota
  inferior (falta el orquestador y los agentes que tocaban varias tareas), y
  el campo significa coste de la fase. Va a una seccion propia de
  `docs/METRICAS.md`, escrita a mano, y es la muestra con la que se revisan
  los pesos de la heuristica (CA3). TASK-023 es la primera tarea con los
  campos rellenos.
