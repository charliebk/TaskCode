# Brainstorm — TASK-106, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Codigo integrado con un verde que no ha probado nada.** Si finish lanza `comando_verificacion_selectiva` copiando `puertaSoloDocumentacion`, que llama a `ejecutarVerificacion` sin `env` (`finish-verificacion.ts:226`), el script se queda sin `RAMA_BASE` o hereda uno viejo de `process.env` y sale con 0: develop recibe codigo sin verificar y solo lo descubre la completa del release. Mitigacion: lanzarla siempre con `RAMA_BASE=<ramaBase>` impuesto, pisando el heredado, como ya hace `verificarConMemo` (`verificacion.ts:286-289`).
2. **Un hotfix se cuela en la selectiva.** `finish.ts:468` ya pasa `ramaBase` (= main) a la puerta en los hotfix, asi que la decision puede salir `selectiva`: main recibe codigo con un verde parcial. Mitigacion: forzar la completa por tipo en la rama selectiva. No quitando `ramaBase` al hotfix: eso rompe su camino de solo documentacion de la 0.14.0.
3. **Reutilizar en finish el memo del Stop o de review invierte la decision de TASK-072** («no reutiliza el memo, que no ve los ficheros ignorados», cabecera `finish-verificacion.ts:4-6`). Un verde del Stop hecho con `dist/`, generado o `.env` ignorados que luego cambian se integra con un verde que ya no corresponde al arbol. Mitigacion: reutilizar solo con el arbol limpio y dejar la inversion de TASK-072 escrita como decision, no colarla de lado.
4. **Un memo rojo queda pegado.** `leerMemo` devuelve el resultado guardado sea cual sea su estado, tambien `roja` o `cortada` (`verificacion.ts:183-198`, `:284`). Un timeout del Stop bajo carga deja ese resultado: finish bloquea sin reejecutar hasta un commit nuevo y la persona acaba en `--sin-verificacion`. Mitigacion: de un memo, reutilizar solo `estado === 'verde'`.
5. **La puerta de cobertura lee un lcov parcial.** Si el verde selectivo vuelve como `{tipo:'verde', inicioMs}`, `puertaCobertura` no lo omite (`finish-cobertura.ts:75-110` solo omite `omitida` y `documentacion`): rojo falso «Sin datos fiables no se cierra», o umbral medido sobre un lcov parcial. Mitigacion: variante propia en `ResultadoPuerta`, tratada como `documentacion`, y switch exhaustivo.
6. **Una anotacion en `tarea.md` que miente o que mata la reutilizacion.** Si se copia el orden de documentacion (anotar y commitear ANTES de ejecutar, `:207-218`), HEAD cambia y el memo del Stop no casa nunca. Ademas, tras un rojo, el arreglo toca codigo fuera de las rutas y el reintento corre la completa, pero la linea «selectiva» se queda porque la idempotencia compara texto (`transiciones.ts:378`). Mitigacion: anotar tras el verde y antes del merge (`tareas/**` es siempre documentacion, `verificacion-proporcional.ts:33`), y que cada intento deje constancia del nivel que corrio de verdad.
7. **`guardarMemo` escribe en el de la completa si no se le pasa tipo** (por defecto `'completa'`, `verificacion.ts:206`): machaca `freno-verificacion.json`. Es el criterio 3. Mitigacion: pasar siempre `'selectiva'` explicito.

## Estados intermedios y fallos parciales

- Selectiva cortada a los 600 s cuando el script decide correrlo todo: aceptado en D5; falla en cerrado (bloquea, no integra). Descartado a proposito.
- Stop y finish a la vez en el mismo worktree: el Stop corre al final del turno y finish dentro de el; no se solapan en uso normal. Descartado.
- develop avanza entre el Stop y finish: `contextoSelectiva` mete el SHA de la base en la huella (`verificacion.ts:246-248`); solo cuesta reejecutar. Descartado.

## Compatibilidad hacia atras

- Texto TASK-091 (`finish-verificacion.ts:175-180`): retirarlo solo en el camino con la clave. Sin la clave, el criterio 5 exige que siga igual (`verificacion-selectiva.test.ts:459/:478`, segun el plan de TASK-096; no releido).
- «Hotfix siempre a la completa»: aplicarlo solo al nivel 2. Quitar al hotfix tambien el camino de documentacion cambia la 0.14.0 y nadie lo ha pedido.

Desacuerdo previsto con arquitectura: reutilizar el memo en finish es una regresion de TASK-072; si se mantiene, solo con verde, arbol limpio y la misma base por nombre, y como decision explicita de la persona.

Suposiciones no verificadas:
- Que la base con la que el Stop guarda su memo (`base()` de `peticionDeTrabajo`) tiene el mismo nombre que la `ramaIntegracion` de finish; si no, la reutilizacion nunca casa (mirar `freno-stop.ts`).
- Que hace el script selectivo de ToolsaWeb sin `RAMA_BASE`.
- Que el guardian no ve el merge interno de finish (spawn, no herramienta Bash); `analizarComando` no leido.
- Que Stop y finish usan el mismo `timeout_verificacion_selectiva` (arbol vs base); si divergen la huella no casa.

## Vuelta atras

Puntos sin retorno:
- Merge en develop con push tras un verde solo selectivo: nadie reescribe develop; queda revert mas completa, y la deteccion llega en el release.
- `finish --merge-request` con selectiva: la plataforma mergea y el segundo `finish` no vuelve a verificar (`finish-verificacion.ts:7-9`).

## El riesgo que mas te preocupa (UNO solo)

Codigo integrado con un verde que no ha probado nada: la selectiva lanzada sin `RAMA_BASE` impuesto sale con 0 y develop recibe codigo sin verificar hasta el release.
