# Informe de revision — TASK-153c (ronda 1)

- Commit revisado: 39494465e477f912b87cf8538689891f93eb2723
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer, independiente
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MENOR-1 | MENOR | abierto | src/core/informe-revision.ts (idsRegla4D) | implementacion |
| MENOR-2 | MENOR | abierto | test/core/regla-4d.test.ts | implementacion |
| MENOR-3 | MENOR | abierto | src/core/informe-revision.ts (idsRegla4D) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### MENOR-1 — Un `cumple (...)` que cita un ID se cuenta como hallazgo
La regex se aplica a todo el valor: `cumple (igual que TASK-137 y SHA-256)` da `['TASK-137','SHA-256']`, contra el criterio «un ID suma, cumple no». `faltasRegla4D` exige que `cumple` abra la linea. Hoy no ocurre en ningun informe real.

### MENOR-2 — Formatos raros sin test (`MEN-1.2`, `MEN-3b`, `cumple` con ID citado)
### MENOR-3 — `new Set` y `toUpperCase` de idsRegla4D en parte redundantes con el Set de hallazgos4DDe (sin consecuencia observable)

### Reproduccion empirica
Clon temporal (borrado): tsc sin errores; 33/33 tests de los ficheros tocados. `taskctl metricas` sobre el repo: tareas anteriores a TASK-137 dan «—»; TASK-137 0/0/0/2, TASK-153a 2/1/0/2, TASK-141 0/1/0/1, TASK-142 0/0/0/2, TASK-153b 1/0/0/1, TASK-154 0/0/0/0, coherentes con sus informes. Mutaciones: sin seccion=0 (5 rojos), clave sin revisor (1 rojo), ignorar ID (1 rojo), sin toUpperCase (1 rojo); quitar el Set interno, equivalente por lectura.

## Lecturas fuera del contexto permitido

- Informes de revision de tareas reales (para comparar la columna) y src/commands/metricas.ts (uso de COLUMNAS_METRICAS, --json).

## Regla 4D
- Duplicacion: cumple
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: MENOR-2
