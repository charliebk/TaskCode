# Informe de revision — TASK-117 (ronda 2)

- Commit revisado: f623b527137e4a31648768279a13ad20514cd20c (HEAD; el codigo y los tests son los de 321d4fa, porque f623b52 solo anade la peticion. La peticion citaba 267669b, que es el veredicto de la ronda 1)
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

Verificacion acotada (ronda 2): solo se comprueban IMP-1, MEN-1, MEN-2 y MEN-3 y lo que abren las correcciones. No se revisa la rama entera.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | aceptado | src/commands/new.ts:380-387 (efecto en src/core/heuristica.ts:653-654) | plan |
| MEN-1 | MENOR | corregido | src/commands/new.ts:52-60 | implementacion |
| MEN-2 | MENOR | corregido | src/cli.ts:478-483 | implementacion |
| MEN-3 | MENOR | corregido | test/commands/new-complejidad.test.ts:102-118 | implementacion |

### IMP-1 — aceptado (solo se verifica la documentacion)

Aceptado por decision del coordinador, como indica la peticion. Compruebo que lo escrito es correcto:

- `new.ts:52-60`: "sin --complejidad, null" es cierto. `parseNewTaskArgs` deja `DEFAULT_COMPLEJIDAD` (null) en `new.ts:194`.
- "La propuesta cuenta como declarada": cierto. `new.ts:387` asigna `opts.complejidad`, y `crearTareaEn` la escribe en `tarea.md`, asi que la heuristica la ve como declarada.
- "La heuristica toma el maximo entre declarada y propia, asi que solo puede subir el numero de roles": cierto y sin condiciones. `heuristica.ts:653-654` calcula `Math.max` sobre `[declarado, nivelH]`, y sin declarada solo queda `nivelH`. Como el maximo nunca es menor que cada uno de sus terminos, la propuesta no puede bajar el numero de agentes con ninguna configuracion. La tabla por defecto (`scripts/heuristica-complejidad.yml:183-187`, valores 0, 1, 2, 3, 4) es ademas monotona.
- Omision menor (no bloquea): el informe de la ronda 1 dice que la propuesta tambien activa `hayDiscrepancia`. Eso no aparece en el comentario de `new.ts`. No lo he re-verificado en `heuristica.ts`.

### MEN-1 — corregido

El comentario de `new.ts:52-60` ya describe el comportamiento real: `null` por defecto, propuesta de las terminadas parecidas, y si no hay ninguna queda `null` y decide la heuristica. Lo comprobe contra `new.ts:194` y `new.ts:380-387`. No abre nada nuevo.

### MEN-2 — corregido

El texto del CLI (`cli.ts:478-483`) ahora dice "mediana, la inferior si son pares". El test `new-complejidad.test.ts:120-133` lo fija con una expresion regular y pasa (ver abajo). Calcule a mano el caso del test: TASK-001..004 con complejidades alta, simple, media y trivial dan 4 valores; ordenados, `floor((4-1)/2)=1`, es `simple`, que es lo que imprime. Coincide.

Nota sin consecuencia: la frase "la inferior si son pares" aparece tambien con un numero impar, donde no aplica. Se lee bien como aclaracion, asi que no lo cuento como hallazgo. El comentario `// MEN-2 de la revision...` queda dentro de la expresion ternaria (`cli.ts:480`). Compila y es valido, pero es poco habitual; es cosmetico.

### MEN-3 — corregido

El test `new-complejidad.test.ts:102-118` crea una terminada con YAML roto (`etiquetas: [cli, git`) y comprueba que `new` no aborta, asigna `TASK-007` y propone a partir de `TASK-001..003`. Es discriminante. Lo verifique por mutacion:

- En una copia temporal de `dist` (fuera del repo), en `dist/src/fs/task-store.js` cambie el `ilegibles.push(...)` de `listTareasEnEstados` por un `throw new Error("MUTANTE_MEN3")`.
- Resultado: `not ok 1 - new (TASK-117, MEN-3): una terminada ilegible se ignora y no aborta new`, con `error: 'MUTANTE_MEN3'`. Salida 1.
- Con el codigo real, el mismo test pasa.

No abre nada nuevo.

## Reproduccion

Desde `taskcode-marketplace/plugins/taskcode-plugin`, en Git Bash, sobre la rama `feature/task-117-p-9-new-propone-la-complejidad-a-partir`:

1. `npm run build`: `tsc -p tsconfig.json`, sin errores, salida 0.
2. `node --test dist/test/commands/new-complejidad.test.js dist/test/core/complejidad-similar.test.js dist/test/commands/new.test.js`: **27 tests, 27 pasan, 0 fallan**, salida 0.
3. Mutacion de MEN-3 (ver arriba): el test se pone en rojo con el mutante y pasa sin el.
4. Comprobacion del repo despues del build: `git status --short` vacio, HEAD `f623b52`, rama correcta. No hay commits ni cambios en el arbol.
5. Los `new` del CLI de los tests se ejecutan en repos temporales del directorio de temporales del sistema, nunca en el repo real. No se ejecuto `taskctl` ni `bin/taskctl` por mi cuenta.

No se ejecuto la suite completa (`npm test`) ni `verificar-impacto.mjs`, como pide la peticion. Los 909 tests en verde que cita la peticion provienen de la ejecucion del coordinador sobre 267669b; no los he verificado yo.

## Comprobado sin hallazgo

- Orden de `new`: la lectura de terminadas (`new.ts:380-382`) va despues del guard de rama (`new.ts:375`) y antes de escribir, que es lo que ya estaba en la ronda 1.
- El `proponerComplejidad` de `complejidad-similar.ts`: solo se quedan las terminadas con mas etiquetas en comun, la comparacion ignora mayusculas y duplicados (`Set`), y `desde` queda ordenado. No cambio desde la ronda 1.
- `--complejidad` solo acepta valores de `TASK_COMPLEXITIES` (`new.ts:197-206`). No hay forma de declarar `null` explicito que dispare la propuesta, asi que el criterio 2 se cumple.
- El cambio de texto del CLI no toca `import` ni `doctor-deploy`: `import.ts:66` sigue diciendo que sin `--complejidad` la tarea nace con `null`, y es correcto porque `import` no propone.

## Lecturas fuera del contexto permitido

- `src/core/complejidad-similar.ts`: no estaba en la lista; se necesita para calcular la mediana del caso del CLI (MEN-2).
- `src/core/heuristica.ts:594-660`: efecto de la complejidad declarada (IMP-1) y monotonia de `agentesPorNivel`.
- `src/fs/task-store.ts` (`listTareasEnEstados`, lineas 76-110): para entender como se separan las terminadas ilegibles (MEN-3).
- `scripts/heuristica-complejidad.yml:183-187`: valores por defecto de la tabla (busqueda con grep).
- `test/agents/brainstorm-roles.test.ts`: solo aparecio en un grep, no se leyo.
- `revision.md` y la skill `code-quality-reviewer`: lectura obligatoria del propio proceso.

## Nota al coordinador

El veredicto escrito en la cabecera (`aprobada-con-correcciones`) es una propuesta. No he ejecutado `taskctl veredicto`, porque hace un commit, y no he tocado la rama. Sin CRITICO ni IMPORTANTE abiertos (IMP-1 esta `aceptado` con motivo), la ronda 2 cierra la tarea segun `revision.md`.
