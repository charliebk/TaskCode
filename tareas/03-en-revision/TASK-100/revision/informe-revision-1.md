# Informe de revision — TASK-100 (ronda 1)

- Commit revisado: 868f7cb (el codigo revisado es el de a6cf647; el siguiente solo anade la peticion)
- Revisor: revisor independiente (agente general-purpose, skill code-quality-reviewer)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts (`rutasDeTarea`, el `'.'` del pathspec de `fueraDeDocs`) y src/core/verificacion-proporcional.ts | implementacion |
| MEN-1 | MENOR | abierto | src/commands/finish-verificacion.ts (`puertaSoloDocumentacion`, anotar y commitear antes de la comprobacion) | implementacion |
| MEN-2 | MENOR | abierto | README.md («Tareas de solo documentacion»), skills/task-workflow/verificacion-selectiva.md, test finish-documentacion.test.ts | implementacion |
| MEN-3 | MENOR | abierto | src/core/verificacion-proporcional.ts (`tareas/**` siempre es documentacion) | plan |
| MEN-4 | MENOR | abierto | src/core/config.ts (`validarPatronesExclusion` acepta `*` y `**`) | plan |
| MEN-5 | MENOR | abierto | src/core/config.ts (`validarDocumentacionCompleta`) con src/hooks/guardia-merge.ts:88-92 | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### IMP-1 — Proyecto en un subdirectorio del repo: el codigo fuera de esa carpeta sale como «solo documentacion»

`taskctl` usa `repoCwd = process.cwd()` y la config se resuelve con `raizDelRepo`, asi que un
proyecto en `proj/` de un repo mayor es un caso soportado. `rutasDeTarea` pasa `'.'` como pathspec
positivo de `fueraDeDocs`: limita el resultado al subarbol del cwd y los `:(exclude,glob)` pasan a
ser relativos al cwd, no a la raiz. `todas` si es de todo el repo, y `decidirVerificacion` solo mira
`fueraDeDocs`.

Repro end-to-end con `runFinishCommand` y los scripts reales: config en la raiz con
`comando_verificacion`, `rutas_documentacion: [docs/**, trabajo-*.txt]` y comando de documentacion;
proyecto en `proj/`; la rama cambia `other/code.ts` («BROKEN»). `finish` desde `proj/` integra con
completa = 0 y docs = 1, y el merge incluye `other/code.ts`. Control con el proyecto en la raiz:
completa = 1. `rutasDeTarea('develop','HEAD',…, cwd=proj)` da
`todas:["other/code.ts","proj/docs/a.md"], fueraDeDocs:[]`. En la 0.14.0 esa tarea corria la
completa: es una via nueva para integrar codigo sin verificar.

Correccion: pathspec de raiz (`:(top)` y `:(top,exclude,glob)`) o git desde la raiz; test con
proyecto en subdirectorio.

### MEN-1 — Anotacion commiteada antes de la comprobacion de documentacion

Valido (el memo casa con el commit integrado y el rastro viaja con el merge), pero con la
comprobacion en rojo y un reintento quedan dos commits `cierre solo documentacion` y dos lineas
iguales; la primera dice «se ejecuta» de una comprobacion que fallo, y si luego la tarea pasa por
la completa la seccion sigue ahi. Sugerencia: anotar tras el verde o no duplicar en un reintento.

### MEN-2 — La documentacion sobreafirma «Las mayusculas cuentan»

Con `core.ignorecase=true` (por defecto en Windows y macOS) y `rutas_documentacion: [docs/**]`, un
cambio en `Docs/evil.js` sale como documentacion: el prefijo literal del pathspec se compara sin
distinguir mayusculas; solo los comodines las distinguen. Riesgo bajo (esos sistemas ya funden las
carpetas), pero la frase «Docs/ no es docs/» de README y guia es falsa: depende de `core.ignorecase`.

### MEN-3 — `tareas/**` siempre es documentacion

Razonable y documentado; los held-out los sigue corriendo su puerta. Pero `tareas/helper.js` sin
nada fuera integra sin la completa; un proyecto cuyos tests lean algo de `tareas/` no lo vera.
Alternativa mas estricta: solo `tareas/**/*.md` y similares.

### MEN-4 — Patrones comodin totales aceptados

`rutas_documentacion: ['*']` o `['**']` son validos y vuelven documentacion cualquier cambio.
Rechazar `*`, `**` y `**/*` cuesta poco.

### MEN-5 — Clave nueva mal formada desactiva el guardian de merges

`rutas_documentacion: docs` es ahora ConfigError (antes, clave desconocida ignorada);
`guardia-merge.ts:88-92` captura el error y hace `continue`: el guardian queda desactivado para ese
proyecto. `finish` falla en voz alta. Era riesgo previsto para A2 (TASK-101); dejarlo escrito alli.

## Reproduccion y verificacion empirica

Probado con `rutasDeTarea`, `decidirVerificacion` y `runFinishCommand` en repos reales, todo
correcto: borrado de codigo, renombre `src/x.ts`→`docs/x.md`, cambio solo de modo, merge de develop
en la rama, rama atrasada, hotfix con base main (docs, codigo, main sin rutas), release solo con
CHANGELOG (completa), config de la base frente a la de la rama, cambio en `.taskcode/config.yml`
(tambien un comentario) y otros ficheros de `.taskcode/`, tildes y espacios, diff vacio, base
inexistente, worktree sucio (aborta antes), sin `rutas_documentacion` (como en 0.14.0), puerta de
cobertura (omitida con aviso).

Mutantes sobre `dist`: sin `-z` (muerto), sin la comprobacion de config (2 rojos), sin la de diff
vacio (1), contra HEAD en vez de la base (8), sin excluir `tareas/**` (5); sin `--no-renames`
sobrevive pero es equivalente (el pathspec de exclusion ya impide emparejar el renombre en
`fueraDeDocs`). `finish-documentacion`, `verificacion-proporcional` y `finish-verificacion`: 23/23.

## Lecturas fuera del contexto permitido

- `src/fs/config-de-ref.ts`, `src/commands/finish-heldout.ts`, `src/hooks/guardia-merge.ts:60-130`,
  `src/core/config.ts` (`raizDelRepo`, `validarPatronesExclusion`), `test/helpers/finish-fixtures.ts`
  y `test/helpers/repo-plantilla.ts`: reproducir IMP-1 y la interaccion con el guardian.
