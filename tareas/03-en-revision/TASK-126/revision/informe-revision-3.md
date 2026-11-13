# Informe de revision — TASK-126 (ronda 3)

- Commit revisado: c4b7d8871d6e4cb6114e61a9cf8ea7ed911f04a3
- Revisor: code-quality-reviewer (revision independiente, verificacion acotada a las correcciones de la ronda 2)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Ningun hallazgo nuevo: la correccion no abre CRITICO ni IMPORTANTE. Las notas de abajo no van en la tabla.

## Reproduccion

IMP-1 (corregido): en el clon, se quita `yaIntegradaEn` de la llamada a `puertaPesada` del camino idempotente
en `dist/src/commands/finish.js` (mutante). El test «finish (TASK-126, IMP-1)» se pone en rojo (11 de 12): el
assert que falla es `doesNotMatch` sobre el texto antiguo «no se mergea» / «no se ha tocado nada». Con el build
restaurado vuelve a 12 de 12.

IMP-2 (corregido): con una sonda temporal (copia del test de IMP-1 que imprime `err.message`, solo en el `dist`
del clon), el mensaje del camino idempotente es:

```
[ERROR] TASK-850: la rama ya esta integrada en "main" y "develop" (merge hecho fuera de finish), pero los tests pesados (comando_verificacion_pesada) no salen en verde sobre ese arbol: no se cierra la tarea, que no se ha movido de carpeta. El merge ya esta hecho y no se deshace: se arregla hacia delante, en la rama de integracion.
La verificacion del proyecto no esta en verde: la tarea en curso no se puede dar por terminada.
...
pesada: ERROR, 1 test pesado falla
...
Corrige alli hasta que los pesados salgan en verde, commitea y relanza taskctl finish TASK-850. Si la persona decide cerrar igualmente, taskctl finish TASK-850 --sin-verificacion lo salta y lo deja anotado en la tarea.
```

Ya no aparecen «no se mergea» ni «no se ha tocado nada», y el texto describe el estado real. El camino normal conserva
su texto: `finish-verificacion.ts` linea 185 («no se mergea con los tests pesados en rojo ... no se ha tocado nada»),
y el test de la release normal (`verificacion-pesada.test.ts` linea 133) lo sigue aseverando.

## Verificacion hecha

- Clon limpio en `C:\Users\nullcad2025\AppData\Local\pruebas-claude\taskcode\task-126-r3`, rama
  `feature/task-126-verificacion-por-tipo-de-rama-los-tests`, HEAD `f4b08bb`. Ese commit solo añade la peticion de
  revision sobre `c4b7d88`: `git diff c4b7d88 HEAD` no toca `src` ni `test`. `npm install` y `npm run build` sin
  errores; tras el build, git no marca cambios en `dist/`, es decir, el `dist` committeado coincide con `src`.
- `node --test dist/test/commands/verificacion-pesada.test.js`: 12 de 12 en verde, incluido el nuevo test «en el
  camino idempotente con los pesados en verde, una release integrada a mano se cierra».
- Suite completa: no repetida. La peticion trae `verificar-impacto` sobre `c4b7d88` (Commit verificado igual al
  Commit revisado): 960 tests, 0 fallos, salida 0. Vale para esta revision.
- Mutante M3 (en `dist/src/commands/finish.js` se quita `yaIntegradaEn` de la llamada a `puertaPesada` del camino
  idempotente): test IMP-1 en rojo, 11 de 12. Build restaurado y comprobado (la propiedad vuelve a aparecer).
- Lectura de `yaIntegradaEn` en `finish.ts`: correcta para `release` y `hotfix` (ambas ramas se comprueban con
  `isAncestor` antes de entrar al camino idempotente) y para `feature`/`fix` (solo la de integracion, porque
  `MERGEA_A_MAIN` vale `false` para ellos y `mainBranch` es `null`).
- Busqueda en el repo del texto antiguo y de `yaIntegradaEn`: no hay otros tests ni documentos que dependan del
  mensaje del camino idempotente.

## Notas (fuera de la tabla)

- MENOR, no abre ronda: en `finish.ts` linea 688, la parte `tipo !== 'feature' && tipo !== 'fix'` es redundante,
  porque para esos tipos `mainBranch` ya es `null`. No cambia el comportamiento.
- Observacion sobre el texto, no un fallo del cambio: el mensaje dice que se arregla «hacia delante, en la rama de
  integracion», que es lo que pidio IMP-2. Pero la release con su tag ya esta en `main`, y un arreglo solo en
  `develop` no llega a `main` hasta la siguiente release. El mensaje podria decirlo; no es obligatorio.

## Lecturas fuera del contexto permitido

- `tareas/03-en-revision/TASK-126/revision/informe-revision-2.md`: pedido en el encargo, para cotejar IMP-1 e IMP-2.
- `taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md`: skill revisora indicada en el encargo.
