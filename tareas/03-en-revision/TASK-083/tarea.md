---
id: TASK-083
titulo: "Cierre sin ronda 2 completa cuando solo quedan MENORES"
tipo: feature
sprint: 0
etiquetas: [revision, coste, flujo]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-083-cierre-sin-ronda-2-completa-cuando-solo
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1187191
tokens_implementacion: null
tokens_revision: 3381275
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Muchas segundas rondas probablemente solo verifican MENORES. Primero confirmarlo con los veredictos de ToolsaWeb; si se confirma, cuando la ronda 1 no deja CRITICOS ni IMPORTANTES, verificar las correcciones con el diff de las correcciones en vez de otra revision completa.

## Criterios de aceptacion
- [x] Queda medido en docs/METRICAS.md cuantas rondas 2 de ToolsaWeb y TaskCode tenian solo MENORES abiertos tras la ronda 1
- [x] Si la medida lo justifica, taskctl review ofrece una verificacion acotada al diff de las correcciones cuando la ronda anterior solo dejo MENORES, y lo cubren tests con repos Git temporales
- [x] Un CRITICO o IMPORTANTE abierto obliga siempre a la ronda completa; lo cubre un test
- [x] npm test en verde (salvo los tres rojos conocidos de Windows)

## Resultado

**Medida (criterio 1)** — `docs/METRICAS.md` §13. Sobre 138 rondas 2 con ronda 1 legible (111 de ToolsaWeb, 27 de TaskCode; 12 de TaskCode sin tabla, anteriores a TASK-036, quedan como «sin dato»), **33 (23,9 %)** partian de una ronda 1 sin CRITICO ni IMPORTANTE en ningun informe y **0** encontraron uno nuevo en la ronda 2. Por fragmento solo aparece un caso nuevo de verdad (ToolsaWeb TASK-013, IMP-R2-1), y su ronda no era elegible porque otro fragmento tenia un IMPORTANTE: decidir por ronda entera lo deja fuera. Se cumple el umbral de la persona (>= 20 % y <= 10 % nuevos): se implementa.

**Implementacion (criterios 2 y 3)**

- `core/informe-revision.ts`: `alcanceRondaSiguiente(informes)` devuelve `{ acotada, modeloBarato, motivo, ficherosNombrados }` en una sola funcion pura, fail-closed: acotada solo si la ronda pidio cambios, todas las tablas se leen, ninguna es la plantilla, todas las severidades son del vocabulario, hay al menos un hallazgo y todos son MENOR. Un CRITICO o IMPORTANTE en cualquier estado (tambien `corregido`/`aceptado`) da completa. `modeloBaratoPermitido` (TASK-081) se muda aqui y `review.ts` la reexporta. Mas `rutasDeCeldaFichero`, `ficheroNombrado` y `soloMenores`.
- `commands/review.ts`: la ronda N+1 es acotada si lo permite la regla y ademas no se pidio `--completa`, hay diff de correcciones (no se cayo a la base), el delta no trae merges (`hayMergesEntre`, nuevo en `fs/git.ts`) y solo toca ficheros que nombra algun hallazgo (decision de la persona). La acotada va a un solo revisor (el generico), sin fragmentar ni sufijo, con instrucciones de verificacion (cada hallazgo, ejecutar la suite, buscar el fallo que abre la correccion). Toda peticion lleva `- Alcance: completa | verificacion acotada ... (motivo: ...)`. Tras una acotada, una completa revisa desde la rama base. `ReviewCommandResult` gana `alcance` y `motivoAlcance`; el CLI los imprime en las rondas N+1.
- `commands/veredicto.ts`: aviso sin bloqueo al registrar `cambios-solicitados` con una tabla que solo tiene MENORES (decision de la persona; el contrato de TASK-036 no cambia).
- Skills `task-workflow/revision.md` (§Rondas) y `review/SKILL.md`, y README del plugin.
- Tests: `test/commands/review-alcance.test.ts` (13; repos Git temporales y la regla pura). Suite completa: 1981 tests, 1978 pasan; los 3 rojos son los conocidos de Windows (symlink, `chmod`, CRLF).
- Autorrevision: acoto a cinco los ficheros que nombra el motivo (`5097269`).

**Revision** (ronda 1, code-quality-reviewer, aprobada sin hallazgos; 15 de 15 mutantes muertos). Observacion no reportada: un nombre corto en `Fichero` (`index.ts`) nombra cualquier fichero con ese final; es deliberado y como mucho deja acotada una ronda que podria ser completa.

**A vigilar**: forzar la completa cuando el delta toca un fichero no nombrado es estricto; si las correcciones suelen anadir tests en ficheros que el revisor no cito, el ahorro sera menor. Medirlo con `taskctl metricas --tokens` en las tareas que se cierren con la 0.12.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T10:48:07Z | plan | automatico | persona |
| 2026-11-07T10:54:59Z | approve | automatico | persona |
| 2026-11-07T10:55:07Z | start | automatico | persona |
| 2026-11-07T11:23:25Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T10:53:57Z | diseno | agente:aa9bd8279794f3936,a63bdfd6b4e968c1b,a57d8886528928bd6 | 50 | 184790 | 973454 | 28897 | 34 | 1187191 |
| 2026-11-07T11:45:21Z | revision | agente:abc27494eddfe4790 | 56 | 137927 | 3234272 | 9020 | 7 | 3381275 |

## Autorrevision

- code-quality-reviewer — 5097269
