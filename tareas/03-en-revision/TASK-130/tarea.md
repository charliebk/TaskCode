---
id: TASK-130
titulo: "Poda periodica de tests redundantes: fusionar o borrar sin perder cobertura"
tipo: feature
sprint: 0
etiquetas: [agilidad, verificacion, tests, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-130-poda-periodica-de-tests-redundantes-fusi
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 50429831
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: [TASK-129]
---
## Objetivo

Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y el cierre de TASK-306, con un solo test cambiado, espero 44 min 52 s. Cada tarea y cada ronda suman tests, y ninguno se retira aunque otro posterior ya cubra lo mismo. Se busca una tarea de mantenimiento periodica, propuesta por el plugin cuando la suite crece, que fusione o borre los tests redundantes sin bajar la cobertura de las lineas que ya cubrian, y una primera pasada sobre la suite de TaskCode (docs/auditoria/PERFIL-TESTS-2026-11-12.md tiene su perfil por fichero). Usa el aviso de crecimiento de TASK-129: va despues de ella. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [x] taskctl doctor propone abrir una tarea de poda (con el comando taskctl new ya escrito) cuando salta el aviso de crecimiento de la suite o han pasado mas de N tareas cerradas desde la ultima poda, con N configurable y 30 por defecto (test con repo temporal)
- [x] La skill task-workflow describe el procedimiento de poda: como localizar duplicados, que se fusiona y que se borra, y que la cobertura de las lineas que cubrian no baja (comprobado con la cobertura sobre lineas de TASK-074)
- [x] Primera pasada en TaskCode: la suite rapida y la completa pierden al menos un 10 % de duracion o de numero de tests sin bajar la cobertura total, con el antes y el despues anotados en el plan (comprobado con scripts/perfil-tests.mjs)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

**Implementado.** `doctor` (`poda-tests`) propone abrir una tarea de poda, con
el `taskctl new` ya escrito y la etiqueta `poda`, cuando salta el aviso de
crecimiento de la suite o hay mas de `tareas_entre_podas` (30 por defecto)
tareas terminadas desde la ultima poda. Anexo `task-workflow/poda-tests.md`:
localizar candidatos, fusionar o borrar y que la cobertura de lineas no baje.

**Primera pasada en TaskCode** (detalle en el plan, seccion «Medida»): 28
ficheros de test fusionados por seis agentes en paralelo. Rapida (perfil): 819
-> 624 tests (-23,8 %); completa, tests de primer nivel: 2331 -> 1858
(-20,3 %). Cobertura de los ficheros tocados, con el mismo `src`: 21 276 lineas
de `src` cubiertas antes y despues, ninguna perdida. La revision cuenta las
aserciones: iguales en 26 de 28 ficheros; en `task.test.ts` 9 `assert.throws`
pasaron a una tabla en bucle (mismos casos) y en `wrappers.test.ts` se quitaron
dos aserciones que el mismo test fusionado ya hacia (el plan decia «ningun
borrado»: este es el unico, un duplicado exacto).

**Evidencia.** `verificar-impacto`: 747/747 (una primera peticion de revision
se corto a los 600 s por carga de la maquina y el memo guardo el corte; se borro
el memo y se repitio en verde).

**Revision por pares (ronda 1, code-quality-reviewer, sonnet): aprobada con
correcciones**, sin CRITICOS ni IMPORTANTES; mutantes de doctor y de funciones
cubiertas por tests fusionados detectados.
- MEN-1 (corregido): faltaba el caso del limite exacto de `tareas_entre_podas`.
- MEN-2 (aceptado): el ayudante `caso()` de las fusiones esta repetido en diez
  ficheros; es estilo, no afecta a deteccion ni cobertura; se unifica en la
  proxima poda.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T17:25:56Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T17:26:39Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T17:26:40Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T19:11:02Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T19:11:02Z | implementacion | sesion:bdb2d869-6133-422f-8b3d-f1c76840a4dc | 102 | 81761 | 28567283 | 30555 | 4 | 28679701 | - | - |
| 2026-11-13T19:11:02Z | implementacion | agente:a01a40fec480ed729 | 38 | 120276 | 1728481 | 30046 | 5 | 1878841 | - | - |
| 2026-11-13T19:11:02Z | implementacion | agente:a23547741e06758a7 | 26 | 107428 | 1097664 | 10453 | 1 | 1215571 | - | - |
| 2026-11-13T19:11:02Z | implementacion | agente:a477cc4f3d7e64281 | 44 | 135831 | 2325240 | 29980 | 2 | 2491095 | - | - |
| 2026-11-13T19:11:02Z | implementacion | agente:a4f464a242ed1ac49 | 66 | 127779 | 3407486 | 25732 | 4 | 3561063 | - | - |
| 2026-11-13T19:11:02Z | implementacion | agente:a76995a8bcf811be5 | 90 | 219293 | 7595001 | 75536 | 3 | 7889920 | - | - |
| 2026-11-13T19:11:02Z | implementacion | agente:abe9a2d046b12d1f9 | 82 | 134832 | 4555407 | 23319 | 9 | 4713640 | - | - |

## Verificacion ligera

- 2026-11-13T19:25:55Z: ronda 1; commit revisado 24cb77c1e25871be2337d05dc6d3ff169a15e58b; commit verificado b537d29bfa4b51520e6ed7f206c1e7579287f0ca; ficheros: taskcode-marketplace/plugins/taskcode-plugin/test/core/poda-tests.test.ts; corregidos: MEN-1; pendientes: ninguno

## Verificacion omitida

- 2026-11-13T19:26:31Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
