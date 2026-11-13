# Informe de revision — TASK-126 (ronda 1)

- Commit revisado: 0ea8524e8db888305f7c6f443257a51b7f9bf0ac
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### IMP-1 — El camino idempotente de finish (rama ya integrada) cierra una release sin correr los pesados

`puertaPesada` solo se llama dentro de `puerta()` (finish.ts, tras `puertaVerificacion`). El camino de
reintento (`integradaEnDevelop && integradaEnMain` -> `puertaReintento`, TASK-123) no la invoca: corre solo la
completa y cierra. Caso real: el script de la release da conflicto con la principal, la persona lo resuelve a
mano y reintenta `taskctl finish`; ese commit de resolucion no pasa por el guardian (no es un `git merge`).
Resultado: una release llega a la principal sin los pesados, que es justo lo que la tarea dice garantizar.

Reproduccion (clon, test con repo temporal real, config con `comando_verificacion_pesada` y desenlace `ko` para
los pesados): se prepara una release en revision, se hace `git merge --no-ff` de la rama en `main` y en `develop`
a mano, y se ejecuta `runFinishCommand`. Salida: `completa= 1 pesada= 0`, y `finish` termina bien. Con los pesados
en rojo, la tarea se cierra igualmente y sin anotar nada. Esperado: o correr los pesados tambien en el reintento
(tipos de `verificacion_pesada_en`) o dejar dicho de forma explicita en CHANGELOG, doc y skill que el reintento no
los corre. Hoy la doc afirma que `finish` los corre en esos tipos sin esa salvedad.

### MEN-1 — La rama de hotfix del guardian no tiene test

Mutante sobre `dist/src/hooks/guardia-merge.js`: `const tipo = integ.release ? 'release' : null;` (el guardian deja
de reconocer `hotfix/`). Resultado: `verificacion-pesada.test.js` sigue en verde (9 de 9). Ningun test cubre que el
guardian exija los pesados a un hotfix listado en `verificacion_pesada_en` ni que no los exija si no lo esta. Lo
cubre en `finish` el test del hotfix, pero no en el guardian.

Sin mas hallazgos: no encontre fallos en finish de release con `--merge-request` (se rechaza antes, para
hotfix y release), en la ruta de documentacion (una release nunca es exenta, ni en finish ni en el guardian; un
hotfix solo de documentacion salta los pesados en finish y el guardian lo exime igual, coherente), ni en el
enlace finish -> memo `pesada` -> guardian (tras un finish con pesados en rojo el guardian bloquea con "su ultima
ejecucion NO salio en verde").

## Verificacion hecha

- Clon limpio de la rama (commit c435741, que contiene 0ea8524), `npm install` y `npm run build` sin errores.
- Tests afectados (`verificacion-pesada`, `config-freno`, `guardia-merge`, `finish-verificacion`, `tamanos`):
  56 de 56 en verde. No se corrio la suite completa (la peticion trae la selectiva en verde del mismo commit).
- Mutantes sobre `dist/`, cada uno restaurado despues, con `verificacion-pesada.test.js` y `guardia-merge.test.js`:
  - M1 finish no corre los pesados: rojo (3 tests).
  - M2 finish los corre en cualquier tipo: rojo (feature/fix y hotfix).
  - M3 el guardian nunca los exige: rojo (test del guardian).
  - M4 y M4b el guardian los exige a todo tipo o ignora la lista: rojo (test del guardian).
  - M5 el memo de pesada se guarda en el fichero de la completa: rojo (test del guardian).
  - M6 hotfix siempre corre aunque no este en la lista: rojo (test del hotfix).
  - M7 solo release, ignorando la lista: rojo (test del hotfix).
  - M8 el guardian no reconoce hotfix: sigue verde (MEN-1).

## Reproduccion

Tests extra escritos en el clon (borrados con el): `rev-extra.test.ts`, copia del entorno de
`verificacion-pesada.test.ts`.

1. Reintento idempotente (IMP-1): release integrada a mano en `main` y `develop`, pesados en `ko`, `runFinishCommand`
   -> `completa= 1 pesada= 0`, cierre correcto.
2. finish con pesados en rojo, luego guardian sobre `git checkout main && git merge --no-ff <release>` -> codigo 2
   con "una rama release exige tambien los tests pesados ... su ultima ejecucion NO salio en verde"; despues, con
   pesados en verde, `finish` integra la release en `main`.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-fixtures.ts` y el cuerpo de `puertaReintento`
  en `finish-verificacion.ts` y `finish.ts` (zona de reintento): para armar la reproduccion de IMP-1.
- `exencionDocumentacion` en `src/hooks/guardia-merge.ts`: para comprobar el caso de documentacion en release.
