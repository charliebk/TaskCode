# Brainstorm — TASK-098, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

Referencias relativas a `taskcode-marketplace/plugins/taskcode-plugin/` salvo las de ToolsaWeb y OpenDockTrading.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Se pisa el ROADMAP de OpenDockTrading si la marca se detecta por subcadena.** OpenDockTrading no declara `rutas_sincronizacion` (`OpenDockTrading/.taskcode/config.yml:1-4`): solo lo protege la marca. Su ROADMAP contiene «taskctl» en el cuerpo (`tareas/ROADMAP.md:113`, `:240`), la frase «generado por … no editar a mano» (`:190`) y marcas `<!-- manual:inicio -->`/`<!-- manual:fin -->` (`:5`, `:186`). Mitigación: marca exclusiva, exacta y con versión, buscada en una posición fija (una línea concreta), y que las marcas de zona manual de taskctl no se confundan con las suyas.
2. **Lo mismo en ToolsaWeb**, que tampoco declara el ROADMAP en rutas (`ToolsaWeb/.taskcode/config.yml:10-14`); su línea 3 es `<!-- generado por scripts/grafo-tareas.py --escribir; no editar a mano -->`. Mitigación: la de 1 y un test con las dos copias reales.
3. **«No existe» se mira en la rama, no en el proyecto.** Una rama creada antes de que el ROADMAP ajeno estuviera en develop, o un `git rm` temporal, hace que taskctl cree el suyo; al integrar, conflicto add/add o sustitución del ajeno. Mitigación: no crear si existe en la rama de integración o si `git log --all -- tareas/ROADMAP.md` tiene historia.
4. **Conflicto de merge seguro con ramas paralelas.** Si `start` y `review` regeneran en la rama de la tarea, dos ramas vivas cambian las mismas líneas («En marcha», la tabla); el merge del script (`_gitflow-common.sh:474`) falla y `finish` aborta (`finish.ts:560-566`), igual `update-feature.sh:62`. Mitigación: que `finish` resuelva el conflicto de ese único fichero regenerándolo, o regenerar solo en la rama de integración.
5. **Se mete en el commit automático trabajo sin commitear.** `start`, `review` y `finish` no exigen workspace limpio (`sincronizacion.ts:103-104`); una zona manual editada sin commitear se la lleva `add -A` (`git-commit.ts:245`) o la pisa la regeneración. Mitigación: la salvaguarda (a) de TASK-033 (`sincronizacion.ts:108-122`): con cambios, no regenerar y avisar, comparando también con el nombre real en disco.
6. **Una sola `tarea.md` rota bloquea todas las transiciones.** Con ~300 tareas, un frontmatter inválido, una dependencia inexistente o archivada, o un ciclo que lancen excepción tumban la transición; en `finish` el merge ya está hecho (regla de `sincronizacion.ts:20-23`). Mitigación: generación tolerante, como el tablero con sus `advertencias` (`finish.ts:673-676`); cualquier fallo deja el ROADMAP como estaba y solo avisa.
7. **Mayúsculas y CRLF en Windows**: `Tareas/roadmap.md` frente a `tareas/ROADMAP.md` (precedente `sincronizacion.ts:231-243`); un ROADMAP con CRLF puede dar diff de todo el fichero o una zona manual no reconocida. Mitigación: nombre real en disco y marcas comparadas ignorando el final de línea.

## Estados intermedios y fallos parciales

- Con el ROADMAP en `rutasComando`, un fallo de su `git add` tumba el commit de la tarea (`git-commit.ts:244-251`): prepararlo aparte, como las rutas de sincronización (`git-commit.ts:215-227`).
- Un ROADMAP sin trackear hace abortar la siguiente transición por el guard (`ensureBaseBranchReady`, `approve.ts:18`).
- Con un comando de sincronización propio que escriba el ROADMAP, el detector de ficheros ajenos (`sincronizacion.ts:158-175`) puede señalarlo.
- Tests que cambian de expectativa: `auto-commit.test.ts:188` (deepEqual a un solo `tarea.md`) y `registrar-coste.test.ts:65` (no es una transición: si el gancho va dentro de `autoCommit`, rompe con razón); y las aserciones de `status --porcelain` vacío.

## Compatibilidad hacia atras

- El criterio 2 obliga a no escribir nunca sin la marca: ToolsaWeb y OpenDockTrading quedan igual mientras la marca sea inequívoca.
- El comentario de `config.ts:281-283` («taskctl solo escribe dentro de las carpetas de estado») deja de ser cierto: reescribirlo y revisar lo que se apoya en él.
- OpenDockTrading tiene en cola su propia TASK-068, «Roadmap siempre al día tras cada transición de taskctl» (`tareas/ROADMAP.md:240`): dos generadores si se hace allí en paralelo.
- Con una versión vieja del plugin, el ROADMAP con marca queda desactualizado sin avisar.

## Vuelta atras

- Bajar de versión: el ROADMAP con marca se queda obsoleto; se borra con un commit.
- Un ROADMAP ajeno sobrescrito y commiteado se recupera con `git checkout <sha>~ -- tareas/ROADMAP.md`.
- Sin retorno: una edición sin commitear sobrescrita por la regeneración (punto 5).

## El riesgo que mas te preocupa (UNO solo)

La detección de la marca en OpenDockTrading: sin `rutas_sincronizacion`, con «taskctl» y «generado por» en el cuerpo y con marcas `manual:inicio` parecidas a las que taskctl querrá usar. Una comprobación laxa rompe la regla número uno en la primera transición allí.

Sin verificar: que `start` y `review` commiteen en la rama de la tarea (base del punto 4) y el comportamiento real con CRLF.
