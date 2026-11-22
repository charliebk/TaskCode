# Peticion de brainstorm — TASK-137, rol riesgos (ronda 1)

- Tarea: TASK-137 — Regla 4D: sin duplicacion, desviacion, diluvio ni disfraz de codigo
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-22
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
El plugin asegura que implementadores y revisores no producen codigo 4D (pedido de Carlos, 2026-11-22): 1) Duplicacion: dos funciones o clases que hacen lo mismo con pequenas diferencias; se reutiliza y generaliza (POO, herencia o composicion como eje). 2) Desviacion: se sale del objetivo de la tarea; si hay que cambiar la expectativa se bifurca una tarea nueva o se propone el cambio sin salir del objetivo. 3) Diluvio: avalanchas de lineas y clases donde bastan pocas lineas eficientes. 4) Disfraz: premisas de caso resuelto que no hacen nada o no se comprueban (tests que no prueban, stubs que aparentan). Se sospecha que ya ocurre en TaskCode 0.16.
````

### Criterios de aceptacion

````
skills/task-workflow/revision.md y las skills revisoras (code-quality-reviewer y las de dominio) describen las 4D con un ejemplo de cada una y clasifican como IMPORTANTE la duplicacion y el disfraz reales
La plantilla del informe de revision lleva una seccion '## Regla 4D' con una linea por D (cumple o ID del hallazgo) y taskctl finish avisa si falta o esta vacia, con un test que lo comprueba
La skill de implementacion (start) exige antes de pedir revision: buscar el helper existente antes de crear uno, citar el criterio que motiva cada cambio y comprobar por mutacion cada test nuevo; queda anotado en '## Autorrevision'
Auditoria de las 10 ultimas tareas terminadas de este repo: docs/auditoria-4d.md lista cada caso 4D encontrado con fichero:linea y la tarea de seguimiento que lo corrige
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
