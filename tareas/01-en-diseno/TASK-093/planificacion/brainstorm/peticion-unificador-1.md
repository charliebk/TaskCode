# Peticion al unificador — TASK-093 (ronda 1)

- Tarea: TASK-093 — finish reutiliza la completa en verde del mismo árbol, con entradas ignoradas declaradas
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-10
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (2 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - criterios_aceptacion: 6 criterios (umbral: 5) (+1)

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
Que taskctl finish no repita la verificación completa cuando ya hay un verde del mismo árbol exacto. Hoy la corre siempre porque el memo (huella de git status) no ve los ficheros ignorados, y un proyecto puede depender de ellos (datos de prueba fuera de Git, node_modules). Medido en ToolsaWeb TASK-295 el 2026-11-10: completa de 27 min en verde a las 12:01 y otra idéntica lanzada por finish a las 12:03 sobre el mismo commit. Propuesta: una clave opcional (p. ej. entradas_ignoradas_verificacion: [exampleData/, web/node_modules/.package-lock.json]) cuyo listado (ruta, tamaño, mtime) entra en la huella del memo; con ella declarada, finish y el guardián reutilizan un verde de huella idéntica y lo dicen en la salida; sin ella, todo sigue como hoy.
````

### Criterios de aceptacion

````
Con la clave declarada y un verde guardado de huella idéntica, finish no ejecuta comando_verificacion y lo dice en su salida; un test de integración en un repo temporal lo comprueba
Cambiar un fichero de una ruta ignorada declarada, un fichero versionado, el comando o el timeout invalida el memo y finish vuelve a verificar (un test por caso)
Sin la clave, finish ejecuta siempre la completa como en 0.13 (test de regresión)
Una ruta declarada inexistente, absoluta o fuera del repo aborta la config con un error que nombra la clave y la línea
README, skills/task-workflow y CHANGELOG describen la clave, su motivo y el riesgo de no declarar una entrada ignorada
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningún test
````
