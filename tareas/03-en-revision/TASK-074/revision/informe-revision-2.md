# Informe de revision — TASK-074 (ronda 2)

- Commit revisado: 58334406a41a2ddae4fdec6dd8bb8fd781ad52de
- Revisor: code-quality-reviewer (agente general-purpose, modelo opus, independiente; no implemento la tarea)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-5 | IMPORTANTE | abierto | src/core/cobertura-cambios.ts:73-83 (cruzarCobertura, rama `fueraDelInforme`) | plan |
| MEN-5 | MENOR | abierto | src/commands/review.ts:519-524 (coberturaPorRevisor) | implementacion |
| MEN-6 | MENOR | abierto | test/core/cobertura.test.ts (extension, formatearPorcentaje) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Rutas relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

## Reproducción

**Puerta.** Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-074-r2`, `npm install` y
`npm run build` sin errores; `node --test` sobre `cobertura-cambios`, `core/cobertura`, `finish-*` y
`review*`: 208/208. Suite completa no repetida (ya pasada en este commit, 1832/1835).

### IMP-5 (plan) — La regla «extensión medida» cuenta como sin cubrir ficheros que el medidor nunca lista
El código cumple la decisión (d) al pie de la letra, pero la heurística no distingue «ningún test lo
carga» de «la herramienta no lo lista nunca». Con lcov reales de `node --test` en repos temporales:
1. **Tests excluidos del informe** (lo que hacen por defecto c8, istanbul y jest; en Node,
   `--test-coverage-exclude='test/**'`): la rama solo añade `test/b.test.mjs`, que se ejecuta; el
   informe solo tiene `SF:src\a.mjs`. `coberturaDeRama` da «Cubiertas 0 de 6 (0 %)» con
   `` `test/b.test.mjs`: 1-6 (el informe no lo lista: ningun test lo carga) `` y `cumpleUmbral(80)`
   false. Una tarea que solo añade tests queda bloqueada, con un mensaje falso.
2. **Un `.ts` solo de tipos** (`export interface`, importado con `import type`): 7/7 ejecutables
   cubiertas, pero `src/tipos.ts` suma 4 sin cubrir: 63,6 % y no pasa 80. Igual con `.d.ts`.

Opciones para la persona: contar `fueraDelInforme` solo si alguna carpeta antecesora del fichero
contiene un fichero medido; excluir `*.d.ts`; o avisar en vez de contar. Como mínimo, el texto
«ningun test lo carga» no debe afirmar lo que no se sabe.

### MEN-5 — La corrección de MEN-4 no tiene test que la discrimine, y queda un hueco
Con el mutante que vuelve a `new Set(escritura.ficheros)` fallan 0 de 37 tests: el test nuevo es de
ronda 1, donde delta y merge base coinciden. Hueco: los grupos salen del plan del delta; si la ronda
2 toca `java/X.java` y `web/C.vue`, no hay grupo code-quality y una línea sin cubrir de `src/a.mjs`
de la ronda 1 no sale en ninguna petición. Propuesta: test de ronda 2 incremental y fragmentada, y
una sección con lo que quede fuera de todos los grupos.

### MEN-6 — Dos detalles sin test que los discrimine
`extension()` sin `toLowerCase`: 0 fallos (falta un caso `.MJS`). `formatearPorcentaje` sin el
`+1e-9`: 0 fallos; el caso `29/100` no reproduce el error de coma flotante (recorrido c/e con
e ≤ 3000 sin cambio): o el épsilon sobra o falta otro caso.

## Verificación de los hallazgos de la ronda 1

- **IMP-1: corregido.** Un `.mjs` nuevo sin test sale entero sin cubrir; una tarea de solo docs
  cierra. Mutantes «medidas siempre true» → 5 rojos; «siempre false» → 3. Efectos colaterales en IMP-5.
- **IMP-2: corregido** según (d) precisada.
- **IMP-3: corregido.** `pkg/coverage/lcov.info` con `SF:src\a.mjs` → `pkg/src/a.mjs` (test con lcov
  real). Mutantes «solo raíz y dirInforme» y «sin subir a padres» → 1 rojo cada uno. `SF:` absoluto
  en MAYÚSCULAS en Windows se resuelve bien por realpath. Las bases no salen del repo. Ambigüedad
  aceptada (no hallazgo): si `src/x.mjs` existe en la raíz y en `pkg/`, un informe en `pkg/coverage/`
  resuelve a `pkg/` (el mutante «raíz primero» sigue vivo).
- **IMP-4: corregido.** Cada protección tiene test: hotfix→`ramaIntegracion`, `sin-comando`→`return`,
  sin `--first-parent`, sin `--no-merges`, sin `--no-ext-diff`, review sin filtrar por dominio: 1
  rojo cada uno.
- **MEN-1: corregido.** `++ b/x`, `--- a/x`, `+++ b/x`, `@@ …` y `diff --git …` como contenido dan
  `[2,3,4,6,7]`. Rutas con espacio y ñ, borrados y binarios bien. Mutantes «`+++` en cualquier
  sitio» 1, «blancos cuentan» 1, «`siguiente` no avanza» 8.
- **MEN-2: corregido.** 1820/2001 → 90.9; 99.99 → 99.9. Mutante `Math.round` → 1 rojo.
- **MEN-3: corregido.** El mutante `actual.set(n, veces)` pone rojo el test.
- **MEN-4: parcialmente corregido.** Ver MEN-5.

Carpeta `task-074-r2` borrada (sin commits propios); sin procesos en segundo plano; el repo original
no se ha tocado.
