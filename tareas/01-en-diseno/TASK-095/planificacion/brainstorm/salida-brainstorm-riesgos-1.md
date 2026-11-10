# Brainstorm — TASK-095, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

Referencias relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **El «siempre acotada» se aplica sin una base de referencia fiable.** En `review.ts:592-603`, si ninguna petición dice qué commit se revisó, o si ese commit ya no es antepasado de HEAD por un rebase o un amend, `desde` vuelve a ser la rama base. Hoy eso acaba en «completa» (`review.ts:623`). Con la regla nueva, el diff entero desde la base llegaría etiquetado como «verificación acotada», con la instrucción de abrir solo hallazgos CRÍTICOS: código que nunca pasó una revisión completa entraría con el listón rebajado. Mitigación: «siempre acotada» solo cuando `desde` es el commit revisado y es válido; si no, completa, con el motivo escrito.
- **Borrar `alcanceRondaSiguiente` en bloque se lleva también las guardas fail-closed** (`informe-revision.ts:355-363`): sin informes, veredicto distinto de `cambios-solicitados`, tabla ilegible, informe que sigue siendo la plantilla, severidad fuera del vocabulario. Escenario: el informe de la ronda N es la plantilla sin rellenar y la N+1 sale acotada con «0 abiertos». Mitigación: borrar solo la rama `severidadReconocida !== 'MENOR'` (líneas 368-370) y la de `fuera` (`review.ts:625`); el resto se queda.
- **La cadena de seguimiento se pierde entre rondas.** `leerRondaPrevia` (`review.ts:368-418`) solo lista los abiertos de la última ronda. Si el revisor de la ronda 2 olvida relistar un IMPORTANTE de la ronda 1, desaparece; antes una ronda completa podía volver a encontrarlo. Mitigación: abiertos = unión por revisor+ID de todas las rondas, menos lo cerrado en una ronda posterior.
- **Un revisor marca `corregido` algo que no lo está.** `hallazgosNoCerrados` (`informe-revision.ts:257-263`) da por cerrado cualquier `corregido`. Mitigación: un hallazgo solo se cierra cuando lo marca el revisor de una ronda posterior a la que lo abrió, nunca en la misma ronda ni el implementador.
- **El dominio sin hallazgos no ve una corrección grande en su terreno.** Hoy la acotada no se fragmenta: solo revisa el genérico (`review.ts:677-681`). Si para corregir un IMPORTANTE del genérico se reescribe un `.rs`, `rust-wasm-reviewer` no lo mira (los dominios aportan 63 de 88 hallazgos propios). Mitigación: petición de dominio si tiene abiertos **o** si el delta toca sus ficheros.
- **Merge de la base entre rondas.** La ronda incremental no ejecuta el update (TASK-040); un merge manual mete en `desde..HEAD` todo el código ajeno y la resolución de conflictos llega como «corrección». Mitigación: separar en la petición el diff de la resolución (`--remerge-diff` exige git 2.36+; no portable).
- **El tope de 3 rondas no frena.** `TOPE_RONDAS` solo existe en `flujo.ts:170` y `review.ts` no lo consulta: quien llame a `taskctl review` directamente se lo salta. En manual y semi, `accionPara` devuelve `detener` antes que `preguntar` (líneas 100 y 105), lo que choca con «preguntar en cualquier modo». Lectura no verificada de por qué TASK-008 de OpenDockTrading llegó a 14 rondas: cada ronda completa encontraba otra tanda, y se respondió «otra ronda» o se llamó a `review` sin pasar por `siguiente`.

## Estados intermedios y fallos parciales

- Si `review` muere tras escribir la petición del genérico y antes de la de un dominio, la ronda queda incompleta; `fueAcotada` se activa con una sola petición acotada (`review.ts:378`). Confirmar que un reintento reescribe todas las peticiones.
- La salida del tope («se acepta documentado o pasa a tarea nueva») puede convertirse en la puerta habitual para cerrar con IMPORTANTES abiertos. En automático el propio agente podría aceptarlos: debe exigir a una persona (como `approve --decidido-por automatico`, que se rechaza) y los IDs escritos en `Resultado`.
- Un CRÍTICO mal corregido en un fichero que el delta no toca: el verificador solo ve el delta. La petición tiene que permitirle leer el repo y obligarle a reproducir el fallo.

## Compatibilidad hacia atras

- Tareas en revisión a mitad de ciclo: su ronda N fue completa y la N+1 saldrá acotada; inocuo si el commit revisado está en la petición. Las peticiones anteriores al campo `Commit revisado` caen en el primer riesgo.
- Informes viejos sin tabla: ya generan «Lee esos informes enteros» (`review.ts:403-408`); con ellos la ronda debe seguir siendo completa.
- La regla «completa tras acotada va desde la base» (`review.ts:635-639`) solo se activará con `--completa`; hay que conservarla.

## Vuelta atras

- Se revierte con un merge de reversión; las peticiones «acotada» solo hacen que la versión vieja revise desde la base (dirección segura).
- Punto sin retorno: las tareas cerradas en el intervalo con rondas 2+ acotadas ya están integradas; revisarlas de nuevo exige una tarea nueva.
- El plugin se distribuye por marketplace: la vuelta atrás exige publicar versión, y los proyectos entre versiones mezclan reglas dentro de una tarea.

## El riesgo que mas te preocupa (UNO solo)

Que «siempre» se implemente al pie de la letra y la acotada salga también sin base fiable (sin commit revisado, rebase o amend, informe plantilla o ilegible, veredicto previo distinto de `cambios-solicitados`) porque se borre en bloque el código que hoy cierra esos casos. «Siempre» debe leerse como «aunque haya CRÍTICO o IMPORTANTE», no como «aunque no haya base»: en esos casos tiene que seguir saliendo completa.

Sin verificar: la versión del plugin de OpenDockTrading en TASK-008 y si tenía `TOPE_RONDAS`; quién escribe `corregido` en los informes reales.
