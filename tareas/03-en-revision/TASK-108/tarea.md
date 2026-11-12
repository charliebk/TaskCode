---
id: TASK-108
titulo: "Verificacion proporcional B5: el guardian de merges ante el nivel 2"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-108-verificacion-proporcional-b5-el-guardian
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1428123
tokens_implementacion: 4897055
tokens_revision: 18391248
creado: 2026-11-11
actualizado: 2026-11-12
dependencias: [TASK-106]
---
## Objetivo

Quinta parte de TASK-096. Decision de Carlos (D1, 2026-11-11): el guardian de merges NO acepta el verde de la selectiva para codigo; con codigo exige la completa aunque finish haya integrado con la selectiva (lado seguro: los CRITICOS de TASK-101 salieron del punto debil de comandoSoloIntegra). Se fija con tests y se mejora el mensaje cuando un merge a mano queda bloqueado (por ejemplo, tras un conflicto en un finish de nivel 2, o porque develop avanzo y la huella ya no casa). Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [x] Con rutas_verificacion_parcial declarada: el guardian deja pasar el merge de una tarea sin codigo con el verde de su verificacion de documentacion y bloquea el de una con codigo sin verde de la completa aunque exista el memo de la selectiva (un test por caso, repo temporal)
- [x] El guardian decide con la config del destino, no con la del arbol (test) — acotado a la decision 6b por la persona (decision 2 del plan, 2026-11-11)
- [x] El mensaje de bloqueo de un merge con codigo dice que hace falta la completa y como obtenerla (test sobre el texto)
- [x] Sin la clave nueva el guardian se comporta como en la 0.14.0 (test de regresion)
- [x] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T22:40:40Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T22:47:59Z | approve | automatico | automatico | 0.14.0 |
| 2026-11-11T22:48:10Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T23:14:10Z | review | automatico | persona | 0.14.0 |
| 2026-11-12T00:15:54Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T22:47:35Z | diseno | agente:a2a5ecc0346d9324a,afe06a71b5b03a1eb,a83a07992ade4abcb | 70 | 157689 | 1239869 | 30495 | 47 | 1428123 | - | - |
| 2026-11-11T23:14:10Z | implementacion | sesion:b4e87bc9-9df0-4298-9beb-5107e454beff | 62 | 50974 | 4824629 | 21390 | 13 | 4897055 | - | - |
| 2026-11-11T23:49:57Z | revision | agente:a5871a250e109ee36 | 80 | 134204 | 4713044 | 15571 | 2 | 4862899 | 1 | - |
| 2026-11-12T00:59:09Z | revision | agente:a30c110ca5157e1e2 | 192 | 187113 | 13275831 | 65213 | 11 | 13528349 | 2 | - |

## Autorrevision

- code-quality-reviewer — 4824f81
- code-quality-reviewer — 5cd4dee

## Resultado

Implementado (rama feature/task-108-verificacion-proporcional-b5-el-guardian):

- D1 ya estaba en el codigo desde TASK-105 (con codigo, una decision `selectiva` bloquea y el memo `selectiva` no se lee nunca); esta tarea lo fija con tests y mejora el mensaje.
- `src/hooks/guardia-merge.ts`: con `rutas_verificacion_parcial` en la config del destino y codigo, el bloqueo anade una linea propia: un merge a mano exige la completa en verde de ese commit aunque `finish` acepte la de lo afectado, y como integrar (`taskctl finish TASK-NNN`; tras un conflicto, resolverlo y relanzar finish). Nunca manda a «correr la completa y repetir el merge» (con nivel 2 nada la guarda donde el guardian la busca) ni nombra causas que no comprueba. Un release conserva su detalle propio y un merge hacia la principal (hotfix) no lleva la linea, porque alli finish tampoco acepta la selectiva.
- `motivoDeLaCompleta` sale de `fs/decision-documentacion.ts` (unico consumidor, el guardian); los comentarios que decian «hasta que el guardian la acepte (B5)» se reescriben con D1, incluida la cabecera del guardian y `finish-verificacion.ts`.
- Tests en `test/hooks/guardia-documentacion.test.ts` (6 nuevos): sin codigo pasa con el verde de documentacion; con codigo bloquea aunque conste el memo selectiva y pasa con el de la completa; texto del bloqueo; config del destino frente a la del arbol en los dos sentidos; regresion 0.14.0 sin la clave; release y hotfix.
- Suite completa: 2219 tests, solo los 3 rojos conocidos de Windows.

Decisiones de la persona (plan): el corte por tiempo del modo 2 de riesgos va a una tarea aparte (medir antes en ToolsaWeb); el criterio 2 se acota a la decision 6b (los pasos 3 y 6 siguen con la config del arbol, emparejados con finish); el remedio del mensaje es finish o --sin-verificacion, sin abrir `finish --completa`.

Revision por pares:
- Ronda 1 (sonnet, aprobada-con-correcciones; pedida como cambios-solicitados por el modo automatico): MEN-1 (un release con codigo y nivel 2 perdia su detalle) y MEN-2 (faltaba el test de release/hotfix del plan), corregidos en 5cd4dee; MEN-3 (la linea nueva repite en parte el pie comun), aceptado: aporta lo que el pie no dice y fundirlos cambiaria el texto que congela el criterio 4. Mutantes M1-M3 muertos.
- Ronda 2 (haiku, aprobada): MEN-1 y MEN-2 verificados, mutantes de la correccion muertos. Dos notas anteriores a la correccion, no corregidas:
  - Un hotfix nacido de develop que se mergea a mano en develop recibe la linea de la selectiva. Fuera del flujo real: un hotfix nace de la principal y su backmerge lo deja pasar el paso 5.
  - Un arbol sin `.taskcode/config.yml` hace que el paso 3 deje pasar un merge aunque el destino declare `comando_verificacion`. Es la acotacion del criterio 2 aprobada por la persona; queda para la tarea que mueva guardian y finish a la config del destino a la vez.
