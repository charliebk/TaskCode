---
id: TASK-112
titulo: "P-4: el revisor reutiliza la verificacion de ronda y las rondas 2+ solo relanzan al revisor con pendientes"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-112-p-4-el-revisor-reutiliza-la-verificacion
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 559851
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

La ronda 2 cuesta el 94 % de la ronda 1 en ToolsaWeb: cada revisor clona, compila y corre la suite aunque taskctl review acabe de verificar el mismo commit, y en TASK-293 de ToolsaWeb cada ronda extra relanzo a los dos revisores aunque el hallazgo era de uno. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-4)

## Criterios de aceptacion
- [x] La peticion de revision trae el resultado de la verificacion de ronda (commit, huella, comando, estado) y la guia de revision dice que no se repite la suite si casa con el commit revisado (test sobre la peticion)
- [x] Desde la ronda 2, taskctl review solo genera peticion para los revisores con hallazgos no aceptados o cuyos ficheros toca la correccion (test con dos revisores en repo temporal)
- [x] Desde la ronda 2, la peticion de cada revisor lista solo sus hallazgos CRITICO e IMPORTANTE no resueltos de la ronda anterior junto al diff de la correccion, y la guia de revision pide comprobar esos y lo que toca la correccion, sin revisar de nuevo el resto ni los MENORES (test sobre la peticion)
- [x] Un revisor cuyos unicos pendientes son MENORES, y cuyos ficheros no toca la correccion, no se relanza en la ronda 2+ y consta asi en tarea.md (test con dos revisores en repo temporal)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

La verificacion de ronda lleva el commit verificado y su huella; en verde, la peticion
le dice al revisor que no la repita si el commit verificado es el revisado (la
revision de la propia tarea ya la aprovecho: el revisor no repitio la suite). En la
ronda acotada la tabla de cada revisor solo trae sus CRITICO e IMPORTANTE pendientes
(con una nota de cuantos MENORES no se reverifican); quien solo tenia MENORES vuelve
solo si la correccion toca sus ficheros (tambien el generico), y si no, consta en
`## Revisores no relanzados` de tarea.md. Guia actualizada en las instrucciones de la
peticion y en las skills review, task-workflow/revision.md y las cinco revisoras.

Revision por pares, ronda 1 (general-purpose + code-quality-reviewer, sonnet):
aprobada-con-correcciones.

- IMP-1 (IMPORTANTE, corregido): revision.md y las skills angular-vue, java-spring y
  rust-wasm seguian diciendo que se repite la suite y que se verifican los MENORES.
- MEN-1 (MENOR, corregido): las peticiones llevaban "TASK-112:" en su texto.
- MEN-2 (MENOR, corregido): test de la seccion en rojo, cortada y sin commit.
- MEN-3 (MENOR, corregido): quien vuelve con solo MENORES ya no lee "no tienes
  hallazgos pendientes", sino cuantos MENORES no se reverifican.

Ronda 2 (acotada, haiku): aprobada; IMP-1 y MEN-1..3 corregidos. Notas fuera de la
tabla, pendientes para una tarea futura: N-1, revision.md:93-94 aun dice "el revisor
corre la suite completa una vez por ronda" sin la excepcion; N-2, en una verificacion
de tipo documentacion la regla de no repetir puede leerse como si se hubieran corrido
tests (deberia emitirse solo en la selectiva).


## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T05:13:07Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T05:40:37Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T05:40:39Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T05:42:42Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T05:59:56Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T05:42:42Z | implementacion | sesion:1fb23e40-df0f-4598-9be1-751ce6506e3c | 2 | 2171 | 557067 | 611 | 0 | 559851 | - | - |

## Verificacion omitida

- 2026-11-13T06:25:41Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
