# Informe de revision — TASK-135 (ronda 1)

- Commit revisado: 14df38e3bda002b764c37beaad4e87aa31fd39c7
- Revisor: general-purpose (sonnet) + code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| (ninguno) | — | — | — | — |

Sin hallazgos. Lo ejecutado y su resultado:

1. Clon del repo local en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-135-r1`, checkout de 14df38e, `npm install` y `npm run build`: compila sin errores.
2. Tests afectados (`lotes-rutas`, `review-tests-stat`, `review-rutas`): 17 pass, 0 fail. Sin suite completa ni `verificar-impacto.mjs` (modo rapido; la verificacion por impacto ya estaba en verde sobre este commit).
3. Equivalencia con una llamada unica, repo temporal con 245 rutas: `pages/[id].vue` junto a `pages/id.vue`, `con espacio/a b.txt`, `tildes/ñandú-é.ts`, un binario modificado, un fichero borrado y rutas de ~100 caracteres. 3 lotes, maximo 5713 caracteres de pathspec (tope 8000). El diff por lotes es identico al de la llamada unica una vez aplicado el `trim()` que ya hace `runGit`. `statDeFicheros`: 245 ficheros en ambos casos. Lista vacia: `''` sin llamar a Git (con `cwd` inexistente no lanza). Rango sin cambios: `''`; el `filter` evita separadores vacios.
4. Tope de caracteres: los tests unitarios comprueban que ningun lote pasa de 8000, que cada lote esta lleno, que la ruta mas larga que el tope va sola, que concatenar devuelve la lista original en su orden y que la lista vacia no da lotes.
5. Mutantes sobre `dist/src/fs/git.js` del clon, restaurados despues:
   - `diffRangeForPaths` en una sola llamada: el test de 1300 rutas cae con `spawnSync git ENAMETOOLONG` (3 tests en rojo).
   - Sin corte por caracteres en `lotesDeRutas`: cae el test unitario del corte (2 en rojo).

Notas que no son hallazgo:
- El tope de 8000 cuenta solo el pathspec; deja ~24 000 caracteres de margen sobre 32 767.
- `LOTE_RUTAS_STAT` conserva el nombre aunque ahora lo usan las dos funciones; el plan lo mantiene porque los tests lo importan.
- El test de 1300 rutas solo reproduce el ENAMETOOLONG en Windows (riesgo aceptado en el plan); el unitario cubre el corte en cualquier plataforma.

Limpieza: borradas la carpeta del clon y una temporal `eq-*`; nada en el repo ni en `C:\`.

## Lecturas fuera del contexto permitido

ninguna (solo `runGit`, en el mismo `src/fs/git.ts`, para confirmar el `trim()`)
