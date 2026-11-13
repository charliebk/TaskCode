---
id: TASK-129
titulo: "Freno al crecimiento de la suite: presupuesto de tests por criterio, pesados marcados y aviso de crecimiento"
tipo: feature
sprint: 0
etiquetas: [agilidad, verificacion, tests, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-129-freno-al-crecimiento-de-la-suite-presupu
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 13948061
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: [TASK-126, TASK-128]
---
## Objetivo

Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y la revision ha pasado del 51 % al 59-65 % del tiempo de cada tarea; cada ronda anade tests (unos 1130 MENORES y 350 IMPORTANTES en 153 tareas) y la suite solo crece. Nada en el plan ni en las skills limita cuantos tests se escriben por criterio, los de rendimiento y escala corren con los demas y nadie avisa de que la suite crece o tarda mas. Se busca un presupuesto de tests por criterio en el plan y en la skill, que los tests de rendimiento y escala se marquen como pesados (los que TASK-126 solo corre en release/*) y que doctor y metricas avisen del crecimiento de la suite y de su duracion. Va despues de TASK-126 y de TASK-128, de cuyo registro sale la duracion de la completa. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [x] La plantilla de plan-final.md y la skill plan piden por cada criterio cuantos tests nuevos preve, con un presupuesto por defecto (por ejemplo 1 a 3) y el motivo si lo supera; la skill review trata como MENOR un test que duplica a otro ya existente (test sobre la plantilla y las skills)
- [x] Las skills plan y task-workflow explican como marcar un test de rendimiento o escala como pesado en Node, Rust, Java y .NET, y que corre solo con comando_verificacion_pesada (test que comprueba el texto)
- [x] taskctl metricas muestra, por version, el numero de tests y la duracion de la completa a partir del registro de verificaciones de TASK-128, y doctor avisa si cualquiera crecio mas de un umbral configurable (20 % por defecto) desde la version anterior (test con repo temporal)
- [x] Sin datos de duracion o de numero de tests, doctor y metricas no avisan ni fallan (test)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

**Implementado.** Presupuesto de tests por criterio: la plantilla de
`plan-final.md` lleva la linea «Tests nuevos por criterio (presupuesto de 1 a 3
por criterio; si se pasa, el motivo)» y la skill plan lo pide; la skill review
trata un test duplicado como MENOR. Anexo `task-workflow/tests-pesados.md`: el
presupuesto y como marcar pesados en Node, Rust, Java y .NET, que solo corren
con `comando_verificacion_pesada`. La completa de `finish`, su reintento y
`verificar-lote` anotan una linea `suite` en el registro de puertas con el
numero de tests (node, Jest, dotnet, Maven/Surefire, cargo, pytest; `-` sin
dato o con la salida recortada en runners que suman). `metricas --por-version`
muestra `tests` y `completa` por version y `doctor` (`crecimiento-suite`) avisa
si crecieron mas de `umbral_crecimiento_suite` (20 % por defecto) entre las dos
ultimas versiones con dato; sin datos, nada. Docs y CHANGELOG.

**Evidencia.** `verificar-impacto`: 953/953. Tests de la tarea en verde; los
mutantes de la revision mueren con los tests nuevos.

**Revision por pares.** Ronda 1 (code-quality-reviewer, sonnet):
cambios-solicitados.
- IMP-1 (corregido): la anotacion de la linea `suite` no tenia test; ahora la
  comprueban finish, el reintento y verificar-lote.
- IMP-2 (corregido): `contarTests` contaba a la baja sobre la cola de 16 KiB
  en cargo con varios crates o Maven multimodulo; con la salida recortada esos
  runners dan `-`.
- MEN-1 (corregido): tests de las columnas `tests` y `completa` por version.
- MEN-2 (corregido): test del umbral en el limite exacto.
- MEN-3 (corregido): la doc ya no promete Gradle.

Ronda 2 (haiku, acotada): cambios-solicitados. IMP-1 e IMP-2 confirmados; un
IMPORTANTE nuevo introducido por la correccion:
- IMP-3 (corregido): con la salida recortada, Maven de un solo modulo tambien
  quedaba sin cifra; ahora solo el multimodulo (`Reactor Summary`) da `-`.
  Test nuevo del cableado de `recortada` en `anotarSuite`.

Ronda 3 (extra, anotada en `## Rondas extra`, haiku, acotada): aprobada, sin
hallazgos nuevos.

## Rondas extra

- Ronda 3: Carlos (2026-11-13) pidio terminar la cola aceptando todas las recomendaciones; ronda acotada para verificar IMP-3, en vez de integrar sin revisar.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T16:11:15Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T16:11:41Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T16:11:43Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T16:34:21Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T17:07:22Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T17:18:29Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T16:34:21Z | implementacion | sesion:bdb2d869-6133-422f-8b3d-f1c76840a4dc | 46 | 39987 | 13882223 | 25805 | 2 | 13948061 | - | - |

## Verificacion omitida

- 2026-11-13T17:25:32Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
