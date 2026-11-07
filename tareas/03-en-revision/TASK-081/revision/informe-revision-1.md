# Informe de revision — TASK-081 (ronda 1)

- Commit revisado: 4f0243f23d350f54c72370f93f4d1d3ae5bcc3bc
- Revisor: general-purpose + code-quality-reviewer (sonnet)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-081 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/commands/registrar-coste.ts:358 | implementacion |
| MEN-2 | MENOR | abierto | src/core/contexto-revision.ts:72 | implementacion |
| MEN-3 | MENOR | abierto | src/core/coste-transcripcion.ts (rondaYRevisorDeTranscripcion) | implementacion |
| MEN-4 | MENOR | abierto | test/ (sin cobertura de M8) | implementacion |
| MEN-5 | MENOR | abierto | skills/*-reviewer/SKILL.md | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Recomendacion del revisor: aprobada-con-correcciones (ningun CRITICO ni IMPORTANTE).

## Alcance y puerta determinista

- Clon limpio de la rama en `$LOCALAPPDATA/pruebas-claude/TaskCode/task-081-r1`, `npm install` y `npm run build`: compila sin errores.
- La suite completa corrió una vez, con `node --test "dist/test/**/*.test.js"`: **1947 tests, 1944 pasan, 3 fallan**.
- Los 3 rojos son exactamente los conocidos de Windows, no hallazgos:
  - approve: "propaga cualquier error de stat que NO sea ENOENT" (symlink EPERM).
  - plan: "propaga cualquier error de escritura que NO sea EEXIST" (chmod).
  - plan: "la rama base real tiene la tarea en un estado distinto..." (CRLF).
- No hay ningún cuarto rojo.
- No se pudo ejecutar el linter de la puerta por separado. `npm run lint` es `tsc --noEmit` y ya lo cubre la compilación.

## Mutantes (6 ficheros de test de la tarea: review-modelo, review-contexto, revision-lecturas, coste-revision, lo-que-lees, coste-registro; línea base 41/41 en verde)

| Mutante | Resultado |
|---|---|
| M1 regla del modelo barato admite CRITICO `corregido` | MATADO (2 rojos) |
| M2 se quita el check `tabla` legible | MATADO (1) |
| M3 se quita el check de informe-plantilla | MATADO (1) |
| M4 el lector deja de leer filas de 9 columnas | MATADO (4) |
| M5 lo sin atribuir pasa a ser ronda 1 | MATADO (2) |
| M6 se quita EXCLUIR_HELDOUT del filtro de `contextoPermitido` | SOBREVIVE (0 rojos). Es redundante en integración, porque `review.ts` ya mete EXCLUIR_HELDOUT en `excluir`. Ver MEN-2. |
| M7 la ronda 1 también abarata | SOBREVIVE. Equivalente: `previa` solo existe en rondas incrementales. |
| M8 se quita el filtro `type === 'user'` al buscar el primer mensaje | SOBREVIVE. Ver MEN-4. |
| M9 la escalera salta dos escalones | MATADO (5) |
| M10 el registro de revisión vuelve a una fila sumada | MATADO (5; la variante `if (false)` no compilaba) |
| M11 la carpeta de la tarea se filtra con `tareas/**` | MATADO (3) |
| M12 `sumaODato` devuelve 0 en vez de null | MATADO (1) |

## Reproducciones empíricas hechas contra el código compilado

- **Regla estricta del modelo barato**, con `modeloBaratoPermitido` sobre informes reales:
  - Permite: informe sin hallazgos, solo MENOR, IMPORTANTE abierto.
  - Deniega, todos correctos: CRITICO abierto, CRITICO `corregido`, CRÍTICO con tilde, severidad «Alta», sin tabla, plantilla con fila de ejemplo, plantilla con PENDIENTE, lista vacía, y dos informes donde uno trae CRITICO.
- **`taskctl review` por CLI en un repo temporal** (ronda 1):
  - La petición trae `## Contexto permitido` con tarea.md, `planificacion/`, los ficheros del diff y las rutas de `contexto_revision` (`CLAUDE.md`, `docs`).
  - Un fichero borrado en el diff no aparece en la lista, y un fichero con espacios sale bien.
  - El esqueleto del informe trae `## Lecturas fuera del contexto permitido` con `ninguna`.
- **Deducción de ronda y revisor con un prompt real.** Apliqué `rondaYRevisorDeTranscripcion` a la transcripción de este propio subagente, que tiene rutas Windows con `\\`. Da `{ronda: 1, revisor: ''}`. También funciona con contenido en bloques de texto, con sufijo, con ronda 10, con un `tool_result` delante, y con el placeholder `peticion-revision-N[-skill].md`.
- **`registrar-coste` por CLI**:
  - Una fila por agente, un solo commit.
  - Las filas de 9 columnas se siguen leyendo, y `metricas` pinta «—» para lo sin atribuir.
  - `--ronda 2` sobre una petición existente funciona.
- **Skills instaladas en proyectos ajenos**: las líneas añadidas en `skills/` y `agents/` no mencionan TaskCode, sus rutas ni sus documentos internos.

## Detalle de hallazgos

### MEN-1 — `--ronda` rechaza toda ronda de 2 o más cifras (regex con `d` literal)
- `src/commands/registrar-coste.ts:358`: `!/^[1-9]d*$/.test(ronda)`. Falta la barra, debería ser `\d`; la `d` es un carácter literal.
- Reproducción, con peticiones `peticion-revision-2.md` y `peticion-revision-10.md` en `revision/`:
  - `registrar-coste TASK-001 --fase revision --agente <id> --ronda 2` sale 0.
  - Con `--ronda 10` sale 1 y dice `--ronda "10" no es un entero de 1 o mas`, que es falso.
- Impacto bajo: casi nadie llega a la ronda 10, y el sustituto manual solo se usa cuando la transcripción no nombra la petición. Ningún test usa una ronda de dos cifras.
- Corrección: `/^[1-9]\d*$/` y un test con ronda 10.

### MEN-2 — Un directorio en `contexto_revision` que contenga `aceptacion/` cuela los tests reservados
- `contextoPermitido` filtra los extra con `casaConAlguno(r, [...excluir, EXCLUIR_HELDOUT])`. El patrón `tareas/*/TASK-*/aceptacion/**` solo casa con rutas que ya estén dentro de `aceptacion/`.
- Reproducción con `contextoPermitido(...)` y extra `['tareas', 'tareas/03-en-revision/TASK-001', 'tareas/03-en-revision/TASK-001/aceptacion', ...]`. Con `excluir` que no cubra `tareas/**`, las entradas `tareas` y el directorio de la tarea salen listadas, y el criterio dice «sin tests reservados». La ruta que apunta directamente a un fichero de `aceptacion/` sí se filtra.
- Para que ocurra, la persona tiene que declarar un directorio padre en la clave, y el revisor no es quien implementa. Por eso es MENOR.
- Además, el filtro de held-out de `contextoPermitido` no tiene test a nivel de función: M6 sobrevive porque `review.ts` ya lo inyecta en `excluir`.
- Corrección sugerida: excluir también las entradas que sean ancestras de una carpeta `aceptacion` o el propio directorio, o documentar que `contexto_revision` no debe apuntar a `tareas/`.

### MEN-3 — La atribución usa la primera mención de una petición, aunque no sea la de su ronda
- Un prompt que cite antes `peticion-revision-1.md` y luego `peticion-revision-2.md` se atribuye a la ronda 1, sin avisar. Es una heurística de «primera coincidencia».
- Un agente reanudado para otra ronda también conserva la atribución de su primer prompt. La fila `agente:dif:<id>` hereda esa ronda.
- La documentación ya reconoce que es heurístico. Aun así falta un aviso al registrar, o exigir una única ruta distinta en el primer mensaje. Se puede resolver con `--ronda/--revisor`, que solo vale con un único `--agente`.

### MEN-4 — Falta un test que fije «solo el primer mensaje `type: user`, ignorando líneas anteriores de otro tipo»
- M8 (quitar `obj['type'] !== 'user'`) sobrevive los 41 tests. Con el mutante, una primera línea de otro tipo (por ejemplo `system` o `summary`) devolvería `null` en vez de seguir buscando.
- En la transcripción real que inspeccioné, el primer registro ya es `user`, así que no afecta hoy. Pero es justo la parte del formato externo de Claude Code que el plan marcaba como riesgo, y la suite no la cubre.

### MEN-5 — Solo `code-quality-reviewer` remite explícitamente a «Lo que lees»
- `skills/code-quality-reviewer/SKILL.md` lleva el párrafo nuevo. Los otros cuatro revisores de dominio solo mandan leer `revision.md`, que sí contiene la sección. Funciona, porque todos empiezan con «lee revision.md».
- Es una asimetría de redacción, sin impacto funcional. Si el plan quería que cada skill lo dijera, no se cumple. Por eso el Origen es `plan`.

## Compatibilidad hacia atrás y demás comprobaciones

- Compatibilidad de `## Coste`:
  - Una tabla antigua de 9 columnas con filas nuevas de 11 sigue leyéndose.
  - `doctor` no se queja.
  - Un agente reanudado suma solo la diferencia y no cuenta doble (lo cubre el test «filas antiguas»).
- El riesgo de doble conteo con un plugin viejo está documentado en `docs/METRICAS.md`. Lo acepté como decisión de la persona.
- La regla del modelo barato mira solo la ronda inmediatamente anterior. Un CRITICO de la ronda 1 no inhibe la sugerencia en la ronda 3 si la ronda 2 salió limpia. Es coherente con «ronda anterior», y no lo cuento como hallazgo.
- El bloque de `metricas --tokens` va aparte y no entra en `--escribir`. `--json` lleva `lecturasRevision`. Los tests lo verifican.

## Criterios de aceptación

- Lecturas por revisor y ronda en `metricas --tokens`, con repos Git temporales: cumplido.
- `## Contexto permitido`, sección «Lo que lees» y `## Lecturas fuera del contexto permitido`: cumplido.
- Ronda 2 con modelo más barato cuando la ronda 1 no deja CRITICOS, y la sugerencia queda escrita en la petición: cumplido.
- METRICAS.md con el objetivo de 3-4 M: cumplido.
- `npm test` en verde salvo los 3 rojos de Windows: cumplido.

Ningún CRITICO ni IMPORTANTE.
