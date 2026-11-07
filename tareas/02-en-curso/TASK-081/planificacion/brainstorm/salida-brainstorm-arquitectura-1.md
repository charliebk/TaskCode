# Brainstorm — TASK-081, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

Hay tres piezas independientes. Cada una extiende algo que ya existe y ninguna crea un subsistema nuevo. Las rutas son relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

**1. Lecturas por revisor y ronda. Se capturan al registrar, no al medir.**
- Lo que hay hoy (leído): `core/coste-transcripcion.ts` ya cuenta `lecturas` por transcripción (TASK-063). `registrar-coste` las guarda en la columna `lecturas` de `## Coste` (`core/coste-registro.ts`). Pero con varios `--agente` las **suma en una sola fila**, y la fila no dice de qué ronda ni de qué revisor es. Por eso hoy solo existe la mediana de lecturas por fase (`medianaLecturas`, `core/metricas.ts:781`).
- `taskctl metricas` **no lee transcripciones** y debe seguir así. Lee `tarea.md`, admite `--repo` sobre otros repos y regenera `docs/METRICAS.md` de forma determinista. Las transcripciones viven en `~/.claude` de una máquina y caducan. El criterio «sacadas de la transcripción del subagente» se cumple porque quien las lee es `registrar-coste`, y deja el dato en el repo.
- En la tabla `## Coste` entran dos columnas nuevas detrás de `fuente`: `ronda` y `revisor` (`-` = sin dato, como el resto). `leerCostes` acepta las filas de 9 columnas (antiguas, que quedan con ronda y revisor a `null`) y las de 11. `CABECERA_COSTE` pasa a 11 columnas solo para las filas nuevas.
- Con `--fase revision`, `registrar-coste` escribe **una fila por agente** en un único commit, en vez de una fila sumada. Así cada fila lleva su ronda y su revisor. Las otras fases no cambian.
- La ronda y el revisor **salen de la propia transcripción**, sin flags nuevos. Una función pura nueva en `core/coste-transcripcion.ts`, `rondaYRevisorDeTranscripcion(texto): { ronda: number; revisor: string } | null`, busca en el primer mensaje `type: "user"` el nombre de la petición (`peticion-revision-<N>[-<skill>].md`). La clave del revisor es la misma que ya usan los hallazgos: el sufijo del fichero, `''` cuando la ronda no se fragmentó (`InformeLeido.revisor`, `core/informe-revision.ts:275`). Así lecturas y hallazgos se cruzan por la misma clave.
- La expresión `RONDA_FILE_RE` (privada hoy en `commands/review.ts:92`) se muda a `fs/rondas.ts`, donde ya están `PETICION_REVISION_RE` e `INFORME_REVISION_RE`. Si no, acaba habiendo dos versiones del mismo nombre de fichero.
- Presentación: `core/coste-registro.ts` gana un resumen puro por (ronda, revisor), `lecturasDeRevision(filas)`. `core/metricas.ts` lo pinta como bloque de líneas bajo la tabla, del estilo de `notasFilaEnriquecida`: `TASK-081 · r1: code-quality-reviewer 42, java-spring-reviewer 17 · r2: code-quality-reviewer 8`. También sale en `--json`. **No va** al bloque de `--escribir`, como ya pasa con `COLUMNAS_DESGLOSE_TOKENS` (solo por pantalla).

**2. Lista de contexto permitido en la petición.**
- Módulo puro nuevo: `core/contexto-revision.ts`, con `contextoPermitido({ carpetaTarea, ficherosDelGrupo, extra, excluir }): string[]`. Devuelve `tarea.md` y `planificacion/` de la carpeta de la tarea, los ficheros del grupo (`escritura.ficheros`, el diff de su dominio) y las rutas extra. Le quita lo que casa con `excluir`, que es el mismo array que ya construye `review.ts:484`, con `EXCLUIR_HELDOUT` incluido. Así los tests reservados (held-out) no pueden colarse en la lista.
- `ExtrasPeticion` (`review.ts:235`) gana `contextoPermitido?: readonly string[]`. `peticionTemplate` lo pinta como `## Contexto permitido`, justo después de las instrucciones.
- `informeTemplate` gana una sección vacía, `## Lecturas fuera del contexto permitido` (por defecto «ninguna»), para que la justificación tenga un sitio fijo. Por ahora no se parsea.
- La regla se escribe en `skills/task-workflow/revision.md`, en una sección nueva («Lo que lees»). Ese es el contrato común: lo cargan las cinco skills revisoras (`code-quality-reviewer/SKILL.md:16` manda leerlo). En `code-quality-reviewer` basta una línea que remita a él. Ninguno de esos textos menciona TaskCode.
- Clave opcional en `.taskcode/config.yml`: `contexto_revision` (lista). Se añade a `CLAVES_CONFIG` con el mismo lector que `excluir_de_revision`. Cubre lo que un proyecto quiere que siempre se pueda leer, como su `CLAUDE.md` o sus documentos de contexto.

**3. Modelo más barato en la ronda 2.**
- Función pura nueva `modeloDeVerificacion(modelo: string): string | null`, con la escalera cerrada opus→sonnet→haiku. Haiku y un nombre desconocido devuelven `null`, y entonces no se sugiere nada. Puede ir en `core/revisores.ts` o en un `core/modelo-revision.ts` pequeño. Prefiero lo segundo: `revisores.ts` trata del catálogo de skills, no de modelos.
- `leerRondaPrevia` (`review.ts:262`) ya recorre los hallazgos abiertos con `hallazgosNoCerrados`. Se le añade un campo estructurado a `RondaPrevia`: `criticosAbiertos: number | null` (`null` si algún informe no tiene tabla). La sugerencia aparece solo si es `incremental && criticosAbiertos === 0`.
- En la petición va una **línea nueva**: `- Modelo sugerido para esta ronda: <m> (verificacion de correcciones; la tarea usa <modelo_sugerido>)`. La línea `- Agente a lanzar: … (modelo sugerido: …)` no se toca, porque la comprueba `test/commands/review-dominios.test.ts:81`. Tampoco se reescribe `modelo_sugerido` en el frontmatter. `ReviewCommandResult` gana `modeloRonda?: string`. Se actualizan `skills/review/SKILL.md`, para que el orquestador lance con esa línea si existe, y la salida del CLI en `cli.ts`.

**Orden de construcción** (los bloques A y B se pueden entregar por separado):
1. Mudar `RONDA_FILE_RE` a `fs/rondas.ts` y crear `rondaYRevisorDeTranscripcion` (puro).
2. Columnas `ronda`/`revisor` en `core/coste-registro.ts` (escritura y lectura de 9 y 11 columnas) y `lecturasDeRevision`.
3. `commands/registrar-coste.ts`: una fila por agente en revisión. Hay que encajarlo con la lógica `dif:` de TASK-065.
4. `core/metricas.ts` y `commands/metricas.ts`: bloque por pantalla y `--json`; nota en `docs/METRICAS.md` y en `skills/task-workflow/coste.md`.
5. Bloque B, en `review.ts`: contexto permitido, sección nueva del informe, modelo de la ronda 2, y los textos de `revision.md` y `review/SKILL.md`.

**Coste que fija la forma:** `metricas` sigue siendo O(tareas) sin tocar el disco de `~/.claude`. `registrar-coste` ya lee cada transcripción entera una vez, y deducir ronda y revisor solo mira la primera línea de usuario. El recorrido de `buscarTranscripciones` por proyectos y sesiones sigue siendo uno por agente, igual que hoy.

**Alternativas descartadas:**
- Que `metricas --tokens` lea las transcripciones al vuelo. No: deja de ser determinista y reproducible desde el repo, rompe con `--repo` y en otra máquina, y el dato desaparece cuando Claude Code limpia sus transcripciones.
- Una sección nueva `## Lecturas de revision` aparte de `## Coste`. No: serían dos tablas para el mismo hecho (el agente X en la fase revisión) y acabarían divergiendo.
- Meter ronda y revisor dentro de `fuente` (`agente:<id>@r2:<skill>`). No: sobrecarga `idsDeFuente`, que ya interpreta `dif:`.

## Que se extiende y que se crea

**Se extiende:**
- `core/coste-registro.ts`: columnas `ronda`/`revisor`, lectura de 9 y 11 columnas, `lecturasDeRevision`.
- `core/coste-transcripcion.ts`: `rondaYRevisorDeTranscripcion` (puro, junto a `sumarUsoTranscripcion`).
- `commands/registrar-coste.ts`: una fila por agente en `--fase revision`.
- `fs/rondas.ts`: recibe `RONDA_FILE_RE` (ahora exportada, y `review.ts` la importa).
- `core/metricas.ts` y `commands/metricas.ts`: bloque de lecturas por revisor y ronda, más `--json`.
- `commands/review.ts`: `ExtrasPeticion.contextoPermitido`, la sección nueva en `informeTemplate`, `RondaPrevia.criticosAbiertos`, la línea del modelo de la ronda y `ReviewCommandResult.modeloRonda`.
- `core/config.ts`: clave `contexto_revision`.
- Skills: `task-workflow/revision.md` (regla común), `code-quality-reviewer/SKILL.md` (remite a ella), `review/SKILL.md` (modelo de la ronda), `task-workflow/coste.md` (una fila por agente en revisión).
- Docs: `docs/METRICAS.md`, en prosa y fuera de los marcadores del bloque generado. Incluye el objetivo de 3–4 M de tokens de revisión por tarea media.

**Se crea:**
- `core/contexto-revision.ts`: arma la lista permitida.
- `core/modelo-revision.ts`: la escalera de modelos.

Ambos son pequeños y puros, para no seguir engordando `review.ts`, que ya pasa de 670 líneas.

## Limites que cruza

- **Formato de fichero persistente:** la tabla `## Coste` de `tarea.md` pasa de 9 a 11 columnas. Las filas antiguas deben seguir leyéndose. Hoy `leerCostes` descarta en silencio cualquier fila con otro número de columnas (`COLUMNAS = 9`, `coste-registro.ts:129`). Es el mismo tipo de cambio que hizo TASK-063 al añadir `lecturas`.
- **Contrato de la petición de revisión:** salen una sección (`## Contexto permitido`) y una línea de cabecera nuevas. Las líneas que ya se parsean (`- Commit revisado (HEAD):`, que lee `commitRevisadoDe`) y la de `Agente a lanzar` no cambian.
- **Contrato del informe:** sale una sección nueva. La tabla de hallazgos y la línea del veredicto, que leen `finish`, `veredicto` y `metricas`, no cambian.
- **Contenido que se instala en proyectos ajenos:** `revision.md`, `code-quality-reviewer`, `review/SKILL.md` y `coste.md` no pueden nombrar TaskCode ni sus rutas.
- **Esquema de configuración:** clave nueva `contexto_revision`. Una clave desconocida en versiones antiguas avisa y se ignora, así que no rompe nada.
- **Decisión escrita que se contradice:** §16.6 de `docs/PROPUESTA_METODOLOGIA.md` dice que el revisor usa el mismo modelo que la tarea y que, «para `media` en adelante, el revisor sigue con el nivel de profundidad y modelo que ya tenía». Bajar de modelo en la ronda 2 la reabre para las rondas de verificación. Hay que escribirlo como enmienda de §16.6 y no dejarlo implícito en el código. Como mínimo, el comentario de `review.ts:133` que cita §16.6 tiene que dejar de ser cierto a la vez que se corrige.
- **Dependencia del formato de transcripción de Claude Code**, que es externo e inestable: hoy solo se depende de `type: "assistant"`. Con este cambio se pasa a depender también del primer mensaje `type: "user"`.

## La decision de diseño que mas te preocupa (UNA sola)

**De dónde sale la pareja (ronda, revisor) de cada fila de coste.**

Mi propuesta es deducirla de la transcripción: el nombre `peticion-revision-<N>[-<skill>].md` que aparece en el prompt del subagente. Ventajas: ningún flag nuevo, funciona con varios `--agente` en una llamada, y la clave del revisor sale del mismo nombre de fichero que ya usan los hallazgos. La alternativa son flags explícitos `--ronda N --revisor <skill>`. Sería más robusto ante cambios del formato de la transcripción, pero tiene dos problemas: el revisor quedaría como texto libre que puede no coincidir con el sufijo del informe, y no encaja con `--agente` repetible (habría que emparejar flags).

El riesgo de mi opción es arquitectónico, no un caso límite: el dato pasa a depender de **cómo redacta el orquestador el prompt** y de **cómo guarda Claude Code el mensaje de usuario**, y ninguna de las dos cosas la controla el CLI. Si el unificador prefiere los flags, lo coherente es aceptarlos **solo** como sustitutos con un único `--agente`, y validar `--revisor` contra los sufijos de las peticiones que existen en `revision/` de la tarea. Nunca como texto libre.

Suposiciones sin verificar que sostienen esta decisión:
- (a) `skills/review/SKILL.md` manda pasar al revisor la ruta de su petición. No lo he leído.
- (b) En `agent-<id>.jsonl`, el primer mensaje `type: "user"` contiene el prompt literal, ya sea como texto o como bloques. Habría que mirarlo en una transcripción real.
- (c) «Sin CRÍTICOS abiertos» equivale a ningún CRITICO en `hallazgosNoCerrados`. Es una regla de dominio y no la resuelvo aquí.
