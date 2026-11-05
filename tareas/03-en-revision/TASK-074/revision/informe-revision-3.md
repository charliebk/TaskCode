# Informe de revision — TASK-074 (ronda 3)

- Commit revisado: 6754a735030faec9bea95940a5be316d13316381
- Revisor: code-quality-reviewer (agente general-purpose, modelo opus, independiente; no implemento la tarea)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-6 | IMPORTANTE | abierto | src/core/cobertura-cambios.ts:78-96 (cruzarCobertura, `carpetasMedidas` / `esCodigoMedido`) | plan |
| MEN-7 | MENOR | abierto | test/core/cobertura.test.ts (caso IMP-5: `DECLARACIONES_RE`, `clave` en `carpetasMedidas`) | implementacion |
| MEN-8 | MENOR | abierto | test/commands/cobertura-cambios.test.ts (test MEN-5) / src/commands/review.ts:528-531 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Rutas relativas a `taskcode-marketplace/plugins/taskcode-plugin/`. El clon estaba en `c1471f1`, que
solo añade la peticion de la ronda 3 sobre el commit revisado.

## Reproducción

**Puerta.** Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-074-r3`, `npm install` y
`npm run build` sin errores; `node --test` (sin `NODE_TEST_CONTEXT`) sobre `cobertura-cambios`,
`core/cobertura`, `finish-*` y `review*`: 211/211. Suite completa no repetida (ya pasada en este
commit, 1835/1838).

### IMP-6 (plan) — En un proyecto en subcarpeta, los tests excluidos vuelven a frenar
La regla de (d) solo descuenta la raíz del repo. En un proyecto en `pkg/` (el layout que IMP-3 da por
soportado, y el de este repo), `pkg` siempre «tiene un fichero medido», así que cualquier fichero
nuevo de `pkg/` con extensión medida cuenta entero sin cubrir. Con lcov real y `coberturaDeRama`:
repo con `pkg/src/a.mjs` y `pkg/test/a.test.mjs` en `develop`; la rama solo añade
`pkg/test/b.test.mjs`; en `pkg/`, `node --test --experimental-test-coverage --test-coverage-exclude=test/** ...`
da un informe con solo `SF:src\a.mjs`. `coberturaDeRama(repo, 'develop', 'pkg/coverage/lcov.info', [])`
da «Cubiertas 0 de 3 (0 %)» con `` `pkg/test/b.test.mjs`: 1-3 (... cuenta entero) `` y
`cumpleUmbral(80)` false. Igual con el cruce puro para `pkg/scripts/gen.mjs` y para
`packages/b/src/x.mjs` midiendo solo `packages/a/...`. El código cumple la letra de (d).
Opciones: tratar como raíz también la carpeta contra la que se resolvieron las `SF:` relativas (y sus
padres); exigir un fichero medido directamente en la carpeta; o aceptarlo y documentarlo.

### MEN-7 — Dos partes de la corrección de IMP-5 sin test que las discrimine
Mutantes sobre `dist/src/core/cobertura-cambios.js` con `core/cobertura.test.js`: carpetas ignoradas,
raíz siempre false/true, sin `DECLARACIONES_RE`, solo la carpeta propia, `extension()` sin
`toLowerCase`, `Math.round`: 1 rojo cada uno. Vivos (0 rojos): `DECLARACIONES_RE` sin `[cm]?`, sin la
bandera `i`, y `carpetasMedidas.add(c)` sin `clave` (tampoco en los 22 de `cobertura-cambios`). El caso
`src/Tipos.D.MTS` no discrimina (el informe de prueba no mide `.mts`); falta un informe que mida
`.mts`/`.cts`. Para `clave`: con `clave` en minúsculas, informe `App/a.mjs` y fichero `App/n.mjs`.

### MEN-8 — La fusión de MEN-5 en un mismo destino no está protegida
El mutante que deshace MEN-5 pone rojo el test (1 de 22). El mutante `const set = new Set()`
(sustituir en vez de fusionar) deja 0 rojos: por lectura, la primera petición perdería sus propios
ficheros o los huérfanos según el orden de grupos (no comprobado leyendo la petición). Falta aseverar
que la petición que recibe `src/a.mjs` conserva también lo suyo.

## Verificación de los hallazgos de la ronda 2

- **IMP-5: corregido en el layout de raíz; abierto en subcarpeta (IMP-6).** `test/b.test.mjs` sin
  nada medido no cuenta; `src/sub/deep/n.mjs` cuenta; `lib/x.mjs` (hermana sin medir) no; `.d.ts`,
  `.d.mts`, `.d.cts` y `.D.TS` no cuentan y `src/d.ts` sí; `SRC/Sub/N.mjs` y `Src/A.MJS` casan con
  `claveRuta`. El test de extremo a extremo con `--test-coverage-exclude` pasa. El mensaje ya no afirma
  «ningun test lo carga». README y cabecera coinciden con (d).
- **MEN-5: corregido.** El mutante que lo deshace pone rojo el test. Queda MEN-8.
- **MEN-6: corregido.** `extension()` sin `toLowerCase` → 1 rojo. Quitar el `+1e-9` es correcto:
  `Math.floor(p*10)` coincide con `floor(1000c/e)` para todo c/e con e ≤ 4000. El caso 999/1000 →
  «99.9» discrimina frente a `Math.round`.

Mutantes revertidos (comprobado con `cmp`); clon sin commits propios; carpeta `task-074-r3` borrada;
sin procesos en segundo plano; el repo original no se ha tocado.
