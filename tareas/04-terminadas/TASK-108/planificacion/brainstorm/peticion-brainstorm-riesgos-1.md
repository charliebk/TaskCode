# Peticion de brainstorm — TASK-108, rol riesgos (ronda 1)

- Tarea: TASK-108 — Verificacion proporcional B5: el guardian de merges ante el nivel 2
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-11
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
Quinta parte de TASK-096. Decision de Carlos (D1, 2026-11-11): el guardian de merges NO acepta el verde de la selectiva para codigo; con codigo exige la completa aunque finish haya integrado con la selectiva (lado seguro: los CRITICOS de TASK-101 salieron del punto debil de comandoSoloIntegra). Se fija con tests y se mejora el mensaje cuando un merge a mano queda bloqueado (por ejemplo, tras un conflicto en un finish de nivel 2, o porque develop avanzo y la huella ya no casa). Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).
````

### Criterios de aceptacion

````
Con rutas_verificacion_parcial declarada: el guardian deja pasar el merge de una tarea sin codigo con el verde de su verificacion de documentacion y bloquea el de una con codigo sin verde de la completa aunque exista el memo de la selectiva (un test por caso, repo temporal)
El guardian decide con la config del destino, no con la del arbol (test)
El mensaje de bloqueo de un merge con codigo dice que hace falta la completa y como obtenerla (test sobre el texto)
Sin la clave nueva el guardian se comporta como en la 0.14.0 (test de regresion)
La suite completa pasa en verde (npm test) sin debilitar ningun test
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
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
