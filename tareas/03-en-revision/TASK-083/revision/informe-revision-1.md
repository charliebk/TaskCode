# Informe de revision — TASK-083 (ronda 1)

- Commit revisado: 8e65792
- Revisor: code-quality-reviewer
- Veredicto: PENDIENTE

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| (ninguno) | — | sin hallazgos | — | — |

Sin hallazgos. (8e65792 es la peticion de la ronda 1; el HEAD de codigo que cita la peticion es c3d2852.)

## Reproduccion y pruebas

Clon limpio de la rama en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-083-r1`, `npm install` y `npm run build` (tsc sin errores).

- Tests relevantes: `node --test dist/test/commands/review-*.test.js dist/test/commands/veredicto.test.js` dan 77 de 77 en verde (incluido el nuevo `review-alcance.test.js`).
- Suite rapida (`npm run test:rapido`): 655 de 655 en verde.
- Suite completa no corrida por el revisor (~10 min); los 3 fallos conocidos de Windows no entran en lo tocado por este diff.
- Skills y README: las lineas anadidas en `skills/` y `README.md` no mencionan TaskCode, TASK-NNN ni documentos internos (grep sobre las lineas `+` del diff contra `origin/develop`, sin coincidencias).

### Mutantes sobre la regla nueva

Aplicados sobre `dist/*.js` y corridos contra `review-alcance.test.js` y `veredicto.test.js`; cada uno restaurado despues.

| Mutante | Resultado |
|---|---|
| M1 un IMPORTANTE no descalifica (`!== 'MENOR'` por `=== 'CRITICO'`) | muerto (4) |
| M2 sin el chequeo de veredicto `cambios-solicitados` | muerto (1) |
| M3 sin el caso «cambios pedidos sin ningun hallazgo» | muerto (1) |
| M4 `ficheroNombrado` sin «el nombrado es el final de la ruta» | muerto (2) |
| M4b `ficheroNombrado` sin el caso de directorio | muerto (1) |
| M5 sin la comprobacion de merges en el delta | muerto (1) |
| M6 sin la comprobacion de ficheros no nombrados | muerto (2) |
| M7 la completa tras una acotada no vuelve a la base | muerto (1) |
| M8 `--completa` se ignora | muerto (1) |
| M9 sin el caso «sin diff de correcciones» | muerto (1) |
| M10 `fueAcotada` siempre false | muerto (1) |
| M11 la acotada se fragmenta por dominio | muerto (1) |
| M12 `soloMenores` con `some` en vez de `every` | muerto (2) |
| M13 sin el aviso de `taskctl veredicto` | muerto (1) |
| M14 el tope de cinco ficheros del motivo pasa a 50 | muerto (1) |

15 de 15 muertos.

### Observaciones sin hallazgo

- `ficheroNombrado` acepta un nombre corto como final de ruta: un hallazgo que cite `index.ts` nombra cualquier `index.ts` del repo. Es deliberado (los revisores anotan nombres cortos; hay un test que lo fija) y como mucho hace acotada una ronda que podria ser completa. Sin caso real que rompa nada.
- `commit ??=` en `leerRondaPrevia` conserva el comportamiento anterior (primer commit no nulo) y recorre todas las peticiones para detectar `fueAcotada`.

## Lecturas fuera del contexto permitido

ninguna
