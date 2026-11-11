# Salida de brainstorm — TASK-104, rol riesgos (ronda 1)

## Modos de fallo, ordenados por gravedad

- **La peticion etiqueta como «selectiva en verde» lo que solo fue la comprobacion de documentacion.** `seccionVerificacionRevision` y el error de `verificacionSelectivaDeRonda` llevan «selectiva» fijo [leido, review.ts:938 y 1045]. El revisor aprueba con una garantia falsa. Mitigacion: texto y seccion propios por tipo de plan, y nombrar en la peticion el «no corrio nada».
- **Aparece una ejecucion que la 0.14.0 no tenia.** `peticionDeTrabajo` devuelve `documentacion` ANTES de mirar la selectiva [leido, decision-documentacion.ts:148-153]; `sinSelectiva:'nada'` solo actua despues. Sin selectiva y con `comando_verificacion_documentacion`, review lo correria: contra la decision de Carlos y el criterio 4. Mitigacion: en review, sin selectiva, cortocircuito a «nada» antes de llamar. No confiar en `sinSelectiva`.
- **Stop y review divergen en un hotfix.** Stop pasa `baseFiable = baseDeTipoSinRed(tipo)` (false en hotfix) [leido, freno-stop.ts:189]; pasar true en review rompe el criterio 3 en silencio. Mitigacion: el mismo `baseFiable`.
- **El comando de documentacion ensucia el arbol** (linter con --fix). El autocommit solo añade las carpetas de la tarea [leido, review.ts:987-991]; el siguiente comando abortaria (`isWorkspaceClean`, review.ts:623). Mitigacion: misma guarda de arbol y de rojo para cualquier plan que ejecute algo.
- **Review aborta donde la 0.14.0 funcionaba**: `configDeRef(base)` lanza un error que no es `ConfigError` (ref inexistente, git falla), solo con `rutas_documentacion` declarada. Mitigacion: cualquier fallo de la decision cae a la de siempre con aviso.
- **La cobertura cambia sin que nadie lo pida**: hoy se oculta si `selectiva !== null` [leido, review.ts:771-773]. Si documentacion se modela como null reaparece (de un informe viejo); como no-null desaparece. Hay que decidirlo.
- **Los avisos de `peticionDeTrabajo` se pierden** (config de la base invalida) si review no los vuelca en `avisos`.

## Estados intermedios y fallos parciales

- Primera ronda: el update de Git-Flow ya mergeo la base antes de verificar [leido, review.ts:634-639]; un rojo de documentacion lo deja hecho, como hoy la selectiva. El mensaje (`estadoBase`) debe valer para los dos.
- Decidir y ejecutar antes del primer writeFile: sin ronda a medias si muere.
- Memo de documentacion compartido [leido, verificacion.ts:233]: la huella lleva el timeout; Stop lo recorta a 3540 s y review usaria el de la base. Con timeout mayor solo se re-ejecuta: coste, no falso verde.
- Ronda incremental: sin update; base...HEAD desde el merge-base antiguo es correcto; un conflicto resuelto tocando codigo sale en el diff (direccion segura).

## Compatibilidad hacia atras

- Cambio real para quien tiene `rutas_documentacion` y selectiva sin comando de documentacion: una ronda de solo docs antes corria la selectiva, ahora nada. CHANGELOG (criterio 5).
- Sin `rutas_documentacion`: la puerta del arbol cierra sin git; verificar que no se añade ni un git ni una linea a la peticion.
- Una rama que añade la clave en su config: decide la base, que no la tiene: la de siempre. Seguro, pero confunde.
- Held-out: no cuentan como codigo (MEN-3 de TASK-102); nombrarlo en la documentacion.

## Vuelta atras

- Reversible entero: revertir el codigo; memos en .git/ sin cambio de formato.
- Sin interruptor solo para review: quitar `rutas_documentacion` apaga tambien Stop, finish y el guardian.

## El riesgo que mas me preocupa

El primero: la peticion dice «selectiva en verde» de una comprobacion que no ejecuto ningun test. No aborta ni avisa.

Supuestos sin verificar: que `isWorkspaceClean` cuenta los no trackeados; que `rutasDeTarea` excluye `tareas/`. Desacuerdo previsto con arquitectura: reutilizar `peticionDeTrabajo` tal cual con `sinSelectiva:'nada'` viola el criterio 4; el criterio 3 solo se cumple con selectiva declarada.
