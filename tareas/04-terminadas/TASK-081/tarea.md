---
id: TASK-081
titulo: "Revision mas barata: medir y acotar las lecturas de los revisores"
tipo: feature
sprint: 0
etiquetas: [revision, coste, metricas]
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-081-revision-mas-barata-medir-y-acotar-las-l
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 2267557
tokens_implementacion: 13328064
tokens_revision: 14929998
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Con la 0.8 los tokens de revision de una tarea media pasaron de 3.3 M a 6.8 M de mediana en ToolsaWeb mientras los KB por ronda de la peticion bajaban de 100 a 77: el exceso esta en lo que los revisores leen por su cuenta. Medir esas lecturas por revisor y ronda, acotarlas y usar un modelo mas barato en la ronda 2 cuando solo verifica correcciones.

## Criterios de aceptacion
- [x] taskctl metricas --tokens muestra por tarea las lecturas de cada revisor y ronda, sacadas de la transcripcion del subagente, y lo cubren tests con repos Git temporales
- [x] `peticion-revision-N[-skill].md` trae `## Contexto permitido` (carpeta de la tarea y ficheros del diff, sin ficheros fuera del diff ni tests reservados), `skills/task-workflow/revision.md` tiene la seccion `Lo que lees` que manda no leer fuera de ella salvo justificandolo, y el informe trae `## Lecturas fuera del contexto permitido`; lo cubren tests de `review` y de las skills
- [x] taskctl review en ronda 2 sugiere un modelo mas barato cuando la ronda 1 no dejo CRITICOS abiertos, y la sugerencia queda en la peticion
- [x] docs/METRICAS.md documenta las lecturas por revisor y el objetivo de volver a 3-4 M de tokens de revision en tareas medias
- [x] npm test en verde (salvo los tres rojos conocidos de Windows)

## Resultado

Lecturas de los revisores medidas por ronda y revisor, contexto de revision acotado y modelo mas barato
en la ronda de verificacion, sin dependencias nuevas.

- **Lecturas por revisor y ronda** (`core/coste-registro.ts`, `core/coste-transcripcion.ts`,
  `commands/registrar-coste.ts`): `## Coste` gana las columnas `ronda` y `revisor` (11; las filas de 9
  se siguen leyendo y nunca se reescriben). En `--fase revision` cada `--agente` va en su propia fila,
  con ronda y revisor deducidos del nombre `peticion-revision-N[-skill].md` del primer mensaje de
  usuario de su transcripcion (`rondaYRevisorDeTranscripcion`, regex unica en `fs/rondas.ts`). Lo no
  deducible queda «sin atribuir»; `--ronda N [--revisor <skill>]` como sustitutos con un unico
  `--agente`, validados contra las peticiones de `revision/`.
- **`metricas --tokens`** (`core/metricas.ts`, `commands/metricas.ts`): bloque aparte «Lecturas de
  revision por revisor y ronda» con lecturas, entrada, lectura de cache y CRITICO/IMPORTANTE del informe
  de esa ronda; tambien en `--json` (`lecturasRevision`), no en `--escribir`. Nunca lee `~/.claude`.
- **Contexto permitido** (`core/contexto-revision.ts`, `commands/review.ts`, `core/config.ts`): la
  peticion trae `## Contexto permitido` (tarea.md, `planificacion/`, ficheros de su parte del diff y la
  nueva clave `contexto_revision`), sin lo excluido, sin tests reservados ni carpetas que los contengan.
  El informe trae `## Lecturas fuera del contexto permitido`; la skill comun (`task-workflow/revision.md`)
  tiene la seccion «Lo que lees» y `code-quality-reviewer` remite a ella.
- **Modelo de la ronda de verificacion** (`core/modelo-revision.ts`, `commands/review.ts`, `cli.ts`):
  escalera opus→sonnet→haiku; en ronda 2+ la peticion anade `- Modelo sugerido para esta ronda:` solo
  con la regla estricta (0 CRITICOS en cualquier estado, tablas legibles, ninguna severidad desconocida,
  ningun informe-plantilla). `skills/review/SKILL.md` exige pasar al revisor la ruta de su peticion y
  lanzarlo con ese modelo. Enmienda escrita de la §16.6 en `docs/PROPUESTA_METODOLOGIA.md`.
- Documentacion: `docs/METRICAS.md` §12 (lecturas por revisor, que `lecturas` cuenta llamadas y no
  bytes, riesgo de doble conteo con un plugin viejo, objetivo de 3-4 M en tareas medias), README del
  plugin, ayuda de `cli.ts`, `skills/task-workflow/coste.md`.
- Tests nuevos: `test/core/coste-revision.test.ts`, `test/commands/revision-lecturas.test.ts`,
  `test/commands/review-contexto.test.ts`, `test/commands/review-modelo.test.ts`,
  `test/skills/lo-que-lees.test.ts` y el fixture `test/helpers/transcripcion-revision.ts`; seis tests
  existentes adaptados a la fila de 11 columnas y a `lecturasRevision`.
- Suite completa: 1949 tests, 1946 en verde; los 3 rojos son los conocidos de Windows (symlink EPERM,
  chmod en NTFS, CRLF).

### Decisiones de la persona (en el plan)

Deducir ronda y revisor de la transcripcion; hallazgos junto a las lecturas (solo por pantalla); regla
estricta para el modelo barato; dos columnas nuevas en `## Coste`. Criterio 2 concretado al aprobar.

### Dogfooding: la propia tarea

El coste de revision se registro con el CLI de la rama y la ronda 2 se abrio con el: la peticion sugirio
haiku y acoto el contexto a 7 rutas. Ronda 1 (sonnet, sin acotar): 12,5 M de tokens con solo 14
lecturas, casi todo lectura de cache (contexto acumulado de suite y mutantes). Ronda 2 (haiku, acotada):
1,97 M con 3 lecturas. Hallazgo para el objetivo: el exceso de tokens de revision no viene de leer
muchos ficheros sino del contexto que acumula el revisor; acotar lecturas ayuda menos que acotar lo que
ejecuta en su sesion.

### Revision por pares

- **Ronda 1** (general-purpose sonnet + `code-quality-reviewer`, cambios-solicitados): clon temporal,
  suite completa (solo los 3 rojos de Windows), 12 mutantes (9 detectados, 1 equivalente). Sin CRITICOS
  ni IMPORTANTES; se piden los MENOR baratos.
  - **MEN-1** (corregido): `--ronda` rechazaba rondas de dos cifras (faltaba la barra en `\d`). Test con ronda 10.
  - **MEN-2** (corregido): una carpeta en `contexto_revision` que contiene `aceptacion/` colaba los
    tests reservados. `contieneHeldout` la filtra; test puro sin `EXCLUIR_HELDOUT` en `excluir`.
  - **MEN-3** (aceptado): con dos peticiones citadas en el prompt se atribuye la primera; un agente
    reanudado hereda la ronda de su primer prompt. Heuristica documentada; `--ronda/--revisor` lo cubren.
  - **MEN-4** (corregido): test de que se saltan las lineas que no son de usuario (el mutante sobrevivia).
  - **MEN-5** (aceptado): solo `code-quality-reviewer` remite a «Lo que lees»; las otras cuatro leen
    `revision.md`, que la contiene. Sin impacto funcional.
- **Ronda 2** (general-purpose haiku, modelo sugerido por la propia regla, aprobada): las tres
  correcciones verificadas con un mutante cada una (los tres en rojo).
  - **MENOR-1** (aceptado): `contieneHeldout` no normaliza mayusculas (`Tareas/...` en NTFS). Solo
    afecta a una config del propio autor; lista nombres de carpeta, no contenido.
  - **MENOR-2** (aceptado): rutas con `..` no se resuelven antes de filtrar. Mismo motivo.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-07T01:11:38Z | plan | automatico | persona |
| 2026-11-07T01:25:45Z | approve | automatico | persona |
| 2026-11-07T01:25:58Z | start | automatico | persona |
| 2026-11-07T02:02:20Z | review | automatico | persona |
| 2026-11-07T02:50:37Z | review | automatico | persona | 0.12.0 |
| 2026-11-07T02:57:53Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T01:21:23Z | diseno | agente:a7026500409ebb476,a993ae855c1ae942f,a3a2a87a94737c00b,a805a8dd4beedf559 | 104 | 233859 | 1985007 | 48587 | 71 | 2267557 |
| 2026-11-07T02:02:01Z | implementacion | agente:a2f5d354f183bfce6,a5eb1fc78af12a8e6 | 254 | 324390 | 12889392 | 114028 | 16 | 13328064 |
| 2026-11-07T02:33:03Z | revision | agente:afccd6127689d0e5a | 148 | 204057 | 12305226 | 33004 | 14 | 12542435 | 1 | - |
| 2026-11-07T02:50:35Z | revision | agente:dif:afccd6127689d0e5a | 8 | 209077 | 208973 | 3844 | 0 | 421902 | 1 | - |
| 2026-11-07T02:57:01Z | revision | agente:a7b327969ed765081 | 36 | 127700 | 1804090 | 33835 | 3 | 1965661 | 2 | - |
