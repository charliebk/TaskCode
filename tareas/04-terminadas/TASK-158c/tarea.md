---
id: TASK-158c
titulo: "verificar-impacto no devuelve dist/src si HEAD cambio (parte c de TASK-158)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 3490185
tokens_revision: 3549788
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: [TASK-158b]
---
## Objetivo

Parte c del troceo de TASK-158 (Regla 4D preventiva en todos los procesos que crean o actualizan codigo), partes TASK-158a, TASK-158b, TASK-158c en la rama feature/task-158-regla-4d-preventiva-en-todos-los-proceso.

Al tomar la copia se anota HEAD; al devolverla, si HEAD es otro, no se
devuelve la copia: dist/src se deja como lo dejo el checkout nuevo
(restaurado desde HEAD) y se avisa.

Troceo sin preguntar: Carlos autorizo el 2026-11-22 trocear las tareas de
mas de 1 h de las correcciones 4D sin consultarlo.

## Criterios de aceptacion
- [x] verificar-impacto no devuelve la copia de dist/src si HEAD cambio durante la ejecucion (carrera del freno con update-fix vista en TASK-145b)

## Autorrevision

- code-quality-reviewer — cbdf37f
- 4D — cbdf37f: helper buscado (git() y el test de conDistProtegido reutilizados), usos buscados (devolver: cierre de conDistProtegido y restaurarHuerfana; conDistProtegido: verificar-impacto y perfil-tests), criterios citados, 2 tests nuevos con 4 mutaciones en rojo
- code-quality-reviewer — 515dbc0
- 4D ronda 1 — 515dbc0: usos buscados (marcador: solo lo escribe conDistProtegido y lo lee restaurarHuerfana), 1 test nuevo y 1 asercion, 2 mutaciones en rojo

## Resultado

- `conDistProtegido` anota el HEAD al tomar la copia de dist/src (tambien en el marcador). `devolver` no devuelve la copia si HEAD cambio: saca dist/src de Git en el HEAD actual (`checkout` y, solo si sale bien, `clean` de dist/src) y avisa con los dos commits; si no puede sacarlo de Git, lo deja como esta y lo dice. Una copia huerfana de otro commit tampoco se devuelve. Fuera de Git o con un marcador viejo sin `head`, como antes.
- Tests en `test/scripts/verificar-impacto.test.ts` contra repos Git temporales: cambio de rama durante la ejecucion (con control sin cambio y comprobacion del `head` del marcador), copia huerfana de otro commit, y dist/src sin versionar. Mutaciones: 4 en la implementacion y 2 en la ronda 1, todas en rojo.
- test:rapido 703/703; verificar-impacto.test 28/28; verificacion de las rondas: 730 y 731 en verde.
- Revision ronda 1 (sonnet): cambios-solicitados. IMP-1 (nada exigia el `head` del marcador) y MEN-1 (clean sin comprobar el checkout) corregidos; MEN-2 (un commit en la misma rama tambien descarta dist/src sin commitear) aceptado: riesgo recogido en el plan, salida regenerable.
- Revision ronda 2 (haiku, acotada): aprobada, sin hallazgos nuevos.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T06:36:39Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T06:37:27Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T06:37:29Z | start | automatico | persona | 0.18.0 |
| 2026-11-25T06:43:03Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T06:58:19Z | review | automatico | persona | 0.18.0 |
| 2026-11-25T07:33:56Z | finish | automatico | persona | 0.18.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-25T06:43:03Z | implementacion | sesion:ff6e05fd-8834-4424-94c1-161d6d5469d0 | 20 | 15699 | 3466183 | 8283 | 4 | 3490185 | - | - |
| 2026-11-25T06:58:13Z | revision | agente:a4e7346483f8ae46a | 32 | 128017 | 1741266 | 14072 | 4 | 1883387 | 1 | - |
| 2026-11-25T07:07:32Z | revision | agente:a5dccf28cc7e0431f | 30 | 124658 | 1527759 | 13954 | 2 | 1666401 | 2 | - |

## Duracion

- Estimada: 40 min
- Real (de la rama abierta al cierre con merge, sin pausas): 56 min
- Cierre (finish): 1578 s, de 2026-11-25T07:07:38Z a 2026-11-25T07:33:56Z
