# Peticion de brainstorm — TASK-104, rol riesgos (ronda 1)

- Tarea: TASK-104 — Verificacion proporcional A3b: las rondas de review no corren la suite si solo cambia documentacion
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
Segunda mitad de TASK-102 (troceada por la regla de una hora, decision de Carlos 2026-11-11). taskctl review usa la misma decision comun que el freno Stop (peticionDeTrabajo de TASK-102) sobre base...HEAD, nunca sobre el diff de la ronda: si solo cambia documentacion no corre la verificacion selectiva; con comando_verificacion_selectiva y comando de documentacion declarados corre el de documentacion; sin selectiva no corre nada (decision de Carlos: no aparece una ejecucion donde la 0.14.0 no la tenia). La comprobacion se ejecuta antes de escribir la peticion, con el mismo patron que verificacionSelectivaDeRonda. Plan de partida: tareas/01-en-diseno/TASK-102/planificacion/plan-final.md (paso 5).
````

### Criterios de aceptacion

````
Una ronda de review de solo documentacion con comando_verificacion_selectiva y comando de documentacion declarados corre el de documentacion y no la selectiva; sin selectiva declarada no corre nada (test por cada uno, repo temporal)
Un fichero de codigo en base...HEAD hace que review aplique la verificacion de siempre, tambien en una ronda incremental cuyo delta solo toca documentacion (test)
Stop y review dan la misma decision para el mismo diff (test)
Sin la configuracion nueva review se comporta exactamente como en la 0.14.0 (test de regresion)
verificacion-selectiva.md, README y CHANGELOG explican el comportamiento de Stop y review, como cambio de comportamiento para quien ya declaro rutas_documentacion
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
