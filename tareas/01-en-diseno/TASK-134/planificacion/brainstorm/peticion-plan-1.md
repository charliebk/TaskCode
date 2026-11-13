# Peticion de redaccion del plan — TASK-134 (ronda 1)

- Tarea: TASK-134 — En Windows taskctl lanza el bash de Git, no el primero del PATH
- Tipo: fix · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-13
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
taskctl lanza los scripts de Git-Flow con spawnSync('bash') (lanzarBash en src/fs/gitflow-runner.ts), el primero del PATH. Desde PowerShell suele ser C:\Windows\System32\bash.exe (WSL), que no abre el script, y finish falla; desde Git Bash funciona. Por eso en el mismo PC unas sesiones fallan y otras no, segun la terminal que use Claude. En Windows hay que localizar el bash de Git a partir de git.exe (usr/bin/bash.exe o bin/bash.exe de la instalacion) y usarlo siempre, con el bash del PATH solo como respaldo si no se encuentra; la sonda de doctor usa el mismo lanzamiento.
````

### Criterios de aceptacion

````
En Windows, con System32 antes que Git en el PATH (bash de WSL primero), taskctl finish y los demas wrappers de Git-Flow funcionan lanzados desde PowerShell
lanzarBash sigue siendo el unico sitio que lanza bash y la sonda de taskctl doctor usa la misma resolucion
Si no se encuentra el bash de Git se usa bash del PATH como hasta ahora y doctor lo dice; en Linux y macOS no cambia nada
Tests de la resolucion como logica pura (sin procesos) y uno de integracion con un PATH que pone primero un bash falso
````
