# Peticion de brainstorm — TASK-044, rol riesgos (ronda 1)

- Tarea: TASK-044 — F4-T3 Particion propuesta de las tareas grandes
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-04
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
Que, cuando `plan` rechaza una tarea por demasiado grande, deje hecha la
particion en vez de solo decir «partela» (auditoria del 2026-10-03, C3).
TASK-043 ya bloquea por encima de 12 criterios; falta proponer como partirla.
Caso real: TASK-030 tenia 18 criterios en dos frentes independientes (config
y auto-commit), agrupados bajo lineas en negrita (`**C4 — ...**`,
`**C2 — ...**`) mas un grupo `**Transversal**`; costo varias rondas de
revision con peticiones de 110-160 KB. Los frentes se reconocen por los
grupos de criterios (subtitulos `###` o lineas solo en negrita), no por
interpretar el texto.

La propuesta es un fichero que `taskctl import` acepta, escrito fuera del
repo (dentro ensuciaria el workspace y el guard de import abortaria).

Fuera de alcance: partir automaticamente sin grupos (eso lo decide una
persona).
````

### Criterios de aceptacion

````
Con mas de 12 criterios o varios frentes en el Objetivo, `plan` aborta y lo explica
Escribe un fichero de `import` fuera del repo con una tarea por frente y lo nombra en el error
Test con una tarea de dos frentes (el caso de TASK-030)
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
