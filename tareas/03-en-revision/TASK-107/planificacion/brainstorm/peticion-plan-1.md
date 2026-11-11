# Peticion de redaccion del plan — TASK-107 (ronda 1)

- Tarea: TASK-107 — Verificacion proporcional B4: Stop, review y finish deciden igual el mismo diff
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-11
- Rol: `brainstorm-arquitectura` — lanzalo con el agente de ese mismo nombre
- Quien orquesta vuelca tu respuesta en: `../plan-final.md`

**Esta tarea se planifica con un solo rol y no hay unificador**: tu respuesta ES el plan final. Redactala con las secciones de abajo; quien orquesta la vuelca tal cual en `plan-final.md` (tu no escribes ficheros), sin salida intermedia que consolidar.

## Tu pregunta

> Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?

## Que miras

- Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.
- Que se crea nuevo, que se extiende y en que orden se construye.
- Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.
- El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.

## Que NO miras

Que lo mires solo tu no te autoriza a cubrirlo todo: lo que queda fuera de tu pregunta no se mira, pero se DICE. Anota en el plan lo que no cubres, para que quien lo apruebe sepa que ese lado no se ha revisado:

- Como se prueba (es del rol de testing).
- Por donde se rompe (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **simple**
- Heuristica (2 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - dependencias: 1 dependencias (TASK-106) (+1)

Los dos niveles coinciden. Se lanzan 1 rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Lo que el rol no cubrio, contrastado contra los criterios de aceptacion.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es el plan.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.

## Enunciado de la tarea

### Objetivo

````
Cuarta parte de TASK-096. Solo tests, sin codigo de produccion salvo que destapen una divergencia (TASK-102 y TASK-104 ya aplican documentacion -> selectiva en Stop y review). Una prueba tabular sobre documentacion, codigo parcial y codigo transversal fija que el freno Stop y taskctl review aplican la misma decision al mismo diff, y que finish coincide con ellos en documentacion y en parcial. Desacuerdo resuelto en el plan: Stop y review son puertas de iteracion y no corren la completa ante lo transversal. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).
````

### Criterios de aceptacion

````
Una prueba tabular (documentacion, parcial, transversal) comprueba que decidirStop y runReviewCommand corren el mismo comando para el mismo diff, y que finish coincide en documentacion y parcial; un turno o una ronda que solo tocan documentacion no corren la suite de tests
La prueba se pone roja si se desvia la decision de uno de los tres en un caso (mutacion documentada en Resultado)
La suite completa pasa en verde (npm test) sin debilitar ningun test
````
