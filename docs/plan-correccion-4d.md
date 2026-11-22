# Plan de corrección de la auditoría 4D completa

> Sale de `docs/auditoria-4d-completa.md` (TASK-141): 147 casos, de los que
> 1 es CRÍTICO, 122 IMPORTANTE y 24 MENOR. Están repartidos en 11 tareas
> nuevas (TASK-142..152) y en TASK-138 ampliada, más TASK-139 y TASK-140, que
> ya estaban planificadas.
> 2026-11-22.

## Criterios de orden

1. **Primero lo que falla hoy.** Hay un caso CRÍTICO (SCR-01: `resume` aplica
   el stash de otra rama) y varios IMPORTANTES con un fallo observable:
   - la cadena sin guarda en `trocear`, `verificar-menores`, `verificar-lote`
     y `doctor-deploy`;
   - `siguiente`, que pregunta de más con `comando_sincronizacion`;
   - `--flag=valor`, que se ignora;
   - pushes rechazados que se dan por buenos.
2. **Después, los helpers únicos.** Muchas duplicaciones se resuelven creando
   (o adoptando) un único helper que luego usan las demás tareas: lector de
   sección, lector de ID, `gitTexto`, `extraerRepetible`. Si se hacen antes,
   las tareas de comandos solo tienen que adoptarlos.
3. **Los tests de disfraz, pronto.** Endurecer un test no choca con nada y
   protege los refactors que vienen después.
4. **Los helpers de test, al final.** Es lo que toca más ficheros (cientos de
   tests) y chocaría con todas las demás tareas.
5. **Cada tarea de más de una hora se trocea al planificarla**, por parte,
   con `taskctl trocear`. Cada parte sigue la Regla 4D: buscar el helper
   antes de crearlo y mutar cada test nuevo.
6. **Una tarea solo va en paralelo con otra si no comparten ficheros.**

## Olas

### Ola 1 — fallos que ya existen (urgente)

| Orden | Tarea | Qué arregla | Ficheros | Estimación |
|---|---|---|---|---|
| 1 | **TASK-142** Disfraz en Git-Flow | SCR-01 (CRÍTICO), SCR-09, SCR-10, SCR-11, SCR-14 | `resume-work.sh`, `pause-work.sh`, `push-back-to-remote.sh`, `mirror-to-remote.sh`, README de gitflow, tests de wrappers | 1–1,5 h (2 partes: stash y push) |
| 2 | **TASK-144, parte a** Cadena y `siguiente` | CMD1-01, CMD2-01, CMD2-03, CMD2-04 | `cadena.ts`, `cli.ts`, `siguiente.ts`, `verificar-menores.ts`, `pausa.ts`, `registrar-coste.ts` | 1 h |

TASK-142 y TASK-144a no comparten ficheros (bash frente a TS): **pueden ir
en paralelo**.

### Ola 2 — helpers únicos (cimientos)

| Orden | Tarea | Qué deja | Estimación |
|---|---|---|---|
| 3 | **TASK-147** Lectores de secciones e IDs | Un único lector de sección (`rangoDeSeccion` más un helper para crear la sección al final), uno de ID con letra, `normalizarTexto` y `extraerSecciones` en todos los usos | 3 h → 3 partes: secciones, IDs, métricas y fases |
| 4 | **TASK-149** fs, hooks y cli | `gitTexto` como único envoltorio de git, una sola rama actual, `--git-path` y parser de la entrada de los hooks, `printAutoCommit` y el tratamiento común de `GitCommandError` | 3 h → 3 partes: git, hooks y cli, utilidades |
| 5 | **TASK-148** Catálogos, config y utilidades de core | `packageRoot` único, un lector común de catálogos planos, validadores de config, `masParecida` | 3–4 h → 3 partes: rutas y catálogos, config, utilidades y comentarios |

Las tres tocan capas distintas (`core` lectores, `fs`/`hooks`/`cli`, `core`
config y catálogos), así que **pueden ir en paralelo**. Con un solo agente,
el orden es 147 → 149 → 148.

### Ola 3 — tests que mienten (en paralelo con la ola 2)

| Orden | Tarea | Qué arregla | Estimación |
|---|---|---|---|
| 6 | **TASK-151** Disfraz en tests | Las 8 mutaciones que quedaron en verde pasan a rojo; los tests de «sin efectos» miran `git status`; el skip de `doctor-correcciones`; `review-incremental` corre en Linux | 2 h → 2 partes: core y fs, commands y hooks |
| 7 | **TASK-139** (ya planificada) | B1–B5 de la auditoría anterior | 1 h |

Solo tocan tests concretos, y ninguno de los ficheros de la ola 2.

### Ola 4 — adoptar los helpers en comandos y Git-Flow

| Orden | Tarea | Depende de | Estimación |
|---|---|---|---|
| 8 | **TASK-144, parte b** Flags con valor | — (`extraerRepetible` ya existe) | 1 h |
| 9 | **TASK-145** Puertas de `finish` | TASK-149 (`gitTexto`) | 2 h → 2 partes |
| 10 | **TASK-146** Comandos sueltos | TASK-147 (listado de tareas, IDs) | 2 h → 2 partes |
| 11 | **TASK-138** (ampliada) Métricas | — | 1,5 h |
| 12 | **TASK-143** Duplicación en Git-Flow | TASK-142 (mismos scripts) | 3 h → 3 partes: create/update, merge, paridad bash/TS |

144b, 145 y 146 tocan comandos distintos, pero `cli.ts` y `args.ts` son
comunes: **conviene hacerlas una detrás de otra**. TASK-143 (bash) puede ir
en paralelo con ellas.

### Ola 5 — skills y agentes

| Orden | Tarea | Estimación |
|---|---|---|
| 13 | **TASK-150** Una sola fuente por regla en skills y agentes | 3 h → 3 partes: reglas que ya divergen (CONT-01..05), plantillas de informe y plan (CONT-05..08 y CORE2-03), diluvio y desviación |

Va tarde a propósito: CORE2-03 toca `plan.ts`, y conviene que los comandos
ya estén asentados. Las partes de solo texto podrían adelantarse si sobra
capacidad.

### Ola 6 — helpers de test y poda

| Orden | Tarea | Estimación |
|---|---|---|
| 14 | **TASK-152** Duplicación de helpers de test | 4 h → 4 partes: `git`, `commitAll` y repo; fábricas de Task; verificador falso; marcas, secciones y validador |
| 15 | **TASK-140** (ya planificada) Cerrojo `.robo` y medición de la poda | 1 h |

TASK-152 va la última porque toca casi todos los ficheros de test: hecha
antes, chocaría con cada una de las tareas anteriores.

## Calendario orientativo

| Ola | Tareas | Horas (punta a punta) | Paralelismo posible |
|---|---|---:|---|
| 1 | 142, 144a | 2–2,5 | 2 a la vez |
| 2 + 3 | 147, 149, 148, 151, 139 | 12–13 | hasta 4 a la vez |
| 4 | 144b, 145, 146, 138, 143 | 9–10 | 2 a la vez (143 aparte) |
| 5 | 150 | 3 | — |
| 6 | 152, 140 | 5 | — |
| **Total** | 15 tareas (unas 35 partes) | **31–34 h** | En serie, unas 32 h; con 2–3 agentes en paralelo, unas 15–18 h |

Las estimaciones son de punta a punta: rama abierta, implementación,
revisión y merge.

## Reglas para cada tarea de corrección

- **Reproducir antes de corregir.** El primer paso de cada parte es
  reproducir sus casos. Si alguno no se sostiene, se anota como descartado en
  el `Resultado`, con el motivo.
- **Cada duplicación se corrige dejando una sola fuente** y un test que
  fallaría si las copias volvieran a divergir. Cuando aplica, un test de
  paridad: lista de claves frente al `switch`, comandos con `autoCommit`
  frente a `GUARDADOS_POR_CADENA`, bash frente a TS.
- **Cada disfraz se corrige con su mutación anotada:** la misma mutación de
  la auditoría tiene que dar rojo después del arreglo.
- **Sin desviación.** Una parte no arregla casos de otra tarea aunque los
  vea; si aparece uno nuevo, va al backlog.
- **Al cerrar cada tarea**, su columna `seguimiento` en
  `docs/auditoria-4d-completa.md` pasa a «corregido en TASK-NNN».

## Versiones

- **0.17.1**, tras la ola 1: el CRÍTICO y los fallos observables.
- **0.18.0**, tras las olas 2 a 4: helpers únicos y comandos.
- **0.19.0**, tras las olas 5 y 6: skills y tests.
