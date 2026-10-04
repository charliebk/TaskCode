---
id: TASK-041
titulo: "F4-T1 taskctl new con objetivo y criterios"
tipo: feature
sprint: 5
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-041-f4-t1-taskctl-new-con-objetivo-y-criteri
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

Que una tarea nazca con su objetivo y sus criterios, sin editar `tarea.md`
despues (auditoria del 2026-10-03, C1). Hoy `taskctl new` deja el Objetivo
vacio y un criterio `- [x] ` vacio a proposito, y cada tarea de este backlog ha
necesitado un commit aparte solo para escribirlos. Con `--objetivo` y
`--criterio` (repetible), o con `--desde <fichero>` que ya tenga esas dos
secciones, la tarea queda definida en el mismo commit en que se crea.

Fuera de alcance: validar que los criterios sean verificables (TASK-043).

## Criterios de aceptacion
- [x] `taskctl new --objetivo "<texto>" --criterio "<texto>"` (repetible) escribe ambas secciones
- [x] `taskctl new --desde <fichero fuera del repo>` toma objetivo y criterios de un markdown
- [x] Sin esos flags el comportamiento es el de hoy

## Resultado

**Implementado** en `src/commands/new.ts`: `--objetivo "<texto>"` y
`--criterio "<texto>"` (repetible; tambien `--flag=valor`), extraidos antes de
`parseArgs` porque ese parser se queda con el ultimo valor de un flag
repetido; y `--desde <fichero>`, que toma `## Objetivo` y `## Criterios de
aceptacion` con `extraerSecciones` (el parser de `plan`), acepta en los
criterios tanto `- [ ] x` como la viñeta simple `- x` del formato de `import`,
y sin esas secciones usa el fichero entero como objetivo. `--desde` no se
combina con los otros dos; valores vacios o un fichero que no existe abortan
sin escribir nada. Ayuda del CLI y sinopsis de la skill actualizadas.

**Pruebas.** `test/commands/new-contenido.test.ts` (4) contra repos reales:
flags repetidos en el mismo commit `tarea creada`; sin flags, `DEFAULT_BODY`
intacto; `--desde` con y sin secciones; errores sin commit. Con `new`, `main`
e `import`: 53/53.

**Revision ronda 1: aprobada con correcciones** (0 criticos, 0 importantes, 7
menores; suite completa 930 tests, solo los 3 rojos conocidos de Windows; CLI
real: la tarea creada con flags la acepta `plan` y su parser lee objetivo y
criterios). Por A3, sin ronda 2. Corregidos en el cierre:
- MEN-1: un `--criterio` con saltos de linea se une en una sola linea (antes
  `plan` perdia el resto), y un `--objetivo` con cabeceras `#` se rechaza (antes
  partia las secciones de tarea.md).
- MEN-2: la salida ya no dice «Rellena ## Objetivo» si la tarea nacio con
  contenido.
- MEN-3: el test de la exclusion `--desde`/`--criterio` usaba un fichero
  inexistente y fallaba por el ENOENT; ahora prueba la exclusion.
- MEN-7: un `--desde` vacio da error en vez de crear la tarea en blanco.
Sin corregir, documentados: MEN-4 (`--criterio "--x"` se rechaza con «necesita
un valor»; `--criterio=--x` funciona), MEN-5 (`vinetasComoCasillas` aplana
viñetas anidadas y trata `#` de nivel 1 como cabecera), MEN-6 (la ayuda no
avisa de que un `--desde` dentro del repo sin commitear aborta por workspace
sucio).
