# Brainstorm — TASK-095, rol testing (ronda 1)

- Rol: `brainstorm-testing`
- Agente: taskcode-plugin:brainstorm-testing

Referencias relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

## Que es observable sin llamar a ningun agente

- Todos los criterios se comprueban desde fuera sin lanzar agentes: la salida de `runReviewCommand` (`alcance`, `motivoAlcance`, `desde`, `informes[].revisor/ficheros/peticionPath`), el texto de `peticion-revision-N[-revisor].md` (línea `- Alcance:`, instrucciones, tabla de abiertos, `git log desde..HEAD`), y `siguienteFase(...).accion` y, por spawn, `taskctl siguiente`. Hace falta un repo Git temporal real con informes escritos a mano y `taskctl veredicto`, como el harness `conRonda1` de `test/commands/review-alcance.test.ts:69`.
- No es observable si el revisor obedece «solo abre un hallazgo nuevo si es CRÍTICO o lo introduce la corrección»: la prueba llega hasta el texto de la petición. La convergencia real depende del agente; que lo diga el `Resultado`.

## Plan de pruebas, cada una con su mutacion

1. **R2 acotada con IMPORTANTE abierto, con IMPORTANTE corregido y con CRÍTICO abierto o aceptado**: `alcance==='acotada'`, la línea `- Alcance: verificacion acotada…` y `desde===r1.commitRevisado` (misma tabla de filas que `review-alcance.test.ts:165`). Mutación: restaurar `if (h.severidadReconocida !== 'MENOR') return completa(...)` en `informe-revision.ts:368`.
2. **Merge de develop entre rondas**: sigue acotada y el diff de la petición contiene el fichero que entra por el merge. Mutación: reponer la rama `hayMergesEntre` de `review.ts:624`. Contraprueba: quitar el fichero del diff.
3. **Texto de la petición de R2**: la orden de verificar cada abierto y el diff de la corrección, y la frase «solo nuevo si CRÍTICO o introducido por la corrección», aseverada exacta. Mutación: borrar esa frase de `instruccionesAcotadas` (`review.ts:294`).
4. **Revisor de dominio**: R1 con `src/lib.rs` (rust-wasm-reviewer) más un fichero sin dominio, informe `IMP-1` abierto en el `.rs`. En R2 existe `peticion-revision-2-rust-wasm-reviewer.md` con `IMP-1`, y la del genérico no lista `IMP-1`. Mutación: volver al plan fijo `{revisor: generico}` de `review.ts:679-680`.
5. **Convergencia (caso TASK-008 de OpenDockTrading)**: R1 deja `IMP-46 abierto`; se corrige; el informe de R2 relista `IMP-46 | IMPORTANTE | corregido` más un MENOR abierto; se corrige; R3 acotada con `desde===r2.commitRevisado` (no `develop`). R3 aprobada → `siguiente` da finish; R3 con cambios → `preguntar`. Mutaciones: la regla antigua (falla en R3 con «tiene un IMPORTANTE (IMP-46, corregido)») y reponer `review.ts:635-639`.
6. **Tope de rondas**: integración por spawn tipo `automatico-rondas.test.ts:42`, en los tres modos: R3 con cambios → `accion==='preguntar'`. Mutación: `flujo.ts:100` o `flujo.ts:105`.
7. **`--completa`** (regresión): con un IMPORTANTE abierto, R2 completa, `desde===develop` y fragmentada por dominio. Mutación: ignorar `completaPedida` en `review.ts:621`. El test actual (línea 186) solo lo prueba con MENORES.

## Aserciones trampa que hay que evitar en esta tarea concreta

- `assert.ok(p.includes('acotada'))`: pasa también con «completa (motivo: …acotada…)». Aseverar que la línea `- Alcance:` empieza por `verificacion acotada`.
- Aseverar `r.alcance==='acotada'` sin `desde`: el fallo real de TASK-008 era el diff desde la base.
- Comprobar el revisor de dominio solo por el número de peticiones: aseverar el nombre del fichero y que `IMP-1` no aparece en la petición del genérico.
- En el test de merge, aseverar solo «acotada»: pasa aunque el código del merge desaparezca del diff.
- Probar el tope solo con `siguienteFase` unitario (`test/core/siguiente.test.ts:93`): el criterio pide integración.

## Que pruebas existentes cambian de expectativa

Solo `test/commands/review-alcance.test.ts` fija la regla (grep de `alcanceRondaSiguiente`, `verificacion acotada`, `tiene un`, `TASK-083`).
- `:165` (IMPORTANTE abierto/corregido/CRÍTICO aceptado → completa): pasa a acotada; es la regla que el criterio deroga. Sustituto: prueba 1.
- `:211` (merge → completa): pasa a acotada.
- `:238` (acotada con IMPORTANTE → R3 completa desde la base): sustituto, prueba 5.
- `:177`, `:194`, `:202` (otro fragmento / fichero no nombrado / cinco nombrados): cambian o se borran solo si se retira `ficherosNombrados`; necesitan sustituto explícito.
- `:268`: «IMPORTANTE corregido» y «un fragmento con CRÍTICO» pasan a `acotada: true`. Los fail-closed (sin tabla, plantilla, severidad rara): **abierto**.
- `:137` y `veredicto.ts:184-188`: el aviso «solo tiene MENORES… podrá ser acotada» se vuelve falso.
- `test/core/siguiente.test.ts:93`: `['detener','detener','preguntar']` pasa a `['preguntar','preguntar','preguntar']`. **Choca con una decisión anterior** (`flujo.ts:101-105`, IMP-3 de TASK-058 e IMP-2 de TASK-059: «fuera del automático se detiene SIEMPRE»); el `Resultado` tiene que justificar el cambio.
- En riesgo, sin confirmar: `review-modelo.test.ts:122-147` (cuenta de peticiones `=== 2`) y `review-incremental.test.ts:139-153` (MENOR abierto de java-spring-reviewer).
- Siguen de red: `review-incremental.test.ts:117` (y `:130`, «un corregido no se lista»), `:187` (commit no antepasado → diff desde develop), `review-dominios.test.ts` y `automatico-rondas.test.ts:42`.

## Como envejece

- La regla queda repartida entre `informe-revision.ts`, `review.ts:611-640` y `flujo.ts`. Si no se borra la recalificación de `review.ts`, habrá dos fuentes de verdad y los tests probarán la que no manda.
- Las instrucciones se aseveran por frase literal: que la frase viva en una constante exportada que el test importe, más una sola aserción literal del sentido.
- La prueba 4 debe parametrizarse por catálogo para cubrir dominios nuevos.

Mientras se itera (la suite completa son ~25 min):

`npm run build && node --test dist/test/commands/review-alcance.test.js dist/test/commands/review-incremental.test.js dist/test/commands/review-modelo.test.js dist/test/commands/review-dominios.test.js dist/test/commands/veredicto.test.js dist/test/core/siguiente.test.js dist/test/commands/siguiente.test.js dist/test/commands/automatico-rondas.test.js`

Después, `dist/test/skills/*.test.js` al tocar skills y README; `npm test` solo para cerrar.

Sin verificar: los informes reales de TASK-008 de OpenDockTrading (el fixture sale del inventario), el patrón que activa `rust-wasm-reviewer` en el catálogo, `test/commands/siguiente.test.ts` y el resto de `automatico-*`.
