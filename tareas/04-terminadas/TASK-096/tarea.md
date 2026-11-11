---
id: TASK-096
titulo: "Verificacion proporcional B: con codigo parcial se verifica solo lo afectado"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-096-verificacion-proporcional-al-cambio-una
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1374110
tokens_implementacion: 6054969
tokens_revision: 5256700
creado: 2026-11-10
actualizado: 2026-11-11
dependencias: [TASK-100]
---
## Objetivo

Troceada en el plan por la regla de una hora (270 min estimados; decision de Carlos, 2026-11-11): esta tarea hace B1, la clave y la decision pura en core. Las demas partes son TASK-105 (fs: decision entre refs y huella), TASK-106 (finish nivel 2), TASK-107 (Stop, review y finish deciden igual), TASK-108 (guardian) y TASK-109 (documentacion y limpieza; no se publica version hasta cerrarla). Decisiones de Carlos del 2026-11-11, escritas en planificacion/plan-final.md: clave opt-in rutas_verificacion_parcial (lista de rutas permitidas, leida de la base, nombre definitivo), exige comando_verificacion_selectiva; el guardian no acepta la selectiva para codigo; cobertura omitida en el nivel 2; release y hotfix a la completa; la regresion se mide contra la 0.14.0. B1: la clave se parsea y valida en core/config.ts (validacion cruzada con comando_verificacion_selectiva, como la de TASK-091) y DecisionVerificacion gana el resultado selectiva, con los mismos ante la duda (diff nulo o vacio, cambio de .taskcode/config.yml) y release a la completa. Nada observable cambia: finish y el guardian tratan selectiva como completa hasta TASK-106 y TASK-108. El enunciado original sigue debajo.

Enunciado original. Troceada el 2026-11-10 (decision de Carlos): la parte A, una tarea de solo documentacion no corre la suite de tests, es TASK-100. Esta tarea queda con la parte B (nivel 2: con codigo parcial, verificar solo lo afectado) y no se empieza hasta que TASK-100 lleve un tiempo en uso y se mida cuanto queda por ganar. El enunciado original sigue debajo como contexto.

Objetivo principal: aumentar la agilidad sin perder calidad. Que el coste de verificar crezca con lo que la tarea cambia, no con el tamano del proyecto: los tests son necesarios, pero no en todos los momentos ni en todas las tareas. A medida que un proyecto crece, crecen sus tests, y hoy se pagan enteros aunque la tarea no los toque. Medido el 2026-11-10 (docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md): finish exige la completa en toda tarea (en ToolsaWeb unos 28 min, 18 de cargo test, tambien en tareas de solo documentacion); el freno Stop verifica al final de cada turno; 5 de las 7 tareas de ToolsaWeb en 0.11 eran estudios sin codigo, y las 10 de OpenDockTrading son documentos con un script de comprobacion. Tres niveles segun el diff de la tarea frente a la base, en los tres momentos (fin de turno, ronda de revision y finish): (1) solo documentacion: no se corre la suite de tests, solo las comprobaciones de documentacion si el proyecto las tiene; (2) una parte del codigo: los tests de lo afectado; (3) codigo transversal o sin clasificar: la suite completa. Se conserva la garantia de la 0.8/0.9 de no integrar nada roto: lo que no se pueda clasificar con seguridad va a la completa. El proyecto ya sabe clasificar su diff (la selectiva de ToolsaWeb lo hace); TaskCode no deberia duplicar ese conocimiento. La forma concreta (que el comando del proyecto decida que correr a partir del diff, o que TaskCode distinga rutas) se decide en el plan, revisando de forma explicita la decision de TASK-091 de exigir la completa antes de integrar. No se retira ningun freno: se ajusta su coste.

## Criterios de aceptacion
- [x] rutas_verificacion_parcial es una clave conocida de .taskcode/config.yml: patrones git :(glob) validados como rutas_documentacion (se rechazan los que casan con todo) y, sin comando_verificacion_selectiva, la config aborta (un test por caso, en test:rapido)
- [x] La tabla de decidirVerificacion cubre documentacion -> documentacion; codigo todo dentro de las rutas parciales -> selectiva; algo fuera, sin calcular, cambio de .taskcode/config.yml, o diff nulo o vacio -> completa (release y hotfix los excluye quien llama: finish no pasa base en un release, y el hotfix lo deja en la completa TASK-106); la prueba se pone roja si se comprueba selectiva antes que el cambio de config (un test por caso)
- [x] Sin la clave la decision es la de la 0.14.0 y finish y el guardian no cambian de comportamiento (las redes como en la 0.14.0 siguen en verde)
- [x] El plan deja escrita la decision sobre TASK-091 y la particion (TASK-105 a TASK-109)
- [x] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

## Resultado

**Implementado (B1 de TASK-096, troceada en el plan por la regla de una hora: 270 min estimados, decision de Carlos del 2026-11-11).** Clave nueva opcional `rutas_verificacion_parcial` en `core/config.ts`: patrones `git :(glob)` sin anclar, con la misma validacion que `rutas_documentacion` (rechaza los que casan con todo, rutas absolutas y `..`) y validacion cruzada: sin `comando_verificacion_selectiva` la config aborta. `core/verificacion-proporcional.ts`: `DecisionVerificacion` gana el resultado `selectiva`; `DiffTarea` gana `fueraDeParcial` (opcional: sin calcular = la completa); `comandoParcial` es el unico sitio que dice si el nivel 2 esta activo (`parcialDeclarada` y `patronesParcial` para TASK-105). Orden de la decision: sin docs ni parcial -> completa; diff nulo o vacio, o cambio de `.taskcode/config.yml` -> completa; solo documentacion -> documentacion; todo el codigo dentro de las rutas parciales -> selectiva; cualquier otra cosa -> completa. Nada observable cambia: el fs no calcula `fueraDeParcial` (TASK-105) y finish y el guardian solo reaccionan a `documentacion` (TASK-106 y TASK-108).

**Decision sobre TASK-091** (escrita en `planificacion/plan-final.md`): la completa sigue siendo obligatoria para integrar por defecto; declarar `rutas_verificacion_parcial` es la revision explicita de TASK-091 para ese proyecto, y solo vale si todo el codigo cae en esas rutas leidas de la base, no es release ni hotfix y no cambia la config. El guardian de merges no acepta la selectiva para codigo (D1). Lo que se retira (el texto «aunque las rondas usaran la selectiva» de finish) lo hace TASK-106/109. Ningun test existente cambia de expectativa en esta parte.

**Criterio 2 precisado** durante la implementacion: release y hotfix no entran en la decision pura; los excluye quien llama (finish no pasa base en un release; el hotfix lo deja en la completa TASK-106).

**Revision.** Ronda 1 (code-quality-reviewer, sonnet): el revisor aprobo con 3 MENOR (mutantes M2, M6 y M11 sobrevivian de 17); se registro `cambios-solicitados` por la regla del modo automatico para corregirlos antes de integrar. MEN-1: un diff solo de `tareas/**` sin `rutas_documentacion` daba `selectiva` con un motivo de «0 fichero(s)»: vuelve a la completa, como en la 0.14.0. MEN-2: los errores de la clave nueva no estaban probados con su nombre. MEN-3: `parcialDeclarada` sin el caso mixto. Los tres corregidos con su test; ronda 2 (haiku, acotada): aprobada, los tres mutantes mueren. Nota no abierta de la ronda 2: el «Ejemplo» de un error de forma de `rutas_verificacion_parcial` sale de la rama de `excluir_de_revision`; se pasa a TASK-109 (limpieza).

**Suite.** `npm test` antes de pedir la revision: 2181 tests, fallan solo los 3 conocidos de Windows (symlink en approve, chmod y CRLF en plan). Las correcciones de la ronda 1 son solo de core y van en `test:rapido` (710/710). La suite completa del revisor de la ronda 2 dio 335 rojos por su entorno (scripts lanzados con el bash de WSL sin instalar y `EBUSY` en el teardown), ninguno del diff.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T15:04:19Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T15:17:43Z | approve | automatico | automatico | 0.14.0 |
| 2026-11-11T15:17:52Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T15:47:51Z | review | automatico | persona | 0.14.0 |
| 2026-11-11T16:03:05Z | review | automatico | persona | 0.14.0 |
| 2026-11-11T16:28:07Z | finish | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T15:15:28Z | diseno | agente:a2c08b66bb6960263,afe339d0c94eadd6a,adbab668cb5880fcb,a93af7e5f319bef37 | 80 | 199162 | 1130341 | 44527 | 56 | 1374110 | - | - |
| 2026-11-11T15:47:51Z | implementacion | sesion:0c6b150d-050c-4a98-ad70-693d94aef42b | 60 | 49617 | 5984159 | 21133 | 1 | 6054969 | - | - |
| 2026-11-11T15:58:52Z | revision | agente:aafe4cf1f3a7ccd3e | 34 | 126267 | 1822180 | 12774 | 4 | 1961255 | 1 | - |
| 2026-11-11T16:27:22Z | revision | agente:a229b355981062c26 | 58 | 276192 | 2998800 | 20395 | 10 | 3295445 | 2 | - |

## Autorrevision

- code-quality-reviewer — 2bda5ea
- code-quality-reviewer — 07b8f62

## Duracion

- Estimada: 45 min
- Real (de la rama abierta al cierre con merge, sin pausas): 70 min
- Paso de la hora: 70 min reales frente a 45 estimados
