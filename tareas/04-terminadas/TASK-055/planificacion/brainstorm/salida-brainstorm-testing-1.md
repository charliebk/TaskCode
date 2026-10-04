# Brainstorm — TASK-055, rol testing (ronda 1)

- Rol: `brainstorm-testing`
- Agente: taskcode-plugin:brainstorm-testing

(Respuesta volcada por quien orquesta. El agente siguio el formato fijo de su
rol y puso los mutantes en cada prueba.)

## Comprobabilidad del enfoque

Si, siempre que el nucleo sea `taskctl siguiente` y que cada fase quede
registrada en tarea.md con un commit. Asi el «que toca ahora y si se
pregunta» se comprueba con repos Git temporales reales. El markdown de los
comandos, los hooks y AskUserQuestion no se pueden probar con node:test: solo
por su forma (estatico) o con un smoke manual dentro de Claude Code.

## Pruebas que hacen falta

- `test/core/siguiente.test.ts`: tabla literal escrita a mano con estado × plan_aprobado × modo × veredicto del informe → {fase, comando, preguntar}, comparada con `deepEqual` contra la tabla entera, en proceso y sin Git. Mutantes: semiautomatico no pregunta tras review; automatico pregunta en approve; el modo por defecto pasa a automatico; con un informe que no aprueba sigue devolviendo finish.
- `test/commands/siguiente.test.ts` contra un repo temporal real, con `taskctl siguiente TASK-NNN` por spawn: salida legible por maquina parseada y codigos de salida distinguidos. Muere si la tarea inexistente o el config roto salen con 0, o si `modo_flujo: auto` se acepta.
- `test/core/config.test.ts` (ampliacion): sin clave vale manual; valor invalido aborta enumerando los tres validos; clave repetida aborta; fallo cerrado real con `siguiente` sobre un config roto.
- `test/e2e/ciclo-automatico.test.ts`: en un repo temporal, un bucle que llama a `siguiente` y ejecuta lo que devuelve; el trabajo de agente se sustituye por fixtures commiteados (plan-final.md, commit de implementacion, informe aprobado). Asevera: tarea terminada, ningun paso con `preguntar=true` tras plan, approve registrado como automatico, un commit por transicion. Muere si approve registra «persona», si se salta el registro de review o si el bucle termina antes.
- `test/e2e/ciclo-semiautomatico-no.test.ts`: plan y `siguiente` devuelve approve con `preguntar=true`; el «no» es no invocar approve. Asevera: en-diseno, plan_aprobado=false, workspace limpio, `siguiente` nombra el comando de reanudacion. Contraprueba con el «si». Mutante: que approve se ejecute en el cierre de plan.
- Guardas en automatico (validacion-puertas o e2e): WIP ocupado, base sucia, informe sin veredicto y `revision_codex: true` sin segunda opinion abortan tambien con modo=automatico.

## Lo que se rompe de lo existente

- `config.test.ts:78` («tres defaults»): entra modo_flujo; anadir aserción literal `modo_flujo === 'manual'`, porque comparar contra la propia constante no mata un default cambiado.
- `.gitattributes` `bin/* text eol=lf` se aplica tambien a `bin/taskctl.cmd`; cmd.exe tiene bugs conocidos con LF en etiquetas y goto. Decidir su eol con prueba.
- Los tests que comparan el cuerpo exacto de tarea.md (`tarea-file`, `new-contenido`, `auto-commit`) cambian si cada transicion anade una linea de registro. Legitimo solo si el registro es la seccion nueva. Sin verificar.

## No cubierto a proposito

- Que Claude Code encadene de verdad los comandos y muestre AskUserQuestion: smoke manual con guion (un ciclo automatico y uno semiautomatico con «no») en un proyecto ajeno; evidencia al Resultado.
- Que los hooks se disparen en el momento correcto: solo estatico (hooks.json parsea, eventos validos, scripts existentes) y `claude plugin validate` (skip visible si no esta `claude`).
- `bin/taskctl.cmd` en PowerShell y cmd: test win32-only sobre un clon de HEAD (patron `exportarHead` de `distribucion.test.ts`) con `cmd /c` y `pwsh -c` y `--version`; skip en Linux.

## Coste de mantenimiento

La tabla de `siguiente` duplica a proposito la de produccion. Lo caro es el
markdown de los comandos, que ningun test verifica salvo su forma: atarlo
como el test 15 de la skill — cada comando debe nombrar el subcomando que
devuelve `siguiente`.

## Desacuerdos previstos

- Con arquitectura: logica de encadenamiento en el markdown o en hooks. Posicion: todo lo que decide va en `siguiente`; el markdown solo ejecuta lo que devuelve.
- Con el orquestador: `MARCAS_DEL_REPO` de `brainstorm-roles.test.ts:179` prohibe 'taskcode', 'taskctl' y 'tareas/', pero los comandos tienen que invocar taskctl y la skill nombrar los comandos. Para commands/ la lista de marcas tiene que ser otra, explicita y justificada.
- Con riesgos: el e2e con fixtures prueba la coreografia del CLI, no la del agente. Que nadie lo venda como «e2e del plugin».

## Suposiciones no verificadas

- Estados exactos de la maquina: mirar `src/core/state-machine.ts`.
- Que el «no» de semiautomatico no deja registro en tarea.md.
- Como marca approve que la decision fue automatica (flag tipo `--automatica`); no existe hoy.
- Que plugin.json usa `taskcode` como namespace de los comandos: hoy el nombre es `taskcode-plugin`.
