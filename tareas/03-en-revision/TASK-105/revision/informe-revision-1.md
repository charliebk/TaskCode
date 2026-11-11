# Informe de revision — TASK-105 (ronda 1)

- Commit revisado: 8800b95654d0cec83d93f2a91a14f0f942dd177d
- Revisor: general-purpose (agente revisor independiente, modelo Sonnet 5.5, skill code-quality-reviewer)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | aceptado | src/fs/decision-documentacion.ts:183 (`motivoDeLaCompleta`) | implementacion |
| MEN-2 | MENOR | aceptado | test/fs/decision-parcial.test.ts (test «sin la clave…», rama de contraste) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

No hay hallazgos CRITICO ni IMPORTANTE.

### Puerta determinista y suite

- Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-105-r1`, checkout de 8800b95, `npm install`, `npm test` una sola vez (incluye el build con `tsc`, sin errores).
- Resultado: `# tests 2192`, `# pass 2188`, `# fail 3`, `# skipped 1`, `# cancelled 0`.
- Los 3 rojos son los conocidos de Windows nativo, no regresiones: nº 128 (symlink EPERM en approve), nº 782 (chmod en NTFS en plan) y nº 788 (CRLF en plan).
- Los 9 tests nuevos de `decision-parcial.test.ts` y los 3 añadidos a `finish-documentacion.test.ts` y `guardia-documentacion.test.ts` pasan. Sin rojos EBUSY.

### Mutantes (sobre el codigo cambiado)

Cada mutante se compiló y se corrió contra `decision-parcial`, `finish-documentacion` y `guardia-documentacion`; después se restauró el fichero.

| Mutante | Resultado |
|---|---|
| M2: sin held-out en `fueraDeParcial` | MATADO (test de held-out) |
| M3: `necesitaNivel2` sin la comprobacion de `RUTA_CONFIG` | MATADO (test de config, cuenta de diffs) |
| M4: memo selectiva guardado con arbol sucio | MATADO (test de memo con arbol sucio) |
| M5: guardian solo corta `completa` | MATADO (guardian TASK-105: esperado 2, real 0) |
| M6: `motivoDeLaCompleta` devuelve siempre `d.motivo` | MATADO (finish y guardian) |
| M7: `huellaDeCommit` ignora el contexto | MATADO (test de huella) |
| M8: sin SHA fijados (`rango = [base, hasta]`) | MATADO, solo por la cuenta de `rev-parse` (ver MEN-2) |
| M9: `timeoutSelectivaS` tomado de `timeout_verificacion` | MATADO |
| M10: finish usa `docs.decision.motivo` | MATADO (test de finish) |
| M11: nivel 2 sin `necesitaNivel2` | MATADO (test de config, sin segundo diff) |
| M12: `fueraDeParcial` calculado con `fueraDeDocs` | MATADO (varios tests) |
| M1: quitar la suma del arbol en `fueraDeParcial` | no compila con esa forma; el test «con el arbol de trabajo…» ejercita ese camino |
| M13: `contextoSelectiva` sin el SHA de la base | no verificado (el patron no casó en la fuente) |

En la primera pasada automatizada, M5, M6 y M10 salieron como «sobrevive» por un fallo del arnés del revisor. Repetidos a mano con `node --test` sobre los ficheros concretos, se ponen rojos.

### MEN-1: el motivo mostrado para `selectiva` pierde la lista de ficheros de la 0.14.0

- **Reproduccion:** con la clave y todo el codigo dentro de ella, finish y el guardian dicen «la tarea cambia rutas que no son documentacion.» sin la lista de ficheros que daba la 0.14.0. El comentario de la funcion dice «como en la 0.14.0».
- **Efecto:** solo para quien declara la clave nueva. Pierde informacion en un mensaje de estado; no es un fallo.
- **Motivo de aceptacion (implementador):** la clave `rutas_verificacion_parcial` no se publica hasta B6, asi que ningun proyecto la ve. Ademas, B3/B5 sustituyen este texto cuando finish y el guardian acepten la selectiva. Corregirlo abriria otra ronda para un mensaje de vida corta.

### MEN-2: la fijacion de SHA se prueba por implementacion, no por comportamiento

- **Reproduccion:** el mutante M8 solo lo mata `revParses(procs).length === 1`; ningun test construye la carrera de un commit que entra entre los dos diffs.
- **Motivo de aceptacion (implementador):** el plan ya acepta ese riesgo, y forzar la carrera de forma determinista exigiria un doble de git, que la suite no admite. La cuenta de procesos es la misma tecnica que ya usan los tests del freno (TASK-102).

### Comprobaciones sin hallazgo

- **Hueco del guardian:** `selectiva` bloquea con motivo propio aunque el comando de documentacion coincida y su memo este en verde.
- **Huella:** `huellaDeCommit` sin contexto da la formula de siempre (igual que `huellaDelArbol`); con contexto casa con el memo de `verificarConMemo`. `VERSION_MEMO` sigue en 1.
- **Sin la clave:** 2 `diff` y 0 `rev-parse`, como la 0.14.0; con la clave, 3 y 1.
- **Refactor de `rutasDeTarea` y `rutasDelArbol`:** mismos procesos y pathspecs. `null` si Git falla, y eso acaba en completa (probado con ref inexistente).
- **Desviacion del enunciado** (`rutasFueraDe` en vez de un segundo `rutasDeTarea`): intencionada y declarada en el plan.
- **Criterios de aceptacion:** los 4 cumplidos con evidencia.

## Lecturas fuera del contexto permitido

- `src/core/verificacion-proporcional.ts`, solo `decidirVerificacion`, `patronesParcial` y `patronesDocumentacion`, para comprobar en que rama de la decision cae `fueraDeParcial` y que los held-out de `tareas/**` quedan fuera de los patrones parciales.
- `package.json` del plugin, solo los scripts de test y build.

## Nota de limpieza del revisor

El primer `npm install` se lanzó por error en el repo original, porque fallo el `cd` al clon. Dejó una linea de diferencia en `package-lock.json`, que el revisor revirtió. El implementador comprobó después que `git status` del repo original esta limpio. La carpeta temporal esta borrada.
