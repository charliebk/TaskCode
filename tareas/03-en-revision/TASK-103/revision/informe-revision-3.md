# Informe de revision — TASK-103 (ronda 3)

- Commit revisado: 146548b8305aa751bf4657d7edd9bd830a29a091
- Revisor: general-purpose (sonnet), skill code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| NUE-1 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/guardia-merge.ts:`esRevision` | implementacion |
| NUE-2 | CRITICO | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/comando-merge.ts:`PREFIJOS` / `sinPrefijos` | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Hallazgos nuevos: **sin hallazgos**. La correccion no abre ningun fallo CRITICO ni una regresion de bloqueo o paso.

## Verificacion

### Puerta determinista

Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-103-r3`, `npm install` y `npm test` una vez: 2178 tests, 2174 pasan, 3 fallan, los conocidos de Windows nativo (128 symlink `EPERM`, 781 `chmod` en NTFS, 787 CRLF). Ningun otro rojo.

### NUE-1: `git checkout HEAD` / `@` (corregido)

Con el hook real, en `develop` y con `feature/x` sin integrar:

| Comando | Salida |
|---|---|
| `git checkout HEAD && git merge feature/x` | exit 2, «develop» |
| `git checkout head && git merge feature/x` | exit 2, «develop» |
| `git checkout @ && git merge feature/x` | exit 2, «develop» |
| `git checkout main && git checkout HEAD && git merge feature/x` | exit 2, «main» |
| `git checkout main && git switch @ && git merge feature/x` | exit 2, «main» |
| `git checkout HEAD~0 && git merge feature/x` | exit 0 (`HEAD~0` si desacopla: correcto) |
| `git checkout HEAD^ && git merge feature/x` (sin padre) | exit 2, «develop» (el checkout fallaria: correcto) |

Mutaciones: quitar la exclusion `HEAD|@`, o dejar solo `head`, ponen en rojo el test 23. Los tests discriminan.

### NUE-2: merge en la condicion de `if`/`while`/`until`/`elif` (corregido)

Con el hook real, exit 2 y «develop» en todos: `if git merge x; then :; fi`, `while git merge x; do :; done`, `until git merge x; do :; done`, `if false; then :; elif git merge x; then :; fi`, `if false; then :; else if git merge x; then :; fi; fi`, `for i in 1; do if ! git merge x; then :; fi; done` y `bash -c "if git merge x; then :; fi"`. Con `if git checkout main; then git merge x; fi`, el destino es «main».

Quitar de `PREFIJOS` `if`, `elif`, `while` o `until`, una a una, pone en rojo los tests 18 y 23.

### Fallo que pueda abrir la correccion

- Exencion de solo documentacion: con `if`/`while`/`until` delante, `comandoSoloIntegra` da `false` (`seg.length !== bruto.length`). Coincide con el CHANGELOG y no abre una via de paso.
- Falsos positivos: `sinPrefijos` solo quita esas palabras al inicio del segmento; `echo if git merge x` no se confunde con un merge.
- Excluir `HEAD`/`@` solo cambia que dejan de contar como destino nuevo, que es lo correcto.

## Notas (no abren ronda)

1. `git checkout --detach HEAD` y `git switch --detach HEAD` dejan ahora el destino anterior: el guardian evalua la rama actual y bloquea, aunque el merge no entraria en ninguna rama. Falla del lado seguro.
2. La regex `/^(?:head|@)$/i` ignora mayusculas por Windows: en Linux, una rama llamada `head` se trataria como no-cambio. Muy raro, y falla del lado seguro cuando la actual es de integracion.
3. IMP-1, IMP-2, MEN-1 y MEN-2 siguen corregidos, sin regresion.

## Lecturas fuera del contexto permitido

ninguna. Carpetas temporales borradas; el repo original no se modifico.
