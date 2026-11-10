# Peticion de redaccion del plan — TASK-092 (ronda 1)

- Tarea: TASK-092 — Sincronización de ficheros sueltos de la raíz de tareas/
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-10
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
Que un proyecto pueda regenerar en cada transición un fichero derivado que vive en la raíz de tareas/ (p. ej. tareas/ROADMAP.md de ToolsaWeb). Hoy rutas_sincronizacion rechaza todo lo que cuelga de tareas/, así que el ROADMAP se queda atrasado tras plan/start/review/finish y la verificación del proyecto sale en rojo (medido en ToolsaWeb TASK-295 el 2026-11-10: una completa de 20 min repetida por dos líneas). taskctl solo escribe dentro de las carpetas de estado (tareas/0N-*/), así que un fichero suelto en la raíz de tareas/ no choca con lo que escribe el CLI.
````

### Criterios de aceptacion

````
rutas_sincronizacion admite un fichero directamente en la raíz de tareas/ (tareas/ROADMAP.md) y sigue rechazando tareas/<carpeta de estado>/..., tareas/ como carpeta, .taskcode/ y .git/, con tests de config para cada caso
En un repo temporal con comando_sincronizacion que reescribe tareas/ROADMAP.md, cada uno de new, plan, approve, start, review y finish deja ROADMAP.md regenerado dentro del mismo commit de la transición (test de integración)
Las tres salvaguardas de sincronizacion.md (ruta con cambios previos, comando que falla, fichero no declarado) funcionan igual con una ruta de la raíz de tareas/, con un test por caso
skills/task-workflow/sincronizacion.md y el README describen la nueva regla y su motivo, y CHANGELOG.md la anota en la versión siguiente
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ni borrar ningún test
````
