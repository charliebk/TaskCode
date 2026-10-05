# Peticion de redaccion del plan — TASK-054 (ronda 1)

- Tarea: TASK-054 — Rutas no ASCII en el diff de revision fragmentado por dominio
- Tipo: fix · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-10-05
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
- Heuristica (0 puntos): **trivial**
- Senales encontradas:
  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)

Los dos niveles NO coinciden. Se lanzan 1 rol, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

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
`diffNameOnly` y `diffParaRevision` llaman a git sin `-z` ni
`core.quotePath=false`, asi que una ruta con caracteres no ASCII sale
entrecomillada y escapada en octal (`"src/acciÃ³n.ts"`). Al
fragmentar la revision por dominio, la clasificacion usa esa ruta escapada y
el diff del fichero no llega a la peticion de su dominio (MENOR-6 de
TASK-034). El objetivo es que la ruta sea la misma en la clasificacion y en
el diff, y que el fichero aparezca en la peticion que le corresponde.
````

### Criterios de aceptacion

````
`diffNameOnly` y `diffParaRevision` usan `-z` (o `core.quotePath=false`) y una ruta con caracteres no ASCII aparece igual en la clasificacion y en el diff
Test con un fichero `src/acción.ts` en una revision fragmentada: su diff aparece en la peticion de su dominio
````
