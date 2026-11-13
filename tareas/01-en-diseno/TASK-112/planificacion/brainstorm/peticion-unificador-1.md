# Peticion al unificador — TASK-112 (ronda 1)

- Tarea: TASK-112 — P-4: el revisor reutiliza la verificacion de ronda y las rondas 2+ solo relanzan al revisor con pendientes
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (3 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 3 etiquetas (2 mas alla de la primera) (+2)
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
La ronda 2 cuesta el 94 % de la ronda 1 en ToolsaWeb: cada revisor clona, compila y corre la suite aunque taskctl review acabe de verificar el mismo commit, y en TASK-293 de ToolsaWeb cada ronda extra relanzo a los dos revisores aunque el hallazgo era de uno. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-4)
````

### Criterios de aceptacion

````
La peticion de revision trae el resultado de la verificacion de ronda (commit, huella, comando, estado) y la guia de revision dice que no se repite la suite si casa con el commit revisado (test sobre la peticion)
Desde la ronda 2, taskctl review solo genera peticion para los revisores con hallazgos no aceptados o cuyos ficheros toca la correccion (test con dos revisores en repo temporal)
Desde la ronda 2, la peticion de cada revisor lista solo sus hallazgos CRITICO e IMPORTANTE no resueltos de la ronda anterior junto al diff de la correccion, y la guia de revision pide comprobar esos y lo que toca la correccion, sin revisar de nuevo el resto ni los MENORES (test sobre la peticion)
Un revisor cuyos unicos pendientes son MENORES, y cuyos ficheros no toca la correccion, no se relanza en la ronda 2+ y consta asi en tarea.md (test con dos revisores en repo temporal)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
