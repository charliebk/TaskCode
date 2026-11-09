# Informe de revision — TASK-091 (ronda 4)

- Commit revisado: afb798e1963817c1f8719a430cc1fccd6aec8080
- Revisor: code-quality-reviewer (revisor independiente, pase generico; el diff cae en TypeScript y Markdown sin revisor de dominio)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-091 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-2 | IMPORTANTE | corregido | src/commands/review.ts:909-912 | implementacion |
| MEN-3 | MENOR | corregido | CHANGELOG.md (entrada TASK-091) | implementacion |
| IMP-3 | IMPORTANTE | abierto | src/commands/review.ts:909-912 (`estadoBase`; tambien en el mensaje de arbol sucio, linea 927) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Veredicto propuesto por el revisor: cambios-solicitados.

### IMP-2 (ronda 3), corregido

El mensaje ya no promete nada del reintento. El test «selectiva en rojo aborta…» asevera la frase nueva y `doesNotMatch /no repite/`; el test «primera ronda en rojo, develop avanza…» comprueba que el reintento integra el commit nuevo. Mutante (texto de la ronda 3) -> caen `not ok 11` y `not ok 12`; restaurado, 30/30.

### MEN-3 (ronda 3), corregido

El CHANGELOG dice «en la primera, despues de integrar la base; las rondas incrementales no la integran» y que «el mensaje dice si la base quedo integrada». Coincide con README y `verificacion-selectiva.md`.

### IMP-3 — «se ha integrado en la rama en este intento» es falso en un reintento sin avance de develop

La frase describe el momento de la integracion; en un reintento sin avance de develop la integracion ocurrio en el intento anterior y el reintento no integra nada, pero el mensaje es identico. Reproduccion (test temporal, revertido): selectiva ko -> review rechaza (M1); review otra vez sin cambios en develop -> mismo texto «...en este intento...» (M2); la selectiva se ejecuto 1 vez (rojo memoizado). Ningun test cubre el reintento sin avance. No cambia el estado del repo ni la accion; IMPORTANTE por coherencia con IMP-2. Sugerencia: describir el estado y no el momento, y un test de reintento sin avance que asevere que no dice «en este intento». Afecta tambien al mensaje de arbol sucio (leido, no reproducido).

## Puerta determinista y ejecucion

- Clon en carpeta de pruebas; HEAD 51dbfcb, cuyo unico cambio respecto a afb798e es la peticion. `npm install` y `npm run build` sin errores; `dist/` versionado coincide con lo compilado.
- `verificacion-selectiva` y `review-incremental`: 30 de 30 pasan (Git Bash delante en el PATH). Suite completa no ejecutada.

## Mutantes

| Mutante | Test que lo caza |
|---|---|
| Texto de la ronda 3 («reintentar no repite el merge») | `not ok 11` y `not ok 12` |
| «en este intento» (IMP-3) | Ningun test: hueco que debe cubrir la correccion |

## Lecturas fuera del contexto permitido

- `skills/task-workflow/revision.md`: obligado por la skill.
- `informe-revision-3.md` y la plantilla `informe-revision-4.md`.
- `informe-revision-2.md`, `verificacion-selectiva.md`, README del plugin: solo grep de las frases antiguas; ninguna coincidencia viva.
- `test/commands/verificacion-selectiva.test.ts`: fragmentos.
- Carpeta de pruebas borrada; el repo original no se ha tocado.
