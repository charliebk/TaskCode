# Brainstorm — TASK-072, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura (ac9682a0042de6361)

## Enfoque

Hay una sola pieza que ejecuta y memoriza la verificación (`src/fs/verificacion.ts`) y la usan tres consumidores. `finish` la ejecuta, o reutiliza el memo, antes del primer efecto. El hook PreToolUse nuevo solo **lee el memo** y nunca ejecuta nada. Copia la forma de TASK-071: decisión pura (`src/hooks/guardia-merge.ts`) más un punto de entrada fino (`src/hooks/pre-tool-merge.ts`).

La decisión que más preocupa: el hook se resuelve sin ejecutar nada, con la huella **del commit de la rama que se mergea**. No vale la del HEAD actual: al hacer `git merge feature/x`, HEAD es `develop`, y `huellaDelArbol` usa HEAD (verificacion.ts:84). Si no hay verde memorizado para ese commit, la verificación se trata como «no verde».

## Piezas y limites

- `src/fs/verificacion.ts` — se extiende con tres cosas:
  - `verificarConMemo(raiz, comando, timeoutS, opts)`: los pasos 8–9 de `freno-stop.ts:169-193`, sacados de ahí.
  - `huellaDeCommit(raiz, ref, comando, timeoutS)`: la misma fórmula de `huellaDelArbol` con el conjunto de ficheros sucios vacío, así que coincide con ella cuando el árbol está limpio.
  - `timeoutEfectivoS`, que pasa aquí desde `freno-stop.ts`.
  Así los tres consumidores generan la misma huella y no hay que tocar `VERSION_MEMO`.
- `src/hooks/freno-stop.ts` — se extiende (solo refactor). Usa `verificarConMemo` y no cambia de comportamiento. Si no se hace, `finish` duplicaría la lógica de memo, huella y aviso de «árbol cambiado».
- `src/commands/finish-opciones.ts` + `finish.ts` — se extienden.
  - `--sin-verificacion` entra en `FLAGS_FINISH` y en `FlagsCierre` (vía `extraerFlagsCierre`).
  - La puerta va en `runFinishCommand` al final del bloque de solo lectura: después de la colisión de IDs y antes de `abrirMergeRequestYAnotar` y `runGitflowScript` (finish.ts:437/503). Corre en la rama de la tarea, con el workspace ya comprobado limpio.
- Registro del salto en la tarea — helper nuevo en `src/core/transiciones.ts`, junto a `registrarTransicion`: `anotarVerificacionOmitida(body, fecha)`. Se escribe en la reescritura posterior al merge (finish.ts:589) y también en el camino del MR que se abre. Escribirlo antes del merge ensuciaría el workspace y rompería el guard de §8.3.
- `src/core/comando-merge.ts` — se crea, puro y sin I/O. `analizarComando(cmd) -> { tipo: 'merge' | 'script-cierre', fuente, destinoImplicito? } | null`. Aparte porque el hook debe descartar casi todos los `git *` sin lanzar ningún proceso.
- `hooks/hooks.json` — se extiende y sustituye a la sonda. El `if` actual (`Bash(git *)`) no ve `bash merge-feature-to-develop.sh`, así que hay que añadir entradas `Bash(bash *)`/`Bash(sh *)` y sus equivalentes de PowerShell, todas apuntando a `dist/src/hooks/pre-tool-merge.js`. `sonda-hooks.mjs` sale del hooks.json.

## Orden de construccion

1. Extender `verificacion.ts` (`verificarConMemo`, `huellaDeCommit`, `timeoutEfectivoS`) y pasar `freno-stop.ts` a usarlo, sin cambios de comportamiento. Se puede entregar solo.
2. Puerta en `finish`: flag, llamada a `verificarConMemo` con salida abortiva, y `anotarVerificacionOmitida` en los dos caminos de cierre. Con esto la capa 1 queda completa.
3. `core/comando-merge.ts` puro (comando → fuente y destino).
4. `hooks/guardia-merge.ts` con `decidirPreToolUse(entrada, deps)`, las guardas de la más barata a la más cara como en `freno-stop.ts`, y `hooks/pre-tool-merge.ts` con salida 0/2. Guardas, en orden: interruptor; analizar el comando; config y `comando_verificacion`; rama destino frente a `resolveIntegrationBranch`/`resolveMainBranch`; `rev-parse` de la fuente, `huellaDeCommit` y `leerMemo`.
5. Cambiar `hooks.json` y actualizar el test que cruza `TECHO_HOOK_S` con hooks.json.

## Alternativa descartada

- Que el hook ejecute la verificación. Su timeout es de 30 s y la suite tarda unos 10 min aquí; además se dispararía en cada `git *` de todos los proyectos con el plugin.
- Registrar el salto en un campo nuevo del frontmatter: obligaría a tocar parser, serializador, plantillas y board para un dato de auditoría. Una anotación en el cuerpo (precedente: `## Merge request`, `## Transiciones`) no cambia el esquema.

## Desacuerdos previstos

- riesgos — sin memo o con memo de otra huella. Posición: el hook bloquea y remite a `taskctl finish`, que sí verifica. Fallar abierto convierte la guardia en decorativa.
- riesgos — comandos compuestos (`git checkout develop && git merge x`, alias, `-C`). Posición: analizador conservador sobre fuente y destino; no se emula el shell; la red real es la capa de `finish`.
- dominio — «verificación en rojo» se mide sobre el commit fuente y no sobre el resultado del merge. Aceptado.

## Suposiciones no verificadas

- Que el filtro `if` de hooks.json casa por prefijo y no ve un `git merge` detrás de `cd x &&` (documentación oficial y registros H4 de TASK-069).
- Que el agente lanza `finish` en la rama de la tarea.
- Que los scripts `merge-*-to-*.sh` reciben la rama fuente como primer argumento posicional (finish.ts:497).
- Que ningún test ni documento obliga a que `sonda-hooks.mjs` siga referenciado.
- Si el camino idempotente (finish.ts:474) y el segundo `finish` del MR deben volver a verificar (lo decide dominio).

Ficheros consultados: src/fs/verificacion.ts, src/hooks/freno-stop.ts, src/hooks/stop-verificacion.ts, src/commands/finish.ts, src/commands/finish-opciones.ts, src/core/transiciones.ts, hooks/hooks.json, hooks/sonda-hooks.mjs.
