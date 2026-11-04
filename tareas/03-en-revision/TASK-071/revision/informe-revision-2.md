# Informe de revision — TASK-071 (ronda 2)

- Commit revisado: ec2295ffcdcf53be7eb58e166e753f4592c447aa
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-071 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | test/hooks/freno-stop.test.ts (test de memo) | implementacion |
| IMP-2 | IMPORTANTE | corregido | src/hooks/freno-stop.ts (cota del timeout) | implementacion |
| MEN-1 | MENOR | corregido | src/fs/verificacion.ts (bytesTotales en `cortada`) | implementacion |
| MEN-2 | MENOR | corregido | src/hooks/freno-stop.ts (tareas ilegibles) | implementacion |
| MEN-3 | MENOR | corregido | CHANGELOG.md («sin credenciales») | plan |
| MEN-4 | MENOR | corregido | README.md (ignorados no invalidan el memo) | implementacion |
| MEN-5 | MENOR | corregido | src/core/informe-verificacion.ts (`codigo null` en `roja`) | implementacion |
| MEN-6 | MENOR | corregido | CHANGELOG.md («sin cambio de comportamiento») | implementacion |
| MEN-7 | MENOR | corregido (parcial, ver MEN-8) | test/hooks/freno-stop.test.ts (UTF-8, version del memo, aviso de arbol) | implementacion |
| MEN-8 | MENOR | aceptado | src/fs/ejecucion-acotada.ts (`leerCola`, salto de continuacion UTF-8 sin test) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Ningun CRITICO ni IMPORTANTE abierto. Los nueve hallazgos de la ronda 1 estan corregidos. Queda un
MENOR nuevo (el revisor lo llamo MENOR-1; aqui MEN-8), no bloqueante.

### Lo reproducido

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-071-r2`; `npm install && npm run build` deja
  `dist/src` igual a lo versionado (solo cambia `package-lock.json`, por `npm install`).
- `freno-stop.test.js` 18/18; sincronizacion 25/25; `doctor`, `new`, `config-sincronizacion`,
  `config-verificacion`, `distribucion` y `origin-guard` con `# fail 0`. Suite completa no relanzada.
- Smoke por stdin con una tarea en curso ilegible: exit 0 y el aviso
  `no se pudo leer tareas\02-en-curso\TASK-009\tarea.md ...` en stderr.

### Mutantes (sobre `dist/src`, con `freno-stop.test.js`)

Muertos ahora (sobrevivian en la ronda 1): huella sin contenido de los sucios (dos variantes), sin la
cota `timeoutEfectivoS`, `MARGEN_HOOK_S = 0`, sin comprobar la version del memo, sin el salto UTF-8 de
`recortarCola`, sin el aviso de arbol cambiado; y los de las correcciones: MEN-1 sin restar la marca,
MEN-2 `sinLeer` → `DEJAR_PARAR`, MEN-5 `codigo === null` → `false`. Sobrevive solo el salto UTF-8 de
`leerCola` (MEN-8).

### Estado de la ronda 1

IMP-1 (test reescribe `nuevo.txt` con otro contenido y exige 3 ejecuciones), IMP-2 (`timeoutEfectivoS`
pura, probada con 99999, 3541, 3540, 600 y 1), MEN-1, MEN-2, MEN-3, MEN-4, MEN-5, MEN-6: corregidos.
MEN-7: corregido salvo el salto UTF-8 de `leerCola`.

### Regresiones (`c4079d9..ec2295f`)

Sin regresiones. El camino de ilegibles solo se activa con `ilegibles.length > 0`; sin comando sale
`DEJAR_PARAR` sin aviso; si la rama casa con una tarea legible el freno actua y no avisa; catch
generico, `stop_hook_active` e interruptor sin cambios.

### MEN-8

`leerCola` descarta los bytes de continuacion UTF-8 sueltos del principio de la cola, pero ningun test
lo cubre: mutarlo a `while (false)` deja todo en verde. Impacto cosmetico (un U+FFFD al inicio de la
salida mostrada, que ademas `recortarCola` vuelve a recortar casi siempre). Aceptado sin corregir: en
modo automatico el codigo que se mergea es el revisado; queda como test pendiente.

### Limitaciones de la revision

Solo Windows (sin POSIX ni tuberia de stdin en Linux); sin suite completa; no verificado si Claude Code
muestra a la persona el stderr de un hook que sale con 0 (el aviso de MEN-2). Carpetas borradas.
