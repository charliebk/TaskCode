# Peticion de brainstorm — TASK-138b, rol riesgos (ronda 1)

- Tarea: TASK-138b — decision de la puerta, constante muerta, textos del tope y doctor (parte b de TASK-138)
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-24
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
Parte b del troceo de TASK-138 (Regla 4D: duplicacion en metricas, suite y registro de puertas), partes TASK-138a, TASK-138b en la rama fix/task-138-regla-4d-duplicacion-en-metricas-suite-y.

La decision verde/rojo/omitido compartida por anotarFinish, review, anotarSuite y verificar-lote; PUERTAS_VERIFICACION usada o eliminada; textos del tope de rondas de una fuente; doctor lee las terminadas una vez.
````

### Criterios de aceptacion

````
anotarFinish, el bloque de review, anotarSuite y verificar-lote comparten la decision verde/rojo/omitido, y PUERTAS_VERIFICACION se usa en metricas o se elimina con su test
Los textos de las salidas del tope de rondas (siguiente, salidasTopeRondas, error de review) salen de una sola fuente y doctor lee las terminadas una vez
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
