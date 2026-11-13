# Peticion de brainstorm — TASK-115, rol riesgos (ronda 1)

- Tarea: TASK-115 — P-7: verificacion completa por lote de cierres en modo automatico
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-riesgos` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-riesgos-1.md`

## Tu pregunta

> ¿Por donde se rompe esto?

## Que miras

- Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.
- Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.
- Compatibilidad hacia atras con los datos y ficheros que YA existen.
- La vuelta atras: si esto sale mal, como se deshace y que queda inservible.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Que aserciones escribir (es del rol de testing).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
En ToolsaWeb cada finish corre la verificacion completa (28 min de mediana) aunque se cierren varias tareas seguidas en automatico. Una completa por lote, con vuelta atras si sale en rojo, cuesta 28 min por lote en vez de por tarea. Relaja cada integracion en verde: la forma concreta la decide Carlos en el plan. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-7)
````

### Criterios de aceptacion

````
Con la clave verificacion_por_lote activada, finish de una tarea con codigo integra sin la completa y anota la verificacion como pendiente de lote (test en repo temporal)
Un comando de taskctl corre una completa sobre la rama de integracion y la anota en todas las tareas pendientes de ese lote (test)
Si la completa del lote sale en rojo, el comando dice que tareas entraron desde la ultima completa en verde (test)
Sin la clave, finish y el guardian de merges se comportan como hoy (test de regresion)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````

## Como entregas

Escribe en `salida-brainstorm-riesgos-1.md`, con estas secciones y en este orden:

- Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno
- Estados intermedios y fallos parciales
- Compatibilidad hacia atras
- Vuelta atras
- El riesgo que mas te preocupa (UNO solo)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
