# Peticion de brainstorm — TASK-115, rol testing (ronda 1)

- Tarea: TASK-115 — P-7: verificacion completa por lote de cierres en modo automatico
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-testing` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-testing-1.md`

## Tu pregunta

> ¿Como se demuestra que esto funciona, y como envejece?

## Que miras

- Que es observable desde fuera, y contra que recurso real se comprueba.
- Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.
- Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.
- Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Por donde se rompe en produccion (es del rol de riesgos).
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

Escribe en `salida-brainstorm-testing-1.md`, con estas secciones y en este orden:

- Que es observable sin llamar a ningun agente
- Plan de pruebas, cada una con su mutacion
- Aserciones trampa que hay que evitar en esta tarea concreta
- Que pruebas existentes cambian de expectativa
- Como envejece

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
