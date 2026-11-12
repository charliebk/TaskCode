---
id: TASK-122
titulo: "Coste por tarea independiente del tamano del proyecto"
tipo: feature
sprint: 0
etiquetas: [agilidad, escala, urgente, v0.16]
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-122-coste-por-tarea-independiente-del-tamano
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 57222246
tokens_revision: 5138780
creado: 2026-11-12
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

Problema que plantea Carlos (2026-11-12): si cada tarea paga algo que crece con el tamano del proyecto, el coste de las tareas crece sin limite; con n tareas, la tarea n cuesta del orden de n y el proyecto del orden de n al cuadrado, hasta que una tarea pequena cuesta tanto como el proyecto. En TaskCode la suite paso de 893 a 2289 tests en cinco semanas (de ~11 a ~25 min) y una tarea de una linea paga los 25; en ToolsaWeb cada finish paga 28 min de verificacion completa. Regla buscada: cada paso de una tarea cuesta en proporcion a lo que cambia la tarea, nunca al tamano del proyecto; lo que dependa del tamano del proyecto se paga una vez por version. Hay que descubrir exactamente que pasos poner o quitar para que el crecimiento del proyecto no afecte a la agilidad, sin perder la calidad que dan los tests (los de repos reales cazaron los CRITICOS de TASK-100 a TASK-108). Primera de la cola urgente para la 0.16.0, antes de TASK-121; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Datos de partida: docs/auditoria/AUDITORIA-METODO-2026-11-12.md y PASOS-PLUGIN-2026-11-12.md.

## Criterios de aceptacion
- [x] Un informe en docs/auditoria mide cada paso de una tarea (diseno, implementacion, verificacion, cada ronda de revision, cierre y contexto que leen los agentes) frente al tamano del proyecto (tests, ficheros, tareas cerradas) con datos de TaskCode, ToolsaWeb y OpenDockTrading, y marca cuales crecen con el proyecto (tabla con la tendencia de cada paso)
- [x] Cada paso que crece con el proyecto queda con su arreglo decidido con Carlos en el plan: pasa a depender solo de lo que cambia la tarea, se mueve a una vez por version, o se justifica por escrito
- [x] La verificacion de una tarea corre solo los tests de lo que cambia y la suite completa se corre una vez por version antes de publicar: en TaskCode, una tarea que toca un solo modulo verifica en menos de 2 min con mas de 2000 tests en la suite (medido)
- [x] Un listado reproducible da por fichero de test su duracion y cuantos procesos git lanza, y los 10 mas lentos quedan clasificados en necesita Git real o se puede probar sin Git; la regla de la piramide (logica sin Git, Git real solo en la capa de integracion) queda en docs/contexto/CONVENCIONES.md
- [x] taskctl metricas muestra el coste fijo por tarea (verificacion, revision y cierre) frente al numero de tareas cerradas del proyecto, para ver si crece (test con repo temporal)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

- **Verificacion por impacto en TaskCode** (`scripts/verificar-impacto.mjs`, `.taskcode/config.yml`): cada tarea corre los tests de lo que cambia mas `test:rapido`; la completa (`npm --prefix ... test`) queda para antes de publicar. Medido en Windows: un cambio en un unico modulo verifica en 14 s (748 tests) y esta rama entera en 48-70 s (788-791 tests), con el arbol limpio (criterio 3; antes, ~25 min).
- **`metricas --evolucion`** muestra por tramo el coste fijo (punta a punta, revision y finish) y una linea de tendencia (criterio 5). TaskCode: punta a punta 60,7 -> 78,4 min; ToolsaWeb 50,8 -> 120,8 min: crece.
- **Informe de escala** `docs/auditoria/ESCALA-2026-11-12.md` (criterios 1 y 2): de v0.1.1 a HEAD, 18 -> 93 tareas, 819 -> 2167 tests, README del plugin 22 -> 102 KB, skills 92 -> 189 KB. Arreglo por paso: verificacion (esta tarea), revisor que repite la suite (TASK-112), rondas por MENORES (TASK-099), troceos (TASK-121), diseno de tres agentes (modo rapido), contexto que leen los agentes (TASK-124, dada de alta).
- **Perfil de la suite** `docs/auditoria/PERFIL-TESTS-2026-11-12.md` y regla de la piramide en `docs/contexto/CONVENCIONES.md` y `CLAUDE.md` (criterio 4): 192 ficheros, 2312 tests, 79 ficheros sin git (1004 tests en 266 s); los 10 mas lentos se llevan casi la mitad del tiempo y varios no necesitan Git real.
- **Incidencia durante la tarea**: el freno Stop del plugin instalado corrio la primera version del script al final de cada turno; elegia casi toda la suite (por `config.yml` en 162 tests) y ensuciaba `dist/src`. Se desactivo la verificacion en la config (a9b72ba), se acoto el selector (tope de 10, documentacion y config que no amplian, corte en `src/cli.ts`, `dist/src` restaurado) y se reactivo (59ac637).
- **Revision por pares, ronda 1** (code-quality-reviewer, modo rapido): veredicto propuesto aprobada-con-correcciones; 3 IMPORTANTES y 6 MENORES, todos corregidos (85cc75a, 32c0979, f583be3, 815dff4): IMP-1 (con tope superado nunca se corren cero tests de lo que cambia: los N directos mas proximos), IMP-2 (perfil con ficheros no medidos: se marcan y se volvieron a medir), IMP-3 (base inexistente sale con error), MEN-1 (copia huerfana de `dist/src` restaurada al arrancar), MEN-2..6 (documentacion y avisos).
- **Cierre sin ronda 2: decision de Carlos (modo rapido)**. El coordinador comprobo: tests de verificar-impacto 14/14, base inexistente con codigo 1, un cambio en `src/commands/finish.ts` corre 10 tests directos (antes 0).
- **Cierre con `--sin-verificacion`**: el diff toca `.taskcode/config.yml`, lo que fuerza la completa en `finish` (unos 25 min); decision de Carlos de quitar las verificaciones finales en las tareas urgentes. La verificacion por impacto de la rama salio en verde (791/791, 70 s) y la completa se corre una vez antes de publicar.
- **Aviso** (MEN-5): hasta publicar e instalar la version nueva, el plugin 0.14.0 instalado ignora `rutas_documentacion` y `rutas_verificacion_parcial` (avisa sin abortar) y su `finish` correria la completa.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T14:05:39Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T14:08:11Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T14:08:12Z | start | automatico | persona | 0.14.0 |
| 2026-11-12T15:32:41Z | review | automatico | persona | 0.14.0 |
| 2026-11-12T16:30:18Z | finish | automatico | persona | 0.14.0 |

## Autorrevision

- code-quality-reviewer — 5ce9211

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12T15:32:41Z | implementacion | sesion:b6ee363f-d9c2-4a11-8e6e-4c193af66eed | 56 | 27781 | 11536598 | 13212 | 0 | 11577647 | - | - |
| 2026-11-12T15:32:41Z | implementacion | agente:ae58c72e5d2abe125 | 390 | 627770 | 44873200 | 143239 | 37 | 45644599 | - | - |
| 2026-11-12T15:55:09Z | revision | agente:a610c3553fe2a041a | 72 | 169118 | 4940566 | 29024 | 2 | 5138780 | 1 | - |

## Verificacion omitida

- 2026-11-12T16:30:11Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 150 min
- Real (de la rama abierta al cierre con merge, sin pausas): 142 min
- Paso de la hora: 142 min reales frente a 150 estimados
- Cierre (finish): 7 s, de 2026-11-12T16:30:11Z a 2026-11-12T16:30:18Z
