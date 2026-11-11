# Brainstorm — TASK-105, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: brainstorm-riesgos (subagente)

Todo lo dicho está leído en el código salvo lo marcado como **[supuesto]**. No había enfoque escrito: se razona sobre el objetivo y los criterios.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **El guardián dejará de bloquear de forma explícita y solo bloqueará por casualidad.** En `src/hooks/guardia-merge.ts:266-288`, `exencionDocumentacion` solo corta en `d.tipo === 'completa'`. Cuando B2 calcule `fueraDeParcial`, el guardián recibirá `selectiva` y seguirá: busca `huellaDeCommit(raiz, sha, d.comando, r.timeoutS)` con el comando de la selectiva y el timeout de la completa, en el memo `'documentacion'`. Hoy no casa porque el tipo de memo no coincide, no porque se cumpla D1 («el guardián nunca acepta la selectiva»). Un proyecto con `comando_verificacion_documentacion` igual a la selectiva y mismo timeout, o un B5 que «arregle» el tipo de memo, dejaría pasar código con la selectiva en verde. Mitigación: en B2, el guardián trata `selectiva` como `completa` explícitamente.
2. **«Nada observable cambia» es falso tal como está el código.**
   - `finish-verificacion.ts:159-161` escribe `se ejecuta la verificacion completa: ${motivo}`, y el motivo de `selectiva` (`verificacion-proporcional.ts:157-159`) dice «basta la verificacion de lo afectado»: el mensaje se contradice.
   - El `detalle` del guardián mandará al agente a por «su comprobacion de documentacion (<comando selectiva>)»: acción equivocada.
   - Mitigación: mientras B3 y B5 no existan, quien llama convierte `selectiva` en `completa` con un motivo neutro antes de mostrar nada.
3. **Escape de código sin clasificar si el árbol o los held-out se suman mal.** Hoy `unir()` (`decision-documentacion.ts:56-62`) y el bloque `heldoutComoCodigo` (`:86-89`) reconstruyen el diff sin `fueraDeParcial` → `undefined` → completa (fallo cerrado por accidente). Escenarios de escape:
   - Si B2 conserva el campo con un spread, los held-out de `tareas/**/aceptacion/` quedan fuera de `fueraDeParcial` (porque `patronesParcial` incluye `tareas/**`): el guardián diría `selectiva` aunque la rama cambie tests de aceptación.
   - Si `unir` lleva `fueraDeParcial` pero `rutasDelArbol` no lo calcula con los patrones parciales, un `.ts` sin commitear fuera de las rutas no aparece.
   - Mitigación: `fueraDeParcial` se recalcula siempre después de sumar árbol y held-out; nunca se arrastra desde el primer diff.
4. **Dos lecturas de Git sobre refs que se mueven.** El segundo diff vuelve a resolver `base...HEAD`; un `reset` o un commit de otro agente entre ambas llamadas puede hacer que `fueraDeDocs` vea `src/fuera.ts` y `fueraDeParcial` no. `decidirVerificacion` no comprueba coherencia → `selectiva`. Mitigación: resolver `base` y `hasta` a SHA una sola vez antes de los dos diffs.
5. **No guardar el memo `selectiva` con el árbol sucio relanza la selectiva en casi todos los Stop.** El Stop pasa `selectiva` a `verificarConMemo` con el árbol sucio (`freno-stop.ts:206-212`; `verificacion.ts:273` hoy solo exige árbol limpio para `documentacion`). Un agente iterando casi siempre tiene cambios sin commitear: cada fin de turno idéntico relanza el script (hasta 600 s). Regresión de agilidad visible, contra «nada cambia». Mitigación: medir con ToolsaWeb antes de cerrar; la forma de evitarlo es decisión de arquitectura.
6. **Huella con contexto que coincide en el test pero no en la realidad.** Contexto = `selectiva\0<nombre base>\0<sha base>` (`verificacion.ts:227-229`):
   - el Stop usa la base de la tarea y el guardián `destino` de `branch --show-current`; `develop` vs `refs/heads/develop` u `origin/develop` no casan nunca;
   - si develop avanza entre Stop y finish, tampoco;
   - el timeout del Stop sale del árbol y el de finish/guardián de la base.
   Falla cerrado, pero B3 descubrirá que nunca hay memo aprovechable. Mitigación: una sola función de contexto, exportada.

## Estados intermedios y fallos parciales

- **Primer diff bien, segundo falla** (base desaparece, clon superficial, Git cortado): debe acabar en `fueraDeParcial: undefined` (completa), nunca reutilizar `fueraDeDocs` como parcial. La regla pura ya lo trata (`verificacion-proporcional.ts:145`); el riesgo está en el cableado de fs.
- **Presupuesto del guardián**: `PRESUPUESTO_EXENCION_MS = 20_000` (`guardia-merge.ts:97`); el segundo diff añade procesos. En repos grandes o Windows la exención llega tarde y se bloquea: lado seguro, pero falso «bloqueado» sin explicación.
- **Muerte a mitad de `verificarConMemo`**: `guardarMemo` usa `writeFileSync` sin rename atómico; un JSON truncado se lee como «sin memo». No es peligroso.
- **Dos ejecuciones a la vez** (Stop y `review`): gana el último. Con la regla del árbol limpio, un Stop sucio ya no pisa el verde limpio: por eso la regla aporta y conviene conservarla aunque cueste lo del punto 5.

## Compatibilidad hacia atras

- **Proyectos sin la clave**: el segundo diff solo con `parcialDeclarada(config)`. Pero la salida temprana actual es `if (!documentacionDeclarada(config)) return null` (`decision-documentacion.ts:82`): un proyecto con `rutas_verificacion_parcial` sin `rutas_documentacion` no llegaría al nivel 2; si se relaja, ese proyecto pasa de `null` a recibir decisión (aviso nuevo en finish, `detalle` en el guardián): otro cambio visible. Decidir explícitamente cuál se quiere.
- **ToolsaWeb** declara `comando_verificacion_selectiva` y no la clave **[supuesto]**: no debe cambiarle ni un proceso Git ni un mensaje.
- **Memos ya escritos**: `VERSION_MEMO` sigue en 1 y la fórmula no cambia; un memo `selectiva` limpio de la 0.14.0 casará con `huellaDeCommit` con contexto para el mismo commit, base y timeout (verde legítimo). Si B2 tocara la fórmula, habría que subir `VERSION_MEMO`.
- **Firma**: con `contexto?` opcional, los llamantes actuales (`guardia-merge.ts:227`, `:280`) no cambian; sin contexto debe dar exactamente la fórmula de hoy, o se pierden los verdes de la completa en disco.

## Vuelta atras

- Todo reversible: código sin publicar (hasta B6), memos efímeros en `.git/`. Un `git revert` del merge de B2 deja la 0.14.0.
- Lo único irreversible sería un merge que el guardián dejara pasar por el modo 1, publicado con push. Por eso el modo 1 se cierra en B2, no en B5.
- Sin puntos de no retorno mientras no se publique versión a mitad del troceo.

## El riesgo que mas te preocupa (UNO solo)

El modo 1: en cuanto B2 produzca `selectiva`, el guardián la trata como «documentación» (`guardia-merge.ts:267` solo corta en `completa`); D1 queda sostenida solo porque busca en un tipo de memo que no corresponde. Cerrarlo en esta tarea con un corte explícito en el guardián.

No verificado: en ToolsaWeb, ni el coste real del punto 5 ni el formato de la base que pasan Stop y guardián.
