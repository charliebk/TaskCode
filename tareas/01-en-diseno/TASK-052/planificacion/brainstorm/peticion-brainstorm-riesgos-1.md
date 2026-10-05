# Peticion de brainstorm — TASK-052, rol riesgos (ronda 1)

- Tarea: TASK-052 — F6-T5 Telemetria de fases y heuristica recalibrada
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-05
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
Hoy saber cuanto tardo cada fase de una tarea exige reconstruirlo a mano
desde los mensajes de commit, y la heuristica de complejidad no ha acertado
nunca su senal de riesgo (auditoria B8, C5). Cada transicion escribira su
marca de tiempo en el frontmatter, `taskctl metricas` sacara la tabla de
fases por tarea, y la heuristica se recalibra con las tareas cerradas
usando las rondas de revision como coste real, quitando de la config las
claves que nada lee (`tolerancia_*`, `modelo_consulta_discrepancia`).
````

### Criterios de aceptacion

````
Cada transicion escribe su marca de tiempo en el frontmatter y `taskctl metricas` saca la tabla de fases por tarea
Heuristica recalibrada con las tareas cerradas usando las rondas como coste real; se quitan `tolerancia_*` y `modelo_consulta_discrepancia`
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
