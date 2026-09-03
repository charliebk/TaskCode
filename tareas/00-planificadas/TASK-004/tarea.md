---
id: TASK-004
titulo: "Comando taskctl import (alta masiva desde Markdown)"
tipo: feature
sprint: 0
etiquetas: [cli, ingesta]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-004-taskctl-import
asignado_a: charlie.bk
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-002, TASK-003]
---
## Objetivo

`taskctl import docs/sprint-N-propuesta.md` parsea una lista de tareas en
Markdown (formato: encabezado `### Título` seguido de una lista de
criterios) de forma determinista con un parser propio (sin LLM). Si una
entrada no encaja en el formato esperado, se reporta como error de esa
entrada concreta (no aborta el resto del import) y se deja constancia del
punto de extensión para una futura reparación por LLM (§16.2 de la
metodología) — sin implementarlo todavía en Sprint 0.

## Criterios de aceptación

- [x] Un Markdown con 5 tareas bien formadas produce 5 ficheros `tarea.md`
      válidos, con IDs consecutivos sin colisión.
      → Cubierto con un test real (5 entradas) y con IDs consecutivos
      verificados de punta a punta.
- [x] Una entrada malformada dentro de un import de varias tareas no impide
      que las demás se creen; se reporta por stderr con el motivo exacto.
      → `parseImportMarkdown` (src/core/import-parser.ts) nunca lanza por
      una entrada mala: la marca `ok: false` con el motivo exacto (sin
      título, sin criterios, o una línea suelta que no es ni criterio ni
      línea en blanco) y sigue con las demás.
- [x] `taskctl import` es idempotente respecto a título: reimportar el mismo
      fichero no duplica tareas ya creadas con el mismo título normalizado
      (se avisa y se salta, no se sobreescribe).
      → Matiz importante que salió de la revisión por pares: la primera
      versión de este criterio usaba `slugify()` tal cual como clave de
      idempotencia, y `slugify()` colapsa cualquier título sin ningún
      carácter ASCII alfanumérico al mismo literal `"tarea"` — dos
      títulos completamente distintos que cayeran en ese fallback
      colisionaban en silencio. Ver el hallazgo CRÍTICO más abajo.
- [x] Revisión por pares de un agente independiente sobre el diff
      completo, sin hallazgos críticos sin resolver.
      → 1 CRÍTICO y 4 IMPORTANTES encontrados y corregidos, 3 MENORES (2
      corregidos de paso, 1 documentado sin corregir). Detalle completo
      en "Resultado" más abajo.

## Resultado

Implementado `taskctl import <fichero.md> [--tipo ...] [--sprint N]
[--complejidad ...] [--modelo-sugerido ...] [--agente-revisor ...]`:
parser determinista y puro en `src/core/import-parser.ts`
(`parseImportMarkdown`, sin tocar disco ni Git) que reconoce entradas
delimitadas por encabezados `###` con una lista de criterios debajo, y
`src/commands/import.ts` que orquesta la precondición de rama base
(§8.3, TASK-012) y crea cada tarea válida reutilizando `buildNewTask`
(el mismo constructor que `taskctl new`, TASK-003/TASK-012) para no
duplicar la lógica de slug/rama. Cableado en `cli.ts` (comando
`import`, ayuda actualizada).

**Revisión por pares (agente independiente, general-purpose): 1
CRÍTICO, 4 IMPORTANTES, 3 MENORES — todos verificados de forma
empírica contra repos Git reales, no solo leyendo el diff.**

CRÍTICO (`import.ts`): `slugify()` (de `new.ts`) colapsa cualquier
título sin ningún carácter ASCII alfanumérico al mismo literal
`"tarea"` — un fallback pensado solo para nombrar la rama de una tarea
aislada, inofensivo ahí. Reutilizado tal cual como clave de
idempotencia de `import`, dos títulos completamente distintos que
cayeran en el fallback (p. ej. `"日本語のタスク"` y `"!!!???"`)
colisionaban en silencio: la segunda entrada se descartaba como si ya
existiera, sin ningún aviso real, violando directamente el criterio de
"N tareas bien formadas -> N ficheros". Confirmado de forma empírica
por el revisor con un repro exacto. **Corrección**: nueva función
`normalizedTitleKey()` en `import.ts` — fuera del caso fallback usa el
slug tal cual (mismo comportamiento de siempre, mismos tests de
idempotencia por acentos/mayúsculas siguen pasando), y solo cuando
`slugify()` devuelve el fallback, añade el propio título (recortado y
en minúsculas) a la clave para no perder la distinción. `SLUG_FALLBACK`
se exportó desde `new.ts` para no duplicar el literal.

IMPORTANTE 1 (`cli.ts`): `taskctl import` siempre devolvía código de
salida 0, incluso si TODAS las entradas del fichero fallaban — un
script que encadenara `taskctl import x.md && siguiente_paso` nunca se
enteraba de que el import no creó nada. Corregido: devuelve 1 si
`result.errores.length > 0`.

IMPORTANTE 2 (`import.ts`): un `TaskAlreadyExistsError` por una
carrera externa real (dos `taskctl import`/`taskctl new` corriendo a
la vez sobre el mismo repo) escapaba sin capturar desde el bucle de
creación y perdía el resumen entero de la pasada — incluidas las
tareas ya escritas con éxito antes en el mismo bucle — con un mensaje
del `catch` genérico de `bin/taskctl` que sonaba a "taskctl no pudo
arrancar" cuando en realidad sí había arrancado y ya había creado
varias tareas reales en disco. Reproducido con dos `runImportCommand`
concurrentes vía `Promise.all` sobre el mismo `tareasRoot`.
Corregido: se captura por entrada, se reporta como error de esa
entrada concreta (mismo tratamiento que una entrada malformada) y el
import sigue con las demás, resincronizando la lista de IDs existentes
para no recalcular el mismo ID ya ocupado.

IMPORTANTE 2b (`import.ts`): una tarea YA EXISTENTE en el repo, sin
ninguna relación con lo que se está importando, cuyo `tarea.md`
estuviera corrupto (`FrontmatterParseError`) o fuera inválido
(`TaskValidationError`, p. ej. un `tipo` que ya no es un valor válido)
bloqueaba el import ENTERO al precalcular la detección de duplicados
— algo que `taskctl new` nunca sufre (solo lista nombres de carpeta,
nunca lee el contenido de tareas ajenas). Reproducido con una tarea
existente corrompida a mano y un import de una tarea nueva sin
relación: el import completo fallaba sin explicar la causa real.
Corregido: se reporta como advertencia (`result.advertencias`,
impresa por `cli.ts` con el prefijo `[AVISO]`) y esa tarea
simplemente no participa en la detección de duplicados de esa pasada;
las demás tareas se importan con normalidad.

IMPORTANTE 3 (`import.ts`): la precondición de rama base corría ANTES
de comprobar que el fichero a importar existe, así que un
`taskctl import fichero-que-no-existe.md` desde una rama de feature
limpia cambiaba de rama igualmente (el workspace SÍ estaba limpio) y
solo entonces fallaba al no encontrar el fichero — dejando a la
persona en la rama base sin avisarle del cambio (el aviso de cambio de
rama solo se imprime en el camino de éxito). Reproducido: rama activa
después del intento fallido era `develop`, no la rama de feature
original. Corregido: el fichero se lee primero; solo si la lectura
tiene éxito se aplica la precondición de la sección 8.3.

IMPORTANTE 4 (`import-parser.ts`): `LIST_ITEM_RE` estaba anclada a la
columna 0, así que una lista de criterios indentada con espacios
(Markdown perfectamente válido, visualmente indistinguible de una sin
indentar en cualquier renderizador) invalidaba la entrada ENTERA con
un mensaje que sonaba a "esto no es una lista" cuando sí lo era, solo
que indentada. Corregido: `LIST_ITEM_RE` ahora tolera indentación
inicial (`/^\s*[-*]\s+(.+)$/`).

MENOR (nuevo, hallado por el propio revisor al señalar la ausencia de
tests): `src/cli.ts` (`main()`, el punto de entrada real) no tenía
ningún test que lo invocara directamente — ninguno de los 3 hallazgos
IMPORTANTES relacionados con `cli.ts` los habría detectado la suite
existente, y `cli.js` ni siquiera aparecía en el reporte de cobertura
(nunca se había importado desde un test). Añadido
`test/cli/main.test.ts`, centrado en el comando `import` (donde
salieron los hallazgos) sin reimplementar la cobertura ya exhaustiva
de `runImportCommand`. Efecto colateral honesto: al medirse por
primera vez, el reporte de cobertura revela que el resto de comandos
(`new`/`start`/`plan`/`approve`/`--help`/`--version`) TAMPOCO tienen
cobertura directa de `main()` — una brecha preexistente desde antes de
TASK-004, ahora visible por primera vez en el reporte (43.88%
líneas/50.00% ramas de `cli.js`), no corregida aquí por ser
explícitamente fuera de alcance de esta tarea. Queda documentada para
quien retome `taskctl board` (TASK-005) o cierre Sprint 0.

MENOR (corregido de paso): la precomprobación de duplicados leía cada
tarea existente de forma secuencial, una detrás de otra. Ahora en
paralelo (`Promise.all`), sin cambio de comportamiento.

MENOR (documentado, no corregido, deliberado): las listas numeradas
(`1. criterio`) no están soportadas — solo `-`/`*`, tal como dice el
Objetivo de esta tarea. No es un hallazgo, es el formato tal como se
diseñó.

**Verificación manual real (dogfooding), en un clon aislado del propio
repo TaskCode** (no en la rama de trabajo de esta sesión): confirmado
con evidencia real que un import con un título en japonés y otro solo
de símbolos, más una entrada con criterios indentados, crea las 3
tareas (el bug del fallback de slug y el de indentación, ambos
corregidos); que un import con todas las entradas malformadas sale con
código 1; y que un fichero inexistente NO cambia de rama (queda en la
rama de feature original, `[ERROR]` sin ningún efecto secundario).

201 tests en total (36 nuevos desde TASK-012: 29 de la primera vuelta
+ 7 más al corregir los hallazgos de revisión por pares, incluido el
primer test que invoca `main()` de `cli.ts` directamente). Cobertura
global del proyecto: 96.69% líneas / 95.22% ramas / 99.82% funciones
— el descenso frente a TASK-012 (99.03%/96.20%) es enteramente
atribuible a que `cli.js` se mide por primera vez y expone comandos
preexistentes sin cobertura directa de `main()` (ver MENOR arriba), no
a una regresión de calidad: `import.js` en sí llega a
99.03%/91.49%/100%, `import-parser.js` a 100%/89.66%/100% (el único
hueco de rama restante en cada uno es un `throw` de re-lanzamiento de
un tipo de error inesperado, deliberadamente casi imposible de forzar
sin mocks — mismo patrón ya aceptado en `git.ts`/TASK-012 y
`start.js`/TASK-009).

**No verificado todavía (bootstrapping):** esta misma tarea, TASK-004,
sigue en `estado: planificada` en su propio frontmatter — es una tarea
de Sprint 0 bootstrapeada junto con el resto del plan inicial (no
creada con `taskctl new`), y de momento las tareas de este proyecto se
gestionan a mano (Objetivo/Criterios/Resultado editados directamente,
rama creada con `create-feature.sh`) en vez de con su propio ciclo
`plan -> approve -> start`, igual que TASK-008 a TASK-012.

Trabajo commiteado en la rama `feature/task-004-taskctl-import`,
pendiente de mergear a `develop`.
