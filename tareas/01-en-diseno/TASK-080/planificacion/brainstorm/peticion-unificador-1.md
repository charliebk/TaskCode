# Peticion al unificador — TASK-080 (ronda 1)

- Tarea: TASK-080 — Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-06
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (7 puntos): **alta**
- Senales encontradas:
  - etiquetas_adicionales: 5 etiquetas (4 mas alla de la primera) (+4)
  - palabra_alto_riesgo: rendimiento (+2)
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
Tres refuerzos pedidos por la persona. Primero, la accesibilidad WCAG 2.2 dentro de angular-vue-reviewer y no como revisor aparte: un revisor propio sobre .vue solaparia patrones y clasificarPorDominio mandaria esos ficheros al generico. Segundo, criterios de arquitectura mas exigentes en el rol brainstorm-arquitectura de la fase plan. Tercero, un rol nuevo, brainstorm-rendimiento, para las tareas con WASM, Web Workers, 3D o carga pesada.
````

### Criterios de aceptacion

````
skills/angular-vue-reviewer/SKILL.md revisa contraste, orden y visibilidad del foco, trampas de teclado, etiquetas y aria en controles, nombre accesible de iconos y botones y dialogos modales, citando WCAG 2.2; test/skills/revisores.test.ts sigue en verde y sus patrones_archivo no cambian
agents/brainstorm-arquitectura.md incluye limites entre modulos, direccion de las dependencias, acoplamiento y coherencia con los ADR del proyecto, y test/agents/brainstorm-roles.test.ts lo comprueba
Existe agents/brainstorm-rendimiento.md con el mismo formato que los demas roles brainstorm-*: coste algoritmico, asignaciones en bucles calientes, copias JS-WASM, Web Workers, mallas y teselas grandes, y medir con datos reales antes de optimizar
taskctl plan lanza brainstorm-rendimiento cuando la tarea tiene etiquetas de rendimiento, wasm, workers o 3d, y no lo lanza sin ellas; lo cubren tests en test/commands/plan-brainstorm.test.ts
brainstorm-unificador integra la salida de rendimiento; README del plugin, documentacion de roles y CHANGELOG lo recogen, y catalogo-skills.yml queda con total_skills cuadrado si cambia
npm test en verde (salvo los tres rojos conocidos de Windows) en la rama de la tarea
````
