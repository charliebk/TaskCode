# Brainstorm — TASK-108, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos
- No había un enfoque escrito: se evalúa el cambio tal como lo describen los criterios y el código actual de `src/hooks/guardia-merge.ts`, leído entero.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **El mensaje manda a obtener una completa que, en el nivel 2, nada guarda donde el guardián la busca.**
   - Escenario: el `finish` de nivel 2 de una tarea choca en un conflicto. El agente hace `git merge --abort` y luego `git merge --no-ff feature/x` a mano, y el guardián lo bloquea.
   - La completa solo se guarda en el memo que consulta el paso 6 (`guardia-merge.ts:223-231`) cuando la corre `finish` por su camino de completa (`finish-verificacion.ts:191-198`).
   - Con la selectiva declarada, Stop y review nunca corren la completa: `peticionDeTrabajo` devuelve `selectiva` antes que `completa` (`decision-documentacion.ts:215-221`). Además, `finish` con un diff parcial vuelve a elegir la selectiva (`:171-172`).
   - Correr `comando_verificacion` a mano no escribe ningún memo.
   - Consecuencia: si el texto dice «corre la completa y repite el merge», el agente entra en un bucle y acaba en `--sin-verificacion`.
   - Mitigación: el remedio que ofrece el mensaje debe ser solo `taskctl finish TASK-NNN`, que integra por script fuera del hook, o `--sin-verificacion`. Nunca «corre la completa y repite el merge».
2. **El guardián se abre por tiempo en proyectos grandes.**
   - Con `rutas_verificacion_parcial`, todo merge de código lanza dos git más: `resolverCommits` y `rutasFueraDe` (`decision-documentacion.ts:102,120`). Ese cálculo solo sirve para acabar rechazando.
   - El presupuesto de 20 s se comprueba una sola vez, al entrar en la exención (`guardia-merge.ts:257`); el cálculo puede pasarse de los 30 s del hook después.
   - Según el comentario del código (`:93-95`), un hook que muere por tiempo «podría dejar pasar el merge».
   - Mitigación: en el guardián, en cuanto haya código, cortar antes del diff de nivel 2 (o decidir sin él), porque la respuesta no depende de ese diff.
3. **El criterio 2 queda verde a medias.**
   - La decisión de la exención (6b) ya lee la config del destino (`configDeRef`).
   - Los pasos 3 y 6 usan la del árbol: `resolverConfigConAvisos(raiz)` (`guardia-merge.ts:141`) da `comando_verificacion`, `rama_base` y el timeout de la huella (`:211,224`).
   - Escenario: con el árbol de la feature y `comando_verificacion` borrado sin commitear, el paso 3 deja pasar el merge (`:146`) sin mirar el destino.
   - Mitigación: que el test del criterio 2 cubra también ese camino, o que el plan acote por escrito que el criterio solo se refiere a la exención.
4. **Un comentario de la zona hace que se implemente justo lo contrario de D1.**
   - `decision-documentacion.ts:148-155` dice «Hasta que el guardián la acepte (B5)». El Resultado de TASK-106 dice «el guardián sigue exigiendo la completa hasta B5». `finish-verificacion.ts:281` dice «que aún no acepta la selectiva (B5)».
   - Mitigación: reescribir esos comentarios con D1 («nunca») en esta misma tarea.
5. **El mensaje miente en algún camino.**
   - «develop avanzó y la huella ya no casa»: la huella de la completa es `sha+comando+timeout`, sin el destino (`verificacion.ts:162-166`), así que develop puede avanzar y la huella sigue casando.
   - Lo que sí la invalida: un commit nuevo en la feature (incluida la anotación `## Verificacion parcial` que `finish` commitea tras el verde), un cambio de `comando_verificacion` o su timeout, o que el memo (un solo fichero) lo haya machacado otra verificación.
   - Mitigación: que el texto no afirme la causa que no comprueba, y que no se condicione a si existe el memo selectivo (su huella lleva el SHA de la base, `contextoSelectiva`).

## Estados intermedios y fallos parciales

- Conflicto a mitad del script de `finish`: queda develop con `MERGE_HEAD` y la feature con la anotación commiteada. `git merge --continue` no cuenta como merge (`comando-merge.ts:109`) y `git commit` no contiene «merge», así que el guardián no ve ese cierre. El bloqueo solo aparece tras `--abort` y un merge nuevo (modo 1).
- Reintento de `finish` tras abortar: HEAD de la feature ya no es el del memo selectivo; la selectiva se vuelve a correr. Lento pero seguro.
- El guardián no escribe nada: si muere a mitad, no deja estado.

## Compatibilidad hacia atrás

- El texto de `mensaje()` lo comprueban `test/hooks/guardia-documentacion.test.ts` (4 aserciones) y `guardia-merge.test.ts` (1). Lo citan `skills/task-workflow/SKILL.md` y `verificacion-selectiva.md`.
- Sin la clave en la config del destino, el texto queda byte a byte como en la 0.14.0 (criterio 4). Una rama que introduce la clave: el destino aún no la tiene y debe salir el texto viejo.
- Memos ya escritos (`VERSION_MEMO = 1`): no tocar la fórmula de la huella ni la versión.
- Hotfix y release: se rigen por la config de main y `integ.release` (`:271`); no mezclar el mensaje nuevo con el detalle del release.

## Vuelta atrás

- Reversible entero: solo código y texto, sin migrar datos ni cambiar el formato del memo.
- No hay versión publicada hasta 096-6.
- Único punto sin retorno, ajeno al cambio: un merge que el guardián dejara pasar por error (modo 2) y que luego se publique con push.

Desacuerdo previsto con arquitectura: si propone que la exención lea el memo `selectiva`, aunque sea para enriquecer el mensaje, me opongo (contradice D1 y abre el modo 5).

Suposiciones no verificadas:
- Que Claude Code deja pasar el comando cuando el hook PreToolUse vence por tiempo (del comentario de `guardia-merge.ts:93-95`).
- Que `taskctl finish ... --merge-request` no lo clasifica `analizarComando` como merge.
- Que el diff de nivel 2 tarda lo bastante en un repo real como para comerse los 20 s (medir con ToolsaWeb).

## El riesgo que mas te preocupa (UNO solo)

El modo 1: un mensaje de bloqueo que manda a «obtener la completa» cuando, en un proyecto de nivel 2, ningún camino escribe el memo de la completa que el guardián busca. Con un texto así, D1 se convierte en un bucle que solo se rompe con `--sin-verificacion`.
