# Peticion al unificador — TASK-137 (ronda 1)

- Tarea: TASK-137 — Regla 4D: sin duplicacion, desviacion, diluvio ni disfraz de codigo
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-22
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (0 puntos): **trivial**
- Senales encontradas:
  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)

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
El plugin asegura que implementadores y revisores no producen codigo 4D (pedido de Carlos, 2026-11-22): 1) Duplicacion: dos funciones o clases que hacen lo mismo con pequenas diferencias; se reutiliza y generaliza (POO, herencia o composicion como eje). 2) Desviacion: se sale del objetivo de la tarea; si hay que cambiar la expectativa se bifurca una tarea nueva o se propone el cambio sin salir del objetivo. 3) Diluvio: avalanchas de lineas y clases donde bastan pocas lineas eficientes. 4) Disfraz: premisas de caso resuelto que no hacen nada o no se comprueban (tests que no prueban, stubs que aparentan). Se sospecha que ya ocurre en TaskCode 0.16.
````

### Criterios de aceptacion

````
skills/task-workflow/revision.md y las skills revisoras (code-quality-reviewer y las de dominio) describen las 4D con un ejemplo de cada una y clasifican como IMPORTANTE la duplicacion y el disfraz reales
La plantilla del informe de revision lleva una seccion '## Regla 4D' con una linea por D (cumple o ID del hallazgo) y taskctl finish avisa si falta o esta vacia, con un test que lo comprueba
La skill de implementacion (start) exige antes de pedir revision: buscar el helper existente antes de crear uno, citar el criterio que motiva cada cambio y comprobar por mutacion cada test nuevo; queda anotado en '## Autorrevision'
Auditoria de las 10 ultimas tareas terminadas de este repo: docs/auditoria-4d.md lista cada caso 4D encontrado con fichero:linea y la tarea de seguimiento que lo corrige
````
