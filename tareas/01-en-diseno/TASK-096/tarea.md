---
id: TASK-096
titulo: "Verificacion proporcional B: con codigo parcial se verifica solo lo afectado"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-096-verificacion-proporcional-al-cambio-una
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1374110
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-11
dependencias: [TASK-100]
---
## Objetivo

Troceada en el plan por la regla de una hora (270 min estimados; decision de Carlos, 2026-11-11): esta tarea hace B1, la clave y la decision pura en core. Las demas partes son TASK-105 (fs: decision entre refs y huella), TASK-106 (finish nivel 2), TASK-107 (Stop, review y finish deciden igual), TASK-108 (guardian) y TASK-109 (documentacion y limpieza; no se publica version hasta cerrarla). Decisiones de Carlos del 2026-11-11, escritas en planificacion/plan-final.md: clave opt-in rutas_verificacion_parcial (lista de rutas permitidas, leida de la base, nombre definitivo), exige comando_verificacion_selectiva; el guardian no acepta la selectiva para codigo; cobertura omitida en el nivel 2; release y hotfix a la completa; la regresion se mide contra la 0.14.0. B1: la clave se parsea y valida en core/config.ts (validacion cruzada con comando_verificacion_selectiva, como la de TASK-091) y DecisionVerificacion gana el resultado selectiva, con los mismos ante la duda (diff nulo o vacio, cambio de .taskcode/config.yml) y release a la completa. Nada observable cambia: finish y el guardian tratan selectiva como completa hasta TASK-106 y TASK-108. El enunciado original sigue debajo.

Enunciado original. Troceada el 2026-11-10 (decision de Carlos): la parte A, una tarea de solo documentacion no corre la suite de tests, es TASK-100. Esta tarea queda con la parte B (nivel 2: con codigo parcial, verificar solo lo afectado) y no se empieza hasta que TASK-100 lleve un tiempo en uso y se mida cuanto queda por ganar. El enunciado original sigue debajo como contexto.

Objetivo principal: aumentar la agilidad sin perder calidad. Que el coste de verificar crezca con lo que la tarea cambia, no con el tamano del proyecto: los tests son necesarios, pero no en todos los momentos ni en todas las tareas. A medida que un proyecto crece, crecen sus tests, y hoy se pagan enteros aunque la tarea no los toque. Medido el 2026-11-10 (docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md): finish exige la completa en toda tarea (en ToolsaWeb unos 28 min, 18 de cargo test, tambien en tareas de solo documentacion); el freno Stop verifica al final de cada turno; 5 de las 7 tareas de ToolsaWeb en 0.11 eran estudios sin codigo, y las 10 de OpenDockTrading son documentos con un script de comprobacion. Tres niveles segun el diff de la tarea frente a la base, en los tres momentos (fin de turno, ronda de revision y finish): (1) solo documentacion: no se corre la suite de tests, solo las comprobaciones de documentacion si el proyecto las tiene; (2) una parte del codigo: los tests de lo afectado; (3) codigo transversal o sin clasificar: la suite completa. Se conserva la garantia de la 0.8/0.9 de no integrar nada roto: lo que no se pueda clasificar con seguridad va a la completa. El proyecto ya sabe clasificar su diff (la selectiva de ToolsaWeb lo hace); TaskCode no deberia duplicar ese conocimiento. La forma concreta (que el comando del proyecto decida que correr a partir del diff, o que TaskCode distinga rutas) se decide en el plan, revisando de forma explicita la decision de TASK-091 de exigir la completa antes de integrar. No se retira ningun freno: se ajusta su coste.

## Criterios de aceptacion
- [ ] rutas_verificacion_parcial es una clave conocida de .taskcode/config.yml: patrones git :(glob) validados como rutas_documentacion (se rechazan los que casan con todo) y, sin comando_verificacion_selectiva, la config aborta (un test por caso, en test:rapido)
- [ ] La tabla de decidirVerificacion cubre documentacion -> documentacion; codigo todo dentro de las rutas parciales -> selectiva; algo fuera, cambio de .taskcode/config.yml, diff nulo o vacio, o release -> completa; la prueba se pone roja si se comprueba selectiva antes que el cambio de config (un test por caso)
- [ ] Sin la clave la decision es la de la 0.14.0 y finish y el guardian no cambian de comportamiento (las redes como en la 0.14.0 siguen en verde)
- [ ] El plan deja escrita la decision sobre TASK-091 y la particion (TASK-105 a TASK-109)
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T15:04:19Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T15:17:43Z | approve | automatico | automatico | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T15:15:28Z | diseno | agente:a2c08b66bb6960263,afe339d0c94eadd6a,adbab668cb5880fcb,a93af7e5f319bef37 | 80 | 199162 | 1130341 | 44527 | 56 | 1374110 | - | - |
