# Peticion de brainstorm — TASK-083, rol arquitectura (ronda 1)

- Tarea: TASK-083 — Cierre sin ronda 2 completa cuando solo quedan MENORES
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-07
- Rol: `brainstorm-arquitectura` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-arquitectura-1.md`

## Tu pregunta

> Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?

## Que miras

- Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.
- Que se crea nuevo, que se extiende y en que orden se construye.
- Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.
- El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Como se prueba (es del rol de testing).
- Por donde se rompe (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Muchas segundas rondas probablemente solo verifican MENORES. Primero confirmarlo con los veredictos de ToolsaWeb; si se confirma, cuando la ronda 1 no deja CRITICOS ni IMPORTANTES, verificar las correcciones con el diff de las correcciones en vez de otra revision completa.
````

### Criterios de aceptacion

````
Queda medido en docs/METRICAS.md cuantas rondas 2 de ToolsaWeb y TaskCode tenian solo MENORES abiertos tras la ronda 1
Si la medida lo justifica, taskctl review ofrece una verificacion acotada al diff de las correcciones cuando la ronda anterior solo dejo MENORES, y lo cubren tests con repos Git temporales
Un CRITICO o IMPORTANTE abierto obliga siempre a la ronda completa; lo cubre un test
npm test en verde (salvo los tres rojos conocidos de Windows)
````

## Como entregas

Escribe en `salida-brainstorm-arquitectura-1.md`, con estas secciones y en este orden:

- Enfoque propuesto, con rutas y nombres concretos
- Que se extiende y que se crea
- Limites que cruza
- La decision de diseño que mas te preocupa (UNA sola)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
