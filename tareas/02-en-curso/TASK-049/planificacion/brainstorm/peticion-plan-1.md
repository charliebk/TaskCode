# Peticion de redaccion del plan — TASK-049 (ronda 1)

- Tarea: TASK-049 — F6-T4 Metadatos del plugin y modelo de los agentes
- Tipo: feature · Complejidad declarada: simple
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
Para quien instala el plugin desde fuera (como OpenGisViewer) faltan
metadatos y no hay instrucciones de actualizacion (auditoria E4, E5). Se
completa `plugin.json` (`displayName`, `repository`, `license`, `keywords`)
hasta que `claude plugin validate` salga limpio, el README explica como
instalar y actualizar, y se decide, con el ID de modelo comprobado en la
documentacion actual, si los agentes de brainstorm llevan `model:` propio.
````

### Criterios de aceptacion

````
`plugin.json` con `displayName`, `repository`, `license` y `keywords`; `claude plugin validate` limpio
README con instalacion y actualizacion: `claude plugin marketplace update`, `claude plugin update`, reiniciar
Decision documentada sobre `model:` en los agentes de brainstorm, con el ID de modelo comprobado en la documentacion actual
````
