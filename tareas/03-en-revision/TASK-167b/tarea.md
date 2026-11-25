---
id: TASK-167b
titulo: "detector de duplicados por cuerpo en el diff (parte b de TASK-167)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 11365330
tokens_revision: 10439684
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: [TASK-167a]
---
## Objetivo

Parte b del troceo de TASK-167 (Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)), partes TASK-167a, TASK-167b, TASK-167c, TASK-167d en la rama feature/task-167-regla-4d-preventiva-en-los-proyectos-que.

Modulo puro que, para cada definicion nueva o cambiada del diff, compara su
cuerpo (tokens normalizados: sin comentarios, identificadores y literales
genericos) con las definiciones existentes del proyecto y da los pares por
encima de un umbral. `taskctl review` lo avisa antes de abrir la ronda y lo
anade a `## Candidatos 4D` de la peticion. Avisa, no bloquea.

## Criterios de aceptacion
- [x] Al escribir codigo, taskctl detecta en el diff funciones casi identicas a otras ya existentes del proyecto y lo avisa antes de pedir revision, no solo como candidato para el revisor
- [x] Un test falla si el detector deja de encontrar un duplicado real con otro nombre, o si da por duplicadas dos funciones distintas

## Autorrevision

- code-quality-reviewer — c96edb5
- 4D — c96edb5: helper buscado (definicionesNuevas, definicionesDeGrep, definicionesEnRef, showFileAtRef, sinComentariosC y el repo de review-candidatos-4d reutilizados), usos buscados (no habia comparacion de cuerpos en src/ ni scripts/), criterios citados, 3 tests nuevos con 2 mutaciones en rojo
- 4D ronda 1 — 09ddcf3: usos buscados (showFileAtRef en review.ts sustituido por ficherosEnRef; loc de candidatos-4d y extension de cobertura-cambios reutilizados, sin copias; cat-file --batch ya existia solo en sondas-deploy, con otro formato de entrada por sha), 6 tests mutados en rojo (umbral 0.6 y 0.3, teja 1, corte sin llave, guarda de parentesis, salto de no-blob); sobre el diff real 0 pares y 2 s (antes 2 falsos positivos y unos 19 s)
- 4D menores — 9c9b7d3: notas de la ronda 2 (rama de Python por cabecera y corte por ; sin llave, sin test): 2 asserts nuevos, las 2 mutaciones en rojo

## Resultado

- Nuevo `src/core/duplicados-cuerpo.ts`: compara el cuerpo normalizado (identificadores, numeros y cadenas genericos, sin comentarios) de cada definicion nueva del diff con las de la rama base y entre si, por Jaccard de tejas de 4 tokens; umbral 0.85 y minimo de 30 tokens. El cuerpo se corta por llaves, por sangria en Python (aunque la firma ocupe varias lineas), y sin llave en `;`/`,` fuera de parentesis o en la siguiente linea al mismo nivel.
- `taskctl review` avisa (no bloquea) de los pares y los lista en `## Candidatos 4D` bajo «Posible duplicacion por cuerpo». Los ficheros se leen con un solo `git cat-file --batch` por ref (`ficherosEnRef` en `fs/git-crudo.ts`): 2 s sobre el diff real de la rama.
- Tests: `test/core/duplicados-cuerpo.test.ts` (copia renombrada si, esqueleto con otra logica no, cortes del cuerpo), `ficherosEnRef` en `test/fs/git-crudo-comun.test.ts` y el de review en `review-candidatos-4d.test.ts`.
- Revision ronda 1 (sonnet): cambios-solicitados. IMP-1 (cuerpo de definiciones sin llave: 2 falsos positivos en el propio diff), IMP-2 (umbral y teja sin test), MEN-1 (un `git show` por fichero, ~19 s, tope de 400 que cortaba sin avisar), MEN-2 (llave escapada de regex), MEN-3 (`loc` y `extension` duplicados): todos corregidos. Ronda 2 (haiku): aprobada; sus dos notas de mutantes vivos, corregidas en 9c9b7d3. No corregidas, por ser bordes sin efecto medido: N-2 (clase de caracteres `[(]` en una flecha de una linea) y N-3 (un `cat-file` de mas de 512 MB devuelve cero pares en silencio).

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T16:59:38Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T17:00:27Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T17:00:31Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T17:06:57Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T17:58:33Z | review | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T17:06:57Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 32 | 24262 | 11325179 | 15857 | 6 | 11365330 | - | - |
| 2026-11-25T17:58:19Z | revision | agente:a031f605875d95502 | 108 | 170678 | 7122415 | 28283 | 13 | 7321484 | 1 | - |
| 2026-11-25T18:48:53Z | revision | agente:a9df334886c9fe07f | 46 | 163571 | 2913328 | 41255 | 6 | 3118200 | 2 | - |

## Verificacion ligera

- 2026-11-25T18:49:56Z: ronda 2; commit revisado 09ddcf327b6311781c53b6aa2682907c993d9387; commit verificado 9c9b7d3f3b0e9a2a074ea16c92b4ae83912f33ec; ficheros: taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts; corregidos: ninguno; pendientes: ninguno
