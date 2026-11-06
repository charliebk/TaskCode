# Peticion de redaccion del plan — TASK-076 (ronda 1)

- Tarea: TASK-076 — Doctor avisa de hooks PreToolUse sobre Agent que bloquean los subagentes en modo automatico
- Tipo: fix · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-06
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
  - etiquetas_adicionales: 3 etiquetas (2 mas alla de la primera) (+2)
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
Desde Claude Code 2.1.317/2.1.318, el modo automatico puede denegar el lanzamiento de un subagente (Auto-Mode Bypass) cuando otro plugin o la configuracion del usuario tiene un hook PreToolUse sobre Agent (o Task) que reescribe el encargo; p. ej. context-mode 1.0.169 anade un bloque al prompt de cada subagente. El flujo de tareas depende de subagentes (roles del brainstorm, unificador, revisores), asi que en los proyectos que usan el plugin las fases plan y review fallan sin explicacion. Hay que avisar a todos los proyectos con una version nueva del plugin: deteccion en taskctl doctor, documentacion del problema y de como resolverlo, y aviso en la skill de flujo cuando un lanzamiento se deniega. Detectado el 2026-11-03 durante TASK-068.
````

### Criterios de aceptacion

````
taskctl doctor detecta un hook PreToolUse cuyo matcher incluye Agent o Task en los hooks.json de los plugins instalados (plugins/cache de CLAUDE_CONFIG_DIR o ~/.claude) y en settings.json de usuario y de proyecto, nombra el origen y la ruta, y lo muestra como AVISO (no ERROR) con como resolverlo; con test sobre un directorio de configuracion temporal, y test de que sin ese hook no avisa
doctor --json incluye el aviso con un id estable; test
El README del plugin tiene una seccion de problemas conocidos con el sintoma (subagente denegado con Auto-Mode Bypass), la causa y las salidas: quitar Agent del matcher con un hook propio de SessionStart, desactivar el plugin causante o aprobar a mano los lanzamientos
La skill task-workflow (avance) indica que hacer si un lanzamiento de subagente se deniega: ejecutar taskctl doctor y no rodear la denegacion; los tests de neutralidad de skills siguen en verde (ningun fichero instalable menciona TaskCode)
Version del plugin incrementada en plugin.json y marketplace, CHANGELOG con la entrada que explica el aviso; suite completa con solo los rojos conocidos de Windows
````
