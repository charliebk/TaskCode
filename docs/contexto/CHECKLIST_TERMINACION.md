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

**Progreso global: 24 / 42 items terminados (57%)** · última actualización: 2026-09-05

| Fase | Items | Hechos | Estimación |
|---|---|---|---|
| ✅ Ya terminado (Sprint 0 + 1) | 12 | 12 | — |
| ✅ A — Desbloquear | 3 | **3** | ~6h |
| ✅ B — Cerrar el ciclo de vida | 7 | **7** | ~18h |
| C — Tapar huecos | 8 | **1** | ~15h |
| D — Inteligencia del proceso | 7 | 0 | ~38h |
| E — Cierre | 5 | **1** | ~7h |
| **Total pendiente** | **30** | **12** | **~84h** |

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

## ✅ Fase B — Cerrar el ciclo de vida (7/7) · completada el 2026-09-05

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
- [x] **B6** · Añadir `--asignado-a` a `plan` y `start` — ~2h
      *Cerrado el 2026-09-05 (rama `feature/b6-asignado-a-en-plan-y-start`,
      merge `--no-ff` a develop). `parseAsignadoAFlag` vive en un módulo
      compartido para que los comandos no diverjan; sin el flag se
      **conserva** el `asignado_a` que hubiera, así que `start` hereda lo que
      dejó `plan` (§8.2). Rechaza el flag suelto (asignaría a una persona
      llamada "true"), el valor vacío, los saltos de línea y los valores de
      más de 64 caracteres. `plan` y `start` leen ya el ID de los
      posicionales, así que el flag funciona también delante del ID.
      Revisión por pares: 1 IMPORTANTE y 5 MENORES; corregidos el
      IMPORTANTE (`board --asignado-a` se ignoraba en silencio y devolvía
      **el tablero entero** con código 0 — el mismo fallo que justificaba el
      alias, sin cerrar el otro lado) y 3 menores; 2 documentados en
      HALLAZGOS. El revisor verificó por mutación que los 6 tests clave se
      ponen rojos al revertir lo que dicen probar. 32 tests reales nuevos
      (307).*
- [x] **B7** · TASK-015 — Límite de WIP por persona (§8.2) — ~3h
      *Cerrado el 2026-09-05, gestionado de punta a punta con la propia
      herramienta y estrenando el `--asignado-a` de B6. Un **único** límite
      y solo de ejecución (decisión #13): `plan` no comprueba nada, `start`
      aborta si la persona asignada ya tiene otra en `02-en-curso` **o** en
      `03-en-revision` — el hueco no se libera hasta `finish` porque la rama
      sigue viva y es donde se commitean las correcciones de la revisión.
      **Diverge de la §8.2** (dos límites independientes, uno sobre el
      diseño): es la mayor divergencia del proyecto y queda documentada en
      HALLAZGOS. Revisión por pares con 16 casos de ataque y 8 mutaciones:
      1 IMPORTANTE (la divergencia sin documentar) y 6 MENORES; corregidos
      6, documentado 1 (el límite es opt-in, y `carlos` y `charlie.bk` son
      la misma persona con dos grafías — normalizar identidades es material
      de C4). 38 tests reales nuevos (345).*

## Fase C — Tapar huecos (1/8) · ~15h

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
- [x] **C7** · TASK-024 — `asignado_a` por defecto desde la identidad Git — ~2h
      *Cerrado el 2026-09-05. Precedencia: `--asignado-a` > `asignado_a`
      previo > `git config user.email` > `null`; que el previo gane a la
      identidad evita el robo silencioso de tareas ajenas. Migradas 12
      tareas a `charlie.bk@gmail.com`. Revisión por pares: **1 CRÍTICO**,
      4 importantes y 3 menores, todos corregidos. El crítico: la identidad
      Git esquivaba la validación del flag, y un `user.email` con un salto
      de línea **inyectaba una clave que pisaba `estado`** y dejaba la tarea
      ladrillada, con exit 0 y sin aviso. **Ojo**: esta tarea NO hace
      efectivo el límite de WIP, contra lo que decía su plan — rellenar
      `asignado_a` es necesario pero no suficiente (ver C8). 24 tests
      nuevos (369).*
- [ ] **C8** · Corregir el límite de WIP: hoy no ve las ramas de trabajo — ~3h
      *Destapado por el smoke test de C7 y confirmado por su revisión.
      `start` mueve la tarea a `02-en-curso` y ese movimiento se commitea
      **en la rama de la tarea**, pero `plan`/`new`/`import` devuelven el
      repo a `develop` (vía `ensureBaseBranchReady`), y en `develop` ninguna
      tarea está nunca en curso. **El límite de B7 es inoperante en el flujo
      real.** La corrección: mirar las ramas locales sin mergear y leer el
      `tarea.md` de cada una en su propia rama (`git show`).*

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

## Decisiones que dependen de ti (2/10)

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
- [x] **#13** · ¿WIP único, o dos límites independientes (diseño y ejecución)?
      *Resuelta por Carlos el 2026-09-05: **ni una cosa ni la otra** — un
      **único límite, y solo sobre la ejecución**. En diseño no hay tope: se
      pueden planificar varias tareas a la vez. Lo que se limita es tener
      **una sola tarea con la rama abierta**, y el hueco lo ocupan tanto
      `02-en-curso/` como `03-en-revision/`, porque la rama sigue viva y sin
      mergear hasta `taskctl finish` y es ahí donde se commitean las
      correcciones de los hallazgos. Motivo textual: "evitar que se programe
      código de una tarea en la rama Git de otra tarea".*
      *Divergencia con la §8.2 (congelada), que describe dos límites
      independientes y uno de ellos sobre el diseño: hay que documentarla al
      implementar B7, no reescribir la metodología.*
- [ ] **#14 (paso 5)** · ¿`taskctl` comitea y sube por la persona? → bloquea C2
- [ ] **#15** · Pesos de la heurística de complejidad → bloquea D1/D2
- [ ] **#16** · Umbral de dominios para caer a revisor único → bloquea D3
- [ ] **#17** · ¿Revisión ligera solo para `trivial`, o también `simple`? → bloquea D4

---

## Corte mínimo defendible

**Fases A + B + C = 16 items, ~34h.** Dejan un sistema completo y usable,
con la metodología cumplida en lo esencial y el brainstorm multi-agente
pendiente como mejora futura. Si hay que parar antes de tiempo, es aquí.
