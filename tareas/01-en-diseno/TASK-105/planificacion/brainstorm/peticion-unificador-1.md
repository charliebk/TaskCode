# Peticion al unificador — TASK-105 (ronda 1)

- Tarea: TASK-105 — Verificacion proporcional B2: decision entre refs y huella para el nivel 2
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-11
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (2 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - dependencias: 1 dependencias (TASK-096) (+1)

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
Segunda parte de TASK-096 (troceada por la regla de una hora, decision de Carlos 2026-11-11). Sobre la decision pura de TASK-096 (clave rutas_verificacion_parcial y resultado selectiva), decidirVerificacionEntre hace un segundo rutasDeTarea con los patrones documentacion + parcial solo si la base declara la clave y el diff no es solo documentacion; huellaDeCommit acepta un contexto opcional como huellaDelArbol; verificarConMemo no guarda el memo selectiva con el arbol sucio. Nada observable cambia todavia: finish y el guardian siguen tratando selectiva como completa. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).
````

### Criterios de aceptacion

````
Con la clave declarada en la base, decidirVerificacionEntre devuelve selectiva si todo lo que no es documentacion cae en rutas_verificacion_parcial y completa si algo queda fuera, cambia .taskcode/config.yml o el diff no se puede calcular (un test por caso, repo temporal)
Sin la clave no se lanza ningun git de mas y la decision es la de la 0.14.0 (test)
huellaDeCommit con contexto casa con la huella que guarda la selectiva para la misma base; el memo selectiva no se guarda con el arbol sucio (test por caso)
La suite completa pasa en verde (npm test) sin debilitar ningun test
````
