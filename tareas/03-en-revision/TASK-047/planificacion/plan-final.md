# Plan — TASK-047: F5-T3 Flags desconocidos y mensajes de review

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Tres cambios pequenos y separables, cada uno extendiendo algo que ya existe.

1. **Sugerencia unica** — `src/core/sugerencia.ts` (nuevo): `distanciaEdicion`
   y `masParecida(clave, validas)` con el umbral `max(1, floor(len/3))`. Hoy
   hay tres copias privadas identicas en `core/config.ts`, `core/heuristica.ts`
   y `core/catalogo-skills.ts`; pasan a importarla sin cambiar sus mensajes.
   El `modoFlujo` de `config.ts` (umbral 3) se queda como esta.
2. **Flags desconocidos** — `src/cli/args.ts` gana
   `rechazarFlagsDesconocidos(argv, validos, comando, fail)`. Mira argv en
   bruto (varios comandos no usan `parseArgs`): los tokens `--x` (nombre antes
   del `=`) y los cortos declarados. Mensaje con la forma del de config:
   `taskctl <cmd>: flag desconocido "--x".` / `Quiza quisiste decir "--y".` /
   `Flags validos: ...`. Cada `runXCommand` de `src/commands/` (`new`,
   `import`, `board`, `start`, `plan`, `approve`, `review`, `finish`,
   `codex-review`, `veredicto`, `pausa`, `siguiente`, `cadena`) declara su
   `FLAGS_<CMD>` junto a su parser y llama a la guarda al principio con su
   propia clase de error, asi el despacho de `cli.ts` no cambia. `wrappers.ts`
   queda fuera (ya valida con `spec.opciones`). `--cadena` no va en las
   listas: `cli.ts` lo quita antes de despachar. Un valor negativo (`-1`) no
   es un flag.
3. **Salida de review** — la peticion sustituye `- Agente revisor sugerido: X`
   por `- Agente a lanzar: <agente_revisor> (modelo sugerido: <modelo>)` y
   `- Skill revisora a cargar: <skill>`. `ReviewCommandResult` gana `agente` y
   `modelo`. `cli.ts` imprime `Lanza el agente "<agente>" (modelo <modelo>)
   cargando la skill "<skill>" con esa peticion y vuelca su salida en
   <informe>.` `modelo_sugerido` es tambien el modelo del revisor por §16.6
   de la metodologia («el agente revisor ... deban usar ese mismo modelo»),
   lo que resuelve la suposicion que el rol dejo abierta.
4. **Helpers compartidos** — `src/fs/rondas.ts` gana `INFORME_CODEX_RE` y
   `ultimaRondaAprobada(dir, re)`. `finish.ts` los usa y borra
   `informesDeLaRonda` y su regex privada; `codex-review.ts` borra
   `revisionPrimariaAprobadaDe`. La regex se reexporta para `siguiente.ts`.
   Precedente: TASK-036 ya movio `INFORME_REVISION_RE` aqui por lo mismo.

Orden: 1 → 2 → 3 → 4, y al final `HALLAZGOS.md` (el flag ignorado en silencio
queda corregido para todo el CLI) y el comentario de `cli/asignado.ts`.

## Lo que el rol no cubrio

- Testing y riesgos no se lanzaron (tarea `simple`, un rol). Lo minimo de
  ambos queda en las dos secciones de abajo.

## Riesgos aceptados y que los contiene

- `--titulo --urgente`, que hoy pasa en silencio, empezara a abortar; la via
  de escape es `--titulo=--urgente`. Es el comportamiento buscado.
- Un script que hoy pasa un flag inventado deja de funcionar a proposito.
- Desviacion de la letra del criterio 3: el helper se saca a `fs/rondas.ts`
  en vez de exportarlo desde `finish.ts` (un comando que importa internos de
  otro es el acoplamiento que se quiere evitar). El espiritu —una sola
  implementacion— se cumple.

## Plan de pruebas

- Contra repos temporales: `taskctl new --complejida trivial` aborta con la
  sugerencia `--complejidad` y la lista, y no crea la tarea.
- La guarda en un test por comando de los que la ganan (flag valido pasa,
  inventado aborta), y unitarios de `rechazarFlagsDesconocidos` (`=`, `-1`,
  corto declarado, `--` sin nombre).
- `review`: la peticion y stdout nombran agente, skill y modelo. Cambian los
  asserts de `test/commands/review.test.ts` y `test/cli/main.test.ts` que
  citaban «Agente revisor sugerido».
- `finish` y `codex-review` siguen abriendo y bloqueando la puerta igual.
- Mensajes de config, heuristica y catalogo identicos tras extraer la
  sugerencia (los tests existentes lo cubren).
- Suite completa: solo los 3 rojos conocidos de Windows.

## Lo que necesita decision de una persona

Nada: la desviacion del criterio 3 se aprueba como orquestador (backlog en
continuo autorizado por Carlos) y queda anotada en el Resultado.
