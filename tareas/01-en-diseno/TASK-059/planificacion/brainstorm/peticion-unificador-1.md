# Peticion al unificador — TASK-059 (ronda 1)

- Tarea: TASK-059 — Flujo E: modo automatico
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
  - criterios_aceptacion: 7 criterios (umbral: 5) (+1)

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
Parte de TASK-055 (su plan-final es el diseno de referencia). Todas las preguntas se hacen en plan; despues approve, start, implementacion, review y finish se encadenan sin preguntar, salvo hotfix y release, que paran antes de finish (decision de Carlos, 2026-10-04).
````

### Criterios de aceptacion

````
Con `modo_flujo: automatico`, tras cerrar plan ningun paso devuelve preguntar salvo los topes y hotfix/release antes de finish
approve queda registrado como automatico en `## Transiciones` (deja sin efecto la decision #1 solo en este modo; divergencia documentada)
review se lanza sola con la implementacion commiteada y la suite en verde; finish solo con el informe aprobado en un commit propio, posterior a la implementacion y que no toca codigo
Tope de 3 rondas de revision: al llegar, se pregunta aunque el modo sea automatico
Las guardas abortan tambien en automatico: limite WIP, rama base sucia, informe sin veredicto y `revision_codex: true` sin segunda opinion
Test de punta a punta en repo temporal con fixtures en lugar de agentes: el ciclo termina en `04-terminadas` y hay un commit por transicion
Smoke manual en Claude Code en un proyecto ajeno con evidencia en el Resultado
````
