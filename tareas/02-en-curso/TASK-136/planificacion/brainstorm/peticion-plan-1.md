# Peticion de redaccion del plan — TASK-136 (ronda 1)

- Tarea: TASK-136 — Cerrojo en verificar-impacto: dos ejecuciones solapadas borran dist/src
- Tipo: fix · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-18
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
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

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
scripts/verificar-impacto.mjs guarda dist/src (versionado) en una carpeta de copia fija por plugin (tmpdir/verificar-impacto-<hash>) y la devuelve al acabar. Si una segunda ejecucion arranca con la primera viva (review en segundo plano y el freno Stop a la vez), restaurarHuerfana toma la copia de la primera por huerfana porque no mira si su pid sigue vivo: la restaura y la borra. La primera, al acabar, hace rmSync(dist/src) sin copia que devolver: dist/src desaparece entero y bin/taskctl deja de arrancar (Cannot find module dist/src/cli.js). Paso en TASK-134 y dos veces en TASK-135; TASK-134 propuso el cerrojo y no se llego a crear la tarea. Se anade un cerrojo atomico por plugin (fichero creado con wx, con el pid): una segunda ejecucion espera a que la primera termine, una con pid muerto se considera cortada y se recupera como hasta ahora, y devolver nunca borra dist/src si no tiene copia.
````

### Criterios de aceptacion

````
Dos ejecuciones solapadas sobre el mismo plugin terminan las dos con el codigo de sus tests y dejan dist/src exactamente como estaba (git status limpio); la segunda avisa de que espera a la primera
Un cerrojo cuyo pid ya no existe (ejecucion cortada) no bloquea: la siguiente lo toma, avisa y restaura dist/src desde la copia huerfana como hasta ahora
devolver no borra dist/src si la copia que debia devolver no existe: avisa y deja dist/src como esta
La espera tiene un tope (variable de entorno, por defecto 30 min); al agotarlo sale con 1 y un mensaje que dice que pid tiene el cerrojo y donde esta
Los tests existentes de test/scripts/verificar-impacto.test.ts siguen en verde, incluido el de la ejecucion cortada a mitad
````
