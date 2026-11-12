# Peticion de brainstorm — TASK-123, rol riesgos (ronda 1)

- Tarea: TASK-123 — F-16: finish no cierra sin verificar tras un merge a mano o un conflicto
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-12
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
Hallazgo CRITICO de la auditoria del 2026-11-12, reproducido de punta a punta (docs/auditoria/AUDITORIA-METODO-2026-11-12.md, seccion 11): la via de reintento de finish (rama ya integrada en la de integracion) no ejecuta la puerta de verificacion, y el guardian de merges no ve el git commit que cierra un merge en curso. Caso A: merge a mano en develop con la verificacion en rojo y luego taskctl finish: cierra sin verificar. Caso B, el remedio que documenta la guia tras un conflicto: el guardian deja pasar el commit que cierra el merge y el reintento de finish cierra sin volver a verificar la resolucion. El metodo promete no integrar codigo sin verificacion en verde. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12), en modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Tras un merge a mano en develop con la verificacion en rojo, taskctl finish no cierra la tarea: verifica el arbol de la rama de integracion o aborta diciendo que falta (test con repo temporal, caso A)
Tras un conflicto en finish resuelto en develop, el reintento verifica la resolucion antes de cerrar o aborta (test con repo temporal, caso B)
El guardian de merges trata como merge un git commit con MERGE_HEAD presente sobre la rama de integracion o la principal, con los tres comandos del caso B (test)
La guia y los mensajes de finish proponen como remedio taskctl abort-merge, integrar la base en la rama de la tarea y relanzar finish desde ella (test sobre el texto)
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
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
