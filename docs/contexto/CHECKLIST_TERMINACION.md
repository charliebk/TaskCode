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

**Progreso global: 116 / 117 items terminados (99%)** · última actualización: 2026-11-11

Desde el 2026-10-04 se suma la fase G (urgente, pedida por Carlos): el
plugin conduce el ciclo con fases invocables y modos manual, semiautomatico y
automatico (plan de referencia en TASK-055). Y la fase F: el plan de solución de la auditoría del
2026-10-03 (`docs/auditoria/PLAN-SOLUCION-2026-10-03.md`), más TASK-033, TASK-053
y TASK-054.

El total baja de 43 a 42: **D4 se descarta** (ver su entrada). Y sube en 3 lo
hecho: D6, D7 y el propio D4, que cuenta como resuelto porque la decisión está
tomada y documentada, no aplazada.

| Fase | Items | Hechos | Estimación |
|---|---|---|---|
| ✅ Ya terminado (Sprint 0 + 1) | 12 | 12 | — |
| ✅ A — Desbloquear | 3 | **3** | ~6h |
| ✅ B — Cerrar el ciclo de vida | 7 | **7** | ~18h |
| ✅ C — Tapar huecos | 8 | **8** | ~25h |
| ✅ D — Inteligencia del proceso | 6 | **6** | ~35h |
| ✅ E — Cierre | 6 | **6** | ~9h |
| ✅ F — Auditoría 2026-10-03 | 22 | **22** | — |
| ✅ G — Flujo guiado por fases | 5 | **5** | — |
| ✅ H — Peticiones tras el plan | 3 | **3** | — |
| ✅ I — Métricas v2 | 3 | **3** | — |
| ✅ J — Doctor-deploy | 3 | **3** | — |
| ✅ K — Frenos de verificación con hooks | 8 | **8** | — |
| ✅ L — Mantenimiento | 2 | **2** | — |
| ✅ M — Revisores y roles de dominio | 2 | **2** | — |
| ✅ N — Mejoras tras las métricas de la 0.8 | 10 | **10** | — |
| ✅ O — Verificación selectiva por impacto | 1 | **1** | — |
| ⏳ P — Agilidad sin perder calidad | 20 | **19** | — |
| **Total pendiente** | **1** | — | — |

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
      crea finish si no existen.*

- [x] **B4** · Crear `CHANGELOG.md`, `INDEX.md` y `BOARD.md` — ~1h
      *Los tres los creó `taskctl finish` al cerrar TASK-014 (B3). B4 añadió
      el histórico que faltaba: las 12 tareas de Sprint 0 y 1 en CHANGELOG e
      INDEX, compuestas leyendo sus `tarea.md` reales, apuntando a su ruta
      real en `00-planificadas` (siguen ahí por la paradoja de
      bootstrapping, E4). De paso quedó por escrito que TASK-001, 002 y 003
      declaran una `rama` que no existe en Git.*

- [x] **B5** · Resolver la divergencia de `board` — ~1h
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

## Fase C — Tapar huecos (5/8) · ~15h

Lo que la metodología da por hecho y no existe.

- [x] **C1** · TASK-026 — Wrappers `taskctl diagnose` / `pause` / `resume` / `recover` / `abort-merge` — ~3h
      *Cerrado el 2026-09-06. El nudo no era enrutar a `bash`: cuatro de
      los cinco scripts preguntan con `read -rp`, y con EOF `pause` moría
      con "Opcion no reconocida" y `abort-merge` no abortaba nada saliendo
      con 0. Regla nueva del proyecto: **stdin heredado solo cuando hay
      terminal**, ignorado cuando no la hay, y guard que corta antes de
      invocar si el valor por defecto haría lo contrario de lo que dice el
      comando. La §8.3 ya nombra `taskctl pause` en su mensaje, que era la
      premisa de la tarea. Dos rondas de revisión: **APROBADO CON CAMBIOS**
      (2 importantes, 7 menores) y **APROBADO** (3 menores). Los dos
      importantes: `pause` preguntaba igual con el workspace limpio porque
      los scripts se escriben el registro dentro del repo, y heredar stdin
      siempre **colgaba el comando para siempre** ante una tubería abierta.
      27 tests nuevos (417).*
- [x] **C2** · Paso 5 de §8.3: `taskctl` comitea; sube solo con `--push` — ~3h
      ***Divergencia con la §8.3, deliberada***: *el paso 5 pide tambien
      subir. Se acepta la perdida —una tarea nueva no llega al equipo sola—
      a cambio de que publicar sea un acto consciente.*
      *Cerrado el 2026-09-07 (TASK-030, junto con C4 en la misma rama: el
      limite de WIP es 1 y lo aplica `start`, asi que dos tareas simultaneas
      habrian hecho abortar la segunda). `taskctl` commitea las rutas que
      escribe **una a una**, y en ningun sitio hay un `add -A` sin pathspec.
      Al cablearlo **se cayeron 14 tests existentes**, que era la senal que el
      plan pedia vigilar: casi todos hacian `git add -A && git commit` a mano
      para sortear el workspace sucio, o sea que documentaban el defecto que
      esto quita. Se les quito el commit manual en vez de hacerlos tolerantes.
      El plan estaba a medias equivocado sobre por que hace falta la regla:
      `start`/`review`/`finish` **si** comprueban el workspace; lo que la
      justifica es la ventana entre esa comprobacion y el commit, donde puede
      escribir otro proceso — que aqui es el caso normal, con varios agentes
      sobre la misma copia. Dos rondas: **cambios-solicitados** (2
      importantes) y **APROBADA**. El importante que mas ensena: la lista de
      ficheros se calculaba antes del commit, asi que con un hook de
      pre-commit el CLI decia "1 fichero" con 2 registrados — en el unico
      escenario donde la regla se rompe, la herramienta afirmaba lo
      contrario.*
      *Decisión abierta + implementación. Sin esto, una tarea nueva no llega
      al equipo sola. **Evidencia nueva (A2)**: sin el paso 5, `taskctl
      import` no se puede ejecutar dos veces seguidas — crea las carpetas que
      luego bloquean su propia siguiente invocación.*
- [x] **C3** · TASK-027 — Subcarpetas `planificacion/` y `revision/` en cada carpeta de tarea — ~1h
      *Cerrado el 2026-09-06. `taskctl plan` crea `planificacion/` y escribe
      ahí el scaffold de `plan-final.md`, que es la ubicación canónica según
      la sección 2 de la metodología; `revision/` ya la creaba `review`
      desde B1. **El nudo no era la ruta nueva, era el legado**: `approve`
      sigue aceptando el plan suelto en la raíz —una tarea planificada con
      la versión anterior del CLI no se queda sin poder aprobarse— y una
      re-planificación lo **migra** a `planificacion/` con `rename`,
      conservando el contenido en vez de pisarlo con el scaffold, y lo dice
      en la salida. Si aparecen los dos a la vez (legado + canónico), tanto
      `plan` como `approve` **fallan cerrado** sin tocar nada, en vez de
      elegir por su cuenta cuál gana. Las 6 tareas ya cerradas en
      `04-terminadas/` (TASK-013, 014, 015, 024, 025 y 026) se migraron con
      `git mv` — rename puro, 0 líneas cambiadas —, así que **ya no queda
      ningún `plan-final.md` suelto en el repo**. Revisión por pares ronda
      1: **APROBADO CON CAMBIOS** (1 importante, 4 menores), sobre un clon
      con smoke test propio y 7 mutantes. El importante: la reestructuración
      había dejado sin cobertura una protección contra pérdida de datos que
      `develop` sí tenía, demostrado ejecutando el mismo mutante en las dos
      ramas. Aplicados todos salvo la parte (a) del hallazgo #4 —el `rename`
      de la migración no tiene un equivalente exclusivo del flag `'wx'`
      porque POSIX no lo ofrece—, documentada sin corregir. 8 tests nuevos
      (429; 426 verdes y los 3 rojos conocidos de este entorno Windows).
      Dos rondas de revisión: **APROBADO CON CAMBIOS** (1 importante, 4 menores) y **cambios solicitados → APROBADA** (1 importante, 3 menores). El importante de la ronda 2: el fix de la ronda 1 era un fix solo de Windows —en POSIX el `stat` falla antes con `ENOTDIR`— y el test escrito para certificarlo habría caído en el job `ubuntu-latest`.*
- [x] **C4** · `.taskcode/config.yml` — ~3h
      *Cerrado el 2026-09-07 (TASK-030). Tres claves opcionales: `rama_base`
      (unico hardcode indetectable), `agente_revisor_por_defecto` (que ademas
      estaba duplicado en `new.ts` e `import.ts`) y `limite_wip`. Sin fichero,
      comportamiento identico al de hoy. **Un solo parser**: el bucle
      `clave: valor` de `frontmatter.ts` se extrajo en vez de escribir un
      segundo YAML a mano — y ahi aparecio que el parser NO soportaba
      comentarios de linea entera, solo inline, asi que se anadieron opt-in
      para no cambiar en silencio lo que acepta `tarea.md`. La revision
      encontro que **`limite_wip` era la unica clave sin prueba de cableado**:
      se habia verificado a mano con el CLI y deshacer la linea de `start.ts`
      no rompia ningun test. Y un menor con reencuentro: un `.taskcode` que es
      un fichero caia al default **en silencio en Windows** (`ENOENT`, no
      `ENOTDIR`) — la misma trampa de TASK-027, resuelta preguntandole al
      sistema de ficheros y no al errno.*
- [x] **C5** · TASK-028 — `skills/task-workflow/SKILL.md`, la primera skill del plugin — ~1h
      *Cerrado el 2026-09-07. El plugin ya expone una skill a Claude Code —
      `taskcode-plugin:task-workflow`, 272 líneas—; antes no exponía
      ninguna. **El fichero es corto y el riesgo estaba entero en el
      contenido**: un agente se cree lo que lee en una skill, así que un flag
      inventado no es una errata, es una fuente de errores *con autoridad*.
      Por eso la superficie del CLI se extrajo del **código** (`cli.ts`,
      `state-machine.ts`, `wip.ts`, `git.ts`) y no del README ni de la
      metodología, que en tres puntos ya no la describen. Las tres
      divergencias detectadas y **no** heredadas: `taskctl codex-review` no
      existe pese a estar en la máquina de estados y en la tabla de la §8
      —y `revision_codex: true` deja la tarea imposible de cerrar—, el guard
      de §8.3 solo lo aplican 4 de los 8 comandos, y `plan` no es
      multi-agente. Frontmatter con solo `name` y `description`: la
      intersección entre lo que acepta Claude Code y lo que admite el spec
      portable. La skill viaja a otros proyectos, así que no lleva nada de
      este repo dentro (el revisor buscó 20 marcas: cero coincidencias). Lo
      que queda en `HALLAZGOS.md` es el test que casi nace invertido: `claude
      plugin validate` solo nombra las skills que **fallan**, de modo que
      aseverar sobre su salida habría pasado justo con la skill rota; la
      prueba correcta es la contraprueba sobre una copia con el frontmatter
      roto. Dos rondas de revisión: **cambios solicitados** (1 importante, 5
      menores, todos corregidos) y **APROBADA**. El importante: `CLAUDE.md`
      decía 429 tests y en esta rama son 444 — mergearlo así habría
      reproducido el defecto que la propia corrección venía a arreglar. 15
      tests nuevos (444; 441 verdes y los 3 rojos conocidos de este entorno
      Windows). La ronda 2 dejó además un menor documentado sin corregir, que
      se registra como item propio: **E6**, la distribución del CLI.*
- [x] **C6** · Bug de `origin` en `create-develop.sh`, `recover-branch.sh`, `resume-work.sh` — ~5h
      *Cerrado el 2026-09-07 (TASK-029). El item nacio siendo solo el bug de
      `origin` y C1 le anadio tres frentes mas: los ~1h de la estimacion
      original eran de entonces. Cuatro agentes en paralelo dentro de la
      misma rama, con propiedad exclusiva de ficheros. La respuesta al bug de
      `origin` resulto ser **distinta por script**: `create-develop` aborta
      con origin caido, `recover-branch` falla siempre sin remoto (su
      proposito entero es traerse una rama de ahi) y `resume-work` no aborta
      nunca. El registro se muda a `.git/taskcode/gitflow/`, lo que deja sin
      motivo al segundo guard de `taskctl pause` y se lleva por delante
      `isIgnored`. Dos afirmaciones del plan resultaron falsas al medirlas:
      `create-hotfix`/`create-release` no usan la funcion compartida (deuda
      viva), y `CHERRY_PICK_HEAD`+`REVERT_HEAD` no bastaban — falta
      `.git/sequencer/`. Dos rondas: **cambios-solicitados** (2 importantes,
      5 menores) y **APROBADA** (2 menores). Lo que queda en `HALLAZGOS.md`
      es que mi primer arreglo de un importante era falso: use "comparar HEAD
      antes y despues" como discriminante y en un cherry-pick de un solo
      commit HEAD tampoco se mueve, asi que daba el mensaje del caso raro en
      el caso normal. Lo destapo probar el caso que daba por bueno. 31 tests
      nuevos (472; 469 verdes y los 3 rojos conocidos de Windows).*
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
- [x] **C8** · TASK-025 — El límite de WIP mira las ramas de trabajo — ~3h
      *Cerrado el 2026-09-06. El límite de B7 **no protegía nada**: leía el
      árbol de la rama activa, y el paso a `02-en-curso` se commitea en la
      rama de la tarea mientras `plan`/`new` devuelven el repo a `develop`.
      Ahora pregunta si la persona tiene una **rama de trabajo abierta**
      (local, sin mergear), leyendo el `tarea.md` de cada una con
      `git show`. Verificado en el flujo real, que es lo que le faltó a B7.
      El smoke test destapó un fallo antes que la revisión (en un clon,
      `main` solo existe como remota). **Revisión: RECHAZADO** en la
      primera ronda — 1 CRÍTICO, 2 importantes y 4 menores. El crítico:
      para un `hotfix` las referencias dejaban fuera a `develop`, así que
      **18 ramas ya cerradas** contaban como abiertas y el camino urgente
      quedaba inutilizable, acusando a tareas terminadas y proponiendo un
      remedio imposible. Todos corregidos. 20 tests nuevos (387).*

## ✅ Fase D — Inteligencia del proceso (6/6) · completada el 2026-09-13 · ~35h

La fase cara y la única genuinamente opcional: el sistema ya funciona sin
ella, con un revisor genérico y un `plan` de un solo agente. **D6 y D7 están
hechos** (TASK-032): el plugin ya expone cinco skills y cuatro agentes, y
existe la heurística que D1 y D2 van a consumir como lookup.

- [x] **D1** · TASK-016 — Brainstorm paralelo por roles + agente unificador — hecho el 2026-09-08
      *`taskctl plan` deja de ser un scaffold de un fichero y pasa a orquestar el
      brainstorm: resuelve sin LLM cuántos roles entran y cuáles, y escribe una
      petición por rol con su contexto acotado más la del unificador. El CLI
      sigue sin invocar ningún modelo — mismo reparto que `review` desde
      TASK-013. Estrena el YML de D7, que hasta hoy no leía nadie desde `src/`,
      y añade el quinto agente (`brainstorm-unificador`). **116 tests nuevos**
      (630 → 746). Dos decisiones con Carlos: el número de roles es
      `max(declarado, heurístico)` topado por hotfix (diverge de la §5 del YML,
      que manda consultar a un modelo barato, y el CLI no puede), y se
      implementa la decisión #1 — **el checkpoint humano pasa a ser obligatorio
      para las cinco complejidades**, así que `TRIVIAL_SIN_APROBACION` se vacía.
      Puerta nueva: `plan` aborta si el `## Objetivo` está vacío y hay algún rol
      que lanzar.*
      ***La revisión por pares fue la más dura del proyecto: 5 rondas, 6
      revisores independientes, 8 CRÍTICOS.** Y el hallazgo que más vale está en
      `HALLAZGOS.md`: el mismo CRÍTICO se arregló cuatro veces, y los cuatro
      arreglos eran correctos para el caso que tenían delante — lo que fallaba
      era el modelo del estado de una carpeta. Ninguno de los ocho se encontró
      leyendo el diff; todos salieron de montar el estado a mano y ejecutar el
      binario. Medido de paso: la heurística solo cambia el número de agentes en
      4 de las 32 tareas, y las 7 que quedan pendientes tienen el objetivo
      vacío, así que la puerta nueva las bloquea hasta redactarlo.*
- [x] **D2** · TASK-017 — Catálogo de skills determinista + selección en dos pasos — hecho el 2026-09-09
      *Los `patrones_archivo` de los cuatro revisores ya están declarados en
      cada `SKILL.md`, en lista inline para que el parser del repo los lea tal
      cual. El catálogo debería recogerlos, no reinventarlos.*
      ***5 rondas de revisión por pares (la 2 en dos pasadas independientes),
      35 hallazgos, cero críticos** — la más larga de la fase D después de D1.
      Riesgo aceptado y respetado en las cinco rondas: la comprobación de si un
      skill `origen: externo` está instalado es puramente de lectura vía
      subproceso, nunca instala nada. Se endureció la convención `skill_N_id`
      (`"plugin:skill"`) a fail-closed con regex y test de regresión propio
      (MEN-20, MEN-24). Hallazgo de proceso documentado en `HALLAZGOS.md`: el
      worktree aislado del agente revisor apareció en la rama equivocada
      cuatro rondas seguidas (siempre el mismo commit ajeno, el cierre de
      TASK-016) — detectado y compensado por el propio informe las cuatro
      veces, nunca invalidó el veredicto, pero el traslado del informe a la
      ubicación correcta se hizo a mano cada vez.*
- [x] **D3** · TASK-018 — Enrutado de revisor por diff real, multi-reviewer por dominio — hecho el 2026-09-12
      *`code-quality-reviewer` ya se declara `fallback: true` con
      `umbral_dominios: 3` (decisión #16). Aviso medido en TASK-032: un patrón
      de más no añade un revisor, **sustituye** al genérico — por eso las
      listas de patrones se acotaron y hay un test con tabla de rutas →
      revisor esperado en las dos direcciones.*
      *`cargarCatalogoRevisores` (`src/core/revisores.ts`) promueve a
      producción el lector de `patrones_archivo`/`fallback`/`umbral_dominios`
      que antes solo vivía como helper de test, sin cache (ya divergió dos
      veces, HALLAZGOS.md). `clasificarPorDominio` (función pura) decide el
      reparto con el umbral INCLUSIVE (decisión de Carlos, 2026-09-12): 0
      dominios o más del umbral cae al genérico con el diff completo; 1 a 3
      fragmenta un grupo por dominio, más el genérico si sobran ficheros sin
      dominio claro — nunca se queda nadie sin revisor. `taskctl review`
      clasifica el diff real (`diffNameOnly`) y escribe un par
      petición/informe por grupo, con sufijo de dominio solo cuando
      fragmenta (precedente `informe-codex-N.md`). `finish.ts`/`rondas.ts`
      se extendieron para exigir que TODOS los informes de una ronda
      fragmentada aprueben — sin esto, la tarea quedaría atascada en
      `03-en-revision` para siempre, el riesgo más grave que señaló el
      propio brainstorm.*
      ***2 rondas de revisión por pares, independientes entre sí y del
      implementador**: ronda 1 cambios-solicitados (2 IMPORTANTE — ambos
      huecos de cobertura, no bugs: la numeración de ronda tras fragmentar y
      el mensaje de `cli.ts` con las N peticiones tenían 0% de test aunque el
      comportamiento real ya era correcto — y 2 MENOR, uno documentado como
      evaluado-y-descartado y otro dejado sin corregir por mantenibilidad);
      ronda 2 **aprobada**, por un tercer agente que confirmó por
      reproducción propia (revirtiendo las correcciones en un clon aislado)
      que los dos IMPORTANTE quedaron protegidos. Smoke test manual de
      punta a punta en esta sesión: `new → plan → approve → start` con dos
      dominios reales, `review` fragmenta en 3 peticiones, `finish` cierra
      al aprobar las tres. 855 tests (852 verdes; los 3 rojos son los
      conocidos de Windows nativo).*
- [x] **D4** · TASK-019 — ~~Revisión ligera para tareas `trivial`/`simple`~~ — **NO SE HACE**
      *Descartado por Carlos el 2026-09-07, antes de gastar las ~3h. La
      decisión #17 lo dejó aplicando **solo a `trivial`**, y de las 32 tareas
      del repo **solo una es `trivial`** (TASK-005) y **todavía no se ha
      cerrado ninguna de ese nivel**. Reparto completo: 15 `simple`, 13
      `media`, 3 `alta`, 1 `trivial`. La regla casi nunca se activaría, así
      que son ~3h para un camino que en la práctica no se recorre. Si algún
      día aparecen tareas `trivial` de verdad, se reabre.*
      **Corregido el 2026-09-08 (revisión por pares de TASK-016):** este
      párrafo afirmaba en negrita que «no existe ni una sola tarea `trivial`»
      y a la vez, dos líneas más abajo, «1 `trivial` sin cerrar». Lo primero
      es falso y era el argumento citado; lo segundo es el dato bueno. La
      conclusión (descartar D4) no cambia, pero la premisa sí estaba mal —
      y llegó a copiarse a un comentario de código antes de detectarse.*
- [x] **D5** · TASK-020 — `taskctl codex-review` opcional — hecho el 2026-09-13
      *Sigue siendo el que cierra un agujero real detectado en C5:
      `revision_codex: true` deja hoy la tarea **imposible de cerrar**, porque
      `finish` la rechaza y remite a un comando que no existe.*
      *`src/commands/codex-review.ts` envuelve `codex review --base <rama>
      --title "<id>: <titulo>"` (sin `--commit`: revisaría un commit puntual,
      no el diff completo). No toca `state-machine.ts` ni `finish.ts` — ya
      tenían el contrato cerrado. Todo fallo de Codex (ausente o exit≠0)
      degrada igual: avisa, sale con código 0, sin escribir informe — decisión
      de Carlos, con evidencia real de que en esta máquina Codex falla por
      incompatibilidad de cuenta/modelo, no por el diff. Un humano/agente
      certifica el veredicto tras leer la salida cruda de Codex embebida en
      `informe-codex-N.md`, nunca inferido del exit code.*
      ***3 rondas de revisión por pares, cada una por un agente distinto**:
      ronda 1 cambios-solicitados (`spawnSync('codex', ...)` sin `shell: true`
      nunca invocaba el binario real en Windows —`ENOENT` siempre, aunque
      estuviera instalado—, y un segundo bug destapado al corregirlo: `codex
      review --base <rama>` no admite combinarse con un PROMPT propio,
      conflicto real del CLI); ronda 2 cambios-solicitados (el escapado para
      `cmd.exe` no evitaba que expandiera `%VARIABLE%` — un título con
      `%USERNAME%` filtraba el valor real de esa variable hacia la llamada de
      red externa; corregido eliminando el `%` en vez de escaparlo, porque no
      hay forma fiable de escaparlo en una invocación suelta de `cmd.exe /c`);
      ronda 3 aprobada con menores documentados (un `%` literal legítimo en un
      título también se pierde — trade-off aceptado frente a la fuga de
      datos). 868 tests (865 verdes; los 3 rojos son los conocidos de
      Windows).*
- [x] **D6** · Redactar las 4 skills revisoras (java-spring, angular-vue, csharp-autocad-ifc, code-quality) — hecho el 2026-09-07 (TASK-032)
      *Las cuatro con lo que revisan en su dominio, la exigencia de reproducir
      empíricamente, la clasificación CRÍTICO/IMPORTANTE/MENOR con ejemplos
      propios, la línea de veredicto **extraída del código** de `finish.ts` y
      sus `patrones_archivo`. El enrutado se midió con `path.matchesGlob` en
      las dos direcciones y quedó congelado en tests: 32/32 rutas legítimas
      llegan a su revisor, 37/37 ajenas no casan con ninguno, y 6 capturas
      aceptadas a sabiendas y documentadas.*
- [x] **D7** · Redactar `agents/` (roles de brainstorm) + `scripts/heuristica-complejidad.yml` — hecho el 2026-09-07 (TASK-032)
      *Los cuatro roles con su contexto acotado (§16.2) y su salida con topes
      numéricos (§16.4.4), y el YML con los seis pesos de la §16.1, el mapeo
      de niveles, la lista genérica de palabras de riesgo y la tabla de
      agentes de la decisión #2. **Formato plano a propósito**: el único
      parser del repo lee pares `clave: valor` y listas inline, y falla en
      seco ante una lista en bloque — el dato se acomoda al lector en vez de
      ampliar el lector.*
      ***Divergencia documentada***: el fichero dice `alta` donde la §16.1 y
      la decisión #2 dicen `compleja`, porque el enum del plugin
      (`src/core/task.ts`) es `trivial | simple | media | alta | critica` y
      `validateTask` **rechaza** `compleja`. Tres tareas reales declaran
      `alta` — TASK-016, 017 y 018, justo las que más agentes pedirían.*

*Las dos: **9 artefactos, cero líneas en `src/`**, 93 tests nuevos (537 → 630).
Tres rondas de revisión por pares con tres revisores independientes cada una,
31 hallazgos, **cero críticos**, todos aplicados. El patrón que dejan para
`HALLAZGOS.md` se repitió las tres veces: la corrección de un hallazgo llega
sin la red que impide deshacerla — de ahí salieron **siete aserciones que no
podían fallar**, incluida la que exigía «reproducir empíricamente» y se
satisfacía con una etiqueta que otro test obliga a estar presente.*

## Fase E — Cierre (5/6) · ~9h

- [x] **E1** · TASK-022 — Documentación de equipo + invitar colaboradores — resuelta el 2026-09-16
      *[`docs/contexto/INCORPORACION.md`](INCORPORACION.md) (nuevo): guía de
      incorporación en cuatro pasos (acceso, clonar e instalar, ciclo de
      vida, primera tarea), enlazada desde `README.md` y este índice — sin
      duplicar `skills/task-workflow/SKILL.md` ni la sección 13 de
      `PROPUESTA_METODOLOGIA.md`, solo enlazándolos. Incluye, explícita, la
      decisión de Carlos (2026-09-13) de que hoy no hay colaboradores que
      invitar. Cierra también el punto 8 de la sección 14 **en lo que
      respecta a a quién se invita** (documento no editado, es congelado —
      mismo patrón que #1/#2/#9/#11/#12/#13): a día de hoy, **a nadie**; el
      repo `charliebk/TaskCode` sigue con un solo colaborador, el propio
      dueño.*
      ***Tres rondas de revisión independiente, cero críticos, aprobada en
      la 3ª**: ronda 1 (cambios-solicitados, 3 importantes: invertía qué
      estaba probado y qué no sobre `taskctl` por PATH, referencia circular
      al cierre del punto 8, faltaba el paso de clonar y el acceso pedido
      era insuficiente) + ronda 2 (cambios-solicitados, 1 importante
      corregido a medias: la reescritura seguía atribuyendo al CI una
      instalación de plugin que nunca ejecuta) + ronda 3 (aprobada, 3
      menores no bloqueantes, aplicados igualmente). Detalle completo en el
      `## Resultado` de `tareas/04-terminadas/TASK-022/tarea.md`.*
- [x] **E2** · TASK-023 — Métricas de coste en tokens por fase (§16) — cerrada el 2026-10-06
      *`taskctl registrar-coste` (`--agente <id>` suma el uso real de la
      transcripción del subagente; la cifra que Claude Code muestra al
      terminarlo es su contexto final, no su coste), `metricas --tokens
      [--escribir]` y un aviso no bloqueante en `finish`. Histórico de 41
      tareas en la §11 de `docs/METRICAS.md`: la revisión se lleva el
      71-100 % del gasto de subagentes y **los pesos de la heurística no se
      tocan**. 2 rondas: 1 IMPORTANTE (aviso de `finish` con la semántica
      descartada) y 5 MENOR, todos corregidos. Detalle en el `## Resultado`
      de `tareas/04-terminadas/TASK-023/tarea.md`.*
- [x] **E3** · Validación en Windows nativo — **resuelta por el CI, no por una sesión nativa**
      *El job `windows-latest` asevera cada hipótesis como un step propio.
      Las cinco en verde: el bit `+x` sobrevive el checkout nativo, `taskctl`
      resuelve como comando suelto por PATH, los `.sh` de Git-Flow pasan el
      smoke test bajo Git Bash, `node bin/taskctl` funciona desde `cmd.exe`,
      y la suite completa pasa. Cerró la reserva que arrastraban
      TASK-006/007/008/009/010/011. Hallazgo negativo real y corregido: el
      glob de `npm test` no era portable a `cmd.exe`.*
- [x] **E4** · Decidir el cierre de las 12 tareas con `estado: planificada` pese a estar hechas — resuelta el 2026-09-16
      *TASK-001 a TASK-012, todas cerradas desde hace tiempo (evidencia en
      `CHANGELOG.md`, `docs/INDEX.md`, y esta misma sección "Ya terminado")
      pero con `estado: planificada` en su frontmatter porque se hicieron
      antes de que `taskctl` existiera — la "paradoja de bootstrapping" que
      ya nombraba `CONVENCIONES.md`. Se investigó si se podía forzar el
      ciclo real (`plan → approve → start → review → finish`) ahora mismo:
      **no**, y no por preferencia sino por imposibilidad medida.
      TASK-001/002/003 declaran una `rama:` que no existe en Git —
      `taskctl finish` haría `git merge-base --is-ancestor` contra una ref
      inexistente y **crashearía** con una excepción de Git sin capturar,
      no con un error limpio (`finish.ts` + `isAncestor` en `git.ts`,
      confirmado leyendo el código). Las otras 9 ya están mergeadas en
      `develop`: una revisión por pares "empírica" contra ellas correría
      sobre un diff vacío. Se decide la **Opción A**: dejarlas donde están,
      sin tocar frontmatter ni carpetas — mismo patrón que **D4** (decisión
      documentada, no aplazada, cuenta como resuelta). La alternativa
      (editar `estado:` a mano y mover a `04-terminadas/`) se descarta
      porque la propia documentación del proyecto la desaconseja
      explícitamente (`CONVENCIONES.md`: "contradiría el principio del
      sistema"; `skills/task-workflow/SKILL.md`, regla 3: "no editar
      `estado:` a mano para saltarse un paso") — no hay ningún texto que la
      respalde. Riesgo aceptado: `taskctl board` seguirá mostrando estas 12
      mezcladas con la planificación vigente.*
- [x] **E5** · Decidir qué hacer con `runConfigurations.zip` en la raíz — resuelta el 2026-09-16, **borrado**
      *Confirmado: era la carpeta `.idea/runConfigurations/` de OTRO
      proyecto (CDAU/IECA — Auth Service, Gateway, etc.), entrada en el
      commit inicial (`4435d68d`), que sirvió de semilla para migrar 22 run
      configurations + 18 scripts Bash hacia
      `taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/`
      (TASK-007/TASK-008 — dos de las 12 de E4). Sin ninguna dependencia
      funcional en el repo (confirmado por grep). Borrado del working tree;
      recuperable del historial con `git show
      4435d68d:runConfigurations.zip` — nota añadida en
      `scripts/gitflow/README.md` con ese hash para no depender de
      recordarlo de memoria.*
- [x] **E6** · Distribución del CLI: un clon recién hecho no trae un `taskctl` que funcione — ~2h estimadas, **~6h reales**
      *Cerrado el 2026-09-07 (TASK-031). `dist/src/` se versiona: un clon de
      `develop` ya arranca sin compilar (`node bin/taskctl --version` → `0.1.0`,
      antes exit 1). El enunciado del item se equivocaba en un punto y se
      corrigió: `package.json` **sí** declara `bin`, y que `plugin.json` no lo
      haga es correcto — el PATH funciona por convención de directorio. La
      causa era solo `dist/` ignorado.*
      *El plan se quedó corto en su premisa central: `newLine: "lf"` no basta,
      porque las plantillas multilínea de `src/` viajan tal cual al build (34
      CRLF medidos, los 34 dentro del literal `HELP`). Y la primera medición no
      lo vio porque comparaba Windows contra Windows. De ahí `*.ts text eol=lf`
      además de `dist/**` y `bin/*`.*
      ***Tres rondas de revisión, 34 hallazgos, cero críticos**: 5 importantes
      + 16 menores (3 revisores en paralelo), 2 + 5 (uno en clon propio), y 0 +
      5 en la ronda de cierre, **APROBADA**. El guard de CI resultó estar mal
      por **cinco** motivos distintos, ninguno visto por quien lo escribió — el
      último, que su propio mensaje de error prescribía un remedio imposible de
      seguir. Y dos importantes de la ronda 2 eran defectos de las correcciones
      de la ronda 1, no del trabajo original: el patrón que ya registró C6.*
      ***AC7 queda a medias, y a propósito**: la instalación real se ejecutó
      (`plugin marketplace add` + `install` con el CLI 2.1.226), la copia
      cacheada arranca, y se confirmó por primera vez en este proyecto que el
      mecanismo de `bin/` en PATH existe de verdad. Pero `taskctl` como comando
      suelto **no se ha visto funcionar**: cuesta un comando en la próxima
      sesión, `taskctl --version`. La evidencia que se presentó primero para
      este AC no probaba lo que decía, y lo cazó la revisión: la caché de un
      marketplace `directory` copia el árbol de trabajo con ignorados incluidos.*
      *537 tests (534 verdes y los 3 rojos conocidos de Windows), 5 nuevos.*
      *Item nuevo, abierto por la revisión por pares de C5 (MENOR, no
      bloqueante, **preexistente** y fuera del alcance de aquella tarea).
      `dist/` está en `.gitignore`, `.claude-plugin/plugin.json` no declara
      `bin` y `package.json` tampoco, así que en un clon recién hecho
      `bin/taskctl` —que hace `import('../dist/src/cli.js')`— muere con
      `[ERROR] taskctl no pudo arrancar: Cannot find module
      '...\dist\src\cli.js'` y sale con código 1 mientras nadie ejecute
      `npm install && npm run build` dentro del plugin; y ni aun después
      queda `taskctl` en el PATH de otro proyecto. No es un hueco del ciclo
      de vida sino una decisión de **empaquetado**: compilar al empaquetar,
      versionar `dist/`, o documentar el arranque en el README del plugin.
      Condiciona a E1 —invitar colaboradores que clonan y no pueden
      ejecutar nada— y, cuando se cierre, la skill de C5 debería acabar
      diciendo en una línea cómo se pone `taskctl` disponible.*

---

## Decisiones que dependen de ti (2/10)

No son horas de trabajo mío, son respuestas tuyas — pero bloquean lo que
está a su derecha.

- [x] **#1** · ¿Checkpoint humano siempre, o solo desde complejidad media?
      *Resuelta por Carlos el 2026-09-07: **siempre**. No es solo prudencia:
      hoy ya es asi (`start` exige `plan_aprobado: true`), asi que "siempre"
      cuesta **cero codigo** y auto-aprobar seria anadir una bifurcacion nueva
      con una forma nueva de equivocarse. Y hay evidencia en contra de
      abaratarlo: en la sesion del 2026-09-07, **tres planes llegaron a
      aprobacion con premisas falsas** (que dos scripts usaban una funcion
      compartida, que dos testigos bastaban, que el parser soportaba
      comentarios de linea). Las cazo quien las toco despues, no el
      checkpoint — pero quitar la lectura humana quita el unico control que
      no es un agente. Divergencia con la §155, que lo describe como
      "opcional, recomendado desde complejidad media": se documenta.*
- [x] **#2** · Máximo de agentes en brainstorm paralelo (3 vs 4)
      *Resuelta por Carlos el 2026-09-07: **escala con la complejidad** — 0 en
      `trivial`, hasta 3 en `compleja`, **4 en `critica`**. Los 4 son los
      cuatro roles que la §2 ya define (arquitectura, riesgos, testing,
      dominio): con 3 habria que repartir uno entre los otros. El techo
      importa porque el coste del unificador crece con las entradas, no solo
      el de los agentes.*
- [x] **#9** · Contenido de `.taskcode/config.yml`
      *Resuelta por Carlos el 2026-09-07: **tres claves**, todas opcionales
      — `rama_base` (hoy `'develop'` literal en `git.ts:352`, el unico
      hardcode que no se puede detectar), `agente_revisor_por_defecto` (hoy
      `'general-purpose'` **duplicado** en `new.ts` e `import.ts`) y
      `limite_wip` (hoy 1, fijo). **Descartada `politica_no_borrar_ramas`**:
      solo puede valer `true`, asi que documenta en vez de configurar; si se
      declarase habria que decidir que hace el plugin cuando alguien escriba
      `false`, y "nada" envejece mal. **Descartada `rama_principal`**: ya la
      detecta `resolveMainBranch` (main/master), y ponerla en config duplica
      una deteccion que funciona. **Descartado `remoto`**: 18 scripts
      hardcodean `origin` y eso es un trabajo mucho mayor que C4.*
      *Forma acordada, que importa mas que las claves: sin fichero el
      comportamiento es identico al de hoy (no-breaking, los 472 tests siguen
      valiendo de red); **fallo cerrado** ante valor invalido o clave
      desconocida, nunca caida al default en silencio (misma doctrina que el
      `wx` de `plan.ts` y el parser de veredictos); **un solo parser** —el de
      frontmatter ya cubre este subconjunto y su bucle `clave: valor` es
      extraible—; **un solo punto de resolucion** (`resolverConfig(cwd)` con
      defaults ya aplicados), para que la cuarta clave cueste una linea; y
      **no se declara ninguna clave que nadie lea** todavia (`remoto`, las
      palabras clave de la heuristica): una clave escribible que no hace nada
      es peor que no tenerla, y este proyecto ya se quemo con `codex-review`.*
- [x] **#11** · Mecanismo determinista para saber qué plugins/skills hay instalados
      *Resuelta el 2026-09-07, **verificada ejecutandola**: `claude plugin
      list --json` devuelve los plugins instalados en JSON estable (id,
      version, scope, enabled, installPath), y `claude plugin details
      <plugin>` da el inventario de componentes, incluidas las skills.*
      ***Lo importante es lo que NO hay que usar**: `claude plugin validate`
      solo nombra las skills que **fallan**, asi que un plugin sin ninguna
      skill valida igual. Comprobado en TASK-028 con dos plugins sinteticos;
      esta en `HALLAZGOS.md`. Aseverar sobre su salida para deducir que hay
      instalado da la respuesta contraria a la verdadera.*
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
- [x] **#14 (paso 5)** · ¿`taskctl` comitea y sube por la persona?
      *Resuelta por Carlos el 2026-09-07: **commitea si, sube solo con
      `--push`**. La pregunta eran en realidad dos con riesgos distintos:
      commitear es local y se deshace con `git reset`, y solo toca `tareas/`
      y `docs/`; subir publica al equipo. Evidencia medida: TASK-029 costo 9
      commits y **4 existian solo porque `taskctl` no commitea lo que el
      mismo escribe** (tarea creada, plan aprobado, peticion de revision,
      artefactos de cierre); `import` sigue sin poder ejecutarse dos veces
      seguidas; y una rama cuyo movimiento de tarea no este commiteado es
      invisible para el limite de WIP (C8).*
      *Divergencia con la §8.3 que hay que documentar al implementar C2: el
      paso 5 pide tambien subir, con el argumento de que si no, el equipo no
      ve la tarea nueva hasta que alguien la suba a mano. Se acepta esa
      perdida a cambio de que publicar siga siendo un acto consciente.*
- [x] **#15** · Pesos de la heurística de complejidad
      *Resuelta por Carlos el 2026-09-07: **se aceptan los pesos de la §16.1
      tal cual**, como defaults del plugin, y se ajustan cuando haya datos.*
      *El motivo de no "validarlos con datos reales" como pedia el enunciado
      es que **no se puede**: medido el 2026-09-07 sobre las 10 tareas de
      `04-terminadas/`, el historial entero es **6 `media` y 4 `simple`**. No
      existe ni una tarea `trivial`, `compleja` ni `critica`, asi que tres de
      los cinco niveles no tienen con que contrastarse. Fingir esa validacion
      seria peor que declararla pendiente.*
- [x] **#16** · Umbral de dominios para caer a revisor único
      *Resuelta por Carlos el 2026-09-07: **3**, el punto de partida que
      propone la §16.5. Con 2 se perderia el caso que motivo la seccion
      (backend + el componente que lo consume), que es justo donde varios
      revisores en paralelo aportan. **No se hace configurable todavia**:
      seria una cuarta clave en `.taskcode/config.yml` que nadie lee hasta
      que exista D3, y la decision #9 prohibe expresamente declarar claves
      que no hacen nada.*
- [x] **#17** · ¿Revisión ligera solo para `trivial`, o también `simple`?
      *Resuelta por Carlos el 2026-09-07: **solo `trivial`**, contra lo que
      sugeria la §16.6 con su "(y probablemente `simple`)".*
      ***Decidida con datos, no con criterio***: *de las 4 tareas `simple`
      cerradas, **una escondia un CRITICO** — TASK-024, donde un `user.email`
      con un salto de linea inyectaba una clave que pisaba `estado` y dejaba
      la tarea ladrillada con exit 0 y sin aviso — y **las cuatro** tuvieron
      al menos un IMPORTANTE (TASK-027: el fix era solo de Windows y su test
      habria caido en el CI de Linux; TASK-028: la correccion habria
      reproducido el defecto que venia a arreglar; TASK-015: 3 importantes).
      Abaratar la revision de `simple` habria dejado pasar el peor bug del
      proyecto.*
      *Efecto secundario que conviene saber: como tampoco existe ninguna
      tarea `trivial` en el historial, **la regla casi nunca se activara**.
      Eso hace D4 mucho menos valioso de lo que parecia — merece revisarse si
      vale sus ~3h antes de implementarlo.*

---

## Corte mínimo defendible

**Fases A + B + C = 18 items, ~39h.** Dejan un sistema completo y usable,
con la metodología cumplida en lo esencial y el brainstorm multi-agente
pendiente como mejora futura. Si hay que parar antes de tiempo, es aquí.

---

## ✅ F — Auditoría 2026-10-03 (22/22)

*(El contador iba uno por debajo desde antes de la fase 6: las 22 casillas
están marcadas. Corregido al publicar la 0.5.0.)*

- [x] TASK-033 — Comando de sincronización tras cada transición (v0.1.1)
- [x] TASK-034 — F1-T1 Excluir lo generado del diff de revisión
- [x] TASK-035 — F1-T2 Política de rondas y una sola suite por ronda
- [x] TASK-036 — F1-T3 Veredicto con un comando e informe estructurado
- [x] TASK-037 — F2-T1 Logging de Git-Flow sin lanzar procesos
- [x] TASK-038 — F2-T2 Una sola detección de origin, con timeout
- [x] TASK-039 — F2-T3 Menos llamadas git en los comandos
- [x] TASK-040 — F3-T1 `taskctl review` para la ronda 2 y siguientes (v0.2.0)
- [x] TASK-041 — F4-T1 `taskctl new` con objetivo y criterios
- [x] TASK-043 — F4-T2 Validación antes de plan y puertas de cierre
- [x] TASK-044 — F4-T3 Partición propuesta de las tareas grandes
- [x] TASK-042 — F4-T4 Complejidad por heurística y un rol sin unificador
- [x] TASK-045 — F5-T1 `rama_base` de punta a punta
- [x] TASK-046 — F5-T2 Secciones con subtítulos y criterios multilínea
- [x] TASK-047 — F5-T3 Flags desconocidos y mensajes de review
- [x] TASK-050 — F6-T1 Suite rápida y repo plantilla en los tests
- [x] TASK-051 — F6-T2 Partir los ficheros de test más largos
- [x] TASK-048 — F6-T3 Skill de flujo más ligera
- [x] TASK-049 — F6-T4 Metadatos del plugin y modelo de los agentes
- [x] TASK-052 — F6-T5 Telemetría de fases y heurística recalibrada
- [x] TASK-053 — `moveTareaFile` reintenta el rename ante EPERM/EBUSY
- [x] TASK-054 — Rutas no ASCII en el diff de revisión por dominio

## G — Flujo guiado por fases (5/5)

Pedido por Carlos el 2026-10-04 con prioridad sobre el resto de la fase F.
Plan de referencia: `tareas/.../TASK-055/planificacion/plan-final.md`.

- [x] TASK-055 — Flujo A: `taskctl` desde PowerShell y cmd
- [x] TASK-056 — Flujo B: núcleo determinista del siguiente paso y registro de transiciones
- [x] TASK-057 — Flujo C: fases como skills invocables en modo manual
- [x] TASK-058 — Flujo D: modo semiautomático
- [x] TASK-059 — Flujo E: modo automático

## H — Peticiones tras el plan (3/3)

Funcionalidad pedida por Carlos después de cerrar el plan de terminación.

- [x] TASK-060 — Opciones de cierre en `finish`: merge normal (por defecto),
      merge request y tag — cerrada el 2026-10-06, publicada en la 0.6.0
      *`--tag <nombre>` pone un tag anotado sobre el commit de merge, validado
      antes de mergear y subido solo con `--push`; en hotfix y release le da
      nombre al tag del script. `--merge-request` abre el PR en GitHub o el MR
      en GitLab tras un preflight sin efectos, y un segundo `finish` cierra
      cuando la plataforma lo da por mergeado. Clave `cierre_por_defecto` y
      la skill `finish` pregunta salvo en automático. Hubo 2 rondas: 1
      IMPORTANTE (la rama se daba por integrada con commits que no estaban en
      el MR) y 5 MENOR, todos corregidos.*
- [x] TASK-061 — Merge request en cualquier GitLab, también autoalojado —
      cerrada el 2026-10-08
      *Claves `plataforma_remota` y `url_base_remoto`; `glab` recibe
      `GITLAB_HOST` (la base) y `-R` (el proyecto relativo a la base) desde
      un único punto. La sesión se comprueba con `glab api user` y el MR se
      crea con `glab api`, porque `glab mr create` no funciona con una
      instancia bajo una ruta. Una clave desconocida en la config avisa en
      lugar de abortar. Hubo 2 rondas: 1 IMPORTANTE, reproducido con glab
      real (`mr create` fallaba en subpath después de subir la rama), y 3
      MENOR. Verificado con glab real contra HTTPS local.*
- [x] TASK-062 — `taskctl doctor`: comprobar que un proyecto está listo —
      cerrada el 2026-10-08, publicada en la 0.7.0
      *Solo lee. Comprueba el entorno (Node 22, git, y bash ejecutando un
      script real, sin OK falso con WSL), el repo, la config, la coherencia
      de las tareas con un recorrido propio y, si aplica, la sesión de
      gh/glab. Cada fallo trae su arreglo; con `--json` y código 1 solo si
      hay errores. Hubo 1 ronda, con 5 MENOR corregidos.*

## I — Métricas v2 (3/3)

Pedido por Carlos el 2026-10-25: medir el comportamiento del plugin en los
proyectos que lo usan (ToolsaWeb, OpenGisViewer, TaskCode) antes de decidir
mejoras de tokens, tiempo, verificación o memoria de contexto. Se partió en
el diseño de TASK-063 en captura (A) y lectura (B).

- [x] TASK-063 — Métricas v2 (A): capturar desglose de coste, lecturas y
      origen de hallazgos — cerrada el 2026-10-25
      *Tabla `## Coste` en `tarea.md` con entrada, caché escrita y leída,
      salida, lecturas y total por registro; las lecturas cuentan Read, Grep,
      Glob, MCP de lectura y Bash de lectura. Columna `Origen` por hallazgo
      (implementación, plan o especificación) y `leerHallazgos`. `finish`
      avisa sin coste de implementación. 1 ronda, aprobada, 3 MENOR
      aceptados (dos pasan a TASK-064).*
- [x] TASK-064 — Métricas v2 (B): fila de métricas con coste desglosado,
      hallazgos y lecturas — cerrada el 2026-10-25
      *`metricas` da por tarea crit/imp/men y su origen, contados una vez
      por tarea (revisor + ID, severidad por primera palabra, fusión campo a
      campo entre rondas); con `--tokens`, tokens nuevos, lectura de caché y
      sin desglose; terminadas sin coste y mediana de lecturas. Se partió en
      su diseño: los agregados pasan a TASK-065. 2 rondas: 2 IMPORTANTE
      reproducidos con OpenGisViewer (fila «sin hallazgos» contada; la última
      ronda borraba un dato reconocido), corregidos.*
- [x] TASK-065 — Métricas v2 (C): evolución, grupos y varios proyectos —
      cerrada el 2026-10-25
      *`--evolucion`, `--grupos` y `--repo` repetible (clave proyecto + id,
      `realpath`, abortos ante rutas dudosas), `--json` con lista cerrada de
      flags, flags repetidos que abortan en todos los comandos, lista sin
      coste acotada y coste de agentes reanudados por diferencia. Línea base
      de ToolsaWeb, OpenGisViewer y TaskCode (194 tareas) en su Resultado.
      1 ronda, aprobada con 3 MENOR aceptados.*

## J — Doctor-deploy (3/3)

Pedido por Carlos el 2026-10-27: un doctor para antes de lanzar o publicar una
aplicacion que compruebe punto por punto una lista de seguridad generica
(20 puntos pedidos mas los medibles que falten), adaptada al tipo de
aplicacion, que diga que falla y como arreglarlo, y cree tareas desde
TASK-9999 hacia abajo. Partido en dos: deterministas (A) y juicio, tareas y
aviso en release (B).

- [x] TASK-066 — Doctor-deploy A: catalogo generico y comprobaciones
      deterministas — cerrada el 2026-10-27
      *`taskctl doctor-deploy [--json] [--escribir]`: catalogo de 43 puntos y
      15 tipos como datos, capa del proyecto con desactivar y silenciar por
      hallazgo, cuatro estados sin OK sin evidencia, seis sondas
      deterministas (secretos en arbol e historial, ficheros de secretos,
      .gitignore, lockfile, dependencias) y enmascarado en origen. 3 rondas:
      7 IMPORTANTE (falsos OK por cobertura y tests que faltaban), corregidos;
      MEN-12 y MEN-13 pasan a TASK-067.*
- [x] TASK-067 — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso
      en release — cerrada el 2026-10-27
      *Skill doctor-deploy y agente revisor-seguridad-deploy; `--resultado`
      con veredictos citados por fichero:linea y rechazos con motivo; JSON v2
      y `<fecha>.json`; `--crear-tareas` desde TASK-9999 hacia abajo con
      etiqueta `doctor-deploy:<punto>` y sin duplicar; rango reservado
      TASK-9000..9999 fuera de la numeracion normal; aviso sin bloquear en
      `finish` de una release. 2 rondas: solo MENOR, corregidos (el aviso
      ignora tambien `tareas/` por decision de Carlos).*
- [x] TASK-068 — Doctor-deploy C: tipo de aplicacion y sondas deterministas
      extra (Firebase/RLS, .npmrc, docker-compose, CI, Dockerfile; version
      vigente de OWASP/ASVS) — cerrada el 2026-11-04
      *Clase de aplicacion como segundo eje (web, api, movil, cli, libreria):
      sin clase detectada los puntos aplican; con cli o libreria y sin senal de
      servicio, diez puntos salen NO APLICA con el marcador en el motivo. Siete
      sondas deterministas nuevas (puntos 37-43), JSON v3 y referencias OWASP
      Top 10 2025 + ASVS 5.0. 2 rondas: IMP-1..3 corregidos (API con bin,
      variantes de Dockerfile/compose, huella por paso en pr-target);
      MEN-3, 5, 6, 7 y 8 aceptados.*

## ✅ K — Frenos de verificación con hooks (8/8)

Que una tarea no se dé por hecha ni se mergee con la verificación en rojo,
usando hooks Stop y PreToolUse de Claude Code. Ideas tomadas de
gemba-app/brakes (Apache-2.0), sin copiar código. Empieza por un spike.

- [x] TASK-069 — Spike: hooks Stop y PreToolUse de Claude Code en
      Windows/IntelliJ — cerrada el 2026-11-03
      *Sonda inerte `hooks/sonda-hooks.mjs` (Node, forma exec) con 16 casos de
      test y steps de CI. H1–H6 confirmadas en Windows nativo con Claude Code
      2.1.317 (`claude -p`): Stop con exit 2 devuelve al agente y
      `stop_hook_active` corta el bucle; PreToolUse bloquea `git merge` por
      Bash y PowerShell, también en subagentes. Criterio de CI sin marcar: la
      rama no se había subido. 2 rondas: IMP-1 (la regex bloqueaba
      `git merge-base`), corregido; MEN-5 y MEN-6 aceptados para TASK-071/072.*
- [x] TASK-070 — Clave `comando_verificacion` en `.taskcode/config.yml` —
      cerrada el 2026-11-04
      *`comando_verificacion` (null = sin freno) y `timeout_verificacion` (600 s)
      en `config.ts`, con fallo cerrado y el timeout sin comando abortando;
      `taskctl doctor` da `ok` con el comando u `omitida` con el arreglo en la
      misma línea (no `aviso`, para no tocar los tests existentes). Validadores
      de sincronización generalizados sin cambiar sus mensajes. 1 ronda:
      aprobada, MEN-1 y MEN-2 aceptados. Sin versión: llega con TASK-071.*
- [x] TASK-071 — Hook Stop: una tarea no se da por hecha con la verificación
      en rojo — cerrada el 2026-11-04
      *Hook `Stop` en forma exec (`dist/src/hooks/stop-verificacion.js`,
      timeout 3600): con tarea en `02-en-curso` en la rama y
      `comando_verificacion`, ejecuta y sale 2 con comando, código, duración y
      cola (40 líneas / 4 KiB, sin ANSI ni credenciales en URLs). Sin procesos
      fuera de un proyecto con tareas; `FRENO_VERIFICACION=0` lo apaga.
      Decisiones de Carlos: la clave basta, config inválida bloquea una vez,
      memo de verdes y rojos por huella en `.git/`. Envoltorio extraído a
      `fs/ejecucion-acotada.ts`. Smoke con `claude -p` real. 2 rondas: IMP-1 e
      IMP-2 (tests de huella y de tope) y MEN-1..7 corregidos; MEN-8 aceptado.*
- [x] TASK-072 — Puerta de verificación en `finish` y merge guard — cerrada el
      2026-11-04
      *`finish` ejecuta siempre `comando_verificacion` antes de mergear o abrir
      el MR (no en el segundo MR ni en el camino idempotente) y aborta en rojo;
      `--sin-verificacion` lo anota commiteado en la rama antes del merge. Hook
      `PreToolUse` sin `if` (sustituye a la sonda): bloquea `git merge` y los
      scripts de cierre hacia `rama_base`/main sin verde guardado del commit
      fuente; analiza compuestos y `bash -c`/`pwsh -Command`. Decisiones de
      Carlos D1–D4. Smoke con `claude -p` real. 2 rondas: MEN-1..3 corregidos;
      MEN-4 (`bash -o pipefail -c`) aceptado y resuelto en TASK-077.*
- [x] TASK-077 — Guardián de merges: opciones con valor antes de `-c` y doc de
      `bash -c` — cerrada el 2026-11-04
      *Seguimiento de TASK-072: helper `opcionesDeShell` (una regla para `-c` y
      para el script de cierre; un valor por cada `o`/`O` del grupo, `--rcfile`,
      `--init-file`); texto de `-c` = primer no-opción. README y CHANGELOG. 2
      rondas: MEN-1 (`-oc`) y MEN-2 (test de `+c`) corregidos.*
- [x] TASK-073 — Tests held-out por tarea — cerrada el 2026-11-05
      *Primera parte (partida por decisión de Carlos): `comando_heldout`;
      `finish` ejecuta `aceptacion/` con `HELDOUT_DIR` tras la verificación y
      aborta en rojo sin mostrar la salida; huella por árbol de Git frente a la
      base (con merge-base para saber si cambió la base o la rama); comando de la
      config de la base; hotfix contra main; `aceptacion/` siempre fuera del
      diff de revisión; `heldout.md` en la skill. 3 rondas: IMP-1..3 y MEN-1..6
      corregidos; MEN-7 (test en negativo del «Ademas») aceptado.*
- [x] TASK-078 — Hook que impide leer y editar los held-out de la tarea en curso
      (segunda parte de TASK-073) — cerrada el 2026-11-05
      *Guardián `PreToolUse` (`guardia-heldout.ts`) con dos entradas: la nueva
      de fichero (`Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob`) y la de
      Bash/PowerShell ampliada. Casado por segmentos tras normalizar barras,
      mayúsculas, `..` y relativas al cwd. Decisiones de Carlos: tarea protegida
      por el nombre de la rama (nunca `tarea.md`), el remedio de `finish` lo
      ejecuta la persona, sin interruptor. Riesgos aceptados declarados en
      `heldout.md` (Grep sobre la raíz, cambiar de rama). Smoke con `claude -p`
      real. 2 rondas: MEN-1..5 corregidos o declarados.*
- [x] TASK-074 — Cobertura sobre las líneas cambiadas — cerrada el 2026-11-05
      *Freno 8: lcov propio (`core/lcov.ts`) cruzado con las líneas añadidas desde
      la merge base (`git diff -U0` con opciones fijas, respetando
      `excluir_de_revision`). `review` lo informa en la petición; `finish` frena
      con `umbral_cobertura` (% mínimo, el exacto pasa) leído de la rama base, y
      sin datos fiables no cierra. Claves `informe_cobertura` y
      `umbral_cobertura`. Node escribe `SF:` relativo y con `\`: tests con lcov
      real. Smoke con el CLI real. 4 rondas (la 4.ª autorizada por Carlos):
      IMP-1..6 y MEN-1..8 corregidos, con la regla de los ficheros fuera del
      informe precisada tres veces por Carlos; MEN-9 y MEN-10 (huecos de test)
      aceptados. Seguimiento: dogfooding en este repo.*

## ✅ L — Mantenimiento (2/2)

Arreglos que salen al revisar otras tareas y no son de ninguna fase.

- [x] TASK-075 — Contrapruebas de descubrimiento rotas por el validador de
      Claude Code 2.1.316+ (detectado al revisar TASK-069) — cerrada el 2026-11-05
      *Helper `test/helpers/validador-claude.ts`: «valida limpio» = exit 0,
      `Validation passed` y ninguna cruz antes de la línea `Plugin directory
      checks for` (el bloque del directorio marca README_MISSING con cruz aunque
      pase). Tests 13/14/16/17 lo usan; test unitario que corre en CI. En
      Windows quedan solo los 3 rojos conocidos. 2 rondas: MEN-1 (corte anclado a
      principio de línea) corregido; MEN-2 aceptado.*
- [x] TASK-076 — `taskctl doctor` avisa de hooks PreToolUse sobre Agent que
      bloquean los subagentes en modo automatico, y version nueva del plugin
      para avisar a todos los proyectos (detectado durante TASK-068) — cerrada el 2026-11-06
      *Comprobación `hooks-subagente` (AVISO, id fijo, origen + ruta + matcher):
      settings de usuario, proyecto y local, y la versión activa de cada plugin
      habilitado (`installed_plugins.json`, `enabledPlugins`, `projectPath`,
      `hooks.json` y `hooks` de `plugin.json`); respeta `disableAllHooks`. Matcher
      con regex anclada y `""`/`*`/ausente cuentan (decisión de Carlos). README con
      «Problemas conocidos», regla en `avance.md`, versión 0.9.0 (publicada en
      0.9.0; tag creado en TASK-089). 2 rondas: MEN-1..5 corregidos; MEN-6 y MEN-7
      aceptados.*

## M — Revisores y roles de dominio (2/2)

Revisores por pares y roles del brainstorm para dominios que el plugin no cubria.

- [x] TASK-079 — Revisor por pares de dominio para Rust y WASM — cerrada el 2026-11-06
      *Skill `rust-wasm-reviewer` (`.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`,
      `.cargo/config.toml`, toolchain/rustfmt/clippy): ownership, errores sin panic,
      limite JS-WASM (llamador TS y `.d.ts` obligatorios si cambia una firma
      exportada), numerica en f64, `unsafe`, rendimiento. Catalogo `skill_6`, tabla
      de revisores en el README, nota de umbral del generico (con cuatro dominios
      ya puede superarse). Version 0.10.0, publicada (tag creado en TASK-089). 2 rondas: MEN-2, 3, 4 y 6
      corregidos (exactitud tecnica de la skill); MEN-1 y MEN-5 aceptados.*
- [x] TASK-080 — Accesibilidad en angular-vue-reviewer y roles de arquitectura y
      rendimiento en plan — cerrada el 2026-11-06
      *`angular-vue-reviewer` revisa accesibilidad por criterio WCAG 2.2 (contraste,
      foco, teclado, ARIA, nombre accesible, dialogos) con severidad escrita;
      `brainstorm-arquitectura` mira limites, dependencias, acoplamiento y ADR. Rol
      condicional `brainstorm-rendimiento` (etiquetas rendimiento/wasm/workers/3d,
      solo con 2+ roles, fuera de la escalera; con 0 o 1, `plan` avisa).
      `planEsPlantilla` lee los roles del disco: la plantilla vacia con rendimiento
      ya no se da por redactada. Publicada en 0.11.0. 2 rondas:
      IMP-1 y MEN-1..5 corregidos; MEN-6 (restos cosmeticos de "cuatro") aceptado.*

---

## N — Mejoras tras las métricas de la 0.8 (10/10)

Abierta el 2026-11-07 tras medir ToolsaWeb con `taskctl metricas` (51 tareas
con la 0.8): calidad estable, pero tokens de revisión casi el doble, ninguna
tarea a la primera y datos incompletos para comparar versiones. Orden y
dependencias en `docs/ROADMAP.md`.

- [x] TASK-081 — Revisión más barata: medir y acotar las lecturas de los revisores — cerrada el 2026-11-07
      *`## Coste` gana las columnas `ronda` y `revisor` (las filas de 9 se siguen
      leyendo); `registrar-coste` escribe una fila por revisor deduciendo ronda y
      revisor de su transcripción, y `metricas --tokens` muestra lecturas y
      CRÍTICO/IMPORTANTE por ronda y revisor. La petición trae `## Contexto
      permitido` (clave `contexto_revision`), la skill común la sección «Lo que
      lees» y el informe sus lecturas fuera de contexto. En ronda 2+ se sugiere un
      modelo un escalón más barato con regla estricta (enmienda de la §16.6).
      Dogfooding: ronda 1 (sonnet) 12,5 M con 14 lecturas; ronda 2 (haiku,
      acotada) 1,97 M: el exceso viene del contexto que acumula el revisor, no de
      leer ficheros. 2 rondas: MEN-1, 2 y 4 corregidos; MEN-3, MEN-5 y dos MENOR
      de r2 (mayúsculas y `..` en `contexto_revision`) aceptados.*
- [x] TASK-082 — Autorrevisión del implementador antes de pedir revisión — cerrada el 2026-11-07
      *La skill `review` manda, antes de `taskctl review` y sin lanzar agente,
      pasar la `## Que se revisa` de cada revisora, corregir lo evidente y anotar
      `## Autorrevision` en `tarea.md` (`- <revisora> — <commit>`, sin juicios).
      `review` avisa sin bloquear si falta con contenido (`core/autorrevision.ts`),
      y `siguiente --json` da `revisores` en la fase review con el mismo
      clasificador, desde la merge base (`fs/revisores-rango.ts`). La lista vive
      solo en cada revisora (ancla unificada en la de C#). Dogfooding: la propia
      autorrevisión sacó un test que faltaba. 1 ronda, aprobada (9 de 10
      mutantes muertos): MEN-1 (el `catch` de `siguiente` sin test) aceptado.*
- [x] TASK-083 — Cierre sin ronda 2 completa cuando solo quedan MENORES — cerrada el 2026-11-07
      *Medido antes de implementar (`docs/METRICAS.md` §13): 33 de 138 rondas 2
      (23,9 %) partían de una ronda 1 sin CRÍTICO ni IMPORTANTE y 0 encontraron
      uno nuevo; por fragmento solo ToolsaWeb TASK-013, cuya ronda no era
      elegible. `alcanceRondaSiguiente` (pura, fail-closed, junto a la regla de
      modelo de TASK-081) y `review` la convierte en completa con `--completa`,
      sin diff de correcciones, con merges o con ficheros no nombrados; la
      acotada va a un solo revisor con instrucciones de verificación, y tras ella
      la completa revisa desde la base. `veredicto` avisa de `cambios-solicitados`
      con solo MENORES. Umbral y salvaguardas, decididos por Carlos. 1 ronda,
      aprobada sin hallazgos (15 de 15 mutantes muertos).*
- [x] TASK-084 — Versión del plugin en cada tarea y métricas por versión — cerrada el 2026-11-07
      *Cada fila de `## Transiciones` lleva como quinta columna la versión de
      taskctl (`src/core/version.ts`, con test de alineación con `package.json` y
      `plugin.json`); las de 4 columnas se siguen leyendo y la primera fila con
      versión amplía solo cabecera y separador. `taskctl metricas --por-version
      [--json]` agrupa las terminadas por la versión del último `finish`, en orden
      semver, con rondas, a la primera, hallazgos por severidad y origen y tokens
      por fase; las sin versión, aparte. Versión subida a 0.12.0 al abrir el ciclo
      (publicada el 2026-11-07). 1 ronda, aprobada: MEN-1 y MEN-2 (dos huecos de test, el
      código es correcto) y MEN-3 (separador con alineación) aceptados.*
- [x] TASK-085 — Coste de implementación registrado automáticamente — cerrada el 2026-11-07
      *Hook en `Stop` y `SubagentStop` que solo anota rutas de transcripción en
      `.git/coste-pendiente.jsonl` (guardas baratas, ningún proceso sin tarea en
      curso, siempre exit 0). `review` suma, en su commit, lo gastado entre el
      `start` y el `review` en la rama y el repo de la tarea (`timestamp`,
      `gitBranch` y `cwd` de cada línea), descontando lo ya anotado (`dif:`);
      `finish` repite como red. Decisiones de Carlos: el hilo principal cuenta,
      volcado en review/finish, las 97 tareas viejas de ToolsaWeb fuera. Probado
      en la propia tarea (+14,3 M de implementación). 2 rondas: MEN-1 y MEN-2
      (tests de la red de finish y del guard de campos negativos) corregidos.*
- [x] TASK-086 — Descontar las pausas de las duraciones de las métricas — cerrada el 2026-11-07
      *Cada racha de `pausa` dura hasta la siguiente transición que no sea
      pausa y se resta de diseño, curso, revisión y `total`; una pausa abierta
      no descuenta y con precisión de día tampoco. `--json` gana la lista
      `pausas` con `enPausa` por tarea; §14 de `docs/METRICAS.md`. Revisión: 2
      rondas (MEN-1, empate de segundo con origen git, y MEN-2, doc, corregidos).*
- [x] TASK-087 — `taskctl doctor` avisa si el plugin instalado está desactualizado — cerrada el 2026-11-07
      *Comprobación `version-plugin` de doctor: compara la versión instalada
      (`installed_plugins.json`) con la copia local del marketplace, sin red.
      Disponible mayor da AVISO con los comandos `claude plugin marketplace
      update` y `claude plugin update`; lo no comprobable es `omitida`; nunca
      error, así que el código de salida no cambia. Dos rondas (MEN-1 y MEN-2
      corregidos, MEN-3 aceptado).*
- [x] TASK-088 — `taskctl doctor` avisa si falta `comando_verificacion` con tests detectables — cerrada el 2026-11-07
      *Sin la clave, `verificacion` da AVISO si la raíz tiene tests detectables
      (`package.json` con `test` propio, Cargo, Maven, Gradle, .NET, Go, pytest) y
      propone el comando (gestor según el lock, wrappers, varios con `&&`); sin
      tests sigue `omitida`. Revisión: 2 rondas, 3 MENOR corregidos, aprobada.*
- [x] TASK-089 — Evitar literales con forma de secreto en el repo y tags de versión que faltan — cerrada el 2026-11-07
      *Las claves falsas de los tests viven troceadas en `test/helpers/claves-falsas.ts`, y
      `test/empaquetado/sin-literales-secretos.test.ts` recorre `git ls-files` con los patrones de
      push protection (sin `\b` delante: una clave tras un `\n` escrito como texto también casa) y
      una lista blanca de tres valores exactos de informes históricos. Tags anotados v0.9.0
      (`df59da2`) y v0.10.0 (`b85f37e`) creados y en origin. Revisión: aprobada en ronda 1, dos
      MENOR aceptados (solo mira lo rastreado; los patrones son un subconjunto de los de GitHub).*
- [x] TASK-090 — El guardián de secretos tolera excepciones solo en su fichero histórico — cerrada el 2026-11-07
      *Fix de TASK-089: GitHub bloqueó el push de develop porque el plan de TASK-089
      citaba entera la clave de ejemplo de Stripe y el guardián la toleraba por valor
      (Carlos la permitió en GitHub, sin reescribir historial). Ahora solo
      `AWS_EJEMPLO` vale en cualquier fichero; Stripe y Slack, como parejas exactas
      fichero+valor de los informes históricos de TASK-066 y TASK-089, y una pareja
      sin uso es rojo. 1 ronda, aprobada, 8 mutantes en rojo; MEN-1 (apariciones sin
      límite en su fichero) y MEN-2 (AWS por valor) aceptados. Publicada en 0.12.0.*

## ✅ O — Verificación selectiva por impacto (1/1)

Pedida por Carlos el 2026-11-09 desde ToolsaWeb, donde la verificación completa ya
tarda unos 40 minutos y se repetía en cada ronda de revisión.

- [x] TASK-091 — Verificación selectiva por impacto en las rondas y completa obligatoria antes de integrar — cerrada el 2026-11-09
      *Clave `comando_verificacion_selectiva` (+ timeout) que recibe la base en
      `RAMA_BASE`; la usan el hook `Stop` y `review`, que la corre antes de escribir
      la ronda (rojo o árbol sucio abortan sin ronda; la petición la cuenta y omite
      la cobertura). La completa sigue siendo la puerta de `finish` y del guardián:
      selectiva sin completa aborta y su memo va aparte. `doctor` avisa si falta.
      Guía `skills/task-workflow/verificacion-selectiva.md`. 5 rondas: las 2 a 4
      por la misma frase del mensaje de `review` (describía un momento, no un
      estado); MEN-1 de la ronda 5 aceptado. Publicada en 0.13.0.*

## ⏳ P — Agilidad sin perder calidad (14/19)

Pedidas por Carlos el 2026-11-10 desde ToolsaWeb (TASK-295), donde la 0.13 ha
hecho perder agilidad: la verificación completa se repite por causas que no son
del código.

- [x] TASK-092 — Sincronización de ficheros sueltos de la raíz de tareas/ — cerrada el 2026-11-10
      *`rutas_sincronizacion` admite un fichero directamente en `tareas/` (p. ej.
      `tareas/ROADMAP.md`), que se regenera en el commit de cada transición; siguen
      cerradas las carpetas de estado, cualquier subcarpeta, `.taskcode/` y `.git/`,
      ahora sin distinguir mayúsculas ni puntos/espacios finales. `informe_cobertura`
      no cambia. Cambió la expectativa del caso `tareas/x.md` (aprobado por la
      persona en el plan). 1 ronda, aprobada sin hallazgos, 7 mutantes detectados.
      Pendiente de publicar en 0.14.0.*
- [x] TASK-095 — Revisión que converge: desde la ronda 2 solo se verifican las correcciones — cerrada el 2026-11-10
      *Corrige la regla de TASK-083 (un IMPORTANTE en cualquier estado, también corregido,
      relanzaba una ronda completa desde la base: hasta 14 rondas). Desde la ronda 2 la
      ronda es acotada: cada revisor verifica sus pendientes (todo salvo aceptado), los
      dominios que toca la corrección también la ven, y solo se abren hallazgos nuevos
      CRÍTICOS o causados por la corrección; completa solo con --completa, sin commit
      revisado fiable o con informes ilegibles. Tope: siguiente pregunta en cualquier modo
      y review exige --ronda-extra para la ronda 4. No se retira ningún revisor. 2 rondas:
      6 MENOR en la 1 (MEN-4 y parte de MEN-5 aceptados), aprobada en la 2. Pendiente de
      publicar en 0.14.0.*
- [x] TASK-097 — Regla de una hora: plan estima la duración de punta a punta y propone trocear — cerrada el 2026-11-10
- [x] TASK-098 — ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes — cerrada el 2026-11-10
- [x] TASK-100 — Verificación proporcional A1: finish no corre la suite si la tarea solo cambia documentación — cerrada el 2026-11-10
- [x] TASK-101 — Verificación proporcional A2: el guardián de merges — cerrada el 2026-11-10
- [x] TASK-102 — Verificación proporcional A3a: el freno Stop no corre la suite si solo cambia documentación — cerrada el 2026-11-11
- [x] TASK-104 — Verificación proporcional A3b: las rondas de review no corren la suite si solo cambia documentación — cerrada el 2026-11-11
- [x] TASK-103 — Guardián de merges: config inválida bloquea y merges que hoy no detecta — cerrada el 2026-11-11
- [x] TASK-096 — Verificación proporcional B1: clave `rutas_verificacion_parcial` y decisión `selectiva` en core — cerrada el 2026-11-11
      *Troceada en el plan por la regla de una hora (270 min; decisión de Carlos): B1 es esta, el
      resto son TASK-105 a TASK-109. Clave opt-in leída de la base (lista de rutas permitidas, exige
      la selectiva) y tercer resultado de la decisión pura; nada observable cambia todavía. Decisión
      sobre TASK-091 escrita en el plan: la completa sigue por defecto y el guardián no acepta la
      selectiva para código. 2 rondas: 3 MENOR en la 1, corregidos; aprobada en la 2. No se publica
      versión hasta cerrar TASK-109.*
- [x] TASK-105 — Verificación proporcional B2: decisión entre refs y huella para el nivel 2 — cerrada el 2026-11-11
      *La decisión entre refs calcula fueraDeParcial con un git diff extra (solo la lista excluida, SHA
      fijados antes) cuando la base declara la clave y hay código; sin ella, cero procesos de más.
      huellaDeCommit acepta contexto y comparte cabecera con huellaDelArbol. Decisiones de Carlos: el memo
      selectiva no se guarda con el árbol sucio (el Stop sucio la repite; medir en ToolsaWeb antes de B3),
      se mantiene la salida temprana sin rutas_documentacion, y el guardián y finish tratan selectiva como
      completa con motivo neutro (cierra el hueco del guardián). 1 ronda: aprobada, 2 MENOR aceptados.*
- [x] TASK-106 — Verificación proporcional B3: finish verifica solo lo afectado con código parcial — cerrada el 2026-11-11
      *Con rutas_verificacion_parcial en la base y todo el código dentro, finish corre la selectiva (RAMA_BASE,
      su timeout) en vez de la completa, lo dice y lo anota tras el verde en «Verificacion parcial». Decisiones
      de Carlos: reutiliza solo un memo selectivo verde del mismo commit (excepción acotada a TASK-072), el hotfix
      nunca usa la selectiva pero conserva su camino de documentación, una sola tarea de ~70 min. Cobertura
      omitida en el nivel 2; release a la completa. 2 rondas: IMP-1 y 3 MENOR corregidos, ronda 2 aprobada.*
- [x] TASK-107 — Verificación proporcional B4: Stop, review y finish deciden igual el mismo diff — cerrada el 2026-11-11
      *Solo tests: una tabla (documentación, parcial, transversal) × (Stop, review, finish) con el vector absoluto
      de ejecuciones por celda, 9 repos reales (decisión de Carlos). Sin divergencia: producción intacta. Stop y
      review corren la selectiva ante lo transversal y finish la completa (divergencia acordada, fijada en la tabla).
      4 mutantes propios y 4 del revisor, cada uno rojo en su celda. 1 ronda: aprobada, 2 MENOR aceptados.*
- [x] TASK-108 — Verificación proporcional B5: el guardián de merges ante el nivel 2 — cerrada el 2026-11-11
      *D1 ya estaba en el código desde TASK-105: con código el guardián exige siempre la completa y nunca lee el
      memo selectivo. La tarea lo fija con 6 tests y añade al bloqueo una línea que dice qué hace falta y cómo
      integrar (finish, nunca «corre la completa y repite»); release y hotfix sin ella. Decisiones de Carlos: el
      criterio 2 acotado a la decisión 6b, el corte por tiempo a una tarea aparte. 2 rondas: 2 MENOR corregidos,
      1 aceptado, ronda 2 aprobada.*
- [x] TASK-109 — Verificación proporcional B6: documentación y limpieza del nivel 2 — cerrada el 2026-11-12
      *Cierra TASK-096. Guía, SKILL.md, README y CHANGELOG explican el nivel 2 (prueba de contrato que se pone
      roja si se borra la sección); ejemplo propio por clave en el error de config; doctor avisa si
      rutas_verificacion_parcial no tiene efecto. Inventario: nada que borrar. 2 rondas: IMP-1 (la cobertura no
      se mide en el release) e IMP-2 (tras un conflicto, cerrarlo en develop deja un finish que no verifica,
      también en el mensaje del guardián) corregidos, ronda 2 aprobada.*
- [x] TASK-110 — Progreso visible sin tokens: estado de cada fase en el terminal — cerrada el 2026-11-12
      *Fichero de progreso bajo .git/taskcode/, `taskctl estado` (via rapida, 143 ms), status line instalable por
      doctor en el settings.json de usuario (con el taskctl de la cache si no esta en el PATH, y solo si entiende
      `estado`), progreso en plan/approve/start/review/finish y el freno Stop sin anadir salida (cero tokens),
      contador TASKCTL_PROGRESO, reporter [x/N] de npm test y `--seguir`. Sin trocear (decision de Carlos). Paso S:
      la status line se ve en la app de escritorio y por Remote Control. 1 ronda: IMP-1 y 5 MENOR corregidos, 2
      aceptados; cerrada sin ronda 2 por decision de Carlos (modo rapido).*
- [x] TASK-122 — Coste por tarea independiente del tamaño del proyecto — cerrada el 2026-11-12
      *Verificacion por impacto en TaskCode (14 s un modulo, 70 s la rama; antes ~25 min), metricas --evolucion con
      el coste fijo y su tendencia, informe de escala y perfil de la suite, regla de la piramide. Modo rapido: plan
      sin brainstorm, 1 ronda (3 IMP y 6 MENOR corregidos), cerrada sin ronda 2 y con --sin-verificacion por
      decision de Carlos.*
- [x] TASK-123 — F-16: finish no cierra sin verificar tras un merge a mano o un conflicto — cerrada el 2026-11-12
      *CRITICO de la auditoria: el reintento de finish verifica la rama de integracion (decision proporcional y
      memo) y el guardian bloquea el commit que cierra un merge en curso en develop/main; remedio seguro en
      mensajes y guia. Los dos casos reproducidos son tests de regresion. Arregla tambien que verificar-impacto
      pasaba RAMA_BASE a los tests. 1 ronda: 2 IMP corregidos, 2 MEN aceptados; cerrada sin ronda 2 y con
      --sin-verificacion por decision de Carlos.*
- [x] TASK-121 — Troceo de tareas de más de 60 min como pregunta: subtareas TASK-NNNa, b, c en la misma rama — cerrada el 2026-11-12
      *taskctl trocear pasa la tarea a TASK-NNNa y crea b, c... en 00-planificadas con la misma rama y el
      ROADMAP regenerado; siguiente pregunta con dos salidas en cualquier modo; IDs con letra en todo el CLI;
      start de una parte trae la base a la rama compartida. Carlos la aprobo entera (150 min). 1 ronda:
      aprobada, 6 MEN corregidos (MEN-5 en parte) y 4 mutantes muertos; suite completa con solo los 3 rojos
      de Windows, cerrada con --sin-verificacion.*
- [ ] TASK-099 — Corrección de MENORES tras aprobar con correcciones sin abrir otra ronda completa
  (para la 0.15.0; no se empieza hasta medir al menos 10 tareas con la 0.14.0, decisión de Carlos)

Retiradas el 2026-11-10 tras medir 147 tareas de ToolsaWeb y OpenDockTrading (decisión
de Carlos: el tiempo se va en rondas que no convergen y en verificar lo que no cambió,
y seguir añadiendo parches empeora el plugin). Principio que guía la fase: el coste de
revisar y verificar crece con el tamaño del cambio, no con el del proyecto.
- ~~TASK-093 — finish reutiliza la completa en verde del mismo árbol~~: poco valor (con
  selectiva declarada el freno no guarda el verde de la completa) y riesgo de falsos verdes.
- ~~TASK-094 — Cerrojo de verificación~~: síntoma de lanzar demasiadas verificaciones;
  ToolsaWeb ya lo resuelve en su comando. TASK-096 ataca la causa.
