# Informe de revision — TASK-097 (ronda 2)

- Commit revisado: 4167474940a1ff3af1fcfd001d26da71bf6aafaf
- Revisor: general-purpose (sonnet) con code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-097 aprobada | aprobada-con-correcciones | cambios-solicitados)

Ronda de verificacion de las correcciones (protocolo de arranque): la peticion la genero como completa el taskctl 0.13 instalado, con la regla que corrige TASK-095.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| H1 | IMPORTANTE | corregido | src/core/duracion-estimada.ts (CIFRA_RE) | implementacion |
| H2 | IMPORTANTE | corregido | skills/task-workflow/SKILL.md (limite 15 KB con CRLF) | implementacion |
| H3 | IMPORTANTE | corregido | test/core/duracion-estimada.test.ts (siguienteFase en los tres modos) | implementacion |
| H4 | MENOR | corregido | src/core/duracion-estimada.ts (LINEA_RE y primera coincidencia) | implementacion |
| H5 | MENOR | corregido | skills/task-workflow/duracion.md | plan |

Sin hallazgos nuevos.

## Verificacion

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-097-r2`, commit 4167474, `core.autocrlf=true`, Git Bash; borrado al terminar, repo original sin tocar.
- Tanda pedida (duracion-estimada core y commands, skills, siguiente, approve): 127/128; el unico rojo es el conocido de `chmod` en NTFS. No hay cuarto rojo.
- H1: `2 horas (14 ficheros de codigo)`, `1 h 30`, `2 h`, `90 - 120`, `45 + 30 min`, `1h30` → ilegible; `120`, `120 min`, `45 (3 ficheros)`, `90.` → ok. Por CLI en repos reales (test temporal, 6/6): `2 horas (...)` y `1 h 30` dan `approve/preguntar` y `approve --decidido-por automatico` sale con 1; `45 (3 ficheros)` da `continuar` y 0.
- H4: viñeta, cita, encabezado, acentos graves y `_..._` → ok 120; plantilla seguida de la linea real → 120. Por CLI dan `preguntar` y status 1 (antes `ausente` y aprobaban).
- H3: el mutante `modo !== 'manual' &&` en flujo.ts muere (`siguienteFase (TASK-097): con mas de una hora pregunta en los TRES modos`).
- H2: SKILL.md con CRLF pesa 15355 bytes (< 15360, limite intacto); skills 95/95.
- H5: duracion.md (lineas 45-50) documenta minutos enteros y que solo se descuentan las pausas de `taskctl pausa`.

## Lecturas fuera del contexto permitido

ninguna
