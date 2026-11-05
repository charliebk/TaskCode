# Informe de revision — TASK-074 (ronda 1)

- Commit revisado: e4a171d0fb4d6059d2b365cf0e7947a37fcd7f07
- Revisor: code-quality-reviewer (agente general-purpose, modelo opus, independiente; no implemento la tarea)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/commands/finish-cobertura.ts:104 | implementacion |
| IMP-2 | IMPORTANTE | abierto | src/core/cobertura-cambios.ts:63 | plan |
| IMP-3 | IMPORTANTE | abierto | src/fs/cobertura.ts:48 (resolverSf) | implementacion |
| IMP-4 | IMPORTANTE | abierto | finish.ts:462, finish-cobertura.ts:82, git.ts:416, review.ts:598, git.ts (lineasAnadidas) | implementacion |
| MEN-1 | MENOR | abierto | src/fs/git.ts (lineasAnadidas, `+++ `) | implementacion |
| MEN-2 | MENOR | abierto | src/core/cobertura-cambios.ts (formatearPorcentaje / mensaje de finish) | implementacion |
| MEN-3 | MENOR | abierto | test/core/cobertura.test.ts:58 | implementacion |
| MEN-4 | MENOR | abierto | src/commands/review.ts:598 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Rutas relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

## Reproducción

**Puerta determinista.** Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-074-r1`, `npm install`.
`npm run lint` (`tsc --noEmit`) sin errores. `npm test` una vez: 1825 tests, 1822 pasan, 3 fallan
(los conocidos de Windows: symlink EPERM en `approve` #114, chmod de directorio en `plan` #681, CRLF
en `plan` #687). Ningún otro fallo.

### IMP-1 — La regla (b) «ningún fichero cambiado casa con el lcov» no está implementada
`finish-cobertura.ts:104` comprueba que alguna ruta del informe sea un fichero versionado, y el
informe de la base siempre la tiene. Una rama cuyos ficheros cambiados no están en el lcov da
`ejecutables = 0` y `cumpleUmbral` devuelve true. Reproducción: repo real con `finish-fixtures`; la
base tiene `src/a.mjs` y su test cubiertos, `umbral_cobertura: 100`; la rama añade `src/nuevo.mjs` (6
líneas con un `if`) que ningún test importa. `runFinishCommand(['TASK-970'])` da `cierre: 'terminada'`.
El lcov real de Node no lista `src/nuevo.mjs`. Impacto: el freno deja pasar justo el código nuevo sin
test. Aplicada al pie de la letra, (b) bloquearía también una tarea de solo docs: la persona debe
precisarla (p. ej. solo ficheros con una extensión que el informe instrumenta).

### IMP-2 (plan) — Un fichero nuevo que ningún test carga queda «sin instrumentar» y no cuenta
`node --test` y c8 sin `--all` solo listan lo cargado: un `.mjs`/`.ts` nuevo sin test va a
`sinInstrumentar` como un `.md`. Si la rama toca además un fichero medido, el porcentaje sale solo de
ese y puede ser 100 %. El código cumple la decisión (d): el hueco es del plan. Opciones: contar como
no cubiertas las líneas de los ficheros cambiados con extensión instrumentada en otros, o exigir
`--all`/`include`; como mínimo avisar en `finish`.

### IMP-3 — Proyecto en subcarpeta con el lcov en `pkg/coverage/lcov.info`
`resolverSf` prueba la raíz del repo y la carpeta del informe, nunca `pkg/` (el cwd de los tests).
Reproducción: `pkg/src/a.mjs`, `pkg/test/a.test.mjs`, `node --test ... --test-reporter-destination=coverage/lcov.info`
dentro de `pkg/`; `leerInformeCobertura(repo, 'pkg/coverage/lcov.info', [])` da
`['src/a.mjs','test/a.test.mjs']` en vez de `['pkg/src/a.mjs','pkg/test/a.test.mjs']`. Con umbral,
`finish` aborta con un diagnóstico falso («¿mide el código compilado…?»). Falla cerrado. Sugerencia:
probar los directorios padre del informe hasta la raíz, y mencionar la causa en el mensaje.

### IMP-4 — Protecciones sin test que se ponga rojo al quitarlas
Compilados con `tsc --outDir dist-rev`, contra `cobertura-cambios.test.js` (y `review*.test.js`):
- `finish.ts:462`, `ramaBase` siempre `ramaIntegracion` (hotfix contra develop): 0 fallos.
- `finish-cobertura.ts:82`, `throw` de `sin-comando` → `return {tipo:'sin-umbral'}`: 0 fallos.
- `git.ts:416`, sin `--no-merges` en `instanteUltimoCommitPropio`: 0 fallos.
- `review.ts:598`, sin filtrar por `escritura.ficheros` en la petición fragmentada: 0 fallos.
- `git.ts`, sin `--no-ext-diff`: 0 fallos.
- Muertos: sin `-M` (1), `truncado: false` (2), `>=` → `>` (2), `veces > 0` → `>= 0` (6), sin
  ejecutables → `false` (1).

### MEN-1 — Una línea añadida que empieza por `++ ` se toma por cabecera `+++`
Fichero de 20 líneas; la rama añade `++ b/otro` en la 3 y otra en la 16: `lineasAnadidas` da
`[['x.txt',[3]],['otro',[16]]]` en vez de `[['x.txt',[3,16]]]`. Aceptar `+++ ` solo tras `--- ` en
la cabecera.

### MEN-2 — «(91 %) no llega al umbral (91 %)»
Con 1820 de 2001, `cumpleUmbral(c, 91)` es false y el mensaje imprime 91 %. Redondear hacia abajo o
más decimales cuando el redondeo iguale el umbral.

### MEN-3 — El test «SF repetido suma» no distingue sumar de sobrescribir
El mutante `actual.set(n, veces)` deja 0 fallos con el orden 0 → 5. Invertir el orden (5 → 0).

### MEN-4 — Ronda incremental fragmentada: la sección solo muestra ficheros del delta
`review.ts:598` filtra por `escritura.ficheros` (de `desde..HEAD`); una línea sin cubrir de la ronda 1
desaparece si su fichero no cambió en la 2 (sin fragmentar sí sigue). Verificado leyendo el código.

### Probado sin fallo
SF relativo con `\` de Node (lcov real); rutas absolutas de otra máquina ignoradas (`validos = 0` →
no cierra); rutas con espacios; rename sin cambios sin líneas (también con `diff.renames=false`,
`diff.noprefix=true`); informe no regenerado rechazado por mtime; `--sin-verificacion` salta y avisa;
umbral rebajado en la rama sin efecto; lcov vacío no cierra (mensaje engañoso como IMP-3).

Carpetas temporales borradas (`task-074-r1`, `task-074-r1-exp`); el repo original sigue limpio.
