# Informe de revision — TASK-153b (ronda 2)

- Commit revisado: 090c91b02e47f7c1fe7caa1f0b4158e37da20e50
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer, independiente (verificacion acotada)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/candidatos-4d.ts (candidatos4D, nombresParecidos, indicePorLongitud, parecidasEn) | implementacion |
| IMP-2 | IMPORTANTE | corregido | src/commands/review.ts (seccionCandidatosDeRonda), src/core/candidatos-4d.ts (topes) | implementacion |
| MENOR-1 | MENOR | abierto | test/core/candidatos-4d.test.ts, src/core/candidatos-4d.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### MENOR-1 — El test de coste es de tiempo
El test de IMP-1 mide el reloj (< 1,5 s): con la maquina muy cargada puede dar un rojo intermitente (confirmado: en la suite completa de finish tardo 3,4 s).

### IMP-1 — verificado: corregido
Clon temporal (borrado): tsc sin errores, 12/12 tests de candidatos. Coste sin parecidos: 4.000 x 200 pasa de 6,7 s a 1,6 s; 30.000 x 100 de 25 s a 5,9 s. Quitar el indice y el prefiltro lo mata el test de coste. Coste residual en casos extremos (nombres de 40 letras, 30.000 x 100: 65 s): la causa original esta resuelta y el contrato queda en el test (5.000 x 100 < 1,5 s). Nota opcional: una `distanciaEdicion` acotada con corte temprano lo bajaria un orden de magnitud. El test es de tiempo: con la maquina muy cargada podria dar un rojo intermitente.

### IMP-2 — verificado: corregido
Mueren todas las mutaciones que sobrevivian: indice y prefiltro, catch que relanza, MAX_DEFINICIONES, MAX_PARECIDOS, MAX_TESTS, diff de tests desde la base, existentes de HEAD, nuevas parecidas entre si, «y N mas» de candidatos y de parecidos. Sobrevive solo quitar el `Math.abs` del prefiltro: mutante equivalente (el indice ya filtra).

### Diff de la correccion
Margen de `parecidasEn` superconjunto del real (no pierde candidatos); pares entre nuevas sin duplicar; pathspecs de extension y exclusion correctos; sin ciclo de imports; dist identico tras tsc.

### Notas (sin abrir ronda)
Siguen vivas dos mutaciones de MENOR: el mensaje especial de ENOBUFS (MENOR-7) y pasar `excluir` desde review al grep (MENOR-1). El codigo es correcto; falta red de regresion.

## Lecturas fuera del contexto permitido

- src/core/sugerencia.ts (distanciaEdicion): coste residual.
- informe-revision-1.md: lo pedia la peticion.

## Regla 4D
- Duplicacion: cumple
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: cumple
