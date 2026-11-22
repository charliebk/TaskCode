# Peticion al unificador — TASK-141 (ronda 1)

- Tarea: TASK-141 — Auditoria 4D inicial: reconocimiento completo del codigo existente
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-22
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (0 puntos): **trivial**
- Senales encontradas:
  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)

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
Reconocer el repo entero (plugin: src, scripts, skills, agents, hooks y test; scripts de la raiz) y auditar todo el codigo ya escrito contra la Regla 4D: sin duplicacion, sin desviacion, sin diluvio y sin disfraz (definicion en skills/task-workflow/revision.md, seccion Regla 4D). Solo lee y documenta: las correcciones van en tareas de seguimiento. La auditoria de TASK-137 (docs/auditoria-4d.md) solo cubrio los diffs de TASK-127..136; esta cubre todo el codigo y no repite sus casos A1..A13, los referencia.
````

### Criterios de aceptacion

````
docs/auditoria-4d-completa.md tiene un mapa del proyecto: areas (src/core, src/commands, src/fs, src/hooks, src/cli, scripts/gitflow, scripts de la raiz, skills, agents, hooks, test), su responsabilidad y su tamano en lineas; cada area figura como auditada o como excluida con su motivo (dist/ generado, node_modules, tareas/ historicas)
Cada caso 4D esta en una tabla ID | Area | D | fichero:linea | evidencia | severidad | confianza | seguimiento; duplicacion y disfraz reales son IMPORTANTE como minimo, desviacion y diluvio MENOR salvo que cambien comportamiento o escondan un fallo; los dudosos van con confianza media; los casos ya cubiertos por TASK-138..140 se referencian, no se duplican
Cada caso de confianza alta lo vuelve a comprobar en el codigo el coordinador, distinto del agente que lo encontro; los casos de disfraz en tests se comprueban por mutacion sobre una muestra de al menos 5 tests y el resultado queda anotado
Cada caso tiene tarea de seguimiento creada con taskctl new, agrupando por regla y area, nunca una por caso; el informe cierra con un resumen por area y una conclusion: que D predomina y en que zonas
````
