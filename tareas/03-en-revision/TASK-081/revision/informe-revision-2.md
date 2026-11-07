# Informe de revision — TASK-081 (ronda 2)

- Commit revisado: fa3c0b12425a259071458182807be6772b50c17d
- Revisor: general-purpose + code-quality-reviewer (haiku)
- Veredicto: aprobada

Recomendacion del revisor: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MENOR-1 | MENOR | abierto | src/core/contexto-revision.ts:64-73 (contieneHeldout) y :93 | implementacion |
| MENOR-2 | MENOR | abierto | src/core/contexto-revision.ts:64-73 (contieneHeldout) y normalizar() | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Estado de los hallazgos de la ronda 1, verificados en esta ronda:
- **MEN-1** (`src/commands/registrar-coste.ts:358`): corregido. Con el mutante en dist, el test de `revision-lecturas` se pone rojo.
- **MEN-2** (`src/core/contexto-revision.ts:93`): corregido en los casos del test. Con el mutante en dist, el test «MEN-2 r1» de `review-contexto` se pone rojo. Los casos que quedan son MENOR-1 y MENOR-2.
- **MEN-3**: no se ha tocado en esta ronda (aceptado por el orquestador).
- **MEN-4** (`test/core/coste-revision.test.ts`): corregido. Solo cambian los tests, el código no. Con el mutante en dist, el test «MEN-4 r1» se pone rojo.
- **MEN-5**: no se ha tocado en esta ronda (aceptado por el orquestador).

### MENOR-1 — contieneHeldout no normaliza mayusculas
- **Dónde:** src/core/contexto-revision.ts:64-73 (contieneHeldout) y :93 (filtro en contextoPermitido).
- **Qué pasa:** una carpeta de held-out escrita con otras mayúsculas no casa con el molde y entra en el contexto permitido.
  - Ejemplos: `Tareas/03-en-revision/TASK-081` y `TAREAS/03-en-revision`.
  - En Windows, NTFS no distingue mayúsculas, así que apuntan a la misma carpeta.
  - La forma canónica `tareas/03-en-revision/TASK-081` sí queda filtrada.
- **Reproducción:** se ejecutó `contextoPermitido` del dist compilado con:
  - carpetaTarea `tareas/03-en-revision/TASK-081`, ficherosDelGrupo `[]`, excluir `[]`;
  - extra `['Tareas/03-en-revision/TASK-081', 'TAREAS/03-en-revision']`.

  Las dos entradas salen en la lista; en minúsculas no salen. Se reprodujo a nivel de función, no de extremo a extremo.
- **Impacto:** solo si `contexto_revision` o el diff traen una variante de mayúsculas. La lista da nombres de carpeta, no su contenido.
- **Sugerencia:** comparar en minúsculas.

### MENOR-2 — los segmentos `..` no se resuelven antes de filtrar
- **Dónde:** src/core/contexto-revision.ts:64-73 (contieneHeldout) y normalizar().
- **Qué pasa:** las rutas que resuelven a una carpeta padre del held-out no se filtran, porque `..` no se resuelve.
- **Reproducción:** con extra `['tareas/03-en-revision/TASK-081/..', 'x/../tareas']`, las dos entradas salen en la lista.
- **Impacto:** bajo. Son rutas que la configuración no debería tener.
- **Sugerencia:** resolver `..` con `path.posix.normalize`, o rechazar esas rutas.

## Ejecucion de la revision

- **Clon y puerta determinista:**
  - Clon de la rama en una carpeta temporal fuera del repo. El HEAD del clon es c12e641, que solo añade la petición; el código revisado es fa3c0b1.
  - `npm install` correcto, y `npm run build` compila sin errores.
- **Tests:** los tres ficheros tocados dan 22 pass y 0 fail. La suite completa no se ejecutó, como pedía la petición.
- **Mutantes:** se aplicaron sobre dist con un script de node, cada uno se deshizo y se comprobó con `cmp`:

| Corrección | Mutante | Test que lo detecta | Resultado |
|---|---|---|---|
| MEN-1 | regex `/^[1-9]\d*$/` cambiada a `/^[1-9]d*$/` | revision-lecturas, caso `--ronda/--revisor` | ROJO |
| MEN-2 | se quita `.filter((r) => !contieneHeldout(r))` | review-contexto, caso MEN-2 r1 | ROJO |
| MEN-4 | `continue` cambiado por `return null` en las líneas que no son de usuario | coste-revision, caso MEN-4 r1 | ROJO |

## Lecturas fuera del contexto permitido

- SKILL.md de code-quality-reviewer y task-workflow/revision.md: los exige la skill revisora.
- revision/peticion-revision-2.md y revision/informe-revision-2.md: la petición y la plantilla de salida.
- package.json del plugin: para localizar los comandos de la puerta.
- dist/src/core/coste-transcripcion.js: la función de MEN-4 vive en coste-transcripcion.ts, que no está en la lista. Se leyó para construir el mutante.
- dist/src/commands/registrar-coste.js y dist/src/core/contexto-revision.js: los compilados de ficheros permitidos, para localizar las líneas que había que mutar.
- Nota: un comando que nombraba la carpeta de held-out de TASK-081 lo bloqueó el hook de la tarea. No se reintentó.
