# Peticion al unificador — TASK-035 (ronda 1)

- Tarea: TASK-035 — F1-T2 Politica de rondas y una sola suite por ronda en las skills
- Tipo: feature · Complejidad declarada: trivial
- Ronda: 1
- Fecha: 2026-10-04
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **trivial**
- Heuristica (2 puntos): **simple**
- Senales encontradas:
  - palabra_alto_riesgo: concurrencia (+2)

Los dos niveles NO coinciden. Se lanzan 1 rol, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

**Esta tarea se planifico con un solo rol**, asi que aqui no hay desacuerdos que resolver: no te los inventes ni trates la ausencia de discrepancia como una senal de nada.

1. Lee la salida de arriba. Si falta o esta sin rellenar, dilo en el plan en vez de suplirla en silencio.
2. **Contrasta esa propuesta contra el enunciado de la tarea**, que tienes al final. Lo util que puedes aportar aqui no es mediar entre puntos de vista, es senalar QUE QUEDO SIN CUBRIR: criterios de aceptacion que el rol no toca, riesgos que no mira porque no era su papel, decisiones que da por hechas.
3. Cada afirmacion del plan que venga del rol se atribuye a el; lo que anadas tu, tambien.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Lo que el rol no cubrio, contrastado contra los criterios de aceptacion.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Llevar a las skills la politica de rondas A3 y la regla A4 de la auditoria
del 2026-10-03, aprobadas por Carlos: sin CRITICO ni IMPORTANTE abiertos una
ronda cierra la tarea, los MENOR corregidos no abren ronda 2, y el revisor
corre la suite completa una sola vez por ronda (los mutantes, con el fichero
de test concreto). Hoy la skill de flujo y dos revisoras dicen «dos rondas es
lo normal», y las revisoras piden la suite entera dos veces.

Solo documentacion: no toca `src/`. Complejidad `trivial` (no `simple`, como
se importo): el contenido ya esta decidido y no hay diseno que explorar.
````

### Criterios de aceptacion

````
`task-workflow/SKILL.md` recoge la politica A3: sin CRITICO ni IMPORTANTE abiertos una ronda cierra; si solo se corrigen MENOR no hay ronda 2; la ronda 2 solo revisa el delta
Las 4 skills revisoras piden la suite completa una vez por ronda y los mutantes con `node --test <fichero>`
Con varios revisores en paralelo, instruccion de concurrencia reducida
Tests de `test/skills/` en verde, incluido el de no mencionar el proyecto
````
