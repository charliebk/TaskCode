---
id: TASK-132
titulo: "Ayudante caso() de los tests fusionados en un unico helper compartido"
tipo: fix
sprint: 0
etiquetas: [tests, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-132-ayudante-caso-de-los-tests-fusionados-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 10896783
tokens_revision: null
creado: 2026-11-13
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

La poda de TASK-130 dejo la misma funcion caso() copiada en diez ficheros de test (MEN-2 de su revision). Moverla a test/helpers/caso.ts y usarla desde los diez, sin cambiar ninguna asercion. Modo rapido.

## Criterios de aceptacion
- [x] Una sola definicion de caso() en test/helpers/caso.ts; ningun fichero de test define la suya (comprobado con grep)
- [x] Los diez ficheros que la usaban pasan en verde sin cambiar ninguna asercion

## Resultado

**Implementado.** `caso()` vive en `test/helpers/caso.ts` (cuerpo identico, con
el tipo mas amplio de las copias, `fn: () => unknown`) y los diez ficheros de
test que la copiaban la importan; ninguna asercion cambia. Cierra el MEN-2 de la
revision de TASK-130.

**Evidencia.** Los diez ficheros: 106/106. `verificar-impacto`: en verde.

**Revision por pares (ronda 1, code-quality-reviewer, haiku): aprobada**, sin
CRITICOS ni IMPORTANTES; una nota informativa (la firma amplia es compatible).

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T19:27:38Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T19:28:09Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T19:28:11Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T19:33:28Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T19:33:28Z | implementacion | sesion:bdb2d869-6133-422f-8b3d-f1c76840a4dc | 38 | 15792 | 10872951 | 8002 | 0 | 10896783 | - | - |

## Verificacion omitida

- 2026-11-13T19:39:00Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
