# Peticion al unificador — TASK-099 (ronda 1)

- Tarea: TASK-099 — Correccion de MENORES tras aprobar con correcciones sin abrir otra ronda completa
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-12
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (4 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 4 etiquetas (3 mas alla de la primera) (+3)
  - criterios_aceptacion: 8 criterios (umbral: 5) (+1)

Los dos niveles coinciden. Se lanzan 2 roles.

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
P-2 de la auditoria del 2026-11-12. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): la medicion que se esperaba ya esta hecha (criterio 1), asi que se empieza ya; lo mas rapido posible y el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Lo que sigue es el enunciado original.

En modo automatico, cuando el revisor propone aprobada-con-correcciones y solo quedan MENORES, la sesion los pide como cambios-solicitados y se abre otra ronda entera para uno o dos MENORES (OpenDockTrading TASK-067 con la 0.14.0: ronda 3 por un unico MEN-4, unos 5 min y 0,37 M tokens). Se busca que los MENORES baratos se corrijan con una verificacion ligera sin ronda nueva, manteniendo que el codigo integrado es el revisado. NO se empieza hasta tener medidas al menos 10 tareas cerradas de punta a punta con la 0.14.0 en ToolsaWeb y OpenDockTrading (taskctl metricas --por-version) que confirmen que las rondas por MENORES pesan; si no pesan, se descarta. Objetivo: version 0.15.0.
````

### Criterios de aceptacion

````
plan-final.md recoge la medicion ya hecha en docs/auditoria/PASOS-PLUGIN-2026-11-12.md (71 rondas abiertas solo por MENORES en ToolsaWeb, OpenDockTrading y TaskCode, con 2 CRITICO/IMPORTANTE nuevos y 70,2 M tokens) como motivo para seguir
Con solo MENORES abiertos tras aprobada-con-correcciones, corregirlos no abre una ronda completa ni acotada nueva: queda una verificacion ligera registrada en tarea.md (test en repo temporal)
finish sigue sin integrar codigo posterior al revisado sin esa verificacion o la decision de una persona (test)
Un CRITICO o IMPORTANTE abierto sigue exigiendo cambios-solicitados y otra ronda (test)
Solo bloquean los CRITICO e IMPORTANTE: los MENORES que no se corrigen en esa verificacion ligera pasan a un backlog de la tarea (revision/menores-pendientes.md, con id, fichero y motivo) y ni abren ronda ni impiden finish (test en repo temporal)
taskctl siguiente, con solo MENORES abiertos tras aprobada-con-correcciones, no devuelve otra ronda en ningun modo, tampoco automatico, sino la verificacion ligera o finish (test)
Las skills review y task-workflow, el README y el CHANGELOG lo explican
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test (modo rapido, como dice el objetivo)
````
