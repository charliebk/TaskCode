# Peticion de redaccion del plan — TASK-063 (ronda 1)

- Tarea: TASK-063 — Metricas v2: medir el comportamiento del plugin para decidir mejoras con datos
- Tipo: feature · Complejidad declarada: no declarada (decide la heuristica)
- Ronda: 1
- Fecha: 2026-10-25
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

- Declarada en la tarea: **no declarada (decide la heuristica)**
- Heuristica (1 puntos): **simple**
- Senales encontradas:
  - criterios_aceptacion: 8 criterios (umbral: 5) (+1)

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
Antes de mejorar el plugin en tiempo, tokens, verificacion o memoria de contexto hay que saber donde se va el esfuerzo (Carlos, 2026-10-25). Una medicion a mano sobre ToolsaWeb (65 tareas terminadas) mostro que el flujo funciona y mejora con el tiempo, pero con huecos que impiden decidir: solo 16 de 65 tareas tienen tokens de implementacion registrados (4 de 48 en TaskCode), el total mezcla lectura de cache con tokens nuevos y exagera el coste, no se sabe si un hallazgo de revision viene de la implementacion o de un plan ambiguo, y no se mide cuanto lee cada agente para orientarse en el proyecto (lo que justificaria o no una memoria o grafo de conceptos). Esta tarea tapa esos huecos y da una vista de evolucion para que las siguientes mejoras se elijan por cifras.
````

### Criterios de aceptacion

````
registrar-coste guarda los tokens de cada fase desglosados en entrada, escritura de cache, lectura de cache y salida; las tareas antiguas con solo el total siguen siendo validas y metricas muestra por separado los tokens nuevos y la lectura de cache.
taskctl metricas lista las tareas terminadas a las que les falta coste en alguna fase (diseno, implementacion, revision), y finish avisa sin bloquear si la tarea se cierra sin coste de implementacion.
metricas cuenta por tarea las rondas de revision y los hallazgos CRITICO, IMPORTANTE y MENOR leyendo los informes, incluidos los nombrados por revisor (informe-revision-N-<revisor>.md).
El formato de hallazgo del informe de revision admite un campo origen (implementacion, plan o especificacion) que la skill de revision pide rellenar; metricas da el reparto y los informes sin ese campo cuentan como sin clasificar.
Desde las transcripciones de los subagentes, registrar-coste guarda cuantas llamadas de lectura y busqueda (Read, Grep, Glob y equivalentes) hizo cada fase, y metricas da su mediana por fase.
taskctl metricas --evolucion [--tramo N] agrupa las tareas terminadas en tramos de N (20 por defecto) con mediana de minutos plan a finish, rondas medias, hallazgos IMPORTANTE por tarea, tokens de revision y KB de peticiones de revision; con --json da lo mismo en JSON.
Tests contra repos Git temporales reales con tareas en formato antiguo y nuevo y transcripciones jsonl de ejemplo; README y CHANGELOG documentan las metricas nuevas.
Linea base: la salida de taskctl metricas --evolucion sobre ToolsaWeb (solo lectura, sin escribir en ese repo) queda copiada en el Resultado de la tarea.
````
