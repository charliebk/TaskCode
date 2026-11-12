# Peticion de revision — TASK-124 (ronda 1)

- Tarea: TASK-124 — Contexto con tamano maximo: lo que leen los agentes no crece con el proyecto
- Rama revisada: feature/task-124-contexto-con-tamano-maximo-lo-que-leen-l
- Rama base: develop
- Commit revisado (HEAD): edf10933a5b50366574199266eabc7a594f20e45
- Fecha: 2026-11-12
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-124 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-124/tarea.md
- tareas/03-en-revision/TASK-124/planificacion/
- .taskcode/config.yml
- docs/contexto/CHECKLIST_TERMINACION.md
- docs/contexto/CONVENCIONES.md
- docs/contexto/ESTADO.md
- docs/contexto/README.md
- docs/contexto/archivo/CHECKLIST-fases-cerradas.md
- docs/contexto/archivo/ESTADO-hasta-2026-11-12.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/cierre-y-release.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/instalacion-y-distribucion.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/problemas-conocidos.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/documento-estado.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-documento-estado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/config-documento-estado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/documento-estado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/readme.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts

## Commits a revisar (git log develop..HEAD)

````
edf1093 feat(TASK-124): contexto con tamano maximo: topes, README partido, archivo de CHECKLIST y ESTADO, doctor vigila documento_estado
d6e5163 chore(TASK-124): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/.taskcode/config.yml b/.taskcode/config.yml
index 6a18325..e79b4c0 100644
--- a/.taskcode/config.yml
+++ b/.taskcode/config.yml
@@ -8,3 +8,7 @@ timeout_verificacion: 1800
 comando_verificacion_selectiva: "node scripts/verificar-impacto.mjs"
 rutas_documentacion: [docs/**, "*.md"]
 rutas_verificacion_parcial: [taskcode-marketplace/plugins/taskcode-plugin/src/**, taskcode-marketplace/plugins/taskcode-plugin/test/**, taskcode-marketplace/plugins/taskcode-plugin/dist/src/**]
+
+# TASK-124: doctor avisa si el documento de estado lleva mas de 14 dias sin
+# commits o va por detras de las tareas terminadas.
+documento_estado: docs/contexto/ESTADO.md
diff --git a/docs/contexto/CHECKLIST_TERMINACION.md b/docs/contexto/CHECKLIST_TERMINACION.md
index 6796937..d7bd450 100644
--- a/docs/contexto/CHECKLIST_TERMINACION.md
+++ b/docs/contexto/CHECKLIST_TERMINACION.md
@@ -10,7 +10,7 @@
 > contadores de la tabla de abajo, y se muestra el checklist actualizado en la
 > respuesta. Ver `CONVENCIONES.md`.
 
-**Progreso global: 116 / 117 items terminados (99%)** · última actualización: 2026-11-11
+**Progreso global: 120 / 121 items terminados (99%)** · última actualización: 2026-11-12
 
 Desde el 2026-10-04 se suma la fase G (urgente, pedida por Carlos): el
 plugin conduce el ciclo con fases invocables y modos manual, semiautomatico y
@@ -43,1079 +43,20 @@ tomada y documentada, no aplazada.
 | ⏳ P — Agilidad sin perder calidad | 20 | **19** | — |
 | **Total pendiente** | **1** | — | — |
 
----
-
-## ✅ Ya terminado (12/12)
-
-- [x] TASK-001 — Scaffold del proyecto (`plugin.json`, `bin/`, tsconfig, runner de tests)
-- [x] TASK-002 — Modelo de tarea + parser de `tarea.md` + máquina de estados
-- [x] TASK-003 — `taskctl new`
-- [x] TASK-004 — `taskctl import`
-- [x] TASK-005 — `taskctl board`
-- [x] TASK-006 — Empaquetado del plugin y validación de carga local
-- [x] TASK-007 — Spike: scripts Git-Flow vía Bash tool
-- [x] TASK-008 — Migrar scripts Git-Flow a `scripts/gitflow/`
-- [x] TASK-009 — `taskctl start`
-- [x] TASK-010 — `taskctl plan` (versión mínima)
-- [x] TASK-011 — `taskctl approve`
-- [x] TASK-012 — Precondición de rama base + workspace limpio (§8.3, pasos 1-4)
-
----
-
-## ✅ Fase A — Desbloquear (3/3) · completada el 2026-09-05
-
-Nada de esto es funcionalidad nueva: es quitar de en medio lo que hace
-frágil o ciego todo lo demás.
-
-- [x] **A1** · Remoto en GitHub + `marketplace.json` (TASK-021 adelantada)
-      *`github.com/charliebk/TaskCode` (privado), 11 ramas subidas, `develop`
-      por defecto, tag y release `v0.1.0` publicados. `marketplace.json`
-      contra el schema oficial, sin `relevance` (ver decisión #12). Extra no
-      planificado: README en la raíz y CI en GitHub Actions.*
-- [x] **A2** · Crear TASK-013…TASK-023 como carpetas reales con `taskctl import`
-      *Las 11 creadas con los IDs alineados con `PLAN_SPRINTS.md`. Dos
-      hallazgos de dogfooding: `import` aplica los mismos flags a todas las
-      entradas y no sabe expresar `dependencias` (hubo que ajustar el
-      frontmatter a mano), y no se puede ejecutar dos veces seguidas porque
-      ensucia el workspace que su propio guard de §8.3 exige limpio.*
-- [x] **A3** · Poner `docs/METRICAS.md` al día (TASK-004 → TASK-012)
-      *Cubre las 12 tareas con agregados nuevos: 50 hallazgos de revisión en
-      9 rondas (5 críticos, 18 importantes, 27 menores), 84% corregidos y
-      ningún crítico ni importante abierto. De paso se corrigieron dos
-      recuentos de tests mal anotados en `PLAN_SPRINTS.md`.*
-
-## ✅ Fase B — Cerrar el ciclo de vida (7/7) · completada el 2026-09-05
-
-**Este es el hito real de usabilidad.** Al terminar la Fase B el sistema se
-puede usar a diario de punta a punta; todo lo posterior mejora la calidad
-del proceso, no lo habilita.
-
-- [x] **B1** · TASK-013 — `taskctl review` (`update-<tipo>.sh` + un agente revisor) — ~5h
-      *Cerrado el 2026-09-05. Primera tarea gestionada por su propio ciclo
-      (plan → approve → start → review, dogfooding completo, incluida la
-      peticion de revision que uso el revisor por pares). El CLI hace lo
-      determinista (update verificado con merge-base, mover a
-      03-en-revision, peticion con el diff real + scaffold de informe) y el
-      agente lo dispara el orquestador — decision registrada en el plan.
-      Revision: 2 importantes y 2 menores corregidos, 1 menor documentado.
-      11 tests reales nuevos (247 en total).*
-- [x] **B2** · Corregir el bug de `origin` en `merge-hotfix-to-main.sh` y `merge-release-to-main.sh` — ~1h
-      *Cerrado el 2026-09-05 (rama `fix/b2-guard-origin-merge-main`, merge
-      `--no-ff` a develop). Guard de TASK-008 extraído a
-      `detect_origin_available` y aplicado a ambos scripts; la revisión por
-      pares añadió dos correcciones: origin configurado pero inaccesible
-      ABORTA (no es lo mismo que operar sin remoto: el tag caería sobre una
-      `main` obsoleta), y la rama de trabajo se valida antes de tocar la
-      principal. 10 tests reales nuevos (repos temporales + bare como
-      origin); verificado que fallan sin el fix. De propina: guard en
-      `smoke-test.sh` que evita un `git init` destructivo si mktemp falla.*
-- [x] **B3** · TASK-014 — `taskctl finish` (merge, backmerge, tag) — ~5h
-      *Cerrado el 2026-09-05 con su propio comando (finish mergeó su propia
-      tarea: primer cierre de punta a punta del método). Aprobación leída
-      del veredicto del informe (parser fail-closed endurecido: la revisión
-      pilló que aprobaba <no aprobada>), colisión de IDs resuelta con dos
-      discriminadores (título distinto y linaje sin ancestro común), camino
-      idempotente de reintento tras conflicto de backmerge, y CHANGELOG,
-      INDEX y BOARD renderizados desde el frontmatter. 1 crítico + 2
-      importantes + 4 menores de revisión, los 7 corregidos. 19 tests
-      nuevos (266). De propina cubre la mitad de B4: los tres ficheros los
-      crea finish si no existen.*
-
-- [x] **B4** · Crear `CHANGELOG.md`, `INDEX.md` y `BOARD.md` — ~1h
-      *Los tres los creó `taskctl finish` al cerrar TASK-014 (B3). B4 añadió
-      el histórico que faltaba: las 12 tareas de Sprint 0 y 1 en CHANGELOG e
-      INDEX, compuestas leyendo sus `tarea.md` reales, apuntando a su ruta
-      real en `00-planificadas` (siguen ahí por la paradoja de
-      bootstrapping, E4). De paso quedó por escrito que TASK-001, 002 y 003
-      declaran una `rama` que no existe en Git.*
-
-- [x] **B5** · Resolver la divergencia de `board` — ~1h
-      *Resuelta a favor de la metodología: `taskctl board --escribir`
-      regenera `docs/BOARD.md`; sin el flag sigue siendo de solo lectura,
-      porque escribir siempre ensuciaría el workspace y dispararía el guard
-      de §8.3 en el siguiente comando. El formato del fichero vive ahora en
-      un único sitio (`renderBoardMarkdown`), compartido con `finish`, y las
-      tablas van en vallas de código. La divergencia residual (§8 no
-      menciona flags) queda documentada en HALLAZGOS, sin tocar la
-      metodología congelada. Revisión: 3 importantes y 2 menores corregidos
-      (orden no determinista de avisos que hacía el fichero irreproducible,
-      tablero fantasma fuera de la raíz del repo, errores de escritura mal
-      etiquetados), 1 menor documentado. 9 tests nuevos (275).*      *La metodología dice "regenera `docs/BOARD.md`"; lo implementado es un listado por pantalla. Decidir en qué sentido se corrige.*
-- [x] **B6** · Añadir `--asignado-a` a `plan` y `start` — ~2h
-      *Cerrado el 2026-09-05 (rama `feature/b6-asignado-a-en-plan-y-start`,
-      merge `--no-ff` a develop). `parseAsignadoAFlag` vive en un módulo
-      compartido para que los comandos no diverjan; sin el flag se
-      **conserva** el `asignado_a` que hubiera, así que `start` hereda lo que
-      dejó `plan` (§8.2). Rechaza el flag suelto (asignaría a una persona
-      llamada "true"), el valor vacío, los saltos de línea y los valores de
-      más de 64 caracteres. `plan` y `start` leen ya el ID de los
-      posicionales, así que el flag funciona también delante del ID.
-      Revisión por pares: 1 IMPORTANTE y 5 MENORES; corregidos el
-      IMPORTANTE (`board --asignado-a` se ignoraba en silencio y devolvía
-      **el tablero entero** con código 0 — el mismo fallo que justificaba el
-      alias, sin cerrar el otro lado) y 3 menores; 2 documentados en
-      HALLAZGOS. El revisor verificó por mutación que los 6 tests clave se
-      ponen rojos al revertir lo que dicen probar. 32 tests reales nuevos
-      (307).*
-- [x] **B7** · TASK-015 — Límite de WIP por persona (§8.2) — ~3h
-      *Cerrado el 2026-09-05, gestionado de punta a punta con la propia
-      herramienta y estrenando el `--asignado-a` de B6. Un **único** límite
-      y solo de ejecución (decisión #13): `plan` no comprueba nada, `start`
-      aborta si la persona asignada ya tiene otra en `02-en-curso` **o** en
-      `03-en-revision` — el hueco no se libera hasta `finish` porque la rama
-      sigue viva y es donde se commitean las correcciones de la revisión.
-      **Diverge de la §8.2** (dos límites independientes, uno sobre el
-      diseño): es la mayor divergencia del proyecto y queda documentada en
-      HALLAZGOS. Revisión por pares con 16 casos de ataque y 8 mutaciones:
-      1 IMPORTANTE (la divergencia sin documentar) y 6 MENORES; corregidos
-      6, documentado 1 (el límite es opt-in, y `carlos` y `charlie.bk` son
-      la misma persona con dos grafías — normalizar identidades es material
-      de C4). 38 tests reales nuevos (345).*
-
-## Fase C — Tapar huecos (5/8) · ~15h
-
-Lo que la metodología da por hecho y no existe.
-
-- [x] **C1** · TASK-026 — Wrappers `taskctl diagnose` / `pause` / `resume` / `recover` / `abort-merge` — ~3h
-      *Cerrado el 2026-09-06. El nudo no era enrutar a `bash`: cuatro de
-      los cinco scripts preguntan con `read -rp`, y con EOF `pause` moría
-      con "Opcion no reconocida" y `abort-merge` no abortaba nada saliendo
-      con 0. Regla nueva del proyecto: **stdin heredado solo cuando hay
-      terminal**, ignorado cuando no la hay, y guard que corta antes de
-      invocar si el valor por defecto haría lo contrario de lo que dice el
-      comando. La §8.3 ya nombra `taskctl pause` en su mensaje, que era la
-      premisa de la tarea. Dos rondas de revisión: **APROBADO CON CAMBIOS**
-      (2 importantes, 7 menores) y **APROBADO** (3 menores). Los dos
-      importantes: `pause` preguntaba igual con el workspace limpio porque
-      los scripts se escriben el registro dentro del repo, y heredar stdin
-      siempre **colgaba el comando para siempre** ante una tubería abierta.
-      27 tests nuevos (417).*
-- [x] **C2** · Paso 5 de §8.3: `taskctl` comitea; sube solo con `--push` — ~3h
-      ***Divergencia con la §8.3, deliberada***: *el paso 5 pide tambien
-      subir. Se acepta la perdida —una tarea nueva no llega al equipo sola—
-      a cambio de que publicar sea un acto consciente.*
-      *Cerrado el 2026-09-07 (TASK-030, junto con C4 en la misma rama: el
-      limite de WIP es 1 y lo aplica `start`, asi que dos tareas simultaneas
-      habrian hecho abortar la segunda). `taskctl` commitea las rutas que
-      escribe **una a una**, y en ningun sitio hay un `add -A` sin pathspec.
-      Al cablearlo **se cayeron 14 tests existentes**, que era la senal que el
-      plan pedia vigilar: casi todos hacian `git add -A && git commit` a mano
-      para sortear el workspace sucio, o sea que documentaban el defecto que
-      esto quita. Se les quito el commit manual en vez de hacerlos tolerantes.
-      El plan estaba a medias equivocado sobre por que hace falta la regla:
-      `start`/`review`/`finish` **si** comprueban el workspace; lo que la
-      justifica es la ventana entre esa comprobacion y el commit, donde puede
-      escribir otro proceso — que aqui es el caso normal, con varios agentes
-      sobre la misma copia. Dos rondas: **cambios-solicitados** (2
-      importantes) y **APROBADA**. El importante que mas ensena: la lista de
-      ficheros se calculaba antes del commit, asi que con un hook de
-      pre-commit el CLI decia "1 fichero" con 2 registrados — en el unico
-      escenario donde la regla se rompe, la herramienta afirmaba lo
-      contrario.*
-      *Decisión abierta + implementación. Sin esto, una tarea nueva no llega
-      al equipo sola. **Evidencia nueva (A2)**: sin el paso 5, `taskctl
-      import` no se puede ejecutar dos veces seguidas — crea las carpetas que
-      luego bloquean su propia siguiente invocación.*
-- [x] **C3** · TASK-027 — Subcarpetas `planificacion/` y `revision/` en cada carpeta de tarea — ~1h
-      *Cerrado el 2026-09-06. `taskctl plan` crea `planificacion/` y escribe
-      ahí el scaffold de `plan-final.md`, que es la ubicación canónica según
-      la sección 2 de la metodología; `revision/` ya la creaba `review`
-      desde B1. **El nudo no era la ruta nueva, era el legado**: `approve`
-      sigue aceptando el plan suelto en la raíz —una tarea planificada con
-      la versión anterior del CLI no se queda sin poder aprobarse— y una
-      re-planificación lo **migra** a `planificacion/` con `rename`,
-      conservando el contenido en vez de pisarlo con el scaffold, y lo dice
-      en la salida. Si aparecen los dos a la vez (legado + canónico), tanto
-      `plan` como `approve` **fallan cerrado** sin tocar nada, en vez de
-      elegir por su cuenta cuál gana. Las 6 tareas ya cerradas en
-      `04-terminadas/` (TASK-013, 014, 015, 024, 025 y 026) se migraron con
-      `git mv` — rename puro, 0 líneas cambiadas —, así que **ya no queda
-      ningún `plan-final.md` suelto en el repo**. Revisión por pares ronda
-      1: **APROBADO CON CAMBIOS** (1 importante, 4 menores), sobre un clon
-      con smoke test propio y 7 mutantes. El importante: la reestructuración
-      había dejado sin cobertura una protección contra pérdida de datos que
-      `develop` sí tenía, demostrado ejecutando el mismo mutante en las dos
-      ramas. Aplicados todos salvo la parte (a) del hallazgo #4 —el `rename`
-      de la migración no tiene un equivalente exclusivo del flag `'wx'`
-      porque POSIX no lo ofrece—, documentada sin corregir. 8 tests nuevos
-      (429; 426 verdes y los 3 rojos conocidos de este entorno Windows).
-      Dos rondas de revisión: **APROBADO CON CAMBIOS** (1 importante, 4 menores) y **cambios solicitados → APROBADA** (1 importante, 3 menores). El importante de la ronda 2: el fix de la ronda 1 era un fix solo de Windows —en POSIX el `stat` falla antes con `ENOTDIR`— y el test escrito para certificarlo habría caído en el job `ubuntu-latest`.*
-- [x] **C4** · `.taskcode/config.yml` — ~3h
-      *Cerrado el 2026-09-07 (TASK-030). Tres claves opcionales: `rama_base`
-      (unico hardcode indetectable), `agente_revisor_por_defecto` (que ademas
-      estaba duplicado en `new.ts` e `import.ts`) y `limite_wip`. Sin fichero,
-      comportamiento identico al de hoy. **Un solo parser**: el bucle
-      `clave: valor` de `frontmatter.ts` se extrajo en vez de escribir un
-      segundo YAML a mano — y ahi aparecio que el parser NO soportaba
-      comentarios de linea entera, solo inline, asi que se anadieron opt-in
-      para no cambiar en silencio lo que acepta `tarea.md`. La revision
-      encontro que **`limite_wip` era la unica clave sin prueba de cableado**:
-      se habia verificado a mano con el CLI y deshacer la linea de `start.ts`
-      no rompia ningun test. Y un menor con reencuentro: un `.taskcode` que es
-      un fichero caia al default **en silencio en Windows** (`ENOENT`, no
-      `ENOTDIR`) — la misma trampa de TASK-027, resuelta preguntandole al
-      sistema de ficheros y no al errno.*
-- [x] **C5** · TASK-028 — `skills/task-workflow/SKILL.md`, la primera skill del plugin — ~1h
-      *Cerrado el 2026-09-07. El plugin ya expone una skill a Claude Code —
-      `taskcode-plugin:task-workflow`, 272 líneas—; antes no exponía
-      ninguna. **El fichero es corto y el riesgo estaba entero en el
-      contenido**: un agente se cree lo que lee en una skill, así que un flag
-      inventado no es una errata, es una fuente de errores *con autoridad*.
-      Por eso la superficie del CLI se extrajo del **código** (`cli.ts`,
-      `state-machine.ts`, `wip.ts`, `git.ts`) y no del README ni de la
-      metodología, que en tres puntos ya no la describen. Las tres
-      divergencias detectadas y **no** heredadas: `taskctl codex-review` no
-      existe pese a estar en la máquina de estados y en la tabla de la §8
-      —y `revision_codex: true` deja la tarea imposible de cerrar—, el guard
-      de §8.3 solo lo aplican 4 de los 8 comandos, y `plan` no es
-      multi-agente. Frontmatter con solo `name` y `description`: la
-      intersección entre lo que acepta Claude Code y lo que admite el spec
-      portable. La skill viaja a otros proyectos, así que no lleva nada de
-      este repo dentro (el revisor buscó 20 marcas: cero coincidencias). Lo
-      que queda en `HALLAZGOS.md` es el test que casi nace invertido: `claude
-      plugin validate` solo nombra las skills que **fallan**, de modo que
-      aseverar sobre su salida habría pasado justo con la skill rota; la
-      prueba correcta es la contraprueba sobre una copia con el frontmatter
-      roto. Dos rondas de revisión: **cambios solicitados** (1 importante, 5
-      menores, todos corregidos) y **APROBADA**. El importante: `CLAUDE.md`
-      decía 429 tests y en esta rama son 444 — mergearlo así habría
-      reproducido el defecto que la propia corrección venía a arreglar. 15
-      tests nuevos (444; 441 verdes y los 3 rojos conocidos de este entorno
-      Windows). La ronda 2 dejó además un menor documentado sin corregir, que
-      se registra como item propio: **E6**, la distribución del CLI.*
-- [x] **C6** · Bug de `origin` en `create-develop.sh`, `recover-branch.sh`, `resume-work.sh` — ~5h
-      *Cerrado el 2026-09-07 (TASK-029). El item nacio siendo solo el bug de
-      `origin` y C1 le anadio tres frentes mas: los ~1h de la estimacion
-      original eran de entonces. Cuatro agentes en paralelo dentro de la
-      misma rama, con propiedad exclusiva de ficheros. La respuesta al bug de
-      `origin` resulto ser **distinta por script**: `create-develop` aborta
-      con origin caido, `recover-branch` falla siempre sin remoto (su
-      proposito entero es traerse una rama de ahi) y `resume-work` no aborta
-      nunca. El registro se muda a `.git/taskcode/gitflow/`, lo que deja sin
-      motivo al segundo guard de `taskctl pause` y se lleva por delante
-      `isIgnored`. Dos afirmaciones del plan resultaron falsas al medirlas:
-      `create-hotfix`/`create-release` no usan la funcion compartida (deuda
-      viva), y `CHERRY_PICK_HEAD`+`REVERT_HEAD` no bastaban — falta
-      `.git/sequencer/`. Dos rondas: **cambios-solicitados** (2 importantes,
-      5 menores) y **APROBADA** (2 menores). Lo que queda en `HALLAZGOS.md`
-      es que mi primer arreglo de un importante era falso: use "comparar HEAD
-      antes y despues" como discriminante y en un cherry-pick de un solo
-      commit HEAD tampoco se mueve, asi que daba el mensaje del caso raro en
-      el caso normal. Lo destapo probar el caso que daba por bueno. 31 tests
-      nuevos (472; 469 verdes y los 3 rojos conocidos de Windows).*
-- [x] **C7** · TASK-024 — `asignado_a` por defecto desde la identidad Git — ~2h
-      *Cerrado el 2026-09-05. Precedencia: `--asignado-a` > `asignado_a`
-      previo > `git config user.email` > `null`; que el previo gane a la
-      identidad evita el robo silencioso de tareas ajenas. Migradas 12
-      tareas a `charlie.bk@gmail.com`. Revisión por pares: **1 CRÍTICO**,
-      4 importantes y 3 menores, todos corregidos. El crítico: la identidad
-      Git esquivaba la validación del flag, y un `user.email` con un salto
-      de línea **inyectaba una clave que pisaba `estado`** y dejaba la tarea
-      ladrillada, con exit 0 y sin aviso. **Ojo**: esta tarea NO hace
-      efectivo el límite de WIP, contra lo que decía su plan — rellenar
-      `asignado_a` es necesario pero no suficiente (ver C8). 24 tests
-      nuevos (369).*
-- [x] **C8** · TASK-025 — El límite de WIP mira las ramas de trabajo — ~3h
-      *Cerrado el 2026-09-06. El límite de B7 **no protegía nada**: leía el
-      árbol de la rama activa, y el paso a `02-en-curso` se commitea en la
-      rama de la tarea mientras `plan`/`new` devuelven el repo a `develop`.
-      Ahora pregunta si la persona tiene una **rama de trabajo abierta**
-      (local, sin mergear), leyendo el `tarea.md` de cada una con
-      `git show`. Verificado en el flujo real, que es lo que le faltó a B7.
-      El smoke test destapó un fallo antes que la revisión (en un clon,
-      `main` solo existe como remota). **Revisión: RECHAZADO** en la
-      primera ronda — 1 CRÍTICO, 2 importantes y 4 menores. El crítico:
-      para un `hotfix` las referencias dejaban fuera a `develop`, así que
-      **18 ramas ya cerradas** contaban como abiertas y el camino urgente
-      quedaba inutilizable, acusando a tareas terminadas y proponiendo un
-      remedio imposible. Todos corregidos. 20 tests nuevos (387).*
-
-## ✅ Fase D — Inteligencia del proceso (6/6) · completada el 2026-09-13 · ~35h
-
-La fase cara y la única genuinamente opcional: el sistema ya funciona sin
-ella, con un revisor genérico y un `plan` de un solo agente. **D6 y D7 están
-hechos** (TASK-032): el plugin ya expone cinco skills y cuatro agentes, y
-existe la heurística que D1 y D2 van a consumir como lookup.
-
-- [x] **D1** · TASK-016 — Brainstorm paralelo por roles + agente unificador — hecho el 2026-09-08
-      *`taskctl plan` deja de ser un scaffold de un fichero y pasa a orquestar el
-      brainstorm: resuelve sin LLM cuántos roles entran y cuáles, y escribe una
-      petición por rol con su contexto acotado más la del unificador. El CLI
-      sigue sin invocar ningún modelo — mismo reparto que `review` desde
-      TASK-013. Estrena el YML de D7, que hasta hoy no leía nadie desde `src/`,
-      y añade el quinto agente (`brainstorm-unificador`). **116 tests nuevos**
-      (630 → 746). Dos decisiones con Carlos: el número de roles es
-      `max(declarado, heurístico)` topado por hotfix (diverge de la §5 del YML,
-      que manda consultar a un modelo barato, y el CLI no puede), y se
-      implementa la decisión #1 — **el checkpoint humano pasa a ser obligatorio
-      para las cinco complejidades**, así que `TRIVIAL_SIN_APROBACION` se vacía.
-      Puerta nueva: `plan` aborta si el `## Objetivo` está vacío y hay algún rol
-      que lanzar.*
-      ***La revisión por pares fue la más dura del proyecto: 5 rondas, 6
-      revisores independientes, 8 CRÍTICOS.** Y el hallazgo que más vale está en
-      `HALLAZGOS.md`: el mismo CRÍTICO se arregló cuatro veces, y los cuatro
-      arreglos eran correctos para el caso que tenían delante — lo que fallaba
-      era el modelo del estado de una carpeta. Ninguno de los ocho se encontró
-      leyendo el diff; todos salieron de montar el estado a mano y ejecutar el
-      binario. Medido de paso: la heurística solo cambia el número de agentes en
-      4 de las 32 tareas, y las 7 que quedan pendientes tienen el objetivo
-      vacío, así que la puerta nueva las bloquea hasta redactarlo.*
-- [x] **D2** · TASK-017 — Catálogo de skills determinista + selección en dos pasos — hecho el 2026-09-09
-      *Los `patrones_archivo` de los cuatro revisores ya están declarados en
-      cada `SKILL.md`, en lista inline para que el parser del repo los lea tal
-      cual. El catálogo debería recogerlos, no reinventarlos.*
-      ***5 rondas de revisión por pares (la 2 en dos pasadas independientes),
-      35 hallazgos, cero críticos** — la más larga de la fase D después de D1.
-      Riesgo aceptado y respetado en las cinco rondas: la comprobación de si un
-      skill `origen: externo` está instalado es puramente de lectura vía
-      subproceso, nunca instala nada. Se endureció la convención `skill_N_id`
-      (`"plugin:skill"`) a fail-closed con regex y test de regresión propio
-      (MEN-20, MEN-24). Hallazgo de proceso documentado en `HALLAZGOS.md`: el
-      worktree aislado del agente revisor apareció en la rama equivocada
-      cuatro rondas seguidas (siempre el mismo commit ajeno, el cierre de
-      TASK-016) — detectado y compensado por el propio informe las cuatro
-      veces, nunca invalidó el veredicto, pero el traslado del informe a la
-      ubicación correcta se hizo a mano cada vez.*
-- [x] **D3** · TASK-018 — Enrutado de revisor por diff real, multi-reviewer por dominio — hecho el 2026-09-12
-      *`code-quality-reviewer` ya se declara `fallback: true` con
-      `umbral_dominios: 3` (decisión #16). Aviso medido en TASK-032: un patrón
-      de más no añade un revisor, **sustituye** al genérico — por eso las
-      listas de patrones se acotaron y hay un test con tabla de rutas →
-      revisor esperado en las dos direcciones.*
-      *`cargarCatalogoRevisores` (`src/core/revisores.ts`) promueve a
-      producción el lector de `patrones_archivo`/`fallback`/`umbral_dominios`
-      que antes solo vivía como helper de test, sin cache (ya divergió dos
-      veces, HALLAZGOS.md). `clasificarPorDominio` (función pura) decide el
-      reparto con el umbral INCLUSIVE (decisión de Carlos, 2026-09-12): 0
-      dominios o más del umbral cae al genérico con el diff completo; 1 a 3
-      fragmenta un grupo por dominio, más el genérico si sobran ficheros sin
-      dominio claro — nunca se queda nadie sin revisor. `taskctl review`
-      clasifica el diff real (`diffNameOnly`) y escribe un par
-      petición/informe por grupo, con sufijo de dominio solo cuando
-      fragmenta (precedente `informe-codex-N.md`). `finish.ts`/`rondas.ts`
-      se extendieron para exigir que TODOS los informes de una ronda
-      fragmentada aprueben — sin esto, la tarea quedaría atascada en
-      `03-en-revision` para siempre, el riesgo más grave que señaló el
-      propio brainstorm.*
-      ***2 rondas de revisión por pares, independientes entre sí y del
-      implementador**: ronda 1 cambios-solicitados (2 IMPORTANTE — ambos
-      huecos de cobertura, no bugs: la numeración de ronda tras fragmentar y
-      el mensaje de `cli.ts` con las N peticiones tenían 0% de test aunque el
-      comportamiento real ya era correcto — y 2 MENOR, uno documentado como
-      evaluado-y-descartado y otro dejado sin corregir por mantenibilidad);
-      ronda 2 **aprobada**, por un tercer agente que confirmó por
-      reproducción propia (revirtiendo las correcciones en un clon aislado)
-      que los dos IMPORTANTE quedaron protegidos. Smoke test manual de
-      punta a punta en esta sesión: `new → plan → approve → start` con dos
-      dominios reales, `review` fragmenta en 3 peticiones, `finish` cierra
-      al aprobar las tres. 855 tests (852 verdes; los 3 rojos son los
-      conocidos de Windows nativo).*
-- [x] **D4** · TASK-019 — ~~Revisión ligera para tareas `trivial`/`simple`~~ — **NO SE HACE**
-      *Descartado por Carlos el 2026-09-07, antes de gastar las ~3h. La
-      decisión #17 lo dejó aplicando **solo a `trivial`**, y de las 32 tareas
-      del repo **solo una es `trivial`** (TASK-005) y **todavía no se ha
-      cerrado ninguna de ese nivel**. Reparto completo: 15 `simple`, 13
-      `media`, 3 `alta`, 1 `trivial`. La regla casi nunca se activaría, así
-      que son ~3h para un camino que en la práctica no se recorre. Si algún
-      día aparecen tareas `trivial` de verdad, se reabre.*
-      **Corregido el 2026-09-08 (revisión por pares de TASK-016):** este
-      párrafo afirmaba en negrita que «no existe ni una sola tarea `trivial`»
-      y a la vez, dos líneas más abajo, «1 `trivial` sin cerrar». Lo primero
-      es falso y era el argumento citado; lo segundo es el dato bueno. La
-      conclusión (descartar D4) no cambia, pero la premisa sí estaba mal —
-      y llegó a copiarse a un comentario de código antes de detectarse.*
-- [x] **D5** · TASK-020 — `taskctl codex-review` opcional — hecho el 2026-09-13
-      *Sigue siendo el que cierra un agujero real detectado en C5:
-      `revision_codex: true` deja hoy la tarea **imposible de cerrar**, porque
-      `finish` la rechaza y remite a un comando que no existe.*
-      *`src/commands/codex-review.ts` envuelve `codex review --base <rama>
-      --title "<id>: <titulo>"` (sin `--commit`: revisaría un commit puntual,
-      no el diff completo). No toca `state-machine.ts` ni `finish.ts` — ya
-      tenían el contrato cerrado. Todo fallo de Codex (ausente o exit≠0)
-      degrada igual: avisa, sale con código 0, sin escribir informe — decisión
-      de Carlos, con evidencia real de que en esta máquina Codex falla por
-      incompatibilidad de cuenta/modelo, no por el diff. Un humano/agente
-      certifica el veredicto tras leer la salida cruda de Codex embebida en
-      `informe-codex-N.md`, nunca inferido del exit code.*
-      ***3 rondas de revisión por pares, cada una por un agente distinto**:
-      ronda 1 cambios-solicitados (`spawnSync('codex', ...)` sin `shell: true`
-      nunca invocaba el binario real en Windows —`ENOENT` siempre, aunque
-      estuviera instalado—, y un segundo bug destapado al corregirlo: `codex
-      review --base <rama>` no admite combinarse con un PROMPT propio,
-      conflicto real del CLI); ronda 2 cambios-solicitados (el escapado para
-      `cmd.exe` no evitaba que expandiera `%VARIABLE%` — un título con
-      `%USERNAME%` filtraba el valor real de esa variable hacia la llamada de
-      red externa; corregido eliminando el `%` en vez de escaparlo, porque no
-      hay forma fiable de escaparlo en una invocación suelta de `cmd.exe /c`);
-      ronda 3 aprobada con menores documentados (un `%` literal legítimo en un
-      título también se pierde — trade-off aceptado frente a la fuga de
-      datos). 868 tests (865 verdes; los 3 rojos son los conocidos de
-      Windows).*
-- [x] **D6** · Redactar las 4 skills revisoras (java-spring, angular-vue, csharp-autocad-ifc, code-quality) — hecho el 2026-09-07 (TASK-032)
-      *Las cuatro con lo que revisan en su dominio, la exigencia de reproducir
-      empíricamente, la clasificación CRÍTICO/IMPORTANTE/MENOR con ejemplos
-      propios, la línea de veredicto **extraída del código** de `finish.ts` y
-      sus `patrones_archivo`. El enrutado se midió con `path.matchesGlob` en
-      las dos direcciones y quedó congelado en tests: 32/32 rutas legítimas
-      llegan a su revisor, 37/37 ajenas no casan con ninguno, y 6 capturas
-      aceptadas a sabiendas y documentadas.*
-- [x] **D7** · Redactar `agents/` (roles de brainstorm) + `scripts/heuristica-complejidad.yml` — hecho el 2026-09-07 (TASK-032)
-      *Los cuatro roles con su contexto acotado (§16.2) y su salida con topes
-      numéricos (§16.4.4), y el YML con los seis pesos de la §16.1, el mapeo
-      de niveles, la lista genérica de palabras de riesgo y la tabla de
-      agentes de la decisión #2. **Formato plano a propósito**: el único
-      parser del repo lee pares `clave: valor` y listas inline, y falla en
-      seco ante una lista en bloque — el dato se acomoda al lector en vez de
-      ampliar el lector.*
-      ***Divergencia documentada***: el fichero dice `alta` donde la §16.1 y
-      la decisión #2 dicen `compleja`, porque el enum del plugin
-      (`src/core/task.ts`) es `trivial | simple | media | alta | critica` y
-      `validateTask` **rechaza** `compleja`. Tres tareas reales declaran
-      `alta` — TASK-016, 017 y 018, justo las que más agentes pedirían.*
-
-*Las dos: **9 artefactos, cero líneas en `src/`**, 93 tests nuevos (537 → 630).
-Tres rondas de revisión por pares con tres revisores independientes cada una,
-31 hallazgos, **cero críticos**, todos aplicados. El patrón que dejan para
-`HALLAZGOS.md` se repitió las tres veces: la corrección de un hallazgo llega
-sin la red que impide deshacerla — de ahí salieron **siete aserciones que no
-podían fallar**, incluida la que exigía «reproducir empíricamente» y se
-satisfacía con una etiqueta que otro test obliga a estar presente.*
-
-## Fase E — Cierre (5/6) · ~9h
-
-- [x] **E1** · TASK-022 — Documentación de equipo + invitar colaboradores — resuelta el 2026-09-16
-      *[`docs/contexto/INCORPORACION.md`](INCORPORACION.md) (nuevo): guía de
-      incorporación en cuatro pasos (acceso, clonar e instalar, ciclo de
-      vida, primera tarea), enlazada desde `README.md` y este índice — sin
-      duplicar `skills/task-workflow/SKILL.md` ni la sección 13 de
-      `PROPUESTA_METODOLOGIA.md`, solo enlazándolos. Incluye, explícita, la
-      decisión de Carlos (2026-09-13) de que hoy no hay colaboradores que
-      invitar. Cierra también el punto 8 de la sección 14 **en lo que
-      respecta a a quién se invita** (documento no editado, es congelado —
-      mismo patrón que #1/#2/#9/#11/#12/#13): a día de hoy, **a nadie**; el
-      repo `charliebk/TaskCode` sigue con un solo colaborador, el propio
-      dueño.*
-      ***Tres rondas de revisión independiente, cero críticos, aprobada en
-      la 3ª**: ronda 1 (cambios-solicitados, 3 importantes: invertía qué
-      estaba probado y qué no sobre `taskctl` por PATH, referencia circular
-      al cierre del punto 8, faltaba el paso de clonar y el acceso pedido
-      era insuficiente) + ronda 2 (cambios-solicitados, 1 importante
-      corregido a medias: la reescritura seguía atribuyendo al CI una
-      instalación de plugin que nunca ejecuta) + ronda 3 (aprobada, 3
-      menores no bloqueantes, aplicados igualmente). Detalle completo en el
-      `## Resultado` de `tareas/04-terminadas/TASK-022/tarea.md`.*
-- [x] **E2** · TASK-023 — Métricas de coste en tokens por fase (§16) — cerrada el 2026-10-06
-      *`taskctl registrar-coste` (`--agente <id>` suma el uso real de la
-      transcripción del subagente; la cifra que Claude Code muestra al
-      terminarlo es su contexto final, no su coste), `metricas --tokens
-      [--escribir]` y un aviso no bloqueante en `finish`. Histórico de 41
-      tareas en la §11 de `docs/METRICAS.md`: la revisión se lleva el
-      71-100 % del gasto de subagentes y **los pesos de la heurística no se
-      tocan**. 2 rondas: 1 IMPORTANTE (aviso de `finish` con la semántica
-      descartada) y 5 MENOR, todos corregidos. Detalle en el `## Resultado`
-      de `tareas/04-terminadas/TASK-023/tarea.md`.*
-- [x] **E3** · Validación en Windows nativo — **resuelta por el CI, no por una sesión nativa**
-      *El job `windows-latest` asevera cada hipótesis como un step propio.
-      Las cinco en verde: el bit `+x` sobrevive el checkout nativo, `taskctl`
-      resuelve como comando suelto por PATH, los `.sh` de Git-Flow pasan el
-      smoke test bajo Git Bash, `node bin/taskctl` funciona desde `cmd.exe`,
-      y la suite completa pasa. Cerró la reserva que arrastraban
-      TASK-006/007/008/009/010/011. Hallazgo negativo real y corregido: el
-      glob de `npm test` no era portable a `cmd.exe`.*
-- [x] **E4** · Decidir el cierre de las 12 tareas con `estado: planificada` pese a estar hechas — resuelta el 2026-09-16
-      *TASK-001 a TASK-012, todas cerradas desde hace tiempo (evidencia en
-      `CHANGELOG.md`, `docs/INDEX.md`, y esta misma sección "Ya terminado")
-      pero con `estado: planificada` en su frontmatter porque se hicieron
-      antes de que `taskctl` existiera — la "paradoja de bootstrapping" que
-      ya nombraba `CONVENCIONES.md`. Se investigó si se podía forzar el
-      ciclo real (`plan → approve → start → review → finish`) ahora mismo:
-      **no**, y no por preferencia sino por imposibilidad medida.
-      TASK-001/002/003 declaran una `rama:` que no existe en Git —
-      `taskctl finish` haría `git merge-base --is-ancestor` contra una ref
-      inexistente y **crashearía** con una excepción de Git sin capturar,
-      no con un error limpio (`finish.ts` + `isAncestor` en `git.ts`,
-      confirmado leyendo el código). Las otras 9 ya están mergeadas en
-      `develop`: una revisión por pares "empírica" contra ellas correría
-      sobre un diff vacío. Se decide la **Opción A**: dejarlas donde están,
-      sin tocar frontmatter ni carpetas — mismo patrón que **D4** (decisión
-      documentada, no aplazada, cuenta como resuelta). La alternativa
-      (editar `estado:` a mano y mover a `04-terminadas/`) se descarta
-      porque la propia documentación del proyecto la desaconseja
-      explícitamente (`CONVENCIONES.md`: "contradiría el principio del
-      sistema"; `skills/task-workflow/SKILL.md`, regla 3: "no editar
-      `estado:` a mano para saltarse un paso") — no hay ningún texto que la
-      respalde. Riesgo aceptado: `taskctl board` seguirá mostrando estas 12
-      mezcladas con la planificación vigente.*
-- [x] **E5** · Decidir qué hacer con `runConfigurations.zip` en la raíz — resuelta el 2026-09-16, **borrado**
-      *Confirmado: era la carpeta `.idea/runConfigurations/` de OTRO
-      proyecto (CDAU/IECA — Auth Service, Gateway, etc.), entrada en el
-      commit inicial (`4435d68d`), que sirvió de semilla para migrar 22 run
-      configurations + 18 scripts Bash hacia
-      `taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/`
-      (TASK-007/TASK-008 — dos de las 12 de E4). Sin ninguna dependencia
-      funcional en el repo (confirmado por grep). Borrado del working tree;
-      recuperable del historial con `git show
-      4435d68d:runConfigurations.zip` — nota añadida en
-      `scripts/gitflow/README.md` con ese hash para no depender de
-      recordarlo de memoria.*
-- [x] **E6** · Distribución del CLI: un clon recién hecho no trae un `taskctl` que funcione — ~2h estimadas, **~6h reales**
-      *Cerrado el 2026-09-07 (TASK-031). `dist/src/` se versiona: un clon de
-      `develop` ya arranca sin compilar (`node bin/taskctl --version` → `0.1.0`,
-      antes exit 1). El enunciado del item se equivocaba en un punto y se
-      corrigió: `package.json` **sí** declara `bin`, y que `plugin.json` no lo
-      haga es correcto — el PATH funciona por convención de directorio. La
-      causa era solo `dist/` ignorado.*
-      *El plan se quedó corto en su premisa central: `newLine: "lf"` no basta,
-      porque las plantillas multilínea de `src/` viajan tal cual al build (34
-      CRLF medidos, los 34 dentro del literal `HELP`). Y la primera medición no
-      lo vio porque comparaba Windows contra Windows. De ahí `*.ts text eol=lf`
-      además de `dist/**` y `bin/*`.*
-      ***Tres rondas de revisión, 34 hallazgos, cero críticos**: 5 importantes
-      + 16 menores (3 revisores en paralelo), 2 + 5 (uno en clon propio), y 0 +
-      5 en la ronda de cierre, **APROBADA**. El guard de CI resultó estar mal
-      por **cinco** motivos distintos, ninguno visto por quien lo escribió — el
-      último, que su propio mensaje de error prescribía un remedio imposible de
-      seguir. Y dos importantes de la ronda 2 eran defectos de las correcciones
-      de la ronda 1, no del trabajo original: el patrón que ya registró C6.*
-      ***AC7 queda a medias, y a propósito**: la instalación real se ejecutó
-      (`plugin marketplace add` + `install` con el CLI 2.1.226), la copia
-      cacheada arranca, y se confirmó por primera vez en este proyecto que el
-      mecanismo de `bin/` en PATH existe de verdad. Pero `taskctl` como comando
-      suelto **no se ha visto funcionar**: cuesta un comando en la próxima
-      sesión, `taskctl --version`. La evidencia que se presentó primero para
-      este AC no probaba lo que decía, y lo cazó la revisión: la caché de un
-      marketplace `directory` copia el árbol de trabajo con ignorados incluidos.*
-      *537 tests (534 verdes y los 3 rojos conocidos de Windows), 5 nuevos.*
-      *Item nuevo, abierto por la revisión por pares de C5 (MENOR, no
-      bloqueante, **preexistente** y fuera del alcance de aquella tarea).
-      `dist/` está en `.gitignore`, `.claude-plugin/plugin.json` no declara
-      `bin` y `package.json` tampoco, así que en un clon recién hecho
-      `bin/taskctl` —que hace `import('../dist/src/cli.js')`— muere con
-      `[ERROR] taskctl no pudo arrancar: Cannot find module
-      '...\dist\src\cli.js'` y sale con código 1 mientras nadie ejecute
-      `npm install && npm run build` dentro del plugin; y ni aun después
-      queda `taskctl` en el PATH de otro proyecto. No es un hueco del ciclo
-      de vida sino una decisión de **empaquetado**: compilar al empaquetar,
-      versionar `dist/`, o documentar el arranque en el README del plugin.
-      Condiciona a E1 —invitar colaboradores que clonan y no pueden
-      ejecutar nada— y, cuando se cierre, la skill de C5 debería acabar
-      diciendo en una línea cómo se pone `taskctl` disponible.*
-
----
-
-## Decisiones que dependen de ti (2/10)
-
-No son horas de trabajo mío, son respuestas tuyas — pero bloquean lo que
-está a su derecha.
-
-- [x] **#1** · ¿Checkpoint humano siempre, o solo desde complejidad media?
-      *Resuelta por Carlos el 2026-09-07: **siempre**. No es solo prudencia:
-      hoy ya es asi (`start` exige `plan_aprobado: true`), asi que "siempre"
-      cuesta **cero codigo** y auto-aprobar seria anadir una bifurcacion nueva
-      con una forma nueva de equivocarse. Y hay evidencia en contra de
-      abaratarlo: en la sesion del 2026-09-07, **tres planes llegaron a
-      aprobacion con premisas falsas** (que dos scripts usaban una funcion
-      compartida, que dos testigos bastaban, que el parser soportaba
-      comentarios de linea). Las cazo quien las toco despues, no el
-      checkpoint — pero quitar la lectura humana quita el unico control que
-      no es un agente. Divergencia con la §155, que lo describe como
-      "opcional, recomendado desde complejidad media": se documenta.*
-- [x] **#2** · Máximo de agentes en brainstorm paralelo (3 vs 4)
-      *Resuelta por Carlos el 2026-09-07: **escala con la complejidad** — 0 en
-      `trivial`, hasta 3 en `compleja`, **4 en `critica`**. Los 4 son los
-      cuatro roles que la §2 ya define (arquitectura, riesgos, testing,
-      dominio): con 3 habria que repartir uno entre los otros. El techo
-      importa porque el coste del unificador crece con las entradas, no solo
-      el de los agentes.*
-- [x] **#9** · Contenido de `.taskcode/config.yml`
-      *Resuelta por Carlos el 2026-09-07: **tres claves**, todas opcionales
-      — `rama_base` (hoy `'develop'` literal en `git.ts:352`, el unico
-      hardcode que no se puede detectar), `agente_revisor_por_defecto` (hoy
-      `'general-purpose'` **duplicado** en `new.ts` e `import.ts`) y
-      `limite_wip` (hoy 1, fijo). **Descartada `politica_no_borrar_ramas`**:
-      solo puede valer `true`, asi que documenta en vez de configurar; si se
-      declarase habria que decidir que hace el plugin cuando alguien escriba
-      `false`, y "nada" envejece mal. **Descartada `rama_principal`**: ya la
-      detecta `resolveMainBranch` (main/master), y ponerla en config duplica
-      una deteccion que funciona. **Descartado `remoto`**: 18 scripts
-      hardcodean `origin` y eso es un trabajo mucho mayor que C4.*
-      *Forma acordada, que importa mas que las claves: sin fichero el
-      comportamiento es identico al de hoy (no-breaking, los 472 tests siguen
-      valiendo de red); **fallo cerrado** ante valor invalido o clave
-      desconocida, nunca caida al default en silencio (misma doctrina que el
-      `wx` de `plan.ts` y el parser de veredictos); **un solo parser** —el de
-      frontmatter ya cubre este subconjunto y su bucle `clave: valor` es
-      extraible—; **un solo punto de resolucion** (`resolverConfig(cwd)` con
-      defaults ya aplicados), para que la cuarta clave cueste una linea; y
-      **no se declara ninguna clave que nadie lea** todavia (`remoto`, las
-      palabras clave de la heuristica): una clave escribible que no hace nada
-      es peor que no tenerla, y este proyecto ya se quemo con `codex-review`.*
-- [x] **#11** · Mecanismo determinista para saber qué plugins/skills hay instalados
-      *Resuelta el 2026-09-07, **verificada ejecutandola**: `claude plugin
-      list --json` devuelve los plugins instalados en JSON estable (id,
-      version, scope, enabled, installPath), y `claude plugin details
-      <plugin>` da el inventario de componentes, incluidas las skills.*
-      ***Lo importante es lo que NO hay que usar**: `claude plugin validate`
-      solo nombra las skills que **fallan**, asi que un plugin sin ninguna
-      skill valida igual. Comprobado en TASK-028 con dos plugins sinteticos;
-      esta en `HALLAZGOS.md`. Aseverar sobre su salida para deducir que hay
-      instalado da la respuesta contraria a la verdadera.*
-- [x] **#12** · Señales del `relevance` en `marketplace.json`
-      *Resuelta sin decisión: la documentación oficial dice que `relevance`
-      solo surte efecto en marketplaces que un administrador incluya en
-      managed settings, así que en un marketplace privado personal no haría
-      nada. No se declara.*
-- [x] **#13** · ¿WIP único, o dos límites independientes (diseño y ejecución)?
-      *Resuelta por Carlos el 2026-09-05: **ni una cosa ni la otra** — un
-      **único límite, y solo sobre la ejecución**. En diseño no hay tope: se
-      pueden planificar varias tareas a la vez. Lo que se limita es tener
-      **una sola tarea con la rama abierta**, y el hueco lo ocupan tanto
-      `02-en-curso/` como `03-en-revision/`, porque la rama sigue viva y sin
-      mergear hasta `taskctl finish` y es ahí donde se commitean las
-      correcciones de los hallazgos. Motivo textual: "evitar que se programe
-      código de una tarea en la rama Git de otra tarea".*
-      *Divergencia con la §8.2 (congelada), que describe dos límites
-      independientes y uno de ellos sobre el diseño: hay que documentarla al
-      implementar B7, no reescribir la metodología.*
-- [x] **#14 (paso 5)** · ¿`taskctl` comitea y sube por la persona?
-      *Resuelta por Carlos el 2026-09-07: **commitea si, sube solo con
-      `--push`**. La pregunta eran en realidad dos con riesgos distintos:
-      commitear es local y se deshace con `git reset`, y solo toca `tareas/`
-      y `docs/`; subir publica al equipo. Evidencia medida: TASK-029 costo 9
-      commits y **4 existian solo porque `taskctl` no commitea lo que el
-      mismo escribe** (tarea creada, plan aprobado, peticion de revision,
-      artefactos de cierre); `import` sigue sin poder ejecutarse dos veces
-      seguidas; y una rama cuyo movimiento de tarea no este commiteado es
-      invisible para el limite de WIP (C8).*
-      *Divergencia con la §8.3 que hay que documentar al implementar C2: el
-      paso 5 pide tambien subir, con el argumento de que si no, el equipo no
-      ve la tarea nueva hasta que alguien la suba a mano. Se acepta esa
-      perdida a cambio de que publicar siga siendo un acto consciente.*
-- [x] **#15** · Pesos de la heurística de complejidad
-      *Resuelta por Carlos el 2026-09-07: **se aceptan los pesos de la §16.1
-      tal cual**, como defaults del plugin, y se ajustan cuando haya datos.*
-      *El motivo de no "validarlos con datos reales" como pedia el enunciado
-      es que **no se puede**: medido el 2026-09-07 sobre las 10 tareas de
-      `04-terminadas/`, el historial entero es **6 `media` y 4 `simple`**. No
-      existe ni una tarea `trivial`, `compleja` ni `critica`, asi que tres de
-      los cinco niveles no tienen con que contrastarse. Fingir esa validacion
-      seria peor que declararla pendiente.*
-- [x] **#16** · Umbral de dominios para caer a revisor único
-      *Resuelta por Carlos el 2026-09-07: **3**, el punto de partida que
-      propone la §16.5. Con 2 se perderia el caso que motivo la seccion
-      (backend + el componente que lo consume), que es justo donde varios
-      revisores en paralelo aportan. **No se hace configurable todavia**:
-      seria una cuarta clave en `.taskcode/config.yml` que nadie lee hasta
-      que exista D3, y la decision #9 prohibe expresamente declarar claves
-      que no hacen nada.*
-- [x] **#17** · ¿Revisión ligera solo para `trivial`, o también `simple`?
-      *Resuelta por Carlos el 2026-09-07: **solo `trivial`**, contra lo que
-      sugeria la §16.6 con su "(y probablemente `simple`)".*
-      ***Decidida con datos, no con criterio***: *de las 4 tareas `simple`
-      cerradas, **una escondia un CRITICO** — TASK-024, donde un `user.email`
-      con un salto de linea inyectaba una clave que pisaba `estado` y dejaba
-      la tarea ladrillada con exit 0 y sin aviso — y **las cuatro** tuvieron
-      al menos un IMPORTANTE (TASK-027: el fix era solo de Windows y su test
-      habria caido en el CI de Linux; TASK-028: la correccion habria
-      reproducido el defecto que venia a arreglar; TASK-015: 3 importantes).
-      Abaratar la revision de `simple` habria dejado pasar el peor bug del
-      proyecto.*
-      *Efecto secundario que conviene saber: como tampoco existe ninguna
-      tarea `trivial` en el historial, **la regla casi nunca se activara**.
-      Eso hace D4 mucho menos valioso de lo que parecia — merece revisarse si
-      vale sus ~3h antes de implementarlo.*
-
----
-
-## Corte mínimo defendible
 
-**Fases A + B + C = 18 items, ~39h.** Dejan un sistema completo y usable,
-con la metodología cumplida en lo esencial y el brainstorm multi-agente
-pendiente como mejora futura. Si hay que parar antes de tiempo, es aquí.
+Las fases cerradas (Sprint 0 y 1, A a O), las decisiones ya resueltas (#1 a
+#17, ninguna abierta) y el «Corte mínimo defendible» viven en
+[`archivo/CHECKLIST-fases-cerradas.md`](archivo/CHECKLIST-fases-cerradas.md),
+movidas tal cual el 2026-11-12. Aquí queda solo lo que tiene casillas
+abiertas. Tope de este fichero: 20 480 B (ver `CONVENCIONES.md`).
 
----
-
-## ✅ F — Auditoría 2026-10-03 (22/22)
-
-*(El contador iba uno por debajo desde antes de la fase 6: las 22 casillas
-están marcadas. Corregido al publicar la 0.5.0.)*
-
-- [x] TASK-033 — Comando de sincronización tras cada transición (v0.1.1)
-- [x] TASK-034 — F1-T1 Excluir lo generado del diff de revisión
-- [x] TASK-035 — F1-T2 Política de rondas y una sola suite por ronda
-- [x] TASK-036 — F1-T3 Veredicto con un comando e informe estructurado
-- [x] TASK-037 — F2-T1 Logging de Git-Flow sin lanzar procesos
-- [x] TASK-038 — F2-T2 Una sola detección de origin, con timeout
-- [x] TASK-039 — F2-T3 Menos llamadas git en los comandos
-- [x] TASK-040 — F3-T1 `taskctl review` para la ronda 2 y siguientes (v0.2.0)
-- [x] TASK-041 — F4-T1 `taskctl new` con objetivo y criterios
-- [x] TASK-043 — F4-T2 Validación antes de plan y puertas de cierre
-- [x] TASK-044 — F4-T3 Partición propuesta de las tareas grandes
-- [x] TASK-042 — F4-T4 Complejidad por heurística y un rol sin unificador
-- [x] TASK-045 — F5-T1 `rama_base` de punta a punta
-- [x] TASK-046 — F5-T2 Secciones con subtítulos y criterios multilínea
-- [x] TASK-047 — F5-T3 Flags desconocidos y mensajes de review
-- [x] TASK-050 — F6-T1 Suite rápida y repo plantilla en los tests
-- [x] TASK-051 — F6-T2 Partir los ficheros de test más largos
-- [x] TASK-048 — F6-T3 Skill de flujo más ligera
-- [x] TASK-049 — F6-T4 Metadatos del plugin y modelo de los agentes
-- [x] TASK-052 — F6-T5 Telemetría de fases y heurística recalibrada
-- [x] TASK-053 — `moveTareaFile` reintenta el rename ante EPERM/EBUSY
-- [x] TASK-054 — Rutas no ASCII en el diff de revisión por dominio
-
-## G — Flujo guiado por fases (5/5)
-
-Pedido por Carlos el 2026-10-04 con prioridad sobre el resto de la fase F.
-Plan de referencia: `tareas/.../TASK-055/planificacion/plan-final.md`.
-
-- [x] TASK-055 — Flujo A: `taskctl` desde PowerShell y cmd
-- [x] TASK-056 — Flujo B: núcleo determinista del siguiente paso y registro de transiciones
-- [x] TASK-057 — Flujo C: fases como skills invocables en modo manual
-- [x] TASK-058 — Flujo D: modo semiautomático
-- [x] TASK-059 — Flujo E: modo automático
-
-## H — Peticiones tras el plan (3/3)
-
-Funcionalidad pedida por Carlos después de cerrar el plan de terminación.
-
-- [x] TASK-060 — Opciones de cierre en `finish`: merge normal (por defecto),
-      merge request y tag — cerrada el 2026-10-06, publicada en la 0.6.0
-      *`--tag <nombre>` pone un tag anotado sobre el commit de merge, validado
-      antes de mergear y subido solo con `--push`; en hotfix y release le da
-      nombre al tag del script. `--merge-request` abre el PR en GitHub o el MR
-      en GitLab tras un preflight sin efectos, y un segundo `finish` cierra
-      cuando la plataforma lo da por mergeado. Clave `cierre_por_defecto` y
-      la skill `finish` pregunta salvo en automático. Hubo 2 rondas: 1
-      IMPORTANTE (la rama se daba por integrada con commits que no estaban en
-      el MR) y 5 MENOR, todos corregidos.*
-- [x] TASK-061 — Merge request en cualquier GitLab, también autoalojado —
-      cerrada el 2026-10-08
-      *Claves `plataforma_remota` y `url_base_remoto`; `glab` recibe
-      `GITLAB_HOST` (la base) y `-R` (el proyecto relativo a la base) desde
-      un único punto. La sesión se comprueba con `glab api user` y el MR se
-      crea con `glab api`, porque `glab mr create` no funciona con una
-      instancia bajo una ruta. Una clave desconocida en la config avisa en
-      lugar de abortar. Hubo 2 rondas: 1 IMPORTANTE, reproducido con glab
-      real (`mr create` fallaba en subpath después de subir la rama), y 3
-      MENOR. Verificado con glab real contra HTTPS local.*
-- [x] TASK-062 — `taskctl doctor`: comprobar que un proyecto está listo —
-      cerrada el 2026-10-08, publicada en la 0.7.0
-      *Solo lee. Comprueba el entorno (Node 22, git, y bash ejecutando un
-      script real, sin OK falso con WSL), el repo, la config, la coherencia
-      de las tareas con un recorrido propio y, si aplica, la sesión de
-      gh/glab. Cada fallo trae su arreglo; con `--json` y código 1 solo si
-      hay errores. Hubo 1 ronda, con 5 MENOR corregidos.*
-
-## I — Métricas v2 (3/3)
-
-Pedido por Carlos el 2026-10-25: medir el comportamiento del plugin en los
-proyectos que lo usan (ToolsaWeb, OpenGisViewer, TaskCode) antes de decidir
-mejoras de tokens, tiempo, verificación o memoria de contexto. Se partió en
-el diseño de TASK-063 en captura (A) y lectura (B).
-
-- [x] TASK-063 — Métricas v2 (A): capturar desglose de coste, lecturas y
-      origen de hallazgos — cerrada el 2026-10-25
-      *Tabla `## Coste` en `tarea.md` con entrada, caché escrita y leída,
-      salida, lecturas y total por registro; las lecturas cuentan Read, Grep,
-      Glob, MCP de lectura y Bash de lectura. Columna `Origen` por hallazgo
-      (implementación, plan o especificación) y `leerHallazgos`. `finish`
-      avisa sin coste de implementación. 1 ronda, aprobada, 3 MENOR
-      aceptados (dos pasan a TASK-064).*
-- [x] TASK-064 — Métricas v2 (B): fila de métricas con coste desglosado,
-      hallazgos y lecturas — cerrada el 2026-10-25
-      *`metricas` da por tarea crit/imp/men y su origen, contados una vez
-      por tarea (revisor + ID, severidad por primera palabra, fusión campo a
-      campo entre rondas); con `--tokens`, tokens nuevos, lectura de caché y
-      sin desglose; terminadas sin coste y mediana de lecturas. Se partió en
-      su diseño: los agregados pasan a TASK-065. 2 rondas: 2 IMPORTANTE
-      reproducidos con OpenGisViewer (fila «sin hallazgos» contada; la última
-      ronda borraba un dato reconocido), corregidos.*
-- [x] TASK-065 — Métricas v2 (C): evolución, grupos y varios proyectos —
-      cerrada el 2026-10-25
-      *`--evolucion`, `--grupos` y `--repo` repetible (clave proyecto + id,
-      `realpath`, abortos ante rutas dudosas), `--json` con lista cerrada de
-      flags, flags repetidos que abortan en todos los comandos, lista sin
-      coste acotada y coste de agentes reanudados por diferencia. Línea base
-      de ToolsaWeb, OpenGisViewer y TaskCode (194 tareas) en su Resultado.
-      1 ronda, aprobada con 3 MENOR aceptados.*
-
-## J — Doctor-deploy (3/3)
-
-Pedido por Carlos el 2026-10-27: un doctor para antes de lanzar o publicar una
-aplicacion que compruebe punto por punto una lista de seguridad generica
-(20 puntos pedidos mas los medibles que falten), adaptada al tipo de
-aplicacion, que diga que falla y como arreglarlo, y cree tareas desde
-TASK-9999 hacia abajo. Partido en dos: deterministas (A) y juicio, tareas y
-aviso en release (B).
+## Decisiones que dependen de ti
 
-- [x] TASK-066 — Doctor-deploy A: catalogo generico y comprobaciones
-      deterministas — cerrada el 2026-10-27
-      *`taskctl doctor-deploy [--json] [--escribir]`: catalogo de 43 puntos y
-      15 tipos como datos, capa del proyecto con desactivar y silenciar por
-      hallazgo, cuatro estados sin OK sin evidencia, seis sondas
-      deterministas (secretos en arbol e historial, ficheros de secretos,
-      .gitignore, lockfile, dependencias) y enmascarado en origen. 3 rondas:
-      7 IMPORTANTE (falsos OK por cobertura y tests que faltaban), corregidos;
-      MEN-12 y MEN-13 pasan a TASK-067.*
-- [x] TASK-067 — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso
-      en release — cerrada el 2026-10-27
-      *Skill doctor-deploy y agente revisor-seguridad-deploy; `--resultado`
-      con veredictos citados por fichero:linea y rechazos con motivo; JSON v2
-      y `<fecha>.json`; `--crear-tareas` desde TASK-9999 hacia abajo con
-      etiqueta `doctor-deploy:<punto>` y sin duplicar; rango reservado
-      TASK-9000..9999 fuera de la numeracion normal; aviso sin bloquear en
-      `finish` de una release. 2 rondas: solo MENOR, corregidos (el aviso
-      ignora tambien `tareas/` por decision de Carlos).*
-- [x] TASK-068 — Doctor-deploy C: tipo de aplicacion y sondas deterministas
-      extra (Firebase/RLS, .npmrc, docker-compose, CI, Dockerfile; version
-      vigente de OWASP/ASVS) — cerrada el 2026-11-04
-      *Clase de aplicacion como segundo eje (web, api, movil, cli, libreria):
-      sin clase detectada los puntos aplican; con cli o libreria y sin senal de
-      servicio, diez puntos salen NO APLICA con el marcador en el motivo. Siete
-      sondas deterministas nuevas (puntos 37-43), JSON v3 y referencias OWASP
-      Top 10 2025 + ASVS 5.0. 2 rondas: IMP-1..3 corregidos (API con bin,
-      variantes de Dockerfile/compose, huella por paso en pr-target);
-      MEN-3, 5, 6, 7 y 8 aceptados.*
-
-## ✅ K — Frenos de verificación con hooks (8/8)
-
-Que una tarea no se dé por hecha ni se mergee con la verificación en rojo,
-usando hooks Stop y PreToolUse de Claude Code. Ideas tomadas de
-gemba-app/brakes (Apache-2.0), sin copiar código. Empieza por un spike.
-
-- [x] TASK-069 — Spike: hooks Stop y PreToolUse de Claude Code en
-      Windows/IntelliJ — cerrada el 2026-11-03
-      *Sonda inerte `hooks/sonda-hooks.mjs` (Node, forma exec) con 16 casos de
-      test y steps de CI. H1–H6 confirmadas en Windows nativo con Claude Code
-      2.1.317 (`claude -p`): Stop con exit 2 devuelve al agente y
-      `stop_hook_active` corta el bucle; PreToolUse bloquea `git merge` por
-      Bash y PowerShell, también en subagentes. Criterio de CI sin marcar: la
-      rama no se había subido. 2 rondas: IMP-1 (la regex bloqueaba
-      `git merge-base`), corregido; MEN-5 y MEN-6 aceptados para TASK-071/072.*
-- [x] TASK-070 — Clave `comando_verificacion` en `.taskcode/config.yml` —
-      cerrada el 2026-11-04
-      *`comando_verificacion` (null = sin freno) y `timeout_verificacion` (600 s)
-      en `config.ts`, con fallo cerrado y el timeout sin comando abortando;
-      `taskctl doctor` da `ok` con el comando u `omitida` con el arreglo en la
-      misma línea (no `aviso`, para no tocar los tests existentes). Validadores
-      de sincronización generalizados sin cambiar sus mensajes. 1 ronda:
-      aprobada, MEN-1 y MEN-2 aceptados. Sin versión: llega con TASK-071.*
-- [x] TASK-071 — Hook Stop: una tarea no se da por hecha con la verificación
-      en rojo — cerrada el 2026-11-04
-      *Hook `Stop` en forma exec (`dist/src/hooks/stop-verificacion.js`,
-      timeout 3600): con tarea en `02-en-curso` en la rama y
-      `comando_verificacion`, ejecuta y sale 2 con comando, código, duración y
-      cola (40 líneas / 4 KiB, sin ANSI ni credenciales en URLs). Sin procesos
-      fuera de un proyecto con tareas; `FRENO_VERIFICACION=0` lo apaga.
-      Decisiones de Carlos: la clave basta, config inválida bloquea una vez,
-      memo de verdes y rojos por huella en `.git/`. Envoltorio extraído a
-      `fs/ejecucion-acotada.ts`. Smoke con `claude -p` real. 2 rondas: IMP-1 e
-      IMP-2 (tests de huella y de tope) y MEN-1..7 corregidos; MEN-8 aceptado.*
-- [x] TASK-072 — Puerta de verificación en `finish` y merge guard — cerrada el
-      2026-11-04
-      *`finish` ejecuta siempre `comando_verificacion` antes de mergear o abrir
-      el MR (no en el segundo MR ni en el camino idempotente) y aborta en rojo;
-      `--sin-verificacion` lo anota commiteado en la rama antes del merge. Hook
-      `PreToolUse` sin `if` (sustituye a la sonda): bloquea `git merge` y los
-      scripts de cierre hacia `rama_base`/main sin verde guardado del commit
-      fuente; analiza compuestos y `bash -c`/`pwsh -Command`. Decisiones de
-      Carlos D1–D4. Smoke con `claude -p` real. 2 rondas: MEN-1..3 corregidos;
-      MEN-4 (`bash -o pipefail -c`) aceptado y resuelto en TASK-077.*
-- [x] TASK-077 — Guardián de merges: opciones con valor antes de `-c` y doc de
-      `bash -c` — cerrada el 2026-11-04
-      *Seguimiento de TASK-072: helper `opcionesDeShell` (una regla para `-c` y
-      para el script de cierre; un valor por cada `o`/`O` del grupo, `--rcfile`,
-      `--init-file`); texto de `-c` = primer no-opción. README y CHANGELOG. 2
-      rondas: MEN-1 (`-oc`) y MEN-2 (test de `+c`) corregidos.*
-- [x] TASK-073 — Tests held-out por tarea — cerrada el 2026-11-05
-      *Primera parte (partida por decisión de Carlos): `comando_heldout`;
-      `finish` ejecuta `aceptacion/` con `HELDOUT_DIR` tras la verificación y
-      aborta en rojo sin mostrar la salida; huella por árbol de Git frente a la
-      base (con merge-base para saber si cambió la base o la rama); comando de la
-      config de la base; hotfix contra main; `aceptacion/` siempre fuera del
-      diff de revisión; `heldout.md` en la skill. 3 rondas: IMP-1..3 y MEN-1..6
-      corregidos; MEN-7 (test en negativo del «Ademas») aceptado.*
-- [x] TASK-078 — Hook que impide leer y editar los held-out de la tarea en curso
-      (segunda parte de TASK-073) — cerrada el 2026-11-05
-      *Guardián `PreToolUse` (`guardia-heldout.ts`) con dos entradas: la nueva
-      de fichero (`Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob`) y la de
-      Bash/PowerShell ampliada. Casado por segmentos tras normalizar barras,
-      mayúsculas, `..` y relativas al cwd. Decisiones de Carlos: tarea protegida
-      por el nombre de la rama (nunca `tarea.md`), el remedio de `finish` lo
-      ejecuta la persona, sin interruptor. Riesgos aceptados declarados en
-      `heldout.md` (Grep sobre la raíz, cambiar de rama). Smoke con `claude -p`
-      real. 2 rondas: MEN-1..5 corregidos o declarados.*
-- [x] TASK-074 — Cobertura sobre las líneas cambiadas — cerrada el 2026-11-05
-      *Freno 8: lcov propio (`core/lcov.ts`) cruzado con las líneas añadidas desde
-      la merge base (`git diff -U0` con opciones fijas, respetando
-      `excluir_de_revision`). `review` lo informa en la petición; `finish` frena
-      con `umbral_cobertura` (% mínimo, el exacto pasa) leído de la rama base, y
-      sin datos fiables no cierra. Claves `informe_cobertura` y
-      `umbral_cobertura`. Node escribe `SF:` relativo y con `\`: tests con lcov
-      real. Smoke con el CLI real. 4 rondas (la 4.ª autorizada por Carlos):
-      IMP-1..6 y MEN-1..8 corregidos, con la regla de los ficheros fuera del
-      informe precisada tres veces por Carlos; MEN-9 y MEN-10 (huecos de test)
-      aceptados. Seguimiento: dogfooding en este repo.*
-
-## ✅ L — Mantenimiento (2/2)
-
-Arreglos que salen al revisar otras tareas y no son de ninguna fase.
-
-- [x] TASK-075 — Contrapruebas de descubrimiento rotas por el validador de
-      Claude Code 2.1.316+ (detectado al revisar TASK-069) — cerrada el 2026-11-05
-      *Helper `test/helpers/validador-claude.ts`: «valida limpio» = exit 0,
-      `Validation passed` y ninguna cruz antes de la línea `Plugin directory
-      checks for` (el bloque del directorio marca README_MISSING con cruz aunque
-      pase). Tests 13/14/16/17 lo usan; test unitario que corre en CI. En
-      Windows quedan solo los 3 rojos conocidos. 2 rondas: MEN-1 (corte anclado a
-      principio de línea) corregido; MEN-2 aceptado.*
-- [x] TASK-076 — `taskctl doctor` avisa de hooks PreToolUse sobre Agent que
-      bloquean los subagentes en modo automatico, y version nueva del plugin
-      para avisar a todos los proyectos (detectado durante TASK-068) — cerrada el 2026-11-06
-      *Comprobación `hooks-subagente` (AVISO, id fijo, origen + ruta + matcher):
-      settings de usuario, proyecto y local, y la versión activa de cada plugin
-      habilitado (`installed_plugins.json`, `enabledPlugins`, `projectPath`,
-      `hooks.json` y `hooks` de `plugin.json`); respeta `disableAllHooks`. Matcher
-      con regex anclada y `""`/`*`/ausente cuentan (decisión de Carlos). README con
-      «Problemas conocidos», regla en `avance.md`, versión 0.9.0 (publicada en
-      0.9.0; tag creado en TASK-089). 2 rondas: MEN-1..5 corregidos; MEN-6 y MEN-7
-      aceptados.*
-
-## M — Revisores y roles de dominio (2/2)
-
-Revisores por pares y roles del brainstorm para dominios que el plugin no cubria.
-
-- [x] TASK-079 — Revisor por pares de dominio para Rust y WASM — cerrada el 2026-11-06
-      *Skill `rust-wasm-reviewer` (`.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`,
-      `.cargo/config.toml`, toolchain/rustfmt/clippy): ownership, errores sin panic,
-      limite JS-WASM (llamador TS y `.d.ts` obligatorios si cambia una firma
-      exportada), numerica en f64, `unsafe`, rendimiento. Catalogo `skill_6`, tabla
-      de revisores en el README, nota de umbral del generico (con cuatro dominios
-      ya puede superarse). Version 0.10.0, publicada (tag creado en TASK-089). 2 rondas: MEN-2, 3, 4 y 6
-      corregidos (exactitud tecnica de la skill); MEN-1 y MEN-5 aceptados.*
-- [x] TASK-080 — Accesibilidad en angular-vue-reviewer y roles de arquitectura y
-      rendimiento en plan — cerrada el 2026-11-06
-      *`angular-vue-reviewer` revisa accesibilidad por criterio WCAG 2.2 (contraste,
-      foco, teclado, ARIA, nombre accesible, dialogos) con severidad escrita;
-      `brainstorm-arquitectura` mira limites, dependencias, acoplamiento y ADR. Rol
-      condicional `brainstorm-rendimiento` (etiquetas rendimiento/wasm/workers/3d,
-      solo con 2+ roles, fuera de la escalera; con 0 o 1, `plan` avisa).
-      `planEsPlantilla` lee los roles del disco: la plantilla vacia con rendimiento
-      ya no se da por redactada. Publicada en 0.11.0. 2 rondas:
-      IMP-1 y MEN-1..5 corregidos; MEN-6 (restos cosmeticos de "cuatro") aceptado.*
+Ninguna abierta. Las resueltas, con su razonamiento, en el archivo.
 
 ---
 
-## N — Mejoras tras las métricas de la 0.8 (10/10)
-
-Abierta el 2026-11-07 tras medir ToolsaWeb con `taskctl metricas` (51 tareas
-con la 0.8): calidad estable, pero tokens de revisión casi el doble, ninguna
-tarea a la primera y datos incompletos para comparar versiones. Orden y
-dependencias en `docs/ROADMAP.md`.
-
-- [x] TASK-081 — Revisión más barata: medir y acotar las lecturas de los revisores — cerrada el 2026-11-07
-      *`## Coste` gana las columnas `ronda` y `revisor` (las filas de 9 se siguen
-      leyendo); `registrar-coste` escribe una fila por revisor deduciendo ronda y
-      revisor de su transcripción, y `metricas --tokens` muestra lecturas y
-      CRÍTICO/IMPORTANTE por ronda y revisor. La petición trae `## Contexto
-      permitido` (clave `contexto_revision`), la skill común la sección «Lo que
-      lees» y el informe sus lecturas fuera de contexto. En ronda 2+ se sugiere un
-      modelo un escalón más barato con regla estricta (enmienda de la §16.6).
-      Dogfooding: ronda 1 (sonnet) 12,5 M con 14 lecturas; ronda 2 (haiku,
-      acotada) 1,97 M: el exceso viene del contexto que acumula el revisor, no de
-      leer ficheros. 2 rondas: MEN-1, 2 y 4 corregidos; MEN-3, MEN-5 y dos MENOR
-      de r2 (mayúsculas y `..` en `contexto_revision`) aceptados.*
-- [x] TASK-082 — Autorrevisión del implementador antes de pedir revisión — cerrada el 2026-11-07
-      *La skill `review` manda, antes de `taskctl review` y sin lanzar agente,
-      pasar la `## Que se revisa` de cada revisora, corregir lo evidente y anotar
-      `## Autorrevision` en `tarea.md` (`- <revisora> — <commit>`, sin juicios).
-      `review` avisa sin bloquear si falta con contenido (`core/autorrevision.ts`),
-      y `siguiente --json` da `revisores` en la fase review con el mismo
-      clasificador, desde la merge base (`fs/revisores-rango.ts`). La lista vive
-      solo en cada revisora (ancla unificada en la de C#). Dogfooding: la propia
-      autorrevisión sacó un test que faltaba. 1 ronda, aprobada (9 de 10
-      mutantes muertos): MEN-1 (el `catch` de `siguiente` sin test) aceptado.*
-- [x] TASK-083 — Cierre sin ronda 2 completa cuando solo quedan MENORES — cerrada el 2026-11-07
-      *Medido antes de implementar (`docs/METRICAS.md` §13): 33 de 138 rondas 2
-      (23,9 %) partían de una ronda 1 sin CRÍTICO ni IMPORTANTE y 0 encontraron
-      uno nuevo; por fragmento solo ToolsaWeb TASK-013, cuya ronda no era
-      elegible. `alcanceRondaSiguiente` (pura, fail-closed, junto a la regla de
-      modelo de TASK-081) y `review` la convierte en completa con `--completa`,
-      sin diff de correcciones, con merges o con ficheros no nombrados; la
-      acotada va a un solo revisor con instrucciones de verificación, y tras ella
-      la completa revisa desde la base. `veredicto` avisa de `cambios-solicitados`
-      con solo MENORES. Umbral y salvaguardas, decididos por Carlos. 1 ronda,
-      aprobada sin hallazgos (15 de 15 mutantes muertos).*
-- [x] TASK-084 — Versión del plugin en cada tarea y métricas por versión — cerrada el 2026-11-07
-      *Cada fila de `## Transiciones` lleva como quinta columna la versión de
-      taskctl (`src/core/version.ts`, con test de alineación con `package.json` y
-      `plugin.json`); las de 4 columnas se siguen leyendo y la primera fila con
-      versión amplía solo cabecera y separador. `taskctl metricas --por-version
-      [--json]` agrupa las terminadas por la versión del último `finish`, en orden
-      semver, con rondas, a la primera, hallazgos por severidad y origen y tokens
-      por fase; las sin versión, aparte. Versión subida a 0.12.0 al abrir el ciclo
-      (publicada el 2026-11-07). 1 ronda, aprobada: MEN-1 y MEN-2 (dos huecos de test, el
-      código es correcto) y MEN-3 (separador con alineación) aceptados.*
-- [x] TASK-085 — Coste de implementación registrado automáticamente — cerrada el 2026-11-07
-      *Hook en `Stop` y `SubagentStop` que solo anota rutas de transcripción en
-      `.git/coste-pendiente.jsonl` (guardas baratas, ningún proceso sin tarea en
-      curso, siempre exit 0). `review` suma, en su commit, lo gastado entre el
-      `start` y el `review` en la rama y el repo de la tarea (`timestamp`,
-      `gitBranch` y `cwd` de cada línea), descontando lo ya anotado (`dif:`);
-      `finish` repite como red. Decisiones de Carlos: el hilo principal cuenta,
-      volcado en review/finish, las 97 tareas viejas de ToolsaWeb fuera. Probado
-      en la propia tarea (+14,3 M de implementación). 2 rondas: MEN-1 y MEN-2
-      (tests de la red de finish y del guard de campos negativos) corregidos.*
-- [x] TASK-086 — Descontar las pausas de las duraciones de las métricas — cerrada el 2026-11-07
-      *Cada racha de `pausa` dura hasta la siguiente transición que no sea
-      pausa y se resta de diseño, curso, revisión y `total`; una pausa abierta
-      no descuenta y con precisión de día tampoco. `--json` gana la lista
-      `pausas` con `enPausa` por tarea; §14 de `docs/METRICAS.md`. Revisión: 2
-      rondas (MEN-1, empate de segundo con origen git, y MEN-2, doc, corregidos).*
-- [x] TASK-087 — `taskctl doctor` avisa si el plugin instalado está desactualizado — cerrada el 2026-11-07
-      *Comprobación `version-plugin` de doctor: compara la versión instalada
-      (`installed_plugins.json`) con la copia local del marketplace, sin red.
-      Disponible mayor da AVISO con los comandos `claude plugin marketplace
-      update` y `claude plugin update`; lo no comprobable es `omitida`; nunca
-      error, así que el código de salida no cambia. Dos rondas (MEN-1 y MEN-2
-      corregidos, MEN-3 aceptado).*
-- [x] TASK-088 — `taskctl doctor` avisa si falta `comando_verificacion` con tests detectables — cerrada el 2026-11-07
-      *Sin la clave, `verificacion` da AVISO si la raíz tiene tests detectables
-      (`package.json` con `test` propio, Cargo, Maven, Gradle, .NET, Go, pytest) y
-      propone el comando (gestor según el lock, wrappers, varios con `&&`); sin
-      tests sigue `omitida`. Revisión: 2 rondas, 3 MENOR corregidos, aprobada.*
-- [x] TASK-089 — Evitar literales con forma de secreto en el repo y tags de versión que faltan — cerrada el 2026-11-07
-      *Las claves falsas de los tests viven troceadas en `test/helpers/claves-falsas.ts`, y
-      `test/empaquetado/sin-literales-secretos.test.ts` recorre `git ls-files` con los patrones de
-      push protection (sin `\b` delante: una clave tras un `\n` escrito como texto también casa) y
-      una lista blanca de tres valores exactos de informes históricos. Tags anotados v0.9.0
-      (`df59da2`) y v0.10.0 (`b85f37e`) creados y en origin. Revisión: aprobada en ronda 1, dos
-      MENOR aceptados (solo mira lo rastreado; los patrones son un subconjunto de los de GitHub).*
-- [x] TASK-090 — El guardián de secretos tolera excepciones solo en su fichero histórico — cerrada el 2026-11-07
-      *Fix de TASK-089: GitHub bloqueó el push de develop porque el plan de TASK-089
-      citaba entera la clave de ejemplo de Stripe y el guardián la toleraba por valor
-      (Carlos la permitió en GitHub, sin reescribir historial). Ahora solo
-      `AWS_EJEMPLO` vale en cualquier fichero; Stripe y Slack, como parejas exactas
-      fichero+valor de los informes históricos de TASK-066 y TASK-089, y una pareja
-      sin uso es rojo. 1 ronda, aprobada, 8 mutantes en rojo; MEN-1 (apariciones sin
-      límite en su fichero) y MEN-2 (AWS por valor) aceptados. Publicada en 0.12.0.*
-
-## ✅ O — Verificación selectiva por impacto (1/1)
-
-Pedida por Carlos el 2026-11-09 desde ToolsaWeb, donde la verificación completa ya
-tarda unos 40 minutos y se repetía en cada ronda de revisión.
-
-- [x] TASK-091 — Verificación selectiva por impacto en las rondas y completa obligatoria antes de integrar — cerrada el 2026-11-09
-      *Clave `comando_verificacion_selectiva` (+ timeout) que recibe la base en
-      `RAMA_BASE`; la usan el hook `Stop` y `review`, que la corre antes de escribir
-      la ronda (rojo o árbol sucio abortan sin ronda; la petición la cuenta y omite
-      la cobertura). La completa sigue siendo la puerta de `finish` y del guardián:
-      selectiva sin completa aborta y su memo va aparte. `doctor` avisa si falta.
-      Guía `skills/task-workflow/verificacion-selectiva.md`. 5 rondas: las 2 a 4
-      por la misma frase del mensaje de `review` (describía un momento, no un
-      estado); MEN-1 de la ronda 5 aceptado. Publicada en 0.13.0.*
-
-## ⏳ P — Agilidad sin perder calidad (14/19)
+## ⏳ P — Agilidad sin perder calidad (19/20)
 
 Pedidas por Carlos el 2026-11-10 desde ToolsaWeb (TASK-295), donde la 0.13 ha
 hecho perder agilidad: la verificación completa se repite por causas que no son
diff --git a/docs/contexto/CONVENCIONES.md b/docs/contexto/CONVENCIONES.md
index f60471b..308f7b7 100644
--- a/docs/contexto/CONVENCIONES.md
+++ b/docs/contexto/CONVENCIONES.md
@@ -121,6 +121,12 @@ compila un `cli.ts` distinto.
 - Cuando una tarea descubre algo que contradice el plan, se anota en el propio
   documento, no se calla.
 - Nada se marca como hecho sin haberlo ejecutado.
+- **Lo cerrado se archiva** en `docs/contexto/archivo/`, movido tal cual (no
+  se resume ni se borra), para que lo que se lee en cada tarea no crezca con
+  el proyecto. Topes de lo vivo, en bytes (`wc -c`):
+  `CHECKLIST_TERMINACION.md` 20 480 y `ESTADO.md` 10 240; hay un test que los
+  comprueba. `ESTADO.md` se actualiza al cerrar cada tarea, o como mucho cada
+  14 días.
 
 ## La paradoja de bootstrapping
 
diff --git a/docs/contexto/ESTADO.md b/docs/contexto/ESTADO.md
index 12ede08..f780bd9 100644
--- a/docs/contexto/ESTADO.md
+++ b/docs/contexto/ESTADO.md
@@ -1,562 +1,123 @@
 # Estado del proyecto — handoff
 
-> Última actualización: **2026-10-05** (fase 6 de la auditoría cerrada, v0.5.0: el plan de la auditoría, terminado).
-> Este documento se actualiza al cerrar cada fase. Si lo que dice no cuadra
-> con el repo, gana el repo — y hay que corregir esto.
-
-## Auditoría del 2026-10-03 — en curso (fase F)
-
-Plan: `docs/auditoria/PLAN-SOLUCION-2026-10-03.md`. Se ejecuta en continuo,
-una tarea tras otra, con release y aviso a OpenGisViewer al cerrar cada fase.
-
-- **v0.1.1** — TASK-033: comando de sincronización tras cada transición.
-- **v0.1.2** — fase 1 (TASK-034, 035, 036): revisión más barata (excluir lo
-  generado del diff, una suite por ronda, `taskctl veredicto`).
-- **v0.1.3** — fase 2 (TASK-037, 038, 039): Git-Flow con menos procesos y una
-  sola detección de origin.
-- **v0.2.0** — fase 3 (TASK-040): ronda 2 de revisión incremental.
-- **v0.3.0** — fase 4 (TASK-041, 042, 043, 044, más TASK-046 y TASK-053):
-  tareas concretas y acotadas. Métrica: contra las 27 tareas cerradas, la
-  puerta de `plan` habría bloqueado solo TASK-029, 030 y 032 (las de
-  peticiones de 110-160 KB), y la partición propuesta de las tres coincide
-  con la que se hizo a mano. Una tarea `simple` lanza 1 agente en vez de 3.
-- **Fase G** (urgente, pedida por Carlos el 2026-10-04; TASK-055 a 059):
-  el plugin conduce el ciclo. Fases como skills (`/taskcode-plugin:<fase>`),
-  `taskctl siguiente` decide el paso, `modo_flujo` manual / semiautomatico /
-  automatico congelado en la tarea, registro `## Transiciones`, `taskctl
-  pausa`, cadena con bloqueo por arbol que hace cumplir el CLI, y el
-  automatico con sus guardas (lo cerrado = lo revisado, tope de 3 rondas,
-  hotfix/release preguntan). Ademas `taskctl.cmd` y la funcion de perfil de
-  PowerShell. Pendiente: smoke dentro de una sesion de Claude Code (este
-  entorno no autentica `claude -p`).
-- **v0.4.0** — fase G entera y fase 5 (TASK-045, 046, 047, 054): `rama_base`
-  de punta a punta; un flag desconocido aborta en todo el CLI con sugerencia;
-  `review` separa agente/modelo de la skill revisora; rutas no ASCII y de glob
-  llegan con su diff a la petición de su dominio.
-- **v0.5.0** — fase 6 (TASK-050, 051, 048, 049, 052): `npm run test:rapido`
-  (357 tests en ~11 s) y suite completa de 633 a 436 s de media (partiendo
-  los ficheros largos); skill de flujo de 22 a 13 KB y lo común de las
-  revisoras en un solo sitio; `plugin.json` completo y licencia MIT;
-  `## Transiciones` con instante UTC, `taskctl metricas` y heurística
-  recalibrada (`nivel_trivial_hasta` 1 → 0). La nueva cola de la suite:
-  `siguiente`, `distribucion`, `plan-brainstorm`, `plan`.
-- **v0.6.0** — TASK-023 (E2): coste en tokens por fase.
-  `taskctl registrar-coste --agente <id>` suma el uso real de la transcripción
-  de cada subagente, `taskctl metricas --tokens [--escribir]` lo agrega, y la
-  §11 de `docs/METRICAS.md` trae el histórico de 41 tareas. Con esto **el plan
-  de terminación está completo: 69/69**.
-  Y TASK-060: `finish` con `--tag`, `--merge-request` (GitHub/GitLab) y la
-  clave `cierre_por_defecto`.
-- **Pendiente**: el smoke del flujo guiado dentro de una sesión real de Claude
-  Code (lo hace Carlos).
+> Última actualización: **2026-11-12** (TASK-124 en curso).
+> Se actualiza al cerrar cada tarea, o como mucho cada 14 días; tope 10 240 B
+> (ver `CONVENCIONES.md`). Si lo que dice no cuadra con el repo, gana el repo
+> — y hay que corregir esto.
+>
+> Lo anterior (la historia de las fases A a G, sesión a sesión, hasta la
+> 0.5.0) está en [`archivo/ESTADO-hasta-2026-11-12.md`](archivo/ESTADO-hasta-2026-11-12.md).
 
 ## Dónde estamos
 
-**41 de 42 items del plan de terminación (98%).** Sprint 0 y Sprint 1
-completos (TASK-001 a TASK-012), **las Fases A, B, C y D cerradas enteras**,
-y la Fase E a un solo item de cerrarse del todo: E1, E3, E4, E5 y E6 hechos;
-solo queda **E2 (TASK-023, sin empezar)**.
-
-El total ha bailado dos veces: subió de 42 a 43 cuando la revisión de C5 abrió
-**E6** (la distribución del CLI del plugin, ya cerrada en TASK-031), y ha
-vuelto a 42 al descartarse **D4** con datos delante.
-
-La Fase D se cerró con D1 (TASK-016, brainstorm paralelo por roles),
-D2 (TASK-017, catálogo de skills determinista), D3 (TASK-018, enrutado de
-revisor por diff real fragmentado por dominio) y D5 (TASK-020, `taskctl
-codex-review`) — cada una con su propio ciclo completo de revisión por
-pares (D3 y D5 con hallazgos reales de plataforma corregidos en el propio
-ciclo, no solo de diseño). Detalle línea a línea de cada una en
-`docs/contexto/CHECKLIST_TERMINACION.md`, que es donde de verdad se
-mantiene al día — este documento resume, no repite.
-
-**El ciclo de vida está completo y con reglas de proceso encima que de
-verdad se aplican**: `import → plan → approve → start → review → finish`
-funciona de punta a punta contra un repo Git real, y TASK-013, 014, 015,
-024, 025, 026, 027 y 028 se gestionaron enteras con la propia herramienta.
-`asignado_a` se rellena solo con `git config user.email` (C7), el límite de
-una rama de trabajo por persona funciona mirando las ramas reales (C8), los
-cinco wrappers de Git-Flow ya existen (C1), la carpeta de tarea tiene ya
-la forma que describe la sección 2 de la metodología: `tarea.md` +
-`planificacion/` + `revision/` (C3), y **el plugin por fin expone algo a
-Claude Code**: la skill `task-workflow` (C5). Y los scripts de Git-Flow han
-dejado de arrastrar su deuda: guard de `origin` en los tres que faltaban, el
-registro fuera del workspace del usuario, los mensajes citando `taskctl` en
-vez de menus de IntelliJ, y `abort-merge` viendo cherry-picks y reverts a
-medias (C6). **472 tests** (469 verdes; los 3 rojos son los conocidos de
-este entorno Windows).
-
-Lo que queda es un solo item: las métricas de coste en tokens por fase (E2).
-**El corte mínimo
-defendible —Fases A + B + C— está alcanzado desde hace tiempo**, y ahora
-también la Fase D entera: el sistema es completo, usable y con toda la
-inteligencia de proceso opcional que se planteó, encima.
-
-**Todo subido** (2026-09-07): `develop` está a la par con `origin/develop` y
-las 24 ramas locales existen en el remoto. El repo tiene `origin`
-(`github.com/charliebk/TaskCode.git`) y responde — durante un tiempo estos
-documentos afirmaron que no lo tenía, y era falso.
-
-Hasta hoy el desfase llegó a **41 commits y 4 ramas** sin subir, acumulados en
-una sola sesión de trabajo. Es la tensión que trae la decisión #14, tomada a
-conciencia: `taskctl` commitea pero **no sube** sin `--push`, así que publicar
-depende de que alguien se acuerde. Con la política IECA de no borrar ramas,
-lo que se olvida no se reabsorbe: crece. Conviene subir al cerrar cada item,
-no al cerrar el sprint.
-
-
-## Qué acaba de pasar (sesión del 2026-09-05, segunda parte)
-
-Se cerró el hito real de usabilidad: **la Fase B está a dos items** y el
-ciclo de vida completo ya funciona.
-
-1. **B2** — guard de `origin` en `merge-hotfix-to-main.sh` y
-   `merge-release-to-main.sh`, extraído a `detect_origin_available`. La
-   revisión añadió un matiz importante: "origin configurado pero caído" NO
-   es lo mismo que "sin origin" y aborta, porque el tag se crearía sobre
-   una `main` posiblemente obsoleta.
-2. **B1** — TASK-013, `taskctl review`. El CLI hace lo determinista (update
-   verificado con `merge-base`, mover a `03-en-revision/`, petición con el
-   diff real + scaffold del informe) y el agente lo dispara el orquestador.
-3. **B3** — TASK-014, `taskctl finish`. Cerró su propia tarea: primer
-   cierre de punta a punta. Resuelve la colisión de IDs con dos
-   discriminadores (título distinto y linaje sin ancestro común) y tiene
-   camino idempotente de reintento tras un conflicto de backmerge.
-4. **B4** — histórico de Sprint 0 y 1 en `CHANGELOG.md` y `docs/INDEX.md`
-   (los tres artefactos ya los había creado `finish`).
-5. **B5** — divergencia de `board` resuelta: `taskctl board --escribir`
-   regenera `docs/BOARD.md`; sin el flag sigue siendo de solo lectura.
-
-**Dogfooding real**: TASK-013 y TASK-014 recorrieron `plan → approve →
-start → review → finish` con la propia herramienta. 275 tests, ~95% de
-cobertura.
-
-**Pendiente operativo**: nada. Todo está subido a `origin` — `develop` y las
-cinco ramas de tarea de estas sesiones.
-
-## Qué acaba de pasar (sesión del 2026-09-05, tercera parte): B6 y B7
-
-**B6** — `--asignado-a` en `plan` y `start`, la precondición de B7. El flag
-vive en un módulo compartido (`src/cli/asignado.ts`) que usan los tres
-comandos que lo tocan, `plan`, `start` y `board`. Sin flag se **conserva** el
-`asignado_a` que hubiera, así que `start` hereda lo que dejó `plan`, que es
-lo que describe la §8.2. La revisión por pares encontró un IMPORTANTE real:
-`board --asignado-a` (el nombre canónico que B6 acababa de introducir y que
-sale en la ayuda) se ignoraba en silencio y devolvía **el tablero entero** con
-código 0 — el mismo fallo que el propio commit usaba para justificar el
-alias, sin cerrar el otro lado. 307 tests.
-
-**B7** — TASK-015, límite de WIP, cerrado. Es el primer item que impone
-una regla de proceso, no una capacidad: `taskctl start` aborta si la
-persona asignada ya tiene otra tarea en `02-en-curso` o en
-`03-en-revision`. En diseño no hay tope. Diverge de la §8.2 (que pide dos
-límites, uno sobre el diseño) y esa es hoy la mayor divergencia del
-proyecto: documentada en HALLAZGOS, no reescrita.
-
-La revisión por pares fue la más dura hasta ahora — 16 casos de ataque y
-8 mutaciones del código fuente — y su hallazgo IMPORTANTE fue justamente
-que la divergencia no estaba documentada. 345 tests.
-
-## Qué acaba de pasar (sesión del 2026-09-06): C7 y C8
-
-Los dos items cierran el bloque que arrancó con B6, y se sostenían unos a
-otros: `--asignado-a` → identidad Git → límite de WIP funcionando.
-
-**C7 (TASK-024)** — `asignado_a` sale de `git config user.email`, con la
-precedencia `--asignado-a` > asignado previo > identidad Git > `null`. Que
-el previo gane a la identidad es lo que impide quedarse la tarea de otra
-persona sin decirlo. Migradas 12 tareas a `charlie.bk@gmail.com` (antes
-convivían `charlie.bk` y `carlos` para la misma persona).
-
-**C8 (TASK-025)** — el límite de WIP de B7 **no protegía nada** y nadie lo
-había notado. Leía el árbol de la rama activa, y el paso a `02-en-curso` se
-commitea en la rama de la tarea. Ahora mira las ramas locales sin mergear.
-
-**Las dos revisiones por pares fueron las más duras hasta ahora**, y las dos
-encontraron cosas de peso: un CRÍTICO en C7 (un `user.email` con un salto
-de línea inyectaba una clave en el frontmatter que pisaba `estado` y dejaba
-la tarea ladrillada) y un **RECHAZO** en C8 (para un `hotfix`, 18 ramas ya
-cerradas contaban como abiertas y el camino urgente quedaba inutilizable).
-Ambos corregidos y verificados en el repo real.
-
-Lo que hay que llevarse de aquí está en `HALLAZGOS.md`: **un smoke test que
-ejecuta los comandos en el orden más cómodo confirma lo que ya creías.** El
-de B7 encadenaba dos `start` seguidos, el único orden en el que su límite
-funcionaba, y por eso el fallo pasó su revisión.
-
-## Qué acaba de pasar (sesión del 2026-09-06, segunda parte): C1
-
-**C1 (TASK-026)** — los cinco wrappers de Git-Flow: `taskctl diagnose`,
-`pause`, `resume`, `recover` y `abort-merge`. La §8.3 llevaba desde el
-diseño remitiendo a `taskctl pause` en su mensaje de workspace sucio; ahora
-ese comando existe, y el mensaje lo nombra.
-
-**Parecía enrutar a `bash` y no lo era: el nudo estaba en el stdin.** Cuatro
-de los cinco scripts preguntan con `read -rp`, y `runGitflowScript` invocaba
-con la entrada ignorada desde TASK-007. Con EOF, `pause` sobre un workspace
-sucio moría con `Opcion no reconocida` y `abort-merge` con un merge en curso
-**no abortaba nada y salía con 0**: los dos comandos que más falta hacen
-harían lo contrario de lo que dicen.
-
-La regla que queda para cualquier invocación futura, en `HALLAZGOS.md`:
-**stdin heredado solo cuando hay terminal, ignorado cuando no la hay**, más
-un guard que corta antes de invocar si el valor por defecto del script sería
-inaceptable.
-
-**Dos rondas de revisión por pares.** La primera, APROBADO CON CAMBIOS: 2
-importantes y 7 menores. Los dos importantes fueron de fondo — (a) `pause`
-preguntaba igual con el workspace limpio, porque **todos los scripts se
-escriben el registro en `logs/gitflow/` dentro del repo** y se ensucian el
-workspace ellos mismos; (b) heredar stdin siempre **reintroducía el cuelgue
-indefinido** que motivó el `'ignore'` de TASK-007 — con una tubería abierta
-que nadie cierra (cualquier arnés de agente, y también `node --test`) el
-comando esperaba para siempre, reproducido con el proceso vivo a los 15 s y
-el repo a medias. La segunda ronda, APROBADO: 3 menores, uno corregido (el
-guard nuevo daba falsos positivos porque preguntaba por `logs/` en vez de
-por el fichero que se escribe).
-
-**Lo que C1 le descubrió a C6** —registro dentro del repo, mensajes que
-remiten a los menús de IntelliJ, `abort-merge.sh` ciego a los cherry-picks—
-se cerró el 2026-09-07 con TASK-029, junto al bug de `origin` que era el
-enunciado original del item. Ver más abajo.
-
-**Limitación que queda a propósito**: `taskctl pause` sigue sin servirle a un
-agente sin terminal, que es quien más lo necesitaría. Resolverlo pide un
-`pause --stash` / `--commit`, o sea tocar los scripts, que es la capa que la
-§7.1 declara única fuente de verdad. No se hizo por cuenta propia.
-
-## Qué acaba de pasar (sesión del 2026-09-06, tercera parte): C3
-
-**C3 (TASK-027)** — la carpeta de tarea tiene ya la forma que describe la
-sección 2 de la metodología: `tarea.md` + `planificacion/` + `revision/`.
-`taskctl plan` crea `planificacion/` y escribe ahí el `plan-final.md`;
-`revision/` la creaba `review` desde B1.
-
-**El nudo no era la ruta nueva, era el legado.** Toda tarea planificada con
-la versión anterior del CLI tiene su `plan-final.md` suelto en la raíz de la
-carpeta, y mirar solo la ruta nueva habría dejado a `approve` diciendo "no
-hay plan que aprobar" sobre una tarea que sí lo tiene. Así que `approve`
-acepta las dos ubicaciones, y una re-planificación **migra** el fichero
-legado a `planificacion/` con `rename`, conservando el contenido en vez de
-pisarlo con el scaffold. Si aparecen los dos a la vez, `plan` y `approve`
-**fallan cerrado** sin tocar nada: no eligen por su cuenta cuál gana.
-
-Las 6 tareas ya cerradas en `04-terminadas/` (TASK-013, 014, 015, 024, 025 y
-026) se migraron con `git mv` — rename puro, 0 líneas cambiadas —, así que
-**ya no queda ningún `plan-final.md` suelto en el repo**.
-
-**Revisión por pares ronda 1: APROBADO CON CAMBIOS** (1 importante, 4
-menores), reproducida sobre un clon con smoke test propio y 7 mutantes. El
-importante es la lección que queda: **una reestructuración puede quitar
-cobertura sin quitar comportamiento**. La escritura del scaffold iba con el
-flag `'wx'`, que protege contra pisar un plan existente; el camino nuevo de
-migración pasa por `rename`, y el revisor lo demostró ejecutando el mismo
-mutante en las dos ramas — en `develop` un test se ponía rojo, en la rama
-nueva no. Aplicados todos los hallazgos salvo la parte (a) del #4 (el
-`rename` no tiene un equivalente exclusivo del `'wx'` porque POSIX no lo
-ofrece), documentada sin corregir. 12 tests nuevos, **429 en total**.
-
-La **ronda 2** pidió cambios y, tras corregirlos, aprobó. Su hallazgo importante es el que deja poso: el fix de la ronda 1 estaba validado solo en Windows. En POSIX `stat("planificacion/plan-final.md")` devuelve `ENOTDIR` cuando `planificacion` es un fichero, no `ENOENT`, así que en Linux morían con un error crudo tanto `plan` como `approve` — y **el propio test escrito para certificar ese fix habría fallado en el job `ubuntu-latest`**. El revisor lo confirmó corriendo el código en Linux de verdad. Está en `HALLAZGOS.md`: un fix de errno validado en una sola plataforma no está validado.
-
-## Qué acaba de pasar (sesión del 2026-09-07): C5
-
-**C5 (TASK-028)** — `skills/task-workflow/SKILL.md`, la primera skill del
-plugin. Hasta ahora el plugin era, en la práctica, un CLI y unos scripts
-Bash: **no exponía ni un solo artefacto a Claude Code**, así que todo el
-discurso de la metodología sobre "el agente sabe qué hacer" no estaba
-respaldado por nada. Ahora hay una skill, `taskcode-plugin:task-workflow`,
-de 272 líneas: cuándo aplica y su prerrequisito, el ciclo de vida con sus
-precondiciones, los comandos reales con su firma exacta, la lista de lo que
-**no** existe, 9 reglas de proceso con su motivo, la revisión por pares, la
-tabla literal de qué líneas de veredicto acepta `finish`, y las trampas.
-
-**El fichero es corto; el riesgo estaba entero en el contenido.** Un agente
-se cree lo que lee en una skill, así que un flag inventado o un estado mal
-ordenado no es una errata: es una fuente de errores *con autoridad*. Por eso
-la superficie del CLI se extrajo del **código** —`cli.ts`,
-`state-machine.ts`, `wip.ts`, `git.ts`—, no del README ni de la metodología,
-que en tres puntos ya no la describen. Las tres divergencias, detectadas y
-**no** heredadas: (a) `taskctl codex-review` no existe pese a estar modelado
-en la máquina de estados y en la tabla de la §8 —y `revision_codex: true`
-deja la tarea **imposible de cerrar**, porque `finish` la rechaza y remite a
-un comando inexistente—; (b) el guard de la §8.3 solo lo aplican 4 de los 8
-comandos; (c) `plan` no es multi-agente.
-
-**Lo que viaja y lo que no.** La skill se distribuye a proyectos que no son
-este, así que se quedó fuera todo lo de TaskCode: el checklist,
-`docs/contexto/`, los nombres de helpers internos. Viaja la regla, no la
-instancia — el revisor lo comprobó buscando 20 marcas del repo, con cero
-coincidencias. El frontmatter lleva solo `name` y `description`: la
-intersección entre lo que acepta Claude Code y lo que admite el spec
-portable.
-
-**La lección, ya en `HALLAZGOS.md`: una prueba que solo puede pasar cuando
-algo está roto no es una prueba.** La especificación inicial decía
-"comprobar que `claude plugin validate` imprime `Validating skill:`", y está
-invertida: el validador solo nombra las skills que **fallan**, así que ese
-test habría pasado únicamente con la skill rota. Se detectó porque el
-validador pasó limpio sin mencionarla y esa ausencia, en vez de darse por
-buena, se convirtió en la pregunta. La prueba correcta es la contraprueba:
-romper el frontmatter de una *copia*.
-
-**Dos rondas de revisión por pares**: la primera pidió cambios (1
-importante, 5 menores) y la segunda aprobó. El importante era de los que
-duelen: `CLAUDE.md` decía 429 tests y en esta rama son 444 — la cifra se
-midió en `develop`, antes de que existieran los 15 tests de la propia tarea,
-y mergearla así **habría reproducido el defecto que la corrección venía a
-arreglar**. De paso se corrigió que `review` y `finish` "no existen" (se
-cerraron en B1 y B3) y se anotó la trampa de los 3 rojos de Windows.
-**15 tests nuevos, 444 en total.**
-
-**Item nuevo que deja abierto**: en un clon recién hecho el plugin no trae
-un `taskctl` que funcione (`dist/` ignorado, sin `bin` declarado). Es un
-problema de empaquetado, no del ciclo de vida, y va a la Fase E como **E6**.
-
-## Qué acaba de pasar (sesión del 2026-09-07, resto): C6, C2 y C4
-
-Tres items más en la misma sesión, todos con **agentes en paralelo dentro de
-una sola rama** (norma del proyecto) e integración en serie.
-
-**C6 (TASK-029)** cerró los cuatro frentes de deuda de los scripts de
-Git-Flow: guard de `origin` en los tres que faltaban, el registro fuera del
-workspace del usuario (`.git/taskcode/gitflow/`, resuelto con `--git-path`
-para que valga en worktrees), los mensajes citando `taskctl` en vez de menús
-de IntelliJ, y `abort-merge` viendo cherry-picks y reverts. Al medirlo
-apareció un **tercer testigo que el plan no preveía**: `.git/sequencer/`.
-
-**C2 + C4 (TASK-030)**, dos items en una rama porque el límite de WIP es 1.
-`taskctl` ya commitea lo que escribe —una ruta a una, nunca `add -A`— y
-`.taskcode/config.yml` existe con tres claves opcionales.
-
-**El patrón que más se repitió no fue un bug, fue una forma de equivocarse**:
-afirmar sin medir. Ocurrió cinco veces y las cinco lo cazó quien lo tocó
-después —
-
-- el plan decía que dos scripts usaban una función compartida, y no la usaban;
-- decía que dos testigos bastaban para detectar un cherry-pick, y faltaba uno;
-- decía que el parser soportaba comentarios `#`, y solo los inline;
-- decía que `start`/`review`/`finish` no comprueban el workspace, y sí lo hacen;
-- y `limite_wip` se dio por bueno tras probarlo a mano con el CLI, sin test:
-  deshacer la línea que lo cablaba no rompía nada.
-
-El último es el más incómodo y el más útil: **verificado a mano no es
-verificado**. Está en `HALLAZGOS.md` junto al patrón hermano de C6 (medir lo
-que no discrimina: comparar HEAD antes/después parecía empírico y daba el
-mensaje del caso raro en el caso normal).
-
-## Qué acaba de pasar (sesión del 2026-09-07, final): D6 y D7
-
-**TASK-032** cerró de una vez los dos items de la Fase D que no dependían de
-nada: las cuatro skills revisoras (D6) y los roles de brainstorm más la
-heurística de complejidad (D7). Van juntos porque ninguno depende del otro y
-el límite de WIP es 1 — mismo precedente que TASK-030 (C2+C4).
-
-**El plugin pasa de exponer una skill a exponer cinco skills y cuatro
-agentes.** Nueve artefactos de contenido, **cero líneas en `src/`**, 93 tests
-nuevos: la suite va de 537 a **630** (627 verdes; los 3 rojos son los
-conocidos de Windows).
-
-**Cuatro agentes en paralelo dentro de la misma rama** para implementar, y
-tres rondas de revisión con **tres revisores independientes cada una**. 31
-hallazgos, **cero críticos**, todos aplicados.
-
-**Lo que deja para el futuro está en `HALLAZGOS.md`, y es lo mejor de la
-tarea**: el patrón de que *la corrección de un hallazgo llega sin la red que
-impide deshacerla* se repitió las tres rondas, y de ahí salieron **siete
-aserciones que no podían fallar**. La peor: el test que exigía «reproducir
-empíricamente» se satisfacía con una etiqueta que **otro test obliga a que
-esté presente**, así que borrar la sección entera de método de una skill
-—2399 bytes— dejaba la suite verde.
-
-Dos hallazgos fueron defectos **de las propias correcciones**, no del trabajo
-original: el recorte de patrones que dejó ciega a la skill de Angular ante la
-convención de Angular ≥20, y la excepción de `hotfix` que, escrita como
-sustitución, **subía** de 0 a 1 los agentes de un hotfix trivial — la clave
-que existe para abreviar el brainstorm añadiendo uno.
-
-**Divergencia nueva y documentada**: el YML dice `alta` donde la §16.1 y la
-decisión #2 dicen `compleja`, porque `validateTask` rechaza `compleja` y tres
-tareas reales (TASK-016, 017 y 018) declaran `alta`.
-
-**D4 descartado** por Carlos antes de empezar, con el dato delante: no existe
-ni una tarea `trivial` en el historial, así que la regla casi nunca se
-activaría. La Fase D baja de 7 a 6 items.
-
-## Qué sigue: el resto de la Fase D
-
-Quedan **D1, D2, D3 y D5**, en ese orden. D1 y D2 ya tienen debajo lo que
-necesitaban (`agents/`, la tabla de agentes por nivel y los
-`patrones_archivo` de los cuatro revisores), así que arrancan sin trabajo
-previo. **D5** sigue siendo el que cierra un agujero real: hoy
-`revision_codex: true` deja la tarea imposible de cerrar, porque `finish` la
-rechaza y remite a un comando que no existe.
-
-## Qué se hizo antes: E6 primero, luego la Fase D
-
-**Decidido con Carlos el 2026-09-07, al cerrar la Fase C.** El orden no es
-negociable por dos motivos, uno de criterio y otro mecanico:
-
-1. **E6 va antes que toda la Fase D.** En un clon recien hecho el plugin no
-   trae un `taskctl` que arranque: `dist/` esta ignorado y nadie declara
-   `bin`. Toda la Fase D construye encima de una herramienta que, hoy, quien
-   clone el repo no puede ejecutar. Arreglar el escaparate antes de seguir
-   llenandolo.
-2. **El limite de WIP es 1**, asi que E6 tiene que estar cerrada (mergeada
-   con `taskctl finish`) antes de arrancar cualquier tarea de D. No es una
-   preferencia: `taskctl start` aborta si hay otra tarea abierta.
-
-E6 lleva **rama propia**, como cualquier tarea: la crea `taskctl start` y la
-mergea `finish` con `--no-ff`, sin borrarla (politica IECA).
-
-Orden sugerido dentro de la Fase D, una vez cerrada E6:
-
-- **D7 primero** (`heuristica-complejidad.yml` + los roles de `agents/`):
-  alimenta a D1 y D2, asi que hacerlo despues obligaria a rehacer trabajo.
-- **D6 en paralelo** (las 4 skills revisoras): no depende de nada.
-- **D4 al final, o no hacerlo.** La decision #17 lo dejo aplicando **solo a
-  `trivial`**, y en todo el historial no hay ni una tarea `trivial`: son ~3h
-  para un camino que en la practica no se recorre. Conviene decidir si vale
-  la pena antes de gastarlas.
-
-**La Fase C se cerró entera el 2026-09-07** con TASK-030 (items C2 y C4), que
-fue lo último que le faltaba. Las decisiones #14 y #9 se resolvieron ese mismo
-día: la #14 con *commitea sí, sube solo con `--push`*; la #9 con tres claves
-opcionales (`rama_base`, `agente_revisor_por_defecto`, `limite_wip`) y, sobre
-todo, con la forma del mecanismo. Ver sus entradas en
-`CHECKLIST_TERMINACION.md`.
-
-Con A, B y C cerradas, **el corte mínimo defendible está alcanzado**. Lo que
-queda es opcional (D, la inteligencia del proceso: brainstorm multi-agente,
-heurística de complejidad, revisión ligera) y el cierre (E), donde vive el
-item más urgente de los que quedan: **E6**, que el plugin no se distribuye
-con un CLI que funcione.
-
-**Decisiones abiertas que siguen bloqueando**: la Fase D depende de la #1,
-#2, #11, #15, #16 y #17. Ninguna bloquea la Fase E.
-
-1. ~~**C1**~~ — hecho el 2026-09-06 (TASK-026), ver arriba.
-2. **C2** — el paso 5 de la §8.3 (¿`taskctl` commitea y sube por la
-   persona?). **Bloqueado por la decisión #14.** La evidencia a favor no
-   para de crecer: sin él, `import` no se puede ejecutar dos veces
-   seguidas, cada tarea necesita cuatro o cinco commits manuales, y una
-   rama cuyo movimiento de tarea no esté commiteado es invisible para el
-   límite de WIP (C8).
-3. ~~**C3**~~ — hecho el 2026-09-06 (TASK-027), ver arriba.
-4. **C4** — `.taskcode` con su `config.yml`. **Bloqueado por la decisión
-   #9**, que ya tiene dos candidatos claros a contenido salidos de B7 y C7:
-   el tamaño del límite de WIP y qué cuenta como una misma persona.
-5. ~~**C5**~~ — hecho el 2026-09-07 (TASK-028), ver arriba.
-6. ~~**C6**~~ — hecho el 2026-09-07 (TASK-029). Los cuatro frentes, con
-   cuatro agentes en paralelo dentro de la misma rama. Costó ~5h, no la ~1h
-   que decía la estimación original (que era de cuando el item era solo el
-   bug de `origin`). Dos afirmaciones del plan resultaron falsas al medirlas,
-   y el primer arreglo de un hallazgo de revisión también: está en
-   `HALLAZGOS.md`.
-
-## Decisiones: ninguna abierta (2026-09-07)
-
-**Las diez decisiones de la lista están resueltas.** Ya no queda ninguna
-bloqueando trabajo. Cronología: la #12 y la #13 cerraron la Fase B; la #14 y
-la #9 desbloquearon la Fase C el 2026-09-07; y ese mismo día se cerraron de
-una tanda las seis que bloqueaban la Fase D — **#1, #2, #11, #15, #16 y
-#17**. Están todas en `CHECKLIST_TERMINACION.md` con su razonamiento.
-
-Cuatro de esas seis se decidieron **con datos, no con criterio**, y conviene
-que eso no se pierda:
-
-- **#17** (revisión ligera solo para `trivial`): de las 4 tareas `simple`
-  cerradas, **una escondía un CRÍTICO** y las cuatro tuvieron importantes.
-  Abaratar `simple` habría dejado pasar el peor bug del proyecto.
-- **#15** (pesos de la heurística): no se pudieron validar con datos porque
-  **no los hay** — el historial entero son 6 `media` y 4 `simple`, sin una
-  sola tarea `trivial`, `compleja` ni `crítica`.
-- **#11** (plugins instalados): `claude plugin list --json` verificado
-  ejecutándolo. Y lo que **no** sirve: `plugin validate`, que solo nombra las
-  skills que fallan.
-- **#1** (checkpoint humano siempre): hoy ya es obligatorio, así que cuesta
-  cero código — y en la sesión del 2026-09-07 tres planes llegaron a
-  aprobación con premisas falsas.
-
-Consecuencia para la Fase D que conviene mirar antes de empezarla: como no
-existe ninguna tarea `trivial`, **la regla de la #17 casi nunca se activará**,
-lo que deja a **D4 (~3h) sin apenas valor**. Merece decidirse si se implementa
-antes de gastarlo.
-
-Decidido además el 2026-09-06, fuera de la lista numerada: **la identidad de
-una persona es su `git config user.email`** (implementado en C7).
-
-## El entorno cambió
-
-Todo el trabajo hasta el 2026-09-05 se hizo desde un bridge de dispositivo de
-Cowork — una VM Linux que montaba la carpeta de Windows. A partir de ahora se
-trabaja en **Claude Code nativo en la terminal de IntelliJ, en Windows**.
-
-Consecuencias prácticas: varias limitaciones documentadas en tareas anteriores
-eran del bridge, no de Windows, y **ya no aplican** (ver `HALLAZGOS.md`,
-sección "Cosas del entorno anterior que ya no aplican"). Y al revés: ahora sí
-hay un CLI de Claude Code de verdad, así que se puede por fin probar
-`/plugin marketplace add` y `/plugin install` reales — que es lo único que le
-queda pendiente a TASK-021.
-
-## Qué acaba de pasar (sesión del 2026-09-16): cierre de la Fase D y de E4/E5
-
-La Fase D se cerró entera desde la última actualización de este documento
-(2026-09-08, tras D6/D7). Resumen — el detalle línea a línea de cada una
-vive en `CHECKLIST_TERMINACION.md`, no aquí:
-
-1. **D1** — TASK-016: `taskctl plan` deja de ser un scaffold y pasa a
-   orquestar el brainstorm paralelo por roles. La revisión por pares más
-   dura del proyecto (5 rondas, 6 revisores, 8 CRÍTICOS).
-2. **D2** — TASK-017: catálogo de skills determinista con selección en dos
-   pasos. 5 rondas de revisión, 35 hallazgos, cero críticos.
-3. **D3** — TASK-018: `taskctl review` clasifica el diff real por dominio
-   en vez de usar siempre el mismo agente. 2 rondas de revisión, ambas con
-   hallazgos IMPORTANTE reales de cobertura de tests, corregidos con
-   contraprueba de mutación.
-4. **D5** — TASK-020: `taskctl codex-review`, envoltorio del CLI de Codex
-   como segunda opinión. 3 rondas de revisión — las dos primeras
-   encontraron bugs reales de plataforma en Windows (`spawnSync` sin
-   `shell: true` nunca invocaba el binario real; el escapado para
-   `cmd.exe` no evitaba que expandiera `%VARIABLE%`, filtrando datos del
-   entorno), ambos corregidos y verificados contra el binario real de
-   Codex en esta máquina.
-
-Con la Fase D completa, se resolvieron también **E4** y **E5** con
-investigación paralela (dos agentes especializados más un agente
-orquestador que verificó de forma independiente ambos hallazgos antes de
-llegar a Carlos): E4 se cierra documentando que las 12 tareas de Sprint
-0+1 se quedan como están (forzar el ciclo real de `taskctl` sobre ellas
-ahora es inviable, no solo indeseable: crashearía en 3 de las 12 por una
-`rama:` fantasma, y en las otras 9 la revisión saldría sobre un diff
-vacío); E5 se cierra borrando `runConfigurations.zip` (era la carpeta
-`.idea/` de otro proyecto, ya migrada por completo).
-
-Solo quedan **E1** (TASK-022, guía de incorporación — plan consolidado,
-pendiente de `taskctl approve`) y **E2** (TASK-023, métricas de coste en
-tokens por fase — sin empezar) para cerrar el proyecto entero.
-
-## Qué acaba de pasar (sesión del 2026-09-16, resto): cierre de E1/TASK-022
-
-**E1 (TASK-022)** — `docs/contexto/INCORPORACION.md`, la guía de
-incorporación de colaboradores: acceso, clonar el repo e instalar el
-plugin, entender el ciclo de vida (enlazando `SKILL.md` y la sección 13 de
-`PROPUESTA_METODOLOGIA.md`, sin duplicarlos) y hacer la primera tarea.
-Deja constancia explícita de que hoy no hay colaboradores que invitar
-(decisión de Carlos, 2026-09-13) y cierra el punto 8 de la sección 14 en lo
-que respecta a a quién se invita — solo en `CHECKLIST_TERMINACION.md`, sin
-tocar el documento congelado, mismo patrón que las seis decisiones
-anteriores de esa sección.
-
-**Tres rondas de revisión independiente, cero críticos en ninguna,
-aprobada en la tercera.** Las dos primeras rondas encontraron algo del
-mismo tipo cada vez, en sentidos opuestos: la ronda 1 denunció que la guía
-invertía qué tiene el proyecto confirmado sobre `taskctl` resolviendo por
-PATH y qué no; la corrección de la ronda 2 arregló la inversión pero se
-pasó de frenada al revés, atribuyendo a un job de CI algo que ese CI nunca
-prueba (nunca instala un plugin). La ronda 3 confirmó, contrastando frase a
-frase contra las cuatro fuentes citadas, que el párrafo final ya no
-promete nada que el proyecto no pueda respaldar. Detalle completo con las
-citas exactas en el `## Resultado` de `tareas/04-terminadas/TASK-022/tarea.md`.
-
-Con esto, la Fase E queda a un solo item: **E2** (TASK-023, sin empezar).
-Cuando se cierre, el proyecto llega al 42/42 (100%).
+- **Versión publicada del plugin: 0.14.0** (tag `v0.14.0`, 2026-11-10).
+  Nada publicado después: `package.json` y `plugin.json` siguen en 0.14.0.
+- **Checklist**: 120 de 121 items; solo queda abierta TASK-099 (fase P).
+  Detalle en [`CHECKLIST_TERMINACION.md`](CHECKLIST_TERMINACION.md); las
+  fases cerradas, en [`archivo/CHECKLIST-fases-cerradas.md`](archivo/CHECKLIST-fases-cerradas.md).
+- **En curso**: TASK-124 — contexto con tamaño máximo: lo que leen los
+  agentes no crece con el proyecto (rama
+  `feature/task-124-contexto-con-tamano-maximo-lo-que-leen-l`). Partes:
+  README del plugin por capas, archivo de CHECKLIST y ESTADO, y aviso de
+  `doctor` sobre el documento de estado.
+
+## En `develop` desde la 0.14.0 (sin publicar)
+
+Por orden de merge:
+
+- **TASK-100 a TASK-104** — verificación proporcional A1–A3b: `finish`, el
+  guardián de merges, el freno `Stop` y las rondas de `review` no corren la
+  suite si la tarea solo cambia documentación; el guardián bloquea con
+  config inválida (TASK-103).
+- **TASK-096 y TASK-105 a TASK-109** — verificación proporcional nivel 2
+  (B1–B6): clave `rutas_verificacion_parcial`, decisión `selectiva`, `finish`
+  verifica solo lo afectado con código parcial, Stop/review/finish deciden
+  igual, el guardián exige la completa con código, y documentación.
+- **Auditoría del método 2026-11-12**:
+  `docs/auditoria/AUDITORIA-METODO-2026-11-12.md` y
+  `docs/auditoria/PASOS-PLUGIN-2026-11-12.md` (métricas por paso). De ahí
+  salen F-16 (TASK-123) y F-3/F-14 (TASK-124).
+- **P-1** — duración real de `finish`: la fila `finish` registra el instante
+  de fin y `taskctl metricas` muestra su columna.
+- **TASK-110** — progreso visible sin tokens: `taskctl estado [--seguir]`,
+  status line instalable con `taskctl doctor --instalar-status-line`,
+  contador `[x/N]` en todas las fases.
+- **TASK-122** — coste por tarea independiente del tamaño del proyecto:
+  verificación por impacto (`scripts/verificar-impacto.mjs`), perfil de la
+  suite (`scripts/perfil-tests.mjs`), `metricas --evolucion` con el coste
+  fijo; informes `docs/auditoria/ESCALA-2026-11-12.md` y
+  `PERFIL-TESTS-2026-11-12.md`. Regla de la pirámide en `CONVENCIONES.md`.
+- **TASK-123** — F-16: `finish` no cierra sin verificar tras un merge a mano
+  o un conflicto; el guardián bloquea el commit que cierra un merge en curso
+  en develop/main.
+- **TASK-121** — `taskctl trocear`: una tarea de más de 60 min pasa a
+  TASK-NNNa y crea b, c… en la misma rama; IDs con letra en todo el CLI.
+
+## Qué toca: cola para la 0.16.0
+
+Decisión de Carlos: **no se publica hasta completar la cola**, y antes de
+publicar se corre la suite completa una vez sobre `develop`. Orden:
+
+1. TASK-099 — corrección de MENORES tras aprobar con correcciones sin abrir
+   otra ronda completa.
+2. TASK-116 — P-8: TaskCode declara su verificación y `doctor` avisa cuando
+   falta.
+3. TASK-113 — P-5: petición de revisión más ligera.
+4. TASK-114 — P-6: hooks `PreToolUse` que salen pronto.
+5. TASK-118 — P-10: línea FIN con la duración en los scripts de Git-Flow.
+6. TASK-117 — P-9: `new` propone la complejidad a partir de tareas parecidas.
+7. TASK-120 — P-12: sincronización con su duración registrada.
+8. TASK-112 — P-4: el revisor reutiliza la verificación de ronda.
+9. TASK-119 — P-11: menos commits de proceso por tarea.
+10. TASK-111 — P-3: registrar cada ejecución del freno `Stop`.
+11. TASK-115 — P-7: verificación completa por lote en modo automático (al
+    final; **necesita decisión de Carlos** sobre la verificación por lote).
+
+Además hay planificadas, fuera de esa cola y sin orden decidido, TASK-125 a
+TASK-130 (presupuesto del freno, verificación por tipo de rama, tope de
+rondas configurable, métricas por puerta, freno al crecimiento de la suite y
+poda de tests), dadas de alta el 2026-11-12 a partir de las métricas de
+ToolsaWeb.
+
+## Cómo se trabaja ahora: modo rápido
+
+Desde el 2026-11-12, en todas las tareas:
+
+- Plan redactado por el coordinador (sin brainstorm salvo que haga falta).
+- **Una ronda** de revisión, con los tests afectados; los MENORES se
+  corrigen o aceptan **sin ronda 2**.
+- Verificación de la tarea:
+  `RAMA_BASE=develop node scripts/verificar-impacto.mjs` y
+  `npm run test:rapido`. La suite completa, solo antes de publicar.
+
+**Cómo retomar una tarea**: `taskctl siguiente TASK-NNN --json` dice la fase
+y el paso que toca.
+
+## Trampas vivas
+
+- **`finish` corre la suite completa si el diff toca skills o README**
+  (quedan fuera de `rutas_verificacion_parcial`). Si solo fallan los 3 rojos
+  conocidos de Windows, se cierra con `--sin-verificacion`.
+- **El freno `Stop` del plugin instalado lee la config de la rama activa**,
+  no la de `develop`.
+- **Los subagentes en worktree aislado no pueden usar git.**
+- **`taskctl new` en `develop` con el checkout en otra rama**: se hace en un
+  worktree temporal bajo `%LOCALAPPDATA%\pruebas-claude\taskcode\`, que se
+  borra al terminar.
+- **Desde PowerShell, el `bash` del PATH puede ser el de WSL**: los scripts
+  de Git-Flow se lanzan con el `bash` de Git for Windows.
+- **Subir a `origin`**: según la referencia local, `origin/develop` se quedó
+  en el 2026-11-10 y `develop` va cientos de commits por delante (`taskctl`
+  no sube sin `--push`). Comprobar con `git fetch` antes de fiarse.
+- Los 3 rojos conocidos de Windows y los `EBUSY ... rmdir` del teardown:
+  ver `CLAUDE.md`.
+
+## Dónde mirar
+
+- [`../ROADMAP.md`](../ROADMAP.md) — qué falta y qué está hecho, por versión
+  (ojo: su última actualización escrita es del 2026-11-10; el generado por
+  `taskctl` está en `tareas/ROADMAP.md`).
+- [`CONVENCIONES.md`](CONVENCIONES.md) — cómo se trabaja aquí.
+- [`HALLAZGOS.md`](HALLAZGOS.md) — las trampas que ya costaron tiempo.
+- [`CHECKLIST_TERMINACION.md`](CHECKLIST_TERMINACION.md) — progreso por
+  fases; archivo en [`archivo/`](archivo/).
diff --git a/docs/contexto/README.md b/docs/contexto/README.md
index 05ef4ef..3cefffd 100644
--- a/docs/contexto/README.md
+++ b/docs/contexto/README.md
@@ -5,12 +5,13 @@ Empieza por aquí si acabas de abrir el repo. Orden de lectura:
 | # | Documento | Para qué |
 |---|---|---|
 | 1 | [`ESTADO.md`](ESTADO.md) | Dónde estamos, qué acaba de pasar y qué toca ahora. |
-| 2 | [`CHECKLIST_TERMINACION.md`](CHECKLIST_TERMINACION.md) | **Documento vivo.** Las 40 casillas del plan de terminación por fases. Es la fuente de verdad del progreso. |
+| 2 | [`CHECKLIST_TERMINACION.md`](CHECKLIST_TERMINACION.md) | **Documento vivo.** Las fases con casillas abiertas y la tabla de contadores. Es la fuente de verdad del progreso. |
 | 3 | [`CONVENCIONES.md`](CONVENCIONES.md) | Cómo se trabaja aquí: Git-Flow, revisión por pares, tests, documentación. |
 | 4 | [`HALLAZGOS.md`](HALLAZGOS.md) | Las trampas que ya costaron tiempo y los patrones que merece la pena repetir. |
 | 5 | [`INVENTARIO_PENDIENTE.md`](INVENTARIO_PENDIENTE.md) | De dónde salieron esas 40 casillas: los huecos que ninguna tarea del plan cubría. |
 | — | [`PROMPT_INICIAL.md`](PROMPT_INICIAL.md) | Prompt listo para pegar al abrir una sesión nueva. |
 | — | [`INCORPORACION.md`](INCORPORACION.md) | Guía para incorporar a un nuevo colaborador al equipo. |
+| — | [`archivo/`](archivo/) | Lo cerrado, movido tal cual: las fases cerradas del checklist (`CHECKLIST-fases-cerradas.md`) y el `ESTADO.md` hasta el 2026-11-12 (`ESTADO-hasta-2026-11-12.md`). Solo se consulta si hace falta la historia. |
 
 Fuera de esta carpeta, lo que importa:
 
diff --git a/docs/contexto/archivo/CHECKLIST-fases-cerradas.md b/docs/contexto/archivo/CHECKLIST-fases-cerradas.md
new file mode 100644
index 0000000..e563d27
--- /dev/null
+++ b/docs/contexto/archivo/CHECKLIST-fases-cerradas.md
@@ -0,0 +1,1086 @@
+# Checklist de terminación — fases cerradas (archivo)
+
+> Archivo. Secciones movidas **tal cual** desde `../CHECKLIST_TERMINACION.md`
+> el 2026-11-12 (TASK-124): todas las fases cerradas (Sprint 0 y 1, A a O),
+> las decisiones ya resueltas (#1 a #17) y el «Corte mínimo defendible». No se
+> edita salvo para corregir un error; lo vivo está en el checklist.
+>
+> Los contadores de algunas cabeceras se quedaron atrás en su día y se dejan
+> como estaban: Fase C dice 5/8 y tiene las 8 casillas marcadas; Fase E dice
+> 5/6 y tiene las 6; «Decisiones que dependen de ti» dice 2/10 y tiene las 10
+> resueltas; Fase D dice 6/6 y tiene 7 casillas (D4, descartada, cuenta como
+> resuelta y no suma al total). La cifra buena es la de la tabla del checklist
+> vivo.
+
+---
+
+## ✅ Ya terminado (12/12)
+
+- [x] TASK-001 — Scaffold del proyecto (`plugin.json`, `bin/`, tsconfig, runner de tests)
+- [x] TASK-002 — Modelo de tarea + parser de `tarea.md` + máquina de estados
+- [x] TASK-003 — `taskctl new`
+- [x] TASK-004 — `taskctl import`
+- [x] TASK-005 — `taskctl board`
+- [x] TASK-006 — Empaquetado del plugin y validación de carga local
+- [x] TASK-007 — Spike: scripts Git-Flow vía Bash tool
+- [x] TASK-008 — Migrar scripts Git-Flow a `scripts/gitflow/`
+- [x] TASK-009 — `taskctl start`
+- [x] TASK-010 — `taskctl plan` (versión mínima)
+- [x] TASK-011 — `taskctl approve`
+- [x] TASK-012 — Precondición de rama base + workspace limpio (§8.3, pasos 1-4)
+
+---
+
+## ✅ Fase A — Desbloquear (3/3) · completada el 2026-09-05
+
+Nada de esto es funcionalidad nueva: es quitar de en medio lo que hace
+frágil o ciego todo lo demás.
+
+- [x] **A1** · Remoto en GitHub + `marketplace.json` (TASK-021 adelantada)
+      *`github.com/charliebk/TaskCode` (privado), 11 ramas subidas, `develop`
+      por defecto, tag y release `v0.1.0` publicados. `marketplace.json`
+      contra el schema oficial, sin `relevance` (ver decisión #12). Extra no
+      planificado: README en la raíz y CI en GitHub Actions.*
+- [x] **A2** · Crear TASK-013…TASK-023 como carpetas reales con `taskctl import`
+      *Las 11 creadas con los IDs alineados con `PLAN_SPRINTS.md`. Dos
+      hallazgos de dogfooding: `import` aplica los mismos flags a todas las
+      entradas y no sabe expresar `dependencias` (hubo que ajustar el
+      frontmatter a mano), y no se puede ejecutar dos veces seguidas porque
+      ensucia el workspace que su propio guard de §8.3 exige limpio.*
+- [x] **A3** · Poner `docs/METRICAS.md` al día (TASK-004 → TASK-012)
+      *Cubre las 12 tareas con agregados nuevos: 50 hallazgos de revisión en
+      9 rondas (5 críticos, 18 importantes, 27 menores), 84% corregidos y
+      ningún crítico ni importante abierto. De paso se corrigieron dos
+      recuentos de tests mal anotados en `PLAN_SPRINTS.md`.*
+
+## ✅ Fase B — Cerrar el ciclo de vida (7/7) · completada el 2026-09-05
+
+**Este es el hito real de usabilidad.** Al terminar la Fase B el sistema se
+puede usar a diario de punta a punta; todo lo posterior mejora la calidad
+del proceso, no lo habilita.
+
+- [x] **B1** · TASK-013 — `taskctl review` (`update-<tipo>.sh` + un agente revisor) — ~5h
+      *Cerrado el 2026-09-05. Primera tarea gestionada por su propio ciclo
+      (plan → approve → start → review, dogfooding completo, incluida la
+      peticion de revision que uso el revisor por pares). El CLI hace lo
+      determinista (update verificado con merge-base, mover a
+      03-en-revision, peticion con el diff real + scaffold de informe) y el
+      agente lo dispara el orquestador — decision registrada en el plan.
+      Revision: 2 importantes y 2 menores corregidos, 1 menor documentado.
+      11 tests reales nuevos (247 en total).*
+- [x] **B2** · Corregir el bug de `origin` en `merge-hotfix-to-main.sh` y `merge-release-to-main.sh` — ~1h
+      *Cerrado el 2026-09-05 (rama `fix/b2-guard-origin-merge-main`, merge
+      `--no-ff` a develop). Guard de TASK-008 extraído a
+      `detect_origin_available` y aplicado a ambos scripts; la revisión por
+      pares añadió dos correcciones: origin configurado pero inaccesible
+      ABORTA (no es lo mismo que operar sin remoto: el tag caería sobre una
+      `main` obsoleta), y la rama de trabajo se valida antes de tocar la
+      principal. 10 tests reales nuevos (repos temporales + bare como
+      origin); verificado que fallan sin el fix. De propina: guard en
+      `smoke-test.sh` que evita un `git init` destructivo si mktemp falla.*
+- [x] **B3** · TASK-014 — `taskctl finish` (merge, backmerge, tag) — ~5h
+      *Cerrado el 2026-09-05 con su propio comando (finish mergeó su propia
+      tarea: primer cierre de punta a punta del método). Aprobación leída
+      del veredicto del informe (parser fail-closed endurecido: la revisión
+      pilló que aprobaba <no aprobada>), colisión de IDs resuelta con dos
+      discriminadores (título distinto y linaje sin ancestro común), camino
+      idempotente de reintento tras conflicto de backmerge, y CHANGELOG,
+      INDEX y BOARD renderizados desde el frontmatter. 1 crítico + 2
+      importantes + 4 menores de revisión, los 7 corregidos. 19 tests
+      nuevos (266). De propina cubre la mitad de B4: los tres ficheros los
+      crea finish si no existen.*
+
+- [x] **B4** · Crear `CHANGELOG.md`, `INDEX.md` y `BOARD.md` — ~1h
+      *Los tres los creó `taskctl finish` al cerrar TASK-014 (B3). B4 añadió
+      el histórico que faltaba: las 12 tareas de Sprint 0 y 1 en CHANGELOG e
+      INDEX, compuestas leyendo sus `tarea.md` reales, apuntando a su ruta
+      real en `00-planificadas` (siguen ahí por la paradoja de
+      bootstrapping, E4). De paso quedó por escrito que TASK-001, 002 y 003
+      declaran una `rama` que no existe en Git.*
+
+- [x] **B5** · Resolver la divergencia de `board` — ~1h
+      *Resuelta a favor de la metodología: `taskctl board --escribir`
+      regenera `docs/BOARD.md`; sin el flag sigue siendo de solo lectura,
+      porque escribir siempre ensuciaría el workspace y dispararía el guard
+      de §8.3 en el siguiente comando. El formato del fichero vive ahora en
+      un único sitio (`renderBoardMarkdown`), compartido con `finish`, y las
+      tablas van en vallas de código. La divergencia residual (§8 no
+      menciona flags) queda documentada en HALLAZGOS, sin tocar la
+      metodología congelada. Revisión: 3 importantes y 2 menores corregidos
+      (orden no determinista de avisos que hacía el fichero irreproducible,
+      tablero fantasma fuera de la raíz del repo, errores de escritura mal
+      etiquetados), 1 menor documentado. 9 tests nuevos (275).*      *La metodología dice "regenera `docs/BOARD.md`"; lo implementado es un listado por pantalla. Decidir en qué sentido se corrige.*
+- [x] **B6** · Añadir `--asignado-a` a `plan` y `start` — ~2h
+      *Cerrado el 2026-09-05 (rama `feature/b6-asignado-a-en-plan-y-start`,
+      merge `--no-ff` a develop). `parseAsignadoAFlag` vive en un módulo
+      compartido para que los comandos no diverjan; sin el flag se
+      **conserva** el `asignado_a` que hubiera, así que `start` hereda lo que
+      dejó `plan` (§8.2). Rechaza el flag suelto (asignaría a una persona
+      llamada "true"), el valor vacío, los saltos de línea y los valores de
+      más de 64 caracteres. `plan` y `start` leen ya el ID de los
+      posicionales, así que el flag funciona también delante del ID.
+      Revisión por pares: 1 IMPORTANTE y 5 MENORES; corregidos el
+      IMPORTANTE (`board --asignado-a` se ignoraba en silencio y devolvía
+      **el tablero entero** con código 0 — el mismo fallo que justificaba el
+      alias, sin cerrar el otro lado) y 3 menores; 2 documentados en
+      HALLAZGOS. El revisor verificó por mutación que los 6 tests clave se
+      ponen rojos al revertir lo que dicen probar. 32 tests reales nuevos
+      (307).*
+- [x] **B7** · TASK-015 — Límite de WIP por persona (§8.2) — ~3h
+      *Cerrado el 2026-09-05, gestionado de punta a punta con la propia
+      herramienta y estrenando el `--asignado-a` de B6. Un **único** límite
+      y solo de ejecución (decisión #13): `plan` no comprueba nada, `start`
+      aborta si la persona asignada ya tiene otra en `02-en-curso` **o** en
+      `03-en-revision` — el hueco no se libera hasta `finish` porque la rama
+      sigue viva y es donde se commitean las correcciones de la revisión.
+      **Diverge de la §8.2** (dos límites independientes, uno sobre el
+      diseño): es la mayor divergencia del proyecto y queda documentada en
+      HALLAZGOS. Revisión por pares con 16 casos de ataque y 8 mutaciones:
+      1 IMPORTANTE (la divergencia sin documentar) y 6 MENORES; corregidos
+      6, documentado 1 (el límite es opt-in, y `carlos` y `charlie.bk` son
+      la misma persona con dos grafías — normalizar identidades es material
+      de C4). 38 tests reales nuevos (345).*
+
+## Fase C — Tapar huecos (5/8) · ~15h
+
+Lo que la metodología da por hecho y no existe.
+
+- [x] **C1** · TASK-026 — Wrappers `taskctl diagnose` / `pause` / `resume` / `recover` / `abort-merge` — ~3h
+      *Cerrado el 2026-09-06. El nudo no era enrutar a `bash`: cuatro de
+      los cinco scripts preguntan con `read -rp`, y con EOF `pause` moría
+      con "Opcion no reconocida" y `abort-merge` no abortaba nada saliendo
+      con 0. Regla nueva del proyecto: **stdin heredado solo cuando hay
+      terminal**, ignorado cuando no la hay, y guard que corta antes de
+      invocar si el valor por defecto haría lo contrario de lo que dice el
+      comando. La §8.3 ya nombra `taskctl pause` en su mensaje, que era la
+      premisa de la tarea. Dos rondas de revisión: **APROBADO CON CAMBIOS**
+      (2 importantes, 7 menores) y **APROBADO** (3 menores). Los dos
+      importantes: `pause` preguntaba igual con el workspace limpio porque
+      los scripts se escriben el registro dentro del repo, y heredar stdin
+      siempre **colgaba el comando para siempre** ante una tubería abierta.
+      27 tests nuevos (417).*
+- [x] **C2** · Paso 5 de §8.3: `taskctl` comitea; sube solo con `--push` — ~3h
+      ***Divergencia con la §8.3, deliberada***: *el paso 5 pide tambien
+      subir. Se acepta la perdida —una tarea nueva no llega al equipo sola—
+      a cambio de que publicar sea un acto consciente.*
+      *Cerrado el 2026-09-07 (TASK-030, junto con C4 en la misma rama: el
+      limite de WIP es 1 y lo aplica `start`, asi que dos tareas simultaneas
+      habrian hecho abortar la segunda). `taskctl` commitea las rutas que
+      escribe **una a una**, y en ningun sitio hay un `add -A` sin pathspec.
+      Al cablearlo **se cayeron 14 tests existentes**, que era la senal que el
+      plan pedia vigilar: casi todos hacian `git add -A && git commit` a mano
+      para sortear el workspace sucio, o sea que documentaban el defecto que
+      esto quita. Se les quito el commit manual en vez de hacerlos tolerantes.
+      El plan estaba a medias equivocado sobre por que hace falta la regla:
+      `start`/`review`/`finish` **si** comprueban el workspace; lo que la
+      justifica es la ventana entre esa comprobacion y el commit, donde puede
+      escribir otro proceso — que aqui es el caso normal, con varios agentes
+      sobre la misma copia. Dos rondas: **cambios-solicitados** (2
+      importantes) y **APROBADA**. El importante que mas ensena: la lista de
+      ficheros se calculaba antes del commit, asi que con un hook de
+      pre-commit el CLI decia "1 fichero" con 2 registrados — en el unico
+      escenario donde la regla se rompe, la herramienta afirmaba lo
+      contrario.*
+      *Decisión abierta + implementación. Sin esto, una tarea nueva no llega
+      al equipo sola. **Evidencia nueva (A2)**: sin el paso 5, `taskctl
+      import` no se puede ejecutar dos veces seguidas — crea las carpetas que
+      luego bloquean su propia siguiente invocación.*
+- [x] **C3** · TASK-027 — Subcarpetas `planificacion/` y `revision/` en cada carpeta de tarea — ~1h
+      *Cerrado el 2026-09-06. `taskctl plan` crea `planificacion/` y escribe
+      ahí el scaffold de `plan-final.md`, que es la ubicación canónica según
+      la sección 2 de la metodología; `revision/` ya la creaba `review`
+      desde B1. **El nudo no era la ruta nueva, era el legado**: `approve`
+      sigue aceptando el plan suelto en la raíz —una tarea planificada con
+      la versión anterior del CLI no se queda sin poder aprobarse— y una
+      re-planificación lo **migra** a `planificacion/` con `rename`,
+      conservando el contenido en vez de pisarlo con el scaffold, y lo dice
+      en la salida. Si aparecen los dos a la vez (legado + canónico), tanto
+      `plan` como `approve` **fallan cerrado** sin tocar nada, en vez de
+      elegir por su cuenta cuál gana. Las 6 tareas ya cerradas en
+      `04-terminadas/` (TASK-013, 014, 015, 024, 025 y 026) se migraron con
+      `git mv` — rename puro, 0 líneas cambiadas —, así que **ya no queda
+      ningún `plan-final.md` suelto en el repo**. Revisión por pares ronda
+      1: **APROBADO CON CAMBIOS** (1 importante, 4 menores), sobre un clon
+      con smoke test propio y 7 mutantes. El importante: la reestructuración
+      había dejado sin cobertura una protección contra pérdida de datos que
+      `develop` sí tenía, demostrado ejecutando el mismo mutante en las dos
+      ramas. Aplicados todos salvo la parte (a) del hallazgo #4 —el `rename`
+      de la migración no tiene un equivalente exclusivo del flag `'wx'`
+      porque POSIX no lo ofrece—, documentada sin corregir. 8 tests nuevos
+      (429; 426 verdes y los 3 rojos conocidos de este entorno Windows).
+      Dos rondas de revisión: **APROBADO CON CAMBIOS** (1 importante, 4 menores) y **cambios solicitados → APROBADA** (1 importante, 3 menores). El importante de la ronda 2: el fix de la ronda 1 era un fix solo de Windows —en POSIX el `stat` falla antes con `ENOTDIR`— y el test escrito para certificarlo habría caído en el job `ubuntu-latest`.*
+- [x] **C4** · `.taskcode/config.yml` — ~3h
+      *Cerrado el 2026-09-07 (TASK-030). Tres claves opcionales: `rama_base`
+      (unico hardcode indetectable), `agente_revisor_por_defecto` (que ademas
+      estaba duplicado en `new.ts` e `import.ts`) y `limite_wip`. Sin fichero,
+      comportamiento identico al de hoy. **Un solo parser**: el bucle
+      `clave: valor` de `frontmatter.ts` se extrajo en vez de escribir un
+      segundo YAML a mano — y ahi aparecio que el parser NO soportaba
+      comentarios de linea entera, solo inline, asi que se anadieron opt-in
+      para no cambiar en silencio lo que acepta `tarea.md`. La revision
+      encontro que **`limite_wip` era la unica clave sin prueba de cableado**:
+      se habia verificado a mano con el CLI y deshacer la linea de `start.ts`
+      no rompia ningun test. Y un menor con reencuentro: un `.taskcode` que es
+      un fichero caia al default **en silencio en Windows** (`ENOENT`, no
+      `ENOTDIR`) — la misma trampa de TASK-027, resuelta preguntandole al
+      sistema de ficheros y no al errno.*
+- [x] **C5** · TASK-028 — `skills/task-workflow/SKILL.md`, la primera skill del plugin — ~1h
+      *Cerrado el 2026-09-07. El plugin ya expone una skill a Claude Code —
+      `taskcode-plugin:task-workflow`, 272 líneas—; antes no exponía
+      ninguna. **El fichero es corto y el riesgo estaba entero en el
+      contenido**: un agente se cree lo que lee en una skill, así que un flag
+      inventado no es una errata, es una fuente de errores *con autoridad*.
+      Por eso la superficie del CLI se extrajo del **código** (`cli.ts`,
+      `state-machine.ts`, `wip.ts`, `git.ts`) y no del README ni de la
+      metodología, que en tres puntos ya no la describen. Las tres
+      divergencias detectadas y **no** heredadas: `taskctl codex-review` no
+      existe pese a estar en la máquina de estados y en la tabla de la §8
+      —y `revision_codex: true` deja la tarea imposible de cerrar—, el guard
+      de §8.3 solo lo aplican 4 de los 8 comandos, y `plan` no es
+      multi-agente. Frontmatter con solo `name` y `description`: la
+      intersección entre lo que acepta Claude Code y lo que admite el spec
+      portable. La skill viaja a otros proyectos, así que no lleva nada de
+      este repo dentro (el revisor buscó 20 marcas: cero coincidencias). Lo
+      que queda en `HALLAZGOS.md` es el test que casi nace invertido: `claude
+      plugin validate` solo nombra las skills que **fallan**, de modo que
+      aseverar sobre su salida habría pasado justo con la skill rota; la
+      prueba correcta es la contraprueba sobre una copia con el frontmatter
+      roto. Dos rondas de revisión: **cambios solicitados** (1 importante, 5
+      menores, todos corregidos) y **APROBADA**. El importante: `CLAUDE.md`
+      decía 429 tests y en esta rama son 444 — mergearlo así habría
+      reproducido el defecto que la propia corrección venía a arreglar. 15
+      tests nuevos (444; 441 verdes y los 3 rojos conocidos de este entorno
+      Windows). La ronda 2 dejó además un menor documentado sin corregir, que
+      se registra como item propio: **E6**, la distribución del CLI.*
+- [x] **C6** · Bug de `origin` en `create-develop.sh`, `recover-branch.sh`, `resume-work.sh` — ~5h
+      *Cerrado el 2026-09-07 (TASK-029). El item nacio siendo solo el bug de
+      `origin` y C1 le anadio tres frentes mas: los ~1h de la estimacion
+      original eran de entonces. Cuatro agentes en paralelo dentro de la
+      misma rama, con propiedad exclusiva de ficheros. La respuesta al bug de
+      `origin` resulto ser **distinta por script**: `create-develop` aborta
+      con origin caido, `recover-branch` falla siempre sin remoto (su
+      proposito entero es traerse una rama de ahi) y `resume-work` no aborta
+      nunca. El registro se muda a `.git/taskcode/gitflow/`, lo que deja sin
+      motivo al segundo guard de `taskctl pause` y se lleva por delante
+      `isIgnored`. Dos afirmaciones del plan resultaron falsas al medirlas:
+      `create-hotfix`/`create-release` no usan la funcion compartida (deuda
+      viva), y `CHERRY_PICK_HEAD`+`REVERT_HEAD` no bastaban — falta
+      `.git/sequencer/`. Dos rondas: **cambios-solicitados** (2 importantes,
+      5 menores) y **APROBADA** (2 menores). Lo que queda en `HALLAZGOS.md`
+      es que mi primer arreglo de un importante era falso: use "comparar HEAD
+      antes y despues" como discriminante y en un cherry-pick de un solo
+      commit HEAD tampoco se mueve, asi que daba el mensaje del caso raro en
+      el caso normal. Lo destapo probar el caso que daba por bueno. 31 tests
+      nuevos (472; 469 verdes y los 3 rojos conocidos de Windows).*
+- [x] **C7** · TASK-024 — `asignado_a` por defecto desde la identidad Git — ~2h
+      *Cerrado el 2026-09-05. Precedencia: `--asignado-a` > `asignado_a`
+      previo > `git config user.email` > `null`; que el previo gane a la
+      identidad evita el robo silencioso de tareas ajenas. Migradas 12
+      tareas a `charlie.bk@gmail.com`. Revisión por pares: **1 CRÍTICO**,
+      4 importantes y 3 menores, todos corregidos. El crítico: la identidad
+      Git esquivaba la validación del flag, y un `user.email` con un salto
+      de línea **inyectaba una clave que pisaba `estado`** y dejaba la tarea
+      ladrillada, con exit 0 y sin aviso. **Ojo**: esta tarea NO hace
+      efectivo el límite de WIP, contra lo que decía su plan — rellenar
+      `asignado_a` es necesario pero no suficiente (ver C8). 24 tests
+      nuevos (369).*
+- [x] **C8** · TASK-025 — El límite de WIP mira las ramas de trabajo — ~3h
+      *Cerrado el 2026-09-06. El límite de B7 **no protegía nada**: leía el
+      árbol de la rama activa, y el paso a `02-en-curso` se commitea en la
+      rama de la tarea mientras `plan`/`new` devuelven el repo a `develop`.
+      Ahora pregunta si la persona tiene una **rama de trabajo abierta**
+      (local, sin mergear), leyendo el `tarea.md` de cada una con
+      `git show`. Verificado en el flujo real, que es lo que le faltó a B7.
+      El smoke test destapó un fallo antes que la revisión (en un clon,
+      `main` solo existe como remota). **Revisión: RECHAZADO** en la
+      primera ronda — 1 CRÍTICO, 2 importantes y 4 menores. El crítico:
+      para un `hotfix` las referencias dejaban fuera a `develop`, así que
+      **18 ramas ya cerradas** contaban como abiertas y el camino urgente
+      quedaba inutilizable, acusando a tareas terminadas y proponiendo un
+      remedio imposible. Todos corregidos. 20 tests nuevos (387).*
+
+## ✅ Fase D — Inteligencia del proceso (6/6) · completada el 2026-09-13 · ~35h
+
+La fase cara y la única genuinamente opcional: el sistema ya funciona sin
+ella, con un revisor genérico y un `plan` de un solo agente. **D6 y D7 están
+hechos** (TASK-032): el plugin ya expone cinco skills y cuatro agentes, y
+existe la heurística que D1 y D2 van a consumir como lookup.
+
+- [x] **D1** · TASK-016 — Brainstorm paralelo por roles + agente unificador — hecho el 2026-09-08
+      *`taskctl plan` deja de ser un scaffold de un fichero y pasa a orquestar el
+      brainstorm: resuelve sin LLM cuántos roles entran y cuáles, y escribe una
+      petición por rol con su contexto acotado más la del unificador. El CLI
+      sigue sin invocar ningún modelo — mismo reparto que `review` desde
+      TASK-013. Estrena el YML de D7, que hasta hoy no leía nadie desde `src/`,
+      y añade el quinto agente (`brainstorm-unificador`). **116 tests nuevos**
+      (630 → 746). Dos decisiones con Carlos: el número de roles es
+      `max(declarado, heurístico)` topado por hotfix (diverge de la §5 del YML,
+      que manda consultar a un modelo barato, y el CLI no puede), y se
+      implementa la decisión #1 — **el checkpoint humano pasa a ser obligatorio
+      para las cinco complejidades**, así que `TRIVIAL_SIN_APROBACION` se vacía.
+      Puerta nueva: `plan` aborta si el `## Objetivo` está vacío y hay algún rol
+      que lanzar.*
+      ***La revisión por pares fue la más dura del proyecto: 5 rondas, 6
+      revisores independientes, 8 CRÍTICOS.** Y el hallazgo que más vale está en
+      `HALLAZGOS.md`: el mismo CRÍTICO se arregló cuatro veces, y los cuatro
+      arreglos eran correctos para el caso que tenían delante — lo que fallaba
+      era el modelo del estado de una carpeta. Ninguno de los ocho se encontró
+      leyendo el diff; todos salieron de montar el estado a mano y ejecutar el
+      binario. Medido de paso: la heurística solo cambia el número de agentes en
+      4 de las 32 tareas, y las 7 que quedan pendientes tienen el objetivo
+      vacío, así que la puerta nueva las bloquea hasta redactarlo.*
+- [x] **D2** · TASK-017 — Catálogo de skills determinista + selección en dos pasos — hecho el 2026-09-09
+      *Los `patrones_archivo` de los cuatro revisores ya están declarados en
+      cada `SKILL.md`, en lista inline para que el parser del repo los lea tal
+      cual. El catálogo debería recogerlos, no reinventarlos.*
+      ***5 rondas de revisión por pares (la 2 en dos pasadas independientes),
+      35 hallazgos, cero críticos** — la más larga de la fase D después de D1.
+      Riesgo aceptado y respetado en las cinco rondas: la comprobación de si un
+      skill `origen: externo` está instalado es puramente de lectura vía
+      subproceso, nunca instala nada. Se endureció la convención `skill_N_id`
+      (`"plugin:skill"`) a fail-closed con regex y test de regresión propio
+      (MEN-20, MEN-24). Hallazgo de proceso documentado en `HALLAZGOS.md`: el
+      worktree aislado del agente revisor apareció en la rama equivocada
+      cuatro rondas seguidas (siempre el mismo commit ajeno, el cierre de
+      TASK-016) — detectado y compensado por el propio informe las cuatro
+      veces, nunca invalidó el veredicto, pero el traslado del informe a la
+      ubicación correcta se hizo a mano cada vez.*
+- [x] **D3** · TASK-018 — Enrutado de revisor por diff real, multi-reviewer por dominio — hecho el 2026-09-12
+      *`code-quality-reviewer` ya se declara `fallback: true` con
+      `umbral_dominios: 3` (decisión #16). Aviso medido en TASK-032: un patrón
+      de más no añade un revisor, **sustituye** al genérico — por eso las
+      listas de patrones se acotaron y hay un test con tabla de rutas →
+      revisor esperado en las dos direcciones.*
+      *`cargarCatalogoRevisores` (`src/core/revisores.ts`) promueve a
+      producción el lector de `patrones_archivo`/`fallback`/`umbral_dominios`
+      que antes solo vivía como helper de test, sin cache (ya divergió dos
+      veces, HALLAZGOS.md). `clasificarPorDominio` (función pura) decide el
+      reparto con el umbral INCLUSIVE (decisión de Carlos, 2026-09-12): 0
+      dominios o más del umbral cae al genérico con el diff completo; 1 a 3
+      fragmenta un grupo por dominio, más el genérico si sobran ficheros sin
+      dominio claro — nunca se queda nadie sin revisor. `taskctl review`
+      clasifica el diff real (`diffNameOnly`) y escribe un par
+      petición/informe por grupo, con sufijo de dominio solo cuando
+      fragmenta (precedente `informe-codex-N.md`). `finish.ts`/`rondas.ts`
+      se extendieron para exigir que TODOS los informes de una ronda
+      fragmentada aprueben — sin esto, la tarea quedaría atascada en
+      `03-en-revision` para siempre, el riesgo más grave que señaló el
+      propio brainstorm.*
+      ***2 rondas de revisión por pares, independientes entre sí y del
+      implementador**: ronda 1 cambios-solicitados (2 IMPORTANTE — ambos
+      huecos de cobertura, no bugs: la numeración de ronda tras fragmentar y
+      el mensaje de `cli.ts` con las N peticiones tenían 0% de test aunque el
+      comportamiento real ya era correcto — y 2 MENOR, uno documentado como
+      evaluado-y-descartado y otro dejado sin corregir por mantenibilidad);
+      ronda 2 **aprobada**, por un tercer agente que confirmó por
+      reproducción propia (revirtiendo las correcciones en un clon aislado)
+      que los dos IMPORTANTE quedaron protegidos. Smoke test manual de
+      punta a punta en esta sesión: `new → plan → approve → start` con dos
+      dominios reales, `review` fragmenta en 3 peticiones, `finish` cierra
+      al aprobar las tres. 855 tests (852 verdes; los 3 rojos son los
+      conocidos de Windows nativo).*
+- [x] **D4** · TASK-019 — ~~Revisión ligera para tareas `trivial`/`simple`~~ — **NO SE HACE**
+      *Descartado por Carlos el 2026-09-07, antes de gastar las ~3h. La
+      decisión #17 lo dejó aplicando **solo a `trivial`**, y de las 32 tareas
+      del repo **solo una es `trivial`** (TASK-005) y **todavía no se ha
+      cerrado ninguna de ese nivel**. Reparto completo: 15 `simple`, 13
+      `media`, 3 `alta`, 1 `trivial`. La regla casi nunca se activaría, así
+      que son ~3h para un camino que en la práctica no se recorre. Si algún
+      día aparecen tareas `trivial` de verdad, se reabre.*
+      **Corregido el 2026-09-08 (revisión por pares de TASK-016):** este
+      párrafo afirmaba en negrita que «no existe ni una sola tarea `trivial`»
+      y a la vez, dos líneas más abajo, «1 `trivial` sin cerrar». Lo primero
+      es falso y era el argumento citado; lo segundo es el dato bueno. La
+      conclusión (descartar D4) no cambia, pero la premisa sí estaba mal —
+      y llegó a copiarse a un comentario de código antes de detectarse.*
+- [x] **D5** · TASK-020 — `taskctl codex-review` opcional — hecho el 2026-09-13
+      *Sigue siendo el que cierra un agujero real detectado en C5:
+      `revision_codex: true` deja hoy la tarea **imposible de cerrar**, porque
+      `finish` la rechaza y remite a un comando que no existe.*
+      *`src/commands/codex-review.ts` envuelve `codex review --base <rama>
+      --title "<id>: <titulo>"` (sin `--commit`: revisaría un commit puntual,
+      no el diff completo). No toca `state-machine.ts` ni `finish.ts` — ya
+      tenían el contrato cerrado. Todo fallo de Codex (ausente o exit≠0)
+      degrada igual: avisa, sale con código 0, sin escribir informe — decisión
+      de Carlos, con evidencia real de que en esta máquina Codex falla por
+      incompatibilidad de cuenta/modelo, no por el diff. Un humano/agente
+      certifica el veredicto tras leer la salida cruda de Codex embebida en
+      `informe-codex-N.md`, nunca inferido del exit code.*
+      ***3 rondas de revisión por pares, cada una por un agente distinto**:
+      ronda 1 cambios-solicitados (`spawnSync('codex', ...)` sin `shell: true`
+      nunca invocaba el binario real en Windows —`ENOENT` siempre, aunque
+      estuviera instalado—, y un segundo bug destapado al corregirlo: `codex
+      review --base <rama>` no admite combinarse con un PROMPT propio,
+      conflicto real del CLI); ronda 2 cambios-solicitados (el escapado para
+      `cmd.exe` no evitaba que expandiera `%VARIABLE%` — un título con
+      `%USERNAME%` filtraba el valor real de esa variable hacia la llamada de
+      red externa; corregido eliminando el `%` en vez de escaparlo, porque no
+      hay forma fiable de escaparlo en una invocación suelta de `cmd.exe /c`);
+      ronda 3 aprobada con menores documentados (un `%` literal legítimo en un
+      título también se pierde — trade-off aceptado frente a la fuga de
+      datos). 868 tests (865 verdes; los 3 rojos son los conocidos de
+      Windows).*
+- [x] **D6** · Redactar las 4 skills revisoras (java-spring, angular-vue, csharp-autocad-ifc, code-quality) — hecho el 2026-09-07 (TASK-032)
+      *Las cuatro con lo que revisan en su dominio, la exigencia de reproducir
+      empíricamente, la clasificación CRÍTICO/IMPORTANTE/MENOR con ejemplos
+      propios, la línea de veredicto **extraída del código** de `finish.ts` y
+      sus `patrones_archivo`. El enrutado se midió con `path.matchesGlob` en
+      las dos direcciones y quedó congelado en tests: 32/32 rutas legítimas
+      llegan a su revisor, 37/37 ajenas no casan con ninguno, y 6 capturas
+      aceptadas a sabiendas y documentadas.*
+- [x] **D7** · Redactar `agents/` (roles de brainstorm) + `scripts/heuristica-complejidad.yml` — hecho el 2026-09-07 (TASK-032)
+      *Los cuatro roles con su contexto acotado (§16.2) y su salida con topes
+      numéricos (§16.4.4), y el YML con los seis pesos de la §16.1, el mapeo
+      de niveles, la lista genérica de palabras de riesgo y la tabla de
+      agentes de la decisión #2. **Formato plano a propósito**: el único
+      parser del repo lee pares `clave: valor` y listas inline, y falla en
+      seco ante una lista en bloque — el dato se acomoda al lector en vez de
+      ampliar el lector.*
+      ***Divergencia documentada***: el fichero dice `alta` donde la §16.1 y
+      la decisión #2 dicen `compleja`, porque el enum del plugin
+      (`src/core/task.ts`) es `trivial | simple | media | alta | critica` y
+      `validateTask` **rechaza** `compleja`. Tres tareas reales declaran
+      `alta` — TASK-016, 017 y 018, justo las que más agentes pedirían.*
+
+*Las dos: **9 artefactos, cero líneas en `src/`**, 93 tests nuevos (537 → 630).
+Tres rondas de revisión por pares con tres revisores independientes cada una,
+31 hallazgos, **cero críticos**, todos aplicados. El patrón que dejan para
+`HALLAZGOS.md` se repitió las tres veces: la corrección de un hallazgo llega
+sin la red que impide deshacerla — de ahí salieron **siete aserciones que no
+podían fallar**, incluida la que exigía «reproducir empíricamente» y se
+satisfacía con una etiqueta que otro test obliga a estar presente.*
+
+## Fase E — Cierre (5/6) · ~9h
+
+- [x] **E1** · TASK-022 — Documentación de equipo + invitar colaboradores — resuelta el 2026-09-16
+      *[`docs/contexto/INCORPORACION.md`](INCORPORACION.md) (nuevo): guía de
+      incorporación en cuatro pasos (acceso, clonar e instalar, ciclo de
+      vida, primera tarea), enlazada desde `README.md` y este índice — sin
+      duplicar `skills/task-workflow/SKILL.md` ni la sección 13 de
+      `PROPUESTA_METODOLOGIA.md`, solo enlazándolos. Incluye, explícita, la
+      decisión de Carlos (2026-09-13) de que hoy no hay colaboradores que
+      invitar. Cierra también el punto 8 de la sección 14 **en lo que
+      respecta a a quién se invita** (documento no editado, es congelado —
+      mismo patrón que #1/#2/#9/#11/#12/#13): a día de hoy, **a nadie**; el
+      repo `charliebk/TaskCode` sigue con un solo colaborador, el propio
+      dueño.*
+      ***Tres rondas de revisión independiente, cero críticos, aprobada en
+      la 3ª**: ronda 1 (cambios-solicitados, 3 importantes: invertía qué
+      estaba probado y qué no sobre `taskctl` por PATH, referencia circular
+      al cierre del punto 8, faltaba el paso de clonar y el acceso pedido
+      era insuficiente) + ronda 2 (cambios-solicitados, 1 importante
+      corregido a medias: la reescritura seguía atribuyendo al CI una
+      instalación de plugin que nunca ejecuta) + ronda 3 (aprobada, 3
+      menores no bloqueantes, aplicados igualmente). Detalle completo en el
+      `## Resultado` de `tareas/04-terminadas/TASK-022/tarea.md`.*
+- [x] **E2** · TASK-023 — Métricas de coste en tokens por fase (§16) — cerrada el 2026-10-06
+      *`taskctl registrar-coste` (`--agente <id>` suma el uso real de la
+      transcripción del subagente; la cifra que Claude Code muestra al
+      terminarlo es su contexto final, no su coste), `metricas --tokens
+      [--escribir]` y un aviso no bloqueante en `finish`. Histórico de 41
+      tareas en la §11 de `docs/METRICAS.md`: la revisión se lleva el
+      71-100 % del gasto de subagentes y **los pesos de la heurística no se
+      tocan**. 2 rondas: 1 IMPORTANTE (aviso de `finish` con la semántica
+      descartada) y 5 MENOR, todos corregidos. Detalle en el `## Resultado`
+      de `tareas/04-terminadas/TASK-023/tarea.md`.*
+- [x] **E3** · Validación en Windows nativo — **resuelta por el CI, no por una sesión nativa**
+      *El job `windows-latest` asevera cada hipótesis como un step propio.
+      Las cinco en verde: el bit `+x` sobrevive el checkout nativo, `taskctl`
+      resuelve como comando suelto por PATH, los `.sh` de Git-Flow pasan el
+      smoke test bajo Git Bash, `node bin/taskctl` funciona desde `cmd.exe`,
+      y la suite completa pasa. Cerró la reserva que arrastraban
+      TASK-006/007/008/009/010/011. Hallazgo negativo real y corregido: el
+      glob de `npm test` no era portable a `cmd.exe`.*
+- [x] **E4** · Decidir el cierre de las 12 tareas con `estado: planificada` pese a estar hechas — resuelta el 2026-09-16
+      *TASK-001 a TASK-012, todas cerradas desde hace tiempo (evidencia en
+      `CHANGELOG.md`, `docs/INDEX.md`, y esta misma sección "Ya terminado")
+      pero con `estado: planificada` en su frontmatter porque se hicieron
+      antes de que `taskctl` existiera — la "paradoja de bootstrapping" que
+      ya nombraba `CONVENCIONES.md`. Se investigó si se podía forzar el
+      ciclo real (`plan → approve → start → review → finish`) ahora mismo:
+      **no**, y no por preferencia sino por imposibilidad medida.
+      TASK-001/002/003 declaran una `rama:` que no existe en Git —
+      `taskctl finish` haría `git merge-base --is-ancestor` contra una ref
+      inexistente y **crashearía** con una excepción de Git sin capturar,
+      no con un error limpio (`finish.ts` + `isAncestor` en `git.ts`,
+      confirmado leyendo el código). Las otras 9 ya están mergeadas en
+      `develop`: una revisión por pares "empírica" contra ellas correría
+      sobre un diff vacío. Se decide la **Opción A**: dejarlas donde están,
+      sin tocar frontmatter ni carpetas — mismo patrón que **D4** (decisión
+      documentada, no aplazada, cuenta como resuelta). La alternativa
+      (editar `estado:` a mano y mover a `04-terminadas/`) se descarta
+      porque la propia documentación del proyecto la desaconseja
+      explícitamente (`CONVENCIONES.md`: "contradiría el principio del
+      sistema"; `skills/task-workflow/SKILL.md`, regla 3: "no editar
+      `estado:` a mano para saltarse un paso") — no hay ningún texto que la
+      respalde. Riesgo aceptado: `taskctl board` seguirá mostrando estas 12
+      mezcladas con la planificación vigente.*
+- [x] **E5** · Decidir qué hacer con `runConfigurations.zip` en la raíz — resuelta el 2026-09-16, **borrado**
+      *Confirmado: era la carpeta `.idea/runConfigurations/` de OTRO
+      proyecto (CDAU/IECA — Auth Service, Gateway, etc.), entrada en el
+      commit inicial (`4435d68d`), que sirvió de semilla para migrar 22 run
+      configurations + 18 scripts Bash hacia
+      `taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/`
+      (TASK-007/TASK-008 — dos de las 12 de E4). Sin ninguna dependencia
+      funcional en el repo (confirmado por grep). Borrado del working tree;
+      recuperable del historial con `git show
+      4435d68d:runConfigurations.zip` — nota añadida en
+      `scripts/gitflow/README.md` con ese hash para no depender de
+      recordarlo de memoria.*
+- [x] **E6** · Distribución del CLI: un clon recién hecho no trae un `taskctl` que funcione — ~2h estimadas, **~6h reales**
+      *Cerrado el 2026-09-07 (TASK-031). `dist/src/` se versiona: un clon de
+      `develop` ya arranca sin compilar (`node bin/taskctl --version` → `0.1.0`,
+      antes exit 1). El enunciado del item se equivocaba en un punto y se
+      corrigió: `package.json` **sí** declara `bin`, y que `plugin.json` no lo
+      haga es correcto — el PATH funciona por convención de directorio. La
+      causa era solo `dist/` ignorado.*
+      *El plan se quedó corto en su premisa central: `newLine: "lf"` no basta,
+      porque las plantillas multilínea de `src/` viajan tal cual al build (34
+      CRLF medidos, los 34 dentro del literal `HELP`). Y la primera medición no
+      lo vio porque comparaba Windows contra Windows. De ahí `*.ts text eol=lf`
+      además de `dist/**` y `bin/*`.*
+      ***Tres rondas de revisión, 34 hallazgos, cero críticos**: 5 importantes
+      + 16 menores (3 revisores en paralelo), 2 + 5 (uno en clon propio), y 0 +
+      5 en la ronda de cierre, **APROBADA**. El guard de CI resultó estar mal
+      por **cinco** motivos distintos, ninguno visto por quien lo escribió — el
+      último, que su propio mensaje de error prescribía un remedio imposible de
+      seguir. Y dos importantes de la ronda 2 eran defectos de las correcciones
+      de la ronda 1, no del trabajo original: el patrón que ya registró C6.*
+      ***AC7 queda a medias, y a propósito**: la instalación real se ejecutó
+      (`plugin marketplace add` + `install` con el CLI 2.1.226), la copia
+      cacheada arranca, y se confirmó por primera vez en este proyecto que el
+      mecanismo de `bin/` en PATH existe de verdad. Pero `taskctl` como comando
+      suelto **no se ha visto funcionar**: cuesta un comando en la próxima
+      sesión, `taskctl --version`. La evidencia que se presentó primero para
+      este AC no probaba lo que decía, y lo cazó la revisión: la caché de un
+      marketplace `directory` copia el árbol de trabajo con ignorados incluidos.*
+      *537 tests (534 verdes y los 3 rojos conocidos de Windows), 5 nuevos.*
+      *Item nuevo, abierto por la revisión por pares de C5 (MENOR, no
+      bloqueante, **preexistente** y fuera del alcance de aquella tarea).
+      `dist/` está en `.gitignore`, `.claude-plugin/plugin.json` no declara
+      `bin` y `package.json` tampoco, así que en un clon recién hecho
+      `bin/taskctl` —que hace `import('../dist/src/cli.js')`— muere con
+      `[ERROR] taskctl no pudo arrancar: Cannot find module
+      '...\dist\src\cli.js'` y sale con código 1 mientras nadie ejecute
+      `npm install && npm run build` dentro del plugin; y ni aun después
+      queda `taskctl` en el PATH de otro proyecto. No es un hueco del ciclo
+      de vida sino una decisión de **empaquetado**: compilar al empaquetar,
+      versionar `dist/`, o documentar el arranque en el README del plugin.
+      Condiciona a E1 —invitar colaboradores que clonan y no pueden
+      ejecutar nada— y, cuando se cierre, la skill de C5 debería acabar
+      diciendo en una línea cómo se pone `taskctl` disponible.*
+
+---
+
+## Decisiones que dependen de ti (2/10)
+
+No son horas de trabajo mío, son respuestas tuyas — pero bloquean lo que
+está a su derecha.
+
+- [x] **#1** · ¿Checkpoint humano siempre, o solo desde complejidad media?
+      *Resuelta por Carlos el 2026-09-07: **siempre**. No es solo prudencia:
+      hoy ya es asi (`start` exige `plan_aprobado: true`), asi que "siempre"
+      cuesta **cero codigo** y auto-aprobar seria anadir una bifurcacion nueva
+      con una forma nueva de equivocarse. Y hay evidencia en contra de
+      abaratarlo: en la sesion del 2026-09-07, **tres planes llegaron a
+      aprobacion con premisas falsas** (que dos scripts usaban una funcion
+      compartida, que dos testigos bastaban, que el parser soportaba
+      comentarios de linea). Las cazo quien las toco despues, no el
+      checkpoint — pero quitar la lectura humana quita el unico control que
+      no es un agente. Divergencia con la §155, que lo describe como
+      "opcional, recomendado desde complejidad media": se documenta.*
+- [x] **#2** · Máximo de agentes en brainstorm paralelo (3 vs 4)
+      *Resuelta por Carlos el 2026-09-07: **escala con la complejidad** — 0 en
+      `trivial`, hasta 3 en `compleja`, **4 en `critica`**. Los 4 son los
+      cuatro roles que la §2 ya define (arquitectura, riesgos, testing,
+      dominio): con 3 habria que repartir uno entre los otros. El techo
+      importa porque el coste del unificador crece con las entradas, no solo
+      el de los agentes.*
+- [x] **#9** · Contenido de `.taskcode/config.yml`
+      *Resuelta por Carlos el 2026-09-07: **tres claves**, todas opcionales
+      — `rama_base` (hoy `'develop'` literal en `git.ts:352`, el unico
+      hardcode que no se puede detectar), `agente_revisor_por_defecto` (hoy
+      `'general-purpose'` **duplicado** en `new.ts` e `import.ts`) y
+      `limite_wip` (hoy 1, fijo). **Descartada `politica_no_borrar_ramas`**:
+      solo puede valer `true`, asi que documenta en vez de configurar; si se
+      declarase habria que decidir que hace el plugin cuando alguien escriba
+      `false`, y "nada" envejece mal. **Descartada `rama_principal`**: ya la
+      detecta `resolveMainBranch` (main/master), y ponerla en config duplica
+      una deteccion que funciona. **Descartado `remoto`**: 18 scripts
+      hardcodean `origin` y eso es un trabajo mucho mayor que C4.*
+      *Forma acordada, que importa mas que las claves: sin fichero el
+      comportamiento es identico al de hoy (no-breaking, los 472 tests siguen
+      valiendo de red); **fallo cerrado** ante valor invalido o clave
+      desconocida, nunca caida al default en silencio (misma doctrina que el
+      `wx` de `plan.ts` y el parser de veredictos); **un solo parser** —el de
+      frontmatter ya cubre este subconjunto y su bucle `clave: valor` es
+      extraible—; **un solo punto de resolucion** (`resolverConfig(cwd)` con
+      defaults ya aplicados), para que la cuarta clave cueste una linea; y
+      **no se declara ninguna clave que nadie lea** todavia (`remoto`, las
+      palabras clave de la heuristica): una clave escribible que no hace nada
+      es peor que no tenerla, y este proyecto ya se quemo con `codex-review`.*
+- [x] **#11** · Mecanismo determinista para saber qué plugins/skills hay instalados
+      *Resuelta el 2026-09-07, **verificada ejecutandola**: `claude plugin
+      list --json` devuelve los plugins instalados en JSON estable (id,
+      version, scope, enabled, installPath), y `claude plugin details
+      <plugin>` da el inventario de componentes, incluidas las skills.*
+      ***Lo importante es lo que NO hay que usar**: `claude plugin validate`
+      solo nombra las skills que **fallan**, asi que un plugin sin ninguna
+      skill valida igual. Comprobado en TASK-028 con dos plugins sinteticos;
+      esta en `HALLAZGOS.md`. Aseverar sobre su salida para deducir que hay
+      instalado da la respuesta contraria a la verdadera.*
+- [x] **#12** · Señales del `relevance` en `marketplace.json`
+      *Resuelta sin decisión: la documentación oficial dice que `relevance`
+      solo surte efecto en marketplaces que un administrador incluya en
+      managed settings, así que en un marketplace privado personal no haría
+      nada. No se declara.*
+- [x] **#13** · ¿WIP único, o dos límites independientes (diseño y ejecución)?
+      *Resuelta por Carlos el 2026-09-05: **ni una cosa ni la otra** — un
+      **único límite, y solo sobre la ejecución**. En diseño no hay tope: se
+      pueden planificar varias tareas a la vez. Lo que se limita es tener
+      **una sola tarea con la rama abierta**, y el hueco lo ocupan tanto
+      `02-en-curso/` como `03-en-revision/`, porque la rama sigue viva y sin
+      mergear hasta `taskctl finish` y es ahí donde se commitean las
+      correcciones de los hallazgos. Motivo textual: "evitar que se programe
+      código de una tarea en la rama Git de otra tarea".*
+      *Divergencia con la §8.2 (congelada), que describe dos límites
+      independientes y uno de ellos sobre el diseño: hay que documentarla al
+      implementar B7, no reescribir la metodología.*
+- [x] **#14 (paso 5)** · ¿`taskctl` comitea y sube por la persona?
+      *Resuelta por Carlos el 2026-09-07: **commitea si, sube solo con
+      `--push`**. La pregunta eran en realidad dos con riesgos distintos:
+      commitear es local y se deshace con `git reset`, y solo toca `tareas/`
+      y `docs/`; subir publica al equipo. Evidencia medida: TASK-029 costo 9
+      commits y **4 existian solo porque `taskctl` no commitea lo que el
+      mismo escribe** (tarea creada, plan aprobado, peticion de revision,
+      artefactos de cierre); `import` sigue sin poder ejecutarse dos veces
+      seguidas; y una rama cuyo movimiento de tarea no este commiteado es
+      invisible para el limite de WIP (C8).*
+      *Divergencia con la §8.3 que hay que documentar al implementar C2: el
+      paso 5 pide tambien subir, con el argumento de que si no, el equipo no
+      ve la tarea nueva hasta que alguien la suba a mano. Se acepta esa
+      perdida a cambio de que publicar siga siendo un acto consciente.*
+- [x] **#15** · Pesos de la heurística de complejidad
+      *Resuelta por Carlos el 2026-09-07: **se aceptan los pesos de la §16.1
+      tal cual**, como defaults del plugin, y se ajustan cuando haya datos.*
+      *El motivo de no "validarlos con datos reales" como pedia el enunciado
+      es que **no se puede**: medido el 2026-09-07 sobre las 10 tareas de
+      `04-terminadas/`, el historial entero es **6 `media` y 4 `simple`**. No
+      existe ni una tarea `trivial`, `compleja` ni `critica`, asi que tres de
+      los cinco niveles no tienen con que contrastarse. Fingir esa validacion
+      seria peor que declararla pendiente.*
+- [x] **#16** · Umbral de dominios para caer a revisor único
+      *Resuelta por Carlos el 2026-09-07: **3**, el punto de partida que
+      propone la §16.5. Con 2 se perderia el caso que motivo la seccion
+      (backend + el componente que lo consume), que es justo donde varios
+      revisores en paralelo aportan. **No se hace configurable todavia**:
+      seria una cuarta clave en `.taskcode/config.yml` que nadie lee hasta
+      que exista D3, y la decision #9 prohibe expresamente declarar claves
+      que no hacen nada.*
+- [x] **#17** · ¿Revisión ligera solo para `trivial`, o también `simple`?
+      *Resuelta por Carlos el 2026-09-07: **solo `trivial`**, contra lo que
+      sugeria la §16.6 con su "(y probablemente `simple`)".*
+      ***Decidida con datos, no con criterio***: *de las 4 tareas `simple`
+      cerradas, **una escondia un CRITICO** — TASK-024, donde un `user.email`
+      con un salto de linea inyectaba una clave que pisaba `estado` y dejaba
+      la tarea ladrillada con exit 0 y sin aviso — y **las cuatro** tuvieron
+      al menos un IMPORTANTE (TASK-027: el fix era solo de Windows y su test
+      habria caido en el CI de Linux; TASK-028: la correccion habria
+      reproducido el defecto que venia a arreglar; TASK-015: 3 importantes).
+      Abaratar la revision de `simple` habria dejado pasar el peor bug del
+      proyecto.*
+      *Efecto secundario que conviene saber: como tampoco existe ninguna
+      tarea `trivial` en el historial, **la regla casi nunca se activara**.
+      Eso hace D4 mucho menos valioso de lo que parecia — merece revisarse si
+      vale sus ~3h antes de implementarlo.*
+
+---
+
+## Corte mínimo defendible
+
+**Fases A + B + C = 18 items, ~39h.** Dejan un sistema completo y usable,
+con la metodología cumplida en lo esencial y el brainstorm multi-agente
+pendiente como mejora futura. Si hay que parar antes de tiempo, es aquí.
+
+---
+
+## ✅ F — Auditoría 2026-10-03 (22/22)
+
+*(El contador iba uno por debajo desde antes de la fase 6: las 22 casillas
+están marcadas. Corregido al publicar la 0.5.0.)*
+
+- [x] TASK-033 — Comando de sincronización tras cada transición (v0.1.1)
+- [x] TASK-034 — F1-T1 Excluir lo generado del diff de revisión
+- [x] TASK-035 — F1-T2 Política de rondas y una sola suite por ronda
+- [x] TASK-036 — F1-T3 Veredicto con un comando e informe estructurado
+- [x] TASK-037 — F2-T1 Logging de Git-Flow sin lanzar procesos
+- [x] TASK-038 — F2-T2 Una sola detección de origin, con timeout
+- [x] TASK-039 — F2-T3 Menos llamadas git en los comandos
+- [x] TASK-040 — F3-T1 `taskctl review` para la ronda 2 y siguientes (v0.2.0)
+- [x] TASK-041 — F4-T1 `taskctl new` con objetivo y criterios
+- [x] TASK-043 — F4-T2 Validación antes de plan y puertas de cierre
+- [x] TASK-044 — F4-T3 Partición propuesta de las tareas grandes
+- [x] TASK-042 — F4-T4 Complejidad por heurística y un rol sin unificador
+- [x] TASK-045 — F5-T1 `rama_base` de punta a punta
+- [x] TASK-046 — F5-T2 Secciones con subtítulos y criterios multilínea
+- [x] TASK-047 — F5-T3 Flags desconocidos y mensajes de review
+- [x] TASK-050 — F6-T1 Suite rápida y repo plantilla en los tests
+- [x] TASK-051 — F6-T2 Partir los ficheros de test más largos
+- [x] TASK-048 — F6-T3 Skill de flujo más ligera
+- [x] TASK-049 — F6-T4 Metadatos del plugin y modelo de los agentes
+- [x] TASK-052 — F6-T5 Telemetría de fases y heurística recalibrada
+- [x] TASK-053 — `moveTareaFile` reintenta el rename ante EPERM/EBUSY
+- [x] TASK-054 — Rutas no ASCII en el diff de revisión por dominio
+
+## G — Flujo guiado por fases (5/5)
+
+Pedido por Carlos el 2026-10-04 con prioridad sobre el resto de la fase F.
+Plan de referencia: `tareas/.../TASK-055/planificacion/plan-final.md`.
+
+- [x] TASK-055 — Flujo A: `taskctl` desde PowerShell y cmd
+- [x] TASK-056 — Flujo B: núcleo determinista del siguiente paso y registro de transiciones
+- [x] TASK-057 — Flujo C: fases como skills invocables en modo manual
+- [x] TASK-058 — Flujo D: modo semiautomático
+- [x] TASK-059 — Flujo E: modo automático
+
+## H — Peticiones tras el plan (3/3)
+
+Funcionalidad pedida por Carlos después de cerrar el plan de terminación.
+
+- [x] TASK-060 — Opciones de cierre en `finish`: merge normal (por defecto),
+      merge request y tag — cerrada el 2026-10-06, publicada en la 0.6.0
+      *`--tag <nombre>` pone un tag anotado sobre el commit de merge, validado
+      antes de mergear y subido solo con `--push`; en hotfix y release le da
+      nombre al tag del script. `--merge-request` abre el PR en GitHub o el MR
+      en GitLab tras un preflight sin efectos, y un segundo `finish` cierra
+      cuando la plataforma lo da por mergeado. Clave `cierre_por_defecto` y
+      la skill `finish` pregunta salvo en automático. Hubo 2 rondas: 1
+      IMPORTANTE (la rama se daba por integrada con commits que no estaban en
+      el MR) y 5 MENOR, todos corregidos.*
+- [x] TASK-061 — Merge request en cualquier GitLab, también autoalojado —
+      cerrada el 2026-10-08
+      *Claves `plataforma_remota` y `url_base_remoto`; `glab` recibe
+      `GITLAB_HOST` (la base) y `-R` (el proyecto relativo a la base) desde
+      un único punto. La sesión se comprueba con `glab api user` y el MR se
+      crea con `glab api`, porque `glab mr create` no funciona con una
+      instancia bajo una ruta. Una clave desconocida en la config avisa en
+      lugar de abortar. Hubo 2 rondas: 1 IMPORTANTE, reproducido con glab
+      real (`mr create` fallaba en subpath después de subir la rama), y 3
+      MENOR. Verificado con glab real contra HTTPS local.*
+- [x] TASK-062 — `taskctl doctor`: comprobar que un proyecto está listo —
+      cerrada el 2026-10-08, publicada en la 0.7.0
+      *Solo lee. Comprueba el entorno (Node 22, git, y bash ejecutando un
+      script real, sin OK falso con WSL), el repo, la config, la coherencia
+      de las tareas con un recorrido propio y, si aplica, la sesión de
+      gh/glab. Cada fallo trae su arreglo; con `--json` y código 1 solo si
+      hay errores. Hubo 1 ronda, con 5 MENOR corregidos.*
+
+## I — Métricas v2 (3/3)
+
+Pedido por Carlos el 2026-10-25: medir el comportamiento del plugin en los
+proyectos que lo usan (ToolsaWeb, OpenGisViewer, TaskCode) antes de decidir
+mejoras de tokens, tiempo, verificación o memoria de contexto. Se partió en
+el diseño de TASK-063 en captura (A) y lectura (B).
+
+- [x] TASK-063 — Métricas v2 (A): capturar desglose de coste, lecturas y
+      origen de hallazgos — cerrada el 2026-10-25
+      *Tabla `## Coste` en `tarea.md` con entrada, caché escrita y leída,
+      salida, lecturas y total por registro; las lecturas cuentan Read, Grep,
+      Glob, MCP de lectura y Bash de lectura. Columna `Origen` por hallazgo
+      (implementación, plan o especificación) y `leerHallazgos`. `finish`
+      avisa sin coste de implementación. 1 ronda, aprobada, 3 MENOR
+      aceptados (dos pasan a TASK-064).*
+- [x] TASK-064 — Métricas v2 (B): fila de métricas con coste desglosado,
+      hallazgos y lecturas — cerrada el 2026-10-25
+      *`metricas` da por tarea crit/imp/men y su origen, contados una vez
+      por tarea (revisor + ID, severidad por primera palabra, fusión campo a
+      campo entre rondas); con `--tokens`, tokens nuevos, lectura de caché y
+      sin desglose; terminadas sin coste y mediana de lecturas. Se partió en
+      su diseño: los agregados pasan a TASK-065. 2 rondas: 2 IMPORTANTE
+      reproducidos con OpenGisViewer (fila «sin hallazgos» contada; la última
+      ronda borraba un dato reconocido), corregidos.*
+- [x] TASK-065 — Métricas v2 (C): evolución, grupos y varios proyectos —
+      cerrada el 2026-10-25
+      *`--evolucion`, `--grupos` y `--repo` repetible (clave proyecto + id,
+      `realpath`, abortos ante rutas dudosas), `--json` con lista cerrada de
+      flags, flags repetidos que abortan en todos los comandos, lista sin
+      coste acotada y coste de agentes reanudados por diferencia. Línea base
+      de ToolsaWeb, OpenGisViewer y TaskCode (194 tareas) en su Resultado.
+      1 ronda, aprobada con 3 MENOR aceptados.*
+
+## J — Doctor-deploy (3/3)
+
+Pedido por Carlos el 2026-10-27: un doctor para antes de lanzar o publicar una
+aplicacion que compruebe punto por punto una lista de seguridad generica
+(20 puntos pedidos mas los medibles que falten), adaptada al tipo de
+aplicacion, que diga que falla y como arreglarlo, y cree tareas desde
+TASK-9999 hacia abajo. Partido en dos: deterministas (A) y juicio, tareas y
+aviso en release (B).
+
+- [x] TASK-066 — Doctor-deploy A: catalogo generico y comprobaciones
+      deterministas — cerrada el 2026-10-27
+      *`taskctl doctor-deploy [--json] [--escribir]`: catalogo de 43 puntos y
+      15 tipos como datos, capa del proyecto con desactivar y silenciar por
+      hallazgo, cuatro estados sin OK sin evidencia, seis sondas
+      deterministas (secretos en arbol e historial, ficheros de secretos,
+      .gitignore, lockfile, dependencias) y enmascarado en origen. 3 rondas:
+      7 IMPORTANTE (falsos OK por cobertura y tests que faltaban), corregidos;
+      MEN-12 y MEN-13 pasan a TASK-067.*
+- [x] TASK-067 — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso
+      en release — cerrada el 2026-10-27
+      *Skill doctor-deploy y agente revisor-seguridad-deploy; `--resultado`
+      con veredictos citados por fichero:linea y rechazos con motivo; JSON v2
+      y `<fecha>.json`; `--crear-tareas` desde TASK-9999 hacia abajo con
+      etiqueta `doctor-deploy:<punto>` y sin duplicar; rango reservado
+      TASK-9000..9999 fuera de la numeracion normal; aviso sin bloquear en
+      `finish` de una release. 2 rondas: solo MENOR, corregidos (el aviso
+      ignora tambien `tareas/` por decision de Carlos).*
+- [x] TASK-068 — Doctor-deploy C: tipo de aplicacion y sondas deterministas
+      extra (Firebase/RLS, .npmrc, docker-compose, CI, Dockerfile; version
+      vigente de OWASP/ASVS) — cerrada el 2026-11-04
+      *Clase de aplicacion como segundo eje (web, api, movil, cli, libreria):
+      sin clase detectada los puntos aplican; con cli o libreria y sin senal de
+      servicio, diez puntos salen NO APLICA con el marcador en el motivo. Siete
+      sondas deterministas nuevas (puntos 37-43), JSON v3 y referencias OWASP
+      Top 10 2025 + ASVS 5.0. 2 rondas: IMP-1..3 corregidos (API con bin,
+      variantes de Dockerfile/compose, huella por paso en pr-target);
+      MEN-3, 5, 6, 7 y 8 aceptados.*
+
+## ✅ K — Frenos de verificación con hooks (8/8)
+
+Que una tarea no se dé por hecha ni se mergee con la verificación en rojo,
+usando hooks Stop y PreToolUse de Claude Code. Ideas tomadas de
+gemba-app/brakes (Apache-2.0), sin copiar código. Empieza por un spike.
+
+- [x] TASK-069 — Spike: hooks Stop y PreToolUse de Claude Code en
+      Windows/IntelliJ — cerrada el 2026-11-03
+      *Sonda inerte `hooks/sonda-hooks.mjs` (Node, forma exec) con 16 casos de
+      test y steps de CI. H1–H6 confirmadas en Windows nativo con Claude Code
+      2.1.317 (`claude -p`): Stop con exit 2 devuelve al agente y
+      `stop_hook_active` corta el bucle; PreToolUse bloquea `git merge` por
+      Bash y PowerShell, también en subagentes. Criterio de CI sin marcar: la
+      rama no se había subido. 2 rondas: IMP-1 (la regex bloqueaba
+      `git merge-base`), corregido; MEN-5 y MEN-6 aceptados para TASK-071/072.*
+- [x] TASK-070 — Clave `comando_verificacion` en `.taskcode/config.yml` —
+      cerrada el 2026-11-04
+      *`comando_verificacion` (null = sin freno) y `timeout_verificacion` (600 s)
+      en `config.ts`, con fallo cerrado y el timeout sin comando abortando;
+      `taskctl doctor` da `ok` con el comando u `omitida` con el arreglo en la
+      misma línea (no `aviso`, para no tocar los tests existentes). Validadores
+      de sincronización generalizados sin cambiar sus mensajes. 1 ronda:
+      aprobada, MEN-1 y MEN-2 aceptados. Sin versión: llega con TASK-071.*
+- [x] TASK-071 — Hook Stop: una tarea no se da por hecha con la verificación
+      en rojo — cerrada el 2026-11-04
+      *Hook `Stop` en forma exec (`dist/src/hooks/stop-verificacion.js`,
+      timeout 3600): con tarea en `02-en-curso` en la rama y
+      `comando_verificacion`, ejecuta y sale 2 con comando, código, duración y
+      cola (40 líneas / 4 KiB, sin ANSI ni credenciales en URLs). Sin procesos
+      fuera de un proyecto con tareas; `FRENO_VERIFICACION=0` lo apaga.
+      Decisiones de Carlos: la clave basta, config inválida bloquea una vez,
+      memo de verdes y rojos por huella en `.git/`. Envoltorio extraído a
+      `fs/ejecucion-acotada.ts`. Smoke con `claude -p` real. 2 rondas: IMP-1 e
+      IMP-2 (tests de huella y de tope) y MEN-1..7 corregidos; MEN-8 aceptado.*
+- [x] TASK-072 — Puerta de verificación en `finish` y merge guard — cerrada el
+      2026-11-04
+      *`finish` ejecuta siempre `comando_verificacion` antes de mergear o abrir
+      el MR (no en el segundo MR ni en el camino idempotente) y aborta en rojo;
+      `--sin-verificacion` lo anota commiteado en la rama antes del merge. Hook
+      `PreToolUse` sin `if` (sustituye a la sonda): bloquea `git merge` y los
+      scripts de cierre hacia `rama_base`/main sin verde guardado del commit
+      fuente; analiza compuestos y `bash -c`/`pwsh -Command`. Decisiones de
+      Carlos D1–D4. Smoke con `claude -p` real. 2 rondas: MEN-1..3 corregidos;
+      MEN-4 (`bash -o pipefail -c`) aceptado y resuelto en TASK-077.*
+- [x] TASK-077 — Guardián de merges: opciones con valor antes de `-c` y doc de
+      `bash -c` — cerrada el 2026-11-04
+      *Seguimiento de TASK-072: helper `opcionesDeShell` (una regla para `-c` y
+      para el script de cierre; un valor por cada `o`/`O` del grupo, `--rcfile`,
+      `--init-file`); texto de `-c` = primer no-opción. README y CHANGELOG. 2
+      rondas: MEN-1 (`-oc`) y MEN-2 (test de `+c`) corregidos.*
+- [x] TASK-073 — Tests held-out por tarea — cerrada el 2026-11-05
+      *Primera parte (partida por decisión de Carlos): `comando_heldout`;
+      `finish` ejecuta `aceptacion/` con `HELDOUT_DIR` tras la verificación y
+      aborta en rojo sin mostrar la salida; huella por árbol de Git frente a la
+      base (con merge-base para saber si cambió la base o la rama); comando de la
+      config de la base; hotfix contra main; `aceptacion/` siempre fuera del
+      diff de revisión; `heldout.md` en la skill. 3 rondas: IMP-1..3 y MEN-1..6
+      corregidos; MEN-7 (test en negativo del «Ademas») aceptado.*
+- [x] TASK-078 — Hook que impide leer y editar los held-out de la tarea en curso
+      (segunda parte de TASK-073) — cerrada el 2026-11-05
+      *Guardián `PreToolUse` (`guardia-heldout.ts`) con dos entradas: la nueva
+      de fichero (`Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob`) y la de
+      Bash/PowerShell ampliada. Casado por segmentos tras normalizar barras,
+      mayúsculas, `..` y relativas al cwd. Decisiones de Carlos: tarea protegida
+      por el nombre de la rama (nunca `tarea.md`), el remedio de `finish` lo
+      ejecuta la persona, sin interruptor. Riesgos aceptados declarados en
+      `heldout.md` (Grep sobre la raíz, cambiar de rama). Smoke con `claude -p`
+      real. 2 rondas: MEN-1..5 corregidos o declarados.*
+- [x] TASK-074 — Cobertura sobre las líneas cambiadas — cerrada el 2026-11-05
+      *Freno 8: lcov propio (`core/lcov.ts`) cruzado con las líneas añadidas desde
+      la merge base (`git diff -U0` con opciones fijas, respetando
+      `excluir_de_revision`). `review` lo informa en la petición; `finish` frena
+      con `umbral_cobertura` (% mínimo, el exacto pasa) leído de la rama base, y
+      sin datos fiables no cierra. Claves `informe_cobertura` y
+      `umbral_cobertura`. Node escribe `SF:` relativo y con `\`: tests con lcov
+      real. Smoke con el CLI real. 4 rondas (la 4.ª autorizada por Carlos):
+      IMP-1..6 y MEN-1..8 corregidos, con la regla de los ficheros fuera del
+      informe precisada tres veces por Carlos; MEN-9 y MEN-10 (huecos de test)
+      aceptados. Seguimiento: dogfooding en este repo.*
+
+## ✅ L — Mantenimiento (2/2)
+
+Arreglos que salen al revisar otras tareas y no son de ninguna fase.
+
+- [x] TASK-075 — Contrapruebas de descubrimiento rotas por el validador de
+      Claude Code 2.1.316+ (detectado al revisar TASK-069) — cerrada el 2026-11-05
+      *Helper `test/helpers/validador-claude.ts`: «valida limpio» = exit 0,
+      `Validation passed` y ninguna cruz antes de la línea `Plugin directory
+      checks for` (el bloque del directorio marca README_MISSING con cruz aunque
+      pase). Tests 13/14/16/17 lo usan; test unitario que corre en CI. En
+      Windows quedan solo los 3 rojos conocidos. 2 rondas: MEN-1 (corte anclado a
+      principio de línea) corregido; MEN-2 aceptado.*
+- [x] TASK-076 — `taskctl doctor` avisa de hooks PreToolUse sobre Agent que
+      bloquean los subagentes en modo automatico, y version nueva del plugin
+      para avisar a todos los proyectos (detectado durante TASK-068) — cerrada el 2026-11-06
+      *Comprobación `hooks-subagente` (AVISO, id fijo, origen + ruta + matcher):
+      settings de usuario, proyecto y local, y la versión activa de cada plugin
+      habilitado (`installed_plugins.json`, `enabledPlugins`, `projectPath`,
+      `hooks.json` y `hooks` de `plugin.json`); respeta `disableAllHooks`. Matcher
+      con regex anclada y `""`/`*`/ausente cuentan (decisión de Carlos). README con
+      «Problemas conocidos», regla en `avance.md`, versión 0.9.0 (publicada en
+      0.9.0; tag creado en TASK-089). 2 rondas: MEN-1..5 corregidos; MEN-6 y MEN-7
+      aceptados.*
+
+## M — Revisores y roles de dominio (2/2)
+
+Revisores por pares y roles del brainstorm para dominios que el plugin no cubria.
+
+- [x] TASK-079 — Revisor por pares de dominio para Rust y WASM — cerrada el 2026-11-06
+      *Skill `rust-wasm-reviewer` (`.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`,
+      `.cargo/config.toml`, toolchain/rustfmt/clippy): ownership, errores sin panic,
+      limite JS-WASM (llamador TS y `.d.ts` obligatorios si cambia una firma
+      exportada), numerica en f64, `unsafe`, rendimiento. Catalogo `skill_6`, tabla
+      de revisores en el README, nota de umbral del generico (con cuatro dominios
+      ya puede superarse). Version 0.10.0, publicada (tag creado en TASK-089). 2 rondas: MEN-2, 3, 4 y 6
+      corregidos (exactitud tecnica de la skill); MEN-1 y MEN-5 aceptados.*
+- [x] TASK-080 — Accesibilidad en angular-vue-reviewer y roles de arquitectura y
+      rendimiento en plan — cerrada el 2026-11-06
+      *`angular-vue-reviewer` revisa accesibilidad por criterio WCAG 2.2 (contraste,
+      foco, teclado, ARIA, nombre accesible, dialogos) con severidad escrita;
+      `brainstorm-arquitectura` mira limites, dependencias, acoplamiento y ADR. Rol
+      condicional `brainstorm-rendimiento` (etiquetas rendimiento/wasm/workers/3d,
+      solo con 2+ roles, fuera de la escalera; con 0 o 1, `plan` avisa).
+      `planEsPlantilla` lee los roles del disco: la plantilla vacia con rendimiento
+      ya no se da por redactada. Publicada en 0.11.0. 2 rondas:
+      IMP-1 y MEN-1..5 corregidos; MEN-6 (restos cosmeticos de "cuatro") aceptado.*
+
+---
+
+## N — Mejoras tras las métricas de la 0.8 (10/10)
+
+Abierta el 2026-11-07 tras medir ToolsaWeb con `taskctl metricas` (51 tareas
+con la 0.8): calidad estable, pero tokens de revisión casi el doble, ninguna
+tarea a la primera y datos incompletos para comparar versiones. Orden y
+dependencias en `docs/ROADMAP.md`.
+
+- [x] TASK-081 — Revisión más barata: medir y acotar las lecturas de los revisores — cerrada el 2026-11-07
+      *`## Coste` gana las columnas `ronda` y `revisor` (las filas de 9 se siguen
+      leyendo); `registrar-coste` escribe una fila por revisor deduciendo ronda y
+      revisor de su transcripción, y `metricas --tokens` muestra lecturas y
+      CRÍTICO/IMPORTANTE por ronda y revisor. La petición trae `## Contexto
+      permitido` (clave `contexto_revision`), la skill común la sección «Lo que
+      lees» y el informe sus lecturas fuera de contexto. En ronda 2+ se sugiere un
+      modelo un escalón más barato con regla estricta (enmienda de la §16.6).
+      Dogfooding: ronda 1 (sonnet) 12,5 M con 14 lecturas; ronda 2 (haiku,
+      acotada) 1,97 M: el exceso viene del contexto que acumula el revisor, no de
+      leer ficheros. 2 rondas: MEN-1, 2 y 4 corregidos; MEN-3, MEN-5 y dos MENOR
+      de r2 (mayúsculas y `..` en `contexto_revision`) aceptados.*
+- [x] TASK-082 — Autorrevisión del implementador antes de pedir revisión — cerrada el 2026-11-07
+      *La skill `review` manda, antes de `taskctl review` y sin lanzar agente,
+      pasar la `## Que se revisa` de cada revisora, corregir lo evidente y anotar
+      `## Autorrevision` en `tarea.md` (`- <revisora> — <commit>`, sin juicios).
+      `review` avisa sin bloquear si falta con contenido (`core/autorrevision.ts`),
+      y `siguiente --json` da `revisores` en la fase review con el mismo
+      clasificador, desde la merge base (`fs/revisores-rango.ts`). La lista vive
+      solo en cada revisora (ancla unificada en la de C#). Dogfooding: la propia
+      autorrevisión sacó un test que faltaba. 1 ronda, aprobada (9 de 10
+      mutantes muertos): MEN-1 (el `catch` de `siguiente` sin test) aceptado.*
+- [x] TASK-083 — Cierre sin ronda 2 completa cuando solo quedan MENORES — cerrada el 2026-11-07
+      *Medido antes de implementar (`docs/METRICAS.md` §13): 33 de 138 rondas 2
+      (23,9 %) partían de una ronda 1 sin CRÍTICO ni IMPORTANTE y 0 encontraron
+      uno nuevo; por fragmento solo ToolsaWeb TASK-013, cuya ronda no era
+      elegible. `alcanceRondaSiguiente` (pura, fail-closed, junto a la regla de
+      modelo de TASK-081) y `review` la convierte en completa con `--completa`,
+      sin diff de correcciones, con merges o con ficheros no nombrados; la
+      acotada va a un solo revisor con instrucciones de verificación, y tras ella
+      la completa revisa desde la base. `veredicto` avisa de `cambios-solicitados`
+      con solo MENORES. Umbral y salvaguardas, decididos por Carlos. 1 ronda,
+      aprobada sin hallazgos (15 de 15 mutantes muertos).*
+- [x] TASK-084 — Versión del plugin en cada tarea y métricas por versión — cerrada el 2026-11-07
+      *Cada fila de `## Transiciones` lleva como quinta columna la versión de
+      taskctl (`src/core/version.ts`, con test de alineación con `package.json` y
+      `plugin.json`); las de 4 columnas se siguen leyendo y la primera fila con
+      versión amplía solo cabecera y separador. `taskctl metricas --por-version
+      [--json]` agrupa las terminadas por la versión del último `finish`, en orden
+      semver, con rondas, a la primera, hallazgos por severidad y origen y tokens
+      por fase; las sin versión, aparte. Versión subida a 0.12.0 al abrir el ciclo
+      (publicada el 2026-11-07). 1 ronda, aprobada: MEN-1 y MEN-2 (dos huecos de test, el
+      código es correcto) y MEN-3 (separador con alineación) aceptados.*
+- [x] TASK-085 — Coste de implementación registrado automáticamente — cerrada el 2026-11-07
+      *Hook en `Stop` y `SubagentStop` que solo anota rutas de transcripción en
+      `.git/coste-pendiente.jsonl` (guardas baratas, ningún proceso sin tarea en
+      curso, siempre exit 0). `review` suma, en su commit, lo gastado entre el
+      `start` y el `review` en la rama y el repo de la tarea (`timestamp`,
+      `gitBranch` y `cwd` de cada línea), descontando lo ya anotado (`dif:`);
+      `finish` repite como red. Decisiones de Carlos: el hilo principal cuenta,
+      volcado en review/finish, las 97 tareas viejas de ToolsaWeb fuera. Probado
+      en la propia tarea (+14,3 M de implementación). 2 rondas: MEN-1 y MEN-2
+      (tests de la red de finish y del guard de campos negativos) corregidos.*
+- [x] TASK-086 — Descontar las pausas de las duraciones de las métricas — cerrada el 2026-11-07
+      *Cada racha de `pausa` dura hasta la siguiente transición que no sea
+      pausa y se resta de diseño, curso, revisión y `total`; una pausa abierta
+      no descuenta y con precisión de día tampoco. `--json` gana la lista
+      `pausas` con `enPausa` por tarea; §14 de `docs/METRICAS.md`. Revisión: 2
+      rondas (MEN-1, empate de segundo con origen git, y MEN-2, doc, corregidos).*
+- [x] TASK-087 — `taskctl doctor` avisa si el plugin instalado está desactualizado — cerrada el 2026-11-07
+      *Comprobación `version-plugin` de doctor: compara la versión instalada
+      (`installed_plugins.json`) con la copia local del marketplace, sin red.
+      Disponible mayor da AVISO con los comandos `claude plugin marketplace
+      update` y `claude plugin update`; lo no comprobable es `omitida`; nunca
+      error, así que el código de salida no cambia. Dos rondas (MEN-1 y MEN-2
+      corregidos, MEN-3 aceptado).*
+- [x] TASK-088 — `taskctl doctor` avisa si falta `comando_verificacion` con tests detectables — cerrada el 2026-11-07
+      *Sin la clave, `verificacion` da AVISO si la raíz tiene tests detectables
+      (`package.json` con `test` propio, Cargo, Maven, Gradle, .NET, Go, pytest) y
+      propone el comando (gestor según el lock, wrappers, varios con `&&`); sin
+      tests sigue `omitida`. Revisión: 2 rondas, 3 MENOR corregidos, aprobada.*
+- [x] TASK-089 — Evitar literales con forma de secreto en el repo y tags de versión que faltan — cerrada el 2026-11-07
+      *Las claves falsas de los tests viven troceadas en `test/helpers/claves-falsas.ts`, y
+      `test/empaquetado/sin-literales-secretos.test.ts` recorre `git ls-files` con los patrones de
+      push protection (sin `\b` delante: una clave tras un `\n` escrito como texto también casa) y
+      una lista blanca de tres valores exactos de informes históricos. Tags anotados v0.9.0
+      (`df59da2`) y v0.10.0 (`b85f37e`) creados y en origin. Revisión: aprobada en ronda 1, dos
+      MENOR aceptados (solo mira lo rastreado; los patrones son un subconjunto de los de GitHub).*
+- [x] TASK-090 — El guardián de secretos tolera excepciones solo en su fichero histórico — cerrada el 2026-11-07
+      *Fix de TASK-089: GitHub bloqueó el push de develop porque el plan de TASK-089
+      citaba entera la clave de ejemplo de Stripe y el guardián la toleraba por valor
+      (Carlos la permitió en GitHub, sin reescribir historial). Ahora solo
+      `AWS_EJEMPLO` vale en cualquier fichero; Stripe y Slack, como parejas exactas
+      fichero+valor de los informes históricos de TASK-066 y TASK-089, y una pareja
+      sin uso es rojo. 1 ronda, aprobada, 8 mutantes en rojo; MEN-1 (apariciones sin
+      límite en su fichero) y MEN-2 (AWS por valor) aceptados. Publicada en 0.12.0.*
+
+## ✅ O — Verificación selectiva por impacto (1/1)
+
+Pedida por Carlos el 2026-11-09 desde ToolsaWeb, donde la verificación completa ya
+tarda unos 40 minutos y se repetía en cada ronda de revisión.
+
+- [x] TASK-091 — Verificación selectiva por impacto en las rondas y completa obligatoria antes de integrar — cerrada el 2026-11-09
+      *Clave `comando_verificacion_selectiva` (+ timeout) que recibe la base en
+      `RAMA_BASE`; la usan el hook `Stop` y `review`, que la corre antes de escribir
+      la ronda (rojo o árbol sucio abortan sin ronda; la petición la cuenta y omite
+      la cobertura). La completa sigue siendo la puerta de `finish` y del guardián:
+      selectiva sin completa aborta y su memo va aparte. `doctor` avisa si falta.
+      Guía `skills/task-workflow/verificacion-selectiva.md`. 5 rondas: las 2 a 4
+      por la misma frase del mensaje de `review` (describía un momento, no un
+      estado); MEN-1 de la ronda 5 aceptado. Publicada en 0.13.0.*
+
diff --git a/docs/contexto/archivo/ESTADO-hasta-2026-11-12.md b/docs/contexto/archivo/ESTADO-hasta-2026-11-12.md
new file mode 100644
index 0000000..c790a7a
--- /dev/null
+++ b/docs/contexto/archivo/ESTADO-hasta-2026-11-12.md
@@ -0,0 +1,571 @@
+# Estado del proyecto hasta el 2026-11-12 (archivo)
+
+> Archivo. Es el `../ESTADO.md` entero tal como estaba el 2026-11-12, movido
+> sin cambios por TASK-124. Su última actualización escrita era del
+> 2026-10-05, así que lo posterior no está aquí: está en el `ESTADO.md` vivo,
+> en `../ROADMAP.md` y en el `CHANGELOG.md` del plugin. No se edita.
+
+---
+
+# Estado del proyecto — handoff
+
+> Última actualización: **2026-10-05** (fase 6 de la auditoría cerrada, v0.5.0: el plan de la auditoría, terminado).
+> Este documento se actualiza al cerrar cada fase. Si lo que dice no cuadra
+> con el repo, gana el repo — y hay que corregir esto.
+
+## Auditoría del 2026-10-03 — en curso (fase F)
+
+Plan: `docs/auditoria/PLAN-SOLUCION-2026-10-03.md`. Se ejecuta en continuo,
+una tarea tras otra, con release y aviso a OpenGisViewer al cerrar cada fase.
+
+- **v0.1.1** — TASK-033: comando de sincronización tras cada transición.
+- **v0.1.2** — fase 1 (TASK-034, 035, 036): revisión más barata (excluir lo
+  generado del diff, una suite por ronda, `taskctl veredicto`).
+- **v0.1.3** — fase 2 (TASK-037, 038, 039): Git-Flow con menos procesos y una
+  sola detección de origin.
+- **v0.2.0** — fase 3 (TASK-040): ronda 2 de revisión incremental.
+- **v0.3.0** — fase 4 (TASK-041, 042, 043, 044, más TASK-046 y TASK-053):
+  tareas concretas y acotadas. Métrica: contra las 27 tareas cerradas, la
+  puerta de `plan` habría bloqueado solo TASK-029, 030 y 032 (las de
+  peticiones de 110-160 KB), y la partición propuesta de las tres coincide
+  con la que se hizo a mano. Una tarea `simple` lanza 1 agente en vez de 3.
+- **Fase G** (urgente, pedida por Carlos el 2026-10-04; TASK-055 a 059):
+  el plugin conduce el ciclo. Fases como skills (`/taskcode-plugin:<fase>`),
+  `taskctl siguiente` decide el paso, `modo_flujo` manual / semiautomatico /
+  automatico congelado en la tarea, registro `## Transiciones`, `taskctl
+  pausa`, cadena con bloqueo por arbol que hace cumplir el CLI, y el
+  automatico con sus guardas (lo cerrado = lo revisado, tope de 3 rondas,
+  hotfix/release preguntan). Ademas `taskctl.cmd` y la funcion de perfil de
+  PowerShell. Pendiente: smoke dentro de una sesion de Claude Code (este
+  entorno no autentica `claude -p`).
+- **v0.4.0** — fase G entera y fase 5 (TASK-045, 046, 047, 054): `rama_base`
+  de punta a punta; un flag desconocido aborta en todo el CLI con sugerencia;
+  `review` separa agente/modelo de la skill revisora; rutas no ASCII y de glob
+  llegan con su diff a la petición de su dominio.
+- **v0.5.0** — fase 6 (TASK-050, 051, 048, 049, 052): `npm run test:rapido`
+  (357 tests en ~11 s) y suite completa de 633 a 436 s de media (partiendo
+  los ficheros largos); skill de flujo de 22 a 13 KB y lo común de las
+  revisoras en un solo sitio; `plugin.json` completo y licencia MIT;
+  `## Transiciones` con instante UTC, `taskctl metricas` y heurística
+  recalibrada (`nivel_trivial_hasta` 1 → 0). La nueva cola de la suite:
+  `siguiente`, `distribucion`, `plan-brainstorm`, `plan`.
+- **v0.6.0** — TASK-023 (E2): coste en tokens por fase.
+  `taskctl registrar-coste --agente <id>` suma el uso real de la transcripción
+  de cada subagente, `taskctl metricas --tokens [--escribir]` lo agrega, y la
+  §11 de `docs/METRICAS.md` trae el histórico de 41 tareas. Con esto **el plan
+  de terminación está completo: 69/69**.
+  Y TASK-060: `finish` con `--tag`, `--merge-request` (GitHub/GitLab) y la
+  clave `cierre_por_defecto`.
+- **Pendiente**: el smoke del flujo guiado dentro de una sesión real de Claude
+  Code (lo hace Carlos).
+
+## Dónde estamos
+
+**41 de 42 items del plan de terminación (98%).** Sprint 0 y Sprint 1
+completos (TASK-001 a TASK-012), **las Fases A, B, C y D cerradas enteras**,
+y la Fase E a un solo item de cerrarse del todo: E1, E3, E4, E5 y E6 hechos;
+solo queda **E2 (TASK-023, sin empezar)**.
+
+El total ha bailado dos veces: subió de 42 a 43 cuando la revisión de C5 abrió
+**E6** (la distribución del CLI del plugin, ya cerrada en TASK-031), y ha
+vuelto a 42 al descartarse **D4** con datos delante.
+
+La Fase D se cerró con D1 (TASK-016, brainstorm paralelo por roles),
+D2 (TASK-017, catálogo de skills determinista), D3 (TASK-018, enrutado de
+revisor por diff real fragmentado por dominio) y D5 (TASK-020, `taskctl
+codex-review`) — cada una con su propio ciclo completo de revisión por
+pares (D3 y D5 con hallazgos reales de plataforma corregidos en el propio
+ciclo, no solo de diseño). Detalle línea a línea de cada una en
+`docs/contexto/CHECKLIST_TERMINACION.md`, que es donde de verdad se
+mantiene al día — este documento resume, no repite.
+
+**El ciclo de vida está completo y con reglas de proceso encima que de
+verdad se aplican**: `import → plan → approve → start → review → finish`
+funciona de punta a punta contra un repo Git real, y TASK-013, 014, 015,
+024, 025, 026, 027 y 028 se gestionaron enteras con la propia herramienta.
+`asignado_a` se rellena solo con `git config user.email` (C7), el límite de
+una rama de trabajo por persona funciona mirando las ramas reales (C8), los
+cinco wrappers de Git-Flow ya existen (C1), la carpeta de tarea tiene ya
+la forma que describe la sección 2 de la metodología: `tarea.md` +
+`planificacion/` + `revision/` (C3), y **el plugin por fin expone algo a
+Claude Code**: la skill `task-workflow` (C5). Y los scripts de Git-Flow han
+dejado de arrastrar su deuda: guard de `origin` en los tres que faltaban, el
+registro fuera del workspace del usuario, los mensajes citando `taskctl` en
+vez de menus de IntelliJ, y `abort-merge` viendo cherry-picks y reverts a
+medias (C6). **472 tests** (469 verdes; los 3 rojos son los conocidos de
+este entorno Windows).
+
+Lo que queda es un solo item: las métricas de coste en tokens por fase (E2).
+**El corte mínimo
+defendible —Fases A + B + C— está alcanzado desde hace tiempo**, y ahora
+también la Fase D entera: el sistema es completo, usable y con toda la
+inteligencia de proceso opcional que se planteó, encima.
+
+**Todo subido** (2026-09-07): `develop` está a la par con `origin/develop` y
+las 24 ramas locales existen en el remoto. El repo tiene `origin`
+(`github.com/charliebk/TaskCode.git`) y responde — durante un tiempo estos
+documentos afirmaron que no lo tenía, y era falso.
+
+Hasta hoy el desfase llegó a **41 commits y 4 ramas** sin subir, acumulados en
+una sola sesión de trabajo. Es la tensión que trae la decisión #14, tomada a
+conciencia: `taskctl` commitea pero **no sube** sin `--push`, así que publicar
+depende de que alguien se acuerde. Con la política IECA de no borrar ramas,
+lo que se olvida no se reabsorbe: crece. Conviene subir al cerrar cada item,
+no al cerrar el sprint.
+
+
+## Qué acaba de pasar (sesión del 2026-09-05, segunda parte)
+
+Se cerró el hito real de usabilidad: **la Fase B está a dos items** y el
+ciclo de vida completo ya funciona.
+
+1. **B2** — guard de `origin` en `merge-hotfix-to-main.sh` y
+   `merge-release-to-main.sh`, extraído a `detect_origin_available`. La
+   revisión añadió un matiz importante: "origin configurado pero caído" NO
+   es lo mismo que "sin origin" y aborta, porque el tag se crearía sobre
+   una `main` posiblemente obsoleta.
+2. **B1** — TASK-013, `taskctl review`. El CLI hace lo determinista (update
+   verificado con `merge-base`, mover a `03-en-revision/`, petición con el
+   diff real + scaffold del informe) y el agente lo dispara el orquestador.
+3. **B3** — TASK-014, `taskctl finish`. Cerró su propia tarea: primer
+   cierre de punta a punta. Resuelve la colisión de IDs con dos
+   discriminadores (título distinto y linaje sin ancestro común) y tiene
+   camino idempotente de reintento tras un conflicto de backmerge.
+4. **B4** — histórico de Sprint 0 y 1 en `CHANGELOG.md` y `docs/INDEX.md`
+   (los tres artefactos ya los había creado `finish`).
+5. **B5** — divergencia de `board` resuelta: `taskctl board --escribir`
+   regenera `docs/BOARD.md`; sin el flag sigue siendo de solo lectura.
+
+**Dogfooding real**: TASK-013 y TASK-014 recorrieron `plan → approve →
+start → review → finish` con la propia herramienta. 275 tests, ~95% de
+cobertura.
+
+**Pendiente operativo**: nada. Todo está subido a `origin` — `develop` y las
+cinco ramas de tarea de estas sesiones.
+
+## Qué acaba de pasar (sesión del 2026-09-05, tercera parte): B6 y B7
+
+**B6** — `--asignado-a` en `plan` y `start`, la precondición de B7. El flag
+vive en un módulo compartido (`src/cli/asignado.ts`) que usan los tres
+comandos que lo tocan, `plan`, `start` y `board`. Sin flag se **conserva** el
+`asignado_a` que hubiera, así que `start` hereda lo que dejó `plan`, que es
+lo que describe la §8.2. La revisión por pares encontró un IMPORTANTE real:
+`board --asignado-a` (el nombre canónico que B6 acababa de introducir y que
+sale en la ayuda) se ignoraba en silencio y devolvía **el tablero entero** con
+código 0 — el mismo fallo que el propio commit usaba para justificar el
+alias, sin cerrar el otro lado. 307 tests.
+
+**B7** — TASK-015, límite de WIP, cerrado. Es el primer item que impone
+una regla de proceso, no una capacidad: `taskctl start` aborta si la
+persona asignada ya tiene otra tarea en `02-en-curso` o en
+`03-en-revision`. En diseño no hay tope. Diverge de la §8.2 (que pide dos
+límites, uno sobre el diseño) y esa es hoy la mayor divergencia del
+proyecto: documentada en HALLAZGOS, no reescrita.
+
+La revisión por pares fue la más dura hasta ahora — 16 casos de ataque y
+8 mutaciones del código fuente — y su hallazgo IMPORTANTE fue justamente
+que la divergencia no estaba documentada. 345 tests.
+
+## Qué acaba de pasar (sesión del 2026-09-06): C7 y C8
+
+Los dos items cierran el bloque que arrancó con B6, y se sostenían unos a
+otros: `--asignado-a` → identidad Git → límite de WIP funcionando.
+
+**C7 (TASK-024)** — `asignado_a` sale de `git config user.email`, con la
+precedencia `--asignado-a` > asignado previo > identidad Git > `null`. Que
+el previo gane a la identidad es lo que impide quedarse la tarea de otra
+persona sin decirlo. Migradas 12 tareas a `charlie.bk@gmail.com` (antes
+convivían `charlie.bk` y `carlos` para la misma persona).
+
+**C8 (TASK-025)** — el límite de WIP de B7 **no protegía nada** y nadie lo
+había notado. Leía el árbol de la rama activa, y el paso a `02-en-curso` se
+commitea en la rama de la tarea. Ahora mira las ramas locales sin mergear.
+
+**Las dos revisiones por pares fueron las más duras hasta ahora**, y las dos
+encontraron cosas de peso: un CRÍTICO en C7 (un `user.email` con un salto
+de línea inyectaba una clave en el frontmatter que pisaba `estado` y dejaba
+la tarea ladrillada) y un **RECHAZO** en C8 (para un `hotfix`, 18 ramas ya
+cerradas contaban como abiertas y el camino urgente quedaba inutilizable).
+Ambos corregidos y verificados en el repo real.
+
+Lo que hay que llevarse de aquí está en `HALLAZGOS.md`: **un smoke test que
+ejecuta los comandos en el orden más cómodo confirma lo que ya creías.** El
+de B7 encadenaba dos `start` seguidos, el único orden en el que su límite
+funcionaba, y por eso el fallo pasó su revisión.
+
+## Qué acaba de pasar (sesión del 2026-09-06, segunda parte): C1
+
+**C1 (TASK-026)** — los cinco wrappers de Git-Flow: `taskctl diagnose`,
+`pause`, `resume`, `recover` y `abort-merge`. La §8.3 llevaba desde el
+diseño remitiendo a `taskctl pause` en su mensaje de workspace sucio; ahora
+ese comando existe, y el mensaje lo nombra.
+
+**Parecía enrutar a `bash` y no lo era: el nudo estaba en el stdin.** Cuatro
+de los cinco scripts preguntan con `read -rp`, y `runGitflowScript` invocaba
+con la entrada ignorada desde TASK-007. Con EOF, `pause` sobre un workspace
+sucio moría con `Opcion no reconocida` y `abort-merge` con un merge en curso
+**no abortaba nada y salía con 0**: los dos comandos que más falta hacen
+harían lo contrario de lo que dicen.
+
+La regla que queda para cualquier invocación futura, en `HALLAZGOS.md`:
+**stdin heredado solo cuando hay terminal, ignorado cuando no la hay**, más
+un guard que corta antes de invocar si el valor por defecto del script sería
+inaceptable.
+
+**Dos rondas de revisión por pares.** La primera, APROBADO CON CAMBIOS: 2
+importantes y 7 menores. Los dos importantes fueron de fondo — (a) `pause`
+preguntaba igual con el workspace limpio, porque **todos los scripts se
+escriben el registro en `logs/gitflow/` dentro del repo** y se ensucian el
+workspace ellos mismos; (b) heredar stdin siempre **reintroducía el cuelgue
+indefinido** que motivó el `'ignore'` de TASK-007 — con una tubería abierta
+que nadie cierra (cualquier arnés de agente, y también `node --test`) el
+comando esperaba para siempre, reproducido con el proceso vivo a los 15 s y
+el repo a medias. La segunda ronda, APROBADO: 3 menores, uno corregido (el
+guard nuevo daba falsos positivos porque preguntaba por `logs/` en vez de
+por el fichero que se escribe).
+
+**Lo que C1 le descubrió a C6** —registro dentro del repo, mensajes que
+remiten a los menús de IntelliJ, `abort-merge.sh` ciego a los cherry-picks—
+se cerró el 2026-09-07 con TASK-029, junto al bug de `origin` que era el
+enunciado original del item. Ver más abajo.
+
+**Limitación que queda a propósito**: `taskctl pause` sigue sin servirle a un
+agente sin terminal, que es quien más lo necesitaría. Resolverlo pide un
+`pause --stash` / `--commit`, o sea tocar los scripts, que es la capa que la
+§7.1 declara única fuente de verdad. No se hizo por cuenta propia.
+
+## Qué acaba de pasar (sesión del 2026-09-06, tercera parte): C3
+
+**C3 (TASK-027)** — la carpeta de tarea tiene ya la forma que describe la
+sección 2 de la metodología: `tarea.md` + `planificacion/` + `revision/`.
+`taskctl plan` crea `planificacion/` y escribe ahí el `plan-final.md`;
+`revision/` la creaba `review` desde B1.
+
+**El nudo no era la ruta nueva, era el legado.** Toda tarea planificada con
+la versión anterior del CLI tiene su `plan-final.md` suelto en la raíz de la
+carpeta, y mirar solo la ruta nueva habría dejado a `approve` diciendo "no
+hay plan que aprobar" sobre una tarea que sí lo tiene. Así que `approve`
+acepta las dos ubicaciones, y una re-planificación **migra** el fichero
+legado a `planificacion/` con `rename`, conservando el contenido en vez de
+pisarlo con el scaffold. Si aparecen los dos a la vez, `plan` y `approve`
+**fallan cerrado** sin tocar nada: no eligen por su cuenta cuál gana.
+
+Las 6 tareas ya cerradas en `04-terminadas/` (TASK-013, 014, 015, 024, 025 y
+026) se migraron con `git mv` — rename puro, 0 líneas cambiadas —, así que
+**ya no queda ningún `plan-final.md` suelto en el repo**.
+
+**Revisión por pares ronda 1: APROBADO CON CAMBIOS** (1 importante, 4
+menores), reproducida sobre un clon con smoke test propio y 7 mutantes. El
+importante es la lección que queda: **una reestructuración puede quitar
+cobertura sin quitar comportamiento**. La escritura del scaffold iba con el
+flag `'wx'`, que protege contra pisar un plan existente; el camino nuevo de
+migración pasa por `rename`, y el revisor lo demostró ejecutando el mismo
+mutante en las dos ramas — en `develop` un test se ponía rojo, en la rama
+nueva no. Aplicados todos los hallazgos salvo la parte (a) del #4 (el
+`rename` no tiene un equivalente exclusivo del `'wx'` porque POSIX no lo
+ofrece), documentada sin corregir. 12 tests nuevos, **429 en total**.
+
+La **ronda 2** pidió cambios y, tras corregirlos, aprobó. Su hallazgo importante es el que deja poso: el fix de la ronda 1 estaba validado solo en Windows. En POSIX `stat("planificacion/plan-final.md")` devuelve `ENOTDIR` cuando `planificacion` es un fichero, no `ENOENT`, así que en Linux morían con un error crudo tanto `plan` como `approve` — y **el propio test escrito para certificar ese fix habría fallado en el job `ubuntu-latest`**. El revisor lo confirmó corriendo el código en Linux de verdad. Está en `HALLAZGOS.md`: un fix de errno validado en una sola plataforma no está validado.
+
+## Qué acaba de pasar (sesión del 2026-09-07): C5
+
+**C5 (TASK-028)** — `skills/task-workflow/SKILL.md`, la primera skill del
+plugin. Hasta ahora el plugin era, en la práctica, un CLI y unos scripts
+Bash: **no exponía ni un solo artefacto a Claude Code**, así que todo el
+discurso de la metodología sobre "el agente sabe qué hacer" no estaba
+respaldado por nada. Ahora hay una skill, `taskcode-plugin:task-workflow`,
+de 272 líneas: cuándo aplica y su prerrequisito, el ciclo de vida con sus
+precondiciones, los comandos reales con su firma exacta, la lista de lo que
+**no** existe, 9 reglas de proceso con su motivo, la revisión por pares, la
+tabla literal de qué líneas de veredicto acepta `finish`, y las trampas.
+
+**El fichero es corto; el riesgo estaba entero en el contenido.** Un agente
+se cree lo que lee en una skill, así que un flag inventado o un estado mal
+ordenado no es una errata: es una fuente de errores *con autoridad*. Por eso
+la superficie del CLI se extrajo del **código** —`cli.ts`,
+`state-machine.ts`, `wip.ts`, `git.ts`—, no del README ni de la metodología,
+que en tres puntos ya no la describen. Las tres divergencias, detectadas y
+**no** heredadas: (a) `taskctl codex-review` no existe pese a estar modelado
+en la máquina de estados y en la tabla de la §8 —y `revision_codex: true`
+deja la tarea **imposible de cerrar**, porque `finish` la rechaza y remite a
+un comando inexistente—; (b) el guard de la §8.3 solo lo aplican 4 de los 8
+comandos; (c) `plan` no es multi-agente.
+
+**Lo que viaja y lo que no.** La skill se distribuye a proyectos que no son
+este, así que se quedó fuera todo lo de TaskCode: el checklist,
+`docs/contexto/`, los nombres de helpers internos. Viaja la regla, no la
+instancia — el revisor lo comprobó buscando 20 marcas del repo, con cero
+coincidencias. El frontmatter lleva solo `name` y `description`: la
+intersección entre lo que acepta Claude Code y lo que admite el spec
+portable.
+
+**La lección, ya en `HALLAZGOS.md`: una prueba que solo puede pasar cuando
+algo está roto no es una prueba.** La especificación inicial decía
+"comprobar que `claude plugin validate` imprime `Validating skill:`", y está
+invertida: el validador solo nombra las skills que **fallan**, así que ese
+test habría pasado únicamente con la skill rota. Se detectó porque el
+validador pasó limpio sin mencionarla y esa ausencia, en vez de darse por
+buena, se convirtió en la pregunta. La prueba correcta es la contraprueba:
+romper el frontmatter de una *copia*.
+
+**Dos rondas de revisión por pares**: la primera pidió cambios (1
+importante, 5 menores) y la segunda aprobó. El importante era de los que
+duelen: `CLAUDE.md` decía 429 tests y en esta rama son 444 — la cifra se
+midió en `develop`, antes de que existieran los 15 tests de la propia tarea,
+y mergearla así **habría reproducido el defecto que la corrección venía a
+arreglar**. De paso se corrigió que `review` y `finish` "no existen" (se
+cerraron en B1 y B3) y se anotó la trampa de los 3 rojos de Windows.
+**15 tests nuevos, 444 en total.**
+
+**Item nuevo que deja abierto**: en un clon recién hecho el plugin no trae
+un `taskctl` que funcione (`dist/` ignorado, sin `bin` declarado). Es un
+problema de empaquetado, no del ciclo de vida, y va a la Fase E como **E6**.
+
+## Qué acaba de pasar (sesión del 2026-09-07, resto): C6, C2 y C4
+
+Tres items más en la misma sesión, todos con **agentes en paralelo dentro de
+una sola rama** (norma del proyecto) e integración en serie.
+
+**C6 (TASK-029)** cerró los cuatro frentes de deuda de los scripts de
+Git-Flow: guard de `origin` en los tres que faltaban, el registro fuera del
+workspace del usuario (`.git/taskcode/gitflow/`, resuelto con `--git-path`
+para que valga en worktrees), los mensajes citando `taskctl` en vez de menús
+de IntelliJ, y `abort-merge` viendo cherry-picks y reverts. Al medirlo
+apareció un **tercer testigo que el plan no preveía**: `.git/sequencer/`.
+
+**C2 + C4 (TASK-030)**, dos items en una rama porque el límite de WIP es 1.
+`taskctl` ya commitea lo que escribe —una ruta a una, nunca `add -A`— y
+`.taskcode/config.yml` existe con tres claves opcionales.
+
+**El patrón que más se repitió no fue un bug, fue una forma de equivocarse**:
+afirmar sin medir. Ocurrió cinco veces y las cinco lo cazó quien lo tocó
+después —
+
+- el plan decía que dos scripts usaban una función compartida, y no la usaban;
+- decía que dos testigos bastaban para detectar un cherry-pick, y faltaba uno;
+- decía que el parser soportaba comentarios `#`, y solo los inline;
+- decía que `start`/`review`/`finish` no comprueban el workspace, y sí lo hacen;
+- y `limite_wip` se dio por bueno tras probarlo a mano con el CLI, sin test:
+  deshacer la línea que lo cablaba no rompía nada.
+
+El último es el más incómodo y el más útil: **verificado a mano no es
+verificado**. Está en `HALLAZGOS.md` junto al patrón hermano de C6 (medir lo
+que no discrimina: comparar HEAD antes/después parecía empírico y daba el
+mensaje del caso raro en el caso normal).
+
+## Qué acaba de pasar (sesión del 2026-09-07, final): D6 y D7
+
+**TASK-032** cerró de una vez los dos items de la Fase D que no dependían de
+nada: las cuatro skills revisoras (D6) y los roles de brainstorm más la
+heurística de complejidad (D7). Van juntos porque ninguno depende del otro y
+el límite de WIP es 1 — mismo precedente que TASK-030 (C2+C4).
+
+**El plugin pasa de exponer una skill a exponer cinco skills y cuatro
+agentes.** Nueve artefactos de contenido, **cero líneas en `src/`**, 93 tests
+nuevos: la suite va de 537 a **630** (627 verdes; los 3 rojos son los
+conocidos de Windows).
+
+**Cuatro agentes en paralelo dentro de la misma rama** para implementar, y
+tres rondas de revisión con **tres revisores independientes cada una**. 31
+hallazgos, **cero críticos**, todos aplicados.
+
+**Lo que deja para el futuro está en `HALLAZGOS.md`, y es lo mejor de la
+tarea**: el patrón de que *la corrección de un hallazgo llega sin la red que
+impide deshacerla* se repitió las tres rondas, y de ahí salieron **siete
+aserciones que no podían fallar**. La peor: el test que exigía «reproducir
+empíricamente» se satisfacía con una etiqueta que **otro test obliga a que
+esté presente**, así que borrar la sección entera de método de una skill
+—2399 bytes— dejaba la suite verde.
+
+Dos hallazgos fueron defectos **de las propias correcciones**, no del trabajo
+original: el recorte de patrones que dejó ciega a la skill de Angular ante la
+convención de Angular ≥20, y la excepción de `hotfix` que, escrita como
+sustitución, **subía** de 0 a 1 los agentes de un hotfix trivial — la clave
+que existe para abreviar el brainstorm añadiendo uno.
+
+**Divergencia nueva y documentada**: el YML dice `alta` donde la §16.1 y la
+decisión #2 dicen `compleja`, porque `validateTask` rechaza `compleja` y tres
+tareas reales (TASK-016, 017 y 018) declaran `alta`.
+
+**D4 descartado** por Carlos antes de empezar, con el dato delante: no existe
+ni una tarea `trivial` en el historial, así que la regla casi nunca se
+activaría. La Fase D baja de 7 a 6 items.
+
+## Qué sigue: el resto de la Fase D
+
+Quedan **D1, D2, D3 y D5**, en ese orden. D1 y D2 ya tienen debajo lo que
+necesitaban (`agents/`, la tabla de agentes por nivel y los
+`patrones_archivo` de los cuatro revisores), así que arrancan sin trabajo
+previo. **D5** sigue siendo el que cierra un agujero real: hoy
+`revision_codex: true` deja la tarea imposible de cerrar, porque `finish` la
+rechaza y remite a un comando que no existe.
+
+## Qué se hizo antes: E6 primero, luego la Fase D
+
+**Decidido con Carlos el 2026-09-07, al cerrar la Fase C.** El orden no es
+negociable por dos motivos, uno de criterio y otro mecanico:
+
+1. **E6 va antes que toda la Fase D.** En un clon recien hecho el plugin no
+   trae un `taskctl` que arranque: `dist/` esta ignorado y nadie declara
+   `bin`. Toda la Fase D construye encima de una herramienta que, hoy, quien
+   clone el repo no puede ejecutar. Arreglar el escaparate antes de seguir
+   llenandolo.
+2. **El limite de WIP es 1**, asi que E6 tiene que estar cerrada (mergeada
+   con `taskctl finish`) antes de arrancar cualquier tarea de D. No es una
+   preferencia: `taskctl start` aborta si hay otra tarea abierta.
+
+E6 lleva **rama propia**, como cualquier tarea: la crea `taskctl start` y la
+mergea `finish` con `--no-ff`, sin borrarla (politica IECA).
+
+Orden sugerido dentro de la Fase D, una vez cerrada E6:
+
+- **D7 primero** (`heuristica-complejidad.yml` + los roles de `agents/`):
+  alimenta a D1 y D2, asi que hacerlo despues obligaria a rehacer trabajo.
+- **D6 en paralelo** (las 4 skills revisoras): no depende de nada.
+- **D4 al final, o no hacerlo.** La decision #17 lo dejo aplicando **solo a
+  `trivial`**, y en todo el historial no hay ni una tarea `trivial`: son ~3h
+  para un camino que en la practica no se recorre. Conviene decidir si vale
+  la pena antes de gastarlas.
+
+**La Fase C se cerró entera el 2026-09-07** con TASK-030 (items C2 y C4), que
+fue lo último que le faltaba. Las decisiones #14 y #9 se resolvieron ese mismo
+día: la #14 con *commitea sí, sube solo con `--push`*; la #9 con tres claves
+opcionales (`rama_base`, `agente_revisor_por_defecto`, `limite_wip`) y, sobre
+todo, con la forma del mecanismo. Ver sus entradas en
+`CHECKLIST_TERMINACION.md`.
+
+Con A, B y C cerradas, **el corte mínimo defendible está alcanzado**. Lo que
+queda es opcional (D, la inteligencia del proceso: brainstorm multi-agente,
+heurística de complejidad, revisión ligera) y el cierre (E), donde vive el
+item más urgente de los que quedan: **E6**, que el plugin no se distribuye
+con un CLI que funcione.
+
+**Decisiones abiertas que siguen bloqueando**: la Fase D depende de la #1,
+#2, #11, #15, #16 y #17. Ninguna bloquea la Fase E.
+
+1. ~~**C1**~~ — hecho el 2026-09-06 (TASK-026), ver arriba.
+2. **C2** — el paso 5 de la §8.3 (¿`taskctl` commitea y sube por la
+   persona?). **Bloqueado por la decisión #14.** La evidencia a favor no
+   para de crecer: sin él, `import` no se puede ejecutar dos veces
+   seguidas, cada tarea necesita cuatro o cinco commits manuales, y una
+   rama cuyo movimiento de tarea no esté commiteado es invisible para el
+   límite de WIP (C8).
+3. ~~**C3**~~ — hecho el 2026-09-06 (TASK-027), ver arriba.
+4. **C4** — `.taskcode` con su `config.yml`. **Bloqueado por la decisión
+   #9**, que ya tiene dos candidatos claros a contenido salidos de B7 y C7:
+   el tamaño del límite de WIP y qué cuenta como una misma persona.
+5. ~~**C5**~~ — hecho el 2026-09-07 (TASK-028), ver arriba.
+6. ~~**C6**~~ — hecho el 2026-09-07 (TASK-029). Los cuatro frentes, con
+   cuatro agentes en paralelo dentro de la misma rama. Costó ~5h, no la ~1h
+   que decía la estimación original (que era de cuando el item era solo el
+   bug de `origin`). Dos afirmaciones del plan resultaron falsas al medirlas,
+   y el primer arreglo de un hallazgo de revisión también: está en
+   `HALLAZGOS.md`.
+
+## Decisiones: ninguna abierta (2026-09-07)
+
+**Las diez decisiones de la lista están resueltas.** Ya no queda ninguna
+bloqueando trabajo. Cronología: la #12 y la #13 cerraron la Fase B; la #14 y
+la #9 desbloquearon la Fase C el 2026-09-07; y ese mismo día se cerraron de
+una tanda las seis que bloqueaban la Fase D — **#1, #2, #11, #15, #16 y
+#17**. Están todas en `CHECKLIST_TERMINACION.md` con su razonamiento.
+
+Cuatro de esas seis se decidieron **con datos, no con criterio**, y conviene
+que eso no se pierda:
+
+- **#17** (revisión ligera solo para `trivial`): de las 4 tareas `simple`
+  cerradas, **una escondía un CRÍTICO** y las cuatro tuvieron importantes.
+  Abaratar `simple` habría dejado pasar el peor bug del proyecto.
+- **#15** (pesos de la heurística): no se pudieron validar con datos porque
+  **no los hay** — el historial entero son 6 `media` y 4 `simple`, sin una
+  sola tarea `trivial`, `compleja` ni `crítica`.
+- **#11** (plugins instalados): `claude plugin list --json` verificado
+  ejecutándolo. Y lo que **no** sirve: `plugin validate`, que solo nombra las
+  skills que fallan.
+- **#1** (checkpoint humano siempre): hoy ya es obligatorio, así que cuesta
+  cero código — y en la sesión del 2026-09-07 tres planes llegaron a
+  aprobación con premisas falsas.
+
+Consecuencia para la Fase D que conviene mirar antes de empezarla: como no
+existe ninguna tarea `trivial`, **la regla de la #17 casi nunca se activará**,
+lo que deja a **D4 (~3h) sin apenas valor**. Merece decidirse si se implementa
+antes de gastarlo.
+
+Decidido además el 2026-09-06, fuera de la lista numerada: **la identidad de
+una persona es su `git config user.email`** (implementado en C7).
+
+## El entorno cambió
+
+Todo el trabajo hasta el 2026-09-05 se hizo desde un bridge de dispositivo de
+Cowork — una VM Linux que montaba la carpeta de Windows. A partir de ahora se
+trabaja en **Claude Code nativo en la terminal de IntelliJ, en Windows**.
+
+Consecuencias prácticas: varias limitaciones documentadas en tareas anteriores
+eran del bridge, no de Windows, y **ya no aplican** (ver `HALLAZGOS.md`,
+sección "Cosas del entorno anterior que ya no aplican"). Y al revés: ahora sí
+hay un CLI de Claude Code de verdad, así que se puede por fin probar
+`/plugin marketplace add` y `/plugin install` reales — que es lo único que le
+queda pendiente a TASK-021.
+
+## Qué acaba de pasar (sesión del 2026-09-16): cierre de la Fase D y de E4/E5
+
+La Fase D se cerró entera desde la última actualización de este documento
+(2026-09-08, tras D6/D7). Resumen — el detalle línea a línea de cada una
+vive en `CHECKLIST_TERMINACION.md`, no aquí:
+
+1. **D1** — TASK-016: `taskctl plan` deja de ser un scaffold y pasa a
+   orquestar el brainstorm paralelo por roles. La revisión por pares más
+   dura del proyecto (5 rondas, 6 revisores, 8 CRÍTICOS).
+2. **D2** — TASK-017: catálogo de skills determinista con selección en dos
+   pasos. 5 rondas de revisión, 35 hallazgos, cero críticos.
+3. **D3** — TASK-018: `taskctl review` clasifica el diff real por dominio
+   en vez de usar siempre el mismo agente. 2 rondas de revisión, ambas con
+   hallazgos IMPORTANTE reales de cobertura de tests, corregidos con
+   contraprueba de mutación.
+4. **D5** — TASK-020: `taskctl codex-review`, envoltorio del CLI de Codex
+   como segunda opinión. 3 rondas de revisión — las dos primeras
+   encontraron bugs reales de plataforma en Windows (`spawnSync` sin
+   `shell: true` nunca invocaba el binario real; el escapado para
+   `cmd.exe` no evitaba que expandiera `%VARIABLE%`, filtrando datos del
+   entorno), ambos corregidos y verificados contra el binario real de
+   Codex en esta máquina.
+
+Con la Fase D completa, se resolvieron también **E4** y **E5** con
+investigación paralela (dos agentes especializados más un agente
+orquestador que verificó de forma independiente ambos hallazgos antes de
+llegar a Carlos): E4 se cierra documentando que las 12 tareas de Sprint
+0+1 se quedan como están (forzar el ciclo real de `taskctl` sobre ellas
+ahora es inviable, no solo indeseable: crashearía en 3 de las 12 por una
+`rama:` fantasma, y en las otras 9 la revisión saldría sobre un diff
+vacío); E5 se cierra borrando `runConfigurations.zip` (era la carpeta
+`.idea/` de otro proyecto, ya migrada por completo).
+
+Solo quedan **E1** (TASK-022, guía de incorporación — plan consolidado,
+pendiente de `taskctl approve`) y **E2** (TASK-023, métricas de coste en
+tokens por fase — sin empezar) para cerrar el proyecto entero.
+
+## Qué acaba de pasar (sesión del 2026-09-16, resto): cierre de E1/TASK-022
+
+**E1 (TASK-022)** — `docs/contexto/INCORPORACION.md`, la guía de
+incorporación de colaboradores: acceso, clonar el repo e instalar el
+plugin, entender el ciclo de vida (enlazando `SKILL.md` y la sección 13 de
+`PROPUESTA_METODOLOGIA.md`, sin duplicarlos) y hacer la primera tarea.
+Deja constancia explícita de que hoy no hay colaboradores que invitar
+(decisión de Carlos, 2026-09-13) y cierra el punto 8 de la sección 14 en lo
+que respecta a a quién se invita — solo en `CHECKLIST_TERMINACION.md`, sin
+tocar el documento congelado, mismo patrón que las seis decisiones
+anteriores de esa sección.
+
+**Tres rondas de revisión independiente, cero críticos en ninguna,
+aprobada en la tercera.** Las dos primeras rondas encontraron algo del
+mismo tipo cada vez, en sentidos opuestos: la ronda 1 denunció que la guía
+invertía qué tiene el proyecto confirmado sobre `taskctl` resolviendo por
+PATH y qué no; la corrección de la ronda 2 arregló la inversión pero se
+pasó de frenada al revés, atribuyendo a un job de CI algo que ese CI nunca
+prueba (nunca instala un plugin). La ronda 3 confirmó, contrastando frase a
+frase contra las cuatro fuentes citadas, que el párrafo final ya no
+promete nada que el proyecto no pueda respaldar. Detalle completo con las
+citas exactas en el `## Resultado` de `tareas/04-terminadas/TASK-022/tarea.md`.
+
+Con esto, la Fase E queda a un solo item: **E2** (TASK-023, sin empezar).
+Cuando se cierre, el proyecto llega al 42/42 (100%).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 36e128a..9ef3c98 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -177,7 +177,7 @@ código 1.
 Con el plugin cargado, dentro de la sesión de Claude Code:
 
 - `taskctl --help` debería resolverse como comando de shell suelto (ver
-  siguiente sección).
+  [«`taskctl` en el PATH del Bash tool»](docs/instalacion-y-distribucion.md#taskctl-en-el-path-del-bash-tool)).
 - `/reload-plugins` recarga el plugin tras cambios sin reiniciar la sesión.
 
 Para una instalación persistente vía `/plugin install <nombre>@<marketplace>`
@@ -186,1615 +186,69 @@ Para una instalación persistente vía `/plugin install <nombre>@<marketplace>`
 en la raíz del repo, desde TASK-021 (item A1) — este README afirmó durante un
 tiempo que no, y era falso.
 
-## Cómo se distribuye: por qué `dist/src/` está versionado
+## Comandos (resumen)
 
-Instalar un plugin **no es un checkout donde el usuario pueda compilar**.
-Según la referencia oficial (`plugin-marketplaces`), Claude Code *copia* el
-plugin a su caché (`~/.claude/plugins/cache`). Sobre esa copia sí instala las
-dependencias npm —`npm ci --ignore-scripts`, porque el plugin trae
-`package.json` y `package-lock.json`—, pero ese `--ignore-scripts` es
-literal: **`postinstall` y `prepare` no se ejecutan nunca**. Compilar al
-instalar no es una opción que se descartara por criterio; la plataforma no la
-ofrece.
+`taskctl --help` da la lista completa, con todos los flags. En breve:
 
-De ahí que el build viaje ya hecho. Dos piezas lo sostienen, y conviene no
-tocarlas por separado:
-
-- `tsconfig.json` fija `"newLine": "lf"`, y `.gitattributes` fija
-  `*.ts text eol=lf` **además de** `dist/** text eol=lf`. Lo segundo no es
-  redundante: las plantillas multilínea de `src/` viajan tal cual al build,
-  así que con `core.autocrlf=true` el checkout de Windows mete CRLF dentro de
-  un literal y el mismo `src/` compila distinto que en Linux. Medido en su
-  día: 34 CRLF en `dist/src/cli.js`, todos dentro del literal `HELP`.
-- El CI recompila y falla si `dist/src` no coincide con lo commiteado, **en
-  Linux y en Windows**. Un guard en una sola plataforma no vería justo el
-  fallo que motiva lo anterior.
-
-Si cambias algo de `src/`, recompila y commitea `dist/src` en el mismo
-commit. El guard existe precisamente porque es fácil olvidarlo.
-
-### Limitación conocida: `bin/` y las organization settings de claude.ai
-
-El mecanismo por el que `taskctl` se invoca como comando suelto es tener el
-ejecutable en `bin/`, en la raíz del plugin (referencia oficial,
-`plugins-reference`: *"Executables added to the Bash tool's PATH and invokable
-as bare commands while the plugin is enabled"*). No pasa por ningún campo de
-`plugin.json`.
-
-Esa misma página avisa de que **un plugin con `bin/` de nivel superior no se
-puede distribuir por organization settings de claude.ai** (*"You can't include
-this directory in a plugin you distribute through claude.ai organization
-settings"*), y enlaza a `plugin-marketplaces`, que es donde está el detalle: el
-sync del marketplace y la subida directa lo rechazan con
-`Plugin contains a top-level bin/ directory`, y la alternativa que prescribe
-es mover los ejecutables a `scripts/` e invocarlos por
-`${CLAUDE_PLUGIN_ROOT}/scripts/<nombre>`.
-
-Hoy no bloquea nada: la distribución es un marketplace público por Git. Queda
-anotado porque condiciona **E1** (invitar colaboradores) y cualquier intento
-futuro de distribuir por esa vía, que obligaría a renunciar a `taskctl` como
-comando suelto o a reestructurar el plugin.
-
-## Usar `taskctl` fuera de Claude Code (PowerShell, cmd, Git Bash)
-
-Dentro de Claude Code no hay que hacer nada: `bin/` entra en el PATH del
-Bash tool mientras el plugin esta habilitado. **Fuera** (tu propia terminal)
-no: ni esta en el PATH ni, en Windows, PowerShell y cmd saben ejecutar
-`bin/taskctl`, que es un script de node sin extension.
-
-El plugin instalado vive en
-`~/.claude/plugins/cache/<marketplace>/taskcode-plugin/<version>/` (en
-Windows, `%USERPROFILE%\.claude\plugins\cache\...`). Hace falta `node` en
-el PATH. Una forma por shell:
-
-**PowerShell**: anade esto a tu perfil (`notepad $PROFILE`). Llama a `node`
-directamente y elige la version instalada mas alta, asi que sobrevive a las
-actualizaciones del plugin:
-
-```powershell
-$taskcodeBase = Join-Path $env:USERPROFILE '.claude\plugins\cache\taskcode-marketplace\taskcode-plugin'
-function taskctl {
-  $bin = Get-ChildItem $taskcodeBase -Directory |
-    Where-Object { $_.Name -as [version] } |
-    Sort-Object { $_.Name -as [version] } | Select-Object -Last 1
-  if (-not $bin) { throw "taskcode-plugin no esta instalado en $taskcodeBase (instalalo con /plugin)" }
-  node (Join-Path $bin.FullName 'bin\taskctl') @args
-}
-```
-
-En Windows PowerShell 5.1, evita las comillas dobles dentro de un argumento
-(`--titulo 'Soporte "modo oscuro"'`): PowerShell 5.1 no las escapa al llamar
-a `node`, y el titulo llega sin ellas o partido en dos argumentos. Usa
-comillas simples dentro del texto, o PowerShell 7.3 o posterior, que las pasa
-bien.
-
-**No pongas `bin` en el PATH para usarlo desde PowerShell.** Ahi `taskctl`
-resolveria a `bin\taskctl.cmd`, y PowerShell le pasa sin comillas los
-argumentos que no llevan espacios: un titulo como `Q&A` o `foo->notas.txt`
-lo interpreta cmd.exe, que ejecuta `A` o vacia `notas.txt`. La funcion de
-arriba no pasa por cmd y no tiene ese problema.
-
-**cmd**: `bin\taskctl.cmd` (desde la 0.4.0). Anade la
-carpeta `bin` de la version instalada al PATH y escribe `taskctl`. Pon
-**siempre entre comillas dobles** los argumentos con `& | < > ^`
-(`taskctl new --titulo "Q&A"`): cmd.exe interpreta esos caracteres antes
-que nada, y el escape con `^` no sobrevive al reenvio a node. Ojo con
-`%NOMBRE%`: cmd lo sustituye por la variable de entorno aunque vaya entre
-comillas. Hay que actualizar la ruta cuando cambie la version del plugin.
-
-**Git Bash**: `alias taskctl='node "$(ls -d ~/.claude/plugins/cache/taskcode-marketplace/taskcode-plugin/*/ | sort -V | tail -1)bin/taskctl"'`
-en `~/.bashrc`.
-
-Los comandos que invocan Git-Flow (`start`, `review`, `finish`...) ejecutan
-`bash` por debajo: necesitan Git for Windows instalado, desde cualquier
-shell.
-
-## `taskctl` en el PATH del Bash tool
-
-Según la referencia oficial (`https://code.claude.com/docs/en/plugins`,
-tabla "Plugin structure overview"): *"`bin/`: Executables added to the
-Bash tool's `PATH` while the plugin is enabled"*. Es decir, el mecanismo
-no pasa por el campo `commands` de `plugin.json` — pasa simplemente por
-tener el ejecutable dentro de `bin/` en la raíz del plugin, con el bit de
-ejecución puesto.
-
-**Matiz encontrado en revisión por pares, sin confirmar con pruebas
-propias todavía:** esa frase dice explícitamente *Bash tool*, no "shell
-tool" en general. Según `https://code.claude.com/docs/en/setup`
-("Set up on Windows"): en Windows nativo, **sin** Git for Windows
-instalado, Claude Code usa el *PowerShell tool* en vez del Bash tool; con
-Git for Windows instalado, usa Git Bash para el Bash tool (y el
-PowerShell tool queda disponible en paralelo). No hay confirmación oficial
-de si `bin/` también se añade al PATH cuando quien corre los comandos es
-el PowerShell tool en vez del Bash tool — es una pregunta abierta, no un
-hecho verificado en ningún sentido.
-
-En la práctica esto ya condiciona a este proyecto igual: `taskctl start`,
-`plan` y `approve` invocan los scripts de Git-Flow como
-`bash "$CLAUDE_PLUGIN_ROOT/scripts/gitflow/<script>.sh"` (ver
-`scripts/gitflow/README.md`), así que ya exigen Git for Windows / Bash
-tool para funcionar, con o sin este hallazgo. Lo que sigue sin confirmar
-es si `taskctl new`/`import`/`board` (que no tocan Git-Flow) podrían
-seguir funcionando bajo un PowerShell-tool-only vía
-`node bin/taskctl ...` explícito aunque la resolución de `taskctl` como
-comando suelto por PATH no aplicara ahí.
-
-### Bug encontrado y corregido en TASK-006
-
-`bin/taskctl` estaba trackeado por Git en modo `100644` (no ejecutable) a
-pesar de tener `chmod +x` en el working tree local. Cualquier clon limpio
-del repo (exactamente lo que hace todo smoke test de este proyecto)
-heredaba el fichero sin bit de ejecución, así que `taskctl` como comando
-suelto nunca había funcionado realmente en un clon nuevo — solo la
-invocación explícita `node bin/taskctl ...` (la que usan todos los smoke
-tests de TASK-004/005) evitaba el problema. Corregido con:
-
-```bash
-git update-index --chmod=+x taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
-```
-
-Verificado tras el fix:
-
-```
-$ git ls-files -s taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
-100755 79d808e6009043081c76b013a8cba1f6d3c01932 0	taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
-```
-
-### `commands` en `plugin.json`: campo con forma inválida, eliminado — corrección tras revisión por pares
-
-`plugin.json` tenía `"commands": {"taskctl": "bin/taskctl"}`.
-**Corrección respecto a la primera versión de este README:** el campo
-`commands` sí existe en el schema real (referencia oficial,
-`https://code.claude.com/docs/en/plugins-reference`) — apunta a ficheros
-`.md` de skills "planas" (no anidadas en `<nombre>/SKILL.md`), y su tipo
-es `string | array` únicamente. Nunca acepta un objeto. Nuestro uso (un
-objeto `{"taskctl": "bin/taskctl"}`) no era "un campo que no hacía nada":
-era un campo reconocido con un tipo incorrecto, y según la misma
-referencia *"How Claude Code handles a recognized field whose value has
-the wrong type... Most fields: the plugin fails to load"*. Es decir, no
-se puede descartar que este `plugin.json`, tal cual estaba, impidiera que
-el plugin cargara en cualquier sesión real de Claude Code hasta este fix
-— no solo que el campo fuera inofensivo. Se eliminó, y de paso se corrigió
-`author` al formato de objeto (`{"name": "charlie.bk"}`) que usa el propio
-ejemplo oficial de la guía de creación de plugins, en vez de un string
-suelto.
-
-### Evidencia recogida en esta sesión
-
-Todo lo siguiente se ejecutó de verdad (no es texto de relleno) contra
-este repo, tras `npm install && npm run build`, ya con el fix del bit de
-ejecución aplicado:
-
-```
-$ node bin/taskctl --help
-taskctl 0.13.0 — TaskCode
-[...]
-
-$ ./bin/taskctl --help          # ejecución directa vía shebang + bit +x
-taskctl 0.13.0 — TaskCode
-[...]                            # salida idéntica
-
-$ PATH="$(pwd)/bin:$PATH" taskctl --version   # simula resolución por PATH
-0.5.0
-
-$ PATH="$(pwd)/bin:$PATH" which taskctl
-.../taskcode-plugin/bin/taskctl
-```
-
-Las cuatro formas de invocación funcionan de forma idéntica una vez el bit
-de ejecución está bien trackeado: el mecanismo de `bin/` en PATH que usa
-Claude Code depende exactamente de esto.
-
-### Smoke test en un clon aislado
-
-Se repitió el patrón de smoke test de TASK-004/TASK-005: `git clone` a un
-directorio temporal separado, checkout de esta rama, `npm install && npm
-run build` en el clon (entonces `dist/` estaba entero en `.gitignore`, así
-que no se heredaba entre clones — **desde TASK-031 `dist/src` sí se hereda**;
-`node_modules/` sigue sin heredarse), y ejecución real:
-
-```
-$ ls -la bin/taskctl          # tras un clon limpio, sin tocar permisos a mano
--rwxr-xr-x 1 ... bin/taskctl
-
-$ node bin/taskctl --help     # OK
-$ ./bin/taskctl --version     # OK — 0.5.0
-$ PATH="$(pwd)/bin:$PATH" taskctl --version   # OK — 0.5.0, resuelto como comando suelto
-```
-
-El bit de ejecución sobrevive un `git clone` normal en un filesystem POSIX
-estándar (confirma que el fix de `git update-index --chmod=+x` es
-correcto y suficiente ahí). Además se corrió `taskctl import` y
-`taskctl board` de punta a punta en ese mismo clon para confirmar que el
-empaquetado no rompió nada del resto del CLI — ambos funcionaron igual
-que en TASK-004/TASK-005.
-
-### Lo que NO se ha podido verificar en esta sesión (limitación de entorno)
-
-> **Histórico (TASK-006, 2026-09-05).** Se conserva por trazabilidad, pero
-> está superado dos veces: por la sección *RESUELTO (2026-09-05)* y por
-> *RESUELTO (2026-09-07, TASK-031)*, más abajo. Ya hay un CLI real de Claude
-> Code y la instalación se ejecutó de verdad. La receta de `npm install &&
-> npm run build` que aparece aquí tampoco hace ya falta para arrancar.
-
-Ni el contenedor cloud de esta sesión ni el bridge hacia el equipo del
-usuario (`device_bash`) exponen un CLI interactivo real de Claude Code —
-ambos exponen solo un stub restringido:
-
-```
-$ claude --version
-claude: only `claude -p "<prompt>"` is supported in this environment
-
-$ claude --plugin-dir ./taskcode-marketplace/plugins/taskcode-plugin --help
-claude: only `claude -p "<prompt>"` is supported in this environment
-
-$ claude plugin validate ./taskcode-marketplace/plugins/taskcode-plugin
-claude: only `claude -p "<prompt>"` is supported in this environment
-```
-
-Por tanto no se ha podido ejecutar de punta a punta, dentro de esta
-sesión, ni `claude --plugin-dir ...` en modo interactivo ni
-`claude plugin validate`. Mismo patrón que TASK-007 (ver
-`docs/spikes/TASK-007-resultado.md`): se deja documentado el procedimiento
-exacto y verificado hasta donde el entorno lo permite (estructura,
-permisos, schema de `plugin.json`, arranque real de `dist/src/cli.js`), y
-se recomienda una pasada rápida en una sesión nativa de Claude Code —
-Windows o donde sea que el equipo lo use — la próxima vez que alguien la
-tenga abierta:
-
-```bash
-cd taskcode-marketplace/plugins/taskcode-plugin
-npm install && npm run build
-claude --plugin-dir "$(pwd)"
-# dentro de la sesión: taskctl --help
-```
-
-### RESUELTO (2026-09-05): el CI de Windows nativo contestó las preguntas
-
-Las dos limitaciones de abajo se documentaron cuando no había forma de
-probar nada en Windows nativo desde esta sesión. **Ya la hay**: el job
-`windows-latest` de `.github/workflows/ci.yml` corre sobre un checkout
-nativo de Windows y asevera cada hipótesis como un step propio. Resultado
-del primer run verde:
-
-| Pregunta | Respuesta |
+| Comando | Para qué |
 |---|---|
-| ¿`bin/taskctl` conserva el bit `+x` tras un checkout nativo de Windows? | **Sí** |
-| ¿`taskctl` resuelve como comando suelto vía PATH en Windows? | **Sí** |
-| ¿Los `.sh` de Git-Flow corren bajo Git Bash nativo? | **Sí** (smoke test completo en verde) |
-| ¿`node bin/taskctl` funciona desde `cmd.exe`, sin Git Bash? | **Sí** |
-| ¿Pasa la suite completa en Windows? | **Sí**, tras corregir el glob de `npm test` |
-
-Además, `claude plugin validate` pasó en CI tanto para el manifiesto del
-plugin como para el del marketplace — la validación que esta tarea no
-pudo hacer por no tener un CLI real disponible.
-
-El único hallazgo negativo del ejercicio fue real y ya está corregido: el
-script `test` de `package.json` expandía los globs en el shell, y `cmd.exe`
-no expande globs, así que la suite entera fallaba en Windows. Con el glob
-entrecomillado lo expande Node y funciona en ambos sistemas.
-
-### RESUELTO (2026-09-07, TASK-031): el `/plugin install` real, por fin ejecutado
-
-TASK-006 y TASK-021 dejaron pendiente comprobar la instalación de verdad por
-no haber un CLI de Claude Code disponible. Ya lo hay (2.1.226), y esto es lo
-que se ejecutó:
-
-```
-$ claude plugin validate .                      # marketplace  -> ✔ passed
-$ claude plugin validate ./taskcode-marketplace/plugins/taskcode-plugin
-                                                # plugin       -> ✔ passed
-$ claude plugin marketplace add "C:\...\TaskCode"
-✔ Successfully added marketplace: taskcode-marketplace
-$ claude plugin install taskcode-plugin@taskcode-marketplace
-✔ Successfully installed plugin: taskcode-plugin@taskcode-marketplace (scope: user)
-```
-
-| Pregunta | Respuesta |
-|---|---|
-| ¿El plugin se instala desde el marketplace? | **Sí**, `enabled`, scope `user` |
-| ¿`taskctl` arranca desde la caché, sin compilar? | **Sí**: `node <cache>/bin/taskctl --version` → `0.5.0` |
-| ¿La copia cacheada trae `dist/`? | Sí, **pero esta instalación no lo demuestra** — ver abajo |
-| ¿Claude Code instala las deps npm en la copia? | Sí, **pero no por la razón que parece** — ver abajo |
-| ¿Existe de verdad el mecanismo de `bin/` en PATH? | **Sí** — confirmado abajo |
-
-**Las dos filas del medio necesitan una advertencia, y la revisión por pares
-la encontró.** Este marketplace se añadió como fuente `directory` apuntando al
-propio working tree, y esa clase de caché es **una copia del árbol de trabajo,
-ficheros ignorados por Git incluidos**. Prueba: en la caché hay 34 ficheros de
-`dist/test/`, que Git no versiona (`git ls-files dist/test` → 0). Es decir,
-**esa tabla habría contestado "sí" también antes de esta tarea**, con `dist/`
-entero ignorado, porque lo que se copió fue un árbol ya compilado. La
-conclusión de fondo sigue siendo correcta —en un marketplace por Git, quien
-hace que la copia arranque es `dist/src` versionado— pero quien la demuestra
-es el test de AC1 de `test/empaquetado/distribucion.test.ts`, que exporta HEAD
-y por tanto solo ve lo commiteado. No esta instalación.
-
-Lo mismo con `node_modules/`: también viaja en la copia, así que su presencia
-no prueba nada. Lo que sí lo prueba es que el `.package-lock.json` de la caché
-tiene el `mtime` del instante del install y no el del working tree — ahí sí
-corrió un `npm ci` de verdad, el que documenta `plugins-reference`.
-
-Lo último merece detalle, porque hasta ahora era una cita de la documentación
-que este proyecto nunca había visto ocurrir (el CI la *simula* metiendo `bin/`
-en el `PATH` a mano, que no prueba lo mismo). En el `PATH` de una sesión real
-aparecen entradas como:
-
-```
-.../.claude/plugins/cache/claude-plugins-official/figma/2.2.90/bin
-.../.claude/plugins/cache/karpathy-skills/andrej-karpathy-skills/1.0.0/bin
-```
-
-es decir, el mecanismo existe y opera sobre plugins instalados.
-
-**Lo que queda sin confirmar, y no se da por bueno**: en la sesión donde se
-hizo la instalación, `taskctl` como comando suelto seguía dando
-`command not found`, y el `bin/` de este plugin no estaba en el `PATH`. La
-explicación coherente con la evidencia es que el `PATH` se compone al arrancar
-la sesión y el plugin se instaló después — pero *eso no se ha comprobado*.
-Confirmarlo cuesta un comando en la siguiente sesión:
-
-```bash
-taskctl --version   # deberia imprimir 0.5.0 sin ruta ni node delante
-```
-
-Mientras tanto, lo que sí está probado es que el ejecutable de la caché es
-válido: con su directorio en el `PATH`, `taskctl --version` responde `0.5.0`.
-
-### Segunda limitación, específica de este repo: `core.fileMode=false`
-
-`scripts/gitflow/README.md` ya documentó que este repo tiene
-`git config core.fileMode false` porque el filesystem real bajo el bridge
-de dispositivo no preserva de forma fiable el bit `+x` — y que por eso los
-scripts de Git-Flow se invocan siempre explícitamente vía
-`bash script.sh`, nunca por ruta directa, para que el bit deje de
-importar.
-
-`bin/taskctl` no tiene ese wrapper disponible: el mecanismo de `bin/` en
-PATH de Claude Code necesita ejecutar el fichero directamente (vía su
-shebang), así que si el checkout real en Windows tampoco preserva el bit
-de ejecución, `taskctl` como comando suelto podría seguir sin funcionar
-ahí aunque Git ya lo trackee como `100755` — el fix de esta tarea corrige
-lo que Git registra (correcto y necesario para clones en Linux/macOS,
-donde sí se preserva) pero **no se ha podido confirmar por separado si un
-checkout nativo en Windows conserva el bit**. Es la misma clase de
-limitación que TASK-007 dejó abierta para los scripts `.sh`, ahora también
-aplicable a `bin/taskctl`.
-
-**Precisión encontrada en revisión por pares** (más fuerte que "no
-preserva de forma fiable"): el punto de montaje del bridge de dispositivo
-(`$HOME/mnt/TaskCode`, el que usa esta sesión para tocar el repo) no es
-que preserve el bit de ejecución de forma poco fiable — **sintetiza
-`-rwx------` para cualquier fichero por igual**, sea o no ejecutable de
-verdad. Verificado a mano:
-
-```
-$ touch taskcode-marketplace/plugins/taskcode-plugin/probe-mount.txt
-$ ls -la taskcode-marketplace/plugins/taskcode-plugin/probe-mount.txt
--rwx------ ... probe-mount.txt        # fichero vacio recien creado: "ejecutable"
-
-$ ls -la taskcode-marketplace/plugins/taskcode-plugin/package.json
--rwx------ ... package.json           # JSON, nunca deberia ser "ejecutable"
-```
-
-Es decir: cualquier comprobación de permisos hecha *a través de este
-mismo bridge* (incluida la que se hizo al principio de esta tarea, antes
-de mirar `git ls-files -s`) es un falso positivo garantizado y no prueba
-nada sobre el filesystem real de Windows. Lo único fiable que se pudo
-comprobar desde esta sesión es lo que Git tiene trackeado
-(`git ls-files -s`, correcto ahora) y el comportamiento en un clon nuevo
-sobre un filesystem POSIX normal (`/tmp` dentro de la VM Linux del bridge,
-fuera de `mnt/` — ver el smoke test más abajo, que sí es representativo
-de Linux/macOS/WSL). Se recomienda comprobar el checkout nativo de
-Windows en sí la próxima vez que alguien del equipo tenga una sesión
-nativa abierta ahí, no a través de este bridge:
-
-```powershell
-git clone <repo> C:\temp\check
-cd C:\temp\check
-# ¿el checkout tiene forma de marcar/perder un "bit de ejecucion" en NTFS,
-# o el concepto no aplica igual que en POSIX? Confirmar contra `bin/taskctl`
-# funcionando de verdad como comando suelto dentro de una sesion real.
-```
-
-No se ha intentado usar las herramientas de control remoto de escritorio
-disponibles en este bridge (`mcp__remote-devices__computer_*`, que
-permiten abrir una ventana real en la máquina del usuario) para hacer esta
-comprobación desde esta misma sesión. Quedó descartado por alcance/tiempo,
-no porque no fuera técnicamente posible — se deja anotado como opción más
-barata que esperar a una sesión nativa, por si alguien quiere intentarlo
-antes.
-
-## Sincronización de ficheros derivados
-
-Un proyecto puede regenerar en cada transición los ficheros que derivan del
-estado de las tareas (un plan, un tablero, un roadmap) con
-`comando_sincronizacion` y `rutas_sincronizacion` en `.taskcode/config.yml`;
-lo que el comando reescribe entra en el mismo commit de la transición. La guía
-completa (claves, salvaguardas, conflictos de merge) está en la skill
-`task-workflow`, en `sincronizacion.md`.
-
-Las rutas son ficheros relativos a la raíz del repo, fuera de `.taskcode/` y
-`.git/`. De `tareas/` solo se admite un fichero suelto en su raíz:
-
-```yaml
-comando_sincronizacion: "node scripts/roadmap.mjs"
-rutas_sincronizacion: [tareas/ROADMAP.md, docs/PLAN.md]
-```
-
-El motivo: fuera de las carpetas de estado (`tareas/00-planificadas/` …
-`tareas/04-terminadas/`) `taskctl` solo escribe `tareas/ROADMAP.md`, y nunca si
-está declarado aquí (ver «ROADMAP de tareas» abajo), así que un fichero suelto
-en la raíz de `tareas/` no choca con lo que escribe la herramienta, y sin esa
-excepción un roadmap propio que vive ahí se quedaba atrasado tras cada transición.
-`tareas/01-en-diseno/x.md`, `tareas/otra/x.md` y `tareas` (la carpeta) se
-siguen rechazando, sin distinguir mayúsculas. `informe_cobertura` no tiene esta
-excepción.
-
-## ROADMAP de tareas (`tareas/ROADMAP.md`)
-
-`taskctl` mantiene en cada proyecto un `tareas/ROADMAP.md`: una tabla por hito
-(el campo `sprint`), con las columnas Paso, Tarea, Título, Complejidad, Depende
-de y Estado, en orden de dependencias (ninguna tarea antes que sus predecesoras;
-a igualdad, la del hito anterior y luego la de número menor), y un resumen de
-lo que está en marcha y lo que está listo para empezar. Un ciclo de
-dependencias no aborta nada: sale en una sección «Dependencias circulares» y
-como aviso. No lleva fecha, así que una transición que no cambia nada no lo
-toca.
-
-**Cuándo.** `new`, `plan`, `approve` y `finish` (tras el merge) lo regeneran
-dentro de su propio commit, solo cuando ese commit cae en la rama de
-integración (`rama_base`). `start`, `review` y el resto commitean en la rama de
-la tarea y no lo tocan: por eso dos ramas en paralelo nunca chocan en él. Si
-añadirlo al commit falla, se avisa y la transición sigue sin él.
-
-**La marca.** Su tercera línea es exactamente
-`<!-- generado por taskctl; formato 1; no editar fuera de la zona manual -->`
-(se compara la línea entera, ignorando CRLF; nunca por subcadena).
-
-**La regla de no pisar.** Las transiciones solo escriben el fichero si lleva
-la marca o si no existe y nunca ha existido (`git log --all` no sabe nada de
-él). Nunca si no lleva la marca (es del proyecto, aunque lo genere otro
-script), si está en `rutas_sincronizacion`, si tiene cambios sin commitear
-(avisan), ni si en disco se llama con otras mayúsculas. Cualquier fallo al
-generarlo (una `tarea.md` ilegible, una zona manual sin cerrar) deja el
-fichero como estaba y solo avisa.
-
-**La zona manual.** Lo que va entre una línea que empieza por
-`<!-- manual:inicio` y la línea `<!-- manual:fin -->` se conserva byte a byte.
-Ahí van el motivo de cada hito y un `### Hn — título` por hito, que da el
-título y el orden de su tabla.
-
-**Comando.** `taskctl roadmap` muestra el que se generaría, sin escribir.
-`taskctl roadmap --comparar` lista, sin escribir nada, lo que difiere del
-actual (tareas con su título, complejidad, dependencias y estado, hitos, filas
-duplicadas, zona manual y el texto propio fuera de ella que se perdería) y sale con 1 si hay
-diferencias. `taskctl roadmap --escribir` lo regenera sin commitear, aunque no
-exista o tenga historia; sobre uno sin la marca, solo si `--comparar` saldría
-limpio.
-
-**Migrar un proyecto que ya tiene el suyo.** Mientras no lleve la marca,
-`taskctl` lo deja en paz. Para pasarlo: `taskctl roadmap --comparar`, corregir
-lo que salga (normalmente, llevar a una zona manual los textos y los títulos
-de los hitos), repetir hasta que salga limpio, `taskctl roadmap --escribir`,
-revisar el diff, commitear y retirar el script propio. La guía está en la skill
-`task-workflow`, en `roadmap.md`. Con una versión vieja del plugin, un ROADMAP
-con la marca se queda desactualizado sin aviso.
-
-## Problemas conocidos
-
-### Un subagente se deniega con «Auto-Mode Bypass»
-
-**Síntoma.** Con Claude Code en modo de permisos automático (*auto mode*; no
-confundir con `modo_flujo: automatico` del plugin), las fases que lanzan subagentes (`plan` con
-sus roles y el unificador, `review` con los revisores) se paran porque Claude
-Code deniega el lanzamiento y cita *Auto-Mode Bypass*, sin más explicación.
-
-**Causa.** Desde Claude Code 2.1.317/2.1.318, el modo automático deniega el
-lanzamiento de un subagente cuando un hook `PreToolUse` cuyo matcher alcanza
-a `Agent` (o `Task`) reescribe el encargo. Es lo que hace, por ejemplo,
-context-mode 1.0.169, que añade un bloque al prompt de cada subagente. El
-hook puede venir de otro plugin instalado o de un `settings.json` (de
-usuario, de proyecto o `settings.local.json`).
-
-**Diagnóstico.** `taskctl doctor` (o `taskctl doctor --json`) lo detecta: da
-un AVISO con id `hooks-subagente` por cada hook `PreToolUse` cuyo matcher
-alcanza a `Agent` o `Task` (también `""`, `"*"` o sin matcher), con el origen
-(plugin o settings), la ruta del fichero y el matcher literal. Solo mira los
-plugins habilitados (`enabledPlugins`) y la versión instalada activa de cada
-uno. Es un aviso y no cambia el código de salida: el hook puede ser inocuo.
-
-**Salidas** (cualquiera de las tres):
-
-1. **Quitar `Agent` y `Task` del matcher.** Si el hook está en tus settings,
-   edítalo. Si es de un plugin, sus ficheros se sobrescriben al actualizarlo:
-   la forma estable es un hook propio de `SessionStart` en tus settings que,
-   al arrancar cada sesión, reescriba el `hooks.json` de ese plugin sin
-   `Agent` ni `Task` en el matcher.
-2. **Desactivar el plugin causante:** `"enabledPlugins": { "<plugin>@<marketplace>": false }`
-   en `settings.json`, o `/plugin` en Claude Code.
-3. **Aprobar a mano cada lanzamiento:** salir del modo de permisos
-   automático de Claude Code (por ejemplo, al modo por defecto, que pregunta)
-   mientras se lanzan los subagentes, y aprobar cada uno.
-
-Después, `taskctl doctor` debe dar `hooks-subagente` en `ok` (salvo que
-elijas la tercera salida).
-
-## Mecanismo determinista de sección 14 (punto 11): sigue sin confirmarse
-
-TASK-006 pide explícitamente (AC3) dejar constancia de que el "mecanismo
-determinista para comprobar instalación" de la sección 14 de
-`docs/PROPUESTA_METODOLOGIA.md` sigue sin confirmarse con documentación
-oficial. Cita exacta, punto 11 de esa sección: *"confirmar a mano (no dar
-por bueno sin probar) el mecanismo exacto para que `taskctl` compruebe de
-forma determinista qué plugins/skills están instalados en la máquina
-local (comando de CLI o archivo de configuración concreto) — sección 6.6,
-paso 3."*
-
-Es un punto distinto de todo lo demás documentado arriba: no es sobre que
-una persona confirme a mano que el plugin está instalado (eso es el resto
-de este README), sino sobre que **`taskctl` mismo** tenga una forma
-programática y determinista de preguntarle a Claude Code qué
-plugins/skills están instalados en la máquina — sin depender de un LLM
-para adivinarlo. La investigación de esta tarea (centrada en
-`--plugin-dir`, el schema de `plugin.json` y el mecanismo `bin/` en PATH)
-no cubrió esto, y no se ha encontrado en la documentación oficial
-consultada (`plugins-reference`, `plugins`, `plugin-marketplaces`,
-`setup`) un comando de CLI o fichero de configuración pensado para que un
-*script* (no una persona en una sesión interactiva) consulte ese estado.
-Queda registrado como sigue pendiente, sin bloquear TASK-006 — tal como
-pide el criterio de aceptación.
-
-## Comandos disponibles
-
-Ver `taskctl --help` (arriba) para la lista completa y actualizada. Guía
-extendida de la metodología: `docs/PROPUESTA_METODOLOGIA.md` y
-`docs/PLAN_SPRINTS.md` en la raíz del repo `TaskCode`.
-
-`taskctl doctor [--json]` (solo lectura) comprueba de una vez que el proyecto
-está listo para trabajar y es lo primero que conviene ejecutar al instalar el
-plugin en un proyecto. Una línea por comprobación (`ok`, `aviso`, `error` u
-`omitida`) y, en cada aviso o error, el comando que lo arregla; sale con 1 si hay
-algún error (los avisos no cuentan). Comprueba:
-
-- **Entorno**: Node 22 o superior, `git` y un `bash` capaz de ejecutar los
-  scripts de Git-Flow. Lo último se prueba ejecutando de verdad un script mínimo
-  (`scripts/gitflow/_sonda-bash.sh`: `mktemp`, `dirname`, `grep`, `sed`, `tr`, `wc`,
-  `git`) con el mismo lanzamiento que usan los scripts, no mirando una ruta ni
-  `bash --version`: en Windows detecta el bash de WSL (System32) y el de Git sin
-  `usr\bin` en el PATH, y el arreglo dice qué poner al principio del PATH.
-- **Repositorio**: que es un repo Git (un worktree también), que tiene commits,
-  las cinco carpetas de `tareas/`, la rama base (`develop`, o `rama_base`) y la
-  principal (`main` o `master`), `origin` y el workspace. Sin `origin` es un aviso
-  (un proyecto solo local es legítimo) y pasa a error con `cierre_por_defecto:
-  merge-request`; un workspace sucio es un aviso. El workspace se mira con
-  `GIT_OPTIONAL_LOCKS=0`, así que no toma `index.lock`; un fallo por bloqueo es aviso.
-- **Config**: `.taskcode/config.yml` con el mismo validador que el resto de comandos
-  (un valor inválido es error con su mensaje; una clave desconocida, aviso).
-- **Verificación selectiva** (`verificacion-selectiva`): con `comando_verificacion`
-  y sin `comando_verificacion_selectiva`, `aviso` con el arreglo en la misma
-  línea; con las dos, `ok` (con `rutas_verificacion_parcial`, dice que `finish`
-  puede integrar con la selectiva y un merge a mano no). Con
-  `rutas_verificacion_parcial` y sin `rutas_documentacion`, `aviso`: la clave no
-  tendría efecto. Sin completa no dice nada.
-- **Verificación**: si la config declara `comando_verificacion` (ver abajo), `ok`
-  con el comando y su timeout. Sin él, depende de si el proyecto tiene tests en
-  su raíz:
-  - **Con tests detectables**: `aviso`, con el comando propuesto listo para pegar
-    en la config. Los frenos no actúan aunque haya con qué verificar. Detecta
-    `package.json` con script `test` propio (`pnpm`, `yarn` o `npm` según el
-    fichero de bloqueo; el `test` que deja `npm init` no cuenta), `Cargo.toml`,
-    `pom.xml` y `build.gradle(.kts)` (con `mvnw`/`gradlew` si existen),
-    `*.csproj`/`*.sln`, `go.mod` y `pyproject.toml` que mencione pytest. Si hay
-    varios, propone sus comandos encadenados con `&&`.
-  - **Sin tests detectables**: `omitida`, con el arreglo en la misma línea. Un
-    proyecto sin tests no está mal configurado.
-
-  Solo mira la raíz (desde ahí se ejecuta el comando): un manifiesto en una
-  subcarpeta no cuenta. `doctor` no ejecuta el comando ni escribe la config.
-- **Tareas**: cada `tarea.md` se lee y valida, y su `estado` tiene que ser el de
-  su carpeta. Son errores, con el ID: un ID en dos carpetas, un `tarea.md` ilegible
-  (con la ruta y la causa), una carpeta de tarea sin `tarea.md`, un estado distinto
-  de la carpeta.
-- **Plataforma**: solo si la config pide merge request por defecto o declara
-  `plataforma_remota`: `gh`/`glab` instalado y con sesión (sin subir nada; espera
-  como máximo 10 s). CLI no instalado o sesión rechazada es error; no poder
-  verificarlo (timeout, sin red) es aviso; si no aplica, `omitida`. Nunca imprime
-  la URL de `origin` con credenciales.
-- **Hooks** (`hooks-subagente`): los hooks `PreToolUse` que alcanzan a los
-  subagentes (ver «Problemas conocidos»). Como mucho, aviso.
-- **Versión del plugin** (`version-plugin`): compara la versión del plugin que
-  tiene instalada Claude Code (`installed_plugins.json`) con la de la copia local
-  de su marketplace. Si la del marketplace es mayor, aviso con las dos versiones,
-  la fecha de esa copia y los comandos para actualizar (`claude plugin marketplace
-  update <marketplace>`, `claude plugin update taskcode-plugin@<marketplace>` y
-  reiniciar Claude Code). No sale a la red: si la copia local no se ha refrescado,
-  no ve versiones más nuevas. Si no puede comprobarlo (plugin no instalado por
-  Claude Code, sin copia del marketplace, un JSON roto), `omitida` con el motivo.
-  Nunca es error: no cambia el código de salida.
-- **Status line** (`status-line`): si Claude Code tiene instalada la status line
-  que muestra `taskctl estado` (ver «Progreso visible» abajo). Instalada, `ok`; si
-  no, `omitida` con el comando que la instala. Sin flags nunca es aviso ni error.
-
-`--json` escribe en stdout **solo** una línea de JSON
-(`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`), para que
-una skill la lea. `taskctl doctor` no commitea ni cambia de rama, y sin flags no
-escribe nada. La única escritura es la de la status line, con su flag:
-
-- `--instalar-status-line` la escribe en el `settings.json` **de usuario**
-  (`~/.claude/settings.json`, o el de `CLAUDE_CONFIG_DIR`): una vez, para todos
-  los proyectos. Conserva el resto de claves, deja una copia
-  (`settings.json.<fecha>.bak`) y escribe con fichero temporal y renombrado. Es
-  idempotente. El comando es `taskctl estado --stdin` si `taskctl` está en el
-  PATH del sistema. Si solo está en la carpeta del plugin (la que Claude Code
-  añade al PATH de su herramienta Bash), usa esa copia con `node` y su ruta
-  absoluta: como la ruta lleva la versión del plugin, tras actualizarlo hay que
-  repetir `--instalar-status-line`, que la reescribe con la ruta nueva (para no
-  depender de eso, pon `taskctl` en el PATH; ver «Usar `taskctl` fuera de
-  Claude Code»). Si ya hay otra status line, no la toca.
-- `--reemplazar-status-line` (junto al anterior) sustituye una status line
-  ajena; la anterior se guarda en `statusline-previa-taskctl.json`.
-- `--desinstalar-status-line` quita la de `taskctl` (una ajena no se toca) y
-  devuelve la que hubiera antes.
-
-Con cualquiera de ellos, si lo pedido no se puede hacer la comprobación sale como
-`error` y el código de salida es 1.
-
-#### Progreso visible: `taskctl estado`, la status line y `TASKCTL_PROGRESO`
-
-Mientras `plan`, `approve`, `start`, `review`, `finish` o el freno de fin de turno
-trabajan, cada uno deja en `.git/taskcode/progreso.json` (fuera del árbol de
-trabajo: no cambia la huella de la verificación) la tarea, la fase, sus pasos
-declarados de antemano, el paso en marcha y el instante de inicio, y lo marca
-terminado al acabar, también si aborta. Escribirlo no añade ninguna salida a
-ningún comando ni hook (lo que se imprime lo lee el agente y cuesta tokens) y
-nunca hace fallar el comando: si no se puede escribir, se pierde ese tic.
-
-`taskctl estado` lo muestra en una línea, leyendo solo esos ficheros, sin lanzar
-`git` ni leer `tareas/`:
-
-```
-TASK-110 · review (4/5) · ronda 2 · verificacion (3/5) 7/22 · 12 min
-```
-
-La fase con su posición en el ciclo (plan, approve, start, review, finish), la
-ronda si es una revisión, el paso con su posición dentro de la fase, el `x/N`
-del comando de verificación si lo escribe, y los minutos desde que empezó la
-fase. Los pasos: `plan` guardas, brainstorm, commit; `approve` guardas, plan,
-commit; `start` guardas, rama, commit; `review` guardas, integracion,
-verificacion, peticiones, commit; `finish` puertas, verificacion, cobertura,
-held-out, merge, artefactos; el freno de fin de turno no es una fase del ciclo y
-va sin posición, con un único paso (`verificacion`, o `verificacion selectiva` /
-`verificacion documentacion`): `TASK-110 · freno · verificacion (1/1) · 0 min`.
-Sin nada en marcha dice `Nada en marcha.` (o la última fase y si terminó, abortó
-o, en el freno, terminó `en rojo` porque la verificación falló); fuera de
-un repo con `tareas/` o `.taskcode/` no imprime nada. Sale siempre con 0.
-`--stdin` toma el directorio del JSON que Claude Code pasa a la status line.
-`--seguir` refresca cada segundo hasta que la fase termina; sin terminal imprime
-una sola línea y sale, para que un agente que lo lance no se quede esperando.
-
-La status line de Claude Code (`taskctl doctor --instalar-status-line`) ejecuta
-`taskctl estado` en cada refresco: el estado se ve sin preguntar al agente, y no
-entra en su contexto. Se ve también en la app de escritorio y por Remote Control.
-
-`TASKCTL_PROGRESO`: el comando de verificación (`comando_verificacion`, la
-selectiva y la de documentación, en `finish`, en las rondas de `review` y en el
-freno) recibe en esta variable la ruta de un fichero bajo `.git/`. Si escribe en
-él una línea `x/N` (la última con texto cuenta), `taskctl estado` la muestra en
-el paso de verificación. Es opcional: sin escribir nada, la línea muestra el
-paso sin `x/N`. Solo lo recibe ese comando: no lo heredan los scripts de
-Git-Flow ni el de held-out, y un `TASKCTL_PROGRESO` que ya estuviera en el
-entorno se sustituye. De lo que se escriba solo se muestran los números.
-
-#### Cómo se verifica el proyecto: `comando_verificacion`
-
-Los frenos de verificación (que una tarea no se dé por hecha ni se mergee con
-los tests en rojo) ejecutan **el comando que declara el proyecto**, nunca uno
-deducido. Se declara en `.taskcode/config.yml`:
-
-```yaml
-comando_verificacion: "npm test"   # entrecomillado si lleva "#"
-timeout_verificacion: 900          # opcional, en segundos (por defecto 600)
-```
-
-- `comando_verificacion`: texto no vacío; lo ejecuta el shell del sistema tal
-  cual. Sin la clave no hay freno y todo funciona como antes.
-- `timeout_verificacion`: entero mayor o igual que 1, en segundos. Solo tiene
-  sentido con el comando: sin él, aborta.
-- Un valor inválido (comando vacío, timeout `0`, decimal o texto) aborta todos
-  los comandos con un mensaje que nombra la clave y la línea; nunca se cae al
-  valor por defecto en silencio.
-- La ejecutan el **freno de fin de turno** (hook `Stop`), la **puerta de
-  `finish`** y la consulta el **guardián de merges** (hook `PreToolUse`), abajo.
-
-#### Verificación selectiva por impacto: `comando_verificacion_selectiva`
-
-Cuando la completa tarda mucho, el proyecto puede declarar además una
-verificación **selectiva**, que corre solo lo afectado por los cambios. La usan
-el freno de fin de turno y las rondas de `taskctl review`; por defecto la
-completa sigue siendo la puerta de `finish` y del guardián de merges (la
-excepción, más abajo: `rutas_verificacion_parcial`).
-
-```yaml
-comando_verificacion: "npm test"                                    # la completa
-comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
-timeout_verificacion_selectiva: 600                                 # opcional (por defecto 600)
-```
-
-- Recibe la rama base de la tarea en la variable de entorno `RAMA_BASE` (la de
-  integración, o la principal en un hotfix); no se añade nada al comando. El
-  mapa de capas es del proyecto: el script decide qué correr.
-- Exige `comando_verificacion`: la selectiva sin la completa aborta, porque
-  dejaría `finish` sin puerta. El timeout sin su comando también aborta.
-- **Hook `Stop`**: con la clave corre la selectiva en vez de la completa, con su
-  propio memo (`.git/freno-verificacion-selectiva.json`, con la base y su commit
-  en la huella). El guardián solo lee el memo de la completa: un verde de la
-  selectiva nunca deja pasar un merge, aunque los dos comandos sean iguales.
-- **`taskctl review`**: la corre antes de escribir la ronda (en la primera,
-  después de integrar la base en la rama; las incrementales no la integran). En
-  rojo, o si deja el árbol sucio, aborta: no abre ronda y la tarea sigue en
-  curso; el mensaje dice si la base quedó integrada. En verde, la
-  petición lleva la sección «Verificación de esta ronda» (tipo, comando,
-  resultado y final de la salida) y omite la de cobertura, porque el informe
-  podría ser parcial.
-- **`taskctl finish`**: ejecuta la completa como siempre (salvo con
-  `rutas_verificacion_parcial`, abajo); en rojo, el mensaje recuerda que se
-  exige aunque las rondas usaran la selectiva; con `rutas_verificacion_parcial`,
-  en su lugar dice por qué tocó la completa y no la selectiva.
-- **Sin la clave**, todo funciona como antes: el `Stop` corre la completa y
-  `review` no verifica.
-- **Ejemplo real**: el repo de TaskCode declara como selectiva
-  `node scripts/verificar-impacto.mjs` (fuera del plugin). Elige los tests de
-  lo que cambia por el grafo de imports, se para en el enrutador `src/cli.ts`
-  (y lo dice), suma los de `test:rapido` y, si lo elegido pasa de
-  `VERIFICAR_IMPACTO_TOPE` ficheros (10 por defecto), corre los tests directos
-  o, si tampoco caben, los más próximos al módulo cambiado, y dice cuántos deja
-  fuera. Con una rama base inexistente sale con error.
-- Cómo escribir el clasificador y qué cambios obligan a correr todo: guía
-  instalada con el plugin, `skills/task-workflow/verificacion-selectiva.md`.
-
-#### Tareas de solo documentación: `rutas_documentacion`
-
-El coste de verificar debe crecer con lo que cambia la tarea, no con el tamaño
-del proyecto. Si todo lo que cambia la tarea frente a la base cae en rutas de
-documentación declaradas, `finish` no corre `comando_verificacion`:
-
-```yaml
-comando_verificacion: "npm test"
-rutas_documentacion: [docs/**, README.md, CHANGELOG.md]          # patrones git :(glob), sin anclar
-comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opcional
-```
-
-- Las rutas se leen de la config de la **rama base**: la tarea no puede
-  ampliarlas para eximirse, y si cambia `.taskcode/config.yml` corre la
-  completa. `tareas/` cuenta siempre como documentación (la cambia toda tarea;
-  sus held-out los sigue corriendo su puerta).
-- **Ante la duda, la completa**: diff que no se puede calcular o vacío, mezcla
-  de documentación y código, o un renombre de código a una ruta de
-  documentación (cuentan las dos rutas). Un `release`
-  corre siempre la completa.
-- Con `comando_verificacion_documentacion` se ejecuta ese (con
-  `timeout_verificacion`); su rojo bloquea y su verde va a su propio memo
-  (`.git/freno-verificacion-documentacion.json`), nunca al de la completa. La
-  puerta de cobertura no mide nada en una tarea de solo documentación.
-- `finish` dice qué corrió y por qué, y lo anota en `tarea.md` (sección
-  «Verificacion de documentacion»), commiteado antes del merge.
-- No declares `**/*.md`: skills, agentes, `CLAUDE.md` o comandos son Markdown
-  que se ejecuta. La guía `verificacion-selectiva.md` trae la lista.
-- Exige `comando_verificacion`; el comando de documentación exige las rutas.
-  Sin `rutas_documentacion`, todo funciona como antes.
-- El **fin de turno** (`Stop`) y **`review`** aplican la misma decisión sobre
-  todo lo que cambia la tarea frente a la base (nunca sobre el último turno ni
-  el delta de la ronda). El fin de turno cuenta además lo no commiteado (un
-  `.ts` sin `git add` saca el turno de «solo documentación») y, en un turno de
-  solo documentación, corre la comprobación de documentación o nada. `review`
-  solo verifica si declaras `comando_verificacion_selectiva`: con ella, una
-  ronda de solo documentación corre la comprobación de documentación en su
-  lugar (o nada) y la petición lo dice; sin ella no corre nada, como antes.
-  **Cambio de comportamiento** si ya declarabas `rutas_documentacion`: esos
-  turnos y rondas dejan de correr la completa o la selectiva.
-- Lo aplican `finish` y el **guardián de merges**, con la misma decisión (la
-  config de la rama destino): un merge a mano de una tarea de solo
-  documentación pasa sin el verde de la completa, o con el verde de su
-  comprobación de documentación si la hay. El guardián no aplica la exención si
-  el comando hace algo más que un merge, cambiar de carpeta o de rama y
-  consultar (un `git commit`, otro merge, `>`, `$(...)` o un script podrían
-  cambiar lo que entra),
-  en un release, ni si cambian los held-out (`tareas/.../aceptacion/`), y la
-  calcula solo cuando ya iba a bloquear, con un presupuesto de 20 s.
-
-#### Código parcial: `rutas_verificacion_parcial`
-
-El mismo principio un paso más allá: si todo el código que cambia la tarea cae
-en unas rutas acotadas, a `finish` le basta la verificación de lo afectado. Por
-defecto la completa es la puerta de integración; declarar esta clave es
-aceptar, para este proyecto, que en esas rutas baste la selectiva.
-
-```yaml
-comando_verificacion: "npm test"
-comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
-rutas_documentacion: [docs/**, README.md]
-rutas_verificacion_parcial: [src/web/**]          # lista de rutas permitidas
-```
-
-- Lista de rutas **permitidas**, leída de la config de la **rama base**: si todo
-  lo que la tarea cambia frente a la base, salvo la documentación, cae en ellas,
-  `finish` corre `comando_verificacion_selectiva` (con `RAMA_BASE` y
-  `timeout_verificacion_selectiva`) en vez de la completa. Un fichero fuera, un
-  cambio de `.taskcode/config.yml` o un diff vacío van a la completa.
-- Exige `comando_verificacion_selectiva` (la config aborta sin ella) y
-  `rutas_documentacion` (sin ellas no tiene efecto: `taskctl doctor` avisa).
-- `finish` dice que corrió la selectiva y por qué, y tras el verde lo anota en
-  `tarea.md` («Verificacion parcial») antes del merge. Reutiliza un verde de la
-  selectiva del mismo commit y la misma base si lo hay (fin de turno o `review`,
-  con el árbol limpio).
-- `finish` no evalúa la puerta de cobertura (el informe sería parcial), y
-  ninguna puerta posterior mide esas líneas: el release corre la completa, pero
-  su cobertura solo mide lo que añade la propia rama release. Con
-  `umbral_cobertura`, las tareas integradas con la selectiva no se comparan con él.
-- El release va siempre a la completa. Un hotfix nunca usa la selectiva (con
-  código, la completa; de solo documentación, su camino de documentación).
-- El **guardián de merges sigue exigiendo la completa para el código**: un merge
-  a mano de una tarea con código queda bloqueado sin su verde, aunque a `finish`
-  le bastara la selectiva. Si `finish` choca en un conflicto, no repitas el
-  merge a mano ni lo cierres en la rama de integración (el guardián bloquea el
-  commit que lo cerraría, y un `finish` relanzado sobre ese merge verifica la
-  rama de integración y en rojo no cierra): abórtalo con
-  `taskctl abort-merge`, integra la base en la rama de la tarea, resuelve allí y
-  vuelve a lanzar `taskctl finish` desde ella.
-- Sin la clave, todo funciona como antes.
-
-#### Freno de fin de turno (hook `Stop`)
-
-El plugin declara en `hooks/hooks.json` un hook `Stop` que Claude Code ejecuta
-cada vez que el agente principal termina un turno, en todas las sesiones del
-proyecto. Solo actúa si **hay una tarea en `tareas/02-en-curso/` cuya `rama` es
-la rama actual** y el proyecto declara `comando_verificacion`; en cualquier otro
-caso sale 0 sin lanzar ningún proceso (ni `git`). Cuando actúa:
-
-- Ejecuta el comando con el mismo envoltorio que la sincronización (shell del
-  sistema, stdin cerrado, el árbol entero se mata al cortarlo) y la salida a un
-  fichero temporal, del que solo se lee el final.
-- **Verde** (código 0): deja terminar el turno, sin escribir nada.
-- **Rojo, cortado o no ejecutable**: sale con 2, así que Claude Code devuelve el
-  turno al agente con este informe por stderr: el comando, el código de salida
-  (o el corte), la duración y el final de la salida (stdout y stderr
-  intercalados), acotado a 40 líneas y 4 KiB, sin colores ANSI, sin credenciales
-  en URLs y sin partir caracteres. El informe pide no borrar ni saltar tests
-  para pasar el freno.
-- **Config inválida** con una tarea en curso en la rama: también sale con 2,
-  con el error de la config.
-- **Un solo disparo por turno**: si Claude Code ya está continuando por un
-  bloqueo del freno (`stop_hook_active`), deja terminar. Es a propósito: un test
-  intermitente no puede dejar al agente en un bucle.
-- **Memo por huella**: guarda el último resultado junto a una huella del árbol
-  (HEAD, comando, timeout y contenido de lo que no está limpio) en
-  `.git/freno-verificacion.json`. Con la misma huella no se vuelve a ejecutar:
-  un verde deja terminar y un rojo repite el informe, diciendo que es el
-  guardado. Cualquier cambio en el árbol lo invalida, salvo en ficheros
-  ignorados por `.gitignore` (la huella sale de `git status`): si lo único que
-  cambia es un ignorado (`.env.local`), cambia algo versionado o ejecuta el
-  comando a mano.
-- Una tarea de `02-en-curso` con el `tarea.md` ilegible no frena (no se sabe si
-  es la de esta rama), pero el hook la nombra en un aviso.
-- **Tope**: el `timeout` del hook es 3600 s, y Claude Code descarta la salida
-  de un hook que lo agota (el freno no frenaría). Por eso la verificación se
-  corta a `min(timeout_verificacion, 3540)` s, avisando si se recorta.
-- Si la verificación cambia ficheros del árbol (compilados, cobertura), el
-  informe lo avisa: el siguiente comando de `taskctl` puede abortar por
-  workspace sucio.
-- **Apagarlo**: `FRENO_VERIFICACION=0` en el entorno de Claude Code, o quitar
-  `comando_verificacion` de la config.
-- Los subagentes no disparan `Stop` (disparan `SubagentStop`), así que el freno
-  no los frena; y no actúa si la persona interrumpe el turno (Esc).
-
-#### Coste de implementación automático (hooks `Stop` y `SubagentStop`)
-
-Con una tarea en curso en la rama actual, el plugin anota al terminar cada
-turno y cada subagente qué transcripción ha trabajado en ella. Solo guarda
-rutas, en `.git/coste-pendiente.jsonl` (`git rev-parse --git-path`): no lee
-transcripciones, no toca `tarea.md`, no cambia la huella del freno de arriba
-y sale siempre con 0. Sin tarea en curso en la rama sale antes de lanzar
-ningún proceso (las mismas guardas baratas que el freno).
-
-`taskctl review` suma ese coste a `tokens_implementacion` en su propio commit,
-con una fila en `## Coste` por fuente: `sesion:<id>` (el hilo principal) y
-`agente:<id>` (cada subagente; también los de la sesión aunque el hook no los
-viera). Cuenta solo las llamadas cuyo `timestamp` cae entre el `start` y el
-`review` de `## Transiciones`, cuyo `gitBranch` es la rama de la tarea y cuyo
-`cwd` está dentro del repo: el diseño, otras tareas de la misma sesión y la
-revisión no entran. Lo ya anotado para un id se descuenta (de uno anotado en
-implementación solo se suma lo que creció, `dif:`; uno anotado en otra fase o
-junto a otros no se toca), así que un `registrar-coste --fase implementacion`
-hecho antes no se duplica. `taskctl finish` repite el volcado como red. Si
-todo el ciclo cabe en un turno, el hook aún no ha corrido al llegar a
-`review`: entonces se usa la sesión que nombra `CLAUDE_CODE_SESSION_ID`, si
-Claude Code la define. Un fallo del volcado nunca rompe `review` ni `finish`:
-deja la tarea como estaba y avisa.
-
-Lo que se acepta: el fichero de `.git/` no viaja con el clon (una tarea
-trabajada en otro clon se registra a mano) y las correcciones de la ronda 2,
-que se hacen con la tarea en revisión, no cuentan como implementación.
-`COSTE_AUTOMATICO=0` en el entorno lo apaga todo.
-
-#### Puerta de verificación en `finish`
-
-Con `comando_verificacion` declarado, `taskctl finish` lo ejecuta **siempre**
-antes del primer efecto (merge, o subir la rama y abrir el merge request): no
-reutiliza un verde guardado, porque la huella no ve los ficheros ignorados.
-
-- **No verde**: aborta con el mismo informe que el freno y sin tocar nada.
-- **Verde que ensucia el árbol** (compilados, cobertura no ignorados): aborta con
-  un mensaje propio antes de que el script de Git-Flow lo haga por workspace sucio.
-- Hay que lanzarlo **desde la rama de la tarea**: es el árbol que se verifica.
-- **No corre** en el segundo `finish --merge-request` (la plataforma ya mergeó).
-- **En el camino idempotente** (la rama ya integrada: un merge a mano, o el
-  commit que cerró un conflicto en la rama de integración) verifica el árbol de
-  la rama de integración antes de cerrar (TASK-123), con la misma decisión
-  proporcional (documentación, selectiva o completa, sobre lo que entró con la
-  tarea) y reutilizando un verde del mismo árbol. En rojo aborta sin mover la
-  tarea, vuelve a la rama de partida y dice cómo arreglarlo; `--sin-verificacion`
-  la salta y lo anota en `## Verificacion omitida`.
-- `--sin-verificacion` la salta y lo deja escrito en `tarea.md`, sección
-  `## Verificacion omitida`, con un commit en la rama de la tarea **antes** del
-  merge: el rastro sobrevive aunque el proceso muera después.
-- Tras un verde guarda el memo con la huella del commit, que es lo que consulta
-  el guardián de merges.
-- `finish` tarda lo que tarde la suite: si lo lanza un agente, que su
-  herramienta de shell no lo corte antes.
-
-#### Tests held-out (`aceptacion/`)
-
-Tests de aceptación que escribe la **persona** a partir de los criterios y que
-el agente que implementa no debe ver. Van en la carpeta `aceptacion/` de la
-tarea, se commitean **en la rama base durante el diseño, antes de `start`** (la
-rama nace con ellos y no aparecen en su diff), y se ejecutan con:
-
-```yaml
-comando_heldout: "npm run aceptacion"   # recibe la carpeta en HELDOUT_DIR
-```
-
-`taskctl finish` los ejecuta justo después de la puerta de verificación, en
-los mismos caminos (no en el segundo `finish --merge-request` ni en el camino
-idempotente), con el cwd en la raíz del repo, `HELDOUT_DIR` = ruta absoluta de
-la carpeta y `timeout_verificacion` como tope. Aborta, sin mergear:
-
-- si no salen en verde, mostrando **solo** comando, código y duración: la salida
-  de un test suele llevar sus aserciones, y la lee el agente;
-- si la rama los ha **editado, añadido o borrado** respecto a la rama base (se
-  compara el árbol de Git de `aceptacion/`, esté en el estado que esté), o los
-  trae sin estar en la base; el mensaje da las órdenes para restaurarlos en su
-  ruta. Si quien los cambió fue la base (la persona los corrigió después de
-  `start`), pide integrarla en la rama (`git merge <base>`);
-- si hay una carpeta `Aceptacion/` con otras mayúsculas;
-- si la tarea tiene `aceptacion/` y la config no declara `comando_heldout`;
-- si en verde dejan el árbol sucio.
-
-La rama base es la de integración, salvo en un hotfix, que nace de la principal. Si los held-out de un hotfix
-están en la rama de integración y no en la principal, aborta en vez de cerrar sin ejecutarlos.
-`comando_heldout` y su timeout se leen de la config **de la rama base**: la rama de
-la tarea no puede cambiar cómo se ejecutan. `--sin-verificacion` no los salta. Sin `aceptacion/` (ni en la rama ni en la
-base) no hay puerta. La petición de revisión excluye siempre
-`tareas/*/TASK-*/aceptacion/**`, aunque se cambie `excluir_de_revision`: el
-revisor no los lee. Que queden fuera de `comando_verificacion`, o el freno de
-fin de turno mostraría su salida. En la rama de la tarea, un hook `PreToolUse`
-impide al agente leerlos, buscarlos o editarlos (ver `skills/task-workflow/heldout.md`).
-
-#### Cobertura de las líneas cambiadas
-
-Una línea cambiada que ningún test ejecuta es un hallazgo. Se mide sobre las
-líneas añadidas o cambiadas desde la **merge base** de la rama con su base (no
-sobre todo el repo), sin lo que excluye `excluir_de_revision` ni los held-out, y
-con el informe **lcov** que genera el propio `comando_verificacion`: taskctl
-nunca ejecuta tests para obtenerlo.
-
-```yaml
-comando_verificacion: "npm test"           # tiene que escribir el lcov
-informe_cobertura: coverage/lcov.info      # relativa a la raiz del repo; ignorala en .gitignore
-umbral_cobertura: 80                       # opcional: % minimo cubierto para que finish cierre
-```
-
-- **`taskctl review`** añade a la petición la sección «Cobertura de las líneas
-  cambiadas»: las líneas sin cubrir por fichero (`src/a.ts: 4-6, 9`), el
-  porcentaje y los ficheros que cambian pero el informe no lista. Solo informa:
-  si el informe no existe, está cortado, es anterior al último commit de la
-  rama o ninguna de sus rutas es un fichero del repo fuera de lo excluido, lo
-  dice como aviso y no lista líneas. Sin `informe_cobertura` no hay sección.
-- **`taskctl finish`**, solo con `umbral_cobertura`: justo después de la
-  verificación (que acaba de regenerar el informe) y antes de los held-out,
-  aborta sin mergear si el porcentaje cubierto no llega al umbral (el valor
-  exacto pasa), y también si no hay datos fiables: el informe no existe, está
-  cortado, es anterior a la verificación de ese mismo `finish`, o ninguna ruta
-  del informe es del fuente del repo. Sin datos nunca cuenta como aprobado.
-- Cuenta una línea cambiada (no en blanco) con `DA` en el informe (`DA:n,0` =
-  sin cubrir); sin `DA` no es ejecutable. Un fichero cambiado que el informe no
-  lista cuenta con todas sus líneas sin cubrir si el informe **sí** mide su
-  extensión y alguna de sus carpetas tiene un fichero medido, sin contar la
-  raíz del repo ni la del proyecto que generó el informe (la carpeta contra la
-  que se resuelven sus rutas relativas, como `pkg/`, y sus padres): un `.mjs`
-  nuevo en `src/` que ningún test carga (`node --test` y c8
-  sin `--all` solo listan lo cargado). No cuentan un `.md` o un `.yml`, los
-  tests si el proyecto los excluye de la cobertura (`test/` sin nada medido) ni
-  los `*.d.ts`: una tarea de solo documentación, o de solo tests, no se frena.
-  Un `.ts` solo de tipos en una carpeta medida sí cuenta; para evitarlo, genera
-  la cobertura con `--all`/`include`, y saldrá en el informe sin líneas
-  ejecutables.
-- Las rutas `SF:` pueden ser absolutas o relativas, con `\` o `/`. Una relativa
-  se resuelve contra la carpeta del informe y cada una de sus padres hasta la
-  raíz, la más cercana primero: un proyecto en `pkg/` con el informe en
-  `pkg/coverage/lcov.info` funciona.
-- `umbral_cobertura` e `informe_cobertura` se leen, en `finish`, de la config
-  **de la rama base**: la rama no puede rebajar su propio freno. El umbral exige
-  `informe_cobertura` y `comando_verificacion`.
-- `--sin-verificacion` no regenera el informe, así que tampoco mide el umbral:
-  lo avisa, y el salto queda anotado en la tarea.
-- Si la cobertura mide el código compilado (por ejemplo `dist/`, excluido) y no
-  el fuente, el informe no sirve: con umbral, `finish` no cierra.
-
-#### Guardián de merges (hook `PreToolUse`)
-
-Antes de cada comando Bash o PowerShell del agente (sin filtro `if`: el de
-prefijo no ve `cd x && git merge`), el hook mira si el texto integra algo en la
-rama de integración (`rama_base`) o en la principal:
-
-- `git [-C dir] merge … <ref>`, con destino la última rama de un `git
-  checkout|switch` del mismo texto o, si no hay, la rama actual; y los scripts
-  `merge-<tipo>-to-<destino>.sh <rama>`. Un `git checkout <x>` con un único
-  argumento solo cambia el destino si `x` es una revisión: una rama (en
-  `refs/heads/` o en `refs/remotes/origin/`), un tag o un commit (estos dos
-  desacoplan HEAD, así que el merge no entra en ninguna rama). `HEAD` y `@` no
-  cambian el destino: te dejan en la misma rama. `git checkout README.md && git
-  merge x` restaura un fichero y el destino sigue siendo la rama actual.
-- El texto de `bash|sh|zsh|dash [opciones] -c "…"`, `pwsh|powershell -Command …`,
-  `cmd /c|/k …` y `eval …` se analiza igual que si se hubiera escrito
-  directamente (también con opciones con valor delante, como `bash -o pipefail
-  -c`), y también tras `time [-p] [--]`, `nohup`, `!`, dentro de un grupo
-  `{ …; }` y en la condición o el cuerpo de `if`, `elif`, `else`, `while` y
-  `until`.
-- **Bloquea** (exit 2, el motivo le llega al agente) si no hay un **verde
-  guardado para el commit que entra** —sin verde cuenta como no verde— y remite
-  a `taskctl finish` (o a `--sin-verificacion`, si lo decide la persona).
-- **Bloquea el commit que cierra un merge en curso** (TASK-123): un `git commit`
-  (también `git commit -am`, `git add … && git commit`) o `git merge --continue`
-  con `MERGE_HEAD` presente en la rama de integración o la principal es el merge
-  hacia ella, y lo que se commitea es la resolución, no lo verificado en la rama
-  de la tarea. Pasa solo con un verde guardado de ese mismo árbol (el del freno
-  `Stop`) o si lo que entra ya está integrado (ancestro de `HEAD`, de la
-  principal o de `origin/<rama>`: cerrar un `git pull` o un
-  `git merge origin/develop` con conflicto no se bloquea). Propone `taskctl abort-merge`,
-  integrar la base en la rama de la tarea, resolver allí y relanzar `finish`
-  desde ella. Sin `MERGE_HEAD`, o en una rama de tarea (que es justo el
-  remedio), no se toca.
-- **Bloquea siempre si `.taskcode/config.yml` existe pero no se puede leer**
-  (un valor inválido de cualquier clave) y el destino es `develop`, `main` o
-  `master` —lista fija, porque sin config no se sabe `rama_base`—, aunque lo
-  que entra ya esté integrado. El mensaje cita el error; se arregla el fichero
-  (`taskctl doctor` lo valida) y se repite el merge. Una config mal escrita no
-  desactiva el guardián. *Cambia el comportamiento de la 0.14.0*, que dejaba
-  pasar.
-- **Deja pasar** si el texto no contiene `merge` ni `commit` (sale sin cargar nada),
-  `merge --abort|--continue|--quit|--skip` como opción (no como el valor de
-  otra: `git merge -m --abort x` o `--message --abort x` sí mergean `x` y se
-  evalúan), `merge-base`,
-  `git config merge.*`, `echo "git merge …"`, merges hacia ramas de trabajo, lo
-  que ya está integrado (ancestro del destino, de la principal —el backmerge de
-  recuperación de un hotfix— o de `origin/<destino>`), proyectos sin fichero de
-  config o sin `comando_verificacion` y cualquier otro fallo antes de saber que
-  el destino es protegido.
-- `eval`, `time`, `nohup`, `{ …; }` y las estructuras de control nunca reciben
-  la exención de solo documentación: el merge se evalúa completo.
-- Nunca ejecuta la suite (su `timeout` es de 30 s): solo lee el memo.
-- Es una defensa contra despistes, no contra un agente hostil: no ve alias de
-  git, `git pull`, `git push . x:develop` ni lo que se calcula en una subshell.
-  Tampoco ve el cierre de un merge con `cd <otro repo> && git commit`, con
-  `--git-dir`/`--work-tree` ni con un alias de git (`git ci`): solo respeta
-  `-C <dir>`. Es el hueco inherente al análisis sintáctico del texto.
-  La red de verdad es la puerta de `finish`.
-
-`taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas]`
-es otro comando, distinto de `doctor`: aquel comprueba que el proyecto está listo
-para trabajar con el flujo de tareas; este, que **la aplicación está lista para
-publicarse** sin agujeros conocidos (claves expuestas, secretos en git, RLS,
-cookies, HTTPS, dependencias vulnerables...). Sin `--crear-tareas` solo lee. La
-skill `/taskcode-plugin:doctor-deploy` lo encadena con un agente revisor para los
-puntos de juicio (ver «Puntos de juicio» más abajo).
-
-- **Tipo de aplicación**: lo detecta por ficheros marcadores (Node con npm,
-  pnpm o yarn, Rust, Python, Java con Maven o Gradle, .NET, Go, PHP, Ruby, Docker
-  y frontend web), hasta tres carpetas de profundidad y sin mirar `node_modules`,
-  `vendor`, `target`, `dist` ni `build`, y lo muestra. Los tipos y sus marcadores
-  son datos del catálogo (`tipo_N_*`): añadir uno no toca código. Si no detecta
-  ninguno, lo dice (los puntos que dependen de un tipo salen NO APLICA).
-- **Clase de aplicación** (segundo eje, independiente del lenguaje): web, api,
-  android, ios, flutter, react-native, cli o libreria, con los marcadores de la
-  familia `aplicacion_N_*` del catálogo (`id`, `nombre`, `marcadores` y,
-  opcional, `contiene`: textos que debe contener el fichero marcador; un
-  `package.json` es `cli` si contiene `"bin"`). Sale como «Aplicacion
-  detectada», con el fichero que la decidió. Además de los frameworks, cuentan
-  como api las señales de servicio que no dependen de él: `EXPOSE` en un
-  Dockerfile, `ports:` en un compose o `web:` en un Procfile; una CLI que además
-  sirve HTTP sale cli y api, y los puntos aplican. Un punto puede declarar
-  `punto_N_aplicaciones: [web, api, ...]`: se combina con `punto_N_tipos` con
-  Y, y dentro de cada lista basta con uno. **Si no se detecta ninguna clase, el
-  punto aplica**; solo sale NO APLICA si se detecta alguna y ninguna está en la
-  lista, con el tipo y el marcador en el motivo. Hoy eso apaga los puntos de
-  servicio desplegado (https-obligatorio, cookies-seguras, security-headers,
-  rate-limits, backups-y-migraciones, health-check, proteccion-de-bots,
-  limitar-respuestas-api, cors-restringido y proteccion-csrf) en una CLI o una
-  librería sin marcadores de web ni de api. Un id desconocido o del eje
-  equivocado aborta, también en `.taskcode/doctor-deploy.yml`.
-- **Catálogo**: `scripts/doctor-deploy.yml` (formato plano `punto_N_*`, con
-  `total_puntos`). 43 puntos: los 20 pedidos, los medibles que faltaban y los de
-  dominio. Cada uno tiene `id`, `severidad`, `tipos`, `metodo` (`determinista` o
-  `juicio`), `sonda` (solo los deterministas), `arreglo`, `descripcion` y
-  `referencia` opcional, con la categoría del OWASP Top 10 2025 y el capítulo
-  del ASVS 5.0 que lo cubren (`OWASP Top 10 2025 Axx; ASVS 5.0 Vnn`);
-  licencias-de-dependencias no la lleva porque ninguno de los dos trata
-  licencias.
-- **Cuatro estados**: `OK` (con evidencia: nunca OK sin ella), `FALLA` (con
-  evidencia —fichero y línea, o commit— y el arreglo del catálogo), `NO VERIFICADO`
-  (diciendo qué falta: una herramienta, o la revisión con juicio) y `NO APLICA`
-  (con el motivo). Sale con **0 sin FALLA y 1 con alguna**. Un NO VERIFICADO no
-  cambia el código de salida, pero el resumen dice «N de M sin verificar»: salir
-  con 0 no significa «listo para publicar».
-- **Qué comprueba de forma determinista** (trece sondas; todo lo demás
-  es de juicio y sale NO VERIFICADO hasta que se revise con criterio):
-  secretos en el árbol; secretos en **todo el historial** de git (todas las
-  ramas, etiquetas y refs; un clon superficial, un desbordamiento de límites o un
-  corte dan NO VERIFICADO, nunca OK); ficheros de secretos versionados (`.env`,
-  claves privadas, credenciales; `.env.example` y `.env.sample` no cuentan); que
-  el `.gitignore` cubre `.env` (en **cada** carpeta de proyecto: en un monorepo
-  con más de 10 se comprueban todas, hasta un tope de 200; pasado el tope el
-  punto sale NO VERIFICADO diciendo cuántas faltan, nunca OK); lockfile versionado; y la auditoría de
-  dependencias con la herramienta del ecosistema **si está instalada**
-  (`npm`/`pnpm`/`yarn audit`, `cargo audit`, `pip-audit`, `dotnet list package
-  --vulnerable`, `govulncheck`; `gitleaks` opcional para el historial). Solo
-  dependencias de runtime donde la herramienta lo permite; FALLA desde severidad
-  alta o crítica y el resto se lista sin fallar; una herramienta que no publica
-  severidad se trata como alta. Sin la herramienta, con timeout, con un código de
-  salida inesperado o con una salida que no se entiende: NO VERIFICADO.
-- **Sondas de configuración** (puntos 37–43, sobre los ficheros versionados):
-  reglas de Firebase abiertas (`allow ... : if true`, `allow` sin condición,
-  modo de prueba por fecha, `".read": true`); tablas de `supabase/migrations/`
-  sin `enable row level security` en ninguna migración del conjunto;
-  credenciales literales en `.npmrc`, `.pypirc` y `settings.xml` de Maven
-  (`${NPM_TOKEN}`, `${env.X}` y las cifradas no cuentan); contraseñas y tokens
-  literales en `docker-compose*.yml`/`compose*.yaml` (`${X}` y `*_FILE` sí
-  valen); flujos con `pull_request_target` que traen el código del PR; acciones
-  de terceros sin fijar a un SHA de 40 caracteres (las de `actions/`, `github/`,
-  las locales y `docker://` no cuentan); y Dockerfile cuya etapa final corre
-  como root o con `ADD <url>` sin `--checksum`. Sin ficheros que revisar, el
-  punto sale NO APLICA con el motivo; un fichero ilegible o mayor que el límite
-  lo deja en NO VERIFICADO. Un token que ya da FALLA en `secretos-en-arbol` no
-  se cuenta otra vez en `tokens-en-ficheros-de-gestor`. Cada hallazgo se
-  silencia con `patron` + `fichero` + `huella` (en `pr-target-checkout`, una por
-  paso del flujo); `dockerfile-sin-user` es del fichero entero y se silencia sin
-  huella. Estas sondas miran cualquier `Dockerfile*`, `Containerfile` o
-  `compose*.yaml` versionado, aunque el tipo Docker no se detecte.
-- **Claves de ejemplo y públicas**: `AKIAIOSFODNN7EXAMPLE` y `sk_test_` no cuentan,
-  ni la clave `anon`/`publishable` de Supabase ni la `apiKey` `AIza...` de la
-  config web de Firebase; `service_role`, `sk_live_` y una clave privada sí. El
-  arreglo de un secreto que llegó a git es **rotar la clave primero** y reescribir
-  el historial después.
-- **El valor de un secreto nunca se muestra**: la evidencia lleva solo los 4
-  primeros caracteres y la longitud (`sk_l**** (32 caracteres)`), y todo lo que
-  sale (texto, JSON, informe) pasa además por una segunda red que enmascara
-  cualquier clave que se cuele.
-- **`--json`**: una sola línea de JSON, **versión 3** (`version`, `commit`,
-  `rama`, `arbolSucio`, `tipos`, `aplicaciones`, `avisos`, `puntos`, `veredictos`, `tareas`,
-  `resumen`, `codigo`). Cada punto lleva `origen`: `sonda` (lo decidió el
-  comando) o `agente` (un veredicto con juicio incorporado con `--resultado`).
-  `veredictos` y `tareas` son `null` si no se pidieron `--resultado` ni
-  `--crear-tareas`.
-- **`--escribir`**: guarda el informe en `docs/doctor-deploy/<fecha>.md` y, al
-  lado, el mismo informe en `<fecha>.json` (si ya hay uno de ese día,
-  `<fecha>-2`...; escritura atómica) con el commit, la rama, si el árbol estaba
-  sucio, los tipos detectados y la tabla de puntos. No commitea: lo commitea la
-  persona. Es un informe de uso interno sobre un commit concreto, no una
-  certificación. El `.json` es lo que lee `finish` de una release.
-
-### Puntos de juicio: `--resultado`
-
-Los puntos de juicio (RLS, autenticación en servidor, restringir accesos, mass
-assignment, consultas parametrizadas, validación de entradas, subidas de
-ficheros, cookies...) no se pueden medir con certeza. Los revisa un agente
-(`agents/revisor-seguridad-deploy.md`, solo lectura) lanzado por la skill
-`/taskcode-plugin:doctor-deploy`, que **cita fichero y línea o deja el punto
-NO VERIFICADO**. Los tipos de aplicación sin sondas propias (API, móvil, CLI,
-librería) los cubre el agente como juicio.
-
-`taskctl doctor-deploy --resultado <fichero.json>` **repite el análisis sobre
-HEAD** y mezcla los veredictos con una función pura. Formato del fichero, que
-vive **fuera del repositorio** (la carpeta temporal del sistema; dentro ensucia el
-árbol y el comando lo avisa):
-
-```json
-{ "commit": "<sha completo>",
-  "veredictos": [ { "punto": "auth-en-servidor", "estado": "ok", "fichero": "src/auth.ts", "linea": 42, "motivo": "Una frase." } ] }
-```
-
-Cada veredicto se **rechaza con su motivo** (sale en el informe y en los avisos) y
-el punto se queda como estaba, NO VERIFICADO, si:
-
-- su `commit` no es HEAD (cada veredicto lleva el commit sobre el que se juzgó;
-  vale el de la raíz si el veredicto no trae el suyo, y un prefijo de 7 o más
-  caracteres);
-- el punto es desconocido, no aplica o está desactivado, o es **determinista**:
-  el agente nunca pisa a una sonda;
-- `ok` o `falla` no traen `fichero` y `linea`: la evidencia es solo eso, sin
-  fragmentos de código (cualquier campo que no sea `punto`, `estado`, `commit`,
-  `fichero`, `linea` o `motivo` rechaza el veredicto);
-- el `fichero` es absoluto, lleva `..`, no está versionado en ese commit, es
-  binario, o la `linea` no existe (se comprueba contra el commit, no contra el
-  árbol de trabajo);
-- hay dos veredictos para el mismo punto (los dos se rechazan).
-
-El `motivo` se acota a 300 caracteres, sin saltos de línea y pasado por el
-enmascarado de secretos antes de guardarse (lo que se escribe en
-`docs/doctor-deploy/` no se puede des-subir). Un `no-verificado` del agente se
-acepta sin evidencia. El código de salida cuenta las FALLA que aporta el agente.
-
-### Una tarea por FALLA: `--crear-tareas`
-
-Crea una tarea por cada punto en FALLA (de una sonda o del agente), con ID del
-**rango reservado**: `TASK-9999`, `TASK-9998`... hacia abajo, para no chocar con
-las tareas normales. El objetivo es el arreglo del catálogo (más dónde falla,
-solo `fichero:linea`; el texto libre de un agente nunca se copia a una tarea) y
-el criterio, que `doctor-deploy` dé OK en ese punto. Usa las piezas de `new`: un
-solo `ensureBaseBranchReady` (exige el árbol limpio y **puede cambiar a la rama
-base**, como `new`; lo dice) y un solo commit para todas las tareas.
-
-- **Repetir no duplica**: cada tarea lleva la etiqueta `doctor-deploy:<id-punto>`;
-  un punto con una tarea **abierta** con esa etiqueta reutiliza la existente y lo
-  dice. Si ya estaba terminada y el punto vuelve a fallar, se crea otra. **Borrar
-  la etiqueta a mano rompe la deduplicación** de ese punto.
-- **Avisa, sin cerrar nada**, de las tareas abiertas cuyo punto ya da OK, ya no
-  aplica o ya no existe.
-- Con `--escribir`, las tareas se crean **antes** de escribir el informe (el
-  guard de rama base aborta con ficheros sin trackear).
-- Si no hay FALLA no toca la rama ni exige el árbol limpio.
-
-El siguiente ID reservado es el menor ocupado menos uno, mirando **tareas y
-ramas** (`feature/task-9999-*`): las ramas no se borran, así que un ID cuya
-carpeta se borró sigue ocupado. La numeración normal (`taskctl new`/`import`)
-ignora todo ID desde `TASK-9000` y aborta si llegara hasta ahí. Un compañero con
-una versión anterior del plugin crearía `TASK-10000` tras un `TASK-9999`:
-actualizad el plugin a la vez.
-
-### Aviso al cerrar una release
-
-`taskctl finish` de una tarea `release` **avisa, sin bloquear** (y nunca ejecuta
-las sondas; solo lee `docs/doctor-deploy/*.json`), si:
-
-- no hay un informe que valga: el informe más reciente cuyo `commit` es la punta
-  que se cierra, o un **ancestro** con solo `docs/doctor-deploy/` o `tareas/`
-  cambiados entre ambos (el informe se commitea después de generarse, así que su
-  commit nunca es la punta, y la revisión, los veredictos y los costes commitean en
-  `tareas/` sin tocar el código); o
-- ese informe tiene alguna FALLA de un punto de severidad `critica`.
-
-Cualquier fallo al leer (un informe ilegible, Git que no responde) se convierte en
-aviso. Como `finish` exige el árbol limpio, hay que commitear el informe antes de
-cerrar.
-
-`.taskcode/doctor-deploy.yml` (opcional) ajusta el catálogo del proyecto, con el
-mismo formato plano:
-
-```yaml
-# Desactivar un punto exige motivo (es una aceptación de riesgo). Sale NO APLICA.
-desactivar_1_id: lockfile-versionado
-desactivar_1_motivo: Es una librería: el lockfile no se versiona por convención
-
-# Añadir un punto propio: solo de juicio, o con una sonda ya registrada.
-punto_1_id: revisar-datos-personales
-punto_1_severidad: alta
-punto_1_tipos: [todos]
-punto_1_metodo: juicio
-punto_1_arreglo: Quita los datos personales de los logs
-punto_1_descripcion: Los logs no llevan datos personales de clientes
-
-# Silenciar UN hallazgo concreto (un secreto ya rotado, un falso positivo).
-# patron: el que informa el punto (stripe-live, aws-access-key, fichero-secreto...).
-# Un silencio es POR HALLAZGO: un hallazgo del historial se silencia con su commit
-# (silenciar_N_commit); uno del árbol, con la huella de su valor (silenciar_N_huella),
-# que sale en la evidencia ("huella ab12cd34ef56"). La huella es un SHA-256 sin sal: solo
-# es segura para claves de alta entropia (no permite recuperarlas). Para
-# url-con-credenciales no se muestra (usuario y host son conocidos y la contrasena puede ser
-# debil): esa se silencia solo en el historial, con commit; en el arbol hay que quitar la
-# credencial. Sin commit ni
-# huella aborta (taparía también claves nuevas del mismo fichero); la huella es opcional
-# con commit. Si commit o huella son solo dígitos, ponlos entre comillas.
-silenciar_1_patron: stripe-live
-silenciar_1_fichero: config/prod.env
-silenciar_1_commit: "ab12cd34"
-silenciar_1_huella: "ab12cd34ef56"
-silenciar_1_motivo: Clave rotada el 2026-10-01
-silenciar_1_quien: carlos
-silenciar_1_fecha: 2026-10-27
-```
-
-Un `id` desconocido en `desactivar_N_id` avisa y se ignora; un `id` repetido (con
-el catálogo del plugin o consigo mismo) aborta, igual que desactivar sin motivo.
-Un silencio que no coincide con ningún hallazgo avisa, y el hallazgo silenciado
-sigue apareciendo en la evidencia con su motivo, quién y cuándo, y cada punto de
-secretos dice «N hallazgos silenciados».
-
-Cobertura de los escaneos de claves: se leen todos los ficheros versionados (también
-los que están en `build`, `dist`, `vendor`, `target` o `node_modules`) y los sin
-versionar que no están ignorados fuera de esas carpetas; en el historial, todos los
-blobs, sea cual sea su ruta. Un fichero UTF-16 con BOM se decodifica; los binarios
-saltados se cuentan siempre. Un fichero de texto mayor de 1 MiB no se lee y deja el
-punto en NO VERIFICADO (un binario grande, no). Un `requirements.txt` solo cuenta
-como lockfile si fija todo con `==`, y una regla negada (`!.env`) en el `.gitignore`
-es FALLA. `.env` tiene que quedar ignorado en la raíz de cada proyecto detectado (en un
-monorepo, un `.gitignore` en el subdirectorio vale para su propio `.env`), y un módulo
-Go sin bloque `require` no necesita `go.sum`.
-
-Límites conocidos: si `git cat-file --batch` devolviera una salida truncada, el historial
-sale NO VERIFICADO (no se pudo provocar con Git real, así que esa rama no tiene test); un
-silencio solo con huella no tapa nunca un hallazgo del historial, y si el patrón y el
-fichero tienen uno el comando avisa de que exige `silenciar_N_commit`.
-
-`taskctl metricas [--heuristica]` (solo lectura) saca una fila por tarea
-con la duración de calendario de cada fase (diseño = plan→start, curso =
-start→primer review, revisión = primer review→finish), las rondas de
-revisión, el día de cierre y el origen del dato: la tabla `## Transiciones`
-del `tarea.md` (cuya columna `fecha` lleva el instante UTC al segundo desde
-la 0.5.0; las filas antiguas, solo el día, dan la duración en días), o, si
-la tarea no la tiene, los commits automáticos `chore(TASK-NNN): ...` con un
-único `git log`; si tampoco, «—». Las pausas se descuentan: cada `taskctl
-pausa` cuenta desde su fila hasta la siguiente transición que no sea otra
-pausa, y se resta de la fase (y del total) en la que cae. Una pausa sin
-transición detrás (tarea abierta) no descuenta, y con duraciones en días
-tampoco. Lo descontado sale, por tarea, en la lista `pausas` de `--json`
-(`enPausa`).
-`--heuristica` añade a las tareas terminadas con informes de revisión la
-puntuación y el nivel de la heurística de complejidad vigente, más un
-resumen de rondas medias por nivel declarado y heurístico: es la tabla con
-la que se calibra `scripts/heuristica-complejidad.yml`.
-
-`taskctl metricas --tokens` añade las columnas de coste en tokens por fase
-(`tok_diseno`, `tok_curso` = implementación, `tok_revision`, `tok_total`; «—»
-si no hay dato, que no es 0) y, debajo, un resumen por sprint y por
-complejidad declarada: tareas con dato / total, suma y media por fase y el %
-de cada fase sobre el total. Las tareas sin ningún dato salen en la tabla y no
-entran en el resumen. Se combina con `--heuristica` (el resumen es entonces
-sobre la muestra). `taskctl metricas --tokens --escribir` regenera en
-`docs/METRICAS.md` solo el bloque entre `<!-- taskctl metricas --tokens: inicio -->`
-y `<!-- taskctl metricas --tokens: fin -->` (si no están, los añade al final;
-el resto del fichero, CRLF incluido, no cambia ni un byte) y no lo commitea,
-como `board --escribir`. No se combina con `--heuristica`.
-
-**Columnas de la tabla por tarea.** `id`, `complejidad`, `diseno`, `curso`,
-`revision` (duraciones), `rondas` (número de la última ronda con informe; «—»
-sin revisión), `crit`, `imp`, `men` (hallazgos CRÍTICO, IMPORTANTE y MENOR de
-todos los informes `informe-revision-N[-<revisor>].md`, cada uno **una vez por
-tarea** con clave revisor + ID), `hall_origen` (implementación/plan/
-especificación/sin clasificar, de la columna `Origen`), `cierre` (día del último
-`finish`) y `origen` (`registro`, `git` o «—»). Un informe sin tabla de hallazgos
-deja `crit`/`imp`/`men`/`hall_origen` en «—»: sin dato, no cero. Con `--tokens`,
-además `tok_diseno`, `tok_curso`, `tok_revision`, `tok_total` y el desglose de
-`## Coste`: `tok_nuevos` (entrada + escritura de caché + salida),
-`tok_cache_lect` (lectura de caché, aparte) y `tok_sin_desglose`
-(`tokens_<fase>` menos lo desglosado; un negativo no se recorta a 0 y la celda
-lleva `*`). Con varios `--repo`, la tabla abre con la columna `proyecto`.
-
-Bajo la tabla: cuántos informes no tienen tabla de hallazgos, la mediana de
-lecturas por fase y las **terminadas sin coste** en alguna fase, con el recuento
-por fase y las 10 primeras («y N más»; la lista completa sale en `--json`).
-
-**Avisos** (por stderr, con `[AVISO]`; ninguno cambia el código de salida ni
-impide `--escribir`, salvo un `tarea.md` inválido): `tarea.md` inválido (la
-tarea no aparece), `git log` que no se pudo consultar, `tokens_<fase>` vacío con
-filas en `## Coste`, desglose mayor que el total, un agente repetido en una
-fase de `## Coste` (salvo las filas de diferencia de un agente reanudado, ver
-`registrar-coste`), una severidad fuera de vocabulario (con la tarea y el
-fichero) e informes sin tabla de hallazgos. Con varios repos, cada tarea se
-nombra `proyecto/TASK-NNN`.
-
-**Varios proyectos: `--repo <ruta>`** (repetible; relativa al directorio actual;
-por defecto, el repo actual). Junta varios repos con la clave (proyecto, id): un
-mismo `TASK-NNN` en dos repos no mezcla datos. El proyecto es el nombre de la
-carpeta. Antes de leer nada aborta si una ruta no existe, no tiene `tareas/`,
-`--repo` va sin valor o dos carpetas distintas se llaman igual; la misma carpeta
-escrita dos veces (otra grafía, otras mayúsculas en Windows) se lee una vez, con
-aviso. Por stderr sale `Repos leidos: <proyecto> (N tareas, <ruta>); ...`. Con un
-solo repo, stdout es el de siempre. `--repo` con `--escribir` aborta sin tocar
-nada.
-
-**`--evolucion [--tramo N]`** sustituye la tabla por la evolución de las tareas
-terminadas: ordenadas por día de cierre (solo el día; desempate por proyecto y
-por número de ID, `TASK-99` antes que `TASK-100`) y en tramos de N (20 por
-defecto; `--tramo` exige un entero de 1 o más). Por tramo: tareas, días de
-cierre, mediana de minutos de plan a finish (de las que tienen hora en las dos
-marcas; las de solo día se cuentan en «solo dia»), rondas medias, hallazgos
-IMPORTANTE por tarea, tokens de revisión medios y KB medios de la petición de
-revisión por ronda. Cada cifra lleva su `n` (las tareas que tienen ese dato);
-«— (n=0)» es que ninguna lo tiene. Dice cuántas terminadas quedan fuera por no
-tener fecha de cierre (por proyecto con varios repos). Al final de cada fila,
-el coste fijo por tarea frente al tamaño del proyecto: `cerradas` (tareas
-cerradas con fecha de cierre al acabar el tramo) y las medianas de minutos de punta a punta, de la
-fase de revisión y del propio `finish` (de las tareas con hora). Una línea
-final compara el primer tramo con el último (el último completo, si hay dos o
-más) y dice si ese coste **crece**, **baja** o **se mantiene** (cambio de
-menos del 15 %): si crece con las tareas cerradas, algún paso de cada tarea
-está pagando el tamaño del proyecto.
-
-**`--grupos`** sustituye la tabla por grupos de tareas terminadas: por tipo, por
-complejidad declarada, por número de criterios (0-4, 5-6, 7 o más), por KB de
-petición de revisión por ronda (terciles calculados con todos los proyectos
-juntos, cortados por valor; las tareas sin petición quedan fuera y se cuentan) y
-por proyecto. Por grupo: tareas, con revisión, % aprobado a la primera (una sola
-ronda con veredicto `aprobada` o `aprobada-con-correcciones`, sobre las que
-tienen revisión), rondas medias, CRÍTICO+IMPORTANTE por tarea (de las que tienen
-tabla de hallazgos) y, aparte, las tareas sin revisión y las revisadas sin tabla
-de hallazgos. Los grupos son fijos: uno sin tareas sale con 0 y «—».
-`--evolucion` y `--grupos` se combinan entre sí y con `--repo`, no con
-`--heuristica`, `--tokens` ni `--escribir`.
-
-**`--por-version`** (desde la 0.12.0) agrupa las tareas terminadas por la
-versión de `taskctl` con la que se cerraron: la de la columna `version` de la
-última fila `finish` de `## Transiciones` (un `finish` abortado y reintentado
-con otro plugin deja dos; cuenta el último). Por versión, en orden semver
-(0.9 antes que 0.10; una pre-release como `0.12.0-dev` antes de su release):
-tareas, con revisión, % aprobado a la primera, rondas medias, tokens medios por
-fase (con su `n`) y una segunda tabla con los hallazgos por severidad y por
-origen (de las tareas con tabla de hallazgos). Las tareas sin versión anotada
-(cerradas antes de la 0.12.0, medidas con los commits o con la celda editada a
-mano) van a un grupo «sin version» aparte: la versión **nunca se deduce por la
-fecha de cierre**. Se combina como `--evolucion` y `--grupos`.
-
-**La columna `version` de `## Transiciones`.** Desde la 0.12.0 cada transición
-anota la versión de `taskctl` que la escribió, como quinta columna. Las filas
-anteriores, de cuatro columnas, se siguen leyendo igual (y siguen congelando el
-modo). La primera fila con versión que se añade bajo una cabecera de cuatro
-columnas cambia **solo la cabecera y su separador** a cinco, para que la
-versión se vea en GitHub y GitLab; las filas viejas no se tocan. Un `taskctl`
-anterior a la 0.12.0 no reconoce las filas de cinco columnas y deja de ver el
-modo congelado de esa tarea: **usa la misma versión del plugin en todo el
-repo**. Para que la versión anotada sea útil, se sube al **abrir** el ciclo de
-una versión nueva (la primera tarea que la construye), no al publicarla.
-
-**`--json`** escribe en stdout un único objeto JSON
-(`{proyectos: [{proyecto, ruta, tareas}], sinCoste: {terminadas, total, porFase,
-tareas}, evolucion?, grupos?, porVersion?}`), también sin tareas; los avisos y la lista de
-repos van por stderr. Cada `null` va junto a un `n: 0` en el mismo objeto; nunca
-`NaN`. `porVersion` es `{terminadas, versiones: [...], sinVersion}`, con cada grupo
-en la forma `{version, n, conRevision, aprobadasPrimera, pctAprobadaPrimera,
-rondasMedia, sinRevision, conHallazgos, sinTablaHallazgos, hallazgosPorSeveridad,
-hallazgosPorOrigen, tokens: {diseno, implementacion, revision}}` (cada fase
-`{suma, conDato, media}`). Solo se combina con `--repo`, `--evolucion`, `--tramo`,
-`--grupos` y `--por-version`: con
-cualquier otro flag aborta sin leer ni escribir nada.
-
-En cualquier comando de `taskctl`, un flag repetido que no admite repetición
-(todos salvo `--repo`, `--agente` y `--criterio`) aborta con error en vez de
-quedarse con el último valor.
-
-`taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision
-(--agente <id>... | --tokens N) [--push]` **suma** al coste de esa fase
-(`tokens_diseno`, `tokens_implementacion`, `tokens_revision` del `tarea.md`;
-`null` = sin registrar y solo cuenta como 0 al sumar). `taskctl` no ve el
-consumo del agente, así que lo registra quien lo ve. **La cifra que Claude Code
-muestra al terminar un subagente no es lo que ha gastado: es el tamaño de su
-contexto final.** Con `--agente <id>` (repetible; el `agentId` que devuelve la
-herramienta Agent) `taskctl` lee la transcripción del subagente en
-`<config>/projects/*/*/subagents/agent-<id>.jsonl` (`<config>` = `CLAUDE_CONFIG_DIR`
-o `~/.claude`) y suma, por `message.id` único (la última aparición), entrada +
-escritura y lectura de caché + salida de cada llamada. Varios `--agente` van en
-un solo registro y un solo commit. Un `--agente` ya anotado en `## Coste` de esa
-fase es un agente reanudado (su transcripción acumula los dos trabajos): se suma
-solo lo que creció su transcripción desde lo ya anotado para ese id, y la fila lo
-marca en su fuente (`agente:dif:<id>`), que `metricas` no avisa como repetida; si
-no ha crecido, o el id está anotado junto a otros en una misma fila, aborta.
-En `--fase revision` cada `--agente` va en **su propia fila** (en el mismo
-commit), con las columnas `ronda` y `revisor` que se deducen de su
-transcripción. Se sacan del nombre `peticion-revision-N[-skill].md` que lleva
-el prompt del revisor. Lo que no se puede deducir queda como `-` («sin
-atribuir»). Con un único `--agente`, `--ronda N [--revisor <skill>]` los
-declara a mano; el revisor se valida contra las peticiones de `revision/`.
-Las filas antiguas de 9 columnas se siguen leyendo. `metricas --tokens` las
-resume, por ronda y revisor, en un bloque aparte, también en `--json`: las
-lecturas, los tokens de entrada y caché, y los CRÍTICO e IMPORTANTE de su informe.
-`--tokens N` da una cifra a mano (la parte del
-orquestador, estimada) y se excluye con `--agente`. Si el id no se encuentra, está
-en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué hacer
-(`--tokens N` como salida). Funciona en cualquier estado, también `terminada`;
-escribe y commitea solo ese `tarea.md` (aborta si tiene cambios sin commitear o si
-la copia al día de la tarea está en su rama) y rechaza cifras de 0. `taskctl finish`
-avisa, sin bloquear, si falta el coste de diseño o de revisión. El de
-implementación ya no hace falta registrarlo a mano: lo suma `review` (ver
-«Coste de implementación automático»); `registrar-coste --fase implementacion`
-queda como respaldo.
-
-`taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push]` cierra la
-tarea. Sin los flags nuevos hace lo de siempre: merge `--no-ff` con el script de
-Git-Flow del tipo y tarea a `terminada`.
-
-- `--tag <nombre>` pone un tag **anotado** (mensaje = título de la tarea) sobre
-  el commit de merge, que se calcula de forma explícita y no es `HEAD` (tras el
-  merge hay un commit de cierre encima). El nombre se valida **antes** de
-  mergear: `git check-ref-format "refs/tags/<nombre>"`, sin `-` inicial, y que no
-  exista en local ni en `origin` (con origin caído y `--push`, aborta; sin
-  `--push`, avisa). En un reintento (el merge ya está hecho) un tag que apunta
-  al merge de esa tarea se salta y uno ajeno aborta. **Solo se sube con
-  `--push`**, y solo si la rama destino ya está en origin con ese commit; sin
-  `--push` la salida dice que el tag quedó solo en local. En hotfix y release
-  `--tag` pasa a `merge-hotfix-to-main.sh` / `merge-release-to-main.sh`, que
-  aceptan `--tag <nombre>` y lo usan en lugar del calculado: sigue habiendo un
-  solo tag. `finish --push` no sube `main` (se avisa), así que en un hotfix el
-  tag solo se sube si `main` ya estaba en origin con el merge.
-- `--merge-request` (solo feature y fix) **no mergea**: sube la rama (siempre,
-  aunque no pases `--push`: sin ella no hay merge request, y la salida lo dice),
-  abre un pull request (`origin` en `github.com`, con `gh`) o un merge request
-  (host que contiene «gitlab», con `glab`) contra la rama
-  base, anota su URL en una sección `## Merge request` de `tarea.md`, la
-  commitea en la rama de la tarea y la deja en `en-revision`. Un host de origin
-  desconocido **aborta** nombrando qué configurar: no se supone GitLab (un
-  GitLab propio se declara en el config, ver «GitLab propio» abajo). Antes
-  de subir nada se comprueba que hay `origin`, que el CLI está instalado y que
-  tiene sesión (`gh auth status` / `glab auth status`; con la plataforma
-  declarada en el config, `glab api user`); cada fallo dice qué
-  instalar o configurar. Antes de crear se busca un PR/MR abierto de esa rama
-  para no duplicarlo. La URL de `origin` (puede llevar credenciales) no se
-  imprime ni se escribe en ningún sitio.
-- **Segundo `finish`** (`taskctl finish TASK-NNN --merge-request [--tag <n>]`;
-  el flag es opcional si `tarea.md` ya tiene la sección `## Merge request`):
-  pregunta a la plataforma por el estado del PR/MR **por nombre de rama**. Si
-  está `merged` (con merge, squash o rebase: no se exige ancestría) hace
-  `fetch`, comprueba que el commit resultante está en `origin/<base>`, avanza la
-  base local con fast-forward, mueve la tarea a `terminada` y regenera
-  CHANGELOG, INDEX y BOARD; con `--tag`, el tag va sobre el commit que la
-  plataforma da como resultado del merge. Si sigue abierto, o se cerró sin
-  mergear, o no se puede saber (red, error del CLI), aborta sin tocar nada.
-- `.taskcode/config.yml` admite `cierre_por_defecto: merge | merge-request`
-  (por defecto `merge`). `taskctl finish` **no** la lee: la usa la skill
-  `finish` en modo automático, que no pregunta, a través de `taskctl siguiente
-  --json` (campo `cierre`). En manual y semiautomático la skill pregunta.
-  Un valor mal escrito aborta. Una clave que el plugin no conoce **avisa** por
-  stderr y se ignora (desde la 0.7.0; las versiones anteriores abortaban).
-
-#### GitLab propio (autoalojado, con dominio propio o bajo una ruta)
-
-Sin configuración, `--merge-request` reconoce `github.com` y los hosts que
-contienen «gitlab». Para cualquier otra instancia de GitLab se declara en
-`.taskcode/config.yml` (claves leídas desde la 0.7.0):
-
-```yaml
-plataforma_remota: gitlab
-url_base_remoto: https://git.empresa.com            # opcional
-# url_base_remoto: https://servidor.example/ruta/gitlab   # si la instancia cuelga de una ruta
-```
-
-- `plataforma_remota`: `github` o `gitlab`. Sola con `gitlab`, la base es
-  `https://<host de origin>` (vale para un GitLab con dominio propio en la raíz
-  del host).
-- `url_base_remoto` (solo con `gitlab`): la URL **https** de la instancia, con su
-  ruta si la tiene, sin usuario ni contraseña. Lo que queda de `origin` tras la
-  base es el proyecto (`grupo/subgrupo/repo`), que se pasa a `glab` con `-R`.
-  Con **https**, la base tiene que ser **prefijo exacto** de la URL de `origin`
-  (host, puerto y ruta, sin barra final). Con **ssh o scp** solo se exige el
-  mismo host (el puerto no se compara): GitLab con ruta de instancia sirve ssh
-  sin ella (`git@servidor.example:grupo/repo.git`), así que si la ruta de
-  `origin` empieza por la de la base se quita
-  (`git@servidor.example:ruta/gitlab/grupo/repo.git` -> `grupo/repo`) y si no,
-  la ruta entera es el proyecto. Si no encaja, o si hay `@` (credenciales), no
-  es https o hay una URL sin plataforma, `taskctl` aborta antes de subir nada
-  con un mensaje que nombra la clave.
-- Sesión: `glab auth login --hostname git.empresa.com` (con ruta:
-  `--hostname servidor.example/ruta/gitlab`), o la variable de entorno
-  `GITLAB_TOKEN`. La sesión se comprueba con `glab api user`. El token no se
-  imprime ni se escribe. `glab` solo habla https con la instancia; un
-  certificado propio se resuelve en el sistema o en la configuración de `glab`.
-- Con la plataforma declarada el merge request se crea con la API
-  (`glab api projects/<proyecto>/merge_requests`), no con `glab mr create`:
-  este último exige que un remoto de Git corresponda a `GITLAB_HOST` y con una
-  instancia bajo una ruta falla siempre. Con origin `http://host:puerto` hay
-  que declarar `url_base_remoto` (glab solo habla https).
-- Con la plataforma declarada, cada llamada a `glab` lleva `GITLAB_HOST` fijado
-  a la base y se ignoran los `GITLAB_HOST`, `GL_HOST`, `GITLAB_URI` y
-  `GITLAB_API_HOST` del entorno, para que un host heredado no abra el merge
-  request en otro servidor.
-- El config se lee del árbol en el que se ejecuta `finish`: tiene que estar
-  **commiteado en la rama de la tarea y en la rama base** (el segundo `finish`
-  puede ejecutarse desde la base).
+| `new`, `import` | Dar de alta una tarea, a mano o desde un fichero. |
+| `plan`, `approve`, `trocear` | Diseño (brainstorm de roles y plan), aprobación del plan y troceo de una tarea de más de una hora. |
+| `start` | Abrir la rama de la tarea con el plan aprobado. |
+| `review`, `codex-review`, `veredicto` | Revisión por pares por rondas y su veredicto. |
+| `finish` | Cierre: verificación, merge `--no-ff` o merge request, tag opcional. |
+| `siguiente`, `pausa`, `cadena` | Qué fase toca y si preguntar (según `modo_flujo`); pausar el paso a la siguiente fase; bloquear el árbol mientras las fases se encadenan. |
+| `estado`, `board`, `roadmap` | En qué va la fase en curso (también en la status line), tablero y `tareas/ROADMAP.md`. |
+| `doctor`, `doctor-deploy` | Que el proyecto está listo para el flujo; que la aplicación está lista para publicarse. |
+| `metricas`, `registrar-coste` | Duración, rondas, hallazgos y coste en tokens por fase. |
+| `diagnose`, `pause`, `resume`, `recover`, `abort-merge` | Envoltorios de los scripts de Git-Flow. |
+
+El detalle de cada uno está en los documentos de `docs/` que enlaza el índice.
+
+## Documentación
+
+La referencia detallada vive en `docs/`, un fichero por tema:
+
+- [Instalación y distribución](docs/instalacion-y-distribucion.md)
+  - [Cómo se distribuye: por qué `dist/src/` está versionado](docs/instalacion-y-distribucion.md#cómo-se-distribuye-por-qué-distsrc-está-versionado)
+    - [Limitación conocida: `bin/` y las organization settings de claude.ai](docs/instalacion-y-distribucion.md#limitación-conocida-bin-y-las-organization-settings-de-claudeai)
+  - [Usar `taskctl` fuera de Claude Code (PowerShell, cmd, Git Bash)](docs/instalacion-y-distribucion.md#usar-taskctl-fuera-de-claude-code-powershell-cmd-git-bash)
+  - [`taskctl` en el PATH del Bash tool](docs/instalacion-y-distribucion.md#taskctl-en-el-path-del-bash-tool)
+    - [Bug encontrado y corregido en TASK-006](docs/instalacion-y-distribucion.md#bug-encontrado-y-corregido-en-task-006)
+    - [`commands` en `plugin.json`: campo con forma inválida, eliminado — corrección tras revisión por pares](docs/instalacion-y-distribucion.md#commands-en-pluginjson-campo-con-forma-inválida-eliminado--corrección-tras-revisión-por-pares)
+    - [Evidencia recogida en esta sesión](docs/instalacion-y-distribucion.md#evidencia-recogida-en-esta-sesión)
+    - [Smoke test en un clon aislado](docs/instalacion-y-distribucion.md#smoke-test-en-un-clon-aislado)
+    - [Lo que NO se ha podido verificar en esta sesión (limitación de entorno)](docs/instalacion-y-distribucion.md#lo-que-no-se-ha-podido-verificar-en-esta-sesión-limitación-de-entorno)
+    - [RESUELTO (2026-09-05): el CI de Windows nativo contestó las preguntas](docs/instalacion-y-distribucion.md#resuelto-2026-09-05-el-ci-de-windows-nativo-contestó-las-preguntas)
+    - [RESUELTO (2026-09-07, TASK-031): el `/plugin install` real, por fin ejecutado](docs/instalacion-y-distribucion.md#resuelto-2026-09-07-task-031-el-plugin-install-real-por-fin-ejecutado)
+    - [Segunda limitación, específica de este repo: `core.fileMode=false`](docs/instalacion-y-distribucion.md#segunda-limitación-específica-de-este-repo-corefilemodefalse)
+- [Configuración, verificación y hooks](docs/configuracion.md)
+    - [Cómo se verifica el proyecto: `comando_verificacion`](docs/configuracion.md#cómo-se-verifica-el-proyecto-comando_verificacion)
+    - [Verificación selectiva por impacto: `comando_verificacion_selectiva`](docs/configuracion.md#verificación-selectiva-por-impacto-comando_verificacion_selectiva)
+    - [Tareas de solo documentación: `rutas_documentacion`](docs/configuracion.md#tareas-de-solo-documentación-rutas_documentacion)
+    - [Código parcial: `rutas_verificacion_parcial`](docs/configuracion.md#código-parcial-rutas_verificacion_parcial)
+    - [Freno de fin de turno (hook `Stop`)](docs/configuracion.md#freno-de-fin-de-turno-hook-stop)
+    - [Coste de implementación automático (hooks `Stop` y `SubagentStop`)](docs/configuracion.md#coste-de-implementación-automático-hooks-stop-y-subagentstop)
+    - [Puerta de verificación en `finish`](docs/configuracion.md#puerta-de-verificación-en-finish)
+    - [Tests held-out (`aceptacion/`)](docs/configuracion.md#tests-held-out-aceptacion)
+    - [Cobertura de las líneas cambiadas](docs/configuracion.md#cobertura-de-las-líneas-cambiadas)
+    - [Guardián de merges (hook `PreToolUse`)](docs/configuracion.md#guardián-de-merges-hook-pretooluse)
+    - [Documento de estado vigilado por `doctor`: `documento_estado`](docs/configuracion.md#documento-de-estado-vigilado-por-doctor-documento_estado)
+  - [Sincronización de ficheros derivados](docs/configuracion.md#sincronización-de-ficheros-derivados)
+  - [ROADMAP de tareas (`tareas/ROADMAP.md`)](docs/configuracion.md#roadmap-de-tareas-tareasroadmapmd)
+- [Cierre y release](docs/cierre-y-release.md)
+  - [`taskctl finish`](docs/cierre-y-release.md#taskctl-finish)
+    - [GitLab propio (autoalojado, con dominio propio o bajo una ruta)](docs/cierre-y-release.md#gitlab-propio-autoalojado-con-dominio-propio-o-bajo-una-ruta)
+  - [`taskctl doctor-deploy`](docs/cierre-y-release.md#taskctl-doctor-deploy)
+    - [Puntos de juicio: `--resultado`](docs/cierre-y-release.md#puntos-de-juicio---resultado)
+    - [Una tarea por FALLA: `--crear-tareas`](docs/cierre-y-release.md#una-tarea-por-falla---crear-tareas)
+    - [Aviso al cerrar una release](docs/cierre-y-release.md#aviso-al-cerrar-una-release)
+- [Comandos en detalle](docs/comandos.md)
+  - [Comandos disponibles](docs/comandos.md#comandos-disponibles)
+    - [Progreso visible: `taskctl estado`, la status line y `TASKCTL_PROGRESO`](docs/comandos.md#progreso-visible-taskctl-estado-la-status-line-y-taskctl_progreso)
+  - [`taskctl metricas`](docs/comandos.md#taskctl-metricas)
+  - [`taskctl registrar-coste`](docs/comandos.md#taskctl-registrar-coste)
+- [Problemas conocidos y puntos abiertos](docs/problemas-conocidos.md)
+  - [Problemas conocidos](docs/problemas-conocidos.md#problemas-conocidos)
+    - [Un subagente se deniega con «Auto-Mode Bypass»](docs/problemas-conocidos.md#un-subagente-se-deniega-con-auto-mode-bypass)
+  - [Mecanismo determinista de sección 14 (punto 11): sigue sin confirmarse](docs/problemas-conocidos.md#mecanismo-determinista-de-sección-14-punto-11-sigue-sin-confirmarse)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/cierre-y-release.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/cierre-y-release.md
new file mode 100644
index 0000000..578937e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/cierre-y-release.md
@@ -0,0 +1,344 @@
+# Cierre y release: `finish` y `doctor-deploy`
+
+El cierre de una tarea (merge normal o merge request, GitLab propio) y la
+comprobación previa a publicar una aplicación. Volver al [README del plugin](../README.md).
+
+## `taskctl finish`
+
+`taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push]` cierra la
+tarea. Sin los flags nuevos hace lo de siempre: merge `--no-ff` con el script de
+Git-Flow del tipo y tarea a `terminada`.
+
+- `--tag <nombre>` pone un tag **anotado** (mensaje = título de la tarea) sobre
+  el commit de merge, que se calcula de forma explícita y no es `HEAD` (tras el
+  merge hay un commit de cierre encima). El nombre se valida **antes** de
+  mergear: `git check-ref-format "refs/tags/<nombre>"`, sin `-` inicial, y que no
+  exista en local ni en `origin` (con origin caído y `--push`, aborta; sin
+  `--push`, avisa). En un reintento (el merge ya está hecho) un tag que apunta
+  al merge de esa tarea se salta y uno ajeno aborta. **Solo se sube con
+  `--push`**, y solo si la rama destino ya está en origin con ese commit; sin
+  `--push` la salida dice que el tag quedó solo en local. En hotfix y release
+  `--tag` pasa a `merge-hotfix-to-main.sh` / `merge-release-to-main.sh`, que
+  aceptan `--tag <nombre>` y lo usan en lugar del calculado: sigue habiendo un
+  solo tag. `finish --push` no sube `main` (se avisa), así que en un hotfix el
+  tag solo se sube si `main` ya estaba en origin con el merge.
+- `--merge-request` (solo feature y fix) **no mergea**: sube la rama (siempre,
+  aunque no pases `--push`: sin ella no hay merge request, y la salida lo dice),
+  abre un pull request (`origin` en `github.com`, con `gh`) o un merge request
+  (host que contiene «gitlab», con `glab`) contra la rama
+  base, anota su URL en una sección `## Merge request` de `tarea.md`, la
+  commitea en la rama de la tarea y la deja en `en-revision`. Un host de origin
+  desconocido **aborta** nombrando qué configurar: no se supone GitLab (un
+  GitLab propio se declara en el config, ver «GitLab propio» abajo). Antes
+  de subir nada se comprueba que hay `origin`, que el CLI está instalado y que
+  tiene sesión (`gh auth status` / `glab auth status`; con la plataforma
+  declarada en el config, `glab api user`); cada fallo dice qué
+  instalar o configurar. Antes de crear se busca un PR/MR abierto de esa rama
+  para no duplicarlo. La URL de `origin` (puede llevar credenciales) no se
+  imprime ni se escribe en ningún sitio.
+- **Segundo `finish`** (`taskctl finish TASK-NNN --merge-request [--tag <n>]`;
+  el flag es opcional si `tarea.md` ya tiene la sección `## Merge request`):
+  pregunta a la plataforma por el estado del PR/MR **por nombre de rama**. Si
+  está `merged` (con merge, squash o rebase: no se exige ancestría) hace
+  `fetch`, comprueba que el commit resultante está en `origin/<base>`, avanza la
+  base local con fast-forward, mueve la tarea a `terminada` y regenera
+  CHANGELOG, INDEX y BOARD; con `--tag`, el tag va sobre el commit que la
+  plataforma da como resultado del merge. Si sigue abierto, o se cerró sin
+  mergear, o no se puede saber (red, error del CLI), aborta sin tocar nada.
+- `.taskcode/config.yml` admite `cierre_por_defecto: merge | merge-request`
+  (por defecto `merge`). `taskctl finish` **no** la lee: la usa la skill
+  `finish` en modo automático, que no pregunta, a través de `taskctl siguiente
+  --json` (campo `cierre`). En manual y semiautomático la skill pregunta.
+  Un valor mal escrito aborta. Una clave que el plugin no conoce **avisa** por
+  stderr y se ignora (desde la 0.7.0; las versiones anteriores abortaban).
+
+#### GitLab propio (autoalojado, con dominio propio o bajo una ruta)
+
+Sin configuración, `--merge-request` reconoce `github.com` y los hosts que
+contienen «gitlab». Para cualquier otra instancia de GitLab se declara en
+`.taskcode/config.yml` (claves leídas desde la 0.7.0):
+
+```yaml
+plataforma_remota: gitlab
+url_base_remoto: https://git.empresa.com            # opcional
+# url_base_remoto: https://servidor.example/ruta/gitlab   # si la instancia cuelga de una ruta
+```
+
+- `plataforma_remota`: `github` o `gitlab`. Sola con `gitlab`, la base es
+  `https://<host de origin>` (vale para un GitLab con dominio propio en la raíz
+  del host).
+- `url_base_remoto` (solo con `gitlab`): la URL **https** de la instancia, con su
+  ruta si la tiene, sin usuario ni contraseña. Lo que queda de `origin` tras la
+  base es el proyecto (`grupo/subgrupo/repo`), que se pasa a `glab` con `-R`.
+  Con **https**, la base tiene que ser **prefijo exacto** de la URL de `origin`
+  (host, puerto y ruta, sin barra final). Con **ssh o scp** solo se exige el
+  mismo host (el puerto no se compara): GitLab con ruta de instancia sirve ssh
+  sin ella (`git@servidor.example:grupo/repo.git`), así que si la ruta de
+  `origin` empieza por la de la base se quita
+  (`git@servidor.example:ruta/gitlab/grupo/repo.git` -> `grupo/repo`) y si no,
+  la ruta entera es el proyecto. Si no encaja, o si hay `@` (credenciales), no
+  es https o hay una URL sin plataforma, `taskctl` aborta antes de subir nada
+  con un mensaje que nombra la clave.
+- Sesión: `glab auth login --hostname git.empresa.com` (con ruta:
+  `--hostname servidor.example/ruta/gitlab`), o la variable de entorno
+  `GITLAB_TOKEN`. La sesión se comprueba con `glab api user`. El token no se
+  imprime ni se escribe. `glab` solo habla https con la instancia; un
+  certificado propio se resuelve en el sistema o en la configuración de `glab`.
+- Con la plataforma declarada el merge request se crea con la API
+  (`glab api projects/<proyecto>/merge_requests`), no con `glab mr create`:
+  este último exige que un remoto de Git corresponda a `GITLAB_HOST` y con una
+  instancia bajo una ruta falla siempre. Con origin `http://host:puerto` hay
+  que declarar `url_base_remoto` (glab solo habla https).
+- Con la plataforma declarada, cada llamada a `glab` lleva `GITLAB_HOST` fijado
+  a la base y se ignoran los `GITLAB_HOST`, `GL_HOST`, `GITLAB_URI` y
+  `GITLAB_API_HOST` del entorno, para que un host heredado no abra el merge
+  request en otro servidor.
+- El config se lee del árbol en el que se ejecuta `finish`: tiene que estar
+  **commiteado en la rama de la tarea y en la rama base** (el segundo `finish`
+  puede ejecutarse desde la base).
+
+## `taskctl doctor-deploy`
+
+`taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas]`
+es otro comando, distinto de `doctor`: aquel comprueba que el proyecto está listo
+para trabajar con el flujo de tareas; este, que **la aplicación está lista para
+publicarse** sin agujeros conocidos (claves expuestas, secretos en git, RLS,
+cookies, HTTPS, dependencias vulnerables...). Sin `--crear-tareas` solo lee. La
+skill `/taskcode-plugin:doctor-deploy` lo encadena con un agente revisor para los
+puntos de juicio (ver «Puntos de juicio» más abajo).
+
+- **Tipo de aplicación**: lo detecta por ficheros marcadores (Node con npm,
+  pnpm o yarn, Rust, Python, Java con Maven o Gradle, .NET, Go, PHP, Ruby, Docker
+  y frontend web), hasta tres carpetas de profundidad y sin mirar `node_modules`,
+  `vendor`, `target`, `dist` ni `build`, y lo muestra. Los tipos y sus marcadores
+  son datos del catálogo (`tipo_N_*`): añadir uno no toca código. Si no detecta
+  ninguno, lo dice (los puntos que dependen de un tipo salen NO APLICA).
+- **Clase de aplicación** (segundo eje, independiente del lenguaje): web, api,
+  android, ios, flutter, react-native, cli o libreria, con los marcadores de la
+  familia `aplicacion_N_*` del catálogo (`id`, `nombre`, `marcadores` y,
+  opcional, `contiene`: textos que debe contener el fichero marcador; un
+  `package.json` es `cli` si contiene `"bin"`). Sale como «Aplicacion
+  detectada», con el fichero que la decidió. Además de los frameworks, cuentan
+  como api las señales de servicio que no dependen de él: `EXPOSE` en un
+  Dockerfile, `ports:` en un compose o `web:` en un Procfile; una CLI que además
+  sirve HTTP sale cli y api, y los puntos aplican. Un punto puede declarar
+  `punto_N_aplicaciones: [web, api, ...]`: se combina con `punto_N_tipos` con
+  Y, y dentro de cada lista basta con uno. **Si no se detecta ninguna clase, el
+  punto aplica**; solo sale NO APLICA si se detecta alguna y ninguna está en la
+  lista, con el tipo y el marcador en el motivo. Hoy eso apaga los puntos de
+  servicio desplegado (https-obligatorio, cookies-seguras, security-headers,
+  rate-limits, backups-y-migraciones, health-check, proteccion-de-bots,
+  limitar-respuestas-api, cors-restringido y proteccion-csrf) en una CLI o una
+  librería sin marcadores de web ni de api. Un id desconocido o del eje
+  equivocado aborta, también en `.taskcode/doctor-deploy.yml`.
+- **Catálogo**: `scripts/doctor-deploy.yml` (formato plano `punto_N_*`, con
+  `total_puntos`). 43 puntos: los 20 pedidos, los medibles que faltaban y los de
+  dominio. Cada uno tiene `id`, `severidad`, `tipos`, `metodo` (`determinista` o
+  `juicio`), `sonda` (solo los deterministas), `arreglo`, `descripcion` y
+  `referencia` opcional, con la categoría del OWASP Top 10 2025 y el capítulo
+  del ASVS 5.0 que lo cubren (`OWASP Top 10 2025 Axx; ASVS 5.0 Vnn`);
+  licencias-de-dependencias no la lleva porque ninguno de los dos trata
+  licencias.
+- **Cuatro estados**: `OK` (con evidencia: nunca OK sin ella), `FALLA` (con
+  evidencia —fichero y línea, o commit— y el arreglo del catálogo), `NO VERIFICADO`
+  (diciendo qué falta: una herramienta, o la revisión con juicio) y `NO APLICA`
+  (con el motivo). Sale con **0 sin FALLA y 1 con alguna**. Un NO VERIFICADO no
+  cambia el código de salida, pero el resumen dice «N de M sin verificar»: salir
+  con 0 no significa «listo para publicar».
+- **Qué comprueba de forma determinista** (trece sondas; todo lo demás
+  es de juicio y sale NO VERIFICADO hasta que se revise con criterio):
+  secretos en el árbol; secretos en **todo el historial** de git (todas las
+  ramas, etiquetas y refs; un clon superficial, un desbordamiento de límites o un
+  corte dan NO VERIFICADO, nunca OK); ficheros de secretos versionados (`.env`,
+  claves privadas, credenciales; `.env.example` y `.env.sample` no cuentan); que
+  el `.gitignore` cubre `.env` (en **cada** carpeta de proyecto: en un monorepo
+  con más de 10 se comprueban todas, hasta un tope de 200; pasado el tope el
+  punto sale NO VERIFICADO diciendo cuántas faltan, nunca OK); lockfile versionado; y la auditoría de
+  dependencias con la herramienta del ecosistema **si está instalada**
+  (`npm`/`pnpm`/`yarn audit`, `cargo audit`, `pip-audit`, `dotnet list package
+  --vulnerable`, `govulncheck`; `gitleaks` opcional para el historial). Solo
+  dependencias de runtime donde la herramienta lo permite; FALLA desde severidad
+  alta o crítica y el resto se lista sin fallar; una herramienta que no publica
+  severidad se trata como alta. Sin la herramienta, con timeout, con un código de
+  salida inesperado o con una salida que no se entiende: NO VERIFICADO.
+- **Sondas de configuración** (puntos 37–43, sobre los ficheros versionados):
+  reglas de Firebase abiertas (`allow ... : if true`, `allow` sin condición,
+  modo de prueba por fecha, `".read": true`); tablas de `supabase/migrations/`
+  sin `enable row level security` en ninguna migración del conjunto;
+  credenciales literales en `.npmrc`, `.pypirc` y `settings.xml` de Maven
+  (`${NPM_TOKEN}`, `${env.X}` y las cifradas no cuentan); contraseñas y tokens
+  literales en `docker-compose*.yml`/`compose*.yaml` (`${X}` y `*_FILE` sí
+  valen); flujos con `pull_request_target` que traen el código del PR; acciones
+  de terceros sin fijar a un SHA de 40 caracteres (las de `actions/`, `github/`,
+  las locales y `docker://` no cuentan); y Dockerfile cuya etapa final corre
+  como root o con `ADD <url>` sin `--checksum`. Sin ficheros que revisar, el
+  punto sale NO APLICA con el motivo; un fichero ilegible o mayor que el límite
+  lo deja en NO VERIFICADO. Un token que ya da FALLA en `secretos-en-arbol` no
+  se cuenta otra vez en `tokens-en-ficheros-de-gestor`. Cada hallazgo se
+  silencia con `patron` + `fichero` + `huella` (en `pr-target-checkout`, una por
+  paso del flujo); `dockerfile-sin-user` es del fichero entero y se silencia sin
+  huella. Estas sondas miran cualquier `Dockerfile*`, `Containerfile` o
+  `compose*.yaml` versionado, aunque el tipo Docker no se detecte.
+- **Claves de ejemplo y públicas**: `AKIAIOSFODNN7EXAMPLE` y `sk_test_` no cuentan,
+  ni la clave `anon`/`publishable` de Supabase ni la `apiKey` `AIza...` de la
+  config web de Firebase; `service_role`, `sk_live_` y una clave privada sí. El
+  arreglo de un secreto que llegó a git es **rotar la clave primero** y reescribir
+  el historial después.
+- **El valor de un secreto nunca se muestra**: la evidencia lleva solo los 4
+  primeros caracteres y la longitud (`sk_l**** (32 caracteres)`), y todo lo que
+  sale (texto, JSON, informe) pasa además por una segunda red que enmascara
+  cualquier clave que se cuele.
+- **`--json`**: una sola línea de JSON, **versión 3** (`version`, `commit`,
+  `rama`, `arbolSucio`, `tipos`, `aplicaciones`, `avisos`, `puntos`, `veredictos`, `tareas`,
+  `resumen`, `codigo`). Cada punto lleva `origen`: `sonda` (lo decidió el
+  comando) o `agente` (un veredicto con juicio incorporado con `--resultado`).
+  `veredictos` y `tareas` son `null` si no se pidieron `--resultado` ni
+  `--crear-tareas`.
+- **`--escribir`**: guarda el informe en `docs/doctor-deploy/<fecha>.md` y, al
+  lado, el mismo informe en `<fecha>.json` (si ya hay uno de ese día,
+  `<fecha>-2`...; escritura atómica) con el commit, la rama, si el árbol estaba
+  sucio, los tipos detectados y la tabla de puntos. No commitea: lo commitea la
+  persona. Es un informe de uso interno sobre un commit concreto, no una
+  certificación. El `.json` es lo que lee `finish` de una release.
+
+### Puntos de juicio: `--resultado`
+
+Los puntos de juicio (RLS, autenticación en servidor, restringir accesos, mass
+assignment, consultas parametrizadas, validación de entradas, subidas de
+ficheros, cookies...) no se pueden medir con certeza. Los revisa un agente
+(`agents/revisor-seguridad-deploy.md`, solo lectura) lanzado por la skill
+`/taskcode-plugin:doctor-deploy`, que **cita fichero y línea o deja el punto
+NO VERIFICADO**. Los tipos de aplicación sin sondas propias (API, móvil, CLI,
+librería) los cubre el agente como juicio.
+
+`taskctl doctor-deploy --resultado <fichero.json>` **repite el análisis sobre
+HEAD** y mezcla los veredictos con una función pura. Formato del fichero, que
+vive **fuera del repositorio** (la carpeta temporal del sistema; dentro ensucia el
+árbol y el comando lo avisa):
+
+```json
+{ "commit": "<sha completo>",
+  "veredictos": [ { "punto": "auth-en-servidor", "estado": "ok", "fichero": "src/auth.ts", "linea": 42, "motivo": "Una frase." } ] }
+```
+
+Cada veredicto se **rechaza con su motivo** (sale en el informe y en los avisos) y
+el punto se queda como estaba, NO VERIFICADO, si:
+
+- su `commit` no es HEAD (cada veredicto lleva el commit sobre el que se juzgó;
+  vale el de la raíz si el veredicto no trae el suyo, y un prefijo de 7 o más
+  caracteres);
+- el punto es desconocido, no aplica o está desactivado, o es **determinista**:
+  el agente nunca pisa a una sonda;
+- `ok` o `falla` no traen `fichero` y `linea`: la evidencia es solo eso, sin
+  fragmentos de código (cualquier campo que no sea `punto`, `estado`, `commit`,
+  `fichero`, `linea` o `motivo` rechaza el veredicto);
+- el `fichero` es absoluto, lleva `..`, no está versionado en ese commit, es
+  binario, o la `linea` no existe (se comprueba contra el commit, no contra el
+  árbol de trabajo);
+- hay dos veredictos para el mismo punto (los dos se rechazan).
+
+El `motivo` se acota a 300 caracteres, sin saltos de línea y pasado por el
+enmascarado de secretos antes de guardarse (lo que se escribe en
+`docs/doctor-deploy/` no se puede des-subir). Un `no-verificado` del agente se
+acepta sin evidencia. El código de salida cuenta las FALLA que aporta el agente.
+
+### Una tarea por FALLA: `--crear-tareas`
+
+Crea una tarea por cada punto en FALLA (de una sonda o del agente), con ID del
+**rango reservado**: `TASK-9999`, `TASK-9998`... hacia abajo, para no chocar con
+las tareas normales. El objetivo es el arreglo del catálogo (más dónde falla,
+solo `fichero:linea`; el texto libre de un agente nunca se copia a una tarea) y
+el criterio, que `doctor-deploy` dé OK en ese punto. Usa las piezas de `new`: un
+solo `ensureBaseBranchReady` (exige el árbol limpio y **puede cambiar a la rama
+base**, como `new`; lo dice) y un solo commit para todas las tareas.
+
+- **Repetir no duplica**: cada tarea lleva la etiqueta `doctor-deploy:<id-punto>`;
+  un punto con una tarea **abierta** con esa etiqueta reutiliza la existente y lo
+  dice. Si ya estaba terminada y el punto vuelve a fallar, se crea otra. **Borrar
+  la etiqueta a mano rompe la deduplicación** de ese punto.
+- **Avisa, sin cerrar nada**, de las tareas abiertas cuyo punto ya da OK, ya no
+  aplica o ya no existe.
+- Con `--escribir`, las tareas se crean **antes** de escribir el informe (el
+  guard de rama base aborta con ficheros sin trackear).
+- Si no hay FALLA no toca la rama ni exige el árbol limpio.
+
+El siguiente ID reservado es el menor ocupado menos uno, mirando **tareas y
+ramas** (`feature/task-9999-*`): las ramas no se borran, así que un ID cuya
+carpeta se borró sigue ocupado. La numeración normal (`taskctl new`/`import`)
+ignora todo ID desde `TASK-9000` y aborta si llegara hasta ahí. Un compañero con
+una versión anterior del plugin crearía `TASK-10000` tras un `TASK-9999`:
+actualizad el plugin a la vez.
+
+### Aviso al cerrar una release
+
+`taskctl finish` de una tarea `release` **avisa, sin bloquear** (y nunca ejecuta
+las sondas; solo lee `docs/doctor-deploy/*.json`), si:
+
+- no hay un informe que valga: el informe más reciente cuyo `commit` es la punta
+  que se cierra, o un **ancestro** con solo `docs/doctor-deploy/` o `tareas/`
+  cambiados entre ambos (el informe se commitea después de generarse, así que su
+  commit nunca es la punta, y la revisión, los veredictos y los costes commitean en
+  `tareas/` sin tocar el código); o
+- ese informe tiene alguna FALLA de un punto de severidad `critica`.
+
+Cualquier fallo al leer (un informe ilegible, Git que no responde) se convierte en
+aviso. Como `finish` exige el árbol limpio, hay que commitear el informe antes de
+cerrar.
+
+`.taskcode/doctor-deploy.yml` (opcional) ajusta el catálogo del proyecto, con el
+mismo formato plano:
+
+```yaml
+# Desactivar un punto exige motivo (es una aceptación de riesgo). Sale NO APLICA.
+desactivar_1_id: lockfile-versionado
+desactivar_1_motivo: Es una librería: el lockfile no se versiona por convención
+
+# Añadir un punto propio: solo de juicio, o con una sonda ya registrada.
+punto_1_id: revisar-datos-personales
+punto_1_severidad: alta
+punto_1_tipos: [todos]
+punto_1_metodo: juicio
+punto_1_arreglo: Quita los datos personales de los logs
+punto_1_descripcion: Los logs no llevan datos personales de clientes
+
+# Silenciar UN hallazgo concreto (un secreto ya rotado, un falso positivo).
+# patron: el que informa el punto (stripe-live, aws-access-key, fichero-secreto...).
+# Un silencio es POR HALLAZGO: un hallazgo del historial se silencia con su commit
+# (silenciar_N_commit); uno del árbol, con la huella de su valor (silenciar_N_huella),
+# que sale en la evidencia ("huella ab12cd34ef56"). La huella es un SHA-256 sin sal: solo
+# es segura para claves de alta entropia (no permite recuperarlas). Para
+# url-con-credenciales no se muestra (usuario y host son conocidos y la contrasena puede ser
+# debil): esa se silencia solo en el historial, con commit; en el arbol hay que quitar la
+# credencial. Sin commit ni
+# huella aborta (taparía también claves nuevas del mismo fichero); la huella es opcional
+# con commit. Si commit o huella son solo dígitos, ponlos entre comillas.
+silenciar_1_patron: stripe-live
+silenciar_1_fichero: config/prod.env
+silenciar_1_commit: "ab12cd34"
+silenciar_1_huella: "ab12cd34ef56"
+silenciar_1_motivo: Clave rotada el 2026-10-01
+silenciar_1_quien: carlos
+silenciar_1_fecha: 2026-10-27
+```
+
+Un `id` desconocido en `desactivar_N_id` avisa y se ignora; un `id` repetido (con
+el catálogo del plugin o consigo mismo) aborta, igual que desactivar sin motivo.
+Un silencio que no coincide con ningún hallazgo avisa, y el hallazgo silenciado
+sigue apareciendo en la evidencia con su motivo, quién y cuándo, y cada punto de
+secretos dice «N hallazgos silenciados».
+
+Cobertura de los escaneos de claves: se leen todos los ficheros versionados (también
+los que están en `build`, `dist`, `vendor`, `target` o `node_modules`) y los sin
+versionar que no están ignorados fuera de esas carpetas; en el historial, todos los
+blobs, sea cual sea su ruta. Un fichero UTF-16 con BOM se decodifica; los binarios
+saltados se cuentan siempre. Un fichero de texto mayor de 1 MiB no se lee y deja el
+punto en NO VERIFICADO (un binario grande, no). Un `requirements.txt` solo cuenta
+como lockfile si fija todo con `==`, y una regla negada (`!.env`) en el `.gitignore`
+es FALLA. `.env` tiene que quedar ignorado en la raíz de cada proyecto detectado (en un
+monorepo, un `.gitignore` en el subdirectorio vale para su propio `.env`), y un módulo
+Go sin bloque `require` no necesita `go.sum`.
+
+Límites conocidos: si `git cat-file --batch` devolviera una salida truncada, el historial
+sale NO VERIFICADO (no se pudo provocar con Git real, así que esa rama no tiene test); un
+silencio solo con huella no tapa nunca un hallazgo del historial, y si el patrón y el
+fichero tienen uno el comando avisa de que exige `silenciar_N_commit`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
new file mode 100644
index 0000000..3876617
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
@@ -0,0 +1,320 @@
+# Comandos: `doctor`, `estado`, `metricas` y `registrar-coste`
+
+Volver al [README del plugin](../README.md).
+
+## Comandos disponibles
+
+Ver `taskctl --help` (arriba) para la lista completa y actualizada. Guía
+extendida de la metodología: `docs/PROPUESTA_METODOLOGIA.md` y
+`docs/PLAN_SPRINTS.md` en la raíz del repo `TaskCode`.
+
+`taskctl doctor [--json]` (solo lectura) comprueba de una vez que el proyecto
+está listo para trabajar y es lo primero que conviene ejecutar al instalar el
+plugin en un proyecto. Una línea por comprobación (`ok`, `aviso`, `error` u
+`omitida`) y, en cada aviso o error, el comando que lo arregla; sale con 1 si hay
+algún error (los avisos no cuentan). Comprueba:
+
+- **Entorno**: Node 22 o superior, `git` y un `bash` capaz de ejecutar los
+  scripts de Git-Flow. Lo último se prueba ejecutando de verdad un script mínimo
+  (`scripts/gitflow/_sonda-bash.sh`: `mktemp`, `dirname`, `grep`, `sed`, `tr`, `wc`,
+  `git`) con el mismo lanzamiento que usan los scripts, no mirando una ruta ni
+  `bash --version`: en Windows detecta el bash de WSL (System32) y el de Git sin
+  `usr\bin` en el PATH, y el arreglo dice qué poner al principio del PATH.
+- **Repositorio**: que es un repo Git (un worktree también), que tiene commits,
+  las cinco carpetas de `tareas/`, la rama base (`develop`, o `rama_base`) y la
+  principal (`main` o `master`), `origin` y el workspace. Sin `origin` es un aviso
+  (un proyecto solo local es legítimo) y pasa a error con `cierre_por_defecto:
+  merge-request`; un workspace sucio es un aviso. El workspace se mira con
+  `GIT_OPTIONAL_LOCKS=0`, así que no toma `index.lock`; un fallo por bloqueo es aviso.
+- **Config**: `.taskcode/config.yml` con el mismo validador que el resto de comandos
+  (un valor inválido es error con su mensaje; una clave desconocida, aviso).
+- **Verificación selectiva** (`verificacion-selectiva`): con `comando_verificacion`
+  y sin `comando_verificacion_selectiva`, `aviso` con el arreglo en la misma
+  línea; con las dos, `ok` (con `rutas_verificacion_parcial`, dice que `finish`
+  puede integrar con la selectiva y un merge a mano no). Con
+  `rutas_verificacion_parcial` y sin `rutas_documentacion`, `aviso`: la clave no
+  tendría efecto. Sin completa no dice nada.
+- **Verificación**: si la config declara `comando_verificacion` (ver abajo), `ok`
+  con el comando y su timeout. Sin él, depende de si el proyecto tiene tests en
+  su raíz:
+  - **Con tests detectables**: `aviso`, con el comando propuesto listo para pegar
+    en la config. Los frenos no actúan aunque haya con qué verificar. Detecta
+    `package.json` con script `test` propio (`pnpm`, `yarn` o `npm` según el
+    fichero de bloqueo; el `test` que deja `npm init` no cuenta), `Cargo.toml`,
+    `pom.xml` y `build.gradle(.kts)` (con `mvnw`/`gradlew` si existen),
+    `*.csproj`/`*.sln`, `go.mod` y `pyproject.toml` que mencione pytest. Si hay
+    varios, propone sus comandos encadenados con `&&`.
+  - **Sin tests detectables**: `omitida`, con el arreglo en la misma línea. Un
+    proyecto sin tests no está mal configurado.
+
+  Solo mira la raíz (desde ahí se ejecuta el comando): un manifiesto en una
+  subcarpeta no cuenta. `doctor` no ejecuta el comando ni escribe la config.
+- **Tareas**: cada `tarea.md` se lee y valida, y su `estado` tiene que ser el de
+  su carpeta. Son errores, con el ID: un ID en dos carpetas, un `tarea.md` ilegible
+  (con la ruta y la causa), una carpeta de tarea sin `tarea.md`, un estado distinto
+  de la carpeta.
+- **Plataforma**: solo si la config pide merge request por defecto o declara
+  `plataforma_remota`: `gh`/`glab` instalado y con sesión (sin subir nada; espera
+  como máximo 10 s). CLI no instalado o sesión rechazada es error; no poder
+  verificarlo (timeout, sin red) es aviso; si no aplica, `omitida`. Nunca imprime
+  la URL de `origin` con credenciales.
+- **Hooks** (`hooks-subagente`): los hooks `PreToolUse` que alcanzan a los
+  subagentes (ver «Problemas conocidos»). Como mucho, aviso.
+- **Versión del plugin** (`version-plugin`): compara la versión del plugin que
+  tiene instalada Claude Code (`installed_plugins.json`) con la de la copia local
+  de su marketplace. Si la del marketplace es mayor, aviso con las dos versiones,
+  la fecha de esa copia y los comandos para actualizar (`claude plugin marketplace
+  update <marketplace>`, `claude plugin update taskcode-plugin@<marketplace>` y
+  reiniciar Claude Code). No sale a la red: si la copia local no se ha refrescado,
+  no ve versiones más nuevas. Si no puede comprobarlo (plugin no instalado por
+  Claude Code, sin copia del marketplace, un JSON roto), `omitida` con el motivo.
+  Nunca es error: no cambia el código de salida.
+- **Status line** (`status-line`): si Claude Code tiene instalada la status line
+  que muestra `taskctl estado` (ver «Progreso visible» abajo). Instalada, `ok`; si
+  no, `omitida` con el comando que la instala. Sin flags nunca es aviso ni error.
+
+`--json` escribe en stdout **solo** una línea de JSON
+(`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`), para que
+una skill la lea. `taskctl doctor` no commitea ni cambia de rama, y sin flags no
+escribe nada. La única escritura es la de la status line, con su flag:
+
+- `--instalar-status-line` la escribe en el `settings.json` **de usuario**
+  (`~/.claude/settings.json`, o el de `CLAUDE_CONFIG_DIR`): una vez, para todos
+  los proyectos. Conserva el resto de claves, deja una copia
+  (`settings.json.<fecha>.bak`) y escribe con fichero temporal y renombrado. Es
+  idempotente. El comando es `taskctl estado --stdin` si `taskctl` está en el
+  PATH del sistema. Si solo está en la carpeta del plugin (la que Claude Code
+  añade al PATH de su herramienta Bash), usa esa copia con `node` y su ruta
+  absoluta: como la ruta lleva la versión del plugin, tras actualizarlo hay que
+  repetir `--instalar-status-line`, que la reescribe con la ruta nueva (para no
+  depender de eso, pon `taskctl` en el PATH; ver «Usar `taskctl` fuera de
+  Claude Code»). Si ya hay otra status line, no la toca.
+- `--reemplazar-status-line` (junto al anterior) sustituye una status line
+  ajena; la anterior se guarda en `statusline-previa-taskctl.json`.
+- `--desinstalar-status-line` quita la de `taskctl` (una ajena no se toca) y
+  devuelve la que hubiera antes.
+
+Con cualquiera de ellos, si lo pedido no se puede hacer la comprobación sale como
+`error` y el código de salida es 1.
+
+#### Progreso visible: `taskctl estado`, la status line y `TASKCTL_PROGRESO`
+
+Mientras `plan`, `approve`, `start`, `review`, `finish` o el freno de fin de turno
+trabajan, cada uno deja en `.git/taskcode/progreso.json` (fuera del árbol de
+trabajo: no cambia la huella de la verificación) la tarea, la fase, sus pasos
+declarados de antemano, el paso en marcha y el instante de inicio, y lo marca
+terminado al acabar, también si aborta. Escribirlo no añade ninguna salida a
+ningún comando ni hook (lo que se imprime lo lee el agente y cuesta tokens) y
+nunca hace fallar el comando: si no se puede escribir, se pierde ese tic.
+
+`taskctl estado` lo muestra en una línea, leyendo solo esos ficheros, sin lanzar
+`git` ni leer `tareas/`:
+
+```
+TASK-110 · review (4/5) · ronda 2 · verificacion (3/5) 7/22 · 12 min
+```
+
+La fase con su posición en el ciclo (plan, approve, start, review, finish), la
+ronda si es una revisión, el paso con su posición dentro de la fase, el `x/N`
+del comando de verificación si lo escribe, y los minutos desde que empezó la
+fase. Los pasos: `plan` guardas, brainstorm, commit; `approve` guardas, plan,
+commit; `start` guardas, rama, commit; `review` guardas, integracion,
+verificacion, peticiones, commit; `finish` puertas, verificacion, cobertura,
+held-out, merge, artefactos; el freno de fin de turno no es una fase del ciclo y
+va sin posición, con un único paso (`verificacion`, o `verificacion selectiva` /
+`verificacion documentacion`): `TASK-110 · freno · verificacion (1/1) · 0 min`.
+Sin nada en marcha dice `Nada en marcha.` (o la última fase y si terminó, abortó
+o, en el freno, terminó `en rojo` porque la verificación falló); fuera de
+un repo con `tareas/` o `.taskcode/` no imprime nada. Sale siempre con 0.
+`--stdin` toma el directorio del JSON que Claude Code pasa a la status line.
+`--seguir` refresca cada segundo hasta que la fase termina; sin terminal imprime
+una sola línea y sale, para que un agente que lo lance no se quede esperando.
+
+La status line de Claude Code (`taskctl doctor --instalar-status-line`) ejecuta
+`taskctl estado` en cada refresco: el estado se ve sin preguntar al agente, y no
+entra en su contexto. Se ve también en la app de escritorio y por Remote Control.
+
+`TASKCTL_PROGRESO`: el comando de verificación (`comando_verificacion`, la
+selectiva y la de documentación, en `finish`, en las rondas de `review` y en el
+freno) recibe en esta variable la ruta de un fichero bajo `.git/`. Si escribe en
+él una línea `x/N` (la última con texto cuenta), `taskctl estado` la muestra en
+el paso de verificación. Es opcional: sin escribir nada, la línea muestra el
+paso sin `x/N`. Solo lo recibe ese comando: no lo heredan los scripts de
+Git-Flow ni el de held-out, y un `TASKCTL_PROGRESO` que ya estuviera en el
+entorno se sustituye. De lo que se escriba solo se muestran los números.
+
+## `taskctl metricas`
+
+`taskctl metricas [--heuristica]` (solo lectura) saca una fila por tarea
+con la duración de calendario de cada fase (diseño = plan→start, curso =
+start→primer review, revisión = primer review→finish), las rondas de
+revisión, el día de cierre y el origen del dato: la tabla `## Transiciones`
+del `tarea.md` (cuya columna `fecha` lleva el instante UTC al segundo desde
+la 0.5.0; las filas antiguas, solo el día, dan la duración en días), o, si
+la tarea no la tiene, los commits automáticos `chore(TASK-NNN): ...` con un
+único `git log`; si tampoco, «—». Las pausas se descuentan: cada `taskctl
+pausa` cuenta desde su fila hasta la siguiente transición que no sea otra
+pausa, y se resta de la fase (y del total) en la que cae. Una pausa sin
+transición detrás (tarea abierta) no descuenta, y con duraciones en días
+tampoco. Lo descontado sale, por tarea, en la lista `pausas` de `--json`
+(`enPausa`).
+`--heuristica` añade a las tareas terminadas con informes de revisión la
+puntuación y el nivel de la heurística de complejidad vigente, más un
+resumen de rondas medias por nivel declarado y heurístico: es la tabla con
+la que se calibra `scripts/heuristica-complejidad.yml`.
+
+`taskctl metricas --tokens` añade las columnas de coste en tokens por fase
+(`tok_diseno`, `tok_curso` = implementación, `tok_revision`, `tok_total`; «—»
+si no hay dato, que no es 0) y, debajo, un resumen por sprint y por
+complejidad declarada: tareas con dato / total, suma y media por fase y el %
+de cada fase sobre el total. Las tareas sin ningún dato salen en la tabla y no
+entran en el resumen. Se combina con `--heuristica` (el resumen es entonces
+sobre la muestra). `taskctl metricas --tokens --escribir` regenera en
+`docs/METRICAS.md` solo el bloque entre `<!-- taskctl metricas --tokens: inicio -->`
+y `<!-- taskctl metricas --tokens: fin -->` (si no están, los añade al final;
+el resto del fichero, CRLF incluido, no cambia ni un byte) y no lo commitea,
+como `board --escribir`. No se combina con `--heuristica`.
+
+**Columnas de la tabla por tarea.** `id`, `complejidad`, `diseno`, `curso`,
+`revision` (duraciones), `rondas` (número de la última ronda con informe; «—»
+sin revisión), `crit`, `imp`, `men` (hallazgos CRÍTICO, IMPORTANTE y MENOR de
+todos los informes `informe-revision-N[-<revisor>].md`, cada uno **una vez por
+tarea** con clave revisor + ID), `hall_origen` (implementación/plan/
+especificación/sin clasificar, de la columna `Origen`), `cierre` (día del último
+`finish`) y `origen` (`registro`, `git` o «—»). Un informe sin tabla de hallazgos
+deja `crit`/`imp`/`men`/`hall_origen` en «—»: sin dato, no cero. Con `--tokens`,
+además `tok_diseno`, `tok_curso`, `tok_revision`, `tok_total` y el desglose de
+`## Coste`: `tok_nuevos` (entrada + escritura de caché + salida),
+`tok_cache_lect` (lectura de caché, aparte) y `tok_sin_desglose`
+(`tokens_<fase>` menos lo desglosado; un negativo no se recorta a 0 y la celda
+lleva `*`). Con varios `--repo`, la tabla abre con la columna `proyecto`.
+
+Bajo la tabla: cuántos informes no tienen tabla de hallazgos, la mediana de
+lecturas por fase y las **terminadas sin coste** en alguna fase, con el recuento
+por fase y las 10 primeras («y N más»; la lista completa sale en `--json`).
+
+**Avisos** (por stderr, con `[AVISO]`; ninguno cambia el código de salida ni
+impide `--escribir`, salvo un `tarea.md` inválido): `tarea.md` inválido (la
+tarea no aparece), `git log` que no se pudo consultar, `tokens_<fase>` vacío con
+filas en `## Coste`, desglose mayor que el total, un agente repetido en una
+fase de `## Coste` (salvo las filas de diferencia de un agente reanudado, ver
+`registrar-coste`), una severidad fuera de vocabulario (con la tarea y el
+fichero) e informes sin tabla de hallazgos. Con varios repos, cada tarea se
+nombra `proyecto/TASK-NNN`.
+
+**Varios proyectos: `--repo <ruta>`** (repetible; relativa al directorio actual;
+por defecto, el repo actual). Junta varios repos con la clave (proyecto, id): un
+mismo `TASK-NNN` en dos repos no mezcla datos. El proyecto es el nombre de la
+carpeta. Antes de leer nada aborta si una ruta no existe, no tiene `tareas/`,
+`--repo` va sin valor o dos carpetas distintas se llaman igual; la misma carpeta
+escrita dos veces (otra grafía, otras mayúsculas en Windows) se lee una vez, con
+aviso. Por stderr sale `Repos leidos: <proyecto> (N tareas, <ruta>); ...`. Con un
+solo repo, stdout es el de siempre. `--repo` con `--escribir` aborta sin tocar
+nada.
+
+**`--evolucion [--tramo N]`** sustituye la tabla por la evolución de las tareas
+terminadas: ordenadas por día de cierre (solo el día; desempate por proyecto y
+por número de ID, `TASK-99` antes que `TASK-100`) y en tramos de N (20 por
+defecto; `--tramo` exige un entero de 1 o más). Por tramo: tareas, días de
+cierre, mediana de minutos de plan a finish (de las que tienen hora en las dos
+marcas; las de solo día se cuentan en «solo dia»), rondas medias, hallazgos
+IMPORTANTE por tarea, tokens de revisión medios y KB medios de la petición de
+revisión por ronda. Cada cifra lleva su `n` (las tareas que tienen ese dato);
+«— (n=0)» es que ninguna lo tiene. Dice cuántas terminadas quedan fuera por no
+tener fecha de cierre (por proyecto con varios repos). Al final de cada fila,
+el coste fijo por tarea frente al tamaño del proyecto: `cerradas` (tareas
+cerradas con fecha de cierre al acabar el tramo) y las medianas de minutos de punta a punta, de la
+fase de revisión y del propio `finish` (de las tareas con hora). Una línea
+final compara el primer tramo con el último (el último completo, si hay dos o
+más) y dice si ese coste **crece**, **baja** o **se mantiene** (cambio de
+menos del 15 %): si crece con las tareas cerradas, algún paso de cada tarea
+está pagando el tamaño del proyecto.
+
+**`--grupos`** sustituye la tabla por grupos de tareas terminadas: por tipo, por
+complejidad declarada, por número de criterios (0-4, 5-6, 7 o más), por KB de
+petición de revisión por ronda (terciles calculados con todos los proyectos
+juntos, cortados por valor; las tareas sin petición quedan fuera y se cuentan) y
+por proyecto. Por grupo: tareas, con revisión, % aprobado a la primera (una sola
+ronda con veredicto `aprobada` o `aprobada-con-correcciones`, sobre las que
+tienen revisión), rondas medias, CRÍTICO+IMPORTANTE por tarea (de las que tienen
+tabla de hallazgos) y, aparte, las tareas sin revisión y las revisadas sin tabla
+de hallazgos. Los grupos son fijos: uno sin tareas sale con 0 y «—».
+`--evolucion` y `--grupos` se combinan entre sí y con `--repo`, no con
+`--heuristica`, `--tokens` ni `--escribir`.
+
+**`--por-version`** (desde la 0.12.0) agrupa las tareas terminadas por la
+versión de `taskctl` con la que se cerraron: la de la columna `version` de la
+última fila `finish` de `## Transiciones` (un `finish` abortado y reintentado
+con otro plugin deja dos; cuenta el último). Por versión, en orden semver
+(0.9 antes que 0.10; una pre-release como `0.12.0-dev` antes de su release):
+tareas, con revisión, % aprobado a la primera, rondas medias, tokens medios por
+fase (con su `n`) y una segunda tabla con los hallazgos por severidad y por
+origen (de las tareas con tabla de hallazgos). Las tareas sin versión anotada
+(cerradas antes de la 0.12.0, medidas con los commits o con la celda editada a
+mano) van a un grupo «sin version» aparte: la versión **nunca se deduce por la
+fecha de cierre**. Se combina como `--evolucion` y `--grupos`.
+
+**La columna `version` de `## Transiciones`.** Desde la 0.12.0 cada transición
+anota la versión de `taskctl` que la escribió, como quinta columna. Las filas
+anteriores, de cuatro columnas, se siguen leyendo igual (y siguen congelando el
+modo). La primera fila con versión que se añade bajo una cabecera de cuatro
+columnas cambia **solo la cabecera y su separador** a cinco, para que la
+versión se vea en GitHub y GitLab; las filas viejas no se tocan. Un `taskctl`
+anterior a la 0.12.0 no reconoce las filas de cinco columnas y deja de ver el
+modo congelado de esa tarea: **usa la misma versión del plugin en todo el
+repo**. Para que la versión anotada sea útil, se sube al **abrir** el ciclo de
+una versión nueva (la primera tarea que la construye), no al publicarla.
+
+**`--json`** escribe en stdout un único objeto JSON
+(`{proyectos: [{proyecto, ruta, tareas}], sinCoste: {terminadas, total, porFase,
+tareas}, evolucion?, grupos?, porVersion?}`), también sin tareas; los avisos y la lista de
+repos van por stderr. Cada `null` va junto a un `n: 0` en el mismo objeto; nunca
+`NaN`. `porVersion` es `{terminadas, versiones: [...], sinVersion}`, con cada grupo
+en la forma `{version, n, conRevision, aprobadasPrimera, pctAprobadaPrimera,
+rondasMedia, sinRevision, conHallazgos, sinTablaHallazgos, hallazgosPorSeveridad,
+hallazgosPorOrigen, tokens: {diseno, implementacion, revision}}` (cada fase
+`{suma, conDato, media}`). Solo se combina con `--repo`, `--evolucion`, `--tramo`,
+`--grupos` y `--por-version`: con
+cualquier otro flag aborta sin leer ni escribir nada.
+
+En cualquier comando de `taskctl`, un flag repetido que no admite repetición
+(todos salvo `--repo`, `--agente` y `--criterio`) aborta con error en vez de
+quedarse con el último valor.
+
+## `taskctl registrar-coste`
+
+`taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision
+(--agente <id>... | --tokens N) [--push]` **suma** al coste de esa fase
+(`tokens_diseno`, `tokens_implementacion`, `tokens_revision` del `tarea.md`;
+`null` = sin registrar y solo cuenta como 0 al sumar). `taskctl` no ve el
+consumo del agente, así que lo registra quien lo ve. **La cifra que Claude Code
+muestra al terminar un subagente no es lo que ha gastado: es el tamaño de su
+contexto final.** Con `--agente <id>` (repetible; el `agentId` que devuelve la
+herramienta Agent) `taskctl` lee la transcripción del subagente en
+`<config>/projects/*/*/subagents/agent-<id>.jsonl` (`<config>` = `CLAUDE_CONFIG_DIR`
+o `~/.claude`) y suma, por `message.id` único (la última aparición), entrada +
+escritura y lectura de caché + salida de cada llamada. Varios `--agente` van en
+un solo registro y un solo commit. Un `--agente` ya anotado en `## Coste` de esa
+fase es un agente reanudado (su transcripción acumula los dos trabajos): se suma
+solo lo que creció su transcripción desde lo ya anotado para ese id, y la fila lo
+marca en su fuente (`agente:dif:<id>`), que `metricas` no avisa como repetida; si
+no ha crecido, o el id está anotado junto a otros en una misma fila, aborta.
+En `--fase revision` cada `--agente` va en **su propia fila** (en el mismo
+commit), con las columnas `ronda` y `revisor` que se deducen de su
+transcripción. Se sacan del nombre `peticion-revision-N[-skill].md` que lleva
+el prompt del revisor. Lo que no se puede deducir queda como `-` («sin
+atribuir»). Con un único `--agente`, `--ronda N [--revisor <skill>]` los
+declara a mano; el revisor se valida contra las peticiones de `revision/`.
+Las filas antiguas de 9 columnas se siguen leyendo. `metricas --tokens` las
+resume, por ronda y revisor, en un bloque aparte, también en `--json`: las
+lecturas, los tokens de entrada y caché, y los CRÍTICO e IMPORTANTE de su informe.
+`--tokens N` da una cifra a mano (la parte del
+orquestador, estimada) y se excluye con `--agente`. Si el id no se encuentra, está
+en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué hacer
+(`--tokens N` como salida). Funciona en cualquier estado, también `terminada`;
+escribe y commitea solo ese `tarea.md` (aborta si tiene cambios sin commitear o si
+la copia al día de la tarea está en su rama) y rechaza cifras de 0. `taskctl finish`
+avisa, sin bloquear, si falta el coste de diseño o de revisión. El de
+implementación ya no hace falta registrarlo a mano: lo suma `review` (ver
+«Coste de implementación automático»); `registrar-coste --fase implementacion`
+queda como respaldo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
new file mode 100644
index 0000000..26c8048
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -0,0 +1,493 @@
+# Configuración: `.taskcode/config.yml`, verificación y hooks
+
+Las claves de `.taskcode/config.yml` que gobiernan la verificación, los frenos y
+los ficheros derivados, y los hooks del plugin. Volver al [README del plugin](../README.md).
+
+#### Cómo se verifica el proyecto: `comando_verificacion`
+
+Los frenos de verificación (que una tarea no se dé por hecha ni se mergee con
+los tests en rojo) ejecutan **el comando que declara el proyecto**, nunca uno
+deducido. Se declara en `.taskcode/config.yml`:
+
+```yaml
+comando_verificacion: "npm test"   # entrecomillado si lleva "#"
+timeout_verificacion: 900          # opcional, en segundos (por defecto 600)
+```
+
+- `comando_verificacion`: texto no vacío; lo ejecuta el shell del sistema tal
+  cual. Sin la clave no hay freno y todo funciona como antes.
+- `timeout_verificacion`: entero mayor o igual que 1, en segundos. Solo tiene
+  sentido con el comando: sin él, aborta.
+- Un valor inválido (comando vacío, timeout `0`, decimal o texto) aborta todos
+  los comandos con un mensaje que nombra la clave y la línea; nunca se cae al
+  valor por defecto en silencio.
+- La ejecutan el **freno de fin de turno** (hook `Stop`), la **puerta de
+  `finish`** y la consulta el **guardián de merges** (hook `PreToolUse`), abajo.
+
+#### Verificación selectiva por impacto: `comando_verificacion_selectiva`
+
+Cuando la completa tarda mucho, el proyecto puede declarar además una
+verificación **selectiva**, que corre solo lo afectado por los cambios. La usan
+el freno de fin de turno y las rondas de `taskctl review`; por defecto la
+completa sigue siendo la puerta de `finish` y del guardián de merges (la
+excepción, más abajo: `rutas_verificacion_parcial`).
+
+```yaml
+comando_verificacion: "npm test"                                    # la completa
+comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
+timeout_verificacion_selectiva: 600                                 # opcional (por defecto 600)
+```
+
+- Recibe la rama base de la tarea en la variable de entorno `RAMA_BASE` (la de
+  integración, o la principal en un hotfix); no se añade nada al comando. El
+  mapa de capas es del proyecto: el script decide qué correr.
+- Exige `comando_verificacion`: la selectiva sin la completa aborta, porque
+  dejaría `finish` sin puerta. El timeout sin su comando también aborta.
+- **Hook `Stop`**: con la clave corre la selectiva en vez de la completa, con su
+  propio memo (`.git/freno-verificacion-selectiva.json`, con la base y su commit
+  en la huella). El guardián solo lee el memo de la completa: un verde de la
+  selectiva nunca deja pasar un merge, aunque los dos comandos sean iguales.
+- **`taskctl review`**: la corre antes de escribir la ronda (en la primera,
+  después de integrar la base en la rama; las incrementales no la integran). En
+  rojo, o si deja el árbol sucio, aborta: no abre ronda y la tarea sigue en
+  curso; el mensaje dice si la base quedó integrada. En verde, la
+  petición lleva la sección «Verificación de esta ronda» (tipo, comando,
+  resultado y final de la salida) y omite la de cobertura, porque el informe
+  podría ser parcial.
+- **`taskctl finish`**: ejecuta la completa como siempre (salvo con
+  `rutas_verificacion_parcial`, abajo); en rojo, el mensaje recuerda que se
+  exige aunque las rondas usaran la selectiva; con `rutas_verificacion_parcial`,
+  en su lugar dice por qué tocó la completa y no la selectiva.
+- **Sin la clave**, todo funciona como antes: el `Stop` corre la completa y
+  `review` no verifica.
+- **Ejemplo real**: el repo de TaskCode declara como selectiva
+  `node scripts/verificar-impacto.mjs` (fuera del plugin). Elige los tests de
+  lo que cambia por el grafo de imports, se para en el enrutador `src/cli.ts`
+  (y lo dice), suma los de `test:rapido` y, si lo elegido pasa de
+  `VERIFICAR_IMPACTO_TOPE` ficheros (10 por defecto), corre los tests directos
+  o, si tampoco caben, los más próximos al módulo cambiado, y dice cuántos deja
+  fuera. Con una rama base inexistente sale con error.
+- Cómo escribir el clasificador y qué cambios obligan a correr todo: guía
+  instalada con el plugin, `skills/task-workflow/verificacion-selectiva.md`.
+
+#### Tareas de solo documentación: `rutas_documentacion`
+
+El coste de verificar debe crecer con lo que cambia la tarea, no con el tamaño
+del proyecto. Si todo lo que cambia la tarea frente a la base cae en rutas de
+documentación declaradas, `finish` no corre `comando_verificacion`:
+
+```yaml
+comando_verificacion: "npm test"
+rutas_documentacion: [docs/**, README.md, CHANGELOG.md]          # patrones git :(glob), sin anclar
+comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opcional
+```
+
+- Las rutas se leen de la config de la **rama base**: la tarea no puede
+  ampliarlas para eximirse, y si cambia `.taskcode/config.yml` corre la
+  completa. `tareas/` cuenta siempre como documentación (la cambia toda tarea;
+  sus held-out los sigue corriendo su puerta).
+- **Ante la duda, la completa**: diff que no se puede calcular o vacío, mezcla
+  de documentación y código, o un renombre de código a una ruta de
+  documentación (cuentan las dos rutas). Un `release`
+  corre siempre la completa.
+- Con `comando_verificacion_documentacion` se ejecuta ese (con
+  `timeout_verificacion`); su rojo bloquea y su verde va a su propio memo
+  (`.git/freno-verificacion-documentacion.json`), nunca al de la completa. La
+  puerta de cobertura no mide nada en una tarea de solo documentación.
+- `finish` dice qué corrió y por qué, y lo anota en `tarea.md` (sección
+  «Verificacion de documentacion»), commiteado antes del merge.
+- No declares `**/*.md`: skills, agentes, `CLAUDE.md` o comandos son Markdown
+  que se ejecuta. La guía `verificacion-selectiva.md` trae la lista.
+- Exige `comando_verificacion`; el comando de documentación exige las rutas.
+  Sin `rutas_documentacion`, todo funciona como antes.
+- El **fin de turno** (`Stop`) y **`review`** aplican la misma decisión sobre
+  todo lo que cambia la tarea frente a la base (nunca sobre el último turno ni
+  el delta de la ronda). El fin de turno cuenta además lo no commiteado (un
+  `.ts` sin `git add` saca el turno de «solo documentación») y, en un turno de
+  solo documentación, corre la comprobación de documentación o nada. `review`
+  solo verifica si declaras `comando_verificacion_selectiva`: con ella, una
+  ronda de solo documentación corre la comprobación de documentación en su
+  lugar (o nada) y la petición lo dice; sin ella no corre nada, como antes.
+  **Cambio de comportamiento** si ya declarabas `rutas_documentacion`: esos
+  turnos y rondas dejan de correr la completa o la selectiva.
+- Lo aplican `finish` y el **guardián de merges**, con la misma decisión (la
+  config de la rama destino): un merge a mano de una tarea de solo
+  documentación pasa sin el verde de la completa, o con el verde de su
+  comprobación de documentación si la hay. El guardián no aplica la exención si
+  el comando hace algo más que un merge, cambiar de carpeta o de rama y
+  consultar (un `git commit`, otro merge, `>`, `$(...)` o un script podrían
+  cambiar lo que entra),
+  en un release, ni si cambian los held-out (`tareas/.../aceptacion/`), y la
+  calcula solo cuando ya iba a bloquear, con un presupuesto de 20 s.
+
+#### Código parcial: `rutas_verificacion_parcial`
+
+El mismo principio un paso más allá: si todo el código que cambia la tarea cae
+en unas rutas acotadas, a `finish` le basta la verificación de lo afectado. Por
+defecto la completa es la puerta de integración; declarar esta clave es
+aceptar, para este proyecto, que en esas rutas baste la selectiva.
+
+```yaml
+comando_verificacion: "npm test"
+comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
+rutas_documentacion: [docs/**, README.md]
+rutas_verificacion_parcial: [src/web/**]          # lista de rutas permitidas
+```
+
+- Lista de rutas **permitidas**, leída de la config de la **rama base**: si todo
+  lo que la tarea cambia frente a la base, salvo la documentación, cae en ellas,
+  `finish` corre `comando_verificacion_selectiva` (con `RAMA_BASE` y
+  `timeout_verificacion_selectiva`) en vez de la completa. Un fichero fuera, un
+  cambio de `.taskcode/config.yml` o un diff vacío van a la completa.
+- Exige `comando_verificacion_selectiva` (la config aborta sin ella) y
+  `rutas_documentacion` (sin ellas no tiene efecto: `taskctl doctor` avisa).
+- `finish` dice que corrió la selectiva y por qué, y tras el verde lo anota en
+  `tarea.md` («Verificacion parcial») antes del merge. Reutiliza un verde de la
+  selectiva del mismo commit y la misma base si lo hay (fin de turno o `review`,
+  con el árbol limpio).
+- `finish` no evalúa la puerta de cobertura (el informe sería parcial), y
+  ninguna puerta posterior mide esas líneas: el release corre la completa, pero
+  su cobertura solo mide lo que añade la propia rama release. Con
+  `umbral_cobertura`, las tareas integradas con la selectiva no se comparan con él.
+- El release va siempre a la completa. Un hotfix nunca usa la selectiva (con
+  código, la completa; de solo documentación, su camino de documentación).
+- El **guardián de merges sigue exigiendo la completa para el código**: un merge
+  a mano de una tarea con código queda bloqueado sin su verde, aunque a `finish`
+  le bastara la selectiva. Si `finish` choca en un conflicto, no repitas el
+  merge a mano ni lo cierres en la rama de integración (el guardián bloquea el
+  commit que lo cerraría, y un `finish` relanzado sobre ese merge verifica la
+  rama de integración y en rojo no cierra): abórtalo con
+  `taskctl abort-merge`, integra la base en la rama de la tarea, resuelve allí y
+  vuelve a lanzar `taskctl finish` desde ella.
+- Sin la clave, todo funciona como antes.
+
+#### Freno de fin de turno (hook `Stop`)
+
+El plugin declara en `hooks/hooks.json` un hook `Stop` que Claude Code ejecuta
+cada vez que el agente principal termina un turno, en todas las sesiones del
+proyecto. Solo actúa si **hay una tarea en `tareas/02-en-curso/` cuya `rama` es
+la rama actual** y el proyecto declara `comando_verificacion`; en cualquier otro
+caso sale 0 sin lanzar ningún proceso (ni `git`). Cuando actúa:
+
+- Ejecuta el comando con el mismo envoltorio que la sincronización (shell del
+  sistema, stdin cerrado, el árbol entero se mata al cortarlo) y la salida a un
+  fichero temporal, del que solo se lee el final.
+- **Verde** (código 0): deja terminar el turno, sin escribir nada.
+- **Rojo, cortado o no ejecutable**: sale con 2, así que Claude Code devuelve el
+  turno al agente con este informe por stderr: el comando, el código de salida
+  (o el corte), la duración y el final de la salida (stdout y stderr
+  intercalados), acotado a 40 líneas y 4 KiB, sin colores ANSI, sin credenciales
+  en URLs y sin partir caracteres. El informe pide no borrar ni saltar tests
+  para pasar el freno.
+- **Config inválida** con una tarea en curso en la rama: también sale con 2,
+  con el error de la config.
+- **Un solo disparo por turno**: si Claude Code ya está continuando por un
+  bloqueo del freno (`stop_hook_active`), deja terminar. Es a propósito: un test
+  intermitente no puede dejar al agente en un bucle.
+- **Memo por huella**: guarda el último resultado junto a una huella del árbol
+  (HEAD, comando, timeout y contenido de lo que no está limpio) en
+  `.git/freno-verificacion.json`. Con la misma huella no se vuelve a ejecutar:
+  un verde deja terminar y un rojo repite el informe, diciendo que es el
+  guardado. Cualquier cambio en el árbol lo invalida, salvo en ficheros
+  ignorados por `.gitignore` (la huella sale de `git status`): si lo único que
+  cambia es un ignorado (`.env.local`), cambia algo versionado o ejecuta el
+  comando a mano.
+- Una tarea de `02-en-curso` con el `tarea.md` ilegible no frena (no se sabe si
+  es la de esta rama), pero el hook la nombra en un aviso.
+- **Tope**: el `timeout` del hook es 3600 s, y Claude Code descarta la salida
+  de un hook que lo agota (el freno no frenaría). Por eso la verificación se
+  corta a `min(timeout_verificacion, 3540)` s, avisando si se recorta.
+- Si la verificación cambia ficheros del árbol (compilados, cobertura), el
+  informe lo avisa: el siguiente comando de `taskctl` puede abortar por
+  workspace sucio.
+- **Apagarlo**: `FRENO_VERIFICACION=0` en el entorno de Claude Code, o quitar
+  `comando_verificacion` de la config.
+- Los subagentes no disparan `Stop` (disparan `SubagentStop`), así que el freno
+  no los frena; y no actúa si la persona interrumpe el turno (Esc).
+
+#### Coste de implementación automático (hooks `Stop` y `SubagentStop`)
+
+Con una tarea en curso en la rama actual, el plugin anota al terminar cada
+turno y cada subagente qué transcripción ha trabajado en ella. Solo guarda
+rutas, en `.git/coste-pendiente.jsonl` (`git rev-parse --git-path`): no lee
+transcripciones, no toca `tarea.md`, no cambia la huella del freno de arriba
+y sale siempre con 0. Sin tarea en curso en la rama sale antes de lanzar
+ningún proceso (las mismas guardas baratas que el freno).
+
+`taskctl review` suma ese coste a `tokens_implementacion` en su propio commit,
+con una fila en `## Coste` por fuente: `sesion:<id>` (el hilo principal) y
+`agente:<id>` (cada subagente; también los de la sesión aunque el hook no los
+viera). Cuenta solo las llamadas cuyo `timestamp` cae entre el `start` y el
+`review` de `## Transiciones`, cuyo `gitBranch` es la rama de la tarea y cuyo
+`cwd` está dentro del repo: el diseño, otras tareas de la misma sesión y la
+revisión no entran. Lo ya anotado para un id se descuenta (de uno anotado en
+implementación solo se suma lo que creció, `dif:`; uno anotado en otra fase o
+junto a otros no se toca), así que un `registrar-coste --fase implementacion`
+hecho antes no se duplica. `taskctl finish` repite el volcado como red. Si
+todo el ciclo cabe en un turno, el hook aún no ha corrido al llegar a
+`review`: entonces se usa la sesión que nombra `CLAUDE_CODE_SESSION_ID`, si
+Claude Code la define. Un fallo del volcado nunca rompe `review` ni `finish`:
+deja la tarea como estaba y avisa.
+
+Lo que se acepta: el fichero de `.git/` no viaja con el clon (una tarea
+trabajada en otro clon se registra a mano) y las correcciones de la ronda 2,
+que se hacen con la tarea en revisión, no cuentan como implementación.
+`COSTE_AUTOMATICO=0` en el entorno lo apaga todo.
+
+#### Puerta de verificación en `finish`
+
+Con `comando_verificacion` declarado, `taskctl finish` lo ejecuta **siempre**
+antes del primer efecto (merge, o subir la rama y abrir el merge request): no
+reutiliza un verde guardado, porque la huella no ve los ficheros ignorados.
+
+- **No verde**: aborta con el mismo informe que el freno y sin tocar nada.
+- **Verde que ensucia el árbol** (compilados, cobertura no ignorados): aborta con
+  un mensaje propio antes de que el script de Git-Flow lo haga por workspace sucio.
+- Hay que lanzarlo **desde la rama de la tarea**: es el árbol que se verifica.
+- **No corre** en el segundo `finish --merge-request` (la plataforma ya mergeó).
+- **En el camino idempotente** (la rama ya integrada: un merge a mano, o el
+  commit que cerró un conflicto en la rama de integración) verifica el árbol de
+  la rama de integración antes de cerrar (TASK-123), con la misma decisión
+  proporcional (documentación, selectiva o completa, sobre lo que entró con la
+  tarea) y reutilizando un verde del mismo árbol. En rojo aborta sin mover la
+  tarea, vuelve a la rama de partida y dice cómo arreglarlo; `--sin-verificacion`
+  la salta y lo anota en `## Verificacion omitida`.
+- `--sin-verificacion` la salta y lo deja escrito en `tarea.md`, sección
+  `## Verificacion omitida`, con un commit en la rama de la tarea **antes** del
+  merge: el rastro sobrevive aunque el proceso muera después.
+- Tras un verde guarda el memo con la huella del commit, que es lo que consulta
+  el guardián de merges.
+- `finish` tarda lo que tarde la suite: si lo lanza un agente, que su
+  herramienta de shell no lo corte antes.
+
+#### Tests held-out (`aceptacion/`)
+
+Tests de aceptación que escribe la **persona** a partir de los criterios y que
+el agente que implementa no debe ver. Van en la carpeta `aceptacion/` de la
+tarea, se commitean **en la rama base durante el diseño, antes de `start`** (la
+rama nace con ellos y no aparecen en su diff), y se ejecutan con:
+
+```yaml
+comando_heldout: "npm run aceptacion"   # recibe la carpeta en HELDOUT_DIR
+```
+
+`taskctl finish` los ejecuta justo después de la puerta de verificación, en
+los mismos caminos (no en el segundo `finish --merge-request` ni en el camino
+idempotente), con el cwd en la raíz del repo, `HELDOUT_DIR` = ruta absoluta de
+la carpeta y `timeout_verificacion` como tope. Aborta, sin mergear:
+
+- si no salen en verde, mostrando **solo** comando, código y duración: la salida
+  de un test suele llevar sus aserciones, y la lee el agente;
+- si la rama los ha **editado, añadido o borrado** respecto a la rama base (se
+  compara el árbol de Git de `aceptacion/`, esté en el estado que esté), o los
+  trae sin estar en la base; el mensaje da las órdenes para restaurarlos en su
+  ruta. Si quien los cambió fue la base (la persona los corrigió después de
+  `start`), pide integrarla en la rama (`git merge <base>`);
+- si hay una carpeta `Aceptacion/` con otras mayúsculas;
+- si la tarea tiene `aceptacion/` y la config no declara `comando_heldout`;
+- si en verde dejan el árbol sucio.
+
+La rama base es la de integración, salvo en un hotfix, que nace de la principal. Si los held-out de un hotfix
+están en la rama de integración y no en la principal, aborta en vez de cerrar sin ejecutarlos.
+`comando_heldout` y su timeout se leen de la config **de la rama base**: la rama de
+la tarea no puede cambiar cómo se ejecutan. `--sin-verificacion` no los salta. Sin `aceptacion/` (ni en la rama ni en la
+base) no hay puerta. La petición de revisión excluye siempre
+`tareas/*/TASK-*/aceptacion/**`, aunque se cambie `excluir_de_revision`: el
+revisor no los lee. Que queden fuera de `comando_verificacion`, o el freno de
+fin de turno mostraría su salida. En la rama de la tarea, un hook `PreToolUse`
+impide al agente leerlos, buscarlos o editarlos (ver `skills/task-workflow/heldout.md`).
+
+#### Cobertura de las líneas cambiadas
+
+Una línea cambiada que ningún test ejecuta es un hallazgo. Se mide sobre las
+líneas añadidas o cambiadas desde la **merge base** de la rama con su base (no
+sobre todo el repo), sin lo que excluye `excluir_de_revision` ni los held-out, y
+con el informe **lcov** que genera el propio `comando_verificacion`: taskctl
+nunca ejecuta tests para obtenerlo.
+
+```yaml
+comando_verificacion: "npm test"           # tiene que escribir el lcov
+informe_cobertura: coverage/lcov.info      # relativa a la raiz del repo; ignorala en .gitignore
+umbral_cobertura: 80                       # opcional: % minimo cubierto para que finish cierre
+```
+
+- **`taskctl review`** añade a la petición la sección «Cobertura de las líneas
+  cambiadas»: las líneas sin cubrir por fichero (`src/a.ts: 4-6, 9`), el
+  porcentaje y los ficheros que cambian pero el informe no lista. Solo informa:
+  si el informe no existe, está cortado, es anterior al último commit de la
+  rama o ninguna de sus rutas es un fichero del repo fuera de lo excluido, lo
+  dice como aviso y no lista líneas. Sin `informe_cobertura` no hay sección.
+- **`taskctl finish`**, solo con `umbral_cobertura`: justo después de la
+  verificación (que acaba de regenerar el informe) y antes de los held-out,
+  aborta sin mergear si el porcentaje cubierto no llega al umbral (el valor
+  exacto pasa), y también si no hay datos fiables: el informe no existe, está
+  cortado, es anterior a la verificación de ese mismo `finish`, o ninguna ruta
+  del informe es del fuente del repo. Sin datos nunca cuenta como aprobado.
+- Cuenta una línea cambiada (no en blanco) con `DA` en el informe (`DA:n,0` =
+  sin cubrir); sin `DA` no es ejecutable. Un fichero cambiado que el informe no
+  lista cuenta con todas sus líneas sin cubrir si el informe **sí** mide su
+  extensión y alguna de sus carpetas tiene un fichero medido, sin contar la
+  raíz del repo ni la del proyecto que generó el informe (la carpeta contra la
+  que se resuelven sus rutas relativas, como `pkg/`, y sus padres): un `.mjs`
+  nuevo en `src/` que ningún test carga (`node --test` y c8
+  sin `--all` solo listan lo cargado). No cuentan un `.md` o un `.yml`, los
+  tests si el proyecto los excluye de la cobertura (`test/` sin nada medido) ni
+  los `*.d.ts`: una tarea de solo documentación, o de solo tests, no se frena.
+  Un `.ts` solo de tipos en una carpeta medida sí cuenta; para evitarlo, genera
+  la cobertura con `--all`/`include`, y saldrá en el informe sin líneas
+  ejecutables.
+- Las rutas `SF:` pueden ser absolutas o relativas, con `\` o `/`. Una relativa
+  se resuelve contra la carpeta del informe y cada una de sus padres hasta la
+  raíz, la más cercana primero: un proyecto en `pkg/` con el informe en
+  `pkg/coverage/lcov.info` funciona.
+- `umbral_cobertura` e `informe_cobertura` se leen, en `finish`, de la config
+  **de la rama base**: la rama no puede rebajar su propio freno. El umbral exige
+  `informe_cobertura` y `comando_verificacion`.
+- `--sin-verificacion` no regenera el informe, así que tampoco mide el umbral:
+  lo avisa, y el salto queda anotado en la tarea.
+- Si la cobertura mide el código compilado (por ejemplo `dist/`, excluido) y no
+  el fuente, el informe no sirve: con umbral, `finish` no cierra.
+
+#### Guardián de merges (hook `PreToolUse`)
+
+Antes de cada comando Bash o PowerShell del agente (sin filtro `if`: el de
+prefijo no ve `cd x && git merge`), el hook mira si el texto integra algo en la
+rama de integración (`rama_base`) o en la principal:
+
+- `git [-C dir] merge … <ref>`, con destino la última rama de un `git
+  checkout|switch` del mismo texto o, si no hay, la rama actual; y los scripts
+  `merge-<tipo>-to-<destino>.sh <rama>`. Un `git checkout <x>` con un único
+  argumento solo cambia el destino si `x` es una revisión: una rama (en
+  `refs/heads/` o en `refs/remotes/origin/`), un tag o un commit (estos dos
+  desacoplan HEAD, así que el merge no entra en ninguna rama). `HEAD` y `@` no
+  cambian el destino: te dejan en la misma rama. `git checkout README.md && git
+  merge x` restaura un fichero y el destino sigue siendo la rama actual.
+- El texto de `bash|sh|zsh|dash [opciones] -c "…"`, `pwsh|powershell -Command …`,
+  `cmd /c|/k …` y `eval …` se analiza igual que si se hubiera escrito
+  directamente (también con opciones con valor delante, como `bash -o pipefail
+  -c`), y también tras `time [-p] [--]`, `nohup`, `!`, dentro de un grupo
+  `{ …; }` y en la condición o el cuerpo de `if`, `elif`, `else`, `while` y
+  `until`.
+- **Bloquea** (exit 2, el motivo le llega al agente) si no hay un **verde
+  guardado para el commit que entra** —sin verde cuenta como no verde— y remite
+  a `taskctl finish` (o a `--sin-verificacion`, si lo decide la persona).
+- **Bloquea el commit que cierra un merge en curso** (TASK-123): un `git commit`
+  (también `git commit -am`, `git add … && git commit`) o `git merge --continue`
+  con `MERGE_HEAD` presente en la rama de integración o la principal es el merge
+  hacia ella, y lo que se commitea es la resolución, no lo verificado en la rama
+  de la tarea. Pasa solo con un verde guardado de ese mismo árbol (el del freno
+  `Stop`) o si lo que entra ya está integrado (ancestro de `HEAD`, de la
+  principal o de `origin/<rama>`: cerrar un `git pull` o un
+  `git merge origin/develop` con conflicto no se bloquea). Propone `taskctl abort-merge`,
+  integrar la base en la rama de la tarea, resolver allí y relanzar `finish`
+  desde ella. Sin `MERGE_HEAD`, o en una rama de tarea (que es justo el
+  remedio), no se toca.
+- **Bloquea siempre si `.taskcode/config.yml` existe pero no se puede leer**
+  (un valor inválido de cualquier clave) y el destino es `develop`, `main` o
+  `master` —lista fija, porque sin config no se sabe `rama_base`—, aunque lo
+  que entra ya esté integrado. El mensaje cita el error; se arregla el fichero
+  (`taskctl doctor` lo valida) y se repite el merge. Una config mal escrita no
+  desactiva el guardián. *Cambia el comportamiento de la 0.14.0*, que dejaba
+  pasar.
+- **Deja pasar** si el texto no contiene `merge` ni `commit` (sale sin cargar nada),
+  `merge --abort|--continue|--quit|--skip` como opción (no como el valor de
+  otra: `git merge -m --abort x` o `--message --abort x` sí mergean `x` y se
+  evalúan), `merge-base`,
+  `git config merge.*`, `echo "git merge …"`, merges hacia ramas de trabajo, lo
+  que ya está integrado (ancestro del destino, de la principal —el backmerge de
+  recuperación de un hotfix— o de `origin/<destino>`), proyectos sin fichero de
+  config o sin `comando_verificacion` y cualquier otro fallo antes de saber que
+  el destino es protegido.
+- `eval`, `time`, `nohup`, `{ …; }` y las estructuras de control nunca reciben
+  la exención de solo documentación: el merge se evalúa completo.
+- Nunca ejecuta la suite (su `timeout` es de 30 s): solo lee el memo.
+- Es una defensa contra despistes, no contra un agente hostil: no ve alias de
+  git, `git pull`, `git push . x:develop` ni lo que se calcula en una subshell.
+  Tampoco ve el cierre de un merge con `cd <otro repo> && git commit`, con
+  `--git-dir`/`--work-tree` ni con un alias de git (`git ci`): solo respeta
+  `-C <dir>`. Es el hueco inherente al análisis sintáctico del texto.
+  La red de verdad es la puerta de `finish`.
+
+#### Documento de estado vigilado por `doctor`: `documento_estado`
+
+```yaml
+documento_estado: docs/ESTADO.md   # opcional: sin ella no se vigila ningun documento
+```
+
+- **`documento_estado`** (opcional; sin ella no se vigila ningún documento): ruta, relativa a la raíz del repo, del documento que resume el estado del proyecto. Solo la lee `taskctl doctor`, en la comprobación `documento-estado`. La fecha del documento es la de su último commit (`git log -1 -- <ruta>`), no la de modificación del fichero. Da aviso, con el arreglo, si el fichero no existe o no tiene commits; si ese commit tiene 15 días o más (14 aún es `ok`), y si alguna tarea de `04-terminadas` tiene `actualizado` posterior al día de ese commit, diciendo cuántas y cuál es la más reciente. Nunca es error, así que no cambia el código de salida. Un valor inválido aborta: vacío, ruta absoluta, que salga del repo, una carpeta, o bajo `.git/`, `.taskcode/` o una carpeta de estado de `tareas/`.
+
+## Sincronización de ficheros derivados
+
+Un proyecto puede regenerar en cada transición los ficheros que derivan del
+estado de las tareas (un plan, un tablero, un roadmap) con
+`comando_sincronizacion` y `rutas_sincronizacion` en `.taskcode/config.yml`;
+lo que el comando reescribe entra en el mismo commit de la transición. La guía
+completa (claves, salvaguardas, conflictos de merge) está en la skill
+`task-workflow`, en `sincronizacion.md`.
+
+Las rutas son ficheros relativos a la raíz del repo, fuera de `.taskcode/` y
+`.git/`. De `tareas/` solo se admite un fichero suelto en su raíz:
+
+```yaml
+comando_sincronizacion: "node scripts/roadmap.mjs"
+rutas_sincronizacion: [tareas/ROADMAP.md, docs/PLAN.md]
+```
+
+El motivo: fuera de las carpetas de estado (`tareas/00-planificadas/` …
+`tareas/04-terminadas/`) `taskctl` solo escribe `tareas/ROADMAP.md`, y nunca si
+está declarado aquí (ver «ROADMAP de tareas» abajo), así que un fichero suelto
+en la raíz de `tareas/` no choca con lo que escribe la herramienta, y sin esa
+excepción un roadmap propio que vive ahí se quedaba atrasado tras cada transición.
+`tareas/01-en-diseno/x.md`, `tareas/otra/x.md` y `tareas` (la carpeta) se
+siguen rechazando, sin distinguir mayúsculas. `informe_cobertura` no tiene esta
+excepción.
+
+## ROADMAP de tareas (`tareas/ROADMAP.md`)
+
+`taskctl` mantiene en cada proyecto un `tareas/ROADMAP.md`: una tabla por hito
+(el campo `sprint`), con las columnas Paso, Tarea, Título, Complejidad, Depende
+de y Estado, en orden de dependencias (ninguna tarea antes que sus predecesoras;
+a igualdad, la del hito anterior y luego la de número menor), y un resumen de
+lo que está en marcha y lo que está listo para empezar. Un ciclo de
+dependencias no aborta nada: sale en una sección «Dependencias circulares» y
+como aviso. No lleva fecha, así que una transición que no cambia nada no lo
+toca.
+
+**Cuándo.** `new`, `plan`, `approve` y `finish` (tras el merge) lo regeneran
+dentro de su propio commit, solo cuando ese commit cae en la rama de
+integración (`rama_base`). `start`, `review` y el resto commitean en la rama de
+la tarea y no lo tocan: por eso dos ramas en paralelo nunca chocan en él. Si
+añadirlo al commit falla, se avisa y la transición sigue sin él.
+
+**La marca.** Su tercera línea es exactamente
+`<!-- generado por taskctl; formato 1; no editar fuera de la zona manual -->`
+(se compara la línea entera, ignorando CRLF; nunca por subcadena).
+
+**La regla de no pisar.** Las transiciones solo escriben el fichero si lleva
+la marca o si no existe y nunca ha existido (`git log --all` no sabe nada de
+él). Nunca si no lleva la marca (es del proyecto, aunque lo genere otro
+script), si está en `rutas_sincronizacion`, si tiene cambios sin commitear
+(avisan), ni si en disco se llama con otras mayúsculas. Cualquier fallo al
+generarlo (una `tarea.md` ilegible, una zona manual sin cerrar) deja el
+fichero como estaba y solo avisa.
+
+**La zona manual.** Lo que va entre una línea que empieza por
+`<!-- manual:inicio` y la línea `<!-- manual:fin -->` se conserva byte a byte.
+Ahí van el motivo de cada hito y un `### Hn — título` por hito, que da el
+título y el orden de su tabla.
+
+**Comando.** `taskctl roadmap` muestra el que se generaría, sin escribir.
+`taskctl roadmap --comparar` lista, sin escribir nada, lo que difiere del
+actual (tareas con su título, complejidad, dependencias y estado, hitos, filas
+duplicadas, zona manual y el texto propio fuera de ella que se perdería) y sale con 1 si hay
+diferencias. `taskctl roadmap --escribir` lo regenera sin commitear, aunque no
+exista o tenga historia; sobre uno sin la marca, solo si `--comparar` saldría
+limpio.
+
+**Migrar un proyecto que ya tiene el suyo.** Mientras no lleve la marca,
+`taskctl` lo deja en paz. Para pasarlo: `taskctl roadmap --comparar`, corregir
+lo que salga (normalmente, llevar a una zona manual los textos y los títulos
+de los hitos), repetir hasta que salga limpio, `taskctl roadmap --escribir`,
+revisar el diff, commitear y retirar el script propio. La guía está en la skill
+`task-workflow`, en `roadmap.md`. Con una versión vieja del plugin, un ROADMAP
+con la marca se queda desactualizado sin aviso.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/instalacion-y-distribucion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/instalacion-y-distribucion.md
new file mode 100644
index 0000000..e58eaec
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/instalacion-y-distribucion.md
@@ -0,0 +1,423 @@
+# Instalación y distribución
+
+Cómo viaja el plugin, cómo se usa `taskctl` fuera de Claude Code y la historia de
+su empaquetado. Volver al [README del plugin](../README.md).
+
+## Cómo se distribuye: por qué `dist/src/` está versionado
+
+Instalar un plugin **no es un checkout donde el usuario pueda compilar**.
+Según la referencia oficial (`plugin-marketplaces`), Claude Code *copia* el
+plugin a su caché (`~/.claude/plugins/cache`). Sobre esa copia sí instala las
+dependencias npm —`npm ci --ignore-scripts`, porque el plugin trae
+`package.json` y `package-lock.json`—, pero ese `--ignore-scripts` es
+literal: **`postinstall` y `prepare` no se ejecutan nunca**. Compilar al
+instalar no es una opción que se descartara por criterio; la plataforma no la
+ofrece.
+
+De ahí que el build viaje ya hecho. Dos piezas lo sostienen, y conviene no
+tocarlas por separado:
+
+- `tsconfig.json` fija `"newLine": "lf"`, y `.gitattributes` fija
+  `*.ts text eol=lf` **además de** `dist/** text eol=lf`. Lo segundo no es
+  redundante: las plantillas multilínea de `src/` viajan tal cual al build,
+  así que con `core.autocrlf=true` el checkout de Windows mete CRLF dentro de
+  un literal y el mismo `src/` compila distinto que en Linux. Medido en su
+  día: 34 CRLF en `dist/src/cli.js`, todos dentro del literal `HELP`.
+- El CI recompila y falla si `dist/src` no coincide con lo commiteado, **en
+  Linux y en Windows**. Un guard en una sola plataforma no vería justo el
+  fallo que motiva lo anterior.
+
+Si cambias algo de `src/`, recompila y commitea `dist/src` en el mismo
+commit. El guard existe precisamente porque es fácil olvidarlo.
+
+### Limitación conocida: `bin/` y las organization settings de claude.ai
+
+El mecanismo por el que `taskctl` se invoca como comando suelto es tener el
+ejecutable en `bin/`, en la raíz del plugin (referencia oficial,
+`plugins-reference`: *"Executables added to the Bash tool's PATH and invokable
+as bare commands while the plugin is enabled"*). No pasa por ningún campo de
+`plugin.json`.
+
+Esa misma página avisa de que **un plugin con `bin/` de nivel superior no se
+puede distribuir por organization settings de claude.ai** (*"You can't include
+this directory in a plugin you distribute through claude.ai organization
+settings"*), y enlaza a `plugin-marketplaces`, que es donde está el detalle: el
+sync del marketplace y la subida directa lo rechazan con
+`Plugin contains a top-level bin/ directory`, y la alternativa que prescribe
+es mover los ejecutables a `scripts/` e invocarlos por
+`${CLAUDE_PLUGIN_ROOT}/scripts/<nombre>`.
+
+Hoy no bloquea nada: la distribución es un marketplace público por Git. Queda
+anotado porque condiciona **E1** (invitar colaboradores) y cualquier intento
+futuro de distribuir por esa vía, que obligaría a renunciar a `taskctl` como
+comando suelto o a reestructurar el plugin.
+
+## Usar `taskctl` fuera de Claude Code (PowerShell, cmd, Git Bash)
+
+Dentro de Claude Code no hay que hacer nada: `bin/` entra en el PATH del
+Bash tool mientras el plugin esta habilitado. **Fuera** (tu propia terminal)
+no: ni esta en el PATH ni, en Windows, PowerShell y cmd saben ejecutar
+`bin/taskctl`, que es un script de node sin extension.
+
+El plugin instalado vive en
+`~/.claude/plugins/cache/<marketplace>/taskcode-plugin/<version>/` (en
+Windows, `%USERPROFILE%\.claude\plugins\cache\...`). Hace falta `node` en
+el PATH. Una forma por shell:
+
+**PowerShell**: anade esto a tu perfil (`notepad $PROFILE`). Llama a `node`
+directamente y elige la version instalada mas alta, asi que sobrevive a las
+actualizaciones del plugin:
+
+```powershell
+$taskcodeBase = Join-Path $env:USERPROFILE '.claude\plugins\cache\taskcode-marketplace\taskcode-plugin'
+function taskctl {
+  $bin = Get-ChildItem $taskcodeBase -Directory |
+    Where-Object { $_.Name -as [version] } |
+    Sort-Object { $_.Name -as [version] } | Select-Object -Last 1
+  if (-not $bin) { throw "taskcode-plugin no esta instalado en $taskcodeBase (instalalo con /plugin)" }
+  node (Join-Path $bin.FullName 'bin\taskctl') @args
+}
+```
+
+En Windows PowerShell 5.1, evita las comillas dobles dentro de un argumento
+(`--titulo 'Soporte "modo oscuro"'`): PowerShell 5.1 no las escapa al llamar
+a `node`, y el titulo llega sin ellas o partido en dos argumentos. Usa
+comillas simples dentro del texto, o PowerShell 7.3 o posterior, que las pasa
+bien.
+
+**No pongas `bin` en el PATH para usarlo desde PowerShell.** Ahi `taskctl`
+resolveria a `bin\taskctl.cmd`, y PowerShell le pasa sin comillas los
+argumentos que no llevan espacios: un titulo como `Q&A` o `foo->notas.txt`
+lo interpreta cmd.exe, que ejecuta `A` o vacia `notas.txt`. La funcion de
+arriba no pasa por cmd y no tiene ese problema.
+
+**cmd**: `bin\taskctl.cmd` (desde la 0.4.0). Anade la
+carpeta `bin` de la version instalada al PATH y escribe `taskctl`. Pon
+**siempre entre comillas dobles** los argumentos con `& | < > ^`
+(`taskctl new --titulo "Q&A"`): cmd.exe interpreta esos caracteres antes
+que nada, y el escape con `^` no sobrevive al reenvio a node. Ojo con
+`%NOMBRE%`: cmd lo sustituye por la variable de entorno aunque vaya entre
+comillas. Hay que actualizar la ruta cuando cambie la version del plugin.
+
+**Git Bash**: `alias taskctl='node "$(ls -d ~/.claude/plugins/cache/taskcode-marketplace/taskcode-plugin/*/ | sort -V | tail -1)bin/taskctl"'`
+en `~/.bashrc`.
+
+Los comandos que invocan Git-Flow (`start`, `review`, `finish`...) ejecutan
+`bash` por debajo: necesitan Git for Windows instalado, desde cualquier
+shell.
+
+## `taskctl` en el PATH del Bash tool
+
+Según la referencia oficial (`https://code.claude.com/docs/en/plugins`,
+tabla "Plugin structure overview"): *"`bin/`: Executables added to the
+Bash tool's `PATH` while the plugin is enabled"*. Es decir, el mecanismo
+no pasa por el campo `commands` de `plugin.json` — pasa simplemente por
+tener el ejecutable dentro de `bin/` en la raíz del plugin, con el bit de
+ejecución puesto.
+
+**Matiz encontrado en revisión por pares, sin confirmar con pruebas
+propias todavía:** esa frase dice explícitamente *Bash tool*, no "shell
+tool" en general. Según `https://code.claude.com/docs/en/setup`
+("Set up on Windows"): en Windows nativo, **sin** Git for Windows
+instalado, Claude Code usa el *PowerShell tool* en vez del Bash tool; con
+Git for Windows instalado, usa Git Bash para el Bash tool (y el
+PowerShell tool queda disponible en paralelo). No hay confirmación oficial
+de si `bin/` también se añade al PATH cuando quien corre los comandos es
+el PowerShell tool en vez del Bash tool — es una pregunta abierta, no un
+hecho verificado en ningún sentido.
+
+En la práctica esto ya condiciona a este proyecto igual: `taskctl start`,
+`plan` y `approve` invocan los scripts de Git-Flow como
+`bash "$CLAUDE_PLUGIN_ROOT/scripts/gitflow/<script>.sh"` (ver
+`scripts/gitflow/README.md`), así que ya exigen Git for Windows / Bash
+tool para funcionar, con o sin este hallazgo. Lo que sigue sin confirmar
+es si `taskctl new`/`import`/`board` (que no tocan Git-Flow) podrían
+seguir funcionando bajo un PowerShell-tool-only vía
+`node bin/taskctl ...` explícito aunque la resolución de `taskctl` como
+comando suelto por PATH no aplicara ahí.
+
+### Bug encontrado y corregido en TASK-006
+
+`bin/taskctl` estaba trackeado por Git en modo `100644` (no ejecutable) a
+pesar de tener `chmod +x` en el working tree local. Cualquier clon limpio
+del repo (exactamente lo que hace todo smoke test de este proyecto)
+heredaba el fichero sin bit de ejecución, así que `taskctl` como comando
+suelto nunca había funcionado realmente en un clon nuevo — solo la
+invocación explícita `node bin/taskctl ...` (la que usan todos los smoke
+tests de TASK-004/005) evitaba el problema. Corregido con:
+
+```bash
+git update-index --chmod=+x taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
+```
+
+Verificado tras el fix:
+
+```
+$ git ls-files -s taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
+100755 79d808e6009043081c76b013a8cba1f6d3c01932 0	taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
+```
+
+### `commands` en `plugin.json`: campo con forma inválida, eliminado — corrección tras revisión por pares
+
+`plugin.json` tenía `"commands": {"taskctl": "bin/taskctl"}`.
+**Corrección respecto a la primera versión de este README:** el campo
+`commands` sí existe en el schema real (referencia oficial,
+`https://code.claude.com/docs/en/plugins-reference`) — apunta a ficheros
+`.md` de skills "planas" (no anidadas en `<nombre>/SKILL.md`), y su tipo
+es `string | array` únicamente. Nunca acepta un objeto. Nuestro uso (un
+objeto `{"taskctl": "bin/taskctl"}`) no era "un campo que no hacía nada":
+era un campo reconocido con un tipo incorrecto, y según la misma
+referencia *"How Claude Code handles a recognized field whose value has
+the wrong type... Most fields: the plugin fails to load"*. Es decir, no
+se puede descartar que este `plugin.json`, tal cual estaba, impidiera que
+el plugin cargara en cualquier sesión real de Claude Code hasta este fix
+— no solo que el campo fuera inofensivo. Se eliminó, y de paso se corrigió
+`author` al formato de objeto (`{"name": "charlie.bk"}`) que usa el propio
+ejemplo oficial de la guía de creación de plugins, en vez de un string
+suelto.
+
+### Evidencia recogida en esta sesión
+
+Todo lo siguiente se ejecutó de verdad (no es texto de relleno) contra
+este repo, tras `npm install && npm run build`, ya con el fix del bit de
+ejecución aplicado:
+
+```
+$ node bin/taskctl --help
+taskctl 0.13.0 — TaskCode
+[...]
+
+$ ./bin/taskctl --help          # ejecución directa vía shebang + bit +x
+taskctl 0.13.0 — TaskCode
+[...]                            # salida idéntica
+
+$ PATH="$(pwd)/bin:$PATH" taskctl --version   # simula resolución por PATH
+0.5.0
+
+$ PATH="$(pwd)/bin:$PATH" which taskctl
+.../taskcode-plugin/bin/taskctl
+```
+
+Las cuatro formas de invocación funcionan de forma idéntica una vez el bit
+de ejecución está bien trackeado: el mecanismo de `bin/` en PATH que usa
+Claude Code depende exactamente de esto.
+
+### Smoke test en un clon aislado
+
+Se repitió el patrón de smoke test de TASK-004/TASK-005: `git clone` a un
+directorio temporal separado, checkout de esta rama, `npm install && npm
+run build` en el clon (entonces `dist/` estaba entero en `.gitignore`, así
+que no se heredaba entre clones — **desde TASK-031 `dist/src` sí se hereda**;
+`node_modules/` sigue sin heredarse), y ejecución real:
+
+```
+$ ls -la bin/taskctl          # tras un clon limpio, sin tocar permisos a mano
+-rwxr-xr-x 1 ... bin/taskctl
+
+$ node bin/taskctl --help     # OK
+$ ./bin/taskctl --version     # OK — 0.5.0
+$ PATH="$(pwd)/bin:$PATH" taskctl --version   # OK — 0.5.0, resuelto como comando suelto
+```
+
+El bit de ejecución sobrevive un `git clone` normal en un filesystem POSIX
+estándar (confirma que el fix de `git update-index --chmod=+x` es
+correcto y suficiente ahí). Además se corrió `taskctl import` y
+`taskctl board` de punta a punta en ese mismo clon para confirmar que el
+empaquetado no rompió nada del resto del CLI — ambos funcionaron igual
+que en TASK-004/TASK-005.
+
+### Lo que NO se ha podido verificar en esta sesión (limitación de entorno)
+
+> **Histórico (TASK-006, 2026-09-05).** Se conserva por trazabilidad, pero
+> está superado dos veces: por la sección *RESUELTO (2026-09-05)* y por
+> *RESUELTO (2026-09-07, TASK-031)*, más abajo. Ya hay un CLI real de Claude
+> Code y la instalación se ejecutó de verdad. La receta de `npm install &&
+> npm run build` que aparece aquí tampoco hace ya falta para arrancar.
+
+Ni el contenedor cloud de esta sesión ni el bridge hacia el equipo del
+usuario (`device_bash`) exponen un CLI interactivo real de Claude Code —
+ambos exponen solo un stub restringido:
+
+```
+$ claude --version
+claude: only `claude -p "<prompt>"` is supported in this environment
+
+$ claude --plugin-dir ./taskcode-marketplace/plugins/taskcode-plugin --help
+claude: only `claude -p "<prompt>"` is supported in this environment
+
+$ claude plugin validate ./taskcode-marketplace/plugins/taskcode-plugin
+claude: only `claude -p "<prompt>"` is supported in this environment
+```
+
+Por tanto no se ha podido ejecutar de punta a punta, dentro de esta
+sesión, ni `claude --plugin-dir ...` en modo interactivo ni
+`claude plugin validate`. Mismo patrón que TASK-007 (ver
+`docs/spikes/TASK-007-resultado.md`): se deja documentado el procedimiento
+exacto y verificado hasta donde el entorno lo permite (estructura,
+permisos, schema de `plugin.json`, arranque real de `dist/src/cli.js`), y
+se recomienda una pasada rápida en una sesión nativa de Claude Code —
+Windows o donde sea que el equipo lo use — la próxima vez que alguien la
+tenga abierta:
+
+```bash
+cd taskcode-marketplace/plugins/taskcode-plugin
+npm install && npm run build
+claude --plugin-dir "$(pwd)"
+# dentro de la sesión: taskctl --help
+```
+
+### RESUELTO (2026-09-05): el CI de Windows nativo contestó las preguntas
+
+Las dos limitaciones de abajo se documentaron cuando no había forma de
+probar nada en Windows nativo desde esta sesión. **Ya la hay**: el job
+`windows-latest` de `.github/workflows/ci.yml` corre sobre un checkout
+nativo de Windows y asevera cada hipótesis como un step propio. Resultado
+del primer run verde:
+
+| Pregunta | Respuesta |
+|---|---|
+| ¿`bin/taskctl` conserva el bit `+x` tras un checkout nativo de Windows? | **Sí** |
+| ¿`taskctl` resuelve como comando suelto vía PATH en Windows? | **Sí** |
+| ¿Los `.sh` de Git-Flow corren bajo Git Bash nativo? | **Sí** (smoke test completo en verde) |
+| ¿`node bin/taskctl` funciona desde `cmd.exe`, sin Git Bash? | **Sí** |
+| ¿Pasa la suite completa en Windows? | **Sí**, tras corregir el glob de `npm test` |
+
+Además, `claude plugin validate` pasó en CI tanto para el manifiesto del
+plugin como para el del marketplace — la validación que esta tarea no
+pudo hacer por no tener un CLI real disponible.
+
+El único hallazgo negativo del ejercicio fue real y ya está corregido: el
+script `test` de `package.json` expandía los globs en el shell, y `cmd.exe`
+no expande globs, así que la suite entera fallaba en Windows. Con el glob
+entrecomillado lo expande Node y funciona en ambos sistemas.
+
+### RESUELTO (2026-09-07, TASK-031): el `/plugin install` real, por fin ejecutado
+
+TASK-006 y TASK-021 dejaron pendiente comprobar la instalación de verdad por
+no haber un CLI de Claude Code disponible. Ya lo hay (2.1.226), y esto es lo
+que se ejecutó:
+
+```
+$ claude plugin validate .                      # marketplace  -> ✔ passed
+$ claude plugin validate ./taskcode-marketplace/plugins/taskcode-plugin
+                                                # plugin       -> ✔ passed
+$ claude plugin marketplace add "C:\...\TaskCode"
+✔ Successfully added marketplace: taskcode-marketplace
+$ claude plugin install taskcode-plugin@taskcode-marketplace
+✔ Successfully installed plugin: taskcode-plugin@taskcode-marketplace (scope: user)
+```
+
+| Pregunta | Respuesta |
+|---|---|
+| ¿El plugin se instala desde el marketplace? | **Sí**, `enabled`, scope `user` |
+| ¿`taskctl` arranca desde la caché, sin compilar? | **Sí**: `node <cache>/bin/taskctl --version` → `0.5.0` |
+| ¿La copia cacheada trae `dist/`? | Sí, **pero esta instalación no lo demuestra** — ver abajo |
+| ¿Claude Code instala las deps npm en la copia? | Sí, **pero no por la razón que parece** — ver abajo |
+| ¿Existe de verdad el mecanismo de `bin/` en PATH? | **Sí** — confirmado abajo |
+
+**Las dos filas del medio necesitan una advertencia, y la revisión por pares
+la encontró.** Este marketplace se añadió como fuente `directory` apuntando al
+propio working tree, y esa clase de caché es **una copia del árbol de trabajo,
+ficheros ignorados por Git incluidos**. Prueba: en la caché hay 34 ficheros de
+`dist/test/`, que Git no versiona (`git ls-files dist/test` → 0). Es decir,
+**esa tabla habría contestado "sí" también antes de esta tarea**, con `dist/`
+entero ignorado, porque lo que se copió fue un árbol ya compilado. La
+conclusión de fondo sigue siendo correcta —en un marketplace por Git, quien
+hace que la copia arranque es `dist/src` versionado— pero quien la demuestra
+es el test de AC1 de `test/empaquetado/distribucion.test.ts`, que exporta HEAD
+y por tanto solo ve lo commiteado. No esta instalación.
+
+Lo mismo con `node_modules/`: también viaja en la copia, así que su presencia
+no prueba nada. Lo que sí lo prueba es que el `.package-lock.json` de la caché
+tiene el `mtime` del instante del install y no el del working tree — ahí sí
+corrió un `npm ci` de verdad, el que documenta `plugins-reference`.
+
+Lo último merece detalle, porque hasta ahora era una cita de la documentación
+que este proyecto nunca había visto ocurrir (el CI la *simula* metiendo `bin/`
+en el `PATH` a mano, que no prueba lo mismo). En el `PATH` de una sesión real
+aparecen entradas como:
+
+```
+.../.claude/plugins/cache/claude-plugins-official/figma/2.2.90/bin
+.../.claude/plugins/cache/karpathy-skills/andrej-karpathy-skills/1.0.0/bin
+```
+
+es decir, el mecanismo existe y opera sobre plugins instalados.
+
+**Lo que queda sin confirmar, y no se da por bueno**: en la sesión donde se
+hizo la instalación, `taskctl` como comando suelto seguía dando
+`command not found`, y el `bin/` de este plugin no estaba en el `PATH`. La
+explicación coherente con la evidencia es que el `PATH` se compone al arrancar
+la sesión y el plugin se instaló después — pero *eso no se ha comprobado*.
+Confirmarlo cuesta un comando en la siguiente sesión:
+
+```bash
+taskctl --version   # deberia imprimir 0.5.0 sin ruta ni node delante
+```
+
+Mientras tanto, lo que sí está probado es que el ejecutable de la caché es
+válido: con su directorio en el `PATH`, `taskctl --version` responde `0.5.0`.
+
+### Segunda limitación, específica de este repo: `core.fileMode=false`
+
+`scripts/gitflow/README.md` ya documentó que este repo tiene
+`git config core.fileMode false` porque el filesystem real bajo el bridge
+de dispositivo no preserva de forma fiable el bit `+x` — y que por eso los
+scripts de Git-Flow se invocan siempre explícitamente vía
+`bash script.sh`, nunca por ruta directa, para que el bit deje de
+importar.
+
+`bin/taskctl` no tiene ese wrapper disponible: el mecanismo de `bin/` en
+PATH de Claude Code necesita ejecutar el fichero directamente (vía su
+shebang), así que si el checkout real en Windows tampoco preserva el bit
+de ejecución, `taskctl` como comando suelto podría seguir sin funcionar
+ahí aunque Git ya lo trackee como `100755` — el fix de esta tarea corrige
+lo que Git registra (correcto y necesario para clones en Linux/macOS,
+donde sí se preserva) pero **no se ha podido confirmar por separado si un
+checkout nativo en Windows conserva el bit**. Es la misma clase de
+limitación que TASK-007 dejó abierta para los scripts `.sh`, ahora también
+aplicable a `bin/taskctl`.
+
+**Precisión encontrada en revisión por pares** (más fuerte que "no
+preserva de forma fiable"): el punto de montaje del bridge de dispositivo
+(`$HOME/mnt/TaskCode`, el que usa esta sesión para tocar el repo) no es
+que preserve el bit de ejecución de forma poco fiable — **sintetiza
+`-rwx------` para cualquier fichero por igual**, sea o no ejecutable de
+verdad. Verificado a mano:
+
+```
+$ touch taskcode-marketplace/plugins/taskcode-plugin/probe-mount.txt
+$ ls -la taskcode-marketplace/plugins/taskcode-plugin/probe-mount.txt
+-rwx------ ... probe-mount.txt        # fichero vacio recien creado: "ejecutable"
+
+$ ls -la taskcode-marketplace/plugins/taskcode-plugin/package.json
+-rwx------ ... package.json           # JSON, nunca deberia ser "ejecutable"
+```
+
+Es decir: cualquier comprobación de permisos hecha *a través de este
+mismo bridge* (incluida la que se hizo al principio de esta tarea, antes
+de mirar `git ls-files -s`) es un falso positivo garantizado y no prueba
+nada sobre el filesystem real de Windows. Lo único fiable que se pudo
+comprobar desde esta sesión es lo que Git tiene trackeado
+(`git ls-files -s`, correcto ahora) y el comportamiento en un clon nuevo
+sobre un filesystem POSIX normal (`/tmp` dentro de la VM Linux del bridge,
+fuera de `mnt/` — ver el smoke test más abajo, que sí es representativo
+de Linux/macOS/WSL). Se recomienda comprobar el checkout nativo de
+Windows en sí la próxima vez que alguien del equipo tenga una sesión
+nativa abierta ahí, no a través de este bridge:
+
+```powershell
+git clone <repo> C:\temp\check
+cd C:\temp\check
+# ¿el checkout tiene forma de marcar/perder un "bit de ejecucion" en NTFS,
+# o el concepto no aplica igual que en POSIX? Confirmar contra `bin/taskctl`
+# funcionando de verdad como comando suelto dentro de una sesion real.
+```
+
+No se ha intentado usar las herramientas de control remoto de escritorio
+disponibles en este bridge (`mcp__remote-devices__computer_*`, que
+permiten abrir una ventana real en la máquina del usuario) para hacer esta
+comprobación desde esta misma sesión. Quedó descartado por alcance/tiempo,
+no porque no fuera técnicamente posible — se deja anotado como opción más
+barata que esperar a una sesión nativa, por si alguien quiere intentarlo
+antes.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/problemas-conocidos.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/problemas-conocidos.md
new file mode 100644
index 0000000..3472273
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/problemas-conocidos.md
@@ -0,0 +1,67 @@
+# Problemas conocidos y puntos abiertos
+
+Volver al [README del plugin](../README.md).
+
+## Problemas conocidos
+
+### Un subagente se deniega con «Auto-Mode Bypass»
+
+**Síntoma.** Con Claude Code en modo de permisos automático (*auto mode*; no
+confundir con `modo_flujo: automatico` del plugin), las fases que lanzan subagentes (`plan` con
+sus roles y el unificador, `review` con los revisores) se paran porque Claude
+Code deniega el lanzamiento y cita *Auto-Mode Bypass*, sin más explicación.
+
+**Causa.** Desde Claude Code 2.1.317/2.1.318, el modo automático deniega el
+lanzamiento de un subagente cuando un hook `PreToolUse` cuyo matcher alcanza
+a `Agent` (o `Task`) reescribe el encargo. Es lo que hace, por ejemplo,
+context-mode 1.0.169, que añade un bloque al prompt de cada subagente. El
+hook puede venir de otro plugin instalado o de un `settings.json` (de
+usuario, de proyecto o `settings.local.json`).
+
+**Diagnóstico.** `taskctl doctor` (o `taskctl doctor --json`) lo detecta: da
+un AVISO con id `hooks-subagente` por cada hook `PreToolUse` cuyo matcher
+alcanza a `Agent` o `Task` (también `""`, `"*"` o sin matcher), con el origen
+(plugin o settings), la ruta del fichero y el matcher literal. Solo mira los
+plugins habilitados (`enabledPlugins`) y la versión instalada activa de cada
+uno. Es un aviso y no cambia el código de salida: el hook puede ser inocuo.
+
+**Salidas** (cualquiera de las tres):
+
+1. **Quitar `Agent` y `Task` del matcher.** Si el hook está en tus settings,
+   edítalo. Si es de un plugin, sus ficheros se sobrescriben al actualizarlo:
+   la forma estable es un hook propio de `SessionStart` en tus settings que,
+   al arrancar cada sesión, reescriba el `hooks.json` de ese plugin sin
+   `Agent` ni `Task` en el matcher.
+2. **Desactivar el plugin causante:** `"enabledPlugins": { "<plugin>@<marketplace>": false }`
+   en `settings.json`, o `/plugin` en Claude Code.
+3. **Aprobar a mano cada lanzamiento:** salir del modo de permisos
+   automático de Claude Code (por ejemplo, al modo por defecto, que pregunta)
+   mientras se lanzan los subagentes, y aprobar cada uno.
+
+Después, `taskctl doctor` debe dar `hooks-subagente` en `ok` (salvo que
+elijas la tercera salida).
+
+## Mecanismo determinista de sección 14 (punto 11): sigue sin confirmarse
+
+TASK-006 pide explícitamente (AC3) dejar constancia de que el "mecanismo
+determinista para comprobar instalación" de la sección 14 de
+`docs/PROPUESTA_METODOLOGIA.md` sigue sin confirmarse con documentación
+oficial. Cita exacta, punto 11 de esa sección: *"confirmar a mano (no dar
+por bueno sin probar) el mecanismo exacto para que `taskctl` compruebe de
+forma determinista qué plugins/skills están instalados en la máquina
+local (comando de CLI o archivo de configuración concreto) — sección 6.6,
+paso 3."*
+
+Es un punto distinto de todo lo demás documentado arriba: no es sobre que
+una persona confirme a mano que el plugin está instalado (eso es el resto
+de este README), sino sobre que **`taskctl` mismo** tenga una forma
+programática y determinista de preguntarle a Claude Code qué
+plugins/skills están instalados en la máquina — sin depender de un LLM
+para adivinarlo. La investigación de esta tarea (centrada en
+`--plugin-dir`, el schema de `plugin.json` y el mecanismo `bin/` en PATH)
+no cubrió esto, y no se ha encontrado en la documentación oficial
+consultada (`plugins-reference`, `plugins`, `plugin-marketplaces`,
+`setup`) un comando de CLI o fichero de configuración pensado para que un
+*script* (no una persona en una sesión interactiva) consulte ese estado.
+Queda registrado como sigue pendiente, sin bloquear TASK-006 — tal como
+pide el criterio de aceptación.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 4adcb3a..cc530a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -51,6 +51,7 @@ import { detectarComandosTests } from '../fs/deteccion-tests.js';
 import { hostDeRemoto, ocultarCredenciales, CLI_PLATAFORMA } from '../core/plataforma-remota.js';
 import { STATE_FOLDER, TASK_STATES, isValidTaskId } from '../core/task.js';
 import { parseTareaFile } from '../core/tarea-file.js';
+import { diaLocal, evaluarDocumentoEstado, type TareaTerminadaFecha } from '../core/documento-estado.js';
 import { resolveGitflowScriptsDir, sondearBash } from '../fs/gitflow-runner.js';
 import { urlsDeOrigin } from '../fs/git.js';
 import { sondearCli } from '../fs/merge-request.js';
@@ -100,7 +101,10 @@ export interface DoctorCommandDeps {
   configClaudeDir?: string;
   /** TASK-110: entorno donde se busca taskctl en el PATH (por defecto el del proceso). Para los tests. */
   env?: NodeJS.ProcessEnv;
-  /** TASK-110: instante de la copia de seguridad de settings.json (por defecto ahora). Para los tests. */
+  /**
+   * TASK-110: instante de la copia de seguridad de settings.json (por defecto ahora).
+   * TASK-124: tambien el "hoy" con que se mide la antiguedad de documento_estado. Para los tests.
+   */
   ahora?: Date;
 }
 
@@ -613,6 +617,62 @@ function comprobarTareas(tareasRoot: string): Comprobacion[] {
   return [ok('tareas', total === 0 ? 'no hay tareas todavia' : `${total} ${total === 1 ? 'tarea' : 'tareas'}: todas legibles y en la carpeta de su estado`)];
 }
 
+// ---------------------------------------------------------------------
+// Documento de estado (TASK-124)
+// ---------------------------------------------------------------------
+
+/** `id` y `actualizado` de las tareas de 04-terminadas; las que no se pueden leer se saltan (las cuenta `tareas`). */
+function leerTerminadas(tareasRoot: string): TareaTerminadaFecha[] {
+  const dir = path.join(tareasRoot, STATE_FOLDER.terminada);
+  let entradas: string[];
+  try {
+    entradas = readdirSync(dir);
+  } catch {
+    return [];
+  }
+  const terminadas: TareaTerminadaFecha[] = [];
+  for (const id of entradas) {
+    if (!isValidTaskId(id)) continue;
+    try {
+      const task = parseTareaFile(readFileSync(path.join(dir, id, 'tarea.md'), 'utf8')).task;
+      terminadas.push({ id, actualizado: task.actualizado });
+    } catch {
+      // Rota o ilegible: ya la senala la comprobacion `tareas`.
+    }
+  }
+  return terminadas;
+}
+
+/**
+ * La fecha del documento es la de su ultimo commit (`%cI`), no el mtime: el
+ * mtime cambia al clonar o al cambiar de rama y no dice cuando se escribio.
+ */
+export function comprobarDocumentoEstado(
+  cwd: string,
+  cfg: TaskcodeConfig | null,
+  repo: EstadoRepo,
+  ahora: Date
+): Comprobacion {
+  if (cfg === null) return omitida('documento-estado', 'la config no se pudo leer (ver config)');
+  const ruta = cfg.documento_estado;
+  const existe = ruta !== null && existsSync(path.join(cwd, ruta));
+  let fecha: string | null = null;
+  if (ruta !== null && existe && repo.conCommits) {
+    const r = git(['log', '-1', '--format=%cI', '--', ruta], cwd);
+    if (r.error !== undefined || r.status !== 0) {
+      throw new Error(`git log -- ${ruta} fallo: ${r.error?.message ?? r.stderr}`);
+    }
+    fecha = r.stdout === '' ? null : r.stdout;
+  }
+  return evaluarDocumentoEstado({
+    ruta,
+    existe,
+    fechaUltimoCommit: fecha,
+    hoy: diaLocal(ahora),
+    terminadas: ruta !== null && existe && fecha !== null ? leerTerminadas(path.join(cwd, 'tareas')) : [],
+  });
+}
+
 // ---------------------------------------------------------------------
 // Plataforma (gh / glab)
 // ---------------------------------------------------------------------
@@ -837,6 +897,7 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
   cs.push(...envolver('verificacion', () => comprobarVerificacion(cfg, () => detectarComandosTests(cwd))));
   cs.push(...envolver('verificacion-selectiva', () => comprobarVerificacionSelectiva(cfg)));
   cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
+  cs.push(...envolver('documento-estado', () => comprobarDocumentoEstado(cwd, cfg, repo, deps.ahora ?? new Date())));
   cs.push(
     ...envolver('plataforma', () =>
       comprobarPlataforma(cwd, cfg, hayOrigin, deps.timeoutPlataformaMs ?? TIMEOUT_PLATAFORMA_MS)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 4f26cea..779b7ac 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -26,6 +26,7 @@
  * | umbral_cobertura             | null (solo informa) | commands/finish-cobertura.ts (TASK-074) |
  * | rutas_documentacion          | [] (sin efecto)   | finish-verificacion.ts (TASK-100), hooks/guardia-merge.ts (TASK-101) |
  * | comando_verificacion_documentacion | null        | finish-verificacion.ts (TASK-100), guardia-merge.ts (TASK-101) |
+ * | documento_estado             | null (no se vigila) | commands/doctor.ts (TASK-124) |
  * | rutas_verificacion_parcial   | [] (sin nivel 2)  | core/verificacion-proporcional.ts (TASK-096); la decision la aplican fs/decision-documentacion.ts, finish-verificacion.ts, freno-stop.ts, review.ts y guardia-merge.ts (TASK-105..108); doctor.ts avisa (TASK-109) |
  *
  * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
@@ -242,6 +243,13 @@ export interface TaskcodeConfig {
    * Exige comando_verificacion_selectiva.
    */
   rutas_verificacion_parcial: readonly string[];
+  /**
+   * TASK-124: ruta, relativa a la raiz del repo, del documento que resume el
+   * estado del proyecto. null = no se vigila ninguno. Solo la lee `doctor`,
+   * que avisa si lleva mas de 14 dias sin commits o va por detras de las
+   * tareas terminadas.
+   */
+  documento_estado: string | null;
 }
 
 export const PLATAFORMAS_REMOTAS: readonly Plataforma[] = ['github', 'gitlab'];
@@ -286,6 +294,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   rutas_documentacion: Object.freeze([]) as readonly string[],
   comando_verificacion_documentacion: null,
   rutas_verificacion_parcial: Object.freeze([]) as readonly string[],
+  documento_estado: null,
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -312,6 +321,7 @@ export const CLAVES_CONFIG = [
   'rutas_documentacion',
   'comando_verificacion_documentacion',
   'rutas_verificacion_parcial',
+  'documento_estado',
 ] as const;
 
 /**
@@ -604,6 +614,9 @@ export function parsearConfigConAvisos(
       case 'informe_cobertura':
         config.informe_cobertura = validarInformeCobertura(donde, par.valor);
         break;
+      case 'documento_estado':
+        config.documento_estado = validarDocumentoEstado(donde, par.valor);
+        break;
       case 'umbral_cobertura':
         config.umbral_cobertura = validarUmbralCobertura(donde, par.valor);
         break;
@@ -849,6 +862,24 @@ function validarInformeCobertura(donde: string, valor: unknown): string {
   return path.posix.normalize(texto.replace(/\\/g, '/'));
 }
 
+/**
+ * TASK-124: ruta de un fichero relativa a la raiz del repo, con las mismas
+ * reglas que las de sincronizacion (no absoluta, no carpeta, no fuera del repo,
+ * no bajo .git/ ni .taskcode/; de tareas/ solo un fichero suelto en su raiz).
+ */
+function validarDocumentoEstado(donde: string, valor: unknown): string {
+  const texto = validarTextoNoVacio(donde, 'documento_estado', valor);
+  const motivo = motivoRutaInvalida(texto, { ficheroEnRaizDeTareas: true });
+  if (motivo !== null) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "documento_estado" "${texto}" no vale: ${motivo}.
+` +
+        '        Es la ruta del documento de estado del proyecto relativa a la raiz del repo, p. ej. documento_estado: docs/ESTADO.md.'
+    );
+  }
+  return path.posix.normalize(texto.replace(/\\/g, '/'));
+}
+
 /** Numero de 0 a 100 (admite decimales). */
 function validarUmbralCobertura(donde: string, valor: unknown): number {
   // El parser de bloques solo convierte enteros: `87.5` llega como texto.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/documento-estado.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/documento-estado.ts
new file mode 100644
index 0000000..cf5b259
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/documento-estado.ts
@@ -0,0 +1,133 @@
+/**
+ * Nucleo puro de la comprobacion `documento-estado` de `taskctl doctor`
+ * (TASK-124, parte c). Decide si el documento de estado que declara la clave
+ * `documento_estado` esta al dia; no toca disco ni lanza procesos (la fecha del
+ * ultimo commit y las tareas terminadas las lee commands/doctor.ts).
+ *
+ * Reglas:
+ *
+ * - Sin la clave: `omitida`. El plugin no presupone ningun documento.
+ * - El fichero no existe o no tiene commits: `aviso`.
+ * - La fecha del documento es la del ultimo commit que lo toca (no el mtime,
+ *   que cambia al clonar o al cambiar de rama), y se compara por DIA de
+ *   calendario: el dia que escribe `%cI` (el del committer) contra el dia local
+ *   de "hoy".
+ * - Borde de antiguedad: hasta 14 dias de diferencia es `ok`; 15 o mas dias
+ *   completos, `aviso` (`DIAS_MAXIMOS_DOCUMENTO_ESTADO`).
+ * - Va por detras si alguna tarea terminada tiene `actualizado` ESTRICTAMENTE
+ *   posterior al dia del documento (el mismo dia no cuenta: se cierra la tarea
+ *   y se actualiza el documento en la misma jornada).
+ */
+import { aviso, ok, omitida, type Comprobacion } from './doctor.js';
+
+export const ID_DOCUMENTO_ESTADO = 'documento-estado';
+
+/** Dias de antiguedad que se toleran; con uno mas, aviso. */
+export const DIAS_MAXIMOS_DOCUMENTO_ESTADO = 14;
+
+export interface TareaTerminadaFecha {
+  id: string;
+  /** Campo `actualizado` del frontmatter (AAAA-MM-DD; si trae hora, se mira solo el dia). */
+  actualizado: string;
+}
+
+export interface EntradaDocumentoEstado {
+  /** Valor de la clave `documento_estado`; null si no se declara. */
+  ruta: string | null;
+  /** true si la ruta existe en el arbol de trabajo. */
+  existe: boolean;
+  /** Fecha `%cI` del ultimo commit que toca el fichero; null si no tiene ninguno. */
+  fechaUltimoCommit: string | null;
+  /** Dia de hoy, AAAA-MM-DD (local). */
+  hoy: string;
+  terminadas: readonly TareaTerminadaFecha[];
+}
+
+const DIA = /^(\d{4})-(\d{2})-(\d{2})/;
+
+/** El dia AAAA-MM-DD con que empieza el texto, o null si no empieza por uno valido. */
+export function diaDe(texto: string): string | null {
+  const m = DIA.exec(texto.trim());
+  if (m === null) return null;
+  const [, a, me, d] = m;
+  const t = Date.UTC(Number(a), Number(me) - 1, Number(d));
+  // Rechaza 2026-02-30 y similares: Date.UTC los desborda al mes siguiente.
+  if (new Date(t).toISOString().slice(0, 10) !== `${a}-${me}-${d}`) return null;
+  return `${a}-${me}-${d}`;
+}
+
+/** Dia local (AAAA-MM-DD) de un instante. */
+export function diaLocal(fecha: Date): string {
+  const p = (n: number): string => String(n).padStart(2, '0');
+  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
+}
+
+/** Dias de calendario de `desde` a `hasta` (ambos AAAA-MM-DD); negativo si `hasta` es anterior. */
+export function diasEntre(desde: string, hasta: string): number {
+  const ms = (dia: string): number => {
+    const [a, m, d] = dia.split('-').map(Number) as [number, number, number];
+    return Date.UTC(a, m - 1, d);
+  };
+  return Math.round((ms(hasta) - ms(desde)) / 86_400_000);
+}
+
+/** Tareas con `actualizado` estrictamente posterior a `dia`, de la mas reciente a la mas antigua. */
+export function terminadasPosteriores(
+  terminadas: readonly TareaTerminadaFecha[],
+  dia: string
+): { id: string; dia: string }[] {
+  const posteriores: { id: string; dia: string }[] = [];
+  for (const t of terminadas) {
+    const d = diaDe(t.actualizado);
+    if (d !== null && d > dia) posteriores.push({ id: t.id, dia: d });
+  }
+  return posteriores.sort((x, y) => (x.dia === y.dia ? y.id.localeCompare(x.id) : y.dia.localeCompare(x.dia)));
+}
+
+/** La comprobacion `documento-estado` a partir de lo que ya se ha leido. */
+export function evaluarDocumentoEstado(e: EntradaDocumentoEstado): Comprobacion {
+  const id = ID_DOCUMENTO_ESTADO;
+  if (e.ruta === null) {
+    return omitida(id, 'no se declara documento_estado en .taskcode/config.yml; no se vigila ningun documento');
+  }
+  const ruta = e.ruta;
+  if (!e.existe) {
+    return aviso(
+      id,
+      `${ruta}, declarado en documento_estado, no existe`,
+      `Crea ${ruta} y commitealo, o corrige documento_estado en .taskcode/config.yml (o borra la clave).`
+    );
+  }
+  const dia = e.fechaUltimoCommit === null ? null : diaDe(e.fechaUltimoCommit);
+  if (dia === null) {
+    return aviso(
+      id,
+      `${ruta} no tiene ningun commit: no hay fecha con la que medir si esta al dia`,
+      `Commitea ${ruta}: git add ${ruta} && git commit -m "docs: estado del proyecto"`
+    );
+  }
+  const dias = diasEntre(dia, e.hoy);
+  const posteriores = terminadasPosteriores(e.terminadas, dia);
+  const problemas: string[] = [];
+  if (dias > DIAS_MAXIMOS_DOCUMENTO_ESTADO) {
+    problemas.push(`lleva ${dias} dias sin actualizarse (ultimo commit: ${dia}; se toleran ${DIAS_MAXIMOS_DOCUMENTO_ESTADO})`);
+  }
+  if (posteriores.length > 0) {
+    const ultima = posteriores[0] as { id: string; dia: string };
+    const n = posteriores.length;
+    problemas.push(
+      `va por detras de ${n} ${n === 1 ? 'tarea terminada' : 'tareas terminadas'} despues de su ultimo commit` +
+        // Si ya se ha dicho la fecha en el motivo de antiguedad, no se repite.
+        `${problemas.length === 0 ? ` (${dia})` : ''}; la mas reciente, ${ultima.id} (${ultima.dia})`
+    );
+  }
+  if (problemas.length > 0) {
+    return aviso(
+      id,
+      `${ruta} ${problemas.join('; y ')}`,
+      `Repasa ${ruta} con lo cerrado desde ${dia} y commitealo.`
+    );
+  }
+  const hace = dias <= 0 ? 'hoy' : dias === 1 ? 'hace 1 dia' : `hace ${dias} dias`;
+  return ok(id, `${ruta} al dia: ultimo commit ${dia} (${hace}) y ninguna tarea terminada despues`);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-documento-estado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-documento-estado.test.ts
new file mode 100644
index 0000000..84303fe
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-documento-estado.test.ts
@@ -0,0 +1,161 @@
+/**
+ * TASK-124: la comprobacion `documento-estado` de `taskctl doctor` contra repos
+ * Git temporales de verdad. Los commits se fechan con GIT_COMMITTER_DATE y
+ * GIT_AUTHOR_DATE, y "hoy" se inyecta con `deps.ahora`, asi que el resultado no
+ * depende del dia en que se corra. La logica (dias, borde de 14, mensajes) se
+ * prueba sin Git en test/core/documento-estado.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { runDoctorCommand } from '../../src/commands/doctor.js';
+import type { Comprobacion } from '../../src/core/doctor.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { STATE_FOLDER } from '../../src/core/task.js';
+import { git, sampleTask } from '../helpers/finish-fixtures.js';
+import { plantillaRepo } from '../helpers/repo-plantilla.js';
+
+const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
+const SIN_CONFIG_CLAUDE = path.join(tmpdir(), 'taskctl-doctor-sin-config-claude-no-existe');
+/** "Hoy" de todos los tests: 2026-11-12 a mediodia, hora local. */
+const AHORA = new Date(2026, 10, 12, 12, 0, 0);
+const DOC = 'docs/ESTADO.md';
+
+const conRepo = plantillaRepo('taskctl-doctor-estado-', async (repoRoot) => {
+  git(['init', '-q', '-b', 'main'], repoRoot);
+  git(['config', 'user.email', 'test@example.com'], repoRoot);
+  git(['config', 'user.name', 'Test'], repoRoot);
+  for (const c of Object.values(STATE_FOLDER)) {
+    await mkdir(path.join(repoRoot, 'tareas', c), { recursive: true });
+    await writeFile(path.join(repoRoot, 'tareas', c, '.gitkeep'), '', 'utf8');
+  }
+  await writeFile(path.join(repoRoot, 'README.md'), '# proyecto\n', 'utf8');
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', 'inicial'], repoRoot);
+  git(['checkout', '-q', '-b', 'develop'], repoRoot);
+});
+
+/** Commit de todo lo pendiente con fecha local `fecha` (AAAA-MM-DDTHH:MM:SS, sin zona: Git la toma como local). */
+function commitFechado(repoRoot: string, mensaje: string, fecha: string): void {
+  git(['add', '-A'], repoRoot);
+  const r = spawnSync('git', ['commit', '-q', '-m', mensaje], {
+    cwd: repoRoot,
+    encoding: 'utf8',
+    env: { ...process.env, GIT_COMMITTER_DATE: fecha, GIT_AUTHOR_DATE: fecha },
+  });
+  assert.equal(r.status, 0, `git commit fallo: ${r.stderr}`);
+}
+
+async function escribir(repoRoot: string, rel: string, texto: string): Promise<void> {
+  await mkdir(path.dirname(path.join(repoRoot, rel)), { recursive: true });
+  await writeFile(path.join(repoRoot, rel), texto, 'utf8');
+}
+
+async function conDocumento(repoRoot: string, fecha: string): Promise<void> {
+  await escribir(repoRoot, '.taskcode/config.yml', `documento_estado: ${DOC}\n`);
+  await escribir(repoRoot, DOC, '# Estado\n');
+  commitFechado(repoRoot, 'docs: estado', fecha);
+}
+
+async function terminada(repoRoot: string, id: string, actualizado: string): Promise<void> {
+  const task = sampleTask({ id, estado: 'terminada', rama: `feature/${id.toLowerCase()}-x`, actualizado });
+  await escribir(repoRoot, `tareas/${STATE_FOLDER.terminada}/${id}/tarea.md`, serializeTareaFile(task, '## Objetivo\nx\n'));
+}
+
+function documentoEstado(repoRoot: string): Comprobacion {
+  const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: SIN_CONFIG_CLAUDE, ahora: AHORA });
+  const c = r.comprobaciones.find((x) => x.id === 'documento-estado');
+  assert.ok(c, `no hay documento-estado; hay: ${r.comprobaciones.map((x) => x.id).join(', ')}`);
+  assert.equal(r.comprobaciones.filter((x) => x.id === 'documento-estado').length, 1);
+  return c;
+}
+
+test('documento-estado: sin la clave, omitida (no se presupone ningun documento)', async () => {
+  await conRepo(async (repoRoot) => {
+    await escribir(repoRoot, DOC, '# Estado\n');
+    commitFechado(repoRoot, 'docs: estado', '2026-09-01T12:00:00');
+    const c = documentoEstado(repoRoot);
+    assert.equal(c.nivel, 'omitida', c.mensaje);
+    assert.equal(c.arreglo, null);
+  });
+});
+
+test('documento-estado: ruta declarada que no existe, aviso con arreglo', async () => {
+  await conRepo(async (repoRoot) => {
+    await escribir(repoRoot, '.taskcode/config.yml', 'documento_estado: docs/NO-EXISTE.md\n');
+    commitFechado(repoRoot, 'config', '2026-11-12T10:00:00');
+    const c = documentoEstado(repoRoot);
+    assert.equal(c.nivel, 'aviso', c.mensaje);
+    assert.match(c.mensaje, /docs\/NO-EXISTE\.md, declarado en documento_estado, no existe/);
+    assert.match(c.arreglo ?? '', /Crea docs\/NO-EXISTE\.md/);
+  });
+});
+
+test('documento-estado: existe pero sin commits, aviso', async () => {
+  await conRepo(async (repoRoot) => {
+    await escribir(repoRoot, '.taskcode/config.yml', `documento_estado: ${DOC}\n`);
+    commitFechado(repoRoot, 'config', '2026-11-12T10:00:00');
+    await escribir(repoRoot, DOC, '# Estado sin commitear\n');
+    const c = documentoEstado(repoRoot);
+    assert.equal(c.nivel, 'aviso', c.mensaje);
+    assert.match(c.mensaje, /no tiene ningun commit/);
+  });
+});
+
+test('documento-estado: ultimo commit de hace 20 dias, aviso aunque el mtime sea de hoy', async () => {
+  await conRepo(async (repoRoot) => {
+    await conDocumento(repoRoot, '2026-10-23T12:00:00');
+    // Se reescribe con el mismo contenido: mtime de hoy, ningun commit nuevo.
+    await escribir(repoRoot, DOC, '# Estado\n');
+    const c = documentoEstado(repoRoot);
+    assert.equal(c.nivel, 'aviso', c.mensaje);
+    assert.match(c.mensaje, /lleva 20 dias sin actualizarse \(ultimo commit: 2026-10-23; se toleran 14\)/);
+    assert.match(c.arreglo ?? '', /Repasa docs\/ESTADO\.md con lo cerrado desde 2026-10-23/);
+  });
+});
+
+test('documento-estado: al dia (commit de hace 14 dias, ninguna tarea despues), ok con la fecha', async () => {
+  await conRepo(async (repoRoot) => {
+    await terminada(repoRoot, 'TASK-001', '2026-10-29');
+    await conDocumento(repoRoot, '2026-10-29T12:00:00');
+    // Un commit posterior que no toca el documento no cambia su fecha.
+    await escribir(repoRoot, 'otro.txt', 'x\n');
+    commitFechado(repoRoot, 'otro', '2026-11-11T12:00:00');
+    const c = documentoEstado(repoRoot);
+    assert.equal(c.nivel, 'ok', c.mensaje);
+    assert.equal(c.mensaje, 'docs/ESTADO.md al dia: ultimo commit 2026-10-29 (hace 14 dias) y ninguna tarea terminada despues');
+  });
+});
+
+test('documento-estado: tareas terminadas despues del ultimo commit, aviso con cuantas y la mas reciente', async () => {
+  await conRepo(async (repoRoot) => {
+    await conDocumento(repoRoot, '2026-11-09T12:00:00');
+    await terminada(repoRoot, 'TASK-002', '2026-11-10');
+    await terminada(repoRoot, 'TASK-003', '2026-11-11');
+    commitFechado(repoRoot, 'tareas', '2026-11-11T12:00:00');
+    const c = documentoEstado(repoRoot);
+    assert.equal(c.nivel, 'aviso', c.mensaje);
+    assert.match(c.mensaje, /va por detras de 2 tareas terminadas despues de su ultimo commit \(2026-11-09\); la mas reciente, TASK-003 \(2026-11-11\)/);
+  });
+});
+
+test('documento-estado: sale en --json como las demas (CLI real)', async () => {
+  await conRepo(async (repoRoot) => {
+    await conDocumento(repoRoot, '2026-10-01T12:00:00');
+    const r = spawnSync(process.execPath, [TASKCTL, 'doctor', '--json'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+      env: { ...process.env, CLAUDE_CONFIG_DIR: SIN_CONFIG_CLAUDE },
+    });
+    const salida = JSON.parse(r.stdout) as { comprobaciones: Comprobacion[] };
+    const c = salida.comprobaciones.find((x) => x.id === 'documento-estado');
+    assert.ok(c, r.stdout);
+    // Con el reloj real el commit de 2026-10-01 tiene mas de 14 dias.
+    assert.equal(c.nivel, 'aviso', c.mensaje);
+    assert.match(c.mensaje, /ultimo commit: 2026-10-01/);
+    assert.equal(typeof c.arreglo, 'string');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
index 2732c67..6740159 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-hooks-subagente.test.ts
@@ -253,9 +253,9 @@ test('CLI --json: el aviso lleva el id estable hooks-subagente, nivel aviso y ar
 
 const PLUGIN_ROOT = path.join(import.meta.dirname, '..', '..', '..');
 
-test('README: Problemas conocidos con sintoma, causa, diagnostico y las tres salidas', async () => {
+test('docs/problemas-conocidos.md (enlazado desde el README): Problemas conocidos con sintoma, causa, diagnostico y las tres salidas', async () => {
   const { readFile } = await import('node:fs/promises');
-  const readme = await readFile(path.join(PLUGIN_ROOT, 'README.md'), 'utf8');
+  const readme = await readFile(path.join(PLUGIN_ROOT, 'docs', 'problemas-conocidos.md'), 'utf8');
   const i = readme.indexOf('## Problemas conocidos');
   assert.ok(i >= 0, 'falta la seccion "## Problemas conocidos"');
   const seccion = readme.slice(i, readme.indexOf('\n## ', i + 1));
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-documento-estado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-documento-estado.test.ts
new file mode 100644
index 0000000..b6e80c4
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config-documento-estado.test.ts
@@ -0,0 +1,54 @@
+/**
+ * TASK-124: la clave `documento_estado`. Solo parsearConfig (logica pura, sin
+ * disco ni Git): ruta de un fichero relativa a la raiz del repo, con las reglas
+ * de las rutas de sincronizacion. Quien la usa (doctor) se prueba en
+ * test/commands/doctor-documento-estado.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { CLAVES_CONFIG, CONFIG_DEFAULTS, ConfigError, parsearConfig, parsearConfigConAvisos } from '../../src/core/config.js';
+
+const RUTA = '/repo/.taskcode/config.yml';
+
+function rechaza(contenido: string, patron: RegExp): void {
+  assert.throws(
+    () => parsearConfig(contenido, RUTA),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError, String(e));
+      assert.match(e.message, /documento_estado/);
+      assert.match(e.message, patron);
+      return true;
+    },
+    `deberia rechazar:\n${contenido}`
+  );
+}
+
+test('documento_estado: es clave conocida y sin ella vale null (no se vigila nada)', () => {
+  assert.ok((CLAVES_CONFIG as readonly string[]).includes('documento_estado'));
+  assert.equal(CONFIG_DEFAULTS.documento_estado, null);
+  assert.equal(parsearConfig('', RUTA).documento_estado, null);
+  assert.equal(parsearConfigConAvisos('documento_estado: docs/ESTADO.md\n', RUTA).avisos.length, 0);
+});
+
+test('documento_estado: una ruta relativa valida se normaliza a separadores POSIX', () => {
+  assert.equal(parsearConfig('documento_estado: docs/ESTADO.md\n', RUTA).documento_estado, 'docs/ESTADO.md');
+  assert.equal(parsearConfig('documento_estado: docs\\estado\\ESTADO.md\n', RUTA).documento_estado, 'docs/estado/ESTADO.md');
+  assert.equal(parsearConfig('documento_estado: ./docs/../ESTADO.md\n', RUTA).documento_estado, 'ESTADO.md');
+  // De tareas/, un fichero suelto en su raiz (como tareas/ROADMAP.md).
+  assert.equal(parsearConfig('documento_estado: tareas/ESTADO.md\n', RUTA).documento_estado, 'tareas/ESTADO.md');
+});
+
+test('documento_estado: vacia, absoluta, fuera del repo, carpeta o de la herramienta aborta', () => {
+  rechaza('documento_estado:\n', /no puede estar vacia/);
+  rechaza('documento_estado: ""\n', /no puede estar vacia/);
+  rechaza('documento_estado: /etc/ESTADO.md\n', /es absoluta/);
+  rechaza('documento_estado: C:/ESTADO.md\n', /es absoluta/);
+  rechaza('documento_estado: ../otro/ESTADO.md\n', /se sale del repo/);
+  rechaza('documento_estado: docs/../../ESTADO.md\n', /se sale del repo/);
+  rechaza('documento_estado: docs/\n', /es una carpeta/);
+  rechaza('documento_estado: .\n', /es la raiz del repo/);
+  rechaza('documento_estado: .git/ESTADO.md\n', /\.git\//);
+  rechaza('documento_estado: .taskcode/ESTADO.md\n', /\.taskcode\//);
+  rechaza('documento_estado: tareas/04-terminadas/ESTADO.md\n', /carpeta de estado/);
+  rechaza('documento_estado: 3\n', /debe ser texto/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/documento-estado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/documento-estado.test.ts
new file mode 100644
index 0000000..f153180
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/documento-estado.test.ts
@@ -0,0 +1,144 @@
+/**
+ * TASK-124: nucleo puro de la comprobacion `documento-estado` de doctor. Sin
+ * Git ni disco: la fecha del commit, "hoy" y las tareas terminadas llegan ya
+ * leidas. La lectura real se prueba en test/commands/doctor-documento-estado.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  DIAS_MAXIMOS_DOCUMENTO_ESTADO,
+  diaDe,
+  diaLocal,
+  diasEntre,
+  evaluarDocumentoEstado,
+  terminadasPosteriores,
+  type EntradaDocumentoEstado,
+} from '../../src/core/documento-estado.js';
+
+const HOY = '2026-11-12';
+
+function entrada(extra: Partial<EntradaDocumentoEstado> = {}): EntradaDocumentoEstado {
+  return {
+    ruta: 'docs/ESTADO.md',
+    existe: true,
+    fechaUltimoCommit: '2026-11-10T09:30:00+01:00',
+    hoy: HOY,
+    terminadas: [],
+    ...extra,
+  };
+}
+
+/** Fecha %cI de hace `n` dias respecto a HOY (a ultima hora: se mide por dia, no por horas). */
+function haceDias(n: number): string {
+  const d = new Date(Date.UTC(2026, 10, 12) - n * 86_400_000);
+  return `${d.toISOString().slice(0, 10)}T23:59:00+01:00`;
+}
+
+test('diaDe: el dia con que empieza el texto; null si no es una fecha valida', () => {
+  assert.equal(diaDe('2026-11-10T09:30:00+01:00'), '2026-11-10');
+  assert.equal(diaDe('2026-09-05'), '2026-09-05');
+  assert.equal(diaDe(' 2026-09-05 '), '2026-09-05');
+  assert.equal(diaDe('2026-02-30'), null);
+  assert.equal(diaDe('ayer'), null);
+  assert.equal(diaDe(''), null);
+});
+
+test('diaLocal: el dia del calendario local del instante', () => {
+  assert.equal(diaLocal(new Date(2026, 0, 5, 12, 0, 0)), '2026-01-05');
+  assert.equal(diaLocal(new Date(2026, 11, 31, 23, 59, 0)), '2026-12-31');
+});
+
+test('diasEntre: dias de calendario, atravesando meses, anos y el cambio de hora', () => {
+  assert.equal(diasEntre('2026-11-12', '2026-11-12'), 0);
+  assert.equal(diasEntre('2026-10-29', '2026-11-12'), 14);
+  assert.equal(diasEntre('2025-12-31', '2026-01-01'), 1);
+  assert.equal(diasEntre('2026-03-28', '2026-03-30'), 2);
+  assert.equal(diasEntre('2026-11-13', '2026-11-12'), -1);
+});
+
+test('sin la clave: omitida, sin arreglo', () => {
+  const c = evaluarDocumentoEstado(entrada({ ruta: null }));
+  assert.equal(c.id, 'documento-estado');
+  assert.equal(c.nivel, 'omitida');
+  assert.equal(c.arreglo, null);
+  assert.match(c.mensaje, /no se declara documento_estado/);
+});
+
+test('ruta inexistente: aviso con el arreglo concreto', () => {
+  const c = evaluarDocumentoEstado(entrada({ existe: false }));
+  assert.equal(c.nivel, 'aviso');
+  assert.match(c.mensaje, /docs\/ESTADO\.md, declarado en documento_estado, no existe/);
+  assert.match(c.arreglo ?? '', /Crea docs\/ESTADO\.md y commitealo/);
+});
+
+test('sin commits (o fecha ilegible): aviso que pide commitearlo', () => {
+  for (const fecha of [null, 'basura']) {
+    const c = evaluarDocumentoEstado(entrada({ fechaUltimoCommit: fecha }));
+    assert.equal(c.nivel, 'aviso', String(fecha));
+    assert.match(c.mensaje, /no tiene ningun commit/);
+    assert.match(c.arreglo ?? '', /git add docs\/ESTADO\.md/);
+  }
+});
+
+test('borde de antiguedad: 13 y 14 dias son ok; 15 es aviso', () => {
+  assert.equal(DIAS_MAXIMOS_DOCUMENTO_ESTADO, 14);
+  const c13 = evaluarDocumentoEstado(entrada({ fechaUltimoCommit: haceDias(13) }));
+  const c14 = evaluarDocumentoEstado(entrada({ fechaUltimoCommit: haceDias(14) }));
+  const c15 = evaluarDocumentoEstado(entrada({ fechaUltimoCommit: haceDias(15) }));
+  assert.equal(c13.nivel, 'ok', c13.mensaje);
+  assert.equal(c14.nivel, 'ok', c14.mensaje);
+  assert.match(c14.mensaje, /hace 14 dias/);
+  assert.equal(c15.nivel, 'aviso', c15.mensaje);
+  assert.match(c15.mensaje, /lleva 15 dias sin actualizarse \(ultimo commit: 2026-10-28; se toleran 14\)/);
+  assert.match(c15.arreglo ?? '', /Repasa docs\/ESTADO\.md con lo cerrado desde 2026-10-28 y commitealo/);
+});
+
+test('al dia: ok con la fecha; hoy y hace 1 dia se dicen asi', () => {
+  const hoy = evaluarDocumentoEstado(entrada({ fechaUltimoCommit: `${HOY}T08:00:00+01:00` }));
+  assert.equal(hoy.nivel, 'ok');
+  assert.equal(hoy.arreglo, null);
+  assert.equal(hoy.mensaje, `docs/ESTADO.md al dia: ultimo commit ${HOY} (hoy) y ninguna tarea terminada despues`);
+  assert.match(evaluarDocumentoEstado(entrada({ fechaUltimoCommit: haceDias(1) })).mensaje, /\(hace 1 dia\)/);
+});
+
+test('tareas terminadas despues del documento: aviso con cuantas y la mas reciente', () => {
+  const c = evaluarDocumentoEstado(
+    entrada({
+      terminadas: [
+        { id: 'TASK-001', actualizado: '2026-11-01' },
+        { id: 'TASK-002', actualizado: '2026-11-10' }, // el mismo dia: no cuenta
+        { id: 'TASK-003', actualizado: '2026-11-11' },
+        { id: 'TASK-004', actualizado: '2026-11-12' },
+        { id: 'TASK-005', actualizado: 'roto' },
+      ],
+    })
+  );
+  assert.equal(c.nivel, 'aviso');
+  assert.equal(
+    c.mensaje,
+    'docs/ESTADO.md va por detras de 2 tareas terminadas despues de su ultimo commit (2026-11-10); ' +
+      'la mas reciente, TASK-004 (2026-11-12)'
+  );
+});
+
+test('una sola tarea posterior, en singular; antiguo y por detras, los dos motivos', () => {
+  const una = evaluarDocumentoEstado(entrada({ terminadas: [{ id: 'TASK-009', actualizado: '2026-11-11' }] }));
+  assert.match(una.mensaje, /va por detras de 1 tarea terminada despues/);
+  const ambos = evaluarDocumentoEstado(
+    entrada({ fechaUltimoCommit: haceDias(20), terminadas: [{ id: 'TASK-009', actualizado: '2026-11-11' }] })
+  );
+  assert.equal(ambos.nivel, 'aviso');
+  assert.match(ambos.mensaje, /lleva 20 dias sin actualizarse .*; y va por detras de 1 tarea terminada/);
+});
+
+test('terminadasPosteriores: ordena de la mas reciente a la mas antigua y mira solo el dia', () => {
+  const r = terminadasPosteriores(
+    [
+      { id: 'TASK-001', actualizado: '2026-11-11' },
+      { id: 'TASK-003', actualizado: '2026-11-12T10:00:00' },
+      { id: 'TASK-002', actualizado: '2026-11-12' },
+    ],
+    '2026-11-10'
+  );
+  assert.deepEqual(r.map((t) => t.id), ['TASK-003', 'TASK-002', 'TASK-001']);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
index f02b3ae..79d1719 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
@@ -258,11 +258,12 @@ test('ningun fichero de dist/src commiteado lleva CR', (t) => {
 // Claude Code, Windows no sabe ejecutarlo. Dos vias, una por shell:
 //
 // - cmd: `bin/taskctl.cmd`, con los argumentos entre comillas dobles.
-// - PowerShell: la funcion de perfil del README, que llama a node SIN pasar
+// - PowerShell: la funcion de perfil de la documentacion del plugin
+//   (docs/instalacion-y-distribucion.md, enlazada desde el README), que llama a node SIN pasar
 //   por cmd. NO el .cmd: PowerShell 5.1 pasa sin comillas los argumentos
 //   sin espacios, y cmd.exe interpreta `Q&A` o `x>f` (CRIT-1 de la revision:
 //   ejecutaba comandos y vaciaba ficheros). El test de PowerShell ejecuta el
-//   fragmento del README TAL CUAL, para que la documentacion no pueda
+//   fragmento de la documentacion TAL CUAL, para que la documentacion no pueda
 //   desviarse de lo probado.
 //
 // Todo sobre el arbol de HEAD exportado, sin npm install. Solo en Windows;
@@ -335,15 +336,16 @@ function desdeCmd(cmdPath: string, args: string[], cwd?: string) {
 }
 
 /**
- * La funcion de perfil de PowerShell, extraida del propio README y apuntada
+ * La funcion de perfil de PowerShell, extraida de la documentacion del plugin
+ * (docs/instalacion-y-distribucion.md; el README la enlaza) y apuntada
  * a una cache falsa: `<cache>/9.9.9` es un junction a la raiz del plugin
  * exportado, y `0.1.0-rc.1` un directorio que la funcion debe ignorar sin
  * error (MEN-4).
  */
 async function funcionPowerShellDelReadme(cache: string): Promise<string> {
-  const readme = (await readFile(path.join(PLUGIN_ROOT, 'README.md'), 'utf8')).replace(/\r\n/g, '\n');
+  const readme = (await readFile(path.join(PLUGIN_ROOT, 'docs', 'instalacion-y-distribucion.md'), 'utf8')).replace(/\r\n/g, '\n');
   const bloque = /```powershell\n(\$taskcodeBase = [\s\S]*?)```/.exec(readme);
-  assert.ok(bloque, 'el README tiene que traer la funcion de perfil de PowerShell');
+  assert.ok(bloque, 'docs/instalacion-y-distribucion.md tiene que traer la funcion de perfil de PowerShell');
   const original = bloque[1] as string;
   const codigo = original.replace(
     /^\$taskcodeBase = .*$/m,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/readme.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/readme.test.ts
new file mode 100644
index 0000000..6d34b8b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/readme.test.ts
@@ -0,0 +1,264 @@
+/**
+ * TASK-124: el README del plugin es una portada por debajo de 40 KB, y la
+ * referencia detallada vive en docs/ del plugin sin perder nada.
+ *
+ * Tres comprobaciones:
+ * 1. el README pesa menos de 40 960 B (bytes en disco, como `wc -c`);
+ * 2. todo enlace relativo del README y de docs/*.md apunta a un fichero que
+ *    existe y, si lleva ancla, a un encabezado que existe en el destino
+ *    (slug al estilo de GitHub);
+ * 3. todos los encabezados (##, ###, ####) que tenia el README antes de
+ *    partirlo (fijados abajo) siguen apareciendo, una sola vez, entre el
+ *    README y docs/*.md: ninguna seccion se perdio ni quedo duplicada.
+ *
+ * Los bloques de codigo cercados no cuentan ni para enlaces ni para
+ * encabezados; el codigo en linea, tampoco para enlaces. Las funciones de
+ * analisis son puras y llevan contrapruebas sobre textos de prueba.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readdirSync, readFileSync, statSync } from 'node:fs';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+
+// Compilado, este fichero vive en dist/test/empaquetado/: tres niveles arriba
+// esta la raiz del plugin.
+const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
+
+const TOPE_README = 40 * 1024;
+
+/** Los encabezados del README antes de partirlo (TASK-124), en su orden. */
+const ENCABEZADOS_README_ORIGINAL: readonly string[] = [
+  '## Modelo de los agentes',
+  '## Revisores por pares que trae el plugin',
+  '## Regla de una hora',
+  '## Roles del brainstorm de diseño',
+  '## Instalación local (para desarrollo y pruebas)',
+  '## Cómo se distribuye: por qué `dist/src/` está versionado',
+  '### Limitación conocida: `bin/` y las organization settings de claude.ai',
+  '## Usar `taskctl` fuera de Claude Code (PowerShell, cmd, Git Bash)',
+  '## `taskctl` en el PATH del Bash tool',
+  '### Bug encontrado y corregido en TASK-006',
+  '### `commands` en `plugin.json`: campo con forma inválida, eliminado — corrección tras revisión por pares',
+  '### Evidencia recogida en esta sesión',
+  '### Smoke test en un clon aislado',
+  '### Lo que NO se ha podido verificar en esta sesión (limitación de entorno)',
+  '### RESUELTO (2026-09-05): el CI de Windows nativo contestó las preguntas',
+  '### RESUELTO (2026-09-07, TASK-031): el `/plugin install` real, por fin ejecutado',
+  '### Segunda limitación, específica de este repo: `core.fileMode=false`',
+  '## Sincronización de ficheros derivados',
+  '## ROADMAP de tareas (`tareas/ROADMAP.md`)',
+  '## Problemas conocidos',
+  '### Un subagente se deniega con «Auto-Mode Bypass»',
+  '## Mecanismo determinista de sección 14 (punto 11): sigue sin confirmarse',
+  '## Comandos disponibles',
+  '#### Progreso visible: `taskctl estado`, la status line y `TASKCTL_PROGRESO`',
+  '#### Cómo se verifica el proyecto: `comando_verificacion`',
+  '#### Verificación selectiva por impacto: `comando_verificacion_selectiva`',
+  '#### Tareas de solo documentación: `rutas_documentacion`',
+  '#### Código parcial: `rutas_verificacion_parcial`',
+  '#### Freno de fin de turno (hook `Stop`)',
+  '#### Coste de implementación automático (hooks `Stop` y `SubagentStop`)',
+  '#### Puerta de verificación en `finish`',
+  '#### Tests held-out (`aceptacion/`)',
+  '#### Cobertura de las líneas cambiadas',
+  '#### Guardián de merges (hook `PreToolUse`)',
+  '### Puntos de juicio: `--resultado`',
+  '### Una tarea por FALLA: `--crear-tareas`',
+  '### Aviso al cerrar una release',
+  '#### GitLab propio (autoalojado, con dominio propio o bajo una ruta)',
+];
+
+// --- Analisis puro -----------------------------------------------------------
+
+/** Las lineas fuera de bloques de codigo cercados (``` o ~~~). */
+function lineasFueraDeCodigo(texto: string): string[] {
+  const fuera: string[] = [];
+  let valla: string | null = null;
+  for (const l of texto.split(/\r?\n/)) {
+    const m = /^\s{0,3}(`{3,}|~{3,})/.exec(l);
+    if (m) {
+      const marca = m[1] as string;
+      if (valla === null) valla = marca;
+      else if (marca[0] === valla[0] && marca.length >= valla.length) valla = null;
+      continue;
+    }
+    if (valla === null) fuera.push(l);
+  }
+  return fuera;
+}
+
+/** Los encabezados ATX (`# ...` a `###### ...`) fuera de codigo, normalizados: `## Titulo`. */
+function encabezados(texto: string): string[] {
+  const fuera: string[] = [];
+  for (const l of lineasFueraDeCodigo(texto)) {
+    const m = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/.exec(l);
+    if (m) fuera.push(`${m[1]} ${m[2]}`);
+  }
+  return fuera;
+}
+
+/**
+ * Slug de un encabezado al estilo de GitHub: minusculas, fuera todo lo que no
+ * sea letra, marca, numero, guion bajo, guion o espacio, y espacios a guiones.
+ * Conserva las tildes.
+ */
+function slug(titulo: string): string {
+  return titulo
+    .trim()
+    .toLowerCase()
+    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
+    .replace(/ /g, '-');
+}
+
+/** Las anclas de un documento, con el sufijo `-1`, `-2`... de GitHub para los repetidos. */
+function anclas(texto: string): Set<string> {
+  const vistas = new Map<string, number>();
+  const fuera = new Set<string>();
+  for (const e of encabezados(texto)) {
+    const base = slug(e.replace(/^#+ /, ''));
+    const n = vistas.get(base) ?? 0;
+    vistas.set(base, n + 1);
+    fuera.add(n === 0 ? base : `${base}-${n}`);
+  }
+  return fuera;
+}
+
+/** Los destinos de los enlaces relativos `[texto](ruta[#ancla])`, fuera de codigo. */
+function enlacesRelativos(texto: string): string[] {
+  const fuera: string[] = [];
+  for (const l of lineasFueraDeCodigo(texto)) {
+    const sinCodigo = l.replace(/(`+)[\s\S]*?\1/g, '');
+    for (const m of sinCodigo.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
+      const destino = m[1] as string;
+      if (/^[a-z][a-z0-9+.-]*:/i.test(destino)) continue; // http:, https:, mailto:...
+      fuera.push(destino);
+    }
+  }
+  return fuera;
+}
+
+/**
+ * Comprueba los enlaces relativos de `documentos` (ruta POSIX relativa ->
+ * texto). `leer` devuelve el texto de un fichero, '' para un directorio, o
+ * null si no existe. Un mensaje por enlace roto.
+ */
+function enlacesRotos(documentos: ReadonlyMap<string, string>, leer: (ruta: string) => string | null): string[] {
+  const errores: string[] = [];
+  for (const [origen, texto] of documentos) {
+    for (const destino of enlacesRelativos(texto)) {
+      const almohadilla = destino.indexOf('#');
+      const rutaCruda = almohadilla === -1 ? destino : destino.slice(0, almohadilla);
+      const ancla = almohadilla === -1 ? null : decodeURIComponent(destino.slice(almohadilla + 1));
+      const ruta = rutaCruda === '' ? origen : path.posix.normalize(path.posix.join(path.posix.dirname(origen), decodeURIComponent(rutaCruda)));
+      const contenido = documentos.get(ruta) ?? leer(ruta);
+      if (contenido === null) {
+        errores.push(`${origen}: el enlace "${destino}" apunta a ${ruta}, que no existe`);
+      } else if (ancla !== null && !anclas(contenido).has(ancla)) {
+        errores.push(`${origen}: el enlace "${destino}" apunta a un encabezado que no existe en ${ruta}`);
+      }
+    }
+  }
+  return errores;
+}
+
+/** Los encabezados esperados que no aparecen exactamente una vez entre los textos. */
+function encabezadosNoUnicos(esperados: readonly string[], textos: readonly string[]): string[] {
+  const cuenta = new Map<string, number>();
+  for (const t of textos) for (const e of encabezados(t)) cuenta.set(e, (cuenta.get(e) ?? 0) + 1);
+  return esperados.filter((e) => cuenta.get(e) !== 1).map((e) => `${e} (aparece ${cuenta.get(e) ?? 0} veces)`);
+}
+
+// --- Lectura del plugin --------------------------------------------------------
+
+function leerDelPlugin(ruta: string): string | null {
+  const absoluta = path.join(PLUGIN_ROOT, ...ruta.split('/'));
+  try {
+    return statSync(absoluta).isDirectory() ? '' : readFileSync(absoluta, 'utf8');
+  } catch (e) {
+    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
+    throw e;
+  }
+}
+
+/** README.md y docs/*.md del plugin, por ruta POSIX relativa a su raiz. */
+function documentosDelPlugin(): Map<string, string> {
+  const docs = readdirSync(path.join(PLUGIN_ROOT, 'docs'))
+    .filter((f) => f.endsWith('.md'))
+    .sort();
+  const fuera = new Map<string, string>([['README.md', readFileSync(path.join(PLUGIN_ROOT, 'README.md'), 'utf8')]]);
+  for (const f of docs) fuera.set(`docs/${f}`, readFileSync(path.join(PLUGIN_ROOT, 'docs', f), 'utf8'));
+  return fuera;
+}
+
+// --- Tests sobre el plugin real ------------------------------------------------
+
+test('README: pesa menos de 40 960 B', () => {
+  const bytes = readFileSync(path.join(PLUGIN_ROOT, 'README.md')).length;
+  assert.ok(bytes < TOPE_README, `README.md: ${bytes} B, tope ${TOPE_README} B; mueve la referencia detallada a docs/`);
+});
+
+test('README y docs/: todo enlace relativo apunta a un fichero y a un encabezado que existen', () => {
+  const documentos = documentosDelPlugin();
+  assert.ok(documentos.size >= 5, `solo hay ${documentos.size} documentos: el test no esta mirando docs/`);
+  assert.deepEqual(enlacesRotos(documentos, leerDelPlugin), []);
+});
+
+test('README y docs/: los encabezados del README original aparecen todos, una sola vez', () => {
+  assert.deepEqual(encabezadosNoUnicos(ENCABEZADOS_README_ORIGINAL, [...documentosDelPlugin().values()]), []);
+});
+
+test('README: enlaza docs/ y la seccion «Problemas conocidos» que citan el CLI y la skill task-workflow', () => {
+  const readme = documentosDelPlugin().get('README.md') as string;
+  const enlaces = enlacesRelativos(readme);
+  for (const f of ['instalacion-y-distribucion', 'configuracion', 'cierre-y-release', 'comandos', 'problemas-conocidos']) {
+    assert.ok(enlaces.includes(`docs/${f}.md`), `el README no enlaza docs/${f}.md`);
+  }
+  assert.match(readme, /\[Problemas conocidos\]\(docs\/problemas-conocidos\.md#problemas-conocidos\)/);
+});
+
+// --- Contrapruebas sobre textos de prueba --------------------------------------
+
+const DOCS_PRUEBA = new Map<string, string>([
+  ['README.md', '# Portada\n\n## Uno\n\nVer [dos](docs/b.md#dos-y-tres).\n'],
+  ['docs/b.md', '# B\n\n## Dos y `tres`\n\nVolver al [README](../README.md#uno).\n'],
+]);
+const sinDisco = (): string | null => null;
+
+test('enlacesRotos: un conjunto sano no da errores', () => {
+  assert.deepEqual(enlacesRotos(DOCS_PRUEBA, sinDisco), []);
+});
+
+test('enlacesRotos: un enlace a un fichero que no existe falla', () => {
+  const docs = new Map(DOCS_PRUEBA).set('README.md', '## Uno\n\nVer [x](docs/no-existe.md).\n');
+  assert.deepEqual(enlacesRotos(docs, sinDisco), ['README.md: el enlace "docs/no-existe.md" apunta a docs/no-existe.md, que no existe']);
+});
+
+test('enlacesRotos: un ancla a un encabezado que no existe falla', () => {
+  const docs = new Map(DOCS_PRUEBA).set('README.md', '## Uno\n\nVer [x](docs/b.md#cuatro).\n');
+  assert.deepEqual(enlacesRotos(docs, sinDisco), ['README.md: el enlace "docs/b.md#cuatro" apunta a un encabezado que no existe en docs/b.md']);
+});
+
+test('enlacesRotos: ancla en el mismo fichero, URLs absolutas y enlaces dentro de codigo', () => {
+  const docs = new Map([['a.md', '## Sí\n\n[aquí](#sí) [web](https://x.example/#no) `[x](roto.md)`\n\n```\n[y](roto.md)\n```\n']]);
+  assert.deepEqual(enlacesRotos(docs, sinDisco), []);
+  docs.set('a.md', '## Sí\n\n[aquí](#no)\n');
+  assert.equal(enlacesRotos(docs, sinDisco).length, 1);
+});
+
+test('slug y anclas: al estilo de GitHub, con tildes y sufijo para repetidos', () => {
+  assert.equal(slug('Cómo se distribuye: por qué `dist/src/` está versionado'), 'cómo-se-distribuye-por-qué-distsrc-está-versionado');
+  assert.equal(slug('Un subagente se deniega con «Auto-Mode Bypass»'), 'un-subagente-se-deniega-con-auto-mode-bypass');
+  assert.equal(slug('campo eliminado — corrección'), 'campo-eliminado--corrección');
+  assert.equal(slug('`comando_verificacion`'), 'comando_verificacion');
+  assert.deepEqual([...anclas('## A\n## A\n```\n## A\n```\n')], ['a', 'a-1']);
+});
+
+test('encabezadosNoUnicos: un encabezado ausente, duplicado o con otro nivel se detecta', () => {
+  const textos = ['## Uno\n### Dos\n```\n## Tres\n```\n', '## Dos\n## Cuatro\n## Cuatro\n'];
+  assert.deepEqual(encabezadosNoUnicos(['## Uno', '### Dos', '## Tres', '## Cuatro'], textos), [
+    '## Tres (aparece 0 veces)',
+    '## Cuatro (aparece 2 veces)',
+  ]);
+  assert.deepEqual(encabezadosNoUnicos(['## Uno', '### Dos'], textos), []);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts
new file mode 100644
index 0000000..54a89e8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts
@@ -0,0 +1,190 @@
+/**
+ * TASK-124: lo que leen los agentes tiene un tamano maximo y no crece con el
+ * proyecto.
+ *
+ * Cada fichero que se carga en el contexto de un agente (el CLAUDE.md del
+ * repo de TaskCode, las skills, sus anexos y los agentes del plugin, y los
+ * documentos de estado del repo) tiene un tope en bytes: su tamano al fijar
+ * la tabla mas un ~15 %, redondeado hacia arriba al KB. Ademas hay un tope
+ * del total de skills/ + agents/, mas estrecho que la suma de los topes
+ * sueltos.
+ *
+ * Si un fichero pasa su tope, la salida no es subir el numero: es archivar lo
+ * cerrado o partir el fichero. Un .md nuevo bajo skills/ o agents/ sin
+ * entrada en la tabla tambien hace fallar el test: no se escapa por omision.
+ *
+ * Se mide en bytes del fichero tal como esta en disco (Buffer length, igual
+ * que `wc -c`). Las tablas se fijaron con el checkout de Windows (CRLF), que
+ * es el mas grande: en Linux (LF) sobra margen.
+ *
+ * La comprobacion es una funcion pura (`comprobarTopes`), con contrapruebas
+ * sobre datos al final.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readdir, readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+
+// Compilado, este fichero vive en dist/test/skills/: tres niveles arriba esta
+// la raiz del plugin, y tres mas la del repo.
+const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
+const REPO_ROOT = path.resolve(PLUGIN_ROOT, '..', '..', '..');
+
+const KB = 1024;
+
+/** Topes de los .md del plugin, por ruta POSIX relativa a su raiz. Comentario: bytes al fijarlo. */
+const TOPES_PLUGIN: Readonly<Record<string, number>> = {
+  'agents/brainstorm-arquitectura.md': 8 * KB, // 6934
+  'agents/brainstorm-dominio.md': 8 * KB, // 6267
+  'agents/brainstorm-rendimiento.md': 7 * KB, // 6143
+  'agents/brainstorm-riesgos.md': 9 * KB, // 7226
+  'agents/brainstorm-testing.md': 10 * KB, // 8349
+  'agents/brainstorm-unificador.md': 11 * KB, // 9121
+  'agents/revisor-seguridad-deploy.md': 7 * KB, // 5712
+  'skills/angular-vue-reviewer/SKILL.md': 23 * KB, // 20295
+  'skills/approve/SKILL.md': 4 * KB, // 3021
+  'skills/board/SKILL.md': 2 * KB, // 1183
+  'skills/code-quality-reviewer/SKILL.md': 16 * KB, // 14192
+  'skills/csharp-autocad-ifc-reviewer/SKILL.md': 18 * KB, // 15727
+  'skills/doctor-deploy/SKILL.md': 6 * KB, // 5169
+  'skills/finish/SKILL.md': 9 * KB, // 7163
+  'skills/java-spring-reviewer/SKILL.md': 13 * KB, // 11119
+  'skills/new/SKILL.md': 2 * KB, // 1780
+  'skills/plan/SKILL.md': 7 * KB, // 5731
+  'skills/review/SKILL.md': 9 * KB, // 7809
+  'skills/rust-wasm-reviewer/SKILL.md': 26 * KB, // 22470
+  'skills/start/SKILL.md': 3 * KB, // 2567
+  'skills/task-workflow/SKILL.md': 18 * KB, // 15359
+  'skills/task-workflow/avance.md': 9 * KB, // 7397
+  'skills/task-workflow/cierre.md': 5 * KB, // 3565
+  'skills/task-workflow/coste.md': 8 * KB, // 6728
+  'skills/task-workflow/duracion.md': 6 * KB, // 4490
+  'skills/task-workflow/heldout.md': 4 * KB, // 3478
+  'skills/task-workflow/prerrequisitos.md': 3 * KB, // 2163
+  'skills/task-workflow/revision.md': 15 * KB, // 12728
+  'skills/task-workflow/roadmap.md': 5 * KB, // 3579
+  'skills/task-workflow/sincronizacion.md': 7 * KB, // 5554
+  'skills/task-workflow/trampas.md': 4 * KB, // 2883
+  'skills/task-workflow/verificacion-selectiva.md': 15 * KB, // 12916
+};
+
+/** Tope del total de skills/ + agents/ (248 818 B al fijarlo). */
+const TOPE_TOTAL_PLUGIN = 280 * KB;
+
+/** Topes de ficheros del repo, por ruta POSIX relativa a su raiz. */
+const TOPES_REPO: Readonly<Record<string, number>> = {
+  'CLAUDE.md': 8 * KB, // 5852
+  'docs/contexto/CHECKLIST_TERMINACION.md': 20 * KB,
+  'docs/contexto/ESTADO.md': 10 * KB,
+};
+
+const CONSEJO = 'archiva o parte el fichero en vez de subir el tope';
+
+interface Medida {
+  ruta: string;
+  /** null: el fichero no existe. */
+  bytes: number | null;
+}
+
+/**
+ * Compara lo medido con la tabla. Devuelve un mensaje por problema (vacio si
+ * todo cabe): fichero por encima de su tope, fichero sin tope en la tabla, y
+ * entrada de la tabla sin fichero.
+ */
+function comprobarTopes(medidas: readonly Medida[], topes: Readonly<Record<string, number>>): string[] {
+  const errores: string[] = [];
+  const medidas_ = new Set(medidas.map((m) => m.ruta));
+  for (const { ruta, bytes } of medidas) {
+    const tope = topes[ruta];
+    if (bytes === null) {
+      errores.push(`${ruta}: no existe; quita su entrada de la tabla de topes o restaura el fichero`);
+    } else if (tope === undefined) {
+      errores.push(
+        `${ruta}: ${bytes} B, sin tope en la tabla; anade su entrada (tamano actual + 15 %, al KB). ` +
+          `Si no cabe en un tope razonable, ${CONSEJO}`,
+      );
+    } else if (bytes > tope) {
+      errores.push(`${ruta}: ${bytes} B, tope ${tope} B; ${CONSEJO}`);
+    }
+  }
+  for (const ruta of Object.keys(topes)) {
+    if (!medidas_.has(ruta)) errores.push(`${ruta}: tiene tope en la tabla pero no se ha medido (no existe)`);
+  }
+  return errores;
+}
+
+/** Bytes en disco, o null si no existe. */
+async function bytesDe(absoluta: string): Promise<number | null> {
+  try {
+    return (await readFile(absoluta)).length;
+  } catch (e) {
+    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
+    throw e;
+  }
+}
+
+/** Todos los .md bajo `dir` (recursivo), como rutas POSIX relativas a `raiz`. */
+async function mdBajo(raiz: string, dir: string): Promise<string[]> {
+  const fuera: string[] = [];
+  for (const e of await readdir(path.join(raiz, dir), { withFileTypes: true })) {
+    const rel = `${dir}/${e.name}`;
+    if (e.isDirectory()) fuera.push(...(await mdBajo(raiz, rel)));
+    else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) fuera.push(rel);
+  }
+  return fuera;
+}
+
+async function medidasPlugin(): Promise<Medida[]> {
+  const rutas = [...(await mdBajo(PLUGIN_ROOT, 'skills')), ...(await mdBajo(PLUGIN_ROOT, 'agents'))].sort();
+  return Promise.all(rutas.map(async (ruta) => ({ ruta, bytes: await bytesDe(path.join(PLUGIN_ROOT, ruta)) })));
+}
+
+test('topes: cada .md de skills/ y agents/ tiene tope en la tabla y cabe en el', async () => {
+  const medidas = await medidasPlugin();
+  assert.ok(medidas.length >= 30, `solo se midieron ${medidas.length} ficheros: el test no esta mirando skills/ y agents/`);
+  assert.deepEqual(comprobarTopes(medidas, TOPES_PLUGIN), []);
+});
+
+test('topes: el total de skills/ + agents/ cabe en su tope', async () => {
+  const total = (await medidasPlugin()).reduce((s, m) => s + (m.bytes ?? 0), 0);
+  assert.deepEqual(comprobarTopes([{ ruta: 'skills/ + agents/ (total)', bytes: total }], { 'skills/ + agents/ (total)': TOPE_TOTAL_PLUGIN }), []);
+});
+
+test('topes: CLAUDE.md y los documentos de estado del repo caben en el suyo', async () => {
+  const medidas = await Promise.all(
+    Object.keys(TOPES_REPO).map(async (ruta) => ({ ruta, bytes: await bytesDe(path.join(REPO_ROOT, ruta)) })),
+  );
+  assert.deepEqual(comprobarTopes(medidas, TOPES_REPO), []);
+});
+
+// --- Contrapruebas sobre datos: la comprobacion no es un verde vacio --------
+
+test('comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo', () => {
+  const errores = comprobarTopes([{ ruta: 'skills/x/SKILL.md', bytes: 3000 }], { 'skills/x/SKILL.md': 2048 });
+  assert.equal(errores.length, 1);
+  assert.match(errores[0] as string, /^skills\/x\/SKILL\.md: 3000 B, tope 2048 B; archiva o parte el fichero en vez de subir el tope$/);
+});
+
+test('comprobarTopes: justo en el tope pasa; un byte mas, no', () => {
+  assert.deepEqual(comprobarTopes([{ ruta: 'a.md', bytes: 2048 }], { 'a.md': 2048 }), []);
+  assert.equal(comprobarTopes([{ ruta: 'a.md', bytes: 2049 }], { 'a.md': 2048 }).length, 1);
+});
+
+test('comprobarTopes: un .md nuevo sin entrada en la tabla falla', () => {
+  const errores = comprobarTopes(
+    [
+      { ruta: 'agents/a.md', bytes: 100 },
+      { ruta: 'agents/nuevo.md', bytes: 100 },
+    ],
+    { 'agents/a.md': 1024 },
+  );
+  assert.equal(errores.length, 1);
+  assert.match(errores[0] as string, /^agents\/nuevo\.md: 100 B, sin tope en la tabla/);
+  assert.match(errores[0] as string, /archiva o parte el fichero en vez de subir el tope/);
+});
+
+test('comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla', () => {
+  assert.match(comprobarTopes([], { 'skills/viejo.md': 1024 })[0] as string, /^skills\/viejo\.md: tiene tope/);
+  assert.match(comprobarTopes([{ ruta: 'CLAUDE.md', bytes: null }], { 'CLAUDE.md': 1024 })[0] as string, /^CLAUDE\.md: no existe/);
+});
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-124/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-124/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-124/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-124/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-124/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-124/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-124/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                     | 54 +++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 21 +++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/documento-estado.js                               | 93 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 10 files changed, 170 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 188.6 s

Final de la salida (truncada: 87596 bytes en total):

````
✔ limite_wip: el mensaje de error dice el limite real, no "una sola tarea" (0.508ms)
✔ invalido: limite_wip: dos (texto) aborta y dice que espera un entero (1.3531ms)
✔ invalido: limite_wip: 0 y limite_wip: -1 abortan (0 no significa "sin limite") (0.4269ms)
✔ invalido: limite_wip decimal o booleano tambien abortan (0.2054ms)
✔ invalido: rama_base vacia, en comillas o sin valor, aborta (0.4721ms)
✔ invalido: agente_revisor_por_defecto vacio aborta igual que rama_base (0.4989ms)
✔ clave desconocida: avisa (no aborta), sugiere la parecida, enumera las validas y se ignora (1.7924ms)
✔ una clave descartada por la decision #9 sigue siendo desconocida: avisa (TASK-061, antes abortaba) (3.0828ms)
✔ invalido: la misma clave dos veces aborta en vez de que gane la ultima en silencio (0.3234ms)
✔ invalido: linea sin ":" aborta hablando de CONFIG, no de frontmatter (0.2306ms)
✔ el mensaje de error nombra el fichero y la linea (0.1999ms)
✔ fallo cerrado real: resolveBaseBranchForTipo NO cae a "develop" con un config roto (924.4319ms)
✔ fallo cerrado real: taskctl new aborta con un config roto y NO crea la tarea (968.4602ms)
✔ fallo cerrado real: taskctl import aborta con un config roto (906.0422ms)
✔ sintaxis: comentario inline tras el valor se descarta (0.4339ms)
✔ sintaxis: valores entrecomillados y con espacios de sobra se recortan (0.2163ms)
✔ sintaxis: CRLF no rompe el parseo (0.1578ms)
✔ el parser compartido NO cambio el comportamiento del frontmatter (0.3596ms)
✔ ubicacion: se busca en la RAIZ del repo, tambien ejecutando desde un subdirectorio (1028.7294ms)
✔ ubicacion: la busqueda PARA en la raiz del repo (un config de mas arriba no manda) (110.0582ms)
✔ resolverConfig: un .taskcode que es un FICHERO aborta (no cae al default en silencio) (470.1727ms)
✔ parsearConfig: modo_flujo acepta los tres valores (0.3628ms)
✔ parsearConfig: modo_flujo invalido aborta listando los tres validos y sugiriendo el parecido (0.5335ms)
✔ parsearConfig: modo_flujo repetido aborta (0.1822ms)
✔ topes: cada .md de skills/ y agents/ tiene tope en la tabla y cabe en el (62.1948ms)
✔ topes: el total de skills/ + agents/ cabe en su tope (68.7203ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (18.543ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (1.966ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.4294ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.6011ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (1.0762ms)
ℹ tests 939
ℹ suites 0
ℹ pass 939
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 177150.4655
[verificar-impacto] node --test termino con 0 en 177.2 s.
````
