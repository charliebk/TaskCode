# Peticion al unificador — TASK-058 (ronda 1)

- Tarea: TASK-058 — Flujo D: modo semiautomatico
- Tipo: feature · Complejidad declarada: no declarada (decide la heuristica)
- Ronda: 1
- Fecha: 2026-10-04
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

(ninguna: esta tarea no lanza brainstorm, ver el bloque de complejidad)

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **no declarada (decide la heuristica)**
- Heuristica (1 puntos): **trivial**
- Senales encontradas:
  - criterios_aceptacion: 6 criterios (umbral: 5) (+1)

Los dos niveles coinciden. Se lanzan ningun rol.

## Como consolidas

No hay salidas de brainstorm que consolidar: redacta el plan directamente a partir del enunciado. Deja dicho en el plan que se redacto sin brainstorm y por que (el numero de roles sale del lookup de complejidad, no de un descuido).

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Parte de TASK-055 (su plan-final es el diseno de referencia). Al cerrar cada fase el sistema pregunta si seguir; un no deja la tarea en su estado, queda registrado y dice como reanudar.
````

### Criterios de aceptacion

````
Con `modo_flujo: semiautomatico`, al cerrar plan, approve, start y review la skill pregunta con AskUserQuestion si pasar a la siguiente fase
Un si invoca la skill de la siguiente fase con la herramienta Skill
Un no ejecuta `taskctl pausa`, deja la tarea en su estado y termina nombrando la skill que la reanuda
Bloqueo por arbol de trabajo en `.git/` mientras dura una cadena: una segunda sesion sobre el mismo arbol aborta con un mensaje que dice que hacer
Test de punta a punta en repo temporal: un no en approve deja la tarea en `01-en-diseno` con `plan_aprobado: false` y su fila de pausa; la contraprueba con un si llega a `02-en-curso`
Smoke manual en Claude Code en un proyecto ajeno con evidencia en el Resultado
````
