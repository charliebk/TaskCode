# Plan — TASK-081: Revision mas barata: medir y acotar las lecturas de los revisores

(Lo consolida el unificador a partir de 3 roles lanzados en paralelo: arquitectura, riesgos, testing. Son 3 porque la complejidad declarada es alta y la heurística da simple; se lanza el mayor. Ni se aplica ni se aprueba sin `taskctl approve` de una persona.)

## Enfoque
- A (arquitectura): `registrar-coste` lee las transcripciones y guarda en `## Coste` las lecturas de cada revisor y ronda, una fila por agente en `--fase revision`; `metricas` solo lee el repo, nunca `~/.claude` (riesgos coincide: modo 6). Antes se muda `RONDA_FILE_RE` a `fs/rondas.ts`.
- B (arquitectura): `core/contexto-revision.ts` arma `## Contexto permitido` en `peticion-revision-N[-skill].md`, quitando lo excluido y los tests reservados; el informe gana `## Lecturas fuera del contexto permitido`; la regla va en `skills/task-workflow/revision.md` («Lo que lees»).
- C (arquitectura): `core/modelo-revision.ts` (escalera opus→sonnet→haiku) y una línea nueva `- Modelo sugerido para esta ronda:` en la ronda 2; `Agente a lanzar` no cambia. §16.6 de PROPUESTA_METODOLOGIA se enmienda por escrito.
- Orden (arquitectura): primero A (regex, columnas, registrar-coste, metricas y METRICAS.md con el objetivo de 3–4 M) y luego B+C en `review.ts`. A y B se pueden entregar por separado.

## Desacuerdos resueltos
- Origen de (ronda, revisor) — arquitectura: deducirlo del nombre de la petición en el primer mensaje `user` de la transcripción / riesgos: que lo declare quien registra o salga del informe; lo que no esté declarado, «sin atribuir» — NO SE RESUELVE AQUÍ: va a la decisión humana 1.
- Formato de `## Coste` — arquitectura: dos columnas nuevas (`ronda`, `revisor`) y lector de 9 y 11 columnas; descarta meterlo en `fuente` porque sobrecarga `idsDeFuente` / riesgos: ampliar `fuente` sin tocar el número de columnas, porque un plugin viejo descarta las filas de 11 y `yaAnotado` vuelve a sumar la transcripción (doble conteo silencioso que no se puede deshacer) — NO SE RESUELVE AQUÍ: va a la decisión humana 4.
- Hallazgos CRÍTICO/IMPORTANTE junto a las lecturas en `metricas` — riesgos: condición para dar por bueno el objetivo / arquitectura y testing: no lo proponen — NO SE RESUELVE AQUÍ: va a la decisión humana 2.
- Condición «sin CRÍTICOS abiertos» — arquitectura: `criticosAbiertos === 0` según `hallazgosNoCerrados`, `null` si falta una tabla / riesgos: 0 CRÍTICOS en cualquier estado, todas las tablas legibles, 0 severidades desconocidas y un informe-plantilla sin filas no cuenta como limpio / testing: lo deja al dominio — NO SE RESUELVE AQUÍ: va a la decisión humana 3.
- Guardas extra del modelo barato — riesgos: además, diff incremental pequeño, sin ficheros nuevos, y volver al modelo de la tarea si aparece un hallazgo nuevo / arquitectura: solo la condición de CRÍTICOS — gana arquitectura — el criterio 3 solo pide lo de los CRÍTICOS y ningún rol definió qué es «pequeño»; lo que propone riesgos queda como riesgo aceptado.
- Dónde se pintan las lecturas — arquitectura: bloque de líneas bajo la tabla, también en `--json`, fuera de `--escribir` / testing: prefiere una sección aparte para no tocar las anclas de `metricas-tokens.test.ts:71/75/77` — son compatibles y gana el bloque aparte de arquitectura, que deja intactas esas anclas.

## Riesgos aceptados
- La revisión pierde calidad sin que nada lo avise: bajan los tokens porque se revisa peor — riesgos — lo contiene: la lista orienta pero no prohíbe (riesgos) y la sección de justificación del informe (arquitectura); el resto depende de la decisión 2.
- El modelo barato aprueba una corrección que abre otro fallo — riesgos — lo contiene: la condición de CRÍTICOS (decisión 3) y que la sugerencia queda en la petición, así se puede auditar después qué tareas se revisaron con ella.
- `lecturas` cuenta llamadas, no bytes, y no ve `cd x && cat y` ni `Get-Content` — riesgos — lo contiene: no presentarlas como causa de los tokens y mostrar al lado `cache_lectura` y `entrada` (riesgos).
- El formato de transcripción de Claude Code es externo; si cambia, la suite sigue en verde y en producción sale 0 — arquitectura y testing — lo contiene: un `.jsonl` real saneado como fixture y un aviso si hay `tool_use` con 0 lecturas (testing).
- Dos `registrar-coste` a la vez se pisan la fila — riesgos — lo contiene: una sola llamada con varios `--agente`, que escribe una fila por agente en un único commit (arquitectura).
- §16.6 queda contradicha («el revisor usa el mismo modelo») — arquitectura y riesgos — lo contiene: una enmienda escrita y corregir el comentario de `review.ts:133` en el mismo cambio.

## Plan de pruebas
- `metricas --tokens` con dos revisores en r1 y uno en r2 (lecturas 3, 5 y 2): tripleta exacta, `git status` limpio sin `--escribir` — repo Git temporal + `CLAUDE_CONFIG_DIR` temporal — testing.
- Borrar `CLAUDE_CONFIG_DIR` entre `registrar-coste` y `metricas`: las lecturas siguen saliendo y lo ausente se pinta `—`, nunca `0` — repo temporal — testing, riesgos (modo 6).
- Filas antiguas de 9 columnas: se leen con sus totales y sin revisor, `doctor` las da por válidas y no se suman dos veces — repo temporal — testing, riesgos (modo 4).
- `## Contexto permitido` (criterio 2): positiva (carpeta de la tarea y diff), negativa (un fichero versionado fuera del diff no aparece), y en ronda fragmentada solo el dominio de cada revisor; `review-dominios.test.ts:81/85` sigue igual en r1 — repo temporal vía CLI `review` — testing.
- `revision.md` contiene «Lo que lees» como sección propia, con la contraprueba de 9b/10bis y sin nombrar marcas del repo (test 11) — ficheros de skill — testing.
- Matriz del modelo en r2: (a) solo IMPORTANTES; (b) un CRÍTICO; (c) el CRÍTICO solo en el segundo informe fragmentado; (d) informe sin tabla; (e) la r1 nunca sugiere el barato. Los modelos salen de una constante exportada — repo temporal vía `veredicto` + `review` — testing.

## Sin cubrir
- El criterio 2 no cita nada comprobable — propuesta, a fijar al aprobar: «`peticion-revision-N[-skill].md` trae `## Contexto permitido`, sin ficheros fuera del diff ni tests reservados; `revision.md` tiene la sección «Lo que lees»; el informe tiene `## Lecturas fuera del contexto permitido`; lo comprueban los tests 4 y 5 del plan».
- Comprobar que el revisor obedeció la lista, o que se usó de verdad el modelo barato — testing lo deja como límite, no como requisito — no se mide en esta tarea salvo que la persona lo pida.
- Qué es una «tarea media» y si 3–4 M es el objetivo correcto — riesgos lo deja al dominio y no se lanzó rol de dominio — se escribe en METRICAS.md como cifra de hoy, sin prueba (testing).
- Criterio 5 (`npm test` en verde) — ningún rol lo trató aparte — se comprueba al cerrar, con los tres rojos conocidos de Windows.

## Salidas que faltaron
- ninguna (llegaron las tres; no se lanzó rol de dominio, así que la regla de «abierto» y el umbral de «tarea media» no tienen dueño)

## Suposiciones no verificadas
- `skills/review/SKILL.md` manda pasar al revisor la ruta de su petición — arquitectura — leer la skill.
- El primer mensaje `type:"user"` de `agent-<id>.jsonl` trae el prompt literal — arquitectura — mirarlo en una transcripción real.
- Las líneas de asistente llevan `message.model` y `Grep`/`Glob` guardan la ruta en `input.path` — testing — mirarlo en `~/.claude/projects/*/subagents/`.
- Claude Code purga las transcripciones antiguas — riesgos — documentación o una máquina con historial largo.
- Qué asevera `review-incremental.test.ts:117` sobre la petición de r2 — testing — leer el test.

## Decisiones de la persona (2026-11-07)
Las cuatro se resuelven con la recomendación:
- 1) **Deducir (ronda, revisor) de la transcripción.** Se lee del nombre `peticion-revision-N[-skill].md` en el primer mensaje `user`. `skills/review/SKILL.md` pasa a exigir que el prompt del revisor lleve la ruta de su petición, porque hoy no lo exige. `--ronda/--revisor` quedan solo como sustitutos, con un único `--agente` y validados contra los sufijos de `revision/`. Lo que no se encuentre sale como «sin atribuir».
- 2) **Sí: `metricas --tokens` muestra los CRÍTICO e IMPORTANTE de cada (ronda, revisor) junto a las lecturas.** Solo en el bloque aparte y en `--json`, no en el bloque de `--escribir`.
- 3) **La regla estricta.** La ronda 2 sugiere el modelo barato solo si se cumple todo esto en la ronda 1:
  - 0 CRÍTICOS, en cualquier estado;
  - todas las tablas legibles;
  - ninguna severidad desconocida;
  - ningún informe que siga siendo la plantilla.

  En cualquier otro caso se mantiene `modelo_sugerido`.
- 4) **Dos columnas nuevas en `## Coste`**, `ronda` y `revisor`, que dan 11 en total. El lector acepta también las filas de 9.

## Suposiciones comprobadas por el orquestador (2026-11-07)
- **Primer mensaje `type:"user"`:** en una transcripción real (`agent-*.jsonl`) es un string con el prompt literal. Las líneas `assistant` llevan `message.model`.
- **`skills/review/SKILL.md`:** NO manda poner la ruta de la petición en el prompt; solo dice «con la skill revisora que nombra la peticion». Se corrige en esta tarea (decisión 1).
- **`idsDeFuente` viejo con un sufijo en `fuente`:** `agente:abc@r2:x` da el id `abc@r2:x`, así que `yaAnotado` no encuentra `abc` y se cuenta dos veces. Con 11 columnas, el lector viejo descarta la fila y pasa lo mismo. Las dos opciones fallan igual con un plugin viejo, y solo si ese plugin vuelve a registrar el mismo agente. Se acepta como riesgo y se documenta en METRICAS.md.

## Decision humana pendiente (resuelta arriba)
- 1) De dónde sale (ronda, revisor). Recomiendo deducirlo de la transcripción (arquitectura), con `--ronda/--revisor` solo como sustitutos con un único `--agente`, validados contra los sufijos que existen (también arquitectura), y «sin atribuir» si no se encuentra (riesgos) — depende de las suposiciones 1–2 sobre un formato externo.
- 2) Que `metricas` muestre los CRÍTICO/IMPORTANTE de cada ronda junto a las lecturas. Recomiendo que sí, solo por pantalla, porque la clave del revisor ya es común a hallazgos y lecturas (arquitectura) — amplía el alcance más allá de los criterios.
- 3) La regla de «sin CRÍTICOS abiertos». Recomiendo la estricta de riesgos (0 en cualquier estado, tablas legibles, ninguna plantilla vacía) — es una regla de dominio, sin rol que la fundamente.
- 4) El formato de `## Coste` (columnas nuevas o `fuente`), lo único que no se puede deshacer. Antes de elegir, comprobar cómo trata el `idsDeFuente` viejo un sufijo en `fuente`, porque si lo trata mal ninguna opción evita el doble conteo — sin eso no hay base para decidir.
