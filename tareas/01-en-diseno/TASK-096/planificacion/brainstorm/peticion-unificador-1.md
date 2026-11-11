# Peticion al unificador — TASK-096 (ronda 1)

- Tarea: TASK-096 — Verificacion proporcional B: con codigo parcial se verifica solo lo afectado
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-11
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (5 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - palabra_alto_riesgo: seguridad (+2)
  - dependencias: 1 dependencias (TASK-100) (+1)
  - criterios_aceptacion: 7 criterios (umbral: 5) (+1)

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
Troceada el 2026-11-10 (decision de Carlos): la parte A, una tarea de solo documentacion no corre la suite de tests, es TASK-100. Esta tarea queda con la parte B (nivel 2: con codigo parcial, verificar solo lo afectado) y no se empieza hasta que TASK-100 lleve un tiempo en uso y se mida cuanto queda por ganar. El enunciado original sigue debajo como contexto.

Objetivo principal: aumentar la agilidad sin perder calidad. Que el coste de verificar crezca con lo que la tarea cambia, no con el tamano del proyecto: los tests son necesarios, pero no en todos los momentos ni en todas las tareas. A medida que un proyecto crece, crecen sus tests, y hoy se pagan enteros aunque la tarea no los toque. Medido el 2026-11-10 (docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md): finish exige la completa en toda tarea (en ToolsaWeb unos 28 min, 18 de cargo test, tambien en tareas de solo documentacion); el freno Stop verifica al final de cada turno; 5 de las 7 tareas de ToolsaWeb en 0.11 eran estudios sin codigo, y las 10 de OpenDockTrading son documentos con un script de comprobacion. Tres niveles segun el diff de la tarea frente a la base, en los tres momentos (fin de turno, ronda de revision y finish): (1) solo documentacion: no se corre la suite de tests, solo las comprobaciones de documentacion si el proyecto las tiene; (2) una parte del codigo: los tests de lo afectado; (3) codigo transversal o sin clasificar: la suite completa. Se conserva la garantia de la 0.8/0.9 de no integrar nada roto: lo que no se pueda clasificar con seguridad va a la completa. El proyecto ya sabe clasificar su diff (la selectiva de ToolsaWeb lo hace); TaskCode no deberia duplicar ese conocimiento. La forma concreta (que el comando del proyecto decida que correr a partir del diff, o que TaskCode distinga rutas) se decide en el plan, revisando de forma explicita la decision de TASK-091 de exigir la completa antes de integrar. No se retira ningun freno: se ajusta su coste.
````

### Criterios de aceptacion

````
En un repo temporal cuya tarea cambia una parte del codigo que el proyecto clasifica, finish ejecuta solo la verificacion de lo afectado y lo dice en su salida; con codigo transversal o sin clasificar ejecuta la completa (un test por caso)
El freno Stop y taskctl review aplican el mismo nivel al mismo diff: un turno o una ronda que solo tocan documentacion no corren la suite de tests (test por cada uno)
El guardian de merges aplica la misma decision que finish para el mismo diff: no bloquea el merge de una tarea sin codigo con verde de su verificacion y si bloquea el de una con codigo sin verde de la completa; un test por caso
Un proyecto sin la configuracion nueva se comporta exactamente como en 0.13 (test de regresion de finish y del guardian)
El plan deja escrita la decision sobre TASK-091 y lo que se retira; el codigo que quede sin uso se borra y los tests que cambian de expectativa llevan su motivo en Resultado
skills/task-workflow (verificacion-selectiva.md), README y CHANGELOG explican el principio de coste proporcional al cambio y como lo declara un proyecto
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
````
