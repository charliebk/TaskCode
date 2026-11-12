# Plan — TASK-109: Verificacion proporcional B6: documentacion y limpieza del nivel 2

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Duracion estimada: 90 min

Señales de la duración (de la rama abierta al cierre con merge): 3 ficheros de código, `core/config.ts`, `commands/doctor.ts` y lo que salga del inventario de código sin uso; 4 ficheros de documentación instalable o del repo: la guía, `SKILL.md`, el README del plugin y el CHANGELOG raíz; 2 capas, core/commands más docs; 3 criterios. Las B anteriores pasaron de su estimación entre 1,3× y 2,5×.

**No se trocea aunque pase de 60 min: lo ha decidido la persona (2026-11-11).** Es la última parte de TASK-096, y la versión no se publica hasta cerrarla.

No se crea ningún módulo nuevo. Todo se hace extendiendo puntos que ya existen, en este orden:

1. **`validarPatronesExclusion` (`src/core/config.ts:874`): el ejemplo depende de la clave.** Hoy la línea 884 es un ternario: `rutas_documentacion` tiene su ejemplo y las otras tres claves reciben el de `excluir_de_revision` («[**/dist/**, **/*.lock]. Para no excluir nada…»). Le pasa a `rutas_verificacion_parcial` (nota de la ronda 2 de TASK-096) y también a `contexto_revision`. Se cambia por un `Record<clave, string>` con un ejemplo por clave: la comprobación de tipos obliga a darlo al añadir una clave nueva. Para `rutas_verificacion_parcial`, `[src/web/**]` (misma familia que el error de «demasiado amplio», `config.ts:796`). Se arregla también el de `contexto_revision`.
2. **Doctor: se amplía `comprobarVerificacionSelectiva` (`src/commands/doctor.ts:448`).**
   - El `ok` dice hoy «la completa sigue siendo la puerta de finish», falso con el nivel 2. Con `comandoParcial(cfg) !== null` (`core/verificacion-proporcional.ts:82`) dirá que `finish` acepta la verificación de lo afectado cuando todo el código cae en esas rutas, y que el guardián de merges sigue exigiendo la completa.
   - Un `aviso` nuevo cuando hay `rutas_verificacion_parcial` y no hay `rutas_documentacion`: `decidirVerificacionEntre` devuelve `null` sin `rutas_documentacion` (`fs/decision-documentacion.ts:96`), así que el nivel 2 no se activa nunca. El arreglo va en la misma línea, como en el aviso de TASK-091.
3. **Inventario y borrado del código sin uso.** Se diffea `src/` entre el padre del merge de TASK-096 y `develop`, y para cada export añadido o tocado en B1..B5 se cuentan sus consumidores en `src/`. Solo se borra lo que no tenga ningún consumidor de producción. Primera pasada: nada muerto evidente (`parcialDeclarada`, `patronesParcial`, `comandoParcial` y `contextoSelectiva` tienen consumidor; no quedan comentarios «hasta B3/B5»). El criterio 2 puede cerrarse con «inventariado, nada que borrar» si el inventario queda escrito. Se actualiza la tabla de cabecera de `config.ts:29`.
4. **Documentación: se extiende lo que hay, sin guía nueva.**
   - **`skills/task-workflow/verificacion-selectiva.md`:** sección nueva «Codigo parcial: `rutas_verificacion_parcial`», detrás de la de documentación: principio de coste proporcional al cambio; lista de rutas permitidas, leída de la rama base; exige la selectiva y `rutas_documentacion`; timeout `timeout_verificacion_selectiva`; cobertura omitida (se mide en la completa); release y hotfix siempre a la completa; el guardián exige la completa para el código y por eso un merge a mano tras un fallo queda bloqueado (remedio: resolver y relanzar `finish`); la anotación `## Verificacion parcial`. La regla «por defecto la completa es la puerta; declarar la clave acepta que en esas rutas baste lo afectado», sin nombrar tareas internas. Se reescriben los pasajes que hoy afirman lo contrario (tabla l. 9, l. 12-14, l. 89-91).
   - **`SKILL.md`, párrafo de la l. 204:** con el nivel 2, `finish` puede integrar con la de lo afectado, y un merge a mano no.
   - **README del plugin:** l. 831-832 y 856-857; subsección nueva del nivel 2 detrás de `rutas_documentacion`; viñeta de doctor (l. 763-765); se borra la l. 912, que contradice las l. 893-902.
   - **`CHANGELOG.md` de la raíz:** párrafo «Verificacion proporcional, nivel 2 (TASK-096, TASK-105..TASK-109)» en «Siguiente version», con la decisión sobre TASK-091, lo que se retira y el aviso del reintento a mano bloqueado.
   - **`docs/ROADMAP.md`:** TASK-096 deja de figurar como pendiente.
5. **Prueba de la guía y Resultado.** Prueba en el bloque de la guía de `test/commands/verificacion-selectiva.test.ts:528`. El Resultado recoge la decisión sobre TASK-091, lo que se retira y el motivo de cada test que cambió de expectativa en B1..B5:

| Parte | Tests con expectativa cambiada |
|---|---|
| B1 (TASK-096) | ninguno |
| B2 (TASK-105) | ninguno declarado |
| B3 (TASK-106) | uno: `finish-documentacion.test.ts`, «con el nivel 2 finish sigue con la completa», ahora espera la selectiva |
| B4 (TASK-107) | ninguno, solo tests nuevos |
| B5 (TASK-108) | ninguno |
| B6 (esta tarea) | uno: la marca de la guía que cambia de redacción |

Hay que confirmar la tabla con `git diff` sobre `test/` en cada merge.

## Lo que el rol no cubrio

- **Riesgos:** no se han buscado a fondo los caminos por los que la documentación nueva miente. Lección de TASK-091: cada texto que describe estado se contrasta con cada camino real (Stop, review, finish, guardián, release, hotfix) antes de commitearlo.
- **Testing:** el plan de pruebas es la lectura de arquitectura, no un diseño de mutantes. Para que la sección se ponga roja si se borra, aseverar dentro de la sección extraída.
- **Dominio:** no se ha mirado si la redacción del principio cuadra con ToolsaWeb.

## Riesgos aceptados y que los contiene

- La documentación se desvía del código (cuatro textos): lo contiene la prueba literal de la guía; README y CHANGELOG sin prueba, aceptado.
- La prueba literal acopla la guía a frases: marcas de contrato, no de estilo.
- Que el inventario concluya «nada que borrar» y se escape algo: el método queda escrito y el revisor lo repite.
- El aviso de doctor no impide la configuración sin efecto (D1).

## Plan de pruebas

- **Guía, test nuevo:** se extrae la sección «Codigo parcial» por su encabezado y se asevera dentro: `rutas_verificacion_parcial:`, «rama base», `comando_verificacion_selectiva`, `rutas_documentacion`, `timeout_verificacion_selectiva`; cobertura omitida, release y hotfix a la completa; el guardián exige la completa y el merge a mano queda bloqueado, con el remedio `taskctl finish`; `## Verificacion parcial`; y que no aparece `TaskCode` ni `TASK-\d`. Si se borra la sección, falla la extracción (se comprueba a mano y se documenta).
- **Test existente de la guía (l. 528):** la marca `/Antes de integrar se exige siempre la\s+completa/` se sustituye por la frase nueva (completa por defecto y excepción con la clave). Motivo en el Resultado.
- **Config, en `test/core/verificacion-proporcional.test.ts`:** el error de forma de `rutas_verificacion_parcial` lleva su ejemplo y no «Para no excluir nada»; igual para `contexto_revision`.
- **Doctor:** `ok` con el nivel 2 y su texto; `aviso` con parcial sin documentación, en una línea y con `arreglo`; los dos tests TASK-091 sin tocar.
- **Suite completa** una vez antes de la revisión; solo los 3 rojos conocidos de Windows.

## Lo que necesita decision de una persona

- **D1. `rutas_verificacion_parcial` sin `rutas_documentacion`** — resuelta: aviso en `doctor` y documentarlo en la guía. Es lo que pide el propio enunciado («Aviso de doctor si procede») y la opción por defecto del rol; la persona dejó dicho que se continuara sin parar (2026-11-11), así que no se le despierta para esto. La alternativa (que la config aborte) queda anotada para revisarla con ella si lo prefiere.
