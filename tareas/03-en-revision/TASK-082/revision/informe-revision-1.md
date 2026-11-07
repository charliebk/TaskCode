# Informe de revision — TASK-082 (ronda 1)

- Commit revisado: 450590a7ad45ed71fd8deb03f8acab79ad9d7459
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-082 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/commands/siguiente.ts:253-262 (`revisoresDeLaTarea`, el `catch`) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Puerta y suite

- Clon en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-082-r1`, rama de la tarea (HEAD c0b40f0, que solo anade la peticion sobre el commit revisado 450590a). `npm install` y `npm test` una sola vez.
- Resultado: 1969 tests, 1966 pasan, 3 fallan. Los 3 rojos son los conocidos de Windows (symlink en `approve`, `chmod` y CRLF en `plan`). Ningun cuarto rojo.
- `dist/` commiteado en sincronia con `src/`: tras compilar, `git status` solo muestra `package-lock.json`.
- Lint: `tsc --noEmit`, cubierto por la compilacion de `npm test`.

## Mutantes sobre las lineas nuevas

Contra 6 ficheros de test (review-autorrevision, core/autorrevision, skills/autorrevision, siguiente, review-exclusion, review-incremental: 46 tests; base 46/46).

| Mutante | Resultado |
|---|---|
| M1 `tieneAutorrevision` siempre true tras hallar la seccion | muerto (3 rojos) |
| M2 sin filtro de comentarios HTML | muerto (2 rojos) |
| M3 `review` no empuja el aviso | muerto (3 rojos) |
| M4 `siguiente` desde la punta de la base y no la merge base | muerto (2 rojos) |
| M5 `revisores` en cualquier fase | muerto (1 rojo) |
| M6 `excluirDeRevision` sin `EXCLUIR_HELDOUT` | muerto (1 rojo) |
| M7 `revisoresDelRango` clasifica tambien los excluidos | muerto (2 rojos) |
| M8 `revisoresDeLaTarea` relanza el error de Git | **sobrevive** (0 rojos) |
| M9 sin seccion se da por buena | muerto (5 rojos) |
| M10 `siguiente` usa siempre `HEAD` como ref | muerto (1 rojo) |

## Reproduccion de los hallazgos

### MEN-1 — el `catch` de `revisoresDeLaTarea` no tiene ningun test (M8 sobrevive)

La skill y el comentario prometen que `siguiente` no se cae por un dato auxiliar. El test «sin rama local» (TASK-826) cubre solo `ref === null`, que no entra en `revisoresDeLaTarea`. Sustituir `catch { return null }` por `catch (e) { throw e }` deja los 46 tests en verde. Caso a anadir: fase review con la rama actual correcta y un `mergeBase` que falle (p. ej. rama base inexistente); esperado `fase === 'review'`, sin `revisores` y sin excepcion. MENOR: correcto por lectura, pero sin red de regresion. No bloquea; si no se corrige, anotarlo en el `## Resultado`.

### Sin otros hallazgos

- El aviso se calcula sobre la lectura fresca y antes de cualquier escritura; probado con CLI real (stderr `[AVISO]`, exit 0).
- `siguiente` y `review` reparten las mismas revisoras (test que las compara; mutante a punta de base muerto).
- Constancia: encabezado vacio, solo comentario HTML, CRLF, dentro de bloque de codigo, con tilde o con otro nivel: no cuenta, como pide el diseno.
- Las cinco revisoras tienen exactamente un `## Que se revisa` (sin restos del titulo viejo en C#); `../<revisora>/SKILL.md` llega a todas; la skill `review` no copia ninguna linea de las listas.
- Observacion no reportada como hallazgo: un `<!--` sin cerrar bajo `## Autorrevision` cuenta como contenido. Borde de edicion a mano sin consecuencia (el aviso no bloquea).
- La constancia se exige una vez por tarea, no por ronda, como decidio la persona en el plan.

Limpieza: carpeta temporal borrada; el repo original no se toco.
