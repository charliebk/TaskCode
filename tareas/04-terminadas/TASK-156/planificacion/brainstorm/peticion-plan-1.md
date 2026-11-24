# Peticion de redaccion del plan — TASK-156 (ronda 1)

- Tarea: TASK-156 — verificar-impacto elige los tests que leen los md de skills, agents y docs del plugin
- Tipo: fix · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-24
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
- Reutilizacion (Regla 4D): lo que ya existe en el repo y se va a usar (helpers, funciones, fixtures, tests), buscado ANTES de proponer nada nuevo; y lo que se crea nuevo, con el motivo de no reutilizar lo que hay. Duplicar un helper que ya existe es un hallazgo IMPORTANTE.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es el plan.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.

## Enunciado de la tarea

### Objetivo

````
scripts/verificar-impacto.mjs elegia los tests de un .md de skills/ solo por su nombre: los que leen la carpeta entera (test/skills/task-workflow.test.ts, que prohibe marcas del repo en todas las skills) quedaban fuera y en TASK-139b un rojo suyo paso la revision y solo lo vio la suite completa de finish. Un fichero cambiado bajo skills/, agents/ o docs/ del plugin debe elegir tambien los tests que leen esa carpeta.
````

### Criterios de aceptacion

````
Un .md cambiado bajo skills/ del plugin elige todos los tests de test/skills/ que leen la carpeta (comprobado con --listar en el repo real: task-workflow.test.ts entra)
Un fichero bajo agents/ elige los tests que leen agents/, y uno bajo docs/ del plugin los que leen PLUGIN_ROOT/docs, sin arrastrar los que usan docs en su repo temporal
test/scripts/verificar-impacto.test.ts tiene un test que cae en rojo si se vuelve a ignorar un .md de skill (mutacion comprobada)
La cabecera de scripts/verificar-impacto.mjs documenta la regla
````
