# Peticion de revision — TASK-023 (ronda 1)

- Tarea: TASK-023 — Métricas de coste en tokens por fase
- Rama revisada: feature/task-023-metricas-de-coste-en-tokens-por-fase
- Rama base: develop
- Commit revisado (HEAD): 4d3c626901128091c6ae0f9989fbbaa7ca3c5174
- Fecha: 2026-10-06
- Agente a lanzar: typescript-reviewer (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-023 (criterios de aceptacion y plan)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Commits a revisar (git log develop..HEAD)

````
4d3c626 docs(TASK-023): bloque generado de tokens en METRICAS.md
8d19cd2 chore(TASK-023): coste implementacion +18803413 tokens (1 agente)
1824e1e chore(TASK-023): coste diseno +3445774 tokens (3 agentes)
190d022 feat(TASK-023): registrar-coste --agente suma el uso real de la transcripcion del subagente
2d88132 feat(TASK-023): registrar-coste, metricas --tokens/--escribir y aviso de coste en finish
9409aa1 docs(TASK-023): coste real historico de subagentes y revision de pesos de la heuristica
cd77855 docs(TASK-023): divergencias del plan aprobadas al arrancar (metricas y fuente del dato)
da6ffd7 chore(TASK-023): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 1cbeb7e..f530ec5 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -2,6 +2,13 @@
 
 ## Sin publicar
 
+Coste en tokens por fase (TASK-023).
+
+- Nuevo `taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision (--agente <id>... | --tokens N)`: suma el coste de una fase en `tokens_diseno`, `tokens_implementacion` o `tokens_revision` del `tarea.md` (campos nuevos, `null` = sin registrar; las tareas anteriores siguen validando) y lo commitea. `--agente` lee la transcripcion de cada subagente (`projects/*/*/subagents/agent-<id>.jsonl` bajo `CLAUDE_CONFIG_DIR` o `~/.claude`) y suma lo gastado de verdad (entrada + cache + salida por llamada, ultima aparicion de cada `message.id`): la cifra que Claude Code muestra al terminar un subagente es su contexto final, no su coste. Funciona en cualquier estado; rechaza 0.
+- `taskctl metricas --tokens`: columnas de tokens por fase y resumen por sprint y por complejidad declarada (tareas con dato / total, suma, media y % por fase). `--tokens --escribir` regenera el bloque delimitado por marcadores HTML de `docs/METRICAS.md` sin tocar el resto del fichero.
+- `taskctl finish` avisa, sin bloquear, si falta el coste de diseno o de revision. `taskctl new` escribe los tres campos a `null`.
+- La skill `task-workflow` (referencia `coste.md`) y las de fase `plan`, `start`, `review` y `finish` piden registrar cada subagente de la fase con `--agente <id>`.
+
 ## 0.5.0 — 2026-10-05
 
 Fase 6 del plan de la auditoria: suite, skill y telemetria. Actualizar con
diff --git a/CLAUDE.md b/CLAUDE.md
index 6191426..ca0debc 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -43,8 +43,8 @@ npm test             # compila y corre la suite completa (~1090 tests, ~8 min) c
 npm run test:rapido  # core y cli sin procesos (~360 tests, ~10 s): para iterar, no para cerrar
 ```
 
-El CLI: `taskctl new | import | board | metricas | plan | approve | start |
-review | finish`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
+El CLI: `taskctl new | import | board | metricas [--tokens [--escribir]] | plan |
+approve | start | review | finish | registrar-coste TASK-NNN --fase <f> (--agente <id>... | --tokens N)`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
 recover | abort-merge`. El ciclo de vida está completo: Fases A, B y C
 cerradas.
 
diff --git a/docs/METRICAS.md b/docs/METRICAS.md
index d5656f7..bc4a3d8 100644
--- a/docs/METRICAS.md
+++ b/docs/METRICAS.md
@@ -412,3 +412,219 @@ ficheros—, y por tanto **una tarea arrancada con `taskctl start` no se puede
 cerrar con el sistema**: hay que terminarla a mano, exactamente como se han
 terminado estas 12. Ese es el hito real de usabilidad diaria, y
 `docs/contexto/CHECKLIST_TERMINACION.md` lo sitúa en su Fase B.
+
+## 11. Coste real en tokens de los subagentes (histórico, TASK-005 a TASK-059)
+
+> Añadido el 2026-10-06 por TASK-023. Es la primera medición de coste real
+> que tiene el proyecto: la sección 16 de `PROPUESTA_METODOLOGIA.md` solo
+> estimó **dónde** hace falta un LLM, nunca **cuánto**.
+
+**Fuente.** Claude Code guarda la transcripción de cada subagente
+(`~/.claude/projects/<proyecto>/<sesion>/subagents/agent-*.jsonl`), con el
+`usage` de cada llamada a la API. Para cada uno de los 190 subagentes
+guardados se suman, por mensaje único, entrada + escritura de caché + lectura
+de caché + salida: **tokens procesados**, no coste en euros. La lectura de
+caché domina las cifras y es la parte barata. La tarea se toma del TASK-NNN de
+la descripción o el prompt del agente, y la fase de la descripción (los
+`brainstorm-*`, unificador y plan son diseño; las implementaciones y las
+correcciones son implementación; las revisiones, rondas y smokes son
+revisión).
+
+**Es una cota inferior, y no se escribe en los `tarea.md`.** Faltan:
+
+- la parte del orquestador, que en las tareas antiguas implementaba él mismo;
+- los subagentes cuyo prompt nombraba varias tareas (203 M de 799 M), y 110 M
+  sin tarea identificable;
+- Codex;
+- las sesiones anteriores a que Claude Code guardara transcripciones de
+  subagentes.
+
+Por eso estas cifras no rellenan `tokens_*`, que significan coste de la fase.
+TASK-023 es la primera tarea con esos campos rellenos con
+`taskctl registrar-coste`.
+
+Cifras en millones de tokens procesados por los subagentes atribuibles a una
+sola tarea. Las tareas sin complejidad conocida quedan fuera.
+
+| tarea | declarada | heuristica | rondas | diseno | implementacion | revision | total |
+|---|---|---|---|---:|---:|---:|---:|
+| TASK-015 | simple | simple | 1 | — | — | 8.0 | 8.0 |
+| TASK-016 | alta | simple | 5 | — | 5.5 | 38.2 | 43.6 |
+| TASK-017 | alta | simple | 5 | 6.7 | — | 22.4 | 29.1 |
+| TASK-018 | alta | simple | 2 | 4.7 | 16.0 | 19.1 | 39.7 |
+| TASK-020 | media | simple | 3 | 0.8 | — | 13.4 | 14.2 |
+| TASK-022 | simple | simple | 3 | — | — | 2.1 | 2.1 |
+| TASK-025 | media | simple | 1 | — | — | 7.6 | 7.6 |
+| TASK-026 | media | simple | 2 | — | — | 14.2 | 14.2 |
+| TASK-027 | simple | simple | 2 | — | — | 22.6 | 22.6 |
+| TASK-028 | simple | simple | 1 | — | 5.1 | 23.6 | 28.7 |
+| TASK-029 | media | simple | 2 | — | 5.5 | 19.4 | 24.9 |
+| TASK-030 | media | simple | 2 | — | 15.0 | 21.4 | 36.5 |
+| TASK-031 | media | simple | 3 | — | — | 14.4 | 14.4 |
+| TASK-032 | media | simple | 3 | 7.9 | 20.9 | 49.6 | 78.4 |
+| TASK-033 | media | media | 2 | 0.3 | 1.7 | 7.0 | 9.0 |
+| TASK-034 | simple | trivial | 1 | — | — | 2.1 | 2.1 |
+| TASK-035 | trivial | simple | 1 | — | — | 0.6 | 0.6 |
+| TASK-036 | simple | trivial | 1 | 0.1 | — | 2.9 | 3.0 |
+| TASK-037 | simple | trivial | 1 | — | — | 1.8 | 1.8 |
+| TASK-038 | simple | trivial | 2 | — | — | 4.7 | 4.7 |
+| TASK-039 | simple | trivial | 1 | — | — | 1.9 | 1.9 |
+| TASK-040 | media | simple | 1 | 0.7 | — | 2.8 | 3.4 |
+| TASK-041 | simple | trivial | 1 | — | — | 1.9 | 1.9 |
+| TASK-042 | simple | trivial | 2 | 0.9 | 5.1 | 2.8 | 8.8 |
+| TASK-043 | media | simple | 1 | 0.8 | — | 2.0 | 2.7 |
+| TASK-044 | media | trivial | 1 | 0.1 | 0.5 | — | 0.6 |
+| TASK-045 | simple | trivial | 1 | 0.6 | — | 5.4 | 5.9 |
+| TASK-046 | trivial | trivial | 1 | — | — | 2.4 | 2.4 |
+| TASK-047 | simple | trivial | 1 | 1.5 | 1.3 | 1.7 | 4.5 |
+| TASK-048 | simple | trivial | 1 | 1.3 | — | 2.5 | 3.9 |
+| TASK-049 | simple | trivial | 1 | 0.4 | — | 1.2 | 1.6 |
+| TASK-050 | media | trivial | 2 | 1.0 | — | 3.2 | 4.1 |
+| TASK-051 | media | simple | 1 | — | — | 1.7 | 1.7 |
+| TASK-052 | media | trivial | 1 | 0.7 | — | 5.6 | 6.3 |
+| TASK-053 | trivial | trivial | 1 | — | — | 2.0 | 2.0 |
+| TASK-054 | simple | trivial | 1 | — | — | 0.9 | 0.9 |
+| TASK-055 | simple | simple | 2 | 1.0 | — | 7.4 | 8.5 |
+| TASK-056 | — | simple | 3 | — | — | 9.3 | 9.3 |
+| TASK-057 | — | simple | 3 | — | — | 6.5 | 6.5 |
+| TASK-058 | — | simple | 3 | — | — | 9.9 | 9.9 |
+| TASK-059 | — | simple | 2 | — | — | 3.9 | 3.9 |
+
+### 11.1 Contraste con la sección 16
+
+- **El gasto está donde la §16 dijo que estaría**, y en ningún otro sitio: el
+  brainstorm, la revisión y las implementaciones delegadas. Todo lo demás es
+  `taskctl`, que no gasta tokens.
+- **Pero la proporción no es la que se intuía.** La revisión se lleva entre
+  el 71 % y el 100 % del gasto de subagentes en todos los niveles de
+  complejidad. El brainstorm, que es la parte que la §16.3 acota por
+  complejidad, queda entre el 0 % y el 12 %. Acotar los roles de brainstorm
+  ahorra poco; lo caro es cada ronda de revisión.
+- **Lo que mejor predice el coste son las rondas.** La correlación de
+  Spearman con el total es de 0,69 para las rondas, 0,54 para la complejidad
+  declarada y 0,52 para los puntos de la heurística (n = 37 a 41). En el
+  periodo homogéneo (TASK-033 en adelante, mismas herramientas y mismos
+  revisores), la media es de 2,6 M con 1 ronda (n = 18), 6,5 M con 2 (n = 6)
+  y 8,5 M con 3 (n = 3).
+
+### 11.2 Revisión de los pesos de la heurística (punto 15 de la sección 14)
+
+En el periodo homogéneo, el coste medio por nivel es este:
+
+- **Heurística:** trivial 3,3 M (n = 17), simple 5,2 M (n = 9), media 9,0 M
+  (n = 1). Es monótona.
+- **Complejidad declarada:** trivial 1,7 M (n = 3), simple 3,8 M (n = 13),
+  media 4,0 M (n = 7). Simple y media cuestan casi lo mismo.
+
+La heurística separa el coste algo mejor que la etiqueta que pone la persona,
+y su corte en `nivel_trivial_hasta: 0` (TASK-052) deja juntas a las tareas
+baratas.
+
+**Decisión: los pesos no se tocan.** Las razones:
+
+1. Los datos no señalan ningún peso concreto que esté mal, solo que el orden
+   que dan los niveles es razonable.
+2. Los niveles media, alta y crítica tienen n ≤ 1 en el periodo homogéneo:
+   no hay muestra con la que mover sus umbrales.
+3. La variable que más explica el coste, las rondas, no se conoce al
+   planificar, así que no puede entrar en la heurística.
+4. El periodo anterior (TASK-016 a TASK-032) no es comparable: revisores
+   generalistas con contextos de 8 a 20 M por pasada. Mezclarlo inflaría el
+   nivel simple, al que pertenecen casi todas esas tareas.
+
+Se revisará cuando haya unas 10 tareas por nivel con `tokens_*` registrados:
+`taskctl metricas --tokens` da ya el resumen por complejidad.
+
+<!-- taskctl metricas --tokens: inicio -->
+## Coste en tokens por tarea (generado)
+
+> Generado por `taskctl metricas --tokens --escribir`. No editar a mano: lo que haya entre
+> los marcadores se sobrescribe.
+
+| id       | sprint | complejidad | tok_diseno | tok_curso | tok_revision | tok_total |
+|----------|--------|-------------|------------|-----------|--------------|-----------|
+| TASK-001 | 0      | simple      | —          | —         | —            | —         |
+| TASK-002 | 0      | media       | —          | —         | —            | —         |
+| TASK-003 | 0      | simple      | —          | —         | —            | —         |
+| TASK-004 | 0      | media       | —          | —         | —            | —         |
+| TASK-005 | 0      | trivial     | —          | —         | —            | —         |
+| TASK-006 | 0      | simple      | —          | —         | —            | —         |
+| TASK-007 | 0      | simple      | —          | —         | —            | —         |
+| TASK-008 | 1      | simple      | —          | —         | —            | —         |
+| TASK-009 | 1      | simple      | —          | —         | —            | —         |
+| TASK-010 | 1      | simple      | —          | —         | —            | —         |
+| TASK-011 | 1      | simple      | —          | —         | —            | —         |
+| TASK-012 | 1      | media       | —          | —         | —            | —         |
+| TASK-013 | 2      | media       | —          | —         | —            | —         |
+| TASK-014 | 2      | media       | —          | —         | —            | —         |
+| TASK-015 | 2      | simple      | —          | —         | —            | —         |
+| TASK-016 | 3      | alta        | —          | —         | —            | —         |
+| TASK-017 | 3      | alta        | —          | —         | —            | —         |
+| TASK-018 | 3      | alta        | —          | —         | —            | —         |
+| TASK-019 | 3      | simple      | —          | —         | —            | —         |
+| TASK-020 | 3      | media       | —          | —         | —            | —         |
+| TASK-021 | 4      | simple      | —          | —         | —            | —         |
+| TASK-022 | 4      | simple      | —          | —         | —            | —         |
+| TASK-023 | 4      | media       | 3445774    | 18803413  | —            | 22249187  |
+| TASK-024 | 2      | simple      | —          | —         | —            | —         |
+| TASK-025 | 2      | media       | —          | —         | —            | —         |
+| TASK-026 | 2      | media       | —          | —         | —            | —         |
+| TASK-027 | 2      | simple      | —          | —         | —            | —         |
+| TASK-028 | 2      | simple      | —          | —         | —            | —         |
+| TASK-029 | 0      | media       | —          | —         | —            | —         |
+| TASK-030 | 0      | media       | —          | —         | —            | —         |
+| TASK-031 | 0      | media       | —          | —         | —            | —         |
+| TASK-032 | 3      | media       | —          | —         | —            | —         |
+| TASK-033 | 0      | media       | —          | —         | —            | —         |
+| TASK-034 | 2      | simple      | —          | —         | —            | —         |
+| TASK-035 | 2      | trivial     | —          | —         | —            | —         |
+| TASK-036 | 2      | simple      | —          | —         | —            | —         |
+| TASK-037 | 3      | simple      | —          | —         | —            | —         |
+| TASK-038 | 3      | simple      | —          | —         | —            | —         |
+| TASK-039 | 3      | simple      | —          | —         | —            | —         |
+| TASK-040 | 4      | media       | —          | —         | —            | —         |
+| TASK-041 | 5      | simple      | —          | —         | —            | —         |
+| TASK-042 | 5      | simple      | —          | —         | —            | —         |
+| TASK-043 | 5      | media       | —          | —         | —            | —         |
+| TASK-044 | 5      | media       | —          | —         | —            | —         |
+| TASK-045 | 6      | simple      | —          | —         | —            | —         |
+| TASK-046 | 6      | trivial     | —          | —         | —            | —         |
+| TASK-047 | 6      | simple      | —          | —         | —            | —         |
+| TASK-048 | 7      | simple      | —          | —         | —            | —         |
+| TASK-049 | 7      | simple      | —          | —         | —            | —         |
+| TASK-050 | 7      | media       | —          | —         | —            | —         |
+| TASK-051 | 7      | media       | —          | —         | —            | —         |
+| TASK-052 | 7      | media       | —          | —         | —            | —         |
+| TASK-053 | 6      | trivial     | —          | —         | —            | —         |
+| TASK-054 | 6      | simple      | —          | —         | —            | —         |
+| TASK-055 | 7      | simple      | —          | —         | —            | —         |
+| TASK-056 | 7      | —           | —          | —         | —            | —         |
+| TASK-057 | 7      | —           | —          | —         | —            | —         |
+| TASK-058 | 7      | —           | —          | —         | —            | —         |
+| TASK-059 | 7      | —           | —          | —         | —            | —         |
+
+### Resumen por sprint
+
+| sprint | con dato/total | diseno                         | curso                            | revision | total (media)             |
+|--------|----------------|--------------------------------|----------------------------------|----------|---------------------------|
+| 0      | 0/11           | —                              | —                                | —        | —                         |
+| 1      | 0/5            | —                              | —                                | —        | —                         |
+| 2      | 0/11           | —                              | —                                | —        | —                         |
+| 3      | 0/9            | —                              | —                                | —        | —                         |
+| 4      | 1/4            | 3445774 (media 3445774, 15.5%) | 18803413 (media 18803413, 84.5%) | —        | 22249187 (media 22249187) |
+| 5      | 0/4            | —                              | —                                | —        | —                         |
+| 6      | 0/5            | —                              | —                                | —        | —                         |
+| 7      | 0/10           | —                              | —                                | —        | —                         |
+
+### Resumen por complejidad declarada
+
+| complejidad | con dato/total | diseno                         | curso                            | revision | total (media)             |
+|-------------|----------------|--------------------------------|----------------------------------|----------|---------------------------|
+| trivial     | 0/4            | —                              | —                                | —        | —                         |
+| simple      | 0/28           | —                              | —                                | —        | —                         |
+| media       | 1/20           | 3445774 (media 3445774, 15.5%) | 18803413 (media 18803413, 84.5%) | —        | 22249187 (media 22249187) |
+| alta        | 0/3            | —                              | —                                | —        | —                         |
+| —           | 0/4            | —                              | —                                | —        | —                         |
+
+Tokens procesados (entrada + cache + salida) por fase; «curso» es la implementacion. «—» = sin registrar (no es 0). Los resumenes solo cuentan tareas con algun dato (con dato/total): las demas salen en la tabla y no en el resumen. Cada media es sobre las tareas que tienen esa fase; el % es de la fase sobre el total del grupo.
+<!-- taskctl metricas --tokens: fin -->
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index a9bbc6c..2e574ad 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -533,3 +533,34 @@ la tarea no la tiene, los commits automáticos `chore(TASK-NNN): ...` con un
 puntuación y el nivel de la heurística de complejidad vigente, más un
 resumen de rondas medias por nivel declarado y heurístico: es la tabla con
 la que se calibra `scripts/heuristica-complejidad.yml`.
+
+`taskctl metricas --tokens` añade las columnas de coste en tokens por fase
+(`tok_diseno`, `tok_curso` = implementación, `tok_revision`, `tok_total`; «—»
+si no hay dato, que no es 0) y, debajo, un resumen por sprint y por
+complejidad declarada: tareas con dato / total, suma y media por fase y el %
+de cada fase sobre el total. Las tareas sin ningún dato salen en la tabla y no
+entran en el resumen. Se combina con `--heuristica` (el resumen es entonces
+sobre la muestra). `taskctl metricas --tokens --escribir` regenera en
+`docs/METRICAS.md` solo el bloque entre `<!-- taskctl metricas --tokens: inicio -->`
+y `<!-- taskctl metricas --tokens: fin -->` (si no están, los añade al final;
+el resto del fichero, CRLF incluido, no cambia ni un byte) y no lo commitea,
+como `board --escribir`. No se combina con `--heuristica`.
+
+`taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision
+(--agente <id>... | --tokens N) [--push]` **suma** al coste de esa fase
+(`tokens_diseno`, `tokens_implementacion`, `tokens_revision` del `tarea.md`;
+`null` = sin registrar y solo cuenta como 0 al sumar). `taskctl` no ve el
+consumo del agente, así que lo registra quien lo ve. **La cifra que Claude Code
+muestra al terminar un subagente no es lo que ha gastado: es el tamaño de su
+contexto final.** Con `--agente <id>` (repetible; el `agentId` que devuelve la
+herramienta Agent) `taskctl` lee la transcripción del subagente en
+`<config>/projects/*/*/subagents/agent-<id>.jsonl` (`<config>` = `CLAUDE_CONFIG_DIR`
+o `~/.claude`) y suma, por `message.id` único (la última aparición), entrada +
+escritura y lectura de caché + salida de cada llamada. Varios `--agente` van en
+un solo registro y un solo commit. `--tokens N` da una cifra a mano (la parte del
+orquestador, estimada) y se excluye con `--agente`. Si el id no se encuentra, está
+en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué hacer
+(`--tokens N` como salida). Funciona en cualquier estado, también `terminada`;
+escribe y commitea solo ese `tarea.md` (aborta si tiene cambios sin commitear o si
+la copia al día de la tarea está en su rama) y rechaza cifras de 0. `taskctl finish`
+avisa, sin bloquear, si falta el coste de diseño o de revisión.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
index baea04d..68e99b9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
@@ -18,7 +18,13 @@ Mergea la rama de la tarea (sin borrarla) y la deja en `terminada`.
    una seccion `## Resultado` con lo implementado, lo que encontro la
    revision y lo que se decidio no corregir. Si falta, completalo y
    commitealo antes.
-3. Desde la rama de la tarea (si estas en otra: `git checkout <rama>` del
+3. Si `taskctl finish` avisa de que falta el coste de diseno o de revision y lo
+   tienes (los ids de los subagentes de esa fase), registralo con
+   `taskctl registrar-coste TASK-NNN --fase diseno|revision --agente <id>`
+   (`task-workflow/coste.md`; la cifra que muestra Claude Code al terminar un
+   agente no es su coste); el aviso no bloquea y tambien se puede registrar
+   despues del cierre.
+   Desde la rama de la tarea (si estas en otra: `git checkout <rama>` del
    `tarea.md`; desde la rama base `finish` lee la copia vieja y aborta),
    ejecuta `taskctl finish TASK-NNN` (el ID viene en `$ARGUMENTS`). Solo
    cierra si el ultimo informe aprueba; si no, muestra el error tal cual.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
index cd49dfa..b5353fe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
@@ -67,7 +67,12 @@ no deberian necesitar volver a preguntar.
 5. Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
    anota las respuestas en el propio plan. Si la salida de `taskctl plan`
    nombro `skills_recomendados`, dejalos anotados para la implementacion.
-6. Commitea lo escrito en la carpeta de la tarea
+6. Registra el coste del diseno (`task-workflow/coste.md`): con el id que
+   devolvio la herramienta Agent de cada subagente de esta ronda (roles,
+   unificador), `taskctl registrar-coste TASK-NNN --fase diseno --agente <id>
+   [--agente <id2>...]`. La cifra que muestra Claude Code al terminar un agente
+   NO es su coste (es su contexto final). Tu parte, si quieres, estimada y
+   aparte con `--tokens N`. Sin agentes, no registres nada. Commitea lo escrito en la carpeta de la tarea
    (`git add <carpeta de la tarea> && git commit -m "docs(TASK-NNN): plan final"`).
    Los comandos siguientes exigen el workspace limpio.
 7. Sigue la seccion de avance (`task-workflow/avance.md`):
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index 257cef3..4bb17fb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -35,7 +35,14 @@ punto, no un formalismo.
    rellenar no cuenta como revisado,
    y commitealo **solo, en un commit que no toque nada mas**: en modo
    automatico, `finish` no sigue solo si un informe va mezclado con codigo.
-4. Escribe cada veredicto con el comando, no a mano:
+4. Registra el coste de la revision (`task-workflow/coste.md`): suma el total de
+   tokens: con el id que devolvio la herramienta Agent de cada revisor,
+   `taskctl registrar-coste TASK-NNN --fase revision --agente <id>
+   [--agente <id2>...]` (una vez por ronda; suma). La cifra que muestra Claude
+   Code al terminar un agente NO es su coste (es su contexto final). Tu parte,
+   si quieres, estimada y aparte con `--tokens N`. Es un commit propio: hazlo
+   despues de commitear los informes.
+   Escribe cada veredicto con el comando, no a mano:
    `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`.
    Si la ronda esta fragmentada, uno por informe, con el nombre de fichero
    completo: `--informe informe-revision-N-<revisor>.md`. Con CRITICO o
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
index fd0dca7..ecf9f0b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -23,10 +23,16 @@ Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
    `fase: review` con `accion: continuar`):
    implementa el plan en esta rama, con sus tests y con los skills
    recomendados; commitea; ejecuta la suite del proyecto y no sigas hasta que
-   este en verde. Despues encadena `/taskcode-plugin:review` (seccion de
+   este en verde. Registra el coste (paso 5) y despues encadena `/taskcode-plugin:review` (seccion de
    avance). Si no consigues dejar la suite en verde, para y dilo: no se revisa
    codigo roto.
-5. En el resto de casos, sigue la seccion de avance (`task-workflow/avance.md`):
+5. Al terminar la implementacion (con o sin subagentes) y antes de la revision, registra su coste
+   (`task-workflow/coste.md`): con el id que devolvio la herramienta Agent de
+   cada subagente, `taskctl registrar-coste TASK-NNN --fase implementacion
+   --agente <id> [--agente <id2>...]`. La cifra que muestra Claude Code al
+   terminar un agente NO es su coste (es su contexto final). Tu parte, si
+   quieres, estimada y aparte con `--tokens N`. Sin subagentes, no registres nada.
+6. En el resto de casos, sigue la seccion de avance (`task-workflow/avance.md`):
    `taskctl siguiente TASK-NNN --json`. Tras `start` la fase es `review`,
    que significa: primero implementar el plan en esta rama, con tests,
    commitearlo y dejar la suite en verde; despues,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 1137e23..afec6bf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -76,7 +76,7 @@ taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release>
 taskctl import <fichero.md> [--tipo ...] [--sprint N] [--complejidad ...]   # `> texto` bajo el ### = Objetivo
 taskctl board [--sprint N] [--asignado-a <persona>]
 taskctl board --escribir          # no se combina con los filtros de arriba
-taskctl metricas [--heuristica]   # duracion de cada fase y rondas por tarea; solo lee
+taskctl metricas [--heuristica] [--tokens [--escribir]]   # duracion y coste por fase; solo lee salvo --escribir
 taskctl plan    TASK-NNN [--asignado-a <persona>]
 taskctl approve TASK-NNN [--decidido-por persona|automatico]
 taskctl start   TASK-NNN [--asignado-a <persona>]
@@ -87,6 +87,7 @@ taskctl finish  TASK-NNN
 
 taskctl siguiente TASK-NNN [--json]   # que fase toca y si preguntar; solo lee
 taskctl pausa     TASK-NNN            # registra un «no seguir todavia», sin cambiar el estado
+taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision (--agente <id>... | --tokens N)
 taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar
                   # con una cadena abierta, los comandos que escriben exigen --cadena <testigo>
 
@@ -243,6 +244,10 @@ la puerta determinista, la clasificacion CRITICO / IMPORTANTE / MENOR, las
 rondas, la plantilla del informe y la linea del veredicto que `finish` acepta,
 con su tabla. Es el mismo fichero que siguen las skills revisoras.
 
+## Coste en tokens
+
+Al terminar cada subagente de una fase, registra su id con `--agente`: la cifra que Claude Code muestra al terminar NO es su coste. Detalle: [coste.md](coste.md).
+
 ## Trampas que cuestan tiempo
 
 Cuando un comando de `taskctl` o un script de Git-Flow falle de forma rara (se
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
new file mode 100644
index 0000000..729b40a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
@@ -0,0 +1,62 @@
+# Registrar el coste en tokens de cada fase
+
+`taskctl` no llama a ningun modelo y no ve lo que gasta el agente que lo
+orquesta: el coste lo registra quien lo ve, la sesion del agente, al terminar
+cada fase en la que hubo agentes.
+
+## Que cifra vale
+
+**La cifra que Claude Code muestra al terminar un subagente NO es lo que ha
+gastado**: es el tamano de su contexto final. Lo gastado es la suma del uso de
+todas las llamadas que hizo, y esa suma la calcula `taskctl` leyendo la
+transcripcion del subagente. Por eso no se apunta la cifra de la notificacion:
+se apunta el **id del agente** (`agentId`, hexadecimal), que devuelve la
+herramienta Agent al lanzarlo.
+
+## Como se registra
+
+Al terminar cada subagente de la fase (diseno = la ronda de roles y el
+unificador; implementacion = los agentes del curso de la tarea; revision =
+revisores y segunda opinion), con su id:
+
+```bash
+taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision --agente <id>
+taskctl registrar-coste TASK-NNN --fase revision --agente <id1> --agente <id2>   # varios, un solo registro
+```
+
+La parte del propio orquestador (lo que leiste, escribiste y razonaste fuera
+de los subagentes) no tiene transcripcion que leer: si quieres registrarla,
+estimala y dala aparte, en otra llamada (`--agente` y `--tokens` no se
+combinan):
+
+```bash
+taskctl registrar-coste TASK-NNN --fase diseno --tokens N
+```
+
+Todo **suma** sobre lo que ya hubiera. `N` es un entero positivo (tokens
+procesados: entrada, cache y salida, sin separadores); `0` se rechaza: si la
+fase no tuvo agentes, no registres nada y queda «sin dato», que no es lo mismo
+que cero.
+
+Las transcripciones se buscan en `projects/*/*/subagents/agent-<id>.jsonl`
+bajo el directorio de configuracion de Claude Code (`CLAUDE_CONFIG_DIR` si
+esta definida, si no la carpeta `.claude` del usuario). Si el comando no encuentra el id, lo
+encuentra en mas de una sesion o la transcripcion no tiene el formato esperado,
+dice que hacer: la salida de emergencia es `--tokens N` con tu estimacion, y
+dilo como estimacion en el `## Resultado`.
+
+## Cuando
+
+- **diseno**: al terminar la ronda de diseno, antes de `taskctl approve`.
+- **implementacion**: al terminar de implementar, antes de pedir la revision.
+- **revision**: cuando terminan los revisores de la ronda; si hay varias
+  rondas, se va sumando. Funciona tambien con la tarea ya `terminada`.
+
+Escribe y commitea solo el `tarea.md` de la tarea: con ese fichero a medias
+en el arbol aborta, y desde la rama base aborta si la tarea vive en su rama
+(dice a cual cambiar). Con una cadena abierta exige `--cadena <testigo>`.
+
+`taskctl finish` avisa, sin bloquear, si falta el coste de diseno o de
+revision. `taskctl metricas --tokens` lo tabula por tarea, por sprint y por
+complejidad; con `--escribir` regenera un bloque delimitado del fichero de
+metricas del proyecto, sin tocar el resto.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 70b2e22..040f3f5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -19,6 +19,7 @@ import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { runSiguienteCommand, SiguienteCommandError } from './commands/siguiente.js';
 import { runPausaCommand, PausaCommandError } from './commands/pausa.js';
+import { runRegistrarCosteCommand, RegistrarCosteCommandError } from './commands/registrar-coste.js';
 import {
   runCadenaCommand,
   CadenaCommandError,
@@ -68,7 +69,7 @@ Uso:
                  [--sprint N] [--complejidad ...] [--modelo-sugerido ...] \\
                  [--agente-revisor ...]
   taskctl board [--sprint N] [--asignado-a <persona>] [--escribir]
-  taskctl metricas [--heuristica]
+  taskctl metricas [--heuristica] [--tokens [--escribir]]
   taskctl start TASK-NNN [--asignado-a <persona>] [--push]
   taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
   taskctl approve TASK-NNN [--decidido-por persona|automatico] [--push]
@@ -79,6 +80,8 @@ Uso:
   taskctl finish TASK-NNN [--push]
   taskctl siguiente TASK-NNN [--json]
   taskctl pausa TASK-NNN [--push]
+  taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> \\
+                          (--agente <id>... | --tokens N) [--push]
   taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar
   taskctl diagnose
   taskctl pause [--push]
@@ -87,10 +90,16 @@ Uso:
   taskctl abort-merge
 
 Comandos: new, import, board, metricas, start, plan, approve, review, codex-review, veredicto,
-finish, siguiente, pausa, cadena.
+finish, siguiente, pausa, registrar-coste, cadena.
 metricas saca, por tarea, cuanto duro cada fase (diseno, curso, revision) y
 cuantas rondas de revision hubo; --heuristica compara la complejidad declarada
-con la que da la heuristica en las tareas terminadas. Solo lee.
+con la que da la heuristica en las tareas terminadas. --tokens anade el coste en
+tokens por fase y un resumen por sprint y por complejidad; con --escribir lo
+regenera en el bloque delimitado de docs/METRICAS.md (sin commitear). Sin
+--escribir solo lee.
+registrar-coste SUMA al coste de una fase de la tarea (en cualquier estado) y lo commitea:
+--agente <id> lee lo gastado de la transcripcion de cada subagente (el id lo devuelve la
+herramienta Agent); --tokens N da una cifra a mano. Se excluyen, y 0 se rechaza.
 siguiente dice que fase toca y si preguntar segun modo_flujo (.taskcode/config.yml:
 manual, semiautomatico o automatico); solo lee. pausa registra que la persona
 no quiere pasar todavia a la siguiente fase. cadena bloquea el arbol mientras
@@ -471,6 +480,13 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       } else {
         process.stdout.write(`${result.output}\n`);
       }
+      if (result.metricasPath !== null) {
+        process.stdout.write(
+          result.escritura === 'sin-cambios'
+            ? `\nBloque de tokens de ${result.metricasPath} ya al dia: sin cambios.\n`
+            : `\nRegenerado el bloque de tokens de ${result.metricasPath} (recuerda commitearlo).\n`
+        );
+      }
       return 0;
     } catch (e) {
       if (e instanceof MetricasCommandError || e instanceof HeuristicaError) {
@@ -722,6 +738,32 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'registrar-coste') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const r = await runRegistrarCosteCommand(tareasRoot, argv.slice(1), { repoCwd });
+      process.stdout.write(
+        `Tarea ${r.id}: +${String(r.sumado)} tokens de ${r.fase}${r.agentes > 0 ? ` (${String(r.agentes)} subagente(s))` : ''}; total de la fase: ${String(r.total)} ` +
+          `(${r.filePath}).\n`
+      );
+      printAutoCommit(r.autoCommit);
+      return 0;
+    } catch (e) {
+      if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
+        e instanceof RegistrarCosteCommandError ||
+        e instanceof GitLaunchError ||
+        e instanceof GitCommandError
+      ) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   if (cmd === 'veredicto') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
index 50a4037..e1486f6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
@@ -189,6 +189,7 @@ export const GUARDADOS_POR_CADENA: ReadonlySet<string> = new Set([
   'veredicto',
   'finish',
   'pausa',
+  'registrar-coste',
   'pause',
   'resume',
   'recover',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 64a2acc..f68c305 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -279,6 +279,22 @@ export async function runFinishCommand(
         'la tarea se cierra igualmente (el veredicto del revisor es la puerta).'
     );
   }
+  // TASK-023: avisar, sin bloquear (misma doctrina que el aviso de arriba),
+  // de las fases con LLM sin coste registrado. tokens_implementacion no avisa:
+  // puede no haber habido subagentes en el curso.
+  const sinCoste = (
+    [
+      ['diseno', initial.task.tokens_diseno],
+      ['revision', initial.task.tokens_revision],
+    ] as const
+  ).filter(([, v]) => v === null);
+  for (const [fase] of sinCoste) {
+    deps.onAviso?.(
+      `${id}: sin coste de ${fase} registrado (tokens_${fase}). Registralo con ` +
+        `taskctl registrar-coste ${id} --fase ${fase} --tokens N (suma el uso de cada subagente ` +
+        'de la fase mas una estimacion de la parte propia); la tarea se cierra igualmente.'
+    );
+  }
   const tipo = initial.task.tipo;
   const rama = initial.task.rama;
   const titulo = initial.task.titulo;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index 23442aa..d58e0bd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -12,9 +12,16 @@
  * vigente a las tareas terminadas con informes de revision (las demas no
  * entran en la muestra), y un resumen por nivel declarado y heuristico con
  * las rondas medias: es la tabla con la que se recalibra el YML.
+ *
+ * `--tokens` (TASK-023) anade las columnas de coste en tokens por fase y,
+ * debajo, un resumen por sprint y por complejidad declarada. Con
+ * `--escribir` regenera ademas, en docs/METRICAS.md, SOLO el bloque entre
+ * sus dos marcadores HTML (sin commitear, como `board --escribir`: lo
+ * commitea quien lo pide, o el siguiente comando que commitee ese fichero).
+ * Es lo unico que este comando escribe, y solo con `--escribir`.
  */
 import path from 'node:path';
-import { readdir } from 'node:fs/promises';
+import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
 import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
 import { TaskValidationError, TASK_COMPLEXITIES } from '../core/task.js';
@@ -23,6 +30,12 @@ import { leerTransiciones } from '../core/transiciones.js';
 import {
   COLUMNAS_HEURISTICA,
   COLUMNAS_METRICAS,
+  COLUMNAS_TOKENS,
+  BloqueTokensError,
+  NOTA_TOKENS,
+  renderBloqueTokens,
+  resumenesTokens,
+  sustituirBloqueTokens,
   calcularFila,
   enMuestraHeuristica,
   formatearResumen,
@@ -38,13 +51,22 @@ import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';
 
 export class MetricasCommandError extends Error {}
 
-export const FLAGS_METRICAS: readonly string[] = ['--heuristica'];
+export const FLAGS_METRICAS: readonly string[] = ['--heuristica', '--tokens', '--escribir'];
+
+/** Ruta de docs/METRICAS.md dentro del repo del usuario. */
+export function metricasFilePath(repoCwd: string): string {
+  return path.join(repoCwd, 'docs', 'METRICAS.md');
+}
 
 export interface MetricasCommandResult {
   /** Vacio solo cuando no hay ni una tarea que leer. */
   output: string;
   totalTareas: number;
   advertencias: string[];
+  /** Ruta de docs/METRICAS.md si se paso --escribir; null si no. */
+  metricasPath: string | null;
+  /** Que paso con el bloque: 'sin-cambios' si regenerarlo no cambio ni un byte. */
+  escritura: 'creado' | 'actualizado' | 'sin-cambios' | null;
 }
 
 /** MENOR-2 de la revision: hay tareas, pero ninguna entra en la muestra. */
@@ -64,7 +86,24 @@ const NOTA_CALENDARIO =
   'revision = primer review->finish. Las pausas no se descuentan. Con origen "registro" ' +
   'de filas antiguas (solo el dia) o mezcladas, la duracion va en dias ("N d").';
 
-function parseHeuristicaFlag(argv: readonly string[]): boolean {
+interface FlagsMetricas {
+  heuristica: boolean;
+  tokens: boolean;
+  escribir: boolean;
+}
+
+function flagSuelto(flags: Record<string, string | boolean>, nombre: string): boolean {
+  const raw = flags[nombre];
+  if (raw === undefined) return false;
+  if (raw !== true) {
+    throw new MetricasCommandError(
+      `[ERROR] --${nombre} no lleva valor: usalo suelto (taskctl metricas --${nombre}).`
+    );
+  }
+  return true;
+}
+
+function parseFlagsMetricas(argv: readonly string[]): FlagsMetricas {
   const { flags, positional } = parseArgs(argv);
   if (positional.length > 0) {
     throw new MetricasCommandError(
@@ -72,14 +111,28 @@ function parseHeuristicaFlag(argv: readonly string[]): boolean {
         'Saca la tabla de todas las tareas; para una sola, filtra la salida.'
     );
   }
-  const raw = flags['heuristica'];
-  if (raw === undefined) return false;
-  if (raw !== true) {
+  const f = {
+    heuristica: flagSuelto(flags, 'heuristica'),
+    tokens: flagSuelto(flags, 'tokens'),
+    escribir: flagSuelto(flags, 'escribir'),
+  };
+  if (f.escribir && !f.tokens) {
     throw new MetricasCommandError(
-      '[ERROR] --heuristica no lleva valor: usalo suelto (taskctl metricas --heuristica).'
+      '[ERROR] --escribir solo se admite con --tokens: lo que regenera es el bloque de coste en ' +
+        'tokens de docs/METRICAS.md (taskctl metricas --tokens --escribir).'
     );
   }
-  return true;
+  // Como board: docs/METRICAS.md lleva la tabla COMPLETA; con la muestra de
+  // --heuristica (solo terminadas con informes) dejaria un bloque parcial que
+  // parece el entero.
+  if (f.escribir && f.heuristica) {
+    throw new MetricasCommandError(
+      '[ERROR] --escribir no se puede combinar con --heuristica: el bloque de docs/METRICAS.md ' +
+        'lleva todas las tareas, y --heuristica las reduce a las terminadas con informes. ' +
+        'Quita --heuristica, o quita --escribir para verlo por pantalla.'
+    );
+  }
+  return f;
 }
 
 async function nombresDeRevision(dirTarea: string): Promise<string[]> {
@@ -107,7 +160,21 @@ export async function runMetricasCommand(
   deps: MetricasCommandDeps
 ): Promise<MetricasCommandResult> {
   rechazarFlagsDesconocidos(argv, FLAGS_METRICAS, 'metricas', (m) => new MetricasCommandError(m));
-  const conHeuristica = parseHeuristicaFlag(argv);
+  const { heuristica: conHeuristica, tokens: conTokens, escribir } = parseFlagsMetricas(argv);
+  // Como board --escribir: sin tareas/ en este directorio no se crea un
+  // docs/METRICAS.md fantasma.
+  if (escribir) {
+    try {
+      await stat(tareasRoot);
+    } catch (e: unknown) {
+      if (!isEnoent(e)) throw e;
+      throw new MetricasCommandError(
+        `[ERROR] No existe "${tareasRoot}", asi que esto no parece la raiz de un repo con tareas. ` +
+          'Ejecuta "taskctl metricas --tokens --escribir" desde la raiz del repo (donde esta la ' +
+          'carpeta "tareas"), no desde una subcarpeta.'
+      );
+    }
+  }
   // La heuristica se carga ANTES de leer nada: un YML roto aborta sin
   // haber sacado media tabla.
   const h = conHeuristica ? cargarHeuristica(deps.rutaHeuristica) : null;
@@ -162,13 +229,57 @@ export async function runMetricasCommand(
     })
   );
 
-  if (filas.length === 0) return { output: '', totalTareas: 0, advertencias };
+  if (filas.length === 0) return { output: '', totalTareas: 0, advertencias, metricasPath: null, escritura: null };
+
+  const columnas = conTokens ? [...COLUMNAS_METRICAS, ...COLUMNAS_TOKENS] : COLUMNAS_METRICAS;
+  /** Los resumenes de tokens sobre las filas que salgan (con --heuristica, la muestra). */
+  const seccionTokens = (f: readonly FilaMetricas[]): string[] => {
+    if (!conTokens) return [];
+    const r = resumenesTokens(f);
+    return ['Coste en tokens por sprint:', r.porSprint, '', 'Coste en tokens por complejidad declarada:', r.porComplejidad, '', NOTA_TOKENS, ''];
+  };
+
+  let metricasPath: string | null = null;
+  let escritura: MetricasCommandResult['escritura'] = null;
+  if (escribir) {
+    if (advertencias.length > 0) {
+      throw new MetricasCommandError(
+        '[ERROR] No se regenera docs/METRICAS.md con tarea.md invalidos: saldrian del bloque ' +
+          `sin que nadie lo vea. Arregla esto y reintenta:\n  ${advertencias.join('\n  ')}`
+      );
+    }
+    metricasPath = metricasFilePath(deps.repoCwd);
+    try {
+      let actual = '';
+      try {
+        actual = await readFile(metricasPath, 'utf8');
+      } catch (e: unknown) {
+        if (!isEnoent(e)) throw e;
+      }
+      const nuevo = sustituirBloqueTokens(actual, renderBloqueTokens(filas));
+      if (nuevo === actual) {
+        escritura = 'sin-cambios';
+      } else {
+        await mkdir(path.dirname(metricasPath), { recursive: true });
+        await writeFile(metricasPath, nuevo, 'utf8');
+        escritura = actual === '' ? 'creado' : 'actualizado';
+      }
+    } catch (e: unknown) {
+      if (e instanceof BloqueTokensError) throw new MetricasCommandError(e.message);
+      const msg = e instanceof Error ? e.message : String(e);
+      throw new MetricasCommandError(
+        `No se pudo escribir ${metricasPath}: ${msg}. Comprueba permisos y que "docs" sea una carpeta.`
+      );
+    }
+  }
 
   if (h === null) {
     return {
-      output: `${formatearTabla(filas, COLUMNAS_METRICAS)}\n\n${NOTA_CALENDARIO}`,
+      output: [formatearTabla(filas, columnas), '', ...seccionTokens(filas), NOTA_CALENDARIO].join('\n'),
       totalTareas: filas.length,
       advertencias,
+      metricasPath,
+      escritura,
     };
   }
 
@@ -178,10 +289,12 @@ export async function runMetricasCommand(
     const { puntos } = puntuarTarea(leida.task, leida.body, h);
     return { ...f, heuristica: { puntos, nivel: nivelHeuristico(puntos, h) } };
   });
-  if (filas.length === 0) return { output: MUESTRA_HEURISTICA_VACIA, totalTareas: 0, advertencias };
+  if (filas.length === 0) {
+    return { output: MUESTRA_HEURISTICA_VACIA, totalTareas: 0, advertencias, metricasPath, escritura };
+  }
   const coinciden = filas.filter((f) => f.heuristica?.nivel === f.complejidad).length;
   const salida = [
-    formatearTabla(filas, [...COLUMNAS_METRICAS, ...COLUMNAS_HEURISTICA]),
+    formatearTabla(filas, [...columnas, ...COLUMNAS_HEURISTICA]),
     '',
     `Muestra: ${String(filas.length)} tareas terminadas con informes de revision ` +
       '(rondas = numero de la ultima ronda; las tareas sin revision/ no entran). ' +
@@ -194,7 +307,8 @@ export async function runMetricasCommand(
       resumirPorNivel(filas, (f) => f.heuristica?.nivel ?? null, TASK_COMPLEXITIES)
     ),
     '',
+    ...seccionTokens(filas),
     NOTA_CALENDARIO,
   ].join('\n');
-  return { output: salida, totalTareas: filas.length, advertencias };
+  return { output: salida, totalTareas: filas.length, advertencias, metricasPath, escritura };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index b9f7716..8b9d816 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -269,6 +269,11 @@ export function buildNewTask(id: string, opts: NewTaskOptions, today: string): T
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    // Como ultimo_commit_revisado: null explicito al nacer, para que los
+    // campos se vean en el fichero y registrar-coste tenga donde sumar.
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: today,
     actualizado: today,
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
new file mode 100644
index 0000000..dabcbfb
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
@@ -0,0 +1,272 @@
+/**
+ * `taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision>
+ *  (--agente <id>... | --tokens N) [--push]` — TASK-023.
+ *
+ * Suma al coste en tokens de una fase de la tarea (`tokens_diseno`,
+ * `tokens_implementacion` o `tokens_revision` de su tarea.md) y lo commitea.
+ * `taskctl` no ve el consumo del agente: lo registra quien lo ve.
+ *
+ * Dos formas de dar la cifra, excluyentes y una obligatoria:
+ *  - `--agente <id>` (repetible): el agentId que devuelve la herramienta
+ *    Agent. La cifra se lee de la transcripcion del subagente
+ *    (`core/coste-transcripcion.ts`): lo que gasto de verdad, no el tamano
+ *    de su contexto final, que es lo que muestra al terminar. Varios
+ *    `--agente` se suman en un solo registro y un solo commit.
+ *  - `--tokens N`: una cifra a mano (la parte del orquestador, estimada).
+ *
+ * Reglas:
+ * 1. SUMA, no sobrescribe: una fase se registra en varias llamadas. `null`
+ *    solo cuenta como 0 al sumar; las otras fases quedan como estaban (null
+ *    sigue siendo «nadie lo registro», que no es lo mismo que 0).
+ * 2. Funciona en cualquier estado, tambien `terminada`: el coste de la
+ *    revision se conoce cuando la tarea ya esta casi o del todo cerrada.
+ *    Por eso no pasa por la maquina de estados, y no cambia el estado ni
+ *    `actualizado`.
+ * 3. Escribe y commitea SOLO ese tarea.md. Mismas precondiciones que
+ *    `pausa`: la rama de la tarea es donde esta al dia (si no, aborta y dice
+ *    a cual cambiar), y el propio tarea.md no puede tener cambios sin
+ *    commitear (el commit se los llevaria). Lo demas del arbol no importa:
+ *    el commit es pathspec-limitado.
+ * 4. Una cifra de 0 se rechaza: registrar nada no tiene sentido y dejaria un
+ *    commit que parece un registro.
+ */
+import { writeFile } from 'node:fs/promises';
+import { rechazarFlagsDesconocidos, parseArgs } from '../cli/args.js';
+import { readTareaFile } from '../fs/task-store.js';
+import { serializeTareaFile } from '../core/tarea-file.js';
+import type { Task } from '../core/task.js';
+import { esAgentIdValido, sumarUsoTranscripcion } from '../core/coste-transcripcion.js';
+import { buscarTranscripciones, directorioConfigClaude, leerTranscripcion } from '../fs/transcripciones.js';
+import { currentBranch, isAncestor, localBranchExists, runGit } from '../fs/git.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
+
+export class RegistrarCosteCommandError extends Error {}
+
+/** Flags de `taskctl registrar-coste`: --fase, --tokens y --agente, mas extraerPushFlag. */
+export const FLAGS_REGISTRAR_COSTE: readonly string[] = ['--fase', '--tokens', '--agente', '--push', '-p'];
+
+/** Fase → campo de la tarea donde se acumula su coste. */
+export const CAMPO_COSTE_POR_FASE = {
+  diseno: 'tokens_diseno',
+  implementacion: 'tokens_implementacion',
+  revision: 'tokens_revision',
+} as const;
+
+export type FaseCoste = keyof typeof CAMPO_COSTE_POR_FASE;
+export const FASES_COSTE = Object.keys(CAMPO_COSTE_POR_FASE) as FaseCoste[];
+
+export interface RegistrarCosteCommandDeps {
+  repoCwd: string;
+  /** Directorio de configuracion de Claude Code (tests); por defecto CLAUDE_CONFIG_DIR o ~/.claude. */
+  configDir?: string;
+}
+
+export interface RegistrarCosteCommandResult {
+  id: string;
+  fase: FaseCoste;
+  /** Lo que se ha sumado en esta llamada. */
+  sumado: number;
+  /** El total de la fase tras sumar. */
+  total: number;
+  /** Cuantos subagentes se han leido de su transcripcion (0 con --tokens). */
+  agentes: number;
+  filePath: string;
+  autoCommit: AutoCommitResult;
+}
+
+const USO =
+  'Uso: taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> ' +
+  '(--agente <id> [--agente <id2>...] | --tokens N) [--push]';
+
+/** Saca todos los `--agente <id>` / `--agente=<id>` de argv. */
+function extraerAgentes(argv: readonly string[]): { agentes: string[]; resto: string[] } {
+  const agentes: string[] = [];
+  const resto: string[] = [];
+  for (let i = 0; i < argv.length; i++) {
+    const arg = argv[i] as string;
+    if (arg === '--agente') {
+      const valor = argv[i + 1];
+      if (valor === undefined || valor.startsWith('--')) {
+        throw new RegistrarCosteCommandError(
+          `[ERROR] --agente necesita el id del subagente (el que devuelve la herramienta Agent). ${USO}`
+        );
+      }
+      agentes.push(valor);
+      i++;
+    } else if (arg.startsWith('--agente=')) {
+      agentes.push(arg.slice('--agente='.length));
+    } else {
+      resto.push(arg);
+    }
+  }
+  return { agentes, resto };
+}
+
+/** Devuelve la fase y, si se dio, los tokens (entero > 0), o lanza con lo que hay que hacer. */
+function leerFaseYTokens(
+  flags: Record<string, string | boolean>,
+  hayAgentes: boolean
+): { fase: FaseCoste; tokens: number | null } {
+  const fase = flags['fase'];
+  if (typeof fase !== 'string' || !Object.hasOwn(CAMPO_COSTE_POR_FASE, fase)) {
+    throw new RegistrarCosteCommandError(
+      `[ERROR] --fase ${typeof fase === 'string' ? `"${fase}" no reconocida` : 'ausente'}. ` +
+        `Fases: ${FASES_COSTE.join(', ')}. ${USO}`
+    );
+  }
+  const crudo = flags['tokens'];
+  if (crudo === undefined) {
+    if (!hayAgentes) {
+      throw new RegistrarCosteCommandError(
+        `[ERROR] Falta el coste: pasa --agente <id> (lee la transcripcion del subagente) o --tokens N. ${USO}`
+      );
+    }
+    return { fase: fase as FaseCoste, tokens: null };
+  }
+  if (hayAgentes) {
+    throw new RegistrarCosteCommandError(
+      `[ERROR] --tokens y --agente se excluyen entre si: usa uno solo (para sumar las dos cosas, ` +
+        `dos llamadas a registrar-coste). ${USO}`
+    );
+  }
+  if (typeof crudo !== 'string' || !/^\d+$/.test(crudo)) {
+    throw new RegistrarCosteCommandError(
+      `[ERROR] --tokens ${typeof crudo === 'string' ? `"${crudo}" no es` : 'falta:'} ` +
+        `un entero positivo (tokens procesados, sin separadores: 48213). ${USO}`
+    );
+  }
+  const tokens = Number(crudo);
+  if (!Number.isSafeInteger(tokens)) {
+    throw new RegistrarCosteCommandError(`[ERROR] --tokens "${crudo}" es demasiado grande. ${USO}`);
+  }
+  if (tokens === 0) {
+    throw new RegistrarCosteCommandError(
+      '[ERROR] --tokens 0: registrar nada no tiene sentido. Si la fase no gasto tokens, no ' +
+        `registres nada (queda sin dato); si los gasto, pasa la cifra real. ${USO}`
+    );
+  }
+  return { fase: fase as FaseCoste, tokens };
+}
+
+/** Suma lo que gasto cada subagente segun su transcripcion; falla diciendo que hacer. */
+async function tokensDeAgentes(agentes: readonly string[], configDir: string): Promise<number> {
+  const unicos = [...new Set(agentes)];
+  for (const id of unicos) {
+    if (!esAgentIdValido(id)) {
+      throw new RegistrarCosteCommandError(
+        `[ERROR] --agente "${id}" no es un id de subagente valido (hexadecimal, el que devuelve la ` +
+          `herramienta Agent). ${USO}`
+      );
+    }
+  }
+  let total = 0;
+  for (const id of unicos) {
+    const rutas = await buscarTranscripciones(configDir, id);
+    const donde = `${configDir}/projects/*/*/subagents/agent-${id}.jsonl`;
+    if (rutas.length === 0) {
+      throw new RegistrarCosteCommandError(
+        `[ERROR] No se encuentra la transcripcion del subagente ${id}: se ha buscado ${donde}. ` +
+          'Si Claude Code guarda su configuracion en otro sitio, define CLAUDE_CONFIG_DIR; y si la ' +
+          'transcripcion ya no existe, registra la cifra a mano con --tokens N. No se ha tocado nada.'
+      );
+    }
+    if (rutas.length > 1) {
+      throw new RegistrarCosteCommandError(
+        `[ERROR] El subagente ${id} aparece en mas de una sesion, asi que no se sabe cual es:\n  ` +
+          `${rutas.join('\n  ')}\nBorra las copias que sobren o registra la cifra a mano con ` +
+          '--tokens N. No se ha tocado nada.'
+      );
+    }
+    const uso = sumarUsoTranscripcion(await leerTranscripcion(rutas[0] as string));
+    if (uso === null) {
+      throw new RegistrarCosteCommandError(
+        `[ERROR] La transcripcion ${rutas[0] as string} no tiene ninguna llamada con "usage": formato ` +
+          'desconocido, probablemente Claude Code lo cambio. Registra la cifra a mano con --tokens N. ' +
+          'No se ha tocado nada.'
+      );
+    }
+    total += uso.tokens;
+  }
+  if (total === 0) {
+    throw new RegistrarCosteCommandError(
+      '[ERROR] Las transcripciones suman 0 tokens: registrar nada no tiene sentido. No se ha tocado nada.'
+    );
+  }
+  return total;
+}
+
+export async function runRegistrarCosteCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  deps: RegistrarCosteCommandDeps
+): Promise<RegistrarCosteCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_REGISTRAR_COSTE, 'registrar-coste', (m) => new RegistrarCosteCommandError(m));
+  const { push, resto } = extraerPushFlag(argv);
+  const { agentes, resto: sinAgentes } = extraerAgentes(resto);
+  // El ID es el primer argumento, como en veredicto.
+  const [id, ...sinId] = sinAgentes;
+  if (id === undefined || id.trim() === '' || id.startsWith('--')) {
+    throw new RegistrarCosteCommandError(`[ERROR] Falta el ID de la tarea. ${USO}`);
+  }
+  const { positional, flags } = parseArgs(sinId);
+  if (positional.length > 0) {
+    throw new RegistrarCosteCommandError(`[ERROR] Argumentos de mas: ${positional.join(' ')}. ${USO}`);
+  }
+  const { fase, tokens: tokensManuales } = leerFaseYTokens(flags, agentes.length > 0);
+
+  const leida = await readTareaFile(tareasRoot, id);
+  if (leida === null) {
+    throw new RegistrarCosteCommandError(
+      `[ERROR] ${id}: no se encuentra en el working tree de la rama actual. Cambiate a la rama ` +
+        'donde esta la tarea y reintenta.'
+    );
+  }
+  const { task, body, filePath } = leida;
+  if (
+    currentBranch(deps.repoCwd) !== task.rama &&
+    localBranchExists(task.rama, deps.repoCwd) &&
+    !isAncestor(task.rama, 'HEAD', deps.repoCwd)
+  ) {
+    throw new RegistrarCosteCommandError(
+      `[ERROR] ${id}: la copia al dia de la tarea esta en su rama, "${task.rama}". ` +
+        `Cambia a ella (git checkout ${task.rama}) y reintenta; no se ha tocado nada.`
+    );
+  }
+  // El commit es de este fichero entero: con ediciones a medias en el, se
+  // las llevaria.
+  if (runGit(['status', '--porcelain', '--', filePath], deps.repoCwd) !== '') {
+    throw new RegistrarCosteCommandError(
+      `[ERROR] ${id}: tarea.md tiene cambios sin commitear. Commitealos o descartalos antes de ` +
+        '"taskctl registrar-coste": su commit se los llevaria. No se ha tocado nada.'
+    );
+  }
+
+  const nAgentes = new Set(agentes).size;
+  const tokens =
+    tokensManuales ?? (await tokensDeAgentes(agentes, deps.configDir ?? directorioConfigClaude()));
+  const campo = CAMPO_COSTE_POR_FASE[fase];
+  const total = (task[campo] ?? 0) + tokens;
+  if (!Number.isSafeInteger(total)) {
+    throw new RegistrarCosteCommandError(
+      `[ERROR] ${id}: el total de ${campo} dejaria de ser un entero seguro. Revisa el valor del ` +
+        'campo en tarea.md; no se ha tocado nada.'
+    );
+  }
+  const nueva: Task = { ...task, [campo]: total };
+  await writeFile(filePath, serializeTareaFile(nueva, body), 'utf8');
+
+  const detalle = nAgentes > 0 ? ` (${String(nAgentes)} agente${nAgentes === 1 ? '' : 's'})` : '';
+  const commit = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [filePath],
+    mensaje: mensajeChore(id, `coste ${fase} +${String(tokens)} tokens${detalle}`),
+    push,
+  });
+  return { id, fase, sumado: tokens, total, agentes: nAgentes, filePath, autoCommit: commit };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
new file mode 100644
index 0000000..0bc31f7
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
@@ -0,0 +1,83 @@
+/**
+ * Coste real de un subagente a partir de su transcripcion (TASK-023).
+ *
+ * La cifra que Claude Code devuelve al terminar un subagente es el tamano de
+ * su contexto FINAL, no lo que gasto. Lo gastado es la suma del `usage` de
+ * cada llamada al modelo, que la transcripcion (`agent-<id>.jsonl`, un JSON
+ * por linea) guarda en las lineas `type: "assistant"` con `message.usage`.
+ *
+ * Puro: recibe el texto y devuelve numeros; la busqueda del fichero vive en
+ * `fs/transcripciones.ts`.
+ *
+ * Reglas:
+ *  - Se cuenta cada `message.id` UNA vez, con su ULTIMA aparicion: el
+ *    streaming repite el id y el usage de la ultima es el final.
+ *  - Por llamada: input + cache_creation + cache_read + output. Un campo
+ *    ausente o no numerico cuenta 0.
+ *  - Las lineas que no son JSON, o no son de asistente con usage, se ignoran.
+ *    Una linea con usage pero sin id se cuenta tal cual (no se puede
+ *    deduplicar).
+ */
+
+/** agentId que devuelve la herramienta Agent: hexadecimal. Se valida antes de componer rutas. */
+const AGENT_ID_RE = /^[0-9a-f]{6,64}$/i;
+
+export function esAgentIdValido(id: string): boolean {
+  return AGENT_ID_RE.test(id);
+}
+
+export interface UsoTranscripcion {
+  /** Tokens procesados: entrada + escritura y lectura de cache + salida. */
+  tokens: number;
+  /** Llamadas distintas (message.id unicos) que se han sumado. */
+  llamadas: number;
+}
+
+function numero(v: unknown): number {
+  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
+}
+
+function tokensDeUsage(u: Record<string, unknown>): number {
+  return (
+    numero(u['input_tokens']) +
+    numero(u['cache_creation_input_tokens']) +
+    numero(u['cache_read_input_tokens']) +
+    numero(u['output_tokens'])
+  );
+}
+
+function esObjeto(v: unknown): v is Record<string, unknown> {
+  return typeof v === 'object' && v !== null && !Array.isArray(v);
+}
+
+/** null si la transcripcion no tiene ninguna linea de asistente con usage (formato desconocido). */
+export function sumarUsoTranscripcion(texto: string): UsoTranscripcion | null {
+  const porId = new Map<string, number>();
+  let sinId = 0;
+  let sumaSinId = 0;
+  for (const linea of texto.split(/\r?\n/)) {
+    if (linea.trim() === '') continue;
+    let obj: unknown;
+    try {
+      obj = JSON.parse(linea);
+    } catch {
+      continue;
+    }
+    if (!esObjeto(obj) || obj['type'] !== 'assistant') continue;
+    const mensaje = obj['message'];
+    if (!esObjeto(mensaje) || !esObjeto(mensaje['usage'])) continue;
+    const tokens = tokensDeUsage(mensaje['usage']);
+    const id = mensaje['id'];
+    if (typeof id === 'string' && id !== '') {
+      porId.set(id, tokens); // la ultima aparicion gana
+    } else {
+      sinId++;
+      sumaSinId += tokens;
+    }
+  }
+  const llamadas = porId.size + sinId;
+  if (llamadas === 0) return null;
+  let tokens = sumaSinId;
+  for (const t of porId.values()) tokens += t;
+  return { tokens, llamadas };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index cd33831..6c5b75a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -28,9 +28,17 @@
  * Si alguna de las dos marcas es de dia, la duracion va en dias enteros: con
  * medianoche implicita, restar horas daria numeros que parecen precisos y
  * no lo son (o negativos).
+ *
+ * COSTE EN TOKENS (TASK-023, `--tokens`): las columnas y los resumenes por
+ * sprint y por complejidad declarada salen de `tokens_diseno`,
+ * `tokens_implementacion` y `tokens_revision` de la tarea. null es «nadie lo
+ * registro» y nunca cuenta como 0: sale como «—», no entra en las medias y una
+ * tarea sin ningun dato no entra en el resumen (que dice cuantas quedaron
+ * fuera). Una tarea con dato solo en alguna fase si entra, y cada fase se
+ * promedia sobre las tareas que la tienen.
  */
 import { leerTransiciones, instanteDe, precisionDeFecha, type PrecisionFecha } from './transiciones.js';
-import type { Task, TaskComplexity, TaskState } from './task.js';
+import { TASK_COMPLEXITIES, type Task, type TaskComplexity, type TaskState } from './task.js';
 
 export type OrigenMetricas = 'registro' | 'git' | '—';
 
@@ -60,8 +68,17 @@ export interface HeuristicaFila {
   nivel: TaskComplexity;
 }
 
+/** Coste en tokens por fase de una tarea; null = sin registrar. */
+export interface TokensFila {
+  diseno: number | null;
+  implementacion: number | null;
+  revision: number | null;
+}
+
 export interface FilaMetricas {
   id: string;
+  sprint: number;
+  tokens: TokensFila;
   estado: TaskState;
   complejidad: TaskComplexity | null;
   diseno: Duracion | null;
@@ -178,6 +195,12 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
   }
   return {
     id: e.task.id,
+    sprint: e.task.sprint,
+    tokens: {
+      diseno: e.task.tokens_diseno,
+      implementacion: e.task.tokens_implementacion,
+      revision: e.task.tokens_revision,
+    },
     estado: e.task.estado,
     complejidad: e.task.complejidad,
     diseno: duracionEntre(marcas.plan, marcas.start),
@@ -231,19 +254,26 @@ export const COLUMNAS_HEURISTICA: readonly ColumnaMetricas[] = [
   { cabecera: 'nivel_heuristico', valor: (f) => f.heuristica?.nivel ?? '—' },
 ];
 
-/** Tabla de texto alineada (Markdown valido). */
-export function formatearTabla(filas: readonly FilaMetricas[], columnas: readonly ColumnaMetricas[]): string {
-  const celdas = filas.map((f) => columnas.map((c) => c.valor(f)));
-  const anchos = columnas.map((c, i) => Math.max(c.cabecera.length, ...celdas.map((fila) => (fila[i] as string).length)));
+/** Tabla de texto alineada (Markdown valido) a partir de cabeceras y celdas ya formateadas. */
+export function tablaDeTexto(cabeceras: readonly string[], celdas: readonly (readonly string[])[]): string {
+  const anchos = cabeceras.map((c, i) => Math.max(c.length, ...celdas.map((fila) => (fila[i] as string).length)));
   const linea = (valores: readonly string[]): string =>
     `| ${valores.map((v, i) => v.padEnd(anchos[i] as number)).join(' | ')} |`;
   return [
-    linea(columnas.map((c) => c.cabecera)),
+    linea(cabeceras),
     `|${anchos.map((a) => '-'.repeat(a + 2)).join('|')}|`,
     ...celdas.map(linea),
   ].join('\n');
 }
 
+/** Tabla de texto alineada (Markdown valido). */
+export function formatearTabla(filas: readonly FilaMetricas[], columnas: readonly ColumnaMetricas[]): string {
+  return tablaDeTexto(
+    columnas.map((c) => c.cabecera),
+    filas.map((f) => columnas.map((c) => c.valor(f)))
+  );
+}
+
 /**
  * Regla de coste de la recalibracion: una tarea entra en la muestra si esta
  * terminada y tiene al menos un informe de revision. Sin `revision/` no es
@@ -285,3 +315,223 @@ export function formatearResumen(titulo: string, grupos: readonly GrupoResumen[]
   const filas = grupos.map((g) => `  ${g.nivel.padEnd(8)} n=${String(g.n).padStart(3)}  rondas medias=${g.rondasMedia.toFixed(2)}`);
   return [titulo, ...filas].join('\n');
 }
+
+// --- Coste en tokens (TASK-023) ---------------------------------------------
+
+export type FaseTokens = keyof TokensFila;
+
+/** Fases en el orden de la tabla; `curso` en las columnas es la implementacion. */
+export const FASES_TOKENS: readonly FaseTokens[] = ['diseno', 'implementacion', 'revision'];
+
+/** Suma de lo registrado; null si la tarea no tiene ni una fase con dato (nunca un 0 inventado). */
+export function totalTokens(t: TokensFila): number | null {
+  const datos = FASES_TOKENS.map((k) => t[k]).filter((v): v is number => v !== null);
+  return datos.length === 0 ? null : datos.reduce((a, b) => a + b, 0);
+}
+
+function celdaTokens(v: number | null): string {
+  return v === null ? '—' : String(v);
+}
+
+/** Las que anade `--tokens` a la tabla: «curso» es la implementacion, como en las duraciones. */
+export const COLUMNAS_TOKENS: readonly ColumnaMetricas[] = [
+  { cabecera: 'tok_diseno', valor: (f) => celdaTokens(f.tokens.diseno) },
+  { cabecera: 'tok_curso', valor: (f) => celdaTokens(f.tokens.implementacion) },
+  { cabecera: 'tok_revision', valor: (f) => celdaTokens(f.tokens.revision) },
+  { cabecera: 'tok_total', valor: (f) => celdaTokens(totalTokens(f.tokens)) },
+];
+
+/** Columnas del bloque de docs/METRICAS.md: solo lo que no depende de git log ni del reloj. */
+export const COLUMNAS_BLOQUE_TOKENS: readonly ColumnaMetricas[] = [
+  { cabecera: 'id', valor: (f) => f.id },
+  { cabecera: 'sprint', valor: (f) => String(f.sprint) },
+  { cabecera: 'complejidad', valor: (f) => f.complejidad ?? '—' },
+  ...COLUMNAS_TOKENS,
+];
+
+export interface ResumenFaseTokens {
+  /** Suma de las tareas del grupo que tienen dato en esta fase. */
+  suma: number;
+  /** Cuantas tareas del grupo tienen dato en esta fase. */
+  n: number;
+  /** suma / n redondeada; null sin ninguna tarea con dato. */
+  media: number | null;
+  /** Porcentaje (0-100, un decimal) de esta fase sobre el total del grupo; null si el total es 0. */
+  porcentaje: number | null;
+}
+
+export interface ResumenTokensGrupo {
+  grupo: string;
+  /** Tareas del grupo. */
+  nTotal: number;
+  /** Tareas con dato en alguna fase: las unicas que entran en el resumen. */
+  nConDato: number;
+  fases: Record<FaseTokens, ResumenFaseTokens>;
+  total: number;
+  mediaTotal: number | null;
+}
+
+/**
+ * Agrega por grupo (sprint, complejidad...). Los grupos salen en `orden`, y
+ * los que no esten en el, detras en orden alfabetico; un grupo con tareas
+ * pero sin ningun dato sale igualmente (n 0/N), para que se vea que existe.
+ * Las tareas sin ningun dato cuentan en `nTotal` y no en nada mas.
+ */
+export function resumirTokens(
+  filas: readonly FilaMetricas[],
+  grupoDe: (f: FilaMetricas) => string,
+  orden: readonly string[] = []
+): ResumenTokensGrupo[] {
+  const grupos = new Map<string, FilaMetricas[]>();
+  for (const f of filas) {
+    const g = grupoDe(f);
+    const lista = grupos.get(g) ?? [];
+    lista.push(f);
+    grupos.set(g, lista);
+  }
+  const claves = [
+    ...orden.filter((k) => grupos.has(k)),
+    ...[...grupos.keys()].filter((k) => !orden.includes(k)).sort(),
+  ];
+  return claves.map((grupo) => {
+    const lista = grupos.get(grupo) as FilaMetricas[];
+    const conDato = lista.filter((f) => totalTokens(f.tokens) !== null);
+    const fases = {} as Record<FaseTokens, ResumenFaseTokens>;
+    let total = 0;
+    for (const k of FASES_TOKENS) {
+      const valores = conDato.map((f) => f.tokens[k]).filter((v): v is number => v !== null);
+      const suma = valores.reduce((a, b) => a + b, 0);
+      total += suma;
+      fases[k] = {
+        suma,
+        n: valores.length,
+        media: valores.length === 0 ? null : Math.round(suma / valores.length),
+        porcentaje: null,
+      };
+    }
+    for (const k of FASES_TOKENS) {
+      fases[k].porcentaje = total === 0 ? null : Math.round((fases[k].suma / total) * 1000) / 10;
+    }
+    return {
+      grupo,
+      nTotal: lista.length,
+      nConDato: conDato.length,
+      fases,
+      total,
+      mediaTotal: conDato.length === 0 ? null : Math.round(total / conDato.length),
+    };
+  });
+}
+
+function celdaFase(r: ResumenFaseTokens): string {
+  if (r.n === 0) return '—';
+  const pct = r.porcentaje === null ? '—' : `${r.porcentaje.toFixed(1)}%`;
+  return `${String(r.suma)} (media ${String(r.media)}, ${pct})`;
+}
+
+/**
+ * Tabla Markdown del resumen: por grupo, «n con dato / n total», la suma de
+ * cada fase con su media y su % sobre el total del grupo, y el total.
+ */
+export function formatearResumenTokens(etiquetaGrupo: string, grupos: readonly ResumenTokensGrupo[]): string {
+  return tablaDeTexto(
+    [etiquetaGrupo, 'con dato/total', 'diseno', 'curso', 'revision', 'total (media)'],
+    grupos.map((g) => [
+      g.grupo,
+      `${String(g.nConDato)}/${String(g.nTotal)}`,
+      celdaFase(g.fases.diseno),
+      celdaFase(g.fases.implementacion),
+      celdaFase(g.fases.revision),
+      g.nConDato === 0 ? '—' : `${String(g.total)} (media ${String(g.mediaTotal)})`,
+    ])
+  );
+}
+
+/** Nota que acompana a los resumenes: que entra y que no. */
+export const NOTA_TOKENS =
+  'Tokens procesados (entrada + cache + salida) por fase; «curso» es la implementacion. ' +
+  '«—» = sin registrar (no es 0). Los resumenes solo cuentan tareas con algun dato ' +
+  '(con dato/total): las demas salen en la tabla y no en el resumen. Cada media es sobre ' +
+  'las tareas que tienen esa fase; el % es de la fase sobre el total del grupo.';
+
+/** Los dos resumenes (por sprint y por complejidad declarada), en Markdown. */
+export function resumenesTokens(filas: readonly FilaMetricas[]): { porSprint: string; porComplejidad: string } {
+  const sprints = [...new Set(filas.map((f) => f.sprint))].sort((a, b) => a - b).map(String);
+  return {
+    porSprint: formatearResumenTokens(
+      'sprint',
+      resumirTokens(filas, (f) => String(f.sprint), sprints)
+    ),
+    porComplejidad: formatearResumenTokens(
+      'complejidad',
+      resumirTokens(filas, (f) => f.complejidad ?? '—', [...TASK_COMPLEXITIES, '—'])
+    ),
+  };
+}
+
+// --- Bloque regenerable de docs/METRICAS.md ----------------------------------
+
+export const MARCADOR_INICIO_TOKENS = '<!-- taskctl metricas --tokens: inicio -->';
+export const MARCADOR_FIN_TOKENS = '<!-- taskctl metricas --tokens: fin -->';
+
+/**
+ * El bloque entre marcadores (marcadores incluidos, saltos de linea LF).
+ * Determinista: sin fecha ni nada del reloj, para que regenerarlo con los
+ * mismos datos no ensucie el diff.
+ */
+export function renderBloqueTokens(filas: readonly FilaMetricas[]): string {
+  const { porSprint, porComplejidad } = resumenesTokens(filas);
+  return [
+    MARCADOR_INICIO_TOKENS,
+    '## Coste en tokens por tarea (generado)',
+    '',
+    '> Generado por `taskctl metricas --tokens --escribir`. No editar a mano: lo que haya entre',
+    '> los marcadores se sobrescribe.',
+    '',
+    formatearTabla(filas, COLUMNAS_BLOQUE_TOKENS),
+    '',
+    '### Resumen por sprint',
+    '',
+    porSprint,
+    '',
+    '### Resumen por complejidad declarada',
+    '',
+    porComplejidad,
+    '',
+    NOTA_TOKENS,
+    MARCADOR_FIN_TOKENS,
+  ].join('\n');
+}
+
+export class BloqueTokensError extends Error {}
+
+/**
+ * Pone `bloque` en `contenido`: sustituye lo que hay entre los marcadores
+ * (incluidos) o, si no existen, lo anade al final tras una linea en blanco.
+ * Fuera del bloque el texto no se toca ni un byte; el bloque adopta el salto
+ * de linea del fichero (CRLF si lo usa). Un marcador suelto, repetido o
+ * desordenado es ambiguo y se rechaza en vez de adivinar que borrar.
+ */
+export function sustituirBloqueTokens(contenido: string, bloque: string): string {
+  const eol = contenido.includes('\r\n') ? '\r\n' : '\n';
+  const nuevo = bloque.split('\n').join(eol);
+  const cuenta = (m: string): number => contenido.split(m).length - 1;
+  const inicios = cuenta(MARCADOR_INICIO_TOKENS);
+  const fines = cuenta(MARCADOR_FIN_TOKENS);
+  if (inicios === 0 && fines === 0) {
+    if (contenido === '') return nuevo + eol;
+    const cierre = contenido.endsWith('\n') ? '' : eol;
+    return `${contenido}${cierre}${eol}${nuevo}${eol}`;
+  }
+  const i = contenido.indexOf(MARCADOR_INICIO_TOKENS);
+  const f = contenido.indexOf(MARCADOR_FIN_TOKENS);
+  if (inicios !== 1 || fines !== 1 || f < i) {
+    throw new BloqueTokensError(
+      `[ERROR] docs/METRICAS.md tiene los marcadores del bloque de tokens mal puestos ` +
+        `(${String(inicios)} de inicio, ${String(fines)} de fin, o el fin antes del inicio). ` +
+        `Deja exactamente un par "${MARCADOR_INICIO_TOKENS}" ... "${MARCADOR_FIN_TOKENS}" ` +
+        '(o borra los dos para que se anada al final) y reintenta; no se ha tocado nada.'
+    );
+  }
+  return contenido.slice(0, i) + nuevo + contenido.slice(f + MARCADOR_FIN_TOKENS.length);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
index 142c2e8..44927d3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
@@ -73,6 +73,16 @@ export interface Task {
   regla_seleccion_skill: ReglaSeleccionSkill | null;
   ultimo_commit_revisado: string | null;
   revision_codex: boolean;
+  /**
+   * TASK-023: coste en tokens de cada fase (suma del uso que Claude Code
+   * devuelve al terminar cada subagente, mas la estimacion de la parte del
+   * orquestador). null = no registrado; en el fichero, ausente tambien es
+   * null, asi las tareas anteriores siguen validando. Los suma
+   * `taskctl registrar-coste`.
+   */
+  tokens_diseno: number | null;
+  tokens_implementacion: number | null;
+  tokens_revision: number | null;
   creado: string;
   actualizado: string;
   dependencias: string[];
@@ -110,6 +120,9 @@ export const TASK_FIELD_ORDER: readonly (keyof Task)[] = [
   'regla_seleccion_skill',
   'ultimo_commit_revisado',
   'revision_codex',
+  'tokens_diseno',
+  'tokens_implementacion',
+  'tokens_revision',
   'creado',
   'actualizado',
   'dependencias',
@@ -171,6 +184,19 @@ function requireNullableString(data: Record<string, unknown>, field: string): st
   return v as string;
 }
 
+/**
+ * Entero >= 0 o null (ausente = null). Rechaza cadenas, flotantes y
+ * negativos: un coste de «12k» o de -5 es un dato mal escrito, no un cero.
+ */
+export function requireNullableNumber(data: Record<string, unknown>, field: string): number | null {
+  const v = data[field];
+  if (v === null || v === undefined) return null;
+  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
+    fail(field, `El campo "${field}" debe ser un numero entero >= 0 o null.`);
+  }
+  return v as number;
+}
+
 function requireNumber(data: Record<string, unknown>, field: string): number {
   const v = data[field];
   if (typeof v !== 'number' || !Number.isInteger(v)) {
@@ -258,6 +284,9 @@ export function validateTask(data: Record<string, unknown>): Task {
     ),
     ultimo_commit_revisado: requireNullableString(data, 'ultimo_commit_revisado'),
     revision_codex: requireBoolean(data, 'revision_codex'),
+    tokens_diseno: requireNullableNumber(data, 'tokens_diseno'),
+    tokens_implementacion: requireNullableNumber(data, 'tokens_implementacion'),
+    tokens_revision: requireNullableNumber(data, 'tokens_revision'),
     creado: requireString(data, 'creado'),
     actualizado: requireString(data, 'actualizado'),
     dependencias: requireStringArray(data, 'dependencias'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/transcripciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/transcripciones.ts
new file mode 100644
index 0000000..4a68136
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/transcripciones.ts
@@ -0,0 +1,54 @@
+/**
+ * Busca la transcripcion de un subagente de Claude Code (TASK-023):
+ * `<config>/projects/<proyecto>/<sesion>/subagents/agent-<id>.jsonl`, con
+ * `<config>` = `CLAUDE_CONFIG_DIR` si esta definida y, si no, `~/.claude`.
+ */
+import { readdir, readFile } from 'node:fs/promises';
+import { homedir } from 'node:os';
+import path from 'node:path';
+import { esAgentIdValido } from '../core/coste-transcripcion.js';
+import { isEnoent, isEnotdir } from './task-store.js';
+
+export function directorioConfigClaude(env: NodeJS.ProcessEnv = process.env): string {
+  const d = env['CLAUDE_CONFIG_DIR'];
+  return d !== undefined && d.trim() !== '' ? d : path.join(homedir(), '.claude');
+}
+
+async function subdirectorios(dir: string): Promise<string[]> {
+  try {
+    return (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
+  } catch (e: unknown) {
+    if (isEnoent(e) || isEnotdir(e)) return [];
+    throw e;
+  }
+}
+
+/**
+ * Rutas de `agent-<id>.jsonl` bajo `<config>/projects/*\/*\/subagents/`. El id
+ * se valida ANTES de componer ninguna ruta: nada de `..` ni separadores.
+ */
+export async function buscarTranscripciones(configDir: string, agentId: string): Promise<string[]> {
+  if (!esAgentIdValido(agentId)) {
+    throw new Error(`agentId invalido: "${agentId}"`);
+  }
+  const proyectos = path.join(configDir, 'projects');
+  const encontradas: string[] = [];
+  for (const proyecto of await subdirectorios(proyectos)) {
+    for (const sesion of await subdirectorios(path.join(proyectos, proyecto))) {
+      const dir = path.join(proyectos, proyecto, sesion, 'subagents');
+      let nombres: string[];
+      try {
+        nombres = await readdir(dir);
+      } catch (e: unknown) {
+        if (isEnoent(e) || isEnotdir(e)) continue;
+        throw e;
+      }
+      if (nombres.includes(`agent-${agentId}.jsonl`)) encontradas.push(path.join(dir, `agent-${agentId}.jsonl`));
+    }
+  }
+  return encontradas.sort();
+}
+
+export function leerTranscripcion(ruta: string): Promise<string> {
+  return readFile(ruta, 'utf8');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
index e34f5e2..c18c882 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
@@ -38,6 +38,9 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-03',
     actualizado: '2026-09-03',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
index b8f8aa2..4b227a2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
@@ -75,6 +75,9 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-07',
     actualizado: '2026-09-07',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
index 97f1374..7e61988 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
@@ -215,6 +215,7 @@ const ESPERADOS = [
   'veredicto',
   'finish',
   'pausa',
+  'registrar-coste',
   'pause',
   'resume',
   'recover',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/codex-review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/codex-review.test.ts
index 3b1c39d..06f9b84 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/codex-review.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/codex-review.test.ts
@@ -41,6 +41,9 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: true,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-05',
     actualizado: '2026-09-05',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
new file mode 100644
index 0000000..ca52ccd
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
@@ -0,0 +1,226 @@
+/**
+ * TASK-023: `taskctl metricas --tokens` y `--tokens --escribir` por CLI,
+ * contra repos Git temporales reales. Una tarea terminada con coste
+ * registrado y otra sin ningun dato: la segunda sale en la tabla y no en el
+ * resumen. El bloque de docs/METRICAS.md se regenera sin tocar ni un byte de
+ * lo que lo rodea (CRLF incluido) y es idempotente.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, writeFile, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import {
+  MARCADOR_FIN_TOKENS,
+  MARCADOR_INICIO_TOKENS,
+} from '../../src/core/metricas.js';
+import {
+  ID,
+  CONFIG_AUTO,
+  git,
+  commitAll,
+  cli,
+  cliOk,
+  withRepo,
+  dirRevision,
+  hastaCodigo,
+  nueva,
+  rellenarInforme,
+} from '../helpers/automatico-fixtures.js';
+
+const ID2 = 'TASK-002';
+
+function celdas(salida: string, id: string): string[] {
+  const linea = salida.split('\n').find((l) => l.startsWith(`| ${id} `));
+  assert.ok(linea, `no hay fila de ${id} en:\n${salida}`);
+  return linea
+    .slice(1, -1)
+    .split('|')
+    .map((c) => c.trim());
+}
+
+/** TASK-001 terminada con coste de diseno, implementacion y revision; TASK-002 planificada sin ningun dato. */
+async function escenario(repoRoot: string, tareasRoot: string): Promise<void> {
+  await hastaCodigo(repoRoot, tareasRoot);
+  cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '1000']);
+  cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'implementacion', '--tokens', '3000']);
+  cliOk(repoRoot, ['review', ID]);
+  await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+  cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+  cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '1000']);
+  cliOk(repoRoot, ['finish', ID]);
+  nueva(repoRoot, 'feature', 'Sin datos');
+  assert.equal((await readTareaFile(tareasRoot, ID2))?.task.tokens_diseno, null);
+}
+
+const METRICAS_MD = (repoRoot: string): string => path.join(repoRoot, 'docs', 'METRICAS.md');
+
+test('metricas --tokens: columnas por fase y total, la tarea sin datos en la tabla y fuera del resumen, y no escribe nada', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await escenario(repoRoot, tareasRoot);
+
+    const sin = cliOk(repoRoot, ['metricas']);
+    assert.doesNotMatch(sin.stdout, /tok_/, 'sin --tokens la salida es la de siempre');
+    assert.doesNotMatch(sin.stdout, /Coste en tokens/);
+
+    const r = cliOk(repoRoot, ['metricas', '--tokens']);
+    const cab = r.stdout.split('\n').find((l) => l.startsWith('| id ')) as string;
+    assert.match(cab, /\| tok_diseno +\| tok_curso +\| tok_revision +\| tok_total +\|$/);
+    assert.deepEqual(celdas(r.stdout, ID).slice(-4), ['1000', '3000', '1000', '5000']);
+    assert.deepEqual(celdas(r.stdout, ID2).slice(-4), ['—', '—', '—', '—']);
+
+    // El resumen cuenta 1 tarea con dato de 2 y reparte el % sobre el total.
+    assert.match(r.stdout, /Coste en tokens por sprint:\n\| sprint +\| con dato\/total/);
+    assert.match(r.stdout, /\| 0 +\| 1\/2 +\| 1000 \(media 1000, 20\.0%\) +\| 3000 \(media 3000, 60\.0%\) +\| 1000 \(media 1000, 20\.0%\) +\| 5000 \(media 5000\) +\|/);
+    assert.match(r.stdout, /Coste en tokens por complejidad declarada:\n\| complejidad +\| con dato\/total/);
+    assert.match(r.stdout, /\| simple +\| 1\/2 /);
+    assert.match(r.stdout, /Las pausas no se descuentan/, 'sigue llevando la nota de calendario');
+    assert.doesNotMatch(r.stdout, /NaN|undefined/);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'solo lectura');
+    assert.equal(await stat(METRICAS_MD(repoRoot)).then(() => true, () => false), false);
+  });
+});
+
+test('metricas --tokens --heuristica: ambas familias de columnas, y el resumen de tokens sobre la muestra', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await escenario(repoRoot, tareasRoot);
+    const r = cliOk(repoRoot, ['metricas', '--tokens', '--heuristica']);
+    const cab = r.stdout.split('\n').find((l) => l.startsWith('| id ')) as string;
+    assert.match(cab, /\| tok_total +\| puntos +\| nivel_heuristico +\|$/);
+    assert.deepEqual(celdas(r.stdout, ID).slice(7 + 1, 7 + 5), ['1000', '3000', '1000', '5000']);
+    assert.ok(!r.stdout.includes(`| ${ID2} `), 'la muestra heuristica solo trae terminadas con informes');
+    assert.match(r.stdout, /Muestra: 1 tareas terminadas/);
+    assert.match(r.stdout, /\| 0 +\| 1\/1 /);
+    assert.match(r.stdout, /Por complejidad declarada:\n {2}simple/);
+  });
+});
+
+test('metricas: combinaciones de flags invalidas se rechazan antes de escribir nada', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await escenario(repoRoot, tareasRoot);
+    const casos: [string[], RegExp][] = [
+      [['--escribir'], /--escribir solo se admite con --tokens/],
+      [['--tokens', '--escribir', '--heuristica'], /--escribir no se puede combinar con --heuristica/],
+      [['--tokens=1'], /--tokens no lleva valor/],
+      [['--tokens', '5'], /--tokens no lleva valor|no admite argumentos sueltos/],
+      [['--tokens', '--escribir=si'], /"--escribir" no lleva valor/],
+      [['--tokenz'], /flag desconocido "--tokenz".*Quiza quisiste decir "--tokens"/s],
+    ];
+    for (const [args, esperado] of casos) {
+      const r = cli(repoRoot, ['metricas', ...args]);
+      assert.equal(r.status, 1, args.join(' '));
+      assert.match(r.stderr, esperado, args.join(' '));
+      assert.equal(r.stdout, '', `${args.join(' ')}: no saca tabla`);
+    }
+    assert.equal(await stat(METRICAS_MD(repoRoot)).then(() => true, () => false), false);
+  });
+});
+
+test('metricas --tokens --escribir: crea el fichero si no existe, y la segunda vez no cambia ni un byte', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await escenario(repoRoot, tareasRoot);
+    const a = cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
+    assert.match(a.stdout, /Regenerado el bloque de tokens de .*METRICAS\.md \(recuerda commitearlo\)/);
+    const primero = await readFile(METRICAS_MD(repoRoot));
+    const texto = primero.toString('utf8');
+    assert.ok(texto.startsWith(`${MARCADOR_INICIO_TOKENS}\n`));
+    assert.ok(texto.endsWith(`${MARCADOR_FIN_TOKENS}\n`));
+    assert.match(texto, /\| TASK-001 +\| 0 +\| simple +\| 1000 +\| 3000 +\| 1000 +\| 5000 +\|/);
+    assert.match(texto, /\| TASK-002 +\| 0 +\| simple +\| — +\| — +\| — +\| — +\|/);
+    assert.doesNotMatch(texto, /\d{4}-\d{2}-\d{2}/, 'ninguna fecha: no ensucia diffs');
+    assert.ok(!texto.includes('origen'), 'solo columnas que no dependen de git log');
+
+    const b = cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
+    assert.match(b.stdout, /ya al dia: sin cambios/);
+    assert.ok((await readFile(METRICAS_MD(repoRoot))).equals(primero), 'idempotente');
+
+    // No commitea: lo deja a la persona, como board --escribir.
+    assert.match(git(['status', '--porcelain'], repoRoot), /\?\? docs\//);
+  });
+});
+
+test('metricas --tokens --escribir: solo cambia el bloque; el resto (CRLF, acentos, lo de despues) queda byte a byte', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await escenario(repoRoot, tareasRoot);
+    const antes = '# Métricas\r\n\r\nUna sección con acentos — y CRLF.\r\n\r\n';
+    const despues = '\r\n## 12. Lo escrito a mano\r\n\r\nNo tocar.\r\n\r\n```\r\nbloque de codigo\r\n```';
+    await mkdir(path.dirname(METRICAS_MD(repoRoot)), { recursive: true });
+    await writeFile(METRICAS_MD(repoRoot), `${antes}${MARCADOR_INICIO_TOKENS}\r\nVIEJO\r\n${MARCADOR_FIN_TOKENS}${despues}`, 'utf8');
+    commitAll(repoRoot, 'docs: metricas con bloque viejo');
+
+    cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
+    const buf = await readFile(METRICAS_MD(repoRoot));
+    const t = buf.toString('utf8');
+    assert.ok(t.startsWith(antes), 'lo de antes, byte a byte');
+    assert.ok(t.endsWith(despues), 'lo de despues, byte a byte, sin salto final anadido');
+    assert.ok(!t.includes('VIEJO'));
+    const bloque = t.slice(antes.length, t.length - despues.length);
+    assert.ok(bloque.startsWith(MARCADOR_INICIO_TOKENS) && bloque.endsWith(MARCADOR_FIN_TOKENS));
+    assert.ok(!/[^\r]\n/.test(t), 'el bloque nuevo usa CRLF como el fichero');
+    assert.match(bloque, /\| TASK-001 +\| 0 +\| simple +\| 1000 /);
+    commitAll(repoRoot, 'docs: metricas regeneradas');
+
+    // Idempotente: sin cambios de datos, ni un byte y nada que commitear.
+    const b = cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
+    assert.match(b.stdout, /sin cambios/);
+    assert.ok((await readFile(METRICAS_MD(repoRoot))).equals(buf));
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+
+    // Un dato nuevo cambia el bloque y solo el bloque.
+    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '500']);
+    cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
+    const t2 = await readFile(METRICAS_MD(repoRoot), 'utf8');
+    assert.ok(t2.startsWith(antes) && t2.endsWith(despues));
+    assert.match(t2, /\| TASK-001 +\| 0 +\| simple +\| 1000 +\| 3000 +\| 1500 +\| 5500 +\|/);
+  });
+});
+
+test('metricas --tokens --escribir: sin marcadores anade el bloque al final y deja lo anterior intacto', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await escenario(repoRoot, tareasRoot);
+    const previo = '# Métricas\n\nTexto escrito a mano.\n';
+    await mkdir(path.dirname(METRICAS_MD(repoRoot)), { recursive: true });
+    await writeFile(METRICAS_MD(repoRoot), previo, 'utf8');
+    cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
+    const t = await readFile(METRICAS_MD(repoRoot), 'utf8');
+    assert.ok(t.startsWith(`${previo}\n${MARCADOR_INICIO_TOKENS}\n`));
+    assert.ok(t.endsWith(`${MARCADOR_FIN_TOKENS}\n`));
+  });
+});
+
+test('metricas --tokens --escribir: marcadores rotos o una tarea.md invalida abortan sin tocar el fichero', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await escenario(repoRoot, tareasRoot);
+    const roto = `# M\n\n${MARCADOR_INICIO_TOKENS}\nsin cierre\n`;
+    await mkdir(path.dirname(METRICAS_MD(repoRoot)), { recursive: true });
+    await writeFile(METRICAS_MD(repoRoot), roto, 'utf8');
+    const r = cli(repoRoot, ['metricas', '--tokens', '--escribir']);
+    assert.equal(r.status, 1);
+    assert.match(r.stderr, /marcadores del bloque de tokens mal puestos/);
+    assert.equal(await readFile(METRICAS_MD(repoRoot), 'utf8'), roto);
+
+    // Una tarea.md invalida saldria del bloque en silencio: no se escribe.
+    await writeFile(METRICAS_MD(repoRoot), '# M\n', 'utf8');
+    const t2 = await readTareaFile(tareasRoot, ID2);
+    assert.ok(t2);
+    const original = await readFile(t2.filePath, 'utf8');
+    await writeFile(t2.filePath, original.replace(/^tokens_diseno: null$/m, 'tokens_diseno: abc'), 'utf8');
+    const i = cli(repoRoot, ['metricas', '--tokens', '--escribir']);
+    assert.equal(i.status, 1);
+    assert.match(i.stderr, /No se regenera docs\/METRICAS\.md con tarea\.md invalidos.*TASK-002/s);
+    assert.equal(await readFile(METRICAS_MD(repoRoot), 'utf8'), '# M\n');
+  });
+});
+
+test('metricas --tokens --escribir fuera de la raiz del repo no crea un docs/ fantasma', async () => {
+  const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-metricas-tokens-fuera-'));
+  try {
+    const r = cli(fuera, ['metricas', '--tokens', '--escribir']);
+    assert.equal(r.status, 1);
+    assert.match(r.stderr, /no parece la raiz de un repo con tareas/);
+    assert.equal(await stat(path.join(fuera, 'docs')).then(() => true, () => false), false);
+  } finally {
+    await rm(fuera, { recursive: true, force: true });
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/particion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/particion.test.ts
index 9c0ead5..c1f010c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/particion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/particion.test.ts
@@ -40,6 +40,9 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-10-04',
     actualizado: '2026-10-04',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
index e1a4c5d..f0de50f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
@@ -58,6 +58,9 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-08',
     actualizado: '2026-09-08',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
index 3f4a157..20f6f78 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
@@ -48,6 +48,9 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-03',
     actualizado: '2026-09-03',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/rama-base.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/rama-base.test.ts
index 9f57d4a..3fe477a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/rama-base.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/rama-base.test.ts
@@ -195,6 +195,9 @@ function tareaDeTipo(id: string, tipo: Task['tipo'], rama: string): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: HOY,
     actualizado: HOY,
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
new file mode 100644
index 0000000..94558af
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
@@ -0,0 +1,140 @@
+/**
+ * TASK-023: `taskctl registrar-coste --agente <id>` por CLI, contra repos Git
+ * temporales y un CLAUDE_CONFIG_DIR temporal con transcripciones reales.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { ID, CONFIG_AUTO, TASKCTL, git, withRepo, hastaCodigo } from '../helpers/automatico-fixtures.js';
+
+const A = 'a1b2c3d4e5f60718';
+const B = 'b1b2c3d4e5f60718';
+
+function linea(id: string, entrada: number, salida: number): string {
+  return JSON.stringify({
+    type: 'assistant',
+    message: { id, usage: { input_tokens: entrada, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: salida } },
+  });
+}
+
+async function transcripcion(config: string, proyecto: string, sesion: string, agente: string, lineas: string[]): Promise<string> {
+  const dir = path.join(config, 'projects', proyecto, sesion, 'subagents');
+  await mkdir(dir, { recursive: true });
+  const ruta = path.join(dir, `agent-${agente}.jsonl`);
+  await writeFile(ruta, lineas.join('\n') + '\n', 'utf8');
+  return ruta;
+}
+
+async function conConfig(fn: (config: string) => Promise<void>): Promise<void> {
+  const config = await mkdtemp(path.join(tmpdir(), 'taskctl-claude-config-'));
+  try {
+    await fn(config);
+  } finally {
+    await rm(config, { recursive: true, force: true });
+  }
+}
+
+function coste(repo: string, config: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
+  const r = spawnSync(process.execPath, [TASKCTL, 'registrar-coste', ...args], {
+    cwd: repo,
+    encoding: 'utf8',
+    env: { ...process.env, CLAUDE_CONFIG_DIR: config },
+  });
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+async function valor(tareasRoot: string): Promise<[number | null, number | null, number | null]> {
+  const t = await readTareaFile(tareasRoot, ID);
+  assert.ok(t);
+  return [t.task.tokens_diseno, t.task.tokens_implementacion, t.task.tokens_revision];
+}
+
+const head = (repo: string): string => git(['rev-parse', 'HEAD'], repo).trim();
+
+test('--agente: suma lo gastado (ultima aparicion de cada message.id), no el contexto final, y commitea con la cifra y los agentes', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      await transcripcion(config, 'proy-1', 'sesion-1', A, [
+        linea('m1', 100, 1),
+        linea('m1', 100, 20), // streaming: cuenta esta (120), no la anterior
+        linea('m2', 200, 30), // 230
+        'basura que no es json',
+      ]);
+      const r = coste(repo, config, [ID, '--fase', 'diseno', '--agente', A]);
+      assert.equal(r.status, 0, r.stderr);
+      assert.match(r.stdout, /\+350 tokens de diseno \(1 subagente\(s\)\); total de la fase: 350/);
+      assert.deepEqual(await valor(tareasRoot), [350, null, null]);
+      assert.equal(git(['log', '-1', '--format=%s'], repo).trim(), `chore(${ID}): coste diseno +350 tokens (1 agente)`);
+      assert.equal(git(['status', '--porcelain'], repo).trim(), '');
+    });
+  });
+});
+
+test('--agente repetido (y con --agente=): suma varios agentes de sesiones distintas en UN registro y un commit', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      await transcripcion(config, 'proy-1', 'sesion-1', A, [linea('m1', 100, 0)]);
+      await transcripcion(config, 'proy-2', 'sesion-9', B, [linea('m1', 40, 10)]);
+      const antes = git(['rev-list', '--count', 'HEAD'], repo).trim();
+      const r = coste(repo, config, [ID, '--fase', 'revision', '--agente', A, `--agente=${B}`, '--agente', A]);
+      assert.equal(r.status, 0, r.stderr);
+      assert.deepEqual(await valor(tareasRoot), [null, null, 150], 'el id repetido no se cuenta dos veces');
+      assert.equal(Number(git(['rev-list', '--count', 'HEAD'], repo).trim()), Number(antes) + 1, 'un solo commit');
+      assert.equal(git(['log', '-1', '--format=%s'], repo).trim(), `chore(${ID}): coste revision +150 tokens (2 agentes)`);
+      // Suma sobre lo anterior, como --tokens.
+      assert.equal(coste(repo, config, [ID, '--fase', 'revision', '--tokens', '10']).status, 0);
+      assert.deepEqual(await valor(tareasRoot), [null, null, 160]);
+    });
+  });
+});
+
+test('--agente: errores que dicen que hacer, sin tocar nada', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      const dup1 = await transcripcion(config, 'proy-1', 'sesion-1', A, [linea('m1', 1, 1)]);
+      const dup2 = await transcripcion(config, 'proy-2', 'sesion-2', A, [linea('m1', 1, 1)]);
+      await transcripcion(config, 'proy-1', 'sesion-1', B, ['{"type":"user"}', 'no json']);
+      const antes = head(repo);
+      const casos: [string[], RegExp][] = [
+        [['--agente', 'c1b2c3d4e5f60718'], /No se encuentra la transcripcion del subagente c1b2c3d4e5f60718.*projects.*--tokens N/s],
+        [['--agente', A], /mas de una sesion/],
+        [['--agente', B], /no tiene ninguna llamada con "usage".*formato desconocido.*--tokens N/s],
+        [['--agente', '../../etc/passwd'], /no es un id de subagente valido/],
+        [['--agente', 'a1b2c3/../d4'], /no es un id de subagente valido/],
+        [['--agente', `..${path.sep}x`], /no es un id de subagente valido/],
+        [['--agente', A, '--tokens', '5'], /--tokens y --agente se excluyen entre si/],
+        [['--agente'], /--agente necesita el id/],
+        [[], /Falta el coste: pasa --agente/],
+      ];
+      for (const [extra, esperado] of casos) {
+        const r = coste(repo, config, [ID, '--fase', 'diseno', ...extra]);
+        assert.equal(r.status, 1, extra.join(' '));
+        assert.match(r.stderr, esperado, extra.join(' '));
+      }
+      // El ambiguo lista las dos rutas.
+      const amb = coste(repo, config, [ID, '--fase', 'diseno', '--agente', A]);
+      assert.ok(amb.stderr.includes(dup1) && amb.stderr.includes(dup2), amb.stderr);
+      assert.equal(head(repo), antes, 'ningun error commitea');
+      assert.deepEqual(await valor(tareasRoot), [null, null, null]);
+    });
+  });
+});
+
+test('--agente: un fallo con varios agentes no registra ni la parte buena', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      await transcripcion(config, 'p', 's', A, [linea('m1', 5, 5)]);
+      const r = coste(repo, config, [ID, '--fase', 'diseno', '--agente', A, '--agente', 'c1b2c3d4e5f60718']);
+      assert.equal(r.status, 1);
+      assert.deepEqual(await valor(tareasRoot), [null, null, null]);
+    });
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste.test.ts
new file mode 100644
index 0000000..684a0b3
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste.test.ts
@@ -0,0 +1,200 @@
+/**
+ * TASK-023: `taskctl registrar-coste` por CLI, contra repos Git temporales
+ * reales. La evidencia sale del fichero y de `git log`, no de lo que imprime
+ * el comando: suma, null intacto, un solo fichero en el commit, rechazos sin
+ * efectos, tarea terminada y las precondiciones de rama y de tarea.md limpio.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import {
+  ID,
+  CONFIG_AUTO,
+  git,
+  cli,
+  cliOk,
+  withRepo,
+  dirRevision,
+  hastaCodigo,
+  nueva,
+  rellenarInforme,
+  siguiente,
+} from '../helpers/automatico-fixtures.js';
+
+async function costes(tareasRoot: string): Promise<[number | null, number | null, number | null]> {
+  const t = await readTareaFile(tareasRoot, ID);
+  assert.ok(t);
+  return [t.task.tokens_diseno, t.task.tokens_implementacion, t.task.tokens_revision];
+}
+
+const head = (repo: string): string => git(['rev-parse', 'HEAD'], repo).trim();
+
+test('registrar-coste: suma en varias llamadas, deja null las otras fases y commitea SOLO tarea.md', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    assert.deepEqual(await costes(tareasRoot), [null, null, null]);
+
+    // Algo a medias en otro sitio del arbol: no puede entrar en el commit.
+    await writeFile(path.join(repoRoot, 'otro.txt'), 'a medias\n', 'utf8');
+
+    const a = cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '1500']);
+    assert.match(a.stdout, /\+1500 tokens de diseno; total de la fase: 1500/);
+    assert.deepEqual(await costes(tareasRoot), [1500, null, null]);
+    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens=2500']);
+    assert.deepEqual(await costes(tareasRoot), [4000, null, null], 'suma, no sobrescribe');
+    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '7']);
+    assert.deepEqual(await costes(tareasRoot), [4000, null, 7], 'implementacion sigue siendo null, no 0');
+
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.ok(t);
+    const texto = await readFile(t.filePath, 'utf8');
+    assert.match(texto, /^tokens_diseno: 4000$/m);
+    assert.match(texto, /^tokens_implementacion: null$/m);
+    assert.match(texto, /^tokens_revision: 7$/m);
+
+    // Un commit por llamada, con solo ese fichero y el asunto esperado.
+    const log = git(['log', '-3', '--format=%s'], repoRoot).trim().split('\n');
+    assert.deepEqual(log, [
+      `chore(${ID}): coste revision +7 tokens`,
+      `chore(${ID}): coste diseno +2500 tokens`,
+      `chore(${ID}): coste diseno +1500 tokens`,
+    ]);
+    const ficheros = git(['show', '--name-only', '--format=', 'HEAD'], repoRoot).trim().split('\n');
+    assert.deepEqual(ficheros, [path.relative(repoRoot, t.filePath).split(path.sep).join('/')]);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '?? otro.txt', 'lo ajeno queda como estaba');
+  });
+});
+
+test('registrar-coste: rechaza 0, negativos, no numeros, flotantes, fase invalida o ausente, sin tocar nada', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    const antes = head(repoRoot);
+    const casos: [string[], RegExp][] = [
+      [[ID, '--fase', 'diseno', '--tokens', '0'], /registrar nada no tiene sentido.*no registres nada/s],
+      [[ID, '--fase', 'diseno', '--tokens', '-5'], /"-5" no es un entero positivo/],
+      [[ID, '--fase', 'diseno', '--tokens', 'abc'], /"abc" no es un entero positivo/],
+      [[ID, '--fase', 'diseno', '--tokens', '12k'], /"12k" no es un entero positivo/],
+      [[ID, '--fase', 'diseno', '--tokens', '1.5'], /"1.5" no es un entero positivo/],
+      [[ID, '--fase', 'diseno'], /Falta el coste: pasa --agente/],
+      [[ID, '--fase', 'diseno', '--tokens'], /--tokens falta/],
+      [[ID, '--fase', 'diseno', '--tokens', '99999999999999999999'], /demasiado grande/],
+      [[ID, '--fase', 'curso', '--tokens', '5'], /--fase "curso" no reconocida.*diseno, implementacion, revision/s],
+      [[ID, '--tokens', '5'], /--fase ausente/],
+      [[ID, '--fase', 'toString', '--tokens', '5'], /--fase "toString" no reconocida/],
+      [['--fase', 'diseno', '--tokens', '5'], /Falta el ID de la tarea/],
+      [[ID, 'sobra', '--fase', 'diseno', '--tokens', '5'], /Argumentos de mas: sobra/],
+      [[ID, '--fase', 'diseno', '--tokens', '5', '--tokenz', '1'], /flag desconocido "--tokenz"/],
+      ['TASK-777 --fase diseno --tokens 5'.split(' '), /TASK-777: no se encuentra/],
+    ];
+    for (const [args, esperado] of casos) {
+      const r = cli(repoRoot, ['registrar-coste', ...args]);
+      assert.equal(r.status, 1, `${args.join(' ')}: deberia fallar (${r.stdout})`);
+      assert.match(r.stderr, esperado, args.join(' '));
+    }
+    assert.equal(head(repoRoot), antes, 'ningun rechazo commitea');
+    assert.deepEqual(await costes(tareasRoot), [null, null, null]);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('registrar-coste: funciona con la tarea terminada, que vive en develop tras el finish', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['review', ID]);
+    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    const cierre = cliOk(repoRoot, ['finish', ID]);
+    // Sin coste registrado, finish avisa de diseno y revision (no de implementacion) y cierra.
+    assert.match(cierre.stderr, /sin coste de diseno registrado/);
+    assert.match(cierre.stderr, /sin coste de revision registrado/);
+    assert.doesNotMatch(cierre.stderr, /sin coste de implementacion/);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.equal(t?.task.estado, 'terminada');
+
+    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '9000']);
+    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '1000']);
+    assert.deepEqual(await costes(tareasRoot), [null, null, 10000]);
+    assert.equal(git(['log', '-1', '--format=%s'], repoRoot).trim(), `chore(${ID}): coste revision +1000 tokens`);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+    const despues = await readTareaFile(tareasRoot, ID);
+    assert.equal(despues?.task.estado, 'terminada', 'no cambia el estado');
+    assert.equal(despues?.task.actualizado, t?.task.actualizado, 'ni actualizado');
+  });
+});
+
+test('registrar-coste entre review y finish no cambia lo que dice siguiente (modo automatico)', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    cliOk(repoRoot, ['review', ID]);
+    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+    const antes = siguiente(repoRoot);
+    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'revision', '--tokens', '123']);
+    assert.deepEqual(siguiente(repoRoot), antes);
+    cliOk(repoRoot, ['finish', ID]);
+  });
+});
+
+test('registrar-coste: aborta con tarea.md a medias, y desde la rama base si la tarea vive en su rama', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.ok(t);
+    const rama = git(['branch', '--show-current'], repoRoot).trim();
+    assert.match(rama, /^feature\//);
+    const antes = head(repoRoot);
+
+    // tarea.md con cambios sin commitear: el commit se los llevaria.
+    const original = await readFile(t.filePath, 'utf8');
+    await writeFile(t.filePath, `${original}\nnota a medias\n`, 'utf8');
+    const sucio = cli(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5']);
+    assert.equal(sucio.status, 1);
+    assert.match(sucio.stderr, /tarea\.md tiene cambios sin commitear/);
+    assert.equal(head(repoRoot), antes);
+    assert.match(await readFile(t.filePath, 'utf8'), /nota a medias/, 'no se pierde la edicion de la persona');
+    await writeFile(t.filePath, original, 'utf8');
+
+    // Desde develop, la copia de la tarea esta desfasada: la al dia vive en su rama.
+    git(['checkout', '-q', 'develop'], repoRoot);
+    const fuera = cli(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5']);
+    assert.equal(fuera.status, 1);
+    assert.ok(fuera.stderr.includes(`git checkout ${rama}`), fuera.stderr);
+    git(['checkout', '-q', rama], repoRoot);
+    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5']);
+    assert.deepEqual(await costes(tareasRoot), [5, null, null]);
+  });
+});
+
+test('new escribe los tres campos de tokens a null, y una tarea sin ellos sigue valida y suma sobre 0', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    nueva(repoRoot, 'feature', 'Con campos');
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.ok(t);
+    const texto = await readFile(t.filePath, 'utf8');
+    for (const c of ['tokens_diseno', 'tokens_implementacion', 'tokens_revision']) {
+      assert.match(texto, new RegExp(`^${c}: null$`, 'm'));
+    }
+    // Una tarea anterior a los campos (sin las lineas) los acepta como null.
+    await writeFile(t.filePath, texto.replace(/^tokens_.*\n/gm, ''), 'utf8');
+    git(['commit', '-q', '-am', 'tarea de antes de los campos'], repoRoot);
+    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'implementacion', '--tokens', '33']);
+    assert.deepEqual(await costes(tareasRoot), [null, 33, null]);
+  });
+});
+
+test('registrar-coste es un comando guardado por la cadena: con una cadena abierta exige su testigo', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await hastaCodigo(repoRoot, tareasRoot);
+    const abrir = cliOk(repoRoot, ['cadena', 'abrir', ID]);
+    const testigo = abrir.stdout.trim();
+    assert.ok(testigo, abrir.stdout);
+    const sin = cli(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5']);
+    assert.equal(sin.status, 1, 'sin testigo no escribe');
+    assert.deepEqual(await costes(tareasRoot), [null, null, null]);
+    cliOk(repoRoot, ['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5', '--cadena', testigo]);
+    assert.deepEqual(await costes(tareasRoot), [5, null, null]);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts
index 5d61e6b..023cdd3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-exclusion.test.ts
@@ -48,6 +48,9 @@ const TASK: Task = {
   regla_seleccion_skill: null,
   ultimo_commit_revisado: null,
   revision_codex: false,
+  tokens_diseno: null,
+  tokens_implementacion: null,
+  tokens_revision: null,
   creado: '2026-10-03',
   actualizado: '2026-10-03',
   dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
index 00a3b83..5b74671 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
@@ -55,6 +55,9 @@ const TASK: Task = {
   regla_seleccion_skill: null,
   ultimo_commit_revisado: null,
   revision_codex: false,
+  tokens_diseno: null,
+  tokens_implementacion: null,
+  tokens_revision: null,
   creado: '2026-10-04',
   actualizado: '2026-10-04',
   dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
index f56a405..65bea39 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
@@ -431,6 +431,9 @@ test('hotfix en automatico con revision aprobada: finish sigue siendo preguntar'
       regla_seleccion_skill: null,
       ultimo_commit_revisado: null,
       revision_codex: false,
+      tokens_diseno: null,
+      tokens_implementacion: null,
+      tokens_revision: null,
       creado: HOY,
       actualizado: HOY,
       dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
index 21e8527..f049a44 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
@@ -44,6 +44,9 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-10-04',
     actualizado: '2026-10-04',
     dependencias: [],
@@ -167,8 +170,13 @@ test('approve (TASK-043): rechaza el esqueleto que deja plan; con contenido prop
 
 // ─── finish ────────────────────────────────────────────────────────────
 
-async function setupEnRevision(repoRoot: string, tareasRoot: string, body: string): Promise<Task> {
-  const task = sampleTask({ estado: 'en-revision', plan_aprobado: true });
+async function setupEnRevision(
+  repoRoot: string,
+  tareasRoot: string,
+  body: string,
+  costes: Partial<Task> = { tokens_diseno: 1, tokens_revision: 1 }
+): Promise<Task> {
+  const task = sampleTask({ estado: 'en-revision', plan_aprobado: true, ...costes });
   git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
   await writeTareaFile(tareasRoot, task, body);
   await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo\n', 'utf8');
@@ -229,3 +237,69 @@ test('finish (TASK-043): con todos los criterios marcados no hay aviso', async (
     assert.deepEqual(avisos, []);
   });
 });
+
+/**
+ * TASK-023. Mutaciones que lo ponen rojo: bloquear en vez de avisar, avisar
+ * tambien de tokens_implementacion, o no mirar tokens_revision.
+ */
+test('finish (TASK-023): avisa del coste de diseno y revision sin registrar, ANTES del merge, y cierra igualmente', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = await setupEnRevision(
+      repoRoot,
+      tareasRoot,
+      '## Objetivo\nX.\n\n## Criterios de aceptacion\n- [x] hecho\n',
+      { tokens_diseno: null, tokens_implementacion: null, tokens_revision: null }
+    );
+    const avisos: { texto: string; integrada: boolean }[] = [];
+    const r = await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+      onAviso: (texto) => {
+        const integrada =
+          spawnSync('git', ['merge-base', '--is-ancestor', task.rama, 'develop'], { cwd: repoRoot }).status === 0;
+        avisos.push({ texto, integrada });
+      },
+    });
+    assert.equal(avisos.length, 2, 'uno por diseno y otro por revision; implementacion no avisa');
+    assert.ok(avisos.every((a) => !a.integrada), 'los avisos llegan antes de mergear');
+    assert.match(avisos[0]?.texto ?? '', /sin coste de diseno registrado.*taskctl registrar-coste TASK-430 --fase diseno --tokens N/);
+    assert.match(avisos[1]?.texto ?? '', /sin coste de revision registrado.*--fase revision/);
+    assert.ok(avisos.every((a) => !/implementacion/.test(a.texto)));
+    assert.match(r.filePath, /04-terminadas/, 'no bloquea');
+  });
+});
+
+test('finish (TASK-023): solo avisa de la fase que falta, y con diseno y revision registrados no avisa', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await setupEnRevision(repoRoot, tareasRoot, '## Objetivo\nX.\n', {
+      tokens_diseno: 5000,
+      tokens_implementacion: null,
+      tokens_revision: null,
+    });
+    const avisos: string[] = [];
+    await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+      onAviso: (a) => avisos.push(a),
+    });
+    assert.equal(avisos.length, 1);
+    assert.match(avisos[0] ?? '', /sin coste de revision/);
+  });
+});
+
+test('finish (TASK-023): con diseno y revision registrados (implementacion sin registrar) no hay aviso de coste', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await setupEnRevision(repoRoot, tareasRoot, '## Objetivo\nX.\n', {
+      tokens_diseno: 5000,
+      tokens_implementacion: null,
+      tokens_revision: 7000,
+    });
+    const avisos: string[] = [];
+    await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+      onAviso: (a) => avisos.push(a),
+    });
+    assert.deepEqual(avisos, []);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts
index 946ef40..6632140 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts
@@ -44,6 +44,9 @@ const TASK: Task = {
   regla_seleccion_skill: null,
   ultimo_commit_revisado: null,
   revision_codex: false,
+  tokens_diseno: null,
+  tokens_implementacion: null,
+  tokens_revision: null,
   creado: '2026-10-03',
   actualizado: '2026-10-03',
   dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts
index 43f0e86..268af2a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/board-format.test.ts
@@ -21,6 +21,9 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-03',
     actualizado: '2026-09-03',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
index f741d43..ed830b4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
@@ -61,6 +61,9 @@ function tarea(campos: Partial<Task> = {}): Task {
     skills_recomendados: [],
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-08',
     actualizado: '2026-09-08',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-transcripcion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-transcripcion.test.ts
new file mode 100644
index 0000000..3b35f92
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-transcripcion.test.ts
@@ -0,0 +1,61 @@
+/**
+ * TASK-023: suma del usage de una transcripcion de subagente. Lo gastado es
+ * la suma de las llamadas (por message.id, con la ultima aparicion), no la
+ * cifra de contexto final que muestra Claude Code al terminar el agente.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { esAgentIdValido, sumarUsoTranscripcion } from '../../src/core/coste-transcripcion.js';
+
+function asistente(id: string | null, usage: Record<string, unknown>): string {
+  return JSON.stringify({ type: 'assistant', message: { ...(id === null ? {} : { id }), usage } });
+}
+
+test('suma input + cache_creation + cache_read + output por llamada', () => {
+  const t = asistente('m1', {
+    input_tokens: 10,
+    cache_creation_input_tokens: 100,
+    cache_read_input_tokens: 1000,
+    output_tokens: 5,
+  });
+  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 1115, llamadas: 1 });
+});
+
+test('un message.id repetido (streaming) cuenta UNA vez, con su ultima aparicion', () => {
+  const t = [
+    asistente('m1', { input_tokens: 1, output_tokens: 1 }),
+    asistente('m1', { input_tokens: 1, output_tokens: 50 }),
+    asistente('m2', { input_tokens: 7, output_tokens: 3 }),
+    asistente('m1', { input_tokens: 1, output_tokens: 99 }),
+  ].join('\n');
+  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 100 + 10, llamadas: 2 });
+});
+
+test('ignora lineas no JSON, de otros tipos o sin usage; campos ausentes o raros cuentan 0', () => {
+  const t = [
+    'esto no es json',
+    '',
+    '{"type":"user","message":{"usage":{"input_tokens":999}}}',
+    '{"type":"assistant","message":{"id":"x"}}',
+    '[1,2,3]',
+    asistente('m1', { output_tokens: 4, input_tokens: 'mucho', cache_read_input_tokens: -5 }),
+  ].join('\r\n');
+  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 4, llamadas: 1 });
+});
+
+test('una llamada con usage pero sin message.id se cuenta tal cual', () => {
+  const t = [asistente(null, { output_tokens: 2 }), asistente(null, { output_tokens: 3 })].join('\n');
+  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 5, llamadas: 2 });
+});
+
+test('sin ninguna llamada con usage es null (formato desconocido), no 0', () => {
+  assert.equal(sumarUsoTranscripcion(''), null);
+  assert.equal(sumarUsoTranscripcion('{"type":"user"}\nbasura'), null);
+});
+
+test('esAgentIdValido: hexadecimal, sin separadores ni ..', () => {
+  assert.ok(esAgentIdValido('a1b2c3d4e5f60718'));
+  for (const malo of ['', 'abc', '../x', 'a1b2c3/../d4', 'a1b2c3\\d4', 'zzzzzzzz', 'a1b2c3d4 ', 'a'.repeat(65)]) {
+    assert.ok(!esAgentIdValido(malo), malo);
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
index 37b7675..1386cea 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
@@ -87,6 +87,9 @@ function tarea(campos: Partial<Task> = {}): Task {
     skills_recomendados: [],
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-08',
     actualizado: '2026-09-08',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
index bbd8e1c..3fcfdbe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
@@ -6,7 +6,18 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import {
+  BloqueTokensError,
   COLUMNAS_HEURISTICA,
+  COLUMNAS_TOKENS,
+  MARCADOR_FIN_TOKENS,
+  MARCADOR_INICIO_TOKENS,
+  formatearResumenTokens,
+  renderBloqueTokens,
+  resumenesTokens,
+  resumirTokens,
+  sustituirBloqueTokens,
+  totalTokens,
+  type ResumenTokensGrupo,
   COLUMNAS_METRICAS,
   calcularFila,
   duracionEntre,
@@ -39,6 +50,9 @@ function tarea(o: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-10-01',
     actualizado: '2026-10-05',
     dependencias: [],
@@ -269,3 +283,175 @@ test('formatearTabla: cabecera, separador y columnas alineadas', () => {
   assert.match(lineas[1] as string, /^\|-+\|-+\|/);
   assert.equal(new Set(lineas.map((l) => l.length)).size, 1, 'todas las lineas miden lo mismo');
 });
+
+// --- Coste en tokens (TASK-023) ---------------------------------------------
+
+/** Una fila de ejemplo con el coste dado; el resto como una tarea terminada cualquiera. */
+function conCoste(
+  id: string,
+  sprint: number,
+  complejidad: Task['complejidad'],
+  d: number | null,
+  i: number | null,
+  r: number | null
+): FilaMetricas {
+  return calcularFila(
+    entrada({
+      task: tarea({ id, sprint, complejidad, tokens_diseno: d, tokens_implementacion: i, tokens_revision: r }),
+    })
+  );
+}
+
+// Datos de ejemplo a mano: las cuentas de cada celda se verifican con la
+// aritmetica del propio test, no con el codigo que se prueba.
+const MUESTRA_TOKENS: FilaMetricas[] = [
+  conCoste('TASK-001', 1, 'simple', 100, 200, 300),
+  conCoste('TASK-002', 1, 'media', 300, null, 100),
+  conCoste('TASK-003', 2, 'simple', null, null, null), // sin ningun dato
+  conCoste('TASK-004', 2, 'simple', 50, 150, null),
+  conCoste('TASK-005', 3, null, null, null, null), // sprint entero sin datos, complejidad no declarada
+];
+
+test('tokens: totalTokens suma lo registrado, es null sin ningun dato y un 0 registrado SI es dato', () => {
+  assert.equal(totalTokens({ diseno: 100, implementacion: 200, revision: 300 }), 600);
+  assert.equal(totalTokens({ diseno: 300, implementacion: null, revision: 100 }), 400);
+  assert.equal(totalTokens({ diseno: null, implementacion: null, revision: null }), null);
+  assert.equal(totalTokens({ diseno: 0, implementacion: null, revision: null }), 0);
+});
+
+test('tokens: calcularFila copia sprint y las tres fases de la tarea', () => {
+  const f = MUESTRA_TOKENS[1] as FilaMetricas;
+  assert.equal(f.sprint, 1);
+  assert.deepEqual(f.tokens, { diseno: 300, implementacion: null, revision: 100 });
+});
+
+test('tokens: columnas de la tabla, «—» para null y curso = implementacion', () => {
+  const celdas = (f: FilaMetricas): string[] => COLUMNAS_TOKENS.map((c) => c.valor(f));
+  assert.deepEqual(COLUMNAS_TOKENS.map((c) => c.cabecera), ['tok_diseno', 'tok_curso', 'tok_revision', 'tok_total']);
+  assert.deepEqual(celdas(MUESTRA_TOKENS[0] as FilaMetricas), ['100', '200', '300', '600']);
+  assert.deepEqual(celdas(MUESTRA_TOKENS[1] as FilaMetricas), ['300', '—', '100', '400']);
+  assert.deepEqual(celdas(MUESTRA_TOKENS[2] as FilaMetricas), ['—', '—', '—', '—']);
+});
+
+test('tokens: la tabla incluye la tarea sin datos (no se excluye de la tabla, solo del resumen)', () => {
+  const tabla = formatearTabla(MUESTRA_TOKENS, [...COLUMNAS_METRICAS, ...COLUMNAS_TOKENS]);
+  const lineas = tabla.split('\n');
+  assert.equal(lineas.length, 2 + MUESTRA_TOKENS.length);
+  const sinDatos = lineas.find((l) => l.startsWith('| TASK-003 ')) as string;
+  assert.ok(sinDatos, tabla);
+  assert.match(sinDatos, /\| — +\| — +\| — +\| — +\|$/);
+});
+
+test('tokens: resumen por sprint: suma, media por fase sobre las tareas que la tienen, % y n con dato/total', () => {
+  const r = resumirTokens(MUESTRA_TOKENS, (f) => String(f.sprint), ['1', '2', '3']);
+  assert.deepEqual(r.map((g) => [g.grupo, g.nConDato, g.nTotal]), [['1', 2, 2], ['2', 1, 2], ['3', 0, 1]]);
+
+  const s1 = r[0] as ResumenTokensGrupo;
+  assert.deepEqual(s1.fases.diseno, { suma: 400, n: 2, media: 200, porcentaje: 40 });
+  // implementacion: solo TASK-001 la tiene; la media NO divide entre 2 (null no es 0).
+  assert.deepEqual(s1.fases.implementacion, { suma: 200, n: 1, media: 200, porcentaje: 20 });
+  assert.deepEqual(s1.fases.revision, { suma: 400, n: 2, media: 200, porcentaje: 40 });
+  assert.equal(s1.total, 1000);
+  assert.equal(s1.mediaTotal, 500);
+
+  // Sprint 2: TASK-003 no tiene dato y no entra en medias ni sumas.
+  const s2 = r[1] as ResumenTokensGrupo;
+  assert.deepEqual(s2.fases.diseno, { suma: 50, n: 1, media: 50, porcentaje: 25 });
+  assert.deepEqual(s2.fases.implementacion, { suma: 150, n: 1, media: 150, porcentaje: 75 });
+  assert.deepEqual(s2.fases.revision, { suma: 0, n: 0, media: null, porcentaje: 0 });
+  assert.equal(s2.mediaTotal, 200, 'media sobre la unica tarea con dato, no sobre las 2');
+
+  // Sprint 3: existe, y dice que no tiene datos en vez de desaparecer o dar NaN.
+  const s3 = r[2] as ResumenTokensGrupo;
+  assert.equal(s3.mediaTotal, null);
+  assert.equal(s3.total, 0);
+  assert.deepEqual(s3.fases.diseno, { suma: 0, n: 0, media: null, porcentaje: null });
+});
+
+test('tokens: resumen por complejidad declarada, con «—» para las no declaradas, en el orden del enum', () => {
+  const r = resumirTokens(MUESTRA_TOKENS, (f) => f.complejidad ?? '—', [...TASK_COMPLEXITIES, '—']);
+  assert.deepEqual(r.map((g) => [g.grupo, g.nConDato, g.nTotal, g.total]), [
+    ['simple', 2, 3, 800], // 600 + 200; TASK-003 sin datos
+    ['media', 1, 1, 400],
+    ['—', 0, 1, 0],
+  ]);
+});
+
+test('tokens: un total registrado de 0 no divide entre cero (sin NaN ni Infinity)', () => {
+  const r = resumirTokens([conCoste('TASK-009', 1, 'simple', 0, 0, 0)], (f) => String(f.sprint));
+  assert.equal(r[0]?.nConDato, 1, 'un 0 registrado es un dato');
+  assert.equal(r[0]?.fases.diseno.porcentaje, null);
+  const texto = formatearResumenTokens('sprint', r);
+  assert.doesNotMatch(texto, /NaN|Infinity|undefined/);
+});
+
+test('tokens: el resumen formateado dice con dato/total y no cuenta las tareas sin datos', () => {
+  const { porSprint, porComplejidad } = resumenesTokens(MUESTRA_TOKENS);
+  const lineas = porSprint.split('\n');
+  assert.match(lineas[0] as string, /^\| sprint +\| con dato\/total +\| diseno +\| curso +\| revision +\| total \(media\) +\|$/);
+  assert.match(lineas[2] as string, /^\| 1 +\| 2\/2 +\| 400 \(media 200, 40\.0%\) +\| 200 \(media 200, 20\.0%\) +\| 400 \(media 200, 40\.0%\) +\| 1000 \(media 500\) +\|$/);
+  assert.match(lineas[3] as string, /^\| 2 +\| 1\/2 +\| 50 \(media 50, 25\.0%\) +\| 150 \(media 150, 75\.0%\) +\| — +\| 200 \(media 200\) +\|$/);
+  assert.match(lineas[4] as string, /^\| 3 +\| 0\/1 +\| — +\| — +\| — +\| — +\|$/);
+  assert.match(porComplejidad, /\| simple +\| 2\/3 /);
+  assert.doesNotMatch(porSprint + porComplejidad, /NaN|undefined/);
+});
+
+test('tokens: sin ninguna tarea con dato, todos los grupos salen 0/N y sin cifras', () => {
+  const filas = [conCoste('TASK-001', 1, 'simple', null, null, null), conCoste('TASK-002', 1, 'simple', null, null, null)];
+  const g = resumirTokens(filas, (f) => String(f.sprint));
+  assert.deepEqual(g.map((x) => [x.nConDato, x.nTotal, x.mediaTotal]), [[0, 2, null]]);
+});
+
+test('bloque de tokens: determinista, con marcadores y sin ninguna fecha que ensucie los diffs', () => {
+  const a = renderBloqueTokens(MUESTRA_TOKENS);
+  assert.equal(renderBloqueTokens([...MUESTRA_TOKENS]), a);
+  assert.ok(a.startsWith(`${MARCADOR_INICIO_TOKENS}\n`));
+  assert.ok(a.endsWith(`\n${MARCADOR_FIN_TOKENS}`));
+  assert.doesNotMatch(a, /\d{4}-\d{2}-\d{2}/);
+  assert.match(a, /\| TASK-003 +\| 2 +\| simple +\| — +\| — +\| — +\| — +\|/);
+  assert.ok(!a.includes('\r'));
+});
+
+const BLOQUE = `${MARCADOR_INICIO_TOKENS}\nuno\n${MARCADOR_FIN_TOKENS}`;
+
+test('sustituirBloqueTokens: sin marcadores anade el bloque al final y no toca lo anterior', () => {
+  const previo = '# Metricas\n\ntexto con acentos: sesion 11 — cierre\n';
+  const r = sustituirBloqueTokens(previo, BLOQUE);
+  assert.ok(r.startsWith(previo), 'el resto queda byte a byte');
+  assert.equal(r, `${previo}\n${BLOQUE}\n`);
+  // Fichero que no acaba en salto de linea: se cierra la ultima linea sin comerse nada.
+  assert.equal(sustituirBloqueTokens('sin salto', BLOQUE), `sin salto\n\n${BLOQUE}\n`);
+  assert.equal(sustituirBloqueTokens('', BLOQUE), `${BLOQUE}\n`);
+});
+
+test('sustituirBloqueTokens: con marcadores sustituye SOLO lo de dentro y es idempotente', () => {
+  const antes = '# Metricas\n\nintro\n\n';
+  const despues = '\n\n## Otra seccion\n\ncola sin salto';
+  const viejo = `${MARCADOR_INICIO_TOKENS}\nVIEJO\n${MARCADOR_FIN_TOKENS}`;
+  const nuevo = `${MARCADOR_INICIO_TOKENS}\nNUEVO\n${MARCADOR_FIN_TOKENS}`;
+  const r = sustituirBloqueTokens(`${antes}${viejo}${despues}`, nuevo);
+  assert.equal(r, `${antes}${nuevo}${despues}`);
+  assert.equal(sustituirBloqueTokens(r, nuevo), r, 'segunda vez: ni un byte');
+});
+
+test('sustituirBloqueTokens: un fichero CRLF sigue siendo CRLF, bloque incluido, y lo de fuera no cambia', () => {
+  const previo = '# Metricas\r\n\r\ntexto\r\n';
+  const r = sustituirBloqueTokens(previo, BLOQUE);
+  assert.ok(r.startsWith(previo));
+  assert.ok(!/[^\r]\n/.test(r), 'ningun LF sin CR');
+  const otra = BLOQUE.replace('uno', 'dos');
+  const r2 = sustituirBloqueTokens(r, otra);
+  assert.ok(r2.startsWith(previo) && r2.includes('dos') && !r2.includes('uno'));
+  assert.ok(!/[^\r]\n/.test(r2));
+  assert.equal(sustituirBloqueTokens(r2, otra), r2);
+});
+
+test('sustituirBloqueTokens: marcadores sueltos, repetidos o desordenados se rechazan sin adivinar', () => {
+  const malos = [
+    `a\n${MARCADOR_INICIO_TOKENS}\nb\n`,
+    `a\n${MARCADOR_FIN_TOKENS}\nb\n`,
+    `${MARCADOR_FIN_TOKENS}\n${MARCADOR_INICIO_TOKENS}\n`,
+    `${BLOQUE}\n${BLOQUE}\n`,
+  ];
+  for (const m of malos) assert.throws(() => sustituirBloqueTokens(m, BLOQUE), BloqueTokensError);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
index 59356bc..a8dc554 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plan-desempate-skill.test.ts
@@ -38,6 +38,9 @@ function tarea(campos: Partial<Task> = {}): Task {
     skills_recomendados: [],
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-08',
     actualizado: '2026-09-08',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
index db2db27..f01b1c6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
@@ -32,6 +32,9 @@ function tarea(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-10-04',
     actualizado: '2026-10-04',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
index 19bec87..6ad31ff 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
@@ -25,6 +25,9 @@ function makeTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-03',
     actualizado: '2026-09-03',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-file.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-file.test.ts
index d66cdcf..a097928 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-file.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-file.test.ts
@@ -56,6 +56,9 @@ function fixtureTask(overrides: Partial<Task>): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-03',
     actualizado: '2026-09-03',
     dependencias: [],
@@ -79,6 +82,9 @@ const ROUNDTRIP_CASES: Array<{ nombre: string; task: Task; body: string }> = [
       modelo_sugerido: 'opus',
       asignado_a: 'carlos',
       revision_codex: true,
+      tokens_diseno: null,
+      tokens_implementacion: null,
+      tokens_revision: null,
       etiquetas: ['produccion', 'urgente'],
       dependencias: ['TASK-014'],
     }),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/tareas-reales.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/tareas-reales.test.ts
new file mode 100644
index 0000000..8b9b387
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/tareas-reales.test.ts
@@ -0,0 +1,44 @@
+/**
+ * TASK-023: los campos nuevos de `Task` (tokens_*) no pueden invalidar las
+ * tareas que ya existen. Este test relee TODAS las `tarea.md` reales de
+ * `tareas/04-terminadas/` con el parser actual, no fixtures sinteticas: es el
+ * que habria cazado un campo nuevo declarado como obligatorio.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, readdir } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { parseTareaFile, serializeTareaFile } from '../../src/core/tarea-file.js';
+
+// dist/test/core -> tres niveles arriba esta la raiz del plugin, y tres mas
+// la del repo (mismo truco que test/empaquetado/metadatos.test.ts).
+const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+const REPO_ROOT = path.resolve(moduleDir, '..', '..', '..', '..', '..', '..');
+const TERMINADAS = path.join(REPO_ROOT, 'tareas', '04-terminadas');
+
+test('todas las tarea.md reales de tareas/04-terminadas siguen validando con los campos de tokens', async (t) => {
+  if (!existsSync(path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json')) || !existsSync(TERMINADAS)) {
+    t.skip('sin tareas/04-terminadas: el plugin se esta probando fuera de su repo');
+    return;
+  }
+  const ids = (await readdir(TERMINADAS, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
+  assert.ok(ids.length > 0, 'no hay ninguna tarea terminada que releer: el test seria vacuo');
+  const fallos: string[] = [];
+  for (const id of ids) {
+    const fichero = path.join(TERMINADAS, id, 'tarea.md');
+    if (!existsSync(fichero)) continue;
+    try {
+      const { task, body } = parseTareaFile(await readFile(fichero, 'utf8'));
+      // Lo que no registra nadie es null, no un cero; y reescribirla no la rompe.
+      for (const c of ['tokens_diseno', 'tokens_implementacion', 'tokens_revision'] as const) {
+        assert.ok(task[c] === null || Number.isInteger(task[c]), `${id}: ${c}`);
+      }
+      parseTareaFile(serializeTareaFile(task, body));
+    } catch (e: unknown) {
+      fallos.push(`${id}: ${e instanceof Error ? e.message : String(e)}`);
+    }
+  }
+  assert.deepEqual(fallos, [], `tareas reales que ya no validan:\n${fallos.join('\n')}`);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/task.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/task.test.ts
index 047de9e..d254819 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/task.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/task.test.ts
@@ -1,6 +1,6 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { validateTask, TaskValidationError } from '../../src/core/task.js';
+import { validateTask, requireNullableNumber, TaskValidationError } from '../../src/core/task.js';
 
 function baseTaskData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
   return {
@@ -119,3 +119,43 @@ test('validateTask (TASK-042): complejidad null o ausente es "no declarada"; un
     (e: unknown) => e instanceof TaskValidationError && e.field === 'complejidad'
   );
 });
+
+// --- TASK-023: tokens_diseno / tokens_implementacion / tokens_revision -----
+
+const CAMPOS_TOKENS = ['tokens_diseno', 'tokens_implementacion', 'tokens_revision'] as const;
+
+test('requireNullableNumber: null y ausente dan null; un entero >= 0 pasa (0 incluido)', () => {
+  assert.equal(requireNullableNumber({ x: null }, 'x'), null);
+  assert.equal(requireNullableNumber({}, 'x'), null);
+  assert.equal(requireNullableNumber({ x: 0 }, 'x'), 0);
+  assert.equal(requireNullableNumber({ x: 48213 }, 'x'), 48213);
+});
+
+test('requireNullableNumber: rechaza cadena, flotante, negativo, NaN, infinito y booleano', () => {
+  for (const malo of ['12', '12k', '', 1.5, -1, -0.5, NaN, Infinity, true, [], {}]) {
+    assert.throws(
+      () => requireNullableNumber({ x: malo }, 'x'),
+      (e: unknown) => e instanceof TaskValidationError && e.field === 'x',
+      `deberia rechazar ${JSON.stringify(malo)}`
+    );
+  }
+});
+
+test('validateTask (TASK-023): una tarea SIN los campos de tokens valida y los deja en null', () => {
+  const t = validateTask(baseTaskData());
+  for (const c of CAMPOS_TOKENS) assert.equal(t[c], null, c);
+});
+
+test('validateTask (TASK-023): acepta enteros y null en cada campo, y rechaza lo demas con el campo en el error', () => {
+  const t = validateTask(baseTaskData({ tokens_diseno: 120000, tokens_implementacion: null, tokens_revision: 0 }));
+  assert.deepEqual([t.tokens_diseno, t.tokens_implementacion, t.tokens_revision], [120000, null, 0]);
+  for (const c of CAMPOS_TOKENS) {
+    for (const malo of ['12k', 1.5, -3]) {
+      assert.throws(
+        () => validateTask(baseTaskData({ [c]: malo })),
+        (e: unknown) => e instanceof TaskValidationError && e.field === c,
+        `${c}=${JSON.stringify(malo)}`
+      );
+    }
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
index 108c8c3..d887063 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
@@ -33,6 +33,9 @@ function tarea(overrides: Partial<Task> = {}): Task {
     skills_recomendados: [],
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-05',
     actualizado: '2026-09-05',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-reintento.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-reintento.test.ts
index 58fd1f9..1b1868a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-reintento.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-reintento.test.ts
@@ -29,6 +29,9 @@ const TASK: Task = {
   regla_seleccion_skill: null,
   ultimo_commit_revisado: null,
   revision_codex: false,
+  tokens_diseno: null,
+  tokens_implementacion: null,
+  tokens_revision: null,
   creado: '2026-10-04',
   actualizado: '2026-10-04',
   dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts
index 68a509c..db69a68 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts
@@ -31,6 +31,9 @@ function tarea(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-05',
     actualizado: '2026-09-05',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts
index 11ee37b..4110fed 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts
@@ -32,6 +32,9 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     skills_recomendados: [],
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-03',
     actualizado: '2026-09-03',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/transcripciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/transcripciones.test.ts
new file mode 100644
index 0000000..217b421
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/transcripciones.test.ts
@@ -0,0 +1,34 @@
+/**
+ * TASK-023: la busqueda de transcripciones valida el id por si misma (es la
+ * ultima defensa antes de componer una ruta) y respeta CLAUDE_CONFIG_DIR.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { buscarTranscripciones, directorioConfigClaude } from '../../src/fs/transcripciones.js';
+
+test('buscarTranscripciones: rechaza ids con .., separadores o no hexadecimales antes de tocar el disco', async () => {
+  const config = await mkdtemp(path.join(tmpdir(), 'taskctl-transcripciones-'));
+  try {
+    // Un fichero fuera de projects/ que una ruta compuesta sin validar alcanzaria.
+    await writeFile(path.join(config, 'agent-secreto.jsonl'), '{}', 'utf8');
+    for (const malo of ['../x', '..', 'a1b2c3/../d4', 'a1b2c3\\d4', '', 'zzzzzz']) {
+      await assert.rejects(() => buscarTranscripciones(config, malo), /agentId invalido/, malo);
+    }
+    assert.deepEqual(await buscarTranscripciones(config, 'a1b2c3d4'), [], 'sin projects/ no hay nada, y no falla');
+    const dir = path.join(config, 'projects', 'p', 's', 'subagents');
+    await mkdir(dir, { recursive: true });
+    await writeFile(path.join(dir, 'agent-a1b2c3d4.jsonl'), '{}', 'utf8');
+    assert.deepEqual(await buscarTranscripciones(config, 'a1b2c3d4'), [path.join(dir, 'agent-a1b2c3d4.jsonl')]);
+  } finally {
+    await rm(config, { recursive: true, force: true });
+  }
+});
+
+test('directorioConfigClaude: CLAUDE_CONFIG_DIR manda; sin ella, ~/.claude', () => {
+  assert.equal(directorioConfigClaude({ CLAUDE_CONFIG_DIR: '/x/y' }), '/x/y');
+  assert.match(directorioConfigClaude({}), /\.claude$/);
+  assert.match(directorioConfigClaude({ CLAUDE_CONFIG_DIR: '  ' }), /\.claude$/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts
index ff7c79e..b30765b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts
@@ -43,6 +43,9 @@ function tarea(overrides: Partial<Task> = {}): Task {
     skills_recomendados: [],
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-06',
     actualizado: '2026-09-06',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-fixtures.ts
index 0866e18..07130a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-fixtures.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-fixtures.ts
@@ -36,6 +36,9 @@ export function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-05',
     actualizado: '2026-09-05',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/review-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/review-fixtures.ts
index 8c44844..a7394bf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/review-fixtures.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/review-fixtures.ts
@@ -37,6 +37,9 @@ export function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-05',
     actualizado: '2026-09-05',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts
index f6f632a..bd0fafe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/sincronizacion-fixtures.ts
@@ -65,6 +65,9 @@ export function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-10-03',
     actualizado: '2026-10-03',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/start-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/start-fixtures.ts
index 7b72a57..02b0f4a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/start-fixtures.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/start-fixtures.ts
@@ -45,6 +45,9 @@ export function sampleTask(overrides: Partial<Task> = {}): Task {
     regla_seleccion_skill: null,
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-03',
     actualizado: '2026-09-03',
     dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts
index d77352b..532099c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/config.test.ts
@@ -261,6 +261,9 @@ test('limite_wip: con limite 3, dos tareas abiertas ya no bloquean; con 1, si',
     agente_revisor: 'general-purpose',
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-09-07',
     actualizado: '2026-09-07',
     dependencias: [],
@@ -299,6 +302,9 @@ test('limite_wip: el mensaje de error dice el limite real, no "una sola tarea"',
       agente_revisor: 'general-purpose',
       ultimo_commit_revisado: null,
       revision_codex: false,
+      tokens_diseno: null,
+      tokens_implementacion: null,
+      tokens_revision: null,
       creado: '2026-09-07',
       actualizado: '2026-09-07',
       dependencias: [],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
index ff1f34c..3a97fe8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
@@ -378,6 +378,9 @@ function tareaSinAprobar(complejidad: TaskComplexity): Task {
     skills_recomendados: [],
     ultimo_commit_revisado: null,
     revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
     creado: '2026-01-01',
     actualizado: '2026-01-01',
     dependencias: [],
````

## Excluido del diff (17 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-023/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-023/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-023/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-023/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-023/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-023/planificacion/plan-final.md                                    |  29 +++++++++++++
 tareas/{01-en-diseno => 02-en-curso}/TASK-023/tarea.md                                                       |  13 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  42 ++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/cadena.js                                     |   1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  12 ++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                   | 125 +++++++++++++++++++++++++++++++++++++++++++++--------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                                        |   5 +++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/registrar-coste.js                            | 196 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-transcripcion.js                            |  75 ++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       | 194 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js                                           |  19 ++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/transcripciones.js                                  |  55 ++++++++++++++++++++++++
 17 files changed, 739 insertions(+), 27 deletions(-)
````
