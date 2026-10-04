# Peticion al unificador — TASK-056 (ronda 1)

- Tarea: TASK-056 — Flujo B: nucleo determinista del siguiente paso y registro de transiciones
- Tipo: feature · Complejidad declarada: no declarada (decide la heuristica)
- Ronda: 1
- Fecha: 2026-10-04
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

(ninguna: esta tarea no lanza brainstorm, ver el bloque de complejidad)

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **no declarada (decide la heuristica)**
- Heuristica (1 puntos): **trivial**
- Senales encontradas:
  - criterios_aceptacion: 8 criterios (umbral: 5) (+1)

Los dos niveles coinciden. Se lanzan ningun rol.

## Como consolidas

No hay salidas de brainstorm que consolidar: redacta el plan directamente a partir del enunciado. Deja dicho en el plan que se redacto sin brainstorm y por que (el numero de roles sale del lookup de complejidad, no de un descuido).

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Parte de TASK-055 (su plan-final es el diseno de referencia). El CLI decide que fase toca y si hay que preguntar; el agente solo ejecuta. Sin esta pieza las fases guiadas no tienen de que leer.
````

### Criterios de aceptacion

````
Clave `modo_flujo` en `.taskcode/config.yml` (`manual`, `semiautomatico`, `automatico`): sin clave vale `manual` y un valor invalido aborta listando los tres validos
`taskctl siguiente TASK-NNN --json` devuelve fase, comando y si preguntar, sin commitear; tabla literal en `test/core/siguiente.test.ts` por estado, plan_aprobado, modo y veredicto
`taskctl siguiente` sale con codigo distinto de 0 ante tarea inexistente o config roto, y deduce la fase solo de Git y disco
Al cerrar `plan` el modo se congela en `tarea.md`; cambiar el config despues no cambia el modo de esa tarea
Cada transicion anade una fila `fecha | fase | modo | decidido_por` en `## Transiciones` de `tarea.md`, en el mismo commit que la transicion
`taskctl pausa TASK-NNN` registra una fila «pausada por la persona» con su commit, para el «no» del modo semiautomatico
`approve --decidido-por automatico` se rechaza si el modo congelado de la tarea no es `automatico`
En `siguiente`, hotfix y release en modo automatico devuelven preguntar antes de `finish`, y ningun camino automatico pasa `--push`
````
