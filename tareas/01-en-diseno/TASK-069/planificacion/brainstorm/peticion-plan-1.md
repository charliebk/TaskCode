# Peticion de redaccion del plan — TASK-069 (ronda 1)

- Tarea: TASK-069 — Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-03
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
Antes de construir frenos sobre hooks hay que saber como se comportan de verdad en la plataforma de Carlos. Inspirado en gemba-app/brakes (Apache-2.0): se toman ideas, no codigo.
````

### Criterios de aceptacion

````
Documentado contra la documentacion oficial vigente: entrada JSON de Stop y PreToolUse, efecto de exit code 2, uso de stderr como respuesta al agente, campo stop_hook_active y forma de declarar hooks dentro de un plugin (hooks/hooks.json)
Un hook de plugin escrito en Node sin dependencias se ejecuta en Windows nativo (PowerShell tool y Git Bash) y en Linux; verificado en el CI de Windows con un step que asevera cada hipotesis
Comprobado que un Stop hook que devuelve exit 2 hace que el agente siga trabajando y que stop_hook_active evita el bucle infinito
Comprobado que un PreToolUse sobre Bash puede bloquear un comando concreto (git merge) y que el agente recibe el motivo
Resultado en docs/spikes/ con cada hipotesis marcada como confirmada o refutada y la evidencia
````
