# Peticion de brainstorm — TASK-093, rol arquitectura (ronda 1)

- Tarea: TASK-093 — finish reutiliza la completa en verde del mismo árbol, con entradas ignoradas declaradas
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-10
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
Que taskctl finish no repita la verificación completa cuando ya hay un verde del mismo árbol exacto. Hoy la corre siempre porque el memo (huella de git status) no ve los ficheros ignorados, y un proyecto puede depender de ellos (datos de prueba fuera de Git, node_modules). Medido en ToolsaWeb TASK-295 el 2026-11-10: completa de 27 min en verde a las 12:01 y otra idéntica lanzada por finish a las 12:03 sobre el mismo commit. Propuesta: una clave opcional (p. ej. entradas_ignoradas_verificacion: [exampleData/, web/node_modules/.package-lock.json]) cuyo listado (ruta, tamaño, mtime) entra en la huella del memo; con ella declarada, finish y el guardián reutilizan un verde de huella idéntica y lo dicen en la salida; sin ella, todo sigue como hoy.
````

### Criterios de aceptacion

````
Con la clave declarada y un verde guardado de huella idéntica, finish no ejecuta comando_verificacion y lo dice en su salida; un test de integración en un repo temporal lo comprueba
Cambiar un fichero de una ruta ignorada declarada, un fichero versionado, el comando o el timeout invalida el memo y finish vuelve a verificar (un test por caso)
Sin la clave, finish ejecuta siempre la completa como en 0.13 (test de regresión)
Una ruta declarada inexistente, absoluta o fuera del repo aborta la config con un error que nombra la clave y la línea
README, skills/task-workflow y CHANGELOG describen la clave, su motivo y el riesgo de no declarar una entrada ignorada
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningún test
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
