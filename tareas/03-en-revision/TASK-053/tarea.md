---
id: TASK-053
titulo: "moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio de Windows"
tipo: fix
sprint: 6
etiquetas: []
complejidad: trivial
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-053-movetareafile-reintenta-el-rename-ante-u
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Que `finish` no se quede a medias por un `EPERM`/`EBUSY` transitorio de
Windows al mover la carpeta de la tarea. Paso dos veces seguidas en este
proyecto (TASK-037 y TASK-040): el merge ya estaba hecho y subido, el
`rename` de `03-en-revision/TASK-NNN` a `04-terminadas/` fallo porque algun
proceso (antivirus, indexador) tenia un handle abierto un instante, y hubo que
reintentar `finish` a mano. `moveTareaFile` debe reintentar el `rename` unas
pocas veces con espera creciente antes de fallar.

Complejidad `trivial` (no `simple`, como se importo): un reintento acotado en
una funcion, sin diseno que explorar.

## Criterios de aceptacion
- [x] `moveTareaFile` reintenta el `rename` hasta 5 veces con espera creciente ante `EPERM` o `EBUSY`, y solo entonces falla
- [x] Test que simula el fallo transitorio (un rename que falla las 2 primeras veces) y comprueba que la tarea se mueve
- [x] `finish` sigue siendo reintentable si el rename falla de verdad tras los reintentos (test)

## Resultado

**Implementado.** `moveTareaFile` (`src/fs/task-store.ts`) pasa el `rename` por
`renombrarConReintentos`: ante `EPERM` o `EBUSY` espera 100, 200, 400, 800 y
1600 ms (~3 s) y reintenta; cualquier otro error, o agotar los reintentos, se
propaga igual que antes (y `finish` sigue siendo reintentable). El rename y
las esperas son inyectables via `MoveTareaFileOptions` solo para los tests.

**Pruebas.** `test/fs/task-store-reintento.test.ts` (3), con carpetas reales:
un EPERM que dura dos intentos no impide mover la tarea; un EBUSY permanente
se propaga tras 1 + 3 intentos y la tarea sigue en su sitio; un ENOTDIR no se
reintenta. Con `task-store` y `finish`: 35/35.
