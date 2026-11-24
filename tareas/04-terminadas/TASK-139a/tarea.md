---
id: TASK-139a
titulo: "disfraces B1-B5 (parte a de TASK-139)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 11030221
tokens_revision: 2888776
creado: 2026-11-22
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-139 (Regla 4D: tests que no protegen lo que dicen), partes TASK-139a, TASK-139b en la rama fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di.

Enlace de poda-tests, cerrojo ilegible, mensaje bash de Git en Linux, test duplicado de review-tests-stat y criterios de TASK-133.

Objetivo de la tarea entera:

> Cerrar los disfraces que encontro la auditoria 4D de TASK-137 (docs/auditoria-4d.md, casos B1-B5): enlaces y ramas sin test, aserciones que solo corren en Windows y tests duplicados.

## Criterios de aceptacion

- [x] Un test falla si task-workflow/SKILL.md deja de enlazar poda-tests.md, y la rama de cerrojo ilegible de scripts/verificar-impacto.mjs tiene un test que falla al romperla
- [x] Las aserciones del mensaje bash de Git de doctor tienen equivalente que corre en Linux (o se documenta por que no), el test de 1100 ficheros de review-tests-stat se elimina o se justifica, y los criterios de TASK-133 quedan marcados segun su Resultado

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T00:44:49Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T00:45:29Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T00:45:32Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T01:05:37Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T01:22:03Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T03:25:18Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — c229ae2: tomarCerrojo reutilizado (exportado con dormir sustituible, sin copia para el test); textoBashUsado junto a resolverBash, donde ya vive la logica pura del bash; el test de 1100 ficheros no se borra porque es el unico que protege que review use el diff por lotes (mutante: review con una sola llamada a Git, rojo), y baja a 500; mutaciones en rojo: B1 sin el enlace, B3 sin el reintento del ilegible (y el reintento sin comprobar que el fichero existe cuelga el test hasta el timeout), B4 con la rama de Windows ampliada a darwin
- code-quality-reviewer — c229ae2
- 4D — 669a44c: solo el criterio 3 de TASK-133 y dos comentarios (solo Windows); sin codigo nuevo
- code-quality-reviewer — 669a44c (ronda 2)

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T01:05:37Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 74 | 35225 | 10977308 | 17614 | 18 | 11030221 | - | - |
| 2026-11-24T01:21:22Z | revision | agente:a2c007a146fb5b324 | 44 | 126702 | 2369611 | 11339 | 4 | 2507696 | 1 | - |
| 2026-11-24T01:29:34Z | revision | agente:aa4a779719a0300d4 | 8 | 102060 | 273508 | 5504 | 3 | 381080 | 2 | - |

## Resultado

- B1: poda-tests comprueba el enlace a poda-tests.md desde task-workflow/SKILL.md.
- B3: `tomarCerrojo`, exportado con un `dormir` sustituible, tiene test de la rama del cerrojo ilegible: reintenta antes de tomarlo y espera si en el reintento pasa a ser de un proceso vivo.
- B4: `textoBashUsado` (core/resolver-bash) es puro y se prueba en las tres plataformas. El cableado en doctor solo se observa en Windows y queda documentado.
- B5: el test de review con un grupo fragmentado no duplica al de 1300 rutas, porque es el único que prueba que review usa el diff por lotes (caza el mutante en Windows). Se justifica en el test y baja de 1100 a 500 ficheros.
- TASK-133: criterios 1, 2 y 4 marcados. El 3 queda sin marcar y con su motivo: TASK-134 se cerró con --sin-verificacion.
- Revisión: en la ronda 1, cambios solicitados (IMP-1: había marcado el criterio 3 sin evidencia); MEN-1 y MEN-2 corregidos. La ronda 2 aprueba.

## Duracion

- Estimada: 40 min
- Real (de la rama abierta al cierre con merge, sin pausas): 160 min
- Paso de la hora: 160 min reales frente a 40 estimados
- Cierre (finish): 2451 s, de 2026-11-24T02:44:27Z a 2026-11-24T03:25:18Z
