# Segunda auditoría 4D completa — después de las correcciones

> 2026-11-25, sobre `develop` en `fd02c48` (tras cerrar TASK-143). Mide si las
> correcciones de la primera auditoría (`docs/auditoria-4d-completa.md`,
> TASK-141, 2026-11-22) bajaron los hallazgos. Regla 4D: sin **duplicación**,
> **desviación**, **diluvio** ni **disfraz**; la definición está en
> `taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md`,
> sección «Regla 4D».
>
> Solo lee: no corrige nada. Cada caso nuevo tiene su tarea de seguimiento
> (TASK-159..166). Los casos de la primera que siguen abiertos a propósito
> están en TASK-140, TASK-150 y TASK-152.

## En una frase

Las correcciones resolvieron lo que apuntaban: de los 150 casos de la primera
auditoría, **99 están corregidos del todo** y protegidos por un test, 14 a medias
y 37 siguen esperando a TASK-150 y TASK-152, como estaba previsto. La segunda
pasada encuentra 130 casos nuevos, 81 IMPORTANTES y 49 MENORES y ningún CRÍTICO. La
duplicación que queda es de grano más fino (helpers que no llegaron a todos los llamadores,
copias que dejaron las propias correcciones). El disfraz baja; la duplicación
de helpers de test no.

## Mapa y reparto

Las mismas áreas y el mismo método que la primera, para que la comparación sea
limpia: diez agentes de solo lectura (modelo sonnet) en paralelo, uno por área,
con una consigna común. Cada uno marcó qué casos de la primera seguían y
buscó casos nuevos, incluidos los que hubieran traído las correcciones.

| Área | Agente | Lectura |
|---|---|---|
| `src/core` a–g | C1 | 9 ficheros enteros, 13 por tramos, el resto por búsquedas |
| `src/core` h–z | C2 | ~38 ficheros enteros, 4 en diagonal; reprodujo 8 casos importando `dist/src/core` |
| `src/commands` approve–finish | K1 | los 13 ficheros enteros |
| `src/commands` import–wrappers | K2 | 12 enteros; `plan`, `review` y `metricas` por búsquedas |
| `src/fs` | FS | 14 enteros, 3 casi enteros, 11 en diagonal, 9 sin leer |
| `src/hooks`, `src/cli`, `cli.ts` | HK | todos enteros; 2 mutaciones propias |
| `scripts/gitflow` y `scripts/` de la raíz | SC | todos enteros; reprodujo SC-01 y SC-06 con repos temporales |
| `skills/`, `agents/`, `hooks/` | CT | 7 enteros, el resto por tramos y búsquedas (comandos y flags contra `src/`) |
| `test/commands` | TC | los 104 en diagonal con scripts de recuento; ~30 tramos a fondo |
| resto de `test/` | TR | ~25 enteros, ~24 por diff, el resto por búsquedas |

Excluidas, como en la primera: `dist/`, `node_modules/`, `tareas/`, `docs/`,
catálogos `.yml` (datos) y `test/fixtures/`.

## Verificación del coordinador

1. **Reapertura en el código** de nueve casos de confianza alta de seis áreas:
   K2-01, K2-06, K1-11, SC-12, FS-14, FS-16, CT-1, C2-11 y SC-01. Los nueve se
   sostienen.
2. **SC-01 reproducido** en un repo temporal: `merge-hotfix-to-main.sh` en un
   repo sin develop sale con 1 y deja main mergeada y el tag creado. No lo
   introdujo TASK-143 (antes el `checkout` de develop también fallaba después
   del merge), pero la guarda nueva de TASK-143a solo cubre develop divergida.
3. **Mutación.** Sobre una copia del plugin compilado en
   `%LOCALAPPDATA%\pruebas-claude\taskcode\auditoria-4d-2`, cada mutación rompe
   lo que el test dice probar y ejecuta solo ese test. Muestra: 8.

| # | Caso | Mutación | Test | Resultado |
|---|---|---|---|---|
| M1 | TC-3 | `review`: escribir los ficheros de la ronda con `flag: 'w'` en vez de `'wx'` | `commands/review-incremental` | **verde**: disfraz confirmado |
| M2 | TC-4 | `plan`: el error de «falta el ID» con mensaje vacío | `commands/plan`, «error claro si falta el ID» | **verde**: disfraz confirmado |
| M3 | K1-8 | `cli/args`: quitar `--merge-request` de `FLAGS_SIN_VALOR` | `cli/flags-paridad` | **rojo** (2 tests): se descarta K1-8 |
| M4 | TR-4 | `config`: `validarCierrePorDefecto` acepta cualquier texto | `core/config-validacion-comun`, «"mr" no sugiere "merge"» | **verde**: disfraz confirmado |
| M5 | K2-11 | `veredicto`: quitar `rechazarFlagsDesconocidos` | `commands/flags-repetidos` | **rojo**: se descarta K2-11 |
| M6 | SC-08 | `mirror-to-remote.sh`: `push --force … --all` | `gitflow/disfraz-gitflow` | **verde**: disfraz confirmado |
| M7 | C2-28 | `fs/git`: `PATRONES_TEST` como literal, sin derivar de `CARPETAS_TEST`/`MARCAS_TEST` | `core/utilidades-core` | **verde**: disfraz confirmado |
| M8 | HK-2a | `guardia-merge`: no reconocer lo ya integrado en la principal | `commands/finish-reintento` | **verde**: disfraz confirmado (el agente HK lo vio también con `guardia-merge` y `guardia-documentacion`) |

De ocho mutaciones, seis quedan en verde con el código roto y dos descartan su
caso. En la primera auditoría fueron ocho de diez.

## Comparación con la primera auditoría

**Casos de la primera, por estado** (por ID; la primera tenía 147 casos
contados y algunos IDs eran alias o descartes):

| Grupo | IDs | Corregidos | A medias | Siguen (previsto) |
|---|---:|---:|---:|---:|
| CORE1 | 14 | 10 | 4 | 0 |
| CORE2 | 21 | 14 | 5 | 2 (TASK-150; uno documentado como excepción) |
| CMD1 | 15 | 15 | 0 | 0 |
| CMD2 | 16 | 15 | 1 | 0 |
| FS | 18 | 17 | 1 | 0 |
| SCR | 15 | 12 | 3 | 0 |
| CONT | 18 | 1 | 0 | 17 (TASK-150) |
| TCMD | 11 | 5 | 0 | 6 (TASK-152) |
| TCORE | 9 | 5 | 0 | 4 (3 de TASK-152 y la nota de TCORE-07) |
| TRES | 13 | 5 | 0 | 8 (TASK-152) |
| **Total** | **150** | **99** | **14** | **37** |

**Hallazgos de cada pasada:**

| | Primera (2026-11-22) | Segunda (2026-11-25) |
|---|---:|---:|
| CRÍTICO | 1 | 0 |
| IMPORTANTE | 122 | 81 |
| MENOR | 24 | 49 |
| **Total** | **147** | **130** |
| Disfraz en tests confirmado por mutación | 8 de 10 | 6 de 8 |

El número de casos nuevos no es comparable uno a uno con el de la primera: la
segunda pasada va sobre un código ya limpio de lo grueso y llega a grano más
fino (expresiones de una línea copiadas, comentarios que se quedaron tras una
corrección). Lo comparable es la gravedad (ningún CRÍTICO, ningún fallo que
pierda datos) y la naturaleza: casi toda la duplicación nueva es un helper que
ya existe y no llegó a todos sus llamadores.

## Casos por área

Leyenda: **D** = Duplicación, Desviación, Diluvio o Disfraz. **conf.** = confianza. «(= X)» marca un caso que otro agente encontró también; se cuenta una sola vez, en X. Las rutas son relativas a `taskcode-marketplace/plugins/taskcode-plugin/` salvo `scripts/verificar-impacto.mjs` y `scripts/perfil-tests.mjs`, de la raíz.

### src/core (a–g)

**Casos de la primera auditoría.** CORE1-01 corregido (duracion-estimada.ts:80-83,107-113; secciones-comunes.test.ts:26,93) · CORE1-02 corregido (transiciones.ts:230 anadirSeccionAlFinal, 7 usos; secciones-comunes.test.ts:20) · CORE1-03 corregido (raiz-plugin.ts:15-24, 5 usos) · **CORE1-04 corregido en validadores, persiste el esqueleto (C1-2)** · CORE1-05 corregido (catalogo-skills.ts:185 claveDeBloque) · CORE1-06 corregido (config.ts:1344,1410 masParecida; test :34-37) · **CORE1-07 corregido en lo numerico, persiste textos y listas (C1-6)** · CORE1-08 corregido (config.ts:648; test paridad :24) · **CORE1-09 persiste parcial**: cierresDeMerge sigue con args.includes('--continue') (comando-merge.ts:435) mientras esControlDeMerge (:165-173) salta el valor de -m; `git merge -m --continue x` se clasifica de dos maneras; test utilidades-core.test.ts:20-24 solo cubre -C/-c · CORE1-10 corregido (ruta-relativa.ts:23-31) · CORE1-11 corregido (diaDe; utilidades-core.test.ts:26-32) · CORE1-12 corregido (solapeDeEtiquetas) · CORE1-13 corregido salvo residuos (C1-3, C1-7) · CORE1-14 corregido · CORE2-01 corregido (compararIds task.ts:164) · CORE2-10 corregido (quitarAnsi unico) · **CORE2-11 persiste parcial**: evolucion.ts:117-128 tramoDe repite medianaMinutos (:108-114) · CORE2-14 corregido (esIdTroceable task.ts:148) · **CORE2-20 persiste parcial**: celdaNumero en metricas.ts:733, pero inline en grupos-metricas.ts:156,158 y versiones-metricas.ts:129,163,169.

| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
|---|---|---|---|---|---|---|---|
| C1-1 | core | Duplicacion | `catalogo-skills.ts:106-123, doctor-deploy-catalogo.ts:388-402, heuristica.ts:147-165 (+ revisores.ts:130)` | tres cargarX con el mismo ruta ?? resolver, readFileSync y catch con el mismo consejo; creada por TASK-148a | IMPORTANTE | alta | TASK-160 |
| C1-2 | core | Duplicacion | `catalogo-skills.ts:177-190 vs doctor-deploy-catalogo.ts:222-249; clave ausente en catalogo-skills.ts:350, heuristica.ts:283, doctor-deploy-catalogo.ts:275` | esqueleto de agrupacion por N con textos y reglas de rango distintas | IMPORTANTE | media | TASK-160 |
| C1-3 | core | Duplicacion | `comando-tests.ts:47,49; doctor-deploy-reglas.ts:218; doctor-deploy-veredictos.ts:85,129,135` | 6 «objeto plano» en linea que reimplementan esObjeto (utilidades-texto.ts:9); comando-tests.ts:47 acepta un array | IMPORTANTE | alta | TASK-160 (= C2-17) |
| C1-4 | core | Duplicacion | `doctor-deploy.ts:252-254, menores.ts:170, roadmap.ts:214` | tres escapes de celda markdown con reglas distintas | IMPORTANTE | media | TASK-159 (= C2-7) |
| C1-5 | core | Duplicacion | `coste-registro.ts:100-121,145-150 vs transiciones.ts:117-129,258-290` | anadirCoste y anadirTransicion: mismo algoritmo de tabla; leerCostes reescribe celdasDe (transiciones.ts:122) | IMPORTANTE | alta | TASK-160 |
| C1-6 | core | Duplicacion | `config.ts:1158-1180 vs :1371-1397; config.ts:1415-1453 vs campos-catalogo.ts:57-130` | validarComando y validarTextoNoVacio iguales salvo mensaje; politica de repetidos contraria (config colapsa, catalogos rechazan) sin comentario | IMPORTANTE | media | TASK-160 |
| C1-7 | core | Duplicacion | `doctor-deploy-veredictos.ts:122-125` | limpiarMotivo reimplementa recortar (UTF-16, '...' en vez de '…') | MENOR | alta | TASK-160 |
| C1-8 | core | Disfraz (comentario) | `heuristica.ts:128-130, catalogo-skills.ts:91-92` | comentarios de TASK-148a sobre la declaracion equivocada | MENOR | alta | TASK-160 |

### src/core (h–z)

**Casos de la primera auditoría.** Corregidos: CORE1-01, 02 (EOL persiste: C2-9), 03/CORE2-08, 04, CORE2-01, 02, 04, 05, 07, 10, 12, 13, 14, 15 (test debil: C2-28), 16, 18, 19. En parte: CORE1-13/CORE2-17 (C2-17), CORE2-06 (C2-2, C2-4), CORE2-09 (C2-14), CORE2-20 (C2-21). CORE2-03 persiste (pendiente de TASK-150). CORE2-21 persiste documentado.

| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
|---|---|---|---|---|---|---|---|
| C2-1 | core | Duplicacion | `informe-revision.ts:226,233-239` | leerHallazgos con interruptor de vallas propio y findIndex sin saltar bloques; REPRODUCIDO: un ## Hallazgos de ejemplo en bloque devuelve IMP-9 en vez de IMP-1 | IMPORTANTE | alta | TASK-159 |
| C2-2 | core | Duplicacion + Disfraz (comentario) | `troceo.ts:84-86, comentario :44` | leerPartes conserva el interruptor de vallas que el comentario dice que ya no hay; REPRODUCIDO con vallas anidadas | IMPORTANTE | alta | TASK-159 |
| C2-3 | core | Duplicacion | `duracion-estimada.ts:40-45` | tercer interruptor de vallas; REPRODUCIDO: devuelve 999 de un bloque anidado (decide la regla de una hora) | IMPORTANTE | alta | TASK-159 |
| C2-4 | core | Duplicacion | `troceo.ts:39,112-118 vs tarea-body.ts:86,242-246; import-parser.ts:42,171` | tres lectores de linea de criterio; REPRODUCIDO: continuacion indentada va a objetivo en troceo | IMPORTANTE | alta | TASK-159 |
| C2-5 | core | Duplicacion | `tarea-body.ts:152-249` | extraerSecciones no salta bloques; REPRODUCIDO: criterios de ejemplo en un bloque sustituyen a los reales (validacion, finish, metricas) | IMPORTANTE | alta | TASK-159 |
| C2-6 | core | Duplicacion | `transiciones.ts:122, informe-revision.ts:245, roadmap-comparar.ts:54` | tres divisores de celdas de tabla; solo el de roadmap-comparar entiende la barra escapada; REPRODUCIDO: una ruta con barra escapada en un informe se corta | IMPORTANTE | alta | TASK-159 |
| C2-7 | core | Duplicacion | `menores.ts:170, roadmap.ts:214, doctor-deploy.ts:253` | escape de celda x3 (= C1-4) | IMPORTANTE | alta | TASK-159 |
| C2-8 | core | Duplicacion | `transiciones.ts:381,398,441,466,481` | replace de backticks x5 | IMPORTANTE | alta | TASK-160 |
| C2-9 | core | Duplicacion | `cierre.ts:39, coste-registro.ts:101, duracion-estimada.ts:94, metricas.ts:917, transiciones.ts:231,259,506, troceo.ts:197,265` | deteccion de EOL x9 | IMPORTANTE | alta | TASK-160 |
| C2-10 | core | Duplicacion | `cierre.ts:53-56 vs transiciones.ts:511-515` | «insertar tras la ultima linea no vacia» x2; REPRODUCIDO que divergen | IMPORTANTE | alta | TASK-159 |
| C2-11 | core | Duplicacion | `transiciones.ts:78 vs version.ts:20-24` | misma regex semver | IMPORTANTE | alta | TASK-160 |
| C2-12 | core | Duplicacion | `registro-puertas.ts:62-69 vs :115-125` | sumarPorTarea es un caso de resumirPuerta | IMPORTANTE | alta | TASK-160 |
| C2-13 | core | Duplicacion | `metricas.ts:304, registro-puertas.ts:73, roadmap-comparar.ts:107,118 vs task.ts:137` | regex del ID x4 con minimos distintos | IMPORTANTE | media | TASK-160 |
| C2-14 | core | Duplicacion | `plataforma-remota.ts:47-69 vs :170-200` | dos parsers de URL; REPRODUCIDO con a/../b | IMPORTANTE | alta | TASK-159 |
| C2-15 | core | Disfraz | `plataforma-remota.ts:68` | comprobacion que nunca puede fallar | MENOR | alta | TASK-160 |
| C2-16 | core | Duplicacion | `plataforma-remota.ts:360-385 vs :387-408` | candidatosGithub/Gitlab mismo bucle | IMPORTANTE | media | TASK-160 |
| C2-17 | core | Duplicacion | `progreso.ts:93, plataforma-remota.ts:363,374,390, plugin-instalado.ts:106` | esObjeto inline (= C1-3) | IMPORTANTE | alta | TASK-160 |
| C2-18 | core | Duplicacion | `informe-revision.ts:552,580` | regex de «seccion rellena» x2 | IMPORTANTE | alta | TASK-160 |
| C2-19 | core | Duplicacion | `informe-revision.ts:285-307` | hallazgosNoCerrados y hallazgosPendientes | IMPORTANTE | alta | TASK-160 |
| C2-20 | core | Duplicacion | `metricas.ts:1070-1071 vs :1026-1028; :517-520 vs :279-281` | recalculos y Duracion a mano | IMPORTANTE | alta | TASK-160 |
| C2-21 | core | Duplicacion | `metricas.ts:581,607,615,618,620,733; versiones-metricas.ts:163,169; grupos-metricas.ts:156` | formateadores a mano (= CORE2-20) | IMPORTANTE | alta | TASK-160 |
| C2-22 | core | Duplicacion | `informe-verificacion.ts:96-110 vs :188-221` | calculo de truncada y titulos x2 | IMPORTANTE | media | TASK-160 |
| C2-23 | core | Duplicacion | `tarea-body.ts:126-138` | tituloDeCabecera repite textoDeCabecera | MENOR | alta | TASK-160 |
| C2-24 | core | Desviacion | `progreso.ts:76, metricas.ts:1047, versiones-metricas.ts:73, markdown.ts:9` | reexportaciones sin consumidores reales | MENOR | alta | TASK-160 |
| C2-25 | core | Disfraz (comentarios) | `heuristica.ts:128, import-parser.ts:35-40, verificacion-proporcional.ts:7-8` | comentarios obsoletos o mal colocados | MENOR | alta | TASK-160 |
| C2-26 | core | Diluvio | `troceo.ts:224 vs :154` | comprobacion redundante y mas estricta que pierde ### Objetivo | MENOR | alta | TASK-160 |
| C2-27 | core | Diluvio | `transiciones.ts:203-205,276-279` | envoltorio e IIFE innecesarios | MENOR | alta | TASK-160 |
| C2-28 | core | Disfraz | `test/core/utilidades-core.test.ts:66-68` | compara PATRONES_TEST con un literal; un literal en git.ts:354-357 sigue verde | IMPORTANTE | alta | TASK-165 |
| C2-29 | core | Duplicacion | `state-machine.ts:35 vs informe-revision.ts:64` | union de literales copiada (la rompe el compilador) | MENOR | media | TASK-160 |

### src/commands (approve–finish)

**Casos de la primera auditoría.** CMD1-01..15 corregidos: CMD1-01 cadena.ts:193-203 + cadena.test.ts:215-263 · CMD1-02 gitCrudo/gitLinea + git-crudo-comun.test.ts:105-124 · CMD1-03 configDeLaRama finish-opciones.ts:52, CIERRE_SIN_MERGE :44 · CMD1-04 opcionesEjecucion :210 · CMD1-05 ejecutarPuerta :228 · CMD1-06 finish.ts:545-546 (resto K1-9) · CMD1-07 finish.ts:806, :1030 · CMD1-08 diaLocal/diaUtc · CMD1-09 extraerUnico · CMD1-10 planQueCuenta approve.ts:83 (resto K1-1) · CMD1-11 resultadoDentroDelRepo · CMD1-12 en finish-verificacion (resto K1-6) · CMD1-13 comentarios en su sitio · CMD1-14 conAviso/conTimeout · CMD1-15 sin _today · CMD2-06 (doctor-deploy-tareas) y CMD2-09 (approve) corregidos · FS-01 corregido (laguna K1-8).

| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
|---|---|---|---|---|---|---|---|
| K1-1 | commands | Duplicacion | `approve.ts:77-82,104-113; trocear.ts:85-92; plan.ts:590-596` | «hay dos planes» x3 con tres mensajes; assertPlanNoAmbiguo no usa planQueCuenta(u) === 'ambiguo' | IMPORTANTE | alta | TASK-161 |
| K1-2 | commands | Duplicacion | `finish-heldout.ts:64-67 vs fs/git.ts:788-792 lsTreeNames` | mismo ls-tree, sin --end-of-options | IMPORTANTE | alta | TASK-161 |
| K1-3 | commands | Duplicacion | `finish-heldout.ts:73-75 vs fs/git.ts:801 mergeBase` | uno da null y otro lanza en el mismo comando | IMPORTANTE | media | TASK-161 |
| K1-4 | commands | Duplicacion | `finish-verificacion.ts:566 vs fs/git.ts:1160 resolverCommit` | rev-parse ^{commit} reescrito (ver FS-1) | IMPORTANTE | alta | TASK-161 (= FS-1) |
| K1-5 | commands | Duplicacion | `finish-verificacion.ts:314-320; finish-heldout.ts:185-191; finish.ts:1064-1070; verificar-lote.ts:107` | «estas en otra rama» x4; finish.ts no trata HEAD desacoplado e imprime `estas en ""` | IMPORTANTE | alta | TASK-161 |
| K1-6 | commands | Duplicacion | `finish-heldout.ts:209-214 vs finish-verificacion.ts:252-258 (y review.ts:1349)` | «verde pero dejo cambios» con consejos distintos | IMPORTANTE | media | TASK-161 |
| K1-7 | commands | Duplicacion | `doctor.ts:166-172,261,349; doctor-deploy.ts:429` | reimplementan localBranchExists, isInsideWorkTree, hasOrigin y otra «rama actual» con symbolic-ref | IMPORTANTE | media | TASK-161 |
| K1-8 | commands | Disfraz (test) | `test/cli/flags-paridad.test.ts:22-32 vs finish-opciones.ts:89` | --merge-request se lee con filter y el regex del test no lo ve; quitarlo de FLAGS_SIN_VALOR queda verde | IMPORTANTE | alta | descartado: la mutación M3 se pone en rojo |
| K1-9 | commands | Duplicacion | `finish.ts:547 y :722; :693 y :796; :601,610,714,724` | expresiones cortas repetidas (destinos, ramaDelTag, entornoConContador x4) | IMPORTANTE | media | TASK-161 |
| K1-10 | commands | Disfraz (comentario) | `cadena.ts:206-208,175-177` | «todo comando que escribe» pasa por la guarda; board --escribir y metricas --tokens --escribir no estan en GUARDADOS_POR_CADENA | IMPORTANTE | alta | TASK-161 |
| K1-11 | commands | Disfraz (comentario) | `board.ts:3-8,46-47` | «el unico comando de solo lectura»; escribe con --escribir y hay otros de solo lectura | IMPORTANTE | alta | TASK-161 |
| K1-12 | commands | Diluvio | `doctor.ts:374; git-crudo.ts:25-26,39` | env GIT_OPTIONAL_LOCKS que gitCrudo ya fija | MENOR | alta | TASK-161 |
| K1-13 | commands | Diluvio | `doctor-deploy.ts:363-364,427-431` | gitTexto + trim a mano x4 (gitLinea ya recorta) | MENOR | alta | TASK-161 |
| K1-14 | commands | Diluvio | `finish.ts:674-675` | la misma condicion dos veces seguidas | MENOR | alta | TASK-161 |
| K1-15 | commands | Desviacion | `doctor.ts:62; finish-opciones.ts:299` | doctor importa resolverRemotoDeOrigin de un modulo de finish | MENOR | media | TASK-161 |
| K1-16 | commands | Diluvio | `doctor.ts:489-491,1072` | contarTerminadas solo devuelve length | MENOR | media | TASK-161 |
| K1-17 | commands | Duplicacion | `doctor.ts:656 vs core/task-id.ts:39,51,71, core/task.ts:171` | otro lector del numero del ID | IMPORTANTE | media | TASK-161 |

### src/commands (import–wrappers)

**Casos de la primera auditoría.** CMD2-01 corregido (siguiente.ts:106-108 usa codigoCambiado; test verificar-menores.test.ts:299) · CMD2-02 corregido (review.ts:55, :87; fs/rondas.ts) · CMD2-03 corregido (tareaEnOtraRama/mensajeTareaEnOtraRama en pausa:68, registrar-coste:458, siguiente:141) · CMD2-04 corregido, residual K2-02 (commitRevisadoDeRonda core/informe-revision.ts:109) · CMD2-05 corregido, proteccion debil K2-03 (extraerUnico veredicto:94, verificar-menores:141) · CMD2-06 corregido, resto K2-04 (parsearCamposDeTarea new.ts:198, MODELO_POR_DEFECTO new.ts:62, componerCuerpo import.ts:245) · CMD2-07 corregido (roadmap.ts:101) · CMD2-08 corregido (trocear.ts:56,59) · CMD2-09 corregido (plan.ts:125, plan-brainstorm.ts:40-53) · CMD2-10 corregido (verificar-lote.ts:123) · CMD2-11 corregido (verificar-lote.ts:69-75; tests :295,:330) · CMD2-12 corregido, resto K2-05 · CMD2-13 corregido (listarSiExiste) · CMD2-14 corregido (verificar-lote.ts:91-92) · CMD2-15 corregido, resto K2-07/K2-08 · **CMD2-16 persiste parcial** (plan.ts: 17 menciones de cronica «hallazgo... revision por pares», 630-660, 704, 727, 738) · CMD1-09 corregido · CMD1-10 corregido (trocear.ts:83-95 usa planQueCuenta).

| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
|---|---|---|---|---|---|---|---|
| K2-01 | commands | Duplicacion | `veredicto.ts:70,80 vs core/informe-revision.ts:13,32` | PREFIJO '- veredicto:' y esVeredicto propios; comentario apunta a finish.ts (la funcion vive en core/informe-revision.ts:45). Si cambia una copia, sustituirVeredicto y veredictoDeRonda divergen | IMPORTANTE | alta | TASK-161 |
| K2-02 | commands | Duplicacion | `verificar-menores.ts:208-212,304-308; review.ts:475-481; siguiente.ts:178-180,191-195` | lectura de peticiones de la ultima ronda + commitRevisadoDeRonda reconstruida 4 veces | MENOR | media | TASK-161 |
| K2-03 | commands | Disfraz | `test/cli/flags-paridad.test.ts:41-66; veredicto.test.ts` | ningun test ejecuta veredicto con --informe=x ni verificar-menores con --motivo=x | IMPORTANTE | alta | TASK-165 |
| K2-04 | commands | Duplicacion | `import.ts:91-100 vs new.ts:168-176` | validacion de --tipo copiada; import no propone complejidad como new (new.ts:366-374) | MENOR | media | TASK-161 |
| K2-05 | commands | Duplicacion | `registrar-coste.ts:195-202,218-227 vs :210,213` | CosteDeAgentes y costeDeFila listan los 6 campos a mano; un campo nuevo en CAMPOS_COSTE lee undefined (NaN con yaAnotado :255) | MENOR | media | TASK-161 |
| K2-06 | commands | Duplicacion | `plan.ts:149-157 vs :165-181` | ficheroConContenido y existeFichero: mismo stat y catch ENOENT/ENOTDIR | IMPORTANTE | alta | TASK-161 |
| K2-07 | commands | Disfraz (comentario) | `veredicto.ts:56-61 vs :176-178` | avisos «Hoy siempre vacio» pero se rellena con el aviso de --push | MENOR | alta | TASK-161 |
| K2-08 | commands | Disfraz (comentario) | `review.ts:44-55` | doc-comment huerfano de ~11 lineas (la constante se fue a fs/rondas.ts en TASK-144c) | MENOR | alta | TASK-161 |
| K2-09 | commands | Duplicacion | `metricas.ts:340-341 vs fs/rondas.ts:119-123` | leerRevision reparsea PETICION_REVISION_RE en vez de rondaYRevisorDePeticion | MENOR | media | TASK-161 |
| K2-10 | commands | Duplicacion | `pausa.ts:59-62, registrar-coste.ts:452-456, siguiente.ts:134-137` | «no se encuentra en el working tree de la rama actual» en 3 copias de texto distinto | MENOR | media | TASK-161 |
| K2-11 | commands | Disfraz | `test/commands/flags-repetidos.test.ts:12-31` | el titulo nombra veredicto y la lista de casos no lo incluye | MENOR | media | descartado: la mutación M5 se pone en rojo |
| K2-12 | commands | Diluvio | `metricas.ts:322-324` | nombresDeRevision: envoltorio de una linea con un llamador | MENOR | alta | TASK-161 |
| K2-13 | commands | Diluvio | `wrappers.ts:126-146; start.ts:1-13` | ~20 lineas de comentario historico sin codigo; cabecera de start promete «eso es TASK-012» (hecha) | MENOR | alta | TASK-161 |
| K2-14 | commands | Duplicacion | `start.ts:369-378` | traerBaseALaRama usa spawnSync de git directo en vez de los envoltorios de fs/git.ts (grupo FS-07) | MENOR | media | TASK-161 |

### src/fs

**Casos de la primera auditoría.** FS-01..18 corregidos (ninguno pendiente de 140/150/152): FS-01 cli/args.ts:137-158 + flags-paridad · FS-02 cli.ts:852-853 · FS-03 cli.ts:447-462 ERRORES_COMUNES_CLI · FS-04 TASK_ID_RE core/task.ts:137 · FS-05 parsearEntradaHook · FS-06 ramaActual git-crudo.ts:88-102 (divergencia con currentBranch: FS-10) · FS-07 git-crudo.ts:30-79 (residuo FS-2 en git.ts) · FS-08 rutaGit · FS-09 sinPrefijoError (test debil: FS-17) · FS-10 LOCKFILES · FS-11 decodificar · FS-12 leer-cola.ts:14 · FS-13 candidatosEnPath · FS-14 quitarBom/leerJson · FS-15 textoAMano · FS-16 corregido en fs, core persiste (FS-8) · FS-17 hooks sin cargar el freno · FS-18 git-commit sin parser de argv.

| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
|---|---|---|---|---|---|---|---|
| FS-1 | fs | Duplicacion | `git.ts:1080 (tagCommit), :1160 (resolverCommit), verificacion.ts:159,261, hooks/guardia-merge.ts:139,225 (y :78,:402 sin --end-of-options)` | seis rev-parse --verify --quiet <ref>^{commit}; unas lanzan y otras no | IMPORTANTE | alta | TASK-162 |
| FS-2 | fs | Duplicacion | `git.ts:88,188,259,300,812,1074,1081,1092,1109,1161,1185` | once spawnSync de git sin GIT_TERMINAL_PROMPT=0, GIT_OPTIONAL_LOCKS=0 ni timeout; git-crudo.ts:3-5 dice ser el unico envoltorio; el test «sin copias» no vigila git.ts | IMPORTANTE | alta | TASK-162 |
| FS-3 | fs | Duplicacion | `git.ts:50, git-crudo.ts:28, herramientas-deploy.ts:94` | tres constantes de 64 MiB | MENOR | media | TASK-162 |
| FS-4 | fs | Duplicacion | `git.ts:231, gitflow-runner.ts:147, ejecucion-acotada.ts:166, merge-request.ts:168, herramientas-deploy.ts:132, commands/doctor.ts:375` | seis «code === ETIMEDOUT»; herramientas-deploy tambien cuenta SIGTERM | IMPORTANTE | media | TASK-162 |
| FS-5 | fs | Duplicacion | `roadmap.ts:69-103 vs task-store.ts:86-130` | mismo recorrido de tareas; roadmap se traga cualquier error de readdir (EACCES) sin avisar | IMPORTANTE | alta | TASK-162 |
| FS-6 | fs | Duplicacion | `transcripciones.ts:12-19,35-41 vs task-store.ts:362 listarSiExiste` | readdir con ENOENT/ENOTDIR reimplementado; TASK-146b no llego aqui | IMPORTANTE | alta | TASK-162 |
| FS-7 | fs | Duplicacion | `particion.ts:19, core/coste-automatico.ts:60, fs/status-line.ts:104, fs/cobertura.ts:62,72, fs/git-commit.ts:184, commands/doctor-deploy.ts:301` | siete «ruta dentro de la raiz» que difieren en rel === '' y '.' | IMPORTANTE | alta | TASK-162 |
| FS-8 | fs | Duplicacion | `deteccion-app.ts:72; core/doctor-deploy-reglas.ts:82` | nombreBase (de FS-16, deteccion-app.ts:29) copiado inline en el mismo fichero y otra definicion en core | IMPORTANTE | alta | TASK-162 |
| FS-9 | fs | Duplicacion | `pendientes.ts:38,44, roadmap.ts:122, commands/pausa.ts:74, commands/registrar-coste.ts:465, sincronizacion.ts:295-302 vs ejecucion-acotada.ts:178-202` | cinco «hay cambios en estas rutas» con flags distintos; sincronizacion.porcelain sin -z frente a fotoDelArbol con -z | IMPORTANTE | media | TASK-162 |
| FS-10 | fs | Duplicacion | `git.ts:175 currentBranch vs git-crudo.ts:88 ramaActual` | durante un rebase una da '' y otra la rama; comandos usan una y hooks otra | IMPORTANTE | media | TASK-162 |
| FS-11 | fs | Duplicacion | `git.ts:413,553,1265,1328` | cuatro diff --name-only -z con y sin --no-renames/--no-ext-diff | MENOR | media | TASK-162 |
| FS-12 | fs | Duplicacion | `git-commit.ts:453, roadmap.ts:129 y ~50 inline` | e instanceof Error ? e.message : String(e) sin helper | MENOR | media | TASK-162 |
| FS-13 | fs | Disfraz | `verificacion.ts:327` | `env === undefined ? {} : { env }` con env siempre definido (codigo muerto) | MENOR | alta | TASK-162 |
| FS-14 | fs | Disfraz (comentario) | `git.ts:968-970` | «hasta 3 git ls-remote»: desde TASK-143c, una | MENOR | alta | TASK-162 |
| FS-15 | fs | Desviacion | `git.ts:588-663 y cabecera 1-8` | «wrapper minimo» de 1339 lineas con codex review y escapado cmd.exe | MENOR | alta | TASK-162 |
| FS-16 | fs | Desviacion | `git.ts:322 diffRange` | export sin usos | MENOR | alta | TASK-162 |
| FS-17 | fs | Disfraz | `test/fs/git-crudo-comun.test.ts «sin copias»` | busca la regex como literal exacto; una variante no se detecta; no vigila git.ts ni sincronizacion.ts | MENOR | media | TASK-165 |
| FS-18 | fs | Duplicacion | `verificacion.ts:188-222, freno-ultimo-verde.ts:24-42, registro-puertas.ts:21-58, progreso.ts:92-121` | cuatro «JSON bajo .git/taskcode con catch mudo» | MENOR | media | TASK-162 |

### src/hooks y cli

**Casos de la primera auditoría.** FS-01 corregido (args.ts:137-158; flags-paridad:26,:60) · FS-02 corregido en printAutoCommit, persiste el aviso de cambio de rama (HK-9) · FS-03 corregido (cli.ts:448,458; errores-comunes.test.ts:27) · FS-05 corregido · FS-06 corregido · FS-07/08/09 corregidos en hooks · FS-17 corregido (laguna HK-5) · FS-18 corregido (extraerPushFlag args.ts:225) · TRES-07/08/12 corregidos.

| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
|---|---|---|---|---|---|---|---|
| HK-1 | hooks/cli | Duplicacion | `hooks/guardia-merge.ts:229-234 y :442-446; :237 y :448` | «ya integrado» en motivoDeBloqueo y motivoDeCierre; Set de timeouts x2 | IMPORTANTE | alta | TASK-162 |
| HK-2a | hooks/cli | Disfraz | `hooks/guardia-merge.ts:443-444; tests finish-reintento.test.ts:137-227` | MUTACION HECHA: esAncestro(sha, principal) -> false: finish-reintento + guardia-merge + guardia-documentacion 12 pass 0 fail | IMPORTANTE | alta | TASK-165 |
| HK-2b | hooks/cli | Disfraz | `hooks/guardia-merge.ts:442` | esAncestro(sha,'HEAD') -> false: 6 pass; casi inalcanzable (Git no deja MERGE_HEAD si ya es ancestro) | MENOR | media | TASK-165 |
| HK-3 | hooks/cli | Duplicacion | `freno-stop.ts:91,111; entrada-pretooluse.ts:16,21; pre-tool-merge.ts:25,49` | tres interfaces {codigo; stderr} y dos constantes PASAR/DEJAR_PARAR iguales | IMPORTANTE | alta | TASK-162 |
| HK-4 | hooks/cli | Duplicacion | `stop-verificacion.ts:9-13; coste-turno.ts:9-13; pre-tool-lectura.ts:13-17; pre-tool-merge.ts:16-20` | lectura de stdin y cierre .then x4 | IMPORTANTE | alta | TASK-162 |
| HK-5 | hooks/cli | Disfraz | `test/fs/git-crudo-comun.test.ts:74-90` | solo imports estaticos; guardia-heldout y pre-tool-lectura fuera de la lista | MENOR | media | TASK-165 (= FS-17) |
| HK-6 | hooks/cli | Duplicacion | `pre-tool-lectura.ts:17 vs prefiltro.ts:14 (nombraHeldout); core/heldout.ts:15` | /aceptacion/i en linea | IMPORTANTE | alta | TASK-162 |
| HK-7 | hooks/cli | Duplicacion | `guardia-merge.ts:154-168 vs :401-417` | preambulos de decidirPreToolUse y decidirCierreDeMerge | IMPORTANTE | media | TASK-162 |
| HK-8 | hooks/cli | Duplicacion | `guardia-merge.ts:77-90,139,225 vs fs/git.ts:299,814,857-866,1161` | esAncestro, existeRef, ramaPrincipal y resolucion a commit en version «sin lanzar» | IMPORTANTE | media | TASK-162 |
| HK-9 | hooks/cli | Duplicacion | `cli.ts:850 vs :241-247` | aviso de cambio de rama reescrito en doctor-deploy | IMPORTANTE | alta | TASK-162 |
| HK-10 | hooks/cli | Duplicacion | `cli.ts:550-552,606-608,634-636,738 vs printAvisos :413; :1183` | cuatro bucles de [AVISO] y un [ERROR] a mano | IMPORTANTE | alta | TASK-162 |
| HK-11 | hooks/cli | Diluvio | `cli.ts:507-1199` | ~20 try/catch iguales por comando | MENOR | alta | TASK-162 |
| HK-12 | hooks/cli | Duplicacion | `freno-stop.ts:120; guardia-merge.ts:124; guardia-heldout.ts:78; registro-coste.ts:56,96-97` | «cwd string no vacio y existe» x4 | IMPORTANTE | alta | TASK-162 |
| HK-13 | hooks/cli | Duplicacion | `freno-stop.ts:187-191 vs :221-226` | base de la tarea decidida dos veces con resultados distintos en hotfix | MENOR | media | TASK-162 |
| HK-14 | hooks/cli | Disfraz (comentarios) | `cli.ts:2-3, :419-425 («8 comandos que commitean»: ~16); args.ts:105-119; asignado.ts:44-53; guardia-merge.ts:9-10` | comentarios obsoletos o huerfanos | MENOR | alta | TASK-162 |
| HK-15 | hooks/cli | Duplicacion | `cli/asignado.ts:122-166 vs cli/args.ts:95-103` | otro lector de flag con valor | MENOR | media | TASK-162 |

### scripts (Git-Flow y raíz)

**Casos de la primera auditoría.** SCR-01..15 corregidos con tests reales: SCR-01 resume-work.sh:95-112 · SCR-02 _gitflow-common.sh:551-580, :441 · SCR-03 create-hotfix.sh:20, create-release.sh:15 · SCR-04 invoke_merge_to_main :590 · SCR-05 :686 y guarda :649-656 (develop ausente sin cubrir: SC-01) · SCR-06 parcial (pause/resume/recover con su bucle: SC-04) · SCR-07 detect_operation_in_progress :376 (salvedad SC-07) · SCR-08 git.ts:210-233,853-870; finish.ts:127-137 · SCR-09 pause-work.sh:18-34 · SCR-10 push-back:206-241 · SCR-11 solo textos (SC-08) · SCR-12 corregido en el script, inalcanzable desde taskctl (SC-03) · SCR-13 perfil-tests.mjs:210 · SCR-14 README:20-26 (queda «24 scripts»: SC-12) · SCR-15 push-back:245-257, :273-280.

| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
|---|---|---|---|---|---|---|---|
| SC-01 | scripts | Disfraz | `_gitflow-common.sh:645-656, :686` | la guarda «antes de tocar nada» cubre develop divergida, no ausente. REPRODUCIDO: repo sin origin y sin develop, merge-hotfix-to-main.sh hotfix/x1 sale con 1 tras mergear main y crear el tag (con --push, ya subidos). Previo a 143a (antes el checkout de develop tambien fallaba tras el merge) | IMPORTANTE | alta | TASK-163 |
| SC-02 | scripts | Duplicacion | `diagnose-repo.sh:37-41, create-develop.sh:35-40, resume-work.sh:57-61, recover-branch.sh:52, start-work.sh:40, switch-working-remote.sh:134` | seis copias de «existe en local y en origin» que ya resuelve _gf_locate_branch (:485) | IMPORTANTE | alta | TASK-163 |
| SC-03 | scripts | Disfraz | `diagnose-repo.sh:3-4,36 vs src/commands/wrappers.ts:61` | taskctl diagnose declara opciones [] y no pasa --develop: el arreglo de SCR-12 no llega por la CLI | IMPORTANTE | alta | TASK-163 |
| SC-04 | scripts | Duplicacion | `pause-work.sh:5-11, resume-work.sh:5-11, recover-branch.sh:5-11` | siguen con su bucle de argumentos | IMPORTANTE | alta | TASK-163 |
| SC-05 | scripts | Duplicacion | `resume-work.sh:63-67, recover-branch.sh:75, create-develop.sh:79-98, start-work.sh:17-37,41-50, _gitflow-common.sh:636-643,733-741` | seis copias de «cambiar o crear desde origin y pull --ff-only» que hace _gf_sync_branch; fetch propio en resume:49, recover:36, create-develop:67 | IMPORTANTE | alta | TASK-163 |
| SC-06 | scripts | Disfraz | `scripts/verificar-impacto.mjs:32-34 vs :52-54,442-447` | la cabecera dice que package.json/package-lock/tsconfig corren los tests que los nombran; REPRODUCIDO: con TIPO_VERIFICACION=selectiva dan suiteEntera:true | IMPORTANTE | alta (contradiccion) | TASK-163 |
| SC-07 | scripts | Disfraz | `_gitflow-common.sh:392-396 vs abort-merge.sh:22,52,70; paridad-operacion.test.ts:115-123` | la paridad compara el printf, que ningun script consume; la prioridad real de abort-merge son sus if, sin test con dos testigos | IMPORTANTE | alta | TASK-165 |
| SC-08 | scripts | Disfraz (test) | `mirror-to-remote.sh:83,87; disfraz-gitflow.test.ts:142-160` | «sin --force no sobreescribe nada» solo lo protege un test que contesta n y mira la redaccion | IMPORTANTE | alta | TASK-165 |
| SC-09 | scripts | Desviacion | `start-work.sh; README.md:4-7` | start-work.sh no lo invoca nada; create-develop, mirror, switch y push-back no tienen comando de taskctl, contra el README | MENOR | alta | TASK-163 |
| SC-10 | scripts | Duplicacion | `mirror-to-remote.sh:24-35, push-back:52-66, switch-working-remote.sh:125; push-back:274-280 vs switch:67-68` | «hay remoto y responde» a mano; dos buscadores de nombre de backup | MENOR | media | TASK-163 |
| SC-11 | scripts | Duplicacion | `_gitflow-common.sh:515-538,572-577,675-683,698-705,753-760; pause-work.sh:22-34` | «subir o avisar de que se omite» x6 con textos distintos | MENOR | media | TASK-163 |
| SC-12 | scripts | Disfraz (comentario) | `_gitflow-common.sh:47; push-back-to-remote.sh:5` | «24 scripts» (son 22); push-back «Sin reescritura forzada» y el mirror hace --force --prune | MENOR | alta | TASK-163 |
| SC-13 | scripts | Duplicacion | `perfil-tests.mjs:102,211 vs verificar-impacto.mjs:478-492` | build y delete NODE_TEST_CONTEXT x2; perfil-tests no comprueba que existan los scripts; conDistProtegido imprime «[verificar-impacto]» llamado desde perfil-tests | IMPORTANTE | media | TASK-163 |
| SC-14 | scripts | Disfraz | `pause-work.sh:67-73` | con --push y «stash» el flag se ignora en silencio | MENOR | media | TASK-163 |
| SC-15 | scripts | Disfraz | `_sonda-bash.sh:2-6` | dice comprobar las herramientas que usan los scripts y faltan sort, comm, head, cat, date | MENOR | media | TASK-163 |
| SC-16 | scripts | Diluvio | `_gitflow-common.sh:32-69; README.md:52-61,71-113` | notas de historial de 30-40 lineas | MENOR | alta | TASK-163 |
| SC-17 | scripts | Duplicacion | `_gitflow-common.sh:294-313 vs src/fs/git.ts:853-870` | resolve_main_branch en bash y TS sin test de paridad | MENOR | media | TASK-163 |

### skills, agents y hooks

**Casos de la primera auditoría.** CONT-01..07, 09..18 persisten (pendientes de TASK-150). **CONT-08 corregido** (TASK-153: autorrevision.ts:35-47 tieneLinea4D; tests core/autorrevision.test.ts:23, commands/review-autorrevision.test.ts:78, skills/regla-4d.test.ts:48).
Detalle que confirma que persisten: CONT-01 sincronizacion.md:36-37 vs SKILL.md:190-192 · CONT-02 cierre.md:61-62 vs SKILL.md:260 · CONT-03 review/SKILL.md:82 y tests-pesados.md:11-12 vs revision.md:93-94 · CONT-04 angular:26, java:25, rust:28 vs revision.md:59-63 · CONT-05 code-quality-reviewer/SKILL.md:289-299 sin ## Regla 4D · CONT-06 brainstorm-arquitectura.md:104-125 vs roles-brainstorm.ts · CONT-07 unificador.md:61, arquitectura.md:70 sin Duracion estimada ni Tests nuevos · CONT-09 csharp:3 vs revisores.ts:155-200 · CONT-11 riesgos.md:20-21, testing.md:20-21 · CONT-12 testing.md:129-149 · CONT-13 tamanos sin bajar · CONT-14 review/SKILL.md:69-120 · CONT-15 verificacion-selectiva.md:139-173, sincronizacion.md:105-108 · CONT-16 sincronizacion.md:9 («Tres claves», lista cuatro) y :41 («ocho comandos»; hay 16 que commitean) · CONT-17 hooks/sonda-hooks.mjs fuera de hooks.json, solo CI · CONT-18 angular:310-311 vs :318-319.

| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
|---|---|---|---|---|---|---|---|
| CT-1 | skills | Duplicacion | `skills/new/SKILL.md:23 vs src/core/validacion-tarea.ts:15,48,153 y task-workflow/SKILL.md:258` | new pide «entre 1 y 8» criterios; el CLI avisa de 9 a 12 y bloquea con mas de 12; el 8 no existe en src | IMPORTANTE | alta | TASK-164 |
| CT-2 | skills | Duplicacion | `task-workflow/trampas.md:41-44 vs trocear.ts:67, doctor-deploy-tareas.ts:80` | «son new, import, plan y approve»: faltan trocear y doctor-deploy --crear-tareas, que tambien llaman a ensureBaseBranchReady | IMPORTANTE | alta | TASK-164 |
| CT-3 | skills | Disfraz | `agents/revisor-seguridad-deploy.md:92-96 vs doctor-deploy-veredictos.ts:37-38,136-141,160-168` | promete que las reglas del formato «se comprueban una por una» (motivo sin codigo, sin campos extra); el codigo no rechaza un motivo con codigo y admite `commit` | MENOR | media | TASK-164 |
| CT-4 | skills | Duplicacion | `review/SKILL.md:36-40 vs start/SKILL.md:29-34 y autorrevision.ts:44,53` | el formato de la linea 4D esta en start y dos veces en autorrevision.ts; review/SKILL.md (la que hace la autorrevision) dice «una linea por revisora y nada mas» y no la menciona | IMPORTANTE | media | TASK-164 |

### test/commands

**Casos de la primera auditoría.** TCMD-01 corregido (doctor-correcciones.test.ts:110-119) · TCMD-02 corregido (doctor-deploy.test.ts:262-285) · TCMD-03 corregido en los tres citados (approve:238-247, plan:389-400, start-basico:296-310); hermanos sin arreglar = TC-4 · TCMD-04 corregido (review-incremental:222-248), pero TC-3 · TCMD-05 corregido (plan.test.ts:960-961), gemelo = TC-1 · TCMD-06..11 persisten (pendientes de TASK-152): doctor-deploy.test.ts helpers propios; siguiente/cadena/semiautomatico sin automatico-fixtures; 14 commitAll, 22 git, 7 sampleTask locales; codex-review sin seccion Regla 4D; 15 ficheros construyen comando_verificacion a mano; «subcadena de 8» x3.

| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
|---|---|---|---|---|---|---|---|
| TC-1 | tests | Disfraz | `plan.test.ts:970-1010` | titulo «deja el workspace limpio»; solo asierta la clase y que planificacion/ no existe, sin porcelain | IMPORTANTE | media | TASK-165 |
| TC-2 | tests | Disfraz | `start-basico.test.ts:99-117` | «rechaza task.rama invalido antes de invocar el script» con el SCRIPTS_DIR real: sin el guard de start.ts:269 el script fallaria con el mismo resultado observable | IMPORTANTE | media | TASK-165 |
| TC-3 | tests | Disfraz y desviacion | `review-incremental.test.ts:222-248` | mock.method de fsPromises.writeFile (unico mock de la suite, contra CONVENCIONES.md:82); el mock ignora flags: review.ts:1048 con flag 'w' en vez de 'wx' sigue verde | IMPORTANTE | alta | TASK-165 |
| TC-4 | tests | Disfraz | `plan.test.ts:445-451, codex-review.test.ts:352-370, review-rutas.test.ts:105-118, board.test.ts:254-262` | «error claro» y solo la clase, sin matcher | IMPORTANTE | alta | TASK-165 |
| TC-5 | tests | Disfraz | `doctor.test.ts:784-791` | `if (!WIN) return;` dentro del test: en Linux figura pasado sin ejecutar (deberia ser skip) | MENOR | media | TASK-165 |
| TC-6 | tests | Duplicacion | `test/helpers/roadmap-fixtures.ts:38 vs test/helpers/sincronizacion-fixtures.ts:39` | porcelain y ficherosDeHead duplicadas; 92 git status --porcelain en linea, con y sin --untracked-files=all | IMPORTANTE | alta | TASK-166 |
| TC-7 | tests | Disfraz | `veredicto.test.ts:153-166, codex-review.test.ts:179-200, start-basico.test.ts:202-214` | titulos con motivo concreto, solo asiertan StateMachineError | MENOR | media | TASK-165 |

### tests fuera de test/commands

**Casos de la primera auditoría.** Corregidos: TCORE-01 (git.test.ts:626-647), TCORE-02 (board-format:107-113), TCORE-03 (state-machine:259-269), TCORE-08 (task-store-wip:147-155), TCORE-09 (rondas-aprobada:51-63), TRES-06 (plugin-instalado:20-50), TRES-07 (guardia-documentacion:55), TRES-08 (salida-temprana:103-121), TRES-09 (fases:30-37), TRES-12 (estado:127-152).
Persisten (pendientes de TASK-152): TCORE-04 (16 fabricas de Task), TCORE-05 (43 git locales, 15 commitAll), TCORE-06 (rechaza x4, errorDe x3), TRES-01, TRES-02 (MARCAS_DEL_REPO x5), TRES-03, TRES-04, TRES-05 (topes 18 KB vs 15360 para task-workflow/SKILL.md), TRES-10 (runScript x7), TRES-11 (imports muertos en fixtures), TRES-13.
TCORE-07 persiste como nota (descartado como disfraz en la 1a; task-store.test.ts:94,103 sin asercion sobre disco).

| ID | Área | D | fichero:línea | evidencia | severidad | conf. | seguimiento |
|---|---|---|---|---|---|---|---|
| TR-1 | tests | Duplicacion | `gitflow/flujo-comun.test.ts:28-48, argumentos-comunes.test.ts:25-36, paridad-operacion.test.ts:31, disfraz-gitflow.test.ts:21-30` | TASK-142/143 anadieron 4 copias de git, runScript y conRepo que ya divergen (trim, input); bash del PATH, no resolverBash | IMPORTANTE | alta | TASK-166 |
| TR-2 | tests | Duplicacion | `fs/utilidades-comunes.test.ts:25, fs/git-crudo-comun.test.ts:21, fs/registro-puertas-verificacion.test.ts:19` | tres git nuevos (string, void, y uno sin comprobar el commit) | IMPORTANTE | alta | TASK-166 |
| TR-3 | tests | Duplicacion | `scripts/perfil-tests.test.ts:24-33 vs src/core/resolver-bash.ts:34-36` | bashDeGit reimplementa resolverBash | IMPORTANTE | alta | TASK-166 |
| TR-4 | tests | Disfraz | `core/config-validacion-comun.test.ts:15-21,36` | errorDe devuelve '(no lanzo)' y el test usa doesNotMatch: si 'mr' fuera valido seguiria verde | IMPORTANTE | alta | TASK-165 |
| TR-5 | tests | Disfraz | `gitflow/paridad-operacion.test.ts:127-137,142-157` | si 192.0.2.1 falla al instante (sin ruta por defecto) los tests de limite pasan sin timeoutMs | IMPORTANTE | media | TASK-165 |
| TR-6 | tests | Disfraz | `fs/git-crudo-comun.test.ts:80-90,56-70` | «ni directa ni indirectamente» solo mira imports estaticos; «sin copias» solo el literal spawnSync('git' | IMPORTANTE | media | TASK-165 (= FS-17) |
| TR-7 | tests | Disfraz | `core/documento-estado.test.ts:148-151` | diaUtc con 23:30Z/00:30Z solo distingue UTC de local si la maquina no esta en UTC | IMPORTANTE | media | TASK-165 |

## Tareas de seguimiento

Agrupadas por regla y área, nunca una por caso suelto. Todas en `tareas/00-planificadas/`.

| Tarea | Qué agrupa |
|---|---|
| TASK-159 | Lectores de vallas, secciones y celdas de tabla en core, con divergencias reproducidas (C2-1..7, C2-10, C2-14) |
| TASK-160 | Duplicación residual en core: catálogos, config, utilidades, métricas e informes (resto de C1 y C2, CORE1-04/07/09, CORE2-11/20) |
| TASK-161 | Duplicación residual en commands (K1, K2, CMD2-16) |
| TASK-162 | Envoltorios de git y helpers en fs, hooks y cli (FS, HK) |
| TASK-163 | Git-Flow residual y el hotfix sin develop (SC; SC-01 primero) |
| TASK-164 | Skills que contradicen al CLI (CT); los CONT-* siguen en TASK-150 |
| TASK-165 | Disfraz en tests: los seis confirmados por mutación y los de título sin aserción |
| TASK-166 | Helpers de test copiados por las propias correcciones (los anteriores siguen en TASK-152) |

## Resumen por área

| Área | Primera: estado | Segunda: qué predomina |
|---|---|---|
| core | 24 de 35 corregidos, 9 a medias | Duplicación: lectores de vallas y celdas en tres sitios con resultados distintos (reproducidos); utilidades que no llegaron a todos |
| commands | 30 de 31 corregidos | Duplicación de menor calibre: helpers de `fs/git` reescritos en commands; comentarios que prometen más de lo que hacen |
| fs | 17 de 18 corregidos | Duplicación: `git.ts` no pasó al envoltorio común (once `spawnSync` sin entorno ni límite) |
| hooks y cli | corregidos | Duplicación fina entre hooks; un disfraz real en el test del guardián (HK-2a) |
| scripts | 12 de 15 corregidos, 3 a medias | Duplicación residual (las funciones de TASK-143 no llegaron a seis scripts) y arreglos no alcanzables desde `taskctl` (SC-01, SC-03) |
| skills | 1 de 18 (el resto, en TASK-150) | Duplicación entre skills y CLI con números o listas que ya no coinciden |
| tests | disfraz de la primera corregido entero | Duplicación de helpers sin bajar y creciendo; seis disfraz nuevos confirmados por mutación |

## Conclusión

La Regla 4D aplicada como corrección funciona: los casos que tenían tarea se
cerraron y casi todos con un test que caza su mutante. Lo que no funciona igual
de bien es la **corrección incompleta**: una tarea crea el helper común y lo usa
en los sitios que citaba la auditoría, pero no busca el resto de llamadores, y
a veces deja su propia copia (comentarios huérfanos, helpers de test nuevos,
una función de dos líneas reescrita en el módulo de al lado). Es justo lo que
TASK-158 tiene que prevenir: que el plan, la implementación y la revisión
busquen todos los usos antes de dar una duplicación por resuelta, no solo los
citados.
