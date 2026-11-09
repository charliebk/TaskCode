# Brainstorm — TASK-091, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: a74b4eeb30e197fb6

Base: `taskcode-marketplace/plugins/taskcode-plugin/src`. «Leido» = comprobado en el codigo; «supuesto» = no comprobado.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Si las dos claves tienen el mismo texto, el guardian de merges acepta un verde de la selectiva como si fuera de la completa.** Escenario: ToolsaWeb declara las dos como `scripts\verificar.bat` y el script lee la base de una variable de entorno. Leido: la huella del memo es `v1 + sha + comando + timeout` (`huellaDeCommit`/`huellaDelArbol`, `fs/verificacion.ts`). Con el arbol limpio el Stop guarda un verde con esa huella y `motivoDeBloqueo` (`hooks/guardia-merge.ts:153-160`) deja pasar un `git merge` manual. Mitigacion: la huella incluye el tipo (selectiva/completa) y la base; o `resolverConfig` rechaza comandos iguales.
2. **Selectiva sin completa: la puerta de `finish` y el guardian se apagan sin avisar.** Leido: `puertaVerificacion` devuelve `sin-comando` (`finish-verificacion.ts:71`) y el guardian hace `continue` (`guardia-merge.ts:94`). Mitigacion: error en `resolverConfig`, como ya pasa con `timeout_verificacion` sin comando (`config.ts:629`).
3. **Al migrar, la completa puede acabar siendo el clasificador por impacto.** Si el proyecto reescribe su verificador para que decida por impacto y sin argumento haga «lo que toque», la puerta de `finish` pasa a ser selectiva sin que TaskCode lo vea. Mitigacion: la guia exige que la completa no dependa de argumentos y que, sin base, corra todo.
4. **Verde falso de la selectiva por no ver los cambios sin commitear.** Leido: el Stop corre sobre el arbol sucio; un clasificador con `git diff develop...HEAD` no ve lo no commiteado, no corre nada y sale con 0. Igual si `develop` no existe en local (worktree, clon superficial) y el script sale con 0. Mitigacion: la guia exige incluir el arbol de trabajo y correr la completa si no se puede clasificar (fallo cerrado, responsabilidad del script, escrito en la guia).
5. **El texto de la tarea invita a que `finish` consulte un memo en vez de ejecutar** («si falla o no se ha corrido»). Leido: hoy `finish` ejecuta siempre la completa (cabecera de `finish-verificacion.ts`, decision de Carlos: el memo no ve los ignorados). El criterio ya se cumple; cambiarlo seria regresion. Mitigacion: dejar `puertaVerificacion` y mejorar solo el mensaje.
6. **Seccion de cobertura de la peticion enganosa.** Leido: `datosCoberturaRevision` (`review.ts:642-652`) lee `informe_cobertura`; si la selectiva regenera un lcov parcial, la seccion miente. En `finish` no pasa (`finish-cobertura` exige un informe posterior a `inicioMs` de la completa). Mitigacion: no medir en revision sobre un informe escrito por la selectiva, o decirlo en la peticion.
7. **La base pasada no siempre es la de la tarea.** Leido: `review` usa `resolveBaseBranchForTipo(tipo)` (`review.ts:561`), un hotfix va contra main; el Stop solo tiene `config.rama_base`. Mitigacion: el Stop saca la base del tipo de la tarea en curso de la rama (ya la lee en `listTareasEnEstados`).
8. **Meter la base en el texto del comando rompe una garantia.** Leido: `ejecucion-acotada.ts:30-33` dice que al comando no se le interpola nada; corre con `shell: true`. `rama_base` solo se valida como texto no vacio (`config.ts:467`) y git admite `&`, `;`, `|`, `$`, `(`. Mitigacion: variable de entorno (que no nombre el producto) o validar con `git check-ref-format`.

## Estados intermedios y fallos parciales

- **Hoy `taskctl review` no ejecuta ninguna verificacion (leido).** Si la selectiva corre despues de escribir la peticion y el andamio (flag `wx`, `review.ts:692-704`) y se mata el proceso, queda una ronda fantasma (N+1). Mitigacion: ejecutarla antes del primer write (principio de TASK-081).
- **Que pasa si la selectiva falla en `review` no esta definido**: abortar con la tarea en en-curso, o escribir la peticion en rojo (la tarea pasaria a en-revision con el codigo en rojo). Lo decide el plan.
- **Una selectiva que escribe ficheros ensucia el arbol** (lcov, build); el autocommit de `review` se los lleva o el guardia de workspace aborta. `finish` ya lo detecta («verde pero dejo cambios», `finish-verificacion.ts:128`); `review` necesitaria lo mismo.
- **Supuesto: el agente lanza `taskctl review` con Bash, con tope de 2-10 min.** Si se pasa, mata `review` a mitad; en Windows el hijo de `ejecutarAcotado` no va desacoplado (`detached: !win`) y un `verificar.bat` huerfano puede ensuciar el arbol. Medirlo.
- **Memo de un solo hueco (leido: `freno-verificacion.json`).** Si Stop guarda la selectiva, pisa el verde de la completa; el guardian bloquea merges manuales que hoy pasan. Fallo cerrado: molesto, no peligroso.
- **La salida de la selectiva entra en la peticion, que se commitea**: hasta 16 KB (`BYTES_COLA_LEIDOS`) con rutas absolutas; un ``` rompe el bloque. El parser de `Commit revisado` toma la primera coincidencia (`informe-revision.ts:96`, flag `m`): la salida va despues de la cabecera.
- **Concurrencia**: dos sesiones (Stop selectiva y `finish` completa) se pisan el memo.

## Compatibilidad hacia atras

- **Criterio 4 choca con criterio 1 (leido)**: `test/commands/doctor.test.ts:320-327` exige `nivel === 'ok'` en `verificacion` con solo `comando_verificacion`. Salida: comprobacion aparte (`verificacion-selectiva`); el aviso no cambia el codigo de salida (`doctor.ts:614`).
- **El aviso nuevo de `doctor` saldra en todos los proyectos configurados**, este incluido; si el arreglo no se puede copiar tal cual, se dejara de leer (como TASK-070 y TASK-088).
- **Plugin antiguo con config nueva**: la clave desconocida avisa y se ignora; vuelve a correr la completa en Stop. Lento pero seguro.
- **Las rondas antiguas no tienen seccion de verificacion**: `leerRondaPrevia`, `siguiente.ts`, `flujo.ts:224` deben tolerar que falte.
- **Cambiar la formula de la huella exige subir `VERSION_MEMO`**: los memos existentes quedan invalidos y el guardian bloquea merges manuales hasta reverificar.
- **Hoy el guardian acepta el verde del Stop con arbol limpio**; con la selectiva en el Stop ese camino desaparece. Documentarlo en el CHANGELOG.

## Vuelta atras

- **Por proyecto**: quitar `comando_verificacion_selectiva` devuelve el comportamiento actual.
- **Por version**: se puede bajar; si se subio `VERSION_MEMO`, el plugin anterior ve los memos nuevos como ausentes (fallo cerrado). Las peticiones con la seccion nueva siguen siendo markdown legible.
- **No se deshace desde aqui**: la migracion de cada proyecto; una version publicada no se retira, se corrige con otra.
- **Interruptor existente**: `FRENO_VERIFICACION=0` apaga el Stop entero; no hay forma de volver solo de la selectiva a la completa sin tocar la config.

## El riesgo que mas te preocupa (UNO solo)

Que la selectiva acabe contando como puerta final sin que nadie lo vea, por tres vias: colision de huella con comandos iguales (1), selectiva sin completa (2) y completa sustituida por el clasificador al migrar (3). En los tres casos el guardian o `finish` dejan integrar con una verificacion parcial, sin error ni aviso. «La completa es la puerta» se tiene que garantizar en `resolverConfig` y en la formula de la huella, no solo en la guia.
