# Peticion al unificador — TASK-124 (ronda 1)

- Tarea: TASK-124 — Contexto con tamano maximo: lo que leen los agentes no crece con el proyecto
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
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

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
Sale de TASK-122 (docs/auditoria/ESCALA-2026-11-12.md): lo que leen los agentes en cada tarea crece con el proyecto. Desde la v0.1.1 el README del plugin paso de 22 a 102 KB, las skills de 92 a 189 KB y docs/contexto de 154 a 195 KB; CHECKLIST_TERMINACION.md pesa 83 KB y ESTADO.md llevaba 38 dias sin actualizarse cuando CLAUDE.md manda leerlo primero. Cada documento que se carga en cada tarea tiene que tener un tamano maximo, y lo cerrado se archiva fuera de lo que se lee. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12), en modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
CLAUDE.md, las skills de flujo y las revisoras tienen un tamano maximo en bytes con un test que falla si se supera
CHECKLIST_TERMINACION.md y ESTADO.md archivan lo cerrado en docs/contexto/archivo/ y lo vivo queda por debajo de 20 KB y 10 KB (comprobado con wc -c)
taskctl doctor avisa si ESTADO.md lleva mas de 14 dias sin actualizarse o va por detras de las tareas cerradas (test)
El README del plugin pasa la referencia detallada a ficheros aparte y queda por debajo de 40 KB, sin perder contenido (test que comprueba el tamano y los enlaces)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
