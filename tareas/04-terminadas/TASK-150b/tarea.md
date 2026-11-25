---
id: TASK-150b
titulo: "la plantilla del informe en un solo sitio (parte b de TASK-150)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 10711630
tokens_revision: 1988146
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: [TASK-150a]
---
## Objetivo

Parte b del troceo de TASK-150 (Regla 4D: skills y agentes con una sola fuente por regla), partes TASK-150a, TASK-150b, TASK-150c, TASK-150d en la rama fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f.

CONT-05: las revisoras dejan de copiar la plantilla y remiten a revision.md,
que describe la de `informeTemplate`.

## Criterios de aceptacion
- [x] La plantilla del informe vive solo en informeTemplate y revision.md; las revisoras remiten a ella en vez de copiarla
- [x] Un test falla si una revisora vuelve a copiar la plantilla

## Autorrevision

- code-quality-reviewer — 97f9ff3
- 4D — 97f9ff3: helper buscado (ESQUELETO, TITULO_ANTES y CAMPOS_CABECERA de revisores.test.ts reutilizados), usos buscados (titulo, Commit revisado y Contexto adicional pedido en skills/, agents/ y docs/: solo las cinco revisoras; tests 7 y 10c exigian la copia), criterios citados, 2 tests reescritos y 1 asercion, 3 mutaciones en rojo
- 4D menores — d175109: usos buscados (el test 7 lo cubria el 10c: borrado; comentarios de revisores.test.ts al dia), 0 tests nuevos

## Resultado

- CONT-05: las cinco revisoras (angular-vue, java-spring, rust-wasm, code-quality, csharp) dejan de copiar la cabecera del informe: rellenan el esqueleto de `taskctl review` (informeTemplate), como dice "El informe" de revision.md, con su nombre en `- Revisor:`, y solo listan sus secciones propias despues de `## Hallazgos`. Fuera «Contexto adicional pedido» (lo leido fuera va en `## Lecturas fuera del contexto permitido`) y el parrafo de «sin hallazgos», que ya define revision.md.
- Tests: el 10c de `revisores.test.ts` pasa de exigir la copia a prohibirla (titulo, campos de cabecera) y exige la remision; el antiguo 7 queda cubierto por el 10c y el 10f; `fuente-unica.test.ts` prohibe «Contexto adicional pedido». Mutaciones: 3 propias y 6 del revisor, todas en rojo.
- test:rapido 703/703; verificacion por impacto de review en verde.
- Revision ronda 1 (sonnet): aprobada con correcciones. MEN-1 (comentarios obsoletos en revisores.test.ts) y MEN-2 (test 7 redundante) corregidos y cerrados con verificar-menores.
- Cierre con `finish --sin-verificacion`, autorizado por Carlos el 2026-11-25: la suite completa dio 1 rojo, el intermitente de tiempos origin-deteccion.test (16 s); aislado, 5/5 en verde.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T10:59:58Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T11:01:03Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T11:01:05Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T11:12:44Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T12:51:23Z | finish | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T11:12:44Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 44 | 27218 | 10670804 | 13564 | 7 | 10711630 | - | - |
| 2026-11-25T12:02:59Z | revision | agente:a7682666261e4a69a | 32 | 139900 | 1837200 | 11014 | 5 | 1988146 | 1 | - |

## Verificacion ligera

- 2026-11-25T12:03:07Z: ronda 1; commit revisado 2aab1621747686dbd34a08f0596801914eb5d885; commit verificado d1751091ca97a04f4ce49068261f63defa0ac06a; ficheros: taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts; corregidos: MEN-1, MEN-2; pendientes: ninguno

## Verificacion omitida

- 2026-11-25T12:50:49Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 45 min
- Real (de la rama abierta al cierre con merge, sin pausas): 110 min
- Paso de la hora: 110 min reales frente a 45 estimados
- Cierre (finish): 34 s, de 2026-11-25T12:50:49Z a 2026-11-25T12:51:23Z
