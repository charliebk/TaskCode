# Peticion de redaccion del plan — TASK-109 (ronda 1)

- Tarea: TASK-109 — Verificacion proporcional B6: documentacion y limpieza del nivel 2
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-12
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
- Heuristica (3 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - dependencias: 2 dependencias (TASK-107, TASK-108) (+2)

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
Sexta y ultima parte de TASK-096; hasta cerrarla no se publica version. skills/task-workflow/verificacion-selectiva.md, README y CHANGELOG explican el principio de coste proporcional al cambio y como lo declara un proyecto (rutas_verificacion_parcial leida de la base, lista de permitidas, timeout de la selectiva, cobertura omitida, release y hotfix a la completa, el guardian sigue exigiendo la completa para codigo y por que un merge a mano tras un fallo queda bloqueado). La decision sobre TASK-091 queda escrita. Aviso de doctor si procede, el Ejemplo del error de forma de rutas_verificacion_parcial en validarPatronesExclusion (hoy sale el de excluir_de_revision; nota de la revision 2 de TASK-096), codigo sin uso borrado y motivo de cada test que cambio de expectativa en las partes B1..B5. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).
````

### Criterios de aceptacion

````
verificacion-selectiva.md, README y CHANGELOG explican el principio y la clave, sin marcas de este repo; la prueba de la guia asevera el contrato literal y se pone roja si se borra la seccion
La decision sobre TASK-091 y lo que se retira quedan escritos; el codigo que quede sin uso se borra
La suite completa pasa en verde (npm test) sin debilitar ningun test
````
