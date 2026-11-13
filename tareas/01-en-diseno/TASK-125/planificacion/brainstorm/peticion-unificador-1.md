# Peticion al unificador — TASK-125 (ronda 1)

- Tarea: TASK-125 — Freno Stop con presupuesto de tiempo y clave propia: si se pasa, anota y no bloquea
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (6 puntos): **alta**
- Senales encontradas:
  - etiquetas_adicionales: 3 etiquetas (2 mas alla de la primera) (+2)
  - palabra_alto_riesgo: seguridad (+2)
  - dependencias: 1 dependencias (TASK-111) (+1)
  - criterios_aceptacion: 6 criterios (umbral: 5) (+1)

Los dos niveles NO coinciden. Se lanzan 3 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

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
Medido en ToolsaWeb (153 tareas terminadas, taskctl metricas, 2026-11-12): la revision ha pasado del 51 % al 59-65 % del tiempo de cada tarea y el freno Stop ejecuta la selectiva al final de cada turno, hasta 26 min por turno en tareas del nucleo. Hoy el freno, las rondas de review y finish comparten comando_verificacion_selectiva y timeout_verificacion_selectiva (src/hooks/freno-stop.ts, src/commands/review.ts, src/commands/finish-verificacion.ts), asi que no se puede dar al freno un comando mas rapido sin abaratar tambien la verificacion de la ronda. Se busca que el freno tenga su propio comando rapido y un presupuesto de tiempo (por ejemplo 3 min): si lo supera, anota el exceso en el registro del freno y deja parar el turno en vez de bloquearlo; la seguridad la siguen dando review y finish. Toca freno-stop.ts y usa el registro de ejecuciones del freno: va despues de TASK-111. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Una clave nueva comando_verificacion_freno en .taskcode/config.yml la usa solo el freno Stop; review sigue con comando_verificacion_selectiva y finish con sus comandos, y sin la clave nueva el freno se comporta como hoy (test con repo temporal y test de regresion)
Una clave presupuesto_freno_s (180 por defecto cuando se declara comando_verificacion_freno; sin ninguna de las dos, sin tope propio como hoy) corta la verificacion que corra el freno al agotarse: el freno no bloquea, deja parar el turno con un aviso de una linea y anota resultado excedido en el registro de TASK-111 (test con un comando que tarda mas que el presupuesto)
Un rojo dentro del presupuesto sigue bloqueando el turno como hoy (test)
config.ts valida las dos claves (presupuesto entero positivo y no mayor que el timeout del hook Stop) y taskctl doctor muestra que comando corre cada puerta: freno, review y finish (test)
README, CHANGELOG y la skill task-workflow explican el reparto de claves por puerta
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
