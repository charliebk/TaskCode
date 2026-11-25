# Peticion de brainstorm — TASK-158, rol riesgos (ronda 1)

- Tarea: TASK-158 — Regla 4D preventiva en todos los procesos que crean o actualizan codigo
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-25
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
Que la Regla 4D (sin duplicacion, desviacion, diluvio ni disfraz) se aplique al escribir codigo y no solo al auditarlo: cada camino del plugin que crea o modifica codigo (plan, implementacion tras start, correcciones de cada ronda, verificar-menores, hotfix y release, agentes del brainstorm, doctor-deploy y skills revisoras) la exige y la comprueba. Decision de Carlos: requisito para publicar la 0.19.0.
````

### Criterios de aceptacion

````
Hay un inventario en la tarea de cada camino que crea o actualiza codigo, con que exige hoy de 4D y que le falta
Cada camino del inventario exige 4D al escribir (instruccion en su skill o agente, y comprobacion de taskctl donde la haya), cerrando los huecos que TASK-153 no cubrio
Las correcciones de una ronda de revision y los MENORES corregidos pasan por la misma exigencia 4D que la implementacion (autorrevision 4D por ronda y por correccion)
Un test por camino falla si ese camino deja de exigir 4D
verificar-impacto no devuelve la copia de dist/src si HEAD cambio durante la ejecucion (carrera del freno con update-fix vista en TASK-145b)
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
