# Brainstorm — TASK-065, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **La linea base de «3 proyectos» sale con uno solo y nadie lo nota.** `parseArgs` (`src/cli/args.ts:38`, leido) guarda cada flag en un `Record`: un `--repo` repetido pisa al anterior, gana el ultimo y los demas se pierden sin aviso; con un solo repo la salida es la de hoy, como pide el criterio. Consecuencia: la cifra copiada al Resultado no es la de los tres proyectos. Mitigacion: recoger `--repo` de argv en bruto (todas las apariciones) y escribir por stderr, antes de las tablas, la lista de repos leidos con cuantas tareas aporta cada uno.
2. **Un `--repo` mal escrito o sin `tareas/` cuenta como «proyecto con 0 tareas».** `listExistingTaskIds` hace `continue` ante ENOENT (`src/fs/task-store.ts:37`, leido); `--repo` sin valor delante de otro flag da `true`. El proyecto falta de la linea base y los terciles «con todos juntos» se calculan sin el. Mitigacion: abortar si la ruta no existe o no tiene `tareas/`; rechazar `--repo` sin valor.
3. **Dos repos distintos con la misma clave `(proyecto, id)`, o el mismo repo leido dos veces.** `proyecto = path.basename(path.resolve(repoCwd))` (`commands/metricas.ts:224`, leido): dos clones o worktrees con el mismo nombre chocan; `--repo .` junto a `--repo C:\...\TaskCode`, o la misma ruta con otras mayusculas en Windows, duplica tareas. Mitigacion: normalizar con `realpath`, quitar duplicados por ruta real y abortar si dos rutas distintas comparten basename.
4. **Fallo parcial de git en un solo repo** (no es repo, `safe.directory`/«dubious ownership», `GIT_MAX_BUFFER`): el aviso actual (`metricas.ts:263`) no dice en que repo; sus tareas quedan sin cierre y pasan en silencio a «sin fecha de cierre», y el tramo se llena de otro proyecto. Mitigacion: nombrar el repo en cada aviso y dar el recuento de excluidas por proyecto.
5. **`--tramo` y combinaciones de flags sin validar.** `--tramo 0`, negativo, `2.5` o `abc` (bucle o division entre cero); `--tramo` sin `--evolucion`; `--evolucion`/`--grupos` fuera de `FLAGS_SIN_VALOR` (`args.ts:64`), asi que `--grupos=1` pasa; `--json --tokens --escribir` deja «Regenerado el bloque…» en stdout (`cli.ts:504`). Mitigacion: entero ≥ 1 o abortar; lista cerrada de flags combinables con `--json`, abortar con las demas.
6. **Tramos y terciles que cambian segun el conjunto de `--repo`.** Desempate por ID como cadena da `TASK-100` < `TASK-99`; mezclar cierres de dia (filas antiguas) con cierres con hora entre proyectos reordena tareas. Mitigacion: desempate por numero de ID; la salida lleva los cortes de KB y la lista de repos usados; los empates en el corte van siempre al mismo lado.
7. **Grupos y tramos minusculos que parecen cifras.** Menos de 3 tareas con KB deja un tercil vacio; el ultimo tramo es parcial (189 con N=20 deja uno de 9); `kbPeticionPorRonda` null. Mitigacion: cada grupo y tramo con su `n`; los nulos de KB contados aparte, nunca como KB 0.

Descartado a proposito: que `git status` de ToolsaWeb u OpenGisViewer cambie sin `--escribir` (solo lectura y `git log`, que no toca el indice; basta abortar `--repo` + `--escribir`); carrera con un `finish` en otro repo (descartada en TASK-064); coste de leer tres repos (es de arquitectura).

## Estados intermedios y fallos parciales

- Un repo de los tres falla en git o no tiene `tareas/`: hoy se veria como datos incompletos sin aviso (riesgos 2 y 4).
- Suposiciones no verificadas: que ToolsaWeb y OpenGisViewer usen las mismas carpetas de estado (`ALL_STATE_FOLDERS`); que no haya clones o worktrees con el mismo basename en la maquina de la linea base; el formato de la fecha de cierre (dia o con hora) en las filas de esos dos repos. `--repo` relativo se resolveria contra `process.cwd()` y sin `--repo` solo entra el repo actual (pendiente de arquitectura).

## Compatibilidad hacia atras

- Con un solo repo (sin `--repo`) la salida tiene que ser la de hoy.
- Arreglar `parseArgs` solo para `metricas` dejaria el mismo pisado silencioso en otros comandos: no vale un arreglo local sin aviso general.

## Vuelta atras

- La linea base copiada en el Resultado de TASK-065 es la referencia «oficial» para elegir mejoras: revertir el codigo no la retira (riesgos 1-3 la falsean sin aviso).
- La forma del objeto `--json` publicada en una version del marketplace: en cuanto un script externo la consuma, renombrar o quitar claves lo rompe; una version publicada no se retira.

Desacuerdos previstos: con arquitectura, `basename(repo)` no basta como clave (ruta real normalizada; basename solo etiqueta; abortar si dos comparten basename) y `parseArgs` no admite repetidos; con dominio, tareas con KB nulo fuera de los terciles y contadas, nunca como 0.

## El riesgo que mas te preocupa (UNO solo)

Los `--repo` repetidos que se pisan en silencio: la «linea base de tres proyectos» saldria con uno solo sin que nadie lo note.
