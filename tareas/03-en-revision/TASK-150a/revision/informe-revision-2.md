# Informe de revision — TASK-150a (ronda 2)

- Commit revisado: be1b22bee68ee884aa2c8a800e51aa06e1bfa23e
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md:36 (y :102) | implementacion |
| MEN-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md:357 (java-spring-reviewer/SKILL.md:219, rust-wasm-reviewer/SKILL.md:379) | plan |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md:3 | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md:34 | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts:43-49 | implementacion |
| MEN-4 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts:64 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Verificacion de los hallazgos de la ronda 1

- **IMP-1 (corregido).** `rust-wasm-reviewer/SKILL.md:36` dice ahora «**lee siempre** el llamador» y la linea 110 manda anotar en «Lecturas fuera del contexto permitido». La linea 120 dice «lo lee como contexto». `git grep` de `pide siempre|lo pide como contexto|se pidio|pidelo|pedirlo explicitamente` sobre `skills/` y `agents/` no devuelve nada. La mutacion pedida (volver a poner «**pide siempre**») pone en rojo `fuente-unica` (`not ok 2`). Tambien caen «lo pide como contexto» en la linea 120. La variante sin negrita no cae: ver IMP-2.
- **MEN-2 (corregido).** La descripcion de `csharp-autocad-ifc-reviewer/SKILL.md:3` lista `.cs, .csproj, .sln, .ifc, .ifcxml o .ifcjson`, igual que `patrones_archivo` (linea 25).
- **MEN-3 (corregido).** `sincronizacion.md:34` dice «Las demas son opcionales». La regla de declaracion ya cubre las cuatro claves. Mutacion de «Las demas son opcionales» por «La tercera es opcional»: cae `fuente-unica` (`not ok 1`).
- **MEN-1 (aceptado en ronda 1, sin cambio).** Sigue «Contexto adicional pedido» en las tres plantillas. Lo quita TASK-150b.

### IMPORTANTE-2 — el test de «pide siempre» solo caza la version con negrita (introducido por la correccion)

- Donde: `test/skills/fuente-unica.test.ts:43-49`, regex `/\*\*pedirlo explicitamente\*\*|\*\*pide siempre\*\*|pidelo si un|lo pide (para un hallazgo|como contexto)/`.
- Que pasa: el test añadido para IMP-1 exige las negritas en `**pide siempre**`. La ronda 1 pedia cubrir la familia, por ejemplo `\bpide siempre\b`. Sin negrita, la misma contradiccion pasa el test.
- Reproduccion (clon en be1b22b, `npx tsc -p .` y `node --test dist/test/skills/fuente-unica.test.js dist/test/skills/crecimiento-suite.test.js`):
  1. Base: 3 tests, 0 fallos.
  2. Sustituir `**lee siempre**` por `pide siempre` (sin negrita) en `rust-wasm-reviewer/SKILL.md:36`: los 3 tests siguen en verde (`# pass 3`, `# fail 0`). La frase contradictoria vuelve y ningun test la detecta.
  3. Restaurado con `git checkout`.
- Impacto: el criterio «un test por regla falla si vuelve la frase contradictoria» no se cumple para la variante sin negrita, que es la forma natural en que la frase reaparecería (la linea 36 original la tenia en negrita, pero cualquier reescritura la pierde). Es el mismo fallo que IMP-1, reducido a un caso mas estrecho.
- Sugerencia: cambiar la expresion por `/\bpedirlo explicitamente\b|\bpide siempre\b|pidelo si un|lo pide (para un hallazgo|como contexto)/` (sin el `\*\*`), y volver a mutar la version sin negrita: debe caer.

### MENOR-4 — indentacion rota en el test de descripciones

- Donde: `test/skills/fuente-unica.test.ts:64`.
- Que pasa: el diff de la correccion movio la llave de cierre del bucle al final de la linea del `assert.match` (`...no dice cuando se usa`);  }`), con dos espacios y sin salto de linea. Compila y el test es equivalente, pero el bucle queda ilegible.
- Impacto: ninguno funcional.
- Sugerencia: restaurar la llave en su propia linea con la indentacion del bloque.

### Comprobaciones sin hallazgo

- Build: `npx tsc -p .` sin errores.
- Tests de skills del plugin: `node --test "dist/test/skills/**/*.test.js"` en be1b22b: 115 tests, 115 pasan, 0 fallos, 0 saltados.
- La suite completa en be1b22b ya estaba verde en la verificacion selectiva de la peticion (2064 tests, 0 fallos, `Commit verificado` igual al `Commit revisado`). No se repitio.
- El commit `94b2cd5` (HEAD actual de la rama) solo añade ficheros de `tareas/`; fuera del alcance de la revision.
- Residuos: ningun texto de `skills/`, `agents/` o `docs/` contiene «La tercera es opcional», «pide siempre», «pidelo» ni «pedirlo explicitamente» en be1b22b.

## Regla 4D

- Duplicacion: cumple (la expresion del test repite una lista de frases, pero no duplica una decision: cada frase es una variante distinta a vigilar).
- Desviacion: cumple (el diff de la correccion se limita a los casos de la ronda 1; el cambio de indentacion de MENOR-4 es cosmetico).
- Diluvio: cumple (ningun test nuevo; la correccion solo ajusta los existentes).
- Disfraz: IMP-2 (el test que debia caer con la variante sin negrita no cae; el criterio no se cumple para esa variante).

## Lecturas fuera del contexto permitido

- `skills/code-quality-reviewer/SKILL.md` (la skill que pidio el encargo, cargada para el pase).
- `tareas/03-en-revision/TASK-150a/revision/informe-revision-1.md`: lo pidio la peticion como base de la verificacion.
- `test/skills/fuente-unica.test.ts` completo y `skills/csharp-autocad-ifc-reviewer/SKILL.md:25`: lectura de los fragmentos del diff y del patron que verifican MEN-2 y el test de IMP-1.
- `git grep` sobre `skills/`, `agents/`, `docs/`: busqueda de residuos de IMP-1 y MEN-3.
- `revision.md` no se leyo en esta ronda; la plantilla de hallazgos y la cabecera se tomaron del informe de la ronda 1 y de la peticion.
