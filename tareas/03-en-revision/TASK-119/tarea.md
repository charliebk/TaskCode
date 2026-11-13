---
id: TASK-119
titulo: "P-11: menos commits de proceso por tarea"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-119-p-11-menos-commits-de-proceso-por-tarea
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 20468686
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

Cada tarea deja 23-26 commits de los que 3-4 son de codigo: coste, veredicto, peticion e informe van en commits separados. Cada uno lanza varios procesos git en Windows y ensucia el historial. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-11)

## Criterios de aceptacion
- [x] registrar-coste y veredicto no crean commit propio: su cambio entra en el commit del siguiente comando de fase sin que la guarda de workspace limpio lo bloquee (test con repo temporal)
- [x] Un ciclo completo new, plan, approve, start, review con una ronda y finish deja como mucho la mitad de commits de proceso que hoy (test que los cuenta)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

**Implementado.** `registrar-coste` y `veredicto` ya no commitean (salvo `registrar-coste` sobre
una tarea terminada, que no tiene fase siguiente). Lo que dejan en la carpeta de la tarea lo
absorbe el commit del siguiente comando de fase: `approve` y `plan` lo dejan pasar en su guarda;
`review` y `finish` lo apartan en un stash con nombre (`src/fs/pendientes.ts`) mientras corren el
script de Git-Flow y la verificacion, y lo devuelven antes de su commit (o antes del commit de la
anotacion de la verificacion en `finish`). Un intento que muere con el stash puesto lo recupera el
siguiente desde la misma rama. Cualquier cambio fuera de la carpeta de la tarea sigue abortando.
`siguiente` ya no exige el informe commiteado. Las skills `plan`, `approve`, `review`, `finish` y
`coste` dejan de pedir commits a mano de plan final, informe, Resultado y coste.

**Evidencia.** `test/commands/pendientes-fase.test.ts` (repos temporales reales): un ciclo
new..finish con una ronda deja 6 commits de proceso, frente a 12 antes (contados en el historial
de TASK-112 mas los tres `registrar-coste`); guardas que siguen abortando; stash huerfano;
conflicto en el update de `review`; anotacion de verificacion en `finish`; cambio de rama. Dos
mutantes de la ronda 1 y dos de la ronda 2 mueren. `test:rapido` 788/788; `verificar-impacto`
866/867 (1 omitido); los `review-*`, `siguiente`, `plan` y `finish-*` restantes en verde salvo los
dos rojos conocidos de Windows de `plan.test.ts`. Expectativas cambiadas (no debilitadas) en
`registrar-coste`, `registrar-coste-agente`, `veredicto` y `verificacion-selectiva`: el contrato
paso de commitear a dejar pendiente, y se anadieron aserciones (aviso de `--push`, tarea terminada
que commitea y aborta con `tarea.md` a medias). Esta misma tarea se ha cerrado ya con el flujo
nuevo: el veredicto y los informes entraron en los commits de `review`.

**Revision.** Ronda 1 (code-quality-reviewer, sonnet): sin perdida de datos; IMP-1 (faltaban
tests de los caminos de error), MEN-1 (el error de un conflicto en `review` quedaba tapado),
MEN-2 (devolver en otra rama), MEN-3 (la rama subida al merge request no llevaba el informe) y
MEN-4 (recuperar desde otra rama). Ronda 2 (haiku, acotada): MEN-1/2/4 verificados; IMP-1
parcial (faltaba `finish` con el merge fallido), MEN-5 nuevo (HEAD desacoplado bloqueaba el
stash) y el motivo de aceptar MEN-3 no se sostenia. Todo corregido: test de `finish` con merge
fallido, `(no branch)` como rama vacia, y en modo merge request `finish` commitea lo pendiente
(`registros de la revision`) antes de subir la rama. Ronda 3 (haiku, acotada) para verificarlo.
Sin test propio, aceptado: reintento idempotente y hotfix/release con pendientes (el stash los
atraviesa igual que el camino probado).

**Hallazgo lateral (no corregido aqui):** un rojo de entorno (`EBUSY` al limpiar `dist/test`
porque un proceso tenia el directorio abierto) queda memorizado como resultado de la verificacion
selectiva y `review` lo repite sin volver a ejecutar hasta que cambia el arbol; hubo que borrar
`.git/freno-verificacion-selectiva.json` a mano.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T08:27:07Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T08:27:45Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T08:27:46Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T09:00:41Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T09:20:18Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T09:45:39Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T09:00:41Z | implementacion | sesion:d33593fd-82a4-4220-bd5f-b38ae82a7697 | 164 | 128911 | 20275481 | 64130 | 9 | 20468686 | - | - |

## Verificacion ligera

- 2026-11-13T10:01:09Z: ronda 3; commit revisado 5ba60e04321327dbee97994b26b63669d2fbe29a; commit verificado b8d71b1278a087931c37085e935b14aa27f9126f; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/pendientes-fase.test.ts; corregidos: MEN-6; pendientes: ninguno
