# Brainstorm — TASK-102, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: brainstorm-riesgos (subagente)

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Se clasifica mal el árbol de trabajo y un turno con código cuenta como «solo documentación», sin avisar.** `rutasDeTarea` (`src/fs/git.ts:1056`) solo compara commits (`base...hasta`). No ve lo que está sin commitear ni lo que no está trackeado. Escenario: el agente crea `src/nuevo.ts` sin hacer `git add` y edita `docs/x.md`. Si el árbol se saca con `git diff` sin `git ls-files --others --exclude-standard`, ese `.ts` no aparece y el Stop deja parar sin suite. Hay una variante igual de grave: clasificar los no trackeados con un matcher en JS en vez de con el pathspec `:(top,exclude,glob)` de Git. Serían dos motores con semánticas distintas (`**`, `core.ignorecase` en Windows) y el Stop y `finish` decidirían distinto para el mismo diff. Mitigación: lo no trackeado se clasifica con el mismo pathspec y con `-z`, y si cualquier paso de Git falla (merge-base incluido) el resultado es `null` (verificación completa), nunca «solo los no trackeados».
2. **`review` clasifica sobre la lista equivocada.** En `review.ts:791`, `ficherosTocados = paraRevision.incluidos` deja fuera `excluir_de_revision`, `dist/`, los lockfiles y los held-out. Si la decisión reutiliza esa lista, un cambio en `package-lock.json` o en `dist/` pasa por «solo documentación». Además, en una ronda incremental `desde` vale `previa.commit` (`:708`). Si se clasifica el delta de la ronda y no `base...HEAD`, una ronda 2 que solo toca docs se salta la suite y da otra decisión que el Stop para el mismo estado, lo que rompe el criterio 3. Mitigación: la decisión se calcula siempre con `decidirVerificacionEntre(baseBranch, 'HEAD')` y nunca con el diff de revisión.
3. **El criterio 4 choca con «la configuración se lee de la base».** `configDeRef` (`src/fs/config-de-ref.ts:14`) lanza `git show base:.taskcode/config.yml`. Si el Stop llama a `decidirVerificacionEntre` en cada turno, todos los proyectos sin la clave pagan un proceso git nuevo por turno y el test de regresión falla. Mitigación: la puerta barata mira la config del árbol, que ya se lee en el paso 5 de `freno-stop.ts:138`. Solo si declara `rutas_documentacion` se lee la de la base y se calcula el diff. Una rama que añade la clave sin que la base la tenga acaba igualmente en la completa.
4. **El Stop y `review` usan bases distintas.** El Stop usa `config.rama_base` cuando `tipo` es `null` (`freno-stop.ts:187`) y `review` usa `baseBranch`. En un hotfix eso son dos ramas, dos diffs y dos decisiones. Mitigación: los dos resuelven la base por la misma función, y el caso `tipo === null` en el Stop va a la completa.
5. **Una config de la base inválida pasa a bloquear el turno.** Hoy, con una config inválida en el árbol, el paso 7 bloquea (exit 2). Si el resultado `config-invalida` de `decidirVerificacionEntre` se manda por la misma rama, aparece un bloqueo que en la 0.14.0 no existía. `finish` lo trata como completa más un aviso (`finish-verificacion.ts:93`). Mitigación: base inválida significa la verificación de siempre más un aviso, nunca un exit 2 nuevo.
6. **La comprobación de documentación en `review` ensucia el árbol o sale en rojo a mitad de ronda.** Si se ejecuta después de escribir la petición, el autocommit de la ronda se lleva lo que haya generado. Mitigación: el mismo patrón que `verificacionSelectivaDeRonda` (`review.ts:1023`), es decir, ejecutar antes de escribir nada y lanzar `ReviewCommandError` tanto con un rojo como con `cambioElArbol`.
7. **El memo `'documentacion'` es compartido.** Lo escriben el Stop y `finish` y lo lee el guardián (`guardia-merge.ts:234`, con `huellaDeCommit` y el `timeout_verificacion` de la base). Si el Stop guarda con otro timeout (el recortado por `timeoutEfectivoS`) o con el comando de la config del árbol, la huella no casa: falla cerrado, pero «taskctl finish la ejecuta» vuelve a correrla. Y si el Stop escribe con el árbol sucio, machaca el verde que `finish` guardó para el commit, porque el fichero es uno solo y gana el último en escribir. Mitigación: para la de documentación, el comando y el timeout salen siempre de la base, igual que en finish y en el guardián.

## Estados intermedios y fallos parciales

- El Stop no escribe nada salvo el memo. Si muere a mitad, no queda nada a medias: el turno siguiente vuelve a decidir.
- `review` exige el workspace limpio (`review.ts:623`), así que su árbol son solo commits. En la primera ronda la clasificación tiene que ir **después** del update de Git-Flow que integra la base, como la selectiva. Si va antes, el merge-base está desfasado.
- Diff vacío con el árbol limpio da la completa (`verificacion-proporcional.ts:80`), que es lo que pasaba en la 0.14.0. Hay que unir commits y árbol **antes** de llamar a `decidirVerificacion`: si se decide por separado, una tarea de docs sin commits sale «vacía», y por tanto completa, en todos sus turnos iniciales.
- Ref de la base inexistente en local, clon superficial o HEAD desacoplado: `rutasDeTarea` devuelve `null`, que significa completa. Correcto siempre que el cálculo del árbol propague ese `null` y no lo trague.
- Si el Stop y `review` escriben el memo a la vez, el JSON puede quedar a medias y leerse como ausente (`fs/verificacion.ts:179`). Ya ocurría antes y no es nuevo.

## Compatibilidad hacia atras

- Sin `rutas_documentacion` en el árbol, el Stop no debe lanzar ni un git más que en la 0.14.0 (solo el `git branch --show-current` del paso 6). Esto solo se cumple con la puerta en la config del árbol (riesgo 3).
- Los proyectos que ya declararon la clave para `finish` (TASK-100) verán de repente un Stop y un `review` más laxos sin haber tocado nada. Es lo esperado, pero tiene que ir en el CHANGELOG como cambio de comportamiento.
- El formato de los memos no cambia (`VERSION_MEMO = 1`). Los ficheros `freno-verificacion*.json` que ya existen siguen siendo válidos.
- `hooks.json` y los mensajes del Stop: si cambia el texto del bloqueo, hay tests que comparan cadenas, y los proyectos ajenos no pueden ver ninguna mención al producto.

## Vuelta atras

- Es reversible por completo. Quitar `rutas_documentacion` de la config devuelve el comportamiento de la 0.14.0 en el turno siguiente. Si la puerta lee la del árbol, basta con quitarla localmente, sin commitear en la base.
- `FRENO_VERIFICACION=0` sigue siendo el interruptor de emergencia del Stop.
- No hay migración de datos. Un turno o una ronda que se saltó la suite no deja nada irreversible: `finish` sigue exigiendo la completa (o su exención ya auditada) antes del merge. Lo que se pierde son rondas de revisión gastadas en código en rojo.
- Puntos sin retorno: ninguno.

## El riesgo que mas te preocupa (UNO solo)

Que el árbol de trabajo se clasifique con un motor distinto del de `rutasDeTarea`, o sin `ls-files --others`. Es el único fallo silencioso: el Stop deja parar con exit 0 y sin mensaje, el agente cree que su turno está en verde, y nadie se entera hasta `finish`, varias rondas después. Todo el criterio 2 depende de que lo no trackeado pase por el mismo pathspec de Git y de que cualquier fallo intermedio acabe en `null`.

---
Comprobado leyendo el código: `src/hooks/freno-stop.ts`, `src/commands/review.ts` (líneas 623, 704-800 y 1023-1063), `src/fs/git.ts:1044-1073`, `src/core/verificacion-proporcional.ts`, `src/fs/decision-documentacion.ts`, `src/fs/config-de-ref.ts`, `src/fs/verificacion.ts`, `src/hooks/guardia-merge.ts:205-243` y `src/commands/finish-verificacion.ts:87-260`. Sin comprobar (suposiciones): que la suite del Stop no ejecute los held-out de `tareas/**/aceptacion/`. Si los ejecutara, «solo documentación» dejaría de comprobarlos en los turnos que los tocan.
