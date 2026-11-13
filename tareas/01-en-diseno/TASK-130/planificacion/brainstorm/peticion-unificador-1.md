# Peticion al unificador — TASK-130 (ronda 1)

- Tarea: TASK-130 — Poda periodica de tests redundantes: fusionar o borrar sin perder cobertura
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **simple**
- Heuristica (4 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 4 etiquetas (3 mas alla de la primera) (+3)
  - dependencias: 1 dependencias (TASK-129) (+1)

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
Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y el cierre de TASK-306, con un solo test cambiado, espero 44 min 52 s. Cada tarea y cada ronda suman tests, y ninguno se retira aunque otro posterior ya cubra lo mismo. Se busca una tarea de mantenimiento periodica, propuesta por el plugin cuando la suite crece, que fusione o borre los tests redundantes sin bajar la cobertura de las lineas que ya cubrian, y una primera pasada sobre la suite de TaskCode (docs/auditoria/PERFIL-TESTS-2026-11-12.md tiene su perfil por fichero). Usa el aviso de crecimiento de TASK-129: va despues de ella. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
taskctl doctor propone abrir una tarea de poda (con el comando taskctl new ya escrito) cuando salta el aviso de crecimiento de la suite o han pasado mas de N tareas cerradas desde la ultima poda, con N configurable y 30 por defecto (test con repo temporal)
La skill task-workflow describe el procedimiento de poda: como localizar duplicados, que se fusiona y que se borra, y que la cobertura de las lineas que cubrian no baja (comprobado con la cobertura sobre lineas de TASK-074)
Primera pasada en TaskCode: la suite rapida y la completa pierden al menos un 10 % de duracion o de numero de tests sin bajar la cobertura total, con el antes y el despues anotados en el plan (comprobado con scripts/perfil-tests.mjs)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
