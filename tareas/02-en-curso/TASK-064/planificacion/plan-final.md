# Plan — TASK-064: Metricas v2 (B): leer y mostrar la evolucion del flujo

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos. 2 roles = el mayor entre la complejidad declarada (media) y la heuristica (simple, 2 puntos); la discrepancia sugiere que el enunciado infraestima el coste. Los desacuerdos se senalan, no se promedian.)

## Enfoque propuesto
- (arquitectura) Un solo contrato, `FilaMetricas`, crece con `proyecto`, `tipo`, `criterios`, `coste`, `hallazgos` (severidad x origen), `kbPeticionPorRonda`, `minutosTotal`; toda la E/S sale a `leerRepoMetricas(repoCwd)`, una pasada por tarea y un `git log` por repo.
- (arquitectura) Orden: 1) `resumirCostes` en `coste-registro.ts` + fila enriquecida leyendo `revision/` siempre; 2) columnas nuevas, `tareasSinCoste`, aviso de repetidas; 3) `leerRepoMetricas` + `--repo`; 4) `evolucion.ts` y `grupos-metricas.ts` puros + texto/`--json`; 5) README/CHANGELOG y linea base.
- (riesgos, asumido por arquitectura) Clave `(proyecto, id)` en el modelo de fila y en todos los Map (`porId`, `cuerpoPorId`), no anadida al imprimir; `tabla:false` = «sin dato», fuera de medias y contado.

## Desacuerdos entre roles, y como se resuelven
- Hallazgos entre rondas — arquitectura: supone contarlos «sobre todas las rondas» / riesgos: sumarlas infla CRIT+IMP (TASK-057 repite MEN-1 y MEN-5; 12 tareas mas con filas `corregido` en rondas 2-3, comprobado) — no gana ninguno — es regla de dominio y no se lanzo ese rol: sube a decision humana.
- Severidades fuera de vocabulario — arquitectura: `informe-revision.ts` solo «como consumidor», ningun parser nuevo / riesgos: `normalizarCelda` no pasa a mayusculas y descarta `Importante`/`Alta`/`Major` sin aviso (comprobado) — gana riesgos — fallo verificado que da ceros falsos; el cambio va en el parser de TASK-063 (misma regla de arquitectura: «la regla vive junto al parser»), con aviso por severidad desconocida.
- Leer `revision/` siempre — arquitectura previo choque con riesgos por rendimiento / riesgos no lo plantea (descarta incluso `GIT_MAX_BUFFER`) — se queda arquitectura (siempre, una pasada) — no hay posicion contraria; el desacuerdo previsto no aparecio.
- `--json` — arquitectura: objeto `{proyectos, evolucion?, grupos?}` / riesgos: vacios explicitos, nada de `NaN`→`null` silencioso, «No hay tareas» por stderr — gana riesgos en el contenido — la claves opcionales por flag son compatibles, pero una mediana de grupo vacio tiene que distinguirse de «no medido» (la misma preocupacion que arquitectura nombra como su mayor riesgo).
- Nota: fuera de estos puntos los roles son complementarios mas que discrepantes; no es consenso fuerte, es que cada uno miro un lado distinto.

## Riesgos aceptados y que los contiene
- Choque de TASK-NNN entre proyectos (TASK-010 en los tres) — riesgos — clave `(proyecto, id)` en la fila y `git log` con el cwd de cada repo (arquitectura).
- Informes sin tabla parecen limpios — riesgos — «sin dato» fuera de medias + recuento visible de excluidas.
- `--escribir`/`--tokens` con `--repo` escribe `docs/METRICAS.md` del repo actual con datos ajenos y rompe el criterio 8 — riesgos — rechazar la combinacion, como hoy con `--heuristica`.
- Tramos inestables (cierre con precision de dia, origen `—` = null) — riesgos — desempate estable por (repo, numero de ID) y recuento de tareas sin fecha de cierre.
- Diferencia `tokens_<fase>` − desglose negativa y repetidas que suman doble — riesgos (MEN-2: arquitectura coincide en avisar, no deduplicar) — mostrar el negativo como incoherencia con aviso, nunca `max(0, ...)`.
- Linea base con cifras infladas queda como referencia «oficial» y no se revierte con git — riesgos — no copiarla al Resultado hasta cerrar las reglas de la decision humana.

## Plan de pruebas
- Ningun rol escribio un plan de pruebas; estas lineas salen de las mitigaciones de riesgos y de la estructura de arquitectura, contra repos Git temporales reales.
- Dos repos temporales con el mismo TASK-NNN: duraciones y cuerpos no se cruzan — riesgos.
- Informe sin tabla, severidad `Importante`/`Major`, informe por revisor y filas repetidas entre rondas: «sin dato», aviso y recuento segun la regla que se decida — riesgos.
- `--json` con `--evolucion`/`--grupos` sin tareas y con grupo vacio pasa `JSON.parse` sin `NaN` — riesgos.
- `--repo` + `--escribir` aborta y `git status` de los repos no cambia; un solo `--repo` da la misma salida que hoy — riesgos / arquitectura (paso 3).
- Fila dentro de bloque de codigo en `## Coste` no cuenta (MEN-1) y repetidas avisan (MEN-2) — enunciado / arquitectura.

## Sin cubrir
- «Mediana de lecturas por fase» (criterio 3): `resumirCostes` de arquitectura no la nombra — que la implementacion la anada al resumen y la pruebe.
- ToolsaWeb como excepcion (pesa dominio o contexto): ningun rol propone que medir para explicarla — queda fuera del alcance salvo decision humana.
- Impacto en `docs/METRICAS.md`, `skills/task-workflow/coste.md` y `SKILL.md` si cambia la tabla por defecto — solo riesgos lo nombra; revisar al cerrar.
- No se lanzaron los roles de dominio ni de pruebas: ambos roles remiten reglas a «dominio»; aqui eso son huecos, no puntos cubiertos.

## Salidas que faltaron
- ninguna (llegaron arquitectura y riesgos, las dos rellenas).

## Suposiciones no verificadas
- `parseArgs` no admite flags repetidos y `--repo` lo exige extender — arquitectura — mirar `src/cli/args.ts`.
- Nombre de proyecto = `basename(repo)` basta — arquitectura — ver si choca o hace falta `--repo nombre=ruta`.
- Tareas de ToolsaWeb/OpenGisViewer validan con la version actual — riesgos — ver los `[AVISO] ... tarea.md invalido` al ejecutar `metricas` en cada repo.
- IDs de hallazgo que chocan entre revisores en informes fragmentados — riesgos — no visto en TaskCode; buscarlo en los otros dos.

## Lo que necesita decision de una persona
- Como contar hallazgos entre rondas: cada ID una vez por tarea, o cada hallazgo en la ronda en que aparecio (y que la salida diga cual) — regla de dominio; arquitectura supone una, riesgos demuestra que la otra infla; sin rol de dominio nadie la fundamenta.
- Que es «aprobada a la primera»: `rondas === 1` con veredicto aprobado (arquitectura) o ultima ronda == 1 (riesgos lo marca como suposicion), y que hacer con `revision/` vacia o rechazo en ronda 1 cerrado sin ronda 2 — cambia la cifra central de `--grupos`; ninguno lo verifico contra el script ad hoc de las 189 tareas.
- Terciles de KB sobre el conjunto mezclado de todos los `--repo` (arquitectura, para comparar grupos) o por proyecto — riesgos no opina; el enunciado pide comparar proyectos y los dos sirven a fines distintos.
- Partir en 064-A «fila enriquecida» (criterios 1-3 + MEN-1/2) y 064-B «agregados y multi-repo» (4-6, 8; 7 repartido), como propone arquitectura — reparto de trabajo y alcance; riesgos no lo trata. Este plan no vale hasta que una persona lo apruebe con `taskctl approve`.

### Decisiones de la persona (Carlos, 2026-10-25)

1. **Hallazgos entre rondas: cada ID una vez por tarea.** La clave es revisor + ID (un `informe-revision-N-<revisor>.md` aporta su revisor; sin sufijo, revisor vacio). La salida lo dice.
2. **«Aprobada a la primera» = una sola ronda con veredicto `aprobada` o `aprobada-con-correcciones`.** Las tareas sin revision se cuentan aparte (es de TASK-065, que es quien agrega).
3. **Terciles de KB con todos los proyectos juntos** (TASK-065).
4. **Particion: si.** Esta tarea queda como la fila enriquecida: pasos 1 y 2 del enfoque (`resumirCostes`, `FilaMetricas` con coste, hallazgos por severidad y origen, lecturas, `kbPeticionPorRonda`, `tareasSinCoste`, aviso de repetidas), mas el arreglo de severidades sin distinguir mayusculas (gana riesgos) y la regla «sin tabla = sin dato». Los pasos 3 a 5 (`leerRepoMetricas` + `--repo` con clave `(proyecto, id)`, `evolucion.ts`, `grupos-metricas.ts`, `--json`, README y linea base de los tres repos) pasan a **TASK-065**, que depende de esta.

Para que TASK-065 no tenga que rehacer la fila: `FilaMetricas` distingue «no medido» de «no leido» desde ya (campos siempre presentes; `null` con significado documentado), que es la preocupacion principal de arquitectura. La linea base no se copia en ningun Resultado hasta TASK-065.
