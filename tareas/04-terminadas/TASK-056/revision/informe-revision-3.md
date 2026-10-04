# Informe de revision — TASK-056 (ronda 3)

- Commit revisado: f90787145d1da92726899578afd5b36b672312ad
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-2 | IMPORTANTE | corregido | src/core/transiciones.ts:48-104 |
| IMP-4 | IMPORTANTE | corregido | src/core/transiciones.ts:48-86 (`dentroDeBloque`) |
| MEN-9 | MENOR | corregido | test/core/transiciones.test.ts |
| MEN-10 | MENOR | corregido | src/core/flujo.ts:55-59, 66-70, 159-161 |
| MEN-11 | MENOR | corregido | test/core/transiciones.test.ts |
| MEN-12 | MENOR | aceptado | src/core/transiciones.ts:58-61, 77-80 |

### Puerta determinista

Clon nuevo, `npm install && npm test` una vez: 1015 tests, 1012 verdes; solo
los 3 rojos conocidos de Windows. `tsc` sin errores, `dist` sincronizado.

### Verificacion de la ronda 2

IMP-4 / IMP-2 cerrados con el CLI real, `modo_flujo: manual`, ejemplo con una
fila `plan | automatico`: (A) ```` envolviendo ```; (B) ```bash sin cerrar
(el caso de regresion); (C) `~~~~` con info envolviendo `~~~`; (D) vallas
sangradas 3 espacios; (E) cierre con espacios detras. En todos, modo manual
en todo el ciclo, una sola seccion real y el ejemplo intacto. Barrido de los
59 `tarea.md` de `tareas/`: 0 vallas sin cerrar. MEN-9: los cuatro mutantes
supervivientes de la ronda 2 mueren. MEN-10: textos al dia; su mutante muere.

Mutantes de `dentroDeBloque`: mueren el cierre de cualquier longitud, con
texto detras, de cualquier caracter, la apertura con cualquier sangria, «sin
cerrar = bloque hasta el final» y `~~~` no valla. Sobreviven cuatro (MEN-11).

### MEN-11 — Tres reglas de vallas sin test

Sobreviven: cierre con cualquier sangria (M5), apertura sin el lookahead del
texto de info (M7), y tras una valla sin cerrar dejar de escanear (M8) o
saltar al final (M10). Cada uno cambia el resultado con una entrada concreta;
M8/M10 es la regla que sostiene «sin cerrar no abre bloque».

### MEN-12 — Residuo de «una valla sin cerrar no abre bloque»

(F) Si la valla sin cerrar es justo la que envuelve un ejemplo de
`## Transiciones`, el ejemplo cuenta como registro antes de `plan` y recibe
las filas. (G) Una valla sin cerrar en el enunciado empareja con el cierre de
un bloque escrito a mano dentro de la seccion real (identico a CommonMark).
Ambos piden dos condiciones anomalas a la vez; ninguna regla resuelve a la vez
F y el caso B. Se acepta; basta documentarlo.

### Observacion

`dentroDeBloque` es cuadratico con muchas vallas sin cerrar (20 000 lineas,
9,8 s); ningun `tarea.md` realista se acerca.

## Correcciones (orquestador)

- MEN-11: tres tests nuevos (seguir buscando tras una valla sin cerrar, una
  linea con ``` en mitad del texto no abre, un cierre sangrado 4 espacios no
  cierra). M5, M7, M8 y M10 mueren.
- MEN-12: documentado en el comentario de `dentroDeBloque`.
