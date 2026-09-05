# Checklist de terminación — TaskCode

> Documento vivo. Se marca cada casilla al cerrar el trabajo real (mergeado
> a `develop`, tests en verde), no al empezarlo. Derivado de
> `INVENTARIO_PENDIENTE.md`; las tareas `TASK-0NN` son las de
> `PLAN_SPRINTS.md`, el resto son huecos detectados en el inventario que no
> tenían tarea asignada.
>
> **Convención**: al cerrar un item se marca su casilla, se actualizan los
> contadores de la tabla de abajo, y se muestra el checklist actualizado en la
> respuesta. Ver `CONVENCIONES.md`.

**Progreso global: 21 / 40 items terminados (53%)** · última actualización: 2026-09-05

| Fase | Items | Hechos | Estimación |
|---|---|---|---|
| ✅ Ya terminado (Sprint 0 + 1) | 12 | 12 | — |
| ✅ A — Desbloquear | 3 | **3** | ~6h |
| B — Cerrar el ciclo de vida | 7 | **5** | ~18h |
| C — Tapar huecos | 6 | 0 | ~10h |
| D — Inteligencia del proceso | 7 | 0 | ~38h |
| E — Cierre | 5 | **1** | ~7h |
| **Total pendiente** | **28** | **9** | **~79h** |

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

## ✅ Fase A — Desbloquear (3/3) · completada el 2026-09-05

Nada de esto es funcionalidad nueva: es quitar de en medio lo que hace
frágil o ciego todo lo demás.

- [x] **A1** · Remoto en GitHub + `marketplace.json` (TASK-021 adelantada)
      *`github.com/charliebk/TaskCode` (privado), 11 ramas subidas, `develop`
      por defecto, tag y release `v0.1.0` publicados. `marketplace.json`
      contra el schema oficial, sin `relevance` (ver decisión #12). Extra no
      planificado: README en la raíz y CI en GitHub Actions.*
- [x] **A2** · Crear TASK-013…TASK-023 como carpetas reales con `taskctl import`
      *Las 11 creadas con los IDs alineados con `PLAN_SPRINTS.md`. Dos
      hallazgos de dogfooding: `import` aplica los mismos flags a todas las
      entradas y no sabe expresar `dependencias` (hubo que ajustar el
      frontmatter a mano), y no se puede ejecutar dos veces seguidas porque
      ensucia el workspace que su propio guard de §8.3 exige limpio.*
- [x] **A3** · Poner `docs/METRICAS.md` al día (TASK-004 → TASK-012)
      *Cubre las 12 tareas con agregados nuevos: 50 hallazgos de revisión en
      9 rondas (5 críticos, 18 importantes, 27 menores), 84% corregidos y
      ningún crítico ni importante abierto. De paso se corrigieron dos
      recuentos de tests mal anotados en `PLAN_SPRINTS.md`.*

## Fase B — Cerrar el ciclo de vida (5/7) · ~18h

**Este es el hito real de usabilidad.** Al terminar la Fase B el sistema se
puede usar a diario de punta a punta; todo lo posterior mejora la calidad
del proceso, no lo habilita.

- [x] **B1** · TASK-013 — `taskctl review` (`update-<tipo>.sh` + un agente revisor) — ~5h
      *Cerrado el 2026-09-05. Primera tarea gestionada por su propio ciclo
      (plan → approve → start → review, dogfooding completo, incluida la
      peticion de revision que uso el revisor por pares). El CLI hace lo
      determinista (update verificado con merge-base, mover a
      03-en-revision, peticion con el diff real + scaffold de informe) y el
      agente lo dispara el orquestador — decision registrada en el plan.
      Revision: 2 importantes y 2 menores corregidos, 1 menor documentado.
      11 tests reales nuevos (247 en total).*
- [x] **B2** · Corregir el bug de `origin` en `merge-hotfix-to-main.sh` y `merge-release-to-main.sh` — ~1h
      *Cerrado el 2026-09-05 (rama `fix/b2-guard-origin-merge-main`, merge
      `--no-ff` a develop). Guard de TASK-008 extraído a
      `detect_origin_available` y aplicado a ambos scripts; la revisión por
      pares añadió dos correcciones: origin configurado pero inaccesible
      ABORTA (no es lo mismo que operar sin remoto: el tag caería sobre una
      `main` obsoleta), y la rama de trabajo se valida antes de tocar la
      principal. 10 tests reales nuevos (repos temporales + bare como
      origin); verificado que fallan sin el fix. De propina: guard en
      `smoke-test.sh` que evita un `git init` destructivo si mktemp falla.*
- [x] **B3** · TASK-014 — `taskctl finish` (merge, backmerge, tag) — ~5h
      *Cerrado el 2026-09-05 con su propio comando (finish mergeó su propia
      tarea: primer cierre de punta a punta del método). Aprobación leída
      del veredicto del informe (parser fail-closed endurecido: la revisión
      pilló que aprobaba <no aprobada>), colisión de IDs resuelta con dos
      discriminadores (título distinto y linaje sin ancestro común), camino
      idempotente de reintento tras conflicto de backmerge, y CHANGELOG,
      INDEX y BOARD renderizados desde el frontmatter. 1 crítico + 2
      importantes + 4 menores de revisión, los 7 corregidos. 19 tests
      nuevos (266). De propina cubre la mitad de B4: los tres ficheros los
      crea finish si no existen.*- [x] **B4** · Crear `CHANGELOG.md`, `INDEX.md` y `BOARD.md` — ~1h
      *Los tres los creó `taskctl finish` al cerrar TASK-014 (B3). B4 añadió
      el histórico que faltaba: las 12 tareas de Sprint 0 y 1 en CHANGELOG e
      INDEX, compuestas leyendo sus `tarea.md` reales, apuntando a su ruta
      real en `00-planificadas` (siguen ahí por la paradoja de
      bootstrapping, E4). De paso quedó por escrito que TASK-001, 002 y 003
      declaran una `rama` que no existe en Git.*- [x] **B5** · Resolver la divergencia de `board` — ~1h
      *Resuelta a favor de la metodología: `taskctl board --escribir`
      regenera `docs/BOARD.md`; sin el flag sigue siendo de solo lectura,
      porque escribir siempre ensuciaría el workspace y dispararía el guard
      de §8.3 en el siguiente comando. El formato del fichero vive ahora en
      un único sitio (`renderBoardMarkdown`), compartido con `finish`, y las
      tablas van en vallas de código. La divergencia residual (§8 no
      menciona flags) queda documentada en HALLAZGOS, sin tocar la
      metodología congelada. Revisión: 3 importantes y 2 menores corregidos
      (orden no determinista de avisos que hacía el fichero irreproducible,
      tablero fantasma fuera de la raíz del repo, errores de escritura mal
      etiquetados), 1 menor documentado. 9 tests nuevos (275).*      *La metodología dice "regenera `docs/BOARD.md`"; lo implementado es un listado por pantalla. Decidir en qué sentido se corrige.*
- [ ] **B6** · Añadir `--asignado-a` a `plan` y `start` — ~2h
      *Sin esto nadie rellena `asignado_a`: B7 no tiene sobre qué operar y `board --asignado_a` filtra por un campo vacío.*
- [ ] **B7** · TASK-015 — Límite de WIP por persona (§8.2) — ~3h

## Fase C — Tapar huecos (0/6) · ~10h

Lo que la metodología da por hecho y no existe.

- [ ] **C1** · Wrappers `taskctl diagnose` / `pause` / `resume` / `recover` / `abort-merge` — ~3h
      *§8.3 ya le dice al usuario "guárdalos con `taskctl pause`" — un comando que no existe.*
- [ ] **C2** · Paso 5 de §8.3: ¿comitea y sube `taskctl` por la persona? — ~3h
      *Decisión abierta + implementación. Sin esto, una tarea nueva no llega
      al equipo sola. **Evidencia nueva (A2)**: sin el paso 5, `taskctl
      import` no se puede ejecutar dos veces seguidas — crea las carpetas que
      luego bloquean su propia siguiente invocación.*
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

## Fase E — Cierre (1/5) · ~7h

- [ ] **E1** · TASK-022 — Documentación de equipo + invitar colaboradores — ~2h
- [ ] **E2** · TASK-023 — Métricas de coste en tokens por fase (§16) — ~5h
- [x] **E3** · Validación en Windows nativo — **resuelta por el CI, no por una sesión nativa**
      *El job `windows-latest` asevera cada hipótesis como un step propio.
      Las cinco en verde: el bit `+x` sobrevive el checkout nativo, `taskctl`
      resuelve como comando suelto por PATH, los `.sh` de Git-Flow pasan el
      smoke test bajo Git Bash, `node bin/taskctl` funciona desde `cmd.exe`,
      y la suite completa pasa. Cerró la reserva que arrastraban
      TASK-006/007/008/009/010/011. Hallazgo negativo real y corregido: el
      glob de `npm test` no era portable a `cmd.exe`.*
- [ ] **E4** · Decidir el cierre de las 12 tareas con `estado: planificada` pese a estar hechas
- [ ] **E5** · Decidir qué hacer con `runConfigurations.zip` en la raíz

---

## Decisiones que dependen de ti (1/10)

No son horas de trabajo mío, son respuestas tuyas — pero bloquean lo que
está a su derecha.

- [ ] **#1** · ¿Checkpoint humano siempre, o solo desde complejidad media? → bloquea D1
- [ ] **#2** · Máximo de agentes en brainstorm paralelo (3 vs 4) → bloquea D1
- [ ] **#9** · Contenido de `.taskcode/config.yml` → bloquea C4
- [ ] **#11** · Mecanismo determinista para saber qué plugins/skills hay instalados → bloquea D2
- [x] **#12** · Señales del `relevance` en `marketplace.json`
      *Resuelta sin decisión: la documentación oficial dice que `relevance`
      solo surte efecto en marketplaces que un administrador incluya en
      managed settings, así que en un marketplace privado personal no haría
      nada. No se declara.*
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
