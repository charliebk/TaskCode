---
id: TASK-105
titulo: "Verificacion proporcional B2: decision entre refs y huella para el nivel 2"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-105-verificacion-proporcional-b2-decision-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 697110
tokens_implementacion: 8286126
tokens_revision: 5262905
creado: 2026-11-11
actualizado: 2026-11-11
dependencias: [TASK-096]
---
## Objetivo

Segunda parte de TASK-096 (troceada por la regla de una hora, decision de Carlos 2026-11-11). Sobre la decision pura de TASK-096 (clave rutas_verificacion_parcial y resultado selectiva), decidirVerificacionEntre hace un segundo rutasDeTarea con los patrones documentacion + parcial solo si la base declara la clave y el diff no es solo documentacion; huellaDeCommit acepta un contexto opcional como huellaDelArbol; verificarConMemo no guarda el memo selectiva con el arbol sucio. Nada observable cambia todavia: finish y el guardian siguen tratando selectiva como completa. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [x] Con la clave declarada en la base, decidirVerificacionEntre devuelve selectiva si todo lo que no es documentacion cae en rutas_verificacion_parcial y completa si algo queda fuera, cambia .taskcode/config.yml o el diff no se puede calcular (un test por caso, repo temporal)
- [x] Sin la clave no se lanza ningun git de mas y la decision es la de la 0.14.0 (test)
- [x] huellaDeCommit con contexto casa con la huella que guarda la selectiva para la misma base; el memo selectiva no se guarda con el arbol sucio (test por caso)
- [x] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Resultado

**Implementado (B2 de TASK-096).** `fs/decision-documentacion.ts`: si la base declara `rutas_verificacion_parcial` (con su comando) y la tarea cambia codigo, `decidirVerificacionEntre` calcula `fueraDeParcial` con un `git diff` mas. Ese diff saca solo la lista excluida, con `rutasFueraDe`, y no repite el `rutasDeTarea` entero: es una desviacion del enunciado, intencionada y declarada en el plan. Con el arbol de trabajo (`conArbol`) se suma `rutasDelArbolFueraDe`, y los held-out se anaden a mano igual que a `fueraDeDocs`. Antes de los dos diffs se fijan los SHA de base y destino con un solo `rev-parse` (`resolverCommits`). Si cualquier lado falla, el campo no se pone y la decision es la completa. `necesitaNivel2` no lanza el segundo diff si el diff esta vacio, toca `.taskcode/config.yml` o es solo documentacion. `ResultadoDecision` gana `timeoutSelectivaS`, el de la BASE. `fs/git.ts`: `rutasFueraDe`, `rutasDelArbolFueraDe` y `resolverCommits`, extraidas de las funciones existentes sin cambiar sus firmas ni sus procesos. `fs/verificacion.ts`: `huellaDeCommit` acepta un `contexto` opcional y comparte con `huellaDelArbol` una sola `cabeceraDeHuella` (autorrevision). `contextoSelectiva` pasa a exportada. `VERSION_MEMO` sigue en 1.

**Decisiones de Carlos en el diseno (2026-11-11).**
- **D-A:** el memo selectiva no se guarda con el arbol sucio (`verificarConMemo` solo guarda con el arbol sucio la completa). Consecuencia aceptada: el freno Stop, con cambios sin commitear, vuelve a ejecutar la selectiva cada turno, hasta `timeout_verificacion_selectiva`. El coste se medira en ToolsaWeb antes de B3.
- **D-B:** se mantiene la salida temprana sin `rutas_documentacion`.
- **D-C:** el guardian corta `d.tipo !== 'documentacion'` a proposito. Asi se cierra el hueco que ambos roles del brainstorm senalaron: una `selectiva` solo se bloqueaba porque buscaba en un memo de otro tipo. Finish y el guardian muestran la selectiva con un motivo neutro (`motivoDeLaCompleta`) hasta B3/B5.
- La tarea se aprobo entera con 65 min estimados (la regla de una hora pedia trocear a partir de 60).

**Revision.** Ronda 1 (code-quality-reviewer, sonnet): **aprobada**, sin CRITICO ni IMPORTANTE. De los mutantes que se pudieron aplicar, todos murieron; M1 no compilaba y M13 no se pudo verificar. Se aceptan sin corregir dos MENOR:
- **MEN-1:** el motivo neutro pierde la lista de ficheros que daba la 0.14.0. Solo lo ve quien declare la clave nueva, que no se publica hasta B6, y B3/B5 sustituyen ese texto.
- **MEN-2:** la fijacion de SHA se prueba contando procesos `rev-parse`, no forzando la carrera. El riesgo ya estaba aceptado en el plan y forzarlo exigiria un doble de git.

**Suite.** `npm test` antes de la revision: 2192 tests, fallan solo los 3 conocidos de Windows (symlink en approve, chmod y CRLF en plan). El revisor obtuvo lo mismo en su clon. El test nuevo del guardian se comprobo contra la guarda antigua: falla con ella.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T16:31:34Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T16:53:15Z | approve | automatico | persona | 0.14.0 |
| 2026-11-11T16:53:25Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T17:24:52Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T16:50:15Z | diseno | agente:a25a8c72b6ced7c56,a089636ad00421193,a603edf36e62845a4 | 42 | 135991 | 532020 | 29057 | 35 | 697110 | - | - |
| 2026-11-11T17:24:52Z | implementacion | sesion:24f95d19-4916-4df1-bf7e-0932f0452ae3 | 88 | 82248 | 8169431 | 34359 | 18 | 8286126 | - | - |
| 2026-11-11T18:15:52Z | revision | agente:af5b38e2a58d197b7 | 82 | 146962 | 5095934 | 19927 | 5 | 5262905 | 1 | - |

## Autorrevision

- code-quality-reviewer — 959f33c
