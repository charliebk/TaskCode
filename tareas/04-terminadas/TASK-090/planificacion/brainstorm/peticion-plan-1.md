# Peticion de redaccion del plan — TASK-090 (ronda 1)

- Tarea: TASK-090 — El guardian de secretos tolera excepciones solo en su fichero historico
- Tipo: fix · Complejidad declarada: simple
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
- Heuristica (1 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)

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
El test sin-literales-secretos de TASK-089 tolera por valor la clave de ejemplo de Stripe en cualquier fichero, y GitHub la bloquea en commits nuevos: el plan de TASK-089 la cito entera y el push de develop fallo sin que la suite avisara. Las excepciones tienen que valer solo para los ficheros historicos ya publicados.
````

### Criterios de aceptacion

````
La lista de excepciones son parejas exactas fichero+valor; la clave de ejemplo de Stripe copiada en cualquier otro fichero versionado pone el test en rojo con ruta y linea
Una contraprueba del test demuestra que un valor permitido en un fichero historico sigue en rojo en otro fichero
El test pasa sobre el arbol actual, incluidos los ficheros de TASK-066 y TASK-089 ya publicados en origin
npm test en verde (salvo los tres rojos conocidos de Windows)
````
