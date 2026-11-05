# Informe de revision — TASK-074 (ronda 4)

- Commit revisado: 1ede0f62cf905085dc3c8076599fab692db8a398
- Revisor: code-quality-reviewer (agente general-purpose, modelo opus, independiente; no implemento la tarea)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-9 | MENOR | abierto | test/core/cobertura.test.ts (caso IMP-6: `padre()` y `clave` en `descontadas`) / src/core/cobertura-cambios.ts:71-74, 92-96 | implementacion |
| MEN-10 | MENOR | abierto | test/commands/cobertura-cambios.test.ts / src/fs/cobertura.ts (`resolverSfConBase`, rama absoluta) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Rutas relativas a `taskcode-marketplace/plugins/taskcode-plugin/`. El clon estaba en `b76c2a8`, que
solo añade la peticion de la ronda 4 sobre el commit revisado.

## Reproducción

**Puerta.** Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-074-r4`, `npm install` y
`npm run build` sin errores; `node --test` (sin `NODE_TEST_CONTEXT`) sobre `commands/cobertura-cambios`,
`core/cobertura`, `commands/finish-*` y `commands/review*`: 214/214. Suite completa no repetida (ya
pasada en este commit, 1838/1841 con los 3 rojos conocidos de Windows).

**Mutantes** (sobre `dist/`, con un script que exige exactamente una coincidencia antes de sustituir y
comprueba la restauración; `core/cobertura` + `commands/cobertura-cambios`, 37 tests):

| Mutante | Rojos |
|---|---|
| sin `descontadas.add(clave(r))` | 2 |
| sin descontar los padres de la raíz | 1 |
| `efectivas` = `carpetas(ruta)` sin filtrar | 2 |
| sin `raicesMedidas.add(...)` | 7 |
| raíz sin carpetas efectivas → `true` / → `false` | 2 / 2 |
| `raices.add(r.base)` eliminado | 2 |
| `base: relativaAlRepo(...) ?? ''` → `base: ''` | 2 |
| `raices: []` | 2 |
| fusión de review.ts → `new Set()` | 1 |
| **`padre()` → `return ''`** | **0** |
| **`descontadas.add(clave(r))` → `add(r)` / `has(clave(c))` → `has(c)`** | **0 / 0** |
| **rama absoluta `base: null` → `base: 'x'`** | **0** |
| `raices` sin `.sort()` / añadir también `base === ''` | 0 / 0 (equivalentes: no son hallazgo) |

### MEN-9 — Dos piezas de la corrección de IMP-6 sin test que las discrimine
El código es correcto pero nada lo protege:
- `cruzarCobertura({x.mjs, pkg/y.mjs}, {pkg/index.mjs, pkg/src/a.mjs}, id, ['pkg'])` cuenta `pkg/y.mjs`
  y deja `x.mjs` sin instrumentar (correcto). Con `padre() → ''`, `x.mjs` contaría entero; el caso
  `conDirecto` no lo ve porque pregunta por la misma raíz que tiene el fichero medido.
- `cruzarCobertura({Pkg/test/b.test.mjs}, {Pkg/src/a.mjs}, r => r.toLowerCase(), ['PKG'])` → sin
  instrumentar (correcto). Sin `clave` en `descontadas`, `pkg` no se descontaría.
Remedio: añadir esos dos casos al test `cruce (IMP-6 de la ronda 3)`.

### MEN-10 — «Con `SF:` absolutas rige la raíz del repo» no está aseverado
El mutante que da a la rama absoluta una `base` no nula deja 0 rojos: ningún test lee `raices` con un
informe de `SF:` absolutas. Remedio: aseverar `l.raices` = `[]` en un test con `SF:` absolutas.

## Verificación de los hallazgos de la ronda 3

- **IMP-6: corregido.** `leerInformeCobertura` devuelve `raices: ['pkg']` en el layout de IMP-3 y
  `cruzarCobertura` descuenta esa raíz y sus padres. El test de extremo a extremo (lcov real con
  `--test-coverage-exclude=test/**` en `pkg/`) cuenta `pkg/src/nuevo.mjs` y deja `pkg/test/b.test.mjs`
  sin instrumentar. En el monorepo, `packages/b/src/x.mjs` midiendo solo `packages/a/...` ya no cuenta.
  README y cabecera coinciden con la última versión de (d).
- **MEN-7: corregido.** Informe que mide `.mts`/`.cts` con `src/t.d.mts` y `src/T.D.CTS`, y clave en
  minúsculas con `App/`: los mutantes vivos en la ronda 3 (sin `[cm]?`, sin `i`, `carpetasMedidas` sin
  `clave`) ya dan rojo.
- **MEN-8: corregido.** El mutante `new Set()` pone rojo `review (MEN-5)`; la aserción condicional cubre
  los dos órdenes de los grupos.

Mutantes revertidos (`git diff` vacío sobre `dist/`); clon sin commits propios (solo `package-lock.json`
modificado por `npm install`); carpeta `task-074-r4` y script de mutantes borrados; sin procesos en
segundo plano; el repo original no se ha tocado.
