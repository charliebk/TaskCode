# Peticion al unificador — TASK-052 (ronda 1)

- Tarea: TASK-052 — F6-T5 Telemetria de fases y heuristica recalibrada
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-05
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (0 puntos): **trivial**
- Senales encontradas:
  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)

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
Hoy saber cuanto tardo cada fase de una tarea exige reconstruirlo a mano
desde los mensajes de commit, y la heuristica de complejidad no ha acertado
nunca su senal de riesgo (auditoria B8, C5). Cada transicion escribira su
marca de tiempo en el frontmatter, `taskctl metricas` sacara la tabla de
fases por tarea, y la heuristica se recalibra con las tareas cerradas
usando las rondas de revision como coste real, quitando de la config las
claves que nada lee (`tolerancia_*`, `modelo_consulta_discrepancia`).
````

### Criterios de aceptacion

````
Cada transicion escribe su marca de tiempo en el frontmatter y `taskctl metricas` saca la tabla de fases por tarea
Heuristica recalibrada con las tareas cerradas usando las rondas como coste real; se quitan `tolerancia_*` y `modelo_consulta_discrepancia`
````
