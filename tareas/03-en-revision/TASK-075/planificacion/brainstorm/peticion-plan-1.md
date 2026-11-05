# Peticion de redaccion del plan — TASK-075 (ronda 1)

- Tarea: TASK-075 — Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+
- Tipo: fix · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-05
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
Desde Claude Code 2.1.316, claude plugin validate imprime comprobaciones del directorio de plugins (README missing, icon) marcadas con una cruz aunque la validacion termina en Validation passed. Los tests 14 (test/skills/task-workflow.test.ts) y 17 (test/agents/brainstorm-roles.test.ts) copian el plugin a un temporal sin README y exigen que la salida no contenga la cruz, asi que la copia intacta falla. Detectado al revisar TASK-069.
````

### Criterios de aceptacion

````
Con Claude Code 2.1.316 o posterior, los tests 14 de test/skills/task-workflow.test.ts y 17 de test/agents/brainstorm-roles.test.ts pasan en Windows y en el CI de Linux
La contraprueba sigue detectando un agente o un SKILL.md roto en la copia: test con la mutacion que ya usa cada test
Los avisos del directorio de plugins no se confunden con errores de validacion: la condicion se apoya en el codigo de salida o en el bloque de resultado, no en buscar la cruz en toda la salida; test
Suite completa con solo los rojos conocidos de Windows; HALLAZGOS.md recoge el cambio de salida del validador
````
