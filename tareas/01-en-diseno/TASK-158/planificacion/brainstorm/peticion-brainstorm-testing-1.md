# Peticion de brainstorm — TASK-158, rol testing (ronda 1)

- Tarea: TASK-158 — Regla 4D preventiva en todos los procesos que crean o actualizan codigo
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-25
- Rol: `brainstorm-testing` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-testing-1.md`

## Tu pregunta

> ¿Como se demuestra que esto funciona, y como envejece?

## Que miras

- Que es observable desde fuera, y contra que recurso real se comprueba.
- Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.
- Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.
- Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Por donde se rompe en produccion (es del rol de riesgos).
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

Escribe en `salida-brainstorm-testing-1.md`, con estas secciones y en este orden:

- Que es observable sin llamar a ningun agente
- Plan de pruebas, cada una con su mutacion
- Aserciones trampa que hay que evitar en esta tarea concreta
- Que pruebas existentes cambian de expectativa
- Como envejece

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
