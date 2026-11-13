# Peticion al unificador — TASK-129 (ronda 1)

- Tarea: TASK-129 — Freno al crecimiento de la suite: presupuesto de tests por criterio, pesados marcados y aviso de crecimiento
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-dominio-1.md` — rol dominio
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (8 puntos): **critica**
- Senales encontradas:
  - etiquetas_adicionales: 4 etiquetas (3 mas alla de la primera) (+3)
  - palabra_alto_riesgo: rendimiento (+2)
  - dependencias: 2 dependencias (TASK-126, TASK-128) (+2)
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

Los dos niveles NO coinciden. Se lanzan 4 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

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
Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y la revision ha pasado del 51 % al 59-65 % del tiempo de cada tarea; cada ronda anade tests (unos 1130 MENORES y 350 IMPORTANTES en 153 tareas) y la suite solo crece. Nada en el plan ni en las skills limita cuantos tests se escriben por criterio, los de rendimiento y escala corren con los demas y nadie avisa de que la suite crece o tarda mas. Se busca un presupuesto de tests por criterio en el plan y en la skill, que los tests de rendimiento y escala se marquen como pesados (los que TASK-126 solo corre en release/*) y que doctor y metricas avisen del crecimiento de la suite y de su duracion. Va despues de TASK-126 y de TASK-128, de cuyo registro sale la duracion de la completa. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
La plantilla de plan-final.md y la skill plan piden por cada criterio cuantos tests nuevos preve, con un presupuesto por defecto (por ejemplo 1 a 3) y el motivo si lo supera; la skill review trata como MENOR un test que duplica a otro ya existente (test sobre la plantilla y las skills)
Las skills plan y task-workflow explican como marcar un test de rendimiento o escala como pesado en Node, Rust, Java y .NET, y que corre solo con comando_verificacion_pesada (test que comprueba el texto)
taskctl metricas muestra, por version, el numero de tests y la duracion de la completa a partir del registro de verificaciones de TASK-128, y doctor avisa si cualquiera crecio mas de un umbral configurable (20 % por defecto) desde la version anterior (test con repo temporal)
Sin datos de duracion o de numero de tests, doctor y metricas no avisan ni fallan (test)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
