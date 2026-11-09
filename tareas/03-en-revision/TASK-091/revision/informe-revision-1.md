# Informe de revision — TASK-091 (ronda 1)

- Commit revisado: 859499e9ca48bd79e9f23dde616ff18f910b2748
- Revisor: code-quality-reviewer (agente revisor independiente; llego por el pase generico, el diff cae en TypeScript/Markdown/config sin revisor de dominio)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/commands/review.ts:~646 (`verificacionSelectivaDeRonda`) y su mensaje de error; CHANGELOG.md y README.md ("antes de escribir nada") | implementacion |
| MEN-2 | MENOR | abierto | test/commands/verificacion-selectiva.test.ts (test del guardian) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Veredicto propuesto por el revisor: aprobada-con-correcciones.

### Entorno y puerta determinista

Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-091-r1`, rama `feature/task-091-verificacion-selectiva-por-impacto-en-la`, `npm install` y `npm run build` sin errores. Ficheros de la tarea: `verificacion-selectiva`, `freno-stop`, `guardia-merge`, `finish-verificacion`, `doctor` y `config-verificacion`: 131 tests, 131 pasan, 0 fallan. No se corrio la suite entera; solo la parte que toca el diff.

### Mutantes (¿hay red de regresion?)

Rotas a proposito, de una en una, las lineas que el diff dice proteger, con `verificacion-selectiva.test.js` (19 tests):

| Mutante | Resultado |
|---|---|
| M1: huella de la selectiva sin la base ni su commit | rojo (test 9, "su huella cambia si avanza la base") |
| M2: selectiva y completa comparten fichero de memo | rojo (test 9) |
| M3: no se exporta `RAMA_BASE` | rojo (tests 4, 5 y 10) |
| M4: el hotfix recibe la rama de integracion en vez de la principal | rojo (test 5) |
| M5: se quita el aborto por arbol sucio en `review` | rojo (test 12) |
| M6: la cobertura se muestra aunque corra la selectiva | rojo (test 13) |

Todos se detectan. Matiz: con M2, el test del guardian sigue verde porque la huella de la selectiva ya difiere por el contexto `selectiva\0base\0sha`; solo lo caza el test de memo. Las dos defensas son redundantes, no independientes (MEN-2).

### MEN-1 — `review` aborta con "no se ha escrito nada", pero el script de Git-Flow ya ha mergeado la base en la rama

Reproduccion (test temporal en el clon, ya borrado): tarea en curso con las dos claves; `develop` avanza un commit; selectiva en rojo; `runReviewCommand(... 'TASK-600')`. Rechaza con el mensaje esperado, pero `HEAD` de la rama cambia (`da33787...` -> `cbae618...`): el update de Git-Flow ya habia mergeado `develop`, porque la selectiva corre despues de `runGitflowScript` en la ronda no incremental. El orden es el correcto (verifica el estado ya mergeado y reintentar es inocuo), pero "no se ha escrito nada", y "corre antes de escribir nada" en CHANGELOG/README, no es cierto para el historial de Git. Arreglo: matizar mensaje y documentacion.

### MEN-2 — el test del guardian no protege por si solo la separacion de memos

El test del guardian pasa con M2 porque la huella de la selectiva incluye contexto; la separacion de ficheros (`FICHEROS_MEMO`) solo queda cubierta por el test de memo. No es un fallo de comportamiento: hay dos barreras y cada una tiene su test. Sugerencia opcional: una variante del test del guardian que fuerce la colision, o aceptar el solapamiento.

### Lo revisado sin hallazgos

- Config: fallo cerrado de selectiva sin completa, timeout sin comando y valores invalidos, con tests y mensajes que dicen que hacer.
- Hook `Stop`: base por tipo (hotfix contra la principal), memo propio, no escribe el memo de la completa (documentado en el CHANGELOG), mensaje que distingue selectiva de completa.
- `finish`: la completa sigue siendo la puerta, con mensaje que lo recuerda.
- `review`: arbol sucio aborta; cobertura omitida con motivo; sin la clave nada cambia; la seccion va despues de la cabecera con el commit revisado.
- Cero dependencias de runtime nuevas; la guia `verificacion-selectiva.md` no menciona TaskCode ni sus rutas internas (por lectura).

## Lecturas fuera del contexto permitido

- `src/fs/git.ts` (solo `resolveBaseBranchForTipo`, ~l.724) y `src/commands/review.ts` fuera del tramo del diff (l.500-660, orden entre el script de Git-Flow y la selectiva): necesarios para reproducir MEN-1.
- `test/helpers/review-fixtures.ts` y `test/helpers/finish-fixtures.ts` (via imports del test): para montar el repo temporal de MEN-1.
- Carpeta de pruebas borrada al terminar; no se modifico ningun fichero del repo original.
