# Informe de revision — TASK-067 (ronda 1)

- Commit revisado: 8291dcd415eac5a86d7159c78bb31c9a20f6198c
- Revisor: code-quality-reviewer (agente revisor independiente a60963f95cb118fbe, general-purpose sonnet; clon propio en %LOCALAPPDATA%\pruebas-claude\taskcode\task-067-r1, ya borrado)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-067 aprobada | aprobada-con-correcciones | cambios-solicitados)

El revisor propuso aprobada-con-correcciones (solo MENOR). La persona decidio corregir MEN-1
(ampliar la regla del aviso a `tareas/`, que cambia su decision del plan) y, de paso, MEN-2..4;
en modo automatico eso se pide como cambios-solicitados y abre la ronda 2.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/aviso-release.ts:84 | especificacion |
| MEN-2 | MENOR | abierto | src/fs/evidencia-veredicto.ts:20-31 | implementacion |
| MEN-3 | MENOR | abierto | src/fs/informes-deploy.ts:~58, src/commands/doctor-deploy.ts:79 y :~345 | implementacion |
| MEN-4 | MENOR | abierto | src/fs/sondas-deploy.ts (rama `sinVerificar`, antes de `if (sinMirar > 0)`) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin CRITICOS ni IMPORTANTES.

### MEN-1 — El aviso de `finish` salta en el flujo normal si tras el informe se commitea algo en `tareas/`

Reproducido con `runFinishCommand` y los fixtures reales: release en `en-revision`,
`doctor-deploy --escribir`, commit del informe, commit que solo toca `tareas/extra/x.md` (lo que
hacen `review`, `registrar-coste` y los `chore(TASK-NNN)`), `finish`. Salida: «el mas reciente
(2026-10-27.json) es del commit 53fe98213bca y desde entonces ha cambiado 1 fichero fuera de
docs/doctor-deploy/». No bloquea, pero en una release real casi siempre habra commits de `tareas/`
posteriores al informe. La regla «solo `docs/doctor-deploy/`» era decision de la persona; por eso
el origen es `especificacion`. Propuesta: ampliar la exclusion a `tareas/`.

### MEN-2 — Un enlace simbolico versionado se acepta como evidencia

El docstring de `comprobadorEnCommit` dice «un blob, no una carpeta ni un enlace», pero
`git cat-file blob` tambien devuelve enlaces (modo 120000). Reproducido:
`git update-index --add --cacheinfo 120000,<hash de "src/app.js">,enlace`, commit y `--resultado`
con `{"punto":"auth-en-servidor","estado":"ok","fichero":"enlace","linea":1,...}` da
`[OK] ... [agente]`. Impacto bajo. Propuesta: comprobar el modo con `git ls-tree` y rechazar
120000 y 160000.

### MEN-3 — Tres copias de la carpeta `docs/doctor-deploy`

`CARPETA_INFORMES` (doctor-deploy.ts:79), `CARPETA_INFORMES_REL` (aviso-release.ts:18), el literal
de `leerInformesDeploy` y el `:(exclude)docs/doctor-deploy` del `git status`. Si una cambia y las
otras no, `--escribir` y `finish` mirarian sitios distintos. Hoy los tests lo detectarian.
Propuesta: una sola constante.

### MEN-4 — `gitignore-cubre-env` pierde el recuento de carpetas sin mirar si una sale NO VERIFICADO

Con mas de 200 carpetas y una NO VERIFICADO entre las 200 primeras, `return sinVerificar` sale antes
de la rama «faltan N»: la conclusion es la misma pero el motivo no dice cuantas faltan (el
criterio 8 lo pide). Deducido del codigo, no reproducido (no se puede forzar un fallo de
`check-ignore` en una carpeta concreta con Git real). Propuesta: anadir `sinMirar` al motivo.

## Evidencia de lo ejecutado

- **Suite** (`npm test` en el clon): 1610 tests, 1605 pasan; fallan solo los 5 conocidos de Windows
  (2 contraprueba de descubrimiento/README_MISSING, approve symlink EPERM, plan chmod NTFS, plan
  CRLF). Sin EBUSY. `dist/` recompilado identico al commiteado.
- **`--resultado`, 31 casos**: aceptados `ok`/`falla` validos, `no-verificado`, `./src\app.js`
  normalizado, ultima linea con `\n`, punto con espacios. Rechazados con motivo: commit distinto de
  HEAD, `..` (incluido `src/../src/app.js`), rutas absolutas (`/etc/passwd`, `C:\Windows\win.ini`,
  `\\servidor\share\f.js`), fichero no versionado, linea inexistente y linea 0, campo extra,
  punto de sonda y punto NO APLICA, punto desconocido, `ok` sin evidencia, duplicados (los dos),
  `src/app.js:1`, directorio y `HEAD:package.json`.
- **Secretos**: `AKIA...` y `ghp_...` falsos en motivo, id de punto, nombre de campo, commit y
  nombre de fichero; ninguno aparece en stdout, stderr, `--json`, `.md` ni `.json`.
  Una «inyeccion» en el motivo sale como dato y no se copia a las tareas.
- **`--crear-tareas`**: 4 FALLAs dieron TASK-9999..9996 en un solo commit y arbol limpio; etiqueta
  `doctor-deploy:<punto>`; repetir no crea ni commitea y dice que reutiliza; `taskctl new` da
  TASK-001/002; arbol sucio aborta sin crear nada; desde otra rama cambia a develop; tarea
  terminada con el punto en FALLA crea otra; rama `feature/task-9999-viejo` salta a 9998; rango
  agotado (1000 ramas) da error claro.
- **JSON v2** y **`--escribir`** (.md y .json): claves correctas, sin fugas.
- **MEN-12**: 11 carpetas con la 11.a mal da FALLA (antes OK); 250 bien da NO VERIFICADO
  «solo se comprobaron 200 de 250 (faltan 50)»; fallo en la 249.a, NO VERIFICADO; fallo en la 3.a,
  FALLA «ademas 50 carpeta(s) de proyecto sin comprobar».
- **Aviso de `finish`** (scripts reales): informe en la punta o ancestro con solo
  `docs/doctor-deploy/` cambiado no avisa (tambien con `-2` y commit abreviado); sin informe avisa;
  ancestro con otro cambio avisa (incluye MEN-1). La tarea se cerro siempre.
- **Mutantes** sobre `dist/` (10 ficheros de test, 146 tests): mueren M1, M2, M2b, M3, M4, M5, M6,
  M7, M17 (veredictos), M8, M9, M9b (rango reservado), M10 (dedupe), M11-M14 (aviso), M15 (recorte a
  10), y N8, N9, N12, N14, N17 de TASK-066. Sobreviven dos equivalentes: M3b (longitud minima del
  commit, cubierta por el regex) y M16 (`HEAD:` en vez de `<commit>:`).
- **Contenido expuesto**: skill, agente y catalogo sin TaskCode ni rutas internas.
- **Criterios 1-8**: se cumplen; el 6 con la salvedad de MEN-1 y el 8 con el matiz de MEN-4.

## Reglas de seguridad

Repo original intacto (`git status --short` vacio, punta 761ca65); todo en
`%LOCALAPPDATA%/pruebas-claude/taskcode/task-067-r1/`, sin heredocs, carpeta borrada al terminar.
