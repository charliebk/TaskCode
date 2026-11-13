---
id: TASK-111
titulo: "P-3: registrar cada ejecucion del freno Stop y no correrlo si el turno no cambio codigo"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-111-p-3-registrar-cada-ejecucion-del-freno-s
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 6738509
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: [TASK-120]
---
## Objetivo

El freno Stop corre la verificacion al final de cada turno con tarea en curso (selectiva de 4,2 min en ToolsaWeb) y no queda registro de cuantas veces corre ni de su coste. Que cada ejecucion quede registrada, que metricas la sume y que no corra si el arbol no cambio desde el ultimo verde. Toca freno-stop.ts como TASK-110: va despues de ella. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-3)

## Criterios de aceptacion
- [x] Cada ejecucion del freno Stop anade una linea con instante, modo, duracion y resultado a un registro bajo .git/taskcode/ (test con repo temporal)
- [x] taskctl metricas muestra por tarea cuantas veces corrio el freno y su tiempo total, con — sin dato (test)
- [x] Si la huella del arbol no cambio desde el ultimo verde, el freno no ejecuta la verificacion y no anade salida (test)
- [x] La linea del freno usa el formato comun de registro de TASK-120 con puerta freno, y el resultado distingue verde, rojo, omitido (sin cambios desde el ultimo verde) y excedido, este ultimo reservado para el presupuesto de TASK-125 (test)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

**Implementado.** El freno Stop anota cada ejecucion en el registro de puertas
(`.git/taskcode/puertas.log`, puerta `freno`, modo = tipo de verificacion,
resultado `verde`/`rojo`/`omitido`; `excedido` declarado para TASK-125). Memo
propio del freno (`taskcode/freno-ultimo-verde.json`): con la huella de su
ultimo verde no ejecuta, no escribe progreso ni salida y anota `omitido`;
vale tambien con cambios sin commitear, donde el memo compartido de la
selectiva no se guarda (TASK-105). `taskctl metricas` anade las columnas
`freno_n` (ejecuciones reales, sin omitidos) y `freno` (tiempo total), con `—`
sin dato. Documentado en docs/registro-puertas.md y CHANGELOG.

**Evidencia.** `verificar-impacto`: 868/868. Tests afectados tras las
correcciones: 21/21; los mutantes que el revisor vio sobrevivir (M4, M5, M6 e
IMP-1) mueren.

**Revision por pares.** Ronda 1 (code-quality-reviewer, sonnet): aprobada con
correcciones, cambiada a cambios-solicitados por dos IMPORTANTES.
- IMP-1 (corregido): un rojo servido del memo compartido contaba como
  ejecucion; ahora se anota `omitido` (sigue bloqueando).
- IMP-2 (corregido): faltaba test del cableado de `metricas` con el registro
  real; anadido por el CLI en sincronizacion-fases.test.ts.
- MEN-1 (corregido): tests para no guardar el ultimo verde si la verificacion
  cambia el arbol y para el verde de memo como `omitido`.

Ronda 2 (code-quality-reviewer, haiku, acotada a las correcciones): aprobada,
sin hallazgos nuevos; los cuatro mutantes de las correcciones ponen tests en
rojo. Nota no bloqueante: un `omitido` servido del memo registra el tiempo
medido de la consulta (en la practica 0.0 s), no un 0 forzado.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T11:32:04Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T11:33:31Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T11:33:48Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T11:45:04Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T12:24:37Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T11:45:04Z | implementacion | sesion:bdb2d869-6133-422f-8b3d-f1c76840a4dc | 70 | 55599 | 6658926 | 23914 | 16 | 6738509 | - | - |

## Verificacion omitida

- 2026-11-13T12:36:04Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
