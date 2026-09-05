# Checklist de terminación — TaskCode

> Documento vivo. Se marca cada casilla al cerrar el trabajo real (mergeado
> a `develop`, tests en verde), no al empezarlo. Derivado de
> `INVENTARIO_PENDIENTE.md`; las tareas `TASK-0NN` son las de
> `PLAN_SPRINTS.md`, el resto son huecos detectados en el inventario que no
> tenían tarea asignada.

**Progreso global: 12 / 40 items terminados (30%)**

| Fase | Items | Hechos | Estimación |
|---|---|---|---|
| ✅ Ya terminado (Sprint 0 + 1) | 12 | 12 | — |
| A — Desbloquear | 3 | 0 | ~6h |
| B — Cerrar el ciclo de vida | 7 | 0 | ~18h |
| C — Tapar huecos | 6 | 0 | ~10h |
| D — Inteligencia del proceso | 7 | 0 | ~38h |
| E — Cierre | 5 | 0 | ~7h |
| **Total pendiente** | **28** | **0** | **~79h** |

---

## ✅ Ya terminado (12/12)

- [x] TASK-001 — Scaffold del proyecto (`plugin.json`, `bin/`, tsconfig, runner de tests)
- [x] TASK-002 — Modelo de tarea + parser de `tarea.md` + máquina de estados
- [x] TASK-003 — `taskctl new`
- [x] TASK-004 — `taskctl import`
- [x] TASK-005 — `taskctl board`
- [x] TASK-006 — Empaquetado del plugin y validación de carga local
- [x] TASK-007 — Spike: scripts Git-Flow vía Bash tool
- [x] TASK-008 — Migrar scripts Git-Flow a `scripts/gitflow/`
- [x] TASK-009 — `taskctl start`
- [x] TASK-010 — `taskctl plan` (versión mínima)
- [x] TASK-011 — `taskctl approve`
- [x] TASK-012 — Precondición de rama base + workspace limpio (§8.3, pasos 1-4)

---

## Fase A — Desbloquear (0/3) · ~6h

Nada de esto es funcionalidad nueva: es quitar de en medio lo que hace
frágil o ciego todo lo demás.

- [ ] **A1** · Remoto en GitHub + `marketplace.json` (TASK-021 adelantada) — ~3h
      *Hoy todo Sprint 0 y 1 vive en un solo disco sin copia.*
- [ ] **A2** · Crear TASK-013…TASK-023 como carpetas reales con `taskctl import` — ~1h
      *Dogfooding: el sistema gestiona su propio backlog en vez de una tabla en Markdown.*
- [ ] **A3** · Poner `docs/METRICAS.md` al día (TASK-004 → TASK-012) — ~2h
      *Hoy está congelado en TASK-003 y aún dice que el repo no es un repositorio Git.*

## Fase B — Cerrar el ciclo de vida (0/7) · ~18h

**Este es el hito real de usabilidad.** Al terminar la Fase B el sistema se
puede usar a diario de punta a punta; todo lo posterior mejora la calidad
del proceso, no lo habilita.

- [ ] **B1** · TASK-013 — `taskctl review` (`update-<tipo>.sh` + un agente revisor) — ~5h
- [ ] **B2** · Corregir el bug de `origin` en `merge-hotfix-to-main.sh` y `merge-release-to-main.sh` — ~1h
      *Precondición real de B3: hoy fallan duro (`exit 1`) en un repo sin `origin`.*
- [ ] **B3** · TASK-014 — `taskctl finish` (merge, backmerge, tag) — ~5h
      *Destapa el riesgo documentado de colisión de IDs entre `main` y `develop`.*
- [ ] **B4** · Crear `CHANGELOG.md`, `INDEX.md` y `BOARD.md` — ~1h
      *B3 promete actualizarlos y ninguno de los tres existe.*
- [ ] **B5** · Resolver la divergencia de `board` — ~1h
      *La metodología dice "regenera `docs/BOARD.md`"; lo implementado es un listado por pantalla. Decidir en qué sentido se corrige.*
- [ ] **B6** · Añadir `--asignado-a` a `plan` y `start` — ~2h
      *Sin esto nadie rellena `asignado_a`: B7 no tiene sobre qué operar y `board --asignado_a` filtra por un campo vacío.*
- [ ] **B7** · TASK-015 — Límite de WIP por persona (§8.2) — ~3h

## Fase C — Tapar huecos (0/6) · ~10h

Lo que la metodología da por hecho y no existe.

- [ ] **C1** · Wrappers `taskctl diagnose` / `pause` / `resume` / `recover` / `abort-merge` — ~3h
      *§8.3 ya le dice al usuario "guárdalos con `taskctl pause`" — un comando que no existe.*
- [ ] **C2** · Paso 5 de §8.3: ¿comitea y sube `taskctl` por la persona? — ~3h
      *Decisión abierta + implementación. Sin esto, una tarea nueva no llega al equipo sola.*
- [ ] **C3** · Subcarpetas `planificacion/` y `revision/` en cada carpeta de tarea — ~1h
      *Hoy `plan-final.md` queda suelto en la raíz de la carpeta.*
- [ ] **C4** · `.taskcode/config.yml` — ~1h
      *Decisión #9 de la sección 14: nadie ha definido qué va dentro.*
- [ ] **C5** · `skills/task-workflow/SKILL.md` — ~1h
      *La primera skill del plugin: hoy no expone ninguna a Claude Code.*
- [ ] **C6** · Bug de `origin` en `create-develop.sh`, `recover-branch.sh`, `resume-work.sh` — ~1h
      *Los dos últimos los envuelve C1.*

## Fase D — Inteligencia del proceso (0/7) · ~38h

La fase cara y la única genuinamente opcional: el sistema ya funciona sin
ella, con un revisor genérico y un `plan` de un solo agente.

- [ ] **D1** · TASK-016 — Brainstorm paralelo por roles + agente unificador — ~8h
- [ ] **D2** · TASK-017 — Catálogo de skills determinista + selección en dos pasos — ~6h
- [ ] **D3** · TASK-018 — Enrutado de revisor por diff real, multi-reviewer por dominio — ~6h
- [ ] **D4** · TASK-019 — Revisión ligera para tareas `trivial`/`simple` (§16.6) — ~3h
- [ ] **D5** · TASK-020 — `taskctl codex-review` opcional — ~5h
- [ ] **D6** · Redactar las 4 skills revisoras (java-spring, angular-vue, csharp-autocad-ifc, code-quality) — ~6h
- [ ] **D7** · Redactar `agents/` (roles de brainstorm) + `scripts/heuristica-complejidad.yml` — ~4h

## Fase E — Cierre (0/5) · ~7h

- [ ] **E1** · TASK-022 — Documentación de equipo + invitar colaboradores — ~2h
- [ ] **E2** · TASK-023 — Métricas de coste en tokens por fase (§16) — ~5h
- [ ] **E3** · Validación en Windows nativo — ~10 min, pero solo desde esa sesión
      *Tres preguntas acumuladas: ¿corren igual los `.sh`?, ¿sobrevive el bit de ejecución de `bin/taskctl` a un checkout nativo?, ¿aplica el mecanismo `bin/`-en-PATH al PowerShell tool sin Git for Windows?*
- [ ] **E4** · Decidir el cierre de las 12 tareas con `estado: planificada` pese a estar hechas
- [ ] **E5** · Decidir qué hacer con `runConfigurations.zip` en la raíz

---

## Decisiones que dependen de ti (0/10)

No son horas de trabajo mío, son respuestas tuyas — pero bloquean lo que
está a su derecha.

- [ ] **#1** · ¿Checkpoint humano siempre, o solo desde complejidad media? → bloquea D1
- [ ] **#2** · Máximo de agentes en brainstorm paralelo (3 vs 4) → bloquea D1
- [ ] **#9** · Contenido de `.taskcode/config.yml` → bloquea C4
- [ ] **#11** · Mecanismo determinista para saber qué plugins/skills hay instalados → bloquea D2
- [ ] **#12** · Señales del `relevance` en `marketplace.json` → bloquea A1
- [ ] **#13** · ¿WIP único, o dos límites independientes (diseño y ejecución)? → bloquea B7
- [ ] **#14 (paso 5)** · ¿`taskctl` comitea y sube por la persona? → bloquea C2
- [ ] **#15** · Pesos de la heurística de complejidad → bloquea D1/D2
- [ ] **#16** · Umbral de dominios para caer a revisor único → bloquea D3
- [ ] **#17** · ¿Revisión ligera solo para `trivial`, o también `simple`? → bloquea D4

---

## Corte mínimo defendible

**Fases A + B + C = 16 items, ~34h.** Dejan un sistema completo y usable,
con la metodología cumplida en lo esencial y el brainstorm multi-agente
pendiente como mejora futura. Si hay que parar antes de tiempo, es aquí.
