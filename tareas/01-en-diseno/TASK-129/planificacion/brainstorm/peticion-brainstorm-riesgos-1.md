# Peticion de brainstorm — TASK-129, rol riesgos (ronda 1)

- Tarea: TASK-129 — Freno al crecimiento de la suite: presupuesto de tests por criterio, pesados marcados y aviso de crecimiento
- Tipo: feature · Complejidad declarada: media
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
Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y la revision ha pasado del 51 % al 59-65 % del tiempo de cada tarea; cada ronda anade tests (unos 1130 MENORES y 350 IMPORTANTES en 153 tareas) y la suite solo crece. Nada en el plan ni en las skills limita cuantos tests se escriben por criterio, los de rendimiento y escala corren con los demas y nadie avisa de que la suite crece o tarda mas. Se busca un presupuesto de tests por criterio en el plan y en la skill, que los tests de rendimiento y escala se marquen como pesados (los que TASK-126 solo corre en release/*) y que doctor y metricas avisen del crecimiento de la suite y de su duracion. Va despues de TASK-126 y de TASK-128, de cuyo registro sale la duracion de la completa. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
La plantilla de plan-final.md y la skill plan piden por cada criterio cuantos tests nuevos preve, con un presupuesto por defecto (por ejemplo 1 a 3) y el motivo si lo supera; la skill review trata como MENOR un test que duplica a otro ya existente (test sobre la plantilla y las skills)
Las skills plan y task-workflow explican como marcar un test de rendimiento o escala como pesado en Node, Rust, Java y .NET, y que corre solo con comando_verificacion_pesada (test que comprueba el texto)
taskctl metricas muestra, por version, el numero de tests y la duracion de la completa a partir del registro de verificaciones de TASK-128, y doctor avisa si cualquiera crecio mas de un umbral configurable (20 % por defecto) desde la version anterior (test con repo temporal)
Sin datos de duracion o de numero de tests, doctor y metricas no avisan ni fallan (test)
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
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **testing**, **dominio**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
