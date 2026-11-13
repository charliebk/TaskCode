# Informe de revision — TASK-115 (ronda 1)

- Commit revisado: 1bd21284d4e6662a1aee15eaf266b27dee0fb24a
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/commands/finish-verificacion.ts:240 (`o.permitirSelectiva === true` de la condicion del lote) | implementacion |
| MEN-1 | MENOR | corregido | src/core/transiciones.ts:anotarPendienteLote (usa `anotarLineaEnSeccion`, no `anotarLineaUnica`) | implementacion |
| MEN-2 | MENOR | corregido | src/core/transiciones.ts:pendienteDeLote | implementacion |
| MEN-3 | MENOR | corregido | src/commands/verificar-lote.ts:376 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### IMP-1 — la exclusion de release y hotfix del lote no la protege ningun test

La condicion `o.ramaBase !== undefined && o.permitirSelectiva === true && porLoteEnBase(...)` es lo que
deja a un hotfix (va a la principal) con la completa de siempre; un release ya queda fuera porque no
recibe `ramaBase`. El plan y la documentacion lo prometen («los release y hotfix verifican como siempre»),
pero `verificar-lote.test.ts` solo ejercita una feature.

Reproduccion (mutante sobre `dist/`): quitar `o.permitirSelectiva === true &&` de esa condicion deja
`verificar-lote.test.js` en 6 de 6 en verde. El mutante se comprobo aplicado (`grep` sobre el js: la linea
queda `if (o.ramaBase !== undefined && porLoteEnBase(o, o.ramaBase))`). Con esa regresion, un hotfix cuya
rama principal tenga `verificacion_por_lote: true` integraria en la principal sin ninguna completa. Falta un
test de hotfix (y uno de release) con la clave en la base que compruebe que corre la completa y que no
anota «pendiente de lote».

### MEN-1 — un reintento de finish duplica la linea «pendiente de lote»

Si `finish` aborta despues de anotar y commitear (puertas de cobertura o held-out, fallo del script) y se
relanza, `anotarPendienteLote` anade otra linea. Reproducido llamando dos veces a `anotarPendienteLote`: la
seccion queda con dos lineas identicas salvo el instante. No rompe nada (manda la ultima) y es el mismo
comportamiento que ya tiene `anotarVerificacionOmitida`; otras anotaciones de `finish` usan
`anotarLineaUnica` para evitarlo. Coherencia, no fallo.

### MEN-2 — `pendienteDeLote` no usa las mismas reglas de seccion que `anotarLineaEnSeccion`

`pendienteDeLote` busca la primera linea `## Verificacion por lote` y no respeta bloques de codigo ni la
cabecera `# `, mientras que `anotarLineaEnSeccion` usa `rangoDeSeccion`. Reproducido: un cuerpo con la
seccion dentro de un bloque ``` con «pendiente de lote» y, despues, la seccion real con «lote en verde»
devuelve `pendienteDeLote === true`. Ademas, una linea `- nota manual` anadida a mano tras la pendiente
hace que `pendienteDeLote` sea `false` y la tarea nunca se verifique por lote. Casos poco probables
(la seccion la escribe el propio taskctl); basta reutilizar `rangoDeSeccion` y mirar solo las lineas
con la marca de taskctl.

### MEN-3 — `verificar-lote` no pasa el contador de progreso al comando

`finish`, `review` y el freno pasan `entornoConContador(...)` (TASKCTL_PROGRESO) para el x/N visible en la
terminal; `verificar-lote` llama a `ejecutarVerificacion` sin `env` (`grep -c` de `TASKCTL_PROGRESO`,
`entornoConContador` y `crearProgreso` sobre `dist/src/commands/verificar-lote.js`: 0 coincidencias). Es
justo la corrida mas larga (la completa) y se queda sin progreso, contra la regla de que todas las fases lo
muestren.

## Verificacion hecha

- Clon limpio, rama de la tarea, `npm install` y `npm run build` sin errores.
- Tests afectados: `node --test dist/test/commands/verificar-lote.test.js dist/test/commands/finish-verificacion.test.js dist/test/commands/finish-parcial.test.js dist/test/commands/finish-documentacion.test.js dist/test/cli/*.test.js`: 82 pasan, 0 fallan. Suite completa no ejecutada (no la pide la ronda); se cita la selectiva de la peticion (919 pasan, mismo commit verificado que el revisado).
- Mutantes sobre `dist/` y `verificar-lote.test.js`:
  - leer `verificacion_por_lote` del arbol en vez de la base: muerto (5 pasan, 1 falla);
  - aplicar el lote tambien a hotfix: **sobrevive** (6 de 6 en verde, IMP-1);
  - anotar en verde aunque la completa salga roja: muerto (1 falla);
  - no listar las tareas en el mensaje de rojo: muerto (1 falla);
  - contar como pendiente una tarea ya resuelta (cualquier linea pendiente en vez de la ultima): muerto (1 falla).
- Casos buscados que no rompen el diseno: el reintento tras merge hecho pasa por `puertaReintento`, que corre la completa (conservador, no se salta nada); un release no recibe `ramaBase`; la config invalida de la base devuelve `false` y corre la completa; el rojo no commitea ni anota. `finish --merge-request` con la clave: el codigo pasa por la misma `puerta()` y anota antes de abrir el MR, pero ningun test lo cubre (no verificado empiricamente: harian falta el doble de `gh`/`glab` y un MR integrado).

## Reproduccion

- IMP-1: en el clon, `sed` sobre `dist/src/commands/finish-verificacion.js` quitando `o.permitirSelectiva === true &&` y `node --test dist/test/commands/verificar-lote.test.js` da `pass 6 / fail 0`.
- MEN-1 y MEN-2: `node -e` importando `dist/src/core/transiciones.js` con las llamadas descritas.
- MEN-3: `grep -c` indicado, resultado 0.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts` (lineas 520-700): para ver con que `ramaBase` y `permitirSelectiva` llama a la puerta y como entra el camino de reintento y el de merge request.
- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/config-de-ref.ts` y `src/hooks/guardia-merge.ts` (zona del memo): para confirmar de donde sale la config de la base y que el guardian no cambia.
- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts` (busqueda de `entornoConContador`): para MEN-3.
