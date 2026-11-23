# Peticion de brainstorm — TASK-148b, rol riesgos (ronda 1)

- Tarea: TASK-148b — validacion de config (parte b de TASK-148)
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-23
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
Parte b del troceo de TASK-148 (Regla 4D: catalogos, config y utilidades en core), partes TASK-148a, TASK-148b, TASK-148c, TASK-148d en la rama fix/task-148-regla-4d-catalogos-config-y-utilidades-e.

masParecida, validadores de entero y de enumerado, CLAVES_CONFIG atada al switch, una ruta relativa (CORE1-06, CORE1-07, CORE1-08, CORE1-10).
````

### Criterios de aceptacion

````
config usa masParecida para sugerir, un validador de entero en rango y otro de lista de enumerado; un test falla si CLAVES_CONFIG y el switch de claves no coinciden; SKILL_KEY_RE se deriva de los campos
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
