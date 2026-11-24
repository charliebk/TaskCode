# Peticion de brainstorm — TASK-145, rol riesgos (ronda 1)

- Tarea: TASK-145 — Regla 4D: duplicacion en las puertas de finish
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-24
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
Unificar lo copiado dentro de finish y sus puertas (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD1-02 a CMD1-07, CMD1-12 a CMD1-15 y FS-09).
````

### Criterios de aceptacion

````
finish-verificacion, finish-heldout y doctor usan gitTexto (con timeout y entorno) en vez de sus copias; configBase y configDe son una sola funcion
Las puertas pesada, completa y de documentacion comparten el bloque ejecutar-anotar-arbol limpio-memo, y puertaReintento usa opcionesEjecucion
La base de la rama de la tarea se decide una vez en finish, comprobarTagDeReintento sin copia, y los textos repetidos y la regex que quita [ERROR] salen de una sola fuente
Sin comentarios huerfanos ni obsoletos en approve, finish, finish-verificacion y codex-review
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
