---
id: TASK-005
titulo: "Comando taskctl board (listado por estado)"
tipo: feature
sprint: 0
etiquetas: [cli, visualizacion]
complejidad: trivial
modelo_sugerido: haiku
estado: planificada
plan_aprobado: false
rama: feature/task-005-taskctl-board
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-002]
---
## Objetivo

`taskctl board [--sprint N] [--asignado_a persona]` recorre las 5 carpetas
de estado y muestra una tabla en texto plano (ID, título, estado, asignado)
en la terminal, sin dependencias de librerías de tablas.

## Criterios de aceptación

- [x] Salida agrupada por carpeta de estado, en el orden del ciclo de vida.
      → `formatBoard` (src/core/board-format.ts) recorre `TASK_STATES` en
      orden (planificada → en-diseno → en-curso → en-revision →
      terminada), no el orden de lectura del filesystem.
- [x] Filtros `--sprint` y `--asignado_a` funcionan combinados.
      → Aplican con AND. `--asignado_a` usa el nombre de flag con guion
      bajo (no guion medio) a propósito, igual que el campo del
      frontmatter, tal como especifica el Objetivo — aunque rompa la
      convención de guiones del resto de flags del CLI.
- [x] Carpeta de estado vacía se omite de la salida (no imprime cabecera
      vacía).
      → Verificado con datos reales: el propio repo TaskCode hoy solo
      tiene tareas en `00-planificadas`, y `taskctl board` imprime
      únicamente esa sección, sin cabeceras vacías para las otras 4.
- [x] Revisión por pares de un agente independiente sobre el diff
      completo, sin hallazgos críticos sin resolver.
      → 0 críticos, 3 importantes (los 3 corregidos), 2 menores
      (documentados, no corregidos). Detalle completo en "Resultado"
      más abajo.

## Resultado

Implementado `taskctl board [--sprint N] [--asignado_a persona]`:
`src/core/board-format.ts` (módulo puro, sin tocar disco) filtra y
formatea en texto plano, agrupando por estado en el orden del ciclo
de vida; `src/commands/board.ts` lee todas las tareas existentes (en
paralelo, `Promise.all`) reutilizando `listExistingTaskIds`/
`readTareaFile` de `src/fs/task-store.ts`. Cableado en `cli.ts`
(comando `board`, ayuda actualizada).

Decisión de diseño explícita: `board` es de solo lectura — no crea ni
modifica ningún fichero de `tareas/` ni toca Git — así que
deliberadamente NO aplica la precondición de rama base de la sección
8.3 (esa precondición, de TASK-012, es para comandos que escriben en
la rama activa; por el mismo motivo que `taskctl start` tampoco la
necesita, según la propia sección 8.3).

Otra decisión de diseño explícita: la tabla muestra ID/Título/Asignado
por fila, sin repetir una columna "Estado" (aunque el Objetivo original
la menciona) — el agrupado por sección ya comunica el estado sin
redundancia visual. No incumple ningún criterio de aceptación (el
checklist real no exige esa columna) y quedó confirmado como hallazgo
MENOR aceptado, no corregido, en la revisión por pares.

**Revisión por pares (agente independiente, general-purpose): 0
críticos, 3 importantes, 2 menores — todos verificados de forma
empírica, incluida una prueba manual contra las 12 tareas reales del
propio repo TaskCode, no solo fixtures de test pequeños.**

IMPORTANTE 1 (`board-format.ts`): el ancho de columna se calculaba con
`.length` (unidades UTF-16), no con ancho visual de terminal. Un
título con caracteres CJK (1 unidad de longitud, 2 columnas visuales
en cualquier terminal real) desalineaba la tabla. Reproducido y
confirmado por el revisor creando una tarea real con un título en
japonés y comparando la salida cruda con `cat -A`. **Corrección**:
`visualWidth()`/`isWideCodePoint()` en `board-format.ts` — rangos
aproximados de caracteres East Asian Wide/Fullwidth/emoji (sin
depender de un paquete externo, coherente con el "cero dependencias"
del proyecto), usados tanto para calcular el ancho de cada columna
como para rellenar cada celda.

IMPORTANTE 2 (`board-format.ts`): un tabulador embebido en un título
se colaba literal en la tabla; al expandirse en una terminal real a la
siguiente tabulación rompe la alineación de un modo que ningún cálculo
de ancho puede prever de antemano. Reproducido con un título con `\t`
incrustado. **Corrección**: `sanitizeCell()` sustituye cualquier
carácter de control por un espacio antes de calcular anchos o
renderizar — defensa en el propio formateador, independiente de si
`task.ts` llega a validar esto en el futuro.

IMPORTANTE 3 (`board.ts`): `listExistingTaskIds` devuelve un ID una
vez POR CARPETA de estado en la que aparece — si el mismo ID existe a
la vez en dos carpetas (una inconsistencia de datos real, p. ej. un
merge/cherry-pick de Git-Flow que deja la carpeta vieja sin borrar),
el ID sale repetido en la lista. Iterar esa lista tal cual mostraba la
tarea DOS VECES —con el mismo contenido, porque `readTareaFile` solo
devuelve la primera coincidencia según el orden del ciclo de vida— y
escondía en silencio la copia real más avanzada, sin ningún aviso.
Reproducido creando a mano la misma carpeta `TASK-NNN` en dos estados
distintos. **Corrección**: los IDs se deduplican antes de leer
(contando ocurrencias), y cuando se detecta la inconsistencia se
añade una advertencia explícita — mismo tratamiento que una `tarea.md`
inválida (patrón que TASK-004 ya estableció para `taskctl import`).

MENOR (documentado, no corregido): la columna "Estado" que menciona
el Objetivo original no está en la tabla — ver la decisión de diseño
explícita más arriba.

MENOR (documentado, no corregido): `--asignado_a` es coincidencia
exacta, sin una forma explícita de filtrar "sin asignar" (un
`--asignado_a "(sin asignar)"` da 0 resultados, no las tareas sin
asignar). No lo exige ningún criterio de aceptación; es una limitación
de UX conocida, no un bug.

**Verificación manual real (dogfooding), en un clon aislado del propio
repo TaskCode**: `taskctl board` sin filtros muestra las 12 tareas
reales del proyecto, agrupadas correctamente en la única sección con
contenido (`Planificadas`); `--sprint 1` y `--asignado_a charlie.bk`
filtran correctamente por separado y combinados; `--sprint 999` (sin
coincidencias) imprime un mensaje claro en vez de una tabla vacía;
`--sprint abc` falla con `[ERROR]` y código de salida 1. Tras la
corrección del hallazgo IMPORTANTE 1, una tarea real con título en
japonés (`日本語のタスクタイトルです`) ya no desalinea la columna
"Asignado" frente a las demás filas.

226 tests en total (3 nuevos desde TASK-004: pruebas puras de
`board-format.ts` más la reproducción exacta de los 3 hallazgos
IMPORTANTES). Cobertura global del proyecto: 96.51% líneas / 94.29%
ramas / 99.83% funciones. `board.js` llega a 97.83%/82.61%/100%;
`board-format.js` a 100%/79.63%/100% — el hueco de ramas es
`isWideCodePoint()` (varios rangos Unicode encadenados con `||`, no
todos ejercitados individualmente por los tests); no se persiguió
cobertura exhaustiva de cada rango Unicode, mismo criterio de "tests
reales, no relleno" que el resto del proyecto (p. ej. `git.ts`/
TASK-012, `start.js`/TASK-009).

**No verificado todavía (bootstrapping):** esta misma tarea, TASK-005,
sigue en `estado: planificada` en su propio frontmatter — es una tarea
de Sprint 0 bootstrapeada junto con el resto del plan inicial, y de
momento las tareas de este proyecto se gestionan a mano
(Objetivo/Criterios/Resultado editados directamente, rama creada con
`create-feature.sh`) en vez de con su propio ciclo
`plan → approve → start`, igual que TASK-004 y TASK-008 a TASK-012.

Trabajo commiteado en la rama `feature/task-005-taskctl-board`,
pendiente de mergear a `develop`.
