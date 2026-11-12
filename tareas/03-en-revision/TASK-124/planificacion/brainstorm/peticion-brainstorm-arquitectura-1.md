# Peticion de brainstorm — TASK-124, rol arquitectura (ronda 1)

- Tarea: TASK-124 — Contexto con tamano maximo: lo que leen los agentes no crece con el proyecto
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-12
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
Sale de TASK-122 (docs/auditoria/ESCALA-2026-11-12.md): lo que leen los agentes en cada tarea crece con el proyecto. Desde la v0.1.1 el README del plugin paso de 22 a 102 KB, las skills de 92 a 189 KB y docs/contexto de 154 a 195 KB; CHECKLIST_TERMINACION.md pesa 83 KB y ESTADO.md llevaba 38 dias sin actualizarse cuando CLAUDE.md manda leerlo primero. Cada documento que se carga en cada tarea tiene que tener un tamano maximo, y lo cerrado se archiva fuera de lo que se lee. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12), en modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
CLAUDE.md, las skills de flujo y las revisoras tienen un tamano maximo en bytes con un test que falla si se supera
CHECKLIST_TERMINACION.md y ESTADO.md archivan lo cerrado en docs/contexto/archivo/ y lo vivo queda por debajo de 20 KB y 10 KB (comprobado con wc -c)
taskctl doctor avisa si ESTADO.md lleva mas de 14 dias sin actualizarse o va por detras de las tareas cerradas (test)
El README del plugin pasa la referencia detallada a ficheros aparte y queda por debajo de 40 KB, sin perder contenido (test que comprueba el tamano y los enlaces)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
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
