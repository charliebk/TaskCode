# Peticion al unificador — TASK-126 (ronda 1)

- Tarea: TASK-126 — Verificacion por tipo de rama: los tests pesados solo en la puerta de release
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
  - palabra_alto_riesgo: rendimiento (+2)
  - dependencias: 1 dependencias (TASK-115) (+1)
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
Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y 29 de ellos son el paso de cargo test con los pesados --ignored; el cierre de TASK-306, con un solo test cambiado, espero 44 min 52 s. Hoy comando_verificacion es uno solo para cualquier finish y para el guardian de merges, sea feature, fix o release. Se busca una verificacion por tipo de rama de Git-Flow: los tests pesados (rendimiento, escala, --ignored) solo se exigen en la puerta de las ramas release/* (y hotfix/* si el proyecto lo declara), y las feature/* y fix/* se cierran con la completa sin pesados. Relacion con TASK-115 (completa por lote): ambas tocan finish-verificacion.ts y el guardian de merges, asi que va despues de ella. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Una clave nueva comando_verificacion_pesada se ejecuta, ademas de comando_verificacion, solo en el finish y el guardian de merges de ramas release/*; finish de feature/* y fix/* no la ejecuta (test con repo temporal y una rama de cada tipo)
Una clave verificacion_pesada_en lista los tipos de rama que la exigen (release por defecto; hotfix opcional) y un tipo desconocido es error de config (test)
El guardian de merges no deja integrar una release sin una verificacion pesada en verde del commit que entra, y no la pide para feature ni fix (test)
Sin la clave, finish y el guardian se comportan como hoy (test de regresion) y taskctl doctor dice que puerta corre los pesados (test)
README, CHANGELOG y la skill finish explican como separar los pesados del comando de verificacion, con el ejemplo de cargo test --ignored
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
