# Peticion al unificador — TASK-040 (ronda 1)

- Tarea: TASK-040 — F3-T1 taskctl review para la ronda 2 y siguientes
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-04
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (1 puntos): **trivial**
- Senales encontradas:
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

Los dos niveles NO coinciden. Se lanzan 2 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, dicho, vale mas que un plan que finge estar completo.
2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie es la peor salida posible de este paso.
3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.
4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Los desacuerdos entre roles y como se resuelve cada uno.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Que la ronda 2 y siguientes de una revision las genere `taskctl review` y no
un agente a mano (auditoria del 2026-10-03, A2 y D3). Hoy `review` solo existe
desde `en-curso`: con la tarea en `en-revision` los errores mandan a `start`,
que manda a `plan`, en circulo; y las peticiones de ronda N de TASK-017, 018,
020, 022, 033 y 038 se escribieron a mano. La ronda N+1 debe embeber solo el
diff desde el commit revisado en la ronda anterior (con las exclusiones de
`excluir_de_revision`) y listar los hallazgos no cerrados de la tabla del
informe anterior (`| ID | Severidad | Estado | Fichero |`, TASK-036).

Conflicto a resolver en el diseno: la §16.3 dice que `ultimo_commit_revisado`
se actualiza cuando una revision TERMINA aprobada, no al pedirla, y el
criterio 2 pide escribirlo en cada ronda. El commit revisado de cada ronda ya
consta en su informe (`- Commit revisado:`).
````

### Criterios de aceptacion

````
Transicion `en-revision -> en-revision` permitida solo si el ultimo informe dice `cambios-solicitados` o `aprobada con correcciones`
`review` escribe `ultimo_commit_revisado` en cada ronda y la ronda N+1 embebe `ultimo_commit_revisado..HEAD` con las exclusiones de F1-T1
La peticion lista los hallazgos no cerrados de la tabla del informe anterior
Los mensajes de error dejan de mandar de `start` a `plan` en circulo
Test que encadena ronda 1, cambios y ronda 2 contra un repo real
````
