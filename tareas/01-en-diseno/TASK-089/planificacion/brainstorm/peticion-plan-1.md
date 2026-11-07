# Peticion de redaccion del plan — TASK-089 (ronda 1)

- Tarea: TASK-089 — Evitar literales con forma de secreto en el repo y tags de version que faltan
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-07
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
  - etiquetas_adicionales: 3 etiquetas (2 mas alla de la primera) (+2)

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
La proteccion de GitHub bloqueo el push de 0.11.0 por una clave de Stripe falsa de un test y hubo que reescribir el historial local. Evitar que vuelva a pasar y crear los tags v0.9.0 y v0.10.0 que nunca se crearon.
````

### Criterios de aceptacion

````
Un test de la suite falla si algun fichero versionado contiene un literal que case con los patrones de clave de GitHub (Stripe, AWS, GitHub...) sin trocear
Los fixtures de doctor-deploy construyen sus claves troceadas y siguen detectandose; sus tests en verde
Existen los tags anotados v0.9.0 y v0.10.0 en los commits de esas versiones y estan en origin
npm test en verde (salvo los tres rojos conocidos de Windows)
````
