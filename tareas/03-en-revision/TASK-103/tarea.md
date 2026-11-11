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
tokens_revision: 13648744
creado: 2026-11-10
actualizado: 2026-11-11
dependencias: [TASK-101]
---
## Objetivo

Sale de TASK-101 (troceada por la regla de una hora, decision de Carlos 2026-11-10) y de MEN-5 de la revision de TASK-100. Hoy, si .taskcode/config.yml no se puede leer (cualquier clave invalida, nueva o antigua), el guardian de merges hace continue en el paso 3 (guardia-merge.ts) y deja pasar el merge: una config mal escrita lo desactiva. Decision de Carlos: bloquear siempre hacia develop, main o master (lista fija, porque sin config no se sabe rama_base) con un mensaje que diga que arreglar; cambia el comportamiento de la 0.14.0 y va al CHANGELOG. Sin fichero de config, sigue dejando pasar como hoy. Una config del destino invalida lleva a la verificacion completa, nunca a desactivarse.

## Criterios de aceptacion
- [x] Con .taskcode/config.yml invalido (una clave antigua y una nueva, un caso cada una), un merge hacia develop, main o master queda bloqueado con un mensaje que nombra el error y como arreglarlo (test en repo temporal)
- [x] Sin fichero de config, o con config valida, el guardian se comporta exactamente como antes (test de regresion)
- [x] Un merge hacia una rama que no es develop, main ni master con config invalida deja pasar, como hoy (test)
- [x] De la revision de TASK-101 (MEN-2, anterior a ella): `git merge -m --abort rama` (y --quit, --continue, --skip como valor de una opcion) se detecta como merge y el guardian lo evalua (test)
- [x] De la revision de TASK-101 (ronda 3, huecos que el guardian ya tenia desde TASK-072): `{ git merge x; }`, `time git merge x` y `eval git merge x` se detectan como merge, y `git checkout <fichero> && git merge x` no toma el fichero como rama destino (un test por caso, con el hook real)
- [x] De la revision de TASK-101 (NUE-3): los tests de comandoSoloIntegra con barra invertida llevan una barra real (`-\\B`, `-\\C`, `C:\\repo` en el .ts)
- [x] README y CHANGELOG explican el cambio de comportamiento
- [x] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Resultado

**Config ilegible** (src/hooks/guardia-merge.ts). El paso 3 distingue `ConfigError`:
si `.taskcode/config.yml` existe pero no se puede leer, los destinos de la
operacion se calculan con los valores por defecto (`develop` y la principal local
o `main`) y, si alguno esta en la lista fija `{develop, main, master}`, se bloquea
siempre, sin mirar ancestros ni verdes (decision de Carlos). `pendientes` pasa a
ser una union discriminada (`verificar` / `config-invalida`). El mensaje cita el
error sin `[ERROR]` (helper `textoDeConfigError`, compartido con la exencion de
TASK-101) y remite a `taskctl doctor` y `taskctl finish`. Sin fichero de config,
con config valida o hacia otra rama, todo como en la 0.14.0.

**Parser** (src/core/comando-merge.ts, sigue puro):
- `esControlDeMerge` salta el valor de las opciones con valor: `git merge -m
  --abort x` y `--message --abort x` son merges. La misma regla en
  `analizarComando` y en `comandoSoloIntegra`.
- `sinPrefijos` quita `{`, `time [-p] [--]`, `nohup`, `!` y las palabras de control
  (`if`, `elif`, `then`, `else`, `while`, `until`, `do`); `eval` se analiza como
  `bash -c`. Ninguna de esas formas recibe la exencion de solo documentacion.
- `analizarComando` recibe un predicado `esRevision`: `git checkout <x>` con un
  unico argumento solo cambia el destino si `x` es una rama (`refs/heads/` o
  `refs/remotes/origin/`), un tag o un commit; `HEAD` y `@` no lo cambian.

NUE-3: barras invertidas reales en los tests de `comandoSoloIntegra`, mas un caso
(`git log --outpu\\t=...`) en el que la comprobacion de barra es la unica defensa:
sin el, la mutacion que la quita sobrevivia.

Tests: 10 nuevos en test/hooks/guardia-merge.test.ts (parser, decision en repos
temporales y el hook real por stdin). Por mutacion, 17 cambios rotos a proposito
dan rojo cada uno. Suite completa en cada ronda: 2178 tests, 2174 en verde, solo
los 3 rojos conocidos de Windows (symlink en approve, chmod y CRLF en plan). Smoke
del hook compilado contra un repo temporal: sin config pasa; config valida
bloquea `eval`, `if git merge`, `git checkout README.md`, `git checkout HEAD` y
`--message --abort`; config invalida bloquea hacia develop y deja pasar hacia la
rama de trabajo.

Revision por pares, tres rondas:
- Ronda 1 (IMP-1, IMP-2, MEN-1, MEN-2), todos corregidos: `--message` faltaba en
  `MERGE_CON_VALOR`; el test de la rama solo en origin no discriminaba (la fuente
  ya era ancestro); `git checkout <tag|sha>` daba un falso bloqueo; `time -p --`,
  `nohup` e `if ... then` seguian escondiendo el merge. El revisor propuso
  `aprobada-con-correcciones`; se registro `cambios-solicitados` por los dos
  IMPORTANTE.
- Ronda 2 (NUE-1, NUE-2, CRITICO), corregidos: la correccion de MEN-1 hacia que
  `git checkout HEAD` / `@` (que no desacoplan) se saltaran la guardia; y la
  condicion de `if`/`while`/`until` no se analizaba (preexistente).
- Ronda 3: aprobada, sin hallazgos. Notas aceptadas, ambas del lado seguro (falso
  bloqueo, nunca paso): `git checkout --detach HEAD` evalua contra la rama actual,
  y en Linux una rama llamada `head` en minusculas no cambia el destino.

Limites que siguen documentados en el README: alias de git, `git pull`,
`git push . x:develop`, subshells y `git checkout -` / `@{-N}` (rama anterior).

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T10:32:04Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T10:38:33Z | approve | automatico | automatico | 0.14.0 |
| 2026-11-11T10:38:45Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T11:25:46Z | review | automatico | persona | 0.14.0 |
| 2026-11-11T12:54:55Z | review | automatico | persona | 0.14.0 |
| 2026-11-11T14:15:31Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T10:38:15Z | diseno | agente:a55b886637a7f1998 | 30 | 43158 | 446024 | 14178 | 22 | 503390 | - | - |
| 2026-11-11T11:25:46Z | implementacion | sesion:f73288ba-c6a3-455b-a768-15b5d14e0063 | 72 | 79664 | 6310022 | 34319 | 6 | 6424077 | - | - |
| 2026-11-11T12:18:08Z | revision | agente:a2bdd6bbf70a8cdbf | 84 | 147542 | 5315919 | 22158 | 5 | 5485703 | 1 | - |
| 2026-11-11T13:29:20Z | revision | agente:add9c4279bd3c2c9f | 78 | 300550 | 4569895 | 41582 | 7 | 4912105 | 2 | - |
| 2026-11-11T14:44:53Z | revision | agente:adf9df543d29d82ee | 56 | 130104 | 3107528 | 13248 | 2 | 3250936 | 3 | - |

## Autorrevision

- code-quality-reviewer — 784fd97
- code-quality-reviewer — 6f1662e
- code-quality-reviewer — 476e538
