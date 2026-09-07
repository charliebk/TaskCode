# Inventario de lo que falta — TaskCode

> Levantado el 2026-09-05 contra el estado real del repo (rama `develop`,
> Sprint 0 y Sprint 1 cerrados, TASK-001 a TASK-012 mergeadas). Complementa
> a `PLAN_SPRINTS.md`: aquel dice qué tareas hay planificadas, este añade
> lo que **no** tiene tarea asignada y saldría a la luz a mitad de camino.
> Sirve de base para trazar un plan de terminación realista.

## 0. Resumen en una frase

De las 23 tareas del plan quedan 11 (Sprint 2-4), pero además hay **~15
huecos reales que ninguna tarea cubre hoy** — la mayoría pequeños, dos de
ellos bloqueantes de verdad (nadie rellena `asignado_a`; el repo no tiene
remoto). El sistema pasa a ser usable de punta a punta al terminar Sprint 2,
no al terminar Sprint 4.

## 1. Tareas ya planificadas que faltan (11)

| ID | Tarea | Est. | Bloquea a |
|---|---|---|---|
| TASK-013 | `taskctl review` (update-`<tipo>`.sh + un agente revisor) | 5h | 014, 018, 019, 020 |
| TASK-014 | `taskctl finish` (merge/backmerge/tag + CHANGELOG/INDEX/BOARD) | 5h | 023 |
| TASK-015 | Límite de WIP por persona (§8.2) | 3h | — |
| TASK-016 | Brainstorm paralelo por roles + unificador (sustituye al `plan` mínimo) | 8h | — |
| TASK-017 | Catálogo de skills determinista + selección en dos pasos | 6h | — |
| TASK-018 | Enrutado de revisor por diff real, multi-reviewer por dominio | 6h | — |
| TASK-019 | Revisión ligera para tareas trivial/simple (§16.6) | 3h | — |
| TASK-020 | `taskctl codex-review` opcional | 5h | — |
| TASK-021 | Repo `taskcode-marketplace` en GitHub + publicar v0.1.0 | 3h | 022 |
| TASK-022 | Documentación de equipo + invitar colaboradores | 2h | — |
| TASK-023 | Métricas de coste en tokens por fase (§16) | 5h | — |

**Total planificado restante: ~51h.** Ninguna de estas 11 existe todavía
como carpeta en `tareas/` — solo viven como filas de tabla en
`PLAN_SPRINTS.md`. Crearlas es en sí mismo el primer trabajo (y ya se puede
hacer con `taskctl import`, que existe desde TASK-004).

## 2. Huecos entre la metodología y el plan (sin tarea asignada)

Esto es lo que no está en ninguna tabla de sprint y saldría a mitad de
camino. Ordenado por impacto real.

### 2.1 Nadie rellena `asignado_a` — BLOQUEANTE de TASK-015

La sección 8.2 dice que el límite de WIP se comprueba "en el momento en que
se fija `asignado_a`", vía `taskctl plan TASK-014 --asignado-a carlos`. Pero
ni `plan` ni `start` tienen ese flag hoy: `asignado_a` solo se rellena
editando `tarea.md` a mano. Consecuencias en cadena: TASK-015 no tiene sobre
qué operar, y `taskctl board --asignado_a <persona>` (TASK-005, ya
implementado y probado) filtra por un campo que ningún comando puede
poblar. **Hace falta añadir `--asignado-a` a `plan` y `start` antes de
TASK-015**, y no está estimado en ninguna parte (~2h).

### 2.2 `taskctl board` no hace lo que dice la metodología — RESUELTO (B5, 2026-09-05)

Tabla de la sección 8: *"`taskctl board` → Regenera `docs/BOARD.md`"*.
Lo implementado en TASK-005 era un listado por pantalla, no escribía fichero.
Resuelto a favor de la metodología, con un matiz: `taskctl board --escribir`
regenera el fichero, y sin el flag el comando sigue siendo de solo lectura
—escribir en cada invocación ensuciaría el workspace y dispararía el guard
de §8.3 en el siguiente comando—. La divergencia residual (§8 no menciona
ningún flag) queda documentada en `HALLAZGOS.md`, no se reescribe la
metodología congelada.

Lo relacionado también está hecho: `CHANGELOG.md`, `docs/INDEX.md` y
`docs/BOARD.md` **ya existen** (los crea `taskctl finish`, B3) y contienen
además el histórico de Sprint 0 y 1 (B4).

### 2.3 Los 5 wrappers de Git-Flow no tienen tarea

La tabla de la sección 8 incluye `taskctl diagnose` / `pause` / `resume` /
`recover` / `abort-merge` como "wrappers directos" sobre scripts que ya
están migrados y funcionando. No aparecen en ningún sprint. Son baratos
(los scripts ya existen, es envolverlos y validar estado), pero cuentan:
~3h. Además `pause` se cita explícitamente en el mensaje de error de §8.3
("Guárdalos (`taskctl pause`) o comitéalos") — es decir, el sistema ya le
dice al usuario que use un comando que no existe.

### 2.4 Paso 5 de §8.3 (auto-commit/push) sigue sin decidir ni implementar

TASK-012 implementó los pasos 1-4 y dejó el 5 fuera a propósito. Sin él,
`import`/`new`/`plan`/`approve` escriben en la rama base pero **no comitean
ni suben** — así que el resto del equipo no ve la tarea nueva hasta que
alguien lo haga a mano, que es justo el "depender de que la gente se
acuerde" del que arrancó todo el diseño. Es decisión abierta (punto 14 de
la sección 14) + implementación (~3h).

### 2.5 Falta la mitad del contenido del plugin

Layout objetivo (sección 2) vs. lo que hay hoy:

| Ruta | Estado |
|---|---|
| `.claude-plugin/plugin.json` | ✅ (corregido en TASK-006) |
| `bin/taskctl` | ✅ |
| `scripts/gitflow/` | ✅ (TASK-008) |
| `scripts/catalogo-skills.yml` | ❌ no existe (lo necesita TASK-017) |
| `scripts/heuristica-complejidad.yml` | ❌ no existe (pesos de §16.1) |
| `skills/task-workflow/SKILL.md` | ❌ no existe |
| `skills/java-spring-reviewer/` | ❌ no existe |
| `skills/angular-vue-reviewer/` | ❌ no existe |
| `skills/csharp-autocad-ifc-reviewer/` | ❌ no existe |
| `skills/code-quality-reviewer/` | ❌ no existe |
| `agents/` (roles de brainstorm) | ❌ no existe |
| `commands/` (slash-commands, opcional) | ❌ no existe |

Hoy el plugin es, en la práctica, **un CLI y unos scripts Bash**: no expone
ni una sola skill ni un solo agente a Claude Code. Todo el discurso de
"agentes especializados por dominio" de la metodología no tiene todavía
ningún artefacto. TASK-017 cubre el catálogo, pero **escribir las 5 skills y
los agentes de brainstorm no está estimado en ninguna tarea** (~8-10h, y es
trabajo de redacción de prompts, no de código).

### 2.6 Falta la estructura de datos del lado del repo — PARCIALMENTE RESUELTO (B3/B4 y C3)

Sección 2, "cada repo de proyecto": `docs/adr/`, `CHANGELOG.md`,
`INDEX.md`, `BOARD.md`, `.taskcode/config.yml`.

**Parcialmente resuelto.** `CHANGELOG.md`, `docs/INDEX.md` y `docs/BOARD.md`
existen desde B3/B4 (los crea `taskctl finish`) — ver §2.2. Siguen faltando
`docs/adr/` y `.taskcode/config.yml`, este último decisión abierta (punto 9
de la sección 14): nadie ha definido qué va dentro.

**La forma de la carpeta de tarea sí está resuelta — RESUELTO (C3 /
TASK-027, 2026-09-06).** Cada carpeta de tarea es ya `tarea.md` +
`planificacion/` + `revision/`: `taskctl review` creaba la de revisión desde
B1, y ahora `taskctl plan` crea `planificacion/` y escribe ahí el
`plan-final.md`, que TASK-010 dejaba suelto en la raíz. El legado no se
rompe —`approve` acepta las dos ubicaciones y una re-planificación migra el
fichero suelto conservando su contenido—, y las 6 tareas ya cerradas en
`04-terminadas/` se migraron con `git mv`: **ya no queda ningún
`plan-final.md` suelto en el repo**. Divergencia literal deliberada con la
sección 2: las subcarpetas se crean **bajo demanda**, cuando hay algo que
escribir dentro, porque Git no versiona directorios vacíos y crearlos en
`new`/`import` no llegaría al repo sin un `.gitkeep` que nadie ha pedido.

## 3. Deuda técnica documentada y sin corregir

Todo esto ya está escrito en el repo — no es nuevo, pero cuenta para el
plan porque son horas reales:

- **Bug de `fetch origin` sin comprobar disponibilidad** en 5 scripts que
  siguen sin corregir: `create-develop.sh`, `merge-hotfix-to-main.sh`,
  `merge-release-to-main.sh`, `recover-branch.sh`, `resume-work.sh`. Los
  dos `merge-*-to-main` son **precondición explícita de TASK-014**, así que
  esa tarea trae ese trabajo dentro aunque no lo diga su estimación.
- **`hotfix` resuelve la rama base a `main`**, que puede no compartir el
  historial de `tareas/` con `develop` mientras no haya backmerge — riesgo
  real de colisión de IDs entre ramas. Documentado en TASK-012 vía test,
  sin corregir. Lo destapa TASK-014 (backmerge).
- **`docs/METRICAS.md` está desactualizado**: solo cubre TASK-001/002/003 y
  todavía afirma que "el repositorio TaskCode no es un repositorio Git".
  `PLAN_SPRINTS.md` remite a él para el "detalle completo" de 12 tareas.
- **Validación en Windows nativo, pendiente desde TASK-007** y arrastrada
  por TASK-008/009/010/011/006: todo se ha probado desde el bridge de
  dispositivo (una VM Linux), nunca desde una sesión de Claude Code real en
  Windows. Se acumulan 3 preguntas concretas: ¿corren los `.sh` igual?,
  ¿sobrevive el bit de ejecución de `bin/taskctl` a un checkout nativo?, y
  ¿el mecanismo `bin/`-en-PATH aplica también al PowerShell tool cuando no
  hay Git for Windows? Son ~10 minutos de comprobación real, pero solo se
  pueden hacer desde esa sesión.
- **12 tareas con `estado: planificada`** en su frontmatter pese a estar
  hechas (paradoja de bootstrapping). Hay que decidir el cierre: dejarlo
  documentado como está, o hacer una pasada final que las regularice
  cuando `finish` exista.
- **`runConfigurations.zip` sigue en la raíz** del repo tras la migración de
  TASK-008. Decidir si se queda como referencia histórica o se borra.

## 4. Decisiones abiertas que bloquean diseño (sección 14)

De los 19 puntos, estos siguen sin resolver **y condicionan tareas
concretas**:

| Punto | Decisión | Bloquea |
|---|---|---|
| 1 | ¿Checkpoint humano siempre o solo desde complejidad media? | TASK-016 |
| 2 | Máximo de agentes en brainstorm paralelo (3 vs 4) | TASK-016 |
| 9 | Contenido de `.taskcode/config.yml` | §2.6 de este doc |
| 11 | Mecanismo determinista para saber qué plugins/skills hay instalados | TASK-017 |
| 12 | Señales del `relevance` en `marketplace.json` | TASK-021 |
| 13 | ¿WIP único o dos límites independientes? | TASK-015 |
| 14 (paso 5) | ¿`taskctl` comitea y sube por la persona? | §2.4 de este doc |
| 15 | Pesos de la heurística de complejidad | TASK-016/017 |
| 16 | Umbral de dominios para caer a revisor único | TASK-018 |
| 17 | ¿Revisión ligera solo para `trivial` o también `simple`? | TASK-019 |

Los puntos 3 y 6 son menores y se pueden cerrar sobre la marcha.

## 5. Riesgo estructural: no hay remoto

El repo **no tiene `origin`**. Todo el trabajo de Sprint 0 y 1 vive
únicamente en el disco de una máquina, sin copia. TASK-021 está planificada
para Sprint 4, la última fase — eso es tarde. Es la única tarea del plan
cuyo orden yo movería sin dudar.

## 6. Propuesta de secuenciación realista

No por sprints del plan original, sino por lo que desbloquea qué:

**Fase A — desbloquear (~6h).** TASK-021 adelantada (remoto GitHub +
`marketplace.json`, aunque sea privado y vacío de release) + crear las 11
tareas restantes como carpetas reales con `taskctl import` + poner al día
`METRICAS.md`. Al terminar: hay backup, y el propio sistema gestiona su
backlog.

**Fase B — cerrar el ciclo de vida (~18h).** TASK-013 (`review`) →
TASK-014 (`finish`, que arrastra el fix de los dos `merge-*-to-main` y el
tema del backmerge de `hotfix`) → los ficheros `CHANGELOG/INDEX/BOARD` →
`--asignado-a` en `plan`/`start` → TASK-015 (WIP). **Este es el hito real:
al terminar la Fase B el sistema se puede usar a diario de punta a punta.**
Todo lo posterior mejora la calidad del proceso, no lo habilita.

**Fase C — tapar los huecos (~10h).** Los 5 wrappers, el paso 5 de §8.3,
las subcarpetas `planificacion/`/`revision/`, `.taskcode/config.yml`, y una
primera skill `task-workflow/SKILL.md` que le explique el ciclo a Claude
Code (hoy no hay ninguna).

**Fase D — inteligencia del proceso (~28h + 10h de redacción de
skills/agentes).** Sprint 3 completo: TASK-016 a TASK-020. Es la fase cara
y la única genuinamente opcional: el sistema ya funciona sin ella, con un
revisor genérico y un `plan` de un solo agente.

**Fase E — cierre (~7h).** TASK-022 (docs de equipo), TASK-023 (métricas de
tokens), la pasada de validación en Windows nativo, y la decisión sobre las
12 tareas en `planificada`.

**Total realista: ~79h**, frente a las ~51h que suman las tareas
planificadas. La diferencia (~28h) es exactamente lo que este inventario
saca a la luz.

Corte mínimo defendible si hay que parar antes: **Fases A + B + C (~34h)**
dejan un sistema completo y usable, con la metodología cumplida en lo
esencial y el brainstorm multi-agente pendiente como mejora futura.
