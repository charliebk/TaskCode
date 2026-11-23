---
id: TASK-153b
titulo: "candidatos 4D en la peticion de revision (parte b de TASK-153)"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 9829062
tokens_revision: 8857299
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: [TASK-153a]
---
## Objetivo

Parte b del troceo de TASK-153 (Regla 4D en la creacion de codigo y tests), partes TASK-153a, TASK-153b, TASK-153c en la rama feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test.

El CLI genera desde el diff una seccion con los posibles duplicados y los tests a mutar.

## Criterios de aceptacion
- [x] La peticion de revision trae una seccion de candidatos 4D generada desde el diff: por cada funcion o constante nueva, las existentes con nombre igual o parecido en el repo, con test contra un repo temporal real
- [x] La misma seccion lista los tests nuevos cuyo nombre promete algo comprobable; con diff sin candidatos lo dice en una linea; las revisoras y revision.md piden mutar esos tests

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T00:15:36Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T00:15:56Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T00:15:58Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T00:27:39Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T01:38:58Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — ddcdf62: helper buscado (distanciaEdicion, diffRangeForPaths, runGit, patron extras.seccionCobertura; ningun lector de definiciones previo); criterios citados; 5 tests nuevos, 5 mutaciones en rojo (seccion no anadida, nombres parecidos, promesas, fallo de git tragado, revision.md).
- code-quality-reviewer — ddcdf62

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T00:27:39Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 34 | 21917 | 9793847 | 13264 | 8 | 9829062 | - | - |
| 2026-11-23T01:31:10Z | revision | agente:aac2dd647e9f0f174 | 90 | 175979 | 6168104 | 45932 | 7 | 6390105 | 1 | - |
| 2026-11-23T01:53:49Z | revision | agente:a84afb28a8c38f943 | 42 | 130524 | 2322076 | 14552 | 9 | 2467194 | 2 | - |
- 4D — 320c084 (ronda 2): helper buscado (pathspecSinExcluidos/excluirDeRevision para las exclusiones, distanciaEdicion); criterios citados; 10 tests nuevos, 9 mutaciones de la ronda 1 ahora en rojo.
- code-quality-reviewer — 320c084

## Resultado

- core/candidatos-4d.ts saca del diff las definiciones nuevas (TS/JS, Rust, Python, Java/Kotlin/C#, bash) y las cruza con las de la rama base por nombre igual o parecido, con indice por longitud (coste acotado); detecta tambien nuevas parecidas entre si y los tests nuevos cuyo nombre promete algo comprobable. Topes de 15/3/15 con «y N mas». El patron de git grep y las extensiones viven en el mismo modulo que el filtro fino.
- fs/git.ts definicionesEnRef: git grep sobre la rama base, solo extensiones de codigo y sin lo excluido de la revision (dist/). review.ts anade `## Candidatos 4D` a la peticion; nunca aborta la ronda (si git falla, la seccion dice el motivo). revision.md pide comprobarla y mutar esos tests.
- Revision: ronda 1 cambios solicitados (IMP-1 coste sin prefiltro, IMP-2 protecciones sin test, 7 MENOR), todo corregido; ronda 2 aprobada, 10 mutaciones muertas, coste del peor caso pedido de 25 s a 5,9 s. El test de sincronia por lenguaje encontro que `pub struct` de Rust no se reconocia.
- Pendiente aceptado: coste residual en casos extremos (opcion: distanciaEdicion acotada) y dos mutaciones de MENOR sin red (mensaje de ENOBUFS, paso de excluir desde review), anotadas por el revisor de la ronda 2. La seccion la vera el plugin al publicar (el taskctl instalado es la 0.17.0).

## Verificacion ligera

- 2026-11-23T02:16:26Z: ronda 2; commit revisado 090c91b02e47f7c1fe7caa1f0b4158e37da20e50; commit verificado d0c4467dbadb4c37cc174c0aec8cedd130836acd; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts, taskcode-marketplace/plugins/taskcode-plugin/test/core/candidatos-4d.test.ts; corregidos: MENOR-1; pendientes: ninguno
