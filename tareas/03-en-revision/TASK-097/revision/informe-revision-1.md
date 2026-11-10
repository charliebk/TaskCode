# Informe de revision — TASK-097 (ronda 1)

- Commit revisado: 3493c3101e5949883305a16f7f2c6589b0dd2320
- Revisor: general-purpose (sonnet) con code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| H1 | IMPORTANTE | corregido | src/core/duracion-estimada.ts (CIFRA_RE) | implementacion |
| H2 | IMPORTANTE | corregido | skills/task-workflow/SKILL.md (+ test/skills/task-workflow.test.ts, limite 15 KB) | implementacion |
| H3 | IMPORTANTE | corregido | test/commands/duracion-estimada.test.ts, test/core (sin test en modo manual) | implementacion |
| H4 | MENOR | corregido | src/core/duracion-estimada.ts (LINEA_RE y primera coincidencia) | implementacion |
| H5 | MENOR | corregido | skills/task-workflow/duracion.md | plan |

Nota: el HEAD de la rama es 297f67c (solo peticion, informe vacio y planificacion); el codigo revisado es el de 3493c31.

### H1 — IMPORTANTE — «2 horas», «2 h», «1 h 30» y «45 - 90» se leen como minutos y saltan la regla

`CIFRA_RE = /^(\d+)\s*(?:min|minutos?)?(?![\d.,:h-])/i`: el `\s*` retrocede y el lookahead se evalua sobre el espacio. Con espacio entre cifra y unidad la guarda no actua. Con `leerDuracionEstimada`: `2 horas` → ok 2; `2 h` → ok 2; `1 h 30` → ok 1; `3 horas (14 ficheros)` → ok 3; `1 hora` → ok 1; `90 - 120` → ok 90; `45 + 30 min` → ok 45; `1h30` → ilegible (correcto). Por CLI, con `2 horas (14 ficheros de codigo)` y con `1 h 30`, `siguiente` da `approve/continuar` y `approve --decidido-por automatico` sale con 0. Contradice la decision 4 (presente pero no reconocida: se pregunta). Los tests solo prueban formatos pegados a la cifra. Correccion: exigir fin de valor, espacio+parentesis o puntuacion de cierre tras la cifra y la unidad; tests con esos casos.

### H2 — IMPORTANTE — con `core.autocrlf=true`, `task-workflow/SKILL.md` pasa de 15 KB (cuarto rojo en Windows)

`SKILL.md pesa 15492 bytes (limite 15360)`. Blob LF en 3493c31: 15204 (en CI Linux pasa). En `develop`, 15070 LF = 15355 CRLF, 5 bytes bajo el limite. Las tres lineas nuevas lo empujan a 15492 con CRLF. Es un cuarto rojo en Windows nativo, que el reporte del implementador (2090/2094) pudo atribuir a los conocidos. Correccion: recortar SKILL.md (mover texto a `duracion.md`), sin tocar el limite del test.

### H3 — IMPORTANTE — «preguntar en TODOS los modos, manual incluido» (decision 1) sin test

Mutante `if (modo !== 'manual' && ctx.duracionEstimada !== undefined && superaUmbral(...))` en flujo.ts: sobrevive (todos los tests usan `CONFIG_AUTO`). El comportamiento es correcto (comprobado con `siguienteFase` a 90 min: manual, semi y automatico dan `preguntar`), pero falta la red de regresion. Correccion: test de `siguienteFase` en los tres modos con mas de 60 min, y con 60 en manual.

### H4 — MENOR — formatos de la linea leidos como «ausente»

`LINEA_RE` solo admite `*`/`_` iniciales y se devuelve en la primera coincidencia: `- Duracion estimada: 120 min`, `> ...`, `## ...`, entre acentos graves, y la linea de plantilla sin cifra seguida de otra con cifra, dan `ausente`. Por CLI, la viñeta con 120 min aprueba en automatico con un aviso falso («el plan no dice su duracion»). Correccion: admitir `-`, `>`, `#` y acentos graves iniciales, y seguir buscando tras un valor sin digitos.

### H5 — MENOR — riesgo aceptado sin documentar

El plan dice que las pausas mal contadas (`pause`/`resume` no escriben fila) sesgan la calibracion y que se documenta en las skills; `duracion.md` y el README no lo dicen, ni que la cifra es un entero de minutos.

### Tests y mutantes

Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-097-r1`, borrado. `core/duracion-estimada`, `commands/duracion-estimada`, `core/metricas*`: 70/70. Tanda de approve, siguiente, metricas, finish y skills: 305/307 (rojos: el conocido de chmod y H2). `test:rapido`: 685/685. Mutantes: 16 muertos (umbral `>=`, ilegible, `UMBRAL=70`, bloques de codigo, sin lookahead, anotar sin reemplazar, real nulo como 0, sin «Paso de la hora», ilegible como ausente, approve sin rechazo, sin aviso, rechazando la ausencia, flujo con continuar, finish sin anotar, `minutosPuntaAPunta` nulo, `estimadaMin` nulo); sobrevive 1 (flujo sin preguntar en manual, H3).

Casos buscados: re-planificacion, finish reintentado, dato ausente tras el merge, tareas sin hora y planes antiguos sin la linea, sin fallo. Criterios: 1 y 3 cumplen (reservas H1, H4); 2 parcial (H3); 4 cumple con H5 y rompe el limite (H2); 5 no cumple en Windows por H2.

## Lecturas fuera del contexto permitido

- `test/skills/task-workflow.test.ts` y su `dist`: origen del rojo de H2.
- `dist/test/helpers/automatico-fixtures.js` y `dist/src/core/flujo.js`: casos por el CLI y por `siguienteFase`.
- `src/core/metricas.ts`, `src/commands/finish.ts` y `approve.ts` alrededor de los cambios.
- `git show develop:.../SKILL.md` y tamaños LF/CRLF (H2).

## Correcciones del implementador (tras la ronda 1)

Commit 20aaa29.
- H1: la cifra solo vale seguida del fin, de un parentesis con las senales o de un punto; 2 horas, 2 h, 1 h 30, 90 - 120 o 45 + 30 min son ilegibles y se pregunta. Tests con esos casos.
- H2: SKILL.md vuelve a medir lo mismo que en develop (15355 bytes con CRLF): la linea de la regla se integra recortando un parentesis del parrafo de held-out.
- H3: tests de siguienteFase en los tres modos con mas de una hora (y con cifra ilegible), y con 60 min o sin linea cada modo hace lo de siempre.
- H4: se admiten vineta, cita, encabezado y acentos graves; la linea de plantilla sin cifra no tapa una estimacion real mas abajo. Tests.
- H5: duracion.md documenta que la cifra es un entero de minutos y que solo se descuentan las pausas de taskctl pausa.
