# Peticion al unificador — TASK-091 (ronda 1)

- Tarea: TASK-091 — Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-09
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (5 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 3 etiquetas (2 mas alla de la primera) (+2)
  - palabra_alto_riesgo: migracion (+2)
  - criterios_aceptacion: 6 criterios (umbral: 5) (+1)

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
Urgente (pedido por Carlos el 2026-11-09, desde ToolsaWeb). La verificacion completa de un proyecto crece con cada tarea (en ToolsaWeb, `scripts\verificar.bat` ya tarda unos 40 minutos) y hoy se repite en cada ronda de revision aunque la tarea no haya tocado la capa de datos ni el frontend. TaskCode tiene que separar dos verificaciones: una **selectiva por impacto**, rapida, para la implementacion y las rondas de revision, y la **completa**, obligatoria antes de integrar, para que ninguna rama pase a otra sin comprobarlo todo. Todas las aplicaciones que usan el plugin la adoptan y sustituyen su verificador por este encaje.

Encaje propuesto (sobre TASK-070 y TASK-088):
- `comando_verificacion` sigue siendo la completa y la puerta de `finish` y del guardian de merges.
- Nueva clave opcional `comando_verificacion_selectiva`, que recibe la rama base (`develop`) para que el proyecto decida que corre segun lo cambiado. La usan el hook `Stop` y las rondas de `review`. El mapa de capas es de cada proyecto; TaskCode solo orquesta.
- Sin la clave nueva, todo se comporta como hoy.
````

### Criterios de aceptacion

````
Nueva clave opcional `comando_verificacion_selectiva` en `resolverConfig` (con su timeout), con fallo cerrado ante valor invalido y defecto null; sin ella, el comportamiento de todos los comandos es identico al actual y los tests existentes pasan sin tocarlos
Con la clave, el hook `Stop` y `taskctl review` ejecutan la selectiva (pasandole la rama base) y la peticion de revision dice que verificacion se corrio, con su salida y si fue selectiva o completa
`taskctl finish` exige la completa (`comando_verificacion`) en verde sobre el commit que va a integrar, aunque las rondas usaran la selectiva; si falla o no se ha corrido, no integra y dice como correrla
`taskctl doctor` avisa cuando un proyecto tiene `comando_verificacion` pero no `comando_verificacion_selectiva`, con el arreglo en la misma linea
Tests contra repos Git temporales reales (sin mocks): selectiva en review, completa obligatoria en finish, sin clave igual que antes
Guia de migracion para los proyectos que usan el plugin (como escribir el clasificador por impacto, que cambios fuerzan la completa y como declarar las dos claves), y tabla de claves de config, README, CHANGELOG y ROADMAP al dia
````
