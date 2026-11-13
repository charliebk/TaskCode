# Peticion de brainstorm — TASK-125, rol riesgos (ronda 1)

- Tarea: TASK-125 — Freno Stop con presupuesto de tiempo y clave propia: si se pasa, anota y no bloquea
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
Medido en ToolsaWeb (153 tareas terminadas, taskctl metricas, 2026-11-12): la revision ha pasado del 51 % al 59-65 % del tiempo de cada tarea y el freno Stop ejecuta la selectiva al final de cada turno, hasta 26 min por turno en tareas del nucleo. Hoy el freno, las rondas de review y finish comparten comando_verificacion_selectiva y timeout_verificacion_selectiva (src/hooks/freno-stop.ts, src/commands/review.ts, src/commands/finish-verificacion.ts), asi que no se puede dar al freno un comando mas rapido sin abaratar tambien la verificacion de la ronda. Se busca que el freno tenga su propio comando rapido y un presupuesto de tiempo (por ejemplo 3 min): si lo supera, anota el exceso en el registro del freno y deja parar el turno en vez de bloquearlo; la seguridad la siguen dando review y finish. Toca freno-stop.ts y usa el registro de ejecuciones del freno: va despues de TASK-111. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Una clave nueva comando_verificacion_freno en .taskcode/config.yml la usa solo el freno Stop; review sigue con comando_verificacion_selectiva y finish con sus comandos, y sin la clave nueva el freno se comporta como hoy (test con repo temporal y test de regresion)
Una clave presupuesto_freno_s (180 por defecto cuando se declara comando_verificacion_freno; sin ninguna de las dos, sin tope propio como hoy) corta la verificacion que corra el freno al agotarse: el freno no bloquea, deja parar el turno con un aviso de una linea y anota resultado excedido en el registro de TASK-111 (test con un comando que tarda mas que el presupuesto)
Un rojo dentro del presupuesto sigue bloqueando el turno como hoy (test)
config.ts valida las dos claves (presupuesto entero positivo y no mayor que el timeout del hook Stop) y taskctl doctor muestra que comando corre cada puerta: freno, review y finish (test)
README, CHANGELOG y la skill task-workflow explican el reparto de claves por puerta
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
