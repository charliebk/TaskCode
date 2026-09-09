# Plan — TASK-017: Catálogo de skills determinista con selección en dos pasos

(Lo consolida el agente unificador a partir de 3 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos, testing.
Los desacuerdos entre roles se senalan, no se promedian.)

Nota de cobertura: no se lanzó rol dominio para esta ronda (3 roles:
arquitectura, riesgos, testing). Las 3 salidas llegaron completas.

## Enfoque propuesto

Orden de construcción, según **arquitectura**:

1. Crear `scripts/catalogo-skills.yml` — mismo patrón sin-runtime-YAML
   que `scripts/heuristica-complejidad.yml` (fichero a mano).
2. Crear `core/catalogo-skills.ts` con `cargarCatalogoSkills()` (reusa
   `parseBloqueClaveValor` de `frontmatter.ts`; doctrina fail-closed al
   parsear: clave desconocida o ausente aborta, sin default silencioso
   — misma doctrina que `cargarHeuristica()`) y una función pura
   `seleccionarSkill(task, catalogo)` que resuelve el paso 1 de 6.6:
   solape de `etiquetas`, desempate por `prioridad` (16.4.1), sin LLM.
3. Conectar en `commands/plan.ts`, dentro de `runPlanCommand`, justo
   tras `seleccionarRoles(resolucion.agentes)` — el hueco que hoy dice
   "selección de skill (6.6, TASK-017): sin hacer".
4. Solo si el paso 1 empata también en `prioridad`: generar el par
   `peticion-desempate-skill-1.md` / `salida-desempate-skill-1.md` bajo
   `planificacion/` de la tarea (mismo patrón que las peticiones de rol
   y de unificador ya usadas). **Arquitectura** es explícita en que
   `plan.ts` nunca invoca un modelo directamente (misma regla que fijó
   TASK-013 para `taskctl review`): el desempate por Haiku es una
   petición/salida más, no una llamada en el CLI.
5. No toca `agente_revisor` (sigue basándose en `etiquetas`, sección 9)
   ni ningún consumo de `patrones_archivo` — eso queda para TASK-018 por
   diseño del propio enunciado.

Gap señalado por el unificador (ningún rol lo cubrió): ningún rol
propuso el contenido real de la primera versión de
`catalogo-skills.yml` (qué skills e ids concretos entran) ni cómo/dónde
se implementa la comprobación de "instalado" para `origen: externo`
(**riesgos** solo analiza el riesgo del subproceso `claude plugin list
--json`, pero **arquitectura** no ubica esa llamada en ningún módulo).

## Desacuerdos entre roles, y como se resuelven

- **Dónde vive el registro auditable** (qué skill ganó y por qué
  regla) — **arquitectura** deja esto abierto como "la decisión que
  más le preocupa": un campo/sección más en `plan-final.md` (visible,
  pero prosa libre) o un fichero estructurado propio en
  `planificacion/`, y dice no haber leído `core/plan-brainstorm.ts` a
  fondo para saber si ya hay una convención que reusar. **Testing**,
  en cambio, escribe su plan de pruebas asumiendo que el resultado se
  lee "del frontmatter resultante" de la tarea vía `taskctl plan`
  contra un repo real — es decir, asume que vive en `tarea.md`, no en
  `planificacion/`. **Riesgos** apunta en la misma dirección al asumir
  que el destino es el campo ya existente `skills_recomendados` de
  `task.ts`, pero marca explícitamente que "no hay ningún consumidor
  hoy que lo confirme". Tres posiciones sin cruzar entre sí, ninguna
  verificada contra el código real por ningún rol.

  **Resuelto** — investigado leyendo `core/task.ts`,
  `core/plan-brainstorm.ts` y `commands/plan.ts` a petición de la
  persona, fuera del brainstorm de roles:
  - `core/plan-brainstorm.ts` no tiene ninguna convención de
    "artefacto estructurado" que reusar: es solo las plantillas de
    petición/salida de rol y de unificador (TASK-016, D1). La duda de
    arquitectura queda cerrada — ahí no hay nada que imitar.
  - `skills_recomendados` (`task.ts:54`, en `TASK_FIELD_ORDER`,
    validado como `string[]` puro por `requireStringArray` en
    `task.ts:217`) sí existe ya. Su único escritor hoy es `new.ts:167`
    (`skills_recomendados: []`) y no tiene ningún consumidor —
    confirma la sospecha de riesgos: es un campo libre, listo para
    usar.
  - Pero un `string[]` plano no puede cargar a la vez "qué skill" y
    "por qué regla" sin forzarlo, y el objetivo pide las dos cosas.

  **Decisión**: `skills_recomendados` guarda el/los id(s) de skill
  elegidos, reusado tal cual — sin tocar su tipo ni el parser de
  frontmatter. La regla ganadora (`solape` / `prioridad` / `llm`) va
  en un campo nuevo y simple, hermano de ese, en `Task`
  (`regla_seleccion_skill: 'solape' | 'prioridad' | 'llm' | null`),
  en vez de una sección nueva en `plan-final.md` o un fichero aparte
  en `planificacion/`: más barato, y el registro queda donde ya vive
  `skills_recomendados`, en el frontmatter auditable de `tarea.md`.
  Añadir ese campo exige tocar `validateTask`, `TASK_FIELD_ORDER` y
  `new.ts` (inicializarlo a `null`), igual que cualquier campo nuevo
  de `Task`.

- **Qué hacer cuando ningún candidato del catálogo solapa las
  `etiquetas` de la tarea** — **riesgos** lo marca como desacuerdo
  previsto con arquitectura: su posición es que el top-N vacío debe
  ser un resultado válido (cero sugerencias + aviso), no un fallo de
  configuración, porque el catálogo es explícitamente no exhaustivo
  ("los skills... que el equipo ya usa", no todas las etiquetas
  posibles) — a diferencia de `heuristica-complejidad.yml`, que cubre
  todos los niveles por construcción y por eso sí puede permitirse
  fail-closed total. **Arquitectura**, en su salida real, no toma
  postura sobre este subcaso concreto: su doctrina fail-closed se
  aplica explícitamente al *parseo* del fichero (clave ausente o
  desconocida), no al caso de "cero candidatos tras cruzar etiquetas".
  Gana la posición de **riesgos** — el propio contraste que ella hace
  (catálogo no exhaustivo por diseño vs. heurística exhaustiva por
  construcción) está en el enunciado y no lo contradice nada de lo que
  arquitectura escribió. Queda como riesgo aceptado, no como
  desacuerdo cerrado por consenso: nadie de arquitectura lo validó.

## Riesgos aceptados y que los contiene

- Re-planificación (bucle B9→B5) pisa en silencio un `agente_revisor`
  o `skills_recomendados` ya fijado, sin dejar rastro del cambio —
  **riesgos** — se contiene comparando valor previo vs. nuevo y
  exponiéndolo igual que ya hace `asignadoCambiado` en `plan.ts`.
- Catálogo pequeño con etiquetas muy compartidas produce empates de
  solape+prioridad en la mayoría de los planes (no en el caso raro),
  invocando Haiku casi siempre y revirtiendo el ahorro que motiva la
  sección 16 — **riesgos** — se contiene midiendo empíricamente sobre
  tareas reales del repo, como ya se hizo con el `max` de
  `heuristica.ts` (32 tareas documentadas en el código).
- Comprobar "instalado" para `origen: externo` vía subproceso `claude
  plugin list --json` puede fallar por binario ausente en el PATH o
  por cambio de esquema JSON entre versiones — **riesgos** — se
  contiene tratando cualquier fallo del subproceso como "no
  verificable", nunca como "no instalado" ni "instalado" por defecto.
- YAML del catálogo mal formado tras una edición manual bloquea
  `taskctl plan` para TODAS las tareas, no solo la afectada, si se
  sigue el fail-closed de `heuristica.ts` — **riesgos** — se contiene
  con el mismo patrón de validación exhaustiva y mensaje accionable
  que ya usa `cargarHeuristica()`.
- El registro de auditoría se escribe a mitad de un pipeline con
  historial de bugs de estado parcial (`plan.ts`); si el proceso muere
  y el catálogo se edita antes del reintento, el registro no coincide
  con lo que realmente se decidió — **riesgos** — se contiene tratando
  el registro como derivado y regenerándolo siempre, nunca como estado
  a preservar entre intentos.
- Puntos sin retorno: ninguno, según **riesgos** — nada se instala
  automáticamente (lo fija el enunciado) y la escritura queda dentro
  del mismo commit automático ya reversible de `plan.ts`.

## Plan de pruebas

Todas las siguientes, con su mutación de control, las trae **testing**:

- Solape distinto sin empate elige la fila de mayor solape sin invocar
  el LLM — catálogo de prueba con dos filas (solape 3 vs. 1) — cae si
  se invoca el LLM sin necesidad o se comparan los solapes al revés.
- Empate en solape se rompe por `prioridad`, sin LLM — catálogo con
  dos filas de igual solape y prioridad distinta — cae si se ignora
  `prioridad` y se cae directo al LLM.
- Empate en solape Y en prioridad invoca al LLM con exactamente ese
  top-N (2-3 candidatos, nunca el catálogo completo) — catálogo con
  tres filas empatadas entre sí — cae si se pasa el catálogo entero o
  se resuelve el empate sin invocar al juez.
- Ninguna fila comparte etiqueta con la tarea deja la selección sin
  skill y lo dice explícitamente — tarea con etiquetas no catalogadas
  — cae si se devuelve la primera fila del catálogo por defecto.
- El registro final distingue las tres reglas (solape/prioridad/LLM),
  no solo el id ganador — `taskctl plan` contra un repo git temporal
  real, leyendo el resultado — cae si se escribe siempre "solape" como
  regla aunque haya ganado por prioridad o LLM. (Esta prueba depende
  de resolver primero el desacuerdo sobre dónde vive el registro.)
- Candidato ganador `origen: externo` no instalado anota `/plugin
  install X@Y` sin instalar nada — catálogo con una fila externa no
  instalada — cae si se omite la anotación o se dispara una
  instalación real.

Trampas que **testing** pide evitar explícitamente: un test que ponga
igual solape Y prioridad en dos filas no aísla el desempate de
prioridad del de solape (mismo near-miss que sufrió
`heuristica.test.ts`); probar un único candidato no demuestra que al
LLM le llegan 2-3 filas y no el catálogo entero; comprobar solo el id
ganador sin comprobar la regla registrada deja las etiquetas
solape/prioridad/LLM sin vigilancia.

**Testing** también marca que `test/commands/plan.test.ts` (líneas
37-38) fija `skills_recomendados: []` en su helper; un test nuevo que
lo reutilice necesita `etiquetas` reales o el catálogo nunca
encontrará candidatos.

## Lo que necesita decision de una persona

- ~~Dónde vive el registro auditable~~ — **resuelto** (ver "Desacuerdos
  entre roles" arriba): `skills_recomendados` guarda el id de skill,
  un `regla_seleccion_skill` nuevo en `Task` guarda la regla. Falta que
  la persona lo ratifique junto con el resto del plan antes de
  `taskctl approve`.
- **Aceptar o no la mitigación de riesgos para "sin candidato"** (cero
  sugerencias como resultado válido, no como fallo fail-closed) como
  política definitiva, dado que arquitectura no llegó a pronunciarse
  sobre este subcaso concreto.
- **Contenido inicial de `scripts/catalogo-skills.yml`**: ningún rol
  propuso qué skills e ids concretos entran en la primera versión, ni
  quién decide qué cuenta como "skill que el equipo ya usa" — hueco de
  dominio que ningún rol (no se lanzó dominio esta ronda) cubrió.
- **Dónde y cómo se implementa la comprobación de `origen: externo`
  instalado** (el subproceso `claude plugin list --json` que analiza
  riesgos) — ningún rol la ubicó en un módulo ni un flujo concreto.
- Suposiciones de **riesgos** sin verificar y que conviene confirmar
  antes de implementar: que `claude plugin list --json` responde igual
  invocado como subproceso headless desde Node en Windows; que el
  catálogo garantiza `id` único por entrada (el fragmento de 6.6 leído
  no lo dice); que el orden de iteración sobre el catálogo es estable
  y reproducible cuando dos candidatos empatan también en prioridad.

Este plan no autoriza a empezar a implementar. Falta la aprobación
humana vía `taskctl approve`.
