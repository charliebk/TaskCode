# Peticion de brainstorm — TASK-105, rol riesgos (ronda 1)

- Tarea: TASK-105 — Verificacion proporcional B2: decision entre refs y huella para el nivel 2
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
Segunda parte de TASK-096 (troceada por la regla de una hora, decision de Carlos 2026-11-11). Sobre la decision pura de TASK-096 (clave rutas_verificacion_parcial y resultado selectiva), decidirVerificacionEntre hace un segundo rutasDeTarea con los patrones documentacion + parcial solo si la base declara la clave y el diff no es solo documentacion; huellaDeCommit acepta un contexto opcional como huellaDelArbol; verificarConMemo no guarda el memo selectiva con el arbol sucio. Nada observable cambia todavia: finish y el guardian siguen tratando selectiva como completa. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).
````

### Criterios de aceptacion

````
Con la clave declarada en la base, decidirVerificacionEntre devuelve selectiva si todo lo que no es documentacion cae en rutas_verificacion_parcial y completa si algo queda fuera, cambia .taskcode/config.yml o el diff no se puede calcular (un test por caso, repo temporal)
Sin la clave no se lanza ningun git de mas y la decision es la de la 0.14.0 (test)
huellaDeCommit con contexto casa con la huella que guarda la selectiva para la misma base; el memo selectiva no se guarda con el arbol sucio (test por caso)
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
