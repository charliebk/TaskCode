# Informe de revision — TASK-148b (ronda 1)

- Commit revisado: 45857fa
- Revisor: code-quality-reviewer (sonnet, independiente)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/fs/evidencia-veredicto.ts (comprobadorEnCommit normaliza, sin test) | implementacion |
| MEN-1 | MENOR | corregido | src/core/config.ts (dedupe de elementosDeEnumerado sin test) | implementacion |
| MEN-2 | MENOR | corregido | src/core/config.ts (cuatro copias de la normalizacion) | implementacion |
| MEN-3 | MENOR | corregido | src/core/doctor-deploy-veredictos.ts, agents/revisor-seguridad-deploy.md (dicen «sin ..») | implementacion |
| MEN-4 | MENOR | aceptado | src/core/sugerencia.ts (umbral de masParecida) | implementacion |
| MEN-5 | MENOR | corregido | src/core/config.ts (validarPatronesExclusion acepta a/../**) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Reproduccion

- Clon con tsc limpio; config*, cobertura, doctor-deploy*, utilidades*, commands/doctor* y sincronizacion*: 316/316.
- Mutantes cazados: rechazo sale y control, maximo del entero, sugerencia apagada, case renombrado (paridad), rechazos del patron (solo review-exclusion). Sobreviven: dedupe de elementosDeEnumerado (MEN-1) y la normalizacion de comprobadorEnCommit (IMP-1).
- IMP-1: con git real, `HEAD:a/../b/y` no existe y `HEAD:b/y` si; sin normalizar, una evidencia `a/../b` pasaria la validacion y se rechazaria como no versionada. Ningun test lo fija.
- MEN-2: cuatro `path.posix.normalize(x.replace(/\/g, '/'))` en config son normalizarRutaRelativa.
- MEN-3: el JSDoc de motivoRutaInvalida y el agente revisor-seguridad-deploy dicen «sin ..».
- MEN-4: con el umbral de masParecida dejan de sugerirse git/hub/lab (plataforma_remota) y mr (que sugeria mal merge). Aceptado: solo entradas de tres letras o menos; las erratas reales (gitlb, gitub, automatco, merg...) se siguen sugiriendo.
- MEN-5: `a/../**` se acepta ahora en los patrones de exclusion (git lo evalua como `**` y excluye todo el repo).
- Puntos vigilados: los mensajes de entero no los cita ningun test ni doc vigente; el test de paridad falla en voz alta si cambia el formato del JS.

## Regla 4D

- Duplicacion: MEN-2
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: IMP-1, MEN-1

## Lecturas fuera del contexto permitido

- agents/revisor-seguridad-deploy.md (busqueda), test/commands/review-exclusion.test.ts, test/commands/doctor-deploy-resultado.test.ts y busquedas en test/ y src/; git show de origin/develop para comparar.
