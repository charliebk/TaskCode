# Informe de revision — TASK-023 (ronda 1)

- Commit revisado: 4d3c626901128091c6ae0f9989fbbaa7ca3c5174
- Revisor: code-quality-reviewer (independiente)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/commands/finish.ts:290-296 |
| MEN-1 | MENOR | abierto | src/core/task.ts:77 |
| MEN-2 | MENOR | abierto | skills/review/SKILL.md (paso 4) |
| MEN-3 | MENOR | abierto | docs/METRICAS.md §11 (cabecera de la tabla) |
| MEN-4 | MENOR | abierto | docs/METRICAS.md §11.1 |

## Puerta determinista

Clon limpio en C:\t\rev023, rama de la tarea, `npm install`, `npm run build`: `git status` limpio tras el build
(el `dist/src` versionado coincide con lo compilado; solo `npm install` toca `package-lock.json`, no es de la tarea).
`npm test` completo, una vez: 1176 tests, 1173 pasan, 3 fallan, y son exactamente los 3 conocidos de Windows
(approve: stat no ENOENT; plan: escritura no EEXIST; plan: rama base con estado distinto). Ningun cuarto rojo.

## Reproducciones que NO dieron hallazgo (verificado con el CLI real)

- Suma contra transcripciones reales (solo lectura), calculada aparte con un script Python independiente:
  agent-a221353b65ac29fdf = 3 847 985 (25 message.id unicos de 47 lineas); agent-a0b1c067a09b7db18 = 556 361 y
  agent-a2ad04c8097d34670 = 455 367. `taskctl registrar-coste --fase diseno --agente ...` sumo 3 847 985 y
  1 011 728 (= 556 361 + 455 367, con el id repetido deduplicado): coinciden al token.
- Transcripcion sintetica con streaming (mismo id dos veces, gana la ultima), linea sin id, `"7"` string y `-3`
  (cuentan 0), linea no JSON, linea `user` con usage: 36 tokens, igual que el calculo a mano.
- Rechazos, todos con "No se ha tocado nada" y el commit intacto: `--agente ../../x`, `--agente=` vacio,
  `--agente` sin valor, `--agente` + `--tokens`, id inexistente, id en dos sesiones (ambiguo, lista las rutas),
  transcripcion sin usage, transcripcion que suma 0, `--tokens 0`, `1e3`, `9007199254740993`, total que desborda
  el entero seguro, flag mal escrito (`--fase2`, con sugerencia).
- Precondiciones: tarea.md con cambios sin commitear aborta; rama que no es ancestro y no es la de la tarea aborta
  diciendo a cual cambiar; desde una rama descendiente funciona; tarea `terminada` (04-terminadas) suma y commitea
  solo ese fichero sin cambiar estado ni `actualizado`.
- `metricas --tokens --escribir` sobre un METRICAS.md convertido a CRLF: segunda ejecucion "sin cambios" y `cmp`
  identico (idempotente); tras cambiar un dato, el texto anterior al marcador de inicio y el posterior al de fin son
  identicos byte a byte, y todo el fichero conserva 630 CRLF / 630 LF. Sin marcadores: se anade al final.
  Marcadores rotos (sin fin, sin inicio, invertidos, duplicados): error y fichero intacto. `--escribir` sin
  `--tokens`, con `--heuristica`, `--tokens=5`: errores claros. tarea.md invalido (`12k`) con `--escribir`:
  aborta sin tocar el fichero; `-5` y `1.5` se rechazan en la validacion; sin `--escribir` solo advierte.
- Skills instaladas: `coste.md` y las de fase no mencionan TaskCode, rutas ni documentos internos; la instruccion
  (`--agente <id>`, la cifra de la notificacion NO es el coste, `--tokens` solo como estimacion/salida de
  emergencia, `--agente` y `--tokens` no se combinan) es coherente entre `coste.md`, `plan`, `start`, `review`,
  `finish` y `task-workflow/SKILL.md`.
- Seccion 11 de METRICAS.md, recalculada desde la tabla: medias por rondas (2,62 n=18; 6,50 n=6; 8,57 n=3),
  por heuristica (3,32 n=17; 5,17 n=9; 9,0 n=1), por declarada (1,67 n=3; 3,81 n=13; 3,97 n=7), Spearman rondas
  0,69 y declarada 0,54, y cuota de revision 71-100 % / diseno 0-12 %: todo coincide con el texto. Recalculado desde
  las transcripciones con la regla "un solo TASK-NNN entre descripcion y prompt", las filas de TASK-033 en adelante
  se reproducen exactamente (033: 0,3/1,7/7,0; 040; 052; 056...).
- Mutacion (10 mutantes, ninguno de los cuales esta en el Resultado ni en los commits; suite acotada a los ficheros
  de la tarea; todos MUERTOS, algun test se pone rojo):
  1. dedupe por message.id: primera aparicion en vez de ultima (2 rojos).
  2. quitar `cache_read_input_tokens` de la suma (1 rojo).
  3. quitar la condicion `isAncestor` de la precondicion de rama (2 rojos).
  4. quitar el guard de tarea.md sucio (1 rojo).
  5. quitar el `Set` que deduplica `--agente` repetidos (1 rojo).
  6. aceptar transcripcion ambigua (1 rojo).
  7. regex de agentId laxa `^.+$` (3 rojos: la proteccion contra path traversal tiene red).
  8. `null` cuenta como 0 en la celda de tokens (5 rojos).
  9. `--escribir` con advertencias de tarea invalida (1 rojo).
  10. aceptar tokens negativos en la validacion de tarea.md (2 rojos).

## IMP-1 — el aviso de `finish` manda registrar con la semantica ya descartada

`src/commands/finish.ts:290-296`: cuando falta `tokens_diseno` o `tokens_revision`, el aviso dice
`taskctl registrar-coste <ID> --fase <f> --tokens N (suma el uso de cada subagente de la fase mas una estimacion de
la parte propia)`. Tras la decision de Carlos (la cifra que Claude Code da al terminar un agente es su contexto
final, no su coste) eso es justo la trampa que `coste.md` y las skills de fase advierten: quien lea solo el aviso
sumara a mano esas cifras con `--tokens`, y la tarea queda con el coste inflado/erroneo, sin que nada lo detecte. El
camino correcto (`--agente <id>`) no aparece en el aviso. Reproduccion: cerrar con `taskctl finish` cualquier tarea
con `tokens_diseno: null` y leer el aviso. Correccion: `... --fase <f> --agente <id> [--agente <id2>...]` (y
`--tokens N` solo como estimacion de la parte propia o salida de emergencia, como en `coste.md`); ajustar el test
del aviso si asevera el texto.

## MEN-1 — comentario de `Task` desactualizado

`src/core/task.ts:77`: «suma del uso que Claude Code devuelve al terminar cada subagente». Tras el cambio a
`--agente` es lo contrario de lo que se hace: es la suma de las llamadas de la transcripcion. Corregir el
comentario.

## MEN-2 — redaccion rota en la skill `review`

`skills/review/SKILL.md`, paso 4: «Registra el coste de la revision ...: suma el total de tokens: con el id que
devolvio la herramienta Agent...». La frase «suma el total de tokens:» sobra y deja el parrafo ininteligible.
Reescribir sin ella.

## MEN-3 — la §11 se contradice con su propia tabla

Texto: «Las tareas sin complejidad conocida quedan fuera.» La tabla incluye TASK-056 a TASK-059 con declarada `—`.
(Los promedios por declarada si las excluyen, 3+13+7 = 23 de 27, asi que las cifras son correctas; es la frase la que
no.) Ajustar la frase a «quedan fuera de las medias por complejidad declarada».

## MEN-4 — limites de la §11 que conviene decir

- «Lo que mejor predice el coste son las rondas» es en buena parte tautologico: el coste es la suma de las rondas
  de revision. Conviene decirlo, porque la conclusion 3 de §11.2 (las rondas no se conocen al planificar) ya lo
  sugiere.
- El Spearman de la heuristica (0,52, «puntos») no se puede reproducir desde la tabla, que solo trae el nivel; con
  el nivel sale 0,57.
- La atribucion tarea/fase de las filas anteriores a TASK-033 no sale de una regla unica reproducible: con «un solo
  TASK-NNN entre descripcion y prompt» difieren 9 de 41 filas (015, 016, 017, 025, 027, 028, 029, 030, 032;
  p. ej. TASK-016 = 43,6 en el doc frente a 35,6, por un revisor que nombra TASK-012 y TASK-016). El doc ya trata ese
  periodo como no comparable y las conclusiones se apoyan en el homogeneo, que si se reproduce; basta una frase
  diciendo que en el periodo antiguo hubo criterio manual.

## Veredicto sugerido

aprobada-con-correcciones (IMP-1 a corregir; los MENOR, a criterio de Carlos). El nucleo (suma, precondiciones,
validacion de id, preservacion byte a byte del METRICAS.md, red de tests) se comporta como dice y esta protegido.
