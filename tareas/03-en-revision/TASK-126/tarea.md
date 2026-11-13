---
id: TASK-126
titulo: "Verificacion por tipo de rama: los tests pesados solo en la puerta de release"
tipo: feature
sprint: 0
etiquetas: [agilidad, verificacion, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-126-verificacion-por-tipo-de-rama-los-tests
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 5822721
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: [TASK-115]
---
## Objetivo

Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y 29 de ellos son el paso de cargo test con los pesados --ignored; el cierre de TASK-306, con un solo test cambiado, espero 44 min 52 s. Hoy comando_verificacion es uno solo para cualquier finish y para el guardian de merges, sea feature, fix o release. Se busca una verificacion por tipo de rama de Git-Flow: los tests pesados (rendimiento, escala, --ignored) solo se exigen en la puerta de las ramas release/* (y hotfix/* si el proyecto lo declara), y las feature/* y fix/* se cierran con la completa sin pesados. Relacion con TASK-115 (completa por lote): ambas tocan finish-verificacion.ts y el guardian de merges, asi que va despues de ella. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [x] Una clave nueva comando_verificacion_pesada se ejecuta, ademas de comando_verificacion, solo en el finish y el guardian de merges de ramas release/*; finish de feature/* y fix/* no la ejecuta (test con repo temporal y una rama de cada tipo)
- [x] Una clave verificacion_pesada_en lista los tipos de rama que la exigen (release por defecto; hotfix opcional) y un tipo desconocido es error de config (test)
- [x] El guardian de merges no deja integrar una release sin una verificacion pesada en verde del commit que entra, y no la pide para feature ni fix (test)
- [x] Sin la clave, finish y el guardian se comportan como hoy (test de regresion) y taskctl doctor dice que puerta corre los pesados (test)
- [x] README, CHANGELOG y la skill finish explican como separar los pesados del comando de verificacion, con el ejemplo de cargo test --ignored
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

**Implementado.** Claves `comando_verificacion_pesada` (exige la completa,
usa `timeout_verificacion`) y `verificacion_pesada_en` (`[release]` por
defecto; admite `hotfix`; otro valor o la lista sin comando abortan). `finish`
corre los pesados tras la completa en verde solo en esos tipos de rama, tambien
en el camino idempotente (rama ya integrada a mano); guarda su propio memo
(`freno-verificacion-pesada.json`), anota la puerta `finish` modo `pesada` y en
rojo no integra. El guardian de merges exige el verde de los pesados del commit
para una release (o un hotfix listado); feature y fix no lo piden. `doctor`
anade a `puertas-verificacion` que puerta corre los pesados. Documentado en la
skill finish, docs/configuracion.md (con `cargo test -- --ignored` y como
separarlos en Node, Java y .NET), README (indice) y CHANGELOG.

**Evidencia.** `verificar-impacto`: 957/957. `verificacion-pesada.test.ts`:
11/11; los mutantes de la revision mueren.

**Revision por pares.** Ronda 1 (code-quality-reviewer, sonnet): aprobada con
correcciones, cambiada a cambios-solicitados por un IMPORTANTE.
- IMP-1 (corregido): el camino idempotente de finish no corria los pesados;
  ahora si, con test (release integrada a mano con los pesados en rojo).
- MEN-1 (corregido): faltaba test del guardian con hotfix (con y sin la lista).

## Rondas extra

- Ronda 3: Carlos (2026-11-13) pidio terminar la cola aceptando todas las recomendaciones; ronda acotada para verificar IMP-2 (mensaje del camino idempotente), en vez de integrar sin revisar.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T14:48:38Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T14:49:17Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T14:49:23Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T15:09:47Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T15:36:33Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T15:57:28Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T15:09:47Z | implementacion | sesion:bdb2d869-6133-422f-8b3d-f1c76840a4dc | 22 | 24129 | 5781240 | 17330 | 0 | 5822721 | - | - |
