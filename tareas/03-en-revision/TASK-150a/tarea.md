---
id: TASK-150a
titulo: "textos que contradicen al codigo o a la Regla 4D (parte a de TASK-150)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 9339872
tokens_revision: 6873589
creado: 2026-11-22
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-150 (Regla 4D: skills y agentes con una sola fuente por regla), partes TASK-150a, TASK-150b, TASK-150c, TASK-150d en la rama fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f.

CONT-01, 02, 03, 04, 09, 16 y 18: sincronizacion.md, cierre.md, review y
tests-pesados, las revisoras que piden contexto y la descripcion de la de
C#, con cada sitio que repita esas frases.

Objetivo de la tarea entera:

> Que cada regla de las skills y agentes este escrita en un solo sitio y coincida con el codigo (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CONT-01 a CONT-18 y CORE2-03).

## Criterios de aceptacion

- [x] sincronizacion.md, cierre.md, review y tests-pesados dicen lo mismo que el codigo y que revision.md (clave desconocida avisa, finish avisa de casillas, test duplicado sigue la Regla 4D); las revisoras no piden contexto explicitamente
- [x] La descripcion de cada revisora coincide con el reparto real (solo patrones de fichero) y ningun caso sale con dos severidades
- [x] Un test por regla falla si vuelve la frase contradictoria

## Autorrevision

- code-quality-reviewer — a8cb5e7
- 4D — a8cb5e7: helper buscado (cargarCatalogoRevisores, patron de seccion de los tests de skills), usos buscados (grep en skills/, agents/, docs/ y README de cada frase: clave mal escrita, casillas, test duplicado MENOR, pedir contexto, menciona, tres claves y ocho comandos), criterios citados, 3 tests nuevos con 7 mutaciones en rojo
- 4D — cdb198c: usos buscados tambien en test/ (el test de TASK-129 exigia la frase contradictoria: actualizado)
- code-quality-reviewer — 32c57d5
- 4D ronda 1 — 32c57d5: usos buscados (grep de pide/pidelo/pedido/pedir en revisoras, revision.md y agentes; el resto son la plantilla de 150b), 2 aserciones ampliadas con 2 mutaciones en rojo
- code-quality-reviewer — ceb7d1d
- 4D ronda 2 — ceb7d1d: usos buscados (la unica regex de pedir contexto es la de fuente-unica), 1 asercion corregida con 1 mutacion en rojo (pide siempre sin negrita)

## Resultado

- CONT-01 y CONT-16: sincronizacion.md dice lo que hace config.ts (una clave desconocida avisa y se ignora; solo aborta un valor invalido de una clave conocida) y deja de contar claves y comandos; todo commit automatico corre la sincronizacion (autoCommit).
- CONT-02: cierre.md dice que `finish` avisa de las casillas sin marcar (casillasSinMarcar).
- CONT-03: el test duplicado es duplicacion de la Regla 4D; review deja de rebajarlo a MENOR y tests-pesados remite a revision.md. El test de TASK-129 exigia la frase vieja: actualizado.
- CONT-04: las revisoras (angular-vue, java-spring, rust-wasm, csharp) y revision.md leen y anotan el contexto ("Lo que lees") en vez de pedirlo.
- CONT-09: la descripcion de la revisora de C# ya no promete reparto por mencion y nombra sus seis extensiones. CONT-18: el dialogo inutilizable con teclado solo es CRITICO en angular-vue.
- Tests: `test/skills/fuente-unica.test.ts` (3 tests) y el de TASK-129. Mutaciones en rojo: 7 en la implementacion, 2 en la ronda 1, 1 en la ronda 2.
- test:rapido 703/703; verificacion por impacto 830/830 (un rojo intermitente de tiempos en freno-presupuesto bajo carga: aislado, 7/7 verde).
- Revision ronda 1 (sonnet): cambios-solicitados. IMP-1 (rust-wasm aun pedia el contexto) corregido; MEN-2 (.ifcjson) y MEN-3 («la tercera es opcional») corregidos; MEN-1 (plantilla copiada con «Contexto adicional pedido») aceptado: lo quita TASK-150b.
- Revision ronda 2 (haiku): cambios-solicitados por IMP-2 (la regex exigia negrita), corregido con MEN-4. Ronda 3 extra decidida por Carlos al llegar al tope: aprobada, sin hallazgos nuevos.

## Rondas extra

- Ronda 3: Carlos, al llegar al tope (2026-11-25): IMP-2 de la ronda 2 ya corregido; una ronda acotada lo verifica.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T07:34:54Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T07:35:40Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T07:35:42Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T07:41:20Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T08:25:08Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T09:39:36Z | review | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T07:41:20Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 46 | 28499 | 9297000 | 14327 | 16 | 9339872 | - | - |
| 2026-11-25T08:25:01Z | revision | agente:a56cbe4b0a97ab279 | 68 | 184788 | 4951358 | 24363 | 15 | 5160577 | 1 | - |
| 2026-11-25T08:59:14Z | revision | agente:a299198556116f925 | 16 | 122754 | 746819 | 11837 | 2 | 881426 | 2 | - |
| 2026-11-25T10:20:26Z | revision | agente:a33b6839830498243 | 16 | 112709 | 708925 | 9936 | 2 | 831586 | 3 | - |
