# Informe de revision — TASK-108 (ronda 2)

- Commit revisado: 7d76f6a3b79ccdcf781bca8e2553a7cc758a2c45
- Revisor: code-quality-reviewer (agente general-purpose, modelo haiku)
- Veredicto: aprobada

Veredicto propuesto por el revisor: aprobada. El HEAD posterior (e3f3220) solo toca documentacion y tareas respecto al commit revisado.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | taskcode-plugin/src/hooks/guardia-merge.ts:289-293 (release antes que la rama selectiva) | implementacion |
| MEN-2 | MENOR | corregido | taskcode-plugin/test/hooks/guardia-documentacion.test.ts:422-440 (test de release y hotfix) | implementacion |
| MEN-3 | MENOR | aceptado | taskcode-plugin/src/hooks/guardia-merge.ts:258-261 (`LINEA_SELECTIVA`) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos nuevos CRITICO ni IMPORTANTE introducidos por la correccion.

## Reproduccion y resultados

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-108-r2`, fijado a 7d76f6a (borrado al terminar). `npm install` limpio, `tsc -p .` sin errores; `dist/` versionado coincide con la compilacion.

**Tests del guardian**: 53 tests, 53 pasan (los 52 de la ronda 1 mas el de MEN-1/MEN-2).

**Suite completa (`npm test`, una vez)**: 2219 tests, 2215 pasan, 3 fallan, 1 skipped. Los 3 rojos son los conocidos de Windows (symlink EPERM, chmod, CRLF). Sin EBUSY. Ninguna regresion.

**Verificacion de cada hallazgo**
- MEN-1 (corregido): `release/1.0` con codigo hacia develop devuelve «Un release lleva a la principal todo lo acumulado...» sin la linea de la selectiva. El test se pone rojo con el orden antiguo.
- MEN-2 (corregido): el test de release con codigo y de hotfix hacia la principal existe y pasa.
- MEN-3 (aceptado): sin cambios, como se acordo en la ronda 1.

**Mutantes de la correccion** (revertidos despues):
- M1: rama selectiva antes que el release -> 1 rojo (test MEN-1/MEN-2). Muerto.
- M2: quitar `destino === ramaPrincipal(raiz)` -> 1 rojo (el mismo test). Muerto.
- M3: quitar la rama de release -> 2 rojos (`un release siempre exige la completa` y el de MEN-1/MEN-2). Muerto.

**Caso que la correccion abre**: no encontrado. La comprobacion del destino principal usa el mismo criterio que `finish` (`permitirSelectiva: tipo !== 'hotfix'`, finish.ts:470; un hotfix integra en la principal).

## Notas de revision (fuera de la tabla, no abren ronda)

1. **Hotfix con codigo hacia develop recibe la linea de la selectiva** (anterior a la correccion, reproducido): rama `hotfix/1.0.1` creada desde develop, con codigo, `git checkout develop && git merge --no-ff hotfix/1.0.1` -> codigo 2 con LINEA_SELECTIVA. El bloqueo es correcto; el texto no aplica a un hotfix. No lo introduce la correccion y no es CRITICO.
   Implementador: en el flujo real un hotfix nace de la principal y su backmerge a develop ocurre tras integrarse en ella, asi que lo deja pasar el paso 5 (fuente ancestro de la principal) antes de llegar al mensaje. Queda anotado en el Resultado.
2. **Config leida del arbol, no del destino** (anterior a la correccion, reproducido): un arbol sin `.taskcode/config.yml` (hotfix nacido de una main sin config) hace que el paso 3 deje pasar un merge a develop aunque develop declare `comando_verificacion`.
   Implementador: es la acotacion del criterio 2 a la decision 6b que la persona aprobo en el plan (decision 2 del 2026-11-11): mover los pasos 3 y 6 al destino obliga a mover `finish` a la vez. Queda anotado en el Resultado como pendiente para esa tarea.

## Lecturas fuera del contexto permitido

- `taskcode-plugin/src/commands/finish-verificacion.ts` y `src/commands/finish.ts` (grep de `selectiva`, `permitirSelectiva`, `hotfix`, lineas 466-471): comprobar si `finish` acepta la selectiva en la principal.
- `taskcode-plugin/src/core/config.ts` (grep de `rama_base`): confirmar que develop es destino protegido por defecto.
- `taskcode-plugin/src/hooks/guardia-merge.ts` lineas 73-235 y su `dist/`, con instrumentacion temporal en el clon (descartada): diagnosticar la nota 2.
