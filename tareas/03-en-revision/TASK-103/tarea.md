---
id: TASK-103
titulo: "Guardian de merges: config invalida bloquea y merges que hoy no detecta"
tipo: fix
sprint: 0
etiquetas: [verificacion, guardian]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-103-guardian-de-merges-con-config-invalida-b
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 503390
tokens_implementacion: 6424077
tokens_revision: 5485703
creado: 2026-11-10
actualizado: 2026-11-11
dependencias: [TASK-101]
---
## Objetivo

Sale de TASK-101 (troceada por la regla de una hora, decision de Carlos 2026-11-10) y de MEN-5 de la revision de TASK-100. Hoy, si .taskcode/config.yml no se puede leer (cualquier clave invalida, nueva o antigua), el guardian de merges hace continue en el paso 3 (guardia-merge.ts) y deja pasar el merge: una config mal escrita lo desactiva. Decision de Carlos: bloquear siempre hacia develop, main o master (lista fija, porque sin config no se sabe rama_base) con un mensaje que diga que arreglar; cambia el comportamiento de la 0.14.0 y va al CHANGELOG. Sin fichero de config, sigue dejando pasar como hoy. Una config del destino invalida lleva a la verificacion completa, nunca a desactivarse.

## Criterios de aceptacion
- [ ] Con .taskcode/config.yml invalido (una clave antigua y una nueva, un caso cada una), un merge hacia develop, main o master queda bloqueado con un mensaje que nombra el error y como arreglarlo (test en repo temporal)
- [ ] Sin fichero de config, o con config valida, el guardian se comporta exactamente como antes (test de regresion)
- [ ] Un merge hacia una rama que no es develop, main ni master con config invalida deja pasar, como hoy (test)
- [ ] De la revision de TASK-101 (MEN-2, anterior a ella): `git merge -m --abort rama` (y --quit, --continue, --skip como valor de una opcion) se detecta como merge y el guardian lo evalua (test)
- [ ] De la revision de TASK-101 (ronda 3, huecos que el guardian ya tenia desde TASK-072): `{ git merge x; }`, `time git merge x` y `eval git merge x` se detectan como merge, y `git checkout <fichero> && git merge x` no toma el fichero como rama destino (un test por caso, con el hook real)
- [ ] De la revision de TASK-101 (NUE-3): los tests de comandoSoloIntegra con barra invertida llevan una barra real (`-\\B`, `-\\C`, `C:\\repo` en el .ts)
- [ ] README y CHANGELOG explican el cambio de comportamiento
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T10:32:04Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T10:38:33Z | approve | automatico | automatico | 0.14.0 |
| 2026-11-11T10:38:45Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T11:25:46Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T10:38:15Z | diseno | agente:a55b886637a7f1998 | 30 | 43158 | 446024 | 14178 | 22 | 503390 | - | - |
| 2026-11-11T11:25:46Z | implementacion | sesion:f73288ba-c6a3-455b-a768-15b5d14e0063 | 72 | 79664 | 6310022 | 34319 | 6 | 6424077 | - | - |
| 2026-11-11T12:18:08Z | revision | agente:a2bdd6bbf70a8cdbf | 84 | 147542 | 5315919 | 22158 | 5 | 5485703 | 1 | - |

## Autorrevision

- code-quality-reviewer — 784fd97
