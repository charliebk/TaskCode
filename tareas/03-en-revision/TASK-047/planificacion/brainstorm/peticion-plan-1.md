# Peticion de redaccion del plan — TASK-047 (ronda 1)

- Tarea: TASK-047 — F5-T3 Flags desconocidos y mensajes de review
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
Tres MENOR de la auditoria (D4, D6, D10) que confunden a quien usa el CLI.
Un flag mal escrito (`--complejida trivial`) se ignora en silencio y la tarea
sale con otra complejidad: debe abortar diciendo cuales son los flags validos
y cual se parece al escrito, como ya hace el parser de config. La salida de
`review` dice «lanza ese agente» nombrando una skill revisora: debe separar
el agente que se lanza (`agente_revisor`) de la skill que carga, y usar
`modelo_sugerido`, que hoy no lee nadie. Y `codex-review.ts` duplica helpers
de `finish.ts`: debe reutilizarlos.
````

### Criterios de aceptacion

````
Un flag desconocido aborta con la lista de flags validos y una sugerencia
La salida de `review` nombra agente y skill por separado y usa `modelo_sugerido`
`codex-review.ts` reutiliza los helpers de `finish.ts` en lugar de duplicarlos
````
