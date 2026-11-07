---
id: TASK-082
titulo: "Autorrevision del implementador antes de pedir revision"
tipo: feature
sprint: 0
etiquetas: [revision, skills, flujo]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-082-autorrevision-del-implementador-antes-de
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1302865
tokens_implementacion: null
tokens_revision: 3099932
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Con la 0.8 ninguna tarea de ToolsaWeb salio en una sola ronda y el 86% de los hallazgos son de implementacion (8 MENORES por tarea media). Antes de taskctl review, el implementador pasa la lista de comprobacion de la skill revisora que toca y corrige lo evidente, sin lanzar un agente nuevo.

## Criterios de aceptacion
- [x] La skill de la fase review manda pasar la lista de comprobacion de la skill revisora del dominio antes de taskctl review y dejar constancia en tarea.md
- [x] taskctl review avisa, sin bloquear, si tarea.md no tiene la constancia de la autorrevision, y lo cubren tests con repos Git temporales
- [x] Las listas de comprobacion de las revisoras viven en un solo sitio que leen tanto la autorrevision como el revisor, sin duplicarlas
- [x] npm test en verde (salvo los tres rojos conocidos de Windows)

## Resultado

**Implementado** (plan con 2 roles, arquitectura y riesgos, más las 4 decisiones de la persona):

- `skills/review/SKILL.md`: paso de **autorrevision** antes de `taskctl review`, sin lanzar agente. Lee solo la sección `## Que se revisa` de cada revisora (`../<revisora>/SKILL.md`), corrige lo evidente, commitea y anota en `tarea.md` `## Autorrevision` con una línea `- <revisora> — <commit>` por revisora, sin juicios.
- `src/core/autorrevision.ts` (nuevo, puro y total): `tieneAutorrevision` exige contenido bajo el encabezado (no cuentan líneas en blanco ni comentarios HTML; reutiliza `rangoDeSeccion`); `avisoAutorrevision` da el texto del aviso.
- `taskctl review` empuja el aviso a `avisos` (sale como `[AVISO]` por stderr, código 0), sobre la lectura fresca y antes de cualquier escritura.
- `taskctl siguiente --json` devuelve `revisores` en la fase review, desde la merge base con la rama base y con el mismo clasificador y exclusiones que `review` (`src/fs/revisores-rango.ts`: `excluirDeRevision`, `revisoresDelRango`; `ficherosParaRevision` sale de `diffParaRevision` en `fs/git.ts`). Sin rama local o con un fallo de Git, el campo se omite y `siguiente` no se cae.
- La lista vive en un solo sitio: la `## Que se revisa` de cada revisora. Se unificó el título en `csharp-autocad-ifc-reviewer` (era `## Que se revisa en este dominio`).
- Tests: `test/core/autorrevision.test.ts` (8), `test/commands/review-autorrevision.test.ts` (7, repos Git temporales y CLI real) y `test/skills/autorrevision.test.ts` (5: catálogo con 4 dominios + genérica, un solo `## Que se revisa` por revisora, la skill remite sin copiar ninguna línea). Mutantes propios: sin merge base, sin aviso y sin filtro de comentarios: los tres muertos.
- Suite: 1969 tests, 1966 pasan; los 3 rojos son los conocidos de Windows (symlink, `chmod`, CRLF).
- Smoke: `node bin/taskctl siguiente TASK-082 --json` sobre esta misma tarea devolvió `"revisores":["code-quality-reviewer"]`, y con esa lista se hizo su propia autorrevisión (sacó el test de «sin rama local», `70f0c5d`).

**Revisión** (ronda 1, code-quality-reviewer, aprobada; 10 mutantes, 9 muertos):

- MEN-1 (MENOR, implementación): el `catch` de `revisoresDeLaTarea` en `siguiente.ts` no tiene test; el mutante que relanza el error sobrevive. **No se corrige**: es una protección defensiva, correcta por lectura, y en modo automático corregirla obligaría a otra ronda sobre código ya revisado; el coste no compensa. Si algún día se toca `siguiente`, añadir el caso «rama base inexistente → sin `revisores`, sin excepción».
- Observación del revisor, no reportada como hallazgo: un `<!--` sin cerrar bajo `## Autorrevision` cuenta como contenido. Se acepta: el aviso es informativo.

**Decisiones de diseño a recordar**: la constancia se exige una vez por tarea, no por ronda; el aviso solo sale por stderr (llevarlo a `siguiente --json` queda como posible mejora).

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T03:03:48Z | plan | automatico | persona |
| 2026-11-07T09:50:16Z | approve | automatico | automatico |
| 2026-11-07T09:50:32Z | start | automatico | persona |
| 2026-11-07T10:13:01Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T09:49:47Z | diseno | agente:a16510ee8f123cf95,ae0f1f76e6c641aea,a16253767c1e058b3 | 54 | 175190 | 1099991 | 27630 | 46 | 1302865 |
| 2026-11-07T10:40:47Z | revision | agente:a75356ef3c60d8111 | 54 | 125934 | 2962157 | 11787 | 5 | 3099932 |

## Autorrevision

- code-quality-reviewer — 70f0c5d
