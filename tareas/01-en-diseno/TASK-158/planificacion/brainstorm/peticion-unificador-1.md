# Peticion al unificador — TASK-158 (ronda 1)

- Tarea: TASK-158 — Regla 4D preventiva en todos los procesos que crean o actualizan codigo
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-25
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (1 puntos): **simple**
- Senales encontradas:
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

Los dos niveles NO coinciden. Se lanzan 3 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, dicho, vale mas que un plan que finge estar completo.
2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie es la peor salida posible de este paso.
3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.
4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Los desacuerdos entre roles y como se resuelve cada uno.
- Reutilizacion (Regla 4D): lo que ya existe en el repo y se va a usar (helpers, funciones, fixtures, tests), buscado ANTES de proponer nada nuevo; y lo que se crea nuevo, con el motivo de no reutilizar lo que hay. Duplicar un helper que ya existe es un hallazgo IMPORTANTE.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Que la Regla 4D (sin duplicacion, desviacion, diluvio ni disfraz) se aplique al escribir codigo y no solo al auditarlo: cada camino del plugin que crea o modifica codigo (plan, implementacion tras start, correcciones de cada ronda, verificar-menores, hotfix y release, agentes del brainstorm, doctor-deploy y skills revisoras) la exige y la comprueba. Decision de Carlos: requisito para publicar la 0.19.0.
````

### Criterios de aceptacion

````
Hay un inventario en la tarea de cada camino que crea o actualiza codigo, con que exige hoy de 4D y que le falta
Cada camino del inventario exige 4D al escribir (instruccion en su skill o agente, y comprobacion de taskctl donde la haya), cerrando los huecos que TASK-153 no cubrio
Las correcciones de una ronda de revision y los MENORES corregidos pasan por la misma exigencia 4D que la implementacion (autorrevision 4D por ronda y por correccion)
Un test por camino falla si ese camino deja de exigir 4D
verificar-impacto no devuelve la copia de dist/src si HEAD cambio durante la ejecucion (carrera del freno con update-fix vista en TASK-145b)
````
