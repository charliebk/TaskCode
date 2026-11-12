# Peticion de brainstorm — TASK-122, rol arquitectura (ronda 1)

- Tarea: TASK-122 — Coste por tarea independiente del tamano del proyecto
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-12
- Rol: `brainstorm-arquitectura` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-arquitectura-1.md`

## Tu pregunta

> Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?

## Que miras

- Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.
- Que se crea nuevo, que se extiende y en que orden se construye.
- Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.
- El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Como se prueba (es del rol de testing).
- Por donde se rompe (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Problema que plantea Carlos (2026-11-12): si cada tarea paga algo que crece con el tamano del proyecto, el coste de las tareas crece sin limite; con n tareas, la tarea n cuesta del orden de n y el proyecto del orden de n al cuadrado, hasta que una tarea pequena cuesta tanto como el proyecto. En TaskCode la suite paso de 893 a 2289 tests en cinco semanas (de ~11 a ~25 min) y una tarea de una linea paga los 25; en ToolsaWeb cada finish paga 28 min de verificacion completa. Regla buscada: cada paso de una tarea cuesta en proporcion a lo que cambia la tarea, nunca al tamano del proyecto; lo que dependa del tamano del proyecto se paga una vez por version. Hay que descubrir exactamente que pasos poner o quitar para que el crecimiento del proyecto no afecte a la agilidad, sin perder la calidad que dan los tests (los de repos reales cazaron los CRITICOS de TASK-100 a TASK-108). Primera de la cola urgente para la 0.16.0, antes de TASK-121; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Datos de partida: docs/auditoria/AUDITORIA-METODO-2026-11-12.md y PASOS-PLUGIN-2026-11-12.md.
````

### Criterios de aceptacion

````
Un informe en docs/auditoria mide cada paso de una tarea (diseno, implementacion, verificacion, cada ronda de revision, cierre y contexto que leen los agentes) frente al tamano del proyecto (tests, ficheros, tareas cerradas) con datos de TaskCode, ToolsaWeb y OpenDockTrading, y marca cuales crecen con el proyecto (tabla con la tendencia de cada paso)
Cada paso que crece con el proyecto queda con su arreglo decidido con Carlos en el plan: pasa a depender solo de lo que cambia la tarea, se mueve a una vez por version, o se justifica por escrito
La verificacion de una tarea corre solo los tests de lo que cambia y la suite completa se corre una vez por version antes de publicar: en TaskCode, una tarea que toca un solo modulo verifica en menos de 2 min con mas de 2000 tests en la suite (medido)
Un listado reproducible da por fichero de test su duracion y cuantos procesos git lanza, y los 10 mas lentos quedan clasificados en necesita Git real o se puede probar sin Git; la regla de la piramide (logica sin Git, Git real solo en la capa de integracion) queda en docs/contexto/CONVENCIONES.md
taskctl metricas muestra el coste fijo por tarea (verificacion, revision y cierre) frente al numero de tareas cerradas del proyecto, para ver si crece (test con repo temporal)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````

## Como entregas

Escribe en `salida-brainstorm-arquitectura-1.md`, con estas secciones y en este orden:

- Enfoque propuesto, con rutas y nombres concretos
- Que se extiende y que se crea
- Limites que cruza
- La decision de diseño que mas te preocupa (UNA sola)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **riesgos**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
