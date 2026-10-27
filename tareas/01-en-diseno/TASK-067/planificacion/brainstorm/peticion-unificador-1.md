# Peticion al unificador — TASK-067 (ronda 1)

- Tarea: TASK-067 — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-27
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (4 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - palabra_alto_riesgo: seguridad (+2)
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
Completa doctor-deploy (TASK-066). Los puntos que no se pueden medir con certeza (RLS, auth en servidor, restringir accesos, mass assignment, queries parametrizadas, validacion de inputs, uploads, cookies...) los revisa un agente de seguridad que tiene que citar evidencia; y cada punto que falla se convierte en una tarea para arreglarlo, numerada en un rango reservado descendente desde TASK-9999 para no chocar con las tareas normales. Ademas, cerrar una release avisa si no hay certificado reciente.
````

### Criterios de aceptacion

````
La skill /taskcode-plugin:doctor-deploy ejecuta el CLI y lanza un agente revisor de seguridad para los puntos de juicio que aplican; cada veredicto del agente cita fichero y linea, o el punto queda NO VERIFICADO
taskctl doctor-deploy --resultado <fichero json> incorpora los veredictos del agente al informe y al certificado; un veredicto sin evidencia o de un punto desconocido se rechaza con su motivo
Con --crear-tareas se crea una tarea por cada FALLA, numeradas hacia abajo desde TASK-9999 (9999, 9998...), con el arreglo como objetivo y como criterio que doctor-deploy de OK en ese punto
La numeracion normal ignora el rango reservado: con TASK-065 y TASK-9999 existentes, taskctl new crea TASK-066; con test
Repetir --crear-tareas no duplica: un punto con tarea ya abierta reutiliza la existente y lo dice
finish de una tarea release avisa sin bloquear si no hay certificado de doctor-deploy del commit que se cierra o si tiene alguna FALLA critica
Ni la skill, ni el agente, ni el catalogo mencionan TaskCode ni sus rutas internas (lo comprueba el test de contenido expuesto); README y CHANGELOG al dia
Pendientes de TASK-066 (MEN-12 y MEN-13): gitignore-cubre-env revisa todas las carpetas de proyecto (o sale NO VERIFICADO diciendo cuantas faltan) con test de mas de 10 carpetas; y tests que maten los mutantes N8, N9, N12, N14 y N17 de informe-revision-3.md de TASK-066
````
