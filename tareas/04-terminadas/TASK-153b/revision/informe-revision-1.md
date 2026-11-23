# Informe de revision — TASK-153b (ronda 1)

- Commit revisado: 42562c3fb668a8251a18fa580caced8053574736
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer, independiente
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/candidatos-4d.ts (candidatos4D, nombresParecidos) | implementacion |
| IMP-2 | IMPORTANTE | corregido | src/commands/review.ts (seccionCandidatosDeRonda), src/core/candidatos-4d.ts (topes) | implementacion |
| MENOR-1 | MENOR | corregido | src/fs/git.ts (definicionesEnRef) | implementacion |
| MENOR-2 | MENOR | corregido | src/core/candidatos-4d.ts (candidatos4D) | implementacion |
| MENOR-3 | MENOR | corregido | src/core/candidatos-4d.ts (candidatos4D) | implementacion |
| MENOR-4 | MENOR | corregido | src/fs/git.ts (docblock de diffRangeForPaths) | implementacion |
| MENOR-5 | MENOR | corregido | test/core/candidatos-4d.test.ts | implementacion |
| MENOR-6 | MENOR | corregido | src/core/candidatos-4d.ts (PATRONES_DEFINICION), src/fs/git.ts (patron ERE) | implementacion |
| MENOR-7 | MENOR | corregido | src/fs/git.ts (definicionesEnRef) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### IMP-1 — Coste O(nuevas x existentes) con Levenshtein sin prefiltro
Cada definicion nueva recorre todas las existentes con `distanciaEdicion`, sin cortar por diferencia de longitud; el `break` solo corta al llegar a 15 duplicados. Peor caso sin candidatos: 4.000 x 200 = 6,7 s; 30.000 x 100 = 25 s; 50.000 x 200 = 101 s. Bloquea `taskctl review` sin progreso para producir pistas. Sugerencia: prefiltro por longitud e indice por nombre normalizado; test de coste acotado.

### IMP-2 — Protecciones sin test que se ponga rojo al quitarlas
Sobreviven: vaciar el `catch` de `seccionCandidatosDeRonda`, subir `MAX_DEFINICIONES`/`MAX_PARECIDOS`/`MAX_TESTS`, usar `baseBranch` en vez de `desde` para el diff de tests (la ronda 2 relistaria los de la 1) y sacar las existentes de HEAD. El `catch` es alcanzable (ENOBUFS con un `git grep` de mas de 64 MB). Sugerencia: tests de ref inexistente (la ronda sigue y dice por que), de topes y de ronda 2.

### MENOR-1 — `dist/` versionado entra como existente: falso positivo en cada firma editada (excluir_de_revision no se aplica al grep)
### MENOR-2 — No se detecta la duplicacion dentro de la propia tarea ni entre rondas
### MENOR-3 — Truncado silencioso a 15 / 3 / 15 sin «y N mas»
### MENOR-4 — Docblock de `diffRangeForPaths` huerfano (definicionesEnRef se metio entre el comentario y la funcion)
### MENOR-5 — Mutantes que sobreviven en los tests unitarios: umbral, longitud minima, lineas de contexto del diff, normalizacion de `$`/`-`, filtro de extension del grep, promesas individuales y en ingles
### MENOR-6 — «Que es una definicion» escrito dos veces (ERE de git.ts y regex de core) sin test de sincronia
### MENOR-7 — `git grep` sin pathspec de extensiones (recorre md, json, lock) y mensaje enganoso con ENOBUFS

### Reproduccion empirica
Clon temporal (borrado): tsc sin errores; tests de la tarea 10/10. 41 mutaciones (38 evaluadas, 17 sobreviven). Comando real contra 6 repos temporales (TS, Rust, Python, bash, Java/C#, renombrados, borrados, rutas con tildes y espacios, nombres con `$` y guiones), un repo de 100 MB de salida de grep, ronda 1 + ronda 2 incremental, y el diff de 6 merges reales de TaskCode.

## Lecturas fuera del contexto permitido

- skills/code-quality-reviewer/SKILL.md y revision.md completos (plantilla), test/commands/review-incremental.test.ts y test/helpers/review-fixtures.ts (ronda 2 manual), src/core/sugerencia.ts (coste), src/fs/git.ts:47-64 y review.ts fuera del diff (camino del catch).

## Regla 4D
- Duplicacion: MENOR-6
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: IMP-2
