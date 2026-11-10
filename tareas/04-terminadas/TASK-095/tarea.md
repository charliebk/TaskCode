---
id: TASK-095
titulo: "Revision que converge: desde la ronda 2 solo se verifican las correcciones"
tipo: feature
sprint: 0
etiquetas: [revision, agilidad]
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-095-revision-que-converge-desde-la-ronda-2-s
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 2517940
tokens_implementacion: 26219589
tokens_revision: 11388956
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Objetivo principal: aumentar la agilidad sin perder calidad. Que la revision por pares converja en vez de reabrirse en cada ronda, conservando todos los revisores que tiene hoy. Medido el 2026-11-10 (docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md): en ToolsaWeb las rondas medias pasan de 2,3 (0.8) a 3,8 (0.12), el tramo revision-cierre de 56 a 97 min y los tokens de revision por ronda de 2,6 a 6,4 M; los hallazgos por ronda no bajan (11, 17, 16; 13, 19, 19, 14, 17; un ADR con 14 rondas de unos 11 cada una). La causa esta en la regla de TASK-083 (0.12): un solo IMPORTANTE de cualquier revisor hace la ronda siguiente completa desde la base con todos los revisores, que encuentran otra tanda; la acotada salto en 1 de 42 rondas en OpenDockTrading. Las rondas tardias apenas aportan calidad nueva (2 CRITICOS nuevos en unas 77 rondas 3.a o posteriores), mientras que los revisores de dominio si aportan calidad propia (63 de 88 CRITICO/IMPORTANTE en ficheros que el generico no marco): se mantienen. Esta tarea corrige la regla de alcance de TASK-083; no anade otro mecanismo encima ni retira revisores.

## Criterios de aceptacion
- [x] Desde la ronda 2, la peticion de taskctl review lleva siempre 'Alcance: verificacion acotada' (aunque la ronda anterior tenga CRITICO o IMPORTANTE) y su diff va desde el ultimo commit revisado; tests en test/commands que lo comprueban con IMPORTANTE abierto, con CRITICO abierto y con merges entre rondas
- [x] La peticion acotada indica al revisor que verifique cada hallazgo abierto y el diff de la correccion, y que solo abra un hallazgo nuevo si es CRITICO o lo introduce la propia correccion; test que comprueba ese texto en la peticion de la ronda 2
- [x] En la ronda acotada, cada revisor de dominio que dejo hallazgos abiertos recibe su propia peticion para verificarlos (no los verifica el generico en su lugar); test con un diff de Rust y un IMPORTANTE de rust-wasm-reviewer abierto
- [x] Entre una ronda y la siguiente se corrigen TODOS los hallazgos de la ronda (CRITICO, IMPORTANTE y MENOR), y el que no compense corregir (solo MENOR) se marca aceptado con su motivo o se pasa a una tarea nueva, nunca se deja para la ronda siguiente; skills/review lo manda en todos los modos y taskctl review avisa si se abre la ronda siguiente con hallazgos de la anterior aun abiertos (test). Medido: en 0.8 la ronda 2 dejaba 0 hallazgos abiertos de mediana; desde 0.11, de 3 a 5
- [x] Tras la ronda 3 con hallazgos abiertos, taskctl siguiente devuelve accion preguntar en cualquier modo, y lo abierto se acepta documentado en Resultado o pasa a una tarea nueva; test de integracion en un repo temporal
- [x] taskctl review --completa sigue forzando una ronda completa desde la base (test de regresion)
- [x] El codigo de la regla antigua de alcance que deje de usarse se borra, y sus tests cambian de expectativa con el motivo escrito en Resultado; ningun test se borra sin sustituto
- [x] skills/review, skills/task-workflow, README y CHANGELOG describen la regla nueva y el principio de coste proporcional a la correccion
- [x] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

## Resultado

**Implementado.** Se corrige la regla de alcance de TASK-083 (0.12), causa medida de que la revision no convergiera (docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md): un CRITICO o IMPORTANTE en cualquier estado, tambien `corregido`, obligaba a una ronda completa desde la base, y como los revisores relistan lo corregido, cada ronda relanzaba una revision entera (hasta 14 rondas en una tarea). Ahora, desde la ronda 2, `alcanceRondaSiguiente` ya no mira la severidad y la ronda es una verificacion acotada; conserva las guardas fail-closed (sin informes, veredicto distinto de `cambios-solicitados`, tabla ilegible, plantilla, severidad desconocida, ningun hallazgo). `review.ts` reparte la acotada con `planDeVerificacion`: un grupo por revisor con pendientes (todo lo que no esta `aceptado`, `hallazgosPendientes`) y por cada dominio cuyos ficheros toca la correccion, todos con el delta entero y su propia seccion de pendientes. Las instrucciones acotadas llevan `REGLA_HALLAZGOS_NUEVOS` (nuevo solo si es CRITICO o lo introduce la correccion). Un merge entre rondas se nombra y no hace completa la ronda; sin commit revisado fiable, completa desde la base; `--completa` siempre desde la base; tras una acotada, una completa revisa desde la base. Aviso en `review` de hallazgos sin marcar `corregido` ni `aceptado`. Tope: `siguiente` pregunta en cualquier modo tras la ronda 3 (su motivo nombra las salidas y `--ronda-extra`) y `review` no abre la ronda 4 sin `--ronda-extra`. Se borran `soloMenores`, `rutasDeCeldaFichero`, `ficheroNombrado`, `ficherosNombrados` y el aviso de `veredicto`. Skills review y task-workflow (avance.md, revision.md), README y CHANGELOG actualizados. No se retira ningun revisor.

**Decisiones de la persona** (plan-final.md): las ocho, aplicadas. Revierten de forma explicita IMP-3 de TASK-058 e IMP-2 de TASK-059 («fuera del automatico se detiene SIEMPRE»): en el tope de rondas se pregunta tambien en manual y semiautomatico, porque detenerse sin decir que decidir dejaba la salida en manos de quien relanzaba review.

**Tests que cambian de expectativa, con su motivo:** `review-alcance.test.ts` se reescribe entero (fijaba la regla derogada; cada caso tiene sustituto: acotada con IMPORTANTE abierto, corregido, CRITICO abierto o aceptado; merge entre rondas; sin base fiable; `--completa`; dominio con pendientes, Java y Rust; dominio sin pendientes cuyo terreno toca la correccion; convergencia del caso real de OpenDockTrading hasta la ronda 4 con `--ronda-extra`; completa tras acotada desde la base; aviso de sin marcar; regla pura con fragmento plantilla). `review-incremental.test.ts`: un `corregido` ahora SI se lista (decision 3) y con la ronda anterior fragmentada cada revisor recibe los suyos. `core/siguiente.test.ts`: el tope da `preguntar` en los tres modos. `skills/fases.test.ts`: el texto de la skill review dice corregir TODO entre rondas.

**Revision por pares.** Ronda 1 (code-quality-reviewer, completa): 6 MENOR, ninguno grave; 20 de 23 mutantes muertos. Corregidos MEN-1, MEN-2, MEN-3, MEN-5 (Rust) y MEN-6 (el comando del tope ya no lleva el flag). Aceptados: MEN-4 (doble recuento de hallazgos en `taskctl metricas` cuando una ronda acotada lleva sufijo; consecuencia documentada de MEN-3 de TASK-064, a medir de nuevo al revisar metricas) y la parte de MEN-5 por spawn en manual y semiautomatico (el tope tiene test unitario en los tres modos y spawn en automatico; el revisor lo comprobo a mano). Ronda 2 (verificacion de correcciones por protocolo de arranque, aunque el taskctl 0.13 instalado la genero completa): aprobada, los tres mutantes supervivientes ya mueren.

**Suite completa:** 2084 tests, 2080 en verde; los 3 rojos son los conocidos de Windows (symlink EPERM, chmod en NTFS, CRLF). Tras las correcciones de la ronda 1: suite rapida 682/682 y los 197 tests afectados en verde.

**Limite que no cubren los tests:** que el revisor obedezca «solo abre un hallazgo nuevo si es CRITICO o lo introduce la correccion» no es observable en un test; se medira la convergencia real con la 0.14.0 en ToolsaWeb y OpenDockTrading.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T14:21:25Z | plan | automatico | persona | 0.13.0 |
| 2026-11-10T14:31:57Z | approve | automatico | persona | 0.13.0 |
| 2026-11-10T14:32:29Z | start | automatico | persona | 0.13.0 |
| 2026-11-10T15:08:56Z | review | automatico | persona | 0.13.0 |
| 2026-11-10T15:52:37Z | review | automatico | persona | 0.13.0 |
| 2026-11-10T16:07:08Z | finish | automatico | persona | 0.13.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-10T14:31:55Z | diseno | agente:a6b9f784261594d37,a2fe5217f2615f83c,aa7ccfea339b6866f,a7f1778732ca00ca2 | 116 | 216204 | 2257305 | 44315 | 72 | 2517940 | - | - |
| 2026-11-10T15:08:56Z | implementacion | sesion:f5a75e93-b137-4945-9f2a-de03fa092974 | 118 | 123942 | 26032972 | 62557 | 21 | 26219589 | - | - |
| 2026-11-10T15:48:29Z | revision | agente:a5b32c91a09a90f0e | 110 | 202417 | 9135888 | 37146 | 9 | 9375561 | 1 | - |
| 2026-11-10T16:06:32Z | revision | agente:a40be68dbd3be50f9 | 38 | 133967 | 1861865 | 17525 | 8 | 2013395 | 2 | - |

## Autorrevision

- code-quality-reviewer — e7d738e
