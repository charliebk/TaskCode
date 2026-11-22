# Peticion de revision — TASK-141 (ronda 1)

- Tarea: TASK-141 — Auditoria 4D inicial: reconocimiento completo del codigo existente
- Rama revisada: feature/task-141-auditoria-4d-inicial-reconocimiento-comp
- Rama base: develop
- Commit revisado (HEAD): 346ad3935ac92d12e16fb49c794d7a8fbe1066b8
- Fecha: 2026-11-22
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-141 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
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

- tareas/03-en-revision/TASK-141/tarea.md
- tareas/03-en-revision/TASK-141/planificacion/
- docs/auditoria-4d-completa.md
- docs/auditoria-4d.md

## Commits a revisar (git log develop..HEAD)

````
346ad39 update(feature): develop -> feature/task-141-auditoria-4d-inicial-reconocimiento-comp
45ca827 docs(TASK-141): autorrevision code-quality-reviewer
9600388 docs(TASK-141): autorrevision
510f989 docs(TASK-141): auditoria 4D completa del repo
1207deb chore(TASK-141): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/auditoria-4d-completa.md b/docs/auditoria-4d-completa.md
new file mode 100644
index 0000000..83bfe0e
--- /dev/null
+++ b/docs/auditoria-4d-completa.md
@@ -0,0 +1,368 @@
+# Auditoría 4D completa — todo el código del repo
+
+> TASK-141, 2026-11-22. Regla 4D: sin **duplicación**, **desviación**,
+> **diluvio** ni **disfraz**. La definición está en
+> `taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md`,
+> sección «Regla 4D».
+>
+> Esta auditoría solo lee: no corrige nada, porque corregir aquí sería
+> desviación. Cada caso tiene su tarea de seguimiento.
+>
+> La auditoría de TASK-137 (`docs/auditoria-4d.md`, casos A1..A13) solo
+> cubría los diffs de TASK-127..136. Sus casos no se repiten aquí: se
+> referencian.
+
+Las rutas son relativas a `taskcode-marketplace/plugins/taskcode-plugin/`,
+salvo las de `scripts/` de la raíz del repo, que se marcan como tales. Las
+líneas son las de `develop` a 2026-11-22.
+
+## Mapa del proyecto
+
+| Área | Responsabilidad | Ficheros | Líneas | Estado |
+|---|---|---:|---:|---|
+| `src/core` | Núcleo determinista: modelo de la tarea y máquina de estados, parsers de `tarea.md`, config y catálogos, flujo, métricas, plantillas de diseño | 66 | 17.090 | auditada (2 agentes, a–d y e–z) |
+| `src/commands` | Un comando de `taskctl` por fichero: ciclo de vida, puertas de `finish`, doctor, métricas, ROADMAP | 28 | 12.321 | auditada (2 agentes, a–f e i–w) |
+| `src/fs` | Capa de E/S: Git, disco, procesos externos, ficheros de Claude Code | 36 | 8.016 | auditada |
+| `src/hooks` | Hooks de Claude Code: freno de fin de turno, guardianes de merge y held-out, coste | 10 | 1.259 | auditada |
+| `src/cli` + `src/cli.ts` | Punto de entrada de `taskctl` y parseo de argumentos | 3 | 1.635 | auditada |
+| `scripts/gitflow` | Scripts bash de Git-Flow que lanza `taskctl` | 26 | 3.042 | auditada |
+| `scripts/*.yml` (plugin) | Catálogos de datos (skills, heurística, doctor-deploy) | 3 | — | excluida: datos, no código (sí se contrastan con sus lectores) |
+| `scripts/` de la raíz | `verificar-impacto.mjs` y `perfil-tests.mjs` | 2 | 882 | auditada |
+| `skills/` | Skills de fase, guías de `task-workflow` y revisoras | 27 | 3.912 | auditada |
+| `agents/` | Agentes del brainstorm y revisor de seguridad | 7 | 982 | auditada |
+| `hooks/` | `hooks.json` y la sonda de hooks | 4 | 155 | auditada (sin leer un fixture JSON de una línea) |
+| `test/commands` | Tests de punta a punta de cada comando contra repos reales | 100 | 29.093 | auditada: todos en diagonal; 83 tests de ≤1 aserción uno a uno; 21 ficheros a fondo |
+| `test/core` + `test/fs` | Tests de lógica pura y de la capa de disco y Git | 85 | 15.340 | auditada: ~22 enteros y el resto con búsquedas dirigidas |
+| `test/` resto | helpers, hooks, gitflow, integración, skills, agents, cli, empaquetado, reporter, scripts | ~60 | 13.659 | auditada: enteros salvo tramos de `task-workflow`, `revisores` y `brainstorm-roles` |
+| `dist/` | Salida de `tsc` | — | — | excluida: generada |
+| `node_modules/` | Dependencias de desarrollo | — | — | excluida: de terceros |
+| `tareas/`, `docs/` | Historial de tareas y documentación | — | — | excluidas: no es código |
+| `test/fixtures/` | Datos de entrada de tests | 2 | 139 | excluida: datos |
+
+Total auditado: unas 44.000 líneas de código y contenido, y 58.000 de tests.
+
+## Método
+
+1. **Reparto.** Diez agentes de solo lectura en paralelo, uno por área, con
+   la misma consigna y el mismo formato de fila. Cada uno recibió la
+   definición de la Regla 4D y los casos ya conocidos (A1..A13 y
+   TASK-138..140). Antes de dar una función por única tenían que buscar
+   copias con grep en `src/`, `scripts/` y `test/`. Cada agente declaró qué
+   ficheros leyó.
+2. **Verificación del coordinador.** El coordinador no encontró los casos:
+   volvió a abrir en el código 32 casos de confianza alta, de todas las áreas
+   (SCR-01, SCR-09, SCR-10, CMD1-01, CMD1-03, CMD1-07, CMD1-08, CMD2-01,
+   CMD2-05, CMD2-10, CMD2-12, CONT-01, CONT-02, CONT-03, CONT-16, FS-01,
+   FS-04, FS-10, FS-15, CORE1-05, CORE1-06, CORE1-09, CORE1-11, CORE2-01,
+   CORE2-05, CORE2-07, CORE2-14, TRES-02, TRES-05, TCMD-01 y los de la
+   mutación). Todos se sostienen. Un caso se descartó por la mutación
+   (TCORE-07, abajo).
+   - **Los demás casos de confianza alta** se comprobaron con un script:
+     90 citas (fichero, línea ±6 y el texto que nombra el caso). 79 casaron a
+     la primera. Las 11 restantes se abrieron a mano: todas se sostienen, solo
+     con la línea desplazada (por ejemplo, `CLAVES_NUMERICAS` en
+     `heuristica.ts:149` y no en la 105). SCR-04 se comprobó con `diff` (18
+     líneas distintas en total).
+   - **Límite:** el script comprueba que la cita existe, no toda la
+     incoherencia que describe el caso. La incoherencia completa se ha leído
+     en los 32 casos de arriba y en los de la mutación. Cada tarea de
+     seguimiento empieza reproduciendo los suyos.
+3. **Reproducción.** El agente de scripts reprodujo SCR-01 y SCR-09 en repos
+   temporales. El coordinador ejecutó las mutaciones de la sección siguiente.
+4. **Severidad.** Duplicación y disfraz reales son IMPORTANTE como mínimo.
+   Desviación y diluvio son MENOR. CRÍTICO es solo lo que pierde o corrompe
+   datos. Dos casos que los agentes marcaron CRÍTICO quedan como IMPORTANTE,
+   porque no pierden datos aunque fallen hoy:
+   - CMD1-01: un comando aborta o queda sin guarda.
+   - CMD2-01: `siguiente` pregunta de más.
+
+## Mutación
+
+Las mutaciones se hicieron sobre una copia del plugin compilado, en
+`%LOCALAPPDATA%\pruebas-claude\taskcode\task-141`. Cada una rompe en
+`dist/src` lo que el test dice probar y ejecuta solo ese test. Muestra: 10
+tests.
+
+| # | Caso | Mutación en `dist/src` | Test | Resultado |
+|---|---|---|---|---|
+| M1 | TCORE-02 | `board-format`: ordenar con `localeCompare` en vez de por número | `core/board-format`, «ordena por ID numericamente» | **verde**: disfraz confirmado |
+| M2 | TCORE-03 | `state-machine`: `case 'verificar-menores': return;` | `core/state-machine`, «cualquier comando … terminada» | **verde**: disfraz confirmado |
+| M3 | TCORE-07 | `task-store`: `assertValidTaskId` después del `mkdir` | `fs/task-store`, «writeTareaFile: rechaza … path traversal» | **rojo**: otra validación previa lanza `TaskValidationError`. Se descarta el caso |
+| M4 | TCORE-08 | `task-store`: quitar `ilegibles.sort()` | `fs/task-store-wip`, «ilegibles vienen ordenadas» | **verde**: disfraz confirmado |
+| M5 | TCORE-01 | `git`: `cmdQuoteWindows` sin comillas | `fs/git`, «un argumento con espacios llega intacto» | **verde**: disfraz confirmado |
+| M6 | TCMD-02 | `deteccion-app`: `DIRS_EXCLUIDOS = ['vendor', '.git']` | `commands/doctor-deploy` (fichero entero, 28 casos) | **verde**: disfraz confirmado |
+| M7 | TCMD-04 | `review`: quitar el `unlink` de los ficheros escritos | `commands/review-incremental`, «si una escritura de la ronda falla» | **rojo** en Windows. En Linux (CI) el test se salta |
+| M8 | TCMD-04 | `review`: `if (!isEexist(e))` → `if (true)` (sin el error propio) | el mismo | **verde**: el `rejects` no tiene matcher |
+| M9 | TRES-08 | `pre-tool-merge`: `const integra = true;` | `hooks/salida-temprana` (4 tests) | **verde**: disfraz confirmado |
+| M10 | TRES-12 | `estado`: quitar `rechazarFlagsDesconocidos` | `cli/estado`, «un flag desconocido sale con 1» | **verde**: disfraz confirmado |
+
+De diez mutaciones, ocho quedan en verde con el código roto. M7 solo se
+detecta en Windows. M3 descarta TCORE-07.
+
+## Casos
+
+Leyenda: **D** = Duplicación, Desviación, Diluvio o Disfraz. **Conf.** =
+confianza.
+
+### src/core
+
+| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
+|---|---|---|---|---|---|---|---|
+| CORE1-01 | core | Duplicación | `src/core/duracion-estimada.ts:103-111` | `anotarDuracion` busca `## Duracion` con `findIndex` y sin saltar bloques de código. `anotarCierre` usa `rangoDeSeccion` (`transiciones.ts:208`), que toma la última aparición fuera de bloques, y `finish` llama a las dos seguidas. Con el encabezado dentro de un bloque, el resultado son dos secciones `## Duracion` | IMPORTANTE | alta | TASK-147 |
+| CORE1-02 | core | Duplicación | `cierre.ts:39`, `coste-registro.ts:101`, `duracion-estimada.ts:89`, `transiciones.ts:225,478`, `plataforma-remota.ts:451`, `troceo.ts:258` | «Crear la sección al final del cuerpo» está copiado 7 veces sin helper. Si una copia cambia el separador, las secciones quedan con formato distinto según el comando | IMPORTANTE | media | TASK-147 |
+| CORE1-03 | core | Duplicación | `catalogo-skills.ts:85-102`, `heuristica.ts:195-213`, `doctor-deploy-catalogo.ts:178-190`, `revisores.ts:58-75`, `fs/gitflow-runner.ts:33` | `packageRoot()` y `CLAUDE_PLUGIN_ROOT` en 5 copias. Si cambia una, cada catálogo se carga desde una raíz distinta (lo mismo es CORE2-08) | IMPORTANTE | alta | TASK-148 |
+| CORE1-04 | core | Duplicación | `catalogo-skills.ts:131-207`, `doctor-deploy-catalogo.ts:209-314`, `heuristica.ts:381-450` | Tres lectores de bloques `prefijo_N_campo` con reglas distintas: la lista vacía se admite en uno y se rechaza en otro, y los repetidos igual pero al revés. `describirValor` está ×3 | IMPORTANTE | alta | TASK-148 |
+| CORE1-05 | core | Duplicación | `catalogo-skills.ts` (`SKILL_KEY_RE` frente a `CAMPOS_SKILL_TODOS`, y `:188`) | La regex repite a mano los nombres de los campos. Un campo nuevo que solo entre en el array provoca un `TypeError` crudo. Hoy está latente | IMPORTANTE | alta | TASK-148 |
+| CORE1-06 | core | Duplicación | `config.ts:825-834,1443-1456,1462-1474` | Tres Levenshtein propios con umbral `d<=3` en vez de `masParecida` (`sugerencia.ts`). Con `cierre_por_defecto: mr` sugiere «merge» | IMPORTANTE | alta | TASK-148 |
+| CORE1-07 | core | Duplicación | `config.ts:1379,1403,1417,739-758`; `:1196` frente a `:1218` | «Entero en rango» está escrito 5 veces y «lista de enumerado sin repetidos» 2 | IMPORTANTE | media | TASK-148 |
+| CORE1-08 | core | Duplicación | `config.ts:386` (`CLAVES_CONFIG`) frente a `:645` (`switch`) | Nada ata la lista de claves al `switch`: ni exhaustividad ni test. Una clave sin `case` se acepta y no hace nada. Hoy está latente (32/32) | IMPORTANTE | alta | TASK-148 |
+| CORE1-09 | core | Duplicación | `comando-merge.ts:172-180` frente a `:425-433`; `:436` | El bucle de opciones globales de git está copiado. `cierresDeMerge` usa `args.includes('--continue')`, así que `git merge -m --continue x` se clasifica de dos maneras | IMPORTANTE | alta | TASK-148 |
+| CORE1-10 | core | Duplicación | `config.ts:1290`, `doctor-deploy-veredictos.ts:105`, `config.ts:1123` | Tres validaciones de «ruta relativa», dos con el mismo nombre y reglas distintas (`a/../b`) | IMPORTANTE | media | TASK-148 |
+| CORE1-11 | core | Duplicación | `doctor-deploy-catalogo.ts:532,624` frente a `documento-estado.ts:46-57` | Dos validaciones de fecha: `FECHA_RE` acepta `2026-02-30` y `diaDe` la rechaza | IMPORTANTE | alta | TASK-148 |
+| CORE1-12 | core | Duplicación | `catalogo-skills.ts:487-492` frente a `complejidad-similar.ts:39-45` | Dos «solapes de etiquetas»: uno pasa a minúsculas y el otro no (`Rust` frente a `rust`) | IMPORTANTE | media | TASK-148 |
+| CORE1-13 | core | Duplicación | `coste-transcripcion.ts:119`, `doctor-deploy-auditoria.ts:55`, `hooks-subagente.ts:53`, `fs/json-claude.ts:20`; `recortar` ×3 | `esObjeto` ×4 (incluye CORE2-17) y tres «recortar» que cortan con longitudes distintas | IMPORTANTE | media | TASK-148 |
+| CORE1-14 | core | Disfraz | `config.ts:2-4`; `doctor-deploy-tareas.ts:66` | Comentarios que afirman lo que el código no hace: «TRES claves» cuando hay 32, y `dondeFalla` dice que recorta y no recorta | MENOR | alta | TASK-148 |
+| CORE2-01 | core | Duplicación | `roadmap.ts:131-134`, `evolucion.ts:81-84` frente a `roadmap-comparar.ts:134-139`, `board-format.ts:30` | Cuatro lectores del número de ID. `/(\d+)$/` no casa con `TASK-121a`, así que las partes de un troceo se ordenan al final en el ROADMAP y en la evolución | IMPORTANTE | alta | TASK-147 |
+| CORE2-02 | core | Duplicación | `menores.ts:128-142`, `rondas-extra.ts:29-36`, `plataforma-remota.ts:462-476` | Lectores de sección con `findIndex` y sin saltar bloques, mientras la escritura usa `rangoDeSeccion`. Un ejemplo `## Verificacion ligera` en el enunciado hace que la verificación real no se vea | IMPORTANTE | alta | TASK-147 |
+| CORE2-03 | core | Duplicación | `plan-brainstorm.ts:220-226,380-386` frente a `commands/plan.ts:257-272` | Las secciones del plan están escritas 3 veces. Las peticiones no piden `Duracion estimada` ni el presupuesto de tests; solo lo tapa la skill (va con CONT-07) | IMPORTANTE | alta | TASK-150 |
+| CORE2-04 | core | Duplicación | `validacion-tarea.ts:182-205` frente a `tarea-body.ts:132-235` | `casillasSinMarcar` (la que usa `finish`) no reconoce `**Tras el cierre**` ni `### Criterios`, y `extraerSecciones` sí | IMPORTANTE | alta | TASK-147 |
+| CORE2-05 | core | Duplicación | `validacion-tarea.ts:74-76`, `informe-revision.ts:158-166` | Son copias de `normalizarTexto` (`tarea-body.ts:98`), que se exportó justo para evitarlas | IMPORTANTE | alta | TASK-147 |
+| CORE2-06 | core | Duplicación | `troceo.ts:39,43-66,158-175,226-233` | Lector propio de Objetivo, Criterios y vallas. Con `### Criterios` deja la sección vieja en la parte a | IMPORTANTE | alta | TASK-147 |
+| CORE2-07 | core | Duplicación | `particion-tarea.ts:33-38` y `troceo.ts:140-145` | `citar()` está idéntica en dos ficheros que generan el mismo formato | IMPORTANTE | alta | TASK-147 |
+| CORE2-08 | core | Duplicación | (= CORE1-03) | Se unifica con CORE1-03 | — | — | TASK-148 |
+| CORE2-09 | core | Duplicación | `plataforma-remota.ts:45-63` frente a `:85-100,164-194` | Dos parsers de la URL de origin en el mismo fichero. Con el puerto 99999 dan resultados distintos | IMPORTANTE | alta | TASK-148 |
+| CORE2-10 | core | Duplicación | `informe-verificacion.ts:38`, `progreso.ts:68-69`, `crecimiento-suite.ts:45` | Tres limpiadores de ANSI con distinta cobertura | IMPORTANTE | alta | TASK-148 |
+| CORE2-11 | core | Duplicación | `evolucion.ts:122-133` frente a `:113-119` | `tramoDe` calcula en línea la mediana que ya da `medianaMinutos`. Es otra mediana más, que se suma a A2 | IMPORTANTE | alta | TASK-138 (criterio ampliado) |
+| CORE2-12 | core | Duplicación | `metricas.ts:413-416` frente a `:425-428`; `:478-481` frente a `:265-271` | La conversión de una fila a `Marca` está ×2: la duración que anota `finish` y la de `metricas` pueden no cuadrar | IMPORTANTE | alta | TASK-147 |
+| CORE2-13 | core | Duplicación | `metricas.ts:83` frente a `transiciones.ts:53`; `progreso.ts:25` | `FaseMedida` y `FaseRegistrada` son dos tipos idénticos unidos con casts. Una fase nueva se ignora en silencio | IMPORTANTE | alta | TASK-147 |
+| CORE2-14 | core | Duplicación | `flujo.ts:136` y `troceo.ts:33-35` | «ID troceable» está escrito dos veces con la misma regex | IMPORTANTE | alta | TASK-147 |
+| CORE2-15 | core | Duplicación | `menores.ts:75-78` frente a `fs/git.ts:313-319` | Dos definiciones de «fichero de test». La divergencia está documentada (MEN-2 de TASK-113) | IMPORTANTE | alta | TASK-148 |
+| CORE2-16 | core | Duplicación | `secretos.ts:179-192` frente a `plataforma-remota.ts:300-302` | Dos redactores de credenciales. Un token usado como usuario queda a la vista en `doctor-deploy` | IMPORTANTE | media | TASK-148 |
+| CORE2-17 | core | Duplicación | (incluido en CORE1-13) | `esObjeto` ×4 | — | — | TASK-148 |
+| CORE2-18 | core | Diluvio | `heuristica.ts:1-85,101-121,149-168,284-308` | Cada clave se escribe 3 veces y la cabecera tiene 85 líneas de historia | MENOR | alta | TASK-148 |
+| CORE2-19 | core | Diluvio | `state-machine.ts:52-80,204-205` | `TRIVIAL_SIN_APROBACION` es una lista vacía, con 28 líneas de comentario: parece un mecanismo y no hace nada | MENOR | alta | TASK-148 |
+| CORE2-20 | core | Diluvio | `metricas.ts` (1155 líneas); `:545,691,1095`, `grupos-metricas.ts:149`, `versiones-metricas.ts:135` | Módulo que hace de todo y cinco formateadores `null`→«—» | MENOR | media | TASK-148 |
+| CORE2-21 | core | Desviación | `plugin-instalado.ts:52,107-120`, `heuristica.ts:86,228-242`, `revisores.ts:30,132-213` | E/S dentro de `core/`, cuando core se declara puro | MENOR | media | TASK-148 |
+
+Ya cubiertos: A1, A2, A3, A4, A5 y A6. Se añaden a TASK-138 la mediana de
+`metricas.ts:1004` y la de `evolucion.ts`.
+
+### src/commands
+
+| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
+|---|---|---|---|---|---|---|---|
+| CMD1-01 | commands | Disfraz | `commands/cadena.ts:181-207`; `cli.ts:462` | El comentario dice que «todo comando que escribe pasa por aquí», pero `GUARDADOS_POR_CADENA` no incluye `trocear`, `verificar-menores`, `verificar-lote` ni `doctor-deploy`, que hacen `autoCommit`. Dentro de una cadena, la skill review añade `--cadena` a `verificar-menores` y el comando lo rechaza como flag desconocido. El test (`cadena.test.ts:245`) compara con una copia escrita a mano | IMPORTANTE | alta | TASK-144 |
+| CMD1-02 | commands | Duplicación | `finish-verificacion.ts:574`, `finish-heldout.ts:76`, `fs/verificacion.ts:108`, `doctor.ts:154` | Copias de «git sin excepción» sin el timeout ni el entorno de `gitTexto`: un git colgado bloquea `finish` | IMPORTANTE | alta | TASK-145 |
+| CMD1-03 | commands | Duplicación | `finish-cobertura.ts:54-64` y `finish-heldout.ts:82-92` | `configBase` y `configDe` son la misma función; `CIERRE` está duplicada | IMPORTANTE | alta | TASK-145 |
+| CMD1-04 | commands | Duplicación | `finish-verificacion.ts:619-622` frente a `:234-239` | `puertaReintento` copia `opcionesEjecucion` | IMPORTANTE | alta | TASK-145 |
+| CMD1-05 | commands | Duplicación | `finish-verificacion.ts:166-199,352-379,402-422` | El bloque ejecutar → anotar → árbol limpio → memo → error está ×3 | IMPORTANTE | alta | TASK-145 |
+| CMD1-06 | commands | Duplicación | `finish.ts:572,595,605,606,735` | La base de la rama (hotfix sale de main) se decide 5 veces | IMPORTANTE | alta | TASK-145 |
+| CMD1-07 | commands | Duplicación | `finish.ts:785-794` y `:1016-1023` | La comprobación del tag de reintento está ×2 y la rama `else` es inalcanzable | IMPORTANTE | alta | TASK-145 |
+| CMD1-08 | commands | Duplicación | `doctor-deploy.ts:211` frente a `documento-estado.ts:60`; `:516` frente a `cli.ts:205` | `fechaLocal` es igual a `diaLocal`. `creado` sale en hora local aquí y en UTC en `new` | IMPORTANTE | alta | TASK-146 |
+| CMD1-09 | commands | Duplicación | `approve.ts:270`, `cadena.ts:237`, `finish-opciones.ts:56`, `doctor-deploy.ts:282`, `veredicto.ts:92`, `verificar-menores.ts:140`, `new.ts:88` | Siete extractores de flag con valor frente a `extraerRepetible`. `--flag=valor` vale en unos comandos y en otros no (va con CMD2-05) | IMPORTANTE | media | TASK-144 |
+| CMD1-10 | commands | Duplicación | `approve.ts:197,351,357`; `trocear.ts:86` | «Qué plan cuenta» se decide en 4 sitios. Con dos planes, `siguiente` manda a approve y approve aborta | IMPORTANTE | media | TASK-144 |
+| CMD1-11 | commands | Duplicación | `doctor-deploy.ts:344` frente a `:518` | Detecta el caso buscando un trozo del texto de un aviso | MENOR | alta | TASK-144 |
+| CMD1-12 | commands | Duplicación | `finish-verificacion.ts:182,190,197,375,412,418,526,532,654,660`; `finish-heldout.ts:228` | Textos de error repetidos 5 y 6 veces | MENOR | alta | TASK-145 |
+| CMD1-13 | commands | Diluvio | `approve.ts:346`; `finish-verificacion.ts:113`; `finish.ts:1151-1158` | Comentarios huérfanos encima de la función equivocada | MENOR | alta | TASK-145 |
+| CMD1-14 | commands | Diluvio | `finish.ts:567-612,649-650,687-701,697` | Spreads repetidos 5 veces y una condición redundante | MENOR | alta | TASK-145 |
+| CMD1-15 | commands | Desviación | `finish.ts:864-865`; `codex-review.ts:138` | Comentario obsoleto (B5) y un parámetro `_today` que no se usa | MENOR | alta | TASK-145 |
+| CMD2-01 | commands | Duplicación | `siguiente.ts:108-112` frente a `verificar-menores.ts:83-94` | Dos definiciones de «código cambiado tras el Commit revisado»: `siguiente` no excluye `rutas_sincronizacion` ni `excluir_de_revision`. Con `comando_sincronizacion`, `siguiente` pregunta en modo automático aunque no haya cambiado nada revisado. Leído en las dos partes, no ejecutado | IMPORTANTE | alta | TASK-144 |
+| CMD2-02 | commands | Duplicación | `review.ts:128,1025-1026` frente a `fs/rondas.ts:81-88` | Tercera escritura del patrón de ficheros de ronda | IMPORTANTE | alta | TASK-144 |
+| CMD2-03 | commands | Duplicación | `pausa.ts:69-78`, `registrar-coste.ts:461-470`, `siguiente.ts:150-153` | «La tarea vive en su rama» está ×3 | IMPORTANTE | alta | TASK-144 |
+| CMD2-04 | commands | Duplicación | `verificar-menores.ts:220-228,317-323`, `siguiente.ts:190,202-204`, `review.ts:470-477` | «Commit revisado de la última ronda» se calcula ×5: unos exigen la misma ronda y otros no | IMPORTANTE | media | TASK-144 |
+| CMD2-05 | commands | Duplicación | `veredicto.ts:92-111`, `verificar-menores.ts:140-157` | Lectores a mano de un flag: `--motivo=x` aborta aunque `rechazarFlagsDesconocidos` lo acepta | IMPORTANTE | alta | TASK-144 |
+| CMD2-06 | commands | Duplicación | `import.ts:64-70,86-141,280-299` frente a `new.ts:51-62,151-155,170-236,294-304`; `doctor-deploy-tareas.ts:103` | `import` copia la validación y los defaults de `new` (`'sonnet'` ×3), no usa `componerCuerpo` y no propone complejidad | IMPORTANTE | alta | TASK-146 |
+| CMD2-07 | commands | Duplicación | `roadmap.ts:52,77,99-106` frente a `fs/roadmap.ts:111-118,149-200` | `--comparar` decide con menos reglas que `prepararRoadmap` (mayúsculas, cambios sin commitear) | IMPORTANTE | alta | TASK-146 |
+| CMD2-08 | commands | Duplicación | `trocear.ts:55`; `task-id.ts:12` | Más copias de la regex del ID (va con FS-04) | IMPORTANTE | alta | TASK-147 |
+| CMD2-09 | commands | Duplicación | `plan.ts:123-124,887,1001`; `approve.ts:317` | Fijan el prefijo `brainstorm-` que en realidad genera `plan-brainstorm.ts:40-46` | IMPORTANTE | alta | TASK-144 |
+| CMD2-10 | commands | Duplicación | `verificar-lote.ts:62-65` | `headDe` reimplementa `headCommit`, se traga el fallo y anota «lote en verde en » sin commit | IMPORTANTE | alta | TASK-146 |
+| CMD2-11 | commands | Duplicación | `verificar-lote.ts:68-81` | Reimplementa `listTareasEnEstados` con `catch {}`: un EACCES da «sin pendientes» | IMPORTANTE | alta | TASK-146 |
+| CMD2-12 | commands | Duplicación | `registrar-coste.ts:240-246` (y `:212,325,338`) | Suma los campos a mano en vez de usar `CAMPOS_COSTE`: un campo nuevo da `NaN` | IMPORTANTE | alta | TASK-146 |
+| CMD2-13 | commands | Duplicación | `metricas.ts:321-328,360-363`, `plan.ts:143-150`, `registrar-coste.ts:380-387` | `readdir` tolerante ×3 y `claveRuta` copiada de `fs/cobertura.ts:20` | IMPORTANTE | alta | TASK-146 |
+| CMD2-14 | commands | Desviación | `verificar-lote.ts:88-89,177-182` | Mensaje «taskctl taskctl», `-p` no admitido y `autoCommit` sin fase | MENOR | alta | TASK-144 |
+| CMD2-15 | commands | Desviación | `registrar-coste.ts:25-29`, `veredicto.ts:5-6`, `review.ts:12-14,598-600` | Cabeceras que contradicen al código (qué se commitea; TASK-018/019 ya están hechas) | MENOR | alta | TASK-146 |
+| CMD2-16 | commands | Diluvio | `plan.ts:636-665,783-817,898-913,1021-1031` | Historia de rondas de revisión dentro de `runPlan` | MENOR | media | TASK-146 |
+
+Ya cubiertos: A1, A4 y A6. `verificar-lote.ts:138-147` es una cuarta copia
+de A4 y se añade al criterio de TASK-138. La lectura de terminadas de
+`doctor.ts:783` la cubre ya el criterio 4 de TASK-138.
+
+### src/fs, src/hooks y cli
+
+| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
+|---|---|---|---|---|---|---|---|
+| FS-01 | cli | Duplicación | `cli/args.ts:110-121` frente a `review.ts:704-705`, `finish.ts:368`, `finish-verificacion.ts:74`, `estado.ts:124,129` | `FLAGS_SIN_VALOR` no incluye `--completa`, `--ronda-extra`, `--sin-verificacion`, `--seguir` ni `--stdin`. `review --completa=1` se ignora en silencio | IMPORTANTE | alta | TASK-144 |
+| FS-02 | cli | Duplicación | `cli.ts:875-888` frente a `:256-270` | `doctor-deploy` reescribe `printAutoCommit`, y la copia ya diverge | IMPORTANTE | alta | TASK-149 |
+| FS-03 | cli | Duplicación | `cli.ts:507,552,664,708,744,773` frente a `:837,927` | ~20 `catch` con listas distintas: `new`, `plan`, `approve`, `start`… no capturan `GitCommandError` | IMPORTANTE | media | TASK-149 |
+| FS-04 | fs | Duplicación | `fs/task-store.ts:27`, `fs/wip-scan.ts:37`, `fs/roadmap.ts:39` frente a `core/task.ts:132` | La regex del ID está copiada 3 veces en fs | IMPORTANTE | alta | TASK-147 |
+| FS-05 | hooks | Duplicación | `hooks/freno-stop.ts:371`, `hooks/registro-coste.ts:103` frente a `hooks/entrada-pretooluse.ts:21` | Tres parsers de la entrada del hook; el compartido existe y no se usa | IMPORTANTE | alta | TASK-149 |
+| FS-06 | hooks/fs | Duplicación | `freno-stop.ts:131`, `guardia-heldout.ts:61`, `guardia-merge.ts:225,415`, `fs/git.ts:161` | Cuatro «rama actual»: durante un rebase, una protege la tarea y otra devuelve null | IMPORTANTE | media | TASK-149 |
+| FS-07 | fs/hooks | Duplicación | `fs/verificacion.ts:107`, `guardia-merge.ts:77`, `guardia-heldout.ts:55`, `fs/sincronizacion.ts:329` frente a `fs/git-crudo.ts:44` | Cinco envoltorios de git con distinto `maxBuffer` y entorno (va con CMD1-02) | IMPORTANTE | media | TASK-149 |
+| FS-08 | fs | Duplicación | `freno-ultimo-verde.ts:18`, `registro-puertas.ts:13`, `coste-pendiente.ts:40`, `verificacion.ts:181`, `pendientes.ts:187`, `guardia-heldout.ts:66` | `rev-parse --git-path` ×6; `pendientes` repite `operacionEnCurso` | IMPORTANTE | alta | TASK-149 |
+| FS-09 | fs/hooks | Duplicación | `freno-stop.ts:178`, `guardia-merge.ts:214`, `decision-documentacion.ts:195`, `finish-cobertura.ts:61`, `finish-heldout.ts:89`, `finish-verificacion.ts:266` | La regex que quita `[ERROR]` está ×6 | IMPORTANTE | alta | TASK-145 |
+| FS-10 | fs | Duplicación | `fs/sondas-deploy.ts:176` frente a `:457` | Dos listas de lockfiles en el mismo fichero que ya divergen (`bun.lock`, `pdm.lock`…) | IMPORTANTE | alta | TASK-149 |
+| FS-11 | fs | Duplicación | `fs/evidencia-veredicto.ts:41` frente a `sondas-deploy.ts:97-115` | «Binario = NUL»: una copia no tiene la excepción UTF-16 | IMPORTANTE | media | TASK-149 |
+| FS-12 | fs | Duplicación | `fs/progreso.ts:104-126` frente a `ejecucion-acotada.ts:168` | Dos lecturas de cola: una no repite la lectura corta | IMPORTANTE | alta | TASK-149 |
+| FS-13 | fs | Duplicación | `herramientas-deploy.ts:18,36` frente a `status-line.ts:96,116` | Dos búsquedas en el PATH que divergen en `PATHEXT` | IMPORTANTE | media | TASK-149 |
+| FS-14 | fs | Duplicación | `json-claude.ts:14`, `status-line.ts:167-172`, `deteccion-tests.ts:46` | Tres lecturas de JSON con BOM | IMPORTANTE | media | TASK-149 |
+| FS-15 | fs | Duplicación | `fs/sincronizacion.ts:98-100` y `:220-221` | El texto `aMano` está copiado literal | IMPORTANTE | alta | TASK-149 |
+| FS-16 | fs | Duplicación | `sondas-deploy.ts:174,252`, `sondas-deploy-config.ts:52,65` frente a `deteccion-app.ts:17` | `nombreBase` está ×2 y los mensajes escriben `DIRS_EXCLUIDOS` a mano | MENOR | alta | TASK-149 |
+| FS-17 | hooks | Desviación | `registro-coste.ts:30`, `guardia-merge.ts:48` | Importan helpers del freno y cargan su grafo entero | MENOR | media | TASK-149 |
+| FS-18 | fs/cli | Desviación | `fs/git-commit.ts:473` | Un parser de argv vive en la capa fs | MENOR | alta | TASK-149 |
+
+### scripts (Git-Flow y raíz)
+
+| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
+|---|---|---|---|---|---|---|---|
+| SCR-01 | gitflow | Disfraz | `scripts/gitflow/resume-work.sh:89-96` | Calcula `stash_ref` y no lo usa: hace `stash pop` a secas (aplica `stash@{0}`), y el `grep "pause: $NAME"` casa prefijos. **Reproducido:** `feature/a` recibe el stash de `feature/ab`. El test (`wrappers.test.ts:412`) solo monta un stash | **CRÍTICO** | alta | TASK-142 |
+| SCR-02 | gitflow | Duplicación | `update-{feature,fix,release}.sh:25-72`, `update-hotfix.sh:26-76` | Cuatro copias de ~50 líneas sin el `fetch` que sí hace `create-release` | IMPORTANTE | alta | TASK-143 |
+| SCR-03 | gitflow | Duplicación | `create-hotfix.sh:24-88`, `create-release.sh:28-84` frente a `_gitflow-common.sh:365-439` | Copias en línea de `invoke_create_work_branch` que ya divergen | IMPORTANTE | alta | TASK-143 |
+| SCR-04 | gitflow | Duplicación | `merge-hotfix-to-main.sh` y `merge-release-to-main.sh` | Idénticos salvo 8 líneas | IMPORTANTE | alta | TASK-143 |
+| SCR-05 | gitflow | Duplicación | `merge-*-to-main.sh:123-143` frente a `_gitflow-common.sh:461-482` | El backmerge a develop se hace sin `pull --ff-only`: con la develop local atrasada, el push se rechaza y queda un estado a medias | IMPORTANTE | alta | TASK-143 |
+| SCR-06 | gitflow | Duplicación | 13 scripts, líneas ~4-17 | La lectura de argumentos está copiada; los `merge-*` no validan el nombre de rama | IMPORTANTE | alta | TASK-143 |
+| SCR-07 | gitflow+TS | Duplicación | `abort-merge.sh:9-32`, `diagnose-repo.sh:51-70`, `src/fs/git.ts:134-158` | La operación en curso se detecta ×3 sin test de paridad; borrar `diagnose-repo.sh:62-70` no rompe ningún test | IMPORTANTE | alta | TASK-143 |
+| SCR-08 | TS frente a bash | Duplicación | `src/fs/git.ts:191-197,765,781` frente a `_gitflow-common.sh:281-313` | Los `ls-remote` de TS van sin `GIT_TERMINAL_PROMPT=0` ni límite de tiempo, y `finish` resuelve la rama main dos veces | IMPORTANTE | alta | TASK-143 |
+| SCR-09 | gitflow | Duplicación | `pause-work.sh:22-24,45-47` | Push sin `detect_origin_available`. **Reproducido:** sin origin sale con exit 1 | IMPORTANTE | alta | TASK-142 |
+| SCR-10 | gitflow | Disfraz | `push-back-to-remote.sh:207-222` | Un push fallido solo deja un aviso y el resumen dice COMPLETADO, con exit 0 | IMPORTANTE | alta | TASK-142 |
+| SCR-11 | gitflow | Disfraz | `mirror-to-remote.sh:3,80-85`; `_gitflow-common.sh:558,565` | Promete «TODO el histórico» y `--mirror`, pero hace `push --all` + `--tags`: solo ramas locales y sin sobreescribir | IMPORTANTE | alta | TASK-142 |
+| SCR-12 | gitflow | Duplicación | `diagnose-repo.sh:9,21-31` | Detección de origin en línea que se salta la caché de TASK-038; `develop` está fijo | IMPORTANTE | alta | TASK-143 |
+| SCR-13 | raíz | Duplicación | `scripts/perfil-tests.mjs:206` frente a `scripts/verificar-impacto.mjs:402-453` (raíz del repo) | `perfil-tests` recompila `dist/src` sin la copia ni el cerrojo de TASK-136 | IMPORTANTE | media | TASK-143 |
+| SCR-14 | gitflow | Desviación | `scripts/gitflow/README.md:20-25,55-56`; `switch-working-remote.sh:4,102`; `push-back-to-remote.sh:259` | «Copia literal del zip» y «19 scripts» (hay 24) | MENOR | alta | TASK-142 |
+| SCR-15 | gitflow | Diluvio | `push-back-to-remote.sh:224-237,249-254` | `--mirror` sube referencias que la vista previa no enseña; el nombre de backup está duplicado | MENOR | media | TASK-143 |
+
+Ya cubiertos: C1 y B3 (TASK-139 y TASK-140).
+
+### skills, agents y hooks
+
+| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
+|---|---|---|---|---|---|---|---|
+| CONT-01 | skills | Duplicación | `skills/task-workflow/sincronizacion.md:36-37` frente a `SKILL.md:190-192`, `config.ts:104` | Dice que una clave mal escrita aborta, y desde TASK-061 avisa y se ignora | IMPORTANTE | alta | TASK-150 |
+| CONT-02 | skills | Duplicación | `task-workflow/cierre.md:61-62` frente a `SKILL.md:261`, `finish.ts:403-406` | «finish no lee las casillas», y sí las lee y avisa | IMPORTANTE | alta | TASK-150 |
+| CONT-03 | skills | Duplicación | `review/SKILL.md:82`, `task-workflow/tests-pesados.md:11-12` frente a `revision.md:93-94` | Test duplicado = MENOR, cuando la Regla 4D dice IMPORTANTE | IMPORTANTE | alta | TASK-150 |
+| CONT-04 | skills | Duplicación | `revision.md:59-63` frente a `revision.md:272-273` y 4 revisoras | «Pídelo explícitamente» frente a «léelo y anótalo» (TASK-081): un subagente no tiene a quién pedírselo | IMPORTANTE | alta | TASK-150 |
+| CONT-05 | skills | Duplicación | Las 5 revisoras (`code-quality:289-299`, etc.) frente a `review.ts:590-620`, `revision.md:164-177` | La plantilla del informe está ×7. Las de las skills no traen tabla, ni `## Regla 4D`, ni lecturas fuera de contexto | IMPORTANTE | alta | TASK-150 |
+| CONT-06 | agents | Duplicación | `agents/brainstorm-*.md` frente a `src/core/roles-brainstorm.ts:79-200` | Dos formatos de salida incompatibles para cada rol | IMPORTANTE | alta | TASK-150 |
+| CONT-07 | agents | Duplicación + disfraz | `brainstorm-unificador.md:118-157`, `brainstorm-arquitectura.md:70,97-101` frente a `plan.ts:257-271`, `duracion.md:10-11` | Los agentes tienen prohibido estimar plazos y diseñar pruebas, pero el plan exige `Duracion estimada` y el presupuesto de tests | IMPORTANTE | alta | TASK-150 |
+| CONT-08 | skills | Duplicación + disfraz | `start/SKILL.md:29-33` frente a `review/SKILL.md:29-43`, `autorrevision.ts:23-44` | La línea 4D de Autorrevisión: `tieneAutorrevision` se da por satisfecha con cualquier línea | IMPORTANTE | alta | TASK-150 |
+| CONT-09 | skills | Disfraz | `csharp-autocad-ifc-reviewer/SKILL.md:3` frente a `revisores.ts:160-200` | «O la tarea menciona…», pero el reparto solo mira patrones de fichero | IMPORTANTE | media | TASK-150 |
+| CONT-10 | skills | Duplicación | Paso de cadena ×7, «la cifra no es el coste» ×6, tope de rondas ×3, MENORES ×3, una suite por ronda ×6 | Hoy coinciden; los casos 01 a 05 enseñan que así divergen | IMPORTANTE | alta | TASK-150 |
+| CONT-11 | agents | Desviación | `brainstorm-riesgos.md:21-22`, `testing:20-21`, `dominio:22-23`, `unificador:51-53,105-112` | Instrucciones para casos que nunca se dan | MENOR | alta | TASK-150 |
+| CONT-12 | agents | Diluvio | `brainstorm-testing.md:129-149` | Nota de 20 líneas, y además falsa (en `alta` sale dominio, no testing) | MENOR | alta | TASK-150 |
+| CONT-13 | skills | Diluvio | `angular-vue-reviewer:45-139`, `rust-wasm-reviewer:60-138`, `csharp:53-71` | Justificaciones de diseño para quien mantiene el plugin, no para quien revisa | MENOR | alta | TASK-150 |
+| CONT-14 | skills | Diluvio | `review/SKILL.md:69-120` | Un paso de 50 líneas que repite `revision.md` | MENOR | alta | TASK-150 |
+| CONT-15 | skills | Diluvio | `verificacion-selectiva.md:139-173`, `sincronizacion.md:105-108`, `duracion.md:27-28` | Historial de versiones dentro de las instrucciones | MENOR | alta | TASK-150 |
+| CONT-16 | skills | Desviación | `sincronizacion.md:9,34-35,41-42` | «Tres claves» (son 4) y «ocho comandos» (son 17) | MENOR | media | TASK-150 |
+| CONT-17 | hooks | Desviación | `hooks/sonda-hooks.mjs`, `hooks/test/sonda-hooks.test.sh` | Sonda inerte del spike de TASK-069, que se publica con el plugin | MENOR | alta | TASK-150 |
+| CONT-18 | skills | Desviación | `angular-vue-reviewer/SKILL.md:309-312` frente a `:318-319` | El mismo caso aparece como CRÍTICO y como IMPORTANTE | MENOR | media | TASK-150 |
+
+### Tests
+
+| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
+|---|---|---|---|---|---|---|---|
+| TCMD-01 | test/commands | Disfraz | `test/commands/doctor-correcciones.test.ts:111` | `t.skip` si tarda más de 25 s: quitar el timeout de `doctor.ts:383` convierte el fallo en un skip | IMPORTANTE | alta | TASK-151 |
+| TCMD-02 | test/commands | Disfraz | `doctor-deploy.test.ts:243-263` | Las carpetas están en `.gitignore` o no existen. **Mutación M6: verde** | IMPORTANTE | alta | TASK-151 |
+| TCMD-03 | test/commands | Disfraz | `approve.test.ts:233,242`, `plan.test.ts:388,426`, `start-basico.test.ts:293` | Prometen «sin efectos» y «error claro», pero solo comprueban la clase del error | IMPORTANTE | alta | TASK-151 |
+| TCMD-04 | test/commands | Disfraz | `review-incremental.test.ts:222-236` | Se salta en Linux y el `rejects` no tiene matcher. **M7: rojo solo en Windows; M8: verde** | IMPORTANTE | alta | TASK-151 |
+| TCMD-05 | test/commands | Disfraz | `plan.test.ts:947-990` | Promete «workspace limpio» y no ejecuta `git status` | IMPORTANTE | media | TASK-151 |
+| TCMD-06 | test/commands | Duplicación | `doctor-deploy.test.ts:35-111` frente a `helpers/deploy-fixtures.ts:16-104` | Copia literal del helper que salió de este mismo fichero | IMPORTANTE | alta | TASK-152 |
+| TCMD-07 | test/commands | Duplicación | `siguiente.test.ts:22-50`, `cadena.test.ts:13-36`, `semiautomatico.test.ts:19-45` | Copias de `automatico-fixtures` que no usan `plantillaRepo` | IMPORTANTE | alta | TASK-152 |
+| TCMD-08 | test/commands | Duplicación | `git`/`commitAll` locales en 25 ficheros; `sampleTask` en 7 | Ya divergen (devuelven `void` o `string`; unas aceptan el commit vacío y otras no) | IMPORTANTE | alta | TASK-152 |
+| TCMD-09 | test/commands | Duplicación | `codex-review.test.ts:89-117`, `validacion-puertas.test.ts:173-195` frente a `helpers/finish-fixtures.ts:82-117` | Solo una copia trae la Regla 4D | IMPORTANTE | alta | TASK-152 |
+| TCMD-10 | test/commands | Duplicación | Verificador falso en 10 ficheros + 4 en `test/hooks` | No hay helper, y las variantes cambian lo que imprimen | IMPORTANTE | alta | TASK-152 |
+| TCMD-11 | test/commands | Duplicación | `doctor-deploy*.test.ts` (×4), `core/doctor-deploy-reglas.test.ts:33` | «Ninguna subcadena de 8» está ×5 | IMPORTANTE | media | TASK-152 |
+| TCORE-01 | test/fs | Disfraz | `test/fs/git.test.ts:621,664` | `echo %*` une los argumentos. **M5: verde** | IMPORTANTE | alta | TASK-151 |
+| TCORE-02 | test/core | Disfraz | `test/core/board-format.test.ts:96` | 001, 002 y 010 salen igual por orden alfabético. **M1: verde** | IMPORTANTE | alta | TASK-151 |
+| TCORE-03 | test/core | Disfraz | `test/core/state-machine.test.ts:252` | Prueba 5 de 8 comandos; la guarda de `verificar-menores` no tiene test. **M2: verde** | IMPORTANTE | alta | TASK-151 |
+| TCORE-04 | test/core | Duplicación | `metricas.test.ts:37`, `metricas-fila.test.ts:28`, `metricas-finish.test.ts:11` y 12 fábricas más | Fábricas de `Task` con `as Task` en vez de `helpers/tarea-ejemplo.ts` | IMPORTANTE | alta | TASK-152 |
+| TCORE-05 | test/fs | Duplicación | `fs/git.test.ts:26-41`, `git-commit.test.ts:25-55`, `git-identidad.test.ts:15-28`, `wip-scan.test.ts:23,56` | `git()` local; hay 47 en toda la suite | IMPORTANTE | alta | TASK-152 |
+| TCORE-06 | test/core | Duplicación | `rechaza` ×4, `errorDe` ×2, `errorAccionable` ×2, `conDir` ×2 | El mismo helper con distinta exigencia | IMPORTANTE | alta | TASK-152 |
+| TCORE-07 | test/fs | Disfraz | `test/fs/task-store.test.ts:94,103` | **Descartado:** la mutación M3 lo pone en rojo | — | — | — |
+| TCORE-08 | test/fs | Disfraz | `test/fs/task-store-wip.test.ts:135` | Los datos ya salen ordenados por cómo se crean. **M4: verde** | IMPORTANTE | alta | TASK-151 |
+| TCORE-09 | test/fs | Disfraz | `test/fs/rondas-aprobada.test.ts:44` | Ninguna ronda llega a 10 (el tope es 10): el orden alfabético y el numérico coinciden | IMPORTANTE | media | TASK-151 |
+| TRES-01 | test/helpers | Duplicación | ~50 `git()`, 22 `commitAll` con dos semánticas, ~31 fábricas de `Task`, montaje del freno ×4, `cli-main.test.ts:36,61` igual a `cli-flags-desconocidos.test.ts:83,103` | Helpers repetidos que ya divergen | IMPORTANTE | alta | TASK-152 |
+| TRES-02 | test/skills | Duplicación | `MARCAS_DEL_REPO` ×5 (`fases.test.ts:54`, `doctor-deploy.test.ts:36`, `revisores.test.ts:91`, `task-workflow.test.ts:627`, `agents/brainstorm-roles.test.ts:189`) | Ya divergen: `fases` no prohíbe `informetemplate` | IMPORTANTE | alta | TASK-152 |
+| TRES-03 | test/skills | Duplicación | `lo-que-lees.test.ts:23`, `autorrevision.test.ts:21`, `task-workflow.test.ts:403`, `revisores.test.ts:709,724`, `empaquetado/readme.test.ts:75` | Seis extractores de sección, cada uno con su semántica | IMPORTANTE | alta | TASK-152 |
+| TRES-04 | test/skills | Duplicación | `revisores.test.ts:1145-1159,1219` frente a `helpers/validador-claude.ts:2-10` | Usa el criterio `✘` que TASK-075 sustituyó | IMPORTANTE | alta | TASK-152 |
+| TRES-05 | test/skills | Duplicación | `tamanos.test.ts:58` frente a `task-workflow.test.ts:510` | Topes contradictorios (18 KB frente a 15.360 B) para el mismo fichero | IMPORTANTE | alta | TASK-152 |
+| TRES-06 | test/integracion | Disfraz | `integracion/plugin-instalado.test.ts:15-19` | Acepta cualquiera de los tres estados | IMPORTANTE | alta | TASK-151 |
+| TRES-07 | test/hooks | Disfraz | `hooks/guardia-documentacion.test.ts:55` (casos `:303-333`) | `ejecutadoAlguno` no mira `cuenta-sel` | IMPORTANTE | alta | TASK-151 |
+| TRES-08 | test/hooks | Disfraz | `hooks/salida-temprana.test.ts:103-109` | **M9: verde** con `integra = true` | IMPORTANTE | alta | TASK-151 |
+| TRES-09 | test/skills | Disfraz | `skills/fases.test.ts:193,217,290` | `indexOf` sin comprobar el -1 | IMPORTANTE | alta | TASK-151 |
+| TRES-10 | test/gitflow | Duplicación | `runScript` ×4 (`merge-to-main.test.ts:37`, etc.); `scripts/perfil-tests.test.ts:24` | Usan el bash del PATH, no `resolverBash` | IMPORTANTE | media | TASK-152 |
+| TRES-11 | test/helpers | Diluvio | `helpers/*-fixtures.ts:4-19`, `metricas-repos.ts:16` | Imports muertos: `verificar-impacto` selecciona tests de más | MENOR | alta | TASK-152 |
+| TRES-12 | test/cli | Disfraz | `cli/estado.test.ts:125-143` | Promete que un flag desconocido sale con 1 y no lo prueba. **M10: verde** | MENOR | alta | TASK-151 |
+| TRES-13 | test/gitflow | Desviación | `scripts/gitflow/test/smoke-test.sh:3-5`; `empaquetado/sin-literales-secretos.test.ts:205-210` | Cita documentos internos; hay claves falsas fuera de `claves-falsas.ts` | MENOR | alta | TASK-152 |
+
+Ya cubiertos: B4, B5, C2 y el skip de symlink de TASK-120.
+
+## Tareas de seguimiento
+
+Agrupadas por regla y área; ninguna corresponde a un solo caso.
+
+| Tarea | Regla y área | Casos |
+|---|---|---|
+| TASK-142 | Disfraz en Git-Flow | SCR-01 (CRÍTICO), SCR-09, SCR-10, SCR-11, SCR-14 |
+| TASK-143 | Duplicación en Git-Flow (bash y TS) | SCR-02..08, SCR-12, SCR-13, SCR-15 |
+| TASK-144 | Ciclo de vida, cadena y flags en commands | CMD1-01, CMD1-09..11, CMD2-01..05, CMD2-09, CMD2-14, FS-01 |
+| TASK-145 | Duplicación en las puertas de finish | CMD1-02..07, CMD1-12..15, FS-09 |
+| TASK-146 | Duplicación en comandos sueltos | CMD1-08, CMD2-06, CMD2-07, CMD2-10..13, CMD2-15, CMD2-16 |
+| TASK-147 | Lectores de secciones e IDs en core | CORE1-01, CORE1-02, CORE2-01, CORE2-02, CORE2-04..07, CORE2-12..14, FS-04, CMD2-08 |
+| TASK-148 | Catálogos, config y utilidades en core | CORE1-03..14, CORE2-08..10, CORE2-15..21 |
+| TASK-149 | Duplicación en fs, hooks y cli | FS-02, FS-03, FS-05..08, FS-10..18 |
+| TASK-150 | Skills y agentes con una sola fuente por regla | CONT-01..18, CORE2-03 |
+| TASK-151 | Disfraz en tests | TCMD-01..05, TCORE-01..03, TCORE-08, TCORE-09, TRES-06..09, TRES-12 |
+| TASK-152 | Duplicación de helpers de test | TCMD-06..11, TCORE-04..06, TRES-01..05, TRES-10, TRES-11, TRES-13 |
+| TASK-138 (ampliada) | Duplicación en métricas | CORE2-11, mediana de `metricas.ts:1004`, `verificar-lote.ts:138-147` |
+
+Varias de estas tareas pasan de una hora: al planificarlas se trocearán con
+la regla de duración. Por orden, primero TASK-142 (el CRÍTICO) y TASK-144
+(la cadena y `siguiente`).
+
+## Resumen por área
+
+147 casos distintos (150 reportados: dos unificados y uno descartado). 1
+CRÍTICO, 117 IMPORTANTE y 29 MENOR.
+
+| Área | Casos | Duplicación | Disfraz | Diluvio | Desviación |
+|---|---:|---:|---:|---:|---:|
+| src/core | 33 | 28 | 1 | 3 | 1 |
+| src/commands | 31 | 24 | 1 | 3 | 3 |
+| src/fs, hooks, cli | 18 | 16 | 0 | 0 | 2 |
+| scripts | 15 | 10 | 3 | 1 | 1 |
+| skills, agents, hooks | 18 | 9 (2 con disfraz) | 1 | 4 | 4 |
+| test/commands | 11 | 6 | 5 | 0 | 0 |
+| test/core + test/fs | 8 | 3 | 5 | 0 | 0 |
+| test resto | 13 | 6 | 5 | 1 | 1 |
+| **Total** | **147** | **102** | **21** | **12** | **12** |
+
+En la columna Duplicación de skills, agents y hooks, dos casos (CONT-07 y
+CONT-08) son a la vez duplicación y disfraz.
+
+## Conclusión
+
+**Predomina la duplicación: 102 de 147 casos, casi siete de cada diez.**
+Está en todas las áreas, pero sobre todo en `src/core` y `src/commands`. El
+patrón se repite en las tres capas: cada tarea escribe su propio lector (de
+una sección de `tarea.md`, de un ID, de un flag, de git sin excepción) en vez
+de usar el que ya existe: `rangoDeSeccion`, `extraerSecciones`,
+`extraerRepetible`, `gitTexto`. Las copias no siguen iguales mucho tiempo.
+Muchas ya divergen, y varias esconden un fallo latente: IDs con
+letra mal ordenados, `--flag=valor` ignorado, un timeout que falta, un
+lockfile que se escanea.
+
+**El disfraz se concentra en los tests (15 de 21) y en Git-Flow (3).** Ocho
+de diez mutaciones dejan el test en verde con el código roto. Hay dos
+formas: nombres que prometen más de lo que comprueban (`sin efectos`,
+`error claro`, `ordena numéricamente`) y datos de prueba que no distinguen
+el comportamiento (IDs de una cifra, un solo stash, carpetas ignoradas). El
+único CRÍTICO (SCR-01) es justo esa combinación: un script que hace otra
+cosa y un test que no la ve.
+
+**Desviación y diluvio pesan poco (24 casos, todos MENOR)** y se concentran
+en las skills y los agentes: historial de versiones dentro de las
+instrucciones, justificaciones de diseño y reglas copiadas que ya se
+contradicen con el código.
+
+La lección para la Regla 4D: la autorrevisión de `start` («busca el helper
+antes de crear uno») y la mutación de cada test nuevo atacan justo las dos D
+que predominan. Esta auditoría es la deuda acumulada antes de que existieran.
diff --git a/docs/auditoria-4d.md b/docs/auditoria-4d.md
index 277f8be..628b986 100644
--- a/docs/auditoria-4d.md
+++ b/docs/auditoria-4d.md
@@ -5,6 +5,8 @@
 > `taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md`).
 > Solo lectura: la auditoría no corrige nada (hacerlo aquí sería desviación);
 > cada caso tiene su tarea de seguimiento.
+>
+> La auditoría de todo el código (TASK-141) está en `docs/auditoria-4d-completa.md`.
 
 ## Método
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/00-planificadas/TASK-138/tarea.md                                                                     |  4 ++--
 tareas/{01-en-diseno => 02-en-curso}/TASK-141/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-141/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-141/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-141/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-141/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-141/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-141/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-141/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-141/tarea.md                                                       | 16 +++++++++++-----
 10 files changed, 13 insertions(+), 7 deletions(-)
````

## Verificacion de esta ronda

- Tipo: ninguna: la tarea solo cambia documentacion (21 fichero(s) dentro de rutas_documentacion de "develop") y el proyecto no declara comando_verificacion_documentacion, asi que no se ha corrido ningun test ni ninguna comprobacion. No sustituye a la completa: el cierre la exige sobre el commit que se integra.
