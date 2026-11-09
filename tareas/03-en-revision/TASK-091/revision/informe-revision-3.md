# Informe de revision — TASK-091 (ronda 3)

- Commit revisado: 4bac229cc013fe4b6fd65c3de57340c9384b65f0
- Revisor: code-quality-reviewer (revisor independiente, pase generico; el diff cae en TypeScript y Markdown sin revisor de dominio)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-091 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido (codigo, tests y docs) | src/commands/review.ts:909-912 y 643-647 | implementacion |
| MEN-1 | MENOR | corregido | CHANGELOG.md, README.md, skills/task-workflow/verificacion-selectiva.md | implementacion |
| IMP-2 | IMPORTANTE | abierto | src/commands/review.ts:909-912 (rama de la primera ronda) y 927 (arbol sucio) | implementacion |
| MEN-3 | MENOR | abierto | CHANGELOG.md (entrada de TASK-091, frase sobre la ronda incremental) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Veredicto propuesto por el revisor: cambios-solicitados.

### IMP-2 — «reintentar no repite el merge» es falso si develop avanza entre intentos

En la primera ronda, con la selectiva en rojo, el mensaje dice «"develop" ya se ha integrado en la rama, como en cualquier review; reintentar no repite el merge». Si develop avanza entre el intento rojo y el reintento, el reintento vuelve a integrar la base con sus commits nuevos. Reproduccion (test temporal, borrado): `selectiva ko` -> `review` rechaza; commit nuevo en develop; `selectiva ok`; `review` otra vez -> `develop_nuevo_integrado_en_reintento=true`. Efecto benigno (el merge de cualquier review), pero el mensaje promete lo contrario y no lo cubre ningun test. Sugerencia: decir lo que pasa en este intento, sin prometer nada del reintento, tambien en el mensaje de arbol sucio, y un test de reintento tras avanzar develop.

### MEN-3 — el CHANGELOG no dice el caso incremental

La entrada dice «en la primera, despues de integrar la base», pero no que las rondas incrementales no la integran ni que el mensaje lo indica; README y verificacion-selectiva.md si. La linea ademas es mas larga que el resto del bloque. Correccion de dos lineas, junto con IMP-2.

### Verificacion de IMP-1 y MEN-1 (ronda 2)

- **IMP-1, corregido.** `estadoBase` depende de `incremental`; el test nuevo de la ronda incremental lo comprueba (sin «ya se ha integrado», `HEAD` igual, `otra-tarea.txt` fuera). Mutantes: `estadoBase` siempre «ya se ha integrado» -> cae el test incremental (`not ok 23`); siempre «no se actualiza» -> cae el de la primera ronda (`not ok 22`).
- **MEN-1, corregido.** «sobre la rama ya actualizada con la base» ha desaparecido de codigo, tests y documentos.

### Puerta determinista y ejecucion

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-091-r3` (borrado), HEAD 6379f7c; entre 4bac229 y HEAD solo cambia `tareas/`. `npm install` y `npm run build` sin errores; `dist/` versionado coincide con lo compilado.
- `verificacion-selectiva`, `review-incremental`, `review-camino`: 31 de 31 pasan (Git Bash delante en el PATH).
- Suite completa: 2079 tests, 2073 pass, 5 fallan, 1 skipped. Tres son los conocidos de Windows (symlink EPERM, chmod en NTFS, CRLF), iguales en develop. Los otros dos (`JSON roto o installed_plugins.json…` y `origin (TASK-038): con origin inalcanzable…`) pasan en aislado en la rama y en develop: carga o tiempo. Ninguno viene del diff.

### Mutantes

| Mutante | Test que lo caza |
|---|---|
| `estadoBase` siempre «ya se ha integrado» | `not ok 23` (ronda incremental, IMP-1) |
| `estadoBase` siempre «no se actualiza» | `not ok 22` (ronda 1, selectiva en rojo) |

## Lecturas fuera del contexto permitido

- `skills/task-workflow/revision.md`: la skill code-quality-reviewer obliga a leerlo.
- `src/core/state-machine.ts` (185-235): para confirmar que solo la primera ronda integra la base.
- `src/commands/review.ts` fuera del tramo del diff (500-560): el update de Git-Flow no corre en las incrementales.
- Tests `review-incremental`, `review-camino`, `approve`, `plan`, `doctor-hooks-subagente`, `origin-deteccion`: solo ejecutados.
- Carpeta de pruebas borrada; el repo original no se ha tocado.
